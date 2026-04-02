import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const client = new Anthropic()

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { startup, investorCriteria, score, reasons } = await req.json()

    const prompt = `You are a VC analyst for Techosystem's Venture Capital Committee. Write a concise 2-3 sentence investment rationale explaining why this startup is a strong (or weak) match for this investor. Be specific and insightful — focus on strategic fit, not just criteria labels.

Investor profile:
- Focus verticals: ${investorCriteria.focusVerticals?.join(', ') || 'Not specified'}
- Stage preference: ${investorCriteria.stagePreference?.join(', ') || 'Not specified'}
- Ticket size: ${investorCriteria.ticketSize?.join(', ') || 'Not specified'}
- Dual-use policy: ${investorCriteria.dualUsePolicy || 'Not specified'}

Startup:
- Name: ${startup.startupName}
- Description: ${startup.description || 'No description provided'}
- Verticals: ${startup.verticals?.join(', ') || 'Not specified'}
- Stage: ${startup.roundStage || 'Not specified'}
- Target raise: ${startup.targetRaise || 'Not specified'}
- Jurisdiction: ${startup.jurisdiction || 'Not specified'}
- Dual-use: ${startup.isDualUse || 'No'}

Rule-based match score: ${score}/100
Matching criteria: ${reasons?.join(', ') || 'None matched'}

Write exactly 2-3 sentences of investment rationale. No headers, no bullet points, plain text only.`

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    })

    const rationale = (message.content[0] as Anthropic.TextBlock).text
    return NextResponse.json({ rationale })
  } catch (e: any) {
    console.error('ai-match error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
