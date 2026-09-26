'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowDownUp, BookOpen, ExternalLink, Pencil, Plus, Search, Upload, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/Toast'
import { openPrivateFile, safeStoragePath, toStoragePath } from '@/lib/storage'
import { TableSkeleton, Spinner } from '@/components/Skeleton'
import { useStaffAccess } from '@/lib/useStaffAccess'
import { SharedLayout } from '@/components/SharedLayout'

const categories = ['رواية', 'شعر', 'تطوير ذات', 'أدب', 'أطفال', 'ديني', 'أخرى']
const paperTypes = ['أبيض', 'بلك', 'art']
const coverTypes = ['سوفت', 'هارد']
const emptyForm = { permit: '', isbn: '', title: '', authors: [] as string[], category: '', copies: '', freeCopies: '', size: '', paper: '', ink: '', summary: '', profit: '', phone: '', egp: '', aed: '', sar: '', usd: '', date: '', season: '', translator: '', coverType: '', coverNotes: '', parentBookId: '' }

type Book = {
  id: string; title: string; category: string; printed_copies: number; free_copies: number
  size: string; paper_type: string; print_color: string; brief: string; profit_percent: number
  author_phone: string; price_egp: number; price_aed: number; price_sar: number; price_usd: number
  contract_date: string; season: string; translator: string; cover_type: string; cover_notes: string
  contract_pdf_url: string | null; cover_image_url: string | null; parent_book_id: string | null; permit: string; isbn: string
  book_authors: { authors: { id: string; name: string } }[]
}

