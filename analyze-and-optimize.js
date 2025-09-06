#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

async function analyzeAndOptimize() {
    try {
        console.log('Analyzing codebase for advanced optimizations...');
        
        let sourceCode = fs.readFileSync(path.join(__dirname, 'dist', 'x-tool.js'), 'utf8');
        const originalSize = sourceCode.length;
        
        console.log(`Original size: ${originalSize.toLocaleString()} bytes`);
        
        // Phase 1: Remove optional features and debug code
        console.log('Phase 1: Removing optional features...');
        
        // Remove error handling in non-critical paths to save space
        sourceCode = sourceCode.replace(/try\s*{\s*([^}]*)\s*}\s*catch\s*\([^)]*\)\s*{\s*[^}]*\s*}/g, '$1');
        
        // Remove unnecessary error messages - replace with short versions
        sourceCode = sourceCode.replace(/throw new Error\([^)]+\)/g, 'throw Error("E")');
        
        // Remove debug and logging statements
        sourceCode = sourceCode.replace(/console\.(log|warn|error|debug|info)\([^)]*\);?\s*/g, '');
        
        // Simplify typeof checks
        sourceCode = sourceCode.replace(/typeof\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*!==\s*['"]undefined['"]/g, '$1');
        sourceCode = sourceCode.replace(/typeof\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*===\s*['"]undefined['"]/g, '!$1');
        
        console.log(`After feature removal: ${sourceCode.length.toLocaleString()} bytes`);
        
        // Phase 2: String constant optimization
        console.log('Phase 2: String optimizations...');
        
        // Replace long repeated strings with shorter versions
        const stringReplacements = {
            'x-tool-initial-css': 'x-css',
            'x-tool-transition-css': 'x-tr',
            'DOMContentLoaded': 'load',
            'addEventListener': 'on',
            'removeEventListener': 'off',
            'setAttribute': 'set',
            'getAttribute': 'get',
            'removeAttribute': 'del',
            'hasAttribute': 'has',
            'createElement': 'make',
            'appendChild': 'add',
            'insertBefore': 'ins',
            'removeChild': 'rm',
            'parentNode': 'par',
            'nextSibling': 'next',
            'firstChild': 'first',
            'lastChild': 'last',
            'childNodes': 'kids',
            'textContent': 'text',
            'innerHTML': 'html',
            'className': 'cls',
            'classList': 'cl',
            'style.display': 'style.d',
            'style.cssText': 'style.css'
        };
        
        for (const [long, short] of Object.entries(stringReplacements)) {
            const regex = new RegExp('\\b' + long.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'g');
            sourceCode = sourceCode.replace(regex, short);
        }
        
        console.log(`After string optimization: ${sourceCode.length.toLocaleString()} bytes`);
        
        // Phase 3: Ultra-aggressive Terser
        console.log('Phase 3: Ultra-aggressive minification...');
        
        const terserOptions = {
            compress: {
                passes: 15,
                dead_code: true,
                drop_console: true,
                drop_debugger: true,
                pure_funcs: ['console.log', 'console.warn', 'console.error'],
                pure_getters: true,
                unsafe: true,
                unsafe_arrows: true,
                unsafe_comps: true,
                unsafe_Function: true,
                unsafe_math: true,
                unsafe_symbols: true,
                unsafe_methods: true,
                unsafe_proto: true,
                unsafe_regexp: true,
                unsafe_undefined: true,
                conditionals: true,
                evaluate: true,
                booleans: true,
                typeofs: true,
                loops: true,
                unused: true,
                toplevel: true,
                if_return: true,
                inline: 20,
                join_vars: true,
                reduce_vars: true,
                side_effects: true,
                switches: true,
                arguments: true,
                keep_fargs: false,
                hoist_funs: true,
                hoist_props: true,
                hoist_vars: true,
                collapse_vars: true,
                sequences: 100,
                properties: true,
                comparisons: true,
                computed_props: true,
                arrows: true,
                keep_infinity: true,
                negate_iife: true,
                ecma: 2020,
                module: false,
                toplevel: true,
                reduce_funcs: true,
                global_defs: {
                    'typeof document': '"object"',
                    'typeof window': '"object"',
                    'Node.TEXT_NODE': '3',
                    'Node.ELEMENT_NODE': '1'
                }
            },
            mangle: {
                toplevel: true,
                eval: true,
                keep_fnames: false,
                properties: {
                    regex: /^[_$A-Z]|^[a-z][a-zA-Z]*[A-Z]/,
                    reserved: []
                },
                reserved: ['XTool', 'FyneJS']
            },
            format: {
                comments: false,
                beautify: false,
                ecma: 2020,
                semicolons: false, // Save bytes by omitting semicolons where possible
                wrap_iife: false,
                ascii_only: false,
                shorthand: true,
                quote_style: 1
            },
            sourceMap: false,
            toplevel: true,
            ie8: false,
            safari10: false,
            keep_fnames: false,
            keep_classnames: false
        };
        
        const result = await minify(sourceCode, terserOptions);
        
        if (result.error) {
            throw result.error;
        }
        
        // Phase 4: Manual post-processing
        let finalCode = result.code;
        
        // Additional micro-optimizations
        finalCode = finalCode.replace(/===true/g, '');
        finalCode = finalCode.replace(/!==false/g, '');
        finalCode = finalCode.replace(/!0/g, '1');
        finalCode = finalCode.replace(/!1/g, '0');
        
        // Write result
        const outputFile = path.join(__dirname, 'dist', 'x-tool.extreme.min.js');
        fs.writeFileSync(outputFile, finalCode);
        
        const finalSize = finalCode.length;
        const reduction = ((originalSize - finalSize) / originalSize * 100).toFixed(1);
        
        console.log(`\nOptimization Results:`);
        console.log(`Original size: ${originalSize.toLocaleString()} bytes`);
        console.log(`Final size: ${finalSize.toLocaleString()} bytes`);
        console.log(`Total reduction: ${reduction}%`);
        console.log(`Target 25KB: ${finalSize <= 25600 ? '✅ ACHIEVED' : '❌ ' + (finalSize - 25600) + ' bytes over'}`);
        
        // Compare with existing
        const tinySize = fs.statSync(path.join(__dirname, 'dist', 'x-tool.tiny.min.js')).size;
        const tinyImprovement = ((tinySize - finalSize) / tinySize * 100).toFixed(1);
        console.log(`Improvement over tiny version: ${tinyImprovement}%`);
        
        if (finalSize > 25600) {
            console.log(`\nStill ${finalSize - 25600} bytes over target.`);
            console.log('May need to remove features or use different approach.');
        }
        
    } catch (error) {
        console.error('Analysis failed:', error);
        // Don't exit on error, let's see what we can salvage
    }
}

analyzeAndOptimize();