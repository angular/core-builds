/**
 * @license Angular v16.1.0-next.0+sha-83262dc
 * (c) 2010-2022 Google LLC. https://angular.io/
 * License: MIT
 */


import { DestroyRef } from '@angular/core';
import { Injector } from '@angular/core';
import { MonoTypeOperatorFunction } from 'rxjs';
import { Observable } from 'rxjs';
import { Signal } from '@angular/core';

/**
 * Get the current value of an `Observable` as a reactive `Signal`.
 *
 * `fromObservable` returns a `Signal` which provides synchronous reactive access to values produced
 * by the given `Observable`, by subscribing to that `Observable`. The returned `Signal` will always
 * have the most recent value emitted by the subscription, and will throw an error if the
 * `Observable` errors.
 *
 * The subscription will last for the lifetime of the current injection context. That is, if
 * `fromObservable` is called from a component context, the subscription will be cleaned up when the
 * component is destroyed. When called outside of a component, the current `EnvironmentInjector`'s
 * lifetime will be used (which is typically the lifetime of the application itself).
 *
 * If the `Observable` does not produce a value before the `Signal` is read, the `Signal` will throw
 * an error. To avoid this, use a synchronous `Observable` (potentially created with the `startWith`
 * operator) or pass an initial value to `fromObservable` as the second argument.
 *
 * `fromObservable` must be called in an injection context.
 */
export declare function fromObservable<T>(source: Observable<T>): Signal<T>;

/**
 * Get the current value of an `Observable` as a reactive `Signal`.
 *
 * `fromObservable` returns a `Signal` which provides synchronous reactive access to values produced
 * by the given `Observable`, by subscribing to that `Observable`. The returned `Signal` will always
 * have the most recent value emitted by the subscription, and will throw an error if the
 * `Observable` errors.
 *
 * The subscription will last for the lifetime of the current injection context. That is, if
 * `fromObservable` is called from a component context, the subscription will be cleaned up when the
 * component is destroyed. When called outside of a component, the current `EnvironmentInjector`'s
 * lifetime will be used (which is typically the lifetime of the application itself).
 *
 * Before the `Observable` emits its first value, the `Signal` will return the configured
 * `initialValue`. If the `Observable` is known to produce a value before the `Signal` will be read,
 * `initialValue` does not need to be passed.
 *
 * `fromObservable` must be called in an injection context.
 *
 * @developerPreview
 */
export declare function fromObservable<T, U extends T | null | undefined>(source: Observable<T>, initialValue: U): Signal<T | U>;

/**
 * Exposes the value of an Angular `Signal` as an RxJS `Observable`.
 *
 * The signal's value will be propagated into the `Observable`'s subscribers using an `effect`.
 *
 * `fromSignal` must be called in an injection context.
 *
 * @developerPreview
 */
export declare function fromSignal<T>(source: Signal<T>, options?: FromSignalOptions): Observable<T>;

/**
 * Options for `fromSignal`.
 *
 * @developerPreview
 */
export declare interface FromSignalOptions {
    /**
     * The `Injector` to use when creating the effect.
     *
     * If this isn't specified, the current injection context will be used.
     */
    injector?: Injector;
}

/**
 * Operator which completes the Observable when the calling context (component, directive, service,
 * etc) is destroyed.
 *
 * @param destroyRef optionally, the `DestroyRef` representing the current context. This can be
 *     passed explicitly to use `takeUntilDestroyed` outside of an injection context. Otherwise, the
 * current `DestroyRef` is injected.
 *
 * @developerPreview
 */
export declare function takeUntilDestroyed<T>(destroyRef?: DestroyRef): MonoTypeOperatorFunction<T>;

export { }
