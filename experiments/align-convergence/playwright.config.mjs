// AUTHORSHIP ONLY until the operator explicitly permits server/browser launch.
import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests', testMatch: /journey\.spec\.mjs/,
  outputDir: './artifacts', timeout: 30_000, workers: 1,
  reporter: [['list']],
  use: { baseURL: 'http://127.0.0.1:4187', viewport: { width: 1440, height: 1000 }, screenshot: 'only-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }, { name: 'reduced-motion', use: { ...devices['Desktop Chrome'], reducedMotion: 'reduce' } }],
  webServer: { command: 'node server.mjs', cwd: new URL('../../',import.meta.url).pathname, url: 'http://127.0.0.1:4187', env: { PORT:'4187' }, reuseExistingServer: false },
});