export default function ContractsPage() {
  const { toast } = useToast()
  const { loading: accessLoading, canView, canEdit } = useStaffAccess()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('الكل')
  const [sortAsc, setSortAsc] = useState(true)
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [detail, setDetail] = useState<Book | null>(null)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [newEdition, setNewEdition] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [contractFile, setContractFile] = useState<File | null>(null)
  const [removeContract, setRemoveContract] = useState(false)
  const supabase = createClient()

  const loadBooks = async () => {
    setLoading(true)
    const { data } = await supabase.from('books').select('*, book_authors(authors(id, name))').is('deleted_at', null).order('created_at', { ascending: false })
    setBooks((data as any) ?? [])
    setLoading(false)
  }
  useEffect(() => { loadBooks() }, [])

  const filteredBooks = useMemo(() => books.filter(book => {
    const authorNames = book.book_authors?.map(a => a.authors.name).join(' ') ?? ''
    return `${book.title} ${authorNames}`.includes(query) && (category === 'الكل' || book.category === category)
  }).sort((a, b) => sortAsc ? a.title.localeCompare(b.title, 'ar') : b.title.localeCompare(a.title, 'ar')), [books, query, category, sortAsc])

  const setField = (key: string, value: any) => setForm(current => ({ ...current, [key]: value }))

  const openCreate = () => { setEditingBook(null); setForm(emptyForm); setCoverFile(null); setContractFile(null); setRemoveContract(false); setNewEdition(false); setFormOpen(true) }
  const openEdit = (book: Book) => {
    setEditingBook(book)
    setForm({
      permit: book.permit || '', isbn: book.isbn || '', title: book.title, authors: book.book_authors?.map(a => a.authors.name) || [],
      category: book.category || '', copies: String(book.printed_copies || ''), freeCopies: String(book.free_copies || ''),
      size: book.size || '', paper: book.paper_type || '', ink: book.print_color || '', summary: book.brief || '',
      profit: String(book.profit_percent || ''), phone: book.author_phone || '',
      egp: String(book.price_egp || ''), aed: String(book.price_aed || ''), sar: String(book.price_sar || ''), usd: String(book.price_usd || ''),
      date: book.contract_date || '', season: book.season || '', translator: book.translator || '',
      coverType: book.cover_type || '', coverNotes: book.cover_notes || '', parentBookId: book.parent_book_id || '',
    })
    setCoverFile(null); setContractFile(null); setRemoveContract(false); setNewEdition(Boolean(book.parent_book_id)); setFormOpen(true)
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.title) return
    setSaving(true)

    const wasEditing = Boolean(editingBook)
    let coverUrl: string | null = editingBook?.cover_image_url ?? null
    const oldContract = editingBook?.contract_pdf_url ?? null
    let contractUrl: string | null = removeContract ? null : oldContract
    if (coverFile) {
      const { data, error } = await supabase.storage.from('book-covers').upload(safeStoragePath(coverFile), coverFile)
      if (error || !data) { setSaving(false); toast('فشل رفع صورة الغلاف: ' + (error?.message ?? ''), 'error'); return }
      coverUrl = supabase.storage.from('book-covers').getPublicUrl(data.path).data.publicUrl
    }
    if (contractFile) {
      // contract-pdfs is a private bucket: store the object path, open it later with a signed URL
      const { data, error } = await supabase.storage.from('contract-pdfs').upload(safeStoragePath(contractFile), contractFile)
      if (error || !data) { setSaving(false); toast('فشل رفع ملف العقد: ' + (error?.message ?? ''), 'error'); return }
      contractUrl = data.path
    }

    const payload = {
      permit: form.permit, isbn: form.isbn, title: form.title, category: form.category,
      printed_copies: Number(form.copies) || 0, free_copies: Number(form.freeCopies) || 0,
      size: form.size, paper_type: form.paper, print_color: form.ink, brief: form.summary,
      profit_percent: Number(form.profit) || 0, author_phone: form.phone,
      price_egp: Number(form.egp) || 0, price_aed: Number(form.aed) || 0, price_sar: Number(form.sar) || 0, price_usd: Number(form.usd) || 0,
      contract_date: form.date || null, season: form.season, translator: form.translator,
      cover_type: form.coverType, cover_notes: form.coverNotes,
      contract_pdf_url: contractUrl, cover_image_url: coverUrl,
      parent_book_id: newEdition && form.parentBookId ? form.parentBookId : null,
    }

    let bookId: string
    if (editingBook) {
      const { error: updateError } = await supabase.from('books').update(payload).eq('id', editingBook.id)
      if (updateError) { setSaving(false); toast('حصل خطأ في الحفظ: ' + updateError.message, 'error'); return }
      bookId = editingBook.id
      // contract removed or replaced -> delete the old file, unless another book still points to it
      if (oldContract && contractUrl !== oldContract) {
        const oldPath = toStoragePath('contract-pdfs', oldContract)
        const { count } = await supabase.from('books').select('id', { count: 'exact', head: true }).or(`contract_pdf_url.eq.${oldPath},contract_pdf_url.eq.${oldContract}`)
        if (!count) await supabase.storage.from('contract-pdfs').remove([oldPath])
      }
      // update authors: remove old, re-add
      await supabase.from('book_authors').delete().eq('book_id', bookId)
    } else {
      const { data: bookRow, error: bookError } = await supabase.from('books').insert(payload).select().single()
      if (bookError || !bookRow) { setSaving(false); return }
      bookId = bookRow.id
    }

    for (const authorName of form.authors) {
      const { data: existing } = await supabase.from('authors').select('id').eq('name', authorName).maybeSingle()
      let authorId = existing?.id
      if (!authorId) {
        const { data: created } = await supabase.from('authors').insert({ name: authorName, phone: form.phone }).select().single()
        authorId = created?.id
      }
      if (authorId) await supabase.from('book_authors').insert({ book_id: bookId, author_id: authorId })
    }

    setSaving(false); setForm(emptyForm); setCoverFile(null); setContractFile(null); setRemoveContract(false); setNewEdition(false); setFormOpen(false); setEditingBook(null); loadBooks(); toast(wasEditing ? 'تم تعديل الكتاب' : 'تمت إضافة الكتاب')
  }

  return (
    <SharedLayout title="التعاقدات والقسم الفني" subtitle="إدارة الكتب والعقود">
      {!accessLoading && !canView('contracts') ? (
        <p className="rounded-2xl border border-[#e8dfd3] bg-white p-8 text-center text-sm text-[#a3907e]">مفيش صلاحية وصول لهذا القسم.</p>
      ) : (
        <>
          <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="mb-1 text-[11px] font-medium tracking-[0.18em] text-[#d8573a]">القسم الفني</p>
              <h2 className="font-serif text-3xl font-semibold sm:text-4xl">كل الكتب</h2>
              <p className="mt-2 text-sm text-[#8a7969]">سجل الكتب المتعاقد عليها وتفاصيل القسم الفني — دوس على أي كتاب لعرض التفاصيل أو تعديلها.</p>
            </div>
            {canEdit('contracts') && <button onClick={openCreate} className="flex w-fit items-center gap-2 rounded-xl bg-[#d8573a] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(216,87,58,0.4)] transition hover:bg-[#c04a2f]"><Plus size={16} />إضافة كتاب جديد</button>}
          </div>

          <section className="overflow-hidden rounded-3xl border border-[#e8dfd3] bg-white shadow-[0_2px_8px_-2px_rgba(90,60,40,0.06)]">
            <div className="flex flex-col gap-3 border-b border-[#ede4d7] bg-[#fdf9f4] p-4 sm:flex-row sm:items-center">
              <label className="flex min-w-[240px] flex-1 items-center gap-2 rounded-xl border border-[#e8dfd3] bg-white px-3 py-2.5 text-xs text-[#a3907e]">
                <Search size={15} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="ابحث باسم الكتاب أو الكاتب" className="w-full bg-transparent outline-none" />
              </label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="rounded-xl border border-[#e8dfd3] bg-white px-3 py-2.5 text-xs"><option>الكل</option>{categories.map(item => <option key={item}>{item}</option>)}</select>
              <button onClick={() => setSortAsc(v => !v)} className="flex items-center gap-1.5 rounded-xl border border-[#e8dfd3] bg-white px-3 py-2.5 text-xs text-[#6b5d53]"><ArrowDownUp size={13} />ترتيب</button>
              <span className="text-xs text-[#a3907e]">{loading ? '' : `${filteredBooks.length} كتاب`}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-right text-sm">
                <thead><tr className="border-b border-[#ede4d7] bg-[#fdf9f4] text-[11px] font-medium text-[#a3907e]"><th className="px-5 py-3.5">الكتاب</th><th className="px-5 py-3.5">الكاتب</th><th className="px-5 py-3.5">التصنيف</th><th className="px-5 py-3.5">النسخ</th><th className="px-5 py-3.5">السعر (ج.م)</th><th className="px-5 py-3.5">تاريخ التعاقد</th><th className="px-5 py-3.5">إجراءات</th></tr></thead>
                <tbody>{filteredBooks.map(book => (
                  <tr key={book.id} className="border-b border-[#f0e7db] last:border-0 transition hover:bg-[#fdf9f4]">
                    <td className="px-5 py-4"><div className="flex items-center gap-3">{book.cover_image_url ? <img src={book.cover_image_url} alt="" className="size-10 shrink-0 rounded-lg object-cover" /> : <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#faf1eb]"><BookOpen size={16} className="text-[#d8573a]" /></div>}<span className="font-semibold">{book.title}</span></div></td>
                    <td className="px-5 py-4 text-[#6b5d53]">{book.book_authors?.map(a => a.authors.name).join('، ') || <span className="text-[#c4b3a1]">—</span>}</td>
                    <td className="px-5 py-4 text-[#6b5d53]">{book.category || '—'}</td>
                    <td className="px-5 py-4 text-[#6b5d53]">{book.printed_copies?.toLocaleString('en-US')}</td>
                    <td className="px-5 py-4 text-[#6b5d53]">{book.price_egp?.toLocaleString('en-US')}</td>
                    <td className="px-5 py-4 text-xs text-[#8a7969]">{book.contract_date || '—'}</td>
                    <td className="px-5 py-4"><div className="flex gap-2"><button onClick={() => setDetail(book)} className="rounded-lg bg-[#faf1eb] px-3 py-1.5 text-xs font-semibold text-[#d8573a] transition hover:bg-[#f2b590]/30">عرض</button>{canEdit('contracts') && <button onClick={() => openEdit(book)} className="rounded-lg border border-[#e8dfd3] px-3 py-1.5 text-xs font-semibold text-[#6b5d53] transition hover:border-[#d8573a] hover:text-[#d8573a]"><Pencil size={12} /></button>}</div></td>
                  </tr>
                ))}</tbody>
              </table>
              {!loading && filteredBooks.length === 0 && <p className="p-10 text-center text-sm text-[#a3907e]">لا توجد كتب مسجلة بعد.</p>}
            </div>
          </section>
        </>
      )}

      {formOpen && <BookFormModal form={form} setField={setField} newEdition={newEdition} setNewEdition={setNewEdition} onCoverChange={setCoverFile} onContractChange={(file: File | null) => { setContractFile(file); if (file) setRemoveContract(false) }} coverFile={coverFile} contractFile={contractFile} removeContract={removeContract} setRemoveContract={setRemoveContract} onClose={() => { setFormOpen(false); setEditingBook(null) }} onSubmit={submit} books={books} saving={saving} editing={editingBook} />}
      {detail && <BookDetail book={detail} onClose={() => setDetail(null)} onEdit={canEdit('contracts') ? () => { setDetail(null); openEdit(detail) } : undefined} />}
    </SharedLayout>
  )
}

