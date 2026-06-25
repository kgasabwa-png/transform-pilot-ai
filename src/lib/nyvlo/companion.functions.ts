import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import type {
  ActionStatus,
  ActionType,
  ApproveAndSendResult,
  CompanionAction,
  CompanionMeeting,
  MeetingStatus,
} from "./companion.types";
import { recomputeMeetingStatus } from "./companion.types";
import { seedMeetings } from "./companion-demo";

const EMAIL_RE = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;
type DbClient = SupabaseClient<Database>;

type CompanionActionRow = {
  id: string;
  meeting_id: string;
  type: ActionType;
  status: ActionStatus;
  recipient: string | null;
  cc: string | null;
  subject: string | null;
  sub_line: string | null;
  body: string;
  evidence: unknown;
  tone_variants: unknown;
  steps: unknown;
  warnings: unknown;
  sort_order: number;
  sent_at?: string | null;
};

type CompanionMeetingRow = {
  id: string;
  account: string;
  title: string;
  ended: string;
  status: MeetingStatus;
  urgency: "high" | "normal";
  urgency_label: string | null;
  attendees: unknown;
  account_meta: unknown;
  summary: string;
  sort_order: number;
};

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function mapAction(row: CompanionActionRow): CompanionAction {
  return {
    id: row.id,
    meetingId: row.meeting_id,
    type: row.type,
    status: row.status,
    to: row.recipient ?? undefined,
    cc: row.cc ?? undefined,
    subject: row.subject ?? undefined,
    subLine: row.sub_line ?? undefined,
    body: row.body,
    evidence: asArray(row.evidence),
    toneVariants:
      row.tone_variants && typeof row.tone_variants === "object"
        ? (row.tone_variants as CompanionAction["toneVariants"])
        : null,
    steps: asArray(row.steps),
    warnings: asArray(row.warnings),
  };
}

function mapMeeting(row: CompanionMeetingRow, actions: CompanionActionRow[]): CompanionMeeting {
  return {
    id: row.id,
    account: row.account,
    title: row.title,
    ended: row.ended,
    status: row.status,
    urgency: row.urgency,
    urgencyLabel: row.urgency_label ?? "",
    attendees: asArray(row.attendees),
    accountMeta: asArray(row.account_meta),
    summary: row.summary,
    actions: actions
      .filter((action) => action.meeting_id === row.id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(mapAction),
  };
}

function assertActionStatus(status: string): ActionStatus {
  const allowed: ActionStatus[] = [
    "suggested",
    "edited",
    "sent",
    "scheduled",
    "copied",
    "done",
    "snoozed",
  ];
  if (!allowed.includes(status as ActionStatus)) throw new Error("Invalid action status.");
  return status as ActionStatus;
}

function safeRecipient(value: string | null | undefined) {
  const recipient = (value ?? "").trim();
  if (/[\r\n ]/.test(recipient)) throw new Error("Illegal characters in recipient.");
  if (!EMAIL_RE.test(recipient)) {
    throw new Error(
      "Recipient is not a valid email address. Edit the draft and set a real address before sending.",
    );
  }
  return recipient;
}

async function persistMeetingStatus(db: DbClient, meetingId: string) {
  const actionsResult = await db
    .from("companion_actions" as never)
    .select("status")
    .eq("meeting_id", meetingId);
  if (actionsResult.error) throw actionsResult.error;
  const actionStatuses = (actionsResult.data ?? []) as Array<{ status: ActionStatus }>;
  const meetingResult = await db
    .from("companion_meetings" as never)
    .select("status")
    .eq("id", meetingId)
    .maybeSingle();
  if (meetingResult.error) throw meetingResult.error;
  const current = ((meetingResult.data as { status?: MeetingStatus } | null)?.status ??
    "ready") as MeetingStatus;
  const next = recomputeMeetingStatus(current, actionStatuses);
  await db
    .from("companion_meetings" as never)
    .update({ status: next } as never)
    .eq("id", meetingId);
}

async function ensureWorkspace(db: DbClient, userId: string) {
  const existing = await db
    .from("workspaces" as never)
    .select("id")
    .eq("owner_id", userId)
    .maybeSingle();
  if (existing.error) throw existing.error;
  const row = existing.data as { id: string } | null;
  if (row?.id) return row.id;
  const created = await db
    .from("workspaces" as never)
    .insert({ owner_id: userId, name: "My workspace" } as never)
    .select("id")
    .single();
  if (created.error) throw created.error;
  return (created.data as { id: string }).id;
}

async function sendViaResend(args: { to: string; subject: string; body: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || "Nyvlo <noreply@nyvloai.com>",
      to: args.to,
      subject: args.subject,
      text: args.body,
    }),
  });
  if (!res.ok) throw new Error(`Resend failed: ${res.status} ${await res.text()}`);
  return true;
}

