# SingleFile

## Known Issues

- All browsers:
  - For security reasons, you cannot save pages hosted on
    https://chrome.google.com, https://addons.mozilla.org and some other Mozilla
    domains. When this happens, 🛇 is displayed on top of the SingleFile icon.
  - For
    [security reasons](https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image),
    SingleFile is sometimes unable to save the image representation of
    [canvas](https://developer.mozilla.org/docs/Web/HTML/Element/canvas) and
    snapshots of
    [video](https://developer.mozilla.org/docs/Web/HTML/Element/video) elements.
  - The last saved path cannot be remembered by default. To circumvent this
    limitation, disable the option "Misc > save pages in background".
  - The following characters are replaced by their full-width equivalent 
    symbols in file names: ~, +, ?, %, *, :, |, ", &lt;, &gt;, \. The 
    replacement characters are respectively: ～, ＋, ？, ％, ＊, ：, ｜, ＂, ＜, ＞, ＼.
    Other invalid charcaters are replaced by _. This is done to maintain 
    compatibility with various OSs and file systems. If you don't need that 
    level of compatibility and know what you are doing, you can change the
    list of forbidden characters and the replacement characters in the Hidden 
    options(https://github.com/gildas-lormeau/SingleFile/wiki/Hidden-options).
- Chromium-based browsers:
  - You must enable the option "Allow access to file URLs" in the extension page
    to display the infobar when viewing a saved page, and to save or to annotate
    a page stored on the filesystem.
  - If the file name of a saved page looks like
    "56833935-156b-4d8c-a00f-19599c6513d3.html", disable the option "Misc > save
    pages in background". Reinstalling the browser may also fix this issue. This
    issue might also be due to a conflict with another "downloader" extension. 
    You can find more info about this bug
    [here](https://bugs.chromium.org/p/chromium/issues/detail?id=892133).
  - Disabling the option "File name > open the "Save as" dialog to confirm the
    file name" will work if and only if the option "Ask where to save each file
    before downloading" is disabled in chrome://settings/downloads.
- Firefox:
  - The "File name > file name conflict resolution" option does not work if set
    to "prompt for a name"
  - Sometimes, SingleFile is unable to save the contents of sandboxed iframes
    because of [this bug](https://bugzilla.mozilla.org/show_bug.cgi?id=1411641).
  - When processing a page from the filesystem, external resources (e.g. images,
    stylesheets, fonts etc.) will not be embedded into the saved page. You can
    find more info about this bug
    [here](https://bugzilla.mozilla.org/show_bug.cgi?id=1644488). This bug has
    been closed by Mozilla as "WontFix". But there is a simple workaround
    proposed
    [here](https://github.com/gildas-lormeau/SingleFile/issues/7#issuecomment-618980153).
- Waterfox Classic
  - User interface elements displayed in the page (progress bar, logs panel)
    won't be displayed unless `dom.webcomponents.enabled` is enabled in
    `about:config`.
  - When opening pages saved with the option "Images > group duplicate images
    together" enabled, some duplicate images might not displayed. It is
    recommended to disable this option.

## Troubleshooting unknown issues

Please follow these steps if you find an unknown issue:

- Save the page in incognito.
- If saving page in incognito did not fix the issue, reset SingleFile options.
- If resetting options did not fix the issue, restart the browser.
- If restarting the browser did not fix the issue, try to disable all other
  extensions to see if there is a conflict.
- If there is a conflict then try to determine against which extension(s).
- Please report the issue with a short description on how to reproduce it here:
  https://github.com/gildas-lormeau/SingleFile/issues.
