import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const supabase = await createClient()

  // نعمل تسجيل خروج للجلسة الحالية (لو الأدمن فتح اللينك مثلاً) قبل ما نفتح جلسة الموظف
  await supabase.auth.signOut()

  if (code) {
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(`${origin}/set-password`)
}
