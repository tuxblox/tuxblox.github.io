// Copyright © TuxBlox Project 2026

(function () {
  //const AUTH_URL = 'https://auth.tuxblox.net';
  // This file is loaded by tuxblox.net, by preview and local copies of the
  // site, and by pages on other subdomains through the redirect from the old
  // static. subdomain. Assets are found relative to this file, so each of those
  // loads its own. The docs sit next to /static/ when this file is served from
  // there, and otherwise on tuxblox.net. currentScript is only set while this
  // file first runs, so it is read here, not later.
  const SCRIPT_URL = new URL((document.currentScript && document.currentScript.src) ||
    'https://tuxblox.net/static/scripts/include.js');
  const ASSET_BASE = new URL('../', SCRIPT_URL).href;
  const SITE_ORIGIN = SCRIPT_URL.pathname.startsWith('/static/') ? SCRIPT_URL.origin : 'https://tuxblox.net';
  const DOCS_URL = `${SITE_ORIGIN}/docs`;
  const ICON_BASE = `${ASSET_BASE}images/svg`;
  const THEME_KEY = 'tuxblox_theme';
  const SEARCH_DEBOUNCE_MS = 250;

  const LOGO_DESKTOP = `${ASSET_BASE}images/banner/tuxblox-banner.png`;
  const LOGO_MOBILE = `${ASSET_BASE}images/svg/tuxblox.svg`;

  (function ensureTheme() {
    const root = document.documentElement;
    if (root.getAttribute('data-theme')) return;
    let theme = null;
    try { theme = localStorage.getItem(THEME_KEY); } catch {}
    if (theme !== 'light' && theme !== 'dark') {
      theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
        ? 'light' : 'dark';
    }
    root.setAttribute('data-theme', theme);
  })();

  function releaseThemeTransitionLock() {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.documentElement.classList.remove('theme-init');
      });
    });
  }

  const iconCache = new Map();

  function loadIcon(name) {
    if (iconCache.has(name)) return iconCache.get(name);
    const promise = fetch(`${ICON_BASE}/${name}.svg`)
      .then(r => (r.ok ? r.text() : Promise.reject(new Error(`icon fetch failed: ${name}`))))
      .catch(() => '');
    iconCache.set(name, promise);
    return promise;
  }

  function hydrateIcons(root) {
    root.querySelectorAll('[data-icon]').forEach((el) => {
      const name = el.getAttribute('data-icon');
      loadIcon(name).then((svg) => {
        if (svg) el.innerHTML = svg;
      });
    });
  }

  const currentPath = (function () {
    let p = window.location.pathname;
    if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
    return p || '/';
  })();

  const TEMPLATES = {
    topbar: `
<header class="navbar-floating">
    <div class="nav-left">
        <a href="https://tuxblox.net/" class="nav-brand">
            <img src="${LOGO_MOBILE}" alt="" class="brand-logo-img">
            <span class="brand-name">TuxBlox</span>
        </a>
    </div>

    <div class="nav-search" id="nav-search">
        <span class="icon nav-search-icon" data-icon="search"></span>
        <input type="text" class="nav-search-input" id="nav-search-input" placeholder="Search docs" autocomplete="off" aria-label="Search documentation">
        <span class="kbd">Ctrl K</span>
        <div class="nav-search-results" id="nav-search-results" hidden></div>
    </div>

    <nav class="navbar-links">
        <a href="https://tuxblox.net/" class="nav-btn" data-route="/">Home</a>
        <a href="https://tuxblox.net/releases" class="nav-btn" data-route="/releases">Download</a>
        <a href="${DOCS_URL}" class="nav-btn" data-route="/docs">Learn</a>

        <span class="nav-sep"></span>

        <button type="button" class="nav-icon-btn theme-toggle-btn" id="theme-toggle-btn" title="Switch between light and dark" aria-label="Switch between light and dark">
            <span class="icon icon-sun" data-icon="sun"></span><span class="icon icon-moon" data-icon="moon"></span>
        </button>

        <a href="https://tuxblox.net/discord" target="_blank" rel="noopener" class="nav-icon-btn" title="Discord" aria-label="Discord"><span class="icon" data-icon="discord"></span></a>
        <a href="https://tuxblox.net/gitlab" target="_blank" rel="noopener" class="nav-icon-btn" title="Source code on GitLab" aria-label="Source code on GitLab"><span class="icon" data-icon="gitlab"></span></a>
        <a href="https://tuxblox.net/github" target="_blank" rel="noopener" class="nav-icon-btn" title="Source code on GitHub" aria-label="Source code on GitHub"><span class="icon" data-icon="github"></span></a>

        <button type="button" class="nav-icon-btn nav-toggle" id="nav-toggle" title="Menu" aria-label="Menu" aria-expanded="false" aria-controls="nav-panel">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
        </button>
    </nav>
</header>

<div class="nav-panel" id="nav-panel">
    <a href="https://tuxblox.net/" class="nav-btn">Home</a>
    <a href="https://tuxblox.net/releases" class="nav-btn">Download</a>
    <a href="${DOCS_URL}" class="nav-btn">Learn</a>
    <div class="nav-search" id="mobile-search">
        <span class="icon nav-search-icon" data-icon="search"></span>
        <input type="text" class="nav-search-input" id="mobile-search-input" placeholder="Search docs" autocomplete="off" aria-label="Search documentation">
        <div class="nav-search-results" id="mobile-search-results" hidden></div>
    </div>
</div>
`,
    footer: `
<!--section class="disclaimer-box">
    <h4>Disclaimer</h4>
    <p>TuxBlox is an independent compatibility tool intended for personal use. It is not affiliated or associated with Roblox Corporation in any way.</p>
</section-->

<footer>
    <div>&copy; 2026 TuxBlox Project</div>
    <div class="disclaimer">TuxBlox is an independent, open-source project. It is not affiliated with, authorized, or endorsed by Roblox Corporation.</div>
</footer>
`
  };

  function esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function getAuth() {
    try { return JSON.parse(localStorage.getItem('tuxblox_auth') || 'null'); }
    catch { return null; }
  }

  function renderPill(auth) {
    const pillEl = document.getElementById('nav-auth-pill');
    if (!pillEl) return;

    if (true) {
      pillEl.innerHTML = "";
      return;
    }

    if (!auth) {
      pillEl.innerHTML = '<a href="/login" class="nav-btn nav-login-pill">Login</a>';
      return;
    }

    const avatar = auth.avatarUrl
      ? `<img src="${esc(auth.avatarUrl)}" class="nav-user-avatar" onerror="this.style.display='none'" alt="">`
      : '';
    const display = esc(auth.robloxDisplayName || auth.username || '');
    const uname   = esc(auth.robloxUsername   || auth.username || '');

    pillEl.innerHTML = `
      <div class="nav-user-pill" id="nav-user-pill-wrap">
        ${avatar}
        <div class="nav-user-info">
          <span class="nav-user-display">${display}</span>
          <span class="nav-user-name">@${uname}</span>
        </div>
        <button class="nav-logout-btn" id="nav-logout-btn" title="Log out">&#x2715;</button>
      </div>`;

    /*document.getElementById('nav-logout-btn').addEventListener('click', async () => {
      try {
        await fetch(`${AUTH_URL}/api/logout`, { method: 'POST', credentials: 'include' });
      } catch {}
      localStorage.removeItem('tuxblox_auth');
      window.location.href = '/';
    });*/
  }

  const THEME_COLORS = { dark: '#0e1117', light: '#ffffff' };

  function syncThemeColor(theme) {
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', THEME_COLORS[theme] || THEME_COLORS.dark);
  }

  function setupThemeToggle() {
    syncThemeColor(document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark');

    const btn = document.getElementById('theme-toggle-btn');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      const next = current === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      syncThemeColor(next);
      try { localStorage.setItem(THEME_KEY, next); } catch {}
    });
  }

  function setupNavPanel() {
    const btn = document.getElementById('nav-toggle');
    const panel = document.getElementById('nav-panel');
    if (!btn || !panel) return;

    function close() {
      panel.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = panel.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    panel.addEventListener('click', (e) => e.stopPropagation());
    document.addEventListener('click', close);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    window.addEventListener('resize', () => { if (window.innerWidth > 780) close(); });
  }

  function setupSearchShortcut() {
    document.addEventListener('keydown', (e) => {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'k') return;
      const desktop = document.getElementById('nav-search-input');
      const mobile = document.getElementById('mobile-search-input');
      const target = (desktop && desktop.offsetParent !== null) ? desktop : mobile;
      if (!target) return;
      e.preventDefault();
      if (target === mobile) {
        const panel = document.getElementById('nav-panel');
        const btn = document.getElementById('nav-toggle');
        if (panel) panel.classList.add('open');
        if (btn) btn.setAttribute('aria-expanded', 'true');
      }
      target.focus();
      target.select();
    });
  }

  function setupDocsSearch() {
    const desktopInput = document.getElementById('nav-search-input');
    const mobileInput = document.getElementById('mobile-search-input');
    const desktopResults = document.getElementById('nav-search-results');
    const mobileResults = document.getElementById('mobile-search-results');
    
    const inputs = [desktopInput, mobileInput].filter(Boolean);
    const resultsEls = [desktopResults, mobileResults].filter(Boolean);
    
    if (!inputs.length || !resultsEls.length) return;

    let debounceTimer = null;
    let currentQuery = '';
    let searchReady = null;

    // The search code and the index load once, on first use. A failure is not
    // kept, so the next search tries again.
    function loadSearch() {
      if (!searchReady) {
        const script = window.tuxbloxDocsSearch ? Promise.resolve() : new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = `${ASSET_BASE}scripts/docs-search.js?v=20260923`;
          s.onload = resolve;
          s.onerror = () => reject(new Error('search script failed to load'));
          document.head.appendChild(s);
        });
        const index = fetch(`${DOCS_URL}/search-index.json`)
          .then(r => r.ok ? r.json() : Promise.reject(new Error('bad response')));
        searchReady = Promise.all([script, index]).then(([, entries]) => entries);
        searchReady.catch(() => { searchReady = null; });
      }
      return searchReady;
    }

    function closeResults() {
      resultsEls.forEach(el => {
        el.hidden = true;
        el.innerHTML = '';
      });
    }

    function renderResults(query, results) {
      if (query !== currentQuery) return;

      const html = !results.length
        ? `<div class="nav-search-empty">No results for "${esc(query)}"</div>`
        : results.map(r => {
            const path = r.urlPath || '';
            const href = new URL(path, DOCS_URL).href;
            return `
            <a class="nav-search-result" href="${esc(href)}">
              <span class="nav-search-result-title">${esc(r.title)}</span>
              <span class="nav-search-result-snippet">${esc(r.snippet)}</span>
            </a>
          `;
          }).join('');

      resultsEls.forEach(el => {
        el.innerHTML = html;
        el.hidden = false;
      });
    }

    function runSearch(query) {
      currentQuery = query;

      if (!query || query.trim().length < 2) {
        closeResults();
        return;
      }

      const loadingHtml = `<div class="nav-search-empty">Searching...</div>`;
      resultsEls.forEach(el => {
        el.innerHTML = loadingHtml;
        el.hidden = false;
      });

      // renderResults drops answers to a query that is no longer current, which
      // is all the old request aborting was for.
      loadSearch()
        .then(entries => renderResults(query, window.tuxbloxDocsSearch.searchDocs(entries, query.slice(0, 200))))
        .catch(() => {
          if (query === currentQuery) {
            const errorHtml = `<div class="nav-search-empty">Couldn't reach search right now.</div>`;
            resultsEls.forEach(el => {
              el.innerHTML = errorHtml;
              el.hidden = false;
            });
          }
        });
    }

    inputs.forEach(input => {
      input.addEventListener('input', () => {
        const value = input.value;
        inputs.forEach(other => { if (other !== input) other.value = value; });
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => runSearch(value), SEARCH_DEBOUNCE_MS);
      });

      input.addEventListener('focus', () => {
        loadSearch().catch(() => {});
        if (input.value.trim().length >= 2) runSearch(input.value);
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          closeResults();
          input.blur();
        }
      });
    });

    document.addEventListener('click', (e) => {
      const desktopWrap = document.getElementById('nav-search');
      const mobileWrap = document.getElementById('mobile-search');
      const clickedInside = (desktopWrap && desktopWrap.contains(e.target)) ||
                            (mobileWrap && mobileWrap.contains(e.target));
      if (!clickedInside) closeResults();
    });
  }

  function syncHeaderHeight() {
    const header = document.querySelector('header.navbar-floating');
    if (!header) return;
    document.documentElement.style.setProperty('--header-h', `${header.offsetHeight}px`);
  }

  function safe(label, fn) {
    try {
      fn();
    } catch (err) {
      console.error(`[include.js] ${label} failed:`, err);
    }
  }

  function loadIncludes() {
    document.querySelectorAll('[data-include]').forEach((el) => {
      const key = el.getAttribute('data-include');
      const html = TEMPLATES[key];
      if (!html) { console.warn(`[include.js] No template found for "${key}"`); return; }
      el.innerHTML = html;
    });

    safe('activeRoute', () => {
      document.querySelectorAll('.navbar-links .nav-btn[data-route], .navbar-links .nav-icon-btn[data-route]').forEach((btn) => {
        const route = btn.getAttribute('data-route');
        if (currentPath === route || currentPath === route + '.html') btn.classList.add('active');
      });
    });

    safe('hydrateIcons', () => hydrateIcons(document));
    safe('themeToggle', setupThemeToggle);
    safe('navPanel', setupNavPanel);
    safe('docsSearch', setupDocsSearch);
    safe('searchShortcut', setupSearchShortcut);

    syncHeaderHeight();
    window.addEventListener('resize', () => {
      clearTimeout(loadIncludes._resizeTimer);
      loadIncludes._resizeTimer = setTimeout(syncHeaderHeight, 150);
    });

    const MAIN_HOSTS = ['tuxblox.net', 'www.tuxblox.net'];
    if (MAIN_HOSTS.includes(window.location.hostname)) {
      renderPill(getAuth());
      syncHeaderHeight();
    }

    /*fetch(`${AUTH_URL}/api/verify`, { credentials: 'include' })
      .then(async r => {
        if (r.ok) {
          const data = await r.json();
          if (data.authenticated) {
            const authData = {
              username: data.username,
              robloxId: data.robloxId,
              robloxUsername: data.robloxUsername,
              robloxDisplayName: data.robloxDisplayName,
              avatarUrl: data.avatarUrl,
            };
            try { localStorage.setItem('tuxblox_auth', JSON.stringify(authData)); } catch {}
            renderPill(authData);
          } else {
            try { localStorage.removeItem('tuxblox_auth'); } catch {}
            renderPill(null);
          }
        } else {
          try { localStorage.removeItem('tuxblox_auth'); } catch {}
          renderPill(null);
        }
        syncHeaderHeight();
      })
      .catch(() => {});*/

    document.dispatchEvent(new CustomEvent('includes:loaded'));
  }

  function boot() {
    try {
      loadIncludes();
    } finally {
      releaseThemeTransitionLock();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
