import { Page, Locator, expect } from '@playwright/test';

export class ReturnDetailPage {
  readonly page: Page;
  readonly statusBadge: Locator;
  readonly cancelReturnButton: Locator;
  readonly confirmCancelButton: Locator;
  readonly rejectionReasonBox: Locator;
  readonly itemizedBreakdown: Locator;

  constructor(page: Page) {
    this.page = page;
    // StatusBadge renders with data-testid="status-badge" and data-status={status}
    this.statusBadge = page.locator('[data-testid="status-badge"]').first();
    this.cancelReturnButton = page.locator('[data-testid="open-cancel-modal-btn"]');
    this.confirmCancelButton = page.locator('[data-testid="confirm-cancel-return-btn"]');
    this.rejectionReasonBox = page.locator('[data-testid="rejection-reason-box"]');
    this.itemizedBreakdown = page.locator('[data-testid="return-detail-total-refund"]');
  }

  async goto(returnId: string) {
    await this.page.goto(`/returns/${returnId}`);
    await this.page.waitForLoadState('networkidle');
  }

  async assertStatus(statusText: string) {
    await expect(this.statusBadge).toBeVisible();
    await expect(this.statusBadge).toContainText(statusText);
  }

  async cancelReturn() {
    await expect(this.cancelReturnButton).toBeVisible();
    await this.cancelReturnButton.click();
    await expect(this.confirmCancelButton).toBeVisible();
    await this.confirmCancelButton.click();
    await expect(this.statusBadge).toContainText('CANCELLED');
  }

  async assertCannotCancel() {
    await expect(this.cancelReturnButton).not.toBeVisible();
  }

  async assertRejectionReason(expectedReasonText: string) {
    await expect(this.rejectionReasonBox).toBeVisible();
    await expect(this.rejectionReasonBox).toContainText(expectedReasonText);
  }
}

export class MyReturnsPage {
  readonly page: Page;
  readonly heading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator('[data-testid="returns-heading"]');
  }

  async goto() {
    await this.page.goto('/returns');
    await this.page.waitForLoadState('networkidle');
  }

  async viewReturn(returnId: string) {
    const btn = this.page.locator(`[data-testid="view-return-button-${returnId}"]`);
    await btn.click();
    await this.page.waitForURL(`**/returns/${returnId}`);
  }
}

