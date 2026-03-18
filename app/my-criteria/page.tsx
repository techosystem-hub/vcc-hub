'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { useUser } from '@clerk/nextjs';
import { CheckCircle, Save } from 'lucide-react';

const VERTICALS = ['AI', 'Defense', 'SaaS', 'EdTech', 'HealthTech', 'FinTech'];
const STAGES    = ['Pre-seed', 'Seed', 'Series A', 'Series B+'];
const TICKETS   = ['<$50k', '$50k-$200k', '$200k-$500k', '$500k-$1M+'];
const POLICIES  = ['Agnostic', 'Non-lethal only', 'No military'];

function MultiSelect({
  label, options, selected, onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (opt: string) =>
    onChange(selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt]);

  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
              selected.includes(opt)
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function MyCriteriaPage() {
  const { user }     = useUser();
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [investorId, setInvestorId] = useState('');

  const [verticals, setVerticals] = useState<string[]>([]);
  const [stages,    setStages]    = useState<string[]>([]);
  const [tickets,   setTickets]   = useState<string[]>([]);
  const [policy,    setPolicy]    = useState('Agnostic');
  const [bio,       setBio]       = useState('');

  // Load current criteria
  useEffect(() => {
    fetch('/api/criteria')
      .then(r => r.json())
      .then(data => {
        if (data.investor) {
          setInvestorId(data.investor.id);
          setVerticals(data.investor.focusVerticals);
          setStages(data.investor.stagePreference);
          setTickets(data.investor.ticketSize);
          setPolicy(data.investor.dualUsePolicy || 'Agnostic');
          setBio(data.investor.description || '');
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/criteria', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ investorId, verticals, stages, tickets, policy, bio }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="ml-[220px] flex-1 p-8 flex items-center justify-center">
          <p className="text-gray-400">Loading your criteria…</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-[220px] flex-1 p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Investment Criteria</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Your preferences power the Smart Matches algorithm.
            Changes apply to new startups entering the pipeline.
          </p>
        </div>

        <div className="max-w-2xl space-y-6">
          <div className="card p-6 space-y-6">
            <MultiSelect
              label="Focus Verticals"
              options={VERTICALS}
              selected={verticals}
              onChange={setVerticals}
            />
            <MultiSelect
              label="Preferred Stage"
              options={STAGES}
              selected={stages}
              onChange={setStages}
            />
            <MultiSelect
              label="Ticket Size"
              options={TICKETS}
              selected={tickets}
              onChange={setTickets}
            />

            {/* Dual-use Policy */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Dual-use / Defence Policy</p>
              <div className="flex flex-col gap-2">
                {POLICIES.map(p => (
                  <label key={p} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="policy"
                      value={p}
                      checked={policy === p}
                      onChange={() => setPolicy(p)}
                      className="accent-blue-600"
                    />
                    <span className="text-sm text-gray-700">{p}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Bio */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Fund Description / Thesis</p>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={3}
                placeholder="Briefly describe your investment thesis…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary px-6 py-2.5"
            >
              <Save size={15} />
              {saving ? 'Saving…' : 'Save Criteria'}
            </button>
            {saved && (
              <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
                <CheckCircle size={15} /> Saved!
              </span>
            )}
          </div>

          <p className="text-xs text-gray-400">
            ℹ️ Changing your criteria updates future matches. To re-score all existing startups against your new criteria, contact your admin.
          </p>
        </div>
      </main>
    </div>
  );
}
