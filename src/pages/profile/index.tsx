import { Image, Text, View } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import departmentLogo from '../../assets/branding/department-logo.png'
import schoolLogo from '../../assets/branding/school-logo.png'
import { Avatar, SectionHeader } from '../../components/common'
import { getCurrentMember, getMemberTitle, getProjects, getTasks, logout, Member, OFFICIAL_ACCOUNTS, ORGANIZATION_NAME } from '../../data'
import './index.scss'

const commonMenus = [
  { key: 'assets', mark: '库', title: '资料与素材库', note: '组织共享、部门资料与项目素材', tone: 'blue', path: '/pages/assets/index' },
  { key: 'schedule', mark: '程', title: '工作与课程安排', note: '协调拍摄、审核和个人课表', tone: 'coral', path: '/pages/schedule/index' },
  { key: 'stats', mark: '数', title: '内容复盘示例', note: '两个运营账号的复盘口径与演示数据', tone: 'purple', path: '/pages/stats/index' }
]

export default function Profile() {
  const [member, setMember] = useState<Member>()
  const [myTaskCount, setMyTaskCount] = useState(0)
  const [departmentTaskCount, setDepartmentTaskCount] = useState(0)
  const [projectCount, setProjectCount] = useState(0)

  useDidShow(() => {
    const current = getCurrentMember()
    if (!current) {
      Taro.reLaunch({ url: '/pages/login/index' })
      return
    }
    const tasks = getTasks()
    setMember(current)
    setMyTaskCount(tasks.filter(task => task.ownerId === current.id && !task.done).length)
    setDepartmentTaskCount(tasks.filter(task => !task.done && (current.role === '主任' || task.department === current.department)).length)
    setProjectCount(getProjects().filter(project => project.status !== 'done').length)
  })

  if (!member) return <View className='page' />
  const duty = member.role === '主任' ? '接收老师安排，创建活动项目并统筹四部门，负责终审与发布协调。' : member.role === '部长' ? '接收主任安排，结合课表与部员协商分工，带队执行并培养部员。' : '查看自己的任务与课表，按交付要求完成工作，素材归入对应活动项目。'
  const menus = [
    ...(member.role !== '部员' ? [{ key: 'members', mark: '员', title: '成员与邀请管理', note: member.role === '主任' ? '邀请成员、审核部员并调整职位部门' : '添加本部门部员并等待主任审核', tone: 'green', path: '/pages/members/index' }] : []),
    ...commonMenus,
    { key: 'school', mark: '籍', title: '学籍、课表与教务入口', note: '课表手动维护，教务网址复制后使用', tone: 'green', path: '/pages/school/index' }
  ]

  const switchAccount = () => {
    Taro.showModal({ title: '退出当前账号？', content: '退出后需使用其他已邀请且审核通过的手机号重新登录，本机数据会保留。', confirmText: '退出登录', confirmColor: '#173f35', success: result => { if (result.confirm) { logout(); Taro.reLaunch({ url: '/pages/login/index' }) } } })
  }

  return (
    <View className='page profile-page'>
      <View className='page__inner'>
        <View className='profile-heading'><Text className='profile-heading__eyebrow'>MY WORKSPACE</Text><Text className='profile-heading__title'>我的</Text></View>
        <View className='profile-card'>
          <View className='profile-card__pattern profile-card__pattern--one' /><View className='profile-card__pattern profile-card__pattern--two' />
          <View className='profile-card__top'><Avatar name={member.name} tone={member.accent} /><View className='profile-card__identity'><View className='profile-card__name-row'><Text className='profile-card__name'>{member.name}</Text><Text className='profile-card__role'>{getMemberTitle(member)}</Text></View><Text className='profile-card__org'>{ORGANIZATION_NAME}</Text></View></View>
          <View className='profile-card__footer'><View><Text className='profile-card__metric'>{myTaskCount}</Text><Text className='profile-card__label'>我的待办</Text></View><View><Text className='profile-card__metric'>{departmentTaskCount}</Text><Text className='profile-card__label'>{member.role === '主任' ? '中心待办' : '部门待办'}</Text></View><View><Text className='profile-card__metric'>{projectCount}</Text><Text className='profile-card__label'>进行中项目</Text></View></View>
        </View>

        <View className='profile-section'><SectionHeader title='我的职责' /><View className='duty-card card'><Text>{duty}</Text></View></View>

        <View className='profile-section'><SectionHeader title='工作与账号' /><View className='menu-card card'>{menus.map((menu, index) => <View className={`menu-row ${index < menus.length - 1 ? 'menu-row--border' : ''}`} key={menu.key} onClick={() => Taro.navigateTo({ url: menu.path })}><View className={`menu-row__mark menu-row__mark--${menu.tone}`}><Text>{menu.mark}</Text></View><View className='menu-row__copy'><Text className='menu-row__title'>{menu.title}</Text><Text className='menu-row__note'>{menu.note}</Text></View><Text className='menu-row__arrow'>›</Text></View>)}</View></View>

        <View className='profile-section'>
          <SectionHeader title='组织信息' />
          <View className='org-card card'>
            <View className='org-card__brands'>
              <Image className='org-card__school-logo' src={schoolLogo} mode='aspectFit' />
              <Image className='org-card__department-logo' src={departmentLogo} mode='aspectFit' />
            </View>
            <Text className='org-card__name'>{ORGANIZATION_NAME}</Text>
            <Text className='org-card__meta'>宁夏理工学院校团委学生组织 · 3 位主任 · 4 个部门</Text>
            {OFFICIAL_ACCOUNTS.map(account => <View className='org-account' key={account}><View className='org-account__dot' /><Text>{account}</Text></View>)}
          </View>
        </View>

        <View className='secondary-button switch-account' onClick={switchAccount}>退出并更换手机号</View>
        <View className='profile-footer'><Text>新媒协同 · 让每一次协作清晰有序</Text><Text>本机演示版本 1.2.0</Text></View>
      </View>
    </View>
  )
}
