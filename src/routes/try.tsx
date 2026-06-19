import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, Sparkles, Inbox, Clock, BookMarked, Check, X, ChevronDown, Mail, CalendarDays, StickyNote, PlayCircle } from "lucide-react";

export const Route = createFileRoute("/try")({
  head: () => ({
    meta: [
      { title: "Try Nyvlo · Live demo" },
      { name: "description", content: "Explore a fully populated Nyvlo workspace — no signup required." },
      { property: "og:title", content: "Try Nyvlo · Live demo" },
      { property: "og:description", content: "Explore a fully populated Nyvlo workspace — no signup required." },
    ],
  }),
  component: TryPage,
});

type DemoPromise = {
  id: string;
  summary: string;
  owed_to: string | null;
  channel: "email" | "meeting" | "note";
  due_at: string; // ISO
  confidence: number;
  evidence_snippet: string;
  draft_reply?: string;
};

const now = () => new Date();
const inHours = (h: number) => new Date(Date.now() + h * 3600_000).toISOString();
const daysAgo = (d: number) => new Date(Date.now() - d * 86400_000).toISOString();

const DEMO: DemoPromise[] = [
  {
    id: "1",
    summary: "Send Q3 forecast to Priya",
    owed_to: "Priya Shah",
    channel: "email",
    due_at: inHours(-3),
    confidence: 0.94,
    evidence_snippet: "I'll have the updated forecast over to you by Thursday EOD.",
    draft_reply: "Hi Priya — sending the Q3 forecast now. Two callouts: pipeline is up 14% QoQ, and the EU segment is the swing factor. Happy to walk through tomorrow.",
  },
  {
    id: "2",
    summary: "Reply to Marcus with revised SOW",
    owed_to: "Marcus Lee",
    channel: "email",
    due_at: inHours(6),
    confidence: 0.88,
    evidence_snippet: "Let me revise the SOW and circle back later today.",
    draft_reply: "Hey Marcus — revised SOW attached. Tightened scope on Phase 2 and pulled in the milestone dates we discussed.",
  },
  {
    id: "3",
    summary: "Share Figma file with design team",
    owed_to: "Design team",
    channel: "meeting",
    due_at: inHours(22),
    confidence: 0.81,
    evidence_snippet: "I'll drop the Figma link in the channel after this call.",
  },
  {
    id: "4",
    summary: "Intro Sara to the recruiter at Linear",
    owed_to: "Sara Chen",
    channel: "email",
    due_at: inHours(48),
    confidence: 0.76,
    evidence_snippet: "Happy to make the intro — let me ping them this week.",
  },
  {
    id: "5",
    summary: "Send refund for order #4821",
    owed_to: "support@acme.co",
    channel: "email",
    due_at: inHours(72),
    confidence: 0.92,
    evidence_snippet: "We'll process that refund within 3 business days.",
  },
];

function TryPage() {
  const attention = useMemo(() => DEMO.filter((p) => new Date(p.due_at).getTime() < Date.now() + 86400_000), []);
  const upcoming = DEMO.slice(0, 5);
  const stats = { open: DEMO.length, kept: 47, missed: 3, reliability: 0.94 };

  return (
    <div className="min-h-dvh bg-background">
      {/* Demo banner */}
      <div className="sticky top-0 z-30 border-b border-border bg-foreground text-background">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-2.5 text-[12.5px]">
          <div className="flex items-center gap-2">
            <PlayCircle className="h-4 w-4" />
            <span className="font-medium">You're in the live demo.</span>
            <span className="hidden text-background/70 sm:inline">Sample data, no account needed.</span>
          </div>
          <Link
            to="/auth"
            className="inline-flex items-center gap-1 rounded-md bg-background px-2.5 py-1 text-[12px] font-medium text-foreground hover:opacity-90"
          >
            Get the real thing <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1400px]">
        {/* Sidebar */}
        <aside className="sticky top-[42px] hidden h-[calc(100dvh-42px)] w-[244px] shrink-0 flex-col border-r border-border/80 bg-secondary px-4 py-6 md:flex">
          <Link to="/" className="mb-7 flex items-center gap-2 px-2">
            <img
              src="/__l5e/assets-v1/6211f021-75b1-484a-8d96-f59fda81e71b/nyvlo-logo-transparent.png"
              alt="Nyvlo"
              className="h-14 w-auto shrink-0"
            />
          </Link>
          <nav className="flex flex-col gap-0.5">
            <DemoNav icon={Sparkles} label="Today" active />
            <DemoNav icon={Inbox} label="Promises" />
            <DemoNav icon={Clock} label="Memory" />
            <DemoNav icon={BookMarked} label="Command Center" />
          </nav>
          <div className="mt-auto rounded-lg border border-border bg-background/40 p-3 text-[12px] text-muted-foreground">
            This sidebar is interactive in the real app.
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1 px-5 py-8 md:px-10 md:py-12">
          <header className="mb-8">
            <h1 className="text-[28px] font-semibold tracking-tight">Hi Alex.</h1>
            <p className="mt-1 text-[14px] text-muted-foreground">Here's what Nyvlo caught for you.</p>
          </header>

          <section className="mb-8 grid gap-4 md:grid-cols-3">
            <StatTile label="Needs attention" value={String(attention.length)} hint="overdue + today" />
            <StatTile label="Open promises" value={String(stats.open)} hint="across the inbox" />
            <StatTile label="Reliability" value={`${Math.round(stats.reliability * 100)}%`} hint={`${stats.kept} kept · ${stats.missed} missed`} />
          </section>

          <section className="mb-10">
            <SectionHeader title="Things needing attention" />
            <div className="flex flex-col gap-2">
              {attention.map((p) => <DemoRow key={p.id} item={p} />)}
            </div>
          </section>

          <section className="mb-12">
            <SectionHeader title="Coming up" />
            <div className="flex flex-col gap-2">
              {upcoming.map((p) => <DemoRow key={p.id} item={p} />)}
            </div>
          </section>

          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-[15px] font-medium">Ready to try with your real inbox?</div>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  Connect Google in 30 seconds. Read-only access. You can disconnect any time.
                </p>
              </div>
              <Link
                to="/auth"
                className="inline-flex items-center gap-1 rounded-md bg-foreground px-3.5 py-2 text-[13px] font-medium text-background hover:opacity-90"
              >
                Get started <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function DemoNav({ icon: Icon, label, active }: { icon: any; label: string; active?: boolean }) {
  return (
    <div
      className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13.5px] ${
        active ? "bg-background text-foreground" : "text-muted-foreground"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </div>
  );
}

function StatTile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 text-[36px] font-semibold leading-none tracking-tight">{value}</div>
      <div className="mt-2 text-[12px] text-muted-foreground">{hint}</div>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="mb-3 flex items-baseline justify-between">
      <h2 className="text-[13px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{title}</h2>
    </div>
  );
}

