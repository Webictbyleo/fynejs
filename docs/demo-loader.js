// Dynamic Demo Component Loader (modularized)
 // Function to handle html template literals
  function html(strings, ...values){
    return strings.reduce((acc, str, i) => acc + str + (i < values.length ? values[i] : ''), '');
  }
(function(){
  // List of advanced example component scripts (Examples section only)
  const componentFiles = [
     'advanced-todo.js',
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
/*     'order-book-ticker.js',
    'json-tree-explorer.js',
    'network-graph-mini.js',
    'timeseries-resampler.js' */
  ];
  const basePath = 'components/';


  // Load & evaluate a single component file
  async function loadScript(path){
    const url = basePath + path;
    try {
      const res = await fetch(url, { cache: 'no-cache' });
      if(!res.ok) throw new Error(res.status + ' ' + res.statusText);
      const code = await res.text();
      new Function('XTool', code)(window.XTool);
      console.log('[x-tool] [async-demo] Loaded component:', url);
    } catch (e){
      console.error('[x-tool] [async-demo] Failed loading component', url, e);
    }
  }

  // Kick off async loading of all demo components without blocking initial page interactivity
  async function loadAllAsync(){
    console.log('[x-tool] [async-demo] Starting asynchronous example component loading...');
    // Load in parallel (fire & forget, but await settlement before initializing examples section)
    await Promise.allSettled(componentFiles.map(f => loadScript(f)));
    console.log('[x-tool] [async-demo] All example component scripts settled. Initializing examples section.');
    // Re-run initialization for the examples section only, so newly registered components mount.
    try {
      XTool.init({ container: "[data-section='examples']" });
    } catch (e){
      // Some implementations might disallow re-init; fallback: manually trigger mutation observer by toggling a tiny DOM change
      console.warn('[x-tool] [async-demo] Secondary init failed, attempting fallback', e);
      const target = document.querySelector("[data-section='examples']");
      if (target){
        const marker = document.createComment('x-tool examples re-scan');
        target.appendChild(marker);
        requestAnimationFrame(() => marker.remove());
      }
    }
    // If user landed directly on #examples ensure we scroll after mounting components
    if (location.hash === '#examples') {
      const el = document.querySelector("[data-section='examples']");
      if (el) {
        requestAnimationFrame(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      }
    }
  }

  function immediateInit(){
    // Perform the core page init ASAP (without waiting for example components)
    if (!window.__XTOOL_INITIALIZED__){
      window.__XTOOL_INITIALIZED__ = true;
      try {
        XTool.init({ container: 'body' });
        console.log('[x-tool] Core page initialized (examples will load asynchronously).');
      } catch (e){
        console.error('[x-tool] Failed initial init', e);
      }
    }
  }

  function scheduleAsyncLoad(){
    // Use requestIdleCallback when available to avoid competing with critical rendering; fallback to setTimeout
    const start = () => loadAllAsync();
    if ('requestIdleCallback' in window){
      requestIdleCallback(start, { timeout: 3000 });
    } else {
      setTimeout(start, 0);
    }
  }

  function onReady(){
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
