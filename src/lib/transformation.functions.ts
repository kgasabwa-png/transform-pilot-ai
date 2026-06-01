import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const IntakeSchema = z.object({
  name: z.string().min(1).max(200),
  company_name: z.string().min(1).max(200),
  industry: z.string().max(120).optional().nullable(),
  employee_count: z.string().max(40).optional().nullable(),
  departments: z.array(z.string().max(80)).max(40).optional().nullable(),
  existing_ai_tools: z.array(z.string().max(80)).max(40).optional().nullable(),
  current_ai_maturity: z.number().int().min(0).max(100).optional().nullable(),
  business_goals: z.string().max(2000).optional().nullable(),
  operational_challenges: z.string().max(2000).optional().nullable(),
  compliance_requirements: z.string().max(1000).optional().nullable(),
  data_sensitivity: z.string().max(500).optional().nullable(),
  leadership_alignment: z.number().int().min(0).max(100).optional().nullable(),
  employee_readiness: z.number().int().min(0).max(100).optional().nullable(),
  change_mgmt_maturity: z.number().int().min(0).max(100).optional().nullable(),
  timeline: z.string().max(120).optional().nullable(),
  budget_range: z.string().max(120).optional().nullable(),
  desired_outcomes: z.string().max(2000).optional().nullable(),
});

export const createProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => IntakeSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: orgs, error: orgErr } = await supabase
      .from("organizations")
      .select("id")
      .eq("owner_id", userId)
      .limit(1);
    if (orgErr) throw new Error(orgErr.message);
    let orgId = orgs?.[0]?.id;
    if (!orgId) {
      const { data: newOrg, error } = await supabase
        .from("organizations")
        .insert({ name: "My workspace", owner_id: userId })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      orgId = newOrg.id;
    }
    const { data: project, error: projErr } = await supabase
      .from("projects")
      .insert({ org_id: orgId, name: data.name, status: "generating" })
      .select("id")
      .single();
    if (projErr) throw new Error(projErr.message);
    const { error: intakeErr } = await supabase.from("company_intakes").insert({
      project_id: project.id,
      company_name: data.company_name,
      industry: data.industry,
      employee_count: data.employee_count,
      departments: data.departments,
      existing_ai_tools: data.existing_ai_tools,
      current_ai_maturity: data.current_ai_maturity,
      business_goals: data.business_goals,
      operational_challenges: data.operational_challenges,
      compliance_requirements: data.compliance_requirements,
      data_sensitivity: data.data_sensitivity,
      leadership_alignment: data.leadership_alignment,
      employee_readiness: data.employee_readiness,
      change_mgmt_maturity: data.change_mgmt_maturity,
      timeline: data.timeline,
      budget_range: data.budget_range,
      desired_outcomes: data.desired_outcomes,
      raw: data as unknown as Record<string, unknown>,
    });
    if (intakeErr) throw new Error(intakeErr.message);
    return { projectId: project.id };
  });

const MATURITY_CATEGORIES = [
  "Leadership Alignment",
  "AI Literacy",
  "Data Readiness",
  "Governance Readiness",
  "Security Readiness",
  "Workflow Readiness",
  "Employee Adoption Readiness",
  "Change Management Maturity",
  "Technology Infrastructure",
  "Measurement Capability",
] as const;

