import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuraStore } from '../store/useAuraStore';

// Free, no-key public job board API (CORS-enabled). Fully free — nothing paid.
const JOBS_API = 'https://www.arbeitnow.com/api/job-board-api';

// How well a job matches the user's own skills — computed locally, no AI.
function matchScore(job, skillTokens) {
  if (!skillTokens.length) return null;
  const haystack = `${job.title} ${(job.tags || []).join(' ')} ${(job.job_types || []).join(' ')}`.toLowerCase();
  const hits = skillTokens.filter((s) => haystack.includes(s)).length;
  return Math.min(99, 45 + hits * 11);
}

export default function JobBoard() {
  const profile = useAuraStore((s) => s.careerProfile);
  const drafts = useAuraStore((s) => s.applicationDrafts);
  const createDraft = useAuraStore((s) => s.createApplicationDraft);

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  const skillTokens = useMemo(
    () => String(profile.skills || '').toLowerCase().split(/[,|/]/).map((s) => s.trim()).filter((s) => s.length > 1),
    [profile.skills],
  );
  // Jobs already in the queue (match on URL) so we can show "Queued".
  const queuedUrls = useMemo(() => new Set(drafts.map((d) => d.jobUrl)), [drafts]);

  useEffect(() => {
    let alive = true;
    setLoading(true); setError('');
    fetch(JOBS_API)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((data) => { if (alive) { setJobs(Array.isArray(data?.data) ? data.data : []); setLoading(false); } })
      .catch(() => { if (alive) { setError('Jobs load nahi huye. Internet check karo ya thodi der baad try karo.'); setLoading(false); } });
    return () => { alive = false; };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = jobs.map((j) => ({ ...j, _match: matchScore(j, skillTokens) }));
    const matched = q
      ? list.filter((j) => `${j.title} ${j.company_name} ${(j.tags || []).join(' ')} ${j.location}`.toLowerCase().includes(q))
      : list;
    return matched.sort((a, b) => (b._match ?? 0) - (a._match ?? 0)).slice(0, 40);
  }, [jobs, query, skillTokens]);

  return (
    <section className="mb-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold">Live job board <span className="text-xs font-normal text-mint">· real listings (free)</span></h2>
        <span className="rounded-full bg-world-career/10 px-3 py-1 text-xs font-medium text-world-career">
          {loading ? 'Loading…' : `${filtered.length} shown`}
        </span>
      </div>

      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search: React, remote, backend, company…" className="field mb-4 w-full" />

      {error && <p className="rounded-xl bg-rose/10 p-4 text-sm text-rose">{error}</p>}
      {loading && <p className="rounded-xl bg-white/[0.03] p-4 text-sm text-slate-500">Fetching real jobs…</p>}
      {!loading && !error && filtered.length === 0 && <p className="rounded-xl bg-white/[0.03] p-4 text-sm text-slate-500">Is search pe kuch nahi mila. Doosra word try karo.</p>}

      <div className="space-y-3">
        {filtered.map((job) => {
          const queued = queuedUrls.has(job.url);
          const match = job._match;
          return (
            <motion.div key={job.slug || job.url} className="glass-card flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center" whileHover={{ x: 4 }}>
              {match != null && (
                <div className="flex flex-col items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold"
                    style={{ backgroundColor: match >= 78 ? 'rgba(52,211,153,0.15)' : match >= 60 ? 'rgba(251,191,36,0.15)' : 'rgba(255,110,122,0.15)', color: match >= 78 ? '#34d399' : match >= 60 ? '#fbbf24' : '#ff6e7a' }}>
                    {match}%
                  </div>
                  <p className="mt-1 text-[9px] text-slate-500">match</p>
                </div>
              )}

              <div className="flex-1">
                <h3 className="text-sm font-semibold text-white">{job.title}</h3>
                <p className="mt-0.5 text-xs text-slate-400">{job.company_name} · {job.location || 'Location N/A'}{job.remote ? ' · Remote' : ''}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(job.tags || []).slice(0, 5).map((tag) => (
                    <span key={tag} className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] text-slate-400">{tag}</span>
                  ))}
                </div>
              </div>

              <div className="flex flex-shrink-0 gap-2">
                <a href={job.url} target="_blank" rel="noreferrer" className="rounded-xl border border-white/[0.12] px-3 py-2 text-xs text-slate-300 hover:bg-white/[0.06]">View</a>
                <button
                  onClick={() => !queued && createDraft({ title: job.title, company: job.company_name, jobUrl: job.url })}
                  disabled={queued}
                  className={`rounded-xl px-3 py-2 text-xs font-bold ${queued ? 'cursor-default bg-mint/15 text-mint' : 'bg-world-career text-slate-950'}`}>
                  {queued ? '✓ Queued' : 'Queue in AURA'}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
