import { test, expect } from '@playwright/test';
import * as path from 'path';
import { ReturnDetailPage } from '../pages/ReturnDetailPage';

test.describe('Customer Cancellation Lifecycle', () => {
  test.use({ storageState: path.resolve(__dirname, '../.auth/customer.json') });

  test('customer can cancel their SUBMITTED return request before review begins', async ({ page }) => {
    const returnDetailPage = new ReturnDetailPage(page);

    // Navigate to customer returns list
    await page.goto('/returns');
    await page.waitForLoadState('networkidle');

    // Look for a return card that has status SUBMITTED
    const submittedCard = page.locator('[data-testid^="return-card-"]').filter({ has: page.locator('[data-status="SUBMITTED"]') }).first();
    const viewBtn = submittedCard.locator('[data-testid^="view-return-btn-"]');
    if (await viewBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await viewBtn.click();
      await expect(page.locator('[data-testid="return-detail-id"]')).toBeVisible({ timeout: 10000 });

      // Verify Cancel button is present
      await expect(returnDetailPage.cancelReturnButton).toBeVisible({ timeout: 5000 });

      // Click Cancel and confirm
      await returnDetailPage.cancelReturn();

      // Assert status is now CANCELLED
      await returnDetailPage.assertStatus('CANCELLED');

      // Assert Cancel button is no longer visible
      await expect(returnDetailPage.cancelReturnButton).not.toBeVisible();
    }
  });

  test('customer CANNOT cancel a return that has reached UNDER_REVIEW, APPROVED, or REFUNDED', async ({ page }) => {
    const returnDetailPage = new ReturnDetailPage(page);

    await page.goto('/returns');
    await page.waitForLoadState('networkidle');

    // Find a return in APPROVED, UNDER_REVIEW, or REFUNDED
    const nonSubmittedCard = page.locator('[data-testid^="return-card-"]').filter({
      has: page.locator('[data-status="APPROVED"], [data-status="UNDER_REVIEW"], [data-status="REFUNDED"]')
    }).first();
    const nonSubmittedBtn = nonSubmittedCard.locator('[data-testid^="view-return-btn-"]');

    if (await nonSubmittedBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await nonSubmittedBtn.click();
      await expect(page.locator('[data-testid="return-detail-id"]')).toBeVisible({ timeout: 10000 });

      // Cancel button MUST NOT be present
      await returnDetailPage.assertCannotCancel();
    }
  });
});

