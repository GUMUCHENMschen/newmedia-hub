import { Input, Picker, Text, View } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { PageIntro } from '../../components/common'
import { CourseItem, getCourses, getCurrentMember, Member, saveCourse, saveMember, SCHOOL_CAS_URL } from '../../data'
import './index.scss'

const weekDays = ['周一', '周二', '周三', '周四', '周五']

export default function School() {
  const [member, setMember] = useState<Member>()
  const [college, setCollege] = useState('')
  const [major, setMajor] = useState('')
  const [className, setClassName] = useState('')
  const [courses, setCourses] = useState<CourseItem[]>([])
  const [showCourseForm, setShowCourseForm] = useState(false)
  const [courseName, setCourseName] = useState('')
  const [dayIndex, setDayIndex] = useState(0)
  const [period, setPeriod] = useState('1—2节')
  const [room, setRoom] = useState('')

  useDidShow(() => {
    const current = getCurrentMember()
    if (!current) {
      Taro.reLaunch({ url: '/pages/login/index' })
      return
    }
    setMember(current)
    setCollege(current.college)
    setMajor(current.major)
    setClassName(current.className)
    setCourses(getCourses())
  })

  if (!member) return <View className='page' />

  const saveProfile = () => {
    const updated = { ...member, college: college.trim() || '待确认', major: major.trim() || '待确认', className: className.trim() || '待确认' }
    saveMember(updated)
    setMember(updated)
    Taro.showToast({ title: '资料已保存', icon: 'success' })
  }

  const copyUrl = () => {
    Taro.setClipboardData({ data: SCHOOL_CAS_URL, success: () => Taro.showToast({ title: '网址已复制', icon: 'none' }) })
  }

  const addCourse = () => {
    if (!courseName.trim()) {
      Taro.showToast({ title: '请填写课程名称', icon: 'none' })
      return
    }
    saveCourse({ id: `course-${Date.now()}`, day: dayIndex + 1, period: period.trim() || '时间待定', name: courseName.trim(), room: room.trim() || '地点待定', teacher: '待填写', weeks: '周次待确认' })
    setCourses(getCourses())
    setCourseName('')
    setRoom('')
    setShowCourseForm(false)
  }

  return (
    <View className='page school-page'>
      <View className='page__inner'>
        <PageIntro eyebrow='PROFILE & COURSES' title='学籍与课表' description='资料先确认，分工时再看课程时间' />

        <View className='school-section-title'><Text>成员学籍资料</Text><Text>入职与面试后确认</Text></View>
        <View className='card form-card'>
          <View className='form-field'><Text className='form-field__label'>学院</Text><Input className='form-input' value={college} onInput={event => setCollege(event.detail.value)} placeholder='手动填写学院' placeholderClass='form-placeholder' /></View>
          <View className='form-field'><Text className='form-field__label'>专业</Text><Input className='form-input' value={major} onInput={event => setMajor(event.detail.value)} placeholder='手动填写专业' placeholderClass='form-placeholder' /></View>
          <View className='form-field'><Text className='form-field__label'>班级</Text><Input className='form-input' value={className} onInput={event => setClassName(event.detail.value)} placeholder='手动填写班级' placeholderClass='form-placeholder' /></View>
          <View className='school-save'><View className='primary-button' onClick={saveProfile}>保存成员资料</View></View>
        </View>

        <View className='school-section-title'><Text>本周课表</Text><Text onClick={() => setShowCourseForm(!showCourseForm)}>{showCourseForm ? '收起' : '＋ 添加课程'}</Text></View>
        {showCourseForm && <View className='card form-card course-form'>
          <View className='form-field'><Text className='form-field__label'>课程名称</Text><Input className='form-input' value={courseName} onInput={event => setCourseName(event.detail.value)} placeholder='例如：新媒体文案写作' placeholderClass='form-placeholder' /></View>
          <View className='form-field'><Text className='form-field__label'>上课日</Text><Picker mode='selector' range={weekDays} value={dayIndex} onChange={event => setDayIndex(Number(event.detail.value))}><View className='form-picker'><Text>{weekDays[dayIndex]}</Text><Text>⌄</Text></View></Picker></View>
          <View className='form-field'><Text className='form-field__label'>节次</Text><Input className='form-input' value={period} onInput={event => setPeriod(event.detail.value)} /></View>
          <View className='form-field'><Text className='form-field__label'>教室</Text><Input className='form-input' value={room} onInput={event => setRoom(event.detail.value)} placeholder='例如：文科楼 204' placeholderClass='form-placeholder' /></View>
          <View className='primary-button' onClick={addCourse}>添加课程</View>
        </View>}
        <View className='course-list'>
          {weekDays.map((day, index) => {
            const dailyCourses = courses.filter(course => course.day === index + 1)
            return <View className='course-day card' key={day}><View className='course-day__heading'><Text>{day}</Text><Text>{dailyCourses.length} 门课</Text></View>{dailyCourses.map(course => <View className='course-row' key={course.id}><View className='course-row__time'><Text>{course.period}</Text></View><View className='course-row__copy'><Text className='course-row__name'>{course.name}</Text><Text className='course-row__meta'>{course.room} · {course.teacher}</Text><Text className='course-row__meta'>{course.weeks}</Text></View></View>)}{dailyCourses.length === 0 && <Text className='course-day__empty'>暂无课程，可用于协商工作安排</Text>}</View>
          })}
        </View>
        <View className='demo-notice'>当前课表为本机演示数据，添加与修改不会同步到学校教务系统。</View>

        <View className='school-platform card'>
          <View className='school-platform__top'><View className='school-platform__mark'><Text>教</Text></View><View><Text className='school-platform__title'>学校统一身份认证</Text><Text className='school-platform__status'>官方网址 · 复制后使用</Text></View></View>
          <Text className='school-platform__note'>如需访问学校教务平台，请复制以下网址后使用。小程序不读取账号、密码、Cookie 或教务数据，学籍与课表仍需手动维护。</Text>
          <View className='school-url-value'><Text selectable>{SCHOOL_CAS_URL}</Text></View>
          <View className='secondary-button' onClick={copyUrl}>复制教务平台网址</View>
        </View>
      </View>
    </View>
  )
}
