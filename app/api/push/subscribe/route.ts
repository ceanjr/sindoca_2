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

    // Save or update subscription in database
    const { data, error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: user.id,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      }, {
        onConflict: 'user_id,endpoint',
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

    console.log('[Subscribe] Subscription saved successfully:', data.id);

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
