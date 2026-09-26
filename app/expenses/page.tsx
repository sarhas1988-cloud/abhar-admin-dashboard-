'use client'

import { useEffect, useMemo, useState } from 'react'
import { DollarSign, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/Toast'
import { TableSkeleton, Spinner } from '@/components/Skeleton'
import { useStaffAccess } from '@/lib/useStaffAccess'
import { SharedLayout } from '@/components/SharedLayout'

type Book = { id: string; title: string }
type Expense = { id: string; book_id: string | null; category: string; description: string; amount: number; currency: string; expense_date: string; receipt_url: string | null; books?: Book | null }

const expenseCategories = ['طباعة', 'شحن', 'تصميم', 'تسويق', 'إداري', 'أخرى']
const currencies = ['EGP', 'AED', 'SAR', 'USD']
const emptyForm = { bookId: '', category: 'إداري', description: '', amount: '', currency: 'EGP', date: '', receiptFile: null as File | null }

export default function ExpensesPage() {
  const { isAdmin } = useStaffAccess()
  const { toast } = useToast()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [query, setQuery] = useState('')
  const [catFilter, setCatFilter] = useState('الكل')
  const supabase = createClient()

  const load = async () => {
    setLoading(true)
    const [{ data: e }, { data: b }] = await Promise.all([
      supabase.from('expenses').select('*, books(id, title)').is('deleted_at', null).order('expense_date', { ascending: false }),
      supabase.from('books').select('id, title').is('deleted_at', null).order('title'),
    ])
    setExpenses((e as any) ?? [])
    setBooks(b ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const filtered = useMemo(() => expenses.filter(e =>
    `${e.description} ${e.books?.title || ''} ${e.category}`.includes(query) && (catFilter === 'الكل' || e.category === catFilter)
  ), [expenses, query, catFilter])

  const totalEGP = useMemo(() => expenses.filter(e => e.currency === 'EGP').reduce((s, e) => s + e.amount, 0), [expenses])

  const openCreate = () => { setEditing(null); setForm(emptyForm); setFormOpen(true) }
  const openEdit = (exp: Expense) => {
    setEditing(exp)
    setForm({ bookId: exp.book_id || '', category: exp.category, description: exp.description || '', amount: String(exp.amount), currency: exp.currency, date: exp.expense_date, receiptFile: null })
    setFormOpen(true)
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.amount || !form.date) return
    setSaving(true)

    let receiptUrl = editing?.receipt_url ?? null
    if (form.receiptFile) {
      const path = `receipts/${Date.now()}-${form.receiptFile.name}`
      const { data } = await supabase.storage.from('contract-pdfs').upload(path, form.receiptFile)
      if (data) receiptUrl = supabase.storage.from('contract-pdfs').getPublicUrl(data.path).data.publicUrl
    }

    const payload = { book_id: form.bookId || null, category: form.category, description: form.description, amount: Number(form.amount), currency: form.currency, expense_date: form.date, receipt_url: receiptUrl }
    if (editing) await supabase.from('expenses').update(payload).eq('id', editing.id)
    else await supabase.from('expenses').insert(payload)
    setSaving(false); setFormOpen(false); load(); toast(editing ? 'تم تعديل المصروف' : 'تمت إضافة المصروف')
  }

  const deleteExpense = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المصروف؟')) return
    await supabase.from('expenses').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    load(); toast('تم نقل المصروف لسلة المحذوفات', 'warning')
  }

  return (
    <SharedLayout title="المصروفات" subtitle="تتبع النفقات">
      {!isAdmin ? <p className="rounded-2xl border border-[#e8dfd3] bg-white p-8 text-center text-sm text-[#a3907e]">هذا القسم للأدمن فقط.</p> : (
        <>
          <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="mb-1 text-[11px] font-medium tracking-[0.18em] text-[#d8573a]">إدارة مالية</p>
              <h2 className="font-serif text-3xl font-semibold sm:text-4xl">المصروفات</h2>
              <p className="mt-2 text-sm text-[#8a7969]">سجّل كل مصروف (طباعة، شحن، تصميم...) واربطه بكتاب لو محتاج.</p>
            </div>
            <button onClick={openCreate} className="flex w-fit items-center gap-2 rounded-xl bg-[#d8573a] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(216,87,58,0.4)] transition hover:bg-[#c04a2f]"><Plus size={16} />مصروف جديد</button>
          </div>

          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#e8dfd3] bg-white p-5 shadow-[0_2px_8px_-2px_rgba(90,60,40,0.06)]">
              <p className="text-xs text-[#a3907e]">إجمالي المصروفات (ج.م)</p>
              <p className="font-serif mt-3 text-3xl font-semibold text-[#d8573a]">{totalEGP.toLocaleString('en-US')}</p>
            </div>
            <div className="rounded-2xl border border-[#e8dfd3] bg-white p-5 shadow-[0_2px_8px_-2px_rgba(90,60,40,0.06)]">
              <p className="text-xs text-[#a3907e]">عدد المصروفات</p>
              <p className="font-serif mt-3 text-3xl font-semibold text-[#2a211c]">{expenses.length}</p>
            </div>
            <div className="rounded-2xl border border-[#e8dfd3] bg-white p-5 shadow-[0_2px_8px_-2px_rgba(90,60,40,0.06)]">
              <p className="text-xs text-[#a3907e]">مصروفات مرتبطة بكتب</p>
              <p className="font-serif mt-3 text-3xl font-semibold text-[#b8752f]">{expenses.filter(e => e.book_id).length}</p>
            </div>
          </div>

          <section className="overflow-hidden rounded-3xl border border-[#e8dfd3] bg-white shadow-[0_2px_8px_-2px_rgba(90,60,40,0.06)]">
            <div className="flex flex-col gap-3 border-b border-[#ede4d7] bg-[#fdf9f4] p-4 sm:flex-row sm:items-center">
              <label className="flex min-w-[240px] flex-1 items-center gap-2 rounded-xl border border-[#e8dfd3] bg-white px-3 py-2.5 text-xs text-[#a3907e]"><Search size={15} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="ابحث" className="w-full bg-transparent outline-none" /></label>
              <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="rounded-xl border border-[#e8dfd3] bg-white px-3 py-2.5 text-xs"><option>الكل</option>{expenseCategories.map(c => <option key={c}>{c}</option>)}</select>
              <span className="text-xs text-[#a3907e]">{loading ? '' : `${filtered.length} مصروف`}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-right text-sm">
                <thead><tr className="border-b border-[#ede4d7] bg-[#fdf9f4] text-[11px] font-medium text-[#a3907e]"><th className="px-5 py-3.5">التصنيف</th><th className="px-5 py-3.5">الوصف</th><th className="px-5 py-3.5">الكتاب</th><th className="px-5 py-3.5">المبلغ</th><th className="px-5 py-3.5">التاريخ</th><th className="px-5 py-3.5">إجراءات</th></tr></thead>
                <tbody>{filtered.map(exp => (
                  <tr key={exp.id} className="border-b border-[#f0e7db] last:border-0 transition hover:bg-[#fdf9f4]">
                    <td className="px-5 py-4"><span className="rounded-full bg-[#faf1eb] px-3 py-1 text-xs font-semibold text-[#d8573a]">{exp.category}</span></td>
                    <td className="px-5 py-4 text-[#6b5d53]">{exp.description || '—'}</td>
                    <td className="px-5 py-4 text-xs text-[#8a7969]">{exp.books?.title || <span className="text-[#c4b3a1]">عام</span>}</td>
                    <td className="px-5 py-4 font-semibold">{exp.amount.toLocaleString('en-US')} {exp.currency}</td>
                    <td className="px-5 py-4 text-xs text-[#8a7969]">{exp.expense_date}</td>
                    <td className="px-5 py-4"><div className="flex gap-2"><button onClick={() => openEdit(exp)} className="rounded-lg border border-[#e8dfd3] p-2 text-[#6b5d53] hover:text-[#d8573a]"><Pencil size={13} /></button><button onClick={() => deleteExpense(exp.id)} className="rounded-lg border border-[#e8dfd3] p-2 text-[#c4b3a1] hover:text-[#c04a2f]"><Trash2 size={13} /></button></div></td>
                  </tr>
                ))}</tbody>
              </table>
              {!loading && filtered.length === 0 && <p className="p-10 text-center text-sm text-[#a3907e]">لا توجد مصروفات مسجلة بعد.</p>}
            </div>
          </section>
        </>
      )}

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#2a211c]/50 p-3 backdrop-blur-sm sm:p-6">
          <section className="my-3 w-full max-w-2xl rounded-3xl bg-white shadow-2xl sm:my-8">
            <div className="flex items-center justify-between border-b border-[#ede4d7] p-6"><h2 className="font-serif text-xl font-semibold">{editing ? 'تعديل المصروف' : 'مصروف جديد'}</h2><button onClick={() => setFormOpen(false)} className="rounded-xl p-2 text-[#8a7969] hover:bg-[#faf1eb]"><X size={20} /></button></div>
            <form onSubmit={submit} className="grid gap-4 p-6 sm:grid-cols-2">
              <div><label className="label">التصنيف</label><select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))} className="inp">{expenseCategories.map(c => <option key={c}>{c}</option>)}</select></div>
              <div><label className="label">المبلغ</label><input required type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))} className="inp" /></div>
              <div><label className="label">العملة</label><select value={form.currency} onChange={e => setForm(f => ({...f, currency: e.target.value}))} className="inp">{currencies.map(c => <option key={c}>{c}</option>)}</select></div>
              <div><label className="label">التاريخ</label><input required type="date" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} className="inp" /></div>
              <div className="sm:col-span-2"><label className="label">الوصف</label><input value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} className="inp" placeholder="مثال: طباعة 1000 نسخة من كتاب X" /></div>
              <div className="sm:col-span-2"><label className="label">مرتبط بكتاب <span className="font-normal text-[#a3907e]">(اختياري)</span></label><select value={form.bookId} onChange={e => setForm(f => ({...f, bookId: e.target.value}))} className="inp"><option value="">مصروف عام</option>{books.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}</select></div>
              <div className="flex justify-end gap-3 border-t border-[#ede4d7] pt-5 sm:col-span-2">
                <button type="button" onClick={() => setFormOpen(false)} className="rounded-xl border border-[#e8dfd3] px-5 py-3 text-sm font-semibold text-[#6b5d53]">إلغاء</button>
                <button disabled={saving} className="rounded-xl bg-[#d8573a] px-6 py-3 text-sm font-semibold text-white disabled:opacity-60">{saving ? <><Spinner size={14} className="text-white" />جارٍ...</> : 'حفظ'}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </SharedLayout>
  )
}
