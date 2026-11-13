import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

const PORT_FRONTEND = process.env.PORT_FRONTEND || '5173';
const BASE_URL = `http://localhost:${PORT_FRONTEND}`;

export default defineConfig({
  testDir: './specs',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: false, // Run sequentially to avoid DB collision during state mutation
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker keeps database test states clean & predictable
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testDir: './fixtures',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      testDir: './specs',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],
  webServer: [
    {
      command: 'npm run dev',
      cwd: path.resolve(__dirname, '../backend'),
      url: 'http://localhost:3001/api/docs',
      reuseExistingServer: true,
      timeout: 60 * 1000,
    },
    {
      command: 'npm run dev',
      cwd: path.resolve(__dirname, '../frontend'),
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 60 * 1000,
    },
  ],
});

