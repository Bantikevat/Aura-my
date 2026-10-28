import { useState } from 'react';
import { motion } from 'framer-motion';
import { registerAccount, loginAccount, logoutAccount, currentUser, pushState, pullState, isAutoSync, setAutoSync } from '../lib/cloud';

export default function CloudSync({ onClose }) {
  const [user, setUser] = useState(currentUser());
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [autosync, setAutosyncState] = useState(isAutoSync());

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError(''); setMsg('');
    try {
      const u = mode === 'register' ? await registerAccount(name.trim(), email.trim(), password) : await loginAccount(email.trim(), password);
      setUser(u);
      // On first sign-in, pull whatever is already in the cloud so devices converge.
      try { const r = await pullState(); if (r?.data) setMsg('Cloud se data restore ho gaya.'); } catch { /* none yet */ }
    } catch (err) {
      setError(err.message.includes('fetch') ? 'Backend server band hai. "npm run dev" ya "npm run backend" chalao.' : err.message);
    } finally { setBusy(false); }
  }

  async function backup() {
    setBusy(true); setError(''); setMsg('');
    try { await pushState(); setMsg(`✓ Backup ho gaya · ${new Date().toLocaleTimeString('en-IN')}`); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  async function restore() {
    setBusy(true); setError(''); setMsg('');
    try { const r = await pullState(); setMsg(r?.data ? '✓ Cloud se restore ho gaya.' : 'Cloud me abhi kuch backup nahi hai.'); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  function logout() { logoutAccount(); setUser(null); setMsg(''); setError(''); }
  function toggleAuto() { const next = !autosync; setAutoSync(next); setAutosyncState(next); if (next) backup(); }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} onClick={(e) => e.stopPropagation()}
        className="glass-strong w-full max-w-md rounded-3xl border border-cyan-500/25 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-white">☁️ Cloud Sync</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-lg px-2 py-1 text-slate-400 hover:bg-white/[0.06] hover:text-white">✕</button>
        </div>
        <p className="mt-1 text-xs text-slate-400">Data ko cloud me safe rakho aur kisi bhi device pe laao. Free hai — ye tumhare local PIN lock se alag hai.</p>

        {!user ? (
          <form onSubmit={submit} className="mt-5 space-y-3">
            {mode === 'register' && <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Naam" className="field w-full" required />}
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="field w-full" required />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (kam se kam 8 akshar)" className="field w-full" required minLength={8} />
            {error && <p className="text-[11px] text-rose">✕ {error}</p>}
            {msg && <p className="text-[11px] text-mint">{msg}</p>}
            <button disabled={busy} className="w-full rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-50">
              {busy ? 'Ruko…' : mode === 'register' ? 'Account banao' : 'Sign in'}
            </button>
            <button type="button" onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); setError(''); }} className="w-full text-center text-xs text-slate-400 hover:text-white">
              {mode === 'register' ? 'Pehle se account hai? Sign in' : 'Naya account banao'}
            </button>
          </form>
        ) : (
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3">
              <div><p className="text-sm font-medium text-white">{user.name}</p><p className="text-[11px] text-slate-500">{user.email}</p></div>
              <button onClick={logout} className="text-xs text-slate-400 hover:text-rose">Logout</button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={backup} disabled={busy} className="rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-50">⬆ Backup now</button>
              <button onClick={restore} disabled={busy} className="rounded-xl border border-white/[0.15] px-4 py-2.5 text-sm font-bold text-slate-200 disabled:opacity-50 hover:bg-white/[0.06]">⬇ Restore</button>
            </div>

            <label className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-slate-300">
              <span>Auto-sync <span className="text-[11px] text-slate-500">(har change cloud me)</span></span>
              <input type="checkbox" checked={autosync} onChange={toggleAuto} className="h-4 w-4 accent-cyan-400" />
            </label>

            {error && <p className="text-[11px] text-rose">✕ {error}</p>}
            {msg && <p className="text-[11px] text-mint">{msg}</p>}
          </div>
        )}
      </motion.div>
    </div>
  );
}
