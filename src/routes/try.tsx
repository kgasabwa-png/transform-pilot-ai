import { createFileRoute, Navigate } from "@tanstack/react-router";

// /try drops the visitor straight into the desk as "Sarah Chen" with a
// pre-loaded sample book and a banner. We just redirect into /app with
// demo + role search params so there's one workspace surface to maintain.
export const Route = createFileRoute("/try")({
  head: () => ({
    meta: [
      { title: "Try Receipts — sample CSM book" },
      {
        name: "description",
        content:
          "Explore Receipts on a synthetic 12-account book. No signup. Every receipt clickable.",
      },
    ],
  }),
  component: TryRedirect,
});

function TryRedirect() {
  return <Navigate to="/app" search={{ role: "csm", demo: true }} replace />;
}
