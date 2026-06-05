import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="flex flex-col p-8 lg:p-16">
        <Link to="/" className="font-display text-xl font-bold tracking-tighter uppercase">
          Receipts
        </Link>
        <div className="flex-1 flex items-center">
          <div className="w-full max-w-md mx-auto">
            <h1 className="font-display text-4xl font-semibold tracking-tight mb-2">{title}</h1>
            {subtitle && <p className="text-muted-foreground mb-8">{subtitle}</p>}
            <style>{`.auth-input{display:block;width:100%;border:1px solid var(--color-border);border-radius:0.75rem;padding:0.75rem 1rem;background:var(--color-background);font-size:0.95rem;outline:none;transition:all .15s}.auth-input:focus{border-color:var(--color-primary);box-shadow:0 0 0 3px var(--color-ring)}`}</style>
            {children}
          </div>
        </div>
      </div>
      <div className="hidden lg:flex bg-foreground text-background p-16 flex-col justify-between">
        <div className="font-mono text-[10px] uppercase tracking-widest text-background/60">
          The agentic renewal desk
        </div>
        <blockquote className="font-display text-3xl xl:text-4xl leading-tight tracking-tight">
          "Receipts showed the exact customer moments our renewal forecast was missing."
          <footer className="mt-6 font-sans text-sm font-normal text-background/60">
            - VP Customer Success, design partner preview
          </footer>
        </blockquote>
        <div className="font-mono text-[10px] uppercase tracking-widest text-background/60">
          Evidence · Approval · Forecast
        </div>
      </div>
    </div>
  );
}
