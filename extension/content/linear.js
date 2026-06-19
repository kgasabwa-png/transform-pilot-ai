// Linear: when an issue view opens, capture title + description.
(function () {
  const nyv = window.__nyvlo;
  if (!nyv) return;

  function extractIssue() {
    // Linear uses URLs like /team/XYZ/issue/ABC-123/...
    if (!/\/issue\//.test(location.pathname)) return null;
    const titleEl = document.querySelector('[data-issue-title], h1, [contenteditable="true"][aria-label*="title" i]');
    const descEl = document.querySelector('.ProseMirror, [contenteditable="true"][aria-label*="description" i]');
    const title = titleEl?.innerText?.trim();
    const desc = descEl?.innerText?.trim();
    if (!title || !desc || desc.length < 20) return null;
    const key = `linear:${location.pathname}`;
    return {
      key,
      url: location.href,
      title: `Linear · ${title}`,
      text: `${title}\n\n${desc}`,
    };
  }

  const tryCapture = nyv.debounce(() => {
    const t = extractIssue();
    if (t) nyv.capture(t);
  }, 3000);

  nyv.observe(document.body, tryCapture);
  setTimeout(tryCapture, 3500);
})();
