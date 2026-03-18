'use client'

import { useState, useMemo, useEffect } from 'react'
import { Search, SlidersHorizontal, ExternalLink, MapPin, Calendar, Users } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { DealFlowStartup } from '@/lib/airtable'

// ── Verticals present in the Dealflow Database ───────────────
const ALL_VERTICALS = [
  'Defense', 'AI', 'Cybersecurity', 'Fintech', 'Healthcare', 'AgriTech',
  'SaaS', 'Hardware', 'EdTech', 'Marketing & Media', 'Energy',
  'Consumer', 'HRTech', 'Business Productivity', 'E-commerce',
  'Logistics & Transportation', 'Property & Construction', 'Aerospace',
  'Gaming', 'Finance', 'Education',
]

const ALL_STAGES = [
  'Pre-seed', 'Seed', 'Series A', 'Series B', 'Series B+', 'Series C', 'Late Stage', 'Bridge',
]

type SortOption = 'newest' | 'highest' | 'lowest'

function formatUSD(amount: number): string {
  if (!amount) return '—'
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000)     return `$${(amount / 1_000).toFixed(0)}K`
  return `$${amount}`
}

function DealCard({ startup }: { startup: DealFlowStartup }) {
  const initials = startup.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??'

  return (
    <Card className="flex flex-col gap-0 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-foreground leading-tight truncate">{startup.name}</h3>
              {startup.techosystemMember === 'Yes' && (
                <Badge variant="secondary" className="text-xs shrink-0">Techosystem</Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {startup.vertical && (
                <Badge variant="outline" className="text-xs">{startup.vertical}</Badge>
              )}
              {startup.roundStage && (
                <Badge variant="outline" className="text-xs">{startup.roundStage}</Badge>
              )}
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
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-primary hover:underline mt-1"
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

export function DealRoomView() {
  const [startups, setStartups]                   = useState<DealFlowStartup[]>([])
  const [loading, setLoading]                     = useState(true)
  const [searchQuery, setSearchQuery]             = useState('')
  const [sortBy, setSortBy]                       = useState<SortOption>('newest')
  const [selectedVerticals, setSelectedVerticals] = useState<string[]>([])
  const [selectedStages, setSelectedStages]       = useState<string[]>([])

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
    if (selectedVerticals.length > 0)
      result = result.filter(s => selectedVerticals.includes(s.vertical))
    if (selectedStages.length > 0)
      result = result.filter(s => selectedStages.includes(s.roundStage))
    if (sortBy === 'highest') result.sort((a, b) => b.investmentSizeUSD - a.investmentSizeUSD)
    if (sortBy === 'lowest')  result.sort((a, b) => a.investmentSizeUSD - b.investmentSizeUSD)
    if (sortBy === 'newest')  result.sort((a, b) => b.year - a.year || b.datePublished.localeCompare(a.datePublished))
    return result
  }, [startups, searchQuery, selectedVerticals, selectedStages, sortBy])

  const toggleVertical = (v: string) =>
    setSelectedVerticals(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])
  const toggleStage = (s: string) =>
    setSelectedStages(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-muted-foreground">
      Loading deal flow data…
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Search + Sort */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
      <div className="flex flex-wrap items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Vertical
              {selectedVerticals.length > 0 && (
                <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                  {selectedVerticals.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 max-h-64 overflow-y-auto">
            {ALL_VERTICALS.map(v => (
              <DropdownMenuCheckboxItem
                key={v}
                checked={selectedVerticals.includes(v)}
                onCheckedChange={() => toggleVertical(v)}
              >
                {v}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              Round Stage
              {selectedStages.length > 0 && (
                <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                  {selectedStages.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {ALL_STAGES.map(s => (
              <DropdownMenuCheckboxItem
                key={s}
                checked={selectedStages.includes(s)}
                onCheckedChange={() => toggleStage(s)}
              >
                {s}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {(selectedVerticals.length > 0 || selectedStages.length > 0) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSelectedVerticals([]); setSelectedStages([]) }}
            className="text-muted-foreground"
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Count */}
      <div className="text-sm text-muted-foreground">
        Showing {filtered.length} of {startups.length} deals
      </div>

      {/* Cards */}
      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(s => (
            <DealCard key={s.id} startup={s} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-muted-foreground">No deals match your filters</div>
          <Button
            variant="link"
            onClick={() => { setSelectedVerticals([]); setSelectedStages([]); setSearchQuery('') }}
          >
            Clear all filters
          </Button>
        </div>
      )}
    </div>
  )
}
