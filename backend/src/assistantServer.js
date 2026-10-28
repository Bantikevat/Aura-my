// AURA personal assistant API. Needs no database or login: it only relays chat turns to Claude
// so the API key stays on this machine. Tools run in the browser, where the user's data lives.
import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import Anthropic from '@anthropic-ai/sdk';

const PORT = process.env.ASSISTANT_PORT || process.env.PORT || 5002;
const MODEL = process.env.ASSISTANT_MODEL || 'claude-opus-5-5';
const ORIGINS = (process.env.CLIENT_URL || 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174').split(',');

const WORLDS = ['career', 'study', 'project', 'life', 'knowledge', 'hub'];
const STATUSES = ['awaiting-review', 'form-opened', 'reviewed', 'applied', 'interview', 'offer', 'rejected'];
const PROFILE_KEYS = [
  'fullName', 'email', 'phone', 'location', 'education', 'skills', 'portfolio', 'linkedin', 'resumeName', 'github', 'dob', 'gender',
  'address', 'city', 'state', 'pincode', 'country', 'currentCompany', 'currentTitle', 'experienceYears', 'currentCtc', 'expectedCtc',
  'noticePeriod', 'degree', 'university', 'graduationYear', 'percentage', 'summary', 'whyJoin',
];

const TOOLS = [
  {
    name: 'add_task',
    description: 'Create a task in the user\'s AURA workspace.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        world: { type: 'string', enum: WORLDS, description: 'Which world the task belongs to' },
        priority: { type: 'string', enum: ['high', 'medium', 'low'] },
        due: { type: 'string', description: 'Human readable, e.g. "Today 18:00" or "Fri"' },
      },
      required: ['title', 'world', 'priority'],
    },
  },
  {
    name: 'complete_task',
    description: 'Mark an existing task as done. Use the id from the AURA state.',
    input_schema: { type: 'object', properties: { task_id: { type: 'string' } }, required: ['task_id'] },
  },
  {
    name: 'add_job_application',
    description: 'Add a job to the application queue. Only call with an official application URL the user gave you. Set fill_now to true when the user wants to apply right now: it also opens the job page in a new tab and runs the FormPilot extension to fill the form.',
    input_schema: {
      type: 'object',
      properties: { title: { type: 'string' }, company: { type: 'string' }, job_url: { type: 'string' }, fill_now: { type: 'boolean' } },
      required: ['title', 'company', 'job_url'],
    },
  },
  {
    name: 'fill_application',
    description: 'Open a job that is already in the queue in a new tab and run the FormPilot extension to fill its form. Open one job at a time unless the user asks for more.',
    input_schema: { type: 'object', properties: { application_id: { type: 'string' } }, required: ['application_id'] },
  },
  {
    name: 'set_application_status',
    description: 'Change the status of an application in the queue.',
    input_schema: {
      type: 'object',
      properties: { application_id: { type: 'string' }, status: { type: 'string', enum: STATUSES } },
      required: ['application_id', 'status'],
    },
  },
  {
    name: 'update_profile',
    description: 'Save facts the user told you into their career profile (the vault the form-filler uses). Only save what the user stated.',
    input_schema: {
      type: 'object',
      properties: Object.fromEntries(PROFILE_KEYS.map((key) => [key, { type: 'string' }])),
      additionalProperties: false,
    },
  },
  {
    name: 'remember',
    description: 'Save one short note about how the user works or what they prefer, so you can act the same way next time.',
    input_schema: { type: 'object', properties: { note: { type: 'string' } }, required: ['note'] },
  },
  {
    name: 'navigate',
    description: 'Open a page of the AURA app.',
    input_schema: {
      type: 'object',
      properties: { page: { type: 'string', enum: ['universe', 'career', 'study', 'projects', 'life', 'knowledge', 'agents'] } },
      required: ['page'],
    },
  },
];

const SYSTEM = `You are AURA, the user's personal assistant inside their AURA workspace. You work for one person and you are meant to do their work with them, not just talk about it.

How you work
- Every user turn starts with an <aura_state> block: today's date, their profile, tasks, job applications and notes you saved earlier. Treat it as the source of truth and prefer it over anything you assume.
- Act with your tools when the user asks for something you can do (add a task, queue a job, change a status, save a fact, open a page). Do it, then say in one line what you did. Do not ask permission for small reversible actions.
- When the user states a stable fact about themselves (expected CTC, notice period, a preference, how they like replies written), save it with update_profile or remember so they never repeat it.
- Job applications: you help prepare them. You never submit anything, never solve CAPTCHA or OTP, and never claim an application was sent. Submitting is the user's click. When the user says to apply to a job, call add_job_application with fill_now true (or fill_application for a job already queued): the job opens in a new tab and FormPilot fills what it knows. Then tell the user, in two lines, that the red-outlined fields are theirs to answer and that they review and press Submit themselves. Once they say it was submitted, set the status to applied. If the tool reports the extension is not connected, say so and give the manual route (open the job, press Alt+Shift+F).
- Screening questions ("why do you want this role?", "describe a challenge"): write the answer in the user's voice from their profile and notes, ready to paste. If a fact is missing, say which fact you need instead of inventing it. Never invent employers, dates, degrees, salary or skills.
- Planning a day: pick from their real open tasks and queue, put the highest-value item first, be realistic about the ten-jobs-a-day goal, and keep it short.

Style
- Reply in the language the user writes in. If they write Hinglish (Hindi in Roman letters), answer in natural Hinglish.
- Be brief and concrete. No filler, no lectures. Lists only when they help.
- If you cannot do something with your tools, say so plainly and give the next best step.`;

let client;
function anthropic() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  client ??= new Anthropic();
  return client;
}

async function callGemini({ prompt, system, json = false }) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  let lastError = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      const body = {
        contents: [{ parts: [{ text: prompt }] }],
      };
      if (system) {
        body.systemInstruction = { parts: [{ text: system }] };
      }
      if (json) {
        body.generationConfig = { responseMimeType: 'application/json' };
      }
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errText = await res.text();
        lastError = new Error(`Gemini ${model} error: ${res.status} - ${errText}`);
        continue; // try next model
      }
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError || new Error('All Gemini models failed.');
}

