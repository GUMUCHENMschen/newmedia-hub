import Taro from '@tarojs/taro'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase 配置
 *
 * 使用方式：
 * 1. 在项目根目录创建 .env 文件（不要提交到 git）
 * 2. 填入以下内容：
 *    TARO_APP_SUPABASE_URL=https://xxxx.supabase.co
 *    TARO_APP_SUPABASE_ANON_KEY=eyJhbGciOi...
 * 3. 重新编译 H5
 *
 * 如果未配置，系统会自动回退到本地存储模式（单设备使用）。
 */

const SUPABASE_URL = (process.env.TARO_APP_SUPABASE_URL as string) || ''
const SUPABASE_ANON_KEY = (process.env.TARO_APP_SUPABASE_ANON_KEY as string) || ''

let client: SupabaseClient | null = null

/** 判断是否已配置 Supabase */
export function isSupabaseConfigured(): boolean {
  return !!SUPABASE_URL && !!SUPABASE_ANON_KEY
}

/** 获取 Supabase 客户端（未配置时返回 null） */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true }
    })
  }
  return client
}

/** 数据表名称映射 */
export const TABLES = {
  members: 'nxmc_members',
  projects: 'nxmc_projects',
  tasks: 'nxmc_tasks',
  events: 'nxmc_events',
  assets: 'nxmc_assets',
  messages: 'nxmc_messages',
  courses: 'nxmc_courses'
} as const

export type TableName = typeof TABLES[keyof typeof TABLES]

/**
 * 从云端拉取某张表的全部数据
 * 失败时返回 null，由调用方决定是否使用本地数据
 */
export async function fetchTable<T = any>(table: TableName): Promise<T[] | null> {
  const sb = getSupabase()
  if (!sb) return null
  try {
    const { data, error } = await sb.from(table).select('*')
    if (error) {
      console.warn(`[Supabase] 拉取 ${table} 失败:`, error.message)
      return null
    }
    return (data || []) as T[]
  } catch (e) {
    console.warn(`[Supabase] 拉取 ${table} 异常:`, e)
    return null
  }
}

/**
 * 向云端写入（upsert）某张表的全部数据
 * 注意：Supabase upsert 需要主键冲突更新，这里按 id 字段
 */
export async function upsertTable<T extends { id: string }>(table: TableName, items: T[]): Promise<boolean> {
  const sb = getSupabase()
  if (!sb || items.length === 0) return false
  try {
    const { error } = await sb.from(table).upsert(items, { onConflict: 'id' })
    if (error) {
      console.warn(`[Supabase] 写入 ${table} 失败:`, error.message)
      return false
    }
    return true
  } catch (e) {
    console.warn(`[Supabase] 写入 ${table} 异常:`, e)
    return false
  }
}

/**
 * 删除云端某条记录
 */
export async function deleteFromTable(table: TableName, id: string): Promise<boolean> {
  const sb = getSupabase()
  if (!sb) return false
  try {
    const { error } = await sb.from(table).delete().eq('id', id)
    if (error) {
      console.warn(`[Supabase] 删除 ${table} 失败:`, error.message)
      return false
    }
    return true
  } catch (e) {
    console.warn(`[Supabase] 删除 ${table} 异常:`, e)
    return false
  }
}

/**
 * 从云端全量拉取所有表，写入本地缓存
 * 返回成功拉取的表名列表
 */
export async function syncAllFromCloud(): Promise<string[]> {
  if (!isSupabaseConfigured()) return []
  const results: string[] = []
  const tables = Object.values(TABLES)
  for (const table of tables) {
    const data = await fetchTable(table)
    if (data) {
      try {
        Taro.setStorageSync(table, data)
        results.push(table)
      } catch (e) {
        console.warn(`[Supabase] 本地缓存 ${table} 失败:`, e)
      }
    }
  }
  console.log(`[Supabase] 云端同步完成，共拉取 ${results.length}/${tables.length} 张表`)
  return results
}
