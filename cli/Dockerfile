FROM zenika/alpine-chrome:with-node

RUN npm install --production gildas-lormeau/SingleFile#master

WORKDIR /usr/src/app/node_modules/single-file/cli

ENTRYPOINT [ \
    "./single-file", \
    "--browser-executable-path", "/usr/bin/chromium-browser", \
    "--output-directory", "./../../../out/", \
    "--browser-args", "[\"--no-sandbox\"]", \
    "--dump-content" ]
