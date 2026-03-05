const puppeteer = require('puppeteer');
const { program } = require('commander');
const fs = require('fs');
const path = require('path');

const PRESETS_DIR = path.join(__dirname, 'presets');

function getAvailablePresetFiles() {
  if (!fs.existsSync(PRESETS_DIR)) {
    return [];
  }
  return fs
    .readdirSync(PRESETS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => entry.name);
}

function getAvailablePresetIds() {
  return getAvailablePresetFiles().map((file) => path.basename(file, '.json'));
}

function loadPreset(presetId) {
  const presetPath = path.join(PRESETS_DIR, `${presetId}.json`);

  if (!fs.existsSync(presetPath)) {
    const available = getAvailablePresetIds();
    console.error(`Unknown preset "${presetId}".`);
    if (available.length > 0) {
      console.error(`Available presets: ${available.join(', ')}`);
    } else {
      console.error('No presets found in the presets directory.');
    }
    process.exit(1);
  }

  let preset;
  try {
    const raw = fs.readFileSync(presetPath, 'utf8');
    preset = JSON.parse(raw);
  } catch (error) {
    console.error(`Failed to read or parse preset file at ${presetPath}.`);
    process.exit(1);
  }

  if (!preset.viewport || !preset.safeAreaInsets) {
    console.error(
      `Preset "${presetId}" is missing required "viewport" or "safeAreaInsets" fields.`
    );
    process.exit(1);
  }

  return preset;
}

program
  .name('safe-area-test')
  .description(
    'Launch Puppeteer with device presets (iPhones, Pixels) and native safe area insets applied'
  )
  .option(
    '-u, --url <url>',
    'Target URL to open in the emulated device',
    'http://localhost:3000'
  )
  .option(
    '-p, --preset <name>',
    'Device preset name (e.g. "iphone-14-pro", "pixel-8-pro")',
    'iphone-14-pro'
  )
  .option(
    '--list-presets, -l',
    'List available device presets and exit'
  );

program.parse(process.argv);
const options = program.opts();

if (options.listPresets) {
  const files = getAvailablePresetFiles();
  if (files.length === 0) {
    console.log('No presets found in the presets directory.');
    process.exit(0);
  }

  console.log('Available presets:');
  for (const file of files) {
    const id = path.basename(file, '.json');
    const fullPath = path.join(PRESETS_DIR, file);
    try {
      const raw = fs.readFileSync(fullPath, 'utf8');
      const data = JSON.parse(raw);
      const label = data && data.name ? data.name : id;
      console.log(`- ${id}: ${label}`);
    } catch {
      console.log(`- ${id}`);
    }
  }

  process.exit(0);
}

const preset = loadPreset(options.preset);

(async () => {
  // 1. Launch a visible browser window
  const browser = await puppeteer.launch({ 
    headless: false, // Must be false so you can actually see and interact with the page
    defaultViewport: preset.viewport
  });
  
  const page = await browser.newPage();

  // 2. Create a raw Chrome DevTools Protocol (CDP) session
  const client = await page.createCDPSession();

  // 3. Inject the safe area insets via CDP
  // This physically overrides the browser's env(safe-area-inset-*) variables
  await client.send('Emulation.setSafeAreaInsetsOverride', {
    insets: preset.safeAreaInsets
  });

  console.log(
    `Launching ${options.url} with preset "${options.preset}" and native safe areas applied...`
  );
  
  try {
    await page.goto(options.url);
    console.log('✅ Success! The browser window will stay open until you close it or press Ctrl+C here.');
  } catch (error) {
    console.error(`❌ Failed to load ${options.url}.`);
  }
})();
