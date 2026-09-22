# New Tab to URL

Set any URL or local file as your new tab page in Chrome and other Chromium-based browsers.

## Features

- Redirect new tab page to any custom URL instantly
- Supports standard web URLs (`https://...`, `http://...`)
- Supports local file URLs (`file:///...`)
- Supports minimal blank page (`about:blank`)
- Easy setup via extension toolbar popup
- Lightweight with zero external dependencies (no dashboards, no bloat)

## Installation (Unpacked)

1. Open your browser's extensions page (`chrome://extensions` or `edge://extensions`).
2. Enable **Developer mode**.
3. Click **Load unpacked** and select the `packages/new-tab-to-url` directory.

### Enabling Local File Access

If you want to use local HTML files (`file:///...`):
1. Go to the extensions page.
2. Find **New Tab to URL** and click **Details**.
3. Toggle on **Allow access to file URLs**.

## Release Zip

To package the extension into a zip file:

```sh
sh build-release.sh
```

This will produce `release.zip` ready to be loaded or distributed.