const TOOL_SCHEMA = {
  type: "object",
  properties: {
    executive_summary: {
      type: "object",
      properties: {
        current_state_diagnosis: { type: "string" },
        key_blockers: { type: "array", items: { type: "string" } },
        strategic_recommendation: { type: "string" },
        top_priorities: { type: "array", items: { type: "string" } },
        expected_business_outcomes: { type: "array", items: { type: "string" } },
      },
      required: [
        "current_state_diagnosis",
        "key_blockers",
        "strategic_recommendation",
        "top_priorities",
        "expected_business_outcomes",
      ],
    },
    maturity_scores: {
      type: "array",
      items: {
        type: "object",
        properties: {
          category: { type: "string", enum: MATURITY_CATEGORIES as unknown as string[] },
          score: { type: "integer" },
          rating: { type: "string" },
          explanation: { type: "string" },
          risk_level: { type: "string", enum: ["low", "medium", "high"] },
          recommendation: { type: "string" },
          next_action: { type: "string" },
        },
        required: ["category", "score", "rating", "explanation", "risk_level", "recommendation", "next_action"],
      },
    },
    use_cases: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          department: { type: "string" },
          business_problem: { type: "string" },
          ai_opportunity: { type: "string" },
          complexity: { type: "string", enum: ["low", "medium", "high"] },
          risk_level: { type: "string", enum: ["low", "medium", "high"] },
          expected_impact: { type: "string", enum: ["low", "medium", "high"] },
          required_data: { type: "string" },
          required_tools: { type: "string" },
          recommended_owner: { type: "string" },
          timeline: { type: "string" },
          success_metric: { type: "string" },
          quadrant: {
            type: "string",
            enum: ["Quick Wins", "Strategic Bets", "Governance Required", "Avoid For Now"],
          },
        },
        required: [
          "name",
          "department",
          "business_problem",
          "ai_opportunity",
          "complexity",
          "risk_level",
          "expected_impact",
          "required_data",
          "required_tools",
          "recommended_owner",
          "timeline",
          "success_metric",
          "quadrant",
        ],
      },
    },
    governance: {
      type: "array",
      items: {
        type: "object",
        properties: {
          kind: {
            type: "string",
            enum: [
              "AI Governance Plan",
              "AI Acceptable Use Policy",
              "AI Approval Workflow",
              "Risk Register",
              "Human Oversight Model",
              "Review Cadence",
              "Ownership Model",
            ],
          },
          title: { type: "string" },
          content_md: { type: "string" },
        },
        required: ["kind", "title", "content_md"],
      },
    },
    adoption: {
      type: "array",
      items: {
        type: "object",
        properties: {
          kind: {
            type: "string",
            enum: [
              "Adoption Plan",
              "Role-Based Training Plan",
              "Executive Training",
              "Manager Training",
              "Employee Training",
              "Department AI Playbooks",
              "Internal Communication Plan",
              "Employee FAQ",
            ],
          },
          title: { type: "string" },
          content_md: { type: "string" },
        },
        required: ["kind", "title", "content_md"],
      },
    },
    roadmap: {
      type: "array",
      items: {
        type: "object",
        properties: {
          horizon: { type: "string", enum: ["30-day", "60-day", "90-day", "12-month"] },
          task: { type: "string" },
          owner: { type: "string" },
          timeline: { type: "string" },
          priority: { type: "string", enum: ["P0", "P1", "P2"] },
          dependencies: { type: "string" },
          risks: { type: "string" },
          success_metric: { type: "string" },
        },
        required: ["horizon", "task", "owner", "timeline", "priority", "dependencies", "risks", "success_metric"],
      },
    },
    risks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
          owner: { type: "string" },
          mitigation: { type: "string" },
        },
        required: ["title", "severity", "owner", "mitigation"],
      },
    },
    metrics: {
      type: "object",
      properties: {
        transformation_health_score: { type: "integer" },
        governance_score: { type: "integer" },
        adoption_score: { type: "integer" },
        ai_literacy_score: { type: "integer" },
        risk_score: { type: "integer" },
        use_case_progress: { type: "integer" },
        roi_impact_summary: { type: "string" },
      },
      required: [
        "transformation_health_score",
        "governance_score",
        "adoption_score",
        "ai_literacy_score",
        "risk_score",
        "use_case_progress",
        "roi_impact_summary",
      ],
    },
  },
  required: [
    "executive_summary",
    "maturity_scores",
    "use_cases",
    "governance",
    "adoption",
    "roadmap",
    "risks",
    "metrics",
  ],
} as const;

const SYSTEM_PROMPT = `You are Fluent — a senior AI transformation consultant, PMO lead, governance advisor, and change-management expert combined. You produce defensible, executive-grade transformation execution packages.

Every section MUST answer the eight execution questions:
1. What should we do?
2. Why does it matter?
3. Who owns it?
4. When should it happen?
5. What risks exist?
6. How do we measure success?
7. What artifact gets created?
8. What is the next action?

Be specific, opinionated, and actionable. No fluff. No generic "consider implementing AI." Reference the company's actual context. Generate AT LEAST 8 use cases distributed across all four quadrants, AT LEAST 10 roadmap items spanning all four horizons, ALL 10 maturity categories scored 0-100, AT LEAST 5 governance artifacts and 5 adoption artifacts with rich markdown bodies (300-600 words each).`;

