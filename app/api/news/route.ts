import { NextResponse } from 'next/server'

export const revalidate = 3600

interface NewsItem {
  title: string
  link: string
  pubDate: string
  timestamp: number
  description: string
  source: string
}

const STARTUP_INVEST_KW = [
  'startup', 'invest', 'fund', 'venture', 'round', 'raise', 'raised',
  'seed', 'series', 'accelerat', 'grant', 'ipo', 'acquisition', 'angel',
  'pre-seed', 'valuation', 'exit',
]

const FEEDS = [
  // Ukrainian sources — startups & investments only
  { name: 'AIN.UA',      url: 'https://en.ain.ua/feed/',          filter: STARTUP_INVEST_KW as string[] | null },
  { name: 'Speka',       url: 'https://speka.media/feed/',        filter: null as string[] | null },
  { name: 'Vector',      url: 'https://vctr.media/feed/',         filter: STARTUP_INVEST_KW },
  { name: 'TechUkraine', url: 'https://techukraine.org/feed/',    filter: null },
  { name: 'InVenture',   url: 'https://inventure.com.ua/rss',     filter: null },
  // International sources — Ukraine-related only
  { name: 'TechCrunch',  url: 'https://techcrunch.com/feed/',     filter: ['ukraine', 'ukrainian'] },
  { name: 'VentureBeat', url: 'https://venturebeat.com/feed/',    filter: ['ukraine', 'ukrainian'] },
  { name: 'Wired',       url: 'https://www.wired.com/feed/rss',   filter: ['ukraine', 'ukrainian'] },
]

function getTag(xml: string, t: string): string {
  const cdata = xml.match(new RegExp('<' + t + '[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]>', 'i'))
  if (cdata) return cdata[1].trim()
  const plain = xml.match(new RegExp('<' + t + '[^>]*>([\\s\\S]*?)<\\/' + t + '>', 'i'))
  return plain ? plain[1].replace(/<[^>]+>/g, '').trim() : ''
}

async function parseFeed(feed: typeof FEEDS[0]): Promise<NewsItem[]> {
  try {
    const res = await fetch(feed.url, {
      headers: { 'User-Agent': 'VCC-Hub/1.0 RSS Reader' },
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    const xml = await res.text()
    const items = xml.match(/<item[\s>]([\s\S]*?)<\/item>/g) ?? []
    return items.slice(0, 25).flatMap(item => {
      const title       = getTag(item, 'title')
      const link        = item.match(/<link>([^<\s]+)/)?.[1]?.trim() ?? getTag(item, 'guid')
      const pubDate     = getTag(item, 'pubDate')
      const description = getTag(item, 'description').slice(0, 300)
      if (!title || !link) return []
      if (feed.filter) {
        const txt = (title + ' ' + description).toLowerCase()
        if (!feed.filter.some(kw => txt.includes(kw))) return []
      }
      return [{ title, link, pubDate, timestamp: new Date(pubDate).getTime() || 0, description, source: feed.name }]
    })
  } catch { return [] }
}

export async function GET() {
  const settled = await Promise.allSettled(FEEDS.map(parseFeed))
  const items: NewsItem[] = []
  settled.forEach(r => { if (r.status === 'fulfilled') items.push(...r.value) })
  items.sort((a, b) => b.timestamp - a.timestamp)
  return NextResponse.json({ items: items.slice(0, 80) })
}
