## Safe Area Test

This project is a small Node + Puppeteer helper that launches a Chromium window configured to emulate iOS-style safe area insets. It uses the Chrome DevTools Protocol `Emulation.setSafeAreaInsetsOverride` API so your local web app sees realistic `env(safe-area-inset-*)` values while you visually test layout around the notch and home indicator.

The default setup approximates an iPhone 14 Pro viewport and safe area, letting you quickly verify that headers, tab bars, and other UI elements respect the safe area.

## Prerequisites

- **Node.js**: Any reasonably recent LTS version should work.
- **pnpm**: The project is configured to use `pnpm@10.5.0` as the package manager (see `package.json`).

## Installation

- **Clone the repo** (or copy this folder into your project).
- **Install dependencies** (this will also download a compatible Chromium build the first time, which may take a few minutes):

```bash
pnpm install
```

## Usage

1. **Start your local development server**  
   By default, the script will try to open `http://localhost:3000`, so make sure your app is running there (for example, `pnpm dev`, `npm run dev`, `yarn dev`, etc. in your own app).

2. **Run the safe area helper**

```bash
pnpm dev
```

This runs `node main.js`, which will:

- Launch a **visible** (non-headless) Chromium window.
- Set a mobile-style viewport (roughly iPhone 14 Pro dimensions).
- Use a raw CDP session to call `Emulation.setSafeAreaInsetsOverride`, overriding the browser's safe area inset environment variables.
- Navigate to your target URL and keep the window open until you close it (or stop the Node process).

When everything is working, you should see your app rendered inside a mobile-sized window with the specified safe areas applied.

## Configuration

All configuration lives in `main.js`. The main knobs you are likely to adjust are:

- **Target URL**
  - The script currently uses:
    - `const TARGET_URL = 'http://localhost:3000';`
  - Change this to point at whatever local or remote URL you want to test.

- **Viewport size and device-like flags**
  - Inside the `puppeteer.launch` call, the viewport is set via `defaultViewport`:
    - `width`: horizontal resolution (e.g. `390`).
    - `height`: vertical resolution (e.g. `844`).
    - `isMobile`: `true` to apply mobile styling/behavior.
    - `hasTouch`: `true` to simulate touch support.
  - Adjust these values to approximate other devices or orientations as needed.

- **Safe area insets**
  - The key CDP call looks like:

```js
await client.send('Emulation.setSafeAreaInsetsOverride', {
  insets: {
    top: 47,
    bottom: 34,
    left: 0,
    right: 0,
  },
});
```

  - Tweak `top` and `bottom` (and `left`/`right` if desired) to emulate different devices or notch/home-indicator sizes.

## Troubleshooting & Notes

- **The page fails to load**
  - The script will log an error like `Failed to load http://localhost:3000. Is your local server running?`
  - Make sure your dev server is started and reachable at the `TARGET_URL` you configured.

- **First install is slow**
  - Puppeteer typically downloads its own Chromium binary on first install. This can take a while, especially on slower networks. Subsequent runs should be much faster.

- **Cross-platform behavior**
  - The script itself is cross-platform as long as Node, pnpm, and Puppeteer work on your OS. The examples here assume a typical Node development workflow, but the helper should behave similarly on Windows, macOS, and Linux.

## License

This project is licensed under the **ISC License** as specified in `package.json`.

## Author

Replace this section with your name, handle, or organization as desired.

