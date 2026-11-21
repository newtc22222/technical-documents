---
id: chrome-extension
title: Chrome Manifest V3 Extension
sidebar_label: Chrome MV3 Extension
sidebar_position: 2
description: Plain JavaScript Chrome MV3 extension for domain auto-detection, fallback project picking, and visible-tab screenshot capture.
---

# Chrome Manifest V3 Extension

The browser extension lives in `extension/` as plain HTML, CSS, and JavaScript with **no bundler or build step**. It enables team members or external testers to report issues directly from any active tab without authenticating as an admin.

---

## Permissions & Files

| File | Purpose |
| --- | --- |
| `extension/manifest.json` | MV3 manifest declaring `activeTab` and `storage` permissions plus `host_permissions` for `http://localhost:3000/*` and your production origin |
| `extension/popup.html` / `popup.js` / `popup.css` | Popup UI for site detection, manual fallback selection, screenshot capture, and feedback submission |
| `extension/options.html` / `options.js` / `options.css` | Options page persisting `apiOrigin` in `chrome.storage.local` |

---

## Site Detection & Submission Flow

```mermaid
sequenceDiagram
  participant User as Browser Tab
  participant Ext as Extension Popup (popup.js)
  participant API as Bug Tracking API

  User->>Ext: Open extension popup
  Ext->>Ext: Read apiOrigin from chrome.storage.local
  Ext->>Ext: Extract hostname from active tab URL
  Ext->>API: GET /api/lookup?domain=hostname
  alt Domain matches a project
    API-->>Ext: 200 (found=true, slug, name)
    Ext->>Ext: Show feedback form bound to slug
  else No matching domain
    API-->>Ext: 200 (found=false)
    Ext->>API: GET /api/projects/public-list
    API-->>Ext: 200 (slug, name list)
    Ext->>Ext: Show manual project dropdown
  end
  opt User captures screenshot
    User->>Ext: Click "Capture visible tab screenshot"
    Ext->>Ext: chrome.tabs.captureVisibleTab (JPEG quality 75)
  end
  User->>Ext: Submit feedback
  Ext->>API: POST /api/submit/[slug] (pageUrl, browserInfo, screenshotDataUrl)
  API-->>Ext: 201 Created (source="extension")
```

---

## Domain Normalization (`lib/domain.ts`)

Both project creation/update (`POST /api/projects`, `PUT /api/projects/[id]`) and extension lookup (`GET /api/lookup?domain=...`) normalize domains via `normalizeDomain()`:

- Trims whitespace and lowercases the input.
- Parses full URLs (`https://APP.Example.com:8443/path` -> `app.example.com`) using the standard `URL` parser, stripping ports, paths, query strings, and trailing dots.
- Falls back to safe string stripping if an invalid URL fragment is passed.

---

## Visible-Tab Screenshot & Context Capture

- Clicking **Capture visible tab screenshot** in `popup.html` calls `chrome.tabs.captureVisibleTab(null, { format: "jpeg", quality: 75 })`, which works under MV3's existing `activeTab` permission.
- The extension renders an inline preview with **Retake screenshot** and **Remove screenshot** controls.
- On submit, `popup.js` sends `pageUrl`, `browserInfo` (`navigator.userAgent`), and optional `screenshotDataUrl` to `POST /api/submit/[slug]`.
- The server stores structured columns (`pageUrl`, `browserInfo`, `screenshotDataUrl`), appends the delimited `---\nSubmitted via extension` block to `description` when `pageUrl`/`browserInfo` are provided, and sets `source: "extension"`.
