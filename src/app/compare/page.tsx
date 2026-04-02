import { getEnvironments } from "@/lib/fr-config";
import { CompareForm } from "./CompareForm";

export default function ComparePage() {
  const environments = getEnvironments();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Compare Config</h1>
        <p className="text-slate-500 mt-1">
          Pull the remote config into a temporary directory and diff it against your local files.
        </p>
      </div>
      <CompareForm environments={environments} />
    </div>
  );
}
