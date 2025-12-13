// Dynamic Demo Component Loader (refactored to use XTool.loadComponents)
(function () {
  // List of advanced example component scripts (Examples section only)
  const componentFiles = [
     'interactive-showcase.ts',
    'advanced-todo.js',
    'timer-demo.js',
    'data-chart.js',
    'advanced-form.js',
    'search-demo.js',
    'shopping-cart.js',
    'advanced-calculator.js',
    'large-list-demo.js',
    'markdown-editor.js',
    'kanban-board.js',
    'realtime-dashboard.js',
    // New advanced performance components
    'virtual-log-stream.js',
    'order-book-ticker.js',
    'network-graph-mini.js',
    'timeseries-resampler.js',
  ];
  const basePath = 'components/';
  function installCodeBlock() {
    // Simple language guesser for code blocks
    const guessLang = (code) => {
      const txt = code.trim();
      if (/^</.test(txt) && /<\/?(div|span|script|component|button)/i.test(txt)) return 'html';
      if (/\b(XTool|function|=>|const|let|var)\b/.test(txt)) return 'js';
      if (/npm install|yarn add|pnpm add/.test(txt)) return 'bash';
      return '';
    };
    document.querySelectorAll('pre > code').forEach(codeEl => {
      const pre = codeEl.parentElement;
      if (pre.classList.contains('enhanced')) return;
      // Normalize classes for consistency
      pre.classList.add('enhanced', 'code-block', 'xt-code', 'scrollbar-hide');
      // Remove tailwind color background modifiers to avoid inconsistency
      pre.className = pre.className
        .split(/\s+/)
        .filter(c => !/^text-green|^text-blue|^text-gray-\d+$|^bg-gray-900$|^bg-slate|^text-slate/.test(c))
        .join(' ');
      const raw = codeEl.textContent;
      const lang = guessLang(raw);
      if (lang) pre.dataset.lang = lang;
      // Line numbers if multiline & longer than 3 lines
      const lines = raw.split(/\n/);
      if (lines.length > 3) {
        codeEl.innerHTML = lines.map(l => `<span>${l.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</span>`).join('\n');
        pre.classList.add('code-line-numbers');
        pre.style.setProperty('--ln-pad', '8px');
      }
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'copy-btn';
      btn.innerHTML = '<svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 16h8M8 12h8m-6 8h4a2 2 0 002-2V6a2 2 0 00-2-2H8a2 2 0 00-2 2v12a2 2 0 002 2zm10 0h1a2 2 0 002-2V8m-6-6h-2"/></svg><span>Copy</span>';
      btn.addEventListener('click', () => {
        navigator.clipboard.writeText(raw).then(() => {
          btn.classList.add('copied');
          btn.querySelector('span').textContent = 'Copied';
          setTimeout(() => { btn.classList.remove('copied'); btn.querySelector('span').textContent = 'Copy'; }, 1600);
        });
      });
      pre.prepend(btn);
      const fade = document.createElement('div');
      fade.className = 'code-fade';
      pre.appendChild(fade);
    });
  }

  function installGtag() {
    // Lets include the gtag script before the end body if not already present
    const existingGtag = document.querySelector('script[src*="www.googletagmanager.com/gtag/js"]');
    if (!existingGtag) {
      const gtagScript = document.createElement('script');
      gtagScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-1ZJ9J95NPP';
      gtagScript.async = true;
      document.body.appendChild(gtagScript);
      const gtagInit = document.createElement('script');
      gtagInit.text = `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-1ZJ9J95NPP');
        `;
      document.body.appendChild(gtagInit);
    }
  }
  function immediateInit() {

    installCodeBlock();
    installGtag()
    // Perform the core page init ASAP (without waiting for example components)
    if (!window.__XTOOL_INITIALIZED__) {
      window.__XTOOL_INITIALIZED__ = true;
      try {
        XTool.init({
          container: 'body', debug: true, router: {
            enabled: true,
            prefetchOnHover: true,
            after: (to, from) => {
              console.log('[x-tool] Route changed:', from, '→', to);
              // Reinstall code blocks on route change (for dynamically added content)
              setTimeout(installCodeBlock, 100); // Slight delay to allow DOM updates
            }
          }
        });
        console.log('[x-tool] Core page initialized (examples will load asynchronously).');
      } catch (e) {
        console.error('[x-tool] Failed initial init', e);
      }
    }
  }

  function scheduleAsyncLoad() {
    // Use the new loader with lazy mode to avoid blocking initial rendering
    const sources = componentFiles.map(f => ({ path: basePath + f, mode: 'lazy' }));
    XTool.loadComponents(sources).then(() => {
      console.log('[x-tool] [async-demo] Example components loaded via XTool.loadComponents (lazy).');
      // If user landed directly on #examples ensure we scroll after mounting components
      if (location.hash === '#examples') {
        const el = document.querySelector("[data-section='examples']");
        if (el) {
          requestAnimationFrame(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }));
        }
      }
    });
  }

  function onReady() {
    immediateInit();
    scheduleAsyncLoad();
    // If hash is #examples at initial load, perform an early scroll so layout parity matches other sections
    if (location.hash === '#examples') {
      const el = document.querySelector("[data-section='examples']");
      if (el) {
        // Use a tiny delay to allow initial layout
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
})();
