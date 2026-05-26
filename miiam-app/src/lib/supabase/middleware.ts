import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

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
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const publicPartnerPaths = ['/partner', '/partner/register']
  const isPublicPartner = publicPartnerPaths.some(p =>
    request.nextUrl.pathname === p
  )
  const protectedPaths = ['/app', '/admin', '/rider', '/partner']
  const isProtected = !isPublicPartner && protectedPaths.some(p =>
    request.nextUrl.pathname.startsWith(p)
  )

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    if (request.nextUrl.pathname.startsWith('/rider')) {
      url.pathname = '/rider/login'
    } else {
      url.pathname = '/auth/login'
    }
    url.searchParams.set('redirect', request.nextUrl.pathname)
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
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
