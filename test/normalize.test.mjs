import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeCloudflareEmails, normalize } from '../tools/normalize.mjs';

test('Cloudflare email obfuscation is undone', () => {
    const served = '<code><a href="/cdn-cgi/l/email-protection" class="__cf_email__" data-cfemail="70131f1e0411130430040508121c1f085e1e1504">[email&#160;protected]</a></code>.';
    assert.equal(decodeCloudflareEmails(served), '<code>contact@tuxblox.net</code>.');
});

test('obfuscated mailto links are undone', () => {
    const served = '<a href="/cdn-cgi/l/email-protection#70131f1e0411130430040508121c1f085e1e1504">write to us</a>';
    assert.equal(decodeCloudflareEmails(served), '<a href="mailto:contact@tuxblox.net">write to us</a>');
});

test('the decoder script Cloudflare injects is removed', () => {
    const served = '    <script data-cfasync="false" src="/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js"></script><script src="x.js" defer></script>';
    assert.equal(decodeCloudflareEmails(served), '    <script src="x.js" defer></script>');
});

test('normalize also rewrites old static URLs', () => {
    assert.equal(normalize('<img src="https://static.tuxblox.net/a.png">'), '<img src="/static/a.png">');
});
