import { Image, Text, View } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import departmentLogo from '../../assets/branding/department-logo.png'
import { Avatar, SectionHeader, StatusTag } from '../../components/common'
import { EventItem, getCurrentMember, getEvents, getMemberTitle, getProjects, getTasks, getTodayText, Member, ProjectItem, TaskItem } from '../../data'
import './index.scss'

const quickActions = [
  { key: 'create', mark: '建', title: '新建项目', note: '一次完成派单', tone: 'coral' },
  { key: 'assets', mark: '材', title: '项目素材', note: '按活动归档', tone: 'green' },
  { key: 'groups', mark: '群', title: '工作群聊', note: '总群与部门群', tone: 'blue' },
  { key: 'school', mark: '课', title: '我的课表', note: '分工先看空闲', tone: 'purple' }
]

export default function Index() {
  const [member, setMember] = useState<Member>()
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [events, setEvents] = useState<EventItem[]>([])

  useDidShow(() => {
    const current = getCurrentMember()
    if (!current) {
      Taro.reLaunch({ url: '/pages/login/index' })
      return
    }
    setMember(current)
    setProjects(getProjects())
    setTasks(getTasks())
    setEvents(getEvents().filter(event => event.dayOffset === 0))
  })

  if (!member) return <View className='page' />

  const hour = new Date().getHours()
  const greeting = hour < 11 ? '早上好' : hour < 14 ? '中午好' : hour < 18 ? '下午好' : '晚上好'
  const myTasks = tasks.filter(task => task.ownerId === member.id && !task.done)
  const reviews = projects.filter(project => project.status === 'pending' && (member.role === '主任' || project.department === member.department))
  const activeProjects = projects.filter(project => project.status !== 'done')
  const review = reviews[0]

  const openAction = (key: string) => {
    if (key === 'groups') Taro.switchTab({ url: '/pages/groups/index' })
    else if (key === 'create') Taro.navigateTo({ url: '/pages/create/index' })
    else if (key === 'assets') Taro.navigateTo({ url: '/pages/assets/index' })
    else Taro.navigateTo({ url: '/pages/school/index' })
  }

  const showNotifications = () => {
    Taro.showModal({
      title: '今日工作提醒',
      content: `${myTasks.length} 项我的任务待完成，${reviews.length} 个项目待审核。请优先处理今天 16:30 的运动会推文终审。`,
      showCancel: false,
      confirmText: '知道了',
      confirmColor: '#173f35'
    })
  }

  return (
    <View className='page home-page'>
      <View className='page__inner'>
        <View className='brand-bar'>
          <View className='brand-bar__identity'>
            <View className='brand-mark'><Image className='brand-mark__logo' src={departmentLogo} mode='aspectFit' /></View>
            <View className='brand-copy'><Text className='brand-copy__name'>宁夏理工学院新媒体中心</Text><Text className='brand-copy__en'>NEWMEDIA HUB</Text></View>
          </View>
          <View className='notice-button' onClick={showNotifications}><Text className='notice-button__icon'>•••</Text>{(reviews.length > 0 || myTasks.length > 0) && <View className='notice-button__dot' />}</View>
        </View>

        <View className='welcome-row'>
          <View className='welcome-copy'>
            <Text className='welcome-copy__date'>{getTodayText()}</Text>
            <Text className='welcome-copy__title'>{greeting}，{member.name}</Text>
            <Text className='welcome-copy__subtitle'>只看与你有关的事，完成再继续下一步。</Text>
          </View>
          <Avatar name={member.name} tone={member.accent} />
        </View>

        <View className='overview-card'>
          <View className='overview-card__top'>
            <View><Text className='overview-card__eyebrow'>我的工作概览</Text><Text className='overview-card__title'>今天有 {myTasks.length + reviews.length} 件事需要关注</Text></View>
            <View className='overview-card__badge'><Text>{getMemberTitle(member)}</Text></View>
          </View>
          <View className='overview-metrics'>
            <View className='overview-metric' onClick={() => Taro.switchTab({ url: '/pages/tasks/index' })}><Text className='overview-metric__value'>{myTasks.length}</Text><Text className='overview-metric__label'>我的待办</Text></View>
            <View className='overview-metric' onClick={() => review && Taro.navigateTo({ url: `/pages/detail/index?id=${review.id}` })}><Text className='overview-metric__value'>{reviews.length}</Text><Text className='overview-metric__label'>待我审核</Text></View>
            <View className='overview-metric' onClick={() => Taro.switchTab({ url: '/pages/calendar/index' })}><Text className='overview-metric__value'>{activeProjects.length}</Text><Text className='overview-metric__label'>进行中项目</Text></View>
          </View>
        </View>

        <View className='home-section'>
          <SectionHeader title='常用入口' action='少一步跳转，多一步完成' />
          <View className='quick-grid'>
            {quickActions.map(action => <View className='quick-action' key={action.key} onClick={() => openAction(action.key)}><View className={`quick-action__mark quick-action__mark--${action.tone}`}><Text>{action.mark}</Text></View><Text className='quick-action__title'>{action.title}</Text><Text className='quick-action__note'>{action.note}</Text></View>)}
          </View>
        </View>

        <View className='home-section'>
          <SectionHeader title='我的任务' action='全部任务' onAction={() => Taro.switchTab({ url: '/pages/tasks/index' })} />
          <View className='agenda-card card'>
            {myTasks.slice(0, 2).map(task => <View className='my-task-row' key={task.id} onClick={() => Taro.navigateTo({ url: `/pages/detail/index?id=${task.projectId}` })}><View className={`my-task-row__mark my-task-row__mark--${task.accent}`}><Text>{task.department.slice(0, 1)}</Text></View><View className='my-task-row__copy'><Text className='my-task-row__title'>{task.title}</Text><Text className='my-task-row__meta'>{task.project} · {task.due}</Text></View><Text className='my-task-row__arrow'>›</Text></View>)}
            {myTasks.length === 0 && <View className='home-empty'><Text>我的任务已完成，可以去部门群看看是否需要协助。</Text></View>}
          </View>
        </View>

        {review && <View className='home-section'>
          <SectionHeader title='待我审核' action='全部项目' onAction={() => Taro.switchTab({ url: '/pages/calendar/index' })} />
          <View className='review-card card' onClick={() => Taro.navigateTo({ url: `/pages/detail/index?id=${review.id}` })}>
            <View className='review-card__top'><StatusTag type={review.status} label={review.statusLabel} /><Text className='review-card__time'>{review.time}</Text></View>
            <Text className='review-card__title'>{review.title}</Text>
            <View className='review-card__footer'><View className='review-card__owner'><Avatar name={review.owner} tone={review.accent} small /><View className='review-card__owner-copy'><Text className='review-card__owner-name'>{review.owner}</Text><Text className='review-card__department'>{review.department} · {review.format}</Text></View></View><View className='review-card__arrow'><Text>→</Text></View></View>
          </View>
        </View>}

        <View className='home-section'>
          <SectionHeader title='今日安排' action='工作与课表' onAction={() => Taro.navigateTo({ url: '/pages/schedule/index' })} />
          <View className='agenda-card card'>
            {events.map((event, index) => <View className='agenda-item' key={event.id}><View className='agenda-item__time'><Text>{event.time.split('—')[0]}</Text></View><View className='agenda-item__rail'><View className={`agenda-item__dot agenda-item__dot--${event.accent}`} />{index < events.length - 1 && <View className='agenda-item__line' />}</View><View className='agenda-item__content'><View className='agenda-item__title-row'><Text className='agenda-item__title'>{event.title}</Text><Text className='agenda-item__type'>{event.type}</Text></View><Text className='agenda-item__meta'>{event.location}</Text><Text className='agenda-item__meta'>{event.owner}</Text></View></View>)}
          </View>
        </View>

        <View className='week-banner' onClick={() => Taro.navigateTo({ url: '/pages/stats/index' })}>
          <View className='week-banner__copy'><Text className='week-banner__eyebrow'>REVIEW EXAMPLE</Text><Text className='week-banner__title'>用统一口径做内容复盘</Text><Text className='week-banner__link'>查看示例数据看板 →</Text></View>
          <View className='week-banner__chart'>{[38, 60, 46, 76, 58, 88, 70].map((height, index) => <View key={index} className='week-banner__bar' style={{ height: `${height}%` }} />)}</View>
        </View>
        <View className='demo-notice'>当前为本机演示：成员身份、任务和群消息仅保存在本设备，尚未接入真实多人同步。</View>
      </View>
    </View>
  )
}
