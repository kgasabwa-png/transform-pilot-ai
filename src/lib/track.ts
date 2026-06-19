// Lightweight in-house event tracker. Inserts directly into page_events
// using the anon client (RLS allows inserts from anon/authenticated).
import { supabase } from "@/integrations/supabase/client";

const VISITOR_KEY = "nyvlo_vid";
const SESSION_KEY = "nyvlo_sid";

function uuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function getVisitorId(): string {
  if (typeof window === "undefined") return "ssr";
  let v = localStorage.getItem(VISITOR_KEY);
  if (!v) {
    v = uuid();
    localStorage.setItem(VISITOR_KEY, v);
  }
  return v;
}

function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let s = sessionStorage.getItem(SESSION_KEY);
  if (!s) {
    s = uuid();
    sessionStorage.setItem(SESSION_KEY, s);
  }
  return s;
}

function getUtm(): Record<string, string | null> {
  if (typeof window === "undefined") return {};
  const p = new URLSearchParams(window.location.search);
  return {
    utm_source: p.get("utm_source"),
    utm_medium: p.get("utm_medium"),
    utm_campaign: p.get("utm_campaign"),
    utm_term: p.get("utm_term"),
    utm_content: p.get("utm_content"),
  };
}

let lastTracked: { name: string; path: string; t: number } | null = null;

export async function track(
  eventName: string,
  properties: Record<string, unknown> = {}
): Promise<void> {
  if (typeof window === "undefined") return;
  const path = window.location.pathname + window.location.search;
  // Dedupe identical pageviews fired within 500ms (router quirks)
  const now = Date.now();
  if (
    lastTracked &&
    lastTracked.name === eventName &&
    lastTracked.path === path &&
    now - lastTracked.t < 500
  ) {
    return;
  }
  lastTracked = { name: eventName, path, t: now };

  try {
    const { data: sess } = await supabase.auth.getSession();
    await supabase.from("page_events").insert({
      visitor_id: getVisitorId(),
      session_id: getSessionId(),
      user_id: sess.session?.user.id ?? null,
      event_name: eventName,
      path,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
      properties: properties as any,
      ...getUtm(),
    });
  } catch {
    // best effort — don't break the app on analytics failures
  }
}

export function trackPageview() {
  return track("pageview");
}
