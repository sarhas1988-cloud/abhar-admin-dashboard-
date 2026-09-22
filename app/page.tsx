'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, BookOpen, ChevronDown, ClipboardList, Factory, Grid2X2, LayoutDashboard, Menu, MoreHorizontal, Plus, Search, Settings, ShieldCheck, ShoppingCart, TrendingUp, Users, Warehouse, X } from 'lucide-react'

const navItems = [
  { label: 'نظرة عامة', href: '/', icon: LayoutDashboard },
  { label: 'التعاقدات والقسم الفني', href: '/contracts', icon: ClipboardList },
  { label: 'المطبعة', href: '/printing', icon: Factory },
  { label: 'المنصات', href: '/platforms', icon: Grid2X2 },
  { label: 'المخزن', href: '/warehouse', icon: Warehouse },
  { label: 'الاوردرات', href: '/orders', icon: ShoppingCart },
  { label: 'الموظفين والصلاحيات', href: '/staff', icon: ShieldCheck, adminOnly: true },
]

const books = [
  { title: 'ممرات الضوء', author: 'ليان السالم', category: 'رواية', stock: 128, sales: '2,480', status: 'متوفر', tone: 'coral' },
  { title: 'فن الإصغاء', author: 'د. سامر نجيب', category: 'تطوير ذات', stock: 76, sales: '1,920', status: 'متوفر', tone: 'navy' },
  { title: 'على حافة الغيم', author: 'ريم العتيبي', category: 'شعر', stock: 14, sales: '1,204', status: 'منخفض', tone: 'sand' },
  { title: 'مدن لا تنام', author: 'ياسر حمد', category: 'أدب', stock: 0, sales: '890', status: 'نفد', tone: 'slate' },
]

