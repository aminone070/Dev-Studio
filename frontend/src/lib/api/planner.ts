import { apiFetch } from "./base";
import type { PlannerTask } from "../../types/planner";

export async function getPlannerTasks(from: string, to: string): Promise<PlannerTask[]> {
  try {
    return await apiFetch<PlannerTask[]>(`/api/planner?from=${from}&to=${to}`);
  } catch {
    return [];
  }
}

export async function upsertPlannerTask(task: Partial<PlannerTask>): Promise<PlannerTask> {
  return apiFetch<PlannerTask>("/api/planner", {
    method: "POST",
    body: JSON.stringify(task),
  });
}

export async function deletePlannerTask(id: string): Promise<void> {
  await apiFetch<void>(`/api/planner/${id}`, { method: "DELETE" });
}

export async function getAISuggestions(
  date: string,
  tasks: PlannerTask[],
): Promise<{ suggestions: string[]; schedule: string }> {
  return apiFetch("/api/planner/suggest", {
    method: "POST",
    body: JSON.stringify({ date, tasks }),
  });
}
