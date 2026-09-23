'use client'

import { useEffect, useState } from 'react'
import { BarChart3, BookOpen, Download, Factory, FileSpreadsheet, Package, ShoppingCart, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useStaffAccess } from '@/lib/useStaffAccess'
import { SharedLayout } from '@/components/SharedLayout'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

type ReportType = 'books' | 'authors' | 'printing' | 'warehouse' | 'orders' | 'platforms'

const reportTypes: { key: ReportType; label: string; icon: typeof BookOpen; desc: string; color: string }[] = [
  { key: 'books', label: 'الكتب والتعاقدات', icon: BookOpen, desc: 'كل الكتب مع بيانات العقود والأسعار والمؤلفين', color: '#d8573a' },
  { key: 'authors', label: 'المؤلفين', icon: Users, desc: 'قائمة المؤلفين وكتبهم', color: '#b8752f' },
  { key: 'printing', label: 'المطبعة', icon: Factory, desc: 'حالة الطباعة لكل كتاب', color: '#8a3b2e' },
  { key: 'warehouse', label: 'المخزن', icon: Package, desc: 'أرصدة المخزون ودفعات الاستلام', color: '#4a7a2c' },
  { key: 'orders', label: 'الأوردرات', icon: ShoppingCart, desc: 'كل الطلبات مع بيانات العملاء والتسليم', color: '#8a5a1a' },
  { key: 'platforms', label: 'المنصات', icon: BarChart3, desc: 'حالة الكتب على كل منصة', color: '#c9915f' },
]

