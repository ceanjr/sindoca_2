/**
 * API helpers for reactions with push notifications
 */
import { createClient } from '@/lib/supabase/client';

/**
 * Add a reaction and send push notification to content author
 * @param {string} contentId - Content ID
 * @param {string} userId - User ID who is reacting
 * @param {string} emoji - Emoji to react with
 * @param {object} contentInfo - Information about the content (type, title, authorId)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function addReactionWithNotification(contentId, userId, emoji, contentInfo) {
  try {
    const supabase = createClient();

    // Check if user already has a reaction
    const { data: existing } = await supabase
      .from('reactions')
      .select('id')
      .eq('content_id', contentId)
      .eq('user_id', userId)
      .eq('type', 'emoji')
      .single();

    // Add or update reaction
    if (existing) {
      const { error } = await supabase
        .from('reactions')
        .update({ emoji })
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('reactions')
        .insert({
          content_id: contentId,
          user_id: userId,
          type: 'emoji',
          emoji,
        });

      if (error) throw error;
    }

    // Only send notification if the user is not the author
    if (contentInfo.authorId && contentInfo.authorId !== userId) {
      // Call API route to send notification (this happens in the background)
      fetch('/api/reactions/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId,
          emoji,
          contentInfo,
        }),
      }).catch(err => {
        // Fail silently - notification is not critical
        console.error('Failed to send notification:', err);
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error adding reaction with notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Remove a reaction
 * @param {string} contentId - Content ID
 * @param {string} userId - User ID who is removing the reaction
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function removeReactionWithNotification(contentId, userId) {
  try {
    const supabase = createClient();

    const { error } = await supabase
      .from('reactions')
      .delete()
      .eq('content_id', contentId)
      .eq('user_id', userId)
      .eq('type', 'emoji');

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error removing reaction:', error);
    return { success: false, error: error.message };
  }
}
