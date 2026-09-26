import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  // getClaims verifies the JWT locally when the project uses asymmetric signing keys,
  // instead of getUser() which called the Supabase Auth server on EVERY navigation and prefetch.
  // It still refreshes an expired session and writes the new cookies.
  const { data } = await supabase.auth.getClaims()
  const isLoggedIn = Boolean(data?.claims?.sub)

  const { pathname } = request.nextUrl
  const isAuthPage = pathname.startsWith('/login')
  const isPublicInvite = pathname.startsWith('/invite') || pathname.startsWith('/api/invite')
  const isPublicBook = pathname.startsWith('/book/') || pathname.startsWith('/api/public-book/')

  if (!isLoggedIn && !isAuthPage && !isPublicInvite && !isPublicBook) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = ''
    return NextResponse.redirect(url)
  }

  if (isLoggedIn && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)'],
}
