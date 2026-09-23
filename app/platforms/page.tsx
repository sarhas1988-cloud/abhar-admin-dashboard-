'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, ClipboardList, Factory, Grid2X2, LayoutDashboard, LogOut, Menu, Plus, Search, ShieldCheck, ShoppingCart, Warehouse, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useStaffAccess } from '@/lib/useStaffAccess'
import { SharedLayout } from '@/components/SharedLayout'

type Book = { id: string; title: string; book_authors: { authors: { name: string } }[] }
type Platform = { id: string; name: string }
type Status = 'متاح' | 'غير متاح' | 'قيد المراجعة'
type Link_ = { book_id: string; platform_id: string; status: Status; notes: string }

const statusStyle: Record<Status, string> = { 'متاح': 'bg-[#e8f2df] text-[#4a7a2c]', 'غير متاح': 'bg-[#f7dbd3] text-[#c04a2f]', 'قيد المراجعة': 'bg-[#fbeed6] text-[#8a5a1a]' }

export default function PlatformsPage() {
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
  const [books, setBooks] = useState<Book[]>([])
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [links, setLinks] = useState<Link_[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [newPlatform, setNewPlatform] = useState('')
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const supabase = createClient()

  const load = async () => {
    setLoading(true)
    const [{ data: b }, { data: p }, { data: l }] = await Promise.all([
      supabase.from('books').select('id, title, book_authors(authors(name))').order('title'),
      supabase.from('platforms').select('*').order('name'),
      supabase.from('book_platforms').select('*'),
    ])
    setBooks((b as any) ?? [])
    setPlatforms(p ?? [])
    setLinks((l as any) ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const filteredBooks = useMemo(() => books.filter(b => b.title.includes(query)), [books, query])
  const statusFor = (bookId: string, platformId: string) => links.find(l => l.book_id === bookId && l.platform_id === platformId)

  const addPlatform = async () => {
    if (!newPlatform.trim()) return
    await supabase.from('platforms').insert({ name: newPlatform.trim() })
    setNewPlatform('')
    load()
  }

  const updateStatus = async (bookId: string, platformId: string, status: Status, notes: string) => {
    await supabase.from('book_platforms').upsert({ book_id: bookId, platform_id: platformId, status, notes }, { onConflict: 'book_id,platform_id' })
    setLinks(current => {
      const exists = current.some(l => l.book_id === bookId && l.platform_id === platformId)
      return exists ? current.map(l => l.book_id === bookId && l.platform_id === platformId ? { ...l, status, notes } : l) : [...current, { book_id: bookId, platform_id: platformId, status, notes }]
    })
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#faf6f0] text-[#2a211c]">
      <aside className={`fixed inset-y-0 right-0 z-40 flex w-[252px] flex-col border-l border-[#e8dfd3] bg-white px-5 py-6 transition-transform lg:translate-x-0 ${menuOpen ? 'translate-x-0' : 'translate-x-[110%]'}`}>
        <div className="flex items-center justify-between pb-8"><div className="flex items-center gap-2.5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#faf1eb] p-1.5"><img src="/abhar-logo.svg" alt="إبهار" className="h-full w-full object-contain" /></div>
          <div className="min-w-0"><p className="font-serif text-base font-semibold leading-tight text-[#2a211c]">إبهار</p><p className="text-[10px] leading-tight text-[#a3907e]">للنشر والتوزيع</p></div>
        </div><button onClick={() => setMenuOpen(false)} className="lg:hidden" aria-label="إغلاق القائمة"><X /></button></div>
        <p className="mb-3 px-3 text-[11px] font-semibold tracking-[0.16em] text-[#a3907e]">القائمة الرئيسية</p>
        <nav className="flex flex-col gap-1.5">{navItems.map(({ label, href, icon: Icon }) => <Link key={href} href={href} onClick={() => setMenuOpen(false)} className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium ${pathname === href ? 'bg-[#faf1eb] text-[#d8573a]' : 'text-[#6b5d53] hover:bg-[#faf6f0]'}`}><Icon size={19} /><span>{label}</span></Link>)}</nav>
        <div className="mt-auto border-t border-[#ede4d7] pt-4"><button onClick={signOut} className="flex items-center gap-3 px-3.5 py-3 text-sm text-[#6b5d53] hover:text-[#c04a2f]"><LogOut size={19} />تسجيل الخروج</button></div>
      </aside>
      {menuOpen && <button className="fixed inset-0 z-30 bg-[#2a211c]/20 lg:hidden" onClick={() => setMenuOpen(false)} aria-label="إغلاق القائمة" />}

      <section className="lg:mr-[252px]">
        <header className="flex h-[84px] items-center justify-between border-b border-[#e8dfd3] bg-white px-5 sm:px-8"><div className="flex items-center gap-3"><button onClick={() => setMenuOpen(true)} className="lg:hidden" aria-label="فتح القائمة"><Menu /></button><div><p className="text-xs text-[#8a7969]">متابعة الكتب على منصات البيع</p><h1 className="font-serif mt-1 text-xl font-semibold sm:text-2xl">المنصات</h1></div></div><Bell size={19} className="text-[#6b5d53]" /></header>
        <div className="mx-auto max-w-[1400px] p-5 pb-24 sm:p-8 lg:pb-8">
          {!accessLoading && !canView('platforms') ? <p className="rounded-xl border border-[#e8dfd3] bg-white p-6 text-center text-sm text-[#a3907e]">مفيش صلاحية وصول لهذا القسم.</p> : (
            <>
              <div className="mb-6 flex items-center gap-2 text-xs font-medium text-[#d8573a]"><span className="size-2 rounded-full bg-[#d8573a]" />متابعة يدوية — لا يوجد ربط تلقائي بالمنصات</div>
              {canEdit('platforms') && (
                <section className="mb-6 rounded-2xl border border-[#e8dfd3] bg-white p-6 sm:p-8">
                  <h3 className="mb-4 font-bold">قائمة المنصات</h3>
                  <div className="flex flex-wrap gap-2">{platforms.map(p => <span key={p.id} className="rounded-full bg-[#faf6f0] px-3 py-1.5 text-xs font-medium text-[#6b5d53]">{p.name}</span>)}</div>
                  <div className="mt-4 flex gap-2"><input value={newPlatform} onChange={e => setNewPlatform(e.target.value)} placeholder="اسم منصة جديدة" className="min-w-0 flex-1 rounded-lg border border-[#e8dfd3] px-3 py-2 text-sm outline-none focus:border-[#d8573a] sm:max-w-xs" /><button onClick={addPlatform} className="flex items-center gap-1.5 rounded-lg bg-[#faf1eb] px-3 py-2 text-xs font-semibold text-[#d8573a]"><Plus size={15} />إضافة منصة</button></div>
                </section>
              )}
              <section className="rounded-2xl border border-[#e8dfd3] bg-white shadow-[0_1px_3px_-1px_rgba(90,60,40,0.06)]">
                <div className="flex flex-col gap-3 border-b border-[#ede4d7] p-4 sm:flex-row sm:items-center"><label className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-[#e8dfd3] px-3 py-2 text-xs text-[#a3907e]"><Search size={15} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="ابحث باسم الكتاب" className="w-full bg-transparent outline-none" /></label><span className="text-xs text-[#a3907e]">{loading ? 'جارٍ التحميل...' : `${filteredBooks.length} كتب`}</span></div>
                <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-right text-sm"><thead><tr className="border-b border-[#ede4d7] text-xs text-[#a3907e]"><th className="px-5 py-4">اسم الكتاب</th>{platforms.map(p => <th key={p.id} className="px-3 py-4">{p.name}</th>)}<th className="px-5 py-4">إجراء</th></tr></thead><tbody>{filteredBooks.map(book => <tr key={book.id} className="border-b border-[#f0e7db] last:border-0"><td className="px-5 py-4"><p className="font-semibold">{book.title}</p><p className="text-xs text-[#a3907e]">{book.book_authors?.map(a => a.authors.name).join('، ')}</p></td>{platforms.map(p => { const s = statusFor(book.id, p.id)?.status ?? 'غير متاح'; return <td key={p.id} className="px-3 py-4"><span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${statusStyle[s]}`}>{s}</span></td> })}<td className="px-5 py-4">{canEdit('platforms') && <button onClick={() => setEditingBook(book)} className="rounded-lg border border-[#e8dfd3] px-3 py-2 text-xs font-semibold text-[#d8573a]">تحديث الحالة</button>}</td></tr>)}</tbody></table>{!loading && filteredBooks.length === 0 && <p className="p-8 text-center text-sm text-[#a3907e]">لا توجد كتب مسجلة بعد.</p>}</div>
              </section>
            </>
          )}
        </div>
      </section>
      <nav className="fixed inset-x-0 bottom-0 z-20 flex gap-1 overflow-x-auto border-t border-[#e8dfd3] bg-white px-2 py-2 lg:hidden">{navItems.map(({ label, href, icon: Icon }) => <Link key={href} href={href} className={`flex min-w-[72px] flex-1 flex-col items-center gap-1 rounded-lg px-1 py-1 text-[10px] ${pathname === href ? 'text-[#d8573a]' : 'text-[#8a7969]'}`}><Icon size={18} /><span className="truncate">{label}</span></Link>)}</nav>

      {editingBook && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#2a211c]/30 p-3 sm:p-6">
          <section className="my-3 w-full max-w-2xl rounded-2xl bg-white shadow-2xl sm:my-8">
            <div className="flex items-center justify-between border-b border-[#ede4d7] p-5"><div><h2 className="font-serif text-xl font-semibold">{editingBook.title}</h2><p className="mt-1 text-xs text-[#a3907e]">تحديث الحالة على كل منصة</p></div><button onClick={() => setEditingBook(null)} aria-label="إغلاق"><X /></button></div>
            <div className="flex flex-col gap-4 p-5">
              {platforms.map(p => {
                const current = statusFor(editingBook.id, p.id)
                return (
                  <div key={p.id} className="rounded-xl border border-[#e8dfd3] p-4">
                    <div className="mb-3 flex items-center justify-between"><span className="text-sm font-semibold">{p.name}</span>
                      <select defaultValue={current?.status ?? 'غير متاح'} onChange={e => updateStatus(editingBook.id, p.id, e.target.value as Status, current?.notes ?? '')} className="rounded-lg border border-[#e8dfd3] bg-white px-3 py-1.5 text-xs"><option>متاح</option><option>غير متاح</option><option>قيد المراجعة</option></select>
                    </div>
                    <input defaultValue={current?.notes ?? ''} onBlur={e => updateStatus(editingBook.id, p.id, current?.status ?? 'غير متاح', e.target.value)} placeholder="ملاحظات (اختياري)" className="w-full rounded-lg border border-[#e8dfd3] px-3 py-2 text-xs outline-none focus:border-[#d8573a]" />
                  </div>
                )
              })}
              <div className="flex justify-end border-t border-[#ede4d7] pt-4"><button onClick={() => { setEditingBook(null); load() }} className="rounded-xl bg-[#d8573a] px-5 py-3 text-sm font-semibold text-white">تم</button></div>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
