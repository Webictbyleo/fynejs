#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

const inputFile = path.join(__dirname, 'dist', 'x-tool.js');
const outputFile = path.join(__dirname, 'dist', 'x-tool.super.min.js');

async function optimizeWithTerserOnly() {
    try {
        console.log('Starting Terser-only optimization...');
        
        const sourceCode = fs.readFileSync(inputFile, 'utf8');
        const originalSize = sourceCode.length;
        
        console.log(`Original size: ${originalSize.toLocaleString()} bytes`);
        
        // Ultra-aggressive Terser settings
        const terserOptions = {
            compress: {
                passes: 10, // More passes
                dead_code: true,
                drop_console: true,
                drop_debugger: true,
                pure_funcs: [
                    'console.log', 
                    'console.warn', 
                    'console.error', 
                    'console.debug',
                    'console.info',
                    'console.trace'
                ],
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
                inline: 10, // Very aggressive inlining
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
                sequences: 50, // Very aggressive sequences
                properties: true,
                comparisons: true,
                computed_props: true,
                arrows: true,
                keep_infinity: true,
                negate_iife: true,
                ecma: 2020, // Use latest ECMAScript features
                // Advanced optimizations
                module: false,
                toplevel: true,
                reduce_funcs: true,
                // Custom global definitions to inline constants
                global_defs: {
                    'FT_C': 'true',
                    'FT_TI': 'true',
                    '_FT_DR': 'true', 
                    'FT_IFB': 'true',
                    'FT_TR': 'true',
                    'XTOOL_ENABLE_STATIC_DIRECTIVES': 'true',
                    'typeof document': '"object"',
                    'typeof window': '"object"'
                }
            },
            mangle: {
                toplevel: true,
                eval: true,
                keep_fnames: false,
                properties: {
                    // Mangle private properties aggressively
                    regex: /^[_$]/,
                    reserved: []
                },
                reserved: ['XTool', 'FyneJS'] // Only keep the essential exports
            },
            format: {
                comments: false,
                beautify: false,
                ecma: 2020,
                semicolons: true,
                wrap_iife: false,
                ascii_only: false,
                shorthand: true,
                quote_style: 1, // Single quotes
                preserve_annotations: false
            },
            sourceMap: false,
            toplevel: true,
            nameCache: {},
            ie8: false,
            safari10: false,
            keep_fnames: false,
            keep_classnames: false,
            enclose: false
        };
        
        console.log('Running ultra-aggressive Terser minification...');
        const result = await minify(sourceCode, terserOptions);
        
        if (result.error) {
            throw result.error;
        }
        
        // Write the optimized code
        fs.writeFileSync(outputFile, result.code);
        
        const finalSize = result.code.length;
        const reduction = ((originalSize - finalSize) / originalSize * 100).toFixed(1);
        
        console.log(`\nOptimization complete!`);
        console.log(`Original size: ${originalSize.toLocaleString()} bytes`);
        console.log(`Optimized size: ${finalSize.toLocaleString()} bytes`);
        console.log(`Size reduction: ${reduction}%`);
        console.log(`Target 25KB: ${finalSize <= 25600 ? '✅ ACHIEVED' : '❌ ' + (finalSize - 25600) + ' bytes over'}`);
        
        // Compare with existing versions
        const comparisons = [
            { name: 'x-tool.min.js', path: path.join(__dirname, 'dist', 'x-tool.min.js') },
            { name: 'x-tool.tiny.min.js', path: path.join(__dirname, 'dist', 'x-tool.tiny.min.js') }
        ];
        
        for (const comp of comparisons) {
            if (fs.existsSync(comp.path)) {
                const existingSize = fs.statSync(comp.path).size;
                const improvement = ((existingSize - finalSize) / existingSize * 100).toFixed(1);
                console.log(`Improvement over ${comp.name}: ${improvement}%`);
            }
        }
        
        // Calculate how much more we need to reduce
        if (finalSize > 25600) {
            const bytesOver = finalSize - 25600;
            const percentageMore = (bytesOver / finalSize * 100).toFixed(1);
            console.log(`Need to reduce ${bytesOver} more bytes (${percentageMore}% reduction)`);
        }
        
        return { originalSize, finalSize, reduction: parseFloat(reduction) };
        
    } catch (error) {
        console.error('Optimization failed:', error);
        process.exit(1);
    }
}

optimizeWithTerserOnly();