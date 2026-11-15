import { Button, Image, Input, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useState } from 'react'
import departmentLogo from '../../assets/branding/department-logo.png'
import schoolLogo from '../../assets/branding/school-logo.png'
import { initCloudSync, loginByPhone, ORGANIZATION_NAME } from '../../data'
import { isInDingTalk, isDingTalkConfigured, tryDingTalkLogin } from '../../data/dingtalk'
import './index.scss'

export default function Login() {
  const [phone, setPhone] = useState('')
  const [dingLogging, setDingLogging] = useState(false)

  useEffect(() => {
    // 启动时从云端拉取数据
    void initCloudSync()
    // 在钉钉内自动尝试免登
    if (isInDingTalk() && isDingTalkConfigured()) {
      setDingLogging(true)
      tryDingTalkLogin()
        .then(member => {
          if (member) {
            Taro.showToast({ title: `欢迎，${member.name}`, icon: 'success' })
            Taro.reLaunch({ url: '/pages/index/index' })
          }
        })
        .catch(err => {
          Taro.showModal({ title: '钉钉登录失败', content: err.message, showCancel: false, confirmColor: '#173f35' })
        })
        .finally(() => setDingLogging(false))
    }
  }, [])

  const submit = () => {
    if (!/^1\d{10}$/.test(phone)) {
      Taro.showToast({ title: '请输入 11 位手机号', icon: 'none' })
      return
    }
    const result = loginByPhone(phone)
    if (!result.ok) {
      Taro.showModal({ title: '暂时无法登录', content: result.message, showCancel: false, confirmColor: '#173f35' })
      return
    }
    Taro.reLaunch({ url: '/pages/index/index' })
  }

  const handleDingTalkLogin = () => {
    if (!isInDingTalk()) {
      Taro.showModal({ title: '请在钉钉中打开', content: '钉钉登录需要在钉钉客户端内打开本应用。', showCancel: false, confirmColor: '#173f35' })
      return
    }
    if (!isDingTalkConfigured()) {
      Taro.showModal({ title: '钉钉登录未配置', content: '请先配置钉钉 CorpId 和登录接口地址。', showCancel: false, confirmColor: '#173f35' })
      return
    }
    setDingLogging(true)
    tryDingTalkLogin()
      .then(member => {
        if (member) {
          Taro.showToast({ title: `欢迎，${member.name}`, icon: 'success' })
          Taro.reLaunch({ url: '/pages/index/index' })
        }
      })
      .catch(err => {
        Taro.showModal({ title: '钉钉登录失败', content: err.message, showCancel: false, confirmColor: '#173f35' })
      })
      .finally(() => setDingLogging(false))
  }

  return (
    <View className='login-page'>
      <View className='login-hero'>
        <View className='login-hero__brands'>
          <View className='login-hero__brand login-hero__brand--school'><Image className='login-hero__brand-image' src={schoolLogo} mode='aspectFit' /></View>
          <View className='login-hero__brand login-hero__brand--department'><Image className='login-hero__brand-image' src={departmentLogo} mode='aspectFit' /></View>
        </View>
        <Text className='login-hero__eyebrow'>NEWMEDIA HUB</Text>
        <Text className='login-hero__title'>新媒协同</Text>
        <Text className='login-hero__org'>{ORGANIZATION_NAME}</Text>
        <Text className='login-hero__slogan'>一个项目，让四个部门清清楚楚地协作</Text>
      </View>

      <View className='login-panel'>
        {isInDingTalk() && (
          <Button className='primary-button login-dingtalk' loading={dingLogging} onClick={handleDingTalkLogin}>
            {dingLogging ? '正在钉钉登录…' : '钉钉一键登录'}
          </Button>
        )}

        <Text className='login-panel__title'>成员手机号登录</Text>
        <Text className='login-panel__note'>仅已邀请且审核通过的手机号可进入</Text>
        <View className='login-input'>
          <Text className='login-input__prefix'>+86</Text>
          <Input type='number' maxlength={11} value={phone} onInput={event => setPhone(event.detail.value)} placeholder='请输入手机号' placeholderClass='form-placeholder' />
        </View>
        <Button className='primary-button login-submit' onClick={submit}>进入工作台</Button>

        <View className='login-divider'><Text>内部成员白名单</Text></View>
        <View className='demo-notice'>未登记或待审核手机号无法进入。在钉钉中打开可一键免登，无需输入手机号。</View>
      </View>
    </View>
  )
}
