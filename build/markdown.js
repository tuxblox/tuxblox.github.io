// minimal markdown to html helper module
// block level: # .. ###### headers, ```lang fenced code with syntax
//   highlighting, > blockquotes, > [!NOTE] style alerts,
//   - / * / + unordered lists, 1. ordered lists, --- horizontal rules,
//   | pipe | tables |, and paragraphs
// inline: **bold**, __underline__, *italic*, combos like __*text*__ /
//   __**text**__, `inline code`, ![alt](src) images, [text](url) links,
//   bare URLs, and single newlines inside a paragraph as <br>
//
// link targets lose a trailing .md, see stripMdExtension below.
//
// single file: the stylesheet lives in STYLES at the bottom. use
// styleTag() server side, injectStyles() in the browser, or renderPage()
// for a standalone html document.

// sentinels used to park inline code while other inline rules run.
// control chars, so they can never collide with real markdown.
const CODE_OPEN = '\u0000';
const CODE_CLOSE = '\u0001';

function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// --- link targets -----------------------------------------------------
//
// docs sites serve extensionless URLs, so a link written against the repo
// as install.md has to point at install once rendered. every link target
// loses a trailing .md from its path; ?query and #hash are left alone, so
// install.md#requirements becomes install#requirements. images are not
// touched, only [text](url) links and bare URLs.

function stripMdExtension(url) {
    const [, path, tail = ''] = String(url).match(/^([^?#]*)([?#][\s\S]*)?$/);
    return path.replace(/\.md$/i, '') + tail;
}

function renderInline(text, softBreaks = false) {
    const codeStore = [];

    // never let input contain our sentinels
    text = String(text).replace(/[\u0000\u0001]/g, '');

    text = text.replace(/`([^`]+)`/g, (_, code) => {
        codeStore.push(escapeHtml(code));
        return `${CODE_OPEN}${codeStore.length - 1}${CODE_CLOSE}`;
    });

    // images ![alt](src) before links so the leading ! isn't left behind
    text = text.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, src) => {
        return `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy">`;
    });

    // links [text](url)
    text = text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, url) => {
        const safeUrl = escapeHtml(stripMdExtension(url));
        return `<a href="${safeUrl}">${escapeHtml(label)}</a>`;
    });

    // bold+underline combos: __**text**__ or **__text__**
    text = text.replace(/__\*\*([^*_]+)\*\*__|\*\*__([^*_]+)__\*\*/g,
        (_, a, b) => `<strong><u>${a || b}</u></strong>`);

    // italic+underline combos: __*text*__ or *__text__*
    text = text.replace(/__\*([^*_]+)\*__|\*__([^*_]+)__\*/g,
        (_, a, b) => `<em><u>${a || b}</u></em>`);

    // bold **text**
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // underline __text__
    text = text.replace(/__([^_]+)__/g, '<u>$1</u>');

    // italic *text*
    text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // bare URLs (not already inside an href or other attribute). the .md
    // goes from the label too, so the text and the target don't disagree
    text = text.replace(/(^|[^"'>=])(https?:\/\/[^\s<]+)/g, (m, pre, url) => {
        const href = stripMdExtension(url);
        return `${pre}<a href="${escapeHtml(href)}">${escapeHtml(href)}</a>`;
    });

    // line handling. done here, while inline code is still parked, so a
    // newline inside `code` is never turned into a <br>
    text = softBreaks
        ? text.replace(/[ \t]*\n/g, '<br>\n')
        : text.replace(/\s*\n\s*/g, ' ');

    // restore inline code
    text = text.replace(
        new RegExp(`${CODE_OPEN}(\\d+)${CODE_CLOSE}`, 'g'),
        (_, i) => `<code>${codeStore[Number(i)]}</code>`
    );

    return text;
}

// --- syntax highlighting ----------------------------------------------
//
// each grammar is an ordered rule list. the scanner walks the source and
// at every position tries the rules in order, so earlier rules win:
// comments and strings must come first, or a keyword sitting inside a
// string gets coloured.
//
// class names match highlight.js (hljs-keyword, hljs-string, ...) so any
// highlight.js theme also styles this output. markdown.css ships a theme
// of its own, so nothing extra is needed.

