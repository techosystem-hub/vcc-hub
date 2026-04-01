// POST /api/remove-from-saved
// Marks ALL match records for investor+startup as "Not Interested".
// Handles duplicate Airtable records by querying on the composite Match ID.
// Accepts: { startupId } — Airtable record ID of the startup (e.g. "recXXX")

import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { getInvestorByEmail } from '@/lib/airtable'

const BASE_ID = process.env.AIRTABLE_BASE_ID!
const TOKEN   = process.env.AIRTABLE_API_TOKEN!
const ROOT    = `https://api.airtable.com/v0/${BASE_ID}`
const HEADERS = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const user  = await currentUser()
    const email = user?.emailAddresses?.[0]?.emailAddress
    if (!email) return NextResponse.json({ error: 'No email' }, { status: 400 })

    const investor = await getInvestorByEmail(email)
    if (!investor) return NextResponse.json({ error: 'Investor not found' }, { status: 404 })

    const { startupId } = await req.json()
    if (!startupId) return NextResponse.json({ error: 'Missing startupId' }, { status: 400 })

    // Match ID is formed as: last6(investor.id) + '-' + last6(startup.id)
    const matchId = `${investor.id.slice(-6)}-${startupId.slice(-6)}`

    // Find ALL records with this Match ID (catches duplicates)
    const formula = encodeURIComponent(`{Match ID} = "${matchId}"`)
    const searchRes = await fetch(
      `${ROOT}/Matches?filterByFormula=${formula}`,
      { headers: { Authorization: `Bearer ${TOKEN}` }, cache: 'no-store' }
    )
    if (!searchRes.ok) {
      const err = await searchRes.json()
      return NextResponse.json({ error: err.error?.message || 'Search failed' }, { status: 500 })
    }
    const searchData = await searchRes.json()
    const records: { id: string }[] = searchData.records ?? []

    if (records.length === 0) {
      return NextResponse.json({ success: true, updated: 0 })
    }

    // Batch PATCH all records to "Not Interested" (Airtable allows up to 10 per request)
    const chunks: { id: string }[][] = []
    for (let i = 0; i < records.length; i += 10) {
      chunks.push(records.slice(i, i + 10))
    }
    for (const chunk of chunks) {
      await fetch(`${ROOT}/Matches`, {
        method: 'PATCH',
        headers: HEADERS,
        body: JSON.stringify({
          records: chunk.map(r => ({
            id: r.id,
            fields: { 'Match Status': 'Not Interested' },
          })),
        }),
      })
    }

    return NextResponse.json({ success: true, updated: records.length })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
