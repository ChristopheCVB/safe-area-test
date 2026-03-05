const puppeteer = require('puppeteer');
const { program } = require('commander');

program
  .name('safe-area-test')
  .description('Launch Puppeteer with iOS-style safe area insets applied')
  .option('-u, --url <url>', 'Target URL to open in the emulated device', 'http://localhost:3000');

program.parse(process.argv);
const options = program.opts();

(async () => {
  // 1. Launch a visible browser window
  const browser = await puppeteer.launch({ 
    headless: false, // Must be false so you can actually see and interact with the page
    defaultViewport: { 
      width: 390, 
      height: 844,     // iPhone 14 Pro dimensions
      isMobile: true, 
      hasTouch: true 
    }
  });
  
  const page = await browser.newPage();

  // 2. Create a raw Chrome DevTools Protocol (CDP) session
  const client = await page.createCDPSession();

  // 3. Inject the safe area insets via CDP
  // This physically overrides the browser's env(safe-area-inset-*) variables
  await client.send('Emulation.setSafeAreaInsetsOverride', {
    insets: {
      top: 47,    // Simulates the top notch/dynamic island
      bottom: 34, // Simulates the bottom home indicator
      left: 0,
      right: 0
    }
  });

  console.log(`Launching ${options.url} with native safe areas applied...`);
  
  try {
    await page.goto(options.url);
    console.log('✅ Success! The browser window will stay open until you close it or press Ctrl+C here.');
  } catch (error) {
    console.error(`❌ Failed to load ${options.url}.`);
  }
})();
