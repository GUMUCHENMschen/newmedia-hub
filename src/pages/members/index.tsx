import { Input, Picker, Text, View } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { Avatar, EmptyState, PageIntro, SectionHeader } from '../../components/common'
import { buildInviteMessage, Department, DEPARTMENTS, getCurrentMember, getMembers, getMemberTitle, inviteMember, Member, reviewMember, Role, updateMemberAccess } from '../../data'
import './index.scss'

const roles: Role[] = ['主任', '部长', '部员']

export default function MembersPage() {
  const [member, setMember] = useState<Member>()
  const [members, setMembers] = useState<Member[]>([])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [roleIndex, setRoleIndex] = useState(2)
  const [departmentIndex, setDepartmentIndex] = useState(0)
  const [college, setCollege] = useState('')
  const [major, setMajor] = useState('')
  const [className, setClassName] = useState('')
  const [inviteMessage, setInviteMessage] = useState('')
  const [editingId, setEditingId] = useState('')
  const [editRoleIndex, setEditRoleIndex] = useState(2)
  const [editDepartmentIndex, setEditDepartmentIndex] = useState(0)

  useDidShow(() => {
    const current = getCurrentMember()
    if (!current) {
      Taro.reLaunch({ url: '/pages/login/index' })
      return
    }
    if (current.role === '部员') {
      Taro.showToast({ title: '仅主任和部长可管理成员', icon: 'none' })
      Taro.navigateBack()
      return
    }
    setMember(current)
    setMembers(getMembers())
    if (current.role === '部长') setDepartmentIndex(Math.max(0, DEPARTMENTS.indexOf(current.department as Department)))
  })

  if (!member) return <View className='page' />

  const isDirector = member.role === '主任'
  const visibleMembers = members.filter(item => isDirector || item.department === member.department)
  const pendingMembers = members.filter(item => item.status === 'pending')
  const activeCount = visibleMembers.filter(item => item.status === 'active').length

  const showResult = (ok: boolean, message: string) => {
    if (ok) Taro.showToast({ title: message, icon: 'none', duration: 2200 })
    else Taro.showModal({ title: '操作未完成', content: message, showCancel: false, confirmColor: '#173f35' })
  }

  const submitInvitation = () => {
    const role = isDirector ? roles[roleIndex] : '部员'
    const department = isDirector ? (role === '主任' ? '中心' : DEPARTMENTS[departmentIndex]) : member.department
    const result = inviteMember(member.id, { name, phone, role, department, college, major, className })
    if (!result.ok || !result.member) {
      showResult(false, result.message)
      return
    }
    const allMembers = getMembers()
    setMembers(allMembers)
    setInviteMessage(buildInviteMessage(result.member, member))
    setName('')
    setPhone('')
    setCollege('')
    setMajor('')
    setClassName('')
    setShowForm(false)
    Taro.showToast({ title: isDirector ? '邀请已登记' : '已提交主任审核', icon: 'success' })
  }

  const copyInviteMessage = () => {
    Taro.setClipboardData({ data: inviteMessage, success: () => Taro.showToast({ title: '邀请短信已复制', icon: 'none' }) })
  }

  const review = (target: Member, approved: boolean) => {
    const execute = () => {
      const result = reviewMember(member.id, target.id, approved)
      if (result.ok) setMembers(getMembers())
      showResult(result.ok, approved && result.ok ? '已通过审核' : result.message)
    }
    if (approved) execute()
    else Taro.showModal({ title: '拒绝这条成员申请？', content: `将移除 ${target.name} 的待审核记录。`, confirmColor: '#a55349', success: result => { if (result.confirm) execute() } })
  }

  const startEdit = (target: Member) => {
    setEditingId(editingId === target.id ? '' : target.id)
    setEditRoleIndex(roles.indexOf(target.role))
    setEditDepartmentIndex(Math.max(0, DEPARTMENTS.indexOf(target.department as Department)))
  }

  const saveAccess = (target: Member) => {
    const role = roles[editRoleIndex]
    const department = role === '主任' ? '中心' : DEPARTMENTS[editDepartmentIndex]
    const result = updateMemberAccess(member.id, target.id, role, department)
    if (result.ok) {
      setMembers(getMembers())
      setEditingId('')
    }
    showResult(result.ok, result.message)
  }

  const inviterName = (target: Member) => {
    const inviter = members.find(item => item.id === target.invitedById)
    return inviter ? inviter.name : '邀请人已离开名单'
  }

  return (
    <View className='page members-page'>
      <View className='page__inner'>
        <PageIntro eyebrow='MEMBERS & ACCESS' title='成员与邀请' description={isDirector ? '统筹成员职位、部门与加入审核' : `仅添加${member.department}部员，主任审核后加入`} extra={<View className='floating-add' onClick={() => setShowForm(!showForm)}><Text>{showForm ? '×' : '＋'}</Text></View>} />

        <View className='member-summary'><View><Text className='member-summary__value'>{activeCount}</Text><Text className='member-summary__label'>正式成员</Text></View><View><Text className='member-summary__value'>{isDirector ? pendingMembers.length : visibleMembers.filter(item => item.status === 'pending').length}</Text><Text className='member-summary__label'>待主任审核</Text></View><View><Text className='member-summary__value'>{isDirector ? members.filter(item => item.role === '主任' && item.status === 'active').length : 1}</Text><Text className='member-summary__label'>{isDirector ? '现任主任' : '本部门'}</Text></View></View>

        {showForm && <View className='card form-card member-form'>
          <View className='form-field'><Text className='form-field__label'><Text className='form-field__required'>*</Text>姓名</Text><Input className='form-input' value={name} onInput={event => setName(event.detail.value)} placeholder='填写面试通过成员姓名' placeholderClass='form-placeholder' /></View>
          <View className='form-field'><Text className='form-field__label'><Text className='form-field__required'>*</Text>登录手机号</Text><Input className='form-input' type='number' maxlength={11} value={phone} onInput={event => setPhone(event.detail.value)} placeholder='用于内部白名单匹配' placeholderClass='form-placeholder' /></View>
          {isDirector && <View className='form-field'><Text className='form-field__label'>职位</Text><Picker mode='selector' range={roles} value={roleIndex} onChange={event => setRoleIndex(Number(event.detail.value))}><View className='form-picker'><Text>{roles[roleIndex]}</Text><Text>⌄</Text></View></Picker></View>}
          <View className='form-field'><Text className='form-field__label'>所属部门</Text>{isDirector && roles[roleIndex] !== '主任' ? <Picker mode='selector' range={[...DEPARTMENTS]} value={departmentIndex} onChange={event => setDepartmentIndex(Number(event.detail.value))}><View className='form-picker'><Text>{DEPARTMENTS[departmentIndex]}</Text><Text>⌄</Text></View></Picker> : <View className='form-picker'><Text>{isDirector && roles[roleIndex] === '主任' ? '中心 · 主任团队' : member.department}</Text></View>}</View>
          <View className='form-field'><Text className='form-field__label'>学院</Text><Input className='form-input' value={college} onInput={event => setCollege(event.detail.value)} placeholder='登录前预先登记' placeholderClass='form-placeholder' /></View>
          <View className='form-field'><Text className='form-field__label'>专业</Text><Input className='form-input' value={major} onInput={event => setMajor(event.detail.value)} placeholder='登录前预先登记' placeholderClass='form-placeholder' /></View>
          <View className='form-field'><Text className='form-field__label'>班级</Text><Input className='form-input' value={className} onInput={event => setClassName(event.detail.value)} placeholder='例如：电自24105班' placeholderClass='form-placeholder' /></View>
          <View className='primary-button' onClick={submitInvitation}>{isDirector ? '登记邀请并生成短信' : '提交审核并生成短信'}</View>
          <Text className='member-form__tip'>{isDirector ? '主任邀请的主任、部长和部员直接进入白名单。' : '部长只能添加本部门部员，主任审核前该手机号不能登录。'}</Text>
        </View>}

        {inviteMessage && <View className='invite-message card'><Text className='invite-message__title'>邀请短信已生成</Text><Text className='invite-message__content'>{inviteMessage}</Text><Text className='invite-message__note'>请复制后由你本人使用手机短信应用发送。小程序不会也不能冒用你的私人手机号自动发送。</Text><View className='secondary-button' onClick={copyInviteMessage}>复制邀请短信</View></View>}

        {isDirector && <View className='member-section'><SectionHeader title='待审核部员' action={`${pendingMembers.length} 条`} />{pendingMembers.length > 0 ? <View className='pending-list'>{pendingMembers.map(item => <View className='pending-card card' key={item.id}><View className='pending-card__top'><Text className='pending-card__name'>{item.name}</Text><Text className='pending-card__department'>{item.department}</Text></View><Text className='pending-card__meta'>{item.phone} · {item.college}</Text><Text className='pending-card__meta'>{item.major} · {item.className}</Text><Text className='pending-card__inviter'>邀请人：{inviterName(item)} · 审核通过后才能登录</Text><View className='pending-card__actions'><View className='danger-button' onClick={() => review(item, false)}>拒绝</View><View className='primary-button' onClick={() => review(item, true)}>通过审核</View></View></View>)}</View> : <View className='card'><EmptyState title='暂无待审核成员' description='部长添加部员后，会在这里等待主任审核。' /></View>}</View>}

        <View className='member-section'><SectionHeader title={isDirector ? '全部成员' : `${member.department}成员`} action={`${visibleMembers.length} 人`} /><View className='member-list'>{visibleMembers.map(item => <View className='member-card card' key={item.id}><View className='member-row'><Avatar name={item.name} tone={item.accent} /><View className='member-copy'><View className='member-name-row'><Text className='member-name'>{item.name}</Text><Text className={`member-title ${item.status === 'pending' ? 'member-title--pending' : ''}`}>{item.status === 'pending' ? '待审核' : getMemberTitle(item)}</Text></View><Text className='member-meta'>{item.phone} · {item.department}</Text><Text className='member-meta'>{item.college} · {item.major} · {item.className}</Text></View>{isDirector && item.id !== member.id && <Text className='member-adjust' onClick={() => startEdit(item)}>{editingId === item.id ? '收起' : '调整'}</Text>}</View>{isDirector && editingId === item.id && <View className='member-editor'><View className='form-field'><Text className='form-field__label'>职位</Text><Picker mode='selector' range={roles} value={editRoleIndex} onChange={event => setEditRoleIndex(Number(event.detail.value))}><View className='form-picker'><Text>{roles[editRoleIndex]}</Text><Text>⌄</Text></View></Picker></View><View className='form-field'><Text className='form-field__label'>部门</Text>{roles[editRoleIndex] === '主任' ? <View className='form-picker'><Text>中心 · 主任团队</Text></View> : <Picker mode='selector' range={[...DEPARTMENTS]} value={editDepartmentIndex} onChange={event => setEditDepartmentIndex(Number(event.detail.value))}><View className='form-picker'><Text>{DEPARTMENTS[editDepartmentIndex]}</Text><Text>⌄</Text></View></Picker>}</View><View className='primary-button' onClick={() => saveAccess(item)}>保存职位与部门</View></View>}</View>)}</View></View>

        <View className='demo-notice'>当前为本机白名单演示：已邀请且审核通过的手机号才能登录，但仅凭手机号不能构成正式安全认证。正式上线仍需服务端白名单、微信身份绑定和短信验证码。</View>
      </View>
    </View>
  )
}
