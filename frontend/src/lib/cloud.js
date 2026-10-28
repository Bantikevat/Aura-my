// Cloud sync for AURA. Optional and separate from the local PIN lock: sign in with a free
// cloud account (email + password) to back up and restore the whole workspace across devices.
import { api } from './api';
import { useAuraStore } from '../store/useAuraStore';

const AUTOSYNC_KEY = 'aura-autosync';

export const hasToken = () => { try { return !!localStorage.getItem('orbit-token'); } catch { return false; } };
export const currentUser = () => { try { return JSON.parse(localStorage.getItem('orbit-user')); } catch { return null; } };
export const isAutoSync = () => { try { return localStorage.getItem(AUTOSYNC_KEY) === '1'; } catch { return false; } };
export const setAutoSync = (on) => { try { localStorage.setItem(AUTOSYNC_KEY, on ? '1' : '0'); } catch { /* ignore */ } };

function saveSession(res) {
  try { localStorage.setItem('orbit-token', res.token); localStorage.setItem('orbit-user', JSON.stringify(res.user)); } catch { /* ignore */ }
  return res.user;
}

export async function registerAccount(name, email, password) {
  return saveSession(await api('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }));
}
export async function loginAccount(email, password) {
  return saveSession(await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }));
}
export function logoutAccount() {
  try { localStorage.removeItem('orbit-token'); localStorage.removeItem('orbit-user'); } catch { /* ignore */ }
}

// Push the current workspace to the cloud; pull the saved one back.
export const pushState = () => api('/state', { method: 'PUT', body: JSON.stringify({ data: useAuraStore.getState().exportSnapshot() }) });
export async function pullState() {
  const res = await api('/state');
  if (res?.data) useAuraStore.getState().importSnapshot(res.data);
  return res;
}

// Auto-backup: while signed in and auto-sync is on, push a debounced snapshot on every change.
let started = false;
export function startAutoSync() {
  if (started) return;
  started = true;
  let timer;
  useAuraStore.subscribe(() => {
    if (!hasToken() || !isAutoSync()) return;
    clearTimeout(timer);
    timer = setTimeout(() => { pushState().catch(() => { /* offline or expired: next change retries */ }); }, 2500);
  });
}
