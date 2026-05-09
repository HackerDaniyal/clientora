import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createClient } from '@/lib/supabase/server'

export async function middleware(request: NextRequest) {
  // Update the session
  const response = await updateSession(request)
  
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Public routes that don't require authentication
  const publicRoutes = ['/auth/login', '/auth/signup', '/auth/forgot-password', '/auth/reset-password', '/auth/callback']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  const isProtectedRoute = pathname.startsWith('/freelancer') || 
                           pathname.startsWith('/client') || 
                           pathname.startsWith('/admin')

  // If accessing protected route without authentication, redirect to login
  if (isProtectedRoute && !user) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If user is authenticated and tries to access auth pages, redirect to their dashboard
  if (user && isPublicRoute && pathname !== '/auth/callback') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role || 'freelancer'
    return NextResponse.redirect(new URL(`/${role}/dashboard`, request.url))
  }

  // Role-based route protection
  if (user && isProtectedRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const userRole = profile?.role

    // Redirect to correct dashboard if accessing wrong role's route
    if (pathname.startsWith('/freelancer') && userRole !== 'freelancer') {
      return NextResponse.redirect(new URL(`/${userRole}/dashboard`, request.url))
    }
    if (pathname.startsWith('/client') && userRole !== 'client') {
      return NextResponse.redirect(new URL(`/${userRole}/dashboard`, request.url))
    }
    if (pathname.startsWith('/admin') && userRole !== 'admin') {
      return NextResponse.redirect(new URL(`/${userRole}/dashboard`, request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (images, icons, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
