# Drishti Browser (दृष्टि)

A minimal tabbed web browser built on Electron (Chromium + Node.js).

```bash
npm install
npm start
```

Shortcuts: Ctrl/Cmd+T new tab, +W close tab, +L address bar, +R reload/stop, Alt+Left/Right back/forward, Ctrl/Cmd+Alt+I developer tools.

Typing in the address bar opens a URL if it looks like one, otherwise searches. The default search is DuckDuckGo; to use your own Drishti search engine:

```bash
DRISHTI_SEARCH="http://localhost:3000/search?q=" npm start      # macOS/Linux
set DRISHTI_SEARCH=http://localhost:3000/search?q= && npm start  # Windows cmd
```

Tabs are sandboxed with no Node access. Not included yet: bookmarks, history, downloads UI, settings, extensions, private mode.
