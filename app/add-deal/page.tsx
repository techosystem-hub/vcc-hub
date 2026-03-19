'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'

const FORM_URL = 'https://airtable.com/embed/appzew2eaB6QOy0RF/pag0UYbAxuhakB0er/form'
const RED  = '#e71d36'
const NAVY = '#011627'

export default function AddDealPage() {
  const router = useRouter()
  const [submitted, setSubmitted] = useState(false)
  const [countdown, setCountdown] = useState(4)

  // Listen for Airtable's postMessage on form submission
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (
        typeof e.data === 'object' &&
        e.data !== null &&
        (e.data.type === 'formSubmitted' || e.data.event === 'formSubmitted')
      ) {
        setSubmitted(true)
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  // Countdown + redirect after submission
  useEffect(() => {
    if (!submitted) return
    if (countdown <= 0) {
      router.push('/')
      return
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [submitted, countdown, router])

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f8f8fa' }}>
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-6 py-3 border-b border-border/50"
        style={{ background: '#ffffff' }}
      >
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-sm font-medium hover:opacity-70 transition-opacity"
          style={{ color: NAVY }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Deal Flow
        </button>

        <div className="flex items-center gap-2">
          <div
            className="h-7 w-7 rounded-md flex items-center justify-center text-white text-xs font-bold"
            style={{ background: RED }}
          >
            T
          </div>
          <span className="text-sm font-semibold" style={{ color: NAVY }}>
            VCC Intelligence Hub
          </span>
        </div>
      </div>

      {/* Success overlay */}
      {submitted ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div
            className="rounded-full p-4"
            style={{ background: `${RED}18` }}
          >
            <CheckCircle2 className="h-10 w-10" style={{ color: RED }} />
          </div>
          <h2 className="text-xl font-bold" style={{ color: NAVY }}>Deal added successfully!</h2>
          <p className="text-sm text-muted-foreground">
            Returning to Deal Flow Database in {countdown}s…
          </p>
          <button
            onClick={() => router.push('/')}
            className="mt-2 px-4 py-2 rounded-md text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: RED }}
          >
            Go now
          </button>
        </div>
      ) : (
        /* Airtable form iframe */
        <iframe
          src={FORM_URL}
          className="flex-1 w-full border-0"
          style={{ minHeight: 'calc(100vh - 52px)' }}
          title="Add New Deal"
        />
      )}
    </div>
  )
}
