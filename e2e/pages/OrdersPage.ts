import { Page, Locator, expect } from '@playwright/test';

export class OrdersPage {
  readonly page: Page;
  readonly heading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator('[data-testid="orders-page-title"], [data-testid="orders-heading"]');
  }

  async goto() {
    await this.page.goto('/orders');
    await this.page.waitForLoadState('networkidle');
  }

  async viewOrder(orderId: string) {
    const viewButton = this.page.locator(`[data-testid="view-order-btn-${orderId}"], [data-testid="view-order-button-${orderId}"]`);
    await viewButton.click();
    await this.page.waitForURL(`**/orders/${orderId}`);
  }

  async assertOrderVisible(orderId: string) {
    const card = this.page.locator(`[data-testid="order-card-${orderId}"]`);
    await expect(card).toBeVisible();
  }
}

