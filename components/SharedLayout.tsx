'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, ChevronDown, ClipboardList, DollarSign, Factory, Grid2X2, History, LayoutDashboard, LogOut, Menu, Settings, ShieldCheck, ShoppingCart, Warehouse, X } from 'lucide-react'
import { NotificationBell } from '@/components/NotificationBell'
import { useStaffAccess } from '@/lib/useStaffAccess'

type Props = { title: string; subtitle?: string; children: React.ReactNode }

export function SharedLayout({ title, subtitle, children }: Props) {
  const pathname = usePathname()
  const { email, isAdmin, canView, signOut } = useStaffAccess()
  const [menuOpen, setMenuOpen] = useState(false)

  const navItems = useMemo(() => [
    { label: 'نظرة عامة', href: '/', icon: LayoutDashboard, show: true },
    { label: 'التعاقدات والقسم الفني', href: '/contracts', icon: ClipboardList, show: canView('contracts') },
    { label: 'المطبعة', href: '/printing', icon: Factory, show: canView('printing') },
    { label: 'المنصات', href: '/platforms', icon: Grid2X2, show: canView('platforms') },
    { label: 'المخزن', href: '/warehouse', icon: Warehouse, show: canView('warehouse') },
    { label: 'الاوردرات', href: '/orders', icon: ShoppingCart, show: canView('orders') },
    { label: 'الموظفين والصلاحيات', href: '/staff', icon: ShieldCheck, show: isAdmin },
    { label: 'التقارير', href: '/reports', icon: BarChart3, show: isAdmin },
    { label: 'المصروفات', href: '/expenses', icon: DollarSign, show: isAdmin },
    { label: 'سجل التغييرات', href: '/activity', icon: History, show: isAdmin },
    { label: 'الإعدادات', href: '/settings', icon: Settings, show: isAdmin },
  ].filter(i => i.show), [isAdmin, canView])

  return (
    <main dir="rtl" className="min-h-screen bg-[#faf6f0] text-[#2a211c]">
      {/* السايدبار */}
      <aside className={`fixed inset-y-0 right-0 z-40 flex w-[280px] flex-col border-l border-[#e8dfd3] bg-white px-5 py-6 transition-transform duration-300 lg:translate-x-0 ${menuOpen ? 'translate-x-0' : 'translate-x-[110%]'}`}>
        {/* هيدر السايدبار */}
        <div className="flex items-center justify-between pb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-16 shrink-0 items-center justify-center rounded-xl bg-[#faf1eb] p-2">
              <img src="/abhar-logo.png" alt="إبهار" className="h-full w-full object-contain" />
            </div>
            <div className="min-w-0">
              <p className="font-serif text-sm font-semibold leading-tight text-[#2a211c]">إبهار</p>
              <p className="text-[10px] leading-tight text-[#a3907e]">للتوزيع والنشر</p>
            </div>
          </div>
          <button onClick={() => setMenuOpen(false)} className="rounded-lg p-2 text-[#8a7969] hover:bg-[#faf1eb] lg:hidden" aria-label="إغلاق القائمة"><X size={18} /></button>
        </div>

        {/* لايبل القائمة */}
        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a3907e]">القائمة الرئيسية</p>

        {/* روابط التنقل */}
        <nav className="flex flex-col gap-1">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link key={href} href={href} onClick={() => setMenuOpen(false)}
                className={`group relative flex items-center gap-3 rounded-xl px-3.5 py-3 text-right text-sm font-medium transition ${active ? 'bg-gradient-to-l from-[#faf1eb] to-[#fdf9f4] text-[#d8573a]' : 'text-[#6b5d53] hover:bg-[#faf6f0] hover:text-[#2a211c]'}`}>
                {active && <span className="absolute inset-y-2 right-0 w-1 rounded-full bg-[#d8573a]" />}
                <Icon size={18} strokeWidth={active ? 2.2 : 1.7} />
                <span className="truncate">{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* بروفايل + خروج */}
        <div className="mt-auto space-y-2 border-t border-[#ede4d7] pt-4">
          <button onClick={signOut} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-right text-sm font-medium text-[#6b5d53] transition hover:bg-[#faf6f0] hover:text-[#c04a2f]">
            <LogOut size={17} strokeWidth={1.7} />
            <span>تسجيل الخروج</span>
          </button>
          <div className="flex items-center gap-3 rounded-xl bg-[#faf6f0] p-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#3d2b21] to-[#5a3a2a] text-xs font-bold text-white">
              {isAdmin ? 'أ' : email.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-[#2a211c]">{isAdmin ? 'مدير النظام' : 'موظف'}</p>
              <p className="truncate text-[10px] text-[#8a7969]">{email}</p>
            </div>
            <ChevronDown size={14} className="text-[#a3907e]" />
          </div>
        </div>
      </aside>

      {/* أوفرلاي للموبايل */}
      {menuOpen && <button className="fixed inset-0 z-30 bg-[#2a211c]/40 backdrop-blur-sm lg:hidden" onClick={() => setMenuOpen(false)} aria-label="إغلاق القائمة" />}

      {/* المحتوى */}
      <section className="lg:mr-[280px]">
        {/* الهيدر */}
        <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-[#e8dfd3] bg-[#faf6f0]/85 px-5 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setMenuOpen(true)} className="rounded-lg border border-[#e8dfd3] bg-white p-2 text-[#6b5d53] hover:border-[#d8573a] hover:text-[#d8573a] lg:hidden" aria-label="فتح القائمة"><Menu size={18} /></button>
            <div>
              {subtitle && <p className="text-[11px] font-medium tracking-wide text-[#a3907e]">{subtitle}</p>}
              <h1 className="font-serif mt-0.5 text-xl font-semibold text-[#2a211c] sm:text-2xl">{title}</h1>
            </div>
          </div>
          <NotificationBell />
        </header>

        <div className="mx-auto max-w-[1400px] p-5 pb-24 sm:p-8 lg:pb-8">{children}</div>
      </section>

      {/* نافيجيشن سفلي للموبايل */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex gap-1 overflow-x-auto border-t border-[#e8dfd3] bg-white/95 px-2 py-2 backdrop-blur-md lg:hidden">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href} className={`flex min-w-[68px] flex-1 flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-[10px] ${active ? 'text-[#d8573a]' : 'text-[#8a7969]'}`}>
              <Icon size={17} strokeWidth={active ? 2.2 : 1.7} />
              <span className="truncate">{label}</span>
            </Link>
          )
        })}
      </nav>
    </main>
  )
}
