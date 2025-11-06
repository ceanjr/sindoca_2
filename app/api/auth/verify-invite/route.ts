import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { answer } = await request.json();

    console.log('🔍 Verify invite request:', { answer });

    if (!answer || typeof answer !== 'string') {
      console.error('❌ Invalid answer type');
      return NextResponse.json({ error: 'Resposta inválida' }, { status: 400 });
    }

    // Get the secret word from server environment variable
    const SECRET_WORD = process.env.INVITE_SECRET;

    console.log('🔑 Secret word from env:', SECRET_WORD ? 'Found' : 'NOT FOUND');

    if (!SECRET_WORD) {
      console.error('❌ INVITE_SECRET not found in environment');
      return NextResponse.json(
        { error: 'Configuração do servidor incompleta' },
        { status: 500 }
      );
    }

    // Check if answer contains the secret word (case insensitive)
    const normalizedAnswer = answer.toLowerCase().trim();
    const normalizedSecret = SECRET_WORD.toLowerCase().trim();
    const isValid = normalizedAnswer.includes(normalizedSecret);

    console.log('🔍 Validation:', {
      answer: normalizedAnswer,
      secret: normalizedSecret,
      isValid,
    });

    if (!isValid) {
      console.error('❌ Answer does not contain secret word');
      return NextResponse.json(
        { error: 'Palavra-chave incorreta' },
        { status: 401 }
      );
    }

    // Get partner credentials from server environment
    const partnerEmail = process.env.PARTNER_EMAIL;
    const partnerPassword = process.env.PARTNER_PASSWORD;

    console.log('🔑 Partner credentials:', {
      email: partnerEmail ? 'Found' : 'NOT FOUND',
      password: partnerPassword ? 'Found' : 'NOT FOUND',
    });

    if (!partnerEmail || !partnerPassword) {
      console.error('❌ Partner credentials not found in environment');
      return NextResponse.json(
        { error: 'Credenciais do parceiro não configuradas' },
        { status: 500 }
      );
    }

    console.log('✅ Validation successful, returning credentials');

    // Return credentials only if answer is correct
    return NextResponse.json({
      valid: true,
      credentials: {
        email: partnerEmail,
        password: partnerPassword,
      },
    });
  } catch (error) {
    console.error('❌ Verify invite error:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar convite' },
      { status: 500 }
    );
  }
}
