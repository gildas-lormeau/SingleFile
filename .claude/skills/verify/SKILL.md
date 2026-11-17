---
name: verify
description: Try a change of the SingleFile extension in a real browser before committing it. Installs this working tree in Firefox, saves a page (whole, a selection, or into the annotation editor) and returns the saved file with screenshots. Use after any change in src/, lib/ or the single-file-core dependency, and before saying that a change works.
---

# Verify a change in the real extension

Unit tests and the command line tool do not prove that a change works in the extension: the
extension marks selections in the live page, has its own defaults, and runs the code of `lib/`.
This skill runs the change the way a user would and gives you the result to look at.

## 1. Build what you want to try

The browser loads `lib/`, not `src/`.

- After a change in `src/`: `./build.sh` (the production build, the one that is committed).
- To try a local checkout of single-file-core (`../single-file-core`): `npm run dev`. It writes
  unminified bundles into `lib/`, which must not be committed: restore them afterwards with
  `git checkout -- lib/` when `src/` is unchanged, or with `./build.sh`.

## 2. Run it

From `../single-file-tests`:

```
node extension/verify.mjs --browser=firefox --url=<page> --out=<directory>
```

- `--select=<css selector>` selects the content of the first matching element and saves the selection.
- `--action=edit-and-save-page` opens the page in the annotation editor instead of saving it.
- `--options='<json>'` sets options of the default profile first, e.g. `{"compressContent":true}`.
- `--browser=both` also runs Chromium with the Manifest V3 extension, which is worth doing for a change that is in both repositories.
- `--headful` shows the browser. Some sites refuse a headless browser: the screenshot of the
  original page shows it ("Access Denied").

It prints, for each browser, the extension it installed, the saved file with its size, and the
paths of the screenshots: the page before the save, and the saved file opened in the same browser
(or the editor). `renderedText` is the number of characters displayed by the saved file.

## 3. Look at the evidence

- Read the screenshots. A saved file that holds the text but displays nothing is the failure this
  check exists for, and only the screenshot shows it.
- Compare with the screenshot of the original page, and with the same run on the code without the
  change when you claim a fix.
- Report what you ran and what you saw. If a case could not be run this way, say so.

## What this cannot do

The toolbar button, the context menu and the keyboard shortcuts are browser chrome and cannot be
driven. The actions available are the ones of the external API of the extension (`save-page`,
`edit-and-save-page`, `save-selected-content`, `save-selected-links`, the `save-*-tabs` actions),
which call the same handlers as the menu entries. A menu entry without an external action, and
anything that needs a click in the page of the editor, still needs a person or a spec in
`../single-file-tests/extension/specs`.

For a release, the gate is `npm run test-release` in `../single-file-tests`, not this skill.
