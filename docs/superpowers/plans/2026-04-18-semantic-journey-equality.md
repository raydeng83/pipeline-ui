# Semantic Journey Equality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace path-based byte-diff with a semantic equality definition for journeys that strips env-local UUIDs, resolves script references by `(context, name)`, and recurses into inner journeys so ide↔ide3 compares produce meaningful results.

**Architecture:** A new `src/lib/semantic-compare/` module provides canonicalization + equality predicates. `compareDirs` stays as the file-diff engine for non-journey scopes. For `journeys` + `scripts`, `buildReport` consults the semantic layer to compute a `SemanticStatus` per entity and emits a structured `EqualityReason` list that the UI surfaces as badges.

**Tech Stack:** TypeScript (strict), Vitest (unit + integration), existing fixtures under `environments/ide` and `environments/ide3`.

---

## Design Reference

### Identity per resource

| Resource | Env-local | Stable identity |
|----------|-----------|-----------------|
| Journey | `_id` = name (already stable) | directory name |
| Node within journey | node UUID | `${nodeType}:${displayName}` + disambiguator |
| Script | `_id` (UUID) | `(context, name)` tuple |

### Canonicalization pipeline

1. **Env-level**: build `scriptMap: uuid → "${context}/${name}"` from `scripts-config/*.json`.
2. **Per-journey**: build `nodeKeyMap: uuid → stableKey` via BFS from `entryNodeId`, outgoing edges sorted by outcome name. Primary key `"${nodeType}:${displayName}"`; collisions disambiguated with `#N` by traversal order; disconnected nodes appended in `(nodeType, displayName)` order; PageNode children share the journey's UUID space.
3. **Rewrite references**:
   - `entryNodeId`, `nodes` keys, `connections.<outcome>`, `staticNodes` keys → stable keys.
   - `ScriptedDecisionNode.script` / `ConfigProviderNode.script` → `${context}/${name}`.
   - `PageNode.nodes[]._id` → stable keys.
4. **Strip**: `_id`, `_rev`, `createdBy`/`creationDate`/`lastModifiedBy`/`lastModifiedDate`/`lastChangeDate`/`lastChangedBy`, `uiConfig.annotations`, node coordinates.
5. **Normalize**: recursive key sort, ESV escape artifacts (`\${foo}` ↔ `${foo}`), line endings, trailing whitespace in script bodies, UTF-8 BOM.

### Equality reason taxonomy

```ts
type EqualityReason =
  | { kind: "header"; fields: string[] }
  | { kind: "node-set"; added: string[]; removed: string[] }
  | { kind: "node-settings"; stableKey: string; diff: Diff }
  | { kind: "script-missing"; identity: string; side: "source" | "target" }
  | { kind: "script-body"; identity: string }
  | { kind: "script-meta"; identity: string; fields: string[] }
  | { kind: "subjourney-missing"; name: string; side: "source" | "target" }
  | { kind: "subjourney-diff"; name: string; reasons: EqualityReason[] };
```

### File structure

```
src/lib/semantic-compare/
  types.ts               # All types: CanonicalScript, CanonicalNode, CanonicalJourney,
                         # EqualityReason, EqualityResult, NodeRefRegistry
  node-refs.ts           # Registry: nodeType -> fields that hold cross-refs
  json-canon.ts          # sortKeys, stripFields, normalizeEsvEscapes
  script-canon.ts        # canonicalizeScript, scriptIdentity, normalizeScriptBody
  script-equal.ts        # scriptsEqual(a, b): { equal, reasons }
  script-map.ts          # buildScriptMap(configDir) -> Map<uuid, "context/name">
  node-key-map.ts        # buildNodeKeyMap(journeyJson) -> Map<uuid, stableKey>
  node-canon.ts          # canonicalizeNode(nodeJson, nodeType, stableKeyMap, scriptMap)
  journey-canon.ts       # canonicalizeJourney(...)  -> CanonicalJourney
  journey-equal.ts       # journeysEqual(src, tgt, ctx): EqualityResult
  index.ts               # re-exports

src/lib/semantic-compare/__fixtures__/
  scripts/               # JSON fixtures for tests
  journeys/
  nodes/

tests/lib/semantic-compare/
  json-canon.test.ts
  script-canon.test.ts
  script-equal.test.ts
  script-map.test.ts
  node-key-map.test.ts
  node-canon.test.ts
  journey-canon.test.ts
  journey-equal.test.ts
  integration.test.ts    # against environments/ide + environments/ide3 fixtures
```

---

## Task 1: Type definitions

**Files:**
- Create: `src/lib/semantic-compare/types.ts`
- Test: `tests/lib/semantic-compare/types.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/semantic-compare/types.test.ts
import { describe, it, expect } from "vitest";
import type {
  CanonicalScript, CanonicalNode, CanonicalJourney,
  EqualityReason, EqualityResult, NodeRefRegistry,
} from "@/lib/semantic-compare/types";

describe("semantic-compare types", () => {
  it("EqualityReason discriminated union covers all declared kinds", () => {
    const kinds: EqualityReason["kind"][] = [
      "header", "node-set", "node-settings",
      "script-missing", "script-body", "script-meta",
      "subjourney-missing", "subjourney-diff",
    ];
    expect(kinds.length).toBe(8);
  });

  it("EqualityResult carries equal + reasons", () => {
    const r: EqualityResult = { equal: true, reasons: [] };
    expect(r.equal).toBe(true);
  });

  it("NodeRefRegistry shape", () => {
    const reg: NodeRefRegistry = { ScriptedDecisionNode: { scriptRefs: ["script"] } };
    expect(reg.ScriptedDecisionNode.scriptRefs).toEqual(["script"]);
  });

  it("CanonicalScript has identity + fingerprint", () => {
    const s: CanonicalScript = {
      identity: "AUTHENTICATION_TREE_DECISION_NODE/Foo",
      context: "AUTHENTICATION_TREE_DECISION_NODE",
      name: "Foo",
      language: "JAVASCRIPT",
      evaluatorVersion: "2.0",
      defaultFlag: false,
      body: "// code",
      description: null,
    };
    expect(s.identity).toContain("/");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/semantic-compare/types.test.ts`
Expected: FAIL with "Cannot find module '@/lib/semantic-compare/types'"

- [ ] **Step 3: Write the types**

```ts
// src/lib/semantic-compare/types.ts
export interface CanonicalScript {
  identity: string;           // "${context}/${name}"
  context: string;
  name: string;
  language: "JAVASCRIPT" | "GROOVY" | string;
  evaluatorVersion: string;
  defaultFlag: boolean;
  body: string;               // normalized body
  description: string | null; // flagged-only, not part of equality
}

export interface CanonicalNode {
  stableKey: string;          // "${nodeType}:${displayName}" + optional "#N"
  nodeType: string;
  displayName: string;
  payload: Record<string, unknown>; // node file JSON, UUIDs rewritten, metadata stripped
}

export interface CanonicalJourney {
  name: string;               // directory name
  header: Record<string, unknown>;   // canonicalized header fields
  nodes: Map<string, CanonicalNode>; // keyed by stableKey
  staticNodeKeys: Set<string>;
  referencedScripts: Set<string>;    // "${context}/${name}" tuples
  referencedSubJourneys: Set<string>;
}

export type EqualityReason =
  | { kind: "header"; fields: string[] }
  | { kind: "node-set"; added: string[]; removed: string[] }
  | { kind: "node-settings"; stableKey: string; diff?: unknown }
  | { kind: "script-missing"; identity: string; side: "source" | "target" }
  | { kind: "script-body"; identity: string }
  | { kind: "script-meta"; identity: string; fields: string[] }
  | { kind: "subjourney-missing"; name: string; side: "source" | "target" }
  | { kind: "subjourney-diff"; name: string; reasons: EqualityReason[] };

export interface EqualityResult {
  equal: boolean;
  reasons: EqualityReason[];
}

export interface NodeRefRegistry {
  [nodeType: string]: {
    scriptRefs?: string[];       // fields holding a script UUID
    treeRefs?: string[];         // fields holding an inner-journey name
    nodeRefs?: string[];         // fields holding node UUIDs (e.g. PageNode.nodes[]._id)
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/semantic-compare/types.test.ts`
Expected: PASS (4/4)

- [ ] **Step 5: Commit**

```bash
git add src/lib/semantic-compare/types.ts tests/lib/semantic-compare/types.test.ts
git commit -m "semantic-compare: add type definitions"
```

---

## Task 2: Node reference registry

**Files:**
- Create: `src/lib/semantic-compare/node-refs.ts`
- Test: `tests/lib/semantic-compare/node-refs.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { NODE_REFS, getRefsFor } from "@/lib/semantic-compare/node-refs";

describe("node ref registry", () => {
  it("ScriptedDecisionNode exposes script field", () => {
    expect(NODE_REFS.ScriptedDecisionNode?.scriptRefs).toContain("script");
  });

  it("ConfigProviderNode exposes script field", () => {
    expect(NODE_REFS.ConfigProviderNode?.scriptRefs).toContain("script");
  });

  it("InnerTreeEvaluatorNode exposes tree field", () => {
    expect(NODE_REFS.InnerTreeEvaluatorNode?.treeRefs).toContain("tree");
  });

  it("PageNode exposes nested node refs", () => {
    expect(NODE_REFS.PageNode?.nodeRefs).toContain("nodes");
  });

  it("unknown node types fall through to empty refs", () => {
    expect(getRefsFor("UnknownCustomNode")).toEqual({});
  });

  it("getRefsFor returns a copy, not the registry entry", () => {
    const a = getRefsFor("ScriptedDecisionNode");
    const b = getRefsFor("ScriptedDecisionNode");
    expect(a).not.toBe(b);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/semantic-compare/node-refs.test.ts`
Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Write the registry**

