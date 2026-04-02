import { getEnvironments } from "@/lib/fr-config";
import { ConfigsViewer } from "./ConfigsViewer";

export default function ConfigsPage() {
  const environments = getEnvironments();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Config Browser</h1>
        <p className="text-slate-500 mt-1">
          Browse and inspect configuration files for each environment.
        </p>
      </div>
      <ConfigsViewer environments={environments} />
    </div>
  );
}
