// ─────────────────────────────────────────────────────────────
// Airtable API layer — all data fetching lives here
// ─────────────────────────────────────────────────────────────

const BASE_ID = process.env.AIRTABLE_BASE_ID!;
const TOKEN   = process.env.AIRTABLE_API_TOKEN!;
const ROOT    = `https://api.airtable.com/v0/${BASE_ID}`;

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
};

// ── Types ────────────────────────────────────────────────────

export type Vertical = 'AI' | 'Defense' | 'SaaS' | 'EdTech' | 'HealthTech' | 'FinTech';
export type Stage    = 'Pre-seed' | 'Seed' | 'Series A' | 'Series B+';
export type Ticket   = '<$50k' | '$50k-$200k' | '$200k-$500k' | '$500k-$1M+';
export type DualUse  = 'Agnostic' | 'Non-lethal only' | 'No military';
export type Role     = 'VCC Member' | 'Admin';
export type StartupStatus = 'New' | 'Actively Raising' | 'Rejected' | 'Closed' | 'Portfolio';
export type MatchStatus   = 'Pending' | 'Requested' | 'Intro Sent' | 'Passed';

export interface Investor {
  id: string;
  name: string;
  email: string;
  description?: string;
  focusVerticals: Vertical[];
  stagePreference: Stage[];
  ticketSize: Ticket[];
  dualUsePolicy: DualUse;
  role: Role;
  whatsapp?: string;
}

export interface Startup {
  id: string;
  name: string;
  description: string;
  logo?: string;
  primaryVertical: Vertical[];
  roundStage: Stage;
  targetRaise: string;           // formatted label e.g. "$500K"
  targetRaiseAmount?: number;    // raw number from Airtable "Target Raise" field
  status: StartupStatus;
  isDualUse: string;
  pitchDeckUrl?: string;
  entityType?: string;
  addedDate?: string;
}

export interface Match {
  id: string;
  startupId: string;
  investorId: string;
  score: number;
  scoreLabel: string;
  whyItMatches: string;
  status: MatchStatus;
  // Populated via two-pass fetch from Startup Pipeline
  startupName: string;
  startupDescription: string;
  startupLogo?: string;
  startupStatus: StartupStatus;
  startupStage: string;
  startupTicket: string;
  startupEntity?: string;
  startupRaiseAmount?: number;
  startupVerticals: Vertical[];
  startupPitchDeck?: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  image?: string;
  publishedDate: string;
  pinned: boolean;
  category?: string;
}

export interface Event {
  id: string;
  eventName: string;
  date: string;
  location?: string;
  description?: string;
  accessLevel: 'Public' | 'VCC Exclusive';
  registrationLink?: string;
}

// ── Generic fetch helper ─────────────────────────────────────

async function fetchTable<T>(
  table: string,
  params: Record<string, string> = {}
): Promise<T[]> {
  const url = new URL(`${ROOT}/${encodeURIComponent(table)}`);
  const { sort, ...otherParams } = params;
  Object.entries(otherParams).forEach(([k, v]) => url.searchParams.set(k, v));
  // Airtable requires array-style sort params: sort[0][field]=X&sort[0][direction]=asc
  if (sort) {
    try {
      const sortArr = JSON.parse(sort) as Array<{ field: string; direction: string }>;
      sortArr.forEach((s, i) => {
        url.searchParams.set(`sort[${i}][field]`, s.field);
        url.searchParams.set(`sort[${i}][direction]`, s.direction);
      });
    } catch { /* invalid sort — ignore */ }
  }

  const records: T[] = [];
  let offset: string | undefined;

  do {
    if (offset) url.searchParams.set('offset', offset);
    const res  = await fetch(url.toString(), { headers, cache: 'no-store' });
    const data = await res.json();
    if (!res.ok) throw new Error(`Airtable error: ${data.error?.message}`);
    records.push(...(data.records || []));
    offset = data.offset;
  } while (offset);

  return records;
}

// ── Investors ────────────────────────────────────────────────
// Table: "Investor Profile"
// Key field mappings:
//   Fund / Organization Name  → name
//   Email for Deal Flow       → email
//   Description               → description  (add as Long text field in Airtable if missing)
//   Primary Focus Areas (Verticals) → focusVerticals
//   Stage Preference          → stagePreference
//   Ticket Size               → ticketSize
//   Does your mandate cover Dual-Use startups? → dualUsePolicy
//   Role                      → role
//   Contact Person (Whatsapp) → whatsapp

function parseInvestor(r: any): Investor {
  const f = r.fields;
  return {
    id:              r.id,
    name:            f['Fund / Organization Name'] || '',
    email:           f['Email for Deal Flow'] || '',
    description:     f['Description'] || '',
    focusVerticals:  (f['Primary Focus Areas (Verticals)'] || []),
    stagePreference: (f['Stage Preference'] || []),
    ticketSize:      (f['Ticket Size'] || []),
    dualUsePolicy:   f['Does your mandate cover Dual-Use startups?'] || 'Agnostic',
    role:            f['Role'] || 'VCC Member',
    whatsapp:        f['Contact Person (Whatsapp)'] || undefined,
  };
}

