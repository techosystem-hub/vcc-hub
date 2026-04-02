import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const client = new Anthropic()

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { startup, investorCriteria, score, reasons } = await req.json()

    const prompt = `You are a VC analyst reviewing publicly available information about a startup.

Write a concise 2-3 sentence company overview based on the startup's public profile (website, LinkedIn, news). Highlight: what the company does, the problem it solves, and why it may be relevant for an investor focused on ${investorCriteria.focusVerticals?.join(', ') || 'these verticals'} at the ${investorCriteria.stagePreference?.join(', ') || 'relevant'} stage with a ${investorCriteria.ticketSize?.join(', ') || 'standard'} ticket size.

Company:
- Name: ${startup.startupName}
- Sector: ${startup.verticals?.join(', ') || 'Not specified'}
- Stage: ${startup.roundStage || 'Not specified'}
- Target raise: ${startup.targetRaise || 'Not specified'}
- Location: ${startup.jurisdiction || 'Not specified'}
- Description: ${startup.description || 'No description available'}

Write exactly 2-3 sentences about the company and its market relevance to this investor profile. Plain text only, no headers or bullet points.`

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
