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
        
        // Phase 1: Pre-processing optimizations
        console.log('Phase 1: Source code optimizations...');
        
        // Remove feature flags and hardcode them as true/false
        sourceCode = sourceCode.replace(/typeof __FEAT_TEXT_INTERP__ === 'boolean' \? __FEAT_TEXT_INTERP__ : true/g, 'true');
        sourceCode = sourceCode.replace(/typeof __FEAT_DEEP_REACTIVE__ === 'boolean' \? __FEAT_DEEP_REACTIVE__ : true/g, 'true');
        sourceCode = sourceCode.replace(/typeof __FEAT_IF_BRANCHES__ === 'boolean' \? __FEAT_IF_BRANCHES__ : true/g, 'true');
        sourceCode = sourceCode.replace(/typeof __FEAT_TRANSITION__ === 'boolean' \? __FEAT_TRANSITION__ : true/g, 'true');
        
        // Inline feature flag constants
        sourceCode = sourceCode.replace(/const FT_C = true;/g, '');
        sourceCode = sourceCode.replace(/const FT_TI = true;/g, '');
        sourceCode = sourceCode.replace(/const _FT_DR = true;/g, '');
        sourceCode = sourceCode.replace(/const FT_IFB = true;/g, '');
        sourceCode = sourceCode.replace(/const FT_TR = true;/g, '');
        
        // Replace usage of feature flags with literals
        sourceCode = sourceCode.replace(/\bFT_C\b/g, '1');
        sourceCode = sourceCode.replace(/\bFT_TI\b/g, '1');
        sourceCode = sourceCode.replace(/\b_FT_DR\b/g, '1');
        sourceCode = sourceCode.replace(/\bFT_IFB\b/g, '1');
        sourceCode = sourceCode.replace(/\bFT_TR\b/g, '1');
        
        // Inline commonly used string constants
        sourceCode = sourceCode.replace(/const STR_STYLE = 'style';/g, '');
        sourceCode = sourceCode.replace(/const STR_DISPLAY = 'display';/g, '');
        sourceCode = sourceCode.replace(/const STR_NONE = 'none';/g, '');
        sourceCode = sourceCode.replace(/const STR_TAGNAME = 'tagName';/g, '');
        sourceCode = sourceCode.replace(/const STR_TEMPLATE = 'TEMPLATE';/g, '');
        sourceCode = sourceCode.replace(/const STR_LENGTH = 'length';/g, '');
        
        sourceCode = sourceCode.replace(/\bSTR_STYLE\b/g, '"style"');
        sourceCode = sourceCode.replace(/\bSTR_DISPLAY\b/g, '"display"');
        sourceCode = sourceCode.replace(/\bSTR_NONE\b/g, '"none"');
        sourceCode = sourceCode.replace(/\bSTR_TAGNAME\b/g, '"tagName"');
        sourceCode = sourceCode.replace(/\bSTR_TEMPLATE\b/g, '"TEMPLATE"');
        sourceCode = sourceCode.replace(/\bSTR_LENGTH\b/g, '"length"');
        
        // Inline simple utility functions
        sourceCode = sourceCode.replace(/const _Afrom = Array\.from;/g, '');
        sourceCode = sourceCode.replace(/const _AisArr = ARRAY_ISARRAY;/g, '');
        sourceCode = sourceCode.replace(/const _Okeys = Object\.keys;/g, '');
        sourceCode = sourceCode.replace(/const _logErr = \(\.\.\.\_args\) => \{ \};/g, '');
        
        sourceCode = sourceCode.replace(/\b_Afrom\b/g, 'Array.from');
        sourceCode = sourceCode.replace(/\b_AisArr\b/g, 'Array.isArray');
        sourceCode = sourceCode.replace(/\b_Okeys\b/g, 'Object.keys');
        sourceCode = sourceCode.replace(/\b_logErr\(/g, '(()=>{throw new Error(');
        
        // Remove ARRAY_ISARRAY constant
        sourceCode = sourceCode.replace(/const ARRAY_ISARRAY = Array\.isArray;/g, '');
        sourceCode = sourceCode.replace(/\bARRAY_ISARRAY\b/g, 'Array.isArray');
        
        // Simplify some conditionals
        sourceCode = sourceCode.replace(/\btypeof document !== 'undefined' \? document : null/g, 'document||null');
        sourceCode = sourceCode.replace(/\btypeof window !== 'undefined'/g, 'typeof window!="undefined"');
        
        // Remove debug-related code
        sourceCode = sourceCode.replace(/console\.(log|warn|error|debug)\([^)]*\);?/g, '');
        sourceCode = sourceCode.replace(/debug:\s*false,/g, '');
        sourceCode = sourceCode.replace(/debug:\s*true,/g, '');
        
        // Shorten some common variable names in source
        sourceCode = sourceCode.replace(/\belement\b/g, 'el');
        sourceCode = sourceCode.replace(/\bcomponent\b/g, 'comp');
        sourceCode = sourceCode.replace(/\bdirective\b/g, 'dir');
        sourceCode = sourceCode.replace(/\bexpression\b/g, 'expr');
        
        console.log(`After preprocessing: ${sourceCode.length.toLocaleString()} bytes`);
        
        // Phase 2: Aggressive Terser minification
        console.log('Phase 2: Aggressive minification...');
        
        const terserOptions = {
            compress: {
                passes: 4,
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
                inline: 4,
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
                sequences: 10,
                properties: true,
                comparisons: true,
                computed_props: true,
                arrows: true,
                keep_infinity: true,
                negate_iife: true,
                ecma: 2018,
                // Custom transformations
                global_defs: {
                    'typeof document': '"object"',
                    'typeof window': '"object"'
                }
            },
            mangle: {
                toplevel: true,
                eval: true,
                keep_fnames: false,
                properties: {
                    regex: /^[_$]/
                },
                reserved: ['XTool', 'FyneJS'] // Keep main export names
            },
            format: {
                comments: false,
                beautify: false,
                ecma: 2018,
                semicolons: true,
                wrap_iife: true,
                ascii_only: false,
                shorthand: true
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
        
        // Phase 3: Post-processing optimizations  
        console.log('Phase 3: Post-processing...');
        let finalCode = result.code;
        
        // Additional string optimizations
        finalCode = finalCode.replace(/"style"/g, '"style"');
        finalCode = finalCode.replace(/"display"/g, '"display"');
        finalCode = finalCode.replace(/"none"/g, '"none"');
        
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
        
    } catch (error) {
        console.error('Optimization failed:', error);
        process.exit(1);
    }
}

optimizeSource();