#!/usr/bin/env bash
# Checks what only a browser can: that include.js draws the topbar with its
# icons from this site, and that docs search returns results linking to this
# site. Builds _site/, serves it, and loads a small page in headless Chromium.
#
#   tools/smoke.sh
#
# Needs chromium and python3.
set -euo pipefail
cd "$(dirname "$0")/.."

node build/build.mjs >/dev/null

port=8765
origin="http://127.0.0.1:$port"

cat > _site/__smoke.html <<'EOF'
<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body>
<div data-include="topbar"></div>
<script src="/static/scripts/include.js?v=smoke" defer></script>
<script>
document.addEventListener('includes:loaded', function () {
  var input = document.getElementById('nav-search-input');
  input.value = 'install';
  input.dispatchEvent(new Event('input'));
});
</script>
</body></html>
EOF

python3 -m http.server "$port" --bind 127.0.0.1 -d _site >/dev/null 2>&1 &
server=$!
trap 'kill "$server" 2>/dev/null; rm -f _site/__smoke.html' EXIT
sleep 1

dom="$(chromium --headless --disable-gpu --virtual-time-budget=5000 --dump-dom "$origin/__smoke.html" 2>/dev/null)"

fail=0
check() {
  if grep -qF "$1" <<<"$dom"; then echo "ok   $2"; else echo "FAIL $2"; fail=1; fi
}
check 'data-icon="search"><svg' 'topbar icons loaded from this site'
check "src=\"$origin/static/images/svg/tuxblox.svg\"" 'logo points at this site'
check 'nav-search-result-title">Installing TuxBlox<' 'search found "Installing TuxBlox"'
check "href=\"$origin/docs/getting-started/installing-tuxblox\"" 'search results link to this site'
exit "$fail"
