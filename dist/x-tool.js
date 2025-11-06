"use strict";
const ARRAY_ISARRAY = Array.isArray;
const WkMap = WeakMap;
const quMct = queueMicrotask;
const FT_C = true;
const FT_TI = typeof __FEAT_TEXT_INTERP__ === 'boolean' ? __FEAT_TEXT_INTERP__ : true;
const _FT_DR = typeof __FEAT_DEEP_REACTIVE__ === 'boolean' ? __FEAT_DEEP_REACTIVE__ : true;
const FT_IFB = typeof __FEAT_IF_BRANCHES__ === 'boolean' ? __FEAT_IF_BRANCHES__ : true;
const XToolFramework = function () {
    const _se = (fn) => { try {
        fn();
    }
    catch { } };
    const _tr = (s) => (s || '').trim();
    const _Afrom = Array.from;
    const _AisArr = ARRAY_ISARRAY;
    const _Okeys = Object.keys;
    const STR_STYLE = 'style';
    const STR_DISPLAY = 'display';
    const STR_NONE = 'none';
    const STR_TAGNAME = 'tagName';
    const STR_TEMPLATE = 'TEMPLATE';
    const STR_LENGTH = 'length';
    const STR_SOURCE = 'source';
    const STR_READONLY = 'readonly';
    let XTOOL_ENABLE_STATIC_DIRECTIVES = true;
    const d = (typeof document !== 'undefined' ? document : null);
    const STR_CONTENTS = 'contents';
    const EV_CLICK = 'click', EV_INPUT = 'input', EV_CHANGE = 'change', EV_KEYDOWN = 'keydown', EV_KEYUP = 'keyup';
    const EV_DELEGATED = [EV_CLICK, EV_INPUT, EV_CHANGE, EV_KEYDOWN, EV_KEYUP];
    const LS_PENDING = 0, LS_LOADING = 1, LS_LOADED = 2, LS_ERROR = 3;
    try {
        if (d && d.head && !d.getElementById('x-tool-initial-css')) {
            const style = d.createElement(STR_STYLE);
            style.id = 'x-tool-initial-css';
            style.textContent = '[x-show],[x-if],[x-else],[x-else-if],[x\\:show],[x\\:if],[x\\:else],[x\\:else-if]{display:none;}';
            d.head.appendChild(style);
        }
    }
    catch { }
    let PFX = 'x';
    let attrCache = new Map();
    const attrName = (name) => {
        const cached = attrCache.get(name);
        if (cached)
            return cached;
        const value = `${PFX}-${name}`;
        attrCache.set(name, value);
        return value;
    };
    let TokenType;
    (function (TokenType) {
        TokenType[TokenType["Identifier"] = 0] = "Identifier";
        TokenType[TokenType["Keyword"] = 1] = "Keyword";
        TokenType[TokenType["Punctuation"] = 2] = "Punctuation";
        TokenType[TokenType["String"] = 3] = "String";
        TokenType[TokenType["Comment"] = 4] = "Comment";
        TokenType[TokenType["Whitespace"] = 5] = "Whitespace";
        TokenType[TokenType["Number"] = 6] = "Number";
        TokenType[TokenType["Arrow"] = 7] = "Arrow";
    })(TokenType || (TokenType = {}));
    const keywords = new Set([
        'as', 'interface', 'type', 'import', 'export', 'from', 'extends', 'implements',
        'declare', 'namespace', 'module', 'any', 'unknown', 'never', 'void',
        'number', 'string', 'boolean', 'symbol', 'bigint', 'object', 'enum', 'function'
    ]);
    const visibility = ['public', 'private', 'protected', 'static', 'abstract', 'readonly'];
    const WS_RE = /\s/;
    const NUM_RE = /\d/;
    function stripTypes(source) {
        const ID_START_RE = /[a-zA-Z_$]/;
        const ID_PART_RE = /[a-zA-Z0-9_$]/;
        function isIdentifierStart(ch) { return ID_START_RE.test(ch); }
        function isIdentifierPart(ch) { return ID_PART_RE.test(ch); }
        const isWhitespace = (ch) => WS_RE.test(ch);
        const isNumber = (ch) => NUM_RE.test(ch);
        function isGenericStartEnd(startIndex, tokens) {
            const token = tokens[startIndex];
            const ch = token.value == '<' ? '<' : '>';
            return token.value == ch && (token.next?.value !== ch && token.prev?.value !== ch);
        }
        const skipUntil = (tokens, index, pred) => {
            const context = { index, depth: 0 };
            while (index < tokens.length && !pred(tokens[index], context))
                index++;
            return index;
        };
        const hasItem = (item, collection) => {
            return collection.indexOf(item) !== -1;
        };
        function skipType(tokens, startIndex, standalone = true) {
            let i = startIndex;
            const ctx = {};
            i = skipUntil(tokens, i, t => t.type !== TokenType.Whitespace && !(t.type === TokenType.Punctuation && hasItem(t.value, '|?&:')));
            let isSimple = hasItem(tokens[i].type, [TokenType.Keyword, TokenType.Identifier]);
            if (isSimple && tokens[i] && tokens[i].next?.type === TokenType.Punctuation && hasItem(tokens[i].next?.value, '<[{(')) {
                i = skipUntil(tokens, i, t => t.type === TokenType.Punctuation);
            }
            let isComplex = tokens[i].type === TokenType.Punctuation && hasItem(tokens[i].value, '<[{(');
            while (i < tokens.length) {
                if (isComplex) {
                    i = skipUntil(tokens, i, (t, ctx) => {
                        if (t.type === TokenType.Punctuation) {
                            if (hasItem(t.value, ']})>'))
                                ctx.depth--;
                            else if (hasItem(t.value, '<[{('))
                                ctx.depth++;
                        }
                        return ctx.depth <= 0;
                    });
                    i++;
                }
                else {
                    i = skipUntil(tokens, i, t => (TokenType.Whitespace === t.type && t.value !== " ") || (t.type === TokenType.Punctuation && t.value !== '.'));
                    if (standalone && tokens[i] && tokens[i].type === TokenType.Punctuation && hasItem(tokens[i].value, '<[{(')) {
                        let hasNewline = false;
                        skipUntil(tokens, i, t => { if (t.type === TokenType.Whitespace && hasItem("\n", t.value))
                            hasNewline = true; return hasNewline || t.start >= tokens[i].start; });
                        if (!hasNewline) {
                            i = skipUntil(tokens, i, (t, ctx) => {
                                if (t.type === TokenType.Punctuation) {
                                    if (hasItem(t.value, ']})>'))
                                        ctx.depth--;
                                    else if (hasItem(t.value, '<[{('))
                                        ctx.depth++;
                                }
                                return ctx.depth <= 0;
                            });
                            i++;
                        }
                    }
                }
                if (i >= tokens.length) {
                    break;
                }
                if (tokens[i].type === TokenType.Whitespace && hasItem("\n", tokens[i].value) && tokens[i].prev?.next && tokens[i].prev?.next?.type === TokenType.Punctuation && hasItem(tokens[i].prev?.next?.value, '?&|:')) {
                    i = skipUntil(tokens, i, t => t.type == TokenType.Punctuation);
                }
                if (tokens[i].type === TokenType.Whitespace)
                    i = skipUntil(tokens, i, t => !t.value.startsWith(' '));
                let cur = tokens[i];
                const isContinued = cur.type === TokenType.Punctuation && hasItem(cur.value, "?&|:") || (cur.type === TokenType.Arrow && cur.prev?.value === ')');
                if (!isContinued && (isSimple && cur.type === TokenType.Punctuation && (hasItem(cur.value, '(<[') || standalone && cur.value == '{'))) {
                    isComplex = true;
                    i = skipUntil(tokens, i, t => t.type !== TokenType.Whitespace);
                    continue;
                }
                if (isContinued) {
                    i++;
                    i = skipUntil(tokens, i, t => !t.value.startsWith(' '));
                }
                ctx.isContinued = isContinued;
                ctx.token = tokens[i];
                if (!isContinued) {
                    if (standalone) {
                        i++;
                    }
                    break;
                }
                else {
                    isSimple = hasItem(tokens[i].type, [TokenType.Keyword, TokenType.Identifier]);
                    isComplex = tokens[i].type === TokenType.Punctuation && hasItem(tokens[i].value, '<[{(');
                }
            }
            return i;
        }
        function tokenize(input) {
            const tokens = [];
            let pos = 0;
            const length = input.length;
            let prevToken;
            const createToken = (type, start, end) => {
                const token = {
                    type,
                    value: input.slice(start, end),
                    start,
                    end
                };
                if (prevToken) {
                    token.prev = prevToken;
                    prevToken.next = token;
                }
                if (type !== TokenType.Whitespace && type !== TokenType.Comment) {
                    prevToken = token;
                }
                return token;
            };
            while (pos < length) {
                const ch = input[pos];
                let start = pos;
                if (isWhitespace(ch)) {
                    do {
                        pos++;
                    } while (pos < length && isWhitespace(input[pos]));
                    tokens.push(createToken(TokenType.Whitespace, start, pos));
                    continue;
                }
                if (isIdentifierStart(ch)) {
                    pos++;
                    while (pos < length && isIdentifierPart(input[pos]))
                        pos++;
                    const value = input.slice(start, pos);
                    tokens.push(createToken(keywords.has(value) || hasItem(value, visibility) ? TokenType.Keyword : TokenType.Identifier, start, pos));
                    continue;
                }
                if (isNumber(ch)) {
                    do {
                        pos++;
                    } while (pos < length && isNumber(input[pos]));
                    tokens.push(createToken(TokenType.Number, start, pos));
                    continue;
                }
                if (ch === '"' || ch === "'" || ch === '`') {
                    const quoteType = ch;
                    pos++;
                    if (quoteType !== '`') {
                        while (pos < length) {
                            if (input[pos] === '\\')
                                pos += 2;
                            else if (input[pos] === quoteType) {
                                pos++;
                                break;
                            }
                            else
                                pos++;
                        }
                        tokens.push(createToken(TokenType.String, start, pos));
                        continue;
                    }
                    let tplExprDepth = 0;
                    while (pos < length) {
                        const c = input[pos];
                        if (c === '\\') {
                            pos += 2;
                            continue;
                        }
                        if (c === '`' && tplExprDepth === 0) {
                            pos++;
                            break;
                        }
                        if (c === '$' && pos + 1 < length && input[pos + 1] === '{') {
                            tplExprDepth++;
                            pos += 2;
                            while (pos < length && tplExprDepth > 0) {
                                const e = input[pos];
                                if (e === '\\') {
                                    pos += 2;
                                    continue;
                                }
                                if (e === '"' || e === "'") {
                                    const q = e;
                                    pos++;
                                    while (pos < length) {
                                        if (input[pos] === '\\')
                                            pos += 2;
                                        else if (input[pos] === q) {
                                            pos++;
                                            break;
                                        }
                                        else
                                            pos++;
                                    }
                                    continue;
                                }
                                if (e === '`') {
                                    pos++;
                                    let nestedDepth = 0;
                                    while (pos < length) {
                                        const n = input[pos];
                                        if (n === '\\') {
                                            pos += 2;
                                            continue;
                                        }
                                        if (n === '`' && nestedDepth === 0) {
                                            pos++;
                                            break;
                                        }
                                        if (n === '$' && pos + 1 < length && input[pos + 1] === '{') {
                                            nestedDepth++;
                                            pos += 2;
                                            continue;
                                        }
                                        if (n === '}' && nestedDepth > 0) {
                                            nestedDepth--;
                                            pos++;
                                            continue;
                                        }
                                        pos++;
                                    }
                                    continue;
                                }
                                if (e === '{') {
                                    tplExprDepth++;
                                    pos++;
                                    continue;
                                }
                                if (e === '}') {
                                    tplExprDepth--;
                                    pos++;
                                    continue;
                                }
                                pos++;
                            }
                            continue;
                        }
                        pos++;
                    }
                    tokens.push(createToken(TokenType.String, start, pos));
                    continue;
                }
                if (ch === '/' && pos + 1 < length) {
                    if (input[pos + 1] === '/') {
                        pos += 2;
                        while (pos < length && input[pos] !== '\n')
                            pos++;
                        tokens.push(createToken(TokenType.Comment, start, pos));
                        continue;
                    }
                    if (input[pos + 1] === '*') {
                        pos += 2;
                        while (pos < length && !(input[pos] === '*' && input[pos + 1] === '/'))
                            pos++;
                        pos += 2;
                        tokens.push(createToken(TokenType.Comment, start, pos));
                        continue;
                    }
                }
                if (ch === '=' && pos + 1 < length && input[pos + 1] === '>') {
                    pos += 2;
                    tokens.push(createToken(TokenType.Arrow, start, pos));
                    continue;
                }
                tokens.push(createToken(TokenType.Punctuation, pos, ++pos));
            }
            return tokens;
        }
        function isObjectLiteralStart(tokens, index) {
            let j = index - 1;
            while (j >= 0 && tokens[j].type === TokenType.Whitespace)
                j--;
            if (j < 0)
                return false;
            const prevToken = tokens[j];
            if (prevToken.type === TokenType.Arrow)
                return false;
            return (prevToken.type === TokenType.Identifier && prevToken.value === 'return') || prevToken.type === TokenType.Punctuation && (prevToken.value === '=' || prevToken.value === '(' || prevToken.value === '[' ||
                prevToken.value === ',' || prevToken.value === ':' || prevToken.value === '?');
        }
        const tokens = tokenize(source);
        let i = 0;
        const context = {
            isObjectLiteral: false,
            isClassBody: false,
            braceDepth: 0,
            lastIdentifier: undefined,
            lastKeyword: undefined
        };
        let objectBraceDepth = 0;
        let outputString = '';
        while (i < tokens.length) {
            const token = tokens[i];
            const tt = token.type;
            const v = token.value;
            if (tt === TokenType.Comment) {
                i++;
                continue;
            }
            if (tt === TokenType.Identifier) {
                context.lastIdentifier = v;
            }
            if ((tt == TokenType.Identifier || tt == TokenType.Keyword) && ((token.next?.type === TokenType.Keyword && token.next.value == 'enum') || (v == 'enum'))) {
                i = skipUntil(tokens, i, t => t.value == '}');
                i++;
                continue;
            }
            if (tt == TokenType.String || (tt != TokenType.Punctuation && TokenType.Whitespace != tt && TokenType.Keyword != tt)) {
                i++;
                outputString += v;
                continue;
            }
            if (tt === TokenType.Whitespace) {
                outputString += (v.includes('\n') ? '\n' : v);
                i++;
                continue;
            }
            if (context.lastIdentifier === 'class') {
                context.isClassBody = true;
            }
            if (tt === TokenType.Punctuation && v === '{') {
                context.braceDepth++;
                if (isObjectLiteralStart(tokens, i)) {
                    objectBraceDepth++;
                    context.isObjectLiteral = true;
                }
                outputString += token.value;
                i++;
                continue;
            }
            if (tt === TokenType.Punctuation && v === '}') {
                context.braceDepth--;
                if (context.isObjectLiteral) {
                    objectBraceDepth--;
                    if (objectBraceDepth <= 0)
                        context.isObjectLiteral = false;
                }
                if (context.braceDepth <= 0) {
                    context.isClassBody = false;
                }
                outputString += token.value;
                i++;
                continue;
            }
            if (tt === TokenType.Keyword) {
                if (!context.isObjectLiteral && v === 'import') {
                    i = skipUntil(tokens, i, t => (t.type === TokenType.Keyword && t.value === 'from'));
                    i = skipUntil(tokens, i, t => t.value === ';' || (t.type === TokenType.Whitespace && t.value.includes("\n")));
                    if (i < tokens.length && tokens[i].value === ';')
                        i++;
                    continue;
                }
                if (v === 'as' && !isObjectLiteralStart(tokens, i)) {
                    i++;
                    i = skipUntil(tokens, i, t => t.type !== TokenType.Whitespace);
                    i = skipType(tokens, i, false);
                    continue;
                }
                if (v === 'export' && !context.isObjectLiteral && (String(token.next?.value + token.next?.next?.value).match(/(const\s+)?(type|interface|enum|namespace|function)/))) {
                    i++;
                    i = skipUntil(tokens, i, t => t.type !== TokenType.Whitespace);
                    continue;
                }
                if (v === 'function' && token.next?.type === TokenType.Identifier && token.next?.next?.type === TokenType.Punctuation && token.next?.next?.value === '(' && token.next?.next?.next && token.next?.next?.next?.type === TokenType.Identifier) {
                    let j = i + 4;
                    let depth = 1;
                    while (j < tokens.length && depth > 0) {
                        const t = tokens[j];
                        if (t.type === TokenType.Punctuation) {
                            if (t.value === '(')
                                depth++;
                            else if (t.value === ')')
                                depth--;
                        }
                        j++;
                    }
                    j = skipUntil(tokens, j, t => t.type !== TokenType.Whitespace);
                    if (j < tokens.length && tokens[j].type === TokenType.Punctuation && tokens[j].value === ':') {
                        j++;
                        j = skipType(tokens, j, false);
                        j = skipUntil(tokens, j, t => t.type !== TokenType.Whitespace);
                    }
                    if (j < tokens.length && tokens[j].type === TokenType.Punctuation && tokens[j].value === ';') {
                        i = j + 1;
                        continue;
                    }
                }
            }
            if (!context.isObjectLiteral && tt === TokenType.Keyword && !isObjectLiteralStart(tokens, i) && hasItem(v, ['interface', 'type', 'declare', 'namespace', 'module'])) {
                if (v === 'type')
                    i = skipUntil(tokens, i, (t, ctx) => {
                        if (t.type === TokenType.Punctuation) {
                            if (hasItem(t.value, '<[({')) {
                                ctx.depth++;
                            }
                            else if (hasItem(t.value, '>])}')) {
                                ctx.depth--;
                            }
                        }
                        return ctx.depth <= 0 && t.type === TokenType.Punctuation && t.value == '=';
                    }), i++;
                else
                    i++;
                i = skipType(tokens, i, true);
                continue;
            }
            if (!context.isObjectLiteral && tt === TokenType.Keyword && v === 'implements' && token.next?.type !== TokenType.Punctuation && !context.isObjectLiteral) {
                i++;
                i = skipUntil(tokens, i, t => t.type === TokenType.Punctuation && t.value == '{');
                continue;
            }
            if (tt === TokenType.Punctuation && v === '!' && token.prev?.type !== TokenType.Punctuation && token.prev?.type !== TokenType.Arrow) {
                i++;
                continue;
            }
            if (tt === TokenType.Punctuation && v === '(') {
                if (token.next && token.next.value === '{') {
                    outputString += token.value;
                    i++;
                    continue;
                }
                outputString += v;
                i++;
                let depth = 1;
                while (i < tokens.length && depth > 0) {
                    const paramToken = tokens[i];
                    const pt = paramToken.type;
                    const pv = paramToken.value;
                    if (pt == TokenType.Punctuation && pv == '{' && isObjectLiteralStart(tokens, i)) {
                        skipUntil(tokens, i, (t, ctx) => {
                            if (t.type === TokenType.Punctuation) {
                                if (t.value === '{')
                                    ctx.depth++;
                                else if (t.value === '}')
                                    ctx.depth--;
                            }
                            outputString += tokens[i].value;
                            i++;
                            return ctx.depth <= 0;
                        });
                        continue;
                    }
                    if (pt == TokenType.Comment) {
                        i++;
                        continue;
                    }
                    if (pt === TokenType.Punctuation && pv === '(') {
                        depth++;
                    }
                    else if (pt === TokenType.Punctuation && pv === ')') {
                        depth--;
                    }
                    if (pt === TokenType.Keyword && hasItem(pv, visibility)) {
                        i++;
                        if (tokens[i].type === TokenType.Whitespace)
                            i = skipUntil(tokens, i, t => t.type !== TokenType.Whitespace);
                        continue;
                    }
                    if (pt === TokenType.Punctuation && pv === '!' && paramToken.prev && paramToken.prev.type === TokenType.Identifier) {
                        i++;
                        continue;
                    }
                    if (pt === TokenType.Punctuation && (pv === ':' || (pv == '?' && paramToken.next?.type == TokenType.Punctuation && paramToken.next?.value == ':')) || (TokenType.Keyword === pt && pv == 'as')) {
                        i++;
                        i = skipType(tokens, i, false);
                        continue;
                    }
                    if (i < tokens.length && tokens[i].type === TokenType.Punctuation && tokens[i].value === ')') {
                        outputString += tokens[i].value;
                        i++;
                        if (i < tokens.length && tokens[i].type === TokenType.Punctuation && tokens[i].value === ':') {
                            i++;
                            i = skipType(tokens, i, false);
                        }
                        continue;
                    }
                    outputString += paramToken.value;
                    i++;
                }
                continue;
            }
            if (tt === TokenType.Punctuation && (v === ':' || (v === '?' && token.next?.type === TokenType.Punctuation && token.next.value == ':'))) {
                if (token.prev && token.prev.type === TokenType.Identifier && !context.isObjectLiteral) {
                    i++;
                    i = skipType(tokens, i, false);
                    continue;
                }
            }
            if (tt === TokenType.Punctuation && v === '<' && isGenericStartEnd(i, tokens)) {
                if (i < tokens.length) {
                    let j = skipType(tokens, i, false);
                    if (tokens[j] && tokens[j].type === TokenType.Whitespace)
                        j = skipUntil(tokens, j, t => t.type !== TokenType.Whitespace);
                    let gt = tokens[j];
                    if (gt && gt.type == TokenType.Punctuation && '({['.indexOf(gt.value) !== -1) {
                        i = j;
                        continue;
                    }
                }
            }
            if (!context.isObjectLiteral && tt === TokenType.Keyword &&
                hasItem(v, visibility)) {
                i++;
                continue;
            }
            if (tt === TokenType.Keyword) {
                context.lastKeyword = token.value;
            }
            outputString += v;
            i++;
        }
        return outputString;
    }
    class XToolFramework {
        constructor() {
            this._components = new Map();
            this._byEl = new WkMap();
            this._pending = [];
            this._config = {};
            this._customDirectives = new Map();
            this._currentArrayInterceptorComp = null;
            this._namedComponentDefs = new Map();
            this._delegated = new WkMap();
            this._delegatedRootBound = false;
            this._prefetched = new Set();
            this._currentDocURL = '';
            this._scrollPositions = new Map();
            this.directive = (name, directive) => {
                if (name.startsWith(PFX + '-')) {
                    throw new Error(`Custom directive names should not start with "${PFX}-". Use: XTool.directive("my-directive", ...)`);
                }
                this._customDirectives.set(name, directive);
                return this;
            };
            this.registerComponent = (definition) => {
                if (!definition || !definition.name)
                    throw new Error('registerComponent requires a name');
                const name = definition.name.toLowerCase();
                if (this._namedComponentDefs.has(name))
                    return this;
                this._namedComponentDefs.set(name, definition);
                return this;
            };
            this._getRegisteredComponentDef = (name) => this._namedComponentDefs.get(name.toLowerCase());
            this._getCustomDirective = (name) => this._customDirectives.get(name);
            this._getConfig = () => this._config;
            this._preDiscoveryTasks = [];
            this.init = (config = {}) => {
                const base = { container: 'body', debug: false, staticDirectives: true, router: { enabled: false, transitionName: 'route' } };
                this._config = { ...base, ...config, router: { ...base.router, ...(config.router || {}) } };
                if (typeof this._config.staticDirectives === 'boolean') {
                    XTOOL_ENABLE_STATIC_DIRECTIVES = this._config.staticDirectives;
                }
                const _hpf = this._config.prefix;
                if (_hpf && typeof _hpf === 'string' && _hpf[STR_LENGTH] > 0) {
                    PFX = _hpf;
                }
                else {
                    PFX = 'x';
                }
                attrCache.clear();
                const start = async () => {
                    this._applyPrefixInitialCSS();
                    if (this._preDiscoveryTasks.length) {
                        try {
                            await Promise.allSettled(this._preDiscoveryTasks);
                        }
                        catch { }
                    }
                    this._autoDiscoverComponents();
                    const c = d?.querySelector(this._config.container);
                    if (c) {
                        this._ensureRootObserver(c);
                        if (this._config.delegate)
                            this._ensureDelegation(c);
                        if (this._routerEnabled())
                            this._installRouting(c);
                    }
                    try {
                        this._currentDocURL = this._normalizeDocURL(location.href);
                    }
                    catch { }
                };
                if (d && d.readyState === 'loading') {
                    d.addEventListener('DOMContentLoaded', () => { void start(); });
                }
                else if (!d || d.readyState === 'complete' || d.readyState === 'interactive') {
                    void start();
                }
                return this;
            };
            this._inflightComponentLoads = new Map();
            this._lazyComponentSources = new Map();
            this.loadComponents = (sources) => {
                const items = sources.map(s => typeof s === 'string' ? { path: s, mode: 'preload', name: undefined } : { path: s.path, mode: (s.mode || 'preload'), name: s.name });
                const tasks = [];
                for (const it of items) {
                    if (it.mode === 'defer') {
                        const p = this._fetchAndEvalComponent(it.path).catch(() => { throw new Error('load failed'); });
                        this._preDiscoveryTasks.push(p);
                        tasks.push(p.then(() => { }));
                    }
                    else if (it.mode === 'lazy') {
                        const inferredName = (it.name || it.path.split('/').pop() || '').replace(/\.(mjs|js|ts)(\?.*)?$/i, '').toLowerCase();
                        if (inferredName && !this._lazyComponentSources.has(inferredName)) {
                            this._lazyComponentSources.set(inferredName, { path: it.path, status: LS_PENDING });
                        }
                    }
                    else {
                        const p = this._fetchAndEvalComponent(it.path).catch(() => { throw new Error('load failed'); });
                        tasks.push(p);
                    }
                }
                return Promise.allSettled(tasks).then(results => {
                    try {
                        this._autoDiscoverComponents();
                    }
                    catch { }
                    const settled = results.length;
                    const failed = results.filter(r => r.status === 'rejected').length;
                    return { settled, failed };
                });
            };
            this.createComponent = (definition) => {
                const component = new ReactiveComponent(this._generateComponentId(), definition, this);
                this._components.set(component.id, component);
                component.callBeforeMount();
                return component;
            };
            this._autoDiscoverComponents = () => {
                const container = d?.querySelector(this._config.container);
                if (!container)
                    return;
                const dataAttr = attrName('data');
                if (container.hasAttribute(dataAttr) && !this._getComponentByElement(container)) {
                    this._bindElementAsComponent(container, undefined);
                }
                const componentElements = container.querySelectorAll(`[${dataAttr}]`);
                for (const element of componentElements) {
                    if (!this._getComponentByElement(element))
                        this._bindElementAsComponent(element);
                }
                const reusable = container.querySelectorAll('component[source]');
                for (const el of reusable) {
                    if (!this._getComponentByElement(el))
                        this._instantiateNamedComponent(el);
                }
                this._processPending();
                if (componentElements[STR_LENGTH] === 0 && !this._getComponentByElement(container)) {
                    const components = _Afrom(this._components.values());
                    const lastComponent = components[components[STR_LENGTH] - 1];
                    if (lastComponent && !lastComponent.isBound) {
                        lastComponent.bindToElement(container);
                    }
                }
            };
            this._processPending = () => {
                if (!this._pending[STR_LENGTH])
                    return;
                for (const p of this._pending) {
                    let cur = p.el.parentElement;
                    let parent;
                    while (cur && !parent) {
                        const maybe = this._getComponentByElement(cur);
                        if (maybe)
                            parent = maybe;
                        else
                            cur = cur.parentElement;
                    }
                    if (parent) {
                        p.comp.attachToParent(parent);
                    }
                }
                for (const p of this._pending)
                    p.comp.completeBinding();
                this._pending = [];
            };
            this._bindElementAsComponent = (element, parentForEval) => {
                const dataExpression = element.getAttribute(attrName('data'));
                let data = {};
                if (dataExpression) {
                    element.removeAttribute(attrName('data'));
                    try {
                        if (parentForEval) {
                            let parentCtx = {};
                            if (parentForEval._createMethodContext) {
                                try {
                                    parentCtx = parentForEval._createMethodContext();
                                }
                                catch { }
                            }
                            const evalFn = new Function('parent', `with(parent){ return (${dataExpression}) }`);
                            data = evalFn(parentCtx);
                        }
                        else {
                            data = this._parseDataExpression(dataExpression);
                        }
                        const desc = Object.getOwnPropertyDescriptors(data);
                        const computed = {};
                        const plainData = {};
                        for (const key in desc) {
                            const dsc = desc[key];
                            if (typeof dsc.get === 'function') {
                                computed[key] = dsc.get;
                            }
                            else if ('value' in dsc) {
                                plainData[key] = dsc.value;
                            }
                        }
                        const hasOwnMethods = plainData.methods || data.methods;
                        const methodsObj = data.methods;
                        const def = hasOwnMethods ? { methods: methodsObj, data: plainData } : { data: plainData };
                        if (_Okeys(computed).length)
                            def.computed = computed;
                        if (parentForEval) {
                            def.data.$parent = parentForEval;
                        }
                        data = def;
                    }
                    catch (e) {
                    }
                }
                const comp = this.createComponent(data);
                const initExpr = element.getAttribute(attrName('init')) || undefined;
                if (initExpr)
                    element.removeAttribute(attrName('init'));
                this._finalizeComponentMount(element, comp, { callBeforeMount: true, xInitExpr: initExpr });
            };
            this._generateComponentId = () => {
                const now = Date.now();
                const random = Math.random().toString(36).substring(2, 15);
                const counter = (this._components.size + 1).toString(36);
                return `component_${now}_${counter}_${random}`;
            };
            this._parseDataExpression = (expression) => {
                try {
                    return new Function('return ' + expression.trim())();
                }
                catch {
                    return {};
                }
            };
            this._unregisterComponent = (componentId) => { this._components.delete(componentId); };
            this._log = (..._args) => { };
            this._registerElement = (element, component) => {
                this._byEl.set(element, component);
            };
            this._unregisterElement = (element) => { try {
                this._byEl.delete(element);
            }
            catch { } };
        }
        _routerEnabled() { const c = this._config; return !!(c.router?.enabled); }
        _routerTransitionName() { const c = this._config; return (c.router?.transitionName ?? 'route'); }
        _isSameOrigin(href) {
            try {
                const u = new URL(href, d?.baseURI || location.href);
                const cur = new URL(location.href);
                return u.origin === cur.origin;
            }
            catch {
                return false;
            }
        }
        _isSameDocument(target) {
            try {
                const u = typeof target === 'string' ? new URL(target, d?.baseURI || location.href) : target;
                const cur = new URL(location.href);
                return (u.origin === cur.origin && u.pathname === cur.pathname && u.search === cur.search);
            }
            catch {
                return false;
            }
        }
        _normalizeDocURL(target) {
            const u = typeof target === 'string' ? new URL(target, d?.baseURI || location.href) : target;
            return `${u.origin}${u.pathname}${u.search}`;
        }
        _scrollToHash(hash) {
            try {
                if (!hash || hash === '#')
                    return false;
                const id = decodeURIComponent(hash.replace(/^#/, ''));
                const el = d.getElementById(id) || d.querySelector(`[name="${CSS.escape(id)}"]`);
                if (el) {
                    el.scrollIntoView({ block: 'start', 'behavior': 'instant' });
                    return true;
                }
            }
            catch { }
            return false;
        }
        _installRouting(root) {
            const self = this;
            const preload = (href) => {
                try {
                    if (!self._isSameOrigin(href))
                        return;
                }
                catch {
                    return;
                }
                const u = new URL(href, location.href);
                if (self._isSameDocument(u))
                    return;
                u.hash = '';
                const url = u.toString();
                if (self._prefetched.has(url))
                    return;
                const existing = d?.head?.querySelector(`link[rel="prefetch"][href="${CSS.escape(url)}"]`);
                if (existing) {
                    self._prefetched.add(url);
                    return;
                }
                try {
                    const link = d.createElement('link');
                    link.setAttribute('rel', 'prefetch');
                    link.setAttribute('as', 'document');
                    link.setAttribute('href', url);
                    d.head.appendChild(link);
                    self._prefetched.add(url);
                }
                catch { }
            };
            const onClick = (e) => {
                const ev = e;
                if (ev.defaultPrevented || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey)
                    return;
                let el = ev.target;
                while (el && el !== root && el.tagName !== 'A')
                    el = el.parentElement;
                if (!el || el.tagName !== 'A' || el.hasAttribute('download'))
                    return;
                const a = el;
                const href = a.getAttribute('href');
                if (!href || href.startsWith('#'))
                    return;
                const target = a.getAttribute('target');
                if (target && target.toLowerCase() === '_blank')
                    return;
                if (!self._isSameOrigin(href))
                    return;
                const url = new URL(href, location.href);
                if (self._isSameDocument(url))
                    return;
                ev.preventDefault();
                self._navigate(url.toString(), true, 'link').catch(() => { location.assign(url.toString()); });
            };
            root.addEventListener('click', onClick);
            if (this._config.router?.prefetchOnHover) {
                const preloadEventHandler = (e) => {
                    const t = e.target;
                    let el = t;
                    while (el && el !== root && el.tagName !== 'A')
                        el = el.parentElement;
                    if (!el || el.tagName !== 'A' || el.hasAttribute('download'))
                        return;
                    const href = el.getAttribute('href');
                    if (!href || href.startsWith('#'))
                        return;
                    preload(href);
                };
                root.addEventListener('mouseover', preloadEventHandler, { passive: true });
                root.addEventListener('touchstart', preloadEventHandler, { passive: true });
            }
            window.addEventListener('popstate', () => { self._navigate(location.href, false, 'popstate').catch(() => { }); });
        }
        async _navigate(url, push, source = 'program') {
            if (!this._routerEnabled())
                return Promise.resolve();
            if (!this._isSameOrigin(url)) {
                location.assign(url);
                return;
            }
            const targetURL = new URL(url);
            const targetKey = this._normalizeDocURL(targetURL);
            if (source !== 'popstate') {
                if (this._isSameDocument(targetURL)) {
                    location.href = url;
                    return;
                }
            }
            else {
                if (this._currentDocURL && targetKey === this._currentDocURL) {
                    this._scrollToHash(targetURL.hash);
                    return;
                }
            }
            const from = location.href;
            try {
                const res = await (this._config.router?.before?.(url, from, { source }));
                if (res === false)
                    return;
            }
            catch (err) {
                try {
                    this._config.router?.error?.(err, url, from);
                }
                catch { }
                return;
            }
            const curKey = this._currentDocURL || this._normalizeDocURL(from);
            this._scrollPositions.set(curKey, { x: window.scrollX || 0, y: window.scrollY || 0 });
            try {
                const html = await this._fetchHTML(url);
                if (push)
                    history.pushState({}, '', url);
                await this._swapDocument(html);
                this._currentDocURL = targetKey;
                _se(() => {
                    if (source === 'popstate') {
                        const pos = this._scrollPositions.get(targetKey);
                        if (pos)
                            (window).scrollTo(pos.x, pos.y);
                        else if (!this._scrollToHash(targetURL.hash))
                            (window).scrollTo(0, 0);
                    }
                    else {
                        if (!this._scrollToHash(targetURL.hash))
                            (window).scrollTo(0, 0);
                    }
                });
                try {
                    await this._config.router?.after?.(url, from, { source });
                }
                catch { }
            }
            catch (err) {
                if (err && (err.name === 'XToolRedirect' || err.message === 'XToolRedirect'))
                    return;
                _se(() => this._config.router?.error?.(err, url, from));
                try {
                    location.assign(url);
                }
                catch {
                    _se(() => location.href = url);
                }
            }
        }
        async _fetchHTML(url) {
            const res = await fetch(url, { credentials: 'same-origin', cache: 'default', redirect: 'follow' });
            if (res.redirected) {
                const finalUrl = res.url;
                try {
                    location.assign(finalUrl);
                }
                catch {
                    _se(() => location.href = finalUrl);
                }
                const e = new Error('XToolRedirect');
                e.name = 'XToolRedirect';
                e.url = finalUrl;
                throw e;
            }
            if (!res.ok)
                throw new Error(res.status + ' ' + res.statusText);
            return await res.text();
        }
        async _swapDocument(html) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const newHead = doc.head;
            const newTitle = newHead?.querySelector('title');
            const applySwap = () => {
                if (newTitle) {
                    const t = newTitle.textContent || '';
                    if (document.title !== t)
                        document.title = t;
                }
                const sel = this._config.container || 'body';
                const cur = d.querySelector(sel);
                const next = doc.querySelector(sel);
                if (cur && next) {
                    this._morphElement(cur, next);
                }
                else if (next) {
                    d.body.innerHTML = next.innerHTML;
                }
                else {
                    d.body.innerHTML = doc.body.innerHTML;
                }
                this._byEl.delete(cur);
                this._autoDiscoverComponents();
                const c = d?.querySelector(this._config.container);
                if (c) {
                    this._ensureRootObserver(c);
                    if (this._config.delegate)
                        this._ensureDelegation(c);
                }
            };
            const vt = (document).startViewTransition?.bind(document);
            if (vt && this._getConfig().router?.transitionName) {
                const sel = this._config.container || 'body';
                const cont = d.querySelector(sel);
                const prev = cont ? (cont.style.getPropertyValue('view-transition-name') || '') : '';
                _se(() => { if (cont)
                    cont.style.setProperty('view-transition-name', this._routerTransitionName()); });
                try {
                    const transition = vt(applySwap);
                    await transition.finished;
                }
                finally {
                    try {
                        if (cont) {
                            if (prev)
                                cont.style.setProperty('view-transition-name', prev);
                            else
                                cont.style.removeProperty('view-transition-name');
                        }
                    }
                    catch { }
                }
            }
            else
                applySwap();
        }
        _setAttributes(cur, next) {
            const curAttrs = cur.getAttributeNames();
            for (let i = 0; i < curAttrs.length; i++) {
                const name = curAttrs[i];
                if (!next.hasAttribute(name))
                    cur.removeAttribute(name);
            }
            const nextAttrs = next.getAttributeNames();
            for (let i = 0; i < nextAttrs.length; i++) {
                const name = nextAttrs[i];
                const val = next.getAttribute(name);
                if (cur.getAttribute(name) !== val)
                    cur.setAttribute(name, val);
            }
        }
        _attributesEqual(a, b) {
            const aNames = a.getAttributeNames();
            const bNames = b.getAttributeNames();
            if (aNames.length !== bNames.length)
                return false;
            const map = new Map();
            for (let i = 0; i < aNames.length; i++) {
                const n = aNames[i];
                map.set(n, a.getAttribute(n));
            }
            for (let i = 0; i < bNames.length; i++) {
                const n = bNames[i];
                if (!map.has(n))
                    return false;
                if (map.get(n) !== b.getAttribute(n))
                    return false;
            }
            return true;
        }
        _isDynamicNode(el) {
            const tag = el.tagName;
            if (tag === 'IFRAME' && el.hasAttribute('src'))
                return true;
            if (tag === 'COMPONENT' && el.hasAttribute('source'))
                return true;
            return false;
        }
        _morphElement(cur, next) {
            if (cur.nodeName !== next.nodeName || this._isDynamicNode(next)) {
                cur.replaceWith(next.cloneNode(true));
                return;
            }
            this._setAttributes(cur, next);
            if (!cur.firstChild && !next.firstChild)
                return;
            const curChildren = Array.from(cur.childNodes);
            const nextChildren = Array.from(next.childNodes);
            const max = nextChildren.length;
            for (let i = 0; i < max; i++) {
                const n = nextChildren[i];
                const c = curChildren[i];
                if (!c) {
                    cur.appendChild(n.cloneNode(true));
                    continue;
                }
                if (n.nodeType === c.nodeType) {
                    if (n.nodeType === 3) {
                        const a = c;
                        const b = n;
                        if (a.data !== b.data)
                            a.data = b.data;
                    }
                    else if (n.nodeType === 1) {
                        const cn = c;
                        const nn = n;
                        if (this._isDynamicNode(nn)) {
                            try {
                                cn.replaceWith(nn.cloneNode(true));
                            }
                            catch { }
                        }
                        else if (cn.nodeName === nn.nodeName && this._attributesEqual(cn, nn)) {
                            this._morphElement(cn, nn);
                        }
                        else {
                            try {
                                cn.replaceWith(nn.cloneNode(true));
                            }
                            catch { }
                        }
                    }
                    else {
                        try {
                            c.replaceWith(n.cloneNode(true));
                        }
                        catch { }
                    }
                }
                else {
                    try {
                        c.replaceWith(n.cloneNode(true));
                    }
                    catch { }
                }
            }
            if (curChildren.length > max) {
                for (let i = curChildren.length - 1; i >= max; i--) {
                    const toRemove = cur.childNodes[i];
                    try {
                        cur.removeChild(toRemove);
                    }
                    catch { }
                }
            }
        }
        _fetchAndEvalComponent(path, retries = 2, baseDelay = 300) {
            const existing = this._inflightComponentLoads.get(path);
            if (existing)
                return existing;
            const self = this;
            const isTypeScript = /\.ts?$/.test(new URL(path, d?.baseURI || location.href).pathname);
            const html = (strings, ...values) => strings.reduce((acc, str, i) => acc + str + (i < values.length ? values[i] : ''), '') + `\n`;
            const attempt = (n) => {
                return fetch(path, { cache: 'no-cache' }).then(res => {
                    if (!res.ok)
                        throw new Error(res.status + ' ' + res.statusText);
                    return res.text();
                }).then(code => {
                    if (isTypeScript) {
                        code = stripTypes(code);
                    }
                    const wrapped = code + `\n//# sourceURL=${path}`;
                    try {
                        new Function('XTool', 'html', wrapped)(self, html);
                    }
                    catch (err) {
                        console.error(`Error evaluating component script at ${path}:`, err);
                    }
                }).catch(err => {
                    if (n >= retries)
                        throw err;
                    const delay = baseDelay * Math.pow(2, n);
                    return new Promise(resolve => setTimeout(resolve, delay)).then(() => attempt(n + 1));
                });
            };
            const p = attempt(0).finally(() => { this._inflightComponentLoads.delete(path); });
            this._inflightComponentLoads.set(path, p);
            return p;
        }
        _applyPrefixInitialCSS() {
            if (!d)
                return;
            if (PFX === 'x')
                return;
            const id = `x-tool-initial-css-${PFX}`;
            if (d.head && !d.getElementById(id)) {
                const style = d.createElement(STR_STYLE);
                style.id = id;
                style.textContent = `[${PFX}-show],[${PFX}-if],[${PFX}-else],[${PFX}-else-if],[${PFX}\\:show],[${PFX}\\:if],[${PFX}\\:else],[${PFX}\\:else-if]{display:none;}`;
                d.head.appendChild(style);
            }
        }
        _ensureRootObserver(container) {
            if (this._rootObserver || typeof MutationObserver === 'undefined')
                return;
            this._rootObserver = new MutationObserver(records => {
                for (const r of records) {
                    if (r.type === 'childList') {
                        for (let i = 0; i < r.addedNodes.length; i++) {
                            const n = r.addedNodes[i];
                            if (n.nodeType !== 1)
                                continue;
                            const el = n;
                            if (el[STR_TAGNAME] === 'COMPONENT') {
                                const src = el.getAttribute(STR_SOURCE);
                                if (src && !this._getComponentByElement(el))
                                    this._instantiateNamedComponent(el);
                            }
                        }
                        for (let i = 0; i < r.removedNodes.length; i++) {
                            const n = r.removedNodes[i];
                            if (n.nodeType !== 1)
                                continue;
                            const el = n;
                            quMct(() => {
                                if (el.isConnected)
                                    return;
                                const stack = [el];
                                while (stack.length) {
                                    const cur = stack.pop();
                                    const comp = this._getComponentByElement(cur);
                                    if (comp && !comp.isDestroyed) {
                                        try {
                                            comp.destroy();
                                        }
                                        catch { }
                                    }
                                    let child = cur.firstElementChild;
                                    while (child) {
                                        stack.push(child);
                                        child = child.nextElementSibling;
                                    }
                                }
                            });
                        }
                    }
                    else if (r.type === 'attributes') {
                        const target = r.target;
                        if (target && target[STR_TAGNAME] === 'COMPONENT') {
                            if (r.attributeName === STR_SOURCE) {
                                this._onComponentSourceChanged(target);
                            }
                            else if (r.attributeName === STR_READONLY) {
                                const comp = this._getComponentByElement(target);
                                if (comp) {
                                    try {
                                        const ro = target.hasAttribute(STR_READONLY);
                                        comp.setFrozen(!!ro);
                                    }
                                    catch { }
                                }
                            }
                        }
                    }
                }
                this._processPending();
            });
            this._rootObserver.observe(container, { childList: true, subtree: true, attributes: true, attributeFilter: [STR_SOURCE, STR_READONLY] });
        }
        _ensureIO(rootMargin) {
            if (typeof IntersectionObserver === 'undefined')
                return null;
            if (!this._ioObservers)
                this._ioObservers = new Map();
            if (!this._ioRegistry)
                this._ioRegistry = new WkMap();
            const key = rootMargin || '0px';
            let io = this._ioObservers.get(key);
            if (io)
                return io;
            const handle = (entries) => {
                for (const entry of entries) {
                    const el = entry.target;
                    const reg = this._ioRegistry.get(el);
                    if (!reg)
                        continue;
                    const now = !!entry.isIntersecting;
                    const before = !!reg.visible;
                    reg.visible = now;
                    if (now && (!before)) {
                        const arr = reg.enter || [];
                        for (let i = 0; i < arr.length; i++) {
                            _se(() => arr[i].cb(entry, { phase: 'enter', visible: now, before }));
                        }
                        if (arr.length)
                            reg.enter = arr.filter(a => !a.once);
                    }
                    else if (!now && before) {
                        const arr = reg.leave || [];
                        for (let i = 0; i < arr.length; i++) {
                            _se(() => arr[i].cb(entry, { phase: 'leave', visible: now, before }));
                        }
                        if (arr.length)
                            reg.leave = arr.filter(a => !a.once);
                    }
                }
            };
            io = new IntersectionObserver(handle, { root: null, rootMargin: key });
            this._ioObservers.set(key, io);
            return io;
        }
        _ioObserve(el, rootMargin, onEnter, onLeave) {
            const io = this._ensureIO(rootMargin);
            if (!io)
                return () => { };
            if (!this._ioRegistry)
                this._ioRegistry = new WkMap();
            let reg = this._ioRegistry.get(el);
            if (!reg) {
                reg = { rootMargin };
                this._ioRegistry.set(el, reg);
            }
            if (onEnter && onEnter.cb) {
                (reg.enter || (reg.enter = [])).push({ cb: onEnter.cb, once: !!onEnter.once });
            }
            if (onLeave && onLeave.cb) {
                (reg.leave || (reg.leave = [])).push({ cb: onLeave.cb, once: !!onLeave.once });
            }
            _se(() => io.observe(el));
            return () => { _se(() => io.unobserve(el)); };
        }
        _onComponentSourceChanged(el) {
            const src = _tr(el.getAttribute('source'));
            const existing = this._getComponentByElement(el);
            if (!src) {
                if (existing && !existing.isDestroyed) {
                    try {
                        existing.destroy();
                    }
                    catch { }
                }
                el.innerHTML = '';
                return;
            }
            if (existing && !existing.isDestroyed) {
                try {
                    existing.destroy();
                }
                catch { }
            }
            el.innerHTML = '';
            this._instantiateNamedComponent(el);
        }
        _finalizeComponentMount(el, comp, opts) {
            comp.element = el;
            if (opts?.callBeforeMount) {
                _se(() => comp.callBeforeMount());
            }
            this._registerElement(comp.element, comp);
            this._pending.push({ el, comp });
            if (opts?.xInitExpr) {
                const initExpr = opts.xInitExpr;
                const existingMounted = comp._lifecycle?.mounted;
                comp._lifecycle.mounted = function () {
                    if (existingMounted) {
                        _se(() => existingMounted.call(this));
                    }
                    const evaluator = new Function('ctx', 'with(ctx){' + initExpr + '} ');
                    quMct(() => {
                        if (comp.isDestroyed || !comp.element || !comp.element.isConnected)
                            return;
                        try {
                            const ctx = comp._createMethodContext?.() || comp.getContext?.() || {};
                            const result = evaluator(ctx);
                            if (typeof result === 'function') {
                                _se(() => result());
                            }
                        }
                        catch { }
                    });
                };
            }
        }
        _instantiateNamedComponent(el) {
            const source = el.getAttribute('source');
            if (!source)
                return;
            let def = this._getRegisteredComponentDef(source);
            if (!def) {
                const name = source.toLowerCase();
                const lazy = this._lazyComponentSources?.get(name);
                if (lazy) {
                    if (lazy.status === LS_PENDING) {
                        lazy.status = LS_LOADING;
                        lazy.promise = this._fetchAndEvalComponent(lazy.path)
                            .then(() => { lazy.status = LS_LOADED; })
                            .catch(() => { lazy.status = LS_ERROR; });
                    }
                    lazy.promise?.then(() => { _se(() => { const again = this._getRegisteredComponentDef(source); if (again)
                        this._instantiateNamedComponent(el); }); });
                }
                return;
            }
            let parentComp;
            let par = el.parentElement;
            while (par && !parentComp) {
                const maybe = this._getComponentByElement(par);
                if (maybe)
                    parentComp = maybe;
                else
                    par = par.parentElement;
            }
            let props = null;
            let dynamicPropObj = null;
            let rawPropExpression = null;
            if (!props)
                props = {};
            const propExpr = el.getAttribute(attrName('prop'));
            if (propExpr) {
                rawPropExpression = propExpr;
                if (parentComp) {
                    try {
                        const fn = new Function('ctx', 'with(ctx){return (' + propExpr + ')}');
                        const ctx = parentComp.getContext(true);
                        dynamicPropObj = fn(ctx);
                    }
                    catch {
                        dynamicPropObj = null;
                    }
                }
                else {
                    try {
                        dynamicPropObj = new Function('return (' + propExpr + ')')();
                    }
                    catch {
                        dynamicPropObj = null;
                    }
                }
                if (dynamicPropObj && typeof dynamicPropObj === 'object')
                    for (const k in dynamicPropObj)
                        if (!(k in props))
                            props[k] = String(dynamicPropObj[k]);
                el.removeAttribute(attrName('prop'));
            }
            let baseData = {};
            if (def.makeData) {
                _se(() => { const result = def.makeData(props); if (result)
                    baseData = result; });
            }
            if (def.data) {
                for (const k in def.data) {
                    baseData[k] = def.data[k];
                }
            }
            for (const k in props) {
                if (!(k in baseData))
                    baseData[k] = props[k];
            }
            baseData.$props = props;
            let initDef;
            if (typeof def.init === 'function') {
                try {
                    const maybe = def.init(props);
                    initDef = (maybe && typeof maybe === 'object') ? maybe : undefined;
                }
                catch {
                    initDef = undefined;
                }
            }
            const compDef = {
                data: baseData,
                methods: { ...(def.methods || {}), ...(initDef?.methods || {}) },
                computed: { ...(def.computed || {}), ...(initDef?.computed || {}) },
                propEffects: { ...(def.propEffects || {}), ...(initDef?.propEffects || {}) },
                mounted: initDef?.mounted || def.mounted,
                unmounted: initDef?.unmounted || def.unmounted,
                beforeMount: initDef?.beforeMount || def.beforeMount,
                beforeUnmount: initDef?.beforeUnmount || def.beforeUnmount,
                updated: initDef?.updated || def.updated,
                destroyed: initDef?.destroyed || def.destroyed,
                beforeDestroy: initDef?.beforeDestroy || def.beforeDestroy
            };
            const comp = this.createComponent(compDef);
            const originalChildren = Array.from(el.childNodes);
            if (originalChildren.length)
                el.replaceChildren();
            if (def.template) {
                const applyTemplate = (tpl) => {
                    el.innerHTML = tpl;
                    const slots = el.querySelectorAll('slot');
                    if (slots.length) {
                        for (const slotEl of slots) {
                            const name = slotEl.getAttribute('name');
                            const matched = name
                                ? originalChildren.filter(n => n.nodeType === 1 && n.getAttribute('slot') === name)
                                : originalChildren.filter(n => n.nodeType !== 1 || !n.hasAttribute('slot'));
                            if (matched.length)
                                slotEl.replaceWith(...matched);
                        }
                    }
                };
                const tplVal = def.template;
                if (typeof tplVal === 'string') {
                    applyTemplate(tplVal);
                }
                else if (typeof tplVal === 'function') {
                    try {
                        const res = tplVal();
                        if (res && typeof res.then === 'function') {
                            el.innerHTML = '';
                            res.then(html => { applyTemplate(html || ''); _se(() => comp._applyAsyncTemplateResolved()); });
                        }
                        else {
                            applyTemplate(String(res || ''));
                        }
                    }
                    catch {
                        el.innerHTML = '';
                    }
                }
                else if (tplVal && typeof tplVal.then === 'function') {
                    el.innerHTML = '';
                    tplVal.then(html => { applyTemplate(html || ''); _se(() => comp._applyAsyncTemplateResolved()); });
                }
            }
            else {
                if (originalChildren.length)
                    el.append(...originalChildren);
            }
            this._finalizeComponentMount(el, comp, { callBeforeMount: false });
            try {
                const nested = el.querySelectorAll(`[${attrName('data')}]`);
                for (const node of nested) {
                    if (!this._getComponentByElement(node))
                        this._bindElementAsComponent(node, comp);
                }
            }
            catch { }
            if (rawPropExpression && parentComp) {
                _se(() => comp._initReactiveProps(rawPropExpression, parentComp));
            }
            this._processPending();
        }
        _getComponentByElement(element) { return this._byEl.get(element); }
        observe(_element) { }
        _ensureDelegation(container) {
            if (this._delegatedRootBound)
                return;
            const root = container;
            const handler = (e) => {
                let cur = e.target;
                while (cur && cur !== root.parentElement) {
                    if (e.cancelBubble)
                        break;
                    const map = this._delegated.get(cur);
                    if (map) {
                        const list = map.get(e.type);
                        if (list && list.length) {
                            for (const h of [...list]) {
                                try {
                                    if (h.comp && h.comp.isDestroyed) {
                                        const i = list.indexOf(h);
                                        if (i > -1)
                                            list.splice(i, 1);
                                        continue;
                                    }
                                    if (!h.filter || h.filter(e)) {
                                        h.run(e);
                                        if (h.once) {
                                            const idx = list.indexOf(h);
                                            if (idx > -1)
                                                list.splice(idx, 1);
                                        }
                                    }
                                }
                                catch { }
                            }
                        }
                    }
                    cur = cur.parentElement;
                }
            };
            const captureEvents = ['keydown', 'keyup'];
            const bubbleEvents = ['click', 'input', 'change'];
            for (const ev of captureEvents)
                root.addEventListener(ev, handler, true);
            for (const ev of bubbleEvents)
                root.addEventListener(ev, handler, false);
            this._delegatedRootBound = true;
        }
        _registerDelegated(element, event, entry) {
            let map = this._delegated.get(element);
            if (!map) {
                map = new Map();
                this._delegated.set(element, map);
            }
            let list = map.get(event);
            if (!list) {
                list = [];
                map.set(event, list);
            }
            list.push(entry);
            return () => {
                try {
                    const m = this._delegated.get(element);
                    const l = m?.get(event);
                    if (!l)
                        return;
                    const idx = l.indexOf(entry);
                    if (idx > -1)
                        l.splice(idx, 1);
                }
                catch { }
            };
        }
    }
    class ReactiveComponent {
        attachToParent(parent) {
            this._parent = parent;
            parent._addChild(this);
        }
        get id() { return this._id; }
        get framework() { return this._framework; }
        get element() { return this._element; }
        set element(el) { this._element = el; }
        get isBound() { return this._isBound; }
        set isBound(v) { this._isBound = v; }
        get isMounted() { return this._isMounted; }
        set isMounted(v) { this._isMounted = v; }
        get isDestroyed() { return this._isDestroyed; }
        set isDestroyed(v) { this._isDestroyed = v; }
        _abortInvokerResources() {
            for (const byKind of this._invokerResources.values()) {
                for (const cleanup of byKind.values()) {
                    _se(cleanup);
                }
            }
            this._invokerResources.clear();
        }
        _cancelUserResources() {
            this._abortInvokerResources();
        }
        _resolveBindingMeta(element, attributeName) {
            const elAny = element;
            let propName = attributeName in elAny ? attributeName : null;
            if (!propName) {
                const camel = attributeName.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
                propName = camel in elAny ? camel : (attributeName.toLowerCase() === 'readonly' && 'readOnly' in elAny ? 'readOnly' : null);
            }
            const isBooleanProp = !!(propName && typeof elAny[propName] === 'boolean');
            const hasNonFunctionProp = !!(propName && typeof elAny[propName] !== 'function');
            const isKnownBooleanAttr = !!ReactiveComponent._BA[attributeName.toLowerCase()];
            return { elAny, propName, isBooleanProp, hasNonFunctionProp, isKnownBooleanAttr };
        }
        _applyGenericBinding(element, attributeName, value, meta) {
            const { elAny, propName, isBooleanProp, hasNonFunctionProp, isKnownBooleanAttr } = meta;
            if ((isBooleanProp && propName) || isKnownBooleanAttr) {
                const boolVal = !!value;
                if (propName && isBooleanProp)
                    elAny[propName] = boolVal;
                if (boolVal)
                    element.setAttribute(attributeName, '');
                else
                    element.removeAttribute(attributeName);
                return;
            }
            let normalized = null;
            if (value && typeof value === 'object') {
                const parts = [];
                for (const k in value) {
                    if (value[k])
                        parts.push(k);
                }
                normalized = parts.length ? parts.join(' ') : null;
            }
            else if (value !== null && value !== undefined) {
                normalized = String(value);
            }
            if (hasNonFunctionProp && propName) {
                if (normalized !== null) {
                    try {
                        elAny[propName] = normalized;
                    }
                    catch {
                        try {
                            element.setAttribute(attributeName, normalized);
                        }
                        catch { }
                    }
                }
                else {
                    element.removeAttribute(attributeName);
                }
                return;
            }
            if (normalized !== null) {
                const cur = element.getAttribute(attributeName);
                if (cur !== normalized)
                    element.setAttribute(attributeName, normalized);
            }
            else {
                element.removeAttribute(attributeName);
            }
        }
        _scanDirectiveAttrs(el, opts) {
            const prefixDash = PFX + '-';
            const prefixColon = PFX + ':';
            const namesOut = [];
            let hasTextOrHtml = false;
            let forName = null;
            const names = el.getAttributeNames();
            for (let i = 0; i < names.length; i++) {
                const name = names[i];
                const isDir = name.startsWith(prefixDash) || name.startsWith(prefixColon) || name.startsWith('@');
                if (!isDir)
                    continue;
                if (opts?.skipRootFor && name === attrName('for'))
                    continue;
                namesOut.push(name);
                if (!hasTextOrHtml && (name === attrName('text') || name === attrName('html')))
                    hasTextOrHtml = true;
                if (!forName && name === attrName('for'))
                    forName = name;
            }
            return { names: namesOut, hasTextOrHtml, forName };
        }
        setFrozen(on) {
            if (on === this._isFrozen)
                return;
            this._isFrozen = on;
            if (on) {
                this._sealedBeforeFreeze = this._isSealed;
                this._isSealed = true;
                this._cancelUserResources();
            }
            else {
                if (this._sealedBeforeFreeze !== null) {
                    this._isSealed = this._sealedBeforeFreeze;
                }
                else {
                    this._isSealed = false;
                }
                this._sealedBeforeFreeze = null;
                try {
                    this._scheduleRender();
                }
                catch { }
            }
        }
        _setSealed(on) {
            if (on === this._isSealed)
                return;
            this._isSealed = on;
            if (on) {
                this._cancelUserResources();
            }
        }
        _addDirective(element, directive) {
            const existing = this._directives.get(element) || [];
            existing.push(directive);
            this._directives.set(element, existing);
        }
        constructor(id, def, framework) {
            this._propUpdateActive = false;
            this._runningPropEffect = false;
            this._element = null;
            this._isBound = false;
            this._isMounted = false;
            this._isDestroyed = false;
            this._beforeMountCalled = false;
            this._children = [];
            this._parent = null;
            this._computed = {};
            this._propEffects = {};
            this._computedCache = new Map();
            this._computedDeps = new Map();
            this._computedKeyStack = [];
            this._isInComputedEvaluation = false;
            this._isInMethodExecution = false;
            this._allEffects = new Set();
            this._hasComputed = false;
            this._directives = new Map();
            this._cleanupFunctions = new Set();
            this._directiveAbort = new AbortController();
            this._invokerResources = new Map();
            this._targetIds = new WkMap();
            this._targetSeq = 0;
            this._isSealed = false;
            this._isFrozen = false;
            this._sealedBeforeFreeze = null;
            this._isMutationEnabled = true;
            this._effectsToRun = new Set();
            this._currentInvoker = null;
            this._loopScopes = new WkMap();
            this._expressionCache = new Map();
            this._propertyDependencies = new Map();
            this._activeEffect = null;
            this._renderScheduled = false;
            this._nextTickQueue = [];
            this._changeFrameId = null;
            this._renderFrameId = null;
            this._initialClassSets = new WkMap();
            this._rawData = {};
            this._propParent = null;
            this._callLifecycleHook = (hookName) => {
                const hook = this._lifecycle[hookName];
                if (typeof hook === 'function') {
                    this._safeExecute(() => this._runWithGlobalInterception(hook, []));
                }
            };
            this._addCleanupFunction = (fn) => {
                if (typeof fn !== 'function')
                    return undefined;
                const wrapped = () => {
                    try {
                        fn();
                    }
                    catch { }
                    this._cleanupFunctions.delete(wrapped);
                };
                this._cleanupFunctions.add(wrapped);
                return () => { this._cleanupFunctions.delete(wrapped); };
            };
            this._id = id;
            this._framework = framework;
            this._originalMethods = def.methods || {};
            this._computed = this._bindComputed(def.computed || {});
            this._propEffects = def.propEffects || {};
            if (this._propEffects && Object.keys(this._propEffects).length) {
                this._propEffects = this._bindPropEffects();
            }
            this._hasComputed = !!(def.computed && Object.keys(def.computed).length);
            this._lifecycle = {
                mounted: def.mounted,
                unmounted: def.unmounted || def.destroyed,
                updated: def.updated,
                beforeMount: def.beforeMount,
                beforeUnmount: def.beforeUnmount || def.beforeDestroy
            };
            this._rawData = this._cloneData(def.data || {});
            this._data = this._createReactiveData(this._rawData || {});
            this._methods = this._bindMethods();
        }
        _cloneData(value, seen) {
            if (value === null || typeof value !== 'object')
                return value;
            const s = seen || new WeakMap();
            if (s.has(value))
                return s.get(value);
            if (ARRAY_ISARRAY(value)) {
                const arr = [];
                s.set(value, arr);
                for (let i = 0; i < value.length; i++)
                    arr[i] = this._cloneData(value[i], s);
                return arr;
            }
            if (value instanceof Date)
                return new Date(value.getTime());
            if (value instanceof RegExp)
                return new RegExp(value.source, value.flags);
            if (typeof Map !== 'undefined' && value instanceof Map) {
                const m = new Map();
                s.set(value, m);
                value.forEach((v, k) => { m.set(this._cloneData(k, s), this._cloneData(v, s)); });
                return m;
            }
            if (typeof Set !== 'undefined' && value instanceof Set) {
                const st = new Set();
                s.set(value, st);
                value.forEach(v => st.add(this._cloneData(v, s)));
                return st;
            }
            const proto = Object.getPrototypeOf(value);
            if (proto === Object.prototype || proto === null) {
                const out = Object.create(proto);
                s.set(value, out);
                for (const key of Object.keys(value)) {
                    out[key] = this._cloneData(value[key], s);
                }
                return out;
            }
            return value;
        }
        callBeforeMount() {
            if (!this._beforeMountCalled) {
                this._callLifecycleHook('beforeMount');
                this._beforeMountCalled = true;
            }
        }
        _onDataChange(_property) {
            if (!this.isBound)
                return;
            const self = this;
            if (self._changeFrameId != null) {
                _se(() => cancelAnimationFrame(self._changeFrameId));
                self._changeFrameId = null;
            }
            if (this._isMutationEnabled === false)
                return;
            const effectsToRun = self._effectsToRun;
            const directDeps = self._propertyDependencies.get(_property);
            if (directDeps) {
                for (let i = 0; i < directDeps.length; i++)
                    effectsToRun.add(directDeps[i]);
            }
            if (FT_C && self._computedDeps.size) {
                const queue = [_property];
                const visited = new Set();
                const affectedComputed = new Set();
                let queueIdx = 0;
                while (queueIdx < queue.length) {
                    const base = queue[queueIdx++];
                    if (visited.has(base))
                        continue;
                    visited.add(base);
                    for (const [compKey, baseDeps] of self._computedDeps.entries()) {
                        if (baseDeps.has(base) && !affectedComputed.has(compKey)) {
                            affectedComputed.add(compKey);
                            queue.push(compKey);
                        }
                    }
                }
                for (const compKey of affectedComputed) {
                    const compEffects = self._propertyDependencies.get(compKey);
                    if (compEffects) {
                        for (let i = 0; i < compEffects.length; i++)
                            effectsToRun.add(compEffects[i]);
                    }
                    self._computedCache.delete(compKey);
                }
            }
            self._changeFrameId = requestAnimationFrame(() => {
                if (FT_C)
                    self._computedCache.clear();
                self._changeFrameId = null;
                if (self.isDestroyed || self._isSealed)
                    return;
                for (const effect of effectsToRun)
                    self._safeExecute(effect);
                effectsToRun.clear();
                if (!directDeps?.length && (self._hasComputed || !XTOOL_ENABLE_STATIC_DIRECTIVES)) {
                    self._scheduleRender();
                }
                self._callLifecycleHook('updated');
            });
        }
        _bindMethods() {
            return this._bindFunctionMap(this._originalMethods, 'methods');
        }
        _bindComputed(src) {
            return this._bindFunctionMap(src, 'computed');
        }
        _bindPropEffects() {
            return this._bindFunctionMap(this._propEffects || {}, 'prop');
        }
        _bindFunctionMap(src, kind) {
            const out = {};
            const isNative = (fn) => /\[native code\]/.test(String(fn));
            const makeNoArgCtxRunner = (fn) => {
                try {
                    if (!isNative(fn)) {
                        let body = String(fn).trim();
                        if (!/^function[\s\(]/.test(body) && !/^[\w\$_][\w\d\$_]*\s*=>/.test(body) && !/^\(.*?\)\s*=>/.test(body)) {
                            body = 'function ' + body;
                        }
                        const compiled = new Function('ctx', `with(ctx){ const f = (${body}); return f.apply(this, []); }`);
                        return () => { const ctx = this._createMethodContext(); return compiled.call(ctx, ctx); };
                    }
                }
                catch { }
                return () => fn.call(this._createMethodContext());
            };
            for (const key in (src || {})) {
                const original = src[key];
                if (typeof original !== 'function')
                    continue;
                if (kind === 'computed') {
                    out[key] = makeNoArgCtxRunner(original);
                }
                else if (kind === 'methods') {
                    out[key] = (...args) => {
                        const prev = this._isInMethodExecution;
                        const prevInv = this._currentInvoker;
                        this._isInMethodExecution = true;
                        this._currentInvoker = key;
                        try {
                            return this._safeExecute(() => this._runWithGlobalInterception(original, args));
                        }
                        finally {
                            this._isInMethodExecution = prev;
                            this._currentInvoker = prevInv;
                        }
                    };
                }
                else {
                    out[key] = (newValue, oldValue) => {
                        const prevInv = this._currentInvoker;
                        const prevFlag = this._runningPropEffect;
                        this._currentInvoker = `prop:${key}`;
                        this._runningPropEffect = true;
                        try {
                            return this._safeExecute(() => this._runWithGlobalInterception(original, [newValue, oldValue]));
                        }
                        finally {
                            this._runningPropEffect = prevFlag;
                            this._currentInvoker = prevInv;
                        }
                    };
                }
            }
            return out;
        }
        _getComputedValue(key) {
            if (!FT_C)
                return undefined;
            this._trackDependency(key);
            if (this._computedCache.has(key))
                return this._computedCache.get(key);
            this._isInComputedEvaluation = true;
            this._computedKeyStack.push(key);
            this._computedDeps.set(key, new Set());
            try {
                const getter = this._computed[key];
                const value = typeof getter === 'function' ? getter() : undefined;
                this._computedKeyStack.pop();
                this._isInComputedEvaluation = this._computedKeyStack.length > 0;
                this._computedCache.set(key, value);
                return value;
            }
            catch (e) {
                this._computedKeyStack.pop();
                this._isInComputedEvaluation = this._computedKeyStack.length > 0;
                return undefined;
            }
        }
        _trackDependency(propKey) {
            const activeEff = this._activeEffect;
            if (!activeEff)
                return;
            let deps = this._propertyDependencies.get(propKey);
            if (!deps) {
                deps = [];
                this._propertyDependencies.set(propKey, deps);
            }
            if (!deps.includes(activeEff))
                deps.push(activeEff);
            const stackLen = this._computedKeyStack.length;
            if (this._isInComputedEvaluation && stackLen) {
                const current = this._computedKeyStack[stackLen - 1];
                let s = this._computedDeps.get(current);
                if (!s) {
                    s = new Set();
                    this._computedDeps.set(current, s);
                }
                s.add(propKey);
            }
        }
        _scheduleRender() {
            if (this._isSealed || this._isFrozen || this._isDestroyed || this._renderScheduled)
                return;
            this._renderScheduled = true;
            requestAnimationFrame(() => {
                this._renderFrameId = null;
                this._renderScheduled = false;
                if (this._isDestroyed || this._isSealed) {
                    if (this._nextTickQueue?.length)
                        this._nextTickQueue.length = 0;
                    return;
                }
                this._render();
                if (this._nextTickQueue?.length) {
                    const q = this._nextTickQueue.splice(0);
                    for (const fn of q) {
                        _se(fn);
                    }
                }
            });
        }
        _safeExecute(fn, fallback) {
            try {
                return fn();
            }
            catch (error) {
                console.error(error);
                return fallback;
            }
        }
        bindToElement(element) {
            if (this._isBound)
                return;
            this._element = element;
            if (!this._beforeMountCalled) {
                this.callBeforeMount();
            }
            this.completeBinding();
        }
        getContext(includeComputed = true) {
            return this._createMethodContext(includeComputed);
        }
        _applyAsyncTemplateResolved() {
            if (!this._element)
                return;
            try {
                this._parseDirectives(this._element);
            }
            catch { }
            this._scheduleRender();
        }
        completeBinding() {
            if (this._isBound || !this._element)
                return;
            if (!this._framework._getComponentByElement(this._element))
                this._framework._registerElement(this._element, this);
            this._isBound = true;
            this._isMounted = true;
            this._parseDirectives(this._element);
            this._render();
            this._callLifecycleHook('mounted');
        }
        _addChild(child) {
            if (!this._children.includes(child)) {
                this._children.push(child);
            }
        }
        _removeChild(child) {
            const index = this._children.indexOf(child);
            if (index > -1) {
                this._children.splice(index, 1);
            }
        }
        _runWithGlobalInterception(fn, args) {
            try {
                const src = String(fn);
                if (!/\[native code\]/.test(src)) {
                    let body = src.trim();
                    if (!/^function[\s\(]/.test(body) && !/^[\w\$_][\w\d\$_]*\s*=>/.test(body) && !/^\(.*?\)\s*=>/.test(body)) {
                        body = 'function ' + body;
                    }
                    const trySrc = 'with(ctx){ const f = (' + body + '); return f.apply(thisArg, argsArray); }';
                    const wrapper = new Function('thisArg', 'argsArray', 'ctx', trySrc);
                    const thisArg = this._createMethodContext();
                    return wrapper.call(thisArg, thisArg, args, this._createContextProxy(undefined, undefined));
                }
            }
            catch {
            }
            return fn.apply(this._createMethodContext(), args);
        }
        destroy() {
            const self = this;
            if (self._isDestroyed)
                return;
            self._callLifecycleHook('beforeUnmount');
            for (const child of self._children) {
                if (!child.isDestroyed)
                    child.destroy();
            }
            if (self._parent) {
                self._parent._removeChild(self);
            }
            for (const [element, directives] of self._directives) {
                for (const directive of directives) {
                    if (directive.type === 'custom' && directive.customDirective?.unbind) {
                        _se(() => directive.customDirective.unbind(element, self));
                    }
                }
            }
            self._directives.clear();
            try {
                self._directiveAbort.abort();
            }
            catch { }
            self._directiveAbort = new AbortController();
            self._abortInvokerResources();
            self._runCleanupCallbacks();
            self._computedCache.clear();
            self._expressionCache.clear();
            self._propertyDependencies.clear();
            if (self._propParent && self._propEffect) {
                for (const deps of self._propParent._propertyDependencies.values()) {
                    const idx = deps.indexOf(self._propEffect);
                    if (idx > -1)
                        deps.splice(idx, 1);
                }
            }
            if (self._element)
                self._framework._unregisterElement(self._element);
            if (self._changeFrameId != null) {
                _se(() => cancelAnimationFrame(self._changeFrameId));
                self._changeFrameId = null;
            }
            if (self._renderFrameId != null) {
                _se(() => cancelAnimationFrame(self._renderFrameId));
                self._renderFrameId = null;
            }
            self._callLifecycleHook('unmounted');
            self._isDestroyed = true;
            self._isMounted = false;
            self._isBound = false;
            self._children = [];
            self._parent = null;
            self._deepReactiveCache = new WkMap;
            self._effectsToRun.clear();
            self._element = null;
            quMct(() => self._framework._unregisterComponent(self._id));
            self._data = {};
            self._rawData = {};
            self._methods = {};
            self._computed = {};
            self._propEffects = {};
            self._activeEffect = null;
        }
        _initReactiveProps(expr, parent) {
            if (!expr || !parent)
                return;
            this._propParent = parent;
            let evalFn;
            try {
                evalFn = new Function('ctx', 'with(ctx){return (' + expr + ')}');
            }
            catch {
                return;
            }
            const update = () => {
                parent._activeEffect = update;
                let obj;
                try {
                    const ctx = parent.getContext(true);
                    obj = evalFn(ctx);
                }
                catch {
                    obj = null;
                }
                parent._activeEffect = null;
                if (obj && typeof obj === 'object') {
                    this._data.$props = this._data.$props || {};
                    this._propUpdateActive = true;
                    for (const k in obj) {
                        const v = obj[k];
                        if (this._data[k] !== v)
                            this._data[k] = v;
                    }
                    this._propUpdateActive = false;
                }
            };
            this._propEffect = update;
            update();
        }
        _runCleanupCallbacks() {
            for (const fn of this._cleanupFunctions) {
                _se(fn);
            }
            this._cleanupFunctions.clear();
        }
        _listen(element, event, handler, options) {
            const signal = this._directiveAbort.signal;
            if (typeof options === 'boolean') {
                element.addEventListener(event, handler, { capture: options, signal });
            }
            else if (options) {
                const merged = options.signal && options.signal !== signal
                    ? options
                    : { ...options, signal };
                element.addEventListener(event, handler, merged);
            }
            else {
                element.addEventListener(event, handler, { signal });
            }
        }
        _targetKey(target) {
            let id = this._targetIds.get(target);
            if (!id) {
                id = (++this._targetSeq).toString(36);
                this._targetIds.set(target, id);
            }
            return id;
        }
        _parseDirectives(element) {
            const self = this;
            let processedElements = 0;
            const processElement = (el, isRoot = false) => {
                if (!isRoot && (el.hasAttribute(attrName('data')) || this._framework._getComponentByElement(el))) {
                    return false;
                }
                const isComponentTag = el[STR_TAGNAME] === 'COMPONENT';
                const { names: directiveNames, hasTextOrHtml, forName } = self._scanDirectiveAttrs(el);
                if (directiveNames.length > 0) {
                    processedElements++;
                    if (forName) {
                        self._bindDirective(el, forName, el.getAttribute(forName) || '');
                        return false;
                    }
                    for (const attr of directiveNames) {
                        self._bindDirective(el, attr, el.getAttribute(attr) || '');
                    }
                }
                if (FT_TI && !hasTextOrHtml)
                    self._bindTextInterpolationsIn(el);
                return isRoot || !isComponentTag;
            };
            processElement(element, true);
            self._walkElements(element, processElement);
        }
        _bindTextInterpolationsIn(el) {
            const nodes = Array.from(el.childNodes);
            for (const node of nodes) {
                if (node.nodeType !== Node.TEXT_NODE)
                    continue;
                const textNode = node;
                const raw = textNode.nodeValue || '';
                if (textNode.__x_ti_bound || raw.indexOf('{{') === -1)
                    continue;
                const segs = [];
                let i = 0;
                while (i < raw.length) {
                    const ch = raw.charCodeAt(i);
                    if (ch === 92) {
                        let run = 0;
                        const start = i;
                        while (i < raw.length && raw.charCodeAt(i) === 92) {
                            run++;
                            i++;
                        }
                        if (raw.startsWith('{{', i)) {
                            const close = raw.indexOf('}}', i + 2);
                            if (close === -1) {
                                segs.push({ type: 'lit', text: raw.slice(start) });
                                break;
                            }
                            if (run > 1)
                                segs.push({ type: 'lit', text: '\\'.repeat(run - 1) });
                            segs.push({ type: 'lit', text: raw.slice(i, close + 2) });
                            i = close + 2;
                            continue;
                        }
                        segs.push({ type: 'lit', text: raw.slice(start, i) });
                        continue;
                    }
                    if (raw.startsWith('{{', i)) {
                        const close = raw.indexOf('}}', i + 2);
                        if (close === -1) {
                            segs.push({ type: 'lit', text: raw.slice(i) });
                            break;
                        }
                        const expr = raw.slice(i + 2, close).trim();
                        if (expr.length === 0)
                            segs.push({ type: 'lit', text: '{{}}' });
                        else
                            segs.push({ type: 'expr', code: expr });
                        i = close + 2;
                        continue;
                    }
                    const nextEsc = raw.indexOf('\\', i);
                    const nextOpen = raw.indexOf('{{', i);
                    let end = raw.length;
                    if (nextEsc !== -1 && nextEsc < end)
                        end = nextEsc;
                    if (nextOpen !== -1 && nextOpen < end)
                        end = nextOpen;
                    segs.push({ type: 'lit', text: raw.slice(i, end) });
                    i = end;
                }
                const hasExpr = segs.some(s => s.type === 'expr');
                if (!hasExpr) {
                    textNode.__x_ti_bound = true;
                    const literalOut = segs.map(s => s.text || '').join('');
                    if (textNode.textContent !== literalOut)
                        textNode.textContent = literalOut;
                    continue;
                }
                const evaluators = [];
                for (const s of segs)
                    if (s.type === 'expr')
                        evaluators.push(this._createElementEvaluator(s.code, el));
                textNode.__x_ti_bound = true;
                const update = () => {
                    let out = '';
                    let ei = 0;
                    for (const s of segs) {
                        if (s.type === 'lit')
                            out += s.text;
                        else {
                            const v = evaluators[ei++]();
                            out += (v == null ? '' : String(v));
                        }
                    }
                    if (textNode.textContent !== out)
                        textNode.textContent = out;
                };
                const dirInfo = { type: 'text-interpolation', expression: raw, update: undefined };
                this._addDirective(el, dirInfo);
                const effect = this._createEffect(update, dirInfo);
                dirInfo.update = effect;
            }
        }
        _walkElements(parent, processor) {
            let child = parent.firstElementChild;
            while (child) {
                const next = child.nextElementSibling;
                if (processor(child))
                    this._walkElements(child, processor);
                child = next;
            }
        }
        _bindDirective(element, directiveName, expression) {
            const self = this;
            const isAtEvent = directiveName.startsWith('@');
            const isShortBind = directiveName.startsWith(PFX + ':');
            const type = isAtEvent ? ('on:' + directiveName.slice(1)) : directiveName.slice(PFX.length + 1);
            if (!isAtEvent && (isShortBind || type === 'class' || type === STR_STYLE)) {
                element.removeAttribute(directiveName);
                return self._bindAttributeDirective(element, type, expression);
            }
            if (!isAtEvent && (type === 'text' || type === 'html' || type === 'show')) {
                element.removeAttribute(directiveName);
                return self._bindSimpleDirective(element, expression, type);
            }
            const handled = (!isAtEvent && type === 'model') ? (element.removeAttribute(directiveName), self._bindModelDirective(element, expression), true)
                : type === 'if' ? (element.removeAttribute(directiveName), self._bindIfDirective(element, expression), true)
                    : type === 'for' ? (element.removeAttribute(directiveName), self._bindForDirective(element, expression), true)
                        : false;
            if (handled)
                return;
            if (isAtEvent || type.indexOf(':') > -1) {
                const [prefix, rest] = type.split(':', 2);
                const [suffix, ...mods] = rest.split('.');
                const modifiers = mods.reduce((acc, m) => { if (m)
                    acc[m] = true; return acc; }, {});
                if (prefix === 'on') {
                    element.removeAttribute(directiveName);
                    const customDirective = self.framework._getCustomDirective(suffix);
                    return customDirective
                        ? self._bindCustomDirective(element, suffix, expression, customDirective, modifiers)
                        : self._bindEventDirective(element, suffix, expression, modifiers);
                }
                if (prefix === 'intersect') {
                    element.removeAttribute(directiveName);
                    return self._bindIntersectDirective(element, expression, modifiers, suffix);
                }
                element.removeAttribute(directiveName);
                return self._bindAttributeDirective(element, suffix, expression);
            }
        }
        _bindIntersectDirective(element, expression, modifiers, phase) {
            const self = this;
            const trimmed = _tr(expression);
            const runExpr = self._compileHandler(trimmed, element, (payload) => [payload, element]);
            const run = (payload) => { if (runExpr)
                runExpr(payload); };
            const once = !!modifiers['once'];
            let rootMargin = '0px';
            for (const m in modifiers) {
                if (m.startsWith('rootMargin-')) {
                    rootMargin = m.slice('rootMargin-'.length);
                    break;
                }
            }
            const onEnter = phase === 'enter' ? { cb: (entry, info) => run({ entry, ...info }), once } : undefined;
            const onLeave = phase === 'leave' ? { cb: (entry, info) => run({ entry, ...info }), once } : undefined;
            const unobserve = this.framework._ioObserve(element, rootMargin, onEnter, onLeave);
            const dir = { type: 'intersect', expression };
            this._addDirective(element, dir);
            this._addCleanupFunction(() => { try {
                unobserve();
            }
            catch { } });
        }
        _createEffect(updateFn, directiveRef) {
            const effect = () => {
                this._activeEffect = effect;
                try {
                    updateFn();
                }
                finally {
                    this._activeEffect = null;
                }
            };
            effect();
            this._allEffects.add(effect);
            if (XTOOL_ENABLE_STATIC_DIRECTIVES && directiveRef && directiveRef._static === undefined) {
                let found = false;
                for (const deps of this._propertyDependencies.values()) {
                    if (deps.includes(effect)) {
                        found = true;
                        break;
                    }
                }
                directiveRef._static = !found;
            }
            return effect;
        }
        _bindSimpleDirective(element, expression, type) {
            if (type === 'class' || type === STR_STYLE) {
                return this._bindAttributeDirective(element, type, expression);
            }
            const evaluator = this._createElementEvaluator(expression, element);
            let originalDisplay;
            if (type === 'show') {
                const el = element;
                originalDisplay = el.style[STR_DISPLAY] !== STR_NONE ? el.style[STR_DISPLAY] : undefined;
            }
            let _prevShown = undefined;
            const update = () => {
                const value = evaluator();
                const el = element;
                switch (type) {
                    case 'text':
                        el.textContent = String(value);
                        break;
                    case 'html':
                        el.innerHTML = String(value || '');
                        break;
                    case 'show':
                        const next = !!value;
                        if (_prevShown === next)
                            return;
                        _prevShown = next;
                        el.style[STR_DISPLAY] = next ? (originalDisplay || '') : STR_NONE;
                        break;
                }
            };
            const dirInfo = { type, expression, update: undefined, originalDisplay };
            this._addDirective(element, dirInfo);
            const effect = this._createEffect(update, dirInfo);
            dirInfo.update = effect;
        }
        _bindModelDirective(element, property) {
            const isCheckbox = element.type === 'checkbox';
            const isNumeric = element.type === 'number' || element.type === 'range';
            const isMultiSelect = element.tagName === 'SELECT' && element.multiple === true;
            if (!(property in this._data)) {
                this._data[property] = undefined;
            }
            const getValueEvaluator = this._createElementEvaluator(property, element);
            const setValueEvaluator = this._createEvaluator(`${property} = $value`, true);
            const inferCheckboxValue = () => {
                if (element.hasAttribute('value'))
                    return element.value;
                const loopScope = this._collectLoopScope(element);
                if (loopScope) {
                    const keys = Object.keys(loopScope);
                    if (keys.length === 1)
                        return loopScope[keys[0]];
                }
                return element.value;
            };
            const checkboxValue = isCheckbox ? inferCheckboxValue() : undefined;
            const getInputValue = () => {
                if (isCheckbox) {
                    const currentData = getValueEvaluator();
                    if (Array.isArray(currentData) && checkboxValue !== undefined) {
                        return element.checked ? checkboxValue : undefined;
                    }
                    return element.hasAttribute('value') ? (element.checked ? element.value : undefined) : element.checked;
                }
                if (isMultiSelect) {
                    const sel = element;
                    const values = [];
                    const opts = sel.options;
                    for (let i = 0; i < opts.length; i++) {
                        if (opts[i].selected)
                            values.push(opts[i].value);
                    }
                    return values;
                }
                return isNumeric ? parseFloat(element.value) || 0 : element.value;
            };
            const setInputValue = (value) => {
                if (isCheckbox) {
                    if (Array.isArray(value)) {
                        const member = element.hasAttribute('value') ? element.value : checkboxValue;
                        element.checked = member != null ? value.includes(member) : false;
                    }
                    else {
                        element.checked = !!value;
                    }
                    return;
                }
                if (isMultiSelect) {
                    const sel = element;
                    const arr = Array.isArray(value) ? value : [];
                    const opts = sel.options;
                    for (let i = 0; i < opts.length; i++) {
                        opts[i].selected = arr.includes(opts[i].value);
                    }
                    return;
                }
                element.value = String(value ?? (isNumeric ? 0 : ''));
            };
            this._createEffect(() => setInputValue(getValueEvaluator()));
            const ctx = this._createContextProxy(undefined, element);
            const updateData = () => {
                const raw = getInputValue();
                const currentVal = this._safeExecute(() => getValueEvaluator());
                if (isCheckbox && Array.isArray(currentVal)) {
                    const member = element.hasAttribute('value') ? element.value : checkboxValue;
                    if (member !== undefined) {
                        const idx = currentVal.indexOf(member);
                        if (element.checked) {
                            if (idx === -1)
                                currentVal.push(member);
                        }
                        else if (idx > -1) {
                            currentVal.splice(idx, 1);
                        }
                    }
                }
                else if (isMultiSelect && Array.isArray(currentVal)) {
                    currentVal.splice(0, currentVal.length, ...raw);
                }
                else {
                    ctx.$value = raw;
                    this._safeExecute(() => { setValueEvaluator.call(this._createMethodContext(), ctx); });
                }
            };
            const t = element.type;
            const eventType = (element[STR_TAGNAME] === 'SELECT' || t === 'checkbox' || t === 'radio' || t === 'file') ? 'change' : 'input';
            this._listen(element, eventType, updateData);
            this._addDirective(element, { type: 'model', property });
        }
        _bindIfDirective(element, expression) {
            const self = this;
            const placeholder = d.createComment('x-if');
            element.parentNode?.insertBefore(placeholder, element);
            element.__x_if_anchorParent = placeholder.parentElement || null;
            const branches = [];
            const makeActualElement = (el) => {
                if (el[STR_TAGNAME] === STR_TEMPLATE) {
                    const wrapper = d.createElement('div');
                    wrapper.style[STR_DISPLAY] = STR_CONTENTS;
                    wrapper.appendChild(el.content.cloneNode(true));
                    return { el: wrapper, isTemplate: true };
                }
                return { el: el, isTemplate: false };
            };
            const first = makeActualElement(element);
            const firstEval = self._createElementEvaluator(expression, element);
            branches.push({ el: first.el, test: firstEval, isTemplate: first.isTemplate });
            if (!first.isTemplate)
                first.el.__x_tool_bound = true;
            const originalNodes = [element];
            if (FT_IFB) {
                let sib = element.nextElementSibling;
                while (sib) {
                    const isElse = sib.hasAttribute(attrName('else'));
                    const isElseIf = sib.hasAttribute(attrName('else-if'));
                    if (!isElse && !isElseIf)
                        break;
                    if (sib.hasAttribute(attrName('else-if'))) {
                        const attr = sib.getAttribute(attrName('else-if')) || '';
                        const branch = makeActualElement(sib);
                        const evalFn = self._createElementEvaluator(_tr(attr), sib);
                        branches.push({ el: branch.el, test: evalFn, isTemplate: branch.isTemplate });
                        if (!branch.isTemplate)
                            branch.el.__x_tool_bound = true;
                    }
                    else {
                        const branch = makeActualElement(sib);
                        branches.push({ el: branch.el, test: null, isTemplate: branch.isTemplate });
                        if (!branch.isTemplate)
                            branch.el.__x_tool_bound = true;
                    }
                    sib.removeAttribute(attrName('else'));
                    sib.removeAttribute(attrName('else-if'));
                    originalNodes.push(sib);
                    sib = sib.nextElementSibling;
                }
            }
            let active = -1;
            for (const orig of originalNodes) {
                if (orig.parentNode)
                    orig.parentNode.removeChild(orig);
            }
            const mountBranch = (idx) => {
                if (idx < 0)
                    return;
                const b = branches[idx];
                if (!b.el.__x_tool_bound) {
                    self._parseDirectives(b.el);
                    b.el.__x_tool_bound = true;
                }
                element.__x_if_current?.parentNode?.removeChild(element.__x_if_current);
                if (!b.el.parentNode) {
                    placeholder.parentNode?.insertBefore(b.el, placeholder.nextSibling);
                }
                element.__x_if_current = b.el;
                active = idx;
            };
            const unmountBranch = (idx, cb) => {
                if (idx < 0) {
                    if (cb)
                        cb();
                    return;
                }
                const b = branches[idx];
                if (b.el.parentNode) {
                    if (b.el.parentNode)
                        b.el.parentNode.removeChild(b.el);
                    if (cb)
                        cb();
                }
                else if (cb)
                    cb();
                active = -1;
            };
            const update = () => {
                let next = -1;
                for (let i = 0; i < branches[STR_LENGTH]; i++) {
                    const b = branches[i];
                    const pass = b.test ? !!b.test() : true;
                    if (pass) {
                        next = i;
                        break;
                    }
                }
                if (next === active)
                    return;
                if (active !== -1) {
                    unmountBranch(active, () => mountBranch(next));
                }
                else {
                    mountBranch(next);
                }
            };
            const effect = self._createEffect(update);
            self._addDirective(element, { type: 'if', expression, update: effect });
        }
        _bindEventDirective(element, eventName, expression, modifiers) {
            const self = this;
            const trimmed = _tr(expression);
            const opts = modifiers ? {
                once: !!modifiers.once,
                passive: !!modifiers.passive,
                capture: !!modifiers.capture,
            } : undefined;
            const onlySelf = !!modifiers?.self;
            const shouldPrevent = !!modifiers?.prevent;
            const shouldStop = !!modifiers?.stop;
            const isOutside = !!modifiers?.outside;
            const isWindow = !!modifiers?.window;
            const deferExec = !!modifiers?.defer;
            const keyAliasMap = { enter: ['enter'], esc: ['escape', 'esc'], escape: ['escape', 'esc'], space: [' ', 'space', 'spacebar'], tab: ['tab'], backspace: ['backspace'], delete: ['delete', 'del'], del: ['delete', 'del'], arrowup: ['arrowup', 'up'], arrowdown: ['arrowdown', 'down'], arrowleft: ['arrowleft', 'left'], arrowright: ['arrowright', 'right'], home: ['home'], end: ['end'], pageup: ['pageup'], pagedown: ['pagedown'] };
            const comboRequirements = {
                ctrl: !!modifiers?.ctrl,
                alt: !!modifiers?.alt,
                shift: !!modifiers?.shift,
                meta: !!modifiers?.meta,
            };
            const buttonMap = { left: 0, middle: 1, right: 2 };
            const touchSingle = !!modifiers?.single;
            const touchMulti = !!modifiers?.multi;
            const modifierKeys = modifiers ? _Okeys(modifiers) : [];
            const allowedKeys = [];
            for (const m of modifierKeys) {
                const aliases = keyAliasMap[m.toLowerCase()];
                if (aliases)
                    allowedKeys.push(...aliases);
            }
            const allowedButtons = [];
            for (const m of modifierKeys) {
                const btn = buttonMap[m.toLowerCase()];
                if (btn !== undefined)
                    allowedButtons.push(btn);
            }
            const needKeyCheck = allowedKeys.length > 0 || comboRequirements.ctrl || comboRequirements.alt || comboRequirements.shift || comboRequirements.meta;
            const needButtonCheck = allowedButtons.length > 0;
            const needTouchCheck = touchSingle || touchMulti;
            const passesFilters = (event) => {
                const path = event.composedPath ? event.composedPath() : null;
                const tgt = (path && path.length ? path[0] : event.target);
                if (isOutside) {
                    if (!tgt)
                        return false;
                    if (element instanceof Node && (element === tgt || element.contains(tgt)))
                        return false;
                }
                if (onlySelf && event.target !== element)
                    return false;
                if (needTouchCheck) {
                    if (event instanceof TouchEvent) {
                        const tCount = event.touches.length;
                        if (touchSingle && tCount !== 1)
                            return false;
                        if (touchMulti && tCount < 2)
                            return false;
                    }
                    else
                        return false;
                }
                if (needButtonCheck) {
                    if (event instanceof MouseEvent) {
                        if (!allowedButtons.includes(event.button))
                            return false;
                    }
                    else
                        return false;
                }
                if (needKeyCheck) {
                    if (!(event instanceof KeyboardEvent))
                        return false;
                    const k = (event.key || '').toLowerCase();
                    if (allowedKeys.length > 0 && !allowedKeys.includes(k))
                        return false;
                    const { ctrlKey, altKey, shiftKey, metaKey } = event;
                    if ((comboRequirements.ctrl && !ctrlKey) || (comboRequirements.alt && !altKey) ||
                        (comboRequirements.shift && !shiftKey) || (comboRequirements.meta && !metaKey))
                        return false;
                }
                return true;
            };
            const runExpr = self._compileHandler(trimmed, element, (ev) => [ev, element]);
            const createEventHandler = (event) => {
                if (!passesFilters(event))
                    return;
                if (shouldPrevent)
                    event.preventDefault();
                if (shouldStop)
                    event.stopPropagation();
                if (!runExpr)
                    return;
                if (deferExec && typeof quMct === 'function') {
                    const ev = event;
                    quMct(() => self._safeExecute(() => runExpr(ev)));
                    return;
                }
                self._safeExecute(() => runExpr(event));
            };
            const cfg = this.framework._getConfig();
            const canDelegate = !!cfg.delegate && EV_DELEGATED.includes(eventName);
            if (!isOutside && !isWindow && canDelegate) {
                const remover = this.framework._registerDelegated(element, eventName, { filter: (e) => passesFilters(e), run: (e) => createEventHandler(e), once: !!modifiers?.once, comp: this });
                this._addCleanupFunction(remover);
            }
            else {
                const target = isWindow ? (typeof window !== 'undefined' ? window : element) : (isOutside ? (element?.ownerDocument || d || document) : element);
                self._listen(target, eventName, createEventHandler, opts);
            }
        }
        _createEvaluator(expression, isStatement = false) {
            const key = `${isStatement ? 's' : 'r'}:${expression}`;
            let fn = this._expressionCache.get(key);
            if (!fn) {
                try {
                    fn = new Function('ctx', `with(ctx){${isStatement ? expression : `return (${expression})`}}`);
                }
                catch {
                    expression = JSON.stringify(expression);
                    fn = new Function('ctx', `with(ctx){${isStatement ? expression : `return (${expression})`}}`);
                }
                this._expressionCache.set(key, fn);
            }
            return fn;
        }
        _createElementEvaluator(expression, element) {
            const self = this;
            const compiled = self._createEvaluator(expression);
            return () => this._safeExecute(() => compiled.call(self._createMethodContext(), self._createContextProxy(undefined, element)));
        }
        _extractArrowFunction(expression) {
            let m = expression.match(/^\s*\(\s*([^)]*?)\s*\)\s*=>\s*([\s\S]+)$/);
            if (!m)
                m = expression.match(/^\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=>\s*([\s\S]+)$/);
            if (!m)
                return null;
            const params = (m[1] || '')
                .split(',')
                .map(p => p.trim())
                .filter(Boolean);
            const body = _tr(m[2]);
            const isBlock = body.startsWith('{') && body.endsWith('}');
            const finalBody = isBlock ? body.slice(1, -1) : body;
            return { paramsList: params, body: finalBody, isBlock };
        }
        _compileArrowForEvent(params, body, isBlock) {
            const content = isBlock ? body : 'return ( ' + body + ' );';
            return new Function('ctx', ...params, 'with(ctx){ ' + content + ' }');
        }
        _compileHandler(expression, element, mapArgs) {
            const self = this;
            const trimmed = _tr(expression);
            if (!trimmed)
                return null;
            const arrow = self._extractArrowFunction(trimmed);
            const thisCtx = self._createMethodContext();
            if (arrow) {
                const { paramsList, body, isBlock } = arrow;
                const compiledArrow = self._compileArrowForEvent(paramsList, body, isBlock);
                return (payload) => {
                    const ctx = self._createContextProxy(payload, element);
                    const args = mapArgs(payload);
                    self._safeExecute(() => compiledArrow.call(thisCtx, ctx, ...args.slice(0, paramsList.length)));
                };
            }
            const isStatement = trimmed.includes(';');
            const executor = self._createEvaluator(trimmed, isStatement);
            return (payload) => {
                const ctx = self._createContextProxy(payload, element);
                const result = executor.call(thisCtx, ctx);
                if (typeof result === 'function') {
                    try {
                        result.call(thisCtx, payload);
                    }
                    catch { }
                }
            };
        }
        _assertMutable(parentKey, method) {
            if (this._isInComputedEvaluation) {
                throw new Error(`[x-tool] Mutation via '${String(parentKey)}.${method}()' is not allowed during computed evaluation.`);
            }
            if (this._isFrozen) {
                throw new Error(`[x-tool] Mutation via '${String(parentKey)}.${method}()' is not allowed while component is frozen.`);
            }
        }
        _wrapData(data, parentKey) {
            const isArr = ARRAY_ISARRAY(data);
            const isSet = (typeof Set !== 'undefined') && (data instanceof Set);
            const isMap = (typeof Map !== 'undefined') && (data instanceof Map);
            if (!(Object.getPrototypeOf(data) === Object.prototype || isArr || isSet || isMap))
                return data;
            const self = this;
            if (!this._deepReactiveCache)
                this._deepReactiveCache = new WkMap();
            if (this._deepReactiveCache.has(data))
                return this._deepReactiveCache.get(data);
            const makeCollectionWrapper = (name, fn, isArray) => function (...args) {
                self._assertMutable(parentKey, name);
                if (isArray) {
                    const arr = this;
                    const beforeLen = arr.length;
                    const beforeFirst = arr[0];
                    const beforeLast = arr[beforeLen - 1];
                    const result = fn.apply(this, args);
                    if (!self._isSealed && (arr.length !== beforeLen || arr[0] !== beforeFirst || arr[arr.length - 1] !== beforeLast)) {
                        self._onDataChange(parentKey);
                    }
                    return result;
                }
                else {
                    const before = this.size;
                    const existed = (name === 'set') ? this.has(args[0]) : false;
                    const result = fn.apply(this, args);
                    if (!self._isSealed && (this.size !== before || (name === 'set' && !existed)))
                        self._onDataChange(parentKey);
                    return result;
                }
            };
            const proxy = new Proxy(data, {
                get: (target, p, receiver) => {
                    const isCollection = isSet || isMap;
                    if (isArr) {
                        if (p === Symbol.iterator || p === 'length' || (typeof p === 'string' && /^\d+$/.test(p))) {
                            self._trackDependency(parentKey);
                            if (p === Symbol.iterator)
                                return Reflect.get(target, p, receiver);
                        }
                    }
                    else if (isCollection) {
                        if (p === 'size' || p === Symbol.iterator || p === 'keys' || p === 'values' || p === 'entries') {
                            self._trackDependency(parentKey);
                        }
                    }
                    else {
                        self._trackDependency(parentKey);
                    }
                    const value = Reflect.get(target, p, receiver);
                    if (isCollection && typeof value === 'function' && (p === Symbol.iterator || p === 'keys' || p === 'values' || p === 'entries')) {
                        return function (...args) { return value.apply(target, args); };
                    }
                    if (typeof value === 'function') {
                        if (isArr && ['push', 'pop', 'shift', 'unshift', 'splice', 'reverse', 'copyWithin', 'fill', 'sort'].includes(p)) {
                            return makeCollectionWrapper(String(p), value, true).bind(target);
                        }
                        if (isSet && (p === 'add' || p === 'delete' || p === 'clear')) {
                            return makeCollectionWrapper(String(p), value, false).bind(target);
                        }
                        if (isMap && (p === 'set' || p === 'delete' || p === 'clear')) {
                            return makeCollectionWrapper(String(p), value, false).bind(target);
                        }
                    }
                    return (value && typeof value === 'object') ? self._wrapData(value, parentKey) : value;
                },
                ownKeys: Reflect.ownKeys,
                has: Reflect.has,
                set: (target, p, value) => {
                    if (self._isDestroyed || typeof p === 'symbol')
                        return true;
                    const key = String(parentKey) + '.' + String(p);
                    if (self._isInComputedEvaluation)
                        throw new Error(`[x-tool] Mutation of '${key}' is not allowed during computed evaluation.`);
                    if (self._isFrozen)
                        throw new Error(`[x-tool] Mutation of '${key}' is not allowed while component is frozen.`);
                    const had = Reflect.has(target, p);
                    const oldValue = had ? Reflect.get(target, p) : undefined;
                    if (value && typeof value === 'object') {
                        value = self._wrapData(value, (String(parentKey) + '.' + String(p)));
                    }
                    if (!had) {
                        _se(() => Reflect.defineProperty(target, p, { configurable: true, enumerable: true, writable: true, value }));
                        if (!Reflect.has(target, p))
                            Reflect.set(target, p, value);
                        self._onDataChange(parentKey);
                        return true;
                    }
                    if (oldValue === value)
                        return true;
                    Reflect.set(target, p, value);
                    if (!self._isSealed)
                        self._onDataChange(parentKey);
                    return true;
                },
                deleteProperty: (target, p) => {
                    const key = String(parentKey) + (typeof p === 'symbol' ? '' : '.' + String(p));
                    if (self._isInComputedEvaluation)
                        throw new Error(`[x-tool] Deletion of '${key}' is not allowed during computed evaluation.`);
                    if (self._isFrozen)
                        throw new Error(`[x-tool] Deletion of '${key}' is not allowed while component is frozen.`);
                    const ok = Reflect.deleteProperty(target, p);
                    if (ok && !self._isSealed)
                        self._onDataChange(parentKey);
                    return ok;
                }
            });
            this._deepReactiveCache.set(data, proxy);
            return proxy;
        }
        _createReactiveData(data) {
            const self = this;
            return new Proxy(data, {
                get: (target, property, receiver) => {
                    const value = Reflect.get(target, property, receiver);
                    if (property === Symbol.iterator)
                        return value;
                    if (typeof property !== 'symbol') {
                        self._trackDependency(property);
                    }
                    if (value && typeof value === 'object') {
                        return self._wrapData(value, property);
                    }
                    return value;
                },
                ownKeys: (target) => Reflect.ownKeys(target),
                has: (target, key) => Reflect.has(target, key),
                set: (target, property, value, receiver) => {
                    if (self._isDestroyed)
                        return true;
                    if (self._isFrozen)
                        return true;
                    if (self._isInComputedEvaluation) {
                        throw new Error(`[x-tool] Mutation of '${String(property)}' is not allowed during computed evaluation.`);
                    }
                    if (property === Symbol.iterator && ARRAY_ISARRAY(target))
                        return value;
                    const oldValue = Reflect.get(target, property);
                    const had = Reflect.has(target, property);
                    if (!had) {
                        try {
                            Reflect.defineProperty(target, property, {
                                configurable: true,
                                enumerable: true,
                                writable: true,
                                value
                            });
                        }
                        catch {
                            Reflect.set(target, property, value, receiver);
                        }
                    }
                    else {
                        Reflect.set(target, property, value, receiver);
                    }
                    if (!this._isSealed)
                        this._onDataChange(property);
                    if (this._propUpdateActive && property !== '$props') {
                        const pc = target.$props;
                        if (pc)
                            pc[property] = value;
                        const eff = this._propEffects[property];
                        if (eff && !this._isSealed) {
                            eff(value, oldValue);
                        }
                    }
                    return true;
                }
            });
        }
        _createMethodContext(_includeComputed = true) {
            const specials = {
                '$log': (..._args) => { },
                '$destroy': () => this.destroy(),
                '$forceUpdate': () => this._scheduleRender(),
                '$addCleanupFunction': (fn) => this._addCleanupFunction(fn),
                '$nextTick': (cb) => {
                    if (cb) {
                        this._nextTickQueue.push(cb);
                        if (!this._renderScheduled)
                            quMct(() => {
                                if (!this._renderScheduled && this._nextTickQueue.length) {
                                    const q = this._nextTickQueue.splice(0, this._nextTickQueue.length);
                                    for (const fn of q) {
                                        this._safeExecute(() => fn());
                                    }
                                }
                            });
                        return;
                    }
                    return new Promise(resolve => {
                        this._nextTickQueue.push(() => resolve());
                        if (!this._renderScheduled)
                            quMct(() => {
                                if (!this._renderScheduled && this._nextTickQueue.length) {
                                    const q = this._nextTickQueue.splice(0, this._nextTickQueue.length);
                                    for (const fn of q) {
                                        this._safeExecute(() => fn());
                                    }
                                }
                            });
                    });
                },
                '$el': this._element,
                '$id': this._id,
                '$isMounted': this._isMounted,
                '$isDestroyed': this._isDestroyed,
                '$isSealed': this._isSealed,
                '$isFrozen': this._isFrozen,
                '$parent': this._parent,
                '$children': this._children,
                '$seal': (on = true) => { this._setSealed(!!on); },
                '$mutate': (fn) => {
                    const prevMethod = this._isInMethodExecution;
                    this._isMutationEnabled = false;
                    if (this._isInComputedEvaluation) {
                        throw new Error('[x-tool] $mutate cannot be used inside computed evaluation; computed getters must be pure.');
                    }
                    this._isInMethodExecution = false;
                    try {
                        return typeof fn === 'function' ? fn() : undefined;
                    }
                    finally {
                        this._isInMethodExecution = prevMethod;
                        this._isMutationEnabled = true;
                        this._scheduleRender();
                    }
                }
            };
            let data = this._data;
            if (this._isInComputedEvaluation) {
                data = (this._rawData);
            }
            return new Proxy(data, {
                get: (target, propStr) => {
                    if (propStr in target) {
                        this._trackDependency(propStr);
                        const v = target[propStr];
                        return v;
                    }
                    if (FT_C && (propStr in this._computed)) {
                        return this._getComputedValue(propStr);
                    }
                    if (propStr in specials)
                        return specials[propStr];
                    return this._methods[propStr];
                },
                set: (_target, propStr, value) => {
                    if (this._isInComputedEvaluation) {
                        throw new Error(`[x-tool] Mutation of '${String(propStr)}' is not allowed during computed evaluation.`);
                    }
                    if (this._isFrozen) {
                        throw new Error(`[x-tool] Mutation of '${String(propStr)}' is not allowed while component is frozen.`);
                    }
                    this._data[propStr] = value;
                    return true;
                }
            });
        }
        _createContextProxy(event, targetElement) {
            const component = this;
            const mergedScope = targetElement ? this._collectLoopScope(targetElement) : null;
            const gWindow = (typeof window !== 'undefined' ? window : undefined);
            const gDocument = (typeof document !== 'undefined' ? document : undefined);
            const cfg = this.framework._getConfig();
            const sandbox = !!cfg.sandboxExpressions;
            const allow = new Set((cfg.allowGlobals || []).map(s => String(s)));
            const ensureInvoker = () => this._currentInvoker || '__anonymous__';
            const registerResource = (kind, setup) => {
                const inv = ensureInvoker();
                let byKind = this._invokerResources.get(inv);
                if (!byKind) {
                    byKind = new Map();
                    this._invokerResources.set(inv, byKind);
                }
                const prev = byKind.get(kind);
                if (prev) {
                    try {
                        prev();
                    }
                    catch { }
                    byKind.delete(kind);
                }
                const cleanup = setup();
                if (typeof cleanup === 'function') {
                    const wrapped = () => {
                        try {
                            cleanup();
                        }
                        finally {
                            byKind?.delete(kind);
                        }
                    };
                    byKind.set(kind, wrapped);
                    this._addCleanupFunction(wrapped);
                }
            };
            const wrapTarget = (target) => {
                if (!target || typeof target.addEventListener !== 'function')
                    return target;
                return new Proxy(target, {
                    get: (obj, prop) => {
                        if (prop === 'addEventListener') {
                            return (eventName, handler, options) => {
                                if (this._isSealed || this._isFrozen)
                                    return;
                                obj.addEventListener(eventName, handler, options);
                                const optSig = typeof options === 'boolean' ? options : options?.capture ? '1' : '0';
                                const key = 'listener:' + this._targetKey(obj) + ':' + eventName + ':' + optSig;
                                registerResource(key, () => () => {
                                    try {
                                        obj.removeEventListener(eventName, handler, options);
                                    }
                                    catch { }
                                });
                            };
                        }
                        if (prop === 'removeEventListener') {
                            return (eventName, handler, options) => {
                                try {
                                    obj.removeEventListener(eventName, handler, options);
                                }
                                catch { }
                            };
                        }
                        if (prop === 'querySelector') {
                            return (sel) => wrapTarget(obj.querySelector(sel));
                        }
                        if (prop === 'querySelectorAll') {
                            return (sel) => Array.from(obj.querySelectorAll(sel)).map(wrapTarget);
                        }
                        if (prop === 'getElementById') {
                            return (id) => wrapTarget(obj.getElementById(id));
                        }
                        if (prop === 'document') {
                            const doc = obj.document;
                            return wrapTarget(doc) || doc;
                        }
                        if (prop === 'defaultView') {
                            const win = obj.defaultView;
                            return wrapTarget(win) || win;
                        }
                        if (prop === 'body') {
                            const body = obj.body;
                            return wrapTarget(body) || body;
                        }
                        const value = obj[prop];
                        if (typeof value === 'function') {
                            try {
                                return value.bind(obj);
                            }
                            catch {
                                return value;
                            }
                        }
                        return value;
                    }
                });
            };
            const ctxSetTimeout = (fn, ms, ...args) => {
                if (this._isSealed || this._isFrozen || this._isDestroyed)
                    return undefined;
                const id = gWindow?.setTimeout?.(fn, ms, ...args);
                if (id != null)
                    registerResource('timeout', () => () => { try {
                        gWindow?.clearTimeout?.(id);
                    }
                    catch { } });
                return id;
            };
            const ctxSetInterval = (fn, ms, ...args) => {
                if (this._isSealed || this._isFrozen)
                    return undefined;
                const id = gWindow?.setInterval?.(fn, ms, ...args);
                if (id != null)
                    registerResource('interval', () => () => { try {
                        gWindow?.clearInterval?.(id);
                    }
                    catch { } });
                return id;
            };
            const ctxRequestAnimationFrame = (cb) => {
                if (this._isSealed || this._isFrozen)
                    return undefined;
                const id = gWindow?.requestAnimationFrame?.(cb);
                if (id != null)
                    registerResource('raf', () => () => { try {
                        gWindow?.cancelAnimationFrame?.(id);
                    }
                    catch { } });
                return id;
            };
            const wrapObserverCtor = (Orig, kind) => {
                if (!Orig)
                    return undefined;
                return function (...observerArgs) {
                    if (component._isSealed || component._isFrozen)
                        return { observe() { }, disconnect() { }, unobserve() { } };
                    const inst = new Orig(...observerArgs);
                    registerResource('observer:' + kind, () => () => { try {
                        inst.disconnect();
                    }
                    catch { } });
                    return inst;
                };
            };
            const specials = {
                '$target': targetElement || null,
                '$event': event || null,
                ...(this.framework._routerEnabled() ? {
                    'location': new Proxy(gWindow?.location || location, {
                        get: (t, p) => t[p],
                        set: (_t, p, v) => {
                            const key = String(p);
                            if (key === 'href') {
                                try {
                                    this.framework._navigate(String(v), true, 'program');
                                }
                                catch {
                                    location.href = String(v);
                                }
                                return true;
                            }
                            try {
                                location[p] = v;
                            }
                            catch { }
                            return true;
                        }
                    })
                } : {}),
                ...(sandbox && !allow.has('setTimeout') ? {} : { 'setTimeout': ctxSetTimeout }),
                ...(sandbox && !allow.has('clearTimeout') ? {} : { 'clearTimeout': (id) => { try {
                        gWindow?.clearTimeout?.(id);
                    }
                    catch { } } }),
                ...(sandbox && !allow.has('setInterval') ? {} : { 'setInterval': ctxSetInterval }),
                ...(sandbox && !allow.has('clearInterval') ? {} : { 'clearInterval': (id) => { try {
                        gWindow?.clearInterval?.(id);
                    }
                    catch { } } }),
                ...(sandbox && !allow.has('requestAnimationFrame') ? {} : { 'requestAnimationFrame': ctxRequestAnimationFrame }),
                ...(sandbox && !allow.has('cancelAnimationFrame') ? {} : { 'cancelAnimationFrame': (id) => { try {
                        gWindow?.cancelAnimationFrame?.(id);
                    }
                    catch { } } }),
                ...(sandbox && !allow.has('MutationObserver') ? {} : { 'MutationObserver': wrapObserverCtor(gWindow?.MutationObserver, 'mutation') }),
                ...(sandbox && !allow.has('ResizeObserver') ? {} : { 'ResizeObserver': wrapObserverCtor(gWindow?.ResizeObserver, 'resize') }),
                ...(sandbox && !allow.has('IntersectionObserver') ? {} : { 'IntersectionObserver': wrapObserverCtor(gWindow?.IntersectionObserver, 'intersection') }),
                ...(sandbox && !allow.has('window') ? {} : { 'window': wrapTarget(gWindow) }),
                ...(sandbox && !allow.has('document') ? {} : { 'document': wrapTarget(gDocument) })
            };
            return new Proxy({}, {
                get: (_t, propStr) => {
                    if (mergedScope && propStr in mergedScope)
                        return mergedScope[propStr];
                    if (propStr in component._data)
                        return component._data[propStr];
                    if (propStr in component._computed)
                        return component._getComputedValue(propStr);
                    if (propStr in component._methods)
                        return component._methods[propStr];
                    if (propStr in specials)
                        return specials[propStr];
                    return undefined;
                },
                set: (_t, propStr, value) => {
                    if (mergedScope) {
                        let s = mergedScope;
                        while (s) {
                            if (Object.prototype.hasOwnProperty.call(s, propStr)) {
                                s[propStr] = value;
                                return true;
                            }
                            s = Object.getPrototypeOf(s);
                        }
                    }
                    component._data[propStr] = value;
                    return true;
                },
                has: (_t, propStr) => !!(mergedScope && propStr in mergedScope) ||
                    propStr in component._data ||
                    propStr in component._computed ||
                    propStr in component._methods ||
                    propStr in specials
            });
        }
        _bindCustomDirective(element, _name, expression, directive, modifiers) {
            const self = this;
            const evaluator = self._createElementEvaluator(expression, element);
            const directiveInfo = { type: 'custom', expression, customDirective: directive };
            if (directive.bind) {
                self._safeExecute(() => directive.bind(element, evaluator(), expression, self, modifiers, evaluator));
            }
            const update = () => {
                if (directive.update)
                    self._safeExecute(() => directive.update(element, evaluator(), expression, self, modifiers, evaluator));
            };
            const effect = self._createEffect(update);
            directiveInfo.update = effect;
            self._addDirective(element, directiveInfo);
        }
        _bindAttributeDirective(element, attributeName, expression) {
            const self = this;
            const evaluator = self._createElementEvaluator(expression, element);
            const isSvg = element.namespaceURI === 'http://www.w3.org/2000/svg';
            if (attributeName === 'class') {
                const el = element;
                if (!self._initialClassSets.get(el)) {
                    const baseSet = new Set();
                    const oc = isSvg ? (element.getAttribute('class') || '') : (element.className || '');
                    if (oc)
                        for (const cls of oc.split(/\s+/)) {
                            if (cls)
                                baseSet.add(cls);
                        }
                    self._initialClassSets.set(el, baseSet);
                }
            }
            const meta = self._resolveBindingMeta(element, attributeName);
            const update = () => {
                const value = evaluator();
                if (attributeName === 'class') {
                    const base = self._initialClassSets.get(element);
                    if (typeof value === 'string') {
                        const finalCls = base && base.size ? [...base].join(' ') + (value ? ' ' + value : '') : value || '';
                        if (isSvg) {
                            if (finalCls)
                                element.setAttribute('class', finalCls);
                            else
                                element.removeAttribute('class');
                        }
                        else {
                            element.className = finalCls;
                        }
                    }
                    else if (ARRAY_ISARRAY(value)) {
                        const tokens = value.filter(Boolean);
                        const finalList = base && base.size ? [...base, ...tokens] : tokens;
                        const finalStr = finalList.join(' ');
                        if (isSvg) {
                            if (finalStr)
                                element.setAttribute('class', finalStr);
                            else
                                element.removeAttribute('class');
                        }
                        else {
                            element.className = finalStr;
                        }
                    }
                    else if (value && typeof value === 'object') {
                        if (base && base.size) {
                            const baseStr = [...base].join(' ');
                            if (isSvg) {
                                if (baseStr)
                                    element.setAttribute('class', baseStr);
                                else
                                    element.removeAttribute('class');
                            }
                            else {
                                element.className = baseStr;
                            }
                        }
                        const elAny = element;
                        for (const raw in value) {
                            const on = !!value[raw];
                            if (!raw)
                                continue;
                            const tokens = raw.split(/\s+/);
                            for (let i = 0; i < tokens.length; i++) {
                                const tk = tokens[i];
                                if (!tk)
                                    continue;
                                elAny.classList?.toggle(tk, on);
                            }
                        }
                    }
                    else if (value == null && base && base.size) {
                        const baseStr = [...base].join(' ');
                        if (isSvg) {
                            if (baseStr)
                                element.setAttribute('class', baseStr);
                            else
                                element.removeAttribute('class');
                        }
                        else {
                            element.className = baseStr;
                        }
                    }
                    else if (value == null) {
                        element.removeAttribute('class');
                    }
                    return;
                }
                if (attributeName === STR_STYLE) {
                    const el = element;
                    if (typeof value === 'string') {
                        el.style.cssText = value;
                        return;
                    }
                    if (value && typeof value === 'object') {
                        for (const k in value) {
                            const v = value[k];
                            const cssProp = k.startsWith('--') ? k : k.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
                            if (v != null)
                                el.style.setProperty(cssProp, String(v));
                            else
                                el.style.removeProperty(cssProp);
                        }
                        return;
                    }
                    if (value == null)
                        el.removeAttribute('style');
                    return;
                }
                self._applyGenericBinding(element, attributeName, value, meta);
            };
            const effect = self._createEffect(update);
            self._addDirective(element, { type: 'bind', expression, update: effect });
        }
        _collectLoopScope(el) {
            if (!el)
                return null;
            if (!el.parentElement) {
                const cur = el.__x_if_current;
                if (cur && cur.parentElement) {
                    el = cur;
                }
                else {
                    const anchorParent = el.__x_if_anchorParent;
                    if (anchorParent)
                        el = anchorParent;
                }
            }
            let node = el;
            while (node) {
                const s = node.__x_scope;
                if (s)
                    return s;
                node = node.parentElement;
            }
            const merged = {};
            node = el;
            while (node) {
                const scope = this._loopScopes.get(node);
                if (scope)
                    Object.assign(merged, scope);
                if (node === this.element)
                    break;
                node = node.parentElement;
            }
            return _Okeys(merged).length ? merged : null;
        }
        _updateElementDirectives(root, force) {
            for (const [element, directives] of this._directives) {
                for (const directive of directives) {
                    if ((root === element || (element instanceof Element && root.contains(element))) && directive.update) {
                        if (XTOOL_ENABLE_STATIC_DIRECTIVES && directive._static && !force)
                            continue;
                        directive.update();
                    }
                }
            }
        }
        _updateElementDirectivesForVar(root, varName) {
            const re = new RegExp('(^|[^$\\w])' + varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([^$\\w]|$)');
            for (const [element, directives] of this._directives) {
                if (!(root === element || (element instanceof Element && root.contains(element))))
                    continue;
                for (const directive of directives) {
                    if (!directive.update)
                        continue;
                    const expr = directive.expression || '';
                    if (re.test(expr)) {
                        directive.update();
                    }
                }
            }
        }
        _cleanupElementSubtree(root) {
            const toDelete = [];
            for (const [element, directives] of this._directives) {
                if (root === element || (element instanceof Element && root.contains(element))) {
                    for (const directive of directives) {
                        if (directive.type === 'custom' && directive.customDirective?.unbind) {
                            try {
                                directive.customDirective.unbind(element, this);
                            }
                            catch { }
                        }
                    }
                    toDelete.push(element);
                }
            }
            if (toDelete.length) {
                for (const el of toDelete)
                    this._directives.delete(el);
            }
        }
        _bindForDirective(element, expression) {
            const self = this;
            const match = expression.trim().match(/^(?:\(\s*([^,\s]+)\s*(?:,\s*([^\)]+))?\s*\)|([^,\s]+))\s+(in|of)\s+(.+)$/);
            if (!match) {
                return;
            }
            const itemVar = match[1] || match[3];
            const indexVar = match[2];
            const listCode = match[5];
            const keyAttrName = attrName('key');
            const keyExpr = element.getAttribute(keyAttrName) || null;
            if (keyExpr)
                element.removeAttribute(keyAttrName);
            const placeholder = d.createComment('x-for');
            element.parentNode?.insertBefore(placeholder, element);
            let templateToClone;
            if (element[STR_TAGNAME] === STR_TEMPLATE) {
                templateToClone = d.createElement('div');
                templateToClone.style[STR_DISPLAY] = STR_CONTENTS;
                templateToClone.appendChild(element.content.cloneNode(true));
                element.parentNode?.removeChild(element);
            }
            else {
                templateToClone = element;
                element.parentNode?.removeChild(element);
            }
            const contextAnchor = placeholder.parentElement || self.element;
            const listEval = self._createElementEvaluator(listCode.trim(), contextAnchor);
            const keyEval = keyExpr ? self._createEvaluator(keyExpr) : null;
            const BP_FOR = attrName('for');
            const BP_KEY = attrName('key');
            const BP_TEXT = attrName('text');
            const BP_HTML = attrName('html');
            const BP_DATA = attrName('data');
            const buildBlueprint = (root) => {
                const bp = [];
                const walk = (el, path, isRootEl) => {
                    if (!isRootEl && el.hasAttribute(BP_DATA))
                        return;
                    const isComponentTag = el[STR_TAGNAME] === 'COMPONENT';
                    const scan = self._scanDirectiveAttrs(el, { skipRootFor: isRootEl });
                    const dnames = scan.names.filter(n => n !== BP_KEY && (!isRootEl || n !== BP_FOR));
                    const hasTextOrHtml = scan.names.includes(BP_TEXT) || scan.names.includes(BP_HTML);
                    const forName = scan.forName;
                    if (dnames.length) {
                        if (forName) {
                            bp.push({ path, directiveNames: [forName], hasTextOrHtml: hasTextOrHtml, forName });
                            return;
                        }
                        bp.push({ path, directiveNames: dnames, hasTextOrHtml });
                    }
                    else {
                        if (FT_TI && !hasTextOrHtml) {
                            bp.push({ path, directiveNames: [], hasTextOrHtml });
                        }
                    }
                    if (isComponentTag)
                        return;
                    let idx = 0;
                    let child = el.firstElementChild;
                    while (child) {
                        const next = child.nextElementSibling;
                        walk(child, path.concat(idx), false);
                        idx++;
                        child = next;
                    }
                };
                walk(root, [], true);
                return bp;
            };
            const hydrateFromBlueprint = (cloneRoot, bp) => {
                for (let i = 0; i < bp.length; i++) {
                    const instr = bp[i];
                    const target = this._resolveNodeByPath(cloneRoot, instr.path);
                    if (instr.forName) {
                        const expr = target.getAttribute(instr.forName) || '';
                        self._bindDirective(target, instr.forName, expr);
                        continue;
                    }
                    for (let j = 0; j < instr.directiveNames.length; j++) {
                        const dn = instr.directiveNames[j];
                        const expr = target.getAttribute(dn) || '';
                        if (dn === BP_KEY)
                            continue;
                        self._bindDirective(target, dn, expr);
                    }
                    if (FT_TI && !instr.hasTextOrHtml)
                        self._bindTextInterpolationsIn(target);
                }
            };
            const blueprint = buildBlueprint(templateToClone);
            const instances = [];
            const createScope = (item, idxOrKey, existing) => {
                const scope = existing || {};
                scope[itemVar] = item;
                if (indexVar)
                    scope[indexVar] = idxOrKey;
                return scope;
            };
            const objIds = new WeakMap();
            let objSeq = 0;
            const extractId = (o) => {
                if (!o || typeof o !== 'object')
                    return null;
                const v = o.id ?? o._id ?? o.key;
                if (v == null)
                    return null;
                const t = typeof v;
                return (t === 'string' || t === 'number') ? ('id:' + String(v)) : null;
            };
            const keyFor = (item) => {
                if (item && typeof item === 'object') {
                    const explicit = extractId(item);
                    if (explicit)
                        return explicit;
                    let id = objIds.get(item);
                    if (!id) {
                        id = 'o#' + (++objSeq);
                        objIds.set(item, id);
                    }
                    return id;
                }
                return 'p#' + (typeof item) + ':' + String(item);
            };
            const evalKeyExpr = (item, idxOrKey) => {
                if (!keyEval)
                    return null;
                try {
                    const base = self._createContextProxy(undefined, contextAnchor);
                    const ctx = Object.create(base);
                    ctx[itemVar] = item;
                    if (indexVar)
                        ctx[indexVar] = idxOrKey;
                    const v = keyEval.call(self._createMethodContext(), ctx);
                    const t = typeof v;
                    return (t === 'string' || t === 'number') ? v : (v != null ? String(v) : null);
                }
                catch {
                    return null;
                }
            };
            const update = () => {
                const norm = self._safeExecute(() => {
                    const result = listEval();
                    if (_AisArr(result))
                        return { list: result, keys: null, src: result };
                    const tag = result && Object.prototype.toString.call(result);
                    const isMap = typeof Map !== 'undefined' && (result instanceof Map || tag === '[object Map]' || (result && typeof result.get === 'function' && typeof result.set === 'function' && typeof result.keys === 'function'));
                    if (isMap) {
                        return { list: _Afrom(result.values()), keys: _Afrom(result.keys()), src: result };
                    }
                    const isSet = typeof Set !== 'undefined' && (result instanceof Set || tag === '[object Set]' || (result && typeof result.add === 'function' && typeof result.has === 'function' && typeof result.values === 'function'));
                    if (isSet) {
                        return { list: _Afrom(result.values()), keys: null, src: result };
                    }
                    if (result && typeof result[Symbol.iterator] === 'function') {
                        return { list: _Afrom(result), keys: null, src: result };
                    }
                    if (result && typeof result === 'object') {
                        const keys = Object.keys(result);
                        const list = keys.map(k => result[k]);
                        return { list, keys, src: result };
                    }
                    return { list: [], keys: null, src: null };
                }, { list: [], keys: null, src: null });
                const list = norm.list;
                const keysArr = norm.keys;
                const oldByObjKey = new Map();
                const oldPrimQueues = new Map();
                for (let i = 0; i < instances.length; i++) {
                    const n = instances[i];
                    const k = n.__x_for_key;
                    const ps = n.__x_primSig;
                    if (ps) {
                        let q = oldPrimQueues.get(ps);
                        if (!q) {
                            q = [];
                            oldPrimQueues.set(ps, q);
                        }
                        q.push(n);
                    }
                    else if (k) {
                        oldByObjKey.set(k, n);
                    }
                }
                const newNodes = new Array(list.length);
                const parent = placeholder.parentNode;
                for (let i = 0; i < list.length; i++) {
                    const item = list[i];
                    const idxOrKey = keysArr ? keysArr[i] : i;
                    let node;
                    let nodeKey;
                    const explicitKey = keyEval ? evalKeyExpr(item, idxOrKey) : null;
                    if (explicitKey != null) {
                        nodeKey = 'k:' + String(explicitKey);
                        const prev = oldByObjKey.get(nodeKey);
                        if (prev) {
                            node = prev;
                            oldByObjKey.delete(nodeKey);
                        }
                    }
                    if (!node) {
                        const k = keyFor(item);
                        if (k && k.startsWith('o#') || (k && k.startsWith('id:'))) {
                            nodeKey = k;
                            const prev = oldByObjKey.get(k);
                            if (prev) {
                                node = prev;
                                oldByObjKey.delete(k);
                            }
                        }
                        else if (k && k.startsWith('p#')) {
                            const ps = k;
                            const q = oldPrimQueues.get(ps);
                            if (q && q.length) {
                                node = q.shift();
                            }
                            if (node) {
                                nodeKey = node.__x_for_key;
                            }
                            if (node) {
                                node.__x_primSig = ps;
                            }
                        }
                    }
                    if (!node) {
                        const clone = templateToClone.cloneNode(true);
                        clone.removeAttribute('x-for');
                        if (keyExpr)
                            clone.removeAttribute(keyAttrName);
                        const initScope = createScope(item, idxOrKey, {});
                        clone.__x_scope = initScope;
                        clone.__x_itemRef = item;
                        if (indexVar)
                            clone.__x_idxRef = idxOrKey;
                        self._loopScopes.set(clone, initScope);
                        try {
                            hydrateFromBlueprint(clone, blueprint);
                        }
                        catch { }
                        node = clone;
                        node.__x_for_key = (nodeKey !== undefined) ? nodeKey : ('n#' + (++objSeq));
                    }
                    else {
                        const existingScope = node.__x_scope;
                        const prevIdxRef = node.__x_idxRef;
                        const prevItemRef = node.__x_itemRef;
                        const scope = createScope(item, idxOrKey, existingScope);
                        node.__x_scope = scope;
                        self._loopScopes.set(node, scope);
                        let needsUpdate = false;
                        if (prevItemRef !== item) {
                            needsUpdate = true;
                            node.__x_itemRef = item;
                        }
                        const indexChanged = !!indexVar && prevIdxRef !== idxOrKey;
                        if (indexChanged) {
                            needsUpdate = true;
                            node.__x_idxRef = idxOrKey;
                        }
                        if (needsUpdate) {
                            if (indexChanged && indexVar)
                                self._updateElementDirectivesForVar(node, indexVar);
                            else
                                self._updateElementDirectives(node);
                        }
                    }
                    if (nodeKey)
                        node.__x_for_key = nodeKey;
                    const sig = (!keyExpr && !(item && typeof item === 'object')) ? ('p#' + (typeof item) + ':' + String(item)) : undefined;
                    node.__x_primSig = sig;
                    newNodes[i] = node;
                }
                for (const [, node] of oldByObjKey) {
                    if (node && node.parentNode) {
                        self._cleanupElementSubtree(node);
                        node.parentNode.removeChild(node);
                    }
                }
                for (const [, queue] of oldPrimQueues) {
                    for (const node of queue) {
                        if (node && node.parentNode) {
                            self._cleanupElementSubtree(node);
                            node.parentNode.removeChild(node);
                        }
                    }
                }
                if (parent) {
                    const oldIndexMap = new Map();
                    for (let i = 0; i < instances.length; i++) {
                        const k = instances[i].__x_for_key;
                        if (k !== undefined)
                            oldIndexMap.set(k, i);
                    }
                    const seq = new Array(newNodes.length);
                    for (let i = 0; i < newNodes.length; i++) {
                        const k = newNodes[i].__x_for_key;
                        const oldIdx = oldIndexMap.has(k) ? oldIndexMap.get(k) : -1;
                        seq[i] = oldIdx;
                    }
                    const { lisMask: lis } = this._computeLISMask(seq);
                    const tailAnchor = instances.length ? (instances[instances.length - 1].nextSibling) : placeholder.nextSibling;
                    let anchor = null;
                    for (let i = newNodes.length - 1; i >= 0; i--) {
                        const node = newNodes[i];
                        const ref = anchor ?? tailAnchor;
                        if (seq[i] === -1) {
                            parent.insertBefore(node, ref);
                        }
                        else if (!lis[i]) {
                            parent.insertBefore(node, ref);
                        }
                        anchor = node;
                    }
                }
                instances.length = 0;
                for (let i = 0; i < newNodes.length; i++)
                    instances.push(newNodes[i]);
            };
            const dir = { type: 'for', expression };
            const effect = self._createEffect(update, dir);
            dir.update = effect;
            self._addDirective(placeholder, dir);
        }
        _resolveNodeByPath(root, path) {
            let node = root;
            for (let i = 0; i < path.length; i++) {
                let idx = 0;
                let child = node.firstElementChild;
                while (child && idx < path[i]) {
                    child = child.nextElementSibling;
                    idx++;
                }
                node = child || node;
            }
            return node;
        }
        _computeLISMask(seq) {
            const predecessors = new Array(seq.length);
            const tails = [];
            const tailIdx = [];
            for (let i = 0; i < seq.length; i++) {
                const v = seq[i];
                if (v < 0) {
                    predecessors[i] = -1;
                    continue;
                }
                let lo = 0, hi = tails.length;
                while (lo < hi) {
                    const mid = (lo + hi) >> 1;
                    if (seq[tails[mid]] < v)
                        lo = mid + 1;
                    else
                        hi = mid;
                }
                if (lo === tails.length) {
                    tails.push(i);
                }
                else {
                    tails[lo] = i;
                }
                predecessors[i] = lo > 0 ? tails[lo - 1] : -1;
                tailIdx[lo] = i;
            }
            const lisLen = tails.length;
            const lis = new Array(seq.length).fill(false);
            let k = lisLen ? tails[lisLen - 1] : -1;
            while (k >= 0) {
                lis[k] = true;
                k = predecessors[k];
            }
            return { lisMask: lis, lisLen };
        }
        _render() {
            const self = this;
            for (const directives of self._directives.values()) {
                for (const dr of directives) {
                    if (XTOOL_ENABLE_STATIC_DIRECTIVES && dr._static)
                        continue;
                    if (dr.update) {
                        try {
                            dr.update();
                        }
                        catch (error) {
                            if (!(error instanceof ReferenceError)) { }
                        }
                    }
                }
            }
        }
    }
    ReactiveComponent._BA = {
        itemscope: 1, formnovalidate: 1, novalidate: 1, default: 1, readonly: 1
    };
    const xTool = new XToolFramework();
    return xTool;
}();
if (typeof window !== 'undefined') {
    const w = window;
    w.XTool = XToolFramework;
    w.FyneJS = XToolFramework;
}
//# sourceMappingURL=x-tool.js.map