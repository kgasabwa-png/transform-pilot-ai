import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Shell } from "@/components/nyvlo/Shell";
import { ExtensionSection } from "@/components/nyvlo/ExtensionSection";
import { getProfile } from "@/lib/nyvlo/profile.functions";
import { startGoogleOAuth, disconnectGoogle, runSyncNow } from "@/lib/nyvlo/google.functions";
import { getGmailConnection, startGmailOAuth, disconnectGmail } from "@/lib/nyvlo/gmail.functions";
import { Check, ShieldCheck, Globe, LogOut, RefreshCw, Mail, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";

const GMAIL_STATUS_MESSAGES: Record<string, { kind: "success" | "error"; message: string }> = {
  connected: { kind: "success", message: "Gmail connected" },
  error: { kind: "error", message: "Gmail connect was cancelled or failed" },
  bad_state: { kind: "error", message: "Gmail connect expired. Please try again." },
  failed: { kind: "error", message: "Gmail connect failed. Please try again." },
};

export const Route = createFileRoute("/_authenticated/app/settings")({
  head: () => ({ meta: [{ title: "Settings · Nyvlo" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchProfile = useServerFn(getProfile);
  const startOAuth = useServerFn(startGoogleOAuth);
  const disconnect = useServerFn(disconnectGoogle);
  const syncNow = useServerFn(runSyncNow);
  const fetchGmail = useServerFn(getGmailConnection);
  const startGmail = useServerFn(startGmailOAuth);
  const disconnectGmailFn = useServerFn(disconnectGmail);
  const [busy, setBusy] = useState<string | null>(null);

  const { data } = useQuery({ queryKey: ["profile"], queryFn: () => fetchProfile() });
  const { data: gmailData } = useQuery({ queryKey: ["gmail-connection"], queryFn: () => fetchGmail() });
  const profile = data?.profile;
  const connection = data?.connection;
  const gmail = gmailData?.connection;

  // Surface ?gmail=connected|error|... left by the OAuth callback redirect.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("gmail");
    if (!status) return;
    const entry = GMAIL_STATUS_MESSAGES[status];
    if (entry) {
      toast[entry.kind](entry.message);
      if (status === "connected") {
        queryClient.invalidateQueries({ queryKey: ["gmail-connection"] });
      }
    }
    params.delete("gmail");
    const next = params.toString();
    window.history.replaceState(
      {},
      "",
      window.location.pathname + (next ? `?${next}` : ""),
    );
  }, [queryClient]);

  const handleConnect = async () => {
    setBusy("connect");
    try {
      const { url } = await startOAuth();
      window.location.href = url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't start Google sign-in");
      setBusy(null);
    }
  };

  const handleDisconnect = async () => {
    setBusy("disconnect");
    try {
      await disconnect();
      toast.success("Disconnected");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    } finally {
      setBusy(null);
    }
  };

  const handleSync = async () => {
    setBusy("sync");
    try {
      const res = await syncNow();
      toast.success(`Synced ${res.synced} new items · extracted ${res.promises} promises`);
      queryClient.invalidateQueries();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setBusy(null);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const handleConnectGmail = () => {
    // Open a same-origin handoff page synchronously so the popup is not
    // blocked, then let it fetch the Google OAuth URL and navigate itself.
    const popup = window.open("/app/gmail-connect", "_blank");
    if (!popup) {
      toast.error("Popup blocked. Allow popups for this site, then try again.");
      return;
    }
    setBusy("gmail-connect");
    window.setTimeout(() => setBusy(null), 900);
  };

  const handleDisconnectGmail = async () => {
    setBusy("gmail-disconnect");
    try {
      await disconnectGmailFn();
      toast.success("Gmail disconnected");
      queryClient.invalidateQueries({ queryKey: ["gmail-connection"] });
    } finally {
      setBusy(null);
    }
  };


  return (
    <Shell title="Settings" subtitle="You control what Nyvlo connects to and remembers.">
      <div className="grid gap-6 md:grid-cols-2">
        <Section title="Account">
          <Row label="Name" value={profile?.full_name ?? "—"} />
          <Row label="Email" value={profile?.email ?? "—"} />
          <Row label="Timezone" value={profile?.timezone ?? "UTC"} />
          <div className="border-t border-border px-4 py-3">
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </Section>

        <Section title="Connections">
          <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 last:border-b-0">
            <div className="flex items-start gap-3 min-w-0">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <div className="text-[13.5px] font-medium">Google Calendar</div>
                <div className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
                  {connection
                    ? `${connection.google_email ?? "Connected"}${connection.last_synced_at ? ` · synced ${formatDistanceToNow(new Date(connection.last_synced_at), { addSuffix: true })}` : " · never synced"}`
                    : "Read-only access to find your promises"}
                </div>
              </div>
            </div>
            {connection ? (
              <div className="flex shrink-0 items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-md bg-success/15 px-2 py-0.5 text-[11.5px] font-medium text-success">
                  <Check className="h-3 w-3" /> Connected
                </span>
                <button
                  onClick={handleSync}
                  disabled={busy === "sync"}
                  className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-[11.5px] hover:bg-muted disabled:opacity-50"
                >
                  <RefreshCw className={`h-3 w-3 ${busy === "sync" ? "animate-spin" : ""}`} /> Sync
                </button>
                <button
                  onClick={handleDisconnect}
                  disabled={busy === "disconnect"}
                  className="rounded-md border border-border px-2.5 py-1 text-[11.5px] text-muted-foreground hover:bg-muted disabled:opacity-50"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnect}
                disabled={busy === "connect"}
                className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-50"
              >
                {busy === "connect" ? "Opening…" : "Connect"}
              </button>
            )}
          </div>

          <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 last:border-b-0">
            <div className="flex items-start gap-3 min-w-0">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <div className="text-[13.5px] font-medium">Gmail</div>
                <div className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
                  {gmail
                    ? `${gmail.email}${gmail.last_sync_at ? ` · synced ${formatDistanceToNow(new Date(gmail.last_sync_at), { addSuffix: true })}` : " · never synced"}`
                    : "Read and send email on your behalf"}
                </div>
              </div>
            </div>
            {gmail ? (
              <div className="flex shrink-0 items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-md bg-success/15 px-2 py-0.5 text-[11.5px] font-medium text-success">
                  <Check className="h-3 w-3" /> Connected
                </span>
                <button
                  onClick={handleDisconnectGmail}
                  disabled={busy === "gmail-disconnect"}
                  className="rounded-md border border-border px-2.5 py-1 text-[11.5px] text-muted-foreground hover:bg-muted disabled:opacity-50"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnectGmail}
                disabled={busy === "gmail-connect"}
                className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-50"
              >
                {busy === "gmail-connect" ? "Opening…" : "Connect"}
              </button>
            )}
          </div>
        </Section>

        <ExtensionSection />

        <Section title="Privacy">
          <Info
            Icon={ShieldCheck}
            label="Read-only access"
            hint="Nyvlo only reads — never sends, deletes, or modifies anything in your Google account."
          />
          <Info
            Icon={Globe}
            label="Your data stays yours"
            hint="We never train shared models on your memory. Disconnect anytime to delete everything."
          />
        </Section>
      </div>
    </Shell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="border-b border-border bg-secondary/30 px-4 py-2.5 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{title}</div>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border px-4 py-3 last:border-b-0">
      <span className="text-[12.5px] text-muted-foreground">{label}</span>
      <span className="text-[13.5px]">{value}</span>
    </div>
  );
}

function Info({ Icon, label, hint }: { Icon: typeof ShieldCheck; label: string; hint: string }) {
  return (
    <div className="flex items-start gap-3 border-b border-border px-4 py-3 last:border-b-0">
      <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
      <div>
        <div className="text-[13.5px]">{label}</div>
        <div className="text-[11.5px] text-muted-foreground">{hint}</div>
      </div>
    </div>
  );
}
