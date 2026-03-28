import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getInvestorByEmail, updateInvestorCriteria, createInvestorRecord } from '@/lib/airtable';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress;
    if (!email) return NextResponse.json(null);
    const investor = await getInvestorByEmail(email);
    return NextResponse.json(investor);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress;
    if (!email) return NextResponse.json({ error: 'No email' }, { status: 400 });

    let investor = await getInvestorByEmail(email);

    // Auto-create Airtable record for newly invited members who don't have one yet
    if (!investor) {
      const name =
        [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
        email.split('@')[0];
      investor = await createInvestorRecord(email, name);
    }

    const body = await req.json();
    await updateInvestorCriteria(investor.id, body);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
