# tuxblox.net

The website for [TuxBlox](https://github.com/cherrypath0/tuxblox): the home
page, the download page and the documentation, served by GitHub Pages.

| Path | What it is |
|---|---|
| `docs/` | The documentation, in Markdown. `docs-info.json` sets the sidebar order and titles; a page it does not name is not published. |
| `site/` | Pages and files served as they are. `site/static/` is what `static.tuxblox.net` used to serve. |
| `build/` | The build: renders `docs/` into pages, writes the search index and sitemap. |
| `tools/` | A local preview server, and checks against a live copy of the site. |

## Building

```sh
node --test
node build/build.mjs
node tools/serve.mjs
```

Node 22 or newer, nothing to install. `tools/serve.mjs` serves `_site/` at
http://127.0.0.1:8000/ the way GitHub Pages does, so `/releases` and the docs
links work. `tools/smoke.sh` checks the topbar and search in headless
Chromium.

## Publishing

Every push to `main` is tested, built and deployed. A failing test or build
deploys nothing. Docs for a feature that is not released yet belong on a
branch until release day.

When a new stable version is released, update the version in
`site/install.sh`; nothing else does it.

## Checking a live copy

```sh
node build/build.mjs && node tools/parity.mjs https://tuxblox.net
tools/check-live.sh https://tuxblox.net --redirects
```
