# FyneJS

Browser-ready distribution of the X-Tool framework with a simple docs site. This repo only contains:

- `dist/` – the standalone browser build(s) + type declarations
- `docs/` – examples you can host via GitHub Pages (enable Pages: branch `main`, folder `/docs`)

If you want full source, tests, and development tooling, see the main X-Tool repo.

## What is X-Tool?

X-Tool is a tiny reactive DOM framework in the spirit of Alpine.js/Vue’s template syntax. It gives you:

- Declarative directives: `x-text`, `x-html`, `x-show`, `x-if` (+ `x-else[-if]`), `x-for`, `x-model`, `x-on:*`, `x-bind:*`, `x-style`, `x-transition`
- Components with props and slots via `<component source="name" x-prop="{...}">`
- Computed values, effects, and a robust cleanup model
- Auto-discovery with `x-data` (no explicit mount required)

New in this distribution
- `$nextTick()` utility for post-render work
- `x-transition` directive (CSS class-based enter/leave transitions)
- Fine-grained computed invalidation (fewer unnecessary recomputes)
- Event delegation option (`init({ delegate: true })`)
- Configurable expression sandbox (`init({ sandboxExpressions, allowGlobals })`)
- Async component templates (string, Promise<string>, or () => Promise<string>)

## Quick start (CDN)

Include the minified build from jsDelivr (GitHub CDN):

```html
<script src="https://cdn.jsdelivr.net/gh/Webictbyleo/fynejs@main/dist/x-tool.min.js"></script>
<script>
  XTool.init({ debug: false });
</script>

<div x-data="{ count: 0 }">
  <button x-on:click="count++">+1</button>
  <span x-text="count"></span>
</div>
```

Or pin to a commit SHA/tag:

```html
<script src="https://cdn.jsdelivr.net/gh/Webictbyleo/fynejs@<tag-or-sha>/dist/x-tool.min.js"></script>
```

## TypeScript usage

This repo ships `dist/types.d.ts` so your editor can get type information even if you load the runtime from a CDN. Use one of the options:

- Copy the file locally and reference it via `tsconfig.json` `typeRoots` or add a project-level reference:
  ```ts
  /// <reference path="./types/x-tool/types.d.ts" />
  ```
- Or vendor it directly from this repo into your project (e.g., as part of your build); path: `dist/types.d.ts`.

Note: If you prefer to import via a bundler, use X-Tool’s npm package from the main repo (includes proper `types` field). This repo is CDN-first.

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

### Transitions (x-transition)

Attach once on the element to define class names; defaults are provided.

```html
<style>
/* example classes */
.fade-enter { transition: opacity .15s ease; }
.fade-enter-from { opacity: 0 }
.fade-enter-to   { opacity: 1 }
.fade-leave { transition: opacity .15s ease; }
.fade-leave-from { opacity: 1 }
.fade-leave-to   { opacity: 0 }
</style>

<div x-data="{ open: false }">
  <button x-on:click="open = !open">Toggle</button>
  <div x-transition="{ enter: 'fade-enter', enterFrom: 'fade-enter-from', enterTo: 'fade-enter-to', leave: 'fade-leave', leaveFrom: 'fade-leave-from', leaveTo: 'fade-leave-to' }" x-show="open">
    I fade in/out
  </div>
</div>
```

Works with `x-show` and `x-if`.

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

## API surface (global)

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
```

## Using the docs

Open `docs/index.html` directly, or enable GitHub Pages in this repo:
- Settings → Pages → Build and deployment → Source: `Deploy from a branch` → Branch: `main` → Folder: `/docs`
- Your site will be served at: `https://<your-username>.github.io/fynejs/`

## Contributing

Issues and improvements are welcome in the main X-Tool repository. This repo intentionally stays minimal (built artifacts + docs).

## License

MIT
