# SingleFile (Command Line Interface)

## Introduction

SingleFile can be launched from the command line by running it into a (headless) browser. It runs through Node.js as a standalone script injected into the web page instead of being embedded into a WebExtension. To connect to the browser, it can use [Puppeteer](https://github.com/GoogleChrome/puppeteer) or [Selenium WebDriver](https://www.npmjs.com/package/selenium-webdriver). Alternatively, it can also emulate a browser with JavaScript disabled by using [jsdom](https://github.com/jsdom/jsdom).
  
## Installation with Docker

- Installation from Docker Hub

  `docker pull capsulecode/singlefile`
  
  `docker tag capsulecode/singlefile singlefile`
  
- Manual installation

  `git clone --depth 1 --recursive https://github.com/gildas-lormeau/SingleFile.git`
  
  `cd SingleFile/cli`

  `docker build --no-cache -t singlefile .`

- Run

  `docker run singlefile "https://www.wikipedia.org"`
  
- Run and redirect the result into a file

  `docker run singlefile "https://www.wikipedia.org" > wikipedia.html`

- Run and mount a volume to get the saved file in the current directory

  - Save one page

    `docker run -v %cd%:/usr/src/app/out singlefile "https://www.wikipedia.org" wikipedia.html` (Windows)

    `docker run -v $(pwd):/usr/src/app/out singlefile "https://www.wikipedia.org" wikipedia.html` (Linux/UNIX)

  - Save one or multiple pages by using the filename template (see `--filename-template` option)

    `docker run -v %cd%:/usr/src/app/out singlefile "https://www.wikipedia.org" --dump-content=false` (Windows)

    `docker run -v $(pwd):/usr/src/app/out singlefile "https://www.wikipedia.org" --dump-content=false` (Linux/UNIX)

- An alternative docker file can be found here https://github.com/screenbreak/SingleFile-dockerized. It allows you to save pages from the command line interface or through an HTTP server.

## Manual installation

- Make sure Chrome or Firefox is installed and the executable can be found through the `PATH` environment variable. Otherwise you will need to set the `--browser-executable-path` option to help SingleFile locating it. As an alternative to Chrome and Firefox, you can use jsdom by setting the `--back-end` option to `jsdom`.

- Install [Node.js](https://nodejs.org)

- There are 3 ways to download the code of SingleFile, choose the one you prefer (`npm` is installed with Node.js):

  - Download and install globally with `npm`
    
    `npm install -g "gildas-lormeau/SingleFile#master"`
  
  - Download and unzip manually the [master archive](https://github.com/gildas-lormeau/SingleFile/archive/master.zip) provided by Github      

    `unzip master.zip .`
  
    `cd SingleFile-master`
  
    `npm install`
  
    `cd cli`    
    
  - Download with `git`

    `git clone --depth 1 --recursive https://github.com/gildas-lormeau/SingleFile.git`
  
    `cd SingleFile`
    
    `npm install`
  
    `cd cli`           
  
- Make `single-file` executable (Linux/Unix/BSD etc.) if SingleFile is not installed globally.

  `chmod +x single-file`

- To use Firefox instead of Chrome, you must download the [Selenium WebDriver](https://www.npmjs.com/package/selenium-webdriver) component (i.e. `geckodriver` for Firefox).  Make sure it can be found through the `PATH` environment variable or the `cli` folder. Otherwise you will need to set the `--web-driver-executable-path` option to help WebDriver locating the executable.

## Run

- Syntax
 
  `single-file <url> [output] [options ...]`

- Display help

  `single-file --help`

- Examples

  - Dump the processed content of https://www.wikipedia.org into the console

  `single-file https://www.wikipedia.org --dump-content`

  - Save https://www.wikipedia.org into `wikipedia.html` in the current folder

  `single-file https://www.wikipedia.org wikipedia.html`

  - Save https://www.wikipedia.org into `wikipedia.html` in the current folder with Firefox instead of Chrome

  `single-file https://www.wikipedia.org wikipedia.html --back-end=webdriver-gecko`

  - Save a list of URLs stored into `list-urls.txt` in the current folder

  `single-file --urls-file=list-urls.txt`

  - Save https://www.wikipedia.org and crawl its internal links with the query parameters removed from the URL

  `single-file https://www.wikipedia.org --crawl-links=true --crawl-inner-links-only=true --crawl-max-depth=1 --crawl-rewrite-rule="^(.*)\\?.*$ $1"`

  - Save https://www.wikipedia.org and external links only

  `single-file https://www.wikipedia.org --crawl-links=true --crawl-inner-links-only=false --crawl-external-links-max-depth=1 --crawl-rewrite-rule="^.*wikipedia.*$"`
  
## Troubleshooting

 - If the error message `UnhandledPromiseRejectionWarning: Error: Browser is not downloaded. Run "npm install" or "yarn install" at ChromeLauncher.launch` is displayed, it probably means that `single-file` was not able to find the executable of the browser. Using the option `--browser-executable-path` to pass to `single-file` the complete path of the executable fixes this issue.
 
  - If saving a page takes an unusually long time, this may be due to a timeout error that was automatically recovered. Setting `--browser-wait-until` to a lower value (e.g. `networkidle0` or `load` instead of `networkidle2`) fixes this issue.

## License

SingleFile is licensed under AGPL. Code derived from third-party projects is licensed under MIT. Please contact me at gildas.lormeau &lt;at&gt; gmail.com if you are interested in licensing the SingleFile code for a commercial service or product.