function DemoRow({ item }: { item: DemoPromise }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"open" | "kept" | "dismissed">("open");
  const SrcIcon = item.channel === "email" ? Mail : item.channel === "meeting" ? CalendarDays : StickyNote;
  const diff = new Date(item.due_at).getTime() - Date.now();
  const tone =
    diff < 0
      ? { dot: "bg-rose-500", label: "text-rose-600" }
      : diff < 86400_000
      ? { dot: "bg-amber-500", label: "text-amber-600" }
      : { dot: "bg-primary", label: "text-primary" };
  const dueLabel =
    diff < -86400_000
      ? `Overdue · ${Math.floor(-diff / 86400_000)}d`
      : diff < 0
      ? "Overdue"
      : diff < 86400_000
      ? "Today"
      : diff < 2 * 86400_000
      ? "Tomorrow"
      : new Date(item.due_at).toLocaleDateString(undefined, { weekday: "long" });

  if (status !== "open") {
    return (
      <div className="flex items-center justify-between rounded-lg border border-dashed border-border px-4 py-3 text-[12.5px] text-muted-foreground">
        <span>{status === "kept" ? "Marked done" : "Dismissed"} — {item.summary}</span>
        <button onClick={() => setStatus("open")} className="text-foreground/70 hover:text-foreground">Undo</button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-sm">
      <div className="flex items-start gap-3">
        <div className={`mt-1.5 h-2 w-2 rounded-full ${tone.dot}`} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <h3 className="text-[15px] font-medium tracking-tight">{item.summary}</h3>
            {item.owed_to && <span className="text-[12.5px] text-muted-foreground">· {item.owed_to}</span>}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
            <span className={`font-medium ${tone.label}`}>{dueLabel}</span>
            <span className="text-muted-foreground/70">·</span>
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <SrcIcon className="h-3 w-3" /> {item.channel}
            </span>
            <span className="text-muted-foreground/70">·</span>
            <span className="font-mono text-[10.5px] text-muted-foreground">
              {Math.round(item.confidence * 100)}% confidence
            </span>
          </div>
          <p className="mt-2 border-l-2 border-border pl-2 text-[12.5px] italic leading-snug text-muted-foreground line-clamp-2">
            "{item.evidence_snippet}"
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            title="Mark done"
            onClick={() => setStatus("kept")}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
          <button
            title="Dismiss"
            onClick={() => setStatus("dismissed")}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setOpen((v) => !v)}
            className="ml-1 inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11.5px] hover:bg-muted"
          >
            Details <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>
      {open && item.draft_reply && (
        <div className="mt-4 border-t border-border pt-4">
          <div className="mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" /> Draft reply
          </div>
          <div className="whitespace-pre-wrap rounded-md border border-border bg-secondary/40 p-3 text-[13px] leading-relaxed">
            {item.draft_reply}
          </div>
        </div>
      )}
    </div>
  );
}
