// Core weights (main matching criteria):
//   Investment Focus (Verticals)  40 pts
//   Stage Preference              30 pts
//   Standard Ticket Size          20 pts
//   Dual-use alignment bonus      10 pts  <- additive only, never a filter
//
// Max: 100 pts. Minimum threshold: 30 pts.
// All startups are considered regardless of dual-use status.

import type { Investor, Startup } from './airtable'

const RAISE_TO_TICKET: Record<string, string[]> = {
  '<$100k':        ['Small Tickets (<$50k)', '$50k - $200k'],
  '$100k - $300k': ['$50k - $200k', '$200k - $500k'],
  '$300k - $500k': ['$200k - $500k', '$500k - $1M'],
  '$500k - $1M':   ['$200k - $500k', '$500k - $1M'],
  '$1M - $3M':     ['$500k - $1M', '>$5M'],
  '>$3M':          ['>$5M'],
}

export type ScoreLabel = '🔥 Hot' | '💪 Strong' | '👍 Good' | '😐 Weak'

export interface ComputedMatch {
  startupId:     string
  startupName:   string
  description:   string
  verticals:     string[]
  roundStage:    string
  targetRaise:   string
  isDualUse:     string
  pitchDeckUrl?: string
  jurisdiction?: string
  score:         number
  scoreLabel:    ScoreLabel
  reasons:       string[]
  introStatus?:  string | null
}

function toScoreLabel(score: number): ScoreLabel {
  if (score >= 80) return '🔥 Hot'
  if (score >= 60) return '💪 Strong'
  if (score >= 40) return '👍 Good'
  return '😐 Weak'
}

export function scoreStartup(investor: Investor, startup: Startup): ComputedMatch | null {
  let score = 0
  const reasons: string[] = []

  // Investment Focus (Verticals) -- 40 pts
  const matchedVerticals = startup.primaryVertical.filter(v =>
    investor.focusVerticals.includes(v as any)
  )
  if (matchedVerticals.length > 0) {
    score += 40
    reasons.push('Vertical: ' + matchedVerticals.join(', '))
  }

  // Stage Preference -- 30 pts
  if (startup.roundStage && investor.stagePreference.includes(startup.roundStage as any)) {
    score += 30
    reasons.push('Stage: ' + startup.roundStage)
  }

  // Standard Ticket Size -- 20 pts
  if (startup.targetRaise) {
    const coveringTickets = RAISE_TO_TICKET[startup.targetRaise] || []
    if (investor.ticketSize.some(t => coveringTickets.includes(t))) {
      score += 20
      reasons.push('Raise target (' + startup.targetRaise + ') fits ticket size')
    }
  }

  // Dual-use alignment bonus -- +10 pts (additive only, never a filter)
  // Only awarded when investor explicitly welcomes defense / dual-use tech.
  if (
    startup.isDualUse === 'Yes' &&
    investor.dualUsePolicy !== 'No - our mandate restricts this (ESG / LP restrictions)'
  ) {
    score += 10
    reasons.push('Dual-use tech -- fits your mandate')
  }

  // Below threshold -> exclude
  if (score < 30) return null

  return {
    startupId:    startup.id,
    startupName:  startup.name,
    description:  startup.description,
    verticals:    startup.primaryVertical as string[],
    roundStage:   startup.roundStage,
    targetRaise:  startup.targetRaise,
    isDualUse:    startup.isDualUse,
    pitchDeckUrl: startup.pitchDeckUrl,
    jurisdiction: startup.entityType,
    score,
    scoreLabel:   toScoreLabel(score),
    reasons,
  }
}

export function computeMatches(investor: Investor, startups: Startup[]): ComputedMatch[] {
  return startups
    .map(s => scoreStartup(investor, s))
    .filter((m): m is ComputedMatch => m !== null)
    .sort((a, b) => b.score - a.score)
}
