'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2, Loader2, Info } from 'lucide-react'

const RED  = '#e71d36'
const NAVY = '#011627'

// ── Must exactly match Airtable singleSelect option names ────────────────────

const VERTICALS = [
  'Aerospace', 'Agrifood', 'Business Productivity', 'Communications',
  'Cybersecurity', 'Defense', 'Education', 'Energy & Environment',
  'Finance', 'Gaming', 'Healthcare', 'HR', 'Legal', 'Logistics & Transportation',
  'Marketing & Media', 'Property & Construction', 'Travel & Leisure',
]

const STAGES = [
  'Pre-seed', 'Seed', 'Angel', 'Series A', 'Series B', 'Series C', 'Series D',
  'Growth', 'Corporate funding', 'Non-disclosed',
]

// Airtable Investment Type = "New" (first appearance) or "Follow-up" (returning startup)
const INVESTMENT_TYPES = ['New', 'Follow-up']

// Must match Airtable Currency singleSelect options exactly
const CURRENCIES = ['USD', 'EUR', 'PLN', 'GBP', 'UAH', 'Non-disclosed']

// Only years that already exist as Airtable singleSelect options for Born Year
const BORN_YEARS = [
  '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018',
  '2017', '2016', '2015', '2014', '2013', '2012', '2009', '2006',
  '2000', '1998', 'Non-disclosed',
]

const MONTHS = [
  { label: 'January', value: '1' }, { label: 'February', value: '2' },
  { label: 'March',   value: '3' }, { label: 'April',    value: '4' },
  { label: 'May',     value: '5' }, { label: 'June',     value: '6' },
  { label: 'July',    value: '7' }, { label: 'August',   value: '8' },
  { label: 'September', value: '9' }, { label: 'October', value: '10' },
  { label: 'November', value: '11' }, { label: 'December', value: '12' },
]

const YEARS_RANGE = Array.from({ length: 6 }, (_, i) => String(2021 + i)) // 2021-2026

// ── Field component with label + optional hint ───────────────────────────────
function Field({
  label, required, hint, children,
}: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold" style={{ color: NAVY }}>
        {label}{required && <span style={{ color: RED }}> *</span>}
      </label>
      {children}
      {hint && (
        <p className="flex items-start gap-1.5 text-xs text-gray-500 leading-relaxed">
          <Info className="h-3 w-3 mt-0.5 flex-shrink-0 text-gray-400" />
          {hint}
        </p>
      )}
    </div>
  )
}

// ── Section divider ──────────────────────────────────────────────────────────
function Section({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <div className="h-px flex-1 bg-gray-100" />
      <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">{title}</span>
      <div className="h-px flex-1 bg-gray-100" />
    </div>
  )
}

const inputClass = "w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#e71d36] focus:ring-1 focus:ring-[#e71d36] transition-colors"
const selectClass = inputClass + " cursor-pointer"

