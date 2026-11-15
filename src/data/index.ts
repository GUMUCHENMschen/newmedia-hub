import Taro from '@tarojs/taro'
import { isSupabaseConfigured, upsertTable, deleteFromTable, syncAllFromCloud, TABLES, TableName } from './supabase'

export const ORGANIZATION_NAME = '宁夏理工学院新媒体中心'
export const SCHOOL_CAS_URL = 'https://cas.nist.edu.cn/token/login'
export const OFFICIAL_ACCOUNTS = ['微信公众号：宁夏理工学院新青年', '抖音号：宁夏理工学院']
export const DEPARTMENTS = ['摄影部', '视频部', '编辑部', '技术部'] as const

export type Department = typeof DEPARTMENTS[number]
export type Role = '主任' | '部长' | '部员'
export type MemberStatus = 'active' | 'pending'
export type AssetScope = 'project' | 'shared' | 'department'
export type StatusType = 'pending' | 'progress' | 'scheduled' | 'draft' | 'done' | 'returned'
export type GroupKey = 'all' | Department

export interface Member {
  id: string
  name: string
  phone: string
  role: Role
  department: Department | '中心'
  college: string
  major: string
  className: string
  accent: string
  status: MemberStatus
  invitedById?: string
  invitedByPhone?: string
  invitedAt?: string
}

export interface InviteInput {
  name: string
  phone: string
  role: Role
  department: Department | '中心'
  college: string
  major: string
  className: string
}

export interface MemberActionResult {
  ok: boolean
  message: string
  member?: Member
}

export interface ProjectItem {
  id: string
  title: string
  channel: string
  format: string
  status: StatusType
  statusLabel: string
  time: string
  owner: string
  department: Department
  dayOffset: number
  accent: string
  summary: string
  location: string
  progress: number
}

export interface TaskItem {
  id: string
  projectId: string
  title: string
  project: string
  ownerId: string
  owner: string
  department: Department
  due: string
  priority: '高' | '中' | '低'
  progress: number
  done: boolean
  accent: string
  deliverable: string
}

export interface EventItem {
  id: string
  projectId?: string
  title: string
  time: string
  dayOffset: number
  location: string
  owner: string
  type: string
  accent: string
}

export interface AssetItem {
  id: string
  projectId: string
  project: string
  name: string
  category: string
  size: string
  owner: string
  updated: string
  accent: string
  scope?: AssetScope
  department?: Department
  filePath?: string
  fileUrl?: string
  localOnly?: boolean
}

export interface GroupMessage {
  id: string
  group: GroupKey
  senderId: string
  sender: string
  content: string
  time: string
}

export interface CourseItem {
  id: string
  day: number
  period: string
  name: string
  room: string
  teacher: string
  weeks: string
}

const defaultMembers: Member[] = [
  { id: 'm01', name: '熊宏兴', phone: '18997077529', role: '主任', department: '中心', college: '电气信息工程学院', major: '电气工程及其自动化', className: '电自24105班', accent: 'coral', status: 'active' },
  { id: 'm04', name: '周予', phone: '13800000004', role: '部长', department: '编辑部', college: '文学与艺术学院', major: '汉语言文学', className: '2024级1班', accent: 'green', status: 'active' },
  { id: 'm05', name: '陈曦', phone: '13800000005', role: '部长', department: '摄影部', college: '文学与艺术学院', major: '视觉传达设计', className: '2024级2班', accent: 'coral', status: 'active' },
  { id: 'm06', name: '赵可', phone: '13800000006', role: '部长', department: '视频部', college: '计算机科学与工程学院', major: '数字媒体技术', className: '2024级1班', accent: 'blue', status: 'active' },
  { id: 'm07', name: '贺兰', phone: '13800000007', role: '部长', department: '技术部', college: '计算机科学与工程学院', major: '计算机科学与技术', className: '2024级2班', accent: 'purple', status: 'active' },
  { id: 'm08', name: '孙宁', phone: '13800000008', role: '部员', department: '摄影部', college: '经济管理学院', major: '会计学', className: '2025级1班', accent: 'coral', status: 'active' },
  { id: 'm09', name: '马川', phone: '13800000009', role: '部员', department: '视频部', college: '机械工程学院', major: '智能制造工程', className: '2025级1班', accent: 'blue', status: 'active' },
  { id: 'm10', name: '王雨', phone: '13800000010', role: '部员', department: '编辑部', college: '文学与艺术学院', major: '网络与新媒体', className: '2025级1班', accent: 'green', status: 'active' },
  { id: 'm11', name: '刘星', phone: '13800000011', role: '部员', department: '技术部', college: '建筑与环境学院', major: '环境设计', className: '2025级1班', accent: 'purple', status: 'active' }
]

