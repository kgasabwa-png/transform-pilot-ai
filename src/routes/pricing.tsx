import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { NyvloMark } from "@/components/nyvlo/Shell";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { supabase } from "@/integrations/supabase/client";
import { Check, X } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing | Nyvlo | Free then $18/mo for unlimited" },
      { name: "description", content: "Free forever for 10 captures a month with Pro for unlimited capture and desktop app" },
    ],
  }),
  component: Pricing,
});

type Cadence = "monthly" | "yearly";

function Pricing() {
  const [cadence, setCadence] = useState<Cadence>("yearly");
  const [checkoutPriceId, setCheckoutPriceId] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser({ id: data.user.id, email: data.user.email ?? undefined });
    });
  }, []);

  const priceId = cadence === "monthly" ? "pro_monthly_v2" : "pro_yearly_v2";
  const proPrice = cadence === "monthly" ? "$18" : "$12";
  const proCadence = cadence === "monthly" ? "/ month" : "/ month, billed yearly";

  const startCheckout = () => {
    if (!user) {
      window.location.href = `/auth?next=${encodeURIComponent("/pricing")}`;
      return;
    }
    setCheckoutPriceId(priceId);
  };

  if (checkoutPriceId) {
    return (
      <div className="min-h-dvh bg-background text-foreground">
        <PaymentTestModeBanner />
        <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <Link to="/"><NyvloMark size="lg" /></Link>
          <button onClick={() => setCheckoutPriceId(null)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" /> Cancel
          </button>
        </header>
        <main className="mx-auto max-w-2xl px-6 pb-16">
          <StripeEmbeddedCheckout
            priceId={checkoutPriceId}
            customerEmail={user?.email}
            userId={user?.id}
            returnUrl={`${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <PaymentTestModeBanner />
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/"><NyvloMark size="lg" /></Link>
        <nav className="flex items-center gap-5 text-[13px] text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <Link to="/auth" className="rounded-md bg-foreground px-3 py-1.5 font-medium text-background hover:opacity-90">Sign in</Link>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-16">
        <div className="text-center">
          <h1 className="text-[48px] font-semibold tracking-tight">Simple pricing</h1>
          <p className="mx-auto mt-4 max-w-xl text-[16px] text-muted-foreground">
            Free during private beta with Pro for unlimited capture and the desktop app
          </p>
          <div className="mx-auto mt-8 inline-flex items-center rounded-full border border-border bg-card/60 p-1 text-[13px]">
            <button
              onClick={() => setCadence("monthly")}
              className={`rounded-full px-4 py-1.5 ${cadence === "monthly" ? "bg-foreground text-background" : "text-muted-foreground"}`}
            >Monthly</button>
            <button
              onClick={() => setCadence("yearly")}
              className={`rounded-full px-4 py-1.5 ${cadence === "yearly" ? "bg-foreground text-background" : "text-muted-foreground"}`}
            >Yearly / save 33%</button>
          </div>
          <p className="mt-3 text-[12px] text-muted-foreground">
            On the waitlist? Use code <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">EARLY50</span> for 50% off your first 3 months.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card/60 p-7">
            <h2 className="text-[20px] font-semibold">Free</h2>
            <p className="mt-1 text-[13.5px] text-muted-foreground">Try Nyvlo and use it for light weeks</p>
            <div className="mt-5 flex items-baseline gap-1.5">
              <span className="text-[42px] font-semibold tracking-tight">$0</span>
              <span className="text-[13px] text-muted-foreground">forever</span>
            </div>
            <ul className="mt-6 space-y-2.5">
              {["10 captures / month, 30 min each", "Browser recorder (mic)", "Up to 25 promises tracked", "7-day memory history", "Daily digest email"].map(f => (
                <li key={f} className="flex items-start gap-2.5 text-[14px]">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{f}
                </li>
              ))}
            </ul>
            <Link to="/auth" className="mt-7 inline-flex w-full items-center justify-center rounded-md border border-border bg-background px-4 py-2.5 text-[14px] font-medium hover:bg-muted">
              Get started
            </Link>
          </div>

          <div className="rounded-2xl border border-primary/40 bg-card p-7 shadow-[0_30px_80px_-30px_rgba(15,15,30,0.18)]">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[20px] font-semibold">Pro</h2>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">Most popular</span>
            </div>
            <p className="mt-1 text-[13.5px] text-muted-foreground">For founders, operators, and anyone with a packed week</p>
            <div className="mt-5 flex items-baseline gap-1.5">
              <span className="text-[42px] font-semibold tracking-tight">{proPrice}</span>
              <span className="text-[13px] text-muted-foreground">{proCadence}</span>
            </div>
            <ul className="mt-6 space-y-2.5">
              {[
                "Unlimited capture (mic + system audio)",
                "Desktop app with ScreenCaptureKit",
                "Unlimited promises + memory",
                "Auto-drafts and Friday recap",
                "Priority support",
              ].map(f => (
                <li key={f} className="flex items-start gap-2.5 text-[14px]">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{f}
                </li>
              ))}
            </ul>
            <button
              onClick={startCheckout}
              className="mt-7 inline-flex w-full items-center justify-center rounded-md bg-foreground px-4 py-2.5 text-[14px] font-medium text-background hover:opacity-90"
            >
              Upgrade to Pro
            </button>
          </div>
        </div>

        <p className="mx-auto mt-12 max-w-xl text-center text-[12.5px] text-muted-foreground">
          Questions about pricing or volume?{" "}
          <a href="mailto:keila@nyvloai.com" className="underline">keila@nyvloai.com</a>
        </p>
      </main>
    </div>
  );
}
