// Client side of the AURA personal assistant: builds the state snapshot Claude sees,
// runs the tools Claude asks for against the local store, and talks to the assistant server.
import { useAuraStore, initialCareerProfile } from '../store/useAuraStore';

export const ASSISTANT_URL = import.meta.env.VITE_ASSISTANT_URL || 'http://127.0.0.1:5002/api/assistant';

const WORLD_IDS = ['career', 'study', 'project', 'life', 'knowledge', 'hub'];
const PRIORITIES = ['high', 'medium', 'low'];
const STATUSES = ['awaiting-review', 'form-opened', 'reviewed', 'applied', 'interview', 'offer', 'rejected'];
const PAGE_PATHS = { universe: '/universe', career: '/career', study: '/study', projects: '/projects', life: '/life', knowledge: '/knowledge', agents: '/agents' };

const isText = (v) => typeof v === 'string' && v.trim().length > 0;

// Appended to every user turn. Older turns keep the snapshot they were sent with (history is append-only).
export function buildStateBlock() {
  const s = useAuraStore.getState();
  const now = new Date();
  const profile = Object.fromEntries(Object.entries(s.careerProfile).filter(([, v]) => String(v || '').trim()));
  const state = {
    now: now.toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' }),
    profile,
    openTasks: s.tasks.filter((t) => t.status !== 'done').slice(0, 30).map((t) => ({ id: t.id, title: t.title, world: t.worldId, priority: t.priority, due: t.due })),
    applications: s.applicationDrafts.slice(0, 30).map((d) => ({ id: d.id, title: d.title, company: d.company, status: d.status })),
    appliedToday: s.applicationDrafts.filter((d) => d.appliedAt && new Date(d.appliedAt).toDateString() === now.toDateString()).length,
    dailyGoal: 10,
    notes: s.assistantMemory.map((m) => m.note),
  };
  return `<aura_state>\n${JSON.stringify(state)}\n</aura_state>`;
}

// Asks the FormPilot extension (through its content script on this page) to open the job in a new tab
// and fill the form. The extension never submits: the user reviews and presses Submit.
function openAndFill(draft) {
  if (document.documentElement.dataset.auraExtension !== '1') {
    return { ok: false, text: 'the FormPilot extension is not connected. Load it (extension/README.md), keep this tab open, then try again; or open the job and press Alt+Shift+F.' };
  }
  if (!/^https?:\/\//i.test(String(draft.jobUrl || ''))) return { ok: false, text: 'this application has no valid link.' };
  window.postMessage({ source: 'aura-app', type: 'AURA_OPEN_AND_FILL', url: draft.jobUrl }, window.location.origin);
  useAuraStore.getState().setApplicationStatus(draft.id, 'form-opened');
  return { ok: true, text: 'Opened in a new tab; FormPilot is filling it. The user reviews red fields and submits.' };
}

// Claude's tool input is untrusted: validate before touching the store.
export function runTool(name, input, navigate) {
  const s = useAuraStore.getState();
  const fail = (message) => ({ ok: false, text: message });
  const ok = (text) => ({ ok: true, text });
  const args = input && typeof input === 'object' ? input : {};

  switch (name) {
    case 'add_task': {
      if (!isText(args.title)) return fail('title is required');
      const worldId = WORLD_IDS.includes(args.world) ? args.world : 'project';
      const priority = PRIORITIES.includes(args.priority) ? args.priority : 'medium';
      s.addTask({ title: args.title.trim(), worldId, priority, due: isText(args.due) ? args.due.trim() : 'No deadline' });
      return ok(`Task added: ${args.title.trim()}`);
    }
    case 'complete_task': {
      if (!s.tasks.some((t) => t.id === args.task_id)) return fail('No task with that id');
      s.completeTask(args.task_id);
      return ok('Task marked done');
    }
    case 'add_job_application': {
      if (!isText(args.title) || !isText(args.company)) return fail('title and company are required');
      if (!/^https?:\/\//i.test(String(args.job_url || ''))) return fail('job_url must be a full http(s) link');
      s.createApplicationDraft({ title: args.title.trim(), company: args.company.trim(), jobUrl: args.job_url.trim() });
      const queued = `Queued: ${args.title.trim()} at ${args.company.trim()}`;
      if (args.fill_now !== true) return ok(queued);
      const draft = useAuraStore.getState().applicationDrafts[0]; // newest first
      const opened = openAndFill(draft);
      return opened.ok ? ok(`${queued}. ${opened.text}`) : { ok: false, text: `${queued}, but ${opened.text}` };
    }
    case 'fill_application': {
      const draft = s.applicationDrafts.find((d) => d.id === args.application_id);
      if (!draft) return fail('No application with that id');
      return openAndFill(draft);
    }
    case 'set_application_status': {
      if (!s.applicationDrafts.some((d) => d.id === args.application_id)) return fail('No application with that id');
      if (!STATUSES.includes(args.status)) return fail('Unknown status');
      s.setApplicationStatus(args.application_id, args.status);
      return ok(`Status set to ${args.status}`);
    }
    case 'update_profile': {
      const clean = Object.fromEntries(Object.entries(args).filter(([key, value]) => key in initialCareerProfile && typeof value === 'string'));
      if (Object.keys(clean).length === 0) return fail('No valid profile fields given');
      s.saveCareerProfile({ ...initialCareerProfile, ...s.careerProfile, ...clean });
      return ok(`Profile updated: ${Object.keys(clean).join(', ')}`);
    }
    case 'remember': {
      if (!isText(args.note)) return fail('note is required');
      s.addAssistantMemory(args.note.trim().slice(0, 300));
      return ok(`Remembered: ${args.note.trim()}`);
    }
    case 'navigate': {
      const path = PAGE_PATHS[args.page];
      if (!path) return fail('Unknown page');
      navigate(path);
      return ok(`Opened ${args.page}`);
    }
    default:
      return fail(`Unknown tool ${name}`);
  }
}

export async function pingAssistant() {
  try {
    const res = await fetch(`${ASSISTANT_URL}/health`);
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

export async function sendToAssistant(messages) {
  let res;
  try {
    res = await fetch(`${ASSISTANT_URL}/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages }) });
  } catch {
    throw new Error('Assistant server is not running. Start it with "npm run dev:ai" (or "npm run assistant").');
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || `Assistant error (${res.status})`);
  return body;
}
