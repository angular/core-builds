/**
 * @license Angular v20.3.0+sha-9de50b1
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */

/**
 * The default equality function used for `signal` and `computed`, which uses referential equality.
 */
function defaultEquals(a, b) {
    return Object.is(a, b);
}

/**
 * The currently active consumer `ReactiveNode`, if running code in a reactive context.
 *
 * Change this via `setActiveConsumer`.
 */
let activeConsumer = null;
let inNotificationPhase = false;
/**
 * Global epoch counter. Incremented whenever a source signal is set.
 */
let epoch = 1;
/**
 * If set, called after a producer `ReactiveNode` is created.
 */
let postProducerCreatedFn = null;
/**
 * Symbol used to tell `Signal`s apart from other functions.
 *
 * This can be used to auto-unwrap signals in various cases, or to auto-wrap non-signal values.
 */
const SIGNAL = /* @__PURE__ */ Symbol('SIGNAL');
function setActiveConsumer(consumer) {
    const prev = activeConsumer;
    activeConsumer = consumer;
    return prev;
}
function getActiveConsumer() {
    return activeConsumer;
}
function isInNotificationPhase() {
    return inNotificationPhase;
}
function isReactive(value) {
    return value[SIGNAL] !== undefined;
}
const REACTIVE_NODE = {
    version: 0,
    lastCleanEpoch: 0,
    dirty: false,
    producers: undefined,
    producersTail: undefined,
    consumers: undefined,
    consumersTail: undefined,
    recomputing: false,
    consumerAllowSignalWrites: false,
    consumerIsAlwaysLive: false,
    kind: 'unknown',
    producerMustRecompute: () => false,
    producerRecomputeValue: () => { },
    consumerMarkedDirty: () => { },
    consumerOnSignalRead: () => { },
};
/**
 * Called by implementations when a producer's signal is read.
 */
function producerAccessed(node) {
    if (inNotificationPhase) {
        throw new Error(typeof ngDevMode !== 'undefined' && ngDevMode
            ? `Assertion error: signal read during notification phase`
            : '');
    }
    if (activeConsumer === null) {
        // Accessed outside of a reactive context, so nothing to record.
        return;
    }
    activeConsumer.consumerOnSignalRead(node);
    const prevProducerLink = activeConsumer.producersTail;
    // If the last producer we accessed is the same as the current one, we can skip adding a new
    // link
    if (prevProducerLink !== undefined && prevProducerLink.producer === node) {
        return;
    }
    let nextProducerLink = undefined;
    const isRecomputing = activeConsumer.recomputing;
    if (isRecomputing) {
        // If we're incrementally rebuilding the producers list, we want to check if the next producer
        // in the list is the same as the one we're trying to add.
        // If the previous producer is defined, then the next producer is just the one that follows it.
        // Otherwise, we should check the head of the producers list (the first node that we accessed the last time this consumer was run).
        nextProducerLink =
            prevProducerLink !== undefined ? prevProducerLink.nextProducer : activeConsumer.producers;
        if (nextProducerLink !== undefined && nextProducerLink.producer === node) {
            // If the next producer is the same as the one we're trying to add, we can just update the
            // last read version, update the tail of the producers list of this rerun, and return.
            activeConsumer.producersTail = nextProducerLink;
            nextProducerLink.lastReadVersion = node.version;
            return;
        }
    }
    const prevConsumerLink = node.consumersTail;
    // If the producer we're accessing already has a link to this consumer, we can skip adding a new
    // link. This can short circuit the creation of a new link in the case where the consumer reads alternating ReeactiveNodes
    if (prevConsumerLink !== undefined &&
        prevConsumerLink.consumer === activeConsumer &&
        // However, we have to make sure that the link we've discovered isn't from a node that is incrementally rebuilding its producer list
        (!isRecomputing || isValidLink(prevConsumerLink, activeConsumer))) {
        // If we found an existing link to the consumer we can just return.
        return;
    }
    // If we got here, it means that we need to create a new link between the producer and the consumer.
    const isLive = consumerIsLive(activeConsumer);
    const newLink = {
        producer: node,
        consumer: activeConsumer,
        // instead of eagerly destroying the previous link, we delay until we've finished recomputing
        // the producers list, so that we can destroy all of the old links at once.
        nextProducer: nextProducerLink,
        prevConsumer: prevConsumerLink,
        lastReadVersion: node.version,
        nextConsumer: undefined,
    };
    activeConsumer.producersTail = newLink;
    if (prevProducerLink !== undefined) {
        prevProducerLink.nextProducer = newLink;
    }
    else {
        activeConsumer.producers = newLink;
    }
    if (isLive) {
        producerAddLiveConsumer(node, newLink);
    }
}
/**
 * Increment the global epoch counter.
 *
 * Called by source producers (that is, not computeds) whenever their values change.
 */
