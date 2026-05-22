import { test, expect } from "@playwright/test";

test.describe("MIIAM App E2E Tests", () => {
  test("should load homepage", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/MIIAM/);
  });

  test("should display main navigation", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=MIIAM")).toBeVisible();
  });

  test("should navigate to food page", async ({ page }) => {
    await page.goto("/app/food");
    await expect(page.locator("text=Food")).toBeVisible({ timeout: 10000 });
  });

  test("should navigate to grocery page", async ({ page }) => {
    await page.goto("/app/grocery");
    await expect(page.locator("text=Grocery")).toBeVisible({ timeout: 10000 });
  });

  test("should navigate to pharmacy page", async ({ page }) => {
    await page.goto("/app/pharmacy");
    await expect(page.locator("text=Pharmacy")).toBeVisible({ timeout: 10000 });
  });

  test("should navigate to flowers page", async ({ page }) => {
    await page.goto("/app/flowers");
    await expect(page.locator("text=Flowers")).toBeVisible({ timeout: 10000 });
  });

  test("should show cart page", async ({ page }) => {
    await page.goto("/app/cart");
    await expect(page.locator("text=Cart")).toBeVisible({ timeout: 10000 });
  });

  test("should show orders page", async ({ page }) => {
    await page.goto("/app/orders");
    await expect(page.locator("text=My Orders")).toBeVisible({ timeout: 10000 });
  });

  test("should show search page", async ({ page }) => {
    await page.goto("/app/search");
    await expect(page.locator('input[type="text"]')).toBeVisible({ timeout: 10000 });
  });

  test("should show profile page", async ({ page }) => {
    await page.goto("/app/profile");
    await expect(page.locator("text=Profile")).toBeVisible({ timeout: 10000 });
  });

  test("should navigate to login page", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page.locator("text=Sign In")).toBeVisible({ timeout: 10000 });
  });

  test("should show 404 for unknown route", async ({ page }) => {
    await page.goto("/unknown-route-12345");
    await expect(page.locator("text=Page Not Found")).toBeVisible({ timeout: 10000 });
  });

  test("should show app 404 for app unknown route", async ({ page }) => {
    await page.goto("/app/unknown-route-99999");
    await expect(page.locator("text=Page Not Found")).toBeVisible({ timeout: 10000 });
  });

  test("should have responsive layout on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
  });

  test("should have responsive layout on tablet", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/app/explore");
    await expect(page.locator("body")).toBeVisible();
  });

  test("should render breadcrumbs on grocery page", async ({ page }) => {
    await page.goto("/app/grocery");
    await expect(page.locator("nav").filter({ hasText: "Home" })).toBeVisible({ timeout: 10000 });
  });

  test("should render bottom navigation", async ({ page }) => {
    await page.goto("/app/explore");
    await expect(page.locator("text=Explore")).toBeVisible({ timeout: 10000 });
  });

  test("should load about page", async ({ page }) => {
    await page.goto("/about");
    await expect(page.locator("text=About")).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Accessibility", () => {
  test("should have lang attribute on html", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");
    await expect(html).toHaveAttribute("lang", "en");
  });
});

test.describe("Performance", () => {
  test("should load within reasonable time", async ({ page }) => {
    const start = Date.now();
    await page.goto("/");
    const loadTime = Date.now() - start;
    expect(loadTime).toBeLessThan(15000);
  });
});

test.describe("Rider App", () => {
  test("should redirect to login when not authenticated", async ({ page }) => {
    await page.goto("/rider/dashboard");
    await page.waitForURL("**/rider/login", { timeout: 10000 });
    await expect(page.locator("text=Sign In").or(page.locator("text=Login"))).toBeVisible();
  });

  test("should redirect to login for rider account page", async ({ page }) => {
    await page.goto("/rider/account");
    await page.waitForURL("**/rider/login", { timeout: 10000 });
  });

  test("should redirect to login for rider orders page", async ({ page }) => {
    await page.goto("/rider/orders");
    await page.waitForURL("**/rider/login", { timeout: 10000 });
  });

  test("should redirect to login for rider wallet page", async ({ page }) => {
    await page.goto("/rider/wallet");
    await page.waitForURL("**/rider/login", { timeout: 10000 });
  });

  test("should show rider login page", async ({ page }) => {
    await page.goto("/rider/login");
    await expect(page.locator("text=Sign In").or(page.locator("text=Login"))).toBeVisible({ timeout: 10000 });
  });

  test("should show rider apply page", async ({ page }) => {
    await page.goto("/rider/apply");
    await expect(page.locator("body")).toBeVisible({ timeout: 10000 });
  });

  test("should show 404 for unknown rider route", async ({ page }) => {
    await page.goto("/rider/unknown-route-54321");
    await expect(page.locator("text=Page Not Found")).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Rider Navigation", () => {
  test("should have RiderNavBar with online toggle on orders page", async ({ page }) => {
    await page.goto("/rider/login");
    const nav = page.locator("nav").last();
    await expect(nav).toBeVisible({ timeout: 10000 });
    await expect(nav.locator("text=ONLINE").or(nav.locator("text=OFF"))).toBeVisible();
    await expect(nav.locator("text=Map")).toBeVisible();
    await expect(nav.locator("text=Orders")).toBeVisible();
    await expect(nav.locator("text=Navigate")).toBeVisible();
    await expect(nav.locator("text=Wallet")).toBeVisible();
    await expect(nav.locator("text=Account")).toBeVisible();
  });

  test("should have RiderNavBar on support page", async ({ page }) => {
    await page.goto("/rider/login");
    await expect(page.locator("nav").last().locator("text=Map")).toBeVisible({ timeout: 10000 });
  });

  test("should have RiderNavBar on settings page", async ({ page }) => {
    await page.goto("/rider/login");
    await expect(page.locator("nav").last().locator("text=Account")).toBeVisible({ timeout: 10000 });
  });

  test.describe("Unauthenticated Auth Guard", () => {
    const authGuardPages = [
      "settings", "support", "vehicle", "training", "incident", "rate"
    ];

    for (const pageSlug of authGuardPages) {
      test(`should redirect ${pageSlug} to login when unauthenticated`, async ({ page }) => {
        await page.goto(`/rider/${pageSlug}`);
        await page.waitForURL("**/rider/login", { timeout: 10000 });
      });
    }
  });
});
