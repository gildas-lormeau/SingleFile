# SingleFile Companion
SingleFile Companion is a program that runs outside the browser. It can:
 - make the saving process more transparent when the auto-save is active in SingleFile,  
 - auto-save pages in an anonymous session in a separate browser,
 - save pages in another directory than the download directory.
 
 It uses the [Native Messaging API](https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/Native_messaging) to communicate with SingleFile.

## Install

 - Install [SingleFile CLI](https://github.com/gildas-lormeau/SingleFile/tree/master/cli) with NPM

 - In the `companion` folder of SingleFile, go into the subfolder corresponding to your OS and your browser. For example, if you use Chome on Linux:

`cd companion`

`cd linux`

`cd chrome`

 - Make `install.sh` executable (Linux/Unix/BSD etc.).

`chmod +x install.sh`

 - Run `install`

`./install.sh` (Linux/Unix/BSD etc.)

`install.bat` (Windows)

 - Enable the option `Destination > save with SingleFile Companion` or `Auto-save > save the page with SingleFile Companion` in SingleFile

## Options

The `options.json` file allows configuring SingleFile Companion. Here are the entries you can edit:
 - `savePath`: path where to save files (default: `SingleFile/companion` path)
These options are also available when the option `Auto-save > save the page with SingleFile Companion` is enabled:
 - `backEnd`: backend used to save the page (default: `"puppeteer"`)
 - `errorFile`: path of the file where errors are stored (default: `undefined`)
 - `browserHeadless`: whether the browser is launched in headless mode (default: `true`)
 - `browserDebug`: whether the browser is launched with the developer tools opened (default: `false`)
