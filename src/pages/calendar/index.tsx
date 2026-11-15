import { ScrollView, Text, View } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { Avatar, EmptyState, PageIntro, ProgressBar, StatusTag } from '../../components/common'
import { DEPARTMENTS, getCurrentMember, getProjects, ProjectItem } from '../../data'
import './index.scss'

const filters = [
  { key: 'all', label: '全部项目' },
  { key: 'draft', label: '待分工' },
  { key: 'progress', label: '协作中' },
  { key: 'pending', label: '待审核' },
  { key: 'scheduled', label: '待发布' }
]

export default function Calendar() {
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [filter, setFilter] = useState('all')
  const [ready, setReady] = useState(false)
  const visibleProjects = projects.filter(item => filter === 'all' || item.status === filter)

  useDidShow(() => {
    if (!getCurrentMember()) {
      Taro.reLaunch({ url: '/pages/login/index' })
      return
    }
    setProjects(getProjects())
    setReady(true)
  })

  if (!ready) return <View className='page' />

  return (
    <View className='page calendar-page'>
      <View className='page__inner'>
        <PageIntro eyebrow='ACTIVITY PROJECTS' title='活动项目' description='一个活动串联任务、素材、审核与发布' extra={<View className='floating-add' onClick={() => Taro.navigateTo({ url: '/pages/create/index' })}><Text>＋</Text></View>} />

        <View className='month-row'><Text className='month-row__title'>近期工作项目</Text><Text className='month-row__count'>{projects.length} 个项目</Text></View>
        <ScrollView scrollX className='filter-scroll calendar-filters'>
          {filters.map(item => <Text key={item.key} className={`filter-chip ${filter === item.key ? 'filter-chip--active' : ''}`} onClick={() => setFilter(item.key)}>{item.label}</Text>)}
        </ScrollView>

        <View className='selected-day-row'><Text className='selected-day-row__date'>{(filters.find(item => item.key === filter) || filters[0]).label}</Text><Text className='selected-day-row__count'>{visibleProjects.length} 项</Text></View>
        <View className='content-list'>
          {visibleProjects.map(item => (
            <View className='content-card card' key={item.id} onClick={() => Taro.navigateTo({ url: `/pages/detail/index?id=${item.id}` })}>
              <View className={`content-card__accent content-card__accent--${item.accent}`} />
              <View className='content-card__body'>
                <View className='content-card__top'><View className='content-card__labels'><StatusTag type={item.status} label={item.statusLabel} /><Text className='content-card__format'>{item.format}</Text></View><Text className='content-card__time'>{item.time}</Text></View>
                <Text className='content-card__title'>{item.title}</Text>
                <Text className='content-card__summary'>{item.summary}</Text>
                <View className='project-progress'><ProgressBar value={item.progress} tone={item.accent} /><Text>{item.progress}%</Text></View>
                <View className='project-departments'>{DEPARTMENTS.map(department => <Text key={department}>{department}</Text>)}</View>
                <View className='content-card__footer'><View className='content-card__owner'><Avatar name={item.owner} tone={item.accent} small /><Text>{item.owner} · {item.department}</Text></View><Text className='content-card__channel'>查看项目 →</Text></View>
              </View>
            </View>
          ))}
          {visibleProjects.length === 0 && <View className='card'><EmptyState title='当前没有相关项目' description='切换状态看看，或新建一个活动项目。' /></View>}
        </View>

        <View className='pipeline-card card'>
          <Text className='pipeline-card__title'>统一协作流程</Text>
          <View className='pipeline-steps'>
            {['主任派单', '部门协作', '负责人审核', '发布归档'].map((step, index) => <View className='pipeline-step' key={step}><View className={`pipeline-step__number ${index === 1 ? 'pipeline-step__number--current' : ''}`}><Text>{index + 1}</Text></View><Text className='pipeline-step__label'>{step}</Text></View>)}
          </View>
          <Text className='pipeline-card__note'>部长结合课表与部员协商分工，交付物始终归属于同一个活动项目。</Text>
        </View>
        <View className='demo-notice'>项目内展示的是演示工作流，不会自动发布到真实公众号或抖音账号。</View>
      </View>
    </View>
  )
}
