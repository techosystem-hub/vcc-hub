'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import {
  Search, SlidersHorizontal, ExternalLink, MapPin, Calendar, Users,
  BarChart2, LayoutGrid, LayoutList, TrendingUp, DollarSign, Globe, Award, ChevronDown, Check,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import type { DealFlowStartup } from '@/lib/airtable'

const RED  = '#e71d36'
const NAVY = '#011627'

const CHART_COLORS = [
  '#e71d36', '#c0392b', '#011627', '#1a5276',
  '#e74c3c', '#2c3e50', '#ff6b6b', '#34495e',
  '#a93226', '#1f3a5f',
]

const ALL_VERTICALS = [
  'Defense', 'Business Productivity', 'Finance', 'Marketing & Media',
  'Healthcare', 'Cybersecurity', 'Aerospace', 'Education',
  'Energy & Environment', 'Property & Construction',
  'Logistics & Transportation', 'Communications', 'HR', 'Legal', 'Gaming',
  'Agrifood', 'Travel & Leisure',
]

const ALL_STAGES = [
  'Pre-seed', 'Seed', 'Non-disclosed', 'Series A', 'Growth',
  'Angel', 'Series B', 'Series C', 'Corporate funding', 'Series D',
]

const ALL_YEARS = ['2021', '2022', '2023', '2024', '2025', '2026']

type SortOption = 'newest' | 'highest' | 'lowest'
type ViewMode   = 'analytics' | 'deals' | 'list'

