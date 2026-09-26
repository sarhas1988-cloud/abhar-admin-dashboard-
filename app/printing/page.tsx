'use client'

import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Filter, MapPin, Plus, Search, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/Toast'
import { TableSkeleton, Spinner } from '@/components/Skeleton'
import { useStaffAccess } from '@/lib/useStaffAccess'
import { SharedLayout } from '@/components/SharedLayout'
import { fetchAll } from '@/lib/fetchAll'
import { ShowMoreButton, useVisibleRows } from '@/components/ShowMore'

type Book = { id: string; title: string; printed_copies: number; book_authors: { authors: { name: string } }[] }
type Job = { id: string; book_id: string; copies: number; printer_price: number; printer_name: string | null; printing_location: string | null; entered_at: string; shipped_at: string | null; received_at: string; delivered_to_author: boolean; books: Book }

const emptyForm = { bookId: '', copies: '', printerPrice: '', printerName: '', printingLocation: '', enteredAt: '', shippedAt: '', receivedAt: '', delivered: false }

export default function PrintingPage() {
  const { toast } = useToast()
  const { loading: accessLoading, canView, canEdit } = useStaffAccess()

  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [books, setBooks] = useState<Book[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<Job | null>(null)
  const [printerFilter, setPrinterFilter] = useState('all')
  const [form, setForm] = useState(emptyForm)
  const supabase = createClient()

  const load = async () => {
    setLoading(true)
    const [b, j] = await Promise.all([
      fetchAll((from, to) => supabase.from('books').select('id, title, printed_copies, book_authors(authors(name))').is('deleted_at', null).order('title').order('id').range(from, to)),
      fetchAll((from, to) => supabase.from('printing_jobs').select('*, books(id, title, printed_copies, book_authors(authors(name)))').order('created_at', { ascending: false }).order('id').range(from, to)),
    ])
    if (b.error || j.error) toast('حصل خطأ في تحميل البيانات: ' + (b.error ?? j.error)!.message, 'error')
    setBooks(b.data)
    setJobs(j.data)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  // distinct printer names / locations already used — offered as suggestions in the form
  const printerNames = useMemo(() => Array.from(new Set(jobs.map(j => j.printer_name?.trim()).filter(Boolean) as string[])).sort(), [jobs])
  const printingLocations = useMemo(() => Array.from(new Set(jobs.map(j => j.printing_location?.trim()).filter(Boolean) as string[])).sort(), [jobs])

  const filtered = useMemo(() => {
    const q = query.trim()
    return jobs.filter(job => {
      const matchesQuery = !q || (job.books?.title ?? '').includes(q) || (job.printer_name ?? '').includes(q) || (job.printing_location ?? '').includes(q)
      const matchesStatus = status === 'all' || (status === 'delivered' ? job.delivered_to_author : !job.delivered_to_author)
      const matchesPrinter = printerFilter === 'all' || job.printer_name?.trim() === printerFilter
      return matchesQuery && matchesStatus && matchesPrinter
    })
  }, [jobs, query, status, printerFilter])
  const { visible, remaining, showMore } = useVisibleRows(filtered, 50, `${query}|${status}|${printerFilter}`)
  const selectedBook = books.find(b => b.id === form.bookId)
  const update = (key: string, value: string | boolean) => setForm(f => ({ ...f, [key]: value }))
  const selectBook = (bookId: string) => {
    const book = books.find(b => b.id === bookId)
    setForm(f => ({ ...f, bookId, copies: f.copies || (book?.printed_copies ? String(book.printed_copies) : '') }))
  }
  const openCreate = () => { setEditing(null); setForm(emptyForm); setFormOpen(true) }
  const openEdit = (job: Job) => {
    setEditing(job)
    setForm({
      bookId: job.book_id, copies: String(job.copies ?? ''), printerPrice: String(job.printer_price ?? ''),
      printerName: job.printer_name ?? '', printingLocation: job.printing_location ?? '',
      enteredAt: job.entered_at ?? '', shippedAt: job.shipped_at ?? '', receivedAt: job.received_at ?? '', delivered: job.delivered_to_author,
    })
    setFormOpen(true)
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.bookId || !form.enteredAt || !form.printerName.trim()) return
    if (form.shippedAt && form.shippedAt < form.enteredAt) { toast('تاريخ الشحن لازم يكون بعد تاريخ دخول المطبعة', 'error'); return }
    setSaving(true)
    const payload = {
      book_id: form.bookId,
      copies: Number(form.copies) || selectedBook?.printed_copies || 0,
      printer_price: Number(form.printerPrice) || 0,
      printer_name: form.printerName.trim(),
      printing_location: form.printingLocation.trim() || null,
      entered_at: form.enteredAt,
      shipped_at: form.shippedAt || null,
      received_at: form.receivedAt || null,
      delivered_to_author: form.delivered,
    }
    const { error } = editing
      ? await supabase.from('printing_jobs').update(payload).eq('id', editing.id)
      : await supabase.from('printing_jobs').insert(payload)
    setSaving(false)
    if (error) { toast('حصل خطأ في الحفظ: ' + error.message, 'error'); return }
    toast(editing ? 'تم تعديل بيانات الطباعة' : 'تمت الإضافة إلى المطبعة')
    setFormOpen(false)
    load()
  }

  return (
    <SharedLayout title="المطبعة" subtitle="إدارة عمليات الطباعة">
      <div className="mx-auto max-w-[1400px]">
          {!accessLoading && !canView('printing') ? <p className="rounded-xl border border-[#e8dfd3] bg-white p-6 text-center text-sm text-[#a3907e]">مفيش صلاحية وصول لهذا القسم.</p> : (
            <>
              <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="mb-2 flex items-center gap-2 text-xs font-medium text-[#d8573a]"><span className="size-2 rounded-full bg-[#d8573a]" />متابعة الكتب المسجلة</div><h2 className="font-serif text-3xl font-semibold sm:text-4xl">كتب قيد الطباعة</h2><p className="mt-2 text-sm text-[#8a7969]">تابع دخول واستلام الكتب من المطبعة وتسليم النسخ للكاتب.</p></div>{canEdit('printing') && <button onClick={openCreate} className="flex w-fit items-center gap-2 rounded-xl bg-[#d8573a] px-4 py-3 text-sm font-semibold text-white"><Plus size={18} />إضافة إلى المطبعة</button>}</div>
              <section className="rounded-2xl border border-[#e8dfd3] bg-white shadow-[0_1px_3px_-1px_rgba(90,60,40,0.06)]">
                <div className="flex flex-col gap-3 border-b border-[#ede4d7] p-4 sm:flex-row sm:items-center"><label className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-[#e8dfd3] px-3 py-2 text-xs text-[#a3907e]"><Search size={15} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="ابحث باسم الكتاب أو المطبعة" className="w-full bg-transparent outline-none" /></label><div className="flex items-center gap-2"><Filter size={14} className="text-[#a3907e]" /><select value={status} onChange={e => setStatus(e.target.value)} className="rounded-lg border border-[#e8dfd3] bg-white px-3 py-2 text-xs"><option value="all">كل الحالات</option><option value="delivered">تم التسليم للكاتب</option><option value="not">لم يتم التسليم</option></select>{printerNames.length > 0 && <select value={printerFilter} onChange={e => setPrinterFilter(e.target.value)} className="rounded-lg border border-[#e8dfd3] bg-white px-3 py-2 text-xs"><option value="all">كل المطابع</option>{printerNames.map(name => <option key={name} value={name}>{name}</option>)}</select>}</div><span className="text-xs text-[#a3907e]">{loading ? '' : `${filtered.length} كتب`}</span></div>
                <div className="overflow-x-auto"><table className="w-full min-w-[1100px] text-right text-sm"><thead><tr className="border-b border-[#ede4d7] text-xs text-[#a3907e]"><th className="px-5 py-4">اسم الكتاب</th><th className="px-5 py-4">اسم الكاتب</th><th className="px-5 py-4">المطبعة / مكان الطباعة</th><th className="px-5 py-4">عدد النسخ</th><th className="px-5 py-4">دخول المطبعة</th><th className="px-5 py-4">تاريخ الشحن</th><th className="px-5 py-4">استلام النسخ</th><th className="px-5 py-4">تم التسليم للكاتب</th><th className="px-5 py-4">إجراء</th></tr></thead><tbody>{visible.map(job => <tr key={job.id} className="border-b border-[#f0e7db] last:border-0"><td className="px-5 py-4 font-semibold">{job.books?.title}</td><td className="px-5 py-4 text-[#6b5d53]">{job.books?.book_authors?.map(a => a.authors.name).join('، ')}</td><td className="px-5 py-4">{job.printer_name ? <><span className="block font-medium">{job.printer_name}</span>{job.printing_location && <span className="mt-0.5 flex items-center gap-1 text-[11px] text-[#a3907e]"><MapPin size={11} />{job.printing_location}</span>}</> : <span className="text-xs text-[#a3907e]">—</span>}</td><td className="px-5 py-4 text-[#6b5d53]">{job.copies?.toLocaleString('en-US')}</td><td className="px-5 py-4 text-[#6b5d53]">{job.entered_at}</td><td className="px-5 py-4 text-[#6b5d53]">{job.shipped_at || <span className="text-xs text-[#a3907e]">لم تُشحن بعد</span>}</td><td className="px-5 py-4 text-[#6b5d53]">{job.received_at || 'لم تستلم بعد'}</td><td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${job.delivered_to_author ? 'bg-[#e8f2df] text-[#4a7a2c]' : 'bg-[#fbeed6] text-[#8a5a1a]'}`}>{job.delivered_to_author ? 'نعم' : 'لا'}</span></td><td className="px-5 py-4">{canEdit('printing') && <button onClick={() => openEdit(job)} className="rounded-lg border border-[#e8dfd3] px-3 py-2 text-xs font-semibold text-[#d8573a]">تعديل</button>}</td></tr>)}</tbody></table>{!loading && filtered.length === 0 && <p className="p-8 text-center text-sm text-[#a3907e]">لا توجد كتب قيد الطباعة بعد.</p>}</div>
                <ShowMoreButton remaining={remaining} onClick={showMore} />
              </section>
            </>
          )}
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#2a211c]/30 p-3 sm:p-6">
          <section className="my-3 w-full max-w-2xl rounded-2xl bg-white shadow-2xl sm:my-8">
            <div className="flex items-center justify-between border-b border-[#ede4d7] p-5"><div><h2 className="font-serif text-xl font-semibold">{editing ? 'تعديل بيانات الطباعة' : 'إضافة إلى المطبعة'}</h2><p className="mt-1 text-xs text-[#a3907e]">يتم اختيار الكتاب من الكتب المسجلة في التعاقدات فقط</p></div><button onClick={() => setFormOpen(false)} aria-label="إغلاق"><X /></button></div>
            <form onSubmit={submit} className="grid gap-4 p-5 sm:grid-cols-2">
              <label className="sm:col-span-2"><span className="mb-2 block text-xs font-semibold text-[#6b5d53]">اسم الكتاب</span><select required disabled={Boolean(editing)} value={form.bookId} onChange={e => selectBook(e.target.value)} className="w-full rounded-xl border border-[#e8dfd3] bg-white px-3 py-3 text-sm"><option value="">ابحث واختر كتاباً من التعاقدات</option>{books.map(book => <option key={book.id} value={book.id}>{book.title} — {book.book_authors?.map(a => a.authors.name).join('، ')}</option>)}</select></label>
              {selectedBook && <div className="sm:col-span-2 rounded-xl bg-[#fdf6ef] p-3 text-xs text-[#6b5d53]">عدد النسخ في سجل الكتاب: <strong className="text-[#2a211c]">{selectedBook.printed_copies?.toLocaleString('en-US')}</strong> نسخة</div>}
              <label><span className="mb-2 block text-xs font-semibold text-[#6b5d53]">عدد النسخ</span><input required type="number" min="1" value={form.copies} onChange={e => update('copies', e.target.value)} className="w-full rounded-xl border border-[#e8dfd3] px-3 py-3 text-sm outline-none focus:border-[#d8573a]" /></label>
              <label><span className="mb-2 block text-xs font-semibold text-[#6b5d53]">سعر النسخة من المطبعة</span><input required type="number" min="0" step="0.01" value={form.printerPrice} onChange={e => update('printerPrice', e.target.value)} className="w-full rounded-xl border border-[#e8dfd3] px-3 py-3 text-sm outline-none focus:border-[#d8573a]" /></label>
              <label><span className="mb-2 block text-xs font-semibold text-[#6b5d53]">اسم المطبعة</span><input required list="printer-names" value={form.printerName} onChange={e => update('printerName', e.target.value)} placeholder="مثال: مطبعة الأهرام" className="w-full rounded-xl border border-[#e8dfd3] px-3 py-3 text-sm outline-none focus:border-[#d8573a]" /><datalist id="printer-names">{printerNames.map(name => <option key={name} value={name} />)}</datalist></label>
              <label><span className="mb-2 block text-xs font-semibold text-[#6b5d53]">مكان الطباعة <em className="font-normal text-[#a3907e]">(اختياري)</em></span><input list="printing-locations" value={form.printingLocation} onChange={e => update('printingLocation', e.target.value)} placeholder="مثال: القاهرة - العباسية" className="w-full rounded-xl border border-[#e8dfd3] px-3 py-3 text-sm outline-none focus:border-[#d8573a]" /><datalist id="printing-locations">{printingLocations.map(loc => <option key={loc} value={loc} />)}</datalist></label>
              <label><span className="mb-2 block text-xs font-semibold text-[#6b5d53]">تاريخ دخول المطبعة</span><span className="relative block"><CalendarDays className="pointer-events-none absolute left-3 top-3 text-[#a3907e]" size={17} /><input required type="date" value={form.enteredAt} onChange={e => update('enteredAt', e.target.value)} className="w-full rounded-xl border border-[#e8dfd3] px-3 py-3 text-sm" /></span></label>
              <label><span className="mb-2 block text-xs font-semibold text-[#6b5d53]">تاريخ الشحن <em className="font-normal text-[#a3907e]">(اختياري)</em></span><input type="date" min={form.enteredAt || undefined} value={form.shippedAt} onChange={e => update('shippedAt', e.target.value)} className="w-full rounded-xl border border-[#e8dfd3] px-3 py-3 text-sm" /></label>
              <label><span className="mb-2 block text-xs font-semibold text-[#6b5d53]">تاريخ استلام النسخ <em className="font-normal text-[#a3907e]">(اختياري)</em></span><input type="date" value={form.receivedAt} onChange={e => update('receivedAt', e.target.value)} className="w-full rounded-xl border border-[#e8dfd3] px-3 py-3 text-sm" /></label>
              <label className="flex items-center justify-between rounded-xl border border-[#e8dfd3] p-4 sm:col-span-2"><span><span className="block text-sm font-semibold">تم تسليم الكاتب او لا</span></span><input type="checkbox" checked={form.delivered} onChange={e => update('delivered', e.target.checked)} className="size-5 accent-[#d8573a]" /></label>
              <div className="flex justify-end gap-3 border-t border-[#ede4d7] pt-4 sm:col-span-2"><button type="button" onClick={() => setFormOpen(false)} className="rounded-xl border border-[#e8dfd3] px-5 py-3 text-sm font-semibold">إلغاء</button><button disabled={saving} type="submit" className="rounded-xl bg-[#d8573a] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{saving ? <><Spinner size={14} className="text-white" />جارٍ الحفظ...</> : editing ? 'حفظ التعديل' : 'إضافة إلى المطبعة'}</button></div>
            </form>
          </section>
        </div>
      )}
    </SharedLayout>
  )
}
