import { expect, test } from "@playwright/test";

const API_URL = process.env.API_URL ?? "http://localhost:3001";

async function apiIsUp(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/health`);
    return res.ok;
  } catch {
    return false;
  }
}

test.describe("foundation", () => {
  test("login page renders in English and switches to Arabic with RTL", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/sign-in");
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");

    await page.getByRole("button", { name: "العربية" }).click();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.getByRole("heading", { name: "أهلاً بعودتك" })).toBeVisible();
  });

  test("signed-out visit to the app goes to login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/home");
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("empty login form shows field errors without calling the API", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/sign-in");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByRole("alert").first()).toBeVisible();
  });

  test("register, land on onboarding, log out (needs the API)", async ({ page }) => {
    test.skip(!(await apiIsUp()), `API not reachable at ${API_URL}`);
    await page.context().clearCookies();
    const email = `e2e-${Date.now()}@example.com`;
    await page.goto("/sign-up");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill("correct horse battery");
    await page.getByRole("button", { name: "Create account" }).click();
    // Two server hops (/ then onboarding); the dev server may compile both on first visit.
    await expect(page).toHaveURL(/\/onboarding\/basics/, { timeout: 15_000 });

    await page.evaluate(() => localStorage.setItem("yg:draft:situation", "a long answer"));
    await page.goto("/settings");
    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL(/\/signed-out/);
    await expect(page.getByRole("heading", { name: "You're signed out." })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("yg:draft:situation"))).toBeNull();
  });
});

test.describe("sign-in pages", () => {
  test("register shows the road ahead, the language choice and the timezone", async ({ browser }) => {
    const context = await browser.newContext({ timezoneId: "Asia/Dubai" });
    const page = await context.newPage();
    await page.goto("/sign-up");
    await expect(page.getByRole("list", { name: "What comes next" })).toContainText("Account");
    await expect(page.getByText("The app will speak")).toBeVisible();
    await expect(page.getByText("Your days follow Dubai time.")).toBeVisible();
    await page.getByRole("button", { name: "Change" }).click();
    await expect(page.getByLabel("Time zone")).toHaveValue("Asia/Dubai");
    await context.close();
  });

  test("register suggests a fix for a mistyped email domain", async ({ page }) => {
    await page.goto("/sign-up");
    await page.getByLabel("Email").fill("lina@gmial.com");
    await page.getByLabel("Email").blur();
    await page.getByRole("button", { name: "Use it" }).click();
    await expect(page.getByLabel("Email")).toHaveValue("lina@gmail.com");
  });

  test("login explains an expired session and pauses after too many attempts", async ({ page }) => {
    await page.route("**/api/auth/login", (route) =>
      route.fulfill({ status: 429, contentType: "application/json", body: JSON.stringify({ statusCode: 429, error: "Too Many Requests", code: "rate_limited" }) }),
    );
    await page.goto("/sign-in?next=%2Fhome&reason=expired");
    await expect(page.getByText("You were signed out.")).toBeVisible();
    await page.getByLabel("Email").fill("lina@gmail.com");
    await page.getByLabel("Password", { exact: true }).fill("not-the-password");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByText("Let's take a short pause.")).toBeVisible();
    await expect(page.getByRole("button", { name: /Try again in 0:\d\d/ })).toBeDisabled();
  });

  test("the signed-out page opens without an account and clears device data", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/sign-in");
    await page.evaluate(() => localStorage.setItem("yg:draft:patterns", "private"));
    await page.goto("/signed-out");
    await expect(page.getByRole("heading", { name: "You're signed out." })).toBeVisible();
    await expect.poll(() => page.evaluate(() => localStorage.getItem("yg:draft:patterns"))).toBeNull();
  });
});
