'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { setError('البريد الإلكتروني أو كلمة المرور غير صحيحة'); return }
    router.push('/')
    router.refresh()
  }

  return (
    <main dir="rtl" className="flex min-h-screen items-center justify-center bg-[#faf6f0] p-5 text-[#2a211c]">
      <div className="w-full max-w-sm rounded-2xl border border-[#e8dfd3] bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-[#faf1eb] p-2"><img src="/abhar-logo.svg" alt="إبهار للنشر والتوزيع" className="h-full w-full object-contain" /></div>
          <h1 className="mt-3 text-lg font-bold">تسجيل الدخول</h1>
          <p className="mt-1 text-xs text-[#a3907e]">نظام إدارة إبهار للنشر والتوزيع</p>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <label>
            <span className="mb-2 block text-xs font-semibold text-[#6b5d53]">البريد الإلكتروني</span>
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-xl border border-[#e8dfd3] px-3 py-3 text-sm outline-none focus:border-[#d8573a]" />
          </label>
          <label>
            <span className="mb-2 block text-xs font-semibold text-[#6b5d53]">كلمة المرور</span>
            <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-xl border border-[#e8dfd3] px-3 py-3 text-sm outline-none focus:border-[#d8573a]" />
          </label>
          {error && <p className="rounded-lg bg-[#f7dbd3] px-3 py-2 text-xs text-[#c04a2f]">{error}</p>}
          <button disabled={loading} type="submit" className="mt-1 w-full rounded-xl bg-[#d8573a] py-3 text-sm font-semibold text-white disabled:opacity-60">{loading ? 'جارٍ الدخول...' : 'دخول'}</button>
        </form>
      </div>
    </main>
  )
}
