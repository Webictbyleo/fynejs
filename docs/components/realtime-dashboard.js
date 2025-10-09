// Realtime Dashboard with Simulated Metrics & Sparklines
XTool.registerComponent({
  name: 'realtime-dashboard',
  template: `
  <div class="bg-white rounded-lg shadow-lg p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-800">Realtime Dashboard</h3>
        <div class="flex gap-2">
          <button x-on:click="toggle" class="px-3 py-1 rounded text-sm" x:class="{ 'bg-green-500 text-white': running, 'bg-gray-300': !running }" x-text="running? 'Pause' : 'Resume'"></button>
          <button x-on:click="reset" class="px-3 py-1 rounded text-sm bg-gray-200 hover:bg-gray-300">Reset</button>
        </div>
      </div>
  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div x-for="metric in metrics" class="p-4 rounded border bg-gray-50 flex flex-col gap-2">
          <div class="flex justify-between items-center">
            <span class="text-xs uppercase tracking-wide text-gray-500" x-text="metric.label"></span>
            <span class="font-mono text-sm" x-text="format(metric.current, metric.format)"></span>
          </div>
          <div class="h-12"> 
            <svg viewBox="0 0 100 30" preserveAspectRatio="none" class="w-full h-full">
              <polyline x:points="metric.points.map((p,i)=> (i*(100/(maxPoints-1)))+','+(30 - (p/metric.max * 30))).join(' ')" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
            </svg>
          </div>
          <div class="flex justify-between text-[10px] text-gray-500 font-mono">
            <span x-text="format(Math.min(...metric.points), metric.format)"></span>
            <span x-text="format(Math.max(...metric.points), metric.format)"></span>
          </div>
        </div>
      </div>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="p-4 rounded border bg-gray-50 space-y-2">
          <h4 class="text-sm font-medium text-gray-700">System Load</h4>
          <div class="flex items-center gap-2">
            <div class="flex-1 h-3 bg-gray-200 rounded overflow-hidden">
              <div class="h-full bg-blue-500 transition-all" x:style="{ width: systemLoad + '%' }"></div>
            </div>
            <span class="text-xs font-mono" x-text="systemLoad + '%'" />
          </div>
          <div class="text-xs text-gray-500">Avg Load Last 60s: <span x-text="avgLoad"></span>%</div>
        </div>
        <div class="p-4 rounded border bg-gray-50 space-y-2">
          <h4 class="text-sm font-medium text-gray-700">Events / Sec</h4>
          <div class="text-2xl font-mono" x-text="eventsPerSecond"></div>
          <div class="text-xs text-gray-500">Total Events: <span x-text="totalEvents"></span></div>
        </div>
        <div class="p-4 rounded border bg-gray-50 space-y-2">
          <h4 class="text-sm font-medium text-gray-700">Uptime</h4>
          <div class="text-2xl font-mono" x-text="uptimeDisplay"></div>
          <div class="text-xs text-gray-500">Started: <span x-text="startTimeFormatted"></span></div>
        </div>
      </div>
    </div>
  `,
  makeData: () => ({
    running: true,
    maxPoints: 40,
    tickMs: 1000,
    systemLoad: 0,
    loadHistory: [],
    totalEvents: 0,
    startTime: Date.now(),
    metrics: [
      { key:'cpu', label:'CPU %', format:'percent', precision:1, max:100, current:0, points:[] },
      { key:'mem', label:'Memory MB', format:'number', precision:1, max:16000, current:0, points:[] },
      { key:'lat', label:'Latency ms', format:'number', precision:0, max:500, current:0, points:[] },
      { key:'req', label:'Req/s', format:'rate', precision:2, max:300, current:0, points:[] }
    ],
    loopHandle: null
  }),
  computed: {
    eventsPerSecond(){
      const r = this.metrics.find(m=>m.key==='req');
      return r.current.toFixed(r.precision || 2);
    },
    uptime(){ return Math.floor((Date.now()-this.startTime)/1000); },
    uptimeDisplay(){ const s=this.uptime; const h=Math.floor(s/3600), m=Math.floor((s%3600)/60), sec=s%60; return `${h}h ${m}m ${sec}s`; },
    avgLoad(){ if(!this.loadHistory.length) return 0; return Math.round(this.loadHistory.reduce((a,b)=>a+b,0)/this.loadHistory.length); },
    startTimeFormatted(){ return new Date(this.startTime).toLocaleTimeString(); }
  },
  methods: {
    randomWalk(value, max, step){ const delta = (Math.random()*step*2)-step; let v = value + delta; if(v<0) v=0; if(v>max) v=max; return v; },
    format(v, type){
      // Accept raw number, handle precision by metric type
      if (v == null || Number.isNaN(v)) return '0';
      switch(type){
        case 'percent': return v.toFixed(1)+'%';
        case 'rate': return v.toFixed(2);
        case 'number': return (Math.abs(v) >= 100 ? Math.round(v) : v.toFixed( (v < 10) ? 2 : 1 ));
        default: return v;
      }
    },
    tick(){
      // Update metrics with constrained randomness
      this.metrics.forEach(m=>{
        const step = m.max * 0.1; // 10% volatility
        m.current = this.randomWalk(m.current || (m.max/2), m.max, step);
        // Keep more precise internal values (no rounding) for metrics requiring decimals
        m.points.push(m.current);
        if(m.points.length>this.maxPoints) m.points.shift();
      });
      const cpu = this.metrics.find(m=>m.key==='cpu');
      this.systemLoad = Math.round(cpu.current);
      this.loadHistory.push(this.systemLoad); if(this.loadHistory.length>60) this.loadHistory.shift();
  const req = this.metrics.find(m=>m.key==='req');
  // Derive fractional events based on rate * tick duration (in seconds). Accumulate fractional remainder.
  if (!this._eventFraction) this._eventFraction = 0;
  const seconds = this.tickMs / 1000;
  const expected = req.current * seconds * (Math.random()*0.5 + 0.75); // variability factor
  const total = expected + this._eventFraction;
  const whole = Math.floor(total);
  this._eventFraction = total - whole; // carry remainder forward
  this.totalEvents += whole;
    },
    loop(){ if(!this.running) return; this.tick(); this.loopHandle = setTimeout(()=>this.loop(), this.tickMs); },
    toggle(){ this.running = !this.running; if(this.running) this.loop(); },
    reset(){ this.metrics.forEach(m=>{ m.current=0; m.points.length=0; }); this.loadHistory=[]; this.totalEvents=0; this.startTime=Date.now(); },
  },
  mounted(){ this.loop(); }
});
