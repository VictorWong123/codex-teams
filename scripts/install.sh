#!/bin/sh
set -eu
exec node "$(dirname "$0")/../src/cli.js" install "$@"
