// Interactive Showcase component for homepage demo
// Highlights: Mustache interpolation, dynamic component switching, readonly freeze
(function(){
  // Mini: Counter
  XTool.registerComponent({
    name: 'mini-counter',
    template: html`
      <div class="p-5 bg-white border-2 border-gray-200 rounded-xl shadow-sm">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{{ count }}</span>
        </div>
        <p class="text-gray-600 mb-4">Count is <span class="font-semibold text-gray-900">{{ count }}</span></p>
        <div class="flex gap-2">
          <button x-on:click="decrement" class="px-3 py-2 rounded-lg border-2 border-gray-300 hover:border-black transition">−</button>
          <button x-on:click="increment" class="px-3 py-2 rounded-lg bg-black text-white hover:bg-gray-800 transition">+1</button>
          <button x-on:click="reset" class="px-3 py-2 rounded-lg border-2 border-gray-300 hover:border-black transition">Reset</button>
        </div>
      </div>
    `,
    makeData: () => ({ count: 0 }),
    methods: {
      increment(){ this.count++; },
      decrement(){ this.count--; },
      reset(){ this.count = 0; }
    }
  });

  // Mini: Quote
  XTool.registerComponent({
    name: 'mini-quote',
    template: html`
      <div class="p-5 bg-white border-2 border-gray-200 rounded-xl shadow-sm">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">#{{ index + 1 }}</span>
        </div>
        <blockquote class="text-gray-800 italic leading-relaxed">“{{ current.text }}”</blockquote>
        <div class="mt-2 text-sm text-gray-500">— {{ current.author }}</div>
        <div class="mt-4 flex gap-2">
          <button x-on:click="next" class="px-3 py-2 rounded-lg bg-black text-white hover:bg-gray-800 transition">New Quote</button>
          <button x-on:click="shuffle" class="px-3 py-2 rounded-lg border-2 border-gray-300 hover:border-black transition">Shuffle</button>
        </div>
      </div>
    `,
    makeData: () => ({
      index: 0,
      quotes: [
        { text: 'Simplicity is the soul of efficiency.', author: 'Austin Freeman' },
        { text: 'Make it work, make it right, make it fast.', author: 'Kent Beck' },
        { text: 'Programs must be written for people to read.', author: 'Harold Abelson' },
        { text: 'Small is beautiful.', author: 'E. F. Schumacher' }
      ],
      get current(){ return this.quotes[this.index % this.quotes.length]; }
    }),
    methods: {
      next(){ this.index = (this.index + 1) % this.quotes.length; },
      shuffle(){ this.index = Math.floor(Math.random() * this.quotes.length); }
    }
  });

  // Parent: Interactive Showcase
  XTool.registerComponent({
    name: 'interactive-showcase',
    template: html`
      <div class="w-full max-w-xl">
        <div class="relative p-1 rounded-2xl bg-gradient-to-r from-black to-gray-800 shadow-2xl">
          <div class="rounded-xl bg-white">
            <div class="p-5 border-b border-gray-200 flex items-center justify-between gap-3">
              <div>
                <div class="text-xs uppercase tracking-wider text-gray-500">Live Showcase</div>
                <div class="text-base font-bold text-gray-900">{{ labelMap[selected] }}</div>
              </div>
              <div class="flex items-center gap-2">
                <label class="flex items-center gap-1 text-xs text-gray-700 select-none cursor-pointer">
                  <input type="checkbox" x-model="isFrozen" class="rounded border-gray-300">
                  <span class="inline-flex items-center gap-1">
                    <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M5 8a5 5 0 1110 0v2h1a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6a1 1 0 011-1h1V8zm2 0v2h6V8a3 3 0 10-6 0z"/></svg>
                    Readonly
                  </span>
                </label>
                <select x-model="selected" class="text-xs px-2 py-1 border-2 border-gray-300 rounded-lg hover:border-black transition bg-white">
                  <option value="mini-counter">Counter</option>
                  <option value="mini-quote">Quote</option>
                </select>
              </div>
            </div>

            <div class="p-5">
              <component x:source="selected" x-bind:readonly="isFrozen"></component>
            </div>

            <div class="px-5 pb-5 text-xs text-gray-500 border-t border-gray-100 pt-3 flex items-center justify-between">
              <span>Frozen: <strong class="text-gray-800">{{ isFrozen ? 'Yes' : 'No' }}</strong></span>
              <span class="hidden sm:block">Mustache Interpolation & Dynamic Switching</span>
            </div>
          </div>
        </div>
      </div>
    `,
    makeData: () => ({
      selected: 'mini-counter',
      isFrozen: false,
      labelMap: { 'mini-counter': 'Mini Counter', 'mini-quote': 'Inspirational Quote' }
    })
  });
})();
