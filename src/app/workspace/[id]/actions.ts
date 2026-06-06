'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { sendInviteEmail } from '@/lib/email'

export async function createTask(workspaceId: string, title: string, priority: string) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      workspace_id: workspaceId,
      title,
      priority,
      status: 'todo',
      created_by: user.id
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating task:', error)
    throw new Error('Failed to create task')
  }

  // Log activity
  await supabase
    .from('activity_log')
    .insert({
      workspace_id: workspaceId,
      user_id: user.id,
      action: `created task: ${title}`,
      entity_type: 'task',
      entity_id: task.id
    })

  revalidatePath(`/workspace/${workspaceId}`)
}

export async function toggleTask(taskId: string, completed: boolean) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: task } = await supabase
    .from('tasks')
    .select('title, workspace_id, created_by')
    .eq('id', taskId)
    .single()

  if (!task) throw new Error('Task not found')

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('freelancer_id, client_id')
    .eq('id', task.workspace_id)
    .single()

  if (!workspace) throw new Error('Workspace not found')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isFreelancerOnWorkspace = workspace.freelancer_id === user.id
  const { data: memberships } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', task.workspace_id)
    .eq('user_id', user.id)

  const hasEditorMembership = memberships?.some((m) => m.role === 'editor') ?? false
  const canToggle =
    isFreelancerOnWorkspace ||
    (hasEditorMembership && profile?.role !== 'client')

  if (!canToggle) {
    throw new Error('Only freelancers can mark tasks complete')
  }

  const { error } = await supabase
    .from('tasks')
    .update({
      status: completed ? 'todo' : 'completed',
      completed_at: completed ? null : new Date().toISOString()
    })
    .eq('id', taskId)

  if (error) {
    console.error('Error updating task:', error)
    throw new Error('Failed to update task')
  }

  await supabase
    .from('activity_log')
    .insert({
      workspace_id: task.workspace_id,
      user_id: user.id,
      action: `${completed ? 'reopened' : 'completed'} task: ${task.title}`,
      entity_type: 'task',
      entity_id: taskId
    })

  revalidatePath(`/workspace/${task.workspace_id}`)
}

export async function sendMessage(workspaceId: string, content: string, fileUrl?: string, fileName?: string) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('messages')
    .insert({
      workspace_id: workspaceId,
      sender_id: user.id,
      content,
      file_url: fileUrl,
      file_name: fileName
    })

  if (error) {
    console.error('Error sending message:', error)
    throw new Error('Failed to send message')
  }

  // --- Create chat notifications for all other workspace participants ---
  // 1. Get workspace owners
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('freelancer_id, client_id, name')
    .eq('id', workspaceId)
    .single()

  // 2. Get workspace members
  const { data: members } = await supabase
    .from('workspace_members')
    .select('user_id')
    .eq('workspace_id', workspaceId)

  // 3. Collect all participant IDs (excluding the sender)
  const participantIds = new Set<string>()
  if (workspace?.freelancer_id) participantIds.add(workspace.freelancer_id)
  if (workspace?.client_id) participantIds.add(workspace.client_id)
  members?.forEach((m) => participantIds.add(m.user_id))
  participantIds.delete(user.id) // don't notify the sender

  // 4. Get sender's name for the notification title
  const { data: senderProfile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const senderName = senderProfile?.full_name ?? 'Someone'
  const truncatedContent = content.length > 80 ? content.slice(0, 80) + '…' : content

  // 5. Insert a notification for each participant
  if (participantIds.size > 0) {
    const notificationRows = Array.from(participantIds).map((userId) => ({
      user_id: userId,
      type: 'chat_message',
      title: `New message from ${senderName}`,
      body: truncatedContent,
      data: {
        workspace_id: workspaceId,
        sender_id: user.id,
        sender_name: senderName,
      },
    }))

    const { error: notifError } = await supabase
      .from('notifications')
      .insert(notificationRows)

    if (notifError) {
      console.error('Error creating chat notifications:', notifError)
      // Don't throw — message was sent successfully, notification failure is non-critical
    }
  }

  revalidatePath(`/workspace/${workspaceId}`)
}

