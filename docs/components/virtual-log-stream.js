// Virtual Log Stream (high-frequency append + windowed rendering)
XTool.registerComponent({
  name: 'virtual-log-stream',
  template: html`
  <div class="bg-white rounded-lg shadow-lg p-4 md:p-6 max-w-5xl mx-auto flex flex-col h-[70vh] md:h-[520px]">
  <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 class="text-lg font-semibold text-gray-800">Virtual Log Stream</h3>
        <div class="flex gap-2 text-xs">
          <button x-on:click="toggle" class="px-2 py-1 rounded border" x:class="{ 'bg-green-500 text-white border-green-500': running, 'bg-gray-200': !running }" x-text="running ? 'Pause' : 'Resume'"></button>
          <button x-on:click="clear" class="px-2 py-1 rounded border bg-gray-100 hover:bg-gray-200">Clear</button>
          <button x-on:click="jumpBottom" class="px-2 py-1 rounded border bg-gray-100 hover:bg-gray-200">Bottom</button>
        </div>
      </div>
  <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center mb-3">
        <div class="bg-blue-50 p-2 rounded"><div class="text-sm font-mono" x-text="totalLines.toLocaleString()"></div><div class="text-[10px] text-blue-600">Total</div></div>
        <div class="bg-green-50 p-2 rounded"><div class="text-sm font-mono" x-text="visible.length"></div><div class="text-[10px] text-green-600">Visible</div></div>
        <div class="bg-purple-50 p-2 rounded"><div class="text-sm font-mono" x-text="linesPerSec"></div><div class="text-[10px] text-purple-600">Lines/s</div></div>
        <div class="bg-orange-50 p-2 rounded"><div class="text-sm font-mono" x-text="filter || '—'"></div><div class="text-[10px] text-orange-600">Filter</div></div>
      </div>
      <div class="flex gap-2 mb-2 text-xs">
        <input x-model="filter" placeholder="Regex filter (e.g. ERROR|WARN)" class="flex-1 border rounded px-2 py-1"/>
        <select x-model="level" class="border rounded px-2 py-1">
          <option value="">Any Level</option>
          <option value="INFO">INFO</option>
          <option value="WARN">WARN</option>
          <option value="ERROR">ERROR</option>
        </select>
      </div>
      <div class="relative flex-1 border rounded overflow-auto font-mono text-[11px] bg-gray-900 text-gray-100 scroller" x-ref="scroller" x-on:scroll="onScroll">
        <div style="height: 4px;"></div>
        <div x-for="row in visible" class="px-2 py-[2px] whitespace-nowrap" x:class="{ 'text-red-400': row.level==='ERROR', 'text-yellow-300': row.level==='WARN', 'text-gray-400': row.level==='INFO' }">
          <span class="text-gray-500" x-text="row.index"></span>
          <span class="ml-2" x-text="row.time"></span>
          <span class="ml-2 font-bold" x-text="row.level"></span>
          <span class="ml-2" x-html="row.msg"></span>
        </div>
        <div style="height: 4px;"></div>
      </div>
      <div class="mt-2 text-[10px] text-gray-500 font-mono">Window: <span x-text="start"></span>-<span x-text="end"></span> / <span x-text="totalLines"></span></div>
    </div>
  `,
  makeData: () => ({
    buffer: [],
    totalLines: 0,
    running: true,
    filter: '',
    level: '',
    start: 0,
    end: 0,
    rowHeight: 18,
    windowSize: 400,
    anchorBottom: true,
    lastAppend: performance.now(),
    recentCounts: [],
    linesPerSec: 0,
    tickHandle: null,
    genHandle: null,
    severity: ['INFO','WARN','ERROR']
  }),
  computed: {
    filtered() {
      let arr = this.buffer;
      if (this.level) arr = arr.filter(r => r.level === this.level);
      if (this.filter) {
        try { const re = new RegExp(this.filter); arr = arr.filter(r => re.test(r.msgPlain)); } catch { /* invalid regex ignored */ }
      }
      return arr;
    },
    visible() { return this.filtered.slice(this.start, this.end); }
  },
  methods: {
    genBatch(size){
      const batch = [];
      for(let i=0;i<size;i++){
        const lvl = this.severity[Math.random()*this.severity.length|0];
        const idx = this.totalLines + i + 1;
        const now = new Date();
        const msgPlain = `Sample log message number ${idx} with random = ${Math.random().toString(36).slice(2,7)}`;
        const highlighted = this.filter ? msgPlain.replace(/(&|<|>)/g, s=>({ '&':'&amp;','<':'&lt;','>':'&gt;' }[s])).replace(new RegExp(this.filter,'gi'), m=>`<mark>${m}</mark>`) : msgPlain;
        batch.push({ index: idx, level: lvl, time: now.toLocaleTimeString(), msg: highlighted, msgPlain });
      }
      this.totalLines += size;
      this.buffer.push(...batch);
      // Cap to avoid unbounded memory (keep last 100k)
      if (this.buffer.length > 100000) this.buffer.splice(0, this.buffer.length - 100000);
    },
    scheduleGeneration(){
      return
      const loop = () => {
        if (this.running) {
          const burst = 200 + (Math.random()*100|0); // variable throughput
          this.genBatch(burst);
          this.updateWindow();
          const now = performance.now();
            const dt = now - this.lastAppend;
            if(dt>0){ this.recentCounts.push(burst*1000/dt); if(this.recentCounts.length>20) this.recentCounts.shift(); this.linesPerSec = Math.round(this.recentCounts.reduce((a,b)=>a+b,0)/this.recentCounts.length); }
            this.lastAppend = now;
        }
        this.genHandle = requestAnimationFrame(loop);
      };
      this.genHandle = requestAnimationFrame(loop);
    },
    updateWindow(){
      const sc = this.$el.querySelector('[x-ref="scroller"]');
      if(!sc) return;
      if (this.anchorBottom) {
        this.end = this.filtered.length;
        this.start = Math.max(0, this.end - this.windowSize);
        sc.scrollTop = sc.scrollHeight;
        this.$nextTick(() => { sc.scrollTop = sc.scrollHeight; });
      } else {
        // derive based on scroll position
        const firstVisible = Math.floor(sc.scrollTop / this.rowHeight);
        this.start = Math.max(0, firstVisible - 5);
        this.end = Math.min(this.filtered.length, this.start + this.windowSize);
      }
    },
    onScroll(e){
      const sc = e.target;
      const atBottom = sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 2;
      this.anchorBottom = atBottom;
      if(!atBottom) this.updateWindow();
    },
    toggle(){ this.running = !this.running; if(this.running) this.lastAppend=performance.now(); },
    clear(){ this.buffer = []; this.totalLines=0; this.start=0; this.end=0; },
    jumpBottom(){ this.anchorBottom = true; this.updateWindow(); }
  },
  mounted(){
    this.scheduleGeneration();
    // initial fill
    this.genBatch(1000);
    this.updateWindow();
    const sc = this.$el.querySelector('[x-ref="scroller"]');
    if(sc) sc.addEventListener('resize', ()=> this.updateWindow());
  }
});
