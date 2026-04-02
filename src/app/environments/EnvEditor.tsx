"use client";

import { useEffect, useState, useCallback } from "react";
import { Environment } from "@/lib/fr-config-types";
import { EnvironmentBadge } from "@/components/EnvironmentBadge";
import { parseEnvFile, serializeEnvFile } from "@/lib/env-parser";
import { cn } from "@/lib/utils";

// ── Field definitions ────────────────────────────────────────────────────────

interface FieldDef {
  key: string;
  label: string;
  description: string;
  required: boolean;
  sensitive?: boolean;
  placeholder?: string;
  type?: "text" | "json-array" | "path";
}

const FIELD_GROUPS: { title: string; fields: FieldDef[] }[] = [
  {
    title: "Tenant Connection",
    fields: [
      {
        key: "TENANT_BASE_URL",
        label: "Tenant Base URL",
        description: "The AM URL of the tenant, e.g. https://tenant.forgeblocks.com/am",
        required: true,
        placeholder: "https://your-tenant.forgeblocks.com/am",
      },
      {
        key: "SERVICE_ACCOUNT_ID",
        label: "Service Account ID",
        description: "UUID of the service account used for API access.",
        required: true,
        placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      },
      {
        key: "SERVICE_ACCOUNT_KEY",
        label: "Service Account Private Key",
        description: "PEM-encoded private key for the service account (paste full key including header/footer).",
        required: true,
        sensitive: true,
        placeholder: "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----",
      },
    ],
  },
  {
    title: "Config Repository",
    fields: [
      {
        key: "CONFIG_DIR",
        label: "Config Directory",
        description: "Absolute or relative path to the local config repository directory.",
        required: true,
        placeholder: "./config",
        type: "path",
      },
      {
        key: "REALMS",
        label: "Realms",
        description: 'JSON array of realm names to manage, e.g. ["alpha"] or ["alpha","bravo"]. Required by fr-config-pull.',
        required: true,
        placeholder: '["alpha"]',
        type: "json-array",
      },
      {
        key: "SCRIPT_PREFIXES",
        label: "Script Prefixes",
        description: 'JSON array of script name prefixes to include, e.g. ["MyOrg-"]. Use [""] to include all scripts.',
        required: true,
        placeholder: '["MyOrg-"]',
        type: "json-array",
      },
    ],
  },
  {
    title: "Optional Config Files",
    fields: [
      {
        key: "AGENTS_CONFIG_FILE",
        label: "Agents Config File",
        description: "Path to JSON file listing OAuth2 agents to manage.",
        required: false,
        placeholder: "./config/agents.json",
        type: "path",
      },
      {
        key: "SAML_CONFIG_FILE",
        label: "SAML Config File",
        description: "Path to JSON file listing SAML entities to manage.",
        required: false,
        placeholder: "./config/saml.json",
        type: "path",
      },
      {
        key: "POLICIES_CONFIG_FILE",
        label: "Policies Config File",
        description: "Path to JSON file listing policy sets to manage.",
        required: false,
        placeholder: "./config/policies.json",
        type: "path",
      },
      {
        key: "OBJECTS_CONFIG_FILE",
        label: "Managed Objects Config File",
        description: "Path to JSON file listing managed objects to include.",
        required: false,
        placeholder: "./config/objects.json",
        type: "path",
      },
      {
        key: "RAW_CONFIG_FILE",
        label: "Raw Config File",
        description: "Path to JSON file listing raw AM config endpoints to manage.",
        required: false,
        placeholder: "./config/raw.json",
        type: "path",
      },
      {
        key: "CSP_CONFIG_FILE",
        label: "CSP Config File",
        description: "Path to JSON file for Content Security Policy configuration.",
        required: false,
        placeholder: "./config/csp.json",
        type: "path",
      },
    ],
  },
];

const ALL_KNOWN_KEYS = new Set(
  FIELD_GROUPS.flatMap((g) => g.fields.map((f) => f.key))
);

// ── Helpers ──────────────────────────────────────────────────────────────────

function getMissingRequired(values: Record<string, string>): string[] {
  return FIELD_GROUPS.flatMap((g) => g.fields)
    .filter((f) => f.required && !values[f.key]?.trim())
    .map((f) => f.label);
}

