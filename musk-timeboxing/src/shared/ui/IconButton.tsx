import type { ButtonHTMLAttributes, ReactNode } from 'react'
import Button from './Button'
import { cn } from './cn'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string
  children?: ReactNode
}

function IconButton({ className = '', children, ...props }: IconButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn('text-base text-slate-400', className)}
      {...props}
    >
      {children}
    </Button>
  )
}

export default IconButton
