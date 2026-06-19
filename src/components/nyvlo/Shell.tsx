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
        <aside className="sticky top-0 hidden h-dvh w-[244px] shrink-0 flex-col border-r border-border/80 bg-secondary px-4 py-6 md:flex">
          <Link to="/" className="mb-7 flex items-center gap-2 px-2">
            <NyvloMark size="lg" />
          </Link>

          <button
            onClick={() => setPaletteOpen(true)}
            aria-label="Ask Nyvlo (open command palette)"
            className="mb-5 flex items-center gap-2 rounded-md border border-border bg-background/80 px-2.5 py-1.5 text-left text-xs text-muted-foreground hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="flex-1">Ask Nyvlo…</span>
            <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">⌘J</kbd>
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
                    "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13.5px] transition-colors",
                    active
                      ? "bg-foreground/[0.06] text-foreground"
                      : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                  <span>{n.label}</span>
                </Link>
              );
            })}
            {adminStatus?.isAdmin && (
              <Link
                to="/admin"
                className={[
                  "mt-2 flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13.5px] transition-colors",
                  pathname.startsWith("/admin")
                    ? "bg-foreground/[0.06] text-foreground"
                    : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground",
                ].join(" ")}
              >
                <ShieldCheck className="h-4 w-4" strokeWidth={1.75} />
                <span>Operator</span>
              </Link>
            )}
          </nav>

          <div className="mt-auto rounded-lg border border-border bg-background p-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                {displayName[0]?.toUpperCase() ?? "?"}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-medium">{displayName}</div>
                <div className="truncate text-[11px] text-muted-foreground">{displayEmail}</div>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              {connection ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  Google connected
                </>
              ) : (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                  <Link to="/app/settings" className="hover:underline">Not connected</Link>
                </>
              )}
            </div>
            <button
              onClick={signOut}
              className="mt-2 flex w-full items-center gap-1.5 rounded px-1 py-1 text-[11px] text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-3 w-3" /> Sign out
            </button>
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <header className="sticky top-0 z-10 border-b border-border/70 bg-background/80 px-6 py-5 backdrop-blur md:px-10 md:py-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-[22px] font-semibold tracking-tight text-foreground md:text-[26px]">{title}</h1>
                {subtitle ? (
                  <p className="mt-0.5 text-[13.5px] text-muted-foreground">{subtitle}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <NotificationBell />
                <button
                  onClick={() => setPaletteOpen(true)}
                  className="hidden items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent md:inline-flex"
                >
                  <Command className="h-3.5 w-3.5" /> Ask Nyvlo
                </button>
              </div>
            </div>
          </header>

          <div className="px-6 py-7 md:px-10 md:py-10">{children}</div>
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}

export function NyvloMark({
  className = "",
  size = "md",
  animated = false,
  withWordmark = false,
}: {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  animated?: boolean;
  withWordmark?: boolean;
}) {
  const px = size === "sm" ? 24 : size === "lg" ? 44 : size === "xl" ? 88 : 32;
  const wordSize =
    size === "sm" ? "text-[15px]" :
    size === "lg" ? "text-[22px]" :
    size === "xl" ? "text-[40px]" :
    "text-[18px]";
  return (
    <span className={["inline-flex items-center gap-2.5 shrink-0", className].join(" ")}>
      <svg
        width={px}
        height={px}
        viewBox="0 0 64 64"
        fill="none"
        aria-label="Nyvlo"
        className="shrink-0"
        style={{ filter: "drop-shadow(0 0 14px oklch(0.70 0.20 28 / 55%))" }}
      >
        <defs>
          <radialGradient id="nyvlo-core" cx="50%" cy="42%" r="55%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="35%" stopColor="oklch(0.92 0.10 35)" />
            <stop offset="75%" stopColor="oklch(0.70 0.20 28)" />
            <stop offset="100%" stopColor="oklch(0.45 0.20 22)" />
          </radialGradient>
          <linearGradient id="nyvlo-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.92 0.10 35)" stopOpacity="1" />
            <stop offset="50%" stopColor="oklch(0.75 0.20 28)" stopOpacity="0.85" />
            <stop offset="100%" stopColor="oklch(0.55 0.20 22)" stopOpacity="0.25" />
          </linearGradient>
          <radialGradient id="nyvlo-halo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="oklch(0.75 0.20 28)" stopOpacity="0.55" />
            <stop offset="60%" stopColor="oklch(0.65 0.20 25)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        {/* Soft halo */}
        <circle cx="32" cy="32" r="28" fill="url(#nyvlo-halo)" />

        {/* Outer ring with satellite */}
        <g className={animated ? "nyvlo-orbit-slow" : ""} style={{ transformOrigin: "32px 32px" }}>
          <circle cx="32" cy="32" r="24" stroke="url(#nyvlo-ring)" strokeWidth="1.5" fill="none" />
          <circle cx="56" cy="32" r="2.4" fill="#ffffff" />
          <circle cx="56" cy="32" r="4" fill="oklch(0.75 0.20 28)" opacity="0.45" />
        </g>

        {/* Inner ring counter-rotating */}
        <g className={animated ? "nyvlo-orbit-rev" : ""} style={{ transformOrigin: "32px 32px" }}>
          <circle cx="32" cy="32" r="16" stroke="oklch(0.85 0.14 32)" strokeOpacity="0.5" strokeWidth="1" fill="none" strokeDasharray="2 3" />
          <circle cx="16" cy="32" r="1.8" fill="oklch(0.95 0.05 35)" />
        </g>

        {/* Glowing core */}
        <circle cx="32" cy="32" r="14" fill="oklch(0.70 0.20 28)" opacity="0.22" />
        <circle cx="32" cy="32" r="8.5" fill="url(#nyvlo-core)" />
        {/* Specular highlight */}
        <ellipse cx="29" cy="29" rx="2.6" ry="1.6" fill="#ffffff" opacity="0.85" />
      </svg>
      {withWordmark && (
        <span className={`font-display ${wordSize} font-semibold tracking-[-0.025em] text-foreground`}>
          Nyvlo
        </span>
      )}
    </span>
  );
}
