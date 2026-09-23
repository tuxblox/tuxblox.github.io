// static.tuxblox.net now lives at tuxblox.net/static/. References become
// root-relative, so the same HTML works on tuxblox.net, a preview domain and
// localhost -- except inside <meta content="...">, where social-card crawlers
// need absolute URLs. The preconnect to the old host has no purpose any more.
const OLD = 'https://static.tuxblox.net/';

export function rewriteStaticUrls(text) {
    return text
        .replace(/^[ \t]*<link rel="preconnect" href="https:\/\/static\.tuxblox\.net">\r?\n/gm, '')
        .replaceAll(`content="${OLD}`, 'content="https://tuxblox.net/static/')
        .replaceAll(OLD, '/static/');
}
