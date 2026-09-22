'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, ClipboardList, Factory, Grid2X2, LayoutDashboard, LogOut, Menu, ShieldCheck, ShoppingCart, UserPlus, Warehouse, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useStaffAccess } from '@/lib/useStaffAccess'

type Perm = { view: boolean; edit: boolean }
type Staff = { id: string; email: string; is_admin: boolean; staff_permissions: { module: string; can_view: boolean; can_edit: boolean }[] }
const modules = [
  { key: 'contracts', label: 'التعاقدات والقسم الفني' },
  { key: 'printing', label: 'المطبعة' },
  { key: 'platforms', label: 'المنصات' },
  { key: 'warehouse', label: 'المخزن' },
  { key: 'orders', label: 'الاوردرات' },
]
const emptyPermissions = Object.fromEntries(modules.map(m => [m.key, { view: false, edit: false }])) as Record<string, Perm>

export default function StaffPage() {
  const pathname = usePathname()
  const { loading: accessLoading, isAdmin, canView, signOut } = useStaffAccess()
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
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<Staff | null>(null)
  const [email, setEmail] = useState('')
  const [permissions, setPermissions] = useState<Record<string, Perm>>(emptyPermissions)
  const supabase = createClient()

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('staff_profiles').select('id, email, is_admin, staff_permissions(module, can_view, can_edit)').order('created_at')
    setStaff((data as any) ?? [])
    setLoading(false)
  }
  useEffect(() => { if (isAdmin) load() }, [isAdmin])

  const accessSummary = (member: Staff) => modules.filter(m => member.staff_permissions?.find(p => p.module === m.key)?.can_view).map(m => m.label)

  const openCreate = () => { setEditing(null); setEmail(''); setPermissions(emptyPermissions); setError(''); setFormOpen(true) }
  const openEdit = (member: Staff) => {
    setEditing(member); setEmail(member.email); setError('')
    const map = { ...emptyPermissions }
    member.staff_permissions?.forEach(p => { map[p.module] = { view: p.can_view, edit: p.can_edit } })
    setPermissions(map)
    setFormOpen(true)
  }

  const togglePerm = (moduleKey: string, field: 'view' | 'edit') => setPermissions(current => {
    const next = { ...current[moduleKey], [field]: !current[moduleKey][field] }
    if (field === 'edit' && next.edit) next.view = true
    if (field === 'view' && !next.view) next.edit = false
    return { ...current, [moduleKey]: next }
  })

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    const res = editing
      ? await fetch('/api/staff', { method: 'PATCH', body: JSON.stringify({ staffId: editing.id, permissions }) })
      : await fetch('/api/staff', { method: 'POST', body: JSON.stringify({ email, permissions }) })
    const result = await res.json()
    setSaving(false)
    if (!res.ok) { setError(result.error ?? 'حصل خطأ'); return }
    setFormOpen(false)
    load()
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#f7f8fa] text-[#1a2540]">
      <aside className={`fixed inset-y-0 right-0 z-40 flex w-[252px] flex-col border-l border-[#e8ebf0] bg-white px-5 py-6 transition-transform lg:translate-x-0 ${menuOpen ? 'translate-x-0' : 'translate-x-[110%]'}`}>
        <div className="flex items-center justify-between pb-8"><img src="/abhar-logo.svg" alt="إبهار للنشر والتوزيع" className="h-[98px] w-[112px] object-contain" /><button onClick={() => setMenuOpen(false)} className="lg:hidden" aria-label="إغلاق القائمة"><X /></button></div>
        <p className="mb-3 px-3 text-[11px] font-semibold tracking-[0.16em] text-[#9ba4b2]">القائمة الرئيسية</p>
        <nav className="flex flex-col gap-1.5">{navItems.map(({ label, href, icon: Icon }) => <Link key={href} href={href} onClick={() => setMenuOpen(false)} className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium ${pathname === href ? 'bg-[#fff0ed] text-[#d8573a]' : 'text-[#69758a] hover:bg-[#f7f8fa]'}`}><Icon size={19} /><span>{label}</span></Link>)}</nav>
        <div className="mt-auto border-t border-[#edf0f3] pt-4"><button onClick={signOut} className="flex items-center gap-3 px-3.5 py-3 text-sm text-[#69758a] hover:text-[#c84c3b]"><LogOut size={19} />تسجيل الخروج</button></div>
      </aside>
      {menuOpen && <button className="fixed inset-0 z-30 bg-[#1a2540]/20 lg:hidden" onClick={() => setMenuOpen(false)} aria-label="إغلاق القائمة" />}

      <section className="lg:mr-[252px]">
        <header className="flex h-[84px] items-center justify-between border-b border-[#e8ebf0] bg-white px-5 sm:px-8"><div className="flex items-center gap-3"><button onClick={() => setMenuOpen(true)} className="lg:hidden" aria-label="فتح القائمة"><Menu /></button><div><p className="text-xs text-[#8d97a7]">التحكم في وصول الموظفين — للأدمن فقط</p><h1 className="mt-1 text-xl font-bold sm:text-2xl">الموظفين والصلاحيات</h1></div></div><Bell size={19} className="text-[#69758a]" /></header>
        <div className="mx-auto max-w-[1400px] p-5 pb-24 sm:p-8 lg:pb-8">
          {!accessLoading && !isAdmin ? <p className="rounded-xl border border-[#e8ebf0] bg-white p-6 text-center text-sm text-[#9ba4b2]">هذا القسم للأدمن فقط.</p> : (
            <>
              <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="mb-2 flex items-center gap-2 text-xs font-medium text-[#d8573a]"><span className="size-2 rounded-full bg-[#d8573a]" />صلاحيات مخصصة لكل قسم</div><h2 className="text-2xl font-bold sm:text-3xl">فريق العمل</h2><p className="mt-2 text-sm text-[#8d97a7]">أضف موظفاً بالإيميل وحدد الأقسام التي يمكنه رؤيتها وتعديلها — هيوصله إيميل دعوة لتفعيل حسابه.</p></div><button onClick={openCreate} className="flex w-fit items-center gap-2 rounded-xl bg-[#d8573a] px-4 py-3 text-sm font-semibold text-white"><UserPlus size={18} />إضافة موظف</button></div>
              <section className="rounded-2xl border border-[#e8ebf0] bg-white">
                <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-right text-sm"><thead><tr className="border-b border-[#eef0f3] text-xs text-[#9ba4b2]"><th className="px-5 py-4">الإيميل</th><th className="px-5 py-4">الأقسام المتاحة</th><th className="px-5 py-4">إجراء</th></tr></thead><tbody>{staff.filter(m => !m.is_admin).map(member => <tr key={member.id} className="border-b border-[#f1f3f5] last:border-0"><td className="px-5 py-4 font-semibold">{member.email}</td><td className="px-5 py-4"><div className="flex flex-wrap gap-1.5">{accessSummary(member).length ? accessSummary(member).map(label => <span key={label} className="rounded-full bg-[#fff0ed] px-2.5 py-1 text-[11px] font-medium text-[#d8573a]">{label}</span>) : <span className="text-xs text-[#9ba4b2]">لا يوجد وصول بعد</span>}</div></td><td className="px-5 py-4"><button onClick={() => openEdit(member)} className="rounded-lg border border-[#e8ebf0] px-3 py-2 text-xs font-semibold text-[#d8573a]">تعديل الصلاحيات</button></td></tr>)}</tbody></table>{!loading && staff.filter(m => !m.is_admin).length === 0 && <p className="p-8 text-center text-sm text-[#9ba4b2]">لا يوجد موظفين مضافين بعد.</p>}</div>
              </section>
            </>
          )}
        </div>
      </section>
      <nav className="fixed inset-x-0 bottom-0 z-20 flex gap-1 overflow-x-auto border-t border-[#e8ebf0] bg-white px-2 py-2 lg:hidden">{navItems.map(({ label, href, icon: Icon }) => <Link key={href} href={href} className={`flex min-w-[72px] flex-1 flex-col items-center gap-1 rounded-lg px-1 py-1 text-[10px] ${pathname === href ? 'text-[#d8573a]' : 'text-[#8d97a7]'}`}><Icon size={18} /><span className="truncate">{label}</span></Link>)}</nav>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#1a2540]/30 p-3 sm:p-6">
          <section className="my-3 w-full max-w-2xl rounded-2xl bg-white shadow-2xl sm:my-8">
            <div className="flex items-center justify-between border-b border-[#eef0f3] p-5"><div><h2 className="text-xl font-bold">{editing ? 'تعديل صلاحيات الموظف' : 'إضافة موظف جديد'}</h2><p className="mt-1 text-xs text-[#9ba4b2]">حدد الوصول لكل قسم على حدة</p></div><button onClick={() => setFormOpen(false)} aria-label="إغلاق"><X /></button></div>
            <form onSubmit={submit} className="flex flex-col gap-4 p-5">
              <label><span className="mb-2 block text-xs font-semibold text-[#69758a]">إيميل الموظف</span><input required type="email" disabled={Boolean(editing)} value={email} onChange={e => setEmail(e.target.value)} placeholder="name@abhar.sa" className="w-full rounded-xl border border-[#e8ebf0] px-3 py-3 text-sm outline-none focus:border-[#d8573a] disabled:bg-[#f7f8fa]" /></label>
              <div className="overflow-hidden rounded-xl border border-[#e8ebf0]"><table className="w-full text-right text-sm"><thead><tr className="border-b border-[#eef0f3] bg-[#f7f8fa] text-xs text-[#9ba4b2]"><th className="px-4 py-3">القسم</th><th className="px-4 py-3">مشاهدة</th><th className="px-4 py-3">تعديل</th></tr></thead><tbody>{modules.map(m => <tr key={m.key} className="border-b border-[#f1f3f5] last:border-0"><td className="px-4 py-3 font-medium">{m.label}</td><td className="px-4 py-3"><input type="checkbox" checked={permissions[m.key]?.view ?? false} onChange={() => togglePerm(m.key, 'view')} className="size-4 accent-[#d8573a]" /></td><td className="px-4 py-3"><input type="checkbox" checked={permissions[m.key]?.edit ?? false} onChange={() => togglePerm(m.key, 'edit')} className="size-4 accent-[#d8573a]" /></td></tr>)}</tbody></table></div>
              {error && <p className="rounded-lg bg-[#fce8e6] px-3 py-2 text-xs text-[#c84c3b]">{error}</p>}
              <div className="flex justify-end gap-3 border-t border-[#eef0f3] pt-4"><button type="button" onClick={() => setFormOpen(false)} className="rounded-xl border border-[#e8ebf0] px-5 py-3 text-sm font-semibold">إلغاء</button><button disabled={saving} type="submit" className="rounded-xl bg-[#d8573a] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'جارٍ الحفظ...' : 'حفظ'}</button></div>
            </form>
          </section>
        </div>
      )}
    </main>
  )
}
