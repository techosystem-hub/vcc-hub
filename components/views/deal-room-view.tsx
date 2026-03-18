'use client'

import { useState, useMemo, useEffect } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { StartupCard } from '@/components/startup-card'
import { StartupDetailSheet } from '@/components/startup-detail-sheet'
import type { Startup as AirtableStartup } from '@/lib/airtable'

// Adapt Airtable startup to V0 shape
interface Startup {
  id: string
  name: string
  description: string
  verticals: string[]
  roundStage: string
  targetRaise: number
  legalHQ: string
  diiaCity: boolean
  founders: { name: string; role: string; linkedin?: string }[]
  existingInvestors: string[]
  newsUrl?: string
  logoPlaceholder: string
  matchScore?: number
  matchReasons?: string[]
  dealDate: string
}

function toViewStartup(s: AirtableStartup): Startup {
  const initials = s.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return {
    id:               s.id,
    name:             s.name,
    description:      s.description,
    verticals:        s.primaryVertical,
    roundStage:       s.roundStage,
    targetRaise:      s.targetRaiseAmount || 0,
    legalHQ:          s.entityType || 'Unknown',
    diiaCity:         false,
    founders:         [],
    existingInvestors:[],
    logoPlaceholder:  initials || '??',
    dealDate:         s.addedDate || new Date().toISOString(),
  }
}

type SortOption = 'newest' | 'highest' | 'lowest'
const ALL_VERTICALS = [
  'Defense / MilTech', 'AI / ML', 'Cybersecurity', 'Fintech', 'HealthTech', 'AgriTech',
  'SaaS (General)', 'Hardware / IoT', 'EdTech', 'Marketing & Media', 'Energy & Environment',
  'Consumer products', 'HRTech', 'Business Productivity', 'E-commerce & Retail', 'Logistics & Transportation',
]
const ALL_STAGES = ['Angel Investment', 'Pre-seed', 'Seed', 'Late Seed / Bridge', 'Series A', 'Series B+']

export function DealRoomView() {
  const [startups, setStartups]               = useState<Startup[]>([])
  const [loading, setLoading]                 = useState(true)
  const [searchQuery, setSearchQuery]         = useState('')
  const [sortBy, setSortBy]                   = useState<SortOption>('newest')
  const [selectedVerticals, setSelectedVerticals] = useState<string[]>([])
  const [selectedStages, setSelectedStages]   = useState<string[]>([])
  const [selectedStartup, setSelectedStartup] = useState<Startup | null>(null)
  const [sheetOpen, setSheetOpen]             = useState(false)

  useEffect(() => {
    fetch('/api/startups')
      .then(r => r.json())
      .then((data: AirtableStartup[]) => {
        setStartups(data.map(toViewStartup))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let result = [...startups]
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(s => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q))
    }
    if (selectedVerticals.length > 0)
      result = result.filter(s => s.verticals.some(v => selectedVerticals.includes(v)))
    if (selectedStages.length > 0)
      result = result.filter(s => selectedStages.includes(s.roundStage))
    if (sortBy === 'highest') result.sort((a, b) => b.targetRaise - a.targetRaise)
    if (sortBy === 'lowest')  result.sort((a, b) => a.targetRaise - b.targetRaise)
    return result
  }, [startups, searchQuery, selectedVerticals, selectedStages, sortBy])

  const toggleVertical = (v: string) =>
    setSelectedVerticals(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])
  const toggleStage = (s: string) =>
    setSelectedStages(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  if (loading) return <div className="flex items-center justify-center py-20 text-muted-foreground">Loading deals…</div>

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search startups…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={sortBy} onValueChange={v => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="highest">Highest Raise</SelectItem>
            <SelectItem value="lowest">Lowest Raise</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Vertical
              {selectedVerticals.length > 0 && (
                <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">{selectedVerticals.length}</span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {ALL_VERTICALS.map(v => (
              <DropdownMenuCheckboxItem key={v} checked={selectedVerticals.includes(v)} onCheckedChange={() => toggleVertical(v)}>{v}</DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              Round Stage
              {selectedStages.length > 0 && (
                <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">{selectedStages.length}</span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {ALL_STAGES.map(s => (
              <DropdownMenuCheckboxItem key={s} checked={selectedStages.includes(s)} onCheckedChange={() => toggleStage(s)}>{s}</DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {(selectedVerticals.length > 0 || selectedStages.length > 0) && (
          <Button variant="ghost" size="sm" onClick={() => { setSelectedVerticals([]); setSelectedStages([]) }} className="text-muted-foreground">
            Clear all
          </Button>
        )}
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {filtered.length} of {startups.length} deals
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(s => (
            <StartupCard key={s.id} startup={s as any} onClick={() => { setSelectedStartup(s); setSheetOpen(true) }} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-muted-foreground">No deals match your filters</div>
          <Button variant="link" onClick={() => { setSelectedVerticals([]); setSelectedStages([]); setSearchQuery('') }}>
            Clear all filters
          </Button>
        </div>
      )}

      <StartupDetailSheet startup={selectedStartup as any} open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  )
}