const defaultProjects: ProjectItem[] = [
  { id: 'p-sports', title: '秋季校园运动会全媒体报道', channel: '公众号 + 抖音', format: '图文 / 短视频', status: 'progress', statusLabel: '协作中', time: '今天 18:00', owner: '周予', department: '编辑部', dayOffset: 0, accent: 'green', summary: '围绕赛场人物与精彩瞬间，完成现场拍摄、公众号推文和抖音宣传片。', location: '东校区田径场', progress: 62 },
  { id: 'p-postgraduate', title: '考研倒计时主题海报', channel: '微信公众号：宁夏理工学院新青年', format: '海报', status: 'pending', statusLabel: '待审核', time: '明天 10:00', owner: '贺兰', department: '技术部', dayOffset: 1, accent: 'purple', summary: '设计考研倒计时系列海报，统一尺寸、文案与学校视觉规范。', location: '线上协作', progress: 85 },
  { id: 'p-welcome', title: '新生入学教育宣传片', channel: '抖音号：宁夏理工学院', format: '短视频', status: 'scheduled', statusLabel: '待发布', time: '11月18日 12:00', owner: '赵可', department: '视频部', dayOffset: 3, accent: 'blue', summary: '整理迎新素材并完成 60 秒宣传片，审核通过后发布抖音。', location: '大学生活动中心', progress: 100 },
  { id: 'p-volunteer', title: '冬日暖阳志愿服务报道', channel: '公众号 + 抖音', format: '图文 / 海报', status: 'draft', statusLabel: '待分工', time: '11月20日 18:00', owner: '熊宏兴', department: '编辑部', dayOffset: 5, accent: 'coral', summary: '记录志愿服务过程，提前确认采访对象、拍摄分工和交付时间。', location: '星海社区', progress: 15 }
]

const defaultTasks: TaskItem[] = [
  { id: 't01', projectId: 'p-sports', title: '确认推文事实、图片版权并提交终审', project: '秋季校园运动会全媒体报道', ownerId: 'm01', owner: '熊宏兴', department: '编辑部', due: '今天 16:30', priority: '高', progress: 60, done: false, accent: 'green', deliverable: '终审意见与发布确认' },
  { id: 't02', projectId: 'p-sports', title: '整理赛场精选照片并登记到项目素材', project: '秋季校园运动会全媒体报道', ownerId: 'm08', owner: '孙宁', department: '摄影部', due: '今天 14:00', priority: '高', progress: 75, done: false, accent: 'coral', deliverable: '20 张精修 JPG 照片' },
  { id: 't03', projectId: 'p-sports', title: '完成推文排版并提交主任审核', project: '秋季校园运动会全媒体报道', ownerId: 'm10', owner: '王雨', department: '编辑部', due: '今天 16:00', priority: '高', progress: 70, done: false, accent: 'green', deliverable: '公众号推文预览链接' },
  { id: 't04', projectId: 'p-sports', title: '汇总视频素材并剪辑 60 秒宣传片', project: '秋季校园运动会全媒体报道', ownerId: 'm09', owner: '马川', department: '视频部', due: '明天 12:00', priority: '中', progress: 40, done: false, accent: 'blue', deliverable: '宣传片初剪与素材目录' },
  { id: 't05', projectId: 'p-postgraduate', title: '制作考研倒计时主视觉海报', project: '考研倒计时主题海报', ownerId: 'm11', owner: '刘星', department: '技术部', due: '今天 20:00', priority: '中', progress: 85, done: false, accent: 'purple', deliverable: '竖版海报与可编辑源文件' },
  { id: 't06', projectId: 'p-welcome', title: '核对宣传片字幕与发布文案', project: '新生入学教育宣传片', ownerId: 'm06', owner: '赵可', department: '视频部', due: '11月17日', priority: '低', progress: 100, done: true, accent: 'blue', deliverable: '终审视频与发布文案' },
  { id: 't07', projectId: 'p-volunteer', title: '与部长协商时间并确认拍摄人员', project: '冬日暖阳志愿服务报道', ownerId: 'm05', owner: '陈曦', department: '摄影部', due: '11月18日', priority: '中', progress: 20, done: false, accent: 'coral', deliverable: '拍摄分工与设备清单' }
]