// ── Sub-components ───────────────────────────────────────────────────────────

function FieldInput({
  field,
  value,
  onChange,
  disabled,
}: {
  field: FieldDef;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const isTextArea =
    field.sensitive || (field.type === "json-array" && value.length > 60);

  if (field.sensitive || field.key === "SERVICE_ACCOUNT_KEY") {
    return (
      <div className="relative">
        <textarea
          rows={visible ? 6 : 2}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={field.placeholder}
          className="w-full font-mono text-xs rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50 resize-none"
          style={{ filter: visible ? "none" : "blur(3px)", userSelect: visible ? "auto" : "none" }}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute top-1.5 right-2 text-xs text-slate-400 hover:text-slate-700"
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
    );
  }

  if (isTextArea) {
    return (
      <textarea
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={field.placeholder}
        className="w-full font-mono text-xs rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50 resize-none"
      />
    );
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder={field.placeholder}
      className="w-full font-mono text-xs rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
    />
  );
}

// ── Test Connection ───────────────────────────────────────────────────────────

type TestState = "idle" | "testing" | "ok" | "fail";

function TestConnectionButton({
  environmentName,
  liveValues,
}: {
  environmentName: string;
  liveValues: Record<string, string>;
}) {
  const [state, setState] = useState<TestState>("idle");
  const [message, setMessage] = useState("");

  const test = async () => {
    setState("testing");
    setMessage("");
    try {
      const res = await fetch("/api/environments/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          TENANT_BASE_URL: liveValues["TENANT_BASE_URL"],
          SERVICE_ACCOUNT_ID: liveValues["SERVICE_ACCOUNT_ID"],
          SERVICE_ACCOUNT_KEY: liveValues["SERVICE_ACCOUNT_KEY"],
        }),
      });
      const data = await res.json();
      setState(data.ok ? "ok" : "fail");
      setMessage(data.message || data.error || "");
    } catch (err) {
      setState("fail");
      setMessage(String(err));
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={test}
        disabled={state === "testing"}
        className={cn(
          "px-3 py-1.5 text-xs font-medium rounded border transition-colors",
          state === "idle" && "border-slate-300 text-slate-600 hover:bg-slate-50",
          state === "testing" && "border-slate-300 text-slate-400 cursor-wait",
          state === "ok" && "border-green-400 bg-green-50 text-green-700",
          state === "fail" && "border-red-400 bg-red-50 text-red-700"
        )}
      >
        {state === "testing"
          ? "Testing..."
          : state === "ok"
          ? "Connected"
          : state === "fail"
          ? "Failed — Retry"
          : "Test Connection"}
      </button>
      {message && (
        <span className={cn("text-xs", state === "ok" ? "text-green-600" : "text-red-600")}>
          {message}
        </span>
      )}
    </div>
  );
}

// ── Main Editor ───────────────────────────────────────────────────────────────

type Tab = "form" | "raw";

