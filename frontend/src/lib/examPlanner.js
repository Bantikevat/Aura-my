// Exam Compressor planner. Pure functions: the plan is recomputed from today's date and what is
// still undone, so a missed day simply shifts everything forward. No AI is involved in the schedule.
const DAY = 86400000;
export const REVISION_GAPS = [1, 3, 7];

export const parseDay = (value) => { const [y, m, d] = String(value).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
export const dayKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const addDays = (date, n) => { const d = new Date(date.getFullYear(), date.getMonth(), date.getDate()); d.setDate(d.getDate() + n); return d; };
export const daysBetween = (a, b) => Math.round((parseDay(typeof b === 'string' ? b : dayKey(b)) - parseDay(typeof a === 'string' ? a : dayKey(a))) / DAY);

// Hours a topic needs: heavier topics and topics you know less take longer.
export const estHours = (t) => Math.max(0.5, Math.round((0.5 + t.weight * 0.25) * (1 + (5 - t.level) * 0.2) * 2) / 2);
// What to study first: lots of marks and little knowledge.
export const priority = (t) => t.weight * (6 - t.level);

export function buildPlan(plan, today = new Date()) {
  const todayKey = dayKey(today);
  const daysLeft = daysBetween(todayKey, plan.date);
  const topics = plan.topics;
  const totalWeight = topics.reduce((s, t) => s + t.weight, 0) || 1;
  const doneWeight = topics.filter((t) => t.doneOn).reduce((s, t) => s + t.weight, 0);

  const revisionsDue = [];
  for (const t of topics.filter((x) => x.doneOn)) {
    const since = daysBetween(t.doneOn, todayKey);
    for (const gap of REVISION_GAPS) if (since >= gap && !(t.revDone || []).includes(gap)) revisionsDue.push({ id: t.id, name: t.name, gap, overdue: since - gap });
  }

  if (daysLeft < 1) return { daysLeft, days: [], skipped: [], revisionsDue, coverage: { doneWeight, plannedWeight: 0, totalWeight }, phase: daysLeft === 0 ? 'exam-day' : 'over', reserve: 0 };

  const reserve = daysLeft >= 7 ? Math.max(1, Math.round(daysLeft * 0.15)) : 0; // last days: mock tests + revision only
  const studyDays = daysLeft - reserve;
  const open = topics.filter((t) => !t.doneOn).sort((a, b) => priority(b) - priority(a));
  const days = Array.from({ length: studyDays }, (_, i) => ({ date: dayKey(addDays(parseDay(todayKey), i)), items: [], hours: 0 }));
  const skipped = [];
  let idx = 0;
  const scheduled = new Set();
  for (const t of open) {
    let left = estHours(t);
    const startIdx = idx;
    const parts = [];
    // A topic longer than one day is split across days; it counts only if it fits entirely.
    while (left > 0.001 && idx < studyDays) {
      const chunk = Math.min(left, plan.hours - days[idx].hours);
      if (chunk > 0.001) { parts.push({ day: idx, hours: chunk }); left -= chunk; }
      if (days[idx].hours + (chunk > 0 ? chunk : 0) >= plan.hours - 0.001 || chunk <= 0.001) { days[idx].hours += chunk > 0 ? chunk : 0; idx++; } else days[idx].hours += chunk;
    }
    if (left > 0.001) {
      for (const p of parts) days[p.day].hours -= p.hours; // roll back: does not fit before the reserve days
      idx = startIdx;
      skipped.push(t);
      continue;
    }
    parts.forEach((p, i) => days[p.day].items.push({ id: t.id, name: parts.length > 1 ? `${t.name} (part ${i + 1}/${parts.length})` : t.name, hours: p.hours, weight: i === 0 ? t.weight : 0 }));
    scheduled.add(t.id);
  }
  const plannedWeight = open.filter((t) => scheduled.has(t.id)).reduce((s, t) => s + t.weight, 0);
  return { daysLeft, days, skipped, revisionsDue, reserve, phase: studyDays > 0 ? 'study' : 'final-revision', coverage: { doneWeight, plannedWeight, totalWeight } };
}
