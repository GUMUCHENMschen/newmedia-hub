import { Text, View } from '@tarojs/components'
import { ReactNode } from 'react'
import type { StatusType } from '../data'

export function Avatar({ name, tone = 'green', small = false }: { name: string; tone?: string; small?: boolean }) {
  return <View className={`avatar avatar--${tone} ${small ? 'avatar--small' : ''}`}><Text>{name.slice(0, 1)}</Text></View>
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View className='section-header'>
      <Text className='section-header__title'>{title}</Text>
      {action && <Text className='section-header__action' onClick={onAction}>{action}</Text>}
    </View>
  )
}

export function StatusTag({ type, label }: { type: StatusType; label: string }) {
  return <Text className={`status-tag status-tag--${type}`}>{label}</Text>
}

export function PageIntro({ eyebrow, title, description, extra }: { eyebrow?: string; title: string; description?: string; extra?: ReactNode }) {
  return (
    <View className='page-intro'>
      <View className='page-intro__copy'>
        {eyebrow && <Text className='page-intro__eyebrow'>{eyebrow}</Text>}
        <Text className='page-intro__title'>{title}</Text>
        {description && <Text className='page-intro__description'>{description}</Text>}
      </View>
      {extra}
    </View>
  )
}

export function ProgressBar({ value, tone = 'green' }: { value: number; tone?: string }) {
  return (
    <View className='progress-track'>
      <View className={`progress-fill progress-fill--${tone}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </View>
  )
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <View className='empty-state'>
      <View className='empty-state__mark'><Text>✓</Text></View>
      <Text className='empty-state__title'>{title}</Text>
      <Text className='empty-state__description'>{description}</Text>
    </View>
  )
}
