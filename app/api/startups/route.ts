import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getAllStartups, createStartupSubmission } from '@/lib/airtable'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const startups = await getAllStartups()
    return NextResponse.json(startups)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    if (!body.name) return NextResponse.json({ error: 'name is required' }, { status: 400 })
    const startup = await createStartupSubmission(body)
    return NextResponse.json(startup, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
