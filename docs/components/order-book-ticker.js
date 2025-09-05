// Order Book & Trades Ticker (simulated market depth)
XTool.registerComponent({
  name: 'order-book-ticker',
  template: `
    <div class="bg-white rounded-lg shadow-lg p-6 max-w-5xl mx-auto space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-800">Order Book & Trades</h3>
        <div class="flex gap-2 text-xs">
          <button x-on:click="toggle" class="px-2 py-1 rounded border" x:class="{ 'bg-green-500 text-white border-green-500': running, 'bg-gray-200': !running }" x-text="running? 'Pause':'Resume'"></button>
          <button x-on:click="reset" class="px-2 py-1 rounded border bg-gray-100 hover:bg-gray-200">Reset</button>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="md:col-span-2 grid grid-cols-2 gap-4">
          <div>
            <h4 class="text-xs uppercase tracking-wide text-gray-500 mb-1">Bids</h4>
            <div class="border rounded overflow-hidden divide-y text-xs font-mono">
              <div x-for="row in bids" class="relative flex justify-between px-2 py-1">
                <div class="absolute inset-0 bg-green-200 opacity-30" x:style="{ width: (row.size / maxBidSize * 100) + '%' }"></div>
                <span class="relative z-10 text-green-700" x-text="row.price.toFixed(2)"></span>
                <span class="relative z-10" x-text="row.size"></span>
              </div>
            </div>
          </div>
          <div>
            <h4 class="text-xs uppercase tracking-wide text-gray-500 mb-1">Asks</h4>
            <div class="border rounded overflow-hidden divide-y text-xs font-mono">
              <div x-for="row in asks" class="relative flex justify-between px-2 py-1">
                <div class="absolute inset-0 bg-red-200 opacity-30" x:style="{ width: (row.size / maxAskSize * 100) + '%' }"></div>
                <span class="relative z-10 text-red-700" x-text="row.price.toFixed(2)"></span>
                <span class="relative z-10" x-text="row.size"></span>
              </div>
            </div>
          </div>
        </div>
        <div class="flex flex-col gap-2">
          <div class="p-3 border rounded bg-gray-50 space-y-1">
            <div class="flex justify-between text-xs"><span>Mid</span><span class="font-mono" x-text="mid.toFixed(2)"></span></div>
            <div class="flex justify-between text-xs"><span>Spread</span><span class="font-mono" x-text="spread.toFixed(2)"></span></div>
            <div class="flex justify-between text-xs"><span>Last Trade</span><span class="font-mono" x-text="lastTrade.price ? lastTrade.price.toFixed(2) : '—'"></span></div>
          </div>
          <div class="border rounded overflow-auto text-xs font-mono bg-gray-900 text-gray-100 max-h-64">
            <div class="sticky top-0 bg-gray-800 text-gray-300 px-2 py-1">Trades</div>
            <div x-for="t in trades" class="px-2 py-1 flex justify-between" x:class="{ 'text-green-300': t.side==='BUY', 'text-red-300': t.side==='SELL' }">
              <span x-text="t.time"></span>
              <span x-text="t.price.toFixed(2)"></span>
              <span x-text="t.size"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  makeData: () => ({
    levels: 40,
    bids: [],
    asks: [],
    trades: [],
    running: true,
    timer: null,
    basePrice: 1000,
    lastTrade: {},
    maxBidSize: 1,
    maxAskSize: 1
  }),
  computed: {
    bestBid(){ return this.bids.length ? this.bids[0].price : this.basePrice; },
    bestAsk(){ return this.asks.length ? this.asks[0].price : this.basePrice; },
    mid(){ return (this.bestBid + this.bestAsk)/2; },
    spread(){ return this.bestAsk - this.bestBid; }
  },
  methods: {
    initBook(){
      this.bids = []; this.asks = [];
      for(let i=0;i<this.levels;i++){
        const bp = this.basePrice - i*0.5;
        const ap = this.basePrice + i*0.5;
        this.bids.push({ price: bp, size: this.randSize() });
        this.asks.push({ price: ap, size: this.randSize() });
      }
      this.maxBidSize = Math.max(...this.bids.map(b=>b.size));
      this.maxAskSize = Math.max(...this.asks.map(a=>a.size));
    },
    randSize(){ return +(Math.random()*5 + 0.1).toFixed(2); },
    mutateLevels(){
      // Randomly pick a few levels to adjust sizes + slight price drift at top
      for(let k=0;k<8;k++){
        const side = Math.random()>0.5 ? 'bids':'asks';
        const arr = this[side];
        if(!arr.length) continue;
        const idx = Math.random()*arr.length|0;
        const level = arr[idx];
        // size mutation
        level.size = this.randSize();
        if(idx===0){ // small top-level price drift
          const drift = (Math.random()*0.4 - 0.2);
          level.price += side==='bids' ? drift : drift;
        }
      }
      // Resort top-of-book to keep descending/ascending order minimal work
      this.bids.sort((a,b)=> b.price - a.price);
      this.asks.sort((a,b)=> a.price - b.price);
      this.maxBidSize = Math.max(...this.bids.map(b=>b.size));
      this.maxAskSize = Math.max(...this.asks.map(a=>a.size));
    },
    genTrade(){
      const side = Math.random()>0.5 ? 'BUY':'SELL';
      const price = side==='BUY'? this.bestAsk : this.bestBid;
      const size = (Math.random()*2+0.1).toFixed(2);
      const t = { side, price, size, time: new Date().toLocaleTimeString() };
      this.lastTrade = t;
      this.trades.unshift(t);
      if(this.trades.length>200) this.trades.pop();
    },
    loop(){ if(!this.running) return; this.$mutate(()=>{ this.mutateLevels(); if(Math.random()>0.6) this.genTrade(); }); this.timer = setTimeout(()=>this.loop(), 150); },
    toggle(){ this.running = !this.running; if(this.running) this.loop(); },
    reset(){ this.initBook(); this.trades=[]; },
  },
  mounted(){ this.initBook(); this.loop(); }
});
