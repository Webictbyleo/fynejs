var TokenType;
(function (TokenType) {
    TokenType[TokenType["Identifier"] = 0] = "Identifier";
    TokenType[TokenType["Keyword"] = 1] = "Keyword";
    TokenType[TokenType["Punctuation"] = 2] = "Punctuation";
    TokenType[TokenType["String"] = 3] = "String";
    TokenType[TokenType["Comment"] = 4] = "Comment";
    TokenType[TokenType["Whitespace"] = 5] = "Whitespace";
    TokenType[TokenType["Number"] = 6] = "Number";
    TokenType[TokenType["Arrow"] = 7] = "Arrow";
    TokenType[TokenType["Conditional"] = 8] = "Conditional";
})(TokenType || (TokenType = {}));
const keywords = new Set([
    'as', 'interface', 'type', 'import', 'export', 'from', 'extends', 'implements',
    'declare', 'namespace', 'module', 'any', 'unknown', 'never', 'void',
    'number', 'string', 'boolean', 'symbol', 'bigint', 'object', 'enum', 'function', 'const',
    'let', 'var'
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
                    return ctx.depth <= 0 && !(t.next?.type === TokenType.Punctuation && hasItem(t.next?.value, '<[{('));
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
            if ('?!'.includes(ch) && pos + 1 < length && input[pos + 1] === ':') {
                pos += 2;
                tokens.push(createToken(TokenType.Conditional, start, pos));
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
            return true;
        const prevToken = tokens[j];
        if (prevToken.type === TokenType.Arrow)
            return false;
        return (prevToken.type === TokenType.Identifier && prevToken.value === 'return') || (prevToken.type === TokenType.Punctuation && (prevToken.value === '=' || prevToken.value === '(' || prevToken.value === '[' ||
            prevToken.value === ',' || prevToken.value === ':' || prevToken.value === '?'));
    }
    const tokens = tokenize(source);
    function skipTokens(tokens, start, end) {
        let objectBraceDepth = 0;
        let outputString = '';
        let i = start;
        let isClass = false;
        const context = {
            isObjectLiteral: false,
            isClassBody: false,
            braceDepth: 0,
            lastIdentifier: undefined,
            lastKeyword: undefined
        };
        while (i < end) {
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
            if (context.lastIdentifier === 'class') {
                isClass = true;
            }
            if ((tt == TokenType.Identifier || tt == TokenType.Keyword) && ((token.next?.type === TokenType.Keyword && token.next.value == 'enum') || (v == 'enum'))) {
                i = skipUntil(tokens, i, t => t.value == '}');
                i++;
                continue;
            }
            if (tt == TokenType.String || (tt != TokenType.Punctuation && TokenType.Whitespace != tt && TokenType.Keyword != tt && TokenType.Conditional != tt)) {
                i++;
                outputString += v;
                continue;
            }
            if (tt === TokenType.Whitespace) {
                outputString += (v.includes('\n') ? '\n' : v);
                i++;
                continue;
            }
            if (tt === TokenType.Punctuation && v === '{') {
                context.braceDepth++;
                if (!context.isObjectLiteral && isObjectLiteralStart(tokens, i)) {
                    objectBraceDepth++;
                    context.isObjectLiteral = true;
                }
                else if (context.isObjectLiteral) {
                    objectBraceDepth++;
                }
                if (isClass) {
                    context.isClassBody = true;
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
                    isClass = false;
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
                if (v === 'as') {
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
            if (tt === TokenType.Punctuation && v === '!' && tokens[i - 1] && !hasItem(tokens[i - 1]?.type, [TokenType.Arrow, TokenType.Punctuation])) {
                i++;
                continue;
            }
            if (tt === TokenType.Punctuation && v === '(') {
                outputString += v;
                i++;
                let depth = 1;
                while (i < tokens.length && depth > 0) {
                    const paramToken = tokens[i];
                    const pt = paramToken.type;
                    const pv = paramToken.value;
                    if (pt == TokenType.Punctuation && pv == '{' && isObjectLiteralStart(tokens, i)) {
                        const jk = skipUntil(tokens, i, (t, ctx) => {
                            if (t.type === TokenType.Punctuation) {
                                if (t.value === '{')
                                    ctx.depth++;
                                else if (t.value === '}')
                                    ctx.depth--;
                            }
                            return ctx.depth <= 0;
                        });
                        outputString += skipTokens(tokens, i, jk);
                        i = jk;
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
                    if (pt === TokenType.Punctuation && pv === '!' && tokens[i - 1] && tokens[i - 1].type === TokenType.Identifier) {
                        i++;
                        continue;
                    }
                    if ((pt === TokenType.Punctuation && pv === ':') || (paramToken.next?.type === TokenType.Conditional) || (TokenType.Keyword === pt && pv == 'as')) {
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
            if (tt === TokenType.Punctuation && v === ':' || (tt === TokenType.Conditional)) {
                if (token.prev && token.prev.type === TokenType.Identifier && (token.prev.prev && token.prev.prev.type === TokenType.Keyword && hasItem(token.prev.prev.value, ['let', 'const', 'var'])) || (token.prev && context.isClassBody)) {
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
        return outputString.trim();
    }
    return skipTokens(tokens, 0, tokens.length);
}
stripTypes;
function caseKebabToCamel(str) {
    return str.replace(/-([a-z])/g, (_match, p1) => p1.toUpperCase());
}
function silentError(fn, defaultValue = null) {
    try {
        return fn();
    }
    catch (e) {
        console.error(e);
        return defaultValue;
    }
}
const ReactiveSymbol = Symbol('$_xtoolfynjsisReactive');
function isReactive(data) {
    return data && data[ReactiveSymbol] === true;
}
function isObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function isPlainObject(value) {
    if (!isObject(value))
        return false;
    const proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
}
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        const later = () => {
            timeout = undefined;
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = window.setTimeout(later, wait);
    };
}
function makeReactive(data, control) {
    if (isReactive(data)) {
        return data;
    }
    const isArr = Array.isArray(data);
    const isSet = (typeof Set !== 'undefined') && (data instanceof Set);
    const isMap = (typeof Map !== 'undefined') && (data instanceof Map);
    if (!isArr && !isSet && !isMap && !isPlainObject(data)) {
        return data;
    }
    if (!control) {
        control = {
            maxReactiveDepth: Number.POSITIVE_INFINITY,
        };
    }
    if (control && control.maxReactiveDepth && control.maxReactiveDepth <= 0) {
        return data;
    }
    if (data[ReactiveSymbol]) {
        return data;
    }
    Object.defineProperty(data, ReactiveSymbol, {
        value: true,
        enumerable: false,
        configurable: false,
        writable: false,
    });
    Object.defineProperty(data, Symbol.for('ReactiveControl'), {
        value: control,
        enumerable: false,
        configurable: false,
        writable: true,
    });
    const onChange = (oldValue, newValue) => {
        if (control && control.baseChangeListener) {
            control.baseChangeListener(oldValue, newValue);
        }
        if (control && control.changeListeners && control.changeListeners.length > 0) {
            const call = () => {
                for (const listener of control.changeListeners) {
                    listener(oldValue, newValue);
                }
            };
            if (control.signal?.aborted) {
                return;
            }
            debounce(call, 10)();
        }
    };
    return new Proxy(data, {
        set(target, prop, value) {
            const oldValue = target[prop];
            if (typeof value === 'object' && value !== null) {
                if (control && control.maxReactiveDepth && control.maxReactiveDepth > 0) {
                    control.maxReactiveDepth -= 1;
                }
                value = makeReactive(value, control);
            }
            Reflect.set(target, prop, value);
            if (oldValue !== value) {
                onChange(oldValue, value);
            }
            return true;
        },
        get(target, prop, receiver) {
            const value = Reflect.get(target, prop, receiver);
            if (prop === Symbol.for('ReactiveControl')) {
                return value;
            }
            if (control && control.depTracker && (Symbol.iterator === prop || (isArr || isMap || isSet && ['size', 'length', 'size', 'keys', 'entries', 'values'].includes(String(prop))) || typeof prop === 'string' || typeof prop === 'number')) {
                control.depTracker(control.trackerId ?? prop);
            }
            if (prop === Symbol.toPrimitive) {
                return (hint) => {
                    if (hint === 'number') {
                        return NaN;
                    }
                    if (isReactive(target)) {
                        const value = target['value'];
                        if (value !== undefined) {
                            return value;
                        }
                    }
                    else {
                        const value = target['value'];
                        if (value !== undefined && isReactive(value)) {
                            return value;
                        }
                    }
                    if (hint === 'string') {
                        return isArr ? '[]' : isSet ? 'Set {}' : isMap ? 'Map {}' : '[object Object]';
                    }
                    return null;
                };
            }
            if (typeof value === 'object' && value !== null && value[ReactiveSymbol] === true && value.value !== undefined) {
                return value.value;
            }
            if (typeof value == 'function') {
                if (isArr && ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse', 'fill', 'copyWithin'].includes(prop)) {
                    return function (...args) {
                        const oldArray = target.slice();
                        const result = Array.prototype[prop].apply(target, args);
                        if (control) {
                            onChange(oldArray, target);
                        }
                        return result;
                    };
                }
                if ((isSet || isMap) && ['add', 'delete', 'clear', 'set'].includes(prop)) {
                    return function (...args) {
                        const oldCollection = isSet ? new Set(target) : new Map(target);
                        const result = (isSet ? Set.prototype : Map.prototype)[prop].apply(target, args);
                        if (control) {
                            onChange(oldCollection, target);
                        }
                        return result;
                    };
                }
                return value;
            }
            if (typeof value === 'object' && value !== null) {
                if (control && control.maxReactiveDepth && control.maxReactiveDepth > 0) {
                    control.maxReactiveDepth -= 1;
                }
                return makeReactive(value, control);
            }
            return value;
        },
        deleteProperty(target, p) {
            const oldValue = target[p];
            const result = Reflect.deleteProperty(target, p);
            if (result) {
                onChange(oldValue, undefined);
            }
            return result;
        },
    });
}
const ComputedSymbol = Symbol('$_xtoolfynjsisComputed');
function generateRandomId(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
function makeComputed(getter, control) {
    let cachedValue;
    let isDirty = true;
    const computeValue = () => {
        cachedValue = getter();
        isDirty = false;
    };
    const reactiveControl = {
        ...control,
        depTracker: (_key) => {
            isDirty = true;
        },
    };
    const target = {
        get value() {
            if (isDirty) {
                computeValue();
            }
            return cachedValue;
        }
    };
    Object.defineProperty(target, ComputedSymbol, {
        value: true,
        enumerable: false,
        configurable: false,
        writable: false,
    });
    Object.defineProperty(target, Symbol.for(`_computedID`), {
        value: generateRandomId(12),
        enumerable: false,
        configurable: false,
        writable: true,
    });
    console.log('Created computed property with ID:', target[Symbol.for(`_computedID`)]);
    return makeReactive(target, reactiveControl);
}
function isComputedRef(value) {
    return !!(value && value[ComputedSymbol] === true);
}
function getReactiveControl(data) {
    if (!isReactive(data)) {
        return undefined;
    }
    return data[Symbol.for('ReactiveControl')];
}
function setReactiveControl(data, control) {
    if (!isReactive(data)) {
        return;
    }
    Object.defineProperty(data, Symbol.for('ReactiveControl'), {
        value: control,
        enumerable: false,
        configurable: false,
        writable: true,
    });
}
function unwrapReactive(data) {
    if (!isReactive(data)) {
        return data;
    }
    const isArr = Array.isArray(data);
    const isSet = (typeof Set !== 'undefined') && (data instanceof Set);
    const isMap = (typeof Map !== 'undefined') && (data instanceof Map);
    if (!isArr && !isSet && !isMap && !isPlainObject(data)) {
        return data;
    }
    if (isArr) {
        return data.map(item => unwrapReactive(item));
    }
    if (isSet) {
        const newSet = new Set();
        data.forEach(item => {
            newSet.add(unwrapReactive(item));
        });
        return newSet;
    }
    if (isMap) {
        const newMap = new Map();
        data.forEach((value, key) => {
            newMap.set(key, unwrapReactive(value));
        });
        return newMap;
    }
    const result = {};
    for (const key in data) {
        if (data.hasOwnProperty(key)) {
            result[key] = unwrapReactive(data[key]);
        }
    }
    return result;
}
function Router(config, frameworkInstance) {
    const d = document;
    const _prefetched = new Set();
    let _currentDocURL = null;
    const _scrollPositions = new Map();
    const _isSameOrigin = (href) => {
        const url = href instanceof URL ? href : new URL(href, location.href);
        return url.origin === location.origin;
    };
    const _isSameDocument = (target) => {
        const url = target instanceof URL ? target : new URL(target, location.href);
        return url.origin === location.origin && url.pathname === location.pathname && url.search === location.search;
    };
    const _normalizeDocURL = function (target) {
        const u = typeof target === 'string' ? new URL(target, d?.baseURI || location.href) : target;
        return `${u.origin}${u.pathname}${u.search}`;
    };
    const _routerEnabled = () => {
        return config.router?.enabled !== false;
    };
    async function _fetchHTML(url) {
        const res = await fetch(url, { credentials: 'same-origin', cache: 'default', redirect: 'follow' });
        if (res.redirected) {
            const finalUrl = res.url;
            try {
                location.assign(finalUrl);
            }
            catch {
                silentError(() => location.href = finalUrl);
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
    async function _swapDocument(html) {
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
            const sel = config.container || 'body';
            const cur = d.querySelector(sel);
            const next = doc.querySelector(sel);
            if (cur && next) {
                _morphElement(cur, next);
            }
            else if (next) {
                d.body.innerHTML = next.innerHTML;
            }
            else {
                d.body.innerHTML = doc.body.innerHTML;
            }
            frameworkInstance._unregisterElement(cur);
            frameworkInstance._autoDiscoverComponents();
            const c = d?.querySelector(config.container);
            if (c) {
                frameworkInstance._ensureRootObserver(c);
                if (config.delegate)
                    frameworkInstance._ensureDelegation(c);
            }
        };
        const vt = (document).startViewTransition?.bind(document);
        if (vt && config.router?.transitionName) {
            const sel = config.container || 'body';
            const cont = d.querySelector(sel);
            const prev = cont ? (cont.style.getPropertyValue('view-transition-name') || '') : '';
            silentError(() => { if (cont)
                cont.style.setProperty('view-transition-name', config.router?.transitionName ?? 'route'); });
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
    function _setAttributes(cur, next) {
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
                if (val !== null) {
                    cur.setAttribute(name, val);
                }
        }
    }
    function _attributesEqual(a, b) {
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
    function _isDynamicNode(el) {
        const tag = el.tagName;
        if (tag === 'IFRAME' && el.hasAttribute('src'))
            return true;
        if (tag === 'COMPONENT' && el.hasAttribute('source'))
            return true;
        return false;
    }
    function _morphElement(cur, next) {
        if (cur.nodeName !== next.nodeName || _isDynamicNode(next)) {
            cur.replaceWith(next.cloneNode(true));
            return;
        }
        _setAttributes(cur, next);
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
                if (n.nodeType === 1) {
                    const cn = c;
                    const nn = n;
                    if (_isDynamicNode(nn)) {
                        try {
                            cn.replaceWith(nn.cloneNode(true));
                        }
                        catch { }
                    }
                    else if (cn.nodeName === nn.nodeName && _attributesEqual(cn, nn)) {
                        _morphElement(cn, nn);
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
    function _scrollToHash(hash) {
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
    async function _navigate(url, push, source = 'program') {
        if (!_routerEnabled())
            return Promise.resolve();
        if (!_isSameOrigin(url)) {
            location.assign(url);
            return;
        }
        const targetURL = new URL(url);
        const targetKey = _normalizeDocURL(targetURL);
        if (source !== 'popstate') {
            if (_isSameDocument(targetURL)) {
                location.href = url;
                return;
            }
        }
        else {
            if (_currentDocURL && targetKey === _currentDocURL) {
                _scrollToHash(targetURL.hash);
                return;
            }
        }
        const from = location.href;
        try {
            const res = await (config.router?.before?.(url, from, { source }));
            if (res === false)
                return;
        }
        catch (err) {
            try {
                config.router?.error?.(err, url, from);
            }
            catch { }
            return;
        }
        const curKey = _currentDocURL || _normalizeDocURL(from);
        _scrollPositions.set(curKey, { x: window.scrollX || 0, y: window.scrollY || 0 });
        try {
            const html = await _fetchHTML(url);
            if (push)
                history.pushState({}, '', url);
            await _swapDocument(html);
            _currentDocURL = targetKey;
            silentError(() => {
                if (source === 'popstate') {
                    const pos = _scrollPositions.get(targetKey);
                    if (pos)
                        (window).scrollTo(pos.x, pos.y);
                    else if (!_scrollToHash(targetURL.hash))
                        (window).scrollTo(0, 0);
                }
                else {
                    if (!_scrollToHash(targetURL.hash))
                        (window).scrollTo(0, 0);
                }
            });
            try {
                await config.router?.after?.(url, from, { source });
            }
            catch { }
        }
        catch (err) {
            if (err && (err.name === 'XToolRedirect' || err.message === 'XToolRedirect'))
                return;
            silentError(() => config.router?.error?.(err, url, from));
            try {
                location.assign(url);
            }
            catch {
                silentError(() => location.href = url);
            }
        }
    }
    function _installRouting(root) {
        const preload = (href) => {
            try {
                if (!_isSameOrigin(href))
                    return;
            }
            catch {
                return;
            }
            const u = new URL(href, location.href);
            if (_isSameDocument(u))
                return;
            u.hash = '';
            const url = u.toString();
            if (_prefetched.has(url))
                return;
            const existing = d?.head?.querySelector(`link[rel="prefetch"][href="${CSS.escape(url)}"]`);
            if (existing) {
                _prefetched.add(url);
                return;
            }
            try {
                const link = d.createElement('link');
                link.setAttribute('rel', 'prefetch');
                link.setAttribute('as', 'document');
                link.setAttribute('href', url);
                d.head.appendChild(link);
                _prefetched.add(url);
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
            if (!_isSameOrigin(href))
                return;
            const url = new URL(href, location.href);
            if (_isSameDocument(url))
                return;
            ev.preventDefault();
            _navigate(url.toString(), true, 'link').catch(() => { location.assign(url.toString()); });
        };
        root.addEventListener('click', onClick);
        if (config.router?.prefetchOnHover) {
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
        window.addEventListener('popstate', () => { _navigate(location.href, false, 'popstate').catch(() => { }); });
        _currentDocURL = _normalizeDocURL(location.href);
    }
    return {
        navigate: _navigate,
        install: _installRouting
    };
}
const ARRAY_ISARRAY = Array.isArray;
const WkMap = WeakMap;
const quMct = queueMicrotask;
const FT_C = true;
const FT_TI = typeof __FEAT_TEXT_INTERP__ !== 'undefined' ? !!__FEAT_TEXT_INTERP__ : true;
const _FT_DR = typeof __FEAT_DEEP_REACTIVE__ !== 'undefined' ? !!__FEAT_DEEP_REACTIVE__ : true;
const FT_IFB = typeof __FEAT_IF_BRANCHES__ !== 'undefined' ? !!__FEAT_IF_BRANCHES__ : true;
const FT_RT = typeof __FEAT_ROUTER__ !== 'undefined' ? !!__FEAT_ROUTER__ : true;
const FT_TS = typeof __FEAT_TS__ !== 'undefined' ? !!__FEAT_TS__ : true;
const FT_EXT_DIRS = typeof __FEAT_EXT_DIRECTIVES__ !== 'undefined' ? !!__FEAT_EXT_DIRECTIVES__ : true;
const FT_VT = typeof __FEAT_TRANSITION__ !== 'undefined' ? !!__FEAT_TRANSITION__ : true;
const XToolFramework = function () {
    const _se = silentError;
    const _tr = (s) => (s || '').trim();
    const _Afrom = Array.from;
    const _Okeys = Object.keys;
    let _globalActiveEffect = null;
    const _setAttr = (el, name, val, isCss) => {
        if (isCss) {
            const style = el.style;
            if (val == null || val === false)
                style.removeProperty(name);
            else
                style.setProperty(name, String(val));
        }
        else {
            if (val == null || val === false)
                el.removeAttribute(name);
            else if (val === true)
                el.setAttribute(name, '');
            else
                el.setAttribute(name, String(val));
        }
    };
    const _expandAndSet = (el, name, value, isCss) => {
        const globMatch = name.match(/^(.*)?\[([^\]]+)\](.*)$/);
        if (globMatch) {
            const [, prefix = '', keys, suffix = ''] = globMatch;
            const keyList = keys.split(',').map(k => k.trim()).filter(Boolean);
            const isObjValue = value && typeof value === 'object' && !Array.isArray(value);
            for (const key of keyList) {
                const attrName = prefix + key + suffix;
                const attrValue = isObjValue && key in value ? value[key] : value;
                _setAttr(el, attrName, attrValue, isCss);
            }
        }
        else {
            _setAttr(el, name, value, isCss);
        }
    };
    const STR_STYLE = 'style';
    const STR_DISPLAY = 'display';
    const STR_NONE = 'none';
    const STR_TAGNAME = 'tagName';
    const STR_TEMPLATE = 'TEMPLATE';
    const STR_LENGTH = 'length';
    const STR_SOURCE = 'source';
    const STR_READONLY = 'readonly';
    const _RAW_TARGET = Symbol('rawTarget');
    const _OWNER_COMPONENT = Symbol('ownerComponent');
    const _objVersions = new WkMap();
    const _unwrap = (obj) => (obj && obj[_RAW_TARGET]) || obj;
    const _bumpObjVersion = (obj) => {
        const raw = _unwrap(obj);
        const v = (_objVersions.get(raw) ?? 0) + 1;
        _objVersions.set(raw, v);
        return v;
    };
    const _objIds = new WkMap();
    let _objIdSeq = 0;
    const _getObjId = (obj) => {
        let id = _objIds.get(obj);
        if (id === undefined) {
            id = ++_objIdSeq;
            _objIds.set(obj, id);
        }
        return id;
    };
    const _getDeepVersion = (obj, maxDepth = 5, seen) => {
        if (!obj || typeof obj !== 'object' || maxDepth <= 0)
            return 0;
        const raw = _unwrap(obj);
        if (!seen)
            seen = new WeakSet();
        if (seen.has(raw))
            return 0;
        seen.add(raw);
        let sum = _getObjId(raw) + (_objVersions.get(raw) ?? 0);
        try {
            for (const key in raw) {
                const val = raw[key];
                if (val && typeof val === 'object') {
                    sum += _getDeepVersion(val, maxDepth - 1, seen);
                }
            }
        }
        catch { }
        return sum;
    };
    let XTOOL_ENABLE_STATIC_DIRECTIVES = true;
    const d = (typeof document !== 'undefined' ? document : null);
    const STR_CONTENTS = 'contents';
    const EV_CLICK = 'click', EV_INPUT = 'input', EV_CHANGE = 'change', EV_KEYDOWN = 'keydown', EV_KEYUP = 'keyup';
    const EV_DELEGATED = [EV_CLICK, EV_INPUT, EV_CHANGE, EV_KEYDOWN, EV_KEYUP];
    const LS_PENDING = 0, LS_LOADING = 1, LS_LOADED = 2, LS_ERROR = 3;
    const _KEY_ALIAS_MAP = { enter: ['enter'], esc: ['escape', 'esc'], escape: ['escape', 'esc'], space: [' ', 'space', 'spacebar'], tab: ['tab'], backspace: ['backspace'], delete: ['delete', 'del'], del: ['delete', 'del'], arrowup: ['arrowup', 'up'], arrowdown: ['arrowdown', 'down'], arrowleft: ['arrowleft', 'left'], arrowright: ['arrowright', 'right'], home: ['home'], end: ['end'], pageup: ['pageup'], pagedown: ['pagedown'] };
    const _BUTTON_MAP = { left: 0, middle: 1, right: 2 };
    const _varNameRegexCache = new Map();
    const _wrappedTargets = new WkMap();
    const _UNWRAP_DOM_TARGET = Symbol('unwrapDomTarget');
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
    class XToolFramework {
        constructor() {
            this._components = new Map();
            this._byEl = new WkMap();
            this._pending = [];
            this._config = {};
            this._customDirectives = new Map();
            this._autoMergeProps = false;
            this._inheritScope = false;
            this._currentArrayInterceptorComp = null;
            this._namedComponentDefs = new Map();
            this._delegated = new WkMap();
            this._delegatedRootBound = false;
            this._refsRegistry = new WkMap();
            this._refCleanupRegistry = new WkMap();
            this._propExpressions = new WkMap();
            this._getComponentRefs = (comp, refName) => {
                const compRefs = this._refsRegistry.get(comp);
                return compRefs?.get(refName);
            };
            this._registerComponentRef = (comp, refName, el) => {
                if (!FT_EXT_DIRS)
                    return;
                let compRefs = this._refsRegistry.get(comp);
                if (!compRefs) {
                    compRefs = new Map();
                    this._refsRegistry.set(comp, compRefs);
                }
                let refSet = compRefs.get(refName);
                if (!refSet) {
                    refSet = new Set();
                    compRefs.set(refName, refSet);
                }
                if (refSet.has(el))
                    return;
                refSet.add(el);
                if (el instanceof Element === false)
                    return;
                this._refCleanupRegistry.set(el, () => {
                    refSet.delete(el);
                    if (refSet.size === 0) {
                        compRefs.delete(refName);
                    }
                    if (compRefs.size === 0) {
                        this._refsRegistry.delete(comp);
                    }
                });
            };
            this._runRefCleanup = (el) => {
                const cleanup = this._refCleanupRegistry.get(el);
                if (cleanup) {
                    cleanup();
                    this._refCleanupRegistry.delete(el);
                }
            };
            this.registerRefCleanup = (el, cleanupFn) => {
                if (!FT_EXT_DIRS)
                    return;
                this._refCleanupRegistry.set(el, cleanupFn);
            };
            this._clearComponentRefs = (comp) => {
                this._refsRegistry.delete(comp);
            };
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
            this.mountComponent = (name, element, props) => {
                if (!name || !element)
                    return undefined;
                const def = this._getRegisteredComponentDef(name);
                if (!def) {
                    if (this._config.debug)
                        console.warn(`[XTool] Component "${name}" not registered`);
                    return undefined;
                }
                if (this._getComponentByElement(element)) {
                    if (this._config.debug)
                        console.warn(`[XTool] Element already has a component mounted`);
                    return this._getComponentByElement(element);
                }
                element.__x_mount_source = name;
                if (props) {
                    element.__x_mount_props = props;
                }
                this._instantiateNamedComponent(element);
                return this._getComponentByElement(element);
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
                this._autoMergeProps = this._config.autoMergeProps === true;
                this._inheritScope = this._config.inheritScope === true;
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
                        _se(async () => await Promise.allSettled(this._preDiscoveryTasks));
                    }
                    this._autoDiscoverComponents();
                    const c = d?.querySelector(this._config.container);
                    if (c) {
                        this._ensureRootObserver(c);
                        if (this._config.delegate)
                            this._ensureDelegation(c);
                        if (FT_RT && this._routerEnabled())
                            this._installRouting(c);
                    }
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
                        const inferredName = (it.name || it.path.split('/').pop() || '').replace(/\.(mjs|js|ts|html)(\?.*)?$/i, '').toLowerCase();
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
                    _se(() => this._autoDiscoverComponents());
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
                const forAttr = attrName('for');
                const ifAttr = attrName('if');
                const ElseIfAttr = attrName('else-if');
                const ElseAttr = attrName('else');
                if (container.hasAttribute(dataAttr) && !this._getComponentByElement(container)) {
                    this._bindElementAsComponent(container, undefined);
                }
                const isInsideDynamicTemplate = (el) => {
                    let parent = el.parentElement;
                    while (parent && parent !== container) {
                        if (parent.hasAttribute(forAttr) || parent.hasAttribute(ifAttr) || parent.hasAttribute(ElseIfAttr) || parent.hasAttribute(ElseAttr)) {
                            return true;
                        }
                        parent = parent.parentElement;
                    }
                    return false;
                };
                const componentElements = container.querySelectorAll(`[${dataAttr}]`);
                for (const element of componentElements) {
                    if (isInsideDynamicTemplate(element))
                        continue;
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
                const remaining = [];
                const ready = [];
                const containerEl = (this._config.container ? d?.querySelector(this._config.container) : null);
                for (const p of this._pending) {
                    if (p.comp.isDestroyed)
                        continue;
                    if (!p.el.isConnected) {
                        remaining.push(p);
                        continue;
                    }
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
                        ready.push(p.comp);
                    }
                    else if (containerEl && (containerEl === p.el || containerEl.contains(p.el))) {
                        ready.push(p.comp);
                    }
                    else {
                        remaining.push(p);
                    }
                }
                for (const c of ready)
                    c.completeBinding();
                this._pending = remaining;
            };
            this._bindElementAsComponent = (element, parentForEval) => {
                const dataExpression = element.getAttribute(attrName('data'));
                let data = {};
                if (dataExpression) {
                    element.removeAttribute(attrName('data'));
                    try {
                        if (parentForEval) {
                            const parentCtx = parentForEval._createContextProxy(undefined, element);
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
                        const methodsObj = data.methods || {};
                        const detectedMethods = {};
                        for (const k of Object.keys(plainData)) {
                            const v = plainData[k];
                            if (typeof v === 'function' && k !== 'methods') {
                                detectedMethods[k] = v;
                            }
                        }
                        for (const k of Object.keys(detectedMethods))
                            delete plainData[k];
                        const lifecycleKeys = ['mounted', 'unmounted', 'beforeMount', 'beforeUnmount', 'updated', 'destroyed', 'beforeDestroy', 'setup'];
                        const lifecycle = {};
                        for (const lk of lifecycleKeys) {
                            if (detectedMethods[lk]) {
                                lifecycle[lk] = detectedMethods[lk];
                                delete detectedMethods[lk];
                            }
                        }
                        const mergedMethods = { ...methodsObj, ...detectedMethods };
                        const def = (hasOwnMethods || Object.keys(detectedMethods).length)
                            ? { methods: mergedMethods, data: plainData }
                            : { data: plainData };
                        for (const lk in lifecycle)
                            def[lk] = lifecycle[lk];
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
                comp._isInlineXData = true;
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
            this._discoverNestedNamed = (root, parentHint) => {
                try {
                    const hosts = [];
                    if (root[STR_TAGNAME] === 'COMPONENT' && root.hasAttribute('source'))
                        hosts.push(root);
                    const found = root.querySelectorAll('component[source]');
                    for (const el of found) {
                        hosts.push(el);
                    }
                    for (const host of hosts) {
                        if (!this._getComponentByElement(host)) {
                            this._instantiateNamedComponent(host, parentHint);
                        }
                    }
                }
                catch { }
            };
            this._discoverNestedXData = (root, parentHint) => {
                try {
                    const dataAttr = attrName('data');
                    const nested = root.querySelectorAll(`[${dataAttr}]`);
                    for (const el of nested) {
                        if (!this._getComponentByElement(el)) {
                            this._bindElementAsComponent(el, parentHint);
                        }
                    }
                }
                catch { }
            };
            this._discoverNested = (root, parentHint) => {
                this._discoverNestedNamed(root, parentHint);
                this._discoverNestedXData(root, parentHint);
            };
            this._parseDataExpression = (expression) => {
                return _se(() => new Function('return ' + expression.trim())(), {});
            };
            this._unregisterComponent = (componentId) => { this._components.delete(componentId); };
            this._registerElement = (element, component) => {
                this._byEl.set(element, component);
            };
            this._unregisterElement = (element) => { this._byEl.delete(element); };
        }
        _routerEnabled() { const c = this._config; return !!(c.router?.enabled); }
        _installRouting(root) {
            if (!FT_RT)
                return;
            const { install, navigate } = Router(this._config, this);
            install(root);
            this.navigate = navigate;
        }
        async _navigate(url, push, source = 'program') {
            if (!this.navigate)
                return;
            return this.navigate(url, push, source);
        }
        _fetchAndEvalComponent(path, retries = 2, baseDelay = 300, maxDelay = 30000) {
            const existing = this._inflightComponentLoads.get(path);
            if (existing)
                return existing;
            const self = this;
            const urlObj = new URL(path, d?.baseURI || location.href);
            const isTypeScript = /\.ts?$/.test(urlObj.pathname);
            if (isTypeScript && !FT_TS)
                throw new Error(`TypeScript component loading is not enabled in tiny builds. Loading failed for: ${path} failed.`);
            const isHTMLComponent = /\.html?$/.test(urlObj.pathname);
            const html = (strings, ...values) => strings.reduce((acc, str, i) => acc + str + (i < values.length ? values[i] : ''), '') + `\n`;
            const data = (init) => {
                try {
                    if (isReactive(init) || isComputedRef(init))
                        return init;
                }
                catch { }
                if (!init || typeof init !== 'object')
                    return makeReactive({ value: init });
                const inner = makeReactive(init);
                const ref = makeReactive({ value: inner });
                try {
                    const innerCtrl = getReactiveControl(inner);
                    const refCtrl = getReactiveControl(ref);
                    if (innerCtrl && refCtrl) {
                        if (!innerCtrl.changeListeners)
                            innerCtrl.changeListeners = [];
                        innerCtrl.changeListeners.push((_old, _new) => {
                            if (Array.isArray(refCtrl.changeListeners)) {
                                const oldSnap = unwrapReactive(inner);
                                const newSnap = unwrapReactive(inner);
                                for (const l of refCtrl.changeListeners) {
                                    try {
                                        l(oldSnap, newSnap);
                                    }
                                    catch { }
                                }
                            }
                        });
                    }
                }
                catch { }
                const proxy = new Proxy(ref, {
                    get: (r, k) => (k === 'value' ? r.value : r.value?.[k]),
                    set: (r, k, v) => { try {
                        if (r.value)
                            r.value[k] = v;
                        return true;
                    }
                    catch (e) {
                        return false;
                    } },
                    has: (r, k) => (k === 'value') || (r.value ? (k in r.value) : false),
                    ownKeys: (r) => (r.value ? Reflect.ownKeys(r.value) : []),
                    getOwnPropertyDescriptor: (r, k) => {
                        if (k === 'value')
                            return { configurable: true, enumerable: true, value: r.value, writable: true };
                        const val = r.value;
                        return val ? (Object.getOwnPropertyDescriptor(val, k) || { configurable: true, enumerable: true, value: val[k], writable: true }) : undefined;
                    }
                });
                try {
                    const ctrl = getReactiveControl(ref);
                    if (ctrl)
                        setReactiveControl(proxy, ctrl);
                }
                catch { }
                return proxy;
            };
            const computed = (getter) => makeComputed(getter);
            let resolved = false;
            let attemptIndex = 0;
            let timer = null;
            let onlineListener = null;
            let resolveFn;
            let rejectFn;
            const computeDelay = (n) => Math.min(maxDelay, (baseDelay * Math.pow(2, n)) * (0.75 + Math.random() * 0.5));
            const clearResources = () => {
                if (timer != null) {
                    clearTimeout(timer);
                    timer = null;
                }
                if (onlineListener) {
                    window.removeEventListener('online', onlineListener);
                    onlineListener = null;
                }
            };
            const attempt = () => {
                const currentN = attemptIndex++;
                fetch(path, { cache: 'no-cache' }).then(res => {
                    if (!res.ok)
                        throw new Error(res.status + ' ' + res.statusText);
                    return res.text();
                }).then(code => {
                    if (resolved)
                        return;
                    if (FT_TS && isTypeScript)
                        code = stripTypes(code);
                    if (!isHTMLComponent) {
                        const wrapped = code + `\n//# sourceURL=${path}`;
                        try {
                            new Function('XTool', 'html', wrapped)(self, html);
                        }
                        catch (err) {
                            console.error(`Error evaluating component script at ${path}:`, err);
                        }
                    }
                    else {
                        const namedComponents = new Map();
                        let defaultScript = '';
                        let defaultTemplate = '';
                        let defaultHasSetup = false;
                        try {
                            const parser = new DOMParser();
                            const parsed = parser.parseFromString(code, 'text/html');
                            const scripts = parsed.querySelectorAll('script');
                            scripts.forEach(sc => {
                                const isSetup = sc.hasAttribute('setup');
                                const name = sc.getAttribute('name');
                                if (name) {
                                    const entry = namedComponents.get(name) || { script: '', template: '', hasSetup: false };
                                    if (isSetup)
                                        entry.hasSetup = true;
                                    entry.script += (sc.textContent || '') + '\n';
                                    namedComponents.set(name, entry);
                                }
                                else {
                                    if (isSetup)
                                        defaultHasSetup = true;
                                    defaultScript += (sc.textContent || '') + '\n';
                                }
                                sc.remove();
                            });
                            const templates = parsed.querySelectorAll('template');
                            templates.forEach(tpl => {
                                const name = tpl.getAttribute('name');
                                if (name) {
                                    const entry = namedComponents.get(name) || { script: '', template: '', hasSetup: false };
                                    entry.template = (tpl.innerHTML || '').trim();
                                    namedComponents.set(name, entry);
                                }
                                else if (!defaultTemplate) {
                                    defaultTemplate = (tpl.innerHTML || '').trim();
                                }
                            });
                            if (!defaultTemplate && !namedComponents.size) {
                                defaultTemplate = (parsed.body ? parsed.body.innerHTML : '').trim();
                            }
                        }
                        catch (e) {
                            console.error('HTML component parse failed, falling back to raw processing:', e);
                            defaultTemplate = code;
                        }
                        const registerOneComponent = (scriptContent, templateHTML, hasSetup, explicitName) => {
                            try {
                                const ctx = {};
                                const lifecycles = {
                                    onMounted: [],
                                    onBeforeMount: [],
                                    onUnmounted: [],
                                    onBeforeUnmount: []
                                };
                                const expose = (obj) => { if (obj && typeof obj === 'object')
                                    Object.assign(ctx, obj); };
                                const onMounted = (fn) => { if (typeof fn === 'function')
                                    lifecycles.onMounted.push(fn); };
                                const onBeforeMount = (fn) => { if (typeof fn === 'function')
                                    lifecycles.onBeforeMount.push(fn); };
                                const onUnmounted = (fn) => { if (typeof fn === 'function')
                                    lifecycles.onUnmounted.push(fn); };
                                const onBeforeUnmount = (fn) => { if (typeof fn === 'function')
                                    lifecycles.onBeforeUnmount.push(fn); };
                                const watch = (source, cb) => {
                                    if (!source || typeof cb !== 'function')
                                        return () => { };
                                    const readVal = (s) => {
                                        if (isComputedRef(s))
                                            return undefined;
                                        if (isReactive(s)) {
                                            try {
                                                if ('value' in s)
                                                    return s.value;
                                            }
                                            catch { }
                                            return unwrapReactive(s);
                                        }
                                        return s;
                                    };
                                    if (Array.isArray(source)) {
                                        const srcs = source.filter((s) => !!s && !isComputedRef(s));
                                        const ctrls = srcs.map((s) => isReactive(s) ? getReactiveControl(s) : undefined);
                                        const listeners = [];
                                        let oldVals = srcs.map(readVal);
                                        let scheduled = false;
                                        const fire = () => {
                                            if (scheduled)
                                                return;
                                            scheduled = true;
                                            Promise.resolve().then(() => {
                                                scheduled = false;
                                                const newVals = srcs.map(readVal);
                                                try {
                                                    cb(newVals, oldVals);
                                                }
                                                catch (e) {
                                                    console.error(e);
                                                }
                                                oldVals = newVals;
                                            });
                                        };
                                        for (let i = 0; i < ctrls.length; i++) {
                                            const c = ctrls[i];
                                            if (!c)
                                                continue;
                                            if (!c.changeListeners)
                                                c.changeListeners = [];
                                            const l = (_o, _n) => fire();
                                            c.changeListeners.push(l);
                                            listeners.push(l);
                                        }
                                        const stop = () => {
                                            for (let i = 0; i < ctrls.length; i++) {
                                                const c = ctrls[i];
                                                const l = listeners[i];
                                                if (!c || !l || !c.changeListeners)
                                                    continue;
                                                const idx = c.changeListeners.indexOf(l);
                                                if (idx >= 0)
                                                    c.changeListeners.splice(idx, 1);
                                            }
                                        };
                                        lifecycles.onBeforeUnmount.push(stop);
                                        return stop;
                                    }
                                    if (isComputedRef(source)) {
                                        return () => { };
                                    }
                                    if (isReactive(source)) {
                                        const ctrl = getReactiveControl(source);
                                        if (!ctrl)
                                            return () => { };
                                        if (!ctrl.changeListeners)
                                            ctrl.changeListeners = [];
                                        let oldV = readVal(source);
                                        const listener = (_old, _new) => {
                                            const newV = readVal(source);
                                            try {
                                                cb(newV, oldV);
                                            }
                                            catch (e) {
                                                console.error(e);
                                            }
                                            oldV = newV;
                                        };
                                        ctrl.changeListeners.push(listener);
                                        const stop = () => {
                                            const arr = ctrl.changeListeners;
                                            if (!arr)
                                                return;
                                            const idx = arr.indexOf(listener);
                                            if (idx >= 0)
                                                arr.splice(idx, 1);
                                        };
                                        lifecycles.onBeforeUnmount.push(stop);
                                        return stop;
                                    }
                                    return () => { };
                                };
                                const exec = new Function('XTool', 'data', 'computed', 'watch', 'html', 'template', 'expose', 'onMounted', 'onBeforeMount', 'onUnmounted', 'onBeforeUnmount', scriptContent + `\n//# sourceURL=${path}`);
                                if (hasSetup)
                                    exec.call(ctx, self, data, computed, watch, html, templateHTML, expose, onMounted, onBeforeMount, onUnmounted, onBeforeUnmount);
                                else
                                    exec(self, data, computed, watch, html, templateHTML, expose, onMounted, onBeforeMount, onUnmounted, onBeforeUnmount);
                                const inferredName = (path.split('/').pop() || '').replace(/\.(mjs|js|ts|html)(\?.*)?$/i, '').toLowerCase();
                                const name = explicitName || (typeof ctx.name === 'string' && ctx.name.trim() ? ctx.name.trim() : inferredName);
                                const dataObj = {};
                                const methodsObj = {};
                                const computedObj = {};
                                for (const k of Object.keys(ctx)) {
                                    if (k === 'name' && typeof ctx[k] === 'string')
                                        continue;
                                    const v = ctx[k];
                                    if (typeof v === 'function') {
                                        methodsObj[k] = v;
                                    }
                                    else if (isComputedRef(v) && FT_C) {
                                        computedObj[k] = v;
                                    }
                                    else {
                                        dataObj[k] = isReactive(v) && _FT_DR ? v : v;
                                    }
                                }
                                const lifecycleDef = {};
                                if (lifecycles.onMounted.length) {
                                    lifecycleDef.mounted = function () { for (let i = 0; i < lifecycles.onMounted.length; i++) {
                                        try {
                                            lifecycles.onMounted[i].call(this);
                                        }
                                        catch (e) {
                                            console.error(e);
                                        }
                                    } };
                                }
                                if (lifecycles.onBeforeMount.length) {
                                    lifecycleDef.beforeMount = function () { for (let i = 0; i < lifecycles.onBeforeMount.length; i++) {
                                        try {
                                            lifecycles.onBeforeMount[i].call(this);
                                        }
                                        catch (e) {
                                            console.error(e);
                                        }
                                    } };
                                }
                                if (lifecycles.onUnmounted.length) {
                                    lifecycleDef.unmounted = function () { for (let i = 0; i < lifecycles.onUnmounted.length; i++) {
                                        try {
                                            lifecycles.onUnmounted[i].call(this);
                                        }
                                        catch (e) {
                                            console.error(e);
                                        }
                                    } };
                                }
                                if (lifecycles.onBeforeUnmount.length) {
                                    lifecycleDef.beforeUnmount = function () { for (let i = 0; i < lifecycles.onBeforeUnmount.length; i++) {
                                        try {
                                            lifecycles.onBeforeUnmount[i].call(this);
                                        }
                                        catch (e) {
                                            console.error(e);
                                        }
                                    } };
                                }
                                try {
                                    self.registerComponent({ name, template: templateHTML, data: dataObj, methods: methodsObj, computed: computedObj, ...lifecycleDef });
                                }
                                catch (e) {
                                    console.error('Auto HTML component registration failed:', e);
                                }
                            }
                            catch (err) {
                                console.error(`Error evaluating HTML component at ${path}:`, err);
                            }
                        };
                        for (const [compName, entry] of namedComponents) {
                            registerOneComponent(entry.script, entry.template, entry.hasSetup, compName);
                        }
                        if (defaultScript || defaultTemplate) {
                            registerOneComponent(defaultScript, defaultTemplate, defaultHasSetup);
                        }
                    }
                    resolved = true;
                    clearResources();
                    resolveFn();
                }).catch(err => {
                    if (resolved)
                        return;
                    const isOnline = (typeof navigator === 'undefined') ? true : navigator.onLine;
                    const msg = (err && (err.message || '')) + '';
                    const networkLike = err instanceof TypeError || /Failed to fetch|NetworkError|load failed/i.test(msg);
                    if (!isOnline || networkLike) {
                        if (!onlineListener) {
                            onlineListener = () => {
                                if (resolved)
                                    return;
                                if (timer != null) {
                                    clearTimeout(timer);
                                    timer = null;
                                }
                                attempt();
                            };
                            window.addEventListener('online', onlineListener);
                        }
                        const delay = computeDelay(currentN);
                        timer = window.setTimeout(() => attempt(), delay);
                        return;
                    }
                    if (currentN >= retries) {
                        clearResources();
                        rejectFn(err);
                        return;
                    }
                    const delay = computeDelay(currentN);
                    timer = window.setTimeout(() => attempt(), delay);
                });
            };
            const p = new Promise((resolve, reject) => {
                resolveFn = resolve;
                rejectFn = reject;
                attempt();
            }).finally(() => { this._inflightComponentLoads.delete(path); clearResources(); });
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
                                if (el.__x_if_suspended)
                                    return;
                                this._runRefCleanup(el);
                                const stack = [el];
                                while (stack.length) {
                                    const cur = stack.pop();
                                    if (cur.__x_if_suspended)
                                        continue;
                                    const comp = this._getComponentByElement(cur);
                                    if (comp && !comp.isDestroyed) {
                                        _se(() => { this._clearComponentRefs(comp); comp.destroy(); });
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
                                    _se(() => { const ro = target.hasAttribute(STR_READONLY); comp.setFrozen(!!ro); });
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
            if (!FT_EXT_DIRS)
                return null;
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
            if (!FT_EXT_DIRS)
                return () => { };
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
            io.observe(el);
            return () => { io.unobserve(el); };
        }
        _onComponentSourceChanged(el) {
            const src = _tr(el.getAttribute('source'));
            const existing = this._getComponentByElement(el);
            if (!src) {
                if (existing && !existing.isDestroyed) {
                    _se(() => existing.destroy());
                }
                el.innerHTML = '';
                return;
            }
            if (existing && !existing.isDestroyed) {
                _se(() => existing.destroy());
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
                comp._setXInitExpr(opts.xInitExpr);
            }
        }
        _instantiateNamedComponent(el, parentHint) {
            let source = el.__x_mount_source || el.getAttribute('source');
            if (!source)
                return;
            if (el.__x_mount_source)
                delete el.__x_mount_source;
            delete el.__x_saved_attrs;
            let parentComp = parentHint;
            if (!parentComp) {
                let par = el.parentElement;
                while (par && !parentComp) {
                    const maybe = this._getComponentByElement(par);
                    if (maybe)
                        parentComp = maybe;
                    else
                        par = par.parentElement;
                }
            }
            let def = this._getRegisteredComponentDef(source);
            if (!def && parentComp) {
                try {
                    const fn = new Function('ctx', 'with(ctx){return (' + source + ')}');
                    const ctx = parentComp._createContextProxy(undefined, el);
                    const evaluated = fn.call(parentComp.getContext(true), ctx);
                    if (typeof evaluated === 'string' && evaluated) {
                        source = evaluated;
                        def = this._getRegisteredComponentDef(source);
                    }
                }
                catch { }
            }
            if (!def) {
                const name = source.toLowerCase();
                const lazy = this._lazyComponentSources?.get(name);
                if (lazy) {
                    if (lazy.status === LS_PENDING && !lazy.promise) {
                        lazy.status = LS_LOADING;
                        lazy.promise = this._fetchAndEvalComponent(lazy.path)
                            .then(() => { lazy.status = LS_LOADED; })
                            .catch(() => { lazy.status = LS_ERROR; })
                            .finally(() => {
                            if (lazy.status === LS_LOADED) {
                                this._lazyComponentSources?.delete(name);
                            }
                        });
                    }
                    if (lazy.promise) {
                        const elementToRetry = el;
                        const parentToRetry = parentHint;
                        lazy.promise.then(() => {
                            _se(() => {
                                const again = this._getRegisteredComponentDef(source);
                                if (again && elementToRetry.isConnected && !this._getComponentByElement(elementToRetry)) {
                                    this._instantiateNamedComponent(elementToRetry, parentToRetry);
                                }
                            });
                        });
                    }
                }
                return;
            }
            let props = null;
            let dynamicPropObj = null;
            let rawPropExpression = null;
            if (!props)
                props = {};
            const mountProps = el.__x_mount_props;
            if (mountProps && typeof mountProps === 'object') {
                Object.assign(props, mountProps);
                delete el.__x_mount_props;
            }
            const propExpr = this._propExpressions.get(el) || el.getAttribute(attrName('prop'));
            const propBase = attrName('prop');
            const propPrefix = propBase + ':';
            const modifierPropExpressions = {};
            const resolvePropName = (raw) => {
                if (!raw)
                    return raw;
                const lower = raw.toLowerCase();
                const tryMatch = (obj) => {
                    if (!obj)
                        return null;
                    for (const k of Object.keys(obj)) {
                        if (k.toLowerCase() === lower)
                            return k;
                    }
                    return null;
                };
                const fromPropEff = tryMatch(def?.propEffects);
                if (fromPropEff)
                    return fromPropEff;
                if (raw.includes('-')) {
                    return caseKebabToCamel(raw);
                }
                return raw;
            };
            for (const attr of Array.from(el.attributes)) {
                const name = attr.name;
                if (name.startsWith(propPrefix)) {
                    const rawKey = name.substring(propPrefix.length);
                    const key = resolvePropName(rawKey);
                    if (key)
                        modifierPropExpressions[key] = attr.value;
                    el.removeAttribute(name);
                }
            }
            if (propExpr) {
                rawPropExpression = propExpr;
                if (parentComp) {
                    try {
                        const fn = new Function('ctx', 'with(ctx){return (' + propExpr + ')}');
                        const ctx = parentComp.getContext(true);
                        const ctxProxy = parentComp._createContextProxy(undefined, el);
                        dynamicPropObj = fn.call(ctx, ctxProxy);
                    }
                    catch (e) {
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
                            props[k] = dynamicPropObj[k];
                this._propExpressions.set(el, propExpr);
                el.removeAttribute(attrName('prop'));
            }
            if (Object.keys(modifierPropExpressions).length) {
                const evaluated = {};
                for (const [k, expr] of Object.entries(modifierPropExpressions)) {
                    let val;
                    if (parentComp) {
                        try {
                            const fn = new Function('ctx', 'with(ctx){return (' + expr + ')}');
                            const ctx = parentComp.getContext(true);
                            const ctxProxy = parentComp._createContextProxy(undefined, el);
                            val = fn.call(ctx, ctxProxy);
                        }
                        catch (e) {
                            val = undefined;
                        }
                    }
                    else {
                        try {
                            val = new Function('return (' + expr + ')')();
                        }
                        catch {
                            val = undefined;
                        }
                    }
                    evaluated[k] = val;
                    if (!(k in props))
                        props[k] = val;
                }
                const existingDynamic = dynamicPropObj ? { ...dynamicPropObj } : {};
                dynamicPropObj = { ...existingDynamic };
                for (const k in evaluated)
                    if (!(k in existingDynamic))
                        dynamicPropObj[k] = evaluated[k];
                const modifierKeysToAppend = Object.keys(evaluated).filter(k => !(k in existingDynamic));
                if (modifierKeysToAppend.length) {
                    if (rawPropExpression && /}\s*$/.test(rawPropExpression.trim())) {
                        const trimmed = rawPropExpression.trim();
                        const closeIndex = trimmed.lastIndexOf('}');
                        if (closeIndex > -1) {
                            const head = trimmed.slice(0, closeIndex);
                            const needsComma = /{\s*$/.test(head) ? false : true;
                            const appended = modifierKeysToAppend.map(k => `${k}: ${modifierPropExpressions[k]}`).join(', ');
                            rawPropExpression = head + (needsComma ? ', ' : ' ') + appended + '}';
                        }
                    }
                    else {
                        rawPropExpression = '{ ' + modifierKeysToAppend.map(k => `${k}: ${modifierPropExpressions[k]}`).join(', ') + ' }';
                    }
                }
                else if (!rawPropExpression) {
                    const allKeys = Object.keys(modifierPropExpressions);
                    if (allKeys.length)
                        rawPropExpression = '{ ' + allKeys.map(k => `${k}: ${modifierPropExpressions[k]}`).join(', ') + ' }';
                }
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
            if (dynamicPropObj && typeof dynamicPropObj === 'object') {
                for (const k in dynamicPropObj) {
                    baseData[k] = dynamicPropObj[k];
                }
            }
            else {
                for (const k in props) {
                    baseData[k] = props[k];
                }
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
                name: def.name ?? name,
                data: baseData,
                methods: { ...(def.methods || {}), ...(initDef?.methods || {}) },
                computed: { ...(def.computed || {}), ...(initDef?.computed || {}) },
                propEffects: { ...(def.propEffects || {}), ...(initDef?.propEffects || {}) },
                setup: initDef?.setup || def.setup,
                mounted: initDef?.mounted || def.mounted,
                unmounted: initDef?.unmounted || def.unmounted,
                beforeMount: initDef?.beforeMount || def.beforeMount,
                beforeUnmount: initDef?.beforeUnmount || def.beforeUnmount,
                updated: initDef?.updated || def.updated,
                destroyed: initDef?.destroyed || def.destroyed,
                beforeDestroy: initDef?.beforeDestroy || def.beforeDestroy
            };
            const comp = this.createComponent(compDef);
            const lifecycleDirectives = ['mounted', 'unmounted', 'updated', 'before-unmount'];
            for (const lcName of lifecycleDirectives) {
                const attrVal = el.getAttribute(attrName(lcName));
                if (attrVal && parentComp) {
                    comp._registerLifecycleHandler(lcName, attrVal, parentComp);
                    el.removeAttribute(attrName(lcName));
                }
            }
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
            _se(() => { this._discoverNestedNamed(el, comp); });
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
        _setActiveEffect(effect) {
            this._activeEffect = effect;
            _globalActiveEffect = effect;
        }
        _bridgeUtilReactive(prop, obj) {
            if (!isReactive(obj))
                return;
            const control = getReactiveControl(obj);
            if (!control)
                return;
            const prevDep = control.depTracker;
            const prevBase = control.baseChangeListener;
            control.trackerId = prop;
            control.depTracker = (k) => {
                if (this._isInComputedEvaluation && this._computedKeyStack.length) {
                    const current = this._computedKeyStack[this._computedKeyStack.length - 1];
                    let s = this._computedDeps.get(current);
                    if (!s) {
                        s = new Set();
                        this._computedDeps.set(current, s);
                        this._reverseComputedDeps = null;
                    }
                    s.add(prop);
                    this._reverseComputedDeps = null;
                }
                if (prevDep)
                    prevDep(k);
            };
            control.baseChangeListener = (oldVal, newVal) => {
                if (prevBase)
                    prevBase(oldVal, newVal);
                this._onDataChange(prop);
            };
            setReactiveControl(obj, control);
        }
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
                element.toggleAttribute(attributeName, boolVal);
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
                    if (elAny[propName] === normalized)
                        return;
                    try {
                        elAny[propName] = normalized;
                    }
                    catch {
                        _se(() => element.setAttribute(attributeName, normalized));
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
            const superColon = ':';
            const namesOut = [];
            let hasTextOrHtml = false;
            let forName = null;
            const names = el.getAttributeNames();
            for (let i = 0; i < names.length; i++) {
                const name = names[i];
                const isDir = name.startsWith(prefixDash) || name.startsWith(prefixColon) || name.startsWith('@') || (name.startsWith(superColon) && name.length > 1);
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
                this._scheduleRender();
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
            this.name = 'ReactiveComponent';
            this._propUpdateActive = false;
            this._runningPropEffect = false;
            this._element = null;
            this._isBound = false;
            this._isMounted = false;
            this._isDestroyed = false;
            this._beforeMountCalled = false;
            this._children = [];
            this._parent = null;
            this._isInlineXData = false;
            this._closures = {};
            this._computed = {};
            this._propEffects = {};
            this._computedCache = new Map();
            this._computedDeps = new Map();
            this._reverseComputedDeps = null;
            this._computedRefControls = new Map();
            this._computedKeyStack = [];
            this._isInComputedEvaluation = false;
            this._isInMethodExecution = false;
            this._allEffects = new Set();
            this._directives = new Map();
            this._cleanupFunctions = new Set();
            this._directiveAbort = new AbortController();
            this._invokerResources = new Map();
            this._targetIds = new WkMap();
            this._targetSeq = 0;
            this._fetchCounter = 0;
            this._contextBase = null;
            this._signalHandlers = new Map();
            this._lifecycleHandlers = new Map();
            this._isSealed = false;
            this._isFrozen = false;
            this._sealedBeforeFreeze = null;
            this._isMutationEnabled = true;
            this._deferEffectExecution = false;
            this._effectsToRun = new Set();
            this._changedProperties = new Set();
            this._currentInvoker = null;
            this._expressionCache = new Map();
            this._propertyDependencies = new Map();
            this._activeEffect = null;
            this._suspendedEffects = new WeakSet();
            this._renderScheduled = false;
            this._nextTickQueue = [];
            this._changeFrameId = null;
            this._renderFrameId = null;
            this._initialClassSets = new WkMap();
            this._rawData = {};
            this._cachedMethodContext = null;
            this._cachedMethodContextSpecials = null;
            this._propParent = null;
            this._callLifecycleHook = (hookName) => {
                const hook = this._lifecycle[hookName];
                if (this._beforeMountCalled && hookName === 'beforeMount') {
                    return;
                }
                if (typeof hook === 'function') {
                    this._safeExecute(() => this._runWithGlobalInterception(hook, []));
                    if (hookName === 'beforeMount') {
                        this._beforeMountCalled = true;
                    }
                }
                const hookToDirective = {
                    'mounted': 'mounted',
                    'unmounted': 'unmounted',
                    'updated': 'updated',
                    'beforeUnmount': 'before-unmount'
                };
                const directiveName = hookToDirective[hookName];
                if (directiveName) {
                    this._fireLifecycleHandlers(directiveName);
                }
                if (hookName === 'mounted' && this._xInitExpr) {
                    const expr = this._xInitExpr;
                    if (this.isDestroyed || !this.element || !this.element.isConnected)
                        return;
                    const runner = () => {
                        const trimmed = _tr(expr);
                        const arrow = this._extractArrowFunction(trimmed);
                        const ctx = this._createMethodContext();
                        if (arrow) {
                            const fn = this._compileArrowForEvent(arrow.paramsList, arrow.body, arrow.isBlock);
                            const args = arrow.paramsList.length ? [this.element] : [];
                            const out = fn.call(this._createContextProxy(undefined, this.element || undefined), ctx, ...args.slice(0, arrow.paramsList.length));
                            if (typeof out === 'function')
                                this._addCleanupFunction(out);
                            return;
                        }
                        const compiled = this._createEvaluator(trimmed, trimmed.indexOf(';') !== -1);
                        const result = compiled.call(ctx, this._createContextProxy(undefined, this.element || undefined));
                        if (typeof result === 'function')
                            this._addCleanupFunction(result);
                    };
                    this._safeExecute(() => this._runWithGlobalInterception(runner, []));
                }
            };
            this._addCleanupFunction = (fn) => {
                if (typeof fn !== 'function')
                    return undefined;
                const wrapped = () => {
                    _se(fn);
                    this._cleanupFunctions.delete(wrapped);
                };
                this._cleanupFunctions.add(wrapped);
                return () => { this._cleanupFunctions.delete(wrapped); };
            };
            if (def.name)
                this.name = def.name;
            this._id = id;
            this._framework = framework;
            this._closures = def.closures || {};
            this._originalMethods = def.methods || {};
            this._computed = this._bindFunctionMap(def.computed || {}, 'computed');
            this._propEffects = def.propEffects || {};
            if (this._propEffects && Object.keys(this._propEffects).length) {
                this._propEffects = this._bindFunctionMap(this._propEffects, 'prop');
            }
            this._lifecycle = {
                mounted: def.mounted,
                unmounted: def.unmounted || def.destroyed,
                updated: def.updated,
                beforeMount: def.beforeMount,
                beforeUnmount: def.beforeUnmount || def.beforeDestroy,
                setup: def.setup
            };
            this._rawData = this._cloneData(def.data || {});
            this._data = this._createReactiveData(this._rawData || {});
            try {
                const keys = Object.keys(this._rawData || {});
                for (let i = 0; i < keys.length; i++) {
                    const k = keys[i];
                    const v = this._rawData[k];
                    if (isReactive(v))
                        this._bridgeUtilReactive(k, v);
                }
            }
            catch { }
            this._methods = this._bindFunctionMap(this._originalMethods, 'methods');
        }
        _cloneData(value, seen) {
            if (value === null || typeof value !== 'object')
                return value;
            if (isReactive(value))
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
        _triggerFullUpdate() {
            if (!this.isBound || this._isSealed)
                return;
            const self = this;
            if (self._changeFrameId != null) {
                cancelAnimationFrame(self._changeFrameId);
                self._changeFrameId = null;
            }
            if (FT_C)
                self._computedCache.clear();
            const effectsToRun = self._effectsToRun;
            for (const [, effects] of self._propertyDependencies) {
                for (const effect of effects)
                    effectsToRun.add(effect);
            }
            self._changeFrameId = requestAnimationFrame(() => {
                self._changeFrameId = null;
                if (self.isDestroyed || self._isSealed)
                    return;
                for (const effect of effectsToRun)
                    self._safeExecute(effect);
                effectsToRun.clear();
                self._scheduleRender();
                self._callLifecycleHook('updated');
            });
        }
        _buildReverseComputedDeps() {
            const reverse = new Map();
            for (const [compKey, baseDeps] of this._computedDeps) {
                for (const baseProp of baseDeps) {
                    let set = reverse.get(baseProp);
                    if (!set) {
                        set = new Set();
                        reverse.set(baseProp, set);
                    }
                    set.add(compKey);
                }
            }
            return reverse;
        }
        _invalidateReverseComputedDeps() {
            this._reverseComputedDeps = null;
        }
        _onDataChange(_property) {
            if (!this.isBound || this._isMutationEnabled === false)
                return;
            const self = this;
            const directDeps = self._propertyDependencies.get(_property);
            if (directDeps) {
                const effectsToRun = self._effectsToRun;
                const suspended = self._suspendedEffects;
                for (const effect of directDeps) {
                    if (!suspended.has(effect))
                        effectsToRun.add(effect);
                }
            }
            self._changedProperties.add(_property);
            if (self._deferEffectExecution) {
                self._invalidateAffectedComputed();
                return;
            }
            if (self._changeFrameId != null)
                return;
            self._changeFrameId = requestAnimationFrame(() => {
                self._changeFrameId = null;
                if (self.isDestroyed || self._isSealed)
                    return;
                self._invalidateAffectedComputed();
                const effectsToRun = self._effectsToRun;
                if (effectsToRun.size > 0) {
                    for (const effect of effectsToRun)
                        self._safeExecute(effect);
                    effectsToRun.clear();
                    self._callLifecycleHook('updated');
                }
            });
        }
        _invalidateAffectedComputed() {
            if (!FT_C || !this._computedDeps.size || !this._changedProperties.size) {
                this._changedProperties.clear();
                return;
            }
            if (!this._reverseComputedDeps) {
                this._reverseComputedDeps = this._buildReverseComputedDeps();
            }
            const reverse = this._reverseComputedDeps;
            const affectedComputed = new Set();
            const effectsToRun = this._effectsToRun;
            const toProcess = Array.from(this._changedProperties);
            this._changedProperties.clear();
            let i = 0;
            while (i < toProcess.length) {
                const prop = toProcess[i++];
                const affectedByProp = reverse.get(prop);
                if (affectedByProp) {
                    for (const compKey of affectedByProp) {
                        if (!affectedComputed.has(compKey)) {
                            affectedComputed.add(compKey);
                            toProcess.push(compKey);
                        }
                    }
                }
            }
            for (const compKey of affectedComputed) {
                const compEffects = this._propertyDependencies.get(compKey);
                if (compEffects) {
                    for (const effect of compEffects)
                        effectsToRun.add(effect);
                }
                const ctrl = this._computedRefControls.get(compKey);
                if (ctrl && typeof ctrl.depTracker === 'function') {
                    try {
                        ctrl.depTracker(compKey);
                    }
                    catch { }
                }
                this._computedCache.delete(compKey);
            }
        }
        _compileInterceptedWrapper(fn) {
            try {
                const src = String(fn);
                if (!/\[native code\]/.test(src)) {
                    let body = src.trim();
                    if (!/^function[\s\(]/.test(body) && !/^[\w\$_][\w\d\$_]*\s*=>/.test(body) && !/^\(.*?\)\s*=>/.test(body)) {
                        body = 'function ' + body;
                    }
                    const trySrc = 'with(ctx){ const f = (' + body + '); return f.apply(thisArg, argsArray); }';
                    const wrapper = new Function('thisArg', 'argsArray', 'ctx', trySrc);
                    return { wrapper, original: fn };
                }
            }
            catch {
            }
            return { wrapper: null, original: fn };
        }
        _execWithWrapper(wrapper, original, args) {
            const thisArg = this._createMethodContext();
            if (wrapper) {
                try {
                    return wrapper.call(thisArg, thisArg, args, this._createContextProxy(undefined, undefined));
                }
                catch {
                }
            }
            return this._safeExecute(() => original.apply(thisArg, args));
        }
        _bindFunctionMap(src, kind) {
            const out = {};
            for (const key in (src || {})) {
                const original = src[key];
                if (kind === 'computed') {
                    if (isComputedRef(original)) {
                        const ctrl = getReactiveControl(original);
                        if (ctrl)
                            this._computedRefControls.set(key, ctrl);
                        out[key] = (() => {
                            return original.value;
                        });
                    }
                    else {
                        out[key] = () => {
                            const ctx = this._createMethodContext();
                            return original.call(ctx);
                        };
                    }
                }
                else {
                    const { wrapper, original: orig } = this._compileInterceptedWrapper(original);
                    const isProp = kind === 'prop';
                    const invokerKey = isProp ? `prop:${key}` : key;
                    out[key] = (...args) => {
                        const prevInv = this._currentInvoker;
                        const prevMethod = isProp ? false : this._isInMethodExecution;
                        const prevProp = isProp ? this._runningPropEffect : false;
                        this._currentInvoker = invokerKey;
                        if (isProp)
                            this._runningPropEffect = true;
                        else
                            this._isInMethodExecution = true;
                        try {
                            return this._execWithWrapper(wrapper, orig, args);
                        }
                        finally {
                            this._currentInvoker = prevInv;
                            if (isProp)
                                this._runningPropEffect = prevProp;
                            else
                                this._isInMethodExecution = prevMethod;
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
            this._reverseComputedDeps = null;
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
            const activeEff = _globalActiveEffect || this._activeEffect;
            if (!activeEff)
                return;
            activeEff._hasDeps = true;
            let deps = this._propertyDependencies.get(propKey);
            if (!deps) {
                deps = new Set();
                this._propertyDependencies.set(propKey, deps);
            }
            deps.add(activeEff);
            const stackLen = this._computedKeyStack.length;
            if (this._isInComputedEvaluation && stackLen) {
                const current = this._computedKeyStack[stackLen - 1];
                let s = this._computedDeps.get(current);
                if (!s) {
                    s = new Set();
                    this._computedDeps.set(current, s);
                }
                const prevSize = s.size;
                s.add(propKey);
                if (s.size !== prevSize)
                    this._reverseComputedDeps = null;
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
            _se(() => this._parseDirectives(this._element));
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
            if (this._lifecycle.setup) {
                this._safeExecute(() => this._runWithGlobalInterception(this._lifecycle.setup, []));
            }
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
        _setXInitExpr(expr) { this._xInitExpr = expr || undefined; }
        _registerLifecycleHandler(hookName, expr, parent) {
            let handlers = this._lifecycleHandlers.get(hookName);
            if (!handlers) {
                handlers = [];
                this._lifecycleHandlers.set(hookName, handlers);
            }
            handlers.push({ expr, parent });
        }
        _fireLifecycleHandlers(directiveName) {
            const handlers = this._lifecycleHandlers.get(directiveName);
            if (!handlers || !handlers.length)
                return;
            const self = this;
            for (const { expr, parent } of handlers) {
                _se(() => {
                    try {
                        const fn = new Function('ctx', `with(ctx){ ${expr} }`);
                        const ctx = parent.getContext(true);
                        const ctxProxy = parent._createContextProxy(undefined, self._element || undefined);
                        ctxProxy.$component = self._createMethodContext(true);
                        fn.call(ctx, ctxProxy);
                    }
                    catch (e) {
                        console.error('Lifecycle handler error:', e);
                    }
                });
            }
        }
        _runWithGlobalInterception(fn, args, skipExtract) {
            const thisArg = this._createMethodContext();
            if (skipExtract) {
                if (typeof fn !== 'function') {
                    console.log('Attempted to call a non-function:', fn);
                    return;
                }
                return fn.apply(thisArg, args);
            }
            try {
                const src = String(fn);
                if (!/\[native code\]/.test(src)) {
                    let body = src.trim();
                    if (!/^function[\s\(]/.test(body) && !/^[\w\$_][\w\d\$_]*\s*=>/.test(body) && !/^\(.*?\)\s*=>/.test(body)) {
                        body = 'function ' + body;
                    }
                    const trySrc = 'with(ctx){ const f = (' + body + '); return f.apply(thisArg, argsArray); }';
                    const wrapper = new Function('thisArg', 'argsArray', 'ctx', trySrc);
                    try {
                        return wrapper.call(thisArg, thisArg, args, this._createContextProxy(undefined, undefined));
                    }
                    catch (execErr) {
                        return fn.apply(thisArg, args);
                    }
                }
            }
            catch {
            }
            if (typeof fn !== 'function') {
                console.log('Attempted to call a non-function:', fn);
                return;
            }
            return fn.apply(thisArg, args);
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
            _se(() => self._directiveAbort.abort());
            self._directiveAbort = new AbortController();
            self._abortInvokerResources();
            self._runCleanupCallbacks();
            self._computedCache.clear();
            self._expressionCache.clear();
            self._propertyDependencies.clear();
            if (self._propParent && self._propEffect) {
                for (const deps of self._propParent._propertyDependencies.values()) {
                    deps.delete(self._propEffect);
                }
            }
            if (self._element)
                self._framework._unregisterElement(self._element);
            self._framework._clearComponentRefs(self);
            if (self._changeFrameId != null) {
                cancelAnimationFrame(self._changeFrameId);
                self._changeFrameId = null;
            }
            if (self._renderFrameId != null) {
                cancelAnimationFrame(self._renderFrameId);
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
            self._signalHandlers.clear();
            self._allEffects.clear();
            self._computedDeps.clear();
            self._computedRefControls.clear();
            self._reverseComputedDeps = null;
            self._lifecycleHandlers.clear();
            self._contextBase = null;
        }
        _onSignal(name, handler) {
            let set = this._signalHandlers.get(name);
            if (!set) {
                set = new Set();
                this._signalHandlers.set(name, set);
            }
            set.add(handler);
        }
        _offSignal(name, handler) {
            const set = this._signalHandlers.get(name);
            if (set) {
                set.delete(handler);
                if (set.size === 0)
                    this._signalHandlers.delete(name);
            }
        }
        _emitSignal(name, payload) {
            const evt = { name, payload, _stopped: false, stopPropagation() { this._stopped = true; } };
            let cur = this;
            while (cur) {
                const set = cur._signalHandlers.get(name);
                if (set && set.size) {
                    for (const h of Array.from(set)) {
                        try {
                            h.call(cur._createMethodContext(true), evt);
                        }
                        catch { }
                        if (evt._stopped)
                            return;
                    }
                }
                cur = cur._parent;
            }
        }
        _initReactiveProps(expr, parent) {
            if (!expr || !parent)
                return;
            this._propParent = parent;
            const el = this._element;
            let evalFn;
            try {
                evalFn = new Function('ctx', 'with(ctx){return (' + expr + ')}');
            }
            catch {
                return;
            }
            const lastPropValues = {};
            const lastPropVersions = {};
            let isFirstRun = true;
            const update = () => {
                parent._setActiveEffect(update);
                let obj;
                try {
                    const ctx = parent._createContextProxy(undefined, el);
                    obj = evalFn.call(parent.getContext(true), ctx);
                }
                catch {
                    obj = null;
                }
                parent._setActiveEffect(null);
                if (obj && typeof obj === 'object') {
                    this._data.$props = this._data.$props || {};
                    const autoMerge = this._framework._autoMergeProps;
                    const effectsToCall = [];
                    for (const k in obj) {
                        const v = obj[k];
                        const oldValue = lastPropValues[k];
                        this._data.$props[k] = v;
                        let hasChanged = isFirstRun || lastPropValues[k] !== v;
                        const isObjProp = v !== null && typeof v === 'object';
                        if (!hasChanged && isObjProp) {
                            const currentVersion = _getDeepVersion(v);
                            const lastVersion = lastPropVersions[k] ?? -1;
                            hasChanged = currentVersion !== lastVersion;
                        }
                        if (!hasChanged)
                            continue;
                        lastPropValues[k] = v;
                        const eff = k in this._propEffects ? this._propEffects[k] : undefined;
                        if (eff && !this._isSealed) {
                            effectsToCall.push({ eff, newVal: v, oldVal: oldValue, key: k, isObjProp });
                        }
                        else if (autoMerge) {
                            this._propUpdateActive = true;
                            this._data[k] = v;
                            this._propUpdateActive = false;
                            if (isObjProp) {
                                lastPropVersions[k] = _getDeepVersion(v);
                            }
                        }
                        else {
                            this._onDataChange('$props');
                            if (isObjProp) {
                                lastPropVersions[k] = _getDeepVersion(v);
                            }
                        }
                    }
                    if (effectsToCall.length > 0) {
                        this._deferEffectExecution = true;
                        try {
                            for (const { eff, newVal, oldVal, key, isObjProp } of effectsToCall) {
                                const prevFlag = this._runningPropEffect;
                                this._runningPropEffect = true;
                                this._propUpdateActive = true;
                                try {
                                    eff(newVal, oldVal);
                                }
                                finally {
                                    this._runningPropEffect = prevFlag;
                                    this._propUpdateActive = false;
                                }
                                if (isObjProp) {
                                    lastPropVersions[key] = _getDeepVersion(newVal);
                                }
                            }
                        }
                        finally {
                            this._deferEffectExecution = false;
                            const effectsToRun = this._effectsToRun;
                            if (effectsToRun.size > 0) {
                                for (const effect of effectsToRun)
                                    this._safeExecute(effect);
                                effectsToRun.clear();
                                this._callLifecycleHook('updated');
                            }
                        }
                    }
                    isFirstRun = false;
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
                const refAttr = attrName('ref');
                const isBoundToComponent = !isRoot && this._framework._getComponentByElement(el);
                if (isBoundToComponent) {
                    if (el.hasAttribute(refAttr)) {
                        self._bindRefDirective(el, el.getAttribute(refAttr) || '');
                        el.removeAttribute(refAttr);
                    }
                    return false;
                }
                if (!isRoot && el.hasAttribute(attrName('data'))) {
                    return false;
                }
                const isComponentTag = el[STR_TAGNAME] === 'COMPONENT';
                let directiveNames;
                let hasTextOrHtml;
                let forName;
                const saved = el.__x_saved_attrs;
                if (saved && saved.length > 0) {
                    for (const { name, value } of saved) {
                        el.setAttribute(name, value);
                    }
                    directiveNames = saved.map(a => a.name);
                    hasTextOrHtml = directiveNames.some(n => n === attrName('text') || n === attrName('html'));
                    forName = directiveNames.find(n => n === attrName('for')) || null;
                }
                else {
                    const scan = self._scanDirectiveAttrs(el);
                    directiveNames = scan.names;
                    hasTextOrHtml = scan.hasTextOrHtml;
                    forName = scan.forName;
                    if (directiveNames.length > 0) {
                        const toSave = [];
                        for (const name of directiveNames) {
                            toSave.push({ name, value: el.getAttribute(name) || '' });
                        }
                        el.__x_saved_attrs = toSave;
                    }
                }
                if (directiveNames.length > 0) {
                    processedElements++;
                    if (forName) {
                        self._bindDirective(el, forName, el.getAttribute(forName) || '');
                        return false;
                    }
                    const priorityAttrs = [];
                    const otherAttrs = [];
                    for (const attr of directiveNames) {
                        if (attr.startsWith(PFX + '-transition') || attr.startsWith(PFX + ':transition')) {
                            priorityAttrs.push(attr);
                        }
                        else {
                            otherAttrs.push(attr);
                        }
                    }
                    for (const attr of priorityAttrs) {
                        self._bindDirective(el, attr, el.getAttribute(attr) || '');
                    }
                    for (const attr of otherAttrs) {
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
            if (!FT_EXT_DIRS)
                return;
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
        _normalizeTemplateElement(element, directiveName) {
            if (element[STR_TAGNAME] !== STR_TEMPLATE)
                return element;
            const type = directiveName.slice(PFX.length + 1);
            if (type === 'for' || type === 'if' || type === 'else-if' || type === 'else')
                return element;
            const template = element;
            const content = template.content;
            const children = Array.from(content.children);
            let targetElement;
            if (children.length === 1) {
                targetElement = children[0].cloneNode(true);
            }
            else {
                targetElement = d.createElement('div');
                targetElement.style.setProperty(STR_DISPLAY, STR_CONTENTS, 'important');
                targetElement.appendChild(content.cloneNode(true));
            }
            for (const attr of Array.from(template.attributes)) {
                if (attr.name === directiveName)
                    continue;
                targetElement.setAttribute(attr.name, attr.value);
            }
            template.parentNode?.insertBefore(targetElement, template);
            template.parentNode?.removeChild(template);
            this.framework._discoverNested(targetElement, this);
            this.framework._processPending();
            this._parseDirectives(targetElement);
            return targetElement;
        }
        _bindDirective(element, directiveName, expression) {
            const self = this;
            element = self._normalizeTemplateElement(element, directiveName);
            const isAtEvent = directiveName.startsWith('@');
            const isSuperShortBind = directiveName.startsWith(':');
            if (isSuperShortBind) {
                const attr = directiveName.slice(1);
                if (attr) {
                    element.removeAttribute(directiveName);
                    return self._bindAttributeDirective(element, attr, expression);
                }
            }
            const isShortBind = directiveName.startsWith(PFX + ':');
            const type = isAtEvent ? ('on:' + directiveName.slice(1)) : directiveName.slice(PFX.length + 1);
            if (!isAtEvent && (isShortBind || type === 'class' || type === STR_STYLE)) {
                element.removeAttribute(directiveName);
                return self._bindAttributeDirective(element, type, expression);
            }
            if (!isAtEvent && (type === 'text' || type === 'html' || type === 'show')) {
                return self._bindSimpleDirective(element, expression, type, directiveName);
            }
            if (!isAtEvent && (type === 'else' || type === 'else-if')) {
                return;
            }
            if (!isAtEvent && element[STR_TAGNAME] === 'COMPONENT') {
                const isLifecycle = type === 'mounted' || type === 'unmounted' || type === 'updated' || type === 'before-unmount';
                const isProp = type === 'prop' || type.startsWith('prop:');
                if (isLifecycle || isProp) {
                    return;
                }
            }
            element.removeAttribute(directiveName);
            if (FT_VT && !isAtEvent && (type === 'transition' || type.startsWith('transition.'))) {
                let modifiers;
                if (type.startsWith('transition.')) {
                    const modList = type.slice('transition.'.length).split('.').filter(Boolean);
                    modifiers = modList.reduce((acc, m) => { acc[m] = true; return acc; }, {});
                }
                return self._bindTransitionDirective(element, expression, undefined, modifiers);
            }
            if (!isAtEvent && type === 'ref')
                return self._bindRefDirective(element, expression);
            if (!isAtEvent && type === 'if')
                return self._bindIfDirective(element, expression);
            if (!isAtEvent && type === 'model')
                return self._bindModelDirective(element, expression);
            if (type === 'for')
                return self._bindForDirective(element, expression);
            if (isAtEvent || type.indexOf(':') > -1) {
                const [prefix, rest] = type.split(':', 2);
                const [suffix, ...mods] = rest.split('.');
                const modifiers = mods.reduce((acc, m) => { if (m)
                    acc[m] = true; return acc; }, {});
                if (prefix === 'on') {
                    const customDirective = self.framework._getCustomDirective(suffix);
                    return customDirective
                        ? self._bindCustomDirective(element, suffix, expression, customDirective, modifiers)
                        : self._bindEventDirective(element, suffix, expression, modifiers);
                }
                if (prefix === 'transition' && FT_VT) {
                    const map = {
                        'enter': 'enter', 'enter-from': 'enterFrom', 'enter-to': 'enterTo',
                        'leave': 'leave', 'leave-from': 'leaveFrom', 'leave-to': 'leaveTo',
                        'enter-start': 'enterFrom', 'enter-end': 'enterTo',
                        'leave-start': 'leaveFrom', 'leave-end': 'leaveTo',
                    };
                    return self._bindTransitionDirective(element, expression, map[suffix] || 'toggle', modifiers);
                }
                if (prefix === 'intersect' && FT_EXT_DIRS) {
                    return self._bindIntersectDirective(element, expression, modifiers, suffix);
                }
                return self._bindAttributeDirective(element, suffix, expression);
            }
        }
        _bindRefDirective(element, expression) {
            if (!FT_EXT_DIRS)
                return;
            const refName = _tr(expression);
            if (!refName)
                return;
            const self = this;
            const lazyRef = {
                _element: element,
                _cachedProxy: null,
                _framework: self.framework,
                get _target() {
                    const childComponent = this._framework._getComponentByElement(this._element);
                    if (childComponent) {
                        if (!this._cachedProxy) {
                            this._cachedProxy = childComponent._createContextProxy();
                        }
                        return this._cachedProxy;
                    }
                    return this._element;
                }
            };
            const refProxy = new Proxy(lazyRef, {
                get(target, prop) {
                    if (prop === '_isLazyRef')
                        return true;
                    const resolved = target._target;
                    const value = resolved[prop];
                    if (typeof value === 'function') {
                        return value.bind(resolved);
                    }
                    return value;
                },
                set(target, prop, value) {
                    const resolved = target._target;
                    resolved[prop] = value;
                    return true;
                },
                has(target, prop) {
                    if (prop === '_isLazyRef')
                        return true;
                    return prop in target._target;
                }
            });
            self.framework._registerComponentRef(self, refName, refProxy);
            const dir = { type: 'ref', expression };
            this._addDirective(element, dir);
        }
        _getSharedRef(refName) {
            if (!refName || !FT_EXT_DIRS)
                return undefined;
            let ref = this.framework._getComponentRefs(this, refName);
            if (!ref && this._parent) {
                let parent = this._parent;
                while (parent) {
                    ref = parent.framework._getComponentRefs(parent, refName);
                    if (ref || !parent._parent)
                        break;
                    parent = parent._parent;
                }
            }
            if (ref) {
                if (ref.size > 1) {
                    const arr = [];
                    ref.forEach((el) => arr.push(el));
                    return arr;
                }
                else {
                    return ref.values().next().value;
                }
            }
        }
        _bindIntersectDirective(element, expression, modifiers, phase) {
            if (!FT_EXT_DIRS)
                return;
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
            this._addCleanupFunction(() => { _se(unobserve); });
        }
        _createEffect(updateFn, directiveRef) {
            const effect = () => {
                this._activeEffect = effect;
                _globalActiveEffect = effect;
                try {
                    updateFn();
                }
                finally {
                    this._activeEffect = null;
                    _globalActiveEffect = null;
                }
            };
            effect();
            this._allEffects.add(effect);
            if (XTOOL_ENABLE_STATIC_DIRECTIVES && directiveRef && directiveRef._static === undefined) {
                directiveRef._static = !effect._hasDeps;
            }
            return effect;
        }
        _bindTransitionDirective(element, expression, part, modifiers) {
            if (!FT_EXT_DIRS || !FT_VT)
                return;
            let config = element.__x_transition || null;
            const trimmed = _tr(expression);
            if (trimmed) {
                try {
                    const isObject = trimmed.startsWith('{');
                    const isQuoted = (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
                        (trimmed.startsWith('"') && trimmed.endsWith('"'));
                    const evalExpr = (isObject || isQuoted) ? trimmed : `\`${trimmed}\``;
                    const evalFn = this._createElementEvaluator(evalExpr, element);
                    const val = this._safeExecute(() => evalFn());
                    if (!config)
                        config = {};
                    if (val && typeof val === 'object') {
                        for (const k in val)
                            config[k] = val[k];
                    }
                    else if (typeof val === 'string') {
                        if (part)
                            config[part] = val;
                        else
                            config.toggle = val;
                    }
                }
                catch { }
            }
            if (modifiers && (modifiers.after || modifiers.end)) {
                const exprStr = trimmed;
                if (exprStr) {
                    const runExpr = this._compileHandler(exprStr, element, (payload) => [payload, element]);
                    const call = (payload) => { if (runExpr)
                        this._safeExecute(() => runExpr(payload)); };
                    if (part === 'enter' || part === 'enterFrom' || part === 'enterTo')
                        config.afterEnterRunner = call;
                    else if (part === 'leave' || part === 'leaveFrom' || part === 'leaveTo')
                        config.afterLeaveRunner = call;
                    else
                        config.afterRunner = call;
                }
            }
            if (!config)
                config = {};
            element.__x_transition = config;
            this._addDirective(element, { type: 'transition', expression });
        }
        _applyShowWithTransition(el, show, originalDisplay, onDone) {
            if (!FT_EXT_DIRS || !FT_VT) {
                if (show) {
                    if (originalDisplay)
                        el.style.setProperty('display', originalDisplay, 'important');
                    else
                        el.style.removeProperty('display');
                }
                else {
                    el.style.setProperty('display', STR_NONE, 'important');
                }
                if (onDone)
                    onDone();
                return;
            }
            const cfg = el.__x_transition;
            const imp = 'important';
            if (!cfg) {
                if (show) {
                    if (originalDisplay)
                        el.style.setProperty('display', originalDisplay, imp);
                    else
                        el.style.removeProperty('display');
                }
                else {
                    el.style.setProperty('display', STR_NONE, imp);
                }
                if (onDone)
                    onDone();
                return;
            }
            const prev = el.__x_t;
            if (prev && typeof prev.cancel === 'function') {
                prev.cancel();
            }
            const duration = typeof cfg.duration === 'number' ? cfg.duration : 150;
            const easing = typeof cfg.easing === 'string' ? cfg.easing : 'ease';
            const add = (cls) => { if (!cls)
                return; cls.split(/\s+/).forEach(c => c && el.classList.add(c)); };
            const rm = (cls) => { if (!cls)
                return; cls.split(/\s+/).forEach(c => c && el.classList.remove(c)); };
            const effectiveMs = (fallbackMs) => fallbackMs;
            const finishers = [];
            const addFinish = (cb) => finishers.push(cb);
            const cleanup = () => { while (finishers.length) {
                _se(() => finishers.pop()());
            } };
            const waitEnd = (fallbackMs, done) => {
                let ended = false;
                const off = () => {
                    if (ended)
                        return;
                    ended = true;
                    done();
                    cleanup();
                };
                const onEnd = () => off();
                el.addEventListener('transitionend', onEnd, { once: true, capture: true });
                el.addEventListener('animationend', onEnd, { once: true, capture: true });
                const to = setTimeout(off, fallbackMs + 50);
                addFinish(() => {
                    _se(() => {
                        el.removeEventListener('transitionend', onEnd, { capture: true });
                        el.removeEventListener('animationend', onEnd, { capture: true });
                    });
                    clearTimeout(to);
                });
            };
            const invokeAfter = (phase, msUsed) => {
                const payload = { el, phase, config: { ...cfg, duration: msUsed ?? effectiveMs(duration), easing } };
                try {
                    if (phase === 'enter') {
                        if (typeof cfg.afterEnterRunner === 'function')
                            cfg.afterEnterRunner(payload);
                        else if (typeof cfg.afterRunner === 'function')
                            cfg.afterRunner(payload);
                    }
                    else {
                        if (typeof cfg.afterLeaveRunner === 'function')
                            cfg.afterLeaveRunner(payload);
                        else if (typeof cfg.afterRunner === 'function')
                            cfg.afterRunner(payload);
                    }
                }
                catch { }
            };
            const startClassBased = (phase) => {
                const enter = phase === 'enter';
                const A = enter ? cfg.enter : cfg.leave;
                const F = enter ? cfg.enterFrom : cfg.leaveFrom;
                const T = enter ? cfg.enterTo : cfg.leaveTo;
                if (enter) {
                    if (originalDisplay)
                        el.style.setProperty('display', originalDisplay, imp);
                    else
                        el.style.removeProperty('display');
                }
                if (!A && !F && !T)
                    return false;
                add(A);
                add(F);
                el.offsetWidth;
                rm(F);
                add(T);
                const ms = effectiveMs(duration);
                waitEnd(ms, () => {
                    rm(A);
                    rm(T);
                    if (!enter)
                        el.style.setProperty('display', STR_NONE, imp);
                    if (onDone)
                        onDone();
                    invokeAfter(phase, ms);
                });
                el.__x_t = { cancel: () => { rm(A); rm(F); rm(T); if (!enter)
                        el.style.setProperty('display', STR_NONE, imp); if (onDone)
                        onDone(); } };
                return true;
            };
            const startStyleFade = (phase) => {
                const enter = phase === 'enter';
                const prevTransition = el.style.transition;
                const prevOpacity = el.style.opacity;
                if (enter) {
                    if (originalDisplay)
                        el.style.setProperty('display', originalDisplay, imp);
                    else
                        el.style.removeProperty('display');
                    el.style.setProperty('opacity', '0', imp);
                }
                else {
                    el.style.setProperty('opacity', '1', imp);
                }
                el.offsetWidth;
                const ms = effectiveMs(duration);
                el.style.setProperty('transition', `opacity ${ms}ms ${easing}`, imp);
                if (enter)
                    el.style.setProperty('opacity', '1', imp);
                else
                    el.style.setProperty('opacity', '0', imp);
                waitEnd(ms, () => {
                    if (prevTransition)
                        el.style.setProperty('transition', prevTransition, imp);
                    else
                        el.style.removeProperty('transition');
                    if (prevOpacity)
                        el.style.setProperty('opacity', prevOpacity, imp);
                    else
                        el.style.removeProperty('opacity');
                    if (!enter)
                        el.style.setProperty('display', STR_NONE, imp);
                    if (onDone)
                        onDone();
                    invokeAfter(phase, ms);
                });
                el.__x_t = { cancel: () => { if (prevTransition)
                        el.style.setProperty('transition', prevTransition, imp);
                    else
                        el.style.removeProperty('transition'); if (prevOpacity)
                        el.style.setProperty('opacity', prevOpacity, imp);
                    else
                        el.style.removeProperty('opacity'); if (!enter)
                        el.style.setProperty('display', STR_NONE, imp); if (onDone)
                        onDone(); } };
            };
            if (typeof cfg.toggle === 'string') {
                if (show) {
                    if (originalDisplay)
                        el.style.setProperty('display', originalDisplay, imp);
                    else
                        el.style.removeProperty('display');
                    add(cfg.toggle);
                    const ms = effectiveMs(duration);
                    waitEnd(ms, () => { if (onDone)
                        onDone(); invokeAfter('enter', ms); });
                    el.__x_t = { cancel: () => { if (onDone)
                            onDone(); } };
                }
                else {
                    rm(cfg.toggle);
                    const ms = effectiveMs(duration);
                    waitEnd(ms, () => { el.style.setProperty('display', STR_NONE, imp); if (onDone)
                        onDone(); invokeAfter('leave', ms); });
                    el.__x_t = { cancel: () => { el.style.setProperty('display', STR_NONE, imp); if (onDone)
                            onDone(); } };
                }
                return;
            }
            if (show) {
                if (!startClassBased('enter'))
                    startStyleFade('enter');
            }
            else {
                if (!startClassBased('leave'))
                    startStyleFade('leave');
            }
        }
        _bindSimpleDirective(element, expression, type, directiveName) {
            if (type === 'class' || type === STR_STYLE) {
                return this._bindAttributeDirective(element, type, expression);
            }
            const evaluator = this._createElementEvaluator(expression, element);
            let isDirty = true;
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
                        if (_prevShown === next) {
                            return;
                        }
                        _prevShown = next;
                        this._applyShowWithTransition(el, next, originalDisplay);
                        break;
                }
                if (isDirty && directiveName) {
                    element.removeAttribute(directiveName);
                    isDirty = false;
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
            if (!element.parentNode) {
                const frag = d.createDocumentFragment();
                frag.appendChild(element);
            }
            const placeholder = d.createComment('x-if');
            element.parentNode?.insertBefore(placeholder, element);
            element.__x_if_placeholder = placeholder;
            element.__x_if_anchorParent = placeholder.parentElement || null;
            const branches = [];
            const makeActualBranch = (el) => {
                if (el[STR_TAGNAME] === STR_TEMPLATE) {
                    const content = el.content;
                    const elementChildren = _Afrom(content.children);
                    if (elementChildren.length === 1) {
                        const cloned = elementChildren[0].cloneNode(true);
                        const od = cloned.style[STR_DISPLAY] !== STR_NONE ? cloned.style[STR_DISPLAY] : undefined;
                        return { branch: { el: cloned, isTemplate: true, originalDisplay: od, isFragment: false } };
                    }
                    else if (elementChildren.length > 1) {
                        const anchor = d.createComment('x-if-branch');
                        const endMarker = d.createComment('/x-if-branch');
                        return {
                            branch: { anchor, nodes: [], endMarker, isTemplate: true, isFragment: true },
                            templateChildren: elementChildren
                        };
                    }
                    const empty = d.createElement('div');
                    empty.style[STR_DISPLAY] = STR_NONE;
                    return { branch: { el: empty, isTemplate: true, originalDisplay: STR_NONE, isFragment: false } };
                }
                const od = (el.style[STR_DISPLAY] !== STR_NONE) ? el.style[STR_DISPLAY] : undefined;
                const saved = el.__x_saved_attrs;
                if (saved) {
                    const ifAttr = attrName('if');
                    const elseIfAttr = attrName('else-if');
                    const elseAttr = attrName('else');
                    el.__x_saved_attrs = saved.filter(a => a.name !== ifAttr && a.name !== elseIfAttr && a.name !== elseAttr);
                }
                return { branch: { el: el, isTemplate: false, originalDisplay: od, isFragment: false } };
            };
            const firstResult = makeActualBranch(element);
            const firstEval = self._createElementEvaluator(expression, element);
            branches.push({ ...firstResult.branch, test: firstEval });
            const branchTemplates = [firstResult.templateChildren || null];
            const originalNodes = [element];
            if (FT_IFB) {
                let sib = element.nextElementSibling;
                while (sib) {
                    const isElse = sib.hasAttribute(attrName('else'));
                    const isElseIf = sib.hasAttribute(attrName('else-if'));
                    if (!isElse && !isElseIf)
                        break;
                    const branchResult = makeActualBranch(sib);
                    let evalFn = null;
                    if (isElseIf) {
                        const attr = sib.getAttribute(attrName('else-if')) || '';
                        evalFn = self._createElementEvaluator(_tr(attr), element);
                    }
                    branches.push({ ...branchResult.branch, test: evalFn });
                    branchTemplates.push(branchResult.templateChildren || null);
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
            const findParentScope = () => self._collectLoopScope(placeholder.parentElement);
            const mountBranch = (idx) => {
                if (idx < 0)
                    return;
                const b = branches[idx];
                const parentScope = findParentScope();
                if (b.isFragment) {
                    const templates = branchTemplates[idx];
                    if (!templates)
                        return;
                    b.nodes = templates.map(t => t.cloneNode(true));
                    if (parentScope) {
                        b.anchor.__x_scope = parentScope;
                        for (const n of b.nodes) {
                            n.__x_scope = parentScope;
                        }
                    }
                    for (const n of b.nodes) {
                        if (!n.__x_tool_bound) {
                            self._parseDirectives(n);
                            n.__x_tool_bound = true;
                        }
                    }
                    const insertRef = placeholder.nextSibling;
                    placeholder.parentNode?.insertBefore(b.anchor, insertRef);
                    for (const n of b.nodes) {
                        placeholder.parentNode?.insertBefore(n, insertRef);
                    }
                    placeholder.parentNode?.insertBefore(b.endMarker, insertRef);
                    for (const n of b.nodes) {
                        self.framework._discoverNested(n, self);
                    }
                    element.__x_if_current = b.anchor;
                }
                else {
                    if (parentScope) {
                        b.el.__x_scope = parentScope;
                    }
                    const wasSuspended = !!b.el.__x_if_suspended;
                    if (wasSuspended) {
                        const current = element.__x_if_current;
                        if (current && current !== b.el && current.parentNode) {
                            current.parentNode.removeChild(current);
                        }
                        if (!b.el.parentNode) {
                            placeholder.parentNode?.insertBefore(b.el, placeholder.nextSibling);
                        }
                        element.__x_if_current = b.el;
                        b.el.__x_if_suspended = false;
                        self._resumeSubtree(b.el);
                        self._applyShowWithTransition(b.el, true, b.originalDisplay);
                    }
                    else {
                        const dataAttr = attrName('data');
                        const hasXData = b.el.hasAttribute(dataAttr) && !self.framework._getComponentByElement(b.el);
                        if (hasXData) {
                            self.framework._bindElementAsComponent(b.el, self);
                        }
                        else if (!b.el.__x_tool_bound) {
                            self._parseDirectives(b.el);
                            b.el.__x_tool_bound = true;
                        }
                        const current = element.__x_if_current;
                        if (current && current.parentNode) {
                            current.parentNode.removeChild(current);
                        }
                        if (!b.el.parentNode) {
                            placeholder.parentNode?.insertBefore(b.el, placeholder.nextSibling);
                        }
                        element.__x_if_current = b.el;
                        if (hasXData) {
                            self.framework._processPending();
                        }
                        self._applyShowWithTransition(b.el, true, b.originalDisplay);
                        self.framework._discoverNested(b.el, self);
                    }
                }
                active = idx;
            };
            const unmountBranch = (idx, cb) => {
                if (idx < 0) {
                    if (cb)
                        cb();
                    return;
                }
                const b = branches[idx];
                active = -1;
                if (b.isFragment) {
                    for (const n of b.nodes) {
                        self._cleanupElementSubtree(n);
                        const nestedComponents = n.querySelectorAll('component[source]');
                        for (const el of nestedComponents) {
                            const comp = self.framework._getComponentByElement(el);
                            if (comp && !comp.isDestroyed) {
                                _se(() => { self.framework._clearComponentRefs(comp); comp.destroy(); });
                            }
                        }
                        n.__x_tool_bound = false;
                        if (n.parentNode)
                            n.parentNode.removeChild(n);
                    }
                    if (b.anchor.parentNode)
                        b.anchor.parentNode.removeChild(b.anchor);
                    if (b.endMarker.parentNode)
                        b.endMarker.parentNode.removeChild(b.endMarker);
                    b.nodes = [];
                    if (cb)
                        cb();
                }
                else {
                    if (b.el.parentNode) {
                        self._suspendSubtree(b.el);
                        b.el.__x_if_suspended = true;
                        self._applyShowWithTransition(b.el, false, b.originalDisplay, () => {
                            if (!b.el.__x_if_suspended) {
                                if (cb)
                                    cb();
                                return;
                            }
                            if (b.el.parentNode)
                                b.el.parentNode.removeChild(b.el);
                            if (cb)
                                cb();
                        });
                    }
                    else if (cb)
                        cb();
                }
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
            const comboRequirements = {
                ctrl: !!modifiers?.ctrl,
                alt: !!modifiers?.alt,
                shift: !!modifiers?.shift,
                meta: !!modifiers?.meta,
            };
            const touchSingle = !!modifiers?.single;
            const touchMulti = !!modifiers?.multi;
            const modifierKeys = modifiers ? _Okeys(modifiers) : [];
            const allowedKeys = [];
            for (const m of modifierKeys) {
                const aliases = _KEY_ALIAS_MAP[m.toLowerCase()];
                if (aliases)
                    allowedKeys.push(...aliases);
            }
            const allowedButtons = [];
            for (const m of modifierKeys) {
                const btn = _BUTTON_MAP[m.toLowerCase()];
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
                if ((isOutside || isWindow) && element instanceof Element && !element.isConnected)
                    return;
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
                const target = isWindow ? (typeof window !== 'undefined' ? window : element) : (isOutside ? (element.isConnected ? element?.ownerDocument : document || d || document) : element);
                if ((isOutside || isWindow) && element instanceof Element) {
                    const listenerAbort = new AbortController();
                    const listenerOpts = opts ? { ...opts, signal: listenerAbort.signal } : { signal: listenerAbort.signal };
                    target.addEventListener(eventName, createEventHandler, listenerOpts);
                    const cleanup = () => { listenerAbort.abort(); };
                    self.framework.registerRefCleanup(element, cleanup);
                    self._addCleanupFunction(cleanup);
                }
                else {
                    self._listen(target, eventName, createEventHandler, opts);
                }
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
                if (this._expressionCache.size > ReactiveComponent._EXPR_CACHE_MAX) {
                    const firstKey = this._expressionCache.keys().next().value;
                    if (firstKey)
                        this._expressionCache.delete(firstKey);
                }
            }
            return fn;
        }
        _createElementEvaluator(expression, element) {
            const self = this;
            const compiled = self._createEvaluator(expression);
            return () => {
                const ctx = self._createContextProxy(undefined, element);
                try {
                    let result = compiled.call(self._createMethodContext(), ctx);
                    if (result && typeof result === 'object' && isReactive(result)) {
                        result = result.value;
                    }
                    return result;
                }
                catch (e) {
                    console.error(`[${self.name}] Error evaluating expression: \`${expression}\`,`, e);
                    return undefined;
                }
            };
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
                    _se(() => result.call(thisCtx, payload));
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
            if (!_FT_DR)
                return data;
            const raw = _unwrap(data);
            if (data !== raw)
                return data;
            const isArr = ARRAY_ISARRAY(raw);
            const isSet = (typeof Set !== 'undefined') && (raw instanceof Set);
            const isMap = (typeof Map !== 'undefined') && (raw instanceof Map);
            if (!(Object.getPrototypeOf(raw) === Object.prototype || isArr || isSet || isMap))
                return raw;
            const self = this;
            if (!this._deepReactiveCache)
                this._deepReactiveCache = new WkMap();
            if (this._deepReactiveCache.has(raw))
                return this._deepReactiveCache.get(raw);
            const makeCollectionWrapper = (name, fn, isArray) => function (...args) {
                self._assertMutable(parentKey, name);
                if (isArray) {
                    const arr = this;
                    const beforeLen = arr.length;
                    const beforeFirst = arr[0];
                    const beforeLast = arr[beforeLen - 1];
                    const result = fn.apply(this, args);
                    if (!self._isSealed && (arr.length !== beforeLen || arr[0] !== beforeFirst || arr[arr.length - 1] !== beforeLast)) {
                        _bumpObjVersion(raw);
                        self._onDataChange(parentKey);
                    }
                    return result;
                }
                else {
                    const before = this.size;
                    const existed = (name === 'set') ? this.has(args[0]) : false;
                    const result = fn.apply(this, args);
                    if (!self._isSealed && (this.size !== before || (name === 'set' && !existed))) {
                        _bumpObjVersion(raw);
                        self._onDataChange(parentKey);
                    }
                    return result;
                }
            };
            const proxy = new Proxy(raw, {
                get: (target, p, receiver) => {
                    if (p === _RAW_TARGET)
                        return target;
                    if (p === _OWNER_COMPONENT)
                        return self;
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
                        value = self._wrapData(value, parentKey);
                    }
                    if (!had) {
                        _se(() => Reflect.defineProperty(target, p, { configurable: true, enumerable: true, writable: true, value }));
                        if (!Reflect.has(target, p))
                            Reflect.set(target, p, value);
                        _bumpObjVersion(raw);
                        self._onDataChange(parentKey);
                        return true;
                    }
                    if (oldValue === value)
                        return true;
                    Reflect.set(target, p, value);
                    if (!self._isSealed) {
                        _bumpObjVersion(raw);
                        self._onDataChange(parentKey);
                    }
                    return true;
                },
                deleteProperty: (target, p) => {
                    const key = String(parentKey) + '.' + String(p);
                    if (self._isInComputedEvaluation)
                        throw new Error(`[x-tool] Deletion of '${key}' is not allowed during computed evaluation.`);
                    if (self._isFrozen)
                        throw new Error(`[x-tool] Deletion of '${key}' is not allowed while component is frozen.`);
                    const ok = Reflect.deleteProperty(target, p);
                    if (ok && !self._isSealed) {
                        _bumpObjVersion(raw);
                        self._onDataChange(parentKey);
                    }
                    return ok;
                }
            });
            this._deepReactiveCache.set(raw, proxy);
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
                    if (value && typeof value === 'object' && _FT_DR) {
                        if (value[_OWNER_COMPONENT]) {
                            return value;
                        }
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
                    if (oldValue === value && !self._propUpdateActive)
                        return true;
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
                    try {
                        if (typeof property !== 'symbol' && isReactive(value)) {
                            self._bridgeUtilReactive(String(property), value);
                        }
                    }
                    catch { }
                    if (value && typeof value === 'object') {
                        _bumpObjVersion(value);
                    }
                    if (!this._isSealed)
                        this._onDataChange(property);
                    if (this._propUpdateActive && property !== '$props' && !this._runningPropEffect) {
                        const pc = target.$props;
                        if (pc)
                            pc[property] = value;
                        const eff = this._propEffects[property];
                        if (eff && !this._isSealed) {
                            this._runningPropEffect = true;
                            try {
                                eff(value, oldValue);
                            }
                            finally {
                                this._runningPropEffect = false;
                            }
                        }
                    }
                    return true;
                }
            });
        }
        _ensureMethodContextSpecials() {
            if (this._cachedMethodContextSpecials)
                return this._cachedMethodContextSpecials;
            const self = this;
            const specials = Object.create(null);
            Object.defineProperties(specials, {
                '$el': { get: () => self._element, enumerable: true },
                '$id': { get: () => self._id, enumerable: true },
                '$isMounted': { get: () => self._isMounted, enumerable: true },
                '$isDestroyed': { get: () => self._isDestroyed, enumerable: true },
                '$isSealed': { get: () => self._isSealed, enumerable: true },
                '$isFrozen': { get: () => self._isFrozen, enumerable: true },
                '$parent': { get: () => self._parent, enumerable: true },
                '$children': { get: () => self._children, enumerable: true }
            });
            specials['$destroy'] = () => self.destroy();
            specials['$forceUpdate'] = () => self._scheduleRender();
            specials['$addCleanupFunction'] = (fn) => self._addCleanupFunction(fn);
            specials['Signals'] = {
                emit: (name, payload) => { self._emitSignal(String(name), payload); },
                connect: (name, handler) => { self._onSignal(String(name), handler); },
                disconnect: (name, handler) => { self._offSignal(String(name), handler); }
            };
            specials['$nextTick'] = (cb) => {
                if (cb) {
                    self._nextTickQueue.push(cb);
                    if (!self._renderScheduled)
                        quMct(() => {
                            if (!self._renderScheduled && self._nextTickQueue.length) {
                                const q = self._nextTickQueue.splice(0, self._nextTickQueue.length);
                                for (const fn of q) {
                                    self._safeExecute(() => fn());
                                }
                            }
                        });
                    return;
                }
                return new Promise(resolve => {
                    self._nextTickQueue.push(() => resolve());
                    if (!self._renderScheduled)
                        quMct(() => {
                            if (!self._renderScheduled && self._nextTickQueue.length) {
                                const q = self._nextTickQueue.splice(0, self._nextTickQueue.length);
                                for (const fn of q) {
                                    self._safeExecute(() => fn());
                                }
                            }
                        });
                });
            };
            if (FT_EXT_DIRS) {
                specials['$refs'] = new Proxy({}, {
                    get: (_t, refName) => refName ? self._getSharedRef(refName) : null
                });
                specials['$ref'] = (refName, value) => {
                    if (value === undefined)
                        return self._getSharedRef(refName);
                    self._framework._registerComponentRef(self, refName, value);
                };
            }
            specials['$seal'] = (on = true) => { self._setSealed(!!on); };
            specials['$mutate'] = (fn) => {
                const prevMethod = self._isInMethodExecution;
                self._isMutationEnabled = false;
                if (self._isInComputedEvaluation) {
                    throw new Error('[x-tool] $mutate cannot be used inside computed evaluation; computed getters must be pure.');
                }
                self._isInMethodExecution = false;
                try {
                    return typeof fn === 'function' ? fn() : undefined;
                }
                finally {
                    self._isInMethodExecution = prevMethod;
                    self._isMutationEnabled = true;
                    self._triggerFullUpdate();
                }
            };
            this._cachedMethodContextSpecials = specials;
            return specials;
        }
        _createMethodContext(_includeComputed = true) {
            const self = this;
            if (self._cachedMethodContext)
                return self._cachedMethodContext;
            const specials = self._ensureMethodContextSpecials();
            const data = self._data;
            self._cachedMethodContext = new Proxy(data, {
                has: (_target, propStr) => {
                    if (propStr in data)
                        return true;
                    if (FT_C && (propStr in self._computed))
                        return true;
                    if (propStr in specials)
                        return true;
                    if (propStr in self._methods)
                        return true;
                    if (propStr in self._closures)
                        return true;
                    return false;
                },
                get: (target, propStr) => {
                    if (propStr in target) {
                        self._trackDependency(propStr);
                        const v = target[propStr];
                        return v;
                    }
                    if (FT_C && (propStr in self._computed)) {
                        return self._getComputedValue(propStr);
                    }
                    if (propStr in specials)
                        return specials[propStr];
                    if (propStr in self._methods)
                        return self._methods[propStr];
                    if (propStr in self._closures)
                        return self._closures[propStr];
                    return undefined;
                },
                set: (_target, propStr, value) => {
                    if (self._isInComputedEvaluation) {
                        throw new Error(`[x-tool] Mutation of '${String(propStr)}' is not allowed during computed evaluation.`);
                    }
                    if (self._isFrozen) {
                        throw new Error(`[x-tool] Mutation of '${String(propStr)}' is not allowed while component is frozen.`);
                    }
                    self._data[propStr] = value;
                    return true;
                }
            });
            return self._cachedMethodContext;
        }
        _ensureContextBase() {
            if (this._contextBase)
                return this._contextBase;
            const component = this;
            const gWindow = (typeof window !== 'undefined' ? window : undefined);
            const gDocument = (typeof document !== 'undefined' ? document : undefined);
            const cfg = this.framework._getConfig();
            const sandbox = !!cfg.sandboxExpressions;
            const allow = new Set((cfg.allowGlobals || []).map(s => String(s)));
            const ensureInvoker = () => component._currentInvoker || '__anonymous__';
            const registerResource = (kind, setup) => {
                const inv = ensureInvoker();
                let byKind = component._invokerResources.get(inv);
                if (!byKind) {
                    byKind = new Map();
                    component._invokerResources.set(inv, byKind);
                }
                const prev = byKind.get(kind);
                if (prev) {
                    _se(prev);
                    byKind.delete(kind);
                }
                const cleanup = setup();
                if (typeof cleanup === 'function') {
                    const wrapped = () => { try {
                        cleanup();
                    }
                    finally {
                        byKind?.delete(kind);
                    } };
                    byKind.set(kind, wrapped);
                    component._addCleanupFunction(wrapped);
                }
            };
            const wrapTarget = (target) => {
                if (!target || typeof target.addEventListener !== 'function')
                    return target;
                const cached = _wrappedTargets.get(target);
                if (cached)
                    return cached;
                const wrapped = new Proxy(target, {
                    get: (obj, prop) => {
                        if (prop === _UNWRAP_DOM_TARGET)
                            return obj;
                        if (prop === 'addEventListener') {
                            return (eventName, handler, options) => {
                                if (component._isSealed || component._isFrozen)
                                    return;
                                obj.addEventListener(eventName, handler, options);
                                const optSig = typeof options === 'boolean' ? options : options?.capture ? '1' : '0';
                                const key = 'listener:' + component._targetKey(obj) + ':' + eventName + ':' + optSig;
                                registerResource(key, () => () => { _se(() => obj.removeEventListener(eventName, handler, options)); });
                            };
                        }
                        if (prop === 'removeEventListener')
                            return (eventName, handler, options) => { _se(() => obj.removeEventListener(eventName, handler, options)); };
                        if (prop === 'querySelector')
                            return (sel) => wrapTarget(obj.querySelector(sel));
                        if (prop === 'querySelectorAll')
                            return (sel) => Array.from(obj.querySelectorAll(sel)).map(wrapTarget);
                        if (prop === 'getElementById')
                            return (id) => wrapTarget(obj.getElementById(id));
                        if (prop === 'getElementsByClassName')
                            return (cls) => Array.from(obj.getElementsByClassName(cls)).map(wrapTarget);
                        if (prop === 'getElementsByTagName')
                            return (tag) => Array.from(obj.getElementsByTagName(tag)).map(wrapTarget);
                        if (prop === 'closest')
                            return (sel) => wrapTarget(obj.closest(sel));
                        if (prop === 'elementFromPoint')
                            return (x, y) => wrapTarget(obj.elementFromPoint(x, y));
                        if (prop === 'elementsFromPoint')
                            return (x, y) => obj.elementsFromPoint(x, y).map(wrapTarget);
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
                        if (prop === 'head') {
                            const head = obj.head;
                            return wrapTarget(head) || head;
                        }
                        if (prop === 'documentElement') {
                            const de = obj.documentElement;
                            return wrapTarget(de) || de;
                        }
                        if (prop === 'activeElement') {
                            const ae = obj.activeElement;
                            return wrapTarget(ae) || ae;
                        }
                        if (prop === 'parentElement') {
                            const pe = obj.parentElement;
                            return wrapTarget(pe) || pe;
                        }
                        if (prop === 'parentNode') {
                            const pn = obj.parentNode;
                            return wrapTarget(pn) || pn;
                        }
                        if (prop === 'firstElementChild') {
                            const fc = obj.firstElementChild;
                            return wrapTarget(fc) || fc;
                        }
                        if (prop === 'lastElementChild') {
                            const lc = obj.lastElementChild;
                            return wrapTarget(lc) || lc;
                        }
                        if (prop === 'nextElementSibling') {
                            const ns = obj.nextElementSibling;
                            return wrapTarget(ns) || ns;
                        }
                        if (prop === 'previousElementSibling') {
                            const ps = obj.previousElementSibling;
                            return wrapTarget(ps) || ps;
                        }
                        if (prop === 'firstChild') {
                            const fc = obj.firstChild;
                            return wrapTarget(fc) || fc;
                        }
                        if (prop === 'lastChild') {
                            const lc = obj.lastChild;
                            return wrapTarget(lc) || lc;
                        }
                        if (prop === 'nextSibling') {
                            const ns = obj.nextSibling;
                            return wrapTarget(ns) || ns;
                        }
                        if (prop === 'previousSibling') {
                            const ps = obj.previousSibling;
                            return wrapTarget(ps) || ps;
                        }
                        if (prop === 'ownerDocument') {
                            const od = obj.ownerDocument;
                            return wrapTarget(od) || od;
                        }
                        if (prop === 'children') {
                            return Array.from(obj.children).map(wrapTarget);
                        }
                        if (prop === 'childNodes') {
                            return Array.from(obj.childNodes).map(wrapTarget);
                        }
                        const value = obj[prop];
                        if (typeof value === 'function') {
                            return function (...args) {
                                const unwrappedArgs = args.map(arg => arg && arg[_UNWRAP_DOM_TARGET] ? arg[_UNWRAP_DOM_TARGET] : arg);
                                return value.apply(obj, unwrappedArgs);
                            };
                        }
                        return value;
                    },
                    set: (obj, prop, value) => {
                        const rawValue = value && value[_UNWRAP_DOM_TARGET] ? value[_UNWRAP_DOM_TARGET] : value;
                        obj[prop] = rawValue;
                        return true;
                    }
                });
                _wrappedTargets.set(target, wrapped);
                return wrapped;
            };
            const ctxSetTimeout = (fn, ms, ...args) => {
                if (component._isSealed || component._isFrozen || component._isDestroyed)
                    return undefined;
                const id = gWindow?.setTimeout?.(fn, ms, ...args);
                if (id != null)
                    registerResource('timeout', () => () => { gWindow?.clearTimeout?.(id); });
                return id;
            };
            const ctxSetInterval = (fn, ms, ...args) => {
                if (component._isSealed || component._isFrozen)
                    return undefined;
                const id = gWindow?.setInterval?.(fn, ms, ...args);
                if (id != null)
                    registerResource('interval', () => () => { gWindow?.clearInterval?.(id); });
                return id;
            };
            const ctxRequestAnimationFrame = (cb) => {
                if (component._isSealed || component._isFrozen)
                    return undefined;
                const id = gWindow?.requestAnimationFrame?.(cb);
                if (id != null)
                    registerResource('raf', () => () => { gWindow?.cancelAnimationFrame?.(id); });
                return id;
            };
            const ctxFetch = (input, init) => {
                if (component._isSealed || component._isFrozen || component._isDestroyed)
                    return undefined;
                const nativeFetch = gWindow?.fetch || (typeof fetch !== 'undefined' ? fetch : undefined);
                if (!nativeFetch)
                    return undefined;
                const controller = new AbortController();
                const signal = controller.signal;
                const mergedInit = { ...init };
                if (init?.signal) {
                    init.signal.addEventListener('abort', () => controller.abort());
                }
                mergedInit.signal = signal;
                const key = 'fetch:' + (++component._fetchCounter);
                registerResource(key, () => () => { if (!signal.aborted)
                    controller.abort(); });
                return nativeFetch(input, mergedInit);
            };
            const wrapXHRCtor = (Orig) => {
                if (!Orig)
                    return undefined;
                return function () {
                    if (component._isSealed || component._isFrozen || component._isDestroyed) {
                        return { open() { }, send() { }, abort() { }, setRequestHeader() { }, addEventListener() { }, removeEventListener() { }, readyState: 0, status: 0, responseText: '', response: null };
                    }
                    const xhr = new Orig();
                    const xhrKey = 'xhr:' + (++component._fetchCounter);
                    let aborted = false;
                    registerResource(xhrKey, () => () => { if (!aborted) {
                        aborted = true;
                        _se(() => xhr.abort());
                    } });
                    return new Proxy(xhr, {
                        get(target, prop) { const value = target[prop]; return typeof value === 'function' ? value.bind(target) : value; },
                        set(target, prop, value) { target[prop] = value; return true; }
                    });
                };
            };
            const wrapObserverCtor = (Orig, kind) => {
                if (!Orig)
                    return undefined;
                return function (...observerArgs) {
                    if (component._isSealed || component._isFrozen)
                        return { observe() { }, disconnect() { }, unobserve() { }, takeRecords() { return []; } };
                    const inst = new Orig(...observerArgs);
                    registerResource('observer:' + kind, () => () => { _se(() => inst.disconnect()); });
                    return {
                        observe(target, options) {
                            const raw = target && target[_UNWRAP_DOM_TARGET] ? target[_UNWRAP_DOM_TARGET] : target;
                            return inst.observe(raw, options);
                        },
                        unobserve(target) {
                            const raw = target && target[_UNWRAP_DOM_TARGET] ? target[_UNWRAP_DOM_TARGET] : target;
                            return inst.unobserve?.(raw);
                        },
                        disconnect() { return inst.disconnect(); },
                        takeRecords() { return inst.takeRecords?.() || []; }
                    };
                };
            };
            const staticSpecials = {
                'Signals': {
                    emit: (name, payload) => { component._emitSignal(String(name), payload); },
                    connect: (name, handler) => { component._onSignal(String(name), handler); },
                    disconnect: (name, handler) => { component._offSignal(String(name), handler); }
                },
                ...(FT_EXT_DIRS ? {
                    '$refs': new Proxy({}, { get: (_t, refName) => refName ? component._getSharedRef(refName) : null }),
                    '$ref': (refName, value) => value === undefined ? component._getSharedRef(refName) : component._framework._registerComponentRef(component, refName, value)
                } : {}),
                ...(FT_RT && this.framework._routerEnabled() ? {
                    'location': new Proxy(gWindow?.location || location, {
                        get: (t, p) => t[p],
                        set: (_t, p, v) => {
                            const key = String(p);
                            if (key === 'href') {
                                try {
                                    component.framework._navigate(String(v), true, 'program');
                                }
                                catch {
                                    location.href = String(v);
                                }
                                return true;
                            }
                            _se(() => location[p] = v);
                            return true;
                        }
                    })
                } : {}),
                ...(sandbox && !allow.has('setTimeout') ? {} : { 'setTimeout': ctxSetTimeout }),
                ...(sandbox && !allow.has('clearTimeout') ? {} : { 'clearTimeout': (id) => { _se(() => gWindow?.clearTimeout?.(id)); } }),
                ...(sandbox && !allow.has('setInterval') ? {} : { 'setInterval': ctxSetInterval }),
                ...(sandbox && !allow.has('clearInterval') ? {} : { 'clearInterval': (id) => { _se(() => gWindow?.clearInterval?.(id)); } }),
                ...(sandbox && !allow.has('requestAnimationFrame') ? {} : { 'requestAnimationFrame': ctxRequestAnimationFrame }),
                ...(sandbox && !allow.has('cancelAnimationFrame') ? {} : { 'cancelAnimationFrame': (id) => { _se(() => gWindow?.cancelAnimationFrame?.(id)); } }),
                ...(sandbox && !allow.has('MutationObserver') ? {} : { 'MutationObserver': wrapObserverCtor(gWindow?.MutationObserver, 'mutation') }),
                ...(sandbox && !allow.has('ResizeObserver') ? {} : { 'ResizeObserver': wrapObserverCtor(gWindow?.ResizeObserver, 'resize') }),
                ...(sandbox && !allow.has('IntersectionObserver') ? {} : { 'IntersectionObserver': wrapObserverCtor(gWindow?.IntersectionObserver, 'intersection') }),
                ...(sandbox && !allow.has('fetch') ? {} : { 'fetch': ctxFetch }),
                ...(sandbox && !allow.has('XMLHttpRequest') ? {} : { 'XMLHttpRequest': wrapXHRCtor(gWindow?.XMLHttpRequest) }),
                ...(sandbox && !allow.has('window') ? {} : { 'window': wrapTarget(gWindow) }),
                ...(sandbox && !allow.has('document') ? {} : { 'document': wrapTarget(gDocument) })
            };
            this._contextBase = { gWindow, gDocument, sandbox, allow, wrapTarget, registerResource, ctxSetTimeout, ctxSetInterval, ctxRequestAnimationFrame, ctxFetch, wrapXHRCtor, wrapObserverCtor, staticSpecials };
            return this._contextBase;
        }
        _createContextProxy(event, targetElement, _thisArg) {
            const component = this;
            const base = this._ensureContextBase();
            const mergedScope = targetElement ? this._collectLoopScope(targetElement) : null;
            const dynamicSpecials = {
                '$target': targetElement || null,
                '$event': event || null,
                '$attr': (nameOrObj, value) => {
                    if (!targetElement)
                        return;
                    if (typeof nameOrObj === 'object' && nameOrObj !== null) {
                        for (const key in nameOrObj) {
                            if (Object.prototype.hasOwnProperty.call(nameOrObj, key))
                                _expandAndSet(targetElement, key, nameOrObj[key]);
                        }
                    }
                    else if (typeof nameOrObj === 'string') {
                        _expandAndSet(targetElement, nameOrObj, value);
                    }
                },
                '$css': (nameOrObj, value) => {
                    if (!targetElement)
                        return;
                    if (typeof nameOrObj === 'object' && nameOrObj !== null) {
                        for (const key in nameOrObj) {
                            if (Object.prototype.hasOwnProperty.call(nameOrObj, key))
                                _expandAndSet(targetElement, key, nameOrObj[key], true);
                        }
                    }
                    else if (typeof nameOrObj === 'string') {
                        _expandAndSet(targetElement, nameOrObj, value, true);
                    }
                }
            };
            const staticSpecials = base.staticSpecials;
            const inheritScope = component._framework._inheritScope && component._isInlineXData;
            const getFromParent = (prop) => {
                if (!inheritScope)
                    return { found: false, value: undefined };
                let cur = component._parent;
                while (cur) {
                    if (!cur._isInlineXData)
                        break;
                    if (prop in cur._data) {
                        cur._trackDependency(prop);
                        return { found: true, value: cur._data[prop], owner: cur };
                    }
                    if (prop in cur._computed)
                        return { found: true, value: cur._getComputedValue(prop), owner: cur };
                    if (prop in cur._methods)
                        return { found: true, value: cur._methods[prop], owner: cur };
                    cur = cur._parent;
                }
                return { found: false, value: undefined };
            };
            const setInParent = (prop, value) => {
                if (!inheritScope)
                    return false;
                let cur = component._parent;
                while (cur) {
                    if (!cur._isInlineXData)
                        break;
                    if (prop in cur._data) {
                        cur._data[prop] = value;
                        return true;
                    }
                    cur = cur._parent;
                }
                return false;
            };
            const hasInParent = (prop) => {
                if (!inheritScope)
                    return false;
                let cur = component._parent;
                while (cur) {
                    if (!cur._isInlineXData)
                        break;
                    if (prop in cur._data || prop in cur._computed || prop in cur._methods)
                        return true;
                    cur = cur._parent;
                }
                return false;
            };
            const closures = component._closures;
            return new Proxy({}, {
                get: (_t, propStr) => {
                    if (mergedScope && propStr in mergedScope) {
                        const value = mergedScope[propStr];
                        if (value && typeof value === 'object' && _FT_DR) {
                            const owner = value[_OWNER_COMPONENT];
                            if (owner && typeof owner._wrapData === 'function')
                                return owner._wrapData(value, propStr);
                            return component._wrapData(value, propStr);
                        }
                        return value;
                    }
                    if (propStr in component._data)
                        return component._data[propStr];
                    if (propStr in component._computed)
                        return component._getComputedValue(propStr);
                    if (propStr in component._methods)
                        return component._methods[propStr];
                    if (propStr in closures)
                        return closures[propStr];
                    const parentResult = getFromParent(propStr);
                    if (parentResult.found) {
                        const value = parentResult.value;
                        if (value && typeof value === 'object' && _FT_DR && parentResult.owner) {
                            return parentResult.owner._wrapData(value, propStr);
                        }
                        return value;
                    }
                    if (propStr in dynamicSpecials)
                        return dynamicSpecials[propStr];
                    if (propStr in staticSpecials)
                        return staticSpecials[propStr];
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
                    if (propStr in component._data) {
                        component._data[propStr] = value;
                        return true;
                    }
                    if (setInParent(propStr, value))
                        return true;
                    component._data[propStr] = value;
                    return true;
                },
                has: (_t, propStr) => typeof propStr === 'string' && (!!(mergedScope && propStr in mergedScope) ||
                    propStr in component._data ||
                    propStr in component._computed ||
                    propStr in component._methods ||
                    propStr in closures ||
                    hasInParent(propStr) ||
                    propStr in dynamicSpecials ||
                    propStr in staticSpecials)
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
            let baseStyle;
            if (attributeName === STR_STYLE) {
                const el = element;
                baseStyle = el.getAttribute('style') || undefined;
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
                        const classState = new Map();
                        for (const raw in value) {
                            if (!raw)
                                continue;
                            const on = !!value[raw];
                            for (const tk of raw.split(/\s+/)) {
                                if (!tk)
                                    continue;
                                if (on || !classState.has(tk)) {
                                    classState.set(tk, on);
                                }
                            }
                        }
                        const finalClasses = base ? [...base] : [];
                        for (const [tk, on] of classState) {
                            if (on && (!base || !base.has(tk))) {
                                finalClasses.push(tk);
                            }
                        }
                        const finalStr = finalClasses.join(' ');
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
                        const styleStr = value.trim();
                        if (styleStr) {
                            el.style.cssText += ';' + styleStr;
                        }
                        return;
                    }
                    else if (value && typeof value === 'object') {
                        if (baseStyle) {
                            el.style.cssText = baseStyle;
                        }
                        else {
                            el.style.cssText = '';
                        }
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
                    if (baseStyle) {
                        el.style.cssText = baseStyle;
                    }
                    else {
                        el.removeAttribute('style');
                    }
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
            const directScope = el.__x_scope;
            if (directScope)
                return directScope;
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
                if (s) {
                    return s;
                }
                let sibling = node.previousSibling;
                while (sibling) {
                    if (sibling.nodeType === 8) {
                        const commentScope = sibling.__x_scope;
                        if (commentScope)
                            return commentScope;
                    }
                    sibling = sibling.previousSibling;
                }
                node = node.parentElement;
            }
            return null;
        }
        _updateElementDirectivesForVar(root, varName) {
            let re = _varNameRegexCache.get(varName);
            if (!re) {
                re = new RegExp('(^|[^$\\w])' + varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([^$\\w]|$)');
                _varNameRegexCache.set(varName, re);
            }
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
            if (!FT_EXT_DIRS)
                return;
            const dirs = this._directives.get(root);
            if (dirs) {
                for (const d of dirs) {
                    if (d.type === 'custom' && d.customDirective?.unbind) {
                        _se(() => d.customDirective.unbind(root, this));
                    }
                }
                this._directives.delete(root);
            }
            let child = root.firstElementChild;
            while (child) {
                this._cleanupElementSubtree(child);
                child = child.nextElementSibling;
            }
        }
        _suspendSubtree(root) {
            const dirs = this._directives.get(root);
            if (dirs) {
                for (const d of dirs) {
                    if (d.type !== 'if' && d.type !== 'for' && d.update) {
                        this._suspendedEffects.add(d.update);
                    }
                }
            }
            const comp = this._framework._getComponentByElement(root);
            if (comp && !comp.isDestroyed) {
                comp._fireLifecycleHandlers('before-unmount');
                comp._fireLifecycleHandlers('unmounted');
            }
            let child = root.firstElementChild;
            while (child) {
                this._suspendSubtree(child);
                child = child.nextElementSibling;
            }
        }
        _resumeSubtree(root) {
            const effectsToRun = [];
            this._resumeSubtreeCollect(root, effectsToRun);
            for (const effect of effectsToRun) {
                this._safeExecute(effect);
            }
        }
        _resumeSubtreeCollect(root, effectsToRun) {
            const dirs = this._directives.get(root);
            if (dirs) {
                for (const d of dirs) {
                    if (d.update && this._suspendedEffects.has(d.update)) {
                        this._suspendedEffects.delete(d.update);
                        effectsToRun.push(d.update);
                    }
                }
            }
            let child = root.firstElementChild;
            while (child) {
                this._resumeSubtreeCollect(child, effectsToRun);
                child = child.nextElementSibling;
            }
        }
        _bindForDirective(element, expression) {
            if (!FT_EXT_DIRS)
                return;
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
            const isFragment = (inst) => inst && typeof inst === 'object' && 'anchor' in inst && 'nodes' in inst;
            let templateChildren = [];
            let isMultiChildFragment = false;
            let templateToClone = null;
            if (element[STR_TAGNAME] === STR_TEMPLATE) {
                const content = element.content;
                templateChildren = Array.from(content.children);
                if (templateChildren.length === 1) {
                    templateToClone = templateChildren[0].cloneNode(true);
                }
                else if (templateChildren.length > 1) {
                    isMultiChildFragment = true;
                }
                else {
                    templateToClone = d.createElement('div');
                    templateToClone.style[STR_DISPLAY] = STR_NONE;
                }
                element.parentNode?.removeChild(element);
            }
            else {
                templateToClone = element;
                templateChildren = [element];
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
                const BP_IF = attrName('if');
                const BP_ELSE = attrName('else');
                const BP_ELSEIF = attrName('else-if');
                const walk = (el, path, isRootEl) => {
                    if (!isRootEl && el.hasAttribute(BP_DATA))
                        return;
                    const isComponentTag = el[STR_TAGNAME] === 'COMPONENT';
                    const scan = self._scanDirectiveAttrs(el, { skipRootFor: isRootEl });
                    const dnames = scan.names.filter(n => n !== BP_KEY && (!isRootEl || n !== BP_FOR));
                    const hasTextOrHtml = scan.names.includes(BP_TEXT) || scan.names.includes(BP_HTML);
                    const forName = scan.forName;
                    const hasStructural = dnames.includes(BP_IF) || dnames.includes(BP_ELSE) || dnames.includes(BP_ELSEIF);
                    if (dnames.length) {
                        if (forName) {
                            bp.push({ path, directiveNames: [forName], hasTextOrHtml: hasTextOrHtml, forName });
                            return;
                        }
                        if (hasStructural) {
                            const structuralOnly = dnames.filter(n => n === BP_IF || n === BP_ELSE || n === BP_ELSEIF);
                            bp.push({ path, directiveNames: structuralOnly, hasTextOrHtml });
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
                for (let i = bp.length - 1; i >= 0; i--) {
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
            const blueprint = templateToClone ? buildBlueprint(templateToClone) : null;
            const fragmentBlueprints = isMultiChildFragment
                ? templateChildren.map(child => buildBlueprint(child))
                : null;
            const hydrateFragmentNodes = (nodes, bps) => {
                for (let r = 0; r < nodes.length; r++) {
                    hydrateFromBlueprint(nodes[r], bps[r]);
                }
            };
            const parentLoopScope = self._collectLoopScope(contextAnchor);
            const instances = [];
            const createScope = (item, idxOrKey, existing) => {
                const base = parentLoopScope ? Object.create(parentLoopScope) : {};
                const scope = existing ? Object.assign(base, existing) : base;
                scope[itemVar] = item;
                if (indexVar)
                    scope[indexVar] = idxOrKey;
                return scope;
            };
            const getPrimaryElement = (inst) => isFragment(inst) ? inst.nodes[0] : inst;
            const getLastNode = (inst) => {
                if (isFragment(inst))
                    return inst.endMarker;
                const current = inst.__x_if_current;
                if (current)
                    return current;
                return inst;
            };
            const getFirstNode = (inst) => {
                if (isFragment(inst))
                    return inst.anchor;
                const xifPlaceholder = inst.__x_if_placeholder;
                if (xifPlaceholder)
                    return xifPlaceholder;
                return inst;
            };
            const removeInstance = (inst) => {
                if (isFragment(inst)) {
                    if (inst.anchor.parentNode)
                        inst.anchor.parentNode.removeChild(inst.anchor);
                    for (const n of inst.nodes) {
                        self._cleanupElementSubtree(n);
                        if (n.parentNode)
                            n.parentNode.removeChild(n);
                    }
                    if (inst.endMarker.parentNode)
                        inst.endMarker.parentNode.removeChild(inst.endMarker);
                }
                else {
                    const xifPlaceholder = inst.__x_if_placeholder;
                    if (xifPlaceholder && xifPlaceholder.parentNode) {
                        xifPlaceholder.parentNode.removeChild(xifPlaceholder);
                    }
                    const current = inst.__x_if_current;
                    if (current && current !== inst && current.parentNode) {
                        current.parentNode.removeChild(current);
                    }
                    self._cleanupElementSubtree(inst);
                    if (inst.parentNode)
                        inst.parentNode.removeChild(inst);
                }
            };
            const insertInstanceBefore = (inst, ref, parent) => {
                if (isFragment(inst)) {
                    parent.insertBefore(inst.anchor, ref);
                    for (const n of inst.nodes)
                        parent.insertBefore(n, ref);
                    parent.insertBefore(inst.endMarker, ref);
                }
                else {
                    const xifPlaceholder = inst.__x_if_placeholder;
                    if (xifPlaceholder) {
                        parent.insertBefore(xifPlaceholder, ref);
                        inst.__x_if_anchorParent = xifPlaceholder.parentElement || null;
                        if (inst.parentNode === xifPlaceholder.parentNode) {
                            parent.insertBefore(inst, ref);
                        }
                    }
                    else {
                        parent.insertBefore(inst, ref);
                    }
                }
            };
            const objIds = new WeakMap();
            let objSeq = 0;
            const extractId = (o) => {
                if (!o || typeof o !== 'object')
                    return null;
                const v = o.id ?? o._id;
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
                    if (ARRAY_ISARRAY(result))
                        return { list: result, keys: null, src: result };
                    if (typeof result === 'number' && Number.isFinite(result) && result >= 0) {
                        const n = Math.floor(result);
                        const range = new Array(n);
                        for (let i = 0; i < n; i++)
                            range[i] = i + 1;
                        return { list: range, keys: null, src: result };
                    }
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
                    const inst = instances[i];
                    const primary = getPrimaryElement(inst);
                    const k = primary.__x_for_key;
                    const ps = primary.__x_primSig;
                    if (ps) {
                        let q = oldPrimQueues.get(ps);
                        if (!q) {
                            q = [];
                            oldPrimQueues.set(ps, q);
                        }
                        q.push(inst);
                    }
                    else if (k) {
                        oldByObjKey.set(k, inst);
                    }
                }
                const newInstances = new Array(list.length);
                const pendingHydration = [];
                const parent = placeholder.parentNode;
                for (let i = 0; i < list.length; i++) {
                    const item = list[i];
                    const idxOrKey = keysArr ? keysArr[i] : i;
                    let inst;
                    let nodeKey;
                    const explicitKey = keyEval ? evalKeyExpr(item, idxOrKey) : null;
                    if (explicitKey != null) {
                        nodeKey = 'k:' + String(explicitKey);
                        const prev = oldByObjKey.get(nodeKey);
                        if (prev) {
                            inst = prev;
                            oldByObjKey.delete(nodeKey);
                        }
                    }
                    if (!inst) {
                        const k = keyFor(item);
                        if (k && (k.startsWith('o#') || k.startsWith('id:'))) {
                            nodeKey = k;
                            const prev = oldByObjKey.get(k);
                            if (prev) {
                                inst = prev;
                                oldByObjKey.delete(k);
                            }
                        }
                        else if (k && k.startsWith('p#')) {
                            const ps = k;
                            const q = oldPrimQueues.get(ps);
                            if (q && q.length) {
                                inst = q.shift();
                            }
                            if (inst) {
                                const primary = getPrimaryElement(inst);
                                nodeKey = primary.__x_for_key;
                                primary.__x_primSig = ps;
                            }
                        }
                    }
                    if (!inst) {
                        const initScope = createScope(item, idxOrKey, {});
                        if (isMultiChildFragment && fragmentBlueprints) {
                            const anchor = d.createComment('x-for-item');
                            const endMarker = d.createComment('/x-for-item');
                            const nodes = [];
                            anchor.__x_scope = initScope;
                            anchor.__x_itemRef = item;
                            if (indexVar)
                                anchor.__x_idxRef = idxOrKey;
                            for (let c = 0; c < templateChildren.length; c++) {
                                const clone = templateChildren[c].cloneNode(true);
                                clone.removeAttribute('x-for');
                                if (keyExpr)
                                    clone.removeAttribute(keyAttrName);
                                clone.__x_scope = initScope;
                                nodes.push(clone);
                            }
                            inst = { anchor, nodes, endMarker };
                            pendingHydration.push({ inst, isFragment: true, bp: fragmentBlueprints });
                            anchor.__x_for_key = (nodeKey !== undefined) ? nodeKey : ('n#' + (++objSeq));
                        }
                        else {
                            const clone = templateToClone.cloneNode(true);
                            clone.removeAttribute('x-for');
                            if (keyExpr)
                                clone.removeAttribute(keyAttrName);
                            clone.__x_scope = initScope;
                            clone.__x_itemRef = item;
                            if (indexVar)
                                clone.__x_idxRef = idxOrKey;
                            inst = clone;
                            pendingHydration.push({ inst, isFragment: false, bp: blueprint });
                            clone.__x_for_key = (nodeKey !== undefined) ? nodeKey : ('n#' + (++objSeq));
                        }
                    }
                    else {
                        const primary = isFragment(inst) ? inst.anchor : inst;
                        const existingScope = primary.__x_scope;
                        const prevIdxRef = primary.__x_idxRef;
                        const prevItemRef = primary.__x_itemRef;
                        const prevVersion = primary.__x_itemVersion ?? 0;
                        const scope = createScope(item, idxOrKey, existingScope);
                        primary.__x_scope = scope;
                        primary.__x_itemRef = item;
                        if (indexVar)
                            primary.__x_idxRef = idxOrKey;
                        const nodes = isFragment(inst) ? inst.nodes : [inst];
                        for (const n of nodes) {
                            n.__x_scope = scope;
                        }
                        const itemRefChanged = prevItemRef !== item;
                        const indexChanged = !!indexVar && prevIdxRef !== idxOrKey;
                        const currentVersion = (item && typeof item === 'object') ? _getDeepVersion(item) : 0;
                        const versionChanged = currentVersion !== prevVersion;
                        if (item && typeof item === 'object') {
                            primary.__x_itemVersion = currentVersion;
                        }
                        if (itemRefChanged || indexChanged || versionChanged) {
                            for (const n of nodes) {
                                if (itemRefChanged || versionChanged) {
                                    self._updateElementDirectivesForVar(n, itemVar);
                                }
                                if (indexChanged && indexVar) {
                                    self._updateElementDirectivesForVar(n, indexVar);
                                }
                            }
                        }
                    }
                    const primary = getPrimaryElement(inst);
                    if (nodeKey)
                        primary.__x_for_key = nodeKey;
                    const sig = (!keyExpr && !(item && typeof item === 'object')) ? ('p#' + (typeof item) + ':' + String(item)) : undefined;
                    primary.__x_primSig = sig;
                    newInstances[i] = inst;
                }
                for (const [, inst] of oldByObjKey) {
                    removeInstance(inst);
                }
                for (const [, queue] of oldPrimQueues) {
                    for (const inst of queue) {
                        removeInstance(inst);
                    }
                }
                if (parent) {
                    const oldIndexMap = new Map();
                    for (let i = 0; i < instances.length; i++) {
                        const primary = getPrimaryElement(instances[i]);
                        const k = primary.__x_for_key;
                        if (k !== undefined)
                            oldIndexMap.set(k, i);
                    }
                    const seq = new Array(newInstances.length);
                    for (let i = 0; i < newInstances.length; i++) {
                        const primary = getPrimaryElement(newInstances[i]);
                        const k = primary.__x_for_key;
                        const oldIdx = oldIndexMap.has(k) ? oldIndexMap.get(k) : -1;
                        seq[i] = oldIdx;
                    }
                    const { lisMask: lis } = this._computeLISMask(seq);
                    const tailAnchor = instances.length
                        ? getLastNode(instances[instances.length - 1]).nextSibling
                        : placeholder.nextSibling;
                    let anchor = null;
                    for (let i = newInstances.length - 1; i >= 0; i--) {
                        const inst = newInstances[i];
                        const ref = anchor ?? tailAnchor;
                        if (seq[i] === -1) {
                            insertInstanceBefore(inst, ref, parent);
                        }
                        else if (!lis[i]) {
                            insertInstanceBefore(inst, ref, parent);
                        }
                        anchor = getFirstNode(inst);
                    }
                    for (const pending of pendingHydration) {
                        if (pending.isFragment) {
                            const fragInst = pending.inst;
                            _se(() => hydrateFragmentNodes(fragInst.nodes, pending.bp));
                            for (const n of fragInst.nodes) {
                                self.framework._discoverNested(n, self);
                            }
                        }
                        else {
                            const clone = pending.inst;
                            _se(() => hydrateFromBlueprint(clone, pending.bp));
                            self.framework._discoverNested(clone, self);
                        }
                    }
                    self.framework._processPending();
                }
                instances.length = 0;
                for (let i = 0; i < newInstances.length; i++)
                    instances.push(newInstances[i]);
            };
            const dir = { type: 'for', expression };
            const effect = self._createEffect(update, dir);
            dir.update = effect;
            self._addDirective(placeholder, dir);
        }
        _resolveNodeByPath(root, path) {
            if (!FT_EXT_DIRS)
                return root;
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
            if (!FT_EXT_DIRS)
                return { lisMask: [], lisLen: 0 };
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
    ReactiveComponent._EXPR_CACHE_MAX = 200;
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