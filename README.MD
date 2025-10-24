# SingleFile

SingleFile helps you to save a complete web page into a single HTML
file. SingleFile is a Web Extension (and a CLI tool) compatible with Chrome, Firefox
(Desktop and Mobile), Microsoft Edge, Safari, Vivaldi, Brave, Waterfox, Yandex
browser, and Opera.

## Table of Contents

- [SingleFile](#singlefile)
  - [Table of Contents](#table-of-contents)
  - [Demo](#demo)
  - [Install](#install)
  - [Getting started](#getting-started)
  - [Additional notes](#additional-notes)
  - [FAQ](#faq)
  - [Release notes](#release-notes)
  - [Known Issues and Troubleshooting](#known-issues-and-troubleshooting)
  - [Command Line Interface (SingleFile CLI)](#command-line-interface-singlefile-cli)
  - [Integration with user scripts](#integration-with-user-scripts)
  - [File format comparison](#file-format-comparison)
  - [Projects using/compatible with SingleFile](#projects-usingcompatible-with-singlefile)
  - [Privacy Policy](#privacy-policy)
  - [Contributors](#contributors)
  - [Code derived from third party projects](#code-derived-from-third-party-projects)
  - [Icons](#icons)
  - [License](#license)

## Demo

https://user-images.githubusercontent.com/396787/156664907-cc458e35-f41b-45ca-91eb-372213812b44.mp4

## Install

SingleFile can be installed from the store of:

- Firefox: https://addons.mozilla.org/firefox/addon/single-file
- Firefox for Android:
  https://addons.mozilla.org/android/addon/single-file
- Chrome:
  https://chromewebstore.google.com/detail/singlefile/mpiodijhokgodhhofbcjdecpffjipkle
- Safari (macOS and iOS): https://apps.apple.com/us/app/singlefile-for-safari/id6444322545
- Microsoft Edge:
  https://microsoftedge.microsoft.com/addons/detail/efnbkdcfmcmnhlkaijjjmhjjgladedno

You can also download the zip file
(https://github.com/gildas-lormeau/SingleFile/archive/master.zip) of the project
and install it manually by unzipping it somewhere on your disk and following
these instructions:

- Firefox: https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox
- Chrome and Microsoft Edge: https://github.com/gildas-lormeau/SingleFile-MV3
- Safari: https://github.com/gildas-lormeau/SingleFile-Safari-Extension
  
## Getting started

- Click on the SingleFile button in the extension toolbar to save the page.
- You can click again on the button to cancel the action when processing a page.

## Additional notes

- Open the context menu by right-clicking the SingleFile button in the extension
  toolbar or on the webpage. It allows you to save:
  - the current tab,
  - the selected content,
  - the selected frame.
- You can also process multiple tabs in one click and save:
  - the selected tabs,
  - the unpinned tabs,
  - all the tabs.
- Select "Annotate and save the page..." in the context menu to:
  - highlight text,
  - add notes,
  - remove content.
- The context menu also allows you to activate the auto-save of:
  - the current tab,
  - the unpinned tabs,
  - all the tabs.
- With auto-save active, pages are automatically saved every time after being
  loaded (or before being unloaded if not).
- Right-click on the SingleFile button and select "Manage extension" (Firefox) /
  "Options" (Chrome) to open the options page.
- Enable the option "Destination > save to Google Drive" or "Destination >
  upload to GitHub" to upload pages to Google Drive or GitHub respectively.
- Enable the option "Misc. > add proof of existence" to prove the existence of
  saved pages by linking the SHA256 of the pages into the blockchain.
- You can use the customizable shortkey Ctrl+Shift+Y to save the current tab or
  the selected tabs. Go to about:addons and select "Manage extension shortcuts"
  in the cogwheel menu to change it in Firefox. Go to
  chrome://extensions/shortcuts to change it in Chrome.
- The default save folder is the download folder configured in your browser, cf.
  about:addons in Firefox and chrome://settings in Chrome.
- See the extension help in the options page for more detailed information about
  the options and technical notes.

## FAQ

See https://github.com/gildas-lormeau/SingleFile/blob/master/faq.md

## Release notes

See https://addons.mozilla.org/firefox/addon/single-file/versions/

## Known Issues and Troubleshooting

See https://github.com/gildas-lormeau/SingleFile/blob/master/known-issues.md

## Command Line Interface (SingleFile CLI)

You can save web pages to HTML from the command line interface. See here for
more info: https://github.com/gildas-lormeau/single-file-cli.

## Integration with user scripts

You can execute a user script just before (and after) SingleFile saves a page.
For more info, see
https://github.com/gildas-lormeau/SingleFile/wiki/How-to-execute-a-user-script-before-a-page-is-saved.

## File format comparison

|   	                                                                          |        HTML        | Self-extracting ZIP | MHTML | Webarchive (Safari) | HTML+folder |
| ---                                	                                          |       :---:        |        :---:        | :---: |         :---:       |    :---:    |
| Pages are saved as a single file                                              | ✓ 	               | ✓ 	                 | ✓     | ✓                   |             |
| HTML and styles are minified                                                  | ✓                  | ✓ 	                 |       |    	               |             |
| Unused HTML and styles are removed from files                                 | ✓                  | ✓ 	                 |       |                     |   	         |
| Binary resources are not encoded in base 64                                   |                    | ✓ 	                 |       | ✓                   | ✓ 	         |
| Files are compressed                                                          |                    | ✓ 	                 |       |                     |   	         |
| Files can be viewed without installing any extension                          | ✓                  | ✓¹                  | ✓²    | ✓³                  | ✓           |
| Files can be viewed without running JavaScript                                | ✓                  |         	           | ✓     | ✓                   | ✓ 	         |
| Files can be unzipped to extract page resources                               |                    | ✓ 	                 |       |                     | n/a         |
| Files contains the text of the page (plain or formatted) which can be indexed | ✓ 	               | ✓⁴                  | ✓     | ✓ 	                 | ✓ 	         |

Footnotes:

¹ When using the "universal" self-extracting file format

² Only in Chromium-based browsers, and Internet Explorer

³ Only in Safari

⁴ An option must be enabled in the extension

## Projects using/compatible with SingleFile

- ArchiveBox - Open-source self-hosted web archiving:
  https://github.com/ArchiveBox/ArchiveBox
- htmls-to-datasette - Tool to index HTML files into a Sqlite database:
  https://github.com/pjamar/htmls-to-datasette
- Karakeep - Self-hostable bookmark-everything app with a touch of AI: 
  https://karakeep.app
- KOReader - Document viewer primarily aimed at e-ink readers:
  https://github.com/koreader/koreader
- linkding - Bookmark manager that you can host yourself. It's designed be to
  be minimal, fast, and easy to set up using Docker:
  https://github.com/sissbruecker/linkding
- Linkwarden - Self-hosted collaborative bookmark manager to collect, read, 
  annotate, and fully preserve what matters, all in one place:
  https://github.com/linkwarden/linkwarden
- obsidian-html-plugin - Plugin for reading HTML pages in Obsidian:
  https://github.com/nuthrash/obsidian-html-plugin
- Org-Dex.el - Emacs package designed to enhance Org-mode by integrating 
  SingleFile CLI: https://github.com/nitincodery/org-dex.el
- Petal Cite Web Importer - Browser extension to save PDFs and capture web pages
  in Petal Cite: https://github.com/ks-collab/cite-extension
- Pocket Search Engine - Semantic search app for Android that works entirely 
  offline: https://play.google.com/store/apps/details?id=com.pocketsearchengine.app
- singlefile2trilium - Tool to save faithful copy of a web page as a Trilium
  note with SingleFile: https://github.com/nil0x42/singlefile2trilium
- SingleFileMac - Integration of SingleFile in a swift application using
  webkit: https://github.com/david-littlefield/SingleFileMac
- SingleFile MV3 CDP Patched - fork of SingleFile patched to allow programmatic 
  control with Chrome DevTools Protocol: https://github.com/Cosmologist/SingleFile-MV3-CDP-Patched
- SingleFile MCP - Model Context Protocol (MCP) server that provides intelligent web
  content extraction using single-file and trafilatura: https://github.com/kwinsch/singlefile-mcp
- Trilium-SingleFile - An addon for Trilium Notes to easily import SingleFile 
  html pages: https://github.com/rauenzi/Trilium-SingleFile
- Trilium Simple SingleFile Renderer - A plugin to add a new Template note to
  Trilium for render file created by SingleFile:
  https://github.com/xnohat/trilium-simple-singlefile-renderer
- web document - Browser extension for saving web documents locally, allowing
  you to access them offline and quickly search for webpage:
  https://github.com/wvit/web-document
- Zotero Connector - Browser extension for Zotero, a tool to help you collect,
  organize, cite, and share your research sources:
  https://github.com/zotero/zotero-connectors

## Privacy Policy

See https://github.com/gildas-lormeau/SingleFile/blob/master/privacy.md

## Contributors

See https://github.com/gildas-lormeau/SingleFile/blob/master/contributors.md

## Code derived from third party projects

- csstree: https://github.com/csstree/csstree
- postcss-media-query-parser:
  https://github.com/dryoma/postcss-media-query-parser
- postcss-selector-parser: https://github.com/postcss/postcss-selector-parser
- UglifyCSS: https://github.com/fmarcia/UglifyCSS
- parse-srcset: https://github.com/albell/parse-srcset
- parse-css-font: https://github.com/jedmao/parse-css-font
- Readability: https://github.com/mozilla/readability
- whatwg-mimetype: https://github.com/jsdom/whatwg-mimetype

## Icons

- Icon made by [Kiranshastry](https://www.flaticon.com/authors/kiranshastry)
  from [Flaticon](https://www.flaticon.com/) is licensed by
  [CC 3.0 BY](http://creativecommons.org/licenses/by/3.0/)

## License

SingleFile is licensed under AGPL. Code derived from third-party projects is
licensed under MIT. Please contact me at gildas.lormeau &lt;at&gt; gmail.com if
you are interested in licensing the SingleFile code for a commercial service or
product.

Suggestions are welcome :)



