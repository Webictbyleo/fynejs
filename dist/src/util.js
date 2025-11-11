export function caseKebabToCamel(str) {
    return str.replace(/-([a-z])/g, (_match, p1) => p1.toUpperCase());
}
export function caseUpper(str) {
    return str.toUpperCase();
}
export function caseCamelToKebab(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}
export function isFunction(value) {
    return typeof value === 'function';
}
export function isObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}
export function isPlainObject(value) {
    if (!isObject(value))
        return false;
    const proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
}
export function isNumber(value) {
    return (typeof value === 'number' && !isNaN(value)
        || (typeof value === 'string' && value.trim() !== '' && !isNaN(Number(value))));
}
export function hasitem(needle, haystack) {
    if (Array.isArray(haystack)) {
        return haystack.includes(needle) || haystack.includes(true);
    }
    return isNumber(haystack) ? haystack === needle : haystack.includes(String(needle));
}
//# sourceMappingURL=util.js.map