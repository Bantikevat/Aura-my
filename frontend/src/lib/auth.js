// Local-only sign-in for AURA. The PIN is salted and hashed (SHA-256) and kept in this browser.
// It keeps casual visitors out of the app; it is NOT strong security: the data itself is plain
// browser storage, and anyone with access to this computer's browser profile can read it.
const AUTH_KEY = 'aura-auth';
const SESSION_KEY = 'aura-unlocked';
const LOCK_KEY = 'aura-auth-lock';
const MAX_TRIES = 5;
const LOCK_MS = 30000;

const read = (storage, key) => { try { return storage.getItem(key); } catch { return null; } };
const write = (storage, key, value) => { try { storage.setItem(key, value); } catch { /* storage blocked */ } };

async function hashPin(pin, salt) {
  if (!globalThis.crypto?.subtle) throw new Error('This browser cannot hash the PIN. Open AURA on localhost or https.');
  const bytes = new TextEncoder().encode(`${salt}:${pin}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function loadAuth() {
  try { const parsed = JSON.parse(read(localStorage, AUTH_KEY)); return parsed?.hash ? parsed : null; } catch { return null; }
}
export const isUnlocked = () => read(sessionStorage, SESSION_KEY) === '1';
export const lockSession = () => { try { sessionStorage.removeItem(SESSION_KEY); sessionStorage.removeItem('aura-dimension-entered'); } catch { /* ignore */ } };

export async function createAuth(name, pin) {
  const salt = crypto.randomUUID();
  write(localStorage, AUTH_KEY, JSON.stringify({ name: name.trim(), salt, hash: await hashPin(pin, salt) }));
  write(sessionStorage, SESSION_KEY, '1');
}

// Returns { ok } or { ok: false, message, waitMs? }. Five wrong PINs lock the screen for 30 seconds.
export async function verifyPin(pin) {
  const auth = loadAuth();
  if (!auth) return { ok: false, message: 'No account found.' };
  const lockedUntil = Number(read(localStorage, LOCK_KEY) || 0);
  if (lockedUntil > Date.now()) return { ok: false, waitMs: lockedUntil - Date.now(), message: 'Bahut galat koshish. Thoda ruko.' };

  if ((await hashPin(pin, auth.salt)) === auth.hash) {
    try { localStorage.removeItem(LOCK_KEY); localStorage.removeItem(`${LOCK_KEY}-n`); } catch { /* ignore */ }
    write(sessionStorage, SESSION_KEY, '1');
    return { ok: true };
  }
  const tries = Number(read(localStorage, `${LOCK_KEY}-n`) || 0) + 1;
  if (tries >= MAX_TRIES) {
    write(localStorage, LOCK_KEY, String(Date.now() + LOCK_MS));
    write(localStorage, `${LOCK_KEY}-n`, '0');
    return { ok: false, waitMs: LOCK_MS, message: 'Bahut galat koshish. 30 second ruko.' };
  }
  write(localStorage, `${LOCK_KEY}-n`, String(tries));
  return { ok: false, message: `PIN galat hai. ${MAX_TRIES - tries} koshish baaki.` };
}

// "Forgot PIN": the only way back in is to erase everything saved in this browser for AURA.
export function eraseEverything() {
  try {
    [AUTH_KEY, LOCK_KEY, `${LOCK_KEY}-n`, 'aura-workspace', 'aura-imagine-cache', 'aura-brief-day'].forEach((k) => localStorage.removeItem(k));
    sessionStorage.clear();
  } catch { /* ignore */ }
}
