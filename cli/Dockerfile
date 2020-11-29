FROM zenika/alpine-chrome:with-node

RUN set -x \
    git \
    && git clone --depth 1 --recursive https://github.com/gildas-lormeau/SingleFile \
    && mkdir out && cd SingleFile && cd cli && npm install --production \
    && chmod +x single-file \
    && echo

WORKDIR /usr/src/app/SingleFile/cli

ENTRYPOINT ["./single-file", "--browser-executable-path", "/usr/bin/chromium-browser", "--dump-content", "--output-directory", "/out", "--browser-args", "[\"--no-sandbox\"]"]
