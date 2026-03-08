import { createElement } from 'react'
import { cn } from './cn'

const TONE_CLASS = {
  neutral:
    'rounded-xl bg-slate-200/80 px-2 py-0.5 text-xs text-slate-700 dark:bg-slate-800/65 dark:text-slate-200',
  success: 'rounded-xl bg-green-500/15 px-2 py-1 text-xs font-semibold text-green-300 shadow-sm',
  danger: 'rounded-xl bg-rose-500/15 px-2 py-1 text-xs font-semibold text-rose-300 shadow-sm',
  subtle:
    'rounded-xl bg-gray-900/50 px-2.5 py-1.5 text-xs text-gray-300 shadow-sm',
}

function Badge({ as = 'span', tone = 'neutral', className = '', ...props }) {
  const toneClass = TONE_CLASS[tone] ?? TONE_CLASS.neutral
  return createElement(as, { className: cn(toneClass, className), ...props })
}

export default Badge
