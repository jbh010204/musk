import { useCallback, useMemo, useState } from 'react'

export const useToast = () => {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, duration = 2000) => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, message }])

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, duration)
  }, [])

  const ToastContainer = useMemo(
    () =>
      function ToastContainerComponent() {
        if (toasts.length === 0) {
          return null
        }

        return (
          <div className="pointer-events-none fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-2">
            {toasts.map((toast) => (
              <div
                key={toast.id}
                className="rounded bg-gray-700 px-4 py-2 text-sm text-white shadow-lg"
              >
                {toast.message}
              </div>
            ))}
          </div>
        )
      },
    [toasts],
  )

  return { showToast, ToastContainer }
}
