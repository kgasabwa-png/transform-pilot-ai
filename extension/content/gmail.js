// Gmail auto-capture: when a thread view opens, send focused message body.
(function () {
  const nyv = window.__nyvlo;
  if (!nyv) return;

  function extractThread() {
    // Gmail open thread container: role="main" with subject h2.hP
    const subjectEl = document.querySelector("h2.hP");
    const subject = subjectEl?.innerText?.trim();
    if (!subject) return null;

    // Each message in expanded thread has class .adn or .ii.gt; collect visible bodies
    const msgs = Array.from(document.querySelectorAll(".ii.gt .a3s"));
    if (!msgs.length) return null;
    const text = msgs
      .map((m) => (m.innerText || "").trim())
      .filter(Boolean)
      .join("\n\n---\n\n");
    if (text.length < 20) return null;

    // Thread permalink — Gmail URL contains the thread id after "#"
    const url = location.href;
    // Use subject + last 80 chars of text as dedupe key
    const key = `gmail:${subject}:${text.slice(-80)}`;
    return { key, url, title: `Gmail · ${subject}`, text };
  }

  const tryCapture = nyv.debounce(() => {
    const t = extractThread();
    if (t) nyv.capture(t);
  }, 2500);

  // Gmail is a SPA; watch DOM + hashchange
  nyv.observe(document.body, tryCapture);
  window.addEventListener("hashchange", tryCapture);
  setTimeout(tryCapture, 3000);
})();
