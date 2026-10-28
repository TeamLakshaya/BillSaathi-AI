import { chromium } from 'playwright';
import http from 'http';
import path from 'path';
import fs from 'fs';

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

function createStaticServer(distDir, port = 4174) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let reqPath = decodeURIComponent(req.url.split('?')[0]);
      if (reqPath === '/' || !path.extname(reqPath)) {
        reqPath = '/index.html';
      }

      const filePath = path.join(distDir, reqPath);
      fs.readFile(filePath, (err, data) => {
        if (err) {
          fs.readFile(path.join(distDir, 'index.html'), (fallbackErr, fallbackData) => {
            if (fallbackErr) {
              res.writeHead(404);
              res.end('Not Found');
            } else {
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end(fallbackData);
            }
          });
          return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
      });
    });

    server.listen(port, () => resolve(server));
    server.on('error', reject);
  });
}

async function run() {
  console.log('--- Verifying Sidebar Restructuring & Feature Preservation ---');
  const distDir = path.resolve('dist');
  const server = await createStaticServer(distDir, 4174);
  console.log('Static server running on port 4174');

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
    const errors = [];
    page.on('pageerror', err => {
      console.error('[Page Error]', err);
      errors.push(err.toString());
    });

    const baseUrl = 'http://localhost:4174/';
    await page.goto(`${baseUrl}#overview`);
    await page.waitForSelector('#sidebar');

    // 1. Verify visible main sidebar labels
    console.log('Checking main sidebar entries...');
    const navButtons = await page.locator('#sidebar nav button span').allInnerTexts();
    console.log('Sidebar navigation labels:', navButtons);

    // Verify exactly two main sections for reports/resolution are present:
    if (!navButtons.includes('Reports & Evidence')) {
      throw new Error('Expected "Reports & Evidence" in sidebar navigation');
    }
    if (!navButtons.includes('Complaint & Resolution Assistant')) {
      throw new Error('Expected "Complaint & Resolution Assistant" in sidebar navigation');
    }

    // Verify old entries are removed from visible sidebar:
    if (navButtons.includes('Reports & Exports')) {
      throw new Error('Old "Reports & Exports" should NOT be in visible sidebar');
    }
    if (navButtons.includes('Affidavit Draft Assistant')) {
      throw new Error('Old "Affidavit Draft Assistant" should NOT be a top-level sidebar item');
    }
    if (navButtons.includes('Complaint Assistant')) {
      throw new Error('Old "Complaint Assistant" should NOT be in visible sidebar');
    }
    console.log('✓ Sidebar entries verified: Exactly "Reports & Evidence" and "Complaint & Resolution Assistant" are present');

    // 2. Test Reports & Evidence page and nested features
    console.log('Testing "Reports & Evidence" navigation and nested tabs...');
    await page.getByRole('button', { name: 'Reports & Evidence' }).click();
    await page.waitForSelector('#main h1');
    const reportsHeading = await page.locator('#main h1').innerText();
    if (!reportsHeading.includes('Reports & Evidence')) {
      throw new Error(`Expected "Reports & Evidence" in page heading, got: ${reportsHeading}`);
    }
    console.log('✓ Reports & Evidence heading verified');

    // Check tabs in Reports & Evidence
    const tabTexts = await page.locator('.section-tab').allInnerTexts();
    console.log('Available tabs in Reports & Evidence:', tabTexts);
    if (!tabTexts.some(t => t.includes('Audit Dossiers & Reports'))) {
      throw new Error('Missing "Audit Dossiers & Reports" tab');
    }
    if (!tabTexts.some(t => t.includes('Affidavit & Declaration Draft'))) {
      throw new Error('Missing "Affidavit & Declaration Draft" tab');
    }
    if (!tabTexts.some(t => t.includes('Supporting Evidence'))) {
      throw new Error('Missing "Supporting Evidence" tab');
    }
    console.log('✓ All 3 section tabs verified in Reports & Evidence');

    // Test CSV Export in Reports & Evidence
    console.log('Testing CSV Export in Reports & Evidence...');
    const [csvDownload] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Export Findings (.csv)', exact: true }).click()
    ]);
    const csvName = csvDownload.suggestedFilename();
    if (!csvName.endsWith('.csv')) {
      throw new Error(`Expected .csv file download, got: ${csvName}`);
    }
    console.log(`✓ CSV Export verified: ${csvName}`);

    // Test nested Affidavit Draft Assistant inside Reports & Evidence
    console.log('Testing Affidavit & Declaration Draft tab...');
    await page.getByRole('tab', { name: 'Affidavit & Declaration Draft' }).click();
    await page.waitForSelector('.wizard-top');
    const affNotice = await page.locator('.notice.warning').innerText();
    if (!affNotice.includes('Draft Legal Notice') && !affNotice.includes('AI-assisted draft')) {
      throw new Error(`Expected legal disclaimer notice in affidavit tab, got: ${affNotice}`);
    }
    console.log('✓ Affidavit draft disclaimer verified');

    // Step through affidavit wizard inside Reports & Evidence
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await page.getByRole('button', { name: 'Prepare local template', exact: true }).click();
    const affContent = await page.locator('#aff-draft-editor').inputValue();
    if (!affContent || affContent.length < 50) {
      throw new Error('Affidavit editor text is empty or too short');
    }
    console.log('✓ Affidavit draft template generated successfully within Reports & Evidence');

    // 3. Test Complaint & Resolution Assistant
    console.log('Testing Complaint & Resolution Assistant...');
    await page.getByRole('button', { name: 'Complaint & Resolution Assistant' }).click();
    await page.waitForSelector('#main h1');
    const complaintHeading = await page.locator('#main h1').innerText();
    if (!complaintHeading.includes('Complaint & Resolution Assistant')) {
      throw new Error(`Expected "Complaint & Resolution Assistant" heading, got: ${complaintHeading}`);
    }

    // Verify recipient and reason selection
    const recipientVisible = await page.locator('#complaint-recipient').isVisible();
    const reasonVisible = await page.locator('#complaint-reason').isVisible();
    if (!recipientVisible || !reasonVisible) {
      throw new Error('Complaint recipient or reason dropdown is missing');
    }
    console.log('✓ Complaint recipient and reason selectors verified');

    // Step through Complaint wizard to step 4
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await page.getByRole('button', { name: 'Prepare local template', exact: true }).click();
    await page.getByRole('button', { name: 'Continue', exact: true }).click();

    // Verify Recommended Next Steps & Supporting Document Checklist in step 4
    const resolutionGuideText = await page.locator('.resolution-guide').innerText();
    if (!resolutionGuideText.includes('Recommended Next Steps & Resolution Checklist')) {
      throw new Error('Missing Recommended Next Steps in Complaint Step 4');
    }
    if (!resolutionGuideText.includes('Formal Notice Delivery') || !resolutionGuideText.includes('Escalation Ready')) {
      throw new Error('Incomplete resolution checklist steps');
    }
    console.log('✓ Recommended Next Steps & Supporting Document Checklist verified');

    // 4. Test deep link /affidavit compatibility
    console.log('Testing deep link /affidavit compatibility...');
    await page.goto(`${baseUrl}#affidavit`);
    await page.waitForSelector('#main h1');
    const deepAffHeading = await page.locator('#main h1').innerText();
    if (!deepAffHeading.includes('Affidavit draft assistant')) {
      throw new Error(`Expected Affidavit heading at /affidavit, got: ${deepAffHeading}`);
    }
    // Verify breadcrumb back to Reports & Evidence
    const backLink = await page.locator('a:has-text("Reports & Evidence")').first().isVisible();
    if (!backLink) {
      throw new Error('Missing breadcrumb link to Reports & Evidence on /affidavit');
    }
    console.log('✓ Deep link /affidavit with breadcrumb verified');

    if (errors.length) {
      throw new Error(`Browser console errors detected: ${errors.join(', ')}`);
    }

    console.log('================================================================');
    console.log('🎉 ALL SIDEBAR RESTRUCTURING & PRESERVATION CHECKS PASSED!');
    console.log('================================================================');

  } finally {
    if (browser) await browser.close();
    server.close();
  }
}

run().catch(err => {
  console.error('TEST RUN FAILED:', err);
  process.exit(1);
});
