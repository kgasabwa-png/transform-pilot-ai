import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  Bell,
  Calendar,
  Check,
  Clock,
  Copy,
  FileText,
  Inbox,
  Loader2,
  Mail,
  Plus,
  Send,
  Settings,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Search,
  Trash2,
} from "lucide-react";
import {
  approveAllCompanionActions,
  approveAndSendCompanionEmail,
  ingestCompanionTranscript,
  listCompanionMeetings,
  saveCompanionActionDraft,
  seedCompanionDemo,
  setCompanionActionStatus,
} from "@/lib/nyvlo/companion.functions";
import type {
  ActionStatus,
  ActionType,
  CompanionAction,
  CompanionMeeting,
  CompanionSettings,
  CompanionView,
  DraftState,
  Tone,
} from "@/lib/nyvlo/companion.types";
import { isActionable } from "@/lib/nyvlo/companion.types";

const FONT = "'Hanken Grotesk', sans-serif";
const SERIF = "'Newsreader', serif";
const GREEN = "#1c7a54";
const GREEN_DARK = "#166344";
const CREAM = "#f1ede4";
const SIDEBAR = "#efe9dd";
const INK = "#23211c";
const MUTED = "#7a7567";
const BORDER = "#e7e0d2";

const INITIAL_SETTINGS: CompanionSettings = {
  askBeforeSend: true,
  autoSchedule: true,
  neverWriteCrm: true,
  notesPrivate: true,
  noPublicLinks: true,
};

const STATUS_META: Record<
  CompanionMeeting["status"],
  { label: string; color: string; bg: string }
> = {
  ready: { label: "Ready to cosign", color: GREEN, bg: "#e3efe8" },
  processing: { label: "Processing", color: "#9a7a2c", bg: "#f5ecd6" },
  done: { label: "Done", color: "#6b665b", bg: "#eee8db" },
  snoozed: { label: "Snoozed", color: "#8a8475", bg: "#eee8db" },
};

const ACTION_LABELS: Record<ActionType, string> = {
  email: "Follow-up email",
  reminder: "Reminder",
  crm_note: "CRM / account note",
};

const ACTION_STATUS_LABELS: Record<ActionStatus, string> = {
  suggested: "Suggested",
  edited: "Edited",
  sent: "Sent",
  scheduled: "Scheduled",
  copied: "Copied",
  done: "Done",
  snoozed: "Snoozed",
};

