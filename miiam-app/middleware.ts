import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const supabaseResponse = NextResponse.next({ request })

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
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // --- Public paths that never need auth ---
  const publicAppPaths = [
    '/app/home',
    '/app/food',
    '/app/services',
    '/app/search',
    '/app/cart',
    '/app/explore',
    '/app/vendor-failure',
  ]
  const isPublicApp = publicAppPaths.some(p => pathname === p) ||
    pathname.startsWith('/app/food/') ||
    pathname.startsWith('/app/services/') ||
    pathname.startsWith('/app/vendor/')

  // Allow all static assets and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // static files
  ) {
    return supabaseResponse
  }

  // --- Auth pages (always public) ---
  if (pathname.startsWith('/auth/')) {
    // Validate redirect param to prevent open redirect
    const redirectTo = request.nextUrl.searchParams.get('redirect')
    if (redirectTo && (!redirectTo.startsWith('/') || redirectTo.startsWith('//'))) {
      const url = request.nextUrl.clone()
      url.pathname = '/app/home'
      url.searchParams.delete('redirect')
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // --- Public pages (no auth needed) ---
  const globalPublicPaths = ['/about', '/privacy', '/terms', '/careers', '/services', '/onboarding']
  if (globalPublicPaths.some(p => pathname === p)) {
    return supabaseResponse
  }

  // --- App routes: browsing is public, account pages need auth ---
  if (pathname.startsWith('/app')) {
    if (isPublicApp) {
      return supabaseResponse
    }

    // Protected app routes that require login
    const protectedAppPaths = [
      '/app/profile',
      '/app/settings',
      '/app/addresses',
      '/app/wallet',
      '/app/orders',
      '/app/bookings',
      '/app/subscriptions',
      '/app/group-order',
      '/app/favorites',
      '/app/notifications',
      '/app/feedback',
      '/app/support',
    ]
    const needsAuth = protectedAppPaths.some(p => pathname.startsWith(p)) ||
      pathname === '/app/payment' ||
      pathname === '/app/payment-status'

    if (needsAuth && !user) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  }

  // --- Admin routes ---
  if (pathname.startsWith('/admin')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }

    // Check admin role
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

    return supabaseResponse
  }

  // --- Rider routes ---
  if (pathname.startsWith('/rider')) {
    const publicRiderPaths = ['/rider/login', '/rider/apply']
    const isPublicRider = publicRiderPaths.some(p => pathname === p)

    if (!isPublicRider && !user) {
      const url = request.nextUrl.clone()
      url.pathname = '/rider/login'
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  }

  // --- Partner routes ---
  if (pathname.startsWith('/partner')) {
    const publicPartnerPaths = ['/partner', '/partner/register']
    const isPublicPartner = publicPartnerPaths.some(p => pathname === p)

    if (!isPublicPartner && !user) {
      const url = request.nextUrl.clone()
      url.pathname = '/partner'
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
