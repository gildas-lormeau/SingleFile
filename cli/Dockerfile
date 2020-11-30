FROM zenika/alpine-chrome:with-node

RUN npm install --production "gildas-lormeau/SingleFile#master" \
    && mkdir out

WORKDIR /usr/src/app/node_modules/single-file/cli

ENTRYPOINT ["./single-file", "--browser-executable-path", "/usr/bin/chromium-browser", "--dump-content", "--output-directory", "/out", "--browser-args", "[\"--no-sandbox\"]"]
