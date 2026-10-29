#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd "$(dirname "$0")" && pwd -P)
GM_SKILLS_LOCAL_SOURCE_DIR=$SCRIPT_DIR
export GM_SKILLS_LOCAL_SOURCE_DIR

exec sh "$SCRIPT_DIR/install.sh" "$@"
