import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly quickAliceButton: Locator;
  readonly quickBobButton: Locator;
  readonly quickAdminButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('[data-testid="email-input"]');
    this.passwordInput = page.locator('[data-testid="password-input"]');
    this.submitButton = page.locator('[data-testid="login-submit-button"]');
    this.errorMessage = page.locator('[data-testid="auth-error-message"]');
    this.quickAliceButton = page.locator('[data-testid="quick-login-alice"]');
    this.quickBobButton = page.locator('[data-testid="quick-login-bob"]');
    this.quickAdminButton = page.locator('[data-testid="quick-login-admin"]');
  }

  async goto() {
    await this.page.goto('/login');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async login(email: string, pass: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(pass);
    await this.submitButton.click();
  }

  async quickLoginCustomer(user: 'alice' | 'bob' = 'alice') {
    await this.goto();
    if (user === 'alice') {
      await this.quickAliceButton.click();
    } else {
      await this.quickBobButton.click();
    }
    await this.page.waitForURL(url => !url.pathname.includes('/login'));
  }

  async quickLoginAdmin() {
    await this.goto();
    await this.quickAdminButton.click();
    await this.page.waitForURL(url => url.pathname.includes('/admin'));
  }

  async assertErrorMessage(messageRegex: RegExp | string) {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toContainText(messageRegex);
  }
}

