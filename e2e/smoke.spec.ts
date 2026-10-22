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
    await page.goto("/login");
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
    await expect(page).toHaveURL(/\/login/);
  });

  test("empty login form shows field errors without calling the API", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/login");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByRole("alert").first()).toBeVisible();
  });

  test("register, land on onboarding, log out (needs the API)", async ({ page }) => {
    test.skip(!(await apiIsUp()), `API not reachable at ${API_URL}`);
    await page.context().clearCookies();
    const email = `e2e-${Date.now()}@example.com`;
    await page.goto("/register");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("correct horse battery");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/onboarding\/basics/);

    await page.goto("/settings");
    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});
