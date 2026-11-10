import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { Breakdown, Step, Task } from "@/lib/api/types";

export const tasksApi = {
  list: (goalId: string) => api<Task[]>(`/api/goals/${goalId}/tasks`),
  create: (goalId: string, title: string) => api<Task>(`/api/goals/${goalId}/tasks`, { method: "POST", json: { title } }),
  rename: (id: string, title: string) => api<Task>(`/api/tasks/${id}`, { method: "PATCH", json: { title } }),
  remove: (id: string) => api<void>(`/api/tasks/${id}`, { method: "DELETE" }),
  /** The model's 3–7 step titles; nothing is saved (docs/handoff.md §10). Can take up to 45 s. */
  breakdown: (id: string, signal?: AbortSignal) => api<Breakdown>(`/api/tasks/${id}/breakdown`, { method: "POST", signal }),
};

export const stepsApi = {
  list: (taskId: string) => api<Step[]>(`/api/tasks/${taskId}/steps`),
  create: (taskId: string, title: string) => api<Step>(`/api/tasks/${taskId}/steps`, { method: "POST", json: { title } }),
  update: (id: string, body: { title?: string; done?: boolean }) => api<Step>(`/api/steps/${id}`, { method: "PATCH", json: body }),
  remove: (id: string) => api<void>(`/api/steps/${id}`, { method: "DELETE" }),
  /** Every step of the task, each once, in the new order. */
  reorder: (taskId: string, stepIds: string[]) => api<Step[]>(`/api/tasks/${taskId}/steps/order`, { method: "PUT", json: { stepIds } }),
};

export const tasksKey = (goalId: string) => ["goals", goalId, "tasks"] as const;
export const stepsKey = (taskId: string) => ["tasks", taskId, "steps"] as const;

export function useTasks(goalId: string, initialData: Task[]) {
  return useQuery({ queryKey: tasksKey(goalId), queryFn: () => tasksApi.list(goalId), initialData });
}

export function useSteps(taskId: string, initialData: Step[] | undefined) {
  return useQuery({ queryKey: stepsKey(taskId), queryFn: () => stepsApi.list(taskId), initialData: initialData ?? [] });
}
