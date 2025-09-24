/**
 * @license Angular v20.3.1+sha-301155b
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */

import { Observable, ReplaySubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { assertInInjectionContext, inject, DestroyRef, RuntimeError, Injector, assertNotInReactiveContext, signal, PendingTasks } from './root_effect_scheduler.mjs';
import { getOutputDestroyRef, effect, untracked, computed, resource, encapsulateResourceError } from './resource.mjs';
import './not_found.mjs';
import './signal.mjs';
import '@angular/core/primitives/signals';
import '@angular/core/primitives/di';
import './effect.mjs';

/**
 * Operator which completes the Observable when the calling context (component, directive, service,
 * etc) is destroyed.
 *
 * @param destroyRef optionally, the `DestroyRef` representing the current context. This can be
 *     passed explicitly to use `takeUntilDestroyed` outside of an [injection
 * context](guide/di/dependency-injection-context). Otherwise, the current `DestroyRef` is injected.
 *
 * @publicApi 19.0
 */
function takeUntilDestroyed(destroyRef) {
    if (!destroyRef) {
        ngDevMode && assertInInjectionContext(takeUntilDestroyed);
        destroyRef = inject(DestroyRef);
    }
    const destroyed$ = new Observable((subscriber) => {
        if (destroyRef.destroyed) {
            subscriber.next();
            return;
        }
        const unregisterFn = destroyRef.onDestroy(subscriber.next.bind(subscriber));
        return unregisterFn;
    });
    return (source) => {
        return source.pipe(takeUntil(destroyed$));
    };
}

/**
 * Implementation of `OutputRef` that emits values from
 * an RxJS observable source.
 *
 * @internal
 */
class OutputFromObservableRef {
    source;
    destroyed = false;
    destroyRef = inject(DestroyRef);
    constructor(source) {
        this.source = source;
        this.destroyRef.onDestroy(() => {
            this.destroyed = true;
        });
    }
    subscribe(callbackFn) {
        if (this.destroyed) {
            throw new RuntimeError(953 /* ɵRuntimeErrorCode.OUTPUT_REF_DESTROYED */, ngDevMode &&
                'Unexpected subscription to destroyed `OutputRef`. ' +
                    'The owning directive/component is destroyed.');
        }
        // Stop yielding more values when the directive/component is already destroyed.
        const subscription = this.source.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (value) => callbackFn(value),
        });
        return {
            unsubscribe: () => subscription.unsubscribe(),
        };
    }
}
/**
 * Declares an Angular output that is using an RxJS observable as a source
 * for events dispatched to parent subscribers.
 *
 * The behavior for an observable as source is defined as followed:
 *    1. New values are forwarded to the Angular output (next notifications).
 *    2. Errors notifications are not handled by Angular. You need to handle these manually.
 *       For example by using `catchError`.
 *    3. Completion notifications stop the output from emitting new values.
 *
 * @usageNotes
 * Initialize an output in your directive by declaring a
 * class field and initializing it with the `outputFromObservable()` function.
 *
 * ```ts
 * @Directive({..})
 * export class MyDir {
 *   nameChange$ = <some-observable>;
 *   nameChange = outputFromObservable(this.nameChange$);
 * }
 * ```
 *
 * @publicApi 19.0
 */
function outputFromObservable(observable, opts) {
    ngDevMode && assertInInjectionContext(outputFromObservable);
    return new OutputFromObservableRef(observable);
}

/**
 * Converts an Angular output declared via `output()` or `outputFromObservable()`
 * to an observable.
 * It creates an observable that represents the stream of "events firing" in an output.
 *
 * You can subscribe to the output via `Observable.subscribe` then.
 *
 * @publicApi 19.0
 */
function outputToObservable(ref) {
    const destroyRef = getOutputDestroyRef(ref);
    return new Observable((observer) => {
        // Complete the observable upon directive/component destroy.
        // Note: May be `undefined` if an `EventEmitter` is declared outside
        // of an injection context.
        const unregisterOnDestroy = destroyRef?.onDestroy(() => observer.complete());
        const subscription = ref.subscribe((v) => observer.next(v));
        return () => {
            subscription.unsubscribe();
            unregisterOnDestroy?.();
        };
    });
}

