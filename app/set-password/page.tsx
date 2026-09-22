'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    if (password.length < 8) { setError('كلمة المرور لازم تكون 8 أحرف على الأقل'); return }
    if (password !== confirm) { setError('كلمتا المرور مش متطابقتين'); return }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { setError('حصل خطأ، جرّبي تاني أو اطلبي دعوة جديدة'); return }
    router.push('/')
    router.refresh()
  }

  return (
    <main dir="rtl" className="flex min-h-screen items-center justify-center bg-[#f7f8fa] p-5 text-[#1a2540]">
      <div className="w-full max-w-sm rounded-2xl border border-[#e8ebf0] bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src="/abhar-logo.svg" alt="إبهار للنشر والتوزيع" className="h-[90px] w-[100px] object-contain" />
          <h1 className="mt-3 text-lg font-bold">تفعيل الحساب</h1>
          <p className="mt-1 text-xs text-[#9ba4b2]">حطي كلمة مرور لحسابك عشان تقدري تدخلي</p>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <label>
            <span className="mb-2 block text-xs font-semibold text-[#69758a]">كلمة المرور الجديدة</span>
            <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-xl border border-[#e8ebf0] px-3 py-3 text-sm outline-none focus:border-[#d8573a]" />
          </label>
          <label>
            <span className="mb-2 block text-xs font-semibold text-[#69758a]">تأكيد كلمة المرور</span>
            <input required type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className="w-full rounded-xl border border-[#e8ebf0] px-3 py-3 text-sm outline-none focus:border-[#d8573a]" />
          </label>
          {error && <p className="rounded-lg bg-[#fce8e6] px-3 py-2 text-xs text-[#c84c3b]">{error}</p>}
          <button disabled={loading} type="submit" className="mt-1 w-full rounded-xl bg-[#d8573a] py-3 text-sm font-semibold text-white disabled:opacity-60">{loading ? 'جارٍ الحفظ...' : 'حفظ والدخول'}</button>
        </form>
      </div>
    </main>
  )
}
