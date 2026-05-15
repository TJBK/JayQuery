import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: ({ browser }) => ({
    name: 'JayQuery',
    short_name: 'JayQuery',
    description:
      'DNS checks for the active site: SPF, DMARC, DKIM via DoH; pillar scores & checklist in toolbar/popup.',
    homepage_url: 'https://github.com/LukeSteward/JayQuery',
    permissions: ['storage', 'tabs'],
    /** DoH plus Entra OIDC only (no catch-all HTTPS patterns). Tabs permission exposes Tab.url for the toolbar badge and popup. */
    host_permissions: [
      'https://cloudflare-dns.com/*',
      'https://dns.google/*',
      'https://login.microsoftonline.com/*',
    ],
    /**
     * Firefox 140+ built-in data consent (required for new extensions from 2025-11-03).
     * Hostnames from the active tab are used for checks; DNS queries go to whichever public
     * DoH resolver the user configures (they are not sent to the extension author).
     *
     * @see https://extensionworkshop.com/documentation/develop/firefox-builtin-data-consent/
     */
    ...(browser === 'firefox'
      ? {
          browser_specific_settings: {
            gecko: {
              strict_min_version: '140.0',
              data_collection_permissions: {
                required: ['browsingActivity'],
              },
            },
          },
        }
      : {}),
  }),
});
