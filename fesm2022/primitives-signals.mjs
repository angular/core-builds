/**
 * @license Angular v21.0.0-next.6+sha-8146fc2
 * (c) 2010-2025 Google LLC. https://angular.dev/
 * License: MIT
 */

import { SIGNAL, consumerMarkDirty, REACTIVE_NODE, consumerDestroy, isInNotificationPhase, consumerPollProducersForChange, consumerBeforeComputation, consumerAfterComputation } from './_signal-chunk.mjs';
export { SIGNAL_NODE, createComputed, createSignal, defaultEquals, finalizeConsumerAfterComputation, getActiveConsumer, isReactive, producerAccessed, producerIncrementEpoch, producerMarkClean, producerNotifyConsumers, producerUpdateValueVersion, producerUpdatesAllowed, resetConsumerBeforeComputation, runPostProducerCreatedFn, runPostSignalSetFn, setActiveConsumer, setPostProducerCreatedFn, setPostSignalSetFn, setThrowInvalidWriteToSignalError, signalGetFn, signalSetFn, signalUpdateFn } from './_signal-chunk.mjs';
export { BASE_EFFECT_NODE, createLinkedSignal, linkedSignalSetFn, linkedSignalUpdateFn, runEffect, untracked } from './_effect-chunk.mjs';
export { setAlternateWeakRefImpl } from './_weak_ref-chunk.mjs';

/**
 * A custom formatter which renders signals in an easy-to-read format.
 *
 * @see https://firefox-source-docs.mozilla.org/devtools-user/custom_formatters/index.html
 */
const formatter = {
    /**
     *  If the function returns `null`, the formatter is not used for this reference
     */
    header: (sig, config) => {
        if (!isSignal(sig) || config?.ngSkipFormatting)
            return null;
        let value;
        try {
            value = sig();
        }
        catch {
            // In case the signl throws, we don't want to break the formatting.
            return ['span', 'Signal(⚠️ Error)'];
        }
        const kind = 'computation' in sig[SIGNAL] ? 'Computed' : 'Signal';
        const isPrimitive = value === null || (!Array.isArray(value) && typeof value !== 'object');
        return [
            'span',
            {},
            ['span', {}, `${kind}(`],
            (() => {
                if (isSignal(value)) {
                    // Recursively call formatter. Could return an `object` to call the formatter through DevTools,
                    // but then recursive signals will render multiple expando arrows which is an awkward UX.
                    return formatter.header(value, config);
                }
                else if (isPrimitive && value !== undefined && typeof value !== 'function') {
                    // Use built-in rendering for primitives which applies standard syntax highlighting / theming.
                    // Can't do this for `undefined` however, as the browser thinks we forgot to provide an object.
                    // Also don't want to do this for functions which render nested expando arrows.
                    return ['object', { object: value }];
                }
                else {
                    return prettifyPreview(value);
                }
            })(),
            ['span', {}, `)`],
        ];
    },
    hasBody: (sig, config) => {
        if (!isSignal(sig))
            return false;
        try {
            sig();
        }
        catch {
            return false;
        }
        return !config?.ngSkipFormatting;
    },
    body: (sig, config) => {
        // We can use sys colors to fit the current DevTools theme.
        // Those are unfortunately only available on Chromium-based browsers.
        // On Firefow we fall back to the default color
        const color = 'var(--sys-color-primary)';
        return [
            'div',
            { style: `background: #FFFFFF10; padding-left: 4px; padding-top: 2px; padding-bottom: 2px;` },
            ['div', { style: `color: ${color}` }, 'Signal value: '],
            ['div', { style: `padding-left: .5rem;` }, ['object', { object: sig(), config }]],
            ['div', { style: `color: ${color}` }, 'Signal function: '],
            [
                'div',
                { style: `padding-left: .5rem;` },
                ['object', { object: sig, config: { ...config, skipFormatting: true } }],
            ],
        ];
    },
};
function prettifyPreview(value) {
    if (value === null)
        return 'null';
    if (Array.isArray(value))
        return `Array(${value.length})`;
    if (value instanceof Element)
        return `<${value.tagName.toLowerCase()}>`;
    if (value instanceof URL)
        return `URL`;
    switch (typeof value) {
        case 'undefined': {
            return 'undefined';
        }
        case 'function': {
            if ('prototype' in value) {
                // This is what Chrome renders, can't use `object` though because it creates a nested expando arrow.
                return 'class';
            }
            else {
                return '() => {…}';
            }
        }
        case 'object': {
            if (value.constructor.name === 'Object') {
                return '{…}';
            }
            else {
                return `${value.constructor.name} {}`;
            }
        }
        default: {
            return ['object', { object: value, config: { skipFormatting: true } }];
        }
    }
}
function isSignal(value) {
    return value[SIGNAL] !== undefined;
}
/**
 * Installs the custom formatter into custom formatting on Signals in the devtools.
 *
 * Supported by both Chrome and Firefox.
 *
 * @see https://firefox-source-docs.mozilla.org/devtools-user/custom_formatters/index.html
 */
function installDevToolsSignalFormatter() {
    globalThis.devtoolsFormatters ??= [];
    if (!globalThis.devtoolsFormatters.some((f) => f === formatter)) {
        globalThis.devtoolsFormatters.push(formatter);
    }
}

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
            throw new Error(typeof ngDevMode !== 'undefined' && ngDevMode
                ? 'Schedulers cannot synchronously execute watches while scheduling.'
                : '');
        }
        node.dirty = false;
        if (node.version > 0 && !consumerPollProducersForChange(node)) {
            return;
        }
        node.version++;
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
        cleanupFn: NOOP_CLEANUP_FN,
    };
})();

// We're using a top-level access to enable signal formatting whenever the signals package is loaded.
if (typeof ngDevMode !== 'undefined' && ngDevMode) {
    // tslint:disable-next-line: no-toplevel-property-access
    installDevToolsSignalFormatter();
}

export { REACTIVE_NODE, SIGNAL, consumerAfterComputation, consumerBeforeComputation, consumerDestroy, consumerMarkDirty, consumerPollProducersForChange, createWatch, installDevToolsSignalFormatter, isInNotificationPhase };
//# sourceMappingURL=primitives-signals.mjs.map
