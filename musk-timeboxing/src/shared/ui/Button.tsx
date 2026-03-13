import { createElement, type ComponentPropsWithoutRef, type ElementType } from 'react'
import { cn } from './cn'

const VARIANT_CLASS = {
  primary: 'ui-btn-primary',
  secondary: 'ui-btn-secondary',
  danger: 'ui-btn-danger',
  sky: 'ui-btn-sky',
  ghost: 'ui-btn-ghost',
  base: 'ui-btn',
  unstyled: '',
} as const

const SIZE_CLASS = {
  md: '',
  icon: '!h-7 !w-7 !p-0',
} as const

type ButtonVariant = keyof typeof VARIANT_CLASS
type ButtonSize = keyof typeof SIZE_CLASS

type ButtonProps<T extends ElementType = 'button'> = {
  as?: T
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
  type?: 'button' | 'submit' | 'reset'
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'className' | 'type'>

function Button<T extends ElementType = 'button'>({
  as,
  variant = 'ghost',
  size = 'md',
  className = '',
  type,
  ...props
}: ButtonProps<T>) {
  const Component = as || 'button'
  const variantClass = VARIANT_CLASS[variant] ?? VARIANT_CLASS.ghost
  const sizeClass = SIZE_CLASS[size] ?? ''
  const resolvedType = Component === 'button' ? type ?? 'button' : undefined

  return createElement(Component, {
    ...props,
    ...(resolvedType ? { type: resolvedType } : {}),
    className: cn(variantClass, sizeClass, className),
  })
}

export default Button