export async function inviteMember(workspaceId: string, email: string, role: string) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Only freelancer (workspace owner) can invite members
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('freelancer_id, name')
    .eq('id', workspaceId)
    .single()

  if (!workspace || workspace.freelancer_id !== user.id) {
    throw new Error('Only the freelancer can invite members')
  }

  // Find user by email
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('email', email)
    .single()

  if (profileError || !profile) {
    throw new Error('User not found. Make sure the email is registered.')
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', profile.id)
    .single()

  if (existing) {
    throw new Error('This user is already a member of this workspace')
  }

  // Add to workspace members
  const { error } = await supabase
    .from('workspace_members')
    .insert({
      workspace_id: workspaceId,
      user_id: profile.id,
      role,
      invited_by: user.id
    })

  if (error) {
    console.error('Error inviting member:', error)
    throw new Error('Failed to invite member')
  }

  // Notify the invited member (in-app)
  await supabase
    .from('notifications')
    .insert({
      user_id: profile.id,
      type: 'member_invited',
      title: 'You\'ve been added to a workspace',
      body: `You've been invited to "${workspace.name}" as ${role}. Open the workspace to get started.`,
      data: { workspace_id: workspaceId, role }
    })

  // Get inviter's name for the email
  const { data: inviterProfile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  // Send invitation email
  const emailResult = await sendInviteEmail({
    to: email,
    workspaceName: workspace.name,
    inviterName: inviterProfile?.full_name || 'A team member',
    role,
    workspaceId,
  })

  if (emailResult.error) {
    console.error('Email send failed:', emailResult.error)
  }

  // Log activity
  await supabase
    .from('activity_log')
    .insert({
      workspace_id: workspaceId,
      user_id: user.id,
      action: `invited ${profile.full_name || email} as ${role}`,
      entity_type: 'member',
      entity_id: profile.id
    })

  revalidatePath(`/workspace/${workspaceId}`)
  
  return { 
    success: true, 
    emailSent: !!emailResult.success,
    emailSkipped: !!emailResult.skipped,
    emailError: emailResult.error || null
  }
}

export async function changeMemberRole(memberId: string, workspaceId: string, newRole: string) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Only freelancer can change roles
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('freelancer_id')
    .eq('id', workspaceId)
    .single()

  if (!workspace || workspace.freelancer_id !== user.id) {
    throw new Error('Only the freelancer can change member roles')
  }

  const { error } = await supabase
    .from('workspace_members')
    .update({ role: newRole })
    .eq('id', memberId)

  if (error) {
    console.error('Error changing role:', error)
    throw new Error('Failed to change role')
  }

  revalidatePath(`/workspace/${workspaceId}`)
}

export async function removeMember(memberId: string, workspaceId: string) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('workspace_members')
    .delete()
    .eq('id', memberId)

  if (error) {
    console.error('Error removing member:', error)
    throw new Error('Failed to remove member')
  }

  revalidatePath(`/workspace/${workspaceId}`)
}

export async function logActivity(workspaceId: string, action: string, entityType?: string, entityId?: string, details?: any) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('activity_log')
    .insert({
      workspace_id: workspaceId,
      user_id: user.id,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details
    })

  if (error) {
    console.error('Error logging activity:', error)
  }

  revalidatePath(`/workspace/${workspaceId}`)
}

export async function createDocument(workspaceId: string, type: string, title: string, content: any, amount?: number, dueDate?: string) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Generate document number
  const docNumber = `${type.toUpperCase().substring(0, 3)}-${Date.now().toString().slice(-6)}`

  const { data: document, error } = await supabase
    .from('workspace_documents')
    .insert({
      workspace_id: workspaceId,
      type,
      title,
      content,
      document_number: docNumber,
      amount,
      due_date: dueDate,
      created_by: user.id,
      status: 'draft'
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating document:', error)
    throw new Error('Failed to create document')
  }

  // Log activity
  await supabase
    .from('activity_log')
    .insert({
      workspace_id: workspaceId,
      user_id: user.id,
      action: `created ${type}: ${title}`,
      entity_type: 'document',
      entity_id: document.id
    })

  revalidatePath(`/workspace/${workspaceId}`)
  return document
}

export async function sendDocument(documentId: string) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: document } = await supabase
    .from('workspace_documents')
    .select('*, workspaces!inner(client_id, name)')
    .eq('id', documentId)
    .single()

  if (!document) {
    throw new Error('Document not found')
  }

  const { error } = await supabase
    .from('workspace_documents')
    .update({ 
      status: 'sent',
      sent_at: new Date().toISOString()
    })
    .eq('id', documentId)

  if (error) {
    console.error('Error sending document:', error)
    throw new Error('Failed to send document')
  }

  // Notify client
  await supabase
    .from('notifications')
    .insert({
      user_id: document.workspaces.client_id,
      type: 'document_sent',
      title: `New ${document.type} Received`,
      body: `${document.title} has been sent to you.`,
      data: { document_id: documentId, workspace_id: document.workspace_id }
    })

  // Log activity
  await supabase
    .from('activity_log')
    .insert({
      workspace_id: document.workspace_id,
      user_id: user.id,
      action: `sent ${document.type}: ${document.title}`,
      entity_type: 'document',
      entity_id: documentId
    })

  revalidatePath(`/workspace/${document.workspace_id}`)
}

