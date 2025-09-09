// Markdown Editor with Live Preview, Persistence, and Stats
XTool.registerComponent({
  name: 'markdown-editor',
  template: `
  <div class="bg-white rounded-lg shadow-lg p-4 md:p-6 max-w-3xl mx-auto grid gap-6">
  <div class="flex items-center justify-between flex-wrap gap-2">
        <h3 class="text-lg font-semibold text-gray-800">Markdown Editor</h3>
        <div class="flex gap-2 text-xs text-gray-500">
          <span>Words: {{ wordCount }}</span>
          <span>| Chars: {{ charCount }}</span>
          <span>| Lines: {{ lineCount }}</span>
          <span x-if="savedAt">| Saved: {{ timeSinceSave }}</span>
        </div>
      </div>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="flex flex-col">
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-medium text-gray-600">Markdown</label>
            <div class="flex gap-2">
              <button x-on:click="insertSample" class="px-2 py-1 bg-gray-200 rounded text-xs hover:bg-gray-300">Sample</button>
              <button x-on:click="clearAll" class="px-2 py-1 bg-gray-200 rounded text-xs hover:bg-gray-300">Clear</button>
            </div>
          </div>
          <textarea 
            x-model="content" 
            x-on:input="debouncedPersist" 
            class="w-full border rounded p-3 font-mono text-sm min-h-[14rem] sm:min-h-[16rem] md:min-h-[18rem] resize-y overflow-auto focus:ring-2 focus:ring-blue-500 focus:outline-none" 
            placeholder="# Start writing..."></textarea>
        </div>
        <div class="flex flex-col">
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-medium text-gray-600">Preview</label>
            <button x-on:click="copyHtml" class="px-2 py-1 bg-gray-200 rounded text-xs hover:bg-gray-300" x:disabled="!content.trim()">Copy HTML</button>
          </div>
          <div class="prose prose-sm max-w-none border rounded p-4 overflow-auto bg-gray-50 min-h-[14rem] sm:min-h-[16rem] md:min-h-[18rem]" x-html="rendered"></div>
        </div>
      </div>
      <div class="flex flex-wrap gap-2 text-xs">
        <button x-for="snippet in snippets" x-on:click="insert(snippet.content)" class="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200" x-text="snippet.label"></button>
      </div>
    </div>
  `,
  makeData: () => ({
    content: localStorage.getItem('xtool-md') || '# X-Tool Markdown\n\nType *markdown* on the left. **Live preview** on the right.',
    savedAt: null,
    saveTimeout: null,
    snippets: [
      { label: 'H2', content: '\n\n## Section Title\n' },
      { label: 'List', content: '\n- item 1\n- item 2\n- item 3\n' },
      { label: 'Quote', content: '\n> Inspirational quote here.\n' },
      { label: 'Code', content: '\n```js\nconsole.log("Hello X-Tool")\n```\n' }
    ]
  }),
  computed: {
    charCount() { return this.content.length; },
    wordCount() { return (this.content.match(/[^\s]+/g) || []).length; },
    lineCount() { return this.content.split(/\n/).length; },
    timeSinceSave() { if(!this.savedAt) return ''; const diff = Date.now()-this.savedAt; const s=Math.floor(diff/1000); return s<60? s+'s ago': Math.floor(s/60)+'m ago'; },
    rendered() { return this.renderMarkdown(this.content); }
  },
  methods: {
    renderMarkdown(src){
      // Very small markdown subset (headings, bold, italics, code fences, inline code, blockquote, lists, links)
      let html = src
        .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      html = html.replace(/```(\w+)?\n([\s\S]*?)```/g,(m,lang,code)=>`<pre class="code-bg rounded p-3 text-xs overflow-auto"><code class="language-${lang||'plaintext'}">${code.replace(/`/g,'&#96;')}</code></pre>`);
      html = html.replace(/^###### (.*)$/gm,'<h6>$1</h6>')
                 .replace(/^##### (.*)$/gm,'<h5>$1</h5>')
                 .replace(/^#### (.*)$/gm,'<h4>$1</h4>')
                 .replace(/^### (.*)$/gm,'<h3>$1</h3>')
                 .replace(/^## (.*)$/gm,'<h2>$1</h2>')
                 .replace(/^# (.*)$/gm,'<h1>$1</h1>');
      html = html.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\*(.*?)\*/g,'<em>$1</em>');
      html = html.replace(/`([^`]+)`/g,'<code class="px-1 bg-gray-200 rounded">$1</code>');
      html = html.replace(/^> (.*)$/gm,'<blockquote class="border-l-4 pl-3 italic text-gray-600">$1</blockquote>');
      // Lists
      html = html.replace(/(^|\n)(- .+(\n- .+)*)/g,(m,lead,body)=>lead + '<ul class="list-disc ml-6">' + body.split(/\n/).map(l=>'<li>'+l.replace(/^- /,'')+'</li>').join('') + '</ul>');
      // Paragraphs
      html = html.split(/\n{2,}/).map(block=> /^(<h\d|<ul|<pre|<blockquote)/.test(block.trim()) ? block : '<p>'+block.replace(/\n/g,'<br>')+'</p>').join('\n');
      return html;
    },
    debouncedPersist(){ clearTimeout(this.saveTimeout); this.saveTimeout = setTimeout(this.persist, 600); },
    persist(){ localStorage.setItem('xtool-md', this.content); this.savedAt = Date.now(); },
    insert(text){ this.content += text; this.debouncedPersist(); },
    insertSample(){ this.content = '# Demo Document\n\n## Features\n- **Live** preview\n- *Word counting*\n- Minimal markdown parser\n\n> Built with X-Tool components.'; this.persist(); },
    clearAll(){ if(confirm('Clear editor?')) { this.content=''; this.persist(); } },
    copyHtml(){ const html=this.rendered; navigator.clipboard.writeText(html); }
  }
});
