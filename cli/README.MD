# SingleFile (Command Line Interface)

## Introduction

SingleFile can be launched from the command line by running it into a (headless) browser. It runs through Node.js as a standalone script injected into the page to save instead of being embedded into a WebExtension. To connect to the browser, it can use [Puppeteer](https://github.com/GoogleChrome/puppeteer) or [Selenium WebDriver](https://www.npmjs.com/package/selenium-webdriver). Alternatively, it can also emulate a browser with JavaScript disabled by using [jsdom](https://github.com/jsdom/jsdom).

This is a **work in progress**.

## Run SingleFile

### Prerequisites

- [Node.js](https://nodejs.org) must be installed first. With Puppeteer (by default), [Chrome/Chromium](https://www.google.com/chrome/) must also be installed. Alternatively, with Selenium WebDriver, you can use [Firefox](https://www.mozilla.org/en/firefox/new/) instead. It is recommended that Chrome/Firefox binaries can be found through the `PATH` environment variable or the current folder. Otherwise you will need to set the `--browser-executable-path` option to help SingleFile locating the executable.
- By default SingleFile will use Puppeteer to connect to the browser. If you prefer using Selenium WebDriver, you must install it first and ensure the executable can be found through the `PATH` environment variable or the current folder.

### Install
- Unzip the [master archive](https://github.com/gildas-lormeau/SingleFile/archive/master.zip) somewhere on your disk in an empty folder.

  `$ unzip master.zip .`
  
- Go into the `cli` directory.

  `$ cd cli`
  
- Install dependencies with npm (installed with Node.js).

  `$ npm install`
  
- Make `single-file.js` executable (Linux/Unix/BSD etc.).

  `$ chmod +x single-file.js`

### Run
- Display help

  `$ ./single-file.js --help` (Linux/Unix/BSD etc.)

  `> node single-file.js --help` (Windows)

- Examples

  - Dump the processed content of https://www.wikipedia.org into the console

  `$ ./single-file.js https://www.wikipedia.org` (Linux/Unix/BSD etc.)

  `> node single-file.js https://www.wikipedia.org` (Windows)

  - Save https://www.wikipedia.org into `wikipedia.html`

  `$ ./single-file.js https://www.wikipedia.org wikipedia.html` (Linux/Unix/BSD etc.)
  
  `> node single-file.js https://www.wikipedia.org wikipedia.html` (Windows)

  - Save https://www.wikipedia.org into `wikipedia.html` with jsdom instead of Puppeteer

  `$ ./single-file.js https://www.wikipedia.org wikipedia.html --back-end=jsdom` (Linux/Unix/BSD etc.)
  
  `> node single-file.js https://www.wikipedia.org wikipedia.html --back-end=jsdom` (Windows)
  
## License
SingleFile is licensed under AGPL and GPL. Code derived from third-party projects is licensed under MIT. Please contact me at gildas.lormeau &lt;at&gt; gmail.com if you are interested in licensing the SingleFile code for a commercial service or product.
