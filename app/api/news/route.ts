import { NextResponse } from 'next/server'

export const revalidate = 0

const UA = 'Mozilla/5.0 (compatible; VCC-HubBot/1.0)'

interface FeedItem {
  id: string
  title: string
  url: string
  publishedAt: string
  timestamp: number
  description: string
  source: string
}

const UKRAINE_KW = ['ukraine', 'ukrainian']

const FEEDS: Array<{ name: string; url: string; filter: string[] | null }> = [
  { name: 'TechUkraine', url: 'https://techukraine.org/feed/',       filter: null       },
  { name: 'Speka',       url: 'https://speka.ua/rss',                filter: null       },
  { name: 'InVenture',   url: 'https://inventure.com.ua/news.rss',   filter: null       },
  { name: 'AIN.UA',      url: 'https://en.ain.ua/feed/',             filter: null       },
  { name: 'Vector',      url: 'https://vctr.media/ua/feed/',         filter: null       },
  { name: 'The Recursive', url: 'https://therecursive.com/feed/',    filter: null       },
  { name: 'TechCrunch',   url: 'https://techcrunch.com/feed/',       filter: UKRAINE_KW },
  { name: 'Sifted',       url: 'https://sifted.eu/feed',             filter: UKRAINE_KW },
  { name: 'VentureBeat',  url: 'https://venturebeat.com/feed/',      filter: UKRAINE_KW },
  { name: 'Wired',        url: 'https://www.wired.com/feed/rss',     filter: UKRAINE_KW },
]

function getTagText(block: string, tag: string): string {
  // CDATA: <tag><![CDATA[...]]></tag>
  const esc = tag.replace(':', '\\:')
  const cdRe = new RegExp(`<${esc}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>`, 'i')
  const cdM = cdRe.exec(block)
  if (cdM) return cdM[1].trim()
  // Plain text: <tag>text</tag>
  const txRe = new RegExp(`<${esc}[^>]*>([^<]*)<`, 'i')
  const txM = txRe.exec(block)
  if (txM) return txM[1].trim()
  return ''
}

function getLinkUrl(block: string): string {
  // Atom: <link href="https://..."/>
  const atomM = /<link[^>]+href="([^"]+)"/i.exec(block)
  if (atomM) return atomM[1]
  // RSS: <link>https://...</link>
  const rssM = /<link[^>]*>\s*(https?:\/\/[^<\s]+)/i.exec(block)
  if (rssM) return rssM[1].trim()
  return ''
}

function stripHtml(s: string): string {
  return s
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#\d+;/g, ' ').replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ').trim().slice(0, 300)
}

function parseFeed(xml: string, source: string, filter: string[] | null): FeedItem[] {
  const items: FeedItem[] = []
  const re = /<(item|entry)[\s>]([\s\S]*?)<\/\1>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) !== null) {
    const b = m[2]
    const title = getTagText(b, 'title')
    if (!title) continue

    const url = getLinkUrl(b) ||
      getTagText(b, 'guid') ||
      getTagText(b, 'id')
    if (!url.startsWith('http')) continue

    const rawDate =
      getTagText(b, 'pubDate') ||
      getTagText(b, 'published') ||
      getTagText(b, 'updated') ||
      getTagText(b, 'dc:date')
    const ts = rawDate ? Date.parse(rawDate) : 0
    const timestamp = isNaN(ts) || ts === 0 ? Date.now() : ts

    const rawDesc =
      getTagText(b, 'description') ||
      getTagText(b, 'summary') ||
      getTagText(b, 'content:encoded') ||
      getTagText(b, 'content')
    const description = stripHtml(rawDesc)

    if (filter) {
      const hay = (title + ' ' + description).toLowerCase()
      if (!filter.some(k => hay.includes(k))) continue
    }

    items.push({
      id: url,
      title: stripHtml(title),
      url,
      publishedAt: new Date(timestamp).toISOString(),
      timestamp,
      description,
      source,
    })
  }
  return items.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10)
}

export async function GET() {
  const settled = await Promise.allSettled(
    FEEDS.map(async ({ name, url, filter }) => {
      const ctrl = new AbortController()
      const t = setTimeout(() => ctrl.abort(), 8000)
      try {
        const res = await fetch(url, {
          signal: ctrl.signal,
          headers: {
            'User-Agent': UA,
            'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
          },
          cache: 'no-store',
        })
        clearTimeout(t)
        if (!res.ok) return []
        const xml = await res.text()
        return parseFeed(xml, name, filter)
      } catch {
        clearTimeout(t)
        return []
      }
    })
  )

  const items = settled
    .flatMap(r => r.status === 'fulfilled' ? r.value : [])
    .sort((a, b) => b.timestamp - a.timestamp)

  return NextResponse.json(items)
}
