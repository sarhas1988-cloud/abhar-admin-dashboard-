'use client'

import { useEffect, useState } from 'react'
import { Building2, Check, DollarSign, List, Plus, Save, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/Toast'
import { TableSkeleton, Spinner } from '@/components/Skeleton'
import { useStaffAccess } from '@/lib/useStaffAccess'
import { SharedLayout } from '@/components/SharedLayout'

export default function SettingsPage() {
  const { toast } = useToast()
  const { isAdmin } = useStaffAccess()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState('')
  const [saved, setSaved] = useState('')
  const [company, setCompany] = useState({ name: '', phone: '', email: '', address: '' })
  const [rates, setRates] = useState({ egp_to_aed: '', egp_to_sar: '', egp_to_usd: '', last_note: '' })
  const [categories, setCategories] = useState<string[]>([])
  const [paperTypes, setPaperTypes] = useState<string[]>([])
  const [coverTypes, setCoverTypes] = useState<string[]>([])
  const [newItem, setNewItem] = useState({ categories: '', paper_types: '', cover_types: '' })

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('app_settings').select('*')
      data?.forEach((row: any) => {
        if (row.key === 'company') setCompany(row.value)
        if (row.key === 'exchange_rates') setRates({ egp_to_aed: String(row.value.egp_to_aed || ''), egp_to_sar: String(row.value.egp_to_sar || ''), egp_to_usd: String(row.value.egp_to_usd || ''), last_note: row.value.last_note || '' })
        if (row.key === 'categories') setCategories(row.value)
        if (row.key === 'paper_types') setPaperTypes(row.value)
        if (row.key === 'cover_types') setCoverTypes(row.value)
      })
      setLoading(false)
    })()
  }, [])

  const saveSection = async (key: string, value: any) => {
    setSaving(key)
    // update, and create the row if it doesn't exist yet (otherwise the save silently does nothing)
    const updatedAt = new Date().toISOString()
    const { data: updated, error: updateError } = await supabase.from('app_settings').update({ value, updated_at: updatedAt }).eq('key', key).select('key')
    let error = updateError
    if (!error && (!updated || updated.length === 0)) error = (await supabase.from('app_settings').insert({ key, value, updated_at: updatedAt })).error
    setSaving('')
    if (error) { toast('حصل خطأ في الحفظ', 'error'); return }
    setSaved(key); setTimeout(() => setSaved(''), 2000); toast('تم حفظ الإعدادات')
  }
  const addToList = (listKey: 'categories'|'paper_types'|'cover_types', setter: (v: string[]) => void, current: string[]) => {
    const val = newItem[listKey].trim(); if (!val || current.includes(val)) return
    const updated = [...current, val]; setter(updated); setNewItem(p => ({ ...p, [listKey]: '' })); saveSection(listKey, updated)
  }
  const removeFromList = (listKey: 'categories'|'paper_types'|'cover_types', setter: (v: string[]) => void, current: string[], item: string) => {
    const updated = current.filter(i => i !== item); setter(updated); saveSection(listKey, updated)
  }

  return (
    <SharedLayout title="الإعدادات" subtitle="إعدادات النظام">
      {!isAdmin ? <p className="rounded-2xl border border-[#e8dfd3] bg-white p-8 text-center text-sm text-[#a3907e]">هذا القسم للأدمن فقط.</p> : loading ? <p className="py-10 text-center text-sm text-[#a3907e]">جارٍ التحميل...</p> : (
        <div className="space-y-6">
          <SectionCard icon={Building2} title="بيانات الشركة" desc="اسم الدار ومعلومات الاتصال">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="label">اسم الدار</label><input value={company.name} onChange={e => setCompany(c => ({...c, name: e.target.value}))} className="inp" /></div>
              <div><label className="label">التليفون</label><input value={company.phone} onChange={e => setCompany(c => ({...c, phone: e.target.value}))} className="inp" /></div>
              <div><label className="label">البريد الإلكتروني</label><input value={company.email} onChange={e => setCompany(c => ({...c, email: e.target.value}))} className="inp" /></div>
              <div><label className="label">العنوان</label><input value={company.address} onChange={e => setCompany(c => ({...c, address: e.target.value}))} className="inp" /></div>
            </div>
            <div className="mt-4 flex justify-end"><SaveButton saving={saving === 'company'} saved={saved === 'company'} onClick={() => saveSection('company', company)} /></div>
          </SectionCard>
          <SectionCard icon={DollarSign} title="أسعار الصرف" desc="أدخل سعر التحويل يدويًا — يُستخدم كمرجع في التقارير">
            <div className="grid gap-4 sm:grid-cols-3">
              <div><label className="label">1 جنيه = كام درهم</label><input type="number" step="0.001" value={rates.egp_to_aed} onChange={e => setRates(r => ({...r, egp_to_aed: e.target.value}))} className="inp" placeholder="0.13" /></div>
              <div><label className="label">1 جنيه = كام ريال</label><input type="number" step="0.001" value={rates.egp_to_sar} onChange={e => setRates(r => ({...r, egp_to_sar: e.target.value}))} className="inp" placeholder="0.076" /></div>
              <div><label className="label">1 جنيه = كام دولار</label><input type="number" step="0.0001" value={rates.egp_to_usd} onChange={e => setRates(r => ({...r, egp_to_usd: e.target.value}))} className="inp" placeholder="0.02" /></div>
            </div>
            <div className="mt-3"><label className="label">ملاحظة</label><input value={rates.last_note} onChange={e => setRates(r => ({...r, last_note: e.target.value}))} className="inp" placeholder="مثال: تم التحديث 23 سبتمبر" /></div>
            <div className="mt-4 flex justify-end"><SaveButton saving={saving === 'exchange_rates'} saved={saved === 'exchange_rates'} onClick={() => saveSection('exchange_rates', { egp_to_aed: Number(rates.egp_to_aed)||0, egp_to_sar: Number(rates.egp_to_sar)||0, egp_to_usd: Number(rates.egp_to_usd)||0, last_note: rates.last_note })} /></div>
          </SectionCard>
          <SectionCard icon={List} title="خيارات النظام" desc="تصنيفات الكتب وأنواع الورق والغلاف — أضف أو احذف في أي وقت">
            <TagList label="تصنيفات الكتب" items={categories} newVal={newItem.categories} onNew={v => setNewItem(p => ({...p, categories: v}))} onAdd={() => addToList('categories', setCategories, categories)} onRemove={i => removeFromList('categories', setCategories, categories, i)} />
            <TagList label="أنواع الورق" items={paperTypes} newVal={newItem.paper_types} onNew={v => setNewItem(p => ({...p, paper_types: v}))} onAdd={() => addToList('paper_types', setPaperTypes, paperTypes)} onRemove={i => removeFromList('paper_types', setPaperTypes, paperTypes, i)} />
            <TagList label="أنواع الغلاف" items={coverTypes} newVal={newItem.cover_types} onNew={v => setNewItem(p => ({...p, cover_types: v}))} onAdd={() => addToList('cover_types', setCoverTypes, coverTypes)} onRemove={i => removeFromList('cover_types', setCoverTypes, coverTypes, i)} />
          </SectionCard>
        </div>
      )}
    </SharedLayout>
  )
}

