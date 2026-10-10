type LoginRole = 'pengguna' | 'petugas' | 'admin'

function isRoute(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`)
}

export function getLoginTarget(
  role: LoginRole,
  requestedTarget: string | null
): string {
  const fallback = role === 'admin' ? '/admin' : role === 'petugas' ? '/petugas' : '/'

  if (
    !requestedTarget ||
    !requestedTarget.startsWith('/') ||
    requestedTarget.startsWith('//') ||
    /[\\\u0000-\u0020\u007f]/.test(requestedTarget)
  ) return fallback

  try {
    const base = 'https://fivora.invalid'
    const url = new URL(requestedTarget, base)
    const pathname = decodeURIComponent(url.pathname)

    if (
      url.origin !== base ||
      pathname.startsWith('//') ||
      /[\\\u0000-\u001f\u007f]/.test(pathname) ||
      isRoute(pathname, '/login') ||
      isRoute(pathname, '/register') ||
      isRoute(pathname, '/api')
    ) return fallback

    if (role === 'admin' && !isRoute(pathname, '/admin')) return fallback
    if (role === 'petugas' && !isRoute(pathname, '/petugas')) return fallback
    if (role === 'pengguna' && (isRoute(pathname, '/admin') || isRoute(pathname, '/petugas'))) return fallback

    return url.pathname + url.search + url.hash
  } catch {
    return fallback
  }
}
