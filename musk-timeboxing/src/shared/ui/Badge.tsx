import { createElement, type ComponentPropsWithoutRef, type ElementType } from 'react'
import { cn } from './cn'

const TONE_CLASS = {
  neutral:
    'rounded-xl bg-slate-200/80 px-2 py-0.5 text-xs text-slate-700 dark:bg-slate-800/65 dark:text-slate-200',
  success: 'rounded-xl bg-green-500/15 px-2 py-1 text-xs font-semibold text-green-300 shadow-sm',
  danger: 'rounded-xl bg-rose-500/15 px-2 py-1 text-xs font-semibold text-rose-300 shadow-sm',
  subtle: 'rounded-xl bg-gray-900/50 px-2.5 py-1.5 text-xs text-gray-300 shadow-sm',
} as const

type BadgeTone = keyof typeof TONE_CLASS

type BadgeProps<T extends ElementType = 'span'> = {
  as?: T
  tone?: BadgeTone
  className?: string
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'className'>

function Badge<T extends ElementType = 'span'>({
  as,
  tone = 'neutral',
  className = '',
  ...props
}: BadgeProps<T>) {
  const Component = as || 'span'
  const toneClass = TONE_CLASS[tone] ?? TONE_CLASS.neutral

  return createElement(Component, {
    className: cn(toneClass, className),
    ...props,
  })
}

export default Badge
