/*
 * Adapted from @forgerock/fr-config-manager/packages/fr-config-pull/src/scripts/igaWorkflows.js
 * Upstream: https://github.com/ForgeRock/fr-config-manager (v1.5.12, Apache-2.0)
 */

const fs = require("fs");
const path = require("path");
const { restGet } = require("../common/restClient.js");

const EXPORT_SUBDIR = "iga/workflows";

function breakoutSteps(workflow, workflowPath) {
  const stepsPath = path.join(workflowPath, "steps");
  for (const step of workflow.steps) {
    const uniqueId = `${step.displayName} - ${step.name}`;
    const stepPath = path.join(stepsPath, uniqueId);
    if (!fs.existsSync(stepPath)) fs.mkdirSync(stepPath, { recursive: true });

    if (step.type === "scriptTask" && step.scriptTask?.script) {
      const scriptFilename = `${uniqueId}.js`;
      fs.writeFileSync(path.join(stepPath, scriptFilename), step.scriptTask.script);
      step.scriptTask.script = { file: scriptFilename };
    }

    fs.writeFileSync(path.join(stepPath, `${uniqueId}.json`), JSON.stringify(step, null, 2));
  }
  delete workflow.steps;
}

async function pullIgaWorkflows({ exportDir, tenantUrl, token, name, includeImmutable, log }) {
  if (!exportDir) throw new Error("exportDir is required");
  if (!tenantUrl) throw new Error("tenantUrl is required");
  if (!token) throw new Error("token is required");
  const emit = typeof log === "function" ? log : () => {};

  const endpoint = `${tenantUrl}/auto/orchestration/definition`;
  emit(`GET ${endpoint}\n`);
  const response = await restGet(endpoint, { _pageSize: 100 }, token);
  const workflows = response.data.result;

  const targetDir = path.join(exportDir, EXPORT_SUBDIR);
  let workflowFound = false;

  for (const workflow of workflows) {
    if (name && name !== workflow.name) continue;
    if (!workflow.mutable && !includeImmutable) continue;
    workflowFound = true;

    const workflowPath = path.join(targetDir, workflow.name);
    if (!fs.existsSync(workflowPath)) fs.mkdirSync(workflowPath, { recursive: true });
    breakoutSteps(workflow, workflowPath);
    fs.writeFileSync(path.join(workflowPath, `${workflow.name}.json`), JSON.stringify(workflow, null, 2));
    emit(`  ← ${workflow.name}\n`);
  }

  if (name && !workflowFound) emit(`Workflow ${name} not found\n`);
}

module.exports = { pullIgaWorkflows };