export function CompanionApp() {
  const queryClient = useQueryClient();
  const fetchMeetings = useServerFn(listCompanionMeetings);
  const seedDemo = useServerFn(seedCompanionDemo);
  const setStatus = useServerFn(setCompanionActionStatus);
  const saveDraft = useServerFn(saveCompanionActionDraft);
  const approveAll = useServerFn(approveAllCompanionActions);
  const cosignEmail = useServerFn(approveAndSendCompanionEmail);
  const ingestTranscript = useServerFn(ingestCompanionTranscript);

  const [view, setView] = useState<CompanionView>("today");
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [filter, setFilter] = useState<"ready" | "snoozed" | "done">("ready");
  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const sendingRef = useRef(false);

  const meetingsQuery = useQuery({
    queryKey: ["companion-meetings"],
    queryFn: () => fetchMeetings(),
  });
  const meetings = (meetingsQuery.data ?? []) as CompanionMeeting[];

  useEffect(() => {
    if (meetingsQuery.isLoading || meetings.length > 0) return;
    seedDemo().then((result) => {
      if (result.seeded) queryClient.invalidateQueries({ queryKey: ["companion-meetings"] });
    });
  }, [meetings.length, meetingsQuery.isLoading, queryClient, seedDemo]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2400);
  };

  const statusMutation = useMutation({
    mutationFn: (input: { meetingId: string; actionId: string; status: ActionStatus }) =>
      setStatus({ data: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["companion-meetings"] }),
  });

  const saveMutation = useMutation({
    mutationFn: (input: {
      meetingId: string;
      actionId: string;
      recipient?: string;
      subject?: string;
      body?: string;
      status: ActionStatus;
    }) => saveDraft({ data: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["companion-meetings"] }),
  });

  const selectedMeeting =
    meetings.find((meeting) => meeting.id === selectedMeetingId) ?? meetings[0] ?? null;
  const readyMeetings = meetings.filter((meeting) =>
    ["ready", "processing"].includes(meeting.status),
  );
  const snoozedMeetings = meetings.filter((meeting) => meeting.status === "snoozed");
  const doneMeetings = meetings.filter((meeting) => meeting.status === "done");
  const filteredMeetings =
    filter === "ready" ? readyMeetings : filter === "snoozed" ? snoozedMeetings : doneMeetings;

  const openReview = (meetingId: string) => {
    setSelectedMeetingId(meetingId);
    setDraft(null);
    setView("review");
  };

  const updateAction = async (
    meetingId: string,
    actionId: string,
    status: ActionStatus,
    message: string,
  ) => {
    await statusMutation.mutateAsync({ meetingId, actionId, status });
    showToast(message);
  };

  const handleCosignEmail = async (meetingId: string, action: CompanionAction) => {
    if (sendingRef.current) return;
    sendingRef.current = true;
    try {
      const result = await cosignEmail({ data: { actionId: action.id } });
      if (result.sent) {
        await queryClient.invalidateQueries({ queryKey: ["companion-meetings"] });
        showToast(result.via === "resend" ? "Email sent from your account" : "Email sent");
      } else if (result.reason === "connect-google-or-resend") {
        showToast("Cosigned. Connect Google or Resend to send for real");
      } else {
        showToast("Cosign recorded. Email still needs attention");
      }
    } finally {
      sendingRef.current = false;
    }
  };

  const handleApproveAll = async (meeting: CompanionMeeting) => {
    await approveAll({ data: { meetingId: meeting.id } });
    await queryClient.invalidateQueries({ queryKey: ["companion-meetings"] });
    const emailCount = meeting.actions.filter(
      (action) => action.type === "email" && isActionable(action.status),
    ).length;
    showToast(
      emailCount ? "Non-email actions cosigned. Emails still need cosign" : "All actions cosigned",
    );
  };

  const openEdit = (meeting: CompanionMeeting, action: CompanionAction) => {
    setDraft({
      meetingId: meeting.id,
      actionId: action.id,
      to: action.to ?? "",
      cc: action.cc ?? "",
      subject: action.subject ?? "",
      body: action.body,
      tone: "warm",
      toneVariants: action.toneVariants,
      steps: action.steps,
      warnings: action.warnings,
      evidence: action.evidence,
      account: meeting.account,
      title: meeting.title,
    });
    setView("edit");
  };

  const handleSaveDraft = async () => {
    if (!draft) return;
    await saveMutation.mutateAsync({
      meetingId: draft.meetingId,
      actionId: draft.actionId,
      recipient: draft.to,
      subject: draft.subject,
      body: draft.body,
      status: "edited",
    });
    showToast("Draft saved");
    setView("review");
  };

  const handleSendDraft = async () => {
    if (!draft) return;
    await handleSaveDraft();
    await handleCosignEmail(draft.meetingId, { id: draft.actionId } as CompanionAction);
  };

  return (
    <div style={styles.root}>
      <CompanionGlobalCss />
      <aside style={styles.sidebar}>
        <Logo />
        <button style={styles.newButton} onClick={() => setModalOpen(true)}>
          <Plus size={16} /> New meeting
        </button>
        <nav style={styles.nav}>
          <NavButton
            icon={<Inbox size={17} />}
            label="Today"
            active={["today", "review", "edit"].includes(view)}
            badge={readyMeetings.length}
            onClick={() => setView("today")}
          />
          <NavButton
            icon={<Calendar size={17} />}
            label="Meetings"
            active={view === "meetings"}
            onClick={() => setView("meetings")}
          />
          <NavButton
            icon={<Bell size={17} />}
            label="Reminders"
            active={view === "reminders"}
            onClick={() => setView("reminders")}
          />
          <NavButton
            icon={<SlidersHorizontal size={17} />}
            label="Settings"
            active={view === "settings"}
            onClick={() => setView("settings")}
          />
        </nav>
        <div style={styles.sidebarFooter}>
          <div style={styles.connectedPill}>
            <span style={styles.greenDot} /> Calendar connected
          </div>
          <div style={styles.userRow}>
            <div style={styles.avatar}>A</div>
            <div>
              <div style={{ fontWeight: 700 }}>Account team</div>
              <div style={{ color: "#8a8475", fontSize: 12 }}>Nyvlo companion</div>
            </div>
          </div>
        </div>
      </aside>
      <main style={styles.main}>
        {meetingsQuery.isLoading ? (
          <LoadingView />
        ) : view === "today" ? (
          <TodayView
            meetings={filteredMeetings}
            filter={filter}
            counts={{
              ready: readyMeetings.length,
              snoozed: snoozedMeetings.length,
              done: doneMeetings.length,
            }}
            onFilter={setFilter}
            onOpen={openReview}
          />
        ) : view === "meetings" ? (
          <MeetingsView meetings={meetings} onOpen={openReview} />
        ) : view === "reminders" ? (
          <RemindersView meetings={meetings} onOpen={openReview} onStatus={updateAction} />
        ) : view === "review" && selectedMeeting ? (
          <ReviewView
            meeting={selectedMeeting}
            onBack={() => setView("today")}
            onEdit={openEdit}
            onStatus={updateAction}
            onCosign={handleCosignEmail}
            onApproveAll={handleApproveAll}
          />
        ) : view === "edit" && draft ? (
          <EditDraftView
            draft={draft}
            onBack={() => setView("review")}
            onChange={setDraft}
            onSave={handleSaveDraft}
            onSend={handleSendDraft}
          />
        ) : (
          <SettingsView settings={settings} onChange={setSettings} />
        )}
      </main>
      {modalOpen ? (
        <IngestModal
          onClose={() => setModalOpen(false)}
          ingest={ingestTranscript}
          onCreated={(meetingId) => {
            setModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ["companion-meetings"] });
            setSelectedMeetingId(meetingId);
            setView("review");
            showToast("Meeting extracted from transcript");
          }}
        />
      ) : null}
      {toast ? (
        <div style={styles.toast}>
          <Check size={16} color="#6fb593" /> {toast}
        </div>
      ) : null}
    </div>
  );
}

