# SingleFile Companion
SingleFile Companion is a program that runs outside the browser and can help to make the saving process more transparent when the auto-save is active. It also allows the pages to be saved in another directory than the download directory. It uses the [Native Messaging API](https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/Native_messaging) to communicate with SingleFile.

## Install

 - Install [SingleFile CLI](https://github.com/gildas-lormeau/SingleFile/tree/master/cli)

 - In the `companion` folder of SingleFile, go into the subfolder corresponding to your OS and your browser. For example, if you use Chome on Windows:

`cd companion`

`cd win`

`cd chrome`

 - Make `install.sh` executable (Linux/Unix/BSD etc.).

`chmod +x install.sh`

 - Run `install`

`./install.sh` (Linux/Unix/BSD etc.)

`install.bat` (Windows)

## Notes

 - Only the Chrome version of SingleFile allows you to use SingleFile Companion at the moment. This feature will be available in Firefox when this bug is fixed: https://bugzilla.mozilla.org/show_bug.cgi?id=1630415. Although, you can use SingleFile Companion with Firefox by installing it SingleFile manually, see https://github.com/gildas-lormeau/SingleFile#install.