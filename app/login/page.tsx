'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Eye, EyeOff, Feather, Mail, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCompanyInfo } from '@/lib/useCompanyInfo'

export default function LoginPage() {
  const router = useRouter()
  const { company } = useCompanyInfo()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
    <main dir="rtl" className="min-h-screen bg-[#faf6f0] text-[#2a211c]">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* الجانب الأيسر: البراند والصورة */}
        <aside className="relative hidden overflow-hidden bg-gradient-to-br from-[#2a211c] via-[#3d2b21] to-[#5a3a2a] lg:flex lg:flex-col lg:justify-between p-12 text-white">
          {/* زخارف خلفية */}
          <div className="absolute -left-20 -top-20 size-64 rounded-full bg-[#d8573a]/10 blur-3xl" />
          <div className="absolute -right-32 bottom-0 size-96 rounded-full bg-[#b8752f]/10 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-opacity='1'%3E%3Cpath d='M30 5 L35 25 L55 30 L35 35 L30 55 L25 35 L5 30 L25 25 Z'/%3E%3C/g%3E%3C/svg%3E")` }} />

          <div className="relative z-10 flex items-center gap-3">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-white/10 p-2 backdrop-blur">
              <img src="/abhar-logo.png" alt="إبهار" className="h-full w-full object-contain brightness-0 invert" />
            </div>
            <div>
              <p className="font-serif text-lg font-semibold">{company.name.split(' ')[0] || 'إبهار'}</p>
              <p className="text-xs text-white/60">للتوزيع والنشر</p>
            </div>
          </div>

          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs backdrop-blur">
              <Sparkles size={13} className="text-[#f2b590]" />
              <span>نظام إدارة داخلي</span>
            </div>
            <h1 className="font-serif text-4xl font-semibold leading-tight xl:text-5xl">
              حيث تُروى<br />
              <span className="text-[#f2b590]">حكاية كل كتاب</span>
            </h1>
            <p className="max-w-md text-sm leading-relaxed text-white/70">
              تابع رحلة كتبك من التعاقد إلى المطبعة، ومن المخزن إلى يد القارئ، في مكان واحد صُمم بعناية لدار نشر تعرف قدر الحرف.
            </p>

            <div className="grid grid-cols-3 gap-3 pt-6">
              <FeatureBadge icon={Feather} label="التعاقدات" />
              <FeatureBadge icon={BookOpen} label="المطبعة" />
              <FeatureBadge icon={Sparkles} label="المنصات" />
            </div>
          </div>

          <p className="relative z-10 text-xs text-white/40">© {new Date().getFullYear()} {company.name}</p>
        </aside>

        {/* الجانب الأيمن: الفورم */}
        <section className="flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-sm">
            {/* اللوجو للموبايل فقط */}
            <div className="mb-8 flex items-center justify-center lg:hidden">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-[#faf1eb] p-2">
                <img src="/abhar-logo.png" alt="إبهار للتوزيع والنشر" className="h-full w-full object-contain" />
              </div>
            </div>

            <div className="mb-8">
              <p className="mb-2 text-xs font-medium tracking-[0.2em] text-[#d8573a]">مرحبًا بعودتك</p>
              <h2 className="font-serif text-3xl font-semibold text-[#2a211c] sm:text-4xl">تسجيل الدخول</h2>
              <p className="mt-3 text-sm leading-relaxed text-[#8a7969]">أدخل بياناتك للوصول إلى لوحة إدارة الدار.</p>
            </div>

            <form onSubmit={submit} className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-2 block text-xs font-semibold text-[#6b5d53]">البريد الإلكتروني</label>
                <div className="relative">
                  <Mail size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#a3907e]" />
                  <input id="email" required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@abhar.sa"
                    className="w-full rounded-xl border border-[#e8dfd3] bg-white py-3.5 pl-4 pr-11 text-sm outline-none transition focus:border-[#d8573a] focus:ring-4 focus:ring-[#d8573a]/10" />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-xs font-semibold text-[#6b5d53]">كلمة المرور</label>
                <div className="relative">
                  <input id="password" required type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-[#e8dfd3] bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-[#d8573a] focus:ring-4 focus:ring-[#d8573a]/10" />
                  <button type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1}
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#a3907e] transition hover:bg-[#faf1eb] hover:text-[#6b5d53]"
                    aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}>
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-[#e8b8a5] bg-[#fdf0ea] px-4 py-3 text-xs text-[#c04a2f]">{error}</div>
              )}

              <button disabled={loading} type="submit"
                className="group relative w-full overflow-hidden rounded-xl bg-[#d8573a] py-3.5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(216,87,58,0.5)] transition hover:bg-[#c04a2f] disabled:opacity-60">
                <span className="relative z-10">{loading ? <><Spinner size={14} className="text-white" />جارٍ الدخول...</> : 'دخول'}</span>
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </button>
            </form>

            <p className="mt-8 text-center text-xs text-[#a3907e]">
              مش عندك حساب؟ تواصل مع مدير النظام
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}

function FeatureBadge({ icon: Icon, label }: { icon: typeof BookOpen; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-center backdrop-blur">
      <Icon size={18} className="text-[#f2b590]" />
      <span className="text-[11px] text-white/70">{label}</span>
    </div>
  )
}
