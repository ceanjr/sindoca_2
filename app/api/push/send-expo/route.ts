import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const { userId, title, body, data } = await request.json();

    if (!userId || !title || !body) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, title, body' },
        { status: 400 }
      );
    }

    // Fetch Expo push tokens for the user
    const { data: subscriptions, error: fetchError } = await supabase
      .from('push_subscriptions_native')
      .select('expo_push_token')
      .eq('user_id', userId);

    if (fetchError) {
      console.error('Error fetching push tokens:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch push tokens', details: fetchError.message },
        { status: 500 }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json(
        { error: 'No push tokens found for this user' },
        { status: 404 }
      );
    }

    const tokens = subscriptions.map(s => s.expo_push_token);

    // Create messages for Expo Push API
    const messages = tokens.map(token => ({
      to: token,
      sound: 'default',
      title,
      body,
      data: data || {},
      badge: 1,
      priority: 'high',
    }));

    // Send via Expo Push API
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Expo Push API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to send push notification', details: errorText },
        { status: response.status }
      );
    }

    const result = await response.json();

    // Check for errors in the response
    const hasErrors = result.data?.some((item: any) => item.status === 'error');
    if (hasErrors) {
      console.error('Some notifications failed:', result.data);
    }

    return NextResponse.json({
      success: true,
      sent: messages.length,
      result,
    });
  } catch (error: any) {
    console.error('Error sending push notification:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
