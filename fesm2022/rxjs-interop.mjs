/**
 * @license Angular v16.1.0-next.0+sha-b98ecbc
 * (c) 2010-2022 Google LLC. https://angular.io/
 * License: MIT
 */

import { assertInInjectionContext, signal, inject, DestroyRef, computed, Injector, effect } from '@angular/core';
import { Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

function fromObservable(source, initialValue) {
    assertInInjectionContext(fromObservable);
    // Note: T is the Observable value type, and U is the initial value type. They don't have to be
    // the same - the returned signal gives values of type `T`.
    let state;
    if (initialValue === undefined && arguments.length !== 2) {
        // No initial value was passed, so initially the signal is in a `NoValue` state and will throw
        // if accessed.
        state = signal({ kind: 0 /* StateKind.NoValue */ });
    }
    else {
        // An initial value was passed, so use it.
        state = signal({ kind: 1 /* StateKind.Value */, value: initialValue });
    }
    const sub = source.subscribe({
        next: value => state.set({ kind: 1 /* StateKind.Value */, value }),
        error: error => state.set({ kind: 2 /* StateKind.Error */, error }),
        // Completion of the Observable is meaningless to the signal. Signals don't have a concept of
        // "complete".
    });
    // Unsubscribe when the current context is destroyed.
    inject(DestroyRef).onDestroy(sub.unsubscribe.bind(sub));
    // The actual returned signal is a `computed` of the `State` signal, which maps the various states
    // to either values or errors.
    return computed(() => {
        const current = state();
        switch (current.kind) {
            case 1 /* StateKind.Value */:
                return current.value;
            case 2 /* StateKind.Error */:
                throw current.error;
            case 0 /* StateKind.NoValue */:
                // TODO(alxhub): use a RuntimeError when we finalize the error semantics
                throw new Error(`fromObservable() signal read before the Observable emitted`);
        }
    });
}

/**
 * Exposes the value of an Angular `Signal` as an RxJS `Observable`.
 *
 * The signal's value will be propagated into the `Observable`'s subscribers using an `effect`.
 *
 * `fromSignal` must be called in an injection context.
 *
 * @developerPreview
 */
function fromSignal(source, options) {
    !options?.injector && assertInInjectionContext(fromSignal);
    const injector = options?.injector ?? inject(Injector);
    // Creating a new `Observable` allows the creation of the effect to be lazy. This allows for all
    // references to `source` to be dropped if the `Observable` is fully unsubscribed and thrown away.
    return new Observable(observer => {
        const watcher = effect(() => {
            try {
                observer.next(source());
            }
            catch (err) {
                observer.error(err);
            }
        }, { injector, manualCleanup: true });
        return () => watcher.destroy();
    });
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
function takeUntilDestroyed(destroyRef) {
    if (!destroyRef) {
        assertInInjectionContext(takeUntilDestroyed);
        destroyRef = inject(DestroyRef);
    }
    const destroyed$ = new Observable(observer => {
        destroyRef.onDestroy(observer.next.bind(observer));
    });
    return (source) => {
        return source.pipe(takeUntil(destroyed$));
    };
}

/**
 * Generated bundle index. Do not edit.
 */

export { fromObservable, fromSignal, takeUntilDestroyed };
//# sourceMappingURL=rxjs-interop.mjs.map
