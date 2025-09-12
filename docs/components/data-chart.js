// Interactive Data Visualization Component (extracted)
XTool.registerComponent({
  name: 'data-chart',
  template: html`
    <div class="bg-white rounded-lg shadow-lg p-6">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-semibold text-gray-800">Interactive Chart</h3>
        <div class="flex gap-2">
          <button 
            x-for="type in chartTypes"
            x-on:click="currentType = type.key"
            x:class="{ 'bg-blue-500 text-white': currentType === type.key, 'bg-gray-200 text-gray-700': currentType !== type.key }"
            class="px-3 py-1 text-sm rounded transition-colors"
            x-text="type.label">
          </button>
        </div>
      </div>

      <!-- Chart Display -->
      <div class="mb-6" x-show="currentType === 'bar'">
        <div class="flex items-end justify-between h-48 bg-gray-50 rounded-lg p-4">
          <div 
            x-for="(item, index) in chartData" 
            class="flex flex-col items-center flex-1">
            <div 
              class="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t transition-all duration-500 hover:from-blue-600 hover:to-blue-400 cursor-pointer"
              x:style="{ height: (item.value / maxValue * 160) + 'px' }"
              x-on:click="selectDataPoint(index)"
              x:class="{ 'ring-2 ring-blue-600': selectedIndex === index }">
            </div>
            <span class="text-xs text-gray-600 mt-2" x-text="item.label"></span>
          </div>
        </div>
      </div>

      <div class="mb-6" x-show="currentType === 'line'">
        <div class="h-48 bg-gray-50 rounded-lg p-4 relative overflow-hidden">
          <svg class="w-full h-full" viewBox="0 0 400 160">
            <polyline 
              x:points="chartData.map((item, i) => (i * 400 / (chartData.length - 1)) + ',' + (160 - (item.value / maxValue * 160))).join(' ')"
              fill="none" 
              stroke="rgb(59, 130, 246)" 
              stroke-width="3"
              class="transition-all duration-500">
            </polyline>
            <circle 
              x-for="(item, index) in chartData"
              x:cx="index * 400 / (chartData.length - 1)"
              x:cy="160 - (item.value / maxValue * 160)"
              r="4"
              fill="rgb(59, 130, 246)"
              class="cursor-pointer hover:r-6 transition-all"
              x-on:click="selectDataPoint(index)">
            </circle>
          </svg>
        </div>
      </div>

  <!-- Data Controls -->
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Add Data Point</label>
          <div class="flex gap-2">
            <input 
              type="text" 
              x-model="newLabel" 
              placeholder="Label"
              class="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <input 
              type="number" 
              x-model="newValue" 
              placeholder="Value"
              class="w-20 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <button 
              x-on:click="addDataPoint"
              class="px-3 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors">
              Add
            </button>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Selected Point</label>
          <div x-if="selectedIndex !== null" class="text-sm">
            <div class="flex gap-2">
              <span class="font-medium" x-text="chartData[selectedIndex]?.label + ':'"></span>
              <span x-text="chartData[selectedIndex]?.value"></span>
              <button 
                x-on:click="removeDataPoint(selectedIndex)"
                class="text-red-600 hover:text-red-800 ml-2">
                Remove
              </button>
            </div>
          </div>
          <div x-if="selectedIndex === null" class="text-sm text-gray-500">
            Click a data point to select
          </div>
        </div>
      </div>
    </div>
  `,

  makeData: () => ({
    currentType: 'bar',
    selectedIndex: null,
    newLabel: '',
    newValue: '',
    chartTypes: [
      { key: 'bar', label: 'Bar' },
      { key: 'line', label: 'Line' }
    ],
    chartData: [
      { label: 'Jan', value: 65 },
      { label: 'Feb', value: 45 },
      { label: 'Mar', value: 80 },
      { label: 'Apr', value: 30 },
      { label: 'May', value: 95 }
    ]
  }),

  computed: {
    maxValue() {
      return Math.max(...this.chartData.map(item => item.value), 100);
    }
  },

  methods: {
    selectDataPoint(index) {
      this.selectedIndex = this.selectedIndex === index ? null : index;
    },
    
    addDataPoint() {
      if (!this.newLabel.trim() || !this.newValue) return;
      this.chartData.push({
        label: this.newLabel.trim(),
        value: parseInt(this.newValue)
      });
      this.newLabel = '';
      this.newValue = '';
    },
    
    removeDataPoint(index) {
      this.chartData.splice(index, 1);
      this.selectedIndex = null;
    }
  }
});
