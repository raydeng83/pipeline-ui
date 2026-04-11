import fs from "fs";
import path from "path";

export interface JourneyDeps {
  /** Inner journey names discovered recursively */
  subJourneys: string[];
  /** Script UUIDs referenced by journey nodes */
  scriptUuids: string[];
  /** Map of script UUID → human-readable name */
  scriptNames: Map<string, string>;
}

/**
 * Scan journey node files to discover referenced scripts and inner journeys.
 * Mirrors the dependency resolution logic used by fr-config-push --push-dependencies.
 */
export function resolveJourneyDeps(
  configDir: string,
  journeyNames: string[],
): JourneyDeps {
  const realmsDir = path.join(configDir, "realms");
  const scriptNames = new Map<string, string>(); // uuid → name

  // Build script UUID → name map from scripts-config
  if (fs.existsSync(realmsDir)) {
    for (const realm of fs.readdirSync(realmsDir, { withFileTypes: true })) {
      if (!realm.isDirectory()) continue;
      const cfgDir = path.join(realmsDir, realm.name, "scripts", "scripts-config");
      if (!fs.existsSync(cfgDir)) continue;
      for (const f of fs.readdirSync(cfgDir)) {
        if (!f.endsWith(".json")) continue;
        try {
          const json = JSON.parse(fs.readFileSync(path.join(cfgDir, f), "utf-8"));
          if (json._id && json.name) scriptNames.set(json._id, json.name);
        } catch { /* skip */ }
      }
    }
  }

  const allSubJourneys = new Set<string>();
  const allScriptUuids = new Set<string>();

  const scanDeps = (journeyName: string, visited: Set<string>) => {
    if (visited.has(journeyName)) return;
    visited.add(journeyName);

    if (!fs.existsSync(realmsDir)) return;
    for (const realm of fs.readdirSync(realmsDir, { withFileTypes: true })) {
      if (!realm.isDirectory()) continue;
      const nodesDir = path.join(realmsDir, realm.name, "journeys", journeyName, "nodes");
      if (!fs.existsSync(nodesDir)) continue;

      for (const nf of fs.readdirSync(nodesDir)) {
        const fp = path.join(nodesDir, nf);
        if (fs.statSync(fp).isDirectory()) continue;
        try {
          const nd = JSON.parse(fs.readFileSync(fp, "utf-8")) as {
            script?: string;
            tree?: string;
            _type?: { _id?: string };
          };
          if (nd.script) allScriptUuids.add(nd.script);
          if (nd._type?._id === "InnerTreeEvaluatorNode" && nd.tree) {
            allSubJourneys.add(nd.tree);
            scanDeps(nd.tree, visited);
          }
        } catch { /* skip */ }
      }
    }
  };

  for (const name of journeyNames) {
    scanDeps(name, new Set());
  }

  return {
    subJourneys: [...allSubJourneys],
    scriptUuids: [...allScriptUuids],
    scriptNames,
  };
}
