export type CompanionView = "today" | "meetings" | "reminders" | "review" | "edit" | "settings";
export type MeetingStatus = "ready" | "processing" | "done" | "snoozed";
export type ActionType = "email" | "reminder" | "crm_note";
export type ActionStatus =
  | "suggested"
  | "edited"
  | "sent"
  | "scheduled"
  | "copied"
  | "done"
  | "snoozed";
export type Tone = "warm" | "concise" | "formal";

export interface Evidence {
  speaker: string;
  time: string;
  quote: string;
}

export interface Attendee {
  i: string;
  n: string;
  r: string;
}

export interface AccountMetaRow {
  label: string;
  value: string;
}

export interface NextStep {
  who: string;
  text: string;
}

export interface CompanionAction {
  id: string;
  meetingId: string;
  type: ActionType;
  status: ActionStatus;
  to?: string;
  cc?: string;
  subject?: string;
  subLine?: string;
  body: string;
  evidence: Evidence[];
  toneVariants?: Record<Tone, string> | null;
  steps: NextStep[];
  warnings: string[];
}

export interface CompanionMeeting {
  id: string;
  account: string;
  title: string;
  ended: string;
  status: MeetingStatus;
  urgency: "high" | "normal";
  urgencyLabel: string;
  attendees: Attendee[];
  accountMeta: AccountMetaRow[];
  summary: string;
  actions: CompanionAction[];
}

export interface CompanionSettings {
  askBeforeSend: boolean;
  autoSchedule: boolean;
  neverWriteCrm: boolean;
  notesPrivate: boolean;
  noPublicLinks: boolean;
}

export interface DraftState {
  meetingId: string;
  actionId: string;
  to: string;
  cc: string;
  subject: string;
  body: string;
  tone: Tone;
  toneVariants?: Record<Tone, string> | null;
  steps: NextStep[];
  warnings: string[];
  evidence: Evidence[];
  account: string;
  title: string;
}

export type ApproveAndSendResult = {
  sent: boolean;
  via?: "resend";
  reason?: string;
};

export const RESOLVED_ACTION_STATUSES: ActionStatus[] = [
  "sent",
  "scheduled",
  "copied",
  "done",
  "snoozed",
];

export function isActionable(status: ActionStatus) {
  return !RESOLVED_ACTION_STATUSES.includes(status);
}

export function recomputeMeetingStatus(
  current: MeetingStatus,
  actions: Array<{ status: ActionStatus }>,
): MeetingStatus {
  if (actions.length === 0) return current;
  if (actions.some((action) => isActionable(action.status))) return "ready";
  if (actions.every((action) => action.status === "snoozed")) return "snoozed";
  return "done";
}
