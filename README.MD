# SingleFile
SingleFile is a Web Extension compatible with Chrome, Firefox (Desktop and Mobile), Vivaldi, Brave, Waterfox, Yandex browser, and Opera that helps you to save a complete web page into a single HTML file.

## Table of Contents
 - [Demo](#demo)
 - [Install](#install)
 - [Getting started](#getting-started)
 - [Additional notes](#additional-notes)
 - [Statistics (Firefox)](#statistics-firefox)
 - [Command Line Interface](#command-line-interface)
 - [Known issues](#known-issues)
 - [Troubleshooting unknown issues](#troubleshooting-unknown-issues)
 - [Release notes](#release-notes)
 - [Privacy policy](#privacy-policy)
 - [Contributors](#contributors)
 - [Icons](#icons)
 - [Code derived from third party projects](#code-derived-from-third-party-projects)
 - [License](#license)

## Demo
https://www.youtube.com/watch?v=RdV8DBW5b0g

## Install
SingleFile can be installed:
 - on Firefox via the Firefox Add-ons website: https://addons.mozilla.org/en-US/firefox/addon/single-file,
 - on Chrome via the Chrome Web Store: https://chrome.google.com/extensions/detail/mpiodijhokgodhhofbcjdecpffjipkle,
 - by downloading the zip file (https://github.com/gildas-lormeau/SingleFile/archive/master.zip) and installing it manually.

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
 - You can use the shortcut Ctrl+Shift+Y (Ctrl+Shift+U on Chrome OS) to save the current tab or selected tabs. Go to chrome://extensions/shortcuts to change it in Chrome.
 - See the extension help in the options page for more detailed information about the options and technical notes.

## Statistics (Firefox)
See https://addons.mozilla.org/en-US/firefox/addon/single-file/statistics/?last=90

## Command Line Interface
 - You can save web pages to HTML from the command line interface. See here for more info: https://github.com/gildas-lormeau/SingleFile/blob/master/cli/README.MD.
 - You can also convert MAFF pages to HTML. For this, you must use specific versions of SingleFile CLI and Firefox. See here for more info: https://github.com/gildas-lormeau/SingleFile/blob/master/maff2html/README.MD.

## Known Issues
- All browsers:
  - For security reasons, you cannot save pages hosted on https://chrome.google.com, https://addons.mozilla.org and some other Mozilla domains. When this happens, the label "🛇" is displayed on top of the SingleFile icon.
  - The last saved path cannot be remembered by default. To circumvent this limitation, disable the option "Misc > Save pages in background".
  - The following characters are replaced with _ in filenames: ~, \\, ?, %, *, :, |, ", <, >  
- Chrome:
  - You must enable the option "Allow access to file URLs" in the extension page to display the infobar when viewing a saved page, or to save a page stored on the filesystem.
  - If the filename of a saved page looks like "56833935-156b-4d8c-a00f-19599c6513d3", disable the option "Misc > Save pages in background". Reinstalling the browser may also fix this issue.

## Troubleshooting unknown issues
Please follow these steps if you find an unknown issue:
- Save the page in incognito.
- If saving page in incognito did not fix the issue, reset SingleFile options.
- If resetting options did not fix the issue, restart the browser.
- If restarting the browser did not fix the issue, try to disable all other extensions to see if there is a conflict.
- If there is a conflict then try to determine against which extension(s).
- Please report the issue with a short description on how to reproduce it here: https://github.com/gildas-lormeau/SingleFile/issues.

## Release notes
See https://addons.mozilla.org/en-US/firefox/addon/single-file/versions

## Privacy Policy
See https://github.com/gildas-lormeau/SingleFile/blob/master/privacy.md

## Contributors
- Chinese translation done by yfdyh000 (https://github.com/yfdyh000), KrasnayaPloshchad (https://github.com/KrasnayaPloshchad), frostblazergit (https://github.com/frostblazergit)
- German translation done by womotroll (https://github.com/womotroll)
- Japanese translation done by Shitennouji（四天王寺) (https://github.com/Shitennouji)
- Polish translation done by xesarni (https://github.com/xesarni)
- Russian translation done by rstp14 (https://github.com/rstp14)

## Code derived from third party projects
- csstree: https://github.com/csstree/csstree
- postcss-media-query-parser: https://github.com/dryoma/postcss-media-query-parser
- UglifyCSS: https://github.com/fmarcia/UglifyCSS
- parse-srcset: https://github.com/albell/parse-srcset
- parse-css-font: https://github.com/jedmao/parse-css-font

## Icons
- Icon made by [Kiranshastry](https://www.flaticon.com/authors/kiranshastry) from  [Flaticon](https://www.flaticon.com/) is licensed by [CC 3.0 BY](http://creativecommons.org/licenses/by/3.0/)

## License
SingleFile is licensed under AGPL and GPL. Code derived from third-party projects is licensed under MIT. Please contact me at gildas.lormeau &lt;at&gt; gmail.com if you are interested in licensing the SingleFile code for a commercial service or product.

Suggestions are welcome :)
