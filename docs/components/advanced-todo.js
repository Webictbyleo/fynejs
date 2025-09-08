// Advanced Todo App with filtering, persistence, and animations (extracted)
XTool.registerComponent({
  name: 'advanced-todo',
  template: `
  <div class="bg-white rounded-lg shadow-lg p-4 md:p-6 max-w-md mx-auto">
      <div class="flex items-center mb-6">
        <h2 class="text-xl font-semibold text-gray-800 flex-1">Advanced Todo</h2>
        <span class="text-sm text-gray-500" x-text="'(' + todos.filter(t => !t.completed).length + ' active)'"></span>
      </div>
      
      <!-- Add Todo -->
      <form x-on:submit.prevent="addTodo" class="mb-4">
        <div class="flex gap-2 flex-wrap">
          <input 
            type="text" 
            x-model="newTodo" 
            x-on:keyup.escape="newTodo = ''"
            placeholder="What needs to be done?"
            class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          <button 
            type="submit" 
            x:disabled="!newTodo.trim()"
            class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            Add
          </button>
        </div>
      </form>

      <!-- Filters -->
  <div class="flex gap-1 mb-4 p-1 bg-gray-100 rounded-lg flex-wrap">
        <button 
          x-for="filter in filters"
          x-on:click="currentFilter = filter.key"
          x:class="{ 'bg-white shadow-sm': currentFilter === filter.key, 'hover:bg-gray-50': currentFilter !== filter.key }"
          class="flex-1 px-3 py-1 text-sm font-medium rounded transition-all"
          x-text="filter.label">
        </button>
      </div>

      <!-- Todo List with animations -->
      <ul class="space-y-2 min-h-[200px]">
        <li 
          x-for="(todo, index) in filteredTodos" 
          x:key="todo.id"
          x:class="{ 'opacity-50': todo.completed }"
          class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg transition-all duration-200 hover:bg-gray-100">
          
          <input 
            type="checkbox" 
            x-model="todo.completed"
            x-on:change="saveTodos"
            class="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500">
          
          <span 
            x:class="{ 'line-through text-gray-500': todo.completed, 'text-gray-900': !todo.completed }"
            class="flex-1 transition-all"
            x-text="todo.text">
          </span>
          
          <span class="text-xs text-gray-400" x-text="formatDate(todo.createdAt)"></span>
          
          <button 
            x-on:click="removeTodo(index)"
            class="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors">
            ×
          </button>
        </li>
        
        <li x-if="filteredTodos.length === 0" class="text-center py-8 text-gray-500">
          <div x-text="currentFilter === 'all' ? 'No todos yet' : 'No ' + currentFilter + ' todos'"></div>
        </li>
      </ul>

      <!-- Stats & Actions -->
      <div class="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-sm">
        <span class="text-gray-600">
          {{ completedCount }} of {{ todos.length }} completed
        </span>
        <button 
          x-if="completedCount > 0"
          x-on:click="clearCompleted"
          class="text-red-600 hover:text-red-800 font-medium transition-colors">
          Clear completed
        </button>
      </div>
    </div>
  `,
  makeData: () => ({
    newTodo: '',
    currentFilter: 'all',
    todos: JSON.parse(localStorage.getItem('xtool-todos') || '[]'),
    filters: [
      { key: 'all', label: 'All' },
      { key: 'active', label: 'Active' },
      { key: 'completed', label: 'Completed' }
    ]
  }),
  computed: {
    filteredTodos() {
      switch(this.currentFilter) {
        case 'active': return this.todos.filter(t => !t.completed);
        case 'completed': return this.todos.filter(t => t.completed);
        default: return this.todos;
      }
    },
    completedCount() {
      return this.todos.filter(t => t.completed).length;
    }
  },
  methods: {
    addTodo() {
      if (!this.newTodo.trim()) return;
      this.todos.push({
        id: Date.now(),
        text: this.newTodo.trim(),
        completed: false,
        createdAt: new Date()
      });
      this.newTodo = '';
      this.saveTodos();
    },
    
    removeTodo(index) {
      this.todos.splice(index, 1);
      this.saveTodos();
    },
    
    clearCompleted() {
      this.todos = this.todos.filter(t => !t.completed);
      this.saveTodos();
    },
    
    saveTodos() {
      localStorage.setItem('xtool-todos', JSON.stringify(this.todos));
    },
    
    formatDate(date) {
      return new Date(date).toLocaleDateString();
    }
  }
});
