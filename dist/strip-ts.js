/**
 * strip-ts.ts - TypeScript Type Syntax Stripper
 *
 * A high-performance, memory-efficient TypeScript type annotation remover using
 * token-based scanning. Designed to convert TypeScript code to valid JavaScript
 * while preserving runtime behavior and code structure.
 *
 * Implementation Characteristics:
 * - Single-pass tokenization with linked token tracking for context awareness
 * - Optimized character testing using regex patterns
 * - Memory-efficient string handling with incremental concatenation
 * - Depth-aware brace/bracket/parenthesis tracking
 * - Smart whitespace preservation for code formatting
 *
 *
 * Usage Considerations:
 * - Best suited for well-formed TypeScript code
 * - Does not perform full TypeScript parsing; focuses on type syntax removal
 * - Handles most common TypeScript patterns reliably
 * - Tries to handle very complex type constructs, but the simpler the types, the better
 * - Not suitable for runtime type information preservation
 * - Consider file size when processing large codebases
 *
 *  What it removes at a glance:
 * - Type annotations in variable declarations, function parameters, and return types
 * - Interface, namespace, declare and type alias declarations
 * - Generics in functions and classes
 * - Because this does not handle build, bundling or module resolution, it does removes import and export declarations(not just type-only).
 * - Non-null assertion operators
 * - Access modifiers in class properties and methods
 * - Function overload signatures
 * - Type assertions using 'as' syntax
 * - Enum declarations
 * - implements in class declarations
 *
 * API:
 * - stripTypes(source: string): string
 *   Removes TypeScript-specific syntax while preserving JavaScript semantics
 */
