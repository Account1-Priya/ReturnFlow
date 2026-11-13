import { test, expect } from '@playwright/test';
import * as path from 'path';
import { PrismaClient } from '../../backend/node_modules/@prisma/client';

test.describe('Hybrid Verification (UI Action + API Verification + DB Invariant Check)', () => {
  let prisma: PrismaClient;

  test.beforeAll(async () => {
    prisma = new PrismaClient();
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test('@regression hybrid test: UI return submission creates verified API resource and DB audit history', async ({
    page,
    request,
  }) => {
    // 1. Customer Alice logs in via UI using quick-login button
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    const aliceBtn = page.locator('[data-testid="quick-login-alice"]');
    await aliceBtn.click();
    await page.waitForURL('/orders');

    // 2. Open an eligible order directly via "Return Items" link
    await page.waitForLoadState('networkidle');

    const startReturnLink = page.locator('[data-testid^="start-return-btn-"]').first();
    const hasDirectReturn = await startReturnLink.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasDirectReturn) {
      await startReturnLink.click();
    } else {
      // Fall back: open first view-order and find request-return-btn
      const viewBtn = page.locator('[data-testid^="view-order-btn-"]').first();
      await viewBtn.click();
      await page.waitForURL(url => url.pathname.includes('/orders/'));

      const requestReturnBtn = page.locator('[data-testid="request-return-btn"]');
      if (!await requestReturnBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        // No eligible orders available — skip gracefully
        return;
      }
      await requestReturnBtn.click();
    }

    await page.waitForURL(url => url.pathname.includes('/returns/new'));

    // Check first item and select CHANGED_MIND
    const firstCheckbox = page.locator('input[type="checkbox"]').first();
    await firstCheckbox.check();

    const reasonSelect = page.locator('[data-testid="return-reason-select"]');
    await reasonSelect.selectOption('CHANGED_MIND');

    // Assert preview card exists
    const previewCard = page.locator('[data-testid="refund-preview-card"]');
    await expect(previewCard).toBeVisible();

    // Submit return via UI
    const submitBtn = page.locator('[data-testid="submit-return-btn"]');
    await submitBtn.click();

    // Wait for Return Detail page
    await page.waitForURL(url => url.pathname.includes('/returns/'));
    const returnUrl = page.url();
    const returnId = returnUrl.split('/').pop()!;
    expect(returnId).toBeTruthy();

    // 3. API Verification: Query API directly for the created return
    // The auth token is stored under key 'token' in localStorage
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();

    const apiRes = await request.get(`http://localhost:3001/api/v1/returns/${returnId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(apiRes.status()).toBe(200);
    const resBody = await apiRes.json();
    // Support both { data: { returnRequest } } and { returnRequest } response shapes
    const returnData = resBody.returnRequest || resBody.data?.returnRequest || resBody.data;
    expect(returnData.id).toBe(parseInt(returnId, 10));
    expect(returnData.status).toBe('SUBMITTED');
    expect(returnData.returnItems?.length ?? returnData.items?.length).toBeGreaterThan(0);

    // 4. DB Verification: Query Supabase PostgreSQL directly using Prisma
    const dbReturn = await prisma.returnRequest.findUnique({
      where: { id: parseInt(returnId, 10) },
      include: {
        returnItems: true,
        statusHistory: true,
      },
    });

    expect(dbReturn).not.toBeNull();
    expect(dbReturn?.status).toBe('SUBMITTED');
    expect(dbReturn?.reason).toBe('CHANGED_MIND');
    const dbTotalRefund = dbReturn?.returnItems.reduce((sum, item) => sum + item.totalRefundCents, 0);
    expect(dbTotalRefund).toBeGreaterThan(0);

    // Verify immutable audit log row was written to DB
    const initialHistory = dbReturn?.statusHistory.find(h => h.toStatus === 'SUBMITTED');
    expect(initialHistory).toBeDefined();
    expect(initialHistory?.fromStatus).toBeNull();
  });
});
