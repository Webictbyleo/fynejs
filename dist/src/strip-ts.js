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
export default stripTypes;
//# sourceMappingURL=strip-ts.js.map