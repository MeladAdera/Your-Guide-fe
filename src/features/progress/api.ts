import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { Progress } from "@/lib/api/types";

export const progressApi = {
  get: (days: number) => api<Progress>(`/api/progress?days=${days}`),
};

/** One key per range (docs/ROADMAP.md conventions), so the week tile and the Progress page share the 7-day answer. */
export function useProgress(days: number) {
  return useQuery({ queryKey: ["progress", days], queryFn: () => progressApi.get(days) });
}
