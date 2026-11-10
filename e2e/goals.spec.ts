import { expect, test, type Page } from "@playwright/test";
import { API_URL, apiIsUp, signUpWithOnboarding } from "./helpers";

const NAV = { timeout: 15_000 };

const card = (page: Page, title: string) => page.locator("article", { has: page.getByRole("heading", { name: title, exact: true }) });

test.beforeEach(async () => {
  test.skip(!(await apiIsUp()), `API not reachable at ${API_URL}`);
  // Room for one wait on the sign-up rate limit (see helpers.ts).
  test.setTimeout(180_000);
});

test("first goal: values shape the why, the arrival shows the goal, then Home (needs the API)", async ({ page }) => {
  await signUpWithOnboarding(page, "e2e-goal");
  await page.goto("/");
  await expect(page).toHaveURL(/\/onboarding\/goal$/, NAV);

  // Their own earlier answer is quoted under the obstacle question.
  await expect(page.getByText("Earlier you wrote: “I keep putting off calling the bank.”")).toBeVisible();

  await page.getByRole("button", { name: "Family", exact: true }).click();
  await expect(page.getByRole("button", { name: "Family", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.locator("#goal-title").fill("Start my work by nine");
  await page.getByRole("button", { name: "Start with: “Because Family matters to me,…”" }).click();
  await page.locator("#goal-why").pressSequentially("my evenings come back.");
  await expect(page.locator("#goal-why")).toHaveValue("Because Family matters to me, my evenings come back.");

  await page.getByRole("button", { name: "Save my goal" }).click();
  const heading = page.getByRole("heading", { level: 1, name: "Start my work by nine" });
  await expect(heading).toBeVisible(NAV);
  await expect(heading).toBeFocused();
  await expect(page.getByText("Because Family matters to me, my evenings come back.")).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("yg:draft:goal"))).toBeNull();

  // The next step is breaking the goal down; Home is the quiet second way.
  await expect(page.getByRole("link", { name: "Break it into tasks" })).toHaveAttribute("href", /^\/goals\/[0-9a-f-]{36}$/);
  await page.getByRole("link", { name: "Go to Home" }).click();
  await expect(page).toHaveURL(/\/home$/, NAV);
  // With a goal, the start-up router sends the person Home, and the first-goal page sends them to their goals.
  await page.goto("/");
  await expect(page).toHaveURL(/\/home$/, NAV);
  await page.goto("/onboarding/goal");
  await expect(page).toHaveURL(/\/goals$/, NAV);
});

test("goals: add, edit, archive, unarchive and delete (needs the API)", async ({ page }) => {
  await signUpWithOnboarding(page, "e2e-goals");
  const first = await page.request.post("/api/goals", { data: { title: "Start my work by nine", whyItMatters: "My evenings come back." } });
  expect(first.ok()).toBe(true);

  await page.goto("/goals");
  await expect(card(page, "Start my work by nine")).toBeVisible(NAV);
  await expect(page.getByRole("tab", { name: "Active (1)" })).toBeVisible();

  // Add.
  await page.getByRole("button", { name: "New goal" }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("What would you like to change or accomplish?").fill("Walk every evening");
  await dialog.getByLabel("Why does it matter to you?").fill("Health, and a quiet hour.");
  await dialog.getByRole("button", { name: "Save goal" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText("Goal added.")).toBeVisible();
  await expect(page.getByRole("tab", { name: "Active (2)" })).toBeVisible();

  // Edit: the form opens with the saved text; an emptied optional answer is cleared.
  await card(page, "Walk every evening").getByRole("button", { name: "Edit" }).click();
  await expect(dialog.getByLabel("What would you like to change or accomplish?")).toHaveValue("Walk every evening");
  await dialog.getByLabel("What would you like to change or accomplish?").fill("Walk thirty minutes every evening");
  await dialog.getByLabel("What might get in the way?").fill("If it rains, then I will walk indoors.");
  await dialog.getByRole("button", { name: "Save goal" }).click();
  await expect(page.getByText("Goal saved.")).toBeVisible();
  await expect(card(page, "Walk thirty minutes every evening")).toContainText("If it rains, then I will walk indoors.");

  // Archive, then find it read-only under Archived, and bring it back.
  await card(page, "Walk thirty minutes every evening").getByRole("button", { name: "Archive" }).click();
  await expect(page.getByText("Goal archived.")).toBeVisible();
  await page.getByRole("tab", { name: "Archived (1)" }).click();
  const archived = card(page, "Walk thirty minutes every evening");
  await expect(archived.getByRole("button", { name: "Edit" })).toHaveCount(0);
  await archived.getByRole("button", { name: "Unarchive" }).click();
  await expect(page.getByText("Goal back in Active.")).toBeVisible();
  await expect(page.getByText("Archived goals appear here, with everything kept.")).toBeVisible();

  // Delete asks first.
  await page.getByRole("tab", { name: "Active (2)" }).click();
  await card(page, "Walk thirty minutes every evening").getByRole("button", { name: "Delete" }).click();
  await expect(dialog.getByRole("heading", { name: "Delete this goal?" })).toBeVisible();
  await dialog.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("Goal deleted.")).toBeVisible();
  await expect(card(page, "Walk thirty minutes every evening")).toHaveCount(0);
  await expect(page.getByRole("tab", { name: "Active (1)" })).toBeVisible();
});

test("goals: a goal with work behind it is offered for archiving instead of deleting (needs the API)", async ({ page }) => {
  await signUpWithOnboarding(page, "e2e-goals-history");
  await page.request.post("/api/goals", { data: { title: "Learn PostgreSQL", whyItMatters: "For my own products." } });
  // Work history needs a focus session (feature 5), so the API's refusal is played here, as docs/handoff.md §9 gives it.
  await page.route("**/api/goals/*", (route) =>
    route.request().method() === "DELETE"
      ? route.fulfill({ status: 409, contentType: "application/json", body: JSON.stringify({ statusCode: 409, error: "Conflict", code: "goal.has_work_history" }) })
      : route.continue(),
  );

  await page.goto("/goals");
  await card(page, "Learn PostgreSQL").getByRole("button", { name: "Delete" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Delete" }).click();
  await expect(dialog.getByRole("heading", { name: "Archive it instead?" })).toBeVisible();
  await dialog.getByRole("button", { name: "Archive" }).click();
  await expect(page.getByText("Goal archived.")).toBeVisible();
  await expect(page.getByRole("tab", { name: "Archived (1)" })).toBeVisible();
});
