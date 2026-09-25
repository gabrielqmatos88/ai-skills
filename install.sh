#!/bin/sh

set -eu

REPOSITORY='https://raw.githubusercontent.com/gabrielqmatos88/ai-skills/refs/heads/main'
NODE_VERSION='v24.21.0'
NODE_ARCHIVE="node-${NODE_VERSION}-linux-x64.tar.xz"
NODE_HOME="$HOME/.local/share/gm-skills/node-${NODE_VERSION}-linux-x64"
APP_DIR="$HOME/.local/share/gm-skills"
BIN_DIR="$HOME/.local/bin"
LAUNCHER="$BIN_DIR/gm-skills"

say_error() {
  printf 'Error: %s\n' "$1" >&2
}

cleanup() {
  if [ -n "${WORK_DIR:-}" ] && [ -d "$WORK_DIR" ]; then
    rm -rf "$WORK_DIR"
  fi
}

trap cleanup EXIT
trap 'exit 1' HUP INT TERM

version_is_supported() {
  awk -F. -v version="$1" 'BEGIN {
    if (version !~ /^[0-9]+\.[0-9]+\.[0-9]+$/) exit 1
    split(version, parts, ".")
    if (parts[1] > 20 || (parts[1] == 20 && parts[2] >= 12)) exit 0
    exit 1
  }'
}

find_supported_node() {
  if ! command -v node >/dev/null 2>&1; then
    return 1
  fi
  NODE_BIN=$(command -v node)
  NODE_ACTUAL_VERSION=$("$NODE_BIN" -p 'process.versions.node' 2>/dev/null || true)
  [ -n "$NODE_ACTUAL_VERSION" ] && version_is_supported "$NODE_ACTUAL_VERSION"
}

if ! command -v curl >/dev/null 2>&1; then
  say_error 'curl is required to download the installer files.'
  exit 1
fi

if [ -x "$NODE_HOME/bin/node" ]; then
  PATH="$NODE_HOME/bin:$PATH"
  export PATH
fi

if ! find_supported_node || ! command -v npm >/dev/null 2>&1; then
  printf 'Node.js >=20.12.0 and npm are required. Install Node.js %s locally? [y/N] ' "$NODE_VERSION"
  if [ ! -r /dev/tty ]; then
    printf '\n'
    say_error 'No terminal is available to answer. Install Node.js and npm, then rerun this installer.'
    exit 1
  fi
  IFS= read -r answer </dev/tty || answer=''
  case "$answer" in
    y|Y|yes|YES|Yes) ;;
    *)
      printf 'Node.js installation declined; nothing was installed.\n'
      exit 0
      ;;
  esac

  if [ "$(uname -s)" != 'Linux' ] || [ "$(uname -m)" != 'x86_64' ]; then
    say_error 'The bundled Node.js download supports Linux x86_64 only.'
    exit 1
  fi
  if ! command -v tar >/dev/null 2>&1; then
    say_error 'tar is required to unpack Node.js.'
    exit 1
  fi
  if command -v sha256sum >/dev/null 2>&1; then
    CHECKSUM_COMMAND='sha256sum'
  elif command -v shasum >/dev/null 2>&1; then
    CHECKSUM_COMMAND='shasum'
  else
    say_error 'sha256sum or shasum is required to verify the Node.js download.'
    exit 1
  fi

  WORK_DIR=$(mktemp -d "${TMPDIR:-/tmp}/gm-skills-install.XXXXXX")
  printf 'Downloading Node.js %s...\n' "$NODE_VERSION"
  curl -fsSL "https://nodejs.org/dist/${NODE_VERSION}/${NODE_ARCHIVE}" -o "$WORK_DIR/$NODE_ARCHIVE"
  curl -fsSL "https://nodejs.org/dist/${NODE_VERSION}/SHASUMS256.txt" -o "$WORK_DIR/SHASUMS256.txt"
  EXPECTED_CHECKSUM=$(awk -v archive="$NODE_ARCHIVE" '$2 == archive { print $1; exit }' "$WORK_DIR/SHASUMS256.txt")
  if [ -z "$EXPECTED_CHECKSUM" ]; then
    say_error 'Node.js checksum was not found in the official checksum list.'
    exit 1
  fi
  if [ "$CHECKSUM_COMMAND" = 'sha256sum' ]; then
    printf '%s  %s\n' "$EXPECTED_CHECKSUM" "$WORK_DIR/$NODE_ARCHIVE" | sha256sum -c - >/dev/null
  else
    printf '%s  %s\n' "$EXPECTED_CHECKSUM" "$WORK_DIR/$NODE_ARCHIVE" | shasum -a 256 -c - >/dev/null
  fi

  mkdir -p "$(dirname "$NODE_HOME")"
  mkdir "$WORK_DIR/node"
  tar -xJf "$WORK_DIR/$NODE_ARCHIVE" --strip-components=1 -C "$WORK_DIR/node"
  if [ -d "$NODE_HOME" ]; then
    rm -rf "$NODE_HOME"
  fi
  mv "$WORK_DIR/node" "$NODE_HOME"
  PATH="$NODE_HOME/bin:$PATH"
  export PATH
  printf 'Node.js %s installed in %s\n' "$NODE_VERSION" "$NODE_HOME"
fi

if ! command -v npm >/dev/null 2>&1; then
  say_error 'npm was not found after Node.js setup.'
  exit 1
fi

WORK_DIR=${WORK_DIR:-$(mktemp -d "${TMPDIR:-/tmp}/gm-skills-install.XXXXXX")}
mkdir -p "$APP_DIR" "$BIN_DIR"
printf 'Downloading gm-skills...\n'
curl -fsSL "$REPOSITORY/skills.js" -o "$WORK_DIR/skills.js"
curl -fsSL "$REPOSITORY/package.json" -o "$WORK_DIR/package.json"
mv "$WORK_DIR/skills.js" "$APP_DIR/skills.js"
mv "$WORK_DIR/package.json" "$APP_DIR/package.json"

if [ -x "$NODE_HOME/bin/node" ]; then
  PATH="$NODE_HOME/bin:$PATH"
  export PATH
fi
npm install --prefix "$APP_DIR" --omit=dev --no-audit --no-fund

cat >"$WORK_DIR/gm-skills" <<'LAUNCHER'
#!/bin/sh
APP_DIR="$HOME/.local/share/gm-skills"
NODE_HOME="$APP_DIR/node-v24.21.0-linux-x64/bin"
if [ -x "$NODE_HOME/node" ]; then
  PATH="$NODE_HOME:$PATH"
  export PATH
fi
exec node "$APP_DIR/skills.js" "$@"
LAUNCHER
chmod 755 "$WORK_DIR/gm-skills"
mv "$WORK_DIR/gm-skills" "$LAUNCHER"

printf '\ngm-skills was installed successfully.\n'
if ! printf '%s' ":$PATH:" | grep -Fq ":$BIN_DIR:"; then
  printf 'Add this to your shell profile to run it as gm-skills: export PATH="%s:$PATH"\n' "$BIN_DIR"
  printf 'Or run it directly: %s\n' "$LAUNCHER"
else
  printf 'Run gm-skills from any project directory to install skills there.\n'
fi
