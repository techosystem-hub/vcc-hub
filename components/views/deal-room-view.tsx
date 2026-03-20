'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import {
  Search, SlidersHorizontal, ExternalLink, MapPin, Calendar, Users,
  BarChart2, LayoutGrid, TrendingUp, DollarSign, Globe, Award, ChevronDown, Check,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import type { DealFlowStartup } from '@/lib/airtable'

// ── Brand palette ─────────────────────────────────────────────
const RED  = '#e71d36'   // Techosystem brand red
const NAVY = '#011627'   // Techosystem brand navy

const CHART_COLORS = [
  '#e71d36', '#c0392b', '#011627', '#1a5276',
  '#e74c3c', '#2c3e50', '#ff6b6b', '#34495e',
  '#a93226', '#1f3a5f',
]

// ── Static filter options (matched to real Airtable values) ───
const ALL_VERTICALS = [
  'Defense', 'Business Productivity', 'Finance', 'Marketing & Media',
  'Healthcare', 'Cybersecurity', 'Aerospace', 'Education',
  'Energy & Environment', 'Property & Construction',
  'Logistics & Transportation', 'Communications', 'HR', 'Legal', 'Gaming',
]

const ALL_STAGES = [
  'Pre-seed', 'Seed', 'Non-disclosed', 'Series A', 'Growth',
  'Angel', 'Series B', 'Series C', 'Corporate funding', 'Series D',
]

const ALL_YEARS = ['2024', '2025', '2026']

type SortOption = 'newest' | 'highest' | 'lowest'
type ViewMode   = 'analytics' | 'deals'

