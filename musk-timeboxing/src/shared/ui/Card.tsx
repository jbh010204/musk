import { createElement, type ComponentPropsWithoutRef, type ElementType } from 'react'
import { cn } from './cn'

const TONE_CLASS = {
  default: 'ui-panel',
  subtle: 'ui-panel-subtle',
} as const

type CardTone = keyof typeof TONE_CLASS

type CardProps<T extends ElementType = 'div'> = {
  as?: T
  tone?: CardTone
  className?: string
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'className'>

function Card<T extends ElementType = 'div'>({
  as,
  tone = 'default',
  className = '',
  ...props
}: CardProps<T>) {
  const Component = as || 'div'
  const toneClass = TONE_CLASS[tone] ?? TONE_CLASS.default

  return createElement(Component, {
    className: cn(toneClass, className),
    ...props,
  })
}

export default Card
