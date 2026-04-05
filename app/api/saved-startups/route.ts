// ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// GET /api/saved-startups
// Returns all startups where the investor has expressed interest
// (Match Status = 'Interested' or 'Intro Sent'), enriched with
// full startup details including contact info.
// ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getInvestorByEmail } from '@/lib/airtable'

const BASE_ID = process.env.AIRTABLE_BASE_ID!
const TOKEN = process.env.AIRTABLE_API_TOKEN!
const ROOT = `https://api.airtable.com/v0/${BASE_ID}`
const AT_HEADERS = { Authorization: `Bearer ${TOKEN}` }

export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const email = user?.emailAddresses?.[0]?.emailAddress
    if (!email) return NextResponse.json({ error: 'No email' }, { status: 400 })

    const investor = await getInvestorByEmail(email)
    if (!investor) return NextResponse.json({ error: 'Investor not found' }, { status: 404 })

    // ââ 1. Fetch matches for this investor with Interested / Intro Sent status ââ
    const matchFormula = encodeURIComponent(
      `AND({Investor} = "${investor.name}",OR({Match Status}="Interested",{Match Status}="Intro Sent"))`
    )
    const matchRes = await fetch(
      `${ROOT}/${encodeURIComponent('Matches')}?filterByFormula=${matchFormula}&maxRecords=100`,
      { headers: AT_HEADERS, cache: 'no-store' }
    )
    const matchData = await matchRes.json()
    if (!matchRes.ok) {
      return NextResponse.json(
        { error: matchData.error?.message || 'Failed to fetch matches' },
        { status: 500 }
      )
    }

    const matchRecords: any[] = matchData.records || []
    if (matchRecords.length === 0) return NextResponse.json({ savedStartups: [] })

    // ââ 2. Collect unique startup IDs ââââââââââââââââââââââââââââââââââââââââ
    const startupIds: string[] = []
    for (const rec of matchRecords) {
      const ids: string[] = rec.fields['Startup'] || []
      for (const sid of ids) {
        if (!startupIds.includes(sid)) startupIds.push(sid)
      }
    }

    // ââ 3. Fetch startup details (batch by OR formula) âââââââââââââââââââââââ
    const idFormula = encodeURIComponent(
      `OR(${startupIds.map(id => `RECORD_ID()="${id}"`).join(',')})`
    )
    const startupRes = await fetch(
      `${ROOT}/${encodeURIComponent('Startup Pipeline')}?filterByFormula=${idFormula}&maxRecords=100`,
      { headers: AT_HEADERS, cache: 'no-store' }
    )
    const startupData = await startupRes.json()
    if (!startupRes.ok) {
      return NextResponse.json(
        { error: startupData.error?.message || 'Failed to fetch startups' },
        { status: 500 }
      )
    }

    // ââ 4. Build a quick lookup map ââââââââââââââââââââââââââââââââââââââââââ
    const startupMap: Record<string, any> = {}
    for (const s of startupData.records || []) {
      startupMap[s.id] = s
    }

    // ââ 5. Merge match + startup into a unified result âââââââââââââââââââââââ
    const savedStartups = matchRecords.map((match: any) => {
      const mf = match.fields
      const startupId = (mf['Startup'] || [])[0] as string | undefined
      const startup = startupId ? startupMap[startupId] : undefined
      const sf = startup?.fields || {}

      const primaryVertical = Array.isArray(sf['Primary Vertical'])
        ? sf['Primary Vertical']
        : sf['Primary Vertical']
        ? [sf['Primary Vertical']]
        : []

      return {
        matchId: match.id,
        matchStatus: mf['Match Status'] || 'Interested',
        score: mf['Score'] || 0,
        scoreLabel: mf['Score Label'] || '',
        notes: mf['Notes'] || '',
        startup: {
          id: startupId || '',
          name: sf['Startup Name'] || '',
          description: sf['Admin Notes'] || sf['Notes'] || '',
          shortDescription: sf['Short Description'] || '',
          primaryVertical,
          roundStage: sf['Investment Stage'] || '',
          targetRaise: sf['Target Raise'] || '',
          status: sf['Status'] || 'New',
          isDualUse: sf['Is Dual-use?'] || 'No',
          pitchDeckUrl: sf['Pitch Deck URL'] || null,
          entityType: sf['Jurisdiction'] || null,
          email: sf['Email'] || null,
          website: sf['Website / LinkedIn'] || null,
          valuationCap: sf['Valuation Cap (USD)'] || null,
          committedCapital: sf['Committed Capital (USD)'] || null,
        },
      }
    })

    // ââ 6. Filter empties and deduplicate by startup ID ââââââââââââââââââââââ
    const seen = new Set<string>()
    const dedupedStartups = savedStartups
      .filter(item => item.startup.id && item.startup.name)
      .sort((a, b) => b.score - a.score)
      .filter(item => {
        if (seen.has(item.startup.id)) return false
        seen.add(item.startup.id)
        return true
      })

    return NextResponse.json({ savedStartups: dedupedStartups })
  } catch (e: any) {
    console.error('saved-startups error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
