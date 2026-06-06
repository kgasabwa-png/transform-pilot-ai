import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";
import { ConfidenceLanes } from "@/components/loop/ConfidenceLanes";

export const Route = createFileRoute("/console")({
  head: () => ({
    meta: [
      {
        title: "Ledgerline Console · Autonomous on the inside. Human on the outside.",
      },
      {
        name: "description",
        content:
          "Three lanes — shipped, quick review, judgment — plus a watch lane for signals from the world. Every action pinned to the line it came from, 30-day revert on every row.",
      },
      {
        property: "og:title",
        content: "Ledgerline Console — the renewal early-warning system",
      },
      {
        property: "og:description",
        content:
          "Calls + CRM + the world (LinkedIn, news, layoffs) — pinned together with citations. The agent gets more autonomous as it learns your bar.",
      },
    ],
  }),
  component: ConsolePage,
});

function ConsolePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border sticky top-0 z-40 bg-background/85 backdrop-blur">
        <div className="max-w-4xl mx-auto px-6 h-12 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Logo size={18} />
            <span className="font-display font-semibold tracking-tight text-sm">
              Ledgerline
            </span>
            <span className="hidden md:inline text-[11px] text-muted-foreground font-mono ml-2">
              · Console
            </span>
          </Link>
          <div className="flex items-center gap-3 text-[11px] font-mono text-muted-foreground">
            <span className="hidden sm:inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-success animate-pulse" />
              Reading 4 surfaces · 3 signal layers
            </span>
            <div className="size-7 rounded-full bg-foreground/5 border border-border text-[10px] font-semibold flex items-center justify-center">
              SC
            </div>
          </div>
        </div>
      </header>
      <main>
        <ConfidenceLanes />
      </main>
    </div>
  );
}
