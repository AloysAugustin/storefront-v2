#!/bin/bash

pushd app
PORT=80
[ "$1" == "" ] || PORT="$1";
echo "$PORT"
python -m SimpleHTTPServer $PORT

