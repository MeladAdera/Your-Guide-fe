import { api } from "@/lib/api/client";

export const onboardingApi = {
  /** Save one screen, whole: the API replaces it (docs/handoff.md §8). `slug` is the URL form (`self-view`). */
  saveSection: <T>(slug: string, body: T) => api<T>(`/api/profile/sections/${slug}`, { method: "PUT", json: body }),
};
