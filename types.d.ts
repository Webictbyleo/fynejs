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
};

/**
 * Base component definition with proper typing
 */
type MethodMap = Record<string, (...args: any[]) => any>;
type ComputedMap = Record<string, () => any>;
type PropEffectsMap<TCtx> = Record<string, (this: TCtx, newValue: unknown, oldValue: unknown) => void>;

// Helper to derive the computed value shape from getters
type ComputedValues<TComp extends Record<string, (...args: any) => any>> = {
    [K in keyof TComp]: TComp[K] extends (...a: any) => infer R ? R : never
};

// Inject a concrete `this` into user-declared method/computed signatures
type WithThisForMethods<TCtx, TMethods> = {
    [K in keyof TMethods]: TMethods[K] extends (...a: infer A) => infer R
        ? (this: TCtx, ...a: A) => R
        : never;
};

type BindComputed<TCtx, TComputed> = {
    [K in keyof TComputed]: TComputed[K] extends (...a: any) => infer R ? (this: TCtx) => R : never
};

// Deep readonly helper to prevent mutations inside computed getters
type DeepReadonly<T> = T extends (...args: any[]) => any
    ? T
    : T extends Array<infer U>
        ? ReadonlyArray<DeepReadonly<U>>
        : T extends object
            ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
            : T;

export interface ComponentDefinition<
    TData extends Record<string, any> = Record<string, any>,
    TMethods extends MethodMap = {},
    TComputed extends ComputedMap = {}
> {
    /** Reactive data object */
    data?: TData;
    /** Component methods with proper context */
    methods?: WithThisForMethods<ComponentContext<TData, TMethods, ComputedValues<TComputed>> & TMethods & ComputedValues<TComputed>, TMethods>;
    /** Computed properties */
    // In computed getters, expose data as DeepReadonly to forbid mutations
    computed?: BindComputed<ComponentContext<DeepReadonly<TData>, TMethods, ComputedValues<TComputed>> & TMethods & ComputedValues<TComputed>, TComputed>;
    /** Prop change handlers */
    propEffects?: PropEffectsMap<ComponentContext<TData, TMethods> & TMethods & ComputedValues<TComputed>>;
    /** Lifecycle hooks */
    mounted?: (this: ComponentContext<TData, TMethods> & TMethods & ComputedValues<TComputed>) => void;
    unmounted?: (this: ComponentContext<TData, TMethods> & TMethods & ComputedValues<TComputed>) => void;
    beforeMount?: (this: ComponentContext<TData, TMethods> & TMethods & ComputedValues<TComputed>) => void;
    beforeUnmount?: (this: ComponentContext<TData, TMethods> & TMethods & ComputedValues<TComputed>) => void;
    updated?: (this: ComponentContext<TData, TMethods> & TMethods & ComputedValues<TComputed>) => void;
    destroyed?: (this: ComponentContext<TData, TMethods> & TMethods & ComputedValues<TComputed>) => void;
    beforeDestroy?: (this: ComponentContext<TData, TMethods> & TMethods & ComputedValues<TComputed>) => void;
    /** Template for reusable components */
    template?: string | Promise<string> | (() => string | Promise<string>);
    /** Component name (for registration) */
    name?: string;
}

export interface RegisteredComponentDefinition<
    TData extends Record<string, any> = Record<string, any>,
    TMethods extends MethodMap = {},
    TComputed extends ComputedMap = {}
> extends ComponentDefinition<TData, TMethods, TComputed> {
    /** Required component name */
    name: string;
    /** Base data factory */
    makeData?: (props: Record<string, string>) => Record<string, unknown>;
    /** Instance augmentation function */
    init?: (props: Record<string, any>) => ComponentDefinition<TData, TMethods, TComputed> | void;
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
     * Register a reusable component
     * @param definition Component definition
     */
    registerComponent<
        TData extends Record<string, any> = Record<string, any>,
        TMethods extends MethodMap = {},
        TComputed extends ComputedMap = {}
    >(definition: RegisteredComponentDefinition<TData, TMethods, TComputed>): XToolFramework;

}

// Global declarations for browser usage
declare global {
    interface Window {
        XTool: XToolFramework;
        FyneJS: XToolFramework;
    }
}

export {};