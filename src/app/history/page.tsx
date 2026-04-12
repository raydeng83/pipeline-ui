import { getEnvironments } from "@/lib/fr-config";
import { readHistoryMerged } from "@/lib/op-history";
import { HistoryView } from "./HistoryView";

export default function HistoryPage() {
  const environments = getEnvironments();
  const history = readHistoryMerged({ limit: 500 });
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">History</h1>
        <p className="text-slate-500 mt-1">
          Git-native history for commits to the environments repo, plus recent push / compare / promote
          operations from the local op-log.
        </p>
      </div>
      <HistoryView environments={environments} history={history} />
    </div>
  );
}
