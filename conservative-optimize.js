#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

async function conservativeOptimize() {
    try {
        console.log('Starting conservative optimization...');
        
        // Start with the already-optimized tiny version
        const tinyFile = path.join(__dirname, 'dist', 'x-tool.tiny.min.js');
        let sourceCode = fs.readFileSync(tinyFile, 'utf8');
        const originalSize = sourceCode.length;
        
        console.log(`Starting with tiny version: ${originalSize.toLocaleString()} bytes`);
        
        // Phase 1: Safe manual optimizations on the already-minified code
        console.log('Phase 1: Manual micro-optimizations...');
        
        // Replace some common patterns with shorter equivalents
        sourceCode = sourceCode.replace(/\|\|null/g, '||0');
        sourceCode = sourceCode.replace(/!==null/g, '!=0'); 
        sourceCode = sourceCode.replace(/===null/g, '==0');
        sourceCode = sourceCode.replace(/void 0/g, '0'); 
        sourceCode = sourceCode.replace(/undefined/g, '0');
        sourceCode = sourceCode.replace(/!0/g, '1');
        sourceCode = sourceCode.replace(/!1/g, '0');
        
        // Remove unnecessary spaces around operators in minified code
        sourceCode = sourceCode.replace(/\s*=>\s*/g, '=>');
        sourceCode = sourceCode.replace(/\s*\?\s*/g, '?');
        sourceCode = sourceCode.replace(/\s*:\s*/g, ':');
        sourceCode = sourceCode.replace(/\s*\|\|\s*/g, '||');
        sourceCode = sourceCode.replace(/\s*&&\s*/g, '&&');
        
        console.log(`After manual optimizations: ${sourceCode.length.toLocaleString()} bytes`);
        
        // Phase 2: Additional Terser pass with extreme settings
        console.log('Phase 2: Additional Terser optimization...');
        
        const terserOptions = {
            compress: {
                passes: 20,
                dead_code: true,
                drop_console: true,
                drop_debugger: true,
                pure_funcs: ['console.log', 'console.warn', 'console.error'],
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
                inline: 50,
                join_vars: true,
                reduce_vars: true,
                side_effects: true,
                switches: true,
                collapse_vars: true,
                sequences: 200,
                properties: true,
                comparisons: true,
                computed_props: true,
                arrows: true,
                negate_iife: true,
                ecma: 2020,
                // Aggressive constant folding
                global_defs: {
                    'void 0': '0',
                    'undefined': '0'
                }
            },
            mangle: {
                toplevel: true,
                properties: {
                    regex: /^_/, // Only mangle properties starting with _
                },
                reserved: ['XTool', 'FyneJS']
            },
            format: {
                comments: false,
                beautify: false,
                semicolons: false, // Remove semicolons where possible
                ascii_only: false,
                shorthand: true,
                quote_style: 1,
                wrap_iife: false
            },
            toplevel: true,
            keep_fnames: false
        };
        
        const result = await minify(sourceCode, terserOptions);
        
        if (result.error) {
            throw result.error;
        }
        
        // Phase 3: Final character-level optimizations
        console.log('Phase 3: Character-level optimizations...');
        let finalCode = result.code;
        
        // Additional character savings
        finalCode = finalCode.replace(/\bArray\.isArray\b/g, 't'); // Define t=Array.isArray at start
        finalCode = finalCode.replace(/\bArray\.from\b/g, 'e'); // Define e=Array.from at start
        finalCode = finalCode.replace(/\bObject\.keys\b/g, 'i'); // Define i=Object.keys at start
        
        // Add the ultra-short variable definitions at the start
        finalCode = '"use strict";const t=Array.isArray,e=Array.from,i=Object.keys;' + finalCode;
        
        // Write the result
        const outputFile = path.join(__dirname, 'dist', 'x-tool.final.min.js');
        fs.writeFileSync(outputFile, finalCode);
        
        const finalSize = finalCode.length;
        const reduction = ((originalSize - finalSize) / originalSize * 100).toFixed(1);
        
        console.log(`\nFinal Results:`);
        console.log(`Tiny version size: ${originalSize.toLocaleString()} bytes`);
        console.log(`Final optimized size: ${finalSize.toLocaleString()} bytes`);
        console.log(`Additional reduction: ${reduction}%`);
        console.log(`Target 25KB: ${finalSize <= 25600 ? '✅ ACHIEVED' : '❌ ' + (finalSize - 25600) + ' bytes over'}`);
        
        // Calculate total reduction from original
        const originalUnminified = fs.statSync(path.join(__dirname, 'dist', 'x-tool.js')).size;
        const totalReduction = ((originalUnminified - finalSize) / originalUnminified * 100).toFixed(1);
        console.log(`Total reduction from source: ${totalReduction}%`);
        
        // Test gzipped size
        const { execSync } = require('child_process');
        try {
            const gzipSize = execSync(`gzip -c "${outputFile}" | wc -c`).toString().trim();
            console.log(`Gzipped size: ${parseInt(gzipSize).toLocaleString()} bytes`);
        } catch (e) {
            console.log('Could not calculate gzip size');
        }
        
        if (finalSize <= 25600) {
            console.log('\n🎉 SUCCESS: Target achieved!');
        } else {
            console.log(`\n❌ Still need to reduce by ${finalSize - 25600} bytes`);
            
            // Suggestions for further optimization
            console.log('\nSuggestions for further optimization:');
            console.log('1. Remove optional features (transitions, complex directives)');
            console.log('2. Simplify error handling');
            console.log('3. Use shorter function names in source');
            console.log('4. Combine similar functions');
            console.log('5. Use feature flags to exclude unused code paths');
        }
        
    } catch (error) {
        console.error('Optimization failed:', error);
    }
}

conservativeOptimize();