export const listCompanionMeetings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [meetingsResult, actionsResult] = await Promise.all([
      context.supabase
        .from("companion_meetings" as never)
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false }),
      context.supabase
        .from("companion_actions" as never)
        .select("*")
        .order("sort_order", { ascending: true }),
    ]);
    if (meetingsResult.error) throw meetingsResult.error;
    if (actionsResult.error) throw actionsResult.error;
    const meetings = (meetingsResult.data ?? []) as CompanionMeetingRow[];
    const actions = (actionsResult.data ?? []) as CompanionActionRow[];
    return meetings.map((meeting) => mapMeeting(meeting, actions));
  });

export const seedCompanionDemo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const existing = await context.supabase
      .from("companion_meetings" as never)
      .select("id")
      .limit(1);
    if (existing.error) throw existing.error;
    if ((existing.data ?? []).length > 0) return { seeded: false };

    const demo = seedMeetings();
    for (const [index, meeting] of demo.entries()) {
      const created = await context.supabase
        .from("companion_meetings" as never)
        .insert({
          user_id: context.userId,
          account: meeting.account,
          title: meeting.title,
          ended: meeting.ended,
          status: meeting.status,
          urgency: meeting.urgency,
          urgency_label: meeting.urgencyLabel,
          attendees: meeting.attendees,
          account_meta: meeting.accountMeta,
          summary: meeting.summary,
          sort_order: index,
        } as never)
        .select("id")
        .single();
      if (created.error) throw created.error;
      const meetingId = (created.data as { id: string }).id;
      const rows = meeting.actions.map((action, actionIndex) => ({
        meeting_id: meetingId,
        user_id: context.userId,
        type: action.type,
        status: action.status,
        recipient: action.to ?? null,
        cc: action.cc ?? null,
        subject: action.subject ?? null,
        sub_line: action.subLine ?? null,
        body: action.body,
        evidence: action.evidence,
        tone_variants: action.toneVariants ?? null,
        steps: action.steps,
        warnings: action.warnings,
        sort_order: actionIndex,
      }));
      const inserted = await context.supabase
        .from("companion_actions" as never)
        .insert(rows as never);
      if (inserted.error) throw inserted.error;
    }
    return { seeded: true };
  });

export const setCompanionActionStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { meetingId: string; actionId: string; status: string }) => input)
  .handler(async ({ data, context }) => {
    const status = assertActionStatus(data.status);
    const result = await context.supabase
      .from("companion_actions" as never)
      .update({ status } as never)
      .eq("id", data.actionId)
      .eq("meeting_id", data.meetingId);
    if (result.error) throw result.error;
    await persistMeetingStatus(context.supabase, data.meetingId);
    return { ok: true };
  });

export const saveCompanionActionDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      meetingId: string;
      actionId: string;
      recipient?: string;
      subject?: string;
      body?: string;
      status: string;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const status = assertActionStatus(data.status);
    const recipient = data.recipient?.trim() ? safeRecipient(data.recipient) : null;
    const result = await context.supabase
      .from("companion_actions" as never)
      .update({
        recipient,
        subject: data.subject ?? null,
        body: data.body ?? "",
        status,
      } as never)
      .eq("id", data.actionId)
      .eq("meeting_id", data.meetingId);
    if (result.error) throw result.error;
    await persistMeetingStatus(context.supabase, data.meetingId);
    return { ok: true };
  });

