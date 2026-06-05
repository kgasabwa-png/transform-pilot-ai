import { createFileRoute, Outlet, useNavigate, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, Plus, LogOut } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return;
      if (error || !data.user) {
        navigate({ to: "/login" });
      } else {
        setEmail(data.user.email ?? null);
        setReady(true);
      }
    });
    return () => {
      active = false;
    };
  }, [navigate]);

  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center text-muted-foreground text-sm">
        Loading workspace…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header email={email} />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

function Header({ email }: { email: string | null }) {
  const router = useRouter();
  const signOut = async () => {
    await supabase.auth.signOut();
    router.navigate({ to: "/" });
  };
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/dashboard" className="font-display text-lg font-bold tracking-tighter uppercase">
            Fluent
          </Link>
          <nav className="hidden md:flex items-center gap-1 text-sm">
            <Link
              to="/dashboard"
              activeProps={{ className: "bg-foreground/5 text-foreground" }}
              className="px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground inline-flex items-center gap-2"
            >
              <LayoutDashboard className="size-4" /> Dashboard
            </Link>
            <Link
              to="/projects/new"
              activeProps={{ className: "bg-foreground/5 text-foreground" }}
              className="px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground inline-flex items-center gap-2"
            >
              <Plus className="size-4" /> New Project
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground hidden sm:inline">{email}</span>
          <button
            onClick={signOut}
            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
          >
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
