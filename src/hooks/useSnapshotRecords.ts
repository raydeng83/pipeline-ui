"use client";

import { useEffect, useRef, useState } from "react";
import type { SnapshotRecordPage } from "@/lib/data/types";

export function useSnapshotRecords(env: string, type: string | null) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [data, setData] = useState<SnapshotRecordPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!type) { setData(null); return; }

    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ q, page: String(page), limit: String(limit) });
        const res = await fetch(`/api/data/records/${env}/${type}?${params.toString()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setData(await res.json());
        setError(null);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    }, 200);
  }, [env, type, q, page, limit]);

  return { q, setQ, page, setPage, limit, data, loading, error };
}
