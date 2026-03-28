// ─────────────────────────────────────────────────────────────
// GET /api/matches
// Auto-computes Smart Matches for the authenticated investor.
// Replaces the previous static read from Airtable Matches table
// with a real-time scoring algorithm (lib/matching.ts).
// ─────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import {
  getInvestorByEmail,
  getActiveStartups,
  getMatchesForInvestor,
} from '@/lib/airtable'
import { computeMatches } from '@/lib/matching'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const user  = await currentUser()
    const email = user?.emailAddresses?.[0]?.emailAddress
    if (!email) return NextResponse.json({ matches: [], investor: null, noCriteria: false })

    // Load investor profile
    const investor = await getInvestorByEmail(email)
    if (!investor) return NextResponse.json({ matches: [], investor: null, noCriteria: false })

    // If investor hasn't set any criteria yet, return early with a flag
    const hasCriteria =
      investor.focusVerticals.length > 0 || investor.stagePreference.length > 0

    if (!hasCriteria) {
      return NextResponse.json({ matches: [], investor, noCriteria: true })
    }

    // Fetch actively-raising startups and any existing intro request records in parallel
    const [startups, existingMatches] = await Promise.all([
      getActiveStartups(),
      getMatchesForInvestor(investor.id).catch(() => []), // non-fatal
    ])

    // Build a map: startupId -> existing intro status
    const introStatusMap: Record<string, string> = {}
    existingMatches.forEach(m => {
      introStatusMap[m.startupId] = m.status
    })

    // Score all startups against this investor's criteria
    const computed = computeMatches(investor, startups)

    // Overlay any existing intro-request statuses from Airtable
    const matches = computed.map(m => ({
      ...m,
      introStatus: introStatusMap[m.startupId] ?? null,
    }))

    return NextResponse.json({ matches, investor, noCriteria: false })
  } catch (e: any) {
    console.error('auto-matches error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
