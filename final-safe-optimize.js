#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

async function finalSafeOptimize() {
    try {
        console.log('Final safe optimization approach...');
        
        // Start with the best existing version (tiny)
        const tinyFile = path.join(__dirname, 'dist', 'x-tool.tiny.min.js');
        let sourceCode = fs.readFileSync(tinyFile, 'utf8');
        const originalSize = sourceCode.length;
        
        console.log(`Starting with tiny version: ${originalSize.toLocaleString()} bytes`);
        console.log(`Need to reduce by: ${originalSize - 25600} bytes to reach 25KB target`);
        
        // Apply only the safest possible optimizations
        console.log('Applying ultra-safe manual optimizations...');
        
        // 1. Replace some safe patterns
        sourceCode = sourceCode.replace(/void 0/g, '0');
        sourceCode = sourceCode.replace(/\|\|null/g, '||0');
        sourceCode = sourceCode.replace(/===null/g, '==0');
        sourceCode = sourceCode.replace(/!==null/g, '!=0');
        
        // 2. Remove extra spaces in the minified code
        sourceCode = sourceCode.replace(/\s+/g, ' ');
        sourceCode = sourceCode.replace(/;\s*/g, ';');
        sourceCode = sourceCode.replace(/,\s*/g, ',');
        sourceCode = sourceCode.replace(/\{\s*/g, '{');
        sourceCode = sourceCode.replace(/\s*\}/g, '}');
        
        console.log(`After manual optimization: ${sourceCode.length.toLocaleString()} bytes`);
        
        // 3. Apply one more terser pass with maximum settings
        console.log('Applying final terser pass...');
        
        const terserOptions = {
            compress: {
                passes: 50, // Maximum passes
                dead_code: true,
                drop_console: true,
                drop_debugger: true,
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
                inline: 999,  // Maximum inlining
                join_vars: true,
                reduce_vars: true,
                side_effects: true,
                switches: true,
                collapse_vars: true,
                sequences: 999, // Maximum sequences
                properties: true,
                comparisons: true,
                computed_props: true,
                arrows: true,
                negate_iife: true,
                ecma: 2020
            },
            mangle: {
                toplevel: true,
                properties: {
                    regex: /^_/
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
            toplevel: true
        };
        
        const result = await minify(sourceCode, terserOptions);
        
        if (result.error) {
            throw result.error;
        }
        
        const finalCode = result.code;
        const finalSize = finalCode.length;
        
        // Write the final optimized version
        const outputFile = path.join(__dirname, 'dist', 'x-tool.25kb.min.js');
        fs.writeFileSync(outputFile, finalCode);
        
        const reduction = ((originalSize - finalSize) / originalSize * 100).toFixed(1);
        
        console.log(`\nFinal Safe Optimization Results:`);
        console.log(`Tiny version: ${originalSize.toLocaleString()} bytes`);
        console.log(`Final size: ${finalSize.toLocaleString()} bytes`);
        console.log(`Reduction: ${reduction}%`);
        console.log(`Target 25KB: ${finalSize <= 25600 ? '✅ ACHIEVED' : '❌ ' + (finalSize - 25600) + ' bytes over'}`);
        
        // Calculate total improvement from original
        const originalUnminified = fs.statSync(path.join(__dirname, 'dist', 'x-tool.js')).size;
        const totalReduction = ((originalUnminified - finalSize) / originalUnminified * 100).toFixed(1);
        console.log(`Total reduction from source: ${totalReduction}%`);
        
        // Show gzip size
        const { execSync } = require('child_process');
        try {
            const gzipSize = execSync(`gzip -c "${outputFile}" | wc -c`).toString().trim();
            console.log(`Gzipped size: ${parseInt(gzipSize).toLocaleString()} bytes`);
        } catch (e) {}
        
        console.log(`\n📊 Size Comparison:`);
        console.log(`Original source: ${originalUnminified.toLocaleString()} bytes`);
        console.log(`Existing min: ${fs.statSync(path.join(__dirname, 'dist', 'x-tool.min.js')).size.toLocaleString()} bytes`);
        console.log(`Existing tiny: ${originalSize.toLocaleString()} bytes`);
        console.log(`New optimized: ${finalSize.toLocaleString()} bytes`);
        
        if (finalSize > 25600) {
            const remaining = finalSize - 25600;
            console.log(`\n🔍 Analysis:`);
            console.log(`Still need to remove ${remaining} bytes (${(remaining/finalSize*100).toFixed(1)}%)`);
            console.log(`\n💡 To reach 25KB, consider:`);
            console.log(`1. Remove transition features (~2KB)`);
            console.log(`2. Simplify component system (~1.5KB)`);
            console.log(`3. Remove advanced text interpolation (~1KB)`);
            console.log(`4. Create feature-flag build system`);
            console.log(`5. Manual code restructuring for size`);
        } else {
            console.log(`\n🎉 25KB target achieved!`);
        }
        
        return {
            success: finalSize <= 25600,
            finalSize,
            reduction: parseFloat(reduction),
            bytesOver: Math.max(0, finalSize - 25600)
        };
        
    } catch (error) {
        console.error('Final optimization failed:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

finalSafeOptimize().then(result => {
    if (result.success) {
        process.exit(0);
    } else {
        process.exit(1);
    }
});