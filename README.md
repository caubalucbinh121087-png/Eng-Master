# English Master v6.2 — Gemini Free-Tier Weekly Learning Content

This package keeps the English Master v6.0 app, Smart Dictionary, existing base course data, and browser progress store. It replaces the OpenAI API content generator from v6.1 with the Google Gemini Developer API. No OpenAI API credit is required.

## What happens every week

Every Monday at 02:17 UTC (09:17 Vietnam / 10:17 Singapore), GitHub Actions:

1. Calls the Gemini Developer API using the configured model (default: `gemini-2.5-flash-lite`).
2. Generates **50 original bilingual prompts**:
   - 25 Daily Conversation
   - 25 English for Work (including practical IT/workplace contexts)
   - Within each track: 8 A1, 9 A2, 8 B1
3. Runs deterministic checks for exact counts, required fields, sentence length/punctuation, topic variety, and exact/near-duplicate English sentences against the base course and archive.
4. Runs a second Gemini editorial review for grammar, naturalness, translation accuracy, CEFR fit, originality, and suitability.
5. Publishes only an approved batch by committing `weekly-content.js`, `content/weekly-lessons.json`, and the cache-busted `index.html` to the default branch. GitHub Pages then serves the new lessons.

**Research limitation:** this free-tier workflow does not use live Google Search grounding or browse the British Council, VOA, or Cambridge sites during each run. Those resources remain curriculum inspiration references only. The generated wording is original and is not copied from their materials.

## One-time GitHub setup

### 1. Upload the package

Extract this ZIP and upload/overwrite the package files in the root of your existing `Eng-Master` repository. Preserve the folder structure, especially:

- `.github/workflows/weekly-learning-content.yml`
- `content/weekly-lessons.json`
- `scripts/generate_weekly_content.py`
- `index.html`, `app.js`, `course-data.js`, `weekly-content.js`, `style.css`

GitHub Desktop is recommended because it reliably includes the hidden `.github` folder. Do not rename `.github` or the workflow file.

### 2. Create a Gemini API key

1. Open [Google AI Studio API keys](https://aistudio.google.com/apikey).
2. Sign in with your Google account.
3. Create an API key for a project eligible for the Gemini API Free Tier.
4. Keep the key private. Do not paste it into app files or commit it to GitHub.

Free-tier availability, models, rate limits, and daily quotas depend on Google's current eligibility and project limits. This package defaults to `gemini-2.5-flash-lite`, which is listed with a free tier in Google's pricing documentation at the time this package was prepared. Google can change model availability and quotas. If the free quota is exhausted, the workflow stops without publishing partial content; it does not automatically switch to a paid tier.

Google's Free Tier terms state that submitted content may be used to improve its products. Do not include confidential company information or personal/sensitive data in generated prompts.

### 3. Add the API key as a GitHub Secret

In your repository:

1. Open **Settings → Secrets and variables → Actions**.
2. Select **New repository secret**.
3. Name it exactly `GEMINI_API_KEY`.
4. Paste your Google AI Studio API key as the value and save.

The workflow no longer reads `OPENAI_API_KEY`. You may delete the old `OPENAI_API_KEY` secret after confirming the Gemini workflow works; it is not used by this package.

### 4. Optional model setting

The default model is `gemini-2.5-flash-lite`. If Google changes availability or your project does not have access, you can set a repository variable:

- **Settings → Secrets and variables → Actions → Variables → New repository variable**
- Name: `GEMINI_MODEL`
- Value: a text-generation model that is currently available on your project's Gemini API Free Tier and supports structured JSON output.

Do not set a paid-only model if you want to stay on the free tier.

### 5. Enable GitHub Actions write access

Open **Settings → Actions → General → Workflow permissions** and select **Read and write permissions**. Save. GitHub Pages should deploy from the same default branch that the workflow updates.

### 6. Run the first test manually

1. Open the **Actions** tab.
2. Select **Weekly English Learning Content**.
3. Select **Run workflow** and confirm.
4. Open the run and inspect its logs.
5. If the generated batch passes validation and the editorial review, the workflow commits it automatically.
6. Refresh the GitHub Pages app (use `Ctrl + F5`). The new modules appear in Daily Conversation and English for Work.

The first run can fail if the API key is invalid, the model is unavailable to the project, or the free-tier quota/rate limit is exhausted. The error log will identify the HTTP response. A failed run does not publish partial content.

## Quality and duplicate protection

- A week can be published only once; rerunning the same ISO week skips it to prevent duplicates.
- New English sentences are compared against the base course and all archived weekly content.
- Exact duplicates and very close matches are rejected.
- A failed generation, validation, review, or API call does not change the published content.
- Every accepted week is archived. The app loads all archived weekly modules.
- Six modules are added per week: Daily A1/A2/B1 and Work A1/A2/B1.

No automated language review guarantees perfection. Inspect the first few weekly batches in GitHub Actions before relying on unattended publishing.

## Progress preservation

The app's existing LocalStorage keys remain unchanged:

- `englishMasterFullCourse_v1` — lesson progress
- `englishMasterVocabulary_v1` — saved vocabulary
- `emFullListens` — listening count

Base course IDs and item order are preserved from the v6.1 package. Weekly modules use unique IDs such as `weekly-2026-w47-daily-a1`, so they do not overwrite existing progress. Progress remains local to the same browser/profile and does not sync across devices.

## Files added or updated

- `.github/workflows/weekly-learning-content.yml` — weekly scheduler and publishing workflow
- `scripts/generate_weekly_content.py` — Gemini generation, validation, editorial review, archive, and export
- `content/weekly-lessons.json` — append-only weekly archive
- `weekly-content.js` — browser-readable generated lesson data

## Security and operational notes

- The Gemini API key is accessed only by the GitHub Actions runner through `secrets.GEMINI_API_KEY`.
- The key is never written to generated files or printed in logs.
- The workflow has repository content write permission only because it must commit approved content.
- Do not run untrusted pull-request code in a workflow that has access to the API key.
- GitHub may delay scheduled jobs during high platform load. Scheduled workflows in public repositories can be disabled after prolonged inactivity; re-enable them if needed.
