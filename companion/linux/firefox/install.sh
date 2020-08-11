#!/bin/sh
mkdir -p ~/.mozilla/native-messaging-hosts/
jq '.path= "'$PWD'/singlefile_companion.sh"' singlefile_companion.json > ~/.mozilla/native-messaging-hosts/singlefile_companion.json