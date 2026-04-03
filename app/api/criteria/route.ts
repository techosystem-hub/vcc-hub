import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getInvestorByEmail, updateInvestorCriteria } from '@/lib/airtable';

export async function GET() {
  const user  = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const investor = await getInvestorByEmail(email);
  return NextResponse.json({ investor });
}

export async function PATCH(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { investorId, verticals, stages, tickets, policy, bio } = await req.json();
  await updateInvestorCriteria(investorId, {
    focusVerticals:  verticals,
    stagePreference: stages,
    ticketSize:      tickets,
    dualUsePolicy:   policy,
    description:     bio,
  });
  return NextResponse.json({ ok: true });
}
