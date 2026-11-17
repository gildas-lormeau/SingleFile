# Review checklist

Each item below starts with a trigger that can be read from a diff. When reviewing a change, check
only the items whose trigger matches. An item says what to check and why it exists. "CI" marks the
checks a workflow already enforces, the others rely on the reviewer.

## Build output

- **A file under `src/` changes.** The rebuilt `lib/` must be in the same commit, produced with
  `./build.sh`. The bundles in `lib/` are what the browser loads, a source change without them does
  nothing. CI ("Check the committed build output").
- **A file under `lib/` grows by thousands of lines.** It is a development build (`npm run dev`),
  which is unminified and reads the local checkout of single-file-core. It must not be committed.
- **`package.json` changes the `single-file-core` version.** `package-lock.json` and the rebuilt
  `lib/` come with it, and the range names the version the extension was built against.

## Both extensions

- **Any change that is not specific to Manifest V2, Firefox or Safari.** The same change goes into
  the Manifest V3 extension (`gildas-lormeau/SingleFile-MV3`). Most of `src/` is shared between the two repositories and they
  are released together under one version number.

## Browser APIs

- **A new `browser.<api>.<member>` call.** The member needs an entry in
  `src/lib/single-file/browser-polyfill/chrome-browser-polyfill.js`, in both extension repositories.
  `browser` is a hand-written whitelist over `chrome.*`, a missing member is `undefined` at runtime.
  Firefox hides the gap because it uses its native `browser`, so the code works there and fails in
  Chrome and Safari.

## Labels and options

- **A key is added to `_locales/en/messages.json`.** The same key, with the English text, goes into
  the 17 other locales, next to the same neighbour key, in both repositories. The translators work
  from these placeholders, a key present only in `en` is invisible to them.
- **A new option.** It needs its default in `src/core/bg/config.js`, its entry in the list of
  `src/core/bg/external-messages.js`, its control in `src/ui/pages/options.html` and
  `src/ui/bg/ui-options.js`, its label in the locales and its paragraph in `src/ui/pages/help.html`.
- **A new menu action.** It needs its definition in `src/ui/common/menu-layout.js`, its handler in
  `src/ui/bg/ui-menus.js`, and its label in the locales. An action that makes no sense in the editor
  page goes into `EDITOR_HIDDEN_ACTIONS`. Adding it to `getDefaultLayout` changes the menus of every
  user, leaving it out makes it available through the menu editor only.

## Secrets

- **Any occurrence of a Woleet API key.** The key is injected at packaging time from an untracked
  file and must never reach the repository. CI ("Check the Woleet API key stays out of the
  repository").

## Code style

- **Any code change.** Tabs, double quotes, semicolons, `npx eslint .` clean. CI ("Run linter").
- **A comment is added in `src/`.** The code is written without comments, the names carry the
  meaning. The exceptions are `// ignored` in an empty `catch` and the eslint directives.
