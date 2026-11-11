import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const { renderMarkdown } = createRequire(import.meta.url)('../site/static/scripts/markdown.js');

// The .md sources are hard wrapped so they read as text. Breaking the rendered page
// wherever the source happens to wrap put a line break every eight or nine words,
// which is what these pin against coming back.

test('a hard-wrapped paragraph renders as one flowing paragraph', () => {
    const html = renderMarkdown('The tracker exists so a broken build\nis noticed within minutes\nrather than days later.');
    assert.ok(!html.includes('<br>'), html);
    assert.ok(html.includes('broken build is noticed within minutes rather than days later.'), html);
});

test('a break the author asked for with two trailing spaces is kept', () => {
    const html = renderMarkdown('first line  \nsecond line');
    assert.ok(html.includes('<br>'), html);
    // The spaces that requested it are not left in the text.
    assert.ok(!html.includes('first line  <br>'), html);
});

test('a break the author asked for with a trailing backslash is kept', () => {
    const html = renderMarkdown('first line\\\nsecond line');
    assert.ok(html.includes('<br>'), html);
    assert.ok(!html.includes('\\'), html);
});

test('a blank line still starts a new paragraph', () => {
    const html = renderMarkdown('one\n\ntwo');
    assert.equal((html.match(/<p>/g) || []).length, 2, html);
});

test('indentation from the wrap is not left in the middle of a sentence', () => {
    const html = renderMarkdown('a sentence that wraps\n    with indented continuation');
    assert.ok(html.includes('a sentence that wraps with indented continuation'), html);
});
