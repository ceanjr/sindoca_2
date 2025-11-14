/**
 * API endpoint to save/update push notification subscriptions
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    console.log('[Subscribe] POST request received');
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[Subscribe] Auth error:', authError?.message || 'No user');
      return NextResponse.json(
        { error: 'Unauthorized', details: authError?.message },
        { status: 401 }
      );
    }

    console.log('[Subscribe] Authenticated user:', user.id, user.email);

    // Get subscription data from request
    const { subscription } = await request.json();

    if (!subscription || !subscription.endpoint) {
      console.error('[Subscribe] Invalid subscription data:', subscription);
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      );
    }

    console.log('[Subscribe] Saving subscription for user:', user.id);
    console.log('[Subscribe] Endpoint:', subscription.endpoint?.substring(0, 50) + '...');

    // Primeiro, verificar se já existe esta subscription exata
    const { data: existing } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .eq('endpoint', subscription.endpoint)
      .maybeSingle();

    if (existing) {
      console.log('[Subscribe] Subscription already exists, updating:', existing.id);

      // Atualizar subscription existente
      const { data, error } = await supabase
        .from('push_subscriptions')
        .update({
          keys: subscription.keys,
          last_verified: new Date().toISOString(),
          verification_failures: 0,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('[Subscribe] Database error:', error);
        return NextResponse.json(
          { error: 'Failed to update subscription', details: error.message },
          { status: 500 }
        );
      }

      console.log('[Subscribe] Subscription updated successfully:', data.id);

      return NextResponse.json({
        success: true,
        subscription: data,
      });
    }

    // Se não existe, remover outras subscriptions antigas do mesmo user e criar nova
    console.log('[Subscribe] Removing old subscriptions for user:', user.id);
    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user.id);

    // Inserir nova subscription
    const { data, error } = await supabase
      .from('push_subscriptions')
      .insert({
        user_id: user.id,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      })
      .select()
      .single();

    if (error) {
      console.error('[Subscribe] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to save subscription', details: error.message },
        { status: 500 }
      );
    }

    console.log('[Subscribe] New subscription saved successfully:', data.id);

    return NextResponse.json({
      success: true,
      subscription: data,
    });

  } catch (error: any) {
    console.error('Error in push subscribe:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get endpoint to delete
    const { endpoint } = await request.json();

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint is required' },
        { status: 400 }
      );
    }

    // Delete subscription
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('endpoint', endpoint);

    if (error) {
      console.error('Error deleting subscription:', error);
      return NextResponse.json(
        { error: 'Failed to delete subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error in push unsubscribe:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
