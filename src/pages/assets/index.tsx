import { Input, Picker, ScrollView, Text, View } from '@tarojs/components'
import Taro, { useDidShow, useRouter } from '@tarojs/taro'
import { useState } from 'react'
import { Avatar, EmptyState, PageIntro } from '../../components/common'
import { AssetItem, AssetScope, Department, DEPARTMENTS, getAssets, getCurrentMember, getProjects, Member, ProjectItem, saveAsset } from '../../data'
import './index.scss'

const categories = ['全部', '图片', '视频', '音频', '设计源文件', '文档']
const extensions = ['jpg', 'mp4', 'm4a', 'psd', 'pdf']
const scopeTabs: { key: AssetScope; label: string }[] = [
  { key: 'shared', label: '组织共享库' },
  { key: 'department', label: '部门资料库' },
  { key: 'project', label: '项目素材' }
]

interface SelectedFile {
  name: string
  path: string
  size: string
}

function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  if (bytes >= 1024) return `${Math.ceil(bytes / 1024)} KB`
  return `${bytes} B`
}

function getExtension(name: string) {
  const parts = name.split('.')
  return parts.length > 1 ? (parts.pop() || 'file').toLowerCase() : 'file'
}

function getFileCategory(name: string) {
  const extension = getExtension(name)
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) return '图片'
  if (['mp4', 'mov', 'm4v'].includes(extension)) return '视频'
  if (['mp3', 'm4a', 'wav', 'aac'].includes(extension)) return '音频'
  if (['psd', 'ai', 'aep', 'prproj', 'sketch'].includes(extension)) return '设计源文件'
  return '文档'
}

