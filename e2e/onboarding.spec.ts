import { expect, test, type Page } from "@playwright/test";

const API_URL = process.env.API_URL ?? "http://localhost:3001";

async function apiIsUp(): Promise<boolean> {
  try {
    return (await fetch(`${API_URL}/api/health`)).ok;
  } catch {
    return false;
  }
}

/** Server hops and first-visit compiles in dev can take a moment. */
const NAV = { timeout: 15_000 };

async function save(page: Page, url: RegExp, name = "Save and continue") {
  await page.getByRole("button", { name }).click();
  await expect(page).toHaveURL(url, NAV);
}

test("onboarding: all seven screens to the first goal, with a draft and a return mid-way (needs the API)", async ({ page }) => {
  test.skip(!(await apiIsUp()), `API not reachable at ${API_URL}`);
  test.setTimeout(120_000);
  await page.context().clearCookies();

  await page.goto("/sign-up");
  await page.locator("#signup-email").fill(`e2e-onb-${Date.now()}@example.com`);
  await page.locator("#signup-password").fill("correct horse battery");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/onboarding\/basics$/, NAV);

  // 1 · Basics can be skipped.
  await page.getByRole("link", { name: "Skip for now" }).click();
  await expect(page).toHaveURL(/\/onboarding\/situation$/, NAV);

  // 2 · Situation: the two required questions.
  await page.locator("#situation-typicalDay").fill("Most days I work and study in the evening.");
  await page.locator("#situation-wantToChange").fill("I'd like to change how late I start.");
  await save(page, /\/onboarding\/achievements$/);

  // Back shows what was saved.
  await page.getByRole("link", { name: "Back" }).click();
  await expect(page.locator("#situation-typicalDay")).toHaveValue("Most days I work and study in the evening.", NAV);
  await save(page, /\/onboarding\/achievements$/);

  // 3 · Achievements: an unsaved answer survives a reload, and / brings the person back here.
  await page.locator("#achievements-proudOf").fill("Once, I managed to finish a course while working.");
  await expect.poll(() => page.evaluate(() => localStorage.getItem("yg:draft:achievements"))).toContain("finish a course");
  await page.reload();
  await expect(page.locator("#achievements-proudOf")).toHaveValue("Once, I managed to finish a course while working.");
  await page.goto("/");
  await expect(page).toHaveURL(/\/onboarding\/achievements$/, NAV);
  await expect(page.locator("#achievements-proudOf")).toHaveValue("Once, I managed to finish a course while working.");
  await save(page, /\/onboarding\/patterns$/);
  expect(await page.evaluate(() => localStorage.getItem("yg:draft:achievements"))).toBeNull();

  // 4 · Patterns and 5 · Self-view.
  await page.locator("#patterns-oftenPostpone").fill("I keep putting off calling the bank.");
  await save(page, /\/onboarding\/self-view$/);
  await page.locator("#self-view-whoIAm").fill("Right now, I am someone who is learning to be patient.");
  await save(page, /\/onboarding\/confidence$/);

  // 6 · Check-in: one statement at a time, a tap moves on.
  for (let i = 1; i <= 8; i++) {
    await expect(page.getByText(`Statement ${i} of 8`)).toBeVisible();
    await page.getByText("Agree", { exact: true }).click();
  }
  await expect(page.getByText("All eight answered.")).toBeVisible();
  await save(page, /\/onboarding\/values$/);

  // 7 · Values: two chips rise into the list, then the person to become.
  await page.getByRole("button", { name: "Family", exact: true }).click();
  await page.getByRole("button", { name: "Health", exact: true }).click();
  await expect(page.getByText("2 of 5 chosen")).toBeVisible();
  await page.getByRole("textbox", { name: "Why Family matters to you" }).fill("They are why I keep going.");
  await page.locator("#values-personToBecome").fill("I want to become someone who finishes what they start.");
  await save(page, /\/onboarding\/goal$/, "Save and write my first goal");

  // Onboarding is complete; without a goal the start-up router sends the person to the first goal.
  await page.goto("/");
  await expect(page).toHaveURL(/\/onboarding\/goal$/, NAV);
});

test("onboarding: a value note that is too long is shown under that note", async ({ page }) => {
  test.skip(!(await apiIsUp()), `API not reachable at ${API_URL}`);
  await page.context().clearCookies();
  await page.goto("/sign-up");
  await page.locator("#signup-email").fill(`e2e-onb-err-${Date.now()}@example.com`);
  await page.locator("#signup-password").fill("correct horse battery");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/onboarding\/basics$/, NAV);

  // The API's answer for a note past 300 characters, as docs/handoff.md shows it.
  await page.route("**/api/profile/sections/values", (route) =>
    route.request().method() === "PUT"
      ? route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({
            statusCode: 400,
            error: "Bad Request",
            code: "validation.failed",
            message: ["values.1.note must be shorter than or equal to 300 characters"],
            errors: [{ field: "values.1.note", code: "maxLength" }],
          }),
        })
      : route.continue(),
  );
  await page.goto("/onboarding/values");
  await page.getByRole("button", { name: "Learning", exact: true }).click();
  await page.getByRole("button", { name: "Creativity", exact: true }).click();
  await page.locator("#values-personToBecome").fill("Someone steady.");
  await page.getByRole("button", { name: "Save and write my first goal" }).click();

  const note = page.getByRole("textbox", { name: "Why Creativity matters to you" });
  await expect(note).toHaveAttribute("aria-invalid", "true");
  await expect(note).toBeFocused();
  await expect(page).toHaveURL(/\/onboarding\/values$/);
});
