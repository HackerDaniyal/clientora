import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { dashboardPath, normalizeRole } from '@/lib/auth/role'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

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

      // Determine if this is a newly created user (within the last 5 minutes)
      const isNewUser = new Date(user.created_at).getTime() > Date.now() - 5 * 60 * 1000;

      // Use Admin client to bypass RLS that might be preventing role updates
      const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      if (isNewUser && !roleParam) {
        // Direct signup from login page without selecting a role.
        // We must remove the default role set by the trigger and force them to pick one.
        role = null;
        await supabaseAdmin.from('profiles').upsert(
          { id: user.id, role: null, full_name: user.user_metadata?.full_name || user.user_metadata?.name || 'User' },
          { onConflict: 'id' }
        )
      } else if (roleParam) {
        // If we got a role from the OAuth signup flow, apply it
        const parsedRole = normalizeRole(roleParam)
        if (parsedRole) {
          role = parsedRole
          // Update profile with the new role
          const { error: updateError } = await supabaseAdmin.from('profiles').upsert(
            { id: user.id, role: role, full_name: user.user_metadata?.full_name || user.user_metadata?.name || 'User' },
            { onConflict: 'id' }
          )
          if (updateError) {
             console.error("Failed to update user role:", updateError)
          }
        }
      }

      // If still no role, they need to select one.
      if (!role) {
        const response = NextResponse.redirect(`${origin}/auth/signup?error=${encodeURIComponent('Please select an account type and click Continue with Google to finish signup.')}`)
        response.cookies.delete('app_role')
        return response
      }

      const forwardTo = next !== '/' && next.startsWith(`/${role}`) ? next : dashboardPath(role)
      
      const response = NextResponse.redirect(`${origin}${forwardTo}`)
      response.cookies.set('app_role', role, { path: '/', maxAge: 60 * 60, sameSite: 'lax' })
      return response
    } else {
      console.error('Error exchanging code for session:', error?.message)
      return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(error?.message || 'Authentication failed')}`)
    }
  }

  // If no code and no error, redirect to login
  return NextResponse.redirect(`${origin}/auth/login`)
}
