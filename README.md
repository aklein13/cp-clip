# cp-clip
A simple Electron clipboard manager.

![App](./docs/app.jpg)

Based on [electron-react-boilerplate](https://github.com/chentsulin/electron-react-boilerplate)

# Updates
The app supports automatic updates except for Mac.
Updates do not work on unsigned applications and Mac certificates are paid.

# Shortcuts
###### Type to search

- `Control/Command` + `Shift` + `V` = Open/close clipboard history window
- `Escape` = Close history window
- `Enter` = Paste selected entry from history
- `Arrow Up/Down` = Move 1 entry backwards/forwards
- `Control/Command` + [`1` - `9`] = Paste 1st - 9th element from history
- `Delete` or (`Control/Command` + `Shift` + `Backspace`) = Remove currently selected entry from history
- `Shift` + `Arrow Up/Down` = Move 10 entries backwards/forwards
- `Control/Command` + `Backspace` = Clear search
- `Alt` + `Backspace` = Clear last word in search
- `Shift` + `Enter` = Search for Enter press (new lines)
- `Control/Command` + `G` = Search selected (or last in clipboard) text in Google in default browser. Works everywhere.
- `Control/Command` + `Alt` + [`1` - `9`] = Macros - on open window - assign selected value to 1-9 macro. Use the shortcut again when the window is closed to paste saved macro. 
- `Control/Command` + `Alt` + `C` = Color picker - Copy hex color at cursor position

## Instructions
##### [Download](https://github.com/aklein13/cp-clip/releases/latest) latest release for your platform
### Windows
1. Download <i>cp-clip-setup-x.x.x.exe</i>
2. Install it
### macOS
Download <i>cp-clip-x.x.x.dmg</i> and follow [macOS guide](/docs/macOS.md).

Right now macOS version is built for Intel
chips, but it should work on M1 chip anyway. I will try to build M1 version in the future for better performance. 
#### Linux
##### The latest version does not work at the moment. The latest working version is 0.5.1.
1. Download https://github.com/aklein13/cp-clip/releases/download/v0.5.1/cp-clip-0.5.1.AppImage
2. Right click on it
3. Go to Properties and then Permissions
4. Check <i>Allow executing file as program</i>
5. Run it

Or you can just `chmod +x` it.

If after going through above steps and running the application nothing happens, 
you most likely need to install `libgtk2.0-0` package manually.
In order to do that open your terminal and run `sudo apt-get install libgtk2.0-0`

## Dev Instruction:
##### After downloading repository run [Yarn](https://yarnpkg.com/)
You need to install `node_modules` in both root directory and `./app` directory.
```bash
yarn
cd app && yarn && cd ..
```
##### Then you can use following commands:
- Run in dev environment (from root directory)
```bash
yarn dev
```
- Package release for your current platform
```bash
yarn package
```
- Package release for Windows, Mac and Linux
```bash
yarn package-all
```

# TODO
- Some styling (especially on cleanup window)
- Settings to change key binds
- Show release notes in update prompt?
