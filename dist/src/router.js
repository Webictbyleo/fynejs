import { silentError } from "./util";
export function Router(config, frameworkInstance) {
    const d = document;
    const _prefetched = new Set();
    let _currentDocURL = null;
    const _scrollPositions = new Map();
    const _isSameOrigin = (href) => {
        const url = href instanceof URL ? href : new URL(href, location.href);
        return url.origin === location.origin;
    };
    const _isSameDocument = (target) => {
        const url = target instanceof URL ? target : new URL(target, location.href);
        return url.origin === location.origin && url.pathname === location.pathname && url.search === location.search;
    };
    const _normalizeDocURL = function (target) {
        const u = typeof target === 'string' ? new URL(target, d?.baseURI || location.href) : target;
        return `${u.origin}${u.pathname}${u.search}`;
    };
    const _routerEnabled = () => {
        return config.router?.enabled !== false;
    };
    async function _fetchHTML(url) {
        const res = await fetch(url, { credentials: 'same-origin', cache: 'default', redirect: 'follow' });
        if (res.redirected) {
            const finalUrl = res.url;
            try {
                location.assign(finalUrl);
            }
            catch {
                silentError(() => location.href = finalUrl);
            }
            const e = new Error('XToolRedirect');
            e.name = 'XToolRedirect';
            e.url = finalUrl;
            throw e;
        }
        if (!res.ok)
            throw new Error(res.status + ' ' + res.statusText);
        return await res.text();
    }
    async function _swapDocument(html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const newHead = doc.head;
        const newTitle = newHead?.querySelector('title');
        const applySwap = () => {
            if (newTitle) {
                const t = newTitle.textContent || '';
                if (document.title !== t)
                    document.title = t;
            }
            const sel = config.container || 'body';
            const cur = d.querySelector(sel);
            const next = doc.querySelector(sel);
            if (cur && next) {
                _morphElement(cur, next);
            }
            else if (next) {
                d.body.innerHTML = next.innerHTML;
            }
            else {
                d.body.innerHTML = doc.body.innerHTML;
            }
            frameworkInstance._unregisterElement(cur);
            frameworkInstance._autoDiscoverComponents();
            const c = d?.querySelector(config.container);
            if (c) {
                frameworkInstance._ensureRootObserver(c);
                if (config.delegate)
                    frameworkInstance._ensureDelegation(c);
            }
        };
        const vt = (document).startViewTransition?.bind(document);
        if (vt && config.router?.transitionName) {
            const sel = config.container || 'body';
            const cont = d.querySelector(sel);
            const prev = cont ? (cont.style.getPropertyValue('view-transition-name') || '') : '';
            silentError(() => { if (cont)
                cont.style.setProperty('view-transition-name', config.router?.transitionName ?? 'route'); });
            try {
                const transition = vt(applySwap);
                await transition.finished;
            }
            finally {
                try {
                    if (cont) {
                        if (prev)
                            cont.style.setProperty('view-transition-name', prev);
                        else
                            cont.style.removeProperty('view-transition-name');
                    }
                }
                catch { }
            }
        }
        else
            applySwap();
    }
    function _setAttributes(cur, next) {
        const curAttrs = cur.getAttributeNames();
        for (let i = 0; i < curAttrs.length; i++) {
            const name = curAttrs[i];
            if (!next.hasAttribute(name))
                cur.removeAttribute(name);
        }
        const nextAttrs = next.getAttributeNames();
        for (let i = 0; i < nextAttrs.length; i++) {
            const name = nextAttrs[i];
            const val = next.getAttribute(name);
            if (cur.getAttribute(name) !== val)
                if (val !== null) {
                    cur.setAttribute(name, val);
                }
        }
    }
    function _attributesEqual(a, b) {
        const aNames = a.getAttributeNames();
        const bNames = b.getAttributeNames();
        if (aNames.length !== bNames.length)
            return false;
        const map = new Map();
        for (let i = 0; i < aNames.length; i++) {
            const n = aNames[i];
            map.set(n, a.getAttribute(n));
        }
        for (let i = 0; i < bNames.length; i++) {
            const n = bNames[i];
            if (!map.has(n))
                return false;
            if (map.get(n) !== b.getAttribute(n))
                return false;
        }
        return true;
    }
    function _isDynamicNode(el) {
        const tag = el.tagName;
        if (tag === 'IFRAME' && el.hasAttribute('src'))
            return true;
        if (tag === 'COMPONENT' && el.hasAttribute('source'))
            return true;
        return false;
    }
    function _morphElement(cur, next) {
        if (cur.nodeName !== next.nodeName || _isDynamicNode(next)) {
            cur.replaceWith(next.cloneNode(true));
            return;
        }
        _setAttributes(cur, next);
        if (!cur.firstChild && !next.firstChild)
            return;
        const curChildren = Array.from(cur.childNodes);
        const nextChildren = Array.from(next.childNodes);
        const max = nextChildren.length;
        for (let i = 0; i < max; i++) {
            const n = nextChildren[i];
            const c = curChildren[i];
            if (!c) {
                cur.appendChild(n.cloneNode(true));
                continue;
            }
            if (n.nodeType === c.nodeType) {
                if (n.nodeType === 1) {
                    const cn = c;
                    const nn = n;
                    if (_isDynamicNode(nn)) {
                        try {
                            cn.replaceWith(nn.cloneNode(true));
                        }
                        catch { }
                    }
                    else if (cn.nodeName === nn.nodeName && _attributesEqual(cn, nn)) {
                        _morphElement(cn, nn);
                    }
                    else {
                        try {
                            cn.replaceWith(nn.cloneNode(true));
                        }
                        catch { }
                    }
                }
                else {
                    try {
                        c.replaceWith(n.cloneNode(true));
                    }
                    catch { }
                }
            }
            else {
                try {
                    c.replaceWith(n.cloneNode(true));
                }
                catch { }
            }
        }
        if (curChildren.length > max) {
            for (let i = curChildren.length - 1; i >= max; i--) {
                const toRemove = cur.childNodes[i];
                try {
                    cur.removeChild(toRemove);
                }
                catch { }
            }
        }
    }
    function _scrollToHash(hash) {
        try {
            if (!hash || hash === '#')
                return false;
            const id = decodeURIComponent(hash.replace(/^#/, ''));
            const el = d.getElementById(id) || d.querySelector(`[name="${CSS.escape(id)}"]`);
            if (el) {
                el.scrollIntoView({ block: 'start', 'behavior': 'instant' });
                return true;
            }
        }
        catch { }
        return false;
    }
    async function _navigate(url, push, source = 'program') {
        if (!_routerEnabled())
            return Promise.resolve();
        if (!_isSameOrigin(url)) {
            location.assign(url);
            return;
        }
        const targetURL = new URL(url);
        const targetKey = _normalizeDocURL(targetURL);
        if (source !== 'popstate') {
            if (_isSameDocument(targetURL)) {
                location.href = url;
                return;
            }
        }
        else {
            if (_currentDocURL && targetKey === _currentDocURL) {
                _scrollToHash(targetURL.hash);
                return;
            }
        }
        const from = location.href;
        try {
            const res = await (config.router?.before?.(url, from, { source }));
            if (res === false)
                return;
        }
        catch (err) {
            try {
                config.router?.error?.(err, url, from);
            }
            catch { }
            return;
        }
        const curKey = _currentDocURL || _normalizeDocURL(from);
        _scrollPositions.set(curKey, { x: window.scrollX || 0, y: window.scrollY || 0 });
        try {
            const html = await _fetchHTML(url);
            if (push)
                history.pushState({}, '', url);
            await _swapDocument(html);
            _currentDocURL = targetKey;
            silentError(() => {
                if (source === 'popstate') {
                    const pos = _scrollPositions.get(targetKey);
                    if (pos)
                        (window).scrollTo(pos.x, pos.y);
                    else if (!_scrollToHash(targetURL.hash))
                        (window).scrollTo(0, 0);
                }
                else {
                    if (!_scrollToHash(targetURL.hash))
                        (window).scrollTo(0, 0);
                }
            });
            try {
                await config.router?.after?.(url, from, { source });
            }
            catch { }
        }
        catch (err) {
            if (err && (err.name === 'XToolRedirect' || err.message === 'XToolRedirect'))
                return;
            silentError(() => config.router?.error?.(err, url, from));
            try {
                location.assign(url);
            }
            catch {
                silentError(() => location.href = url);
            }
        }
    }
    function _installRouting(root) {
        const preload = (href) => {
            try {
                if (!_isSameOrigin(href))
                    return;
            }
            catch {
                return;
            }
            const u = new URL(href, location.href);
            if (_isSameDocument(u))
                return;
            u.hash = '';
            const url = u.toString();
            if (_prefetched.has(url))
                return;
            const existing = d?.head?.querySelector(`link[rel="prefetch"][href="${CSS.escape(url)}"]`);
            if (existing) {
                _prefetched.add(url);
                return;
            }
            try {
                const link = d.createElement('link');
                link.setAttribute('rel', 'prefetch');
                link.setAttribute('as', 'document');
                link.setAttribute('href', url);
                d.head.appendChild(link);
                _prefetched.add(url);
            }
            catch { }
        };
        const onClick = (e) => {
            const ev = e;
            if (ev.defaultPrevented || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey)
                return;
            let el = ev.target;
            while (el && el !== root && el.tagName !== 'A')
                el = el.parentElement;
            if (!el || el.tagName !== 'A' || el.hasAttribute('download'))
                return;
            const a = el;
            const href = a.getAttribute('href');
            if (!href || href.startsWith('#'))
                return;
            const target = a.getAttribute('target');
            if (target && target.toLowerCase() === '_blank')
                return;
            if (!_isSameOrigin(href))
                return;
            const url = new URL(href, location.href);
            if (_isSameDocument(url))
                return;
            ev.preventDefault();
            _navigate(url.toString(), true, 'link').catch(() => { location.assign(url.toString()); });
        };
        root.addEventListener('click', onClick);
        if (config.router?.prefetchOnHover) {
            const preloadEventHandler = (e) => {
                const t = e.target;
                let el = t;
                while (el && el !== root && el.tagName !== 'A')
                    el = el.parentElement;
                if (!el || el.tagName !== 'A' || el.hasAttribute('download'))
                    return;
                const href = el.getAttribute('href');
                if (!href || href.startsWith('#'))
                    return;
                preload(href);
            };
            root.addEventListener('mouseover', preloadEventHandler, { passive: true });
            root.addEventListener('touchstart', preloadEventHandler, { passive: true });
        }
        window.addEventListener('popstate', () => { _navigate(location.href, false, 'popstate').catch(() => { }); });
        _currentDocURL = _normalizeDocURL(location.href);
    }
    return {
        navigate: _navigate,
        install: _installRouting
    };
}
//# sourceMappingURL=router.js.map