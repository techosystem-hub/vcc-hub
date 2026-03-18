import { auth, currentUser } from '@clerk/nextjs/server';
import Sidebar from '@/components/Sidebar';
import MatchCard from '@/components/MatchCard';
import { getInvestorByEmail, getMatchesForInvestor } from '@/lib/airtable';
import { Flame, Leaf, Target } from 'lucide-react';

export default async function MyMatchesPage() {
  const user      = await currentUser();
  const email     = user?.emailAddresses?.[0]?.emailAddress;

  if (!email) return <div>Not authenticated</div>;

  const investor = await getInvestorByEmail(email);

  if (!investor) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="ml-[220px] flex-1 p-8 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500">Your investor profile was not found.</p>
            <p className="text-sm text-gray-400 mt-1">Contact your admin to get set up.</p>
          </div>
        </main>
      </div>
    );
  }

  const matches   = await getMatchesForInvestor(investor.id);
  const hot       = matches.filter(m => m.score >= 90);
  const strong    = matches.filter(m => m.score >= 75 && m.score < 90);

  const focusSummary = [
    investor.focusVerticals.join(', ') || 'All sectors',
    investor.ticketSize.join(', ')     || 'Any size',
  ].filter(Boolean).join(' · Ticket: ');

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-[220px] flex-1 p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Your Curated Matches</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Based on your focus in{' '}
            <span className="font-semibold text-gray-700">{focusSummary}</span>
          </p>
        </div>

        {/* Stats */}
        <div className="flex gap-4 mb-7">
          <div className="bg-white border border-gray-200 rounded-xl px-5 py-3 flex items-center gap-3">
            <Target size={18} className="text-blue-500" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{matches.length}</p>
              <p className="text-xs text-gray-400">Matches Found</p>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl px-5 py-3 flex items-center gap-3">
            <Flame size={18} className="text-orange-500" />
            <div>
              <p className="text-2xl font-bold text-orange-500">{hot.length}</p>
              <p className="text-xs text-gray-400">Hot Matches (90+)</p>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl px-5 py-3 flex items-center gap-3">
            <Leaf size={18} className="text-green-500" />
            <div>
              <p className="text-2xl font-bold text-green-500">{strong.length}</p>
              <p className="text-xs text-gray-400">Strong Matches (75–89)</p>
            </div>
          </div>
        </div>

        {/* Cards */}
        {matches.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg font-medium">No matches yet</p>
            <p className="text-sm mt-1">
              Matches are generated when startups enter the pipeline. Check back soon.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {matches.map(match => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