// ── Page ─────────────────────────────────────────────────────────────────────
export default function AddDealPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [submitted,  setSubmitted]  = useState(false)
  const [error,      setError]      = useState('')

  const [form, setForm] = useState({
    startup: '', datePublished: '', investmentSize: '', currency: '',
    investmentSizeUSD: '', month: '', year: '', description: '',
    bornYear: '', founders: '', legalHQ: '', roundStage: '',
    investors: '', linkToNews: '', investmentType: '', startupOrigin: '',
    vertical: '', techosystemMember: '', uaInvestorsInvolved: '',
    comments: '',
  })

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.startup.trim()) { setError('Startup name is required.'); return }
    setError('')
    setSubmitting(true)
    try {
      const res  = await fetch('/api/create-deal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit')
      setSubmitted(true)
      setTimeout(() => router.push('/'), 3000)
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Success screen ──────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6" style={{ background: '#f8f8fa' }}>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="rounded-full p-4" style={{ background: '#e71d361a' }}>
            <CheckCircle2 className="h-12 w-12" style={{ color: RED }} />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: NAVY }}>Deal added successfully!</h1>
          <p className="text-sm text-gray-500">Returning to Deal Flow in 3 seconds...</p>
          <button
            onClick={() => router.push('/')}
            className="mt-2 rounded-md px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: RED }}
          >
            Go now
          </button>
        </div>
      </div>
    )
  }

  // ── Form ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f8f8fa' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white sticky top-0 z-10">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-sm font-medium hover:opacity-70 transition-opacity"
          style={{ color: NAVY }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Deal Flow
        </button>
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md flex items-center justify-center text-white text-xs font-bold" style={{ background: RED }}>T</div>
          <span className="text-sm font-semibold" style={{ color: NAVY }}>VCC Intelligence Hub</span>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 flex justify-center px-4 py-10">
        <form onSubmit={handleSubmit} className="w-full max-w-2xl bg-white rounded-xl border border-gray-200 shadow-sm p-8 flex flex-col gap-5">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: NAVY }}>Add New Deal</h1>
            <p className="text-sm text-gray-500 mt-1">
              Add a new deal to the Techosystem Deal Flow Database. Fields marked <span style={{ color: RED }}>*</span> are required.
            </p>
          </div>

          {/* Startup Identity */}
          <Section title="Startup identity" />

          <Field
            label="Startup name" required
            hint="The official company name as it appears publicly (e.g. 'Grammarly', 'Ajax Systems')."
          >
            <input
              className={inputClass}
              placeholder="e.g. Acme Corp"
              value={form.startup}
              onChange={set('startup')}
            />
          </Field>

          <Field
            label="Brief description"
            hint="One or two sentences explaining what the startup does. Copy from Crunchbase or the company website."
          >
            <textarea
              className={inputClass + " resize-none h-20"}
              placeholder="e.g. AI-powered platform that automates financial reporting for mid-size companies."
              value={form.description}
              onChange={set('description')}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Vertical"
              hint="Primary industry the startup operates in."
            >
              <select className={selectClass} value={form.vertical} onChange={set('vertical')}>
                <option value="">Select vertical</option>
                {VERTICALS.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </Field>
            <Field
              label="Born year"
              hint="Year the company was founded. Select 'Non-disclosed' if not public."
            >
              <select className={selectClass} value={form.bornYear} onChange={set('bornYear')}>
                <option value="">Select year</option>
                {BORN_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Legal HQ"
              hint="Country or state where the company is legally registered (e.g. 'Delaware, USA', 'Ukraine')."
            >
              <input
                className={inputClass}
                placeholder="e.g. Delaware, USA"
                value={form.legalHQ}
                onChange={set('legalHQ')}
              />
            </Field>
            <Field
              label="Startup origin"
              hint="Nationality or roots of the founding team (e.g. 'Ukrainian', 'American-Ukrainian')."
            >
              <input
                className={inputClass}
                placeholder="e.g. Ukrainian, American-Ukrainian"
                value={form.startupOrigin}
                onChange={set('startupOrigin')}
              />
            </Field>
          </div>

          <Field
            label="Founders"
            hint="Full names of co-founders, comma-separated. Use Crunchbase or LinkedIn for accuracy."
          >
            <input
              className={inputClass}
              placeholder="e.g. Jane Smith, John Doe"
              value={form.founders}
              onChange={set('founders')}
            />
          </Field>

          {/* Deal Details */}
          <Section title="Deal details" />

          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Date of publishing"
              hint="Date the funding news was publicly announced."
            >
              <input
                type="date"
                className={inputClass}
                value={form.datePublished}
                onChange={set('datePublished')}
              />
            </Field>
            <Field
              label="Round stage"
              hint="Stage of funding (Pre-seed = earliest, Series A/B/C = later growth rounds)."
            >
              <select className={selectClass} value={form.roundStage} onChange={set('roundStage')}>
                <option value="">Select stage</option>
                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field
              label="Investment size"
              hint="Amount raised in the original currency."
            >
              <input
                type="number"
                className={inputClass}
                placeholder="e.g. 500000"
                value={form.investmentSize}
                onChange={set('investmentSize')}
              />
            </Field>
            <Field
              label="Currency"
              hint="Currency the deal was announced in."
            >
              <select className={selectClass} value={form.currency} onChange={set('currency')}>
                <option value="">Select</option>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field
              label="Amount in USD"
              hint="Convert to USD for comparison. Use xe.com for conversion."
            >
              <input
                type="number"
                className={inputClass}
                placeholder="e.g. 500000"
                value={form.investmentSizeUSD}
                onChange={set('investmentSizeUSD')}
              />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field
              label="Month"
              hint="Month the deal was announced."
            >
              <select className={selectClass} value={form.month} onChange={set('month')}>
                <option value="">Select month</option>
                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </Field>
            <Field
              label="Year"
              hint="Year the deal was announced (e.g. 2025)."
            >
              <select className={selectClass} value={form.year} onChange={set('year')}>
                <option value="">Select year</option>
                {YEARS_RANGE.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </Field>
            <Field
              label="Investment type"
              hint="'New' = first deal for this startup in our DB. 'Follow-up' = the startup had a previous deal listed."
            >
              <select className={selectClass} value={form.investmentType} onChange={set('investmentType')}>
                <option value="">Select type</option>
                {INVESTMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
          </div>

          {/* Investors */}
          <Section title="Investors" />

          <Field
            label="Investor(s)"
            hint="Names of all investors who participated, comma-separated (e.g. 'Y Combinator, Sequoia Capital'). Use 'Non-disclosed' if not public."
          >
            <input
              className={inputClass}
              placeholder="e.g. Y Combinator, Sequoia Capital"
              value={form.investors}
              onChange={set('investors')}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field
              label="UA investors involved"
              hint="Did any Ukrainian investor(s) participate in this deal?"
            >
              <select className={selectClass} value={form.uaInvestorsInvolved} onChange={set('uaInvestorsInvolved')}>
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </Field>
            <Field
              label="Techosystem member"
              hint="Is this startup a member of the Techosystem network?"
            >
              <select className={selectClass} value={form.techosystemMember} onChange={set('techosystemMember')}>
                <option value="">Select</option>
                <option value="Member">Yes - Member</option>
                <option value="No">No</option>
              </select>
            </Field>
          </div>

          {/* Sources & Notes */}
          <Section title="Sources & notes" />

          <Field
            label="Link to news"
            hint="URL to the press release or news article announcing the deal (e.g. TechCrunch, AIN.UA, company blog)."
          >
            <input
              type="url"
              className={inputClass}
              placeholder="https://techcrunch.com/..."
              value={form.linkToNews}
              onChange={set('linkToNews')}
            />
          </Field>

          <Field
            label="Comments"
            hint="Any additional context, caveats, or notes about this deal that don't fit elsewhere."
          >
            <textarea
              className={inputClass + " resize-none h-20"}
              placeholder="e.g. Valuation not disclosed. Deal was a bridge round ahead of Series A."
              value={form.comments}
              onChange={set('comments')}
            />
          </Field>

          {/* Error & Submit */}
          {error && (
            <p className="text-sm font-medium rounded-md bg-red-50 border border-red-200 px-3 py-2" style={{ color: RED }}>
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="rounded-md border border-gray-200 px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-md px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: RED }}
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? 'Submitting...' : 'Submit Deal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
