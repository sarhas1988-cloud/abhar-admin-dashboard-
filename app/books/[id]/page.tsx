'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, BookOpen, CheckCircle2, Circle, Download, Factory, QrCode, ShoppingCart, Warehouse } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/Toast'
import { TableSkeleton, Spinner } from '@/components/Skeleton'
import { useCompanyInfo } from '@/lib/useCompanyInfo'
import QRCode from 'qrcode'
import { fetchAll } from '@/lib/fetchAll'

export default function BookProfilePage() {
  const params = useParams<{ id: string }>()
  const [book, setBook] = useState<any>(null)
  const [printing, setPrinting] = useState<any>(null)
  const [warehouseTotal, setWarehouseTotal] = useState(0)
  const [lastReceived, setLastReceived] = useState('')
  const [orders, setOrders] = useState<any[]>([])
  const [qrUrl, setQrUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const { company } = useCompanyInfo()
  const supabase = createClient()

  useEffect(() => {
    (async () => {
      setLoading(true)
      const [{ data: b }, { data: p }, { data: w }, { data: o }] = await Promise.all([
        supabase.from('books').select('*, book_authors(authors(name))').eq('id', params.id).maybeSingle(),
        supabase.from('printing_jobs').select('*').eq('book_id', params.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        fetchAll((from, to) => supabase.from('warehouse_log').select('id, quantity, received_at').eq('book_id', params.id).order('received_at', { ascending: false }).order('id').range(from, to)),
        // orders can contain several books: count through order_items, skip deleted orders
        fetchAll((from, to) => supabase.from('order_items').select('order_id, orders!inner(id, delivered, deleted_at)').eq('book_id', params.id).is('orders.deleted_at', null).order('order_id').range(from, to)),
      ])
      setBook(b)
      setPrinting(p)
      setWarehouseTotal((w ?? []).reduce((sum: number, r: any) => sum + (r.quantity || 0), 0))
      setLastReceived(w?.[0]?.received_at ?? '')
      // one row per order, even if the book appears twice in the same order
      const uniqueOrders = new Map<string, any>()
      ;(o ?? []).forEach((row: any) => { if (row.orders) uniqueOrders.set(row.orders.id, row.orders) })
      setOrders(Array.from(uniqueOrders.values()))
      // Generate QR with public book URL
      if (b) {
        const publicUrl = `${window.location.origin}/book/${params.id}`
        const url = await QRCode.toDataURL(publicUrl, { width: 200, margin: 1, color: { dark: '#2a211c', light: '#ffffff' } })
        setQrUrl(url)
      }
      setLoading(false)
    })()
  }, [params.id])

  if (loading) return <main dir="rtl" className="flex min-h-screen items-center justify-center bg-[#faf6f0] text-[#2a211c]"><p className="text-sm text-[#a3907e]">جارٍ التحميل...</p></main>

  if (!book) {
    return (
      <main dir="rtl" className="flex min-h-screen items-center justify-center bg-[#faf6f0] p-6 text-center text-[#2a211c]">
        <div><p className="text-lg font-bold">لم يتم العثور على هذا الكتاب</p><Link href="/contracts" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#d8573a]"><ArrowRight size={16} />العودة إلى التعاقدات</Link></div>
      </main>
    )
  }

  const stages = [
    { key: 'contract', label: 'التعاقد', done: true, note: book.contract_date || '—' },
    { key: 'printing', label: 'المطبعة', done: Boolean(printing?.delivered_to_author), note: printing?.received_at || (printing?.entered_at ? 'دخلت المطبعة' : 'لم تدخل المطبعة') },
    { key: 'warehouse', label: 'المخزن', done: warehouseTotal > 0, note: `${warehouseTotal.toLocaleString('en-US')} نسخة` },
    { key: 'orders', label: 'الاوردرات', done: orders.length > 0, note: `${orders.length} أوردر` },
  ]

  return (
    <main dir="rtl" className="min-h-screen bg-[#faf6f0] p-5 text-[#2a211c] sm:p-8">
      <div className="mx-auto max-w-[1000px]">
        <Link href="/contracts" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#6b5d53] hover:text-[#d8573a]"><ArrowRight size={16} />العودة إلى التعاقدات</Link>
        <div className="mb-6 flex flex-col justify-between gap-4 rounded-2xl border border-[#e8dfd3] bg-white p-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-xl bg-[#faf1eb]">{book.cover_image_url ? <img src={book.cover_image_url} alt={book.title} className="size-14 rounded-xl object-cover" /> : <BookOpen size={24} className="text-[#d8573a]" />}</div>
            <div><p className="text-xs text-[#a3907e]">{book.permit}</p><h1 className="font-serif text-xl font-semibold sm:text-2xl">{book.title}</h1><p className="mt-1 text-sm text-[#6b5d53]">{book.book_authors?.map((a: any) => a.authors.name).join('، ')} — {book.category}</p></div>
          </div>
          <div className="text-sm"><p className="text-xs text-[#a3907e]">السعر</p><p className="font-semibold">{book.price_egp} ج.م / {book.price_aed} د.إ / {book.price_sar} ر.س</p></div>
        </div>

        <section className="mb-6 rounded-2xl border border-[#e8dfd3] bg-white p-6">
          <h3 className="mb-5 font-bold">مسار الكتاب</h3>
          <div className="flex flex-col gap-0 sm:flex-row sm:items-start sm:gap-4">
            {stages.map((stage, i) => (
              <div key={stage.key} className="flex flex-1 items-start gap-3 sm:flex-col sm:items-center sm:text-center">
                <div className="flex flex-col items-center sm:w-full"><div className="flex items-center gap-2 sm:w-full sm:flex-row-reverse">{stage.done ? <CheckCircle2 size={22} className="shrink-0 text-[#4a7a2c]" /> : <Circle size={22} className="shrink-0 text-[#cfbfa8]" />}{i < stages.length - 1 && <div className="hidden h-[2px] flex-1 bg-[#ede4d7] sm:block" />}</div></div>
                <div className="pb-4 sm:pb-0"><p className={`text-sm font-semibold ${stage.done ? 'text-[#2a211c]' : 'text-[#a3907e]'}`}>{stage.label}</p><p className="mt-1 text-xs text-[#a3907e]">{stage.note}</p></div>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#e8dfd3] bg-white p-5"><div className="mb-2 flex items-center gap-2 text-[#d8573a]"><Factory size={18} /><span className="text-xs font-semibold text-[#6b5d53]">المطبعة</span></div><p className="text-sm">{printing?.received_at ? `استُلمت في ${printing.received_at}` : printing?.shipped_at ? `شُحنت في ${printing.shipped_at}` : 'لم تُستلم بعد'}</p>{printing?.printer_name && <p className="mt-1 text-xs text-[#6b5d53]">{printing.printer_name}{printing.printing_location ? ` — ${printing.printing_location}` : ''}</p>}<p className="mt-1 text-xs text-[#a3907e]">تسليم الكاتب: {printing?.delivered_to_author ? 'تم' : 'لم يتم'}</p></div>
          <div className="rounded-2xl border border-[#e8dfd3] bg-white p-5"><div className="mb-2 flex items-center gap-2 text-[#d8573a]"><Warehouse size={18} /><span className="text-xs font-semibold text-[#6b5d53]">المخزن</span></div><p className="text-sm">{warehouseTotal.toLocaleString('en-US')} نسخة</p><p className="mt-1 text-xs text-[#a3907e]">آخر استلام: {lastReceived || '—'}</p></div>
          <div className="rounded-2xl border border-[#e8dfd3] bg-white p-5"><div className="mb-2 flex items-center gap-2 text-[#d8573a]"><ShoppingCart size={18} /><span className="text-xs font-semibold text-[#6b5d53]">الاوردرات</span></div><p className="text-sm">{orders.length} أوردر</p><p className="mt-1 text-xs text-[#a3907e]">{orders.filter(o => o.delivered).length} تم تسليمه</p></div>
        </div>

        {/* QR Code */}
        {qrUrl && (
          <section className="mt-6 rounded-2xl border border-[#e8dfd3] bg-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-[#faf1eb] text-[#d8573a]"><QrCode size={18} /></div><div><h3 className="font-semibold text-[#2a211c]">QR Code</h3><p className="text-xs text-[#a3907e]">امسحه بالكاميرا لفتح صفحة الكتاب العامة</p></div></div>
              <a href={qrUrl} download={`QR-${book?.title || 'book'}.png`} className="flex items-center gap-1.5 rounded-xl bg-[#faf1eb] px-4 py-2 text-xs font-semibold text-[#d8573a] transition hover:bg-[#f2b590]/30"><Download size={14} />تحميل</a>
            </div>
            <div className="mt-4 flex justify-center"><img src={qrUrl} alt="QR Code" className="size-40 rounded-xl border border-[#ede4d7] bg-white p-2" /></div>
          </section>
        )}
      </div>
    </main>
  )
}
