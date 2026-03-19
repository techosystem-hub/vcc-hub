'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

interface NewsItem {
  title: string
  link: string
  pubDate: string
  timestamp: number
  description: string
  source: string
}

interface VCCEvent {
  id: string
  title: string
  date: string
  endDate?: string
  location: string
  url: string
  source: string
  description: string
  type: string
  tags: string[]
  isPrivate?: boolean
}

const NEWS_SOURCES = ['All', 'AIN.UA', 'DOU.UA', 'Forbes Ukraine', 'EU-Startups', 'Sifted', 'TechCrunch']

const SOURCE_COLORS: Record<string, string> = {
  'AIN.UA':          'bg-blue-100 text-blue-800',
  'DOU.UA':          'bg-green-100 text-green-800',
  'Forbes Ukraine':  'bg-yellow-100 text-yellow-800',
  'EU-Startups':     'bg-purple-100 text-purple-800',
  'Sifted':          'bg-pink-100 text-pink-800',
  'TechCrunch':      'bg-orange-100 text-orange-800',
}

const EVENT_TYPE_OPTIONS = ['Conference', 'Demo Day', 'Networking', 'Grant/Application', 'Workshop', 'Forum', 'Other']

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (days  > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (mins  > 0) return `${mins}m ago`
  return 'just now'
}

function daysUntil(dateStr: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const event = new Date(dateStr); event.setHours(0, 0, 0, 0)
  return Math.ceil((event.getTime() - today.getTime()) / 86400000)
}

function formatEventDate(dateStr: string): { month: string; day: string } {
  const d = new Date(dateStr)
  return {
    month: d.toLocaleString('en', { month: 'short' }).toUpperCase(),
    day:   String(d.getDate()),
  }
}

// âââ Add Event Modal âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

