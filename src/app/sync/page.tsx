import { Suspense } from "react";
import { getEnvironments } from "@/lib/fr-config";
import { SyncForm } from "./SyncForm";

export default function SyncPage() {
  const environments = getEnvironments();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="page-title">Sync</h1>
        <p className="section-subtitle mt-1">
          Pull config from a tenant into this repo, or push repo config up to a tenant.
        </p>
      </header>
      <Suspense fallback={<div className="card-padded text-slate-400">Loading…</div>}>
        <SyncForm environments={environments} />
      </Suspense>
    </div>
  );
}
