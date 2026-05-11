'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function acceptRequest(requestId: string) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // 1. Get the project request
  const { data: request, error: requestError } = await supabase
    .from('project_requests')
    .select('*')
    .eq('id', requestId)
    .single()

  if (requestError || !request) {
    throw new Error('Project request not found')
  }

  if (request.status !== 'pending') {
    throw new Error('Request is not pending')
  }

  // 2. Create workspace
  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .insert({
      request_id: request.id,
      client_id: request.client_id,
      freelancer_id: request.freelancer_id,
      name: request.form_data?.project_name || 'New Project',
      project_type: request.form_data?.project_type,
      status: 'active',
      pipeline_stage: 'In Progress',
      form_data: request.form_data
    })
    .select()
    .single()

  if (workspaceError) {
    console.error('Error creating workspace:', workspaceError)
    throw new Error('Failed to create workspace')
  }

  // 3. Add freelancer as workspace member
  await supabase
    .from('workspace_members')
    .insert({
      workspace_id: workspace.id,
      user_id: user.id,
      role: 'editor',
      invited_by: user.id
    })

  // 4. Update request status
  await supabase
    .from('project_requests')
    .update({ 
      status: 'accepted',
      responded_at: new Date().toISOString()
    })
    .eq('id', requestId)

  // 5. Create notification for client
  await supabase
    .from('notifications')
    .insert({
      user_id: request.client_id,
      type: 'request_accepted',
      title: 'Project Request Accepted! 🎉',
      body: `Your project "${request.form_data?.project_name}" has been accepted. Your workspace is ready!`,
      data: { workspace_id: workspace.id, request_id: requestId }
    })

  revalidatePath('/freelancer/requests')
  revalidatePath('/freelancer/dashboard')
}

export async function rejectRequest(requestId: string, message: string = '') {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // 1. Get the project request
  const { data: request, error: requestError } = await supabase
    .from('project_requests')
    .select('*')
    .eq('id', requestId)
    .single()

  if (requestError || !request) {
    throw new Error('Project request not found')
  }

  if (request.status !== 'pending') {
    throw new Error('Request is not pending')
  }

  // 2. Update request status
  await supabase
    .from('project_requests')
    .update({ 
      status: 'rejected',
      responded_at: new Date().toISOString()
    })
    .eq('id', requestId)

  // 3. Create notification for client
  await supabase
    .from('notifications')
    .insert({
      user_id: request.client_id,
      type: 'request_rejected',
      title: 'Project Request Update',
      body: message || `Your project request "${request.form_data?.project_name}" has been rejected.`,
      data: { request_id: requestId, message }
    })

  revalidatePath('/freelancer/requests')
  revalidatePath('/freelancer/dashboard')
}
