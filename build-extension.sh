#!/bin/sh
npx rollup -c rollup.config.js

rm singlefile-extension-firefox.zip singlefile-extension-chromium.zip singlefile-extension-edge.zip
cp manifest.json manifest.copy.json
cp extension/core/bg/downloads.js downloads.copy.js
sed -i 's/207618107333-3pj2pmelhnl4sf3rpctghs9cean3q8nj/207618107333-7tjs1im1pighftpoepea2kvkubnfjj44/g' extension/core/bg/downloads.js

cp extension/core/bg/config.js config.copy.js
cp extension/core/bg/companion.js companion.copy.js
jq "del(.options_page,.background.persistent,.optional_permissions[0],.optional_permissions[1],.permissions[2],.oauth2)" manifest.copy.json > manifest.json
sed -i 's/207618107333-3pj2pmelhnl4sf3rpctghs9cean3q8nj/207618107333-7tjs1im1pighftpoepea2kvkubnfjj44/g' manifest.json
sed -i 's/forceWebAuthFlow: false/forceWebAuthFlow: true/g' extension/core/bg/config.js
sed -i 's/enabled: true/enabled: false/g' extension/core/bg/companion.js
zip -r singlefile-extension-firefox.zip manifest.json dist _locales extension
zip -r singlefile-extension-source.zip manifest.json package.json _locales extension common lib rollup*.js .eslintrc.js
mv config.copy.js extension/core/bg/config.js
mv companion.copy.js extension/core/bg/companion.js

jq "del(.browser_specific_settings,.permissions[0],.permissions[1],.permissions[2],.options_ui.browser_style)" manifest.copy.json > manifest.json
sed -i 's/207618107333-3pj2pmelhnl4sf3rpctghs9cean3q8nj/207618107333-7tjs1im1pighftpoepea2kvkubnfjj44/g' manifest.json
zip -r singlefile-extension-chromium.zip manifest.json dist _locales extension

cp extension/core/bg/config.js config.copy.js
jq "del(.browser_specific_settings,.permissions[0],.permissions[1],.permissions[2],.options_ui.browser_style)" manifest.copy.json > manifest.json
sed -i 's/207618107333-3pj2pmelhnl4sf3rpctghs9cean3q8nj/207618107333-7tjs1im1pighftpoepea2kvkubnfjj44/g' manifest.json
sed -i 's/forceWebAuthFlow: false/forceWebAuthFlow: true/g' extension/core/bg/config.js
mkdir _locales.copy
cp -R _locales/* _locales.copy
rm -rf _locales/*
cp -R _locales.copy/en _locales
zip -r singlefile-extension-edge.zip manifest.json dist _locales extension
rm -rf _locales/*
mv _locales.copy/* _locales
rmdir _locales.copy
mv config.copy.js extension/core/bg/config.js

mv manifest.copy.json manifest.json
mv downloads.copy.js extension/core/bg/downloads.js