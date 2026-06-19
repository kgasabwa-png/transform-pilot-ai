import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getProfile } from "@/lib/nyvlo/profile.functions";
import { NyvloMark } from "@/components/nyvlo/Shell";
import { Check, Circle, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Welcome to Nyvlo" }] }),
  component: Onboarding,
});

function Onboarding() {
  const fetchProfile = useServerFn(getProfile);
  const { data } = useQuery({ queryKey: ["profile"], queryFn: () => fetchProfile() });

  const connected = !!data?.connection;
  const steps = [
    {
      title: "Sign in",
      body: "You're in. Welcome.",
      done: true,
      cta: null,
    },
    {
      title: "Connect Google",
      body: "Read-only access to your calendar and sent email. We use it to ground every promise in real context.",
      done: connected,
      cta: connected ? null : { label: "Connect Google", to: "/app/settings" },
    },
    {
      title: "Install the Chrome extension",
      body: "Capture promises and follow-ups straight from Gmail, Slack, Linear, and Notion.",
      done: false,
      cta: { label: "Get the extension", to: "/app/settings" },
    },
    {
      title: "Try a Live Capture",
      body: "Start a quick browser recording, or install the desktop app for full system-audio capture.",
      done: false,
      cta: { label: "Open Live Capture", to: "/app/capture" },
    },
  ] as const;

  return (
    <div className="min-h-dvh bg-background">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <Link to="/app"><NyvloMark size="lg" /></Link>
        <Link to="/app" className="text-[13px] text-muted-foreground hover:text-foreground">
          Skip → app
        </Link>
      </header>
      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-[34px] font-semibold tracking-tight">Get set up in 60 seconds.</h1>
        <p className="mt-2 text-[14.5px] text-muted-foreground">
          Four quick steps. You can come back any time.
        </p>

        <ol className="mt-10 space-y-4">
          {steps.map((s, i) => (
            <li
              key={s.title}
              className={[
                "flex items-start gap-4 rounded-xl border p-5",
                s.done ? "border-success/30 bg-success/5" : "border-border bg-card",
              ].join(" ")}
            >
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border">
                {s.done ? (
                  <Check className="h-3.5 w-3.5 text-success" />
                ) : (
                  <Circle className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-[11px] font-mono uppercase text-muted-foreground">Step {i + 1}</span>
                  <h3 className="text-[15px] font-medium">{s.title}</h3>
                </div>
                <p className="mt-1 text-[13.5px] text-muted-foreground">{s.body}</p>
              </div>
              {s.cta && (
                <Link
                  to={s.cta.to}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-[12.5px] font-medium text-background hover:opacity-90"
                >
                  {s.cta.label} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </li>
          ))}
        </ol>

        <div className="mt-10 rounded-xl border border-border bg-secondary/40 p-5 text-center">
          <p className="text-[13.5px] text-muted-foreground">
            Done? <Link to="/app" className="font-medium text-foreground underline underline-offset-2">Go to your dashboard →</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
