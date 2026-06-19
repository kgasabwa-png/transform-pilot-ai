import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Trash2, Plus, Download } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  listExtensionTokens,
  createExtensionToken,
  deleteExtensionToken,
} from "@/lib/nyvlo/extension.functions";

export function ExtensionSection() {
  const queryClient = useQueryClient();
  const fetchTokens = useServerFn(listExtensionTokens);
  const createToken = useServerFn(createExtensionToken);
  const deleteToken = useServerFn(deleteExtensionToken);

  const { data: tokens = [] } = useQuery({
    queryKey: ["extensionTokens"],
    queryFn: () => fetchTokens(),
  });

  const [busy, setBusy] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);

  const handleCreate = async () => {
    setBusy(true);
    try {
      const res = await createToken({ data: {} });
      setNewToken(res.token);
      queryClient.invalidateQueries({ queryKey: ["extensionTokens"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't create token");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Revoke this token? The extension using it will stop working.")) return;
    await deleteToken({ data: { id } });
    queryClient.invalidateQueries({ queryKey: ["extensionTokens"] });
  };

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Token copied");
  };

  const downloadExtension = async () => {
    try {
      const res = await fetch("/nyvlo-extension.zip");
      if (!res.ok) throw new Error(`Download failed (${res.status})`);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "nyvlo-extension.zip";
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Download failed");
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border bg-secondary/30 px-4 py-2.5">
        <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          Browser extension
        </span>
        <button
          onClick={downloadExtension}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[11px] hover:bg-muted"
        >
          <Download className="h-3 w-3" /> Download
        </button>
      </div>

      <div className="border-b border-border px-4 py-3 text-[12px] text-muted-foreground">
        Auto-captures promises from Gmail, Slack, Notion, and Linear (plus any
        selection elsewhere). Download the zip, unzip it, then load it via{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-[11px]">
          chrome://extensions
        </code>{" "}
        → Developer mode → Load unpacked. Open the popup once and paste a
        token below to enable auto-capture.
      </div>

      <div className="flex items-center justify-between border-b border-border bg-secondary/20 px-4 py-2.5">
        <div className="text-[12px]">
          <div className="font-medium">Desktop app (meetings)</div>
          <div className="text-[11px] text-muted-foreground">
            Record a call → transcript → promises in your inbox.
          </div>
        </div>
        <button
          onClick={async () => {
            try {
              const res = await fetch("/nyvlo-desktop.zip");
              if (!res.ok) throw new Error(`Download failed (${res.status})`);
              const blob = await res.blob();
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = "nyvlo-desktop.zip";
              a.click();
              URL.revokeObjectURL(a.href);
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Download failed");
            }
          }}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[11px] hover:bg-muted"
        >
          <Download className="h-3 w-3" /> Source
        </button>
      </div>

      {newToken && (
        <div className="border-b border-border bg-amber-50 px-4 py-3">
          <div className="text-[11.5px] font-medium text-amber-900">
            Copy this token now — you won't see it again
          </div>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 truncate rounded border border-amber-200 bg-white px-2 py-1 text-[11px] text-foreground">
              {newToken}
            </code>
            <button
              onClick={() => copy(newToken)}
              className="inline-flex items-center gap-1 rounded-md bg-amber-900 px-2 py-1 text-[11px] text-amber-50 hover:opacity-90"
            >
              <Copy className="h-3 w-3" /> Copy
            </button>
          </div>
          <button
            onClick={() => setNewToken(null)}
            className="mt-2 text-[10.5px] text-amber-900/70 hover:underline"
          >
            I've copied it
          </button>
        </div>
      )}

      {tokens.length === 0 ? (
        <div className="px-4 py-4">
          <button
            onClick={handleCreate}
            disabled={busy}
            className="inline-flex items-center gap-1 rounded-md bg-foreground px-2.5 py-1.5 text-[12px] font-medium text-background hover:opacity-90 disabled:opacity-50"
          >
            <Plus className="h-3 w-3" /> Generate extension token
          </button>
        </div>
      ) : (
        <div className="flex flex-col">
          {tokens.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between border-b border-border px-4 py-2.5 last:border-b-0"
            >
              <div className="min-w-0">
                <div className="truncate text-[12.5px]">{t.label ?? "Token"}</div>
                <div className="text-[11px] text-muted-foreground">
                  {t.last_used_at
                    ? `Last used ${formatDistanceToNow(new Date(t.last_used_at), { addSuffix: true })}`
                    : "Never used"}
                </div>
              </div>
              <button
                onClick={() => handleDelete(t.id)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-red-600"
                aria-label="Revoke token"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <div className="px-4 py-2.5">
            <button
              onClick={handleCreate}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11.5px] hover:bg-muted disabled:opacity-50"
            >
              <Plus className="h-3 w-3" /> New token
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
