import Sidebar from '@/components/Sidebar';
import StartupCard from '@/components/StartupCard';
import { getActiveStartups } from '@/lib/airtable';
import { Search } from 'lucide-react';

const VERTICALS = ['AI', 'Defense', 'SaaS', 'EdTech', 'HealthTech', 'FinTech'];
const STAGES    = ['Pre-seed', 'Seed', 'Series A', 'Series B+'];

interface Props {
  searchParams: { vertical?: string; stage?: string };
}

export default async function DealRoomPage({ searchParams }: Props) {
  const startups = await getActiveStartups({
    vertical: searchParams.vertical,
    stage:    searchParams.stage,
  });

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-[220px] flex-1 p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Deal Room</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {startups.length} startups actively raising
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
            <Search size={14} className="text-gray-400" />
            <span className="text-sm text-gray-400">Search coming soon…</span>
          </div>

          <form className="flex gap-2 flex-wrap">
            <select
              name="vertical"
              defaultValue={searchParams.vertical || ''}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Verticals</option>
              {VERTICALS.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            <select
              name="stage"
              defaultValue={searchParams.stage || ''}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Stages</option>
              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button
              type="submit"
              className="btn-primary px-4 py-2 text-sm"
            >
              Filter
            </button>
            {(searchParams.vertical || searchParams.stage) && (
              <a href="/deal-room" className="btn-outline px-4 py-2 text-sm">
                Clear
              </a>
            )}
          </form>
        </div>

        {/* Grid */}
        {startups.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg font-medium">No startups found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {startups.map(startup => (
              <StartupCard key={startup.id} startup={startup} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