/**
 * Exposes the value of an Angular `Signal` as an RxJS `Observable`.
 * As it reflects a state, the observable will always emit the latest value upon subscription.
 *
 * The signal's value will be propagated into the `Observable`'s subscribers using an `effect`.
 *
 * `toObservable` must be called in an injection context unless an injector is provided via options.
 *
 * @publicApi 20.0
 */
function toObservable(source, options) {
    if (ngDevMode && !options?.injector) {
        assertInInjectionContext(toObservable);
    }
    const injector = options?.injector ?? inject(Injector);
    const subject = new ReplaySubject(1);
    const watcher = effect(() => {
        let value;
        try {
            value = source();
        }
        catch (err) {
            untracked(() => subject.error(err));
            return;
        }
        untracked(() => subject.next(value));
    }, { injector, manualCleanup: true });
    injector.get(DestroyRef).onDestroy(() => {
        watcher.destroy();
        subject.complete();
    });
    return subject.asObservable();
}

/**
 * Get the current value of an `Observable` as a reactive `Signal`.
 *
 * `toSignal` returns a `Signal` which provides synchronous reactive access to values produced
 * by the given `Observable`, by subscribing to that `Observable`. The returned `Signal` will always
 * have the most recent value emitted by the subscription, and will throw an error if the
 * `Observable` errors.
 *
 * With `requireSync` set to `true`, `toSignal` will assert that the `Observable` produces a value
 * immediately upon subscription. No `initialValue` is needed in this case, and the returned signal
 * does not include an `undefined` type.
 *
 * By default, the subscription will be automatically cleaned up when the current [injection
 * context](guide/di/dependency-injection-context) is destroyed. For example, when `toSignal` is
 * called during the construction of a component, the subscription will be cleaned up when the
 * component is destroyed. If an injection context is not available, an explicit `Injector` can be
 * passed instead.
 *
 * If the subscription should persist until the `Observable` itself completes, the `manualCleanup`
 * option can be specified instead, which disables the automatic subscription teardown. No injection
 * context is needed in this configuration as well.
 */
function toSignal(source, options) {
    typeof ngDevMode !== 'undefined' &&
        ngDevMode &&
        assertNotInReactiveContext(toSignal, 'Invoking `toSignal` causes new subscriptions every time. ' +
            'Consider moving `toSignal` outside of the reactive context and read the signal value where needed.');
    const requiresCleanup = !options?.manualCleanup;
    if (ngDevMode && requiresCleanup && !options?.injector) {
        assertInInjectionContext(toSignal);
    }
    const cleanupRef = requiresCleanup
        ? (options?.injector?.get(DestroyRef) ?? inject(DestroyRef))
        : null;
    const equal = makeToSignalEqual(options?.equal);
    // Note: T is the Observable value type, and U is the initial value type. They don't have to be
    // the same - the returned signal gives values of type `T`.
    let state;
    if (options?.requireSync) {
        // Initially the signal is in a `NoValue` state.
        state = signal({ kind: 0 /* StateKind.NoValue */ }, { equal });
    }
    else {
        // If an initial value was passed, use it. Otherwise, use `undefined` as the initial value.
        state = signal({ kind: 1 /* StateKind.Value */, value: options?.initialValue }, { equal });
    }
    let destroyUnregisterFn;
    // Note: This code cannot run inside a reactive context (see assertion above). If we'd support
    // this, we would subscribe to the observable outside of the current reactive context, avoiding
    // that side-effect signal reads/writes are attribute to the current consumer. The current
    // consumer only needs to be notified when the `state` signal changes through the observable
    // subscription. Additional context (related to async pipe):
    // https://github.com/angular/angular/pull/50522.
    const sub = source.subscribe({
        next: (value) => state.set({ kind: 1 /* StateKind.Value */, value }),
        error: (error) => {
            state.set({ kind: 2 /* StateKind.Error */, error });
            destroyUnregisterFn?.();
        },
        complete: () => {
            destroyUnregisterFn?.();
        },
        // Completion of the Observable is meaningless to the signal. Signals don't have a concept of
        // "complete".
    });
    if (options?.requireSync && state().kind === 0 /* StateKind.NoValue */) {
        throw new RuntimeError(601 /* ɵRuntimeErrorCode.REQUIRE_SYNC_WITHOUT_SYNC_EMIT */, (typeof ngDevMode === 'undefined' || ngDevMode) &&
            '`toSignal()` called with `requireSync` but `Observable` did not emit synchronously.');
    }
    // Unsubscribe when the current context is destroyed, if requested.
    destroyUnregisterFn = cleanupRef?.onDestroy(sub.unsubscribe.bind(sub));
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
                // This shouldn't really happen because the error is thrown on creation.
                throw new RuntimeError(601 /* ɵRuntimeErrorCode.REQUIRE_SYNC_WITHOUT_SYNC_EMIT */, (typeof ngDevMode === 'undefined' || ngDevMode) &&
                    '`toSignal()` called with `requireSync` but `Observable` did not emit synchronously.');
        }
    }, { equal: options?.equal });
}
function makeToSignalEqual(userEquality = Object.is) {
    return (a, b) => a.kind === 1 /* StateKind.Value */ && b.kind === 1 /* StateKind.Value */ && userEquality(a.value, b.value);
}