const defaultEvents: EventItem[] = [
  { id: 'e01', projectId: 'p-sports', title: '运动会现场拍摄与采访', time: '13:30—16:00', dayOffset: 0, location: '东校区田径场', owner: '陈曦 · 赵可', type: '拍摄', accent: 'coral' },
  { id: 'e02', projectId: 'p-sports', title: '运动会推文终审', time: '16:30—17:00', dayOffset: 0, location: '线上协作', owner: '熊宏兴 · 周予', type: '审核', accent: 'green' },
  { id: 'e03', projectId: 'p-postgraduate', title: '考研海报部门内审', time: '19:30—20:00', dayOffset: 0, location: '技术部工作群', owner: '贺兰 · 刘星', type: '审核', accent: 'purple' },
  { id: 'e04', projectId: 'p-volunteer', title: '志愿服务拍摄分工沟通', time: '20:00—20:30', dayOffset: 1, location: '线上协作', owner: '熊宏兴 · 各部门部长', type: '沟通', accent: 'blue' }
]

const defaultAssets: AssetItem[] = [
  { id: 'a01', projectId: 'p-sports', project: '秋季校园运动会全媒体报道', name: '运动会_百米冲刺_精选01.jpg', category: '图片', size: '8.4 MB', owner: '孙宁', updated: '今天 11:24', accent: 'coral', scope: 'project' },
  { id: 'a02', projectId: 'p-sports', project: '秋季校园运动会全媒体报道', name: '运动会_开幕式_主机位.mp4', category: '视频', size: '186 MB', owner: '马川', updated: '今天 10:18', accent: 'blue', scope: 'project' },
  { id: 'a03', projectId: 'p-sports', project: '秋季校园运动会全媒体报道', name: '运动会_运动员采访.m4a', category: '音频', size: '24.6 MB', owner: '王雨', updated: '今天 10:02', accent: 'green', scope: 'project' },
  { id: 'a04', projectId: 'p-postgraduate', project: '考研倒计时主题海报', name: '考研倒计时_主视觉_v3.psd', category: '设计源文件', size: '68.2 MB', owner: '刘星', updated: '昨天 20:46', accent: 'purple', scope: 'project' },
  { id: 'a05', projectId: 'p-welcome', project: '新生入学教育宣传片', name: '新生入学教育_终版字幕.srt', category: '文档', size: '36 KB', owner: '赵可', updated: '11月14日', accent: 'blue', scope: 'project' },
  { id: 'lib-shared-01', projectId: 'library-shared', project: '组织共享资料素材库', name: '宁夏理工学院视觉标识使用规范.pdf', category: '文档', size: '2.4 MB', owner: '熊宏兴', updated: '今天 09:00', accent: 'green', scope: 'shared' },
  { id: 'lib-shared-02', projectId: 'library-shared', project: '组织共享资料素材库', name: '校园风景_共用空镜_01.mp4', category: '视频', size: '42 MB', owner: '熊宏兴', updated: '昨天 18:30', accent: 'blue', scope: 'shared' },
  { id: 'lib-photo-01', projectId: 'library-摄影部', project: '摄影部资料库', name: '摄影部_活动拍摄与命名规范.pdf', category: '文档', size: '1.8 MB', owner: '陈曦', updated: '11月14日', accent: 'coral', scope: 'department', department: '摄影部' },
  { id: 'lib-video-01', projectId: 'library-视频部', project: '视频部资料库', name: '视频部_宣传片片头模板.aep', category: '设计源文件', size: '28 MB', owner: '赵可', updated: '11月14日', accent: 'blue', scope: 'department', department: '视频部' },
  { id: 'lib-editor-01', projectId: 'library-编辑部', project: '编辑部资料库', name: '编辑部_排版与事实核验清单.pdf', category: '文档', size: '860 KB', owner: '周予', updated: '11月13日', accent: 'green', scope: 'department', department: '编辑部' },
  { id: 'lib-tech-01', projectId: 'library-技术部', project: '技术部资料库', name: '技术部_海报尺寸与导出规范.pdf', category: '文档', size: '1.2 MB', owner: '贺兰', updated: '11月13日', accent: 'purple', scope: 'department', department: '技术部' }
]

