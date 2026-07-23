const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function captureComboCards() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 900, height: 600 },
        deviceScaleFactor: 2
    });

    const htmlFiles = fs.readdirSync(__dirname)
        .filter(f => f.endsWith('.html'));

    for (const file of htmlFiles) {
        const page = await context.newPage();
        const htmlPath = path.join(__dirname, file);
        const pngPath = path.join(__dirname, file.replace('.html', '.png'));

        await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const card = await page.$('.combo-card');
        if (card) {
            await card.screenshot({ path: pngPath, type: 'png' });
            console.log(`✓ Created: ${file.replace('.html', '.png')}`);
        }

        await page.close();
    }

    await browser.close();
    console.log('\nDone! All combo cards converted to PNG.');
}

captureComboCards().catch(console.error);
