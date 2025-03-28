/**
 * @license Angular v20.0.0-next.4+sha-cbd6ec8
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */

import { c as consumerMarkDirty, S as SIGNAL, a as consumerDestroy, i as isInNotificationPhase, b as consumerPollProducersForChange, d as consumerBeforeComputation, e as consumerAfterComputation, R as REACTIVE_NODE } from '../signal-CCmjQ6F4.mjs';
export { u as SIGNAL_NODE, f as createComputed, v as createSignal, g as defaultEquals, h as getActiveConsumer, j as isReactive, p as producerAccessed, k as producerIncrementEpoch, l as producerMarkClean, m as producerNotifyConsumers, n as producerUpdateValueVersion, o as producerUpdatesAllowed, r as runPostProducerCreatedFn, w as runPostSignalSetFn, q as setActiveConsumer, t as setPostProducerCreatedFn, x as setPostSignalSetFn, s as setThrowInvalidWriteToSignalError, y as signalSetFn, z as signalUpdateFn } from '../signal-CCmjQ6F4.mjs';
export { c as createLinkedSignal, l as linkedSignalSetFn, a as linkedSignalUpdateFn, u as untracked } from '../untracked-q3e9vBkl.mjs';
export { s as setAlternateWeakRefImpl } from '../weak_ref-DrMdAIDh.mjs';

function createWatch(fn, schedule, allowSignalWrites) {
    const node = Object.create(WATCH_NODE);
    if (allowSignalWrites) {
        node.consumerAllowSignalWrites = true;
    }
    node.fn = fn;
    node.schedule = schedule;
    const registerOnCleanup = (cleanupFn) => {
        node.cleanupFn = cleanupFn;
    };
    function isWatchNodeDestroyed(node) {
        return node.fn === null && node.schedule === null;
    }
    function destroyWatchNode(node) {
        if (!isWatchNodeDestroyed(node)) {
            consumerDestroy(node); // disconnect watcher from the reactive graph
            node.cleanupFn();
            // nullify references to the integration functions to mark node as destroyed
            node.fn = null;
            node.schedule = null;
            node.cleanupFn = NOOP_CLEANUP_FN;
        }
    }
    const run = () => {
        if (node.fn === null) {
            // trying to run a destroyed watch is noop
            return;
        }
        if (isInNotificationPhase()) {
            throw new Error(`Schedulers cannot synchronously execute watches while scheduling.`);
        }
        node.dirty = false;
        if (node.hasRun && !consumerPollProducersForChange(node)) {
            return;
        }
        node.hasRun = true;
        const prevConsumer = consumerBeforeComputation(node);
        try {
            node.cleanupFn();
            node.cleanupFn = NOOP_CLEANUP_FN;
            node.fn(registerOnCleanup);
        }
        finally {
            consumerAfterComputation(node, prevConsumer);
        }
    };
    node.ref = {
        notify: () => consumerMarkDirty(node),
        run,
        cleanup: () => node.cleanupFn(),
        destroy: () => destroyWatchNode(node),
        [SIGNAL]: node,
    };
    return node.ref;
}
const NOOP_CLEANUP_FN = () => { };
// Note: Using an IIFE here to ensure that the spread assignment is not considered
// a side-effect, ending up preserving `COMPUTED_NODE` and `REACTIVE_NODE`.
// TODO: remove when https://github.com/evanw/esbuild/issues/3392 is resolved.
const WATCH_NODE = /* @__PURE__ */ (() => {
    return {
        ...REACTIVE_NODE,
        consumerIsAlwaysLive: true,
        consumerAllowSignalWrites: false,
        consumerMarkedDirty: (node) => {
            if (node.schedule !== null) {
                node.schedule(node.ref);
            }
        },
        hasRun: false,
        cleanupFn: NOOP_CLEANUP_FN,
    };
})();

export { REACTIVE_NODE, SIGNAL, consumerAfterComputation, consumerBeforeComputation, consumerDestroy, consumerMarkDirty, consumerPollProducersForChange, createWatch, isInNotificationPhase };
//# sourceMappingURL=signals.mjs.map
