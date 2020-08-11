#!/bin/sh
mkdir -p ~/.config/google-chrome/NativeMessagingHosts/
jq '.path= "'$PWD'/singlefile_companion.sh"' singlefile_companion.json > ~/.config/google-chrome/NativeMessagingHosts/singlefile_companion.json