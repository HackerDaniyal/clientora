'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const redirectTo = formData.get('redirect') as string

  const { error, data } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return redirect('/auth/login?error=' + error.message)
  }

  // Fetch role to redirect correctly
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  if (profileError || !profile) {
    console.error('Profile fetch error:', profileError)
    // If profile doesn't exist, redirect to signup or default to freelancer
    return redirect('/auth/login?error=Profile not found. Please contact support.')
  }

  const role = profile.role

  if (!role) {
    console.error('Role is undefined for user:', data.user.id)
    return redirect('/auth/login?error=User role not configured properly.')
  }

  revalidatePath('/', 'layout')
  
  // Use the redirect URL from middleware if available, otherwise go to dashboard
  if (redirectTo && redirectTo.startsWith('/')) {
    return redirect(redirectTo)
  }
  
  redirect(`/${role}/dashboard`)
}

export async function signup(formData: FormData) {
  const supabase = createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const role = formData.get('role') as string
  const fullName = formData.get('fullName') as string

  const { error, data } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role,
        full_name: fullName,
      },
    },
  })

  if (error) {
    return redirect('/auth/signup?error=' + error.message)
  }

  // After signup, we'd typically have a trigger that creates the 'profiles' row
  // For now, assume it's created or we do it manually if needed

  revalidatePath('/', 'layout')
  redirect('/auth/login?message=Check email to confirm your account')
}

export async function logout() {
  const supabase = createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/auth/login')
}

export async function forgotPassword(formData: FormData) {
  const supabase = createClient()
  const email = formData.get('email') as string
  const origin = formData.get('origin') as string

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/auth/reset-password`,
  })

  if (error) {
    return redirect('/auth/forgot-password?error=' + error.message)
  }

  return redirect('/auth/forgot-password?message=Password reset link sent to your email')
}

export async function updatePassword(formData: FormData) {
  const supabase = createClient()
  const password = formData.get('password') as string

  const { error } = await supabase.auth.updateUser({
    password,
  })

  if (error) {
    return redirect('/auth/reset-password?error=' + error.message)
  }

  revalidatePath('/', 'layout')
  redirect('/auth/login?message=Password updated successfully')
}

