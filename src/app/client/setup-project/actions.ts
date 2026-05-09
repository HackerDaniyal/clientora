'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function createProject(formData: any) {
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
    throw new Error('You must be linked to a freelancer to create a project')
  }

  // 2. Create project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      client_id: user.id,
      freelancer_id: link.freelancer_id,
      name: formData.name,
      description: formData.description,
      budget: formData.budget,
      timeline_end: formData.timeline_end,
      status: 'pending_approval'
    })
    .select()
    .single()

  if (projectError) {
    console.error('Error creating project:', projectError)
    throw new Error('Failed to create project')
  }

  // 3. Create milestones if any
  if (formData.milestones && formData.milestones.length > 0) {
    const milestones = formData.milestones.map((m: any) => ({
      project_id: project.id,
      title: m.title,
      description: m.description,
      amount: m.amount,
      status: 'pending'
    }))

    const { error: milestoneError } = await supabase
      .from('milestones')
      .insert(milestones)

    if (milestoneError) {
      console.error('Error creating milestones:', milestoneError)
    }
  }

  revalidatePath('/client/dashboard')
  redirect('/client/dashboard')
}
