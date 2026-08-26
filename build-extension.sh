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

npm ci

npx rollup -c rollup.config.js

zip -r singlefile-extension-source.zip manifest.json package.json _locales src rollup*.js eslint.config.mjs build-extension.sh

rm -f singlefile-extension-firefox.zip

# The Woleet API key is kept out of the repository and injected into the
# packaged files only, from the WOLEET_API_KEY variable or the .woleet-key file
WOLEET_API_KEY="${WOLEET_API_KEY:-$([ -f .woleet-key ] && cat .woleet-key)}"

rm -rf .staging
mkdir .staging
cp manifest.json .staging/
cp -R lib _locales src .staging

if [ -n "$WOLEET_API_KEY" ]; then
    sed -i.bak "s|WOLEET_API_KEY_PLACEHOLDER|$WOLEET_API_KEY|" .staging/src/lib/woleet/woleet.js .staging/lib/single-file-extension-background.js
    rm -f .staging/src/lib/woleet/woleet.js.bak .staging/lib/single-file-extension-background.js.bak
    if ! grep -q "$WOLEET_API_KEY" .staging/lib/single-file-extension-background.js; then
        echo "The Woleet API key could not be injected"
        exit 1
    fi
fi

# forceWebAuthFlow is no longer patched here: gdrive.js now detects at runtime
# whether identity.launchWebAuthFlow is usable (it is not on Firefox for Android,
# which supports neither that method nor the windows API it relies on).
(cd .staging && zip -r ../singlefile-extension-firefox.zip manifest.json lib _locales src)

rm -rf .staging
