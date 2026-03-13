import { useState, type KeyboardEvent } from 'react'

interface BrainDumpInputProps {
  onAdd: (content: string) => void
}

function BrainDumpInput({ onAdd }: BrainDumpInputProps) {
  const [value, setValue] = useState('')
  const [isComposing, setIsComposing] = useState(false)

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const nativeComposing = event.nativeEvent?.isComposing || event.keyCode === 229

    if (isComposing || nativeComposing) {
      return
    }

    if (event.key !== 'Enter') {
      return
    }

    if (event.repeat) {
      return
    }

    event.preventDefault()

    const content = value.trim()
    if (!content) {
      return
    }

    onAdd(content)
    setValue('')
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(event) => setValue(event.target.value)}
      onCompositionStart={() => setIsComposing(true)}
      onCompositionEnd={() => setIsComposing(false)}
      onKeyDown={handleKeyDown}
      placeholder="할 일을 입력하고 엔터..."
      className="ui-input !px-3 !py-2.5 text-sm"
    />
  )
}

export default BrainDumpInput
