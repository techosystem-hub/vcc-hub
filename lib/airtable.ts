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

export type Vertical = 'Defense / MilTech' | 'AI / ML' | 'Cybersecurity' | 'Fintech' | 'HealthTech' | 'AgriTech' | 'SaaS (General)' | 'Hardware / IoT' | 'EdTech' | 'Marketing & Media' | 'Energy & Environment' | 'Consumer products' | 'HRTech' | 'Business Productivity' | 'E-commerce & Retail' | 'Logistics & Transportation';
export type Stage    = 'Angel Investment' | 'Pre-seed' | 'Seed' | 'Late Seed / Bridge' | 'Series A' | 'Series B+';
export type Ticket   = 'Small Tickets (<$50k)' | '$50k - $200k' | '$200k - $500k' | '$500k - $1M' | '>$5M';
export type DualUse  = 'Yes - we actively look for Defense Tech' | 'Yes - if it is Dual-use (non-lethal / software)' | 'No - our mandate restricts this (ESG / LP restrictions)';
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
  // Contact & deal details (shown to investors who express interest)
  email?: string;
  website?: string;
  valuationCap?: string;
  committedCapital?: string;
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
  params: Record<string, string> = {},
  noCache = false
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
    // 5-minute cache: avoids hammering Airtable on every page load
    // PATCH/POST calls use no-store, so writes are always fresh
    const res  = await fetch(url.toString(), noCache ? { headers, cache: 'no-store' } : { headers, next: { revalidate: 300 } });
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
    ticketSize:      (f['Standard Ticket Size'] || []),
    dualUsePolicy:   f['Does your mandate allow investment in Dual-use technologies?'] || '',
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
    whatsapp?: string;
  }
) {
  const fields: Record<string, any> = {
    'Primary Focus Areas (Verticals)': data.focusVerticals,
    'Stage Preference':                data.stagePreference,
    'Standard Ticket Size':            data.ticketSize,
    'Does your mandate allow investment in Dual-use technologies?': data.dualUsePolicy,
  };
  if (data.description !== undefined) fields['Description']              = data.description;
  if (data.whatsapp    !== undefined) fields['Contact Person (Whatsapp)'] = data.whatsapp;

  const res = await fetch(`${ROOT}/${encodeURIComponent('Investor Profile')}/${investorId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) throw new Error('Failed to update investor criteria');
  return res.json();
}

// ── Startups ─────────────────────────────────────────────────
// Table: "Startup Pipeline"
// Key field mappings:
//   Startup Name      → name
//   Admin Notes       → description
//   Investment Stage  → roundStage
//   Target Raise      → targetRaise (singleSelect label string, e.g. "$500K")
//   Is Dual-use?      → isDualUse
//   Pitch Deck URL    → pitchDeckUrl
//   Status            → status

function parseStartup(r: any): Startup {
  const f = r.fields;
  // Target Raise is a singleSelect in Airtable (stores label strings like "$500K", "$1M-$2M")
  // We store it directly as a display string — no numeric conversion needed
  const targetRaiseLabel: string = f['Target Raise'] || '';
  return {
    id:                r.id,
    name:              f['Startup Name'] || '',
    description:       f['Admin Notes'] || f['Notes'] || '',
    logo:              undefined,
    primaryVertical:   Array.isArray(f['Primary Vertical'])
                         ? f['Primary Vertical']
                         : f['Primary Vertical'] ? [f['Primary Vertical']] : [],
    roundStage:        f['Investment Stage'] || '',
    targetRaise:       targetRaiseLabel,
    targetRaiseAmount: undefined,  // field is a text label, not a number — removed to avoid confusion
    status:            f['Status'] || 'New',
    isDualUse:         f['Is Dual-use?'] || 'No',
    pitchDeckUrl:      f['Pitch Deck URL'] || undefined,
    entityType:        f['Jurisdiction'] || undefined,
    addedDate:         r.createdTime || undefined,
    // Contact & deal details
    email:             f['Email'] || undefined,
    website:           f['Website / LinkedIn'] || undefined,
    valuationCap:      f['Valuation Cap (USD)'] || undefined,
    committedCapital:  f['Committed Capital (USD)'] || undefined,
  };
}

export async function createInvestorRecord(email: string, name: string): Promise<Investor> {
  const res = await fetch(`${ROOT}/${encodeURIComponent('Investor Profile')}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      fields: {
        'Fund / Organization Name': name,
        'Email for Deal Flow':      email,
      },
    }),
  });
  if (!res.ok) throw new Error('Failed to create investor record');
  const record = await res.json();
  return parseInvestor(record);
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
    fields: JSON.stringify(['Startup Name', 'Primary Vertical', 'Investment Stage', 'Target Raise', 'Status', 'Is Dual-use?', 'Jurisdiction']),
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
    id:           r.id,
    startupId:    Array.isArray(f['Startup'])  ? f['Startup'][0]  : '',
    investorId:   Array.isArray(f['Investor']) ? f['Investor'][0] : '',
    score:        f['Score'] || 0,
    scoreLabel:   f['Score Label'] || '',
    whyItMatches: f['Notes'] || '',           // Airtable field is "Notes", not "Why It Matches"
    status:       (f['Match Status'] || 'Pending') as MatchStatus, // Airtable field is "Match Status"
  };
}

