import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const MODULES = ['contracts', 'printing', 'platforms', 'warehouse', 'orders'] as const

// GET: نتأكد إن التوكن صالح ونرجّع الإيميل لعرضه
export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdminClient()
  const { data: invite } = await admin.from('staff_invitations').select('email, used_at, expires_at').eq('token', token).maybeSingle()
  if (!invite) return NextResponse.json({ error: 'اللينك غير صالح' }, { status: 404 })
  if (invite.used_at) return NextResponse.json({ error: 'اللينك تم استخدامه بالفعل' }, { status: 400 })
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) return NextResponse.json({ error: 'اللينك انتهت صلاحيته' }, { status: 400 })
  return NextResponse.json({ email: invite.email })
}

// POST: يتم تفعيل الحساب بالباسورد
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const body = await request.json()
  const { password } = body as { password: string }
  if (!password || password.length < 8) return NextResponse.json({ error: 'كلمة المرور لازم تكون 8 أحرف على الأقل' }, { status: 400 })

  const admin = createAdminClient()
  const { data: invite } = await admin.from('staff_invitations').select('*').eq('token', token).maybeSingle()
  if (!invite) return NextResponse.json({ error: 'اللينك غير صالح' }, { status: 404 })
  if (invite.used_at) return NextResponse.json({ error: 'اللينك تم استخدامه بالفعل' }, { status: 400 })
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) return NextResponse.json({ error: 'اللينك انتهت صلاحيته' }, { status: 400 })

  // لو الحساب لسه ما اتعملش في auth (دعوة جديدة) → نعمله
  let userId: string | null = null
  const { data: existingProfile } = await admin.from('staff_profiles').select('id').eq('email', invite.email).maybeSingle()

  if (existingProfile) {
    // reset password لموظف موجود
    userId = existingProfile.id
    const { error: updateError } = await admin.auth.admin.updateUserById(userId, { password })
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 })
  } else {
    // موظف جديد
    const { data: created, error: createError } = await admin.auth.admin.createUser({ email: invite.email, password, email_confirm: true })
    if (createError || !created?.user) return NextResponse.json({ error: createError?.message ?? 'فشل إنشاء الحساب' }, { status: 400 })
    userId = created.user.id

    const { error: profileError } = await admin.from('staff_profiles').insert({ id: userId, email: invite.email, is_admin: false, banned: false })
    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 })

    const permissionRows = MODULES.map(moduleKey => ({
      staff_id: userId!, module: moduleKey,
      can_view: invite.permissions?.[moduleKey]?.view ?? false,
      can_edit: invite.permissions?.[moduleKey]?.edit ?? false,
    }))
    await admin.from('staff_permissions').insert(permissionRows)
  }

  // نعلّم التوكن كمستخدم
  await admin.from('staff_invitations').update({ used_at: new Date().toISOString() }).eq('token', token)

  return NextResponse.json({ success: true, email: invite.email })
}
