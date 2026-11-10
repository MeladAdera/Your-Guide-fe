import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { Goal, GoalInput } from "@/lib/api/types";

export const goalsApi = {
  list: (archived: boolean) => api<Goal[]>("/api/goals", { query: archived ? { archived: true } : undefined }),
  create: (body: GoalInput) => api<Goal>("/api/goals", { method: "POST", json: body }),
  update: (id: string, body: GoalInput) => api<Goal>(`/api/goals/${id}`, { method: "PATCH", json: body }),
  remove: (id: string) => api<void>(`/api/goals/${id}`, { method: "DELETE" }),
  archive: (id: string) => api<Goal>(`/api/goals/${id}/archive`, { method: "POST" }),
  unarchive: (id: string) => api<Goal>(`/api/goals/${id}/unarchive`, { method: "POST" }),
};

/** Every write invalidates this prefix, so both tabs refresh. */
export const GOALS_KEY = ["goals"] as const;
export const goalsKey = (archived: boolean) => [...GOALS_KEY, archived ? "archived" : "active"] as const;

/** One list, filled from the server render so the page opens without a spinner. */
export function useGoals(archived: boolean, initialData: Goal[]) {
  return useQuery({ queryKey: goalsKey(archived), queryFn: () => goalsApi.list(archived), initialData });
}
