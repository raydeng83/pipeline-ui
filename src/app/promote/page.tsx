import { getEnvironments } from "@/lib/fr-config";
import { PromoteForm } from "./PromoteForm";

export default function PromotePage() {
  const environments = getEnvironments();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Promote Config</h1>
        <p className="text-slate-500 mt-1">
          Migrate configuration from one tenant environment to another.
        </p>
      </div>
      <PromoteForm environments={environments} />
    </div>
  );
}
