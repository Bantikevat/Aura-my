import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createAuth, eraseEverything, isUnlocked, loadAuth, verifyPin } from '../lib/auth';

function Rings() {
  return <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
    <div className="absolute h-[640px] w-[640px] rounded-full bg-[radial-gradient(circle,rgba(232,200,114,0.16),transparent_65%)]" />
    {[260, 380, 520].map((size, i) => <motion.div key={size} className="absolute rounded-full border border-[rgba(232,200,114,0.22)]"
      style={{ width: size, height: size, borderTopColor: 'rgba(246,227,161,0.9)' }}
      animate={{ rotate: i % 2 ? -360 : 360 }} transition={{ duration: 28 + i * 14, repeat: Infinity, ease: 'linear' }} />)}
  </div>;
}

export default function LoginGate({ children }) {
  const [unlocked, setUnlocked] = useState(isUnlocked);
  const [auth, setAuth] = useState(loadAuth);
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [waitMs, setWaitMs] = useState(0);
  const [forgot, setForgot] = useState(false);

  useEffect(() => {
    if (waitMs <= 0) return undefined;
    const timer = setInterval(() => setWaitMs((w) => Math.max(0, w - 1000)), 1000);
    return () => clearInterval(timer);
  }, [waitMs]);

  useEffect(() => {
    const onLock = () => { setUnlocked(false); setPin(''); };
    window.addEventListener('aura-lock', onLock);
    return () => window.removeEventListener('aura-lock', onLock);
  }, []);

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (busy || waitMs > 0) return;
    setBusy(true);
    try {
      if (!auth) {
        if (!name.trim()) return setError('Apna naam likho.');
        if (!/^\d{4,8}$/.test(pin)) return setError('PIN 4 se 8 ank ka hona chahiye.');
        if (pin !== pin2) return setError('Dono PIN alag hain.');
        await createAuth(name, pin);
        setAuth(loadAuth());
        setUnlocked(true);
      } else {
        const result = await verifyPin(pin);
        if (result.ok) setUnlocked(true);
        else { setError(result.message); setWaitMs(result.waitMs || 0); setPin(''); }
      }
    } catch (e) {
      setError(e.message);
    } finally { setBusy(false); }
  }

  function startOver() {
    if (!window.confirm('Is browser mein AURA ka SAARA data (tasks, jobs, exam plan, profile, PIN) hamesha ke liye mit jayega. Pakka?')) return;
    eraseEverything();
    setAuth(null); setForgot(false); setPin(''); setPin2(''); setName('');
  }

  return <>
    <AnimatePresence mode="wait">
      {!unlocked && <motion.div key="gate" className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-[#050508] p-4"
        initial={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.08 }} transition={{ duration: 0.7, ease: 'easeIn' }}>
        <Rings />
        <motion.form onSubmit={submit} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
          className="relative z-10 w-full max-w-sm text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.4em] text-[#a89a78]">{auth ? 'Welcome back' : 'Nayi duniya'}</p>
          <h1 className="font-luxe text-gold mt-3 text-7xl font-semibold tracking-[0.12em]">AURA</h1>
          <p className="mt-3 text-sm text-slate-400">{auth ? <>Namaste, <span className="text-white">{auth.name}</span>. PIN daalo aur andar chalo.</> : 'Apni duniya banao. Naam aur ek PIN chuno.'}</p>

          <div className="mt-8 space-y-3 text-left">
            {!auth && <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Aapka naam" autoFocus className="field text-center" maxLength={40} />}
            <input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))} type="password" inputMode="numeric" autoComplete="off"
              placeholder={auth ? 'PIN' : 'PIN (4-8 ank)'} autoFocus={!!auth} disabled={waitMs > 0} className="field text-center tracking-[0.5em]" />
            {!auth && <input value={pin2} onChange={(e) => setPin2(e.target.value.replace(/\D/g, '').slice(0, 8))} type="password" inputMode="numeric" autoComplete="off" placeholder="PIN dobara" className="field text-center tracking-[0.5em]" />}
          </div>

          {(error || waitMs > 0) && <p className="mt-3 text-xs text-rose">{error}{waitMs > 0 && ` (${Math.ceil(waitMs / 1000)}s)`}</p>}

          <button disabled={busy || waitMs > 0 || !pin} className="mt-6 w-full rounded-2xl py-3.5 text-sm font-bold tracking-wide text-[#1a1405] shadow-[0_10px_40px_rgba(232,200,114,0.35)] transition hover:scale-[1.02] disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg,#f6e3a1,#e8c872 50%,#b8923a)' }}>
            {auth ? 'Andar chalo' : 'Meri duniya banao'}
          </button>

          {!auth && <p className="mt-4 text-[11px] leading-relaxed text-slate-500">Ye PIN sirf is computer ke browser mein rehta hai (hash karke). Ye casual logon ko door rakhta hai, bank jaisi suraksha nahi hai.</p>}
          {auth && <div className="mt-5 text-[11px] text-slate-500">
            {!forgot ? <button type="button" onClick={() => setForgot(true)} className="underline hover:text-slate-300">PIN bhool gaye?</button>
              : <div><p>PIN wapas nahi aa sakta. Sirf poora data mitakar naye sire se shuru kar sakte ho.</p><button type="button" onClick={startOver} className="mt-2 text-rose underline">Sab mitao aur dobara shuru karo</button></div>}
          </div>}
        </motion.form>
      </motion.div>}
    </AnimatePresence>
    {unlocked && children}
  </>;
}