export async function getInvestorByEmail(email: string): Promise<Investor | null> {
  const formula = `{Email for Deal Flow}="${email}"`;
  const records = await fetchTable<any>('Investor Profile', {
    filterByFormula: formula,
    maxRecords: '1',
  });
  return records.length ? parseInvestor(records[0]) : null;
}

export async function getAllInvestors(): Promise<Investor[]> {
  const records = await fetchTable<any>('Investor Profile');
  return records.map(parseInvestor);
}

export async function updateInvestorCriteria(
  investorId: string,
  data: {
    focusVerticals: Vertical[];
    stagePreference: Stage[];
    ticketSize: Ticket[];
    dualUsePolicy: DualUse;
    description?: string;
  }
) {
  const res = await fetch(`${ROOT}/${encodeURIComponent('Investor Profile')}/${investorId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      fields: {
        'Primary Focus Areas (Verticals)': data.focusVerticals,
        'Stage Preference':                data.stagePreference,
        'Ticket Size':                     data.ticketSize,
        'Does your mandate cover Dual-Use startups?': data.dualUsePolicy,
        'Description':                     data.description || '',
      },
    }),
  });
  if (!res.ok) throw new Error('Failed to update investor criteria');
  return res.json();
}

// ── Startups ─────────────────────────────────────────────────
// Table: "Startup Pipeline"
// Key field mappings:
//   Startup Name      → name
//   Notes             → description  (add "Brief Description" long text if you want richer text)
//   Investment Stage  → roundStage
//   Target Raise      → targetRaiseAmount (number), targetRaise (formatted label)
//   Is Dual-use?      → isDualUse
//   Pitch Deck URL    → pitchDeckUrl
//   Status            → status
//   (no Logo field — initials avatar used as fallback)
//   (no Entity Type field — omitted)

function formatRaiseLabel(amount?: number): string {
  if (!amount) return '';
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000)     return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount}`;
}

function parseStartup(r: any): Startup {
  const f = r.fields;
  const amount = f['Target Raise'] ?? undefined;
  return {
    id:                r.id,
    name:              f['Startup Name'] || '',
    description:       f['Notes'] || '',   // map Notes → description; add "Brief Description" field for better UX
    logo:              undefined,           // no Logo attachment field yet
    primaryVertical:   Array.isArray(f['Primary Vertical'])
                         ? f['Primary Vertical']
                         : f['Primary Vertical'] ? [f['Primary Vertical']] : [],
    roundStage:        f['Investment Stage'] || '',
    targetRaise:       formatRaiseLabel(amount),
    targetRaiseAmount: amount,
    status:            f['Status'] || 'New',
    isDualUse:         f['Is Dual-use?'] || 'No',
    pitchDeckUrl:      f['Pitch Deck URL'] || undefined,
    entityType:        undefined,           // no Entity Type field in Startup Pipeline
    addedDate:         r.createdTime || undefined,
  };
}

export async function getActiveStartups(filters: {
  vertical?: string;
  stage?: string;
} = {}): Promise<Startup[]> {
  let formula = `{Status}="Actively Raising"`;
  if (filters.vertical) formula += ` AND {Primary Vertical}="${filters.vertical}"`;
  if (filters.stage)    formula += ` AND {Investment Stage}="${filters.stage}"`;

  const records = await fetchTable<any>('Startup Pipeline', {
    filterByFormula: formula,
    // sorted by most recently created first (Airtable default is oldest first)
    sort: '[{"field":"Startup Name","direction":"asc"}]',
  });
  return records.map(parseStartup);
}

export async function getAllStartups(): Promise<Startup[]> {
  const records = await fetchTable<any>('Startup Pipeline');
  return records.map(parseStartup);
}

// ── Matches ──────────────────────────────────────────────────
// Table: "Matches"
// Fields: Startup (linked), Investor (linked), Score, Score Label,
//         Why It Matches, Status, Created Date
//
// Startup detail fields are fetched via a second pass from "Startup Pipeline"
// rather than relying on lookup fields (which haven't been set up in Airtable yet).

function parseMatchBase(r: any) {
  const f = r.fields;
  return {
    id:          r.id,
    startupId:   Array.isArray(f['Startup'])  ? f['Startup'][0]  : '',
    investorId:  Array.isArray(f['Investor']) ? f['Investor'][0] : '',
    score:       f['Score'] || 0,
    scoreLabel:  f['Score Label'] || '',
    whyItMatches: f['Why It Matches'] || '',
    status:      (f['Status'] || 'Pending') as MatchStatus,
  };
}

export async function getMatchesForInvestor(investorId: string): Promise<Match[]> {
  // Filter matches for this investor using FIND on the linked record array
  const formula = `FIND("${investorId}", ARRAYJOIN({Investor}, ","))`;
  const records = await fetchTable<any>('Matches', {
    filterByFormula: formula,
    sort: '[{"field":"Score","direction":"desc"}]',
  });

  if (records.length === 0) return [];

  // Two-pass: collect unique startup IDs, then fetch their details
  const baseMatches = records.map(parseMatchBase);
  const startupIds  = Array.from(new Set(baseMatches.map(m => m.startupId).filter(Boolean)));

  // Fetch startup records by ID
  const startupMap: Record<string, Startup> = {};
  if (startupIds.length > 0) {
    const idFilter = `OR(${startupIds.map(id => `RECORD_ID()="${id}"`).join(',')})`;
    const startupRecords = await fetchTable<any>('Startup Pipeline', {
      filterByFormula: idFilter,
    });
    startupRecords.forEach((r: any) => {
      startupMap[r.id] = parseStartup(r);
    });
  }

  // Join and filter to only actively raising startups
  return baseMatches
    .map(m => {
      const s = startupMap[m.startupId];
      return {
        ...m,
        startupName:        s?.name || '',
        startupDescription: s?.description || '',
        startupLogo:        s?.logo,
        startupStatus:      s?.status || 'New',
        startupStage:       s?.roundStage || '',
        startupTicket:      s?.targetRaise || '',
        startupEntity:      s?.entityType,
        startupRaiseAmount: s?.targetRaiseAmount,
        startupVerticals:   s?.primaryVertical || [],
        startupPitchDeck:   s?.pitchDeckUrl,
      } as Match;
    })
    .filter(m => m.startupStatus === 'Actively Raising');
}

export async function updateMatchStatus(matchId: string, status: MatchStatus) {
  const res = await fetch(`${ROOT}/Matches/${matchId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ fields: { Status: status } }),
  });
  if (!res.ok) throw new Error('Failed to update match status');
  return res.json();
}

// ── Analytics ────────────────────────────────────────────────

export interface AnalyticsData {
  totalStartups: number;
  activelyRaising: number;
  totalClosed: number;
  totalIntroRequests: number;
  verticalBreakdown: Record<string, number>;
  stageBreakdown: Record<string, number>;
}

export async function getAnalytics(): Promise<AnalyticsData> {
  const [startups, matches] = await Promise.all([
    getAllStartups(),
    fetchTable<any>('Matches'),
  ]);

  const activelyRaising    = startups.filter(s => s.status === 'Actively Raising').length;
  const totalClosed        = startups.filter(s => s.status === 'Closed').length;
  const totalIntroRequests = matches.filter(
    (r: any) => r.fields['Status'] === 'Requested' || r.fields['Status'] === 'Intro Sent'
  ).length;

  const verticalBreakdown: Record<string, number> = {};
  const stageBreakdown:    Record<string, number> = {};

  startups
    .filter(s => s.status === 'Actively Raising')
    .forEach(s => {
      s.primaryVertical.forEach(v => {
        verticalBreakdown[v] = (verticalBreakdown[v] || 0) + 1;
      });
      if (s.roundStage) {
        stageBreakdown[s.roundStage] = (stageBreakdown[s.roundStage] || 0) + 1;
      }
    });

  return {
    totalStartups: startups.length,
    activelyRaising,
    totalClosed,
    totalIntroRequests,
    verticalBreakdown,
    stageBreakdown,
  };
}

// ── Announcements ────────────────────────────────────────────
// Table: "Announcements"
// Fields: Title, Body, Published Date, Author (created by), Category
// Note: "Image" (attachment) and "Pinned" (checkbox) fields don't exist yet
//       — they'll gracefully return undefined/false until added to Airtable.

export async function getAnnouncements(): Promise<Announcement[]> {
  const records = await fetchTable<any>('Announcements', {
    sort: '[{"field":"Published Date","direction":"desc"}]',
  });
  return records.map((r: any) => ({
    id:            r.id,
    title:         r.fields['Title'] || '',
    body:          r.fields['Body'] || '',
    image:         r.fields['Image']?.[0]?.url,      // attachment — add field to Airtable to enable
    publishedDate: r.fields['Published Date'] || '',
    pinned:        r.fields['Pinned'] || false,       // checkbox — add field to Airtable to enable
    category:      r.fields['Category'] || undefined,
  }));
}

// ── Events ───────────────────────────────────────────────────
// Table: "Events"
// Fields: Event Name, Date, Description, Location, RSVP Link
// Note: "Access Level" single-select doesn't exist yet
//       — defaults to 'Public' until added to Airtable.

export async function getUpcomingEvents(): Promise<Event[]> {
  const today   = new Date().toISOString().split('T')[0];
  const records = await fetchTable<any>('Events', {
    filterByFormula: `{Date}>="${today}"`,
    sort: '[{"field":"Date","direction":"asc"}]',
  });
  return records.map((r: any) => ({
    id:               r.id,
    eventName:        r.fields['Event Name'] || '',
    date:             r.fields['Date'] || '',
    location:         r.fields['Location'] || undefined,
    description:      r.fields['Description'] || undefined,
    accessLevel:      r.fields['Access Level'] || 'Public',  // add field to Airtable to enable
    registrationLink: r.fields['RSVP Link'] || undefined,
  }));
}
