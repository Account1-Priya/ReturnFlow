import { Page, Locator, expect } from '@playwright/test';

export class AdminDashboardPage {
  readonly page: Page;
  readonly kpiTotalReturns: Locator;
  readonly kpiPendingReview: Locator;
  readonly kpiApproved: Locator;
  readonly kpiTotalRefunded: Locator;

  constructor(page: Page) {
    this.page = page;
    this.kpiTotalReturns = page.locator('[data-testid="kpi-total-returns"]');
    this.kpiPendingReview = page.locator('[data-testid="kpi-submitted-returns"]');
    this.kpiApproved = page.locator('[data-testid="kpi-under-review"]');
    this.kpiTotalRefunded = page.locator('[data-testid="kpi-total-refunded"]');
  }

  async goto() {
    await this.page.goto('/admin/dashboard');
    await this.page.waitForLoadState('networkidle');
  }

  async assertKpisLoaded() {
    await expect(this.kpiTotalReturns).toBeVisible({ timeout: 10000 });
    await expect(this.kpiTotalRefunded).toBeVisible({ timeout: 10000 });
  }
}

export class AdminQueuePage {
  readonly page: Page;
  readonly searchInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.locator('[data-testid="admin-search-input"], [data-testid="search-input"]');
  }

  async goto(tab = 'ALL') {
    await this.page.goto('/admin/returns');
    await this.page.waitForLoadState('networkidle');
    if (tab !== 'ALL') {
      const tabButton = this.page.locator(`[data-testid="filter-tab-${tab}"], [data-testid="filter-tab-${tab.toLowerCase()}"]`);
      if (await tabButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await tabButton.click();
        await this.page.waitForTimeout(500);
      }
    }
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(400); // debounce
  }

  async openReturn(returnId: string) {
    const btn = this.page.locator(`[data-testid="inspect-return-btn-${returnId}"], [data-testid="review-button-${returnId}"]`);
    await btn.click();
    await this.page.waitForURL(`**/admin/returns/${returnId}`);
  }
}

export class AdminDetailPage {
  readonly page: Page;
  // StatusBadge renders with data-testid="status-badge" and data-status={status}
  readonly statusBadge: Locator;
  readonly markReviewButton: Locator;
  readonly approveButton: Locator;
  readonly rejectButton: Locator;
  readonly refundButton: Locator;
  readonly simulateFailureCheckbox: Locator;
  readonly rejectionReasonInput: Locator;
  readonly confirmRejectButton: Locator;
  readonly timeline: Locator;
  readonly actionSuccessMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.statusBadge = page.locator('[data-testid="status-badge"]').first();
    this.markReviewButton = page.locator('[data-testid="admin-review-btn"]');
    this.approveButton = page.locator('[data-testid="admin-approve-btn"]');
    this.rejectButton = page.locator('[data-testid="admin-reject-btn"]');
    this.refundButton = page.locator('[data-testid="admin-refund-btn"]');
    this.simulateFailureCheckbox = page.locator('[data-testid="simulate-gateway-fail-toggle"]');
    this.rejectionReasonInput = page.locator('[data-testid="rejection-reason-textarea"]');
    this.confirmRejectButton = page.locator('[data-testid="confirm-rejection-btn"]');
    this.timeline = page.locator('[data-testid="admin-history-timeline"], [data-testid="timeline"]');
    this.actionSuccessMessage = page.locator('[data-testid="admin-action-success"]');
  }

  async goto(returnId: string) {
    await this.page.goto(`/admin/returns/${returnId}`);
    await this.page.waitForLoadState('networkidle');
  }

  async markUnderReview() {
    await expect(this.markReviewButton).toBeVisible({ timeout: 10000 });
    await this.markReviewButton.click();
    // Wait for success message or status badge to change to UNDER_REVIEW / UNDER REVIEW
    await expect(this.actionSuccessMessage).toBeVisible({ timeout: 10000 });
    // Also wait for the status badge to reflect UNDER_REVIEW
    await expect(this.statusBadge).toHaveAttribute('data-status', 'UNDER_REVIEW', { timeout: 10000 });
  }

  async approve() {
    await expect(this.approveButton).toBeVisible({ timeout: 10000 });
    await this.approveButton.click();
    await expect(this.actionSuccessMessage).toBeVisible({ timeout: 10000 });
    await expect(this.statusBadge).toHaveAttribute('data-status', 'APPROVED', { timeout: 10000 });
  }

  async reject(reason: string) {
    await expect(this.rejectButton).toBeVisible({ timeout: 10000 });
    await this.rejectButton.click();
    await expect(this.rejectionReasonInput).toBeVisible({ timeout: 5000 });
    await this.rejectionReasonInput.fill(reason);
    await this.confirmRejectButton.click();
    await expect(this.actionSuccessMessage).toBeVisible({ timeout: 10000 });
    await expect(this.statusBadge).toHaveAttribute('data-status', 'REJECTED', { timeout: 10000 });
  }

  async triggerRefund(simulateFailure = false) {
    await expect(this.refundButton).toBeVisible({ timeout: 10000 });
    if (simulateFailure) {
      // Check the toggle if not already checked
      const isChecked = await this.simulateFailureCheckbox.isChecked();
      if (!isChecked) {
        await this.simulateFailureCheckbox.check();
      }
    } else {
      // Uncheck if checked
      const isChecked = await this.simulateFailureCheckbox.isChecked().catch(() => false);
      if (isChecked) {
        await this.simulateFailureCheckbox.uncheck();
      }
    }
    await this.refundButton.click();
    // Wait for the action success message
    await expect(this.actionSuccessMessage).toBeVisible({ timeout: 15000 });
    if (simulateFailure) {
      await expect(this.statusBadge).toHaveAttribute('data-status', 'REFUND_FAILED', { timeout: 10000 });
    } else {
      await expect(this.statusBadge).toHaveAttribute('data-status', 'REFUNDED', { timeout: 10000 });
    }
  }
}
