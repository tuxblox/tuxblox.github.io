import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const { renderMarkdown } = createRequire(import.meta.url)('../site/static/scripts/markdown.js');

const fence = body => renderMarkdown('```bash\n' + body + '\n```\n');
const token = (html, cls, text) => html.includes(`<span class="hljs-${cls}">${text}</span>`);

// the word list will always lag behind the commands the docs actually use, so
// whatever sits in command position is highlighted whether it is listed or not
test('a command the word list does not know is still highlighted', () => {
    assert.ok(token(fence('pkill TuxBloxLauncher'), 'built_in', 'pkill'));
    assert.ok(token(fence('distrobox enter tuxblox'), 'built_in', 'distrobox'));
    assert.ok(token(fence('vulkaninfo --summary'), 'built_in', 'vulkaninfo'));
});

test('a command given by path is highlighted whole', () => {
    assert.ok(token(fence('./build.sh --log'), 'built_in', './build.sh'));
    assert.ok(token(fence('~/.tuxblox/TuxBloxLauncher'), 'built_in', '~/.tuxblox/TuxBloxLauncher'));
    assert.ok(token(fence('/opt/tuxblox/TuxBloxInstaller'), 'built_in', '/opt/tuxblox/TuxBloxInstaller'));
});

test('an indented command is highlighted, and the indent stays outside the span', () => {
    const html = fence('if true; then\n    pkill TuxBloxLauncher\nfi');
    assert.ok(token(html, 'built_in', 'pkill'));
    assert.ok(!html.includes('<span class="hljs-built_in">    pkill'));
});

// the hazards: things in command position that are not commands
test('a comment line is a comment, not a command', () => {
    const html = fence('# pkill the launcher first');
    assert.ok(token(html, 'comment', '# pkill the launcher first'));
    assert.ok(!html.includes('hljs-built_in'));
});

test('an env assignment names a variable, not a command', () => {
    const html = fence('TUXBLOX_LOG=1');
    assert.ok(token(html, 'variable', 'TUXBLOX_LOG'));
    assert.ok(!html.includes('hljs-built_in'));
});

test('a continuation line of flags holds no command', () => {
    const html = fence('distrobox create \\\n    --additional-flags "--device /dev/dri"');
    assert.ok(token(html, 'built_in', 'distrobox'));
    assert.ok(!html.includes('additional-flags</span>'));
});

test('a shell keyword stays a keyword', () => {
    const html = fence('for f in *.log; do\n    cat "$f"\ndone');
    assert.ok(token(html, 'keyword', 'for'));
    assert.ok(!html.includes('<span class="hljs-built_in">for</span>'));
});

// the rule the user set: fences yes, backticks no
test('inline code is never tokenised', () => {
    const html = renderMarkdown('Run `pkill TuxBloxLauncher` and `distrobox enter`.\n');
    assert.ok(!html.includes('hljs'));
});

test('a fence with no language is left as plain text', () => {
    const html = renderMarkdown('```\npkill TuxBloxLauncher\n```\n');
    assert.ok(!html.includes('hljs-'));
});

// the word list matches on \b, and a dot opens a word boundary, so 'sh' used to
// be picked out of install.sh and build.sh as though it were the shell
test('a listed command is not matched inside a filename', () => {
    const html = fence('bash install.sh');
    assert.ok(token(html, 'built_in', 'bash'));
    assert.ok(!html.includes('>sh</span>'));
});

test('a listed command is still matched after a pipe or a space', () => {
    assert.ok(token(fence('ls ~/.tuxblox/logs | head -n 50'), 'built_in', 'head'));
    assert.ok(token(fence('sudo pacman -S podman'), 'built_in', 'pacman'));
});
