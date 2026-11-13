import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { Progress } from "@/lib/api/types";

export const progressApi = {
  get: (days: number) => api<Progress>(`/api/progress?days=${days}`),
};

/**
 * One key per range (docs/ROADMAP.md conventions), so the week tile and the Progress page share the 7-day answer.
 * `serverData` from a server render is shown until the answer arrives. It is a placeholder, not cache
 * data, on purpose: seeding the shared cache during the server render would change what other
 * components on the page render on the server but not in the browser (a hydration mismatch).
 */
export function useProgress(days: number, serverData?: Progress) {
  return useQuery({ queryKey: ["progress", days], queryFn: () => progressApi.get(days), placeholderData: serverData });
}
