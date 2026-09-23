'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, BookOpen, Factory, Plus, ShoppingCart, TrendingUp, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useStaffAccess } from '@/lib/useStaffAccess'
import { SharedLayout } from '@/components/SharedLayout'

type Book = { id: string; title: string; category: string; printed_copies: number; contract_date: string; cover_image_url: string | null; book_authors: { authors: { name: string } }[] }
const palette = ['#d8573a', '#8a3b2e', '#b8752f', '#d4a05a', '#c9915f', '#e8b8a5']

export default function HomePage() {
  const { isAdmin, canView } = useStaffAccess()
  const [books, setBooks] = useState<Book[]>([])
  const [authorsCount, setAuthorsCount] = useState(0)
  const [pendingOrders, setPendingOrders] = useState(0)
  const [totalOrdersCount, setTotalOrdersCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    (async () => {
      setLoading(true)
      const [{ data: b }, { count: authorsC }, { count: pendingC }, { count: totalC }] = await Promise.all([
        supabase.from('books').select('id, title, category, printed_copies, contract_date, cover_image_url, book_authors(authors(name))').order('created_at', { ascending: false }).limit(6),
        supabase.from('authors').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('delivered', false),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
      ])
      setBooks((b as any) ?? [])
      setAuthorsCount(authorsC ?? 0)
      setPendingOrders(pendingC ?? 0)
      setTotalOrdersCount(totalC ?? 0)
      setLoading(false)
    })()
  }, [])

  const totalPrinted = books.reduce((sum, b) => sum + (b.printed_copies || 0), 0)
  const categoryBreakdown = useMemo(() => {
    const counts: Record<string, number> = {}
    books.forEach(b => { const c = b.category || 'أخرى'; counts[c] = (counts[c] || 0) + 1 })
    const total = books.length || 1
    return Object.entries(counts).map(([label, count], i) => ({ label, count, pct: Math.round((count / total) * 100), color: palette[i % palette.length] }))
  }, [books])
  const gradientStops = useMemo(() => {
    let acc = 0
    return categoryBreakdown.map(c => { const start = acc; acc += c.pct; return `${c.color} ${start}% ${acc}%` }).join(', ')
  }, [categoryBreakdown])

  return (
    <SharedLayout title="لوحة التحكم" subtitle="نظرة عامة">
      {/* ترحيب */}
      <div className="mb-8 overflow-hidden rounded-3xl border border-[#e8dfd3] bg-gradient-to-br from-[#2a211c] via-[#3d2b21] to-[#5a3a2a] p-8 text-white shadow-[0_16px_40px_-16px_rgba(90,60,40,0.35)] sm:p-10">
        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="absolute -left-16 -top-16 size-40 rounded-full bg-[#d8573a]/20 blur-3xl" />
          <div className="absolute -right-20 -bottom-20 size-52 rounded-full bg-[#b8752f]/15 blur-3xl" />
          <div className="relative">
            <p className="mb-2 text-[11px] font-medium tracking-[0.2em] text-[#f2b590]">مرحبًا بعودتك</p>
            <h2 className="font-serif text-3xl font-semibold leading-tight sm:text-4xl">تابع رحلة كتبك<br /><span className="text-[#f2b590]">من الحرف الأول إلى القارئ</span></h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/70">كل ما يحدث في الدار — تعاقدات، طباعة، مخزون، أوردرات — في مكان واحد.</p>
          </div>
          {canView('contracts') && (
            <Link href="/contracts" className="relative inline-flex w-fit shrink-0 items-center gap-2 rounded-xl bg-white/10 px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/20">
              <Plus size={16} />إضافة كتاب جديد
            </Link>
          )}
        </div>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat title="إجمالي الكتب" value={loading ? '...' : books.length} icon={BookOpen} accent="#d8573a" />
        <Stat title="إجمالي النسخ المطبوعة" value={loading ? '...' : totalPrinted} icon={Factory} accent="#b8752f" />
        <Stat title="أوردرات قيد التسليم" value={loading ? '...' : pendingOrders} icon={ShoppingCart} accent="#8a3b2e" />
        <Stat title="إجمالي المؤلفين" value={loading ? '...' : authorsCount} icon={Users} accent="#c9915f" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        {/* أحدث الكتب */}
        <section className="rounded-3xl border border-[#e8dfd3] bg-white p-6 shadow-[0_2px_8px_-2px_rgba(90,60,40,0.06)] sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium tracking-[0.18em] text-[#a3907e]">أحدث الإضافات</p>
              <h3 className="font-serif mt-1 text-xl font-semibold">أحدث الكتب</h3>
            </div>
            {canView('contracts') && <Link href="/contracts" className="flex items-center gap-1 text-xs font-semibold text-[#d8573a] hover:underline">عرض الكل<ArrowLeft size={13} /></Link>}
          </div>
          {loading ? (
            <p className="py-10 text-center text-sm text-[#a3907e]">جارٍ التحميل...</p>
          ) : books.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-[#faf1eb]"><BookOpen size={22} className="text-[#d8573a]" /></div>
              <p className="text-sm text-[#6b5d53]">لا توجد كتب مسجلة بعد</p>
              {canView('contracts') && <Link href="/contracts" className="text-xs font-semibold text-[#d8573a] hover:underline">ابدأ بإضافة كتاب من التعاقدات</Link>}
            </div>
          ) : (
            <div className="space-y-3">
              {books.map(book => (
                <Link key={book.id} href={`/books/${book.id}`} className="group flex items-center gap-4 rounded-2xl border border-[#f0e7db] bg-[#fdf9f4] p-3 transition hover:border-[#e8b8a5] hover:bg-[#faf1eb]">
                  {book.cover_image_url ? (
                    <img src={book.cover_image_url} alt={book.title} className="size-14 shrink-0 rounded-xl object-cover" />
                  ) : (
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#faf1eb] to-[#f2b590]/40"><BookOpen size={20} className="text-[#d8573a]" /></div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[#2a211c]">{book.title}</p>
                    <p className="mt-0.5 truncate text-xs text-[#6b5d53]">{book.book_authors?.map(a => a.authors.name).join('، ') || 'مؤلف غير مسجّل'}</p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-xs text-[#a3907e]">{book.category || '—'}</p>
                    <p className="mt-0.5 text-xs font-semibold text-[#6b5d53]">{book.printed_copies?.toLocaleString('en-US')} نسخة</p>
                  </div>
                  <ArrowLeft size={16} className="shrink-0 text-[#a3907e] transition group-hover:-translate-x-1 group-hover:text-[#d8573a]" />
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* توزيع التصنيفات */}
        <section className="rounded-3xl border border-[#e8dfd3] bg-white p-6 shadow-[0_2px_8px_-2px_rgba(90,60,40,0.06)] sm:p-8">
          <p className="text-[11px] font-medium tracking-[0.18em] text-[#a3907e]">التوزيع</p>
          <h3 className="font-serif mt-1 text-xl font-semibold">تصنيفات الكتب</h3>
          {categoryBreakdown.length > 0 ? (
            <div className="mt-6 flex flex-col items-center gap-6">
              <div className="relative flex size-[160px] items-center justify-center rounded-full" style={{ background: `conic-gradient(${gradientStops})` }}>
                <div className="flex size-[110px] flex-col items-center justify-center rounded-full bg-white text-center shadow-inner">
                  <strong className="font-serif text-3xl font-semibold text-[#2a211c]">{books.length}</strong>
                  <span className="text-[10px] text-[#a3907e]">كتاب</span>
                </div>
              </div>
              <div className="w-full space-y-2">
                {categoryBreakdown.map(c => (
                  <div key={c.label} className="flex items-center gap-3 rounded-xl bg-[#fdf9f4] p-2.5">
                    <span className="size-3 shrink-0 rounded-full" style={{ background: c.color }} />
                    <span className="flex-1 text-xs text-[#6b5d53]">{c.label}</span>
                    <span className="text-xs font-semibold text-[#2a211c]">{c.count}</span>
                    <span className="text-[10px] text-[#a3907e]">({c.pct}%)</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-[#faf1eb]"><TrendingUp size={22} className="text-[#d8573a]" /></div>
              <p className="text-sm text-[#6b5d53]">مفيش تصنيفات لسه</p>
            </div>
          )}
        </section>
      </div>
    </SharedLayout>
  )
}

function Stat({ title, value, icon: Icon, accent }: { title: string; value: string | number; icon: typeof BookOpen; accent: string }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[#e8dfd3] bg-white p-5 shadow-[0_2px_8px_-2px_rgba(90,60,40,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-8px_rgba(90,60,40,0.15)]">
      <div className="absolute -left-8 -top-8 size-24 rounded-full opacity-[0.06] transition group-hover:opacity-10" style={{ background: accent }} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs text-[#a3907e]">{title}</p>
          <p className="font-serif mt-3 text-3xl font-semibold text-[#2a211c]">{typeof value === 'number' ? value.toLocaleString('en-US') : value}</p>
        </div>
        <div className="flex size-11 items-center justify-center rounded-xl" style={{ background: `${accent}15`, color: accent }}>
          <Icon size={19} />
        </div>
      </div>
    </div>
  )
}
