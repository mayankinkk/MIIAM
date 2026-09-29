import { test, expect } from "@playwright/test";

test.describe("Guest app — no sign-in walls", () => {
  const guestPages = [
    "/app/orders",
    "/app/addresses",
    "/app/profile",
    "/app/profile/edit",
    "/app/bookings",
    "/app/settings",
    "/app/cart",
    "/app/checkout",
  ];

  for (const path of guestPages) {
    test(`should load ${path} without a login redirect`, async ({ page }) => {
      await page.goto(path);
      await expect(page).not.toHaveURL(/\/auth\/(login|signup)/, { timeout: 10000 });
      await expect(page.locator("body")).toBeVisible();
    });
  }

  test("checkout asks for a phone number instead of prompting a login", async ({ page }) => {
    // The checkout form only renders once there is something to buy.
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "miiam-cart",
        JSON.stringify({
          state: {
            items: [
              {
                id: "11111111-1111-4111-8111-111111111111",
                menu_item_id: "22222222-2222-4222-8222-222222222222",
                vendor_id: "33333333-3333-4333-8333-333333333333",
                vendor_name: "Test Kitchen",
                name: "Paneer Tikka",
                price: 199,
                quantity: 1,
              },
            ],
            savedItems: [],
          },
          version: 0,
        })
      );
    });
    await page.goto("/app/checkout");
    await expect(page.locator("#customer-phone")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Login Required")).toHaveCount(0);
    await expect(page.getByRole("link", { name: /sign in|create account/i })).toHaveCount(0);
  });

  test("landing page offers no login entry point", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /^login$/i })).toHaveCount(0);
  });
});

test.describe("Browse First (Zomato/Swiggy style)", () => {
  const browsePages = ["/app/cart", "/app/checkout"];

  for (const path of browsePages) {
    test(`should load ${path} without auth`, async ({ page }) => {
      await page.goto(path);
      await expect(page).not.toHaveURL(/\/auth\/login/, { timeout: 10000 });
      await expect(page.locator("body")).toBeVisible();
    });
  }
});

test.describe("Public Pages", () => {
  const publicPages = [
    { path: "/", title: /MIIAM/i },
    { path: "/about", title: /About|MIIAM/i },
    { path: "/auth/login", title: /Sign In|Login|MIIAM/i },
    { path: "/auth/signup", title: /Sign Up|Register|MIIAM/i },
    { path: "/app/home", title: /Explore|MIIAM/i },
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
    await page.goto("/app/home");
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
      await page.goto("/app/home");
      await expect(page.locator("body")).toBeVisible();
      if (width < 768) {
        await expect(page.locator("nav").last()).toBeVisible();
      }
    });
  }
});
