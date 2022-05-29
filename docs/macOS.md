# Installing cp-clip on macOS

## Permissions
- (required) Accessibility - cp-clip needs this permission to be able to paste for you. Without this permission
  paste will not work.
- (optional) Screen Recording - needed only for Color Picker functionality. cp-clip takes a screenshot to determine a
  color of pixel at your cursor position. Without this permission Color Picker will return a random color.

## Video guide
https://youtu.be/Z602OcyyfSE

## Text guide
1. Install .dmg file like any other .dmg. So drag cp-clip icon into Applications folder.
2. Go to your Applications folder.
3. Try running cp-clip once.
4. You will see a popup. Press "Cancel".
5. Right click on cp-clip in the Applications folder and press "Open".
6. The popup from before will change. Now you can press "Open".

### Fresh install
7. Try pasting anything. You will see a popup that tells you to enable Accessibility permission. Click "Open System
   Preferences".
8. Click a padlock icon in bottom left to be able to make any changes in preferences window.
9. Check a checkbox to allow cp-clip permission.
10. (optional) If you want to use Color Picker functionality, try using it for the first time. You will see a popup that
    tells you to enable Screen Recording permission. Click "Open System Preferences" and do the same as for
    Accessibility permission.

### Update to a new version
7. Try pasting anything. It will not work. You need to manually add the Accessibility permission.
8. Go your System Preferences > "Security & Privacy" > "Privacy" tab and find "Accessibility" on the left list.
9. Click a padlock icon in bottom left to be able to make any changes in this window.
10. On the right side list click cp-clip and press - icon to remove it.
11. Press + icon and re-add cp-clip.
12. (optional) If you want to use Color Picker functionality repeat the step 10 and 11 for Screen Recording permission.

#### Notes
After each update you need to re-do everything.

If you want to update after a fresh install, permissions set in step 9 and 10 will persist, but you will need to remove
and re-add them to make them work.

That is required because cp-clip is an unsigned application. Signing the application requires an Apple Developer account
which costs 99$ every year and cp-clip is a non-profit application.
