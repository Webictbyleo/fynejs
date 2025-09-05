// Type definitions for x-tool browser build
// Generated manually to expose public API and globals

export interface XToolConfig {
  container?: string;
  debug?: boolean;
  staticDirectives?: boolean;
  prefix?: string;
  delegate?: boolean;
  sandboxExpressions?: boolean;
  allowGlobals?: string[];
}

export type DirectiveHook<T = unknown> = (
  element: Element,
  value: T,
  expression: string,
  component: ComponentReference,
  modifiers?: Record<string, any>,
  evaluator?: () => any
) => void;

export interface CustomDirective<T = unknown> {
  bind?: DirectiveHook<T>;
  update?: DirectiveHook<T>;
  unbind?: (element: Element, component: ComponentReference) => void;
}

export interface ComponentDefinition {
  name?: string;
  data?: Record<string, unknown>;
  methods?: Record<string, (...args: unknown[]) => unknown>;
  computed?: Record<string, () => any>;
  propEffects?: Record<string, (newValue: unknown, oldValue: unknown) => void>;
  mounted?: () => void;
  unmounted?: () => void;
  beforeMount?: () => void;
  beforeUnmount?: () => void;
  updated?: () => void;
  destroyed?: () => void;
  beforeDestroy?: () => void;
  template?: string | Promise<string> | (() => string | Promise<string>);
}

export interface RegisteredComponentDefinition extends ComponentDefinition {
  name: string;
  data?: Record<string, unknown>;
  makeData?: (props: Record<string, string>) => Record<string, unknown>;
  init?: (props: Record<string, any>) => ComponentDefinition | void;
}

export interface ComponentReference {
  readonly id: string;
  element: HTMLElement | null;
  readonly isBound: boolean;
  readonly isMounted: boolean;
  readonly isDestroyed: boolean;
  destroy(): void;
}

export interface XToolAPI {
  init(config?: XToolConfig): XToolAPI;
  directive(name: string, directive: CustomDirective): XToolAPI;
  registerComponent(def: RegisteredComponentDefinition): XToolAPI;
}

declare global {
  interface Window {
    XTool: XToolAPI;
  }
}

export {};