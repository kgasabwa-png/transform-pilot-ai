// Shared content-script helpers for Nyvlo auto-capture.
// Each adapter (gmail.js, slack.js, …) calls window.__nyvlo.capture(...).
(function () {
  if (window.__nyvlo) return;

  const API_BASE = "https://transform-pilot-ai.lovable.app";
  const ENDPOINT = `${API_BASE}/api/public/extension/capture`;
  const SEEN_KEY = "nyvlo.sent_keys.v1";
  const DEBOUNCE_MS = 1500;

  const seen = new Map(); // key -> timestamp

  async function getToken() {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage({ type: "nyvlo:getToken" }, (r) => {
          if (chrome.runtime.lastError) return resolve(null);
          resolve(r && r.token ? r.token : null);
        });
      } catch {
        resolve(null);
      }
    });
  }

  async function loadSeen() {
    return new Promise((resolve) => {
      try {
        chrome.storage.local.get([SEEN_KEY], (r) => {
          const arr = r?.[SEEN_KEY] || [];
          arr.forEach(([k, t]) => seen.set(k, t));
          resolve();
        });
      } catch {
        resolve();
      }
    });
  }

  function persistSeen() {
    // Keep last 500 keys
    const entries = [...seen.entries()].sort((a, b) => b[1] - a[1]).slice(0, 500);
    seen.clear();
    entries.forEach(([k, t]) => seen.set(k, t));
    try {
      chrome.storage.local.set({ [SEEN_KEY]: entries });
    } catch {}
  }

  function showToast(msg, tone = "ok") {
    let el = document.getElementById("__nyvlo_toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "__nyvlo_toast";
      el.style.cssText =
        "position:fixed;bottom:20px;right:20px;z-index:2147483647;background:#111;color:#fff;padding:10px 14px;border-radius:8px;font:500 13px system-ui,-apple-system,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.25);max-width:320px;line-height:1.35;transition:opacity .2s";
      document.documentElement.appendChild(el);
    }
    el.style.background = tone === "err" ? "#7f1d1d" : "#111";
    el.textContent = msg;
    el.style.opacity = "1";
    clearTimeout(el.__t);
    el.__t = setTimeout(() => (el.style.opacity = "0"), 3000);
  }

  async function capture({ key, url, title, text, note }) {
    if (!text || text.trim().length < 10) return;
    const now = Date.now();
    const last = seen.get(key) || 0;
    if (now - last < 5 * 60_000) return; // 5 min per-key cooldown
    seen.set(key, now);
    persistSeen();

    const token = await getToken();
    if (!token) {
      showToast("Nyvlo: open the extension and paste your token to enable auto-capture.", "err");
      return;
    }

    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          url: url || location.href,
          title: title || document.title,
          selected_text: text.slice(0, 7900),
          note: note || null,
        }),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        showToast(`Nyvlo: capture failed (${res.status})`, "err");
        console.warn("[nyvlo] capture failed", res.status, t);
        return;
      }
      const json = await res.json().catch(() => ({}));
      const n = json?.extracted_count ?? 0;
      if (n > 0) showToast(`Nyvlo captured ${n} promise${n === 1 ? "" : "s"}.`);
      else showToast("Nyvlo: nothing actionable found.");
    } catch (err) {
      showToast("Nyvlo: network error", "err");
      console.warn("[nyvlo] capture error", err);
    }
  }

  function debounce(fn, ms = DEBOUNCE_MS) {
    let h;
    return (...args) => {
      clearTimeout(h);
      h = setTimeout(() => fn(...args), ms);
    };
  }

  function observe(target, cb) {
    const o = new MutationObserver(cb);
    o.observe(target || document.body, { childList: true, subtree: true });
    return o;
  }

  loadSeen();

  window.__nyvlo = { capture, debounce, observe, showToast };
})();