// Gemini needs its own shapes for tools. Strip JSON-schema keys it rejects (e.g. additionalProperties).
function geminiTools() {
  const clean = (schema) => {
    if (Array.isArray(schema)) return schema.map(clean);
    if (schema && typeof schema === 'object') {
      const out = {};
      for (const [k, v] of Object.entries(schema)) {
        if (k === 'additionalProperties') continue;
        out[k] = clean(v);
      }
      return out;
    }
    return schema;
  };
  return [{ functionDeclarations: TOOLS.map((t) => ({ name: t.name, description: t.description, parameters: clean(t.input_schema) })) }];
}

// Translate the Anthropic-style history the browser sends into Gemini's contents/parts.
// Gemini has no tool-call ids, so we recover each result's function name from the matching tool_use.
function toGeminiContents(messages) {
  const nameById = new Map();
  for (const m of messages) {
    if (m.role === 'assistant' && Array.isArray(m.content)) {
      for (const b of m.content) if (b.type === 'tool_use') nameById.set(b.id, b.name);
    }
  }
  const contents = [];
  for (const m of messages) {
    if (m.role === 'user') {
      if (typeof m.content === 'string') {
        contents.push({ role: 'user', parts: [{ text: m.content }] });
      } else if (Array.isArray(m.content)) {
        const parts = m.content.map((b) => {
          if (b.type === 'tool_result') {
            const result = typeof b.content === 'string' ? b.content : JSON.stringify(b.content);
            return { functionResponse: { name: nameById.get(b.tool_use_id) || 'tool', response: { result } } };
          }
          return { text: b.type === 'text' ? b.text : '' };
        });
        contents.push({ role: 'user', parts });
      }
    } else if (m.role === 'assistant') {
      if (typeof m.content === 'string') {
        contents.push({ role: 'model', parts: [{ text: m.content }] });
      } else if (Array.isArray(m.content)) {
        const parts = [];
        for (const b of m.content) {
          if (b.type === 'text' && b.text) parts.push({ text: b.text });
          else if (b.type === 'tool_use') parts.push({ functionCall: { name: b.name, args: b.input || {} } });
        }
        if (parts.length) contents.push({ role: 'model', parts });
      }
    }
  }
  return contents;
}

// Gemini chat with tools, returned in the Anthropic shape the browser loop already understands.
async function callGeminiChat(messages) {
  const key = process.env.GEMINI_API_KEY;
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  const contents = toGeminiContents(messages);
  let lastError = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      const body = { contents, systemInstruction: { parts: [{ text: SYSTEM }] }, tools: geminiTools() };
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) { lastError = new Error(`Gemini ${model} error: ${res.status} - ${await res.text()}`); continue; }
      const parts = (await res.json())?.candidates?.[0]?.content?.parts ?? [];
      const content = [];
      let hasToolUse = false;
      for (const p of parts) {
        if (p.text) content.push({ type: 'text', text: p.text });
        else if (p.functionCall) {
          hasToolUse = true;
          content.push({ type: 'tool_use', id: `gem_${Math.random().toString(36).slice(2, 12)}`, name: p.functionCall.name, input: p.functionCall.args || {} });
        }
      }
      if (content.length === 0) content.push({ type: 'text', text: 'Koi response nahi mila.' });
      return { content, stop_reason: hasToolUse ? 'tool_use' : 'end_turn', usage: {} };
    } catch (e) { lastError = e; }
  }
  throw lastError || new Error('All Gemini models failed.');
}

const app = express();
// Allow local dev plus any deployed frontend origins listed in CLIENT_URL (comma-separated).
const extraOrigins = (process.env.CLIENT_URL || '').split(',').map((s) => s.trim()).filter(Boolean);
app.use(cors({ origin: (o, cb) => cb(null, !o || o.startsWith('http://localhost') || o.startsWith('http://127.0.0.1') || extraOrigins.includes(o)) }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/assistant/health', (req, res) => {
  const hasGemini = !!process.env.GEMINI_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  res.json({
    status: 'ok',
    model: hasGemini ? 'gemini-2.5-flash' : MODEL,
    keyConfigured: hasGemini || hasAnthropic,
    provider: hasGemini ? 'google-gemini' : (hasAnthropic ? 'anthropic' : 'none'),
  });
});

app.post('/api/assistant/chat', async (req, res) => {
  const { messages } = req.body ?? {};
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 80) {
    return res.status(400).json({ message: 'Conversation is empty or too long. Start a new chat.' });
  }

  if (process.env.GEMINI_API_KEY) {
    try {
      return res.json(await callGeminiChat(messages));
    } catch (error) {
      console.error('Gemini chat error:', error);
      return res.status(500).json({ message: error.message || 'Gemini assistant error' });
    }
  }

  const api = anthropic();
  if (!api) return res.status(503).json({ message: 'Assistant is not configured: set GEMINI_API_KEY or ANTHROPIC_API_KEY in backend/.env.' });

  try {
    const response = await api.messages.create({
      model: MODEL,
      max_tokens: 4096,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'medium' },
      system: SYSTEM,
      tools: TOOLS,
      messages,
    });
    return res.json({ content: response.content, stop_reason: response.stop_reason, usage: response.usage });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) return res.status(401).json({ message: 'The Anthropic API key was rejected. Check ANTHROPIC_API_KEY.' });
    if (error instanceof Anthropic.RateLimitError) return res.status(429).json({ message: 'Rate limited by Anthropic. Wait a moment and try again.' });
    if (error instanceof Anthropic.APIError) return res.status(error.status || 502).json({ message: error.message });
    console.error('assistant error', error);
    return res.status(500).json({ message: 'Assistant failed unexpectedly.' });
  }
});

