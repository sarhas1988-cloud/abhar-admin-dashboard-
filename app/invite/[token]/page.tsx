'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function InvitePage() {
  const params = useParams<{ token: string }>()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'loading' | 'invalid' | 'ready' | 'done'>('loading')
  const [invalidReason, setInvalidReason] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/invite/${params.token}`)
      const data = await res.json()
      if (!res.ok) { setStatus('invalid'); setInvalidReason(data.error || 'اللينك غير صالح'); return }
      setEmail(data.email)
      setStatus('ready')
    })()
  }, [params.token])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    if (password.length < 8) { setError('كلمة المرور لازم تكون 8 أحرف على الأقل'); return }
    if (password !== confirm) { setError('كلمتا المرور مش متطابقتين'); return }
    setSaving(true)
    const res = await fetch(`/api/invite/${params.token}`, { method: 'POST', body: JSON.stringify({ password }) })
    const data = await res.json()
    if (!res.ok) { setSaving(false); setError(data.error || 'حصل خطأ'); return }
    // نسجّل دخول تلقائي بالحساب اللي اتفعّل لسه
    const supabase = createClient()
    await supabase.auth.signOut()
    await supabase.auth.signInWithPassword({ email: data.email, password })
    setStatus('done')
    setTimeout(() => window.location.replace('/'), 800)
  }

  return (
    <main dir="rtl" className="flex min-h-screen items-center justify-center bg-[#faf6f0] p-5 text-[#2a211c]">
      <div className="w-full max-w-md rounded-2xl border border-[#e8dfd3] bg-white p-8 shadow-[0_4px_24px_-8px_rgba(90,60,40,0.12)]">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-[#faf1eb] p-2">
            <img src="/abhar-logo.png" alt="إبهار للتوزيع والنشر" className="h-full w-full object-contain" />
          </div>
          <h1 className="font-serif mt-4 text-2xl font-semibold">تفعيل حساب موظف</h1>
          <p className="mt-1 text-xs text-[#a3907e]">إبهار للتوزيع والنشر</p>
        </div>

        {status === 'loading' && <p className="py-6 text-center text-sm text-[#8a7969]">جارٍ التحقق من اللينك...</p>}

        {status === 'invalid' && (
          <div className="rounded-xl bg-[#f7dbd3] px-4 py-3 text-center text-sm text-[#c04a2f]">{invalidReason}<p className="mt-2 text-xs">اطلبي لينك جديد من الأدمن.</p></div>
        )}

        {status === 'ready' && (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="rounded-xl bg-[#faf1eb] px-4 py-3 text-xs text-[#6b5d53]">هتحدّدي كلمة مرور لحساب: <strong className="text-[#2a211c]">{email}</strong></div>
            <label>
              <span className="mb-2 block text-xs font-semibold text-[#6b5d53]">كلمة المرور الجديدة</span>
              <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-xl border border-[#e8dfd3] bg-white px-3 py-3 text-sm outline-none focus:border-[#d8573a]" />
            </label>
            <label>
              <span className="mb-2 block text-xs font-semibold text-[#6b5d53]">تأكيد كلمة المرور</span>
              <input required type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className="w-full rounded-xl border border-[#e8dfd3] bg-white px-3 py-3 text-sm outline-none focus:border-[#d8573a]" />
            </label>
            {error && <p className="rounded-lg bg-[#f7dbd3] px-3 py-2 text-xs text-[#c04a2f]">{error}</p>}
            <button disabled={saving} type="submit" className="mt-1 w-full rounded-xl bg-[#d8573a] py-3 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'جارٍ الحفظ...' : 'تفعيل الحساب والدخول'}</button>
          </form>
        )}

        {status === 'done' && <p className="rounded-xl bg-[#e8f2df] px-4 py-3 text-center text-sm text-[#4a7a2c]">تم التفعيل، جارٍ توجيهك للوحة التحكم...</p>}
      </div>
    </main>
  )
}
