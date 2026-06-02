'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

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
      status: completed ? 'completed' : 'todo',
      completed_at: completed ? new Date().toISOString() : null
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
      action: `${completed ? 'completed' : 'reopened'} task: ${task.title}`,
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

  // Find user by email
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single()

  if (profileError || !profile) {
    throw new Error('User not found')
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

  // Log activity
  await supabase
    .from('activity_log')
    .insert({
      workspace_id: workspaceId,
      user_id: user.id,
      action: `invited ${email} to workspace`,
      entity_type: 'member',
      entity_id: profile.id
    })

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
