'use strict';
const { app, BrowserWindow, WebContentsView, ipcMain, Menu } = require('electron');
const path = require('path');

// Point DRISHTI_SEARCH at your Drishti search engine, e.g. http://localhost:3000/search?q=
const SEARCH = process.env.DRISHTI_SEARCH || 'https://duckduckgo.com/?q=';
const CHROME_H = 84; // height of the tab strip + toolbar in ui/index.html
const HOME = 'file://' + path.join(__dirname, 'ui', 'home.html') + '?s=' + encodeURIComponent(SEARCH);

let win, tabs = [], active = null, nextId = 1;

// Turn whatever was typed into a URL: full URL, bare domain, or a search query.
function toUrl(input = '') {
  input = input.trim();
  if (!input) return HOME;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(input)) return input;
  if (!/\s/.test(input) && /^(localhost|\d{1,3}(\.\d{1,3}){3}|[\w-]+(\.[\w-]+)+)(:\d+)?([/?#].*)?$/i.test(input))
    return (/^(localhost|\d)/i.test(input) ? 'http://' : 'https://') + input;
  return SEARCH + encodeURIComponent(input);
}

const current = () => tabs.find((t) => t.id === active);

function layout() {
  if (!win) return;
  const [w, h] = win.getContentSize();
  tabs.forEach((t) => t.view.setBounds({ x: 0, y: CHROME_H, width: w, height: Math.max(0, h - CHROME_H) }));
}

function push() {
  if (!win || win.isDestroyed()) return;
  win.webContents.send('tabs', tabs.map((t) => {
    const wc = t.view.webContents, url = wc.getURL();
    return {
      id: t.id, title: wc.getTitle() || 'New tab', loading: wc.isLoading(),
      url: url.startsWith('file:') && url.includes('home.html') ? '' : url,
      back: wc.navigationHistory.canGoBack(), forward: wc.navigationHistory.canGoForward(),
    };
  }), active);
}

function select(id) {
  active = id;
  tabs.forEach((t) => t.view.setVisible(t.id === id));
  layout(); push();
}

function newTab(url) {
  const view = new WebContentsView({ webPreferences: { sandbox: true, contextIsolation: true } });
  const t = { id: nextId++, view }, wc = view.webContents;
  tabs.push(t);
  win.contentView.addChildView(view);
  wc.setWindowOpenHandler(({ url }) => { newTab(url); return { action: 'deny' }; });
  ['page-title-updated', 'did-navigate', 'did-navigate-in-page', 'did-start-loading', 'did-stop-loading']
    .forEach((e) => wc.on(e, push));
  wc.loadURL(toUrl(url));
  select(t.id);
}

function closeTab(id) {
  const i = tabs.findIndex((t) => t.id === id);
  if (i < 0) return;
  const [t] = tabs.splice(i, 1);
  win.contentView.removeChildView(t.view);
  t.view.webContents.close();
  if (!tabs.length) return newTab();
  if (id === active) select(tabs[Math.min(i, tabs.length - 1)].id); else push();
}

function command(cmd, arg) {
  const t = current(), wc = t && t.view.webContents;
  switch (cmd) {
    case 'new': return newTab();
    case 'close': return closeTab(arg ?? active);
    case 'select': return select(arg);
    case 'go': return wc && wc.loadURL(toUrl(arg));
    case 'back': return wc && wc.navigationHistory.canGoBack() && wc.navigationHistory.goBack();
    case 'forward': return wc && wc.navigationHistory.canGoForward() && wc.navigationHistory.goForward();
    case 'reload': return wc && (wc.isLoading() ? wc.stop() : wc.reload());
    case 'devtools': return wc && wc.toggleDevTools();
    case 'focus-url': return win.webContents.send('focus-url');
  }
}

app.whenReady().then(() => {
  win = new BrowserWindow({
    width: 1280, height: 800, title: 'Drishti', backgroundColor: '#e9ecf5',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, sandbox: true },
  });
  win.loadFile(path.join(__dirname, 'ui', 'index.html'));
  win.on('resize', layout);
  win.webContents.once('did-finish-load', () => newTab());

  ipcMain.on('cmd', (_e, cmd, arg) => command(cmd, arg));
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'Drishti', submenu: [{ role: 'quit' }] },
    { role: 'editMenu' },
    { label: 'Browse', submenu: [
      { label: 'New Tab', accelerator: 'CmdOrCtrl+T', click: () => command('new') },
      { label: 'Close Tab', accelerator: 'CmdOrCtrl+W', click: () => command('close') },
      { label: 'Address Bar', accelerator: 'CmdOrCtrl+L', click: () => command('focus-url') },
      { label: 'Reload', accelerator: 'CmdOrCtrl+R', click: () => command('reload') },
      { label: 'Back', accelerator: 'Alt+Left', click: () => command('back') },
      { label: 'Forward', accelerator: 'Alt+Right', click: () => command('forward') },
      { label: 'Developer Tools', accelerator: 'CmdOrCtrl+Alt+I', click: () => command('devtools') },
    ] },
  ]));
});

app.on('window-all-closed', () => app.quit());
