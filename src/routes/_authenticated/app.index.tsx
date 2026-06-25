import { createFileRoute } from "@tanstack/react-router";
import { CompanionApp } from "@/components/companion/CompanionApp";

export const Route = createFileRoute("/_authenticated/app/")({
  head: () => ({ meta: [{ title: "Today · Nyvlo" }] }),
  component: CompanionApp,
});
