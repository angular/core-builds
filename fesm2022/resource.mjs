/**
 * @license Angular v20.1.1+sha-8ad10fd
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */

import { inject, ErrorHandler, DestroyRef, RuntimeError, formatRuntimeError, assertNotInReactiveContext, assertInInjectionContext, Injector, ViewContext, ChangeDetectionScheduler, EffectScheduler, setInjectorProfilerContext, emitEffectCreatedEvent, EFFECTS, NodeInjectorDestroyRef, FLAGS, markAncestorsForTraversal, noop, setIsRefreshingViews, signalAsReadonlyFn, PendingTasks, signal } from './root_effect_scheduler.mjs';
import { setActiveConsumer, createComputed, SIGNAL, consumerDestroy, REACTIVE_NODE, isInNotificationPhase, consumerPollProducersForChange, consumerBeforeComputation, consumerAfterComputation } from './signal.mjs';
import { untracked as untracked$1, createLinkedSignal, linkedSignalSetFn, linkedSignalUpdateFn } from './untracked.mjs';

/**
 * An `OutputEmitterRef` is created by the `output()` function and can be
 * used to emit values to consumers of your directive or component.
 *
 * Consumers of your directive/component can bind to the output and
 * subscribe to changes via the bound event syntax. For example:
 *
 * ```html
 * <my-comp (valueChange)="processNewValue($event)" />
 * ```
 *
 * @publicAPI
 */
class OutputEmitterRef {
    destroyed = false;
    listeners = null;
    errorHandler = inject(ErrorHandler, { optional: true });
    /** @internal */
    destroyRef = inject(DestroyRef);
    constructor() {
        // Clean-up all listeners and mark as destroyed upon destroy.
        this.destroyRef.onDestroy(() => {
            this.destroyed = true;
            this.listeners = null;
        });
    }
    subscribe(callback) {
        if (this.destroyed) {
            throw new RuntimeError(953 /* RuntimeErrorCode.OUTPUT_REF_DESTROYED */, ngDevMode &&
                'Unexpected subscription to destroyed `OutputRef`. ' +
                    'The owning directive/component is destroyed.');
        }
        (this.listeners ??= []).push(callback);
        return {
            unsubscribe: () => {
                const idx = this.listeners?.indexOf(callback);
                if (idx !== undefined && idx !== -1) {
                    this.listeners?.splice(idx, 1);
                }
            },
        };
    }
    /** Emits a new value to the output. */
    emit(value) {
        if (this.destroyed) {
            console.warn(formatRuntimeError(953 /* RuntimeErrorCode.OUTPUT_REF_DESTROYED */, ngDevMode &&
                'Unexpected emit for destroyed `OutputRef`. ' +
                    'The owning directive/component is destroyed.'));
            return;
        }
        if (this.listeners === null) {
            return;
        }
        const previousConsumer = setActiveConsumer(null);
        try {
            for (const listenerFn of this.listeners) {
                try {
                    listenerFn(value);
                }
                catch (err) {
                    this.errorHandler?.handleError(err);
                }
            }
        }
        finally {
            setActiveConsumer(previousConsumer);
        }
    }
}
/** Gets the owning `DestroyRef` for the given output. */
function getOutputDestroyRef(ref) {
    return ref.destroyRef;
}

/**
 * Execute an arbitrary function in a non-reactive (non-tracking) context. The executed function
 * can, optionally, return a value.
 */
function untracked(nonReactiveReadsFn) {
    return untracked$1(nonReactiveReadsFn);
}

/**
 * Create a computed `Signal` which derives a reactive value from an expression.
 */
function computed(computation, options) {
    const getter = createComputed(computation, options?.equal);
    if (ngDevMode) {
        getter.toString = () => `[Computed: ${getter()}]`;
        getter[SIGNAL].debugName = options?.debugName;
    }
    return getter;
}

class EffectRefImpl {
    [SIGNAL];
    constructor(node) {
        this[SIGNAL] = node;
    }
    destroy() {
        this[SIGNAL].destroy();
    }
}
/**
 * Registers an "effect" that will be scheduled & executed whenever the signals that it reads
 * changes.
 *
 * Angular has two different kinds of effect: component effects and root effects. Component effects
 * are created when `effect()` is called from a component, directive, or within a service of a
 * component/directive. Root effects are created when `effect()` is called from outside the
 * component tree, such as in a root service.
 *
 * The two effect types differ in their timing. Component effects run as a component lifecycle
 * event during Angular's synchronization (change detection) process, and can safely read input
 * signals or create/destroy views that depend on component state. Root effects run as microtasks
 * and have no connection to the component tree or change detection.
 *
 * `effect()` must be run in injection context, unless the `injector` option is manually specified.
 *
 * @publicApi 20.0
 */
