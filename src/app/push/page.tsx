import { getEnvironments } from "@/lib/fr-config";
import { PushForm } from "./PushForm";

export default function PushPage() {
  const environments = getEnvironments();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Push Config</h1>
        <p className="text-slate-500 mt-1">
          Deploy configuration from your local repository to a tenant environment.
        </p>
      </div>
      <PushForm environments={environments} />
    </div>
  );
}