function SectionCard({ icon: Icon, title, desc, children }: any) {
  return <section className="rounded-3xl border border-[#e8dfd3] bg-white p-6 shadow-[0_2px_8px_-2px_rgba(90,60,40,0.06)] sm:p-8"><div className="mb-5 flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-[#faf1eb] text-[#d8573a]"><Icon size={18} /></div><div><h3 className="font-serif text-lg font-semibold">{title}</h3><p className="text-xs text-[#a3907e]">{desc}</p></div></div>{children}</section>
}
function SaveButton({ saving, saved, onClick }: any) {
  return <button disabled={saving} onClick={onClick} className="flex items-center gap-2 rounded-xl bg-[#d8573a] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_16px_-4px_rgba(216,87,58,0.4)] transition hover:bg-[#c04a2f] disabled:opacity-60">{saved ? <><Check size={15} />تم الحفظ</> : saving ? <><Spinner size={14} className="text-white" />جارٍ...</> : <><Save size={15} />حفظ</>}</button>
}
function TagList({ label, items, newVal, onNew, onAdd, onRemove }: { label: string; items: string[]; newVal: string; onNew: (v: string) => void; onAdd: () => void; onRemove: (item: string) => void }) {
  return <div className="mt-5 border-t border-[#ede4d7] pt-5 first:mt-0 first:border-0 first:pt-0"><p className="mb-3 text-sm font-semibold text-[#2a211c]">{label}</p><div className="flex flex-wrap gap-2">{items.map((i: string) => <span key={i} className="flex items-center gap-1.5 rounded-full bg-[#fdf9f4] px-3 py-1.5 text-xs font-medium text-[#6b5d53]">{i}<button onClick={() => onRemove(i)} className="text-[#c4b3a1] hover:text-[#c04a2f]"><X size={12} /></button></span>)}</div><div className="mt-3 flex gap-2"><input value={newVal} onChange={(e: any) => onNew(e.target.value)} onKeyDown={(e: any) => e.key === 'Enter' && (e.preventDefault(), onAdd())} placeholder="أضف جديد" className="inp max-w-xs" /><button onClick={onAdd} className="flex items-center gap-1.5 rounded-xl bg-[#faf1eb] px-3 py-2.5 text-xs font-semibold text-[#d8573a]"><Plus size={14} />إضافة</button></div></div>
}
