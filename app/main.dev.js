/**
 * @flow
 */

import {
  app,
  BrowserWindow,
  dialog,
  globalShortcut,
  screen,
  Tray,
  Menu,
  shell,
  nativeImage,
} from 'electron';
import Server from 'electron-rpc/server';
import {autoUpdater} from 'electron-updater';
import path from 'path';
import moment from 'moment';

const clipboard = require('electron-clipboard-extended');
const robot = require('robotjs');

const Config = require('electron-config');
const config = new Config();

let mainWindow = null;
let settingsWindow = null;
let clipboardWindow = null;
let tray = null;

const log = require('electron-log');
const trayIcon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACW0lEQVR42l2TyWvaQRTHR/ODQi8lqEhB7KEHD3pI0fZQGm8SevAs+Q+8eWpMKaVpLW0vYo6eSreLx9JCECGIkVIwKS49BNz3fd/3fkecjPYHw8y8ee8z3zfv/Qj94vE4qdVqZLFYiJbLJZnP5/cx27F/PhqNdrEns9mM0DObzbaa2+02ufkCgQB1ECOAzg+m02mt0Wj8hNNvBP8dDAZ3ACKTyURMg+kwmUwckEgkqFG8vv0MgR+YY6/XOwf0ZL3f8Xg81EYHB0SjUXq4ko/bL3HTAdZ3MagiG27/6HQ6BazvrW0km81yQCwWYwB6eFWv1w8Auuh2u48Ae9Xv9x248Rlsn9dKBKPRyAHJZHILUCgUniLQXyqVHg+Hw9cIdrRaLStsXxhArVZzQDqd3gLk83kKuCgWi5uAo/F4zAA7KpWKA1Kp1BYgl8utFEAJBZwgldNms3mEt/jKAEqlkgPgyAC0Cpd4oJUC2J+ghG8AcABg3QTI5fL/q8AVZDIZCvABtofeOEZZT9EXVqj5xgASiYQDIpHIJuAPOtMA5zPkbMPL/0CXvgTgGLYbBTKZjANCodBmH1xBtgENs9fpdGII/AWX2wC/RTk/MYBUKuUAl8u1MtJD5PkdN7/Dmra4gPdYdShSOkd/vGAAhULBAYIgkHK5LEbZ6HvsQ8UATofUGSWlgPeQX0Q3yoPBIEGVRDqdjgO8Xi/R6/UsDZrSIWpfhJJrjBR64BopPaxWq6RSqYjMZjPRaDQcQGvKfp5wOCyy2+3EYrHs+nw+g9vt3tdqtbeon9/vFzE/9oj/AOHffdTL+hwRAAAAAElFTkSuQmCC';

const server = new Server();
// const isWindows = process.platform === 'win32';
const isMac = process.platform === 'darwin';

let clipboardHistory = [];
const ALPHABET = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
const SPECIAL_CHARS = ['~', '!', '"', '\'', '?', '.', ';', '[', ']', '\\', ',', '/', '@', '#', '$', '%', '|', '^', '&', '*', '(', ')', '-', '=', '{', '}', ':', '<', '>', '`', '_'];
const NUMBERS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

const clipboardWindowConfig = {
  show: false,
  width: 650,
  height: 500,
  frame: false,
  resizable: false,
  maximizable: false,
  fullscreenable: false,
  title: 'Clipboard',
  center: true,
  alwaysOnTop: true,
  // focusable: false,
  vibrancy: 'appearance-based',
  visibleOnAllWorkspaces: true,
};

function logger() {
  log.transports.file.level = 'info';
  log.transports.file.format = '{h}:{i}:{s}:{ms} {text}';
  log.transports.file.maxSize = 5 * 1024 * 1024;
}

logger();

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
  const p = path.join(__dirname, '..', 'app', 'node_modules');
  require('module').globalPaths.push(p);
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = [
    'REACT_DEVELOPER_TOOLS',
    'REDUX_DEVTOOLS',
  ];
  return Promise
    .all(extensions.map(name => installer.default(installer[name], forceDownload)))
    .catch(console.log);
};