function producerIncrementEpoch() {
    epoch++;
}
/**
 * Ensure this producer's `version` is up-to-date.
 */
function producerUpdateValueVersion(node) {
    if (consumerIsLive(node) && !node.dirty) {
        // A live consumer will be marked dirty by producers, so a clean state means that its version
        // is guaranteed to be up-to-date.
        return;
    }
    if (!node.dirty && node.lastCleanEpoch === epoch) {
        // Even non-live consumers can skip polling if they previously found themselves to be clean at
        // the current epoch, since their dependencies could not possibly have changed (such a change
        // would've increased the epoch).
        return;
    }
    if (!node.producerMustRecompute(node) && !consumerPollProducersForChange(node)) {
        // None of our producers report a change since the last time they were read, so no
        // recomputation of our value is necessary, and we can consider ourselves clean.
        producerMarkClean(node);
        return;
    }
    node.producerRecomputeValue(node);
    // After recomputing the value, we're no longer dirty.
    producerMarkClean(node);
}
/**
 * Propagate a dirty notification to live consumers of this producer.
 */
function producerNotifyConsumers(node) {
    if (node.consumers === undefined) {
        return;
    }
    // Prevent signal reads when we're updating the graph
    const prev = inNotificationPhase;
    inNotificationPhase = true;
    try {
        for (let link = node.consumers; link !== undefined; link = link.nextConsumer) {
            const consumer = link.consumer;
            if (!consumer.dirty) {
                consumerMarkDirty(consumer);
            }
        }
    }
    finally {
        inNotificationPhase = prev;
    }
}
/**
 * Whether this `ReactiveNode` in its producer capacity is currently allowed to initiate updates,
 * based on the current consumer context.
 */
function producerUpdatesAllowed() {
    return activeConsumer?.consumerAllowSignalWrites !== false;
}
function consumerMarkDirty(node) {
    node.dirty = true;
    producerNotifyConsumers(node);
    node.consumerMarkedDirty?.(node);
}
function producerMarkClean(node) {
    node.dirty = false;
    node.lastCleanEpoch = epoch;
}
/**
 * Prepare this consumer to run a computation in its reactive context and set
 * it as the active consumer.
 *
 * Must be called by subclasses which represent reactive computations, before those computations
 * begin.
 */
function consumerBeforeComputation(node) {
    if (node)
        resetConsumerBeforeComputation(node);
    return setActiveConsumer(node);
}
/**
 * Prepare this consumer to run a computation in its reactive context.
 *
 * We expose this mainly for code where we manually batch effects into a single
 * consumer. In those cases we may wish to "reopen" a consumer multiple times
 * in initial render before finalizing it. Most code should just call
 * `consumerBeforeComputation` instead of calling this directly.
 */
function resetConsumerBeforeComputation(node) {
    node.producersTail = undefined;
    node.recomputing = true;
}
/**
 * Finalize this consumer's state and set previous consumer as the active consumer after a
 * reactive computation has run.
 *
 * Must be called by subclasses which represent reactive computations, after those computations
 * have finished.
 */
