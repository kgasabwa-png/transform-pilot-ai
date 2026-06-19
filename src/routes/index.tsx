import { createFileRoute, Link } from "@tanstack/react-router";
import { NyvloMark } from "@/components/nyvlo/Shell";
import { ArrowRight, Calendar, ShieldCheck, Sparkles, Mail, FileText, StickyNote, CheckCircle2, Zap, ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nyvlo · The AI that catches what you forgot" },
      { name: "description", content: "Nyvlo finds the follow-ups, promises, and loose ends slipping through your week, and drafts the reply for you." },
      { property: "og:title", content: "Nyvlo · The AI that catches what you forgot" },
      { property: "og:description", content: "Nyvlo finds the follow-ups, promises, and loose ends slipping through your week." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-dvh bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-border/40 bg-background/60 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link to="/" className="flex items-center">
            <NyvloMark size="md" />
          </Link>
          <div className="hidden items-center gap-10 text-[13.5px] font-medium text-muted-foreground md:flex">
            <a href="#how" className="transition-colors hover:text-foreground">Product</a>
            <a href="#recap" className="transition-colors hover:text-foreground">Recap</a>
            <Link to="/pricing" className="transition-colors hover:text-foreground">Pricing</Link>
            <Link to="/privacy" className="transition-colors hover:text-foreground">Privacy</Link>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/auth" className="rounded-lg px-4 py-2 text-[13.5px] font-medium text-muted-foreground transition-colors hover:text-foreground">Sign in</Link>
            <Link to="/auth" className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-5 py-2 text-[13.5px] font-semibold text-background transition-transform active:scale-[0.98] hover:shadow-lg hover:shadow-foreground/10">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative isolate overflow-hidden pt-32 md:pt-48">
        <div className="nyvlo-aurora" />
        <div className="relative mx-auto max-w-7xl px-6 pb-24 text-center">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-current nyvlo-dot-pulse" />
              Private Beta Open
            </div>
            <h1 className="text-balance text-[52px] font-bold leading-[1.05] tracking-[-0.06em] text-foreground md:text-[96px]">
              The AI that catches what you forgot.
            </h1>
            <p className="mx-auto mt-8 max-w-[32ch] text-[18px] leading-[1.6] text-muted-foreground md:text-[22px]">
              Nyvlo finds the promises and follow-ups slipping through your week, and drafts the reply for you.
            </p>
            <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/auth" className="group inline-flex h-14 items-center gap-2 rounded-full bg-foreground px-8 text-[15px] font-bold text-background transition-all hover:px-9 active:scale-[0.98]">
                Start your free trial
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link to="/try" className="inline-flex h-14 items-center gap-2 rounded-full border border-border bg-card px-8 text-[15px] font-bold text-foreground transition-all hover:bg-muted hover:border-foreground/20 active:scale-[0.98]">
                Watch interactive demo
              </Link>
            </div>
            <div className="mt-8 flex items-center justify-center gap-6 font-mono text-[11px] uppercase tracking-widest text-muted-foreground/60">
              <span className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5" /> Google Sync</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5" /> No Credit Card</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5" /> Private AI</span>
            </div>
          </div>

          <div className="relative mx-auto mt-24 max-w-5xl md:mt-32">
            <div className="absolute -inset-4 rounded-[32px] bg-gradient-to-b from-primary/10 to-transparent blur-2xl md:-inset-10" />
            <PreviewCard />
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF / QUOTE */}
      <section className="relative z-10 border-y border-border/40 bg-background py-32">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-primary">The Moment</p>
          <blockquote className="mx-auto mt-8 max-w-3xl text-[32px] font-bold leading-[1.1] tracking-[-0.04em] text-foreground md:text-[56px]">
            &ldquo;I told Sarah I&rsquo;d send that two days ago.&rdquo;
          </blockquote>
          <p className="mx-auto mt-10 max-w-[48ch] text-[17px] leading-relaxed text-muted-foreground md:text-[19px]">
            We&rsquo;ve all been there. Nyvlo is the quiet nudge that arrives <span className="text-foreground font-semibold">before</span> the panic does, with the promise you made and the draft already written.
          </p>
        </div>
      </section>

      {/* FEATURES */}
      <section id="how" className="mx-auto max-w-7xl px-6 py-32 md:py-48">
        <div className="grid gap-16 md:grid-cols-2 md:items-center">
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-primary">Capabilities</p>
            <h2 className="mt-6 text-[40px] font-bold leading-[1.1] tracking-[-0.05em] md:text-[64px]">Three quiet moves,<br />every single day.</h2>
            <div className="mt-16 space-y-12">
              <FeatureItem 
                icon={Calendar} 
                title="Reads your calendar" 
                body="Connect your Google Calendar. Nyvlo understands meeting titles, attendees, and the intent behind every slot." 
              />
              <FeatureItem 
                icon={StickyNote} 
                title="Remembers anywhere" 
                body="One click on any page, email, or doc. A promise made, an ask received, or a document you mentioned." 
              />
              <FeatureItem 
                icon={Zap} 
                title="Catches what slipped" 
                body="Overdue follow-ups and unanswered questions. Nyvlo drafts the response, you just hit send." 
              />
            </div>
          </div>
          <div className="rounded-3xl border border-border bg-card p-2 shadow-2xl">
            <div className="aspect-[4/5] rounded-[22px] bg-secondary/50 flex items-center justify-center">
              <div className="text-center p-8">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/20">
                  <Sparkles className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight">AI-First Memory</h3>
                <p className="mt-4 text-muted-foreground leading-relaxed">Nyvlo doesn't just store data; it understands context. It knows the difference between a "chat" and a "commitment".</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RECAP */}
      <section id="recap" className="border-t border-border/40 bg-secondary/20 py-32 md:py-48">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-16 md:grid-cols-[1fr,1.2fr] md:items-center">
            <div className="order-2 md:order-1">
              <div className="relative mx-auto max-w-md rounded-[32px] border border-border bg-background p-8 shadow-2xl">
                <div className="flex items-center justify-between border-b border-border/60 pb-6">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Week ending</p>
                    <p className="mt-1 font-bold">June 20, 2026</p>
                  </div>
                  <NyvloMark size="sm" />
                </div>
                <div className="mt-10 grid grid-cols-3 gap-4 text-center">
                  <Stat label="Made" value="32" />
                  <Stat label="Kept" value="29" />
                  <Stat label="Caught" value="3" highlight />
                </div>
                <div className="mt-8 rounded-2xl bg-foreground p-8 text-center text-background">
                  <p className="font-mono text-[10px] uppercase tracking-widest opacity-60">Reliability Score</p>
                  <p className="mt-2 text-[80px] font-bold leading-none tracking-tighter">91</p>
                  <p className="mt-4 text-[13px] font-medium opacity-80">You're in the top 5% of users this week.</p>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-primary">Friday Recap</p>
              <h2 className="mt-6 text-[40px] font-bold leading-[1.1] tracking-[-0.05em] md:text-[64px]">A reliability score people actually share.</h2>
              <p className="mt-8 max-w-xl text-[18px] leading-relaxed text-muted-foreground">
                Every Friday afternoon, Nyvlo sends a summary of your week. How many promises you made, how many you kept, and exactly what would have slipped without a nudge.
              </p>
              <button className="group mt-10 inline-flex items-center gap-2 text-[15px] font-bold text-foreground">
                See a sample recap <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-foreground py-32 md:py-48">
        <div className="absolute inset-0 opacity-10 nyvlo-grain" />
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-[48px] font-bold leading-[1.05] tracking-[-0.05em] text-background md:text-[80px]">Never drop the ball again.</h2>
          <p className="mx-auto mt-8 max-w-[32ch] text-[18px] text-background/60 md:text-[22px]">
            Join 4,000+ professionals using Nyvlo to stay reliable without the stress.
          </p>
          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/auth" className="h-16 inline-flex items-center gap-2 rounded-full bg-background px-10 text-[16px] font-bold text-foreground transition-transform hover:scale-[1.02] active:scale-[0.98]">
              Get Started for Free
            </Link>
            <Link to="/pricing" className="h-16 inline-flex items-center gap-2 rounded-full border border-background/20 px-10 text-[16px] font-bold text-background transition-colors hover:bg-background/10">
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/40 bg-background py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            <div className="flex flex-col items-center gap-4 md:items-start">
              <NyvloMark size="md" />
              <p className="text-[13px] text-muted-foreground">© 2026 Nyvlo, Inc. All rights reserved.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 text-[13px] font-medium text-muted-foreground">
              <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
              <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
              <Link to="/terms" className="hover:text-foreground">Terms</Link>
              <a href="mailto:hello@nyvlo.ai" className="hover:text-foreground">Support</a>
              <a href="https://twitter.com/nyvlo" className="hover:text-foreground">Twitter</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureItem({ icon: Icon, title, body }: { icon: any; title: string; body: string }) {
  return (
    <div className="flex gap-6">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary shadow-inner">
        <Icon className="h-6 w-6" strokeWidth={2.5} />
      </div>
      <div>
        <h3 className="text-[20px] font-bold tracking-tight text-foreground">{title}</h3>
        <p className="mt-2 text-[16px] leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={["rounded-2xl border border-border p-4 transition-colors", highlight ? "bg-primary/5 border-primary/20" : "bg-muted/30"].join(" ")}>
      <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={["mt-1 text-[28px] font-bold tracking-tight", highlight ? "text-primary" : "text-foreground"].join(" ")}>{value}</p>
    </div>
  );
}

function PreviewCard() {
  const items = [
    { title: "Send pricing deck to Sarah", meta: "Acme · overdue 2 days", type: "meeting" },
    { title: "Reply to David at Luma", meta: "Interview slot · overdue 3 days", type: "email" },
    { title: "Share Q3 roadmap with Maria", meta: "Northwind · due today", type: "note" },
    { title: "Prep notes for Luma interview", meta: "Friday 2:00 PM", type: "calendar" },
  ];

  return (
    <div className="group relative overflow-hidden rounded-[32px] border border-border/80 bg-background/80 p-3 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] backdrop-blur-2xl">
      <div className="overflow-hidden rounded-[24px] border border-border bg-card shadow-inner">
        {/* Window Controls */}
        <div className="flex items-center justify-between border-b border-border/40 bg-secondary/40 px-6 py-4">
          <div className="flex gap-2">
            <div className="h-3 w-3 rounded-full bg-border" />
            <div className="h-3 w-3 rounded-full bg-border" />
            <div className="h-3 w-3 rounded-full bg-border" />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full bg-background px-3 py-1 text-[11px] font-bold tracking-tighter text-muted-foreground border border-border/60">
              <NyvloMark size="sm" className="opacity-70" />
              <span>/ dashboard</span>
            </div>
          </div>
          <div className="text-[11px] font-bold font-mono text-muted-foreground opacity-40">⌘J</div>
        </div>

        <div className="flex min-h-[400px]">
          {/* Mock Sidebar */}
          <div className="hidden w-48 border-r border-border/40 bg-secondary/10 p-4 md:block">
            <div className="space-y-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className={`h-8 rounded-lg ${i === 1 ? 'bg-primary/10' : 'bg-muted/20'} w-full opacity-60`} />
              ))}
            </div>
          </div>
          
          {/* Content Area */}
          <div className="flex-1 p-8 text-left">
            <div className="mb-8 flex items-center justify-between">
              <h4 className="text-[13px] font-bold uppercase tracking-[0.2em] text-primary">Needs Attention</h4>
              <div className="h-1.5 w-1.5 rounded-full bg-primary nyvlo-dot-pulse" />
            </div>
            
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="group/item flex items-center gap-4 rounded-2xl border border-border bg-background p-4 transition-all hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground group-hover/item:bg-primary group-hover/item:text-primary-foreground transition-colors">
                    {item.type === 'meeting' && <Calendar className="h-5 w-5" />}
                    {item.type === 'email' && <Mail className="h-5 w-5" />}
                    {item.type === 'note' && <StickyNote className="h-5 w-5" />}
                    {item.type === 'calendar' && <FileText className="h-5 w-5" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-[15px] font-bold text-foreground leading-tight">{item.title}</p>
                    <p className="mt-1 font-mono text-[11px] text-muted-foreground uppercase tracking-tight">{item.meta}</p>
                  </div>
                  <button className="rounded-full bg-foreground px-4 py-1.5 text-[12px] font-bold text-background opacity-0 group-hover/item:opacity-100 transition-opacity">
                    Draft Reply
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
