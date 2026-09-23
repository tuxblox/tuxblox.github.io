// Fetches every page from an origin and compares it with _site/, after
// undoing what Cloudflare and the static.tuxblox.net move change. Before
// cutover this proves the build reproduces the live site; after, that the
// deployed site is the build.
//
//   node build/build.mjs && node tools/parity.mjs https://tuxblox.net
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalize } from './normalize.mjs';

const origin = (process.argv[2] || '').replace(/\/$/, '');
if (!/^https?:\/\//.test(origin)) {
    console.error('usage: node tools/parity.mjs <origin>, e.g. https://tuxblox.net');
    process.exit(2);
}

const site = fileURLToPath(new URL('../_site', import.meta.url));
const docs = JSON.parse(fs.readFileSync(path.join(site, 'docs/search-index.json'), 'utf8'));

// [URL path, file in _site, expected status]
const checks = [
    ['/', 'index.html', 200],
    ['/releases', 'releases.html', 200],
    ['/privacy', 'privacy.html', 200],
    ['/parity-check-missing-page', '404.html', 404],
    ...docs.map(d => [d.urlPath, `${d.urlPath.slice(1)}.html`, 200]),
];

function firstDifference(a, b) {
    const la = a.split('\n');
    const lb = b.split('\n');
    for (let i = 0; i < Math.max(la.length, lb.length); i++) {
        if (la[i] !== lb[i]) return `line ${i + 1}\n      live:  ${JSON.stringify(la[i])}\n      build: ${JSON.stringify(lb[i])}`;
    }
    return 'no line differs (line endings?)';
}

let failed = 0;
for (const [urlPath, file, status] of checks) {
    const res = await fetch(origin + urlPath, { redirect: 'manual' });
    const live = normalize(await res.text());
    const built = fs.readFileSync(path.join(site, file), 'utf8');
    if (res.status !== status) {
        failed++;
        console.log(`FAIL ${urlPath}: status ${res.status}, expected ${status}`);
    } else if (live !== built) {
        failed++;
        console.log(`FAIL ${urlPath}: differs at ${firstDifference(live, built)}`);
    } else {
        console.log(`ok   ${urlPath}`);
    }
}

console.log(`\n${checks.length - failed}/${checks.length} match`);
process.exit(failed ? 1 : 0);
