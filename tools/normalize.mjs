// Makes a page fetched from a live origin comparable with the build output:
// undoes Cloudflare's email obfuscation, which rewrites addresses on the way
// out, and moves old static.tuxblox.net URLs to /static/ the way the import
// did.
import { rewriteStaticUrls } from '../build/rewrite-static.mjs';

function decode(hex) {
    const key = parseInt(hex.slice(0, 2), 16);
    let out = '';
    for (let i = 2; i < hex.length; i += 2) {
        out += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16) ^ key);
    }
    return out;
}

export function decodeCloudflareEmails(html) {
    return html
        .replace(/<a href="\/cdn-cgi\/l\/email-protection" class="__cf_email__" data-cfemail="([0-9a-f]+)">\[email&#160;protected\]<\/a>/g,
            (_, hex) => decode(hex))
        .replace(/href="\/cdn-cgi\/l\/email-protection#([0-9a-f]+)"/g, (_, hex) => `href="mailto:${decode(hex)}"`)
        .replace(/<script data-cfasync="false" src="\/cdn-cgi\/scripts\/[^"]+\/cloudflare-static\/email-decode\.min\.js"><\/script>/g, '');
}

export function normalize(html) {
    return rewriteStaticUrls(decodeCloudflareEmails(html));
}