function rules(list) {
    // 'y' keeps each match anchored at the scan position, 'm' lets ^ mean
    // start of line
    return list.map(([cls, source]) => ({ cls, re: new RegExp(source, 'ym') }));
}

const GRAMMARS = {
    bash: {
        aliases: ['sh', 'shell', 'zsh', 'console', 'terminal'],
        rules: rules([
            ['meta', '^#![^\\n]*'],
            ['comment', '#[^\\n]*'],
            ['string', '"(?:\\\\[\\s\\S]|[^"\\\\])*"|\'[^\']*\''],
            ['variable', '\\$(?:\\{[^}]*\\}|[A-Za-z_]\\w*|[@*#?$!0-9-])'],
            ['keyword', '\\b(?:if|then|else|elif|fi|for|while|until|do|done|case|esac|in|function|select|return|break|continue|local|readonly|declare|export|source|set|unset|shift|trap|exit|eval|exec)\\b'],
            ['built_in', '\\b(?:sudo|pkexec|apt|apt-get|pacman|dnf|yum|zypper|flatpak|snap|chmod|chown|curl|wget|git|cd|pwd|ls|cp|mv|rm|rmdir|mkdir|ln|echo|printf|cat|less|head|tail|grep|sed|awk|sort|uniq|cut|tr|tee|find|xargs|tar|zip|unzip|make|cmake|meson|ninja|systemctl|journalctl|xdg-open|xdg-mime|update-desktop-database|bash|sh|zsh|python|python3|pip|pip3|node|npm|npx|pnpm|yarn|cargo|go|docker|podman|mount|umount|which|whereis|kill|killall|ps|top|df|du|free|uname|whoami|id|sleep|read|test|wine|winetricks)\\b'],
            ['number', '\\b\\d+\\b'],
            ['operator', '\\|\\||&&|[|<>]{1,2}|[;&]'],
        ]),
    },
    javascript: {
        aliases: ['js', 'jsx', 'mjs', 'cjs', 'typescript', 'ts', 'tsx', 'node'],
        rules: rules([
            ['comment', '//[^\\n]*|/\\*[\\s\\S]*?\\*/'],
            ['string', '"(?:\\\\[\\s\\S]|[^"\\\\])*"|\'(?:\\\\[\\s\\S]|[^\'\\\\])*\'|`(?:\\\\[\\s\\S]|[^`\\\\])*`'],
            ['keyword', '\\b(?:const|let|var|function|return|if|else|for|while|do|switch|case|default|break|continue|new|delete|typeof|instanceof|void|in|of|class|extends|super|this|async|await|yield|try|catch|finally|throw|import|export|from|as|static|get|set)\\b'],
            ['literal', '\\b(?:true|false|null|undefined|NaN|Infinity)\\b'],
            ['built_in', '\\b(?:console|document|window|globalThis|process|module|exports|require|Math|JSON|Object|Array|String|Number|Boolean|Symbol|BigInt|Promise|Map|Set|WeakMap|WeakSet|RegExp|Date|Error|TypeError|Proxy|Reflect|fetch|setTimeout|setInterval)\\b'],
            ['number', '\\b(?:0[xX][\\da-fA-F_]+|0[bB][01_]+|0[oO][0-7_]+|\\d[\\d_]*(?:\\.[\\d_]+)?(?:[eE][+-]?\\d+)?n?)\\b'],
            ['title function_', '\\b[A-Za-z_$][\\w$]*(?=\\s*\\()'],
            ['type', '\\b[A-Z][\\w$]*\\b'],
        ]),
    },
    python: {
        aliases: ['py', 'py3'],
        rules: rules([
            ['comment', '#[^\\n]*'],
            ['string', '(?:[rRbBfFuU]{0,2})(?:"""[\\s\\S]*?"""|\'\'\'[\\s\\S]*?\'\'\'|"(?:\\\\[\\s\\S]|[^"\\\\])*"|\'(?:\\\\[\\s\\S]|[^\'\\\\])*\')'],
            ['meta', '^\\s*@[\\w.]+'],
            ['keyword', '\\b(?:def|class|return|if|elif|else|for|while|break|continue|pass|import|from|as|with|try|except|finally|raise|lambda|global|nonlocal|assert|del|yield|async|await|in|not|and|or|is)\\b'],
            ['literal', '\\b(?:True|False|None)\\b'],
            ['built_in', '\\b(?:print|len|range|str|int|float|bool|list|dict|set|tuple|open|enumerate|zip|map|filter|sum|min|max|abs|round|sorted|reversed|isinstance|issubclass|type|repr|input|super|self|cls)\\b'],
            ['number', '\\b(?:0[xX][\\da-fA-F_]+|\\d[\\d_]*(?:\\.[\\d_]+)?(?:[eE][+-]?\\d+)?j?)\\b'],
            ['title function_', '\\b[A-Za-z_]\\w*(?=\\s*\\()'],
        ]),
    },
    json: {
        aliases: ['jsonc', 'json5'],
        rules: rules([
            ['comment', '//[^\\n]*|/\\*[\\s\\S]*?\\*/'],
            ['attr', '"(?:\\\\.|[^"\\\\])*"(?=\\s*:)'],
            ['string', '"(?:\\\\.|[^"\\\\])*"'],
            ['literal', '\\b(?:true|false|null)\\b'],
            ['number', '-?\\b\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?\\b'],
            ['punctuation', '[{}\\[\\],:]'],
        ]),
    },
    css: {
        aliases: ['scss', 'less'],
        rules: rules([
            ['comment', '/\\*[\\s\\S]*?\\*/|//[^\\n]*'],
            ['string', '"(?:\\\\.|[^"\\\\])*"|\'(?:\\\\.|[^\'\\\\])*\''],
            ['keyword', '@[\\w-]+'],
            ['variable', '--[\\w-]+|\\$[\\w-]+'],
            ['attr', '[-a-zA-Z]+(?=\\s*:)'],
            ['number', '#[\\da-fA-F]{3,8}\\b|-?\\b\\d*\\.?\\d+(?:px|em|rem|ex|ch|%|vh|vw|vmin|vmax|fr|deg|s|ms|pt)?\\b'],
            ['built_in', '\\b[a-zA-Z-]+(?=\\()'],
            ['selector-class', '\\.[\\w-]+'],
            ['selector-id', '#[\\w-]+'],
        ]),
    },
    xml: {
        aliases: ['html', 'htm', 'svg', 'vue', 'xhtml'],
        rules: rules([
            ['comment', '<!--[\\s\\S]*?-->'],
            ['meta', '<![\\s\\S]*?>|<\\?[\\s\\S]*?\\?>'],
            ['name', '</?[A-Za-z][\\w:.-]*'],
            ['string', '"[^"]*"|\'[^\']*\''],
            ['attr', '\\b[A-Za-z_:@#][\\w:.-]*(?=\\s*=)'],
            ['name', '/?>'],
        ]),
    },
    diff: {
        aliases: ['patch'],
        rules: rules([
            ['meta', '^(?:diff|index|---|\\+\\+\\+|@@)[^\\n]*'],
            ['addition', '^\\+[^\\n]*'],
            ['deletion', '^-[^\\n]*'],
        ]),
    },
    ini: {
        aliases: ['toml', 'conf', 'cfg', 'desktop', 'properties'],
        rules: rules([
            ['comment', '[#;][^\\n]*'],
            ['section', '^\\s*\\[[^\\]\\n]*\\]'],
            ['attr', '^\\s*[\\w.$-]+(?=\\s*=)'],
            ['string', '"(?:\\\\.|[^"\\\\])*"|\'[^\']*\''],
            ['literal', '\\b(?:true|false|yes|no|on|off)\\b'],
            ['number', '-?\\b\\d+(?:\\.\\d+)?\\b'],
        ]),
    },
};

