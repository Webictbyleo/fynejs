"use strict";
const ARRAY_ISARRAY = Array.isArray;
const FT_C = true;
const FT_TI = typeof __FEAT_TEXT_INTERP__ === 'boolean' ? __FEAT_TEXT_INTERP__ : true;
const _FT_DR = typeof __FEAT_DEEP_REACTIVE__ === 'boolean' ? __FEAT_DEEP_REACTIVE__ : true;
const FT_IFB = typeof __FEAT_IF_BRANCHES__ === 'boolean' ? __FEAT_IF_BRANCHES__ : true;
const FT_TR = typeof __FEAT_TRANSITION__ === 'boolean' ? __FEAT_TRANSITION__ : true;
const XToolFramework = function () {
    const _Afrom = Array.from;
    const _AisArr = ARRAY_ISARRAY;
    const _Okeys = Object.keys;
    const _logErr = (..._args) => { };
    const STR_STYLE = 'style';
    const STR_DISPLAY = 'display';
    const STR_NONE = 'none';
    const STR_TAGNAME = 'tagName';
    const STR_TEMPLATE = 'TEMPLATE';
    const STR_LENGTH = 'length';
    let XTOOL_ENABLE_STATIC_DIRECTIVES = true;
    const d = (typeof document !== 'undefined' ? document : null);
    try {
        if (d && d.head && !d.getElementById('x-tool-initial-css')) {
            const style = d.createElement(STR_STYLE);
            style.id = 'x-tool-initial-css';
            style.textContent = '[x-show],[x-if],[x-else],[x-else-if],[x\\:show],[x\\:if],[x\\:else],[x\\:else-if]{display:none;}';
            d.head.appendChild(style);
        }
    }
    catch { }
    let PFX = 'x';
    const attrName = (name) => `${PFX}-${name}`;
    class XToolFramework {
        constructor() {
            this._components = new Map();
            this._byEl = new WeakMap();
            this._pending = [];
            this._config = {};
            this._customDirectives = new Map();
            this._namedComponentDefs = new Map();
            this._delegated = new WeakMap();
            this._delegatedRootBound = false;
            this.directive = (name, directive) => {
                if (name.startsWith(PFX + '-')) {
                    throw new Error(`Custom directive names should not start with "${PFX}-". Use: XTool.directive("my-directive", ...)`);
                }
                this._customDirectives.set(name, directive);
                return this;
            };
            this.registerComponent = (definition) => {
                if (!definition || !definition.name)
                    throw new Error('registerComponent requires a name');
                const name = definition.name.toLowerCase();
                if (this._namedComponentDefs.has(name))
                    throw new Error(`Component name "${name}" already registered`);
                this._namedComponentDefs.set(name, definition);
                return this;
            };
            this._getRegisteredComponentDef = (name) => this._namedComponentDefs.get(name.toLowerCase());
            this._getCustomDirective = (name) => this._customDirectives.get(name);
            this._getConfig = () => this._config;
            this.init = (config = {}) => {
                this._config = { container: 'body', debug: false, staticDirectives: true, ...config };
                if (typeof this._config.staticDirectives === 'boolean') {
                    XTOOL_ENABLE_STATIC_DIRECTIVES = this._config.staticDirectives;
                }
                const _hpf = this._config.prefix;
                if (_hpf && typeof _hpf === 'string' && _hpf[STR_LENGTH] > 0) {
                    PFX = _hpf;
                }
                else {
                    PFX = 'x';
                }
                if (d && d.readyState === 'loading') {
                    d.addEventListener('DOMContentLoaded', () => { this._applyPrefixInitialCSS(); this._autoDiscoverComponents(); const c = d?.querySelector(this._config.container); if (c) {
                        this._ensureRootObserver(c);
                        if (this._config.delegate)
                            this._ensureDelegation(c);
                    } });
                }
                else if (!d || d.readyState === 'complete' || d.readyState === 'interactive') {
                    this._applyPrefixInitialCSS();
                    this._autoDiscoverComponents();
                    const c = d?.querySelector(this._config.container);
                    if (c) {
                        this._ensureRootObserver(c);
                        if (this._config.delegate)
                            this._ensureDelegation(c);
                    }
                }
                return this;
            };
            this.createComponent = (definition) => {
                const component = new ReactiveComponent(this._generateComponentId(), definition, this);
                this._components.set(component.id, component);
                component.callBeforeMount();
                return component;
            };
            this._autoDiscoverComponents = () => {
                const container = d?.querySelector(this._config.container);
                if (!container)
                    return;
                const componentElements = container.querySelectorAll(`[${attrName('data')}]`);
                for (const element of componentElements) {
                    if (!this._getComponentByElement(element))
                        this._bindElementAsComponent(element);
                }
                const reusable = container.querySelectorAll('component[source]');
                for (const el of reusable) {
                    if (!this._getComponentByElement(el))
                        this._instantiateNamedComponent(el);
                }
                this._processPending();
                if (componentElements[STR_LENGTH] === 0 && !this._getComponentByElement(container)) {
                    const components = _Afrom(this._components.values());
                    const lastComponent = components[components[STR_LENGTH] - 1];
                    if (lastComponent && !lastComponent.isBound) {
                        lastComponent.bindToElement(container);
                    }
                }
            };
            this._processPending = () => {
                if (!this._pending[STR_LENGTH])
                    return;
                for (const p of this._pending) {
                    let cur = p.el.parentElement;
                    let parent;
                    while (cur && !parent) {
                        const maybe = this._getComponentByElement(cur);
                        if (maybe)
                            parent = maybe;
                        else
                            cur = cur.parentElement;
                    }
                    if (parent) {
                        p.comp.attachToParent(parent);
                    }
                }
                for (const p of this._pending)
                    p.comp.completeBinding();
                this._pending = [];
            };
            this._bindElementAsComponent = (element, parentForEval) => {
                const dataExpression = element.getAttribute(attrName('data'));
                let data = {};
                if (dataExpression) {
                    element.removeAttribute(attrName('data'));
                    try {
                        if (parentForEval) {
                            let parentCtx = {};
                            try {
                                parentCtx = parentForEval._createMethodContext?.() || {};
                            }
                            catch {
                                parentCtx = {};
                            }
                            const evalFn = new Function('parent', `with(parent){ return (${dataExpression}) }`);
                            data = evalFn(parentCtx);
                        }
                        else {
                            data = this._parseDataExpression(dataExpression);
                        }
                        if (data.methods) {
                            data = { methods: data.methods, data: { ...data } };
                        }
                        else {
                            data = { data: { ...data } };
                        }
                        if (parentForEval) {
                            data.data.$parent = parentForEval;
                        }
                    }
                    catch (e) {
                    }
                }
                const comp = this.createComponent(data);
                comp.element = element;
                comp.callBeforeMount();
                this._registerElement(comp.element, comp);
                this._pending.push({ el: element, comp });
                const initExpr = element.getAttribute(attrName('init'));
                if (initExpr) {
                    element.removeAttribute(attrName('init'));
                    const existingMounted = comp._lifecycle?.mounted;
                    comp._lifecycle.mounted = function () {
                        if (existingMounted) {
                            try {
                                existingMounted.call(this);
                            }
                            catch { }
                        }
                        const evaluator = new Function('ctx', 'with(ctx){' + initExpr + '} ');
                        queueMicrotask(() => {
                            if (comp.isDestroyed || !comp.element || !comp.element.isConnected)
                                return;
                            try {
                                const ctx = comp._createMethodContext?.() || comp.getContext?.() || {};
                                const result = evaluator(ctx);
                                if (typeof result === 'function') {
                                    try {
                                        result();
                                    }
                                    catch { }
                                }
                            }
                            catch { }
                        });
                    };
                }
            };
            this._generateComponentId = () => 'component_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
            this._parseDataExpression = (expression) => {
                try {
                    return new Function('return ' + expression.trim())();
                }
                catch {
                    return {};
                }
            };
            this._unregisterComponent = (componentId) => { this._components.delete(componentId); };
            this._log = (..._args) => { };
            this._registerElement = (element, component) => {
                this._byEl.set(element, component);
            };
            this._unregisterElement = (element) => { try {
                this._byEl.delete(element);
            }
            catch { } };
        }
        _applyPrefixInitialCSS() {
            if (!d)
                return;
            if (PFX === 'x')
                return;
            const id = `x-tool-initial-css-${PFX}`;
            if (d.head && !d.getElementById(id)) {
                const style = d.createElement(STR_STYLE);
                style.id = id;
                style.textContent = `[${PFX}-show],[${PFX}-if],[${PFX}-else],[${PFX}-else-if],[${PFX}\\:show],[${PFX}\\:if],[${PFX}\\:else],[${PFX}\\:else-if]{display:none;}`;
                d.head.appendChild(style);
            }
        }
        _ensureRootObserver(container) {
            if (this._rootObserver || typeof MutationObserver === 'undefined')
                return;
            this._rootObserver = new MutationObserver(records => {
                for (const r of records) {
                    if (r.type === 'childList') {
                        for (let i = 0; i < r.addedNodes.length; i++) {
                            const n = r.addedNodes[i];
                            if (n.nodeType !== 1)
                                continue;
                            const el = n;
                            if (el[STR_TAGNAME] === 'COMPONENT') {
                                const src = el.getAttribute('source');
                                if (src && !this._getComponentByElement(el))
                                    this._instantiateNamedComponent(el);
                            }
                        }
                        for (let i = 0; i < r.removedNodes.length; i++) {
                            const n = r.removedNodes[i];
                            if (n.nodeType !== 1)
                                continue;
                            const el = n;
                            queueMicrotask(() => {
                                if (el.isConnected)
                                    return;
                                const stack = [el];
                                while (stack.length) {
                                    const cur = stack.pop();
                                    const comp = this._getComponentByElement(cur);
                                    if (comp && !comp.isDestroyed) {
                                        try {
                                            comp.destroy();
                                        }
                                        catch { }
                                    }
                                    let child = cur.firstElementChild;
                                    while (child) {
                                        stack.push(child);
                                        child = child.nextElementSibling;
                                    }
                                }
                            });
                        }
                    }
                    else if (r.type === 'attributes') {
                        const target = r.target;
                        if (target && target[STR_TAGNAME] === 'COMPONENT' && r.attributeName === 'source') {
                            this._onComponentSourceChanged(target);
                        }
                    }
                }
                this._processPending();
            });
            this._rootObserver.observe(container, { childList: true, subtree: true, attributes: true, attributeFilter: ['source'] });
        }
        _onComponentSourceChanged(el) {
            const src = (el.getAttribute('source') || '').trim();
            const existing = this._getComponentByElement(el);
            if (!src) {
                if (existing && !existing.isDestroyed) {
                    try {
                        existing.destroy();
                    }
                    catch { }
                }
                el.innerHTML = '';
                return;
            }
            if (existing && !existing.isDestroyed) {
                try {
                    existing.destroy();
                }
                catch { }
            }
            el.innerHTML = '';
            this._instantiateNamedComponent(el);
        }
        _instantiateNamedComponent(el) {
            const source = el.getAttribute('source');
            if (!source)
                return;
            const def = this._getRegisteredComponentDef(source);
            if (!def) {
                return;
            }
            let parentComp;
            let par = el.parentElement;
            while (par && !parentComp) {
                const maybe = this._getComponentByElement(par);
                if (maybe)
                    parentComp = maybe;
                else
                    par = par.parentElement;
            }
            let props = null;
            let dynamicPropObj = null;
            let rawPropExpression = null;
            if (!props)
                props = {};
            const propExpr = el.getAttribute(attrName('prop'));
            if (propExpr) {
                rawPropExpression = propExpr;
                if (parentComp) {
                    try {
                        const fn = new Function('ctx', 'with(ctx){return (' + propExpr + ')}');
                        const ctx = parentComp.getContext(true);
                        dynamicPropObj = fn(ctx);
                    }
                    catch {
                        dynamicPropObj = null;
                    }
                }
                else {
                    try {
                        dynamicPropObj = new Function('return (' + propExpr + ')')();
                    }
                    catch {
                        dynamicPropObj = null;
                    }
                }
                if (dynamicPropObj && typeof dynamicPropObj === 'object')
                    for (const k in dynamicPropObj)
                        if (!(k in props))
                            props[k] = String(dynamicPropObj[k]);
                el.removeAttribute(attrName('prop'));
            }
            let baseData = {};
            if (def.makeData) {
                try {
                    baseData = def.makeData(props) || {};
                }
                catch {
                    baseData = {};
                }
            }
            if (def.data) {
                for (const k in def.data) {
                    baseData[k] = def.data[k];
                }
            }
            for (const k in props) {
                if (!(k in baseData))
                    baseData[k] = props[k];
            }
            baseData.$props = props;
            let initDef;
            if (typeof def.init === 'function') {
                try {
                    const maybe = def.init(props);
                    initDef = (maybe && typeof maybe === 'object') ? maybe : undefined;
                }
                catch {
                    initDef = undefined;
                }
            }
            const compDef = {
                data: baseData,
                methods: { ...(def.methods || {}), ...(initDef?.methods || {}) },
                computed: { ...(def.computed || {}), ...(initDef?.computed || {}) },
                propEffects: { ...(def.propEffects || {}), ...(initDef?.propEffects || {}) },
                mounted: initDef?.mounted || def.mounted,
                unmounted: initDef?.unmounted || def.unmounted,
                beforeMount: initDef?.beforeMount || def.beforeMount,
                beforeUnmount: initDef?.beforeUnmount || def.beforeUnmount,
                updated: initDef?.updated || def.updated,
                destroyed: initDef?.destroyed || def.destroyed,
                beforeDestroy: initDef?.beforeDestroy || def.beforeDestroy
            };
            const comp = this.createComponent(compDef);
            comp.element = el;
            const originalChildren = [];
            while (el.firstChild) {
                const n = el.firstChild;
                originalChildren.push(n);
                el.removeChild(n);
            }
            if (def.template) {
                const applyTemplate = (tpl) => {
                    el.innerHTML = tpl;
                    const slots = el.querySelectorAll('slot');
                    if (slots.length) {
                        for (const slotEl of slots) {
                            const name = slotEl.getAttribute('name');
                            let matched = [];
                            if (name) {
                                matched = originalChildren.filter(n => n.nodeType === 1 && n.getAttribute('slot') === name);
                            }
                            else {
                                matched = originalChildren.filter(n => n.nodeType !== 1 || !n.hasAttribute('slot'));
                            }
                            if (matched.length) {
                                const frag = d.createDocumentFragment();
                                for (const n of matched)
                                    frag.appendChild(n);
                                slotEl.parentNode?.replaceChild(frag, slotEl);
                            }
                        }
                    }
                };
                const tplVal = def.template;
                if (typeof tplVal === 'string') {
                    applyTemplate(tplVal);
                }
                else if (typeof tplVal === 'function') {
                    try {
                        const res = tplVal();
                        if (res && typeof res.then === 'function') {
                            el.innerHTML = '';
                            res.then(html => { applyTemplate(html || ''); try {
                                comp._applyAsyncTemplateResolved();
                            }
                            catch { } });
                        }
                        else {
                            applyTemplate(String(res || ''));
                        }
                    }
                    catch {
                        el.innerHTML = '';
                    }
                }
                else if (tplVal && typeof tplVal.then === 'function') {
                    el.innerHTML = '';
                    tplVal.then(html => { applyTemplate(html || ''); try {
                        comp._applyAsyncTemplateResolved();
                    }
                    catch { } });
                }
            }
            else {
                for (const n of originalChildren)
                    el.appendChild(n);
            }
            this._registerElement(el, comp);
            try {
                const nested = el.querySelectorAll(`[${attrName('data')}]`);
                for (const node of nested) {
                    if (!this._getComponentByElement(node))
                        this._bindElementAsComponent(node, comp);
                }
            }
            catch { }
            this._pending.push({ el, comp });
            if (rawPropExpression && parentComp) {
                try {
                    comp._initReactiveProps(rawPropExpression, parentComp);
                }
                catch { }
            }
            this._processPending();
        }
        _getComponentByElement(element) { return this._byEl.get(element); }
        observe(_element) { }
        _ensureDelegation(container) {
            if (this._delegatedRootBound)
                return;
            const root = container;
            const handler = (e) => {
                let cur = e.target;
                while (cur && cur !== root.parentElement) {
                    if (e.cancelBubble)
                        break;
                    const map = this._delegated.get(cur);
                    if (map) {
                        const list = map.get(e.type);
                        if (list && list.length) {
                            for (const h of [...list]) {
                                try {
                                    if (h.comp && h.comp.isDestroyed) {
                                        const i = list.indexOf(h);
                                        if (i > -1)
                                            list.splice(i, 1);
                                        continue;
                                    }
                                    if (!h.filter || h.filter(e)) {
                                        h.run(e);
                                        if (h.once) {
                                            const idx = list.indexOf(h);
                                            if (idx > -1)
                                                list.splice(idx, 1);
                                        }
                                    }
                                }
                                catch { }
                            }
                        }
                    }
                    cur = cur.parentElement;
                }
            };
            const captureEvents = ['keydown', 'keyup'];
            const bubbleEvents = ['click', 'input', 'change'];
            for (const ev of captureEvents)
                root.addEventListener(ev, handler, true);
            for (const ev of bubbleEvents)
                root.addEventListener(ev, handler, false);
            this._delegatedRootBound = true;
        }
        _registerDelegated(element, event, entry) {
            let map = this._delegated.get(element);
            if (!map) {
                map = new Map();
                this._delegated.set(element, map);
            }
            let list = map.get(event);
            if (!list) {
                list = [];
                map.set(event, list);
            }
            list.push(entry);
            return () => {
                try {
                    const m = this._delegated.get(element);
                    const l = m?.get(event);
                    if (!l)
                        return;
                    const idx = l.indexOf(entry);
                    if (idx > -1)
                        l.splice(idx, 1);
                }
                catch { }
            };
        }
    }
    class ReactiveComponent {
        attachToParent(parent) {
            this._parent = parent;
            parent._addChild(this);
        }
        get id() { return this._id; }
        get framework() { return this._framework; }
        get element() { return this._element; }
        set element(el) { this._element = el; }
        get isBound() { return this._isBound; }
        set isBound(v) { this._isBound = v; }
        get isMounted() { return this._isMounted; }
        set isMounted(v) { this._isMounted = v; }
        get isDestroyed() { return this._isDestroyed; }
        set isDestroyed(v) { this._isDestroyed = v; }
        _getDefaultTransitionClasses() {
            const cfg = this.framework._getConfig();
            const p = (cfg && cfg.prefix) ? String(cfg.prefix) : 'x';
            const mk = (s) => `${p}t-${s}`;
            return { enter: mk('enter'), enterFrom: mk('enter-from'), enterTo: mk('enter-to'), leave: mk('leave'), leaveFrom: mk('leave-from'), leaveTo: mk('leave-to') };
        }
        _ensureDefaultTransitionStyles() {
            try {
                const cfg = this.framework._getConfig();
                if (cfg && cfg.injectTransitionCSS === false)
                    return;
                if (!d || !d.head)
                    return;
                const p = (cfg && cfg.prefix) ? String(cfg.prefix) : 'x';
                const styleId = `x-tool-transition-css-${p}`;
                if (d.getElementById(styleId))
                    return;
                const cls = (name) => `.${p}t-${name}`;
                const style = d.createElement('style');
                style.id = styleId;
                style.textContent = (`${cls('enter')},${cls('leave')}{transition:opacity 150ms ease,transform 150ms ease}` +
                    `${cls('enter-from')},${cls('leave-to')}{opacity:0;transform:translateY(-0.5rem)}` +
                    `${cls('enter-to')},${cls('leave-from')}{opacity:1;transform:translateY(0)}`);
                d.head.appendChild(style);
            }
            catch { }
        }
        _addDirective(element, directive) {
            const existing = this._directives.get(element) || [];
            existing.push(directive);
            this._directives.set(element, existing);
        }
        constructor(id, def, framework) {
            this._propUpdateActive = false;
            this._runningPropEffect = false;
            this._element = null;
            this._isBound = false;
            this._isMounted = false;
            this._isDestroyed = false;
            this._beforeMountCalled = false;
            this._children = [];
            this._parent = null;
            this._computed = {};
            this._propEffects = {};
            this._computedCache = new Map();
            this._computedDeps = new Map();
            this._inverseComputedDeps = new Map();
            this._isInComputedEvaluation = false;
            this._isInMethodExecution = false;
            this._allEffects = new Set();
            this._hasComputed = false;
            this._directives = new Map();
            this._cleanupFunctions = new Set();
            this._eventListeners = [];
            this._loopScopes = new WeakMap();
            this._expressionCache = new Map();
            this._propertyDependencies = new Map();
            this._activeEffect = null;
            this._renderScheduled = false;
            this._nextTickQueue = [];
            this._transitionConfigs = new WeakMap();
            this._transitionEvaluators = new WeakMap();
            this._initialClassSets = new WeakMap();
            this._propParent = null;
            this._callLifecycleHook = (hookName) => {
                const hook = this._lifecycle[hookName];
                if (typeof hook === 'function') {
                    this._safeExecute(() => this._runWithGlobalInterception(hook, []), `Error in '${String(hookName)}'`);
                }
            };
            this._addCleanupFunction = (fn) => {
                if (typeof fn !== 'function')
                    return undefined;
                const wrapper = () => {
                    try {
                        fn();
                    }
                    catch {
                        _logErr();
                    }
                    try {
                        this._cleanupFunctions.delete(wrapper);
                    }
                    catch { }
                };
                this._cleanupFunctions.add(wrapper);
                return () => { try {
                    this._cleanupFunctions.delete(wrapper);
                }
                catch { } };
            };
            this._addEventListenerWithCleanup = (element, event, handler, options) => {
                element.addEventListener(event, handler, options);
                this._eventListeners.push({ element, event, handler, options });
            };
            this._id = id;
            this._framework = framework;
            this._originalMethods = def.methods || {};
            this._computed = def.computed || {};
            this._propEffects = def.propEffects || {};
            this._hasComputed = !!(def.computed && Object.keys(def.computed).length);
            this._lifecycle = {
                mounted: def.mounted,
                unmounted: def.unmounted || def.destroyed,
                updated: def.updated,
                beforeMount: def.beforeMount,
                beforeUnmount: def.beforeUnmount || def.beforeDestroy
            };
            this._data = this._createReactiveData(def.data || {});
            this._methods = this._bindMethods();
        }
        callBeforeMount() {
            if (!this._beforeMountCalled) {
                this._callLifecycleHook('beforeMount');
                this._beforeMountCalled = true;
            }
        }
        _onDataChange(_property) {
            if (this.isBound) {
                if (FT_C)
                    this._computedCache.clear();
                const effectsToRun = new Set();
                const directDeps = this._propertyDependencies.get(_property);
                if (directDeps)
                    for (let i = 0; i < directDeps.length; i++)
                        effectsToRun.add(directDeps[i]);
                for (const effect of effectsToRun)
                    this._safeExecute(effect, 'Error in reactive effect');
                if (this._hasComputed || !XTOOL_ENABLE_STATIC_DIRECTIVES) {
                    this._scheduleRender();
                }
                this._callLifecycleHook('updated');
            }
        }
        _bindMethods() {
            const boundMethods = {};
            for (const methodName in this._originalMethods) {
                const originalMethod = this._originalMethods[methodName];
                boundMethods[methodName] = (...args) => {
                    const prev = this._isInMethodExecution;
                    this._isInMethodExecution = true;
                    try {
                        return this._safeExecute(() => this._runWithGlobalInterception(originalMethod, args), `Error in method '${methodName}'`);
                    }
                    finally {
                        this._isInMethodExecution = prev;
                    }
                };
            }
            return boundMethods;
        }
        _getComputedValue(key) {
            if (!FT_C)
                return undefined;
            this._trackDependency(key);
            if (this._computedCache.has(key))
                return this._computedCache.get(key);
            try {
                const computeFn = this._computed[key];
                this._isInComputedEvaluation = true;
                const prev = this._computedDeps.get(key);
                if (prev) {
                    for (const dep of prev) {
                        const set = this._inverseComputedDeps.get(dep);
                        if (set)
                            set.delete(key);
                    }
                }
                this._computedDeps.set(key, new Set());
                const value = computeFn.call(this._createMethodContext());
                this._isInComputedEvaluation = false;
                this._computedCache.set(key, value);
                return value;
            }
            catch {
                this._isInComputedEvaluation = false;
                return undefined;
            }
        }
        _trackDependency(propKey) {
            if (!this._activeEffect)
                return;
            let deps = this._propertyDependencies.get(propKey);
            if (!deps) {
                deps = [];
                this._propertyDependencies.set(propKey, deps);
            }
            if (!deps.includes(this._activeEffect))
                deps.push(this._activeEffect);
        }
        _scheduleRender() {
            if (this._renderScheduled)
                return;
            this._renderScheduled = true;
            requestAnimationFrame(() => {
                this._renderScheduled = false;
                this._render();
                if (this._nextTickQueue && this._nextTickQueue.length) {
                    const q = this._nextTickQueue.splice(0, this._nextTickQueue.length);
                    for (const fn of q) {
                        try {
                            fn();
                        }
                        catch { }
                    }
                }
            });
        }
        _safeExecute(fn, _errorMsg, fallback) {
            try {
                return fn();
            }
            catch (e) {
                console.error(e);
                return fallback;
            }
        }
        bindToElement(element) {
            if (this._isBound)
                return;
            this._element = element;
            if (!this._beforeMountCalled) {
                this.callBeforeMount();
            }
            this.completeBinding();
        }
        getContext(includeComputed = true) {
            return this._createMethodContext(includeComputed);
        }
        _applyAsyncTemplateResolved() {
            if (!this._element)
                return;
            try {
                this._parseDirectives(this._element);
            }
            catch { }
            this._scheduleRender();
        }
        completeBinding() {
            if (this._isBound || !this._element)
                return;
            if (!this._framework._getComponentByElement(this._element))
                this._framework._registerElement(this._element, this);
            this._isBound = true;
            this._isMounted = true;
            this._parseDirectives(this._element);
            this._setupDOMRemovalDetection();
            this._render();
            this._callLifecycleHook('mounted');
        }
        _addChild(child) {
            if (!this._children.includes(child)) {
                this._children.push(child);
            }
        }
        _removeChild(child) {
            const index = this._children.indexOf(child);
            if (index > -1) {
                this._children.splice(index, 1);
            }
        }
        _setupDOMRemovalDetection() { }
        _runWithGlobalInterception(fn, args) {
            try {
                const src = String(fn);
                if (!/\[native code\]/.test(src)) {
                    let body = src.trim();
                    if (!/^function[\s\(]/.test(body) && !/^[\w\$_][\w\d\$_]*\s*=>/.test(body) && !/^\(.*?\)\s*=>/.test(body)) {
                        body = 'function ' + body;
                    }
                    const trySrc = 'with(ctx){ const f = (' + body + '); return f.apply(thisArg, argsArray); }';
                    const wrapper = new Function('thisArg', 'argsArray', 'ctx', trySrc);
                    return wrapper.call(undefined, this._createMethodContext(), args, this._createContextProxy(undefined, undefined));
                }
            }
            catch {
            }
            return fn.apply(this._createMethodContext(), args);
        }
        destroy() {
            const self = this;
            if (self._isDestroyed)
                return;
            self._callLifecycleHook('beforeUnmount');
            for (const child of self._children) {
                if (!child.isDestroyed)
                    child.destroy();
            }
            if (self._parent) {
                self._parent._removeChild(self);
            }
            for (const [element, directives] of self._directives) {
                for (const directive of directives) {
                    if (directive.type === 'custom' && directive.customDirective?.unbind) {
                        try {
                            directive.customDirective.unbind(element, self);
                        }
                        catch {
                            _logErr();
                        }
                    }
                }
            }
            self._directives.clear();
            for (const { element, event, handler, options } of self._eventListeners) {
                element.removeEventListener(event, handler, options);
            }
            self._eventListeners = [];
            for (const cleanup of Array.from(self._cleanupFunctions)) {
                try {
                    cleanup();
                }
                catch {
                    _logErr();
                }
            }
            self._cleanupFunctions.clear();
            self._computedCache.clear();
            self._expressionCache.clear();
            self._propertyDependencies.clear();
            if (self._propParent && self._propEffect) {
                for (const deps of self._propParent._propertyDependencies.values()) {
                    const idx = deps.indexOf(self._propEffect);
                    if (idx > -1)
                        deps.splice(idx, 1);
                }
            }
            if (self._element)
                self._framework._unregisterElement(self._element);
            self._callLifecycleHook('unmounted');
            self._isDestroyed = true;
            self._isMounted = false;
            self._isBound = false;
            self._children = [];
            self._parent = null;
            this._deepReactiveCache = new WeakMap;
            self._element = null;
            queueMicrotask(() => self._framework._unregisterComponent(self._id));
        }
        _initReactiveProps(expr, parent) {
            if (!expr || !parent)
                return;
            this._propParent = parent;
            let evalFn;
            try {
                evalFn = new Function('ctx', 'with(ctx){return (' + expr + ')}');
            }
            catch {
                return;
            }
            const update = () => {
                parent._activeEffect = update;
                let obj;
                try {
                    const ctx = parent.getContext(true);
                    obj = evalFn(ctx);
                }
                catch {
                    obj = null;
                }
                parent._activeEffect = null;
                if (obj && typeof obj === 'object') {
                    this._data.$props = this._data.$props || {};
                    this._propUpdateActive = true;
                    for (const k in obj) {
                        const v = obj[k];
                        if (this._data[k] !== v)
                            this._data[k] = v;
                    }
                    this._propUpdateActive = false;
                }
            };
            this._propEffect = update;
            update();
        }
        _parseDirectives(element) {
            const self = this;
            let processedElements = 0;
            const processElement = (el, isRoot = false) => {
                if (!isRoot && (el.hasAttribute(attrName('data')) || this._framework._getComponentByElement(el))) {
                    return false;
                }
                const isComponentTag = el[STR_TAGNAME] === 'COMPONENT';
                const directives = [];
                let hasTextOrHtml = false;
                let forAttr = null;
                for (const a of el.attributes) {
                    const n = a.name;
                    if (n.startsWith(PFX + '-') || n.startsWith(PFX + ':')) {
                        directives.push(a);
                        if (!hasTextOrHtml && (n === attrName('text') || n === attrName('html')))
                            hasTextOrHtml = true;
                        if (!forAttr && n === attrName('for'))
                            forAttr = a;
                    }
                }
                if (directives.length > 0) {
                    processedElements++;
                    if (forAttr) {
                        self._bindDirective(el, forAttr.name, forAttr.value);
                        return false;
                    }
                    for (const attr of directives)
                        self._bindDirective(el, attr.name, attr.value);
                }
                if (FT_TI && !hasTextOrHtml)
                    self._bindTextInterpolationsIn(el);
                return isRoot || !isComponentTag;
            };
            processElement(element, true);
            self._walkElements(element, processElement);
        }
        _bindTextInterpolationsIn(el) {
            const nodes = Array.from(el.childNodes);
            for (const node of nodes) {
                if (node.nodeType !== Node.TEXT_NODE)
                    continue;
                const textNode = node;
                const raw = textNode.nodeValue || '';
                if (textNode.__x_tool_ti || raw.indexOf('{{') === -1)
                    continue;
                const parentTag = (textNode.parentElement?.tagName || '').toLowerCase();
                const inCode = parentTag === 'code' || parentTag === 'pre';
                const segs = [];
                let i = 0;
                while (i < raw.length) {
                    const open = raw.indexOf('{{', i);
                    if (open === -1) {
                        segs.push({ literal: raw.slice(i) });
                        break;
                    }
                    let bs = 0;
                    for (let p = open - 1; p >= 0 && raw.charCodeAt(p) === 92; p--)
                        bs++;
                    if (bs > 0) {
                        const prefixStart = i;
                        const prefixEnd = open - bs;
                        if (prefixEnd > prefixStart)
                            segs.push({ literal: raw.slice(prefixStart, prefixEnd) });
                        if (bs > 1)
                            segs.push({ literal: '\\'.repeat(bs - 1) });
                        const close = raw.indexOf('}}', open + 2);
                        if (close === -1) {
                            segs.push({ literal: raw.slice(open, raw.length) });
                            i = raw.length;
                            break;
                        }
                        segs.push({ literal: raw.slice(open, close + 2) });
                        i = close + 2;
                        continue;
                    }
                    else {
                        if (open > i)
                            segs.push({ literal: raw.slice(i, open) });
                        const close = raw.indexOf('}}', open + 2);
                        if (close === -1) {
                            segs.push({ literal: raw.slice(open) });
                            i = raw.length;
                            break;
                        }
                        const expr = raw.slice(open + 2, close).trim();
                        if (expr)
                            segs.push({ expr });
                        else
                            segs.push({ literal: '' });
                        i = close + 2;
                        continue;
                    }
                }
                const hasExpr = segs.some(s => s.expr);
                const hasEscaped = segs.some(s => s.literal && s.literal.includes('{{'));
                if (!hasExpr && !hasEscaped)
                    continue;
                textNode.__x_tool_ti = true;
                const evaluators = hasExpr && !inCode ? segs.filter(s => s.expr).map(s => this._createElementEvaluator(s.expr, el)) : [];
                let exprIndex = 0;
                const update = () => {
                    exprIndex = 0;
                    let out = '';
                    for (const s of segs) {
                        if (s.literal != null) {
                            out += s.literal;
                        }
                        else if (s.expr) {
                            if (inCode) {
                                out += '{{ ' + s.expr + ' }}';
                            }
                            else {
                                const val = evaluators[exprIndex++]();
                                out += (val == null ? '' : String(val));
                            }
                        }
                    }
                    if (textNode.textContent !== out)
                        textNode.textContent = out;
                };
                const dirInfo = { type: 'text-interpolation', expression: raw, update: undefined };
                this._addDirective(el, dirInfo);
                const effect = this._createEffect(update, dirInfo);
                dirInfo.update = effect;
            }
        }
        _walkElements(parent, processor) {
            let child = parent.firstElementChild;
            while (child) {
                const next = child.nextElementSibling;
                if (processor(child))
                    this._walkElements(child, processor);
                child = next;
            }
        }
        _bindDirective(element, directiveName, expression) {
            const self = this;
            const isShortBind = directiveName.startsWith(PFX + ':');
            const type = directiveName.slice(PFX.length + 1);
            if (isShortBind || type === 'class' || type === STR_STYLE) {
                element.removeAttribute(directiveName);
                return self._bindAttributeDirective(element, type, expression);
            }
            if (type === 'transition') {
                element.removeAttribute(directiveName);
                return self._bindTransitionDirective(element, expression);
            }
            if (type === 'text' || type === 'html' || type === 'show') {
                element.removeAttribute(directiveName);
                return self._bindSimpleDirective(element, expression, type);
            }
            const handled = type === 'model' ? (element.removeAttribute(directiveName), self._bindModelDirective(element, expression), true)
                : type === 'if' ? (element.removeAttribute(directiveName), self._bindIfDirective(element, expression), true)
                    : type === 'for' ? (element.removeAttribute(directiveName), self._bindForDirective(element, expression), true)
                        : false;
            if (handled)
                return;
            if (type.indexOf(':') > -1) {
                const [prefix, rest] = type.split(':', 2);
                const [suffix, ...mods] = rest.split('.');
                const modifiers = mods.reduce((acc, m) => { if (m)
                    acc[m] = true; return acc; }, {});
                if (prefix === 'on') {
                    element.removeAttribute(directiveName);
                    const customDirective = self.framework._getCustomDirective(suffix);
                    return customDirective
                        ? self._bindCustomDirective(element, suffix, expression, customDirective, modifiers)
                        : self._bindEventDirective(element, suffix, expression, modifiers);
                }
                element.removeAttribute(directiveName);
                return self._bindAttributeDirective(element, suffix, expression);
            }
        }
        _bindTransitionDirective(element, expression) {
            if (!FT_TR)
                return;
            this._ensureDefaultTransitionStyles();
            const defaults = this._getDefaultTransitionClasses();
            const expr = (expression || '').trim();
            if (expr) {
                try {
                    const evalFn = this._createElementEvaluator(expr, element);
                    this._transitionEvaluators.set(element, evalFn);
                }
                catch { }
            }
            else {
                this._transitionConfigs.set(element, defaults);
            }
            this._addDirective(element, { type: 'transition', expression });
        }
        _transitionIn(el, done) {
            if (!FT_TR) {
                if (done)
                    done();
                return;
            }
            const defaults = this._getDefaultTransitionClasses();
            let userConf = null;
            const evalFn = this._transitionEvaluators.get(el);
            if (evalFn) {
                try {
                    userConf = evalFn();
                }
                catch {
                    userConf = null;
                }
            }
            const staticConf = this._transitionConfigs.get(el) || null;
            const conf = Object.assign({}, defaults, (userConf && typeof userConf === 'object') ? userConf : (staticConf || {}));
            const { enter, enterFrom, enterTo } = conf;
            const end = () => { try {
                if (enter)
                    this._removeClasses(el, enter);
                if (enterTo)
                    this._removeClasses(el, enterTo);
            }
            catch { } ; if (done)
                done(); };
            if (enter || enterFrom || enterTo) {
                if (enter)
                    this._addClasses(el, enter);
                if (enterFrom)
                    this._addClasses(el, enterFrom);
                void el.offsetWidth;
                if (enterFrom)
                    this._removeClasses(el, enterFrom);
                if (enterTo)
                    this._addClasses(el, enterTo);
                this._onTransitionEnd(el, end);
            }
            else {
                end();
            }
        }
        _transitionOut(el, done) {
            if (!FT_TR) {
                if (done)
                    done();
                return;
            }
            const defaults = this._getDefaultTransitionClasses();
            let userConf = null;
            const evalFn = this._transitionEvaluators.get(el);
            if (evalFn) {
                try {
                    userConf = evalFn();
                }
                catch {
                    userConf = null;
                }
            }
            const staticConf = this._transitionConfigs.get(el) || null;
            const conf = Object.assign({}, defaults, (userConf && typeof userConf === 'object') ? userConf : (staticConf || {}));
            const { leave, leaveFrom, leaveTo } = conf;
            const end = () => { try {
                if (leave)
                    this._removeClasses(el, leave);
                if (leaveTo)
                    this._removeClasses(el, leaveTo);
            }
            catch { } ; if (done)
                done(); };
            if (leave || leaveFrom || leaveTo) {
                if (leave)
                    this._addClasses(el, leave);
                if (leaveFrom)
                    this._addClasses(el, leaveFrom);
                void el.offsetWidth;
                if (leaveFrom)
                    this._removeClasses(el, leaveFrom);
                if (leaveTo)
                    this._addClasses(el, leaveTo);
                this._onTransitionEnd(el, end);
            }
            else {
                end();
            }
        }
        _onTransitionEnd(el, cb) {
            let called = false;
            const done = () => { if (called)
                return; called = true; try {
                el.removeEventListener('transitionend', done);
                el.removeEventListener('animationend', done);
            }
            catch { } ; cb(); };
            try {
                el.addEventListener('transitionend', done);
                el.addEventListener('animationend', done);
                setTimeout(done, 500);
            }
            catch {
                cb();
            }
        }
        _tokenizeClasses(input) {
            if (!input)
                return [];
            if (Array.isArray(input))
                return input.map(String).flatMap(s => String(s).split(/\s+/)).filter(Boolean);
            if (typeof input === 'string')
                return input.split(/\s+/).filter(Boolean);
            return [];
        }
        _addClasses(el, classes) {
            const tokens = this._tokenizeClasses(classes);
            if (!tokens.length)
                return;
            try {
                el.classList.add(...tokens);
            }
            catch {
                for (const t of tokens) {
                    try {
                        el.classList.add(t);
                    }
                    catch { }
                }
            }
        }
        _removeClasses(el, classes) {
            const tokens = this._tokenizeClasses(classes);
            if (!tokens.length)
                return;
            try {
                el.classList.remove(...tokens);
            }
            catch {
                for (const t of tokens) {
                    try {
                        el.classList.remove(t);
                    }
                    catch { }
                }
            }
        }
        _createEffect(updateFn, directiveRef) {
            const effect = () => {
                this._activeEffect = effect;
                try {
                    updateFn();
                }
                finally {
                    this._activeEffect = null;
                }
            };
            effect();
            this._allEffects.add(effect);
            if (XTOOL_ENABLE_STATIC_DIRECTIVES && directiveRef && directiveRef._static === undefined) {
                let found = false;
                for (const deps of this._propertyDependencies.values()) {
                    if (deps.includes(effect)) {
                        found = true;
                        break;
                    }
                }
                directiveRef._static = !found;
            }
            return effect;
        }
        _bindSimpleDirective(element, expression, type) {
            if (type === 'class' || type === STR_STYLE) {
                return this._bindAttributeDirective(element, type, expression);
            }
            const evaluator = this._createElementEvaluator(expression, element);
            let originalDisplay;
            if (type === 'show') {
                const el = element;
                originalDisplay = el.style[STR_DISPLAY] !== STR_NONE ? el.style[STR_DISPLAY] : undefined;
            }
            let _prevShown = undefined;
            const update = () => {
                const value = evaluator();
                const el = element;
                switch (type) {
                    case 'text':
                        el.textContent = String(value);
                        break;
                    case 'html':
                        el.innerHTML = String(value || '');
                        break;
                    case 'show':
                        const next = !!value;
                        if (_prevShown === next)
                            return;
                        _prevShown = next;
                        if (next) {
                            el.style[STR_DISPLAY] = originalDisplay || '';
                            this._transitionIn(el);
                        }
                        else {
                            this._transitionOut(el, () => { el.style[STR_DISPLAY] = STR_NONE; });
                        }
                        break;
                }
            };
            const dirInfo = { type, expression, update: undefined, originalDisplay };
            this._addDirective(element, dirInfo);
            const effect = this._createEffect(update, dirInfo);
            dirInfo.update = effect;
        }
        _bindModelDirective(element, property) {
            const isCheckbox = element.type === 'checkbox';
            const isNumeric = element.type === 'number' || element.type === 'range';
            const isMultiSelect = element.tagName === 'SELECT' && element.multiple === true;
            if (!Reflect.has(this._data, property)) {
                Reflect.defineProperty(this._data, property, {
                    'configurable': true,
                    'enumerable': true,
                    'writable': true
                });
            }
            const getValueEvaluator = this._createElementEvaluator(property, element);
            const setValueEvaluator = this._createEvaluator(`${property} = $value`, true);
            const inferCheckboxValue = () => {
                if (element.hasAttribute('value'))
                    return element.value;
                const loopScope = this._collectLoopScope(element);
                if (loopScope) {
                    const keys = Object.keys(loopScope);
                    if (keys.length === 1)
                        return loopScope[keys[0]];
                }
                return element.value;
            };
            const checkboxValue = isCheckbox ? inferCheckboxValue() : undefined;
            const getInputValue = () => {
                if (isCheckbox) {
                    if (Array.isArray(getValueEvaluator()) && checkboxValue !== undefined) {
                        return element.checked ? checkboxValue : undefined;
                    }
                    if (element.hasAttribute('value'))
                        return element.checked ? element.value : undefined;
                    return element.checked;
                }
                if (isMultiSelect) {
                    const sel = element;
                    const values = [];
                    for (let i = 0; i < sel.options.length; i++) {
                        const opt = sel.options[i];
                        if (opt.selected)
                            values.push(opt.value);
                    }
                    return values;
                }
                return isNumeric ? parseFloat(element.value) || 0 : element.value;
            };
            const setInputValue = (value) => {
                if (isCheckbox) {
                    if (Array.isArray(value)) {
                        const member = element.hasAttribute('value') ? element.value : checkboxValue;
                        element.checked = member != null ? value.includes(member) : false;
                    }
                    else {
                        element.checked = !!value;
                    }
                    return;
                }
                if (isMultiSelect) {
                    const sel = element;
                    const arr = Array.isArray(value) ? value : [];
                    for (let i = 0; i < sel.options.length; i++) {
                        const opt = sel.options[i];
                        opt.selected = arr.includes(opt.value);
                    }
                    return;
                }
                element.value = String(value ?? (isNumeric ? 0 : ''));
            };
            this._createEffect(() => setInputValue(getValueEvaluator()));
            const ctx = this._createContextProxy(undefined, element);
            const updateData = () => {
                const raw = getInputValue();
                const currentVal = this._safeExecute(() => getValueEvaluator(), 'model read', undefined);
                if (isCheckbox && Array.isArray(currentVal)) {
                    const arr = currentVal;
                    const member = element.hasAttribute('value') ? element.value : checkboxValue;
                    if (member !== undefined) {
                        const idx = arr.indexOf(member);
                        if (element.checked) {
                            if (idx === -1)
                                arr.push(member);
                        }
                        else if (idx > -1) {
                            arr.splice(idx, 1);
                        }
                    }
                }
                else if (isMultiSelect && Array.isArray(currentVal)) {
                    const arr = currentVal;
                    arr.splice(0, arr.length);
                    raw.forEach(v => arr.push(v));
                }
                else {
                    ctx.$value = raw;
                    this._safeExecute(() => { setValueEvaluator.call(this._createMethodContext(), ctx); });
                }
            };
            const t = element.type;
            const eventType = (element[STR_TAGNAME] === 'SELECT' || t === 'checkbox' || t === 'radio' || t === 'file') ? 'change' : 'input';
            this._addEventListenerWithCleanup(element, eventType, updateData);
            this._addDirective(element, { type: 'model', property });
        }
        _bindIfDirective(element, expression) {
            const self = this;
            const placeholder = d.createComment('x-if');
            element.parentNode?.insertBefore(placeholder, element);
            element.__x_if_anchorParent = placeholder.parentElement || null;
            const branches = [];
            const makeActualElement = (el) => {
                if (el[STR_TAGNAME] === STR_TEMPLATE) {
                    const wrapper = d.createElement('div');
                    wrapper.style[STR_DISPLAY] = 'contents';
                    wrapper.appendChild(el.content.cloneNode(true));
                    return { el: wrapper, isTemplate: true };
                }
                return { el: el, isTemplate: false };
            };
            const first = makeActualElement(element);
            const firstEval = self._createElementEvaluator(expression, element);
            branches.push({ el: first.el, test: firstEval, isTemplate: first.isTemplate });
            if (!first.isTemplate)
                first.el.__x_tool_bound = true;
            const originalNodes = [element];
            if (FT_IFB) {
                if (FT_IFB) {
                    let sib = element.nextElementSibling;
                    while (sib) {
                        const isElse = sib.hasAttribute('x-else');
                        const isElseIf = sib.hasAttribute('x-else-if');
                        if (!isElse && !isElseIf)
                            break;
                        if (sib.hasAttribute('x-else-if')) {
                            const attr = sib.getAttribute('x-else-if') || '';
                            const branch = makeActualElement(sib);
                            const evalFn = self._createElementEvaluator((attr || '').trim(), sib);
                            branches.push({ el: branch.el, test: evalFn, isTemplate: branch.isTemplate });
                            if (!branch.isTemplate)
                                branch.el.__x_tool_bound = true;
                        }
                        else {
                            const branch = makeActualElement(sib);
                            branches.push({ el: branch.el, test: null, isTemplate: branch.isTemplate });
                            if (!branch.isTemplate)
                                branch.el.__x_tool_bound = true;
                        }
                        sib.removeAttribute('x-else');
                        sib.removeAttribute('x-else-if');
                        originalNodes.push(sib);
                        sib = sib.nextElementSibling;
                    }
                }
            }
            let active = -1;
            for (const orig of originalNodes) {
                if (orig.parentNode)
                    orig.parentNode.removeChild(orig);
            }
            const mountBranch = (idx) => {
                if (idx < 0)
                    return;
                const b = branches[idx];
                if (!b.el.__x_tool_bound) {
                    self._parseDirectives(b.el);
                    b.el.__x_tool_bound = true;
                }
                element.__x_if_current?.parentNode?.removeChild(element.__x_if_current);
                if (!b.el.parentNode) {
                    placeholder.parentNode?.insertBefore(b.el, placeholder.nextSibling);
                    this._transitionIn(b.el);
                }
                element.__x_if_current = b.el;
                active = idx;
            };
            const unmountBranch = (idx, cb) => {
                if (idx < 0) {
                    if (cb)
                        cb();
                    return;
                }
                const b = branches[idx];
                if (b.el.parentNode) {
                    this._transitionOut(b.el, () => { if (b.el.parentNode)
                        b.el.parentNode.removeChild(b.el); if (cb)
                        cb(); });
                }
                else if (cb)
                    cb();
                active = -1;
            };
            const update = () => {
                let next = -1;
                for (let i = 0; i < branches[STR_LENGTH]; i++) {
                    const b = branches[i];
                    const pass = b.test ? !!b.test() : true;
                    if (pass) {
                        next = i;
                        break;
                    }
                }
                if (next === active)
                    return;
                if (active !== -1) {
                    unmountBranch(active, () => mountBranch(next));
                }
                else {
                    mountBranch(next);
                }
            };
            const effect = self._createEffect(update);
            self._addDirective(element, { type: 'if', expression, update: effect });
        }
        _bindEventDirective(element, eventName, expression, modifiers) {
            const self = this;
            const trimmed = (expression || '').trim();
            const arrow = self._extractArrowFunction(trimmed);
            const opts = modifiers ? {
                once: !!modifiers.once,
                passive: !!modifiers.passive,
                capture: !!modifiers.capture,
            } : undefined;
            const onlySelf = !!modifiers?.self;
            const shouldPrevent = !!modifiers?.prevent;
            const shouldStop = !!modifiers?.stop;
            const isOutside = !!modifiers?.outside;
            const deferExec = !!modifiers?.defer;
            const keyAliasMap = {
                enter: ['enter'],
                esc: ['escape', 'esc'],
                escape: ['escape', 'esc'],
                space: [' ', 'space', 'spacebar'],
                tab: ['tab'],
                backspace: ['backspace'],
                delete: ['delete', 'del'],
                del: ['delete', 'del'],
                arrowup: ['arrowup', 'up'],
                arrowdown: ['arrowdown', 'down'],
                arrowleft: ['arrowleft', 'left'],
                arrowright: ['arrowright', 'right'],
                home: ['home'],
                end: ['end'],
                pageup: ['pageup'],
                pagedown: ['pagedown']
            };
            const comboRequirements = {
                ctrl: !!modifiers?.ctrl,
                alt: !!modifiers?.alt,
                shift: !!modifiers?.shift,
                meta: !!modifiers?.meta,
            };
            const buttonMap = { left: 0, middle: 1, right: 2 };
            const touchSingle = !!modifiers?.single;
            const touchMulti = !!modifiers?.multi;
            const modifierKeys = modifiers ? _Okeys(modifiers) : [];
            const allowedKeys = [];
            for (const m of modifierKeys) {
                const aliases = keyAliasMap[m.toLowerCase()];
                if (aliases)
                    allowedKeys.push(...aliases);
            }
            const allowedButtons = [];
            for (const m of modifierKeys) {
                const btn = buttonMap[m.toLowerCase()];
                if (btn !== undefined)
                    allowedButtons.push(btn);
            }
            const needKeyCheck = allowedKeys.length > 0 || comboRequirements.ctrl || comboRequirements.alt || comboRequirements.shift || comboRequirements.meta;
            const needButtonCheck = allowedButtons.length > 0;
            const needTouchCheck = touchSingle || touchMulti;
            const passesFilters = (event) => {
                const path = event.composedPath ? event.composedPath() : null;
                const tgt = (path && path.length ? path[0] : event.target);
                if (isOutside) {
                    if (!tgt)
                        return false;
                    if (element instanceof Node && (element === tgt || element.contains(tgt)))
                        return false;
                }
                if (onlySelf && event.target !== element)
                    return false;
                if (needTouchCheck) {
                    if (event instanceof TouchEvent) {
                        const tCount = event.touches.length;
                        if (touchSingle && tCount !== 1)
                            return false;
                        if (touchMulti && tCount < 2)
                            return false;
                    }
                    else
                        return false;
                }
                if (needButtonCheck) {
                    if (event instanceof MouseEvent) {
                        if (!allowedButtons.includes(event.button))
                            return false;
                    }
                    else
                        return false;
                }
                if (needKeyCheck) {
                    if (!(event instanceof KeyboardEvent))
                        return false;
                    const k = (event.key || '').toLowerCase();
                    if (allowedKeys.length > 0 && !allowedKeys.includes(k))
                        return false;
                    if (comboRequirements.ctrl && !event.ctrlKey)
                        return false;
                    if (comboRequirements.alt && !event.altKey)
                        return false;
                    if (comboRequirements.shift && !event.shiftKey)
                        return false;
                    if (comboRequirements.meta && !event.metaKey)
                        return false;
                }
                return true;
            };
            const hasExpr = !!trimmed;
            let runExpr = null;
            const thisCtx = self._createMethodContext();
            if (arrow) {
                const compiledArrow = self._compileArrowForEvent(arrow.paramsList, arrow.body, arrow.isBlock);
                const mapArgs = arrow.paramsList.length
                    ? (event) => arrow.paramsList.map((_, idx) => (idx === 0 ? event : idx === 1 ? element : undefined))
                    : () => [];
                runExpr = (event) => {
                    const ctx = self._createContextProxy(event, element);
                    compiledArrow.call(thisCtx, ctx, ...mapArgs(event));
                };
            }
            else if (hasExpr) {
                const isStatement = trimmed.includes(';');
                const executor = self._createEvaluator(trimmed, isStatement);
                runExpr = (event) => {
                    const ctx = self._createContextProxy(event, element);
                    const result = executor.call(thisCtx, ctx);
                    if (typeof result === 'function')
                        result.call(thisCtx, event);
                };
            }
            const createEventHandler = (event) => {
                if (!passesFilters(event))
                    return;
                if (shouldPrevent && typeof event.preventDefault === 'function')
                    event.preventDefault();
                if (shouldStop && typeof event.stopPropagation === 'function')
                    event.stopPropagation();
                if (!runExpr)
                    return;
                if (deferExec && typeof queueMicrotask === 'function') {
                    const ev = event;
                    queueMicrotask(() => self._safeExecute(() => runExpr(ev)));
                    return;
                }
                self._safeExecute(() => runExpr(event));
            };
            const cfg = this.framework._getConfig();
            const canDelegate = !!cfg.delegate && ['click', 'input', 'change', 'keydown', 'keyup'].includes(eventName);
            if (!isOutside && canDelegate) {
                const remover = this.framework._registerDelegated(element, eventName, { filter: (e) => passesFilters(e), run: (e) => createEventHandler(e), once: !!modifiers?.once, comp: this });
                this._addCleanupFunction(remover);
            }
            else {
                const target = isOutside ? (element?.ownerDocument || d || document) : element;
                self._addEventListenerWithCleanup(target, eventName, createEventHandler, opts);
            }
        }
        _createEvaluator(expression, isStatement = false) {
            const key = `${isStatement ? 's' : 'r'}:${expression}`;
            let fn = this._expressionCache.get(key);
            if (!fn) {
                fn = new Function('ctx', `with(ctx){${isStatement ? expression : `return (${expression})`}}`);
                this._expressionCache.set(key, fn);
            }
            return fn;
        }
        _createElementEvaluator(expression, element) {
            const self = this;
            const compiled = self._createEvaluator(expression);
            return () => this._safeExecute(() => compiled.call(self._createMethodContext(), self._createContextProxy(undefined, element)), `Error evaluating expression: ${expression}`);
        }
        _extractArrowFunction(expression) {
            let m = expression.match(/^\s*\(\s*([^)]*?)\s*\)\s*=>\s*([\s\S]+)$/);
            if (!m)
                m = expression.match(/^\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=>\s*([\s\S]+)$/);
            if (!m)
                return null;
            const params = (m[1] || '')
                .split(',')
                .map(p => p.trim())
                .filter(Boolean);
            const body = (m[2] || '').trim();
            const isBlock = body.startsWith('{') && body.endsWith('}');
            const finalBody = isBlock ? body.slice(1, -1) : body;
            return { paramsList: params, body: finalBody, isBlock };
        }
        _compileArrowForEvent(params, body, isBlock) {
            const content = isBlock ? body : 'return ( ' + body + ' );';
            return new Function('ctx', ...params, 'with(ctx){ ' + content + ' }');
        }
        _wrapData(data, parentKey) {
            if (!(Object.getPrototypeOf(data) === Object.prototype || ARRAY_ISARRAY(data)))
                return data;
            const self = this;
            if (!this._deepReactiveCache)
                this._deepReactiveCache = new WeakMap();
            if (this._deepReactiveCache.has(data))
                return this._deepReactiveCache.get(data);
            const proxy = new Proxy(data, {
                get: (target, p, receiver) => {
                    if (ARRAY_ISARRAY(target)) {
                        if (p === Symbol.iterator) {
                            self._trackDependency(parentKey);
                            return Reflect.get(target, p, receiver);
                        }
                        if (p === 'length' || (typeof p === 'string' && /^\d+$/.test(p))) {
                            self._trackDependency(parentKey);
                        }
                    }
                    else {
                        self._trackDependency(parentKey);
                    }
                    const value = Reflect.get(target, p, receiver);
                    if (ARRAY_ISARRAY(target) && typeof value === 'function' && ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse', 'copyWithin', 'fill'].includes(p)) {
                        return function (...args) {
                            const arr = target;
                            const beforeLen = arr.length;
                            const beforeFirst = arr[0];
                            const beforeLast = arr[beforeLen - 1];
                            const result = value.apply(target, args);
                            if (arr.length !== beforeLen || arr[0] !== beforeFirst || arr[arr.length - 1] !== beforeLast) {
                                self._onDataChange(parentKey);
                            }
                            return result;
                        };
                    }
                    const type = typeof value;
                    if (value && type === 'object') {
                        return self._wrapData(value, parentKey);
                    }
                    return value;
                },
                ownKeys: (target) => { return Reflect.ownKeys(target); },
                has: (target, key) => { return Reflect.has(target, key); },
                set: (target, p, value) => {
                    if (self._isDestroyed)
                        return true;
                    if (typeof p === 'symbol')
                        return true;
                    const had = Reflect.has(target, p);
                    const oldValue = had ? Reflect.get(target, p) : undefined;
                    if (value && typeof value === 'object') {
                        self._wrapData(value, parentKey);
                    }
                    if (!had) {
                        try {
                            Reflect.defineProperty(target, p, {
                                configurable: true,
                                enumerable: true,
                                writable: true,
                                value
                            });
                        }
                        catch {
                            Reflect.set(target, p, value);
                        }
                        self._onDataChange(parentKey);
                        return true;
                    }
                    if (oldValue === value)
                        return true;
                    Reflect.set(target, p, value);
                    self._onDataChange(parentKey);
                    return true;
                },
                deleteProperty: (target, p) => Reflect.deleteProperty(target, p)
            });
            this._deepReactiveCache.set(data, proxy);
            return proxy;
        }
        _createReactiveData(data) {
            const self = this;
            return new Proxy(data, {
                get: (target, property, receiver) => {
                    const value = Reflect.get(target, property, receiver);
                    if (property === Symbol.iterator)
                        return value;
                    if (typeof property !== 'symbol') {
                        self._trackDependency(property);
                    }
                    if (value && typeof value == 'object') {
                        return self._wrapData(value, property);
                    }
                    return value;
                },
                ownKeys: (target) => Reflect.ownKeys(target),
                has: (target, key) => Reflect.has(target, key),
                set: (target, property, value, receiver) => {
                    if (self._isDestroyed)
                        return true;
                    if (property === Symbol.iterator && ARRAY_ISARRAY(target))
                        return value;
                    const oldValue = Reflect.get(target, property);
                    if (oldValue === value)
                        return true;
                    const had = Reflect.has(target, property);
                    if (!had) {
                        try {
                            Reflect.defineProperty(target, property, {
                                configurable: true,
                                enumerable: true,
                                writable: true,
                                value
                            });
                        }
                        catch {
                            Reflect.set(target, property, value, receiver);
                        }
                    }
                    else {
                        Reflect.set(target, property, value, receiver);
                    }
                    this._onDataChange(property);
                    if (this._propUpdateActive && property !== '$props') {
                        const pc = target.$props;
                        if (pc)
                            pc[property] = value;
                        const eff = this._propEffects[property];
                        if (eff && !this._runningPropEffect) {
                            this._runningPropEffect = true;
                            this._safeExecute(() => eff.call(this._createMethodContext(), value, oldValue));
                            this._runningPropEffect = false;
                        }
                    }
                    return true;
                }
            });
        }
        _createMethodContext(_includeComputed = true) {
            const specials = {
                '$log': (..._args) => { },
                '$destroy': () => this.destroy(),
                '$forceUpdate': () => this._scheduleRender(),
                '$addCleanupFunction': (fn) => this._addCleanupFunction(fn),
                '$nextTick': (cb) => {
                    if (cb) {
                        this._nextTickQueue.push(cb);
                        if (!this._renderScheduled)
                            queueMicrotask(() => {
                                if (!this._renderScheduled && this._nextTickQueue.length) {
                                    const q = this._nextTickQueue.splice(0, this._nextTickQueue.length);
                                    for (const fn of q) {
                                        try {
                                            fn();
                                        }
                                        catch { }
                                    }
                                }
                            });
                        return;
                    }
                    return new Promise(resolve => {
                        this._nextTickQueue.push(() => resolve());
                        if (!this._renderScheduled)
                            queueMicrotask(() => {
                                if (!this._renderScheduled && this._nextTickQueue.length) {
                                    const q = this._nextTickQueue.splice(0, this._nextTickQueue.length);
                                    for (const fn of q) {
                                        try {
                                            fn();
                                        }
                                        catch { }
                                    }
                                }
                            });
                    });
                },
                '$el': this._element,
                '$id': this._id,
                '$isMounted': this._isMounted,
                '$isDestroyed': this._isDestroyed,
                '$parent': this._parent,
                '$children': this._children,
                '$mutate': (fn) => {
                    const prevMethod = this._isInMethodExecution;
                    const prevComputed = this._isInComputedEvaluation;
                    this._isInMethodExecution = false;
                    this._isInComputedEvaluation = false;
                    try {
                        return typeof fn === 'function' ? fn() : undefined;
                    }
                    finally {
                        this._isInMethodExecution = prevMethod;
                        this._isInComputedEvaluation = prevComputed;
                        this._scheduleRender();
                    }
                }
            };
            return new Proxy(this._data, {
                get: (target, propStr) => {
                    if (propStr in target) {
                        this._trackDependency(propStr);
                        const v = target[propStr];
                        return v;
                    }
                    if (FT_C && (propStr in this._computed))
                        return this._getComputedValue(propStr);
                    if (propStr in specials)
                        return specials[propStr];
                    return this._methods[propStr];
                },
                set: (_target, propStr, value) => {
                    if (this._isInComputedEvaluation) {
                        if (typeof console !== 'undefined' && console.warn)
                            console.warn(`Ignored mutation of '${String(propStr)}' inside ${this._isInComputedEvaluation ? 'computed' : 'method'}; wrap in $mutate(()=>{ ... }) to apply.`);
                        return true;
                    }
                    this._data[propStr] = value;
                    return true;
                }
            });
        }
        _createContextProxy(event, targetElement) {
            const component = this;
            const mergedScope = targetElement ? this._collectLoopScope(targetElement) : null;
            const scopeKeys = mergedScope ? new Set(_Okeys(mergedScope)) : new Set();
            const gWindow = (typeof window !== 'undefined' ? window : undefined);
            const gDocument = (typeof document !== 'undefined' ? document : undefined);
            const cfg = this.framework._getConfig();
            const sandbox = !!cfg.sandboxExpressions;
            const allow = new Set((cfg.allowGlobals || []).map(s => String(s)));
            const wrapTarget = (t) => {
                if (!t)
                    return t;
                const hasAdd = typeof t.addEventListener === 'function';
                if (!hasAdd)
                    return t;
                const handlerMap = new WeakMap();
                const makeKey = (event, options) => {
                    try {
                        return event + '|' + (options === undefined ? '' : (typeof options === 'object' ? JSON.stringify(options) : String(options)));
                    }
                    catch {
                        return event + '|';
                    }
                };
                return new Proxy(t, {
                    get(target, prop, receiver) {
                        if (prop === 'addEventListener') {
                            return function (event, handler, options) {
                                target.addEventListener(event, handler, options);
                                const remover = component._addCleanupFunction(() => { try {
                                    target.removeEventListener(event, handler, options);
                                }
                                catch { } });
                                try {
                                    if (typeof handler === 'function' && remover) {
                                        let m = handlerMap.get(handler);
                                        if (!m) {
                                            m = new Map();
                                            handlerMap.set(handler, m);
                                        }
                                        m.set(makeKey(event, options), remover);
                                    }
                                }
                                catch { }
                            };
                        }
                        if (prop === 'removeEventListener') {
                            return function (event, handler, options) {
                                try {
                                    target.removeEventListener(event, handler, options);
                                }
                                catch { }
                                try {
                                    if (typeof handler === 'function') {
                                        const m = handlerMap.get(handler);
                                        if (m) {
                                            const key = makeKey(event, options);
                                            const rem = m.get(key);
                                            if (rem) {
                                                try {
                                                    rem();
                                                }
                                                catch { }
                                                ;
                                                m.delete(key);
                                            }
                                            if (m.size === 0)
                                                handlerMap.delete(handler);
                                        }
                                    }
                                }
                                catch { }
                            };
                        }
                        if (prop === 'querySelector') {
                            return function (sel) { const res = target.querySelector(sel); return wrapTarget(res); };
                        }
                        if (prop === 'querySelectorAll') {
                            return function (sel) { const list = target.querySelectorAll(sel); return Array.from(list).map(wrapTarget); };
                        }
                        if (prop === 'getElementById') {
                            return function (id) { const res = target.getElementById(id); return wrapTarget(res); };
                        }
                        if (prop === 'document') {
                            const doc = target.document;
                            return wrapTarget(doc) || doc;
                        }
                        if (prop === 'body' && target === gDocument) {
                            const b = target.body;
                            return wrapTarget(b) || b;
                        }
                        if (prop === 'defaultView' && target === gDocument) {
                            const w = target.defaultView;
                            return wrapTarget(w) || w;
                        }
                        return Reflect.get(target, prop, receiver);
                    }
                });
            };
            const _timeoutRemovers = new Map();
            const _intervalRemovers = new Map();
            const _rafRemovers = new Map();
            const ctxSetTimeout = (fn, ms, ...args) => {
                const id = gWindow?.setTimeout?.(fn, ms, ...args);
                if (id != null) {
                    const remover = component._addCleanupFunction(() => { try {
                        gWindow?.clearTimeout?.(id);
                    }
                    catch { } });
                    _timeoutRemovers.set(id, remover);
                }
                return id;
            };
            const ctxSetInterval = (fn, ms, ...args) => {
                const id = gWindow?.setInterval?.(fn, ms, ...args);
                if (id != null) {
                    const remover = component._addCleanupFunction(() => { try {
                        gWindow?.clearInterval?.(id);
                    }
                    catch { } });
                    _intervalRemovers.set(id, remover);
                }
                return id;
            };
            const ctxRequestAnimationFrame = (cb) => {
                const id = gWindow?.requestAnimationFrame?.(cb);
                if (id != null) {
                    const remover = component._addCleanupFunction(() => { try {
                        gWindow?.cancelAnimationFrame?.(id);
                    }
                    catch { } });
                    _rafRemovers.set(id, remover);
                }
                return id;
            };
            const wrapObserverCtor = (Orig) => {
                if (!Orig)
                    return undefined;
                const Wrapped = function (...args) {
                    const inst = new Orig(...args);
                    component._addCleanupFunction(() => { try {
                        inst.disconnect();
                    }
                    catch { } });
                    return inst;
                };
                Wrapped.prototype = Orig.prototype;
                return Wrapped;
            };
            const specials = {
                '$target': targetElement || null,
                '$event': event || null,
                ...(sandbox && !allow.has('setTimeout') ? {} : { 'setTimeout': ctxSetTimeout }),
                ...(sandbox && !allow.has('clearTimeout') ? {} : { 'clearTimeout': (id) => { try {
                        gWindow?.clearTimeout?.(id);
                    }
                    catch { }
                    finally {
                        try {
                            const r = _timeoutRemovers.get(id);
                            if (r) {
                                r();
                                _timeoutRemovers.delete(id);
                            }
                        }
                        catch { }
                    } } }),
                ...(sandbox && !allow.has('setInterval') ? {} : { 'setInterval': ctxSetInterval }),
                ...(sandbox && !allow.has('clearInterval') ? {} : { 'clearInterval': (id) => { try {
                        gWindow?.clearInterval?.(id);
                    }
                    catch { }
                    finally {
                        try {
                            const r = _intervalRemovers.get(id);
                            if (r) {
                                r();
                                _intervalRemovers.delete(id);
                            }
                        }
                        catch { }
                    } } }),
                ...(sandbox && !allow.has('requestAnimationFrame') ? {} : { 'requestAnimationFrame': ctxRequestAnimationFrame }),
                ...(sandbox && !allow.has('cancelAnimationFrame') ? {} : { 'cancelAnimationFrame': (id) => { try {
                        gWindow?.cancelAnimationFrame?.(id);
                    }
                    catch { }
                    finally {
                        try {
                            const r = _rafRemovers.get(id);
                            if (r) {
                                r();
                                _rafRemovers.delete(id);
                            }
                        }
                        catch { }
                    } } }),
                ...(sandbox && !allow.has('MutationObserver') ? {} : { 'MutationObserver': wrapObserverCtor(gWindow?.MutationObserver) }),
                ...(sandbox && !allow.has('ResizeObserver') ? {} : { 'ResizeObserver': wrapObserverCtor(gWindow?.ResizeObserver) }),
                ...(sandbox && !allow.has('IntersectionObserver') ? {} : { 'IntersectionObserver': wrapObserverCtor(gWindow?.IntersectionObserver) }),
                ...(sandbox && !allow.has('window') ? {} : { 'window': wrapTarget(gWindow) }),
                ...(sandbox && !allow.has('document') ? {} : { 'document': wrapTarget(gDocument) })
            };
            return new Proxy({}, {
                get: (_t, propStr) => {
                    if (mergedScope && propStr in mergedScope)
                        return mergedScope[propStr];
                    if (propStr in component._data)
                        return component._data[propStr];
                    if (propStr in component._computed)
                        return component._getComputedValue(propStr);
                    if (propStr in component._methods)
                        return component._methods[propStr];
                    if (propStr in specials)
                        return specials[propStr];
                    return undefined;
                },
                set: (_t, propStr, value) => {
                    if (mergedScope && scopeKeys.has(propStr)) {
                        mergedScope[propStr] = value;
                    }
                    else {
                        component._data[propStr] = value;
                    }
                    return true;
                },
                has: (_t, propStr) => !!(mergedScope && propStr in mergedScope) ||
                    propStr in component._data ||
                    propStr in component._computed ||
                    propStr in component._methods ||
                    propStr in specials
            });
        }
        _bindCustomDirective(element, _name, expression, directive, modifiers) {
            const self = this;
            const evaluator = self._createElementEvaluator(expression, element);
            const directiveInfo = { type: 'custom', expression, customDirective: directive };
            if (directive.bind) {
                self._safeExecute(() => directive.bind(element, evaluator(), expression, self, modifiers, evaluator));
            }
            const update = () => {
                if (directive.update)
                    self._safeExecute(() => directive.update(element, evaluator(), expression, self, modifiers, evaluator));
            };
            const effect = self._createEffect(update);
            directiveInfo.update = effect;
            self._addDirective(element, directiveInfo);
        }
        _bindAttributeDirective(element, attributeName, expression) {
            const self = this;
            const evaluator = self._createElementEvaluator(expression, element);
            if (attributeName === 'class') {
                const el = element;
                if (!self._initialClassSets.get(el)) {
                    const baseSet = new Set();
                    const oc = el.className || '';
                    if (oc)
                        for (const cls of oc.split(/\s+/)) {
                            if (cls)
                                baseSet.add(cls);
                        }
                    self._initialClassSets.set(el, baseSet);
                }
            }
            const elAny = element;
            let propName = null;
            if (attributeName in elAny)
                propName = attributeName;
            else {
                const camel = attributeName.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
                if (camel in elAny)
                    propName = camel;
                else if (attributeName.toLowerCase() === 'readonly' && 'readOnly' in elAny)
                    propName = 'readOnly';
            }
            const isBooleanProp = !!(propName && typeof elAny[propName] === 'boolean');
            const hasNonFunctionProp = !!(propName && (propName in elAny) && typeof elAny[propName] !== 'function');
            const isKnownBooleanAttr = !!ReactiveComponent._BA[attributeName.toLowerCase()];
            const update = () => {
                const value = evaluator();
                if (attributeName === 'class') {
                    const el = element;
                    const base = self._initialClassSets.get(el);
                    if (typeof value === 'string') {
                        el.className = base && base.size ? [...base].join(' ') + (value ? ' ' + value : '') : value || '';
                    }
                    else if (ARRAY_ISARRAY(value)) {
                        if (base && base.size)
                            el.className = [...base, ...value.filter(Boolean)].join(' ');
                        else
                            el.className = value.filter(Boolean).join(' ');
                    }
                    else if (value && typeof value === 'object') {
                        if (base && base.size)
                            el.className = [...base].join(' ');
                        for (const raw in value) {
                            const on = !!value[raw];
                            if (!raw)
                                continue;
                            const tokens = raw.split(/\s+/);
                            for (let i = 0; i < tokens.length; i++) {
                                const tk = tokens[i];
                                if (!tk)
                                    continue;
                                el.classList.toggle(tk, on);
                            }
                        }
                    }
                    else if (value == null && base && base.size) {
                        el.className = [...base].join(' ');
                    }
                    else if (value == null) {
                        el.removeAttribute('class');
                    }
                    return;
                }
                if (attributeName === STR_STYLE) {
                    const el = element;
                    if (typeof value === 'string') {
                        el.style.cssText = value;
                        return;
                    }
                    if (value && typeof value === 'object') {
                        Object.assign(el.style, value);
                        return;
                    }
                    if (value == null)
                        el.removeAttribute('style');
                    return;
                }
                if ((isBooleanProp && propName) || isKnownBooleanAttr) {
                    const boolVal = !!value;
                    if (propName && isBooleanProp)
                        elAny[propName] = boolVal;
                    if (boolVal)
                        element.setAttribute(attributeName, '');
                    else
                        element.removeAttribute(attributeName);
                    return;
                }
                let normalized = null;
                if (value && typeof value === 'object') {
                    const parts = [];
                    for (const k in value) {
                        if (value[k])
                            parts.push(k);
                    }
                    normalized = parts.length ? parts.join(' ') : null;
                }
                else if (value !== null && value !== undefined) {
                    normalized = String(value);
                }
                if (hasNonFunctionProp && propName) {
                    if (normalized !== null) {
                        try {
                            elAny[propName] = normalized;
                        }
                        catch (e) {
                            try {
                                element.setAttribute(attributeName, normalized);
                            }
                            catch { }
                        }
                    }
                    else {
                        element.removeAttribute(attributeName);
                    }
                    return;
                }
                if (normalized !== null) {
                    const cur = element.getAttribute(attributeName);
                    if (cur !== normalized)
                        element.setAttribute(attributeName, normalized);
                }
                else {
                    if (element.hasAttribute(attributeName))
                        element.removeAttribute(attributeName);
                }
            };
            const effect = self._createEffect(update);
            self._addDirective(element, { type: 'bind', expression, update: effect });
        }
        _collectLoopScope(el) {
            if (!el)
                return null;
            if (!el.parentElement) {
                const cur = el.__x_if_current;
                if (cur && cur.parentElement) {
                    el = cur;
                }
                else {
                    const anchorParent = el.__x_if_anchorParent;
                    if (anchorParent)
                        el = anchorParent;
                }
            }
            const merged = {};
            let node = el;
            while (node) {
                const scope = this._loopScopes.get(node);
                if (scope)
                    Object.assign(merged, scope);
                if (node === this.element)
                    break;
                node = node.parentElement;
            }
            return _Okeys(merged).length ? merged : null;
        }
        _updateElementDirectives(root) {
            for (const [element, directives] of this._directives) {
                for (const directive of directives) {
                    if ((root === element || (element instanceof Element && root.contains(element))) && directive.update) {
                        directive.update();
                    }
                }
            }
        }
        _bindForDirective(element, expression) {
            const self = this;
            const match = expression.trim().match(/^(?:\(\s*([^,\s]+)\s*(?:,\s*([^\)]+))?\s*\)|([^,\s]+))\s+(in|of)\s+(.+)$/);
            if (!match) {
                return;
            }
            const itemVar = match[1] || match[3];
            const indexVar = match[2];
            const listCode = match[5];
            const placeholder = d.createComment('x-for');
            element.parentNode?.insertBefore(placeholder, element);
            let templateToClone;
            if (element[STR_TAGNAME] === STR_TEMPLATE) {
                templateToClone = d.createElement('div');
                templateToClone.style[STR_DISPLAY] = 'contents';
                templateToClone.appendChild(element.content.cloneNode(true));
                element.parentNode?.removeChild(element);
            }
            else {
                templateToClone = element;
                element.parentNode?.removeChild(element);
            }
            const contextAnchor = placeholder.parentElement || self.element;
            const listEval = self._createElementEvaluator(listCode.trim(), contextAnchor);
            const instances = [];
            const createScope = (item, idxOrKey) => {
                const scope = { [itemVar]: item };
                if (indexVar)
                    scope[indexVar] = idxOrKey;
                return scope;
            };
            const update = () => {
                const norm = self._safeExecute(() => {
                    const result = listEval();
                    if (_AisArr(result))
                        return { list: result, keys: null };
                    if (typeof Map !== 'undefined' && result instanceof Map) {
                        return { list: _Afrom(result.values()), keys: _Afrom(result.keys()) };
                    }
                    if (typeof Set !== 'undefined' && result instanceof Set) {
                        return { list: _Afrom(result.values()), keys: null };
                    }
                    if (result && typeof result[Symbol.iterator] === 'function') {
                        return { list: _Afrom(result), keys: null };
                    }
                    if (result && typeof result === 'object') {
                        const keys = Object.keys(result);
                        const list = keys.map(k => result[k]);
                        return { list, keys };
                    }
                    return { list: [], keys: null };
                }, 'x-for eval error', { list: [], keys: null });
                const list = norm.list;
                const keysArr = norm.keys;
                if (instances.length > list.length) {
                    while (instances.length > list.length) {
                        const inst = instances.pop();
                        if (inst.parentNode)
                            inst.parentNode.removeChild(inst);
                    }
                }
                const minLen = Math.min(instances.length, list.length);
                for (let i = 0; i < minLen; i++) {
                    const inst = instances[i];
                    const keyVal = keysArr ? keysArr[i] : i;
                    self._loopScopes.set(inst, createScope(list[i], keyVal));
                    self._updateElementDirectives(inst);
                }
                if (list.length > instances.length) {
                    const frag = d.createDocumentFragment();
                    const start = instances.length;
                    for (let i = start; i < list.length; i++) {
                        const clone = templateToClone.cloneNode(true);
                        clone.removeAttribute('x-for');
                        const keyVal = keysArr ? keysArr[i] : i;
                        self._loopScopes.set(clone, createScope(list[i], keyVal));
                        try {
                            self._parseDirectives(clone);
                        }
                        catch { }
                        frag.appendChild(clone);
                        instances.push(clone);
                    }
                    const ref = instances[start - 1] || placeholder;
                    if (ref.parentNode)
                        ref.parentNode.insertBefore(frag, ref.nextSibling);
                }
            };
            const dir = { type: 'for', expression };
            const effect = self._createEffect(update, dir);
            dir.update = effect;
            self._addDirective(placeholder, dir);
        }
        _render() {
            const self = this;
            for (const directives of self._directives.values()) {
                for (const dr of directives) {
                    if (XTOOL_ENABLE_STATIC_DIRECTIVES && dr._static)
                        continue;
                    if (dr.update) {
                        try {
                            dr.update();
                        }
                        catch (error) {
                            if (!(error instanceof ReferenceError)) { }
                        }
                    }
                }
            }
        }
    }
    ReactiveComponent._BA = {
        itemscope: 1, formnovalidate: 1, novalidate: 1, default: 1
    };
    const xTool = new XToolFramework();
    return xTool;
}();
if (typeof window !== 'undefined') {
    const w = window;
    w.XTool = XToolFramework;
    w.FyneJS = XToolFramework;
}
//# sourceMappingURL=x-tool.js.map