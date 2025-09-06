// x-transition comprehensive demo component
XTool.registerComponent({
  name: 'x-transition-demo',
  template: html`
    <div class="space-y-6">
      <div class="flex items-center gap-2">
        <button class="px-3 py-1.5 rounded bg-blue-600 text-white" x-on:click="open=!open">Toggle Panel</button>
        <label class="text-xs flex items-center gap-2">
          <input type="checkbox" x-model="useCustom"/> Use custom classes
        </label>
      </div>

      <!-- Default transition -->
      <div class="p-4 border rounded bg-white" x-transition x-show="open">
        <div class="text-sm">Default transition with xt-enter/leave classes.</div>
      </div>

      <!-- Custom transition via config object -->
      <div class="p-4 border rounded bg-white transition-all"
           x-transition="useCustom ? { enter: 'transition ease-out duration-700', enterFrom: 'opacity-0 -translate-y-2', enterTo: 'opacity-100 translate-y-0', leave: 'transition ease-in duration-150', leaveFrom: 'opacity-100 translate-y-0', leaveTo: 'opacity-0 -translate-y-2' } : {}"
           x-show="open">
        <div class="text-sm">Custom tailwind classes as expression.</div>
      </div>

      <!-- List enter/leave -->
      <div>
        <div class="flex items-center gap-2 mb-2">
          <button class="px-2 py-1 rounded bg-gray-900 text-white text-xs" x-on:click="addItem()">Add</button>
          <button class="px-2 py-1 rounded bg-gray-200 text-xs" x-on:click="removeItem()" :disabled="items.length===0">Remove</button>
        </div>
        <div class="flex flex-wrap gap-2">
          <div x-for="chip in items" x-key="chip.id" x-transition x-show="true"
               class="px-2 py-1 rounded bg-indigo-100 text-indigo-800 text-xs">
            <span x-text="chip.text"></span>
          </div>
        </div>
      </div>
    </div>
  `,
  makeData: () => ({
    open: false,
    useCustom: true,
    nextId: 1,
    items: []
  }),
  methods: {
    addItem(){ this.items.push({ id: this.nextId++, text: 'Chip #' + (this.nextId-1) }); },
    removeItem(){ if (this.items.length) this.items.splice(this.items.length-1, 1); }
  }
});
