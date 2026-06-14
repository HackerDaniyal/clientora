import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { dashboardPath, normalizeRole } from '@/lib/auth/role'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const roleParam = searchParams.get('role')

  // Handle error from Supabase (e.g., expired link, invalid token)
  if (error) {
    console.error('Auth callback error:', error, errorDescription)
    return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(errorDescription || 'Authentication failed')}`)
  }

  if (code) {
    const supabase = createClient()
    const { error, data: { user } } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && user) {
      // Fetch user role to determine the correct dashboard
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      let role =
        normalizeRole(profile?.role) ||
        normalizeRole(user.user_metadata?.role as string | undefined)

      // If no role in profile, but we got one from the OAuth signup flow
      if (!role && roleParam) {
        role = normalizeRole(roleParam)
        if (role) {
          // Update profile with the new role
          await supabase.from('profiles').upsert(
            { id: user.id, role: role, full_name: user.user_metadata?.full_name || user.user_metadata?.name || 'User' },
            { onConflict: 'id' }
          )
        }
      }

      // If still no role, and no profile exists, maybe it's a new login without role. Default to freelancer or show error.
      // We will ask them to signup properly or we can default to freelancer.
      if (!role) {
        // Let's create a default profile as freelancer if it doesn't exist
        role = 'freelancer'
        await supabase.from('profiles').upsert(
          { id: user.id, role: role, full_name: user.user_metadata?.full_name || user.user_metadata?.name || 'User' },
          { onConflict: 'id' }
        )
      }

      const forwardTo = next !== '/' && next.startsWith(`/${role}`) ? next : dashboardPath(role)
      
      return NextResponse.redirect(`${origin}${forwardTo}`)
    } else {
      console.error('Error exchanging code for session:', error?.message)
      return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(error?.message || 'Authentication failed')}`)
    }
  }

  // If no code and no error, redirect to login
  return NextResponse.redirect(`${origin}/auth/login`)
}
