'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, BookOpen, CheckCircle2, Circle, Factory, ShoppingCart, Warehouse } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function BookProfilePage() {
  const params = useParams<{ id: string }>()
  const [book, setBook] = useState<any>(null)
  const [printing, setPrinting] = useState<any>(null)
  const [warehouseTotal, setWarehouseTotal] = useState(0)
  const [lastReceived, setLastReceived] = useState('')
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    (async () => {
      setLoading(true)
      const [{ data: b }, { data: p }, { data: w }, { data: o }] = await Promise.all([
        supabase.from('books').select('*, book_authors(authors(name))').eq('id', params.id).maybeSingle(),
        supabase.from('printing_jobs').select('*').eq('book_id', params.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('warehouse_log').select('quantity, received_at').eq('book_id', params.id).order('received_at', { ascending: false }),
        supabase.from('orders').select('id, delivered').eq('book_id', params.id),
      ])
      setBook(b)
      setPrinting(p)
      setWarehouseTotal((w ?? []).reduce((sum, r) => sum + r.quantity, 0))
      setLastReceived(w?.[0]?.received_at ?? '')
      setOrders(o ?? [])
      setLoading(false)
    })()
  }, [params.id])

  if (loading) return <main dir="rtl" className="flex min-h-screen items-center justify-center bg-[#f7f8fa] text-[#1a2540]"><p className="text-sm text-[#9ba4b2]">جارٍ التحميل...</p></main>

  if (!book) {
    return (
      <main dir="rtl" className="flex min-h-screen items-center justify-center bg-[#f7f8fa] p-6 text-center text-[#1a2540]">
        <div><p className="text-lg font-bold">لم يتم العثور على هذا الكتاب</p><Link href="/contracts" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#d8573a]"><ArrowRight size={16} />العودة إلى التعاقدات</Link></div>
      </main>
    )
  }

  const stages = [
    { key: 'contract', label: 'التعاقد', done: true, note: book.contract_date || '—' },
    { key: 'printing', label: 'المطبعة', done: Boolean(printing?.delivered_to_author), note: printing?.received_at || (printing?.entered_at ? 'دخلت المطبعة' : 'لم تدخل المطبعة') },
    { key: 'warehouse', label: 'المخزن', done: warehouseTotal > 0, note: `${warehouseTotal.toLocaleString('ar-EG')} نسخة` },
    { key: 'orders', label: 'الاوردرات', done: orders.length > 0, note: `${orders.length} أوردر` },
  ]

  return (
    <main dir="rtl" className="min-h-screen bg-[#f7f8fa] p-5 text-[#1a2540] sm:p-8">
      <div className="mx-auto max-w-[1000px]">
        <Link href="/contracts" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#69758a] hover:text-[#d8573a]"><ArrowRight size={16} />العودة إلى التعاقدات</Link>
        <div className="mb-6 flex flex-col justify-between gap-4 rounded-2xl border border-[#e8ebf0] bg-white p-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-xl bg-[#fff0ed]">{book.cover_image_url ? <img src={book.cover_image_url} alt={book.title} className="size-14 rounded-xl object-cover" /> : <BookOpen size={24} className="text-[#d8573a]" />}</div>
            <div><p className="text-xs text-[#9ba4b2]">{book.permit}</p><h1 className="text-xl font-bold sm:text-2xl">{book.title}</h1><p className="mt-1 text-sm text-[#69758a]">{book.book_authors?.map((a: any) => a.authors.name).join('، ')} — {book.category}</p></div>
          </div>
          <div className="text-sm"><p className="text-xs text-[#9ba4b2]">السعر</p><p className="font-semibold">{book.price_egp} ج.م / {book.price_aed} د.إ / {book.price_sar} ر.س</p></div>
        </div>

        <section className="mb-6 rounded-2xl border border-[#e8ebf0] bg-white p-6">
          <h3 className="mb-5 font-bold">مسار الكتاب</h3>
          <div className="flex flex-col gap-0 sm:flex-row sm:items-start sm:gap-4">
            {stages.map((stage, i) => (
              <div key={stage.key} className="flex flex-1 items-start gap-3 sm:flex-col sm:items-center sm:text-center">
                <div className="flex flex-col items-center sm:w-full"><div className="flex items-center gap-2 sm:w-full sm:flex-row-reverse">{stage.done ? <CheckCircle2 size={22} className="shrink-0 text-[#25824a]" /> : <Circle size={22} className="shrink-0 text-[#cfd5de]" />}{i < stages.length - 1 && <div className="hidden h-[2px] flex-1 bg-[#eef0f3] sm:block" />}</div></div>
                <div className="pb-4 sm:pb-0"><p className={`text-sm font-semibold ${stage.done ? 'text-[#1a2540]' : 'text-[#9ba4b2]'}`}>{stage.label}</p><p className="mt-1 text-xs text-[#9ba4b2]">{stage.note}</p></div>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#e8ebf0] bg-white p-5"><div className="mb-2 flex items-center gap-2 text-[#d8573a]"><Factory size={18} /><span className="text-xs font-semibold text-[#69758a]">المطبعة</span></div><p className="text-sm">{printing?.received_at ? `استُلمت في ${printing.received_at}` : 'لم تُستلم بعد'}</p><p className="mt-1 text-xs text-[#9ba4b2]">تسليم الكاتب: {printing?.delivered_to_author ? 'تم' : 'لم يتم'}</p></div>
          <div className="rounded-2xl border border-[#e8ebf0] bg-white p-5"><div className="mb-2 flex items-center gap-2 text-[#d8573a]"><Warehouse size={18} /><span className="text-xs font-semibold text-[#69758a]">المخزن</span></div><p className="text-sm">{warehouseTotal.toLocaleString('ar-EG')} نسخة</p><p className="mt-1 text-xs text-[#9ba4b2]">آخر استلام: {lastReceived || '—'}</p></div>
          <div className="rounded-2xl border border-[#e8ebf0] bg-white p-5"><div className="mb-2 flex items-center gap-2 text-[#d8573a]"><ShoppingCart size={18} /><span className="text-xs font-semibold text-[#69758a]">الاوردرات</span></div><p className="text-sm">{orders.length} أوردر</p><p className="mt-1 text-xs text-[#9ba4b2]">{orders.filter(o => o.delivered).length} تم تسليمه</p></div>
        </div>
      </div>
    </main>
  )
}
