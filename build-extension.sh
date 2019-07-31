#!/bin/sh
rm singlefile-extension-firefox.zip singlefile-extension-chromium.zip
cp manifest.json manifest.copy.json
jq "del(.options_page,.background.persistent)" manifest.copy.json > manifest.json
zip -r singlefile-extension-firefox.zip manifest.json extension lib _locales index.js
jq "del(.applications,.permissions[0],.options_ui.browser_style)" manifest.copy.json > manifest.json
zip -r singlefile-extension-chromium.zip manifest.json extension lib _locales index.js
mv manifest.copy.json manifest.json