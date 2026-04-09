import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { revalidateTag } from 'next/cache'

const DEALFLOW_TABLE = `https://api.airtable.com/v0/appzew2eaB6QOy0RF/tblFoWnsAmc40zupt`
const TOKEN = process.env.AIRTABLE_API_TOKEN!

// Valid Airtable singleSelect options — writing anything outside these lists
// causes "Insufficient permissions to create new select option" error.
const VALID_INVESTMENT_TYPES = ['New', 'Follow-up']
const VALID_CURRENCIES = ['USD', 'EUR', 'PLN', 'GBP', 'UAH', 'Non-disclosed']
const VALID_STAGES = [
  'Pre-seed', 'Seed', 'Angel', 'Series A', 'Series B', 'Series C', 'Series D',
  'Growth', 'Corporate funding', 'Non-disclosed',
]
const VALID_VERTICALS = [
  'Aerospace', 'Agrifood', 'Business Productivity', 'Communications',
  'Cybersecurity', 'Defense', 'Education', 'Energy & Environment',
  'Finance', 'Gaming', 'Healthcare', 'HR', 'Legal', 'Logistics & Transportation',
  'Marketing & Media', 'Property & Construction', 'Travel & Leisure',
]
const VALID_BORN_YEARS = [
  '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018',
  '2017', '2016', '2015', '2014', '2013', '2012', '2009', '2006',
  '2000', '1998', 'Non-disclosed',
]
const VALID_UA_INVESTORS = ['Yes', 'No']
const VALID_TECHOSYSTEM  = ['Member', 'No']

