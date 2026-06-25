import { createFileRoute, Link } from "@tanstack/react-router";
import { NyvloMark } from "@/components/nyvlo/Shell";
import {
  ArrowRight,
  BotOff,
  Calendar,
  FileText,
  FolderOpen,
  Lock,
  MessageSquareText,
  Mic,
  NotebookPen,
  Search,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nyvlo · The private AI notepad for meetings" },
      {
        name: "description",
        content:
          "Nyvlo is a private AI meeting notepad. Capture conversations without a bot, jot what matters, and turn rough notes into structured summaries, actions, and searchable memory.",
      },
      { property: "og:title", content: "Nyvlo · The private AI notepad for meetings" },
      {
        property: "og:description",
        content:
          "Capture conversations without a bot, jot what matters, and enhance your notes into actions and memory.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="relative min-h-dvh overflow-x-clip bg-background text-foreground">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[840px] nyvlo-aurora" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[840px] nyvlo-grid opacity-[0.5]" />
      <Nav />
      <Hero />
      <ProofStrip />
      <WorkflowSection />
      <TemplatesSection />
      <MemorySection />
      <PrivacySection />
      <FinalCta />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="relative z-20">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center">
          <NyvloMark size="lg" animated withWordmark />
        </Link>
        <nav className="hidden items-center gap-8 text-[13px] text-muted-foreground md:flex">
          <a href="#workflow" className="transition-colors hover:text-foreground">
            Workflow
          </a>
          <a href="#templates" className="transition-colors hover:text-foreground">
            Templates
          </a>
          <a href="#memory" className="transition-colors hover:text-foreground">
            Memory
          </a>
          <Link to="/privacy" className="transition-colors hover:text-foreground">
            Privacy
          </Link>
        </nav>
        <div className="flex items-center gap-2.5">
          <Link to="/auth" className="hidden text-[13px] text-muted-foreground transition-colors hover:text-foreground md:inline">
            Sign in
          </Link>
          <Link
            to="/auth"
            className="btn-ion inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold"
          >
            Start free
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative">
      <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-14 md:pb-32 md:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="nyvlo-rise mb-7 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-[11.5px] font-medium text-muted-foreground backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-primary nyvlo-dot-pulse" />
            Private AI meeting notes · no bot in the room
          </div>
          <h1 className="nyvlo-rise font-display text-balance text-[44px] font-semibold leading-[1.02] tracking-[-0.025em] text-foreground md:text-[76px]">
            The notes you would have written
            <br className="hidden md:block" />{" "}
            <span className="nyvlo-shimmer">if you could stay present.</span>
          </h1>
          <p
            className="nyvlo-rise mx-auto mt-6 max-w-2xl text-[16px] leading-relaxed text-muted-foreground md:text-[18px]"
            style={{ animationDelay: "120ms" }}
          >
            Start a notepad for any call, jot the parts that matter, and Nyvlo enhances your rough notes
            with the transcript into a clean summary, decisions, and follow-ups.
          </p>
          <div
            className="nyvlo-rise mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
            style={{ animationDelay: "240ms" }}
          >
            <Link
              to="/auth"
              className="btn-ion inline-flex items-center gap-2 rounded-full px-5 py-3 text-[14.5px] font-semibold"
            >
              Start taking notes <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#workflow"
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-3 text-[13.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              See the workflow
            </a>
          </div>
          <div className="nyvlo-rise mt-4 text-[11.5px] text-muted-foreground" style={{ animationDelay: "320ms" }}>
            Browser mic capture included · desktop system audio ready · no credit card
          </div>
        </div>
        <div className="nyvlo-rise mx-auto mt-16 max-w-5xl" style={{ animationDelay: "420ms" }}>
          <ProductCanvas />
        </div>
      </div>
    </section>
  );
}

function ProductCanvas() {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute -inset-x-10 -top-10 -bottom-10 -z-10 rounded-[40px] bg-gradient-to-b from-primary/15 via-transparent to-transparent blur-3xl" />
      <div className="overflow-hidden rounded-2xl border border-border nyvlo-glass shadow-[0_50px_120px_-40px_rgba(0,0,0,0.55)]">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-foreground/20" />
            <span className="h-2.5 w-2.5 rounded-full bg-foreground/20" />
            <span className="h-2.5 w-2.5 rounded-full bg-foreground/20" />
            <div className="ml-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <NyvloMark size="sm" /> Nyvlo · Acme discovery call
            </div>
          </div>
          <div className="hidden items-center gap-1.5 rounded-md border border-border bg-background/40 px-2 py-1 text-[10.5px] text-muted-foreground md:flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-destructive" /> recording privately
          </div>
        </div>
        <div className="grid md:grid-cols-[0.9fr_1.1fr]">
          <div className="border-b border-border bg-card/60 p-6 md:border-b-0 md:border-r">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">Your rough notes</div>
                <h3 className="mt-1 text-lg font-semibold">What you jot during the call</h3>
              </div>
              <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[10.5px] text-muted-foreground">
                Product discovery
              </span>
            </div>
            <div className="space-y-2 rounded-xl border border-border bg-background/60 p-4 font-mono text-[12px] leading-relaxed text-foreground/85">
              <p>- onboarding takes too long</p>
              <p>- Sarah wants examples by industry</p>
              <p>- pricing concern: needs annual option</p>
              <p>- follow up with migration checklist</p>
            </div>
            <div className="mt-4 flex items-center gap-2 text-[12px] text-muted-foreground">
              <Mic className="h-3.5 w-3.5" /> Nyvlo captures transcript in the background.
            </div>
          </div>
          <div className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <div className="text-[10.5px] uppercase tracking-[0.18em] text-primary">Enhanced notes</div>
            </div>
            <article className="space-y-5 text-[13.5px] leading-relaxed">
              <div>
                <h3 className="text-xl font-semibold tracking-tight">Acme discovery call</h3>
                <p className="mt-2 text-muted-foreground">
                  Sarah is evaluating Nyvlo for a customer success team that needs cleaner onboarding handoffs
                  and reusable implementation notes.
                </p>
              </div>
              <NoteSection
                title="Key decisions"
                items={[
                  "Send Acme industry-specific examples before their internal review.",
                  "Position annual pricing with migration support included.",
                ]}
              />
              <NoteSection
                title="Discussion"
                items={[
                  "Current onboarding notes live across docs, Slack threads, and call recordings.",
                  "The strongest value is turning customer calls into a searchable implementation memory.",
                ]}
              />
              <NoteSection
                title="Next steps"
                items={["Share migration checklist", "Draft annual plan follow-up", "Book technical validation call"]}
              />
            </article>
          </div>
        </div>
      </div>
    </div>
  );
}

function NoteSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="font-semibold">{title}</h4>
      <ul className="mt-1.5 space-y-1.5 text-muted-foreground">
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

function ProofStrip() {
  const items = [
    { icon: BotOff, label: "No meeting bot" },
    { icon: Calendar, label: "Calendar-aware briefs" },
    { icon: NotebookPen, label: "Human-guided notes" },
    { icon: Search, label: "Searchable memory" },
    { icon: Lock, label: "Private by default" },
  ];
  return (
    <section className="relative border-y border-border/60 bg-background/40">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-9 gap-y-3 px-6 py-6">
        {items.map(({ icon: Icon, label }) => (
          <div key={label} className="inline-flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
            <Icon className="h-4 w-4 text-primary" strokeWidth={1.75} />
            {label}
          </div>
        ))}
      </div>
    </section>
  );
}

function WorkflowSection() {
  const steps = [
    {
      icon: Calendar,
      title: "Brief before the meeting",
      body: "Calendar context names the note, shows who is attending, and keeps previous conversations close.",
    },
    {
      icon: NotebookPen,
      title: "Jot what matters",
      body: "Write fragments, questions, and judgment calls while Nyvlo quietly captures the transcript.",
    },
    {
      icon: Sparkles,
      title: "Enhance after the call",
      body: "Your rough notes guide the AI, so the final summary reflects what you cared about instead of a generic transcript.",
    },
  ];
  return (
    <section id="workflow" className="relative border-t border-border/60 bg-gradient-to-b from-background to-card/30">
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <SectionIntro
          eyebrow="Workflow"
          title="Before, during, and after every conversation."
          body="Nyvlo is built around the way people actually take notes: quick fragments during the call, clean structure afterward."
        />
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <FeatureCard key={step.title} icon={step.icon} title={step.title} body={step.body} number={index + 1} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TemplatesSection() {
  const templates = [
    "Discovery call",
    "Research interview",
    "1:1",
    "Planning",
    "Sales debrief",
    "Customer onboarding",
  ];
  return (
    <section id="templates" className="relative border-t border-border/60">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-24 md:grid-cols-[0.9fr_1.1fr] md:py-32">
        <div>
          <p className="text-[10.5px] uppercase tracking-[0.22em] text-primary/80">Templates</p>
          <h2 className="mt-3 font-display text-[34px] font-semibold leading-tight tracking-[-0.02em] md:text-[46px]">
            Notes shaped for the meeting you are actually in.
          </h2>
          <p className="mt-4 text-[15.5px] leading-relaxed text-muted-foreground">
            A product interview should not read like a pipeline review. Pick the template before you start,
            and Nyvlo biases the enhanced note toward the right details.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {templates.map((template) => (
            <div key={template} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">{template}</h3>
              </div>
              <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
                Focuses summaries, decisions, open questions, and follow-ups for this meeting type.
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MemorySection() {
  return (
    <section id="memory" className="relative border-t border-border/60 bg-gradient-to-b from-card/20 to-background">
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <SectionIntro
          eyebrow="Memory"
          title="Your meetings become a context layer."
          body="Search, ask questions, and reuse what your team already discussed without copy-pasting transcripts into another AI tool."
        />
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          <FeatureCard
            icon={Search}
            title="Search every note"
            body="Find decisions, customer quotes, and open questions across your conversation history."
          />
          <FeatureCard
            icon={MessageSquareText}
            title="Ask your meetings"
            body="Ask what came up across interviews, what changed since last call, or what to send next."
          />
          <FeatureCard
            icon={FolderOpen}
            title="Organize by workstream"
            body="Keep private notes separate, then share polished summaries when you choose."
          />
        </div>
      </div>
    </section>
  );
}

function PrivacySection() {
  return (
    <section id="privacy" className="relative border-t border-border/60 bg-background">
      <div className="mx-auto max-w-3xl px-6 py-24 text-center md:py-32">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card text-primary">
          <Lock className="h-5 w-5" strokeWidth={1.5} />
        </span>
        <h2 className="mt-6 font-display text-[32px] font-semibold tracking-[-0.02em] md:text-[44px]">
          Humans in the room. No bot required.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-[15.5px] leading-relaxed text-muted-foreground">
          Nyvlo captures from your device instead of joining meetings as a participant. Notes stay private by default,
          and you decide what to share, export, or delete.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-2 text-[11.5px] text-muted-foreground">
          {["Private by default", "Delete notes anytime", "Calendar read-only", "No model training on your data"].map((item) => (
            <span key={item} className="rounded-full border border-border bg-card/60 px-2.5 py-1">
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="relative border-t border-border/60">
      <div className="relative mx-auto max-w-5xl overflow-hidden px-6 py-28 text-center md:py-36">
        <div className="pointer-events-none absolute inset-0 -z-10 nyvlo-aurora" />
        <div className="pointer-events-none absolute inset-0 -z-10 nyvlo-grid opacity-40" />
        <div className="nyvlo-float mx-auto mb-8 w-fit">
          <NyvloMark size="xl" animated />
        </div>
        <h2 className="font-display text-[40px] font-semibold leading-[1.05] tracking-[-0.025em] md:text-[64px]">
          Stay present. Leave with great notes.
        </h2>
        <p className="mx-auto mt-5 max-w-md text-[15px] text-muted-foreground">
          Start a notepad in the browser, then upgrade to desktop capture when you want system audio.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link to="/auth" className="btn-ion inline-flex items-center gap-2 rounded-full px-5 py-3 text-[14.5px] font-semibold">
            Start free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function SectionIntro({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-[10.5px] uppercase tracking-[0.22em] text-primary/80">{eyebrow}</p>
      <h2 className="mt-3 font-display text-[34px] font-semibold leading-tight tracking-[-0.02em] md:text-[46px]">
        {title}
      </h2>
      <p className="mt-4 text-[15.5px] leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  body,
  number,
}: {
  icon: typeof Calendar;
  title: string;
  body: string;
  number?: number;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/30">
      <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-primary/10 opacity-0 blur-3xl transition-opacity group-hover:opacity-100" />
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background/60 text-primary">
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </span>
        {number ? <span className="font-mono text-[11px] text-muted-foreground">0{number}</span> : null}
      </div>
      <h3 className="mt-5 font-display text-[20px] font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-[12px] text-muted-foreground md:flex-row">
        <div className="flex items-center gap-2">
          <NyvloMark size="sm" withWordmark />
          <span className="ml-1">© 2026</span>
        </div>
        <div className="flex items-center gap-5">
          <Link to="/pricing" className="transition-colors hover:text-foreground">
            Pricing
          </Link>
          <Link to="/privacy" className="transition-colors hover:text-foreground">
            Privacy
          </Link>
          <Link to="/terms" className="transition-colors hover:text-foreground">
            Terms
          </Link>
          <a href="mailto:keila@nyvloai.com" className="transition-colors hover:text-foreground">
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