// lang string -> grammar
const GRAMMAR_BY_NAME = new Map();
for (const [name, grammar] of Object.entries(GRAMMARS)) {
    GRAMMAR_BY_NAME.set(name, grammar);
    for (const alias of grammar.aliases || []) GRAMMAR_BY_NAME.set(alias, grammar);
}

// register your own:
//   registerLanguage('lua', [['comment', '--[^\\n]*'], ...], ['luau'])
function registerLanguage(name, ruleList, aliases = []) {
    const grammar = { aliases, rules: rules(ruleList) };
    GRAMMAR_BY_NAME.set(name.toLowerCase(), grammar);
    for (const alias of aliases) GRAMMAR_BY_NAME.set(alias.toLowerCase(), grammar);
}

// swap in highlight.js / shiki if you want wider language coverage:
//   const hljs = require('highlight.js');
//   setHighlighter((code, lang) =>
//       hljs.getLanguage(lang) ? hljs.highlight(code, { language: lang }).value : null);
// return a non-string to fall back to the built-in grammars. whatever you
// return is inserted as-is, so it must already be escaped.
let externalHighlighter = null;
function setHighlighter(fn) {
    externalHighlighter = typeof fn === 'function' ? fn : null;
}

function highlightCode(code, lang) {
    if (externalHighlighter) {
        const external = externalHighlighter(code, lang);
        if (typeof external === 'string') return external;
    }

    const grammar = lang && GRAMMAR_BY_NAME.get(lang.toLowerCase());
    if (!grammar) return escapeHtml(code);

    let out = '';
    let plain = '';
    let pos = 0;

    while (pos < code.length) {
        let matched = null;

        for (const rule of grammar.rules) {
            rule.re.lastIndex = pos;
            const m = rule.re.exec(code);
            if (m && m[0].length) {
                matched = { cls: rule.cls, text: m[0] };
                break;
            }
        }

        if (matched) {
            if (plain) {
                out += escapeHtml(plain);
                plain = '';
            }
            out += `<span class="hljs-${matched.cls}">${escapeHtml(matched.text)}</span>`;
            pos += matched.text.length;
        } else {
            plain += code[pos];
            pos++;
        }
    }

    if (plain) out += escapeHtml(plain);
    return out;
}

