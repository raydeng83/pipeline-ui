import { getEnvironments } from "@/lib/fr-config";
import { PromoteWorkflow } from "./PromoteWorkflow";

export default function PromotePage() {
  const environments = getEnvironments();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Promote Config</h1>
        <p className="text-slate-500 mt-1">
          Run promotion workflow operations on a Ping AIC tenant.
        </p>
      </div>
      <PromoteWorkflow environments={environments} />
    </div>
  );
}
