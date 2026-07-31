/**
 * @license Angular v22.1.0+sha-a13b968
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */

import { inject, RuntimeError, formatRuntimeError, ErrorHandler, DestroyRef, InjectionToken, signalAsReadonlyFn, assertInInjectionContext, TransferState, effect, PendingTasks, signal, isSignal, Injector } from './_pending_tasks-chunk.mjs';
import { setActiveConsumer, createComputed, SIGNAL } from './_effect-chunk.mjs';
import { untracked as untracked$1, createLinkedSignal, linkedSignalSetFn, linkedSignalUpdateFn } from './_untracked-chunk.mjs';

class OutputEmitterRef {
  destroyed = false;
  listeners = null;
  errorHandler = inject(ErrorHandler, {
    optional: true
  });
  isEmitting = false;
  hasNullListeners = false;
  destroyRef = inject(DestroyRef);
  constructor() {
    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
      this.listeners = null;
    });
  }
  subscribe(callback) {
    if (this.destroyed) {
      throw new RuntimeError(953, ngDevMode && 'Unexpected subscription to destroyed `OutputRef`. ' + 'The owning directive/component is destroyed.');
    }
    (this.listeners ??= []).push(callback);
    return {
      unsubscribe: () => {
        const index = this.listeners ? this.listeners.indexOf(callback) : -1;
        if (index > -1) {
          if (this.isEmitting) {
            this.hasNullListeners = true;
            this.listeners[index] = null;
          } else {
            this.listeners.splice(index, 1);
          }
        }
      }
    };
  }
  emit(value) {
    if (this.destroyed) {
      console.warn(formatRuntimeError(953, ngDevMode && 'Unexpected emit for destroyed `OutputRef`. ' + 'The owning directive/component is destroyed.'));
      return;
    }
    if (this.listeners === null) {
      return;
    }
    this.isEmitting = true;
    const previousConsumer = setActiveConsumer(null);
    try {
      for (const listenerFn of this.listeners) {
        try {
          if (listenerFn !== null) {
            listenerFn(value);
          }
        } catch (err) {
          this.errorHandler?.handleError(err);
        }
      }
    } finally {
      if (this.hasNullListeners) {
        this.hasNullListeners = false;
        this.listeners && removeNullValues(this.listeners);
      }
      setActiveConsumer(previousConsumer);
      this.isEmitting = false;
    }
  }
}
function removeNullValues(arr) {
  let i = arr.length - 1;
  while (i > -1) {
    if (arr[i] === null) {
      arr.splice(i, 1);
    }
    i--;
  }
}
function getOutputDestroyRef(ref) {
  return ref.destroyRef;
}

const CACHE_ACTIVE = new InjectionToken(typeof ngDevMode !== 'undefined' && ngDevMode ? 'STATE_CACHE_ACTIVE' : '');

function computed(computation, options) {
  const getter = createComputed(computation, options?.equal);
  if (typeof ngDevMode !== 'undefined' && ngDevMode) {
    const debugName = options?.debugName;
    getter[SIGNAL].debugName = debugName;
    getter.toString = () => `[Computed${debugName ? ' (' + debugName + ')' : ''}: ${getter()}]`;
  }
  return getter;
}

function untracked(nonReactiveReadsFn) {
  return untracked$1(nonReactiveReadsFn);
}

class ResourceDependencyError extends Error {
  dependency;
  constructor(dependency) {
    super('Dependency error', {
      cause: dependency.error()
    });
    this.name = 'ResourceDependencyError';
    this.dependency = dependency;
  }
}
class ResourceParamsStatus extends Error {
  _brand;
  constructor(msg) {
    super(msg);
  }
  static IDLE = new ResourceParamsStatus('IDLE');
  static LOADING = new ResourceParamsStatus('LOADING');
}

