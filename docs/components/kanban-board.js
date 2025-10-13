// Kanban Board with Drag-and-Drop and Persistence
XTool.registerComponent({
  name: 'kanban-board',
  template: html`
  <div class="bg-white rounded-lg shadow-lg p-4 md:p-6 max-w-5xl mx-auto">
      <div class="flex items-start justify-between mb-4 flex-wrap gap-4">
        <h3 class="text-lg font-semibold text-gray-800">Kanban Board</h3>
        <form x-on:submit.prevent="addCard" class="flex gap-2 items-center flex-wrap">
          <input x-model="newTitle" type="text" placeholder="New task title" class="px-3 py-2 border rounded text-sm w-full sm:w-48" />
          <select x-model="newColumn" class="px-2 py-2 border rounded text-sm">
            <option x-for="col in columns" x-bind:value="col.key" x-text="col.label"></option>
          </select>
          <button class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm" x:disabled="!newTitle.trim()">Add</button>
        </form>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div x-for="col in columns" class="flex flex-col bg-gray-50 rounded-lg border border-gray-200 min-h-[300px]" x-bind:data-col="col.key">
          <div class="px-4 py-3 flex items-center justify-between border-b">
            <div class="font-medium text-gray-700" x-text="col.label"></div>
            <span class="text-xs text-gray-500" x-text="cardsIn(col.key).length + ' cards'"></span>
          </div>
          <div class="flex-1 p-3 space-y-2" 
               x-on:dragover.prevent 
               x-on:drop="handleDrop(col.key, $event)"
               x:class="{ 'bg-blue-50': dragOver === col.key }"
               x-on:dragenter.prevent="dragOver = col.key" 
               x-on:dragleave="dragOver = null">
            <template x-for="card in cardsIn(col.key)">
              <div 
                class="p-3 bg-white rounded shadow-sm border flex flex-col gap-2 cursor-move" 
                draggable="true"
                x-on:dragstart="dragStart(card)"
                x-on:dragend="dragOver=null"
                x:class="{ 'opacity-50': dragging && dragging.id === card.id }">
                <div class="flex justify-between items-start gap-2">
                  <div class="font-medium text-sm" x-text="card.title"></div>
                  <button x-on:click="removeCard(card.id)" class="text-red-500 hover:text-red-700 text-xs">×</button>
                </div>
                <textarea x-model="card.notes" placeholder="Notes..." class="w-full text-xs border rounded p-2 focus:outline-none focus:ring-1 focus:ring-blue-400"></textarea>
                <div class="flex justify-between text-[10px] text-gray-500 uppercase tracking-wide">
                  <span x-text="card.priority"></span>
                  <span x-text="formatDate(card.created)"></span>
                </div>
                <div class="flex gap-1">
                  <button x-on:click="cyclePriority(card)" class="flex-1 bg-gray-200 hover:bg-gray-300 rounded px-2 py-1 text-[10px]">Priority</button>
                  <button x-on:click="moveCard(card, 'prev')" class="flex-1 bg-gray-200 hover:bg-gray-300 rounded px-2 py-1 text-[10px]">◀</button>
                  <button x-on:click="moveCard(card, 'next')" class="flex-1 bg-gray-200 hover:bg-gray-300 rounded px-2 py-1 text-[10px]">▶</button>
                </div>
              </div>
            </template>
            <div x-if="cardsIn(col.key).length===0" class="text-xs text-gray-400 italic">Empty</div>
          </div>
        </div>
      </div>
    </div>
  `,
  makeData: () => ({
    newTitle: '',
    newColumn: 'todo',
    dragOver: null,
    dragging: null,
    priorityOrder: ['Low','Med','High','Urgent'],
    columns: [
      { key: 'todo', label: 'To Do' },
      { key: 'progress', label: 'In Progress' },
      { key: 'done', label: 'Done' }
    ],
    cards: JSON.parse(localStorage.getItem('xtool-kanban') || '[]')
  }),
  computed: {
    serialized() { return JSON.stringify(this.cards); }
  },
  methods: {
    persist(){ localStorage.setItem('xtool-kanban', JSON.stringify(this.cards)); },
    cardsIn(col){ return this.cards.filter(c=>c.column===col); },
    addCard(){
      if(!this.newTitle.trim()) return;
      this.cards.push({ id: Date.now(), title: this.newTitle.trim(), column: this.newColumn, created: Date.now(), priority: 'Low', notes: '' });
      this.newTitle=''; this.persist();
    },
    removeCard(id){ this.cards = this.cards.filter(c=>c.id!==id); this.persist(); },
    dragStart(card){ this.dragging = card; },
    handleDrop(col, evt){ if(!this.dragging) return; this.dragging.column = col; this.dragging=null; this.dragOver=null; this.persist(); },
    moveCard(card, dir){
      const order = this.columns.map(c=>c.key);
      const idx = order.indexOf(card.column);
      const next = dir==='next'? idx+1: idx-1;
      if(next<0|| next>=order.length) return;
      card.column = order[next];
      this.persist();
    },
    cyclePriority(card){
      const idx = this.priorityOrder.indexOf(card.priority);
      card.priority = this.priorityOrder[(idx+1)%this.priorityOrder.length];
      this.persist();
    },
    formatDate(ts){ const d=new Date(ts); return d.toLocaleDateString(undefined,{month:'short',day:'numeric'}); }
  }
});
