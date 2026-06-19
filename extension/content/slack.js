// Slack web auto-capture: when the user sends a message, capture it.
(function () {
  const nyv = window.__nyvlo;
  if (!nyv) return;

  // Find this user's name from the workspace switcher (best-effort).
  function selfName() {
    const el = document.querySelector('[data-qa="channel_sidebar_name_you"]') ||
      document.querySelector('[data-qa="current_user_name"]');
    return el?.innerText?.trim() || null;
  }

  function channelLabel() {
    const el = document.querySelector('[data-qa="channel_name"]') ||
      document.querySelector('.p-view_header__channel_title');
    return el?.innerText?.trim() || "Slack";
  }

  function watchComposer() {
    // The composer "Send" button has data-qa="texty_send_button" historically.
    document.addEventListener(
      "click",
      (e) => {
        const t = e.target;
        if (!(t instanceof Element)) return;
        const btn = t.closest('[data-qa="texty_send_button"], button[aria-label*="Send" i]');
        if (!btn) return;
        // Grab the contenteditable composer text BEFORE Slack clears it
        const composer = document.querySelector('[data-qa="message_input"] [contenteditable="true"]') ||
          document.querySelector('.ql-editor');
        const text = composer?.innerText?.trim();
        if (!text || text.length < 10) return;
        const ch = channelLabel();
        const me = selfName();
        const key = `slack:${ch}:${text.slice(0, 80)}:${Date.now()}`;
        nyv.capture({
          key,
          url: location.href,
          title: `Slack · ${ch}`,
          text,
          note: me ? `Sent by ${me} in ${ch}` : `Sent in ${ch}`,
        });
      },
      true,
    );

    // Enter-to-send
    document.addEventListener(
      "keydown",
      (e) => {
        if (e.key !== "Enter" || e.shiftKey) return;
        const composer = document.activeElement;
        if (!composer || !(composer instanceof HTMLElement)) return;
        if (!composer.matches('[contenteditable="true"]')) return;
        const text = composer.innerText?.trim();
        if (!text || text.length < 10) return;
        const ch = channelLabel();
        const key = `slack:${ch}:${text.slice(0, 80)}:${Date.now()}`;
        // Defer slightly so Slack actually submits
        setTimeout(() => {
          nyv.capture({
            key,
            url: location.href,
            title: `Slack · ${ch}`,
            text,
            note: `Sent in ${ch}`,
          });
        }, 150);
      },
      true,
    );
  }

  watchComposer();
})();
