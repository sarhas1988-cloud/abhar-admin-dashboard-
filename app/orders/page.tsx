'use client'

import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Pencil, Plus, Search, ShoppingCart, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useStaffAccess } from '@/lib/useStaffAccess'
import { SharedLayout } from '@/components/SharedLayout'

type Book = { id: string; title: string }
type Source = 'الموقع' | 'تليفون' | 'سوشيال ميديا' | 'أخرى'
type OrderItem = { id?: string; book_id: string; quantity: number; unit_price: number; bookTitle?: string }
type Order = {
  id: string; customer_name: string; customer_phone: string; customer_address: string
  price: number; source: Source; order_date: string; received_date: string | null; delivered_date: string | null; delivered: boolean
  order_items?: { id: string; book_id: string; quantity: number; unit_price: number; books: Book }[]
}
const sources: Source[] = ['الموقع', 'تليفون', 'سوشيال ميديا', 'أخرى']
const emptyItem: OrderItem = { book_id: '', quantity: 1, unit_price: 0 }
function daysSince(date: string) { return Math.floor((Date.now() - new Date(date).getTime()) / 86400000) }

export default function OrdersPage() {
  const { loading: accessLoading, canView, canEdit } = useStaffAccess()
  const [query, setQuery] = useState('')
  const [deliveredFilter, setDeliveredFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [books, setBooks] = useState<Book[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<Order | null>(null)
  const [customerName, setCustomerName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [totalPrice, setTotalPrice] = useState('')
  const [source, setSource] = useState<Source>('الموقع')
  const [orderDate, setOrderDate] = useState('')
  const [receivedDate, setReceivedDate] = useState('')
  const [deliveredDate, setDeliveredDate] = useState('')
  const [items, setItems] = useState<OrderItem[]>([{ ...emptyItem }])
  const supabase = createClient()

  const load = async () => {
    setLoading(true)
    const [{ data: b }, { data: o }] = await Promise.all([
      supabase.from('books').select('id, title').order('title'),
      supabase.from('orders').select('*, order_items(id, book_id, quantity, unit_price, books(id, title))').order('order_date', { ascending: false }),
    ])
    setBooks(b ?? [])
    setOrders((o as any) ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const isDelivered = (o: Order) => Boolean(o.delivered_date || o.delivered)
  const filtered = useMemo(() => orders.filter(o => {
    const bookNames = o.order_items?.map(i => i.books?.title).join(' ') ?? ''
    return `${bookNames} ${o.customer_name}`.includes(query) && (deliveredFilter === 'all' || (deliveredFilter === 'delivered' ? isDelivered(o) : !isDelivered(o))) && (sourceFilter === 'all' || o.source === sourceFilter)
  }), [orders, query, deliveredFilter, sourceFilter])
  const pending = orders.filter(o => !isDelivered(o))
  const overdue = pending.filter(o => daysSince(o.order_date) > 7)

  const openCreate = () => { setEditing(null); setCustomerName(''); setPhone(''); setAddress(''); setTotalPrice(''); setSource('الموقع'); setOrderDate(''); setReceivedDate(''); setDeliveredDate(''); setItems([{ ...emptyItem }]); setFormOpen(true) }
  const openEdit = (order: Order) => {
    setEditing(order); setCustomerName(order.customer_name); setPhone(order.customer_phone); setAddress(order.customer_address)
    setTotalPrice(String(order.price)); setSource(order.source); setOrderDate(order.order_date); setReceivedDate(order.received_date ?? ''); setDeliveredDate(order.delivered_date ?? '')
    setItems(order.order_items?.map(i => ({ id: i.id, book_id: i.book_id, quantity: i.quantity, unit_price: i.unit_price, bookTitle: i.books?.title })) ?? [{ ...emptyItem }])
    setFormOpen(true)
  }

  const updateItem = (idx: number, key: string, value: any) => setItems(curr => curr.map((item, i) => i === idx ? { ...item, [key]: value } : item))
  const addItem = () => setItems(curr => [...curr, { ...emptyItem }])
  const removeItem = (idx: number) => setItems(curr => curr.length > 1 ? curr.filter((_, i) => i !== idx) : curr)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!customerName || !orderDate || items.some(i => !i.book_id)) return
    setSaving(true)
    const payload = { customer_name: customerName, customer_phone: phone, customer_address: address, price: Number(totalPrice) || 0, source, order_date: orderDate, received_date: receivedDate || null, delivered_date: deliveredDate || null, delivered: Boolean(deliveredDate), book_id: items[0]?.book_id }
    let orderId: string
    if (editing) {
      await supabase.from('orders').update(payload).eq('id', editing.id)
      orderId = editing.id
      await supabase.from('order_items').delete().eq('order_id', orderId)
    } else {
      const { data: row, error } = await supabase.from('orders').insert(payload).select().single()
      if (error || !row) { setSaving(false); return }
      orderId = row.id
    }
    const orderItems = items.filter(i => i.book_id).map(i => ({ order_id: orderId, book_id: i.book_id, quantity: Number(i.quantity) || 1, unit_price: Number(i.unit_price) || 0 }))
    if (orderItems.length) await supabase.from('order_items').insert(orderItems)
    setSaving(false); setFormOpen(false); load()
  }

  return (
    <SharedLayout title="الاوردرات" subtitle="طلبات العملاء">
      {!accessLoading && !canView('orders') ? <p className="rounded-2xl border border-[#e8dfd3] bg-white p-8 text-center text-sm text-[#a3907e]">مفيش صلاحية وصول لهذا القسم.</p> : (
        <>
          <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="mb-1 text-[11px] font-medium tracking-[0.18em] text-[#d8573a]">متابعة الطلبات</p>
              <h2 className="font-serif text-3xl font-semibold sm:text-4xl">الأوردرات</h2>
              <p className="mt-2 text-sm text-[#8a7969]">تابع كل طلب عميل مع تواريخ الاستلام والتسليم ومحتوى الأوردر.</p>
            </div>
            {canEdit('orders') && <button onClick={openCreate} className="flex w-fit items-center gap-2 rounded-xl bg-[#d8573a] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(216,87,58,0.4)] transition hover:bg-[#c04a2f]"><Plus size={16} />أوردر جديد</button>}
          </div>

          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <StatCard title="إجمالي الأوردرات" value={orders.length} icon={ShoppingCart} />
            <StatCard title="قيد التسليم" value={pending.length} color="#8a5a1a" icon={CalendarDays} />
            <StatCard title="متأخرة (+٧ أيام)" value={overdue.length} color="#c04a2f" icon={CalendarDays} />
          </div>

          <section className="overflow-hidden rounded-3xl border border-[#e8dfd3] bg-white shadow-[0_2px_8px_-2px_rgba(90,60,40,0.06)]">
            <div className="flex flex-col gap-3 border-b border-[#ede4d7] bg-[#fdf9f4] p-4 sm:flex-row sm:items-center">
              <label className="flex min-w-[240px] flex-1 items-center gap-2 rounded-xl border border-[#e8dfd3] bg-white px-3 py-2.5 text-xs text-[#a3907e]"><Search size={15} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="ابحث باسم العميل أو الكتاب" className="w-full bg-transparent outline-none" /></label>
              <select value={deliveredFilter} onChange={e => setDeliveredFilter(e.target.value)} className="rounded-xl border border-[#e8dfd3] bg-white px-3 py-2.5 text-xs"><option value="all">كل الحالات</option><option value="delivered">تم التسليم</option><option value="pending">قيد التسليم</option></select>
              <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} className="rounded-xl border border-[#e8dfd3] bg-white px-3 py-2.5 text-xs"><option value="all">كل المصادر</option>{sources.map(s => <option key={s}>{s}</option>)}</select>
              <span className="text-xs text-[#a3907e]">{loading ? 'جارٍ التحميل...' : `${filtered.length} أوردر`}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-right text-sm">
                <thead><tr className="border-b border-[#ede4d7] bg-[#fdf9f4] text-[11px] font-medium text-[#a3907e]"><th className="px-5 py-3.5">الكتب</th><th className="px-5 py-3.5">العميل</th><th className="px-5 py-3.5">المصدر</th><th className="px-5 py-3.5">تاريخ الأوردر</th><th className="px-5 py-3.5">تاريخ الاستلام</th><th className="px-5 py-3.5">تاريخ التسليم</th><th className="px-5 py-3.5">الحالة</th><th className="px-5 py-3.5">إجراءات</th></tr></thead>
                <tbody>{filtered.map(order => (
                  <tr key={order.id} className="border-b border-[#f0e7db] last:border-0 transition hover:bg-[#fdf9f4]">
                    <td className="px-5 py-4"><div className="flex flex-col gap-0.5">{order.order_items?.map(i => <span key={i.id} className="text-xs">{i.books?.title} <span className="text-[#a3907e]">×{i.quantity}</span></span>) || <span className="text-[#c4b3a1]">—</span>}</div></td>
                    <td className="px-5 py-4"><p className="font-semibold">{order.customer_name}</p><p className="text-xs text-[#8a7969]">{order.customer_phone}</p></td>
                    <td className="px-5 py-4 text-xs text-[#6b5d53]">{order.source}</td>
                    <td className="px-5 py-4 text-xs text-[#8a7969]">{order.order_date}</td>
                    <td className="px-5 py-4 text-xs text-[#8a7969]">{order.received_date || <span className="text-[#c4b3a1]">—</span>}</td>
                    <td className="px-5 py-4 text-xs text-[#8a7969]">{order.delivered_date || <span className="text-[#c4b3a1]">—</span>}</td>
                    <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${isDelivered(order) ? 'bg-[#e8f2df] text-[#4a7a2c]' : 'bg-[#fbeed6] text-[#8a5a1a]'}`}>{isDelivered(order) ? 'تم التسليم' : 'قيد التسليم'}</span></td>
                    <td className="px-5 py-4">{canEdit('orders') && <button onClick={() => openEdit(order)} className="rounded-lg border border-[#e8dfd3] p-2 text-[#6b5d53] transition hover:border-[#d8573a] hover:text-[#d8573a]"><Pencil size={13} /></button>}</td>
                  </tr>
                ))}</tbody>
              </table>
              {!loading && filtered.length === 0 && <p className="p-10 text-center text-sm text-[#a3907e]">لا توجد أوردرات مسجلة بعد.</p>}
            </div>
          </section>
        </>
      )}

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#2a211c]/50 p-3 backdrop-blur-sm sm:p-6">
          <section className="my-3 w-full max-w-3xl rounded-3xl bg-white shadow-2xl sm:my-8">
            <div className="flex items-center justify-between border-b border-[#ede4d7] p-6"><div><h2 className="font-serif text-xl font-semibold">{editing ? 'تعديل الأوردر' : 'أوردر جديد'}</h2></div><button onClick={() => setFormOpen(false)} className="rounded-xl p-2 text-[#8a7969] hover:bg-[#faf1eb]"><X size={20} /></button></div>
            <form onSubmit={submit} className="space-y-5 p-6">
              {/* كتب الأوردر */}
              <div>
                <p className="label">الكتب في الأوردر</p>
                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 rounded-xl bg-[#fdf9f4] p-3">
                      <select required value={item.book_id} onChange={e => updateItem(idx, 'book_id', e.target.value)} className="inp flex-1"><option value="">اختر كتاب</option>{books.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}</select>
                      <input type="number" min="1" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} placeholder="الكمية" className="inp w-20" />
                      <input type="number" min="0" value={item.unit_price || ''} onChange={e => updateItem(idx, 'unit_price', e.target.value)} placeholder="سعر الوحدة" className="inp w-28" />
                      {items.length > 1 && <button type="button" onClick={() => removeItem(idx)} className="rounded-lg p-2 text-[#c04a2f] hover:bg-[#f7dbd3]"><X size={14} /></button>}
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addItem} className="mt-2 flex items-center gap-1.5 rounded-lg bg-[#faf1eb] px-3 py-2 text-xs font-semibold text-[#d8573a]"><Plus size={13} />إضافة كتاب آخر</button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className="label">اسم العميل</label><input required value={customerName} onChange={e => setCustomerName(e.target.value)} className="inp" /></div>
                <div><label className="label">رقم التليفون</label><input value={phone} onChange={e => setPhone(e.target.value)} className="inp" /></div>
                <div className="sm:col-span-2"><label className="label">العنوان</label><textarea rows={2} value={address} onChange={e => setAddress(e.target.value)} className="inp" /></div>
                <div><label className="label">السعر الإجمالي</label><input type="number" value={totalPrice} onChange={e => setTotalPrice(e.target.value)} className="inp" /></div>
                <div><label className="label">مصدر الأوردر</label><select value={source} onChange={e => setSource(e.target.value as Source)} className="inp">{sources.map(s => <option key={s}>{s}</option>)}</select></div>
                <div><label className="label">تاريخ الأوردر</label><input required type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} className="inp" /></div>
                <div><label className="label">تاريخ استلامنا للأوردر</label><input type="date" value={receivedDate} onChange={e => setReceivedDate(e.target.value)} className="inp" /></div>
                <div><label className="label">تاريخ التسليم للعميل <span className="text-[#a3907e] font-normal">(حطيه لما يتسلّم)</span></label><input type="date" value={deliveredDate} onChange={e => setDeliveredDate(e.target.value)} className="inp" /></div>
              </div>
              <div className="flex justify-end gap-3 border-t border-[#ede4d7] pt-5">
                <button type="button" onClick={() => setFormOpen(false)} className="rounded-xl border border-[#e8dfd3] px-5 py-3 text-sm font-semibold text-[#6b5d53]">إلغاء</button>
                <button disabled={saving} className="rounded-xl bg-[#d8573a] px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(216,87,58,0.4)] disabled:opacity-60">{saving ? 'جارٍ الحفظ...' : editing ? 'حفظ التعديل' : 'حفظ الأوردر'}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </SharedLayout>
  )
}

function StatCard({ title, value, icon: Icon, color = '#d8573a' }: { title: string; value: number; icon: typeof ShoppingCart; color?: string }) {
  return (
    <div className="rounded-2xl border border-[#e8dfd3] bg-white p-5 shadow-[0_2px_8px_-2px_rgba(90,60,40,0.06)]">
      <div className="flex items-start justify-between"><p className="text-xs text-[#a3907e]">{title}</p><div className="flex size-10 items-center justify-center rounded-xl" style={{ background: `${color}15`, color }}><Icon size={17} /></div></div>
      <p className="font-serif mt-3 text-3xl font-semibold" style={{ color }}>{value.toLocaleString('en-US')}</p>
    </div>
  )
}