function TodayView({
  meetings,
  filter,
  counts,
  onFilter,
  onOpen,
}: {
  meetings: CompanionMeeting[];
  filter: "ready" | "snoozed" | "done";
  counts: Record<"ready" | "snoozed" | "done", number>;
  onFilter: (filter: "ready" | "snoozed" | "done") => void;
  onOpen: (id: string) => void;
}) {
  return (
    <ViewWrap>
      <Header
        eyebrow={todayLabel()}
        title="Today"
        subtitle={`${meetings.length} meeting${meetings.length === 1 ? "" : "s"} · ${counts.ready} ready to cosign`}
      />
      <div style={styles.filters}>
        <FilterButton
          label="Ready to cosign"
          count={counts.ready}
          active={filter === "ready"}
          onClick={() => onFilter("ready")}
        />
        <FilterButton
          label="Snoozed"
          count={counts.snoozed}
          active={filter === "snoozed"}
          onClick={() => onFilter("snoozed")}
        />
        <FilterButton
          label="Done"
          count={counts.done}
          active={filter === "done"}
          onClick={() => onFilter("done")}
        />
      </div>
      <div style={styles.twoCol}>
        <section style={{ display: "grid", gap: 12 }}>
          {meetings.length === 0 ? (
            <EmptyCard
              title="You are all caught up"
              body="Nyvlo will surface new work here the moment a call wraps."
            />
          ) : (
            meetings.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting} onOpen={onOpen} />
            ))
          )}
        </section>
        <aside style={{ display: "grid", gap: 14, alignContent: "start" }}>
          <DarkRail
            title="Up next"
            body="Paste a transcript or start the Mac app after your next customer call."
          />
          <StatsRail meetings={meetings} ready={counts.ready} done={counts.done} />
        </aside>
      </div>
    </ViewWrap>
  );
}

function ReviewView({
  meeting,
  onBack,
  onEdit,
  onStatus,
  onCosign,
  onApproveAll,
}: {
  meeting: CompanionMeeting;
  onBack: () => void;
  onEdit: (meeting: CompanionMeeting, action: CompanionAction) => void;
  onStatus: (meetingId: string, actionId: string, status: ActionStatus, message: string) => void;
  onCosign: (meetingId: string, action: CompanionAction) => void;
  onApproveAll: (meeting: CompanionMeeting) => void;
}) {
  const pending = meeting.actions.filter((action) => isActionable(action.status));
  return (
    <ViewWrap>
      <button style={styles.backButton} onClick={onBack}>
        <ArrowLeft size={15} /> Today
      </button>
      <div style={styles.reviewHeader}>
        <div>
          <h1 style={styles.h1}>{meeting.account}</h1>
          <div style={{ color: MUTED, fontFamily: SERIF, fontSize: 16 }}>
            {meeting.title} · {meeting.ended}
          </div>
        </div>
        {pending.length > 0 ? (
          <button style={styles.primaryButton} onClick={() => onApproveAll(meeting)}>
            <Check size={15} /> Cosign all · {pending.length}
          </button>
        ) : (
          <Pill label="Completed" tone="green" />
        )}
      </div>
      <div style={styles.twoCol}>
        <section style={{ display: "grid", gap: 14 }}>
          <div style={styles.summaryCard}>{meeting.summary}</div>
          {meeting.actions.map((action) => (
            <ActionCard
              key={action.id}
              meeting={meeting}
              action={action}
              onEdit={onEdit}
              onStatus={onStatus}
              onCosign={onCosign}
            />
          ))}
        </section>
        <aside style={{ display: "grid", gap: 14, alignContent: "start" }}>
          <InfoCard title="Attendees">
            {meeting.attendees.map((attendee) => (
              <div key={attendee.n} style={styles.attendeeRow}>
                <span style={styles.attendeeAvatar}>{attendee.i}</span>
                <span>
                  <b>{attendee.n}</b>
                  <br />
                  <small>{attendee.r}</small>
                </span>
              </div>
            ))}
          </InfoCard>
          <InfoCard title="Account">
            {meeting.accountMeta.map((row) => (
              <div key={row.label} style={styles.metaRow}>
                <span>{row.label}</span>
                <b>{row.value}</b>
              </div>
            ))}
            <div style={styles.railFoot}>
              <Sparkles size={13} /> Captured by desktop companion
            </div>
          </InfoCard>
        </aside>
      </div>
    </ViewWrap>
  );
}

function ActionCard({
  meeting,
  action,
  onEdit,
  onStatus,
  onCosign,
}: {
  meeting: CompanionMeeting;
  action: CompanionAction;
  onEdit: (meeting: CompanionMeeting, action: CompanionAction) => void;
  onStatus: (meetingId: string, actionId: string, status: ActionStatus, message: string) => void;
  onCosign: (meetingId: string, action: CompanionAction) => void;
}) {
  const actionable = isActionable(action.status);
  return (
    <article style={styles.card}>
      <div style={styles.actionTop}>
        <span style={styles.iconTile}>{actionIcon(action.type)}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 14.5 }}>{ACTION_LABELS[action.type]}</div>
          <div style={{ color: "#8a8475", fontSize: 12.5 }}>
            {action.type === "email" ? `To ${action.to || "recipient needed"}` : action.subLine}
          </div>
        </div>
        {!actionable ? (
          <Pill
            label={ACTION_STATUS_LABELS[action.status]}
            tone={action.status === "snoozed" ? "gray" : "green"}
          />
        ) : null}
      </div>
      <div style={styles.bodyPanel}>{action.body}</div>
      <details style={styles.details}>
        <summary>
          <Search size={13} /> Evidence · {action.evidence.length}
        </summary>
        <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
          {action.evidence.map((item, index) => (
            <blockquote key={`${item.time}-${index}`} style={styles.quote}>
              <b>
                {item.speaker} · {item.time}
              </b>
              <p>"{item.quote}"</p>
            </blockquote>
          ))}
        </div>
      </details>
      {actionable ? (
        <div style={styles.actionButtons}>
          {action.type === "email" ? (
            <>
              <button style={styles.primaryButton} onClick={() => onCosign(meeting.id, action)}>
                <Send size={14} /> Cosign & send
              </button>
              <button style={styles.secondaryButton} onClick={() => onEdit(meeting, action)}>
                Edit
              </button>
            </>
          ) : action.type === "reminder" ? (
            <button
              style={styles.primaryButton}
              onClick={() => onStatus(meeting.id, action.id, "scheduled", "Reminder scheduled")}
            >
              <Check size={14} /> Cosign
            </button>
          ) : (
            <>
              <button
                style={styles.darkButton}
                onClick={() => {
                  navigator.clipboard.writeText(action.body);
                  onStatus(meeting.id, action.id, "copied", "CRM note copied to clipboard");
                }}
              >
                <Copy size={14} /> Copy note
              </button>
              <button
                style={styles.secondaryButton}
                onClick={() => onStatus(meeting.id, action.id, "done", "Marked done")}
              >
                Mark done
              </button>
            </>
          )}
          <button
            style={styles.ghostButton}
            onClick={() =>
              onStatus(meeting.id, action.id, "snoozed", "Snoozed until tomorrow morning")
            }
          >
            Snooze
          </button>
        </div>
      ) : null}
    </article>
  );
}

