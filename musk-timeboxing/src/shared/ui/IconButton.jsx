import Button from './Button'
import { cn } from './cn'

function IconButton({ className = '', children, ...props }) {
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
