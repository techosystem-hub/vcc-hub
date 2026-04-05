// ─────────────────────────────────────────────────────────────────────────────
// POST /api/executive-summary
// Generates (or returns cached) an AI executive summary based on verified facts.
// Inputs: { startupId, startupName, websiteUrl?, pitchDeckUrl? }
// Stores result in VCC Matches table per (MemberClerkID x StartupID).
// ─────────────────────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import Anthropic from '@anthropic-ai/sdk'
import { getVccMatch, saveExecutiveSummary, upsertVccMatch } from '@/lib/matches'

const client = new Anthropic()

async function fetchWebsiteText(url: string): Promise<string> {
  try {
    const ctrl = new AbortController()
    const tid = setTimeout(() => ctrl.abort(), 6000)
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VCCBot/1.0)' },
    })
    clearTimeout(tid)
    const html = await res.text()
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 5000)
  } catch {
    return ''
  }
}

export async function POST(req: NextRequest) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { startupId, startupName, websiteUrl, pitchDeckUrl } = await req.json()
    if (!startupId) return NextResponse.json({ error: 'Missing startupId' }, { status: 400 })

    const memberClerkId = user.id

    // ── 1. Return cached summary if it exists ────────────────────────────────
    const existing = await getVccMatch(memberClerkId, startupId)
    if (existing?.fields?.ExecutiveSummary) {
      return NextResponse.json({ summary: existing.fields.ExecutiveSummary, cached: true })
    }

    // ── 2. Ensure VCC match record exists ───────────────────────────────────
    const currentStatus = existing?.fields?.Status || 'Interested'
    await upsertVccMatch(memberClerkId, startupId, startupName || 'Unknown', currentStatus)

    // ── 3. Fetch public source material ─────────────────────────────────────
    let websiteContent = ''
    if (websiteUrl) {
      websiteContent = await fetchWebsiteText(websiteUrl)
    }

    const sourceBlock = [
      websiteUrl ? `Website URL: ${websiteUrl}` : null,
      pitchDeckUrl ? `Pitch Deck URL: ${pitchDeckUrl}` : null,
      websiteContent ? `\nExtracted website content:\n${websiteContent}` : null,
    ]
      .filter(Boolean)
      .join('\n')

    // ── 4. Build analyst prompt ─────────────────────────────────────────────
    const sectionNames = [
      '1. What They Do',
      '2. Market & Problem',
      '3. Traction & Validation',
      '4. Business Model',
      '5. Competitive Position',
      '6. Team',
      '7. Key Risks',
      '8. Investment Considerations',
    ].join('\n')

    const noSource = 'No source material could be retrieved. State this clearly in each section.'

    const prompt = [
      'You are a senior investment analyst. Produce a factual executive summary for the startup below, intended for a Venture Capital Committee.',
      '',
      'STRICT RULES:',
      '- Include ONLY facts directly supported by the source material provided.',
      '- If information for a section is not available, write: "Not confirmed from available sources."',
      '- Do NOT speculate, assume, or infer beyond what the data explicitly states.',
      '- Do NOT mention any consulting firms, industry analysts, or third-party research firms by name.',
      '- Cross-reference every claim across available sources.',
      '- Format your entire response as clean HTML:',
      '  Use <h3> for section headings, <p> for paragraphs, <strong> for key terms, <ul>/<li> for lists.',
      '- Do NOT use markdown syntax (no #, no *, no **).',
      '',
      'Startup name: ' + startupName,
      '',
      sourceBlock || noSource,
      '',
      'Write the following 8 sections in order. Start each with an <h3> tag:',
      sectionNames,
      '',
      'Be concise. Be direct. Cite the source when stating a fact.',
    ].join('\n')

    // ── 5. Generate via Claude API ──────────────────────────────────────────
    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    const summary =
      message.content[0].type === 'text'
        ? message.content[0].text
        : 'Summary unavailable.'

    // ── 6. Cache in Airtable ─────────────────────────────────────────────────
    await saveExecutiveSummary(memberClerkId, startupId, summary)

    return NextResponse.json({ summary, cached: false })
  } catch (e: any) {
    console.error('executive-summary error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