function EditDraftView({
  draft,
  onBack,
  onChange,
  onSave,
  onSend,
}: {
  draft: DraftState;
  onBack: () => void;
  onChange: (draft: DraftState) => void;
  onSave: () => void;
  onSend: () => void;
}) {
  const setTone = (tone: Tone) => {
    onChange({ ...draft, tone, body: draft.toneVariants?.[tone] ?? draft.body });
  };
  return (
    <ViewWrap narrow={1080}>
      <button style={styles.backButton} onClick={onBack}>
        <ArrowLeft size={15} /> Back to review
      </button>
      <Header eyebrow="Follow-up email" title={draft.account} subtitle={draft.title} />
      <div style={styles.editGrid}>
        <section style={styles.card}>
          <Field label="To" value={draft.to} onChange={(to) => onChange({ ...draft, to })} />
          <Field
            label="Subject"
            value={draft.subject}
            onChange={(subject) => onChange({ ...draft, subject })}
          />
          <textarea
            style={styles.emailTextarea}
            value={draft.body}
            onChange={(event) => onChange({ ...draft, body: event.target.value })}
          />
          <div style={styles.editorFoot}>
            <button style={styles.primaryButton} onClick={onSend}>
              <Send size={14} /> Cosign & send
            </button>
            <button style={styles.secondaryButton} onClick={onSave}>
              Save draft
            </button>
            <span style={styles.shieldNote}>
              <Shield size={13} /> Sent from your account only
            </span>
          </div>
        </section>
        <aside style={{ display: "grid", gap: 14, alignContent: "start" }}>
          <InfoCard title="Tone">
            <div style={styles.toneGrid}>
              {(["warm", "concise", "formal"] as Tone[]).map((tone) => (
                <button
                  key={tone}
                  style={draft.tone === tone ? styles.toneActive : styles.toneButton}
                  onClick={() => setTone(tone)}
                >
                  {tone[0].toUpperCase() + tone.slice(1)}
                </button>
              ))}
            </div>
          </InfoCard>
          {draft.warnings.length ? (
            <InfoCard title="Check before sending">
              {draft.warnings.map((warning) => (
                <p key={warning} style={styles.warning}>
                  {warning}
                </p>
              ))}
            </InfoCard>
          ) : null}
          <InfoCard title="Transcript evidence">
            {draft.evidence.map((item, index) => (
              <blockquote key={index} style={styles.quote}>
                <b>
                  {item.speaker} · {item.time}
                </b>
                <p>"{item.quote}"</p>
              </blockquote>
            ))}
          </InfoCard>
        </aside>
      </div>
    </ViewWrap>
  );
}

function MeetingsView({
  meetings,
  onOpen,
}: {
  meetings: CompanionMeeting[];
  onOpen: (id: string) => void;
}) {
  return (
    <ViewWrap>
      <Header eyebrow="History" title="Meetings" subtitle="Every captured account conversation." />
      <div style={{ display: "grid", gap: 12 }}>
        {meetings.length ? (
          meetings.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} onOpen={onOpen} showStatus />
          ))
        ) : (
          <EmptyCard
            title="No meetings yet"
            body="Add one with New meeting by pasting a transcript."
          />
        )}
      </div>
    </ViewWrap>
  );
}

