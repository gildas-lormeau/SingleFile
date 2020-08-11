#!/bin/sh
mkdir -p ~/Library/Application Support/Google/Chrome/NativeMessagingHosts/
jq '.path= "'$PWD'/singlefile_companion.sh"' singlefile_companion.json > ~/Library/Application Support/Google/Chrome/NativeMessagingHosts/singlefile_companion.json