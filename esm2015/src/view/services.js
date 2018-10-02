/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { DebugElement, DebugNode, EventListener, getDebugNode, indexDebugNode, removeDebugNodeFromIndex } from '../debug/debug_node';
import { getInjectableDef } from '../di/defs';
import { ErrorHandler } from '../error_handler';
import { isDevMode } from '../is_dev_mode';
import { RendererFactory2 } from '../render/api';
import { Sanitizer } from '../sanitization/security';
import { tokenKey } from '../view/util';
import { isViewDebugError, viewDestroyedError, viewWrappedDebugError } from './errors';
import { resolveDep } from './provider';
import { dirtyParentQueries, getQueryValue } from './query';
import { createInjector, createNgModuleRef, getComponentViewDefinitionFactory } from './refs';
import { Services, asElementData, asPureExpressionData } from './types';
import { NOOP, isComponentView, renderNode, resolveDefinition, splitDepsDsl, viewParentEl } from './util';
import { checkAndUpdateNode, checkAndUpdateView, checkNoChangesNode, checkNoChangesView, createComponentView, createEmbeddedView, createRootView, destroyView } from './view';
/** @type {?} */
let initialized = false;
/**
 * @return {?}
 */
export function initServicesIfNeeded() {
    if (initialized) {
        return;
    }
    initialized = true;
    /** @type {?} */
    const services = isDevMode() ? createDebugServices() : createProdServices();
    Services.setCurrentNode = services.setCurrentNode;
    Services.createRootView = services.createRootView;
    Services.createEmbeddedView = services.createEmbeddedView;
    Services.createComponentView = services.createComponentView;
    Services.createNgModuleRef = services.createNgModuleRef;
    Services.overrideProvider = services.overrideProvider;
    Services.overrideComponentView = services.overrideComponentView;
    Services.clearOverrides = services.clearOverrides;
    Services.checkAndUpdateView = services.checkAndUpdateView;
    Services.checkNoChangesView = services.checkNoChangesView;
    Services.destroyView = services.destroyView;
    Services.resolveDep = resolveDep;
    Services.createDebugContext = services.createDebugContext;
    Services.handleEvent = services.handleEvent;
    Services.updateDirectives = services.updateDirectives;
    Services.updateRenderer = services.updateRenderer;
    Services.dirtyParentQueries = dirtyParentQueries;
}
/**
 * @return {?}
 */
function createProdServices() {
    return {
        setCurrentNode: () => { },
        createRootView: createProdRootView,
        createEmbeddedView: createEmbeddedView,
        createComponentView: createComponentView,
        createNgModuleRef: createNgModuleRef,
        overrideProvider: NOOP,
        overrideComponentView: NOOP,
        clearOverrides: NOOP,
        checkAndUpdateView: checkAndUpdateView,
        checkNoChangesView: checkNoChangesView,
        destroyView: destroyView,
        createDebugContext: (view, nodeIndex) => new DebugContext_(view, nodeIndex),
        handleEvent: (view, nodeIndex, eventName, event) => view.def.handleEvent(view, nodeIndex, eventName, event),
        updateDirectives: (view, checkType) => view.def.updateDirectives(checkType === 0 /* CheckAndUpdate */ ? prodCheckAndUpdateNode :
            prodCheckNoChangesNode, view),
        updateRenderer: (view, checkType) => view.def.updateRenderer(checkType === 0 /* CheckAndUpdate */ ? prodCheckAndUpdateNode :
            prodCheckNoChangesNode, view),
    };
}
/**
 * @return {?}
 */
function createDebugServices() {
    return {
        setCurrentNode: debugSetCurrentNode,
        createRootView: debugCreateRootView,
        createEmbeddedView: debugCreateEmbeddedView,
        createComponentView: debugCreateComponentView,
        createNgModuleRef: debugCreateNgModuleRef,
        overrideProvider: debugOverrideProvider,
        overrideComponentView: debugOverrideComponentView,
        clearOverrides: debugClearOverrides,
        checkAndUpdateView: debugCheckAndUpdateView,
        checkNoChangesView: debugCheckNoChangesView,
        destroyView: debugDestroyView,
        createDebugContext: (view, nodeIndex) => new DebugContext_(view, nodeIndex),
        handleEvent: debugHandleEvent,
        updateDirectives: debugUpdateDirectives,
        updateRenderer: debugUpdateRenderer,
    };
}
/**
 * @param {?} elInjector
 * @param {?} projectableNodes
 * @param {?} rootSelectorOrNode
 * @param {?} def
 * @param {?} ngModule
 * @param {?=} context
 * @return {?}
 */
function createProdRootView(elInjector, projectableNodes, rootSelectorOrNode, def, ngModule, context) {
    /** @type {?} */
    const rendererFactory = ngModule.injector.get(RendererFactory2);
    return createRootView(createRootData(elInjector, ngModule, rendererFactory, projectableNodes, rootSelectorOrNode), def, context);
}
/**
 * @param {?} elInjector
 * @param {?} projectableNodes
 * @param {?} rootSelectorOrNode
 * @param {?} def
 * @param {?} ngModule
 * @param {?=} context
 * @return {?}
 */
function debugCreateRootView(elInjector, projectableNodes, rootSelectorOrNode, def, ngModule, context) {
    /** @type {?} */
    const rendererFactory = ngModule.injector.get(RendererFactory2);
    /** @type {?} */
    const root = createRootData(elInjector, ngModule, new DebugRendererFactory2(rendererFactory), projectableNodes, rootSelectorOrNode);
    /** @type {?} */
    const defWithOverride = applyProviderOverridesToView(def);
    return callWithDebugContext(DebugAction.create, createRootView, null, [root, defWithOverride, context]);
}
/**
 * @param {?} elInjector
 * @param {?} ngModule
 * @param {?} rendererFactory
 * @param {?} projectableNodes
 * @param {?} rootSelectorOrNode
 * @return {?}
 */
function createRootData(elInjector, ngModule, rendererFactory, projectableNodes, rootSelectorOrNode) {
    /** @type {?} */
    const sanitizer = ngModule.injector.get(Sanitizer);
    /** @type {?} */
    const errorHandler = ngModule.injector.get(ErrorHandler);
    /** @type {?} */
    const renderer = rendererFactory.createRenderer(null, null);
    return {
        ngModule,
        injector: elInjector, projectableNodes,
        selectorOrNode: rootSelectorOrNode, sanitizer, rendererFactory, renderer, errorHandler
    };
}
/**
 * @param {?} parentView
 * @param {?} anchorDef
 * @param {?} viewDef
 * @param {?=} context
 * @return {?}
 */
function debugCreateEmbeddedView(parentView, anchorDef, viewDef, context) {
    /** @type {?} */
    const defWithOverride = applyProviderOverridesToView(viewDef);
    return callWithDebugContext(DebugAction.create, createEmbeddedView, null, [parentView, anchorDef, defWithOverride, context]);
}
/**
 * @param {?} parentView
 * @param {?} nodeDef
 * @param {?} viewDef
 * @param {?} hostElement
 * @return {?}
 */
function debugCreateComponentView(parentView, nodeDef, viewDef, hostElement) {
    /** @type {?} */
    const overrideComponentView = viewDefOverrides.get(/** @type {?} */ ((/** @type {?} */ ((/** @type {?} */ ((nodeDef.element)).componentProvider)).provider)).token);
    if (overrideComponentView) {
        viewDef = overrideComponentView;
    }
    else {
        viewDef = applyProviderOverridesToView(viewDef);
    }
    return callWithDebugContext(DebugAction.create, createComponentView, null, [parentView, nodeDef, viewDef, hostElement]);
}
/**
 * @param {?} moduleType
 * @param {?} parentInjector
 * @param {?} bootstrapComponents
 * @param {?} def
 * @return {?}
 */
function debugCreateNgModuleRef(moduleType, parentInjector, bootstrapComponents, def) {
    /** @type {?} */
    const defWithOverride = applyProviderOverridesToNgModule(def);
    return createNgModuleRef(moduleType, parentInjector, bootstrapComponents, defWithOverride);
}
/** @type {?} */
const providerOverrides = new Map();
/** @type {?} */
const providerOverridesWithScope = new Map();
/** @type {?} */
const viewDefOverrides = new Map();
/**
 * @param {?} override
 * @return {?}
 */
function debugOverrideProvider(override) {
    providerOverrides.set(override.token, override);
    /** @type {?} */
    let injectableDef;
    if (typeof override.token === 'function' && (injectableDef = getInjectableDef(override.token)) &&
        typeof injectableDef.providedIn === 'function') {
        providerOverridesWithScope.set(/** @type {?} */ (override.token), override);
    }
}
/**
 * @param {?} comp
 * @param {?} compFactory
 * @return {?}
 */
function debugOverrideComponentView(comp, compFactory) {
    /** @type {?} */
    const hostViewDef = resolveDefinition(getComponentViewDefinitionFactory(compFactory));
    /** @type {?} */
    const compViewDef = resolveDefinition(/** @type {?} */ ((/** @type {?} */ ((hostViewDef.nodes[0].element)).componentView)));
    viewDefOverrides.set(comp, compViewDef);
}
/**
 * @return {?}
 */
function debugClearOverrides() {
    providerOverrides.clear();
    providerOverridesWithScope.clear();
    viewDefOverrides.clear();
}
/**
 * @param {?} def
 * @return {?}
 */
function applyProviderOverridesToView(def) {
    if (providerOverrides.size === 0) {
        return def;
    }
    /** @type {?} */
    const elementIndicesWithOverwrittenProviders = findElementIndicesWithOverwrittenProviders(def);
    if (elementIndicesWithOverwrittenProviders.length === 0) {
        return def;
    }
    // clone the whole view definition,
    // as it maintains references between the nodes that are hard to update.
    def = /** @type {?} */ ((def.factory))(() => NOOP);
    for (let i = 0; i < elementIndicesWithOverwrittenProviders.length; i++) {
        applyProviderOverridesToElement(def, elementIndicesWithOverwrittenProviders[i]);
    }
    return def;
    /**
     * @param {?} def
     * @return {?}
     */
    function findElementIndicesWithOverwrittenProviders(def) {
        /** @type {?} */
        const elIndicesWithOverwrittenProviders = [];
        /** @type {?} */
        let lastElementDef = null;
        for (let i = 0; i < def.nodes.length; i++) {
            /** @type {?} */
            const nodeDef = def.nodes[i];
            if (nodeDef.flags & 1 /* TypeElement */) {
                lastElementDef = nodeDef;
            }
            if (lastElementDef && nodeDef.flags & 3840 /* CatProviderNoDirective */ &&
                providerOverrides.has(/** @type {?} */ ((nodeDef.provider)).token)) {
                elIndicesWithOverwrittenProviders.push(/** @type {?} */ ((lastElementDef)).nodeIndex);
                lastElementDef = null;
            }
        }
        return elIndicesWithOverwrittenProviders;
    }
    /**
     * @param {?} viewDef
     * @param {?} elIndex
     * @return {?}
     */
    function applyProviderOverridesToElement(viewDef, elIndex) {
        for (let i = elIndex + 1; i < viewDef.nodes.length; i++) {
            /** @type {?} */
            const nodeDef = viewDef.nodes[i];
            if (nodeDef.flags & 1 /* TypeElement */) {
                // stop at the next element
                return;
            }
            if (nodeDef.flags & 3840 /* CatProviderNoDirective */) {
                /** @type {?} */
                const provider = /** @type {?} */ ((nodeDef.provider));
                /** @type {?} */
                const override = providerOverrides.get(provider.token);
                if (override) {
                    nodeDef.flags = (nodeDef.flags & ~3840 /* CatProviderNoDirective */) | override.flags;
                    provider.deps = splitDepsDsl(override.deps);
                    provider.value = override.value;
                }
            }
        }
    }
}
/**
 * @param {?} def
 * @return {?}
 */
function applyProviderOverridesToNgModule(def) {
    const { hasOverrides, hasDeprecatedOverrides } = calcHasOverrides(def);
    if (!hasOverrides) {
        return def;
    }
    // clone the whole view definition,
    // as it maintains references between the nodes that are hard to update.
    def = /** @type {?} */ ((def.factory))(() => NOOP);
    applyProviderOverrides(def);
    return def;
    /**
     * @param {?} def
     * @return {?}
     */
    function calcHasOverrides(def) {
        /** @type {?} */
        let hasOverrides = false;
        /** @type {?} */
        let hasDeprecatedOverrides = false;
        if (providerOverrides.size === 0) {
            return { hasOverrides, hasDeprecatedOverrides };
        }
        def.providers.forEach(node => {
            /** @type {?} */
            const override = providerOverrides.get(node.token);
            if ((node.flags & 3840 /* CatProviderNoDirective */) && override) {
                hasOverrides = true;
                hasDeprecatedOverrides = hasDeprecatedOverrides || override.deprecatedBehavior;
            }
        });
        def.modules.forEach(module => {
            providerOverridesWithScope.forEach((override, token) => {
                if (/** @type {?} */ ((getInjectableDef(token))).providedIn === module) {
                    hasOverrides = true;
                    hasDeprecatedOverrides = hasDeprecatedOverrides || override.deprecatedBehavior;
                }
            });
        });
        return { hasOverrides, hasDeprecatedOverrides };
    }
    /**
     * @param {?} def
     * @return {?}
     */
    function applyProviderOverrides(def) {
        for (let i = 0; i < def.providers.length; i++) {
            /** @type {?} */
            const provider = def.providers[i];
            if (hasDeprecatedOverrides) {
                // We had a bug where me made
                // all providers lazy. Keep this logic behind a flag
                // for migrating existing users.
                provider.flags |= 4096 /* LazyProvider */;
            }
            /** @type {?} */
            const override = providerOverrides.get(provider.token);
            if (override) {
                provider.flags = (provider.flags & ~3840 /* CatProviderNoDirective */) | override.flags;
                provider.deps = splitDepsDsl(override.deps);
                provider.value = override.value;
            }
        }
        if (providerOverridesWithScope.size > 0) {
            /** @type {?} */
            let moduleSet = new Set(def.modules);
            providerOverridesWithScope.forEach((override, token) => {
                if (moduleSet.has(/** @type {?} */ ((getInjectableDef(token))).providedIn)) {
                    /** @type {?} */
                    let provider = {
                        token: token,
                        flags: override.flags | (hasDeprecatedOverrides ? 4096 /* LazyProvider */ : 0 /* None */),
                        deps: splitDepsDsl(override.deps),
                        value: override.value,
                        index: def.providers.length,
                    };
                    def.providers.push(provider);
                    def.providersByKey[tokenKey(token)] = provider;
                }
            });
        }
    }
}
/**
 * @param {?} view
 * @param {?} checkIndex
 * @param {?} argStyle
 * @param {?=} v0
 * @param {?=} v1
 * @param {?=} v2
 * @param {?=} v3
 * @param {?=} v4
 * @param {?=} v5
 * @param {?=} v6
 * @param {?=} v7
 * @param {?=} v8
 * @param {?=} v9
 * @return {?}
 */
function prodCheckAndUpdateNode(view, checkIndex, argStyle, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9) {
    /** @type {?} */
    const nodeDef = view.def.nodes[checkIndex];
    checkAndUpdateNode(view, nodeDef, argStyle, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9);
    return (nodeDef.flags & 224 /* CatPureExpression */) ?
        asPureExpressionData(view, checkIndex).value :
        undefined;
}
/**
 * @param {?} view
 * @param {?} checkIndex
 * @param {?} argStyle
 * @param {?=} v0
 * @param {?=} v1
 * @param {?=} v2
 * @param {?=} v3
 * @param {?=} v4
 * @param {?=} v5
 * @param {?=} v6
 * @param {?=} v7
 * @param {?=} v8
 * @param {?=} v9
 * @return {?}
 */
function prodCheckNoChangesNode(view, checkIndex, argStyle, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9) {
    /** @type {?} */
    const nodeDef = view.def.nodes[checkIndex];
    checkNoChangesNode(view, nodeDef, argStyle, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9);
    return (nodeDef.flags & 224 /* CatPureExpression */) ?
        asPureExpressionData(view, checkIndex).value :
        undefined;
}
/**
 * @param {?} view
 * @return {?}
 */
function debugCheckAndUpdateView(view) {
    return callWithDebugContext(DebugAction.detectChanges, checkAndUpdateView, null, [view]);
}
/**
 * @param {?} view
 * @return {?}
 */
function debugCheckNoChangesView(view) {
    return callWithDebugContext(DebugAction.checkNoChanges, checkNoChangesView, null, [view]);
}
/**
 * @param {?} view
 * @return {?}
 */
