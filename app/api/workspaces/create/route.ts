import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateRandomIcon } from '@/lib/utils/workspaceIcons';

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
    const { name } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Nome do espaço é obrigatório' },
        { status: 400 }
      );
    }

    // Gerar código de convite único
    const { data: codeData, error: codeError } = await supabase.rpc(
      'generate_unique_invite_code'
    );

    if (codeError) {
      console.error('Error generating invite code:', codeError);
      return NextResponse.json(
        { error: 'Erro ao gerar código de convite' },
        { status: 500 }
      );
    }

    const inviteCode = codeData as string;
    const randomIcon = generateRandomIcon();

    // Criar workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .insert({
        name: name.trim(),
        invite_code: inviteCode,
        icon: randomIcon,
        creator_id: user.id,
        status: 'active',
      })
      .select()
      .single();

    if (workspaceError) {
      console.error('Error creating workspace:', workspaceError);
      throw workspaceError;
    }

    // Adicionar criador como membro
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

    console.log(
      `✅ Created workspace ${workspace.id} with code ${inviteCode}`
    );

    return NextResponse.json({
      success: true,
      workspace,
      inviteCode,
    });
  } catch (error: any) {
    console.error('❌ Error in POST /api/workspaces/create:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao criar espaço' },
      { status: 500 }
    );
  }
}
