import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : [['list'], ['html']],

  webServer: {
    command: 'npx serve -l 3000 .',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },

  use: {
    baseURL: 'http://localhost:3000',
  },

  projects: [
    // Desktop
    { name: 'chromium', use: { browserName: 'chromium' } },

    // Mobile
    { name: 'iPhone 16',  use: { ...devices['iPhone 16'] } },
    { name: 'Pixel 7',    use: { ...devices['Pixel 7'] } },
  ],
});
