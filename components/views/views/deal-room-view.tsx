'use client'

import { useState, useMemo } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { StartupCard } from '@/components/startup-card'
import { StartupDetailSheet } from '@/components/startup-detail-sheet'
import {
  startups,
  verticals,
  roundStages,
  legalHQs,
  dealYears,
  type Startup,
  type Vertical,
  type RoundStage,
  type LegalHQ,
  type DealYear,
} from '@/lib/mock-data'

type SortOption = 'newest' | 'highest' | 'lowest'

export function DealRoomView() {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [selectedVerticals, setSelectedVerticals] = useState<Vertical[]>([])
  const [selectedStages, setSelectedStages] = useState<RoundStage[]>([])
  const [selectedHQ, setSelectedHQ] = useState<LegalHQ | 'all'>('all')
  const [selectedYear, setSelectedYear] = useState<DealYear | 'all'>('all')
  const [selectedStartup, setSelectedStartup] = useState<Startup | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const filteredStartups = useMemo(() => {
    let result = [...startups]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query) ||
          s.founders.some((f) => f.name.toLowerCase().includes(query))
      )
    }

    // Vertical filter
    if (selectedVerticals.length > 0) {
      result = result.filter((s) =>
        s.verticals.some((v) => selectedVerticals.includes(v))
      )
    }

    // Stage filter
    if (selectedStages.length > 0) {
      result = result.filter((s) => selectedStages.includes(s.roundStage))
    }

    // HQ filter
    if (selectedHQ !== 'all') {
      result = result.filter((s) => s.legalHQ === selectedHQ)
    }

    // Year filter
    if (selectedYear !== 'all') {
      result = result.filter((s) => s.dealDate.startsWith(selectedYear))
    }

    // Sort
    switch (sortBy) {
      case 'highest':
        result.sort((a, b) => b.targetRaise - a.targetRaise)
        break
      case 'lowest':
        result.sort((a, b) => a.targetRaise - b.targetRaise)
        break
      default:
        // newest - keep original order (mock assumes newest first)
        break
    }

    return result
  }, [searchQuery, selectedVerticals, selectedStages, selectedHQ, selectedYear, sortBy])

  const toggleVertical = (vertical: Vertical) => {
    setSelectedVerticals((prev) =>
      prev.includes(vertical)
        ? prev.filter((v) => v !== vertical)
        : [...prev, vertical]
    )
  }

  const toggleStage = (stage: RoundStage) => {
    setSelectedStages((prev) =>
      prev.includes(stage) ? prev.filter((s) => s !== stage) : [...prev, stage]
    )
  }

  const handleCardClick = (startup: Startup) => {
    setSelectedStartup(startup)
    setSheetOpen(true)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Search and Sort Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search startups, founders, investors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="highest">Highest Raise</SelectItem>
            <SelectItem value="lowest">Lowest Raise</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Filters Row */}
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
          <DropdownMenuContent align="start" className="w-56">
            {verticals.map((vertical) => (
              <DropdownMenuCheckboxItem
                key={vertical}
                checked={selectedVerticals.includes(vertical)}
                onCheckedChange={() => toggleVertical(vertical)}
              >
                {vertical}
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
            {roundStages.map((stage) => (
              <DropdownMenuCheckboxItem
                key={stage}
                checked={selectedStages.includes(stage)}
                onCheckedChange={() => toggleStage(stage)}
              >
                {stage}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Select
          value={selectedHQ}
          onValueChange={(v) => setSelectedHQ(v as LegalHQ | 'all')}
        >
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="Legal HQ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {legalHQs.map((hq) => (
              <SelectItem key={hq} value={hq}>
                {hq}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedYear}
          onValueChange={(v) => setSelectedYear(v as DealYear | 'all')}
        >
          <SelectTrigger className="w-[120px] h-9">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {dealYears.map((year) => (
              <SelectItem key={year} value={year}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(selectedVerticals.length > 0 ||
          selectedStages.length > 0 ||
          selectedHQ !== 'all' ||
          selectedYear !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedVerticals([])
              setSelectedStages([])
              setSelectedHQ('all')
              setSelectedYear('all')
            }}
            className="text-muted-foreground"
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredStartups.length} of {startups.length} deals
      </div>

      {/* Startup Cards Grid */}
      {filteredStartups.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredStartups.map((startup) => (
            <StartupCard
              key={startup.id}
              startup={startup}
              onClick={() => handleCardClick(startup)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-muted-foreground">No deals match your filters</div>
          <Button
            variant="link"
            onClick={() => {
              setSelectedVerticals([])
              setSelectedStages([])
              setSelectedHQ('all')
              setSelectedYear('all')
              setSearchQuery('')
            }}
          >
            Clear all filters
          </Button>
        </div>
      )}

      {/* Detail Sheet */}
      <StartupDetailSheet
        startup={selectedStartup}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  )
}
