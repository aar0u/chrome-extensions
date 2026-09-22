# Privacy Policy for New Tab to URL

## Overview

"New Tab to URL" is a lightweight, open-source browser extension designed to redirect your browser's new tab page to a user-configured URL or local file path.

We deeply respect your privacy. This extension operates entirely within your browser and does **not** collect, store, transmit, track, or sell any personal data.

---

## Data Collection & Usage

### 1. Zero Data Collection
- We do **not** collect any personally identifiable information (PII).
- We do **not** collect browsing history, cookies, web activity, IP addresses, or device identifiers.
- We do **not** use analytics, tracking cookies, telemetry, or third-party monitoring tools (e.g., Google Analytics, Mixpanel).

### 2. Local Storage (`chrome.storage.sync`)
- The target URL you configure is stored locally within your browser using the standard `chrome.storage.sync` API.
- If you have browser synchronization enabled, this configuration is synced between your devices using your official browser account (e.g., Google Account / Microsoft Account). The extension developers have no access to this data.

### 3. Permissions Used
- **`tabs`**: Used strictly to update the active tab's URL to your configured destination upon opening a new tab, and to read the current tab's URL when you explicitly click the "Use Current Tab" button.
- **`storage`**: Used strictly to save your chosen destination URL and preferences locally.

---

## Third-Party Services

This extension does not communicate with any external backend servers or third-party APIs. All redirects occur directly on the client side.

---

## Changes to This Policy

If we ever update this privacy policy, changes will be published in this repository. Because we do not collect any user contact details, please review this page periodically for updates.

---

## Contact

If you have any questions or feedback regarding this privacy policy or the extension, please open an issue in the GitHub repository.
