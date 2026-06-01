import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getProjectBundle, generateTransformation } from "@/lib/transformation.functions";
import { ArrowLeft, Copy, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/projects/$projectId")({
  head: () => ({ meta: [{ title: "Transformation Package — Fluent" }] }),
  component: ProjectPage,
});

const TABS = [
  { id: "exec", label: "A. Executive Summary" },
  { id: "maturity", label: "B. Maturity Assessment" },
  { id: "usecases", label: "C. Use Cases" },
  { id: "matrix", label: "D. Prioritization Matrix" },
  { id: "governance", label: "E. Governance" },
  { id: "adoption", label: "F. Adoption" },
  { id: "roadmap", label: "G. Roadmap" },
  { id: "metrics", label: "H. Metrics" },
] as const;
type TabId = (typeof TABS)[number]["id"];

function ProjectPage() {
  const { projectId } = Route.useParams();
  const fetchBundle = useServerFn(getProjectBundle);
  const regen = useServerFn(generateTransformation);
  const [tab, setTab] = useState<TabId>("exec");
  const [regenerating, setRegenerating] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["bundle", projectId],
    queryFn: () => fetchBundle({ data: { projectId } }),
    refetchInterval: (q) => (q.state.data?.project.status === "generating" ? 4000 : false),
  });

  const onRegen = async () => {
    setRegenerating(true);
    try {
      await regen({ data: { projectId } });
      toast.success("Regenerated");
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to regenerate");
    } finally {
      setRegenerating(false);
    }
  };

  if (isLoading || !data) {
    return <div className="max-w-7xl mx-auto px-6 py-12 text-muted-foreground">Loading…</div>;
  }

  const isGenerating = data.project.status === "generating";

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <Link
        to="/dashboard"
        className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-6"
      >
        <ArrowLeft className="size-4" /> All projects
      </Link>

      <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
        <div>
          <span className="eyebrow block mb-3">Transformation execution package</span>
          <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight">
            {data.project.name}
          </h1>
        </div>
        <button
          onClick={onRegen}
          disabled={regenerating || isGenerating}
          className="border border-border px-4 py-2 rounded-xl text-sm font-medium hover:bg-foreground/5 inline-flex items-center gap-2 disabled:opacity-50"
        >
          {regenerating ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          Regenerate
        </button>
      </div>

      {isGenerating && (
        <div className="mb-8 p-6 border border-primary/30 bg-primary/5 rounded-2xl flex items-center gap-3">
          <Loader2 className="size-5 animate-spin text-primary" />
          <div>
            <div className="font-semibold">Generating execution package…</div>
            <div className="text-sm text-muted-foreground">
              The AI is producing your governance, adoption, use cases, roadmap, and metrics. Usually 20-40s.
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-1 overflow-x-auto mb-8 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              tab === t.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="animate-reveal">
        {tab === "exec" && <ExecutiveSummary content={data.outputs.find((o) => o.section === "executive_summary")?.content as ExecSummary | undefined} />}
        {tab === "maturity" && <MaturityTab scores={data.scores} />}
        {tab === "usecases" && <UseCasesTab useCases={data.useCases} />}
        {tab === "matrix" && <MatrixTab useCases={data.useCases} />}
        {tab === "governance" && <ArtifactList items={data.governance} />}
        {tab === "adoption" && <ArtifactList items={data.adoption} />}
        {tab === "roadmap" && <RoadmapTab items={data.roadmap} />}
        {tab === "metrics" && <MetricsTab content={data.outputs.find((o) => o.section === "metrics")?.content as Metrics | undefined} risks={data.risks} />}
      </div>
    </div>
  );
}

type ExecSummary = {
  current_state_diagnosis: string;
  key_blockers: string[];
  strategic_recommendation: string;
  top_priorities: string[];
  expected_business_outcomes: string[];
};

function copyText(t: string) {
  navigator.clipboard.writeText(t).then(() => toast.success("Copied"));
}

function CopyBtn({ text }: { text: string }) {
  return (
    <button
      onClick={() => copyText(text)}
      className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
    >
      <Copy className="size-3" /> Copy
    </button>
  );
}

function ExecutiveSummary({ content }: { content?: ExecSummary }) {
  if (!content) return <Empty />;
  const full = JSON.stringify(content, null, 2);
  return (
    <div className="space-y-6">
      <Card title="Current state diagnosis" copy={content.current_state_diagnosis}>
        <p className="leading-relaxed">{content.current_state_diagnosis}</p>
      </Card>
      <div className="grid md:grid-cols-2 gap-6">
        <Card title="Key blockers">
          <ul className="space-y-2">
            {content.key_blockers.map((b, i) => (
              <li key={i} className="text-sm leading-relaxed flex gap-2">
                <span className="text-primary font-mono">·</span> {b}
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Top priorities">
          <ol className="space-y-2">
            {content.top_priorities.map((p, i) => (
              <li key={i} className="text-sm leading-relaxed flex gap-2">
                <span className="font-mono text-primary font-bold">{i + 1}.</span> {p}
              </li>
            ))}
          </ol>
        </Card>
      </div>
      <Card title="Strategic recommendation" copy={content.strategic_recommendation}>
        <p className="leading-relaxed">{content.strategic_recommendation}</p>
      </Card>
      <Card title="Expected business outcomes">
        <ul className="grid md:grid-cols-2 gap-2">
          {content.expected_business_outcomes.map((o, i) => (
            <li key={i} className="text-sm flex gap-2">
              <span className="text-success">✓</span> {o}
            </li>
          ))}
        </ul>
      </Card>
      <div className="flex justify-end"><CopyBtn text={full} /></div>
    </div>
  );
}

type Score = {
  id: string; category: string; score: number; rating: string | null; explanation: string | null;
  risk_level: string | null; recommendation: string | null; next_action: string | null;
};

function MaturityTab({ scores }: { scores: Score[] }) {
  if (!scores.length) return <Empty />;
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {scores.map((s) => (
        <div key={s.id} className="p-6 border border-border rounded-2xl bg-card">
          <div className="flex items-start justify-between mb-4">
            <div>
              <span className="eyebrow block mb-1">{s.category}</span>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-display font-bold">{s.score}</span>
                <span className="text-sm text-muted-foreground">{s.rating}</span>
              </div>
            </div>
            <RiskPill level={s.risk_level} />
          </div>
          <div className="h-1 w-full bg-foreground/5 rounded-full overflow-hidden mb-4">
            <div className="h-full bg-primary" style={{ width: `${s.score}%` }} />
          </div>
          <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{s.explanation}</p>
          <div className="border-t border-border pt-3 space-y-2 text-sm">
            <div><span className="eyebrow">Recommendation</span><p className="mt-1">{s.recommendation}</p></div>
            <div><span className="eyebrow">Next action</span><p className="mt-1 text-primary font-medium">{s.next_action}</p></div>
          </div>
        </div>
      ))}
    </div>
  );
}

type UseCase = {
  id: string; name: string; department: string | null; business_problem: string | null;
  ai_opportunity: string | null; complexity: string | null; risk_level: string | null;
  expected_impact: string | null; required_data: string | null; required_tools: string | null;
  recommended_owner: string | null; timeline: string | null; success_metric: string | null;
  quadrant: string | null;
};

function UseCasesTab({ useCases }: { useCases: UseCase[] }) {
  if (!useCases.length) return <Empty />;
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {useCases.map((u) => (
        <div key={u.id} className="p-6 border border-border rounded-2xl bg-card">
          <div className="flex items-start justify-between mb-3">
            <div>
              <span className="eyebrow block mb-1">{u.department}</span>
              <h3 className="font-display text-lg font-semibold">{u.name}</h3>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider bg-primary/10 text-primary px-2 py-1 rounded-full">
              {u.quadrant}
            </span>
          </div>
          <p className="text-sm mb-2"><span className="eyebrow">Problem</span><br />{u.business_problem}</p>
          <p className="text-sm mb-3"><span className="eyebrow">Opportunity</span><br />{u.ai_opportunity}</p>
          <div className="grid grid-cols-3 gap-2 text-xs mb-3">
            <Pill label="Complexity" value={u.complexity} />
            <Pill label="Risk" value={u.risk_level} />
            <Pill label="Impact" value={u.expected_impact} />
          </div>
          <div className="text-xs text-muted-foreground space-y-1 border-t border-border pt-3">
            <div><b className="text-foreground">Owner:</b> {u.recommended_owner}</div>
            <div><b className="text-foreground">Timeline:</b> {u.timeline}</div>
            <div><b className="text-foreground">Success:</b> {u.success_metric}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MatrixTab({ useCases }: { useCases: UseCase[] }) {
  if (!useCases.length) return <Empty />;
  const quadrants = ["Quick Wins", "Strategic Bets", "Governance Required", "Avoid For Now"] as const;
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {quadrants.map((q) => {
        const items = useCases.filter((u) => u.quadrant === q);
        return (
          <div key={q} className="p-6 border border-border rounded-2xl bg-card min-h-[200px]">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
              <h3 className="font-display text-lg font-semibold">{q}</h3>
              <span className="font-mono text-sm text-muted-foreground">{items.length}</span>
            </div>
            <ul className="space-y-2">
              {items.map((u) => (
                <li key={u.id} className="text-sm">
                  <span className="font-medium">{u.name}</span>
                  <span className="text-muted-foreground"> · {u.department}</span>
                </li>
              ))}
              {!items.length && <li className="text-sm text-muted-foreground italic">None</li>}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

type Artifact = { id: string; kind: string; title: string; content_md: string; updated_at: string };

function ArtifactList({ items }: { items: Artifact[] }) {
  if (!items.length) return <Empty />;
  return (
    <div className="space-y-4">
      {items.map((a) => (
        <details key={a.id} className="border border-border rounded-2xl bg-card overflow-hidden group">
          <summary className="cursor-pointer p-6 flex items-center justify-between">
            <div>
              <span className="eyebrow block mb-1">{a.kind}</span>
              <h3 className="font-display text-lg font-semibold">{a.title}</h3>
            </div>
            <span className="text-xs text-muted-foreground group-open:hidden">Expand →</span>
          </summary>
          <div className="px-6 pb-6 border-t border-border pt-4">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90">{a.content_md}</pre>
            <div className="mt-4 flex justify-end"><CopyBtn text={a.content_md} /></div>
          </div>
        </details>
      ))}
    </div>
  );
}

type Roadmap = {
  id: string; horizon: string; task: string; owner: string | null; timeline: string | null;
  priority: string | null; dependencies: string | null; risks: string | null; success_metric: string | null;
};

function RoadmapTab({ items }: { items: Roadmap[] }) {
  if (!items.length) return <Empty />;
  const horizons = ["30-day", "60-day", "90-day", "12-month"] as const;
  return (
    <div className="space-y-8">
      {horizons.map((h) => {
        const its = items.filter((i) => i.horizon === h);
        if (!its.length) return null;
        return (
          <div key={h}>
            <div className="flex items-baseline gap-3 mb-4">
              <h3 className="font-display text-2xl font-semibold">{h}</h3>
              <span className="font-mono text-xs text-muted-foreground">{its.length} items</span>
            </div>
            <div className="border border-border rounded-2xl overflow-hidden bg-card">
              <table className="w-full text-sm">
                <thead className="bg-foreground/5">
                  <tr className="text-left">
                    {["Task", "Owner", "When", "Priority", "Success metric"].map((c) => (
                      <th key={c} className="p-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {its.map((r) => (
                    <tr key={r.id}>
                      <td className="p-3 font-medium">
                        {r.task}
                        {(r.dependencies || r.risks) && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {r.dependencies && <>Deps: {r.dependencies}</>}
                            {r.dependencies && r.risks && " · "}
                            {r.risks && <>Risks: {r.risks}</>}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-muted-foreground">{r.owner}</td>
                      <td className="p-3 text-muted-foreground">{r.timeline}</td>
                      <td className="p-3"><span className="font-mono text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">{r.priority}</span></td>
                      <td className="p-3 text-muted-foreground">{r.success_metric}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

type Metrics = {
  transformation_health_score: number; governance_score: number; adoption_score: number;
  ai_literacy_score: number; risk_score: number; use_case_progress: number; roi_impact_summary: string;
};

function MetricsTab({ content, risks }: { content?: Metrics; risks: Array<{ id: string; title: string; severity: string | null; owner: string | null; mitigation: string | null }> }) {
  if (!content) return <Empty />;
  const cells = [
    { l: "Transformation Health", v: content.transformation_health_score },
    { l: "Governance", v: content.governance_score },
    { l: "Adoption", v: content.adoption_score },
    { l: "AI Literacy", v: content.ai_literacy_score },
    { l: "Use Case Progress", v: content.use_case_progress },
    { l: "Risk Score", v: content.risk_score },
  ];
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {cells.map((c) => (
          <div key={c.l} className="p-6 border border-border rounded-2xl bg-card">
            <span className="eyebrow block mb-4">{c.l}</span>
            <div className="text-4xl font-display font-bold mb-3">{c.v}</div>
            <div className="h-1 w-full bg-foreground/5 rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${c.v}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="p-6 border border-border rounded-2xl bg-card">
        <span className="eyebrow block mb-3">ROI / Impact summary</span>
        <p className="leading-relaxed">{content.roi_impact_summary}</p>
      </div>
      {risks.length > 0 && (
        <div>
          <h3 className="font-display text-xl font-semibold mb-4">Risk register</h3>
          <div className="border border-border rounded-2xl overflow-hidden bg-card">
            <table className="w-full text-sm">
              <thead className="bg-foreground/5">
                <tr className="text-left">
                  {["Risk", "Severity", "Owner", "Mitigation"].map((c) => (
                    <th key={c} className="p-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {risks.map((r) => (
                  <tr key={r.id}>
                    <td className="p-3 font-medium">{r.title}</td>
                    <td className="p-3"><RiskPill level={r.severity} /></td>
                    <td className="p-3 text-muted-foreground">{r.owner}</td>
                    <td className="p-3 text-muted-foreground">{r.mitigation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ title, children, copy }: { title: string; children: React.ReactNode; copy?: string }) {
  return (
    <div className="p-6 border border-border rounded-2xl bg-card">
      <div className="flex items-center justify-between mb-4">
        <span className="eyebrow">{title}</span>
        {copy && <CopyBtn text={copy} />}
      </div>
      {children}
    </div>
  );
}

function Pill({ label, value }: { label: string; value: string | null }) {
  const color =
    value === "high" ? "bg-danger/10 text-danger" :
    value === "medium" ? "bg-warning/10 text-warning" :
    value === "low" ? "bg-success/10 text-success" :
    "bg-muted text-muted-foreground";
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="eyebrow">{label}</span>
      <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${color}`}>
        {value ?? "—"}
      </span>
    </div>
  );
}

function RiskPill({ level }: { level: string | null }) {
  const styles: Record<string, string> = {
    low: "bg-success/10 text-success",
    medium: "bg-warning/10 text-warning",
    high: "bg-danger/10 text-danger",
    critical: "bg-danger/20 text-danger",
  };
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full ${styles[level ?? ""] ?? "bg-muted text-muted-foreground"}`}>
      {level ?? "—"}
    </span>
  );
}

function Empty() {
  return (
    <div className="p-12 border border-dashed border-border rounded-2xl text-center text-muted-foreground">
      Section not generated yet. Try Regenerate, or wait for the package to finish.
    </div>
  );
}
