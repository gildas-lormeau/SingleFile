# SingleFile
SingleFile is a WebExtension compatible with Chrome, Firefox (Desktop and Mobile), Opera, and Edge that helps you to save a complete web page into a single HTML file.

## Demo
https://www.youtube.com/watch?v=RdV8DBW5b0g

## Install
 - Firefox Add-ons: https://addons.mozilla.org/en-US/firefox/addon/single-file
 - Chrome Web Store: https://chrome.google.com/extensions/detail/mpiodijhokgodhhofbcjdecpffjipkle
 - Edge, Opera: The extension is not on the store yet, you must download the zip file (https://github.com/gildas-lormeau/SingleFile/archive/master.zip) and install it manually

## Instructions
- Wait until the page is fully loaded, you may need to scroll down the entire page to be sure all elements are loaded.
- Click on the SingleFile button in the extension toolbar to save the page.

## Additional notes
 - Open the context menu by right-clicking the SingleFile button in the extension toolbar or on the webpage. It allows you to:
  - save a tab,
  - or a selected content,
  - or a frame content,
  - or selected tabs,
  - or unpinned tabs,
  - or all tabs.
 - The context menu also allows you to activate the auto-save of:
  - the current tab,
  - or unpinned tabs (only in the context menu of the webpage),
  - or all tabs (only in the context menu of the webpage).
 - With auto-save active, pages are automatically saved every time after being loaded. The period of time to wait before
saving the page can be configured in the options page.
 - Check the option "auto-save on page unload" in the options page to auto-save the page before being unloading instead
of after being loaded.
 - Right-click on the SingleFile button and select "Options" to open the options page.
 - To save multiple tabs, select them first and click on the SingleFile button.

## More info
See the extension help in the options page for more detailed information about the options, and technical notes.

## Known Issues
- All browsers:
  - After installing the extension, if you want to save a tab that was already opened then you need to refresh it first.
  - For security reasons, you cannot save pages hosted on https://chrome.google.com or https://addons.mozilla.org.
  - Frame contents cannot be saved when "auto-save on page unload" option is checked.
- Chrome/Opera:
  - You must enable the option "Allow access to file URLs" in the extension page to display the infobar when viewing a saved page, or to save a page stored on the filesystem.
  - If saved pages have file names like "4e5a13fd-6638-4a37-a34b-a3c104ac66b1" instead of the title then it means another extension is conflicting with SingleFile. You can uncheck the option "save pages in background" to circumvent this issue.
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
