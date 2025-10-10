// CommonJS-friendly entry point
require('./dist/x-tool.min.js');

function getGlobal(){ return typeof window !== 'undefined' ? window : globalThis; }
const api = getGlobal().XTool || getGlobal().FyneJS;

module.exports = api;
module.exports.XTool = api;
module.exports.FyneJS = getGlobal().FyneJS || api;
module.exports.html = function(strings){
	var out = '';
	for (var i = 0; i < strings.length; i++){
		out += strings[i];
		if (i < arguments.length - 1) out += arguments[i+1];
	}
	return out;
};
