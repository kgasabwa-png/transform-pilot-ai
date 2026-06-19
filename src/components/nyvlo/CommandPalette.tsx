import { useEffect, useRef, useState } from "react";
import { Sparkles, ArrowUp, X } from "lucide-react";
import { answerCommand } from "@/lib/nyvlo/data";

const suggestions = [
  "What am I forgetting?",
  "Who do I owe responses?",
  "Summarize my week",
  "Prepare me for tomorrow",
  "What did I promise Sarah?",
];

interface Turn { q: string; a: string }

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
    if (!open) setQ("");
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && open) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const submit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const a = answerCommand(trimmed);
    setTurns((t) => [...t, { q: trimmed, a }]);
    setQ("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-foreground/30 px-4 pt-[10vh] backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-[640px] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <form
          onSubmit={(e) => { e.preventDefault(); submit(q); }}
          className="flex items-center gap-2 border-b border-border px-4 py-3"
        >
          <Sparkles className="h-4 w-4 text-primary" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ask Nyvlo anything about your work memory…"
            className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">esc</kbd>
          <button type="button" onClick={onClose} className="ml-1 rounded p-1 text-muted-foreground hover:bg-muted">
            <X className="h-3.5 w-3.5" />
          </button>
        </form>

        <div className="max-h-[55vh] overflow-y-auto px-4 py-4">
          {turns.length === 0 ? (
            <div>
              <div className="mb-2 px-1 text-[11px] uppercase tracking-wider text-muted-foreground">Try</div>
              <div className="flex flex-col gap-1">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => submit(s)}
                    className="flex items-center justify-between rounded-md px-2.5 py-2 text-left text-[13.5px] text-foreground/80 hover:bg-muted"
                  >
                    <span>{s}</span>
                    <ArrowUp className="h-3.5 w-3.5 rotate-45 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {turns.map((t, i) => (
                <div key={i}>
                  <div className="text-[12px] uppercase tracking-wider text-muted-foreground">You</div>
                  <div className="mt-1 text-[14px] text-foreground">{t.q}</div>
                  <div className="mt-3 text-[12px] uppercase tracking-wider text-muted-foreground">Nyvlo</div>
                  <div className="mt-1 whitespace-pre-wrap text-[14px] leading-relaxed text-foreground">{t.a}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
