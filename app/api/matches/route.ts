import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { updateMatchStatus } from '@/lib/airtable';

export async function PATCH(req: Request) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { matchId, status } = await req.json();
  if (!matchId || !status) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  await updateMatchStatus(matchId, status);
  return NextResponse.json({ ok: true });
}
