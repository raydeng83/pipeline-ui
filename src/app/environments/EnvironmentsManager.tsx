"use client";

import { useState } from "react";
import { Environment } from "@/lib/fr-config-types";
import { EnvironmentBadge } from "@/components/EnvironmentBadge";
import { EnvEditor } from "./EnvEditor";
import { cn } from "@/lib/utils";

const COLOR_OPTIONS: { value: Environment["color"]; label: string }[] = [
  { value: "green", label: "Green" },
  { value: "blue", label: "Blue" },
  { value: "yellow", label: "Yellow" },
  { value: "red", label: "Red (Production)" },
];

const COLOR_SWATCHES: Record<Environment["color"], string> = {
  green: "bg-green-400",
  blue: "bg-blue-400",
  yellow: "bg-yellow-400",
  red: "bg-red-400",
};

interface NewEnvForm {
  name: string;
  label: string;
  color: Environment["color"];
  TENANT_BASE_URL: string;
  SERVICE_ACCOUNT_CLIENT_ID: string;
  SERVICE_ACCOUNT_ID: string;
  SERVICE_ACCOUNT_SCOPE: string;
  SERVICE_ACCOUNT_KEY: string;
  CONFIG_DIR: string;
  REALMS: string;
  SCRIPT_PREFIXES: string;
}

const EMPTY_FORM: NewEnvForm = {
  name: "",
  label: "",
  color: "green",
  TENANT_BASE_URL: "",
  SERVICE_ACCOUNT_CLIENT_ID: "",
  SERVICE_ACCOUNT_ID: "",
  SERVICE_ACCOUNT_SCOPE: "fr:am* fr:idm:* fr:idc:esv:* fr:idc:direct-configuration:session:*",
  SERVICE_ACCOUNT_KEY: "",
  CONFIG_DIR: "./config",
  REALMS: '["alpha"]',
  SCRIPT_PREFIXES: '[""]',
};

function buildEnvContent(form: NewEnvForm): string {
  const lines = [
    `TENANT_BASE_URL=${form.TENANT_BASE_URL}`,
    `SERVICE_ACCOUNT_CLIENT_ID=${form.SERVICE_ACCOUNT_CLIENT_ID}`,
    `SERVICE_ACCOUNT_ID=${form.SERVICE_ACCOUNT_ID}`,
    `SERVICE_ACCOUNT_SCOPE=${form.SERVICE_ACCOUNT_SCOPE}`,
    `SERVICE_ACCOUNT_KEY=${form.SERVICE_ACCOUNT_KEY}`,
    `CONFIG_DIR=${form.CONFIG_DIR}`,
    `REALMS=${form.REALMS}`,
    `SCRIPT_PREFIXES=${form.SCRIPT_PREFIXES}`,
  ];
  return lines.join("\n") + "\n";
}

type AddStep = "meta" | "connection" | "repo";

const STEP_LABELS: Record<AddStep, string> = {
  meta: "1. Name & Color",
  connection: "2. Tenant Connection",
  repo: "3. Repository",
};

