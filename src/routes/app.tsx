// Multi-persona workspace: CSM / Manager / Leader as distinct surfaces.
// Persona is URL-driven via ?role= so views are deep-linkable.

import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";
import { PersonaToggle } from "@/components/loop/PersonaToggle";
import { CsmSurface } from "@/components/loop/surfaces/CsmSurface";
import { ManagerSurface } from "@/components/loop/surfaces/ManagerSurface";
import { LeaderSurface } from "@/components/loop/surfaces/LeaderSurface";
import { useClientStamp } from "@/lib/loop/useClientStamp";
import type { PersonaId } from "@/lib/loop/personas";

type AppSearch = { role?: PersonaId; demo?: boolean };

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      {
        title: "Tandem · The outcome ledger for Customer Success",
      },
      {
        name: "description",
        content:
          "Three surfaces, one ledger. CSM closes line items. Manager coaches the bar. Leader audits the number. Every action cited and revertible.",
      },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): AppSearch => ({
    role: (s.role as PersonaId) ?? "csm",
    demo: s.demo === true || s.demo === "true",
  }),
  component: PersonaWorkspace,
});

function PersonaWorkspace() {
  const { role = "csm" } = useSearch({ from: "/app" });
  const navigate = useNavigate({ from: "/app" });
  const stamp = useClientStamp();

  const setRole = (id: PersonaId) =>
    navigate({ search: (prev) => ({ ...prev, role: id }), replace: true });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border sticky top-0 z-40 bg-background/85 backdrop-blur">
        <div className="max-w-5xl mx-auto h-14 flex items-center justify-between gap-3 px-6">
          <div className="flex items-center gap-4 min-w-0">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <Logo size={18} />
              <span className="font-display font-semibold tracking-tight text-sm">Tandem</span>
            </Link>
            <span
              className="hidden md:inline text-[11px] font-mono text-muted-foreground tabular-nums"
              suppressHydrationWarning
            >
              {stamp}
            </span>
            <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
              <span className="size-1.5 rounded-full bg-success animate-pulse" />
              Listening on Gong · Salesforce · Slack · LinkedIn
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <PersonaToggle value={role} onChange={setRole} />
            <div className="size-7 rounded-full bg-foreground/5 border border-border text-[10px] font-semibold hidden sm:flex items-center justify-center">
              {role === "csm" ? "SC" : role === "manager" ? "AM" : "VP"}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        {role === "manager" ? (
          <ManagerSurface />
        ) : role === "leader" ? (
          <LeaderSurface />
        ) : (
          <CsmSurface />
        )}
      </main>
    </div>
  );
}
