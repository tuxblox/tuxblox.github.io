import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const { renderMarkdown, slugify } = createRequire(import.meta.url)('../build/markdown.js');

test('slugs match GitHub for the anchors already in the docs', () => {
    assert.equal(slugify('TUXBLOX_LOG_LIMIT'), 'tuxblox_log_limit');
    assert.equal(slugify('Distrobox GPU passthrough warning'), 'distrobox-gpu-passthrough-warning');
    assert.equal(slugify('The launcher closes when Roblox starts'), 'the-launcher-closes-when-roblox-starts');
    assert.equal(slugify('GPU acceleration for web pages'), 'gpu-acceleration-for-web-pages');
    assert.equal(slugify('Picking a card'), 'picking-a-card');
});

test('slugs drop code spans and keep a link label', () => {
    assert.equal(slugify('`mcp.sh` and you'), 'mcpsh-and-you');
    assert.equal(slugify('See [the docs](/docs/x)'), 'see-the-docs');
});

// Review Focus 1
test('a heading that slugs to nothing still gets unique ids', () => {
    const headings = [];
    renderMarkdown('## ???\n\n## !!!\n', { headings });
    assert.deepEqual(headings.map(h => h.id), ['section', 'section-1']);
});

test('duplicate headings get numbered suffixes', () => {
    const headings = [];
    const html = renderMarkdown('## Examples\n\ntext\n\n## Examples\n', { headings });
    assert.deepEqual(headings, [
        { level: 2, text: 'Examples', id: 'examples' },
        { level: 2, text: 'Examples', id: 'examples-1' },
    ]);
    assert.ok(html.includes('<h2 id="examples">Examples</h2>'));
    assert.ok(html.includes('<h2 id="examples-1">Examples</h2>'));
});

test('ids are emitted even when no headings array is passed', () => {
    assert.ok(renderMarkdown('# Welcome\n').includes('<h1 id="welcome">'));
});

// A blockquote renders through a recursive call. If that call starts its own
// slug counter, two "## Notes" produce one id twice -- which silently defeats
// the fragment check in checkDocLinks, because the id is in the set.
test('a heading inside a blockquote shares the page slug counter', () => {
    const headings = [];
    renderMarkdown('## Notes\n\n> [!NOTE]\n> ## Notes\n', { headings });
    assert.deepEqual(headings.map(h => h.id), ['notes', 'notes-1']);
});

// The TOC shows heading.text, so it has to be the readable form, not the
// Markdown source.
test('collected heading text is plain, not raw Markdown', () => {
    const headings = [];
    renderMarkdown('## `mcp.sh` and **you**\n\n## See [the docs](/docs/s/p)\n', { headings });
    assert.deepEqual(headings.map(h => h.text), ['mcp.sh and you', 'See the docs']);
});
