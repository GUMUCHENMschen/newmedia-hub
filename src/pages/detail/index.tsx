import { Input, Picker, Text, Textarea, View } from '@tarojs/components'
import Taro, { useDidShow, useRouter } from '@tarojs/taro'
import { useState } from 'react'
import { Avatar, EmptyState, ProgressBar, StatusTag } from '../../components/common'
import { AssetItem, Department, DEPARTMENTS, getAssets, getCurrentMember, getMembers, getProjects, getTasks, Member, ProjectItem, saveProject, saveTask, TaskItem } from '../../data'
import './index.scss'

const flowSteps = [
  { title: '主任下达项目', note: '说明活动背景、发布渠道与总体时间' },
  { title: '部长协商分工', note: '结合课表与部员时间确认责任和交付物' },
  { title: '素材与内容制作', note: '摄影、视频、编辑、技术在同一项目交付' },
  { title: '审核、发布与归档', note: '核对事实、版权与口径后进入发布排期' }
]

export default function Detail() {
  const router = useRouter()
  const [member, setMember] = useState<Member>()
  const [project, setProject] = useState<ProjectItem>()
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [assets, setAssets] = useState<AssetItem[]>([])
  const [note, setNote] = useState('')
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newDeliverable, setNewDeliverable] = useState('')
  const [newDue, setNewDue] = useState('明天 18:00')
  const [departmentIndex, setDepartmentIndex] = useState(0)
  const [ownerIndex, setOwnerIndex] = useState(0)

  const load = () => {
    const currentProject = getProjects().find(item => item.id === router.params.id)
    setProject(currentProject)
    setTasks(getTasks().filter(item => item.projectId === router.params.id))
    setAssets(getAssets().filter(item => item.projectId === router.params.id))
  }

  useDidShow(() => {
    const currentMember = getCurrentMember()
    if (!currentMember) {
      Taro.reLaunch({ url: '/pages/login/index' })
      return
    }
    setMember(currentMember)
    load()
  })

  if (!project || !member) return <View className='page'><View className='page__inner'><View className='card'><EmptyState title='未找到活动项目' description='请返回项目列表重新选择。' /></View></View></View>

  const canReview = project.status === 'pending' && (member.role === '主任' || (member.role === '部长' && project.department === member.department))
  const canSubmit = ['draft', 'progress', 'returned'].includes(project.status) && (member.role !== '部员' || tasks.some(task => task.ownerId === member.id))
  const stageIndex = project.status === 'draft' ? 0 : project.status === 'progress' || project.status === 'returned' ? 2 : project.status === 'pending' ? 3 : 4
  const canManage = member.role === '主任' || member.role === '部长'
  const availableDepartments = member.role === '主任' ? [...DEPARTMENTS] : [member.department as Department]
  const taskDepartment = availableDepartments[departmentIndex] || availableDepartments[0]
  const taskCandidates = getMembers().filter(item => item.status === 'active' && item.department === taskDepartment)
  const taskOwner = taskCandidates[ownerIndex] || taskCandidates[0]

  const updateStatus = (status: 'pending' | 'scheduled' | 'returned') => {
    const updated: ProjectItem = { ...project, status, statusLabel: status === 'pending' ? '待审核' : status === 'scheduled' ? '待发布' : '已退回', progress: status === 'pending' ? 90 : status === 'scheduled' ? 100 : 60 }
    saveProject(updated)
    setProject(updated)
    Taro.showToast({ title: status === 'pending' ? '已提交审核' : status === 'scheduled' ? '已通过并进入排期' : '已退回修改', icon: 'none' })
  }

  const approve = () => {
    Taro.showModal({ title: '确认审核通过？', content: '请确认事实、文字、图片版权和发布口径均已核对。通过后进入发布排期，不会自动发布。', confirmText: '确认通过', confirmColor: '#173f35', success: result => { if (result.confirm) updateStatus('scheduled') } })
  }

  const returnForEdit = () => {
    if (!note.trim()) {
      Taro.showToast({ title: '退回前请填写修改意见', icon: 'none' })
      return
    }
    updateStatus('returned')
  }

  const toggleTask = (task: TaskItem) => {
    saveTask({ ...task, done: !task.done, progress: !task.done ? 100 : 70 })
    load()
  }

  const addTask = () => {
    if (!newTaskTitle.trim() || !newDeliverable.trim()) {
      Taro.showToast({ title: '请填写任务与交付要求', icon: 'none' })
      return
    }
    if (!taskOwner) {
      Taro.showToast({ title: '该部门暂无成员档案', icon: 'none' })
      return
    }
    const tones = ['coral', 'blue', 'green', 'purple']
    saveTask({ id: `task-${Date.now()}`, projectId: project.id, title: newTaskTitle.trim(), project: project.title, ownerId: taskOwner.id, owner: taskOwner.name, department: taskDepartment, due: newDue.trim() || '时间待确认', priority: '中', progress: 0, done: false, accent: tones[DEPARTMENTS.indexOf(taskDepartment)], deliverable: newDeliverable.trim() })
    setNewTaskTitle('')
    setNewDeliverable('')
    setShowTaskForm(false)
    load()
    Taro.showToast({ title: '部门任务已添加', icon: 'success' })
  }

  return (
    <View className='page detail-page'>
      <View className='page__inner'>
        <View className='detail-heading'><View><Text className='detail-heading__eyebrow'>ACTIVITY PROJECT</Text><Text className='detail-heading__title'>项目详情</Text></View><StatusTag type={project.status} label={project.statusLabel} /></View>

        <View className='article-card card'>
          <View className={`article-cover article-cover--${project.accent}`}>
            <View className='article-cover__circle article-cover__circle--one' /><View className='article-cover__circle article-cover__circle--two' />
            <Text className='article-cover__eyebrow'>宁夏理工学院新媒体中心</Text>
            <Text className='article-cover__title'>{project.format}</Text>
            <Text className='article-cover__footer'>{project.channel}</Text>
          </View>
          <View className='article-body'>
            <View className='article-body__meta'><Text>{project.time}</Text><Text>{project.location}</Text></View>
            <Text className='article-body__title'>{project.title}</Text>
            <Text className='article-body__summary'>{project.summary}</Text>
            <View className='detail-progress'><ProgressBar value={project.progress} tone={project.accent} /><Text>{project.progress}%</Text></View>
          </View>
        </View>

        <View className='submitter-card card'><View className='submitter-card__owner'><Avatar name={project.owner} tone={project.accent} /><View><Text className='submitter-card__name'>{project.owner}</Text><Text className='submitter-card__department'>{project.department} · 项目牵头人</Text></View></View><View className='submitter-card__time'><Text>计划交付</Text><Text>{project.time}</Text></View></View>

        <View className='flow-card card'>
          <Text className='flow-card__title'>项目流转</Text>
          {flowSteps.map((step, index) => {
            const state = index < stageIndex ? 'done' : index === stageIndex ? 'current' : 'next'
            return <View className='flow-row' key={step.title}><View className='flow-row__rail'><View className={`flow-row__dot flow-row__dot--${state}`}><Text>{state === 'done' ? '✓' : index + 1}</Text></View>{index < flowSteps.length - 1 && <View className='flow-row__line' />}</View><View className='flow-row__copy'><Text className='flow-row__title'>{step.title}</Text><Text className='flow-row__note'>{step.note}</Text></View></View>
          })}
        </View>

        <View className='flow-card card'>
          <View className='detail-section-title'><Text className='flow-card__title'>部门任务</Text><Text>{tasks.filter(task => task.done).length}/{tasks.length} 已完成</Text></View>
          {tasks.map(task => <View className='detail-task' key={task.id}><View className={`task-check ${task.done ? 'task-check--done' : ''}`} onClick={() => toggleTask(task)}><Text>{task.done ? '✓' : ''}</Text></View><View className='detail-task__copy'><Text className='detail-task__title'>{task.title}</Text><Text className='detail-task__meta'>{task.owner} · {task.department} · {task.due}</Text><Text className='detail-task__deliverable'>交付：{task.deliverable}</Text></View></View>)}
          {tasks.length === 0 && <Text className='detail-empty-text'>尚未拆分任务，可由主任或部长继续补充。</Text>}
          {canManage && <View className='secondary-button add-task-button' onClick={() => setShowTaskForm(!showTaskForm)}>{showTaskForm ? '收起任务表单' : '＋ 添加部门任务'}</View>}
          {showTaskForm && <View className='detail-task-form'>
            <View className='form-field'><Text className='form-field__label'>负责部门</Text><Picker mode='selector' range={availableDepartments} value={departmentIndex} onChange={event => { setDepartmentIndex(Number(event.detail.value)); setOwnerIndex(0) }}><View className='form-picker'><Text>{taskDepartment}</Text><Text>⌄</Text></View></Picker></View>
            <View className='form-field'><Text className='form-field__label'>负责人</Text><Picker mode='selector' range={taskCandidates.map(item => `${item.name} · ${item.role}`)} value={ownerIndex} onChange={event => setOwnerIndex(Number(event.detail.value))}><View className='form-picker'><Text>{taskOwner ? `${taskOwner.name} · ${taskOwner.role}` : '暂无成员'}</Text><Text>⌄</Text></View></Picker></View>
            <View className='form-field'><Text className='form-field__label'>任务内容</Text><Input className='form-input' value={newTaskTitle} onInput={event => setNewTaskTitle(event.detail.value)} placeholder='例如：完成现场精修照片筛选' placeholderClass='form-placeholder' /></View>
            <View className='form-field'><Text className='form-field__label'>交付要求</Text><Textarea className='form-textarea' value={newDeliverable} onInput={event => setNewDeliverable(event.detail.value)} placeholder='数量、格式、命名与归档要求' placeholderClass='form-placeholder' /></View>
            <View className='form-field'><Text className='form-field__label'>截止时间</Text><Input className='form-input' value={newDue} onInput={event => setNewDue(event.detail.value)} /></View>
            <View className='primary-button' onClick={addTask}>保存部门任务</View>
          </View>}
        </View>

        <View className='flow-card card'>
          <View className='detail-section-title'><Text className='flow-card__title'>项目素材</Text><Text onClick={() => Taro.navigateTo({ url: `/pages/assets/index?projectId=${project.id}` })}>登记素材 →</Text></View>
          {assets.slice(0, 3).map(asset => <View className='detail-asset' key={asset.id}><View className={`detail-asset__icon detail-asset__icon--${asset.accent}`}><Text>{asset.category.slice(0, 1)}</Text></View><View><Text className='detail-asset__name'>{asset.name}</Text><Text className='detail-asset__meta'>{asset.owner} · {asset.size}</Text></View></View>)}
          {assets.length === 0 && <Text className='detail-empty-text'>照片、视频、海报与源文件都归到这里。</Text>}
        </View>

        {canReview ? <View className='review-panel card'><Text className='review-panel__title'>负责人审核</Text><Text className='review-panel__subtitle'>通过可留空；退回时请写明具体修改建议</Text><Textarea className='review-panel__textarea' placeholder='例如：请补充人物姓名与职务，确认照片授权……' placeholderClass='form-placeholder' value={note} onInput={event => setNote(event.detail.value)} maxlength={300} /><View className='button-row'><View className='danger-button' onClick={returnForEdit}>退回修改</View><View className='primary-button' onClick={approve}>审核通过</View></View></View> : <View className={`result-banner result-banner--${project.status}`}><Text className='result-banner__title'>{project.status === 'scheduled' ? '项目已进入发布排期' : project.status === 'returned' ? '项目已退回修改' : `当前状态：${project.statusLabel}`}</Text><Text className='result-banner__note'>审核通过只更新项目状态，不会自动操作真实账号。</Text></View>}
        {canSubmit && <View className='primary-button detail-submit' onClick={() => updateStatus('pending')}>提交负责人审核</View>}
      </View>
    </View>
  )
}
