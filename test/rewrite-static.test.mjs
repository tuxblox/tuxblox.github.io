import test from 'node:test';
import assert from 'node:assert/strict';
import { rewriteStaticUrls } from '../build/rewrite-static.mjs';

test('asset references become root-relative, keeping the query string', () => {
    assert.equal(
        rewriteStaticUrls('<link rel="stylesheet" href="https://static.tuxblox.net/styles/style.css?v=20260904">'),
        '<link rel="stylesheet" href="/static/styles/style.css?v=20260904">');
});

test('meta content URLs stay absolute, because social cards need them', () => {
    assert.equal(
        rewriteStaticUrls('<meta property="og:image" content="https://static.tuxblox.net/images/banner/tuxblox-banner.png" />'),
        '<meta property="og:image" content="https://tuxblox.net/static/images/banner/tuxblox-banner.png" />');
});

test('the preconnect to the old host is dropped with its line', () => {
    assert.equal(
        rewriteStaticUrls('a\n    <link rel="preconnect" href="https://static.tuxblox.net">\nb\n'),
        'a\nb\n');
});

test('other hosts are left alone, and a second pass changes nothing', () => {
    const once = rewriteStaticUrls(
        '<a href="https://setup.tuxblox.net/v2/releases.json">x</a>' +
        '<img src="https://static.tuxblox.net/images/svg/tuxblox.svg">');
    assert.equal(once,
        '<a href="https://setup.tuxblox.net/v2/releases.json">x</a>' +
        '<img src="/static/images/svg/tuxblox.svg">');
    assert.equal(rewriteStaticUrls(once), once);
});
