// FyneJS - TypeScript Definitions
// Lightweight reactive framework for building dynamic web applications

export interface XToolConfig {
    /** Container selector for auto-discovery (default: 'body') */
    container?: string;
    /** Enable debug logging (default: false) */
    debug?: boolean;
    /** Enable static directive optimization (default: true) */
    staticDirectives?: boolean;
    /** Directive prefix (default: 'x') */
    prefix?: string;
    /** Enable event delegation for better performance (default: false) */
    delegate?: boolean;
    /** Restrict globals in expressions (default: false) */
    sandboxExpressions?: boolean;
    /** Whitelist of globals when sandboxExpressions is true */
    allowGlobals?: string[];
    /** Auto-merge x-prop values into component data (default: false). When false, props are only accessible via $props and propEffects */
    autoMergeProps?: boolean;
    /** When true, inline x-data components inherit parent x-data scope (default: false). Does not apply to named/registered components. */
    inheritScope?: boolean;
    /** Router for SPA */
    router?: {
        /** Enable SPA routing (default: false) */
        enabled: boolean;
        /**
         * View transition name (for CSS transitions)
         */
        transitionName?: string;
        /** Before navigation hook */
        before?: (to: string, from: string, info: {source: 'link' | 'popstate' | 'program'}) => boolean | Promise<boolean>;
        /** After navigation hook */
        after?: (to: string, from: string, info: {source: 'link' | 'popstate' | 'program'}) => void;
        /** Navigation error handler */
        error?: (error:unknown,to: string,from:string) => void;
        /** Enable prefetching on link hover (default: false) */
        prefetchOnHover?: boolean;
    }
}

export interface CustomDirective<T = unknown> {
    /**
     * Called once when directive is first bound
     * @param element The DOM element
     * @param value Current evaluated expression result
     * @param expression The raw expression string
     * @param component Component reference
     * @param modifiers Parsed modifiers object
     * @param evaluator Function to re-evaluate expression
     */
    bind?: (element: Element, value: T, expression: string, component: ComponentReference, modifiers?: Record<string, any>, evaluator?: () => any) => void;

    /**
     * Called whenever reactive dependencies change
     * @param element The DOM element
     * @param value Current evaluated expression result
     * @param expression The raw expression string
     * @param component Component reference
     * @param modifiers Parsed modifiers object
     * @param evaluator Function to re-evaluate expression
     */
    update?: (element: Element, value: T, expression: string, component: ComponentReference, modifiers?: Record<string, any>, evaluator?: () => any) => void;

    /**
     * Called when directive is removed (cleanup)
     * @param element The DOM element
     * @param component Component reference
     */
    unbind?: (element: Element, component: ComponentReference) => void;
}

export interface DirectiveInfo {
    type: string;
    property?: string;
    expression?: string;
    update?: () => void;
    originalDisplay?: string;
    customDirective?: CustomDirective;
    _static?: boolean;
}

/**
 * Component context available in methods, computed properties, and expressions
 */
// Ref value types - can be DOM elements or component context proxies (for x-ref on components)
// Using 'any' to allow property access on refs without TS errors since type can't be inferred at accessor point
export type RefValue = any;
export type RefReturn<T = RefValue> = T | T[] | undefined;
export interface RefAccessor {
    <T = RefValue>(name: string): RefReturn<T>;
    <T = RefValue>(name: string, value: T): void;
}

export type ComponentContext<
    TData = Record<string, any>,
    TMethods = Record<string, any>,
    TComputedVals = Record<string, any>