function RemindersView({
  meetings,
  onOpen,
  onStatus,
}: {
  meetings: CompanionMeeting[];
  onOpen: (id: string) => void;
  onStatus: (meetingId: string, actionId: string, status: ActionStatus, message: string) => void;
}) {
  const reminders = meetings.flatMap((meeting) =>
    meeting.actions
      .filter((action) => action.type === "reminder")
      .map((action) => ({ meeting, action })),
  );
  return (
    <ViewWrap narrow={820}>
      <Header
        eyebrow="Follow-through"
        title="Reminders"
        subtitle={`${reminders.length} reminder${reminders.length === 1 ? "" : "s"}`}
      />
      <div style={{ display: "grid", gap: 12 }}>
        {reminders.map(({ meeting, action }) => (
          <article key={action.id} style={styles.card}>
            <div style={styles.actionTop}>
              <span style={styles.iconTile}>
                <Bell size={16} />
              </span>
              <div style={{ flex: 1 }}>
                <button style={styles.linkButton} onClick={() => onOpen(meeting.id)}>
                  {meeting.account}
                </button>
                <div style={{ color: MUTED, fontSize: 13 }}>{meeting.title}</div>
              </div>
              {!isActionable(action.status) ? (
                <Pill label={ACTION_STATUS_LABELS[action.status]} tone="green" />
              ) : null}
            </div>
            <div style={{ color: "#4a4539", fontFamily: SERIF, fontSize: 16 }}>{action.body}</div>
            {isActionable(action.status) ? (
              <div style={styles.actionButtons}>
                <button
                  style={styles.primaryButton}
                  onClick={() => onStatus(meeting.id, action.id, "scheduled", "Reminder scheduled")}
                >
                  Schedule
                </button>
                <button
                  style={styles.secondaryButton}
                  onClick={() =>
                    onStatus(meeting.id, action.id, "snoozed", "Snoozed until tomorrow morning")
                  }
                >
                  Snooze
                </button>
                <button
                  style={styles.secondaryButton}
                  onClick={() => onStatus(meeting.id, action.id, "done", "Marked done")}
                >
                  Done
                </button>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </ViewWrap>
  );
}

function SettingsView({
  settings,
  onChange,
}: {
  settings: CompanionSettings;
  onChange: (settings: CompanionSettings) => void;
}) {
  return (
    <ViewWrap narrow={760}>
      <Header
        eyebrow="Settings"
        title="You own your accounts and your data"
        subtitle="Nyvlo never sends or writes anything without your approval."
      />
      <InfoCard title="Connected accounts">
        <div style={styles.googleRow}>
          <div style={styles.googleTile}>G</div>
          <div style={{ flex: 1 }}>
            <b>Google</b>
            <p style={styles.mutedP}>Connect to read your calendar and send cosigned emails.</p>
          </div>
          <Link to="/app/settings" style={styles.secondaryButton}>
            Connect Google
          </Link>
        </div>
      </InfoCard>
      <InfoCard title="Capture">
        <div style={styles.metaRow}>
          <span>Nyvlo for Mac</span>
          <Pill label="Not yet available" tone="gray" />
        </div>
        <p style={styles.mutedP}>
          Paste transcripts for now. Desktop capture will connect when packaged.
        </p>
      </InfoCard>
      <InfoCard title="Approval preferences">
        <Toggle
          label="Always ask before sending"
          checked={settings.askBeforeSend}
          onChange={(askBeforeSend) => onChange({ ...settings, askBeforeSend })}
        />
        <Toggle
          label="Auto-schedule cosigned reminders"
          checked={settings.autoSchedule}
          onChange={(autoSchedule) => onChange({ ...settings, autoSchedule })}
        />
        <Toggle
          label="Never write to CRM without review"
          checked={settings.neverWriteCrm}
          onChange={(neverWriteCrm) => onChange({ ...settings, neverWriteCrm })}
        />
      </InfoCard>
      <InfoCard title="Privacy">
        <Toggle
          label="Notes private by default"
          checked={settings.notesPrivate}
          onChange={(notesPrivate) => onChange({ ...settings, notesPrivate })}
        />
        <Toggle
          label="No public share links"
          checked={settings.noPublicLinks}
          onChange={(noPublicLinks) => onChange({ ...settings, noPublicLinks })}
        />
        <button style={styles.dangerButton}>
          <Trash2 size={14} /> Delete transcripts & audio
        </button>
      </InfoCard>
    </ViewWrap>
  );
}

function IngestModal({
  onClose,
  ingest,
  onCreated,
}: {
  onClose: () => void;
  ingest: (args: { data: { title: string; transcript: string } }) => Promise<{
    meetingId: string;
    actionCount: number;
  }>;
  onCreated: (meetingId: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [transcript, setTranscript] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await ingest({ data: { title, transcript } });
      onCreated(result.meetingId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not extract actions");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <h2 style={{ ...styles.h1, marginBottom: 6 }}>New meeting from a transcript</h2>
        <p style={styles.mutedP}>
          Paste a customer call transcript. Nyvlo will only keep actions with transcript evidence.
        </p>
        <Field label="Title" value={title} onChange={setTitle} placeholder="Q3 Renewal Review" />
        <label style={styles.fieldLabel}>Transcript</label>
        <textarea
          style={styles.transcriptBox}
          value={transcript}
          onChange={(event) => setTranscript(event.target.value)}
          placeholder={
            "Maria (11:18): If you can send the rollout plan this week, I can take it to the renewal committee.\nYou (11:19): I will send it by Friday morning."
          }
        />
        {error ? <p style={{ color: "#b0492f", fontSize: 13 }}>{error}</p> : null}
        <div style={styles.modalActions}>
          <button style={styles.secondaryButton} onClick={onClose}>
            Cancel
          </button>
          <button style={styles.primaryButton} disabled={busy} onClick={submit}>
            {busy ? <Loader2 size={14} className="nyvlo-spin" /> : <Sparkles size={14} />} Extract
            actions
          </button>
        </div>
      </div>
    </div>
  );
}

function MeetingCard({
  meeting,
  onOpen,
  showStatus = false,
}: {
  meeting: CompanionMeeting;
  onOpen: (id: string) => void;
  showStatus?: boolean;
}) {
  const pending = meeting.actions.filter((action) => isActionable(action.status)).length;
  return (
    <article style={styles.card}>
      <div style={styles.meetingCardInner}>
        <div style={{ flex: 1 }}>
          <div style={styles.accountLine}>
            {meeting.account}{" "}
            {meeting.urgency === "high" ? (
              <span style={styles.urgency}>{meeting.urgencyLabel}</span>
            ) : null}
          </div>
          <div style={styles.meetingTitle}>{meeting.title}</div>
          <div style={styles.meetingMeta}>
            {meeting.ended} · {pending} action{pending === 1 ? "" : "s"} ready
          </div>
        </div>
        {showStatus ? (
          <Pill
            label={STATUS_META[meeting.status].label}
            tone={meeting.status === "ready" ? "green" : "gray"}
          />
        ) : null}
        <button
          style={meeting.status === "ready" ? styles.primaryButton : styles.secondaryButton}
          onClick={() => onOpen(meeting.id)}
        >
          {meeting.status === "ready" ? "Review" : "Open"}
        </button>
      </div>
    </article>
  );
}

function Header({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <header style={styles.header}>
      <div style={styles.eyebrow}>{eyebrow}</div>
      <h1 style={styles.h1}>{title}</h1>
      <p style={styles.subtitle}>{subtitle}</p>
    </header>
  );
}

function ViewWrap({ children, narrow = 1080 }: { children: React.ReactNode; narrow?: number }) {
  return (
    <div style={{ maxWidth: narrow, margin: "0 auto", padding: "34px 40px 90px" }}>{children}</div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={styles.card}>
      <div style={styles.cardTitle}>{title}</div>
      <div style={{ display: "grid", gap: 11 }}>{children}</div>
    </section>
  );
}

function EmptyCard({ title, body }: { title: string; body: string }) {
  return (
    <div style={styles.empty}>
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}

function Pill({ label, tone }: { label: string; tone: "green" | "gray" }) {
  return <span style={tone === "green" ? styles.greenPill : styles.grayPill}>{label}</span>;
}

function FilterButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button style={active ? styles.filterActive : styles.filterButton} onClick={onClick}>
      {label}
      <span style={styles.countChip}>{count}</span>
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={styles.fieldLabel}>{label}</span>
      <input
        style={styles.input}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button style={styles.toggleRow} onClick={() => onChange(!checked)}>
      <span>{label}</span>
      <span style={{ ...styles.toggleTrack, background: checked ? GREEN : "#d8cfbd" }}>
        <span style={{ ...styles.toggleKnob, left: checked ? 21 : 3 }} />
      </span>
    </button>
  );
}

function Logo() {
  return (
    <div style={styles.logoRow}>
      <div style={styles.logoMark}>
        <Sparkles size={17} />
      </div>
      <div style={styles.logoText}>
        Nyvlo<span>ai</span>
      </div>
    </div>
  );
}

function NavButton({
  icon,
  label,
  active,
  badge,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button style={active ? styles.navActive : styles.navButton} onClick={onClick}>
      {icon}
      <span>{label}</span>
      {badge ? <span style={styles.navBadge}>{badge}</span> : null}
    </button>
  );
}

function DarkRail({ title, body }: { title: string; body: string }) {
  return (
    <section style={styles.darkRail}>
      <div style={{ color: "#b3ac9b", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>
        {title}
      </div>
      <p>{body}</p>
    </section>
  );
}

function StatsRail({
  meetings,
  ready,
  done,
}: {
  meetings: CompanionMeeting[];
  ready: number;
  done: number;
}) {
  return (
    <InfoCard title="This morning">
      <div style={styles.metaRow}>
        <span>Calls captured</span>
        <b>{meetings.length}</b>
      </div>
      <div style={styles.metaRow}>
        <span>Actions ready</span>
        <b style={{ color: GREEN }}>{ready}</b>
      </div>
      <div style={styles.metaRow}>
        <span>Sent & saved</span>
        <b>{done}</b>
      </div>
    </InfoCard>
  );
}

function LoadingView() {
  return (
    <ViewWrap>
      <div style={styles.empty}>
        <Loader2 className="nyvlo-spin" />
        <p>Loading companion workspace</p>
      </div>
    </ViewWrap>
  );
}

function actionIcon(type: ActionType) {
  if (type === "email") return <Mail size={16} />;
  if (type === "reminder") return <Clock size={16} />;
  return <FileText size={16} />;
}

function todayLabel() {
  return new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function CompanionGlobalCss() {
  return (
    <style>{`
      @keyframes nyvloPulseDot { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .4; transform: scale(.82); } }
      @keyframes nyvloFadeUp { from { opacity: 0; transform: translate(-50%, 8px); } to { opacity: 1; transform: translate(-50%, 0); } }
      @keyframes nyvloSpin { to { transform: rotate(360deg); } }
      .nyvlo-spin { animation: nyvloSpin .7s linear infinite; }
      ::selection { background: #cfe6d8; }
    `}</style>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: "flex",
    height: "100vh",
    overflow: "hidden",
    background: CREAM,
    color: INK,
    fontFamily: FONT,
    WebkitFontSmoothing: "antialiased",
  },
  sidebar: {
    width: 250,
    flexShrink: 0,
    background: SIDEBAR,
    borderRight: "1px solid #e4ddcf",
    padding: "18px 14px 14px",
    display: "flex",
    flexDirection: "column",
  },
  main: { flex: 1, overflowY: "auto", position: "relative" },
  logoRow: { display: "flex", alignItems: "center", gap: 10, margin: "2px 4px 22px" },
  logoMark: {
    width: 28,
    height: 28,
    borderRadius: 8,
    background: GREEN,
    color: "#fff",
    display: "grid",
    placeItems: "center",
    boxShadow: "0 2px 8px rgba(28,122,84,.3)",
  },
  logoText: { fontSize: 18, fontWeight: 800, letterSpacing: "-.02em" },
  newButton: {
    border: "none",
    background: GREEN,
    color: "#fff",
    borderRadius: 9,
    padding: "10px 12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontWeight: 800,
    cursor: "pointer",
    marginBottom: 14,
  },
  nav: { display: "grid", gap: 2 },
  navButton: {
    border: "none",
    background: "transparent",
    color: "#6b665b",
    borderRadius: 9,
    padding: "9px 10px",
    display: "flex",
    alignItems: "center",
    gap: 9,
    fontWeight: 700,
    cursor: "pointer",
    textAlign: "left",
  },
  navActive: {
    border: "none",
    background: "#fff",
    color: INK,
    borderRadius: 9,
    padding: "9px 10px",
    display: "flex",
    alignItems: "center",
    gap: 9,
    fontWeight: 800,
    cursor: "pointer",
    textAlign: "left",
    boxShadow: "0 1px 2px rgba(60,50,30,.06)",
  },
  navBadge: {
    marginLeft: "auto",
    background: "#e3efe8",
    color: GREEN,
    borderRadius: 20,
    padding: "2px 7px",
    fontSize: 11,
    fontWeight: 800,
  },
  sidebarFooter: { marginTop: "auto", display: "grid", gap: 12 },
  connectedPill: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    background: "#fff",
    border: "1px solid #e7e0d2",
    borderRadius: 20,
    padding: "7px 10px",
    fontSize: 12,
    color: "#6b665b",
    fontWeight: 700,
  },
  greenDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: GREEN,
    animation: "nyvloPulseDot 1.8s infinite",
  },
  userRow: { display: "flex", gap: 9, alignItems: "center", padding: 8 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: INK,
    color: "#f7f3ea",
    display: "grid",
    placeItems: "center",
    fontWeight: 800,
  },
  header: { marginBottom: 22 },
  eyebrow: {
    fontSize: 12,
    fontWeight: 800,
    color: "#a39c8b",
    letterSpacing: ".08em",
    textTransform: "uppercase",
  },
  h1: {
    margin: "3px 0 0",
    fontSize: 30,
    lineHeight: 1.05,
    fontWeight: 800,
    letterSpacing: "-.025em",
  },
  subtitle: { margin: "6px 0 0", color: MUTED, fontSize: 14.5 },
  filters: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 },
  filterButton: {
    border: "1px solid #e2dbcd",
    background: "#fff",
    color: "#5a5447",
    borderRadius: 20,
    padding: "8px 12px",
    fontWeight: 800,
    cursor: "pointer",
  },
  filterActive: {
    border: "1px solid #23211c",
    background: INK,
    color: "#f7f3ea",
    borderRadius: 20,
    padding: "8px 12px",
    fontWeight: 800,
    cursor: "pointer",
  },
  countChip: {
    marginLeft: 8,
    borderRadius: 20,
    padding: "1px 7px",
    background: "rgba(255,255,255,.22)",
  },
  twoCol: { display: "grid", gridTemplateColumns: "1fr 296px", gap: 28 },
  card: {
    background: "#fff",
    border: `1px solid ${BORDER}`,
    borderRadius: 14,
    padding: "17px 18px",
    boxShadow: "0 1px 2px rgba(60,50,30,.04)",
  },
  meetingCardInner: { display: "flex", alignItems: "center", gap: 14 },
  accountLine: { fontWeight: 800, fontSize: 15.5 },
  urgency: {
    color: "#b0492f",
    background: "#f6e6df",
    borderRadius: 20,
    padding: "2px 8px",
    fontSize: 11.5,
    marginLeft: 8,
  },
  meetingTitle: { marginTop: 3, fontFamily: SERIF, color: "#4a4539", fontSize: 16 },
  meetingMeta: { marginTop: 5, color: "#8a8475", fontSize: 12.5 },
  primaryButton: {
    border: "none",
    background: GREEN,
    color: "#fff",
    borderRadius: 9,
    padding: "10px 14px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    fontWeight: 800,
    cursor: "pointer",
    textDecoration: "none",
  },
  secondaryButton: {
    border: "1px solid #e2dbcd",
    background: "#fff",
    color: "#3a3833",
    borderRadius: 9,
    padding: "9px 13px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    fontWeight: 800,
    cursor: "pointer",
    textDecoration: "none",
  },
  darkButton: {
    border: "none",
    background: INK,
    color: "#fff",
    borderRadius: 9,
    padding: "10px 14px",
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    fontWeight: 800,
    cursor: "pointer",
  },
  ghostButton: {
    border: "none",
    background: "transparent",
    color: "#8a8475",
    padding: "9px 12px",
    fontWeight: 800,
    cursor: "pointer",
    marginLeft: "auto",
  },
  empty: {
    border: `1px dashed ${BORDER}`,
    borderRadius: 14,
    padding: 34,
    textAlign: "center",
    color: MUTED,
    background: "#fff",
  },
  darkRail: { background: INK, color: "#f1ede4", borderRadius: 14, padding: 18 },
  reviewHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  backButton: {
    border: "none",
    background: "transparent",
    color: "#6b665b",
    display: "inline-flex",
    gap: 7,
    alignItems: "center",
    fontWeight: 800,
    cursor: "pointer",
    marginBottom: 16,
  },
  summaryCard: {
    background: "#faf6ed",
    border: "1px solid #ece4d4",
    borderRadius: 14,
    padding: "18px 20px",
    fontFamily: SERIF,
    fontSize: 16.5,
    lineHeight: 1.6,
    color: "#4a4539",
  },
  greenPill: {
    fontSize: 12,
    fontWeight: 800,
    color: GREEN,
    background: "#e3efe8",
    padding: "3px 10px",
    borderRadius: 20,
    whiteSpace: "nowrap",
  },
  grayPill: {
    fontSize: 12,
    fontWeight: 700,
    color: "#8a8475",
    background: "#eee8db",
    padding: "3px 10px",
    borderRadius: 20,
    whiteSpace: "nowrap",
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: ".12em",
    color: "#a39c8b",
    marginBottom: 12,
  },
  attendeeRow: { display: "flex", alignItems: "center", gap: 9, color: "#4a4539" },
  attendeeAvatar: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "#e7e0d2",
    color: "#5a5447",
    display: "grid",
    placeItems: "center",
    fontWeight: 800,
    fontSize: 11,
  },
  metaRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    color: "#7a7567",
    fontSize: 13,
  },
  railFoot: {
    borderTop: "1px solid #efe8da",
    paddingTop: 10,
    color: "#8a8475",
    fontSize: 12,
    display: "flex",
    gap: 6,
    alignItems: "center",
  },
  actionTop: { display: "flex", gap: 12, alignItems: "center", marginBottom: 12 },
  iconTile: {
    width: 32,
    height: 32,
    borderRadius: 9,
    background: "#f0ebe0",
    color: "#6b665b",
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
  },
  bodyPanel: {
    background: "#faf7f0",
    border: "1px solid #efe8da",
    borderRadius: 12,
    padding: 14,
    fontFamily: SERIF,
    whiteSpace: "pre-wrap",
    color: "#3c382f",
    lineHeight: 1.65,
    maxHeight: 180,
    overflow: "hidden",
  },
  details: { marginTop: 12, color: "#6b665b", fontSize: 13 },
  quote: { borderLeft: "2px solid #d8cfbd", margin: 0, paddingLeft: 10, color: "#6b665b" },
  actionButtons: { display: "flex", gap: 8, alignItems: "center", marginTop: 14, flexWrap: "wrap" },
  editGrid: { display: "grid", gridTemplateColumns: "1fr 320px", gap: 28 },
  fieldLabel: {
    color: "#a39c8b",
    fontSize: 11.5,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: ".08em",
  },
  input: {
    background: "#fffdf8",
    border: "1px solid #e2dbcd",
    borderRadius: 11,
    padding: "13px 15px",
    fontSize: 15,
    color: INK,
    outline: "none",
  },
  emailTextarea: {
    minHeight: 380,
    background: "#fffdf8",
    border: "1px solid #e2dbcd",
    borderRadius: 11,
    padding: 15,
    fontFamily: SERIF,
    fontSize: 16,
    lineHeight: 1.7,
    color: "#3c382f",
    width: "100%",
    boxSizing: "border-box",
    resize: "vertical",
    marginTop: 12,
  },
  editorFoot: {
    background: "#faf7f0",
    borderRadius: 12,
    padding: 12,
    display: "flex",
    gap: 9,
    alignItems: "center",
    marginTop: 12,
  },
  shieldNote: {
    marginLeft: "auto",
    color: "#8a8475",
    fontSize: 12,
    display: "flex",
    alignItems: "center",
    gap: 5,
  },
  toneGrid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6 },
  toneButton: {
    border: "1px solid #e2dbcd",
    background: "#fff",
    borderRadius: 9,
    padding: "8px 6px",
    fontWeight: 800,
    cursor: "pointer",
  },
  toneActive: {
    border: `1px solid ${GREEN}`,
    background: "#e3efe8",
    color: "#1c6a48",
    borderRadius: 9,
    padding: "8px 6px",
    fontWeight: 800,
    cursor: "pointer",
  },
  warning: { background: "#f7efda", color: "#73591f", borderRadius: 10, padding: 10, margin: 0 },
  linkButton: {
    border: "none",
    background: "transparent",
    padding: 0,
    color: INK,
    fontWeight: 800,
    cursor: "pointer",
  },
  googleRow: { display: "flex", alignItems: "center", gap: 12 },
  googleTile: {
    width: 34,
    height: 34,
    borderRadius: 10,
    background: "#fffdf8",
    border: "1px solid #e2dbcd",
    display: "grid",
    placeItems: "center",
    fontWeight: 900,
  },
  mutedP: { margin: "4px 0 0", color: MUTED, fontSize: 13.5, lineHeight: 1.5 },
  toggleRow: {
    border: "none",
    background: "transparent",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "7px 0",
    color: INK,
    fontWeight: 700,
    cursor: "pointer",
  },
  toggleTrack: {
    position: "relative",
    width: 42,
    height: 24,
    borderRadius: 20,
    transition: "background .15s",
  },
  toggleKnob: {
    position: "absolute",
    top: 3,
    width: 18,
    height: 18,
    borderRadius: "50%",
    background: "#fff",
    boxShadow: "0 1px 2px rgba(0,0,0,.2)",
    transition: "left .15s",
  },
  dangerButton: {
    border: "1px solid #e7cabf",
    background: "#fff",
    color: "#b0492f",
    borderRadius: 9,
    padding: "9px 13px",
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    fontWeight: 800,
    cursor: "pointer",
    width: "fit-content",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(35,33,28,.28)",
    display: "grid",
    placeItems: "center",
    zIndex: 50,
  },
  modal: {
    width: "min(560px, calc(100vw - 32px))",
    background: "#fffdf8",
    border: "1px solid #e2dbcd",
    borderRadius: 20,
    padding: 24,
    boxShadow: "0 30px 70px -34px rgba(50,40,20,.34)",
  },
  transcriptBox: {
    minHeight: 230,
    width: "100%",
    boxSizing: "border-box",
    background: "#fffdf8",
    border: "1px solid #e2dbcd",
    borderRadius: 11,
    padding: 15,
    fontFamily: SERIF,
    fontSize: 15,
    lineHeight: 1.65,
    resize: "vertical",
    marginTop: 6,
  },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: 9, marginTop: 14 },
  toast: {
    position: "fixed",
    bottom: 28,
    left: "50%",
    transform: "translateX(-50%)",
    background: INK,
    color: "#f7f3ea",
    padding: "12px 20px",
    borderRadius: 11,
    display: "flex",
    alignItems: "center",
    gap: 8,
    zIndex: 70,
    animation: "nyvloFadeUp .2s ease",
  },
};
