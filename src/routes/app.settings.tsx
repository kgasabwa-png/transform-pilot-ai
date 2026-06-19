import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/nyvlo/Shell";
import { user } from "@/lib/nyvlo/data";
import { Check, ShieldCheck, Globe, Pause } from "lucide-react";

export const Route = createFileRoute("/app/settings")({
  head: () => ({ meta: [{ title: "Settings · Nyvlo" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <Shell title="Settings" subtitle="You control what Nyvlo remembers. Nothing is captured silently.">
      <div className="grid gap-6 md:grid-cols-[1fr,1fr]">
        <Section title="Account">
          <Row label="Name" value={user.name} />
          <Row label="Email" value={user.email} />
          <Row label="Timezone" value={user.timezone} />
        </Section>

        <Section title="Connections">
          <ConnRow name="Google Calendar" status="connected" detail="Read-only · today + 7 days" />
          <ConnRow name="Gmail" status="optional" detail="Coming in V2. Nyvlo can run without it." />
          <ConnRow name="Slack" status="optional" detail="Coming in V2." />
        </Section>

        <Section title="Privacy">
          <Toggle label="Pause memory capture" hint="Nyvlo stops saving anything until you turn this off." Icon={Pause} />
          <Toggle label="Private mode" hint="Captures stay local. No AI extraction runs." Icon={ShieldCheck} defaultOn />
          <Toggle label="Exclude domains" hint="Banking, health, personal email — never captured." Icon={Globe} defaultOn />
        </Section>

        <Section title="Notifications">
          <Toggle label="End-of-day recap (5pm)" defaultOn />
          <Toggle label="Morning brief (8am)" defaultOn />
          <Toggle label="Overdue nudges" defaultOn />
          <Toggle label="Weekly reliability score (Fridays)" defaultOn />
        </Section>
      </div>

      <div className="mt-10 rounded-xl border border-border bg-secondary/40 p-5 text-[12.5px] text-muted-foreground">
        <span className="font-medium text-foreground">Nyvlo only remembers what you save or connect.</span> We never sell your data, never train shared models on your memory, and you can delete everything with one click.
      </div>
    </Shell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="nyvlo-card overflow-hidden">
      <div className="border-b border-border bg-secondary/30 px-4 py-2.5 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{title}</div>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border px-4 py-3 last:border-b-0">
      <span className="text-[12.5px] text-muted-foreground">{label}</span>
      <span className="text-[13.5px] text-foreground">{value}</span>
    </div>
  );
}

function ConnRow({ name, status, detail }: { name: string; status: "connected" | "optional"; detail: string }) {
  const connected = status === "connected";
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 last:border-b-0">
      <div>
        <div className="text-[13.5px] font-medium">{name}</div>
        <div className="text-[11.5px] text-muted-foreground">{detail}</div>
      </div>
      {connected ? (
        <span className="inline-flex items-center gap-1 rounded-md bg-success/12 px-2 py-0.5 text-[11.5px] font-medium text-success">
          <Check className="h-3 w-3" /> Connected
        </span>
      ) : (
        <button className="rounded-md border border-border px-2.5 py-1 text-[11.5px] text-foreground/80 hover:bg-muted">Connect</button>
      )}
    </div>
  );
}

function Toggle({ label, hint, defaultOn, Icon }: { label: string; hint?: string; defaultOn?: boolean; Icon?: typeof Pause }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 last:border-b-0">
      <div className="flex items-start gap-3">
        {Icon ? <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" /> : null}
        <div>
          <div className="text-[13.5px] text-foreground">{label}</div>
          {hint ? <div className="text-[11.5px] text-muted-foreground">{hint}</div> : null}
        </div>
      </div>
      <div className={["relative inline-flex h-5 w-9 items-center rounded-full transition-colors", defaultOn ? "bg-primary" : "bg-muted"].join(" ")}>
        <span className={["inline-block h-4 w-4 transform rounded-full bg-background shadow transition-transform", defaultOn ? "translate-x-4" : "translate-x-0.5"].join(" ")} />
      </div>
    </div>
  );
}
