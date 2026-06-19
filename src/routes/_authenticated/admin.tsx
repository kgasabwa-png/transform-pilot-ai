import { createFileRoute, Outlet, Link, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyAdminStatus } from "@/lib/admin/admin.functions";
import { BarChart3, Users, Activity, Wrench, ShieldAlert, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

const nav = [
  { to: "/admin", label: "Overview", icon: BarChart3, exact: true },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/events", label: "Events", icon: Activity },
  { to: "/admin/ingestion", label: "Ingestion errors", icon: AlertTriangle },
  { to: "/admin/ops", label: "Ops & Health", icon: Wrench },
];

function AdminLayout() {
  const fetchStatus = useServerFn(getMyAdminStatus);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-status"],
    queryFn: () => fetchStatus(),
    staleTime: 60_000,
  });
  const { pathname } = useLocation();

  if (isLoading) {
    return <div className="p-10 text-sm text-muted-foreground">Checking access…</div>;
  }
  if (!data?.isAdmin) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-muted-foreground" />
          <h1 className="mt-4 text-xl font-semibold">Admin only</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You don't have access to the operator console.
          </p>
          <Link
            to="/app"
            className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Back to app
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto flex max-w-[1500px]">
        <aside className="sticky top-0 hidden h-dvh w-[220px] shrink-0 flex-col border-r border-border/80 bg-secondary px-4 py-6 md:flex">
          <div className="mb-6 px-2">
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Nyvlo</div>
            <div className="mt-1 text-sm font-semibold">Operator Console</div>
          </div>
          <nav className="flex flex-col gap-0.5">
            {nav.map((n) => {
              const Icon = n.icon;
              const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={[
                    "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13.5px] transition-colors",
                    active
                      ? "bg-foreground/[0.06] text-foreground"
                      : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                  <span>{n.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto">
            <Link
              to="/app"
              className="block rounded-md px-2.5 py-1.5 text-[12px] text-muted-foreground hover:text-foreground"
            >
              ← Back to app
            </Link>
          </div>
        </aside>
        <main className="flex-1 min-w-0 px-6 py-8 md:px-10 md:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
