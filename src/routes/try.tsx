import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  BookMarked,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  MessageSquareText,
  Mic,
  NotebookPen,
  PlayCircle,
  Search,
  Sparkles,
} from "lucide-react";
import { NyvloMark } from "@/components/nyvlo/Shell";

export const Route = createFileRoute("/try")({
  head: () => ({
    meta: [
      { title: "Try Nyvlo · Meeting notes demo" },
      { name: "description", content: "Explore a sample Nyvlo meeting notebook — no signup required." },
      { property: "og:title", content: "Try Nyvlo · Meeting notes demo" },
      { property: "og:description", content: "Explore a sample Nyvlo meeting notebook — no signup required." },
    ],
  }),
  component: TryPage,
});

const meetings = [
  {
    id: "acme",
    title: "Acme discovery call",
    template: "Product discovery",
    time: "Today · 10:00",
    duration: "31 min",
    summary:
      "Sarah is evaluating Nyvlo for customer success onboarding. The biggest pain is losing implementation details across calls, Slack, and docs.",
    rough: ["onboarding notes scattered", "wants examples by industry", "annual pricing concern", "send migration checklist"],
    decisions: ["Send industry-specific examples before Acme's internal review.", "Position annual plan with migration support included."],
    discussion: [
      "Current handoff notes are split across docs, Slack threads, and recordings.",
      "Searchable meeting memory is more valuable to Acme than a raw transcript archive.",
      "Sarah wants implementation notes that can be shared with support managers without cleanup.",
    ],
    actions: ["Share migration checklist", "Draft annual plan follow-up", "Book technical validation call"],
  },
  {
    id: "roadmap",
    title: "Q3 roadmap planning",
    template: "Planning",
    time: "Yesterday · 14:30",
    duration: "46 min",
    summary:
      "The team narrowed Q3 scope to calendar briefs, improved desktop capture, and searchable team folders.",
    rough: ["defer CRM sync", "calendar brief is priority", "desktop capture bugs", "folder chat prototype"],
    decisions: ["Defer CRM sync until after desktop capture is stable.", "Make calendar briefs the Q3 activation bet."],
    discussion: [
      "Design wants fewer dashboard metrics and more note-first affordances.",
      "Engineering flagged system audio permissions as the highest-risk onboarding step.",
      "Team folders should start simple: private notes first, share explicitly later.",
    ],
    actions: ["Write Q3 scope memo", "Schedule desktop QA pass", "Prototype folder chat empty state"],
  },
];

type ViewKey = "meetings" | "actions" | "memory" | "ask";