export default function Page() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const isAdmin = true
  const visibleNavItems = navItems.filter(item => !item.adminOnly || isAdmin)

  return (
    <main dir="rtl" className="min-h-screen bg-[#f7f8fa] text-[#1a2540]">
      <aside className={`fixed inset-y-0 right-0 z-40 flex w-[252px] flex-col border-l border-[#e8ebf0] bg-white px-5 py-6 transition-transform duration-300 lg:translate-x-0 ${menuOpen ? 'translate-x-0' : 'translate-x-[110%]'}`}>
        <div className="flex items-center justify-between pb-8">
          <img src="/abhar-logo.svg" alt="إبهار للنشر والتوزيع" className="h-[98px] w-[112px] object-contain" />
          <button onClick={() => setMenuOpen(false)} className="rounded-lg p-2 text-[#7d8798] hover:bg-[#f4f5f7] lg:hidden" aria-label="إغلاق القائمة"><X /></button>
        </div>
        <p className="mb-3 px-3 text-[11px] font-semibold tracking-[0.16em] text-[#9ba4b2]">القائمة الرئيسية</p>
        <nav className="flex flex-col gap-1.5">
          {visibleNavItems.map(({ label, href, icon: Icon }) => <Link key={href} href={href} onClick={() => setMenuOpen(false)} className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-right text-sm font-medium transition ${pathname === href ? 'bg-[#fff0ed] text-[#d8573a]' : 'text-[#69758a] hover:bg-[#f7f8fa] hover:text-[#1a2540]'}`}><Icon size={19} strokeWidth={1.8} /><span>{label}</span>{href === '/orders' && <span className="mr-auto rounded-full bg-[#d8573a] px-2 py-0.5 text-[10px] font-bold text-white">12</span>}</Link>)}
        </nav>
        <div className="mt-auto flex flex-col gap-1.5 border-t border-[#edf0f3] pt-4">
          <button className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-[#69758a] hover:bg-[#f7f8fa]"><Settings size={19} strokeWidth={1.8} />الإعدادات</button>
          <div className="mt-3 flex items-center gap-3 rounded-xl bg-[#f7f8fa] p-3"><div className="flex size-9 items-center justify-center rounded-full bg-[#1a2540] text-xs font-bold text-white">م</div><div className="min-w-0"><p className="truncate text-xs font-semibold">مدير النظام</p><p className="truncate text-[10px] text-[#8d97a7]">admin@abhar.sa</p></div><ChevronDown size={15} className="mr-auto text-[#9ba4b2]" /></div>
        </div>
      </aside>
      {menuOpen && <button className="fixed inset-0 z-30 bg-[#1a2540]/20 lg:hidden" onClick={() => setMenuOpen(false)} aria-label="إغلاق القائمة" />}

      <section className="lg:mr-[252px]">
        <header className="flex h-[84px] items-center justify-between border-b border-[#e8ebf0] bg-white px-5 sm:px-8">
          <div className="flex items-center gap-3"><img src="/abhar-logo.svg" alt="إبهار" className="h-11 w-12 object-contain lg:hidden" /><button onClick={() => setMenuOpen(true)} className="rounded-lg p-2 text-[#69758a] hover:bg-[#f4f5f7] lg:hidden" aria-label="فتح القائمة"><Menu /></button><div><p className="text-xs text-[#8d97a7]">الأحد، ٢١ سبتمبر ٢٠٢٦</p><h1 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">مرحباً، مدير النظام</h1></div></div>
          <div className="flex items-center gap-2 sm:gap-4"><button className="relative rounded-xl p-2.5 text-[#69758a] hover:bg-[#f4f5f7]" aria-label="الإشعارات"><Bell size={19} strokeWidth={1.8} /><span className="absolute right-2 top-2 size-1.5 rounded-full bg-[#d8573a]" /></button><div className="hidden h-7 w-px bg-[#e8ebf0] sm:block" /><button className="hidden items-center gap-2 text-sm font-medium text-[#69758a] sm:flex"><Grid2X2 size={17} />تطبيقات إبهار</button></div>
        </header>
        <div className="mx-auto max-w-[1400px] p-5 pb-24 sm:p-8 lg:pb-8">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="mb-2 flex items-center gap-2 text-xs font-medium text-[#d8573a]"><span className="size-2 rounded-full bg-[#d8573a]" />أداء هذا الشهر</div><h2 className="text-2xl font-bold sm:text-3xl">لوحة التحكم</h2><p className="mt-2 text-sm text-[#8d97a7]">تابع حركة النشر والمبيعات من مكان واحد.</p></div><button className="flex w-fit items-center justify-center gap-2 rounded-xl bg-[#d8573a] px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(216,87,58,0.18)] transition hover:bg-[#c94c31]"><Plus size={18} />إضافة كتاب جديد</button></div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Stat title="إجمالي المبيعات" value="١٢٤,٨٥٠ ر.س" change="+18.4%" icon={TrendingUp} /><Stat title="الكتب المنشورة" value="٢٤٨" change="+12 كتاب" icon={BookOpen} /><Stat title="الطلبات الجديدة" value="٣٨٦" change="+8.2%" icon={ShoppingCart} /><Stat title="إجمالي المؤلفين" value="٧٢" change="+4 مؤلفين" icon={Users} /></div>
          <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]"><section className="rounded-2xl border border-[#e8ebf0] bg-white p-5 sm:p-6"><div className="mb-5 flex items-center justify-between"><div><h3 className="font-bold">المبيعات خلال الشهر</h3><p className="mt-1 text-xs text-[#9ba4b2]">نظرة على أداء مبيعات الكتب</p></div><select className="rounded-lg border border-[#e8ebf0] bg-white px-3 py-2 text-xs text-[#69758a] outline-none"><option>آخر ٦ أشهر</option><option>هذا العام</option></select></div><div className="flex h-[190px] items-end gap-2 border-b border-[#eef0f3] pb-0 sm:gap-4">{[38,52,44,70,58,84,73,92,68,78,88,100].map((height, i) => <div key={i} className="group flex flex-1 flex-col items-center gap-2"><div className={`w-full max-w-[26px] rounded-t-md transition ${i === 11 ? 'bg-[#d8573a]' : 'bg-[#f6c3b8] group-hover:bg-[#e99582]'}`} style={{ height: `${height}%` }} /><span className="text-[10px] text-[#a4adba]">{['أب','س','ص','ع','م','د','أب','س','ص','ع','م','د'][i]}</span></div>)}</div><div className="mt-5 flex items-center gap-2 text-xs text-[#8d97a7]"><span className="size-2 rounded-full bg-[#d8573a]" />إجمالي الإيرادات <strong className="mr-1 text-sm text-[#1a2540]">١٢٤,٨٥٠ ر.س</strong></div></section><section className="rounded-2xl border border-[#e8ebf0] bg-white p-5 sm:p-6"><div className="mb-6 flex items-center justify-between"><div><h3 className="font-bold">توزيع التصنيفات</h3><p className="mt-1 text-xs text-[#9ba4b2]">الكتب حسب النوع</p></div><button className="text-xs font-semibold text-[#d8573a]">عرض الكل</button></div><div className="flex items-center justify-center gap-7"><div className="relative flex size-[142px] items-center justify-center rounded-full" style={{ background: 'conic-gradient(#d8573a 0 42%, #1a2540 42% 69%, #f2b5a8 69% 87%, #dce2e9 87% 100%)' }}><div className="flex size-[94px] items-center justify-center rounded-full bg-white text-center"><div><strong className="block text-2xl">٢٤٨</strong><span className="text-[10px] text-[#9ba4b2]">كتاب</span></div></div></div><div className="flex flex-col gap-3 text-xs text-[#69758a]"><Legend color="bg-[#d8573a]" text="رواية" value="42%" /><Legend color="bg-[#1a2540]" text="تطوير ذات" value="27%" /><Legend color="bg-[#f2b5a8]" text="شعر" value="18%" /><Legend color="bg-[#dce2e9]" text="أخرى" value="13%" /></div></div></section></div>
          <section className="mt-6 rounded-2xl border border-[#e8ebf0] bg-white p-5 sm:p-6"><div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-bold">أحدث الكتب</h3><p className="mt-1 text-xs text-[#9ba4b2]">آخر الكتب المضافة إلى مكتبتك</p></div><div className="flex gap-2"><label className="flex flex-1 items-center gap-2 rounded-lg border border-[#e8ebf0] px-3 py-2 text-xs text-[#9ba4b2] sm:flex-none"><Search size={15} /><input placeholder="بحث في الكتب" className="w-full bg-transparent outline-none placeholder:text-[#aeb6c1] sm:w-32" /></label><button className="rounded-lg border border-[#e8ebf0] px-3 text-xs text-[#69758a] hover:bg-[#f7f8fa]">تصفية</button></div></div><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-right text-sm"><thead><tr className="border-b border-[#eef0f3] text-xs text-[#9ba4b2]"><th className="pb-3 font-medium">الكتاب</th><th className="pb-3 font-medium">التصنيف</th><th className="pb-3 font-medium">المخزون</th><th className="pb-3 font-medium">المبيعات</th><th className="pb-3 font-medium">الحالة</th><th className="pb-3" /></tr></thead><tbody>{books.map(book => <tr key={book.title} className="border-b border-[#f1f3f5] last:border-0"><td className="py-4"><div className="flex items-center gap-3"><div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${book.tone === 'coral' ? 'bg-[#fce2dc]' : book.tone === 'navy' ? 'bg-[#dfe5ef]' : book.tone === 'sand' ? 'bg-[#f6ead7]' : 'bg-[#e8ebf0]'}`}><BookOpen size={17} className="text-[#d8573a]" /></div><div><p className="font-semibold">{book.title}</p><p className="mt-0.5 text-xs text-[#9ba4b2]">{book.author}</p></div></div></td><td className="py-4 text-[#69758a]">{book.category}</td><td className="py-4 text-[#69758a]">{book.stock}</td><td className="py-4 font-medium">{book.sales}</td><td className="py-4"><span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${book.status === 'متوفر' ? 'bg-[#e9f6ef] text-[#328257]' : book.status === 'منخفض' ? 'bg-[#fff3df] text-[#b9781a]' : 'bg-[#fce8e6] text-[#c84c3b]'}`}>{book.status}</span></td><td className="py-4"><button className="rounded-lg p-1 text-[#9ba4b2] hover:bg-[#f7f8fa]" aria-label={`خيارات ${book.title}`}><MoreHorizontal size={18} /></button></td></tr>)}</tbody></table></div></section>
        </div>
      </section>
      <nav className="fixed inset-x-0 bottom-0 z-20 flex gap-1 overflow-x-auto border-t border-[#e8ebf0] bg-white px-2 py-2 lg:hidden">{visibleNavItems.map(({ label, href, icon: Icon }) => <Link key={href} href={href} className={`flex min-w-[72px] flex-1 flex-col items-center gap-1 rounded-lg px-1 py-1 text-[10px] ${pathname === href ? 'text-[#d8573a]' : 'text-[#8d97a7]'}`}><Icon size={18} /><span className="truncate">{label}</span></Link>)}</nav>
    </main>
  )
}

function Stat({ title, value, change, icon: Icon }: { title: string; value: string; change: string; icon: typeof TrendingUp }) { return <div className="rounded-2xl border border-[#e8ebf0] bg-white p-5"><div className="flex items-start justify-between"><div><p className="text-xs text-[#8d97a7]">{title}</p><p className="mt-3 text-xl font-bold tracking-tight sm:text-2xl">{value}</p></div><div className="flex size-10 items-center justify-center rounded-xl bg-[#fff0ed] text-[#d8573a]"><Icon size={19} /></div></div><p className="mt-4 text-xs text-[#4b9a70]"><span className="font-bold">{change}</span> <span className="text-[#9ba4b2]">من الشهر الماضي</span></p></div> }
function Legend({ color, text, value }: { color: string; text: string; value: string }) { return <div className="flex items-center gap-2"><span className={`size-2 rounded-full ${color}`} /><span>{text}</span><strong className="mr-auto text-[#1a2540]">{value}</strong></div> }

// Keep the dashboard UI static until a data integration is connected.
// The layout is intentionally ready for live books, inventory, and order data later.
