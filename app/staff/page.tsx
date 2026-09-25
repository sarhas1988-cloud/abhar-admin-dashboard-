'use client'

import { useEffect, useState } from 'react'
import { Ban, Check, Copy, Plus, RotateCcw, SendHorizontal, Trash2, UserPlus, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/Toast'
import { TableSkeleton, Spinner } from '@/components/Skeleton'
import { useStaffAccess } from '@/lib/useStaffAccess'
import { SharedLayout } from '@/components/SharedLayout'

type Perm = { view: boolean; edit: boolean }
type Staff = { id: string; email: string; is_admin: boolean; banned: boolean; staff_permissions: { module: string; can_view: boolean; can_edit: boolean }[] }
const modules = [
  { key: 'contracts', label: 'التعاقدات والقسم الفني' },
  { key: 'printing', label: 'المطبعة' },
  { key: 'platforms', label: 'المنصات' },
  { key: 'warehouse', label: 'المخزن' },
  { key: 'orders', label: 'الاوردرات' },
]
const emptyPermissions = Object.fromEntries(modules.map(m => [m.key, { view: false, edit: false }])) as Record<string, Perm>

export default function StaffPage() {
  const { toast } = useToast()
  const { loading: accessLoading, isAdmin } = useStaffAccess()

  const [menuOpen, setMenuOpen] = useState(false)
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<Staff | null>(null)
  const [email, setEmail] = useState('')
  const [permissions, setPermissions] = useState<Record<string, Perm>>(emptyPermissions)
  const [inviteLink, setInviteLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<Staff | null>(null)
  const [actionLoading, setActionLoading] = useState('')
  const supabase = createClient()

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('staff_profiles').select('id, email, is_admin, banned, staff_permissions(module, can_view, can_edit)').order('created_at')
    setStaff((data as any) ?? [])
    setLoading(false)
  }
  useEffect(() => { if (isAdmin) load() }, [isAdmin])

  const accessSummary = (member: Staff) => modules.filter(m => member.staff_permissions?.find(p => p.module === m.key)?.can_view).map(m => m.label)

  const openCreate = () => { setEditing(null); setEmail(''); setPermissions(emptyPermissions); setError(''); setInviteLink(''); setFormOpen(true) }
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
    if (!editing && result.inviteLink) { setInviteLink(result.inviteLink); load(); return }
    setFormOpen(false)
    load()
  }

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const toggleBan = async (member: Staff) => {
    setActionLoading(member.id)
    const res = await fetch('/api/staff', { method: 'PATCH', body: JSON.stringify({ staffId: member.id, action: member.banned ? 'unban' : 'ban' }) })
    setActionLoading('')
    if (res.ok) { load(); toast(member.banned ? 'تم إيقاف الموظف' : 'تم تفعيل الموظف', member.banned ? 'warning' : 'success') }
  }

  const resend = async (member: Staff) => {
    setActionLoading(member.id)
    const res = await fetch('/api/staff', { method: 'PUT', body: JSON.stringify({ staffId: member.id }) })
    const result = await res.json()
    setActionLoading('')
    if (res.ok && result.inviteLink) { setInviteLink(result.inviteLink); setEditing(null); setFormOpen(true) }
  }

  const confirmDeleteMember = async () => {
    if (!confirmDelete) return
    setActionLoading(confirmDelete.id)
    const res = await fetch('/api/staff', { method: 'DELETE', body: JSON.stringify({ staffId: confirmDelete.id }) })
    setActionLoading('')
    setConfirmDelete(null)
    if (res.ok) { load(); toast('تم حذف الموظف', 'warning') }
  }

  return (
    <SharedLayout title="الموظفين والصلاحيات" subtitle="التحكم في وصول الموظفين">
      {!accessLoading && !isAdmin ? <p className="rounded-2xl border border-[#e8dfd3] bg-white p-8 text-center text-sm text-[#a3907e]">هذا القسم للأدمن فقط.</p> : (
        <>
          <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-1 text-[11px] font-medium tracking-[0.18em] text-[#d8573a]">إدارة الفريق</p><h2 className="font-serif text-3xl font-semibold sm:text-4xl">فريق العمل</h2><p className="mt-2 text-sm text-[#8a7969]">أضف موظفاً بالإيميل وحدد الأقسام التي يمكنه رؤيتها وتعديلها — هتاخد لينك دعوة تبعتيه له بنفسك.</p></div><button onClick={openCreate} className="flex w-fit items-center gap-2 rounded-xl bg-[#d8573a] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(216,87,58,0.4)] transition hover:bg-[#c04a2f]"><UserPlus size={16} />إضافة موظف</button></div>
          <section className="overflow-hidden rounded-3xl border border-[#e8dfd3] bg-white shadow-[0_2px_8px_-2px_rgba(90,60,40,0.06)]">
            <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-right text-sm"><thead><tr className="border-b border-[#ede4d7] bg-[#fdf9f4] text-[11px] font-medium text-[#a3907e]"><th className="px-5 py-3.5">الإيميل</th><th className="px-5 py-3.5">الأقسام المتاحة</th><th className="px-5 py-3.5">الحالة</th><th className="px-5 py-3.5">إجراءات</th></tr></thead><tbody>{staff.filter(m => !m.is_admin).map(member => <tr key={member.id} className="border-b border-[#f0e7db] last:border-0 transition hover:bg-[#fdf9f4]"><td className="px-5 py-4 font-semibold">{member.email}</td><td className="px-5 py-4"><div className="flex flex-wrap gap-1.5">{accessSummary(member).length ? accessSummary(member).map(label => <span key={label} className="rounded-full bg-[#faf1eb] px-2.5 py-1 text-[11px] font-medium text-[#d8573a]">{label}</span>) : <span className="text-xs text-[#a3907e]">لا يوجد وصول بعد</span>}</div></td><td className="px-5 py-4">{member.banned ? <span className="rounded-full bg-[#f7dbd3] px-3 py-1 text-xs font-semibold text-[#c04a2f]">موقوف</span> : <span className="rounded-full bg-[#e8f2df] px-3 py-1 text-xs font-semibold text-[#4a7a2c]">نشط</span>}</td><td className="px-5 py-4"><div className="flex flex-wrap gap-2"><button onClick={() => openEdit(member)} className="rounded-lg border border-[#e8dfd3] px-3 py-2 text-xs font-semibold text-[#d8573a] transition hover:bg-[#faf1eb]">تعديل الصلاحيات</button><button disabled={actionLoading === member.id} onClick={() => toggleBan(member)} className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${member.banned ? 'border-[#e8dfd3] text-[#4a7a2c] hover:bg-[#e8f2df]' : 'border-[#e8dfd3] text-[#8a5a1a] hover:bg-[#fbeed6]'} disabled:opacity-50`}>{member.banned ? <><RotateCcw size={13} />تفعيل</> : <><Ban size={13} />إيقاف</>}</button><button disabled={actionLoading === member.id} onClick={() => resend(member)} className="flex items-center gap-1.5 rounded-lg border border-[#e8dfd3] px-3 py-2 text-xs font-semibold text-[#6b5d53] transition hover:bg-[#faf6f0] disabled:opacity-50"><SendHorizontal size={13} />إعادة إرسال لينك</button><button onClick={() => setConfirmDelete(member)} className="flex items-center gap-1.5 rounded-lg border border-[#e8dfd3] px-3 py-2 text-xs font-semibold text-[#c04a2f] transition hover:bg-[#f7dbd3]"><Trash2 size={13} />حذف</button></div></td></tr>)}</tbody></table>{!loading && staff.filter(m => !m.is_admin).length === 0 && <p className="p-10 text-center text-sm text-[#a3907e]">لا يوجد موظفين مضافين بعد.</p>}</div>
          </section>
        </>
      )}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#2a211c]/30 p-3 sm:p-6">
          <section className="my-3 w-full max-w-2xl rounded-2xl bg-white shadow-2xl sm:my-8">
            {inviteLink ? (
              <>
                <div className="flex items-center justify-between border-b border-[#ede4d7] p-5"><div><h2 className="font-serif text-xl font-semibold">اتضاف الموظف بنجاح</h2><p className="mt-1 text-xs text-[#a3907e]">انسخي اللينك وابعتيه للموظف بأي طريقة (واتساب، إيميل...)</p></div><button onClick={() => { setFormOpen(false); setInviteLink('') }} aria-label="إغلاق"><X /></button></div>
                <div className="flex flex-col gap-4 p-5">
                  <div className="rounded-xl border border-[#e8dfd3] bg-[#faf6f0] p-4 text-xs text-[#6b5d53] break-all">{inviteLink}</div>
                  <p className="rounded-lg bg-[#fdf6ef] px-3 py-2 text-xs text-[#8a5a1a]">اللينك ده لمرة واحدة بس ومحدود المدة — لو خلص، احذفي الموظف وضيفيه تاني عشان تطلعلك لينك جديد.</p>
                  <div className="flex justify-end gap-3 border-t border-[#ede4d7] pt-4">
                    <button onClick={copyLink} className="flex items-center gap-2 rounded-xl bg-[#d8573a] px-5 py-3 text-sm font-semibold text-white">{copied ? <><Check size={16} />اتنسخ</> : <><Copy size={16} />نسخ اللينك</>}</button>
                    <button onClick={() => { setFormOpen(false); setInviteLink('') }} className="rounded-xl border border-[#e8dfd3] px-5 py-3 text-sm font-semibold">تم</button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-[#ede4d7] p-5"><div><h2 className="font-serif text-xl font-semibold">{editing ? 'تعديل صلاحيات الموظف' : 'إضافة موظف جديد'}</h2><p className="mt-1 text-xs text-[#a3907e]">حدد الوصول لكل قسم على حدة</p></div><button onClick={() => setFormOpen(false)} aria-label="إغلاق"><X /></button></div>
                <form onSubmit={submit} className="flex flex-col gap-4 p-5">
                  <label><span className="mb-2 block text-xs font-semibold text-[#6b5d53]">إيميل الموظف</span><input required type="email" disabled={Boolean(editing)} value={email} onChange={e => setEmail(e.target.value)} placeholder="name@abhar.sa" className="w-full rounded-xl border border-[#e8dfd3] px-3 py-3 text-sm outline-none focus:border-[#d8573a] disabled:bg-[#faf6f0]" /></label>
                  <div className="overflow-hidden rounded-xl border border-[#e8dfd3]"><table className="w-full text-right text-sm"><thead><tr className="border-b border-[#ede4d7] bg-[#faf6f0] text-xs text-[#a3907e]"><th className="px-4 py-3">القسم</th><th className="px-4 py-3">مشاهدة</th><th className="px-4 py-3">تعديل</th></tr></thead><tbody>{modules.map(m => <tr key={m.key} className="border-b border-[#f0e7db] last:border-0"><td className="px-4 py-3 font-medium">{m.label}</td><td className="px-4 py-3"><input type="checkbox" checked={permissions[m.key]?.view ?? false} onChange={() => togglePerm(m.key, 'view')} className="size-4 accent-[#d8573a]" /></td><td className="px-4 py-3"><input type="checkbox" checked={permissions[m.key]?.edit ?? false} onChange={() => togglePerm(m.key, 'edit')} className="size-4 accent-[#d8573a]" /></td></tr>)}</tbody></table></div>
                  {error && <p className="rounded-lg bg-[#f7dbd3] px-3 py-2 text-xs text-[#c04a2f]">{error}</p>}
                  <div className="flex justify-end gap-3 border-t border-[#ede4d7] pt-4"><button type="button" onClick={() => setFormOpen(false)} className="rounded-xl border border-[#e8dfd3] px-5 py-3 text-sm font-semibold">إلغاء</button><button disabled={saving} type="submit" className="rounded-xl bg-[#d8573a] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{saving ? <><Spinner size={14} className="text-white" />جارٍ...</> : 'حفظ'}</button></div>
                </form>
              </>
            )}
          </section>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2a211c]/30 p-3 sm:p-6">
          <section className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold">حذف {confirmDelete.email}؟</h2>
            <p className="mt-2 text-sm text-[#6b5d53]">هيتشال حسابه وصلاحياته نهائيًا ومش هيقدر يدخل تاني. الإجراء ده مايترجعش.</p>
            <div className="mt-5 flex justify-end gap-3"><button onClick={() => setConfirmDelete(null)} className="rounded-xl border border-[#e8dfd3] px-4 py-2.5 text-sm font-semibold">إلغاء</button><button disabled={Boolean(actionLoading)} onClick={confirmDeleteMember} className="rounded-xl bg-[#c04a2f] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">حذف نهائي</button></div>
          </section>
        </div>
      )}
    </SharedLayout>
  )
}