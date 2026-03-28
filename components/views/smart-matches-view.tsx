'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Flame, Sparkles, ArrowUpRight, CheckCircle, RefreshCw, Target,
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { Investor } from '@/lib/airtable'

// ── Types (mirrors ComputedMatch from lib/matching.ts, client-safe) ──

interface ComputedMatch {
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
  scoreLabel:    '🔥 Hot' | '💪 Strong' | '👍 Good' | '😐 Weak'
  reasons:       string[]
  introStatus?:  string | null
}

// ── Color maps ──────────────────────────────────────────────────────────

const SCORE_BADGE: Record<string, string> = {
  '🔥 Hot':    'bg-orange-100 text-orange-700 border-orange-200',
  '💪 Strong': 'bg-blue-100 text-blue-700 border-blue-200',
  '👍 Good':   'bg-emerald-100 text-emerald-700 border-emerald-200',
  '😐 Weak':   'bg-gray-100 text-gray-600 border-gray-200',
}

const SCORE_BAR: Record<string, string> = {
  '🔥 Hot':    'bg-orange-500',
  '💪 Strong': 'bg-blue-500',
  '👍 Good':   'bg-emerald-500',
  '😐 Weak':   'bg-gray-300',
}

const VERTICAL_BADGE: Record<string, string> = {
  'Defense / MilTech':          'bg-slate-800 text-white',
  'AI / ML':                    'bg-purple-600 text-white',
  'Cybersecurity':               'bg-red-700 text-white',
  'Fintech':                     'bg-emerald-700 text-white',
  'HealthTech':                  'bg-pink-600 text-white',
  'AgriTech':                    'bg-green-700 text-white',
  'SaaS (General)':              'bg-blue-600 text-white',
  'Hardware / IoT':              'bg-orange-600 text-white',
  'EdTech':                      'bg-indigo-600 text-white',
  'Marketing & Media':           'bg-rose-600 text-white',
  'Energy & Environment':        'bg-teal-600 text-white',
  'Consumer Products':           'bg-yellow-600 text-white',
  'Consumer products':           'bg-yellow-600 text-white',
  'HRTech':                      'bg-violet-600 text-white',
  'Business Productivity':       'bg-cyan-700 text-white',
  'E-commerce & Retail':         'bg-orange-700 text-white',
  'Logistics & Transportation':  'bg-slate-600 text-white',
}

