import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: book } = await admin
    .from('books')
    .select('id, title, isbn, category, brief, size, paper_type, print_color, cover_type, price_egp, price_aed, price_sar, price_usd, cover_image_url, contract_date, season, book_authors(authors(name))')
    .eq('id', id)
    .maybeSingle()

  if (!book) return NextResponse.json({ error: 'الكتاب غير موجود' }, { status: 404 })

  const { data: platforms } = await admin
    .from('book_platforms')
    .select('status, platforms(name)')
    .eq('book_id', id)
    .eq('status', 'متاح')

  const { data: settings } = await admin
    .from('app_settings')
    .select('value')
    .eq('key', 'company')
    .maybeSingle()

  return NextResponse.json({
    book,
    platforms: (platforms ?? []).map((p: any) => p.platforms?.name).filter(Boolean),
    company: settings?.value ?? { name: 'إبهار للتوزيع والنشر' },
  })
}
