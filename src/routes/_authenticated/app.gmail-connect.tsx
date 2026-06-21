import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { startGmailOAuth } from "@/lib/nyvlo/gmail.functions";

export const Route = createFileRoute("/_authenticated/app/gmail-connect")({
  head: () => ({ meta: [{ title: "Connect Gmail · Nyvlo" }] }),
  component: GmailConnectPage,
});

function GmailConnectPage() {
  const startGmail = useServerFn(startGmailOAuth);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { url } = await startGmail();
        if (cancelled) return;
        try {
          window.opener = null;
        } catch {
          // Best effort only; navigation should still continue.
        }
        window.location.assign(url);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Couldn't start Gmail connect");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [startGmail]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-6 text-foreground">
      <div className="w-full max-w-sm text-center">
        {error ? (
          <>
            <h1 className="text-xl font-semibold tracking-tight">Gmail connect failed</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{error}</p>
            <Link
              to="/app/settings"
              className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Back to settings
            </Link>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
            <h1 className="mt-4 text-xl font-semibold tracking-tight">Opening Gmail</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Continue in this tab to finish connecting Gmail.
            </p>
          </>
        )}
      </div>
    </main>
  );
}