import fs from "fs";
import path from "path";
import crypto from "crypto";
import type { ScopeSelection } from "./fr-config-types";

const ENVIRONMENTS_DIR = path.join(process.cwd(), "environments");
const TASKS_PATH = path.join(ENVIRONMENTS_DIR, "promotion-tasks.json");

export type TaskStatus = "new" | "in-progress" | "completed" | "failed";

export interface TaskEndpoint {
  environment: string;
  mode: "local" | "remote";
}

export interface PromotionTask {
  id: string;
  name: string;
  description: string;
  status: TaskStatus;
  source: TaskEndpoint;
  target: TaskEndpoint;
  items: ScopeSelection[];
  includeDeps?: boolean;
  createdAt: string;
  updatedAt: string;
}

export function readTasks(): PromotionTask[] {
  if (!fs.existsSync(TASKS_PATH)) return [];
  try {
    return JSON.parse(fs.readFileSync(TASKS_PATH, "utf-8"));
  } catch {
    return [];
  }
}

function saveTasks(tasks: PromotionTask[]): void {
  if (!fs.existsSync(ENVIRONMENTS_DIR)) {
    fs.mkdirSync(ENVIRONMENTS_DIR, { recursive: true });
  }
  fs.writeFileSync(TASKS_PATH, JSON.stringify(tasks, null, 2));
}

export function createTask(
  data: Omit<PromotionTask, "id" | "createdAt" | "updatedAt">
): PromotionTask {
  const now = new Date().toISOString();
  const task: PromotionTask = { id: crypto.randomUUID(), ...data, createdAt: now, updatedAt: now };
  const tasks = readTasks();
  tasks.push(task);
  saveTasks(tasks);
  return task;
}

export function updateTask(
  id: string,
  patch: Partial<Omit<PromotionTask, "id" | "createdAt">>
): PromotionTask | null {
  const tasks = readTasks();
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  tasks[idx] = { ...tasks[idx], ...patch, updatedAt: new Date().toISOString() };
  saveTasks(tasks);
  return tasks[idx];
}

export function deleteTask(id: string): boolean {
  const tasks = readTasks();
  const filtered = tasks.filter((t) => t.id !== id);
  if (filtered.length === tasks.length) return false;
  saveTasks(filtered);
  return true;
}
