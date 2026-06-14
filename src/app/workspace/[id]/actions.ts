'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { sendInviteEmail } from '@/lib/email'

export async function toggleMessageReaction(messageId: string, emoji: string) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Fetch current reactions
  const { data: message } = await supabase
    .from('messages')
    .select('reactions, workspace_id')
    .eq('id', messageId)
    .single()

  if (!message) throw new Error('Message not found')

  const reactions = (message.reactions as Record<string, string[]>) || {}
  const users = reactions[emoji] || []

  if (users.includes(user.id)) {
    // Remove user's reaction
    const updated = users.filter((id) => id !== user.id)
    if (updated.length === 0) {
      delete reactions[emoji]
    } else {
      reactions[emoji] = updated
    }
  } else {
    // Add user's reaction
    reactions[emoji] = [...users, user.id]
  }

  const { error } = await supabase
    .from('messages')
    .update({ reactions })
    .eq('id', messageId)

  if (error) {
    console.error('Error toggling reaction:', error)
    throw new Error('Failed to toggle reaction')
  }

  revalidatePath(`/workspace/${message.workspace_id}`)
}

export async function uploadChatAttachment(formData: FormData) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const workspaceId = formData.get('workspaceId') as string
  const file = formData.get('file') as File

  if (!workspaceId || !file) throw new Error('Missing data')

  // Max 10MB
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('File too large. Maximum size is 10MB.')
  }

  const path = `${workspaceId}/chat/${Date.now()}_${file.name}`

  const { error: uploadError } = await supabase.storage
    .from('project-assets')
    .upload(path, file, { upsert: false, cacheControl: '3600' })

  if (uploadError) {
    console.error('Error uploading chat attachment:', uploadError)
    throw new Error('Failed to upload file')
  }

  const { data: urlData } = supabase.storage
    .from('project-assets')
    .getPublicUrl(path)

  return { url: urlData.publicUrl, name: file.name }
}

export async function createTask(
  workspaceId: string,
  title: string,
  priority: string,
  description?: string,
  dueDate?: string,
  assignedTo?: string
) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Get next sort_order
  const { data: maxOrder } = await supabase
    .from('tasks')
    .select('sort_order')
    .eq('workspace_id', workspaceId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const nextOrder = (maxOrder?.sort_order ?? 0) + 1

  const insertData: Record<string, unknown> = {
    workspace_id: workspaceId,
    title,
    priority,
    status: 'todo',
    created_by: user.id,
    sort_order: nextOrder
  }
  if (description) insertData.description = description
  if (dueDate) insertData.due_date = dueDate
  if (assignedTo) insertData.assigned_to = assignedTo

  const { data: task, error } = await supabase
    .from('tasks')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    console.error('Error creating task:', error)
    throw new Error('Failed to create task')
  }

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

export async function updateTask(
  taskId: string,
  updates: {
    title?: string
    description?: string
    priority?: string
    status?: string
    due_date?: string | null
    assigned_to?: string | null
  }
) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: task } = await supabase
    .from('tasks')
    .select('title, workspace_id')
    .eq('id', taskId)
    .single()

  if (!task) throw new Error('Task not found')

  const updateData: Record<string, unknown> = { ...updates }
  if (updates.status === 'completed') {
    updateData.completed_at = new Date().toISOString()
  } else if (updates.status && updates.status !== 'completed') {
    updateData.completed_at = null
  }

  const { error } = await supabase
    .from('tasks')
    .update(updateData)
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
      action: `updated task: ${updates.title || task.title}`,
      entity_type: 'task',
      entity_id: taskId
    })

  revalidatePath(`/workspace/${task.workspace_id}`)
}

export async function deleteTask(taskId: string) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: task } = await supabase
    .from('tasks')
    .select('title, workspace_id')
    .eq('id', taskId)
    .single()

  if (!task) throw new Error('Task not found')

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)

  if (error) {
    console.error('Error deleting task:', error)
    throw new Error('Failed to delete task')
  }

  await supabase
    .from('activity_log')
    .insert({
      workspace_id: task.workspace_id,
      user_id: user.id,
      action: `deleted task: ${task.title}`,
      entity_type: 'task',
      entity_id: taskId
    })

  revalidatePath(`/workspace/${task.workspace_id}`)
}

