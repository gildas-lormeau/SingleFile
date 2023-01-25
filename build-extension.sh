#!/bin/sh

npx rollup -c rollup.config.js

cp package.json package.copy.json
jq 'del(.dependencies."single-file-cli")' package.copy.json > package.json
zip -r singlefile-extension-source.zip manifest.json package.json _locales src rollup*.js .eslintrc.js build-extension.sh
mv package.copy.json package.json

rm singlefile-extension-firefox.zip singlefile-extension-chromium.zip singlefile-extension-edge.zip
cp manifest.json manifest.copy.json
cp src/core/bg/downloads.js downloads.copy.js
sed -i 's/207618107333-3pj2pmelhnl4sf3rpctghs9cean3q8nj/207618107333-h1220p1oasj3050kr5r416661adm091a/g' src/core/bg/downloads.js
sed -i 's/000000000000000000000000/VQJ8Gq8Vxx72QyxPyeLtWvUt/g' src/core/bg/downloads.js

cp src/core/bg/config.js config.copy.js
cp src/core/bg/companion.js companion.copy.js
jq "del(.options_page,.background.persistent,.optional_permissions[0],.permissions[2],.oauth2)" manifest.copy.json >manifest.json
sed -i 's/forceWebAuthFlow: false/forceWebAuthFlow: true/g' src/core/bg/config.js
sed -i 's/enabled: true/enabled: false/g' src/core/bg/companion.js
zip -r singlefile-extension-firefox.zip manifest.json lib _locales src
mv config.copy.js src/core/bg/config.js
mv companion.copy.js src/core/bg/companion.js

jq "del(.browser_specific_settings,.permissions[0],.permissions[1],.options_ui.browser_style)" manifest.copy.json >manifest.json
sed -i 's/207618107333-3pj2pmelhnl4sf3rpctghs9cean3q8nj/207618107333-7tjs1im1pighftpoepea2kvkubnfjj44/g' manifest.json
zip -r singlefile-extension-chromium.zip manifest.json lib _locales src

cp src/core/bg/config.js config.copy.js
jq "del(.browser_specific_settings,.permissions[0],.permissions[1],.options_ui.browser_style)" manifest.copy.json >manifest.json
sed -i 's/207618107333-3pj2pmelhnl4sf3rpctghs9cean3q8nj/207618107333-7tjs1im1pighftpoepea2kvkubnfjj44/g' manifest.json
sed -i 's/forceWebAuthFlow: false/forceWebAuthFlow: true/g' src/core/bg/config.js
sed -i 's/image\/avif,//g' src/core/bg/config.js
mkdir _locales.copy
cp -R _locales/* _locales.copy
rm -rf _locales/*
cp -R _locales.copy/en _locales
zip -r singlefile-extension-edge.zip manifest.json lib _locales src
rm -rf _locales/*
mv _locales.copy/* _locales
rmdir _locales.copy
mv config.copy.js src/core/bg/config.js

mv manifest.copy.json manifest.json
mv downloads.copy.js src/core/bg/downloads.js
