#!/bin/sh
npx rollup -c rollup.config.js

zip -r singlefile-extension-source.zip manifest.json package.json _locales src rollup*.js .eslintrc.js build-extension.sh

rm singlefile-extension-firefox.zip singlefile-extension-chromium.zip singlefile-extension-edge.zip
cp manifest.json manifest.copy.json
cp src/extension/core/bg/downloads.js downloads.copy.js
sed -i 's/207618107333-3pj2pmelhnl4sf3rpctghs9cean3q8nj/207618107333-7tjs1im1pighftpoepea2kvkubnfjj44/g' src/extension/core/bg/downloads.js

cp src/extension/core/bg/config.js config.copy.js
cp src/extension/core/bg/companion.js companion.copy.js
jq "del(.options_page,.background.persistent,.optional_permissions[0],.permissions[3],.oauth2)" manifest.copy.json > manifest.json
sed -i 's/207618107333-3pj2pmelhnl4sf3rpctghs9cean3q8nj/207618107333-7tjs1im1pighftpoepea2kvkubnfjj44/g' manifest.json
sed -i 's/forceWebAuthFlow: false/forceWebAuthFlow: true/g' src/extension/core/bg/config.js
sed -i 's/enabled: true/enabled: false/g' src/extension/core/bg/companion.js
zip -r singlefile-extension-firefox.zip manifest.json lib _locales src/extension
mv config.copy.js src/extension/core/bg/config.js
mv companion.copy.js src/extension/core/bg/companion.js

jq "del(.browser_specific_settings,.permissions[0],.permissions[1],.options_ui.browser_style)" manifest.copy.json > manifest.json
sed -i 's/207618107333-3pj2pmelhnl4sf3rpctghs9cean3q8nj/207618107333-7tjs1im1pighftpoepea2kvkubnfjj44/g' manifest.json
zip -r singlefile-extension-chromium.zip manifest.json lib _locales src/extension

cp src/extension/core/bg/config.js config.copy.js
jq "del(.browser_specific_settings,.permissions[0],.permissions[1],.options_ui.browser_style)" manifest.copy.json > manifest.json
sed -i 's/207618107333-3pj2pmelhnl4sf3rpctghs9cean3q8nj/207618107333-7tjs1im1pighftpoepea2kvkubnfjj44/g' manifest.json
sed -i 's/forceWebAuthFlow: false/forceWebAuthFlow: true/g' src/extension/core/bg/config.js
mkdir _locales.copy
cp -R _locales/* _locales.copy
rm -rf _locales/*
cp -R _locales.copy/en _locales
zip -r singlefile-extension-edge.zip manifest.json lib _locales src/extension
rm -rf _locales/*
mv _locales.copy/* _locales
rmdir _locales.copy
mv config.copy.js src/extension/core/bg/config.js

mv manifest.copy.json manifest.json
mv downloads.copy.js src/extension/core/bg/downloads.js