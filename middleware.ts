import { NextResponse, NextRequest } from 'next/server'

async function fetchUserRole(token: string): Promise<string | null> {
  try {
    const backend = (process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000').replace(/\/$/, '')
    const res = await fetch(`${backend}/api/auth/me`, {
      headers: { authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = await res.json()
    return data?.role ?? null
  } catch {
    return null
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const token = req.cookies.get('auth_token')?.value
  const isDashboard = pathname.startsWith('/dashboard')
  const isAdminRoute = pathname.startsWith('/admin')
  const isAuthPage = pathname === '/login' || pathname === '/signup'
  const forceAuthPage = req.nextUrl.searchParams.get('force') === '1'

  // Protect /admin/* routes (including /admin/users)
  if (isAdminRoute) {
    if (!token) {
      const url = req.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('next', pathname)
      const res = NextResponse.redirect(url)
      res.headers.set('Cache-Control', 'no-store')
      res.headers.set('Pragma', 'no-cache')
      return res
    }
    // Let the page component handle admin check to avoid middleware loop
    // The admin users page has its own requireAdmin() function
  }

  if (isDashboard) {
    if (!token) {
      const url = req.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('next', pathname)
      const res = NextResponse.redirect(url)
      res.headers.set('Cache-Control', 'no-store')
      res.headers.set('Pragma', 'no-cache')
      return res
    }
    const role = await fetchUserRole(token)
    if (role !== 'admin') {
      const url = req.nextUrl.clone()
      url.pathname = '/'
      const res = NextResponse.redirect(url)
      res.headers.set('Cache-Control', 'no-store')
      res.headers.set('Pragma', 'no-cache')
      return res
    }
  }

  if (isAuthPage && token && !forceAuthPage) {
    const role = await fetchUserRole(token)
    const url = req.nextUrl.clone()
    url.pathname = role === 'admin' ? '/dashboard' : '/'
    return NextResponse.redirect(url)
  }

  // Root: if authenticated admin, go to dashboard; guests stay on home
  if (pathname === '/' && token && !req.nextUrl.searchParams.get('stay')) {
    const role = await fetchUserRole(token)
    if (role === 'admin') {
      const url = req.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  const res = NextResponse.next()
  
  // Set no-cache headers for all protected routes to prevent back button access after logout
  if (isDashboard || isAuthPage || isAdminRoute || (token && pathname !== '/')) {
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')
    res.headers.set('Pragma', 'no-cache')
    res.headers.set('Expires', '0')
    res.headers.set('Surrogate-Control', 'no-store')
  }
  
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}


