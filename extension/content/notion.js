// Notion: hotkey ⌘⇧K (or Ctrl+Shift+K) captures current selection + page title.
(function () {
  const nyv = window.__nyvlo;
  if (!nyv) return;

  function pageTitle() {
    const h = document.querySelector('[placeholder="Untitled"], h1.notion-page-block, .notion-page-block h1');
    return h?.innerText?.trim() || document.title || "Notion page";
  }

  document.addEventListener(
    "keydown",
    (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod || !e.shiftKey || e.key.toLowerCase() !== "k") return;
      const sel = window.getSelection()?.toString().trim();
      if (!sel || sel.length < 10) {
        nyv.showToast("Nyvlo: select some text first, then ⌘⇧K", "err");
        return;
      }
      e.preventDefault();
      const title = pageTitle();
      const key = `notion:${location.pathname}:${sel.slice(0, 80)}`;
      nyv.capture({
        key,
        url: location.href,
        title: `Notion · ${title}`,
        text: sel,
      });
    },
    true,
  );
})();