> = TData & TMethods & TComputedVals & {
    /** Special properties */
    /** Component's root element */
    readonly $el: HTMLElement | null;
    /** Component's unique ID */
    readonly $id: string;
    /** Whether component is mounted */
    readonly $isMounted: boolean;
    /** Whether component is destroyed */
    readonly $isDestroyed: boolean;
    /** Whether component blocks renders/effects/globals */
    readonly $isSealed: boolean;
    /** Whether component is fully read-only */
    readonly $isFrozen: boolean;
    /** Parent component reference */
    readonly $parent: ComponentReference | null;
    /** Child components */
    readonly $children: readonly ComponentReference[];
    /** Access or register a ref. Getter: $ref('name') -> element | array | undefined. Setter: $ref('name', value). */
    $ref: RefAccessor;
    /** Proxy for direct ref access: $refs.myRef -> element | array | undefined */
    $refs: { [name: string]: RefReturn };

    /** Utility methods */
    /** Destroy the component */
    $destroy(): void;
    /** Force a re-render */
    $forceUpdate(): void;
    /** Add a cleanup function */
    $addCleanupFunction(fn: () => void): void;
    /** Schedule callback for next DOM update cycle */
    $nextTick(callback?: () => void): Promise<void> | void;
    /** Escape hatch to intentionally mutate reactive data */
    $mutate<T>(fn: () => T): T;
    /** Toggle sealed mode (no renders/effects/globals). Components cannot freeze themselves. */
    $seal(on?: boolean): void;
    /** Debug logging */
    $log(...args: any[]): void;

    /**
     * Set attributes on the target element ($target).
     * Only available in expression contexts where $target is defined (e.g., event handlers).
     * 
     * Supports glob expansion with `[key1,key2]` syntax in attribute names:
     * - If value is an object, uses `value[key]` for each expanded key
     * - If value is not an object, uses the literal value for all expanded attributes
     * 
     * @example
     * // Single attribute
     * $attr('disabled', true)     // Sets disabled=""
     * $attr('data-id', '123')     // Sets data-id="123"
     * $attr('hidden', false)      // Removes hidden attribute
     * 
     * @example
     * // Glob expansion with object value
     * $attr('data-offset-[top,left]', { top: 10, left: 20 })
     * // Result: data-offset-top="10", data-offset-left="20"
     * 
     * @example
     * // Glob expansion with literal value
     * $attr('data-[foo,bar]', 'value')
     * // Result: data-foo="value", data-bar="value"
     * 
     * @example
     * // Object form (multiple attributes)
     * $attr({ disabled: true, 'data-active': isActive, hidden: null })
     * 
     * @param name Attribute name (supports glob pattern like 'prefix-[a,b,c]-suffix')
     * @param value Attribute value (null/undefined/false removes, true sets empty string)
     */
    $attr(name: string, value: any): void;
    /**
     * Set multiple attributes on the target element ($target).
     * Attribute names support glob expansion with `[key1,key2]` syntax.
     * @param attributes Object with attribute names as keys
     */
    $attr(attributes: Record<string, any>): void;

    /**
     * Set CSS properties on the target element ($target).
     * Only available in expression contexts where $target is defined (e.g., event handlers).
     * Uses style.setProperty/removeProperty for proper CSS custom property support.
     * 
     * Supports glob expansion with `[key1,key2]` syntax in property names.
     * 
     * @example
     * // Single property
     * $css('color', 'red')
     * $css('--my-var', '10px')
     * $css('display', null)       // Removes the property
     * 
     * @example
     * // Glob expansion with object value
     * $css('[width,height]', { width: '100px', height: '200px' })
     * 
     * @example
     * // Glob expansion with literal value
     * $css('[margin,padding]', '10px')
     * // Result: margin: 10px; padding: 10px;
     * 
     * @example
     * // Object form (multiple properties)
     * $css({ color: 'red', 'font-size': '14px', '--theme-color': 'blue' })
     * 
     * @param name CSS property name (supports glob pattern like '[width,height]')
     * @param value CSS value (null/undefined/false removes the property)
     */
    $css(name: string, value: any): void;
    /**
     * Set multiple CSS properties on the target element ($target).
     * Property names support glob expansion with `[key1,key2]` syntax.
     * @param properties Object with CSS property names as keys
     */
    $css(properties: Record<string, any>): void;

    /**
     * Signals API available on the component context.
     *
     * Signals are lightweight, component-scoped broadcasts that can carry a payload.
     * Emissions start at the current component and bubble up through ancestor components
     * (similar to how `$refs` are visible up the tree). Any ancestor that previously
     * connected a handler for the signal name will receive the event. Bubbling can be
     * stopped by calling `evt.stopPropagation()` inside a handler.
     *
     * Typical usage patterns:
     * - Connect just-in-time inside a method before firing, then disconnect afterward.
     * - Connect in lifecycle or init code to listen continuously.
     * - Handlers receive `{ name, payload, stopPropagation }` and run with the component
     *   method context, so `this` provides access to data, computed, and methods.
     */
    Signals: {
        /**
         * Emit a signal from the current component.
         * The event will invoke handlers on this component and bubble to ancestors
         * until a handler calls `evt.stopPropagation()`.
         * @param name Signal name (case-sensitive)
         * @param payload Optional payload to pass to handlers
         */
        emit(name: string, payload?: any): void;
        /**
         * Register a handler for a signal on the current component.
         * The handler will be invoked on emissions from this component or any descendant
         * that bubbles up.
         * @param name Signal name to listen for
         * @param handler Callback receiving `{ name, payload, stopPropagation }`.
         *                Runs with the component method context as `this`.
         */
        connect(name: string, handler: (evt: { name: string; payload: any; stopPropagation: () => void }) => void): void;
        /**
         * Unregister a previously connected handler for a signal on the current component.
         * @param name Signal name
         * @param handler The same handler function that was passed to `connect`
         */
        disconnect(name: string, handler: (evt: { name: string; payload: any; stopPropagation: () => void }) => void): void;
    };
};

