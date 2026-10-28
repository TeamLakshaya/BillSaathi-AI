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

function createStaticServer(distDir, port = 4173) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let reqPath = decodeURIComponent(req.url.split('?')[0]);
      if (reqPath === '/' || !path.extname(reqPath)) {
        reqPath = '/index.html';
      }

      const filePath = path.join(distDir, reqPath);
      fs.readFile(filePath, (err, data) => {
        if (err) {
          // SPA routing fallback
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
  console.log('--- Starting React App Verification ---');
  const distDir = path.resolve('dist');
  console.log(`Serving static files from ${distDir}`);

  const server = await createStaticServer(distDir, 4173);
  console.log('Static server running on port 4173');

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
    const errors = [];
    page.on('pageerror', err => {
      console.error('[Page Error]', err);
      errors.push(err.toString());
    });

    const baseUrl = 'http://localhost:4173/';
    console.log(`Navigating to ${baseUrl}`);
    await page.goto(baseUrl);

    // Test Landing Page
    console.log('Testing Landing Page at initial route /...');
    await page.waitForSelector('.landing-page');
    const heroTitle = await page.locator('#hero-heading').innerText();
    console.log(`✓ Landing Page loaded with headline: "${heroTitle.replace(/\n/g, ' ')}"`);
    if (!heroTitle.includes('Understand Your Hospital Bill')) {
      throw new Error('Hero title mismatch on landing page');
    }

    // Test Landing Page "Analyze My Bill" CTA navigation
    console.log('Testing "Analyze My Bill" CTA button navigation...');
    await page.locator('#hero-analyze-cta').click();
    await page.waitForSelector('#main');
    console.log('✓ "Analyze My Bill" successfully navigated to workspace');

    // 1. Check all 14 routes
    const routes = [
      'cases', 'new', 'upload', 'review', 'audit', 'price',
      'evidence', 'complaint', 'affidavit', 'reports', 'help',
      'settings', 'detail', 'overview'
    ];

    for (const r of routes) {
      await page.goto(`${baseUrl}#${r}`);
      await page.waitForSelector('#main');
      const text = await page.locator('#main').innerText();
      if (text.length < 100) {
        throw new Error(`Route #${r} has insufficient content (${text.length} chars)`);
      }
      console.log(`✓ Route #${r} loaded successfully (${text.length} chars)`);
    }

    // 2. Case Creation Wizard
    console.log('Testing Case Creation Wizard...');
    await page.goto(`${baseUrl}#overview`);
    await page.getByRole('button', { name: 'Start New Bill Review' }).click();
    await page.getByLabel('Case name', { exact: false }).fill('QA sample review');
    await page.getByLabel('Hospital or healthcare provider', { exact: false }).fill('QA Fictional Hospital');
    await page.getByLabel('Total bill amount', { exact: false }).fill('1000');
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await page.getByLabel('Understand my hospital bill.', { exact: true }).check();
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await page.getByRole('button', { name: 'Create case locally', exact: true }).click();
    const mainTextAfterCreate = await page.locator('#main').innerText();
    if (!mainTextAfterCreate.includes('QA sample review')) {
      throw new Error('Case creation failed: QA sample review not found in #main');
    }
    console.log('✓ Case Creation Wizard passed');

    // 3. Document Upload Validation
    console.log('Testing Document Upload & Validation...');
    await page.goto(`${baseUrl}#upload`);
    await page.locator('#file-input').setInputFiles({
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('unsupported content')
    });
    const pendingText = await page.locator('#pending-files').innerText();
    if (!pendingText.includes('Unsupported file type')) {
      throw new Error(`Expected 'Unsupported file type' in #pending-files, got: ${pendingText}`);
    }
    console.log('✓ Unsupported file check passed');

    await page.locator('#file-input').setInputFiles({
      name: 'sample.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4\n%%EOF')
    });
    await page.getByRole('button', { name: 'Add selected files locally', exact: true }).click();
    const uploadMainText = await page.locator('#main').innerText();
    if (!uploadMainText.includes('Selected locally')) {
      throw new Error('Expected "Selected locally" in #main');
    }
    console.log('✓ PDF local upload passed');

    // 4. Draft Assistant & Export
    console.log('Testing Draft Assistant...');
    await page.goto(`${baseUrl}#complaint`);
    // Select BS-1024 for sample findings
    if (await page.locator('#active-case').isVisible()) {
      await page.locator('#active-case').selectOption('BS-1024');
    }
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await page.getByRole('button', { name: 'Prepare local template', exact: true }).click();
    const draftContent = await page.locator('#draft-editor').inputValue();
    if (!draftContent || draftContent.length < 50) {
      throw new Error('Draft editor empty or template not generated');
    }
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    for (const check of await page.locator('.final-check').all()) {
      await check.check();
    }
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Export draft (.txt)', exact: true }).click()
    ]);
    const suggestedName = download.suggestedFilename();
    if (!suggestedName.endsWith('.txt')) {
      throw new Error(`Expected .txt download, got ${suggestedName}`);
    }
    console.log(`✓ Draft export passed (${suggestedName})`);

    // 5. Mobile Drawer and Responsiveness
    console.log('Testing Mobile Drawer & Responsive Layout...');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${baseUrl}#overview`);
    const overflow = await page.locator('body').boundingBox();
    if (overflow.width > 390) {
      throw new Error(`Mobile overflow width ${overflow.width} > 390`);
    }
    await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
    const bodyClass = (await page.locator('body').getAttribute('class')) || '';
    if (!bodyClass.includes('mobile-open')) {
      throw new Error(`Expected 'mobile-open' in body class, got: ${bodyClass}`);
    }
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    const settingsText = await page.locator('#main').innerText();
    if (!settingsText.includes('Settings & privacy')) {
      throw new Error('Settings navigation from mobile drawer failed');
    }
    console.log('✓ Mobile drawer & responsiveness passed');

    // 6. Extended search and review tests
    console.log('Testing Cases Search, Audit Resolution, OCR Review, Evidence Linking...');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${baseUrl}#cases`);
    await page.getByLabel('Search cases', { exact: true }).fill('BS-1024');
    const caseRowCount = await page.locator('#cases-result tbody tr').count();
    if (caseRowCount !== 1) {
      throw new Error(`Expected 1 row for BS-1024, got ${caseRowCount}`);
    }
    await page.getByLabel('Search cases', { exact: true }).fill('not-a-case');
    const noCasesText = await page.locator('#cases-result').innerText();
    if (!noCasesText.includes('No cases found')) {
      throw new Error('Expected "No cases found"');
    }

    // Switch to BS-1024 for audit resolution test
    await page.goto(`${baseUrl}#audit`);
    if (await page.locator('#active-case').isVisible()) {
      await page.locator('#active-case').selectOption('BS-1024');
    }
    await page.getByRole('button', { name: 'Mark as Reviewed', exact: true }).first().click();
    await page.getByLabel('Review note (required)').fill('QA sample note: confirmed times.');
    await page.getByRole('button', { name: 'Save review', exact: true }).click();
    const auditText = await page.locator('#main').innerText();
    if (!auditText.includes('Resolved by User')) {
      throw new Error('Expected "Resolved by User" in audit findings');
    }

    // OCR Review
    await page.goto(`${baseUrl}#review`);
    if (await page.locator('#active-case').isVisible()) {
      await page.locator('#active-case').selectOption('BS-1024');
    }
    await page.getByRole('button', { name: 'Mark as Reviewed', exact: true }).click();
    const reviewText = await page.locator('#main').innerText();
    if (!reviewText.includes('Reviewed locally')) {
      throw new Error('Expected "Reviewed locally" in review page');
    }

    // Evidence linking
    await page.goto(`${baseUrl}#evidence`);
    if (await page.locator('#active-case').isVisible()) {
      await page.locator('#active-case').selectOption('BS-1024');
    }
    await page.getByRole('button', { name: 'Link finding', exact: true }).nth(1).click();
    await page.getByRole('button', { name: 'Save link', exact: true }).click();
    const evidenceRowText = await page.locator('#evidence-table tbody tr').nth(1).innerText();
    if (!evidenceRowText.includes('F-01')) {
      throw new Error('Expected "F-01" in evidence table row 2');
    }

    // Reports export
    await page.goto(`${baseUrl}#reports`);
    if (await page.locator('#active-case').isVisible()) {
      await page.locator('#active-case').selectOption('BS-1024');
    }
    await page.getByRole('button', { name: 'Review report', exact: true }).first().click();
    const [reportDl] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Export .txt', exact: true }).click()
    ]);
    if (!reportDl.suggestedFilename().endsWith('.txt')) {
      throw new Error('Expected .txt for report download');
    }
    await page.getByRole('button', { name: 'Close', exact: true }).click();

    // Switch workspace
    await page.getByRole('button', { name: 'Use empty workspace', exact: true }).click();
    await page.getByRole('button', { name: 'Switch workspace', exact: true }).click();
    const emptyWorkspaceText = await page.locator('#main').innerText();
    if (!emptyWorkspaceText.includes('No cases yet')) {
      throw new Error('Expected "No cases yet" after switching to empty workspace');
    }
    console.log('✓ All extended checks passed');

    // Multi-viewport layout integrity check
    for (const w of [390, 768, 1440]) {
      await page.setViewportSize({ width: w, height: 900 });
      await page.goto(`${baseUrl}#overview`);
      const bb = await page.locator('#main').boundingBox();
      if (bb.x + bb.width > w + 2) {
        throw new Error(`Horizontal layout overflow at viewport ${w}px: x=${bb.x}, width=${bb.width}`);
      }
      console.log(`✓ Viewport width ${w}px layout check passed`);
    }

    // Take screenshot comparisons
    await page.goto(`${baseUrl}#overview`);
    await page.getByRole('button', { name: 'Explore demo', exact: true }).click();
    await page.getByRole('button', { name: 'Switch workspace', exact: true }).click();
    await page.setViewportSize({ width: 1440, height: 1100 });
    await page.screenshot({ path: path.resolve('react-dashboard-desktop.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.resolve('react-dashboard-mobile.png'), fullPage: true });

    if (errors.length) {
      console.error('Browser errors encountered:', errors);
      throw new Error(`Browser console errors detected: ${errors.join(', ')}`);
    }

    console.log('====================================================');
    console.log('🎉 ALL REACT APPLICATION TESTS PASSED WITH 0 ERRORS!');
    console.log('====================================================');

  } finally {
    if (browser) await browser.close();
    server.close();
  }
}

run().catch(err => {
  console.error('TEST RUN FAILED:', err);
  process.exit(1);
});
