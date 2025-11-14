/**
 * API endpoint to cleanup expired push subscriptions
 * This should be called periodically (e.g., via cron job)
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Check for internal API secret (for cron jobs)
    const internalSecret = request.headers.get('x-internal-secret');
    const isAuthorized = internalSecret === process.env.INTERNAL_API_SECRET;

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // Call the cleanup function
    const { data, error } = await supabase.rpc('cleanup_expired_push_subscriptions');

    if (error) {
      console.error('[Cleanup] Error cleaning up subscriptions:', error);
      return NextResponse.json(
        { error: 'Failed to cleanup subscriptions', details: error.message },
        { status: 500 }
      );
    }

    const deletedCount = data || 0;

    console.log(`[Cleanup] Removed ${deletedCount} expired subscription(s)`);

    return NextResponse.json({
      success: true,
      deleted: deletedCount,
      message: `Cleaned up ${deletedCount} expired subscription(s)`,
    });

  } catch (error: any) {
    console.error('[Cleanup] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check how many subscriptions would be cleaned up
 * (without actually deleting them)
 */
export async function GET(request: NextRequest) {
  try {
    // Check for internal API secret
    const internalSecret = request.headers.get('x-internal-secret');
    const isAuthorized = internalSecret === process.env.INTERNAL_API_SECRET;

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // Query subscriptions that would be deleted
    const { data: toDelete, error } = await supabase
      .from('push_subscriptions')
      .select('id, user_id, last_verified, verification_failures')
      .or(`last_verified.lt.${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()},verification_failures.gte.3`);

    if (error) {
      console.error('[Cleanup] Error querying subscriptions:', error);
      return NextResponse.json(
        { error: 'Failed to query subscriptions', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: toDelete?.length || 0,
      subscriptions: toDelete || [],
    });

  } catch (error: any) {
    console.error('[Cleanup] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
