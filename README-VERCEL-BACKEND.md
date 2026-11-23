# English Master – Vercel AI Coach Backend

This patch adds a Vercel Serverless Function at `/api/coach` and updates the AI Coach UI to call the full API URL.

## Files
- `api/coach.js` — server-side Gemini proxy. The Gemini API key is read only from `process.env.GEMINI_API_KEY`.
- `learning-upgrade.js` — updated AI Coach endpoint label and request URL behavior.

## Vercel setup
1. In the existing Vercel project connected to `caubalucbinh121087-png/Eng-Master`, open **Settings → Environment Variables**.
2. Add `GEMINI_API_KEY` with the Gemini API key value. Select Production (and Preview if needed). Do not put the key in GitHub files.
3. Add `GEMINI_MODEL` with value `gemini-3.8-flash` (optional; this is the default in the function).
4. Commit/push the added `api/coach.js` and replaced `learning-upgrade.js` to the `main` branch. Vercel will deploy automatically.
5. The API URL is `https://<your-vercel-domain>/api/coach`.
6. In English Master, enter that full URL in the AI Coach endpoint field.

## Test
Open `https://<your-vercel-domain>/api/coach` in a browser. It should return:
`{"service":"English Master AI Coach","status":"ok"}`

## Important
- Vercel Hobby is intended for personal, non-commercial use and has usage limits. Check current limits before sharing widely.
- The API key is kept server-side, but a public endpoint can still be called by anyone. CORS is not authentication and does not prevent scripts/curl. Monitor Vercel and Gemini usage; add rate limiting or a challenge if abuse occurs.
- Gemini Free Tier quotas and availability vary by model, region, and account. No free quota is unlimited or guaranteed.
