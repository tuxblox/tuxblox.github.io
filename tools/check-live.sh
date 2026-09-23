#!/usr/bin/env bash
# Checks the URLs the TuxBlox app, its build and its READMEs hard-code, on a
# given origin. With --redirects it also checks the Cloudflare redirect rules,
# which only exist on the real domain.
#
#   tools/check-live.sh https://next.tuxblox.net
#   tools/check-live.sh https://tuxblox.net --redirects
set -uo pipefail
cd "$(dirname "$0")/.."

origin="${1:?usage: tools/check-live.sh <origin> [--redirects]}"
origin="${origin%/}"
fail=0

status() {  # path expected-code
  local got
  got="$(curl -s -o /dev/null -w '%{http_code}' "$origin$1")"
  if [[ "$got" == "$2" ]]; then echo "ok   $1 -> $got"; else echo "FAIL $1 -> $got, expected $2"; fail=1; fi
}

# The target is what matters; any redirect status (301, 302, 307, 308) is
# accepted, since Cloudflare rules and GitHub pick their own. The second
# argument is kept as documentation of what the old server sent.
redirect() {  # full-url old-server-code expected-location
  local out code loc
  out="$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' "$1")"
  code="${out%% *}"; loc="${out#* }"
  if [[ "$code" =~ ^30[1278]$ && "$loc" == "$3" ]]; then echo "ok   $1 -> $code $loc"
  else echo "FAIL $1 -> $code $loc, expected a redirect to $3"; fail=1; fi
}

for p in / /releases /privacy /docs/getting-started/welcome /docs/search-index.json \
         /install.sh /robots.txt /sitemap.xml /favicon.ico /.well-known/security.txt \
         /static/images/icon/tuxblox-icon.png /static/images/banner/tuxblox-banner.png \
         /static/scripts/include.js /static/scripts/docs-search.js; do
  status "$p" 200
done
status /parity-check-missing-page 404
status /docs 301
status /docs/getting-started 301

if curl -fsSL "$origin/install.sh" | cmp -s - site/install.sh; then echo "ok   install.sh matches site/install.sh"
else echo "FAIL install.sh differs from site/install.sh"; fail=1; fi

if [[ "${2:-}" == "--redirects" ]]; then
  redirect https://tuxblox.net/discord 302 https://discord.gg/QkgBMMMwdW
  redirect https://tuxblox.net/github 302 https://github.com/cherrypath0/tuxblox
  redirect https://tuxblox.net/github/issues 302 https://github.com/cherrypath0/tuxblox/issues
  redirect https://tuxblox.net/gitlab/-/issues 302 https://gitlab.com/cherrypath0/tuxblox/-/issues
  redirect https://tuxblox.net/security.txt 302 https://tuxblox.net/.well-known/security.txt
  redirect https://www.tuxblox.net/releases 301 https://tuxblox.net/releases
  redirect https://static.tuxblox.net/images/icon/tuxblox-icon.png 301 https://tuxblox.net/static/images/icon/tuxblox-icon.png
  redirect https://static.tuxblox.net/images/banner/tuxblox-banner.png 301 https://tuxblox.net/static/images/banner/tuxblox-banner.png
fi

exit "$fail"
