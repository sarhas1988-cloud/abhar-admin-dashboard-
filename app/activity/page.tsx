'use client'

import { useEffect, useState } from 'react'
import { BookOpen, DollarSign, Factory, History, Package, ShoppingCart, UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useStaffAccess } from '@/lib/useStaffAccess'
import { SharedLayout } from '@/components/SharedLayout'

type LogEntry = { id: string; user_email: string; action: string; entity_type: string; entity_id: string; entity_title: string; created_at: string }

const entityIcon: Record<string, typeof BookOpen> = { book: BookOpen, order: ShoppingCart, printing: Factory, warehouse: Package, staff: UserPlus, expense: DollarSign, settings: History }
const entityLabel: Record<string, string> = { book: 'كتاب', order: 'أوردر', printing: 'مطبعة', warehouse: 'مخزن', staff: 'موظف', expense: 'مصروف', settings: 'إعدادات' }
const actionLabel: Record<string, string> = { created: 'إضافة', updated: 'تعديل', deleted: 'حذف', INSERT: 'إضافة', UPDATE: 'تعديل' }
const actionColor: Record<string, string> = { created: '#4a7a2c', updated: '#8a5a1a', deleted: '#c04a2f', INSERT: '#4a7a2c', UPDATE: '#8a5a1a' }

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'الآن'
  if (s < 3600) return `منذ ${Math.floor(s / 60)} دقيقة`
  if (s < 86400) return `منذ ${Math.floor(s / 3600)} ساعة`
  return `منذ ${Math.floor(s / 86400)} يوم`
}

export default function ActivityPage() {
  const { isAdmin } = useStaffAccess()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const supabase = createClient()

  useEffect(() => {
    if (!isAdmin) return
    (async () => {
      setLoading(true)
      const { data } = await supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(100)
      setLogs((data as any) ?? [])
      setLoading(false)
    })()
  }, [isAdmin])

  const filtered = filter === 'all' ? logs : logs.filter(l => l.entity_type === filter)

  return (
    <SharedLayout title="سجل التغييرات" subtitle="متابعة النشاط">
      {!isAdmin ? <p className="rounded-2xl border border-[#e8dfd3] bg-white p-8 text-center text-sm text-[#a3907e]">هذا القسم للأدمن فقط.</p> : (
        <>
          <div className="mb-10">
            <p className="mb-1 text-[11px] font-medium tracking-[0.18em] text-[#d8573a]">Activity Log</p>
            <h2 className="font-serif text-3xl font-semibold sm:text-4xl">سجل التغييرات</h2>
            <p className="mt-2 text-sm text-[#8a7969]">كل عملية إضافة أو تعديل أو حذف في النظام مسجلة هنا — مين عمل إيه وامتى.</p>
          </div>

          <div className="mb-6 flex flex-wrap gap-2">
            {['all', 'book', 'order', 'printing', 'warehouse', 'expense', 'staff'].map(key => (
              <button key={key} onClick={() => setFilter(key)} className={`rounded-full px-4 py-2 text-xs font-semibold transition ${filter === key ? 'bg-[#d8573a] text-white' : 'bg-[#fdf9f4] text-[#6b5d53] hover:bg-[#faf1eb]'}`}>
                {key === 'all' ? 'الكل' : entityLabel[key] || key}
              </button>
            ))}
          </div>

          <section className="overflow-hidden rounded-3xl border border-[#e8dfd3] bg-white shadow-[0_2px_8px_-2px_rgba(90,60,40,0.06)]">
            {loading ? <p className="p-10 text-center text-sm text-[#a3907e]">جارٍ التحميل...</p> : filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-3 p-12 text-center"><History size={24} className="text-[#c4b3a1]" /><p className="text-sm text-[#a3907e]">لا توجد سجلات بعد</p></div>
            ) : (
              <div className="divide-y divide-[#f0e7db]">
                {filtered.map(log => {
                  const Icon = entityIcon[log.entity_type] ?? History
                  const color = actionColor[log.action] ?? '#6b5d53'
                  return (
                    <div key={log.id} className="flex items-start gap-4 p-5 transition hover:bg-[#fdf9f4]">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl" style={{ background: `${color}12`, color }}><Icon size={17} /></div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white" style={{ background: color }}>{actionLabel[log.action] || log.action}</span>
                          <span className="text-xs font-medium text-[#6b5d53]">{entityLabel[log.entity_type] || log.entity_type}</span>
                        </div>
                        <p className="mt-1 text-sm font-semibold text-[#2a211c]">{log.entity_title || '—'}</p>
                        <p className="mt-1 text-xs text-[#a3907e]">{log.user_email || 'النظام'} · {timeAgo(log.created_at)}</p>
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
