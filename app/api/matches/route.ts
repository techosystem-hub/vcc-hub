import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getInvestorByEmail, getMatchesForInvestor } from '@/lib/airtable';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress;
    if (!email) return NextResponse.json({ matches: [], investor: null });

    const investor = await getInvestorByEmail(email);
    if (!investor) return NextResponse.json({ matches: [], investor: null });

    const matches = await getMatchesForInvestor(investor.id);
    return NextResponse.json({ matches, investor });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
