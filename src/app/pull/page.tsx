import { getEnvironments } from "@/lib/fr-config";
import { PullForm } from "./PullForm";

export default function PullPage() {
  const environments = getEnvironments();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pull Config</h1>
        <p className="text-slate-500 mt-1">
          Export configuration from a tenant environment to your local repository.
        </p>
      </div>
      <PullForm environments={environments} />
    </div>
  );
}
