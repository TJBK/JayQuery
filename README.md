# JayQuery

[![CI](https://github.com/LukeSteward/JayQuery/actions/workflows/ci.yml/badge.svg)](https://github.com/LukeSteward/JayQuery/actions/workflows/ci.yml)
[![Extension zip](https://github.com/LukeSteward/JayQuery/actions/workflows/extension-zip.yml/badge.svg)](https://github.com/LukeSteward/JayQuery/actions/workflows/extension-zip.yml)
[![Edge Web Store](https://img.shields.io/badge/Edge%20Web%20Store-passing-brightgreen?logo=microsoftedge&logoColor=white)](https://microsoftedge.microsoft.com/addons/detail/jayquery/jkgijecdjbnigliabkajkmbhdimjdggh)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/jicgjligckkjmecbbakkbpfbagfdfdol?label=Chrome%20Web%20Store&logo=googlechrome&logoColor=white)](https://chromewebstore.google.com/detail/jayquery/jicgjligckkjmecbbakkbpfbagfdfdol)


**Install:**

<a href="https://microsoftedge.microsoft.com/addons/detail/jayquery/jkgijecdjbnigliabkajkmbhdimjdggh">
  <img src="https://github.com/LukeSteward/JayQuery/blob/main/github-assets/edge-store.png?raw=true" 
       alt="Edge badge" 
       width="350" 
       height="auto">
</a>

<a href="https://chromewebstore.google.com/detail/jayquery/jicgjligckkjmecbbakkbpfbagfdfdol">
  <img src="https://github.com/LukeSteward/JayQuery/blob/main/github-assets/chrome-store.png?raw=true" 
       alt="Chrome badge" 
       width="350" 
       height="auto">
</a>

Browser extension (**Chrome / Edge**, Manifest V3) that inspects the **active tab’s hostname**, resolves **TXT** records over **DNS-over-HTTPS** (Cloudflare primary, Google fallback), evaluates **SPF**, **DMARC**, and **DKIM** (common selectors), and shows a **score out of 10** with a per-protocol breakdown.

Conceptually aligned with [JohnDuprey/DNSHealth](https://github.com/johnduprey/DNSHealth); this project implements similar checks in **TypeScript** for the browser instead of PowerShell.

## Features

- **SPF** and **DKIM** default to the **root (registrable) domain** (`www` and subdomains stripped via the public suffix list). Toggle **Tab hostname** in the popup to check the exact host (e.g. `www` or a subdomain).
- **DMARC** is always read from `_dmarc` at the tab’s **organisational domain**.
- **More DNS checks** (over DoH, same general areas as [DNSHealth](https://github.com/johnduprey/DNSHealth/) cmdlets): **MX**, **NS**, **MTA-STS** TXT at `_mta-sts`, **TLS-RPT** TXT at `_smtp._tls`, **DNSSEC** (DNSKEY + `AD`-style signal). These use the **organisational domain**, not the tab-hostname toggle.
- **SPF / DMARC / DKIM** cards include **grading breakdowns** (checklist with pass / warn / fail).

## Privacy & network

- **Permissions:** **`tabs`** reads each tab’s **URL** once a navigation **finishes loading** (`tabs.onUpdated`, `complete`) and refreshes the **toolbar icon** after a **reload** or when the **hostname** changes (same host with only path/query/`#` changes does not re-run). Toolbar status glyphs are **drawn with `OffscreenCanvas`** (stroke paths) directly in the extension context; no SVG decode pipeline or **`offscreen`** document. **Storage** persists settings locally.
- **Host access (see `wxt.config.ts`):** **DNS-over-HTTPS** only — `https://cloudflare-dns.com/*` and `https://dns.google/*` (primary vs fallback is user-configurable). The Entra-related probe uses `https://login.microsoftonline.com/*`. There is **no** broad `http(s)://*/*` host pattern; **`tabs`** is what exposes `Tab.url` for the toolbar and popup. The extension **does not** inject content scripts or fetch arbitrary page URLs.

## Prerequisites

- Node.js **24+** and npm

## Development

```bash
npm install
npm run dev
```

Load the extension from the `.output/chrome-mv3` folder WXT prints (after `npm run build`, use the same path).

## Build

```bash
npm run build
```

Output: **`.output/chrome-mv3/`** (unpackaged extension).

### Load in Google Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select your clone’s `.output/chrome-mv3` folder

Pin the **JayQuery** action, visit a site served over **HTTPS**, then click the icon to open the popup.

### Load in Microsoft Edge

1. Open `edge://extensions`
2. Enable **Developer mode** (sidebar)
3. **Load unpacked** → same `.output/chrome-mv3` folder

## Tests

```bash
npm test
```

## Limitations

- **DKIM** tries a fixed list of common selectors (`google`, `default`, `selector1`, `selector2`, …); custom selectors may be missed.
- **Not included** (would need broader permissions or extra APIs): MTA-STS **HTTPS** policy fetch, HTTPS certificate checks, WHOIS.
- Resolution uses **public** DNS; split-horizon or unpublished records will not appear.

## Contributing & security

- [Contributing](CONTRIBUTING.md)
- [Security policy](SECURITY.md)

## Licence

This project is licensed under the [**PolyForm Noncommercial License 1.0.0**](https://polyformproject.org/licenses/noncommercial/1.0.0/); see [`LICENSE`](LICENSE).

In short: you may **use, study, modify, and share** the project for **noncommercial** purposes (including personal use and many non-profit / educational uses). **Commercial use**, including **selling** the software, offering it for a fee, or building **paid products or services** on top of it, **is not allowed** under this licence without separate permission from the copyright holder.