export async function reorderTasks(updates: { id: string; sort_order: number }[]) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  for (const update of updates) {
    await supabase
      .from('tasks')
      .update({ sort_order: update.sort_order })
      .eq('id', update.id)
  }

  // Get workspace_id from first task for revalidation
  if (updates.length > 0) {
    const { data: task } = await supabase
      .from('tasks')
      .select('workspace_id')
      .eq('id', updates[0].id)
      .single()

    if (task) {
      revalidatePath(`/workspace/${task.workspace_id}`)
    }
  }
}

export async function addTaskComment(taskId: string, content: string) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: task } = await supabase
    .from('tasks')
    .select('workspace_id, title')
    .eq('id', taskId)
    .single()

  if (!task) throw new Error('Task not found')

  const { error } = await supabase
    .from('task_comments')
    .insert({
      task_id: taskId,
      user_id: user.id,
      content
    })

  if (error) {
    console.error('Error adding task comment:', error)
    throw new Error('Failed to add comment')
  }

  revalidatePath(`/workspace/${task.workspace_id}`)
}

export async function deleteTaskComment(commentId: string) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('task_comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting task comment:', error)
    throw new Error('Failed to delete comment')
  }
}

export async function sendMessage(workspaceId: string, content: string, fileUrl?: string, fileName?: string, replyToId?: string) {
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
      file_name: fileName,
      reply_to_id: replyToId || null
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

// ── Mark as Paid ──
export async function markAsPaid(documentId: string, workspaceId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: doc } = await supabase
    .from('workspace_documents')
    .select('*, workspaces!inner(client_id, name, freelancer_id)')
    .eq('id', documentId)
    .single()

  if (!doc) throw new Error('Document not found')

  const { error } = await supabase
    .from('workspace_documents')
    .update({ status: 'paid' })
    .eq('id', documentId)

  if (error) {
    console.error('Error marking as paid:', error)
    throw new Error('Failed to update status')
  }

  // Notify client
  await supabase.from('notifications').insert({
    user_id: doc.workspaces.client_id,
    type: 'invoice_paid',
    title: 'Invoice Marked as Paid',
    body: `${doc.title} has been marked as paid. Thank you!`,
    data: { document_id: documentId, workspace_id: workspaceId }
  })

  await supabase.from('activity_log').insert({
    workspace_id: workspaceId,
    user_id: user.id,
    action: `marked as paid: ${doc.title}`,
    entity_type: 'document',
    entity_id: documentId
  })

  revalidatePath(`/workspace/${workspaceId}`)
  revalidatePath('/freelancer/invoices')
}

// ── Accept Proposal ──
export async function acceptProposal(documentId: string, workspaceId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: doc } = await supabase
    .from('workspace_documents')
    .select('*, workspaces!inner(freelancer_id, name, client_id)')
    .eq('id', documentId)
    .single()

  if (!doc) throw new Error('Document not found')

  // Update proposal to approved
  await supabase
    .from('workspace_documents')
    .update({ status: 'approved' })
    .eq('id', documentId)

  // Advance workspace to "In Progress"
  await supabase
    .from('workspaces')
    .update({ pipeline_stage: 'In Progress' })
    .eq('id', workspaceId)

  // Notify freelancer
  await supabase.from('notifications').insert({
    user_id: doc.workspaces.freelancer_id,
    type: 'proposal_accepted',
    title: 'Proposal Accepted!',
    body: `Your proposal "${doc.title}" for ${doc.workspaces.name} has been accepted by the client.`,
    data: { document_id: documentId, workspace_id: workspaceId }
  })

  await supabase.from('activity_log').insert({
    workspace_id: workspaceId,
    user_id: user.id,
    action: `accepted proposal: ${doc.title}`,
    entity_type: 'document',
    entity_id: documentId
  })

  revalidatePath(`/workspace/${workspaceId}`)
}

