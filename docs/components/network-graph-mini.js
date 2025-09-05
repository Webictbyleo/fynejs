// Network Graph Mini (simulated positions streaming)
XTool.registerComponent({
  name: 'network-graph-mini',
  template: `
    <div class="bg-white rounded-lg shadow-lg p-6 max-w-5xl mx-auto">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-lg font-semibold text-gray-800">Network Graph Mini</h3>
        <div class="flex gap-2 text-xs">
          <label class="flex items-center gap-1">Nodes <input type="range" min="100" max="1200" step="100" x-model="nodeCount" class="w-32"/></label>
          <label class="flex items-center gap-1">Highlight Deg ≥ <input type="range" min="0" max="10" step="1" x-model="degreeThreshold" class="w-24"/></label>
          <button x-on:click="toggle" class="px-2 py-1 border rounded" x:class="{ 'bg-green-500 text-white': running, 'bg-gray-200': !running }" x-text="running? 'Pause':'Resume'"></button>
        </div>
      </div>
      <div class="relative border rounded bg-gray-50 overflow-hidden h-[400px]" x-ref="stage">
        <svg class="absolute inset-0 w-full h-full" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid meet">
          <g>
            <line x-for="e in visibleEdges" x:stroke="e.h? '#f59e0b' : '#94a3b8'" stroke-width="1" x:x1="e.x1" x:y1="e.y1" x:x2="e.x2" x:y2="e.y2" stroke-linecap="round" />
          </g>
          <g>
            <circle x-for="n in visibleNodes" r="3" x:fill="n.h? '#dc2626' : '#2563eb'" x:cx="n.x" x:cy="n.y" />
          </g>
        </svg>
      </div>
      <div class="mt-2 text-[10px] text-gray-500 font-mono flex gap-4">
        <span>Total Nodes: <span x-text="nodes.length"></span></span>
        <span>Edges: <span x-text="edges.length"></span></span>
        <span>Filtered: <span x-text="visibleNodes.length"></span></span>
      </div>
    </div>
  `,
  makeData: () => ({
    nodes: [],
    edges: [],
    degree: [],
    positions: [],
    nodeCount: 600,
    degreeThreshold: 0,
    running: true,
    timer: null
  }),
  computed: {
    visibleNodes(){ return this.nodes.filter(n => this.degree[n.id] >= this.degreeThreshold).map(n=>({ ...n, h: this.degree[n.id] >= this.degreeThreshold+4 })); },
    nodeSet(){ return new Set(this.visibleNodes.map(n=>n.id)); },
    visibleEdges(){
      const s = this.nodeSet; const out=[];
      for(let i=0;i<this.edges.length;i++){
        const e = this.edges[i];
        if(s.has(e.a) && s.has(e.b)) out.push({ x1:this.nodes[e.a].x, y1:this.nodes[e.a].y, x2:this.nodes[e.b].x, y2:this.nodes[e.b].y, h: (this.degree[e.a]+this.degree[e.b]) > (this.degreeThreshold*2+6) });
      }
      return out;
    }
  },
  methods: {
    initGraph(){
      // Initialize nodes with random positions
      this.nodes = []; this.edges = []; this.degree = [];
      for(let i=0;i<this.nodeCount;i++) this.nodes.push({ id:i, x:Math.random()*1000, y:Math.random()*1000, vx:0, vy:0 });
      // Sparse random edges ~ average degree ~ 8
      const targetEdges = this.nodeCount * 4;
      for(let e=0;e<targetEdges;e++){
        const a = Math.random()*this.nodeCount|0; let b = Math.random()*this.nodeCount|0; if(a===b) b=(b+1)%this.nodeCount;
        this.edges.push({ a, b });
      }
      this.computeDegrees();
      
    },
    computeDegrees(){ this.degree = Array(this.nodeCount).fill(0); this.edges.forEach(e=>{ this.degree[e.a]++; this.degree[e.b]++; }); },
    tick(){
      // Simple force-ish jitter to move nodes gradually
      for(let i=0;i<this.nodes.length;i++){
        const n = this.nodes[i];
        n.vx += (Math.random()-0.5)*0.5; n.vy += (Math.random()-0.5)*0.5;
        n.vx *= 0.9; n.vy *= 0.9;
        n.x += n.vx; n.y += n.vy;
        if(n.x<0) n.x=0; if(n.x>1000) n.x=1000; if(n.y<0) n.y=0; if(n.y>1000) n.y=1000;
      }
    },
    loop(){ if(!this.running) return; this.$mutate(()=> this.tick()); this.timer = setTimeout(()=>this.loop(), 120); },
    toggle(){ this.running = !this.running; if(this.running) this.loop(); },
  },
  mounted(){ this.initGraph(); this.loop(); }
});
