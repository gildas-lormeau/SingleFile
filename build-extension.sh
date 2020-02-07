#!/bin/sh
rm singlefile-extension-firefox.zip singlefile-extension-chromium.zip singlefile-extension-edge.zip
cp manifest.json manifest.copy.json
cp extension/core/bg/downloads.js downloads.copy.js
sed -i 's/207618107333-bktohpfmdfnv5hfavi1ll18h74gqi27v/207618107333-8fpm0a5h0lho1svrhdj21sbri3via774/g' extension/core/bg/downloads.js

jq "del(.options_page,.background.persistent,.optional_permissions[0],.oauth2)" manifest.copy.json > manifest.json
sed -i 's/207618107333-bktohpfmdfnv5hfavi1ll18h74gqi27v/207618107333-8fpm0a5h0lho1svrhdj21sbri3via774/g' manifest.json
zip -r singlefile-extension-firefox.zip manifest.json common extension lib _locales

jq "del(.applications,.permissions[0],.permissions[1],.options_ui.browser_style)" manifest.copy.json > manifest.json
sed -i 's/207618107333-bktohpfmdfnv5hfavi1ll18h74gqi27v/207618107333-8fpm0a5h0lho1svrhdj21sbri3via774/g' manifest.json
zip -r singlefile-extension-chromium.zip manifest.json common extension lib _locales

cp extension/core/bg/config.js config.copy.js
jq "del(.applications,.permissions[0],.permissions[1],.options_ui.browser_style)" manifest.copy.json > manifest.json
sed -i 's/207618107333-bktohpfmdfnv5hfavi1ll18h74gqi27v/207618107333-8fpm0a5h0lho1svrhdj21sbri3via774/g' manifest.json
sed -i 's/forceWebAuthFlow: false/forceWebAuthFlow: true/g' extension/core/bg/config.js
mkdir _locales.copy
cp -R _locales/* _locales.copy
rm -rf _locales/*
cp -R _locales.copy/en _locales
zip -r singlefile-extension-edge.zip manifest.json common extension lib _locales
rm -rf _locales/*
mv _locales.copy/* _locales
rmdir _locales.copy
mv config.copy.js extension/core/bg/config.js

mv manifest.copy.json manifest.json
mv downloads.copy.js extension/core/bg/downloads.js