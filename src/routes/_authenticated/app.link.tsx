import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { z } from "zod";
import { approveDeviceLink } from "@/lib/nyvlo/device-link.functions";

const searchSchema = z.object({ code: z.string().optional() });

export const Route = createFileRoute("/_authenticated/app/link")({
  validateSearch: searchSchema,
  component: LinkDevicePage,
  head: () => ({ meta: [{ title: "Link device · Nyvlo" }, { name: "robots", content: "noindex" }] }),
});

function LinkDevicePage() {
  const { code } = Route.useSearch();
  const navigate = useNavigate();
  const approve = useServerFn(approveDeviceLink);
  const [status, setStatus] = useState<"idle" | "approving" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [label, setLabel] = useState("");

  useEffect(() => {
    if (!code) return;
    // Try to infer a label from UA
    const ua = navigator.userAgent;
    setLabel(/Mac/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows" : "Device");
  }, [code]);

  if (!code) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">No link code</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Open this page from the link your desktop app or extension generated.
        </p>
      </div>
    );
  }

  const onApprove = async () => {
    setStatus("approving");
    setError(null);
    try {
      await approve({ data: { code, label } });
      setStatus("done");
      // If opened from a custom protocol, the desktop app polls and will close
      // this tab. For browser extension or manual open, just show success.
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not approve");
      setStatus("error");
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-xl font-semibold tracking-tight">Link a device to Nyvlo</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        A device with code <code className="rounded bg-muted px-1.5 py-0.5 text-[12px]">{code}</code> is
        waiting to sign in. Only approve this if you just started it.
      </p>

      <label className="mt-6 block text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        Device name
      </label>
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="e.g. My MacBook"
        className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
      />

      {status === "done" ? (
        <div className="mt-6 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
          Approved. You can return to your device — it'll finish signing in automatically.
        </div>
      ) : (
        <div className="mt-6 flex gap-2">
          <button
            onClick={onApprove}
            disabled={status === "approving"}
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
          >
            {status === "approving" ? "Approving…" : "Approve & sign in"}
          </button>
          <button
            onClick={() => navigate({ to: "/app" })}
            className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted"
          >
            Cancel
          </button>
        </div>
      )}
      {error && (
        <div className="mt-3 text-sm text-red-600">{error}</div>
      )}
    </div>
  );
}