// --- alerts -----------------------------------------------------------

// icons are plain shapes on a 16x16 box, inheriting currentColor
const ALERT_ICONS = {
    note: '<circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="7.2" y="6.9" width="1.6" height="5" rx=".8" fill="currentColor"/><circle cx="8" cy="4.5" r="1.05" fill="currentColor"/>',
    tip: '<path d="M8 1.4a4.6 4.6 0 0 0-2.7 8.3v1.1c0 .4.3.7.7.7h4c.4 0 .7-.3.7-.7V9.7A4.6 4.6 0 0 0 8 1.4Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M6.4 13.2h3.2M7 14.8h2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
    important: '<path d="M2 3.2h12a.8.8 0 0 1 .8.8v6.4a.8.8 0 0 1-.8.8H8.9l-2.8 2.4v-2.4H2a.8.8 0 0 1-.8-.8V4a.8.8 0 0 1 .8-.8Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><rect x="7.2" y="4.9" width="1.6" height="3.4" rx=".8" fill="currentColor"/><circle cx="8" cy="9.9" r=".95" fill="currentColor"/>',
    warning: '<path d="M8 1.7 15 14H1L8 1.7Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><rect x="7.2" y="5.6" width="1.6" height="4" rx=".8" fill="currentColor"/><circle cx="8" cy="11.6" r=".95" fill="currentColor"/>',
    caution: '<path d="M5.4 1.4h5.2L14.6 5.4v5.2L10.6 14.6H5.4L1.4 10.6V5.4L5.4 1.4Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><rect x="7.2" y="4.6" width="1.6" height="4.2" rx=".8" fill="currentColor"/><circle cx="8" cy="10.9" r=".95" fill="currentColor"/>',
};

const ALERT_LABELS = {
    note: 'Note',
    tip: 'Tip',
    important: 'Important',
    warning: 'Warning',
    caution: 'Caution',
};

// accent per alert type. also exposed on the element as the custom
// property --md-alert-accent, so css can pick it up without repeating
// the five colours
const ALERT_ACCENTS = {
    note: '#4493f8',
    tip: '#3fb950',
    important: '#ab7df8',
    warning: '#d29922',
    caution: '#f85149',
};

function alertIcon(type) {
    return `<svg class="markdown-alert-icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" style="flex:0 0 auto">${ALERT_ICONS[type]}</svg>`;
}

