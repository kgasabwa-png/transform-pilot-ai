import { useEffect, useRef, useState } from "react";
import { Bell, Check } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { formatDistanceToNow } from "date-fns";
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/nyvlo/notifications.functions";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const fetchList = useServerFn(listNotifications);
  const markRead = useServerFn(markNotificationRead);
  const markAll = useServerFn(markAllNotificationsRead);

  const { data: items = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetchList(),
    refetchInterval: 60_000,
  });

  const unread = items.filter((n) => !n.read_at);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const handleMarkAll = async () => {
    await markAll();
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const handleClickItem = async (id: string) => {
    await markRead({ data: { id } });
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:bg-accent"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unread.length > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-destructive-foreground">
            {unread.length > 9 ? "9+" : unread.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-30 w-[340px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-border bg-card shadow-lg">
          <div className="flex items-center justify-between border-b border-border bg-secondary/30 px-3 py-2">
            <span className="text-[11.5px] font-medium uppercase tracking-wider text-muted-foreground">
              Reminders
            </span>
            {unread.length > 0 && (
              <button
                onClick={handleMarkAll}
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
              >
                <Check className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {items.length === 0 ? (
              <div className="p-8 text-center text-[12.5px] text-muted-foreground">
                Nothing to nudge about. You're on top of things.
              </div>
            ) : (
              items.map((n) => (
                <Link
                  key={n.id}
                  to="/app/promises"
                  onClick={() => handleClickItem(n.id)}
                  className={`flex items-start gap-2 border-b border-border px-3 py-2.5 last:border-b-0 hover:bg-muted ${
                    !n.read_at ? "bg-warning/10" : ""
                  }`}
                >
                  <span
                    className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                      n.kind === "overdue" ? "bg-danger" : "bg-warning"
                    } ${n.read_at ? "opacity-30" : ""}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12.5px] font-medium text-foreground">
                      {n.title}
                    </div>
                    {n.body && (
                      <div className="truncate text-[11.5px] text-muted-foreground">
                        {n.body}
                      </div>
                    )}
                    <div className="mt-0.5 text-[10.5px] text-muted-foreground/80">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
