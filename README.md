# FyneJS

[![npm version](https://img.shields.io/npm/v/fynejs)](https://www.npmjs.com/package/fynejs)
[![npm downloads (weekly)](https://img.shields.io/npm/dw/fynejs)](https://www.npmjs.com/package/fynejs)
[![npm downloads (monthly)](https://img.shields.io/npm/dm/fynejs)](https://www.npmjs.com/package/fynejs)
[![npm downloads (total)](https://img.shields.io/npm/dt/fynejs)](https://www.npmjs.com/package/fynejs)

FyneJS is a tiny, fast, zero‑dependency reactive UI framework for the browser.

## Why FyneJS

- Tiny & fast: < 10KB gzipped, zero dependencies
- Engineered reactivity: lean, cached evaluations; fine‑grained computed invalidation
- Smart GC: precise cleanup for timers, observers, events, and component trees
- Declarative power: rich directives and component composition without a build step
- SEO‑friendly by design: progressive enhancement on existing HTML; no client‑side rendering takeover, so your server content remains crawlable

## Capabilities (with examples)

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
  XTool.init({ debug: false });
</script>

<div x-data="{ count: 0 }">
  <button x-on:click="count++">+1</button>
  <span x-text="count"></span>
</div>
```

## TypeScript usage

`dist/types.d.ts` provides editor types when loading from CDN.

- Copy the file and reference via `typeRoots` or add a project-level reference:
  ```ts
  /// <reference path="./types/x-tool/types.d.ts" />
  ```
- Or vendor directly from this repo as part of your build (`dist/types.d.ts`).

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
</ul>
```

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
  <component :source="src"></component>
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
  container?: string; // default: 'body'
  debug?: boolean;
  staticDirectives?: boolean;
  prefix?: string;    // default: 'x'
  delegate?: boolean; // event delegation
  sandboxExpressions?: boolean;
  allowGlobals?: string[];
});

XTool.directive(name: string, impl: { bind?, update?, unbind? }): void;
XTool.registerComponent({ name, data, methods, computed, propEffects, template, ... }): void;

// Optional: custom directive prefix (not hardcoded to "x")
XTool.init({ prefix: 'u' }); // use u-data, u-text, u-on:click, ...
```


## License

MIT
