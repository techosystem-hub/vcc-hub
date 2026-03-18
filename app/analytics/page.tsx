import Sidebar from '@/components/Sidebar';
import { getAnalytics } from '@/lib/airtable';
import { TrendingUp, Users, CheckCircle, ArrowUpRight } from 'lucide-react';

const COLORS = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-teal-500', 'bg-pink-500'];

export default async function AnalyticsPage() {
  const data = await getAnalytics();

  const verticalEntries = Object.entries(data.verticalBreakdown).sort((a, b) => b[1] - a[1]);
  const stageEntries    = Object.entries(data.stageBreakdown).sort((a, b) => b[1] - a[1]);
  const maxVertical     = Math.max(...verticalEntries.map(e => e[1]), 1);
  const maxStage        = Math.max(...stageEntries.map(e => e[1]), 1);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-[220px] flex-1 p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Market Analytics</h1>
          <p className="text-gray-500 mt-1 text-sm">Live pipeline intelligence</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total in Pipeline', value: data.totalStartups,      icon: Users,       color: 'text-blue-600',   bg: 'bg-blue-50'   },
            { label: 'Actively Raising',  value: data.activelyRaising,    icon: TrendingUp,  color: 'text-green-600',  bg: 'bg-green-50'  },
            { label: 'Deals Closed',      value: data.totalClosed,         icon: CheckCircle, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Intro Requests',    value: data.totalIntroRequests,  icon: ArrowUpRight,color: 'text-orange-600', bg: 'bg-orange-50' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="card p-5">
              <div className={`inline-flex p-2 rounded-lg ${bg} mb-3`}>
                <Icon size={18} className={color} />
              </div>
              <p className="text-3xl font-bold text-gray-900">{value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vertical Distribution */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Vertical Distribution</h2>
            <div className="space-y-3">
              {verticalEntries.map(([vertical, count], i) => (
                <div key={vertical}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 font-medium">{vertical}</span>
                    <span className="text-gray-400">{count} startup{count !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${COLORS[i % COLORS.length]} rounded-full transition-all`}
                      style={{ width: `${(count / maxVertical) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              {verticalEntries.length === 0 && (
                <p className="text-sm text-gray-400">No data yet</p>
              )}
            </div>
          </div>

          {/* Stage Distribution */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Stage Distribution</h2>
            <div className="space-y-3">
              {stageEntries.map(([stage, count], i) => (
                <div key={stage}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 font-medium">{stage}</span>
                    <span className="text-gray-400">{count} startup{count !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${COLORS[(i + 2) % COLORS.length]} rounded-full transition-all`}
                      style={{ width: `${(count / maxStage) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              {stageEntries.length === 0 && (
                <p className="text-sm text-gray-400">No data yet</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
