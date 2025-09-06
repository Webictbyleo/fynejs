"use strict";
globalThis.XTool?.directive?.('selection', {
    bind(el, value, _expr, _comp, _mods, evaluator) {
        const resolveFn = () => {
            if (typeof value === 'function')
                return value;
            const ev = evaluator ? evaluator() : undefined;
            return typeof ev === 'function' ? ev : undefined;
        };
        el.__x_selectionGetFn = resolveFn;
        const isInputLike = (node) => node && (node.tagName === 'INPUT' || node.tagName === 'TEXTAREA');
        const isEditable = (node) => !!(node && (node.isContentEditable || isInputLike(node)));
        const plainRect = (r) => r ? ({ x: r.x, y: r.y, top: r.top, left: r.left, right: r.right, bottom: r.bottom, width: r.width, height: r.height }) : null;
        function buildRangePayload(range, sel) {
            const text = range.toString();
            let html = null;
            try {
                const frag = range.cloneContents();
                const div = document.createElement('div');
                div.appendChild(frag);
                html = div.innerHTML || null;
            }
            catch {
                html = null;
            }
            const rect = plainRect(range.getBoundingClientRect());
            const elementRect = plainRect(el.getBoundingClientRect());
            const rects = [];
            try {
                const list = range.getClientRects();
                for (let i = 0; i < list.length && i < 10; i++)
                    rects.push(plainRect(list[i]));
            }
            catch { }
            const anchorNode = sel.anchorNode || null;
            const focusNode = sel.focusNode || null;
            const anchorOffset = sel.anchorOffset;
            const focusOffset = sel.focusOffset;
            const isCollapsed = sel.isCollapsed;
            let direction = 'unknown';
            if (isCollapsed)
                direction = 'none';
            else if (anchorNode === focusNode)
                direction = focusOffset > anchorOffset ? 'forward' : 'backward';
            else {
                try {
                    const test = document.createRange();
                    test.setStart(anchorNode, anchorOffset);
                    test.setEnd(focusNode, focusOffset);
                    direction = test.collapsed ? 'backward' : 'forward';
                }
                catch { }
            }
            return {
                type: 'range',
                text,
                html,
                isCollapsed,
                direction,
                anchorOffset,
                focusOffset,
                anchorNodeName: anchorNode && anchorNode.nodeName || null,
                focusNodeName: focusNode && focusNode.nodeName || null,
                rect,
                elementRect,
                rects,
                toString: () => text,
                toHTML: () => html
            };
        }
        function buildInputPayload(inputEl) {
            const start = inputEl.selectionStart ?? 0;
            const end = inputEl.selectionEnd ?? start;
            const dir = inputEl.selectionDirection || (start === end ? 'none' : 'forward');
            const valueText = inputEl.value || '';
            return {
                type: 'input',
                isCollapsed: start === end,
                startOffset: start,
                endOffset: end,
                direction: dir,
                text: valueText.substring(start, end),
                fullText: valueText,
                before: valueText.substring(0, start),
                after: valueText.substring(end),
                length: end - start
            };
        }
        const invoke = (e) => {
            const fn = el.__x_selectionGetFn?.();
            if (typeof fn !== 'function')
                return;
            let payload = null;
            if (isInputLike(el)) {
                payload = buildInputPayload(el);
            }
            else {
                const sel = document.getSelection();
                if (sel && sel.rangeCount > 0) {
                    const range = sel.getRangeAt(0);
                    const container = range.commonAncestorContainer;
                    const within = el.contains(container.nodeType === 1 ? container : container.parentElement);
                    if (within)
                        payload = buildRangePayload(range, sel);
                }
            }
            if (!payload)
                return;
            try {
                fn.length >= 2 ? fn(payload, e) : fn(payload);
            }
            catch { }
        };
        const docSelectionHandler = () => invoke(new Event('selectionchange'));
        const localEvents = ['mouseup', 'keyup', 'input', 'select'];
        if (isInputLike(el)) {
            localEvents.forEach(ev => el.addEventListener(ev, invoke));
        }
        else if (isEditable(el)) {
            document.addEventListener('selectionchange', docSelectionHandler, true);
            localEvents.slice(0, 2).forEach(ev => el.addEventListener(ev, invoke));
        }
        else {
            document.addEventListener('selectionchange', docSelectionHandler, true);
            ['mouseup', 'keyup'].forEach(ev => document.addEventListener(ev, docSelectionHandler, true));
        }
        el.__x_selectionCleanup = () => {
            if (isInputLike(el)) {
                localEvents.forEach(ev => el.removeEventListener(ev, invoke));
            }
            else if (isEditable(el)) {
                document.removeEventListener('selectionchange', docSelectionHandler, true);
                localEvents.slice(0, 2).forEach(ev => el.removeEventListener(ev, invoke));
            }
            else {
                document.removeEventListener('selectionchange', docSelectionHandler, true);
                ['mouseup', 'keyup'].forEach(ev => document.removeEventListener(ev, docSelectionHandler, true));
            }
        };
    },
    update(el, value, _expr, _comp, _mods, evaluator) {
        el.__x_selectionGetFn = () => {
            if (typeof value === 'function')
                return value;
            const ev = evaluator ? evaluator() : undefined;
            return typeof ev === 'function' ? ev : undefined;
        };
    },
    unbind(el) {
        el.__x_selectionCleanup?.();
        delete el.__x_selectionGetFn;
        delete el.__x_selectionCleanup;
    }
});
//# sourceMappingURL=selection.js.map