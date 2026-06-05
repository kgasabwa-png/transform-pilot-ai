// Receipts — the closing crew.
// Thin shell: top bar, persona tabs, sample-book banner. The three
// persona screens own all their state and modals. This file knows
// nothing about actions, deltas, or coaching moments.

import { createFileRoute, Link, useSearch, useNavigate } from "@tanstack/react-router";
import { Users, LayoutGrid, TrendingUp } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { ApprovalQueue } from "@/components/loop/ApprovalQueue";
import { CoachingRoom } from "@/components/loop/CoachingRoom";
import { ForecastFloor } from "@/components/loop/ForecastFloor";
import { shortStamp } from "@/lib/loop/time";
import type { PersonaId } from "@/lib/loop/personas";

type AppSearch = { role: PersonaId; demo?: boolean };

export const Route = createFileRoute("/app")({
  validateSearch: (search: Record<string, unknown>): AppSearch => {
    const r = search.role;
    const role: PersonaId =
      r === "manager" || r === "leader" || r === "csm" ? r : "csm";
    return {
      role,
      demo: search.demo === true || search.demo === "1" || search.demo === "true",
    };
  },
  head: () => ({
    meta: [{ title: "Receipts — the closing crew" }],
  }),
  component: WorkspaceApp,
});

const TABS: {
  id: PersonaId;
  label: string;
  product: string;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "csm", label: "CSM", product: "Approval Queue", Icon: Users },
  { id: "manager", label: "Manager", product: "Team Forecast", Icon: LayoutGrid },
  { id: "leader", label: "VP / CCO", product: "Forecast Floor", Icon: TrendingUp },
];

function WorkspaceApp() {
  const { role, demo } = useSearch({ from: "/app" });
  const navigate = useNavigate({ from: "/app" });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {demo && <SampleBanner />}
      <TopBar
        persona={role}
        onPersona={(p) =>
          navigate({ search: (prev: AppSearch) => ({ ...prev, role: p }) })
        }
      />

      <main className="flex-1 overflow-y-auto">
        {role === "csm" && <ApprovalQueue />}
        {role === "manager" && <CoachingRoom />}
        {role === "leader" && <ForecastFloor />}
      </main>
    </div>
  );
}

// ───────────────────────── SAMPLE BANNER ─────────────────────────

function SampleBanner() {
  return (
    <div className="border-b border-border/60 bg-muted/40 backdrop-blur-sm px-4 py-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[12px]">
      <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
        <span className="size-1.5 rounded-full bg-success animate-pulse" />
        Sample book
      </span>
      <span className="text-foreground/75">
        You're previewing as{" "}
        <span className="font-medium text-foreground">Sarah Chen</span>, CSM · 12 live accounts · nothing leaves your browser.
      </span>
      <Link
        to="/waitlist"
        className="inline-flex items-center gap-1 text-foreground font-medium underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground transition-colors"
      >
        Run it on your book <span aria-hidden>→</span>
      </Link>
    </div>
  );
}

// ───────────────────────── TOP BAR ─────────────────────────

function TopBar({
  persona,
  onPersona,
}: {
  persona: PersonaId;
  onPersona: (p: PersonaId) => void;
}) {
  const active = TABS.find((t) => t.id === persona);
  return (
    <header className="border-b border-border shrink-0">
      {/* Row 1: brand + meta + avatar */}
      <div className="h-12 flex items-center justify-between px-4">
        <div className="flex items-center gap-5">
          <Link to="/" className="flex items-center gap-2">
            <Logo size={18} />
            <span className="font-display font-semibold tracking-tight text-sm">
              Receipts
            </span>
            <span className="hidden md:inline text-[11px] text-muted-foreground font-mono">
              · the closing crew
            </span>
          </Link>
          <span className="hidden md:inline text-[11px] font-mono text-muted-foreground">
            {shortStamp()}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="size-7 rounded-full bg-foreground/5 border border-border text-[10px] font-mono font-semibold flex items-center justify-center">
            SC
          </div>
        </div>
      </div>

      {/* Row 2: persona tabs — these are different products */}
      <nav className="flex items-end gap-1 px-4 -mb-px overflow-x-auto" role="tablist">
        {TABS.map((t) => {
          const isActive = t.id === persona;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onPersona(t.id)}
              className={`group inline-flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors ${
                isActive
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.Icon className="size-3.5" />
              <span className="text-[11px] font-mono uppercase tracking-[0.14em]">
                {t.label}
              </span>
              <span className="text-sm font-display font-medium">
                {t.product}
              </span>
            </button>
          );
        })}
        <div className="ml-auto hidden md:flex items-center gap-2 pb-2 text-[11px] font-mono text-muted-foreground">
          <span className="size-1.5 rounded-full bg-success animate-pulse" />
          4 agents · working
        </div>
      </nav>
    </header>
  );
}