function debugDestroyView(view) {
    return callWithDebugContext(DebugAction.destroy, destroyView, null, [view]);
}
/** @enum {number} */
var DebugAction = {
    create: 0,
    detectChanges: 1,
    checkNoChanges: 2,
    destroy: 3,
    handleEvent: 4,
};
DebugAction[DebugAction.create] = 'create';
DebugAction[DebugAction.detectChanges] = 'detectChanges';
DebugAction[DebugAction.checkNoChanges] = 'checkNoChanges';
DebugAction[DebugAction.destroy] = 'destroy';
DebugAction[DebugAction.handleEvent] = 'handleEvent';
/** @type {?} */
let _currentAction;
/** @type {?} */
let _currentView;
/** @type {?} */
let _currentNodeIndex;
/**
 * @param {?} view
 * @param {?} nodeIndex
 * @return {?}
 */
function debugSetCurrentNode(view, nodeIndex) {
    _currentView = view;
    _currentNodeIndex = nodeIndex;
}
/**
 * @param {?} view
 * @param {?} nodeIndex
 * @param {?} eventName
 * @param {?} event
 * @return {?}
 */
function debugHandleEvent(view, nodeIndex, eventName, event) {
    debugSetCurrentNode(view, nodeIndex);
    return callWithDebugContext(DebugAction.handleEvent, view.def.handleEvent, null, [view, nodeIndex, eventName, event]);
}
/**
 * @param {?} view
 * @param {?} checkType
 * @return {?}
 */
function debugUpdateDirectives(view, checkType) {
    if (view.state & 128 /* Destroyed */) {
        throw viewDestroyedError(DebugAction[_currentAction]);
    }
    debugSetCurrentNode(view, nextDirectiveWithBinding(view, 0));
    return view.def.updateDirectives(debugCheckDirectivesFn, view);
    /**
     * @param {?} view
     * @param {?} nodeIndex
     * @param {?} argStyle
     * @param {...?} values
     * @return {?}
     */
    function debugCheckDirectivesFn(view, nodeIndex, argStyle, ...values) {
        /** @type {?} */
        const nodeDef = view.def.nodes[nodeIndex];
        if (checkType === 0 /* CheckAndUpdate */) {
            debugCheckAndUpdateNode(view, nodeDef, argStyle, values);
        }
        else {
            debugCheckNoChangesNode(view, nodeDef, argStyle, values);
        }
        if (nodeDef.flags & 16384 /* TypeDirective */) {
            debugSetCurrentNode(view, nextDirectiveWithBinding(view, nodeIndex));
        }
        return (nodeDef.flags & 224 /* CatPureExpression */) ?
            asPureExpressionData(view, nodeDef.nodeIndex).value :
            undefined;
    }
}
/**
 * @param {?} view
 * @param {?} checkType
 * @return {?}
 */
function debugUpdateRenderer(view, checkType) {
    if (view.state & 128 /* Destroyed */) {
        throw viewDestroyedError(DebugAction[_currentAction]);
    }
    debugSetCurrentNode(view, nextRenderNodeWithBinding(view, 0));
    return view.def.updateRenderer(debugCheckRenderNodeFn, view);
    /**
     * @param {?} view
     * @param {?} nodeIndex
     * @param {?} argStyle
     * @param {...?} values
     * @return {?}
     */
    function debugCheckRenderNodeFn(view, nodeIndex, argStyle, ...values) {
        /** @type {?} */
        const nodeDef = view.def.nodes[nodeIndex];
        if (checkType === 0 /* CheckAndUpdate */) {
            debugCheckAndUpdateNode(view, nodeDef, argStyle, values);
        }
        else {
            debugCheckNoChangesNode(view, nodeDef, argStyle, values);
        }
        if (nodeDef.flags & 3 /* CatRenderNode */) {
            debugSetCurrentNode(view, nextRenderNodeWithBinding(view, nodeIndex));
        }
        return (nodeDef.flags & 224 /* CatPureExpression */) ?
            asPureExpressionData(view, nodeDef.nodeIndex).value :
            undefined;
    }
}
/**
 * @param {?} view
 * @param {?} nodeDef
 * @param {?} argStyle
 * @param {?} givenValues
 * @return {?}
 */
function debugCheckAndUpdateNode(view, nodeDef, argStyle, givenValues) {
    /** @type {?} */
    const changed = (/** @type {?} */ (checkAndUpdateNode))(view, nodeDef, argStyle, ...givenValues);
    if (changed) {
        /** @type {?} */
        const values = argStyle === 1 /* Dynamic */ ? givenValues[0] : givenValues;
        if (nodeDef.flags & 16384 /* TypeDirective */) {
            /** @type {?} */
            const bindingValues = {};
            for (let i = 0; i < nodeDef.bindings.length; i++) {
                /** @type {?} */
                const binding = nodeDef.bindings[i];
                /** @type {?} */
                const value = values[i];
                if (binding.flags & 8 /* TypeProperty */) {
                    bindingValues[normalizeDebugBindingName(/** @type {?} */ ((binding.nonMinifiedName)))] =
                        normalizeDebugBindingValue(value);
                }
            }
            /** @type {?} */
            const elDef = /** @type {?} */ ((nodeDef.parent));
            /** @type {?} */
            const el = asElementData(view, elDef.nodeIndex).renderElement;
            if (!/** @type {?} */ ((elDef.element)).name) {
                // a comment.
                view.renderer.setValue(el, `bindings=${JSON.stringify(bindingValues, null, 2)}`);
            }
            else {
                // a regular element.
                for (let attr in bindingValues) {
                    /** @type {?} */
                    const value = bindingValues[attr];
                    if (value != null) {
                        view.renderer.setAttribute(el, attr, value);
                    }
                    else {
                        view.renderer.removeAttribute(el, attr);
                    }
                }
            }
        }
    }
}
/**
 * @param {?} view
 * @param {?} nodeDef
 * @param {?} argStyle
 * @param {?} values
 * @return {?}
 */
function debugCheckNoChangesNode(view, nodeDef, argStyle, values) {
    (/** @type {?} */ (checkNoChangesNode))(view, nodeDef, argStyle, ...values);
}
/**
 * @param {?} name
 * @return {?}
 */
function normalizeDebugBindingName(name) {
    // Attribute names with `$` (eg `x-y$`) are valid per spec, but unsupported by some browsers
    name = camelCaseToDashCase(name.replace(/[$@]/g, '_'));
    return `ng-reflect-${name}`;
}
/** @type {?} */
const CAMEL_CASE_REGEXP = /([A-Z])/g;
/**
 * @param {?} input
 * @return {?}
 */
function camelCaseToDashCase(input) {
    return input.replace(CAMEL_CASE_REGEXP, (...m) => '-' + m[1].toLowerCase());
}
/**
 * @param {?} value
 * @return {?}
 */
function normalizeDebugBindingValue(value) {
    try {
        // Limit the size of the value as otherwise the DOM just gets polluted.
        return value != null ? value.toString().slice(0, 30) : value;
    }
    catch (e) {
        return '[ERROR] Exception while trying to serialize the value';
    }
}
/**
 * @param {?} view
 * @param {?} nodeIndex
 * @return {?}
 */
function nextDirectiveWithBinding(view, nodeIndex) {
    for (let i = nodeIndex; i < view.def.nodes.length; i++) {
        /** @type {?} */
        const nodeDef = view.def.nodes[i];
        if (nodeDef.flags & 16384 /* TypeDirective */ && nodeDef.bindings && nodeDef.bindings.length) {
            return i;
        }
    }
    return null;
}
/**
 * @param {?} view
 * @param {?} nodeIndex
 * @return {?}
 */
function nextRenderNodeWithBinding(view, nodeIndex) {
    for (let i = nodeIndex; i < view.def.nodes.length; i++) {
        /** @type {?} */
        const nodeDef = view.def.nodes[i];
        if ((nodeDef.flags & 3 /* CatRenderNode */) && nodeDef.bindings && nodeDef.bindings.length) {
            return i;
        }
    }
    return null;
}
class DebugContext_ {
    /**
     * @param {?} view
     * @param {?} nodeIndex
     */
    constructor(view, nodeIndex) {
        this.view = view;
        this.nodeIndex = nodeIndex;
        if (nodeIndex == null) {
            this.nodeIndex = nodeIndex = 0;
        }
        this.nodeDef = view.def.nodes[nodeIndex];
        /** @type {?} */
        let elDef = this.nodeDef;
        /** @type {?} */
        let elView = view;
        while (elDef && (elDef.flags & 1 /* TypeElement */) === 0) {
            elDef = /** @type {?} */ ((elDef.parent));
        }
        if (!elDef) {
            while (!elDef && elView) {
                elDef = /** @type {?} */ ((viewParentEl(elView)));
                elView = /** @type {?} */ ((elView.parent));
            }
        }
        this.elDef = elDef;
        this.elView = elView;
    }
    /**
     * @return {?}
     */
    get elOrCompView() {
        // Has to be done lazily as we use the DebugContext also during creation of elements...
        return asElementData(this.elView, this.elDef.nodeIndex).componentView || this.view;
    }
    /**
     * @return {?}
     */
    get injector() { return createInjector(this.elView, this.elDef); }
    /**
     * @return {?}
     */
    get component() { return this.elOrCompView.component; }
    /**
     * @return {?}
     */
    get context() { return this.elOrCompView.context; }
    /**
     * @return {?}
     */
    get providerTokens() {
        /** @type {?} */
        const tokens = [];
        if (this.elDef) {
            for (let i = this.elDef.nodeIndex + 1; i <= this.elDef.nodeIndex + this.elDef.childCount; i++) {
                /** @type {?} */
                const childDef = this.elView.def.nodes[i];
                if (childDef.flags & 20224 /* CatProvider */) {
                    tokens.push(/** @type {?} */ ((childDef.provider)).token);
                }
                i += childDef.childCount;
            }
        }
        return tokens;
    }
    /**
     * @return {?}
     */
    get references() {
        /** @type {?} */
        const references = {};
        if (this.elDef) {
            collectReferences(this.elView, this.elDef, references);
            for (let i = this.elDef.nodeIndex + 1; i <= this.elDef.nodeIndex + this.elDef.childCount; i++) {
                /** @type {?} */
                const childDef = this.elView.def.nodes[i];
                if (childDef.flags & 20224 /* CatProvider */) {
                    collectReferences(this.elView, childDef, references);
                }
                i += childDef.childCount;
            }
        }
        return references;
    }
    /**
     * @return {?}
     */
    get componentRenderElement() {
        /** @type {?} */
        const elData = findHostElement(this.elOrCompView);
        return elData ? elData.renderElement : undefined;
    }
    /**
     * @return {?}
     */
    get renderNode() {
        return this.nodeDef.flags & 2 /* TypeText */ ? renderNode(this.view, this.nodeDef) :
            renderNode(this.elView, this.elDef);
    }
    /**
     * @param {?} console
     * @param {...?} values
     * @return {?}
     */
    logError(console, ...values) {
        /** @type {?} */
        let logViewDef;
        /** @type {?} */
        let logNodeIndex;
        if (this.nodeDef.flags & 2 /* TypeText */) {
            logViewDef = this.view.def;
            logNodeIndex = this.nodeDef.nodeIndex;
        }
        else {
            logViewDef = this.elView.def;
            logNodeIndex = this.elDef.nodeIndex;
        }
        /** @type {?} */
        const renderNodeIndex = getRenderNodeIndex(logViewDef, logNodeIndex);
        /** @type {?} */
        let currRenderNodeIndex = -1;
        /** @type {?} */
        let nodeLogger = () => {
            currRenderNodeIndex++;
            if (currRenderNodeIndex === renderNodeIndex) {
                return console.error.bind(console, ...values);
            }
            else {
                return NOOP;
            }
        }; /** @type {?} */
        ((logViewDef.factory))(nodeLogger);
        if (currRenderNodeIndex < renderNodeIndex) {
            console.error('Illegal state: the ViewDefinitionFactory did not call the logger!');
            (/** @type {?} */ (console.error))(...values);
        }
    }
}
if (false) {
    /** @type {?} */
    DebugContext_.prototype.nodeDef;
    /** @type {?} */
    DebugContext_.prototype.elView;
    /** @type {?} */
    DebugContext_.prototype.elDef;
    /** @type {?} */
    DebugContext_.prototype.view;
    /** @type {?} */
    DebugContext_.prototype.nodeIndex;
}
/**
 * @param {?} viewDef
 * @param {?} nodeIndex
 * @return {?}
 */
function getRenderNodeIndex(viewDef, nodeIndex) {
    /** @type {?} */
    let renderNodeIndex = -1;
    for (let i = 0; i <= nodeIndex; i++) {
        /** @type {?} */
        const nodeDef = viewDef.nodes[i];
        if (nodeDef.flags & 3 /* CatRenderNode */) {
            renderNodeIndex++;
        }
    }
    return renderNodeIndex;
}
/**
 * @param {?} view
 * @return {?}
 */
function findHostElement(view) {
    while (view && !isComponentView(view)) {
        view = /** @type {?} */ ((view.parent));
    }
    if (view.parent) {
        return asElementData(view.parent, /** @type {?} */ ((viewParentEl(view))).nodeIndex);
    }
    return null;
}
/**
 * @param {?} view
 * @param {?} nodeDef
 * @param {?} references
 * @return {?}
 */
function collectReferences(view, nodeDef, references) {
    for (let refName in nodeDef.references) {
        references[refName] = getQueryValue(view, nodeDef, nodeDef.references[refName]);
    }
}
/**
 * @param {?} action
 * @param {?} fn
 * @param {?} self
 * @param {?} args
 * @return {?}
 */
function callWithDebugContext(action, fn, self, args) {
    /** @type {?} */
    const oldAction = _currentAction;
    /** @type {?} */
    const oldView = _currentView;
    /** @type {?} */
    const oldNodeIndex = _currentNodeIndex;
    try {
        _currentAction = action;
        /** @type {?} */
        const result = fn.apply(self, args);
        _currentView = oldView;
        _currentNodeIndex = oldNodeIndex;
        _currentAction = oldAction;
        return result;
    }
    catch (e) {
        if (isViewDebugError(e) || !_currentView) {
            throw e;
        }
        throw viewWrappedDebugError(e, /** @type {?} */ ((getCurrentDebugContext())));
    }
}
/**
 * @return {?}
 */
