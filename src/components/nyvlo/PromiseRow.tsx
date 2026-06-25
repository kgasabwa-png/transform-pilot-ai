import { useState } from "react";
import { Check, Sparkles, X, ChevronDown, Mail, CalendarDays, StickyNote, ExternalLink, Flag, VolumeX } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { updatePromiseStatus, reportNotAPromise, getPromiseSource } from "@/lib/nyvlo/data.functions";
import { addMute } from "@/lib/nyvlo/mutes.functions";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export interface PromiseRowData {
  id: string;
  summary: string;
  owed_to: string | null;
  channel: string | null;
  due_at: string | null;
  status: "open" | "kept" | "missed" | "dismissed";
  confidence: number | null;
  draft_reply: string | null;
  evidence_snippet: string | null;
  created_at: string;
}

export function PromiseRow({ item }: { item: PromiseRowData }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const update = useServerFn(updatePromiseStatus);
  const flag = useServerFn(reportNotAPromise);
  const fetchSource = useServerFn(getPromiseSource);

  const sourceQ = useQuery({
    queryKey: ["promise-source", item.id],
    queryFn: () => fetchSource({ data: { id: item.id } }),
    enabled: open,
    staleTime: 60_000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["promises"] });
    queryClient.invalidateQueries({ queryKey: ["todayStats"] });
  };

  const mutation = useMutation({
    mutationFn: (status: "kept" | "missed" | "dismissed") =>
      update({ data: { id: item.id, status } }),
    onSuccess: (_, status) => {
      toast.success(status === "kept" ? "Marked done" : status === "dismissed" ? "Dismissed" : "Updated");
      invalidate();
    },
    onError: () => toast.error("Couldn't update"),
  });

  const notAPromise = useMutation({
    mutationFn: () => flag({ data: { id: item.id } }),
    onSuccess: () => {
      toast.success("Thanks — Nyvlo will be more careful next time");
      invalidate();
    },
    onError: () => toast.error("Couldn't submit feedback"),
  });

  const mute = useServerFn(addMute);
  const muteSource = useMutation({
    mutationFn: (url: string) => mute({ data: { url } }),
    onSuccess: (res) => {
      toast.success(`Muted ${res.label ?? "source"} — won't auto-capture again`);
      queryClient.invalidateQueries({ queryKey: ["mutedSources"] });
    },
    onError: () => toast.error("Couldn't mute source"),
  });

  const SrcIcon = item.channel === "email" ? Mail : item.channel === "meeting" ? CalendarDays : StickyNote;
  const dueLabel = formatDue(item.due_at);
  const dueTone = dueTone_(item.due_at);

  return (
    <div className="rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-sm">
      <div className="flex items-start gap-3">
        <div className={`mt-1.5 h-2 w-2 rounded-full ${dueTone.dot}`} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <h3 className="text-[15px] font-medium tracking-tight">{item.summary}</h3>
            {item.owed_to && <span className="text-[12.5px] text-muted-foreground">· {item.owed_to}</span>}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
            <span className={`font-medium ${dueTone.label}`}>{dueLabel}</span>
            {item.channel && (
              <>
                <span className="text-muted-foreground/70">·</span>
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <SrcIcon className="h-3 w-3" />
                  {item.channel}
                </span>
              </>
            )}
            {item.confidence != null && (
              <>
                <span className="text-muted-foreground/70">·</span>
                <span className="font-mono text-[10.5px] text-muted-foreground">
                  {Math.round(Number(item.confidence) * 100)}% confidence
                </span>
              </>
            )}
          </div>
          {item.evidence_snippet && (
            <p className="mt-2 border-l-2 border-border pl-2 text-[12.5px] italic leading-snug text-muted-foreground line-clamp-2">
              "{item.evidence_snippet}"
            </p>
          )}
        </div>

        <div className="flex items-center gap-1">
          <IconBtn label="Mark done" onClick={() => mutation.mutate("kept")} disabled={mutation.isPending}>
            <Check className="h-3.5 w-3.5" />
          </IconBtn>
          <IconBtn label="Dismiss" onClick={() => mutation.mutate("dismissed")} disabled={mutation.isPending}>
            <X className="h-3.5 w-3.5" />
          </IconBtn>
          <button
            onClick={() => setOpen((v) => !v)}
            className="ml-1 inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11.5px] hover:bg-muted"
          >
            Details <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-4 grid gap-4 border-t border-border pt-4 md:grid-cols-[1fr,1fr]">
          <div className="space-y-2">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Source</div>
            {sourceQ.data?.url ? (
              <a
                href={sourceQ.data.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex max-w-full items-center gap-1.5 truncate rounded-md border border-border bg-secondary/40 px-2.5 py-1.5 text-[12.5px] hover:bg-muted"
              >
                <ExternalLink className="h-3 w-3 shrink-0" />
                <span className="truncate">{sourceQ.data.title ?? sourceQ.data.url}</span>
              </a>
            ) : (
              <div className="text-[12px] text-muted-foreground">
                {sourceQ.isLoading ? "Loading…" : "No external source link"}
              </div>
            )}
            <div className="text-[11.5px] text-muted-foreground">
              Captured {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                onClick={() => notAPromise.mutate()}
                disabled={notAPromise.isPending}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-[11.5px] text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
              >
                <Flag className="h-3 w-3" /> Not an action
              </button>
              {sourceQ.data?.url && (
                <button
                  onClick={() => muteSource.mutate(sourceQ.data!.url!)}
                  disabled={muteSource.isPending}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-[11.5px] text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
                >
                  <VolumeX className="h-3 w-3" /> Mute source
                </button>
              )}
            </div>
          </div>
          {item.draft_reply && (
            <div>
              <div className="mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                <Sparkles className="h-3 w-3 text-primary" /> Draft reply
              </div>
              <div className="whitespace-pre-wrap rounded-md border border-border bg-secondary/40 p-3 text-[13px] leading-relaxed">
                {item.draft_reply}
              </div>
              <div className="mt-2 flex justify-end gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(item.draft_reply ?? "");
                    toast.success("Draft copied");
                  }}
                  className="rounded-md border border-border px-2.5 py-1 text-[11.5px] hover:bg-muted"
                >
                  Copy draft
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function IconBtn({ children, label, onClick, disabled }: { children: React.ReactNode; label: string; onClick?: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} title={label} aria-label={label} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40">
      {children}
    </button>
  );
}

function formatDue(d: string | null) {
  if (!d) return "No due date";
  const date = new Date(d);
  const diffMs = date.getTime() - Date.now();
  const dayMs = 86400000;
  if (diffMs < -dayMs) return `Overdue · ${Math.floor(-diffMs / dayMs)}d`;
  if (diffMs < 0) return "Overdue";
  if (diffMs < dayMs) return "Today";
  if (diffMs < 2 * dayMs) return "Tomorrow";
  if (diffMs < 7 * dayMs) return date.toLocaleDateString(undefined, { weekday: "long" });
  return date.toLocaleDateString();
}

function dueTone_(d: string | null) {
  if (!d) return { dot: "bg-muted-foreground/40", label: "text-muted-foreground" };
  const diff = new Date(d).getTime() - Date.now();
  if (diff < 0) return { dot: "bg-rose-500", label: "text-rose-600" };
  if (diff < 86400000) return { dot: "bg-amber-500", label: "text-amber-600" };
  return { dot: "bg-primary", label: "text-primary" };
}
