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
                    const state = {};
                    for (const g of groups) state[g.dataset.group] = g.open;
                    writeState(storage, state);
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

        const byId = new Map();
        for (const link of links) {
            const id = decodeURIComponent(link.getAttribute('href').slice(1));
            const heading = document.getElementById(id);
            if (heading) byId.set(heading, link);
        }
        if (byId.size === 0) return;

        const visible = new Set();
        function highlight() {
            // the earliest heading still on screen is the one being read
            let best = null;
            for (const heading of byId.keys()) {
                if (visible.has(heading) && (best === null || heading.compareDocumentPosition(best) & Node.DOCUMENT_POSITION_FOLLOWING)) {
                    best = heading;
                }
            }
            for (const [heading, link] of byId) link.classList.toggle('active', heading === best);
        }

        const observer = new IntersectionObserver(function (entries) {
            for (const entry of entries) {
                if (entry.isIntersecting) visible.add(entry.target);
                else visible.delete(entry.target);
            }
            highlight();
        }, { rootMargin: '-80px 0px -70% 0px', threshold: 0 });

        for (const heading of byId.keys()) observer.observe(heading);
    }

    function setupDrawer(rail) {
        const toggle = document.getElementById('docs-drawer-toggle');
        const backdrop = document.querySelector('.docs-rail-backdrop');
        if (!toggle) return;

        function open() {
            rail.classList.add('open');
            toggle.setAttribute('aria-expanded', 'true');
            if (backdrop) backdrop.hidden = false;
            const first = rail.querySelector('a, summary');
            if (first) first.focus();
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
            // nothing behind the drawer is reachable while it is open
            if (event.key === 'Tab' && !rail.contains(event.target) && event.target !== toggle) {
                event.preventDefault();
                const first = rail.querySelector('a, summary');
                if (first) first.focus();
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

    const api = { readState, writeState, applyState };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    } else {
        root.tuxbloxDocsNav = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this);
