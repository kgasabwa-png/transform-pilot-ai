import { createFileRoute, Link } from "@tanstack/react-router";
import { NyvloMark } from "@/components/nyvlo/Shell";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service · Nyvlo" },
      { name: "description", content: "Terms of service for using Nyvlo." },
    ],
  }),
  component: Terms,
});

function Terms() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <Link to="/"><NyvloMark size="lg" /></Link>
        <Link to="/" className="text-[13px] text-muted-foreground hover:text-foreground">← Home</Link>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-[40px] font-semibold tracking-tight">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: June 19, 2026</p>

        <div className="prose prose-neutral mt-10 max-w-none text-[15px] leading-relaxed">
          <p>
            These terms govern your use of Nyvlo. By creating an account you agree to them. If you
            disagree, don't use the service.
          </p>

          <h2 className="mt-10 text-xl font-semibold">Your account</h2>
          <p className="mt-3">
            You must be at least 16 years old. You're responsible for what happens under your
            account, including any captures you start. Keep your sign-in credentials safe.
          </p>

          <h2 className="mt-10 text-xl font-semibold">Acceptable use</h2>
          <ul className="mt-3 space-y-1.5">
            <li>Don't record people without disclosure where the law requires it.</li>
            <li>Don't use Nyvlo to harass, surveil, or deceive others.</li>
            <li>Don't try to break, reverse, or overload our infrastructure.</li>
            <li>Don't upload content you don't have rights to.</li>
          </ul>

          <h2 className="mt-10 text-xl font-semibold">Beta software</h2>
          <p className="mt-3">
            Nyvlo is in active development. Features may change, break, or be removed. We aim for
            high reliability but offer no uptime guarantee during beta.
          </p>

          <h2 className="mt-10 text-xl font-semibold">Pricing</h2>
          <p className="mt-3">
            Nyvlo is free during beta. Pricing and limits will be announced before any plan is
            charged; you will not be charged without explicit consent.
          </p>

          <h2 className="mt-10 text-xl font-semibold">Your data</h2>
          <p className="mt-3">
            You own your data. We process it to provide the service as described in our{" "}
            <Link to="/privacy" className="underline">Privacy Policy</Link>. You can delete it any
            time.
          </p>

          <h2 className="mt-10 text-xl font-semibold">Termination</h2>
          <p className="mt-3">
            You can stop using Nyvlo any time. We can suspend or terminate accounts that violate
            these terms, with notice when reasonable.
          </p>

          <h2 className="mt-10 text-xl font-semibold">Liability</h2>
          <p className="mt-3">
            Nyvlo is provided "as is". To the maximum extent permitted by law, Nyvlo and its team
            are not liable for indirect or consequential damages. Total liability is capped at the
            fees you paid in the prior 12 months (which during beta is zero).
          </p>

          <h2 className="mt-10 text-xl font-semibold">Contact</h2>
          <p className="mt-3">
            Questions: <a href="mailto:keila@nyvloai.com" className="underline">keila@nyvloai.com</a>.
          </p>
        </div>
      </main>
    </div>
  );
}
