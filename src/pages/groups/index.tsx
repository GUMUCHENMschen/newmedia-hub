import { Input, ScrollView, Text, View } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { Avatar } from '../../components/common'
import { Department, DEPARTMENTS, getCurrentMember, getMemberTitle, getMessages, GroupKey, Member, saveMessage } from '../../data'
import './index.scss'

export default function Groups() {
  const [member, setMember] = useState<Member>()
  const [group, setGroup] = useState<GroupKey>('all')
  const [department, setDepartment] = useState<Department>('摄影部')
  const [messages, setMessages] = useState(getMessages())
  const [content, setContent] = useState('')

  useDidShow(() => {
    const current = getCurrentMember()
    if (!current) {
      Taro.reLaunch({ url: '/pages/login/index' })
      return
    }
    setMember(current)
    setMessages(getMessages())
  })

  if (!member) return <View className='page' />
  const ownDepartment = member.department === '中心' ? department : member.department
  const visibleMessages = messages.filter(message => message.group === group)
  const groupTitle = group === 'all' ? '新媒体中心总工作群' : `${group}工作小群`

  const switchGroup = (target: 'all' | 'department') => setGroup(target === 'all' ? 'all' : ownDepartment)
  const selectDepartment = (value: Department) => {
    setDepartment(value)
    setGroup(value)
  }

  const send = () => {
    if (!content.trim()) return
    const now = new Date()
    saveMessage({ id: `message-${Date.now()}`, group, senderId: member.id, sender: member.name, content: content.trim(), time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}` })
    setMessages(getMessages())
    setContent('')
  }

  return (
    <View className='page groups-page'>
      <View className='page__inner'>
        <View className='groups-heading'><Text className='groups-heading__eyebrow'>TEAM MESSAGES</Text><Text className='groups-heading__title'>工作群聊</Text><Text className='groups-heading__note'>总群看统筹，部门群只讨论具体执行</Text></View>
        <View className='group-switch'><View className={group === 'all' ? 'group-switch__item group-switch__item--active' : 'group-switch__item'} onClick={() => switchGroup('all')}><Text>总工作群</Text></View><View className={group !== 'all' ? 'group-switch__item group-switch__item--active' : 'group-switch__item'} onClick={() => switchGroup('department')}><Text>我的部门群</Text></View></View>

        {member.department === '中心' && group !== 'all' && <ScrollView scrollX className='filter-scroll department-scroll'>{DEPARTMENTS.map(item => <Text key={item} className={`filter-chip ${department === item ? 'filter-chip--active' : ''}`} onClick={() => selectDepartment(item)}>{item}</Text>)}</ScrollView>}

        <View className='chat-card card'>
          <View className='chat-card__header'><View><Text className='chat-card__title'>{groupTitle}</Text><Text className='chat-card__subtitle'>{group === 'all' ? '主任与四部门负责人协同' : `${getMemberTitle(member)} · 部门内部协作`}</Text></View><View className='chat-card__badge'><Text>演示</Text></View></View>
          <View className='chat-rule'><Text>任务以项目页为准，群聊只用于补充沟通，避免再次分散素材。</Text></View>
          <View className='message-list'>
            {visibleMessages.map(message => {
              const mine = message.senderId === member.id
              return <View className={`message-row ${mine ? 'message-row--mine' : ''}`} key={message.id}>{!mine && <Avatar name={message.sender} tone='green' small />}<View className='message-row__body'><View className='message-row__meta'><Text>{mine ? '我' : message.sender}</Text><Text>{message.time}</Text></View><View className='message-bubble'><Text>{message.content}</Text></View></View></View>
            })}
            {visibleMessages.length === 0 && <View className='message-empty'><Text>还没有消息，发送第一条部门协作说明。</Text></View>}
          </View>
          <View className='chat-composer'><Input value={content} onInput={event => setContent(event.detail.value)} onConfirm={send} confirmType='send' placeholder='补充沟通，不替代任务与素材归档' placeholderClass='form-placeholder' /><View className='chat-send' onClick={send}><Text>发送</Text></View></View>
        </View>
        <View className='demo-notice'>本页为应用内群聊演示，消息仅保存在本机，不能实现跨成员同步，也不会跳转微信或 QQ 群。</View>
      </View>
    </View>
  )
}
