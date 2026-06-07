import { ConfidenceLanes } from "../ConfidenceLanes";
import { CalibrationStrip } from "../CalibrationStrip";

export function CsmSurface() {
  return (
    <div className="max-w-4xl mx-auto px-6 pt-8 space-y-6">
      <CalibrationStrip />
      <ConfidenceLanes />
    </div>
  );
}
