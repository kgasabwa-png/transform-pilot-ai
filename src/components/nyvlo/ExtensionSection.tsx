import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download, VolumeX, Trash2, Check, Clock } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { listMutes, removeMute } from "@/lib/nyvlo/mutes.functions";
import {
  listLinkedDevices,
  revokeLinkedDevice,
} from "@/lib/nyvlo/device-link.functions";

export function ExtensionSection() {
  const queryClient = useQueryClient();

  const fetchMutes = useServerFn(listMutes);
  const unmute = useServerFn(removeMute);
  const { data: mutes = [] } = useQuery({
    queryKey: ["mutedSources"],
    queryFn: () => fetchMutes(),
  });

  const fetchDevices = useServerFn(listLinkedDevices);
  const revoke = useServerFn(revokeLinkedDevice);
  const { data: devices = [] } = useQuery({
    queryKey: ["linkedDevices"],
    queryFn: () => fetchDevices(),
  });

  const handleUnmute = async (id: string) => {
    await unmute({ data: { id } });
    queryClient.invalidateQueries({ queryKey: ["mutedSources"] });
  };

  const handleRevoke = async (code: string) => {
    if (!confirm("Revoke this device? It will be signed out next time it checks in.")) return;
    await revoke({ data: { code } });
    queryClient.invalidateQueries({ queryKey: ["linkedDevices"] });
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const { downloadFile } = await import("@/lib/download");
      await downloadFile(url, filename);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Download failed");
    }
  };

  const approvedDevices = devices.filter(
    (d: { status: string }) => d.status === "approved" || d.status === "consumed",
  );

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border bg-secondary/30 px-4 py-2.5">
        <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          Capture tools
        </span>
        <button
          onClick={() => handleDownload("/nyvlo-extension.zip", "nyvlo-extension.zip")}
          aria-label="Download browser extension"
          className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[11px] hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Download className="h-3 w-3" /> Download
        </button>
      </div>

      <div className="border-b border-border px-4 py-3 text-[12px] text-muted-foreground">
        Optional browser context capture for Gmail, Slack, Notion, and Linear.
        Use it when you want meeting notes and action items grounded in the tools
        you were discussing. To install: download the zip, unzip it, open{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-[11px]">chrome://extensions</code>{" "}
        → Developer mode → Load unpacked.
      </div>

      <div className="flex items-center justify-between border-b border-border bg-secondary/20 px-4 py-2.5">
        <div className="text-[12px]">
          <div className="font-medium">Desktop app (meetings)</div>
          <div className="text-[11px] text-muted-foreground">
            Capture system audio, transcript, screen context, enhanced notes, and action items.
            Click "Sign in with Nyvlo" on first launch — that's the only setup.
          </div>
        </div>
        <button
          onClick={() => handleDownload("/nyvlo-desktop.zip", "nyvlo-desktop.zip")}
          aria-label="Download desktop app source"
          className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[11px] hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Download className="h-3 w-3" /> Source
        </button>
      </div>

      <div className="flex items-center justify-between border-b border-border bg-secondary/20 px-4 py-2.5">
        <div className="text-[12px]">
          <div className="font-medium">macOS capture (Swift sidecar)</div>
          <div className="text-[11px] text-muted-foreground">
            System-audio + screen capture via ScreenCaptureKit (macOS 13+).
            Build with <code className="rounded bg-muted px-1 py-0.5 text-[10.5px]">swift build -c release</code> — see README inside.
          </div>
        </div>
        <button
          onClick={() => handleDownload("/nyvlo-mac-capture.zip", "nyvlo-mac-capture.zip")}
          aria-label="Download macOS Swift sidecar source"
          className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[11px] hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Download className="h-3 w-3" /> Swift
        </button>
      </div>

      <div className="border-t border-border bg-secondary/20 px-4 py-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        Linked devices
      </div>
      {approvedDevices.length === 0 ? (
        <div className="px-4 py-3 text-[11.5px] text-muted-foreground">
          No devices linked yet. Sign in from the desktop app or extension to add one.
        </div>
      ) : (
        <div className="flex flex-col">
          {approvedDevices.map(
            (d: {
              code: string;
              device_label: string | null;
              status: string;
              approved_at: string | null;
            }) => (
              <div
                key={d.code}
                className="flex items-center justify-between border-b border-border px-4 py-2 last:border-b-0"
              >
                <div className="min-w-0">
                  <div className="truncate text-[12.5px]">
                    {d.device_label || "Device"}
                  </div>
                  <div className="flex items-center gap-1 text-[10.5px] text-muted-foreground">
                    {d.status === "approved" ? (
                      <Clock className="h-3 w-3" />
                    ) : (
                      <Check className="h-3 w-3" />
                    )}
                    {d.approved_at
                      ? `Linked ${formatDistanceToNow(new Date(d.approved_at), { addSuffix: true })}`
                      : "Pending"}
                  </div>
                </div>
                <button
                  onClick={() => handleRevoke(d.code)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-red-600"
                  aria-label="Revoke device"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ),
          )}
        </div>
      )}

      <div className="border-t border-border bg-secondary/20 px-4 py-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        Muted sources
      </div>
      {mutes.length === 0 ? (
        <div className="px-4 py-3 text-[11.5px] text-muted-foreground">
          Nothing muted. Mute any source when you do not want it used as meeting context.
        </div>
      ) : (
        <div className="flex flex-col">
          {mutes.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between border-b border-border px-4 py-2 last:border-b-0"
            >
              <div className="min-w-0">
                <div className="truncate text-[12px]">{m.label ?? m.mute_key}</div>
                <div className="truncate text-[10.5px] text-muted-foreground">{m.mute_key}</div>
              </div>
              <button
                onClick={() => handleUnmute(m.id)}
                className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] hover:bg-muted"
              >
                <VolumeX className="h-3 w-3" /> Unmute
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