function effect(effectFn, options) {
    ngDevMode &&
        assertNotInReactiveContext(effect, 'Call `effect` outside of a reactive context. For example, schedule the ' +
            'effect inside the component constructor.');
    if (ngDevMode && !options?.injector) {
        assertInInjectionContext(effect);
    }
    if (ngDevMode && options?.allowSignalWrites !== undefined) {
        console.warn(`The 'allowSignalWrites' flag is deprecated and no longer impacts effect() (writes are always allowed)`);
    }
    const injector = options?.injector ?? inject(Injector);
    let destroyRef = options?.manualCleanup !== true ? injector.get(DestroyRef) : null;
    let node;
    const viewContext = injector.get(ViewContext, null, { optional: true });
    const notifier = injector.get(ChangeDetectionScheduler);
    if (viewContext !== null) {
        // This effect was created in the context of a view, and will be associated with the view.
        node = createViewEffect(viewContext.view, notifier, effectFn);
        if (destroyRef instanceof NodeInjectorDestroyRef && destroyRef._lView === viewContext.view) {
            // The effect is being created in the same view as the `DestroyRef` references, so it will be
            // automatically destroyed without the need for an explicit `DestroyRef` registration.
            destroyRef = null;
        }
    }
    else {
        // This effect was created outside the context of a view, and will be scheduled independently.
        node = createRootEffect(effectFn, injector.get(EffectScheduler), notifier);
    }
    node.injector = injector;
    if (destroyRef !== null) {
        // If we need to register for cleanup, do that here.
        node.onDestroyFn = destroyRef.onDestroy(() => node.destroy());
    }
    const effectRef = new EffectRefImpl(node);
    if (ngDevMode) {
        node.debugName = options?.debugName ?? '';
        const prevInjectorProfilerContext = setInjectorProfilerContext({ injector, token: null });
        try {
            emitEffectCreatedEvent(effectRef);
        }
        finally {
            setInjectorProfilerContext(prevInjectorProfilerContext);
        }
    }
    return effectRef;
}
const BASE_EFFECT_NODE = 
/* @__PURE__ */ (() => ({
    ...REACTIVE_NODE,
    consumerIsAlwaysLive: true,
    consumerAllowSignalWrites: true,
    dirty: true,
    hasRun: false,
    cleanupFns: undefined,
    zone: null,
    kind: 'effect',
    onDestroyFn: noop,
    run() {
        this.dirty = false;
        if (ngDevMode && isInNotificationPhase()) {
            throw new Error(`Schedulers cannot synchronously execute watches while scheduling.`);
        }
        if (this.hasRun && !consumerPollProducersForChange(this)) {
            return;
        }
        this.hasRun = true;
        const registerCleanupFn = (cleanupFn) => (this.cleanupFns ??= []).push(cleanupFn);
        const prevNode = consumerBeforeComputation(this);
        // We clear `setIsRefreshingViews` so that `markForCheck()` within the body of an effect will
        // cause CD to reach the component in question.
        const prevRefreshingViews = setIsRefreshingViews(false);
        try {
            this.maybeCleanup();
            this.fn(registerCleanupFn);
        }
        finally {
            setIsRefreshingViews(prevRefreshingViews);
            consumerAfterComputation(this, prevNode);
        }
    },
    maybeCleanup() {
        if (!this.cleanupFns?.length) {
            return;
        }
        const prevConsumer = setActiveConsumer(null);
        try {
            // Attempt to run the cleanup functions. Regardless of failure or success, we consider
            // cleanup "completed" and clear the list for the next run of the effect. Note that an error
            // from the cleanup function will still crash the current run of the effect.
            while (this.cleanupFns.length) {
                this.cleanupFns.pop()();
            }
        }
        finally {
            this.cleanupFns = [];
            setActiveConsumer(prevConsumer);
        }
    },
}))();
const ROOT_EFFECT_NODE = 
/* @__PURE__ */ (() => ({
    ...BASE_EFFECT_NODE,
    consumerMarkedDirty() {
        this.scheduler.schedule(this);
        this.notifier.notify(12 /* NotificationSource.RootEffect */);
    },
    destroy() {
        consumerDestroy(this);
        this.onDestroyFn();
        this.maybeCleanup();
        this.scheduler.remove(this);
    },
}))();
const VIEW_EFFECT_NODE = 
/* @__PURE__ */ (() => ({
    ...BASE_EFFECT_NODE,
    consumerMarkedDirty() {
        this.view[FLAGS] |= 8192 /* LViewFlags.HasChildViewsToRefresh */;
        markAncestorsForTraversal(this.view);
        this.notifier.notify(13 /* NotificationSource.ViewEffect */);
    },
    destroy() {
        consumerDestroy(this);
        this.onDestroyFn();
        this.maybeCleanup();
        this.view[EFFECTS]?.delete(this);
    },
}))();
function createViewEffect(view, notifier, fn) {
    const node = Object.create(VIEW_EFFECT_NODE);
    node.view = view;
    node.zone = typeof Zone !== 'undefined' ? Zone.current : null;
    node.notifier = notifier;
    node.fn = fn;
    view[EFFECTS] ??= new Set();
    view[EFFECTS].add(node);
    node.consumerMarkedDirty(node);
    return node;
}
function createRootEffect(fn, scheduler, notifier) {
    const node = Object.create(ROOT_EFFECT_NODE);
    node.fn = fn;
    node.scheduler = scheduler;
    node.notifier = notifier;
    node.zone = typeof Zone !== 'undefined' ? Zone.current : null;
    node.scheduler.add(node);
    node.notifier.notify(12 /* NotificationSource.RootEffect */);
    return node;
}

