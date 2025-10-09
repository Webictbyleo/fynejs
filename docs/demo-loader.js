// Dynamic Demo Component Loader (refactored to use XTool.loadComponents)
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
    'order-book-ticker.js',
    'network-graph-mini.js',
    'timeseries-resampler.js'
  ];
  const basePath = 'components/';

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