export default function ReportsPage() {
  const { isAdmin } = useStaffAccess()
  const [exporting, setExporting] = useState<ReportType | null>(null)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('الكل')
  const supabase = createClient()

  const exportReport = async (type: ReportType) => {
    setExporting(type)
    const wb = XLSX.utils.book_new()
    const today = new Date().toISOString().slice(0, 10)

    try {
      if (type === 'books') {
        let query = supabase.from('books').select('*, book_authors(authors(name))')
        if (dateFrom) query = query.gte('contract_date', dateFrom)
        if (dateTo) query = query.lte('contract_date', dateTo)
        if (categoryFilter !== 'الكل') query = query.eq('category', categoryFilter)
        const { data } = await query.order('created_at', { ascending: false })
        const rows = (data ?? []).map((b: any) => ({
          'اسم الكتاب': b.title,
          'المؤلف': b.book_authors?.map((a: any) => a.authors.name).join('، ') || '',
          'المترجم': b.translator || '',
          'التصنيف': b.category || '',
          'ISBN': b.isbn || '',
          'اذن طباعة': b.permit || '',
          'عدد النسخ المطبوعة': b.printed_copies,
          'عدد النسخ المجانية': b.free_copies,
          'مقاس الكتاب': b.size || '',
          'نوع الورق': b.paper_type || '',
          'لون الطباعة': b.print_color || '',
          'الغلاف': b.cover_type || '',
          'نسبة الأرباح %': b.profit_percent,
          'السعر (ج.م)': b.price_egp,
          'السعر (د.إ)': b.price_aed,
          'السعر (ر.س)': b.price_sar,
          'السعر ($)': b.price_usd,
          'تاريخ التعاقد': b.contract_date || '',
          'الموسم/المعرض': b.season || '',
          'تليفون الكاتب': b.author_phone || '',
        }))
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'الكتب')
      }

      if (type === 'authors') {
        const { data: authors } = await supabase.from('authors').select('*, book_authors(books(title))').order('name')
        const rows = (authors ?? []).map((a: any) => ({
          'اسم المؤلف': a.name,
          'التليفون': a.phone || '',
          'عدد الكتب': a.book_authors?.length || 0,
          'الكتب': a.book_authors?.map((ba: any) => ba.books?.title).filter(Boolean).join('، ') || '',
        }))
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'المؤلفين')
      }

      if (type === 'printing') {
        const { data } = await supabase.from('printing_jobs').select('*, books(title, book_authors(authors(name)))').order('created_at', { ascending: false })
        const rows = (data ?? []).map((j: any) => ({
          'اسم الكتاب': j.books?.title || '',
          'المؤلف': j.books?.book_authors?.map((a: any) => a.authors.name).join('، ') || '',
          'عدد النسخ': j.copies,
          'سعر النسخة من المطبعة': j.printer_price,
          'تاريخ الدخول': j.entered_at || '',
          'تاريخ الاستلام': j.received_at || '',
          'تم تسليم الكاتب': j.delivered_to_author ? 'نعم' : 'لا',
        }))
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'المطبعة')
      }

      if (type === 'warehouse') {
        const { data: books } = await supabase.from('books').select('id, title, book_authors(authors(name))').order('title')
        const { data: logs } = await supabase.from('warehouse_log').select('*').order('received_at', { ascending: false })

        // ملخص المخزون
        const summaryRows = (books ?? []).map((b: any) => {
          const bookLogs = (logs ?? []).filter((l: any) => l.book_id === b.id)
          const total = bookLogs.reduce((sum: number, l: any) => sum + l.quantity, 0)
          return {
            'اسم الكتاب': b.title,
            'المؤلف': b.book_authors?.map((a: any) => a.authors.name).join('، ') || '',
            'إجمالي النسخ': total,
            'آخر استلام': bookLogs[0]?.received_at || '',
            'حالة المخزون': total === 0 ? 'نفد' : total < 20 ? 'منخفض' : 'طبيعي',
          }
        })
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), 'ملخص المخزون')

        // تفاصيل الدفعات
        const detailRows = (logs ?? []).map((l: any) => {
          const book = (books ?? []).find((b: any) => b.id === l.book_id)
          return {
            'اسم الكتاب': book?.title || '',
            'تاريخ الاستلام': l.received_at,
            'عدد النسخ': l.quantity,
          }
        })
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detailRows), 'تفاصيل الدفعات')
      }

      if (type === 'orders') {
        let query = supabase.from('orders').select('*, order_items(quantity, unit_price, books(title))').order('order_date', { ascending: false })
        if (dateFrom) query = query.gte('order_date', dateFrom)
        if (dateTo) query = query.lte('order_date', dateTo)
        const { data } = await query
        const rows = (data ?? []).map((o: any) => ({
          'الكتب': o.order_items?.map((i: any) => `${i.books?.title} (×${i.quantity})`).join('، ') || '',
          'اسم العميل': o.customer_name,
          'رقم التليفون': o.customer_phone || '',
          'العنوان': o.customer_address || '',
          'السعر': o.price,
          'المصدر': o.source || '',
          'تاريخ الأوردر': o.order_date,
          'تاريخ الاستلام': o.received_date || '',
          'تاريخ التسليم': o.delivered_date || '',
          'الحالة': o.delivered_date ? 'تم التسليم' : 'قيد التسليم',
        }))
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'الأوردرات')
      }

      if (type === 'platforms') {
        const { data: books } = await supabase.from('books').select('id, title').order('title')
        const { data: platforms } = await supabase.from('platforms').select('id, name').order('name')
        const { data: links } = await supabase.from('book_platforms').select('*')
        const rows = (books ?? []).map((b: any) => {
          const row: Record<string, string> = { 'اسم الكتاب': b.title }
          ;(platforms ?? []).forEach((p: any) => {
            const link = (links ?? []).find((l: any) => l.book_id === b.id && l.platform_id === p.id)
            row[p.name] = link?.status || 'غير متاح'
          })
          return row
        })
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'المنصات')
      }

      const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      saveAs(blob, `إبهار-${reportTypes.find(r => r.key === type)?.label}-${today}.xlsx`)
    } catch (err) {
      console.error(err)
    }
    setExporting(null)
  }

  return (
    <SharedLayout title="التقارير" subtitle="تصدير وتحليل البيانات">
      <div className="mb-10">
        <p className="mb-1 text-[11px] font-medium tracking-[0.18em] text-[#d8573a]">تصدير البيانات</p>
        <h2 className="font-serif text-3xl font-semibold sm:text-4xl">التقارير</h2>
        <p className="mt-2 text-sm text-[#8a7969]">اختر نوع التقرير وحدد الفلاتر اللي تحتاجها، وحمّل الملف Excel جاهز.</p>
      </div>

      {/* فلاتر */}
      <section className="mb-8 rounded-3xl border border-[#e8dfd3] bg-white p-6 shadow-[0_2px_8px_-2px_rgba(90,60,40,0.06)]">
        <p className="mb-4 text-sm font-semibold text-[#2a211c]">فلاتر التصدير <span className="font-normal text-[#a3907e]">(اختياري — بدون فلتر = كل البيانات)</span></p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label">من تاريخ</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="inp" />
          </div>
          <div>
            <label className="label">إلى تاريخ</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="inp" />
          </div>
          <div>
            <label className="label">تصنيف الكتاب (تقرير الكتب فقط)</label>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="inp">
              <option>الكل</option>
              <option>رواية</option><option>شعر</option><option>تطوير ذات</option><option>أدب</option><option>أطفال</option><option>ديني</option><option>أخرى</option>
            </select>
          </div>
        </div>
      </section>

      {/* بطاقات التقارير */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {reportTypes.map(report => (
          <div key={report.key} className="group relative overflow-hidden rounded-3xl border border-[#e8dfd3] bg-white p-6 shadow-[0_2px_8px_-2px_rgba(90,60,40,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-8px_rgba(90,60,40,0.15)]">
            <div className="absolute -left-6 -top-6 size-20 rounded-full opacity-[0.06] transition group-hover:opacity-10" style={{ background: report.color }} />
            <div className="relative">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex size-11 items-center justify-center rounded-xl" style={{ background: `${report.color}15`, color: report.color }}>
                  <report.icon size={19} />
                </div>
                <FileSpreadsheet size={16} className="text-[#c4b3a1]" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-[#2a211c]">{report.label}</h3>
              <p className="mt-1 text-xs text-[#8a7969]">{report.desc}</p>
              <button
                disabled={exporting !== null}
                onClick={() => exportReport(report.key)}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition disabled:opacity-50"
                style={{ background: exporting === report.key ? '#a3907e' : report.color }}
              >
                {exporting === report.key ? (
                  'جارٍ التصدير...'
                ) : (
                  <><Download size={15} />تحميل Excel</>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </SharedLayout>
  )
}
