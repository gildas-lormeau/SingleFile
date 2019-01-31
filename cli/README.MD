# SingleFile (Command Line Interface)

## Introduction

SingleFile can be launched from the command line by running it into a (headless) browser. It runs through Node.js as a standalone script injected into the page to save instead of being embedded into a WebExtension. To connect to the browser, it can use [Puppeteer](https://github.com/GoogleChrome/puppeteer) or [Selenium WebDriver](https://www.npmjs.com/package/selenium-webdriver). Alternatively, it can also emulate a browser with JavaScript disabled by using [jsdom](https://github.com/jsdom/jsdom).

This is a **work in progress**.

## Run SingleFile

### Prerequisites

- [Node.js](https://nodejs.org) must be installed. 
- By default SingleFile will use Puppeteer to connect to [Chrome/Chromium](https://www.google.com/chrome/). With Puppeteer, Chrome/Chromium must also be installed. 
- If you use [Selenium WebDriver](https://www.npmjs.com/package/selenium-webdriver) instead of Puppeteer, you must only download the component (e.g. `geckodriver` or `chromedriver`) for your browser and ensure it can be found through the `PATH` environment variable or the current folder.
- With Selenium WebDriver, you can use [Firefox](https://www.mozilla.org/en/firefox/new/) or Chrome/Chromium. 
- It is recommended that the browser binaries can be found through the `PATH` environment variable or the current folder. Otherwise you will need to set the `--browser-executable-path` option to help SingleFile locating the binary file.
- To convert MAFF files to HTML, you must use special versions of Firefox and Selenium WebDriver component: You have  install [Firefox version 56.0.2](https://ftp.mozilla.org/pub/firefox/releases/56.0.2/) and [Mozilla geckodriver version 0.20.1](https://github.com/mozilla/geckodriver/releases/tag/v0.20.1). See the last example for more info about the options to set.

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
- Syntax
 
  `$ ./single-file.js <url> [output] [options ...]` (Linux/Unix/BSD etc.)

  `> node single-file.js <url> [output] [options ...]` (Windows)    

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

  - Convert a MAFF file (e.g. `wikipedia.maff`) into `wikipedia.html`

  `$ ./single-file.js file:///home/gildas/wikipedia.maff wikipedia.html --enable-MAFF  --load-deferred-images=false --back-end=webdriver-firefox --browser-executable-path=~/firefox-56.0.2/firefox` (Linux/Unix/BSD etc.)
  
  `> node single-file.js file:///C:/Users/Gildas/wikipedia.maff wikipedia.html --enable-MAFF  --load-deferred-images=false --back-end=webdriver-firefox --browser-executable-path="C:\Program Files\Mozilla Firefox 56.0.2\firefox"` (Windows)
  
## License
SingleFile is licensed under AGPL and GPL. Code derived from third-party projects is licensed under MIT. Please contact me at gildas.lormeau &lt;at&gt; gmail.com if you are interested in licensing the SingleFile code for a commercial service or product.