/**
 * Base component definition with proper typing
 */
type MethodMap = Record<string, (...args: any[]) => any>;
type ComputedMap = Record<string, () => any>;
type PropEffectsMap<TCtx> = Record<string, (this: TCtx, newValue: any, oldValue: any) => void>;

// Helper to derive the computed value shape from getters
type ComputedValues<TComp extends Record<string, (...args: any) => any>> = {
    [K in keyof TComp]: TComp[K] extends (...a: any) => infer R ? R : never
};



// Deep readonly helper to prevent mutations inside computed getters
type DeepReadonly<T> = T extends (...args: any[]) => any
    ? T
    : T extends Array<infer U>
        ? ReadonlyArray<DeepReadonly<U>>
        : T extends object
            ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
            : T;

// Convenience helper for a fully-augmented context (data + methods + computed values)
type FullContext<TData, TMethods, TComputedVals> = ComponentContext<TData, TMethods, TComputedVals> & TMethods & TComputedVals;


export interface ComponentDefinition<
    TData extends Record<string, any> = Record<string, any>,
    TMethods extends MethodMap = {},
    TComputed extends ComputedMap = {}
> {
    /** Reactive data object */
    data?: TData;
    /** Component methods with proper context */
    // Methods should see data, other methods, and computed values.
    // Keep raw shape for inference; rely on ThisType for contextual access.
    methods?: TMethods & ThisType<FullContext<TData, TMethods, ComputedValues<TComputed>>>;
    /** Computed properties */
    // In computed getters, expose data as DeepReadonly to forbid mutations and allow cross-usage of methods & other computed values.
    computed?: TComputed & ThisType<FullContext<DeepReadonly<TData>, TMethods, ComputedValues<TComputed>>>;
    /** Prop change handlers */
    // Prop effects should have full access to methods and computed values with proper inference
    propEffects?: PropEffectsMap<FullContext<TData, TMethods, ComputedValues<TComputed>>> & ThisType<FullContext<TData, TMethods, ComputedValues<TComputed>>>;
    /** Module-level closure variables to inject into context (e.g., { rangeManager, someHelper }) */
    closures?: Record<string, unknown>;
    /** Lifecycle hooks */
    mounted?: (this: FullContext<TData, TMethods, ComputedValues<TComputed>>) => void;
    unmounted?: (this: FullContext<TData, TMethods, ComputedValues<TComputed>>) => void;
    beforeMount?: (this: FullContext<TData, TMethods, ComputedValues<TComputed>>) => void;
    beforeUnmount?: (this: FullContext<TData, TMethods, ComputedValues<TComputed>>) => void;
    updated?: (this: FullContext<TData, TMethods, ComputedValues<TComputed>>) => void;
    destroyed?: (this: FullContext<TData, TMethods, ComputedValues<TComputed>>) => void;
    beforeDestroy?: (this: FullContext<TData, TMethods, ComputedValues<TComputed>>) => void;
    /** Template for reusable components */
    template?: string | Promise<string> | (() => string | Promise<string>);
    /** Component name (for registration) */
    name?: string;
}

/**
 * Registered component definition with proper type inference.
 * 
 * ORDER MATTERS for TypeScript inference:
 * 1. name, data, makeData
 * 2. methods  
 * 3. computed
 * 4. propEffects, lifecycle hooks
 * 
 * When properties are in the correct order, TypeScript provides full IntelliSense
 * and type checking. Different orders may result in typing fallbacks.
 */
export interface RegisteredComponentDefinition<
    TData extends Record<string, any> = {},
    TFactoryData extends Record<string, any> = {},
    TMethods extends MethodMap = {},
    TComputed extends ComputedMap = {}
