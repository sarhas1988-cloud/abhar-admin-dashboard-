'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, ChevronDown, ClipboardList, Factory, Grid2X2, History, LayoutDashboard, Menu, Plus, Search, Settings, ShieldCheck, ShoppingCart, Warehouse, X } from 'lucide-react'

type Book = { id: string; title: string; authors: string[] }
type Batch = { id: string; bookId: string; receivedAt: string; quantity: number }

const navItems = [
  { label: 'نظرة عامة', href: '/', icon: LayoutDashboard },
  { label: 'التعاقدات والقسم الفني', href: '/contracts', icon: ClipboardList },
  { label: 'المطبعة', href: '/printing', icon: Factory },
  { label: 'المنصات', href: '/platforms', icon: Grid2X2 },
  { label: 'المخزن', href: '/warehouse', icon: Warehouse },
  { label: 'الاوردرات', href: '/orders', icon: ShoppingCart },
  { label: 'الموظفين والصلاحيات', href: '/staff', icon: ShieldCheck },
]

const books: Book[] = [
  { id: 'PR-2401', title: 'ممرات الضوء', authors: ['ليان السالم'] },
  { id: 'PR-2398', title: 'فن الإصغاء', authors: ['د. سامر نجيب'] },
  { id: 'PR-2392', title: 'على حافة الغيم', authors: ['ريم العتيبي', 'هند صالح'] },
  { id: 'PR-2387', title: 'مدن لا تنام', authors: ['ياسر حمد'] },
]

const initialBatches: Batch[] = [
  { id: 'B-1', bookId: 'PR-2401', receivedAt: '2026-08-10', quantity: 600 },
  { id: 'B-2', bookId: 'PR-2401', receivedAt: '2026-09-20', quantity: 600 },
  { id: 'B-3', bookId: 'PR-2398', receivedAt: '2026-09-15', quantity: 800 },
  { id: 'B-4', bookId: 'PR-2392', receivedAt: '2026-08-01', quantity: 14 },
  { id: 'B-5', bookId: 'PR-2387', receivedAt: '2026-07-10', quantity: 0 },
]

const LOW_STOCK = 20
const emptyForm = { bookId: '', receivedAt: '', quantity: '' }

