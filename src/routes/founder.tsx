import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NyvloMark } from "@/components/nyvlo/Shell";
import { ArrowUpRight, Loader2, LogOut } from "lucide-react";

export const Route = createFileRoute("/founder")({
  ssr: false,
  head: () => ({ meta: [{ title: "Founder · Nyvlo" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: FounderPage,
});

type LinkRow = { to: string; label: string; desc: string; auth?: boolean };

const SURFACES: { title: string; items: LinkRow[] }[] = [
  {
    title: "Live app (signed-in surfaces)",
    items: [
      { to: "/app", label: "Today", desc: "Dashboard with attention + coming up", auth: true },
      { to: "/app/promises", label: "Promises", desc: "Full inbox of captured commitments", auth: true },
      { to: "/app/memory", label: "Memory", desc: "Long-term context Nyvlo remembers", auth: true },
      { to: "/app/command", label: "Command Center", desc: "Power tools + chat", auth: true },
      { to: "/app/settings", label: "Settings", desc: "Google connection, profile, mutes", auth: true },
    ],
  },
  {
    title: "Public surfaces",
    items: [
      { to: "/", label: "Landing", desc: "Marketing home" },
      { to: "/try", label: "Demo (/try)", desc: "Public sandbox with mock data" },
      { to: "/auth", label: "Auth", desc: "Sign in / sign up" },
    ],
  },
];

function FounderPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState<{ email: string | null } | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setSession(data.user ? { email: data.user.email ?? null } : null);
      setChecking(false);
    });
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  if (checking) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-center gap-2">
            <NyvloMark size="md" />
          </Link>
          <span className="rounded-full border border-border bg-secondary px-2.5 py-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">
            Founder
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-[28px] font-semibold tracking-tight">Quick access</h1>
        <p className="mt-1 text-[14px] text-muted-foreground">
          Every surface of Nyvlo in one place. Not indexed, not linked from the public site.
        </p>

        <div className="mt-6 rounded-lg border border-border bg-card p-4">
          {session ? (
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[13px] font-medium">Signed in as {session.email ?? "you"}</div>
                <p className="mt-0.5 text-[12.5px] text-muted-foreground">All signed-in links below will work.</p>
              </div>
              <button
                onClick={signOut}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[12.5px] hover:bg-muted"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[13px] font-medium">Not signed in</div>
                <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                  Sign in to access the live app surfaces.
                </p>
              </div>
              <button
                onClick={() => navigate({ to: "/auth" })}
                className="rounded-md bg-foreground px-3 py-1.5 text-[12.5px] font-medium text-background hover:opacity-90"
              >
                Sign in
              </button>
            </div>
          )}
        </div>

        {SURFACES.map((group) => (
          <section key={group.title} className="mt-8">
            <h2 className="mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {group.title}
            </h2>
            <div className="grid gap-2">
              {group.items.map((item) => {
                const disabled = item.auth && !session;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={(e) => {
                      if (disabled) {
                        e.preventDefault();
                        navigate({ to: "/auth" });
                      }
                    }}
                    className={`flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3 transition-shadow hover:shadow-sm ${
                      disabled ? "opacity-60" : ""
                    }`}
                  >
                    <div>
                      <div className="text-[14px] font-medium">{item.label}</div>
                      <div className="mt-0.5 text-[12px] text-muted-foreground">
                        {item.desc}
                        {disabled && " · sign in required"}
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                );
              })}
            </div>
          </section>
        ))}

        <section className="mt-8">
          <h2 className="mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Downloads
          </h2>
          <div className="grid gap-2">
            <a
              href="/nyvlo-extension.zip"
              className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3 hover:shadow-sm"
            >
              <div>
                <div className="text-[14px] font-medium">Chrome extension (.zip)</div>
                <div className="mt-0.5 text-[12px] text-muted-foreground">Unpacked build, load in chrome://extensions</div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </a>
            <a
              href="/nyvlo-desktop.zip"
              className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3 hover:shadow-sm"
            >
              <div>
                <div className="text-[14px] font-medium">Desktop app (.zip)</div>
                <div className="mt-0.5 text-[12px] text-muted-foreground">Electron build</div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </a>
          </div>
        </section>

        <p className="mt-10 text-[11.5px] text-muted-foreground">
          Bookmark this page. It's <code className="font-mono">/founder</code> — not linked from anywhere public.
        </p>
      </main>
    </div>
  );
}