// ---- Resume Auto-Fill: read resume text and extract the career-profile vault fields (free). ----
const RESUME_SCHEMA = {
  type: 'object',
  properties: Object.fromEntries(PROFILE_KEYS.map((k) => [k, { type: 'string' }])),
  required: [...PROFILE_KEYS],
  additionalProperties: false,
};
const RESUME_SYSTEM = `You read a resume/CV and extract the person's details into a fixed set of profile fields used to auto-fill job application forms.
Return ONLY facts clearly present in the resume. If a field is not in the resume, use an empty string "" — never guess, never invent.
Rules:
- fullName: the candidate's name. email/phone: exactly as written. linkedin/github/portfolio: full URLs if present.
- skills: a single comma-separated list of their technical skills.
- summary: their professional summary/objective in 1-3 sentences, in their own words, trimmed.
- experienceYears: total years of experience as a plain number string if stated or clearly derivable, else "".
- currentCompany/currentTitle: their latest / most recent job. degree/university/graduationYear/percentage: highest or most recent qualification.
- dob, gender, address, city, state, pincode, country, currentCtc, expectedCtc, noticePeriod, whyJoin: fill only if explicitly present.
Keep every value short, plain text, no markdown and no bullet characters.`;

app.post('/api/assistant/parse-resume', async (req, res) => {
  const text = String(req.body?.text ?? '').trim().slice(0, 20000);
  if (text.length < 30) return res.status(400).json({ message: 'Resume text is empty or too short. Upload a text-based PDF (not a scanned image).' });

  // Keep only the known profile keys with non-empty string values.
  const pick = (obj) => Object.fromEntries(PROFILE_KEYS
    .map((k) => [k, typeof obj?.[k] === 'string' ? obj[k].trim().slice(0, 600) : ''])
    .filter(([, v]) => v));

  if (process.env.GEMINI_API_KEY) {
    try {
      const prompt = `${RESUME_SYSTEM}\n\nResume text:\n"""\n${text}\n"""\n\nReturn strict JSON with these keys (use "" when absent): ${PROFILE_KEYS.join(', ')}`;
      const out = pick(JSON.parse(await callGemini({ prompt, json: true })));
      if (Object.keys(out).length === 0) return res.status(422).json({ message: 'Could not read any fields from this resume. Fill the form manually.' });
      return res.json({ profile: out });
    } catch (error) {
      console.error('Gemini parse-resume error', error);
      return res.status(500).json({ message: error.message || 'Could not read the resume.' });
    }
  }

  const api = anthropic();
  if (!api) return res.status(503).json({ message: 'Assistant is not configured: set GEMINI_API_KEY or ANTHROPIC_API_KEY in backend/.env.' });
  try {
    const response = await api.messages.create({
      model: MODEL,
      max_tokens: 2000,
      output_config: { format: { type: 'json_schema', schema: RESUME_SCHEMA } },
      system: RESUME_SYSTEM,
      messages: [{ role: 'user', content: `Resume text:\n"""\n${text}\n"""` }],
    });
    const out = pick(JSON.parse(response.content.find((b) => b.type === 'text')?.text || '{}'));
    if (Object.keys(out).length === 0) return res.status(422).json({ message: 'Could not read any fields from this resume. Fill the form manually.' });
    return res.json({ profile: out });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) return res.status(401).json({ message: 'The Anthropic API key was rejected. Check ANTHROPIC_API_KEY.' });
    if (error instanceof Anthropic.APIError) return res.status(error.status || 502).json({ message: error.message });
    console.error('parse-resume error', error);
    return res.status(500).json({ message: 'Could not read the resume.' });
  }
});

// ---- Flashcards: turn a topic into Q/A cards for spaced-repetition study (free). ----
app.post('/api/assistant/flashcards', async (req, res) => {
  const topic = String(req.body?.topic ?? '').trim().slice(0, 200);
  const count = Math.min(20, Math.max(3, Number(req.body?.count) || 8));
  if (!topic) return res.status(400).json({ message: 'Write a topic first, e.g. "DBMS Normalization".' });

  const sys = `You create study flashcards for a student preparing for exams. For the given topic write ${count} high-quality question/answer cards.
- front: one clear, specific question or prompt (single line).
- back: the correct, complete answer in 1-3 short sentences — accurate and exam-ready.
Cover the most important and most-asked points first. Write in simple English unless the topic itself is in Hinglish. No markdown, no bullet characters.`;
  const clean = (arr) => (Array.isArray(arr) ? arr : [])
    .filter((c) => c && typeof c.front === 'string' && typeof c.back === 'string' && c.front.trim() && c.back.trim())
    .slice(0, 20)
    .map((c) => ({ front: c.front.trim().slice(0, 300), back: c.back.trim().slice(0, 800) }));

  if (process.env.GEMINI_API_KEY) {
    try {
      const prompt = `${sys}\n\nTopic: ${topic}\n\nReturn strict JSON: { "cards": [{ "front": string, "back": string }] }`;
      const cards = clean(JSON.parse(await callGemini({ prompt, json: true }))?.cards);
      if (cards.length) return res.json({ cards });
      return res.status(502).json({ message: 'Could not make cards. Try another topic.' });
    } catch (error) {
      console.error('Gemini flashcards error', error);
      return res.status(500).json({ message: error.message || 'Could not make flashcards.' });
    }
  }

  const api = anthropic();
  if (!api) return res.status(503).json({ message: 'Assistant is not configured: set GEMINI_API_KEY or ANTHROPIC_API_KEY in backend/.env.' });
  try {
    const schema = { type: 'object', properties: { cards: { type: 'array', items: { type: 'object', properties: { front: { type: 'string' }, back: { type: 'string' } }, required: ['front', 'back'], additionalProperties: false } } }, required: ['cards'], additionalProperties: false };
    const response = await api.messages.create({ model: MODEL, max_tokens: 4000, output_config: { format: { type: 'json_schema', schema } }, system: sys, messages: [{ role: 'user', content: `Topic: ${topic}` }] });
    const cards = clean(JSON.parse(response.content.find((b) => b.type === 'text')?.text || '{}')?.cards);
    if (cards.length) return res.json({ cards });
    return res.status(502).json({ message: 'Could not make cards. Try another topic.' });
  } catch (error) {
    if (error instanceof Anthropic.APIError) return res.status(error.status || 502).json({ message: error.message });
    console.error('flashcards error', error);
    return res.status(500).json({ message: 'Could not make flashcards.' });
  }
});

