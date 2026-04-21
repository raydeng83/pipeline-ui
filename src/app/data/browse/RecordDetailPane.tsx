// src/app/data/browse/RecordDetailPane.tsx
"use client";

import { useEffect, useState } from "react";
import { JsonTreeView } from "@/components/JsonTreeView";

export function RecordDetailPane({ env, type, id }: { env: string; type: string | null; id: string | null }) {
  const [record, setRecord] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!type || !id) { setRecord(null); return; }
    setLoading(true);
    fetch(`/api/data/records/${env}/${type}/${id}`)
      .then((r) => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then((d) => setRecord(d.record))
      .catch(() => setRecord(null))
      .finally(() => setLoading(false));
  }, [env, type, id]);

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col min-h-[500px] max-h-[calc(100vh-280px)]">
      <div className="px-3 py-2 border-b border-slate-100 flex items-center gap-2 text-xs text-slate-700">
        {type && id
          ? <><span className="font-mono">{type} / {id}</span></>
          : <span className="text-slate-400">Click a record to view details</span>}
      </div>
      <div className="flex-1 overflow-auto p-3">
        {loading && <div className="text-xs text-slate-400">Loading…</div>}
        {!loading && record && <JsonTreeView value={record as never} />}
        {!loading && !record && type && id && (
          <div className="text-xs text-rose-600">Record not found.</div>
        )}
      </div>
    </div>
  );
}