export async function getMatchesForInvestor(investorId: string, investorName: string): Promise<Match[]> {
  // Filter matches for this investor using FIND on the linked record array
  const formula = `{Investor} = "${investorName}"`;
  const records = await fetchTable<any>('Matches', {
    filterByFormula: formula,
    sort: '[{"field":"Score","direction":"desc"}]',
  }, true);

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
    body: JSON.stringify({ fields: { 'Match Status': status } }), // Airtable field is "Match Status"
  });
  if (!res.ok) throw new Error('Failed to update match status');
  return res.json();
}

// ── Deal Flow Database ───────────────────────────────────────
// Separate Airtable base: appzew2eaB6QOy0RF / "Imported table"

const DEALFLOW_BASE_ID = process.env.AIRTABLE_DEALFLOW_BASE_ID || 'appzew2eaB6QOy0RF';
const DEALFLOW_ROOT = `https://api.airtable.com/v0/${DEALFLOW_BASE_ID}`;

export interface DealFlowStartup {
  id: string;
  name: string;
  description: string;
  vertical: string;
  founders: string;
  legalHQ: string;
  startupOrigin: string;
  roundStage: string;
  investmentSizeUSD: number;
  datePublished: string;
  year: number;
  bornYear: string;
  techosystemMember: string;
  officeInUkraine: boolean;
  investors: string;
  uaInvestorsInvolved: string;
  linkToNews: string;
  investmentType: string;
}

function parseDealFlowStartup(r: any): DealFlowStartup {
  const f = r.fields;
  return {
    id:                r.id,
    name:              f['Startup'] || '',
    description:       f['Startup brief description'] || '',
    vertical:          f['Vertical'] || '',
    founders:          f['Founders'] || '',
    legalHQ:           f['Legal HQ'] || '',
    startupOrigin:     f['Startup origin'] || '',
    roundStage:        f['Round stage'] || '',
    investmentSizeUSD: typeof f['Investment size in USD'] === 'number' ? f['Investment size in USD'] : 0,
    datePublished:     f['Date of publishing'] || '',
    year:              f['Year'] || 0,
    bornYear:          f['Born Year'] || '',
    techosystemMember: f['Techosytem Member'] || 'No',
    officeInUkraine:   f['Office in Ukraine'] || false,
    investors:         f['Investor(s)'] || '',
    uaInvestorsInvolved: f['UA investors involved'] || '',
    linkToNews:        f['Link to news'] || '',
    investmentType:    f['Investment Type'] || '',
  };
}

export async function getDealFlowStartups(filters: {
  vertical?: string;
  stage?: string;
  search?: string;
} = {}): Promise<DealFlowStartup[]> {
  const url = new URL(`${DEALFLOW_ROOT}/tblFoWnsAmc40zupt`);
  url.searchParams.set('sort[0][field]', 'Date of publishing');
  url.searchParams.set('sort[0][direction]', 'desc');

  const records: any[] = [];
  let offset: string | undefined;
  do {
    if (offset) url.searchParams.set('offset', offset);
    const res  = await fetch(url.toString(), { headers, next: { revalidate: 300, tags: ['dealflow'] } });
    const data = await res.json();
    if (!res.ok) throw new Error(`Airtable error: ${data.error?.message}`);
    records.push(...(data.records || []));
    offset = data.offset;
  } while (offset);

  let result = records.map(parseDealFlowStartup);

  if (filters.vertical) result = result.filter(s => s.vertical === filters.vertical);
  if (filters.stage)    result = result.filter(s => s.roundStage === filters.stage);
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.founders.toLowerCase().includes(q)
    );
  }

  return result;
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

// ── AI Rationale Caching (Matches table) ─────────────────────
// Cache Claude-generated rationale to avoid repeat API calls

export async function getMatchRationale(matchId: string): Promise<string | null> {
  const records = await fetchTable<any>('Matches', {
    filterByFormula: `{Record ID}="${matchId}"`,
    fields: JSON.stringify(['AI Rationale']),
  });
  return records[0]?.fields['AI Rationale'] as string || null;
}

export async function saveMatchRationale(matchId: string, rationale: string): Promise<void> {
  const url = new URL(`${ROOT}/Matches/${matchId}`);
  const res = await fetch(url.toString(), {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      fields: {
        'AI Rationale': rationale,
      },
    }),
  });
  if (!res.ok) throw new Error('Failed to save match rationale');
}