const identityFn = (v) => v;
function linkedSignal(optionsOrComputation, options) {
    if (typeof optionsOrComputation === 'function') {
        const getter = createLinkedSignal(optionsOrComputation, (identityFn), options?.equal);
        return upgradeLinkedSignalGetter(getter);
    }
    else {
        const getter = createLinkedSignal(optionsOrComputation.source, optionsOrComputation.computation, optionsOrComputation.equal);
        return upgradeLinkedSignalGetter(getter);
    }
}
function upgradeLinkedSignalGetter(getter) {
    if (ngDevMode) {
        getter.toString = () => `[LinkedSignal: ${getter()}]`;
    }
    const node = getter[SIGNAL];
    const upgradedGetter = getter;
    upgradedGetter.set = (newValue) => linkedSignalSetFn(node, newValue);
    upgradedGetter.update = (updateFn) => linkedSignalUpdateFn(node, updateFn);
    upgradedGetter.asReadonly = signalAsReadonlyFn.bind(getter);
    return upgradedGetter;
}

/**
 * Whether a `Resource.value()` should throw an error when the resource is in the error state.
 *
 * This internal flag is being used to gradually roll out this behavior.
 */
const RESOURCE_VALUE_THROWS_ERRORS_DEFAULT = true;
function resource(options) {
    if (ngDevMode && !options?.injector) {
        assertInInjectionContext(resource);
    }
    const oldNameForParams = options.request;
    const params = (options.params ?? oldNameForParams ?? (() => null));
    return new ResourceImpl(params, getLoader(options), options.defaultValue, options.equal ? wrapEqualityFn(options.equal) : undefined, options.injector ?? inject(Injector), RESOURCE_VALUE_THROWS_ERRORS_DEFAULT);
}
/**
 * Base class which implements `.value` as a `WritableSignal` by delegating `.set` and `.update`.
 */
class BaseWritableResource {
    value;
    constructor(value) {
        this.value = value;
        this.value.set = this.set.bind(this);
        this.value.update = this.update.bind(this);
        this.value.asReadonly = signalAsReadonlyFn;
    }
    isError = computed(() => this.status() === 'error');
    update(updateFn) {
        this.set(updateFn(untracked(this.value)));
    }
    isLoading = computed(() => this.status() === 'loading' || this.status() === 'reloading');
    hasValue() {
        // Note: we specifically read `isError()` instead of `status()` here to avoid triggering
        // reactive consumers which read `hasValue()`. This way, if `hasValue()` is used inside of an
        // effect, it doesn't cause the effect to rerun on every status change.
        if (this.isError()) {
            return false;
        }
        return this.value() !== undefined;
    }
    asReadonly() {
        return this;
    }
}
/**
 * Implementation for `resource()` which uses a `linkedSignal` to manage the resource's state.
 */
