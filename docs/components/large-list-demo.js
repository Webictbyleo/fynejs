// Large List Performance Demo (extracted)
XTool.registerComponent({
  name: 'large-list-demo',
  template: html`
    <style>
      [x-ref=listContainer] > div{
        content-visibility: auto;
        contain-intrinsic-size: 24rem;
      }
    </style>
  <div class="bg-white rounded-lg shadow-lg p-4 md:p-6 max-w-4xl mx-auto">
      <h3 class="text-lg font-semibold text-gray-800 mb-4">Large List Performance Demo</h3>
      <!-- Controls -->
      <div class="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Search Items</label>
          <input x-model="searchQuery" 
                 x-on:input="debounceSearch"
                 type="text" 
                 placeholder="Search by name or category..."
                 class="w-full border rounded px-3 py-2">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Filter by Category</label>
          <select x-model="selectedCategory" class="w-full border rounded px-3 py-2">
            <option value="">All Categories</option>
            <option x-for="category in categories" x-bind:value="category" x-text="category"></option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Sort by</label>
          <select x-model="sortBy" class="w-full border rounded px-3 py-2">
            <option value="name">Name</option>
            <option value="category">Category</option>
            <option value="score">Score</option>
            <option value="id">ID</option>
          </select>
        </div>
      </div>
      <!-- Stats -->
      <div class="mb-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div class="bg-blue-50 p-3 rounded">
          <div class="text-2xl font-bold text-blue-600" x-text="items.length"></div>
          <div class="text-sm text-blue-500">Total Items</div>
        </div>
        <div class="bg-green-50 p-3 rounded">
          <div class="text-2xl font-bold text-green-600" x-text="filteredItems.length"></div>
          <div class="text-sm text-green-500">Filtered</div>
        </div>
        <div class="bg-purple-50 p-3 rounded">
          <div class="text-2xl font-bold text-purple-600" x-text="selectedItems.length"></div>
          <div class="text-sm text-purple-500">Selected</div>
        </div>
        <div class="bg-orange-50 p-3 rounded">
          <div class="text-2xl font-bold text-orange-600" x-text="visibleItems.length"></div>
          <div class="text-sm text-orange-500">Visible</div>
        </div>
      </div>
      <!-- Bulk Actions -->
  <div class="mb-4 flex flex-wrap gap-2">
        <button x-on:click="generateItems" 
                class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
          Add 1000 Items
        </button>
        <button x-on:click="toggleSelectAll" 
                class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
          <span x-text="selectedItems.length === filteredItems.length ? 'Deselect All' : 'Select All'"></span>
        </button>
        <button x-on:click="removeSelected" 
                x:disabled="selectedItems.length === 0"
                class="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-4 py-2 rounded">
          Remove Selected (<span x-text="selectedItems.length"></span>)
        </button>
        <button x-on:click="clearAll" 
                class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">
          Clear All
        </button>
      </div>
      <!-- Virtual List Container -->
      <div class="border rounded-lg">
        <div class="max-h-96 overflow-y-auto" x-ref="listContainer">
          <div class="divide-y">
            <div x-for="item in visibleItems" 
                 x-bind:key="item.id"
                 class="flex items-center p-3 hover:bg-gray-50"
                 style="content-visibility: auto; contain-intrinsic-size: 3rem;">
                 
              <input type="checkbox" 
                     x-bind:checked="selectedItems.includes(item.id)"
                     x-on:change="toggleSelection(item.id)"
                     class="mr-3">
              <div class="flex-1 min-w-0">
                <div class="flex items-center space-x-3">
                  <span x-text="item.icon" class="text-xl"></span>
                  <div>
                    <div class="font-medium truncate" x-text="item.name"></div>
                    <div class="text-sm text-gray-500">
                      <span x-text="item.category"></span> • 
                      <span x-text="'Score: ' + item.score"></span> • 
                      <span x-text="item.status"></span>
                      <span class="ml-2 text-xs text-gray-400" x-text="Date.now()"></span>
                    </div>
                  </div>
                </div>
              </div>
              <button x-on:click="removeItem(item.id)"
                      class="text-red-500 hover:text-red-700 px-2 py-1">
                ×
              </button>
            </div>
          </div>
        </div>
      </div>
      <div x-if="items.length > 1000" class="mt-4 text-sm text-gray-600">
        <div>📊 Performance: Showing first 100 items for optimal rendering</div>
        <div>🔍 Use search/filter to narrow down results</div>
      </div>
    </div>
  `,
  data: { items: [], searchQuery: '', selectedCategory: '', sortBy: 'name', selectedItems: [], searchTimeout: null, batchSize: 1000, maxVisible: 100, categories: ['Electronics', 'Books', 'Clothing', 'Home', 'Sports', 'Toys'], statuses: ['Active', 'Inactive', 'Pending', 'Archived'], icons: ['📱', '💻', '📚', '👕', '🏠', '⚽', '🧸', '🎮', '🎧', '📷'] },
  computed: {
    filteredItems() {
      let filtered = this.items;
      if (this.searchQuery.trim()) {
        const query = this.searchQuery.toLowerCase();
        filtered = filtered.filter(item => item.name.toLowerCase().includes(query) || item.category.toLowerCase().includes(query));
      }
      if (this.selectedCategory) { filtered = filtered.filter(item => item.category === this.selectedCategory); }
      filtered.sort((a, b) => { 
        if (this.sortBy === 'score') return b.score - a.score; 
        if (this.sortBy === 'id') return a.id - b.id; 
        return a[this.sortBy].localeCompare(b[this.sortBy]); 
      });
      return filtered;
    },
    visibleItems() { 
      return this.filteredItems.slice(0, this.maxVisible); 
    }
  },
  methods: {
    generateItems() {
      const newItems = this.items.slice();
      const startId = this.items.length;
      for (let i = 0; i < this.batchSize; i++) {
        const id = startId + i + 1;
        newItems.push({ id, name: `Item ${id.toLocaleString()}`, category: this.categories[Math.floor(Math.random() * this.categories.length)], status: this.statuses[Math.floor(Math.random() * this.statuses.length)], score: Math.floor(Math.random() * 1000), icon: this.icons[Math.floor(Math.random() * this.icons.length)], createdAt: new Date().toISOString() });
      }
      this.items = newItems

    },
    debounceSearch() { 
      clearTimeout(this.searchTimeout); this.searchTimeout = setTimeout(() => { /* computed handles filtering */ }, 300); 
    },
    toggleSelection(itemId) {
      const index = this.selectedItems.indexOf(itemId);
      const selected = this.selectedItems.slice();
      if (index > -1) selected.splice(index, 1); else selected.push(itemId);
      this.selectedItems = selected;
    },
    toggleSelectAll() { 
      if (this.selectedItems.length === this.filteredItems.length) { this.selectedItems = []; } else { this.selectAll(); } 
    },
    selectAll() { 
      this.selectedItems = this.filteredItems.map(item => item.id); },
    removeSelected() { 
      
      this.items = this.items.filter(item => !this.selectedItems.includes(item.id)); this.selectedItems = []; 
    },
    removeItem(itemId) { 
      //const selectedIndex = this.selectedItems.indexOf(itemId); this.items = this.items.filter(item => item.id !== itemId); 
      for(let i=0; this.items.length > i;i++){
        if(itemId===this.items[i].id){
          this.items.splice(i,1)
          break;
        }
      }
     // if (selectedIndex > -1)this.selectedItems.splice(selectedIndex, 1); 
    },
    clearAll() { this.items = []; this.selectedItems = []; this.searchQuery = ''; this.selectedCategory = ''; }
  },
  mounted() { this.generateItems(); }
});