const defaultMessages: GroupMessage[] = [
  { id: 'g01', group: 'all', senderId: 'm01', sender: '熊宏兴', content: '运动会项目已建立，请各部门部长今天 12:00 前确认分工，部员只跟进自己的任务。', time: '09:30' },
  { id: 'g02', group: 'all', senderId: 'm04', sender: '周予', content: '编辑部需要 20 张精修照片，摄影部完成后直接登记到项目素材，不再另发多个群。', time: '09:42' },
  { id: 'g03', group: '摄影部', senderId: 'm05', sender: '陈曦', content: '孙宁负责田径场，活动照片按“项目_内容_序号”命名，修完登记到素材页。', time: '10:05' },
  { id: 'g04', group: '摄影部', senderId: 'm08', sender: '孙宁', content: '收到，我下午有课，13:30 前会到现场并先交接已有照片。', time: '10:08' },
  { id: 'g05', group: '编辑部', senderId: 'm04', sender: '周予', content: '推文先完成事实核验，再提交主任终审，预览链接填到任务交付说明里。', time: '10:16' },
  { id: 'g06', group: '视频部', senderId: 'm06', sender: '赵可', content: '宣传片控制在 60 秒，先保证活动逻辑和字幕准确，再补充转场。', time: '10:20' },
  { id: 'g07', group: '技术部', senderId: 'm07', sender: '贺兰', content: '海报提交时同时登记 JPG 和 PSD，方便后续修改与归档。', time: '10:26' }
]

const defaultCourses: CourseItem[] = [
  { id: 'c01', day: 1, period: '1—2节', name: '新媒体文案写作', room: '文科楼 204', teacher: '李老师', weeks: '1—16周' },
  { id: 'c02', day: 1, period: '5—6节', name: '摄影基础', room: '艺术楼 106', teacher: '王老师', weeks: '1—12周' },
  { id: 'c03', day: 2, period: '3—4节', name: '视觉设计基础', room: '艺术楼 302', teacher: '赵老师', weeks: '1—16周' },
  { id: 'c04', day: 3, period: '1—2节', name: '大学英语', room: '公共教学楼 108', teacher: '马老师', weeks: '1—16周' },
  { id: 'c05', day: 4, period: '3—4节', name: '视频剪辑实务', room: '实验楼 405', teacher: '周老师', weeks: '3—14周' },
  { id: 'c06', day: 5, period: '5—6节', name: '大学生创新创业基础', room: '公共教学楼 216', teacher: '许老师', weeks: '5—12周' }
]

function readCollection<T>(key: string, fallback: T[]): T[] {
  const saved = Taro.getStorageSync(key)
  return Array.isArray(saved) ? saved : fallback
}

function writeCollection<T extends { id: string }>(key: string, items: T[]) {
  Taro.setStorageSync(key, items)
  // 异步同步到云端（不阻塞本地操作）
  if (isSupabaseConfigured()) {
    void upsertTable(key as TableName, items)
  }
}

/** 从云端删除某条记录（用于审核拒绝等删除场景） */
function deleteFromCloud(key: string, id: string) {
  if (isSupabaseConfigured()) {
    void deleteFromTable(key as TableName, id)
  }
}

function upsert<T extends { id: string }>(items: T[], item: T, prepend = false) {
  const index = items.findIndex(current => current.id === item.id)
  if (index >= 0) items[index] = item
  else if (prepend) items.unshift(item)
  else items.push(item)
  return items
}

function normalizeMembers(items: Member[]) {
  const members = items.filter(item => item.phone !== '13800000002' && item.phone !== '13800000003')
  const owner = defaultMembers[0]
  const ownerIndex = members.findIndex(item => item.id === owner.id || item.phone === '13800000001')
  if (ownerIndex >= 0) {
    const current = members[ownerIndex]
    const needsMigration = current.phone === '13800000001' || current.name === '林蔚'
    members[ownerIndex] = {
      ...current,
      id: owner.id,
      name: needsMigration ? owner.name : current.name,
      phone: owner.phone,
      role: '主任',
      department: '中心',
      college: needsMigration ? owner.college : current.college,
      major: needsMigration ? owner.major : current.major,
      className: needsMigration ? owner.className : current.className,
      accent: current.accent || owner.accent,
      status: 'active'
    }
  } else members.unshift({ ...owner })
  return members.map(item => ({ ...item, status: item.status || 'active' }))
}

function normalizeAssets(items: AssetItem[]) {
  const assets = items.map(item => ({ ...item, scope: item.scope || 'project' as AssetScope }))
  defaultAssets.filter(item => item.scope !== 'project').forEach(item => {
    if (!assets.some(asset => asset.id === item.id)) assets.push({ ...item })
  })
  return assets
}