```ts
// src/lib/semantic-compare/node-refs.ts
import type { NodeRefRegistry } from "./types";

export const NODE_REFS: NodeRefRegistry = {
  ScriptedDecisionNode:    { scriptRefs: ["script"] },
  ConfigProviderNode:      { scriptRefs: ["script"] },
  ConfigProviderNodeV2:    { scriptRefs: ["script"] },
  InnerTreeEvaluatorNode:  { treeRefs: ["tree"] },
  PageNode:                { nodeRefs: ["nodes"] },
};

export function getRefsFor(nodeType: string): NodeRefRegistry[string] {
  const entry = NODE_REFS[nodeType];
  return entry ? { ...entry } : {};
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/semantic-compare/node-refs.test.ts`
Expected: PASS (6/6)

- [ ] **Step 5: Commit**

```bash
git add src/lib/semantic-compare/node-refs.ts tests/lib/semantic-compare/node-refs.test.ts
git commit -m "semantic-compare: node reference field registry"
```

---

## Task 3: JSON canonicalization primitives

**Files:**
- Create: `src/lib/semantic-compare/json-canon.ts`
- Test: `tests/lib/semantic-compare/json-canon.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { sortKeys, stripFields, normalizeEsvEscapes } from "@/lib/semantic-compare/json-canon";

describe("json-canon", () => {
  it("sortKeys sorts object keys recursively", () => {
    const input = { b: 1, a: { d: 2, c: 3 } };
    const out = sortKeys(input) as Record<string, unknown>;
    expect(Object.keys(out)).toEqual(["a", "b"]);
    expect(Object.keys(out.a as object)).toEqual(["c", "d"]);
  });

  it("sortKeys preserves arrays in order", () => {
    const input = [3, 1, 2];
    expect(sortKeys(input)).toEqual([3, 1, 2]);
  });

  it("stripFields removes matching keys at every depth", () => {
    const input = { _id: "abc", name: "x", nested: { _id: "y", z: 1 } };
    const out = stripFields(input, ["_id"]) as Record<string, unknown>;
    expect(out._id).toBeUndefined();
    expect((out.nested as Record<string, unknown>)._id).toBeUndefined();
    expect(out.name).toBe("x");
  });

  it("normalizeEsvEscapes treats \\${foo} and ${foo} equal", () => {
    expect(normalizeEsvEscapes("\\${foo}")).toBe("${foo}");
    expect(normalizeEsvEscapes("${foo}")).toBe("${foo}");
  });

  it("stripFields + sortKeys composes", () => {
    const input = { z: 1, _id: "x", a: { _rev: "1", b: 2 } };
    const out = sortKeys(stripFields(input, ["_id", "_rev"])) as Record<string, unknown>;
    expect(Object.keys(out)).toEqual(["a", "z"]);
    expect(Object.keys(out.a as object)).toEqual(["b"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/semantic-compare/json-canon.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement primitives**

```ts
// src/lib/semantic-compare/json-canon.ts
export function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(value as Record<string, unknown>).sort()) {
      out[k] = sortKeys((value as Record<string, unknown>)[k]);
    }
    return out;
  }
  return value;
}

export function stripFields(value: unknown, fields: string[]): unknown {
  const drop = new Set(fields);
  if (Array.isArray(value)) return value.map((v) => stripFields(v, fields));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (drop.has(k)) continue;
      out[k] = stripFields(v, fields);
    }
    return out;
  }
  return value;
}

