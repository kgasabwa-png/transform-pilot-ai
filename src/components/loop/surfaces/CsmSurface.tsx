import { ConfidenceLanes } from "../ConfidenceLanes";
import { WorkflowSteps } from "../WorkflowSteps";

export function CsmSurface() {
  return (
    <div className="max-w-4xl mx-auto px-6 pt-6">
      <WorkflowSteps
        title="Your morning, in 3 moves"
        steps={[
          {
            label: "Skim Shipped",
            detail: "See what the agent did overnight. Revert anything off — one click, 30-day window.",
          },
          {
            label: "Clear Quick Review",
            detail: "Customer-facing drafts wait for your sign-off. Approve, edit, or decline.",
          },
          {
            label: "Decide Judgment calls",
            detail: "Money or high-stakes plays. Route to manager for co-sign if over $25k.",
          },
        ]}
      />
      <div className="-mt-2">
        <ConfidenceLanes />
      </div>
    </div>
  );
}
