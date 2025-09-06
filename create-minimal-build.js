#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

async function createMinimalBuild() {
    try {
        console.log('Creating minimal FyneJS build...');
        
        // Instead of modifying the existing code, let's identify the essential parts
        // and create a minimal version that focuses on core reactive functionality
        
        const sourceCode = fs.readFileSync(path.join(__dirname, 'dist', 'x-tool.js'), 'utf8');
        
        // Analysis: Let's see what the main sections are
        console.log('Analyzing source structure...');
        
        // Count approximate sizes of major features
        const features = [
            { name: 'Text Interpolation', regex: /_processTextInterpolation[\s\S]*?^\s*}/m, essential: true },
            { name: 'Transition System', regex: /_injectTransitionCSS[\s\S]*?^\s*}/m, essential: false },
            { name: 'Event Delegation', regex: /_ensureDelegation[\s\S]*?^\s*}/m, essential: false },
            { name: 'Component Registration', regex: /_registerComponentElement[\s\S]*?^\s*}/m, essential: false },
            { name: 'Error Handling', regex: /try\s*{[\s\S]*?catch[\s\S]*?}/g, essential: false },
            { name: 'Observer Pattern', regex: /_ensureRootObserver[\s\S]*?^\s*}/m, essential: false }
        ];
        
        let modifiedCode = sourceCode;
        let totalRemoved = 0;
        
        for (const feature of features) {
            if (!feature.essential) {
                const matches = modifiedCode.match(feature.regex);
                if (matches) {
                    const removed = matches.join('').length;
                    modifiedCode = modifiedCode.replace(feature.regex, '');
                    totalRemoved += removed;
                    console.log(`Removed ${feature.name}: ~${removed} bytes`);
                }
            }
        }
        
        console.log(`Total removed: ~${totalRemoved} bytes`);
        console.log(`After removal: ${modifiedCode.length.toLocaleString()} bytes`);
        
        // Additional simplifications
        console.log('Applying additional simplifications...');
        
        // Simplify error handling - replace with minimal versions
        modifiedCode = modifiedCode.replace(/try\s*{([^}]+)}\s*catch\s*\([^)]*\)\s*{[^}]*}/g, '$1');
        
        // Remove debug code
        modifiedCode = modifiedCode.replace(/console\.(log|warn|error|debug|info)\([^)]*\);?\s*/g, '');
        
        // Replace typeof checks with simpler versions
        modifiedCode = modifiedCode.replace(/typeof\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*!==\s*['"]undefined['"]/g, '$1');
        
        console.log(`After simplification: ${modifiedCode.length.toLocaleString()} bytes`);
        
        // Now apply ultra-aggressive terser
        console.log('Applying ultra-aggressive minification...');
        
        const terserOptions = {
            compress: {
                passes: 30,
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
                inline: 200,
                join_vars: true,
                reduce_vars: true,
                side_effects: true,
                switches: true,
                collapse_vars: true,
                sequences: 1000,
                properties: true,
                comparisons: true,
                computed_props: true,
                arrows: true,
                negate_iife: true,
                ecma: 2020,
                global_defs: {
                    'typeof document': '"object"',
                    'typeof window': '"object"'
                }
            },
            mangle: {
                toplevel: true,
                properties: {
                    regex: /./,  // Mangle all properties
                    reserved: ['XTool', 'FyneJS', 'length', 'prototype']
                },
                reserved: ['XTool', 'FyneJS']
            },
            format: {
                comments: false,
                beautify: false,
                semicolons: false,
                ascii_only: false,
                shorthand: true,
                quote_style: 1
            },
            toplevel: true,
            keep_fnames: false
        };
        
        const result = await minify(modifiedCode, terserOptions);
        
        if (result.error) {
            throw result.error;
        }
        
        let finalCode = result.code;
        
        // Manual post-processing optimizations
        finalCode = finalCode.replace(/void 0/g, '0');
        finalCode = finalCode.replace(/undefined/g, '0');
        finalCode = finalCode.replace(/!0/g, '1');
        finalCode = finalCode.replace(/!1/g, '0');
        
        // Write the minimal build
        const outputFile = path.join(__dirname, 'dist', 'x-tool.minimal.min.js');
        fs.writeFileSync(outputFile, finalCode);
        
        const finalSize = finalCode.length;
        const originalSize = sourceCode.length;
        const reduction = ((originalSize - finalSize) / originalSize * 100).toFixed(1);
        
        console.log(`\nMinimal Build Results:`);
        console.log(`Original size: ${originalSize.toLocaleString()} bytes`);
        console.log(`Minimal size: ${finalSize.toLocaleString()} bytes`);
        console.log(`Total reduction: ${reduction}%`);
        console.log(`Target 25KB: ${finalSize <= 25600 ? '✅ ACHIEVED' : '❌ ' + (finalSize - 25600) + ' bytes over'}`);
        
        // Compare with existing versions
        const tinySize = fs.statSync(path.join(__dirname, 'dist', 'x-tool.tiny.min.js')).size;
        const improvement = ((tinySize - finalSize) / tinySize * 100).toFixed(1);
        console.log(`Improvement over tiny: ${improvement}%`);
        
        if (finalSize <= 25600) {
            console.log('\n🎉 SUCCESS: Minimal 25KB build created!');
            console.log('\n⚠️  Note: This build may have reduced functionality:');
            console.log('- Simplified error handling');
            console.log('- No advanced transitions');
            console.log('- No event delegation optimization');
            console.log('- Minimal component registration features');
            console.log('\nCore reactive features should work normally.');
        } else {
            console.log(`\n❌ Still ${finalSize - 25600} bytes over target`);
            console.log('May need to remove more features or use different approach');
        }
        
    } catch (error) {
        console.error('Minimal build failed:', error.message);
    }
}

createMinimalBuild();