// alerts render as <blockquote>, not <div>, so a site that already
// styles blockquotes gets a sane box for free. with inlineStyles on
// (the default) the box and accent are written as style attributes too,
// so alerts look right on a page with no stylesheet at all. pass
// { inlineStyles: false } if you'd rather drive everything from css.
function alertOpenTag(type, inlineStyles) {
    const accent = ALERT_ACCENTS[type];
    let style = `--md-alert-accent:${accent}`;
    if (inlineStyles) {
        style +=
            `;border-left:0.25rem solid ${accent}` +
            ';padding:0.5rem 1rem;border-radius:0.375rem' +
            `;background:${accent}14;color:inherit`;
    }
    return `<blockquote class="markdown-alert markdown-alert-${type}" style="${style}">`;
}

function alertTitleTag(type, inlineStyles) {
    const style = inlineStyles
        ? ` style="display:flex;align-items:center;gap:0.5rem;font-weight:600` +
          `;line-height:1;margin:0 0 0.25rem;color:${ALERT_ACCENTS[type]}"`
        : '';
    return `<p class="markdown-alert-title"${style}>${alertIcon(type)}${ALERT_LABELS[type]}</p>`;
}

// --- tables -----------------------------------------------------------

// split one table row into trimmed cells, honouring \| escapes and
// ignoring pipes inside `inline code`
function splitTableRow(row) {
    const line = row.trim();
    const cells = [];
    let cur = '';
    let inCode = false;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '\\' && line[i + 1] === '|') {
            cur += '|';
            i++;
            continue;
        }
        if (ch === '`') {
            inCode = !inCode;
            cur += ch;
            continue;
        }
        if (ch === '|' && !inCode) {
            cells.push(cur);
            cur = '';
            continue;
        }
        cur += ch;
    }
    cells.push(cur);

    // drop the empty cells created by optional outer pipes
    if (cells.length > 1 && cells[0].trim() === '' && line.startsWith('|')) {
        cells.shift();
    }
    if (cells.length > 1 && cells[cells.length - 1].trim() === '' && line.endsWith('|')) {
        cells.pop();
    }

    return cells.map((c) => c.trim());
}

// |---|:---:|---:| style separator row
function isTableDelimiter(line) {
    if (typeof line !== 'string' || !line.includes('|')) return false;
    const cells = splitTableRow(line);
    if (!cells.length) return false;
    return cells.every((c) => /^:?-+:?$/.test(c));
}

function alignFromSpec(spec) {
    const left = spec.startsWith(':');
    const right = spec.endsWith(':');
    if (left && right) return 'center';
    if (right) return 'right';
    if (left) return 'left';
    return '';
}

function alignAttr(align) {
    return align ? ` style="text-align:${align}"` : '';
}

function renderTable(headerCells, aligns, bodyRows) {
    const colCount = Math.max(headerCells.length, aligns.length, 1);

    const pad = (cells) => {
        const out = cells.slice(0, colCount);
        while (out.length < colCount) out.push('');
        return out;
    };

    // a header row that is entirely blank (| | |) means "no header",
    // so skip the thead instead of emitting empty th cells
    const hasHeader = headerCells.some((c) => c !== '');

    let out = '<table>\n';

    if (hasHeader) {
        out += '<thead>\n<tr>\n';
        pad(headerCells).forEach((cell, n) => {
            out += `<th${alignAttr(aligns[n])}>${renderInline(cell)}</th>\n`;
        });
        out += '</tr>\n</thead>\n';
    }

    if (bodyRows.length) {
        out += '<tbody>\n';
        bodyRows.forEach((row) => {
            out += '<tr>\n';
            pad(row).forEach((cell, n) => {
                out += `<td${alignAttr(aligns[n])}>${renderInline(cell)}</td>\n`;
            });
            out += '</tr>\n';
        });
        out += '</tbody>\n';
    }

    out += '</table>\n';
    return out;
}

// --- block parser -----------------------------------------------------

