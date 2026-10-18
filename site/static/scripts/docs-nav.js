// Copyright © TuxBlox Project 2026

// The docs rail's behaviour, and only the parts that cannot be decided at
// build time: a reader's remembered collapse choices, which heading the
// right-hand rail highlights as the page scrolls, and the phone drawer.
//
// The sidebar itself is rendered by build/docs.mjs with the right subcategory
// already open, so a page is navigable before this file runs -- and still
// navigable if it never does. The <noscript> rules in the docs template put
// the rail back as a plain block for that case, which matters more here than
// on most sites: the topbar is injected by include.js, so with scripting off
// this sidebar is the whole of the navigation.
(function (root) {
    'use strict';

    const KEY = 'tuxblox_docs_groups';

    // Storage is absent in a private window, and throws outright when site
    // data is blocked. Neither is an error here -- the reader just gets the
    // build's default open state.
    function readState(storage) {
        try {
            const parsed = JSON.parse(storage.getItem(KEY));
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
            return parsed;
        } catch {
            return {};
        }
    }

    // Written whole rather than merged, so a subcategory that no longer
    // exists stops being remembered the next time anything is toggled.
    function writeState(storage, state) {
        try {
            storage.setItem(KEY, JSON.stringify(state));
        } catch {
            /* blocked storage: the choice just does not outlive the page */
        }
    }

    // The remembered choice loses to the page you are on. A sidebar that
    // hides where you are is worse than one that forgets a preference.
    function applyState(groups, state, currentGroup) {
        for (const details of groups) {
            const name = details.dataset.group;
            if (name === currentGroup) {
                details.open = true;
            } else if (typeof state[name] === 'boolean') {
                details.open = state[name];
            }
        }
    }

    // What to store after a toggle. The subcategory holding the current page
    // was forced open by applyState, not chosen by the reader, so its stored
    // value is left alone unless this toggle is that element's own.
    function nextState(prev, groups, currentGroup, toggled) {
        const next = {};
        for (const details of groups) {
            const name = details.dataset.group;
            if (name === currentGroup && details !== toggled && typeof prev[name] === 'boolean') {
                next[name] = prev[name];
            } else {
                next[name] = details.open;
            }
        }
        return next;
    }

    // A built docs page, as opposed to one of the directory redirect pages
    // the build writes for /docs and each section: those hold a meta refresh
    // and no article, so swapping one in would leave the reader with nothing.
    function isDocsPage(pathname) {
        return pathname.startsWith('/docs/')
            && !pathname.endsWith('/')
            && pathname.split('/').length >= 4;
    }

    // Where a click should take the reader, or null to let the browser do
    // what it always did. Every link stays a real link, so the whole of the
    // browser's own handling -- middle click, ctrl click, the right-click
    // menu, "open in new tab", copying the address -- is left alone, and
    // anything this cannot swap is simply loaded the ordinary way.
    function swapTarget(link, click, here) {
        if (click.defaultPrevented || click.button !== 0) return null;
        if (click.ctrlKey || click.metaKey || click.shiftKey || click.altKey) return null;
        if (link.download) return null;
        if (link.target && link.target !== '_self') return null;

        let current, url;
        try {
            current = new URL(here);
            url = new URL(link.href, current);
        } catch {
            return null;
        }
        if (url.origin !== current.origin) return null;
        if (!isDocsPage(url.pathname)) return null;
        // a jump inside the page already open is the browser's to make: it
        // scrolls and adds the history entry without any of this
        if (url.pathname === current.pathname && url.search === current.search) return null;
        return url.href;
    }

    // The earliest heading inside the observer band. Between two headings the
    // band is empty, so the previous pick stands rather than the rail going
    // blank for the gap.
    function pickActive(order, visible, previous) {
        for (const id of order) {
            if (visible.has(id)) return id;
        }
        return previous;
    }

    // Where Tab should land to keep focus inside the open drawer. null means
    // the browser's own order is already fine.
    function focusWrap(target, shiftKey, first, last, inRail) {
        if (!inRail) return first;
        if (shiftKey && target === first) return last;
        if (!shiftKey && target === last) return first;
        return null;
    }

    function wire() {
        const rail = document.getElementById('docs-rail');
        if (!rail) return;

        const tree = rail.querySelector('.docs-tree');
        const groups = Array.prototype.slice.call(rail.querySelectorAll('details[data-group]'));
        // not const: a page swapped in without a reload changes which
        // subcategory the reader is in, and the toggle listeners below read
        // this at the moment they fire rather than when they are attached
        let currentGroup = tree?.dataset.currentGroup || '';
        const storage = (function () {
            try { return window.localStorage; } catch { return null; }
        })();

        if (storage) {
            applyState(groups, readState(storage), currentGroup);
            for (const details of groups) {
                details.addEventListener('toggle', function () {
                    writeState(storage, nextState(readState(storage), groups, currentGroup, details));
                });
            }
        }

        // Bring the current page into view inside the rail without moving the
        // page itself, which scrollIntoView would do.
        const active = rail.querySelector('.docs-link.active');
        if (active) {
            const offset = active.offsetTop - rail.clientHeight / 2;
            rail.scrollTop = Math.max(0, offset);
        }

        setupToc();
        const closeDrawer = setupDrawer(rail);
        setupSwap({
            rail: rail,
            tree: tree,
            groups: groups,
            storage: storage,
            closeDrawer: closeDrawer,
            setGroup: function (name) { currentGroup = name; },
        });
    }

    // Held so a page swapped in can drop the observer watching the headings
    // of the page that has gone.
    let tocObserver = null;

    function setupToc() {
        if (tocObserver) {
            tocObserver.disconnect();
            tocObserver = null;
        }
        const links = Array.prototype.slice.call(document.querySelectorAll('.docs-toc a[href^="#"]'));
        if (links.length === 0 || typeof IntersectionObserver === 'undefined') return;

        // Document order comes from the TOC itself, which the build emits in
        // order -- no need to compare node positions at runtime.
        const order = [];
        const linkById = new Map();
        const headings = [];
        for (const link of links) {
            const id = decodeURIComponent(link.getAttribute('href').slice(1));
            const heading = document.getElementById(id);
            if (!heading) continue;
            order.push(id);
            linkById.set(id, link);
            headings.push(heading);
        }
        if (order.length === 0) return;

        const visible = new Set();
        let active = null;
        function highlight() {
            active = pickActive(order, visible, active);
            for (const [id, link] of linkById) link.classList.toggle('active', id === active);
        }

        // The band is offset by the real topbar height rather than a literal,
        // so a taller topbar does not shift the reading line.
        const headerH = parseInt(getComputedStyle(document.documentElement)
            .getPropertyValue('--header-h'), 10) || 60;
        tocObserver = new IntersectionObserver(function (entries) {
            for (const entry of entries) {
                if (entry.isIntersecting) visible.add(entry.target.id);
                else visible.delete(entry.target.id);
            }
            highlight();
        }, { rootMargin: `-${headerH + 20}px 0px -70% 0px`, threshold: 0 });

        for (const heading of headings) tocObserver.observe(heading);
        highlight();
    }

    // --- swapping a page in, without reloading ----------------------------
    //
    // Everything that differs between two docs pages sits in .docs-content
    // (the article, and the prev/next buttons under it) and .docs-aside (the
    // on this page rail), so a click fetches the page it points at and moves
    // those two across. The topbar, the sidebar, how far the sidebar is
    // scrolled and the reader's collapse choices all stay as they were, which
    // is the whole reason not to reload.
    //
    // None of this changes the markup the build writes. Every link is still a
    // real link to a real page, so a new tab, a new window, the right-click
    // menu and a reader with no scripting at all are untouched -- and
    // anything this cannot do falls back to loading the page the old way.
    function setupSwap(ctx) {
        if (typeof fetch !== 'function' || typeof DOMParser === 'undefined'
            || typeof window.history?.pushState !== 'function') return;

        const content = document.querySelector('.docs-content');
        const aside = document.querySelector('.docs-aside');
        if (!content || !aside) return;

        const cache = new Map();
        let shown = location.pathname;
        let latest = 0;

        // What a fetched page contributes. A response without these is not a
        // docs page -- the 404 page, or one of the directory redirect pages --
        // and the caller hands it back to the browser instead of showing a
        // reader an empty article.
        function partsOf(doc) {
            const nextContent = doc.querySelector('.docs-content');
            const nextAside = doc.querySelector('.docs-aside');
            const nextTree = doc.querySelector('.docs-tree');
            if (!nextContent || !nextAside || !nextTree) return null;
            return {
                content: nextContent.innerHTML,
                aside: nextAside.innerHTML,
                group: nextTree.getAttribute('data-current-group') || '',
                title: doc.title,
            };
        }

        // Kept per path, so going back over pages already read costs nothing.
        function fetchParts(pathname) {
            if (cache.has(pathname)) return Promise.resolve(cache.get(pathname));
            return fetch(pathname, { credentials: 'same-origin' })
                .then(function (response) { return response.ok ? response.text() : null; })
                .then(function (html) {
                    if (html === null) return null;
                    const parts = partsOf(new DOMParser().parseFromString(html, 'text/html'));
                    if (parts) cache.set(pathname, parts);
                    return parts;
                })
                .catch(function () { return null; });
        }

        function headingFor(hash) {
            if (!hash) return null;
            let id;
            try { id = decodeURIComponent(hash.slice(1)); } catch { id = hash.slice(1); }
            return document.getElementById(id);
        }

        function show(parts, url) {
            content.innerHTML = parts.content;
            aside.innerHTML = parts.aside;
            document.title = parts.title;
            shown = url.pathname;

            for (const link of ctx.rail.querySelectorAll('a.docs-link')) {
                link.classList.toggle('active', new URL(link.href).pathname === url.pathname);
            }
            if (ctx.tree) ctx.tree.setAttribute('data-current-group', parts.group);
            ctx.setGroup(parts.group);
            // the same forcing open the build does for a page loaded whole:
            // the subcategory the reader is now in wins over what they chose
            applyState(ctx.groups, ctx.storage ? readState(ctx.storage) : {}, parts.group);

            setupToc();
            ctx.closeDrawer();
            // include.js only closes the search dropdown for a click outside
            // it, because until now a click on a result took the page away.
            for (const results of document.querySelectorAll('.nav-search-results')) results.hidden = true;

            // A different page starts at the top of itself, or at the heading
            // the link asked for.
            const heading = headingFor(url.hash);
            if (heading) heading.scrollIntoView();
            else window.scrollTo(0, 0);

            // Without this a screen reader carries on in a page that is no
            // longer there, and the keyboard is left wherever the old one put
            // it. preventScroll keeps it from undoing the line above.
            const article = content.querySelector('article');
            if (article) {
                article.tabIndex = -1;
                article.focus({ preventScroll: true });
            }
        }

        function go(href, push) {
            const url = new URL(href);
            const mine = ++latest;
            fetchParts(url.pathname).then(function (parts) {
                if (mine !== latest) return;            // a later click got there first
                if (!parts) {
                    location.href = href;               // let the browser have it
                    return;
                }
                if (push) history.pushState({ docsSwap: true }, '', href);
                show(parts, url);
            });
        }

        // Delegated, so the sidebar, the prev/next buttons, the search
        // results and links between pages in the text all go the same way,
        // including any the swap itself writes into the article.
        document.addEventListener('click', function (event) {
            const link = event.target?.closest?.('a[href]');
            if (!link) return;
            const href = swapTarget(
                { href: link.href, target: link.target, download: link.hasAttribute('download') },
                event,
                location.href);
            if (!href) return;
            event.preventDefault();
            go(href, true);
        });

        window.addEventListener('popstate', function () {
            // a jump between headings of the page already shown is the
            // browser's to undo, and redrawing would throw away its scrolling
            if (location.pathname === shown) return;
            if (!isDocsPage(location.pathname)) {
                location.reload();
                return;
            }
            go(location.href, false);
        });
    }

    function setupDrawer(rail) {
        const toggle = document.getElementById('docs-drawer-toggle');
        const backdrop = document.querySelector('.docs-rail-backdrop');
        // the closer the swap calls; there is nothing to close without a
        // toggle, so hand back something safe to call
        if (!toggle) return function () {};

        const FOCUSABLE = 'a[href], summary, button';
        function ends() {
            const items = rail.querySelectorAll(FOCUSABLE);
            return { first: items[0] || null, last: items[items.length - 1] || null };
        }

        function open() {
            rail.classList.add('open');
            toggle.setAttribute('aria-expanded', 'true');
            if (backdrop) backdrop.hidden = false;
            // the rail transitions from visibility:hidden, and a hidden
            // element cannot take focus -- so wait for the frame that makes
            // it visible
            requestAnimationFrame(function () {
                const first = ends().first;
                if (first && rail.classList.contains('open')) first.focus();
            });
            document.addEventListener('keydown', onKeydown);
        }

        function close() {
            rail.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
            if (backdrop) backdrop.hidden = true;
            document.removeEventListener('keydown', onKeydown);
            toggle.focus();
        }

        function onKeydown(event) {
            if (event.key === 'Escape') {
                close();
                return;
            }
            if (event.key !== 'Tab') return;
            // nothing behind the drawer is reachable while it is open, and
            // that includes tabbing off either end of the rail itself
            const { first, last } = ends();
            const target = focusWrap(event.target, event.shiftKey, first, last, rail.contains(event.target));
            if (target) {
                event.preventDefault();
                target.focus();
            }
        }

        toggle.addEventListener('click', function () {
            if (rail.classList.contains('open')) close();
            else open();
        });

        if (backdrop) backdrop.addEventListener('click', close);

        // For the swap: closing a drawer that was never open would move focus
        // to a button nobody can see.
        return function () {
            if (rail.classList.contains('open')) close();
        };
    }

    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
        else wire();
    }

    const api = { readState, writeState, applyState, nextState, pickActive, focusWrap, swapTarget };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    } else {
        root.tuxbloxDocsNav = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this);
