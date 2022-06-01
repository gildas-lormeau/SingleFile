FROM zenika/alpine-chrome:with-node

RUN npm install --production single-file-cli

WORKDIR /usr/src/app/node_modules/single-file-cli

ENTRYPOINT [ \
    "./single-file", \
    "--browser-executable-path", "/usr/bin/chromium-browser", \
    "--output-directory", "./../../out/", \
    "--browser-args", "[\"--no-sandbox\"]", \
    "--dump-content" ]
