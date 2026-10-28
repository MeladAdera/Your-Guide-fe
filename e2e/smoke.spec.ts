import { expect, test, type Page } from "@playwright/test";

const API_URL = process.env.API_URL ?? "http://localhost:3001";

async function apiIsUp(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/health`);
    return res.ok;
  } catch {
    return false;
  }
}

/** Laptop layout starts at 1024px (Tailwind lg). */
const isLaptop = (page: Page) => (page.viewportSize()?.width ?? 0) >= 1024;

/** The laptop image panel that slides over the inactive form. */
const panel = (page: Page) => page.locator("div[aria-hidden].z-20");

/** On phones the form heading only appears once a field has been focused. */
async function startFilling(page: Page, firstField: string) {
  if (!isLaptop(page)) await page.locator(firstField).focus();
}

test.describe("foundation", () => {
  test("sign-in renders in English and switches to Arabic with RTL", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/sign-in");
    await startFilling(page, "#signin-email");
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");

    await page.getByRole("button", { name: "العربية" }).filter({ visible: true }).first().click();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.getByRole("heading", { name: "أهلاً بعودتك" })).toBeVisible();
  });

  test("signed-out visit to the app goes to sign-in", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/home");
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("empty sign-in form shows field errors without calling the API", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/sign-in");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.locator("#signin-email-error")).toBeVisible();
  });

  test("sign up, land on onboarding, log out (needs the API)", async ({ page }) => {
    test.skip(!(await apiIsUp()), `API not reachable at ${API_URL}`);
    await page.context().clearCookies();
    const email = `e2e-${Date.now()}@example.com`;
    await page.goto("/sign-up");
    await page.locator("#signup-email").fill(email);
    await page.locator("#signup-password").fill("correct horse battery");
    await page.getByRole("button", { name: "Create account" }).click();
    // Two server hops (/ then onboarding); the dev server may compile both on first visit.
    await expect(page).toHaveURL(/\/onboarding\/basics/, { timeout: 15_000 });

    await page.evaluate(() => localStorage.setItem("yg:draft:situation", "a long answer"));
    await page.goto("/settings");
    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL(/\/signed-out/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "You're signed out." })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("yg:draft:situation"))).toBeNull();
  });
});

test.describe("auth shell", () => {
  test("laptop: Sign up slides the panel over the sign-in form, Back reverses it", async ({ page }) => {
    test.skip(!isLaptop(page), "laptop layout");
    await page.goto("/sign-in");
    const width = page.viewportSize()!.width;
    await expect.poll(async () => Math.round((await panel(page).boundingBox())!.x)).toBe(width / 2);

    await page.locator("section:not([inert])").getByRole("link", { name: "Sign up" }).click();
    await expect(page).toHaveURL(/\/sign-up$/, { timeout: 15_000 });
    await expect.poll(async () => Math.round((await panel(page).boundingBox())!.x)).toBe(0);

    await page.goBack();
    await expect(page).toHaveURL(/\/sign-in$/, { timeout: 15_000 });
    await expect.poll(async () => Math.round((await panel(page).boundingBox())!.x)).toBe(width / 2);
  });

  test("laptop: loading /sign-up directly shows the final state at once", async ({ page }) => {
    test.skip(!isLaptop(page), "laptop layout");
    await page.goto("/sign-up");
    expect(Math.round((await panel(page).boundingBox())!.x)).toBe(0);
  });

  test("laptop, Arabic: the panel and the slide are mirrored", async ({ page }) => {
    test.skip(!isLaptop(page), "laptop layout");
    await page.context().addCookies([{ name: "NEXT_LOCALE", value: "ar", url: page.url() === "about:blank" ? "http://localhost:3000" : page.url() }]);
    await page.goto("/sign-in");
    const width = page.viewportSize()!.width;
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    expect(Math.round((await panel(page).boundingBox())!.x)).toBe(0);
    await page.locator("section:not([inert])").getByRole("link", { name: "إنشاء حساب" }).click();
    await expect.poll(async () => Math.round((await panel(page).boundingBox())!.x)).toBe(width / 2);
    await expect(page.locator("#signup-email")).toBeInViewport();
  });

  test("reduced motion: the switch is instant", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    await page.goto("/sign-in");
    // motion-reduce removes the transition; the global reduced-motion rule leaves at most 0.01ms.
    const style = await panel(page).evaluate((el) => ({ property: getComputedStyle(el).transitionProperty, duration: parseFloat(getComputedStyle(el).transitionDuration) }));
    expect(style.property === "none" || style.duration <= 0.00001).toBe(true);
    await context.close();
  });

  test("Tab never reaches the hidden form", async ({ page }) => {
    await page.goto("/sign-in");
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press("Tab");
      const inInert = await page.evaluate(() => !!document.activeElement?.closest("[inert]"));
      expect(inInert).toBe(false);
    }
  });

  test("phone: the first focus collapses the hero and shows the form heading; sign up slides in", async ({ page }) => {
    test.skip(isLaptop(page), "phone layout");
    await page.goto("/sign-in");
    await expect(page.getByText("Same journey. New day.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeHidden();

    await page.locator("#signin-email").focus();
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    // The hero headline block fades out and leaves the accessibility tree.
    await expect(page.locator("div[aria-hidden='true']", { has: page.getByText("Same journey. New day.") }).first()).toHaveCSS("opacity", "0");

    await page.locator("section:not([inert])").getByRole("link", { name: "Sign up" }).click();
    await expect(page).toHaveURL(/\/sign-up$/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Start your journey." })).toBeInViewport();
    await expect(page.locator("#signin-email")).not.toBeInViewport();
  });

  test("sign-up shows the language choice and the timezone", async ({ browser }) => {
    const context = await browser.newContext({ timezoneId: "Asia/Dubai" });
    const page = await context.newPage();
    await page.goto("/sign-up");
    await expect(page.getByText("The app will speak")).toBeVisible();
    await expect(page.getByText("Your days follow Dubai time.")).toBeVisible();
    await page.getByRole("button", { name: "Change" }).click();
    await expect(page.getByLabel("Time zone")).toHaveValue("Asia/Dubai");
    await context.close();
  });

  test("sign-up suggests a fix for a mistyped email domain", async ({ page }) => {
    await page.goto("/sign-up");
    await page.locator("#signup-email").fill("lina@gmial.com");
    await page.locator("#signup-email").blur();
    await page.getByRole("button", { name: "Use it" }).click();
    await expect(page.locator("#signup-email")).toHaveValue("lina@gmail.com");
  });

  test("sign-in explains an expired session and pauses after too many attempts", async ({ page }) => {
    await page.route("**/api/auth/login", (route) =>
      route.fulfill({ status: 429, contentType: "application/json", body: JSON.stringify({ statusCode: 429, error: "Too Many Requests", code: "rate_limited" }) }),
    );
    await page.goto("/sign-in?next=%2Fhome&reason=expired");
    await expect(page.getByText("You were signed out.")).toBeVisible();
    await page.locator("#signin-email").fill("lina@gmail.com");
    await page.locator("#signin-password").fill("not-the-password");
    await page.getByRole("button", { name: "Sign in" }).click();
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
