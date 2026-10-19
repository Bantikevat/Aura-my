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