// ---- Imagine Mode: turns a CS topic into step-by-step frames the 3D scene plays back. ----
// Three scene kinds, all declarative data (the AI never supplies code):
//   array - values in a row (search, sort, page-replacement slots)
//   graph - nodes and edges, laid out as a tree or a circle (BST, BFS/DFS, Dijkstra)
//   table - rows and columns of text (SQL joins, normalization, OS process tables)
const MARK_KINDS = ['compare', 'active', 'found', 'swap', 'sorted', 'discard'];
// Growth curves the playground can show. The AI only names one; the client computes the maths (no eval).
const GROWTH_KINDS = ['constant', 'log', 'sqrt', 'linear', 'nlogn', 'quadratic', 'cubic', 'exponential'];
const markItem = {
  type: 'object',
  properties: { target: { type: 'string' }, kind: { type: 'string', enum: MARK_KINDS } },
  required: ['target', 'kind'],
  additionalProperties: false,
};
const VISUAL_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    problem: { type: 'string', description: 'A real situation a person or company faces, told before any algorithm, 2-3 sentences, ending in the question this topic answers' },
    without_it: { type: 'string', description: 'What goes wrong, in numbers if possible, if you solve it the naive way (e.g. 1 crore records, 1 crore checks vs 24)' },
    real_world: {
      type: 'array',
      description: '3 real products or systems that use this idea',
      items: {
        type: 'object',
        properties: { where: { type: 'string', description: 'A product or system the student knows' }, how: { type: 'string', description: 'What it does there, one sentence' } },
        required: ['where', 'how'],
        additionalProperties: false,
      },
    },
    analogy: { type: 'string', description: 'A everyday-life picture of the idea, 2-3 sentences' },
    key_idea: { type: 'string', description: 'The one sentence to remember, plus time complexity' },
    scene: { type: 'string', enum: ['array', 'graph', 'table', 'plot'] },
    plot: {
      type: 'object',
      description: 'Used when scene is plot (maths functions, growth curves, coordinate geometry). Otherwise curves is an empty array.',
      properties: {
        x_label: { type: 'string' },
        y_label: { type: 'string' },
        curves: {
          type: 'array',
          description: '1 to 3 curves to draw/compare. Each has 10-40 points as [x, y] pairs across a sensible x range.',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string' },
              points: { type: 'array', items: { type: 'array', items: { type: 'number' } } },
            },
            required: ['label', 'points'],
            additionalProperties: false,
          },
        },
      },
      required: ['x_label', 'y_label', 'curves'],
      additionalProperties: false,
    },
    graph: {
      type: 'object',
      description: 'Used when scene is graph; otherwise nodes and edges are empty arrays',
      properties: {
        layout: { type: 'string', enum: ['tree', 'circle'], description: 'tree: first node is the root, edges go parent to child' },
        directed: { type: 'boolean' },
        nodes: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, label: { type: 'string' } }, required: ['id', 'label'], additionalProperties: false } },
        edges: { type: 'array', items: { type: 'object', properties: { from: { type: 'string' }, to: { type: 'string' }, label: { type: 'string', description: 'Edge weight or empty string' } }, required: ['from', 'to', 'label'], additionalProperties: false } },
      },
      required: ['layout', 'directed', 'nodes', 'edges'],
      additionalProperties: false,
    },
    columns: { type: 'array', description: 'Column headings when scene is table; otherwise an empty array', items: { type: 'string' } },
    frames: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          values: { type: 'array', description: 'array scene: the whole row after this step (numbers as text). Otherwise empty.', items: { type: 'string' } },
          rows: { type: 'array', description: 'table scene: every row after this step, each row has one text per column. Otherwise empty.', items: { type: 'array', items: { type: 'string' } } },
          marks: { type: 'array', description: 'array: target is the index like "3". graph: target is a node id, or an edge written "from>to". table: target is a row "2" or a cell "2,1" (row,column, from 0).', items: markItem },
          pointers: {
            type: 'array',
            description: 'Named markers such as lo, mid, hi, i, j, head, current. Same target rules as marks.',
            items: { type: 'object', properties: { name: { type: 'string' }, target: { type: 'string' } }, required: ['name', 'target'], additionalProperties: false },
          },
          note: { type: 'string', description: 'What just happened and why, one short sentence' },
        },
        required: ['values', 'rows', 'marks', 'pointers', 'note'],
        additionalProperties: false,
      },
    },
    quiz: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          question: { type: 'string' },
          options: { type: 'array', items: { type: 'string' } },
          answer_index: { type: 'integer' },
          why: { type: 'string' },
          level: { type: 'string', enum: ['basic', 'medium', 'gate'], description: 'Difficulty: basic = concept check, medium = application, gate = exam-level tricky' },
        },
        required: ['question', 'options', 'answer_index', 'why', 'level'],
        additionalProperties: false,
      },
    },
    memory_story: { type: 'string', description: 'A crazy funny or dramatic 3-sentence Hindi/Hinglish story (like a Bollywood scene or a village drama) that makes the core idea permanently unforgettable. Use real Indian situations.' },
    playground: {
      type: 'object',
      description: 'An interactive "what if?" explorer — one slider param that shows the concept complexity live',
      properties: {
        param_label: { type: 'string', description: 'What the slider controls, e.g. "Array size (n)"' },
        param_min: { type: 'integer' },
        param_max: { type: 'integer' },
        param_default: { type: 'integer' },
        naive_growth: { type: 'string', enum: GROWTH_KINDS, description: 'How the naive/brute-force quantity grows with n, e.g. "linear" for linear search' },
        smart_growth: { type: 'string', enum: GROWTH_KINDS, description: 'How this concept\'s quantity grows with n, e.g. "log" for binary search' },
        naive_label: { type: 'string', description: 'What the naive approach is called, e.g. "Linear Search steps"' },
        smart_label: { type: 'string', description: 'What this concept is called, e.g. "Binary Search steps"' },
        insight: { type: 'string', description: 'One sentence that explains the shocking difference at max n, e.g. "1 crore elements mein: Linear = 1 crore steps, Binary = sirf 27 steps!"' },
      },
      required: ['param_label', 'param_min', 'param_max', 'param_default', 'naive_growth', 'smart_growth', 'naive_label', 'smart_label', 'insight'],
      additionalProperties: false,
    },
  },
  required: ['title', 'problem', 'without_it', 'real_world', 'analogy', 'key_idea', 'scene', 'graph', 'plot', 'columns', 'frames', 'quiz', 'memory_story', 'playground'],
  additionalProperties: false,
};

