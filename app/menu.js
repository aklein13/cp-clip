// @flow
import { app, Menu, shell, BrowserWindow } from 'electron';

export default class MenuBuilder {
  mainWindow: BrowserWindow;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  buildMenu() {
    const template =
      process.platform === 'darwin'
        ? this.buildDarwinTemplate()
        : this.buildDefaultTemplate();
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
    return menu;
  }

  buildDarwinTemplate() {
    const subMenuAbout = {
      label: 'ListenMoe',
      submenu: [
        ...this.buildDefaultTemplate(),
        { type: 'separator' },
        { label: 'Hide cp-clip', accelerator: 'Command+H', selector: 'hide:' },
        {
          label: 'Hide Others',
          accelerator: 'Command+Shift+H',
          selector: 'hideOtherApplications:',
        },
        { label: 'Show All', selector: 'unhideAllApplications:' },
        { type: 'separator' },
        { label: 'Quit', accelerator: 'Command+Q', click: () => app.quit() },
      ],
    };
    return [subMenuAbout];
  }

  buildDefaultTemplate() {
    return [
      {
        label: '&About',
        submenu: [
          {
            label: 'GitHub',
            click() {
              shell.openExternal('https://github.com/aklein13/cp-clip/');
            },
          },
        ],
      },
    ];
  }
}
