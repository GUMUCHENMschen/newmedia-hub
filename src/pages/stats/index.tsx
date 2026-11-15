import { Text, View } from '@tarojs/components'
import { useState } from 'react'
import { PageIntro, ProgressBar, SectionHeader } from '../../components/common'
import './index.scss'

const weekBars = [42, 66, 54, 82, 62, 91, 73]
const monthBars = [55, 46, 72, 60, 84, 76, 95]
const channels = [
  { name: '微信公众号：宁夏理工学院新青年', count: '2.4w', percent: 86, change: '示例', tone: 'green' },
  { name: '抖音号：宁夏理工学院', count: '1.1w', percent: 62, change: '示例', tone: 'coral' }
]

export default function Stats() {
  const [period, setPeriod] = useState<'week' | 'month'>('week')
  const bars = period === 'week' ? weekBars : monthBars
  return (
    <View className='page stats-page'>
      <View className='page__inner'>
        <PageIntro eyebrow='REVIEW DEMO' title='数据复盘示例' description='展示复盘口径，不代表真实账号表现' />
        <View className='demo-notice stats-demo-notice'>以下数字全部为演示样例，未连接微信公众号或抖音后台，不能用于判断真实浏览量与内容质量。</View>
        <View className='period-switch'><Text className={period === 'week' ? 'period-switch__item--active' : ''} onClick={() => setPeriod('week')}>本周示例</Text><Text className={period === 'month' ? 'period-switch__item--active' : ''} onClick={() => setPeriod('month')}>近30天示例</Text></View>

        <View className='stats-hero'>
          <Text className='stats-hero__label'>示例内容总触达</Text>
          <View className='stats-hero__value-row'><Text className='stats-hero__value'>{period === 'week' ? '38,426' : '156,820'}</Text><Text className='stats-hero__change'>样例</Text></View>
          <Text className='stats-hero__note'>仅用于展示看板布局 · 非真实后台数据</Text>
          <View className='stats-hero__metrics'><View><Text className='stats-hero__metric'>12</Text><Text className='stats-hero__metric-label'>示例发布数</Text></View><View><Text className='stats-hero__metric'>2,416</Text><Text className='stats-hero__metric-label'>示例互动量</Text></View><View><Text className='stats-hero__metric'>6.3%</Text><Text className='stats-hero__metric-label'>示例互动率</Text></View></View>
        </View>

        <View className='stats-section'><SectionHeader title='阅读趋势示例' action='真实使用需人工录入或授权接口' /><View className='trend-card card'><View className='trend-chart'>{bars.map((height, index) => <View className='trend-column' key={index}><View className='trend-column__track'><View className={`trend-column__bar ${index === 5 ? 'trend-column__bar--peak' : ''}`} style={{ height: `${height}%` }} /></View><Text className='trend-column__label'>{period === 'week' ? ['一', '二', '三', '四', '五', '六', '日'][index] : `${index * 5 + 1}日`}</Text></View>)}</View><View className='trend-insight'><View className='trend-insight__dot' /><Text>示例观察：对比发布时间与内容类型，找出适合团队的复盘维度</Text></View></View></View>

        <View className='stats-section'><SectionHeader title='运营账号示例' /><View className='channel-card card'>{channels.map(channel => <View className='channel-row' key={channel.name}><View className='channel-row__header'><Text className='channel-row__name'>{channel.name}</Text><View><Text className='channel-row__count'>{channel.count}</Text><Text className='channel-row__change'>{channel.change}</Text></View></View><ProgressBar value={channel.percent} tone={channel.tone} /></View>)}</View></View>

        <View className='stats-section'><SectionHeader title='内容排行示例' /><View className='ranking-card card'>{[['01', '秋季校园运动会全媒体报道', '12,806 示例阅读'], ['02', '新生入学教育宣传片', '9,642 示例播放'], ['03', '考研倒计时主题海报', '6,218 示例阅读']].map((item, index) => <View className='ranking-row' key={item[0]}><Text className={`ranking-row__number ${index === 0 ? 'ranking-row__number--first' : ''}`}>{item[0]}</Text><View className='ranking-row__copy'><Text className='ranking-row__title'>{item[1]}</Text><Text className='ranking-row__meta'>{item[2]}</Text></View></View>)}</View></View>

        <View className='editor-note'><Text className='editor-note__label'>建议的真实复盘方式</Text><Text className='editor-note__title'>统一记录发布内容、渠道、阅读/播放、互动与素材来源。</Text><Text className='editor-note__copy'>获得账号后台授权前，可由负责人定期人工录入真实数据；不要把本页示例数字用于工作汇报。</Text></View>
      </View>
    </View>
  )
}
