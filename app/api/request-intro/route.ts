// ─────────────────────────────────────────────────────────────
// POST /api/request-intro
// Creates or updates a record in Airtable Matches table.
// Accepts: { startupId, score, scoreLabel, reasons, status? }
//   status: 'Interested' (default) | 'Not Interested'
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getInvestorByEmail } from '@/lib/airtable'

const BASE_ID = process.env.AIRTABLE_BASE_ID!
const TOKEN   = process.env.AIRTABLE_API_TOKEN!
const ROOT    = `https://api.airtable.com/v0/${BASE_ID}`

// Valid singleSelect options for the Matches table in Airtable
const VALID_MATCH_STATUSES = ['Pending', 'Interested', 'Not Interested', 'Intro Sent']
const VALID_SCORE_LABELS   = ['🔥 Hot', '💪 Strong', '👍 Good', '😐 Weak']

function safeSelect(value: string | undefined, allowed: string[]): string | undefined {
  return value && allowed.includes(value) ? value : undefined
}


async function notifySlack(investorName: string, startupId: string) {
  const webhookUrl = process.env.NOTIFY_WEBHOOK_URL
  if (!webhookUrl) return

  try {
    const startupRes = await fetch(
      `${ROOT}/${encodeURIComponent('Startup Pipeline')}/${startupId}`,
      { headers: { Authorization: `Bearer ${TOKEN}` } }
    )
    if (!startupRes.ok) return
    const startup = await startupRes.json()
    const startupName = startup.fields?.['Startup Name'] || 'Unknown Startup'
    const sector = (startup.fields?.['Primary Vertical'] || ['Unknown'])[0]
    const stage = startup.fields?.['Investment Stage'] || 'Unknown'

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `*New Intro Request*\nInvestor: ${investorName}\nStartup: ${startupName}\nSector: ${sector} | Stage: ${stage}\nTime: ${new Date().toISOString()}`,
      }),
    })
  } catch {}
}

export async function POST(req: NextRequest) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const email = user?.emailAddresses?.[0]?.emailAddress
    if (!email) return NextResponse.json({ error: 'No email' }, { status: 400 })

    const body = await req.json()
    const { startupId, score, scoreLabel, reasons, status } = body
    if (!startupId) return NextResponse.json({ error: 'Missing startupId' }, { status: 400 })

    // Default status is 'Interested'; validate against allowed options
    const matchStatus = safeSelect(status, VALID_MATCH_STATUSES) ?? 'Interested'

    const investor = await getInvestorByEmail(email)
    if (!investor) return NextResponse.json({ error: 'Investor not found' }, { status: 404 })

    // Check whether a match record for this investor + startup already exists
    const formula = `{Match ID} = "${investor.id.slice(-6)}-${startupId.slice(-6)}"`
    const checkRes = await fetch(
      `${ROOT}/${encodeURIComponent('Matches')}?filterByFormula=${encodeURIComponent(formula)}&maxRecords=1`,
      { headers: { Authorization: `Bearer ${TOKEN}` } }
    )
    const checkData = await checkRes.json()

    const matchFields: Record<string, any> = {
      'Match Status': matchStatus,
    }
    if (!isNaN(Number(score)) && Number(score) > 0) matchFields['Score'] = Number(score)
    const safeLbl = safeSelect(scoreLabel, VALID_SCORE_LABELS)
    if (safeLbl) matchFields['Score Label'] = safeLbl
    if (Array.isArray(reasons) && reasons.length > 0) {
      matchFields['Notes'] = reasons.join('\n')
    }

    if (checkData.records?.length > 0) {
      // ── Update ALL matching records (handles duplicates) ───
      const allIds: string[] = checkData.records.map((r: any) => r.id)
      const chunks: string[][] = []
      for (let i = 0; i < allIds.length; i += 10) chunks.push(allIds.slice(i, i + 10))
      for (const chunk of chunks) {
        const patchRes = await fetch(`${ROOT}/${encodeURIComponent('Matches')}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            records: chunk.map(id => ({ id, fields: matchFields })),
          }),
        })
        if (!patchRes.ok) {
          const err = await patchRes.json()
          return NextResponse.json(
            { error: err.error?.message || 'Failed to update match' },
            { status: 500 }
          )
        }
      }
      // ── Slack notification (non-blocking) ────
      notifySlack(investor.name, startupId).catch(err => console.error('Slack failed:', err.message))

      return NextResponse.json({ success: true, matchId: allIds[0] })
    }

    // ── Create new record ────────────────────────────────────
    const matchId = `${investor.id.slice(-6)}-${startupId.slice(-6)}`
    const createRes = await fetch(
      `${ROOT}/${encodeURIComponent('Matches')}`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            'Match ID': matchId,
            'Investor': [investor.id],
            'Startup':  [startupId],
            ...matchFields,
          },
        }),
      }
    )

    if (!createRes.ok) {
      const err = await createRes.json()
      return NextResponse.json(
        { error: err.error?.message || 'Failed to create match' },
        { status: 500 }
      )
    }
    const created = await createRes.json()
    // ── Slack notification (non-blocking) ────
    notifySlack(investor.name, startupId).catch(err => console.error('Slack failed:', err.message))

    return NextResponse.json({ success: true, matchId: created.id })
  } catch (e: any) {
    console.error('request-intro error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