export async function deleteDocument(documentId: string, workspaceId: string) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('workspace_documents')
    .delete()
    .eq('id', documentId)

  if (error) {
    console.error('Error deleting document:', error)
    throw new Error('Failed to delete document')
  }

  revalidatePath(`/workspace/${workspaceId}`)
}

export async function updateWorkspaceAssets(workspaceId: string, assets: {
  logo?: { name: string; url: string; path?: string } | null;
  references?: { name: string; url: string; path?: string }[];
  documents?: { name: string; url: string; path?: string }[];
}) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Fetch current form_data
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('form_data')
    .eq('id', workspaceId)
    .single()

  let formData: Record<string, unknown> = {}
  if (workspace?.form_data) {
    formData = typeof workspace.form_data === 'string'
      ? JSON.parse(workspace.form_data as string)
      : workspace.form_data as Record<string, unknown>
  }

  // Merge assets into form_data
  const existingAssets = (formData.assets || {}) as Record<string, unknown>
  formData.assets = { ...existingAssets, ...assets }

  const { error } = await supabase
    .from('workspaces')
    .update({ form_data: formData })
    .eq('id', workspaceId)

  if (error) {
    console.error('Error updating workspace assets:', error)
    throw new Error('Failed to update assets')
  }

  await supabase
    .from('activity_log')
    .insert({
      workspace_id: workspaceId,
      user_id: user.id,
      action: 'uploaded project assets',
      entity_type: 'workspace',
      entity_id: workspaceId
    })

  revalidatePath(`/workspace/${workspaceId}`)
}

export async function sendAssetsToFreelancer(workspaceId: string, assetsData: {
  logo?: { name: string; url: string; path?: string } | null;
  references?: { name: string; url: string; path?: string }[];
  documents?: { name: string; url: string; path?: string }[];
}) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Get workspace with freelancer info
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('freelancer_id, name, form_data')
    .eq('id', workspaceId)
    .single()

  if (!workspace?.freelancer_id) {
    throw new Error('No freelancer assigned to this workspace')
  }

  // Count assets from passed data
  const fileCount = (assetsData.logo ? 1 : 0) +
    (assetsData.references?.length || 0) +
    (assetsData.documents?.length || 0)

  if (fileCount === 0) {
    throw new Error('No assets to send. Upload files first.')
  }

  // Merge assets into form_data and mark as sent
  let formData: Record<string, unknown> = {}
  if (workspace.form_data) {
    formData = typeof workspace.form_data === 'string'
      ? JSON.parse(workspace.form_data as string)
      : workspace.form_data as Record<string, unknown>
  }

  const existingAssets = (formData.assets || {}) as Record<string, unknown>
  formData.assets = { ...existingAssets, ...assetsData }
  formData.assets_sent_at = new Date().toISOString()

  const { error: updateError } = await supabase
    .from('workspaces')
    .update({ form_data: formData })
    .eq('id', workspaceId)

  if (updateError) {
    console.error('Failed to update workspace form_data:', updateError)
    throw new Error('Failed to save assets. Please try again.')
  }

  // Notify freelancer
  await supabase
    .from('notifications')
    .insert({
      user_id: workspace.freelancer_id,
      type: 'assets_received',
      title: 'New Project Assets Received',
      body: `${fileCount} file${fileCount !== 1 ? 's' : ''} uploaded for ${workspace.name}. Check the Assets tab to download.`,
      data: { workspace_id: workspaceId, file_count: fileCount }
    })

  // Log activity
  await supabase
    .from('activity_log')
    .insert({
      workspace_id: workspaceId,
      user_id: user.id,
      action: `sent ${fileCount} asset${fileCount !== 1 ? 's' : ''} to freelancer`,
      entity_type: 'workspace',
      entity_id: workspaceId
    })

  revalidatePath(`/workspace/${workspaceId}`)
}

export async function updateDocument(documentId: string, workspaceId: string, title: string, content: any, amount?: number, dueDate?: string) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('workspace_documents')
    .update({ title, content, amount, due_date: dueDate })
    .eq('id', documentId)

  if (error) {
    console.error('Error updating document:', error)
    throw new Error('Failed to update document')
  }

  await supabase
    .from('activity_log')
    .insert({
      workspace_id: workspaceId,
      user_id: user.id,
      action: `updated document: ${title}`,
      entity_type: 'document',
      entity_id: documentId
    })

  revalidatePath(`/workspace/${workspaceId}`)
}
