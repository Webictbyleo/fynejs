type AnyFn = (...args: any[]) => any;
type Dep = Set<EffectFn>;
interface EffectFn extends AnyFn {
    deps?: Dep[];
    active?: boolean;
    scheduler?: () => void;
}
declare function toRaw<T>(v: T): T;
export declare function reactive<T extends object>(target: T): T;
export declare function effect(fn: AnyFn, options?: {
    scheduler?: () => void;
}): EffectFn;
export declare function stop(effectFn: EffectFn): void;
export declare function computed<T>(getter: () => T): {
    readonly value: T;
};
interface WatchOptions {
    immediate?: boolean;
    deep?: boolean;
    flush?: 'post' | 'sync' | 'pre';
}
type WatchSource<T = any> = (() => T) | object;
export declare function watch<T>(source: WatchSource<T>, cb: (newVal: T, oldVal: T) => void, options?: WatchOptions): () => void;
export declare const reactiveUtils: {
    reactive: typeof reactive;
    effect: typeof effect;
    computed: typeof computed;
    watch: typeof watch;
    toRaw: typeof toRaw;
    stop: typeof stop;
};
export {};
//# sourceMappingURL=reactive.d.ts.map