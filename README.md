# ORBIT — Spatial Work Command Center

Full-stack MERN workspace for teams to organise tasks in a practical list view and an interactive Three.js spatial radar.

## Structure

```text
orbit-workspace/
├── frontend/               # React + Vite + Tailwind + React Three Fiber
│   └── legacy-prototype/   # Original static prototype (kept as reference)
├── backend/                # Express + MongoDB + JWT REST API
├── package.json            # npm workspaces and shared scripts
└── .gitignore
```

## Quick start

1. Copy `backend/.env.example` to `backend/.env` and set `MONGODB_URI` and `JWT_SECRET`.
2. Run `npm install` at the project root.
3. Run `npm run dev`.
4. Open `http://localhost:5173`.

The client uses local demo data until a user signs in; once authenticated, the API client uses the Express/MongoDB backend.

## Personal assistant (AURA Assistant)

An AI assistant lives inside the app (gold ✦ button, or **Ctrl+K**). It reads your tasks, job queue and profile, and can add tasks, queue jobs, update your profile vault, remember how you work, and open pages. It never submits a job application.

1. Get an API key from console.anthropic.com.
2. Copy `backend/.env.example` to `backend/.env` and set `ANTHROPIC_API_KEY=...`.
3. Run `npm run dev:ai` (frontend + assistant server on `127.0.0.1:5002`). It needs no MongoDB or login.

Your profile, tasks and queue are sent to Anthropic with each message so the assistant can use them. Keep the key in `backend/.env` only; it is git-ignored.
