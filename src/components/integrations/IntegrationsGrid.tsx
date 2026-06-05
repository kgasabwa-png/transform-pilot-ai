// Workspace integrations view. Mocked connect/disconnect — the click
// flips local state. Real OAuth wires in when a design partner names
// their stack.

import { useState } from "react";
import {
  CATEGORY_LABEL,
  INTEGRATIONS,
  type Integration,
  type IntegrationCategory,
} from "@/lib/loop/integrations";
import { IntegrationLogo } from "./IntegrationLogo";
import { ArrowUpRight, Check } from "lucide-react";

const STATUS_DOT = {
  connected: "bg-success",
  available: "bg-muted-foreground/40",
  "coming-soon": "bg-muted-foreground/20",
} as const;

export function IntegrationsGrid() {
  const [overrides, setOverrides] = useState<Record<string, Integration["status"]>>({});
  const list = INTEGRATIONS.map((i) => ({
    ...i,
    status: overrides[i.id] ?? i.status,
  }));
  const grouped = list.reduce<Record<IntegrationCategory, Integration[]>>(
    (acc, i) => {
      (acc[i.category] ||= []).push(i);
      return acc;
    },
    {} as Record<IntegrationCategory, Integration[]>,
  );

  const cats: IntegrationCategory[] = ["calls", "messaging", "email", "crm", "support", "docs"];

  return (
    <div className="space-y-10">
      <div>
        <span className="eyebrow block mb-2">Integrations</span>
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          The surfaces your renewal agents read.
        </h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-xl leading-relaxed">
          Read-only by default. Every outbound from Receipts is a draft your CSM
          signs. Connect what you already pay for — leave the rest dark.
        </p>
      </div>

      {cats.map((cat) => (
        <section key={cat}>
          <div className="flex items-baseline justify-between mb-3">
            <h3 className="text-sm font-medium tracking-tight">{CATEGORY_LABEL[cat]}</h3>
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              {grouped[cat]?.filter((i) => i.status === "connected").length ?? 0} live
            </span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {grouped[cat]?.map((i) => (
              <div
                key={i.id}
                className="border border-border rounded-xl bg-surface p-4 flex items-start gap-3"
              >
                <IntegrationLogo name={i.name} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium tracking-tight">{i.name}</span>
                    <span
                      className={`size-1.5 rounded-full ${STATUS_DOT[i.status]} ${
                        i.status === "connected" ? "animate-pulse" : ""
                      }`}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                    {i.reads}
                  </p>
                  {i.status === "connected" && i.lastSync && (
                    <p className="text-[10px] font-mono text-muted-foreground mt-1.5">
                      synced {i.lastSync}
                    </p>
                  )}
                  <div className="mt-2">
                    {i.status === "connected" ? (
                      <button
                        onClick={() => setOverrides((o) => ({ ...o, [i.id]: "available" }))}
                        className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                      >
                        <Check className="size-3" /> Connected · disconnect
                      </button>
                    ) : i.status === "available" ? (
                      <button
                        onClick={() => setOverrides((o) => ({ ...o, [i.id]: "connected" }))}
                        className="text-[11px] font-medium inline-flex items-center gap-1 text-foreground hover:opacity-80"
                      >
                        Connect <ArrowUpRight className="size-3" />
                      </button>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">On the roadmap</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