export default function WarehousePage() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [lowOnly, setLowOnly] = useState(false)
  const [batches, setBatches] = useState(initialBatches)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [historyBook, setHistoryBook] = useState<Book | null>(null)

  const totals = useMemo(() => books.map(book => {
    const bookBatches = batches.filter(b => b.bookId === book.id).sort((a, b) => b.receivedAt.localeCompare(a.receivedAt))
    const total = bookBatches.reduce((sum, b) => sum + b.quantity, 0)
    return { book, total, lastReceived: bookBatches[0]?.receivedAt ?? '—' }
  }), [batches])

  const filtered = useMemo(() => totals.filter(row => row.book.title.includes(query) && (!lowOnly || (row.total > 0 && row.total < LOW_STOCK))), [totals, query, lowOnly])

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.bookId || !form.receivedAt || !form.quantity) return
    setBatches(current => [{ id: `B-${Date.now()}`, bookId: form.bookId, receivedAt: form.receivedAt, quantity: Number(form.quantity) }, ...current])
    setForm(emptyForm)
    setFormOpen(false)
  }

  const stockBadge = (total: number) => {
    if (total === 0) return <span className="rounded-full bg-[#fce8e6] px-3 py-1 text-xs font-semibold text-[#c84c3b]">نفد</span>
    if (total < LOW_STOCK) return <span className="rounded-full bg-[#fff4e5] px-3 py-1 text-xs font-semibold text-[#b26b16]">منخفض</span>
    return <span className="rounded-full bg-[#e9f7ef] px-3 py-1 text-xs font-semibold text-[#25824a]">طبيعي</span>
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#f7f8fa] text-[#1a2540]">
      <aside className={`fixed inset-y-0 right-0 z-40 flex w-[252px] flex-col border-l border-[#e8ebf0] bg-white px-5 py-6 transition-transform lg:translate-x-0 ${menuOpen ? 'translate-x-0' : 'translate-x-[110%]'}`}>
        <div className="flex items-center justify-between pb-8">
          <img src="/abhar-logo.svg" alt="إبهار للنشر والتوزيع" className="h-[98px] w-[112px] object-contain" />
          <button onClick={() => setMenuOpen(false)} className="lg:hidden" aria-label="إغلاق القائمة"><X /></button>
        </div>
        <p className="mb-3 px-3 text-[11px] font-semibold tracking-[0.16em] text-[#9ba4b2]">القائمة الرئيسية</p>
        <nav className="flex flex-col gap-1.5">
          {navItems.map(({ label, href, icon: Icon }) => (
            <Link key={href} href={href} onClick={() => setMenuOpen(false)} className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium ${pathname === href ? 'bg-[#fff0ed] text-[#d8573a]' : 'text-[#69758a] hover:bg-[#f7f8fa]'}`}>
              <Icon size={19} /><span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t border-[#edf0f3] pt-4">
          <button className="flex items-center gap-3 px-3.5 py-3 text-sm text-[#69758a]"><Settings size={19} />الإعدادات</button>
          <div className="mt-3 flex items-center gap-3 rounded-xl bg-[#f7f8fa] p-3">
            <div className="flex size-9 items-center justify-center rounded-full bg-[#1a2540] text-xs font-bold text-white">م</div>
            <div><p className="text-xs font-semibold">مدير النظام</p><p className="text-[10px] text-[#8d97a7]">admin@abhar.sa</p></div>
            <ChevronDown size={15} className="mr-auto" />
          </div>
        </div>
      </aside>
      {menuOpen && <button className="fixed inset-0 z-30 bg-[#1a2540]/20 lg:hidden" onClick={() => setMenuOpen(false)} aria-label="إغلاق القائمة" />}

      <section className="lg:mr-[252px]">
        <header className="flex h-[84px] items-center justify-between border-b border-[#e8ebf0] bg-white px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setMenuOpen(true)} className="lg:hidden" aria-label="فتح القائمة"><Menu /></button>
            <div><p className="text-xs text-[#8d97a7]">النسخ المستلمة في المخزن</p><h1 className="mt-1 text-xl font-bold sm:text-2xl">المخزن</h1></div>
          </div>
          <div className="flex items-center gap-3"><Bell size={19} className="text-[#69758a]" /><span className="hidden text-sm text-[#69758a] sm:block">مدير النظام</span></div>
        </header>

        <div className="mx-auto max-w-[1400px] p-5 pb-24 sm:p-8 lg:pb-8">
          <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-[#d8573a]"><span className="size-2 rounded-full bg-[#d8573a]" />إجمالي كل كتاب هو مجموع دفعاته</div>
              <h2 className="text-2xl font-bold sm:text-3xl">مخزون الكتب</h2>
              <p className="mt-2 text-sm text-[#8d97a7]">سجل كل دفعة وصلت للمخزن وتابع الرصيد الحالي.</p>
            </div>
            <button onClick={() => setFormOpen(true)} className="flex w-fit items-center gap-2 rounded-xl bg-[#d8573a] px-4 py-3 text-sm font-semibold text-white"><Plus size={18} />إضافة دفعة جديدة</button>
          </div>

          <section className="rounded-2xl border border-[#e8ebf0] bg-white">
            <div className="flex flex-col gap-3 border-b border-[#eef0f3] p-4 sm:flex-row sm:items-center">
              <label className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-[#e8ebf0] px-3 py-2 text-xs text-[#9ba4b2]">
                <Search size={15} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="ابحث باسم الكتاب" className="w-full bg-transparent outline-none" />
              </label>
              <label className="flex items-center gap-2 text-xs text-[#69758a]"><input type="checkbox" checked={lowOnly} onChange={e => setLowOnly(e.target.checked)} className="size-4 accent-[#d8573a]" />منخفض المخزون فقط</label>
              <span className="text-xs text-[#9ba4b2]">{filtered.length} كتب</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-right text-sm">
                <thead>
                  <tr className="border-b border-[#eef0f3] text-xs text-[#9ba4b2]">
                    <th className="px-5 py-4">اسم الكتاب</th>
                    <th className="px-5 py-4">اسم الكاتب</th>
                    <th className="px-5 py-4">إجمالي النسخ المستلمة</th>
                    <th className="px-5 py-4">تاريخ آخر استلام</th>
                    <th className="px-5 py-4">حالة المخزون</th>
                    <th className="px-5 py-4">إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(row => (
                    <tr key={row.book.id} className="border-b border-[#f1f3f5] last:border-0">
                      <td className="px-5 py-4 font-semibold">{row.book.title}</td>
                      <td className="px-5 py-4 text-[#69758a]">{row.book.authors.join('، ')}</td>
                      <td className="px-5 py-4 text-[#69758a]">{row.total.toLocaleString('ar-EG')}</td>
                      <td className="px-5 py-4 text-[#69758a]">{row.lastReceived}</td>
                      <td className="px-5 py-4">{stockBadge(row.total)}</td>
                      <td className="px-5 py-4"><button onClick={() => setHistoryBook(row.book)} className="flex items-center gap-1.5 rounded-lg border border-[#e8ebf0] px-3 py-2 text-xs font-semibold text-[#d8573a]"><History size={14} />السجل</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </section>

      <nav className="fixed inset-x-0 bottom-0 z-20 flex gap-1 overflow-x-auto border-t border-[#e8ebf0] bg-white px-2 py-2 lg:hidden">
        {navItems.map(({ label, href, icon: Icon }) => (
          <Link key={href} href={href} className={`flex min-w-[72px] flex-1 flex-col items-center gap-1 rounded-lg px-1 py-1 text-[10px] ${pathname === href ? 'text-[#d8573a]' : 'text-[#8d97a7]'}`}>
            <Icon size={18} /><span className="truncate">{label}</span>
          </Link>
        ))}
      </nav>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#1a2540]/30 p-3 sm:p-6">
          <section className="my-3 w-full max-w-lg rounded-2xl bg-white shadow-2xl sm:my-8">
            <div className="flex items-center justify-between border-b border-[#eef0f3] p-5">
              <div><h2 className="text-xl font-bold">إضافة دفعة جديدة</h2><p className="mt-1 text-xs text-[#9ba4b2]">يتم اختيار الكتاب من الكتب المسجلة فقط</p></div>
              <button onClick={() => setFormOpen(false)} aria-label="إغلاق"><X /></button>
            </div>
            <form onSubmit={submit} className="flex flex-col gap-4 p-5">
              <label>
                <span className="mb-2 block text-xs font-semibold text-[#69758a]">اسم الكتاب</span>
                <select required value={form.bookId} onChange={e => setForm(f => ({ ...f, bookId: e.target.value }))} className="w-full rounded-xl border border-[#e8ebf0] bg-white px-3 py-3 text-sm">
                  <option value="">ابحث واختر كتاباً</option>
                  {books.map(book => <option key={book.id} value={book.id}>{book.title} — {book.authors.join('، ')}</option>)}
                </select>
              </label>
              <label>
                <span className="mb-2 block text-xs font-semibold text-[#69758a]">تاريخ استلام المخزن</span>
                <input required type="date" value={form.receivedAt} onChange={e => setForm(f => ({ ...f, receivedAt: e.target.value }))} className="w-full rounded-xl border border-[#e8ebf0] px-3 py-3 text-sm" />
              </label>
              <label>
                <span className="mb-2 block text-xs font-semibold text-[#69758a]">عدد النسخ المستلمة</span>
                <input required type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} className="w-full rounded-xl border border-[#e8ebf0] px-3 py-3 text-sm outline-none focus:border-[#d8573a]" />
              </label>
              <div className="flex justify-end gap-3 border-t border-[#eef0f3] pt-4">
                <button type="button" onClick={() => setFormOpen(false)} className="rounded-xl border border-[#e8ebf0] px-5 py-3 text-sm font-semibold">إلغاء</button>
                <button type="submit" className="rounded-xl bg-[#d8573a] px-5 py-3 text-sm font-semibold text-white">حفظ الدفعة</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {historyBook && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#1a2540]/30 p-3 sm:p-6">
          <section className="my-3 w-full max-w-lg rounded-2xl bg-white shadow-2xl sm:my-8">
            <div className="flex items-center justify-between border-b border-[#eef0f3] p-5">
              <div><h2 className="text-xl font-bold">{historyBook.title}</h2><p className="mt-1 text-xs text-[#9ba4b2]">سجل دفعات المخزن — الأحدث أولاً</p></div>
              <button onClick={() => setHistoryBook(null)} aria-label="إغلاق"><X /></button>
            </div>
            <div className="flex flex-col gap-2 p-5">
              {batches.filter(b => b.bookId === historyBook.id).sort((a, b) => b.receivedAt.localeCompare(a.receivedAt)).map(b => (
                <div key={b.id} className="flex items-center justify-between rounded-xl bg-[#f7f8fa] p-4">
                  <span className="text-sm text-[#69758a]">{b.receivedAt}</span>
                  <span className="text-sm font-semibold">{b.quantity.toLocaleString('ar-EG')} نسخة</span>
                </div>
              ))}
              {batches.filter(b => b.bookId === historyBook.id).length === 0 && <p className="py-6 text-center text-sm text-[#9ba4b2]">لا توجد دفعات مسجلة بعد.</p>}
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