export default function AssetsPage() {
  const router = useRouter()
  const [member, setMember] = useState<Member>()
  const [assets, setAssets] = useState<AssetItem[]>([])
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [scope, setScope] = useState<AssetScope>('shared')
  const [category, setCategory] = useState('全部')
  const [projectFilter, setProjectFilter] = useState('all')
  const [departmentIndex, setDepartmentIndex] = useState(0)
  const [keyword, setKeyword] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [typeIndex, setTypeIndex] = useState(0)
  const [projectIndex, setProjectIndex] = useState(0)
  const [selectedFile, setSelectedFile] = useState<SelectedFile>()

  useDidShow(() => {
    const current = getCurrentMember()
    if (!current) {
      Taro.reLaunch({ url: '/pages/login/index' })
      return
    }
    const allProjects = getProjects()
    const requestedProject = router.params.projectId || 'all'
    setMember(current)
    setProjects(allProjects)
    setAssets(getAssets())
    setScope(router.params.projectId ? 'project' : 'shared')
    setProjectFilter(requestedProject)
    setProjectIndex(Math.max(0, allProjects.findIndex(project => project.id === requestedProject)))
    setDepartmentIndex(current.department === '中心' ? 0 : Math.max(0, DEPARTMENTS.indexOf(current.department)))
    setShowForm(Boolean(router.params.projectId))
  })

  if (!member) return <View className='page' />

  const selectedDepartment: Department = member.role === '主任' ? DEPARTMENTS[departmentIndex] : member.department as Department
  const accessibleAssets = assets.filter(asset => (asset.scope || 'project') !== 'department' || member.role === '主任' || asset.department === member.department)
  const visibleAssets = accessibleAssets.filter(asset => {
    const assetScope = asset.scope || 'project'
    const matchesScope = assetScope === scope
    const matchesProject = scope !== 'project' || projectFilter === 'all' || asset.projectId === projectFilter
    const matchesDepartment = scope !== 'department' || asset.department === selectedDepartment
    return matchesScope && matchesProject && matchesDepartment && (category === '全部' || asset.category === category) && asset.name.toLowerCase().includes(keyword.toLowerCase())
  })

  const switchScope = (nextScope: AssetScope) => {
    setScope(nextScope)
    setShowForm(false)
    setSelectedFile(undefined)
  }

  const showAsset = (asset: AssetItem) => {
    const scopeLabel = asset.scope === 'shared' ? '组织共享资料素材库' : asset.scope === 'department' ? `${asset.department}资料库` : asset.project
    const fileNote = asset.localOnly ? '\n文件仅保存在本机，未上传云端。' : '\n当前为演示文件记录，未包含真实文件。'
    Taro.showModal({ title: asset.name, content: `所属位置：${scopeLabel}\n类型：${asset.category}\n大小：${asset.size}\n上传人：${asset.owner}\n更新时间：${asset.updated}${fileNote}`, showCancel: false, confirmText: '关闭', confirmColor: '#173f35' })
  }

  const openLocalFile = (asset: AssetItem, filePath: string) => {
    const extension = getExtension(asset.name)
    if (process.env.TARO_ENV === 'h5' && filePath.indexOf('blob:') === 0) {
      const opened = window.open(filePath, '_blank', 'noopener,noreferrer')
      if (!opened) Taro.showToast({ title: '浏览器阻止了新窗口，请允许弹出窗口', icon: 'none' })
      return
    }
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      Taro.previewImage({ urls: [filePath] })
      return
    }
    if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension)) {
      Taro.openDocument({ filePath, showMenu: true, fail: error => {
        console.error('[Assets] open document failed', error)
        Taro.showModal({ title: '暂时无法打开', content: '当前文件可能已过期或格式不受支持，请重新选择文件。', showCancel: false })
      } })
      return
    }
    Taro.showModal({ title: asset.name, content: '该文件已在本机登记。此格式暂不支持页面内预览，接入云存储后可按文件类型下载或播放。', showCancel: false, confirmColor: '#173f35' })
  }

  const openAsset = (asset: AssetItem) => {
    if (asset.filePath) {
      openLocalFile(asset, asset.filePath)
      return
    }
    if (asset.fileUrl) {
      Taro.showLoading({ title: '正在下载' })
      Taro.downloadFile({ url: asset.fileUrl, success: result => openLocalFile(asset, result.tempFilePath), fail: error => {
        console.error('[Assets] download failed', error)
        Taro.showModal({ title: '下载失败', content: '请检查文件地址、网络与下载域名配置后重试。', showCancel: false })
      }, complete: () => Taro.hideLoading() })
      return
    }
    showAsset(asset)
  }

  const addProjectAsset = () => {
    if (!name.trim()) {
      Taro.showToast({ title: '请填写素材名称', icon: 'none' })
      return
    }
    const project = projects[projectIndex]
    if (!project) return
    saveAsset({ id: `asset-${Date.now()}`, projectId: project.id, project: project.title, name: `${name.trim()}${name.includes('.') ? '' : `.${extensions[typeIndex]}`}`, category: categories[typeIndex + 1], size: '待补充', owner: member.name, updated: '刚刚', accent: project.accent, scope: 'project' })
    setAssets(getAssets())
    setName('')
    setShowForm(false)
    Taro.showToast({ title: '素材已归档', icon: 'success' })
  }

  const chooseFile = () => {
    if (process.env.TARO_ENV === 'h5') {
      const input = document.createElement('input')
      input.type = 'file'
      input.onchange = () => {
        const file = input.files && input.files[0]
        if (file) setSelectedFile({ name: file.name, path: URL.createObjectURL(file), size: formatSize(file.size) })
      }
      input.click()
      return
    }
    if (process.env.TARO_ENV !== 'weapp') {
      Taro.showModal({ title: '当前平台暂不支持选择文件', content: '请在电脑浏览器或微信小程序中使用资料库。', showCancel: false, confirmColor: '#173f35' })
      return
    }
    Taro.chooseMessageFile({ count: 1, type: 'file', success: result => {
      const file = result.tempFiles[0]
      if (file) setSelectedFile({ name: file.name, path: file.path, size: formatSize(file.size) })
    }, fail: error => {
      console.error('[Assets] choose file failed', error)
      if (!error.errMsg.includes('cancel')) Taro.showToast({ title: '文件选择失败', icon: 'none' })
    } })
  }

  const addLibraryFile = () => {
    if (!selectedFile) {
      Taro.showToast({ title: '请先选择文件', icon: 'none' })
      return
    }
    const department = selectedDepartment
    const tones = ['coral', 'blue', 'green', 'purple']
    const isShared = scope === 'shared'
    saveAsset({ id: `library-${Date.now()}`, projectId: isShared ? 'library-shared' : `library-${department}`, project: isShared ? '组织共享资料素材库' : `${department}资料库`, name: selectedFile.name, category: getFileCategory(selectedFile.name), size: selectedFile.size, owner: member.name, updated: '刚刚', accent: isShared ? 'green' : tones[DEPARTMENTS.indexOf(department)], scope, department: isShared ? undefined : department, filePath: selectedFile.path, localOnly: true })
    setAssets(getAssets())
    setSelectedFile(undefined)
    setShowForm(false)
    Taro.showModal({ title: '已加入本机资料库', content: '文件记录与本机路径已保存。当前未连接云存储，其他成员暂时无法从各自设备下载。', showCancel: false, confirmColor: '#173f35' })
  }

  return (
    <View className='page assets-page'>
      <View className='page__inner'>
        <PageIntro eyebrow='SHARED LIBRARY' title='资料与素材库' description='共享素材、部门文件与项目归档各归其位' extra={<View className='floating-add' onClick={() => setShowForm(!showForm)}><Text>{showForm ? '×' : '＋'}</Text></View>} />

        <View className='asset-summary'><View><Text className='asset-summary__value'>{accessibleAssets.filter(item => item.scope === 'shared').length}</Text><Text className='asset-summary__label'>共享文件</Text></View><View><Text className='asset-summary__value'>{accessibleAssets.filter(item => item.scope === 'department').length}</Text><Text className='asset-summary__label'>部门文件</Text></View><View><Text className='asset-summary__value'>{accessibleAssets.filter(item => (item.scope || 'project') === 'project').length}</Text><Text className='asset-summary__label'>项目素材</Text></View></View>

        <View className='asset-scope-tabs'>{scopeTabs.map(item => <View key={item.key} className={`asset-scope-tab ${scope === item.key ? 'asset-scope-tab--active' : ''}`} onClick={() => switchScope(item.key)}><Text>{item.label}</Text></View>)}</View>
        <Text className='asset-library-note'>{scope === 'shared' ? '全体成员均可查看和调用组织共享素材。' : scope === 'department' ? (member.role === '主任' ? '主任可查看四个部门资料库，请选择部门。' : `仅显示你有权限使用的${member.department}资料。`) : '按照活动项目登记照片、视频、音频和设计源文件。'}</Text>

        {showForm && <View className='card form-card asset-add-form'>
          {scope === 'project' ? <View>
            <View className='form-field'><Text className='form-field__label'>素材名称</Text><Input className='form-input' value={name} onInput={event => setName(event.detail.value)} placeholder='例如：运动会_颁奖仪式_精选01' placeholderClass='form-placeholder' /></View>
            <View className='form-field'><Text className='form-field__label'>所属项目</Text><Picker mode='selector' range={projects.map(project => project.title)} value={projectIndex} onChange={event => setProjectIndex(Number(event.detail.value))}><View className='form-picker'><Text>{projects[projectIndex] ? projects[projectIndex].title : '暂无项目'}</Text><Text className='form-picker__arrow'>⌄</Text></View></Picker></View>
            <View className='form-field'><Text className='form-field__label'>素材类型</Text><Picker mode='selector' range={categories.slice(1)} value={typeIndex} onChange={event => setTypeIndex(Number(event.detail.value))}><View className='form-picker'><Text>{categories[typeIndex + 1]}</Text><Text className='form-picker__arrow'>⌄</Text></View></Picker></View>
            <View className='primary-button' onClick={addProjectAsset}>保存素材记录</View>
          </View> : <View>
            {scope === 'department' && <View className='form-field'><Text className='form-field__label'>所属部门</Text>{member.role === '主任' ? <Picker mode='selector' range={[...DEPARTMENTS]} value={departmentIndex} onChange={event => setDepartmentIndex(Number(event.detail.value))}><View className='form-picker'><Text>{selectedDepartment}</Text><Text>⌄</Text></View></Picker> : <View className='form-picker'><Text>{member.department}</Text></View>}</View>}
            <View className='asset-file-picker' onClick={chooseFile}><Text className='asset-file-picker__mark'>＋</Text><Text className='asset-file-picker__title'>{selectedFile ? selectedFile.name : '选择本机文件'}</Text><Text className='asset-file-picker__note'>{selectedFile ? `${selectedFile.size} · 点击可重新选择` : process.env.TARO_ENV === 'weapp' ? '微信端可从聊天文件中选择文档、图片、视频或源文件' : '电脑端可从文件管理器选择文档、图片、视频或源文件'}</Text></View>
            <View className='primary-button' onClick={addLibraryFile}>加入{scope === 'shared' ? '组织共享库' : `${selectedDepartment}资料库`}</View>
            <Text className='asset-form-note'>{process.env.TARO_ENV === 'h5' ? '电脑端文件仅在当前浏览器会话有效，不会上传云端或同步给其他成员。' : '当前为本机文件演示，不会上传到云端或同步给其他成员。'}</Text>
          </View>}
        </View>}

        <View className='search-box'><Text className='search-box__icon'>⌕</Text><Input className='search-box__input' placeholder='搜索当前资料库' placeholderClass='form-placeholder' value={keyword} onInput={event => setKeyword(event.detail.value)} />{keyword && <Text className='search-box__clear' onClick={() => setKeyword('')}>×</Text>}</View>
        <ScrollView scrollX className='filter-scroll asset-filters'>{categories.map(item => <Text key={item} className={`filter-chip ${category === item ? 'filter-chip--active' : ''}`} onClick={() => setCategory(item)}>{item}</Text>)}</ScrollView>
        {scope === 'project' && <ScrollView scrollX className='filter-scroll asset-filters'><Text className={`filter-chip ${projectFilter === 'all' ? 'filter-chip--active' : ''}`} onClick={() => setProjectFilter('all')}>全部项目</Text>{projects.map(project => <Text key={project.id} className={`filter-chip ${projectFilter === project.id ? 'filter-chip--active' : ''}`} onClick={() => setProjectFilter(project.id)}>{project.title}</Text>)}</ScrollView>}
        {scope === 'department' && member.role === '主任' && <ScrollView scrollX className='filter-scroll asset-filters'>{DEPARTMENTS.map((department, index) => <Text key={department} className={`filter-chip ${departmentIndex === index ? 'filter-chip--active' : ''}`} onClick={() => setDepartmentIndex(index)}>{department}</Text>)}</ScrollView>}

        <View className='asset-list-heading'><Text>{scope === 'shared' ? '组织共享文件' : scope === 'department' ? `${selectedDepartment}文件` : '项目文件'}</Text><Text>{visibleAssets.length} 条记录</Text></View>
        <View className='asset-grid'>
          {visibleAssets.map(asset => <View className='asset-card card' key={asset.id} onClick={() => showAsset(asset)}><View className={`asset-card__preview asset-card__preview--${asset.accent}`}><View className='asset-card__shape asset-card__shape--one' /><View className='asset-card__shape asset-card__shape--two' /><Text className='asset-card__extension'>{getExtension(asset.name).toUpperCase()}</Text><Text className='asset-card__category'>{asset.category}</Text></View><View className='asset-card__body'><Text className='asset-card__name'>{asset.name}</Text><Text className='asset-card__meta'>{asset.size} · {asset.updated}</Text><View className='asset-card__owner'><Avatar name={asset.owner} tone={asset.accent} small /><Text>{asset.owner}</Text></View><View className='asset-card__action' onClick={event => { event.stopPropagation(); openAsset(asset) }}><Text>{asset.filePath || asset.fileUrl ? '打开 / 下载' : '查看记录'}</Text><Text>→</Text></View></View></View>)}
        </View>
        {visibleAssets.length === 0 && <View className='card'><EmptyState title='没有找到相关文件' description='换个分类试试，也可以添加新的资料或素材记录。' /></View>}
        <View className='demo-notice'>当前文件选择仅保存本机路径和记录，临时文件可能失效，其他成员无法跨设备下载。正式多人共享仍需接入服务端文件存储、访问权限和下载域名。</View>
      </View>
    </View>
  )
}
