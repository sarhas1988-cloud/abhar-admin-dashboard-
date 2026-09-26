'use client'

import { useEffect, useMemo, useState } from 'react'
import { Bell, ClipboardList, Factory, Grid2X2, LayoutDashboard, LogOut, Menu, Plus, Search, ShieldCheck, ShoppingCart, Warehouse, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/Toast'
import { TableSkeleton, Spinner } from '@/components/Skeleton'
import { useStaffAccess } from '@/lib/useStaffAccess'
import { SharedLayout } from '@/components/SharedLayout'

type Book = { id: string; title: string; book_authors: { authors: { name: string } }[] }
type Platform = { id: string; name: string }
type Status = 'متاح' | 'غير متاح' | 'قيد المراجعة'
type Link_ = { book_id: string; platform_id: string; status: Status; notes: string }

const statusStyle: Record<Status, string> = { 'متاح': 'bg-[#e8f2df] text-[#4a7a2c]', 'غير متاح': 'bg-[#f7dbd3] text-[#c04a2f]', 'قيد المراجعة': 'bg-[#fbeed6] text-[#8a5a1a]' }

export default function PlatformsPage() {
  const { toast } = useToast()
  const { loading: accessLoading, canView, canEdit } = useStaffAccess()

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
      supabase.from('books').select('id, title, book_authors(authors(name))').is('deleted_at', null).order('title'),
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
    load(); toast('تمت إضافة المنصة')
  }

  const updateStatus = async (bookId: string, platformId: string, status: Status, notes: string) => {
    await supabase.from('book_platforms').upsert({ book_id: bookId, platform_id: platformId, status, notes }, { onConflict: 'book_id,platform_id' })
    setLinks(current => {
      const exists = current.some(l => l.book_id === bookId && l.platform_id === platformId)
      return exists ? current.map(l => l.book_id === bookId && l.platform_id === platformId ? { ...l, status, notes } : l) : [...current, { book_id: bookId, platform_id: platformId, status, notes }]
    })
  }

  return (
    <SharedLayout title="المنصات" subtitle="متابعة الكتب على منصات البيع">
      <div className="mx-auto max-w-[1400px]">
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
    </SharedLayout>
  )
}
