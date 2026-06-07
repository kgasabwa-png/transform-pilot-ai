// Persona workspace: CSM / Manager / Leader as distinct surfaces inside the AppShell.
// Persona is URL-driven via ?role= so views are deep-linkable.

import { createFileRoute } from "@tanstack/react-router";
import { useSearch } from "@tanstack/react-router";
import { AppShell } from "@/components/loop/AppShell";
import { CsmSurface } from "@/components/loop/surfaces/CsmSurface";
import { ManagerSurface } from "@/components/loop/surfaces/ManagerSurface";
import { LeaderSurface } from "@/components/loop/surfaces/LeaderSurface";
import type { PersonaId } from "@/lib/loop/personas";

type AppSearch = { role?: PersonaId; demo?: boolean };

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Tandem · the outcome ledger for Customer Success" },
      {
        name: "description",
        content:
          "Tandem operates your book in the background. You resolve the 5% only you can. Every action cited and revertible.",
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
  return (
    <AppShell>
      {role === "manager" ? <ManagerSurface /> : role === "leader" ? <LeaderSurface /> : <CsmSurface />}
    </AppShell>
  );
}