export const approveAllCompanionActions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { meetingId: string }) => input)
  .handler(async ({ data, context }) => {
    const result = await context.supabase
      .from("companion_actions" as never)
      .select("id,type,status")
      .eq("meeting_id", data.meetingId);
    if (result.error) throw result.error;
    const actions = (result.data ?? []) as Array<{
      id: string;
      type: ActionType;
      status: ActionStatus;
    }>;
    for (const action of actions) {
      if (action.status !== "suggested" && action.status !== "edited") continue;
      if (action.type === "email") continue;
      const status: ActionStatus = action.type === "reminder" ? "scheduled" : "copied";
      const update = await context.supabase
        .from("companion_actions" as never)
        .update({ status } as never)
        .eq("id", action.id);
      if (update.error) throw update.error;
    }
    await persistMeetingStatus(context.supabase, data.meetingId);
    return { ok: true };
  });

export const ingestCompanionTranscript = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { title?: string; transcript: string }) => input)
  .handler(async ({ data, context }) => {
    if (!data.transcript?.trim()) throw new Error("A non-empty transcript is required.");
    const { runCompanionExtraction } = await import("./companion-extract.server");
    const result = await runCompanionExtraction(context.supabase, context.userId, {
      title: data.title?.trim(),
      transcript: data.transcript,
    });
    return { meetingId: result.meetingId, actionCount: result.actionCount };
  });

export const approveAndSendCompanionEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { actionId: string }) => input)
  .handler(async ({ data, context }): Promise<ApproveAndSendResult> => {
    const actionResult = await context.supabase
      .from("companion_actions" as never)
      .select("id,type,status,sent_at,recipient,subject,body")
      .eq("id", data.actionId)
      .maybeSingle();
    if (actionResult.error) throw actionResult.error;
    const action = actionResult.data as {
      id: string;
      type: ActionType;
      sent_at: string | null;
      recipient: string | null;
      subject: string | null;
      body: string | null;
    } | null;
    if (!action) return { sent: false, reason: "action-not-found" };
    if (action.type !== "email") return { sent: false, reason: "not-an-email" };
    if (action.sent_at) return { sent: false, reason: "already-sent" };

    const recipient = safeRecipient(action.recipient);
    const approvedVersion = {
      recipient,
      subject: action.subject ?? "",
      body: action.body ?? "",
    };
    const workspaceId = await ensureWorkspace(context.supabase, context.userId);
    const approval = await context.supabase.from("approval_record" as never).insert({
      user_id: context.userId,
      workspace_id: workspaceId,
      action_id: data.actionId,
      approved_version: approvedVersion,
    } as never);
    if (approval.error) throw approval.error;

    const gate = await context.supabase
      .from("approval_record" as never)
      .select("id")
      .eq("action_id", data.actionId)
      .eq("user_id", context.userId)
      .limit(1);
    if (gate.error) throw gate.error;
    if ((gate.data ?? []).length === 0) return { sent: false, reason: "approval-not-recorded" };

    if (!process.env.RESEND_API_KEY) {
      return { sent: false, reason: "connect-google-or-resend" };
    }

    const claim = await context.supabase
      .from("companion_actions" as never)
      .update({ sent_at: new Date().toISOString() } as never)
      .eq("id", data.actionId)
      .is("sent_at", null)
      .select("id");
    if (claim.error) throw claim.error;
    if ((claim.data ?? []).length === 0) return { sent: false, reason: "already-sent" };

    try {
      await sendViaResend({
        to: recipient,
        subject: action.subject ?? "",
        body: action.body ?? "",
      });
      const sent = await context.supabase
        .from("companion_actions" as never)
        .update({ status: "sent" } as never)
        .eq("id", data.actionId);
      if (sent.error) throw sent.error;
      return { sent: true, via: "resend" };
    } catch (error) {
      await context.supabase
        .from("companion_actions" as never)
        .update({ sent_at: null } as never)
        .eq("id", data.actionId);
      throw error;
    }
  });
