import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getLoginTarget } from '@/lib/login-redirect'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        )
        const previousResponse = supabaseResponse
        supabaseResponse = NextResponse.next({ request })
        previousResponse.cookies.getAll().forEach((cookie) => supabaseResponse.cookies.set(cookie))
        for (const name of ['cache-control', 'expires', 'pragma']) {
          const value = previousResponse.headers.get(name)
          if (value) supabaseResponse.headers.set(name, value)
        }
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
        Object.entries(headers ?? {}).forEach(([name, value]) =>
          supabaseResponse.headers.set(name, value)
        )
      },
    },
  })

  // Redirect tetap membawa cookie sesi yang baru dibuat atau diperbarui.
  function withSession(response: NextResponse): NextResponse {
    supabaseResponse.cookies.getAll().forEach((cookie) => response.cookies.set(cookie))
    for (const name of ['cache-control', 'expires', 'pragma']) {
      const value = supabaseResponse.headers.get(name)
      if (value) response.headers.set(name, value)
    }
    return response
  }

  function redirectTo(target: string | URL): NextResponse {
    return withSession(NextResponse.redirect(new URL(target, request.url)))
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  const isAdminRoute =
    pathname.startsWith('/admin') || pathname.startsWith('/api/admin')
  const isPetugasRoute =
    pathname.startsWith('/petugas') || pathname.startsWith('/api/petugas')
  const isUserProtectedRoute =
    pathname === '/reservations' ||
    pathname.startsWith('/reservations/new') ||
    pathname.startsWith('/laporan/buat')
  const isApiRoute = pathname.startsWith('/api/')
  const isAuthPage = pathname === '/login' || pathname === '/register'

  // Fetch profile if user is logged in
  let profile: { id: number; role: string; status: string } | null = null

  if (user) {
    const { data } = await supabase
      .from('users')
      .select('id, role, status')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    profile = data
  }

  // Handle auth pages (/login, /register) when already logged in
  if (user && profile && profile.status === 'aktif' && isAuthPage && request.method === 'GET') {
    if (profile.role === 'pengguna' || profile.role === 'petugas' || profile.role === 'admin') {
      const requestedTarget = request.nextUrl.searchParams.get('redirect') ?? request.nextUrl.searchParams.get('redirectTo')
      return redirectTo(getLoginTarget(profile.role, requestedTarget))
    }
  }

  // Allow public routes if not protected
  if (!isAdminRoute && !isPetugasRoute && !isUserProtectedRoute) {
    return supabaseResponse
  }

  // 1. Unauthenticated User Check
  if (!user) {
    if (isApiRoute) {
      return withSession(NextResponse.json(
        { error: 'Silakan login terlebih dahulu.' },
        { status: 401 }
      ))
    }
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname + request.nextUrl.search)
    return redirectTo(loginUrl)
  }

  // 2. Active Account Check
  if (!profile || profile.status !== 'aktif') {
    if (isApiRoute) {
      return withSession(NextResponse.json(
        { error: 'Akun Anda belum aktif atau telah ditolak.' },
        { status: 403 }
      ))
    }
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('error', 'account_not_active')
    loginUrl.searchParams.set('redirect', pathname + request.nextUrl.search)
    return redirectTo(loginUrl)
  }

  // 3. Admin Route Role Check
  if (isAdminRoute) {
    if (profile.role !== 'admin') {
      if (isApiRoute) {
        return withSession(NextResponse.json(
          { error: 'Akses hanya untuk administrator.' },
          { status: 403 }
        ))
      }
      return redirectTo('/')
    }
  }

  // 4. Petugas Route Role Check
  if (isPetugasRoute) {
    if (profile.role !== 'petugas') {
      if (isApiRoute) {
        return withSession(NextResponse.json(
          { error: 'Akses hanya untuk petugas.' },
          { status: 403 }
        ))
      }
      return redirectTo('/')
    }
  }

  if (
    (pathname === '/reservations' || pathname.startsWith('/reservations/new')) &&
    profile.role !== 'pengguna'
  ) {
    const target = profile.role === 'petugas' ? '/petugas' : '/admin'
    return redirectTo(target)
  }

  return supabaseResponse
}
