import { getEnvironments } from "@/lib/fr-config";
import { readHistory } from "@/lib/history";
import { HistoryView } from "./HistoryView";

export default function HistoryPage() {
  const environments = getEnvironments();
  const history = readHistory();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">History</h1>
        <p className="text-slate-500 mt-1">
          View past pull and push operations across environments.
        </p>
      </div>
      <HistoryView environments={environments} history={history} />
    </div>
  );
}
