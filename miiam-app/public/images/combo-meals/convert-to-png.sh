#!/bin/bash

# Script to convert combo meal HTML cards to PNG images
# Usage: ./convert-to-png.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="$SCRIPT_DIR"

echo "Converting combo meal HTML cards to PNG..."

# Check if puppeteer is available
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is required. Install it from https://nodejs.org"
    exit 1
fi

# Create a simple Node.js script for conversion
cat > /tmp/convert-combo.js << 'EOF'
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function convertHTMLtoPNG(htmlPath, outputPath) {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 800, height: 600 });
    
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const card = await page.$('.combo-card');
    if (card) {
        await card.screenshot({ path: outputPath, type: 'png' });
        console.log(`✓ Created: ${outputPath}`);
    }
    
    await browser.close();
}

async function main() {
    const htmlFiles = fs.readdirSync(__dirname)
        .filter(f => f.endsWith('.html'));
    
    for (const file of htmlFiles) {
        const htmlPath = path.join(__dirname, file);
        const pngPath = path.join(__dirname, file.replace('.html', '.png'));
        await convertHTMLtoPNG(htmlPath, pngPath);
    }
}

main().catch(console.error);
EOF

# Check if puppeteer is installed
if ! node -e "require('puppeteer')" 2>/dev/null; then
    echo "Puppeteer not found. Installing..."
    npm install -g puppeteer
fi

# Run the conversion
node /tmp/convert-combo.js

echo ""
echo "Done! Check the combo-meals folder for PNG files."
