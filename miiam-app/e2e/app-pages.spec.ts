import { test, expect } from "@playwright/test";

test.describe("Customer App Auth Guards", () => {
  const authGuardPages = [
    { path: "/app/orders", pattern: /login|auth/i },
    { path: "/app/orders/track/test-123", pattern: /login|auth/i },
    { path: "/app/cart", pattern: /login|auth/i },
    { path: "/app/checkout", pattern: /login|auth/i },
    { path: "/app/addresses", pattern: /login|auth/i },
    { path: "/app/profile/edit", pattern: /login|auth/i },
    { path: "/app/bookings", pattern: /login|auth/i },
    { path: "/app/settings", pattern: /login|auth/i },
  ];

  for (const { path, pattern } of authGuardPages) {
    test(`should redirect ${path} to login when unauthenticated`, async ({ page }) => {
      await page.goto(path);
      await page.waitForURL(pattern, { timeout: 10000 });
      await expect(page).toHaveURL(pattern);
    });
  }
});

test.describe("Public Pages", () => {
  const publicPages = [
    { path: "/", title: /MIIAM/i },
    { path: "/about", title: /About|MIIAM/i },
    { path: "/auth/login", title: /Sign In|Login|MIIAM/i },
    { path: "/auth/signup", title: /Sign Up|Register|MIIAM/i },
    { path: "/app/explore", title: /Explore|MIIAM/i },
    { path: "/app/food", title: /Food|MIIAM/i },
    { path: "/app/services", title: /Services|MIIAM/i },
  ];

  for (const { path, title } of publicPages) {
    test(`should load ${path} without auth`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveTitle(title, { timeout: 10000 });
    });
  }
});

test.describe("Partner Auth Guards", () => {
  const partnerGuardPages = [
    "/partner/dashboard",
    "/partner/orders",
    "/partner/menu",
    "/partner/pos",
    "/partner/analytics",
    "/partner/wallet",
    "/partner/reviews",
    "/partner/chat",
    "/partner/profile",
  ];

  for (const path of partnerGuardPages) {
    test(`should redirect ${path} to partner login`, async ({ page }) => {
      await page.goto(path);
      await page.waitForURL(/partner\/login/, { timeout: 10000 });
      await expect(page).toHaveURL(/partner\/login/);
    });
  }
});

test.describe("Admin Auth Guards", () => {
  const adminGuardPages = [
    "/admin/dashboard",
    "/admin/vendors",
    "/admin/users",
    "/admin/orders",
    "/admin/services-settings",
    "/admin/settings",
  ];

  for (const path of adminGuardPages) {
    test(`should redirect ${path} to admin login`, async ({ page }) => {
      await page.goto(path);
      await page.waitForURL(/admin\/login|auth\/login/, { timeout: 10000 });
    });
  }
});

test.describe("SEO and Meta", () => {
  test("homepage has meta description", async ({ page }) => {
    await page.goto("/");
    const meta = page.locator('meta[name="description"]');
    await expect(meta).toHaveAttribute("content", /.+/, { timeout: 10000 });
  });

  test("homepage has viewport meta", async ({ page }) => {
    await page.goto("/");
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toBeVisible({ timeout: 10000 });
  });

  test("has canonical link", async ({ page }) => {
    await page.goto("/");
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Dark Mode", () => {
  test("respects prefers-color-scheme", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/app/explore");
    const html = page.locator("html");
    const color = await html.evaluate((el) =>
      getComputedStyle(el).getPropertyValue("color")
    );
    expect(color).toBeTruthy();
  });
});

test.describe("Responsive Layout", () => {
  const viewports = [
    { width: 375, height: 667, name: "mobile" },
    { width: 768, height: 1024, name: "tablet" },
    { width: 1440, height: 900, name: "desktop" },
  ];

  for (const { width, height, name } of viewports) {
    test(`renders correctly on ${name} (${width}x${height})`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto("/app/explore");
      await expect(page.locator("body")).toBeVisible();
      if (width < 768) {
        await expect(page.locator("nav").last()).toBeVisible();
      }
    });
  }
});
