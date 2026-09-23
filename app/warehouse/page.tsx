'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, ClipboardList, Factory, Grid2X2, History, LayoutDashboard, LogOut, Menu, Plus, Search, ShieldCheck, ShoppingCart, Warehouse, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useStaffAccess } from '@/lib/useStaffAccess'
import { SharedLayout } from '@/components/SharedLayout'

type Book = { id: string; title: string; book_authors: { authors: { name: string } }[] }
type Batch = { id: string; book_id: string; received_at: string; quantity: number }
const LOW_STOCK = 20

export default function WarehousePage() {
  const pathname = usePathname()
  const { loading: accessLoading, isAdmin, canView, canEdit, signOut } = useStaffAccess()
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
  const [query, setQuery] = useState('')
  const [lowOnly, setLowOnly] = useState(false)
  const [books, setBooks] = useState<Book[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ bookId: '', receivedAt: '', quantity: '' })
  const [historyBook, setHistoryBook] = useState<Book | null>(null)
  const supabase = createClient()

  const load = async () => {
    setLoading(true)
    const [{ data: b }, { data: w }] = await Promise.all([
      supabase.from('books').select('id, title, book_authors(authors(name))').order('title'),
      supabase.from('warehouse_log').select('*').order('received_at', { ascending: false }),
    ])
    setBooks((b as any) ?? [])
    setBatches(w ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const totals = useMemo(() => books.map(book => {
    const bookBatches = batches.filter(b => b.book_id === book.id)
    const total = bookBatches.reduce((sum, b) => sum + b.quantity, 0)
    return { book, total, lastReceived: bookBatches[0]?.received_at ?? '—' }
  }), [books, batches])
  const filtered = useMemo(() => totals.filter(row => row.book.title.includes(query) && (!lowOnly || (row.total > 0 && row.total < LOW_STOCK))), [totals, query, lowOnly])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.bookId || !form.receivedAt || !form.quantity) return
    setSaving(true)
    await supabase.from('warehouse_log').insert({ book_id: form.bookId, received_at: form.receivedAt, quantity: Number(form.quantity) })
    setSaving(false)
    setForm({ bookId: '', receivedAt: '', quantity: '' })
    setFormOpen(false)
    load()
  }

  const stockBadge = (total: number) => {
    if (total === 0) return <span className="rounded-full bg-[#f7dbd3] px-3 py-1 text-xs font-semibold text-[#c04a2f]">نفد</span>
    if (total < LOW_STOCK) return <span className="rounded-full bg-[#fbeed6] px-3 py-1 text-xs font-semibold text-[#8a5a1a]">منخفض</span>
    return <span className="rounded-full bg-[#e8f2df] px-3 py-1 text-xs font-semibold text-[#4a7a2c]">طبيعي</span>
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#faf6f0] text-[#2a211c]">
      <aside className={`fixed inset-y-0 right-0 z-40 flex w-[252px] flex-col border-l border-[#e8dfd3] bg-white px-5 py-6 transition-transform lg:translate-x-0 ${menuOpen ? 'translate-x-0' : 'translate-x-[110%]'}`}>
        <div className="flex items-center justify-between pb-8"><div className="flex items-center gap-2.5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#faf1eb] p-1.5"><img src="/abhar-logo.png" alt="إبهار" className="h-full w-full object-contain" /></div>
          <div className="min-w-0"><p className="font-serif text-base font-semibold leading-tight text-[#2a211c]">إبهار</p><p className="text-[10px] leading-tight text-[#a3907e]">للتوزيع والنشر</p></div>
        </div><button onClick={() => setMenuOpen(false)} className="lg:hidden" aria-label="إغلاق القائمة"><X /></button></div>
        <p className="mb-3 px-3 text-[11px] font-semibold tracking-[0.16em] text-[#a3907e]">القائمة الرئيسية</p>
        <nav className="flex flex-col gap-1.5">{navItems.map(({ label, href, icon: Icon }) => <Link key={href} href={href} onClick={() => setMenuOpen(false)} className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium ${pathname === href ? 'bg-[#faf1eb] text-[#d8573a]' : 'text-[#6b5d53] hover:bg-[#faf6f0]'}`}><Icon size={19} /><span>{label}</span></Link>)}</nav>
        <div className="mt-auto border-t border-[#ede4d7] pt-4"><button onClick={signOut} className="flex items-center gap-3 px-3.5 py-3 text-sm text-[#6b5d53] hover:text-[#c04a2f]"><LogOut size={19} />تسجيل الخروج</button></div>
      </aside>
      {menuOpen && <button className="fixed inset-0 z-30 bg-[#2a211c]/20 lg:hidden" onClick={() => setMenuOpen(false)} aria-label="إغلاق القائمة" />}

      <section className="lg:mr-[252px]">
        <header className="flex h-[84px] items-center justify-between border-b border-[#e8dfd3] bg-white px-5 sm:px-8"><div className="flex items-center gap-3"><button onClick={() => setMenuOpen(true)} className="lg:hidden" aria-label="فتح القائمة"><Menu /></button><div><p className="text-xs text-[#8a7969]">النسخ المستلمة في المخزن</p><h1 className="font-serif mt-1 text-xl font-semibold sm:text-2xl">المخزن</h1></div></div><Bell size={19} className="text-[#6b5d53]" /></header>
        <div className="mx-auto max-w-[1400px] p-5 pb-24 sm:p-8 lg:pb-8">
          {!accessLoading && !canView('warehouse') ? <p className="rounded-xl border border-[#e8dfd3] bg-white p-6 text-center text-sm text-[#a3907e]">مفيش صلاحية وصول لهذا القسم.</p> : (
            <>
              <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="mb-2 flex items-center gap-2 text-xs font-medium text-[#d8573a]"><span className="size-2 rounded-full bg-[#d8573a]" />إجمالي كل كتاب هو مجموع دفعاته</div><h2 className="font-serif text-3xl font-semibold sm:text-4xl">مخزون الكتب</h2><p className="mt-2 text-sm text-[#8a7969]">سجل كل دفعة وصلت للمخزن وتابع الرصيد الحالي.</p></div>{canEdit('warehouse') && <button onClick={() => setFormOpen(true)} className="flex w-fit items-center gap-2 rounded-xl bg-[#d8573a] px-4 py-3 text-sm font-semibold text-white"><Plus size={18} />إضافة دفعة جديدة</button>}</div>
              <section className="rounded-2xl border border-[#e8dfd3] bg-white shadow-[0_1px_3px_-1px_rgba(90,60,40,0.06)]">
                <div className="flex flex-col gap-3 border-b border-[#ede4d7] p-4 sm:flex-row sm:items-center"><label className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-[#e8dfd3] px-3 py-2 text-xs text-[#a3907e]"><Search size={15} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="ابحث باسم الكتاب" className="w-full bg-transparent outline-none" /></label><label className="flex items-center gap-2 text-xs text-[#6b5d53]"><input type="checkbox" checked={lowOnly} onChange={e => setLowOnly(e.target.checked)} className="size-4 accent-[#d8573a]" />منخفض المخزون فقط</label><span className="text-xs text-[#a3907e]">{loading ? 'جارٍ التحميل...' : `${filtered.length} كتب`}</span></div>
                <div className="overflow-x-auto"><table className="w-full min-w-[800px] text-right text-sm"><thead><tr className="border-b border-[#ede4d7] text-xs text-[#a3907e]"><th className="px-5 py-4">اسم الكتاب</th><th className="px-5 py-4">اسم الكاتب</th><th className="px-5 py-4">إجمالي النسخ المستلمة</th><th className="px-5 py-4">تاريخ آخر استلام</th><th className="px-5 py-4">حالة المخزون</th><th className="px-5 py-4">إجراء</th></tr></thead><tbody>{filtered.map(row => <tr key={row.book.id} className="border-b border-[#f0e7db] last:border-0"><td className="px-5 py-4 font-semibold">{row.book.title}</td><td className="px-5 py-4 text-[#6b5d53]">{row.book.book_authors?.map(a => a.authors.name).join('، ')}</td><td className="px-5 py-4 text-[#6b5d53]">{row.total.toLocaleString('ar-EG')}</td><td className="px-5 py-4 text-[#6b5d53]">{row.lastReceived}</td><td className="px-5 py-4">{stockBadge(row.total)}</td><td className="px-5 py-4"><button onClick={() => setHistoryBook(row.book)} className="flex items-center gap-1.5 rounded-lg border border-[#e8dfd3] px-3 py-2 text-xs font-semibold text-[#d8573a]"><History size={14} />السجل</button></td></tr>)}</tbody></table>{!loading && filtered.length === 0 && <p className="p-8 text-center text-sm text-[#a3907e]">لا توجد كتب مسجلة بعد.</p>}</div>
              </section>
            </>
          )}
        </div>
      </section>
      <nav className="fixed inset-x-0 bottom-0 z-20 flex gap-1 overflow-x-auto border-t border-[#e8dfd3] bg-white px-2 py-2 lg:hidden">{navItems.map(({ label, href, icon: Icon }) => <Link key={href} href={href} className={`flex min-w-[72px] flex-1 flex-col items-center gap-1 rounded-lg px-1 py-1 text-[10px] ${pathname === href ? 'text-[#d8573a]' : 'text-[#8a7969]'}`}><Icon size={18} /><span className="truncate">{label}</span></Link>)}</nav>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#2a211c]/30 p-3 sm:p-6">
          <section className="my-3 w-full max-w-lg rounded-2xl bg-white shadow-2xl sm:my-8">
            <div className="flex items-center justify-between border-b border-[#ede4d7] p-5"><div><h2 className="font-serif text-xl font-semibold">إضافة دفعة جديدة</h2><p className="mt-1 text-xs text-[#a3907e]">يتم اختيار الكتاب من الكتب المسجلة فقط</p></div><button onClick={() => setFormOpen(false)} aria-label="إغلاق"><X /></button></div>
            <form onSubmit={submit} className="flex flex-col gap-4 p-5">
              <label><span className="mb-2 block text-xs font-semibold text-[#6b5d53]">اسم الكتاب</span><select required value={form.bookId} onChange={e => setForm(f => ({ ...f, bookId: e.target.value }))} className="w-full rounded-xl border border-[#e8dfd3] bg-white px-3 py-3 text-sm"><option value="">ابحث واختر كتاباً</option>{books.map(book => <option key={book.id} value={book.id}>{book.title}</option>)}</select></label>
              <label><span className="mb-2 block text-xs font-semibold text-[#6b5d53]">تاريخ استلام المخزن</span><input required type="date" value={form.receivedAt} onChange={e => setForm(f => ({ ...f, receivedAt: e.target.value }))} className="w-full rounded-xl border border-[#e8dfd3] px-3 py-3 text-sm" /></label>
              <label><span className="mb-2 block text-xs font-semibold text-[#6b5d53]">عدد النسخ المستلمة</span><input required type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} className="w-full rounded-xl border border-[#e8dfd3] px-3 py-3 text-sm outline-none focus:border-[#d8573a]" /></label>
              <div className="flex justify-end gap-3 border-t border-[#ede4d7] pt-4"><button type="button" onClick={() => setFormOpen(false)} className="rounded-xl border border-[#e8dfd3] px-5 py-3 text-sm font-semibold">إلغاء</button><button disabled={saving} type="submit" className="rounded-xl bg-[#d8573a] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'جارٍ الحفظ...' : 'حفظ الدفعة'}</button></div>
            </form>
          </section>
        </div>
      )}

      {historyBook && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#2a211c]/30 p-3 sm:p-6">
          <section className="my-3 w-full max-w-lg rounded-2xl bg-white shadow-2xl sm:my-8">
            <div className="flex items-center justify-between border-b border-[#ede4d7] p-5"><div><h2 className="font-serif text-xl font-semibold">{historyBook.title}</h2><p className="mt-1 text-xs text-[#a3907e]">سجل دفعات المخزن — الأحدث أولاً</p></div><button onClick={() => setHistoryBook(null)} aria-label="إغلاق"><X /></button></div>
            <div className="flex flex-col gap-2 p-5">
              {batches.filter(b => b.book_id === historyBook.id).map(b => <div key={b.id} className="flex items-center justify-between rounded-xl bg-[#faf6f0] p-4"><span className="text-sm text-[#6b5d53]">{b.received_at}</span><span className="text-sm font-semibold">{b.quantity.toLocaleString('ar-EG')} نسخة</span></div>)}
              {batches.filter(b => b.book_id === historyBook.id).length === 0 && <p className="py-6 text-center text-sm text-[#a3907e]">لا توجد دفعات مسجلة بعد.</p>}
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
