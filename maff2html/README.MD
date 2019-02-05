# SingleFile (MAFF to HTML)

## Introduction

SingleFile can be launched from the command line to convert MAFF files into HTML files by running it into Firefox. It runs through Node.js as a standalone script injected into the web page instead of being embedded into a WebExtension. To connect to Firefox, it uses [Selenium WebDriver](https://www.npmjs.com/package/selenium-webdriver).

## Convert MAFF to HTML

### Install

- Install [Firefox version 56.0.2](https://ftp.mozilla.org/pub/firefox/releases/56.0.2/)

- Make sure the executable of Firefox can be found through the `PATH` environment variable. Otherwise you will need to set the `--browser-executable-path` option to help SingleFile locating it.

- Install [Node.js](https://nodejs.org)

- Unzip the [master archive](https://github.com/gildas-lormeau/SingleFile/archive/master.zip) somewhere on your disk in an empty folder.

  `$ unzip master.zip .`

- Go into the `maff2html` directory.

  `$ cd maff2html`
  
- Install dependencies with npm (installed with Node.js).

  `$ npm install`
  
- Make `single-file` executable (Linux/Unix/BSD etc.).

  `$ chmod +x single-file`

- Download the [Mozilla geckodriver version 0.20.1](https://github.com/mozilla/geckodriver/releases/tag/v0.20.1) component.  Make sure it can be found through the `PATH` environment variable or the `maff2html` folder. Otherwise you will need to set the `--web-driver-executable-path` option to help SingleFile locating the executable.

### Run

- Syntax
 
  `$ ./single-file <url> [output] [options ...]` (Linux/Unix/BSD etc.)

  `> single-file <url> [output] [options ...]` (Windows)    

- Display help

  `$ ./single-file --help` (Linux/Unix/BSD etc.)

  `> single-file --help` (Windows)

- Examples

  - Convert `wikipedia.maff` (located in the user directory) into `wikipedia.html`

  `$ ./single-file file:///home/gildas/wikipedia.maff wikipedia.html` (Linux/Unix/BSD etc.)
  
  `> single-file file:///C:/Users/Gildas/wikipedia.maff wikipedia.html` (Windows)

  - Convert `wikipedia.maff` (located in the user directory) into `wikipedia.html` with Firefox installed in the folder "~/firefox-56.0.2/" (Linux/Unix/BSD etc.) or "C:\Program Files\Mozilla Firefox 56.0.2\" (Windows)

  `$ ./single-file file:///home/gildas/wikipedia.maff wikipedia.html --browser-executable-path=~/firefox-56.0.2/firefox` (Linux/Unix/BSD etc.)
  
  `> single-file file:///C:/Users/Gildas/wikipedia.maff wikipedia.html --browser-executable-path="C:\Program Files\Mozilla Firefox 56.0.2\firefox"` (Windows)
  
## License

SingleFile is licensed under AGPL and GPL. Code derived from third-party projects is licensed under MIT. Please contact me at gildas.lormeau &lt;at&gt; gmail.com if you are interested in licensing the SingleFile code for a commercial service or product.
