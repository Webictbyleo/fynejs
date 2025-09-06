#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { minify } = require('terser');
const esbuild = require('esbuild');

const inputFile = path.join(__dirname, 'dist', 'x-tool.js');
const outputFile = path.join(__dirname, 'dist', 'x-tool.ultra.min.js');
const outputMapFile = path.join(__dirname, 'dist', 'x-tool.ultra.min.js.map');

async function createOptimizedBuild() {
    try {
        console.log('Starting ultra-optimization...');
        
        // Read the source file
        const sourceCode = fs.readFileSync(inputFile, 'utf8');
        
        console.log(`Input size: ${sourceCode.length} bytes`);
        
        // First pass: esbuild for tree-shaking and basic optimization
        console.log('Phase 1: ESBuild optimization...');
        const esbuildResult = await esbuild.transform(sourceCode, {
            minify: true,
            treeShaking: true,
            format: 'iife',
            target: 'es2018',
            keepNames: false,
            legalComments: 'none',
        });
        
        console.log(`After ESBuild: ${esbuildResult.code.length} bytes`);
        
        // Second pass: Terser with ultra-aggressive settings
        console.log('Phase 2: Terser ultra-optimization...');
        const terserOptions = {
            compress: {
                passes: 3,
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
                inline: 3,
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
                sequences: true,
                properties: true,
                comparisons: true,
                computed_props: true,
                arrows: true,
                keep_infinity: true,
                negate_iife: true,
                ecma: 2018
            },
            mangle: {
                toplevel: true,
                eval: true,
                keep_fnames: false,
                properties: {
                    regex: /^_/
                }
            },
            format: {
                comments: false,
                beautify: false,
                ecma: 2018,
                semicolons: true,
                wrap_iife: true,
                ascii_only: false,
                webkit: false,
                shorthand: true
            },
            sourceMap: {
                filename: 'x-tool.ultra.min.js',
                url: 'x-tool.ultra.min.js.map'
            },
            toplevel: true,
            nameCache: {},
            ie8: false,
            safari10: false,
            keep_fnames: false
        };
        
        const result = await minify(esbuildResult.code, terserOptions);
        
        if (result.error) {
            throw result.error;
        }
        
        // Write the minified code
        fs.writeFileSync(outputFile, result.code);
        
        // Write the source map
        if (result.map) {
            fs.writeFileSync(outputMapFile, result.map);
        }
        
        const finalSize = result.code.length;
        const originalSize = sourceCode.length;
        const reduction = ((originalSize - finalSize) / originalSize * 100).toFixed(1);
        
        console.log(`\nOptimization complete!`);
        console.log(`Original size: ${originalSize.toLocaleString()} bytes`);
        console.log(`Optimized size: ${finalSize.toLocaleString()} bytes`);
        console.log(`Size reduction: ${reduction}%`);
        console.log(`Target 25KB: ${finalSize <= 25600 ? '✅ ACHIEVED' : '❌ ' + (finalSize - 25600) + ' bytes over'}`);
        
        // Compare with existing minified versions
        const existingMinFile = path.join(__dirname, 'dist', 'x-tool.min.js');
        const existingTinyFile = path.join(__dirname, 'dist', 'x-tool.tiny.min.js');
        
        if (fs.existsSync(existingMinFile)) {
            const existingSize = fs.statSync(existingMinFile).size;
            const improvement = ((existingSize - finalSize) / existingSize * 100).toFixed(1);
            console.log(`Improvement over x-tool.min.js: ${improvement}%`);
        }
        
        if (fs.existsSync(existingTinyFile)) {
            const existingTinySize = fs.statSync(existingTinyFile).size;
            const tinyImprovement = ((existingTinySize - finalSize) / existingTinySize * 100).toFixed(1);
            console.log(`Improvement over x-tool.tiny.min.js: ${tinyImprovement}%`);
        }
        
    } catch (error) {
        console.error('Optimization failed:', error);
        process.exit(1);
    }
}

createOptimizedBuild();