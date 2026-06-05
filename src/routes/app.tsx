import { createFileRoute, Navigate } from "@tanstack/react-router";

// The full multi-persona desk is on the roadmap, not in the MVP.
// Anyone landing on /app gets routed to the working demo at /try.
export const Route = createFileRoute("/app")({
  component: () => <Navigate to="/try" replace />,
});
