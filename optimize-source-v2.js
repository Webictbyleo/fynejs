#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

const inputFile = path.join(__dirname, 'dist', 'x-tool.js');
const outputFile = path.join(__dirname, 'dist', 'x-tool.optimized.min.js');

async function optimizeSource() {
    try {
        console.log('Starting targeted optimization...');
        
        let sourceCode = fs.readFileSync(inputFile, 'utf8');
        const originalSize = sourceCode.length;
        
        console.log(`Original size: ${originalSize.toLocaleString()} bytes`);
        
        // Phase 1: Safe pre-processing optimizations
        console.log('Phase 1: Source code optimizations...');
        
        // Remove feature flags and hardcode them as true
        sourceCode = sourceCode.replace(/typeof __FEAT_TEXT_INTERP__ === 'boolean' \? __FEAT_TEXT_INTERP__ : true/g, 'true');
        sourceCode = sourceCode.replace(/typeof __FEAT_DEEP_REACTIVE__ === 'boolean' \? __FEAT_DEEP_REACTIVE__ : true/g, 'true');
        sourceCode = sourceCode.replace(/typeof __FEAT_IF_BRANCHES__ === 'boolean' \? __FEAT_IF_BRANCHES__ : true/g, 'true');
        sourceCode = sourceCode.replace(/typeof __FEAT_TRANSITION__ === 'boolean' \? __FEAT_TRANSITION__ : true/g, 'true');
        
        // Remove debug-related code patterns
        sourceCode = sourceCode.replace(/console\.(log|warn|error|debug)\([^)]*\);?\s*/g, '');
        
        // Replace common constants inline where safe
        sourceCode = sourceCode.replace(/\bSTR_STYLE\b/g, '"style"');
        sourceCode = sourceCode.replace(/\bSTR_DISPLAY\b/g, '"display"');
        sourceCode = sourceCode.replace(/\bSTR_NONE\b/g, '"none"');
        sourceCode = sourceCode.replace(/\bSTR_TAGNAME\b/g, '"tagName"');
        sourceCode = sourceCode.replace(/\bSTR_TEMPLATE\b/g, '"TEMPLATE"');
        sourceCode = sourceCode.replace(/\bSTR_LENGTH\b/g, '"length"');
        
        // Simplify some safe expressions
        sourceCode = sourceCode.replace(/typeof document !== 'undefined' \? document : null/g, 'document||null');
        
        console.log(`After preprocessing: ${sourceCode.length.toLocaleString()} bytes`);
        
        // Phase 2: Ultra-aggressive Terser minification
        console.log('Phase 2: Ultra-aggressive minification...');
        
        const terserOptions = {
            compress: {
                passes: 5,
                dead_code: true,
                drop_console: true,
                drop_debugger: true,
                pure_funcs: ['console.log', 'console.warn', 'console.error', 'console.debug'],
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
                inline: 5,
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
                sequences: 20,
                properties: true,
                comparisons: true,
                computed_props: true,
                arrows: true,
                keep_infinity: true,
                negate_iife: true,
                ecma: 2018,
                // Compress constants
                global_defs: {
                    'ARRAY_ISARRAY': 'Array.isArray'
                }
            },
            mangle: {
                toplevel: true,
                eval: true,
                keep_fnames: false,
                properties: {
                    regex: /^[_$A-Z]/,
                    reserved: ['XTool', 'FyneJS', 'XToolFramework', 'ReactiveComponent']
                },
                reserved: ['XTool', 'FyneJS']
            },
            format: {
                comments: false,
                beautify: false,
                ecma: 2018,
                semicolons: true,
                wrap_iife: true,
                ascii_only: false,
                shorthand: true,
                quote_style: 1 // prefer single quotes
            },
            sourceMap: false,
            toplevel: true,
            nameCache: {},
            ie8: false,
            safari10: false,
            keep_fnames: false
        };
        
        const result = await minify(sourceCode, terserOptions);
        
        if (result.error) {
            throw result.error;
        }
        
        // Phase 3: Final post-processing
        console.log('Phase 3: Post-processing...');
        let finalCode = result.code;
        
        // Manual string optimizations
        finalCode = finalCode.replace(/\|\|null/g, '||0');
        finalCode = finalCode.replace(/!==null/g, '');
        finalCode = finalCode.replace(/===null/g, '==0');
        
        // Write the optimized code
        fs.writeFileSync(outputFile, finalCode);
        
        const finalSize = finalCode.length;
        const reduction = ((originalSize - finalSize) / originalSize * 100).toFixed(1);
        
        console.log(`\nOptimization complete!`);
        console.log(`Original size: ${originalSize.toLocaleString()} bytes`);
        console.log(`Optimized size: ${finalSize.toLocaleString()} bytes`);
        console.log(`Size reduction: ${reduction}%`);
        console.log(`Target 25KB: ${finalSize <= 25600 ? '✅ ACHIEVED' : '❌ ' + (finalSize - 25600) + ' bytes over'}`);
        
        // Compare with existing versions
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
        
        return { originalSize, finalSize, reduction: parseFloat(reduction) };
        
    } catch (error) {
        console.error('Optimization failed:', error);
        process.exit(1);
    }
}

optimizeSource();