import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState } from "react";
import { Shell } from "@/components/nyvlo/Shell";
import { Sparkles, ArrowUp, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/app/command")({
  head: () => ({ meta: [{ title: "Command Center · Nyvlo" }] }),
  component: CommandPage,
});

const prompts = [
  "What am I forgetting?",
  "Who am I behind on?",
  "Prepare me for tomorrow",
  "Summarize my week",
];

function CommandPage() {
  const [input, setInput] = useState("");
  const transport = new DefaultChatTransport({
    api: "/api/chat",
    fetch: async (url, init) => {
      const { data } = await supabase.auth.getSession();
      const headers = new Headers(init?.headers);
      if (data.session?.access_token) headers.set("Authorization", `Bearer ${data.session.access_token}`);
      return fetch(url, { ...init, headers });
    },
  });

  const { messages, sendMessage, status } = useChat({ transport });
  const loading = status === "submitted" || status === "streaming";

  const send = async (text: string) => {
    const t = text.trim();
    if (!t || loading) return;
    setInput("");
    await sendMessage({ text: t });
  };

  return (
    <Shell title="Command Center" subtitle="Ask Nyvlo anything about your work memory.">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-col gap-7 pb-32">
          {messages.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <Sparkles className="mx-auto h-5 w-5 text-primary" />
              <p className="mt-3 text-[14px] text-foreground">Ask me about your promises, meetings, or what you might be forgetting.</p>
              <p className="mt-1 text-[12.5px] text-muted-foreground">I only know what you've connected.</p>
            </div>
          )}

          {messages.map((m) => {
            const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
            return (
              <div key={m.id}>
                <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{m.role === "user" ? "You" : "Nyvlo"}</div>
                <div className="mt-1.5 whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/95">{text}</div>
              </div>
            );
          })}
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>

        <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/85 px-4 py-4 backdrop-blur md:left-[244px]">
          <div className="mx-auto max-w-3xl">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {prompts.map((p) => (
                <button key={p} onClick={() => send(p)} disabled={loading} className="rounded-full border border-border bg-card px-3 py-1 text-[11.5px] text-foreground/75 hover:bg-muted disabled:opacity-50">
                  {p}
                </button>
              ))}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 shadow-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Nyvlo anything…"
                disabled={loading}
                className="flex-1 bg-transparent text-[14.5px] outline-none placeholder:text-muted-foreground"
              />
              <button type="submit" disabled={loading || !input.trim()} className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background hover:opacity-90 disabled:opacity-50" aria-label="Send">
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </Shell>
  );
}
