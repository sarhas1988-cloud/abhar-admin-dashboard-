'use client'

import { useEffect, useState } from 'react'
import { BookOpen, RotateCcw, ShoppingCart, Trash2, DollarSign } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useStaffAccess } from '@/lib/useStaffAccess'
import { SharedLayout } from '@/components/SharedLayout'

type DeletedItem = { id: string; type: 'book' | 'order' | 'expense'; title: string; deleted_at: string }

export default function TrashPage() {
  const { isAdmin } = useStaffAccess()
  const [items, setItems] = useState<DeletedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState('')
  const supabase = createClient()

  const load = async () => {
    setLoading(true)
    const [{ data: books }, { data: orders }, { data: expenses }] = await Promise.all([
      supabase.from('books').select('id, title, deleted_at').not('deleted_at', 'is', null).order('deleted_at', { ascending: false }),
      supabase.from('orders').select('id, customer_name, deleted_at').not('deleted_at', 'is', null).order('deleted_at', { ascending: false }),
      supabase.from('expenses').select('id, category, amount, currency, deleted_at').not('deleted_at', 'is', null).order('deleted_at', { ascending: false }),
    ])
    const all: DeletedItem[] = [
      ...(books ?? []).map((b: any) => ({ id: b.id, type: 'book' as const, title: b.title, deleted_at: b.deleted_at })),
      ...(orders ?? []).map((o: any) => ({ id: o.id, type: 'order' as const, title: o.customer_name, deleted_at: o.deleted_at })),
      ...(expenses ?? []).map((e: any) => ({ id: e.id, type: 'expense' as const, title: `${e.category}: ${e.amount} ${e.currency}`, deleted_at: e.deleted_at })),
    ].sort((a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime())
    setItems(all)
    setLoading(false)
  }

  useEffect(() => { if (isAdmin) load() }, [isAdmin])

  const restore = async (item: DeletedItem) => {
    setProcessing(item.id)
    const table = item.type === 'book' ? 'books' : item.type === 'order' ? 'orders' : 'expenses'
    await supabase.from(table).update({ deleted_at: null }).eq('id', item.id)
    setProcessing('')
    load()
  }

  const permanentDelete = async (item: DeletedItem) => {
    if (!confirm(`هل أنت متأكد من الحذف النهائي لـ "${item.title}"؟\n\nهذا الإجراء لا يمكن التراجع عنه.`)) return
    setProcessing(item.id)
    const table = item.type === 'book' ? 'books' : item.type === 'order' ? 'orders' : 'expenses'
    await supabase.from(table).delete().eq('id', item.id)
    setProcessing('')
    load()
  }

  const typeIcon: Record<string, typeof BookOpen> = { book: BookOpen, order: ShoppingCart, expense: DollarSign }
  const typeLabel: Record<string, string> = { book: 'كتاب', order: 'أوردر', expense: 'مصروف' }
  const typeColor: Record<string, string> = { book: '#d8573a', order: '#8a5a1a', expense: '#4a7a2c' }

  function timeAgo(iso: string) {
    const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
    return d === 0 ? 'اليوم' : d === 1 ? 'أمس' : `منذ ${d} يوم`
  }

  return (
    <SharedLayout title="سلة المحذوفات" subtitle="حذف مؤقت — قابل للاسترجاع">
      {!isAdmin ? <p className="rounded-2xl border border-[#e8dfd3] bg-white p-8 text-center text-sm text-[#a3907e]">هذا القسم للأدمن فقط.</p> : (
        <>
          <div className="mb-10">
            <p className="mb-1 text-[11px] font-medium tracking-[0.18em] text-[#d8573a]">Trash</p>
            <h2 className="font-serif text-3xl font-semibold sm:text-4xl">سلة المحذوفات</h2>
            <p className="mt-2 text-sm text-[#8a7969]">كل العناصر المحذوفة محفوظة هنا — تقدر تسترجعها في أي وقت أو تحذفها نهائياً.</p>
          </div>

          {items.length > 0 && (
            <div className="mb-6 rounded-2xl border border-[#e8c9a0] bg-[#fbeed6] p-4 text-sm text-[#8a5a1a]">
              <strong>{items.length} عنصر</strong> في السلة — الحذف النهائي مش هيرجع.
            </div>
          )}

          <section className="overflow-hidden rounded-3xl border border-[#e8dfd3] bg-white shadow-[0_2px_8px_-2px_rgba(90,60,40,0.06)]">
            {loading ? <p className="p-10 text-center text-sm text-[#a3907e]">جارٍ التحميل...</p> : items.length === 0 ? (
              <div className="flex flex-col items-center gap-3 p-14 text-center">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-[#e8f2df]"><Trash2 size={24} className="text-[#4a7a2c]" /></div>
                <p className="font-serif text-lg font-semibold text-[#2a211c]">السلة فاضية</p>
                <p className="text-sm text-[#a3907e]">كل البيانات سليمة — ما فيش حاجة محذوفة.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#f0e7db]">
                {items.map(item => {
                  const Icon = typeIcon[item.type]
                  const color = typeColor[item.type]
                  return (
                    <div key={item.id} className="flex items-center gap-4 p-5 transition hover:bg-[#fdf9f4]">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl" style={{ background: `${color}12`, color }}><Icon size={17} /></div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-[#2a211c]">{item.title}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white" style={{ background: color }}>{typeLabel[item.type]}</span>
                          <span className="text-xs text-[#a3907e]">حُذف {timeAgo(item.deleted_at)}</span>
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button disabled={processing === item.id} onClick={() => restore(item)}
                          className="flex items-center gap-1.5 rounded-xl border border-[#e8dfd3] px-3 py-2 text-xs font-semibold text-[#4a7a2c] transition hover:bg-[#e8f2df] disabled:opacity-50">
                          <RotateCcw size={13} />استرجاع
                        </button>
                        <button disabled={processing === item.id} onClick={() => permanentDelete(item)}
                          className="flex items-center gap-1.5 rounded-xl border border-[#e8dfd3] px-3 py-2 text-xs font-semibold text-[#c04a2f] transition hover:bg-[#f7dbd3] disabled:opacity-50">
                          <Trash2 size={13} />حذف نهائي
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </>
      )}
    </SharedLayout>
  )
}
