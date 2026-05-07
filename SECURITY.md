# Security policy

## Supported versions

Security fixes are applied to the **latest release** published on the [Chrome Web Store](https://chromewebstore.google.com/detail/jayquery/jicgjligckkjmecbbakkbpfbagfdfdol) and to the **default branch** of this repository (`main`). Older store builds or tags are not guaranteed to receive backports.

## Reporting a vulnerability

Please **do not** open a public issue for undisclosed security problems.

1. **Preferred:** Use [GitHub private vulnerability reporting](https://github.com/LukeSteward/JayQuery/security/advisories/new) for this repository.
2. If that is unavailable, open a **draft** security advisory or contact the maintainers through a private channel they have published on their profile or project pages.

Include as much as you can: affected version or commit, reproduction steps, impact, and any suggested fix.

## What we consider in scope

Examples of reports we want to hear about:

- Issues that could **expose user data** beyond what the extension is designed to do (e.g. unexpected exfiltration of browsing data or stored settings).
- **Permission abuse** or **network misuse** (e.g. calls to hosts not covered by the declared `host_permissions`, or unexpected use of `tabs` / storage).
- **Integrity** of the distributed package (e.g. supply-chain or build concerns you believe affect published artifacts).

Out of scope for this project (by design or limitation):

- Findings that depend on **malicious extensions** already installed in the browser.
- **DNS spoofing** or **compromised DoH resolvers** on the client network (the extension trusts configured DoH endpoints similarly to other DNS clients).
- Purely **informational** DNS or email-configuration results (SPF/DMARC/DKIM scores are assessments, not secrets).

## Disclosure

We aim to acknowledge valid reports promptly and to ship fixes through the normal extension update process. We appreciate responsible disclosure and credit researchers when publishing advisories, unless you prefer to remain anonymous.