function renderMarkdown(markdown, options = {}) {
    // alerts carry their own inline styling unless you opt out
    const inlineStyles = options.inlineStyles !== false;

    const src = String(markdown).replace(/\r\n/g, '\n');
    const lines = src.split('\n');

    let html = '';
    let i = 0;
    let paragraphBuf = [];

    function flushParagraph() {
        if (paragraphBuf.length) {
            // joined with \n, not a space, so renderInline can turn each
            // single newline into a <br>
            html += `<p>${renderInline(paragraphBuf.join('\n'), true)}</p>\n`;
            paragraphBuf = [];
        }
    }

    while (i < lines.length) {
        const line = lines[i];

        // fenced code block
        const fenceMatch = line.match(/^```(\S*)\s*$/);
        if (fenceMatch) {
            flushParagraph();
            const lang = fenceMatch[1] || '';
            const codeLines = [];
            i++;
            while (i < lines.length && !/^```\s*$/.test(lines[i])) {
                codeLines.push(lines[i]);
                i++;
            }
            i++;
            const langAttr = lang ? ` data-lang="${escapeHtml(lang)}"` : '';
            const langClass = lang ? ` language-${escapeHtml(lang)}` : '';
            const body = highlightCode(codeLines.join('\n'), lang);
            html += `<pre${langAttr}><code class="hljs${langClass}">${body}</code></pre>\n`;
            continue;
        }

        // headers
        const headerMatch = line.match(/^(#{1,6})\s+(.*)$/);
        if (headerMatch) {
            flushParagraph();
            const level = headerMatch[1].length;
            html += `<h${level}>${renderInline(headerMatch[2].trim())}</h${level}>\n`;
            i++;
            continue;
        }

        // pipe table: a row of cells followed by a |---|---| delimiter row
        if (line.includes('|') && isTableDelimiter(lines[i + 1])) {
            flushParagraph();
            const headerCells = splitTableRow(line);
            const aligns = splitTableRow(lines[i + 1]).map(alignFromSpec);
            i += 2;

            const bodyRows = [];
            while (
                i < lines.length &&
                lines[i].trim() !== '' &&
                lines[i].includes('|') &&
                !isTableDelimiter(lines[i])
            ) {
                bodyRows.push(splitTableRow(lines[i]));
                i++;
            }

            html += renderTable(headerCells, aligns, bodyRows);
            continue;
        }

        // horizontal rule
        if (/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
            flushParagraph();
            html += '<hr>\n';
            i++;
            continue;
        }

        // blockquote, consume consecutive '>' lines
        if (/^\s*>\s?/.test(line)) {
            flushParagraph();
            const quoteLines = [];
            while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
                quoteLines.push(lines[i].replace(/^\s*>\s?/, ''));
                i++;
            }

            // > [!NOTE] / [!TIP] / [!IMPORTANT] / [!WARNING] / [!CAUTION]
            // on the first line turns the quote into an alert callout
            const marker = quoteLines[0].trim().match(/^\[!(\w+)\]\s*(.*)$/);
            const type = marker && marker[1].toLowerCase();

            if (type && ALERT_LABELS[type]) {
                const rest = quoteLines.slice(1);
                // tolerate text left on the same line as the marker
                if (marker[2]) rest.unshift(marker[2]);
                html += `${alertOpenTag(type, inlineStyles)}\n`;
                html += `${alertTitleTag(type, inlineStyles)}\n`;
                html += `${renderMarkdown(rest.join('\n'), options)}</blockquote>\n`;
            } else {
                html += `<blockquote>${renderMarkdown(quoteLines.join('\n'), options)}</blockquote>\n`;
            }
            continue;
        }

        // unordered / ordered lists, consume consecutive item lines
        const ulItem = line.match(/^\s*[-*+]\s+(.*)$/);
        const olItem = line.match(/^\s*\d+\.\s+(.*)$/);
        if (ulItem || olItem) {
            flushParagraph();
            const ordered = !!olItem;
            const tag = ordered ? 'ol' : 'ul';
            const itemPattern = ordered ? /^\s*\d+\.\s+(.*)$/ : /^\s*[-*+]\s+(.*)$/;

            html += `<${tag}>\n`;
            while (i < lines.length && itemPattern.test(lines[i])) {
                const item = lines[i].match(itemPattern)[1];
                html += `<li>${renderInline(item.trim())}</li>\n`;
                i++;
            }
            html += `</${tag}>\n`;
            continue;
        }

        // blank line -> paragraph break
        if (line.trim() === '') {
            flushParagraph();
            i++;
            continue;
        }

        // accumulate into paragraph
        paragraphBuf.push(line.trim());
        i++;
    }
    flushParagraph();

    return html;
}

