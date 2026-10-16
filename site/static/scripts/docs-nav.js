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

        const groups = Array.prototype.slice.call(rail.querySelectorAll('details[data-group]'));
        const currentGroup = rail.querySelector('.docs-tree')?.dataset.currentGroup || '';
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
        setupDrawer(rail);
    }

    function setupToc() {
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
        const observer = new IntersectionObserver(function (entries) {
            for (const entry of entries) {
                if (entry.isIntersecting) visible.add(entry.target.id);
                else visible.delete(entry.target.id);
            }
            highlight();
        }, { rootMargin: `-${headerH + 20}px 0px -70% 0px`, threshold: 0 });

        for (const heading of headings) observer.observe(heading);
        highlight();
    }

    function setupDrawer(rail) {
        const toggle = document.getElementById('docs-drawer-toggle');
        const backdrop = document.querySelector('.docs-rail-backdrop');
        if (!toggle) return;

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
    }

    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
        else wire();
    }

    const api = { readState, writeState, applyState, nextState, pickActive, focusWrap };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    } else {
        root.tuxbloxDocsNav = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this);