const identityFn = v => v;
function linkedSignal(optionsOrComputation, options) {
  if (typeof optionsOrComputation === 'function') {
    const getter = createLinkedSignal(optionsOrComputation, identityFn, options?.equal);
    return upgradeLinkedSignalGetter(getter, options?.debugName, options?.set);
  } else {
    const getter = createLinkedSignal(optionsOrComputation.source, optionsOrComputation.computation, optionsOrComputation.equal);
    return upgradeLinkedSignalGetter(getter, optionsOrComputation.debugName, optionsOrComputation.set);
  }
}
function upgradeLinkedSignalGetter(getter, debugName, customSet) {
  if (typeof ngDevMode !== 'undefined' && ngDevMode) {
    getter[SIGNAL].debugName = debugName;
    getter.toString = () => `[LinkedSignal${debugName ? ' (' + debugName + ')' : ''}: ${getter()}]`;
  }
  const node = getter[SIGNAL];
  const upgradedGetter = getter;
  if (customSet !== undefined) {
    const rawSet = newValue => linkedSignalSetFn(node, newValue);
    upgradedGetter.set = newValue => customSet(newValue, rawSet);
    upgradedGetter.update = updateFn => customSet(updateFn(untracked(getter)), rawSet);
  } else {
    upgradedGetter.set = newValue => linkedSignalSetFn(node, newValue);
    upgradedGetter.update = updateFn => linkedSignalUpdateFn(node, updateFn);
  }
  upgradedGetter.asReadonly = signalAsReadonlyFn.bind(getter);
  return upgradedGetter;
}

