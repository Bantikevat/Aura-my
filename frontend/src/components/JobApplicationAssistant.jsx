import { useState } from 'react';
import { useAuraStore, initialCareerProfile } from '../store/useAuraStore';
import { extractPdfText, parseResumeToProfile } from '../lib/resume';
import FormPilotLab from './FormPilotLab';

const blankJob = { title: '', company: '', jobUrl: '' };

const EXTRA_FIELDS = [
  ['currentCompany', 'Current company'], ['currentTitle', 'Current job title'], ['experienceYears', 'Experience (years)'],
  ['currentCtc', 'Current CTC'], ['expectedCtc', 'Expected CTC'], ['noticePeriod', 'Notice period'],
  ['degree', 'Degree (B.Tech, MCA…)'], ['university', 'College / University'], ['graduationYear', 'Graduation year'],
  ['percentage', 'Percentage / CGPA'], ['dob', 'Date of birth (DD/MM/YYYY)'], ['gender', 'Gender'],
  ['address', 'Address'], ['city', 'City'], ['state', 'State'],
  ['pincode', 'Pincode'], ['country', 'Country'], ['github', 'GitHub URL'],
];

export default function JobApplicationAssistant() {
  const profile = useAuraStore((state) => state.careerProfile);
  const drafts = useAuraStore((state) => state.applicationDrafts);
  const saveProfile = useAuraStore((state) => state.saveCareerProfile);
  const createDraft = useAuraStore((state) => state.createApplicationDraft);
  const setDraftStatus = useAuraStore((state) => state.setApplicationStatus);
  const [form, setForm] = useState({ ...initialCareerProfile, ...profile });
  const [job, setJob] = useState(blankJob);
  const [notice, setNotice] = useState('');
  const [practiceDraft, setPracticeDraft] = useState(null);
  const [resumeBusy, setResumeBusy] = useState(false);
  const [resumeMsg, setResumeMsg] = useState('');

  async function onResumeUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = ''; // allow re-uploading the same file
    if (!file) return;
    setResumeBusy(true); setResumeMsg('Reading your resume…');
    try {
      const text = await extractPdfText(file);
      if (text.length < 30) throw new Error('This PDF has no selectable text (it looks scanned). Use a text-based PDF.');
      setResumeMsg('AI is extracting your details…');
      const extracted = await parseResumeToProfile(text);
      const keys = Object.keys(extracted);
      if (keys.length === 0) throw new Error('Could not read any fields. Please fill the form manually.');
      setForm((current) => ({ ...current, ...extracted, resumeName: file.name }));
      setResumeMsg(`✓ Filled ${keys.length} field${keys.length > 1 ? 's' : ''} from your resume. Review below, then press Save profile.`);
    } catch (err) {
      setResumeMsg(`✕ ${err.message}`);
    } finally {
      setResumeBusy(false);
    }
  }

  function changeProfile(event) { setForm((current) => ({ ...current, [event.target.name]: event.target.value })); }
  function save(event) { event.preventDefault(); saveProfile(form); setNotice('Your career profile is saved on this device.'); }
  function prepare(event) { event.preventDefault(); if (!job.title.trim() || !job.company.trim() || !job.jobUrl.trim()) return; createDraft(job); setJob(blankJob); setNotice('Application draft created. Review it below before opening the employer form.'); }
  const profileReady = profile.fullName && profile.email && profile.phone && profile.skills && profile.resumeName;

  return <section className="mb-8 grid gap-5 xl:grid-cols-2">
    <form onSubmit={save} className="glass-strong rounded-2xl p-5"><div className="flex items-center justify-between"><div><p className="section-label">Step 1</p><h2 className="mt-1 font-display text-lg font-semibold">Your application profile</h2></div><span className={`rounded-full px-2.5 py-1 text-[10px] ${profileReady ? 'bg-mint/10 text-mint' : 'bg-solar/10 text-solar'}`}>{profileReady ? 'Ready' : 'Complete required fields'}</span></div><p className="mt-2 text-xs text-slate-500">Only data you save here is used for application drafts. It stays in this browser for now.</p><label className={`mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-world-career/40 bg-world-career/[0.06] px-4 py-3 text-sm font-semibold text-world-career ${resumeBusy ? 'pointer-events-none opacity-60' : 'hover:bg-world-career/[0.12]'}`}><span>{resumeBusy ? '⏳' : '📄'}</span><span>{resumeBusy ? 'Working…' : 'Upload resume PDF → auto-fill profile'}</span><input type="file" accept="application/pdf,.pdf" onChange={onResumeUpload} disabled={resumeBusy} hidden /></label>{resumeMsg && <p className={`mt-2 text-[11px] ${resumeMsg.startsWith('✕') ? 'text-rose' : resumeMsg.startsWith('✓') ? 'text-mint' : 'text-slate-400'}`}>{resumeMsg}</p>}<div className="mt-4 grid gap-3 sm:grid-cols-2"><input name="fullName" value={form.fullName} onChange={changeProfile} placeholder="Full name *" className="field" /><input name="email" type="email" value={form.email} onChange={changeProfile} placeholder="Email *" className="field" /><input name="phone" value={form.phone} onChange={changeProfile} placeholder="Phone *" className="field" /><input name="location" value={form.location} onChange={changeProfile} placeholder="City / location" className="field" /><input name="education" value={form.education} onChange={changeProfile} placeholder="Education" className="field" /><input name="resumeName" value={form.resumeName} onChange={changeProfile} placeholder="Resume file name *" className="field" /></div><textarea name="skills" value={form.skills} onChange={changeProfile} placeholder="Skills * (example: React, Node.js, SQL)" rows="3" className="field mt-3" /><div className="mt-3 grid gap-3 sm:grid-cols-2"><input name="portfolio" value={form.portfolio} onChange={changeProfile} placeholder="Portfolio URL" className="field" /><input name="linkedin" value={form.linkedin} onChange={changeProfile} placeholder="LinkedIn URL" className="field" /></div><p className="section-label mt-5">Form vault — fields job sites ask again and again</p><div className="mt-2 grid gap-3 sm:grid-cols-3">{EXTRA_FIELDS.map(([name, label]) => <input key={name} name={name} value={form[name] ?? ''} onChange={changeProfile} placeholder={label} className="field" />)}</div><textarea name="summary" value={form.summary ?? ''} onChange={changeProfile} placeholder="Professional summary (used for 'About you' boxes)" rows="2" className="field mt-3" /><textarea name="whyJoin" value={form.whyJoin ?? ''} onChange={changeProfile} placeholder="Why do you want to join? (reusable answer)" rows="2" className="field mt-3" /><button className="mt-4 rounded-xl bg-ice px-4 py-2.5 text-sm font-bold text-slate-950">Save profile</button><p className="mt-2 text-[11px] text-slate-500">After saving, the AURA FormPilot extension picks this up automatically while this tab is open.</p></form>
    <form onSubmit={prepare} className="glass-strong rounded-2xl p-5"><p className="section-label">Step 2</p><h2 className="mt-1 font-display text-lg font-semibold">Prepare a job application</h2><p className="mt-2 text-xs text-slate-500">Paste the official job link. AURA creates a reviewable application draft; it never submits without you.</p><div className="mt-4 space-y-3"><input value={job.title} onChange={(event) => setJob((current) => ({ ...current, title: event.target.value }))} placeholder="Job title *" required className="field" /><input value={job.company} onChange={(event) => setJob((current) => ({ ...current, company: event.target.value }))} placeholder="Company *" required className="field" /><input value={job.jobUrl} onChange={(event) => setJob((current) => ({ ...current, jobUrl: event.target.value }))} placeholder="Official application URL *" type="url" required className="field" /></div><div className="mt-4 rounded-xl border border-ice/15 bg-ice/[0.05] p-3 text-xs text-slate-400"><span className="text-ice">Draft will include:</span> profile fields, skills, resume reference and links. Unknown questions stay empty for your answer.</div><button disabled={!profileReady} className="mt-4 rounded-xl bg-world-career px-4 py-2.5 text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40">Create review draft</button>{!profileReady && <p className="mt-2 text-[11px] text-solar">Complete name, email, phone, skills and resume name first.</p>}</form>
    <div className="glass-strong rounded-2xl p-5 xl:col-span-2"><div className="flex items-center justify-between"><div><p className="section-label">Step 3</p><h2 className="mt-1 font-display text-lg font-semibold">Application review queue</h2></div><span className="text-xs text-slate-500">{drafts.length} drafts</span></div>{notice && <p className="mt-3 rounded-lg bg-mint/10 p-2 text-xs text-mint">{notice}</p>}<div className="mt-4 space-y-3">{drafts.length === 0 ? <p className="rounded-xl bg-white/[0.03] p-4 text-sm text-slate-500">No application drafts yet. Save your profile, then add an official job link.</p> : drafts.map((draft) => <article key={draft.id} className="flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:flex-row sm:items-center"><div className="flex-1"><h3 className="text-sm font-semibold text-white">{draft.title}</h3><p className="mt-1 text-xs text-slate-400">{draft.company} · {profile.fullName || 'Profile not completed'}</p><p className="mt-2 text-[11px] text-slate-500">Status: {draft.status}</p></div><div className="flex flex-wrap gap-2"><button onClick={() => setPracticeDraft(draft)} className="rounded-xl bg-aurora px-3 py-2 text-xs font-bold text-white">Practice visual form</button><a href={draft.jobUrl} target="_blank" rel="noreferrer" onClick={() => setDraftStatus(draft.id, 'form-opened')} className="rounded-xl bg-ice px-3 py-2 text-xs font-bold text-slate-950">Open official form</a><button onClick={() => setDraftStatus(draft.id, 'reviewed')} className="rounded-xl border border-white/[0.12] px-3 py-2 text-xs text-slate-300">Mark reviewed</button></div></article>)}</div></div>
    {practiceDraft && <FormPilotLab draft={practiceDraft} profile={profile} onClose={() => setPracticeDraft(null)} />}
  </section>;
}
