import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { X, ArrowUp, Sparkles } from "lucide-react";

const STARTERS = [
  "What should I do first today?",
  "What's the biggest risk on my book right now?",
  "Draft a warm intro to Halcyon's new VP",
  "Why did you hold the Quill discount?",
];

const transport = new DefaultChatTransport({ api: "/api/chat" });

export function AgentChatDock({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { messages, sendMessage, status } = useChat({
    id: "tandem-agent",
    transport,
  });
  const [input, setInput] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => taRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  const submit = (text: string) => {
    const t = text.trim();
    if (!t || status === "submitted" || status === "streaming") return;
    sendMessage({ text: t });
    setInput("");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
      />
      <aside className="relative h-full w-full max-w-[480px] bg-surface border-l border-border flex flex-col animate-reveal">
        <header className="px-5 py-4 border-b border-border flex items-center gap-3">
          <div className="size-8 rounded-md bg-primary/15 border border-primary/30 flex items-center justify-center">
            <Sparkles className="size-4 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="font-display text-base font-semibold leading-tight">Tandem</div>
            <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
              your agent · scoped to Sara's book
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-auto p-1.5 rounded-md hover:bg-foreground/5 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {messages.length === 0 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Ask anything about your book — accounts, risks, drafts, why I decided what I decided. Every answer pinned to a citation.
              </p>
              <div className="space-y-1.5">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => submit(s)}
                    className="block w-full text-left text-[13px] rounded-md border border-border bg-background hover:border-primary/40 hover:text-primary px-3 py-2 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m: UIMessage) => {
            const text = m.parts
              .map((p) => (p.type === "text" ? p.text : ""))
              .join("");
            const isUser = m.role === "user";
            return (
              <div key={m.id} className={isUser ? "flex justify-end" : ""}>
                {isUser ? (
                  <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-3.5 py-2 text-sm whitespace-pre-wrap">
                    {text}
                  </div>
                ) : (
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">{text}</div>
                )}
              </div>
            );
          })}
          {(status === "submitted" || status === "streaming") && (
            <div className="text-sm text-muted-foreground cursor-blink">Thinking</div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(input);
          }}
          className="border-t border-border p-3 flex items-end gap-2 bg-surface"
        >
          <textarea
            ref={taRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit(input);
              }
            }}
            placeholder="Ask Tandem…"
            rows={2}
            className="flex-1 resize-none bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground/70"
          />
          <button
            type="submit"
            disabled={!input.trim() || status === "submitted" || status === "streaming"}
            className="size-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 hover:opacity-90"
          >
            <ArrowUp className="size-4" />
          </button>
        </form>
        <div className="px-3 pb-3 text-[10px] font-mono text-muted-foreground text-center">
          ⌘K to summon · esc to dismiss
        </div>
      </aside>
    </div>
  );
}
