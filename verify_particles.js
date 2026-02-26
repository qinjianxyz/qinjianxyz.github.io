const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Navigate to the local server
  await page.goto('http://localhost:8000');

  // Wait for the particle system to initialize
  // The canvas has id 'particles-canvas'
  await page.waitForSelector('#particles-canvas');

  // Take a screenshot of the homepage with the particle background
  await page.screenshot({ path: 'verification_screenshot.png' });

  console.log('Screenshot taken: verification_screenshot.png');

  // Check if ParticleSystem is defined on window (it should be)
  const isParticleSystemDefined = await page.evaluate(() => {
    return typeof window.particleSystem !== 'undefined';
  });

  console.log(`ParticleSystem defined on window: ${isParticleSystemDefined}`);

  await browser.close();
})();
