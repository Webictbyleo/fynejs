"use strict";
globalThis.XTool?.directive?.('clipboard-paste', {
    bind(el, value, _expression, _component, modifiers, evaluator) {
        el.__x_clipboardGetFn = () => {
            const v = value;
            if (typeof v === 'function')
                return v;
            const ev = evaluator ? evaluator() : undefined;
            return typeof ev === 'function' ? ev : undefined;
        };
        const buildPayload = (e) => {
            const dt = e.clipboardData;
            let text = null, html = null, rtf = null;
            const files = [];
            const items = [];
            const types = [];
            if (dt) {
                try {
                    text = dt.getData('text/plain') || null;
                }
                catch { }
                try {
                    html = dt.getData('text/html') || null;
                }
                catch { }
                try {
                    rtf = dt.getData('text/rtf') || null;
                }
                catch { }
                for (let i = 0; i < dt.items.length; i++) {
                    const it = dt.items[i];
                    const entry = { kind: it.kind, type: it.type };
                    if (it.kind === 'string') {
                        entry.getAsString = () => new Promise(res => {
                            try {
                                it.getAsString(str => res(str));
                            }
                            catch {
                                res(null);
                            }
                        });
                    }
                    else if (it.kind === 'file') {
                        const f = it.getAsFile();
                        if (f) {
                            entry.file = f;
                            files.push(f);
                        }
                    }
                    items.push(entry);
                }
                for (let i = 0; i < dt.types.length; i++)
                    types.push(dt.types[i]);
            }
            const get = (type) => {
                if (!dt)
                    return null;
                try {
                    return dt.getData(type) || null;
                }
                catch {
                    return null;
                }
            };
            const getText = (type) => get(type);
            const asDataURL = (file) => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onerror = () => reject(reader.error || new Error('read error'));
                reader.onload = () => resolve(String(reader.result));
                try {
                    reader.readAsDataURL(file);
                }
                catch (err) {
                    reject(err);
                }
            });
            return { text, html, rtf, files, items, types, get, getText, asDataURL };
        };
        const invoke = (e) => {
            const fn = el.__x_clipboardGetFn?.();
            if (typeof fn === 'function') {
                const payload = buildPayload(e);
                try {
                    fn.length >= 2 ? fn(payload, e) : fn(payload);
                }
                catch { }
            }
        };
        const isNativePasteable = () => {
            const tn = el.tagName;
            return tn === 'TEXTAREA' || tn === 'INPUT' || el.isContentEditable === true;
        };
        const localHandler = (e) => invoke(e);
        const ARM_WINDOW_MS = 4000;
        el.__x_clipboardArmedAt = 0;
        const arm = () => { el.__x_clipboardArmedAt = Date.now(); };
        const shouldRouteGlobal = (e) => {
            if (isNativePasteable())
                return false;
            if (!modifiers?.global && el.__x_clipboardArmedAt === 0)
                return false;
            const elapsed = Date.now() - el.__x_clipboardArmedAt;
            if (elapsed > ARM_WINDOW_MS)
                return false;
            const active = document.activeElement;
            if (active && active !== el && el.contains(active))
                return false;
            return true;
        };
        const globalHandler = (e) => {
            if (shouldRouteGlobal(e))
                invoke(e);
        };
        const armerEvents = ['click', 'focus', 'dragenter', 'mouseenter'];
        const addArmListeners = () => armerEvents.forEach(ev => el.addEventListener(ev, arm, { passive: true }));
        const removeArmListeners = () => armerEvents.forEach(ev => el.removeEventListener(ev, arm));
        if (isNativePasteable()) {
            el.__x_clipboardHandler = localHandler;
            el.addEventListener('paste', localHandler);
        }
        else {
            addArmListeners();
            el.__x_clipboardGlobalHandler = globalHandler;
            document.addEventListener('paste', globalHandler, true);
        }
    },
    update(el, value, _expr, _comp, _mods, evaluator) {
        el.__x_clipboardGetFn = () => {
            const v = value;
            if (typeof v === 'function')
                return v;
            const ev = evaluator ? evaluator() : undefined;
            return typeof ev === 'function' ? ev : undefined;
        };
    },
    unbind(el) {
        const h = el.__x_clipboardHandler;
        if (h)
            el.removeEventListener('paste', h);
        const gh = el.__x_clipboardGlobalHandler;
        if (gh)
            document.removeEventListener('paste', gh, true);
        if (el.__x_clipboardArmedAt !== undefined) {
            ['click', 'focus', 'dragenter', 'mouseenter'].forEach(ev => el.removeEventListener(ev, el.__x_clipboardArmRef || (() => { })));
        }
        delete el.__x_clipboardHandler;
        delete el.__x_clipboardGlobalHandler;
        delete el.__x_clipboardGetFn;
        delete el.__x_clipboardArmedAt;
    }
});
//# sourceMappingURL=clipboardPaste.js.map