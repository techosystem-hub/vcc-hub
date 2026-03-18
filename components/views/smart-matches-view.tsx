'use client'

import { useState, useMemo, useEffect } from 'react'
import { Flame, Sparkles, ArrowUpRight } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StartupDetailSheet } from '@/components/startup-detail-sheet'
import type { Match, Investor } from '@/lib/airtable'

// Adapt Airtable match to local shape for display
interface MatchStartup {
  id: string
  name: string
  description: string
  verticals: string[]
  roundStage: string
  targetRaise: number
  legalHQ: string
  diiaCity: boolean
  founders: any[]
  existingInvestors: string[]
  logoPlaceholder: string
  matchScore?: number
  matchReasons?: string[]
  dealDate: string
}

function getRoundStageColor(stage: string) {
  switch (stage) {
    case 'Pre-seed': return 'bg-slate-100 text-slate-700 border-slate-200'
    case 'Seed':     return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'Series A': return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'Series B':
    case 'Series B+': return 'bg-indigo-50 text-indigo-700 border-indigo-200'
    default:         return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

function formatCurrency(amount: number) {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000)     return `$${(amount / 1_000).toFixed(0)}K`
  return `$${amount}`
}

function MatchScoreBadge({ score }: { score: number }) {
  let colorClass = 'bg-slate-100 text-slate-700 border-slate-200'
  let icon = null
  if (score >= 90) { colorClass = 'bg-orange-100 text-orange-700 border-orange-200'; icon = <Flame className="h-3.5 w-3.5" /> }
  else if (score >= 75) { colorClass = 'bg-emerald-100 text-emerald-700 border-emerald-200'; icon = <Sparkles className="h-3.5 w-3.5" /> }
  else if (score >= 60)  colorClass = 'bg-blue-100 text-blue-700 border-blue-200'

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold ${colorClass}`}>
      {icon}{score}/100 Match
    </div>
  )
}

function SmartMatchCard({ startup, onRequestIntro }: { startup: MatchStartup; onRequestIntro: () => void }) {
  return (
    <Card className="transition-all hover:shadow-md hover:border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
              {startup.logoPlaceholder}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{startup.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={`text-xs ${getRoundStageColor(startup.roundStage)}`}>{startup.roundStage}</Badge>
              </div>
            </div>
          </div>
          <MatchScoreBadge score={startup.matchScore || 0} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">{startup.description}</p>
        <div className="flex flex-wrap gap-1.5">
          {startup.verticals.map(v => <Badge key={v} variant="secondary" className="text-xs">{v}</Badge>)}
        </div>
        {startup.matchReasons && startup.matchReasons.length > 0 && (
          <div className="rounded-lg bg-muted/50 p-3 space-y-1.5">
            <div className="text-xs font-medium text-foreground">Why it matches:</div>
            <ul className="space-y-1">
              {startup.matchReasons.slice(0, 3).map((r, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-0.5">-</span>{r}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex items-center justify-between pt-2 border-t">
          <div>
            <div className="text-xs text-muted-foreground">Target Raise</div>
            <div className="font-semibold text-foreground">{formatCurrency(startup.targetRaise)}</div>
          </div>
          <Button size="sm" className="gap-1.5" onClick={onRequestIntro}>
            Request Intro <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function SmartMatchesView() {
  const [data, setData]           = useState<{ matches: Match[]; investor: Investor | null } | null>(null)
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState<MatchStartup | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => {
    fetch('/api/matches')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const matchStartups: MatchStartup[] = useMemo(() => {
    if (!data?.matches) return []
    return data.matches.map(m => ({
      id:               m.id,
      name:             m.startupName,
      description:      m.startupDescription,
      verticals:        m.startupVerticals,
      roundStage:       m.startupStage,
      targetRaise:      m.startupRaiseAmount || 0,
      legalHQ:          m.startupEntity || '',
      diiaCity:         false,
      founders:         [],
      existingInvestors:[],
      logoPlaceholder:  m.startupName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase(),
      matchScore:       m.score,
      matchReasons:     m.whyItMatches ? m.whyItMatches.split('\n').filter(Boolean) : [],
      dealDate:         new Date().toISOString(),
    }))
  }, [data])

  const hotCount    = matchStartups.filter(s => (s.matchScore || 0) >= 90).length
  const strongCount = matchStartups.filter(s => (s.matchScore || 0) >= 75 && (s.matchScore || 0) < 90).length

  const investor = data?.investor
  const focusLabel = investor?.focusVerticals?.join(' & ') || '—'
  const ticketLabel = investor?.ticketSize?.[0] || '—'

  if (loading) return <div className="flex items-center justify-center py-20 text-muted-foreground">Loading matches…</div>

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Your Curated Matches</h1>
        <p className="text-muted-foreground">
          Based on your focus in <span className="font-medium text-foreground">{focusLabel}</span>
          {ticketLabel !== '—' && <>, Ticket Size: <span className="font-medium text-foreground">{ticketLabel}</span></>}
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="rounded-lg border bg-card px-4 py-3">
          <div className="text-2xl font-bold text-foreground">{matchStartups.length}</div>
          <div className="text-sm text-muted-foreground">Matches Found</div>
        </div>
        <div className="rounded-lg border bg-card px-4 py-3">
          <div className="text-2xl font-bold text-orange-600">{hotCount}</div>
          <div className="text-sm text-muted-foreground">Hot Matches (90+)</div>
        </div>
        <div className="rounded-lg border bg-card px-4 py-3">
          <div className="text-2xl font-bold text-emerald-600">{strongCount}</div>
          <div className="text-sm text-muted-foreground">Strong Matches (75-89)</div>
        </div>
      </div>

      {matchStartups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-muted-foreground text-lg font-medium">No matches yet</div>
          <p className="text-sm text-muted-foreground mt-1">Matches will appear here once the VCC team scores startups against your criteria.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {matchStartups.map(s => (
            <SmartMatchCard key={s.id} startup={s} onRequestIntro={() => { setSelected(s); setSheetOpen(true) }} />
          ))}
        </div>
      )}

      <StartupDetailSheet startup={selected as any} open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  )
}