// Predefined sets for faster lookups
const keywords = new Set([
    'as', 'interface', 'type', 'import', 'export', 'from', 'extends', 'implements',
    'declare', 'namespace', 'module', 'any', 'unknown', 'never', 'void',
    'number', 'string', 'boolean', 'symbol', 'bigint', 'object', 'enum', 'function', 'const',
    'let', 'var'
]);
const visibility = ['public', 'private', 'protected', 'static', 'abstract', 'readonly'];
// Common character tests (precompiled regexes)
const WS_RE = /\s/;
const NUM_RE = /\d/;
function stripTypes(source) {
    // Precompiled regexes for identifier checks (helps minifiers reuse literals)
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
    // Helper to skip until a specific token or condition
    // Skip until predicate returns true. Predicate may close over state if needed.
    const skipUntil = (tokens, index, pred) => {
        const context = { index, depth: 0 };
        while (index < tokens.length && !pred(tokens[index], context))
            index++;
        return index;
    };
    // Small helper to check the presence of one item in another, this will help help prevent the usages of the "includes" method all over the code. Thi function will accept buth string and array as second parameter.
    const hasItem = (item, collection) => {
        return collection.indexOf(item) !== -1;
    };
    function skipType(tokens, startIndex, standalone = true) {
        let i = startIndex;
        const ctx = {};
        // Remove whitespace && unions
        i = skipUntil(tokens, i, t => t.type !== 5 /* TokenType.Whitespace */ && !(t.type === 2 /* TokenType.Punctuation */ && hasItem(t.value, '|?&:')));
        let isSimple = hasItem(tokens[i].type, [1 /* TokenType.Keyword */, 0 /* TokenType.Identifier */]);
        if (isSimple && tokens[i] && tokens[i].next?.type === 2 /* TokenType.Punctuation */ && hasItem(tokens[i].next?.value, '<[{(')) {
            i = skipUntil(tokens, i, t => t.type === 2 /* TokenType.Punctuation */);
        }
        let isComplex = tokens[i].type === 2 /* TokenType.Punctuation */ && hasItem(tokens[i].value, '<[{(');
        while (i < tokens.length) {
            if (isComplex) {
                i = skipUntil(tokens, i, (t, ctx) => {
                    if (t.type === 2 /* TokenType.Punctuation */) {
                        if (hasItem(t.value, ']})>'))
                            ctx.depth--;
                        else if (hasItem(t.value, '<[{('))
                            ctx.depth++;
                    }
                    return ctx.depth <= 0 && !(t.next?.type === 2 /* TokenType.Punctuation */ && hasItem(t.next?.value, '<[{('));
                });
                i++;
            }
            else {
                i = skipUntil(tokens, i, t => (5 /* TokenType.Whitespace */ === t.type && t.value !== " ") || (t.type === 2 /* TokenType.Punctuation */ && t.value !== '.'));
                if (standalone && tokens[i] && tokens[i].type === 2 /* TokenType.Punctuation */ && hasItem(tokens[i].value, '<[{(')) {
                    // Check if this is on same line, not split by newline
                    let hasNewline = false;
                    skipUntil(tokens, i, t => { if (t.type === 5 /* TokenType.Whitespace */ && hasItem("\n", t.value))
                        hasNewline = true; return hasNewline || t.start >= tokens[i].start; });
                    if (!hasNewline) {
                        i = skipUntil(tokens, i, (t, ctx) => {
                            if (t.type === 2 /* TokenType.Punctuation */) {
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
            // If we re in whitespace phase and the next char is type union, we have to move ahead to that
            if (tokens[i].type === 5 /* TokenType.Whitespace */ && hasItem("\n", tokens[i].value) && tokens[i].prev?.next && tokens[i].prev?.next?.type === 2 /* TokenType.Punctuation */ && hasItem(tokens[i].prev?.next?.value, '?&|:')) {
                i = skipUntil(tokens, i, t => t.type == 2 /* TokenType.Punctuation */);
            }
            // Remove any whitespace
            if (tokens[i].type === 5 /* TokenType.Whitespace */)
                i = skipUntil(tokens, i, t => !t.value.startsWith(' '));
            //if (i >= tokens.length) break;
            let cur = tokens[i];
            const isContinued = cur.type === 2 /* TokenType.Punctuation */ && hasItem(cur.value, "?&|:") || (cur.type === 7 /* TokenType.Arrow */ && cur.prev?.value === ')');
            // If there is no union separator syntax but we found a complex phase, let handle it
            if (!isContinued && (isSimple && cur.type === 2 /* TokenType.Punctuation */ && (hasItem(cur.value, '(<[') || standalone && cur.value == '{'))) {
                isComplex = true;
                i = skipUntil(tokens, i, t => t.type !== 5 /* TokenType.Whitespace */);
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
                isSimple = hasItem(tokens[i].type, [1 /* TokenType.Keyword */, 0 /* TokenType.Identifier */]);
                isComplex = tokens[i].type === 2 /* TokenType.Punctuation */ && hasItem(tokens[i].value, '<[{(');
            }
        }
        return i;
    }
    // Utility helper to tokenize the input source code
    function tokenize(input) {
        const tokens = [];
        let pos = 0;
        const length = input.length;
        let prevToken;
        // Preallocate token object for better performance
        const createToken = (type, start, end) => {
            const token = {
                type,
                value: input.slice(start, end),
                start,
                end
            };
            // Always set up bidirectional links
            if (prevToken) {
                token.prev = prevToken;
                prevToken.next = token;
            }
            // Maintain exact adjacency links for all tokens so callers can rely
            // on `token.prev`/`token.next` being the immediate neighbors.
            prevToken = token;
            return token;
        };
        while (pos < length) {
            const ch = input[pos];
            let start = pos;
            // Fast path for most common cases
            if (isWhitespace(ch)) {
                do {
                    pos++;
                } while (pos < length && isWhitespace(input[pos]));
                tokens.push(createToken(5 /* TokenType.Whitespace */, start, pos));
                continue;
            }
            if (isIdentifierStart(ch)) {
                pos++;
                while (pos < length && isIdentifierPart(input[pos]))
                    pos++;
                const value = input.slice(start, pos);
                tokens.push(createToken(keywords.has(value) || hasItem(value, visibility) ? 1 /* TokenType.Keyword */ : 0 /* TokenType.Identifier */, start, pos));
                continue;
            }
            if (isNumber(ch)) {
                do {
                    pos++;
                } while (pos < length && isNumber(input[pos]));
                tokens.push(createToken(6 /* TokenType.Number */, start, pos));
                continue;
            }
            // Handle strings efficiently, including nested template literals
            if (ch === '"' || ch === "'" || ch === '`') {
                const quoteType = ch;
                pos++;
                if (quoteType !== '`') {
                    // Simple single or double quoted strings with escapes
                    while (pos < length) {
                        if (input[pos] === '\\')
                            pos += 2; // skip escape + next char
                        else if (input[pos] === quoteType) {
                            pos++;
                            break;
                        }
                        else
                            pos++;
                    }
                    tokens.push(createToken(3 /* TokenType.String */, start, pos));
                    continue;
                }
                // Template literal handling with ${...} expressions and nested templates
                let tplExprDepth = 0;
                while (pos < length) {
                    const c = input[pos];
                    if (c === '\\') {
                        pos += 2;
                        continue;
                    } // escaped char (including \`)
                    // End of outer template when not inside an expression
                    if (c === '`' && tplExprDepth === 0) {
                        pos++;
                        break;
                    }
                    // Enter a ${ ... } expression
                    if (c === '$' && pos + 1 < length && input[pos + 1] === '{') {
                        tplExprDepth++;
                        pos += 2;
                        // Scan inside the expression until matching '}' taking into account
                        // nested strings and nested template literals
                        while (pos < length && tplExprDepth > 0) {
                            const e = input[pos];
                            if (e === '\\') {
                                pos += 2;
                                continue;
                            }
                            // Skip quoted strings inside the expression
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
                            // Handle nested template literal inside expression
                            if (e === '`') {
                                // Consume nested template fully (it may contain its own ${...})
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
                            // Track braces depth for ${ ... } expressions
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
                tokens.push(createToken(3 /* TokenType.String */, start, pos));
                continue;
            }
            // Handle comments
            if (ch === '/' && pos + 1 < length) {
                if (input[pos + 1] === '/') {
                    pos += 2;
                    while (pos < length && input[pos] !== '\n')
                        pos++;
                    tokens.push(createToken(4 /* TokenType.Comment */, start, pos));
                    continue;
                }
                if (input[pos + 1] === '*') {
                    pos += 2;
                    while (pos < length && !(input[pos] === '*' && input[pos + 1] === '/'))
                        pos++;
                    pos += 2;
                    tokens.push(createToken(4 /* TokenType.Comment */, start, pos));
                    continue;
                }
            }
            // Handle arrow function operator and other punctuation
            if (ch === '=' && pos + 1 < length && input[pos + 1] === '>') {
                // Found '=>' arrow function operator
                pos += 2;
                tokens.push(createToken(7 /* TokenType.Arrow */, start, pos));
                continue;
            }
            if ('?!'.includes(ch) && pos + 1 < length && input[pos + 1] === ':') {
                // Found '?:' conditional operator
                pos += 2;
                tokens.push(createToken(8 /* TokenType.Conditional */, start, pos));
                continue;
            }
            // Handle regular punctuation (single character)
            tokens.push(createToken(2 /* TokenType.Punctuation */, pos, ++pos));
        }
        return tokens;
    }
    // Helper to check if we're in object literal context
    function isObjectLiteralStart(tokens, index) {
        // Look backwards for indicators of object literal context
        let j = index - 1;
        while (j >= 0 && tokens[j].type === 5 /* TokenType.Whitespace */)
            j--;
        if (j < 0)
            return true; // Start of file, could be object literal
        const prevToken = tokens[j];
        if (prevToken.type === 7 /* TokenType.Arrow */)
            return false; // This is an arrow function body
        return (prevToken.type === 0 /* TokenType.Identifier */ && prevToken.value === 'return') || (prevToken.type === 2 /* TokenType.Punctuation */ && (prevToken.value === '=' || prevToken.value === '(' || prevToken.value === '[' ||
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
            // Fast-path for skipping comments and condensing newlines
            if (tt === 4 /* TokenType.Comment */) {
                i++;
                continue;
            }
            // Track identifiers for context
            if (tt === 0 /* TokenType.Identifier */) {
                context.lastIdentifier = v;
            }
            if (context.lastIdentifier === 'class') {
                isClass = true;
            }
            // Handle enum right away
            if ((tt == 0 /* TokenType.Identifier */ || tt == 1 /* TokenType.Keyword */) && ((token.next?.type === 1 /* TokenType.Keyword */ && token.next.value == 'enum') || (v == 'enum'))) {
                i = skipUntil(tokens, i, t => t.value == '}');
                i++;
                continue;
            }
            // Fast-path for consuming whatever we dont handle
            if (tt == 3 /* TokenType.String */ || (tt != 2 /* TokenType.Punctuation */ && 5 /* TokenType.Whitespace */ != tt && 1 /* TokenType.Keyword */ != tt && 8 /* TokenType.Conditional */ != tt)) {
                i++;
                outputString += v;
                continue;
            }
            if (tt === 5 /* TokenType.Whitespace */) {
                outputString += (v.includes('\n') ? '\n' : v);
                i++;
                continue;
            }
            // Track class body and handle 'class' keyword            // Track object literals and class bodies
            if (tt === 2 /* TokenType.Punctuation */ && v === '{') {
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
            if (tt === 2 /* TokenType.Punctuation */ && v === '}') {
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
            // Combined keyword handling for better performance
            if (tt === 1 /* TokenType.Keyword */) {
                // Handle `import type ...` and `export type ...`, `export interface ...`
                if (!context.isObjectLiteral && v === 'import') {
                    // This is a full type-only import, e.g., `import type { MyType } from './types';`
                    // We remove the entire statement.
                    // first find the 'from' token
                    i = skipUntil(tokens, i, t => (t.type === 1 /* TokenType.Keyword */ && t.value === 'from'));
                    // then skip until semicolon or newline
                    i = skipUntil(tokens, i, t => t.value === ';' || (t.type === 5 /* TokenType.Whitespace */ && t.value.includes("\n")));
                    if (i < tokens.length && tokens[i].value === ';')
                        i++;
                    continue;
                }
                // Handle `... as Type`
                if (v === 'as') {
                    // This is a type assertion, skip 'as' and the type name
                    i++; // skip 'as'
                    // Skip whitespace
                    i = skipUntil(tokens, i, t => t.type !== 5 /* TokenType.Whitespace */);
                    // Skip type declaration
                    i = skipType(tokens, i, false);
                    continue;
                }
                if (v === 'export' && !context.isObjectLiteral && (String(token.next?.value + token.next?.next?.value).match(/(const\s+)?(type|interface|enum|namespace|function)/))) {
                    // This is `export type ...` or `export interface ...`.
                    // We can let the dedicated `type`/`interface` handler remove the block.
                    // We just need to skip the `export` token itself.
                    i++; // Skip 'export'
                    // Also skip whitespace after 'export'
                    i = skipUntil(tokens, i, t => t.type !== 5 /* TokenType.Whitespace */);
                    // The next token will be 'type' or 'interface', which will be handled
                    // by the `interface`/`type` declaration removal logic below.
                    continue;
                }
                // Handle function overloads
                if (v === 'function' && token.next?.type === 0 /* TokenType.Identifier */ && token.next?.next?.type === 2 /* TokenType.Punctuation */ && token.next?.next?.value === '(' && token.next?.next?.next && token.next?.next?.next?.type === 0 /* TokenType.Identifier */) {
                    // It must have a parameter list and end with a semicolon
                    let j = i + 4; // Move to the token after '('
                    let depth = 1;
                    // Find the matching closing parenthesis
                    while (j < tokens.length && depth > 0) {
                        const t = tokens[j];
                        if (t.type === 2 /* TokenType.Punctuation */) {
                            if (t.value === '(')
                                depth++;
                            else if (t.value === ')')
                                depth--;
                        }
                        j++;
                    }
                    // Now j is at the token after the closing parenthesis
                    // Skip whitespace
                    j = skipUntil(tokens, j, t => t.type !== 5 /* TokenType.Whitespace */);
                    // If the next token is a colon, skip the return type
                    if (j < tokens.length && tokens[j].type === 2 /* TokenType.Punctuation */ && tokens[j].value === ':') {
                        j++; // Move past the colon
                        j = skipType(tokens, j, false);
                        // Skip any whitespace after return type
                        j = skipUntil(tokens, j, t => t.type !== 5 /* TokenType.Whitespace */);
                    }
                    if (j < tokens.length && tokens[j].type === 2 /* TokenType.Punctuation */ && tokens[j].value === ';') {
                        // This is an overload signature, skip it
                        i = j + 1; // Move past the semicolon
                        continue;
                    }
                }
            }
            // Handle interface and type declarations
            if (!context.isObjectLiteral && tt === 1 /* TokenType.Keyword */ && !isObjectLiteralStart(tokens, i) && hasItem(v, ['interface', 'type', 'declare', 'namespace', 'module'])) {
                if (v === 'type')
                    i = skipUntil(tokens, i, (t, ctx) => {
                        if (t.type === 2 /* TokenType.Punctuation */) {
                            if (hasItem(t.value, '<[({')) {
                                ctx.depth++;
                            }
                            else if (hasItem(t.value, '>])}')) {
                                ctx.depth--;
                            }
                        }
                        return ctx.depth <= 0 && t.type === 2 /* TokenType.Punctuation */ && t.value == '=';
                    }), i++;
                else
                    i++;
                i = skipType(tokens, i, true);
                continue;
            }
            if (!context.isObjectLiteral && tt === 1 /* TokenType.Keyword */ && v === 'implements' && token.next?.type !== 2 /* TokenType.Punctuation */ && !context.isObjectLiteral) {
                i++;
                i = skipUntil(tokens, i, t => t.type === 2 /* TokenType.Punctuation */ && t.value == '{');
                continue;
            }
            // Handle non-null assertion operator '!'
            if (tt === 2 /* TokenType.Punctuation */ && v === '!' && tokens[i - 1] && !hasItem(tokens[i - 1]?.type, [7 /* TokenType.Arrow */, 2 /* TokenType.Punctuation */])) {
                // Just skip the '!' operator
                i++;
                continue;
            }
            // Handle type assertion using : inside function declarations e.g fn(a: number) or fn(a: (x: T) => boolean)
            if (tt === 2 /* TokenType.Punctuation */ && v === '(') {
                // Copy opening parenthesis
                outputString += v;
                i++;
                let depth = 1;
                // Process function parameters
                while (i < tokens.length && depth > 0) {
                    const paramToken = tokens[i];
                    const pt = paramToken.type;
                    const pv = paramToken.value;
                    // Sometimes this is a function call, not a declaration, so if we see an object literal, we bail out
                    if (pt == 2 /* TokenType.Punctuation */ && pv == '{' && isObjectLiteralStart(tokens, i)) {
                        // We have a literal, we have to collect and parse forpossible types
                        const jk = skipUntil(tokens, i, (t, ctx) => {
                            if (t.type === 2 /* TokenType.Punctuation */) {
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
                    // Sometimes comment(Attribute) can appear inside a parameter list block
                    if (pt == 4 /* TokenType.Comment */) {
                        i++;
                        continue;
                    }
                    if (pt === 2 /* TokenType.Punctuation */ && pv === '(') {
                        depth++;
                    }
                    else if (pt === 2 /* TokenType.Punctuation */ && pv === ')') {
                        depth--;
                    }
                    // Deal with property promotion
                    if (pt === 1 /* TokenType.Keyword */ && hasItem(pv, visibility)) {
                        // Skip the modifier
                        i++;
                        if (tokens[i].type === 5 /* TokenType.Whitespace */)
                            i = skipUntil(tokens, i, t => t.type !== 5 /* TokenType.Whitespace */);
                        continue;
                    }
                    // Deal with non-null assertion in parameters
                    if (pt === 2 /* TokenType.Punctuation */ && pv === '!' && tokens[i - 1] && tokens[i - 1].type === 0 /* TokenType.Identifier */) {
                        // Skip the '!' operator
                        i++;
                        continue;
                    }
                    if ((pt === 2 /* TokenType.Punctuation */ && pv === ':') || (paramToken.next?.type === 8 /* TokenType.Conditional */) || (1 /* TokenType.Keyword */ === pt && pv == 'as')) {
                        // Skip type annotation
                        i++;
                        i = skipType(tokens, i, false);
                        continue;
                    }
                    // Add closing parenthesis
                    if (i < tokens.length && tokens[i].type === 2 /* TokenType.Punctuation */ && tokens[i].value === ')') {
                        outputString += tokens[i].value;
                        i++;
                        // Handle possible return type annotation
                        if (i < tokens.length && tokens[i].type === 2 /* TokenType.Punctuation */ && tokens[i].value === ':') {
                            // Skip return type annotation
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
            // Handle type annotations in variable declarations and class fields
            if (tt === 2 /* TokenType.Punctuation */ && v === ':' || (tt === 8 /* TokenType.Conditional */)) {
                if (token.prev && token.prev.type === 0 /* TokenType.Identifier */ && (token.prev.prev && token.prev.prev.type === 1 /* TokenType.Keyword */ && hasItem(token.prev.prev.value, ['let', 'const', 'var'])) || (token.prev && context.isClassBody)) {
                    // This is likely a type annotation, so we skip it and the following type
                    i++;
                    i = skipType(tokens, i, false);
                    continue;
                }
            }
            // Handle generics after identifiers
            if (tt === 2 /* TokenType.Punctuation */ && v === '<' && isGenericStartEnd(i, tokens)) {
                if (i < tokens.length) {
                    // Skip generics
                    let j = skipType(tokens, i, false);
                    if (tokens[j] && tokens[j].type === 5 /* TokenType.Whitespace */)
                        j = skipUntil(tokens, j, t => t.type !== 5 /* TokenType.Whitespace */);
                    let gt = tokens[j];
                    if (gt && gt.type == 2 /* TokenType.Punctuation */ && '({['.indexOf(gt.value) !== -1) {
                        i = j;
                        continue;
                    }
                }
            }
            // Handle modifiers like public, private, protected, static, abstract in class bodies
            if (!context.isObjectLiteral && tt === 1 /* TokenType.Keyword */ &&
                hasItem(v, visibility)) {
                // Skip the modifier
                i++;
                continue;
            }
            if (tt === 1 /* TokenType.Keyword */) {
                context.lastKeyword = token.value;
            }
            // Copy valid JS tokens to output
            outputString += v;
            i++;
        }
        return outputString.trim();
    }
    return skipTokens(tokens, 0, tokens.length);
}
export default stripTypes;
//# sourceMappingURL=strip-ts.js.map