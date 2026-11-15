import { ScrollView, Text, View } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { Avatar, EmptyState, PageIntro, ProgressBar } from '../../components/common'
import { getCurrentMember, getTasks, Member, saveTask, TaskItem } from '../../data'
import './index.scss'

export default function Tasks() {
  const [member, setMember] = useState<Member>()
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [filter, setFilter] = useState('mine')

  useDidShow(() => {
    const current = getCurrentMember()
    if (!current) {
      Taro.reLaunch({ url: '/pages/login/index' })
      return
    }
    setMember(current)
    setTasks(getTasks())
  })

  if (!member) return <View className='page' />

  const filters = member.role === '主任' ? [{ key: 'mine', label: '我负责的' }, { key: 'all', label: '全部任务' }, { key: 'done', label: '已完成' }] : [{ key: 'mine', label: '我负责的' }, { key: 'department', label: '本部门' }, { key: 'done', label: '已完成' }]
  const scopedTasks = tasks.filter(task => {
    if (filter === 'mine') return task.ownerId === member.id && !task.done
    if (filter === 'department') return task.department === member.department
    if (filter === 'done') return task.done && (member.role !== '部员' || task.ownerId === member.id)
    return true
  })
  const activeTasks = tasks.filter(task => !task.done && (member.role === '主任' || task.department === member.department || task.ownerId === member.id))
  const completion = activeTasks.length ? Math.round(activeTasks.filter(task => task.progress >= 80).length / activeTasks.length * 100) : 0

  const toggleTask = (task: TaskItem) => {
    const updated = { ...task, done: !task.done, progress: !task.done ? 100 : 70 }
    saveTask(updated)
    setTasks(getTasks())
    Taro.showToast({ title: updated.done ? '已标记完成' : '已恢复任务', icon: 'none' })
  }

  return (
    <View className='page tasks-page'>
      <View className='page__inner'>
        <PageIntro eyebrow='MY DEPARTMENT TASKS' title='任务协作' description='部长协商分工，部员只看清晰交付' extra={<View className='floating-add' onClick={() => Taro.navigateTo({ url: '/pages/create/index' })}><Text>＋</Text></View>} />

        <View className='task-summary card'>
          <View className='task-summary__ring'><Text className='task-summary__ring-value'>{completion}%</Text><Text className='task-summary__ring-label'>近完成</Text></View>
          <View className='task-summary__copy'><Text className='task-summary__title'>{member.role === '主任' ? '四部门协作概览' : `${member.department}工作概览`}</Text><Text className='task-summary__description'>{activeTasks.length} 项进行中 · {activeTasks.filter(task => task.priority === '高').length} 项高优先级</Text><View className='task-summary__avatars'>{activeTasks.slice(0, 4).map(task => <Avatar key={task.id} name={task.owner} tone={task.accent} small />)}<View className='task-summary__online'><Text>按项目归档</Text></View></View></View>
        </View>

        <ScrollView scrollX className='filter-scroll task-filters'>{filters.map(item => <Text key={item.key} className={`filter-chip ${filter === item.key ? 'filter-chip--active' : ''}`} onClick={() => setFilter(item.key)}>{item.label}</Text>)}</ScrollView>
        <View className='task-list-heading'><Text>{(filters.find(item => item.key === filter) || filters[0]).label}</Text><Text className='task-list-heading__count'>{scopedTasks.length} 项</Text></View>

        <View className='task-list'>
          {scopedTasks.map(task => (
            <View className={`task-card card ${task.done ? 'task-card--done' : ''}`} key={task.id} onClick={() => Taro.navigateTo({ url: `/pages/detail/index?id=${task.projectId}` })}>
              <View className='task-card__header'>
                <View className={`task-check ${task.done ? 'task-check--done' : ''}`} onClick={event => { event.stopPropagation(); toggleTask(task) }}><Text>{task.done ? '✓' : ''}</Text></View>
                <View className='task-card__heading'><Text className='task-card__title'>{task.title}</Text><Text className='task-card__project'>{task.project}</Text></View>
                <Text className={`priority-tag priority-tag--${task.priority === '高' ? 'high' : task.priority === '中' ? 'medium' : 'low'}`}>{task.priority}</Text>
              </View>
              <Text className='task-deliverable'>交付：{task.deliverable}</Text>
              <View className='task-card__progress'><ProgressBar value={task.progress} tone={task.accent} /><Text className='task-card__progress-value'>{task.progress}%</Text></View>
              <View className='task-card__footer'><View className='task-card__owner'><Avatar name={task.owner} tone={task.accent} small /><Text>{task.owner} · {task.department}</Text></View><Text className={`task-card__due ${task.due.includes('今天') && !task.done ? 'task-card__due--urgent' : ''}`}>{task.due}</Text></View>
            </View>
          ))}
          {scopedTasks.length === 0 && <View className='card'><EmptyState title='这里已经清空' description='当前分类没有任务，可切换查看或新建活动项目。' /></View>}
        </View>
        <View className='demo-notice'>勾选完成只更新本机演示状态；正式多人协作需要服务端同步与操作权限。</View>
      </View>
    </View>
  )
}
