import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { dashboardPath, normalizeRole, type AppRole } from '@/lib/auth/role'

function portalForPath(pathname: string): AppRole | null {
  if (pathname.startsWith('/freelancer')) return 'freelancer'
  if (pathname.startsWith('/client')) return 'client'
  if (pathname.startsWith('/admin')) return 'admin'
  return null
}

function missingSupabaseEnvResponse() {
  console.error(
    'Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.'
  )

  return new NextResponse('Server configuration error: missing Supabase environment variables.', {
    status: 500,
  })
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return missingSupabaseEnvResponse()
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError && userError.message !== 'Auth session missing!') {
    console.error('Middleware Supabase auth error:', userError.message)
  }

  const pathname = request.nextUrl.pathname

  const publicRoutes = ['/auth/login', '/auth/signup', '/auth/forgot-password', '/auth/reset-password', '/auth/callback']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  const isProtectedRoute =
    pathname.startsWith('/freelancer') ||
    pathname.startsWith('/client') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/workspace')

  if (isProtectedRoute && !user) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (!user) {
    return response
  }

  const cachedRole = normalizeRole(request.cookies.get('app_role')?.value)
  const isStrictAdminRoute = pathname.startsWith('/admin')
  const isSelectRoleRoute = pathname === '/select-role'

  let userRole = isStrictAdminRoute ? null : cachedRole
  let onboardingCompleted = !!userRole

  if (!userRole) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, onboarding_completed')
      .eq('id', user.id)
      .maybeSingle()

    onboardingCompleted = profile?.onboarding_completed ?? false
    const dbRole = normalizeRole(profile?.role)
    const metaRole = normalizeRole(user.user_metadata?.role as string | undefined)

    // Critical Security Fix: Never fallback to 'admin' from user_metadata
    userRole = dbRole || (metaRole === 'admin' ? null : metaRole)

    // Cache the role in cookies only if onboarding is completed
    if (userRole && onboardingCompleted && !isStrictAdminRoute) {
      response.cookies.set('app_role', userRole, {
        path: '/',
        maxAge: 60 * 60,
        sameSite: 'lax',
      })
    }
  }

  // Enforce onboarding flow
  if (!onboardingCompleted || !userRole) {
    if (!isPublicRoute && !isSelectRoleRoute && pathname !== '/auth/callback') {
      return NextResponse.redirect(new URL('/select-role', request.url))
    }
    if (isPublicRoute && pathname !== '/auth/callback') {
      return NextResponse.redirect(new URL('/select-role', request.url))
    }
    return response
  }

  // If fully onboarded and trying to access public routes or select-role, redirect to dashboard
  if ((isPublicRoute && pathname !== '/auth/callback') || isSelectRoleRoute) {
    return NextResponse.redirect(new URL(dashboardPath(userRole), request.url))
  }

  const requiredPortal = portalForPath(pathname)

  if (requiredPortal && userRole !== requiredPortal) {
    return NextResponse.redirect(new URL(dashboardPath(userRole), request.url))
  }

  if (pathname.startsWith('/workspace') && userRole === 'admin') {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