const connectAutoUpdater = () => {
  log.info('Update check start');
  autoUpdater.autoDownload = false;
  autoUpdater.logger = log;
  autoUpdater.on('error', e => log.error(`update error ${e.message}`));
  autoUpdater.on('update-available', () => {
    log.info('Update is available');
    autoUpdater.downloadUpdate();
  });
  autoUpdater.on('checking-for-update', () => log.info('checking-for-update'));
  autoUpdater.on('update-not-available', () => log.info('update-not-available'));
  autoUpdater.on('download-progress', progressObj => {
    let msg = `Download speed: ${progressObj.bytesPerSecond}`;
    msg = `${msg} - Downloaded ${progressObj.percent}%`;
    msg = `${msg} (${progressObj.transferred}/${progressObj.total})`;
    log.info(msg);
  });
  autoUpdater.on('update-downloaded', () => {
    log.info('update-downloaded');
    const dialogOpts = {
      type: 'info',
      buttons: ['Restart', 'Later'],
      title: 'Application Update',
      detail: 'A new version has been downloaded. Restart the application to apply the updates.',
    };
    dialog.showMessageBox(dialogOpts, (response) => {
      if (response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });
};

if (!isDebug) {
  connectAutoUpdater();
}

app.on('window-all-closed', () => app.quit());

const closeApp = () => {
  config.set('windowBounds', mainWindow.getBounds());
  settingsWindow.on('closed', () => settingsWindow = null);
  settingsWindow.close();
  mainWindow.close();
  app.quit();
};

const openWindow = () => {
  const activeScreen = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
  if (isMac) {
    app.dock.hide();
  }

  const activeScreenBounds = activeScreen.bounds;

  const nextWindowBounds = {
    x: activeScreenBounds.x + activeScreenBounds.width / 2 - clipboardWindowConfig.width / 2,
    y: activeScreenBounds.y + activeScreenBounds.height / 2 - clipboardWindowConfig.height / 2 + 100,
    width: clipboardWindowConfig.width,
    height: clipboardWindowConfig.height,
  };
  clipboardWindow.setBounds(nextWindowBounds);
  clipboardWindow.showInactive();

  clipboardWindow.setAlwaysOnTop(true, 'floating', 30);
  clipboardWindow.setVisibleOnAllWorkspaces(true);
  clipboardWindow.setFullScreenable(false);
  // clipboardWindow.openDevTools();

  globalShortcut.register('Up', () => server.send('up'));
  globalShortcut.register('Shift + Up', () => server.send('up_10'));
  globalShortcut.register('Down', () => server.send('down'));
  globalShortcut.register('Shift + Down', () => server.send('down_10'));
  globalShortcut.register('Shift + Enter', () => server.send('enter'));
  globalShortcut.register('Enter', handleEnter);
  globalShortcut.register('Escape', closeWindow);
  globalShortcut.register('Backspace', () => server.send('backspace'));
  globalShortcut.register('CommandOrControl + Backspace', () => server.send('clear'));
  globalShortcut.register('Delete', () => server.send('clear'));
  globalShortcut.register('Alt + Backspace', () => server.send('clear_last'));
  globalShortcut.register('Space', () => server.send('space'));
  globalShortcut.register('Plus', () => server.send('plus'));
  server.send('clipboard_history', clipboardHistory);
  ALPHABET.forEach((char) => {
    globalShortcut.register(char, () => server.send(char));
    globalShortcut.register(`Shift + ${char}`, () => server.send(char.toUpperCase()));
  });
  SPECIAL_CHARS.forEach((char) => globalShortcut.register(char, () => server.send(char)));
  NUMBERS.forEach((char) => globalShortcut.register(char, () => server.send(char)));
  globalShortcut.unregister('CommandOrControl + Shift + V');
};

const handleEnter = () => {
  server.send('get_current_value');
  closeWindow();
};

const writeFromHistory = ({value}) => {
  clipboard.writeText(value);
  if (isMac) {
    robot.keyTap('v', 'command');
  } else {
    robot.keyTap('v', 'control');
  }
};

const closeWindow = () => {
  globalShortcut.unregisterAll();
  globalShortcut.register('CommandOrControl + Shift + V', openWindow);
  clipboardWindow.hide();
};

const createTray = () => {
  tray = new Tray(nativeImage.createFromDataURL(trayIcon));
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'GitHub',
      role: 'about',
      click() {
        shell.openExternal('https://github.com/aklein13/cp-clip/');
      },
    },
    {
      label: 'Quit',
      role: 'quit',
    },
  ]);
  tray.setToolTip('cp-clip');
  tray.setContextMenu(contextMenu);
};

app.on('ready', async () => {
  if (isDebug) {
    await installExtensions();
  }

  clipboardWindow = new BrowserWindow(clipboardWindowConfig);
  clipboardWindow.loadURL(`file://${__dirname}/app.html#/settings`);


  const previousClipboardHistory = config.get('clipboardHistory');
  if (previousClipboardHistory && previousClipboardHistory.length && previousClipboardHistory.length > 0) {
    // Health check
    const validHistory = previousClipboardHistory.filter((item) => item && item.value && item.date) || [];
    config.set('clipboardHistory', validHistory);
    clipboardHistory = validHistory;
  }

  clipboard
    .on('text-changed', () => {
      const now = moment();
      clipboardHistory.unshift({value: clipboard.readText(), date: now.format('HH:mm MM-DD-YYYY')});
      config.set('clipboardHistory', clipboardHistory);
    })
    .startWatching();

  createTray();

  // Debug clipboard history
  if (isDebug) {
    const now = moment();
    const nowString = now.format('HH:mm MM-DD-YYYY');
    clipboardHistory = ALPHABET.map((value) => ({value, date: nowString}));
  }


  server.configure(clipboardWindow.webContents);
  globalShortcut.register('CommandOrControl + Shift + V', openWindow);
  server.on('value_from_history', (event) => writeFromHistory(event.body));
  server.on('close_app', closeApp);

  console.log('App is ready!');

  if (!isDebug) {
    autoUpdater.checkForUpdates();
  }
});
