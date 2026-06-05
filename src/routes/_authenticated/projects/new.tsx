import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createProject, generateTransformation } from "@/lib/transformation.functions";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/projects/new")({
  head: () => ({ meta: [{ title: "New Transformation Project — Fluent" }] }),
  component: IntakeWizard,
});

type Form = {
  name: string;
  company_name: string;
  industry: string;
  employee_count: string;
  departments: string;
  existing_ai_tools: string;
  current_ai_maturity: number;
  business_goals: string;
  operational_challenges: string;
  compliance_requirements: string;
  data_sensitivity: string;
  leadership_alignment: number;
  employee_readiness: number;
  change_mgmt_maturity: number;
  timeline: string;
  budget_range: string;
  desired_outcomes: string;
};

const initial: Form = {
  name: "",
  company_name: "",
  industry: "",
  employee_count: "",
  departments: "",
  existing_ai_tools: "",
  current_ai_maturity: 30,
  business_goals: "",
  operational_challenges: "",
  compliance_requirements: "",
  data_sensitivity: "",
  leadership_alignment: 50,
  employee_readiness: 50,
  change_mgmt_maturity: 50,
  timeline: "",
  budget_range: "",
  desired_outcomes: "",
};

const STEPS = ["Company", "Current AI", "Goals", "People", "Constraints"] as const;

function IntakeWizard() {
  const navigate = useNavigate();
  const create = useServerFn(createProject);
  const generate = useServerFn(generateTransformation);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(initial);
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setSubmitting(true);
    try {
      const { projectId } = await create({
        data: {
          ...form,
          name: form.name || `${form.company_name || "Untitled"} transformation`,
          departments: form.departments.split(",").map((s) => s.trim()).filter(Boolean),
          existing_ai_tools: form.existing_ai_tools
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        },
      });
      navigate({ to: "/projects/$projectId", params: { projectId } });
      toast.message("Generating execution package…");
      generate({ data: { projectId } })
        .then(() => toast.success("Execution package ready"))
        .catch((e: Error) => toast.error(e.message));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create project");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <span className="eyebrow block mb-3">Intake</span>
      <h1 className="font-display text-4xl font-semibold tracking-tight mb-8">
        Tell us about your transformation context
      </h1>

      <div className="flex items-center gap-2 mb-10">
        {STEPS.map((label, i) => (
          <div key={label} className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div
                className={`size-6 rounded-full grid place-items-center text-[10px] font-mono font-bold ${
                  i <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1}
              </div>
              <span className={`text-xs font-medium ${i === step ? "text-foreground" : "text-muted-foreground"}`}>
                {label}
              </span>
            </div>
            <div className={`h-0.5 rounded-full ${i <= step ? "bg-primary" : "bg-border"}`} />
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl p-8 md:p-10 space-y-6">
        {step === 0 && (
          <>
            <Text label="Project name" value={form.name} onChange={(v) => set("name", v)} placeholder="Q4 AI Transformation" />
            <Text label="Company name" value={form.company_name} onChange={(v) => set("company_name", v)} required />
            <Text label="Industry" value={form.industry} onChange={(v) => set("industry", v)} placeholder="SaaS, Manufacturing, Healthcare…" />
            <Text label="Employee count" value={form.employee_count} onChange={(v) => set("employee_count", v)} placeholder="e.g. 1,200" />
            <Text label="Departments (comma-separated)" value={form.departments} onChange={(v) => set("departments", v)} placeholder="Sales, Engineering, HR, Legal" />
          </>
        )}
        {step === 1 && (
          <>
            <Text label="Existing AI tools (comma-separated)" value={form.existing_ai_tools} onChange={(v) => set("existing_ai_tools", v)} placeholder="ChatGPT Enterprise, Microsoft Copilot" />
            <Slider label="Current AI maturity" value={form.current_ai_maturity} onChange={(v) => set("current_ai_maturity", v)} />
            <Textarea label="Data sensitivity" value={form.data_sensitivity} onChange={(v) => set("data_sensitivity", v)} placeholder="What kinds of data exist and how sensitive are they?" />
            <Textarea label="Compliance requirements" value={form.compliance_requirements} onChange={(v) => set("compliance_requirements", v)} placeholder="SOC 2, HIPAA, GDPR, EU AI Act…" />
          </>
        )}
        {step === 2 && (
          <>
            <Textarea label="Business goals" value={form.business_goals} onChange={(v) => set("business_goals", v)} placeholder="What outcomes does leadership want from AI?" />
            <Textarea label="Operational challenges" value={form.operational_challenges} onChange={(v) => set("operational_challenges", v)} placeholder="Bottlenecks, inconsistencies, manual work…" />
            <Textarea label="Desired outcomes" value={form.desired_outcomes} onChange={(v) => set("desired_outcomes", v)} placeholder="What does success look like in 12 months?" />
          </>
        )}
        {step === 3 && (
          <>
            <Slider label="Leadership alignment" value={form.leadership_alignment} onChange={(v) => set("leadership_alignment", v)} />
            <Slider label="Employee readiness" value={form.employee_readiness} onChange={(v) => set("employee_readiness", v)} />
            <Slider label="Change management maturity" value={form.change_mgmt_maturity} onChange={(v) => set("change_mgmt_maturity", v)} />
          </>
        )}
        {step === 4 && (
          <>
            <Text label="Timeline" value={form.timeline} onChange={(v) => set("timeline", v)} placeholder="e.g. 6 months, this fiscal year" />
            <Text label="Budget range" value={form.budget_range} onChange={(v) => set("budget_range", v)} placeholder="e.g. $250k - $500k" />
          </>
        )}
      </div>

      <div className="flex items-center justify-between mt-8">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0 || submitting}
          className="px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground inline-flex items-center gap-2 disabled:opacity-30"
        >
          <ArrowLeft className="size-4" /> Back
        </button>
        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={step === 0 && !form.company_name}
            className="bg-foreground text-background font-semibold px-6 py-3 rounded-xl inline-flex items-center gap-2 hover:bg-foreground/90 disabled:opacity-50"
          >
            Continue <ArrowRight className="size-4" />
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={submitting}
            className="bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-xl inline-flex items-center gap-2 hover:shadow-lg hover:shadow-primary/20 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
            Generate Execution Package
          </button>
        )}
      </div>
    </div>
  );
}

function Text({
  label, value, onChange, placeholder, required,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean;
}) {
  return (
    <label className="block">
      <span className="eyebrow block mb-2">{label}{required && <span className="text-primary"> *</span>}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-border rounded-xl px-4 py-2.5 bg-background focus:border-primary focus:ring-2 focus:ring-ring outline-none"
      />
    </label>
  );
}

function Textarea({
  label, value, onChange, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="eyebrow block mb-2">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full border border-border rounded-xl px-4 py-2.5 bg-background focus:border-primary focus:ring-2 focus:ring-ring outline-none resize-y"
      />
    </label>
  );
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between mb-2">
        <span className="eyebrow">{label}</span>
        <span className="font-mono text-sm font-semibold">{value}</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[color:var(--color-primary)]"
      />
    </label>
  );
}
