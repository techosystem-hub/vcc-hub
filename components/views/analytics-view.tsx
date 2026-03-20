'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// âââ Types ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
interface NewsItem {
  id: string
  title: string
  description: string
  url: string
  source: string
  publishedAt: string
  timestamp: number
  category?: string
}

interface VCCEvent {
  id: string
  title: string
  date: string
  endDate?: string
  location?: string
  url?: string
  description?: string
  type?: string
  tags?: string[]
  isPrivate?: boolean
  source: 'curated' | 'custom'
}

// âââ Constants ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// Source filter list is derived dynamically from loaded articles (see component state)

const SOURCE_COLORS: Record<string, string> = {
  'AIN.UA':      '#005bbb',
  'Speka':       '#f97316',
  'Vector':      '#0ea5e9',
  'TechUkraine': '#16a34a',
  'InVenture':   '#7c3aed',
  'TechCrunch':  '#0a7c59',
  'VentureBeat': '#6d28d9',
  'Wired':       '#374151',
}

const EVENT_TYPE_OPTIONS = [
  'Conference', 'Demo Day', 'Networking', 'Grant Application',
  'Workshop', 'Forum', 'Other',
]

// âââ Helpers ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3_600_000)
  const d = Math.floor(diff / 86_400_000)
  if (h < 1)  return 'Just now'
  if (h < 24) return `${h}h ago`
  if (d < 7)  return `${d}d ago`
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000)
}

function formatEventDate(dateStr: string) {
  const d = new Date(dateStr)
  return {
    month:   d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    day:     String(d.getDate()),
    weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
  }
}

