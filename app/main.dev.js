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

let clipboardWindow = null;
let tray = null;
let googleTimeout = null;
let googleInterval = null;
let googlePreviousValue = null;

const log = require('electron-log');
const trayIcon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACW0lEQVR42l2TyWvaQRTHR/ODQi8lqEhB7KEHD3pI0fZQGm8SevAs+Q+8eWpMKaVpLW0vYo6eSreLx9JCECGIkVIwKS49BNz3fd/3fkecjPYHw8y8ee8z3zfv/Qj94vE4qdVqZLFYiJbLJZnP5/cx27F/PhqNdrEns9mM0DObzbaa2+02ufkCgQB1ECOAzg+m02mt0Wj8hNNvBP8dDAZ3ACKTyURMg+kwmUwckEgkqFG8vv0MgR+YY6/XOwf0ZL3f8Xg81EYHB0SjUXq4ko/bL3HTAdZ3MagiG27/6HQ6BazvrW0km81yQCwWYwB6eFWv1w8Auuh2u48Ae9Xv9x248Rlsn9dKBKPRyAHJZHILUCgUniLQXyqVHg+Hw9cIdrRaLStsXxhArVZzQDqd3gLk83kKuCgWi5uAo/F4zAA7KpWKA1Kp1BYgl8utFEAJBZwgldNms3mEt/jKAEqlkgPgyAC0Cpd4oJUC2J+ghG8AcABg3QTI5fL/q8AVZDIZCvABtofeOEZZT9EXVqj5xgASiYQDIpHIJuAPOtMA5zPkbMPL/0CXvgTgGLYbBTKZjANCodBmH1xBtgENs9fpdGII/AWX2wC/RTk/MYBUKuUAl8u1MtJD5PkdN7/Dmra4gPdYdShSOkd/vGAAhULBAYIgkHK5LEbZ6HvsQ8UATofUGSWlgPeQX0Q3yoPBIEGVRDqdjgO8Xi/R6/UsDZrSIWpfhJJrjBR64BopPaxWq6RSqYjMZjPRaDQcQGvKfp5wOCyy2+3EYrHs+nw+g9vt3tdqtbeon9/vFzE/9oj/AOHffdTL+hwRAAAAAElFTkSuQmCC';

const server = new Server();
// const isWindows = process.platform === 'win32';
const isMac = process.platform === 'darwin';
const isLinux = process.platform === 'linux';

let clipboardHistory = [];
const ALPHABET = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
const SPECIAL_CHARS = ['~', '!', '"', '\'', '?', '.', ';', '[', ']', '\\', ',', '/', '@', '#', '$', '%', '|', '^', '&', '*', '(', ')', '-', '=', '{', '}', ':', '<', '>', '`', '_'];
const NUMBERS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const DATE_FORMAT = 'HH:mm DD-MM-YYYY';

const UPDATE_INTERVAL = 3 * 3600 * 1000;

let openAtLogin = false;
let updateAvailable = false;
let updateInterval = null;

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
    updateAvailable = true;
    log.info('Update is available');
    autoUpdater.downloadUpdate();
  });
  autoUpdater.on('update-not-available', () => {
    updateAvailable = false;
    log.info('update-not-available');
  });
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
      detail: 'A new version has been downloaded.\nRestart the application to apply the updates.',
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

const closeApp = () => {
  app.quit();
};

app.on('window-all-closed', closeApp);

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

const registerInitShortcuts = () => {
  globalShortcut.register('CommandOrControl + Shift + V', openWindow);
  globalShortcut.register('CommandOrControl + G', searchInGoogle);
};

const closeWindow = () => {
  globalShortcut.unregisterAll();
  clipboardWindow.hide();
  registerInitShortcuts();
};

const searchLastInGoogle = () => shell.openExternal(`https://www.google.com/search?q=${clipboardHistory[0].value}`);

const searchInGoogle = () => {
  if (googleTimeout || googleInterval) {
    return;
  }

  // Interval to check if value in clipboard has changed.
  googlePreviousValue = clipboardHistory.length ? clipboardHistory[0].value : '';
  googleInterval = setInterval(() => {
    if (clipboardHistory.length && googlePreviousValue !== clipboardHistory[0].value) {
      clearTimeout(googleTimeout);
      clearInterval(googleInterval);
      searchLastInGoogle();
      closeWindow();
      googleTimeout = null;
      googleInterval = null;
    }
  }, 50);

  // Copy to clipboard.
  // Clipboard watcher checks the value every 500ms.
  if (isMac) {
    robot.keyTap('c', 'command');
  } else {
    robot.keyTap('c', 'control');
  }

  // Fallback if value in clipboard didn't change. Uses last element from clipboard.
  // Also removes googleInterval watcher.
  googleTimeout = setTimeout(() => {
    clearInterval(googleInterval);
    if (clipboardHistory.length) {
      searchLastInGoogle();
    }
    closeWindow();
    googleTimeout = null;
    googleInterval = null;
  }, 550);
};

const createTray = () => {
  tray = new Tray(nativeImage.createFromDataURL(trayIcon));
  let menuTemplate = [
    {
      label: 'Check updates',
      async click() {
        clearInterval(updateInterval);
        // const result = await autoUpdater.checkForUpdates();
        updateInterval = setInterval(() => autoUpdater.checkForUpdates(), UPDATE_INTERVAL);
        if (!updateAvailable) {
          // const versionNumber = result && result.versionInfo ? result.versionInfo.version : '';
          dialog.showMessageBox({
            type: 'info',
            buttons: ['Close'],
            title: 'cp-clip',
            detail: `There are currently no updates available.`,
          });
        }
      },
    },
    {
      label: 'GitHub',
      role: 'about',
      click() {
        shell.openExternal('https://github.com/aklein13/cp-clip/');
      },
    },
    {
      type: 'separator',
    },
    {
      label: 'Quit',
      role: 'quit',
    },
  ];
  if (!isLinux) {
    openAtLogin = app.getLoginItemSettings().openAtLogin;
    menuTemplate.unshift({
        label: 'Autostart',
        type: 'checkbox',
        checked: openAtLogin,
        click() {
          openAtLogin = !openAtLogin;
          app.setLoginItemSettings({...app.getLoginItemSettings(), openAtLogin});
        },
      },
      {
        type: 'separator',
      },
    );
  }
  const contextMenu = Menu.buildFromTemplate(menuTemplate);
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
      clipboardHistory.unshift({value: clipboard.readText(), date: now.format(DATE_FORMAT)});
      config.set('clipboardHistory', clipboardHistory);
    })
    .startWatching();

  createTray();

  // Debug clipboard history
  if (isDebug) {
    const now = moment();
    const nowString = now.format(DATE_FORMAT);
    clipboardHistory = ALPHABET.map((value) => ({value, date: nowString}));
  }

  server.configure(clipboardWindow.webContents);
  registerInitShortcuts();
  server.on('value_from_history', (event) => writeFromHistory(event.body));

  console.log('App is ready!');

  if (!isDebug) {
    await autoUpdater.checkForUpdates();
    updateInterval = setInterval(() => autoUpdater.checkForUpdates(), UPDATE_INTERVAL);
  }
});
