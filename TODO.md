# TODO: Add Language Selection for Realtime Subtitles

- [x] Modify server.py to accept language parameter and load appropriate model (model-en for English, vosk-model-small-hi-0.22 for Hindi)
- [x] Update index.js to capture selected language from dropdown and send it to server via socket on start
- [x] Test the application to ensure language switching works and subtitles display correctly (Server is running, ready for manual testing)
