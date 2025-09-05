// JSON Tree Explorer (lazy expansion, large nested structure)
XTool.registerComponent({
  name: 'json-tree-explorer',
  template: `
    <div class="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-800">JSON Tree Explorer</h3>
        <input x-model="query" placeholder="Search key or value..." class="border rounded px-2 py-1 text-sm"/>
      </div>
      <div class="text-xs text-gray-500 mb-2">Visible Nodes: <span x-text="visibleNodes.length"></span> / <span x-text="flat.length"></span></div>
      <div class="font-mono text-[11px] leading-snug max-h-96 overflow-auto border rounded bg-gray-50 p-2">
        <div x-for="node in visibleNodes" class="pl-[[node.depth*12]] flex items-start gap-1">
          <button x-if="node.childrenCount>0" x-on:click="toggle(node.id)" class="w-4 text-[9px] rounded border bg-white" x-text="expanded.has(node.id)?'-':'+'"></button>
          <span x-if="node.childrenCount===0" class="w-4"></span>
          <span class="text-blue-600" x-text="node.key"></span>
          <span>:</span>
          <span x-html="formatValue(node)"></span>
        </div>
      </div>
    </div>
  `,
  makeData: () => ({
    flat: [], // { id, parent, depth, key, type, value, childrenCount }
    childrenMap: {},
    rootId: null,
    expanded: new Set(),
    query: ''
  }),
  computed: {
    visibleNodes(){
      const out = [];
      const q = this.query.trim().toLowerCase();
      const match = (n)=> !q || (n.key && n.key.toLowerCase().includes(q)) || (n.type==='value' && String(n.value).toLowerCase().includes(q));
      const walk = (id)=>{
        const node = this.flat[id]; if(!node) return;
        if(match(node)) out.push(node);
        if(node.childrenCount && this.expanded.has(node.id)){
          const kids = this.childrenMap[node.id]||[];
          for(let k=0;k<kids.length;k++) walk(kids[k]);
        }
      };
      // Root nodes are those with parent null
      for(let i=0;i<this.flat.length;i++) if(this.flat[i] && this.flat[i].parent===null) walk(i);
      return out;
    }
  },
  methods: {
    buildRandom(depth=0, breadth=4){
      if(depth>5) return Math.random().toString(36).slice(2,8);
      const obj = {};
      const entries = (Math.random()*breadth+2)|0;
      for(let i=0;i<entries;i++){
        const key = 'k'+depth+'_'+i;
        obj[key] = Math.random()>0.5 ? this.buildRandom(depth+1, breadth) : (Math.random()*1000|0);
      }
      return obj;
    },
    flatten(obj, parent=null, depth=0){
      const id = this.flat.length;
      const keys = Object.keys(obj);
      const node = { id, parent, depth, key: parent===null? 'root' : (depth===0? 'root': ''), type:'object', value:null, childrenCount: keys.length };
      this.flat.push(node);
      const children = [];
      for(const k of keys){
        const v = obj[k];
        if(v && typeof v === 'object'){
          const childId = this.flat.length;
          const childNode = { id: childId, parent: id, depth: depth+1, key: k, type: 'object', value: null, childrenCount: Object.keys(v).length };
          this.flat.push(childNode);
          children.push(childId);
          this.flatten(v, childId, depth+1);
        } else {
          const childId = this.flat.length;
            const childNode = { id: childId, parent: id, depth: depth+1, key: k, type: 'value', value: v, childrenCount: 0 };
            this.flat.push(childNode); children.push(childId);
        }
      }
      this.childrenMap[id] = children;
    },
    toggle(id){ if(this.expanded.has(id)) this.expanded.delete(id); else this.expanded.add(id); },
    formatValue(node){
      if(node.type==='object') return `<span class='text-gray-400'>{ ${node.childrenCount} }</span>`;
      const v = node.value;
      const cls = typeof v === 'number'? 'text-purple-600':'text-green-600';
      return `<span class='${cls}'>${String(v)}</span>`;
    }
  },
  mounted(){
    const root = this.buildRandom();
    this.flatten(root, null, 0);
    // auto expand first two levels
    for(let i=0;i<this.flat.length;i++) if(this.flat[i].depth<2) this.expanded.add(this.flat[i].id);
  }
});
