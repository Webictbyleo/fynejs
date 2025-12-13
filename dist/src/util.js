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
export function silentError(fn, defaultValue = null) {
    try {
        return fn();
    }
    catch (e) {
        console.error(e);
        return defaultValue;
    }
}
export function debounce(func, wait) {
    let timeout;
    return function (...args) {
        const later = () => {
            timeout = undefined;
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = window.setTimeout(later, wait);
    };
}
const ReactiveSymbol = Symbol('$_xtoolfynjsisReactive');
const ComputedSymbol = Symbol('$_xtoolfynjsisComputed');
export function isReactive(data) {
    return data && data[ReactiveSymbol] === true;
}
export function unwrapReactive(data) {
    if (!isReactive(data)) {
        return data;
    }
    const isArr = Array.isArray(data);
    const isSet = (typeof Set !== 'undefined') && (data instanceof Set);
    const isMap = (typeof Map !== 'undefined') && (data instanceof Map);
    if (!isArr && !isSet && !isMap && !isPlainObject(data)) {
        return data;
    }
    if (isArr) {
        return data.map(item => unwrapReactive(item));
    }
    if (isSet) {
        const newSet = new Set();
        data.forEach(item => {
            newSet.add(unwrapReactive(item));
        });
        return newSet;
    }
    if (isMap) {
        const newMap = new Map();
        data.forEach((value, key) => {
            newMap.set(key, unwrapReactive(value));
        });
        return newMap;
    }
    const result = {};
    for (const key in data) {
        if (data.hasOwnProperty(key)) {
            result[key] = unwrapReactive(data[key]);
        }
    }
    return result;
}
export function defer(fn) {
    Promise.resolve().then(fn);
}
export function setReactiveControl(data, control) {
    if (!isReactive(data)) {
        return;
    }
    Object.defineProperty(data, Symbol.for('ReactiveControl'), {
        value: control,
        enumerable: false,
        configurable: false,
        writable: true,
    });
}
export function getReactiveControl(data) {
    if (!isReactive(data)) {
        return undefined;
    }
    return data[Symbol.for('ReactiveControl')];
}
export function makeReactive(data, control) {
    if (isReactive(data)) {
        return data;
    }
    const isArr = Array.isArray(data);
    const isSet = (typeof Set !== 'undefined') && (data instanceof Set);
    const isMap = (typeof Map !== 'undefined') && (data instanceof Map);
    if (!isArr && !isSet && !isMap && !isPlainObject(data)) {
        return data;
    }
    if (!control) {
        control = {
            maxReactiveDepth: Number.POSITIVE_INFINITY,
        };
    }
    if (control && control.maxReactiveDepth && control.maxReactiveDepth <= 0) {
        return data;
    }
    if (data[ReactiveSymbol]) {
        return data;
    }
    Object.defineProperty(data, ReactiveSymbol, {
        value: true,
        enumerable: false,
        configurable: false,
        writable: false,
    });
    Object.defineProperty(data, Symbol.for('ReactiveControl'), {
        value: control,
        enumerable: false,
        configurable: false,
        writable: true,
    });
    const onChange = (oldValue, newValue) => {
        if (control && control.baseChangeListener) {
            control.baseChangeListener(oldValue, newValue);
        }
        if (control && control.changeListeners && control.changeListeners.length > 0) {
            const call = () => {
                for (const listener of control.changeListeners) {
                    listener(oldValue, newValue);
                }
            };
            if (control.signal?.aborted) {
                return;
            }
            debounce(call, 10)();
        }
    };
    return new Proxy(data, {
        set(target, prop, value) {
            const oldValue = target[prop];
            if (typeof value === 'object' && value !== null) {
                if (control && control.maxReactiveDepth && control.maxReactiveDepth > 0) {
                    control.maxReactiveDepth -= 1;
                }
                value = makeReactive(value, control);
            }
            Reflect.set(target, prop, value);
            if (oldValue !== value) {
                onChange(oldValue, value);
            }
            return true;
        },
        get(target, prop, receiver) {
            const value = Reflect.get(target, prop, receiver);
            if (prop === Symbol.for('ReactiveControl')) {
                return value;
            }
            if (control && control.depTracker && (Symbol.iterator === prop || (isArr || isMap || isSet && ['size', 'length', 'size', 'keys', 'entries', 'values'].includes(String(prop))) || typeof prop === 'string' || typeof prop === 'number')) {
                control.depTracker(control.trackerId ?? prop);
            }
            if (prop === Symbol.toPrimitive) {
                return (hint) => {
                    if (hint === 'number') {
                        return NaN;
                    }
                    if (isReactive(target)) {
                        const value = target['value'];
                        if (value !== undefined) {
                            return value;
                        }
                    }
                    else {
                        const value = target['value'];
                        if (value !== undefined && isReactive(value)) {
                            return value;
                        }
                    }
                    if (hint === 'string') {
                        return isArr ? '[]' : isSet ? 'Set {}' : isMap ? 'Map {}' : '[object Object]';
                    }
                    return null;
                };
            }
            if (typeof value === 'object' && value !== null && value[ReactiveSymbol] === true && value.value !== undefined) {
                return value.value;
            }
            if (typeof value == 'function') {
                if (isArr && ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse', 'fill', 'copyWithin'].includes(prop)) {
                    return function (...args) {
                        const oldArray = target.slice();
                        const result = Array.prototype[prop].apply(target, args);
                        if (control) {
                            onChange(oldArray, target);
                        }
                        return result;
                    };
                }
                if ((isSet || isMap) && ['add', 'delete', 'clear', 'set'].includes(prop)) {
                    return function (...args) {
                        const oldCollection = isSet ? new Set(target) : new Map(target);
                        const result = (isSet ? Set.prototype : Map.prototype)[prop].apply(target, args);
                        if (control) {
                            onChange(oldCollection, target);
                        }
                        return result;
                    };
                }
                return value;
            }
            if (typeof value === 'object' && value !== null) {
                if (control && control.maxReactiveDepth && control.maxReactiveDepth > 0) {
                    control.maxReactiveDepth -= 1;
                }
                return makeReactive(value, control);
            }
            return value;
        },
        deleteProperty(target, p) {
            const oldValue = target[p];
            const result = Reflect.deleteProperty(target, p);
            if (result) {
                onChange(oldValue, undefined);
            }
            return result;
        },
    });
}
export function makeComputed(getter, control) {
    let cachedValue;
    let isDirty = true;
    const computeValue = () => {
        cachedValue = getter();
        isDirty = false;
    };
    const reactiveControl = {
        ...control,
        depTracker: (_key) => {
            isDirty = true;
        },
    };
    const target = {
        get value() {
            if (isDirty) {
                computeValue();
            }
            return cachedValue;
        }
    };
    Object.defineProperty(target, ComputedSymbol, {
        value: true,
        enumerable: false,
        configurable: false,
        writable: false,
    });
    Object.defineProperty(target, Symbol.for(`_computedID`), {
        value: generateRandomId(12),
        enumerable: false,
        configurable: false,
        writable: true,
    });
    console.log('Created computed property with ID:', target[Symbol.for(`_computedID`)]);
    return makeReactive(target, reactiveControl);
}
export function isComputedRef(value) {
    return !!(value && value[ComputedSymbol] === true);
}
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
export function generateRandomId(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
export function roundToDecimals(value, decimals) {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
}
export function floatEquals(a, b, epsilon = 1e-10) {
    return Math.abs(a - b) < epsilon;
}
export function percentDifference(a, b) {
    if (a === 0 && b === 0)
        return 0;
    return Math.abs(a - b) / ((Math.abs(a) + Math.abs(b)) / 2) * 100;
}
const existingIds = new Set();
export function generateUniqueId(length = 8) {
    let id;
    do {
        id = generateRandomId(length);
    } while (existingIds.has(id));
    existingIds.add(id);
    return id;
}
export function createFunctionFromString(functionExpressionString, scriptContent, extraContext = {}) {
    const contextKeys = Object.keys(extraContext);
    const contextDestructureString = contextKeys.length > 0
        ? `const { ${contextKeys.join(', ')} } = this;`
        : '';
    const functionBody = `
        ${contextDestructureString}
        ${scriptContent}
        return (${functionExpressionString});
    `;
    const executableFunction = new Function(functionBody).bind(extraContext);
    return executableFunction();
}
export function createEvaluator(dynamicString) {
    const evaluatorFunction = new Function('ctx', `
    with (ctx) {
      let result;
      try {
        // Attempt 1: Assume it's a returnable expression (e.g., '1+1' or '() => 1+1')
        result = ${dynamicString};
      } catch (e) {
        // Attempt 2: Assume it's a statement block (e.g., 'function foo(){...}')
        ${dynamicString};
        // If it was a statement block, the 'result' remains undefined
      }

      // We handle the consistency here: If the result is a function, call it immediately.
      if (typeof result === 'function') {
        // The function is called with the same 'thisArg' (which is 'this' in this scope)
        return result.call(this);
      }
      
      return result;
    }
  `);
    return function (context = {}, thisArg = globalThis) {
        return evaluatorFunction.call(thisArg, context);
    };
}
//# sourceMappingURL=util.js.map