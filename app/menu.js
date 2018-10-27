// @flow
import {app, Menu, shell, BrowserWindow} from 'electron';

export default class MenuBuilder {
  mainWindow: BrowserWindow;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  buildMenu(server) {
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
      this.mainWindow.openDevTools();
    }
    const template = process.platform === 'darwin'
      ? this.buildDarwinTemplate()
      : this.buildDefaultTemplate();
    this.mainWindow.webContents.on('context-menu', () => {
      Menu
        .buildFromTemplate([{
          label: 'Copy song info',
          click: () => server.send('request_song_info'),
        }])
        .popup(this.mainWindow);
    });
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
    return menu;
  }

  buildDarwinTemplate() {
    const subMenuAbout = {
      label: 'ListenMoe',
      submenu: [
        {
          label: 'ListenMoe Website', click() {
            shell.openExternal('https://listen.moe/');
          }
        },
        {
          label: 'GitHub', click() {
            shell.openExternal('https://github.com/aklein13/listen-moe-electron/');
          }
        },
        {type: 'separator'},
        {label: 'Hide ListenMoe', accelerator: 'Command+H', selector: 'hide:'},
        {label: 'Hide Others', accelerator: 'Command+Shift+H', selector: 'hideOtherApplications:'},
        {label: 'Show All', selector: 'unhideAllApplications:'},
        {type: 'separator'},
        {label: 'Quit', accelerator: 'Command+Q', click: () => app.quit()},
      ],
    };
    return [subMenuAbout];
  }

  buildDefaultTemplate() {
    return [{
      label: '&About',
      submenu: [
        {
          label: 'ListenMoe', click() {
            shell.openExternal('https://listen.moe/');
          }
        },
        {
          label: 'GitHub', click() {
            shell.openExternal('https://github.com/aklein13/listen-moe-electron/');
          }
        },
      ],
    },
    ];
  }
}
