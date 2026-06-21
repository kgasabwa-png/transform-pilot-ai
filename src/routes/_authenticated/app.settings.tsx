import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Shell } from "@/components/nyvlo/Shell";
import { ExtensionSection } from "@/components/nyvlo/ExtensionSection";
import { getProfile } from "@/lib/nyvlo/profile.functions";
import { startGoogleOAuth, disconnectGoogle, runSyncNow } from "@/lib/nyvlo/google.functions";
import { getGmailConnection, startGmailOAuth, disconnectGmail } from "@/lib/nyvlo/gmail.functions";
import { Check, ShieldCheck, Globe, LogOut, RefreshCw, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

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
  const [busy, setBusy] = useState<string | null>(null);

  const { data } = useQuery({ queryKey: ["profile"], queryFn: () => fetchProfile() });
  const profile = data?.profile;
  const connection = data?.connection;

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
            <div>
              <div className="text-[13.5px] font-medium">Google Calendar</div>
              <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                {connection
                  ? `${connection.google_email ?? "Connected"}${connection.last_synced_at ? ` · synced ${formatDistanceToNow(new Date(connection.last_synced_at), { addSuffix: true })}` : " · never synced"}`
                  : "Read-only access to find your promises"}
              </div>
            </div>
            {connection ? (
              <div className="flex items-center gap-1.5">
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
                <span className="inline-flex items-center gap-1 rounded-md bg-success/15 px-2 py-0.5 text-[11.5px] font-medium text-success">
                  <Check className="h-3 w-3" /> Connected
                </span>
              </div>
            ) : (
              <button
                onClick={handleConnect}
                disabled={busy === "connect"}
                className="rounded-md bg-foreground px-3 py-1.5 text-[12px] font-medium text-background hover:opacity-90 disabled:opacity-50"
              >
                {busy === "connect" ? "Opening…" : "Connect Google"}
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
