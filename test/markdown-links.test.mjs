import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const { renderMarkdown, isOffSite, stripMdExtension } = createRequire(import.meta.url)('../site/static/scripts/markdown.js');

test('a link that leaves the site opens in a new tab', () => {
    assert.ok(isOffSite('https://devforum.roblox.com/t/x'));
    assert.ok(isOffSite('https://github.com/cherrypath0/tuxblox'));
    assert.ok(isOffSite('//example.com/a'));
});

test('a link that stays on the site navigates in place', () => {
    assert.ok(!isOffSite('https://tuxblox.net/releases'));
    assert.ok(!isOffSite('https://www.tuxblox.net/privacy'));
    assert.ok(!isOffSite('/releases'));
    assert.ok(!isOffSite('../troubleshooting/common-problems.md'));
    assert.ok(!isOffSite('system-requirements.md#gpu'));
    assert.ok(!isOffSite('#the-allowlist'));
});

// /discord and /github are Cloudflare redirects to Discord and GitHub, so a
// reader following one leaves the site even though the URL says otherwise.
test('the redirect paths off the site count as leaving it', () => {
    assert.ok(isOffSite('https://tuxblox.net/discord'));
    assert.ok(isOffSite('/discord'));
    assert.ok(isOffSite('/github/issues'));
    assert.ok(!isOffSite('/githubbed'));
});

// A host is whatever sits between // and the next /, so userinfo before an @
// and a port after a colon both have to go, or evil.com reads as tuxblox.net.
test('userinfo and a port do not disguise another host', () => {
    assert.ok(isOffSite('https://tuxblox.net@evil.com/x'));
    assert.ok(!isOffSite('https://tuxblox.net:443/releases'));
    assert.ok(isOffSite('https://tuxblox.net:443/discord?x=1'));
});

// mailto: hands off to a mail client rather than replacing the page, and a
// new tab for one is left blank.
test('mailto is left alone', () => {
    assert.ok(!isOffSite('mailto:contact@tuxblox.net'));
    assert.ok(!renderMarkdown('[mail](mailto:contact@tuxblox.net)\n').includes('target='));
});

test('both link forms carry the attributes, href first', () => {
    const html = renderMarkdown('[post](https://devforum.roblox.com/t/x) and https://github.com/x\n');
    assert.ok(html.includes('<a href="https://devforum.roblox.com/t/x" target="_blank" rel="noopener noreferrer">post</a>'));
    assert.ok(html.includes('<a href="https://github.com/x" target="_blank" rel="noopener noreferrer">https://github.com/x</a>'));
});

test('an in-site link gets no attributes at all', () => {
    assert.equal(
        renderMarkdown('[Troubleshooting](../troubleshooting/common-problems.md)\n'),
        '<p><a href="../troubleshooting/common-problems">Troubleshooting</a></p>\n'
    );
});

// A .md on another server is a real file served under that name, so the
// extensionless-URL rule stops at the site's edge. docs/development links to
// CONTRIBUTING.md on GitHub, which 404s without it.
test('only an in-site link loses its .md', () => {
    assert.equal(stripMdExtension('../troubleshooting/common-problems.md'), '../troubleshooting/common-problems');
    assert.equal(stripMdExtension('system-requirements.md#gpu'), 'system-requirements#gpu');
    assert.equal(
        stripMdExtension('https://github.com/cherrypath0/tuxblox/blob/main/CONTRIBUTING.md'),
        'https://github.com/cherrypath0/tuxblox/blob/main/CONTRIBUTING.md'
    );
});
