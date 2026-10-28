// Runs only on the AURA app tab. Copies the saved career profile into extension storage
// so the form filler can use it on any job site, and relays "open this job and fill it" requests
// from the AURA assistant to the extension.
(function () {
  const KEY = 'aura-workspace';
  let last = '';

  function push() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw || raw === last) return;
      const profile = JSON.parse(raw)?.state?.careerProfile;
      if (!profile) return;
      last = raw;
      chrome.storage.local.set({ profile, syncedAt: Date.now() });
    } catch (_) { /* storage unavailable or malformed: ignore */ }
  }

  // Only the AURA page itself may ask (same window, same origin); the background script re-checks the URL.
  window.addEventListener('message', (event) => {
    if (event.source !== window || event.origin !== location.origin) return;
    const data = event.data;
    if (data?.source !== 'aura-app' || data.type !== 'AURA_OPEN_AND_FILL' || typeof data.url !== 'string') return;
    try { chrome.runtime.sendMessage({ type: 'OPEN_AND_FILL', url: data.url }); } catch (_) { /* extension reloaded: ignore */ }
  });

  // Lets the AURA page show "extension connected" without any extra permissions.
  document.documentElement.dataset.auraExtension = '1';

  push();
  setInterval(push, 1500);
  window.addEventListener('storage', push);
})();
