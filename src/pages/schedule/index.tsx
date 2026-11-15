import { Text, View } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { Avatar, EmptyState, PageIntro } from '../../components/common'
import { CourseItem, EventItem, getCourses, getDateAtOffset, getEvents, getShortDate } from '../../data'
import './index.scss'

const weekNames = ['日', '一', '二', '三', '四', '五', '六']

export default function Schedule() {
  const [events, setEvents] = useState<EventItem[]>([])
  const [courses, setCourses] = useState<CourseItem[]>([])
  const [selectedDay, setSelectedDay] = useState(0)
  useDidShow(() => { setEvents(getEvents()); setCourses(getCourses()) })
  const visibleEvents = events.filter(event => event.dayOffset === selectedDay)
  const days = Array.from({ length: 4 }, (_, index) => getDateAtOffset(index))
  const selectedDate = days[selectedDay]
  const courseDay = selectedDate.getDay() === 0 ? 7 : selectedDate.getDay()
  const visibleCourses = courses.filter(course => course.day === courseDay)

  const showEvent = (event: EventItem) => Taro.showModal({ title: event.title, content: `时间：${getShortDate(event.dayOffset)} ${event.time}\n地点：${event.location}\n参与人：${event.owner}\n类型：${event.type}`, showCancel: false, confirmText: '知道了', confirmColor: '#173f35' })

  return (
    <View className='page schedule-page'>
      <View className='page__inner'>
        <PageIntro eyebrow='WORK & COURSES' title='工作与课表' description='部长分工前，先确认课程与现场安排' extra={<View className='floating-add' onClick={() => Taro.navigateTo({ url: '/pages/create/index' })}><Text>＋</Text></View>} />
        <View className='schedule-days'>{days.map((date, index) => <View className={`schedule-day ${selectedDay === index ? 'schedule-day--active' : ''}`} key={index} onClick={() => setSelectedDay(index)}><Text className='schedule-day__week'>{index === 0 ? '今天' : `周${weekNames[date.getDay()]}`}</Text><Text className='schedule-day__date'>{date.getDate()}</Text><Text className='schedule-day__count'>{events.filter(event => event.dayOffset === index).length} 项工作</Text></View>)}</View>

        <View className='schedule-list-heading'><Text>{selectedDay === 0 ? '今日课程' : getShortDate(selectedDay)}</Text><Text onClick={() => Taro.navigateTo({ url: '/pages/school/index' })}>维护课表 →</Text></View>
        <View className='schedule-course-card card'>
          {visibleCourses.map(course => <View className='schedule-course' key={course.id}><Text className='schedule-course__period'>{course.period}</Text><View><Text className='schedule-course__name'>{course.name}</Text><Text className='schedule-course__meta'>{course.room} · {course.weeks}</Text></View></View>)}
          {visibleCourses.length === 0 && <Text className='schedule-course__empty'>当天暂无课程记录，可结合实际情况协商分工。</Text>}
        </View>

        <View className='schedule-list-heading'><Text>工作安排</Text><Text>{visibleEvents.length} 项日程</Text></View>
        <View className='schedule-list'>
          {visibleEvents.map(event => <View className='schedule-card card' key={event.id} onClick={() => showEvent(event)}><View className={`schedule-card__time schedule-card__time--${event.accent}`}><Text>{event.time.split('—')[0]}</Text><Text>{event.type}</Text></View><View className='schedule-card__body'><Text className='schedule-card__title'>{event.title}</Text><Text className='schedule-card__location'>{event.location}</Text><View className='schedule-card__footer'><Avatar name={event.owner} tone={event.accent} small /><Text>{event.owner}</Text><Text className='schedule-card__duration'>{event.time}</Text></View></View></View>)}
          {visibleEvents.length === 0 && <View className='card'><EmptyState title='当天暂无工作安排' description='可新建活动项目，再与成员协商具体时间。' /></View>}
        </View>

        <View className='equipment-card card'><View className='equipment-card__heading'><Text className='equipment-card__title'>拍摄准备清单</Text><Text className='equipment-card__tag'>出发前确认</Text></View>{['相机、备用电池与存储卡', '采访提纲与出镜人员确认', '场地拍摄许可与天气确认', '素材命名规则与项目归档位置'].map((item, index) => <View className='equipment-row' key={item}><View className='equipment-row__check'><Text>{index + 1}</Text></View><Text>{item}</Text></View>)}</View>
      </View>
    </View>
  )
}
