# FAQ

## Does SingleFile upload any data to third-party servers?
As stated in the [privacy policy](https://github.com/gildas-lormeau/SingleFile/blob/master/privacy.md), SingleFile does not upload any data to third-party servers. All the work is done in your browser. However, when you save a page with SingleFile, it can download resources (images, CSS, frame contents, fonts etc.) that are not displayed or not cached but present in the page.

## Why can't I save some pages like https://addons.mozilla.org/en-US/firefox/addon/single-file?
For security purposes, browsers block web extension on certain domains. In particular, this prevents a malicious extension to remove or change bad reviews, for example.

## Why isn't the infobar displayed / Why cannot I save a page from the filesystem in Chrome?
By default, Chrome extensions are not allowed to access to pages stored on the filesystem. Therefore, why you must enable the option "Allow access to file URLs" in the extension page to display the infobar when viewing a saved page, or to save a page stored on the filesystem.

## What are the permissions requested by SingleFile for?
The permissions requested by SingleFile are defined in the [manifest.json](https://github.com/gildas-lormeau/SingleFile/blob/master/manifest.json) file. Below are the reasons why they are necessary.
 - `storage`: allows SingleFile to store your settings.
 - `menus/contextMenus`: allows SingleFile to display an entry in the context menu of web pages.
 - `tabs` (all_urls): allows SingleFile to inject the code needed to process a page in any tab. This permission is needed for saving several tabs in one click among others.
 - `downloads`: allows SingleFile to save pages as if they were downloaded from the web.
 - `clipboardWrite`: allows SingleFile to copy the content of a page into the clipboard instead of saving it on the filesystem.

## SingleFile is slow on my computer/tablet/phone, can it run faster?
The default configuration of SingleFile is optimized to produce small pages. This can sometimes slow down the save process considerably. Below are the options you can disable to save time and CPU.
 - HTML content > remove hidden elements
 - Stylesheets > compress CSS content
 - Stylesheets > remove unused styles

You can also disable the options below. Some resources (e.g. images, frames) on the page may be missing though.
 - HTML content > remove frames
 - Images > save deferred images