/**
 * Operator which makes the application unstable until the observable emits, completes, errors, or is unsubscribed.
 *
 * Use this operator in observables whose subscriptions are important for rendering and should be included in SSR serialization.
 *
 * @param injector The `Injector` to use during creation. If this is not provided, the current injection context will be used instead (via `inject`).
 *
 * @developerPreview 20.0
 */
function pendingUntilEvent(injector) {
    if (injector === undefined) {
        ngDevMode && assertInInjectionContext(pendingUntilEvent);
        injector = inject(Injector);
    }
    const taskService = injector.get(PendingTasks);
    return (sourceObservable) => {
        return new Observable((originalSubscriber) => {
            // create a new task on subscription
            const removeTask = taskService.add();
            let cleanedUp = false;
            function cleanupTask() {
                if (cleanedUp) {
                    return;
                }
                removeTask();
                cleanedUp = true;
            }
            const innerSubscription = sourceObservable.subscribe({
                next: (v) => {
                    originalSubscriber.next(v);
                    cleanupTask();
                },
                complete: () => {
                    originalSubscriber.complete();
                    cleanupTask();
                },
                error: (e) => {
                    originalSubscriber.error(e);
                    cleanupTask();
                },
            });
            innerSubscription.add(() => {
                originalSubscriber.unsubscribe();
                cleanupTask();
            });
            return innerSubscription;
        });
    };
}

function rxResource(opts) {
    if (ngDevMode && !opts?.injector) {
        assertInInjectionContext(rxResource);
    }
    return resource({
        ...opts,
        loader: undefined,
        stream: (params) => {
            let sub;
            // Track the abort listener so it can be removed if the Observable completes (as a memory
            // optimization).
            const onAbort = () => sub?.unsubscribe();
            params.abortSignal.addEventListener('abort', onAbort);
            // Start off stream as undefined.
            const stream = signal({ value: undefined });
            let resolve;
            const promise = new Promise((r) => (resolve = r));
            function send(value) {
                stream.set(value);
                resolve?.(stream);
                resolve = undefined;
            }
            // TODO(alxhub): remove after g3 updated to rename loader -> stream
            const streamFn = opts.stream ?? opts.loader;
            if (streamFn === undefined) {
                throw new RuntimeError(990 /* ɵRuntimeErrorCode.MUST_PROVIDE_STREAM_OPTION */, ngDevMode && `Must provide \`stream\` option.`);
            }
            sub = streamFn(params).subscribe({
                next: (value) => send({ value }),
                error: (error) => {
                    send({ error: encapsulateResourceError(error) });
                    params.abortSignal.removeEventListener('abort', onAbort);
                },
                complete: () => {
                    if (resolve) {
                        send({
                            error: new RuntimeError(991 /* ɵRuntimeErrorCode.RESOURCE_COMPLETED_BEFORE_PRODUCING_VALUE */, ngDevMode && 'Resource completed before producing a value'),
                        });
                    }
                    params.abortSignal.removeEventListener('abort', onAbort);
                },
            });
            return promise;
        },
    });
}

export { outputFromObservable, outputToObservable, pendingUntilEvent, rxResource, takeUntilDestroyed, toObservable, toSignal };
//# sourceMappingURL=rxjs-interop.mjs.map
