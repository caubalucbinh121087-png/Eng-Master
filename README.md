# English Master v6.1 — Weekly Automatic Learning Content

This package keeps the existing English Master v6.0 app, Smart Dictionary, 2,000 base prompts, and browser progress store. It adds a scheduled GitHub Actions content pipeline.

## What happens every week

Every Monday at 02:17 UTC (09:17 Vietnam / 10:17 Singapore), GitHub Actions:

1. Uses the OpenAI Responses API with web search to consult public learning-framework/topic guidance from British Council LearnEnglish, VOA Learning English, and Cambridge English.
2. Generates **50 original bilingual prompts**:
   - 25 Daily Conversation
   - 25 English for Work (including practical IT/workplace contexts)
   - Each track: 8 A1, 9 A2, 8 B1
3. Runs deterministic checks for exact counts, required fields, sentence length/punctuation, topic variety, duplicate and near-duplicate English sentences.
4. Runs a second independent AI editorial review for grammar, naturalness, translation accuracy, CEFR fit, originality, and suitability.
5. Publishes only an approved batch by committing `weekly-content.js` and `content/weekly-lessons.json` to the default branch. GitHub Pages then serves the new lessons.

The generated wording is original. The named education sites are used for curriculum and topic inspiration, not copied exercises or audio scripts.

## One-time GitHub setup

### 1. Upload the package

Extract the ZIP and upload/overwrite all files and folders in the repository root, including the hidden `.github` folder. GitHub Desktop is a reliable way to upload the complete folder structure. Include:
- `index.html`
- `style.css`
- `app.js`
- `course-data.js`
- `weekly-content.js`
- `content/weekly-lessons.json`
- `scripts/generate_weekly_content.py`
- `.github/workflows/weekly-learning-content.yml`
- `README.md`

Keep the repository's existing `course-data.js` content from this package. The workflow reads it to avoid duplicating base-course sentences.

### 2. Create an OpenAI API key

Create an API key in the OpenAI API platform. API usage is billed separately from a ChatGPT subscription; check API billing/limits before enabling the workflow.

### 3. Add the key as a GitHub Secret

In the repository:
1. Open **Settings → Secrets and variables → Actions**.
2. Choose **New repository secret**.
3. Name it exactly `OPENAI_API_KEY`.
4. Paste the API key as the secret value and save.

Never put the key in `index.html`, `app.js`, `course-data.js`, `weekly-content.js`, a public JSON file, or a committed `.env` file.

### 4. Optional model setting

The workflow defaults to `gpt-6.2-astra`. If that model is not enabled for your API project, add a repository variable:
- **Settings → Secrets and variables → Actions → Variables → New repository variable**
- Name: `OPENAI_MODEL`
- Value: an API model available to your project.

### 5. Enable GitHub Actions write access

Open **Settings → Actions → General → Workflow permissions** and select **Read and write permissions**. Save.

GitHub Pages must be configured to deploy from the same default branch that the workflow updates.

### 6. Run the first test manually

1. Open the **Actions** tab.
2. Select **Weekly English Learning Content**.
3. Select **Run workflow**.
4. Open the run and inspect its logs.
5. If the batch passes quality checks, the workflow commits it automatically.
6. Refresh the GitHub Pages app. The new modules appear in Daily Conversation and English for Work.

The scheduled workflow runs on the repository's default branch. GitHub may delay scheduled jobs during high platform load. GitHub can also automatically disable scheduled workflows in public repositories after 60 days without repository activity; re-enable the workflow if that happens. If the default branch is protected, allow the GitHub Actions bot to push or adjust branch protection.

## Quality and duplicate protection

- A week can be published only once; rerunning the same ISO week skips it.
- New English sentences are compared against the full base course and all archived weekly content.
- Exact duplicates and very close matches are rejected.
- A failed generation, validation, review, or API call does not change the published content.
- Every accepted week is archived. The app loads all archived weekly modules.
- Six modules are added per week: Daily A1/A2/B1 and Work A1/A2/B1.

No automated grammar checker can guarantee perfection. The independent editorial pass plus deterministic validation reduces errors; review the first few generated batches in GitHub Actions before relying on unattended publishing.

## Progress preservation

The existing LocalStorage keys are unchanged:
- `englishMasterFullCourse_v1` — lesson progress
- `englishMasterVocabulary_v1` — saved vocabulary
- `emFullListens` — listening count

Base course IDs and item order are unchanged. Weekly modules use unique IDs such as `weekly-2026-w47-daily-a1`, so they do not overwrite existing progress. Progress remains local to the same browser/profile and does not sync across devices.

## Files added

- `.github/workflows/weekly-learning-content.yml` — weekly scheduler and publishing workflow
- `scripts/generate_weekly_content.py` — research, generation, validation, review, archive, and export
- `content/weekly-lessons.json` — append-only weekly archive
- `weekly-content.js` — browser-readable generated lesson data

## Security notes

- The API key is accessed only by the GitHub Actions runner through `secrets.OPENAI_API_KEY`.
- The workflow has repository content write permission only because it must commit approved content.
- The key is never written to generated files or printed in logs.
- Do not run untrusted pull-request code in a workflow that has access to the API key.
