import { createFileRoute, Link } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, PenLine, Search, ClipboardList, BookMarked } from "lucide-react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
  type ToolPart,
} from "@/components/ai-elements/tool";
import { NyvloMark } from "@/components/nyvlo/Shell";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/agent")({
  head: () => ({
    meta: [
      { title: "Chief of Staff · Nyvlo" },
      {
        name: "description",
        content:
          "Your AI chief of staff. Drafts follow-ups, preps briefs, and runs research using your promise and memory context.",
      },
      { property: "og:title", content: "Chief of Staff · Nyvlo" },
      {
        property: "og:description",
        content: "An AI executive assistant that actions things, not just observes.",
      },
    ],
  }),
  component: AgentPage,
});

const STORAGE_KEY = "nyvlo.agent.thread.v1";
const CHAT_ID = "nyvlo-agent-v1";

const STARTERS = [
  { icon: PenLine, label: "Draft a reply to Priya about the Q3 forecast" },
  { icon: ClipboardList, label: "Prep me for my next conversation with Marcus" },
  { icon: Search, label: "What do we know about Sara Chen?" },
  { icon: BookMarked, label: "What's most overdue?" },
];

function loadInitial(): UIMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as UIMessage[]) : [];
  } catch {
    return [];
  }
}

function AgentPage() {
  const [initial, setInitial] = useState<UIMessage[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Hydrate from localStorage on client only — avoids SSR/client mismatch.
  useEffect(() => {
    setInitial(loadInitial());
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return (
      <div className="min-h-dvh bg-background">
        <div className="mx-auto max-w-3xl px-4 py-10 text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  return <AgentChat initial={initial} input={input} setInput={setInput} textareaRef={textareaRef} />;
}

function AgentChat({
  initial,
  input,
  setInput,
  textareaRef,
}: {
  initial: UIMessage[];
  input: string;
  setInput: (v: string) => void;
  textareaRef: React.MutableRefObject<HTMLTextAreaElement | null>;
}) {
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/agent" }), []);

  const { messages, sendMessage, status, error } = useChat({
    id: CHAT_ID,
    messages: initial,
    transport,
    onError: (e) => {
      console.error(e);
      toast.error("Agent error", { description: e.message });
    },
  });

  // Persist
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // ignore quota
    }
  }, [messages]);

  // Keep focus on the composer
  useEffect(() => {
    if (status !== "submitted" && status !== "streaming") {
      textareaRef.current?.focus();
    }
  }, [status, textareaRef]);

  const isLoading = status === "submitted" || status === "streaming";

  async function handleSubmit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    setInput("");
    await sendMessage({ text: trimmed });
  }

  function handleStarter(text: string) {
    setInput("");
    sendMessage({ text });
  }

  function handleReset() {
    if (!window.confirm("Start a new conversation? The current one will be cleared.")) return;
    window.localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <Link
            to="/try"
            className="inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to demo
          </Link>
          <div className="flex items-center gap-2">
            <NyvloMark size="sm" />
            <div className="leading-tight">
              <div className="text-[13.5px] font-medium">Chief of Staff</div>
              <div className="text-[11px] text-muted-foreground">Drafts · preps · researches</div>
            </div>
          </div>
          {messages.length > 0 ? (
            <button
              onClick={handleReset}
              className="text-[12px] text-muted-foreground hover:text-foreground"
            >
              New
            </button>
          ) : (
            <span className="w-10" />
          )}
        </div>
      </header>

      {/* Conversation */}
      <Conversation className="mx-auto w-full max-w-3xl flex-1">
        <ConversationContent className="px-4 py-6">
          {messages.length === 0 ? (
            <ConversationEmptyState
              icon={<NyvloMark size="lg" />}
              title="What can I take off your plate?"
              description="I see your open promises and memory. Ask me to draft, prep, or research."
            >
              <div className="mt-6 grid w-full max-w-md gap-2">
                {STARTERS.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => handleStarter(s.label)}
                    className="group flex items-center gap-3 rounded-lg border border-border bg-card px-3.5 py-2.5 text-left text-[13.5px] transition-colors hover:bg-muted"
                  >
                    <s.icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground" />
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </ConversationEmptyState>
          ) : (
            <>
              {messages.map((m) => (
                <MessageView key={m.id} message={m} />
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="px-2 py-1">
                  <Shimmer>Thinking…</Shimmer>
                </div>
              )}
            </>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {/* Composer */}
      <div className="border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto w-full max-w-3xl px-4 py-3">
          <PromptInput
            onSubmit={(msg) => handleSubmit(msg.text ?? input)}
            globalDrop={false}
            multiple={false}
          >
            <PromptInputTextarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask nyvlo to draft, prep, or research…"
            />
            <PromptInputFooter className="justify-end">
              <PromptInputSubmit
                status={status}
                disabled={!input.trim() && !isLoading}
              />
            </PromptInputFooter>
          </PromptInput>
          {error ? (
            <p className="mt-2 text-[12px] text-rose-600">{error.message}</p>
          ) : (
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              Demo workspace · Drafts only — nothing is sent without your approval
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageView({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  return (
    <Message from={message.role}>
      <MessageContent>
        {message.parts.map((part, idx) => {
          if (part.type === "text") {
            return isUser ? (
              <span key={idx} className="whitespace-pre-wrap">
                {part.text}
              </span>
            ) : (
              <MessageResponse key={idx}>{part.text}</MessageResponse>
            );
          }
          if (part.type.startsWith("tool-") || part.type === "dynamic-tool") {
            const toolPart = part as ToolPart;
            return (
              <Tool key={idx} defaultOpen={false} className="my-2">
                <ToolHeader type={toolPart.type as `tool-${string}`} state={toolPart.state} />
                <ToolContent>
                  <ToolInput input={(toolPart as { input?: unknown }).input} />
                  <ToolOutput
                    output={
                      "output" in toolPart && toolPart.output != null ? (
                        <pre className="whitespace-pre-wrap text-[12px] leading-relaxed">
                          {typeof toolPart.output === "string"
                            ? toolPart.output
                            : JSON.stringify(toolPart.output, null, 2)}
                        </pre>
                      ) : undefined
                    }
                    errorText={
                      "errorText" in toolPart ? (toolPart as { errorText?: string }).errorText : undefined
                    }
                  />
                </ToolContent>
              </Tool>
            );
          }
          return null;
        })}
      </MessageContent>
    </Message>
  );
}