const VISUAL_SYSTEM = `You turn ANY topic — computer science, maths, physics, chemistry, biology, economics, aptitude — into a step-by-step visual lesson for a student preparing for school or competitive exams.
The goal: the student feels they stepped INTO the concept's world and sees, live, why it exists and how it is used in real life — so they never forget it.

Choose the scene that shows the idea best:
- array: searching, sorting, two pointers, stack/queue contents, page-replacement frames (values are text, numbers as digits). 6 to 10 values.
- graph: trees (BST insert/search/traversal), heaps, BFS, DFS, shortest paths, spanning trees. 4 to 12 nodes. For a tree use layout "tree" with the root as the first node and edges parent to child. For other graphs use layout "circle". Set directed correctly. Edge label is the weight or "".
- table: SQL joins and queries, normalization, transactions, OS process tables (CPU scheduling), anything that is naturally rows and columns. 2 to 6 columns, at most 8 rows.
- plot: maths and physics graphs — draw or compare functions on x/y axes (y=x², linear vs exponential growth, a line and a parabola, trig curves, distance-time). 1 to 3 curves, 12 to 40 [x, y] points each, choose an x range that shows the shape clearly. Best for functions, coordinate geometry, growth and any "how y changes with x" idea.
For non-CS subjects, pick the closest scene: plot for functions/graphs/growth (maths, physics); array for number lines, sequences, step-by-step calculations, or stages of a process; graph for cycles, relationships, reaction/food chains, circuits, concept links (chemistry/biology); table for comparisons, formulas, or data. The understanding fields (problem, without_it, real_world, analogy, key_idea, memory_story, playground, quiz) matter MOST and apply to every subject — always fill them richly, whatever the scene.
Unused parts stay empty: graph nodes/edges [] unless scene is graph, plot curves [] unless scene is plot, columns [] unless scene is table, and in each frame values [] unless array, rows [] unless table. For a plot, each frame's note narrates one stage as the curve draws itself; keep values/rows/marks/pointers empty.

Frames: 8 to 24 frames. Each frame is the complete state after one step; frame 1 is the start. Simulate the algorithm exactly and correctly; every frame must follow from the previous one. For a graph, the structure is fixed (nodes and edges do not change between frames); show progress with marks (visited = sorted, current = active, candidate = compare, ruled out = discard, answer path = found). If a structure must change (for example inserting into a BST), include the final structure and mark nodes not yet inserted as discard until they are inserted.
Marks colour things (compare, active, found, swap, sorted, discard). Every target must exist: valid index, node id, edge "from>to" present in edges, or valid row / "row,col".

Teach the WHY first. Students are given questions without being told why they matter, so always start from a real problem (problem), show what breaks without the idea (without_it, with concrete numbers), and name 3 real products or systems the student knows that use it (real_world: e.g. phone contacts search, Google Maps, UPI, Swiggy, railway booking, Instagram feed). Only state uses you are confident are true; stay general ("databases use an index built on this idea") rather than inventing how a specific company implements it.
The analogy must be a real-life picture (a dictionary, a queue at a shop, a deck of cards) that makes the idea feel obvious.
Write in the user's language style: simple Hinglish (Hindi in Roman letters) unless they wrote in English. Keep sentences short.
Quiz: 5 questions — 2 basic (concept samajh), 2 medium (apply karo), 1 gate (exam-level, tricky). Each has a level field: "basic", "medium", or "gate".
memory_story: MUST be 2-3 sentences. Use a dramatic Bollywood/village/cricket/street-food scene that makes the ONE key insight unforgettable. Example for binary search: "Rahul ne library mein 1000 kitaabein dekhi. Seedha beech mein gaaya — 'Nahi, peeche hai' — phir woh beech. 3 jumps mein kitaab mil gayi. Linear search karta toh library band ho jaati."
playground: ONE slider (variable n) that shows a dramatic quantitative difference live. naive_growth and smart_growth each name HOW a quantity grows with n, chosen from: constant, log, sqrt, linear, nlogn, quadratic, cubic, exponential. Examples — linear search: naive linear vs smart log; bubble vs merge sort: quadratic vs nlogn; simple vs compound interest: linear vs exponential; area of square as side grows: quadratic. Pick the two curves that best contrast the concept with its naive alternative, give clear naive_label/smart_label, and set param_max large enough (≥1000, up to 1000000) for a striking gap. If the topic has no efficiency angle, still pick the curve that best shows how its key quantity changes with n.
If the user gives an input, use it; otherwise choose a small example that shows the idea well, including a case where it matters.`;

const TARGET_CELL = /^(\d+)(?:,(\d+))?$/;

// The AI's output is untrusted: check every reference before the browser draws it.
function validVisual(v) {
  if (!Array.isArray(v?.frames) || v.frames.length < 2 || v.frames.length > 40) return false;
  const refs = (f) => [...f.marks, ...f.pointers].map((m) => String(m.target));

  if (v.scene === 'array') {
    return v.frames.every((f) => f.values.length >= 1 && f.values.length <= 16
      && refs(f).every((t) => /^\d+$/.test(t) && Number(t) < f.values.length));
  }
  if (v.scene === 'graph') {
    const g = v.graph;
    if (!g || g.nodes.length < 2 || g.nodes.length > 14) return false;
    const ids = new Set(g.nodes.map((n) => n.id));
    if (ids.size !== g.nodes.length) return false;
    if (!g.edges.every((e) => ids.has(e.from) && ids.has(e.to))) return false;
    const edgeKeys = new Set(g.edges.flatMap((e) => (g.directed ? [`${e.from}>${e.to}`] : [`${e.from}>${e.to}`, `${e.to}>${e.from}`])));
    return v.frames.every((f) => refs(f).every((t) => ids.has(t) || edgeKeys.has(t)));
  }
  if (v.scene === 'table') {
    const cols = v.columns.length;
    if (cols < 1 || cols > 6) return false;
    return v.frames.every((f) => f.rows.length >= 1 && f.rows.length <= 10 && f.rows.every((r) => r.length === cols)
      && refs(f).every((t) => { const m = TARGET_CELL.exec(t); return m && Number(m[1]) < f.rows.length && (m[2] === undefined || Number(m[2]) < cols); }));
  }
  if (v.scene === 'plot') {
    const p = v.plot;
    if (!p || !Array.isArray(p.curves) || p.curves.length < 1 || p.curves.length > 3) return false;
    return p.curves.every((c) => Array.isArray(c.points) && c.points.length >= 2 && c.points.length <= 60
      && c.points.every((pt) => Array.isArray(pt) && pt.length === 2 && Number.isFinite(Number(pt[0])) && Number.isFinite(Number(pt[1]))));
  }
  return false;
}