/** Only send a singleSelect value if it's in the allowed list. */
function safeSelect(value: string | undefined, allowed: string[]): string | undefined {
  return value && allowed.includes(value) ? value : undefined
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const fields: Record<string, any> = {}

    // Text fields
    if (body.startup?.trim())       fields['Startup']                   = body.startup.trim()
    if (body.description?.trim())   fields['Startup brief description'] = body.description.trim()
    if (body.founders?.trim())      fields['Founders']                  = body.founders.trim()
    if (body.legalHQ?.trim())       fields['Legal HQ']                  = body.legalHQ.trim()
    if (body.startupOrigin?.trim()) fields['Startup origin']            = body.startupOrigin.trim()
    if (body.investors?.trim())     fields['Investor(s)']               = body.investors.trim()
    if (body.linkToNews?.trim())    fields['Link to news']              = body.linkToNews.trim()
    if (body.comments?.trim())      fields['Comments']                  = body.comments.trim()
    if (body.datePublished)         fields['Date of publishing']        = body.datePublished

    // Number fields — coerce to Number; skip if zero/NaN
    const invSize    = Number(body.investmentSize)
    const invSizeUSD = Number(body.investmentSizeUSD)
    const month      = Number(body.month)   // form sends "1"–"12" as string
    const year       = Number(body.year)
    if (!isNaN(invSize)    && invSize > 0)    fields['Investment size']        = invSize
    if (!isNaN(invSizeUSD) && invSizeUSD > 0) fields['Investment size in USD'] = invSizeUSD
    if (!isNaN(month)      && month > 0)      fields['Month']                  = month
    if (!isNaN(year)       && year > 0)       fields['Year']                   = year

    // singleSelect fields — guard against unknown options to prevent Airtable error
    const currency       = safeSelect(body.currency,            VALID_CURRENCIES)
    const investmentType = safeSelect(body.investmentType,      VALID_INVESTMENT_TYPES)
    const roundStage     = safeSelect(body.roundStage,          VALID_STAGES)
    const vertical       = safeSelect(body.vertical,            VALID_VERTICALS)
    const bornYear       = safeSelect(body.bornYear,            VALID_BORN_YEARS)
    const uaInvestors    = safeSelect(body.uaInvestorsInvolved, VALID_UA_INVESTORS)
    const techMember     = safeSelect(body.techosystemMember,   VALID_TECHOSYSTEM)

    if (currency)       fields['Currency']              = currency
    if (investmentType) fields['Investment Type']       = investmentType
    if (roundStage)     fields['Round stage']           = roundStage
    if (vertical)       fields['Vertical']              = vertical
    if (bornYear)       fields['Born Year']             = bornYear
    if (uaInvestors)    fields['UA investors involved'] = uaInvestors
    if (techMember)     fields['Techosytem Member']     = techMember  // note: typo is in Airtable field name

    // Write to Airtable
    const res = await fetch(DEALFLOW_TABLE, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields }),
    })
    const data = await res.json()

    if (!res.ok) {
      console.error('Airtable create-deal error:', data)
      return NextResponse.json(
        { error: data.error?.message || 'Failed to create record' },
        { status: 500 }
      )
    }

    // Invalidate server-side data cache so the new deal appears immediately on next load
    revalidateTag('dealflow')

    // Email notification via Resend (gracefully skipped if RESEND_API_KEY is not set)
    const resendKey = process.env.RESEND_API_KEY
    if (resendKey) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'BRAMA Hub <notifications@uatechecosystem.com>',
            to: ['contact@uatechecosystem.com'],
            subject: `New Deal Added: ${body.startup}`,
            html: `
              <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
                <div style="background:#011627;border-radius:8px 8px 0 0;padding:16px 24px">
                  <span style="color:#fff;font-size:16px;font-weight:700">VCC Intelligence Hub</span>
                  <span style="color:#e71d36;margin-left:8px;font-size:12px">New deal added</span>
                </div>
                <div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;padding:24px;background:#fff">
                  <h2 style="margin:0 0 16px;color:#011627;font-size:20px">${body.startup}</h2>
                  <table style="width:100%;border-collapse:collapse;font-size:14px">
                    <tr><td style="padding:6px 0;color:#6b7280;width:42%">Vertical</td>        <td style="padding:6px 0;font-weight:500">${vertical || '—'}</td></tr>
                    <tr><td style="padding:6px 0;color:#6b7280">Round stage</td>                <td style="padding:6px 0;font-weight:500">${roundStage || '—'}</td></tr>
                    <tr><td style="padding:6px 0;color:#6b7280">Investment size</td>            <td style="padding:6px 0;font-weight:500">${invSize ? `${invSize.toLocaleString()} ${currency || ''}` : '—'}</td></tr>
                    <tr><td style="padding:6px 0;color:#6b7280">Amount in USD</td>              <td style="padding:6px 0;font-weight:500">${invSizeUSD ? `$${invSizeUSD.toLocaleString()}` : '—'}</td></tr>
                    <tr><td style="padding:6px 0;color:#6b7280">Investment type</td>            <td style="padding:6px 0;font-weight:500">${investmentType || '—'}</td></tr>
                    <tr><td style="padding:6px 0;color:#6b7280">Investors</td>                  <td style="padding:6px 0;font-weight:500">${body.investors || '—'}</td></tr>
                    <tr><td style="padding:6px 0;color:#6b7280">Date published</td>             <td style="padding:6px 0;font-weight:500">${body.datePublished || '—'}</td></tr>
                    ${body.linkToNews ? `<tr><td style="padding:6px 0;color:#6b7280">News link</td><td style="padding:6px 0"><a href="${body.linkToNews}" style="color:#e71d36">View article →</a></td></tr>` : ''}
                    ${body.comments   ? `<tr><td style="padding:6px 0;color:#6b7280;vertical-align:top">Comments</td><td style="padding:6px 0">${body.comments}</td></tr>` : ''}
                  </table>
                </div>
                <p style="font-size:12px;color:#9ca3af;margin-top:12px;text-align:center">Sent by BRAMA Hub · Airtable record: ${data.id}</p>
              </div>
            `,
          }),
        })
      } catch (emailErr) {
        // Email failure is non-fatal — deal is already saved to Airtable
        console.error('Email notification failed (non-fatal):', emailErr)
      }
    }

    return NextResponse.json({ success: true, id: data.id })
  } catch (err) {
    console.error('create-deal error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
