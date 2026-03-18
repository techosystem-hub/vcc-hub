'use client';

import { useState } from 'react';
import { ExternalLink, Flame, Leaf, Waves } from 'lucide-react';
import clsx from 'clsx';
import type { Match } from '@/lib/airtable';

function ScoreBadge({ score }: { score: number }) {
  const isHot    = score >= 90;
  const isStrong = score >= 75 && score < 90;
  const isGood   = score >= 60 && score < 75;

  return (
    <span className={clsx(
      'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold',
      isHot    && 'score-hot',
      isStrong && 'score-strong',
      isGood   && 'score-good',
      !isHot && !isStrong && !isGood && 'score-weak',
    )}>
      {isHot    && <Flame size={11} />}
      {isStrong && <Leaf size={11} />}
      {isGood   && <Waves size={11} />}
      {score}/100 Match
    </span>
  );
}

function StartupAvatar({ name, logo }: { name: string; logo?: string }) {
  if (logo) {
    return <img src={logo} alt={name} className="w-9 h-9 rounded-lg object-cover" />;
  }
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const colors   = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-teal-500'];
  const color    = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
      {initials}
    </div>
  );
}

interface Props {
  match: Match;
}

export default function MatchCard({ match }: Props) {
  const [status, setStatus] = useState(match.status);
  const [loading, setLoading] = useState(false);

  const handleRequestIntro = async () => {
    if (status === 'Requested' || status === 'Intro Sent') return;
    setLoading(true);
    try {
      await fetch('/api/matches', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: match.id, status: 'Requested' }),
      });
      setStatus('Requested');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const formatRaise = (amount?: number) => {
    if (!amount) return null;
    if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000)     return `$${(amount / 1_000).toFixed(0)}K`;
    return `$${amount}`;
  };

  const whyLines = match.whyItMatches
    .split('\n')
    .map(l => l.replace(/^[-→•]\s*/, '').trim())
    .filter(Boolean);

  return (
    <div className="card p-5 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <StartupAvatar name={match.startupName} logo={match.startupLogo} />
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">
              {match.startupName}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                {match.startupStage}
              </span>
              {match.startupEntity && (
                <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                  {match.startupEntity}
                </span>
              )}
            </div>
          </div>
        </div>
        <ScoreBadge score={match.score} />
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
        {match.startupDescription}
      </p>

      {/* Vertical tags */}
      {match.startupVerticals.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {match.startupVerticals.map(v => (
            <span key={v} className="tag">{v}</span>
          ))}
        </div>
      )}

      {/* Why it matches */}
      {whyLines.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
          <p className="text-xs font-semibold text-gray-500 mb-1.5">Why it matches:</p>
          <ul className="space-y-1">
            {whyLines.slice(0, 3).map((line, i) => (
              <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                <span className="text-gray-400 mt-0.5">–</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 mt-auto">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Target Raise</p>
          <p className="text-sm font-bold text-gray-900">
            {formatRaise(match.startupRaiseAmount) || match.startupTicket}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {match.startupPitchDeck && (
            <a
              href={match.startupPitchDeck}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline text-xs px-3 py-1.5"
            >
              Deck <ExternalLink size={11} className="inline ml-0.5" />
            </a>
          )}
          <button
            onClick={handleRequestIntro}
            disabled={loading || status === 'Requested' || status === 'Intro Sent'}
            className={clsx(
              'btn-primary text-xs px-3 py-1.5',
              (status === 'Requested' || status === 'Intro Sent') &&
                'bg-green-600 hover:bg-green-600 cursor-default',
              loading && 'opacity-70 cursor-wait',
            )}
          >
            {status === 'Requested' ? '✓ Intro Requested' :
             status === 'Intro Sent' ? '✓ Intro Sent' :
             loading ? 'Sending…' : 'Request Intro →'}
          </button>
        </div>
      </div>
    </div>
  );
}
