import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listProjects } from "@/lib/transformation.functions";
import { Plus, ArrowRight, Activity, ShieldCheck, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Fluent" }] }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const fetchProjects = useServerFn(listProjects);
  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => fetchProjects(),
  });

  const list = projects ?? [];
  const avg = (key: "health_score" | "governance_score" | "adoption_score") => {
    const vals = list.map((p) => p[key]).filter((v): v is number => typeof v === "number");
    if (!vals.length) return null;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex items-end justify-between mb-12 flex-wrap gap-6">
        <div>
          <span className="eyebrow block mb-3">Workspace overview</span>
          <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight">
            Transformation Portfolio
          </h1>
        </div>
        <button
          onClick={() => navigate({ to: "/projects/new" })}
          className="bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-xl inline-flex items-center gap-2 hover:shadow-lg hover:shadow-primary/20"
        >
          <Plus className="size-4" /> New Transformation Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <ScoreCard
          icon={Activity}
          label="Transformation Health"
          value={avg("health_score")}
        />
        <ScoreCard
          icon={ShieldCheck}
          label="Governance Score"
          value={avg("governance_score")}
        />
        <ScoreCard
          icon={Users}
          label="Adoption Score"
          value={avg("adoption_score")}
        />
      </div>

      <div className="mb-4 flex items-end justify-between">
        <h2 className="font-display text-2xl font-semibold">Projects</h2>
        <span className="eyebrow">{list.length} total</span>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground text-sm py-12">Loading projects…</div>
      ) : list.length === 0 ? (
        <div className="border border-dashed border-border rounded-2xl p-16 text-center">
          <h3 className="font-display text-xl font-semibold mb-2">No projects yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Generate your first AI Transformation Execution Package — governance, adoption,
            use cases, roadmap, and metrics.
          </p>
          <Link
            to="/projects/new"
            className="inline-flex items-center gap-2 bg-foreground text-background font-semibold px-6 py-3 rounded-xl hover:bg-foreground/90"
          >
            <Plus className="size-4" /> Start Intake
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {list.map((p) => (
            <Link
              key={p.id}
              to="/projects/$projectId"
              params={{ projectId: p.id }}
              className="group bg-card border border-border rounded-2xl p-6 flex items-center justify-between hover:border-primary transition-all"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-display text-lg font-semibold">{p.name}</h3>
                  <StatusPill status={p.status} />
                </div>
                <div className="text-sm text-muted-foreground font-mono">
                  {new Date(p.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className="hidden md:flex items-center gap-8 mr-8">
                <Stat label="Health" value={p.health_score} />
                <Stat label="Gov" value={p.governance_score} />
                <Stat label="Adopt" value={p.adoption_score} />
              </div>
              <ArrowRight className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function ScoreCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | null;
}) {
  return (
    <div className="p-6 border border-border rounded-2xl bg-card">
      <div className="flex items-center justify-between mb-6">
        <span className="eyebrow">{label}</span>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="text-4xl font-display font-bold mb-3">
        {value === null ? "—" : `${value}`}
      </div>
      <div className="h-1 w-full bg-foreground/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${value ?? 0}%` }}
        />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="text-right">
      <div className="eyebrow">{label}</div>
      <div className="font-mono font-bold">{value ?? "—"}</div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ready: "bg-success/10 text-success",
    generating: "bg-primary/10 text-primary",
    draft: "bg-muted text-muted-foreground",
    failed: "bg-danger/10 text-danger",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
        styles[status] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {status}
    </span>
  );
}
