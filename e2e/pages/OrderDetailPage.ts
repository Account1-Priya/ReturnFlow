import { Page, Locator, expect } from '@playwright/test';

export class OrderDetailPage {
  readonly page: Page;
  readonly orderNumber: Locator;
  readonly startReturnButton: Locator;
  readonly ineligibleReasonBadge: Locator;

  constructor(page: Page) {
    this.page = page;
    this.orderNumber = page.locator('[data-testid="order-detail-title"], [data-testid="order-number"]');
    this.startReturnButton = page.locator('[data-testid="request-return-btn"], [data-testid="start-return-button"], [data-testid^="start-return-btn-"], :is(a, button):has-text("Return")');
    this.ineligibleReasonBadge = page.locator('[data-testid="ineligible-reason-badge"], text=/no longer eligible|must be delivered|Final Sale/i');
  }

  async goto(orderId: string) {
    await this.page.goto(`/orders/${orderId}`);
    await this.page.waitForLoadState('networkidle');
  }

  async clickStartReturn() {
    await expect(this.startReturnButton).toBeVisible();
    await this.startReturnButton.click();
    await this.page.waitForURL(url => url.pathname.includes('/returns/new'));
  }

  async assertReturnBlocked(reasonSubstring?: string) {
    await expect(this.ineligibleReasonBadge).toBeVisible();
    if (reasonSubstring) {
      await expect(this.ineligibleReasonBadge).toContainText(reasonSubstring);
    }
    await expect(this.startReturnButton).not.toBeVisible();
  }
}

