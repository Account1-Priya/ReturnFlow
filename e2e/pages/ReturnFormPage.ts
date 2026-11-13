import { Page, Locator, expect } from '@playwright/test';

export class ReturnFormPage {
  readonly page: Page;
  readonly submitButton: Locator;
  readonly formError: Locator;
  readonly fileInput: Locator;
  readonly previewCard: Locator;
  readonly previewItemRefund: Locator;
  readonly previewTaxRefund: Locator;
  readonly previewRestockingFee: Locator;
  readonly previewShippingRefund: Locator;
  readonly previewTotalRefund: Locator;

  constructor(page: Page) {
    this.page = page;
    this.submitButton = page.locator('[data-testid="submit-return-btn"]');
    this.formError = page.locator('[data-testid="return-form-error"]');
    this.fileInput = page.locator('[data-testid="file-upload-input"]');
    this.previewCard = page.locator('[data-testid="refund-preview-card"]');
    this.previewItemRefund = page.locator('[data-testid="preview-item-refund"]');
    this.previewTaxRefund = page.locator('[data-testid="preview-tax-refund"]');
    this.previewRestockingFee = page.locator('[data-testid="preview-restocking-fee"]');
    this.previewShippingRefund = page.locator('[data-testid="preview-shipping-refund"]');
    this.previewTotalRefund = page.locator('[data-testid="preview-total-refund"]');
  }

  async selectItem(orderItemId: string, quantity = 1, reason = 'CHANGED_MIND', comment?: string) {
    const checkbox = this.page.locator(`[data-testid="item-checkbox-${orderItemId}"]`);
    await checkbox.check();

    const qtySelect = this.page.locator(`[data-testid="quantity-select-${orderItemId}"]`);
    if (await qtySelect.isVisible()) {
      await qtySelect.selectOption(quantity.toString());
    }

    const reasonSelect = this.page.locator(`[data-testid="reason-select-${orderItemId}"]`);
    await reasonSelect.selectOption(reason);

    if (comment) {
      const commentInput = this.page.locator(`[data-testid="comment-input-${orderItemId}"]`);
      await commentInput.fill(comment);
    }
  }

  async uploadProofImages(filePaths: string[]) {
    await this.fileInput.setInputFiles(filePaths);
  }

  async assertRefundPreviewVisible(expectedTotal?: string) {
    await expect(this.previewCard).toBeVisible();
    if (expectedTotal) {
      await expect(this.previewTotalRefund).toContainText(expectedTotal);
    }
  }

  async submit() {
    await expect(this.submitButton).toBeEnabled();
    await this.submitButton.click();
  }

  async assertFormError(errorMessageSubstr: string | RegExp) {
    await expect(this.formError).toBeVisible();
    await expect(this.formError).toContainText(errorMessageSubstr);
  }
}