function TryPage() {
  const [view, setView] = useState<ViewKey>("meetings");
  const [selectedId, setSelectedId] = useState(meetings[0].id);
  const selected = meetings.find((meeting) => meeting.id === selectedId) ?? meetings[0];
  const actions = meetings.flatMap((meeting) =>
    meeting.actions.map((action) => ({ action, meeting: meeting.title, id: `${meeting.id}-${action}` })),
  );

  return (
    <div className="min-h-dvh bg-background">
      <div className="sticky top-0 z-30 border-b border-border bg-foreground text-background">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-2.5 text-[12.5px]">
          <div className="flex items-center gap-2">
            <PlayCircle className="h-4 w-4" />
            <span className="font-medium">You're in the meeting-notes demo.</span>
            <span className="hidden text-background/70 sm:inline">Sample notes — no signup required.</span>
          </div>
          <Link
            to="/auth"
            className="inline-flex items-center gap-1 rounded-md bg-background px-2.5 py-1 text-[12px] font-medium text-foreground hover:opacity-90"
          >
            Start with real meetings <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1400px]">
        <aside className="sticky top-[42px] hidden h-[calc(100dvh-42px)] w-[244px] shrink-0 flex-col border-r border-border/80 bg-secondary px-4 py-6 md:flex">
          <Link to="/" className="mb-7 flex items-center gap-2 px-2">
            <NyvloMark size="lg" />
          </Link>
          <nav className="flex flex-col gap-0.5">
            <DemoNav icon={Sparkles} label="Meetings" active={view === "meetings"} onClick={() => setView("meetings")} />
            <DemoNav icon={CheckCircle2} label="Actions" active={view === "actions"} onClick={() => setView("actions")} />
            <DemoNav icon={BookMarked} label="Library" active={view === "memory"} onClick={() => setView("memory")} />
            <DemoNav icon={MessageSquareText} label="Ask" active={view === "ask"} onClick={() => setView("ask")} />
          </nav>
          <div className="mt-auto rounded-lg border border-border bg-background/40 p-3 text-[12px] text-muted-foreground">
            This demo mirrors the signed-in product: capture, jot, enhance, then ask across notes.
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-5 py-8 md:px-10 md:py-12">
          {view === "meetings" && (
            <MeetingsView selected={selected} selectedId={selectedId} onSelect={setSelectedId} />
          )}
          {view === "actions" && <ActionsView actions={actions} />}
          {view === "memory" && <MemoryView />}
          {view === "ask" && <AskView />}

          <div className="mt-12 rounded-xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-[15px] font-medium">Ready to use this with your meetings?</div>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  Start in the browser, then use the desktop app when you need system audio.
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

function MeetingsView({
  selected,
  selectedId,
  onSelect,
}: {
  selected: (typeof meetings)[number];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <>
      <header className="mb-8">
        <h1 className="text-[28px] font-semibold tracking-tight">Meeting notebook</h1>
        <p className="mt-1 text-[14px] text-muted-foreground">
          Start with rough notes. Leave with a summary, decisions, and follow-ups.
        </p>
      </header>

      <section className="mb-8 grid gap-4 md:grid-cols-3">
        <StatTile label="Notes captured" value="18" hint="last 30 days" />
        <StatTile label="Enhanced" value="15" hint="ready to search" />
        <StatTile label="Open actions" value="6" hint="from conversations" />
      </section>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="rounded-xl border border-border bg-card p-2">
          <div className="px-2 py-2 text-[11px] uppercase tracking-wider text-muted-foreground">Recent meetings</div>
          {meetings.map((meeting) => (
            <button
              key={meeting.id}
              onClick={() => onSelect(meeting.id)}
              className={[
                "w-full rounded-md px-2.5 py-2 text-left text-[13px] transition-colors",
                selectedId === meeting.id
                  ? "bg-foreground/[0.06] text-foreground"
                  : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground",
              ].join(" ")}
            >
              <div className="truncate font-medium">{meeting.title}</div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">{meeting.time} · {meeting.duration}</div>
            </button>
          ))}
        </div>

        <div className="space-y-5">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">{selected.title}</h2>
                <div className="mt-1 flex items-center gap-3 text-[12px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {selected.time}</span>
                  <span>{selected.duration}</span>
                  <span>{selected.template}</span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-1 text-[11px] text-muted-foreground">
                <Mic className="h-3.5 w-3.5" /> bot-free capture
              </span>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-3 flex items-center gap-2 text-[12px] font-medium">
                <NotebookPen className="h-4 w-4 text-primary" /> Rough notes
              </div>
              <ul className="space-y-2 font-mono text-[12.5px] text-muted-foreground">
                {selected.rough.map((item) => <li key={item}>- {item}</li>)}
              </ul>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-4 flex items-center gap-2 text-[12px] font-medium text-primary">
                <Sparkles className="h-4 w-4" /> Enhanced notes
              </div>
              <h3 className="text-xl font-semibold">{selected.title}</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{selected.summary}</p>
              <NoteSection title="Key decisions" items={selected.decisions} />
              <NoteSection title="Discussion" items={selected.discussion} />
              <NoteSection title="Next steps" items={selected.actions} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ActionsView({ actions }: { actions: { id: string; action: string; meeting: string }[] }) {
  return (
    <>
      <header className="mb-8">
        <h1 className="text-[28px] font-semibold tracking-tight">Actions</h1>
        <p className="mt-1 text-[14px] text-muted-foreground">Follow-ups extracted from enhanced meeting notes.</p>
      </header>
      <div className="flex flex-col gap-2">
        {actions.map((item) => (
          <div key={item.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
              <div>
                <h3 className="text-[14px] font-medium">{item.action}</h3>
                <p className="mt-1 text-[12px] text-muted-foreground">{item.meeting}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function MemoryView() {
  const items = [
    { icon: CalendarDays, title: "Acme cares about onboarding handoffs", source: "Acme discovery call" },
    { icon: FileText, title: "Q3 activation bet is calendar briefs", source: "Q3 roadmap planning" },
    { icon: Search, title: "System audio permissions are the risky onboarding step", source: "Q3 roadmap planning" },
  ];
  return (
    <>
      <header className="mb-8">
        <h1 className="text-[28px] font-semibold tracking-tight">Library</h1>
        <p className="mt-1 text-[14px] text-muted-foreground">Useful context Nyvlo can retrieve when you ask questions.</p>
      </header>
      <div className="flex flex-col gap-2">
        {items.map(({ icon: Icon, title, source }) => (
          <div key={title} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <h3 className="text-[14px] font-medium">{title}</h3>
                <p className="mt-1 text-[12px] text-muted-foreground">{source}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function AskView() {
  const prompts = [
    "What did Acme care about most?",
    "Which Q3 decisions are still open?",
    "Draft a follow-up from the discovery call",
  ];
  return (
    <>
      <header className="mb-8">
        <h1 className="text-[28px] font-semibold tracking-tight">Ask</h1>
        <p className="mt-1 text-[14px] text-muted-foreground">Chat across notes, actions, and meeting memory.</p>
      </header>
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <MessageSquareText className="mx-auto h-8 w-8 text-primary" />
        <h3 className="mt-3 text-[16px] font-medium">Ask your meeting notebook</h3>
        <div className="mx-auto mt-5 flex max-w-md flex-col gap-2">
          {prompts.map((prompt) => (
            <button key={prompt} className="rounded-md border border-border bg-background px-3 py-2 text-left text-[13px] hover:bg-muted">
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function DemoNav({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Sparkles;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13.5px] transition-colors ${
        active ? "bg-background text-foreground" : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
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

function NoteSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-5">
      <h4 className="text-[13px] font-semibold">{title}</h4>
      <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-muted-foreground">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
