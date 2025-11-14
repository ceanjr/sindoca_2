import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const workspaceId = params.id;
    console.log('🔄 PATCH /api/workspaces/[id]/update - workspaceId:', workspaceId);

    // 1. Authenticate
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('❌ Authentication failed:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('✅ User authenticated:', user.id);

    // 2. Parse body
    const body = await request.json();
    const { name, icon } = body;
    console.log('📝 Request body:', { name, icon });

    if (!name || !name.trim()) {
      console.error('❌ Name is required');
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    // 3. Verificar se user é membro do workspace
    console.log('🔍 Checking membership for workspace:', workspaceId);
    const { data: membership, error: memberError } = await supabase
      .from('workspace_members')
      .select('user_id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .is('left_at', null)
      .single();

    if (memberError) {
      console.error('❌ Membership check error:', {
        code: memberError.code,
        message: memberError.message,
        details: memberError.details,
        hint: memberError.hint,
      });
      return NextResponse.json(
        { error: `Erro ao verificar membership: ${memberError.message}` },
        { status: 500 }
      );
    }

    if (!membership) {
      console.error('❌ User is not a member of workspace');
      return NextResponse.json(
        { error: 'Você não é membro deste espaço' },
        { status: 403 }
      );
    }
    console.log('✅ Membership verified');

    // 4. Atualizar workspace
    const updateData: any = {
      name: name.trim(),
    };

    if (icon) {
      updateData.icon = icon;
    }

    console.log('💾 Updating workspace with data:', updateData);
    const { error: updateError } = await supabase
      .from('workspaces')
      .update(updateData)
      .eq('id', workspaceId);

    if (updateError) {
      console.error('❌ Error updating workspace:', {
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
      });
      return NextResponse.json(
        { error: `Erro ao atualizar: ${updateError.message}` },
        { status: 500 }
      );
    }

    console.log('✅ Workspace updated successfully');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ Unexpected error in update workspace:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar espaço' },
      { status: 500 }
    );
  }
}