function consumerAfterComputation(node, prevConsumer) {
    setActiveConsumer(prevConsumer);
    if (node)
        finalizeConsumerAfterComputation(node);
}
/**
 * Finalize this consumer's state after a reactive computation has run.
 *
 * We expose this mainly for code where we manually batch effects into a single
 * consumer. In those cases we may wish to "reopen" a consumer multiple times
 * in initial render before finalizing it. Most code should just call
 * `consumerAfterComputation` instead of calling this directly.
 */
function finalizeConsumerAfterComputation(node) {
    node.recomputing = false;
    // We've finished incrementally rebuilding the producers list, now if there are any producers
    // that are after producersTail, they are stale and should be removed.
    const producersTail = node.producersTail;
    let toRemove = producersTail !== undefined ? producersTail.nextProducer : node.producers;
    if (toRemove !== undefined) {
        if (consumerIsLive(node)) {
            // For each stale link, we first unlink it from the producers list of consumers
            do {
                toRemove = producerRemoveLiveConsumerLink(toRemove);
            } while (toRemove !== undefined);
        }
        // Now, we can truncate the producers list to remove all stale links.
        if (producersTail !== undefined) {
            producersTail.nextProducer = undefined;
        }
        else {
            node.producers = undefined;
        }
    }
}
/**
 * Determine whether this consumer has any dependencies which have changed since the last time
 * they were read.
 */
function consumerPollProducersForChange(node) {
    // Poll producers for change.
    for (let link = node.producers; link !== undefined; link = link.nextProducer) {
        const producer = link.producer;
        const seenVersion = link.lastReadVersion;
        // First check the versions. A mismatch means that the producer's value is known to have
        // changed since the last time we read it.
        if (seenVersion !== producer.version) {
            return true;
        }
        // The producer's version is the same as the last time we read it, but it might itself be
        // stale. Force the producer to recompute its version (calculating a new value if necessary).
        producerUpdateValueVersion(producer);
        // Now when we do this check, `producer.version` is guaranteed to be up to date, so if the
        // versions still match then it has not changed since the last time we read it.
        if (seenVersion !== producer.version) {
            return true;
        }
    }
    return false;
}
/**
 * Disconnect this consumer from the graph.
 */
function consumerDestroy(node) {
    if (consumerIsLive(node)) {
        // Drop all connections from the graph to this node.
        let link = node.producers;
        while (link !== undefined) {
            link = producerRemoveLiveConsumerLink(link);
        }
    }
    // Truncate all the linked lists to drop all connection from this node to the graph.
    node.producers = undefined;
    node.producersTail = undefined;
    node.consumers = undefined;
    node.consumersTail = undefined;
}
/**
 * Add `consumer` as a live consumer of this node.
 *
 * Note that this operation is potentially transitive. If this node becomes live, then it becomes
 * a live consumer of all of its current producers.
 */
