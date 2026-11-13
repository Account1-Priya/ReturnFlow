import { test, expect } from '@playwright/test';
import * as path from 'path';

test.describe('Security & Access Control (IDOR, RBAC, Unauthenticated)', () => {
  test('unauthenticated visitor accessing protected customer routes is redirected to login', async ({ page }) => {
    // Start fresh — no storageState set, so no auth token
    // Clear any residual localStorage just in case
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());

    // Attempt to access /orders — should redirect to /login
    await page.goto('/orders');
    await page.waitForURL(url => url.pathname.includes('/login'), { timeout: 10000 });

    // Attempt to access /returns — should redirect to /login
    await page.goto('/returns');
    await page.waitForURL(url => url.pathname.includes('/login'), { timeout: 10000 });

    // Attempt to access /admin — should redirect to /login
    await page.goto('/admin');
    await page.waitForURL(url => url.pathname.includes('/login'), { timeout: 10000 });
  });

  test('customer role user is forbidden from accessing /admin routes', async ({ page }) => {
    // Login as Alice (customer)
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    const aliceBtn = page.locator('[data-testid="quick-login-alice"]');
    await aliceBtn.click();
    await page.waitForURL('/orders', { timeout: 10000 });

    // Attempt to navigate to /admin/dashboard
    await page.goto('/admin/dashboard');

    // Should be redirected away from /admin to /orders (AdminRoute redirects non-admin to /orders)
    await page.waitForURL(url => !url.pathname.includes('/admin'), { timeout: 10000 });
    expect(page.url()).toContain('/orders');
  });

  test('IDOR protection: customer cannot access another customer return request', async ({ page, request }) => {
    // 1. Login as Bob via API and get one of Bob's returns
    const bobRes = await request.post('http://localhost:3001/api/v1/auth/login', {
      data: { email: 'bob@example.com', password: 'password123' },
    });
    const bobData = await bobRes.json();
    const bobToken = bobData.token || bobData.data?.token;
    expect(bobToken).toBeTruthy();

    const bobReturnsRes = await request.get('http://localhost:3001/api/v1/returns', {
      headers: { Authorization: `Bearer ${bobToken}` },
    });
    const bobReturns = await bobReturnsRes.json();
    const returnList = bobReturns.returnRequests || bobReturns.returns || bobReturns.data || [];

    if (returnList.length > 0) {
      const bobsReturnId = returnList[0].id;

      // 2. Login as Alice in the browser
      await page.goto('/login');
      await page.waitForLoadState('domcontentloaded');
      const aliceBtn = page.locator('[data-testid="quick-login-alice"]');
      await aliceBtn.click();
      await page.waitForURL('/orders', { timeout: 10000 });

      // 3. Alice attempts to browse directly to Bob's return
      await page.goto(`/returns/${bobsReturnId}`);
      await page.waitForLoadState('networkidle');

      // 4. Verify access denied — error page shows "Error Loading Return" or forbidden message
      const errorElement = page.locator('[data-testid="return-detail-error"]');
      await expect(errorElement).toBeVisible({ timeout: 10000 });
    }
  });

  test('backend API returns 401 for unauthenticated requests', async ({ request }) => {
    const res = await request.get('http://localhost:3001/api/v1/orders');
    expect(res.status()).toBe(401);

    const data = await res.json();
    expect(data.code).toBe('UNAUTHORIZED');
  });

  test('backend API returns 403 when customer calls admin endpoint', async ({ request }) => {
    // Login as Customer (Alice)
    const loginRes = await request.post('http://localhost:3001/api/v1/auth/login', {
      data: { email: 'alice@example.com', password: 'password123' },
    });
    const loginBody = await loginRes.json();
    const customerToken = loginBody.token || loginBody.data?.token;
    expect(customerToken).toBeTruthy();

    // Call admin stats endpoint with customer token
    const adminRes = await request.get('http://localhost:3001/api/v1/admin/stats', {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    expect(adminRes.status()).toBe(403);
    const body = await adminRes.json();
    expect(body.code).toBe('FORBIDDEN');
  });
});
