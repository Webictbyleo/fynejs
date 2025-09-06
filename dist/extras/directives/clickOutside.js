"use strict";
globalThis.XTool?.directive?.('click-outside', {
    bind(el, value, _expr, _comp, _mods, evaluator) {
        const initial = typeof value === 'function' ? value : (evaluator ? evaluator() : undefined);
        el.__x_clickOutsideCallback = initial;
        const outsideHandler = (evt) => {
            if (!el.isConnected)
                return;
            if (!el.contains(evt.target)) {
                const cb = el.__x_clickOutsideCallback;
                if (typeof cb === 'function') {
                    try {
                        cb(evt);
                    }
                    catch { }
                }
            }
        };
        el.__x_clickOutsideHandler = outsideHandler;
        document.addEventListener('mousedown', outsideHandler, true);
        document.addEventListener('touchstart', outsideHandler, true);
    },
    update(el, value, _expr, _comp, _mods, evaluator) {
        el.__x_clickOutsideCallback = typeof value === 'function' ? value : (evaluator ? evaluator() : value);
    },
    unbind(el) {
        const h = el.__x_clickOutsideHandler;
        if (h) {
            document.removeEventListener('mousedown', h, true);
            document.removeEventListener('touchstart', h, true);
        }
        delete el.__x_clickOutsideHandler;
        delete el.__x_clickOutsideCallback;
    }
});
//# sourceMappingURL=clickOutside.js.map