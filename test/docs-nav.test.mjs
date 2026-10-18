import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const {
    readState, writeState, applyState, nextState, pickActive, focusWrap, swapTarget,
} = createRequire(import.meta.url)('../site/static/scripts/docs-nav.js');

const fake = (initial) => {
    let v = initial;
    return { getItem: () => v, setItem: (_, n) => { v = n; }, get value() { return v; } };
};

test('the current page wins over a remembered closed state', () => {
    const groups = [
        { dataset: { group: 'a/g' }, open: false },
        { dataset: { group: 'a/h' }, open: false },
    ];
    applyState(groups, { 'a/g': false, 'a/h': true }, 'a/g');
    assert.equal(groups[0].open, true);
    assert.equal(groups[1].open, true);
});

// Review Focus 3
test('storage that throws or holds junk degrades to an empty state', () => {
    const throws = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
    assert.deepEqual(readState(throws), {});
    assert.deepEqual(readState(fake('not json')), {});
    assert.deepEqual(readState(fake(null)), {});
    assert.doesNotThrow(() => writeState(throws, { 'a/g': true }));
});

test('writing drops groups that are no longer in the tree', () => {
    const store = fake('{"gone/x":true}');
    writeState(store, { 'a/g': true });
    assert.deepEqual(JSON.parse(store.value), { 'a/g': true });
});

const group = (name, open) => ({ dataset: { group: name }, open });

// The build forces the current page's subcategory open, which fires a toggle.
// Snapshotting every group on that toggle would write the override back as a
// preference and destroy what the reader actually chose.
test('forcing the current group open does not overwrite the remembered choice', () => {
    const groups = [group('s/g', true), group('s/h', true)];
    const prev = { 's/g': true, 's/h': false };
    assert.deepEqual(nextState(prev, groups, 's/h', null), { 's/g': true, 's/h': false });
});

test('toggling the current group by hand is remembered', () => {
    const current = group('s/h', false);
    const groups = [group('s/g', true), current];
    assert.deepEqual(
        nextState({ 's/g': true, 's/h': true }, groups, 's/h', current),
        { 's/g': true, 's/h': false });
});

test('a group that left the tree is dropped on the next write', () => {
    assert.deepEqual(nextState({ 'gone/x': true }, [group('s/g', false)], '', null), { 's/g': false });
});

// The observer band is a narrow strip, so between two headings nothing is
// intersecting. Clearing the highlight there leaves the rail blank for a
// third of the page.
test('the highlight holds the last heading when none is in the band', () => {
    const order = ['a', 'b', 'c'];
    assert.equal(pickActive(order, new Set(['b', 'c']), 'a'), 'b');
    assert.equal(pickActive(order, new Set(), 'b'), 'b');
    assert.equal(pickActive(order, new Set(), null), null);
});

test('focus wraps at both ends of the drawer', () => {
    assert.equal(focusWrap('mid', false, 'first', 'last', true), null);
    assert.equal(focusWrap('last', false, 'first', 'last', true), 'first');
    assert.equal(focusWrap('first', true, 'first', 'last', true), 'last');
    assert.equal(focusWrap('elsewhere', false, 'first', 'last', false), 'first');
});

// --- taking over a click ----------------------------------------------
//
// swapTarget decides, from the link and the click alone, whether the page can
// be swapped in place. Everything it returns null for stays an ordinary
// navigation, which is what keeps the links real.

const HERE = 'https://tuxblox.net/docs/getting-started/welcome';
const plain = { button: 0, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false, defaultPrevented: false };
const to = (href, extra) => ({ href, target: '', download: false, ...extra });

test('a plain left click on another docs page is taken over', () => {
    assert.equal(
        swapTarget(to('https://tuxblox.net/docs/using-tuxblox/fastflags'), plain, HERE),
        'https://tuxblox.net/docs/using-tuxblox/fastflags');
});

test('a middle click or a modified click is left to the browser', () => {
    const href = to('https://tuxblox.net/docs/using-tuxblox/fastflags');
    assert.equal(swapTarget(href, { ...plain, button: 1 }, HERE), null);
    assert.equal(swapTarget(href, { ...plain, ctrlKey: true }, HERE), null);
    assert.equal(swapTarget(href, { ...plain, metaKey: true }, HERE), null);
    assert.equal(swapTarget(href, { ...plain, shiftKey: true }, HERE), null);
    assert.equal(swapTarget(href, { ...plain, altKey: true }, HERE), null);
});

test('a click something else already handled is left alone', () => {
    assert.equal(
        swapTarget(to('https://tuxblox.net/docs/using-tuxblox/fastflags'), { ...plain, defaultPrevented: true }, HERE),
        null);
});

test('a link that opens somewhere else is left to the browser', () => {
    assert.equal(swapTarget(to('https://tuxblox.net/docs/a/b', { target: '_blank' }), plain, HERE), null);
    assert.equal(swapTarget(to('https://tuxblox.net/docs/a/b', { download: true }), plain, HERE), null);
});

test('a link off the site is left to the browser', () => {
    assert.equal(swapTarget(to('https://github.com/cherrypath0/tuxblox'), plain, HERE), null);
    assert.equal(swapTarget(to('https://tuxblox.net/discord'), plain, HERE), null);
});

test('a page on the site that is not a docs page is left to the browser', () => {
    assert.equal(swapTarget(to('https://tuxblox.net/releases'), plain, HERE), null);
    assert.equal(swapTarget(to('https://tuxblox.net/'), plain, HERE), null);
});

// /docs and /docs/<section> are redirect pages with no article of their own,
// so swapping one in would leave the reader looking at nothing.
test('the redirect pages are left to the browser', () => {
    assert.equal(swapTarget(to('https://tuxblox.net/docs'), plain, HERE), null);
    assert.equal(swapTarget(to('https://tuxblox.net/docs/'), plain, HERE), null);
    assert.equal(swapTarget(to('https://tuxblox.net/docs/getting-started/'), plain, HERE), null);
});

// The browser already scrolls to a heading on the page you are reading, and
// doing it here would push a duplicate entry onto the history stack.
test('a fragment on the page you are already reading is left to the browser', () => {
    assert.equal(swapTarget(to(`${HERE}#what-it-is`), plain, HERE), null);
    assert.equal(swapTarget(to(HERE), plain, HERE), null);
});

test('a fragment on another docs page is taken over, fragment and all', () => {
    assert.equal(
        swapTarget(to('https://tuxblox.net/docs/using-tuxblox/fastflags#the-allowlist'), plain, HERE),
        'https://tuxblox.net/docs/using-tuxblox/fastflags#the-allowlist');
});
