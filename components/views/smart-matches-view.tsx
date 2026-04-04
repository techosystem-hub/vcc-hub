'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Building2, Globe, Layers, DollarSign, ShieldCheck, X, Mail, Link2, TrendingUp, Sparkles,
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import type { Investor } from '@/lib/airtable'

// ── Types ───────────────────────────────────────────────────────────────

interface ComputedMatch {
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
  scoreLabel:       '🔥 Hot' | '💪 Strong' | '👍 Good' | '😐 Weak'
  reasons:          string[]
  introStatus?:     string | null
  email?:           string
  website?:         string
  valuationCap?:    string
  committedCapital?: string
  status?: string
  shortDescription?: string
}

// ── Color palettes ──────────────────────────────────────────────────────

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

// ── Helpers ─────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function ScoreBadge({ label, score }: { label: string; score: number }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${SCORE_BADGE[label] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
      {label} · {score}/100
    </span>
  )
}

function VerticalPill({ v }: { v: string }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${VERTICAL_BADGE[v] ?? 'bg-gray-200 text-gray-700'}`}>
      {v}
    </span>
  )
}

function StatusChip({ status }: { status: string }) {
  if (status === 'Interested' || status === 'Intro Sent') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5">
        <CheckCircle className="w-3 h-3" />
        {status === 'Intro Sent' ? 'Intro Sent' : 'Interested'}
      </span>
    )
  }
  if (status === 'Not Interested') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200 rounded-full px-2.5 py-0.5">
        <X className="w-3 h-3" />
        Passed
      </span>
    )
  }
  return null
}

// ── Loading skeleton ─────────────────────────────────────────────────────

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
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </CardContent>
    </Card>
  )
}

// ── Match card (summary, fully clickable) ────────────────────────────────

function MatchCard({
  match,
  status,
  onClick,
  muted = false,
}: {
  match: ComputedMatch
  status: string | undefined
  onClick: () => void
  muted?: boolean
}) {
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onClick()}
      className={`cursor-pointer transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary flex flex-col ${muted ? 'opacity-80 hover:opacity-100 border-dashed hover:border-solid hover:border-primary/30' : 'hover:border-primary/40'}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`flex h-11 w-11 items-center justify-center rounded-lg text-sm font-bold text-white flex-shrink-0 ${muted ? 'bg-gray-500' : 'bg-[#011627]'}`}>
              {initials(match.startupName)}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground leading-tight truncate">
                {match.startupName}
              </h3>
              {status && (
                <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${status === 'Actively Raising' ? 'bg-green-100 text-green-700' : status === 'Under Review' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                  {status}
                </span>
              )}
              <div className="flex flex-wrap gap-1 mt-1">
                {match.roundStage && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">
                    {match.roundStage}
                  </Badge>
                )}
                {match.targetRaise && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">
                    {match.targetRaise}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex-shrink-0">{muted ? (
            <span className="text-xs text-muted-foreground bg-gray-50 border border-gray-200 rounded-full px-2 py-0.5 whitespace-nowrap">
              {match.score}/100
            </span>
          ) : (
            <ScoreBadge label={match.scoreLabel} score={match.score} />
          )}</div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 flex-1 flex flex-col pt-0">
        {/* Score bar */}
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${muted ? 'bg-gray-300' : (SCORE_BAR[match.scoreLabel] ?? 'bg-gray-300')}`}
            style={{ width: `${match.score}%` }}
          />
        </div>
        {/* Description preview */}
        {(match.shortDescription || match.description) && (
          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
            {match.shortDescription || match.description}
          </p>
        )}

        {/* Verticals */}
        <div className="flex flex-wrap gap-1.5">
          {match.verticals.slice(0, 2).map(v => <VerticalPill key={v} v={v} />)}
          {match.isDualUse === 'Yes' && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
              Dual-use
            </span>
          )}
        </div>

        {/* Why it matches (top 2 reasons) */}
        {!muted && match.reasons.length > 0 && (
          <div className="flex flex-col gap-0.5">
            {match.reasons.slice(0, 2).map((r, i) => (
              <span key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="text-[#e71d36] flex-shrink-0">✓</span>{r}
              </span>
            ))}
          </div>
        )}

        <div className="flex-1" />

        {/* Status chip or "View details" hint */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
          {status ? (
            <StatusChip status={status} />
          ) : (
            <span className="text-xs text-muted-foreground">Click to view details</span>
          )}
          <span className="text-xs text-muted-foreground flex items-center gap-0.5">
            Details <ArrowUpRight className="w-3 h-3" />
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Detail Sheet ─────────────────────────────────────────────────────────

function MatchDetailSheet({
  match,
  status,
  open,
  onOpenChange,
  onAction,
  isActing,
  investor,
}: {
  match: ComputedMatch | null
  status: string | undefined
  open: boolean
  onOpenChange: (v: boolean) => void
  onAction: (s: 'Interested' | 'Not Interested') => void
  isActing: boolean
  investor: Investor | null
}) {
    if (!match) return null

  const isInterested = status === 'Interested' || status === 'Intro Sent'
  const isPassed     = status === 'Not Interested'

  const hasContactInfo = match.email || match.website || match.valuationCap || match.committedCapital

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-3xl overflow-y-auto flex flex-col p-0"
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-5">
          <SheetHeader className="text-left space-y-0">
            <div className="flex items-start gap-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#011627] text-xl font-bold text-white flex-shrink-0">
                {initials(match.startupName)}
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <SheetTitle className="text-2xl leading-tight">{match.startupName}</SheetTitle>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {match.verticals.map(v => <VerticalPill key={v} v={v} />)}
                  {match.isDualUse === 'Yes' && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                      Dual-use
                    </span>
                  )}
                </div>
              </div>
              <ScoreBadge label={match.scoreLabel} score={match.score} />
            </div>
            <SheetDescription className="sr-only">Match details for {match.startupName}</SheetDescription>
          </SheetHeader>
        </div>

        <Separator />

        {/* Score breakdown */}
        <div className="px-8 py-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Match Score</span>
            <span className="text-sm font-bold">{match.score}/100</span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${SCORE_BAR[match.scoreLabel] ?? 'bg-gray-300'}`}
              style={{ width: `${match.score}%` }}
            />
          </div>
          {match.reasons.length > 0 && (
            <div className="rounded-xl bg-muted/40 border px-4 py-4 mt-1 space-y-2">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
                Why it matches
              </p>
              <ul className="space-y-1.5">
                {match.reasons.map((r, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-[#e71d36] mt-0.5 flex-shrink-0">✓</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

          </div>
        </div>
      )}

        <Separator />

        {/* Key metrics */}
        <div className="px-8 py-6 grid grid-cols-2 gap-3">
          {match.roundStage && (
            <div className="rounded-xl border p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1.5">
                <Layers className="h-3.5 w-3.5" /> Stage
              </div>
              <div className="font-semibold text-sm">{match.roundStage}</div>
            </div>
          )}
          {match.targetRaise && (
            <div className="rounded-xl border p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1.5">
                <DollarSign className="h-3.5 w-3.5" /> Target Raise
              </div>
              <div className="font-semibold text-sm">{match.targetRaise}</div>
            </div>
          )}
          {match.jurisdiction && (
            <div className="rounded-xl border p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1.5">
                <Globe className="h-3.5 w-3.5" /> Jurisdiction
              </div>
              <div className="font-semibold text-sm">{match.jurisdiction}</div>
            </div>
          )}
          {match.isDualUse && (
            <div className="rounded-xl border p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1.5">
                <ShieldCheck className="h-3.5 w-3.5" /> Dual-use
              </div>
              <div className="font-semibold text-sm">{match.isDualUse}</div>
            </div>
          )}
        </div>

      {/* About */}
      {(match.shortDescription || match.description) && (
        <>
          <Separator />
          <div className="px-8 py-6 space-y-5">
            {match.shortDescription && (
              <div>
                <h3 className="text-sm font-semibold mb-2">About the Startup</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{match.shortDescription}</p>
              </div>
            )}
            {match.description && (
              <div>
                <h3 className="text-sm font-semibold mb-2">{match.shortDescription ? 'Investment Notes' : 'About'}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{match.description}</p>
              </div>
            )}
          </div>
        </>
      )}

        {/* Pitch deck link */}
        {match.pitchDeckUrl && (
          <>
            <Separator />
            <div className="px-8 py-5">
              <a
                href={match.pitchDeckUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-[#e71d36] hover:underline font-medium"
              >
                <Building2 className="w-4 h-4" />
                View Pitch Deck
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </>
        )}

        {/* ── Contact & Deal Info (shown immediately when investor is interested) ── */}
        {isInterested && hasContactInfo && (
          <>
            <Separator />
            <div className="px-8 py-6 space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Contact & Deal Details
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {match.email && (
                  <div className="flex items-center gap-3 rounded-xl border bg-emerald-50/50 px-4 py-3">
                    <Mail className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs text-muted-foreground mb-0.5">Email</div>
                      <a
                        href={`mailto:${match.email}`}
                        className="text-sm font-medium text-[#e71d36] hover:underline truncate block"
                      >
                        {match.email}
                      </a>
                    </div>
                  </div>
                )}
                {match.website && (
                  <div className="flex items-center gap-3 rounded-xl border bg-emerald-50/50 px-4 py-3">
                    <Link2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs text-muted-foreground mb-0.5">Website / LinkedIn</div>
                      <a
                        href={match.website.startsWith('http') ? match.website : `https://${match.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-[#e71d36] hover:underline truncate block"
                      >
                        {match.website}
                        <ArrowUpRight className="w-3 h-3 inline ml-1" />
                      </a>
                    </div>
                  </div>
                )}
                {(match.valuationCap || match.committedCapital) && (
                  <div className="grid grid-cols-2 gap-3">
                    {match.valuationCap && (
                      <div className="rounded-xl border bg-emerald-50/50 px-4 py-3">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Valuation Cap
                        </div>
                        <div className="font-semibold text-sm">{match.valuationCap}</div>
                      </div>
                    )}
                    {match.committedCapital && (
                      <div className="rounded-xl border bg-emerald-50/50 px-4 py-3">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Committed Capital
                        </div>
                        <div className="font-semibold text-sm">{match.committedCapital}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        <Separator />

        {/* Action buttons */}
        <div className="px-8 py-7 space-y-3">
          {/* Current status */}
          {status && (
            <div className="flex items-center gap-2 mb-1">
              <StatusChip status={status} />
              <span className="text-xs text-muted-foreground">
                {status === 'Intro Sent'
                  ? 'VCC is arranging the introduction.'
                  : isInterested
                    ? 'Full startup details are now visible above.'
                    : 'You can change your response below.'}
              </span>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button
              onClick={() => onAction('Interested')}
              disabled={isActing || isInterested}
              className={`w-full gap-2 ${isInterested ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-[#e71d36] hover:bg-[#c91027]'} text-white`}
            >
              <ThumbsUp className="w-4 h-4" />
              {isInterested ? 'Interested ✓' : "I'm Interested — Show More"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => onAction('Not Interested')}
              disabled={isActing || status === 'Intro Sent'}
              className={`w-full gap-2 text-muted-foreground hover:text-foreground ${isPassed ? 'bg-gray-100' : ''}`}
            >
              <ThumbsDown className="w-4 h-4" />
              {isPassed ? 'You passed on this one' : 'Pass'}
            </Button>
          </div>
          {!isInterested && (
            <p className="text-xs text-muted-foreground text-center">
              Click to reveal full startup details including contact info.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ── Main view ────────────────────────────────────────────────────────────

export function SmartMatchesView() {
  const [matches,  setMatches]  = useState<ComputedMatch[]>([])
  const [others,   setOthers]   = useState<ComputedMatch[]>([])
  const [investor, setInvestor] = useState<Investor | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)
  const [noCriteria, setNoCriteria] = useState(false)

  // Sheet state
  const [selectedMatch, setSelectedMatch] = useState<ComputedMatch | null>(null)
  const [sheetOpen,     setSheetOpen]     = useState(false)

  // Per-startup intro statuses (optimistic updates)
  const [introStatuses, setIntroStatuses]   = useState<Record<string, string>>({})
  const [introActing,   setIntroActing]     = useState<string | null>(null)

  // ── Data loading ─────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch('/api/matches')
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to load matches'); return }
      if (data.noCriteria) { setNoCriteria(true); setMatches([]); setOthers([]); return }
      setNoCriteria(false)
      setInvestor(data.investor ?? null)
      setMatches(data.matches ?? [])
      setOthers(data.others ?? [])
      const statuses: Record<string, string> = {}
      ;[...(data.matches ?? []), ...(data.others ?? [])].forEach((m: ComputedMatch) => {
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

  // ── Express interest / pass ──────────────────────────────
  async function handleAction(match: ComputedMatch, status: 'Interested' | 'Not Interested') {
    setIntroActing(match.startupId)
    // Optimistic update
    setIntroStatuses(prev => ({ ...prev, [match.startupId]: status }))
    try {
      const res = await fetch('/api/request-intro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startupId:  match.startupId,
          score:      match.score,
          scoreLabel: match.scoreLabel,
          reasons:    match.reasons,
          status,
        }),
      })
      if (!res.ok) {
        // Revert on failure
        setIntroStatuses(prev => {
          const next = { ...prev }
          delete next[match.startupId]
          return next
        })
      }
    } catch {
      // Revert on failure
      setIntroStatuses(prev => {
        const next = { ...prev }
        delete next[match.startupId]
        return next
      })
    } finally {
      setIntroActing(null)
    }
  }

  // ── Stats ────────────────────────────────────────────────
  const hotCount    = matches.filter(m => m.scoreLabel === '🔥 Hot').length
  const strongCount = matches.filter(m => m.scoreLabel === '💪 Strong').length
  const focusLabel  = investor?.focusVerticals?.slice(0, 2).join(', ') ?? '—'
  const ticketLabel = investor?.ticketSize?.[0] ?? '—'

  // ── No criteria ──────────────────────────────────────────
  if (!loading && noCriteria) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <div className="w-16 h-16 bg-[#e71d36]/10 rounded-full flex items-center justify-center mb-6">
          <Target className="w-8 h-8 text-[#e71d36]" />
        </div>
        <h2 className="text-xl font-semibold text-[#011627] mb-2">Set Your Investment Criteria</h2>
        <p className="text-muted-foreground max-w-sm mb-2">
          Define your focus verticals, stage preference, and ticket size in{' '}
          <strong>My Criteria</strong> to unlock personalised smart matches.
        </p>
        <p className="text-xs text-muted-foreground">Use the <strong>My Criteria</strong> tab in the sidebar.</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-[#011627]">Your Curated Matches</h1>
          {investor && (
            <p className="text-sm text-muted-foreground">
              Based on your focus in{' '}
              <span className="font-medium text-foreground">{focusLabel}</span>
              {ticketLabel !== '—' && (
                <>, ticket size <span className="font-medium text-foreground">{ticketLabel}</span></>
              )}
            </p>
          )}
        </div>

        {/* Stats */}
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

        {/* Loading */}
        {loading && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map(i => <MatchCardSkeleton key={i} />)}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <Button variant="outline" onClick={load}><RefreshCw className="w-4 h-4 mr-2" />Retry</Button>
          </div>
        )}

        {/* Empty state for matches (but others might still exist) */}
        {!loading && !error && matches.length === 0 && others.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6">
              <Sparkles className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">No matches yet</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              No actively raising startups match your criteria right now. New startups are added regularly — check back soon.
            </p>
              <p className="text-xs text-muted-foreground mt-3 max-w-xs">
                Want better matches? Make sure your investment criteria is filled in under <strong>My Criteria</strong>.
              </p>
            <Button variant="outline" className="mt-5" onClick={load}>
              <RefreshCw className="w-4 h-4 mr-2" />Refresh
            </Button>
          </div>
        )}

        {/* Curated matches grid */}
        {!loading && !error && matches.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {matches.map(match => (
              <MatchCard
                key={match.startupId}
                match={match}
                status={introStatuses[match.startupId]}
                onClick={() => { setSelectedMatch(match); setSheetOpen(true) }}
              />
            ))}
          </div>
        )}

        {/* ── Other startups raising (score < 30) ── */}
        {!loading && !error && others.length > 0 && (
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Other Startups Raising</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  These {others.length} startup{others.length !== 1 ? 's' : ''} are actively raising but didn&apos;t fully match your current criteria — worth a look.
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {others.map(match => (
                <MatchCard
                  key={match.startupId}
                  match={match}
                  status={introStatuses[match.startupId]}
                  onClick={() => { setSelectedMatch(match); setSheetOpen(true) }}
                  muted
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Detail Sheet */}
      <MatchDetailSheet
        match={selectedMatch}
        status={selectedMatch ? introStatuses[selectedMatch.startupId] : undefined}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onAction={status => selectedMatch && handleAction(selectedMatch, status)}
        isActing={selectedMatch ? introActing === selectedMatch.startupId : false}
          investor={investor}
      />
    </>
  )
}
