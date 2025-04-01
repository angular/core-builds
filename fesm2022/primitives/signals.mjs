/**
 * @license Angular v19.2.4+sha-b3c7282
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */

import { c as consumerMarkDirty, S as SIGNAL, a as consumerDestroy, i as isInNotificationPhase, b as consumerPollProducersForChange, d as consumerBeforeComputation, e as consumerAfterComputation, R as REACTIVE_NODE } from '../untracked-CS7WUAzb.mjs';
export { v as SIGNAL_NODE, f as createComputed, g as createLinkedSignal, w as createSignal, j as defaultEquals, k as getActiveConsumer, m as isReactive, l as linkedSignalSetFn, h as linkedSignalUpdateFn, p as producerAccessed, n as producerIncrementEpoch, o as producerMarkClean, q as producerNotifyConsumers, r as producerUpdateValueVersion, t as producerUpdatesAllowed, x as runPostSignalSetFn, u as setActiveConsumer, B as setAlternateWeakRefImpl, y as setPostSignalSetFn, s as setThrowInvalidWriteToSignalError, z as signalSetFn, A as signalUpdateFn, C as untracked } from '../untracked-CS7WUAzb.mjs';

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
