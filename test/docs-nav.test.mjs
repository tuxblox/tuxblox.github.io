import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const { readState, writeState, applyState } = createRequire(import.meta.url)('../site/static/scripts/docs-nav.js');

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