class ResourceImpl extends BaseWritableResource {
    loaderFn;
    equal;
    pendingTasks;
    /**
     * The current state of the resource. Status, value, and error are derived from this.
     */
    state;
    /**
     * Combines the current request with a reload counter which allows the resource to be reloaded on
     * imperative command.
     */
    extRequest;
    effectRef;
    pendingController;
    resolvePendingTask = undefined;
    destroyed = false;
    unregisterOnDestroy;
    constructor(request, loaderFn, defaultValue, equal, injector, throwErrorsFromValue = RESOURCE_VALUE_THROWS_ERRORS_DEFAULT) {
        super(
        // Feed a computed signal for the value to `BaseWritableResource`, which will upgrade it to a
        // `WritableSignal` that delegates to `ResourceImpl.set`.
        computed(() => {
            const streamValue = this.state().stream?.();
            if (!streamValue) {
                return defaultValue;
            }
            // Prevents `hasValue()` from throwing an error when a reload happened in the error state
            if (this.state().status === 'loading' && this.error()) {
                return defaultValue;
            }
            if (!isResolved(streamValue)) {
                if (throwErrorsFromValue) {
                    throw new ResourceValueError(this.error());
                }
                else {
                    return defaultValue;
                }
            }
            return streamValue.value;
        }, { equal }));
        this.loaderFn = loaderFn;
        this.equal = equal;
        // Extend `request()` to include a writable reload signal.
        this.extRequest = linkedSignal({
            source: request,
            computation: (request) => ({ request, reload: 0 }),
        });
        // The main resource state is managed in a `linkedSignal`, which allows the resource to change
        // state instantaneously when the request signal changes.
        this.state = linkedSignal({
            // Whenever the request changes,
            source: this.extRequest,
            // Compute the state of the resource given a change in status.
            computation: (extRequest, previous) => {
                const status = extRequest.request === undefined ? 'idle' : 'loading';
                if (!previous) {
                    return {
                        extRequest,
                        status,
                        previousStatus: 'idle',
                        stream: undefined,
                    };
                }
                else {
                    return {
                        extRequest,
                        status,
                        previousStatus: projectStatusOfState(previous.value),
                        // If the request hasn't changed, keep the previous stream.
                        stream: previous.value.extRequest.request === extRequest.request
                            ? previous.value.stream
                            : undefined,
                    };
                }
            },
        });
        this.effectRef = effect(this.loadEffect.bind(this), {
            injector,
            manualCleanup: true,
        });
        this.pendingTasks = injector.get(PendingTasks);
        // Cancel any pending request when the resource itself is destroyed.
        this.unregisterOnDestroy = injector.get(DestroyRef).onDestroy(() => this.destroy());
    }
    status = computed(() => projectStatusOfState(this.state()));
    error = computed(() => {
        const stream = this.state().stream?.();
        return stream && !isResolved(stream) ? stream.error : undefined;
    });
    /**
     * Called either directly via `WritableResource.set` or via `.value.set()`.
     */
    set(value) {
        if (this.destroyed) {
            return;
        }
        const error = untracked(this.error);
        const state = untracked(this.state);
        if (!error) {
            const current = untracked(this.value);
            if (state.status === 'local' &&
                (this.equal ? this.equal(current, value) : current === value)) {
                return;
            }
        }
        // Enter Local state with the user-defined value.
        this.state.set({
            extRequest: state.extRequest,
            status: 'local',
            previousStatus: 'local',
            stream: signal({ value }),
        });
        // We're departing from whatever state the resource was in previously, so cancel any in-progress
        // loading operations.
        this.abortInProgressLoad();
    }
    reload() {
        // We don't want to restart in-progress loads.
        const { status } = untracked(this.state);
        if (status === 'idle' || status === 'loading') {
            return false;
        }
        // Increment the request reload to trigger the `state` linked signal to switch us to `Reload`
        this.extRequest.update(({ request, reload }) => ({ request, reload: reload + 1 }));
        return true;
    }
    destroy() {
        this.destroyed = true;
        this.unregisterOnDestroy();
        this.effectRef.destroy();
        this.abortInProgressLoad();
        // Destroyed resources enter Idle state.
        this.state.set({
            extRequest: { request: undefined, reload: 0 },
            status: 'idle',
            previousStatus: 'idle',
            stream: undefined,
        });
    }
    async loadEffect() {
        const extRequest = this.extRequest();
        // Capture the previous status before any state transitions. Note that this is `untracked` since
        // we do not want the effect to depend on the state of the resource, only on the request.
        const { status: currentStatus, previousStatus } = untracked(this.state);
        if (extRequest.request === undefined) {
            // Nothing to load (and we should already be in a non-loading state).
            return;
        }
        else if (currentStatus !== 'loading') {
            // We're not in a loading or reloading state, so this loading request is stale.
            return;
        }
        // Cancel any previous loading attempts.
        this.abortInProgressLoad();
        // Capturing _this_ load's pending task in a local variable is important here. We may attempt to
        // resolve it twice:
        //
        //  1. when the loading function promise resolves/rejects
        //  2. when cancelling the loading operation
        //
        // After the loading operation is cancelled, `this.resolvePendingTask` no longer represents this
        // particular task, but this `await` may eventually resolve/reject. Thus, when we cancel in
        // response to (1) below, we need to cancel the locally saved task.
        let resolvePendingTask = (this.resolvePendingTask =
            this.pendingTasks.add());
        const { signal: abortSignal } = (this.pendingController = new AbortController());
        try {
            // The actual loading is run through `untracked` - only the request side of `resource` is
            // reactive. This avoids any confusion with signals tracking or not tracking depending on
            // which side of the `await` they are.
            const stream = await untracked(() => {
                return this.loaderFn({
                    params: extRequest.request,
                    // TODO(alxhub): cleanup after g3 removal of `request` alias.
                    request: extRequest.request,
                    abortSignal,
                    previous: {
                        status: previousStatus,
                    },
                });
            });
            // If this request has been aborted, or the current request no longer
            // matches this load, then we should ignore this resolution.
            if (abortSignal.aborted || untracked(this.extRequest) !== extRequest) {
                return;
            }
            this.state.set({
                extRequest,
                status: 'resolved',
                previousStatus: 'resolved',
                stream,
            });
        }
        catch (err) {
            if (abortSignal.aborted || untracked(this.extRequest) !== extRequest) {
                return;
            }
            this.state.set({
                extRequest,
                status: 'resolved',
                previousStatus: 'error',
                stream: signal({ error: encapsulateResourceError(err) }),
            });
        }
        finally {
            // Resolve the pending task now that the resource has a value.
            resolvePendingTask?.();
            resolvePendingTask = undefined;
        }
    }
    abortInProgressLoad() {
        untracked(() => this.pendingController?.abort());
        this.pendingController = undefined;
        // Once the load is aborted, we no longer want to block stability on its resolution.
        this.resolvePendingTask?.();
        this.resolvePendingTask = undefined;
    }
}
/**
 * Wraps an equality function to handle either value being `undefined`.
 */
