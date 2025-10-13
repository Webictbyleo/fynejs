// Shared footer component for FyneJS docs
XTool.registerComponent({
  name: 'docs-footer',
  template: `
    <footer class="bg-black text-white relative overflow-hidden">
      <!-- Background Pattern -->
      <div class="absolute inset-0 opacity-5">
        <div class="absolute top-10 left-10 w-48 h-48 bg-white rounded-full blur-3xl"></div>
        <div class="absolute bottom-10 right-10 w-32 h-32 bg-white rounded-full blur-2xl"></div>
      </div>
      
      <div class="relative container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <!-- Main Footer Content -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <!-- About -->
          <div class="md:col-span-2">
            <div class="flex items-center gap-4 mb-6">
              <img src="./assets/logo-small.png" alt="FyneJS - Lightweight Reactive Framework Logo" width="48" height="48" class="w-12 h-12 rounded-xl shadow-sm" loading="lazy" decoding="async" />
              <span class="text-2xl font-black">FyneJS</span>
            </div>
            <p class="text-gray-300 text-lg mb-8 leading-relaxed max-w-md">
              A tiny, fast, zero-dependency reactive UI framework for the browser. 
              Build interactive UIs with simple declarative attributes—no build step required.
            </p>
            
            <!-- Quick Action Buttons -->
            <div class="flex flex-col sm:flex-row gap-4 mb-8">
              <a href="getting-started.html" 
                 class="inline-flex items-center px-6 py-3 bg-white text-black rounded-xl hover:bg-gray-100 transition-all duration-300 font-bold shadow-lg hover:shadow-xl hover:scale-105">
                Get Started →
              </a>
              <a href="examples.html" 
                 class="inline-flex items-center px-6 py-3 bg-transparent border-2 border-white text-white rounded-xl hover:bg-white hover:text-black transition-all duration-300 font-bold">
                View Examples
              </a>
            </div>
            
            <!-- Badges -->
            <div class="flex items-center gap-4">
              <a href="https://www.npmjs.com/package/fynejs" target="_blank" rel="noopener noreferrer" aria-label="npm version" class="hover:opacity-80 transition-opacity">
                <img class="h-6" width="auto" height="24" src="https://img.shields.io/npm/v/fynejs?style=flat-square&color=white&labelColor=black" alt="FyneJS npm version badge" loading="lazy" decoding="async" />
              </a>
              <a href="https://www.npmjs.com/package/fynejs" target="_blank" rel="noopener noreferrer" aria-label="npm downloads" class="hover:opacity-80 transition-opacity">
                <img class="h-6" width="auto" height="24" src="https://img.shields.io/npm/dm/fynejs?style=flat-square&color=white&labelColor=black" alt="FyneJS npm monthly downloads badge" loading="lazy" decoding="async" />
              </a>
            </div>
          </div>

          <!-- Documentation Links -->
          <div>
            <h3 class="text-lg font-black uppercase tracking-wider mb-6 text-white">Documentation</h3>
            <ul class="space-y-4">
              <li><a href="getting-started.html" class="text-gray-300 hover:text-white transition-all duration-300 text-base font-medium hover:translate-x-1 inline-block">Getting Started</a></li>
              <li><a href="directives.html" class="text-gray-300 hover:text-white transition-all duration-300 text-base font-medium hover:translate-x-1 inline-block">Directives</a></li>
              <li><a href="components.html" class="text-gray-300 hover:text-white transition-all duration-300 text-base font-medium hover:translate-x-1 inline-block">Components</a></li>
              <li><a href="api.html" class="text-gray-300 hover:text-white transition-all duration-300 text-base font-medium hover:translate-x-1 inline-block">API Reference</a></li>
              <li><a href="examples.html" class="text-gray-300 hover:text-white transition-all duration-300 text-base font-medium hover:translate-x-1 inline-block">Examples</a></li>
            </ul>
          </div>

          <!-- Community Links -->
          <div>
            <h3 class="text-lg font-black uppercase tracking-wider mb-6 text-white">Community</h3>
            <ul class="space-y-4">
              <li>
                <a href="https://github.com/Webictbyleo/fynejs" 
                   class="text-gray-300 hover:text-white transition-all duration-300 inline-flex items-center text-base font-medium hover:translate-x-1"
                   target="_blank"
                   rel="noopener noreferrer">
                  <svg class="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                    <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd"/>
                  </svg>
                  GitHub
                </a>
              </li>
              <li>
                <a href="https://www.npmjs.com/package/fynejs" 
                   class="text-gray-300 hover:text-white transition-all duration-300 inline-flex items-center text-base font-medium hover:translate-x-1"
                   target="_blank"
                   rel="noopener noreferrer">
                  <svg class="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M0 7.334v8h6.666v1.332H12v-1.332h12v-8H0zm6.666 6.664H5.334v-4H3.999v4H1.335V8.667h5.331v5.331zm4 0v1.336H8.001V8.667h5.334v5.332h-2.669v-.001zm12.001 0h-1.33v-4h-1.336v4h-1.335v-4h-1.33v4h-2.671V8.667h8.002v5.331z"/>
                  </svg>
                  npm
                </a>
              </li>
              <li>
                <a href="https://github.com/Webictbyleo/fynejs/issues" 
                   class="text-gray-300 hover:text-white transition-all duration-300 text-base font-medium hover:translate-x-1 inline-block"
                   target="_blank"
                   rel="noopener noreferrer">
                  Report Issues
                </a>
              </li>
            </ul>
          </div>
        </div>

        <!-- Bottom Bar -->
        <div class="border-t border-gray-800 pt-8">
          <div class="flex flex-col md:flex-row justify-between items-center gap-4">
            <p class="text-gray-400 text-base">
              Built with ❤️ for developers who value simplicity. 
              <a href="https://github.com/Webictbyleo/fynejs/blob/main/LICENSE" 
                 class="text-white hover:text-gray-300 transition-colors font-semibold underline"
                 target="_blank"
                 rel="noopener noreferrer">
                MIT Licensed
              </a>
            </p>
            <p class="text-gray-500 text-sm">
              © <span x-text="new Date().getFullYear()"></span> FyneJS. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  `,
  makeData: () => ({})
});
