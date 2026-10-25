#!/usr/bin/env bash

set -euo pipefail

echo "Use of TuxBlox's online services is subject to the Terms of Use and Privacy Policy."

INSTALLER_VERSION="3.1.0"
ARGS=(--headless --nolaunch)

if ! command -v curl >/dev/null 2>&1; then
    echo "error: curl is required but not found in PATH" >&2
    exit 127
fi

case "$(uname -m)" in
    x86_64|amd64) ARCH="x86_64" ;;
    *)
        echo "error: TuxBlox is only published for x86_64, and this machine is $(uname -m)." >&2
        exit 1
        ;;
esac

HOSTS=(setup-bunny.tuxblox.net setup.tuxblox.net)
ARTIFACT="client/installer/$INSTALLER_VERSION/$ARCH/TuxBloxInstaller"

tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT
installer="$tmpdir/installer"

downloaded=0
for host in "${HOSTS[@]}"; do
    if curl -sSLf \
            --retry 3 --retry-delay 2 \
            --connect-timeout 15 --max-time 300 \
            -o "$installer" \
            "https://$host/$ARTIFACT"; then
        downloaded=1
        break
    fi
    echo "notice: could not download from $host, trying the next one" >&2
done

if [[ $downloaded -eq 0 ]]; then
    echo "error: download failed from every host: ${HOSTS[*]}" >&2
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