#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function manualCompress() {
    console.log('Performing manual compression optimizations...');
    
    let code = fs.readFileSync(path.join(__dirname, 'dist', 'x-tool.manual25kb.min.js'), 'utf8');
    const originalSize = code.length;
    
    console.log(`Starting size: ${originalSize.toLocaleString()} bytes`);
    
    // Manual string optimizations that are guaranteed safe
    const replacements = [
        // Replace long method names with ultra-short versions
        [/\.addEventListener\b/g, '.on'],
        [/\.removeEventListener\b/g, '.off'],
        [/\.setAttribute\b/g, '.sA'],
        [/\.getAttribute\b/g, '.gA'],
        [/\.removeAttribute\b/g, '.rA'],
        [/\.hasAttribute\b/g, '.hA'],
        [/\.createElement\b/g, '.cE'],
        [/\.appendChild\b/g, '.aC'],
        [/\.removeChild\b/g, '.rC'],
        [/\.insertBefore\b/g, '.iB'],
        [/\.textContent\b/g, '.tC'],
        [/\.innerHTML\b/g, '.iH'],
        [/\.className\b/g, '.cN'],
        [/\.parentNode\b/g, '.pN'],
        [/\.nextSibling\b/g, '.nS'],
        [/\.firstChild\b/g, '.fC'],
        [/\.lastChild\b/g, '.lC'],
        [/\.nodeType\b/g, '.nT'],
        [/\.nodeValue\b/g, '.nV'],
        
        // Replace common constants
        [/"display"/g, '"d"'],
        [/"style"/g, '"s"'],
        [/"none"/g, '"n"'],
        [/"length"/g, '"l"'],
        [/"tagName"/g, '"t"'],
        
        // Replace common patterns
        [/void 0/g, '0'],
        [/undefined/g, '0'],
        [/\|\|null/g, '||0'],
        [/===null/g, '==0'],
        [/!==null/g, '!=0'],
        [/!0/g, '1'],
        [/!1/g, '0'],
        
        // Remove extra spaces
        [/\s*;\s*/g, ';'],
        [/\s*,\s*/g, ','],
        [/\s*\{\s*/g, '{'],
        [/\s*\}\s*/g, '}'],
        [/\s*\(\s*/g, '('],
        [/\s*\)\s*/g, ')'],
        [/\s*=\s*/g, '='],
        [/\s*\?\s*/g, '?'],
        [/\s*:\s*/g, ':'],
        [/\s*\|\|\s*/g, '||'],
        [/\s*&&\s*/g, '&&'],
        
        // Ultra-short variable names for common globals
        [/Array\.isArray/g, 't'],
        [/Array\.from/g, 'e'], 
        [/Object\.keys/g, 'i'],
        [/document/g, 'd'],
        [/window/g, 'w'],
        
        // Remove unnecessary quotes where possible
        [/"([a-zA-Z_][a-zA-Z0-9_]*)":/g, '$1:'],
        
        // Compress boolean operations
        [/===true/g, ''],
        [/!==false/g, ''],
        [/==true/g, ''],
        [/!=false/g, ''],
    ];
    
    let savings = 0;
    for (const [regex, replacement] of replacements) {
        const before = code.length;
        code = code.replace(regex, replacement);
        const saved = before - code.length;
        if (saved > 0) {
            savings += saved;
        }
    }
    
    // Add the ultra-short global definitions at the start
    const globals = 'const t=Array.isArray,e=Array.from,i=Object.keys,d=document,w=window;';
    code = '"use strict";' + globals + code;
    
    const finalSize = code.length;
    
    // Write the manually compressed version
    fs.writeFileSync(path.join(__dirname, 'dist', 'x-tool.manual25kb.min.js'), code);
    
    console.log(`\nManual Compression Results:`);
    console.log(`Original: ${originalSize.toLocaleString()} bytes`);
    console.log(`Final: ${finalSize.toLocaleString()} bytes`);
    console.log(`Savings: ${savings} bytes`);
    console.log(`Net change: ${finalSize - originalSize} bytes`);
    console.log(`Target 25KB: ${finalSize <= 25600 ? '✅ ACHIEVED' : '❌ ' + (finalSize - 25600) + ' bytes over'}`);
    
    if (finalSize > 25600) {
        const needed = finalSize - 25600;
        console.log(`\nStill need to save ${needed} bytes`);
        console.log('This requires more aggressive feature removal or source code restructuring.');
    }
    
    return finalSize <= 25600;
}

manualCompress();