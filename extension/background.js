// Service worker. Centralizes auth-token lookup for popup + content scripts.
// Reads the `nyvlo-at` cookie set by the Nyvlo web app on every auth change.
const APP_ORIGIN = "https://transform-pilot-ai.lovable.app";

async function getAccessToken() {
  return new Promise((resolve) => {
    chrome.cookies.get({ url: APP_ORIGIN, name: "nyvlo-at" }, (c) => {
      resolve(c && c.value ? c.value : null);
    });
  });
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === "nyvlo:getToken") {
    getAccessToken().then((token) => sendResponse({ token }));
    return true; // async
  }
  if (msg && msg.type === "nyvlo:openSignIn") {
    chrome.tabs.create({ url: `${APP_ORIGIN}/auth` });
    sendResponse({ ok: true });
    return false;
  }
});
