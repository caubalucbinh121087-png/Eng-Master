# English Master – Past Simple Listening & Dictation

A static web app that can be hosted directly on GitHub Pages.

## Features
- 10 Past Simple listening/dictation questions
- Text-to-speech playback with English voice selection
- Playback speed: 1.0x, 0.8x, 0.65x
- Word-level comparison: correct, wrong, missing and extra words
- Grammar explanations and hints
- Progress, accuracy, listening count and points saved in browser LocalStorage
- Responsive layout for desktop and mobile

## Run locally
Open `index.html` in Edge or Chrome. For best results, use GitHub Pages or a local web server.

## Publish on GitHub Pages
1. Create a new GitHub repository, e.g. `english-master`.
2. Upload `index.html`, `style.css`, `app.js`, and `README.md` to the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select branch **main** and folder **/(root)**, then Save.
6. Wait for GitHub Pages to publish. Your app URL will look like `https://YOUR-USERNAME.github.io/english-master/`.

## Audio note
This first version uses the browser's built-in SpeechSynthesis voice engine, not bundled MP3 files. It includes an English voice selector and a Test audio button. Available voices depend on the operating system and browser. If Edge reports voices but produces no sound, check Windows output device/volume and try another installed English voice. The dictation, checking and progress features work independently of audio.
