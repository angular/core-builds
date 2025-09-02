/**
 * @license Angular v20.2.3+sha-c664af8
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */

import { SIGNAL, runPostProducerCreatedFn, producerUpdateValueVersion, signalSetFn, producerMarkClean, signalUpdateFn, REACTIVE_NODE, UNSET, defaultEquals, COMPUTING, consumerBeforeComputation, ERRORED, consumerAfterComputation, producerAccessed, setActiveConsumer, consumerPollProducersForChange } from './signal.mjs';

function createLinkedSignal(sourceFn, computationFn, equalityFn) {
    const node = Object.create(LINKED_SIGNAL_NODE);
    node.source = sourceFn;
    node.computation = computationFn;
    if (equalityFn != undefined) {
        node.equal = equalityFn;
    }
    const linkedSignalGetter = () => {
        // Check if the value needs updating before returning it.
        producerUpdateValueVersion(node);
        // Record that someone looked at this signal.
        producerAccessed(node);
        if (node.value === ERRORED) {
            throw node.error;
        }
        return node.value;
    };
    const getter = linkedSignalGetter;
    getter[SIGNAL] = node;
    if (typeof ngDevMode !== 'undefined' && ngDevMode) {
        const debugName = node.debugName ? ' (' + node.debugName + ')' : '';
        getter.toString = () => `[LinkedSignal${debugName}: ${node.value}]`;
    }
    runPostProducerCreatedFn(node);
    return getter;
}
function linkedSignalSetFn(node, newValue) {
    producerUpdateValueVersion(node);
    signalSetFn(node, newValue);
    producerMarkClean(node);
}
function linkedSignalUpdateFn(node, updater) {
    producerUpdateValueVersion(node);
    signalUpdateFn(node, updater);
    producerMarkClean(node);
}
// Note: Using an IIFE here to ensure that the spread assignment is not considered
// a side-effect, ending up preserving `LINKED_SIGNAL_NODE` and `REACTIVE_NODE`.
// TODO: remove when https://github.com/evanw/esbuild/issues/3392 is resolved.
const LINKED_SIGNAL_NODE = /* @__PURE__ */ (() => {
    return {
        ...REACTIVE_NODE,
        value: UNSET,
        dirty: true,
        error: null,
        equal: defaultEquals,
        kind: 'linkedSignal',
        producerMustRecompute(node) {
            // Force a recomputation if there's no current value, or if the current value is in the
            // process of being calculated (which should throw an error).
            return node.value === UNSET || node.value === COMPUTING;
        },
        producerRecomputeValue(node) {
            if (node.value === COMPUTING) {
                // Our computation somehow led to a cyclic read of itself.
                throw new Error(typeof ngDevMode !== 'undefined' && ngDevMode ? 'Detected cycle in computations.' : '');
            }
            const oldValue = node.value;
            node.value = COMPUTING;
            const prevConsumer = consumerBeforeComputation(node);
            let newValue;
            try {
                const newSourceValue = node.source();
                const prev = oldValue === UNSET || oldValue === ERRORED
                    ? undefined
                    : {
                        source: node.sourceValue,
                        value: oldValue,
                    };
                newValue = node.computation(newSourceValue, prev);
                node.sourceValue = newSourceValue;
            }
            catch (err) {
                newValue = ERRORED;
                node.error = err;
            }
            finally {
                consumerAfterComputation(node, prevConsumer);
            }
            if (oldValue !== UNSET && newValue !== ERRORED && node.equal(oldValue, newValue)) {
                // No change to `valueVersion` - old and new values are
                // semantically equivalent.
                node.value = oldValue;
                return;
            }
            node.value = newValue;
            node.version++;
        },
    };
})();

/**
 * Execute an arbitrary function in a non-reactive (non-tracking) context. The executed function
 * can, optionally, return a value.
 */
function untracked(nonReactiveReadsFn) {
    const prevConsumer = setActiveConsumer(null);
    // We are not trying to catch any particular errors here, just making sure that the consumers
    // stack is restored in case of errors.
    try {
        return nonReactiveReadsFn();
    }
    finally {
        setActiveConsumer(prevConsumer);
    }
}

const BASE_EFFECT_NODE = 
/* @__PURE__ */ (() => ({
    ...REACTIVE_NODE,
    consumerIsAlwaysLive: true,
    consumerAllowSignalWrites: true,
    dirty: true,
    hasRun: false,
    kind: 'effect',
}))();
function runEffect(node) {
    node.dirty = false;
    if (node.hasRun && !consumerPollProducersForChange(node)) {
        return;
    }
    node.hasRun = true;
    const prevNode = consumerBeforeComputation(node);
    try {
        node.cleanup();
        node.fn();
    }
    finally {
        consumerAfterComputation(node, prevNode);
    }
}

export { BASE_EFFECT_NODE, createLinkedSignal, linkedSignalSetFn, linkedSignalUpdateFn, runEffect, untracked };
//# sourceMappingURL=effect.mjs.map