// âââ Inline SVG Icons âââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
function IconBriefcase({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
}
function IconCalendar({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}
function IconTrendingUp({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  )
}
function IconTag({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  )
}
function IconRefresh({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  )
}
function IconExternalLink({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  )
}
function IconMapPin({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}
function IconPlus({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  )
}
function IconClock({ className = 'w-3 h-3' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

// âââ Stat Card ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
function StatCard({
  icon, label, value, accent,
}: { icon: React.ReactNode; label: string; value: string; accent: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`rounded-xl p-3 flex-shrink-0 ${accent}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-semibold tracking-widest uppercase text-gray-500 mb-0.5 truncate">
          {label}
        </p>
        <p className="text-2xl font-bold text-gray-900 leading-none truncate">{value}</p>
      </div>
    </div>
  )
}

// âââ Source Badge âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
function SourceBadge({ source }: { source: string }) {
  const color = SOURCE_COLORS[source] ?? '#6f7280'
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 flex-shrink-0">
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      {source}
    </span>
  )
}

// âââ Days Badge âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
function DaysBadge({ days }: { days: number }) {
  if (days < 0) return null
  let cls = 'bg-green-50 text-green-700 border-green-200'
  if (days <= 7)  cls = 'bg-red-50 text-red-700 border-red-200'
  else if (days <= 30) cls = 'bg-amber-50 text-amber-700 border-amber-200'
  const label = days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days}d`
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${cls}`}>
      {label}
    </span>
  )
}

// âââ Add Event Modal ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
function AddEventModal({
  open, onClose, onAdded,
}: { open: boolean; onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({
    title: '', date: '', endDate: '', location: '', url: '',
    description: '', type: '', tags: '', isPrivate: false,
  })
  const [saving, setSaving] = useState(false)

  const update = (k: string, v: string | boolean) =>
    setForm(f => ({ ...f, [k]: v }))

  const reset = () =>
    setForm({ title: '', date: '', endDate: '', location: '', url: '',
      description: '', type: '', tags: '', isPrivate: false })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.date) return
    setSaving(true)
    try {
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:       form.title,
          date:        form.date,
          endDate:     form.endDate     || undefined,
          location:    form.location    || undefined,
          url:         form.url         || undefined,
          description: form.description || undefined,
          type:        form.type        || undefined,
          tags:        form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
          isPrivate:   form.isPrivate,
        }),
      })
      onAdded()
      onClose()
      reset()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <span
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#e71d36' }}
            >
              <IconCalendar className="w-4 h-4 text-white" />
            </span>
            Add Event
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="ev-title" className="text-xs font-semibold text-gray-700">
              Event Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="ev-title"
              placeholder="e.g. Tech Summit Kyiv 2026"
              value={form.title}
              onChange={e => update('title', e.target.value)}
              required
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ev-date" className="text-xs font-semibold text-gray-700">
                Start Date <span className="text-red-500">*</span>
              </Label>
              <Input id="ev-date" type="date" value={form.date}
                onChange={e => update('date', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ev-end" className="text-xs font-semibold text-gray-700">End Date</Label>
              <Input id="ev-end" type="date" value={form.endDate}
                onChange={e => update('endDate', e.target.value)} />
            </div>
          </div>

          {/* Type + Location */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ev-type" className="text-xs font-semibold text-gray-700">Type</Label>
              <Select value={form.type} onValueChange={v => update('type', v)}>
                <SelectTrigger id="ev-type">
                  <SelectValue placeholder="Select typeâ¦" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPE_OPTIONS.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ev-location" className="text-xs font-semibold text-gray-700">Location</Label>
              <Input id="ev-location" placeholder="City or Online"
                value={form.location} onChange={e => update('location', e.target.value)} />
            </div>
          </div>

          {/* URL */}
          <div className="space-y-1.5">
            <Label htmlFor="ev-url" className="text-xs font-semibold text-gray-700">Event URL</Label>
            <Input id="ev-url" type="url" placeholder="https://â¦"
              value={form.url} onChange={e => update('url', e.target.value)} />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="ev-desc" className="text-xs font-semibold text-gray-700">Description</Label>
            <Textarea id="ev-desc" rows={2} placeholder="Brief descriptionâ¦"
              value={form.description} onChange={e => update('description', e.target.value)} />
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label htmlFor="ev-tags" className="text-xs font-semibold text-gray-700">
              Tags{' '}
              <span className="font-normal text-gray-400">(comma-separated)</span>
            </Label>
            <Input id="ev-tags" placeholder="fintech, AI, Ukraine"
              value={form.tags} onChange={e => update('tags', e.target.value)} />
          </div>

          {/* Private */}
          <div className="flex items-center gap-2 py-1 border-t border-gray-100">
            <input
              type="checkbox" id="ev-private"
              checked={form.isPrivate}
              onChange={e => update('isPrivate', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
              style={{ accentColor: '#e71d36' }}
            />
            <Label htmlFor="ev-private" className="text-sm font-normal text-gray-700 cursor-pointer">
              Private â visible to VCC members only
            </Label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || !form.title || !form.date}
              style={{ backgroundColor: '#e71d36', borderColor: '#e71d36' }}
              className="text-white hover:opacity-90 transition-opacity"
            >
              {saving ? 'Savingâ¦' : 'Add Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// âââ Main Component âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
export function AnalyticsView() {
  const [news,        setNews]        = useState<NewsItem[]>([])
  const [events,      setEvents]      = useState<VCCEvent[]>([])
  const [totalDeals,  setTotalDeals]  = useState(0)
  const [topVertical, setTopVertical] = useState('â')
  const [monthDeals,  setMonthDeals]  = useState(0)
  const [weekDeals,   setWeekDeals]   = useState(0)
  const [activeSource, setActiveSource] = useState('All')
  const [newsPage,    setNewsPage]    = useState(1)
  const [loading,     setLoading]     = useState(true)
  const [showAdd,     setShowAdd]     = useState(false)
  const [spinning,    setSpinning]    = useState(false)

  const PAGE_SIZE = 5

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [newsRes, eventsRes, dealsRes] = await Promise.all([
        fetch('/api/news'),
        fetch('/api/events'),
        fetch('/api/dealflow'),
      ])
      const [newsData, eventsData, dealsData] = await Promise.all([
        newsRes.json(), eventsRes.json(), dealsRes.json(),
      ])

      setNews(Array.isArray(newsData) ? newsData : (newsData.articles ?? newsData.items ?? []))
      setEvents(Array.isArray(eventsData) ? eventsData : (eventsData.events ?? []))

      if (dealsData?.deals) {
        const deals = dealsData.deals as Array<Record<string, unknown>>
        const now = new Date()
        setTotalDeals(deals.length)
        setMonthDeals(deals.filter(d => {
          const c = new Date(d.createdAt as string)
          return c.getMonth() === now.getMonth() && c.getFullYear() === now.getFullYear()
        }).length)
        setWeekDeals(deals.filter(d =>
          now.getTime() - new Date(d.createdAt as string).getTime() < 7 * 86_400_000
        ).length)
        const counts: Record<string, number> = {}
        deals.forEach(d => { const v = (d.vertical as string) || 'Other'; counts[v] = (counts[v] || 0) + 1 })
        const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
        setTopVertical(top ? top[0] : 'â')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Auto-refresh news silently every hour
  useEffect(() => {
    const refreshNews = async () => {
      try {
        const res = await fetch('/api/news')
        const data = await res.json()
        setNews(Array.isArray(data) ? data : (data.articles ?? data.items ?? []))
      } catch { /* ignore network errors during background refresh */ }
    }
    const interval = setInterval(refreshNews, 60 * 60 * 1000) // 1 hour
    return () => clearInterval(interval)
  }, [])

  const handleRefresh = async () => {
    setSpinning(true)
    await load()
    setSpinning(false)
  }

  // Build source filter list dynamically from loaded articles
  const newsSources   = ['All', ...Array.from(new Set(news.map(n => n.source)))]
  const filteredNews  = activeSource === 'All' ? news : news.filter(n => n.source === activeSource)
  const visibleNews   = filteredNews.slice(0, newsPage * PAGE_SIZE)
  const hasMore       = visibleNews.length < filteredNews.length
  const upcomingEvents = events
    .filter(e => daysUntil(e.date) >= 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  // ââ Loading state ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-8 h-8 border-2 border-gray-200 rounded-full animate-spin"
            style={{ borderTopColor: '#e71d36' }}
          />
          <p className="text-sm text-gray-500">Loading Intelligence Hubâ¦</p>
        </div>
      </div>
    )
  }

  // ââ Main render ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  return (
    <div className="min-h-screen bg-gray-50/60 p-6 space-y-6">

      {/* ââ Header ââ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#011627' }}
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-none">Intelligence Hub</h1>
            <p className="text-xs text-gray-500 mt-0.5">{today}</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 bg-white border border-gray-200 rounded-lg px-3 py-1.5 hover:shadow-sm transition-all"
        >
          <IconRefresh className={`w-3.5 h-3.5 transition-transform ${spinning ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ââ Stats Strip ââ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<IconBriefcase className="w-5 h-5 text-white" />}
          label="Total Deals"
          value={String(totalDeals)}
          accent="bg-[#011627]"
        />
        <StatCard
          icon={<IconCalendar className="w-5 h-5 text-white" />}
          label="This Month"
          value={String(monthDeals)}
          accent="bg-[#e71d36]"
        />
        <StatCard
          icon={<IconTrendingUp className="w-5 h-5 text-white" />}
          label="This Week"
          value={String(weekDeals)}
          accent="bg-teal-600"
        />
        <StatCard
          icon={<IconTag className="w-5 h-5 text-white" />}
          label="Top Vertical"
          value={topVertical}
          accent="bg-violet-600"
        />
      </div>

      {/* ââ Main Content Grid ââ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ââ News Feed (left 2/3) ââ */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Market News</h2>
            <span className="text-xs text-gray-400">{filteredNews.length} articles</span>
          </div>

          {/* Source filter pills â built from actual articles */}
          <div className="flex flex-wrap gap-1.5">
            {newsSources.map(src => (
              <button
                key={src}
                onClick={() => { setActiveSource(src); setNewsPage(1) }}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                  activeSource === src
                    ? 'text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                }`}
                style={activeSource === src ? { backgroundColor: '#011627' } : {}}
              >
                {src}
              </button>
            ))}
          </div>

          {/* Articles */}
          {visibleNews.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">No articles found for this source</p>
            </div>
          ) : (
            <div className="space-y-2">
              {visibleNews.map(article => (
                <a
                  key={article.id}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <SourceBadge source={article.source} />
                        <span className="text-gray-300 select-none">Â·</span>
                        <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                          <IconClock />
                          {timeAgo(article.publishedAt)}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900 leading-snug group-hover:text-[#e71d36] transition-colors line-clamp-2">
                        {article.title}
                      </h3>
                      {article.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                          {article.description}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <IconExternalLink className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                  </div>
                </a>
              ))}

              {hasMore && (
                <button
                  onClick={() => setNewsPage(p => p + 1)}
                  className="w-full text-sm text-gray-500 hover:text-gray-800 bg-white rounded-xl border border-gray-200 py-3 hover:border-gray-300 hover:shadow-sm transition-all font-medium"
                >
                  Load more articles
                </button>
              )}
            </div>
          )}
        </div>

        {/* ââ Events Sidebar (right 1/3) ââ */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Upcoming Events</h2>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowAdd(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-white rounded-lg px-2.5 py-1.5 hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#e71d36' }}
              >
                <IconPlus className="w-3 h-3" />
                Add
              </button>
              <a
                href="https://airtable.com/appzew2eaB6QOy0RF/shrmHmDYsDaYrLFNM"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-white rounded-lg px-2.5 py-1.5 hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#6b7280' }}
              >
                <IconExternalLink className="w-3 h-3" />
                Submit Event
              </a>
            </div>
          </div>

          {upcomingEvents.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-8 text-center">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <IconCalendar className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 mb-3">No upcoming events</p>
              <button
                onClick={() => setShowAdd(true)}
                className="text-xs font-semibold text-white rounded-lg px-3 py-1.5 hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#e71d36' }}
              >
                Add first event
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map(event => {
                const { month, day, weekday } = formatEventDate(event.date)
                const days = daysUntil(event.date)
                return (
                  <div
                    key={event.id}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-stretch">
                      {/* Calendar date block */}
                      <div
                        className="flex-shrink-0 w-14 flex flex-col items-center justify-center py-3 text-center"
                        style={{ backgroundColor: '#011627' }}
                      >
                        <span className="text-[9px] font-bold text-white/70 tracking-widest uppercase leading-none">
                          {month}
                        </span>
                        <span className="text-2xl font-bold text-white leading-tight mt-0.5">
                          {day}
                        </span>
                        <span className="text-[9px] text-white/60 leading-none mt-0.5">
                          {weekday}
                        </span>
                      </div>

                      {/* Event info */}
                      <div className="flex-1 p-3 min-w-0">
                        <div className="flex items-start gap-2 mb-1">
                          <h3 className="flex-1 text-sm font-semibold text-gray-900 leading-snug line-clamp-2 min-w-0">
                            {event.title}
                          </h3>
                          <DaysBadge days={days} />
                        </div>

                        {event.location && (
                          <p className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <IconMapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{event.location}</span>
                          </p>
                        )}

                        {event.type && (
                          <span className="inline-block mt-1.5 text-[10px] font-semibold bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 uppercase tracking-wide">
                            {event.type}
                          </span>
                        )}

                        {event.url && (
                          <a
                            href={event.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-semibold hover:underline"
                            style={{ color: '#e71d36' }}
                            onClick={e => e.stopPropagation()}
                          >
                            View details
                            <IconExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ââ Add Event Modal ââ */}
      <AddEventModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onAdded={load}
      />
    </div>
  )
}
