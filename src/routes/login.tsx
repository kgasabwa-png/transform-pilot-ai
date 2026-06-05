import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/AuthShell";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Fluent" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back");
    navigate({ to: "/dashboard" });
  };

  const onGoogle = async () => {
    const res = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/dashboard",
    });
    if (res.error) toast.error((res.error as Error).message);
  };

  return (
    <AuthShell title="Sign in" subtitle="Welcome back to Fluent.">
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField label="Work email">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input"
            placeholder="you@company.com"
          />
        </FormField>
        <FormField label="Password">
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input"
            placeholder="••••••••"
          />
        </FormField>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-foreground text-background font-semibold py-3 rounded-xl hover:bg-foreground/90 disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <Divider />
      <button
        onClick={onGoogle}
        className="w-full border border-border py-3 rounded-xl font-medium hover:bg-foreground/5"
      >
        Continue with Google
      </button>
      <p className="text-sm text-muted-foreground mt-6 text-center">
        New here?{" "}
        <Link to="/signup" className="text-primary font-medium hover:underline">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="eyebrow block mb-2">{label}</span>
      {children}
    </label>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3 my-6">
      <div className="h-px bg-border flex-1" />
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        or
      </span>
      <div className="h-px bg-border flex-1" />
    </div>
  );
}
