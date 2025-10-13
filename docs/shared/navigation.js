// Shared navigation component for FyneJS docs
XTool.registerComponent({
  name: 'docs-nav',
  template: `
    <nav class="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-200">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-20">
          <!-- Logo and Brand -->
          <div class="flex items-center">
            <a href="index.html" class="flex items-center gap-4 group">
              <img src="./assets/logo-small.png" alt="FyneJS - Lightweight Reactive Framework Logo" width="48" height="48" class="w-12 h-12 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300" loading="eager" decoding="async" />
              <span class="text-2xl font-black text-gray-900 group-hover:text-black transition-colors">FyneJS</span>
            </a>
          </div>

          <!-- Desktop Navigation -->
          <div class="hidden md:flex items-center space-x-2">
            <a href="index.html" 
               x:class="{ 'bg-black text-white shadow-lg': activePage === 'index', 'text-gray-700 hover:text-black hover:bg-gray-100': activePage !== 'index' }"
               class="px-5 py-3 rounded-xl text-sm font-bold transition-all duration-300 hover:scale-105">
              Home
            </a>
            <a href="getting-started.html" 
               x:class="{ 'bg-black text-white shadow-lg': activePage === 'getting-started', 'text-gray-700 hover:text-black hover:bg-gray-100': activePage !== 'getting-started' }"
               class="px-5 py-3 rounded-xl text-sm font-bold transition-all duration-300 hover:scale-105">
              Getting Started
            </a>
            <a href="directives.html" 
               x:class="{ 'bg-black text-white shadow-lg': activePage === 'directives', 'text-gray-700 hover:text-black hover:bg-gray-100': activePage !== 'directives' }"
               class="px-5 py-3 rounded-xl text-sm font-bold transition-all duration-300 hover:scale-105">
              Directives
            </a>
            <a href="components.html" 
               x:class="{ 'bg-black text-white shadow-lg': activePage === 'components', 'text-gray-700 hover:text-black hover:bg-gray-100': activePage !== 'components' }"
               class="px-5 py-3 rounded-xl text-sm font-bold transition-all duration-300 hover:scale-105">
              Components
            </a>
            <a href="api.html" 
               x:class="{ 'bg-black text-white shadow-lg': activePage === 'api', 'text-gray-700 hover:text-black hover:bg-gray-100': activePage !== 'api' }"
               class="px-5 py-3 rounded-xl text-sm font-bold transition-all duration-300 hover:scale-105">
              API Reference
            </a>
            <a href="examples.html" 
               x:class="{ 'bg-black text-white shadow-lg': activePage === 'examples', 'text-gray-700 hover:text-black hover:bg-gray-100': activePage !== 'examples' }"
               class="px-5 py-3 rounded-xl text-sm font-bold transition-all duration-300 hover:scale-105">
              Examples
            </a>
          </div>

          <!-- Right Side Actions -->
          <div class="hidden md:flex items-center space-x-4">
            <a href="https://github.com/Webictbyleo/fynejs" 
               class="p-3 text-gray-700 hover:text-black hover:bg-gray-100 rounded-xl transition-all duration-300 hover:scale-110"
               target="_blank"
               rel="noopener noreferrer"
               aria-label="View on GitHub">
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd"/>
              </svg>
            </a>
            <a href="https://www.npmjs.com/package/fynejs" 
               class="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-all duration-300 text-sm font-bold shadow-lg hover:shadow-xl hover:scale-105"
               target="_blank"
               rel="noopener noreferrer">
              npm install
            </a>
          </div>

          <!-- Mobile Menu Button -->
          <button x-on:click="mobileMenuOpen = !mobileMenuOpen"
                  class="md:hidden inline-flex items-center justify-center p-3 rounded-xl text-gray-700 hover:text-black hover:bg-gray-100 transition-all duration-300"
                  aria-label="Toggle menu">
            <svg x-show="!mobileMenuOpen" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
            <svg x-show="mobileMenuOpen" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Mobile Menu -->
      <div x-show="mobileMenuOpen" 
           
           x-on:click.outside="mobileMenuOpen = false"
           class="md:hidden border-t border-gray-200 bg-white/95 backdrop-blur-lg shadow-lg">
        <div class="px-4 pt-4 pb-6 space-y-2">
          <a href="index.html" 
             x:class="{ 'bg-black text-white shadow-lg': activePage === 'index', 'text-gray-700 hover:bg-gray-100 hover:text-black': activePage !== 'index' }"
             class="block px-5 py-4 rounded-xl text-base font-bold transition-all duration-300">
            Home
          </a>
          <a href="getting-started.html" 
             x:class="{ 'bg-black text-white shadow-lg': activePage === 'getting-started', 'text-gray-700 hover:bg-gray-100 hover:text-black': activePage !== 'getting-started' }"
             class="block px-5 py-4 rounded-xl text-base font-bold transition-all duration-300">
            Getting Started
          </a>
          <a href="directives.html" 
             x:class="{ 'bg-black text-white shadow-lg': activePage === 'directives', 'text-gray-700 hover:bg-gray-100 hover:text-black': activePage !== 'directives' }"
             class="block px-5 py-4 rounded-xl text-base font-bold transition-all duration-300">
            Directives
          </a>
          <a href="components.html" 
             x:class="{ 'bg-black text-white shadow-lg': activePage === 'components', 'text-gray-700 hover:bg-gray-100 hover:text-black': activePage !== 'components' }"
             class="block px-5 py-4 rounded-xl text-base font-bold transition-all duration-300">
            Components
          </a>
          <a href="api.html" 
             x:class="{ 'bg-black text-white shadow-lg': activePage === 'api', 'text-gray-700 hover:bg-gray-100 hover:text-black': activePage !== 'api' }"
             class="block px-5 py-4 rounded-xl text-base font-bold transition-all duration-300">
            API Reference
          </a>
          <a href="examples.html" 
             x:class="{ 'bg-black text-white shadow-lg': activePage === 'examples', 'text-gray-700 hover:bg-gray-100 hover:text-black': activePage !== 'examples' }"
             class="block px-5 py-4 rounded-xl text-base font-bold transition-all duration-300">
            Examples
          </a>
          
          <!-- Mobile Actions -->
          <div class="border-t border-gray-200 pt-6 mt-6 space-y-4">
            <a href="https://github.com/Webictbyleo/fynejs" 
               class="flex items-center text-gray-700 hover:text-black transition-all duration-300 px-5 py-3 rounded-xl hover:bg-gray-100"
               target="_blank"
               rel="noopener noreferrer">
              <svg class="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd"/>
              </svg>
              <span class="font-bold">GitHub</span>
            </a>
            <a href="https://www.npmjs.com/package/fynejs" 
               class="block px-6 py-4 bg-black text-white rounded-xl hover:bg-gray-800 transition-all duration-300 text-base font-bold text-center shadow-lg hover:shadow-xl"
               target="_blank"
               rel="noopener noreferrer">
              npm install fynejs
            </a>
          </div>
        </div>
      </div>
    </nav>
  `,
  
  // makeData receives props as an object with string values from HTML attributes
  makeData: (props) => ({
    activePage: props.page || '',
    mobileMenuOpen: false
  })
});
