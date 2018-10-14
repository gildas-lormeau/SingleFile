# SingleFile
SingleFile is a WebExtension compatible with Chrome, Firefox (Desktop and Mobile), Opera, and Edge that helps you to save a complete web page into a single HTML file.

## Demo
https://www.youtube.com/watch?v=RdV8DBW5b0g

## Install
 - Firefox Add-ons: https://addons.mozilla.org/en-US/firefox/addon/single-file
 - Chrome Web Store: https://chrome.google.com/extensions/detail/mpiodijhokgodhhofbcjdecpffjipkle
 - Edge, Opera: The extension is not on the store yet, you must download the zip file (https://github.com/gildas-lormeau/SingleFile/archive/master.zip) and install it manually

## Getting started
- Wait until the page is fully loaded, you may need to scroll down the entire page to be sure all elements are loaded.
- Click on the SingleFile button in the extension toolbar to save the page.

## Additional notes
 - To save multiple tabs, select them first and click on the SingleFile button.
 - Open the context menu by right-clicking the SingleFile button in the extension toolbar or on the webpage. It allows you to save:
   - the current tab,
   - or the selected content,
   - or the selected frame.
 - You can also process multiple tabs in one click and save:
   - the selected tabs,
   - or the unpinned tabs,
   - or all the tabs.
 - The context menu also allows you to activate the auto-save of:
   - the current tab,
   - or the unpinned tabs,
   - or all the tabs.
 - With auto-save active, pages are automatically saved every time after being loaded (or before being unloaded if not).
 - Right-click on the SingleFile button and select "Options"/"Manage extension" to open the options page.
 - The default save folder is the download folder configured in your browser, cf. about:preferences in Firefox and chrome://settings in Chrome.
 - You can use the shortcut Ctrl+Shift+X to save current or selected tabs in Chrome. Go to chrome://extensions/shortcuts to change it.

## More info
See the extension help in the options page for more detailed information about the options, and technical notes.

## Optimizations applied to web pages
See https://github.com/gildas-lormeau/SingleFile/wiki/Optimizations-applied-to-web-pages

## Statistics (Firefox)
See https://addons.mozilla.org/en-US/firefox/addon/single-file/statistics/?last=90

## Known Issues
- All browsers:
  - For security reasons, you cannot save pages hosted on https://chrome.google.com or https://addons.mozilla.org.
  - The last saved path cannot be remembered by default. To circumvent this limitation, disable the option "Save pages in background".
- Chrome/Opera:
  - You must enable the option "Allow access to file URLs" in the extension page to display the infobar when viewing a saved page, or to save a page stored on the filesystem.  
- Firefox:
  - You cannot save selected tabs via the context menu because it is not possible to select multiple tabs.
- Edge:
  - The file name looks like "4e5a13fd-6638-4a37-a34b-a3c104ac66b1".

## Troubleshooting unknown issues
Please follow these steps if you find an unknown issue:
- Reset SingleFile options.
- If resetting options did not fix the issue, try to disable all other extensions to see if there is a conflict.
- If there is a conflict then try to determine against which extension(s).
- Please report the issue with a short description describing how to reproduce the issue, Browser version, OS name and version here: https://github.com/gildas-lormeau/SingleFile/issues.

## Contributors
- Chinese translation done by yfdyh000 (https://github.com/yfdyh000), KrasnayaPloshchad (https://github.com/KrasnayaPloshchad)
- Japanese translation done by Shitennouji（四天王寺) (https://github.com/Shitennouji)
- Polish translation done by xesarni (https://github.com/xesarni)
- Russian translation done by rstp14 (https://github.com/rstp14)

Suggestions are welcome :)

## License
```
SingleFile is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

SingleFile is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public License
along with SingleFile.  If not, see <http://www.gnu.org/licenses/>.

SingleFile (c) 2010-2018 Gildas Lormeau
```
