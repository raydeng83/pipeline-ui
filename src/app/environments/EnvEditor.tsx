"use client";

import { useEffect, useState } from "react";
import { Environment } from "@/lib/fr-config-types";
import { EnvironmentBadge } from "@/components/EnvironmentBadge";

export function EnvEditor({ env }: { env: Environment }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLoading(true);
    setSaved(false);
    fetch(`/api/environments/${env.name}`)
      .then((r) => r.json())
      .then((data) => {
        setContent(data.content ?? "");
        setLoading(false);
      });
  }, [env.name]);

  const handleSave = async () => {
    setSaving(true);
    await fetch(`/api/environments/${env.name}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ envContent: content }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2">
          <EnvironmentBadge env={env} />
          <span className="text-xs font-mono text-slate-400">{env.name}.env</span>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="px-3 py-1 text-xs font-medium bg-sky-600 text-white rounded hover:bg-sky-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving..." : saved ? "Saved!" : "Save"}
        </button>
      </div>

      {loading ? (
        <div className="p-6 text-slate-400 text-sm text-center">Loading...</div>
      ) : (
        <div className="p-1">
          <p className="text-xs text-slate-400 px-3 pt-2 pb-1">
            Edit the .env file for this environment. Values are stored on disk and passed to fr-config-* commands.
          </p>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            spellCheck={false}
            className="w-full h-96 font-mono text-sm p-3 focus:outline-none resize-none text-slate-800 bg-slate-900 text-green-300"
            placeholder={`TENANT_BASE_URL=https://your-tenant.forgeblocks.com/am\nSERVICE_ACCOUNT_ID=\nSERVICE_ACCOUNT_KEY=\nCONFIG_DIR=./config\nSCRIPT_PREFIXES=[]`}
          />
        </div>
      )}
    </div>
  );
}
