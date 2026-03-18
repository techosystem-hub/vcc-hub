'use client'

import { useState, useMemo } from 'react'
import { Flame, Sparkles, ArrowUpRight } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StartupDetailSheet } from '@/components/startup-detail-sheet'
import {
  startups,
  formatCurrency,
  getFlagEmoji,
  getRoundStageColor,
  type Startup,
} from '@/lib/mock-data'

function MatchScoreBadge({ score }: { score: number }) {
  let colorClass = 'bg-slate-100 text-slate-700'
  let icon = null

  if (score >= 90) {
    colorClass = 'bg-orange-100 text-orange-700 border-orange-200'
    icon = <Flame className="h-3.5 w-3.5" />
  } else if (score >= 75) {
    colorClass = 'bg-emerald-100 text-emerald-700 border-emerald-200'
    icon = <Sparkles className="h-3.5 w-3.5" />
  } else if (score >= 60) {
    colorClass = 'bg-blue-100 text-blue-700 border-blue-200'
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold ${colorClass}`}
    >
      {icon}
      {score}/100 Match
    </div>
  )
}

function SmartMatchCard({
  startup,
  onClick,
}: {
  startup: Startup
  onClick: () => void
}) {
  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
              {startup.logoPlaceholder}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{startup.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="outline"
                  className={`text-xs ${getRoundStageColor(startup.roundStage)}`}
                >
                  {startup.roundStage}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {getFlagEmoji(startup.legalHQ)} {startup.legalHQ}
                </span>
              </div>
            </div>
          </div>
          <MatchScoreBadge score={startup.matchScore || 0} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {startup.description}
        </p>

        <div className="flex flex-wrap gap-1.5">
          {startup.verticals.map((vertical) => (
            <Badge key={vertical} variant="secondary" className="text-xs">
              {vertical}
            </Badge>
          ))}
        </div>

        {/* Why it matches section */}
        {startup.matchReasons && startup.matchReasons.length > 0 && (
          <div className="rounded-lg bg-muted/50 p-3 space-y-1.5">
            <div className="text-xs font-medium text-foreground">Why it matches:</div>
            <ul className="space-y-1">
              {startup.matchReasons.slice(0, 3).map((reason, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-0.5">-</span>
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <div>
            <div className="text-xs text-muted-foreground">Target Raise</div>
            <div className="font-semibold text-foreground">
              {formatCurrency(startup.targetRaise)}
            </div>
          </div>
          <Button size="sm" className="gap-1.5">
            Request Intro
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function SmartMatchesView() {
  const [selectedStartup, setSelectedStartup] = useState<Startup | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  // Sort startups by match score (highest first)
  const matchedStartups = useMemo(() => {
    return [...startups]
      .filter((s) => s.matchScore && s.matchScore >= 55)
      .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
  }, [])

  const handleCardClick = (startup: Startup) => {
    setSelectedStartup(startup)
    setSheetOpen(true)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Your Curated Matches</h1>
        <p className="text-muted-foreground">
          Based on your focus in <span className="font-medium text-foreground">Defense & AI</span>, 
          Ticket Size: <span className="font-medium text-foreground">$200K - $500K</span>
        </p>
      </div>

      {/* Match Stats */}
      <div className="flex flex-wrap gap-4">
        <div className="rounded-lg border bg-card px-4 py-3">
          <div className="text-2xl font-bold text-foreground">{matchedStartups.length}</div>
          <div className="text-sm text-muted-foreground">Matches Found</div>
        </div>
        <div className="rounded-lg border bg-card px-4 py-3">
          <div className="text-2xl font-bold text-orange-600">
            {matchedStartups.filter((s) => (s.matchScore || 0) >= 90).length}
          </div>
          <div className="text-sm text-muted-foreground">Hot Matches (90+)</div>
        </div>
        <div className="rounded-lg border bg-card px-4 py-3">
          <div className="text-2xl font-bold text-emerald-600">
            {matchedStartups.filter((s) => (s.matchScore || 0) >= 75 && (s.matchScore || 0) < 90).length}
          </div>
          <div className="text-sm text-muted-foreground">Strong Matches (75-89)</div>
        </div>
      </div>

      {/* Matched Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
        {matchedStartups.map((startup) => (
          <SmartMatchCard
            key={startup.id}
            startup={startup}
            onClick={() => handleCardClick(startup)}
          />
        ))}
      </div>

      {/* Detail Sheet */}
      <StartupDetailSheet
        startup={selectedStartup}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  )
}
