import Taro from '@tarojs/taro'
import { getMembers, loginByPhone, Member } from './index'

/**
 * 钉钉 H5 免登工具
 *
 * 工作流程：
 * 1. 检测是否运行在钉钉客户端内
 * 2. 动态加载钉钉 JSAPI
 * 3. 调用 dd.runtime.permission.requestAuthCode 获取免登授权码
 * 4. 将授权码发送到后端（Supabase Edge Function）换取用户信息
 * 5. 用用户手机号匹配系统成员，自动登录
 *
 * 需要用户配置（通过 .env）：
 *   TARO_APP_DINGTALK_CORPID=钉钉企业 CorpId
 *   TARO_APP_DINGTALK_LOGIN_API=后端换 token 的接口地址（Supabase Edge Function URL）
 */

const DINGTALK_CORPID = (process.env.TARO_APP_DINGTALK_CORPID as string) || ''
const DINGTALK_LOGIN_API = (process.env.TARO_APP_DINGTALK_LOGIN_API as string) || ''

/** 判断是否在钉钉客户端内 */
export function isInDingTalk(): boolean {
  if (typeof navigator === 'undefined') return false
  return /DingTalk/i.test(navigator.userAgent)
}

/** 是否已配置钉钉免登所需参数 */
export function isDingTalkConfigured(): boolean {
  return !!DINGTALK_CORPID && !!DINGTALK_LOGIN_API
}

/** 动态加载钉钉 JSAPI */
function loadDingTalkSDK(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('非浏览器环境'))
      return
    }
    const win = window as any
    if (win.dd) {
      resolve(win.dd)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://g.alicdn.com/dingding/dingtalk-jsapi/3.0.25/dingtalk.open.js'
    script.onload = () => {
      if (win.dd) resolve(win.dd)
      else reject(new Error('钉钉 JSAPI 加载失败'))
    }
    script.onerror = () => reject(new Error('钉钉 JSAPI 加载失败'))
    document.head.appendChild(script)
  })
}

/** 获取钉钉免登授权码 */
function requestAuthCode(dd: any, corpId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    dd.runtime.permission.requestAuthCode({
      corpId,
      onSuccess: (result: { code: string }) => resolve(result.code),
      onFail: (err: any) => reject(new Error(err?.errorMessage || '获取授权码失败'))
    })
  })
}

/** 调用后端接口，用 authCode 换取钉钉用户信息 */
async function fetchDingTalkUserInfo(code: string): Promise<{ name?: string; mobile?: string; userid?: string }> {
  const resp = await fetch(`${DINGTALK_LOGIN_API}?code=${encodeURIComponent(code)}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  })
  if (!resp.ok) throw new Error(`后端接口返回 ${resp.status}`)
  const data = await resp.json()
  if (data.errcode && data.errcode !== 0) {
    throw new Error(data.errmsg || '换取用户信息失败')
  }
  return data.result || data
}

/**
 * 尝试钉钉免登
 * - 不在钉钉内 → 返回 null（走手机号登录）
 * - 在钉钉内但未配置 → 返回 null
 * - 免登成功 → 返回匹配到的成员
 * - 免登失败 → 抛出错误，由调用方提示
 */
export async function tryDingTalkLogin(): Promise<Member | null> {
  if (!isInDingTalk()) return null
  if (!isDingTalkConfigured()) return null

  const dd = await loadDingTalkSDK()
  const code = await requestAuthCode(dd, DINGTALK_CORPID)
  const userInfo = await fetchDingTalkUserInfo(code)

  // 用手机号匹配成员
  if (userInfo.mobile) {
    const result = loginByPhone(userInfo.mobile)
    if (result.ok && result.member) return result.member
    throw new Error(`钉钉账号（${userInfo.mobile}）尚未登记，请联系主任或部长加入白名单。`)
  }

  // 没有手机号时，用姓名匹配（兜底）
  if (userInfo.name) {
    const member = getMembers().find(m => m.name === userInfo.name)
    if (member && member.status === 'active') {
      Taro.setStorageSync('nxmc_current_member', member.id)
      return member
    }
    throw new Error(`钉钉账号（${userInfo.name}）尚未登记，请联系主任或部长加入白名单。`)
  }

  throw new Error('未能获取钉钉用户信息，请稍后重试。')
}