export function EnvEditor({ env, onUpdate }: { env: Environment; onUpdate?: (updated: Environment) => void }) {
  const [tab, setTab] = useState<Tab>("form");
  const [rawContent, setRawContent] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [label, setLabel] = useState(env.label);
  const [color, setColor] = useState<Environment["color"]>(env.color);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Load .env content on mount / env change
  useEffect(() => {
    setLoading(true);
    setSaved(false);
    setError("");
    setLabel(env.label);
    setColor(env.color);
    fetch(`/api/environments/${env.name}`)
      .then((r) => r.json())
      .then((data) => {
        const content = data.content ?? "";
        setRawContent(content);
        setValues(parseEnvFile(content));
        setLoading(false);
      });
  }, [env.name]);

  // Sync form → raw when switching to raw tab
  const handleTabChange = useCallback(
    (next: Tab) => {
      if (next === "raw" && tab === "form") {
        setRawContent(serializeEnvFile(values, rawContent));
      }
      if (next === "form" && tab === "raw") {
        setValues(parseEnvFile(rawContent));
      }
      setTab(next);
    },
    [tab, values, rawContent]
  );

  const setField = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const currentRaw = tab === "form" ? serializeEnvFile(values, rawContent) : rawContent;

  const handleSave = async () => {
    setSaving(true);
    setError("");
    const res = await fetch(`/api/environments/${env.name}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, color, envContent: currentRaw }),
    });
    if (res.ok) {
      const updated = await res.json();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      onUpdate?.(updated);
    } else {
      setError("Save failed.");
    }
    setSaving(false);
  };

  const missing = getMissingRequired(values);

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50 gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <EnvironmentBadge env={{ ...env, label, color }} />
          <span className="text-xs font-mono text-slate-400">{env.name}.env</span>
        </div>
        <div className="flex items-center gap-2">
          {error && <span className="text-xs text-red-600">{error}</span>}
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-3 py-1 text-xs font-medium bg-sky-600 text-white rounded hover:bg-sky-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : saved ? "Saved!" : "Save"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-slate-400 text-sm text-center">Loading...</div>
      ) : (
        <>
          {/* Metadata row */}
          <div className="flex flex-wrap items-end gap-4 px-4 py-3 border-b border-slate-100 bg-slate-50/50">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Display Name</label>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="block rounded border border-slate-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 w-44"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Color</label>
              <select
                value={color}
                onChange={(e) => setColor(e.target.value as Environment["color"])}
                className="block rounded border border-slate-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="green">Green</option>
                <option value="blue">Blue</option>
                <option value="yellow">Yellow</option>
                <option value="red">Red (Production)</option>
              </select>
            </div>
            <TestConnectionButton
              environmentName={env.name}
              liveValues={values}
            />
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200">
            {(["form", "raw"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => handleTabChange(t)}
                className={cn(
                  "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                  tab === t
                    ? "border-sky-500 text-sky-700"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                )}
              >
                {t === "form" ? "Form" : "Raw .env"}
              </button>
            ))}
          </div>

          {/* Validation banner */}
          {tab === "form" && missing.length > 0 && (
            <div className="mx-4 mt-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
              Required fields missing: {missing.join(", ")}
            </div>
          )}

          {/* Form tab */}
          {tab === "form" && (
            <div className="p-4 space-y-6 overflow-y-auto max-h-[600px]">
              {FIELD_GROUPS.map((group) => (
                <div key={group.title} className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 border-b border-slate-100 pb-1">
                    {group.title}
                  </h3>
                  {group.fields.map((field) => (
                    <div key={field.key} className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <label className="text-sm font-medium text-slate-700">
                          {field.label}
                        </label>
                        {field.required && (
                          <span className="text-red-500 text-xs">*</span>
                        )}
                        {field.sensitive && (
                          <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">sensitive</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">{field.description}</p>
                      <FieldInput
                        field={field}
                        value={values[field.key] ?? ""}
                        onChange={(v) => setField(field.key, v)}
                      />
                    </div>
                  ))}
                </div>
              ))}

              {/* Extra unknown keys */}
              {Object.entries(values)
                .filter(([k]) => !ALL_KNOWN_KEYS.has(k))
                .map(([key, val]) => (
                  <div key={key} className="space-y-1">
                    <label className="text-sm font-medium text-slate-700 font-mono">{key}</label>
                    <p className="text-xs text-slate-400">Custom / unrecognised variable.</p>
                    <input
                      type="text"
                      value={val}
                      onChange={(e) => setField(key, e.target.value)}
                      className="w-full font-mono text-xs rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                ))}
            </div>
          )}

          {/* Raw tab */}
          {tab === "raw" && (
            <div>
              <p className="text-xs text-slate-400 px-4 pt-3 pb-1">
                Direct edit of the .env file. Changes here are reflected in the form view on next switch.
              </p>
              <textarea
                value={rawContent}
                onChange={(e) => setRawContent(e.target.value)}
                spellCheck={false}
                className="w-full h-96 font-mono text-sm p-4 focus:outline-none resize-none text-green-300 bg-slate-900"
                placeholder={`TENANT_BASE_URL=https://your-tenant.forgeblocks.com/am\nSERVICE_ACCOUNT_ID=\nSERVICE_ACCOUNT_KEY=\nCONFIG_DIR=./config\nSCRIPT_PREFIXES=[]`}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
