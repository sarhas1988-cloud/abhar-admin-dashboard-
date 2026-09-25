'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Check, Info, TriangleAlert, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'
type Toast = { id: string; message: string; type: ToastType }
type ToastCtx = { toast: (message: string, type?: ToastType) => void }

const Ctx = createContext<ToastCtx>({ toast: () => {} })
export const useToast = () => useContext(Ctx)

const icons = { success: Check, error: X, warning: TriangleAlert, info: Info }
const styles = {
  success: 'bg-[#e8f2df] border-[#b8d9a0] text-[#4a7a2c]',
  error:   'bg-[#f7dbd3] border-[#e8b8a5] text-[#c04a2f]',
  warning: 'bg-[#fbeed6] border-[#e8c9a0] text-[#8a5a1a]',
  info:    'bg-[#faf1eb] border-[#e8dfd3] text-[#6b5d53]',
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, message, type }])
    timers.current[id] = setTimeout(() => remove(id), 3500)
  }, [])

  const remove = (id: string) => {
    clearTimeout(timers.current[id])
    delete timers.current[id]
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), [])

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 left-1/2 z-[200] flex -translate-x-1/2 flex-col items-center gap-2" aria-live="polite">
        {toasts.map(t => {
          const Icon = icons[t.type]
          return (
            <div key={t.id} className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-[0_8px_24px_-8px_rgba(90,60,40,0.2)] animate-in fade-in slide-in-from-bottom-2 duration-200 ${styles[t.type]}`}>
              <Icon size={16} />
              <span>{t.message}</span>
              <button onClick={() => remove(t.id)} className="opacity-60 hover:opacity-100 transition"><X size={14} /></button>
            </div>
          )
        })}
      </div>
    </Ctx.Provider>
  )
}
