/**
 * @license Angular v20.0.0-next.4+sha-599c45c
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */

import { R as ReactiveNode, V as ValueEqualityFn, S as SIGNAL, a as ReactiveHookFn } from './graph.d-StYigYp1.js';

interface SignalNode<T> extends ReactiveNode {
    value: T;
    equal: ValueEqualityFn<T>;
}
type SignalBaseGetter<T> = (() => T) & {
    readonly [SIGNAL]: unknown;
};
interface SignalGetter<T> extends SignalBaseGetter<T> {
    readonly [SIGNAL]: SignalNode<T>;
}
/**
 * Create a `Signal` that can be set or updated directly.
 */
declare function createSignal<T>(initialValue: T, equal?: ValueEqualityFn<T>): SignalGetter<T>;
declare function setPostSignalSetFn(fn: ReactiveHookFn | null): ReactiveHookFn | null;
declare function signalSetFn<T>(node: SignalNode<T>, newValue: T): void;
declare function signalUpdateFn<T>(node: SignalNode<T>, updater: (value: T) => T): void;
declare function runPostSignalSetFn<T>(node: SignalNode<T>): void;
declare const SIGNAL_NODE: SignalNode<unknown>;

export { SIGNAL_NODE as a, createSignal as c, signalSetFn as d, signalUpdateFn as e, runPostSignalSetFn as r, setPostSignalSetFn as s };
export type { SignalNode as S, SignalGetter as b };
