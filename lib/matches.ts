// ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// lib/matches.ts
// Airtable CRUD helpers for the VCC Matches table.
// Tracks (MemberClerkID Ã StartupAirtableID) pairs and stores AI summaries.
// Table ID: tbltyE4ACJKDDpQU1
// ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

const BASE_ID = process.env.AIRTABLE_BASE_ID!
const TOKEN = process.env.AIRTABLE_API_TOKEN!
const ROOT = `https://api.airtable.com/v0/${BASE_ID}`
const VCC_MATCHES_TABLE = 'tbltyE4ACJKDDpQU1'
const AT_HEADERS = { Authorization: `Bearer ${TOKEN}` }

export function makeMatchKey(memberClerkId: string, startupAirtableId: string) {
  return `${memberClerkId}_${startupAirtableId}`
}

export async function getVccMatch(memberClerkId: string, startupAirtableId: string) {
  const matchKey = makeMatchKey(memberClerkId, startupAirtableId)
  const formula = encodeURIComponent(`{MatchKey} = "${matchKey}"`)
  const res = await fetch(
    `${ROOT}/${VCC_MATCHES_TABLE}?filterByFormula=${formula}&maxRecords=1`,
    { headers: AT_HEADERS }
  )
  const data = await res.json()
  return data.records?.[0] || null
}

export async function upsertVccMatch(
  memberClerkId: string,
  startupAirtableId: string,
  startupName: string,
  status: string
) {
  const existing = await getVccMatch(memberClerkId, startupAirtableId)
  if (existing) {
    const res = await fetch(`${ROOT}/${VCC_MATCHES_TABLE}/${existing.id}`, {
      method: 'PATCH',
      headers: { ...AT_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { Status: status } }),
    })
    return res.json()
  }
  const matchKey = makeMatchKey(memberClerkId, startupAirtableId)
  const res = await fetch(`${ROOT}/${VCC_MATCHES_TABLE}`, {
    method: 'POST',
    headers: { ...AT_HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: {
        MatchKey: matchKey,
        MemberClerkID: memberClerkId,
        StartupAirtableID: startupAirtableId,
        StartupName: startupName,
        Status: status,
      },
    }),
  })
  return res.json()
}

export async function saveExecutiveSummary(
  memberClerkId: string,
  startupAirtableId: string,
  summary: string
) {
  const existing = await getVccMatch(memberClerkId, startupAirtableId)
  if (!existing) return null
  const res = await fetch(`${ROOT}/${VCC_MATCHES_TABLE}/${existing.id}`, {
    method: 'PATCH',
    headers: { ...AT_HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: {
        ExecutiveSummary: summary,
        SummaryGeneratedAt: new Date().toISOString(),
      },
    }),
  })
  return res.json()
}
