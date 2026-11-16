#!/usr/bin/env bash

set -euo pipefail

echo "Use of TuxBlox's online services is subject to the Terms of Use and Privacy Policy."

# Where the installer sat when one copy served every release that named it. Only reached when the
# channel's current release does not say where its own copy is, which is a release published before
# each one carried its own.
FALLBACK_INSTALLER_VERSION="3.2.0"

CHANNEL="${TUXBLOX_CHANNEL:-${1:-stable}}"

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

tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT
installer="$tmpdir/installer"

# Prints the body from the first host that answers, and nothing at all if none does.
fetch() {
    local artifact="$1" host
    for host in "${HOSTS[@]}"; do
        if curl -sSLf --retry 2 --retry-delay 1 --connect-timeout 15 --max-time 60 \
                "https://$host/$artifact" 2>/dev/null; then
            return 0
        fi
    done
    return 1
}

# Where this channel's current release keeps its own copy of the installer.
#
# Read out of the release file rather than built here: a release publishes its own copy of every
# component, so the release is part of the address and this script cannot know it. Matched on the
# path's own text, which no other component's shares, so the file's layout is not load-bearing.
#
# Newest shape first, and tried in that order rather than taken from wherever it appears in the
# file, so a release that still publishes both addresses is fetched from the one it prefers. The
# first is a directory per release holding bytes and nothing else; the second is where the component
# version was in the address as well.
# Prints "<artifact> <sha256> <size>". All three come out of one match on the same object, so they
# cannot describe different artifacts: a release file whose fields arrive in another order simply
# does not match, and the download then goes unverified rather than being checked against a digest
# belonging to something else. The fields are in alphabetical order because that is how the release
# file is written. Whitespace is stripped first, so how the file is formatted does not matter.
resolve_installer_artifact() {
    local release body flat path pattern claim
    release="$(fetch "client/releases/$CHANNEL/latest" | tr -d '[:space:]')" || return 1
    [[ -n "$release" ]] || return 1
    body="$(fetch "client/releases/$CHANNEL/$release.json")" || return 1
    flat="$(printf '%s' "$body" | tr -d ' \n\r\t')"
    for pattern in "\"releases/[^\"]*/$ARCH/installer\"" \
                   "\"installer/[^\"]*/$ARCH/TuxBloxInstaller\""; do
        path="$(printf '%s' "$body" | grep -oE "$pattern" | tr -d '"' | head -n 1)"
        [[ -n "$path" ]] || continue
        claim="$(printf '%s' "$flat" \
            | grep -oE "\"path\":\"$path\",\"sha256\":\"[0-9a-f]{64}\",\"size\":[0-9]+" | head -n 1)"
        printf 'client/%s %s %s' "$path" \
            "$(printf '%s' "$claim" | grep -oE '[0-9a-f]{64}' | head -n 1)" \
            "$(printf '%s' "$claim" | grep -oE '"size":[0-9]+' | grep -oE '[0-9]+' | head -n 1)"
        return 0
    done
    return 1
}

read -r ARTIFACT WANT_SHA256 WANT_SIZE <<<"$(resolve_installer_artifact || true)"
if [[ -z "$ARTIFACT" ]]; then
    ARTIFACT="client/installer/$FALLBACK_INSTALLER_VERSION/$ARCH/TuxBloxInstaller"
    echo "notice: $CHANNEL does not say where its installer is, using $ARTIFACT" >&2
fi

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

# What the release says these bytes are, checked before anything is run. The release file and the
# installer come from the same hosts over the same TLS, so this is not a signature: it is what stops
# a stale or truncated copy at one edge, or a half-finished download, from being executed. A release
# from before the file stated a digest leaves these empty, and then there is nothing to check
# against; refusing such a release would strand the installs it is the only way to reach.
if [[ -n "${WANT_SIZE:-}" ]]; then
    got_size="$(wc -c <"$installer" | tr -d '[:space:]')"
    if [[ "$got_size" != "$WANT_SIZE" ]]; then
        echo "error: $ARTIFACT is $got_size bytes, the release says $WANT_SIZE" >&2
        exit 1
    fi
fi
if [[ -n "${WANT_SHA256:-}" ]]; then
    if ! command -v sha256sum >/dev/null 2>&1; then
        echo "error: sha256sum is required to check the download, and is not in PATH" >&2
        exit 127
    fi
    got_sha256="$(sha256sum "$installer" | cut -d' ' -f1)"
    if [[ "$got_sha256" != "$WANT_SHA256" ]]; then
        echo "error: $ARTIFACT does not match the checksum the release states for it" >&2
        echo "       expected $WANT_SHA256" >&2
        echo "       got      $got_sha256" >&2
        exit 1
    fi
    echo "Verified the installer against the checksum $CHANNEL $ARTIFACT states."
else
    echo "notice: this release states no checksum for its installer, so it was not checked" >&2
fi

chmod +x "$installer"

# The channel is passed on so the installer installs the one this installer was resolved from.
ARGS=(--headless --nolaunch --channel "$CHANNEL")

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