function BookFormModal({ form, setField, newEdition, setNewEdition, onCoverChange, onContractChange, coverFile, contractFile, removeContract, setRemoveContract, onClose, onSubmit, books, saving, editing }: any) {
  const [authorInput, setAuthorInput] = useState('')
  const addAuthor = () => { if (authorInput.trim() && !form.authors.includes(authorInput.trim())) { setField('authors', [...form.authors, authorInput.trim()]); setAuthorInput('') } }
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#2a211c]/50 p-3 backdrop-blur-sm sm:p-6">
      <section className="my-3 w-full max-w-5xl rounded-3xl bg-white shadow-2xl sm:my-8">
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-3xl border-b border-[#ede4d7] bg-white p-6">
          <div><h2 className="font-serif text-xl font-semibold">{editing ? 'تعديل الكتاب' : 'إضافة كتاب جديد'}</h2><p className="mt-1 text-xs text-[#a3907e]">بيانات التعاقد والقسم الفني</p></div>
          <button onClick={onClose} className="rounded-xl p-2 text-[#8a7969] transition hover:bg-[#faf1eb]" aria-label="إغلاق"><X size={20} /></button>
        </div>
        <form onSubmit={onSubmit} className="grid gap-5 p-6 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="اسم الكتاب" required><input required value={form.title} onChange={e => setField('title', e.target.value)} className="inp" /></Field>
          <div>
            <label className="label">اسم الكاتب (يمكن إضافة أكثر من كاتب)</label>
            <div className="flex gap-2"><input value={authorInput} onChange={e => setAuthorInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addAuthor())} placeholder="اكتب واضغط إضافة" className="inp flex-1" /><button type="button" onClick={addAuthor} className="shrink-0 rounded-xl bg-[#faf1eb] px-3 text-xs font-semibold text-[#d8573a]">إضافة</button></div>
            <div className="mt-2 flex flex-wrap gap-1.5">{form.authors.map((a: string) => <button type="button" key={a} onClick={() => setField('authors', form.authors.filter((x: string) => x !== a))} className="rounded-full bg-[#faf1eb] px-3 py-1 text-xs text-[#6b5d53] transition hover:bg-[#f7dbd3]">{a} ×</button>)}</div>
          </div>
          <Field label="اسم المترجم"><input value={form.translator} onChange={e => setField('translator', e.target.value)} className="inp" /></Field>
          <Field label="اذن طباعة"><input value={form.permit} onChange={e => setField('permit', e.target.value)} className="inp" /></Field>
          <Field label="ترقيم دولي / ISBN"><input value={form.isbn} onChange={e => setField('isbn', e.target.value)} className="inp" /></Field>
          <Field label="تصنيف العمل"><select value={form.category} onChange={e => setField('category', e.target.value)} className="inp"><option value="">اختر</option>{categories.map(o => <option key={o}>{o}</option>)}</select></Field>
          <Field label="عدد النسخ المطبوعة"><input type="number" value={form.copies} onChange={e => setField('copies', e.target.value)} className="inp" /></Field>
          <Field label="عدد النسخ المجانية"><input type="number" value={form.freeCopies} onChange={e => setField('freeCopies', e.target.value)} className="inp" /></Field>
          <Field label="مقاس الكتاب"><input value={form.size} onChange={e => setField('size', e.target.value)} className="inp" /></Field>
          <Field label="نوع الورق"><select value={form.paper} onChange={e => setField('paper', e.target.value)} className="inp"><option value="">اختر</option>{paperTypes.map(o => <option key={o}>{o}</option>)}</select></Field>
          <Field label="لون الطباعة"><select value={form.ink} onChange={e => setField('ink', e.target.value)} className="inp"><option value="">اختر</option><option>أبيض وأسود</option><option>ملون</option></select></Field>
          <Field label="الغلاف"><select value={form.coverType} onChange={e => setField('coverType', e.target.value)} className="inp"><option value="">اختر</option>{coverTypes.map(o => <option key={o}>{o}</option>)}</select></Field>
          <Field label="ملاحظات الغلاف"><input value={form.coverNotes} onChange={e => setField('coverNotes', e.target.value)} className="inp" placeholder="اختياري" /></Field>
          <Field label="نسبة الأرباح %"><input type="number" value={form.profit} onChange={e => setField('profit', e.target.value)} className="inp" /></Field>
          <Field label="تليفون الكاتب"><input type="tel" value={form.phone} onChange={e => setField('phone', e.target.value)} className="inp" /></Field>
          <Field label="السعر بالجنية"><input type="number" value={form.egp} onChange={e => setField('egp', e.target.value)} className="inp" /></Field>
          <Field label="السعر بالدرهم"><input type="number" value={form.aed} onChange={e => setField('aed', e.target.value)} className="inp" /></Field>
          <Field label="السعر بالريال"><input type="number" value={form.sar} onChange={e => setField('sar', e.target.value)} className="inp" /></Field>
          <Field label="السعر بالدولار"><input type="number" value={form.usd} onChange={e => setField('usd', e.target.value)} className="inp" /></Field>
          <Field label="تاريخ التعاقد"><input type="date" value={form.date} onChange={e => setField('date', e.target.value)} className="inp" /></Field>
          <Field label="الموسم / المعرض"><input value={form.season} onChange={e => setField('season', e.target.value)} className="inp" placeholder="مثلاً: معرض الرياض 2026" /></Field>
          <div className="sm:col-span-2 lg:col-span-3"><label className="label">النبذة</label><textarea value={form.summary} onChange={e => setField('summary', e.target.value)} rows={3} className="inp" /></div>

          <div className="sm:col-span-2 lg:col-span-3 flex items-center justify-between rounded-2xl bg-[#fdf9f4] p-4">
            <div><p className="text-sm font-semibold">طبعة جديدة لكتاب موجود؟</p><p className="mt-0.5 text-xs text-[#a3907e]">اربط السجل بكتاب سابق</p></div>
            <button type="button" onClick={() => setNewEdition(!newEdition)} className={`relative h-6 w-11 rounded-full transition ${newEdition ? 'bg-[#d8573a]' : 'bg-[#cfbfa8]'}`}><span className={`absolute top-1 size-4 rounded-full bg-white transition ${newEdition ? 'right-1' : 'right-6'}`} /></button>
          </div>
          {newEdition && <Field label="الكتاب الأصلي"><select value={form.parentBookId} onChange={e => setField('parentBookId', e.target.value)} className="inp"><option value="">اختر</option>{books.map((b: any) => <option key={b.id} value={b.id}>{b.title}</option>)}</select></Field>}

          <div className="flex flex-col gap-2">
          <label className="flex flex-1 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#d4c4b0] bg-[#fdf9f4] p-6 text-center transition hover:border-[#d8573a]">
            <Upload size={20} className="text-[#d8573a]" /><span className="mt-2 text-xs font-semibold text-[#6b5d53]">رفع ملف PDF للعقد</span>
            {contractFile && <span className="mt-1 text-[11px] text-[#4a7a2c]">{contractFile.name}</span>}
            {!contractFile && editing?.contract_pdf_url && !removeContract && <span className="mt-1 text-[11px] text-[#8a7969]">ملف موجود — ارفع جديد لاستبداله</span>}
            <input type="file" accept="application/pdf" onChange={e => { onContractChange(e.target.files?.[0] ?? null); e.target.value = '' }} className="sr-only" />
          </label>
          {!contractFile && editing?.contract_pdf_url && (
            removeContract
              ? <div className="flex items-center justify-between rounded-xl bg-[#f7dbd3] px-3 py-2 text-[11px] text-[#c04a2f]"><span>العقد هيتشال نهائياً لما تضغطي حفظ</span><button type="button" onClick={() => setRemoveContract(false)} className="font-semibold underline">تراجع</button></div>
              : <button type="button" onClick={() => setRemoveContract(true)} className="self-start text-[11px] font-semibold text-[#c04a2f] hover:underline">إزالة ملف العقد</button>
          )}
          </div>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#d4c4b0] bg-[#fdf9f4] p-6 text-center transition hover:border-[#d8573a]">
            <Upload size={20} className="text-[#d8573a]" /><span className="mt-2 text-xs font-semibold text-[#6b5d53]">رفع صورة الغلاف</span>
            {coverFile && <span className="mt-1 text-[11px] text-[#4a7a2c]">{coverFile.name}</span>}
            {!coverFile && editing?.cover_image_url && <img src={editing.cover_image_url} alt="" className="mt-2 h-16 rounded-lg object-contain" />}
            <input type="file" accept="image/*" onChange={e => onCoverChange(e.target.files?.[0] ?? null)} className="sr-only" />
          </label>

          <div className="flex justify-end gap-3 border-t border-[#ede4d7] pt-5 sm:col-span-2 lg:col-span-3">
            <button type="button" onClick={onClose} className="rounded-xl border border-[#e8dfd3] px-5 py-3 text-sm font-semibold text-[#6b5d53]">إلغاء</button>
            <button disabled={saving} className="rounded-xl bg-[#d8573a] px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(216,87,58,0.4)] disabled:opacity-60">{saving ? <><Spinner size={14} className="text-white" />جارٍ الحفظ...</> : editing ? 'حفظ التعديل' : 'حفظ الكتاب'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}

function BookDetail({ book, onClose, onEdit }: { book: Book; onClose: () => void; onEdit?: () => void }) {
  const { toast } = useToast()
  const rows: [string, string][] = [
    ['اذن طباعة', book.permit], ['ترقيم دولي', book.isbn], ['تصنيف العمل', book.category],
    ['عدد النسخ المطبوعة', String(book.printed_copies)], ['عدد النسخ المجانية', String(book.free_copies)],
    ['مقاس الكتاب', book.size], ['نوع الورق', book.paper_type], ['لون الطباعة', book.print_color],
    ['الغلاف', book.cover_type ? `${book.cover_type}${book.cover_notes ? ` — ${book.cover_notes}` : ''}` : '—'],
    ['نسبة الأرباح', `${book.profit_percent}%`], ['تليفون الكاتب', book.author_phone], ['المترجم', book.translator || '—'],
    ['السعر', `${book.price_egp} ج.م / ${book.price_aed} د.إ / ${book.price_sar} ر.س${book.price_usd ? ` / ${book.price_usd} $` : ''}`],
    ['تاريخ التعاقد', book.contract_date || '—'], ['الموسم / المعرض', book.season || '—'],
    ['النبذة', book.brief],
  ]
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#2a211c]/50 p-3 backdrop-blur-sm sm:p-6">
      <section className="my-3 w-full max-w-4xl rounded-3xl bg-white shadow-2xl sm:my-8">
        <div className="flex items-center justify-between border-b border-[#ede4d7] p-6">
          <div className="flex items-center gap-4">
            {book.cover_image_url ? <img src={book.cover_image_url} alt="" className="size-16 rounded-xl object-cover" /> : <div className="flex size-16 items-center justify-center rounded-xl bg-[#faf1eb]"><BookOpen size={22} className="text-[#d8573a]" /></div>}
            <div><p className="text-xs text-[#d8573a]">{book.book_authors?.map(a => a.authors.name).join('، ') || '—'}</p><h2 className="font-serif text-xl font-semibold">{book.title}</h2></div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/books/${book.id}`} className="flex items-center gap-1.5 rounded-xl bg-[#faf1eb] px-3 py-2 text-xs font-semibold text-[#d8573a] transition hover:bg-[#f2b590]/30"><ExternalLink size={13} />الملف الكامل</Link>
            {onEdit && <button onClick={onEdit} className="flex items-center gap-1.5 rounded-xl border border-[#e8dfd3] px-3 py-2 text-xs font-semibold text-[#6b5d53] transition hover:border-[#d8573a] hover:text-[#d8573a]"><Pencil size={13} />تعديل</button>}
            <button onClick={onClose} className="rounded-xl p-2 text-[#8a7969] hover:bg-[#faf1eb]" aria-label="إغلاق"><X size={18} /></button>
          </div>
        </div>
        <div className="grid gap-3 p-6 sm:grid-cols-2">
          {rows.map(([label, value]) => <div key={label} className="rounded-2xl bg-[#fdf9f4] p-4"><p className="text-[11px] text-[#a3907e]">{label}</p><p className="mt-1 text-sm font-semibold text-[#2a211c]">{value || '—'}</p></div>)}
          {book.cover_image_url && <div className="flex items-center justify-center rounded-2xl bg-[#fdf9f4] p-4"><img src={book.cover_image_url} alt={`غلاف ${book.title}`} className="h-48 rounded-xl object-contain" /></div>}
          {book.contract_pdf_url && <button type="button" onClick={async () => { if (!(await openPrivateFile('contract-pdfs', book.contract_pdf_url!))) toast('مش قادر أفتح الملف — ممكن يكون اتمسح أو مالكش صلاحية', 'error') }} className="flex items-center justify-center rounded-2xl border border-[#e8dfd3] p-4 text-sm font-semibold text-[#d8573a] transition hover:bg-[#faf1eb]">فتح ملف العقد PDF</button>}
        </div>
      </section>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <div><label className="label">{label}{required && <span className="text-[#d8573a]"> *</span>}</label>{children}</div>
}
