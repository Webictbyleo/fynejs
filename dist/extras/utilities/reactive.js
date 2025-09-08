const targetMap = new WeakMap();
let activeEffect = null;
const effectStack = [];
function track(target, key) {
    if (!activeEffect)
        return;
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    let dep = depsMap.get(key);
    if (!dep) {
        dep = new Set();
        depsMap.set(key, dep);
    }
    if (!dep.has(activeEffect)) {
        dep.add(activeEffect);
        (activeEffect.deps || (activeEffect.deps = [])).push(dep);
    }
}
function trigger(target, key) {
    const depsMap = targetMap.get(target);
    if (!depsMap)
        return;
    const dep = depsMap.get(key);
    if (!dep)
        return;
    const effects = new Set(dep);
    effects.forEach(effect => {
        if (effect.scheduler)
            effect.scheduler();
        else
            effect();
    });
}
const reactiveCache = new WeakMap();
function isObject(v) { return v !== null && typeof v === 'object'; }
function toRaw(v) { return v?.["__raw__"] || v; }
export function reactive(target) {
    if (!isObject(target))
        return target;
    if (target["__raw__"])
        return target;
    const existing = reactiveCache.get(target);
    if (existing)
        return existing;
    const proxy = new Proxy(target, {
        get(obj, key, receiver) {
            if (key === "__raw__")
                return obj;
            const res = Reflect.get(obj, key, receiver);
            track(obj, key);
            return isObject(res) ? reactive(res) : res;
        },
        set(obj, key, value, receiver) {
            const oldVal = obj[key];
            const result = Reflect.set(obj, key, value, receiver);
            if (oldVal !== value)
                trigger(obj, key);
            return result;
        },
        deleteProperty(obj, key) {
            const had = Object.prototype.hasOwnProperty.call(obj, key);
            const result = Reflect.deleteProperty(obj, key);
            if (had && result)
                trigger(obj, key);
            return result;
        }
    });
    reactiveCache.set(target, proxy);
    return proxy;
}
export function effect(fn, options = {}) {
    const ef = function reactiveEffect() {
        if (!ef.active)
            return fn();
        cleanupEffect(ef);
        try {
            effectStack.push(ef);
            activeEffect = ef;
            return fn();
        }
        finally {
            effectStack.pop();
            activeEffect = effectStack[effectStack.length - 1] || null;
        }
    };
    ef.active = true;
    ef.scheduler = options.scheduler;
    ef();
    return ef;
}
export function stop(effectFn) {
    if (effectFn.active) {
        effectFn.active = false;
        cleanupEffect(effectFn);
    }
}
function cleanupEffect(ef) {
    if (ef.deps) {
        for (const dep of ef.deps)
            dep.delete(ef);
        ef.deps.length = 0;
    }
}
export function computed(getter) {
    let cache;
    let dirty = true;
    const dep = new Set();
    const runner = effect(getter, { scheduler: () => { if (!dirty) {
            dirty = true;
            triggerComputed();
        } } });
    function triggerComputed() { dep.forEach(e => e.scheduler ? e.scheduler() : e()); }
    return {
        get value() {
            if (dirty) {
                cache = runner();
                dirty = false;
            }
            if (activeEffect) {
                dep.add(activeEffect);
                (activeEffect.deps || (activeEffect.deps = [])).push(dep);
            }
            return cache;
        }
    };
}
export function watch(source, cb, options = {}) {
    let getter;
    if (typeof source === 'function')
        getter = source;
    else if (isObject(source))
        getter = () => source;
    else
        getter = () => source;
    if (options.deep) {
        const base = getter;
        getter = () => traverse(base());
    }
    let oldVal;
    let cleanup;
    const job = () => {
        const newVal = runner();
        if (options.immediate || newVal !== oldVal) {
            cleanup?.();
            cb(newVal, oldVal);
            oldVal = newVal;
        }
    };
    const runner = effect(getter, { scheduler: () => { options.flush === 'post' ? queueMicrotask(job) : job(); } });
    oldVal = runner();
    if (options.immediate)
        job();
    return () => { cleanup?.(); stop(runner); };
}
function traverse(value, seen = new Set()) {
    if (!isObject(value) || seen.has(value))
        return value;
    seen.add(value);
    for (const k in value)
        traverse(value[k], seen);
    return value;
}
export const reactiveUtils = { reactive, effect, computed, watch, toRaw, stop };
//# sourceMappingURL=reactive.js.map