function AddEventModal({
  open,
  onClose,
  onAdded,
}: {
  open: boolean
  onClose: () => void
  onAdded: () => void
}) {
  const [form, setForm] = useState({
    title: '', date: '', endDate: '', location: '',
    type: 'Other', url: '', description: '', tags: '', isPrivate: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  function set(field: string, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit() {
    if (!form.title || !form.date) { setError('Title and start date are required'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) }),
      })
      if (!res.ok) { const j = await res.json(); throw new Error(j.error || 'Failed') }
      onAdded()
      onClose()
      setForm({ title: '', date: '', endDate: '', location: '', type: 'Other', url: '', description: '', tags: '', isPrivate: false })
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[#011627]">Add Event</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs font-medium text-gray-700">Title *</Label>
            <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Event name" className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium text-gray-700">Start Date *</Label>
              <Input type="date" value={form.date} onChange={e => set('date', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-700">End Date</Label>
              <Input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} className="mt-1" />
            </div>
          </div>
          <div>
            <Label className="text-xs font-medium text-gray-700">Location</Label>
            <Input value={form.location} onChange={e => set('location', e.target.value)} placeholder="City or Online" className="mt-1" />
          </div>
          <div>
            <Label className="text-xs font-medium text-gray-700">Type</Label>
            <Select value={form.type} onValueChange={v => set('type', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {EVENT_TYPE_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-medium text-gray-700">URL</Label>
            <Input value={form.url} onChange={e => set('url', e.target.value)} placeholder="https://..." className="mt-1" />
          </div>
          <div>
            <Label className="text-xs font-medium text-gray-700">Description</Label>
            <Textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} placeholder="Brief description..." className="mt-1" />
          </div>
          <div>
            <Label className="text-xs font-medium text-gray-700">Tags (comma-separated)</Label>
            <Input value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="VC, Ukraine, SaaS" className="mt-1" />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="isPrivate" checked={form.isPrivate} onCheckedChange={v => set('isPrivate', Boolean(v))} />
            <Label htmlFor="isPrivate" className="text-sm cursor-pointer">Private (VCC members only)</Label>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading} style={{ backgroundColor: '#e71d36', color: '#fff' }}>
            {loading ? 'Adding...' : 'Add Event'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// âââ Main Dashboard âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export function AnalyticsView() {
  const [news,         setNews]         = useState<NewsItem[]>([])
  const [events,       setEvents]       = useState<VCCEvent[]>([])
  const [stats,        setStats]        = useState<any>(null)
  const [newsSource,   setNewsSource]   = useState('All')
  const [newsPage,     setNewsPage]     = useState(1)
  const [loading,      setLoading]      = useState(true)
  const [refreshing,   setRefreshing]   = useState(false)
  const [addEventOpen, setAddEventOpen] = useState(false)

  const PAGE_SIZE = 10

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else           setLoading(true)
    try {
      const [newsRes, eventsRes, dealsRes] = await Promise.allSettled([
        fetch('/api/news').then(r => r.json()),
        fetch('/api/events').then(r => r.json()),
        fetch('/api/dealflow').then(r => r.json()),
      ])
      if (newsRes.status   === 'fulfilled') setNews(newsRes.value.items     ?? [])
      if (eventsRes.status === 'fulfilled') setEvents(eventsRes.value.events ?? [])
      if (dealsRes.status  === 'fulfilled') setStats(dealsRes.value)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ââ Derived stats ââ
  const now      = Date.now()
  const msMonth  = 30 * 86400000
  const msWeek   =  7 * 86400000
  const deals    = stats?.records ?? []
  const totalDeals = deals.length
  const thisMonth  = deals.filter((d: any) => {
    const t = d.fields?.['Created Time'] ?? d.createdTime
    return t && now - new Date(t).getTime() < msMonth
  }).length
  const thisWeek = deals.filter((d: any) => {
    const t = d.fields?.['Created Time'] ?? d.createdTime
    return t && now - new Date(t).getTime() < msWeek
  }).length
  const verticals: Record<string, number> = {}
  deals.forEach((d: any) => {
    const v = d.fields?.['Vertical'] ?? d.fields?.['Industry'] ?? ''
    if (Array.isArray(v)) v.forEach((x: string) => { verticals[x] = (verticals[x] || 0) + 1 })
    else if (v) verticals[v] = (verticals[v] || 0) + 1
  })
  const topVertical = Object.entries(verticals).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'â'

  // ââ Filtered news ââ
  const filteredNews = newsSource === 'All' ? news : news.filter(n => n.source === newsSource)
  const visibleNews  = filteredNews.slice(0, newsPage * PAGE_SIZE)

  // ââ Loading state ââ
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#e71d36] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading Intelligence Hubâ¦</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* ââ Header ââ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#011627]">Intelligence Hub</h1>
          <p className="text-sm text-gray-500 mt-0.5">{today}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchAll(true)}
          disabled={refreshing}
          className="gap-2"
        >
          <svg
            className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {refreshing ? 'Refreshingâ¦' : 'Refresh'}
        </Button>
      </div>

      {/* ââ Stats strip ââ */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Deals',  value: totalDeals  },
          { label: 'This Month',   value: thisMonth   },
          { label: 'This Week',    value: thisWeek    },
          { label: 'Top Vertical', value: topVertical },
        ].map(s => (
          <Card key={s.label} className="border border-gray-100 shadow-none">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{s.label}</p>
              <p className="text-2xl font-bold text-[#011627] mt-1">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ââ Main 2/3 + 1/3 grid ââ */}
      <div className="grid grid-cols-3 gap-6">

        {/* ââ News Feed (2 cols) ââ */}
        <div className="col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#011627]">Market News</h2>
            <span className="text-xs text-gray-400">{filteredNews.length} articles</span>
          </div>

          {/* Source filter tabs */}
          <div className="flex gap-2 flex-wrap">
            {NEWS_SOURCES.map(s => (
              <button
                key={s}
                onClick={() => { setNewsSource(s); setNewsPage(1) }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  newsSource === s
                    ? 'bg-[#011627] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* News cards */}
          <div className="space-y-2">
            {visibleNews.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">No articles found</p>
            ) : visibleNews.map((item, i) => (
              <a
                key={i}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-4 rounded-lg border border-gray-100 hover:border-[#e71d36]/30 hover:bg-red-50/30 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SOURCE_COLORS[item.source] ?? 'bg-gray-100 text-gray-700'}`}>
                      {item.source}
                    </span>
                    <span className="text-xs text-gray-400">{timeAgo(item.timestamp)}</span>
                  </div>
                  <p className="text-sm font-medium text-[#011627] group-hover:text-[#e71d36] transition-colors line-clamp-2">
                    {item.title}
                  </p>
                  {item.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                  )}
                </div>
                <svg className="w-4 h-4 text-gray-300 group-hover:text-[#e71d36] flex-shrink-0 mt-1 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            ))}
          </div>

          {visibleNews.length < filteredNews.length && (
            <Button variant="outline" className="w-full text-sm" onClick={() => setNewsPage(p => p + 1)}>
              Load more ({filteredNews.length - visibleNews.length} remaining)
            </Button>
          )}
        </div>

        {/* ââ Events sidebar (1 col) ââ */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#011627]">Upcoming Events</h2>
            <Button
              size="sm"
              onClick={() => setAddEventOpen(true)}
              style={{ backgroundColor: '#e71d36', color: '#fff' }}
              className="h-7 px-2 text-xs"
            >
              + Add
            </Button>
          </div>

          <div className="space-y-3">
            {events.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No upcoming events</p>
            ) : events.map(ev => {
              const { month, day } = formatEventDate(ev.date)
              const d = daysUntil(ev.date)
              return (
                <a
                  key={ev.id}
                  href={ev.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex gap-3 p-3 rounded-lg border border-gray-100 hover:border-[#e71d36]/30 hover:bg-red-50/30 transition-colors group"
                >
                  {/* Date widget */}
                  <div className="flex-shrink-0 w-11 text-center">
                    <div className="bg-[#011627] text-white text-[10px] font-bold uppercase rounded-t px-1 py-0.5">{month}</div>
                    <div className="border border-t-0 border-gray-200 rounded-b text-lg font-bold text-[#011627] leading-7">{day}</div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#011627] group-hover:text-[#e71d36] transition-colors line-clamp-2 leading-snug">
                      {ev.title}
                    </p>
                    {ev.location && (
                      <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                        <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {ev.location}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {d <= 0 ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Today</span>
                      ) : d === 1 ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">Tomorrow</span>
                      ) : d <= 7 ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">in {d}d</span>
                      ) : d <= 30 ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">in {d}d</span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">in {d}d</span>
                      )}
                      {ev.isPrivate && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">Private</span>
                      )}
                      {ev.tags?.[0] && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">{ev.tags[0]}</span>
                      )}
                    </div>
                  </div>
                </a>
              )
            })}
          </div>
        </div>
      </div>

      <AddEventModal
        open={addEventOpen}
        onClose={() => setAddEventOpen(false)}
        onAdded={() => fetchAll(true)}
      />
    </div>
  )
}
