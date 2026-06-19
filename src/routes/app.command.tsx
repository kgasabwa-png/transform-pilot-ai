import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/nyvlo/Shell";
import { answerCommand } from "@/lib/nyvlo/data";
import { Sparkles, ArrowUp } from "lucide-react";

export const Route = createFileRoute("/app/command")({
  head: () => ({ meta: [{ title: "Command Center · Nyvlo" }] }),
  component: CommandPage,
});

const seedTurns = [
  { q: "What am I forgetting?", a: answerCommand("what am I forgetting") },
];

const prompts = [
  "Who do I owe responses?",
  "What did I promise Sarah?",
  "Prepare me for tomorrow",
  "Summarize my week",
  "What's overdue?",
];

function CommandPage() {
  const [turns, setTurns] = useState(seedTurns);
  const [q, setQ] = useState("");

  const send = (text: string) => {
    const t = text.trim();
    if (!t) return;
    setTurns((cur) => [...cur, { q: t, a: answerCommand(t) }]);
    setQ("");
  };

  return (
    <Shell title="Command Center" subtitle="Ask Nyvlo anything about your work memory. It only knows what you've saved.">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-col gap-7 pb-32">
          {turns.map((t, i) => (
            <div key={i}>
              <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">You</div>
              <div className="mt-1 text-[15px] leading-relaxed text-foreground">{t.q}</div>

              <div className="mt-5 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                <Sparkles className="h-3 w-3 text-primary" /> Nyvlo
              </div>
              <div className="mt-1.5 whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/95">{t.a}</div>
            </div>
          ))}
        </div>

        <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/85 px-4 py-4 backdrop-blur md:left-[244px]">
          <div className="mx-auto max-w-3xl">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {prompts.map((p) => (
                <button key={p} onClick={() => send(p)} className="rounded-full border border-border bg-card px-3 py-1 text-[11.5px] text-foreground/75 hover:bg-muted">
                  {p}
                </button>
              ))}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); send(q); }} className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 shadow-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Ask Nyvlo anything…"
                className="flex-1 bg-transparent text-[14.5px] outline-none placeholder:text-muted-foreground"
              />
              <button type="submit" className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background hover:opacity-90" aria-label="Send">
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </Shell>
  );
}
