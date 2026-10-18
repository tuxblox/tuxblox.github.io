#!/usr/bin/env bash
# Checks what only a browser can: that include.js draws the topbar with its
# icons from this site, that docs search returns results linking to this site,
# and that a sidebar click swaps the docs page in place instead of reloading.
# Builds _site/, serves it, and loads a small page in headless Chromium.
#
#   tools/smoke.sh
#
# Needs chromium.
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

# serve.mjs, not a plain static server: the docs links are extensionless, so
# only Pages-style resolution makes /docs/getting-started/welcome a page
node tools/serve.mjs _site "$port" >/dev/null 2>&1 &
server=$!
trap 'kill "$server" 2>/dev/null; rm -f _site/__smoke.html _site/__smoke-nav.html' EXIT
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

# In-place navigation. Driven inside a same-origin frame so the parent can
# tell a swap from a reload: it stamps a property on the frame's window, and
# a real navigation would replace that window and lose the stamp.
cat > _site/__smoke-nav.html <<'EOF'
<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body>
<iframe id="f" src="/docs/getting-started/welcome" width="1200" height="800"></iframe>
<pre id="out">pending</pre>
<script>
var frame = document.getElementById('f');
var lines = [];

function say(name, value) { lines.push(name + '=' + value); }
function text(doc, sel) { var el = doc.querySelector(sel); return el ? el.textContent.trim() : ''; }
function attr(doc, sel, name) { var el = doc.querySelector(sel); return el ? el.getAttribute(name) : ''; }
function done(why) { if (why) lines.push(why); document.getElementById('out').textContent = lines.join('\n'); }

// docs-nav.js puts tuxbloxDocsNav on the window it runs in, so this waits for
// the frame's own script rather than guessing at a delay.
function until(cond, then, tries) {
  tries = tries || 0;
  if (cond()) { then(); return; }
  if (tries > 120) { done('timeout'); return; }
  setTimeout(function () { until(cond, then, tries + 1); }, 50);
}
function wired() { return !!(frame.contentWindow && frame.contentWindow.tuxbloxDocsNav); }
function at(path) { return function () { return wired() && frame.contentWindow.location.pathname === path; }; }

until(wired, function () {
  frame.contentWindow.__kept = true;
  var link = frame.contentDocument.querySelector('a.docs-link[href="/docs/using-tuxblox/settings/launcher"]');
  if (!link) { done('sidebar-link=missing'); return; }
  link.click();
  until(at('/docs/using-tuxblox/settings/launcher'), afterClick);
});

function afterClick() {
  var doc = frame.contentDocument;
  say('kept', frame.contentWindow.__kept === true);
  say('path', frame.contentWindow.location.pathname);
  say('h1', text(doc, 'article h1'));
  say('active', attr(doc, 'a.docs-link.active', 'href'));
  say('actives', doc.querySelectorAll('a.docs-link.active').length);
  say('title', doc.title);
  say('group', attr(doc, '.docs-tree', 'data-current-group'));
  say('toc', text(doc, '.docs-toc a'));
  say('prev', attr(doc, '.doc-nav-prev', 'href'));
  frame.contentWindow.history.back();
  until(at('/docs/getting-started/welcome'), afterBack);
}

function afterBack() {
  say('backkept', frame.contentWindow.__kept === true);
  say('backh1', text(frame.contentDocument, 'article h1'));
  var next = frame.contentDocument.querySelector('.doc-nav-next');
  if (!next) { done('doc-nav-next=missing'); return; }
  next.click();
  until(at('/docs/getting-started/system-requirements'), afterNext);
}

function afterNext() {
  say('nextkept', frame.contentWindow.__kept === true);
  say('nextpath', frame.contentWindow.location.pathname);
  say('nexth1', text(frame.contentDocument, 'article h1'));
  done();
}
</script>
</body></html>
EOF

dom="$(chromium --headless --disable-gpu --virtual-time-budget=20000 --dump-dom "$origin/__smoke-nav.html" 2>/dev/null)"

check 'kept=true' 'the sidebar click swapped the page instead of reloading'
check 'path=/docs/using-tuxblox/settings/launcher' 'the URL followed the click'
check 'h1=Launcher' 'the article was swapped in'
check 'active=/docs/using-tuxblox/settings/launcher' 'the sidebar marks the new page'
check 'actives=1' 'only the new page is marked'
check 'title=Launcher | TuxBlox Docs' 'the document title followed'
check 'group=using-tuxblox/settings' 'the subcategory the new page sits in was opened'
check 'toc=Launcher theme' 'the on-this-page rail was rebuilt'
check 'prev=/docs/using-tuxblox/the-launcher' 'the prev/next buttons followed'
check 'backkept=true' 'going back did not reload either'
check 'backh1=Welcome to TuxBlox' 'going back restored the article'
check 'nextkept=true' 'the next button swapped the page too'
check 'nextpath=/docs/getting-started/system-requirements' 'the next button moved the URL on'
check 'nexth1=System Requirements' 'the next button swapped the article in'
exit "$fail"
