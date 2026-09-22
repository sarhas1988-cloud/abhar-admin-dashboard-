'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, BookOpen, CheckCircle2, Circle, Factory, ShoppingCart, Warehouse } from 'lucide-react'

const bookDirectory = {
  'PR-2401': {
    title: 'ممرات الضوء', authors: ['ليان السالم'], category: 'رواية', isbn: '978-603-000-2401',
    priceEgp: 85, priceAed: 28, priceSar: 32, contractDate: '2026-09-18',
    printing: { enteredAt: '2026-09-20', receivedAt: '', delivered: false },
    warehouseTotal: 1200, lastReceived: '2026-09-20',
    orders: [{ customer: 'سارة محمود', delivered: true }],
  },
  'PR-2398': {
    title: 'فن الإصغاء', authors: ['د. سامر نجيب'], category: 'تطوير ذات', isbn: '978-603-000-2398',
    priceEgp: 70, priceAed: 23, priceSar: 26, contractDate: '2026-09-12',
    printing: { enteredAt: '2026-09-15', receivedAt: '2026-09-27', delivered: true },
    warehouseTotal: 800, lastReceived: '2026-09-15',
    orders: [{ customer: 'خالد العتيبي', delivered: false }],
  },
  'PR-2392': {
    title: 'على حافة الغيم', authors: ['ريم العتيبي', 'هند صالح'], category: 'شعر', isbn: '978-603-000-2392',
    priceEgp: 55, priceAed: 18, priceSar: 21, contractDate: '2026-09-05',
    printing: { enteredAt: '2026-09-08', receivedAt: '', delivered: false },
    warehouseTotal: 14, lastReceived: '2026-08-01',
    orders: [{ customer: 'منى الحربي', delivered: false }],
  },
  'PR-2387': {
    title: 'مدن لا تنام', authors: ['ياسر حمد'], category: 'أدب', isbn: '978-603-000-2387',
    priceEgp: 60, priceAed: 20, priceSar: 23, contractDate: '2026-08-20',
    printing: { enteredAt: '2026-08-25', receivedAt: '2026-09-01', delivered: true },
    warehouseTotal: 0, lastReceived: '2026-07-10',
    orders: [],
  },
} as const

type BookId = keyof typeof bookDirectory

export default function BookProfilePage() {
  const params = useParams<{ id: string }>()
  const id = params.id as BookId
  const book = bookDirectory[id]

  if (!book) {
    return (
      <main dir="rtl" className="flex min-h-screen items-center justify-center bg-[#f7f8fa] p-6 text-center text-[#1a2540]">
        <div>
          <p className="text-lg font-bold">لم يتم العثور على هذا الكتاب</p>
          <Link href="/contracts" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#d8573a]"><ArrowRight size={16} />العودة إلى التعاقدات</Link>
        </div>
      </main>
    )
  }

  const stages = [
    { key: 'contract', label: 'التعاقد', done: true, note: book.contractDate },
    { key: 'printing', label: 'المطبعة', done: book.printing.delivered, note: book.printing.receivedAt || (book.printing.enteredAt ? 'دخلت المطبعة' : 'لم تدخل المطبعة') },
    { key: 'warehouse', label: 'المخزن', done: book.warehouseTotal > 0, note: `${book.warehouseTotal.toLocaleString('ar-EG')} نسخة` },
    { key: 'orders', label: 'الاوردرات', done: book.orders.length > 0, note: `${book.orders.length} أوردر` },
  ]

  return (
    <main dir="rtl" className="min-h-screen bg-[#f7f8fa] p-5 text-[#1a2540] sm:p-8">
      <div className="mx-auto max-w-[1000px]">
        <Link href="/contracts" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#69758a] hover:text-[#d8573a]"><ArrowRight size={16} />العودة إلى التعاقدات</Link>

        <div className="mb-6 flex flex-col justify-between gap-4 rounded-2xl border border-[#e8ebf0] bg-white p-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-xl bg-[#fff0ed]"><BookOpen size={24} className="text-[#d8573a]" /></div>
            <div>
              <p className="text-xs text-[#9ba4b2]">{id}</p>
              <h1 className="text-xl font-bold sm:text-2xl">{book.title}</h1>
              <p className="mt-1 text-sm text-[#69758a]">{book.authors.join('، ')} — {book.category}</p>
            </div>
          </div>
          <div className="flex gap-4 text-sm">
            <div><p className="text-xs text-[#9ba4b2]">السعر</p><p className="font-semibold">{book.priceEgp} ج.م / {book.priceAed} د.إ / {book.priceSar} ر.س</p></div>
          </div>
        </div>

        <section className="mb-6 rounded-2xl border border-[#e8ebf0] bg-white p-6">
          <h3 className="mb-5 font-bold">مسار الكتاب</h3>
          <div className="flex flex-col gap-0 sm:flex-row sm:items-start sm:gap-4">
            {stages.map((stage, i) => (
              <div key={stage.key} className="flex flex-1 items-start gap-3 sm:flex-col sm:items-center sm:text-center">
                <div className="flex flex-col items-center sm:w-full">
                  <div className="flex items-center gap-2 sm:w-full sm:flex-row-reverse">
                    {stage.done ? <CheckCircle2 size={22} className="shrink-0 text-[#25824a]" /> : <Circle size={22} className="shrink-0 text-[#cfd5de]" />}
                    {i < stages.length - 1 && <div className="hidden h-[2px] flex-1 bg-[#eef0f3] sm:block" />}
                  </div>
                </div>
                <div className="pb-4 sm:pb-0">
                  <p className={`text-sm font-semibold ${stage.done ? 'text-[#1a2540]' : 'text-[#9ba4b2]'}`}>{stage.label}</p>
                  <p className="mt-1 text-xs text-[#9ba4b2]">{stage.note}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#e8ebf0] bg-white p-5">
            <div className="mb-2 flex items-center gap-2 text-[#d8573a]"><Factory size={18} /><span className="text-xs font-semibold text-[#69758a]">المطبعة</span></div>
            <p className="text-sm">{book.printing.receivedAt ? `استُلمت في ${book.printing.receivedAt}` : 'لم تُستلم بعد'}</p>
            <p className="mt-1 text-xs text-[#9ba4b2]">تسليم الكاتب: {book.printing.delivered ? 'تم' : 'لم يتم'}</p>
          </div>
          <div className="rounded-2xl border border-[#e8ebf0] bg-white p-5">
            <div className="mb-2 flex items-center gap-2 text-[#d8573a]"><Warehouse size={18} /><span className="text-xs font-semibold text-[#69758a]">المخزن</span></div>
            <p className="text-sm">{book.warehouseTotal.toLocaleString('ar-EG')} نسخة</p>
            <p className="mt-1 text-xs text-[#9ba4b2]">آخر استلام: {book.lastReceived}</p>
          </div>
          <div className="rounded-2xl border border-[#e8ebf0] bg-white p-5">
            <div className="mb-2 flex items-center gap-2 text-[#d8573a]"><ShoppingCart size={18} /><span className="text-xs font-semibold text-[#69758a]">الاوردرات</span></div>
            <p className="text-sm">{book.orders.length} أوردر</p>
            <p className="mt-1 text-xs text-[#9ba4b2]">{book.orders.filter(o => o.delivered).length} تم تسليمه</p>
          </div>
        </div>
      </div>
    </main>
  )
}
