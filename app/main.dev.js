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
  clipboard,
} from 'electron';
import Server from 'electron-rpc/server';
import { autoUpdater } from 'electron-updater';
import path from 'path';
import moment from 'moment';

const fs = require('fs');
const robot = require('robotjs');

const Config = require('electron-config');
const config = new Config();
const sessionConfig = new Config({ name: 'session_config' });

let clipboardWindow = null;
let cleanupWindow = null;

let tray = null;
let googleTimeout = null;
let googleInterval = null;
let googlePreviousValue = null;
let clipboardWatcher = null;
let historySentAlready = false;

let macros = {};
let macrosEnabled = true;

const log = require('electron-log');
const trayIcon =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACW0lEQVR42l2TyWvaQRTHR/ODQi8lqEhB7KEHD3pI0fZQGm8SevAs+Q+8eWpMKaVpLW0vYo6eSreLx9JCECGIkVIwKS49BNz3fd/3fkecjPYHw8y8ee8z3zfv/Qj94vE4qdVqZLFYiJbLJZnP5/cx27F/PhqNdrEns9mM0DObzbaa2+02ufkCgQB1ECOAzg+m02mt0Wj8hNNvBP8dDAZ3ACKTyURMg+kwmUwckEgkqFG8vv0MgR+YY6/XOwf0ZL3f8Xg81EYHB0SjUXq4ko/bL3HTAdZ3MagiG27/6HQ6BazvrW0km81yQCwWYwB6eFWv1w8Auuh2u48Ae9Xv9x248Rlsn9dKBKPRyAHJZHILUCgUniLQXyqVHg+Hw9cIdrRaLStsXxhArVZzQDqd3gLk83kKuCgWi5uAo/F4zAA7KpWKA1Kp1BYgl8utFEAJBZwgldNms3mEt/jKAEqlkgPgyAC0Cpd4oJUC2J+ghG8AcABg3QTI5fL/q8AVZDIZCvABtofeOEZZT9EXVqj5xgASiYQDIpHIJuAPOtMA5zPkbMPL/0CXvgTgGLYbBTKZjANCodBmH1xBtgENs9fpdGII/AWX2wC/RTk/MYBUKuUAl8u1MtJD5PkdN7/Dmra4gPdYdShSOkd/vGAAhULBAYIgkHK5LEbZ6HvsQ8UATofUGSWlgPeQX0Q3yoPBIEGVRDqdjgO8Xi/R6/UsDZrSIWpfhJJrjBR64BopPaxWq6RSqYjMZjPRaDQcQGvKfp5wOCyy2+3EYrHs+nw+g9vt3tdqtbeon9/vFzE/9oj/AOHffdTL+hwRAAAAAElFTkSuQmCC';

const server = new Server();
// const isWindows = process.platform === 'win32';
const isMac = process.platform === 'darwin';
const isLinux = process.platform === 'linux';

const fileFilters = [{ name: 'Backup', extensions: ['json'] }];

let previousClipboardValue = null;
// whole history (excluding current session)
let clipboardHistory = [];
// current session history
let sessionClipboardHistory = [];
// only new entries
let newClipboardHistory = null;

const NUMBERS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
const DATE_FORMAT = 'HH:mm DD-MM-YYYY';

const UPDATE_INTERVAL = 3 * 3600 * 1000;
const CLIPBOARD_WATCH_INTERVAL = 500;
const CLEANUP_THRESHOLD = 10000;

let openAtLogin = false;
let updateAvailable = false;
let updateInterval = null;

const clipboardWindowConfig = {
  show: false,
  width: 670,
  height: 550,
  frame: false,
  resizable: false,
  maximizable: false,
  fullscreenable: false,
  title: 'Clipboard',
  center: true,
  alwaysOnTop: true,
  skipTaskbar: true,
  vibrancy: 'appearance-based',
  visibleOnAllWorkspaces: true,
  webPreferences: {
    nodeIntegration: true,
  },
};

