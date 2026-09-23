import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { resolvePath } from '../tools/serve.mjs';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'serve-'));
for (const f of ['index.html', 'releases.html', '404.html', 'docs/index.html', 'docs/a/p.html', 'static/x.css']) {
    fs.mkdirSync(path.dirname(path.join(root, f)), { recursive: true });
    fs.writeFileSync(path.join(root, f), f);
}

test('extensionless URLs are served from their .html file, as on Pages', () => {
    assert.deepEqual(resolvePath(root, '/releases'), { status: 200, file: path.join(root, 'releases.html') });
    assert.deepEqual(resolvePath(root, '/docs/a/p'), { status: 200, file: path.join(root, 'docs/a/p.html') });
});

test('directories redirect to a trailing slash, then serve their index.html', () => {
    assert.deepEqual(resolvePath(root, '/docs'), { status: 301, location: '/docs/' });
    assert.deepEqual(resolvePath(root, '/docs/'), { status: 200, file: path.join(root, 'docs/index.html') });
    assert.deepEqual(resolvePath(root, '/'), { status: 200, file: path.join(root, 'index.html') });
});

test('files are served as they are', () => {
    assert.deepEqual(resolvePath(root, '/static/x.css'), { status: 200, file: path.join(root, 'static/x.css') });
});

test('anything else is the 404 page, and nothing outside the root is reachable', () => {
    assert.deepEqual(resolvePath(root, '/nope'), { status: 404, file: path.join(root, '404.html') });
    assert.deepEqual(resolvePath(root, '/../../etc/passwd'), { status: 404, file: path.join(root, '404.html') });
    assert.deepEqual(resolvePath(root, '/%2e%2e/%2e%2e/etc/passwd'), { status: 404, file: path.join(root, '404.html') });
});
