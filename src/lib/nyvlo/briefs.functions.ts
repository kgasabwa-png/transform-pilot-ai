import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type CalendarRaw = {
  htmlLink?: string;
  hangoutLink?: string;
  location?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  attendees?: Array<{
    email?: string;
    displayName?: string;
    responseStatus?: string;
    self?: boolean;
  }>;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readCalendarRaw(raw: unknown): CalendarRaw {
  return asRecord(raw) as CalendarRaw;
}

function participantKey(value: string) {
  return value
    .toLowerCase()
    .split("@")[0]
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export const listMeetingBriefs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const now = new Date();
    const horizon = new Date(now.getTime() + 14 * 86400000);

    const [{ data: events, error: eventsError }, { data: sessions }, { data: actions }] =
      await Promise.all([
        context.supabase
          .from("sources")
          .select("id, subject, participants, body, raw, occurred_at")
          .eq("kind", "calendar_event")
          .gte("occurred_at", now.toISOString())
          .lte("occurred_at", horizon.toISOString())
          .order("occurred_at", { ascending: true })
          .limit(8),
        context.supabase
          .from("capture_sessions")
          .select("id, label, summary, notes_md, started_at")
          .not("summary", "is", null)
          .order("started_at", { ascending: false })
          .limit(30),
        context.supabase
          .from("promises")
          .select("id, summary, due_at, owed_to, status")
          .eq("status", "open")
          .order("due_at", { ascending: true, nullsFirst: false })
          .limit(30),
      ]);

    if (eventsError) throw eventsError;

    return (events ?? []).map((event) => {
      const raw = readCalendarRaw(event.raw);
      const participants =
        raw.attendees
          ?.filter((attendee) => !attendee.self)
          .map((attendee) => attendee.displayName || attendee.email || "")
          .filter(Boolean) ??
        event.participants ??
        [];
      const keys = participants.map(participantKey).filter(Boolean);
      const relatedNotes = (sessions ?? [])
        .filter((session) => {
          const text =
            `${session.label ?? ""} ${session.summary ?? ""} ${session.notes_md ?? ""}`.toLowerCase();
          return keys.some((key) => key.length > 2 && text.includes(key));
        })
        .slice(0, 3)
        .map((session) => ({
          id: session.id,
          title: session.label || "Untitled meeting",
          summary: session.summary,
          started_at: session.started_at,
        }));
      const relatedActions = (actions ?? [])
        .filter((action) => {
          const text = `${action.summary} ${action.owed_to ?? ""}`.toLowerCase();
          return keys.some((key) => key.length > 2 && text.includes(key));
        })
        .slice(0, 3)
        .map((action) => ({
          id: action.id,
          summary: action.summary,
          due_at: action.due_at,
          owed_to: action.owed_to,
        }));

      return {
        id: event.id,
        title: event.subject || "Untitled meeting",
        starts_at: raw.start?.dateTime || raw.start?.date || event.occurred_at,
        ends_at: raw.end?.dateTime || raw.end?.date || null,
        location: raw.location || null,
        join_url: raw.hangoutLink || null,
        event_url: raw.htmlLink || null,
        description: event.body || null,
        participants,
        related_notes: relatedNotes,
        related_actions: relatedActions,
      };
    });
  });
