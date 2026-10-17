import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const {
    readState, writeState, applyState, nextState, pickActive, focusWrap,
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
