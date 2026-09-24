'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { BookOpen, Globe, Tag, FileText, Ruler, Palette, DollarSign } from 'lucide-react'

type BookData = {
  id: string; title: string; isbn: string; category: string; brief: string
  size: string; paper_type: string; print_color: string; cover_type: string
  price_egp: number; price_aed: number; price_sar: number; price_usd: number
  cover_image_url: string | null; contract_date: string; season: string
  book_authors: { authors: { name: string } }[]
}
type Company = { name: string; phone: string; email: string; address: string }

export default function PublicBookPage() {
  const params = useParams<{ id: string }>()
  const [book, setBook] = useState<BookData | null>(null)
  const [platforms, setPlatforms] = useState<string[]>([])
  const [company, setCompany] = useState<Company>({ name: 'إبهار للتوزيع والنشر', phone: '', email: '', address: '' })
  const [status, setStatus] = useState<'loading' | 'found' | 'notfound'>('loading')

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/public-book/${params.id}`)
      if (!res.ok) { setStatus('notfound'); return }
      const data = await res.json()
      setBook(data.book)
      setPlatforms(data.platforms ?? [])
      if (data.company) setCompany(data.company)
      setStatus('found')
    })()
  }, [params.id])

  const authors = book?.book_authors?.map(a => a.authors.name).join('، ') || ''
  const prices = [
    book?.price_egp ? `${book.price_egp} ج.م` : null,
    book?.price_aed ? `${book.price_aed} د.إ` : null,
    book?.price_sar ? `${book.price_sar} ر.س` : null,
    book?.price_usd ? `$${book.price_usd}` : null,
  ].filter(Boolean)

  return (
    <main dir="rtl" className="min-h-screen bg-gradient-to-b from-[#faf6f0] to-[#f0e7db] text-[#2a211c]">
      {/* هيدر بسيط */}
      <header className="border-b border-[#e8dfd3]/50 bg-[#faf6f0]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-center gap-3 px-5 py-4">
          <img src="/abhar-logo.png" alt={company.name} className="h-10 w-12 object-contain" />
          <div className="text-center">
            <p className="font-serif text-sm font-semibold text-[#2a211c]">{company.name}</p>
            {company.phone && <p className="text-[10px] text-[#a3907e]">{company.phone}</p>}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-5 py-8 sm:py-12">
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-4 py-20">
            <div className="size-10 animate-spin rounded-full border-[3px] border-[#e8dfd3] border-t-[#d8573a]" />
            <p className="text-sm text-[#a3907e]">جارٍ تحميل بيانات الكتاب...</p>
          </div>
        )}

        {status === 'notfound' && (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-[#f7dbd3]"><BookOpen size={28} className="text-[#c04a2f]" /></div>
            <h1 className="font-serif text-2xl font-semibold">الكتاب غير موجود</h1>
            <p className="text-sm text-[#8a7969]">الرابط قد يكون خاطئ أو تم حذف هذا الكتاب.</p>
          </div>
        )}

        {status === 'found' && book && (
          <div className="space-y-6">
            {/* البطاقة الرئيسية */}
            <section className="overflow-hidden rounded-3xl border border-[#e8dfd3] bg-white shadow-[0_8px_32px_-8px_rgba(90,60,40,0.12)]">
              <div className="relative bg-gradient-to-br from-[#2a211c] via-[#3d2b21] to-[#5a3a2a] p-8 text-white sm:p-10">
                <div className="absolute -left-16 -top-16 size-40 rounded-full bg-[#d8573a]/15 blur-3xl" />
                <div className="absolute -right-20 bottom-0 size-52 rounded-full bg-[#b8752f]/10 blur-3xl" />
                <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
                  {book.cover_image_url ? (
                    <img src={book.cover_image_url} alt={book.title} className="h-52 w-36 shrink-0 rounded-2xl object-cover shadow-[0_8px_24px_-4px_rgba(0,0,0,0.4)] sm:h-60 sm:w-40" />
                  ) : (
                    <div className="flex h-52 w-36 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur sm:h-60 sm:w-40">
                      <BookOpen size={40} className="text-white/40" />
                    </div>
                  )}
                  <div className="flex-1">
                    {book.category && <span className="mb-3 inline-block rounded-full bg-white/10 px-3 py-1 text-xs backdrop-blur">{book.category}</span>}
                    <h1 className="font-serif text-3xl font-semibold leading-tight sm:text-4xl">{book.title}</h1>
                    {authors && <p className="mt-3 text-base text-white/70">{authors}</p>}
                    {book.season && <p className="mt-2 text-xs text-white/50">{book.season}</p>}
                  </div>
                </div>
              </div>

              {/* الأسعار */}
              {prices.length > 0 && (
                <div className="flex flex-wrap gap-3 border-b border-[#ede4d7] bg-[#fdf9f4] p-5 sm:p-6">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#a3907e]"><DollarSign size={14} />الأسعار:</div>
                  {prices.map((p, i) => (
                    <span key={i} className="rounded-full border border-[#e8dfd3] bg-white px-4 py-1.5 text-sm font-semibold text-[#2a211c]">{p}</span>
                  ))}
                </div>
              )}

              {/* النبذة */}
              {book.brief && (
                <div className="p-6 sm:p-8">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#a3907e]"><FileText size={15} />عن الكتاب</h3>
                  <p className="leading-relaxed text-[#4a3f37]">{book.brief}</p>
                </div>
              )}
            </section>

            {/* تفاصيل فنية */}
            <section className="rounded-3xl border border-[#e8dfd3] bg-white p-6 shadow-[0_2px_8px_-2px_rgba(90,60,40,0.06)] sm:p-8">
              <h3 className="mb-5 font-serif text-lg font-semibold">التفاصيل الفنية</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {book.isbn && <DetailRow icon={Tag} label="ISBN" value={book.isbn} />}
                {book.size && <DetailRow icon={Ruler} label="المقاس" value={book.size} />}
                {book.paper_type && <DetailRow icon={FileText} label="نوع الورق" value={book.paper_type} />}
                {book.print_color && <DetailRow icon={Palette} label="لون الطباعة" value={book.print_color} />}
                {book.cover_type && <DetailRow icon={BookOpen} label="الغلاف" value={book.cover_type} />}
              </div>
            </section>

            {/* المنصات المتاحة */}
            {platforms.length > 0 && (
              <section className="rounded-3xl border border-[#e8dfd3] bg-white p-6 shadow-[0_2px_8px_-2px_rgba(90,60,40,0.06)] sm:p-8">
                <h3 className="mb-5 flex items-center gap-2 font-serif text-lg font-semibold"><Globe size={18} className="text-[#d8573a]" />متاح على</h3>
                <div className="flex flex-wrap gap-3">
                  {platforms.map(name => (
                    <span key={name} className="rounded-full bg-gradient-to-l from-[#faf1eb] to-[#fdf9f4] border border-[#e8dfd3] px-5 py-2 text-sm font-semibold text-[#2a211c]">{name}</span>
                  ))}
                </div>
              </section>
            )}

            {/* فوتر */}
            <footer className="pt-4 text-center">
              <p className="text-xs text-[#a3907e]">© {new Date().getFullYear()} {company.name}</p>
              {company.email && <p className="mt-1 text-[10px] text-[#c4b3a1]">{company.email}</p>}
            </footer>
          </div>
        )}
      </div>
    </main>
  )
}

function DetailRow({ icon: Icon, label, value }: { icon: typeof BookOpen; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[#fdf9f4] p-4">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#faf1eb] text-[#d8573a]"><Icon size={16} /></div>
      <div><p className="text-[11px] text-[#a3907e]">{label}</p><p className="text-sm font-semibold text-[#2a211c]">{value}</p></div>
    </div>
  )
}
