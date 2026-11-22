# English Master v7.0 — Safe UI Restore Patch

This patch is intentionally limited to:
- `index.html`
- `style.css`
- `app.js`

**Do not replace or delete** these existing repository files:
- `course-data.js` (contains the existing base learning content)
- `weekly-content.js` (published weekly lessons)
- `.github/workflows/weekly-learning-content.yml`
- `scripts/generate_weekly_content.py`
- `content/weekly-lessons.json`

## Install
1. Make a backup/branch of the current GitHub repository first.
2. Extract this ZIP.
3. Copy the three files into the repository root and overwrite only files with the same names.
4. Commit and push.
5. Wait for GitHub Pages deployment, then hard-refresh with Ctrl+F5.

## Data compatibility
The app reads `window.ENGLISH_MASTER_DATA` from the existing `course-data.js` and `window.ENGLISH_MASTER_WEEKLY` from `weekly-content.js`. It does not regenerate, overwrite, or delete either dataset.
It preserves these browser LocalStorage keys:
- `englishMasterFullCourse_v1`
- `englishMasterVocabulary_v1`
- `emFullListens`

## Important
This is a UI/application restoration patch based on the public repository's current data schema and the screenshot supplied in the conversation. It is not a replacement archive of the complete repository. Keep the existing Gemini workflow and API secret unchanged.