app.post('/api/assistant/visualize', async (req, res) => {
  const topic = String(req.body?.topic ?? '').trim().slice(0, 200);
  const input = String(req.body?.input ?? '').trim().slice(0, 120);
  if (!topic) return res.status(400).json({ message: 'Write a topic first, for example "Binary Search".' });

  if (process.env.GEMINI_API_KEY) {
    // Gemini has no schema enforcement, so describe the shape, normalize the output, then validate.
    const shape = JSON.stringify({
      title: 'string', problem: 'string', without_it: 'string', real_world: [{ where: 'string', how: 'string' }], analogy: 'string', key_idea: 'string',
      scene: 'array | graph | table | plot',
      graph: { layout: 'tree | circle', directed: false, nodes: [{ id: 'string', label: 'string' }], edges: [{ from: 'node id', to: 'node id', label: 'weight or empty string' }] },
      plot: { x_label: 'string', y_label: 'string', curves: [{ label: 'string', points: [[0, 0]] }] },
      columns: ['table column headings, else empty array'],
      frames: [{ values: ['array scene only, else []'], rows: [['table scene only, else []']], marks: [{ target: 'index | node id | from>to | row | row,col', kind: MARK_KINDS.join(' | ') }], pointers: [{ name: 'string', target: 'same as marks' }], note: 'string' }],
      quiz: [{ question: 'string', options: ['string'], answer_index: 0, why: 'string', level: 'basic | medium | gate' }],
      memory_story: 'string — 2-3 sentence dramatic Hinglish story that makes the idea unforgettable',
      playground: { param_label: 'string', param_min: 2, param_max: 1000000, param_default: 100, naive_growth: GROWTH_KINDS.join(' | '), smart_growth: GROWTH_KINDS.join(' | '), naive_label: 'string', smart_label: 'string', insight: 'string' },
    });
    // Normalize a raw Gemini response: fill missing keys and convert legacy {index} marks.
    function repairGeminiLesson(raw) {
      const g = raw.graph || {};
      const nodes = Array.isArray(g.nodes) ? g.nodes : [];
      const cols = Array.isArray(raw.columns) ? raw.columns : [];
      const pl = raw.plot || {};
      const plotCurves = Array.isArray(pl.curves) ? pl.curves : [];
      const scene = raw.scene || (plotCurves.length > 0 ? 'plot' : nodes.length > 0 ? 'graph' : cols.length > 0 ? 'table' : 'array');
      const fixMark = (m) => ({ target: String(m.target ?? m.index ?? 0), kind: m.kind });
      const fixPtr = (p) => ({ name: String(p.name || ''), target: String(p.target ?? p.index ?? 0) });
      const fixQuiz = (q) => ({ question: q.question || '', options: Array.isArray(q.options) ? q.options : [], answer_index: q.answer_index ?? 0, why: q.why || '', level: q.level || 'basic' });
      const pg = raw.playground || {};
      return {
        ...raw,
        scene,
        graph: { layout: g.layout || 'circle', directed: !!g.directed, nodes, edges: Array.isArray(g.edges) ? g.edges : [] },
        plot: {
          x_label: String(pl.x_label || 'x'),
          y_label: String(pl.y_label || 'y'),
          curves: plotCurves
            .map((c) => ({ label: String(c.label || ''), points: (Array.isArray(c.points) ? c.points : []).map((pt) => [Number(pt?.[0]), Number(pt?.[1])]).filter((pt) => Number.isFinite(pt[0]) && Number.isFinite(pt[1])) }))
            .filter((c) => c.points.length >= 2),
        },
        columns: cols,
        frames: (Array.isArray(raw.frames) ? raw.frames : []).map((f) => ({
          values: (Array.isArray(f.values) ? f.values : []).map(String),
          rows: Array.isArray(f.rows) ? f.rows.map((r) => (Array.isArray(r) ? r.map(String) : [])) : [],
          marks: (Array.isArray(f.marks) ? f.marks : []).map(fixMark),
          pointers: (Array.isArray(f.pointers) ? f.pointers : []).map(fixPtr),
          note: String(f.note || ''),
        })),
        quiz: Array.isArray(raw.quiz) ? raw.quiz.map(fixQuiz) : [],
        memory_story: raw.memory_story || raw.analogy || '',
        playground: {
          param_label: pg.param_label || 'Array size (n)',
          param_min: Number(pg.param_min) || 2,
          param_max: Number(pg.param_max) || 1000000,
          param_default: Number(pg.param_default) || 100,
          naive_growth: GROWTH_KINDS.includes(pg.naive_growth) ? pg.naive_growth : 'linear',
          smart_growth: GROWTH_KINDS.includes(pg.smart_growth) ? pg.smart_growth : 'log',
          naive_label: pg.naive_label || 'Naive approach',
          smart_label: pg.smart_label || 'Smart approach',
          insight: pg.insight || '',
        },
      };
    }
    try {
      for (let attempt = 0; attempt < 2; attempt++) {
        const prompt = `Topic: ${topic}${input ? `\nUse this input: ${input}` : ''}\n\nReturn strict JSON with exactly this shape (all keys required):\n${shape}`;
        let lesson;
        try { lesson = repairGeminiLesson(JSON.parse(await callGemini({ prompt, system: VISUAL_SYSTEM, json: true }))); } catch { continue; }
        if (validVisual(lesson)) return res.json(lesson);
      }
      return res.status(502).json({ message: 'The AI returned a broken lesson twice. Try again or rephrase the topic.' });
    } catch (error) {
      console.error('Gemini visualize error', error);
      return res.status(500).json({ message: error.message || 'Could not build the lesson.' });
    }
  }

  const api = anthropic();
  if (!api) return res.status(503).json({ message: 'Assistant is not configured: set GEMINI_API_KEY or ANTHROPIC_API_KEY in backend/.env.' });

  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await api.messages.create({
        model: MODEL,
        max_tokens: 16000,
        thinking: { type: 'adaptive' },
        output_config: { effort: 'medium', format: { type: 'json_schema', schema: VISUAL_SCHEMA } },
        system: VISUAL_SYSTEM,
        messages: [{ role: 'user', content: `Topic: ${topic}${input ? `\nUse this input: ${input}` : ''}` }],
      });
      if (response.stop_reason === 'refusal') return res.status(422).json({ message: 'The assistant declined this topic.' });
      const text = response.content.find((b) => b.type === 'text')?.text;
      let lesson;
      try { lesson = JSON.parse(text); } catch { continue; }
      if (validVisual(lesson)) return res.json(lesson);
    }
    return res.status(502).json({ message: 'The AI returned a broken lesson twice. Try again or rephrase the topic.' });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) return res.status(401).json({ message: 'The Anthropic API key was rejected. Check ANTHROPIC_API_KEY.' });
    if (error instanceof Anthropic.RateLimitError) return res.status(429).json({ message: 'Rate limited by Anthropic. Wait a moment and try again.' });
    if (error instanceof Anthropic.APIError) return res.status(error.status || 502).json({ message: error.message });
    console.error('visualize error', error);
    return res.status(500).json({ message: 'Could not build the lesson.' });
  }
});

