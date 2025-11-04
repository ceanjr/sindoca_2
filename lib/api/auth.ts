import { createClient } from '@/lib/supabase/client'
import bcrypt from 'bcryptjs'

export interface SignUpData {
  email: string
  password: string
  fullName: string
}

export interface ProfileData {
  fullName: string
  nickname?: string
  bio?: string
  birthday?: string
  favoriteColor?: string
}

/**
 * Sign up a new user
 * Profile is automatically created by database trigger
 */
export async function signUp({ email, password, fullName }: SignUpData) {
  const supabase = createClient()

  // Sign up with Supabase Auth
  // The database trigger will automatically create the profile
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (authError) throw authError

  return authData
}

/**
 * Sign in user
 */
export async function signIn(email: string, password: string) {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error

  return data
}

/**
 * Sign out user
 */
export async function signOut() {
  const supabase = createClient()

  const { error } = await supabase.auth.signOut()

  if (error) throw error
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}

/**
 * Get user profile
 */
export async function getUserProfile(userId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error

  return data
}

/**
 * Update user profile
 */
export async function updateProfile(userId: string, profileData: ProfileData) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('profiles')
    .update({
      full_name: profileData.fullName,
      nickname: profileData.nickname,
      bio: profileData.bio,
      birthday: profileData.birthday,
      favorite_color: profileData.favoriteColor,
    })
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error

  return data
}

/**
 * Upload avatar
 */
export async function uploadAvatar(userId: string, file: File) {
  const supabase = createClient()

  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}-${Math.random()}.${fileExt}`
  const filePath = `avatars/${fileName}`

  // Upload file
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file)

  if (uploadError) throw uploadError

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from('avatars').getPublicUrl(filePath)

  // Update profile with avatar URL
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', userId)

  if (updateError) throw updateError

  return publicUrl
}

/**
 * Verify secret answer for workspace invite
 */
export async function verifySecretAnswer(
  inviteCode: string,
  answer: string
): Promise<{ valid: boolean; workspaceId?: string }> {
  const supabase = createClient()

  const { data: workspace, error } = await supabase
    .from('workspaces')
    .select('id, secret_answer_hash, current_attempts, max_attempts')
    .eq('invite_code', inviteCode.toUpperCase())
    .single()

  if (error || !workspace) {
    throw new Error('Convite inválido ou não encontrado')
  }

  if (workspace.current_attempts >= workspace.max_attempts) {
    throw new Error('Máximo de tentativas excedido')
  }

  // Verify answer with bcrypt
  const valid = await bcrypt.compare(answer.toLowerCase(), workspace.secret_answer_hash)

  // Increment attempts if wrong
  if (!valid) {
    await supabase
      .from('workspaces')
      .update({ current_attempts: workspace.current_attempts + 1 })
      .eq('id', workspace.id)
  }

  return { valid, workspaceId: valid ? workspace.id : undefined }
}

/**
 * Get workspace by invite code
 */
export async function getWorkspaceByInviteCode(inviteCode: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('workspaces')
    .select('id, name, secret_question, current_attempts, max_attempts')
    .eq('invite_code', inviteCode.toUpperCase())
    .single()

  if (error) throw error

  return data
}

/**
 * Join workspace as partner
 */
export async function joinWorkspace(workspaceId: string, userId: string) {
  const supabase = createClient()

  // Add user to workspace_members
  const { error: memberError } = await supabase.from('workspace_members').insert({
    workspace_id: workspaceId,
    user_id: userId,
    role: 'partner',
  })

  if (memberError) throw memberError

  // Update workspace partner_id and status
  const { error: updateError } = await supabase
    .from('workspaces')
    .update({
      partner_id: userId,
      status: 'active',
    })
    .eq('id', workspaceId)

  if (updateError) throw updateError
}

/**
 * Sign in with Google
 */
export async function signInWithGoogle() {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) throw error

  return data
}

/**
 * Send magic link to email
 */
export async function sendMagicLink(email: string) {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) throw error

  return data
}
