import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Bell, Calendar, Check, FileText, Inbox, Mail, Sparkles } from "lucide-react";
import { seedMeetings } from "@/lib/nyvlo/companion-demo";
import type { ActionType, CompanionMeeting } from "@/lib/nyvlo/companion.types";

const FONT = "'Hanken Grotesk', sans-serif";
const SERIF = "'Newsreader', serif";
const GREEN = "#1c7a54";
const CREAM = "#f1ede4";
const SIDEBAR = "#efe9dd";
const INK = "#23211c";
const BORDER = "#e7e0d2";

export const Route = createFileRoute("/try")({
  head: () => ({
    meta: [
      { title: "Try Nyvlo · Companion demo" },
      {
        name: "description",
        content: "Preview Nyvlo, a post-meeting AI chief of staff for customer-success teams.",
      },
    ],
  }),
  component: TryPage,
});

function TryPage() {
  const meetings = seedMeetings();
  const selected = meetings[0];
  const readyCount = meetings.filter((meeting) => meeting.status === "ready").length;
  return (
    <div style={styles.root}>
      <style>{`
        ::selection { background: #cfe6d8; }
        @keyframes nyvloPulseDot { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .4; transform: scale(.82); } }
      `}</style>
      <aside style={styles.sidebar}>
        <Logo />
        <Link to="/auth" style={styles.newButton}>
          Start with real meetings <ArrowRight size={15} />
        </Link>
        <nav style={styles.nav}>
          <NavItem icon={<Inbox size={17} />} label="Today" active badge={readyCount} />
          <NavItem icon={<Calendar size={17} />} label="Meetings" />
          <NavItem icon={<Bell size={17} />} label="Reminders" />
        </nav>
        <div style={styles.sidebarFooter}>
          <div style={styles.connectedPill}>
            <span style={styles.greenDot} /> Demo workspace
          </div>
          <p style={styles.sidebarNote}>
            This is the companion product: calls become grounded actions you cosign.
          </p>
        </div>
      </aside>

      <main style={styles.main}>
        <div style={styles.wrap}>
          <header style={styles.header}>
            <div style={styles.eyebrow}>Thursday, June 25</div>
            <h1 style={styles.h1}>Today</h1>
            <p style={styles.subtitle}>
              {meetings.length} meetings · {readyCount} ready to cosign
            </p>
          </header>

          <section style={styles.filters}>
            <span style={styles.filterActive}>
              Ready to cosign <b>{readyCount}</b>
            </span>
            <span style={styles.filter}>
              Snoozed <b>0</b>
            </span>
            <span style={styles.filter}>
              Done <b>0</b>
            </span>
          </section>

          <div style={styles.grid}>
            <section style={styles.stack}>
              {meetings.map((meeting) => (
                <MeetingCard key={meeting.id} meeting={meeting} />
              ))}
              <ReviewPreview meeting={selected} />
            </section>
            <aside style={styles.rail}>
              <section style={styles.darkRail}>
                <div style={styles.darkLabel}>Up next</div>
                <h3>Customer onboarding review</h3>
                <p>Today · 2:30 PM · with Devon Lee</p>
              </section>
              <section style={styles.card}>
                <div style={styles.cardTitle}>This morning</div>
                <Meta label="Calls captured" value={String(meetings.length)} />
                <Meta label="Actions ready" value="4" green />
                <Meta label="Sent & saved" value="0" />
              </section>
              <section style={styles.card}>
                <div style={styles.cardTitle}>Trust rules</div>
                <TrustLine>Every action shows transcript evidence.</TrustLine>
                <TrustLine>Emails send only after a cosign.</TrustLine>
                <TrustLine>No fake sent states.</TrustLine>
              </section>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

function MeetingCard({ meeting }: { meeting: CompanionMeeting }) {
  const pending = meeting.actions.filter((action) =>
    ["suggested", "edited"].includes(action.status),
  ).length;
  return (
    <article style={styles.card}>
      <div style={styles.meetingRow}>
        <div style={{ flex: 1 }}>
          <div style={styles.accountLine}>
            {meeting.account}
            {meeting.urgency === "high" ? (
              <span style={styles.urgency}>{meeting.urgencyLabel}</span>
            ) : null}
          </div>
          <div style={styles.meetingTitle}>{meeting.title}</div>
          <div style={styles.meetingMeta}>
            {meeting.ended} · {pending} actions ready
          </div>
        </div>
        <button style={styles.primaryButton}>Review</button>
      </div>
    </article>
  );
}

function ReviewPreview({ meeting }: { meeting: CompanionMeeting }) {
  return (
    <section style={styles.review}>
      <div style={styles.reviewTop}>
        <div>
          <div style={styles.eyebrow}>Review</div>
          <h2 style={styles.h2}>{meeting.account}</h2>
          <p style={styles.serifSub}>
            {meeting.title} · {meeting.ended}
          </p>
        </div>
        <button style={styles.primaryButton}>
          <Check size={14} /> Cosign all · 3
        </button>
      </div>
      <div style={styles.summary}>{meeting.summary}</div>
      <div style={styles.actionStack}>
        {meeting.actions.map((action) => (
          <ActionPreview key={action.id} action={action} />
        ))}
      </div>
    </section>
  );
}

function ActionPreview({ action }: { action: CompanionMeeting["actions"][number] }) {
  return (
    <article style={styles.actionCard}>
      <div style={styles.actionTop}>
        <span style={styles.iconTile}>{actionIcon(action.type)}</span>
        <div style={{ flex: 1 }}>
          <div style={styles.actionLabel}>{typeLabel(action.type)}</div>
          <div style={styles.actionSub}>
            {action.type === "email" ? `To ${action.to}` : action.subLine}
          </div>
        </div>
        <span style={styles.pill}>Suggested</span>
      </div>
      <div style={styles.bodyPanel}>{action.body}</div>
      <blockquote style={styles.quote}>
        <b>
          {action.evidence[0]?.speaker} · {action.evidence[0]?.time}
        </b>
        <p>"{action.evidence[0]?.quote}"</p>
      </blockquote>
      <div style={styles.actionButtons}>
        {action.type === "email" ? (
          <button style={styles.primaryButton}>Cosign & send</button>
        ) : action.type === "crm_note" ? (
          <button style={styles.darkButton}>Copy note</button>
        ) : (
          <button style={styles.primaryButton}>Cosign</button>
        )}
        <button style={styles.secondaryButton}>Snooze</button>
      </div>
    </article>
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

function NavItem({
  icon,
  label,
  active,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: number;
}) {
  return (
    <div style={active ? styles.navActive : styles.navItem}>
      {icon}
      <span>{label}</span>
      {badge ? <b style={styles.navBadge}>{badge}</b> : null}
    </div>
  );
}

function Meta({ label, value, green }: { label: string; value: string; green?: boolean }) {
  return (
    <div style={styles.metaRow}>
      <span>{label}</span>
      <b style={green ? { color: GREEN } : undefined}>{value}</b>
    </div>
  );
}

function TrustLine({ children }: { children: React.ReactNode }) {
  return (
    <div style={styles.trustLine}>
      <Check size={13} color={GREEN} /> {children}
    </div>
  );
}

function actionIcon(type: ActionType) {
  if (type === "email") return <Mail size={16} />;
  if (type === "reminder") return <Bell size={16} />;
  return <FileText size={16} />;
}

function typeLabel(type: ActionType) {
  if (type === "email") return "Follow-up email";
  if (type === "reminder") return "Reminder";
  return "CRM / account note";
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: "flex",
    minHeight: "100vh",
    background: CREAM,
    color: INK,
    fontFamily: FONT,
    WebkitFontSmoothing: "antialiased",
  },
  sidebar: {
    width: 250,
    minHeight: "100vh",
    background: SIDEBAR,
    borderRight: "1px solid #e4ddcf",
    padding: "18px 14px 14px",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
  },
  main: { flex: 1, overflow: "auto" },
  wrap: { maxWidth: 1080, margin: "0 auto", padding: "34px 40px 90px" },
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
    textDecoration: "none",
    marginBottom: 14,
  },
  nav: { display: "grid", gap: 2 },
  navItem: {
    color: "#6b665b",
    borderRadius: 9,
    padding: "9px 10px",
    display: "flex",
    alignItems: "center",
    gap: 9,
    fontWeight: 700,
  },
  navActive: {
    background: "#fff",
    color: INK,
    borderRadius: 9,
    padding: "9px 10px",
    display: "flex",
    alignItems: "center",
    gap: 9,
    fontWeight: 800,
    boxShadow: "0 1px 2px rgba(60,50,30,.06)",
  },
  navBadge: {
    marginLeft: "auto",
    background: "#e3efe8",
    color: GREEN,
    borderRadius: 20,
    padding: "2px 7px",
    fontSize: 11,
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
  sidebarNote: { color: "#7a7567", fontSize: 12.5, lineHeight: 1.45, padding: 8 },
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
  h2: {
    margin: "3px 0 0",
    fontSize: 25,
    lineHeight: 1.1,
    fontWeight: 800,
    letterSpacing: "-.025em",
  },
  subtitle: { margin: "6px 0 0", color: "#7a7567", fontSize: 14.5 },
  filters: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 },
  filter: {
    border: "1px solid #e2dbcd",
    background: "#fff",
    color: "#5a5447",
    borderRadius: 20,
    padding: "8px 12px",
    fontWeight: 800,
  },
  filterActive: {
    border: "1px solid #23211c",
    background: INK,
    color: "#f7f3ea",
    borderRadius: 20,
    padding: "8px 12px",
    fontWeight: 800,
  },
  grid: { display: "grid", gridTemplateColumns: "1fr 296px", gap: 28 },
  stack: { display: "grid", gap: 12 },
  rail: { display: "grid", gap: 14, alignContent: "start" },
  card: {
    background: "#fff",
    border: `1px solid ${BORDER}`,
    borderRadius: 14,
    padding: "17px 18px",
    boxShadow: "0 1px 2px rgba(60,50,30,.04)",
  },
  meetingRow: { display: "flex", alignItems: "center", gap: 14 },
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
  },
  secondaryButton: {
    border: "1px solid #e2dbcd",
    background: "#fff",
    color: "#3a3833",
    borderRadius: 9,
    padding: "9px 13px",
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    fontWeight: 800,
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
  },
  darkRail: { background: INK, color: "#f1ede4", borderRadius: 14, padding: 18 },
  darkLabel: {
    color: "#b3ac9b",
    fontSize: 12,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: ".08em",
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: ".12em",
    color: "#a39c8b",
    marginBottom: 12,
  },
  metaRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    color: "#7a7567",
    fontSize: 13,
    marginTop: 10,
  },
  trustLine: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    color: "#6b665b",
    fontSize: 13,
    marginTop: 9,
  },
  review: { marginTop: 18, display: "grid", gap: 14 },
  reviewTop: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 },
  serifSub: { color: "#7a7567", fontFamily: SERIF, fontSize: 16, margin: "5px 0 0" },
  summary: {
    background: "#faf6ed",
    border: "1px solid #ece4d4",
    borderRadius: 14,
    padding: "18px 20px",
    fontFamily: SERIF,
    fontSize: 16.5,
    lineHeight: 1.6,
    color: "#4a4539",
  },
  actionStack: { display: "grid", gap: 12 },
  actionCard: {
    background: "#fff",
    border: `1px solid ${BORDER}`,
    borderRadius: 14,
    padding: "17px 18px",
    boxShadow: "0 1px 2px rgba(60,50,30,.04)",
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
  actionLabel: { fontWeight: 800, fontSize: 14.5 },
  actionSub: { color: "#8a8475", fontSize: 12.5 },
  pill: {
    fontSize: 12,
    fontWeight: 800,
    color: GREEN,
    background: "#e3efe8",
    padding: "3px 10px",
    borderRadius: 20,
    whiteSpace: "nowrap",
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
    maxHeight: 140,
    overflow: "hidden",
  },
  quote: { borderLeft: "2px solid #d8cfbd", margin: "12px 0 0", paddingLeft: 10, color: "#6b665b" },
  actionButtons: { display: "flex", gap: 8, alignItems: "center", marginTop: 14, flexWrap: "wrap" },
};