function producerAddLiveConsumer(node, link) {
    const consumersTail = node.consumersTail;
    const wasLive = consumerIsLive(node);
    if (consumersTail !== undefined) {
        link.nextConsumer = consumersTail.nextConsumer;
        consumersTail.nextConsumer = link;
    }
    else {
        link.nextConsumer = undefined;
        node.consumers = link;
    }
    link.prevConsumer = consumersTail;
    node.consumersTail = link;
    if (!wasLive) {
        for (let link = node.producers; link !== undefined; link = link.nextProducer) {
            producerAddLiveConsumer(link.producer, link);
        }
    }
}
function producerRemoveLiveConsumerLink(link) {
    const producer = link.producer;
    const nextProducer = link.nextProducer;
    const nextConsumer = link.nextConsumer;
    const prevConsumer = link.prevConsumer;
    link.nextConsumer = undefined;
    link.prevConsumer = undefined;
    if (nextConsumer !== undefined) {
        nextConsumer.prevConsumer = prevConsumer;
    }
    else {
        producer.consumersTail = prevConsumer;
    }
    if (prevConsumer !== undefined) {
        prevConsumer.nextConsumer = nextConsumer;
    }
    else {
        producer.consumers = nextConsumer;
        if (!consumerIsLive(producer)) {
            let producerLink = producer.producers;
            while (producerLink !== undefined) {
                producerLink = producerRemoveLiveConsumerLink(producerLink);
            }
        }
    }
    return nextProducer;
}
function consumerIsLive(node) {
    return node.consumerIsAlwaysLive || node.consumers !== undefined;
}
function runPostProducerCreatedFn(node) {
    postProducerCreatedFn?.(node);
}
function setPostProducerCreatedFn(fn) {
    const prev = postProducerCreatedFn;
    postProducerCreatedFn = fn;
    return prev;
}
// While a ReactiveNode is recomputing, it may not have destroyed previous links
// This allows us to check if a given link will be destroyed by a reactivenode if it were to finish running immediately without accesing any more producers
function isValidLink(checkLink, consumer) {
    const producersTail = consumer.producersTail;
    if (producersTail !== undefined) {
        let link = consumer.producers;
        do {
            if (link === checkLink) {
                return true;
            }
            if (link === producersTail) {
                break;
            }
            link = link.nextProducer;
        } while (link !== undefined);
    }
    return false;
}

/**
 * Create a computed signal which derives a reactive value from an expression.
 */
function createComputed(computation, equal) {
    const node = Object.create(COMPUTED_NODE);
    node.computation = computation;
    if (equal !== undefined) {
        node.equal = equal;
    }
    const computed = () => {
        // Check if the value needs updating before returning it.
        producerUpdateValueVersion(node);
        // Record that someone looked at this signal.
        producerAccessed(node);
        if (node.value === ERRORED) {
            throw node.error;
        }
        return node.value;
    };
    computed[SIGNAL] = node;
    if (typeof ngDevMode !== 'undefined' && ngDevMode) {
        const debugName = node.debugName ? ' (' + node.debugName + ')' : '';
        computed.toString = () => `[Computed${debugName}: ${node.value}]`;
    }
    runPostProducerCreatedFn(node);
    return computed;
}
/**
 * A dedicated symbol used before a computed value has been calculated for the first time.
 * Explicitly typed as `any` so we can use it as signal's value.
 */
const UNSET = /* @__PURE__ */ Symbol('UNSET');
/**
 * A dedicated symbol used in place of a computed signal value to indicate that a given computation
 * is in progress. Used to detect cycles in computation chains.
 * Explicitly typed as `any` so we can use it as signal's value.
 */
const COMPUTING = /* @__PURE__ */ Symbol('COMPUTING');
/**
 * A dedicated symbol used in place of a computed signal value to indicate that a given computation
 * failed. The thrown error is cached until the computation gets dirty again.
 * Explicitly typed as `any` so we can use it as signal's value.
 */
