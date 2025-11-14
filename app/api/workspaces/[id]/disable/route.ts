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

    // Desabilitar workspace
    const { error: updateError } = await supabase
      .from('workspaces')
      .update({ status: 'disabled' })
      .eq('id', workspaceId);

    if (updateError) {
      console.error('Error disabling workspace:', updateError);
      throw updateError;
    }

    console.log(`✅ Workspace ${workspaceId} disabled by ${user.id}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ Error in POST /api/workspaces/[id]/disable:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao desativar espaço' },
      { status: 500 }
    );
  }
}