function ScoreBadge({ label, score }: { label: string; score: number }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${
        SCORE_BADGE[label] ?? 'bg-gray-100 text-gray-600 border-gray-200'
      }`}
    >
      {label} · {score}/100
    </span>
  )
}

function MatchCardSkeleton() {
  return (
    <Card className="border border-gray-100">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start gap-3">
          <Skeleton className="w-11 h-11 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-44" />
            <div className="flex gap-1.5">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-6 w-24 rounded-full flex-shrink-0" />
        </div>
        <Skeleton className="h-1.5 w-full rounded-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="flex justify-end pt-2">
          <Skeleton className="h-8 w-28 rounded-md" />
        </div>
      </CardContent>
    </Card>
  )
}

function MatchCard({
  match, introStatus, onRequestIntro, isRequesting,
}: {
  match: ComputedMatch
  introStatus: string | undefined
  onRequestIntro: () => void
  isRequesting: boolean
}) {
  const initials = match.startupName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const isIntroSent = introStatus === 'Interested' || introStatus === 'Intro Sent'

  return (
    <Card className="transition-all hover:shadow-md hover:border-primary/30 flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#011627] text-sm font-bold text-white flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground leading-tight truncate">{match.startupName}</h3>
              <div className="flex flex-wrap gap-1 mt-1">
                {match.roundStage && <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">{match.roundStage}</Badge>}
                {match.targetRaise && <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">{match.targetRaise}</Badge>}
              </div>
            </div>
          </div>
          <ScoreBadge label={match.scoreLabel} score={match.score} />
        </div>
      </CardHeader>

      <CardContent className="space-y-3 flex-1 flex flex-col pt-0">
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${SCORE_BAR[match.scoreLabel] ?? 'bg-gray-300'}`}
            style={{ width: `${match.score}%` }}
          />
        </div>

        {match.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{match.description}</p>
        )}

        <div className="flex flex-wrap gap-1.5">
          {match.verticals.slice(0, 2).map(v => (
            <span key={v} className={`text-xs px-2 py-0.5 rounded-full font-medium ${VERTICAL_BADGE[v] ?? 'bg-gray-200 text-gray-700'}`}>
              {v}
            </span>
          ))}
          {match.isDualUse === 'Yes' && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Dual-use</span>
          )}
        </div>

        {match.reasons.length > 0 && (
          <div className="rounded-lg bg-muted/40 px-3 py-2.5 space-y-1">
            <div className="text-xs font-medium text-foreground">Why it matches:</div>
            <ul className="space-y-0.5">
              {match.reasons.slice(0, 3).map((r, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <span className="text-[#e71d36] mt-0.5 flex-shrink-0">✓</span>{r}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex-1" />

        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
          {match.pitchDeckUrl ? (
            <a href={match.pitchDeckUrl} target="_blank" rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-[#e71d36] transition-colors flex items-center gap-1">
              Pitch Deck <ArrowUpRight className="w-3 h-3" />
            </a>
          ) : <span />}

          {isIntroSent ? (
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
              <CheckCircle className="w-3.5 h-3.5" />
              {introStatus === 'Intro Sent' ? 'Intro Sent' : 'Intro Requested'}
            </span>
          ) : (
            <Button size="sm" disabled={isRequesting} onClick={onRequestIntro}
              className="bg-[#e71d36] hover:bg-[#c91027] text-white text-xs h-8 gap-1.5">
              {isRequesting ? 'Requesting…' : <><>Request Intro</> <ArrowUpRight className="h-3.5 w-3.5" /></>}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function SmartMatchesView() {
  const [matches,  setMatches]  = useState<ComputedMatch[]>([])
  const [investor, setInvestor] = useState<Investor | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)
  const [noCriteria, setNoCriteria] = useState(false)
  const [introRequesting, setIntroRequesting] = useState<string | null>(null)
  const [introStatuses, setIntroStatuses] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch('/api/matches')
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to load matches'); return }
      if (data.noCriteria) { setNoCriteria(true); setMatches([]); return }
      setNoCriteria(false)
      setInvestor(data.investor ?? null)
      setMatches(data.matches ?? [])
      const statuses: Record<string, string> = {}
      ;(data.matches ?? []).forEach((m: ComputedMatch) => {
        if (m.introStatus) statuses[m.startupId] = m.introStatus
      })
      setIntroStatuses(statuses)
    } catch {
      setError('Could not connect to server. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function requestIntro(match: ComputedMatch) {
    setIntroRequesting(match.startupId)
    try {
      const res = await fetch('/api/request-intro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startupId: match.startupId, startupName: match.startupName,
          score: match.score, scoreLabel: match.scoreLabel, reasons: match.reasons,
        }),
      })
      if (res.ok) setIntroStatuses(prev => ({ ...prev, [match.startupId]: 'Interested' }))
    } catch { /* silently fail */ } finally {
      setIntroRequesting(null)
    }
  }

  const hotCount    = matches.filter(m => m.scoreLabel === '🔥 Hot').length
  const strongCount = matches.filter(m => m.scoreLabel === '💪 Strong').length
  const focusLabel  = investor?.focusVerticals?.slice(0, 2).join(', ') ?? '—'
  const ticketLabel = investor?.ticketSize?.[0] ?? '—'

  if (!loading && noCriteria) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <div className="w-16 h-16 bg-[#e71d36]/10 rounded-full flex items-center justify-center mb-6">
          <Target className="w-8 h-8 text-[#e71d36]" />
        </div>
        <h2 className="text-xl font-semibold text-[#011627] mb-2">Set Your Investment Criteria</h2>
        <p className="text-muted-foreground max-w-sm mb-2">
          Define your focus verticals, stage preference, and ticket size in <strong>My Criteria</strong> to unlock your personalised smart matches.
        </p>
        <p className="text-xs text-muted-foreground">Use the <strong>My Criteria</strong> tab in the sidebar to get started.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-[#011627]">Your Curated Matches</h1>
        {investor && (
          <p className="text-sm text-muted-foreground">
            Based on your focus in <span className="font-medium text-foreground">{focusLabel}</span>
            {ticketLabel !== '—' && <>, ticket size <span className="font-medium text-foreground">{ticketLabel}</span></>}
          </p>
        )}
      </div>

      {!loading && !error && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-lg border bg-card px-4 py-3 min-w-[90px]">
            <div className="text-2xl font-bold text-foreground">{matches.length}</div>
            <div className="text-xs text-muted-foreground">Matches</div>
          </div>
          <div className="rounded-lg border bg-card px-4 py-3 min-w-[90px]">
            <div className="text-2xl font-bold text-orange-600">{hotCount}</div>
            <div className="text-xs text-muted-foreground">🔥 Hot</div>
          </div>
          <div className="rounded-lg border bg-card px-4 py-3 min-w-[90px]">
            <div className="text-2xl font-bold text-blue-600">{strongCount}</div>
            <div className="text-xs text-muted-foreground">💪 Strong</div>
          </div>
          <Button variant="ghost" size="sm" onClick={load} className="self-center text-muted-foreground ml-auto">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />Refresh
          </Button>
        </div>
      )}

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map(i => <MatchCardSkeleton key={i} />)}
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button variant="outline" onClick={load}><RefreshCw className="w-4 h-4 mr-2" />Retry</Button>
        </div>
      )}

      {!loading && !error && !noCriteria && matches.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6">
            <Sparkles className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">No matches yet</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            No actively raising startups match your criteria right now. New startups are added regularly — check back soon.
          </p>
          <Button variant="outline" className="mt-5" onClick={load}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
        </div>
      )}

      {!loading && !error && matches.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {matches.map(match => (
            <MatchCard key={match.startupId} match={match}
              introStatus={introStatuses[match.startupId]}
              onRequestIntro={() => requestIntro(match)}
              isRequesting={introRequesting === match.startupId}
            />
          ))}
        </div>
      )}
    </div>
  )
}