// --- styles -----------------------------------------------------------
//
// dark by default with a light-mode override at the end. every colour is
// a css variable declared up top, so restyling means overriding those,
// not editing rules.

const STYLES = `
/* styles for the output of markdown.js
   dark by default, with a light override at the bottom */

:root {
    --md-fg: #e6edf3;
    --md-muted: #9198a1;
    --md-border: #3d444d;
    --md-surface: #151b23;
    --md-code-bg: #0d1117;
    --md-page-bg: #0d1117;

    --md-note: #4493f8;
    --md-tip: #3fb950;
    --md-important: #ab7df8;
    --md-warning: #d29922;
    --md-caution: #f85149;

    --md-tok-comment: #9198a1;
    --md-tok-keyword: #ff7b72;
    --md-tok-string: #a5d6ff;
    --md-tok-number: #79c0ff;
    --md-tok-literal: #79c0ff;
    --md-tok-built-in: #ffa657;
    --md-tok-title: #d2a8ff;
    --md-tok-attr: #79c0ff;
    --md-tok-variable: #ffa657;
    --md-tok-meta: #79c0ff;
    --md-tok-name: #7ee787;
    --md-tok-operator: #ff7b72;
    --md-tok-addition: #3fb950;
    --md-tok-deletion: #f85149;
}

/* --- alerts ------------------------------------------------------- */

/* the accent comes from --md-alert-accent, which the renderer sets on
   each alert element, so there is no per-type rule to keep in sync.
   note that with inlineStyles on (the default) the renderer also writes
   these as style attributes, which win over this stylesheet. pass
   { inlineStyles: false } to renderMarkdown to hand control back here. */

.markdown-alert {
    padding: 0.5rem 1rem;
    margin: 0 0 1rem;
    border-left: 0.25rem solid var(--md-alert-accent, var(--md-border));
    border-radius: 0.375rem;
    background: var(--md-surface);
    color: var(--md-fg);
}

.markdown-alert > :first-child {
    margin-top: 0;
}

.markdown-alert > :last-child {
    margin-bottom: 0;
}

.markdown-alert-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    line-height: 1;
    margin: 0 0 0.25rem;
    color: var(--md-alert-accent, inherit);
}

.markdown-alert-icon {
    flex: 0 0 auto;
}

/* --- blockquotes, tables ------------------------------------------ */

blockquote {
    margin: 0 0 1rem;
    padding: 0.5rem 1rem;
    border-left: 0.25rem solid var(--md-border);
    border-radius: 0.375rem;
    background: var(--md-surface);
    color: var(--md-muted);
}

blockquote > :first-child {
    margin-top: 0;
}

blockquote > :last-child {
    margin-bottom: 0;
}

table {
    border-collapse: collapse;
    margin-bottom: 1rem;
    width: 100%;
    font-size: 0.95em;
}

th,
td {
    border: 1px solid var(--md-border);
    padding: 0.4rem 0.8rem;
    text-align: left;
    vertical-align: top;
}

thead th {
    background: var(--md-surface);
    font-weight: 600;
}

/* first column of a headerless table reads as a label column */
table:not(:has(thead)) td:first-child {
    white-space: nowrap;
}

/* --- code --------------------------------------------------------- */

pre {
    position: relative;
    margin: 0 0 1rem;
    padding: 0.85rem 1rem;
    overflow-x: auto;
    border: 1px solid var(--md-border);
    border-radius: 0.375rem;
    background: var(--md-code-bg);
}

pre code {
    display: block;
    padding: 0;
    background: none;
    border: 0;
    font-size: 0.875em;
    line-height: 1.5;
    tab-size: 4;
}

code {
    padding: 0.15em 0.35em;
    border-radius: 0.25rem;
    background: rgba(101, 108, 118, 0.2);
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas,
        "Liberation Mono", monospace;
    font-size: 0.875em;
}

/* language label in the corner. drop this rule if you don't want it */
pre[data-lang]::after {
    content: attr(data-lang);
    position: absolute;
    top: 0.35rem;
    right: 0.6rem;
    font-size: 0.7rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--md-muted);
    pointer-events: none;
}

/* --- syntax tokens (highlight.js compatible class names) ---------- */

.hljs-comment {
    color: var(--md-tok-comment);
    font-style: italic;
}
.hljs-keyword,
.hljs-operator,
.hljs-selector-tag {
    color: var(--md-tok-keyword);
}
.hljs-string,
.hljs-section {
    color: var(--md-tok-string);
}
.hljs-number {
    color: var(--md-tok-number);
}
.hljs-literal,
.hljs-type,
.hljs-selector-class,
.hljs-selector-id {
    color: var(--md-tok-literal);
}
.hljs-built_in {
    color: var(--md-tok-built-in);
}
.hljs-title,
.hljs-title.function_ {
    color: var(--md-tok-title);
}
.hljs-attr,
.hljs-attribute {
    color: var(--md-tok-attr);
}
.hljs-variable,
.hljs-template-variable {
    color: var(--md-tok-variable);
}
.hljs-meta {
    color: var(--md-tok-meta);
}
.hljs-name,
.hljs-tag {
    color: var(--md-tok-name);
}
.hljs-punctuation {
    color: var(--md-muted);
}
.hljs-addition {
    color: var(--md-tok-addition);
}
.hljs-deletion {
    color: var(--md-tok-deletion);
}

/* --- light mode --------------------------------------------------- */

@media (prefers-color-scheme: light) {
    :root {
        --md-fg: #1f2328;
        --md-muted: #59636e;
        --md-border: #d1d9e0;
        --md-surface: #f6f8fa;
        --md-code-bg: #f6f8fa;
        --md-page-bg: #ffffff;

        --md-note: #0969da;
        --md-tip: #1a7f37;
        --md-important: #8250df;
        --md-warning: #9a6700;
        --md-caution: #cf222e;

        --md-tok-comment: #59636e;
        --md-tok-keyword: #cf222e;
        --md-tok-string: #0a3069;
        --md-tok-number: #0550ae;
        --md-tok-literal: #0550ae;
        --md-tok-built-in: #953800;
        --md-tok-title: #6639ba;
        --md-tok-attr: #0550ae;
        --md-tok-variable: #953800;
        --md-tok-meta: #0550ae;
        --md-tok-name: #116329;
        --md-tok-operator: #cf222e;
        --md-tok-addition: #1a7f37;
        --md-tok-deletion: #cf222e;
    }

    code {
        background: rgba(129, 139, 152, 0.15);
    }
}
`;

