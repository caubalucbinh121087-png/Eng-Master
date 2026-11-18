# English Master – Full Course (GitHub Pages)

A static English-learning web app. No build tools or backend are required.

## Included learning content

### Grammar: all 12 English tenses
Each tense contains:
- Vietnamese explanation and key structure
- Common time expressions
- 5 bilingual listening/dictation prompts
- English audio playback using browser Speech Synthesis
- Word-by-word answer comparison and grammar feedback

### Daily English conversation: 30 topics
Topics include greetings, introductions, daily routines, family, ordering food, restaurants, shopping, directions, transport, hotels, airports, travel, weather, hobbies, weekend plans, phone calls, small talk, opinions, agreeing/disagreeing, apologies, meetings, presentations, work email, office communication, IT support, networking, problem solving, scheduling, health, and emergencies.

Each topic includes bilingual listening/dictation practice.

## App features
- Vietnamese prompt shown before the learner listens and types in English
- English voice selection and playback speed controls
- Hints, answer checking, missing/wrong/extra word highlighting
- Grammar explanations
- Course and lesson navigation
- Progress dashboard, points and accuracy
- Progress stored in browser LocalStorage
- Responsive desktop and mobile layout

## Publish to GitHub Pages
1. Download and extract this ZIP.
2. Open your existing GitHub repository.
3. Upload and overwrite `index.html`, `style.css`, `app.js`, and `README.md` in the repository root.
4. Commit the changes to the `main` branch.
5. Ensure **Settings → Pages → Deploy from a branch → main → /(root)** is selected.
6. Open your GitHub Pages URL and press **Ctrl + F5** to refresh cached files.

## Audio note
This version uses the browser/operating system's available English Speech Synthesis voices. Available voices and audio quality depend on the user's device and browser. It does not bundle professionally recorded MP3 files.

## Progress and storage
Progress is saved in LocalStorage in the current browser profile. It does not automatically sync across devices or browsers. Clearing browser site data can remove saved progress.
