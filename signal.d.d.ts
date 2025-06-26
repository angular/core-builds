/**
 * @license Angular v20.1.0-next.3+sha-cd30c4d
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */

import { ReactiveNode, ValueEqualityFn, SIGNAL, ReactiveHookFn } from './graph.d.js';

interface SignalNode<T> extends ReactiveNode {
    value: T;
    equal: ValueEqualityFn<T>;
}
type SignalBaseGetter<T> = (() => T) & {
    readonly [SIGNAL]: unknown;
};
type SignalSetter<T> = (newValue: T) => void;
type SignalUpdater<T> = (updateFn: (value: T) => T) => void;
interface SignalGetter<T> extends SignalBaseGetter<T> {
    readonly [SIGNAL]: SignalNode<T>;
}
/**
 * Creates a `Signal` getter, setter, and updater function.
 */
declare function createSignal<T>(initialValue: T, equal?: ValueEqualityFn<T>): [SignalGetter<T>, SignalSetter<T>, SignalUpdater<T>];
declare function setPostSignalSetFn(fn: ReactiveHookFn | null): ReactiveHookFn | null;
declare function signalGetFn<T>(node: SignalNode<T>): T;
declare function signalSetFn<T>(node: SignalNode<T>, newValue: T): void;
declare function signalUpdateFn<T>(node: SignalNode<T>, updater: (value: T) => T): void;
declare function runPostSignalSetFn<T>(node: SignalNode<T>): void;
declare const SIGNAL_NODE: SignalNode<unknown>;

export { SIGNAL_NODE, createSignal, runPostSignalSetFn, setPostSignalSetFn, signalGetFn, signalSetFn, signalUpdateFn };
export type { SignalGetter, SignalNode };
