import { getEnvironments, getLogApiCredentials } from "@/lib/fr-config";
import { LogsExplorer } from "./LogsExplorer";

export default function LogsPage() {
  const environments = getEnvironments().map((env) => ({
    ...env,
    hasLogApi: getLogApiCredentials(env.name) !== null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tenant Logs</h1>
        <p className="text-slate-500 mt-1">
          Query monitoring logs from Ping Advanced Identity Cloud tenants.
        </p>
      </div>
      <LogsExplorer environments={environments} />
    </div>
  );
}
