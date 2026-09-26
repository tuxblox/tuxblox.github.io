#!/usr/bin/env bash

set -euo pipefail

URL="https://setup.tuxblox.net/v1/stable/2.7.3/installer"
ARGS=(--headless --nolaunch)

if ! command -v curl >/dev/null 2>&1; then
    echo "error: curl is required but not found in PATH" >&2
    exit 127
fi

tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT
installer="$tmpdir/installer"

if ! curl -sSLf \
        --retry 3 --retry-delay 2 \
        --connect-timeout 15 --max-time 300 \
        -o "$installer" \
        "$URL"; then
    echo "error: download failed from $URL" >&2
    exit 1
fi

if [[ ! -s "$installer" ]]; then
    echo "error: downloaded file is empty" >&2
    exit 1
fi

chmod +x "$installer"

set +e
"$installer" "${ARGS[@]}" 2>&1
status=$?
set -e

if [[ $status -eq 0 ]]; then
    echo ">>> Installer finished successfully"
else
    echo ">>> Installer exited with status $status" >&2
fi

exit "$status"