import { test, expect } from '@playwright/test';

const pagePath = '/experiments/align-convergence/index.html';
test.use({ serviceWorkers: 'block' });
test.beforeEach(async ({ context }) => {
  // Reproducible local study. No external fonts, evidence requests or provider calls.
  // Context routing covers reference cuts, iframes and newly opened source tabs.
  await context.route('**/*', route => new URL(route.request().url()).origin === 'http://127.0.0.1:4187' ? route.continue() : route.abort());
});

test('manual owner loop, evidence, correction, failed save retry and exact Today re-entry', async ({ page }, testInfo) => {
  await page.goto(pagePath);
  await expect(page.getByRole('heading',{level:1})).toHaveText('The work followed an obsolete goal.');
  await page.screenshot({path:testInfo.outputPath('after-01-conflict.png'),fullPage:true});
  await page.getByRole('button',{name:'Simulate Product proposal',exact:true}).click();
  await page.getByRole('button',{name:'Simulate Security counter',exact:true}).click();
  await page.getByRole('button',{name:'Simulate Product acknowledgment',exact:true}).click();
  await page.getByRole('button',{name:'Simulate owner approval',exact:true}).click();
  for (const id of ['sim-c94598a6b1','sim-bb3f6391e8']) await page.locator(`[data-evidence="${id}"]`).getByRole('button',{name:'Open report',exact:true}).click();
  await expect(page.getByRole('button',{name:'Correct',exact:true})).toBeEnabled();
  await page.getByRole('button',{name:'Correct',exact:true}).click();
  await page.getByRole('button',{name:'Confirm memory-only record',exact:true}).click();
  await page.getByRole('button',{name:'Simulate save failure',exact:true}).click();
  await expect(page.getByRole('heading',{name:'The record was not saved',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Retry same record',exact:true}).click();
  await page.getByRole('button',{name:'Complete memory save',exact:true}).click();
  await expect(page.locator('div[data-record-id="prototype:align-convergence-journey-v1:001"]')).toBeVisible();
  await page.screenshot({path:testInfo.outputPath('after-02-record.png'),fullPage:true});
  await page.getByRole('button',{name:'Simulate later source change',exact:true}).click();
  await page.getByRole('button',{name:'Open Today',exact:true}).click();
  await page.screenshot({path:testInfo.outputPath('after-03-today.png'),fullPage:true});
  await page.getByRole('button',{name:'Open exact record',exact:true}).click();
  await expect(page.locator('div[data-record-id="prototype:align-convergence-journey-v1:001"]')).toBeVisible();
  await page.reload();
  await page.getByRole('button',{name:'Record',exact:true}).click();
  await expect(page.getByRole('heading',{name:'No record has been created.',exact:true})).toBeVisible();
});

test('stale blocks the tested route and untested never reuses the accepted plan hash', async ({ page }, testInfo) => {
  await page.goto(`${pagePath}?state=stale`);
  await page.getByRole('button',{name:'Simulate owner approval',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('Approval blocked');
  await page.getByRole('button',{name:'Approve as explicitly untested',exact:true}).click();
  await expect(page.getByText('No bound plan hash',{exact:true})).toBeVisible();
  await page.screenshot({path:testInfo.outputPath('after-04-untested.png'),fullPage:true});
});

test('offline evidence is recoverable and inspection does not silently succeed', async ({ page }) => {
  await page.goto(`${pagePath}?state=approved`);
  await page.getByRole('button',{name:'Simulate offline evidence',exact:true}).click();
  await page.getByRole('button',{name:'Open report',exact:true}).first().click();
  await expect(page.getByRole('alert')).toContainText('could not be opened');
  await expect(page.getByRole('button',{name:'Report inspected',exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Restore fixture evidence',exact:true}).click();
  await page.getByRole('button',{name:'Open report',exact:true}).first().click();
  await expect(page.getByRole('button',{name:'Report inspected',exact:true})).toHaveCount(1);
});

test('typed correction and return date survive owner, report, lens and navigation redraws', async ({ page }) => {
  await page.goto(pagePath);
  const correction='Keep the beta priority and capacity limit after operator review.';
  const date='2026-10-21';
  await page.getByLabel('What did the agent miss?',{exact:true}).fill(correction);
  await page.getByLabel('Return date if deferred',{exact:true}).fill(date);
  for (const name of ['Simulate Product proposal','Simulate Security counter','Simulate Product acknowledgment','Simulate owner approval']) {
    await page.getByRole('button',{name,exact:true}).click();
    await expect(page.getByLabel('What did the agent miss?',{exact:true})).toHaveValue(correction);
    await expect(page.getByLabel('Return date if deferred',{exact:true})).toHaveValue(date);
  }
  for (const id of ['sim-c94598a6b1','sim-bb3f6391e8']) await page.locator(`[data-evidence="${id}"]`).getByRole('button',{name:'Open report',exact:true}).click();
  for (const name of ['Inspect Goal Lens','Close Goal Lens','Simulate offline evidence','Restore fixture evidence','Today','Record','Slate']) await page.getByRole('button',{name,exact:true}).click();
  await expect(page.getByLabel('What did the agent miss?',{exact:true})).toHaveValue(correction);
  await expect(page.getByLabel('Return date if deferred',{exact:true})).toHaveValue(date);
  await page.getByRole('button',{name:'Correct',exact:true}).click();
  await page.getByRole('button',{name:'Confirm memory-only record',exact:true}).click();
  await page.getByRole('button',{name:'Simulate save failure',exact:true}).click();
  await page.getByRole('button',{name:'Retry same record',exact:true}).click();
  await page.getByRole('button',{name:'Complete memory save',exact:true}).click();
  await expect(page.locator('div[data-record-id="prototype:align-convergence-journey-v1:001"]')).toContainText(correction);
});

test('retained return date is recorded and explicit reset or preset restores defaults', async ({ page }) => {
  await page.goto(`${pagePath}?state=approved`);
  const correction=page.getByLabel('What did the agent miss?',{exact:true});
  const date=page.getByLabel('Return date if deferred',{exact:true});
  const defaultCorrection=await correction.inputValue();
  await correction.fill('Temporary operator text');
  await date.fill('2026-10-21');
  await page.getByRole('button',{name:'Reset replay',exact:true}).click();
  await expect(correction).toHaveValue(defaultCorrection);
  await expect(date).toHaveValue('2026-10-14');
  await correction.fill('Another temporary edit');
  await date.fill('2026-10-22');
  await page.getByLabel('Replay',{exact:true}).selectOption('countered');
  await expect(correction).toHaveValue(defaultCorrection);
  await expect(date).toHaveValue('2026-10-14');
  await page.getByLabel('Replay',{exact:true}).selectOption('approved');
  await date.fill('2026-10-21');
  await page.getByRole('button',{name:'Inspect Goal Lens',exact:true}).click();
  for (const id of ['sim-c94598a6b1','sim-bb3f6391e8']) await page.locator(`[data-evidence="${id}"]`).getByRole('button',{name:'Open report',exact:true}).click();
  await page.getByRole('button',{name:'Defer',exact:true}).click();
  await page.getByRole('button',{name:'Confirm memory-only record',exact:true}).click();
  await page.getByRole('button',{name:'Complete memory save',exact:true}).click();
  await page.getByRole('button',{name:'Open Today',exact:true}).click();
  await expect(page.getByText('Deferred until 2026-10-21.',{exact:true})).toBeVisible();
});

test('before references and side-by-side ruling renders', async ({ page }, testInfo) => {
  for (const name of ['01-slate-tray','06-margin-read','10-today','11-govern','12-operating-plane']) {
    await page.goto(`/cuts/${name}.html`);
    await page.screenshot({path:testInfo.outputPath(`before-${name}.png`),fullPage:true});
  }
  await page.goto('/experiments/align-convergence/review.html');
  await expect(page.getByRole('heading',{level:1})).toHaveText('One judgment, carried forward.');
  for (const frame of await page.locator('iframe').all()) await expect(frame.contentFrame().getByRole('heading',{level:1})).toHaveText('The work followed an obsolete goal.');
  await page.screenshot({path:testInfo.outputPath('rulings-side-by-side.png'),fullPage:true});
  for (const state of ['declined','countered','confirm','failed']) {
    await page.goto(`${pagePath}?state=${state}`);
    await page.screenshot({path:testInfo.outputPath(`after-${state}.png`),fullPage:true});
  }
});
