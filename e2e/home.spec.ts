import { expect, test, type Page } from "@playwright/test";
import { API_URL, apiIsUp, signUpWithOnboarding } from "./helpers";

const NAV = { timeout: 15_000 };

test.beforeEach(async () => {
  test.skip(!(await apiIsUp()), `API not reachable at ${API_URL}`);
  // Room for one wait on the sign-up rate limit (see helpers.ts).
  test.setTimeout(180_000);
});

async function post<T>(page: Page, url: string, data?: unknown): Promise<T> {
  const res = await page.request.post(url, { data });
  if (!res.ok()) throw new Error(`POST ${url} failed: ${res.status()} ${await res.text()}`);
  return (await res.json()) as T;
}

const goal = (page: Page, title: string) => post<{ id: string }>(page, "/api/goals", { title, whyItMatters: "It matters to me." });
const taskWithSteps = async (page: Page, goalId: string, title: string, steps: string[]) => {
  const task = await post<{ id: string }>(page, `/api/goals/${goalId}/tasks`, { title });
  const ids: string[] = [];
  for (const s of steps) ids.push((await post<{ id: string }>(page, `/api/tasks/${task.id}/steps`, { title: s })).id);
  return { taskId: task.id, stepIds: ids };
};
const nextStep = (page: Page, name: string) => page.getByRole("heading", { level: 1, name });

test("home: the next step follows the work (needs the API)", async ({ page }) => {
  await signUpWithOnboarding(page, "e2e-home");
  const first = await goal(page, "Start my work by nine");

  // A goal with nothing in it: the card asks for a small step and leads to the goal.
  await page.goto("/home");
  await expect(nextStep(page, "Make the next step small")).toBeVisible(NAV);
  await expect(page.getByRole("link", { name: /Start my work by nine/ })).toContainText("No tasks yet");

  // With steps: the first open one, and the goal row counts its tasks.
  await taskWithSteps(page, first.id, "Prepare the evening before", ["Write tomorrow's first step", "Lay out my things"]);
  await page.reload();
  await expect(nextStep(page, "Write tomorrow's first step")).toBeVisible(NAV);
  await expect(page.getByText("Prepare the evening before", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /Start my work by nine/ })).toContainText("0 of 1 task done");

  // Open the goal, tick the step there, and Home moves on to the next one.
  await page.getByRole("link", { name: "Open the goal" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Start my work by nine" })).toBeVisible(NAV);
  await page.getByRole("checkbox", { name: "Write tomorrow's first step" }).click();
  await expect(page.getByRole("checkbox", { name: "Write tomorrow's first step" })).toBeChecked();
  await page.goto("/home");
  await expect(nextStep(page, "Lay out my things")).toBeVisible(NAV);

  // A session on a newer goal puts that goal first.
  const second = await goal(page, "Run a 10k in the spring");
  const { stepIds } = await taskWithSteps(page, second.id, "Build up slowly", ["Run 2 km easy", "Run 3 km easy"]);
  const session = await post<{ id: string }>(page, "/api/sessions", { stepId: stepIds[0] });
  await post(page, `/api/sessions/${session.id}/end`, { outcome: "done", rating: 4 });
  await page.reload();
  await expect(nextStep(page, "Run 3 km easy")).toBeVisible(NAV);
  await expect(page.getByRole("region", { name: "Your goals" }).getByRole("listitem").first()).toContainText("Run a 10k in the spring");
});

test("home: an open session, then no active goals (needs the API)", async ({ page }) => {
  await signUpWithOnboarding(page, "e2e-home");
  const only = await goal(page, "Learn to cook three meals");
  const { stepIds } = await taskWithSteps(page, only.id, "Pasta", ["Buy the ingredients"]);

  // Running, then stopped with the review owed, then gone once reviewed.
  const session = await post<{ id: string }>(page, "/api/sessions", { stepId: stepIds[0] });
  await page.goto("/home");
  const banner = page.getByRole("region", { name: "A focus session is running" });
  await expect(banner).toBeVisible(NAV);
  await expect(banner).toContainText("Buy the ingredients");
  await expect(banner.getByRole("link", { name: "Back to the session" })).toHaveAttribute("href", "/session");

  await post(page, `/api/sessions/${session.id}/stop`);
  await page.reload();
  await expect(page.getByRole("region", { name: "Your last session is waiting for its review" }).getByRole("link", { name: "Review it" })).toBeVisible(NAV);

  await post(page, `/api/sessions/${session.id}/end`, { outcome: "progress", rating: 3 });
  await page.reload();
  await expect(nextStep(page, "Buy the ingredients")).toBeVisible(NAV);
  await expect(page.getByRole("region", { name: /session/ })).toHaveCount(0);

  // Every goal archived: a kind card that leads to Goals, and no goals list.
  await post(page, `/api/goals/${only.id}/archive`);
  await page.reload();
  await expect(nextStep(page, "No active goals right now")).toBeVisible(NAV);
  await expect(page.getByRole("heading", { name: "Your goals" })).toHaveCount(0);
  await page.getByRole("link", { name: "Go to Goals" }).click();
  await expect(page).toHaveURL(/\/goals$/, NAV);
});
