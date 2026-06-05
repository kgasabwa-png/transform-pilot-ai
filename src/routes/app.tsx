import { createFileRoute, Navigate } from "@tanstack/react-router";

// Keep old /app links working while the product centers on the evidence-desk demo.
export const Route = createFileRoute("/app")({
  component: () => <Navigate to="/try" replace />,
});