export const getMembers = () => normalizeMembers(readCollection('nxmc_members', defaultMembers))
export const getProjects = () => readCollection('nxmc_projects', defaultProjects).map(item => ({ ...item, owner: item.owner === '林蔚' || item.owner === '韩青' ? '熊宏兴' : item.owner }))
export const getTasks = () => readCollection('nxmc_tasks', defaultTasks).map(item => ({ ...item, owner: item.ownerId === 'm01' ? '熊宏兴' : item.owner }))
export const getEvents = () => readCollection('nxmc_events', defaultEvents).map(item => ({ ...item, owner: item.owner.replace(/林蔚|韩青/g, '熊宏兴') }))
export const getAssets = () => normalizeAssets(readCollection('nxmc_assets', defaultAssets))
export const getMessages = () => readCollection('nxmc_messages', defaultMessages).map(item => item.senderId === 'm02' ? { ...item, senderId: 'm01', sender: '熊宏兴' } : item)
export const getCourses = () => readCollection('nxmc_courses', defaultCourses)

export function getMemberTitle(member: Member) {
  if (member.role === '主任') return '主任'
  if (member.role === '部长') return `${member.department}部长`
  return `${member.department}成员`
}

export function getCurrentMember(): Member | undefined {
  const id = Taro.getStorageSync('nxmc_current_member')
  if (!id) return undefined
  const member = getMembers().find(item => item.id === id)
  return member && member.status === 'active' ? member : undefined
}

export function loginByPhone(phone: string): MemberActionResult {
  const member = getMembers().find(item => item.phone === phone.replace(/\s/g, ''))
  if (!member) return { ok: false, message: '尚未收到内部邀请，请联系主任或本部门部长登记手机号。' }
  if (member.status === 'pending') return { ok: false, message: '你的成员资格正在等待主任审核，审核通过后即可登录。', member }
  Taro.setStorageSync('nxmc_current_member', member.id)
  return { ok: true, message: '登录成功', member }
}

export function logout() {
  Taro.removeStorageSync('nxmc_current_member')
}

export function saveMember(item: Member) {
  writeCollection('nxmc_members', upsert(getMembers(), item))
}

export function inviteMember(inviterId: string, input: InviteInput): MemberActionResult {
  const inviter = getMembers().find(item => item.id === inviterId && item.status === 'active')
  if (!inviter || inviter.role === '部员') return { ok: false, message: '当前账号没有邀请权限。' }
  const phone = input.phone.replace(/\s/g, '')
  if (!input.name.trim()) return { ok: false, message: '请填写新成员姓名。' }
  if (!/^1\d{10}$/.test(phone)) return { ok: false, message: '请输入正确的 11 位手机号。' }
  if (getMembers().some(item => item.phone === phone)) return { ok: false, message: '该手机号已在邀请或成员名单中，请勿重复添加。' }

  const isDirector = inviter.role === '主任'
  const role: Role = isDirector ? input.role : '部员'
  const department = isDirector ? input.department : inviter.department
  if (role === '主任' && getMembers().filter(item => item.role === '主任' && item.status === 'active').length >= 3) return { ok: false, message: '主任名额已达到 3 人，请先调整现有主任职位。' }
  if (role !== '主任' && (department === '中心' || !DEPARTMENTS.includes(department as Department))) return { ok: false, message: '请选择有效的所属部门。' }

  const tones = ['coral', 'blue', 'green', 'purple']
  const departmentIndex = DEPARTMENTS.indexOf(department as Department)
  const member: Member = {
    id: `member-${Date.now()}`,
    name: input.name.trim(),
    phone,
    role,
    department: role === '主任' ? '中心' : department,
    college: input.college.trim() || '待填写',
    major: input.major.trim() || '待填写',
    className: input.className.trim() || '待填写',
    accent: role === '主任' ? 'green' : tones[departmentIndex >= 0 ? departmentIndex : 0],
    status: isDirector ? 'active' : 'pending',
    invitedById: inviter.id,
    invitedByPhone: inviter.phone,
    invitedAt: new Date().toLocaleString('zh-CN', { hour12: false })
  }
  writeCollection('nxmc_members', upsert(getMembers(), member))
  return { ok: true, message: isDirector ? '成员已加入白名单。' : '部员已登记，等待主任审核。', member }
}

