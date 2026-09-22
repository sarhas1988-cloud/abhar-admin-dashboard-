'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, ClipboardList, Factory, Grid2X2, LayoutDashboard, LogOut, Menu, Plus, Search, ShieldCheck, ShoppingCart, Warehouse, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useStaffAccess } from '@/lib/useStaffAccess'

type Book = { id: string; title: string }
type Source = 'الموقع' | 'تليفون' | 'سوشيال ميديا' | 'أخرى'
type Order = { id: string; book_id: string; customer_name: string; customer_phone: string; customer_address: string; price: number; source: Source; order_date: string; delivered: boolean; books: Book }
const sources: Source[] = ['الموقع', 'تليفون', 'سوشيال ميديا', 'أخرى']
const emptyForm = { bookId: '', customerName: '', phone: '', address: '', price: '', source: 'الموقع' as Source, orderDate: '', delivered: false }
function daysSince(date: string) { return Math.floor((Date.now() - new Date(date).getTime()) / 86400000) }

export default function OrdersPage() {
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
  const [deliveredFilter, setDeliveredFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [books, setBooks] = useState<Book[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<Order | null>(null)
  const [form, setForm] = useState(emptyForm)
  const supabase = createClient()

  const load = async () => {
    setLoading(true)
    const [{ data: b }, { data: o }] = await Promise.all([
      supabase.from('books').select('id, title').order('title'),
      supabase.from('orders').select('*, books(id, title)').order('order_date', { ascending: false }),
    ])
    setBooks(b ?? [])
    setOrders((o as any) ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const filtered = useMemo(() => orders.filter(o => `${o.books?.title} ${o.customer_name}`.includes(query) && (deliveredFilter === 'all' || (deliveredFilter === 'delivered' ? o.delivered : !o.delivered)) && (sourceFilter === 'all' || o.source === sourceFilter)), [orders, query, deliveredFilter, sourceFilter])
  const pending = orders.filter(o => !o.delivered)
  const overdue = pending.filter(o => daysSince(o.order_date) > 7)

  const openCreate = () => { setEditing(null); setForm(emptyForm); setFormOpen(true) }
  const openEdit = (order: Order) => { setEditing(order); setForm({ bookId: order.book_id, customerName: order.customer_name, phone: order.customer_phone, address: order.customer_address, price: String(order.price), source: order.source, orderDate: order.order_date, delivered: order.delivered }); setFormOpen(true) }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.bookId || !form.customerName || !form.orderDate) return
    setSaving(true)
    const payload = { book_id: form.bookId, customer_name: form.customerName, customer_phone: form.phone, customer_address: form.address, price: Number(form.price) || 0, source: form.source, order_date: form.orderDate, delivered: form.delivered }
    if (editing) await supabase.from('orders').update(payload).eq('id', editing.id)
    else await supabase.from('orders').insert(payload)
    setSaving(false)
    setFormOpen(false)
    load()
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#faf6f0] text-[#2a211c]">
      <aside className={`fixed inset-y-0 right-0 z-40 flex w-[252px] flex-col border-l border-[#e8dfd3] bg-white px-5 py-6 transition-transform lg:translate-x-0 ${menuOpen ? 'translate-x-0' : 'translate-x-[110%]'}`}>
        <div className="flex items-center justify-between pb-8"><div className="flex items-center gap-2.5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#faf1eb] p-1.5"><img src="/abhar-logo.svg" alt="إبهار" className="h-full w-full object-contain" /></div>
          <div className="min-w-0"><p className="font-serif text-base font-semibold leading-tight text-[#2a211c]">إبهار</p><p className="text-[10px] leading-tight text-[#a3907e]">للنشر والتوزيع</p></div>
        </div><button onClick={() => setMenuOpen(false)} className="lg:hidden" aria-label="إغلاق القائمة"><X /></button></div>
        <p className="mb-3 px-3 text-[11px] font-semibold tracking-[0.16em] text-[#a3907e]">القائمة الرئيسية</p>
        <nav className="flex flex-col gap-1.5">{navItems.map(({ label, href, icon: Icon }) => <Link key={href} href={href} onClick={() => setMenuOpen(false)} className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium ${pathname === href ? 'bg-[#faf1eb] text-[#d8573a]' : 'text-[#6b5d53] hover:bg-[#faf6f0]'}`}><Icon size={19} /><span>{label}</span>{href === '/orders' && pending.length > 0 && <span className="mr-auto rounded-full bg-[#d8573a] px-2 py-0.5 text-[10px] font-bold text-white">{pending.length}</span>}</Link>)}</nav>
        <div className="mt-auto border-t border-[#ede4d7] pt-4"><button onClick={signOut} className="flex items-center gap-3 px-3.5 py-3 text-sm text-[#6b5d53] hover:text-[#c04a2f]"><LogOut size={19} />تسجيل الخروج</button></div>
      </aside>
      {menuOpen && <button className="fixed inset-0 z-30 bg-[#2a211c]/20 lg:hidden" onClick={() => setMenuOpen(false)} aria-label="إغلاق القائمة" />}

      <section className="lg:mr-[252px]">
        <header className="flex h-[84px] items-center justify-between border-b border-[#e8dfd3] bg-white px-5 sm:px-8"><div className="flex items-center gap-3"><button onClick={() => setMenuOpen(true)} className="lg:hidden" aria-label="فتح القائمة"><Menu /></button><div><p className="text-xs text-[#8a7969]">طلبات العملاء</p><h1 className="font-serif mt-1 text-xl font-semibold sm:text-2xl">الاوردرات</h1></div></div><Bell size={19} className="text-[#6b5d53]" /></header>
        <div className="mx-auto max-w-[1400px] p-5 pb-24 sm:p-8 lg:pb-8">
          {!accessLoading && !canView('orders') ? <p className="rounded-xl border border-[#e8dfd3] bg-white p-6 text-center text-sm text-[#a3907e]">مفيش صلاحية وصول لهذا القسم.</p> : (
            <>
              <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="mb-2 flex items-center gap-2 text-xs font-medium text-[#d8573a]"><span className="size-2 rounded-full bg-[#d8573a]" />متابعة كل الطلبات</div><h2 className="font-serif text-3xl font-semibold sm:text-4xl">الأوردرات</h2><p className="mt-2 text-sm text-[#8a7969]">سجل كل طلب عميل وحالة تسليمه.</p></div>{canEdit('orders') && <button onClick={openCreate} className="flex w-fit items-center gap-2 rounded-xl bg-[#d8573a] px-4 py-3 text-sm font-semibold text-white"><Plus size={18} />إضافة أوردر جديد</button>}</div>
              <div className="mb-6 grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border border-[#e8dfd3] bg-white p-5"><p className="text-xs text-[#8a7969]">إجمالي الأوردرات</p><p className="mt-2 text-2xl font-bold">{orders.length}</p></div><div className="rounded-2xl border border-[#e8dfd3] bg-white p-5"><p className="text-xs text-[#8a7969]">قيد التسليم</p><p className="mt-2 text-2xl font-bold text-[#8a5a1a]">{pending.length}</p></div><div className="rounded-2xl border border-[#e8dfd3] bg-white p-5"><p className="text-xs text-[#8a7969]">متأخرة (أكثر من ٧ أيام)</p><p className="mt-2 text-2xl font-bold text-[#c04a2f]">{overdue.length}</p></div></div>
              <section className="rounded-2xl border border-[#e8dfd3] bg-white shadow-[0_1px_3px_-1px_rgba(90,60,40,0.06)]">
                <div className="flex flex-col gap-3 border-b border-[#ede4d7] p-4 sm:flex-row sm:items-center"><label className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-[#e8dfd3] px-3 py-2 text-xs text-[#a3907e]"><Search size={15} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="ابحث باسم العميل أو الكتاب" className="w-full bg-transparent outline-none" /></label><select value={deliveredFilter} onChange={e => setDeliveredFilter(e.target.value)} className="rounded-lg border border-[#e8dfd3] bg-white px-3 py-2 text-xs"><option value="all">كل الحالات</option><option value="delivered">تم التسليم</option><option value="pending">قيد التسليم</option></select><select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} className="rounded-lg border border-[#e8dfd3] bg-white px-3 py-2 text-xs"><option value="all">كل المصادر</option>{sources.map(s => <option key={s}>{s}</option>)}</select><span className="text-xs text-[#a3907e]">{loading ? 'جارٍ التحميل...' : `${filtered.length} أوردر`}</span></div>
                <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-right text-sm"><thead><tr className="border-b border-[#ede4d7] text-xs text-[#a3907e]"><th className="px-5 py-4">اسم الكتاب</th><th className="px-5 py-4">اسم العميل</th><th className="px-5 py-4">رقم التليفون</th><th className="px-5 py-4">السعر</th><th className="px-5 py-4">مصدر الأوردر</th><th className="px-5 py-4">تاريخ الاستلام</th><th className="px-5 py-4">تم التسليم</th><th className="px-5 py-4">إجراء</th></tr></thead><tbody>{filtered.map(order => <tr key={order.id} className="border-b border-[#f0e7db] last:border-0"><td className="px-5 py-4 font-semibold">{order.books?.title}</td><td className="px-5 py-4 text-[#6b5d53]">{order.customer_name}</td><td className="px-5 py-4 text-[#6b5d53]">{order.customer_phone}</td><td className="px-5 py-4 text-[#6b5d53]">{order.price?.toLocaleString('ar-EG')} ج.م</td><td className="px-5 py-4 text-[#6b5d53]">{order.source}</td><td className="px-5 py-4 text-xs text-[#6b5d53]">{order.order_date}</td><td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${order.delivered ? 'bg-[#e8f2df] text-[#4a7a2c]' : 'bg-[#fbeed6] text-[#8a5a1a]'}`}>{order.delivered ? 'نعم' : 'لا'}</span></td><td className="px-5 py-4">{canEdit('orders') && <button onClick={() => openEdit(order)} className="rounded-lg border border-[#e8dfd3] px-3 py-2 text-xs font-semibold text-[#d8573a]">تعديل</button>}</td></tr>)}</tbody></table>{!loading && filtered.length === 0 && <p className="p-8 text-center text-sm text-[#a3907e]">لا توجد أوردرات مسجلة بعد.</p>}</div>
              </section>
            </>
          )}
        </div>
      </section>
      <nav className="fixed inset-x-0 bottom-0 z-20 flex gap-1 overflow-x-auto border-t border-[#e8dfd3] bg-white px-2 py-2 lg:hidden">{navItems.map(({ label, href, icon: Icon }) => <Link key={href} href={href} className={`flex min-w-[72px] flex-1 flex-col items-center gap-1 rounded-lg px-1 py-1 text-[10px] ${pathname === href ? 'text-[#d8573a]' : 'text-[#8a7969]'}`}><Icon size={18} /><span className="truncate">{label}</span></Link>)}</nav>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#2a211c]/30 p-3 sm:p-6">
          <section className="my-3 w-full max-w-2xl rounded-2xl bg-white shadow-2xl sm:my-8">
            <div className="flex items-center justify-between border-b border-[#ede4d7] p-5"><div><h2 className="font-serif text-xl font-semibold">{editing ? 'تعديل الأوردر' : 'إضافة أوردر جديد'}</h2></div><button onClick={() => setFormOpen(false)} aria-label="إغلاق"><X /></button></div>
            <form onSubmit={submit} className="grid gap-4 p-5 sm:grid-cols-2">
              <label className="sm:col-span-2"><span className="mb-2 block text-xs font-semibold text-[#6b5d53]">اسم الكتاب</span><select required value={form.bookId} onChange={e => setForm(f => ({ ...f, bookId: e.target.value }))} className="w-full rounded-xl border border-[#e8dfd3] bg-white px-3 py-3 text-sm"><option value="">ابحث واختر كتاباً</option>{books.map(book => <option key={book.id} value={book.id}>{book.title}</option>)}</select></label>
              <label><span className="mb-2 block text-xs font-semibold text-[#6b5d53]">اسم العميل</span><input required value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} className="w-full rounded-xl border border-[#e8dfd3] px-3 py-3 text-sm outline-none focus:border-[#d8573a]" /></label>
              <label><span className="mb-2 block text-xs font-semibold text-[#6b5d53]">رقم التليفون</span><input required value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full rounded-xl border border-[#e8dfd3] px-3 py-3 text-sm outline-none focus:border-[#d8573a]" /></label>
              <label className="sm:col-span-2"><span className="mb-2 block text-xs font-semibold text-[#6b5d53]">عنوان العميل</span><textarea rows={2} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="w-full rounded-xl border border-[#e8dfd3] px-3 py-3 text-sm" /></label>
              <label><span className="mb-2 block text-xs font-semibold text-[#6b5d53]">سعر الأوردر</span><input required type="number" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="w-full rounded-xl border border-[#e8dfd3] px-3 py-3 text-sm outline-none focus:border-[#d8573a]" /></label>
              <label><span className="mb-2 block text-xs font-semibold text-[#6b5d53]">مصدر الأوردر</span><select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value as Source }))} className="w-full rounded-xl border border-[#e8dfd3] bg-white px-3 py-3 text-sm">{sources.map(s => <option key={s}>{s}</option>)}</select></label>
              <label><span className="mb-2 block text-xs font-semibold text-[#6b5d53]">تاريخ استلام الأوردر</span><input required type="date" value={form.orderDate} onChange={e => setForm(f => ({ ...f, orderDate: e.target.value }))} className="w-full rounded-xl border border-[#e8dfd3] px-3 py-3 text-sm" /></label>
              <label className="flex items-center justify-between rounded-xl border border-[#e8dfd3] p-4"><span className="text-sm font-semibold">تم التسليم او لا</span><input type="checkbox" checked={form.delivered} onChange={e => setForm(f => ({ ...f, delivered: e.target.checked }))} className="size-5 accent-[#d8573a]" /></label>
              <div className="flex justify-end gap-3 border-t border-[#ede4d7] pt-4 sm:col-span-2"><button type="button" onClick={() => setFormOpen(false)} className="rounded-xl border border-[#e8dfd3] px-5 py-3 text-sm font-semibold">إلغاء</button><button disabled={saving} type="submit" className="rounded-xl bg-[#d8573a] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'جارٍ الحفظ...' : editing ? 'حفظ التعديل' : 'حفظ الأوردر'}</button></div>
            </form>
          </section>
        </div>
      )}
    </main>
  )
}
