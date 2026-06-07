import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import {
  Activity,
  BookOpenText,
  Command,
  Eye,
  LayoutDashboard,
  ListChecks,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import type { PersonaId } from "@/lib/loop/personas";
import { AgentChatDock } from "./AgentChatDock";
import { useClientStamp } from "@/lib/loop/useClientStamp";

export function AppShell({ children }: { children: ReactNode }) {
  const { role = "csm" } = useSearch({ from: "/app" });
  const navigate = useNavigate({ from: "/app" });
  const stamp = useClientStamp();
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setChatOpen((v) => !v);
      } else if (e.key === "Escape" && chatOpen) {
        setChatOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [chatOpen]);

  const setRole = (id: PersonaId) =>
    navigate({ search: (prev: { role?: PersonaId; demo?: boolean }) => ({ ...prev, role: id }), replace: true });

  const initials = role === "csm" ? "SC" : role === "manager" ? "AM" : "VP";
  const personaName =
    role === "csm" ? "Sara Chen · CSM"
    : role === "manager" ? "Alex Morrow · Manager"
    : "Priya Vance · VP CS";

  return (
    <div className="min-h-screen flex bg-background text-foreground relative">
      {/* Left rail */}
      <aside className="hidden md:flex w-[232px] shrink-0 flex-col border-r border-border bg-background sticky top-0 h-screen">
        <div className="px-5 py-5 flex items-center gap-2 border-b border-border">
          <Logo size={20} />
          <div>
            <div className="font-display text-base font-semibold leading-tight">Tandem</div>
            <div className="text-[9px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
              the outcome ledger
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavSection label="Today">
            <NavItem active={role === "csm"} icon={ListChecks} onClick={() => setRole("csm")}>
              Ledger
            </NavItem>
            <NavItem icon={BookOpenText}>
              <Link to="/app/accounts/$id" params={{ id: "halcyon" }} className="contents">
                Account brain
              </Link>
            </NavItem>
            <NavItem icon={Eye}>Watch</NavItem>
          </NavSection>

          <NavSection label="Team">
            <NavItem active={role === "manager"} icon={LayoutDashboard} onClick={() => setRole("manager")}>
              Drift & coaching
            </NavItem>
            <NavItem active={role === "leader"} icon={Activity} onClick={() => setRole("leader")}>
              Forecast vs agent
            </NavItem>
          </NavSection>
        </nav>

        {/* Trust card */}
        <div className="m-3 rounded-xl border border-border bg-surface p-3 text-[11px] leading-relaxed text-muted-foreground">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="size-1.5 rounded-full bg-success animate-pulse" />
            <span className="font-mono uppercase tracking-[0.14em] text-[9px] text-foreground/80">
              governed autonomy
            </span>
          </div>
          A revert appends a compensating receipt.
          <br />
          The record is never deleted.
        </div>

        {/* Persona footer */}
        <div className="border-t border-border px-4 py-3 flex items-center gap-2">
          <div className="size-7 rounded-full bg-primary/15 border border-primary/30 text-[10px] font-semibold flex items-center justify-center text-primary">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[12px] font-medium truncate">{personaName}</div>
            <div className="text-[9px] font-mono uppercase tracking-[0.16em] text-muted-foreground truncate" suppressHydrationWarning>
              {stamp}
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="md:hidden border-b border-border h-12 px-4 flex items-center justify-between bg-background">
          <Link to="/" className="flex items-center gap-2">
            <Logo size={16} />
            <span className="font-display font-semibold text-sm">Tandem</span>
          </Link>
          <button
            onClick={() => setChatOpen(true)}
            className="text-[11px] font-mono inline-flex items-center gap-1.5 border border-border rounded-md px-2 py-1 text-muted-foreground"
          >
            <Sparkles className="size-3 text-primary" /> Ask
          </button>
        </header>

        <main className="flex-1 overflow-y-auto relative">{children}</main>
      </div>

      {/* Floating "Ask Tandem" command bar */}
      <button
        onClick={() => setChatOpen(true)}
        className="hidden md:flex fixed bottom-6 right-6 z-30 items-center gap-3 rounded-full border border-primary/30 bg-surface/95 backdrop-blur shadow-lg shadow-black/40 pl-4 pr-2 py-2 hover:border-primary/60 transition-colors group"
      >
        <Sparkles className="size-4 text-primary" />
        <span className="text-sm text-muted-foreground group-hover:text-foreground">
          Ask Tandem
        </span>
        <span className="inline-flex items-center gap-0.5 text-[10px] font-mono text-muted-foreground border border-border rounded px-1.5 py-0.5">
          <Command className="size-2.5" />K
        </span>
      </button>

      <AgentChatDock open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}

function NavSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="pt-2 pb-1">
      <div className="px-3 py-1.5 text-[9px] font-mono uppercase tracking-[0.18em] text-muted-foreground/70">
        {label}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function NavItem({
  icon: Icon,
  children,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] transition-colors ${
        active
          ? "bg-foreground/5 text-foreground"
          : "text-muted-foreground hover:bg-foreground/[0.03] hover:text-foreground"
      }`}
    >
      <Icon className={`size-3.5 ${active ? "text-primary" : ""}`} />
      <span className="flex-1 text-left">{children}</span>
    </button>
  );
}
