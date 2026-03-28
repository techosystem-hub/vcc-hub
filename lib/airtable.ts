// ───────────────────────────────────────────────────────────────
// Airtable API layer — all data fetching lives here
// ───────────────────────────────────────────────────────────────

const BASE_ID = process.env.AIRTABLE_BASE_ID!;
const TOKEN   = process.env.AIRTABLE_API_TOKEN!;
const ROOT    = `https://api.airtable.com/v0/${BASE_ID}`;

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
};

// ── Types ────────────────────────────────────────────────────────

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
  targetRaise: string;
  targetRaiseAmount?: number;
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

// ── Generic fetch helper ─────────────────────────────────────────

async function fetchTable<T>(
  table: string,
  params: Record<string, string> = {}
): Promise<T[]> {
  const url = new URL(`${ROOT}/${encodeURIComponent(table)}`);
  const { sort, ...otherParams } = params;
  Object.entries(otherParams).forEach(([k, v]) => url.searchParams.set(k, v));
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
    const res  = await fetch(url.toString(), { headers, next: { revalidate: 300 } });
    const data = await res.json();
    if (!res.ok) throw new Error(`Airtable error: ${data.error?.message}`);
    records.push(...(data.records || []));
    offset = data.offset;
  } while (offset);

  return records;
}

// ── Investors ────────────────────────────────────────────────────

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

// ── Startups ─────────────────────────────────────────────────────

function parseStartup(r: any): Startup {
  const f = r.fields;
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
    targetRaiseAmount: undefined,
    status:            f['Status'] || 'New',
    isDualUse:         f['Is Dual-use?'] || 'No',
    pitchDeckUrl:      f['Pitch Deck URL'] || undefined,
    entityType:        f['Jurisdiction'] || undefined,
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
    sort: '[{"field":"Startup Name","direction":"asc"}]',
  });
  return records.map(parseStartup);
}

export async function getAllStartups(): Promise<Startup[]> {
  const records = await fetchTable<any>('Startup Pipeline');
  return records.map(parseStartup);
}

// ── Matches ──────────────────────────────────────────────────────

function parseMatchBase(r: any) {
  const f = r.fields;
  return {
    id:           r.id,
    startupId:    Array.isArray(f['Startup'])  ? f['Startup'][0]  : '',
    investorId:   Array.isArray(f['Investor']) ? f['Investor'][0] : '',
    score:        f['Score'] || 0,
    scoreLabel:   f['Score Label'] || '',
    whyItMatches: f['Notes'] || '',
    status:       (f['Match Status'] || 'Pending') as MatchStatus,
  };
}

export async function getMatchesForInvestor(investorId: string): Promise<Match[]> {
  const formula = `FIND("${investorId}", ARRAYJOIN({Investor}, ","))`;
  const records = await fetchTable<any>('Matches', {
    filterByFormula: formula,
    sort: '[{"field":"Score","direction":"desc"}]',
  });

  if (records.length === 0) return [];

  const baseMatches = records.map(parseMatchBase);
  const startupIds  = Array.from(new Set(baseMatches.map(m => m.startupId).filter(Boolean)));

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
    body: JSON.stringify({ fields: { 'Match Status': status } }),
  });
  if (!res.ok) throw new Error('Failed to update match status');
  return res.json();
}

// ── Deal Flow Database ───────────────────────────────────────────

const DEALFLOW_ROOT = `https://api.airtable.com/v0/appzew2eaB6QOy0RF`;

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

// ── Analytics ────────────────────────────────────────────────────

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

// ── Announcements ────────────────────────────────────────────────

export async function getAnnouncements(): Promise<Announcement[]> {
  const records = await fetchTable<any>('Announcements', {
    sort: '[{"field":"Published Date","direction":"desc"}]',
  });
  return records.map((r: any) => ({
    id:            r.id,
    title:         r.fields['Title'] || '',
    body:          r.fields['Body'] || '',
    image:         r.fields['Image']?.[0]?.url,
    publishedDate: r.fields['Published Date'] || '',
    pinned:        r.fields['Pinned'] || false,
    category:      r.fields['Category'] || undefined,
  }));
}

// ── Events ───────────────────────────────────────────────────────

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
    accessLevel:      r.fields['Access Level'] || 'Public',
    registrationLink: r.fields['RSVP Link'] || undefined,
  }));
}
