import { createElement } from 'react'
import { cn } from './cn'

const TONE_CLASS = {
  default: 'ui-panel',
  subtle: 'ui-panel-subtle',
}

function Card({ as = 'div', tone = 'default', className = '', ...props }) {
  const toneClass = TONE_CLASS[tone] ?? TONE_CLASS.default
  return createElement(as, { className: cn(toneClass, className), ...props })
}

export default Card
