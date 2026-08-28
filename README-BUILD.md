# Building the extension

Requirements: Node.js 26 (includes npm) and the `zip` command.

Run:

    ./build-extension.sh

The script runs `npm ci`, builds the `lib` folder with rollup, and produces `singlefile-extension-firefox.zip`.

## Difference with the published package

The published package differs from this build by one string. The Woleet API key is injected at packaging time. This source contains the placeholder `WOLEET_API_KEY_PLACEHOLDER` in `src/lib/woleet/woleet.js`. The same placeholder appears in the bundled file `lib/single-file-extension-background.js`. Everything else is byte-identical.