> {
    /** Required component name */
    name: string;
    /** Static reactive data */
    data?: TData;
    /** Factory function for dynamic data (merged with static data) */
    makeData?: (props: Record<string, any>) => TFactoryData;
    /** Component methods with proper context */
    methods?: TMethods & ThisType<FullContext<TData & TFactoryData, TMethods, ComputedValues<TComputed>>>;
    /** Computed properties */
    computed?: TComputed & ThisType<FullContext<DeepReadonly<TData & TFactoryData>, TMethods, ComputedValues<TComputed>>>;
    /** Prop change handlers */
    propEffects?: PropEffectsMap<FullContext<TData & TFactoryData, TMethods, ComputedValues<TComputed>>> & ThisType<FullContext<TData & TFactoryData, TMethods, ComputedValues<TComputed>>>;
    /** Module-level closure variables to inject into context (e.g., { rangeManager, someHelper }) */
    closures?: Record<string, unknown>;
    /** Lifecycle hooks */
    mounted?: (this: FullContext<TData & TFactoryData, TMethods, ComputedValues<TComputed>>) => void;
    unmounted?: (this: FullContext<TData & TFactoryData, TMethods, ComputedValues<TComputed>>) => void;
    beforeMount?: (this: FullContext<TData & TFactoryData, TMethods, ComputedValues<TComputed>>) => void;
    beforeUnmount?: (this: FullContext<TData & TFactoryData, TMethods, ComputedValues<TComputed>>) => void;
    updated?: (this: FullContext<TData & TFactoryData, TMethods, ComputedValues<TComputed>>) => void;
    destroyed?: (this: FullContext<TData & TFactoryData, TMethods, ComputedValues<TComputed>>) => void;
    beforeDestroy?: (this: FullContext<TData & TFactoryData, TMethods, ComputedValues<TComputed>>) => void;
    /** Template for reusable components */
    template?: string | Promise<string> | (() => string | Promise<string>);
    /** Instance augmentation function (may further extend data/computed/methods) */
    init?: (props: Record<string, any>) => Partial<{
        data: TData;
        methods: TMethods;
        computed: TComputed;
        propEffects: PropEffectsMap<FullContext<TData & TFactoryData, TMethods, ComputedValues<TComputed>>>;
        mounted: (this: FullContext<TData & TFactoryData, TMethods, ComputedValues<TComputed>>) => void;
        unmounted: (this: FullContext<TData & TFactoryData, TMethods, ComputedValues<TComputed>>) => void;
        beforeMount: (this: FullContext<TData & TFactoryData, TMethods, ComputedValues<TComputed>>) => void;
        beforeUnmount: (this: FullContext<TData & TFactoryData, TMethods, ComputedValues<TComputed>>) => void;
        updated: (this: FullContext<TData & TFactoryData, TMethods, ComputedValues<TComputed>>) => void;
        destroyed: (this: FullContext<TData & TFactoryData, TMethods, ComputedValues<TComputed>>) => void;
        beforeDestroy: (this: FullContext<TData & TFactoryData, TMethods, ComputedValues<TComputed>>) => void;
    }> | void;
}

export interface EventHandlerInfo {
    element: EventTarget;
    event: string;
    handler: EventListener;
    options?: boolean | AddEventListenerOptions;
}

export interface ComponentReference<
    TData = Record<string, any>,
    TMethods = Record<string, any>,
    TComputedVals = Record<string, any>
> {
    readonly id: string;
    element: HTMLElement | null;
    readonly isBound: boolean;
    readonly isMounted: boolean;
    readonly isDestroyed: boolean;
    /** Get the component's reactive context */
    getContext(includeComputed?: boolean): ComponentContext<TData, TMethods, TComputedVals>;
    destroy(): void;
}

export interface XToolFramework {
    /**
     * Initialize the framework
     * @param config Configuration options
     */
    init(config?: XToolConfig): XToolFramework;

    /**
     * Register a custom directive
     * @param name Directive name (without prefix)
     * @param directive Directive definition
     */
    directive<T = unknown>(name: string, directive: CustomDirective<T>): XToolFramework;

    /**
     * Register a reusable component with proper type inference.
     * Uses RegisteredComponentDefinition interface for type safety.
     */
    registerComponent<
        TData extends Record<string, any> = {},
        TFactoryData extends Record<string, any> = {},
        TMethods extends MethodMap = {},
        TComputed extends ComputedMap = {}
    >(definition: RegisteredComponentDefinition<TData, TFactoryData, TMethods, TComputed> & ThisType<FullContext<TData & TFactoryData, TMethods, ComputedValues<TComputed>>>): XToolFramework;


    /**
     * Load and evaluate external component definition files.
     * Modes:
     *  - 'preload': fetch & eval immediately (default for plain string paths)
     *  - 'defer': fetch before automatic component discovery (blocks initial scan until resolved)
     *  - 'lazy': register path only; fetch occurs on first <component source="name"> usage. If such a tag already exists when registering, an idle load is scheduled.
     * Each source entry can provide an explicit name; otherwise the filename (without extension) is used.
     * Returns counts for settled (preload + defer) and failed immediate loads. Lazy registrations are not counted until triggered.
     */
    loadComponents(sources: Array<string | { path: string; mode?: 'preload' | 'defer' | 'lazy'; name?: string }>): Promise<{ settled: number; failed: number }>;
}

// Global declarations for browser usage
declare global {
    interface Window {
        XTool: XToolFramework;
        FyneJS: XToolFramework;
    }
}

// Module-style exports for bundlers (ESM/CJS)
declare const XTool: XToolFramework;
declare const FyneJS: XToolFramework;
export type HtmlTag = (strings: TemplateStringsArray, ...values: any[]) => string;
declare const html: HtmlTag;
export default XTool;
export { XTool, FyneJS, html };