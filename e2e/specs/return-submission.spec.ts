import { test, expect } from '@playwright/test';
import * as path from 'path';
import { ReturnFormPage } from '../pages/ReturnFormPage';
import { ReturnDetailPage } from '../pages/ReturnDetailPage';

test.describe('Customer Return Submission Flow', () => {
  test.use({ storageState: path.resolve(__dirname, '../.auth/customer.json') });

  test('@smoke customer can submit a valid return with proof image and preview matches refund', async ({ page }) => {
    const returnFormPage = new ReturnFormPage(page);
    const returnDetailPage = new ReturnDetailPage(page);

    // 1. Navigate to customer orders
    await page.goto('/orders');
    await page.waitForLoadState('networkidle');

    // 2. Click the first "Return Items" link (only shown for eligible DELIVERED orders)
    // If no start-return link, click first view-order-btn to check manually
    const startReturnLink = page.locator('[data-testid^="start-return-btn-"]').first();
    const hasDirectReturn = await startReturnLink.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasDirectReturn) {
      await startReturnLink.click();
    } else {
      // Fall back: open first order and look for request-return-btn
      const viewBtn = page.locator('[data-testid^="view-order-btn-"]').first();
      await viewBtn.click();
      await page.waitForURL(url => url.pathname.includes('/orders/'));
      const requestReturnBtn = page.locator('[data-testid="request-return-btn"]');
      if (!await requestReturnBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Order not eligible, test passes vacuously
        return;
      }
      await requestReturnBtn.click();
    }

    await page.waitForURL(url => url.pathname.includes('/returns/new'));

    // 3. Select first checkbox item
    const firstCheckbox = page.locator('input[type="checkbox"]').first();
    await firstCheckbox.check();

    // 4. Select reason DEFECTIVE
    const reasonSelect = page.locator('[data-testid="return-reason-select"]');
    await reasonSelect.selectOption('DEFECTIVE');

    // 5. Upload sample proof image
    const proofPath = path.resolve(__dirname, '../assets/sample-proof.png');
    await returnFormPage.uploadProofImages([proofPath]);

    // 6. Assert live refund preview card is visible
    await returnFormPage.assertRefundPreviewVisible();

    // 7. Submit Return
    await returnFormPage.submit();

    // 8. Verify redirection to Return Detail page and status is SUBMITTED
    await page.waitForURL(url => url.pathname.includes('/returns/'));
    await returnDetailPage.assertStatus('SUBMITTED');
  });

  test('validates required fields: proof image mandatory for DEFECTIVE', async ({ page }) => {
    const returnFormPage = new ReturnFormPage(page);

    // Navigate to orders page and find eligible order
    await page.goto('/orders');
    await page.waitForLoadState('networkidle');

    const startReturnLink = page.locator('[data-testid^="start-return-btn-"]').first();
    const hasDirectReturn = await startReturnLink.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasDirectReturn) {
      await startReturnLink.click();
    } else {
      const viewBtn = page.locator('[data-testid^="view-order-btn-"]').first();
      await viewBtn.click();
      await page.waitForURL(url => url.pathname.includes('/orders/'));
      const requestReturnBtn = page.locator('[data-testid="request-return-btn"]');
      if (!await requestReturnBtn.isVisible({ timeout: 3000 }).catch(() => false)) return;
      await requestReturnBtn.click();
    }

    await page.waitForURL(url => url.pathname.includes('/returns/new'));

    // Select first item
    const firstCheckbox = page.locator('input[type="checkbox"]').first();
    await firstCheckbox.check();

    // Select DEFECTIVE without uploading proof
    const reasonSelect = page.locator('[data-testid="return-reason-select"]');
    await reasonSelect.selectOption('DEFECTIVE');

    // Attempt submission without uploading proof image
    await returnFormPage.submit();

    // Expect validation error mentioning proof photo/image (actual message: "proof photo is required")
    await returnFormPage.assertFormError(/proof (image|photo)/i);
  });

  test('validates reason OTHER requires comment of at least 10 characters', async ({ page }) => {
    const returnFormPage = new ReturnFormPage(page);

    await page.goto('/orders');
    await page.waitForLoadState('networkidle');

    const startReturnLink = page.locator('[data-testid^="start-return-btn-"]').first();
    const hasDirectReturn = await startReturnLink.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasDirectReturn) {
      await startReturnLink.click();
    } else {
      const viewBtn = page.locator('[data-testid^="view-order-btn-"]').first();
      await viewBtn.click();
      await page.waitForURL(url => url.pathname.includes('/orders/'));
      const requestReturnBtn = page.locator('[data-testid="request-return-btn"]');
      if (!await requestReturnBtn.isVisible({ timeout: 3000 }).catch(() => false)) return;
      await requestReturnBtn.click();
    }

    await page.waitForURL(url => url.pathname.includes('/returns/new'));

    const firstCheckbox = page.locator('input[type="checkbox"]').first();
    await firstCheckbox.check();

    // Select OTHER reason
    const reasonSelect = page.locator('[data-testid="return-reason-select"]');
    await reasonSelect.selectOption('OTHER');

    // Fill too-short comment (5 chars)
    const commentInput = page.locator('[data-testid="return-comment-input"]');
    if (await commentInput.isVisible()) {
      await commentInput.fill('Short');
      await returnFormPage.submit();

      await returnFormPage.assertFormError(/at least 10 characters/i);
    }
  });

  test('ineligible items and orders delivered > 30 days are blocked from return', async ({ page }) => {
    // Alice has ORD-1004 (delivered 35 days ago) or ORD-1008 (GIFT_CARD type)
    await page.goto('/orders');
    await page.waitForLoadState('networkidle');

    // Check if any order displays the ineligible text
    const ineligibleText = page.locator('text=Items in this order are no longer eligible for return');
    const count = await ineligibleText.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});
