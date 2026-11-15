import { Input, Picker, Text, Textarea, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { PageIntro } from '../../components/common'
import { Department, DEPARTMENTS, getMembers, getShortDate, saveEvent, saveProject, saveTask } from '../../data'
import './index.scss'

const channels = ['公众号 + 抖音', '微信公众号：宁夏理工学院新青年', '抖音号：宁夏理工学院']
const formats = ['图文 / 短视频', '图文 / 海报', '短视频']
const slots = ['今天 18:00', '明天 12:00', '后天 18:00', '三天后 12:00']
const tones = ['coral', 'blue', 'green', 'purple']

export default function Create() {
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [deliverable, setDeliverable] = useState('')
  const [channelIndex, setChannelIndex] = useState(0)
  const [departmentIndex, setDepartmentIndex] = useState(0)
  const [ownerIndex, setOwnerIndex] = useState(0)
  const [dayIndex, setDayIndex] = useState(0)
  const department = DEPARTMENTS[departmentIndex]
  const candidates = getMembers().filter(member => member.status === 'active' && member.department === department)
  const owner = candidates[ownerIndex] || candidates[0]

  const submit = () => {
    if (!title.trim()) {
      Taro.showToast({ title: '请填写活动项目名称', icon: 'none' })
      return
    }
    if (!deliverable.trim()) {
      Taro.showToast({ title: '请写清首项任务交付物', icon: 'none' })
      return
    }
    if (!owner) {
      Taro.showToast({ title: '该部门暂无成员档案', icon: 'none' })
      return
    }
    const id = `project-${Date.now()}`
    saveProject({ id, title: title.trim(), channel: channels[channelIndex], format: formats[channelIndex], status: 'draft', statusLabel: '待分工', time: slots[dayIndex], owner: owner.name, department: department as Department, dayOffset: dayIndex, accent: tones[departmentIndex], summary: description.trim() || '项目说明待补充，请负责人及时完善。', location: location.trim() || '地点待定', progress: 10 })
    saveTask({ id: `task-${Date.now()}`, projectId: id, title: `${department}完成「${title.trim()}」首项交付`, project: title.trim(), ownerId: owner.id, owner: owner.name, department: department as Department, due: slots[dayIndex], priority: '中', progress: 0, done: false, accent: tones[departmentIndex], deliverable: deliverable.trim() })
    saveEvent({ id: `event-${Date.now()}`, projectId: id, title: title.trim(), time: '时间待确认', dayOffset: dayIndex, location: location.trim() || '地点待定', owner: `${owner.name} · ${department}`, type: '项目', accent: tones[departmentIndex] })
    Taro.showToast({ title: '项目已创建', icon: 'success' })
    setTimeout(() => Taro.navigateBack(), 650)
  }

  return (
    <View className='page create-page'>
      <View className='page__inner'>
        <PageIntro eyebrow='ONE PROJECT, ONE WORKFLOW' title='新建活动项目' description='先说明活动，再派清首项任务' />
        <View className='create-form card form-card'>
          <View className='form-field'><Text className='form-field__label'><Text className='form-field__required'>*</Text>项目名称</Text><Input className='form-input' value={title} onInput={event => setTitle(event.detail.value)} placeholder='例如：冬日暖阳志愿服务报道' placeholderClass='form-placeholder' maxlength={80} /></View>
          <View className='form-field'><Text className='form-field__label'>发布渠道</Text><Picker mode='selector' range={channels} value={channelIndex} onChange={event => setChannelIndex(Number(event.detail.value))}><View className='form-picker'><Text>{channels[channelIndex]}</Text><Text className='form-picker__arrow'>⌄</Text></View></Picker></View>
          <View className='form-field'><Text className='form-field__label'>计划交付</Text><Picker mode='selector' range={slots} value={dayIndex} onChange={event => setDayIndex(Number(event.detail.value))}><View className='form-picker'><Text>{slots[dayIndex]} · {getShortDate(dayIndex)}</Text><Text className='form-picker__arrow'>⌄</Text></View></Picker></View>
          <View className='form-field'><Text className='form-field__label'>活动地点</Text><Input className='form-input' value={location} onInput={event => setLocation(event.detail.value)} placeholder='例如：星海社区；线上协作也可' placeholderClass='form-placeholder' /></View>
          <View className='form-field'><Text className='form-field__label'>项目说明</Text><Textarea className='form-textarea' value={description} onInput={event => setDescription(event.detail.value)} placeholder='说明活动背景、内容角度和需要哪些部门配合……' placeholderClass='form-placeholder' maxlength={500} /></View>
        </View>

        <View className='create-section-title'><Text>首项任务</Text><Text>其他部门可在项目内继续分工</Text></View>
        <View className='create-form card form-card'>
          <View className='form-field'><Text className='form-field__label'>负责部门</Text><Picker mode='selector' range={[...DEPARTMENTS]} value={departmentIndex} onChange={event => { setDepartmentIndex(Number(event.detail.value)); setOwnerIndex(0) }}><View className='form-picker'><Text>{department}</Text><Text className='form-picker__arrow'>⌄</Text></View></Picker></View>
          <View className='form-field'><Text className='form-field__label'>负责人</Text><Picker mode='selector' range={candidates.map(member => `${member.name} · ${member.role}`)} value={ownerIndex} onChange={event => setOwnerIndex(Number(event.detail.value))}><View className='form-picker'><Text>{owner ? `${owner.name} · ${owner.role}` : '暂无成员'}</Text><Text className='form-picker__arrow'>⌄</Text></View></Picker></View>
          <View className='form-field'><Text className='form-field__label'><Text className='form-field__required'>*</Text>交付要求</Text><Textarea className='form-textarea' value={deliverable} onInput={event => setDeliverable(event.detail.value)} placeholder='例如：20 张精修 JPG 照片，按项目_内容_序号命名' placeholderClass='form-placeholder' maxlength={300} /></View>
        </View>
        <View className='form-footer'><View className='primary-button' onClick={submit}>创建项目与首项任务</View><Text className='form-tip'>仅保存到本机演示数据，不会向成员发送真实通知。</Text></View>
      </View>
    </View>
  )
}
