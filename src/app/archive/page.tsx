import { readArchivedTasks } from "@/lib/promotion-tasks";
import { getEnvironments } from "@/lib/fr-config";
import { ArchiveView } from "./ArchiveView";

export default function ArchivePage() {
  const tasks = readArchivedTasks();
  const environments = getEnvironments();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Archived Promotions</h1>
        <p className="section-subtitle mt-1">
          Completed and failed promotion tasks with their dry-run diff reports.
        </p>
      </div>
      <ArchiveView tasks={tasks} environments={environments} />
    </div>
  );
}
