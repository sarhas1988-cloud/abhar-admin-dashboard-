'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SetPasswordPage() {
  const router = useRouter()
  const [sessionEmail, setSessionEmail] = useState('')
  const [isAdminAccount, setIsAdminAccount] = useState(false)
  const [checking, setChecking] = useState(true)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    (async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setChecking(false); return }
      setSessionEmail(user.email ?? '')
      const { data: profile } = await supabase.from('staff_profiles').select('is_admin').eq('id', user.id).maybeSingle()
      setIsAdminAccount(Boolean(profile?.is_admin))
      setChecking(false)
    })()
  }, [])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    if (isAdminAccount) { setError('اللينك ده لحساب أدمن — الأدمن مايغيّرش كلمة سره بالطريقة دي'); return }
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

  const signOutAndLeave = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <main dir="rtl" className="flex min-h-screen items-center justify-center bg-[#faf6f0] p-5 text-[#2a211c]">
      <div className="w-full max-w-md rounded-2xl border border-[#e8dfd3] bg-white p-8 shadow-[0_4px_24px_-8px_rgba(90,60,40,0.12)]">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-[#faf1eb] p-2">
            <img src="/abhar-logo.png" alt="إبهار للتوزيع والنشر" className="h-full w-full object-contain" />
          </div>
          <h1 className="mt-4 font-serif text-2xl font-semibold">تفعيل الحساب</h1>
          <p className="mt-1 text-xs text-[#8a7969]">حطي كلمة مرور لحسابك عشان تقدري تدخلي</p>
        </div>

        {checking ? (
          <p className="py-6 text-center text-sm text-[#8a7969]">جارٍ التحقق...</p>
        ) : !sessionEmail ? (
          <p className="rounded-xl bg-[#f7dbd3] px-4 py-3 text-center text-sm text-[#c04a2f]">اللينك غير صالح أو انتهت صلاحيته — اطلبي لينك جديد من الأدمن</p>
        ) : isAdminAccount ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-[#e8c9a0] bg-[#fdf6ef] p-4 text-sm text-[#8a5a1a]">
              <p className="font-semibold">تحذير: اللينك ده لحساب الأدمن ({sessionEmail})</p>
              <p className="mt-2 text-xs">لو انتِ الأدمن وفتحتِ اللينك بالغلط، سجّلي خروج وابعتي اللينك للموظف المقصود. لو غيّرتي كلمة السر هنا، هتغيّر كلمة سرك أنتِ.</p>
            </div>
            <button onClick={signOutAndLeave} className="w-full rounded-xl bg-[#d8573a] py-3 text-sm font-semibold text-white">تسجيل خروج والعودة للدخول</button>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="rounded-xl bg-[#faf1eb] px-4 py-3 text-xs text-[#6b5d53]">هتحدّدي كلمة مرور لحساب: <strong className="text-[#2a211c]">{sessionEmail}</strong></div>
            <label>
              <span className="mb-2 block text-xs font-semibold text-[#6b5d53]">كلمة المرور الجديدة</span>
              <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-xl border border-[#e8dfd3] bg-white px-3 py-3 text-sm outline-none focus:border-[#d8573a]" />
            </label>
            <label>
              <span className="mb-2 block text-xs font-semibold text-[#6b5d53]">تأكيد كلمة المرور</span>
              <input required type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className="w-full rounded-xl border border-[#e8dfd3] bg-white px-3 py-3 text-sm outline-none focus:border-[#d8573a]" />
            </label>
            {error && <p className="rounded-lg bg-[#f7dbd3] px-3 py-2 text-xs text-[#c04a2f]">{error}</p>}
            <button disabled={loading} type="submit" className="mt-1 w-full rounded-xl bg-[#d8573a] py-3 text-sm font-semibold text-white disabled:opacity-60">{loading ? 'جارٍ الحفظ...' : 'حفظ والدخول'}</button>
          </form>
        )}
      </div>
    </main>
  )
}
