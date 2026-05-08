import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: ({ browser }) => ({
    name: 'JayQuery',
    short_name: 'JayQuery',
    description:
      'Evaluates email-authentication DNS (SPF, DMARC and DKIM with common selectors) for the active tab’s hostname via DNS-over-HTTPS, alongside MX and NS lookups, MTA-STS and TLS-RPT TXT records, DNSSEC signalling, and a Microsoft Entra OIDC tenant probe. Toolbar and popup show a pillar score out of ten with checklist-style breakdowns. No content scripts or permissive wildcard host permissions — only Cloudflare/Google public DoH and login.microsoftonline.com.',
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