function formatUSD(n: number): string {
  if (!n) return '—'
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`
  return `$${n}`
}

function isUkrainian(s: DealFlowStartup): boolean {
  const o = (s.startupOrigin || '').toLowerCase()
  return o.includes('ukrainian') || o === 'ukraine'
}

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

function StatCard({
  icon: Icon, label, value, sub, onClick, hint,
}: {
  icon: React.ElementType; label: string; value: string; sub?: string
  onClick?: () => void; hint?: string
}) {
  return (
    <Card
      className={`border-l-4 transition-shadow ${onClick ? 'cursor-pointer hover:shadow-md' : ''}`}
      style={{ borderLeftColor: RED }}
      onClick={onClick}
      title={hint}
    >
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-2xl font-bold text-foreground">{value}</div>
            <div className="text-sm font-medium text-foreground mt-0.5">{label}</div>
            {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
            {onClick && (
              <div className="text-[10px] mt-1.5 font-medium" style={{ color: RED }}>
                Click to explore →
              </div>
            )}
          </div>
          <div className="rounded-lg p-2" style={{ background: `${RED}18` }}>
            <Icon className="h-4 w-4" style={{ color: RED }} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

type ChartFilter = {
  verticals?: string[]
  stages?: string[]
  years?: string[]
  techosystemOnly?: boolean
  uaOnly?: boolean
  sortBy?: SortOption
}

function AnalyticsPanel({
  startups,
  onFilter,
}: {
  startups: DealFlowStartup[]
  onFilter: (f: ChartFilter) => void
}) {
  const stats = useMemo(() => {
    const total       = startups.length
    const totalInv    = startups.reduce((s, d) => s + (d.investmentSizeUSD || 0), 0)
    const uaCount     = startups.filter(isUkrainian).length
    const memberCount = startups.filter(d => d.techosystemMember === 'Member').length

    const vMap: Record<string, number> = {}
    startups.forEach(d => { if (d.vertical) vMap[d.vertical] = (vMap[d.vertical] || 0) + 1 })
    const verticals = Object.entries(vMap)
      .sort((a, b) => b[1] - a[1]).slice(0, 10)
      .map(([name, value]) => ({ name, value }))

    const sMap: Record<string, number> = {}
    startups.forEach(d => { if (d.roundStage) sMap[d.roundStage] = (sMap[d.roundStage] || 0) + 1 })
    const stagesAll = Object.entries(sMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }))
    const _stTotal = stagesAll.reduce((s, d) => s + d.value, 0)
    const _stMin = Math.max(2, Math.round(_stTotal * 0.03))
    const stagesMajor = stagesAll.filter(d => d.value >= _stMin)
    const stagesOther = stagesAll.filter(d => d.value < _stMin).reduce((s, d) => s + d.value, 0)
    const stages = stagesOther > 0 ? [...stagesMajor, { name: 'Other', value: stagesOther }] : stagesMajor

    const yMap: Record<string, number> = {}
    startups.forEach(d => { if (d.year) yMap[String(d.year)] = (yMap[String(d.year)] || 0) + 1 })
    const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const mMap: Record<string, Record<string, number>> = {}
    MONTH_NAMES.forEach(m => { mMap[m] = {} })
    startups.forEach(d => {
      const y = String(d.year)
      if (!['2024','2025','2026'].includes(y)) return
      const date = d.datePublished ? new Date(d.datePublished) : null
      if (!date || isNaN(date.getTime())) return
      const m = MONTH_NAMES[date.getMonth()]
      mMap[m][y] = (mMap[m][y] || 0) + 1
    })
    const byMonth = MONTH_NAMES.map(month => ({
      month,
      '2024': mMap[month]['2024'] || 0,
      '2025': mMap[month]['2025'] || 0,
      '2026': mMap[month]['2026'] || 0,
    }))
    const invMap: Record<string, number> = {}
    startups.forEach(d => {
      if (d.vertical && d.investmentSizeUSD > 0)
        invMap[d.vertical] = (invMap[d.vertical] || 0) + d.investmentSizeUSD
    })
    const invByVertical = Object.entries(invMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value: +(value / 1e6).toFixed(1) })).filter(d => d.value > 0)

    return { total, totalInv, uaCount, memberCount, verticals, stages, byMonth, invByVertical }
  }, [startups])

  const pct = (n: number) =>
    stats.total > 0 ? `${Math.round(n / stats.total * 100)}%` : '0%'

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={TrendingUp} label="Total Deals"
          value={String(stats.total)} sub="in the database"
          hint="Click to browse all deals"
          onClick={() => onFilter({})}
        />
        <StatCard
          icon={DollarSign} label="Total Invested"
          value={formatUSD(stats.totalInv)} sub="tracked investment volume"
          hint="Click to browse sorted by investment size"
          onClick={() => onFilter({ sortBy: 'highest' })}
        />
        <StatCard
          icon={Globe} label="Ukrainian-founded"
          value={pct(stats.uaCount)} sub={`${stats.uaCount} startups`}
          hint="Click to browse Ukrainian-founded startups"
          onClick={() => onFilter({ uaOnly: true })}
        />
        <StatCard
          icon={Award} label="Techosystem Members"
          value={String(stats.memberCount)}
          sub={`${pct(stats.memberCount)} of portfolio`}
          hint="Click to browse Techosystem member companies"
          onClick={() => onFilter({ techosystemOnly: true })}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Deals by Vertical</CardTitle>
            <p className="text-[11px] text-muted-foreground -mt-1">Click a bar to explore deals</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.verticals} layout="vertical"
                margin={{ left: 8, right: 32, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#888' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#444' }} width={148} />
                <Tooltip content={(p) => <ChartTooltip {...p} />} cursor={{ fill: 'rgba(0,0,0,0.06)' }} />
                <Bar dataKey="value" name="Deals" radius={[0, 4, 4, 0]}
                  onClick={(data) => onFilter({ verticals: [data.name] })}
                  cursor="pointer"
                >
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
            <p className="text-[11px] text-muted-foreground -mt-1">Click a slice to explore deals</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={360}>
              <PieChart margin={{ top: 10, bottom: 10 }}>
                <Pie
                  data={stats.stages}
                  cx="50%" cy="48%"                  innerRadius={60} outerRadius={95}
                  dataKey="value" nameKey="name"
                  paddingAngle={2}
                  label={({ cx, cy: pcy, midAngle, outerRadius, name, percent }: any) => { if (percent < 0.04) return null; const R = Math.PI / 180; const r = outerRadius + 28; const x = cx + r * Math.cos(-midAngle * R); const y = pcy + r * Math.sin(-midAngle * R); return <text x={x} y={y} fill="#555" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={10}>{name}</text>; }}
                    labelLine={{ stroke: '#ccc', strokeWidth: 1 }}
                  onClick={(data) => onFilter({ stages: [data.name] })}
                  cursor="pointer"
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Deal Flow by Month</CardTitle>
            <p className="text-[11px] text-muted-foreground -mt-1">Click a bar to explore deals</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats.byMonth} margin={{ left: 0, right: 16, top: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#555' }} />
                <YAxis tick={{ fontSize: 11, fill: '#888' }} allowDecimals={false} />
                <Tooltip content={(p) => <ChartTooltip {...p} />} cursor={{ fill: 'rgba(0,0,0,0.06)' }} />
                <Legend iconType="circle" iconSize={8} formatter={(value: any) => <span style={{ fontSize: 11, color: '#555' }}>{value}</span>} />
                <Bar dataKey="2024" name="2024" fill={CHART_COLORS[2]} radius={[2, 2, 0, 0]} />
                <Bar dataKey="2025" name="2025" fill={CHART_COLORS[0]} radius={[2, 2, 0, 0]} />
                <Bar dataKey="2026" name="2026" fill={CHART_COLORS[3]} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Investment Volume by Vertical ($M)</CardTitle>
            <p className="text-[11px] text-muted-foreground -mt-1">Click a bar to explore deals</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={Math.max(320, stats.invByVertical.length * 34)}>
              <BarChart data={stats.invByVertical} layout="vertical"
                margin={{ left: 8, right: 32, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#888' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#444' }} width={148} />
                <Tooltip content={(p) => <ChartTooltip {...p} fmt={(v: number) => `$${v}M`} />} cursor={{ fill: 'rgba(0,0,0,0.06)' }} />
                <Bar dataKey="value" name="Investment" fill={NAVY} radius={[0, 4, 4, 0]}
                  onClick={(data) => onFilter({ verticals: [data.name] })}
                  cursor="pointer"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Recent Deals</CardTitle>
            <p className="text-[11px] text-muted-foreground -mt-1">Latest additions to the deal flow</p>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-gray-100">
              {[...startups]
                .sort((a, b) => b.datePublished.localeCompare(a.datePublished) || b.year - a.year)
                .slice(0, 8)
                .map(s => (
                  <div key={s.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs text-white" style={{ background: NAVY }}>
                        {s.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || '??'}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-gray-900 truncate">{s.name}</div>
                        <div className="text-xs text-gray-500">
                          {[s.vertical, s.roundStage].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right ml-4">
                      <div className="text-sm font-semibold text-gray-900">{s.investmentSizeUSD > 0 ? formatUSD(s.investmentSizeUSD) : '—'}</div>
                      <div className="text-xs text-gray-500">{s.datePublished || (s.year > 0 ? String(s.year) : '')}</div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
    </div>
  )
}

function DealDetailSheet({
  startup,
  onClose,
}: {
  startup: DealFlowStartup | null
  onClose: () => void
}) {
  if (!startup) return null
  const initials = startup.name
    .split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || '??'

  function FieldCard({ label, value }: { label: string; value?: string | null }) {
    if (!value) return null
    return (
      <div className="rounded-xl border p-3.5">
        <div className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">{label}</div>
        <div className="font-semibold text-sm text-foreground break-words">{value}</div>
      </div>
    )
  }

  return (
    <Sheet open={!!startup} onOpenChange={v => { if (!v) onClose() }}>
      <SheetContent className="w-full sm:max-w-[min(1000px,95vw)] overflow-y-auto p-0" side="right">

        {/* ── Header ── */}
        <div className="px-8 pt-8 pb-5 border-b border-gray-100">
          <SheetHeader className="text-left space-y-0">
            <div className="flex items-start gap-4">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-xl font-bold text-xl flex-shrink-0 text-white"
                style={{ background: NAVY }}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <SheetTitle className="text-2xl font-bold leading-tight text-foreground pr-8">
                  {startup.name}
                </SheetTitle>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {startup.vertical && (
                    <Badge variant="outline" className="text-xs">{startup.vertical}</Badge>
                  )}
                  {startup.roundStage && (
                    <Badge variant="outline" className="text-xs">{startup.roundStage}</Badge>
                  )}
                  {startup.techosystemMember === 'Member' && (
                    <Badge className="text-xs text-white border-0" style={{ background: RED }}>
                      ✓ Techosystem Member
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </SheetHeader>
        </div>

        {/* ── Description ── */}
        {startup.description && (
          <div className="px-8 py-5 border-b border-gray-100">
            <p className="text-sm text-muted-foreground leading-relaxed">{startup.description}</p>
          </div>
        )}

        {/* ── Fields ── */}
        <div className="px-8 py-6 space-y-7">

          {/* Investment */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
              Investment
            </p>
            <div className="grid grid-cols-2 gap-3">
              <FieldCard label="Amount (USD)" value={startup.investmentSizeUSD > 0 ? formatUSD(startup.investmentSizeUSD) : null} />
              <FieldCard label="Round Stage" value={startup.roundStage} />
              <FieldCard label="Investment Type" value={startup.investmentType} />
              <FieldCard label="Date Published" value={startup.datePublished} />
              <FieldCard label="Year" value={startup.year > 0 ? String(startup.year) : null} />
            </div>
          </div>

          {/* Investors */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
              Investors
            </p>
            <div className="grid grid-cols-2 gap-3">
              <FieldCard label="Investor(s)" value={startup.investors || '—'} />
              <FieldCard label="UA Investors Involved" value={startup.uaInvestorsInvolved} />
            </div>
          </div>

          {/* Company */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
              Company
            </p>
            <div className="grid grid-cols-2 gap-3">
              <FieldCard label="Founders" value={startup.founders} />
              <FieldCard label="Legal HQ" value={startup.legalHQ} />
              <FieldCard label="Startup Origin" value={startup.startupOrigin} />
              <FieldCard label="Born Year" value={startup.bornYear} />
              <FieldCard label="Office in Ukraine" value={startup.officeInUkraine ? 'Yes' : 'No'} />
            </div>
          </div>
        </div>

        {/* ── CTA ── */}
        {startup.linkToNews && (
          <div className="px-8 pb-8">
            <a
              href={startup.linkToNews}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full rounded-lg py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: RED }}
            >
              <ExternalLink className="h-4 w-4" />
              Read the news article
            </a>
          </div>
        )}

      </SheetContent>
    </Sheet>
  )
}
function DealListRow({
  startup,
  onClick,
}: {
  startup: DealFlowStartup
  onClick: () => void
}) {
  return (
    <div
      className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl px-4 py-3 hover:shadow-sm hover:border-gray-300 transition-all cursor-pointer"
      onClick={onClick}
    >
      {/* Avatar */}
      <div
        className="flex-shrink-0 h-9 w-9 rounded-lg flex items-center justify-center font-bold text-xs text-white"
        style={{ background: NAVY }}
      >
        {startup.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??'}
      </div>
      {/* Name + badges */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm text-foreground truncate">{startup.name}</span>
          {startup.techosystemMember === 'Member' && (
            <Badge className="text-[10px] px-1.5 py-0 text-white border-0 shrink-0" style={{ background: RED }}>✓ Member</Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {startup.vertical   && <span className="text-[10px] text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">{startup.vertical}</span>}
          {startup.roundStage && <span className="text-[10px] text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">{startup.roundStage}</span>}
          {startup.legalHQ    && <span className="text-[10px] text-gray-400 flex items-center gap-1"><MapPin className="h-2.5 w-2.5" />{startup.legalHQ}</span>}
        </div>
      </div>
      {/* Investment */}
      <div className="flex-shrink-0 text-right hidden sm:block">
        {startup.investmentSizeUSD > 0 && (
          <p className="text-sm font-semibold text-foreground">{formatUSD(startup.investmentSizeUSD)}</p>
        )}
        {startup.year > 0 && <p className="text-[10px] text-gray-400">{startup.year}</p>}
      </div>
      {/* Arrow */}
      <div className="flex-shrink-0 text-gray-300 text-sm">›</div>
    </div>
  )
}

function DealCard({
  startup,
  onClick,
}: {
  startup: DealFlowStartup
  onClick: () => void
}) {
  const initials = startup.name
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??'
  return (
    <Card
      className="flex flex-col hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg font-bold text-sm flex-shrink-0 text-white"
            style={{ background: NAVY }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              <h3 className="font-semibold text-foreground leading-tight truncate flex-1 min-w-0">{startup.name}</h3>
              {startup.techosystemMember === 'Member' && (
                <Badge className="text-[10px] shrink-0 text-white border-0 px-1.5 py-0" style={{ background: RED }}>
                  ✓ Member
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {startup.vertical   && <Badge variant="outline" className="text-[10px] px-1.5 py-0 max-w-[120px] truncate">{startup.vertical}</Badge>}
              {startup.roundStage && <Badge variant="outline" className="text-[10px] px-1.5 py-0">{startup.roundStage}</Badge>}
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
        <div className="flex items-center justify-between mt-1">
          {startup.linkToNews ? (
            <a
              href={startup.linkToNews}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-medium hover:underline"
              style={{ color: RED }}
              onClick={e => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3" />
              View news
            </a>
          ) : <span />}
          <span className="text-[10px] text-muted-foreground">Tap for details →</span>
        </div>
      </CardContent>
    </Card>
  )
}

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

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (btnRef.current && !btnRef.current.contains(e.target as Node)) {
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
  const [uaOnly, setUaOnly]                       = useState(false)
  const [dateFrom, setDateFrom]                   = useState<string | null>(initialFilter?.dateFrom ?? null)
  const [selectedDeal, setSelectedDeal]           = useState<DealFlowStartup | null>(null)

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
    if (uaOnly)                       result = result.filter(isUkrainian)
    if (dateFrom)                     result = result.filter(s => s.datePublished >= dateFrom)
    if (sortBy === 'highest') result.sort((a, b) => b.investmentSizeUSD - a.investmentSizeUSD)
    if (sortBy === 'lowest')  result.sort((a, b) => a.investmentSizeUSD - b.investmentSizeUSD)
    if (sortBy === 'newest')  result.sort((a, b) =>
      b.year - a.year || b.datePublished.localeCompare(a.datePublished)
    )
    return result
  }, [startups, searchQuery, selectedVerticals, selectedStages, selectedYears, selectedInvType, techosystemOnly, uaOnly, sortBy, dateFrom])

  const handleAnalyticsFilter = useCallback((f: ChartFilter) => {
    if (f.verticals !== undefined)       setSelectedVerticals(f.verticals)
    if (f.stages !== undefined)          setSelectedStages(f.stages)
    if (f.years !== undefined)           setSelectedYears(f.years)
    if (f.techosystemOnly !== undefined) setTechosystemOnly(f.techosystemOnly)
    if (f.uaOnly !== undefined)          setUaOnly(f.uaOnly)
    if (f.sortBy !== undefined)          setSortBy(f.sortBy)
    setViewMode('deals')
  }, [])

  const activeFilters =
    selectedVerticals.length + selectedStages.length + selectedYears.length +
    (selectedInvType ? 1 : 0) + (techosystemOnly ? 1 : 0) + (uaOnly ? 1 : 0) + (dateFrom ? 1 : 0)

  const clearAll = () => {
    setSelectedVerticals([]); setSelectedStages([]); setSelectedYears([])
    setSelectedInvType(''); setTechosystemOnly(false); setUaOnly(false)
    setSearchQuery(''); setDateFrom(null)
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-muted-foreground">
      Loading deal flow data...
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
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
            Grid
            <span className="rounded-full bg-foreground/10 px-1.5 py-0.5 text-[10px] font-medium">
              {startups.length}
            </span>
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm" className="gap-1.5 h-8"
            onClick={() => setViewMode('list')}
          >
            <LayoutList className="h-4 w-4" />
            List
          </Button>
        </div>

        <a href="/add-deal">
          <Button size="sm" className="gap-1.5 h-8 text-white" style={{ background: RED }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Deal
          </Button>
        </a>
      </div>

      {viewMode === 'analytics' ? (
        <AnalyticsPanel startups={startups} onFilter={handleAnalyticsFilter} />
      ) : viewMode === 'list' ? (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, description, founders..."
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
          <div className="flex flex-wrap items-center gap-2">
            <FilterDropdown label="Vertical" items={ALL_VERTICALS} selected={selectedVerticals} onToggle={v => setSelectedVerticals(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v])} />
            <FilterDropdown label="Round Stage" items={ALL_STAGES} selected={selectedStages} onToggle={v => setSelectedStages(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v])} />
            <FilterDropdown label="Year" items={ALL_YEARS} selected={selectedYears} onToggle={v => setSelectedYears(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v])} />
            <Button variant={techosystemOnly ? 'default' : 'outline'} size="sm" className="h-8" style={techosystemOnly ? { background: RED, color: '#fff', borderColor: RED } : {}} onClick={() => setTechosystemOnly(p => !p)}>Techosystem only</Button>
            <Button variant={uaOnly ? 'default' : 'outline'} size="sm" className="h-8" style={uaOnly ? { background: NAVY, color: '#fff', borderColor: NAVY } : {}} onClick={() => setUaOnly(p => !p)}>Ukrainian only</Button>
            {activeFilters > 0 && <Button variant="ghost" size="sm" className="h-8 text-muted-foreground" onClick={clearAll}>Clear all ({activeFilters})</Button>}
          </div>
          <div className="text-sm text-muted-foreground">Showing {filtered.length} of {startups.length} deals</div>
          {filtered.length > 0 ? (
            <div className="flex flex-col gap-2">
              {filtered.map(s => (
                <DealListRow key={s.id} startup={s} onClick={() => setSelectedDeal(s)} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-muted-foreground">No deals match your filters</div>
              <Button variant="link" onClick={clearAll}>Clear all filters</Button>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, description, founders..."
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

          <div className="flex flex-wrap items-center gap-2">
            <FilterDropdown
              label="Vertical" items={ALL_VERTICALS} selected={selectedVerticals}
              onToggle={v => setSelectedVerticals(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v])}
            />
            <FilterDropdown
              label="Round Stage" items={ALL_STAGES} selected={selectedStages}
              onToggle={v => setSelectedStages(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v])}
            />
            <FilterDropdown
              label="Year" items={ALL_YEARS} selected={selectedYears}
              onToggle={v => setSelectedYears(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v])}
            />
            <FilterDropdown
              label="Investment Type" items={['New', 'Follow-up']}
              selected={selectedInvType ? [selectedInvType] : []}
              onToggle={v => setSelectedInvType(p => p === v ? '' : v)}
            />

            <Button
              variant={techosystemOnly ? 'default' : 'outline'}
              size="sm" className="h-8"
              style={techosystemOnly ? { background: RED, color: '#fff', borderColor: RED } : {}}
              onClick={() => setTechosystemOnly(p => !p)}
            >
              Techosystem only
            </Button>

            <Button
              variant={uaOnly ? 'default' : 'outline'}
              size="sm" className="h-8"
              style={uaOnly ? { background: NAVY, color: '#fff', borderColor: NAVY } : {}}
              onClick={() => setUaOnly(p => !p)}
            >
              Ukrainian only
            </Button>

            {dateFrom && (
              <div className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm font-medium"
                style={{ borderColor: RED, color: RED, background: '#e71d3610' }}>
                <span>From {new Date(dateFrom + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                <button onClick={() => setDateFrom(null)} className="ml-0.5 font-bold hover:opacity-70 leading-none">x</button>
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
              {filtered.map(s => (
                <DealCard key={s.id} startup={s} onClick={() => setSelectedDeal(s)} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-muted-foreground">No deals match your filters</div>
              <Button variant="link" onClick={clearAll}>Clear all filters</Button>
            </div>
          )}
        </>
      )}

      <DealDetailSheet startup={selectedDeal} onClose={() => setSelectedDeal(null)} />
    </div>
  )
}
