import { createFileRoute, Link } from "@tanstack/react-router";
import { NyvloMark } from "@/components/nyvlo/Shell";
import { Check } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing · Nyvlo" },
      { name: "description", content: "Simple pricing. Free during beta." },
    ],
  }),
  component: Pricing,
});

const tiers = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    blurb: "For trying Nyvlo and lightweight use.",
    features: [
      "5 hours of capture / month",
      "Chrome extension + browser recorder",
      "Up to 100 promises tracked",
      "Daily digest email",
    ],
    cta: "Get started",
    href: "/auth",
  },
  {
    name: "Pro",
    price: "$24",
    cadence: "/ month",
    blurb: "For founders, operators, and anyone with a packed week.",
    featured: true,
    features: [
      "Unlimited capture (mic + system audio)",
      "Desktop app with ScreenCaptureKit",
      "Unlimited promises + memory",
      "Auto-drafts and Friday recap",
      "Priority support",
    ],
    cta: "Join the waitlist",
    href: "mailto:keila@nyvloai.com?subject=Nyvlo%20Pro%20waitlist",
  },
];

function Pricing() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/"><NyvloMark size="lg" /></Link>
        <nav className="flex items-center gap-5 text-[13px] text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <Link to="/auth" className="rounded-md bg-foreground px-3 py-1.5 font-medium text-background hover:opacity-90">Sign in</Link>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-16">
        <div className="text-center">
          <h1 className="text-[48px] font-semibold tracking-tight">Simple pricing.</h1>
          <p className="mx-auto mt-4 max-w-xl text-[16px] text-muted-foreground">
            Free during private beta. Pro will start billing once we're out of beta — early users get a discount for life.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={[
                "rounded-2xl border p-7",
                t.featured ? "border-primary/40 bg-card shadow-[0_30px_80px_-30px_rgba(15,15,30,0.18)]" : "border-border bg-card/60",
              ].join(" ")}
            >
              <div className="flex items-baseline justify-between">
                <h2 className="text-[20px] font-semibold">{t.name}</h2>
                {t.featured && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">Most popular</span>
                )}
              </div>
              <p className="mt-1 text-[13.5px] text-muted-foreground">{t.blurb}</p>
              <div className="mt-5 flex items-baseline gap-1.5">
                <span className="text-[42px] font-semibold tracking-tight">{t.price}</span>
                <span className="text-[13px] text-muted-foreground">{t.cadence}</span>
              </div>
              <ul className="mt-6 space-y-2.5">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[14px]">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href={t.href}
                className={[
                  "mt-7 inline-flex w-full items-center justify-center rounded-md px-4 py-2.5 text-[14px] font-medium",
                  t.featured ? "bg-foreground text-background hover:opacity-90" : "border border-border bg-background hover:bg-muted",
                ].join(" ")}
              >
                {t.cta}
              </a>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-12 max-w-xl text-center text-[12.5px] text-muted-foreground">
          Questions about pricing or volume?{" "}
          <a href="mailto:keila@nyvloai.com" className="underline">keila@nyvloai.com</a>
        </p>
      </main>
    </div>
  );
}
