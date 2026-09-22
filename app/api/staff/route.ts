import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const MODULES = ['contracts', 'printing', 'platforms', 'warehouse', 'orders'] as const

export async function POST(request: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'غير مسجّل دخول' }, { status: 401 })

  const { data: profile } = await supabase.from('staff_profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'الأدمن فقط يقدر يضيف موظفين' }, { status: 403 })

  const body = await request.json()
  const { email, permissions } = body as { email: string; permissions: Record<string, { view: boolean; edit: boolean }> }
  if (!email) return NextResponse.json({ error: 'الإيميل مطلوب' }, { status: 400 })

  const admin = createAdminClient()
  const redirectTo = `${new URL(request.url).origin}/auth/callback`
  const { data: linkData, error: inviteError } = await admin.auth.admin.generateLink({
    type: 'invite', email, options: { redirectTo },
  })
  if (inviteError || !linkData?.user) return NextResponse.json({ error: inviteError?.message ?? 'فشلت الدعوة' }, { status: 400 })

  const newUserId = linkData.user.id
  const inviteLink = linkData.properties.action_link

  const { error: profileError } = await admin.from('staff_profiles').insert({ id: newUserId, email, is_admin: false })
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 })

  const permissionRows = MODULES.map(moduleKey => ({
    staff_id: newUserId,
    module: moduleKey,
    can_view: permissions?.[moduleKey]?.view ?? false,
    can_edit: permissions?.[moduleKey]?.edit ?? false,
  }))
  const { error: permError } = await admin.from('staff_permissions').insert(permissionRows)
  if (permError) return NextResponse.json({ error: permError.message }, { status: 400 })

  return NextResponse.json({ success: true, userId: newUserId, inviteLink })
}

export async function PATCH(request: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'غير مسجّل دخول' }, { status: 401 })

  const { data: profile } = await supabase.from('staff_profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'الأدمن فقط يقدر يعدّل الصلاحيات' }, { status: 403 })

  const body = await request.json()
  const { staffId, permissions } = body as { staffId: string; permissions: Record<string, { view: boolean; edit: boolean }> }
  if (!staffId) return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 })

  const admin = createAdminClient()
  for (const moduleKey of MODULES) {
    await admin.from('staff_permissions').update({
      can_view: permissions?.[moduleKey]?.view ?? false,
      can_edit: permissions?.[moduleKey]?.edit ?? false,
    }).eq('staff_id', staffId).eq('module', moduleKey)
  }

  return NextResponse.json({ success: true })
}
