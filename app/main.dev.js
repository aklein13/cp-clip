/* flowtype-errors/show-errors: 0 */

/**
 * @flow
 */

import {app, BrowserWindow, dialog, globalShortcut} from 'electron';
import MenuBuilder from './menu';
import Server from 'electron-rpc/server';
import {autoUpdater} from 'electron-updater';
import path from 'path';

const clipboard = require('electron-clipboard-extended');
const robot = require('robotjs');

const Config = require('electron-config');
const config = new Config();

let mainWindow = null;
let settingsWindow = null;
let clipboardWindow = null;

const log = require('electron-log');

const server = new Server();
const isWindows = process.platform === 'win32';
const isMac = process.platform === 'darwin';

const clipboardHistory = [];

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
  // connectAutoUpdater();
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
  // console.log(clipboardHistory);
  if (!isWindows) {
    app.dock.hide();
  }

  clipboardWindow.showInactive();

  // clipboardWindow.focus();

  clipboardWindow.setAlwaysOnTop(true, 'floating');
  clipboardWindow.setVisibleOnAllWorkspaces(true);
  clipboardWindow.setFullScreenable(false);
  // clipboardWindow.openDevTools();
  globalShortcut.register('Up', () => server.send('up'));
  globalShortcut.register('Down', () => server.send('down'));
  globalShortcut.register('Enter', handleEnter);
  globalShortcut.register('Escape', closeWindow);
  server.send('clipboard_history', clipboardHistory);
};

const handleEnter = () => {
  server.send('get_current_value');
  closeWindow();
};

const writeFromHistory = (value) => {
  console.log('write?', value);
  clipboard.writeText(value);
  if (isMac) {
    robot.keyTap('v', 'command');
  }
  else {
    robot.keyTap('v', 'control');
  }
};

const closeWindow = () => {
  globalShortcut.unregister('Up');
  globalShortcut.unregister('Down');
  globalShortcut.unregister('Enter');
  globalShortcut.unregister('Escape');
  clipboardWindow.hide();
};

app.on('ready', async () => {
  if (isDebug) {
    await installExtensions();
  }

  let mainWindowConfig = {
    show: false,
    width: 100,
    height: 100,
    frame: false,
  };

  clipboardWindow = new BrowserWindow({
    show: false,
    width: 600,
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
  });
  clipboardWindow.loadURL(`file://${__dirname}/app.html#/settings`);

  clipboard
    .on('text-changed', () => {
      clipboardHistory.unshift(clipboard.readText());
      console.log('UPDATE');
      console.log(clipboardHistory);
    })
    .startWatching();

  mainWindow = new BrowserWindow(mainWindowConfig);

  server.configure(clipboardWindow.webContents);
  globalShortcut.register('CommandOrControl + Shift + V', openWindow);
  server.on('value_from_history', (event) => writeFromHistory(event.body));
  server.on('color_change', (event) => server.send('color_changed', event.body));
  server.on('logged_out', () => server.send('user_logged_out'));
  server.on('copy_song_info', (event) => clipboard.writeText(event.body));
  server.on('close_app', closeApp);


  mainWindow.loadURL(`file://${__dirname}/app.html`);

  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (!isDebug) {
      // autoUpdater.checkForUpdates();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (settingsWindow) {
      settingsWindow.on('closed', () => settingsWindow = null);
      settingsWindow.close();
    }
    app.quit();
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu(server);

  console.log('App is ready!');
});