export function getCurrentDebugContext() {
    return _currentView ? new DebugContext_(_currentView, _currentNodeIndex) : null;
}
export class DebugRendererFactory2 {
    /**
     * @param {?} delegate
     */
    constructor(delegate) {
        this.delegate = delegate;
    }
    /**
     * @param {?} element
     * @param {?} renderData
     * @return {?}
     */
    createRenderer(element, renderData) {
        return new DebugRenderer2(this.delegate.createRenderer(element, renderData));
    }
    /**
     * @return {?}
     */
    begin() {
        if (this.delegate.begin) {
            this.delegate.begin();
        }
    }
    /**
     * @return {?}
     */
    end() {
        if (this.delegate.end) {
            this.delegate.end();
        }
    }
    /**
     * @return {?}
     */
    whenRenderingDone() {
        if (this.delegate.whenRenderingDone) {
            return this.delegate.whenRenderingDone();
        }
        return Promise.resolve(null);
    }
}
if (false) {
    /** @type {?} */
    DebugRendererFactory2.prototype.delegate;
}
export class DebugRenderer2 {
    /**
     * @param {?} delegate
     */
    constructor(delegate) {
        this.delegate = delegate;
        /**
         * Factory function used to create a `DebugContext` when a node is created.
         *
         * The `DebugContext` allows to retrieve information about the nodes that are useful in tests.
         *
         * The factory is configurable so that the `DebugRenderer2` could instantiate either a View Engine
         * or a Render context.
         */
        this.debugContextFactory = getCurrentDebugContext;
        this.data = this.delegate.data;
    }
    /**
     * @return {?}
     */
    get debugContext() { return this.debugContextFactory(); }
    /**
     * @param {?} node
     * @return {?}
     */
    destroyNode(node) {
        removeDebugNodeFromIndex(/** @type {?} */ ((getDebugNode(node))));
        if (this.delegate.destroyNode) {
            this.delegate.destroyNode(node);
        }
    }
    /**
     * @return {?}
     */
    destroy() { this.delegate.destroy(); }
    /**
     * @param {?} name
     * @param {?=} namespace
     * @return {?}
     */
    createElement(name, namespace) {
        /** @type {?} */
        const el = this.delegate.createElement(name, namespace);
        /** @type {?} */
        const debugCtx = this.debugContext;
        if (debugCtx) {
            /** @type {?} */
            const debugEl = new DebugElement(el, null, debugCtx);
            debugEl.name = name;
            indexDebugNode(debugEl);
        }
        return el;
    }
    /**
     * @param {?} value
     * @return {?}
     */
    createComment(value) {
        /** @type {?} */
        const comment = this.delegate.createComment(value);
        /** @type {?} */
        const debugCtx = this.debugContext;
        if (debugCtx) {
            indexDebugNode(new DebugNode(comment, null, debugCtx));
        }
        return comment;
    }
    /**
     * @param {?} value
     * @return {?}
     */
    createText(value) {
        /** @type {?} */
        const text = this.delegate.createText(value);
        /** @type {?} */
        const debugCtx = this.debugContext;
        if (debugCtx) {
            indexDebugNode(new DebugNode(text, null, debugCtx));
        }
        return text;
    }
    /**
     * @param {?} parent
     * @param {?} newChild
     * @return {?}
     */
    appendChild(parent, newChild) {
        /** @type {?} */
        const debugEl = getDebugNode(parent);
        /** @type {?} */
        const debugChildEl = getDebugNode(newChild);
        if (debugEl && debugChildEl && debugEl instanceof DebugElement) {
            debugEl.addChild(debugChildEl);
        }
        this.delegate.appendChild(parent, newChild);
    }
    /**
     * @param {?} parent
     * @param {?} newChild
     * @param {?} refChild
     * @return {?}
     */
    insertBefore(parent, newChild, refChild) {
        /** @type {?} */
        const debugEl = getDebugNode(parent);
        /** @type {?} */
        const debugChildEl = getDebugNode(newChild);
        /** @type {?} */
        const debugRefEl = /** @type {?} */ ((getDebugNode(refChild)));
        if (debugEl && debugChildEl && debugEl instanceof DebugElement) {
            debugEl.insertBefore(debugRefEl, debugChildEl);
        }
        this.delegate.insertBefore(parent, newChild, refChild);
    }
    /**
     * @param {?} parent
     * @param {?} oldChild
     * @return {?}
     */
    removeChild(parent, oldChild) {
        /** @type {?} */
        const debugEl = getDebugNode(parent);
        /** @type {?} */
        const debugChildEl = getDebugNode(oldChild);
        if (debugEl && debugChildEl && debugEl instanceof DebugElement) {
            debugEl.removeChild(debugChildEl);
        }
        this.delegate.removeChild(parent, oldChild);
    }
    /**
     * @param {?} selectorOrNode
     * @param {?=} preserveContent
     * @return {?}
     */
    selectRootElement(selectorOrNode, preserveContent) {
        /** @type {?} */
        const el = this.delegate.selectRootElement(selectorOrNode, preserveContent);
        /** @type {?} */
        const debugCtx = getCurrentDebugContext();
        if (debugCtx) {
            indexDebugNode(new DebugElement(el, null, debugCtx));
        }
        return el;
    }
    /**
     * @param {?} el
     * @param {?} name
     * @param {?} value
     * @param {?=} namespace
     * @return {?}
     */
    setAttribute(el, name, value, namespace) {
        /** @type {?} */
        const debugEl = getDebugNode(el);
        if (debugEl && debugEl instanceof DebugElement) {
            /** @type {?} */
            const fullName = namespace ? namespace + ':' + name : name;
            debugEl.attributes[fullName] = value;
        }
        this.delegate.setAttribute(el, name, value, namespace);
    }
    /**
     * @param {?} el
     * @param {?} name
     * @param {?=} namespace
     * @return {?}
     */
    removeAttribute(el, name, namespace) {
        /** @type {?} */
        const debugEl = getDebugNode(el);
        if (debugEl && debugEl instanceof DebugElement) {
            /** @type {?} */
            const fullName = namespace ? namespace + ':' + name : name;
            debugEl.attributes[fullName] = null;
        }
        this.delegate.removeAttribute(el, name, namespace);
    }
    /**
     * @param {?} el
     * @param {?} name
     * @return {?}
     */
    addClass(el, name) {
        /** @type {?} */
        const debugEl = getDebugNode(el);
        if (debugEl && debugEl instanceof DebugElement) {
            debugEl.classes[name] = true;
        }
        this.delegate.addClass(el, name);
    }
    /**
     * @param {?} el
     * @param {?} name
     * @return {?}
     */
    removeClass(el, name) {
        /** @type {?} */
        const debugEl = getDebugNode(el);
        if (debugEl && debugEl instanceof DebugElement) {
            debugEl.classes[name] = false;
        }
        this.delegate.removeClass(el, name);
    }
    /**
     * @param {?} el
     * @param {?} style
     * @param {?} value
     * @param {?} flags
     * @return {?}
     */
    setStyle(el, style, value, flags) {
        /** @type {?} */
        const debugEl = getDebugNode(el);
        if (debugEl && debugEl instanceof DebugElement) {
            debugEl.styles[style] = value;
        }
        this.delegate.setStyle(el, style, value, flags);
    }
    /**
     * @param {?} el
     * @param {?} style
     * @param {?} flags
     * @return {?}
     */
    removeStyle(el, style, flags) {
        /** @type {?} */
        const debugEl = getDebugNode(el);
        if (debugEl && debugEl instanceof DebugElement) {
            debugEl.styles[style] = null;
        }
        this.delegate.removeStyle(el, style, flags);
    }
    /**
     * @param {?} el
     * @param {?} name
     * @param {?} value
     * @return {?}
     */
    setProperty(el, name, value) {
        /** @type {?} */
        const debugEl = getDebugNode(el);
        if (debugEl && debugEl instanceof DebugElement) {
            debugEl.properties[name] = value;
        }
        this.delegate.setProperty(el, name, value);
    }
    /**
     * @param {?} target
     * @param {?} eventName
     * @param {?} callback
     * @return {?}
     */
    listen(target, eventName, callback) {
        if (typeof target !== 'string') {
            /** @type {?} */
            const debugEl = getDebugNode(target);
            if (debugEl) {
                debugEl.listeners.push(new EventListener(eventName, callback));
            }
        }
        return this.delegate.listen(target, eventName, callback);
    }
    /**
     * @param {?} node
     * @return {?}
     */
    parentNode(node) { return this.delegate.parentNode(node); }
    /**
     * @param {?} node
     * @return {?}
     */
    nextSibling(node) { return this.delegate.nextSibling(node); }
    /**
     * @param {?} node
     * @param {?} value
     * @return {?}
     */
    setValue(node, value) { return this.delegate.setValue(node, value); }
}
if (false) {
    /** @type {?} */
    DebugRenderer2.prototype.data;
    /**
     * Factory function used to create a `DebugContext` when a node is created.
     *
     * The `DebugContext` allows to retrieve information about the nodes that are useful in tests.
     *
     * The factory is configurable so that the `DebugRenderer2` could instantiate either a View Engine
     * or a Render context.
     * @type {?}
     */
    DebugRenderer2.prototype.debugContextFactory;
    /** @type {?} */
    DebugRenderer2.prototype.delegate;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmljZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy92aWV3L3NlcnZpY2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLFlBQVksRUFBRSxTQUFTLEVBQUUsYUFBYSxFQUFFLFlBQVksRUFBRSxjQUFjLEVBQUUsd0JBQXdCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUVuSSxPQUFPLEVBQWdCLGdCQUFnQixFQUFDLE1BQU0sWUFBWSxDQUFDO0FBRTNELE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUM5QyxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFHekMsT0FBTyxFQUFZLGdCQUFnQixFQUFxQyxNQUFNLGVBQWUsQ0FBQztBQUM5RixPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFFbkQsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUV0QyxPQUFPLEVBQUMsZ0JBQWdCLEVBQUUsa0JBQWtCLEVBQUUscUJBQXFCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDckYsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLFlBQVksQ0FBQztBQUN0QyxPQUFPLEVBQUMsa0JBQWtCLEVBQUUsYUFBYSxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBQzFELE9BQU8sRUFBQyxjQUFjLEVBQUUsaUJBQWlCLEVBQUUsaUNBQWlDLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFDNUYsT0FBTyxFQUFtSixRQUFRLEVBQXVDLGFBQWEsRUFBRSxvQkFBb0IsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUM3UCxPQUFPLEVBQUMsSUFBSSxFQUFFLGVBQWUsRUFBRSxVQUFVLEVBQUUsaUJBQWlCLEVBQUUsWUFBWSxFQUFFLFlBQVksRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUN4RyxPQUFP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RTtDQUN6RiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtEZWJ1Z0VsZW1lbnQsIERlYnVnTm9kZSwgRXZlbnRMaXN0ZW5lciwgZ2V0RGVidWdOb2RlLCBpbmRleERlYnVnTm9kZSwgcmVtb3ZlRGVidWdOb2RlRnJvbUluZGV4fSBmcm9tICcuLi9kZWJ1Zy9kZWJ1Z19ub2RlJztcbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4uL2RpJztcbmltcG9ydCB7SW5qZWN0YWJsZURlZiwgZ2V0SW5qZWN0YWJsZURlZn0gZnJvbSAnLi4vZGkvZGVmcyc7XG5pbXBvcnQge0luamVjdGFibGVUeXBlfSBmcm9tICcuLi9kaS9pbmplY3RhYmxlJztcbmltcG9ydCB7RXJyb3JIYW5kbGVyfSBmcm9tICcuLi9lcnJvcl9oYW5kbGVyJztcbmltcG9ydCB7aXNEZXZNb2RlfSBmcm9tICcuLi9pc19kZXZfbW9kZSc7XG5pbXBvcnQge0NvbXBvbmVudEZhY3Rvcnl9IGZyb20gJy4uL2xpbmtlci9jb21wb25lbnRfZmFjdG9yeSc7XG5pbXBvcnQge05nTW9kdWxlUmVmfSBmcm9tICcuLi9saW5rZXIvbmdfbW9kdWxlX2ZhY3RvcnknO1xuaW1wb3J0IHtSZW5kZXJlcjIsIFJlbmRlcmVyRmFjdG9yeTIsIFJlbmRlcmVyU3R5bGVGbGFnczIsIFJlbmRlcmVyVHlwZTJ9IGZyb20gJy4uL3JlbmRlci9hcGknO1xuaW1wb3J0IHtTYW5pdGl6ZXJ9IGZyb20gJy4uL3Nhbml0aXphdGlvbi9zZWN1cml0eSc7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL3R5cGUnO1xuaW1wb3J0IHt0b2tlbktleX0gZnJvbSAnLi4vdmlldy91dGlsJztcblxuaW1wb3J0IHtpc1ZpZXdEZWJ1Z0Vycm9yLCB2aWV3RGVzdHJveWVkRXJyb3IsIHZpZXdXcmFwcGVkRGVidWdFcnJvcn0gZnJvbSAnLi9lcnJvcnMnO1xuaW1wb3J0IHtyZXNvbHZlRGVwfSBmcm9tICcuL3Byb3ZpZGVyJztcbmltcG9ydCB7ZGlydHlQYXJlbnRRdWVyaWVzLCBnZXRRdWVyeVZhbHVlfSBmcm9tICcuL3F1ZXJ5JztcbmltcG9ydCB7Y3JlYXRlSW5qZWN0b3IsIGNyZWF0ZU5nTW9kdWxlUmVmLCBnZXRDb21wb25lbnRWaWV3RGVmaW5pdGlvbkZhY3Rvcnl9IGZyb20gJy4vcmVmcyc7XG5pbXBvcnQge0FyZ3VtZW50VHlwZSwgQmluZGluZ0ZsYWdzLCBDaGVja1R5cGUsIERlYnVnQ29udGV4dCwgRWxlbWVudERhdGEsIE5nTW9kdWxlRGVmaW5pdGlvbiwgTm9kZURlZiwgTm9kZUZsYWdzLCBOb2RlTG9nZ2VyLCBQcm92aWRlck92ZXJyaWRlLCBSb290RGF0YSwgU2VydmljZXMsIFZpZXdEYXRhLCBWaWV3RGVmaW5pdGlvbiwgVmlld1N0YXRlLCBhc0VsZW1lbnREYXRhLCBhc1B1cmVFeHByZXNzaW9uRGF0YX0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQge05PT1AsIGlzQ29tcG9uZW50VmlldywgcmVuZGVyTm9kZSwgcmVzb2x2ZURlZmluaXRpb24sIHNwbGl0RGVwc0RzbCwgdmlld1BhcmVudEVsfSBmcm9tICcuL3V0aWwnO1xuaW1wb3J0IHtjaGVja0FuZFVwZGF0ZU5vZGUsIGNoZWNrQW5kVXBkYXRlVmlldywgY2hlY2tOb0NoYW5nZXNOb2RlLCBjaGVja05vQ2hhbmdlc1ZpZXcsIGNyZWF0ZUNvbXBvbmVudFZpZXcsIGNyZWF0ZUVtYmVkZGVkVmlldywgY3JlYXRlUm9vdFZpZXcsIGRlc3Ryb3lWaWV3fSBmcm9tICcuL3ZpZXcnO1xuXG5cbmxldCBpbml0aWFsaXplZCA9IGZhbHNlO1xuXG5leHBvcnQgZnVuY3Rpb24gaW5pdFNlcnZpY2VzSWZOZWVkZWQoKSB7XG4gIGlmIChpbml0aWFsaXplZCkge1xuICAgIHJldHVybjtcbiAgfVxuICBpbml0aWFsaXplZCA9IHRydWU7XG4gIGNvbnN0IHNlcnZpY2VzID0gaXNEZXZNb2RlKCkgPyBjcmVhdGVEZWJ1Z1NlcnZpY2VzKCkgOiBjcmVhdGVQcm9kU2VydmljZXMoKTtcbiAgU2VydmljZXMuc2V0Q3VycmVudE5vZGUgPSBzZXJ2aWNlcy5zZXRDdXJyZW50Tm9kZTtcbiAgU2VydmljZXMuY3JlYXRlUm9vdFZpZXcgPSBzZXJ2aWNlcy5jcmVhdGVSb290VmlldztcbiAgU2VydmljZXMuY3JlYXRlRW1iZWRkZWRWaWV3ID0gc2VydmljZXMuY3JlYXRlRW1iZWRkZWRWaWV3O1xuICBTZXJ2aWNlcy5jcmVhdGVDb21wb25lbnRWaWV3ID0gc2VydmljZXMuY3JlYXRlQ29tcG9uZW50VmlldztcbiAgU2VydmljZXMuY3JlYXRlTmdNb2R1bGVSZWYgPSBzZXJ2aWNlcy5jcmVhdGVOZ01vZHVsZVJlZjtcbiAgU2VydmljZXMub3ZlcnJpZGVQcm92aWRlciA9IHNlcnZpY2VzLm92ZXJyaWRlUHJvdmlkZXI7XG4gIFNlcnZpY2VzLm92ZXJyaWRlQ29tcG9uZW50VmlldyA9IHNlcnZpY2VzLm92ZXJyaWRlQ29tcG9uZW50VmlldztcbiAgU2VydmljZXMuY2xlYXJPdmVycmlkZXMgPSBzZXJ2aWNlcy5jbGVhck92ZXJyaWRlcztcbiAgU2VydmljZXMuY2hlY2tBbmRVcGRhdGVWaWV3ID0gc2VydmljZXMuY2hlY2tBbmRVcGRhdGVWaWV3O1xuICBTZXJ2aWNlcy5jaGVja05vQ2hhbmdlc1ZpZXcgPSBzZXJ2aWNlcy5jaGVja05vQ2hhbmdlc1ZpZXc7XG4gIFNlcnZpY2VzLmRlc3Ryb3lWaWV3ID0gc2VydmljZXMuZGVzdHJveVZpZXc7XG4gIFNlcnZpY2VzLnJlc29sdmVEZXAgPSByZXNvbHZlRGVwO1xuICBTZXJ2aWNlcy5jcmVhdGVEZWJ1Z0NvbnRleHQgPSBzZXJ2aWNlcy5jcmVhdGVEZWJ1Z0NvbnRleHQ7XG4gIFNlcnZpY2VzLmhhbmRsZUV2ZW50ID0gc2VydmljZXMuaGFuZGxlRXZlbnQ7XG4gIFNlcnZpY2VzLnVwZGF0ZURpcmVjdGl2ZXMgPSBzZXJ2aWNlcy51cGRhdGVEaXJlY3RpdmVzO1xuICBTZXJ2aWNlcy51cGRhdGVSZW5kZXJlciA9IHNlcnZpY2VzLnVwZGF0ZVJlbmRlcmVyO1xuICBTZXJ2aWNlcy5kaXJ0eVBhcmVudFF1ZXJpZXMgPSBkaXJ0eVBhcmVudFF1ZXJpZXM7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVByb2RTZXJ2aWNlcygpIHtcbiAgcmV0dXJuIHtcbiAgICBzZXRDdXJyZW50Tm9kZTogKCkgPT4ge30sXG4gICAgY3JlYXRlUm9vdFZpZXc6IGNyZWF0ZVByb2RSb290VmlldyxcbiAgICBjcmVhdGVFbWJlZGRlZFZpZXc6IGNyZWF0ZUVtYmVkZGVkVmlldyxcbiAgICBjcmVhdGVDb21wb25lbnRWaWV3OiBjcmVhdGVDb21wb25lbnRWaWV3LFxuICAgIGNyZWF0ZU5nTW9kdWxlUmVmOiBjcmVhdGVOZ01vZHVsZVJlZixcbiAgICBvdmVycmlkZVByb3ZpZGVyOiBOT09QLFxuICAgIG92ZXJyaWRlQ29tcG9uZW50VmlldzogTk9PUCxcbiAgICBjbGVhck92ZXJyaWRlczogTk9PUCxcbiAgICBjaGVja0FuZFVwZGF0ZVZpZXc6IGNoZWNrQW5kVXBkYXRlVmlldyxcbiAgICBjaGVja05vQ2hhbmdlc1ZpZXc6IGNoZWNrTm9DaGFuZ2VzVmlldyxcbiAgICBkZXN0cm95VmlldzogZGVzdHJveVZpZXcsXG4gICAgY3JlYXRlRGVidWdDb250ZXh0OiAodmlldzogVmlld0RhdGEsIG5vZGVJbmRleDogbnVtYmVyKSA9PiBuZXcgRGVidWdDb250ZXh0Xyh2aWV3LCBub2RlSW5kZXgpLFxuICAgIGhhbmRsZUV2ZW50OiAodmlldzogVmlld0RhdGEsIG5vZGVJbmRleDogbnVtYmVyLCBldmVudE5hbWU6IHN0cmluZywgZXZlbnQ6IGFueSkgPT5cbiAgICAgICAgICAgICAgICAgICAgIHZpZXcuZGVmLmhhbmRsZUV2ZW50KHZpZXcsIG5vZGVJbmRleCwgZXZlbnROYW1lLCBldmVudCksXG4gICAgdXBkYXRlRGlyZWN0aXZlczogKHZpZXc6IFZpZXdEYXRhLCBjaGVja1R5cGU6IENoZWNrVHlwZSkgPT4gdmlldy5kZWYudXBkYXRlRGlyZWN0aXZlcyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tUeXBlID09PSBDaGVja1R5cGUuQ2hlY2tBbmRVcGRhdGUgPyBwcm9kQ2hlY2tBbmRVcGRhdGVOb2RlIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9kQ2hlY2tOb0NoYW5nZXNOb2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB2aWV3KSxcbiAgICB1cGRhdGVSZW5kZXJlcjogKHZpZXc6IFZpZXdEYXRhLCBjaGVja1R5cGU6IENoZWNrVHlwZSkgPT4gdmlldy5kZWYudXBkYXRlUmVuZGVyZXIoXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGVja1R5cGUgPT09IENoZWNrVHlwZS5DaGVja0FuZFVwZGF0ZSA/IHByb2RDaGVja0FuZFVwZGF0ZU5vZGUgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9kQ2hlY2tOb0NoYW5nZXNOb2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgdmlldyksXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZURlYnVnU2VydmljZXMoKSB7XG4gIHJldHVybiB7XG4gICAgc2V0Q3VycmVudE5vZGU6IGRlYnVnU2V0Q3VycmVudE5vZGUsXG4gICAgY3JlYXRlUm9vdFZpZXc6IGRlYnVnQ3JlYXRlUm9vdFZpZXcsXG4gICAgY3JlYXRlRW1iZWRkZWRWaWV3OiBkZWJ1Z0NyZWF0ZUVtYmVkZGVkVmlldyxcbiAgICBjcmVhdGVDb21wb25lbnRWaWV3OiBkZWJ1Z0NyZWF0ZUNvbXBvbmVudFZpZXcsXG4gICAgY3JlYXRlTmdNb2R1bGVSZWY6IGRlYnVnQ3JlYXRlTmdNb2R1bGVSZWYsXG4gICAgb3ZlcnJpZGVQcm92aWRlcjogZGVidWdPdmVycmlkZVByb3ZpZGVyLFxuICAgIG92ZXJyaWRlQ29tcG9uZW50VmlldzogZGVidWdPdmVycmlkZUNvbXBvbmVudFZpZXcsXG4gICAgY2xlYXJPdmVycmlkZXM6IGRlYnVnQ2xlYXJPdmVycmlkZXMsXG4gICAgY2hlY2tBbmRVcGRhdGVWaWV3OiBkZWJ1Z0NoZWNrQW5kVXBkYXRlVmlldyxcbiAgICBjaGVja05vQ2hhbmdlc1ZpZXc6IGRlYnVnQ2hlY2tOb0NoYW5nZXNWaWV3LFxuICAgIGRlc3Ryb3lWaWV3OiBkZWJ1Z0Rlc3Ryb3lWaWV3LFxuICAgIGNyZWF0ZURlYnVnQ29udGV4dDogKHZpZXc6IFZpZXdEYXRhLCBub2RlSW5kZXg6IG51bWJlcikgPT4gbmV3IERlYnVnQ29udGV4dF8odmlldywgbm9kZUluZGV4KSxcbiAgICBoYW5kbGVFdmVudDogZGVidWdIYW5kbGVFdmVudCxcbiAgICB1cGRhdGVEaXJlY3RpdmVzOiBkZWJ1Z1VwZGF0ZURpcmVjdGl2ZXMsXG4gICAgdXBkYXRlUmVuZGVyZXI6IGRlYnVnVXBkYXRlUmVuZGVyZXIsXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVByb2RSb290VmlldyhcbiAgICBlbEluamVjdG9yOiBJbmplY3RvciwgcHJvamVjdGFibGVOb2RlczogYW55W11bXSwgcm9vdFNlbGVjdG9yT3JOb2RlOiBzdHJpbmcgfCBhbnksXG4gICAgZGVmOiBWaWV3RGVmaW5pdGlvbiwgbmdNb2R1bGU6IE5nTW9kdWxlUmVmPGFueT4sIGNvbnRleHQ/OiBhbnkpOiBWaWV3RGF0YSB7XG4gIGNvbnN0IHJlbmRlcmVyRmFjdG9yeTogUmVuZGVyZXJGYWN0b3J5MiA9IG5nTW9kdWxlLmluamVjdG9yLmdldChSZW5kZXJlckZhY3RvcnkyKTtcbiAgcmV0dXJuIGNyZWF0ZVJvb3RWaWV3KFxuICAgICAgY3JlYXRlUm9vdERhdGEoZWxJbmplY3RvciwgbmdNb2R1bGUsIHJlbmRlcmVyRmFjdG9yeSwgcHJvamVjdGFibGVOb2Rlcywgcm9vdFNlbGVjdG9yT3JOb2RlKSxcbiAgICAgIGRlZiwgY29udGV4dCk7XG59XG5cbmZ1bmN0aW9uIGRlYnVnQ3JlYXRlUm9vdFZpZXcoXG4gICAgZWxJbmplY3RvcjogSW5qZWN0b3IsIHByb2plY3RhYmxlTm9kZXM6IGFueVtdW10sIHJvb3RTZWxlY3Rvck9yTm9kZTogc3RyaW5nIHwgYW55LFxuICAgIGRlZjogVmlld0RlZmluaXRpb24sIG5nTW9kdWxlOiBOZ01vZHVsZVJlZjxhbnk+LCBjb250ZXh0PzogYW55KTogVmlld0RhdGEge1xuICBjb25zdCByZW5kZXJlckZhY3Rvcnk6IFJlbmRlcmVyRmFjdG9yeTIgPSBuZ01vZHVsZS5pbmplY3Rvci5nZXQoUmVuZGVyZXJGYWN0b3J5Mik7XG4gIGNvbnN0IHJvb3QgPSBjcmVhdGVSb290RGF0YShcbiAgICAgIGVsSW5qZWN0b3IsIG5nTW9kdWxlLCBuZXcgRGVidWdSZW5kZXJlckZhY3RvcnkyKHJlbmRlcmVyRmFjdG9yeSksIHByb2plY3RhYmxlTm9kZXMsXG4gICAgICByb290U2VsZWN0b3JPck5vZGUpO1xuICBjb25zdCBkZWZXaXRoT3ZlcnJpZGUgPSBhcHBseVByb3ZpZGVyT3ZlcnJpZGVzVG9WaWV3KGRlZik7XG4gIHJldHVybiBjYWxsV2l0aERlYnVnQ29udGV4dChcbiAgICAgIERlYnVnQWN0aW9uLmNyZWF0ZSwgY3JlYXRlUm9vdFZpZXcsIG51bGwsIFtyb290LCBkZWZXaXRoT3ZlcnJpZGUsIGNvbnRleHRdKTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlUm9vdERhdGEoXG4gICAgZWxJbmplY3RvcjogSW5qZWN0b3IsIG5nTW9kdWxlOiBOZ01vZHVsZVJlZjxhbnk+LCByZW5kZXJlckZhY3Rvcnk6IFJlbmRlcmVyRmFjdG9yeTIsXG4gICAgcHJvamVjdGFibGVOb2RlczogYW55W11bXSwgcm9vdFNlbGVjdG9yT3JOb2RlOiBhbnkpOiBSb290RGF0YSB7XG4gIGNvbnN0IHNhbml0aXplciA9IG5nTW9kdWxlLmluamVjdG9yLmdldChTYW5pdGl6ZXIpO1xuICBjb25zdCBlcnJvckhhbmRsZXIgPSBuZ01vZHVsZS5pbmplY3Rvci5nZXQoRXJyb3JIYW5kbGVyKTtcbiAgY29uc3QgcmVuZGVyZXIgPSByZW5kZXJlckZhY3RvcnkuY3JlYXRlUmVuZGVyZXIobnVsbCwgbnVsbCk7XG4gIHJldHVybiB7XG4gICAgbmdNb2R1bGUsXG4gICAgaW5qZWN0b3I6IGVsSW5qZWN0b3IsIHByb2plY3RhYmxlTm9kZXMsXG4gICAgc2VsZWN0b3JPck5vZGU6IHJvb3RTZWxlY3Rvck9yTm9kZSwgc2FuaXRpemVyLCByZW5kZXJlckZhY3RvcnksIHJlbmRlcmVyLCBlcnJvckhhbmRsZXJcbiAgfTtcbn1cblxuZnVuY3Rpb24gZGVidWdDcmVhdGVFbWJlZGRlZFZpZXcoXG4gICAgcGFyZW50VmlldzogVmlld0RhdGEsIGFuY2hvckRlZjogTm9kZURlZiwgdmlld0RlZjogVmlld0RlZmluaXRpb24sIGNvbnRleHQ/OiBhbnkpOiBWaWV3RGF0YSB7XG4gIGNvbnN0IGRlZldpdGhPdmVycmlkZSA9IGFwcGx5UHJvdmlkZXJPdmVycmlkZXNUb1ZpZXcodmlld0RlZik7XG4gIHJldHVybiBjYWxsV2l0aERlYnVnQ29udGV4dChcbiAgICAgIERlYnVnQWN0aW9uLmNyZWF0ZSwgY3JlYXRlRW1iZWRkZWRWaWV3LCBudWxsLFxuICAgICAgW3BhcmVudFZpZXcsIGFuY2hvckRlZiwgZGVmV2l0aE92ZXJyaWRlLCBjb250ZXh0XSk7XG59XG5cbmZ1bmN0aW9uIGRlYnVnQ3JlYXRlQ29tcG9uZW50VmlldyhcbiAgICBwYXJlbnRWaWV3OiBWaWV3RGF0YSwgbm9kZURlZjogTm9kZURlZiwgdmlld0RlZjogVmlld0RlZmluaXRpb24sIGhvc3RFbGVtZW50OiBhbnkpOiBWaWV3RGF0YSB7XG4gIGNvbnN0IG92ZXJyaWRlQ29tcG9uZW50VmlldyA9XG4gICAgICB2aWV3RGVmT3ZlcnJpZGVzLmdldChub2RlRGVmLmVsZW1lbnQgIS5jb21wb25lbnRQcm92aWRlciAhLnByb3ZpZGVyICEudG9rZW4pO1xuICBpZiAob3ZlcnJpZGVDb21wb25lbnRWaWV3KSB7XG4gICAgdmlld0RlZiA9IG92ZXJyaWRlQ29tcG9uZW50VmlldztcbiAgfSBlbHNlIHtcbiAgICB2aWV3RGVmID0gYXBwbHlQcm92aWRlck92ZXJyaWRlc1RvVmlldyh2aWV3RGVmKTtcbiAgfVxuICByZXR1cm4gY2FsbFdpdGhEZWJ1Z0NvbnRleHQoXG4gICAgICBEZWJ1Z0FjdGlvbi5jcmVhdGUsIGNyZWF0ZUNvbXBvbmVudFZpZXcsIG51bGwsIFtwYXJlbnRWaWV3LCBub2RlRGVmLCB2aWV3RGVmLCBob3N0RWxlbWVudF0pO1xufVxuXG5mdW5jdGlvbiBkZWJ1Z0NyZWF0ZU5nTW9kdWxlUmVmKFxuICAgIG1vZHVsZVR5cGU6IFR5cGU8YW55PiwgcGFyZW50SW5qZWN0b3I6IEluamVjdG9yLCBib290c3RyYXBDb21wb25lbnRzOiBUeXBlPGFueT5bXSxcbiAgICBkZWY6IE5nTW9kdWxlRGVmaW5pdGlvbik6IE5nTW9kdWxlUmVmPGFueT4ge1xuICBjb25zdCBkZWZXaXRoT3ZlcnJpZGUgPSBhcHBseVByb3ZpZGVyT3ZlcnJpZGVzVG9OZ01vZHVsZShkZWYpO1xuICByZXR1cm4gY3JlYXRlTmdNb2R1bGVSZWYobW9kdWxlVHlwZSwgcGFyZW50SW5qZWN0b3IsIGJvb3RzdHJhcENvbXBvbmVudHMsIGRlZldpdGhPdmVycmlkZSk7XG59XG5cbmNvbnN0IHByb3ZpZGVyT3ZlcnJpZGVzID0gbmV3IE1hcDxhbnksIFByb3ZpZGVyT3ZlcnJpZGU+KCk7XG5jb25zdCBwcm92aWRlck92ZXJyaWRlc1dpdGhTY29wZSA9IG5ldyBNYXA8SW5qZWN0YWJsZVR5cGU8YW55PiwgUHJvdmlkZXJPdmVycmlkZT4oKTtcbmNvbnN0IHZpZXdEZWZPdmVycmlkZXMgPSBuZXcgTWFwPGFueSwgVmlld0RlZmluaXRpb24+KCk7XG5cbmZ1bmN0aW9uIGRlYnVnT3ZlcnJpZGVQcm92aWRlcihvdmVycmlkZTogUHJvdmlkZXJPdmVycmlkZSkge1xuICBwcm92aWRlck92ZXJyaWRlcy5zZXQob3ZlcnJpZGUudG9rZW4sIG92ZXJyaWRlKTtcbiAgbGV0IGluamVjdGFibGVEZWY6IEluamVjdGFibGVEZWY8YW55PnxudWxsO1xuICBpZiAodHlwZW9mIG92ZXJyaWRlLnRva2VuID09PSAnZnVuY3Rpb24nICYmIChpbmplY3RhYmxlRGVmID0gZ2V0SW5qZWN0YWJsZURlZihvdmVycmlkZS50b2tlbikpICYmXG4gICAgICB0eXBlb2YgaW5qZWN0YWJsZURlZi5wcm92aWRlZEluID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcHJvdmlkZXJPdmVycmlkZXNXaXRoU2NvcGUuc2V0KG92ZXJyaWRlLnRva2VuIGFzIEluamVjdGFibGVUeXBlPGFueT4sIG92ZXJyaWRlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBkZWJ1Z092ZXJyaWRlQ29tcG9uZW50Vmlldyhjb21wOiBhbnksIGNvbXBGYWN0b3J5OiBDb21wb25lbnRGYWN0b3J5PGFueT4pIHtcbiAgY29uc3QgaG9zdFZpZXdEZWYgPSByZXNvbHZlRGVmaW5pdGlvbihnZXRDb21wb25lbnRWaWV3RGVmaW5pdGlvbkZhY3RvcnkoY29tcEZhY3RvcnkpKTtcbiAgY29uc3QgY29tcFZpZXdEZWYgPSByZXNvbHZlRGVmaW5pdGlvbihob3N0Vmlld0RlZi5ub2Rlc1swXS5lbGVtZW50ICEuY29tcG9uZW50VmlldyAhKTtcbiAgdmlld0RlZk92ZXJyaWRlcy5zZXQoY29tcCwgY29tcFZpZXdEZWYpO1xufVxuXG5mdW5jdGlvbiBkZWJ1Z0NsZWFyT3ZlcnJpZGVzKCkge1xuICBwcm92aWRlck92ZXJyaWRlcy5jbGVhcigpO1xuICBwcm92aWRlck92ZXJyaWRlc1dpdGhTY29wZS5jbGVhcigpO1xuICB2aWV3RGVmT3ZlcnJpZGVzLmNsZWFyKCk7XG59XG5cbi8vIE5vdGVzIGFib3V0IHRoZSBhbGdvcml0aG06XG4vLyAxKSBMb2NhdGUgdGhlIHByb3ZpZGVycyBvZiBhbiBlbGVtZW50IGFuZCBjaGVjayBpZiBvbmUgb2YgdGhlbSB3YXMgb3ZlcndyaXR0ZW5cbi8vIDIpIENoYW5nZSB0aGUgcHJvdmlkZXJzIG9mIHRoYXQgZWxlbWVudFxuLy9cbi8vIFdlIG9ubHkgY3JlYXRlIG5ldyBkYXRhc3RydWN0dXJlcyBpZiB3ZSBuZWVkIHRvLCB0byBrZWVwIHBlcmYgaW1wYWN0XG4vLyByZWFzb25hYmxlLlxuZnVuY3Rpb24gYXBwbHlQcm92aWRlck92ZXJyaWRlc1RvVmlldyhkZWY6IFZpZXdEZWZpbml0aW9uKTogVmlld0RlZmluaXRpb24ge1xuICBpZiAocHJvdmlkZXJPdmVycmlkZXMuc2l6ZSA9PT0gMCkge1xuICAgIHJldHVybiBkZWY7XG4gIH1cbiAgY29uc3QgZWxlbWVudEluZGljZXNXaXRoT3ZlcndyaXR0ZW5Qcm92aWRlcnMgPSBmaW5kRWxlbWVudEluZGljZXNXaXRoT3ZlcndyaXR0ZW5Qcm92aWRlcnMoZGVmKTtcbiAgaWYgKGVsZW1lbnRJbmRpY2VzV2l0aE92ZXJ3cml0dGVuUHJvdmlkZXJzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBkZWY7XG4gIH1cbiAgLy8gY2xvbmUgdGhlIHdob2xlIHZpZXcgZGVmaW5pdGlvbixcbiAgLy8gYXMgaXQgbWFpbnRhaW5zIHJlZmVyZW5jZXMgYmV0d2VlbiB0aGUgbm9kZXMgdGhhdCBhcmUgaGFyZCB0byB1cGRhdGUuXG4gIGRlZiA9IGRlZi5mYWN0b3J5ICEoKCkgPT4gTk9PUCk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZWxlbWVudEluZGljZXNXaXRoT3ZlcndyaXR0ZW5Qcm92aWRlcnMubGVuZ3RoOyBpKyspIHtcbiAgICBhcHBseVByb3ZpZGVyT3ZlcnJpZGVzVG9FbGVtZW50KGRlZiwgZWxlbWVudEluZGljZXNXaXRoT3ZlcndyaXR0ZW5Qcm92aWRlcnNbaV0pO1xuICB9XG4gIHJldHVybiBkZWY7XG5cbiAgZnVuY3Rpb24gZmluZEVsZW1lbnRJbmRpY2VzV2l0aE92ZXJ3cml0dGVuUHJvdmlkZXJzKGRlZjogVmlld0RlZmluaXRpb24pOiBudW1iZXJbXSB7XG4gICAgY29uc3QgZWxJbmRpY2VzV2l0aE92ZXJ3cml0dGVuUHJvdmlkZXJzOiBudW1iZXJbXSA9IFtdO1xuICAgIGxldCBsYXN0RWxlbWVudERlZjogTm9kZURlZnxudWxsID0gbnVsbDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRlZi5ub2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3Qgbm9kZURlZiA9IGRlZi5ub2Rlc1tpXTtcbiAgICAgIGlmIChub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLlR5cGVFbGVtZW50KSB7XG4gICAgICAgIGxhc3RFbGVtZW50RGVmID0gbm9kZURlZjtcbiAgICAgIH1cbiAgICAgIGlmIChsYXN0RWxlbWVudERlZiAmJiBub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLkNhdFByb3ZpZGVyTm9EaXJlY3RpdmUgJiZcbiAgICAgICAgICBwcm92aWRlck92ZXJyaWRlcy5oYXMobm9kZURlZi5wcm92aWRlciAhLnRva2VuKSkge1xuICAgICAgICBlbEluZGljZXNXaXRoT3ZlcndyaXR0ZW5Qcm92aWRlcnMucHVzaChsYXN0RWxlbWVudERlZiAhLm5vZGVJbmRleCk7XG4gICAgICAgIGxhc3RFbGVtZW50RGVmID0gbnVsbDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGVsSW5kaWNlc1dpdGhPdmVyd3JpdHRlblByb3ZpZGVycztcbiAgfVxuXG4gIGZ1bmN0aW9uIGFwcGx5UHJvdmlkZXJPdmVycmlkZXNUb0VsZW1lbnQodmlld0RlZjogVmlld0RlZmluaXRpb24sIGVsSW5kZXg6IG51bWJlcikge1xuICAgIGZvciAobGV0IGkgPSBlbEluZGV4ICsgMTsgaSA8IHZpZXdEZWYubm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IG5vZGVEZWYgPSB2aWV3RGVmLm5vZGVzW2ldO1xuICAgICAgaWYgKG5vZGVEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuVHlwZUVsZW1lbnQpIHtcbiAgICAgICAgLy8gc3RvcCBhdCB0aGUgbmV4dCBlbGVtZW50XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmIChub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLkNhdFByb3ZpZGVyTm9EaXJlY3RpdmUpIHtcbiAgICAgICAgY29uc3QgcHJvdmlkZXIgPSBub2RlRGVmLnByb3ZpZGVyICE7XG4gICAgICAgIGNvbnN0IG92ZXJyaWRlID0gcHJvdmlkZXJPdmVycmlkZXMuZ2V0KHByb3ZpZGVyLnRva2VuKTtcbiAgICAgICAgaWYgKG92ZXJyaWRlKSB7XG4gICAgICAgICAgbm9kZURlZi5mbGFncyA9IChub2RlRGVmLmZsYWdzICYgfk5vZGVGbGFncy5DYXRQcm92aWRlck5vRGlyZWN0aXZlKSB8IG92ZXJyaWRlLmZsYWdzO1xuICAgICAgICAgIHByb3ZpZGVyLmRlcHMgPSBzcGxpdERlcHNEc2wob3ZlcnJpZGUuZGVwcyk7XG4gICAgICAgICAgcHJvdmlkZXIudmFsdWUgPSBvdmVycmlkZS52YWx1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vLyBOb3RlcyBhYm91dCB0aGUgYWxnb3JpdGhtOlxuLy8gV2Ugb25seSBjcmVhdGUgbmV3IGRhdGFzdHJ1Y3R1cmVzIGlmIHdlIG5lZWQgdG8sIHRvIGtlZXAgcGVyZiBpbXBhY3Rcbi8vIHJlYXNvbmFibGUuXG5mdW5jdGlvbiBhcHBseVByb3ZpZGVyT3ZlcnJpZGVzVG9OZ01vZHVsZShkZWY6IE5nTW9kdWxlRGVmaW5pdGlvbik6IE5nTW9kdWxlRGVmaW5pdGlvbiB7XG4gIGNvbnN0IHtoYXNPdmVycmlkZXMsIGhhc0RlcHJlY2F0ZWRPdmVycmlkZXN9ID0gY2FsY0hhc092ZXJyaWRlcyhkZWYpO1xuICBpZiAoIWhhc092ZXJyaWRlcykge1xuICAgIHJldHVybiBkZWY7XG4gIH1cbiAgLy8gY2xvbmUgdGhlIHdob2xlIHZpZXcgZGVmaW5pdGlvbixcbiAgLy8gYXMgaXQgbWFpbnRhaW5zIHJlZmVyZW5jZXMgYmV0d2VlbiB0aGUgbm9kZXMgdGhhdCBhcmUgaGFyZCB0byB1cGRhdGUuXG4gIGRlZiA9IGRlZi5mYWN0b3J5ICEoKCkgPT4gTk9PUCk7XG4gIGFwcGx5UHJvdmlkZXJPdmVycmlkZXMoZGVmKTtcbiAgcmV0dXJuIGRlZjtcblxuICBmdW5jdGlvbiBjYWxjSGFzT3ZlcnJpZGVzKGRlZjogTmdNb2R1bGVEZWZpbml0aW9uKTpcbiAgICAgIHtoYXNPdmVycmlkZXM6IGJvb2xlYW4sIGhhc0RlcHJlY2F0ZWRPdmVycmlkZXM6IGJvb2xlYW59IHtcbiAgICBsZXQgaGFzT3ZlcnJpZGVzID0gZmFsc2U7XG4gICAgbGV0IGhhc0RlcHJlY2F0ZWRPdmVycmlkZXMgPSBmYWxzZTtcbiAgICBpZiAocHJvdmlkZXJPdmVycmlkZXMuc2l6ZSA9PT0gMCkge1xuICAgICAgcmV0dXJuIHtoYXNPdmVycmlkZXMsIGhhc0RlcHJlY2F0ZWRPdmVycmlkZXN9O1xuICAgIH1cbiAgICBkZWYucHJvdmlkZXJzLmZvckVhY2gobm9kZSA9PiB7XG4gICAgICBjb25zdCBvdmVycmlkZSA9IHByb3ZpZGVyT3ZlcnJpZGVzLmdldChub2RlLnRva2VuKTtcbiAgICAgIGlmICgobm9kZS5mbGFncyAmIE5vZGVGbGFncy5DYXRQcm92aWRlck5vRGlyZWN0aXZlKSAmJiBvdmVycmlkZSkge1xuICAgICAgICBoYXNPdmVycmlkZXMgPSB0cnVlO1xuICAgICAgICBoYXNEZXByZWNhdGVkT3ZlcnJpZGVzID0gaGFzRGVwcmVjYXRlZE92ZXJyaWRlcyB8fCBvdmVycmlkZS5kZXByZWNhdGVkQmVoYXZpb3I7XG4gICAgICB9XG4gICAgfSk7XG4gICAgZGVmLm1vZHVsZXMuZm9yRWFjaChtb2R1bGUgPT4ge1xuICAgICAgcHJvdmlkZXJPdmVycmlkZXNXaXRoU2NvcGUuZm9yRWFjaCgob3ZlcnJpZGUsIHRva2VuKSA9PiB7XG4gICAgICAgIGlmIChnZXRJbmplY3RhYmxlRGVmKHRva2VuKSAhLnByb3ZpZGVkSW4gPT09IG1vZHVsZSkge1xuICAgICAgICAgIGhhc092ZXJyaWRlcyA9IHRydWU7XG4gICAgICAgICAgaGFzRGVwcmVjYXRlZE92ZXJyaWRlcyA9IGhhc0RlcHJlY2F0ZWRPdmVycmlkZXMgfHwgb3ZlcnJpZGUuZGVwcmVjYXRlZEJlaGF2aW9yO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICByZXR1cm4ge2hhc092ZXJyaWRlcywgaGFzRGVwcmVjYXRlZE92ZXJyaWRlc307XG4gIH1cblxuICBmdW5jdGlvbiBhcHBseVByb3ZpZGVyT3ZlcnJpZGVzKGRlZjogTmdNb2R1bGVEZWZpbml0aW9uKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkZWYucHJvdmlkZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBwcm92aWRlciA9IGRlZi5wcm92aWRlcnNbaV07XG4gICAgICBpZiAoaGFzRGVwcmVjYXRlZE92ZXJyaWRlcykge1xuICAgICAgICAvLyBXZSBoYWQgYSBidWcgd2hlcmUgbWUgbWFkZVxuICAgICAgICAvLyBhbGwgcHJvdmlkZXJzIGxhenkuIEtlZXAgdGhpcyBsb2dpYyBiZWhpbmQgYSBmbGFnXG4gICAgICAgIC8vIGZvciBtaWdyYXRpbmcgZXhpc3RpbmcgdXNlcnMuXG4gICAgICAgIHByb3ZpZGVyLmZsYWdzIHw9IE5vZGVGbGFncy5MYXp5UHJvdmlkZXI7XG4gICAgICB9XG4gICAgICBjb25zdCBvdmVycmlkZSA9IHByb3ZpZGVyT3ZlcnJpZGVzLmdldChwcm92aWRlci50b2tlbik7XG4gICAgICBpZiAob3ZlcnJpZGUpIHtcbiAgICAgICAgcHJvdmlkZXIuZmxhZ3MgPSAocHJvdmlkZXIuZmxhZ3MgJiB+Tm9kZUZsYWdzLkNhdFByb3ZpZGVyTm9EaXJlY3RpdmUpIHwgb3ZlcnJpZGUuZmxhZ3M7XG4gICAgICAgIHByb3ZpZGVyLmRlcHMgPSBzcGxpdERlcHNEc2wob3ZlcnJpZGUuZGVwcyk7XG4gICAgICAgIHByb3ZpZGVyLnZhbHVlID0gb3ZlcnJpZGUudmFsdWU7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChwcm92aWRlck92ZXJyaWRlc1dpdGhTY29wZS5zaXplID4gMCkge1xuICAgICAgbGV0IG1vZHVsZVNldCA9IG5ldyBTZXQ8YW55PihkZWYubW9kdWxlcyk7XG4gICAgICBwcm92aWRlck92ZXJyaWRlc1dpdGhTY29wZS5mb3JFYWNoKChvdmVycmlkZSwgdG9rZW4pID0+IHtcbiAgICAgICAgaWYgKG1vZHVsZVNldC5oYXMoZ2V0SW5qZWN0YWJsZURlZih0b2tlbikgIS5wcm92aWRlZEluKSkge1xuICAgICAgICAgIGxldCBwcm92aWRlciA9IHtcbiAgICAgICAgICAgIHRva2VuOiB0b2tlbixcbiAgICAgICAgICAgIGZsYWdzOlxuICAgICAgICAgICAgICAgIG92ZXJyaWRlLmZsYWdzIHwgKGhhc0RlcHJlY2F0ZWRPdmVycmlkZXMgPyBOb2RlRmxhZ3MuTGF6eVByb3ZpZGVyIDogTm9kZUZsYWdzLk5vbmUpLFxuICAgICAgICAgICAgZGVwczogc3BsaXREZXBzRHNsKG92ZXJyaWRlLmRlcHMpLFxuICAgICAgICAgICAgdmFsdWU6IG92ZXJyaWRlLnZhbHVlLFxuICAgICAgICAgICAgaW5kZXg6IGRlZi5wcm92aWRlcnMubGVuZ3RoLFxuICAgICAgICAgIH07XG4gICAgICAgICAgZGVmLnByb3ZpZGVycy5wdXNoKHByb3ZpZGVyKTtcbiAgICAgICAgICBkZWYucHJvdmlkZXJzQnlLZXlbdG9rZW5LZXkodG9rZW4pXSA9IHByb3ZpZGVyO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gcHJvZENoZWNrQW5kVXBkYXRlTm9kZShcbiAgICB2aWV3OiBWaWV3RGF0YSwgY2hlY2tJbmRleDogbnVtYmVyLCBhcmdTdHlsZTogQXJndW1lbnRUeXBlLCB2MD86IGFueSwgdjE/OiBhbnksIHYyPzogYW55LFxuICAgIHYzPzogYW55LCB2ND86IGFueSwgdjU/OiBhbnksIHY2PzogYW55LCB2Nz86IGFueSwgdjg/OiBhbnksIHY5PzogYW55KTogYW55IHtcbiAgY29uc3Qgbm9kZURlZiA9IHZpZXcuZGVmLm5vZGVzW2NoZWNrSW5kZXhdO1xuICBjaGVja0FuZFVwZGF0ZU5vZGUodmlldywgbm9kZURlZiwgYXJnU3R5bGUsIHYwLCB2MSwgdjIsIHYzLCB2NCwgdjUsIHY2LCB2NywgdjgsIHY5KTtcbiAgcmV0dXJuIChub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLkNhdFB1cmVFeHByZXNzaW9uKSA/XG4gICAgICBhc1B1cmVFeHByZXNzaW9uRGF0YSh2aWV3LCBjaGVja0luZGV4KS52YWx1ZSA6XG4gICAgICB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIHByb2RDaGVja05vQ2hhbmdlc05vZGUoXG4gICAgdmlldzogVmlld0RhdGEsIGNoZWNrSW5kZXg6IG51bWJlciwgYXJnU3R5bGU6IEFyZ3VtZW50VHlwZSwgdjA/OiBhbnksIHYxPzogYW55LCB2Mj86IGFueSxcbiAgICB2Mz86IGFueSwgdjQ/OiBhbnksIHY1PzogYW55LCB2Nj86IGFueSwgdjc/OiBhbnksIHY4PzogYW55LCB2OT86IGFueSk6IGFueSB7XG4gIGNvbnN0IG5vZGVEZWYgPSB2aWV3LmRlZi5ub2Rlc1tjaGVja0luZGV4XTtcbiAgY2hlY2tOb0NoYW5nZXNOb2RlKHZpZXcsIG5vZGVEZWYsIGFyZ1N0eWxlLCB2MCwgdjEsIHYyLCB2MywgdjQsIHY1LCB2NiwgdjcsIHY4LCB2OSk7XG4gIHJldHVybiAobm9kZURlZi5mbGFncyAmIE5vZGVGbGFncy5DYXRQdXJlRXhwcmVzc2lvbikgP1xuICAgICAgYXNQdXJlRXhwcmVzc2lvbkRhdGEodmlldywgY2hlY2tJbmRleCkudmFsdWUgOlxuICAgICAgdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBkZWJ1Z0NoZWNrQW5kVXBkYXRlVmlldyh2aWV3OiBWaWV3RGF0YSkge1xuICByZXR1cm4gY2FsbFdpdGhEZWJ1Z0NvbnRleHQoRGVidWdBY3Rpb24uZGV0ZWN0Q2hhbmdlcywgY2hlY2tBbmRVcGRhdGVWaWV3LCBudWxsLCBbdmlld10pO1xufVxuXG5mdW5jdGlvbiBkZWJ1Z0NoZWNrTm9DaGFuZ2VzVmlldyh2aWV3OiBWaWV3RGF0YSkge1xuICByZXR1cm4gY2FsbFdpdGhEZWJ1Z0NvbnRleHQoRGVidWdBY3Rpb24uY2hlY2tOb0NoYW5nZXMsIGNoZWNrTm9DaGFuZ2VzVmlldywgbnVsbCwgW3ZpZXddKTtcbn1cblxuZnVuY3Rpb24gZGVidWdEZXN0cm95Vmlldyh2aWV3OiBWaWV3RGF0YSkge1xuICByZXR1cm4gY2FsbFdpdGhEZWJ1Z0NvbnRleHQoRGVidWdBY3Rpb24uZGVzdHJveSwgZGVzdHJveVZpZXcsIG51bGwsIFt2aWV3XSk7XG59XG5cbmVudW0gRGVidWdBY3Rpb24ge1xuICBjcmVhdGUsXG4gIGRldGVjdENoYW5nZXMsXG4gIGNoZWNrTm9DaGFuZ2VzLFxuICBkZXN0cm95LFxuICBoYW5kbGVFdmVudFxufVxuXG5sZXQgX2N1cnJlbnRBY3Rpb246IERlYnVnQWN0aW9uO1xubGV0IF9jdXJyZW50VmlldzogVmlld0RhdGE7XG5sZXQgX2N1cnJlbnROb2RlSW5kZXg6IG51bWJlcnxudWxsO1xuXG5mdW5jdGlvbiBkZWJ1Z1NldEN1cnJlbnROb2RlKHZpZXc6IFZpZXdEYXRhLCBub2RlSW5kZXg6IG51bWJlciB8IG51bGwpIHtcbiAgX2N1cnJlbnRWaWV3ID0gdmlldztcbiAgX2N1cnJlbnROb2RlSW5kZXggPSBub2RlSW5kZXg7XG59XG5cbmZ1bmN0aW9uIGRlYnVnSGFuZGxlRXZlbnQodmlldzogVmlld0RhdGEsIG5vZGVJbmRleDogbnVtYmVyLCBldmVudE5hbWU6IHN0cmluZywgZXZlbnQ6IGFueSkge1xuICBkZWJ1Z1NldEN1cnJlbnROb2RlKHZpZXcsIG5vZGVJbmRleCk7XG4gIHJldHVybiBjYWxsV2l0aERlYnVnQ29udGV4dChcbiAgICAgIERlYnVnQWN0aW9uLmhhbmRsZUV2ZW50LCB2aWV3LmRlZi5oYW5kbGVFdmVudCwgbnVsbCwgW3ZpZXcsIG5vZGVJbmRleCwgZXZlbnROYW1lLCBldmVudF0pO1xufVxuXG5mdW5jdGlvbiBkZWJ1Z1VwZGF0ZURpcmVjdGl2ZXModmlldzogVmlld0RhdGEsIGNoZWNrVHlwZTogQ2hlY2tUeXBlKSB7XG4gIGlmICh2aWV3LnN0YXRlICYgVmlld1N0YXRlLkRlc3Ryb3llZCkge1xuICAgIHRocm93IHZpZXdEZXN0cm95ZWRFcnJvcihEZWJ1Z0FjdGlvbltfY3VycmVudEFjdGlvbl0pO1xuICB9XG4gIGRlYnVnU2V0Q3VycmVudE5vZGUodmlldywgbmV4dERpcmVjdGl2ZVdpdGhCaW5kaW5nKHZpZXcsIDApKTtcbiAgcmV0dXJuIHZpZXcuZGVmLnVwZGF0ZURpcmVjdGl2ZXMoZGVidWdDaGVja0RpcmVjdGl2ZXNGbiwgdmlldyk7XG5cbiAgZnVuY3Rpb24gZGVidWdDaGVja0RpcmVjdGl2ZXNGbihcbiAgICAgIHZpZXc6IFZpZXdEYXRhLCBub2RlSW5kZXg6IG51bWJlciwgYXJnU3R5bGU6IEFyZ3VtZW50VHlwZSwgLi4udmFsdWVzOiBhbnlbXSkge1xuICAgIGNvbnN0IG5vZGVEZWYgPSB2aWV3LmRlZi5ub2Rlc1tub2RlSW5kZXhdO1xuICAgIGlmIChjaGVja1R5cGUgPT09IENoZWNrVHlwZS5DaGVja0FuZFVwZGF0ZSkge1xuICAgICAgZGVidWdDaGVja0FuZFVwZGF0ZU5vZGUodmlldywgbm9kZURlZiwgYXJnU3R5bGUsIHZhbHVlcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlYnVnQ2hlY2tOb0NoYW5nZXNOb2RlKHZpZXcsIG5vZGVEZWYsIGFyZ1N0eWxlLCB2YWx1ZXMpO1xuICAgIH1cbiAgICBpZiAobm9kZURlZi5mbGFncyAmIE5vZGVGbGFncy5UeXBlRGlyZWN0aXZlKSB7XG4gICAgICBkZWJ1Z1NldEN1cnJlbnROb2RlKHZpZXcsIG5leHREaXJlY3RpdmVXaXRoQmluZGluZyh2aWV3LCBub2RlSW5kZXgpKTtcbiAgICB9XG4gICAgcmV0dXJuIChub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLkNhdFB1cmVFeHByZXNzaW9uKSA/XG4gICAgICAgIGFzUHVyZUV4cHJlc3Npb25EYXRhKHZpZXcsIG5vZGVEZWYubm9kZUluZGV4KS52YWx1ZSA6XG4gICAgICAgIHVuZGVmaW5lZDtcbiAgfVxufVxuXG5mdW5jdGlvbiBkZWJ1Z1VwZGF0ZVJlbmRlcmVyKHZpZXc6IFZpZXdEYXRhLCBjaGVja1R5cGU6IENoZWNrVHlwZSkge1xuICBpZiAodmlldy5zdGF0ZSAmIFZpZXdTdGF0ZS5EZXN0cm95ZWQpIHtcbiAgICB0aHJvdyB2aWV3RGVzdHJveWVkRXJyb3IoRGVidWdBY3Rpb25bX2N1cnJlbnRBY3Rpb25dKTtcbiAgfVxuICBkZWJ1Z1NldEN1cnJlbnROb2RlKHZpZXcsIG5leHRSZW5kZXJOb2RlV2l0aEJpbmRpbmcodmlldywgMCkpO1xuICByZXR1cm4gdmlldy5kZWYudXBkYXRlUmVuZGVyZXIoZGVidWdDaGVja1JlbmRlck5vZGVGbiwgdmlldyk7XG5cbiAgZnVuY3Rpb24gZGVidWdDaGVja1JlbmRlck5vZGVGbihcbiAgICAgIHZpZXc6IFZpZXdEYXRhLCBub2RlSW5kZXg6IG51bWJlciwgYXJnU3R5bGU6IEFyZ3VtZW50VHlwZSwgLi4udmFsdWVzOiBhbnlbXSkge1xuICAgIGNvbnN0IG5vZGVEZWYgPSB2aWV3LmRlZi5ub2Rlc1tub2RlSW5kZXhdO1xuICAgIGlmIChjaGVja1R5cGUgPT09IENoZWNrVHlwZS5DaGVja0FuZFVwZGF0ZSkge1xuICAgICAgZGVidWdDaGVja0FuZFVwZGF0ZU5vZGUodmlldywgbm9kZURlZiwgYXJnU3R5bGUsIHZhbHVlcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlYnVnQ2hlY2tOb0NoYW5nZXNOb2RlKHZpZXcsIG5vZGVEZWYsIGFyZ1N0eWxlLCB2YWx1ZXMpO1xuICAgIH1cbiAgICBpZiAobm9kZURlZi5mbGFncyAmIE5vZGVGbGFncy5DYXRSZW5kZXJOb2RlKSB7XG4gICAgICBkZWJ1Z1NldEN1cnJlbnROb2RlKHZpZXcsIG5leHRSZW5kZXJOb2RlV2l0aEJpbmRpbmcodmlldywgbm9kZUluZGV4KSk7XG4gICAgfVxuICAgIHJldHVybiAobm9kZURlZi5mbGFncyAmIE5vZGVGbGFncy5DYXRQdXJlRXhwcmVzc2lvbikgP1xuICAgICAgICBhc1B1cmVFeHByZXNzaW9uRGF0YSh2aWV3LCBub2RlRGVmLm5vZGVJbmRleCkudmFsdWUgOlxuICAgICAgICB1bmRlZmluZWQ7XG4gIH1cbn1cblxuZnVuY3Rpb24gZGVidWdDaGVja0FuZFVwZGF0ZU5vZGUoXG4gICAgdmlldzogVmlld0RhdGEsIG5vZGVEZWY6IE5vZGVEZWYsIGFyZ1N0eWxlOiBBcmd1bWVudFR5cGUsIGdpdmVuVmFsdWVzOiBhbnlbXSk6IHZvaWQge1xuICBjb25zdCBjaGFuZ2VkID0gKDxhbnk+Y2hlY2tBbmRVcGRhdGVOb2RlKSh2aWV3LCBub2RlRGVmLCBhcmdTdHlsZSwgLi4uZ2l2ZW5WYWx1ZXMpO1xuICBpZiAoY2hhbmdlZCkge1xuICAgIGNvbnN0IHZhbHVlcyA9IGFyZ1N0eWxlID09PSBBcmd1bWVudFR5cGUuRHluYW1pYyA/IGdpdmVuVmFsdWVzWzBdIDogZ2l2ZW5WYWx1ZXM7XG4gICAgaWYgKG5vZGVEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuVHlwZURpcmVjdGl2ZSkge1xuICAgICAgY29uc3QgYmluZGluZ1ZhbHVlczoge1trZXk6IHN0cmluZ106IHN0cmluZ30gPSB7fTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbm9kZURlZi5iaW5kaW5ncy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBiaW5kaW5nID0gbm9kZURlZi5iaW5kaW5nc1tpXTtcbiAgICAgICAgY29uc3QgdmFsdWUgPSB2YWx1ZXNbaV07XG4gICAgICAgIGlmIChiaW5kaW5nLmZsYWdzICYgQmluZGluZ0ZsYWdzLlR5cGVQcm9wZXJ0eSkge1xuICAgICAgICAgIGJpbmRpbmdWYWx1ZXNbbm9ybWFsaXplRGVidWdCaW5kaW5nTmFtZShiaW5kaW5nLm5vbk1pbmlmaWVkTmFtZSAhKV0gPVxuICAgICAgICAgICAgICBub3JtYWxpemVEZWJ1Z0JpbmRpbmdWYWx1ZSh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGNvbnN0IGVsRGVmID0gbm9kZURlZi5wYXJlbnQgITtcbiAgICAgIGNvbnN0IGVsID0gYXNFbGVtZW50RGF0YSh2aWV3LCBlbERlZi5ub2RlSW5kZXgpLnJlbmRlckVsZW1lbnQ7XG4gICAgICBpZiAoIWVsRGVmLmVsZW1lbnQgIS5uYW1lKSB7XG4gICAgICAgIC8vIGEgY29tbWVudC5cbiAgICAgICAgdmlldy5yZW5kZXJlci5zZXRWYWx1ZShlbCwgYGJpbmRpbmdzPSR7SlNPTi5zdHJpbmdpZnkoYmluZGluZ1ZhbHVlcywgbnVsbCwgMil9YCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBhIHJlZ3VsYXIgZWxlbWVudC5cbiAgICAgICAgZm9yIChsZXQgYXR0ciBpbiBiaW5kaW5nVmFsdWVzKSB7XG4gICAgICAgICAgY29uc3QgdmFsdWUgPSBiaW5kaW5nVmFsdWVzW2F0dHJdO1xuICAgICAgICAgIGlmICh2YWx1ZSAhPSBudWxsKSB7XG4gICAgICAgICAgICB2aWV3LnJlbmRlcmVyLnNldEF0dHJpYnV0ZShlbCwgYXR0ciwgdmFsdWUpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2aWV3LnJlbmRlcmVyLnJlbW92ZUF0dHJpYnV0ZShlbCwgYXR0cik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGRlYnVnQ2hlY2tOb0NoYW5nZXNOb2RlKFxuICAgIHZpZXc6IFZpZXdEYXRhLCBub2RlRGVmOiBOb2RlRGVmLCBhcmdTdHlsZTogQXJndW1lbnRUeXBlLCB2YWx1ZXM6IGFueVtdKTogdm9pZCB7XG4gICg8YW55PmNoZWNrTm9DaGFuZ2VzTm9kZSkodmlldywgbm9kZURlZiwgYXJnU3R5bGUsIC4uLnZhbHVlcyk7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZURlYnVnQmluZGluZ05hbWUobmFtZTogc3RyaW5nKSB7XG4gIC8vIEF0dHJpYnV0ZSBuYW1lcyB3aXRoIGAkYCAoZWcgYHgteSRgKSBhcmUgdmFsaWQgcGVyIHNwZWMsIGJ1dCB1bnN1cHBvcnRlZCBieSBzb21lIGJyb3dzZXJzXG4gIG5hbWUgPSBjYW1lbENhc2VUb0Rhc2hDYXNlKG5hbWUucmVwbGFjZSgvWyRAXS9nLCAnXycpKTtcbiAgcmV0dXJuIGBuZy1yZWZsZWN0LSR7bmFtZX1gO1xufVxuXG5jb25zdCBDQU1FTF9DQVNFX1JFR0VYUCA9IC8oW0EtWl0pL2c7XG5cbmZ1bmN0aW9uIGNhbWVsQ2FzZVRvRGFzaENhc2UoaW5wdXQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBpbnB1dC5yZXBsYWNlKENBTUVMX0NBU0VfUkVHRVhQLCAoLi4ubTogYW55W10pID0+ICctJyArIG1bMV0udG9Mb3dlckNhc2UoKSk7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZURlYnVnQmluZGluZ1ZhbHVlKHZhbHVlOiBhbnkpOiBzdHJpbmcge1xuICB0cnkge1xuICAgIC8vIExpbWl0IHRoZSBzaXplIG9mIHRoZSB2YWx1ZSBhcyBvdGhlcndpc2UgdGhlIERPTSBqdXN0IGdldHMgcG9sbHV0ZWQuXG4gICAgcmV0dXJuIHZhbHVlICE9IG51bGwgPyB2YWx1ZS50b1N0cmluZygpLnNsaWNlKDAsIDMwKSA6IHZhbHVlO1xuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuICdbRVJST1JdIEV4Y2VwdGlvbiB3aGlsZSB0cnlpbmcgdG8gc2VyaWFsaXplIHRoZSB2YWx1ZSc7XG4gIH1cbn1cblxuZnVuY3Rpb24gbmV4dERpcmVjdGl2ZVdpdGhCaW5kaW5nKHZpZXc6IFZpZXdEYXRhLCBub2RlSW5kZXg6IG51bWJlcik6IG51bWJlcnxudWxsIHtcbiAgZm9yIChsZXQgaSA9IG5vZGVJbmRleDsgaSA8IHZpZXcuZGVmLm5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qgbm9kZURlZiA9IHZpZXcuZGVmLm5vZGVzW2ldO1xuICAgIGlmIChub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLlR5cGVEaXJlY3RpdmUgJiYgbm9kZURlZi5iaW5kaW5ncyAmJiBub2RlRGVmLmJpbmRpbmdzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIGk7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBuZXh0UmVuZGVyTm9kZVdpdGhCaW5kaW5nKHZpZXc6IFZpZXdEYXRhLCBub2RlSW5kZXg6IG51bWJlcik6IG51bWJlcnxudWxsIHtcbiAgZm9yIChsZXQgaSA9IG5vZGVJbmRleDsgaSA8IHZpZXcuZGVmLm5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qgbm9kZURlZiA9IHZpZXcuZGVmLm5vZGVzW2ldO1xuICAgIGlmICgobm9kZURlZi5mbGFncyAmIE5vZGVGbGFncy5DYXRSZW5kZXJOb2RlKSAmJiBub2RlRGVmLmJpbmRpbmdzICYmIG5vZGVEZWYuYmluZGluZ3MubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gaTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmNsYXNzIERlYnVnQ29udGV4dF8gaW1wbGVtZW50cyBEZWJ1Z0NvbnRleHQge1xuICBwcml2YXRlIG5vZGVEZWY6IE5vZGVEZWY7XG4gIHByaXZhdGUgZWxWaWV3OiBWaWV3RGF0YTtcbiAgcHJpdmF0ZSBlbERlZjogTm9kZURlZjtcblxuICBjb25zdHJ1Y3RvcihwdWJsaWMgdmlldzogVmlld0RhdGEsIHB1YmxpYyBub2RlSW5kZXg6IG51bWJlcnxudWxsKSB7XG4gICAgaWYgKG5vZGVJbmRleCA9PSBudWxsKSB7XG4gICAgICB0aGlzLm5vZGVJbmRleCA9IG5vZGVJbmRleCA9IDA7XG4gICAgfVxuICAgIHRoaXMubm9kZURlZiA9IHZpZXcuZGVmLm5vZGVzW25vZGVJbmRleF07XG4gICAgbGV0IGVsRGVmID0gdGhpcy5ub2RlRGVmO1xuICAgIGxldCBlbFZpZXcgPSB2aWV3O1xuICAgIHdoaWxlIChlbERlZiAmJiAoZWxEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuVHlwZUVsZW1lbnQpID09PSAwKSB7XG4gICAgICBlbERlZiA9IGVsRGVmLnBhcmVudCAhO1xuICAgIH1cbiAgICBpZiAoIWVsRGVmKSB7XG4gICAgICB3aGlsZSAoIWVsRGVmICYmIGVsVmlldykge1xuICAgICAgICBlbERlZiA9IHZpZXdQYXJlbnRFbChlbFZpZXcpICE7XG4gICAgICAgIGVsVmlldyA9IGVsVmlldy5wYXJlbnQgITtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5lbERlZiA9IGVsRGVmO1xuICAgIHRoaXMuZWxWaWV3ID0gZWxWaWV3O1xuICB9XG5cbiAgcHJpdmF0ZSBnZXQgZWxPckNvbXBWaWV3KCkge1xuICAgIC8vIEhhcyB0byBiZSBkb25lIGxhemlseSBhcyB3ZSB1c2UgdGhlIERlYnVnQ29udGV4dCBhbHNvIGR1cmluZyBjcmVhdGlvbiBvZiBlbGVtZW50cy4uLlxuICAgIHJldHVybiBhc0VsZW1lbnREYXRhKHRoaXMuZWxWaWV3LCB0aGlzLmVsRGVmLm5vZGVJbmRleCkuY29tcG9uZW50VmlldyB8fCB0aGlzLnZpZXc7XG4gIH1cblxuICBnZXQgaW5qZWN0b3IoKTogSW5qZWN0b3IgeyByZXR1cm4gY3JlYXRlSW5qZWN0b3IodGhpcy5lbFZpZXcsIHRoaXMuZWxEZWYpOyB9XG5cbiAgZ2V0IGNvbXBvbmVudCgpOiBhbnkgeyByZXR1cm4gdGhpcy5lbE9yQ29tcFZpZXcuY29tcG9uZW50OyB9XG5cbiAgZ2V0IGNvbnRleHQoKTogYW55IHsgcmV0dXJuIHRoaXMuZWxPckNvbXBWaWV3LmNvbnRleHQ7IH1cblxuICBnZXQgcHJvdmlkZXJUb2tlbnMoKTogYW55W10ge1xuICAgIGNvbnN0IHRva2VuczogYW55W10gPSBbXTtcbiAgICBpZiAodGhpcy5lbERlZikge1xuICAgICAgZm9yIChsZXQgaSA9IHRoaXMuZWxEZWYubm9kZUluZGV4ICsgMTsgaSA8PSB0aGlzLmVsRGVmLm5vZGVJbmRleCArIHRoaXMuZWxEZWYuY2hpbGRDb3VudDtcbiAgICAgICAgICAgaSsrKSB7XG4gICAgICAgIGNvbnN0IGNoaWxkRGVmID0gdGhpcy5lbFZpZXcuZGVmLm5vZGVzW2ldO1xuICAgICAgICBpZiAoY2hpbGREZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuQ2F0UHJvdmlkZXIpIHtcbiAgICAgICAgICB0b2tlbnMucHVzaChjaGlsZERlZi5wcm92aWRlciAhLnRva2VuKTtcbiAgICAgICAgfVxuICAgICAgICBpICs9IGNoaWxkRGVmLmNoaWxkQ291bnQ7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0b2tlbnM7XG4gIH1cblxuICBnZXQgcmVmZXJlbmNlcygpOiB7W2tleTogc3RyaW5nXTogYW55fSB7XG4gICAgY29uc3QgcmVmZXJlbmNlczoge1trZXk6IHN0cmluZ106IGFueX0gPSB7fTtcbiAgICBpZiAodGhpcy5lbERlZikge1xuICAgICAgY29sbGVjdFJlZmVyZW5jZXModGhpcy5lbFZpZXcsIHRoaXMuZWxEZWYsIHJlZmVyZW5jZXMpO1xuXG4gICAgICBmb3IgKGxldCBpID0gdGhpcy5lbERlZi5ub2RlSW5kZXggKyAxOyBpIDw9IHRoaXMuZWxEZWYubm9kZUluZGV4ICsgdGhpcy5lbERlZi5jaGlsZENvdW50O1xuICAgICAgICAgICBpKyspIHtcbiAgICAgICAgY29uc3QgY2hpbGREZWYgPSB0aGlzLmVsVmlldy5kZWYubm9kZXNbaV07XG4gICAgICAgIGlmIChjaGlsZERlZi5mbGFncyAmIE5vZGVGbGFncy5DYXRQcm92aWRlcikge1xuICAgICAgICAgIGNvbGxlY3RSZWZlcmVuY2VzKHRoaXMuZWxWaWV3LCBjaGlsZERlZiwgcmVmZXJlbmNlcyk7XG4gICAgICAgIH1cbiAgICAgICAgaSArPSBjaGlsZERlZi5jaGlsZENvdW50O1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVmZXJlbmNlcztcbiAgfVxuXG4gIGdldCBjb21wb25lbnRSZW5kZXJFbGVtZW50KCkge1xuICAgIGNvbnN0IGVsRGF0YSA9IGZpbmRIb3N0RWxlbWVudCh0aGlzLmVsT3JDb21wVmlldyk7XG4gICAgcmV0dXJuIGVsRGF0YSA/IGVsRGF0YS5yZW5kZXJFbGVtZW50IDogdW5kZWZpbmVkO1xuICB9XG5cbiAgZ2V0IHJlbmRlck5vZGUoKTogYW55IHtcbiAgICByZXR1cm4gdGhpcy5ub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLlR5cGVUZXh0ID8gcmVuZGVyTm9kZSh0aGlzLnZpZXcsIHRoaXMubm9kZURlZikgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW5kZXJOb2RlKHRoaXMuZWxWaWV3LCB0aGlzLmVsRGVmKTtcbiAgfVxuXG4gIGxvZ0Vycm9yKGNvbnNvbGU6IENvbnNvbGUsIC4uLnZhbHVlczogYW55W10pIHtcbiAgICBsZXQgbG9nVmlld0RlZjogVmlld0RlZmluaXRpb247XG4gICAgbGV0IGxvZ05vZGVJbmRleDogbnVtYmVyO1xuICAgIGlmICh0aGlzLm5vZGVEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuVHlwZVRleHQpIHtcbiAgICAgIGxvZ1ZpZXdEZWYgPSB0aGlzLnZpZXcuZGVmO1xuICAgICAgbG9nTm9kZUluZGV4ID0gdGhpcy5ub2RlRGVmLm5vZGVJbmRleDtcbiAgICB9IGVsc2Uge1xuICAgICAgbG9nVmlld0RlZiA9IHRoaXMuZWxWaWV3LmRlZjtcbiAgICAgIGxvZ05vZGVJbmRleCA9IHRoaXMuZWxEZWYubm9kZUluZGV4O1xuICAgIH1cbiAgICAvLyBOb3RlOiB3ZSBvbmx5IGdlbmVyYXRlIGEgbG9nIGZ1bmN0aW9uIGZvciB0ZXh0IGFuZCBlbGVtZW50IG5vZGVzXG4gICAgLy8gdG8gbWFrZSB0aGUgZ2VuZXJhdGVkIGNvZGUgYXMgc21hbGwgYXMgcG9zc2libGUuXG4gICAgY29uc3QgcmVuZGVyTm9kZUluZGV4ID0gZ2V0UmVuZGVyTm9kZUluZGV4KGxvZ1ZpZXdEZWYsIGxvZ05vZGVJbmRleCk7XG4gICAgbGV0IGN1cnJSZW5kZXJOb2RlSW5kZXggPSAtMTtcbiAgICBsZXQgbm9kZUxvZ2dlcjogTm9kZUxvZ2dlciA9ICgpID0+IHtcbiAgICAgIGN1cnJSZW5kZXJOb2RlSW5kZXgrKztcbiAgICAgIGlmIChjdXJyUmVuZGVyTm9kZUluZGV4ID09PSByZW5kZXJOb2RlSW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIGNvbnNvbGUuZXJyb3IuYmluZChjb25zb2xlLCAuLi52YWx1ZXMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIE5PT1A7XG4gICAgICB9XG4gICAgfTtcbiAgICBsb2dWaWV3RGVmLmZhY3RvcnkgIShub2RlTG9nZ2VyKTtcbiAgICBpZiAoY3VyclJlbmRlck5vZGVJbmRleCA8IHJlbmRlck5vZGVJbmRleCkge1xuICAgICAgY29uc29sZS5lcnJvcignSWxsZWdhbCBzdGF0ZTogdGhlIFZpZXdEZWZpbml0aW9uRmFjdG9yeSBkaWQgbm90IGNhbGwgdGhlIGxvZ2dlciEnKTtcbiAgICAgICg8YW55PmNvbnNvbGUuZXJyb3IpKC4uLnZhbHVlcyk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGdldFJlbmRlck5vZGVJbmRleCh2aWV3RGVmOiBWaWV3RGVmaW5pdGlvbiwgbm9kZUluZGV4OiBudW1iZXIpOiBudW1iZXIge1xuICBsZXQgcmVuZGVyTm9kZUluZGV4ID0gLTE7XG4gIGZvciAobGV0IGkgPSAwOyBpIDw9IG5vZGVJbmRleDsgaSsrKSB7XG4gICAgY29uc3Qgbm9kZURlZiA9IHZpZXdEZWYubm9kZXNbaV07XG4gICAgaWYgKG5vZGVEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuQ2F0UmVuZGVyTm9kZSkge1xuICAgICAgcmVuZGVyTm9kZUluZGV4Kys7XG4gICAgfVxuICB9XG4gIHJldHVybiByZW5kZXJOb2RlSW5kZXg7XG59XG5cbmZ1bmN0aW9uIGZpbmRIb3N0RWxlbWVudCh2aWV3OiBWaWV3RGF0YSk6IEVsZW1lbnREYXRhfG51bGwge1xuICB3aGlsZSAodmlldyAmJiAhaXNDb21wb25lbnRWaWV3KHZpZXcpKSB7XG4gICAgdmlldyA9IHZpZXcucGFyZW50ICE7XG4gIH1cbiAgaWYgKHZpZXcucGFyZW50KSB7XG4gICAgcmV0dXJuIGFzRWxlbWVudERhdGEodmlldy5wYXJlbnQsIHZpZXdQYXJlbnRFbCh2aWV3KSAhLm5vZGVJbmRleCk7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIGNvbGxlY3RSZWZlcmVuY2VzKHZpZXc6IFZpZXdEYXRhLCBub2RlRGVmOiBOb2RlRGVmLCByZWZlcmVuY2VzOiB7W2tleTogc3RyaW5nXTogYW55fSkge1xuICBmb3IgKGxldCByZWZOYW1lIGluIG5vZGVEZWYucmVmZXJlbmNlcykge1xuICAgIHJlZmVyZW5jZXNbcmVmTmFtZV0gPSBnZXRRdWVyeVZhbHVlKHZpZXcsIG5vZGVEZWYsIG5vZGVEZWYucmVmZXJlbmNlc1tyZWZOYW1lXSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gY2FsbFdpdGhEZWJ1Z0NvbnRleHQoYWN0aW9uOiBEZWJ1Z0FjdGlvbiwgZm46IGFueSwgc2VsZjogYW55LCBhcmdzOiBhbnlbXSkge1xuICBjb25zdCBvbGRBY3Rpb24gPSBfY3VycmVudEFjdGlvbjtcbiAgY29uc3Qgb2xkVmlldyA9IF9jdXJyZW50VmlldztcbiAgY29uc3Qgb2xkTm9kZUluZGV4ID0gX2N1cnJlbnROb2RlSW5kZXg7XG4gIHRyeSB7XG4gICAgX2N1cnJlbnRBY3Rpb24gPSBhY3Rpb247XG4gICAgY29uc3QgcmVzdWx0ID0gZm4uYXBwbHkoc2VsZiwgYXJncyk7XG4gICAgX2N1cnJlbnRWaWV3ID0gb2xkVmlldztcbiAgICBfY3VycmVudE5vZGVJbmRleCA9IG9sZE5vZGVJbmRleDtcbiAgICBfY3VycmVudEFjdGlvbiA9IG9sZEFjdGlvbjtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9IGNhdGNoIChlKSB7XG4gICAgaWYgKGlzVmlld0RlYnVnRXJyb3IoZSkgfHwgIV9jdXJyZW50Vmlldykge1xuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gICAgdGhyb3cgdmlld1dyYXBwZWREZWJ1Z0Vycm9yKGUsIGdldEN1cnJlbnREZWJ1Z0NvbnRleHQoKSAhKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q3VycmVudERlYnVnQ29udGV4dCgpOiBEZWJ1Z0NvbnRleHR8bnVsbCB7XG4gIHJldHVybiBfY3VycmVudFZpZXcgPyBuZXcgRGVidWdDb250ZXh0XyhfY3VycmVudFZpZXcsIF9jdXJyZW50Tm9kZUluZGV4KSA6IG51bGw7XG59XG5cbmV4cG9ydCBjbGFzcyBEZWJ1Z1JlbmRlcmVyRmFjdG9yeTIgaW1wbGVtZW50cyBSZW5kZXJlckZhY3RvcnkyIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBkZWxlZ2F0ZTogUmVuZGVyZXJGYWN0b3J5Mikge31cblxuICBjcmVhdGVSZW5kZXJlcihlbGVtZW50OiBhbnksIHJlbmRlckRhdGE6IFJlbmRlcmVyVHlwZTJ8bnVsbCk6IFJlbmRlcmVyMiB7XG4gICAgcmV0dXJuIG5ldyBEZWJ1Z1JlbmRlcmVyMih0aGlzLmRlbGVnYXRlLmNyZWF0ZVJlbmRlcmVyKGVsZW1lbnQsIHJlbmRlckRhdGEpKTtcbiAgfVxuXG4gIGJlZ2luKCkge1xuICAgIGlmICh0aGlzLmRlbGVnYXRlLmJlZ2luKSB7XG4gICAgICB0aGlzLmRlbGVnYXRlLmJlZ2luKCk7XG4gICAgfVxuICB9XG4gIGVuZCgpIHtcbiAgICBpZiAodGhpcy5kZWxlZ2F0ZS5lbmQpIHtcbiAgICAgIHRoaXMuZGVsZWdhdGUuZW5kKCk7XG4gICAgfVxuICB9XG5cbiAgd2hlblJlbmRlcmluZ0RvbmUoKTogUHJvbWlzZTxhbnk+IHtcbiAgICBpZiAodGhpcy5kZWxlZ2F0ZS53aGVuUmVuZGVyaW5nRG9uZSkge1xuICAgICAgcmV0dXJuIHRoaXMuZGVsZWdhdGUud2hlblJlbmRlcmluZ0RvbmUoKTtcbiAgICB9XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShudWxsKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRGVidWdSZW5kZXJlcjIgaW1wbGVtZW50cyBSZW5kZXJlcjIge1xuICByZWFkb25seSBkYXRhOiB7W2tleTogc3RyaW5nXTogYW55fTtcblxuICAvKipcbiAgICogRmFjdG9yeSBmdW5jdGlvbiB1c2VkIHRvIGNyZWF0ZSBhIGBEZWJ1Z0NvbnRleHRgIHdoZW4gYSBub2RlIGlzIGNyZWF0ZWQuXG4gICAqXG4gICAqIFRoZSBgRGVidWdDb250ZXh0YCBhbGxvd3MgdG8gcmV0cmlldmUgaW5mb3JtYXRpb24gYWJvdXQgdGhlIG5vZGVzIHRoYXQgYXJlIHVzZWZ1bCBpbiB0ZXN0cy5cbiAgICpcbiAgICogVGhlIGZhY3RvcnkgaXMgY29uZmlndXJhYmxlIHNvIHRoYXQgdGhlIGBEZWJ1Z1JlbmRlcmVyMmAgY291bGQgaW5zdGFudGlhdGUgZWl0aGVyIGEgVmlldyBFbmdpbmVcbiAgICogb3IgYSBSZW5kZXIgY29udGV4dC5cbiAgICovXG4gIGRlYnVnQ29udGV4dEZhY3Rvcnk6ICgpID0+IERlYnVnQ29udGV4dCB8IG51bGwgPSBnZXRDdXJyZW50RGVidWdDb250ZXh0O1xuXG4gIHByaXZhdGUgZ2V0IGRlYnVnQ29udGV4dCgpIHsgcmV0dXJuIHRoaXMuZGVidWdDb250ZXh0RmFjdG9yeSgpOyB9XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBkZWxlZ2F0ZTogUmVuZGVyZXIyKSB7IHRoaXMuZGF0YSA9IHRoaXMuZGVsZWdhdGUuZGF0YTsgfVxuXG4gIGRlc3Ryb3lOb2RlKG5vZGU6IGFueSkge1xuICAgIHJlbW92ZURlYnVnTm9kZUZyb21JbmRleChnZXREZWJ1Z05vZGUobm9kZSkgISk7XG4gICAgaWYgKHRoaXMuZGVsZWdhdGUuZGVzdHJveU5vZGUpIHtcbiAgICAgIHRoaXMuZGVsZWdhdGUuZGVzdHJveU5vZGUobm9kZSk7XG4gICAgfVxuICB9XG5cbiAgZGVzdHJveSgpIHsgdGhpcy5kZWxlZ2F0ZS5kZXN0cm95KCk7IH1cblxuICBjcmVhdGVFbGVtZW50KG5hbWU6IHN0cmluZywgbmFtZXNwYWNlPzogc3RyaW5nKTogYW55IHtcbiAgICBjb25zdCBlbCA9IHRoaXMuZGVsZWdhdGUuY3JlYXRlRWxlbWVudChuYW1lLCBuYW1lc3BhY2UpO1xuICAgIGNvbnN0IGRlYnVnQ3R4ID0gdGhpcy5kZWJ1Z0NvbnRleHQ7XG4gICAgaWYgKGRlYnVnQ3R4KSB7XG4gICAgICBjb25zdCBkZWJ1Z0VsID0gbmV3IERlYnVnRWxlbWVudChlbCwgbnVsbCwgZGVidWdDdHgpO1xuICAgICAgZGVidWdFbC5uYW1lID0gbmFtZTtcbiAgICAgIGluZGV4RGVidWdOb2RlKGRlYnVnRWwpO1xuICAgIH1cbiAgICByZXR1cm4gZWw7XG4gIH1cblxuICBjcmVhdGVDb21tZW50KHZhbHVlOiBzdHJpbmcpOiBhbnkge1xuICAgIGNvbnN0IGNvbW1lbnQgPSB0aGlzLmRlbGVnYXRlLmNyZWF0ZUNvbW1lbnQodmFsdWUpO1xuICAgIGNvbnN0IGRlYnVnQ3R4ID0gdGhpcy5kZWJ1Z0NvbnRleHQ7XG4gICAgaWYgKGRlYnVnQ3R4KSB7XG4gICAgICBpbmRleERlYnVnTm9kZShuZXcgRGVidWdOb2RlKGNvbW1lbnQsIG51bGwsIGRlYnVnQ3R4KSk7XG4gICAgfVxuICAgIHJldHVybiBjb21tZW50O1xuICB9XG5cbiAgY3JlYXRlVGV4dCh2YWx1ZTogc3RyaW5nKTogYW55IHtcbiAgICBjb25zdCB0ZXh0ID0gdGhpcy5kZWxlZ2F0ZS5jcmVhdGVUZXh0KHZhbHVlKTtcbiAgICBjb25zdCBkZWJ1Z0N0eCA9IHRoaXMuZGVidWdDb250ZXh0O1xuICAgIGlmIChkZWJ1Z0N0eCkge1xuICAgICAgaW5kZXhEZWJ1Z05vZGUobmV3IERlYnVnTm9kZSh0ZXh0LCBudWxsLCBkZWJ1Z0N0eCkpO1xuICAgIH1cbiAgICByZXR1cm4gdGV4dDtcbiAgfVxuXG4gIGFwcGVuZENoaWxkKHBhcmVudDogYW55LCBuZXdDaGlsZDogYW55KTogdm9pZCB7XG4gICAgY29uc3QgZGVidWdFbCA9IGdldERlYnVnTm9kZShwYXJlbnQpO1xuICAgIGNvbnN0IGRlYnVnQ2hpbGRFbCA9IGdldERlYnVnTm9kZShuZXdDaGlsZCk7XG4gICAgaWYgKGRlYnVnRWwgJiYgZGVidWdDaGlsZEVsICYmIGRlYnVnRWwgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnQpIHtcbiAgICAgIGRlYnVnRWwuYWRkQ2hpbGQoZGVidWdDaGlsZEVsKTtcbiAgICB9XG4gICAgdGhpcy5kZWxlZ2F0ZS5hcHBlbmRDaGlsZChwYXJlbnQsIG5ld0NoaWxkKTtcbiAgfVxuXG4gIGluc2VydEJlZm9yZShwYXJlbnQ6IGFueSwgbmV3Q2hpbGQ6IGFueSwgcmVmQ2hpbGQ6IGFueSk6IHZvaWQge1xuICAgIGNvbnN0IGRlYnVnRWwgPSBnZXREZWJ1Z05vZGUocGFyZW50KTtcbiAgICBjb25zdCBkZWJ1Z0NoaWxkRWwgPSBnZXREZWJ1Z05vZGUobmV3Q2hpbGQpO1xuICAgIGNvbnN0IGRlYnVnUmVmRWwgPSBnZXREZWJ1Z05vZGUocmVmQ2hpbGQpICE7XG4gICAgaWYgKGRlYnVnRWwgJiYgZGVidWdDaGlsZEVsICYmIGRlYnVnRWwgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnQpIHtcbiAgICAgIGRlYnVnRWwuaW5zZXJ0QmVmb3JlKGRlYnVnUmVmRWwsIGRlYnVnQ2hpbGRFbCk7XG4gICAgfVxuXG4gICAgdGhpcy5kZWxlZ2F0ZS5pbnNlcnRCZWZvcmUocGFyZW50LCBuZXdDaGlsZCwgcmVmQ2hpbGQpO1xuICB9XG5cbiAgcmVtb3ZlQ2hpbGQocGFyZW50OiBhbnksIG9sZENoaWxkOiBhbnkpOiB2b2lkIHtcbiAgICBjb25zdCBkZWJ1Z0VsID0gZ2V0RGVidWdOb2RlKHBhcmVudCk7XG4gICAgY29uc3QgZGVidWdDaGlsZEVsID0gZ2V0RGVidWdOb2RlKG9sZENoaWxkKTtcbiAgICBpZiAoZGVidWdFbCAmJiBkZWJ1Z0NoaWxkRWwgJiYgZGVidWdFbCBpbnN0YW5jZW9mIERlYnVnRWxlbWVudCkge1xuICAgICAgZGVidWdFbC5yZW1vdmVDaGlsZChkZWJ1Z0NoaWxkRWwpO1xuICAgIH1cbiAgICB0aGlzLmRlbGVnYXRlLnJlbW92ZUNoaWxkKHBhcmVudCwgb2xkQ2hpbGQpO1xuICB9XG5cbiAgc2VsZWN0Um9vdEVsZW1lbnQoc2VsZWN0b3JPck5vZGU6IHN0cmluZ3xhbnksIHByZXNlcnZlQ29udGVudD86IGJvb2xlYW4pOiBhbnkge1xuICAgIGNvbnN0IGVsID0gdGhpcy5kZWxlZ2F0ZS5zZWxlY3RSb290RWxlbWVudChzZWxlY3Rvck9yTm9kZSwgcHJlc2VydmVDb250ZW50KTtcbiAgICBjb25zdCBkZWJ1Z0N0eCA9IGdldEN1cnJlbnREZWJ1Z0NvbnRleHQoKTtcbiAgICBpZiAoZGVidWdDdHgpIHtcbiAgICAgIGluZGV4RGVidWdOb2RlKG5ldyBEZWJ1Z0VsZW1lbnQoZWwsIG51bGwsIGRlYnVnQ3R4KSk7XG4gICAgfVxuICAgIHJldHVybiBlbDtcbiAgfVxuXG4gIHNldEF0dHJpYnV0ZShlbDogYW55LCBuYW1lOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcsIG5hbWVzcGFjZT86IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IGRlYnVnRWwgPSBnZXREZWJ1Z05vZGUoZWwpO1xuICAgIGlmIChkZWJ1Z0VsICYmIGRlYnVnRWwgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnQpIHtcbiAgICAgIGNvbnN0IGZ1bGxOYW1lID0gbmFtZXNwYWNlID8gbmFtZXNwYWNlICsgJzonICsgbmFtZSA6IG5hbWU7XG4gICAgICBkZWJ1Z0VsLmF0dHJpYnV0ZXNbZnVsbE5hbWVdID0gdmFsdWU7XG4gICAgfVxuICAgIHRoaXMuZGVsZWdhdGUuc2V0QXR0cmlidXRlKGVsLCBuYW1lLCB2YWx1ZSwgbmFtZXNwYWNlKTtcbiAgfVxuXG4gIHJlbW92ZUF0dHJpYnV0ZShlbDogYW55LCBuYW1lOiBzdHJpbmcsIG5hbWVzcGFjZT86IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IGRlYnVnRWwgPSBnZXREZWJ1Z05vZGUoZWwpO1xuICAgIGlmIChkZWJ1Z0VsICYmIGRlYnVnRWwgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnQpIHtcbiAgICAgIGNvbnN0IGZ1bGxOYW1lID0gbmFtZXNwYWNlID8gbmFtZXNwYWNlICsgJzonICsgbmFtZSA6IG5hbWU7XG4gICAgICBkZWJ1Z0VsLmF0dHJpYnV0ZXNbZnVsbE5hbWVdID0gbnVsbDtcbiAgICB9XG4gICAgdGhpcy5kZWxlZ2F0ZS5yZW1vdmVBdHRyaWJ1dGUoZWwsIG5hbWUsIG5hbWVzcGFjZSk7XG4gIH1cblxuICBhZGRDbGFzcyhlbDogYW55LCBuYW1lOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCBkZWJ1Z0VsID0gZ2V0RGVidWdOb2RlKGVsKTtcbiAgICBpZiAoZGVidWdFbCAmJiBkZWJ1Z0VsIGluc3RhbmNlb2YgRGVidWdFbGVtZW50KSB7XG4gICAgICBkZWJ1Z0VsLmNsYXNzZXNbbmFtZV0gPSB0cnVlO1xuICAgIH1cbiAgICB0aGlzLmRlbGVnYXRlLmFkZENsYXNzKGVsLCBuYW1lKTtcbiAgfVxuXG4gIHJlbW92ZUNsYXNzKGVsOiBhbnksIG5hbWU6IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IGRlYnVnRWwgPSBnZXREZWJ1Z05vZGUoZWwpO1xuICAgIGlmIChkZWJ1Z0VsICYmIGRlYnVnRWwgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnQpIHtcbiAgICAgIGRlYnVnRWwuY2xhc3Nlc1tuYW1lXSA9IGZhbHNlO1xuICAgIH1cbiAgICB0aGlzLmRlbGVnYXRlLnJlbW92ZUNsYXNzKGVsLCBuYW1lKTtcbiAgfVxuXG4gIHNldFN0eWxlKGVsOiBhbnksIHN0eWxlOiBzdHJpbmcsIHZhbHVlOiBhbnksIGZsYWdzOiBSZW5kZXJlclN0eWxlRmxhZ3MyKTogdm9pZCB7XG4gICAgY29uc3QgZGVidWdFbCA9IGdldERlYnVnTm9kZShlbCk7XG4gICAgaWYgKGRlYnVnRWwgJiYgZGVidWdFbCBpbnN0YW5jZW9mIERlYnVnRWxlbWVudCkge1xuICAgICAgZGVidWdFbC5zdHlsZXNbc3R5bGVdID0gdmFsdWU7XG4gICAgfVxuICAgIHRoaXMuZGVsZWdhdGUuc2V0U3R5bGUoZWwsIHN0eWxlLCB2YWx1ZSwgZmxhZ3MpO1xuICB9XG5cbiAgcmVtb3ZlU3R5bGUoZWw6IGFueSwgc3R5bGU6IHN0cmluZywgZmxhZ3M6IFJlbmRlcmVyU3R5bGVGbGFnczIpOiB2b2lkIHtcbiAgICBjb25zdCBkZWJ1Z0VsID0gZ2V0RGVidWdOb2RlKGVsKTtcbiAgICBpZiAoZGVidWdFbCAmJiBkZWJ1Z0VsIGluc3RhbmNlb2YgRGVidWdFbGVtZW50KSB7XG4gICAgICBkZWJ1Z0VsLnN0eWxlc1tzdHlsZV0gPSBudWxsO1xuICAgIH1cbiAgICB0aGlzLmRlbGVnYXRlLnJlbW92ZVN0eWxlKGVsLCBzdHlsZSwgZmxhZ3MpO1xuICB9XG5cbiAgc2V0UHJvcGVydHkoZWw6IGFueSwgbmFtZTogc3RyaW5nLCB2YWx1ZTogYW55KTogdm9pZCB7XG4gICAgY29uc3QgZGVidWdFbCA9IGdldERlYnVnTm9kZShlbCk7XG4gICAgaWYgKGRlYnVnRWwgJiYgZGVidWdFbCBpbnN0YW5jZW9mIERlYnVnRWxlbWVudCkge1xuICAgICAgZGVidWdFbC5wcm9wZXJ0aWVzW25hbWVdID0gdmFsdWU7XG4gICAgfVxuICAgIHRoaXMuZGVsZWdhdGUuc2V0UHJvcGVydHkoZWwsIG5hbWUsIHZhbHVlKTtcbiAgfVxuXG4gIGxpc3RlbihcbiAgICAgIHRhcmdldDogJ2RvY3VtZW50J3wnd2luZG93cyd8J2JvZHknfGFueSwgZXZlbnROYW1lOiBzdHJpbmcsXG4gICAgICBjYWxsYmFjazogKGV2ZW50OiBhbnkpID0+IGJvb2xlYW4pOiAoKSA9PiB2b2lkIHtcbiAgICBpZiAodHlwZW9mIHRhcmdldCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIGNvbnN0IGRlYnVnRWwgPSBnZXREZWJ1Z05vZGUodGFyZ2V0KTtcbiAgICAgIGlmIChkZWJ1Z0VsKSB7XG4gICAgICAgIGRlYnVnRWwubGlzdGVuZXJzLnB1c2gobmV3IEV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCBjYWxsYmFjaykpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmRlbGVnYXRlLmxpc3Rlbih0YXJnZXQsIGV2ZW50TmFtZSwgY2FsbGJhY2spO1xuICB9XG5cbiAgcGFyZW50Tm9kZShub2RlOiBhbnkpOiBhbnkgeyByZXR1cm4gdGhpcy5kZWxlZ2F0ZS5wYXJlbnROb2RlKG5vZGUpOyB9XG4gIG5leHRTaWJsaW5nKG5vZGU6IGFueSk6IGFueSB7IHJldHVybiB0aGlzLmRlbGVnYXRlLm5leHRTaWJsaW5nKG5vZGUpOyB9XG4gIHNldFZhbHVlKG5vZGU6IGFueSwgdmFsdWU6IHN0cmluZyk6IHZvaWQgeyByZXR1cm4gdGhpcy5kZWxlZ2F0ZS5zZXRWYWx1ZShub2RlLCB2YWx1ZSk7IH1cbn1cbiJdfQ==