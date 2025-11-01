# FyneJS

[![npm version](https://img.shields.io/npm/v/fynejs)](https://www.npmjs.com/package/fynejs)
[![npm downloads (weekly)](https://img.shields.io/npm/dw/fynejs)](https://www.npmjs.com/package/fynejs)
[![npm downloads (monthly)](https://img.shields.io/npm/dm/fynejs)](https://www.npmjs.com/package/fynejs)
[![npm downloads (total)](https://img.shields.io/npm/dt/fynejs)](https://www.npmjs.com/package/fynejs)

FyneJS is a tiny, fast, zero‑dependency reactive UI framework for the browser.

## Why FyneJS

- **Tiny & fast**: zero dependencies, ~18.6KB gzipped, optimized for performance
- **Engineered reactivity**: lean, cached evaluations; fine‑grained computed invalidation
- **Smart GC**: precise cleanup for timers, observers, events, and component trees
- **Built-in SPA router**: client-side navigation with view transitions, prefetching, and lifecycle hooks
- **Browser-native TypeScript**: load `.ts` component files directly—blazing fast type stripping (~34ms for 1000 lines) with zero build tools
- **Declarative power**: rich directives and component composition without a build step
- **SEO‑friendly by design**: progressive enhancement on existing HTML; no client‑side rendering takeover, so your server content remains crawlable

## Capabilities (with examples)

- **Built-in SPA router** with view transitions, prefetching, and navigation hooks (see [Built-in SPA Router](#built-in-spa-router) section)

- **Browser-native TypeScript**: Load `.ts` component files directly without build tools—blazing fast type stripping in ~34ms (see [Browser-Native TypeScript](#browser-native-typescript-zero-build) section)

- Declarative directives: text, HTML, show/hide, if/else, loops, model binding, events, styles, classes

  ```html
  <div x-data="{ n: 0, items: [1,2,3], open: true }">
    <button x-on:click="n++">+1</button>
    <span x-text="n"></span>

    <template x-if="open"><p>Shown</p></template>
    <ul>
      <template x-for="(v,i) in items"><li>#<span x-text="i"></span>: <span x-text="v"></span></li></template>
    </ul>
  </div>
  ```

- Powerful events & modifiers: keys, buttons, touch, outside, once, passive, capture, combos, defer

  ```html
  <input x-on:keydown.enter.ctrl="save()">
  <button x-on:click.once="init()">Init once</button>
  <div x-on:click.outside="open=false">Panel</div>
  <input x-on:input.defer="recompute()"> <!-- handler runs in a microtask -->
  ```

- Model binding: inputs, checkboxes (arrays), radios, selects (multiple)

  ```html
  <input type="text" x-model="form.name">
  <input type="checkbox" value="admin" x-model="roles"> <!-- toggles 'admin' in roles -->
  <select multiple x-model="selected"> ... </select>
  ```

- Computed & watch: derived state and change observers

  ```html
  <div x-data="{ a: 2, b: 3 }" x-text="a*b"></div>
  <!-- via component API, you can also define computed and watch -->
  ```

- Lifecycle hooks: beforeMount, mounted, updated, beforeUnmount, unmounted

- Slot & props: lightweight component composition

- Seal and freeze: temporarily pause interactivity or lock state

  ```html
  <!-- Freeze via readonly attribute (no state changes, timers/listeners/observers paused, no renders) -->
  <component source="stats-card" readonly></component>

  <!-- Seal programmatically: allow internal state but suppress renders and side-effects -->
  <div x-data="{ paused:false, toggle(){ this.$seal(!(this.$isSealed)); this.paused = this.$isSealed; } }">
    <button x-on:click="toggle()" x-text="$isSealed ? 'Resume' : 'Pause'"></button>
  </div>
  ```

  Freeze is fully read‑only (no state changes, no renders). Remove the readonly attribute (or call $seal(false) for sealed) to resume interactivity when appropriate.


- No build required: works directly in the browser; enhanced builds are optional

- `$nextTick()`: run code after DOM updates

  ```js
  this.$nextTick(()=>{/* DOM updated */})
  ```

- Event delegation: scale to large UIs

  ```html
  <script> XTool.init({ delegate: true }); </script>
  ```

- Security sandbox: restrict globals in expressions

  ```js
  XTool.init({ sandboxExpressions: true, allowGlobals: ['setTimeout'] })
  ```

## Quick start (CDN)

Include the minified build from jsDelivr or unpkg:

```html
<script src="https://cdn.jsdelivr.net/npm/fynejs@latest/dist/x-tool.min.js"></script>
<!-- or -->
<script src="https://unpkg.com/fynejs@latest/dist/x-tool.min.js"></script>
<script>
  XTool.init({ 
    debug: false,
    router: { enabled: true }  // Optional: enable SPA routing
  });
  
  // Optional: Load external components (supports .js and .ts files!)
  XTool.loadComponents([
    'components/header.js',
    'components/user-card.ts'  // TypeScript works directly in browser!
  ]);
</script>

<div x-data="{ count: 0 }">
  <button x-on:click="count++">+1</button>
  <span x-text="count"></span>
</div>
```

## TypeScript usage

There are two easy ways to use FyneJS with TypeScript:

### 1) Bundlers (recommended)

Install the package and import the API. The package exposes clean ESM/CJS entry points and ships its own types.

```ts
// main.ts
import XTool, { html } from 'fynejs';

XTool.init({ debug: false, delegate: true });

XTool.registerComponent({
  name: 'hello-world',
  data: { msg: 'Hello FyneJS' },
  // Use the tagged template for editor highlighting in TS
  template: html`<div x-text="msg"></div>`
});

// Somewhere in your HTML template or via DOM APIs:
// <component source="hello-world"></component>
```

- Works with Vite/Rollup/Webpack/ts-node/tsx without extra config.
- Types are resolved automatically via the package `exports` (no triple-slash needed).
- Tip: Import the `html` helper from `fynejs` for tagged template literals without TS errors and with IDE HTML highlighting.

### 2) CDN + types

If you’re using the CDN build in the browser and still want editor types, reference the declarations manually:

```ts
/// <reference path="./types/x-tool/types.d.ts" />
```

You can copy the file into your repo and point `typeRoots` to it, or vendor the shipped `types.d.ts`.

## Core concepts

### Auto-discovery with x-data

```html
<div x-data="{ message: 'Hello' }" x-text="message"></div>
```

### Events and modifiers

```html
<button x-on:click.prevent.stop="submit()">Save</button>
<input x-on:keydown.enter="save()">
```

### Two-way binding

```html
<input type="text" x-model="form.name">
<input type="checkbox" value="admin" x-model="roles"> <!-- adds/removes 'admin' in roles array -->
<select multiple x-model="selected"> ... </select>
```

### Lists and conditionals

```html
<template x-if="items.length === 0">
  <p>No items</p>
</template>

<ul>
  <template x-for="(todo, i) in todos">
    <li>
      <span x-text="todo.title"></span>
    </li>
  </template>

### Built-in SPA Router

FyneJS includes a lightweight client-side router with view transitions and navigation hooks:

```js
XTool.init({
  router: {
    enabled: true,
    transtionName: 'slide',        // CSS view transition name
    before: (to, from, info) => {
      // Check auth, analytics, etc.
      // Return false to cancel navigation
      return true;
    },
    after: (to, from, info) => {
      // Update UI, scroll, analytics
      console.log(`Navigated from ${from} to ${to}`);
    },
    error: (error, to, from) => {
      console.error('Navigation error:', error);
    },
    prefetchOnHover: true          // Smart link prefetching
  }
});
```

Use `x-link` directive for SPA navigation:

```html
<nav>
  <a href="/index.html" x-link>Home</a>
  <a href="/about.html" x-link>About</a>
  <a href="/contact.html" x-link>Contact</a>
</nav>

<!-- With prefetching -->
<a href="/dashboard.html" x-link x-prefetch="hover">Dashboard</a>
```

The router intercepts link clicks, updates the URL, and loads new pages without full refreshes—perfect for multi-page apps that feel like SPAs.

### Dynamic component file loading

Load external component files (`.js` or `.ts`) with flexible loading strategies:

```js
// Preload immediately (default for string entries)
XTool.loadComponents([
  'components/stats-card.js',
  { path: 'components/chat-panel.js', mode: 'preload' }
]);

// Defer: ensure file loads before initial auto-discovery (blocks first scan)
XTool.loadComponents([
  { path: 'components/large-dashboard.js', mode: 'defer' }
]);

// Lazy: only fetch when a <component source="name"> appears in the DOM
XTool.loadComponents([
  { path: 'components/order-book.js', mode: 'lazy', name: 'order-book' },
  // name can be omitted; filename (without extension) is used
  { path: 'components/advanced-calculator.js', mode: 'lazy' }
]);

// Later in HTML (triggers lazy fetch on first encounter)
// <component source="order-book"></component>
```

Lazy mode details:
- Registration does not fetch the file until the component is actually used.
- If a matching `<component source="...">` already exists at registration time, the file is fetched in an idle callback.
- After load, auto-discovery re-runs so the component mounts automatically.

Defer mode details:
- Files are fetched before the framework performs the initial DOM scan, guaranteeing definitions are available when components are first discovered.

Return value:
`loadComponents` resolves with `{ settled, failed }` counting only immediate (preload + defer) operations; lazy entries are not counted until they actually load.

**TypeScript components work too!** FyneJS automatically strips TypeScript type annotations from `.ts` files:

```js
XTool.loadComponents([
  'components/user-card.ts',      // TypeScript file
  'components/data-chart.ts',     // TypeScript file
  'components/modal.js'           // Regular JavaScript
]);
```
</ul>
```

### Browser-Native TypeScript (Zero Build)

**Unique to FyneJS**: Load TypeScript component files directly in the browser without any build step or compilation!

```js
// Load TypeScript components just like JavaScript
XTool.loadComponents([
  { path: 'components/user-dashboard.ts', mode: 'preload' },
  { path: 'components/analytics-chart.ts', mode: 'lazy' }
]);
```

```html
<!-- Use TypeScript components seamlessly -->
<component source="user-dashboard"></component>
<component source="analytics-chart"></component>
```

**How it works:**
- Token-based type stripping using a single-pass scanner
- Blazingly fast: ~34ms for 1000 lines of TypeScript
- Handles interfaces, types, generics, enums, access modifiers, and more
- No compilation, no waiting, no build process
- Works with simple and complex TypeScript patterns

**What gets removed:**
- Type annotations (variables, parameters, return types)
- Interface, type, namespace, and declare declarations
- Generics in functions and classes
- Import/export statements (including type-only imports)
- Non-null assertions (`!`)
- Access modifiers (public, private, protected, readonly)
- Type assertions (`as` syntax)
- Enum declarations
- `implements` clauses

**Important notes:**
- This is type *stripping*, not type *checking*—use an IDE (VS Code, WebStorm) for type safety during development
- Best suited for well-formed TypeScript code
- Simpler types work better than very complex type constructs
- Consider file size for large codebases (performance is excellent for typical component files)

**Example TypeScript component:**

```typescript
// components/user-card.ts
interface User {
  id: number;
  name: string;
  email: string;
}

XTool.registerComponent<{ user: User }>({
  name: 'user-card',
  data: {
    user: null as User | null,
    loading: false
  },
  methods: {
    async loadUser(id: number): Promise<void> {
      this.loading = true;
      const response = await fetch(`/api/users/${id}`);
      this.user = await response.json();
      this.loading = false;
    }
  },
  template: html`
    <div class="card">
      <template x-if="loading">Loading...</template>
      <template x-if="!loading && user">
        <h3 x-text="user.name"></h3>
        <p x-text="user.email"></p>
      </template>
    </div>
  `
});
```

The TypeScript code above is automatically stripped to valid JavaScript and executed in the browser—**no build step required!**

### Next tick

```js
XTool.init();
XTool.createComponent?.({ /* if using programmatic API */ });
// In methods:
this.$nextTick(() => {
  // DOM is updated
});
```

### Event delegation (large lists)

```html
<script>
XTool.init({ delegate: true });
</script>
```

Delegates `click`, `input`, `change`, `keydown`, `keyup` at the container level to reduce listeners.

### Expression sandbox (optional)

```js
XTool.init({
  sandboxExpressions: true,
  allowGlobals: ['setTimeout', 'requestAnimationFrame'] // whitelist if needed
});
```

When enabled, expressions do not see `window`/`document` unless whitelisted.

### Async component templates

```html
<component source="async-card" x-prop="{ id: 42 }"></component>
<script>
XTool.registerComponent({
  name: 'async-card',
  template: () => fetch('/card.html').then(r => r.text()),
  mounted() { /* ... */ }
});
</script>
```

Until the Promise resolves, the component element stays empty; when it resolves, the template is applied and directives are parsed.

## Components: registration, props, slots, dynamic mounting

Register once, reuse anywhere:

```html
<component source="fancy-card" x-prop="{ title: 'Hi' }"></component>

<script>
XTool.registerComponent({
  name: 'fancy-card',
  template: `
    <div class="card">
      <h3 x-text="title"></h3>
      <slot></slot>
    </div>
  `,
  data: { title: '' }
});
</script>
```

Dynamic mounting: change the `source` attribute and the framework mounts the new component and cleans up the old one automatically.

```html
<div x-data="{ src: 'fancy-card' }">
  <button x-on:click="src = src==='fancy-card' ? 'simple-card' : 'fancy-card'">Swap</button>
  <component x:source="src"></component>
</div>
```

Props are reactive; slots distribute original child nodes to `<slot>`/`<slot name="...">`.

Async templates are supported: `template` can be a string, a Promise, or a function returning a Promise.

```js
XTool.registerComponent({
  name: 'delayed-card',
  template: () => fetch('/fragments/card.html').then(r=>r.text())
});
```

## Global API (window.XTool)

```ts
XTool.init(config?: {
  container?: string;           // default: 'body'
  debug?: boolean;              // enable debug logging
  staticDirectives?: boolean;   // optimize static directives
  prefix?: string;              // default: 'x'
  delegate?: boolean;           // event delegation for performance
  sandboxExpressions?: boolean; // restrict globals in expressions
  allowGlobals?: string[];      // whitelist globals when sandboxed
  router?: {                    // SPA routing configuration
    enabled: boolean;
    transtionName?: string;     // CSS view transition name
    before?: (to: string, from: string, info: {source: string}) => boolean | Promise<boolean>;
    after?: (to: string, from: string, info: {source: string}) => void;
    error?: (error: unknown, to: string, from: string) => void;
    prefetchOnHover?: boolean;  // smart link prefetching
  }
});

XTool.directive(name: string, impl: { bind?, update?, unbind? }): void;
XTool.registerComponent({ name, data, methods, computed, propEffects, template, ... }): void;
XTool.loadComponents(sources: Array<string | { path: string; mode?: 'preload' | 'defer' | 'lazy'; name?: string }>): Promise<{ settled: number; failed: number }>;

// Optional: custom directive prefix (not hardcoded to "x")
XTool.init({ prefix: 'u' }); // use u-data, u-text, u-on:click, ...
```


## Documentation

For complete documentation, guides, and interactive examples, visit:

**[https://fynejs.com](https://fynejs.com)**

- [Getting Started Guide](https://fynejs.com/getting-started.html)
- [Directives Reference](https://fynejs.com/directives.html)
- [Components Guide](https://fynejs.com/components.html)
- [Router Documentation](https://fynejs.com/router.html)
- [TypeScript Support](https://fynejs.com/typescript.html)
- [API Reference](https://fynejs.com/api.html)
- [Examples](https://fynejs.com/examples.html)

## License

MIT