const STEPS: AddStep[] = ["meta", "connection", "repo"];

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
  const [addStep, setAddStep] = useState<AddStep>("meta");
  const [form, setForm] = useState<NewEnvForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState("");
  const [showKeyInput, setShowKeyInput] = useState(false);

  const setF = (key: keyof NewEnvForm, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setAddStep("meta");
    setAddError("");
    setShowAdd(true);
  };

  const cancelAdd = () => {
    setShowAdd(false);
    setAddError("");
  };

  const handleAddEnv = async () => {
    setSaving(true);
    setAddError("");
    const res = await fetch("/api/environments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        label: form.label,
        color: form.color,
        envContent: buildEnvContent(form),
      }),
    });
    if (res.ok) {
      const created: Environment = await res.json();
      setEnvironments((prev) => [...prev, created]);
      setSelectedEnv(created.name);
      setShowAdd(false);
    } else {
      const data = await res.json();
      setAddError(data.error ?? "Failed to create environment.");
    }
    setSaving(false);
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`Delete environment "${name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/environments/${name}`, { method: "DELETE" });
    if (res.ok) {
      const next = environments.find((e) => e.name !== name);
      setEnvironments((prev) => prev.filter((e) => e.name !== name));
      setSelectedEnv(next?.name ?? null);
    }
  };

  const handleEnvUpdated = (updated: Environment) => {
    setEnvironments((prev) => prev.map((e) => (e.name === updated.name ? updated : e)));
  };

  const currentEnv = environments.find((e) => e.name === selectedEnv) ?? null;
  const stepIdx = STEPS.indexOf(addStep);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Sidebar */}
      <div className="lg:col-span-1 space-y-2">
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden divide-y divide-slate-100">
          {environments.length === 0 && (
            <p className="px-4 py-6 text-sm text-slate-400 text-center">No environments yet.</p>
          )}
          {environments.map((env) => (
            <div
              key={env.name}
              onClick={() => { setSelectedEnv(env.name); setShowAdd(false); }}
              className={cn(
                "flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors",
                selectedEnv === env.name && !showAdd
                  ? "bg-sky-50 border-l-4 border-l-sky-500"
                  : ""
              )}
            >
              <div className="space-y-0.5 min-w-0">
                <EnvironmentBadge env={env} />
                <p className="text-xs text-slate-400 font-mono truncate">{env.name}/.env</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(env.name); }}
                className="text-slate-300 hover:text-red-500 transition-colors text-sm ml-2 shrink-0"
                title="Delete environment"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={showAdd ? cancelAdd : openAdd}
          className={cn(
            "w-full px-4 py-2 border-2 rounded-lg text-sm transition-colors",
            showAdd
              ? "border-slate-300 text-slate-500 hover:bg-slate-50"
              : "border-dashed border-slate-300 text-slate-500 hover:border-sky-400 hover:text-sky-600"
          )}
        >
          {showAdd ? "Cancel" : "+ Add Environment"}
        </button>
      </div>

      {/* Right panel */}
      <div className="lg:col-span-2">
        {showAdd ? (
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            {/* Stepper header */}
            <div className="flex border-b border-slate-200">
              {STEPS.map((step, i) => (
                <button
                  key={step}
                  onClick={() => i < stepIdx && setAddStep(step)}
                  className={cn(
                    "flex-1 px-3 py-3 text-xs font-medium transition-colors text-center",
                    addStep === step
                      ? "bg-sky-50 text-sky-700 border-b-2 border-sky-500"
                      : i < stepIdx
                      ? "text-slate-600 hover:bg-slate-50 cursor-pointer"
                      : "text-slate-400 cursor-default"
                  )}
                >
                  {STEP_LABELS[step]}
                </button>
              ))}
            </div>

            <div className="p-6 space-y-5">
              {/* Step 1: meta */}
              {addStep === "meta" && (
                <>
                  <h2 className="text-base font-semibold text-slate-800">Environment Details</h2>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <p className="text-xs text-slate-400">
                        Slug used internally and as the .env filename. Lowercase, no spaces.
                      </p>
                      <input
                        value={form.name}
                        onChange={(e) => setF("name", e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ""))}
                        placeholder="e.g. staging"
                        className="block w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">
                        Display Label <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={form.label}
                        onChange={(e) => setF("label", e.target.value)}
                        placeholder="e.g. Staging"
                        className="block w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Color</label>
                      <div className="flex gap-3 flex-wrap">
                        {COLOR_OPTIONS.map((opt) => (
                          <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm">
                            <input
                              type="radio"
                              name="color"
                              value={opt.value}
                              checked={form.color === opt.value}
                              onChange={() => setF("color", opt.value)}
                              className="sr-only"
                            />
                            <span
                              className={cn(
                                "w-4 h-4 rounded-full inline-block ring-2 ring-offset-1",
                                COLOR_SWATCHES[opt.value],
                                form.color === opt.value ? "ring-slate-600" : "ring-transparent"
                              )}
                            />
                            <span className={form.color === opt.value ? "font-medium text-slate-800" : "text-slate-500"}>
                              {opt.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Step 2: connection */}
              {addStep === "connection" && (
                <>
                  <h2 className="text-base font-semibold text-slate-800">Tenant Connection</h2>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">
                        Tenant Base URL <span className="text-red-500">*</span>
                      </label>
                      <p className="text-xs text-slate-400">
                        Root URL of the tenant — do <strong>not</strong> include <code className="bg-slate-100 px-1 rounded">/am</code> (the CLI appends it automatically).
                      </p>
                      <input
                        value={form.TENANT_BASE_URL}
                        onChange={(e) => setF("TENANT_BASE_URL", e.target.value)}
                        placeholder="https://your-tenant.forgeblocks.com"
                        className="block w-full font-mono text-sm rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">
                        Service Account Client ID <span className="text-red-500">*</span>
                      </label>
                      <p className="text-xs text-slate-400">OAuth2 client ID for the service account.</p>
                      <input
                        value={form.SERVICE_ACCOUNT_CLIENT_ID}
                        onChange={(e) => setF("SERVICE_ACCOUNT_CLIENT_ID", e.target.value)}
                        placeholder="service-account-client-id"
                        className="block w-full font-mono text-sm rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">
                        Service Account ID <span className="text-red-500">*</span>
                      </label>
                      <p className="text-xs text-slate-400">UUID of the service account (JWT issuer).</p>
                      <input
                        value={form.SERVICE_ACCOUNT_ID}
                        onChange={(e) => setF("SERVICE_ACCOUNT_ID", e.target.value)}
                        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                        className="block w-full font-mono text-sm rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">
                        Service Account Scope <span className="text-red-500">*</span>
                      </label>
                      <p className="text-xs text-slate-400">OAuth2 scope(s) requested, space-separated.</p>
                      <input
                        value={form.SERVICE_ACCOUNT_SCOPE}
                        onChange={(e) => setF("SERVICE_ACCOUNT_SCOPE", e.target.value)}
                        placeholder="fr:am* fr:idm:* fr:idc:esv:* fr:idc:direct-configuration:session:*"
                        className="block w-full font-mono text-sm rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-slate-700">
                          Service Account Private Key <span className="text-red-500">*</span>
                        </label>
                        <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">sensitive</span>
                        <button
                          type="button"
                          onClick={() => setShowKeyInput((v) => !v)}
                          className="text-xs text-slate-400 hover:text-slate-700 ml-auto"
                        >
                          {showKeyInput ? "Hide" : "Show"}
                        </button>
                      </div>
                      <p className="text-xs text-slate-400">
                        PEM-encoded private key (include header and footer lines).
                      </p>
                      <textarea
                        rows={4}
                        value={form.SERVICE_ACCOUNT_KEY}
                        onChange={(e) => setF("SERVICE_ACCOUNT_KEY", e.target.value)}
                        placeholder={"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"}
                        className="w-full font-mono text-xs rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                        style={{ filter: showKeyInput ? "none" : "blur(3px)", userSelect: showKeyInput ? "auto" : "none" }}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Step 3: repo */}
              {addStep === "repo" && (
                <>
                  <h2 className="text-base font-semibold text-slate-800">Repository Settings</h2>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">
                        Config Directory <span className="text-red-500">*</span>
                      </label>
                      <p className="text-xs text-slate-400">
                        Path to the local directory where fr-config-manager reads/writes config files.
                      </p>
                      <input
                        value={form.CONFIG_DIR}
                        onChange={(e) => setF("CONFIG_DIR", e.target.value)}
                        placeholder="./config"
                        className="block w-full font-mono text-sm rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">
                        Realms <span className="text-red-500">*</span>
                      </label>
                      <p className="text-xs text-slate-400">
                        JSON array of realm names to manage, e.g. <code className="bg-slate-100 px-1 rounded">{`["alpha"]`}</code>
                      </p>
                      <input
                        value={form.REALMS}
                        onChange={(e) => setF("REALMS", e.target.value)}
                        placeholder='["alpha"]'
                        className="block w-full font-mono text-sm rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">
                        Script Prefixes <span className="text-red-500">*</span>
                      </label>
                      <p className="text-xs text-slate-400">
                        JSON array of script name prefixes to include, e.g. <code className="bg-slate-100 px-1 rounded">{`["MyOrg-"]`}</code>. Use <code className="bg-slate-100 px-1 rounded">{`[""]`}</code> to include all.
                      </p>
                      <input
                        value={form.SCRIPT_PREFIXES}
                        onChange={(e) => setF("SCRIPT_PREFIXES", e.target.value)}
                        placeholder='["MyOrg-"]'
                        className="block w-full font-mono text-sm rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>
                  {addError && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                      {addError}
                    </p>
                  )}
                </>
              )}

              {/* Nav buttons */}
              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => stepIdx > 0 && setAddStep(STEPS[stepIdx - 1])}
                  disabled={stepIdx === 0}
                  className="px-4 py-2 text-sm border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-30"
                >
                  Back
                </button>

                {addStep !== "repo" ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (addStep === "meta" && (!form.name || !form.label)) return;
                      setAddStep(STEPS[stepIdx + 1]);
                    }}
                    disabled={addStep === "meta" && (!form.name || !form.label)}
                    className="px-4 py-2 text-sm bg-sky-600 text-white rounded hover:bg-sky-700 disabled:opacity-50"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleAddEnv}
                    disabled={saving || !form.TENANT_BASE_URL || !form.CONFIG_DIR}
                    className="px-4 py-2 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {saving ? "Creating..." : "Create Environment"}
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : currentEnv ? (
          <EnvEditor env={currentEnv} onUpdate={handleEnvUpdated} />
        ) : (
          <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-slate-400 text-sm">
            Select an environment to edit its configuration.
          </div>
        )}
      </div>
    </div>
  );
}
