// Landing-page integrations band. Earns the "we read every call, Slack,
// email" claim with a visible row of connector marks + posture chips.

import { INTEGRATIONS, TRUST_POSTURE } from "@/lib/loop/integrations";
import { IntegrationLogo } from "./IntegrationLogo";
import { Shield } from "lucide-react";

export function IntegrationsStrip() {
  return (
    <section className="border-y border-border bg-surface/40">
      <div className="max-w-[1180px] mx-auto px-6 md:px-10 py-14 md:py-20">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div className="max-w-xl">
            <span className="eyebrow block mb-3">Reads your stack · writes nothing without you</span>
            <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tight leading-tight">
              The same surfaces your team already lives in.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Receipts is read-only by default. Every outbound — email, Slack
              note, CRM update — is a draft your CSM signs.
            </p>
          </div>
          <div className="text-xs font-mono text-muted-foreground">
            {INTEGRATIONS.filter((i) => i.status === "connected").length} connected ·{" "}
            {INTEGRATIONS.filter((i) => i.status === "available").length} 1-click · {" "}
            {INTEGRATIONS.filter((i) => i.status === "coming-soon").length} on deck
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {INTEGRATIONS.map((i) => (
            <div
              key={i.id}
              className="border border-border rounded-xl bg-background p-4 flex flex-col items-center gap-2.5 text-center"
            >
              <IntegrationLogo name={i.name} />
              <div className="text-xs font-medium tracking-tight">{i.name}</div>
              <span
                className={`text-[10px] font-mono uppercase tracking-wider ${
                  i.status === "connected"
                    ? "text-success"
                    : i.status === "available"
                    ? "text-muted-foreground"
                    : "text-muted-foreground/60"
                }`}
              >
                {i.status === "connected"
                  ? "● live"
                  : i.status === "available"
                  ? "○ 1-click"
                  : "soon"}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {TRUST_POSTURE.map((t) => (
            <div
              key={t.title}
              className="border border-border rounded-xl p-4 bg-background flex gap-3 items-start"
            >
              <Shield className="size-4 mt-0.5 text-foreground/80 shrink-0" />
              <div>
                <div className="text-sm font-medium tracking-tight">{t.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {t.detail}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
