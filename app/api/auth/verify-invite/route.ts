import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { answer } = await request.json()

    if (!answer || typeof answer !== 'string') {
      return NextResponse.json(
        { error: 'Resposta inválida' },
        { status: 400 }
      )
    }

    // Get the secret word from server environment variable
    const SECRET_WORD = process.env.INVITE_SECRET

    if (!SECRET_WORD) {
      return NextResponse.json(
        { error: 'Configuração do servidor incompleta' },
        { status: 500 }
      )
    }

    // Verify the answer
    const isValid = answer.toLowerCase().trim() === SECRET_WORD.toLowerCase().trim()

    if (!isValid) {
      return NextResponse.json(
        { error: 'Palavra-chave incorreta' },
        { status: 401 }
      )
    }

    // Get partner credentials from server environment
    const partnerEmail = process.env.PARTNER_EMAIL
    const partnerPassword = process.env.PARTNER_PASSWORD

    if (!partnerEmail || !partnerPassword) {
      return NextResponse.json(
        { error: 'Credenciais do parceiro não configuradas' },
        { status: 500 }
      )
    }

    // Return credentials only if answer is correct
    return NextResponse.json({
      valid: true,
      credentials: {
        email: partnerEmail,
        password: partnerPassword,
      },
    })
  } catch (error) {
    console.error('Verify invite error:', error)
    return NextResponse.json(
      { error: 'Erro ao verificar convite' },
      { status: 500 }
    )
  }
}
