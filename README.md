# GitHub Agent

A static, bilingual UI prototype for a coding assistant, imported from the Google Drive archive `GitHub Agent`.

## Run

Open `index.html` in a browser, or serve this folder with any static web server. The landing page links to all 12 screens under `stitch_myassistant_ai_coding_companion/`.

The UI uses inline JavaScript and loads Tailwind CSS, icons, and fonts from public CDNs. No build step or backend is included. AI calls, GitHub operations, and several settings actions are mock interactions only.

## Hosting

The static site is published at <https://gase99.github.io/github-agent/> from the root of the `main` branch. New commits to `main` are published through GitHub Pages.

## Security

Credential-shaped values embedded in the original settings mockups were removed before import. Do not put real API keys or access tokens in these static pages; browser-side secrets are visible to visitors.
