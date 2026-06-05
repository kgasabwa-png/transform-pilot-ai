import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/AuthShell";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Get started — Fluent" }] }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
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
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + "/dashboard",
        data: { full_name: fullName },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    if (data.session) {
      toast.success("Account created");
      navigate({ to: "/dashboard" });
    } else {
      toast.success("Check your inbox to verify your email.");
    }
  };

  const onGoogle = async () => {
    const res = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/dashboard",
    });
    if (res.error) toast.error((res.error as Error).message);
  };

  return (
    <AuthShell title="Create your account" subtitle="Start your AI Transformation Execution Plan.">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Full name">
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="auth-input"
            placeholder="Jane Doe"
          />
        </Field>
        <Field label="Work email">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="auth-input"
            placeholder="you@company.com"
          />
        </Field>
        <Field label="Password">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="auth-input"
            placeholder="At least 6 characters"
          />
        </Field>
        <button
          disabled={loading}
          className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>
      <div className="flex items-center gap-3 my-6">
        <div className="h-px bg-border flex-1" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          or
        </span>
        <div className="h-px bg-border flex-1" />
      </div>
      <button
        onClick={onGoogle}
        className="w-full border border-border py-3 rounded-xl font-medium hover:bg-foreground/5"
      >
        Continue with Google
      </button>
      <p className="text-sm text-muted-foreground mt-6 text-center">
        Already have an account?{" "}
        <Link to="/login" className="text-primary font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="eyebrow block mb-2">{label}</span>
      {children}
    </label>
  );
}
