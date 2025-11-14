import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { inviteCode } = body;

    if (!inviteCode?.trim()) {
      return NextResponse.json(
        { error: 'Código de convite é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar workspace pelo código de convite
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('*')
      .eq('invite_code', inviteCode.trim().toUpperCase())
      .in('status', ['active', 'disabled']) // Não permitir join em archived
      .single();

    if (workspaceError || !workspace) {
      console.log('Workspace not found for code:', inviteCode);
      return NextResponse.json(
        { error: 'Código de convite inválido ou expirado' },
        { status: 404 }
      );
    }

    // Verificar se já é membro
    const { data: existingMember } = await supabase
      .from('workspace_members')
      .select('*')
      .eq('workspace_id', workspace.id)
      .eq('user_id', user.id)
      .is('left_at', null)
      .single();

    if (existingMember) {
      return NextResponse.json(
        { error: 'Você já faz parte deste espaço' },
        { status: 400 }
      );
    }

    // Adicionar usuário como membro
    const { error: memberError } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: workspace.id,
        user_id: user.id,
        role: 'member',
      });

    if (memberError) {
      console.error('Error adding member:', memberError);
      throw memberError;
    }

    console.log(`✅ User ${user.id} joined workspace ${workspace.id}`);

    return NextResponse.json({
      success: true,
      workspace,
    });
  } catch (error: any) {
    console.error('❌ Error in POST /api/workspaces/join:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao entrar no espaço' },
      { status: 500 }
    );
  }
}
