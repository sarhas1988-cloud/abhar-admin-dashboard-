'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowDownUp, Bell, ChevronDown, ClipboardList, ExternalLink, Factory, Filter, Grid2X2, LayoutDashboard, LogOut, Menu, Plus, Search, Settings, ShieldCheck, ShoppingCart, Upload, Warehouse, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useStaffAccess } from '@/lib/useStaffAccess'

const categories = ['رواية', 'شعر', 'تطوير ذات', 'أدب', 'أطفال', 'ديني', 'أخرى']
const emptyForm = { permit: '', isbn: '', title: '', authors: [] as string[], category: '', copies: '', freeCopies: '', size: '', paper: '', ink: '', summary: '', profit: '', phone: '', egp: '', aed: '', sar: '', date: '', parentBookId: '' }

type Book = {
  id: string; title: string; category: string; printed_copies: number; free_copies: number
  size: string; paper_type: string; print_color: string; brief: string; profit_percent: number
  author_phone: string; price_egp: number; price_aed: number; price_sar: number; contract_date: string
  contract_pdf_url: string | null; cover_image_url: string | null; parent_book_id: string | null; permit: string; isbn: string
  book_authors: { authors: { id: string; name: string } }[]
}

export default function ContractsPage() {
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
  ].filter(item => item.show), [isAdmin, accessLoading])

  const [menuOpen, setMenuOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('الكل')
  const [sortAsc, setSortAsc] = useState(true)
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [detail, setDetail] = useState<Book | null>(null)
  const [newEdition, setNewEdition] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [contractFile, setContractFile] = useState<File | null>(null)

  const supabase = createClient()

  const loadBooks = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('books')
      .select('*, book_authors(authors(id, name))')
      .order('created_at', { ascending: false })
    setBooks((data as any) ?? [])
    setLoading(false)
  }

  useEffect(() => { loadBooks() }, [])

  const filteredBooks = useMemo(() => books.filter(book => {
    const authorNames = book.book_authors?.map(a => a.authors.name).join(' ') ?? ''
    return `${book.title} ${authorNames}`.includes(query) && (category === 'الكل' || book.category === category)
  }).sort((a, b) => sortAsc ? a.title.localeCompare(b.title, 'ar') : b.title.localeCompare(a.title, 'ar')), [books, query, category, sortAsc])

  const setField = (key: string, value: string) => setForm(current => ({ ...current, [key]: value }))

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.title || Number(form.freeCopies) > Number(form.copies)) return
    setSaving(true)

    let coverUrl: string | null = null
    let contractUrl: string | null = null
    if (coverFile) {
      const path = `${Date.now()}-${coverFile.name}`
      const { data } = await supabase.storage.from('book-covers').upload(path, coverFile)
      if (data) coverUrl = supabase.storage.from('book-covers').getPublicUrl(data.path).data.publicUrl
    }
    if (contractFile) {
      const path = `${Date.now()}-${contractFile.name}`
      const { data } = await supabase.storage.from('contract-pdfs').upload(path, contractFile)
      if (data) contractUrl = supabase.storage.from('contract-pdfs').getPublicUrl(data.path).data.publicUrl
    }

    const { data: bookRow, error: bookError } = await supabase.from('books').insert({
      permit: form.permit, isbn: form.isbn, title: form.title, category: form.category,
      printed_copies: Number(form.copies) || 0, free_copies: Number(form.freeCopies) || 0,
      size: form.size, paper_type: form.paper, print_color: form.ink, brief: form.summary,
      profit_percent: Number(form.profit) || 0, author_phone: form.phone,
      price_egp: Number(form.egp) || 0, price_aed: Number(form.aed) || 0, price_sar: Number(form.sar) || 0,
      contract_date: form.date || null, contract_pdf_url: contractUrl, cover_image_url: coverUrl,
      parent_book_id: newEdition && form.parentBookId ? form.parentBookId : null,
    }).select().single()

    if (bookError || !bookRow) { setSaving(false); return }

    for (const authorName of form.authors) {
      const { data: existing } = await supabase.from('authors').select('id').eq('name', authorName).maybeSingle()
      let authorId = existing?.id
      if (!authorId) {
        const { data: created } = await supabase.from('authors').insert({ name: authorName, phone: form.phone }).select().single()
        authorId = created?.id
      }
      if (authorId) await supabase.from('book_authors').insert({ book_id: bookRow.id, author_id: authorId })
    }

    setSaving(false)
    setForm(emptyForm)
    setCoverFile(null)
    setContractFile(null)
    setNewEdition(false)
    setFormOpen(false)
    loadBooks()
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#faf6f0] text-[#2a211c]">
      <aside className={`fixed inset-y-0 right-0 z-40 flex w-[252px] flex-col border-l border-[#e8dfd3] bg-white px-5 py-6 transition-transform lg:translate-x-0 ${menuOpen ? 'translate-x-0' : 'translate-x-[110%]'}`}>
        <div className="flex items-center justify-between pb-8">
          <div className="flex items-center gap-2.5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#faf1eb] p-1.5"><img src="/abhar-logo.svg" alt="إبهار" className="h-full w-full object-contain" /></div>
          <div className="min-w-0"><p className="font-serif text-base font-semibold leading-tight text-[#2a211c]">إبهار</p><p className="text-[10px] leading-tight text-[#a3907e]">للنشر والتوزيع</p></div>
        </div>
          <button onClick={() => setMenuOpen(false)} className="lg:hidden" aria-label="إغلاق القائمة"><X /></button>
        </div>
        <p className="mb-3 px-3 text-[11px] font-semibold tracking-[0.16em] text-[#a3907e]">القائمة الرئيسية</p>
        <nav className="flex flex-col gap-1.5">
          {navItems.map(({ label, href, icon: Icon }) => (
            <Link key={href} href={href} onClick={() => setMenuOpen(false)} className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium ${pathname === href ? 'bg-[#faf1eb] text-[#d8573a]' : 'text-[#6b5d53] hover:bg-[#faf6f0]'}`}>
              <Icon size={19} /><span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t border-[#ede4d7] pt-4">
          <button onClick={signOut} className="flex items-center gap-3 px-3.5 py-3 text-sm text-[#6b5d53] hover:text-[#c04a2f]"><LogOut size={19} />تسجيل الخروج</button>
        </div>
      </aside>
      {menuOpen && <button className="fixed inset-0 z-30 bg-[#2a211c]/20 lg:hidden" onClick={() => setMenuOpen(false)} aria-label="إغلاق القائمة" />}

      <section className="lg:mr-[252px]">
        <header className="flex h-[84px] items-center justify-between border-b border-[#e8dfd3] bg-white px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setMenuOpen(true)} className="lg:hidden" aria-label="فتح القائمة"><Menu /></button>
            <div><p className="text-xs text-[#8a7969]">القسم الفني والتعاقدات</p><h1 className="font-serif mt-1 text-xl font-semibold sm:text-2xl">التعاقدات والقسم الفني</h1></div>
          </div>
          <Bell size={19} className="text-[#6b5d53]" />
        </header>

        <div className="mx-auto max-w-[1400px] p-5 pb-24 sm:p-8 lg:pb-8">
          {!accessLoading && !canView('contracts') ? (
            <p className="rounded-xl border border-[#e8dfd3] bg-white p-6 text-center text-sm text-[#a3907e]">مفيش صلاحية وصول لهذا القسم.</p>
          ) : (
            <>
              <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-xs font-medium text-[#d8573a]"><span className="size-2 rounded-full bg-[#d8573a]" />إدارة الكتب والعقود</div>
                  <h2 className="font-serif text-3xl font-semibold sm:text-4xl">كل الكتب</h2>
                  <p className="mt-2 text-sm text-[#8a7969]">سجل الكتب المتعاقد عليها وتفاصيل القسم الفني.</p>
                </div>
                {canEdit('contracts') && <button onClick={() => setFormOpen(true)} className="flex w-fit items-center gap-2 rounded-xl bg-[#d8573a] px-4 py-3 text-sm font-semibold text-white"><Plus size={18} />إضافة كتاب جديد</button>}
              </div>

              <section className="rounded-2xl border border-[#e8dfd3] bg-white shadow-[0_1px_3px_-1px_rgba(90,60,40,0.06)]">
                <div className="flex flex-col gap-3 border-b border-[#ede4d7] p-4 sm:flex-row sm:items-center">
                  <label className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-[#e8dfd3] px-3 py-2 text-xs text-[#a3907e]">
                    <Search size={15} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="ابحث باسم الكتاب أو الكاتب" className="w-full bg-transparent outline-none" />
                  </label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="rounded-lg border border-[#e8dfd3] bg-white px-3 py-2 text-xs"><option>الكل</option>{categories.map(item => <option key={item}>{item}</option>)}</select>
                  <span className="text-xs text-[#a3907e]">{loading ? 'جارٍ التحميل...' : `${filteredBooks.length} كتب`}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[850px] text-right text-sm">
                    <thead><tr className="border-b border-[#ede4d7] text-xs text-[#a3907e]"><th className="px-5 py-4">اسم الكتاب</th><th className="px-5 py-4">اسم الكاتب</th><th className="px-5 py-4">تصنيف العمل</th><th className="px-5 py-4">عدد النسخ المطبوعة</th><th className="px-5 py-4">السعر بالجنية</th><th className="px-5 py-4">تاريخ التعاقد</th><th className="px-5 py-4"><button onClick={() => setSortAsc(v => !v)} className="flex items-center gap-1">ترتيب <ArrowDownUp size={14} /></button></th></tr></thead>
                    <tbody>{filteredBooks.map(book => (
                      <tr key={book.id} onClick={() => setDetail(book)} className="cursor-pointer border-b border-[#f0e7db] last:border-0 hover:bg-[#fcf9f4]">
                        <td className="px-5 py-4 font-semibold">{book.title}</td>
                        <td className="px-5 py-4 text-[#6b5d53]">{book.book_authors?.map(a => a.authors.name).join('، ')}</td>
                        <td className="px-5 py-4 text-[#6b5d53]">{book.category}</td>
                        <td className="px-5 py-4 text-[#6b5d53]">{book.printed_copies?.toLocaleString('ar-EG')}</td>
                        <td className="px-5 py-4 text-[#6b5d53]">{book.price_egp?.toLocaleString('ar-EG')} ج.م</td>
                        <td className="px-5 py-4 text-xs text-[#6b5d53]">{book.contract_date}</td>
                        <td className="px-5 py-4"><button className="rounded-lg bg-[#faf1eb] px-3 py-1.5 text-xs font-semibold text-[#d8573a]">عرض</button></td>
                      </tr>
                    ))}</tbody>
                  </table>
                  {!loading && filteredBooks.length === 0 && <p className="p-8 text-center text-sm text-[#a3907e]">لا توجد كتب مسجلة بعد.</p>}
                </div>
              </section>
            </>
          )}
        </div>
      </section>

      <nav className="fixed inset-x-0 bottom-0 z-20 flex gap-1 overflow-x-auto border-t border-[#e8dfd3] bg-white px-2 py-2 lg:hidden">
        {navItems.map(({ label, href, icon: Icon }) => (
          <Link key={href} href={href} className={`flex min-w-[72px] flex-1 flex-col items-center gap-1 rounded-lg px-1 py-1 text-[10px] ${pathname === href ? 'text-[#d8573a]' : 'text-[#8a7969]'}`}><Icon size={18} /><span className="truncate">{label}</span></Link>
        ))}
      </nav>

      {formOpen && (
        <BookForm form={form} setField={setField} newEdition={newEdition} setNewEdition={setNewEdition}
          onCoverChange={setCoverFile} onContractChange={setContractFile} coverFile={coverFile}
          onClose={() => setFormOpen(false)} onSubmit={submit} books={books} saving={saving} />
      )}
      {detail && <BookDetail book={detail} onClose={() => setDetail(null)} />}
    </main>
  )
}

function BookForm({ form, setField, newEdition, setNewEdition, onCoverChange, onContractChange, coverFile, onClose, onSubmit, books, saving }: any) {
  const [authorInput, setAuthorInput] = useState('')
  const addAuthor = () => { if (authorInput && !form.authors.includes(authorInput)) { setField('authors', [...form.authors, authorInput]); setAuthorInput('') } }
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#2a211c]/30 p-3 sm:p-6">
      <section className="my-3 w-full max-w-5xl rounded-2xl bg-white shadow-2xl sm:my-8">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#ede4d7] bg-white p-5">
          <div><h2 className="font-serif text-xl font-semibold">إضافة كتاب جديد</h2><p className="mt-1 text-xs text-[#a3907e]">بيانات التعاقد والقسم الفني</p></div>
          <button onClick={onClose} aria-label="إغلاق"><X /></button>
        </div>
        <form onSubmit={onSubmit} className="grid gap-4 p-5 sm:grid-cols-2">
          {[['permit', 'اذن طباعة', 'text'], ['isbn', 'ترقيم دولي / ISBN', 'text'], ['title', 'اسم الكتاب', 'text'], ['copies', 'عدد النسخ المطبوعة', 'number'], ['freeCopies', 'عدد النسخ المجانية', 'number'], ['size', 'مقاس الكتاب', 'text'], ['profit', 'نسبة الارباح %', 'number'], ['phone', 'تليفون الكاتب', 'tel'], ['egp', 'السعر بالجنية', 'number'], ['aed', 'السعر بالدرهم', 'number'], ['sar', 'السعر بالريال', 'number'], ['date', 'تاريخ التعاقد او المعرض', 'date']].map(([id, label, type]) => (
            <label key={id}><span className="mb-2 block text-xs font-semibold text-[#6b5d53]">{label}</span><input required={id === 'title'} value={form[id]} onChange={e => setField(id, e.target.value)} type={type} className="w-full rounded-xl border border-[#e8dfd3] px-3 py-3 text-sm outline-none focus:border-[#d8573a]" /></label>
          ))}
          <label>
            <span className="mb-2 block text-xs font-semibold text-[#6b5d53]">اسم الكاتب — يمكن إضافة أكثر من كاتب</span>
            <div className="flex gap-2"><input value={authorInput} onChange={e => setAuthorInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addAuthor())} placeholder="اكتب اسم الكاتب" className="min-w-0 flex-1 rounded-xl border border-[#e8dfd3] px-3 py-3 text-sm" /><button type="button" onClick={addAuthor} className="rounded-xl bg-[#faf1eb] px-3 text-xs font-semibold text-[#d8573a]">إضافة</button></div>
            <div className="mt-2 flex flex-wrap gap-2">{form.authors.map((author: string) => <button type="button" key={author} onClick={() => setField('authors', form.authors.filter((item: string) => item !== author))} className="rounded-full bg-[#faf6f0] px-3 py-1 text-xs">{author} ×</button>)}</div>
          </label>
          <SelectField label="تصنيف العمل" value={form.category} onChange={(v: string) => setField('category', v)} options={categories} />
          <SelectField label="نوع الورق" value={form.paper} onChange={(v: string) => setField('paper', v)} options={['أبيض', 'كريمي', 'صقيل', 'أخرى']} />
          <SelectField label="لون الطباعة" value={form.ink} onChange={(v: string) => setField('ink', v)} options={['أبيض وأسود', 'ملون']} />
          <label className="sm:col-span-2"><span className="mb-2 block text-xs font-semibold text-[#6b5d53]">النبذة</span><textarea value={form.summary} onChange={e => setField('summary', e.target.value)} rows={4} className="w-full rounded-xl border border-[#e8dfd3] px-3 py-3 text-sm" /></label>
          <div className="sm:col-span-2 flex items-center justify-between rounded-xl bg-[#faf6f0] p-4">
            <div><p className="text-sm font-semibold">هل هذه طبعة جديدة لكتاب موجود؟</p><p className="mt-1 text-xs text-[#a3907e]">اربط السجل بكتاب سابق</p></div>
            <button type="button" onClick={() => setNewEdition(!newEdition)} className={`relative h-6 w-11 rounded-full transition ${newEdition ? 'bg-[#d8573a]' : 'bg-[#cfbfa8]'}`}><span className={`absolute top-1 size-4 rounded-full bg-white transition ${newEdition ? 'right-1' : 'right-6'}`} /></button>
          </div>
          {newEdition && <SelectField label="الكتاب الأصلي" value={form.parentBookId} onChange={(v: string) => setField('parentBookId', v)} options={books.map((b: any) => b.title)} valueMap={books.reduce((acc: any, b: any) => ({ ...acc, [b.title]: b.id }), {})} />}
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#d4c4b0] bg-[#faf6f0] p-5 text-center"><Upload size={19} className="text-[#d8573a]" /><span className="mt-2 text-xs font-semibold text-[#6b5d53]">رفع ملف PDF للعقد</span><input type="file" accept="application/pdf" onChange={e => onContractChange(e.target.files?.[0] ?? null)} className="sr-only" /></label>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#d4c4b0] bg-[#faf6f0] p-5 text-center"><Upload size={19} className="text-[#d8573a]" /><span className="mt-2 text-xs font-semibold text-[#6b5d53]">رفع صورة الغلاف</span>{coverFile && <span className="mt-2 text-[11px] text-[#4a7a2c]">{coverFile.name}</span>}<input type="file" accept="image/*" onChange={e => onCoverChange(e.target.files?.[0] ?? null)} className="sr-only" /></label>
          <div className="flex justify-end gap-3 border-t border-[#ede4d7] pt-5 sm:col-span-2">
            <button type="button" onClick={onClose} className="rounded-xl border border-[#e8dfd3] px-5 py-3 text-sm">إلغاء</button>
            <button disabled={saving} className="rounded-xl bg-[#d8573a] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'جارٍ الحفظ...' : 'حفظ الكتاب'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}

function SelectField({ label, value, onChange, options, valueMap }: any) {
  return <label><span className="mb-2 block text-xs font-semibold text-[#6b5d53]">{label}</span><select value={valueMap ? Object.keys(valueMap).find(k => valueMap[k] === value) ?? '' : value} onChange={e => onChange(valueMap ? valueMap[e.target.value] : e.target.value)} className="w-full rounded-xl border border-[#e8dfd3] bg-white px-3 py-3 text-sm"><option value="">اختر</option>{options.map((option: string) => <option key={option}>{option}</option>)}</select></label>
}

function BookDetail({ book, onClose }: { book: Book; onClose: () => void }) {
  const rows: [string, string][] = [
    ['اذن طباعة', book.permit], ['ترقيم دولي', book.isbn], ['تصنيف العمل', book.category],
    ['عدد النسخ المطبوعة', String(book.printed_copies)], ['عدد النسخ المجانية', String(book.free_copies)],
    ['مقاس الكتاب', book.size], ['نوع الورق', book.paper_type], ['لون الطباعة', book.print_color],
    ['نسبة الأرباح', `${book.profit_percent}%`], ['تليفون الكاتب', book.author_phone],
    ['السعر', `${book.price_egp} ج.م / ${book.price_aed} د.إ / ${book.price_sar} ر.س`], ['تاريخ التعاقد', book.contract_date],
    ['النبذة', book.brief],
  ]
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#2a211c]/30 p-3 sm:p-6">
      <section className="my-3 w-full max-w-4xl rounded-2xl bg-white shadow-2xl sm:my-8">
        <div className="flex items-center justify-between border-b border-[#ede4d7] p-5">
          <div><p className="text-xs text-[#d8573a]">{book.book_authors?.map(a => a.authors.name).join('، ')}</p><h2 className="mt-1 text-xl font-bold">{book.title}</h2></div>
          <div className="flex items-center gap-3">
            <a href={`/books/${book.id}`} className="flex items-center gap-1.5 rounded-lg bg-[#faf1eb] px-3 py-2 text-xs font-semibold text-[#d8573a]"><ExternalLink size={14} />عرض الملف الكامل</a>
            <button onClick={onClose} aria-label="إغلاق"><X /></button>
          </div>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          {rows.map(([label, value]) => <div key={label} className="rounded-xl bg-[#faf6f0] p-4"><p className="text-xs text-[#a3907e]">{label}</p><p className="mt-1 text-sm font-semibold">{value || '—'}</p></div>)}
          {book.cover_image_url && <img src={book.cover_image_url} alt={`غلاف ${book.title}`} className="h-48 rounded-xl object-contain" />}
          {book.contract_pdf_url && <a href={book.contract_pdf_url} target="_blank" className="flex items-center justify-center rounded-xl border border-[#e8dfd3] p-4 text-sm font-semibold text-[#d8573a]">فتح ملف العقد PDF</a>}
        </div>
      </section>
    </div>
  )
}