// ---- Exam Compressor: split a syllabus into topics and estimate how many marks each is worth. ----
const TOPICS_SCHEMA = {
  type: 'object',
  properties: {
    topics: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          weight: { type: 'integer', description: '1 (rarely asked) to 10 (a large share of marks)' },
          why: { type: 'string', description: 'Short reason for the weight, e.g. "asked every year, 8-10 marks"' },
        },
        required: ['name', 'weight', 'why'],
        additionalProperties: false,
      },
    },
  },
  required: ['topics'],
  additionalProperties: false,
};

const TOPICS_SYSTEM = `You help a student plan exam preparation. From the exam name and syllabus text, produce 12 to 40 study topics, each small enough to study in 1 to 6 hours.
- weight is your best estimate of that topic's share of marks (1-10), based on the exam's known pattern and how commonly it is asked. These are estimates, not facts: if you do not know the exam's pattern, weigh by how central and how question-friendly the topic is, and say so in "why".
- Keep topic names short and in the syllabus's own words. Do not invent topics that are not in the syllabus. If only an exam name is given, use the standard syllabus you are confident about.
- "why" is in simple Hinglish, one short line.`;

app.post('/api/assistant/exam-topics', async (req, res) => {
  const exam = String(req.body?.exam ?? '').trim().slice(0, 120);
  const syllabus = String(req.body?.syllabus ?? '').trim().slice(0, 12000);
  if (!exam && !syllabus) return res.status(400).json({ message: 'Write the exam name or paste the syllabus.' });

  if (process.env.GEMINI_API_KEY) {
    try {
      const prompt = `Exam: ${exam || '(not given)'}\n\nSyllabus:\n${syllabus || '(not given, use the standard syllabus)'}\n\nReturn JSON: { "topics": [{ "name": string, "weight": number (1-10), "why": string }] }`;
      const text = await callGemini({ prompt, system: TOPICS_SYSTEM, json: true });
      const parsed = JSON.parse(text);
      const topics = (parsed?.topics ?? [])
        .filter((t) => typeof t.name === 'string' && t.name.trim())
        .slice(0, 40)
        .map((t) => ({
          name: t.name.trim().slice(0, 90),
          weight: Math.min(10, Math.max(1, Math.round(Number(t.weight) || 5))),
          why: String(t.why ?? '').slice(0, 140),
        }));
      if (topics.length >= 1) return res.json({ topics });
    } catch (error) {
      console.error('Gemini exam-topics error', error);
      return res.status(500).json({ message: error.message || 'Could not read the syllabus.' });
    }
  }

  const api = anthropic();
  if (!api) return res.status(503).json({ message: 'Assistant is not configured: set GEMINI_API_KEY or ANTHROPIC_API_KEY in backend/.env.' });
  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await api.messages.create({
        model: MODEL,
        max_tokens: 8000,
        thinking: { type: 'adaptive' },
        output_config: { effort: 'medium', format: { type: 'json_schema', schema: TOPICS_SCHEMA } },
        system: TOPICS_SYSTEM,
        messages: [{ role: 'user', content: `Exam: ${exam || '(not given)'}\n\nSyllabus:\n${syllabus || '(not given, use the standard syllabus)'}` }],
      });
      if (response.stop_reason === 'refusal') return res.status(422).json({ message: 'The assistant declined this request.' });
      let parsed;
      try { parsed = JSON.parse(response.content.find((b) => b.type === 'text')?.text); } catch { continue; }
      const topics = (parsed?.topics ?? [])
        .filter((t) => typeof t.name === 'string' && t.name.trim())
        .slice(0, 40)
        .map((t) => ({ name: t.name.trim().slice(0, 90), weight: Math.min(10, Math.max(1, Math.round(Number(t.weight) || 5))), why: String(t.why ?? '').slice(0, 140) }));
      if (topics.length >= 3) return res.json({ topics });
    }
    return res.status(502).json({ message: 'The AI could not split this syllabus. Try pasting more of it, or type your topics yourself.' });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) return res.status(401).json({ message: 'The Anthropic API key was rejected. Check ANTHROPIC_API_KEY.' });
    if (error instanceof Anthropic.RateLimitError) return res.status(429).json({ message: 'Rate limited by Anthropic. Wait a moment and try again.' });
    if (error instanceof Anthropic.APIError) return res.status(error.status || 502).json({ message: error.message });
    console.error('exam-topics error', error);
    return res.status(500).json({ message: 'Could not read the syllabus.' });
  }
});

