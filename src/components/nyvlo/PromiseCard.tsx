import { useState } from "react";
import { Check, Clock3, Sparkles, X, ChevronDown, FileText, Mail, CalendarDays, StickyNote } from "lucide-react";
import type { PromiseItem } from "@/lib/nyvlo/data";

const statusStyle: Record<PromiseItem["status"], { dot: string; label: string }> = {
  overdue:  { dot: "bg-danger",    label: "text-danger" },
  today:    { dot: "bg-warning",   label: "text-warning" },
  pending:  { dot: "bg-foreground/40", label: "text-muted-foreground" },
  upcoming: { dot: "bg-primary",   label: "text-primary" },
  done:     { dot: "bg-success",   label: "text-success" },
};

const sourceIcon: Record<PromiseItem["sourceKind"], typeof FileText> = {
  meeting: CalendarDays,
  email: Mail,
  note: StickyNote,
  page: FileText,
  calendar: CalendarDays,
};

export function PromiseCard({ item }: { item: PromiseItem }) {
  const [open, setOpen] = useState(false);
  const [resolved, setResolved] = useState<null | "done" | "dismissed">(null);
  const SourceIcon = sourceIcon[item.sourceKind];
  const s = statusStyle[item.status];

  return (
    <div className="nyvlo-card group p-4 transition-shadow hover:shadow-[0_1px_2px_rgba(15,15,15,0.04),0_8px_24px_-12px_rgba(15,15,15,0.12)]">
      <div className="flex items-start gap-3">
        <div className={`mt-1.5 h-2 w-2 rounded-full ${s.dot}`} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <h3 className={`text-[15px] font-medium tracking-tight ${resolved === "done" ? "text-muted-foreground line-through" : "text-foreground"}`}>
              {item.title}
            </h3>
            <span className="text-[12.5px] text-muted-foreground">· {item.person}</span>
            {item.company ? <span className="text-[12.5px] text-muted-foreground">({item.company})</span> : null}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
            <span className={`font-medium ${s.label}`}>{item.dueLabel}</span>
            <span className="text-muted-foreground/70">·</span>
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <SourceIcon className="h-3 w-3" />
              {item.sourceLabel}
            </span>
            <span className="text-muted-foreground/70">·</span>
            <ConfidenceChip c={item.confidence} />
          </div>
        </div>

        <div className="flex items-center gap-1">
          {resolved ? (
            <span className="text-[11.5px] text-muted-foreground">{resolved === "done" ? "Marked done" : "Dismissed"}</span>
          ) : (
            <>
              <IconBtn label="Mark done" onClick={() => setResolved("done")}><Check className="h-3.5 w-3.5" /></IconBtn>
              <IconBtn label="Snooze"><Clock3 className="h-3.5 w-3.5" /></IconBtn>
              <IconBtn label="Dismiss" onClick={() => setResolved("dismissed")}><X className="h-3.5 w-3.5" /></IconBtn>
              <button
                onClick={() => setOpen((v) => !v)}
                className="ml-1 inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11.5px] text-foreground/80 hover:bg-muted"
              >
                Details <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
              </button>
            </>
          )}
        </div>
      </div>

      {open && !resolved && (
        <div className="mt-4 grid gap-4 border-t border-border pt-4 md:grid-cols-[1fr,1fr]">
          <div>
            <div className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">Why Nyvlo flagged this</div>
            <p className="text-[13px] leading-relaxed text-foreground/90">{item.sourceQuote}</p>
            <div className="mt-2 text-[11.5px] text-muted-foreground">From {item.sourceLabel} · captured {timeAgo(item.capturedAt)}</div>
          </div>
          {item.draft ? (
            <div>
              <div className="mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                <Sparkles className="h-3 w-3 text-primary" /> Draft reply
              </div>
              <div className="whitespace-pre-wrap rounded-md border border-border bg-secondary/40 p-3 text-[13px] leading-relaxed text-foreground/90">
                {item.draft}
              </div>
              <div className="mt-2 flex justify-end gap-2">
                <button className="rounded-md border border-border px-2.5 py-1 text-[11.5px] hover:bg-muted">Edit</button>
                <button className="rounded-md bg-primary px-2.5 py-1 text-[11.5px] font-medium text-primary-foreground hover:opacity-90">Send</button>
              </div>
            </div>
          ) : (
            <div className="flex items-end">
              <button className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[12px] text-foreground/80 hover:bg-muted">
                <Sparkles className="h-3 w-3 text-primary" /> Draft a reply
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function IconBtn({ children, label, onClick }: { children: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} title={label} aria-label={label} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
      {children}
    </button>
  );
}

function ConfidenceChip({ c }: { c: PromiseItem["confidence"] }) {
  const map = { high: "high confidence", medium: "medium confidence", low: "low confidence" };
  const tone = c === "high" ? "text-success" : c === "medium" ? "text-foreground/60" : "text-muted-foreground";
  return <span className={`font-mono text-[10.5px] ${tone}`}>{map[c]}</span>;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d <= 0) return "today";
  if (d === 1) return "yesterday";
  return `${d}d ago`;
}
