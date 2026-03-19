'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react'

const RED  = '#e71d36'
const NAVY = '#011627'

const VERTICALS = [
  'Defense', 'Business Productivity', 'Finance', 'Marketing & Media',
  'Healthcare', 'Cybersecurity', 'Aerospace', 'Education',
  'Energy & Environment', 'Property & Construction',
  'Logistics & Transportation', 'Communications', 'HR', 'Legal', 'Gaming',
]

const STAGES = [
  'Pre-seed', 'Seed', 'Non-disclosed', 'Series A', 'Growth',
  'Angel', 'Series B', 'Series C', 'Corporate funding', 'Series D',
]

const INVESTMENT_TYPES = ['Equity', 'SAFE', 'Convertible Note', 'Grant', 'Debt', 'Other']
const CURRENCIES       = ['USD', 'EUR', 'GBP', 'UAH', 'Other']
const BORN_YEARS       = Array.from({ length: 26 }, (_, i) => String(2000 + i))
const MONTHS           = ['January','February','March','April','May','June','July','August','September','October','November','December']

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium" style={{ color: NAVY }}>
        {label}{required && <span style={{ color: RED }}> *</span>}
      </label>
      {children}
    </div>
  )
}

const inputClass = "w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#e71d36] focus:ring-1 focus:ring-[#e71d36] transition-colors"
const selectClass = inputClass + " cursor-pointer"

export default function AddDealPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [submitted,  setSubmitted]  = useState(false)
  const [error,      setError]      = useState('')

  const [form, setForm] = useState({
    startup: '', datePublished: '', investmentSize: '', currency: '',
    investmentSizeUSD: '', month: '', year: '', description: '',
    bornYear: '', founders: '', legalHQ: '', roundStage: '',
    investors: '', linkToNews: '', investmentType: '', startupOrigin: '', vertical: '',
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.startup.trim()) { setError('Startup name is required.'); return }
    setError('')
    setSubmitting(true)
    try {
      const res  = await fetch('/api/create-deal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
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

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6" style={{ background: '#f8f8fa' }}>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="rounded-full p-4" style={{ background: '#e71d361a' }}>
            <CheckCircle2 className="h-12 w-12" style={{ color: RED }} />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: NAVY }}>Deal added successfully!</h1>
          <p className="text-sm text-gray-500">Returning to Deal Flow in 3 seconds…</p>
          <button
            onClick={() => router.push('/')}
            className="mt-2 rounded-md px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: RED }}
          >
            Go now →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f8f8fa' }}>
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
      <div className="flex-1 flex justify-center px-4 py-10">
        <form onSubmit={handleSubmit} className="w-full max-w-2xl bg-white rounded-xl border border-gray-200 shadow-sm p-8 flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: NAVY }}>Add New Deal</h1>
            <p className="text-sm text-gray-500 mt-1">Add a new deal to the Techosystem Deal Flow Database.</p>
          </div>
          <Field label="Startup" required>
            <input className={inputClass} placeholder="e.g. Acme Corp" value={form.startup} onChange={set('startup')} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Date of publishing">
              <input type="date" className={inputClass} value={form.datePublished} onChange={set('datePublished')} />
            </Field>
            <Field label="Round stage">
              <select className={selectClass} value={form.roundStage} onChange={set('roundStage')}>
                <option value="">Select stage</option>
                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Investment size">
              <input type="number" className={inputClass} placeholder="e.g. 500000" value={form.investmentSize} onChange={set('investmentSize')} />
            </Field>
            <Field label="Currency">
              <select className={selectClass} value={form.currency} onChange={set('currency')}>
                <option value="">Select currency</option>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Investment size in USD">
              <input type="number" className={inputClass} placeholder="e.g. 500000" value={form.investmentSizeUSD} onChange={set('investmentSizeUSD')} />
            </Field>
            <Field label="Investment Type">
              <select className={selectClass} value={form.investmentType} onChange={set('investmentType')}>
                <option value="">Select type</option>
                {INVESTMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Month">
              <select className={selectClass} value={form.month} onChange={set('month')}>
                <option value="">Select month</option>
                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>
            <Field label="Year">
              <input className={inputClass} placeholder="e.g. 2025" value={form.year} onChange={set('year')} />
            </Field>
          </div>
          <Field label="Startup brief description">
            <textarea className={inputClass + " resize-none h-24"} placeholder="Brief description of the startup…" value={form.description} onChange={set('description')} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Vertical">
              <select className={selectClass} value={form.vertical} onChange={set('vertical')}>
                <option value="">Select vertical</option>
                {VERTICALS.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </Field>
            <Field label="Born Year">
              <select className={selectClass} value={form.bornYear} onChange={set('bornYear')}>
                <option value="">Select year</option>
                {BORN_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Founders">
            <input className={inputClass} placeholder="e.g. Jane Smith, John Doe" value={form.founders} onChange={set('founders')} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Legal HQ">
              <input className={inputClass} placeholder="e.g. Delaware, Ukraine" value={form.legalHQ} onChange={set('legalHQ')} />
            </Field>
            <Field label="Startup origin">
              <input className={inputClass} placeholder="e.g. Ukraine, USA" value={form.startupOrigin} onChange={set('startupOrigin')} />
            </Field>
          </div>
          <Field label="Investor(s)">
            <input className={inputClass} placeholder="e.g. Y Combinator, Sequoia" value={form.investors} onChange={set('investors')} />
          </Field>
          <Field label="Link to news">
            <input type="url" className={inputClass} placeholder="https://…" value={form.linkToNews} onChange={set('linkToNews')} />
          </Field>
          {error && (
            <p className="text-sm font-medium rounded-md bg-red-50 border border-red-200 px-3 py-2" style={{ color: RED }}>{error}</p>
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
              {submitting ? 'Submitting…' : 'Submit Deal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
