// Alt+Shift+F fills the active tab without opening the popup.
function fillTab(tabId) {
  return chrome.scripting.executeScript({ target: { tabId, allFrames: true }, files: ['filler.js'] }).catch(() => {});
}

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'fill-form') return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) fillTab(tab.id);
});

// The AURA assistant asks to open a job and fill it. Only plain web links are opened.
async function openAndFill(rawUrl) {
  let url;
  try { url = new URL(rawUrl); } catch { return; }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return;

  const tab = await chrome.tabs.create({ url: url.href, active: true });
  const onUpdated = (tabId, info) => {
    if (tabId !== tab.id || info.status !== 'complete') return;
    chrome.tabs.onUpdated.removeListener(onUpdated);
    // Application forms are often drawn by JavaScript after load, so fill twice; the second pass only adds late fields.
    setTimeout(() => fillTab(tab.id), 2000);
    setTimeout(() => fillTab(tab.id), 6000);
  };
  chrome.tabs.onUpdated.addListener(onUpdated);
}

chrome.runtime.onMessage.addListener((message, sender) => {
  // Accept only messages from our own content script running on the AURA tab.
  if (message?.type === 'OPEN_AND_FILL' && sender.tab && typeof message.url === 'string') openAndFill(message.url);
});