// ── Counter Offer (Proposal notes) ──
export async function counterOfferProposal(documentId: string, workspaceId: string, notes: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  if (!notes.trim()) throw new Error('Please provide your counter-offer notes')

  const { data: doc } = await supabase
    .from('workspace_documents')
    .select('*, workspaces!inner(freelancer_id, name)')
    .eq('id', documentId)
    .single()

  if (!doc) throw new Error('Document not found')

  // Store counter offer notes in document content
  const content = (doc.content as Record<string, unknown>) || {}
  content.counterOfferNotes = notes.trim()
  content.counterOfferAt = new Date().toISOString()

  await supabase
    .from('workspace_documents')
    .update({ content })
    .eq('id', documentId)

  // Notify freelancer
  await supabase.from('notifications').insert({
    user_id: doc.workspaces.freelancer_id,
    type: 'proposal_counter_offer',
    title: 'Counter Offer Received',
    body: `Client sent a counter offer for "${doc.title}": ${notes.slice(0, 100)}${notes.length > 100 ? '...' : ''}`,
    data: { document_id: documentId, workspace_id: workspaceId, notes }
  })

  await supabase.from('activity_log').insert({
    workspace_id: workspaceId,
    user_id: user.id,
    action: `sent counter offer for: ${doc.title}`,
    entity_type: 'document',
    entity_id: documentId
  })

  revalidatePath(`/workspace/${workspaceId}`)
}

// ── Template Library ──
export async function saveTemplate(name: string, type: string, content: any) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('document_templates')
    .insert({
      freelancer_id: user.id,
      name: name.trim(),
      type,
      content
    })

  if (error) {
    console.error('Error saving template:', error)
    throw new Error('Failed to save template')
  }
}

export async function deleteTemplate(templateId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('document_templates')
    .delete()
    .eq('id', templateId)

  if (error) {
    console.error('Error deleting template:', error)
    throw new Error('Failed to delete template')
  }
}

// ── Time Tracker ──

export async function startTimeLog(workspaceId: string, description: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Check if user already has a running timer
  const { data: running } = await supabase
    .from('time_logs')
    .select('id')
    .eq('user_id', user.id)
    .is('end_time', null)
    .limit(1)
    .maybeSingle()

  if (running) {
    throw new Error('You already have a running timer. Stop it first.')
  }

  const { data: log, error } = await supabase
    .from('time_logs')
    .insert({
      workspace_id: workspaceId,
      user_id: user.id,
      description: description.trim() || null,
      start_time: new Date().toISOString(),
    })
    .select('id, start_time, description')
    .single()

  if (error) {
    console.error('Error starting time log:', error)
    throw new Error('Failed to start timer')
  }

  return log
}

export async function stopTimeLog(logId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('time_logs')
    .update({ end_time: new Date().toISOString() })
    .eq('id', logId)
    .eq('user_id', user.id)
    .is('end_time', null)

  if (error) {
    console.error('Error stopping time log:', error)
    throw new Error('Failed to stop timer')
  }
}

export async function deleteTimeLog(logId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('time_logs')
    .delete()
    .eq('id', logId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting time log:', error)
    throw new Error('Failed to delete time entry')
  }
}

export async function submitWorkspaceReview(workspaceId: string, rating: number, comment: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Get workspace
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('client_id, freelancer_id')
    .eq('id', workspaceId)
    .single()

  if (!workspace || workspace.client_id !== user.id) {
    throw new Error('Only the client can submit a review')
  }

  // Insert review
  const { error } = await supabase
    .from('workspace_reviews')
    .insert({
      workspace_id: workspaceId,
      client_id: workspace.client_id,
      freelancer_id: workspace.freelancer_id,
      rating,
      comment
    })

  if (error) {
    console.error('Error submitting review:', error)
    throw new Error('Failed to submit review')
  }

  // Log activity
  await supabase
    .from('activity_log')
    .insert({
      workspace_id: workspaceId,
      user_id: user.id,
      action: 'submitted a workspace review',
      entity_type: 'review',
      entity_id: workspaceId
    })

  revalidatePath(`/workspace/${workspaceId}`)
}
