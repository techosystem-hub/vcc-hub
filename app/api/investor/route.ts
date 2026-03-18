import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getInvestorByEmail, updateInvestorCriteria } from '@/lib/airtable';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress;
    if (!email) return NextResponse.json(null);
    const investor = await getInvestorByEmail(email);
    return NextResponse.json(investor);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress;
    if (!email) return NextResponse.json({ error: 'No email' }, { status: 400 });

    const investor = await getInvestorByEmail(email);
    if (!investor) return NextResponse.json({ error: 'Investor not found' }, { status: 404 });

    const body = await req.json();
    await updateInvestorCriteria(investor.id, body);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
