'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

interface ProjectFormData {
  project_name: string;
  project_type: string;
  description: string;
  budget_range: string;
  timeline_start: string;
  timeline_end: string;
  business_name: string;
  industry: string;
  target_audience: string;
  competitors: string[];
  social_media: string;
  brand_colors: string[];
  brand_fonts: string;
  platforms: string[];
  technology_preferences: string;
  integrations: string;
  special_requirements: string;
}

export async function submitProjectRequest(formData: ProjectFormData) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // 1. Get the link to the freelancer
  const { data: link, error: linkError } = await supabase
    .from('client_freelancer_links')
    .select('freelancer_id')
    .eq('client_id', user.id)
    .single()

  if (linkError || !link) {
    throw new Error('You must be linked to a freelancer to submit a project request')
  }

  // 2. Check if there's already a pending request
  const { data: existingRequest } = await supabase
    .from('project_requests')
    .select('id')
    .eq('client_id', user.id)
    .eq('status', 'pending')
    .single()

  if (existingRequest) {
    throw new Error('You already have a pending project request')
  }

  // 3. Create project request with all form data as JSONB
  const { data: request, error: requestError } = await supabase
    .from('project_requests')
    .insert({
      client_id: user.id,
      freelancer_id: link.freelancer_id,
      status: 'pending',
      form_data: {
        project_name: formData.project_name,
        project_type: formData.project_type,
        description: formData.description,
        budget_range: formData.budget_range,
        timeline_start: formData.timeline_start,
        timeline_end: formData.timeline_end,
        business_name: formData.business_name,
        industry: formData.industry,
        target_audience: formData.target_audience,
        competitors: formData.competitors.filter(c => c.trim() !== ''),
        social_media: formData.social_media,
        brand_colors: formData.brand_colors,
        brand_fonts: formData.brand_fonts,
        platforms: formData.platforms,
        technology_preferences: formData.technology_preferences,
        integrations: formData.integrations,
        special_requirements: formData.special_requirements
      },
      submitted_at: new Date().toISOString()
    })
    .select()
    .single()

  if (requestError) {
    console.error('Error creating project request:', requestError)
    throw new Error('Failed to submit project request')
  }

  // 4. Create notification for freelancer
  await supabase
    .from('notifications')
    .insert({
      user_id: link.freelancer_id,
      type: 'new_project_request',
      title: 'New Project Request',
      body: `${formData.business_name} has submitted a new project request: ${formData.project_name}`,
      data: { request_id: request.id, client_id: user.id }
    })

  revalidatePath('/client/dashboard')
  redirect('/client/dashboard?message=Project request submitted successfully!')
}

