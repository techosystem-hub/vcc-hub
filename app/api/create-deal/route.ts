import { NextRequest, NextResponse } from 'next/server'

const DEALFLOW_TABLE = `https://api.airtable.com/v0/appzew2eaB6QOy0RF/tblFoWnsAmc40zupt`
const TOKEN = process.env.AIRTABLE_API_TOKEN!

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const fields: Record<string, any> = {}
    if (body.startup)           fields['Startup']                   = body.startup
    if (body.datePublished)     fields['Date of publishing']        = body.datePublished
    if (body.investmentSize)    fields['Investment size']           = Number(body.investmentSize)
    if (body.currency)          fields['Currency']                  = body.currency
    if (body.investmentSizeUSD) fields['Investment size in USD']    = Number(body.investmentSizeUSD)
    if (body.month)             fields['Month']                     = body.month
    if (body.year)              fields['Year']                      = body.year
    if (body.description)       fields['Startup brief description'] = body.description
    if (body.bornYear)          fields['Born Year']                 = body.bornYear
    if (body.founders)          fields['Founders']                  = body.founders
    if (body.legalHQ)           fields['Legal HQ']                  = body.legalHQ
    if (body.roundStage)        fields['Round stage']               = body.roundStage
    if (body.investors)         fields['Investor(s)']               = body.investors
    if (body.linkToNews)        fields['Link to news']              = body.linkToNews
    if (body.investmentType)    fields['Investment Type']           = body.investmentType
    if (body.startupOrigin)     fields['Startup origin']            = body.startupOrigin
    if (body.vertical)          fields['Vertical']                  = body.vertical
    const res = await fetch(DEALFLOW_TABLE, {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    })
    const data = await res.json()
    if (!res.ok) {
      console.error('Airtable error:', data)
      return NextResponse.json({ error: data.error?.message || 'Failed to create record' }, { status: 500 })
    }
    return NextResponse.json({ success: true, id: data.id })
  } catch (err) {
    console.error('create-deal error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
