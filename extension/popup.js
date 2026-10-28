const $ = (id) => document.getElementById(id);

async function render() {
  const { profile, resume, syncedAt } = await chrome.storage.local.get(['profile', 'resume', 'syncedAt']);
  if (!profile) {
    $('name').textContent = 'No profile yet';
    $('meta').textContent = 'Open AURA → Career World, save your profile, keep that tab open once.';
    $('status').innerHTML = '<span class="warn">Vault empty</span>';
    $('fill').disabled = true;
    return;
  }
  const filled = Object.values(profile).filter((v) => String(v || '').trim()).length;
  $('name').textContent = profile.fullName || 'Unnamed profile';
  $('meta').textContent = `${profile.email || 'no email'} · synced ${syncedAt ? new Date(syncedAt).toLocaleString() : 'never'}`;
  $('status').innerHTML = `${filled} vault fields ready<br>`
    + (resume ? `<span class="ok">Resume: ${resume.name}</span>` : '<span class="warn">No resume attached yet</span>');
}

$('fill').onclick = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  $('result').hidden = false;
  $('result').textContent = 'Filling…';
  try {
    await chrome.scripting.executeScript({ target: { tabId: tab.id, allFrames: true }, files: ['filler.js'] });
  } catch (e) {
    $('result').textContent = 'Cannot fill this page (browser pages are blocked). Open the job form tab.';
  }
};

let total = 0;
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type !== 'AURA_FILL_RESULT') return;
  if (msg.stats.error) { $('result').textContent = 'No profile found. Sync from AURA first.'; return; }
  total += msg.stats.filled;
  $('result').textContent = `Filled ${total} fields. Check the highlighted ones on the page.`;
});

$('resume').onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const dataUrl = await new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(file); });
  await chrome.storage.local.set({ resume: { name: file.name, type: file.type, dataUrl } });
  render();
};

render();
