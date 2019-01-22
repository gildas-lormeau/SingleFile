# SingleFile (Command Line Interface)

## Introduction

SingleFile can be launched from the command line by running it into a (headless) browser. It is run as a standalone script injected into the page to save.

It supports:

- [Puppeteer](https://github.com/GoogleChrome/puppeteer)
- [Selenium WebDriver](https://www.npmjs.com/package/selenium-webdriver)
- [jsdom](https://github.com/jsdom/jsdom)

This is a **work in progress**.

## Run SingleFile

### Prerequisites
- [Node.js](https://nodejs.org) must be installed first. To use Puppeteer or Selenium WebDriver, [Chrome/Chromium](https://www.google.com/chrome/) must also be installed. It is recommended that Chrome/Chromium executable can be found through the `PATH` environment variable. Otherwise you will need to use the `--browser-executable-path` option to help SingleFile locating the executable.
- By default SingleFile will use Puppeteer to connect to the browser. If you want to use Selenium WebDriver instead, you must install it first and ensure the executable can be found through the `PATH` environment variable.

### Install
- Unzip the [master archive](https://github.com/gildas-lormeau/SingleFile/archive/master.zip) somewhere on your disk.

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
  
- Saving https://www.wikipedia.org into `wikipedia.html`

  `$ ./single-file.js https://www.wikipedia.org wikipedia.html` (Linux/Unix/BSD etc.)
  
  `> node single-file.js https://www.wikipedia.org wikipedia.html` (Windows)
 
