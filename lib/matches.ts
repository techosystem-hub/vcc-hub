// ─────────────────────────────────────────────────────────────────────────────────
// lib/matches.ts
// Airtable CRUD helpers for the Matches table.
// Executive summaries are cached on Matches (tblRvgGSEX4jsDQ6e)
// keyed by MatchKey = {MemberClerkID}_{StartupAirtableID}.
// VCC Matches table (tbltyE4ACJKDDpQU1) is deprecated — safe to delete in Airtable.
// ─────────────────────────────────────────────────────────────────────────────────
const BASE_ID = process.env.AIRTABLE_BASE_ID!
const TOKEN = process.env.AIRTABLE_API_TOKEN!
const ROOT = `https://api.airtable.com/v0/${BASE_ID}`
const MATCHES_TABLE = 'tblRvgGSEX4jsDQ6e'
const AT_HEADERS = { Authorization: `Bearer ${TOKEN}` }

export function makeMatchKey(memberClerkId: string, startupAirtableId: string) {
  return `${memberClerkId}_${startupAirtableId}`
}

export async function getVccMatch(memberClerkId: string, startupAirtableId: string) {
  const matchKey = makeMatchKey(memberClerkId, startupAirtableId)
  const formula = encodeURIComponent(`{MatchKey} = "${matchKey}"`)
  const res = await fetch(
    `${ROOT}/${MATCHES_TABLE}?filterByFormula=${formula}&maxRecords=1`,
    { headers: AT_HEADERS }
  )
  const data = await res.json()
  return data.records?.[0] || null
}

// No-op: Matches records are admin-created; status is managed via the matches API.
export async function upsertVccMatch(
  _memberClerkId: string,
  _startupAirtableId: string,
  _startupName: string,
  _status: string
) {
  return null
}

export async function saveExecutiveSummary(
  memberClerkId: string,
  startupAirtableId: string,
  summary: string
) {
  const existing = await getVccMatch(memberClerkId, startupAirtableId)
  if (!existing) return null
  const res = await fetch(`${ROOT}/${MATCHES_TABLE}/${existing.id}`, {
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