export function reviewMember(directorId: string, memberId: string, approved: boolean): MemberActionResult {
  const director = getMembers().find(item => item.id === directorId && item.role === '主任' && item.status === 'active')
  if (!director) return { ok: false, message: '仅主任可以审核成员。' }
  const members = getMembers()
  const target = members.find(item => item.id === memberId && item.status === 'pending')
  if (!target) return { ok: false, message: '未找到待审核成员。' }
  if (approved) {
    const updated = { ...target, status: 'active' as MemberStatus }
    writeCollection('nxmc_members', upsert(members, updated))
    return { ok: true, message: `${target.name} 已通过审核，可以使用预留手机号登录。`, member: updated }
  }
  writeCollection('nxmc_members', members.filter(item => item.id !== memberId))
  deleteFromCloud('nxmc_members', memberId)
  return { ok: true, message: '已拒绝并移除该待审核记录。' }
}

export function updateMemberAccess(directorId: string, memberId: string, role: Role, department: Department | '中心'): MemberActionResult {
  const director = getMembers().find(item => item.id === directorId && item.role === '主任' && item.status === 'active')
  if (!director) return { ok: false, message: '仅主任可以调整成员职位和部门。' }
  const members = getMembers()
  const target = members.find(item => item.id === memberId)
  if (!target) return { ok: false, message: '未找到该成员。' }
  if (role === '主任' && members.filter(item => item.id !== memberId && item.role === '主任' && item.status === 'active').length >= 3) return { ok: false, message: '主任名额不能超过 3 人。' }
  if (role !== '主任' && (department === '中心' || !DEPARTMENTS.includes(department as Department))) return { ok: false, message: '请选择有效的所属部门。' }
  const updated = { ...target, role, department: role === '主任' ? '中心' as const : department }
  writeCollection('nxmc_members', upsert(members, updated))
  return { ok: true, message: '成员职位与部门已更新。', member: updated }
}

export function buildInviteMessage(member: Member, inviter: Member) {
  const destination = member.department === '中心' ? '主任团队' : member.department
  const loginNote = member.status === 'pending' ? '主任审核通过后，请使用本手机号登录“新媒协同”小程序' : '请使用本手机号登录“新媒协同”小程序'
  return `【宁夏理工学院新媒体中心】亲爱的${member.name}同学，恭喜你通过面试，欢迎加入宁夏理工学院新媒体中心${destination}！${loginNote}，进入后即可查看你的部门、职位及工作安排。期待与你一起记录校园、传递青年声音！邀请人：${inviter.name}（${getMemberTitle(inviter)}）。`
}

export function saveProject(item: ProjectItem) {
  writeCollection('nxmc_projects', upsert(getProjects(), item, true))
}

export function saveTask(item: TaskItem) {
  writeCollection('nxmc_tasks', upsert(getTasks(), item, true))
}

export function saveEvent(item: EventItem) {
  writeCollection('nxmc_events', upsert(getEvents(), item, true))
}

export function saveAsset(item: AssetItem) {
  writeCollection('nxmc_assets', upsert(getAssets(), item, true))
}

export function saveMessage(item: GroupMessage) {
  writeCollection('nxmc_messages', upsert(getMessages(), item))
}

export function saveCourse(item: CourseItem) {
  writeCollection('nxmc_courses', upsert(getCourses(), item))
}

export function getSchoolUrl(): string {
  return Taro.getStorageSync('nxmc_school_url') || ''
}

export function saveSchoolUrl(url: string) {
  Taro.setStorageSync('nxmc_school_url', url.trim())
}

export function getDateAtOffset(offset: number) {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  return date
}

export function getShortDate(offset: number) {
  const date = getDateAtOffset(offset)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

export function getTodayText() {
  const date = new Date()
  const weeks = ['日', '一', '二', '三', '四', '五', '六']
  return `${date.getMonth() + 1}月${date.getDate()}日 · 星期${weeks[date.getDay()]}`
}

/**
 * 云端同步：应用启动时调用，从 Supabase 拉取全量数据到本地缓存。
 * 未配置 Supabase 时静默跳过，自动使用本地存储模式。
 */
export async function initCloudSync(): Promise<number> {
  if (!isSupabaseConfigured()) return 0
  const synced = await syncAllFromCloud()
  return synced.length
}

/** 是否已配置云端后端 */
export function isCloudReady(): boolean {
  return isSupabaseConfigured()
}