function wrapEqualityFn(equal) {
    return (a, b) => (a === undefined || b === undefined ? a === b : equal(a, b));
}
function getLoader(options) {
    if (isStreamingResourceOptions(options)) {
        return options.stream;
    }
    return async (params) => {
        try {
            return signal({ value: await options.loader(params) });
        }
        catch (err) {
            return signal({ error: encapsulateResourceError(err) });
        }
    };
}
function isStreamingResourceOptions(options) {
    return !!options.stream;
}
/**
 * Project from a state with `ResourceInternalStatus` to the user-facing `ResourceStatus`
 */
function projectStatusOfState(state) {
    switch (state.status) {
        case 'loading':
            return state.extRequest.reload === 0 ? 'loading' : 'reloading';
        case 'resolved':
            return isResolved(state.stream()) ? 'resolved' : 'error';
        default:
            return state.status;
    }
}
function isResolved(state) {
    return state.error === undefined;
}
function encapsulateResourceError(error) {
    if (error instanceof Error) {
        return error;
    }
    return new ResourceWrappedError(error);
}
class ResourceValueError extends Error {
    constructor(error) {
        super(ngDevMode
            ? `Resource is currently in an error state (see Error.cause for details): ${error.message}`
            : error.message, { cause: error });
    }
}
class ResourceWrappedError extends Error {
    constructor(error) {
        super(ngDevMode
            ? `Resource returned an error that's not an Error instance: ${String(error)}. Check this error's .cause for the actual error.`
            : String(error), { cause: error });
    }
}

export { OutputEmitterRef, ResourceImpl, computed, effect, encapsulateResourceError, getOutputDestroyRef, linkedSignal, resource, untracked };
//# sourceMappingURL=resource.mjs.map
