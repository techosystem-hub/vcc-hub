'use client'

import { useState, useEffect } from 'react'
import {
  Bookmark, Building2, Globe, Layers, DollarSign, ShieldCheck,
  Mail, Link2, TrendingUp, ArrowUpRight, X, RefreshCw,
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'

// ââ Types âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

interface SavedStartup {
  matchId:      string
  matchStatus:  string
  score:        number
  scoreLabel:   string
  notes:        string
  startup: {
    id:               string
    name:             string
    description:      string
    primaryVertical:  string[]
    roundStage:       string
    targetRaise:      string
    status:           string
    isDualUse:        string
    pitchDeckUrl?:    string | null
    entityType?:      string | null
    email?:           string | null
    website?:         string | null
    valuationCap?:    string | null
    committedCapital?: string | null
  }
}

// ââ Color palettes ââââââââââââââââââââââââââââââââââââââââââââââââââââââ

const SCORE_BADGE: Record<string, string> = {
  'ð¥ Hot':    'bg-orange-100 text-orange-700 border-orange-200',
  'ðª Strong': 'bg-blue-100 text-blue-700 border-blue-200',
  'ð Good':   'bg-emerald-100 text-emerald-700 border-emerald-200',
  'ð Weak':   'bg-gray-100 text-gray-600 border-gray-200',
}

const STATUS_BADGE: Record<string, string> = {
  'Interested':  'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Intro Sent':  'bg-blue-100 text-blue-700 border-blue-200',
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

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

// ââ Card component âââââââââââââââââââââââââââââââââââââââââââââââââââââââ

function SavedCard({
  item,
  onClick,
}: {
  item: SavedStartup
  onClick: () => void
}) {
  const { startup, matchStatus, scoreLabel } = item
  const scoreCls = SCORE_BADGE[scoreLabel] || 'bg-gray-100 text-gray-600 border-gray-200'
  const statusCls = STATUS_BADGE[matchStatus] || 'bg-gray-100 text-gray-600 border-gray-200'

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow border hover:border-emerald-200"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-sm select-none">
            {initials(startup.name)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-foreground truncate">{startup.name}</span>
              {scoreLabel && (
                <Badge variant="outline" className={`text-xs ${scoreCls}`}>
                  {scoreLabel}
                </Badge>
              )}
              <Badge variant="outline" className={`text-xs ${statusCls}`}>
                {matchStatus}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{startup.description}</p>
          </div>

          <ArrowUpRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-1.5 mb-3">
          {startup.primaryVertical.slice(0, 3).map(v => (
            <Badge
              key={v}
              className={`text-xs ${VERTICAL_BADGE[v] || 'bg-gray-200 text-gray-700'}`}
            >
              {v}
            </Badge>
          ))}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {startup.roundStage && (
            <span className="flex items-center gap-1">
              <Layers className="h-3 w-3" /> {startup.roundStage}
            </span>
          )}
          {startup.targetRaise && (
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" /> {startup.targetRaise}
            </span>
          )}
          {startup.entityType && (
            <span className="flex items-center gap-1">
              <Building2 className="h-3 w-3" /> {startup.entityType}
            </span>
          )}
          {startup.isDualUse && startup.isDualUse !== 'No' && (
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Dual-Use
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ââ Detail sheet ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

function DetailSheet({
  item,
  onClose,
  onRemove,
}: {
  item: SavedStartup | null
  onClose: () => void
  onRemove: (matchId: string) => void
}) {
  const [removing, setRemoving] = useState(false)

  if (!item) return null
  const { startup, matchStatus, scoreLabel, notes } = item
  const scoreCls  = SCORE_BADGE[scoreLabel]  || 'bg-gray-100 text-gray-600 border-gray-200'
  const statusCls = STATUS_BADGE[matchStatus] || 'bg-gray-100 text-gray-600 border-gray-200'

  async function handleRemove() {
    setRemoving(true)
    try {
      await fetch('/api/request-intro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startupId: startup.id, status: 'Not Interested' }),
      })
      onRemove(item!.matchId)
      onClose()
    } catch {
      setRemoving(false)
    }
  }

  return (
    <Sheet open={!!item} onOpenChange={open => { if (!open) onClose() }}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-base select-none flex-shrink-0">
              {initials(startup.name)}
            </div>
            <div>
              <SheetTitle className="text-xl">{startup.name}</SheetTitle>
              <div className="flex gap-2 mt-1 flex-wrap">
                {scoreLabel && (
                  <Badge variant="outline" className={`text-xs ${scoreCls}`}>{scoreLabel}</Badge>
                )}
                <Badge variant="outline" className={`text-xs ${statusCls}`}>{matchStatus}</Badge>
              </div>
            </div>
          </div>
          <SheetDescription className="mt-3 text-sm leading-relaxed">
            {startup.description}
          </SheetDescription>
        </SheetHeader>

        <Separator className="my-4" />

        {/* Vertical tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {startup.primaryVertical.map(v => (
            <Badge key={v} className={`text-xs ${VERTICAL_BADGE[v] || 'bg-gray-200 text-gray-700'}`}>
              {v}
            </Badge>
          ))}
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {startup.roundStage && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Layers className="h-4 w-4 flex-shrink-0" />
              <span>{startup.roundStage}</span>
            </div>
          )}
          {startup.targetRaise && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4 flex-shrink-0" />
              <span>Raise: {startup.targetRaise}</span>
            </div>
          )}
          {startup.valuationCap && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4 flex-shrink-0" />
              <span>Val. Cap: {startup.valuationCap}</span>
            </div>
          )}
          {startup.committedCapital && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4 flex-shrink-0" />
              <span>Committed: {startup.committedCapital}</span>
            </div>
          )}
          {startup.entityType && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4 flex-shrink-0" />
              <span>{startup.entityType}</span>
            </div>
          )}
          {startup.isDualUse && startup.isDualUse !== 'No' && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 flex-shrink-0" />
              <span>Dual-Use</span>
            </div>
          )}
        </div>

        {/* Notes from AI match */}
        {notes && (
          <>
            <Separator className="my-4" />
            <div className="mb-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Why it matched</p>
              <ul className="space-y-1">
                {notes.split('\n').filter(Boolean).map((n, i) => (
                  <li key={i} className="text-sm text-foreground flex gap-2">
                    <span className="text-emerald-500 mt-0.5 flex-shrink-0">✓</span>
                    <span>{n}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* Contact info */}
        <Separator className="my-4" />
        <div className="space-y-2 mb-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Contact</p>
          {startup.email ? (
            <a
              href={`mailto:${startup.email}`}
              className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
            >
              <Mail className="h-4 w-4 flex-shrink-0" />
              {startup.email}
            </a>
          ) : (
            <p className="text-sm text-muted-foreground">No email on file</p>
          )}
          {startup.website && (
            <a
              href={startup.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
            >
              <Globe className="h-4 w-4 flex-shrink-0" />
              {startup.website}
            </a>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {startup.pitchDeckUrl && (
            <Button asChild className="w-full gap-2">
              <a href={startup.pitchDeckUrl} target="_blank" rel="noopener noreferrer">
                <Link2 className="h-4 w-4" /> View Pitch Deck
              </a>
            </Button>
          )}
          <Button
            variant="outline"
            className="w-full gap-2 text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
            onClick={handleRemove}
            disabled={removing}
          >
            <X className="h-4 w-4" />
            {removing ? 'Removingâ¦' : 'Remove from Saved'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ââ Main view âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export function SavedStartupsView() {
  const [saved, setSaved]       = useState<SavedStartup[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [selected, setSelected] = useState<SavedStartup | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch('/api/saved-startups')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load saved startups')
      setSaved(data.savedStartups || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function handleRemove(matchId: string) {
    setSaved(prev => prev.filter(s => s.matchId !== matchId))
  }

  // ââ Loading skeleton ââ
  if (loading) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Bookmark className="h-5 w-5 text-emerald-600" />
          <h2 className="text-xl font-semibold">Saved Startups</h2>
        </div>
        {[1, 2, 3].map(i => (
          <Card key={i} className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-64" />
              </div>
            </div>
            <Skeleton className="h-3 w-32" />
          </Card>
        ))}
      </div>
    )
  }

  // ââ Error state ââ
  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-red-500 mb-4">{error}</p>
        <Button variant="outline" onClick={load} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Retry
        </Button>
      </div>
    )
  }

  // ââ Empty state ââ
  if (saved.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No saved startups yet</h3>
        <p className="text-sm text-muted-foreground">
          When you click <strong>Interested</strong> on a Smart Match, it will appear here.
        </p>
      </div>
    )
  }

  // ââ Main list ââ
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Bookmark className="h-5 w-5 text-emerald-600" />
          <h2 className="text-xl font-semibold">Saved Startups</h2>
          <Badge variant="secondary" className="ml-1">{saved.length}</Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={load} className="gap-2 text-muted-foreground">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      <div className="space-y-3">
        {saved.map(item => (
          <SavedCard
            key={item.matchId}
            item={item}
            onClick={() => setSelected(item)}
          />
        ))}
      </div>

      <DetailSheet
        item={selected}
        onClose={() => setSelected(null)}
        onRemove={handleRemove}
      />
    </div>
  )
}
