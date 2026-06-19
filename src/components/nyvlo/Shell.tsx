import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Inbox, Clock, Sparkles, Settings, Command, Search, BookMarked, LogOut, ShieldCheck, Radio } from "lucide-react";
import { CommandPalette } from "./CommandPalette";
import { NotificationBell } from "./NotificationBell";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getProfile } from "@/lib/nyvlo/profile.functions";
import { getMyAdminStatus } from "@/lib/admin/admin.functions";
import { supabase } from "@/integrations/supabase/client";

const nav = [
  { to: "/app", label: "Today", icon: Sparkles, exact: true },
  { to: "/app/promises", label: "Promises", icon: Inbox },
  { to: "/app/capture", label: "Live Capture", icon: Radio },
  { to: "/app/memory", label: "Memory", icon: Clock },
  { to: "/app/command", label: "Command Center", icon: BookMarked },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

export function Shell({ children, title, subtitle }: { children: ReactNode; title: string; subtitle?: string }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const fetchProfile = useServerFn(getProfile);
  const fetchAdmin = useServerFn(getMyAdminStatus);

  const { data } = useQuery({
    queryKey: ["profile"],
    queryFn: () => fetchProfile(),
    staleTime: 60_000,
  });
  const { data: adminStatus } = useQuery({
    queryKey: ["admin-status"],
    queryFn: () => fetchAdmin(),
    staleTime: 60_000,
  });

  const profile = data?.profile;
  const connection = data?.connection;
  const displayName = profile?.full_name || profile?.email?.split("@")[0] || "You";
  const displayEmail = profile?.email || "";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto flex max-w-[1400px]">
        <aside className="sticky top-0 hidden h-dvh w-[240px] shrink-0 flex-col border-r border-border/60 bg-secondary/30 px-4 py-6 md:flex">
          <Link to="/" className="mb-8 flex items-center px-2">
            <NyvloMark size="lg" />
          </Link>

          <button
            onClick={() => setPaletteOpen(true)}
            aria-label="Ask Nyvlo (open command palette)"
            className="mb-6 flex items-center gap-2.5 rounded-lg border border-border bg-background/50 px-3 py-2 text-left text-[13px] text-muted-foreground transition-all hover:bg-background hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Search className="h-4 w-4 opacity-70" />
            <span className="flex-1">Search or ask…</span>
            <kbd className="rounded border border-border/50 bg-muted/50 px-1.5 py-0.5 font-mono text-[10px] tracking-widest text-muted-foreground/80">⌘J</kbd>
          </button>

          <nav className="flex flex-col gap-0.5">
            {nav.map((n) => {
              const Icon = n.icon;
              const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={[
                    "group flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] font-medium transition-all",
                    active
                      ? "bg-foreground/5 text-foreground shadow-[inset_0_1px_0_0_rgba(0,0,0,0.02)]"
                      : "text-muted-foreground hover:bg-foreground/[0.03] hover:text-foreground",
                  ].join(" ")}
                >
                  <Icon className={["h-4 w-4 transition-colors", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"].join(" ")} strokeWidth={2} />
                  <span>{n.label}</span>
                </Link>
              );
            })}
            {adminStatus?.isAdmin && (
              <Link
                to="/admin"
                className={[
                  "mt-3 flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] font-medium transition-all",
                  pathname.startsWith("/admin")
                    ? "bg-foreground/5 text-foreground"
                    : "text-muted-foreground hover:bg-foreground/[0.03] hover:text-foreground",
                ].join(" ")}
              >
                <ShieldCheck className="h-4 w-4" strokeWidth={2} />
                <span>Operator</span>
              </Link>
            )}
          </nav>

          <div className="mt-auto rounded-xl border border-border/60 bg-background/50 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-[12px] font-bold text-primary ring-1 ring-primary/20">
                {displayName[0]?.toUpperCase() ?? "?"}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold leading-none">{displayName}</div>
                <div className="mt-1 truncate text-[11px] text-muted-foreground opacity-70">{displayEmail}</div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-[11px] font-medium">
              {connection ? (
                <span className="flex items-center gap-1.5 text-success">
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  Live Sync
                </span>
              ) : (
                <Link to="/app/settings" className="flex items-center gap-1.5 text-warning hover:underline">
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  Connect Google
                </Link>
              )}
            </div>
            <button
              onClick={signOut}
              className="group mt-4 flex w-full items-center gap-2 rounded-lg border border-transparent bg-secondary/50 px-2 py-1.5 text-[11px] font-medium text-muted-foreground transition-all hover:bg-destructive/5 hover:text-destructive"
            >
              <LogOut className="h-3.5 w-3.5 opacity-60 transition-colors group-hover:opacity-100" /> Sign out
            </button>
          </div>
        </aside>

        <main className="flex-1 min-w-0 bg-background/50">
          <header className="sticky top-0 z-10 border-b border-border/40 bg-background/60 px-6 py-6 backdrop-blur-xl md:px-10 md:py-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-[24px] font-bold tracking-tight text-foreground md:text-[28px]">{title}</h1>
                {subtitle ? (
                  <p className="mt-1 text-[14px] font-medium text-muted-foreground/80">{subtitle}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-3">
                <NotificationBell />
                <button
                  onClick={() => setPaletteOpen(true)}
                  className="hidden items-center gap-2.5 rounded-lg border border-border bg-card px-4 py-2 text-[13px] font-medium text-muted-foreground transition-all hover:bg-accent hover:text-foreground md:inline-flex"
                >
                  <Command className="h-4 w-4" /> Ask Nyvlo
                </button>
              </div>
            </div>
          </header>

          <div className="px-6 py-8 md:px-10 md:py-12">{children}</div>
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}

export function NyvloMark({ className = "", size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: { text: "text-[16px]", dot: "h-1.5 w-1.5 mb-[1px]", gap: "gap-1" },
    md: { text: "text-[19px]", dot: "h-[7px] w-[7px] mb-[1.5px]", gap: "gap-1.5" },
    lg: { text: "text-[23px]", dot: "h-2 w-2 mb-[2px]", gap: "gap-2" },
  };
  const s = sizes[size];
  
  return (
    <span className={["inline-flex items-end font-bold tracking-[-0.05em] text-foreground transition-opacity hover:opacity-90", s.text, s.gap, className].join(" ")}>
      <span className="leading-none">nyvlo</span>
      <span className={["rounded-full bg-primary shadow-[0_0_10px_-2px_var(--primary)]", s.dot].join(" ")} aria-hidden />
    </span>
  );
}
