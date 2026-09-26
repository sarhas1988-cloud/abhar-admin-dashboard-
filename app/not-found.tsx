import Link from 'next/link'

export default function NotFound() {
  return (
    <main dir="rtl" className="flex min-h-screen items-center justify-center bg-[#faf6f0] p-5 text-[#2a211c]">
      <div className="w-full max-w-sm rounded-2xl border border-[#e8dfd3] bg-white p-8 text-center shadow-[0_4px_24px_-8px_rgba(90,60,40,0.12)]">
        <p className="font-serif text-5xl font-semibold text-[#d8573a]">404</p>
        <h1 className="mt-3 text-lg font-semibold">الصفحة دي مش موجودة</h1>
        <p className="mt-1 text-sm text-[#8a7969]">ممكن اللينك غلط أو الصفحة اتنقلت.</p>
        <Link href="/" className="mt-6 inline-block rounded-xl bg-[#d8573a] px-5 py-3 text-sm font-semibold text-white">الرجوع للوحة التحكم</Link>
      </div>
    </main>
  )
}
