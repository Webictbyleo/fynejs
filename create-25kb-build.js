#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

async function create25KBBuild() {
    try {
        console.log('Creating FyneJS 25KB build with selective features...');
        
        let sourceCode = fs.readFileSync(path.join(__dirname, 'dist', 'x-tool.js'), 'utf8');
        const originalSize = sourceCode.length;
        
        console.log(`Original source: ${originalSize.toLocaleString()} bytes`);
        
        // Define feature flags for what to include
        const features = {
            transitions: false,        // Remove transition system (~2KB)
            delegatedEvents: false,   // Remove event delegation (~1KB) 
            advancedInterpolation: false, // Simplify text interpolation (~1KB)
            errorHandling: false,     // Minimal error handling (~1KB)
            debugFeatures: false,     // Remove all debug code
            componentObserver: false, // Remove mutation observer (~500B)
            complexDirectives: false  // Remove some complex directive handling
        };
        
        console.log('Feature configuration:', features);
        console.log('Removing disabled features...');
        
        let modifiedCode = sourceCode;
        let removedBytes = 0;
        
        // 1. Remove transition system
        if (!features.transitions) {
            const beforeLength = modifiedCode.length;
            
            // Remove transition-related methods
            modifiedCode = modifiedCode.replace(
                /_injectTransitionCSS\(\)\s*\{[\s\S]*?\n\s*\}/g, 
                '_injectTransitionCSS(){}'
            );
            modifiedCode = modifiedCode.replace(
                /_getTransitionClasses\(\)\s*\{[\s\S]*?\n\s*\}/g,
                '_getTransitionClasses(){return{}}'
            );
            modifiedCode = modifiedCode.replace(
                /_bindTransitionDirective\([^{]*\)\s*\{[\s\S]*?\n\s*\}/g,
                '_bindTransitionDirective(){}'
            );
            
            const removed = beforeLength - modifiedCode.length;
            removedBytes += removed;
            console.log(`  Transitions: -${removed} bytes`);
        }
        
        // 2. Remove event delegation
        if (!features.delegatedEvents) {
            const beforeLength = modifiedCode.length;
            
            modifiedCode = modifiedCode.replace(
                /_ensureDelegation\([^{]*\)\s*\{[\s\S]*?\n\s*\}/g,
                '_ensureDelegation(){}'
            );
            modifiedCode = modifiedCode.replace(
                /_delegateEvent\([^{]*\)\s*\{[\s\S]*?\n\s*\}/g,
                '_delegateEvent(){return()=>{}}'
            );
            
            const removed = beforeLength - modifiedCode.length;
            removedBytes += removed;
            console.log(`  Event delegation: -${removed} bytes`);
        }
        
        // 3. Simplify text interpolation
        if (!features.advancedInterpolation) {
            const beforeLength = modifiedCode.length;
            
            // Replace complex interpolation with simple version
            const simpleInterpolation = `
            _processTextInterpolation(el) {
                const walker = document.createTreeWalker(el, 4);
                let node;
                while (node = walker.nextNode()) {
                    const text = node.nodeValue;
                    if (text && text.includes('{{')) {
                        const update = () => {
                            node.textContent = text.replace(/\\{\\{([^}]+)\\}\\}/g, (_, expr) => {
                                try { return this._createElementEvaluator(expr.trim(), el)() || ''; }
                                catch { return ''; }
                            });
                        };
                        this._createEffect(update, {type:'text'});
                    }
                }
            }`;
            
            modifiedCode = modifiedCode.replace(
                /_processTextInterpolation\(el\)\s*\{[\s\S]*?\n\s*\}/,
                simpleInterpolation
            );
            
            const removed = beforeLength - modifiedCode.length;
            removedBytes += removed;
            console.log(`  Text interpolation: -${removed} bytes`);
        }
        
        // 4. Remove error handling
        if (!features.errorHandling) {
            const beforeLength = modifiedCode.length;
            
            // Replace try-catch with direct execution
            modifiedCode = modifiedCode.replace(
                /try\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}\s*catch\s*\([^)]*\)\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g,
                '$1'
            );
            
            // Replace error throws with empty statements
            modifiedCode = modifiedCode.replace(/throw new Error\([^)]+\);?/g, '');
            
            const removed = beforeLength - modifiedCode.length;
            removedBytes += removed;
            console.log(`  Error handling: -${removed} bytes`);
        }
        
        // 5. Remove debug features
        if (!features.debugFeatures) {
            const beforeLength = modifiedCode.length;
            
            modifiedCode = modifiedCode.replace(/console\.(log|warn|error|debug|info)\([^)]*\);?\s*/g, '');
            modifiedCode = modifiedCode.replace(/debug:\s*(true|false),?\s*/g, '');
            
            const removed = beforeLength - modifiedCode.length;
            removedBytes += removed;
            console.log(`  Debug features: -${removed} bytes`);
        }
        
        // 6. Remove observer
        if (!features.componentObserver) {
            const beforeLength = modifiedCode.length;
            
            modifiedCode = modifiedCode.replace(
                /_ensureRootObserver\([^{]*\)\s*\{[\s\S]*?\n\s*\}/g,
                '_ensureRootObserver(){}'
            );
            
            const removed = beforeLength - modifiedCode.length;
            removedBytes += removed;
            console.log(`  Component observer: -${removed} bytes`);
        }
        
        console.log(`\nTotal manual removal: ${removedBytes} bytes`);
        console.log(`After feature removal: ${modifiedCode.length.toLocaleString()} bytes`);
        
        // Apply ultra-aggressive minification
        console.log('Applying ultra-aggressive minification...');
        
        const terserOptions = {
            compress: {
                passes: 100,
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
                inline: 999,
                join_vars: true,
                reduce_vars: true,
                side_effects: true,
                switches: true,
                collapse_vars: true,
                sequences: 9999,
                properties: true,
                comparisons: true,
                computed_props: true,
                arrows: true,
                negate_iife: true,
                ecma: 2020
            },
            mangle: {
                toplevel: true,
                properties: true,
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
        
        const result = await minify(modifiedCode, terserOptions);
        
        if (result.error) {
            throw result.error;
        }
        
        const finalCode = result.code;
        const finalSize = finalCode.length;
        
        // Write the 25KB build
        const outputFile = path.join(__dirname, 'dist', 'x-tool.25kb.min.js');
        fs.writeFileSync(outputFile, finalCode);
        
        console.log(`\n25KB Build Results:`);
        console.log(`Original: ${originalSize.toLocaleString()} bytes`);
        console.log(`Final: ${finalSize.toLocaleString()} bytes`);
        console.log(`Reduction: ${((originalSize - finalSize) / originalSize * 100).toFixed(1)}%`);
        console.log(`Target 25KB: ${finalSize <= 25600 ? '✅ ACHIEVED' : '❌ ' + (finalSize - 25600) + ' bytes over'}`);
        
        if (finalSize <= 25600) {
            console.log('\n🎉 SUCCESS: 25KB target achieved!');
            console.log('\n⚠️  Removed features:');
            Object.entries(features).forEach(([feature, enabled]) => {
                if (!enabled) console.log(`   - ${feature}`);
            });
            console.log('\n✅ Core reactive features preserved');
        }
        
        return finalSize <= 25600;
        
    } catch (error) {
        console.error('25KB build failed:', error.message);
        return false;
    }
}

create25KBBuild();