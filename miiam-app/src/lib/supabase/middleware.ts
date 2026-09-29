import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { env } from '@/env'

export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  const publicPartnerPaths = ['/partner', '/partner/register', '/partner/dashboard']
  const isPublicPartner = publicPartnerPaths.some(p => pathname === p)
  const publicAuthPaths = ['/rider/login', '/rider/apply']
  const isPublicAuth = publicAuthPaths.some(p => pathname === p)

  // Browse-first: catalog, item detail and cart are open to everyone.
  // Sign-in is demanded only when the user places an order (client-side gate in
  // /app/checkout) or opens an account surface (orders, wallet, addresses, ...).
  const publicAppPaths = [
    '/app/home',
    '/app/food',
    '/app/services',
    '/app/store',
    '/app/search',
    '/app/explore',
    '/app/cart',
    '/app/checkout',
    '/app/vendor',
    '/app/vendor-failure',
    '/app/flowers',
  ]
  const isPublicApp =
    pathname === '/app' ||
    publicAppPaths.some(p => pathname === p || pathname.startsWith(`${p}/`))

  const protectedPaths = ['/app', '/admin', '/rider', '/partner']
  const isProtected = !isPublicApp && !isPublicPartner && !isPublicAuth && protectedPaths.some(p =>
    pathname.startsWith(p)
  )

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    if (request.nextUrl.pathname.startsWith('/rider')) {
      url.pathname = '/rider/login'
    } else if (request.nextUrl.pathname.startsWith('/partner')) {
      url.pathname = '/partner'
    } else {
      url.pathname = '/auth/login'
    }
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Validate redirect param on login redirects to prevent open redirect
  const redirectTo = request.nextUrl.searchParams.get('redirect');
  if (redirectTo && (!redirectTo.startsWith('/') || redirectTo.startsWith('//'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/app/home'
    url.searchParams.delete('redirect')
    return NextResponse.redirect(url)
  }

  // Admin-only check
  if (user && request.nextUrl.pathname.startsWith('/admin')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/app/home'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
