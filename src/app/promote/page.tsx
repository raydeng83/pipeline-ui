import { getEnvironments } from "@/lib/fr-config";
import { readActiveTasks } from "@/lib/promotion-tasks";
import { PromoteWorkflow } from "./PromoteWorkflow";

export default function PromotePage() {
  const environments = getEnvironments();
  const tasks = readActiveTasks();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Promote Config</h1>
        <p className="text-slate-500 mt-1">
          Manage promotion tasks and run workflow operations on Ping AIC tenants.
        </p>
      </div>
      <PromoteWorkflow environments={environments} initialTasks={tasks} />
    </div>
  );
}
