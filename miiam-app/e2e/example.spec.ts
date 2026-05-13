import { test, expect } from '@playwright/test';

test.describe('MIIAM App E2E Tests', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/MIIAM/);
  });

  test('should display main navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=MIIAM')).toBeVisible();
  });

  test('should navigate to food page', async ({ page }) => {
    await page.goto('/app/food');
    await expect(page.locator('text=Food')).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.locator('text=Sign In')).toBeVisible({ timeout: 10000 });
  });

  test('should show 404 for unknown route', async ({ page }) => {
    await page.goto('/unknown-route-12345');
    await expect(page.locator('text=Page Not Found')).toBeVisible({ timeout: 10000 });
  });

  test('should have responsive layout', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should load about page', async ({ page }) => {
    await page.goto('/about');
    await expect(page.locator('text=About')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Accessibility', () => {
  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/');
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(0);
  });

  test('should have lang attribute on html', async ({ page }) => {
    await page.goto('/');
    const html = page.locator('html');
    await expect(html).toHaveAttribute('lang', 'en');
  });
});

test.describe('Performance', () => {
  test('should load within reasonable time', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - start;
    expect(loadTime).toBeLessThan(10000);
  });
});