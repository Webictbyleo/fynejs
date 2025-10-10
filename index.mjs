// ESM-friendly entry point for bundlers
// Side-effect import loads and registers the global XTool/FyneJS instance
import './dist/x-tool.min.js';

const getGlobal = () => (typeof window !== 'undefined' ? window : globalThis);
const api = getGlobal().XTool || getGlobal().FyneJS;

export default api;
export const XTool = api;
export const FyneJS = getGlobal().FyneJS || api;
export const html = (strings, ...values) => strings.reduce((acc, str, i) => acc + str + (i < values.length ? values[i] : ''), '');
