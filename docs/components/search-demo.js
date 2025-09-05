// Real-time Search with Debouncing (extracted)
XTool.registerComponent({
  name: 'search-demo',
  template: `
    <div class="bg-white rounded-lg shadow-lg p-6">
      <h3 class="text-lg font-semibold text-gray-800 mb-4">Real-time Search</h3>
      <div class="relative mb-4">
        <input 
          type="text" 
          x-model="searchQuery"
            x-on:input="handleSearch"
          placeholder="Search countries..."
          class="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
        <svg class="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>
        </svg>
        <div x-if="isSearching" class="absolute right-3 top-2.5">
          <svg class="w-5 h-5 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
      <div class="text-sm text-gray-500 mb-3">
        {{ filteredResults.length }} results found
        <span x-if="searchQuery.trim()">(for "{{ searchQuery }}")</span>
      </div>
      <div class="max-h-64 overflow-y-auto space-y-2">
        <div 
          x-for="(country, index) in filteredResults"
          x:key="country.code"
          class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <div class="flex items-center">
            <span class="text-2xl mr-3" x-text="country.flag"></span>
            <div>
              <div class="font-medium text-gray-900" x-text="country.name"></div>
              <div class="text-sm text-gray-500" x-text="country.capital"></div>
            </div>
          </div>
          <div class="text-right">
            <div class="text-sm font-medium text-gray-700" x-text="country.population.toLocaleString()"></div>
            <div class="text-xs text-gray-500">population</div>
          </div>
        </div>
        <div x-if="filteredResults.length === 0 && searchQuery.trim()" class="text-center py-8 text-gray-500">
          No countries found matching "{{ searchQuery }}"
        </div>
      </div>
    </div>
  `,
  makeData: () => ({
    searchQuery: '',
    isSearching: false,
    searchTimeout: null,
    countries: [
      { name: 'United States', capital: 'Washington D.C.', population: 331000000, flag: '🇺🇸', code: 'US' },
      { name: 'Canada', capital: 'Ottawa', population: 38000000, flag: '🇨🇦', code: 'CA' },
      { name: 'United Kingdom', capital: 'London', population: 67000000, flag: '🇬🇧', code: 'GB' },
      { name: 'France', capital: 'Paris', population: 67000000, flag: '🇫🇷', code: 'FR' },
      { name: 'Germany', capital: 'Berlin', population: 83000000, flag: '🇩🇪', code: 'DE' },
      { name: 'Japan', capital: 'Tokyo', population: 125000000, flag: '🇯🇵', code: 'JP' },
      { name: 'Australia', capital: 'Canberra', population: 25000000, flag: '🇦🇺', code: 'AU' },
      { name: 'Brazil', capital: 'Brasília', population: 215000000, flag: '🇧🇷', code: 'BR' },
      { name: 'India', capital: 'New Delhi', population: 1380000000, flag: '🇮🇳', code: 'IN' },
      { name: 'China', capital: 'Beijing', population: 1440000000, flag: '🇨🇳', code: 'CN' }
    ],
    filteredResults: []
  }),
  methods: {
    handleSearch() {
      this.isSearching = true;
      if (this.searchTimeout) clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => { this.performSearch(); this.isSearching = false; }, 300);
    },
    performSearch() {
      const query = this.searchQuery.trim().toLowerCase();
      if (!query) { this.filteredResults = [...this.countries]; return; }
      this.filteredResults = this.countries.filter(country => 
        country.name.toLowerCase().includes(query) ||
        country.capital.toLowerCase().includes(query)
      );
    }
  },
  mounted() { this.filteredResults = [...this.countries]; }
});
