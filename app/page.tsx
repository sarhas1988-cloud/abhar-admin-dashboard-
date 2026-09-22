'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, BookOpen, ClipboardList, Factory, Grid2X2, LayoutDashboard, LogOut, Menu, Plus, ShieldCheck, ShoppingCart, Users, Warehouse, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useStaffAccess } from '@/lib/useStaffAccess'

type Book = { id: string; title: string; category: string; printed_copies: number; contract_date: string; book_authors: { authors: { name: string } }[] }
const palette = ['#d8573a', '#1a2540', '#f2b5a8', '#dce2e9', '#c9915f']

export default function HomePage() {
  const pathname = usePathname()
  const { loading: accessLoading, email, isAdmin, canView, signOut } = useStaffAccess()
  const navItems = useMemo(() => [
    { label: 'نظرة عامة', href: '/', icon: LayoutDashboard, show: true },
    { label: 'التعاقدات والقسم الفني', href: '/contracts', icon: ClipboardList, show: canView('contracts') },
    { label: 'المطبعة', href: '/printing', icon: Factory, show: canView('printing') },
    { label: 'المنصات', href: '/platforms', icon: Grid2X2, show: canView('platforms') },
    { label: 'المخزن', href: '/warehouse', icon: Warehouse, show: canView('warehouse') },
    { label: 'الاوردرات', href: '/orders', icon: ShoppingCart, show: canView('orders') },
    { label: 'الموظفين والصلاحيات', href: '/staff', icon: ShieldCheck, show: isAdmin },
  ].filter(i => i.show), [isAdmin, accessLoading])

  const [menuOpen, setMenuOpen] = useState(false)
  const [books, setBooks] = useState<Book[]>([])
  const [authorsCount, setAuthorsCount] = useState(0)
  const [pendingOrders, setPendingOrders] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    (async () => {
      setLoading(true)
      const [{ data: b }, { count: authorsC }, { count: pendingC }] = await Promise.all([
        supabase.from('books').select('id, title, category, printed_copies, contract_date, book_authors(authors(name))').order('created_at', { ascending: false }).limit(6),
        supabase.from('authors').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('delivered', false),
      ])
      setBooks((b as any) ?? [])
      setAuthorsCount(authorsC ?? 0)
      setPendingOrders(pendingC ?? 0)
      setLoading(false)
    })()
  }, [])

  const totalPrinted = books.reduce((sum, b) => sum + (b.printed_copies || 0), 0)
  const categoryBreakdown = useMemo(() => {
    const counts: Record<string, number> = {}
    books.forEach(b => { const c = b.category || 'أخرى'; counts[c] = (counts[c] || 0) + 1 })
    const total = books.length || 1
    return Object.entries(counts).map(([label, count], i) => ({ label, pct: Math.round((count / total) * 100), color: palette[i % palette.length] }))
  }, [books])
  const gradientStops = useMemo(() => {
    let acc = 0
    return categoryBreakdown.map(c => { const start = acc; acc += c.pct; return `${c.color} ${start}% ${acc}%` }).join(', ')
  }, [categoryBreakdown])

  return (
    <main dir="rtl" className="min-h-screen bg-[#f7f8fa] text-[#1a2540]">
      <aside className={`fixed inset-y-0 right-0 z-40 flex w-[252px] flex-col border-l border-[#e8ebf0] bg-white px-5 py-6 transition-transform duration-300 lg:translate-x-0 ${menuOpen ? 'translate-x-0' : 'translate-x-[110%]'}`}>
        <div className="flex items-center justify-between pb-8">
          <img src="/abhar-logo.svg" alt="إبهار للنشر والتوزيع" className="h-[98px] w-[112px] object-contain" />
          <button onClick={() => setMenuOpen(false)} className="rounded-lg p-2 text-[#7d8798] hover:bg-[#f4f5f7] lg:hidden" aria-label="إغلاق القائمة"><X /></button>
        </div>
        <p className="mb-3 px-3 text-[11px] font-semibold tracking-[0.16em] text-[#9ba4b2]">القائمة الرئيسية</p>
        <nav className="flex flex-col gap-1.5">
          {navItems.map(({ label, href, icon: Icon }) => <Link key={href} href={href} onClick={() => setMenuOpen(false)} className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-right text-sm font-medium transition ${pathname === href ? 'bg-[#fff0ed] text-[#d8573a]' : 'text-[#69758a] hover:bg-[#f7f8fa] hover:text-[#1a2540]'}`}><Icon size={19} strokeWidth={1.8} /><span>{label}</span>{href === '/orders' && pendingOrders > 0 && <span className="mr-auto rounded-full bg-[#d8573a] px-2 py-0.5 text-[10px] font-bold text-white">{pendingOrders}</span>}</Link>)}
        </nav>
        <div className="mt-auto flex flex-col gap-1.5 border-t border-[#edf0f3] pt-4">
          <button onClick={signOut} className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-[#69758a] hover:bg-[#f7f8fa] hover:text-[#c84c3b]"><LogOut size={19} strokeWidth={1.8} />تسجيل الخروج</button>
          <div className="mt-2 flex items-center gap-3 rounded-xl bg-[#f7f8fa] p-3"><div className="flex size-9 items-center justify-center rounded-full bg-[#1a2540] text-xs font-bold text-white">{isAdmin ? 'أ' : 'م'}</div><div className="min-w-0"><p className="truncate text-xs font-semibold">{isAdmin ? 'الأدمن' : 'موظف'}</p><p className="truncate text-[10px] text-[#8d97a7]">{email}</p></div></div>
        </div>
      </aside>
      {menuOpen && <button className="fixed inset-0 z-30 bg-[#1a2540]/20 lg:hidden" onClick={() => setMenuOpen(false)} aria-label="إغلاق القائمة" />}

      <section className="lg:mr-[252px]">
        <header className="flex h-[84px] items-center justify-between border-b border-[#e8ebf0] bg-white px-5 sm:px-8">
          <div className="flex items-center gap-3"><img src="/abhar-logo.svg" alt="إبهار" className="h-11 w-12 object-contain lg:hidden" /><button onClick={() => setMenuOpen(true)} className="rounded-lg p-2 text-[#69758a] hover:bg-[#f4f5f7] lg:hidden" aria-label="فتح القائمة"><Menu /></button><div><h1 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">مرحباً، {isAdmin ? 'الأدمن' : email}</h1></div></div>
          <Bell size={19} strokeWidth={1.8} className="text-[#69758a]" />
        </header>
        <div className="mx-auto max-w-[1400px] p-5 pb-24 sm:p-8 lg:pb-8">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div><h2 className="text-2xl font-bold sm:text-3xl">لوحة التحكم</h2><p className="mt-2 text-sm text-[#8d97a7]">تابع حركة النشر والطباعة والمخزن من مكان واحد.</p></div>
            {canView('contracts') && <Link href="/contracts" className="flex w-fit items-center justify-center gap-2 rounded-xl bg-[#d8573a] px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(216,87,58,0.18)]"><Plus size={18} />إضافة كتاب جديد</Link>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat title="إجمالي الكتب" value={loading ? '...' : books.length.toLocaleString('ar-EG')} icon={BookOpen} />
            <Stat title="إجمالي النسخ المطبوعة" value={loading ? '...' : totalPrinted.toLocaleString('ar-EG')} icon={Factory} />
            <Stat title="أوردرات قيد التسليم" value={loading ? '...' : pendingOrders.toLocaleString('ar-EG')} icon={ShoppingCart} />
            <Stat title="إجمالي المؤلفين" value={loading ? '...' : authorsCount.toLocaleString('ar-EG')} icon={Users} />
          </div>

          {categoryBreakdown.length > 0 && (
            <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
              <section className="rounded-2xl border border-[#e8ebf0] bg-white p-5 sm:p-6 xl:col-span-2">
                <div className="mb-6 flex items-center justify-between"><div><h3 className="font-bold">توزيع التصنيفات</h3><p className="mt-1 text-xs text-[#9ba4b2]">الكتب حسب النوع</p></div></div>
                <div className="flex flex-col items-center gap-7 sm:flex-row sm:justify-center">
                  <div className="relative flex size-[142px] items-center justify-center rounded-full" style={{ background: `conic-gradient(${gradientStops})` }}>
                    <div className="flex size-[94px] items-center justify-center rounded-full bg-white text-center"><div><strong className="block text-2xl">{books.length}</strong><span className="text-[10px] text-[#9ba4b2]">كتاب</span></div></div>
                  </div>
                  <div className="flex flex-col gap-3 text-xs text-[#69758a]">{categoryBreakdown.map(c => <Legend key={c.label} color={c.color} text={c.label} value={`${c.pct}%`} />)}</div>
                </div>
              </section>
            </div>
          )}

          <section className="mt-6 rounded-2xl border border-[#e8ebf0] bg-white p-5 sm:p-6">
            <div className="mb-5"><h3 className="font-bold">أحدث الكتب</h3><p className="mt-1 text-xs text-[#9ba4b2]">آخر الكتب المضافة إلى مكتبتك</p></div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-right text-sm">
                <thead><tr className="border-b border-[#eef0f3] text-xs text-[#9ba4b2]"><th className="pb-3 font-medium">الكتاب</th><th className="pb-3 font-medium">المؤلف</th><th className="pb-3 font-medium">التصنيف</th><th className="pb-3 font-medium">عدد النسخ</th><th className="pb-3 font-medium">تاريخ التعاقد</th></tr></thead>
                <tbody>{books.map(book => (
                  <tr key={book.id} className="border-b border-[#f1f3f5] last:border-0">
                    <td className="py-4"><div className="flex items-center gap-3"><div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#fce2dc]"><BookOpen size={17} className="text-[#d8573a]" /></div><p className="font-semibold">{book.title}</p></div></td>
                    <td className="py-4 text-[#69758a]">{book.book_authors?.map(a => a.authors.name).join('، ')}</td>
                    <td className="py-4 text-[#69758a]">{book.category}</td>
                    <td className="py-4 font-medium">{book.printed_copies?.toLocaleString('ar-EG')}</td>
                    <td className="py-4 text-xs text-[#69758a]">{book.contract_date}</td>
                  </tr>
                ))}</tbody>
              </table>
              {!loading && books.length === 0 && <p className="py-10 text-center text-sm text-[#9ba4b2]">لا توجد كتب مسجلة بعد — ابدئي بإضافة كتاب من التعاقدات.</p>}
            </div>
          </section>
        </div>
      </section>
      <nav className="fixed inset-x-0 bottom-0 z-20 flex gap-1 overflow-x-auto border-t border-[#e8ebf0] bg-white px-2 py-2 lg:hidden">{navItems.map(({ label, href, icon: Icon }) => <Link key={href} href={href} className={`flex min-w-[72px] flex-1 flex-col items-center gap-1 rounded-lg px-1 py-1 text-[10px] ${pathname === href ? 'text-[#d8573a]' : 'text-[#8d97a7]'}`}><Icon size={18} /><span className="truncate">{label}</span></Link>)}</nav>
    </main>
  )
}

function Stat({ title, value, icon: Icon }: { title: string; value: string; icon: typeof BookOpen }) {
  return <div className="rounded-2xl border border-[#e8ebf0] bg-white p-5"><div className="flex items-start justify-between"><div><p className="text-xs text-[#8d97a7]">{title}</p><p className="mt-3 text-xl font-bold tracking-tight sm:text-2xl">{value}</p></div><div className="flex size-10 items-center justify-center rounded-xl bg-[#fff0ed] text-[#d8573a]"><Icon size={19} /></div></div></div>
}
function Legend({ color, text, value }: { color: string; text: string; value: string }) {
  return <div className="flex items-center gap-2"><span className="size-2 rounded-full" style={{ background: color }} /><span>{text}</span><strong className="mr-auto text-[#1a2540]">{value}</strong></div>
}