export const generateTransformation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ projectId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: intake, error: intakeErr } = await supabase
      .from("company_intakes")
      .select("*")
      .eq("project_id", data.projectId)
      .single();
    if (intakeErr || !intake) throw new Error("Intake not found");

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    const userPrompt = `Generate the complete AI Transformation Execution Package for this company:

Company: ${intake.company_name}
Industry: ${intake.industry ?? "n/a"}
Employees: ${intake.employee_count ?? "n/a"}
Departments: ${(intake.departments ?? []).join(", ") || "n/a"}
Existing AI tools: ${(intake.existing_ai_tools ?? []).join(", ") || "none"}
Current AI maturity (0-100): ${intake.current_ai_maturity ?? "n/a"}
Leadership alignment (0-100): ${intake.leadership_alignment ?? "n/a"}
Employee readiness (0-100): ${intake.employee_readiness ?? "n/a"}
Change management maturity (0-100): ${intake.change_mgmt_maturity ?? "n/a"}
Data sensitivity: ${intake.data_sensitivity ?? "n/a"}
Compliance requirements: ${intake.compliance_requirements ?? "n/a"}
Timeline: ${intake.timeline ?? "n/a"}
Budget: ${intake.budget_range ?? "n/a"}

Business goals:
${intake.business_goals ?? "n/a"}

Operational challenges:
${intake.operational_challenges ?? "n/a"}

Desired outcomes:
${intake.desired_outcomes ?? "n/a"}

Return the package via the emit_package tool. Be specific to this company's reality.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "emit_package",
              description: "Emit the structured AI Transformation Execution Package.",
              parameters: TOOL_SCHEMA,
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "emit_package" } },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 429) throw new Error("AI rate limit exceeded. Please try again shortly.");
      if (res.status === 402) throw new Error("AI credits exhausted. Add credits in Workspace Settings.");
      throw new Error(`AI gateway error ${res.status}: ${text.slice(0, 300)}`);
    }
    const json = (await res.json()) as {
      choices?: Array<{ message?: { tool_calls?: Array<{ function: { arguments: string } }> } }>;
    };
    const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("AI returned no tool call");
    type Pkg = {
      executive_summary: Record<string, unknown>;
      maturity_scores: Array<{
        category: string; score: number; rating: string; explanation: string;
        risk_level: string; recommendation: string; next_action: string;
      }>;
      use_cases: Array<Record<string, string>>;
      governance: Array<{ kind: string; title: string; content_md: string }>;
      adoption: Array<{ kind: string; title: string; content_md: string }>;
      roadmap: Array<Record<string, string>>;
      risks: Array<{ title: string; severity: string; owner: string; mitigation: string }>;
      metrics: {
        transformation_health_score: number; governance_score: number; adoption_score: number;
        ai_literacy_score: number; risk_score: number; use_case_progress: number; roi_impact_summary: string;
      };
    };
    let pkg: Pkg;
    try {
      pkg = JSON.parse(args) as Pkg;
    } catch {
      throw new Error("AI returned malformed JSON");
    }

    // Persist all sections
    const pid = data.projectId;
    const wipe = async (table: string) => {
      await supabase.from(table).delete().eq("project_id", pid);
    };
    await Promise.all([
      wipe("transformation_scores"),
      wipe("use_cases"),
      wipe("risks"),
      wipe("roadmap_items"),
      wipe("governance_artifacts"),
      wipe("adoption_artifacts"),
      supabase.from("generated_outputs").delete().eq("project_id", pid),
    ]);

    await Promise.all([
      supabase.from("generated_outputs").insert([
        { project_id: pid, section: "executive_summary", content: pkg.executive_summary },
        { project_id: pid, section: "metrics", content: pkg.metrics },
      ]),
      supabase.from("transformation_scores").insert(
        pkg.maturity_scores.map((s) => ({ project_id: pid, ...s })),
      ),
      supabase.from("use_cases").insert(
        pkg.use_cases.map((u) => ({ project_id: pid, ...u })),
      ),
      supabase.from("risks").insert(pkg.risks.map((r) => ({ project_id: pid, ...r }))),
      supabase
        .from("roadmap_items")
        .insert(pkg.roadmap.map((r, i) => ({ project_id: pid, position: i, ...r }))),
      supabase
        .from("governance_artifacts")
        .insert(pkg.governance.map((g) => ({ project_id: pid, ...g }))),
      supabase
        .from("adoption_artifacts")
        .insert(pkg.adoption.map((a) => ({ project_id: pid, ...a }))),
    ]);

    await supabase
      .from("projects")
      .update({
        status: "ready",
        health_score: pkg.metrics.transformation_health_score,
        governance_score: pkg.metrics.governance_score,
        adoption_score: pkg.metrics.adoption_score,
        updated_at: new Date().toISOString(),
      })
      .eq("id", pid);

    return { ok: true };
  });

export const getProjectBundle = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ projectId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const pid = data.projectId;
    const [project, intake, outputs, scores, useCases, risks, roadmap, governance, adoption] =
      await Promise.all([
        supabase.from("projects").select("*").eq("id", pid).single(),
        supabase.from("company_intakes").select("*").eq("project_id", pid).maybeSingle(),
        supabase.from("generated_outputs").select("*").eq("project_id", pid),
        supabase.from("transformation_scores").select("*").eq("project_id", pid),
        supabase.from("use_cases").select("*").eq("project_id", pid),
        supabase.from("risks").select("*").eq("project_id", pid),
        supabase.from("roadmap_items").select("*").eq("project_id", pid).order("position"),
        supabase.from("governance_artifacts").select("*").eq("project_id", pid),
        supabase.from("adoption_artifacts").select("*").eq("project_id", pid),
      ]);
    if (project.error) throw new Error(project.error.message);
    return {
      project: project.data,
      intake: intake.data,
      outputs: outputs.data ?? [],
      scores: scores.data ?? [],
      useCases: useCases.data ?? [],
      risks: risks.data ?? [],
      roadmap: roadmap.data ?? [],
      governance: governance.data ?? [],
      adoption: adoption.data ?? [],
    };
  });

export const listProjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const updateArtifact = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        table: z.enum(["governance_artifacts", "adoption_artifacts"]),
        id: z.string().uuid(),
        content_md: z.string().max(50000),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from(data.table)
      .update({ content_md: data.content_md, updated_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
