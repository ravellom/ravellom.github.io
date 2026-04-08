import { chromium } from 'playwright';

const baseUrl = process.env.SURVEY_SUITE_V2_BASE_URL || 'http://127.0.0.1:4173';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const getState = async () => JSON.parse(await page.evaluate(() => localStorage.getItem('surveySuiteV2.state') || '{}'));
  const getCanvasSnippet = async (id) => page.$eval(id, (canvas) => canvas.toDataURL('image/png').slice(0, 50000));

  const results = [];

  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.click('#btn-create-sample');

  await page.click('[data-module=likert]');
  await page.click('[data-module-panel=style]');
  await page.click('[data-likert-layout-tab=layout-typography]');
  await page.fill('#likert-font-labels', '16');
  await page.dispatchEvent('#likert-font-labels', 'change');
  await page.waitForTimeout(150);
  const activeStyleTab = await page.locator('.layout-tab.active').textContent();
  results.push({
    check: 'likert style tab persists',
    pass: /Typography/.test(activeStyleTab || ''),
    value: activeStyleTab
  });

  const beforeLikert = await getCanvasSnippet('#likert-canvas');
  await page.click('[data-likert-layout-tab=layout-colors]');
  await page.selectOption('#shared-palette', 'viridis');
  await page.waitForTimeout(200);
  const state1 = await getState();
  const afterLikert = await getCanvasSnippet('#likert-canvas');
  results.push({
    check: 'likert palette saved',
    pass: state1.config?.sharedChart?.paletteId === 'viridis',
    value: state1.config?.sharedChart?.paletteId
  });
  results.push({
    check: 'likert canvas changes with palette',
    pass: beforeLikert !== afterLikert,
    value: beforeLikert !== afterLikert
  });

  await page.click('[data-module=distribution]');
  const beforeDist = await getCanvasSnippet('#distribution-canvas');
  await page.click('[data-module-panel=chart]');
  await page.selectOption('#dist-chart-type', 'violin');
  await page.waitForTimeout(200);
  const state2 = await getState();
  const afterDist = await getCanvasSnippet('#distribution-canvas');
  results.push({
    check: 'distribution chart type saved',
    pass: state2.config?.distribution?.chartType === 'violin',
    value: state2.config?.distribution?.chartType
  });
  results.push({
    check: 'distribution canvas changes with chart type',
    pass: beforeDist !== afterDist,
    value: beforeDist !== afterDist
  });

  await page.selectOption('#lang-select', 'en');
  await page.waitForTimeout(200);
  await page.click('[data-module-panel=chart]');
  const chartPanelText = await page.locator('.workspace-config-panel').innerText();
  results.push({
    check: 'distribution language visible change',
    pass: chartPanelText.includes('Chart type') && chartPanelText.includes('Hypothesis mode'),
    value: chartPanelText.slice(0, 260)
  });

  await browser.close();

  const failed = results.filter((result) => !result.pass);
  console.log(JSON.stringify(results, null, 2));
  if (failed.length) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