// ---- Neuro Memory Lock: 500X Permanent Retention Engraver ----
app.post('/api/assistant/neuro-lock', async (req, res) => {
  const topic = String(req.body?.topic ?? '').trim().slice(0, 200);
  if (!topic) return res.status(400).json({ message: 'Topic name is required.' });

  const system = `You are an elite cognitive learning scientist. Your goal is to make a student understand and PERMANENTLY remember a topic FOR LIFE with 500x memory retention. No dry jargon!
Everything must be in energetic, crystal-clear Hinglish. Use vivid real-world analogies, high-stakes disaster scenarios, and memorable mental hooks.
Return strict JSON:
{
  "topic": "${topic}",
  "oneLineHook": "Punchy one-liner memory trigger",
  "crazyStory": "Vivid, dramatic, funny 3-4 sentence real-world analogy (Mental Cinema)",
  "disasterScenario": {
    "title": "Bina iske kya tabahi machegi?",
    "chaos": "Concrete real-world disaster in real companies (Zomato/UPI/Google)",
    "withIt": "Is concept ke aate hi sab smoothly kaise solve hota hai"
  },
  "feynmanAnalogy": "Explain like I'm 10 years old in 2 simple sentences",
  "coreConcept": "The exact technical concept in 1 sentence",
  "memoryTrigger": "The golden mantra/mnemonic to remember forever",
  "quickCheck": {
    "question": "Sharp active recall question",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "ans": 0,
    "why": "Explanation of why this is correct"
  }
}`;

  if (process.env.GEMINI_API_KEY) {
    try {
      const prompt = `Topic to permanently lock in brain: "${topic}". Make it 500x unforgettable!`;
      const text = await callGemini({ prompt, system, json: true });
      const parsed = JSON.parse(text);
      return res.json(parsed);
    } catch (error) {
      console.error('Gemini neuro-lock error', error);
      return res.status(500).json({ message: error.message || 'Could not generate memory lock.' });
    }
  }

  return res.status(503).json({ message: 'API key is missing.' });
});

// ---- Career World: AI Mock Interview Simulator ----
app.post('/api/assistant/mock-interview', async (req, res) => {
  const role = String(req.body?.role ?? 'Full Stack Developer').trim().slice(0, 100);
  const question = String(req.body?.question ?? '').trim().slice(0, 500);
  const answer = String(req.body?.answer ?? '').trim().slice(0, 3000);

  if (!question || !answer) {
    return res.status(400).json({ message: 'Question and answer are required.' });
  }

  const system = `You are a Principal Tech Lead and Hiring Manager conducting a high-stakes technical interview for the role of "${role}".
Evaluate the candidate's answer with extreme precision, practical insight, and encouraging, constructive Hinglish.
Return strict JSON:
{
  "score": number (0 to 100),
  "verdict": "STRONG HIRE" | "HIRE" | "LEANING HIRE" | "NEEDS WORK",
  "strengths": ["Clear strength point 1", "Point 2"],
  "improvements": ["Missing concept 1", "Tip 2"],
  "goldenAnswer": "How a top-tier engineer would answer this question in 3-4 sentences in simple Hinglish",
  "punchline": "One line motivating closing remark"
}`;

  if (process.env.GEMINI_API_KEY) {
    try {
      const prompt = `Role: ${role}\nInterview Question: ${question}\nCandidate Answer: ${answer}`;
      const text = await callGemini({ prompt, system, json: true });
      const parsed = JSON.parse(text);
      return res.json(parsed);
    } catch (error) {
      console.error('Gemini mock-interview error', error);
      return res.status(500).json({ message: error.message || 'Could not evaluate interview answer.' });
    }
  }

  return res.status(503).json({ message: 'API key is missing.' });
});

// ---- Life World: AI Life Coach & Routine Optimizer ----
app.post('/api/assistant/life-coach', async (req, res) => {
  const energy = Number(req.body?.energy ?? 70);
  const mood = String(req.body?.mood ?? 'Energetic').trim().slice(0, 100);
  const note = String(req.body?.note ?? '').trim().slice(0, 1000);

  const system = `You are an elite Bio-Hacking and Human Performance Life Coach.
The user is telling you their current energy level (${energy}%), mood ("${mood}"), and thoughts.
Give them an immediate, deeply empowering, practical action plan in motivating Hinglish.
Return strict JSON:
{
  "quote": "One powerful warrior-mindset quote",
  "batteryVerdict": "Current metabolic and focus state summary",
  "immediateFix": "What to do in the next 10 minutes (drink water, cold wash, walk, box breathing)",
  "recommendedBlocks": [
    { "time": "Next 60 min", "activity": "Specific task to conquer", "why": "Why this matches energy" },
    { "time": "Evening", "activity": "Recovery / learning block", "why": "Keeps momentum" },
    { "time": "Night", "activity": "Sleep hygiene protocol", "why": "Recharges for tomorrow" }
  ],
  "dopamineHack": "One clever trick to avoid phone addiction and keep motivation 100%"
}`;

  if (process.env.GEMINI_API_KEY) {
    try {
      const prompt = `Energy: ${energy}%, Mood: ${mood}, Note: ${note || 'Help me optimize today'}`;
      const text = await callGemini({ prompt, system, json: true });
      const parsed = JSON.parse(text);
      return res.json(parsed);
    } catch (error) {
      console.error('Gemini life-coach error', error);
      return res.status(500).json({ message: error.message || 'Could not generate life plan.' });
    }
  }

  return res.status(503).json({ message: 'API key is missing.' });
});

// Locally binds localhost; in the cloud (Render sets PORT) binds all interfaces so it is reachable.
const HOST = process.env.PORT ? '0.0.0.0' : '127.0.0.1';
app.listen(PORT, HOST, () => console.info(`AURA assistant listening on ${HOST}:${PORT}`));
