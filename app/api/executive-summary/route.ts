// ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// POST /api/executive-summary
// Generates (or returns cached) a McKinsey-level AI executive summary.
// Inputs: { startupId, startupName, websiteUrl?, pitchDeckUrl? }
// Stores result in VCC Matches table per (MemberClerkID Ã StartupID).
// ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import Anthropic from '@anthropic-ai/sdk'
import { getVccMatch, saveExecutiveSummary, upsertVccMatch } from '@/lib/matches'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { startupId, startupName, websiteUrl, pitchDeckUrl } = await req.json()
    if (!startupId) return NextResponse.json({ error: 'Missing startupId' }, { status: 400 })

    const memberClerkId = user.id

    // ââ 1. Return cached summary if it exists ââââââââââââââââââââââââââââââ
    const existing = await getVccMatch(memberClerkId, startupId)
    if (existing?.fields?.ExecutiveSummary) {
      return NextResponse.json({ summary: existing.fields.ExecutiveSummary, cached: true })
    }

    // ââ 2. Ensure VCC match record exists ââââââââââââââââââââââââââââââââââ
    const currentStatus = existing?.fields?.Status || 'Interested'
    await upsertVccMatch(memberClerkId, startupId, startupName || 'Unknown', currentStatus)

    // ââ 3. Build analyst prompt ââââââââââââââââââââââââââââââââââââââââââââ
    const sources: string[] = []
    if (websiteUrl) sources.push(`Website: ${websiteUrl}`)
    if (pitchDeckUrl) sources.push(`Pitch Deck: ${pitchDeckUrl}`)
    const sourcesText =
      sources.length > 0
        ? `Available sources:\n${sources.join('\n')}`
        : 'No direct URL sources available. Reason from the startup name and context.'

    const prompt = `You are a senior investment analyst at a top-tier VC firm with McKinsey-level rigor. Produce a concise executive summary for the startup below that a Venture Capital Committee (VCC) member can read in under 2 minutes.

Startup: ${startupName}
${sourcesText}

Structure your response with these exact headers:

**1. What They Do**
2-3 sentences: product, customer segment, core value proposition.

**2. Market Opportunity**
TAM sizing, market dynamics, timing thesis.

**3. Traction & Validation**
Key metrics, customer evidence, revenue signals if available.

**4. Business Model**
How they make money, unit economics logic.

**5. Competitive Moat**
Defensibility, unfair advantages, key differentiators vs. alternatives.

**6. Team Signal**
Founding team strengths, relevant background, execution indicators.

**7. Key Risks**
- Risk 1
- Risk 2
- Risk 3

**8. Investment Thesis**
One paragraph: why this could be a compelling VCC investment opportunity, or the key questions that must be resolved before conviction.

Be direct and analytical. Use specific language. If information is unavailable for a section, note it briefly and reason from available signals. Do not pad with generic statements.`

    // ââ 4. Generate via Claude API âââââââââââââââââââââââââââââââââââââââââ
    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })

    const summary =
      message.content[0].type === 'text' ? message.content[0].text : 'Summary unavailable.'

    // ââ 5. Cache in Airtable âââââââââââââââââââââââââââââââââââââââââââââââ
    await saveExecutiveSummary(memberClerkId, startupId, summary)

    return NextResponse.json({ summary, cached: false })
  } catch (e: any) {
    console.error('executive-summary error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
