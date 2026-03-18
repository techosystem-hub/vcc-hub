export type Vertical = 'Defense / MilTech' | 'AI / ML' | 'SaaS' | 'Cybersecurity' | 'FinTech' | 'HealthTech' | 'Aerospace'

export type RoundStage = 'Pre-seed' | 'Seed' | 'Series A' | 'Series B'

export type LegalHQ = 'Delaware C-Corp' | 'UK' | 'Estonia' | 'Poland' | 'Ukraine'

export interface Founder {
  name: string
  role: string
  linkedin?: string
}

export interface Startup {
  id: string
  name: string
  description: string
  verticals: Vertical[]
  roundStage: RoundStage
  targetRaise: number
  legalHQ: LegalHQ
  diiaCity: boolean
  founders: Founder[]
  existingInvestors: string[]
  newsUrl?: string
  logoPlaceholder: string
  matchScore?: number
  matchReasons?: string[]
  dealDate: string // ISO date string
}

export const startups: Startup[] = [
  {
    id: '1',
    name: 'SkyShield Defense',
    description: 'Next-generation autonomous drone detection and neutralization system using AI-powered radar and electronic warfare capabilities.',
    verticals: ['Defense / MilTech', 'AI / ML'],
    roundStage: 'Seed',
    targetRaise: 2500000,
    legalHQ: 'Delaware C-Corp',
    diiaCity: true,
    founders: [
      { name: 'Oleksandr Petrov', role: 'CEO', linkedin: 'https://linkedin.com' },
      { name: 'Maria Kovalenko', role: 'CTO', linkedin: 'https://linkedin.com' },
    ],
    existingInvestors: ['Google for Startups', 'Credo Ventures', 'Ukraine Defense Fund'],
    newsUrl: 'https://techcrunch.com',
    logoPlaceholder: 'SS',
    matchScore: 95,
    matchReasons: ['Matches your Defense vertical focus', 'Within your $200K-$500K ticket range', 'Seed stage aligns with your preferences'],
    dealDate: '2025-02-15',
  },
  {
    id: '2',
    name: 'NeuralMed AI',
    description: 'AI-powered medical imaging analysis platform that helps radiologists detect early-stage cancers with 98% accuracy.',
    verticals: ['HealthTech', 'AI / ML'],
    roundStage: 'Series A',
    targetRaise: 8000000,
    legalHQ: 'Delaware C-Corp',
    diiaCity: true,
    founders: [
      { name: 'Dr. Yana Sydorenko', role: 'CEO', linkedin: 'https://linkedin.com' },
      { name: 'Ivan Bondar', role: 'CTO', linkedin: 'https://linkedin.com' },
    ],
    existingInvestors: ['Sequoia Scout', 'TechStars', 'Horizon Capital'],
    newsUrl: 'https://forbes.com',
    logoPlaceholder: 'NM',
    matchScore: 72,
    matchReasons: ['AI/ML matches your secondary focus', 'Series A larger than preferred ticket'],
    dealDate: '2025-01-22',
  },
  {
    id: '3',
    name: 'CryptoVault',
    description: 'Enterprise-grade cryptocurrency custody solution with military-level security and instant settlement capabilities.',
    verticals: ['FinTech', 'Cybersecurity'],
    roundStage: 'Series B',
    targetRaise: 25000000,
    legalHQ: 'Estonia',
    diiaCity: false,
    founders: [
      { name: 'Andrii Savchenko', role: 'CEO', linkedin: 'https://linkedin.com' },
      { name: 'Elena Marchenko', role: 'COO', linkedin: 'https://linkedin.com' },
    ],
    existingInvestors: ['a16z', 'Pantera Capital', 'DCG'],
    newsUrl: 'https://coindesk.com',
    logoPlaceholder: 'CV',
    matchScore: 45,
    matchReasons: ['Cybersecurity partial match', 'Series B outside stage preference'],
    dealDate: '2024-11-08',
  },
  {
    id: '4',
    name: 'Orbital Dynamics',
    description: 'Low-cost satellite communication modules enabling IoT connectivity anywhere on Earth for defense and agricultural applications.',
    verticals: ['Aerospace', 'Defense / MilTech'],
    roundStage: 'Seed',
    targetRaise: 4000000,
    legalHQ: 'UK',
    diiaCity: false,
    founders: [
      { name: 'Viktor Shevchenko', role: 'CEO', linkedin: 'https://linkedin.com' },
      { name: 'Dmytro Lysenko', role: 'CTO', linkedin: 'https://linkedin.com' },
    ],
    existingInvestors: ['Geek Ventures', 'SMRK VC', 'European Space Agency'],
    newsUrl: 'https://spacenews.com',
    logoPlaceholder: 'OD',
    matchScore: 88,
    matchReasons: ['Defense/MilTech aligns perfectly', 'Seed stage matches criteria', 'UK entity structure acceptable'],
    dealDate: '2024-09-30',
  },
  {
    id: '5',
    name: 'SecureFlow',
    description: 'Zero-trust network security platform that uses behavioral AI to detect and prevent insider threats in real-time.',
    verticals: ['Cybersecurity', 'SaaS'],
    roundStage: 'Series A',
    targetRaise: 6000000,
    legalHQ: 'Delaware C-Corp',
    diiaCity: true,
    founders: [
      { name: 'Mykola Tkachenko', role: 'CEO', linkedin: 'https://linkedin.com' },
      { name: 'Olena Hrynenko', role: 'CTO', linkedin: 'https://linkedin.com' },
    ],
    existingInvestors: ['Google for Startups', 'Y Combinator', 'Plug and Play'],
    newsUrl: 'https://wired.com',
    logoPlaceholder: 'SF',
    matchScore: 68,
    matchReasons: ['Cybersecurity partial match', 'Series A larger than ideal ticket'],
    dealDate: '2024-07-14',
  },
  {
    id: '6',
    name: 'AgriDrone Pro',
    description: 'Precision agriculture platform combining drone imagery, soil sensors, and AI for optimized crop management.',
    verticals: ['AI / ML', 'SaaS'],
    roundStage: 'Pre-seed',
    targetRaise: 750000,
    legalHQ: 'Ukraine',
    diiaCity: true,
    founders: [
      { name: 'Serhii Moroz', role: 'CEO', linkedin: 'https://linkedin.com' },
    ],
    existingInvestors: ['Ukrainian Startup Fund', 'Techstars'],
    newsUrl: 'https://agfunder.com',
    logoPlaceholder: 'AP',
    matchScore: 82,
    matchReasons: ['AI/ML matches secondary focus', 'Pre-seed within ticket range', 'Strong founding team'],
    dealDate: '2025-03-01',
  },
  {
    id: '7',
    name: 'PayBridge',
    description: 'Cross-border payment infrastructure enabling instant B2B transactions between Eastern Europe and global markets.',
    verticals: ['FinTech', 'SaaS'],
    roundStage: 'Seed',
    targetRaise: 3000000,
    legalHQ: 'Poland',
    diiaCity: false,
    founders: [
      { name: 'Kateryna Voloshyna', role: 'CEO', linkedin: 'https://linkedin.com' },
      { name: 'Pavlo Demchenko', role: 'CTO', linkedin: 'https://linkedin.com' },
    ],
    existingInvestors: ['Earlybird', 'Point Nine Capital'],
    newsUrl: 'https://finextra.com',
    logoPlaceholder: 'PB',
    matchScore: 58,
    matchReasons: ['FinTech outside primary focus', 'Seed stage matches preference'],
    dealDate: '2024-05-20',
  },
  {
    id: '8',
    name: 'TacticalVision',
    description: 'Computer vision system for real-time battlefield awareness, providing situational intelligence for ground forces.',
    verticals: ['Defense / MilTech', 'AI / ML'],
    roundStage: 'Series A',
    targetRaise: 12000000,
    legalHQ: 'Delaware C-Corp',
    diiaCity: true,
    founders: [
      { name: 'Roman Kravchuk', role: 'CEO', linkedin: 'https://linkedin.com' },
      { name: 'Ihor Melnyk', role: 'CTO', linkedin: 'https://linkedin.com' },
      { name: 'Natalia Pavlenko', role: 'COO', linkedin: 'https://linkedin.com' },
    ],
    existingInvestors: ['Palantir Ventures', 'In-Q-Tel', 'Founders Fund'],
    newsUrl: 'https://defensenews.com',
    logoPlaceholder: 'TV',
    matchScore: 91,
    matchReasons: ['Perfect Defense + AI match', 'Delaware C-Corp preferred structure', 'Strong investor signal'],
    dealDate: '2024-12-05',
  },
  {
    id: '9',
    name: 'CloudMed',
    description: 'Telemedicine platform connecting Ukrainian doctors with patients worldwide, featuring AI-powered diagnostics.',
    verticals: ['HealthTech', 'SaaS'],
    roundStage: 'Seed',
    targetRaise: 1800000,
    legalHQ: 'Estonia',
    diiaCity: false,
    founders: [
      { name: 'Dr. Svitlana Boyko', role: 'CEO', linkedin: 'https://linkedin.com' },
      { name: 'Artem Kolesnik', role: 'CTO', linkedin: 'https://linkedin.com' },
    ],
    existingInvestors: ['Speedinvest', 'HealthTech Angels'],
    newsUrl: 'https://mobihealthnews.com',
    logoPlaceholder: 'CM',
    matchScore: 55,
    matchReasons: ['HealthTech outside core focus', 'Seed stage matches'],
    dealDate: '2023-08-18',
  },
  {
    id: '10',
    name: 'QuantumShield',
    description: 'Post-quantum cryptography solutions protecting enterprise communications against future quantum computing threats.',
    verticals: ['Cybersecurity'],
    roundStage: 'Pre-seed',
    targetRaise: 500000,
    legalHQ: 'Ukraine',
    diiaCity: true,
    founders: [
      { name: 'Dr. Maksym Rudenko', role: 'CEO', linkedin: 'https://linkedin.com' },
    ],
    existingInvestors: ['Ukrainian Startup Fund'],
    newsUrl: 'https://quantamagazine.com',
    logoPlaceholder: 'QS',
    matchScore: 76,
    matchReasons: ['Cybersecurity has defense applications', 'Pre-seed within ticket size'],
    dealDate: '2023-11-02',
  },
  {
    id: '11',
    name: 'LogiTrack AI',
    description: 'AI-powered supply chain optimization platform reducing logistics costs by 30% through predictive routing.',
    verticals: ['SaaS', 'AI / ML'],
    roundStage: 'Series A',
    targetRaise: 7500000,
    legalHQ: 'Delaware C-Corp',
    diiaCity: true,
    founders: [
      { name: 'Yulia Fedorova', role: 'CEO', linkedin: 'https://linkedin.com' },
      { name: 'Bohdan Krychevskyi', role: 'CTO', linkedin: 'https://linkedin.com' },
    ],
    existingInvestors: ['Andreessen Horowitz', 'Flexport Ventures'],
    newsUrl: 'https://supplychaindive.com',
    logoPlaceholder: 'LT',
    matchScore: 65,
    matchReasons: ['AI/ML secondary match', 'Series A above ticket preference'],
    dealDate: '2024-03-12',
  },
  {
    id: '12',
    name: 'DefenseAI Labs',
    description: 'Autonomous targeting systems using edge AI for next-generation unmanned combat vehicles.',
    verticals: ['Defense / MilTech', 'AI / ML', 'Aerospace'],
    roundStage: 'Series B',
    targetRaise: 35000000,
    legalHQ: 'Delaware C-Corp',
    diiaCity: false,
    founders: [
      { name: 'Gen. (Ret.) Oleksiy Danilov', role: 'CEO', linkedin: 'https://linkedin.com' },
      { name: 'Dr. Volodymyr Zelenko', role: 'CTO', linkedin: 'https://linkedin.com' },
    ],
    existingInvestors: ['Palantir', 'Lockheed Martin Ventures', 'NATO Innovation Fund'],
    newsUrl: 'https://janes.com',
    logoPlaceholder: 'DL',
    matchScore: 78,
    matchReasons: ['Defense + AI perfect fit', 'Series B larger than standard ticket', 'Top-tier investors'],
    dealDate: '2024-01-25',
  },
]

