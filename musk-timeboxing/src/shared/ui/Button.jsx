import { cn } from './cn'

const VARIANT_CLASS = {
  primary: 'ui-btn-primary',
  secondary: 'ui-btn-secondary',
  danger: 'ui-btn-danger',
  sky: 'ui-btn-sky',
  ghost: 'ui-btn-ghost',
  base: 'ui-btn',
  unstyled: '',
}

const SIZE_CLASS = {
  md: '',
  icon: '!h-7 !w-7 !p-0',
}

function Button({
  as: Component = 'button',
  variant = 'ghost',
  size = 'md',
  className = '',
  type,
  ...props
}) {
  const variantClass = VARIANT_CLASS[variant] ?? VARIANT_CLASS.ghost
  const sizeClass = SIZE_CLASS[size] ?? ''
  const resolvedType = Component === 'button' ? type ?? 'button' : undefined

  return (
    <Component
      type={resolvedType}
      className={cn(variantClass, sizeClass, className)}
      {...props}
    />
  )
}

export default Button
