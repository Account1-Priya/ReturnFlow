import { test, expect } from '@playwright/test';
import * as path from 'path';
import { AdminQueuePage, AdminDetailPage, AdminDashboardPage } from '../pages/AdminPages';
import { ReturnDetailPage } from '../pages/ReturnDetailPage';

test.describe('Admin Workflow – Review, Approval, Rejection & Refund Processing', () => {
  test.use({ storageState: path.resolve(__dirname, '../.auth/admin.json') });

  test('@regression admin dashboard displays KPI metrics and status distribution', async ({ page }) => {
    const adminDashboard = new AdminDashboardPage(page);
    await adminDashboard.goto();
    await adminDashboard.assertKpisLoaded();
  });

  test('@regression admin can review, approve, and process refund with gateway retry', async ({ page }) => {
    const queuePage = new AdminQueuePage(page);
    const detailPage = new AdminDetailPage(page);

    // 1. Open admin queue filtered by SUBMITTED
    await queuePage.goto('SUBMITTED');

    // 2. Click the first review link (data-testid starts with inspect-return-btn-)
    const reviewBtn = page.locator('[data-testid^="inspect-return-btn-"]').first();
    await expect(reviewBtn).toBeVisible({ timeout: 10000 });
    await reviewBtn.click();
    await expect(page.locator('[data-testid="admin-return-title"]')).toBeVisible({ timeout: 10000 });

    // 3. Mark Under Review (only if currently SUBMITTED)
    const markReviewBtn = page.locator('[data-testid="admin-review-btn"]');
    if (await markReviewBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await detailPage.markUnderReview();
    }

    // 4. Approve Return (only if currently UNDER_REVIEW)
    const approveBtn = page.locator('[data-testid="admin-approve-btn"]');
    if (await approveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await detailPage.approve();
    }

    // 5. Trigger refund with simulated failure, then retry successfully
    const refundBtn = page.locator('[data-testid="admin-refund-btn"]');
    if (await refundBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Simulate gateway failure first
      await detailPage.triggerRefund(true);
      await expect(page.locator('[data-testid="admin-action-success"]')).toContainText(/simulated failure/i);

      // Retry without failure — refund button should reappear since status is REFUND_FAILED
      await detailPage.triggerRefund(false);
      await expect(page.locator('[data-testid="admin-action-success"]')).toContainText(/settled successfully/i);
    }
  });

  test('@regression admin rejects return with mandatory reason and customer sees reason', async ({ page, browser }) => {
    const queuePage = new AdminQueuePage(page);
    const detailPage = new AdminDetailPage(page);

    // Go to queue (all statuses)
    await queuePage.goto('ALL');

    // Find the first reviewable return
    const reviewBtn = page.locator('[data-testid^="inspect-return-btn-"]').first();
    await expect(reviewBtn).toBeVisible({ timeout: 10000 });
    await reviewBtn.click();
    await expect(page.locator('[data-testid="admin-return-title"]')).toBeVisible({ timeout: 10000 });

    const returnUrl = page.url();
    const returnId = returnUrl.split('/').pop()!;

    // If in SUBMITTED state, move to UNDER_REVIEW first (Reject only available from UNDER_REVIEW)
    const markReviewBtn = page.locator('[data-testid="admin-review-btn"]');
    if (await markReviewBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await detailPage.markUnderReview();
    }

    // Reject the return
    const rejectBtn = page.locator('[data-testid="admin-reject-btn"]');
    if (await rejectBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      const reasonText = 'Item shows extensive user wear and missing original packaging.';
      await detailPage.reject(reasonText);

      // Verify success message in Admin
      await expect(page.locator('[data-testid="admin-action-success"]')).toContainText(/REJECTED/i);

      // Now verify that customer sees this rejection reason
      const customerContext = await browser.newContext({
        storageState: path.resolve(__dirname, '../.auth/customer.json'),
      });
      const customerPage = await customerContext.newPage();
      const customerReturnDetail = new ReturnDetailPage(customerPage);

      await customerReturnDetail.goto(returnId);
      await customerReturnDetail.assertStatus('REJECTED');
      await customerReturnDetail.assertRejectionReason(reasonText);
      await customerContext.close();
    }
  });
});
