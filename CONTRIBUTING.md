# Contributing to JayQuery

Thanks for your interest in improving JayQuery. This document describes how to work in this repo and what we expect in pull requests.

## Before you start

- The project is licensed under the [PolyForm Noncommercial License 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0/). By contributing, you agree your contributions are licensed under the same terms. **Commercial use** beyond what that license allows requires separate permission from the copyright holder.
- For **security issues**, see [SECURITY.md](SECURITY.md) instead of filing a public issue.

## Development setup

- **Node.js 24+** and npm
- Clone the repository and install dependencies:

  ```bash
  npm install
  ```

- **Watch / dev build:** `npm run dev` — load the unpacked folder WXT prints (under `.output/`).
- **Production build:** `npm run build` — output in `.output/chrome-mv3/`.
- **Extension zip:** `npm run zip` — useful to match CI artifacts.

## Tests and checks

- Run the unit test suite: `npm test`
- Typecheck: `npm run compile`
- After changing dependencies, run `npm audit --omit=dev` and address issues where practical.

## SBOM files

If the repo tracks `sbom-cyclonedx-npm.json` and `sbom.spdx.json`, update both when you change `package.json` or `package-lock.json`. CI posts a reminder on PRs when dependency files change but SBOMs are not updated. Regenerate from the repo root (see the SBOM reminder workflow output or ask a maintainer).

## Pull requests

- Open PRs against **`main`**.
- Keep changes **focused** on a single concern when possible; unrelated refactors make review harder.
- Match existing **TypeScript style**, naming, and patterns.
- If your change affects user-visible behavior, privacy, or permissions, mention that in the PR description.

## Issues

- Use the [bug report](https://github.com/LukeSteward/JayQuery/issues/new?template=bug_report.yml) or [feature request](https://github.com/LukeSteward/JayQuery/issues/new?template=feature_request.yml) templates when they fit.

## Chrome Web Store and releases

Store listings and release tagging are maintained by the project owners. Community PRs that improve the open-source codebase are still welcome; publishing to the store is a separate step.
