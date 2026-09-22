'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, ChevronDown, ClipboardList, Factory, Grid2X2, LayoutDashboard, Menu, Plus, Search, Settings, ShieldCheck, ShoppingCart, Warehouse, X } from 'lucide-react'

type Book = { id: string; title: string; authors: string[] }
type Status = 'متاح' | 'غير متاح' | 'قيد المراجعة'
type PlatformState = Record<string, Record<string, { status: Status; notes: string }>>

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

const defaultPlatforms = ['ابهار', 'بوكلاود', 'نيل وفرات', 'سماوي', 'ايريد', 'أبجد']

const statusStyle: Record<Status, string> = {
  'متاح': 'bg-[#e9f7ef] text-[#25824a]',
  'غير متاح': 'bg-[#fce8e6] text-[#c84c3b]',
  'قيد المراجعة': 'bg-[#fff4e5] text-[#b26b16]',
}

const initialState: PlatformState = Object.fromEntries(
  books.map(book => [book.id, Object.fromEntries(defaultPlatforms.map(p => [p, { status: 'غير متاح' as Status, notes: '' }]))])
)

export default function PlatformsPage() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [platforms, setPlatforms] = useState(defaultPlatforms)
  const [newPlatform, setNewPlatform] = useState('')
  const [query, setQuery] = useState('')
  const [state, setState] = useState<PlatformState>(initialState)
  const [editingBook, setEditingBook] = useState<Book | null>(null)

  const filteredBooks = useMemo(() => books.filter(book => book.title.includes(query)), [query])

  const addPlatform = () => {
    if (!newPlatform.trim() || platforms.includes(newPlatform.trim())) return
    const name = newPlatform.trim()
    setPlatforms(current => [...current, name])
    setState(current => Object.fromEntries(Object.entries(current).map(([bookId, entries]) => [bookId, { ...entries, [name]: { status: 'غير متاح', notes: '' } }])))
    setNewPlatform('')
  }

  const updateStatus = (bookId: string, platform: string, status: Status) =>
    setState(current => ({ ...current, [bookId]: { ...current[bookId], [platform]: { ...current[bookId][platform], status } } }))

  const updateNotes = (bookId: string, platform: string, notes: string) =>
    setState(current => ({ ...current, [bookId]: { ...current[bookId], [platform]: { ...current[bookId][platform], notes } } }))

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
            <div><p className="text-xs text-[#8d97a7]">متابعة الكتب على منصات البيع</p><h1 className="mt-1 text-xl font-bold sm:text-2xl">المنصات</h1></div>
          </div>
          <div className="flex items-center gap-3"><Bell size={19} className="text-[#69758a]" /><span className="hidden text-sm text-[#69758a] sm:block">مدير النظام</span></div>
        </header>

        <div className="mx-auto max-w-[1400px] p-5 pb-24 sm:p-8 lg:pb-8">
          <div className="mb-6 flex items-center gap-2 text-xs font-medium text-[#d8573a]"><span className="size-2 rounded-full bg-[#d8573a]" />متابعة يدوية — لا يوجد ربط تلقائي بالمنصات</div>

          <section className="mb-6 rounded-2xl border border-[#e8ebf0] bg-white p-5 sm:p-6">
            <h3 className="mb-4 font-bold">قائمة المنصات</h3>
            <div className="flex flex-wrap gap-2">
              {platforms.map(p => <span key={p} className="rounded-full bg-[#f7f8fa] px-3 py-1.5 text-xs font-medium text-[#69758a]">{p}</span>)}
            </div>
            <div className="mt-4 flex gap-2">
              <input value={newPlatform} onChange={e => setNewPlatform(e.target.value)} placeholder="اسم منصة جديدة" className="min-w-0 flex-1 rounded-lg border border-[#e8ebf0] px-3 py-2 text-sm outline-none focus:border-[#d8573a] sm:max-w-xs" />
              <button onClick={addPlatform} className="flex items-center gap-1.5 rounded-lg bg-[#fff0ed] px-3 py-2 text-xs font-semibold text-[#d8573a]"><Plus size={15} />إضافة منصة</button>
            </div>
          </section>

          <section className="rounded-2xl border border-[#e8ebf0] bg-white">
            <div className="flex flex-col gap-3 border-b border-[#eef0f3] p-4 sm:flex-row sm:items-center">
              <label className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-[#e8ebf0] px-3 py-2 text-xs text-[#9ba4b2]">
                <Search size={15} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="ابحث باسم الكتاب" className="w-full bg-transparent outline-none" />
              </label>
              <span className="text-xs text-[#9ba4b2]">{filteredBooks.length} كتب</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-right text-sm">
                <thead>
                  <tr className="border-b border-[#eef0f3] text-xs text-[#9ba4b2]">
                    <th className="px-5 py-4">اسم الكتاب</th>
                    {platforms.map(p => <th key={p} className="px-3 py-4">{p}</th>)}
                    <th className="px-5 py-4">إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBooks.map(book => (
                    <tr key={book.id} className="border-b border-[#f1f3f5] last:border-0">
                      <td className="px-5 py-4"><p className="font-semibold">{book.title}</p><p className="text-xs text-[#9ba4b2]">{book.authors.join('، ')}</p></td>
                      {platforms.map(p => {
                        const entry = state[book.id]?.[p]
                        return <td key={p} className="px-3 py-4"><span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${statusStyle[entry?.status ?? 'غير متاح']}`}>{entry?.status ?? 'غير متاح'}</span></td>
                      })}
                      <td className="px-5 py-4"><button onClick={() => setEditingBook(book)} className="rounded-lg border border-[#e8ebf0] px-3 py-2 text-xs font-semibold text-[#d8573a]">تحديث الحالة</button></td>
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

      {editingBook && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#1a2540]/30 p-3 sm:p-6">
          <section className="my-3 w-full max-w-2xl rounded-2xl bg-white shadow-2xl sm:my-8">
            <div className="flex items-center justify-between border-b border-[#eef0f3] p-5">
              <div><h2 className="text-xl font-bold">{editingBook.title}</h2><p className="mt-1 text-xs text-[#9ba4b2]">تحديث الحالة على كل منصة</p></div>
              <button onClick={() => setEditingBook(null)} aria-label="إغلاق"><X /></button>
            </div>
            <div className="flex flex-col gap-4 p-5">
              {platforms.map(p => (
                <div key={p} className="rounded-xl border border-[#e8ebf0] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold">{p}</span>
                    <select value={state[editingBook.id]?.[p]?.status ?? 'غير متاح'} onChange={e => updateStatus(editingBook.id, p, e.target.value as Status)} className="rounded-lg border border-[#e8ebf0] bg-white px-3 py-1.5 text-xs">
                      <option>متاح</option><option>غير متاح</option><option>قيد المراجعة</option>
                    </select>
                  </div>
                  <input value={state[editingBook.id]?.[p]?.notes ?? ''} onChange={e => updateNotes(editingBook.id, p, e.target.value)} placeholder="ملاحظات (اختياري)" className="w-full rounded-lg border border-[#e8ebf0] px-3 py-2 text-xs outline-none focus:border-[#d8573a]" />
                </div>
              ))}
              <div className="flex justify-end border-t border-[#eef0f3] pt-4">
                <button onClick={() => setEditingBook(null)} className="rounded-xl bg-[#d8573a] px-5 py-3 text-sm font-semibold text-white">حفظ</button>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
