# English Master v8.0 — Full Learning Upgrade

This release upgrades the existing English Master repository without replacing the original course library.

## Included

- Existing Grammar, Daily Conversation and English for Work courses are retained.
- Today's Learning: six activities planned for 30 minutes, with Speaking prioritized.
- Speaking Coach: browser speech recognition transcript, text comparison against a model sentence, speech synthesis model playback, and saved practice history.
- Listening: existing listen-and-dictation experience remains.
- Reading: short reading comprehension practice.
- Writing: guided writing practice with basic local checks and saved writing history.
- Smart Review: vocabulary review using spaced intervals (1, 3, 7, 14, 30 days).
- Skill Analytics: activity indicators based on locally available learning data.
- AI Learning Coach: optional Gemini-powered writing feedback through a Cloudflare Worker backend.

## Important capability notes

1. Speech recognition depends on browser support and microphone permission. Use HTTPS (GitHub Pages is HTTPS) and a recent Edge or Chrome browser. Speech-to-text comparison is not clinical/acoustic pronunciation scoring.
2. Reading and writing modules include starter exercises. Add more content over time; the existing 2,000 sentence corpus is preserved.
3. Skill Analytics are practice-activity indicators, not a standardized CEFR assessment.
4. AI Coach requires deployment of the Cloudflare Worker and a Gemini API key. The Gemini key must never be placed in this public repository or in browser JavaScript.
5. Browser LocalStorage is device/browser-specific. Use the app's existing progress keys as before; the new modules store data under `englishMasterLearning_v2`.

## Upload to GitHub Pages

1. Back up the current repository and export important browser progress if needed.
2. Extract the ZIP.
3. Upload the contents of `Eng-Master-main/` into the root of the existing `Eng-Master` repository, preserving folders. Allow GitHub to replace files with the same names.
4. Ensure the hidden `.github/workflows/weekly-learning-content.yml` folder/file is included. GitHub Desktop is recommended for hidden folders.
5. Commit and wait for GitHub Pages to deploy.
6. Open the site and hard-refresh with Ctrl+F5.

Do not delete `course-data.js`, `weekly-content.js`, `content/weekly-lessons.json`, or the existing `.github` workflow.

## Enable AI Learning Coach (Cloudflare Worker)

The app works without AI. To enable AI feedback:

1. Create/sign in to a Cloudflare account and install Wrangler (`npm install -g wrangler`).
2. Open a terminal in `backend/cloudflare-worker`.
3. Run `wrangler login`.
4. Add your Gemini key as a secret: `wrangler secret put GEMINI_API_KEY`.
5. Deploy: `wrangler deploy`.
6. Copy the Worker URL, for example `https://english-master-ai.<your-subdomain>.workers.dev`.
7. Open English Master → AI Learning Coach, paste the Worker URL, and save/use it.

Optional: set a different supported Gemini model in `wrangler.toml` via `GEMINI_MODEL`. Model availability and free-tier quotas can change. The default model may need adjustment based on your Google AI Studio project's current model access.

### Security

- Never commit the Gemini key.
- Restrict Worker access to your own site origin before using this publicly and configure Cloudflare rate limiting / abuse protection.
- Avoid sending confidential company information or personal sensitive information to the AI endpoint.
- Gemini API usage is subject to Google's current terms, model availability and quota.

## Data preservation

The following original LocalStorage keys are unchanged:
- `englishMasterFullCourse_v1`
- `englishMasterVocabulary_v1`
- `emFullListens`

New module data is isolated in:
- `englishMasterLearning_v2`
- `englishMasterAIEndpoint_v1` (Worker URL only; no API key)

## Release contents

- `index.html`, `app.js`, `style.css`
- `learning-upgrade.js`
- Original course and weekly content files
- `backend/cloudflare-worker/` (optional AI backend)
- Existing weekly GitHub Actions workflow and generator
