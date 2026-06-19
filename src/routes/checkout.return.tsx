import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/checkout/return")({
  validateSearch: (search: Record<string, unknown>): { session_id?: string } => ({
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
  }),
  component: CheckoutReturn,
});

function CheckoutReturn() {
  const { session_id } = Route.useSearch();
  return (
    <div className="min-h-dvh bg-background text-foreground flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-4 text-2xl font-semibold">{session_id ? "You're in." : "No session found"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {session_id
            ? "Thanks for upgrading to Nyvlo Pro. You can close this tab and head back to the app."
            : "We couldn't find your checkout session. Try again from the pricing page."}
        </p>
        <Link to="/app" className="mt-6 inline-flex rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background">
          Open the app
        </Link>
      </div>
    </div>
  );
}