function resource(options) {
  if (ngDevMode && !options?.injector) {
    assertInInjectionContext(resource);
  }
  const oldNameForParams = options.request;
  const params = options.params ?? oldNameForParams ?? (() => null);
  return new ResourceImpl(params, getLoader(options), options.defaultValue, options.equal ? wrapEqualityFn(options.equal) : undefined, options.debugName, options.injector ?? inject(Injector), options.id);
}
class BaseWritableResource {
  value;
  isLoading;
  constructor(value, debugName) {
    this.value = value;
    this.value.set = this.set.bind(this);
    this.value.update = this.update.bind(this);
    this.value.asReadonly = signalAsReadonlyFn;
    this.isLoading = computed(() => this.status() === 'loading' || this.status() === 'reloading', ngDevMode ? createDebugNameObject(debugName, 'isLoading') : undefined);
  }
  isError = computed(() => this.status() === 'error');
  update(updateFn) {
    this.set(updateFn(untracked(this.value)));
  }
  isValueDefined = computed(() => {
    if (this.isError()) {
      return false;
    }
    return this.value() !== undefined;
  });
  _snapshot;
  get snapshot() {
    return this._snapshot ??= computed(() => {
      const status = this.status();
      if (status === 'error') {
        return {
          status: 'error',
          error: this.error()
        };
      } else {
        return {
          status,
          value: this.value()
        };
      }
    });
  }
  hasValue() {
    return this.isValueDefined();
  }
  asReadonly() {
    return this;
  }
}
class ResourceImpl extends BaseWritableResource {
  loaderFn;
  equal;
  debugName;
  transferCacheKey;
  pendingTasks;
  state;
  extRequest;
  effectRef;
  pendingController;
  resolvePendingTask = undefined;
  destroyed = false;
  unregisterOnDestroy;
  status;
  error;
  transferState;
  constructor(request, loaderFn, defaultValue, equal, debugName, injector, transferCacheKey, getInitialStream) {
    if (isInParamsFunction()) {
      throw invalidResourceCreationInParams();
    }
    super(computed(() => {
      const streamValue = this.state().stream?.();
      if (!streamValue) {
        return defaultValue;
      }
      if (this.state().status === 'loading' && this.error()) {
        return defaultValue;
      }
      if (!isResolved(streamValue)) {
        throw new ResourceValueError(this.error());
      }
      return streamValue.value;
    }, {
      equal,
      ...(ngDevMode ? createDebugNameObject(debugName, 'value') : undefined)
    }), debugName);
    this.loaderFn = loaderFn;
    this.equal = equal;
    this.debugName = debugName;
    this.transferCacheKey = transferCacheKey;
    const cacheState = injector.get(CACHE_ACTIVE, undefined, {
      optional: true
    }) ?? {
      isActive: false
    };
    this.transferState = injector.get(TransferState, undefined, {
      optional: true
    }) ?? undefined;
    this.extRequest = linkedSignal(() => {
      try {
        setInParamsFunction(true);
        return {
          request: request(paramsContext),
          reload: 0
        };
      } catch (error) {
        rethrowFatalErrors(error);
        if (error === ResourceParamsStatus.IDLE) {
          return {
            status: 'idle',
            reload: 0
          };
        } else if (error === ResourceParamsStatus.LOADING) {
          return {
            status: 'loading',
            reload: 0
          };
        }
        return {
          error: error,
          reload: 0
        };
      } finally {
        setInParamsFunction(false);
      }
    }, ngDevMode ? createDebugNameObject(debugName, 'extRequest') : undefined);
    this.state = linkedSignal({
      source: this.extRequest,
      computation: (extRequest, previous) => {
        let {
          request,
          status,
          error
        } = extRequest;
        let stream;
        if (error) {
          status = 'resolved';
          stream = signal({
            error: encapsulateResourceError(error)
          }, ngDevMode ? createDebugNameObject(this.debugName, 'stream') : undefined);
        } else if (!status) {
          if (!previous) {
            const transferState = this.transferState;
            const cacheKey = this.transferCacheKey;
            if (cacheState.isActive && cacheKey && transferState && request !== undefined) {
              if (transferState.hasKey(cacheKey)) {
                stream = signal({
                  value: transferState.get(cacheKey, defaultValue)
                }, ngDevMode ? createDebugNameObject(this.debugName, 'stream') : undefined);
              }
            }
            if (!stream) {
              stream = getInitialStream?.(extRequest.request);
            }
            getInitialStream = undefined;
            status = request === undefined ? 'idle' : stream ? 'resolved' : 'loading';
          } else {
            status = request === undefined ? 'idle' : 'loading';
            if (previous.value.extRequest.request === request) {
              stream = previous.value.stream;
            }
          }
        }
        return {
          extRequest,
          status,
          previousStatus: previous ? projectStatusOfState(previous.value) : 'idle',
          stream
        };
      },
      ...(ngDevMode ? createDebugNameObject(debugName, 'state') : undefined)
    });
    this.effectRef = effect(this.loadEffect.bind(this), {
      injector,
      manualCleanup: true,
      ...(ngDevMode ? createDebugNameObject(debugName, 'loadEffect') : undefined)
    });
    this.pendingTasks = injector.get(PendingTasks);
    this.unregisterOnDestroy = injector.get(DestroyRef).onDestroy(() => this.destroy());
    this.status = computed(() => projectStatusOfState(this.state()), ngDevMode ? createDebugNameObject(debugName, 'status') : undefined);
    this.error = computed(() => {
      const stream = this.state().stream?.();
      return stream && !isResolved(stream) ? stream.error : undefined;
    }, ngDevMode ? createDebugNameObject(debugName, 'error') : undefined);
  }
  set(value) {
    if (this.destroyed) {
      return;
    }
    const error = untracked(this.error);
    const state = untracked(this.state);
    if (!error) {
      const current = untracked(this.value);
      if (state.status === 'local' && (this.equal ? this.equal(current, value) : current === value)) {
        return;
      }
    }
    this.state.set({
      extRequest: state.extRequest,
      status: 'local',
      previousStatus: 'local',
      stream: signal({
        value
      }, ngDevMode ? createDebugNameObject(this.debugName, 'stream') : undefined)
    });
    this.abortInProgressLoad();
  }
  reload() {
    const {
      status
    } = untracked(this.state);
    if (status === 'idle' || status === 'loading') {
      return false;
    }
    this.extRequest.update(({
      request,
      reload
    }) => ({
      request,
      reload: reload + 1
    }));
    return true;
  }
  destroy() {
    this.destroyed = true;
    this.unregisterOnDestroy();
    this.effectRef.destroy();
    this.abortInProgressLoad();
    this.state.set({
      extRequest: {
        request: undefined,
        reload: 0
      },
      status: 'idle',
      previousStatus: 'idle',
      stream: undefined
    });
  }
  async loadEffect() {
    const extRequest = this.extRequest();
    const {
      status: currentStatus,
      previousStatus
    } = untracked(this.state);
    if (extRequest.request === undefined) {
      return;
    } else if (currentStatus !== 'loading') {
      return;
    }
    this.abortInProgressLoad();
    let resolvePendingTask = this.resolvePendingTask = this.pendingTasks.add();
    const {
      signal: abortSignal
    } = this.pendingController = new AbortController();
    try {
      const stream = untracked(() => {
        return this.loaderFn({
          params: extRequest.request,
          abortSignal,
          previous: {
            status: previousStatus
          }
        });
      });
      const shouldDiscard = () => abortSignal.aborted || untracked(this.extRequest) !== extRequest;
      if (isSignal(stream)) {
        if (shouldDiscard()) {
          return;
        }
        this.state.set({
          extRequest,
          status: 'resolved',
          previousStatus: 'resolved',
          stream
        });
        const result = untracked(stream);
        if (typeof ngServerMode !== 'undefined' && ngServerMode) {
          saveToTransferState(result, this.transferCacheKey, this.transferState);
        }
      } else {
        const resolvedStream = await stream;
        if (shouldDiscard()) {
          return;
        }
        this.state.set({
          extRequest,
          status: 'resolved',
          previousStatus: 'resolved',
          stream: resolvedStream
        });
        const result = resolvedStream ? untracked(resolvedStream) : undefined;
        if (typeof ngServerMode !== 'undefined' && ngServerMode) {
          saveToTransferState(result, this.transferCacheKey, this.transferState);
        }
      }
    } catch (err) {
      rethrowFatalErrors(err);
      if (abortSignal.aborted || untracked(this.extRequest) !== extRequest) {
        return;
      }
      this.state.set({
        extRequest,
        status: 'resolved',
        previousStatus: 'error',
        stream: signal({
          error: encapsulateResourceError(err)
        }, ngDevMode ? createDebugNameObject(this.debugName, 'stream') : undefined)
      });
    } finally {
      resolvePendingTask?.();
      resolvePendingTask = undefined;
    }
  }
  abortInProgressLoad() {
    untracked(() => this.pendingController?.abort());
    this.pendingController = undefined;
    this.resolvePendingTask?.();
    this.resolvePendingTask = undefined;
  }
}
function saveToTransferState(result, transferCacheKey, transferState) {
  if (transferCacheKey && transferState && result && isResolved(result)) {
    transferState.set(transferCacheKey, result.value);
  }
}
function wrapEqualityFn(equal) {
  return (a, b) => a === undefined || b === undefined ? a === b : equal(a, b);
}
function getLoader(options) {
  if (isStreamingResourceOptions(options)) {
    return options.stream;
  }
  return async params => {
    try {
      return signal({
        value: await options.loader(params)
      }, ngDevMode ? createDebugNameObject(options.debugName, 'stream') : undefined);
    } catch (err) {
      return signal({
        error: encapsulateResourceError(err)
      }, ngDevMode ? createDebugNameObject(options.debugName, 'stream') : undefined);
    }
  };
}
function isStreamingResourceOptions(options) {
  return !!options.stream;
}
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
function createDebugNameObject(resourceDebugName, internalSignalDebugName) {
  return {
    debugName: `Resource${resourceDebugName ? '#' + resourceDebugName : ''}.${internalSignalDebugName}`
  };
}
function encapsulateResourceError(error) {
  if (isErrorLike(error)) {
    return error;
  }
  return new ResourceWrappedError(error);
}
function isErrorLike(error) {
  return error instanceof Error || typeof error === 'object' && typeof error.name === 'string' && typeof error.message === 'string';
}
class ResourceValueError extends Error {
  constructor(error) {
    super(ngDevMode ? `Resource is currently in an error state (see Error.cause for details): ${error.message}` : error.message, {
      cause: error
    });
  }
}
class ResourceWrappedError extends Error {
  constructor(error) {
    super(ngDevMode ? `Resource returned an error that's not an Error instance: ${String(error)}. Check this error's .cause for the actual error.` : String(error), {
      cause: error
    });
  }
}
function chain(resource) {
  switch (resource.status()) {
    case 'idle':
      throw ResourceParamsStatus.IDLE;
    case 'error':
      throw new ResourceDependencyError(resource);
    case 'loading':
    case 'reloading':
      throw ResourceParamsStatus.LOADING;
  }
  return resource.value();
}
const paramsContext = {
  chain
};
let inParamsFunction = false;
function isInParamsFunction() {
  return inParamsFunction;
}
function setInParamsFunction(value) {
  inParamsFunction = value;
}
function invalidResourceCreationInParams() {
  return new RuntimeError(992, ngDevMode && `Cannot create a resource inside the \`params\` of another resource`);
}
function rethrowFatalErrors(error) {
  if (error instanceof RuntimeError && error.code === 992) {
    throw error;
  }
}

export { CACHE_ACTIVE, OutputEmitterRef, ResourceDependencyError, ResourceImpl, ResourceParamsStatus, ResourceValueError, chain, computed, encapsulateResourceError, getOutputDestroyRef, invalidResourceCreationInParams, isInParamsFunction, linkedSignal, resource, rethrowFatalErrors, setInParamsFunction, untracked };
//# sourceMappingURL=_resource-chunk.mjs.map
