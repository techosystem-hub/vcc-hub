import Sidebar from '@/components/Sidebar';
import { getAnnouncements, getUpcomingEvents } from '@/lib/airtable';
import { Calendar, MapPin, ExternalLink, Pin } from 'lucide-react';

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export default async function NewsEventsPage() {
  const [announcements, events] = await Promise.all([
    getAnnouncements(),
    getUpcomingEvents(),
  ]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-[220px] flex-1 p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">News & Events</h1>
          <p className="text-gray-500 mt-1 text-sm">Community updates and upcoming events</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Announcements — takes 2 columns */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-semibold text-gray-900">Announcements</h2>
            {announcements.length === 0 && (
              <p className="text-sm text-gray-400">No announcements yet.</p>
            )}
            {announcements.map(a => (
              <div key={a.id} className="card p-5">
                {a.image && (
                  <img src={a.image} alt={a.title} className="w-full h-40 object-cover rounded-lg mb-4" />
                )}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-900 text-sm leading-snug">{a.title}</h3>
                  {a.pinned && (
                    <span className="flex items-center gap-1 text-blue-500 text-xs font-medium flex-shrink-0">
                      <Pin size={11} /> Pinned
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1 mb-2">{formatDate(a.publishedDate)}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{a.body}</p>
              </div>
            ))}
          </div>

          {/* Events — 1 column */}
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-900">Upcoming Events</h2>
            {events.length === 0 && (
              <p className="text-sm text-gray-400">No upcoming events.</p>
            )}
            {events.map(e => (
              <div key={e.id} className="card p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    e.accessLevel === 'VCC Exclusive'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {e.accessLevel}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 text-sm">{e.eventName}</h3>
                {e.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{e.description}</p>
                )}
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Calendar size={12} />
                    <span>{formatDate(e.date)}</span>
                  </div>
                  {e.location && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <MapPin size={12} />
                      <span>{e.location}</span>
                    </div>
                  )}
                </div>
                {e.registrationLink && (
                  <a
                    href={e.registrationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium"
                  >
                    Register <ExternalLink size={10} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
