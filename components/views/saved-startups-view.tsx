'use client'

import { useState, useEffect } from 'react'
import {
  Bookmark, Building2, Globe, Layers, DollarSign,
  ShieldCheck, Mail, Link2, TrendingUp, ArrowUpRight,
  X, RefreshCw,
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'

// ── Types ───────────────────────────────────────────────────────────────
interface SavedStartup {
  matchId: string
  matchStatus: string
  score: number
  scoreLabel: string
  notes: string
  startup: {
    id: string
    name: string
    description: string
    primaryVertical: string[]
    roundStage: string
    targetRaise: string
    status: string
    isDualUse: string
    pitchDeckUrl?: string | null
    entityType?: string | null
    email?: string | null
    website?: string | null
    valuationCap?: string | null
    committedCapital?: string | null
  }
}

// ── Palettes ─────────────────────────────────────────────────────────────
const SCORE_BADGE: Record<string, string> = {
  '🔥 Hot':     'bg-orange-100 text-orange-700 border-orange-200',
  '💪 Strong':  'bg-blue-100 text-blue-700 border-blue-200',
  '👍 Good':    'bg-emerald-100 text-emerald-700 border-emerald-200',
  '👎 Weak':    'bg-gray-100 text-gray-600 border-gray-200',
}

const STATUS_BADGE: Record<string, string> = {
  'Interested': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Intro Sent': 'bg-blue-100 text-blue-700 border-blue-200',
}

const VERTICAL_BADGE: Record<string, string> = {
  'Defense / MilTech':        'bg-slate-800 text-white',
  'AI / ML':                  'bg-purple-600 text-white',
  'Cybersecurity':            'bg-red-700 text-white',
  'Fintech':                  'bg-emerald-700 text-white',
  'HealthTech':               'bg-pink-600 text-white',
  'AgriTech':                 'bg-green-700 text-white',
  'SaaS (General)':           'bg-blue-600 text-white',
  'Hardware / IoT':           'bg-orange-600 text-white',
  'EdTech':                   'bg-indigo-600 text-white',
  'Marketing & Media':        'bg-rose-600 text-white',
  'Energy & Environment':     'bg-teal-600 text-white',
  'Consumer Products':        'bg-yellow-600 text-white',
  'Consumer products':        'bg-yellow-600 text-white',
  'HRTech':                   'bg-violet-600 text-white',
  'Business Productivity':    'bg-cyan-700 text-white',
  'E-commerce & Retail':      'bg-orange-700 text-white',
  'Logistics & Transportation': 'bg-slate-600 text-white',
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

// ── Metric tile ───────────────────────────────────────────────────────────
function MetricTile({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl bg-muted/50 border border-border/60 px-4 py-3">
      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────
function SavedCard({ item, onClick }: { item: SavedStartup; onClick: () => void }) {
  const { startup, matchStatus, scoreLabel } = item
  const scoreCls  = SCORE_BADGE[scoreLabel]  || 'bg-gray-100 text-gray-600 border-gray-200'
  const statusCls = STATUS_BADGE[matchStatus] || 'bg-gray-100 text-gray-600 border-gray-200'

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow border hover:border-emerald-200"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-sm select-none">
            {initials(startup.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-foreground truncate">{startup.name}</span>
              {scoreLabel && (
                <Badge variant="outline" className={`text-xs ${scoreCls}`}>{scoreLabel}</Badge>
              )}
              <Badge variant="outline" className={`text-xs ${statusCls}`}>{matchStatus}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{startup.description}</p>
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-1.5 mb-3">
          {startup.primaryVertical.slice(0, 3).map(v => (
            <Badge key={v} className={`text-xs ${VERTICAL_BADGE[v] || 'bg-gray-200 text-gray-700'}`}>{v}</Badge>
          ))}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {startup.roundStage && (
            <span className="flex items-center gap-1"><Layers className="h-3 w-3" />{startup.roundStage}</span>
          )}
          {startup.targetRaise && (
            <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{startup.targetRaise}</span>
          )}
          {startup.entityType && (
            <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{startup.entityType}</span>
          )}
          {startup.isDualUse && startup.isDualUse !== 'No' && (
            <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" />Dual-Use</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Detail sheet ──────────────────────────────────────────────────────────
function DetailSheet({
  item, onClose, onRemove,
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

  const metrics: { icon: any; label: string; value: string }[] = [
    startup.roundStage                                          && { icon: Layers,      label: 'Stage',       value: startup.roundStage },
    startup.targetRaise                                         && { icon: DollarSign,  label: 'Raise Target', value: startup.targetRaise },
    startup.valuationCap                                        && { icon: TrendingUp,  label: 'Val. Cap',    value: startup.valuationCap },
    (startup.committedCapital && startup.committedCapital !== '0') && { icon: DollarSign, label: 'Committed',  value: startup.committedCapital },
    startup.entityType                                          && { icon: Building2,   label: 'Entity',      value: startup.entityType },
    (startup.isDualUse && startup.isDualUse !== 'No')           && { icon: ShieldCheck, label: 'Dual-Use',   value: startup.isDualUse },
  ].filter(Boolean) as { icon: any; label: string; value: string }[]

  const matchPoints = notes ? notes.split('\n').filter(Boolean) : []

  return (
    <Sheet open={!!item} onOpenChange={open => { if (!open) onClose() }}>
      <SheetContent className="w-full sm:max-w-[min(820px,92vw)] p-0 flex flex-col overflow-hidden">

        {/* ── Header gradient ─────────────────────────────────── */}
        <div className="relative bg-gradient-to-br from-emerald-600 via-teal-600 to-teal-700 px-8 pt-8 pb-6 text-white flex-shrink-0">
          {/* Close btn */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full p-1.5 hover:bg-white/20 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm text-white font-bold text-xl select-none border border-white/30">
              {initials(startup.name)}
            </div>

            <div className="flex-1 min-w-0 pt-1">
              <h2 className="text-2xl font-bold leading-tight truncate">{startup.name}</h2>
              <div className="flex flex-wrap gap-2 mt-2">
                {scoreLabel && (
                  <span className="inline-flex items-center rounded-full bg-white/20 border border-white/30 px-3 py-0.5 text-sm font-medium">
                    {scoreLabel}
                  </span>
                )}
                <span className="inline-flex items-center rounded-full bg-white/20 border border-white/30 px-3 py-0.5 text-sm font-medium">
                  {matchStatus}
                </span>
                {startup.primaryVertical.slice(0, 2).map(v => (
                  <span key={v} className="inline-flex items-center rounded-full bg-white/15 border border-white/20 px-3 py-0.5 text-sm">
                    {v}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {startup.description && (
            <p className="mt-4 text-white/80 text-sm leading-relaxed max-w-xl">
              {startup.description}
            </p>
          )}
        </div>

        {/* ── Scrollable body ─────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">

          {/* Metric tiles */}
          {metrics.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {metrics.map(m => (
                <MetricTile key={m.label} icon={m.icon} label={m.label} value={m.value} />
              ))}
            </div>
          )}

          {/* Why it matched */}
          {matchPoints.length > 0 && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-widest mb-3">
                Why It Matched
              </p>
              <ul className="space-y-2">
                {matchPoints.map((n, i) => (
                  <li key={i} className="flex gap-2.5 text-sm text-gray-800">
                    <span className="mt-0.5 text-emerald-500 flex-shrink-0">✓</span>
                    <span>{n}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Contact */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
              Contact
            </p>
            <div className="space-y-2.5">
              {startup.email ? (
                <a
                  href={`mailto:${startup.email}`}
                  className="flex items-center gap-2.5 text-sm text-blue-600 hover:text-blue-800 hover:underline"
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
                  className="flex items-center gap-2.5 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  <Globe className="h-4 w-4 flex-shrink-0" />
                  {startup.website}
                </a>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-2 pb-4">
            {startup.pitchDeckUrl && (
              <Button asChild size="lg" className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700">
                <a href={startup.pitchDeckUrl} target="_blank" rel="noopener noreferrer">
                  <Link2 className="h-4 w-4" />
                  View Pitch Deck
                </a>
              </Button>
            )}
            <Button
              variant="outline"
              size="lg"
              className="w-full gap-2 text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
              onClick={handleRemove}
              disabled={removing}
            >
              <X className="h-4 w-4" />
              {removing ? 'Removing…' : 'Remove from Saved'}
            </Button>
          </div>

        </div>
      </SheetContent>
    </Sheet>
  )
}

// ── Main view ─────────────────────────────────────────────────────────────
export function SavedStartupsView() {
  const [saved, setSaved]     = useState<SavedStartup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
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

  // Loading
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

  // Error
  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-red-500 mb-4">{error}</p>
        <Button variant="outline" onClick={load} className="gap-2">
          <RefreshCw className="h-4 w-4" />Retry
        </Button>
      </div>
    )
  }

  // Empty
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

  // List
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Bookmark className="h-5 w-5 text-emerald-600" />
          <h2 className="text-xl font-semibold">Saved Startups</h2>
          <Badge variant="secondary" className="ml-1">{saved.length}</Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={load} className="gap-2 text-muted-foreground">
          <RefreshCw className="h-3.5 w-3.5" />Refresh
        </Button>
      </div>

      <div className="space-y-3">
        {saved.map(item => (
          <SavedCard key={item.matchId} item={item} onClick={() => setSelected(item)} />
        ))}
      </div>

      <DetailSheet item={selected} onClose={() => setSelected(null)} onRemove={handleRemove} />
    </div>
  )
}
