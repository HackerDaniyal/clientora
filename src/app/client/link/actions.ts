'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function linkFreelancer(formData: FormData) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const code = formData.get('code') as string

  // 1. Validate referral code
  const { data: referral, error: referralError } = await supabase
    .from('referral_codes')
    .select('*, profiles!referral_codes_freelancer_id_fkey(full_name, avatar_url)')
    .eq('code', code)
    .eq('is_active', true)
    .single()

  if (referralError || !referral) {
    return { error: 'Invalid or inactive referral code' }
  }

  if (referral.use_count >= referral.max_uses) {
    return { error: 'Referral code has reached its maximum uses' }
  }

  // 2. Check if client is already linked
  const { data: existingLink } = await supabase
    .from('client_freelancer_links')
    .select('id')
    .eq('client_id', user.id)
    .single()

  if (existingLink) {
    return { error: 'You have already linked with a freelancer' }
  }

  // 3. Create the link
  const { error: linkError } = await supabase
    .from('client_freelancer_links')
    .insert({
      client_id: user.id,
      freelancer_id: referral.freelancer_id,
      referral_code_id: referral.id,
      status: 'active'
    })

  if (linkError) {
    console.error('Error creating link:', linkError)
    return { error: 'Failed to link with freelancer. Please try again.' }
  }

  // 4. Update use count
  await supabase
    .from('referral_codes')
    .update({ use_count: referral.use_count + 1 })
    .eq('id', referral.id)

  // 5. Return success with freelancer info
  return { 
    success: true, 
    freelancerName: referral.profiles?.full_name || 'your freelancer',
    redirect: '/client/setup-project'
  }
}
