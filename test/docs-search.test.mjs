import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { buildDocTree, getFullUrl } from '../build/docs.mjs';

const require = createRequire(import.meta.url);
const port = require('../site/static/scripts/docs-search.js');
const server = require('./fixtures/server-search.cjs');

const tree = buildDocTree(fileURLToPath(new URL('../docs', import.meta.url)));
const serverTree = tree.map(s => ({
    title: s.title,
    pages: s.pages.map(p => ({ title: p.title, urlPath: p.urlPath, raw: fs.readFileSync(p.fsPath, 'utf8') })),
}));
const entries = serverTree.flatMap(s => s.pages.map(p => ({
    title: p.title, section: s.title, urlPath: getFullUrl(p.urlPath), text: port.stripMarkdown(p.raw),
})));

const QUERIES = [
    'install', 'Install', '  settings  ', 'troubleshooting', 'getting started', 'fastflags',
    'wine', 'studio mcp', 'log', 'flatpak', 'roblox', 'a', 'zzzz-no-match', '<script>',
    '(', '$&', 'é', '.md', '--', '   ',
];

test('stripMarkdown matches the server on every page', () => {
    for (const s of serverTree) for (const p of s.pages) {
        assert.equal(port.stripMarkdown(p.raw), server.stripMarkdown(p.raw), p.urlPath);
    }
});

test('search results match the server for every query', () => {
    for (const q of QUERIES) {
        assert.deepEqual(port.searchDocs(entries, q), server.searchDocs(serverTree, q), JSON.stringify(q));
    }
});

test('the comparison is not vacuous', () => {
    assert.ok(port.searchDocs(entries, 'install').length > 0);
    assert.equal(port.searchDocs(entries, 'roblox').length, 8);
    assert.deepEqual(port.searchDocs(entries, 'zzzz-no-match'), []);
});
