import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const workspaceId = params.id;

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar se é membro do workspace
    const { data: member } = await supabase
      .from('workspace_members')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .is('left_at', null)
      .single();

    if (!member) {
      return NextResponse.json(
        { error: 'Você não faz parte deste espaço' },
        { status: 403 }
      );
    }

    // Reativar workspace (apenas se estiver disabled)
    const { error: updateError } = await supabase
      .from('workspaces')
      .update({ status: 'active' })
      .eq('id', workspaceId)
      .eq('status', 'disabled'); // Só reativar se estiver disabled

    if (updateError) {
      console.error('Error enabling workspace:', updateError);
      throw updateError;
    }

    console.log(`✅ Workspace ${workspaceId} enabled by ${user.id}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ Error in POST /api/workspaces/[id]/enable:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao reativar espaço' },
      { status: 500 }
    );
  }
}
