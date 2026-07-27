#!/bin/bash

dpkg -s zip &> /dev/null
if [ $? -ne 0 ]
then
    if ! command -v zip &> /dev/null; then
        echo "Installing zip"
        sudo apt install zip
    fi
fi

dpkg -s jq &> /dev/null
if [ $? -ne 0 ]
then
    if ! command -v jq &> /dev/null; then
        echo "Installing jq"
        sudo apt install jq
    fi
fi

npm install
npm update

npx rollup -c rollup.config.js

zip -r singlefile-extension-source.zip manifest.json package.json _locales src rollup*.js eslint.config.mjs build-extension.sh

rm -f singlefile-extension-firefox.zip

# forceWebAuthFlow is no longer patched here: gdrive.js now detects at runtime
# whether identity.launchWebAuthFlow is usable (it is not on Firefox for Android,
# which supports neither that method nor the windows API it relies on).
zip -r singlefile-extension-firefox.zip manifest.json lib _locales src