export const dealYears = ['2025', '2024', '2023'] as const
export type DealYear = (typeof dealYears)[number]

export const analyticsData = {
  roundsByVertical: [
    { name: 'Defense / MilTech', value: 42, growth: 28 },
    { name: 'SaaS / B2B', value: 35, growth: 12 },
    { name: 'Cybersecurity', value: 28, growth: 45 },
    { name: 'AI / ML', value: 18, growth: 67 },
    { name: 'FinTech', value: 9, growth: -5 },
  ],
  capitalByQuarter: [
    { quarter: 'Q1 24', rounds: 18, capital: 32, avgSize: 1.78 },
    { quarter: 'Q2 24', rounds: 22, capital: 45, avgSize: 2.05 },
    { quarter: 'Q3 24', rounds: 19, capital: 38, avgSize: 2.0 },
    { quarter: 'Q4 24', rounds: 26, capital: 52, avgSize: 2.0 },
    { quarter: 'Q1 25', rounds: 23, capital: 48, avgSize: 2.09 },
    { quarter: 'Q2 25', rounds: 24, capital: 61, avgSize: 2.54 },
  ],
  stageDistribution: [
    { stage: 'Pre-seed', count: 45, capital: 12, avgCheck: 0.27 },
    { stage: 'Seed', count: 58, capital: 58, avgCheck: 1.0 },
    { stage: 'Series A', count: 22, capital: 88, avgCheck: 4.0 },
    { stage: 'Series B', count: 7, capital: 25, avgCheck: 3.57 },
  ],
  investorActivity: [
    { name: 'Horizon Capital', deals: 12, deployed: 28 },
    { name: 'Credo Ventures', deals: 9, deployed: 18 },
    { name: 'TA Ventures', deals: 8, deployed: 14 },
    { name: 'Genesis Investments', deals: 7, deployed: 11 },
    { name: 'Almaz Capital', deals: 6, deployed: 22 },
  ],
  monthlyTrend: [
    { month: 'Jan', deals: 5, capital: 8.2 },
    { month: 'Feb', deals: 6, capital: 11.5 },
    { month: 'Mar', deals: 7, capital: 12.3 },
    { month: 'Apr', deals: 8, capital: 15.1 },
    { month: 'May', deals: 7, capital: 14.2 },
    { month: 'Jun', deals: 7, capital: 15.7 },
    { month: 'Jul', deals: 6, capital: 12.8 },
    { month: 'Aug', deals: 5, capital: 11.4 },
    { month: 'Sep', deals: 8, capital: 13.8 },
    { month: 'Oct', deals: 9, capital: 17.2 },
    { month: 'Nov', deals: 8, capital: 16.1 },
    { month: 'Dec', deals: 9, capital: 18.9 },
  ],
  summaryMetrics: {
    totalRounds: 132,
    totalFunding: 183,
    avgDealSize: 1.4,
    activeInvestors: 89,
    qoqGrowth: 27,
    topVertical: 'Defense / MilTech',
  },
}

export const verticals: Vertical[] = [
  'Defense / MilTech',
  'AI / ML',
  'SaaS',
  'Cybersecurity',
  'FinTech',
  'HealthTech',
  'Aerospace',
]

export const roundStages: RoundStage[] = ['Pre-seed', 'Seed', 'Series A', 'Series B']

export const legalHQs: LegalHQ[] = ['Delaware C-Corp', 'UK', 'Estonia', 'Poland', 'Ukraine']

export function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`
  }
  return `$${amount}`
}

export function getFlagEmoji(hq: LegalHQ): string {
  switch (hq) {
    case 'Delaware C-Corp':
      return '🇺🇸'
    case 'UK':
      return '🇬🇧'
    case 'Estonia':
      return '🇪🇪'
    case 'Poland':
      return '🇵🇱'
    case 'Ukraine':
      return '🇺🇦'
    default:
      return '🌐'
  }
}

export function getRoundStageColor(stage: RoundStage): string {
  switch (stage) {
    case 'Pre-seed':
      return 'bg-slate-100 text-slate-700 border-slate-200'
    case 'Seed':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'Series A':
      return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'Series B':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}
