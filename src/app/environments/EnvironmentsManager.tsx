"use client";

import { useState } from "react";
import { Environment } from "@/lib/fr-config-types";
import { EnvironmentBadge } from "@/components/EnvironmentBadge";
import { EnvEditor } from "./EnvEditor";

export function EnvironmentsManager({
  initialEnvironments,
}: {
  initialEnvironments: Environment[];
}) {
  const [environments, setEnvironments] = useState(initialEnvironments);
  const [selectedEnv, setSelectedEnv] = useState<string | null>(
    initialEnvironments[0]?.name ?? null
  );
  const [showAdd, setShowAdd] = useState(false);
  const [newEnv, setNewEnv] = useState({ name: "", label: "", color: "blue" as Environment["color"], envContent: "" });
  const [saving, setSaving] = useState(false);

  const handleAddEnv = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/environments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newEnv),
    });
    if (res.ok) {
      const created: Environment = await res.json();
      setEnvironments((prev) => [...prev, created]);
      setSelectedEnv(created.name);
      setShowAdd(false);
      setNewEnv({ name: "", label: "", color: "blue", envContent: "" });
    }
    setSaving(false);
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`Delete environment "${name}"?`)) return;
    const res = await fetch(`/api/environments/${name}`, { method: "DELETE" });
    if (res.ok) {
      setEnvironments((prev) => prev.filter((e) => e.name !== name));
      if (selectedEnv === name) setSelectedEnv(environments.find((e) => e.name !== name)?.name ?? null);
    }
  };

  const currentEnv = environments.find((e) => e.name === selectedEnv) ?? null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Sidebar */}
      <div className="lg:col-span-1 space-y-2">
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          {environments.map((env) => (
            <div
              key={env.name}
              onClick={() => setSelectedEnv(env.name)}
              className={`flex items-center justify-between px-4 py-3 cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors ${
                selectedEnv === env.name ? "bg-sky-50 border-l-4 border-l-sky-500" : ""
              }`}
            >
              <div className="space-y-0.5">
                <EnvironmentBadge env={env} />
                <p className="text-xs text-slate-400 font-mono">{env.name}.env</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(env.name); }}
                className="text-slate-300 hover:text-red-500 transition-colors text-xs"
                title="Delete"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {!showAdd ? (
          <button
            onClick={() => setShowAdd(true)}
            className="w-full px-4 py-2 border-2 border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:border-sky-400 hover:text-sky-600 transition-colors"
          >
            + Add Environment
          </button>
        ) : (
          <form
            onSubmit={handleAddEnv}
            className="bg-white rounded-lg border border-slate-200 p-4 space-y-3"
          >
            <h3 className="text-sm font-semibold text-slate-700">New Environment</h3>
            <input
              placeholder="Name (e.g. dev)"
              value={newEnv.name}
              onChange={(e) => setNewEnv({ ...newEnv, name: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
              required
              className="block w-full rounded border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <input
              placeholder="Label (e.g. Development)"
              value={newEnv.label}
              onChange={(e) => setNewEnv({ ...newEnv, label: e.target.value })}
              required
              className="block w-full rounded border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <select
              value={newEnv.color}
              onChange={(e) => setNewEnv({ ...newEnv, color: e.target.value as Environment["color"] })}
              className="block w-full rounded border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="green">Green</option>
              <option value="yellow">Yellow</option>
              <option value="blue">Blue</option>
              <option value="red">Red (Production)</option>
            </select>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-3 py-1.5 bg-sky-600 text-white text-sm rounded hover:bg-sky-700 disabled:opacity-50"
              >
                {saving ? "Adding..." : "Add"}
              </button>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="flex-1 px-3 py-1.5 border border-slate-300 text-sm rounded hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Editor */}
      <div className="lg:col-span-2">
        {currentEnv ? (
          <EnvEditor env={currentEnv} />
        ) : (
          <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-slate-400 text-sm">
            Select an environment to edit its configuration.
          </div>
        )}
      </div>
    </div>
  );
}
