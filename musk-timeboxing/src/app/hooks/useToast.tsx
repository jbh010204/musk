import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export interface ToastOptions {
  actionLabel?: string | null
  onAction?: (() => void) | null
}

interface ToastRecord {
  id: string
  message: string
  actionLabel: string | null
  onAction: (() => void) | null
}

export type ShowToast = (
  message: string,
  duration?: number,
  options?: ToastOptions | null,
) => string

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastRecord[]>([])
  const timeoutMapRef = useRef<Map<string, number>>(new Map())

  const removeToast = useCallback((id: string) => {
    const timeoutId = timeoutMapRef.current.get(id)
    if (timeoutId) {
      window.clearTimeout(timeoutId)
      timeoutMapRef.current.delete(id)
    }

    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback<ShowToast>(
    (message, duration = 2000, options = null) => {
      const id = crypto.randomUUID()
      const actionLabel =
        typeof options?.actionLabel === 'string' && options.actionLabel.trim().length > 0
          ? options.actionLabel.trim()
          : null
      const onAction = typeof options?.onAction === 'function' ? options.onAction : null
      setToasts((prev) => [...prev, { id, message, actionLabel, onAction }])

      const timeoutId = window.setTimeout(() => {
        removeToast(id)
      }, duration)
      timeoutMapRef.current.set(id, timeoutId)

      return id
    },
    [removeToast],
  )

  useEffect(
    () => () => {
      timeoutMapRef.current.forEach((timeoutId) => {
        window.clearTimeout(timeoutId)
      })
      timeoutMapRef.current.clear()
    },
    [],
  )

  const ToastContainer = useMemo(
    () =>
      function ToastContainerComponent() {
        if (toasts.length === 0) {
          return null
        }

        return (
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="pointer-events-none fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-2"
          >
            {toasts.map((toast) => (
              <div
                key={toast.id}
                role="alert"
                className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-gray-700 px-4 py-2 text-sm text-white shadow-lg"
              >
                <span>{toast.message}</span>
                {toast.actionLabel ? (
                  <button
                    type="button"
                    onClick={() => {
                      toast.onAction?.()
                      removeToast(toast.id)
                    }}
                    className="rounded-lg bg-white/10 px-2 py-1 text-xs font-semibold text-white transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    {toast.actionLabel}
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        )
      },
    [removeToast, toasts],
  )

  return { showToast, ToastContainer }
}
