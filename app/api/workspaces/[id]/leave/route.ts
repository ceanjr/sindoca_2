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

    // Verificar quantos workspaces ativos o usuário possui
    const { count } = await supabase
      .from('workspace_members')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('left_at', null);

    if (count === null || count <= 1) {
      return NextResponse.json(
        {
          error:
            'Você deve ter pelo menos um espaço ativo. Crie ou entre em outro espaço antes de sair deste.',
        },
        { status: 400 }
      );
    }

    // Sair do workspace (soft delete)
    const { error: updateError } = await supabase
      .from('workspace_members')
      .update({ left_at: new Date().toISOString() })
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .is('left_at', null);

    if (updateError) {
      console.error('Error leaving workspace:', updateError);
      throw updateError;
    }

    console.log(`✅ User ${user.id} left workspace ${workspaceId}`);

    // Trigger auto_archive_empty_workspaces() será chamado automaticamente
    // se for o último membro

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ Error in POST /api/workspaces/[id]/leave:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao sair do espaço' },
      { status: 500 }
    );
  }
}