const ERRORED = /* @__PURE__ */ Symbol('ERRORED');
// Note: Using an IIFE here to ensure that the spread assignment is not considered
// a side-effect, ending up preserving `COMPUTED_NODE` and `REACTIVE_NODE`.
// TODO: remove when https://github.com/evanw/esbuild/issues/3392 is resolved.
const COMPUTED_NODE = /* @__PURE__ */ (() => {
    return {
        ...REACTIVE_NODE,
        value: UNSET,
        dirty: true,
        error: null,
        equal: defaultEquals,
        kind: 'computed',
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
            let wasEqual = false;
            try {
                newValue = node.computation();
                // We want to mark this node as errored if calling `equal` throws; however, we don't want
                // to track any reactive reads inside `equal`.
                setActiveConsumer(null);
                wasEqual =
                    oldValue !== UNSET &&
                        oldValue !== ERRORED &&
                        newValue !== ERRORED &&
                        node.equal(oldValue, newValue);
            }
            catch (err) {
                newValue = ERRORED;
                node.error = err;
            }
            finally {
                consumerAfterComputation(node, prevConsumer);
            }
            if (wasEqual) {
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

function defaultThrowError() {
    throw new Error();
}
let throwInvalidWriteToSignalErrorFn = defaultThrowError;
function throwInvalidWriteToSignalError(node) {
    throwInvalidWriteToSignalErrorFn(node);
}
function setThrowInvalidWriteToSignalError(fn) {
    throwInvalidWriteToSignalErrorFn = fn;
}

/**
 * If set, called after `WritableSignal`s are updated.
 *
 * This hook can be used to achieve various effects, such as running effects synchronously as part
 * of setting a signal.
 */
let postSignalSetFn = null;
/**
 * Creates a `Signal` getter, setter, and updater function.
 */
function createSignal(initialValue, equal) {
    const node = Object.create(SIGNAL_NODE);
    node.value = initialValue;
    if (equal !== undefined) {
        node.equal = equal;
    }
    const getter = (() => signalGetFn(node));
    getter[SIGNAL] = node;
    if (typeof ngDevMode !== 'undefined' && ngDevMode) {
        const debugName = node.debugName ? ' (' + node.debugName + ')' : '';
        getter.toString = () => `[Signal${debugName}: ${node.value}]`;
    }
    runPostProducerCreatedFn(node);
    const set = (newValue) => signalSetFn(node, newValue);
    const update = (updateFn) => signalUpdateFn(node, updateFn);
    return [getter, set, update];
}
function setPostSignalSetFn(fn) {
    const prev = postSignalSetFn;
    postSignalSetFn = fn;
    return prev;
}
function signalGetFn(node) {
    producerAccessed(node);
    return node.value;
}
function signalSetFn(node, newValue) {
    if (!producerUpdatesAllowed()) {
        throwInvalidWriteToSignalError(node);
    }
    if (!node.equal(node.value, newValue)) {
        node.value = newValue;
        signalValueChanged(node);
    }
}
function signalUpdateFn(node, updater) {
    if (!producerUpdatesAllowed()) {
        throwInvalidWriteToSignalError(node);
    }
    signalSetFn(node, updater(node.value));
}
function runPostSignalSetFn(node) {
    postSignalSetFn?.(node);
}
// Note: Using an IIFE here to ensure that the spread assignment is not considered
// a side-effect, ending up preserving `COMPUTED_NODE` and `REACTIVE_NODE`.
// TODO: remove when https://github.com/evanw/esbuild/issues/3392 is resolved.
const SIGNAL_NODE = /* @__PURE__ */ (() => {
    return {
        ...REACTIVE_NODE,
        equal: defaultEquals,
        value: undefined,
        kind: 'signal',
    };
})();
function signalValueChanged(node) {
    node.version++;
    producerIncrementEpoch();
    producerNotifyConsumers(node);
    postSignalSetFn?.(node);
}

export { COMPUTING, ERRORED, REACTIVE_NODE, SIGNAL, SIGNAL_NODE, UNSET, consumerAfterComputation, consumerBeforeComputation, consumerDestroy, consumerMarkDirty, consumerPollProducersForChange, createComputed, createSignal, defaultEquals, finalizeConsumerAfterComputation, getActiveConsumer, isInNotificationPhase, isReactive, producerAccessed, producerIncrementEpoch, producerMarkClean, producerNotifyConsumers, producerUpdateValueVersion, producerUpdatesAllowed, resetConsumerBeforeComputation, runPostProducerCreatedFn, runPostSignalSetFn, setActiveConsumer, setPostProducerCreatedFn, setPostSignalSetFn, setThrowInvalidWriteToSignalError, signalGetFn, signalSetFn, signalUpdateFn };
//# sourceMappingURL=signal.mjs.map
