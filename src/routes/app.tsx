// Chief of Staff — the workspace. Single hero surface: the canvas
// where the agent fans out across tools the moment a call ends.

import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";
import { Canvas } from "@/components/cos/Canvas";
import { useClientStamp } from "@/lib/loop/useClientStamp";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      {
        title:
          "Compound — the Chief of Staff for Customer Success",
      },
    ],
  }),
  component: WorkspaceApp,
});

function WorkspaceApp() {
  const stamp = useClientStamp();
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border shrink-0">
        <div className="h-12 flex items-center justify-between px-4">
          <div className="flex items-center gap-5">
            <Link to="/" className="flex items-center gap-2">
              <Logo size={18} />
              <span className="font-display font-semibold tracking-tight text-sm">
                Compound
              </span>
              <span className="hidden md:inline text-[11px] text-muted-foreground font-mono">
                · Chief of Staff for CSMs
              </span>
            </Link>
            <span
              className="hidden md:inline text-[11px] font-mono text-muted-foreground tabular-nums"
              suppressHydrationWarning
            >
              {stamp}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono text-muted-foreground">
            <span className="hidden sm:inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-success animate-pulse" />
              Listening on 4 tools
            </span>
            <div className="size-7 rounded-full bg-foreground/5 border border-border text-[10px] font-semibold flex items-center justify-center">
              SC
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <Canvas />
      </main>
    </div>
  );
}
