import { ExternalLink } from 'lucide-react';
import type { Startup } from '@/lib/airtable';

function StartupAvatar({ name, logo }: { name: string; logo?: string }) {
  if (logo) return <img src={logo} alt={name} className="w-9 h-9 rounded-lg object-cover" />;
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const colors   = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-teal-500'];
  const color    = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
      {initials}
    </div>
  );
}

const formatRaise = (amount?: number) => {
  if (!amount) return null;
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000)     return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount}`;
};

export default function StartupCard({ startup }: { startup: Startup }) {
  return (
    <div className="card p-5 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <StartupAvatar name={startup.name} logo={startup.logo} />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900 text-sm truncate">{startup.name}</h3>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
              {startup.roundStage}
            </span>
            {startup.entityType && (
              <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                {startup.entityType}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{startup.description}</p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {startup.primaryVertical.map(v => (
          <span key={v} className="tag">{v}</span>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 mt-auto">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Target Raise</p>
          <p className="text-sm font-bold text-gray-900">
            {formatRaise(startup.targetRaiseAmount) || startup.targetRaise}
          </p>
        </div>
        {startup.pitchDeckUrl && (
          <a
            href={startup.pitchDeckUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-xs px-3 py-1.5"
          >
            View Deck <ExternalLink size={11} />
          </a>
        )}
      </div>
    </div>
  );
}
