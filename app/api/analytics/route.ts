import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getAnalytics } from '@/lib/airtable';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const data = await getAnalytics();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
