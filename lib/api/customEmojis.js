/**
 * API functions for custom emojis
 */

import { createClient } from '@/lib/supabase/client';

/**
 * Get user's custom emojis
 */
export async function getUserCustomEmojis(userId) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('custom_emojis')
    .select('*')
    .eq('user_id', userId)
    .order('last_used_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Add a custom emoji for user
 */
export async function addCustomEmoji(userId, emoji) {
  const supabase = createClient();

  // Check if emoji already exists for this user
  const { data: existing } = await supabase
    .from('custom_emojis')
    .select('id')
    .eq('user_id', userId)
    .eq('emoji', emoji)
    .single();

  if (existing) {
    // Update last_used_at
    const { error } = await supabase
      .from('custom_emojis')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', existing.id);

    if (error) throw error;
    return existing;
  }

  // Insert new emoji
  const { data, error } = await supabase
    .from('custom_emojis')
    .insert({
      user_id: userId,
      emoji,
      last_used_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update last_used_at for an emoji
 */
export async function updateEmojiUsage(userId, emoji) {
  const supabase = createClient();

  const { error } = await supabase
    .from('custom_emojis')
    .update({ last_used_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('emoji', emoji);

  if (error) console.error('Error updating emoji usage:', error);
}

/**
 * Delete unused emojis (older than 7 days)
 * This can be called periodically or triggered manually
 */
export async function deleteUnusedEmojis(userId) {
  const supabase = createClient();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { error } = await supabase
    .from('custom_emojis')
    .delete()
    .eq('user_id', userId)
    .lt('last_used_at', sevenDaysAgo.toISOString());

  if (error) throw error;
}
