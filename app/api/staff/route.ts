import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const MODULES = ['contracts', 'printing', 'platforms', 'warehouse', 'orders'] as const
const BAN_DURATION = '876000h'

async function requireAdmin() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'غير مسجّل دخول' }, { status: 401 }) }
  const { data: profile } = await supabase.from('staff_profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return { error: NextResponse.json({ error: 'الأدمن فقط يقدر يعمل كده' }, { status: 403 }) }
  return { user }
}

function newToken() {
  return randomBytes(32).toString('base64url')
}

// إضافة موظف: نولّد توكن دعوة ونرجّع لينك بتاعنا
export async function POST(request: Request) {
  const check = await requireAdmin()
  if (check.error) return check.error

  const body = await request.json()
  const { email, permissions } = body as { email: string; permissions: Record<string, { view: boolean; edit: boolean }> }
  if (!email) return NextResponse.json({ error: 'الإيميل مطلوب' }, { status: 400 })

  const admin = createAdminClient()

  // نمنع تكرار الإيميل (سواء في auth.users أو في دعوات فعّالة)
  const { data: existingProfile } = await admin.from('staff_profiles').select('id').eq('email', email).maybeSingle()
  if (existingProfile) return NextResponse.json({ error: 'الإيميل ده مسجّل قبل كده' }, { status: 400 })

  const token = newToken()
  const { error: inviteError } = await admin.from('staff_invitations').insert({
    token, email, permissions, created_by: check.user.id,
  })
  if (inviteError) return NextResponse.json({ error: inviteError.message }, { status: 400 })

  const inviteLink = `${new URL(request.url).origin}/invite/${token}`
  return NextResponse.json({ success: true, inviteLink })
}

// تعديل صلاحيات / إيقاف / تفعيل موظف موجود
export async function PATCH(request: Request) {
  const check = await requireAdmin()
  if (check.error) return check.error

  const body = await request.json()
  const { staffId, action, permissions } = body as { staffId: string; action: 'permissions' | 'ban' | 'unban'; permissions?: Record<string, { view: boolean; edit: boolean }> }
  if (!staffId) return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 })

  const admin = createAdminClient()

  if (action === 'ban' || action === 'unban') {
    const { error: authError } = await admin.auth.admin.updateUserById(staffId, { ban_duration: action === 'ban' ? BAN_DURATION : 'none' })
    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })
    const { error: profileError } = await admin.from('staff_profiles').update({ banned: action === 'ban' }).eq('id', staffId)
    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 })
    return NextResponse.json({ success: true })
  }

  for (const moduleKey of MODULES) {
    await admin.from('staff_permissions').update({
      can_view: permissions?.[moduleKey]?.view ?? false, can_edit: permissions?.[moduleKey]?.edit ?? false,
    }).eq('staff_id', staffId).eq('module', moduleKey)
  }
  return NextResponse.json({ success: true })
}

// إعادة إرسال لينك دعوة (لو الأدمن ضاع منه اللينك القديم)
export async function PUT(request: Request) {
  const check = await requireAdmin()
  if (check.error) return check.error

  const body = await request.json()
  const { email, staffId } = body as { email?: string; staffId?: string }
  const admin = createAdminClient()

  // لو الموظف مضاف في auth بالفعل → توليد لينك تغيير كلمة مرور بتاعنا
  if (staffId) {
    const { data: profile } = await admin.from('staff_profiles').select('email').eq('id', staffId).maybeSingle()
    if (!profile) return NextResponse.json({ error: 'الموظف مش موجود' }, { status: 404 })
    // نمسح أي دعوة قديمة لنفس الإيميل ونصدر توكن reset جديد
    await admin.from('staff_invitations').delete().eq('email', profile.email)
    // نستخدم نفس جدول الدعوات، لكن نعلّم إنها reset مش دعوة أولى — الصلاحيات الحالية بتاعتها بتفضل زي ما هي
    const { data: perms } = await admin.from('staff_permissions').select('module, can_view, can_edit').eq('staff_id', staffId)
    const permsMap: Record<string, { view: boolean; edit: boolean }> = {}
    perms?.forEach(p => { permsMap[p.module] = { view: p.can_view, edit: p.can_edit } })
    const token = newToken()
    await admin.from('staff_invitations').insert({ token, email: profile.email, permissions: permsMap, created_by: check.user.id })
    return NextResponse.json({ success: true, inviteLink: `${new URL(request.url).origin}/invite/${token}` })
  }

  // لو الموظف مضاف كدعوة بس ولسه ما فعّلش → نعيد اللينك القديم أو نصدر جديد
  if (email) {
    const { data: existing } = await admin.from('staff_invitations').select('token').eq('email', email).is('used_at', null).maybeSingle()
    if (existing) return NextResponse.json({ success: true, inviteLink: `${new URL(request.url).origin}/invite/${existing.token}` })
  }

  return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 })
}

export async function DELETE(request: Request) {
  const check = await requireAdmin()
  if (check.error) return check.error

  const body = await request.json()
  const { staffId, email } = body as { staffId?: string; email?: string }
  const admin = createAdminClient()

  if (staffId) {
    const { data: profile } = await admin.from('staff_profiles').select('email').eq('id', staffId).maybeSingle()
    const { error: authError } = await admin.auth.admin.deleteUser(staffId)
    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })
    await admin.from('staff_profiles').delete().eq('id', staffId)
    if (profile?.email) await admin.from('staff_invitations').delete().eq('email', profile.email)
    return NextResponse.json({ success: true })
  }

  if (email) {
    await admin.from('staff_invitations').delete().eq('email', email)
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 })
}