// ── Helpers ───────────────────────────────────────────────────
function formatUSD(n: number): string {
  if (!n) return '—'
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`
  return `$${n}`
}

// ── Custom Recharts Tooltip ───────────────────────────────────
function ChartTooltip({ active, payload, label, fmt }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-lg text-xs">
      {label && <div className="font-semibold text-foreground mb-1">{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: p.fill || p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-semibold text-foreground">
            {fmt ? fmt(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── KPI Stat Card ─────────────────────────────────────────────
function StatCard({
  icon: Icon, label, value, sub,
}: {
  icon: React.ElementType; label: string; value: string; sub?: string
}) {
  return (
    <Card className="border-l-4" style={{ borderLeftColor: RED }}>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-2xl font-bold text-foreground">{value}</div>
            <div className="text-sm font-medium text-foreground mt-0.5">{label}</div>
            {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
          </div>
          <div className="rounded-lg p-2" style={{ background: `${RED}18` }}>
            <Icon className="h-4 w-4" style={{ color: RED }} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Analytics Panel ───────────────────────────────────────────
function AnalyticsPanel({ startups }: { startups: DealFlowStartup[] }) {
  const stats = useMemo(() => {
    const total      = startups.length
    const totalInv   = startups.reduce((s, d) => s + (d.investmentSizeUSD || 0), 0)
    const uaCount    = startups.filter(d =>
      d.startupOrigin?.toLowerCase().includes('ukrainian') || d.startupOrigin === 'Ukraine'
    ).length
    const memberCount = startups.filter(d => d.techosystemMember === 'Member').length

    // Deals by vertical — top 10
    const vMap: Record<string, number> = {}
    startups.forEach(d => { if (d.vertical) vMap[d.vertical] = (vMap[d.vertical] || 0) + 1 })
    const verticals = Object.entries(vMap)
      .sort((a, b) => b[1] - a[1]).slice(0, 10)
      .map(([name, value]) => ({ name, value }))

    // Round stages
    const sMap: Record<string, number> = {}
    startups.forEach(d => { if (d.roundStage) sMap[d.roundStage] = (sMap[d.roundStage] || 0) + 1 })
    const stages = Object.entries(sMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }))

    // Deals by year
    const yMap: Record<string, number> = {}
    startups.forEach(d => { if (d.year) yMap[String(d.year)] = (yMap[String(d.year)] || 0) + 1 })
    const byYear = Object.entries(yMap)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([year, deals]) => ({ year, deals }))

    // Investment volume by vertical — top 8
    const invMap: Record<string, number> = {}
    startups.forEach(d => {
      if (d.vertical && d.investmentSizeUSD > 0)
        invMap[d.vertical] = (invMap[d.vertical] || 0) + d.investmentSizeUSD
    })
    const invByVertical = Object.entries(invMap)
      .sort((a, b) => b[1] - a[1]).slice(0, 8)
      .map(([name, value]) => ({ name, value: +(value / 1e6).toFixed(1) }))

    return { total, totalInv, uaCount, memberCount, verticals, stages, byYear, invByVertical }
  }, [startups])

  return (
    <div className="flex flex-col gap-6">
      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard icon={TrendingUp} label="Total Deals"         value={String(stats.total)}           sub="in the database" />
        <StatCard icon={DollarSign} label="Total Invested"      value={formatUSD(stats.totalInv)}     sub="tracked investment volume" />
        <StatCard icon={Globe}      label="Ukrainian-founded"   value={`${Math.round(stats.uaCount / stats.total * 100)}%`} sub={`${stats.uaCount} startups`} />
        <StatCard icon={Award}      label="Techosystem Members" value={String(stats.memberCount)}     sub={`${Math.round(stats.memberCount / stats.total * 100)}% of portfolio`} />
      </div>

      {/* Row 1: Deals by Vertical + Stage Donut */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Deals by Vertical</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.verticals} layout="vertical"
                margin={{ left: 8, right: 32, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#888' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#444' }} width={148} />
                <Tooltip content={(p) => <ChartTooltip {...p} />} />
                <Bar dataKey="value" name="Deals" radius={[0, 4, 4, 0]}>
                  {stats.verticals.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Round Stage Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.stages}
                  cx="50%" cy="45%"
                  innerRadius={65} outerRadius={105}
                  dataKey="value" nameKey="name"
                  paddingAngle={2}
                  label={({ name, percent }) =>
                    percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ''
                  }
                  labelLine={false}
                >
                  {stats.stages.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={(p) => <ChartTooltip {...p} />} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Deal Flow by Year + Investment Volume by Vertical */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Deal Flow by Year</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.byYear} margin={{ left: 0, right: 16, top: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#555' }} />
                <YAxis tick={{ fontSize: 11, fill: '#888' }} />
                <Tooltip content={(p) => <ChartTooltip {...p} />} />
                <Bar dataKey="deals" name="Deals" fill={RED} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Investment Volume by Vertical ($M)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.invByVertical} layout="vertical"
                margin={{ left: 8, right: 32, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#888' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#444' }} width={148} />
                <Tooltip content={(p) => <ChartTooltip {...p} fmt={(v: number) => `$${v}M`} />} />
                <Bar dataKey="value" name="Investment" fill={NAVY} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ── Deal Card ─────────────────────────────────────────────────
function DealCard({ startup }: { startup: DealFlowStartup }) {
  const initials = startup.name
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??'
  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg font-bold text-sm flex-shrink-0 text-white"
            style={{ background: NAVY }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-foreground leading-tight truncate">{startup.name}</h3>
              {startup.techosystemMember === 'Member' && (
                <Badge className="text-xs shrink-0 text-white border-0" style={{ background: RED }}>
                  Techosystem
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {startup.vertical   && <Badge variant="outline" className="text-xs">{startup.vertical}</Badge>}
              {startup.roundStage && <Badge variant="outline" className="text-xs">{startup.roundStage}</Badge>}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 pt-0">
        {startup.description && (
          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
            {startup.description}
          </p>
        )}
        <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
          {startup.investmentSizeUSD > 0 && (
            <div className="flex items-center justify-between">
              <span>Investment</span>
              <span className="font-semibold text-foreground">{formatUSD(startup.investmentSizeUSD)}</span>
            </div>
          )}
          {startup.legalHQ && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{startup.legalHQ}</span>
            </div>
          )}
          {startup.founders && (
            <div className="flex items-center gap-1.5">
              <Users className="h-3 w-3 shrink-0" />
              <span className="truncate">{startup.founders}</span>
            </div>
          )}
          {startup.year > 0 && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3 shrink-0" />
              <span>{startup.year}</span>
            </div>
          )}
        </div>
        {startup.linkToNews && (
          <a
            href={startup.linkToNews}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-medium hover:underline mt-1"
            style={{ color: RED }}
            onClick={e => e.stopPropagation()}
          >
            <ExternalLink className="h-3 w-3" />
            View news
          </a>
        )}
      </CardContent>
    </Card>
  )
}

// ── Custom Dropdown (avoids Radix popper position bugs in fixed layouts) ──
function FilterDropdown({
  label, items, selected, onToggle,
}: {
  label: string; items: string[]; selected: string[]
  onToggle: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos]   = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)

  const openMenu = useCallback(() => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 4, left: r.left })
    }
    setOpen(o => !o)
  }, [])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (btnRef.current && !btnRef.current.contains(e.target as Node)) {
        // Check if click is inside the menu portal
        const menus = document.querySelectorAll('[data-filter-menu]')
        for (const m of menus) {
          if (m.contains(e.target as Node)) return
        }
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <>
      <button
        ref={btnRef}
        onClick={openMenu}
        className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors h-8"
      >
        <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
        {label}
        {selected.length > 0 && (
          <span
            className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white"
            style={{ background: RED }}
          >
            {selected.length}
          </span>
        )}
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </button>

      {open && (
        <div
          data-filter-menu
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            zIndex: 9999,
            minWidth: 200,
            maxHeight: 280,
            overflowY: 'auto',
          }}
          className="rounded-md border border-border bg-background shadow-lg py-1"
        >
          {items.map(v => (
            <button
              key={v}
              onClick={() => onToggle(v)}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent text-left transition-colors"
            >
              <span
                className="h-4 w-4 rounded border border-input flex items-center justify-center flex-shrink-0"
                style={selected.includes(v) ? { background: RED, borderColor: RED } : {}}
              >
                {selected.includes(v) && <Check className="h-3 w-3 text-white" />}
              </span>
              {v}
            </button>
          ))}
        </div>
      )}
    </>
  )
}

// ── Main View ─────────────────────────────────────────────────
interface DealRoomProps {
  initialFilter?: {
    years?: string[]
    verticals?: string[]
    dateFrom?: string
    viewMode?: 'analytics' | 'deals'
  }
}

export function DealRoomView({ initialFilter }: DealRoomProps = {}) {
  const [startups, setStartups]                   = useState<DealFlowStartup[]>([])
  const [loading, setLoading]                     = useState(true)
  const [viewMode, setViewMode]                   = useState<ViewMode>(initialFilter?.viewMode ?? 'analytics')
  const [searchQuery, setSearchQuery]             = useState('')
  const [sortBy, setSortBy]                       = useState<SortOption>('newest')
  const [selectedVerticals, setSelectedVerticals] = useState<string[]>(initialFilter?.verticals ?? [])
  const [selectedStages, setSelectedStages]       = useState<string[]>([])
  const [selectedYears, setSelectedYears]         = useState<string[]>(initialFilter?.years ?? [])
  const [selectedInvType, setSelectedInvType]     = useState('')
  const [techosystemOnly, setTechosystemOnly]     = useState(false)
  const [dateFrom, setDateFrom]                   = useState<string | null>(initialFilter?.dateFrom ?? null)

  useEffect(() => {
    fetch('/api/dealflow')
      .then(r => r.json())
      .then((data: DealFlowStartup[]) => {
        setStartups(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let result = [...startups]
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.founders.toLowerCase().includes(q)
      )
    }
    if (selectedVerticals.length > 0) result = result.filter(s => selectedVerticals.includes(s.vertical))
    if (selectedStages.length > 0)    result = result.filter(s => selectedStages.includes(s.roundStage))
    if (selectedYears.length > 0)     result = result.filter(s => selectedYears.includes(String(s.year)))
    if (selectedInvType)              result = result.filter(s => s.investmentType === selectedInvType)
    if (techosystemOnly)              result = result.filter(s => s.techosystemMember === 'Member')
    if (dateFrom)                     result = result.filter(s => s.datePublished >= dateFrom)
    if (sortBy === 'highest') result.sort((a, b) => b.investmentSizeUSD - a.investmentSizeUSD)
    if (sortBy === 'lowest')  result.sort((a, b) => a.investmentSizeUSD - b.investmentSizeUSD)
    if (sortBy === 'newest')  result.sort((a, b) =>
      b.year - a.year || b.datePublished.localeCompare(a.datePublished)
    )
    return result
  }, [startups, searchQuery, selectedVerticals, selectedStages, selectedYears, selectedInvType, techosystemOnly, sortBy, dateFrom])

  const activeFilters =
    selectedVerticals.length + selectedStages.length + selectedYears.length +
    (selectedInvType ? 1 : 0) + (techosystemOnly ? 1 : 0) + (dateFrom ? 1 : 0)

  const clearAll = () => {
    setSelectedVerticals([]); setSelectedStages([]); setSelectedYears([])
    setSelectedInvType(''); setTechosystemOnly(false); setSearchQuery(''); setDateFrom(null)
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-muted-foreground">
      Loading deal flow data…
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Analytics / Deals toggle + Add Deal button */}
      <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-1 rounded-lg border bg-muted/30 p-1 w-fit">
        <Button
          variant={viewMode === 'analytics' ? 'default' : 'ghost'}
          size="sm" className="gap-1.5 h-8"
          onClick={() => setViewMode('analytics')}
        >
          <BarChart2 className="h-4 w-4" />
          Analytics
        </Button>
        <Button
          variant={viewMode === 'deals' ? 'default' : 'ghost'}
          size="sm" className="gap-1.5 h-8"
          onClick={() => setViewMode('deals')}
        >
          <LayoutGrid className="h-4 w-4" />
          Deals
          <span className="rounded-full bg-foreground/10 px-1.5 py-0.5 text-[10px] font-medium">
            {startups.length}
          </span>
        </Button>
      </div>

        <a
          href="/add-deal"
        >
          <Button size="sm" className="gap-1.5 h-8 text-white" style={{ background: RED }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Deal
          </Button>
        </a>
      </div>

      {viewMode === 'analytics' ? (
        <AnalyticsPanel startups={startups} />
      ) : (
        <>
          {/* Search + Sort */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, description, founders…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={sortBy} onValueChange={v => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="highest">Highest Investment</SelectItem>
                <SelectItem value="lowest">Lowest Investment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <FilterDropdown
              label="Vertical"
              items={ALL_VERTICALS}
              selected={selectedVerticals}
              onToggle={v => setSelectedVerticals(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v])}
            />
            <FilterDropdown
              label="Round Stage"
              items={ALL_STAGES}
              selected={selectedStages}
              onToggle={v => setSelectedStages(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v])}
            />
            <FilterDropdown
              label="Year"
              items={ALL_YEARS}
              selected={selectedYears}
              onToggle={v => setSelectedYears(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v])}
            />

            {/* Investment type */}
            <FilterDropdown
              label="Investment Type"
              items={['New', 'Follow-up']}
              selected={selectedInvType ? [selectedInvType] : []}
              onToggle={v => setSelectedInvType(p => p === v ? '' : v)}
            />

            {/* Techosystem members only */}
            <Button
              variant={techosystemOnly ? 'default' : 'outline'}
              size="sm" className="h-8"
              onClick={() => setTechosystemOnly(p => !p)}
            >
              Techosystem only
            </Button>

            {dateFrom && (
              <div className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm font-medium"
                style={{ borderColor: '#e71d36', color: '#e71d36', background: '#e71d3610' }}>
                <span>From {new Date(dateFrom + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                <button onClick={() => setDateFrom(null)} className="ml-0.5 font-bold hover:opacity-70 leading-none">×</button>
              </div>
            )}

            {activeFilters > 0 && (
              <Button variant="ghost" size="sm" className="h-8 text-muted-foreground" onClick={clearAll}>
                Clear all ({activeFilters})
              </Button>
            )}
          </div>

          <div className="text-sm text-muted-foreground">
            Showing {filtered.length} of {startups.length} deals
          </div>

          {filtered.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map(s => <DealCard key={s.id} startup={s} />)}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-muted-foreground">No deals match your filters</div>
              <Button variant="link" onClick={clearAll}>Clear all filters</Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