/** Collapse \${foo} (escape artifact from vendored pull) to ${foo} for comparison. */
export function normalizeEsvEscapes(s: string): string {
  return s.replace(/\\\$\{/g, "${");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/semantic-compare/json-canon.test.ts`
Expected: PASS (5/5)

- [ ] **Step 5: Commit**

```bash
git add src/lib/semantic-compare/json-canon.ts tests/lib/semantic-compare/json-canon.test.ts
git commit -m "semantic-compare: JSON canonicalization primitives"
```

---

## Task 4: Script canonicalization

**Files:**
- Create: `src/lib/semantic-compare/script-canon.ts`
- Test: `tests/lib/semantic-compare/script-canon.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import {
  canonicalizeScript, scriptIdentity, normalizeScriptBody,
} from "@/lib/semantic-compare/script-canon";

const baseConfig = {
  _id: "abc-uuid",
  _rev: "123",
  name: "Foo",
  context: "AUTHENTICATION_TREE_DECISION_NODE",
  description: "null",
  language: "JAVASCRIPT",
  evaluatorVersion: "2.0",
  default: false,
  script: { file: "scripts-content/AUTHENTICATION_TREE_DECISION_NODE/Foo.js" },
  createdBy: "id=x", creationDate: 1,
  lastModifiedBy: "id=x", lastModifiedDate: 2,
};

describe("script-canon", () => {
  it("scriptIdentity yields context/name", () => {
    expect(scriptIdentity(baseConfig)).toBe("AUTHENTICATION_TREE_DECISION_NODE/Foo");
  });

  it("canonicalizeScript strips env-local fields", () => {
    const body = "return true;\n";
    const s = canonicalizeScript(baseConfig, body);
    expect(s.identity).toBe("AUTHENTICATION_TREE_DECISION_NODE/Foo");
    expect(s.language).toBe("JAVASCRIPT");
    expect(s.evaluatorVersion).toBe("2.0");
    expect(s.defaultFlag).toBe(false);
    expect(s.body).toBe("return true;\n");
    expect((s as unknown as Record<string, unknown>)._id).toBeUndefined();
  });

  it("normalizeScriptBody handles CRLF, trailing whitespace, BOM, final newline", () => {
    const raw = "\uFEFFconst a = 1;   \r\nconst b = 2;";
    expect(normalizeScriptBody(raw)).toBe("const a = 1;\nconst b = 2;\n");
  });

  it("normalizeScriptBody keeps empty string empty", () => {
    expect(normalizeScriptBody("")).toBe("");
  });

  it("description defaults to null for 'null' string", () => {
    const s = canonicalizeScript(baseConfig, "");
    expect(s.description).toBe(null);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/semantic-compare/script-canon.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement script-canon**

```ts
// src/lib/semantic-compare/script-canon.ts
import type { CanonicalScript } from "./types";

export interface ScriptConfig {
  name: string;
  context: string;
  language?: string;
  evaluatorVersion?: string;
  default?: boolean;
  description?: string | null;
  [k: string]: unknown;
}

export function scriptIdentity(cfg: ScriptConfig): string {
  return `${cfg.context}/${cfg.name}`;
}

/** Normalize script body for comparison: line endings, BOM, trailing whitespace, final newline. */
export function normalizeScriptBody(raw: string): string {
  if (!raw) return "";
  let s = raw.replace(/^\uFEFF/, "");         // strip BOM
  s = s.replace(/\r\n?/g, "\n");              // CRLF -> LF
  s = s.split("\n").map((line) => line.replace(/[ \t]+$/, "")).join("\n");
  if (!s.endsWith("\n")) s += "\n";
  return s;
}

export function canonicalizeScript(cfg: ScriptConfig, body: string): CanonicalScript {
  return {
    identity: scriptIdentity(cfg),
    context: cfg.context,
    name: cfg.name,
    language: (cfg.language ?? "JAVASCRIPT") as string,
    evaluatorVersion: (cfg.evaluatorVersion ?? "1.0") as string,
    defaultFlag: Boolean(cfg.default),
    body: normalizeScriptBody(body),
    description: cfg.description && cfg.description !== "null" ? cfg.description : null,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/semantic-compare/script-canon.test.ts`
Expected: PASS (5/5)

- [ ] **Step 5: Commit**

```bash
git add src/lib/semantic-compare/script-canon.ts tests/lib/semantic-compare/script-canon.test.ts
git commit -m "semantic-compare: canonicalize script config + body"
```

---

## Task 5: Script equality predicate

**Files:**
- Create: `src/lib/semantic-compare/script-equal.ts`
- Test: `tests/lib/semantic-compare/script-equal.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import type { CanonicalScript } from "@/lib/semantic-compare/types";
import { scriptsEqual } from "@/lib/semantic-compare/script-equal";

const base: CanonicalScript = {
  identity: "CTX/Foo", context: "CTX", name: "Foo",
  language: "JAVASCRIPT", evaluatorVersion: "2.0",
  defaultFlag: false, body: "return 1;\n", description: null,
};

describe("scriptsEqual", () => {
  it("identical scripts are equal", () => {
    const r = scriptsEqual(base, { ...base });
    expect(r.equal).toBe(true);
    expect(r.reasons).toEqual([]);
  });

  it("body diff reported as script-body reason", () => {
    const r = scriptsEqual(base, { ...base, body: "return 2;\n" });
    expect(r.equal).toBe(false);
    expect(r.reasons).toContainEqual({ kind: "script-body", identity: "CTX/Foo" });
  });

  it("language change reported as script-meta", () => {
    const r = scriptsEqual(base, { ...base, language: "GROOVY" });
    expect(r.equal).toBe(false);
    const meta = r.reasons.find((x) => x.kind === "script-meta");
    expect(meta).toMatchObject({ kind: "script-meta", identity: "CTX/Foo", fields: ["language"] });
  });

  it("evaluatorVersion + defaultFlag changes both land in script-meta", () => {
    const r = scriptsEqual(base, { ...base, evaluatorVersion: "1.0", defaultFlag: true });
    const meta = r.reasons.find((x) => x.kind === "script-meta");
    expect(meta).toMatchObject({
      kind: "script-meta",
      fields: expect.arrayContaining(["evaluatorVersion", "defaultFlag"]),
    });
  });

  it("description changes do NOT break equality", () => {
    const r = scriptsEqual(base, { ...base, description: "hello" });
    expect(r.equal).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/semantic-compare/script-equal.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement scriptsEqual**

```ts
// src/lib/semantic-compare/script-equal.ts
import type { CanonicalScript, EqualityReason, EqualityResult } from "./types";

export function scriptsEqual(a: CanonicalScript, b: CanonicalScript): EqualityResult {
  if (a.identity !== b.identity) {
    throw new Error(`scriptsEqual called with different identities: ${a.identity} vs ${b.identity}`);
  }
  const reasons: EqualityReason[] = [];

  const metaFields: string[] = [];
  if (a.language !== b.language) metaFields.push("language");
  if (a.evaluatorVersion !== b.evaluatorVersion) metaFields.push("evaluatorVersion");
  if (a.defaultFlag !== b.defaultFlag) metaFields.push("defaultFlag");
  if (metaFields.length > 0) {
    reasons.push({ kind: "script-meta", identity: a.identity, fields: metaFields });
  }

  if (a.body !== b.body) {
    reasons.push({ kind: "script-body", identity: a.identity });
  }

  return { equal: reasons.length === 0, reasons };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/semantic-compare/script-equal.test.ts`
Expected: PASS (5/5)

- [ ] **Step 5: Commit**

```bash
git add src/lib/semantic-compare/script-equal.ts tests/lib/semantic-compare/script-equal.test.ts
git commit -m "semantic-compare: script equality predicate"
```

---

## Task 6: Script map builder

**Files:**
- Create: `src/lib/semantic-compare/script-map.ts`
- Test: `tests/lib/semantic-compare/script-map.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import { buildScriptMap } from "@/lib/semantic-compare/script-map";

let tmpDir: string;
beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "script-map-"));
});

function writeScript(dir: string, fileName: string, cfg: Record<string, unknown>) {
  const cfgDir = path.join(dir, "alpha", "scripts", "scripts-config");
  fs.mkdirSync(cfgDir, { recursive: true });
  fs.writeFileSync(path.join(cfgDir, fileName), JSON.stringify(cfg));
}

describe("buildScriptMap", () => {
  it("maps uuid -> context/name across vendored layout", () => {
    writeScript(tmpDir, "abc.json", { _id: "abc", name: "Foo", context: "CTX_A" });
    writeScript(tmpDir, "def.json", { _id: "def", name: "Bar", context: "CTX_B" });
    const m = buildScriptMap(tmpDir);
    expect(m.get("abc")).toBe("CTX_A/Foo");
    expect(m.get("def")).toBe("CTX_B/Bar");
  });

  it("also reads upstream layout realms/<r>/scripts/...", () => {
    const cfgDir = path.join(tmpDir, "realms", "alpha", "scripts", "scripts-config");
    fs.mkdirSync(cfgDir, { recursive: true });
    fs.writeFileSync(path.join(cfgDir, "xyz.json"), JSON.stringify({ _id: "xyz", name: "X", context: "C" }));
    const m = buildScriptMap(tmpDir);
    expect(m.get("xyz")).toBe("C/X");
  });

  it("returns empty map when config dir has no scripts", () => {
    const m = buildScriptMap(tmpDir);
    expect(m.size).toBe(0);
  });

  it("skips malformed JSON without throwing", () => {
    const cfgDir = path.join(tmpDir, "alpha", "scripts", "scripts-config");
    fs.mkdirSync(cfgDir, { recursive: true });
    fs.writeFileSync(path.join(cfgDir, "bad.json"), "not-json");
    fs.writeFileSync(path.join(cfgDir, "good.json"), JSON.stringify({ _id: "g", name: "G", context: "C" }));
    const m = buildScriptMap(tmpDir);
    expect(m.size).toBe(1);
    expect(m.get("g")).toBe("C/G");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/semantic-compare/script-map.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement buildScriptMap**

```ts
// src/lib/semantic-compare/script-map.ts
import fs from "fs";
import path from "path";
import { getRealmRoots } from "@/lib/realm-paths";

export function buildScriptMap(configDir: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const realmRoot of getRealmRoots(configDir, "scripts/scripts-config")) {
    const dir = path.join(realmRoot, "scripts", "scripts-config");
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith(".json")) continue;
      try {
        const j = JSON.parse(fs.readFileSync(path.join(dir, f), "utf-8"));
        if (j._id && j.name && j.context) {
          map.set(String(j._id), `${j.context}/${j.name}`);
        }
      } catch { /* skip malformed */ }
    }
  }
  return map;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/semantic-compare/script-map.test.ts`
Expected: PASS (4/4)

- [ ] **Step 5: Commit**

```bash
git add src/lib/semantic-compare/script-map.ts tests/lib/semantic-compare/script-map.test.ts
git commit -m "semantic-compare: build script uuid -> identity map"
```

---

## Task 7: Per-journey node stable-key map

**Files:**
- Create: `src/lib/semantic-compare/node-key-map.ts`
- Test: `tests/lib/semantic-compare/node-key-map.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { buildNodeKeyMap } from "@/lib/semantic-compare/node-key-map";

const journey = {
  entryNodeId: "A",
  nodes: {
    A: { nodeType: "PageNode", displayName: "Page", connections: { outcome: "B" } },
    B: { nodeType: "IdentityStoreDecisionNode", displayName: "IDStore", connections: { TRUE: "C", FALSE: "D" } },
    C: { nodeType: "AccountLockoutNode", displayName: "Lock" },
    D: { nodeType: "AccountLockoutNode", displayName: "Lock" },   // collision — same type+name
    E: { nodeType: "OrphanNode", displayName: "Orphan" },          // disconnected
  },
};

describe("buildNodeKeyMap", () => {
  it("assigns primary key nodeType:displayName", () => {
    const m = buildNodeKeyMap(journey);
    expect(m.get("A")).toBe("PageNode:Page");
    expect(m.get("B")).toBe("IdentityStoreDecisionNode:IDStore");
  });

  it("disambiguates collisions by traversal order with #N suffix", () => {
    const m = buildNodeKeyMap(journey);
    const c = m.get("C");
    const d = m.get("D");
    expect([c, d].sort()).toEqual(["AccountLockoutNode:Lock", "AccountLockoutNode:Lock#2"]);
    // The traversal should visit C before D (TRUE outcome sorts before FALSE? no —
    // alphabetical by outcome name: FALSE before TRUE), so D first -> base key, C -> #2
    // Adjust expectation based on sorting: FALSE<TRUE alphabetically, so D visited first
    expect(m.get("D")).toBe("AccountLockoutNode:Lock");
    expect(m.get("C")).toBe("AccountLockoutNode:Lock#2");
  });

  it("disconnected nodes get appended in (nodeType, displayName) order", () => {
    const m = buildNodeKeyMap(journey);
    expect(m.get("E")).toBe("OrphanNode:Orphan");
  });

  it("handles missing entryNodeId by iterating nodes in name order", () => {
    const flat = {
      nodes: {
        Z: { nodeType: "X", displayName: "Z" },
        A: { nodeType: "X", displayName: "A" },
      },
    };
    const m = buildNodeKeyMap(flat);
    expect(m.get("A")).toBe("X:A");
    expect(m.get("Z")).toBe("X:Z");
  });

  it("returns empty map when nodes is missing", () => {
    expect(buildNodeKeyMap({}).size).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/semantic-compare/node-key-map.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement buildNodeKeyMap**

```ts
// src/lib/semantic-compare/node-key-map.ts
interface NodeLike {
  nodeType?: string;
  displayName?: string;
  connections?: Record<string, string>;
}

function primaryKey(n: NodeLike): string {
  return `${n.nodeType ?? "UnknownNode"}:${n.displayName ?? ""}`;
}

export function buildNodeKeyMap(journey: {
  entryNodeId?: string;
  nodes?: Record<string, NodeLike>;
}): Map<string, string> {
  const nodes = journey.nodes ?? {};
  const uuids = Object.keys(nodes);
  if (uuids.length === 0) return new Map();

  // Deterministic traversal from entryNodeId (BFS, outcomes sorted alphabetically).
  const order: string[] = [];
  const visited = new Set<string>();

  const visit = (uuid: string) => {
    if (visited.has(uuid) || !nodes[uuid]) return;
    visited.add(uuid);
    order.push(uuid);
    const cxs = nodes[uuid].connections ?? {};
    for (const outcome of Object.keys(cxs).sort()) {
      const target = cxs[outcome];
      if (target) visit(target);
    }
  };

  if (journey.entryNodeId && nodes[journey.entryNodeId]) visit(journey.entryNodeId);

  // Append any unreached nodes in (nodeType, displayName) order.
  const remaining = uuids
    .filter((u) => !visited.has(u))
    .sort((a, b) => primaryKey(nodes[a]).localeCompare(primaryKey(nodes[b])));
  for (const u of remaining) { visited.add(u); order.push(u); }

  // Assign stable keys, disambiguating collisions by traversal position.
  const counts = new Map<string, number>();
  const map = new Map<string, string>();
  for (const uuid of order) {
    const base = primaryKey(nodes[uuid]);
    const n = (counts.get(base) ?? 0) + 1;
    counts.set(base, n);
    map.set(uuid, n === 1 ? base : `${base}#${n}`);
  }
  return map;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/semantic-compare/node-key-map.test.ts`
Expected: PASS (5/5)

- [ ] **Step 5: Commit**

```bash
git add src/lib/semantic-compare/node-key-map.ts tests/lib/semantic-compare/node-key-map.test.ts
git commit -m "semantic-compare: per-journey node stable-key builder"
```

---

## Task 8: Node canonicalization

**Files:**
- Create: `src/lib/semantic-compare/node-canon.ts`
- Test: `tests/lib/semantic-compare/node-canon.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { canonicalizeNode } from "@/lib/semantic-compare/node-canon";

const stableKeyMap = new Map<string, string>([
  ["abc-uuid", "PageNode:Main"],
  ["def-uuid", "IdentityStoreDecisionNode:IDStore"],
]);
const scriptMap = new Map<string, string>([
  ["script-uuid-1", "DECISION/AllowIfAdmin"],
]);

describe("canonicalizeNode", () => {
  it("strips _id and _rev", () => {
    const out = canonicalizeNode(
      { _id: "abc-uuid", _rev: "1", nodeType: "PageNode", displayName: "Main", extra: 1 },
      "PageNode", stableKeyMap, scriptMap,
    );
    expect(out.payload._id).toBeUndefined();
    expect(out.payload._rev).toBeUndefined();
    expect(out.payload.extra).toBe(1);
  });

  it("rewrites script UUID in ScriptedDecisionNode.script", () => {
    const out = canonicalizeNode(
      { _id: "def-uuid", nodeType: "ScriptedDecisionNode", displayName: "SD", script: "script-uuid-1" },
      "ScriptedDecisionNode", stableKeyMap, scriptMap,
    );
    expect(out.payload.script).toBe("DECISION/AllowIfAdmin");
  });

  it("leaves unknown script UUID in place as <missing:uuid> marker", () => {
    const out = canonicalizeNode(
      { nodeType: "ScriptedDecisionNode", displayName: "SD", script: "unknown-uuid" },
      "ScriptedDecisionNode", stableKeyMap, scriptMap,
    );
    expect(out.payload.script).toBe("<missing:unknown-uuid>");
  });

  it("rewrites PageNode.nodes[]._id to stable keys", () => {
    const out = canonicalizeNode(
      { nodeType: "PageNode", displayName: "Page", nodes: [
        { _id: "abc-uuid", nodeType: "PageNode", displayName: "Main" },
        { _id: "def-uuid", nodeType: "IdentityStoreDecisionNode", displayName: "IDStore" },
      ]},
      "PageNode", stableKeyMap, scriptMap,
    );
    const nodes = out.payload.nodes as Array<{ _id: string }>;
    expect(nodes[0]._id).toBe("PageNode:Main");
    expect(nodes[1]._id).toBe("IdentityStoreDecisionNode:IDStore");
  });

  it("leaves InnerTreeEvaluatorNode.tree untouched", () => {
    const out = canonicalizeNode(
      { nodeType: "InnerTreeEvaluatorNode", displayName: "Inner", tree: "MySubJourney" },
      "InnerTreeEvaluatorNode", stableKeyMap, scriptMap,
    );
    expect(out.payload.tree).toBe("MySubJourney");
  });

  it("sorts keys in canonical payload", () => {
    const out = canonicalizeNode(
      { z: 1, a: 2, nodeType: "X", displayName: "Y" },
      "X", stableKeyMap, scriptMap,
    );
    const keys = Object.keys(out.payload);
    expect(keys).toEqual([...keys].sort());
  });

  it("preserves _type field (node type metadata)", () => {
    const out = canonicalizeNode(
      { nodeType: "X", displayName: "Y", _type: { _id: "X", name: "X", version: "1.0" } },
      "X", stableKeyMap, scriptMap,
    );
    expect(out.payload._type).toEqual({ _id: "X", name: "X", version: "1.0" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/semantic-compare/node-canon.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement canonicalizeNode**

```ts
// src/lib/semantic-compare/node-canon.ts
import type { CanonicalNode } from "./types";
import { sortKeys, stripFields } from "./json-canon";
import { getRefsFor } from "./node-refs";

const STRIP = ["_id", "_rev", "createdBy", "creationDate", "lastModifiedBy", "lastModifiedDate", "lastChangeDate", "lastChangedBy"];

export function canonicalizeNode(
  raw: Record<string, unknown>,
  nodeType: string,
  nodeKeyMap: Map<string, string>,
  scriptMap: Map<string, string>,
): CanonicalNode {
  const stableKey = pickStableKey(raw, nodeType, nodeKeyMap);
  const displayName = String(raw.displayName ?? "");

  // Start from stripped copy.
  let payload = stripFields(raw, STRIP) as Record<string, unknown>;

  const refs = getRefsFor(nodeType);

  // Rewrite script UUID fields.
  for (const field of refs.scriptRefs ?? []) {
    const v = payload[field];
    if (typeof v === "string") {
      payload[field] = scriptMap.has(v) ? scriptMap.get(v)! : `<missing:${v}>`;
    }
  }

  // Rewrite nested node refs (e.g. PageNode.nodes[]._id).
  for (const field of refs.nodeRefs ?? []) {
    const arr = payload[field];
    if (Array.isArray(arr)) {
      payload[field] = arr.map((child) => {
        if (child && typeof child === "object") {
          const c = child as Record<string, unknown>;
          const id = typeof c._id === "string" ? c._id : null;
          const rewritten: Record<string, unknown> = { ...c };
          if (id) rewritten._id = nodeKeyMap.get(id) ?? `<missing:${id}>`;
          return rewritten;
        }
        return child;
      });
    }
  }

  payload = sortKeys(payload) as Record<string, unknown>;

  return { stableKey, nodeType, displayName, payload };
}

function pickStableKey(
  raw: Record<string, unknown>,
  nodeType: string,
  nodeKeyMap: Map<string, string>,
): string {
  const id = typeof raw._id === "string" ? raw._id : null;
  if (id && nodeKeyMap.has(id)) return nodeKeyMap.get(id)!;
  const displayName = String(raw.displayName ?? "");
  return `${nodeType}:${displayName}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/semantic-compare/node-canon.test.ts`
Expected: PASS (7/7)

- [ ] **Step 5: Commit**

```bash
git add src/lib/semantic-compare/node-canon.ts tests/lib/semantic-compare/node-canon.test.ts
git commit -m "semantic-compare: canonicalize individual node payloads"
```

---

## Task 9: Journey canonicalization

**Files:**
- Create: `src/lib/semantic-compare/journey-canon.ts`
- Test: `tests/lib/semantic-compare/journey-canon.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { canonicalizeJourney } from "@/lib/semantic-compare/journey-canon";

const treeJson = {
  _id: "MyJourney",
  _rev: "xyz",
  identityResource: "managed/alpha_user",
  entryNodeId: "A",
  innerTreeOnly: false,
  enabled: true,
  description: "Login",
  uiConfig: { annotations: "{}", categories: "[\"Auth\"]" },
  nodes: {
    A: { nodeType: "PageNode", displayName: "Page", connections: { outcome: "B" }, x: 1, y: 2 },
    B: { nodeType: "ScriptedDecisionNode", displayName: "SD", connections: { "TRUE": "C" } },
    C: { nodeType: "SuccessNode", displayName: "OK" },
  },
  staticNodes: { startNode: { x: 0, y: 0 }, end: { x: 99, y: 99 } },
};

const nodeFiles: Record<string, Record<string, unknown>> = {
  A: { _id: "A", nodeType: "PageNode", displayName: "Page" },
  B: { _id: "B", nodeType: "ScriptedDecisionNode", displayName: "SD", script: "script-uuid-1" },
  C: { _id: "C", nodeType: "SuccessNode", displayName: "OK" },
};

const scriptMap = new Map([["script-uuid-1", "DECISION/AllowIfAdmin"]]);

describe("canonicalizeJourney", () => {
  it("sets journey name from directory name, not _id", () => {
    const c = canonicalizeJourney("my-journey", treeJson, nodeFiles, scriptMap);
    expect(c.name).toBe("my-journey");
  });

  it("strips cosmetic fields and metadata from header", () => {
    const c = canonicalizeJourney("my-journey", treeJson, nodeFiles, scriptMap);
    expect(c.header._id).toBeUndefined();
    expect(c.header._rev).toBeUndefined();
    expect(c.header.uiConfig).toEqual({ categories: "[\"Auth\"]" });
    // entryNodeId rewritten to stable key
    expect(c.header.entryNodeId).toBe("PageNode:Page");
  });

  it("rewrites wiring inside nodes map to stable keys", () => {
    const c = canonicalizeJourney("my-journey", treeJson, nodeFiles, scriptMap);
    const headerNodes = c.header.nodes as Record<string, { connections?: Record<string, string> }>;
    expect(headerNodes["PageNode:Page"].connections).toEqual({ outcome: "ScriptedDecisionNode:SD" });
  });

  it("drops node x/y coordinates", () => {
    const c = canonicalizeJourney("my-journey", treeJson, nodeFiles, scriptMap);
    const headerNodes = c.header.nodes as Record<string, unknown>;
    expect(JSON.stringify(headerNodes)).not.toContain("\"x\":");
  });

  it("populates nodes map with canonical node payloads", () => {
    const c = canonicalizeJourney("my-journey", treeJson, nodeFiles, scriptMap);
    expect(c.nodes.get("PageNode:Page")).toBeDefined();
    expect(c.nodes.get("ScriptedDecisionNode:SD")?.payload.script).toBe("DECISION/AllowIfAdmin");
  });

  it("collects referenced scripts and sub-journeys", () => {
    const withInner = {
      ...treeJson,
      nodes: {
        ...treeJson.nodes,
        D: { nodeType: "InnerTreeEvaluatorNode", displayName: "Inner", connections: {} },
      },
    };
    const withInnerNodeFiles = {
      ...nodeFiles,
      D: { _id: "D", nodeType: "InnerTreeEvaluatorNode", displayName: "Inner", tree: "SubJ" },
    };
    const c = canonicalizeJourney("my-journey", withInner, withInnerNodeFiles, scriptMap);
    expect(c.referencedScripts.has("DECISION/AllowIfAdmin")).toBe(true);
    expect(c.referencedSubJourneys.has("SubJ")).toBe(true);
  });

  it("staticNodeKeys captures the set without coords", () => {
    const c = canonicalizeJourney("my-journey", treeJson, nodeFiles, scriptMap);
    expect(c.staticNodeKeys.has("startNode")).toBe(true);
    expect(c.staticNodeKeys.has("end")).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/semantic-compare/journey-canon.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement canonicalizeJourney**

```ts
// src/lib/semantic-compare/journey-canon.ts
import type { CanonicalJourney, CanonicalNode } from "./types";
import { sortKeys, stripFields } from "./json-canon";
import { buildNodeKeyMap } from "./node-key-map";
import { canonicalizeNode } from "./node-canon";

const STRIP_ROOT = ["_id", "_rev", "createdBy", "creationDate", "lastModifiedBy", "lastModifiedDate", "lastChangeDate", "lastChangedBy"];

export function canonicalizeJourney(
  name: string,
  treeJson: Record<string, unknown>,
  nodeFiles: Record<string, Record<string, unknown>>,
  scriptMap: Map<string, string>,
): CanonicalJourney {
  const nodeKeyMap = buildNodeKeyMap(treeJson as { nodes?: Record<string, unknown>; entryNodeId?: string });

  // Canonicalize each node file.
  const nodes = new Map<string, CanonicalNode>();
  const referencedScripts = new Set<string>();
  const referencedSubJourneys = new Set<string>();

  for (const [uuid, raw] of Object.entries(nodeFiles)) {
    const nodeType = String(raw.nodeType ?? (treeJson.nodes as Record<string, { nodeType?: string }>)?.[uuid]?.nodeType ?? "UnknownNode");
    const cn = canonicalizeNode(raw, nodeType, nodeKeyMap, scriptMap);
    nodes.set(cn.stableKey, cn);

    if (nodeType === "ScriptedDecisionNode" || nodeType === "ConfigProviderNode" || nodeType === "ConfigProviderNodeV2") {
      const id = cn.payload.script;
      if (typeof id === "string" && !id.startsWith("<missing:")) referencedScripts.add(id);
    }
    if (nodeType === "InnerTreeEvaluatorNode") {
      const t = cn.payload.tree;
      if (typeof t === "string") referencedSubJourneys.add(t);
    }
  }

  // Build canonical header: strip cosmetic fields, rewrite wiring, drop coords.
  const stripped = stripFields(treeJson, STRIP_ROOT) as Record<string, unknown>;

  // Remove uiConfig.annotations
  if (stripped.uiConfig && typeof stripped.uiConfig === "object") {
    const ui = { ...(stripped.uiConfig as Record<string, unknown>) };
    delete ui.annotations;
    stripped.uiConfig = ui;
  }

  // Rewrite entryNodeId
  if (typeof stripped.entryNodeId === "string") {
    stripped.entryNodeId = nodeKeyMap.get(stripped.entryNodeId) ?? stripped.entryNodeId;
  }

  // Rewrite nodes map: keys + connections + drop coords
  const staticNodeKeys = new Set<string>();
  if (stripped.staticNodes && typeof stripped.staticNodes === "object") {
    for (const k of Object.keys(stripped.staticNodes as Record<string, unknown>)) {
      // Preserve well-known keys as-is; rewrite UUID keys via map.
      staticNodeKeys.add(nodeKeyMap.get(k) ?? k);
    }
    delete stripped.staticNodes; // keys captured; coords discarded
  }

  if (stripped.nodes && typeof stripped.nodes === "object") {
    const rewritten: Record<string, Record<string, unknown>> = {};
    for (const [uuid, entry] of Object.entries(stripped.nodes as Record<string, Record<string, unknown>>)) {
      const stableKey = nodeKeyMap.get(uuid) ?? `${entry.nodeType}:${entry.displayName}`;
      const copy: Record<string, unknown> = { ...entry };
      delete copy.x; delete copy.y;
      if (copy.connections && typeof copy.connections === "object") {
        const cxs: Record<string, string> = {};
        for (const [outcome, target] of Object.entries(copy.connections as Record<string, string>)) {
          cxs[outcome] = nodeKeyMap.get(target) ?? target;
        }
        copy.connections = cxs;
      }
      rewritten[stableKey] = copy;
    }
    stripped.nodes = rewritten;
  }

  const header = sortKeys(stripped) as Record<string, unknown>;

  return { name, header, nodes, staticNodeKeys, referencedScripts, referencedSubJourneys };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/semantic-compare/journey-canon.test.ts`
Expected: PASS (7/7)

- [ ] **Step 5: Commit**

```bash
git add src/lib/semantic-compare/journey-canon.ts tests/lib/semantic-compare/journey-canon.test.ts
git commit -m "semantic-compare: canonicalize full journey closure"
```

---

## Task 10: Journey equality predicate (single level)

**Files:**
- Create: `src/lib/semantic-compare/journey-equal.ts`
- Test: `tests/lib/semantic-compare/journey-equal.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import type { CanonicalJourney, CanonicalScript } from "@/lib/semantic-compare/types";
import { journeysEqual } from "@/lib/semantic-compare/journey-equal";

function mkJourney(overrides: Partial<CanonicalJourney> = {}): CanonicalJourney {
  return {
    name: "J",
    header: { identityResource: "managed/alpha_user", enabled: true },
    nodes: new Map([["PageNode:Page", {
      stableKey: "PageNode:Page", nodeType: "PageNode", displayName: "Page",
      payload: { nodeType: "PageNode" },
    }]]),
    staticNodeKeys: new Set(["startNode"]),
    referencedScripts: new Set(),
    referencedSubJourneys: new Set(),
    ...overrides,
  };
}

function mkScript(identity: string, body = ""): CanonicalScript {
  const [context, name] = identity.split("/");
  return { identity, context, name, language: "JAVASCRIPT", evaluatorVersion: "2.0", defaultFlag: false, body, description: null };
}

describe("journeysEqual (single level, no recursion)", () => {
  it("identical canonical journeys are equal", () => {
    const r = journeysEqual(mkJourney(), mkJourney(), { scriptsA: new Map(), scriptsB: new Map() });
    expect(r.equal).toBe(true);
  });

  it("header difference reported", () => {
    const a = mkJourney();
    const b = mkJourney({ header: { identityResource: "managed/alpha_user", enabled: false } });
    const r = journeysEqual(a, b, { scriptsA: new Map(), scriptsB: new Map() });
    expect(r.equal).toBe(false);
    expect(r.reasons.find((x) => x.kind === "header")).toBeDefined();
  });

  it("different node sets reported as node-set", () => {
    const a = mkJourney();
    const b = mkJourney({
      nodes: new Map([["AccountLockoutNode:Lock", {
        stableKey: "AccountLockoutNode:Lock", nodeType: "AccountLockoutNode", displayName: "Lock",
        payload: {},
      }]]),
    });
    const r = journeysEqual(a, b, { scriptsA: new Map(), scriptsB: new Map() });
    const reason = r.reasons.find((x) => x.kind === "node-set");
    expect(reason).toMatchObject({ kind: "node-set", added: ["AccountLockoutNode:Lock"], removed: ["PageNode:Page"] });
  });

  it("same keys different payload reported as node-settings", () => {
    const a = mkJourney();
    const b = mkJourney({
      nodes: new Map([["PageNode:Page", {
        stableKey: "PageNode:Page", nodeType: "PageNode", displayName: "Page",
        payload: { nodeType: "PageNode", newField: 1 },
      }]]),
    });
    const r = journeysEqual(a, b, { scriptsA: new Map(), scriptsB: new Map() });
    expect(r.reasons).toContainEqual(expect.objectContaining({ kind: "node-settings", stableKey: "PageNode:Page" }));
  });

  it("referenced script missing on one side flagged", () => {
    const a = mkJourney({ referencedScripts: new Set(["CTX/Missing"]) });
    const b = mkJourney({ referencedScripts: new Set(["CTX/Missing"]) });
    const r = journeysEqual(a, b, {
      scriptsA: new Map([["CTX/Missing", mkScript("CTX/Missing", "body")]]),
      scriptsB: new Map(),
    });
    expect(r.reasons).toContainEqual({ kind: "script-missing", identity: "CTX/Missing", side: "target" });
  });

  it("referenced script body differs flagged as script-body", () => {
    const a = mkJourney({ referencedScripts: new Set(["CTX/S"]) });
    const b = mkJourney({ referencedScripts: new Set(["CTX/S"]) });
    const r = journeysEqual(a, b, {
      scriptsA: new Map([["CTX/S", mkScript("CTX/S", "a\n")]]),
      scriptsB: new Map([["CTX/S", mkScript("CTX/S", "b\n")]]),
    });
    expect(r.reasons).toContainEqual({ kind: "script-body", identity: "CTX/S" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/semantic-compare/journey-equal.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement journeysEqual (single level)**

```ts
// src/lib/semantic-compare/journey-equal.ts
import type { CanonicalJourney, CanonicalScript, EqualityReason, EqualityResult } from "./types";
import { scriptsEqual } from "./script-equal";

export interface JourneyEqualCtx {
  scriptsA: Map<string, CanonicalScript>;
  scriptsB: Map<string, CanonicalScript>;
  /** Optional inner-journey resolvers for recursion (Task 11). */
  journeysA?: Map<string, CanonicalJourney>;
  journeysB?: Map<string, CanonicalJourney>;
  /** Cycle guard for recursion (Task 11). */
  visited?: Set<string>;
}

export function journeysEqual(
  a: CanonicalJourney,
  b: CanonicalJourney,
  ctx: JourneyEqualCtx,
): EqualityResult {
  const reasons: EqualityReason[] = [];

  // 1. Header deep-equal.
  const headerDiffFields = diffHeaderFields(a.header, b.header);
  if (headerDiffFields.length > 0) reasons.push({ kind: "header", fields: headerDiffFields });

  // 2. Node set equality.
  const keysA = new Set(a.nodes.keys());
  const keysB = new Set(b.nodes.keys());
  const added = [...keysB].filter((k) => !keysA.has(k)).sort();
  const removed = [...keysA].filter((k) => !keysB.has(k)).sort();
  if (added.length > 0 || removed.length > 0) reasons.push({ kind: "node-set", added, removed });

  // 3. Node payload equality for shared keys.
  for (const key of keysA) {
    if (!keysB.has(key)) continue;
    const pa = JSON.stringify(a.nodes.get(key)!.payload);
    const pb = JSON.stringify(b.nodes.get(key)!.payload);
    if (pa !== pb) reasons.push({ kind: "node-settings", stableKey: key });
  }

  // 4. Referenced scripts.
  const refScripts = new Set([...a.referencedScripts, ...b.referencedScripts]);
  for (const id of refScripts) {
    const sa = ctx.scriptsA.get(id);
    const sb = ctx.scriptsB.get(id);
    if (!sa && !sb) continue;
    if (!sa) { reasons.push({ kind: "script-missing", identity: id, side: "source" }); continue; }
    if (!sb) { reasons.push({ kind: "script-missing", identity: id, side: "target" }); continue; }
    const sr = scriptsEqual(sa, sb);
    for (const r of sr.reasons) reasons.push(r);
  }

  return { equal: reasons.length === 0, reasons };
}

function diffHeaderFields(a: Record<string, unknown>, b: Record<string, unknown>): string[] {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const diffs: string[] = [];
  for (const k of [...keys].sort()) {
    if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) diffs.push(k);
  }
  return diffs;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/semantic-compare/journey-equal.test.ts`
Expected: PASS (6/6)

- [ ] **Step 5: Commit**

```bash
git add src/lib/semantic-compare/journey-equal.ts tests/lib/semantic-compare/journey-equal.test.ts
git commit -m "semantic-compare: single-level journey equality predicate"
```

---

## Task 11: Inner-journey recursion with cycle guard

**Files:**
- Modify: `src/lib/semantic-compare/journey-equal.ts`
- Test: add cases to `tests/lib/semantic-compare/journey-equal.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `tests/lib/semantic-compare/journey-equal.test.ts`:

```ts
describe("journeysEqual recursion", () => {
  it("recurses into inner journeys when resolvers provided", () => {
    const sub = mkJourney({
      name: "Sub",
      header: { identityResource: "managed/alpha_user", enabled: true },
    });
    const subChanged = mkJourney({
      name: "Sub",
      header: { identityResource: "managed/alpha_user", enabled: false },
    });
    const outer  = mkJourney({ name: "Outer", referencedSubJourneys: new Set(["Sub"]) });
    const outer2 = mkJourney({ name: "Outer", referencedSubJourneys: new Set(["Sub"]) });
    const r = journeysEqual(outer, outer2, {
      scriptsA: new Map(), scriptsB: new Map(),
      journeysA: new Map([["Sub", sub]]),
      journeysB: new Map([["Sub", subChanged]]),
    });
    expect(r.reasons).toContainEqual(expect.objectContaining({
      kind: "subjourney-diff",
      name: "Sub",
    }));
  });

  it("flags missing inner journey", () => {
    const outer = mkJourney({ referencedSubJourneys: new Set(["Missing"]) });
    const r = journeysEqual(outer, outer, {
      scriptsA: new Map(), scriptsB: new Map(),
      journeysA: new Map([["Missing", mkJourney({ name: "Missing" })]]),
      journeysB: new Map(),
    });
    expect(r.reasons).toContainEqual({ kind: "subjourney-missing", name: "Missing", side: "target" });
  });

  it("handles cycles gracefully (self-reference)", () => {
    const self = mkJourney({ name: "Self", referencedSubJourneys: new Set(["Self"]) });
    const r = journeysEqual(self, self, {
      scriptsA: new Map(), scriptsB: new Map(),
      journeysA: new Map([["Self", self]]),
      journeysB: new Map([["Self", self]]),
    });
    expect(r.equal).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/semantic-compare/journey-equal.test.ts`
Expected: the three new tests fail; earlier tests pass.

- [ ] **Step 3: Extend journeysEqual with recursion**

Append to `src/lib/semantic-compare/journey-equal.ts` (inside the main function, after step 4):

```ts
  // 5. Referenced inner journeys (recursive with cycle guard).
  if (ctx.journeysA && ctx.journeysB) {
    const visited = ctx.visited ?? new Set<string>();
    const refSubs = new Set([...a.referencedSubJourneys, ...b.referencedSubJourneys]);
    for (const name of refSubs) {
      if (visited.has(name)) continue;
      const ja = ctx.journeysA.get(name);
      const jb = ctx.journeysB.get(name);
      if (!ja && !jb) continue;
      if (!ja) { reasons.push({ kind: "subjourney-missing", name, side: "source" }); continue; }
      if (!jb) { reasons.push({ kind: "subjourney-missing", name, side: "target" }); continue; }
      const nextVisited = new Set(visited);
      nextVisited.add(name);
      const sub = journeysEqual(ja, jb, { ...ctx, visited: nextVisited });
      if (!sub.equal) reasons.push({ kind: "subjourney-diff", name, reasons: sub.reasons });
    }
  }

  return { equal: reasons.length === 0, reasons };
```

(Note: replace the existing `return` with the combined block above.)

- [ ] **Step 4: Run full test suite**

Run: `npx vitest run tests/lib/semantic-compare/journey-equal.test.ts`
Expected: PASS (9/9)

- [ ] **Step 5: Commit**

```bash
git add src/lib/semantic-compare/journey-equal.ts tests/lib/semantic-compare/journey-equal.test.ts
git commit -m "semantic-compare: recurse into inner journeys with cycle guard"
```

---

## Task 12: Module index + re-exports

**Files:**
- Create: `src/lib/semantic-compare/index.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/semantic-compare/index.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import * as semantic from "@/lib/semantic-compare";

describe("semantic-compare index", () => {
  it("re-exports public API", () => {
    expect(typeof semantic.canonicalizeScript).toBe("function");
    expect(typeof semantic.canonicalizeJourney).toBe("function");
    expect(typeof semantic.canonicalizeNode).toBe("function");
    expect(typeof semantic.buildScriptMap).toBe("function");
    expect(typeof semantic.buildNodeKeyMap).toBe("function");
    expect(typeof semantic.scriptsEqual).toBe("function");
    expect(typeof semantic.journeysEqual).toBe("function");
    expect(typeof semantic.normalizeScriptBody).toBe("function");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/semantic-compare/index.test.ts`
Expected: FAIL

- [ ] **Step 3: Write index**

```ts
// src/lib/semantic-compare/index.ts
export type {
  CanonicalScript, CanonicalNode, CanonicalJourney,
  EqualityReason, EqualityResult, NodeRefRegistry,
} from "./types";
export { canonicalizeScript, scriptIdentity, normalizeScriptBody } from "./script-canon";
export { scriptsEqual } from "./script-equal";
export { buildScriptMap } from "./script-map";
export { buildNodeKeyMap } from "./node-key-map";
export { canonicalizeNode } from "./node-canon";
export { canonicalizeJourney } from "./journey-canon";
export { journeysEqual } from "./journey-equal";
export { NODE_REFS, getRefsFor } from "./node-refs";
export { sortKeys, stripFields, normalizeEsvEscapes } from "./json-canon";
```

- [ ] **Step 4: Run test**

Run: `npx vitest run tests/lib/semantic-compare/index.test.ts`
Expected: PASS (1/1)

- [ ] **Step 5: Commit**

```bash
git add src/lib/semantic-compare/index.ts tests/lib/semantic-compare/index.test.ts
git commit -m "semantic-compare: public API index"
```

---

## Task 13: End-to-end loader — build canonical forms from a configDir

**Files:**
- Create: `src/lib/semantic-compare/loader.ts`
- Test: `tests/lib/semantic-compare/loader.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import { loadCanonicalEnv } from "@/lib/semantic-compare/loader";

let tmp: string;
beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "loader-"));
});

function write(p: string, content: string) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
}

describe("loadCanonicalEnv", () => {
  it("loads scripts + journeys from vendored layout", () => {
    // Script
    write(path.join(tmp, "alpha/scripts/scripts-config/s1.json"), JSON.stringify({
      _id: "s1", name: "Foo", context: "CTX", language: "JAVASCRIPT",
      script: { file: "scripts-content/CTX/Foo.js" },
    }));
    write(path.join(tmp, "alpha/scripts/scripts-content/CTX/Foo.js"), "return 1;");

    // Journey
    write(path.join(tmp, "alpha/journeys/MyJ/MyJ.json"), JSON.stringify({
      _id: "MyJ", entryNodeId: "n1", identityResource: "managed/alpha_user",
      nodes: { n1: { nodeType: "SuccessNode", displayName: "OK" } },
      staticNodes: { startNode: { x: 0, y: 0 } },
    }));
    write(path.join(tmp, "alpha/journeys/MyJ/n1.json"), JSON.stringify({
      _id: "n1", nodeType: "SuccessNode", displayName: "OK",
    }));

    const env = loadCanonicalEnv(tmp);
    expect(env.scripts.get("CTX/Foo")?.body).toBe("return 1;\n");
    expect(env.journeys.get("MyJ")?.nodes.size).toBe(1);
    expect(env.journeys.get("MyJ")?.header.entryNodeId).toBe("SuccessNode:OK");
  });

  it("gracefully skips journeys with no main file", () => {
    fs.mkdirSync(path.join(tmp, "alpha/journeys/broken"), { recursive: true });
    const env = loadCanonicalEnv(tmp);
    expect(env.journeys.size).toBe(0);
  });

  it("returns empty maps when config dir is empty", () => {
    const env = loadCanonicalEnv(tmp);
    expect(env.scripts.size).toBe(0);
    expect(env.journeys.size).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/semantic-compare/loader.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement loader**

```ts
// src/lib/semantic-compare/loader.ts
import fs from "fs";
import path from "path";
import { getRealmRoots } from "@/lib/realm-paths";
import type { CanonicalJourney, CanonicalScript } from "./types";
import { canonicalizeScript } from "./script-canon";
import { canonicalizeJourney } from "./journey-canon";
import { buildScriptMap } from "./script-map";

export interface CanonicalEnv {
  scripts: Map<string, CanonicalScript>;
  journeys: Map<string, CanonicalJourney>;
}

export function loadCanonicalEnv(configDir: string): CanonicalEnv {
  const scripts = new Map<string, CanonicalScript>();
  const journeys = new Map<string, CanonicalJourney>();

  // Scripts
  for (const realmRoot of getRealmRoots(configDir, "scripts/scripts-config")) {
    const cfgDir = path.join(realmRoot, "scripts", "scripts-config");
    const contentRoot = path.join(realmRoot, "scripts");
    for (const f of fs.readdirSync(cfgDir)) {
      if (!f.endsWith(".json")) continue;
      try {
        const cfg = JSON.parse(fs.readFileSync(path.join(cfgDir, f), "utf-8"));
        const bodyPath = cfg.script?.file ? path.join(contentRoot, cfg.script.file) : null;
        const body = bodyPath && fs.existsSync(bodyPath) ? fs.readFileSync(bodyPath, "utf-8") : "";
        const s = canonicalizeScript(cfg, body);
        scripts.set(s.identity, s);
      } catch { /* skip */ }
    }
  }

  // Journeys
  const scriptMap = buildScriptMap(configDir);
  for (const realmRoot of getRealmRoots(configDir, "journeys")) {
    const jRoot = path.join(realmRoot, "journeys");
    for (const dir of fs.readdirSync(jRoot, { withFileTypes: true })) {
      if (!dir.isDirectory()) continue;
      const name = dir.name;
      const jDir = path.join(jRoot, name);
      const main = path.join(jDir, `${name}.json`);
      if (!fs.existsSync(main)) continue;
      try {
        const tree = JSON.parse(fs.readFileSync(main, "utf-8"));
        const nodesDir = path.join(jDir, "nodes");
        const nodeFiles: Record<string, Record<string, unknown>> = {};
        if (fs.existsSync(nodesDir)) {
          for (const nf of fs.readdirSync(nodesDir)) {
            if (!nf.endsWith(".json")) continue;
            const m = nf.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.json$/i);
            if (!m) continue;
            try {
              const node = JSON.parse(fs.readFileSync(path.join(nodesDir, nf), "utf-8"));
              nodeFiles[m[1]] = node;
            } catch { /* skip */ }
          }
        }
        journeys.set(name, canonicalizeJourney(name, tree, nodeFiles, scriptMap));
      } catch { /* skip */ }
    }
  }

  return { scripts, journeys };
}
```

- [ ] **Step 4: Run test**

Run: `npx vitest run tests/lib/semantic-compare/loader.test.ts`
Expected: PASS (3/3)

- [ ] **Step 5: Commit**

```bash
git add src/lib/semantic-compare/loader.ts tests/lib/semantic-compare/loader.test.ts
git commit -m "semantic-compare: loadCanonicalEnv loader"
```

---

## Task 14: Integration test against real ide + ide3 fixtures

**Files:**
- Test: `tests/lib/semantic-compare/integration.test.ts`

- [ ] **Step 1: Write the integration test**

```ts
import { describe, it, expect } from "vitest";
import path from "path";
import fs from "fs";
import { loadCanonicalEnv } from "@/lib/semantic-compare/loader";
import { journeysEqual } from "@/lib/semantic-compare/journey-equal";

const IDE  = path.resolve(__dirname, "../../../environments/ide/config");
const IDE3 = path.resolve(__dirname, "../../../environments/ide3/config/ide3");

const describeIf = (cond: boolean) => cond ? describe : describe.skip;

describeIf(fs.existsSync(IDE) && fs.existsSync(IDE3))(
  "semantic-compare integration (ide vs ide3)",
  () => {
    it("loads journeys from both envs", () => {
      const a = loadCanonicalEnv(IDE);
      const b = loadCanonicalEnv(IDE3);
      expect(a.journeys.size).toBeGreaterThan(0);
      expect(b.journeys.size).toBeGreaterThan(0);
    });

    it("a journey compared to itself is equal", () => {
      const a = loadCanonicalEnv(IDE);
      const [firstName] = a.journeys.keys();
      const j = a.journeys.get(firstName)!;
      const r = journeysEqual(j, j, {
        scriptsA: a.scripts, scriptsB: a.scripts,
        journeysA: a.journeys, journeysB: a.journeys,
      });
      expect(r.equal).toBe(true);
    });

    it("cross-env compare of same-name journey produces reasons (not a crash)", () => {
      const a = loadCanonicalEnv(IDE);
      const b = loadCanonicalEnv(IDE3);
      const common = [...a.journeys.keys()].find((n) => b.journeys.has(n));
      if (!common) return;
      const r = journeysEqual(a.journeys.get(common)!, b.journeys.get(common)!, {
        scriptsA: a.scripts, scriptsB: b.scripts,
        journeysA: a.journeys, journeysB: b.journeys,
      });
      // We don't assert equal/not-equal — the point is the function returns a structured result.
      expect(r.reasons).toBeInstanceOf(Array);
    });

    it("unknown script UUIDs manifest as <missing:…> markers, not crashes", () => {
      const a = loadCanonicalEnv(IDE);
      for (const j of a.journeys.values()) {
        for (const n of j.nodes.values()) {
          const script = n.payload.script;
          if (typeof script === "string" && script.startsWith("<missing:")) {
            // At least one marker implies the canonicalizer handles missing refs gracefully.
            expect(script).toMatch(/^<missing:[0-9a-f-]+>$/);
            return;
          }
        }
      }
      // If no missing scripts in this fixture, that's fine too.
    });
  },
);
```

- [ ] **Step 2: Run test**

Run: `npx vitest run tests/lib/semantic-compare/integration.test.ts`
Expected: PASS (skipped cleanly if fixtures absent; passes on real envs)

- [ ] **Step 3: Commit**

```bash
git add tests/lib/semantic-compare/integration.test.ts
git commit -m "semantic-compare: integration tests against ide + ide3 fixtures"
```

---

## Task 15: Wire into compare API — add semanticJourneys to CompareReport

**Files:**
- Modify: `src/lib/diff-types.ts`
- Modify: `src/lib/diff.ts`
- Modify: `src/app/api/compare/route.ts`

- [ ] **Step 1: Add the new type to diff-types.ts**

Append to `src/lib/diff-types.ts`:

```ts
import type { EqualityResult } from "./semantic-compare/types";
export type { EqualityResult, EqualityReason } from "./semantic-compare/types";

export interface SemanticJourneyReport {
  name: string;
  status: "equal" | "modified" | "added" | "removed";
  /** Present only when both sides exist. */
  reasons?: EqualityResult["reasons"];
}
```

And extend the CompareReport:

```ts
export interface CompareReport {
  // ... existing fields ...
  semanticJourneys?: SemanticJourneyReport[];
}
```

(Add to existing CompareReport, don't create a duplicate.)

- [ ] **Step 2: Extend buildReport in diff.ts**

In `src/lib/diff.ts`, at the end of `buildReport` before returning, add:

```ts
import { loadCanonicalEnvs } from "./semantic-compare-adapter";

// Compute semantic journey statuses.
const { semanticJourneys } = loadCanonicalEnvs(sourceDir, targetDir, effectiveScopes ?? []);
```

And create `src/lib/semantic-compare-adapter.ts`:

```ts
import { loadCanonicalEnv } from "./semantic-compare/loader";
import { journeysEqual } from "./semantic-compare/journey-equal";
import type { SemanticJourneyReport } from "./diff-types";

export function loadCanonicalEnvs(
  sourceDir: string,
  targetDir: string,
  scopes: string[],
): { semanticJourneys?: SemanticJourneyReport[] } {
  if (!scopes.includes("journeys")) return {};
  const src = loadCanonicalEnv(sourceDir);
  const tgt = loadCanonicalEnv(targetDir);
  const allNames = new Set([...src.journeys.keys(), ...tgt.journeys.keys()]);
  const reports: SemanticJourneyReport[] = [];
  for (const name of [...allNames].sort()) {
    const a = src.journeys.get(name);
    const b = tgt.journeys.get(name);
    if (a && !b)      reports.push({ name, status: "removed" });
    else if (!a && b) reports.push({ name, status: "added" });
    else if (a && b) {
      const r = journeysEqual(a, b, {
        scriptsA: src.scripts, scriptsB: tgt.scripts,
        journeysA: src.journeys, journeysB: tgt.journeys,
      });
      reports.push({ name, status: r.equal ? "equal" : "modified", reasons: r.reasons });
    }
  }
  return { semanticJourneys: reports };
}
```

Wire in buildReport:

```ts
// In src/lib/diff.ts buildReport, just before the return:
const adapterResult = loadCanonicalEnvs(sourceDir, targetDir, scopes ?? []);
return {
  // ... existing fields ...
  ...adapterResult,
};
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors in affected files

- [ ] **Step 4: Add a route-level test**

Create `tests/api/compare/semantic.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { loadCanonicalEnvs } from "@/lib/semantic-compare-adapter";
import fs from "fs";
import os from "os";
import path from "path";

describe("semantic-compare-adapter", () => {
  it("returns empty when journeys not in scopes", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "adapter-"));
    const r = loadCanonicalEnvs(tmp, tmp, ["managed-objects"]);
    expect(r.semanticJourneys).toBeUndefined();
  });

  it("returns added/removed for journeys only on one side", () => {
    const src = fs.mkdtempSync(path.join(os.tmpdir(), "src-"));
    const tgt = fs.mkdtempSync(path.join(os.tmpdir(), "tgt-"));
    const jDir = path.join(src, "alpha/journeys/Only");
    fs.mkdirSync(jDir, { recursive: true });
    fs.writeFileSync(path.join(jDir, "Only.json"), JSON.stringify({
      _id: "Only", entryNodeId: "n1", nodes: { n1: { nodeType: "SuccessNode", displayName: "OK" } },
    }));
    fs.writeFileSync(path.join(jDir, "n1.json"), JSON.stringify({ _id: "n1", nodeType: "SuccessNode", displayName: "OK" }));
    const r = loadCanonicalEnvs(src, tgt, ["journeys"]);
    expect(r.semanticJourneys).toContainEqual(expect.objectContaining({ name: "Only", status: "removed" }));
  });
});
```

Run: `npx vitest run tests/api/compare/semantic.test.ts`
Expected: PASS (2/2)

- [ ] **Step 5: Commit**

```bash
git add src/lib/diff-types.ts src/lib/diff.ts src/lib/semantic-compare-adapter.ts tests/api/compare/semantic.test.ts
git commit -m "compare: attach semantic journey report to CompareReport"
```

---

## Task 16: UI — surface semantic reasons in JourneyTreeSection

**Files:**
- Modify: `src/app/compare/DiffReport.tsx`

- [ ] **Step 1: Thread semanticJourneys into JourneyTreeSection**

Find the `JourneyTreeSection` prop type (around line 1629) and add:

```ts
  semanticReports?: SemanticJourneyReport[];
```

And the call site where it's rendered (around line 3382):

```tsx
<JourneyTreeSection
  // ...existing props...
  semanticReports={report.semanticJourneys}
/>
```

Add import at top of file:

```ts
import type { SemanticJourneyReport, EqualityReason } from "@/lib/diff-types";
```

- [ ] **Step 2: Render reason badges inside the tree node row**

Inside the existing `JourneyTreeSection` where each journey row is rendered, after the status dot, insert:

```tsx
{(() => {
  const rep = semanticReports?.find((r) => r.name === node.name);
  if (!rep || !rep.reasons || rep.reasons.length === 0) return null;
  return (
    <span className="ml-2 flex gap-1 flex-wrap">
      {rep.reasons.map((r, i) => (
        <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200" title={JSON.stringify(r)}>
          {reasonLabel(r)}
        </span>
      ))}
    </span>
  );
})()}
```

Add helper above `JourneyTreeSection`:

```tsx
function reasonLabel(r: EqualityReason): string {
  switch (r.kind) {
    case "header":              return `header: ${r.fields.join(", ")}`;
    case "node-set":            return `nodes Δ: +${r.added.length}/-${r.removed.length}`;
    case "node-settings":       return `node: ${r.stableKey}`;
    case "script-missing":      return `script missing (${r.side}): ${r.identity}`;
    case "script-body":         return `script body: ${r.identity}`;
    case "script-meta":         return `script meta: ${r.identity}`;
    case "subjourney-missing":  return `sub missing (${r.side}): ${r.name}`;
    case "subjourney-diff":     return `sub: ${r.name}`;
  }
}
```

- [ ] **Step 3: Typecheck and smoke test**

Run: `npx tsc --noEmit && npx vitest run`
Expected: PASS (all existing tests + new ones)

- [ ] **Step 4: Manual browser smoke test**

1. `npm run dev`
2. Navigate to `/compare`
3. Pick `ide` → `ide3` with scope `journeys`
4. Verify badges appear on modified journey rows
5. Verify equal journeys show no reason badges

Note in PR description: "browser verified on ide↔ide3 compare".

- [ ] **Step 5: Commit**

```bash
git add src/app/compare/DiffReport.tsx
git commit -m "compare UI: surface semantic reason badges in journey tree"
```

---

## Task 17: Documentation

**Files:**
- Create: `src/lib/semantic-compare/README.md`

- [ ] **Step 1: Write the README**

```md
# semantic-compare

Path-based byte diff is insufficient across ForgeRock environments: UUIDs
(journeys, nodes, scripts) differ between sandbox and controlled tenants
even when the logical content is identical. This module computes
**semantic equality** by canonicalizing env-local identifiers to stable
keys before comparing.

## Identity model

| Resource | Stable identity |
|----------|-----------------|
| Journey  | directory name |
| Node     | `${nodeType}:${displayName}` + `#N` disambiguator |
| Script   | `(context, name)` tuple |

## Canonicalization

1. `buildScriptMap(configDir)` → `uuid → "${context}/${name}"`
2. Per journey: `buildNodeKeyMap(tree)` → `uuid → stableKey` via BFS from
   `entryNodeId`, outcomes sorted alphabetically, collisions disambiguated.
3. `canonicalizeNode` rewrites `script` UUIDs, `PageNode.nodes[]._id`,
   strips `_id`/`_rev`/timestamps, sorts keys.
4. `canonicalizeJourney` rewrites wiring, drops coordinates, preserves
   `staticNodes` key set (not coords).

## Equality

`journeysEqual(a, b, ctx)` returns `{ equal, reasons[] }` where reasons is
a discriminated union covering header, node-set, node-settings,
script-missing, script-body, script-meta, subjourney-missing,
subjourney-diff. Recursion into inner journeys is cycle-guarded via
`ctx.visited`.

## Entry points

- `loadCanonicalEnv(configDir)` → `{ scripts, journeys }` for one env.
- `journeysEqual(a, b, ctx)` for single-pair comparison.
- `loadCanonicalEnvs(src, tgt, scopes)` adapter used by `buildReport` to
  attach `semanticJourneys` to the compare response.

## Testing

Unit tests live in `tests/lib/semantic-compare/` and cover:
- JSON primitives (sort, strip, esv normalize)
- Script canonicalization + equality
- Node ref registry
- Node stable-key map (including collisions, disconnected nodes, missing
  entryNodeId)
- Node canonicalization (script rewrite, PageNode child rewrite)
- Journey canonicalization (header strip, wiring rewrite, coord drop)
- Journey equality (all 8 reason kinds, recursion, cycle guard)
- Loader (both realm layouts, malformed JSON skipping)
- Integration (real ide + ide3 fixtures)
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/semantic-compare/README.md
git commit -m "semantic-compare: module README"
```

---

## Task 18: Full-suite regression + CI hook

**Files:**
- Modify: `package.json` (if needed)

- [ ] **Step 1: Run the full test suite**

Run: `npx vitest run`
Expected: PASS — all existing 122 tests plus ~60 new semantic-compare tests.

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors in src/lib/semantic-compare, src/lib/diff.ts, src/app/api/compare/, src/app/compare/DiffReport.tsx.

- [ ] **Step 3: Smoke test the compare route**

Start dev server: `npm run dev`

```bash
curl -s -X POST http://localhost:3000/api/compare \
  -H "Content-Type: application/json" \
  -d '{"source":{"environment":"ide","mode":"local"},"target":{"environment":"ide3","mode":"local"},"scopeSelections":[{"scope":"journeys","items":["le-promot-test-login"]}]}' \
  | grep -o '"semanticJourneys":\[[^]]*\]' | head -c 500
```

Expected: response contains `semanticJourneys` with at least one entry.

- [ ] **Step 4: Commit any final tweaks + push**

```bash
git push
```

---

## Self-review

**Spec coverage check:**
- ✅ Journey directory-name identity + header stripping (Task 9)
- ✅ Node stable-key map with BFS + disambiguation (Task 7)
- ✅ Script (context, name) identity + body normalization (Tasks 4, 5)
- ✅ UUID rewriting in nodes (script, PageNode children) (Task 8)
- ✅ Inner-journey recursion with cycle guard (Task 11)
- ✅ Reason taxonomy (8 kinds) (Task 1, assembled in 10+11)
- ✅ Loader for end-to-end env canonicalization (Task 13)
- ✅ Compare-report integration (Task 15)
- ✅ UI badges (Task 16)
- ✅ Integration tests against real envs (Task 14)
- ✅ Documentation (Task 17)

**Placeholder scan:** No TBD/TODO/placeholder text. Every step has concrete code, commands, or verifiable expectations.

**Type consistency:** `CanonicalScript`, `CanonicalNode`, `CanonicalJourney`, `EqualityReason`, `EqualityResult`, `NodeRefRegistry` are defined in Task 1 and referenced with identical names in Tasks 4–17. Function names stay consistent (`canonicalizeScript`, `canonicalizeNode`, `canonicalizeJourney`, `scriptsEqual`, `journeysEqual`, `buildScriptMap`, `buildNodeKeyMap`, `loadCanonicalEnv`, `loadCanonicalEnvs`) across test expectations and implementations.

**Non-blocking follow-ups (out of scope for this plan):**
- Extend to other realm-scoped resources (authz-policies, themes) if desired.
- Add UI toggle to show/hide reason badges.
- Persist reason history per compare run.
