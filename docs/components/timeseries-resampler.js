// Time Series Resampler (multi-resolution aggregation)
XTool.registerComponent({
  name: 'timeseries-resampler',
  template: `
    <div class="bg-white rounded-lg shadow-lg p-6 max-w-5xl mx-auto space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-800">Time Series Resampler</h3>
        <div class="flex gap-2 text-xs items-center">
          <label>Resolution
            <select x-model="resolution" class="border rounded px-1 py-0.5 ml-1">
              <option value="raw">Raw</option>
              <option value="1s">1s</option>
              <option value="5s">5s</option>
              <option value="60s">60s</option>
            </select>
          </label>
          <label>Window (pts)
            <input type="number" min="100" max="50000" step="100" x-model="window" class="border rounded w-20 px-1 py-0.5 ml-1"/>
          </label>
          <button x-on:click="randomize" class="px-2 py-1 bg-gray-100 border rounded hover:bg-gray-200">Randomize</button>
        </div>
      </div>
      <div class="grid grid-cols-4 gap-3 text-center text-xs">
        <div class="bg-blue-50 p-2 rounded"><div class="font-mono" x-text="rawLength"></div><div class="text-[10px] text-blue-600">Raw Points</div></div>
        <div class="bg-green-50 p-2 rounded"><div class="font-mono" x-text="series.length"></div><div class="text-[10px] text-green-600">Displayed</div></div>
        <div class="bg-purple-50 p-2 rounded"><div class="font-mono" x-text="stats.avg.toFixed(2)"></div><div class="text-[10px] text-purple-600">Avg</div></div>
        <div class="bg-orange-50 p-2 rounded"><div class="font-mono" x-text="stats.max.toFixed(1)"></div><div class="text-[10px] text-orange-600">Max</div></div>
      </div>
      <div class="h-48 relative border rounded bg-gray-900">
        <svg viewBox="0 0 1000 200" preserveAspectRatio="none" class="absolute inset-0 w-full h-full">
          <polyline x:points="series.map((p,i)=> (i*(1000/(series.length-1)))+','+(200 - (p.v / stats.max * 200))).join(' ')" fill="none" stroke="#10b981" stroke-width="1" stroke-linejoin="round" stroke-linecap="round" />
        </svg>
      </div>
      <div class="text-[10px] text-gray-500 font-mono">Resolution: <span x-text="resolution"></span> | Window: <span x-text="window"></span></div>
    </div>
  `,
  makeData: () => ({
    raw: [],
    aggregates: { '1s':[], '5s':[], '60s':[] },
    resolution: 'raw',
    window: 5000,
    timer: null
  }),
  computed: {
    rawLength(){ return this.raw.length; },
    series(){
      if(this.resolution==='raw') return this.raw.slice(-this.window);
      const arr = this.aggregates[this.resolution];
      return arr.slice(-Math.min(this.window, arr.length));
    },
    stats(){
      if(!this.series.length) return { avg:0,max:0 };
      let sum=0,max=0; for(let i=0;i<this.series.length;i++){ const v=this.series[i].v; sum+=v; if(v>max) max=v; }
      return { avg: sum/this.series.length, max };
    }
  },
  methods: {
    generateRaw(count=100000){
      this.raw = [];
      const raw = [];
      let base = 50;
      for(let i=0;i<count;i++){
        base += (Math.random()-0.5)*2; if(base<0) base=0; if(base>100) base=100;
        raw.push({ t:i, v: base });
      }
      this.raw = raw;
    },
    buildAggregates(){
      const build = (bucket)=>{
        const out = []; let acc=0,c=0,start=0;
        for(let i=0;i<this.raw.length;i++){
          const r = this.raw[i]; acc+=r.v; c++;
          if(i%bucket===bucket-1){ out.push({ t: start, v: acc/c }); acc=0; c=0; start=i+1; }
        }
        if(c) out.push({ t:start, v: acc/c });
        return out;
      };
      this.aggregates['1s'] = build(1);
      this.aggregates['5s'] = build(5);
      this.aggregates['60s'] = build(60);
    },
    randomize(){{ this.generateRaw(); this.buildAggregates(); }},
  },
  mounted(){ this.randomize(); }
});
