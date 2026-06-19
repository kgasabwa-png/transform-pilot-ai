// Derive a stable mute key from a captured URL so a user can silence
// a single Gmail thread / Slack channel / Notion page / Linear issue,
// rather than the whole site.
export function deriveMuteKey(url: string): { key: string; label: string } {
  if (!url) return { key: "url:unknown", label: "Unknown source" };
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return { key: `url:${url.slice(0, 200)}`, label: url.slice(0, 80) };
  }

  const host = u.hostname.replace(/^www\./, "");

  // Gmail: thread id lives in the hash (#inbox/THREAD_ID) or path
  if (host === "mail.google.com") {
    const m = (u.hash + u.pathname).match(/[#/]([A-Za-z0-9]{16,})/);
    if (m) return { key: `gmail:thread:${m[1]}`, label: `Gmail thread ${m[1].slice(0, 8)}…` };
  }

  // Slack channel
  if (host === "app.slack.com") {
    const m = u.pathname.match(/\/client\/(T[A-Z0-9]+)\/([CDG][A-Z0-9]+)/);
    if (m) return { key: `slack:channel:${m[2]}`, label: `Slack channel ${m[2]}` };
  }

  // Linear issue (e.g. /team/ENG/issue/ENG-123/...)
  if (host === "linear.app") {
    const m = u.pathname.match(/\/issue\/([A-Z0-9]+-\d+)/);
    if (m) return { key: `linear:issue:${m[1]}`, label: `Linear ${m[1]}` };
  }

  // Notion: last hyphenated segment ends in the 32-char page id
  if (host.endsWith("notion.so") || host.endsWith("notion.site")) {
    const seg = u.pathname.split("/").filter(Boolean).pop() ?? "";
    const m = seg.match(/([0-9a-f]{32})$/i);
    if (m) return { key: `notion:page:${m[1]}`, label: `Notion page ${m[1].slice(0, 8)}…` };
  }

  // Generic fallback: host + first path segment
  const seg = u.pathname.split("/").filter(Boolean)[0] ?? "";
  return {
    key: `url:${host}${seg ? "/" + seg : ""}`,
    label: `${host}${seg ? "/" + seg : ""}`,
  };
}
