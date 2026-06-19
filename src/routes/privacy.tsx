import { createFileRoute, Link } from "@tanstack/react-router";
import { NyvloMark } from "@/components/nyvlo/Shell";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy · Nyvlo" },
      { name: "description", content: "How Nyvlo handles your data, recordings, and connections." },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <Link to="/"><NyvloMark size="lg" /></Link>
        <Link to="/" className="text-[13px] text-muted-foreground hover:text-foreground">← Home</Link>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-[40px] font-semibold tracking-tight">Privacy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: June 19, 2026</p>

        <div className="prose prose-neutral mt-10 max-w-none text-[15px] leading-relaxed">
          <p>
            This page is maintained by Nyvlo (operated by the Nyvlo team) to answer common privacy
            questions about the Nyvlo product. It is not a legal opinion or a certification.
          </p>

          <h2 className="mt-10 text-xl font-semibold">What we collect</h2>
          <ul className="mt-3 space-y-1.5">
            <li>Account: name, email, profile photo from Google sign-in.</li>
            <li>Connections: read-only access to your Google Calendar and Gmail metadata only when you connect them.</li>
            <li>Captures: meeting audio, screen frames, and text snippets that <em>you</em> start a capture session for, via the desktop app, browser recorder, or Chrome extension.</li>
            <li>Product analytics: page views, button clicks, and feature usage to improve the product.</li>
          </ul>

          <h2 className="mt-10 text-xl font-semibold">What we do not collect</h2>
          <ul className="mt-3 space-y-1.5">
            <li>No silent or background screen / audio capture. Capture only runs while a session is active and the indicator is visible.</li>
            <li>No employer or admin dashboard sees your raw captures.</li>
            <li>No sale of personal data, ever.</li>
          </ul>

          <h2 className="mt-10 text-xl font-semibold">How captures are processed</h2>
          <p className="mt-3">
            Audio is sent over HTTPS to our backend, transcribed by a language model, and then the
            short-lived audio chunk is retained only as long as needed to produce the transcript
            and extract promises. Screen frames are processed for OCR + a vision summary, then the
            raw image is similarly short-lived. The structured outputs (transcript, summary,
            extracted promises) are stored in your account and visible only to you.
          </p>

          <h2 className="mt-10 text-xl font-semibold">Subprocessors</h2>
          <ul className="mt-3 space-y-1.5">
            <li>Supabase — database, auth, file storage.</li>
            <li>Google — OAuth identity, Calendar API, Gmail API (read-only metadata).</li>
            <li>Lovable AI Gateway — model inference for transcription, vision, and extraction.</li>
            <li>Cloudflare — edge runtime for our backend functions.</li>
          </ul>

          <h2 className="mt-10 text-xl font-semibold">Your controls</h2>
          <ul className="mt-3 space-y-1.5">
            <li>Pause or stop any capture session from the Live Capture screen.</li>
            <li>Delete any session, promise, or memory item from inside the app.</li>
            <li>Disconnect Google or revoke the desktop / extension at any time in Settings.</li>
            <li>Email <a href="mailto:keila@nyvloai.com" className="underline">keila@nyvloai.com</a> to request a full data export or account deletion.</li>
          </ul>

          <h2 className="mt-10 text-xl font-semibold">Retention</h2>
          <p className="mt-3">
            We keep your account data while your account is active. Deleted items are removed from
            our primary database within 24 hours and from backups within 30 days. Anonymized
            usage analytics may be retained longer.
          </p>

          <h2 className="mt-10 text-xl font-semibold">Recording laws</h2>
          <p className="mt-3">
            You are responsible for complying with applicable recording laws in your jurisdiction.
            In two-party-consent regions (e.g. California, most of the EU), inform everyone in
            the meeting before starting a capture session.
          </p>

          <h2 className="mt-10 text-xl font-semibold">Contact</h2>
          <p className="mt-3">
            Privacy questions, deletion requests, or security reports:{" "}
            <a href="mailto:keila@nyvloai.com" className="underline">keila@nyvloai.com</a>.
          </p>
        </div>
      </main>
    </div>
  );
}
