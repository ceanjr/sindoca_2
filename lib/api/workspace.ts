import { createClient } from '@/lib/supabase/client'
import bcrypt from 'bcryptjs'

export interface CreateWorkspaceData {
  name: string
  secretQuestion: string
  secretAnswer: string
}

/**
 * Generate unique invite code
 */
async function generateUniqueInviteCode(): Promise<string> {
  const supabase = createClient()
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  let isUnique = false

  while (!isUnique) {
    code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    // Check if code already exists
    const { data } = await supabase
      .from('workspaces')
      .select('id')
      .eq('invite_code', code)
      .single()

    if (!data) {
      isUnique = true
    }
  }

  return code
}

/**
 * Create a new workspace
 */
export async function createWorkspace(
  userId: string,
  workspaceData: CreateWorkspaceData
) {
  const supabase = createClient()

  // Generate unique invite code
  const inviteCode = await generateUniqueInviteCode()

  // Hash secret answer
  const secretAnswerHash = await bcrypt.hash(
    workspaceData.secretAnswer.toLowerCase(),
    10
  )

  // Create workspace
  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .insert({
      name: workspaceData.name,
      invite_code: inviteCode,
      secret_question: workspaceData.secretQuestion,
      secret_answer_hash: secretAnswerHash,
      creator_id: userId,
    })
    .select()
    .single()

  if (workspaceError) throw workspaceError

  // Add creator as workspace member
  const { error: memberError } = await supabase.from('workspace_members').insert({
    workspace_id: workspace.id,
    user_id: userId,
    role: 'creator',
  })

  if (memberError) throw memberError

  return { workspace, inviteCode }
}

/**
 * Get user workspaces
 */
export async function getUserWorkspaces(userId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('workspace_members')
    .select(
      `
      workspace_id,
      role,
      joined_at,
      workspaces (
        id,
        name,
        invite_code,
        creator_id,
        partner_id,
        status,
        created_at
      )
    `
    )
    .eq('user_id', userId)

  if (error) throw error

  return data
}

/**
 * Get workspace by ID
 */
export async function getWorkspace(workspaceId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('workspaces')
    .select(
      `
      *,
      workspace_members (
        user_id,
        role,
        profiles (
          id,
          full_name,
          nickname,
          avatar_url
        )
      )
    `
    )
    .eq('id', workspaceId)
    .single()

  if (error) throw error

  return data
}

/**
 * Get workspace content
 */
export async function getWorkspaceContent(workspaceId: string, type?: string) {
  const supabase = createClient()

  let query = supabase
    .from('content')
    .select(
      `
      *,
      profiles:author_id (
        id,
        full_name,
        nickname,
        avatar_url
      ),
      reactions (
        id,
        type,
        user_id,
        comment
      )
    `
    )
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  if (type) {
    query = query.eq('type', type)
  }

  const { data, error } = await query

  if (error) throw error

  return data
}

/**
 * Add content to workspace
 */
export async function addContent(
  workspaceId: string,
  authorId: string,
  contentData: {
    type: string
    title?: string
    description?: string
    data?: any
    storagePath?: string
    category?: string
  }
) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('content')
    .insert({
      workspace_id: workspaceId,
      author_id: authorId,
      ...contentData,
    })
    .select()
    .single()

  if (error) throw error

  return data
}

/**
 * Delete content
 */
export async function deleteContent(contentId: string) {
  const supabase = createClient()

  const { error } = await supabase.from('content').delete().eq('id', contentId)

  if (error) throw error
}

/**
 * Toggle favorite
 */
export async function toggleFavorite(contentId: string, userId: string) {
  const supabase = createClient()

  // Check if already favorited
  const { data: existing } = await supabase
    .from('reactions')
    .select('id')
    .eq('content_id', contentId)
    .eq('user_id', userId)
    .eq('type', 'favorite')
    .single()

  if (existing) {
    // Remove favorite
    const { error } = await supabase
      .from('reactions')
      .delete()
      .eq('id', existing.id)

    if (error) throw error
    return false
  } else {
    // Add favorite
    const { error } = await supabase.from('reactions').insert({
      content_id: contentId,
      user_id: userId,
      type: 'favorite',
    })

    if (error) throw error
    return true
  }
}

/**
 * Add comment/reaction
 */
export async function addReaction(
  contentId: string,
  userId: string,
  type: string,
  comment?: string
) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('reactions')
    .insert({
      content_id: contentId,
      user_id: userId,
      type,
      comment,
    })
    .select()
    .single()

  if (error) throw error

  return data
}
