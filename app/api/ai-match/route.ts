import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const client = new Anthropic()

// ── Rate limiting: 10 calls/min per user ─────────────────────────────────
const rateLimitMap = new Map<string, number[]>()

function isRateLimited(userId: string): boolean {
  const now = Date.now()
  const calls = rateLimitMap.get(userId) || []
  const recent = calls.filter((t) => now - t < 60_000)
  rateLimitMap.set(userId, [...recent, now])
  return recent.length >= 10
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (isRateLimited(userId)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  try {
    const { startup, investorCriteria, score, reasons } = await req.json()

    const prompt = `You are a VC analyst reviewing publicly available information about a startup.

Using the company identifiers below, write a concise 2-3 sentence overview of what this specific company does, the problem it solves, and why it may be relevant for an investor focused on ${investorCriteria.focusVerticals?.join(', ') || 'these verticals'} at ${investorCriteria.stagePreference?.join(', ') || 'early'} stage with a ${investorCriteria.ticketSize?.join(', ') || 'standard'} ticket size.

Use ALL identifiers below to ensure you are describing the correct company — not a different company with a similar name. Base your analysis on publicly available sources (website, LinkedIn, news).

Company identifiers:
- Name: ${startup.startupName}
- Website / LinkedIn: ${startup.website || 'Not provided'}
- Jurisdiction: ${startup.jurisdiction || 'Not specified'}
- Email domain: ${startup.email ? '@' + startup.email.split('@')[1] : 'Not provided'}
- Sector: ${startup.verticals?.join(', ') || 'Not specified'}
- Stage: ${startup.roundStage || 'Not specified'}
- Target raise: ${startup.targetRaise || 'Not specified'}
- Description: ${startup.description || 'None'}

Write exactly 2-3 sentences. Plain text only, no headers or bullet points.`

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
