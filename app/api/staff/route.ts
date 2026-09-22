import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const MODULES = ['contracts', 'printing', 'platforms', 'warehouse', 'orders'] as const
const BAN_DURATION = '876000h' // ~100 سنة، أقرب حاجة لإيقاف دائم قابل للتراجع

async function requireAdmin() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'غير مسجّل دخول' }, { status: 401 }) }
  const { data: profile } = await supabase.from('staff_profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return { error: NextResponse.json({ error: 'الأدمن فقط يقدر يعمل كده' }, { status: 403 }) }
  return { user }
}

export async function POST(request: Request) {
  const check = await requireAdmin()
  if (check.error) return check.error

  const body = await request.json()
  const { email, permissions } = body as { email: string; permissions: Record<string, { view: boolean; edit: boolean }> }
  if (!email) return NextResponse.json({ error: 'الإيميل مطلوب' }, { status: 400 })

  const admin = createAdminClient()
  const redirectTo = `${new URL(request.url).origin}/auth/callback`
  const { data: linkData, error: inviteError } = await admin.auth.admin.generateLink({ type: 'invite', email, options: { redirectTo } })
  if (inviteError || !linkData?.user) return NextResponse.json({ error: inviteError?.message ?? 'فشلت الدعوة' }, { status: 400 })

  const newUserId = linkData.user.id
  const inviteLink = linkData.properties.action_link

  const { error: profileError } = await admin.from('staff_profiles').insert({ id: newUserId, email, is_admin: false, banned: false })
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 })

  const permissionRows = MODULES.map(moduleKey => ({
    staff_id: newUserId, module: moduleKey,
    can_view: permissions?.[moduleKey]?.view ?? false, can_edit: permissions?.[moduleKey]?.edit ?? false,
  }))
  const { error: permError } = await admin.from('staff_permissions').insert(permissionRows)
  if (permError) return NextResponse.json({ error: permError.message }, { status: 400 })

  return NextResponse.json({ success: true, userId: newUserId, inviteLink })
}

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

  // action === 'permissions' (default)
  for (const moduleKey of MODULES) {
    await admin.from('staff_permissions').update({
      can_view: permissions?.[moduleKey]?.view ?? false, can_edit: permissions?.[moduleKey]?.edit ?? false,
    }).eq('staff_id', staffId).eq('module', moduleKey)
  }
  return NextResponse.json({ success: true })
}

export async function PUT(request: Request) {
  // إعادة إرسال لينك الدعوة (لو انتهت صلاحية اللينك القديم)
  const check = await requireAdmin()
  if (check.error) return check.error

  const body = await request.json()
  const { email } = body as { email: string }
  if (!email) return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 })

  const admin = createAdminClient()
  const redirectTo = `${new URL(request.url).origin}/auth/callback`
  const { data: linkData, error } = await admin.auth.admin.generateLink({ type: 'invite', email, options: { redirectTo } })
  if (error || !linkData) return NextResponse.json({ error: error?.message ?? 'فشلت العملية' }, { status: 400 })

  return NextResponse.json({ success: true, inviteLink: linkData.properties.action_link })
}

export async function DELETE(request: Request) {
  const check = await requireAdmin()
  if (check.error) return check.error

  const body = await request.json()
  const { staffId } = body as { staffId: string }
  if (!staffId) return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 })

  const admin = createAdminClient()
  const { error: authError } = await admin.auth.admin.deleteUser(staffId)
  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })
  // staff_permissions بتتمسح تلقائي (on delete cascade) لما staff_profiles تتمسح
  await admin.from('staff_profiles').delete().eq('id', staffId)

  return NextResponse.json({ success: true })
}