// <style> block for server-rendered pages
function styleTag() {
    return `<style>\n${STYLES}\n</style>`;
}

// browser only: append the stylesheet to <head>, once
function injectStyles(doc) {
    const target = doc || (typeof document !== 'undefined' ? document : null);
    if (!target || target.getElementById('markdown-js-styles')) return false;
    const el = target.createElement('style');
    el.id = 'markdown-js-styles';
    el.textContent = STYLES;
    target.head.appendChild(el);
    return true;
}

// a complete standalone html document, styles included
function renderPage(markdown, options = {}) {
    return `<!doctype html>
<html lang="${escapeHtml(options.lang || 'en')}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(options.title || 'Document')}</title>
${styleTag()}
<style>
body {
    margin: 0;
    padding: 2rem 1.25rem;
    background: var(--md-page-bg);
    color: var(--md-fg);
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
    line-height: 1.6;
}
main { max-width: ${escapeHtml(String(options.maxWidth || '900px'))}; margin: 0 auto; }
</style>
</head>
<body>
<main>
${renderMarkdown(markdown, options)}</main>
</body>
</html>
`;
}

const api = {
    renderMarkdown,
    renderPage,
    renderInline,
    escapeHtml,
    highlightCode,
    registerLanguage,
    setHighlighter,
    stripMdExtension,
    STYLES,
    styleTag,
    injectStyles,
};

// works as a commonjs module, or as a plain <script> exposing window.markdown
if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
} else if (typeof globalThis !== 'undefined') {
    globalThis.markdown = api;
}