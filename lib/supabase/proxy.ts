import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        )
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  const isAdminRoute =
    pathname.startsWith('/admin') || pathname.startsWith('/api/admin')
  const isPetugasRoute =
    pathname.startsWith('/petugas') || pathname.startsWith('/api/petugas')
  const isUserProtectedRoute =
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
  if (user && profile && profile.status === 'aktif' && isAuthPage) {
    if (profile.role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    if (profile.role === 'petugas') {
      return NextResponse.redirect(new URL('/petugas', request.url))
    }
    return NextResponse.redirect(new URL('/reservations', request.url))
  }

  // Allow public routes if not protected
  if (!isAdminRoute && !isPetugasRoute && !isUserProtectedRoute) {
    return supabaseResponse
  }

  // 1. Unauthenticated User Check
  if (!user) {
    if (isApiRoute) {
      return NextResponse.json(
        { error: 'Silakan login terlebih dahulu.' },
        { status: 401 }
      )
    }
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 2. Active Account Check
  if (!profile || profile.status !== 'aktif') {
    if (isApiRoute) {
      return NextResponse.json(
        { error: 'Akun Anda belum aktif atau telah ditolak.' },
        { status: 403 }
      )
    }
    return NextResponse.redirect(
      new URL('/login?error=account_not_active', request.url)
    )
  }

  // 3. Admin Route Role Check
  if (isAdminRoute) {
    if (profile.role !== 'admin') {
      if (isApiRoute) {
        return NextResponse.json(
          { error: 'Akses hanya untuk administrator.' },
          { status: 403 }
        )
      }
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // 4. Petugas Route Role Check
  if (isPetugasRoute) {
    if (profile.role !== 'petugas') {
      if (isApiRoute) {
        return NextResponse.json(
          { error: 'Akses hanya untuk petugas.' },
          { status: 403 }
        )
      }
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return supabaseResponse
}