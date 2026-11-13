import { test as setup, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const authDir = path.resolve(__dirname, '../.auth');

setup('authenticate customer and admin', async ({ page }) => {
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // 1. Authenticate Customer (Alice)
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');
  const aliceBtn = page.locator('[data-testid="quick-login-alice"]');
  await aliceBtn.click();
  await page.waitForURL(url => !url.pathname.includes('/login'));
  await page.context().storageState({ path: path.join(authDir, 'customer.json') });

  // 2. Clear storage & Authenticate Admin
  await page.evaluate(() => localStorage.clear());
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');
  const adminBtn = page.locator('[data-testid="quick-login-admin"]');
  await adminBtn.click();
  await page.waitForURL(url => url.pathname.includes('/admin'));
  await page.context().storageState({ path: path.join(authDir, 'admin.json') });
});

