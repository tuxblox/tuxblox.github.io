// sitemap.xml for the top-level pages and every docs page, in sidebar order.
// Generated so a new docs page is listed without anyone remembering to.
export function renderSitemap(origin, paths) {
    const urls = paths
        .map(p => `    <url>\n        <loc>${(origin + p).replace(/&/g, '&amp;')}</loc>\n    </url>`)
        .join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
