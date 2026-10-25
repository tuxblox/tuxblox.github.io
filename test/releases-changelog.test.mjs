import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// The releases page reads the hybrid layout: client/{component}/{version}/{arch}/{file} for the
// bytes, client/releases/{channel}/ for the releases that name them. A release's changelog is the
// changelogs of the components that MOVED, and the page works out which ones those are by
// comparing a release against the one before it -- component versions are published once and never
// rewritten, so an unchanged component carries the same number and the same notes.
//
// The page is one file with an inline script, so the functions are lifted out of it by name rather
// than imported. That keeps the test honest: it runs the text that ships.

const page = readFileSync(new URL('../site/releases.html', import.meta.url), 'utf8');

// Everything in the script sits at one indentation inside the IIFE, so a declaration ends at the
// first closing brace at that same indentation.
function declaration(opening) {
    const start = page.indexOf('\n        ' + opening);
    assert.notEqual(start, -1, `not found in releases.html: ${opening}`);
    const end = page.indexOf('\n        }', start);
    assert.notEqual(end, -1, `unterminated: ${opening}`);
    return page.slice(start, end + '\n        }'.length);
}

const source = [
    "var CDN = 'https://setup.tuxblox.net';",
    declaration('var COMPONENTS = {').replace(/}$/, '};'),
    "var NO_CHANGELOG = { libtuxblox: 1 };",
    declaration('function humanSize('),
    declaration('function byReleaseDesc('),
    declaration('function changedComponents('),
    declaration('function itemFromRelease('),
    declaration('function changelogSection('),
    'return { COMPONENTS, byReleaseDesc, changedComponents, itemFromRelease, changelogSection };'
].join('\n');

const { byReleaseDesc, changedComponents, itemFromRelease, changelogSection } =
    new Function(source)();

const component = (version) => ({ version, arch: { x86_64: { sha256: 'a'.repeat(64), size: 1024 } } });

function release(overrides = {}) {
    return {
        release: '3.6.0.0',
        channel: 'stable',
        published: '2026-10-24T12:00:00Z',
        components: Object.assign({
            launcher: component('3.5.0'),
            installer: component('3.1.0'),
            'studio-mcp': component('2.0.1'),
            compat: component('3.3.0'),
            libtuxblox: component('3.1.0')
        }, overrides)
    };
}

// --- which components a release is about ---------------------------------

test('a component whose version did not move is not part of the release', () => {
    const previous = release();
    const current = release({ launcher: component('3.5.1') });
    assert.deepEqual(changedComponents(current, previous), ['launcher']);
});

test('several components can move at once, in the order the files are listed', () => {
    const previous = release();
    const current = release({ launcher: component('3.5.1'), compat: component('3.4.0') });
    assert.deepEqual(changedComponents(current, previous), ['launcher', 'compat']);
});

test('a release that follows nothing is about every component it names', () => {
    assert.deepEqual(changedComponents(release(), null),
        ['launcher', 'installer', 'studio-mcp', 'compat']);
});

// GTK and libadwaita built from source. It moves when they move, which is nothing a reader of this
// page can act on, so it never brings a changelog -- but it stays in the Files table, because it is
// still something an install downloads.
test('the interface stack never brings a changelog, even when it moves', () => {
    const previous = release();
    const current = release({ libtuxblox: component('3.2.0') });
    assert.deepEqual(changedComponents(current, previous), []);
    assert.equal(itemFromRelease('stable', '3.6.0.1', current, previous).content
        .some((c) => c.name === 'Libraries'), true);
});

test('a component appearing for the first time has moved', () => {
    const previous = release();
    delete previous.components.compat;
    assert.deepEqual(changedComponents(release(), previous), ['compat']);
});

// A rebuild publishes the same component versions under a new release number. Nothing changed, so
// there is nothing to say about it -- the card falls back to the release's own file.
test('a release in which nothing moved is about nothing', () => {
    assert.deepEqual(changedComponents(release(), release()), []);
});

test('a component a release does not name is not reported as moved', () => {
    const current = release();
    delete current.components['studio-mcp'];
    assert.deepEqual(changedComponents(current, release()), []);
});

// --- what the card is given ----------------------------------------------

test('the changelog of a moved component is fetched from that version, not from the release', () => {
    const item = itemFromRelease('stable', '3.6.0.1', release({ launcher: component('3.5.1') }), release());
    assert.deepEqual(item.changelogParts, [{
        label: 'Launcher 3.5.1',
        url: 'https://setup.tuxblox.net/client/launcher/3.5.1/changelogs.md'
    }]);
});

// The release's own file is what every published release has today, and no component publishes a
// changelog yet. It has to stay on the item or the page goes blank the day this ships.
test('the release keeps its own changelog as the fallback', () => {
    const item = itemFromRelease('canary', '3.6.0.1', release(), release());
    assert.equal(item.changelogUrl,
        'https://setup.tuxblox.net/client/releases/canary/3.6.0.1.md');
    assert.deepEqual(item.changelogParts, []);
});

test('a component is downloaded from its own version, with no channel in the path', () => {
    const item = itemFromRelease('experimental', '3.6.0.0', release(), null);
    const compat = item.content.find((c) => c.name === 'Runtime');
    assert.equal(compat.pointer,
        'https://setup.tuxblox.net/client/compat/3.3.0/x86_64/compat.tar.zst');
    assert.equal(compat.storage, '1.0 KB');
});

// Reserved in the layout, built for nobody yet: null means "not published for this architecture",
// and a row pointing at a file that does not exist is worse than no row.
test('a component with no bytes for this architecture is left out', () => {
    const body = release();
    body.components.libtuxblox.arch.x86_64 = null;
    const item = itemFromRelease('stable', '3.6.0.0', body, null);
    assert.equal(item.content.some((c) => c.name === 'Libraries'), false);
    assert.equal(item.content.length, 4);
});

// --- the order the comparison depends on ---------------------------------

test('releases sort newest first, by number and not as text', () => {
    const sorted = ['3.6.0.9', '3.6.0.10', '3.5.1.0', '4.0.0.0', '3.6.1.0'].sort(byReleaseDesc);
    assert.deepEqual(sorted, ['4.0.0.0', '3.6.1.0', '3.6.0.10', '3.6.0.9', '3.5.1.0']);
});

// --- merging ------------------------------------------------------------

test('a component with no changelog published contributes no heading', () => {
    assert.equal(changelogSection('Launcher 3.5.1', null), '');
    assert.equal(changelogSection('Launcher 3.5.1', ''), '');
    assert.equal(changelogSection('Launcher 3.5.1', '   \n\n'), '');
});

test('a component with a changelog is given its own heading', () => {
    assert.equal(changelogSection('Launcher 3.5.1', '- Fixed a thing\n'),
        '# Launcher 3.5.1\n\n- Fixed a thing');
});
