#!/bin/sh
rm singlefile-extension-firefox.zip singlefile-extension-chromium.zip
cp manifest.json manifest.copy.json
cp extension/core/bg/downloads.js downloads.copy.js
sed -i 's/207618107333-bktohpfmdfnv5hfavi1ll18h74gqi27v/207618107333-8fpm0a5h0lho1svrhdj21sbri3via774/g' extension/core/bg/downloads.js

jq "del(.options_page,.background.persistent,.optional_permissions[0],.oauth2)" manifest.copy.json > manifest.json
sed -i 's/207618107333-bktohpfmdfnv5hfavi1ll18h74gqi27v/207618107333-8fpm0a5h0lho1svrhdj21sbri3via774/g' manifest.json
zip -r singlefile-extension-firefox.zip manifest.json common extension lib _locales

jq "del(.applications,.permissions[0],.permissions[1],.permissions[2],.applications,.options_ui.browser_style)" manifest.copy.json > manifest.json
sed -i 's/207618107333-bktohpfmdfnv5hfavi1ll18h74gqi27v/207618107333-8fpm0a5h0lho1svrhdj21sbri3via774/g' manifest.json
zip -r singlefile-extension-chromium.zip manifest.json common extension lib _locales

mv manifest.copy.json manifest.json
mv downloads.copy.js extension/core/bg/downloads.js