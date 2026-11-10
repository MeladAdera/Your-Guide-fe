import { expect, test, type Page } from "@playwright/test";
import { API_URL, apiIsUp, signUpWithOnboarding } from "./helpers";

const NAV = { timeout: 15_000 };

const task = (page: Page, title: string) => page.locator("article", { has: page.getByRole("button", { name: new RegExp(`^${title}`) }) });
const stepMenu = (page: Page, title: string) => page.getByRole("button", { name: `More for “${title}”` });
const stepTitles = (page: Page, taskTitle: string) => task(page, taskTitle).locator("ol > li label");

test.beforeEach(async () => {
  test.skip(!(await apiIsUp()), `API not reachable at ${API_URL}`);
  // Room for one wait on the sign-up rate limit (see helpers.ts).
  test.setTimeout(180_000);
});

async function goalWithNoTasks(page: Page, title = "Start my work by nine") {
  await signUpWithOnboarding(page, "e2e-tasks");
  const res = await page.request.post("/api/goals", { data: { title, whyItMatters: "My evenings come back." } });
  return (await res.json()) as { id: string };
}

test("tasks and steps: add, tick, rename, move, delete (needs the API)", async ({ page }) => {
  await goalWithNoTasks(page);
  // From the goals list to the goal.
  await page.goto("/goals");
  await page.getByRole("link", { name: "Start my work by nine" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Start my work by nine" })).toBeVisible(NAV);
  await expect(page.getByText("Start with one task: a part of this goal you can name.")).toBeVisible();

  // Add a task; it opens, ready for steps. Steps go in one after another.
  await page.getByRole("textbox", { name: "Add a task" }).fill("Prepare the evening before");
  await page.getByRole("textbox", { name: "Add a task" }).press("Enter");
  const addStep = page.getByRole("textbox", { name: "Add a step to “Prepare the evening before”" });
  for (const title of ["Write tomorrow's first step", "Charge the phone in the hall", "Lay out my things"]) {
    await addStep.fill(title);
    await addStep.press("Enter");
    await expect(task(page, "Prepare the evening before").getByText(title, { exact: true })).toBeVisible();
  }
  const card = task(page, "Prepare the evening before");
  await expect(card.getByText("To do", { exact: true })).toBeVisible();

  // Tick: the chip follows at once; the last tick finishes the task.
  await card.getByRole("checkbox", { name: "Write tomorrow's first step" }).click();
  await expect(card.getByText("In progress", { exact: true })).toBeVisible();
  await expect(card.getByText("1 of 3 steps")).toBeVisible();

  // Rename a step in place.
  await stepMenu(page, "Lay out my things").click();
  await page.getByRole("menuitem", { name: "Rename" }).click();
  await page.getByRole("textbox", { name: "New name for “Lay out my things”" }).fill("Lay out my things for the morning");
  await page.getByRole("textbox", { name: "New name for “Lay out my things”" }).press("Enter");
  await expect(card.getByText("Lay out my things for the morning", { exact: true })).toBeVisible();

  // Move a step down; the order is saved (it survives a reload).
  await stepMenu(page, "Write tomorrow's first step").click();
  await page.getByRole("menuitem", { name: "Move down" }).click();
  await expect(stepTitles(page, "Prepare the evening before")).toHaveText(["Charge the phone in the hall", "Write tomorrow's first step", "Lay out my things for the morning"]);
  await page.reload();
  await expect(stepTitles(page, "Prepare the evening before")).toHaveText(["Charge the phone in the hall", "Write tomorrow's first step", "Lay out my things for the morning"], NAV);

  // Delete a step, then tick the rest: the task is done.
  await stepMenu(page, "Charge the phone in the hall").click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  await expect(page.getByText("Step deleted.")).toBeVisible();
  await card.getByRole("checkbox", { name: "Lay out my things for the morning" }).click();
  await expect(card.getByText("Done", { exact: true })).toBeVisible();
  await expect(page.getByText("1 of 1 done")).toBeVisible();

  // Rename and delete the task.
  await page.getByRole("button", { name: "More for “Prepare the evening before”" }).click();
  await page.getByRole("menuitem", { name: "Rename" }).click();
  await page.getByRole("textbox", { name: "New name for “Prepare the evening before”" }).fill("The evening before");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(task(page, "The evening before")).toBeVisible();
  await page.getByRole("button", { name: "More for “The evening before”" }).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("Task deleted.")).toBeVisible();
  await expect(page.getByText("Start with one task: a part of this goal you can name.")).toBeVisible();
});

test("break into steps: keep, edit and add the suggestions; the daily limit rests the button (needs the API)", async ({ page }) => {
  await goalWithNoTasks(page);
  const goals = await (await page.request.get("/api/goals")).json();
  const goalId = goals[0].id as string;
  await page.request.post(`/api/goals/${goalId}/tasks`, { data: { title: "A calm first hour" } });
  // The model costs one of ten daily calls, so its answer is played here.
  let answer: { status: number; body: unknown } = { status: 200, body: { steps: ["Open yesterday's notes", "Pick the one thing that matters", "Work on it for 25 minutes"] } };
  await page.route("**/api/tasks/*/breakdown", (route) => route.fulfill({ status: answer.status, contentType: "application/json", body: JSON.stringify(answer.body) }));

  await page.goto(`/goals/${goalId}`);
  await page.getByRole("button", { name: "Break into steps" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("textbox", { name: "Step 1" })).toHaveValue("Open yesterday's notes", NAV);
  await dialog.getByRole("checkbox", { name: "Keep step 1" }).click();
  await dialog.getByRole("textbox", { name: "Step 3" }).fill("Work on it for 20 minutes");
  await dialog.getByRole("button", { name: "Add 2 steps" }).click();
  await expect(dialog).toBeHidden(NAV);
  await expect(stepTitles(page, "A calm first hour")).toHaveText(["Pick the one thing that matters", "Work on it for 20 minutes"]);

  // The daily limit: the dialog says so and the AI buttons rest for the day.
  answer = { status: 429, body: { statusCode: 429, error: "Too Many Requests", code: "ai.daily_limit" } };
  await page.getByRole("button", { name: "More for “A calm first hour”" }).click();
  await page.getByRole("menuitem", { name: "Break into steps" }).click();
  await expect(dialog.getByText("Today's suggestions are used up. They come back tomorrow.")).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await page.getByRole("button", { name: "More for “A calm first hour”" }).click();
  await expect(page.getByRole("menuitem", { name: "Break into steps" })).toBeDisabled();
});

test("an archived goal is read-only until it is unarchived (needs the API)", async ({ page }) => {
  const goal = await goalWithNoTasks(page, "Walk every evening");
  const t = await (await page.request.post(`/api/goals/${goal.id}/tasks`, { data: { title: "Find a route" } })).json();
  await page.request.post(`/api/tasks/${t.id}/steps`, { data: { title: "Look at the map" } });
  await page.request.post(`/api/goals/${goal.id}/archive`);

  await page.goto(`/goals/${goal.id}`);
  await expect(page.getByText("This goal is archived. Everything is kept, and it is read-only.")).toBeVisible(NAV);
  await expect(page.getByText("Look at the map")).toBeVisible();
  await expect(page.getByRole("checkbox", { name: "Look at the map" })).toBeDisabled();
  await expect(page.getByRole("textbox", { name: "Add a task" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "More for “Find a route”" })).toHaveCount(0);
  await page.getByRole("button", { name: "Unarchive" }).click();
  await expect(page.getByRole("button", { name: "Edit goal" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Add a task" })).toBeVisible();
});