function logger() {
  log.transports.file.level = 'info';
  log.transports.file.format = '{h}:{i}:{s}:{ms} {text}';
  log.transports.file.maxSize = 3 * 1024 * 1024;
}

logger();

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  const p = path.join(__dirname, '..', 'app', 'node_modules');
  require('module').globalPaths.push(p);
}

const connectAutoUpdater = () => {
  autoUpdater.autoDownload = false;
  autoUpdater.logger = log;
  autoUpdater.on('error', e => log.error(`update error ${e.message}`));
  autoUpdater.on('update-available', () => {
    updateAvailable = true;
    autoUpdater.downloadUpdate();
  });
  autoUpdater.on('update-not-available', () => {
    updateAvailable = false;
  });
  autoUpdater.on('update-downloaded', () => {
    const dialogOpts = {
      type: 'info',
      buttons: ['Restart', 'Later'],
      title: 'Application Update',
      detail:
        'A new version has been downloaded.\nRestart the application to apply the updates.',
    };
    const response = dialog.showMessageBoxSync(null, dialogOpts);
    if (response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
};

const initCleanupWindow = () => {
  cleanupWindow = new BrowserWindow({
    show: false,
    width: 700,
    height: 320,
    resizable: isDebug,
    maximizable: isDebug,
    fullscreenable: isDebug,
    title: 'Cleanup',
    webPreferences: {
      nodeIntegration: true,
    },
  });
  cleanupWindow.loadURL(`file://${__dirname}/app.html#/cleanup`);
};

const openCleanupWindow = () => {
  cleanupWindow.show();
  cleanupWindow.focus();
  cleanupWindow.on('closed', initCleanupWindow);
};

if (!isDebug) {
  connectAutoUpdater();
}

const sendHistory = () => {
  if (newClipboardHistory && historySentAlready) {
    if (newClipboardHistory.length) {
      server.send('clipboard_history_new', newClipboardHistory);
      newClipboardHistory = [];
    } else {
      server.send('reset');
    }
  } else {
    server.send('clipboard_history', [
      ...sessionClipboardHistory,
      ...clipboardHistory,
    ]);
    historySentAlready = true;
    newClipboardHistory = null;
  }
};

const openWindow = () => {
  if (isMac) {
    app.dock.hide();
  }

  if (!isLinux) {
    const activeScreen = screen.getDisplayNearestPoint(
      screen.getCursorScreenPoint()
    );
    const activeScreenBounds = activeScreen.bounds;
    const nextWindowBounds = {
      x:
        activeScreenBounds.x +
        activeScreenBounds.width / 2 -
        clipboardWindowConfig.width / 2,
      y:
        activeScreenBounds.y +
        activeScreenBounds.height / 2 -
        clipboardWindowConfig.height / 2 +
        100,
      width: clipboardWindowConfig.width,
      height: clipboardWindowConfig.height,
    };
    clipboardWindow.setBounds(nextWindowBounds);
  }

  clipboardWindow.show();
  clipboardWindow.setAlwaysOnTop(true, 'floating', 100);
  // clipboardWindow.openDevTools();
  globalShortcut.unregisterAll();
  globalShortcut.register('Enter', () => server.send('get_current_value'));
  globalShortcut.register('Escape', handleEscape);
  NUMBERS.forEach(char => {
    globalShortcut.register(`CommandOrControl + ${char}`, () =>
      server.send('paste_nth', char)
    );
  });
  sendHistory();
  globalShortcut.register('Up', () => server.send('up'));
  globalShortcut.register('Shift + Up', () => server.send('up_10'));
  globalShortcut.register('Down', () => server.send('down'));
  globalShortcut.register('Shift + Down', () => server.send('down_10'));
  globalShortcut.register('Shift + Enter', () => server.send('enter'));
  globalShortcut.register('CommandOrControl + Backspace', () =>
    server.send('clear')
  );
  globalShortcut.registerAll(
    ['Delete', 'CommandOrControl + Shift + Backspace'],
    () => server.send('delete_current_value')
  );
  globalShortcut.register('Alt + Backspace', () => server.send('clear_last'));
  NUMBERS.forEach(number => {
    globalShortcut.register(`CommandOrControl + Alt + ${number}`, () =>
      server.send('get_current_value_macro', number)
    );
  });
  if (isMac) {
    globalShortcut.register('CommandOrControl + Shift + V', closeWindow);
  } else {
    setTimeout(
      () =>
        globalShortcut.register('CommandOrControl + Shift + V', closeWindow),
      500
    );
  }
};

const saveSessionHistory = () =>
  sessionConfig.set('clipboardHistory', sessionClipboardHistory);

const saveHistory = () => config.set('clipboardHistory', clipboardHistory);

const deleteFromHistory = ({ value, date }) => {
  mergeSessionHistory(false);
  clipboardHistory = clipboardHistory.filter(
    item => item.date !== date || item.value !== value
  );
  server.send('clipboard_history_replace', clipboardHistory);
  newClipboardHistory = [];
  saveHistory();
};

const mergeSessionHistory = (shouldSaveHistory = true) => {
  clipboardHistory = [...sessionClipboardHistory, ...clipboardHistory];
  sessionClipboardHistory = [];
  if (shouldSaveHistory) {
    saveHistory();
  }
  saveSessionHistory();
};

const paste = value => {
  clipboard.writeText(value);
  robot.keyTap('v', isMac ? 'command' : 'control');
};

const writeFromHistory = ({ value }) => {
  closeWindow();
  paste(value);
};

const writeFromMacro = number => {
  const macroValue = macros[number];
  if (macroValue) {
    if (isMac) {
      paste(macroValue);
    } else {
      // Ehh why
      setTimeout(() => paste(macroValue), 300);
    }
  }
};

const saveMacros = () => {
  config.set('macros', macros);
  createTray();
};

const registerMacro = ({ value, number }) => {
  macros[number] = value;
  saveMacros();
};

const registerInitShortcuts = () => {
  globalShortcut.register('CommandOrControl + Shift + V', openWindow);
  globalShortcut.register('CommandOrControl + G', searchInGoogle);
  globalShortcut.register('CommandOrControl + Alt + C', copyHexAtMousePosition);
  NUMBERS.forEach(number => {
    const numberMacro = macros[number];
    if (numberMacro && macrosEnabled) {
      globalShortcut.register(`CommandOrControl + Alt + ${number}`, () =>
        writeFromMacro(number)
      );
    }
  });
};

const handleEscape = () => {
  server.send('escape');
  closeWindow();
};

const closeWindow = () => {
  if (isMac) {
    app.hide();
  }
  globalShortcut.unregisterAll();
  if (!isMac) {
    clipboardWindow.minimize();
  }
  clipboardWindow.hide();
  setTimeout(registerInitShortcuts, 0);
};

const getLastClipboardValue = () => {
  if (sessionClipboardHistory.length) {
    return sessionClipboardHistory[0].value;
  }
  if (clipboardHistory.length) {
    return clipboardHistory[0].value;
  }
  return '';
};

const searchLastInGoogle = () => {
  closeWindow();
  googleTimeout = null;
  googleInterval = null;
  const lastValue = getLastClipboardValue();
  if (!lastValue) {
    return;
  }
  shell.openExternal(
    `https://www.google.com/search?q=${encodeURIComponent(lastValue)}`
  );
};

const searchInGoogle = () => {
  if (googleTimeout || googleInterval) {
    return;
  }

  // Interval to check if value in clipboard has changed.
  googlePreviousValue = getLastClipboardValue();
  googleInterval = setInterval(() => {
    if (googlePreviousValue !== getLastClipboardValue()) {
      clearTimeout(googleTimeout);
      clearInterval(googleInterval);
      searchLastInGoogle();
    }
  }, 50);

  // Copy to clipboard.
  // Clipboard watcher checks the value every 500ms.
  robot.keyTap('c', isMac ? 'command' : 'control');

  // Fallback if value in clipboard didn't change. Uses last element from clipboard.
  // Also removes googleInterval watcher.
  googleTimeout = setTimeout(() => {
    clearInterval(googleInterval);
    searchLastInGoogle();
  }, 650);
};

const copyHexAtMousePosition = () => {
  const position = robot.getMousePos();
  const color = `#${robot.getPixelColor(position.x, position.y)}`;
  clipboard.writeText(color);
};

const cleanupHistory = () => {
  const clipboardHistoryUnique = [];
  clipboardHistory.forEach((element, index) => {
    const nextElement = clipboardHistory[index + 1];
    if (
      !nextElement ||
      element.value !== nextElement.value ||
      element.date !== nextElement.date
    ) {
      clipboardHistoryUnique.push(element);
    }
  });
  clipboardHistory = clipboardHistoryUnique;
  newClipboardHistory = null;
  historySentAlready = false;
  saveHistory();
};

const createTray = () => {
  if (tray) {
    tray.destroy();
  }
  tray = new Tray(nativeImage.createFromDataURL(trayIcon));
  const sortedMacros = Object.keys(macros)
    .sort()
    .reduce((acc, c) => {
      acc[c] = macros[c];
      return acc;
    }, {});
  const updateItem = isMac
    ? []
    : [
        {
          label: 'Check updates',
          async click() {
            clearInterval(updateInterval);
            await autoUpdater.checkForUpdates();
            updateInterval = setInterval(
              () => autoUpdater.checkForUpdates(),
              UPDATE_INTERVAL
            );
            if (!updateAvailable) {
              dialog.showMessageBox({
                type: 'info',
                buttons: ['Close'],
                title: 'cp-clip',
                detail: `There are currently no updates available.\nYour version ${app.getVersion()} is the latest one.`,
              });
            }
          },
        },
      ];
  let menuTemplate = [
    {
      label: 'Macros',
      type: 'submenu',
      submenu: [
        {
          label: 'Enabled',
          type: 'checkbox',
          checked: macrosEnabled,
          click() {
            macrosEnabled = !macrosEnabled;
            config.set('macrosEnabled', macrosEnabled);
            globalShortcut.unregisterAll();
            registerInitShortcuts();
          },
        },
        {
          label: 'Clear',
          click() {
            macros = {};
            saveMacros();
          },
        },
        {
          label: 'List',
          type: 'submenu',
          submenu: Object.entries(sortedMacros).map(([number, value]) => ({
            label: `${number}: ${value}`,
            enabled: false,
          })),
          enabled: !!Object.keys(sortedMacros).length,
        },
      ],
    },
    {
      type: 'separator',
    },
    {
      label: 'Backup',
      type: 'submenu',
      submenu: [
        {
          label: 'Create',
          async click() {
            const now = moment();
            const defaultPath = `cp-clip_${now.format(
              'YYYY-MM-DDTHH-mm-ss'
            )}.json`;
            const { filePath } = await dialog.showSaveDialog(null, {
              title: 'Create backup',
              defaultPath,
              filters: fileFilters,
            });
            if (filePath) {
              mergeSessionHistory();
              fs.writeFileSync(filePath, JSON.stringify(clipboardHistory));
            }
          },
        },
        {
          label: 'Restore',
          async click() {
            const { filePaths } = await dialog.showOpenDialog(null, {
              title: 'Open backup',
              filters: fileFilters,
            });
            if (filePaths && filePaths.length) {
              try {
                let result = JSON.parse(fs.readFileSync(filePaths[0]));
                // Support copied config files
                if (result.clipboardHistory) {
                  result = result.clipboardHistory;
                }
                const validHistory = result.filter(
                  item => item && item.value && item.date
                );
                if (!validHistory.length) {
                  return dialog.showErrorBox(
                    'Invalid backup',
                    'No valid history found in the backup.'
                  );
                }
                mergeSessionHistory();
                const {
                  response,
                  checkboxChecked,
                } = await dialog.showMessageBox(null, {
                  type: 'question',
                  buttons: ['Cancel', 'Yes, load the backup'],
                  defaultId: 2,
                  title: 'Confirm',
                  message: 'Do you want to load the backup?',
                  checkboxLabel: 'Override entire history',
                  detail: `Loaded the backup with ${validHistory.length} entries.\n
Your current history has ${clipboardHistory.length} entries.\n
Please confirm the load and choose if you want to override the current history.
If you do not want to override, your current history will get merged with the backup.\n
Merge will automatically remove all duplicates (entries with the same value and date).
`,
                  checkboxChecked: false,
                });
                if (response) {
                  if (checkboxChecked) {
                    clipboardHistory = validHistory;
                  } else {
                    const oldDateFormat = 'HH:mm MM-DD-YYYY';
                    clipboardHistory.push(...validHistory);
                    clipboardHistory = clipboardHistory.sort((a, b) => {
                      let aDate = moment(a.date, DATE_FORMAT);
                      let bDate = moment(b.date, DATE_FORMAT);
                      // Old date format support
                      if (!aDate.isValid()) {
                        aDate = moment(a.date, oldDateFormat);
                        a.date = aDate.format(DATE_FORMAT);
                      }
                      if (!bDate.isValid()) {
                        bDate = moment(b.date, oldDateFormat);
                        b.date = bDate.format(DATE_FORMAT);
                      }
                      return bDate.diff(aDate);
                    });
                  }
                  cleanupHistory();
                  dialog.showMessageBox(null, {
                    type: 'info',
                    title: 'Success',
                    message: `Successfully restored the backup.\n
Your new history has  ${clipboardHistory.length} entries.`,
                  });
                }
              } catch (e) {
                log.error(e);
                dialog.showErrorBox('Error', 'Invalid backup file.');
              }
            }
          },
        },
      ],
    },
    {
      label: 'Cleanup',
      async click() {
        return openCleanupWindow();
        const bigEntries = [];
        const remainingEntries = [];
        let duplicateCount = 0;
        const duplicateMap = {};
        mergeSessionHistory();
        clipboardHistory.forEach(item => {
          if (item.value.length > CLEANUP_THRESHOLD) {
            bigEntries.push(item);
          } else {
            if (!duplicateMap[item.value]) {
              remainingEntries.push(item);
              duplicateMap[item.value] = true;
            } else {
              duplicateCount++;
            }
          }
        });
        if (clipboardHistory.length === remainingEntries.length) {
          return dialog.showMessageBox({
            type: 'info',
            buttons: ['Close'],
            title: 'cp-clip',
            detail: `Nothing to cleanup.`,
          });
        }
        const { response, checkboxChecked } = await dialog.showMessageBox(
          null,
          {
            type: 'question',
            buttons: ['Cancel', 'Yes, perform cleanup'],
            defaultId: 2,
            title: 'Cleanup',
            message: 'Do you want to perform a cleanup?',
            checkboxLabel: 'Save deleted big entries to a file',
            detail: `Your search might slow down over time, especially if you often copy big entries (over ${CLEANUP_THRESHOLD} characters).\n
This operation will remove big entries and duplicated entries. In case of duplicates only the newest entries will be kept.\n  
Currently you have ${clipboardHistory.length} entries.
To be removed:
- ${bigEntries.length} big entries
- ${duplicateCount} duplicates
Alter the cleanup you will have ${remainingEntries.length} entries left.\n
If you save the deleted big entries to a file you can later restore them using backup functionality.
`,
            checkboxChecked: bigEntries.length,
          }
        );
        if (response) {
          if (checkboxChecked && bigEntries.length) {
            const now = moment();
            const defaultPath = `cp-clip_cleanup_${now.format(
              'YYYY-MM-DDTHH-mm-ss'
            )}.json`;
            const { filePath } = await dialog.showSaveDialog(null, {
              title: 'Save deleted big entries',
              defaultPath,
              filters: fileFilters,
            });
            if (filePath) {
              fs.writeFileSync(filePath, JSON.stringify(bigEntries));
            }
          }
          clipboardHistory = remainingEntries;
          cleanupHistory();
          dialog.showMessageBox(null, {
            type: 'info',
            title: 'Success',
            message: `Successfully removed ${bigEntries.length +
              duplicateCount} entries.\n
Your new history has  ${clipboardHistory.length} entries.`,
          });
        }
      },
    },
    {
      type: 'separator',
    },
    ...updateItem,
    {
      label: 'GitHub',
      click() {
        shell.openExternal('https://github.com/aklein13/cp-clip');
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
        app.setLoginItemSettings({
          ...app.getLoginItemSettings(),
          openAtLogin,
        });
      },
    });
  }
  const contextMenu = Menu.buildFromTemplate(menuTemplate);
  tray.setToolTip('cp-clip');
  tray.setContextMenu(contextMenu);
};

app.on('ready', async () => {
  clipboardWindow = new BrowserWindow(clipboardWindowConfig);
  clipboardWindow.loadURL(`file://${__dirname}/app.html#/settings`);
  macros = config.get('macros') || {};
  macrosEnabled = config.get('macrosEnabled', true);

  const previousClipboardHistory = config.get('clipboardHistory');
  const previousSessionHistory = sessionConfig.get('clipboardHistory');
  if (previousClipboardHistory && previousClipboardHistory.length) {
    clipboardHistory = previousClipboardHistory;
  }
  if (previousSessionHistory && previousSessionHistory.length) {
    sessionClipboardHistory = previousSessionHistory;
    mergeSessionHistory(false);
  }
  cleanupHistory();

  previousClipboardValue = clipboard.readText();

  if (previousClipboardValue) {
    const now = moment();
    if (clipboardHistory.length) {
      if (clipboardHistory[0].value !== previousClipboardValue) {
        sessionClipboardHistory.unshift({
          value: previousClipboardValue,
          date: now.format(DATE_FORMAT),
        });
        saveSessionHistory();
      }
    } else {
      sessionClipboardHistory.unshift({
        value: previousClipboardValue,
        date: now.format(DATE_FORMAT),
      });
      saveSessionHistory();
    }
  }

  clipboardWatcher = setInterval(() => {
    const newClipboardValue = clipboard.readText();
    if (newClipboardValue && newClipboardValue !== previousClipboardValue) {
      previousClipboardValue = newClipboardValue;
      const now = moment();
      const newEntry = {
        value: newClipboardValue,
        date: now.format(DATE_FORMAT),
      };
      if (!newClipboardHistory) {
        newClipboardHistory = [];
      }
      newClipboardHistory.unshift({
        ...newEntry,
        valueLower: newEntry.value.toLowerCase(),
      });
      sessionClipboardHistory.unshift(newEntry);
      saveSessionHistory();
    }
  }, CLIPBOARD_WATCH_INTERVAL);

  createTray();

  // Debug clipboard history
  // if (isDebug) {
  //   const now = moment();
  //   const nowString = now.format(DATE_FORMAT);
  //   clipboardHistory = NUMBERS.map((value) => ({value, date: nowString}));
  // }

  server.configure(clipboardWindow.webContents);
  registerInitShortcuts();
  robot.setKeyboardDelay(0);
  server.on('value_from_history', event => writeFromHistory(event.body));
  server.on('delete_value', event => deleteFromHistory(event.body));
  server.on('value_for_macro', event => registerMacro(event.body));
  initCleanupWindow();

  console.log('App is ready!');

  // Exclude Mac because I need paid $$$ developer account to sign the app...
  // Updates do not work for unsigned applications.
  if (!isDebug && !isMac) {
    await autoUpdater.checkForUpdates();
    updateInterval = setInterval(
      () => autoUpdater.checkForUpdates(),
      UPDATE_INTERVAL
    );
  }
});
