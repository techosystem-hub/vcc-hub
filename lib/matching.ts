// ─────────────────────────────────────────────────────────────
// Smart Matching — pure scoring logic, no Airtable I/O here
//
// Core weights (main matching criteria):
//   Investment Focus (Verticals)  40 pts
//   Stage Preference              30 pts
//   Standard Ticket Size          20 pts
//   Dual-use alignment bonus      10 pts  ← additive only, never a filter
//
// Max: 100 pts. Curated threshold: 30 pts (matches shown in top grid).
// All startups are returned; caller decides how to split.
// Dual-use policy is a bonus signal, not a gating factor.
// ─────────────────────────────────────────────────────────────

import type { Investor, Startup } from './airtable'

// Maps startup "Target Raise" → investor ticket sizes that cover it
const RAISE_TO_TICKET: Record<string, string[]> = {
  '<$100k':        ['Small Tickets (<$50k)', '$50k - $200k'],
  '$100k - $300k': ['$50k - $200k', '$200k - $500k'],
  '$300k - $500k': ['$200k - $500k', '$500k - $1M'],
  '$500k - $1M':   ['$200k - $500k', '$500k - $1M'],
  '$1M - $3M':     ['$500k - $1M', '>$5M'],
  '>$3M':          ['>$5M'],
}

// Minimum score to appear in "Curated Matches" section
export const SCORE_THRESHOLD = 30

// Exact values of Airtable "Score Label" singleSelect
export type ScoreLabel = '🔥 Hot' | '💪 Strong' | '👍 Good' | '😐 Weak'

export interface ComputedMatch {
  startupId:        string
  startupName:      string
  description:      string
  verticals:        string[]
  roundStage:       string
  targetRaise:      string
  isDualUse:        string
  pitchDeckUrl?:    string
  jurisdiction?:    string
  score:            number
  scoreLabel:       ScoreLabel
  reasons:          string[]
  introStatus?:     string | null
  // Contact & deal details — revealed when investor expresses interest
  email?:           string
  website?:         string
  valuationCap?:    string
  committedCapital?: string
  status?: string
  shortDescription?: string
  businessModel?:    string[]
  mrrRevenue?:       string
  cmgr?:             string
  runway?:           string
  activeUsers?:      string
  founderName?:      string
  founderWhatsapp?:  string
}

function toScoreLabel(score: number): ScoreLabel {
  if (score >= 80) return '🔥 Hot'
  if (score >= 60) return '💪 Strong'
  if (score >= 40) return '👍 Good'
  return '😐 Weak'
}

/**
 * Score a single startup against an investor's criteria.
 * Always returns a ComputedMatch (score can be 0).
 * Caller is responsible for filtering by SCORE_THRESHOLD.
 */
export function scoreStartup(investor: Investor, startup: Startup): ComputedMatch {
  let score = 0
  const reasons: string[] = []

  // ── Investment Focus (Verticals) — 40 pts ───────────────
  const matchedVerticals = startup.primaryVertical.filter(v =>
    investor.focusVerticals.includes(v as any)
  )
  if (matchedVerticals.length > 0) {
    score += 40
    reasons.push(`Vertical: ${matchedVerticals.join(', ')}`)
  }

  // ── Stage Preference — 30 pts ────────────────────────────
  if (startup.roundStage && investor.stagePreference.includes(startup.roundStage as any)) {
    score += 30
    reasons.push(`Stage: ${startup.roundStage}`)
  }

  // ── Standard Ticket Size — 20 pts ────────────────────────
  if (startup.targetRaise) {
    const coveringTickets = RAISE_TO_TICKET[startup.targetRaise] || []
    if (investor.ticketSize.some(t => coveringTickets.includes(t))) {
      score += 20
      reasons.push(`Raise target (${startup.targetRaise}) fits ticket size`)
    }
  }

  // ── Dual-use alignment bonus — +10 pts (additive only) ──
  // Only awarded when investor explicitly welcomes defense / dual-use tech.
  // Never penalises or hides a startup from any investor.
  if (
    startup.isDualUse === 'Yes' &&
    investor.dualUsePolicy !== 'No - our mandate restricts this (ESG / LP restrictions)'
  ) {
    score += 10
    reasons.push('Dual-use tech — fits your mandate')
  }

  return {
    startupId:        startup.id,
    startupName:      startup.name,
    description:      startup.description,
    verticals:        startup.primaryVertical as string[],
    roundStage:       startup.roundStage,
    targetRaise:      startup.targetRaise,
    isDualUse:        startup.isDualUse,
    pitchDeckUrl:     startup.pitchDeckUrl,
    jurisdiction:     startup.entityType,
    score,
    scoreLabel:       toScoreLabel(score),
    reasons,
    email:            startup.email,
    website:          startup.website,
    valuationCap:     startup.valuationCap,
    committedCapital: startup.committedCapital,
  status: startup.status,
  shortDescription: startup.shortDescription,
  businessModel:    startup.businessModel,
  mrrRevenue:       startup.mrrRevenue,
  cmgr:             startup.cmgr,
  runway:           startup.runway,
  activeUsers:      startup.activeUsers,
  founderName:      startup.founderName,
  founderWhatsapp:  startup.founderWhatsapp,
  }
}

/**
 * Compute and sort all matches for an investor against a list of startups.
 * Returns only those meeting the SCORE_THRESHOLD, sorted by score descending.
 * For the full list (including "others"), use scoreStartup directly.
 */
export function computeMatches(investor: Investor, startups: Startup[]): ComputedMatch[] {
  return startups
    .map(s => scoreStartup(investor, s))
    .filter(m => m.score >= SCORE_THRESHOLD)
    .sort((a, b) => b.score - a.score)
}
