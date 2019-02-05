# SingleFile (Command Line Interface)

## Introduction

SingleFile can be launched from the command line by running it into a (headless) browser. It runs through Node.js as a standalone script injected into the web page instead of being embedded into a WebExtension. To connect to the browser, it can use [Puppeteer](https://github.com/GoogleChrome/puppeteer) or [Selenium WebDriver](https://www.npmjs.com/package/selenium-webdriver). Alternatively, it can also emulate a browser with JavaScript disabled by using [jsdom](https://github.com/jsdom/jsdom).

This is a **work in progress**.

## Run SingleFile

### Prerequisites

- [Node.js](https://nodejs.org) must be installed. 
- By default SingleFile will use Puppeteer to connect to [Chrome/Chromium](https://www.google.com/chrome/). With Puppeteer, Chrome/Chromium must also be installed. 
- With Selenium WebDriver, you can use [Firefox](https://www.mozilla.org/en/firefox/new/) or Chrome/Chromium. At least one of them must be installed. 
- If you use [Selenium WebDriver](https://www.npmjs.com/package/selenium-webdriver) instead of Puppeteer, you only need to download the component (e.g. `geckodriver` or `chromedriver`) for your browser and ensure it can be found through the `PATH` environment variable or the `cli` folder. Otherwise you will need to set the `--web-driver-executable-path` option to help SingleFile locating the binary file.
- It is recommended that the browser binaries can be found through the `PATH` environment variable or the `cli` folder. Otherwise you will need to set the `--browser-executable-path` option to help SingleFile locating the binary file.
 - You can also convert MAFF pages to HTML. For this, you must use specific versions of SingleFile CLI and Firefox. See here for more info: https://github.com/gildas-lormeau/SingleFile/blob/master/maff2html/README.MD.

### Install

- Unzip the [master archive](https://github.com/gildas-lormeau/SingleFile/archive/master.zip) somewhere on your disk in an empty folder.

  `$ unzip master.zip .`
  
- Go into the `cli` directory.

  `$ cd cli`
  
- Install dependencies with npm (installed with Node.js).

  `$ npm install`
  
- Make `single-file` executable (Linux/Unix/BSD etc.).

  `$ chmod +x single-file`

### Run

- Syntax
 
  `$ ./single-file <url> [output] [options ...]` (Linux/Unix/BSD etc.)

  `> single-file <url> [output] [options ...]` (Windows)    

- Display help

  `$ ./single-file --help` (Linux/Unix/BSD etc.)

  `> single-file --help` (Windows)

- Examples

  - Dump the processed content of https://www.wikipedia.org into the console

  `$ ./single-file https://www.wikipedia.org` (Linux/Unix/BSD etc.)

  `> single-file https://www.wikipedia.org` (Windows)

  - Save https://www.wikipedia.org into `wikipedia.html`

  `$ ./single-file https://www.wikipedia.org wikipedia.html` (Linux/Unix/BSD etc.)
  
  `> single-file https://www.wikipedia.org wikipedia.html` (Windows)

  - Save https://www.wikipedia.org into `wikipedia.html` with jsdom instead of Puppeteer

  `$ ./single-file https://www.wikipedia.org wikipedia.html --back-end=jsdom` (Linux/Unix/BSD etc.)
  
  `> single-file https://www.wikipedia.org wikipedia.html --back-end=jsdom` (Windows)
  
## License

SingleFile is licensed under AGPL and GPL. Code derived from third-party projects is licensed under MIT. Please contact me at gildas.lormeau &lt;at&gt; gmail.com if you are interested in licensing the SingleFile code for a commercial service or product.
