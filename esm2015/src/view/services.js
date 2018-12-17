/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { DebugElement__PRE_R3__, DebugNode__PRE_R3__, EventListener, getDebugNode, indexDebugNode, removeDebugNodeFromIndex } from '../debug/debug_node';
import { getInjectableDef } from '../di/defs';
import { ErrorHandler } from '../error_handler';
import { isDevMode } from '../is_dev_mode';
import { RendererFactory2 } from '../render/api';
import { Sanitizer } from '../sanitization/security';
import { normalizeDebugBindingName, normalizeDebugBindingValue } from '../util/ng_reflect';
import { isViewDebugError, viewDestroyedError, viewWrappedDebugError } from './errors';
import { resolveDep } from './provider';
import { dirtyParentQueries, getQueryValue } from './query';
import { createInjector, createNgModuleRef, getComponentViewDefinitionFactory } from './refs';
import { Services, asElementData, asPureExpressionData } from './types';
import { NOOP, isComponentView, renderNode, resolveDefinition, splitDepsDsl, tokenKey, viewParentEl } from './util';
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
    const overrideComponentView = viewDefOverrides.get((/** @type {?} */ ((/** @type {?} */ ((/** @type {?} */ (nodeDef.element)).componentProvider)).provider)).token);
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
        providerOverridesWithScope.set((/** @type {?} */ (override.token)), override);
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
    const compViewDef = resolveDefinition((/** @type {?} */ ((/** @type {?} */ (hostViewDef.nodes[0].element)).componentView)));
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
// Notes about the algorithm:
// 1) Locate the providers of an element and check if one of them was overwritten
// 2) Change the providers of that element
//
// We only create new datastructures if we need to, to keep perf impact
// reasonable.
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
    def = (/** @type {?} */ (def.factory))(() => NOOP);
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
                providerOverrides.has((/** @type {?} */ (nodeDef.provider)).token)) {
                elIndicesWithOverwrittenProviders.push((/** @type {?} */ (lastElementDef)).nodeIndex);
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
                const provider = (/** @type {?} */ (nodeDef.provider));
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
// Notes about the algorithm:
// We only create new datastructures if we need to, to keep perf impact
// reasonable.
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
    def = (/** @type {?} */ (def.factory))(() => NOOP);
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
                if ((/** @type {?} */ (getInjectableDef(token))).providedIn === module) {
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
                if (moduleSet.has((/** @type {?} */ (getInjectableDef(token))).providedIn)) {
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
const DebugAction = {
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
    const changed = ((/** @type {?} */ (checkAndUpdateNode)))(view, nodeDef, argStyle, ...givenValues);
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
                    bindingValues[normalizeDebugBindingName((/** @type {?} */ (binding.nonMinifiedName)))] =
                        normalizeDebugBindingValue(value);
                }
            }
            /** @type {?} */
            const elDef = (/** @type {?} */ (nodeDef.parent));
            /** @type {?} */
            const el = asElementData(view, elDef.nodeIndex).renderElement;
            if (!(/** @type {?} */ (elDef.element)).name) {
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
    ((/** @type {?} */ (checkNoChangesNode)))(view, nodeDef, argStyle, ...values);
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
            elDef = (/** @type {?} */ (elDef.parent));
        }
        if (!elDef) {
            while (!elDef && elView) {
                elDef = (/** @type {?} */ (viewParentEl(elView)));
                elView = (/** @type {?} */ (elView.parent));
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
                    tokens.push((/** @type {?} */ (childDef.provider)).token);
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
        // Note: we only generate a log function for text and element nodes
        // to make the generated code as small as possible.
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
        };
        (/** @type {?} */ (logViewDef.factory))(nodeLogger);
        if (currRenderNodeIndex < renderNodeIndex) {
            console.error('Illegal state: the ViewDefinitionFactory did not call the logger!');
            ((/** @type {?} */ (console.error)))(...values);
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
        view = (/** @type {?} */ (view.parent));
    }
    if (view.parent) {
        return asElementData(view.parent, (/** @type {?} */ (viewParentEl(view))).nodeIndex);
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
        throw viewWrappedDebugError(e, (/** @type {?} */ (getCurrentDebugContext())));
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
     * @param {?} nativeElement
     * @return {?}
     */
    createDebugContext(nativeElement) { return this.debugContextFactory(nativeElement); }
    /**
     * @param {?} node
     * @return {?}
     */
    destroyNode(node) {
        removeDebugNodeFromIndex((/** @type {?} */ (getDebugNode(node))));
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
        const debugCtx = this.createDebugContext(el);
        if (debugCtx) {
            /** @type {?} */
            const debugEl = new DebugElement__PRE_R3__(el, null, debugCtx);
            ((/** @type {?} */ (debugEl))).name = name;
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
        const debugCtx = this.createDebugContext(comment);
        if (debugCtx) {
            indexDebugNode(new DebugNode__PRE_R3__(comment, null, debugCtx));
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
        const debugCtx = this.createDebugContext(text);
        if (debugCtx) {
            indexDebugNode(new DebugNode__PRE_R3__(text, null, debugCtx));
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
        if (debugEl && debugChildEl && debugEl instanceof DebugElement__PRE_R3__) {
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
        const debugRefEl = (/** @type {?} */ (getDebugNode(refChild)));
        if (debugEl && debugChildEl && debugEl instanceof DebugElement__PRE_R3__) {
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
        if (debugEl && debugChildEl && debugEl instanceof DebugElement__PRE_R3__) {
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
            indexDebugNode(new DebugElement__PRE_R3__(el, null, debugCtx));
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
        if (debugEl && debugEl instanceof DebugElement__PRE_R3__) {
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
        if (debugEl && debugEl instanceof DebugElement__PRE_R3__) {
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
        if (debugEl && debugEl instanceof DebugElement__PRE_R3__) {
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
        if (debugEl && debugEl instanceof DebugElement__PRE_R3__) {
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
        if (debugEl && debugEl instanceof DebugElement__PRE_R3__) {
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
        if (debugEl && debugEl instanceof DebugElement__PRE_R3__) {
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
        if (debugEl && debugEl instanceof DebugElement__PRE_R3__) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmljZXMuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9jb3JlL3NyYy92aWV3L3NlcnZpY2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLHNCQUFzQixFQUFFLG1CQUFtQixFQUFFLGFBQWEsRUFBRSxZQUFZLEVBQUUsY0FBYyxFQUFFLHdCQUF3QixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFFdkosT0FBTyxFQUFnQixnQkFBZ0IsRUFBQyxNQUFNLFlBQVksQ0FBQztBQUUzRCxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDOUMsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBR3pDLE9BQU8sRUFBWSxnQkFBZ0IsRUFBcUMsTUFBTSxlQUFlLENBQUM7QUFDOUYsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBRW5ELE9BQU8sRUFBQyx5QkFBeUIsRUFBRSwwQkFBMEIsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQ3pGLE9BQU8sRUFBQyxnQkFBZ0IsRUFBRSxrQkFBa0IsRUFBRSxxQkFBcUIsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNyRixPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBQ3RDLE9BQU8sRUFBQyxrQkFBa0IsRUFBRSxhQUFhLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFDMUQsT0FBTyxFQUFDLGNBQWMsRUFBRSxpQkFBaUIsRUFBRSxpQ0FBaUMsRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUM1RixPQUFPLEVBQW1KLFFBQVEsRUFBdUMsYUFBYSxFQUFFLG9CQUFvQixFQUFDLE1BQU0sU0FBUyxDQUFDO0FBQzdQLE9BQU8sRUFBQyxJQUFJLEVBQUUsZUFBZSxFQUFFLFVBQVUsRUFBRSxpQkFBaUIsRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFFLFlBQVksRUFBQyxNQUFNLFFBQVEs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SUFBSSxhQUFhLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7YUFDaEU7U0FDRjtRQUVELE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUMzRCxDQUFDOzs7OztJQUVELFVBQVUsQ0FBQyxJQUFTLElBQVMsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Ozs7O0lBQ3JFLFdBQVcsQ0FBQyxJQUFTLElBQVMsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Ozs7OztJQUN2RSxRQUFRLENBQUMsSUFBUyxFQUFFLEtBQWEsSUFBVSxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDekY7OztJQXRLQyw4QkFBb0M7Ozs7Ozs7Ozs7SUFZcEMsNkNBQTJGOztJQUUvRSxrQ0FBMkIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RGVidWdFbGVtZW50X19QUkVfUjNfXywgRGVidWdOb2RlX19QUkVfUjNfXywgRXZlbnRMaXN0ZW5lciwgZ2V0RGVidWdOb2RlLCBpbmRleERlYnVnTm9kZSwgcmVtb3ZlRGVidWdOb2RlRnJvbUluZGV4fSBmcm9tICcuLi9kZWJ1Zy9kZWJ1Z19ub2RlJztcbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4uL2RpJztcbmltcG9ydCB7SW5qZWN0YWJsZURlZiwgZ2V0SW5qZWN0YWJsZURlZn0gZnJvbSAnLi4vZGkvZGVmcyc7XG5pbXBvcnQge0luamVjdGFibGVUeXBlfSBmcm9tICcuLi9kaS9pbmplY3RhYmxlJztcbmltcG9ydCB7RXJyb3JIYW5kbGVyfSBmcm9tICcuLi9lcnJvcl9oYW5kbGVyJztcbmltcG9ydCB7aXNEZXZNb2RlfSBmcm9tICcuLi9pc19kZXZfbW9kZSc7XG5pbXBvcnQge0NvbXBvbmVudEZhY3Rvcnl9IGZyb20gJy4uL2xpbmtlci9jb21wb25lbnRfZmFjdG9yeSc7XG5pbXBvcnQge05nTW9kdWxlUmVmfSBmcm9tICcuLi9saW5rZXIvbmdfbW9kdWxlX2ZhY3RvcnknO1xuaW1wb3J0IHtSZW5kZXJlcjIsIFJlbmRlcmVyRmFjdG9yeTIsIFJlbmRlcmVyU3R5bGVGbGFnczIsIFJlbmRlcmVyVHlwZTJ9IGZyb20gJy4uL3JlbmRlci9hcGknO1xuaW1wb3J0IHtTYW5pdGl6ZXJ9IGZyb20gJy4uL3Nhbml0aXphdGlvbi9zZWN1cml0eSc7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL3R5cGUnO1xuaW1wb3J0IHtub3JtYWxpemVEZWJ1Z0JpbmRpbmdOYW1lLCBub3JtYWxpemVEZWJ1Z0JpbmRpbmdWYWx1ZX0gZnJvbSAnLi4vdXRpbC9uZ19yZWZsZWN0JztcbmltcG9ydCB7aXNWaWV3RGVidWdFcnJvciwgdmlld0Rlc3Ryb3llZEVycm9yLCB2aWV3V3JhcHBlZERlYnVnRXJyb3J9IGZyb20gJy4vZXJyb3JzJztcbmltcG9ydCB7cmVzb2x2ZURlcH0gZnJvbSAnLi9wcm92aWRlcic7XG5pbXBvcnQge2RpcnR5UGFyZW50UXVlcmllcywgZ2V0UXVlcnlWYWx1ZX0gZnJvbSAnLi9xdWVyeSc7XG5pbXBvcnQge2NyZWF0ZUluamVjdG9yLCBjcmVhdGVOZ01vZHVsZVJlZiwgZ2V0Q29tcG9uZW50Vmlld0RlZmluaXRpb25GYWN0b3J5fSBmcm9tICcuL3JlZnMnO1xuaW1wb3J0IHtBcmd1bWVudFR5cGUsIEJpbmRpbmdGbGFncywgQ2hlY2tUeXBlLCBEZWJ1Z0NvbnRleHQsIEVsZW1lbnREYXRhLCBOZ01vZHVsZURlZmluaXRpb24sIE5vZGVEZWYsIE5vZGVGbGFncywgTm9kZUxvZ2dlciwgUHJvdmlkZXJPdmVycmlkZSwgUm9vdERhdGEsIFNlcnZpY2VzLCBWaWV3RGF0YSwgVmlld0RlZmluaXRpb24sIFZpZXdTdGF0ZSwgYXNFbGVtZW50RGF0YSwgYXNQdXJlRXhwcmVzc2lvbkRhdGF9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHtOT09QLCBpc0NvbXBvbmVudFZpZXcsIHJlbmRlck5vZGUsIHJlc29sdmVEZWZpbml0aW9uLCBzcGxpdERlcHNEc2wsIHRva2VuS2V5LCB2aWV3UGFyZW50RWx9IGZyb20gJy4vdXRpbCc7XG5pbXBvcnQge2NoZWNrQW5kVXBkYXRlTm9kZSwgY2hlY2tBbmRVcGRhdGVWaWV3LCBjaGVja05vQ2hhbmdlc05vZGUsIGNoZWNrTm9DaGFuZ2VzVmlldywgY3JlYXRlQ29tcG9uZW50VmlldywgY3JlYXRlRW1iZWRkZWRWaWV3LCBjcmVhdGVSb290VmlldywgZGVzdHJveVZpZXd9IGZyb20gJy4vdmlldyc7XG5cblxubGV0IGluaXRpYWxpemVkID0gZmFsc2U7XG5cbmV4cG9ydCBmdW5jdGlvbiBpbml0U2VydmljZXNJZk5lZWRlZCgpIHtcbiAgaWYgKGluaXRpYWxpemVkKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGluaXRpYWxpemVkID0gdHJ1ZTtcbiAgY29uc3Qgc2VydmljZXMgPSBpc0Rldk1vZGUoKSA/IGNyZWF0ZURlYnVnU2VydmljZXMoKSA6IGNyZWF0ZVByb2RTZXJ2aWNlcygpO1xuICBTZXJ2aWNlcy5zZXRDdXJyZW50Tm9kZSA9IHNlcnZpY2VzLnNldEN1cnJlbnROb2RlO1xuICBTZXJ2aWNlcy5jcmVhdGVSb290VmlldyA9IHNlcnZpY2VzLmNyZWF0ZVJvb3RWaWV3O1xuICBTZXJ2aWNlcy5jcmVhdGVFbWJlZGRlZFZpZXcgPSBzZXJ2aWNlcy5jcmVhdGVFbWJlZGRlZFZpZXc7XG4gIFNlcnZpY2VzLmNyZWF0ZUNvbXBvbmVudFZpZXcgPSBzZXJ2aWNlcy5jcmVhdGVDb21wb25lbnRWaWV3O1xuICBTZXJ2aWNlcy5jcmVhdGVOZ01vZHVsZVJlZiA9IHNlcnZpY2VzLmNyZWF0ZU5nTW9kdWxlUmVmO1xuICBTZXJ2aWNlcy5vdmVycmlkZVByb3ZpZGVyID0gc2VydmljZXMub3ZlcnJpZGVQcm92aWRlcjtcbiAgU2VydmljZXMub3ZlcnJpZGVDb21wb25lbnRWaWV3ID0gc2VydmljZXMub3ZlcnJpZGVDb21wb25lbnRWaWV3O1xuICBTZXJ2aWNlcy5jbGVhck92ZXJyaWRlcyA9IHNlcnZpY2VzLmNsZWFyT3ZlcnJpZGVzO1xuICBTZXJ2aWNlcy5jaGVja0FuZFVwZGF0ZVZpZXcgPSBzZXJ2aWNlcy5jaGVja0FuZFVwZGF0ZVZpZXc7XG4gIFNlcnZpY2VzLmNoZWNrTm9DaGFuZ2VzVmlldyA9IHNlcnZpY2VzLmNoZWNrTm9DaGFuZ2VzVmlldztcbiAgU2VydmljZXMuZGVzdHJveVZpZXcgPSBzZXJ2aWNlcy5kZXN0cm95VmlldztcbiAgU2VydmljZXMucmVzb2x2ZURlcCA9IHJlc29sdmVEZXA7XG4gIFNlcnZpY2VzLmNyZWF0ZURlYnVnQ29udGV4dCA9IHNlcnZpY2VzLmNyZWF0ZURlYnVnQ29udGV4dDtcbiAgU2VydmljZXMuaGFuZGxlRXZlbnQgPSBzZXJ2aWNlcy5oYW5kbGVFdmVudDtcbiAgU2VydmljZXMudXBkYXRlRGlyZWN0aXZlcyA9IHNlcnZpY2VzLnVwZGF0ZURpcmVjdGl2ZXM7XG4gIFNlcnZpY2VzLnVwZGF0ZVJlbmRlcmVyID0gc2VydmljZXMudXBkYXRlUmVuZGVyZXI7XG4gIFNlcnZpY2VzLmRpcnR5UGFyZW50UXVlcmllcyA9IGRpcnR5UGFyZW50UXVlcmllcztcbn1cblxuZnVuY3Rpb24gY3JlYXRlUHJvZFNlcnZpY2VzKCkge1xuICByZXR1cm4ge1xuICAgIHNldEN1cnJlbnROb2RlOiAoKSA9PiB7fSxcbiAgICBjcmVhdGVSb290VmlldzogY3JlYXRlUHJvZFJvb3RWaWV3LFxuICAgIGNyZWF0ZUVtYmVkZGVkVmlldzogY3JlYXRlRW1iZWRkZWRWaWV3LFxuICAgIGNyZWF0ZUNvbXBvbmVudFZpZXc6IGNyZWF0ZUNvbXBvbmVudFZpZXcsXG4gICAgY3JlYXRlTmdNb2R1bGVSZWY6IGNyZWF0ZU5nTW9kdWxlUmVmLFxuICAgIG92ZXJyaWRlUHJvdmlkZXI6IE5PT1AsXG4gICAgb3ZlcnJpZGVDb21wb25lbnRWaWV3OiBOT09QLFxuICAgIGNsZWFyT3ZlcnJpZGVzOiBOT09QLFxuICAgIGNoZWNrQW5kVXBkYXRlVmlldzogY2hlY2tBbmRVcGRhdGVWaWV3LFxuICAgIGNoZWNrTm9DaGFuZ2VzVmlldzogY2hlY2tOb0NoYW5nZXNWaWV3LFxuICAgIGRlc3Ryb3lWaWV3OiBkZXN0cm95VmlldyxcbiAgICBjcmVhdGVEZWJ1Z0NvbnRleHQ6ICh2aWV3OiBWaWV3RGF0YSwgbm9kZUluZGV4OiBudW1iZXIpID0+IG5ldyBEZWJ1Z0NvbnRleHRfKHZpZXcsIG5vZGVJbmRleCksXG4gICAgaGFuZGxlRXZlbnQ6ICh2aWV3OiBWaWV3RGF0YSwgbm9kZUluZGV4OiBudW1iZXIsIGV2ZW50TmFtZTogc3RyaW5nLCBldmVudDogYW55KSA9PlxuICAgICAgICAgICAgICAgICAgICAgdmlldy5kZWYuaGFuZGxlRXZlbnQodmlldywgbm9kZUluZGV4LCBldmVudE5hbWUsIGV2ZW50KSxcbiAgICB1cGRhdGVEaXJlY3RpdmVzOiAodmlldzogVmlld0RhdGEsIGNoZWNrVHlwZTogQ2hlY2tUeXBlKSA9PiB2aWV3LmRlZi51cGRhdGVEaXJlY3RpdmVzKFxuICAgICAgICAgICAgICAgICAgICAgICAgICBjaGVja1R5cGUgPT09IENoZWNrVHlwZS5DaGVja0FuZFVwZGF0ZSA/IHByb2RDaGVja0FuZFVwZGF0ZU5vZGUgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2RDaGVja05vQ2hhbmdlc05vZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHZpZXcpLFxuICAgIHVwZGF0ZVJlbmRlcmVyOiAodmlldzogVmlld0RhdGEsIGNoZWNrVHlwZTogQ2hlY2tUeXBlKSA9PiB2aWV3LmRlZi51cGRhdGVSZW5kZXJlcihcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrVHlwZSA9PT0gQ2hlY2tUeXBlLkNoZWNrQW5kVXBkYXRlID8gcHJvZENoZWNrQW5kVXBkYXRlTm9kZSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2RDaGVja05vQ2hhbmdlc05vZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICB2aWV3KSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlRGVidWdTZXJ2aWNlcygpIHtcbiAgcmV0dXJuIHtcbiAgICBzZXRDdXJyZW50Tm9kZTogZGVidWdTZXRDdXJyZW50Tm9kZSxcbiAgICBjcmVhdGVSb290VmlldzogZGVidWdDcmVhdGVSb290VmlldyxcbiAgICBjcmVhdGVFbWJlZGRlZFZpZXc6IGRlYnVnQ3JlYXRlRW1iZWRkZWRWaWV3LFxuICAgIGNyZWF0ZUNvbXBvbmVudFZpZXc6IGRlYnVnQ3JlYXRlQ29tcG9uZW50VmlldyxcbiAgICBjcmVhdGVOZ01vZHVsZVJlZjogZGVidWdDcmVhdGVOZ01vZHVsZVJlZixcbiAgICBvdmVycmlkZVByb3ZpZGVyOiBkZWJ1Z092ZXJyaWRlUHJvdmlkZXIsXG4gICAgb3ZlcnJpZGVDb21wb25lbnRWaWV3OiBkZWJ1Z092ZXJyaWRlQ29tcG9uZW50VmlldyxcbiAgICBjbGVhck92ZXJyaWRlczogZGVidWdDbGVhck92ZXJyaWRlcyxcbiAgICBjaGVja0FuZFVwZGF0ZVZpZXc6IGRlYnVnQ2hlY2tBbmRVcGRhdGVWaWV3LFxuICAgIGNoZWNrTm9DaGFuZ2VzVmlldzogZGVidWdDaGVja05vQ2hhbmdlc1ZpZXcsXG4gICAgZGVzdHJveVZpZXc6IGRlYnVnRGVzdHJveVZpZXcsXG4gICAgY3JlYXRlRGVidWdDb250ZXh0OiAodmlldzogVmlld0RhdGEsIG5vZGVJbmRleDogbnVtYmVyKSA9PiBuZXcgRGVidWdDb250ZXh0Xyh2aWV3LCBub2RlSW5kZXgpLFxuICAgIGhhbmRsZUV2ZW50OiBkZWJ1Z0hhbmRsZUV2ZW50LFxuICAgIHVwZGF0ZURpcmVjdGl2ZXM6IGRlYnVnVXBkYXRlRGlyZWN0aXZlcyxcbiAgICB1cGRhdGVSZW5kZXJlcjogZGVidWdVcGRhdGVSZW5kZXJlcixcbiAgfTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlUHJvZFJvb3RWaWV3KFxuICAgIGVsSW5qZWN0b3I6IEluamVjdG9yLCBwcm9qZWN0YWJsZU5vZGVzOiBhbnlbXVtdLCByb290U2VsZWN0b3JPck5vZGU6IHN0cmluZyB8IGFueSxcbiAgICBkZWY6IFZpZXdEZWZpbml0aW9uLCBuZ01vZHVsZTogTmdNb2R1bGVSZWY8YW55PiwgY29udGV4dD86IGFueSk6IFZpZXdEYXRhIHtcbiAgY29uc3QgcmVuZGVyZXJGYWN0b3J5OiBSZW5kZXJlckZhY3RvcnkyID0gbmdNb2R1bGUuaW5qZWN0b3IuZ2V0KFJlbmRlcmVyRmFjdG9yeTIpO1xuICByZXR1cm4gY3JlYXRlUm9vdFZpZXcoXG4gICAgICBjcmVhdGVSb290RGF0YShlbEluamVjdG9yLCBuZ01vZHVsZSwgcmVuZGVyZXJGYWN0b3J5LCBwcm9qZWN0YWJsZU5vZGVzLCByb290U2VsZWN0b3JPck5vZGUpLFxuICAgICAgZGVmLCBjb250ZXh0KTtcbn1cblxuZnVuY3Rpb24gZGVidWdDcmVhdGVSb290VmlldyhcbiAgICBlbEluamVjdG9yOiBJbmplY3RvciwgcHJvamVjdGFibGVOb2RlczogYW55W11bXSwgcm9vdFNlbGVjdG9yT3JOb2RlOiBzdHJpbmcgfCBhbnksXG4gICAgZGVmOiBWaWV3RGVmaW5pdGlvbiwgbmdNb2R1bGU6IE5nTW9kdWxlUmVmPGFueT4sIGNvbnRleHQ/OiBhbnkpOiBWaWV3RGF0YSB7XG4gIGNvbnN0IHJlbmRlcmVyRmFjdG9yeTogUmVuZGVyZXJGYWN0b3J5MiA9IG5nTW9kdWxlLmluamVjdG9yLmdldChSZW5kZXJlckZhY3RvcnkyKTtcbiAgY29uc3Qgcm9vdCA9IGNyZWF0ZVJvb3REYXRhKFxuICAgICAgZWxJbmplY3RvciwgbmdNb2R1bGUsIG5ldyBEZWJ1Z1JlbmRlcmVyRmFjdG9yeTIocmVuZGVyZXJGYWN0b3J5KSwgcHJvamVjdGFibGVOb2RlcyxcbiAgICAgIHJvb3RTZWxlY3Rvck9yTm9kZSk7XG4gIGNvbnN0IGRlZldpdGhPdmVycmlkZSA9IGFwcGx5UHJvdmlkZXJPdmVycmlkZXNUb1ZpZXcoZGVmKTtcbiAgcmV0dXJuIGNhbGxXaXRoRGVidWdDb250ZXh0KFxuICAgICAgRGVidWdBY3Rpb24uY3JlYXRlLCBjcmVhdGVSb290VmlldywgbnVsbCwgW3Jvb3QsIGRlZldpdGhPdmVycmlkZSwgY29udGV4dF0pO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVSb290RGF0YShcbiAgICBlbEluamVjdG9yOiBJbmplY3RvciwgbmdNb2R1bGU6IE5nTW9kdWxlUmVmPGFueT4sIHJlbmRlcmVyRmFjdG9yeTogUmVuZGVyZXJGYWN0b3J5MixcbiAgICBwcm9qZWN0YWJsZU5vZGVzOiBhbnlbXVtdLCByb290U2VsZWN0b3JPck5vZGU6IGFueSk6IFJvb3REYXRhIHtcbiAgY29uc3Qgc2FuaXRpemVyID0gbmdNb2R1bGUuaW5qZWN0b3IuZ2V0KFNhbml0aXplcik7XG4gIGNvbnN0IGVycm9ySGFuZGxlciA9IG5nTW9kdWxlLmluamVjdG9yLmdldChFcnJvckhhbmRsZXIpO1xuICBjb25zdCByZW5kZXJlciA9IHJlbmRlcmVyRmFjdG9yeS5jcmVhdGVSZW5kZXJlcihudWxsLCBudWxsKTtcbiAgcmV0dXJuIHtcbiAgICBuZ01vZHVsZSxcbiAgICBpbmplY3RvcjogZWxJbmplY3RvciwgcHJvamVjdGFibGVOb2RlcyxcbiAgICBzZWxlY3Rvck9yTm9kZTogcm9vdFNlbGVjdG9yT3JOb2RlLCBzYW5pdGl6ZXIsIHJlbmRlcmVyRmFjdG9yeSwgcmVuZGVyZXIsIGVycm9ySGFuZGxlclxuICB9O1xufVxuXG5mdW5jdGlvbiBkZWJ1Z0NyZWF0ZUVtYmVkZGVkVmlldyhcbiAgICBwYXJlbnRWaWV3OiBWaWV3RGF0YSwgYW5jaG9yRGVmOiBOb2RlRGVmLCB2aWV3RGVmOiBWaWV3RGVmaW5pdGlvbiwgY29udGV4dD86IGFueSk6IFZpZXdEYXRhIHtcbiAgY29uc3QgZGVmV2l0aE92ZXJyaWRlID0gYXBwbHlQcm92aWRlck92ZXJyaWRlc1RvVmlldyh2aWV3RGVmKTtcbiAgcmV0dXJuIGNhbGxXaXRoRGVidWdDb250ZXh0KFxuICAgICAgRGVidWdBY3Rpb24uY3JlYXRlLCBjcmVhdGVFbWJlZGRlZFZpZXcsIG51bGwsXG4gICAgICBbcGFyZW50VmlldywgYW5jaG9yRGVmLCBkZWZXaXRoT3ZlcnJpZGUsIGNvbnRleHRdKTtcbn1cblxuZnVuY3Rpb24gZGVidWdDcmVhdGVDb21wb25lbnRWaWV3KFxuICAgIHBhcmVudFZpZXc6IFZpZXdEYXRhLCBub2RlRGVmOiBOb2RlRGVmLCB2aWV3RGVmOiBWaWV3RGVmaW5pdGlvbiwgaG9zdEVsZW1lbnQ6IGFueSk6IFZpZXdEYXRhIHtcbiAgY29uc3Qgb3ZlcnJpZGVDb21wb25lbnRWaWV3ID1cbiAgICAgIHZpZXdEZWZPdmVycmlkZXMuZ2V0KG5vZGVEZWYuZWxlbWVudCAhLmNvbXBvbmVudFByb3ZpZGVyICEucHJvdmlkZXIgIS50b2tlbik7XG4gIGlmIChvdmVycmlkZUNvbXBvbmVudFZpZXcpIHtcbiAgICB2aWV3RGVmID0gb3ZlcnJpZGVDb21wb25lbnRWaWV3O1xuICB9IGVsc2Uge1xuICAgIHZpZXdEZWYgPSBhcHBseVByb3ZpZGVyT3ZlcnJpZGVzVG9WaWV3KHZpZXdEZWYpO1xuICB9XG4gIHJldHVybiBjYWxsV2l0aERlYnVnQ29udGV4dChcbiAgICAgIERlYnVnQWN0aW9uLmNyZWF0ZSwgY3JlYXRlQ29tcG9uZW50VmlldywgbnVsbCwgW3BhcmVudFZpZXcsIG5vZGVEZWYsIHZpZXdEZWYsIGhvc3RFbGVtZW50XSk7XG59XG5cbmZ1bmN0aW9uIGRlYnVnQ3JlYXRlTmdNb2R1bGVSZWYoXG4gICAgbW9kdWxlVHlwZTogVHlwZTxhbnk+LCBwYXJlbnRJbmplY3RvcjogSW5qZWN0b3IsIGJvb3RzdHJhcENvbXBvbmVudHM6IFR5cGU8YW55PltdLFxuICAgIGRlZjogTmdNb2R1bGVEZWZpbml0aW9uKTogTmdNb2R1bGVSZWY8YW55PiB7XG4gIGNvbnN0IGRlZldpdGhPdmVycmlkZSA9IGFwcGx5UHJvdmlkZXJPdmVycmlkZXNUb05nTW9kdWxlKGRlZik7XG4gIHJldHVybiBjcmVhdGVOZ01vZHVsZVJlZihtb2R1bGVUeXBlLCBwYXJlbnRJbmplY3RvciwgYm9vdHN0cmFwQ29tcG9uZW50cywgZGVmV2l0aE92ZXJyaWRlKTtcbn1cblxuY29uc3QgcHJvdmlkZXJPdmVycmlkZXMgPSBuZXcgTWFwPGFueSwgUHJvdmlkZXJPdmVycmlkZT4oKTtcbmNvbnN0IHByb3ZpZGVyT3ZlcnJpZGVzV2l0aFNjb3BlID0gbmV3IE1hcDxJbmplY3RhYmxlVHlwZTxhbnk+LCBQcm92aWRlck92ZXJyaWRlPigpO1xuY29uc3Qgdmlld0RlZk92ZXJyaWRlcyA9IG5ldyBNYXA8YW55LCBWaWV3RGVmaW5pdGlvbj4oKTtcblxuZnVuY3Rpb24gZGVidWdPdmVycmlkZVByb3ZpZGVyKG92ZXJyaWRlOiBQcm92aWRlck92ZXJyaWRlKSB7XG4gIHByb3ZpZGVyT3ZlcnJpZGVzLnNldChvdmVycmlkZS50b2tlbiwgb3ZlcnJpZGUpO1xuICBsZXQgaW5qZWN0YWJsZURlZjogSW5qZWN0YWJsZURlZjxhbnk+fG51bGw7XG4gIGlmICh0eXBlb2Ygb3ZlcnJpZGUudG9rZW4gPT09ICdmdW5jdGlvbicgJiYgKGluamVjdGFibGVEZWYgPSBnZXRJbmplY3RhYmxlRGVmKG92ZXJyaWRlLnRva2VuKSkgJiZcbiAgICAgIHR5cGVvZiBpbmplY3RhYmxlRGVmLnByb3ZpZGVkSW4gPT09ICdmdW5jdGlvbicpIHtcbiAgICBwcm92aWRlck92ZXJyaWRlc1dpdGhTY29wZS5zZXQob3ZlcnJpZGUudG9rZW4gYXMgSW5qZWN0YWJsZVR5cGU8YW55Piwgb3ZlcnJpZGUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGRlYnVnT3ZlcnJpZGVDb21wb25lbnRWaWV3KGNvbXA6IGFueSwgY29tcEZhY3Rvcnk6IENvbXBvbmVudEZhY3Rvcnk8YW55Pikge1xuICBjb25zdCBob3N0Vmlld0RlZiA9IHJlc29sdmVEZWZpbml0aW9uKGdldENvbXBvbmVudFZpZXdEZWZpbml0aW9uRmFjdG9yeShjb21wRmFjdG9yeSkpO1xuICBjb25zdCBjb21wVmlld0RlZiA9IHJlc29sdmVEZWZpbml0aW9uKGhvc3RWaWV3RGVmLm5vZGVzWzBdLmVsZW1lbnQgIS5jb21wb25lbnRWaWV3ICEpO1xuICB2aWV3RGVmT3ZlcnJpZGVzLnNldChjb21wLCBjb21wVmlld0RlZik7XG59XG5cbmZ1bmN0aW9uIGRlYnVnQ2xlYXJPdmVycmlkZXMoKSB7XG4gIHByb3ZpZGVyT3ZlcnJpZGVzLmNsZWFyKCk7XG4gIHByb3ZpZGVyT3ZlcnJpZGVzV2l0aFNjb3BlLmNsZWFyKCk7XG4gIHZpZXdEZWZPdmVycmlkZXMuY2xlYXIoKTtcbn1cblxuLy8gTm90ZXMgYWJvdXQgdGhlIGFsZ29yaXRobTpcbi8vIDEpIExvY2F0ZSB0aGUgcHJvdmlkZXJzIG9mIGFuIGVsZW1lbnQgYW5kIGNoZWNrIGlmIG9uZSBvZiB0aGVtIHdhcyBvdmVyd3JpdHRlblxuLy8gMikgQ2hhbmdlIHRoZSBwcm92aWRlcnMgb2YgdGhhdCBlbGVtZW50XG4vL1xuLy8gV2Ugb25seSBjcmVhdGUgbmV3IGRhdGFzdHJ1Y3R1cmVzIGlmIHdlIG5lZWQgdG8sIHRvIGtlZXAgcGVyZiBpbXBhY3Rcbi8vIHJlYXNvbmFibGUuXG5mdW5jdGlvbiBhcHBseVByb3ZpZGVyT3ZlcnJpZGVzVG9WaWV3KGRlZjogVmlld0RlZmluaXRpb24pOiBWaWV3RGVmaW5pdGlvbiB7XG4gIGlmIChwcm92aWRlck92ZXJyaWRlcy5zaXplID09PSAwKSB7XG4gICAgcmV0dXJuIGRlZjtcbiAgfVxuICBjb25zdCBlbGVtZW50SW5kaWNlc1dpdGhPdmVyd3JpdHRlblByb3ZpZGVycyA9IGZpbmRFbGVtZW50SW5kaWNlc1dpdGhPdmVyd3JpdHRlblByb3ZpZGVycyhkZWYpO1xuICBpZiAoZWxlbWVudEluZGljZXNXaXRoT3ZlcndyaXR0ZW5Qcm92aWRlcnMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIGRlZjtcbiAgfVxuICAvLyBjbG9uZSB0aGUgd2hvbGUgdmlldyBkZWZpbml0aW9uLFxuICAvLyBhcyBpdCBtYWludGFpbnMgcmVmZXJlbmNlcyBiZXR3ZWVuIHRoZSBub2RlcyB0aGF0IGFyZSBoYXJkIHRvIHVwZGF0ZS5cbiAgZGVmID0gZGVmLmZhY3RvcnkgISgoKSA9PiBOT09QKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBlbGVtZW50SW5kaWNlc1dpdGhPdmVyd3JpdHRlblByb3ZpZGVycy5sZW5ndGg7IGkrKykge1xuICAgIGFwcGx5UHJvdmlkZXJPdmVycmlkZXNUb0VsZW1lbnQoZGVmLCBlbGVtZW50SW5kaWNlc1dpdGhPdmVyd3JpdHRlblByb3ZpZGVyc1tpXSk7XG4gIH1cbiAgcmV0dXJuIGRlZjtcblxuICBmdW5jdGlvbiBmaW5kRWxlbWVudEluZGljZXNXaXRoT3ZlcndyaXR0ZW5Qcm92aWRlcnMoZGVmOiBWaWV3RGVmaW5pdGlvbik6IG51bWJlcltdIHtcbiAgICBjb25zdCBlbEluZGljZXNXaXRoT3ZlcndyaXR0ZW5Qcm92aWRlcnM6IG51bWJlcltdID0gW107XG4gICAgbGV0IGxhc3RFbGVtZW50RGVmOiBOb2RlRGVmfG51bGwgPSBudWxsO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGVmLm5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBub2RlRGVmID0gZGVmLm5vZGVzW2ldO1xuICAgICAgaWYgKG5vZGVEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuVHlwZUVsZW1lbnQpIHtcbiAgICAgICAgbGFzdEVsZW1lbnREZWYgPSBub2RlRGVmO1xuICAgICAgfVxuICAgICAgaWYgKGxhc3RFbGVtZW50RGVmICYmIG5vZGVEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuQ2F0UHJvdmlkZXJOb0RpcmVjdGl2ZSAmJlxuICAgICAgICAgIHByb3ZpZGVyT3ZlcnJpZGVzLmhhcyhub2RlRGVmLnByb3ZpZGVyICEudG9rZW4pKSB7XG4gICAgICAgIGVsSW5kaWNlc1dpdGhPdmVyd3JpdHRlblByb3ZpZGVycy5wdXNoKGxhc3RFbGVtZW50RGVmICEubm9kZUluZGV4KTtcbiAgICAgICAgbGFzdEVsZW1lbnREZWYgPSBudWxsO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZWxJbmRpY2VzV2l0aE92ZXJ3cml0dGVuUHJvdmlkZXJzO1xuICB9XG5cbiAgZnVuY3Rpb24gYXBwbHlQcm92aWRlck92ZXJyaWRlc1RvRWxlbWVudCh2aWV3RGVmOiBWaWV3RGVmaW5pdGlvbiwgZWxJbmRleDogbnVtYmVyKSB7XG4gICAgZm9yIChsZXQgaSA9IGVsSW5kZXggKyAxOyBpIDwgdmlld0RlZi5ub2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3Qgbm9kZURlZiA9IHZpZXdEZWYubm9kZXNbaV07XG4gICAgICBpZiAobm9kZURlZi5mbGFncyAmIE5vZGVGbGFncy5UeXBlRWxlbWVudCkge1xuICAgICAgICAvLyBzdG9wIGF0IHRoZSBuZXh0IGVsZW1lbnRcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKG5vZGVEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuQ2F0UHJvdmlkZXJOb0RpcmVjdGl2ZSkge1xuICAgICAgICBjb25zdCBwcm92aWRlciA9IG5vZGVEZWYucHJvdmlkZXIgITtcbiAgICAgICAgY29uc3Qgb3ZlcnJpZGUgPSBwcm92aWRlck92ZXJyaWRlcy5nZXQocHJvdmlkZXIudG9rZW4pO1xuICAgICAgICBpZiAob3ZlcnJpZGUpIHtcbiAgICAgICAgICBub2RlRGVmLmZsYWdzID0gKG5vZGVEZWYuZmxhZ3MgJiB+Tm9kZUZsYWdzLkNhdFByb3ZpZGVyTm9EaXJlY3RpdmUpIHwgb3ZlcnJpZGUuZmxhZ3M7XG4gICAgICAgICAgcHJvdmlkZXIuZGVwcyA9IHNwbGl0RGVwc0RzbChvdmVycmlkZS5kZXBzKTtcbiAgICAgICAgICBwcm92aWRlci52YWx1ZSA9IG92ZXJyaWRlLnZhbHVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8vIE5vdGVzIGFib3V0IHRoZSBhbGdvcml0aG06XG4vLyBXZSBvbmx5IGNyZWF0ZSBuZXcgZGF0YXN0cnVjdHVyZXMgaWYgd2UgbmVlZCB0bywgdG8ga2VlcCBwZXJmIGltcGFjdFxuLy8gcmVhc29uYWJsZS5cbmZ1bmN0aW9uIGFwcGx5UHJvdmlkZXJPdmVycmlkZXNUb05nTW9kdWxlKGRlZjogTmdNb2R1bGVEZWZpbml0aW9uKTogTmdNb2R1bGVEZWZpbml0aW9uIHtcbiAgY29uc3Qge2hhc092ZXJyaWRlcywgaGFzRGVwcmVjYXRlZE92ZXJyaWRlc30gPSBjYWxjSGFzT3ZlcnJpZGVzKGRlZik7XG4gIGlmICghaGFzT3ZlcnJpZGVzKSB7XG4gICAgcmV0dXJuIGRlZjtcbiAgfVxuICAvLyBjbG9uZSB0aGUgd2hvbGUgdmlldyBkZWZpbml0aW9uLFxuICAvLyBhcyBpdCBtYWludGFpbnMgcmVmZXJlbmNlcyBiZXR3ZWVuIHRoZSBub2RlcyB0aGF0IGFyZSBoYXJkIHRvIHVwZGF0ZS5cbiAgZGVmID0gZGVmLmZhY3RvcnkgISgoKSA9PiBOT09QKTtcbiAgYXBwbHlQcm92aWRlck92ZXJyaWRlcyhkZWYpO1xuICByZXR1cm4gZGVmO1xuXG4gIGZ1bmN0aW9uIGNhbGNIYXNPdmVycmlkZXMoZGVmOiBOZ01vZHVsZURlZmluaXRpb24pOlxuICAgICAge2hhc092ZXJyaWRlczogYm9vbGVhbiwgaGFzRGVwcmVjYXRlZE92ZXJyaWRlczogYm9vbGVhbn0ge1xuICAgIGxldCBoYXNPdmVycmlkZXMgPSBmYWxzZTtcbiAgICBsZXQgaGFzRGVwcmVjYXRlZE92ZXJyaWRlcyA9IGZhbHNlO1xuICAgIGlmIChwcm92aWRlck92ZXJyaWRlcy5zaXplID09PSAwKSB7XG4gICAgICByZXR1cm4ge2hhc092ZXJyaWRlcywgaGFzRGVwcmVjYXRlZE92ZXJyaWRlc307XG4gICAgfVxuICAgIGRlZi5wcm92aWRlcnMuZm9yRWFjaChub2RlID0+IHtcbiAgICAgIGNvbnN0IG92ZXJyaWRlID0gcHJvdmlkZXJPdmVycmlkZXMuZ2V0KG5vZGUudG9rZW4pO1xuICAgICAgaWYgKChub2RlLmZsYWdzICYgTm9kZUZsYWdzLkNhdFByb3ZpZGVyTm9EaXJlY3RpdmUpICYmIG92ZXJyaWRlKSB7XG4gICAgICAgIGhhc092ZXJyaWRlcyA9IHRydWU7XG4gICAgICAgIGhhc0RlcHJlY2F0ZWRPdmVycmlkZXMgPSBoYXNEZXByZWNhdGVkT3ZlcnJpZGVzIHx8IG92ZXJyaWRlLmRlcHJlY2F0ZWRCZWhhdmlvcjtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBkZWYubW9kdWxlcy5mb3JFYWNoKG1vZHVsZSA9PiB7XG4gICAgICBwcm92aWRlck92ZXJyaWRlc1dpdGhTY29wZS5mb3JFYWNoKChvdmVycmlkZSwgdG9rZW4pID0+IHtcbiAgICAgICAgaWYgKGdldEluamVjdGFibGVEZWYodG9rZW4pICEucHJvdmlkZWRJbiA9PT0gbW9kdWxlKSB7XG4gICAgICAgICAgaGFzT3ZlcnJpZGVzID0gdHJ1ZTtcbiAgICAgICAgICBoYXNEZXByZWNhdGVkT3ZlcnJpZGVzID0gaGFzRGVwcmVjYXRlZE92ZXJyaWRlcyB8fCBvdmVycmlkZS5kZXByZWNhdGVkQmVoYXZpb3I7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIHJldHVybiB7aGFzT3ZlcnJpZGVzLCBoYXNEZXByZWNhdGVkT3ZlcnJpZGVzfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFwcGx5UHJvdmlkZXJPdmVycmlkZXMoZGVmOiBOZ01vZHVsZURlZmluaXRpb24pIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRlZi5wcm92aWRlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHByb3ZpZGVyID0gZGVmLnByb3ZpZGVyc1tpXTtcbiAgICAgIGlmIChoYXNEZXByZWNhdGVkT3ZlcnJpZGVzKSB7XG4gICAgICAgIC8vIFdlIGhhZCBhIGJ1ZyB3aGVyZSBtZSBtYWRlXG4gICAgICAgIC8vIGFsbCBwcm92aWRlcnMgbGF6eS4gS2VlcCB0aGlzIGxvZ2ljIGJlaGluZCBhIGZsYWdcbiAgICAgICAgLy8gZm9yIG1pZ3JhdGluZyBleGlzdGluZyB1c2Vycy5cbiAgICAgICAgcHJvdmlkZXIuZmxhZ3MgfD0gTm9kZUZsYWdzLkxhenlQcm92aWRlcjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IG92ZXJyaWRlID0gcHJvdmlkZXJPdmVycmlkZXMuZ2V0KHByb3ZpZGVyLnRva2VuKTtcbiAgICAgIGlmIChvdmVycmlkZSkge1xuICAgICAgICBwcm92aWRlci5mbGFncyA9IChwcm92aWRlci5mbGFncyAmIH5Ob2RlRmxhZ3MuQ2F0UHJvdmlkZXJOb0RpcmVjdGl2ZSkgfCBvdmVycmlkZS5mbGFncztcbiAgICAgICAgcHJvdmlkZXIuZGVwcyA9IHNwbGl0RGVwc0RzbChvdmVycmlkZS5kZXBzKTtcbiAgICAgICAgcHJvdmlkZXIudmFsdWUgPSBvdmVycmlkZS52YWx1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHByb3ZpZGVyT3ZlcnJpZGVzV2l0aFNjb3BlLnNpemUgPiAwKSB7XG4gICAgICBsZXQgbW9kdWxlU2V0ID0gbmV3IFNldDxhbnk+KGRlZi5tb2R1bGVzKTtcbiAgICAgIHByb3ZpZGVyT3ZlcnJpZGVzV2l0aFNjb3BlLmZvckVhY2goKG92ZXJyaWRlLCB0b2tlbikgPT4ge1xuICAgICAgICBpZiAobW9kdWxlU2V0LmhhcyhnZXRJbmplY3RhYmxlRGVmKHRva2VuKSAhLnByb3ZpZGVkSW4pKSB7XG4gICAgICAgICAgbGV0IHByb3ZpZGVyID0ge1xuICAgICAgICAgICAgdG9rZW46IHRva2VuLFxuICAgICAgICAgICAgZmxhZ3M6XG4gICAgICAgICAgICAgICAgb3ZlcnJpZGUuZmxhZ3MgfCAoaGFzRGVwcmVjYXRlZE92ZXJyaWRlcyA/IE5vZGVGbGFncy5MYXp5UHJvdmlkZXIgOiBOb2RlRmxhZ3MuTm9uZSksXG4gICAgICAgICAgICBkZXBzOiBzcGxpdERlcHNEc2wob3ZlcnJpZGUuZGVwcyksXG4gICAgICAgICAgICB2YWx1ZTogb3ZlcnJpZGUudmFsdWUsXG4gICAgICAgICAgICBpbmRleDogZGVmLnByb3ZpZGVycy5sZW5ndGgsXG4gICAgICAgICAgfTtcbiAgICAgICAgICBkZWYucHJvdmlkZXJzLnB1c2gocHJvdmlkZXIpO1xuICAgICAgICAgIGRlZi5wcm92aWRlcnNCeUtleVt0b2tlbktleSh0b2tlbildID0gcHJvdmlkZXI7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBwcm9kQ2hlY2tBbmRVcGRhdGVOb2RlKFxuICAgIHZpZXc6IFZpZXdEYXRhLCBjaGVja0luZGV4OiBudW1iZXIsIGFyZ1N0eWxlOiBBcmd1bWVudFR5cGUsIHYwPzogYW55LCB2MT86IGFueSwgdjI/OiBhbnksXG4gICAgdjM/OiBhbnksIHY0PzogYW55LCB2NT86IGFueSwgdjY/OiBhbnksIHY3PzogYW55LCB2OD86IGFueSwgdjk/OiBhbnkpOiBhbnkge1xuICBjb25zdCBub2RlRGVmID0gdmlldy5kZWYubm9kZXNbY2hlY2tJbmRleF07XG4gIGNoZWNrQW5kVXBkYXRlTm9kZSh2aWV3LCBub2RlRGVmLCBhcmdTdHlsZSwgdjAsIHYxLCB2MiwgdjMsIHY0LCB2NSwgdjYsIHY3LCB2OCwgdjkpO1xuICByZXR1cm4gKG5vZGVEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuQ2F0UHVyZUV4cHJlc3Npb24pID9cbiAgICAgIGFzUHVyZUV4cHJlc3Npb25EYXRhKHZpZXcsIGNoZWNrSW5kZXgpLnZhbHVlIDpcbiAgICAgIHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gcHJvZENoZWNrTm9DaGFuZ2VzTm9kZShcbiAgICB2aWV3OiBWaWV3RGF0YSwgY2hlY2tJbmRleDogbnVtYmVyLCBhcmdTdHlsZTogQXJndW1lbnRUeXBlLCB2MD86IGFueSwgdjE/OiBhbnksIHYyPzogYW55LFxuICAgIHYzPzogYW55LCB2ND86IGFueSwgdjU/OiBhbnksIHY2PzogYW55LCB2Nz86IGFueSwgdjg/OiBhbnksIHY5PzogYW55KTogYW55IHtcbiAgY29uc3Qgbm9kZURlZiA9IHZpZXcuZGVmLm5vZGVzW2NoZWNrSW5kZXhdO1xuICBjaGVja05vQ2hhbmdlc05vZGUodmlldywgbm9kZURlZiwgYXJnU3R5bGUsIHYwLCB2MSwgdjIsIHYzLCB2NCwgdjUsIHY2LCB2NywgdjgsIHY5KTtcbiAgcmV0dXJuIChub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLkNhdFB1cmVFeHByZXNzaW9uKSA/XG4gICAgICBhc1B1cmVFeHByZXNzaW9uRGF0YSh2aWV3LCBjaGVja0luZGV4KS52YWx1ZSA6XG4gICAgICB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIGRlYnVnQ2hlY2tBbmRVcGRhdGVWaWV3KHZpZXc6IFZpZXdEYXRhKSB7XG4gIHJldHVybiBjYWxsV2l0aERlYnVnQ29udGV4dChEZWJ1Z0FjdGlvbi5kZXRlY3RDaGFuZ2VzLCBjaGVja0FuZFVwZGF0ZVZpZXcsIG51bGwsIFt2aWV3XSk7XG59XG5cbmZ1bmN0aW9uIGRlYnVnQ2hlY2tOb0NoYW5nZXNWaWV3KHZpZXc6IFZpZXdEYXRhKSB7XG4gIHJldHVybiBjYWxsV2l0aERlYnVnQ29udGV4dChEZWJ1Z0FjdGlvbi5jaGVja05vQ2hhbmdlcywgY2hlY2tOb0NoYW5nZXNWaWV3LCBudWxsLCBbdmlld10pO1xufVxuXG5mdW5jdGlvbiBkZWJ1Z0Rlc3Ryb3lWaWV3KHZpZXc6IFZpZXdEYXRhKSB7XG4gIHJldHVybiBjYWxsV2l0aERlYnVnQ29udGV4dChEZWJ1Z0FjdGlvbi5kZXN0cm95LCBkZXN0cm95VmlldywgbnVsbCwgW3ZpZXddKTtcbn1cblxuZW51bSBEZWJ1Z0FjdGlvbiB7XG4gIGNyZWF0ZSxcbiAgZGV0ZWN0Q2hhbmdlcyxcbiAgY2hlY2tOb0NoYW5nZXMsXG4gIGRlc3Ryb3ksXG4gIGhhbmRsZUV2ZW50XG59XG5cbmxldCBfY3VycmVudEFjdGlvbjogRGVidWdBY3Rpb247XG5sZXQgX2N1cnJlbnRWaWV3OiBWaWV3RGF0YTtcbmxldCBfY3VycmVudE5vZGVJbmRleDogbnVtYmVyfG51bGw7XG5cbmZ1bmN0aW9uIGRlYnVnU2V0Q3VycmVudE5vZGUodmlldzogVmlld0RhdGEsIG5vZGVJbmRleDogbnVtYmVyIHwgbnVsbCkge1xuICBfY3VycmVudFZpZXcgPSB2aWV3O1xuICBfY3VycmVudE5vZGVJbmRleCA9IG5vZGVJbmRleDtcbn1cblxuZnVuY3Rpb24gZGVidWdIYW5kbGVFdmVudCh2aWV3OiBWaWV3RGF0YSwgbm9kZUluZGV4OiBudW1iZXIsIGV2ZW50TmFtZTogc3RyaW5nLCBldmVudDogYW55KSB7XG4gIGRlYnVnU2V0Q3VycmVudE5vZGUodmlldywgbm9kZUluZGV4KTtcbiAgcmV0dXJuIGNhbGxXaXRoRGVidWdDb250ZXh0KFxuICAgICAgRGVidWdBY3Rpb24uaGFuZGxlRXZlbnQsIHZpZXcuZGVmLmhhbmRsZUV2ZW50LCBudWxsLCBbdmlldywgbm9kZUluZGV4LCBldmVudE5hbWUsIGV2ZW50XSk7XG59XG5cbmZ1bmN0aW9uIGRlYnVnVXBkYXRlRGlyZWN0aXZlcyh2aWV3OiBWaWV3RGF0YSwgY2hlY2tUeXBlOiBDaGVja1R5cGUpIHtcbiAgaWYgKHZpZXcuc3RhdGUgJiBWaWV3U3RhdGUuRGVzdHJveWVkKSB7XG4gICAgdGhyb3cgdmlld0Rlc3Ryb3llZEVycm9yKERlYnVnQWN0aW9uW19jdXJyZW50QWN0aW9uXSk7XG4gIH1cbiAgZGVidWdTZXRDdXJyZW50Tm9kZSh2aWV3LCBuZXh0RGlyZWN0aXZlV2l0aEJpbmRpbmcodmlldywgMCkpO1xuICByZXR1cm4gdmlldy5kZWYudXBkYXRlRGlyZWN0aXZlcyhkZWJ1Z0NoZWNrRGlyZWN0aXZlc0ZuLCB2aWV3KTtcblxuICBmdW5jdGlvbiBkZWJ1Z0NoZWNrRGlyZWN0aXZlc0ZuKFxuICAgICAgdmlldzogVmlld0RhdGEsIG5vZGVJbmRleDogbnVtYmVyLCBhcmdTdHlsZTogQXJndW1lbnRUeXBlLCAuLi52YWx1ZXM6IGFueVtdKSB7XG4gICAgY29uc3Qgbm9kZURlZiA9IHZpZXcuZGVmLm5vZGVzW25vZGVJbmRleF07XG4gICAgaWYgKGNoZWNrVHlwZSA9PT0gQ2hlY2tUeXBlLkNoZWNrQW5kVXBkYXRlKSB7XG4gICAgICBkZWJ1Z0NoZWNrQW5kVXBkYXRlTm9kZSh2aWV3LCBub2RlRGVmLCBhcmdTdHlsZSwgdmFsdWVzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVidWdDaGVja05vQ2hhbmdlc05vZGUodmlldywgbm9kZURlZiwgYXJnU3R5bGUsIHZhbHVlcyk7XG4gICAgfVxuICAgIGlmIChub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLlR5cGVEaXJlY3RpdmUpIHtcbiAgICAgIGRlYnVnU2V0Q3VycmVudE5vZGUodmlldywgbmV4dERpcmVjdGl2ZVdpdGhCaW5kaW5nKHZpZXcsIG5vZGVJbmRleCkpO1xuICAgIH1cbiAgICByZXR1cm4gKG5vZGVEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuQ2F0UHVyZUV4cHJlc3Npb24pID9cbiAgICAgICAgYXNQdXJlRXhwcmVzc2lvbkRhdGEodmlldywgbm9kZURlZi5ub2RlSW5kZXgpLnZhbHVlIDpcbiAgICAgICAgdW5kZWZpbmVkO1xuICB9XG59XG5cbmZ1bmN0aW9uIGRlYnVnVXBkYXRlUmVuZGVyZXIodmlldzogVmlld0RhdGEsIGNoZWNrVHlwZTogQ2hlY2tUeXBlKSB7XG4gIGlmICh2aWV3LnN0YXRlICYgVmlld1N0YXRlLkRlc3Ryb3llZCkge1xuICAgIHRocm93IHZpZXdEZXN0cm95ZWRFcnJvcihEZWJ1Z0FjdGlvbltfY3VycmVudEFjdGlvbl0pO1xuICB9XG4gIGRlYnVnU2V0Q3VycmVudE5vZGUodmlldywgbmV4dFJlbmRlck5vZGVXaXRoQmluZGluZyh2aWV3LCAwKSk7XG4gIHJldHVybiB2aWV3LmRlZi51cGRhdGVSZW5kZXJlcihkZWJ1Z0NoZWNrUmVuZGVyTm9kZUZuLCB2aWV3KTtcblxuICBmdW5jdGlvbiBkZWJ1Z0NoZWNrUmVuZGVyTm9kZUZuKFxuICAgICAgdmlldzogVmlld0RhdGEsIG5vZGVJbmRleDogbnVtYmVyLCBhcmdTdHlsZTogQXJndW1lbnRUeXBlLCAuLi52YWx1ZXM6IGFueVtdKSB7XG4gICAgY29uc3Qgbm9kZURlZiA9IHZpZXcuZGVmLm5vZGVzW25vZGVJbmRleF07XG4gICAgaWYgKGNoZWNrVHlwZSA9PT0gQ2hlY2tUeXBlLkNoZWNrQW5kVXBkYXRlKSB7XG4gICAgICBkZWJ1Z0NoZWNrQW5kVXBkYXRlTm9kZSh2aWV3LCBub2RlRGVmLCBhcmdTdHlsZSwgdmFsdWVzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVidWdDaGVja05vQ2hhbmdlc05vZGUodmlldywgbm9kZURlZiwgYXJnU3R5bGUsIHZhbHVlcyk7XG4gICAgfVxuICAgIGlmIChub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLkNhdFJlbmRlck5vZGUpIHtcbiAgICAgIGRlYnVnU2V0Q3VycmVudE5vZGUodmlldywgbmV4dFJlbmRlck5vZGVXaXRoQmluZGluZyh2aWV3LCBub2RlSW5kZXgpKTtcbiAgICB9XG4gICAgcmV0dXJuIChub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLkNhdFB1cmVFeHByZXNzaW9uKSA/XG4gICAgICAgIGFzUHVyZUV4cHJlc3Npb25EYXRhKHZpZXcsIG5vZGVEZWYubm9kZUluZGV4KS52YWx1ZSA6XG4gICAgICAgIHVuZGVmaW5lZDtcbiAgfVxufVxuXG5mdW5jdGlvbiBkZWJ1Z0NoZWNrQW5kVXBkYXRlTm9kZShcbiAgICB2aWV3OiBWaWV3RGF0YSwgbm9kZURlZjogTm9kZURlZiwgYXJnU3R5bGU6IEFyZ3VtZW50VHlwZSwgZ2l2ZW5WYWx1ZXM6IGFueVtdKTogdm9pZCB7XG4gIGNvbnN0IGNoYW5nZWQgPSAoPGFueT5jaGVja0FuZFVwZGF0ZU5vZGUpKHZpZXcsIG5vZGVEZWYsIGFyZ1N0eWxlLCAuLi5naXZlblZhbHVlcyk7XG4gIGlmIChjaGFuZ2VkKSB7XG4gICAgY29uc3QgdmFsdWVzID0gYXJnU3R5bGUgPT09IEFyZ3VtZW50VHlwZS5EeW5hbWljID8gZ2l2ZW5WYWx1ZXNbMF0gOiBnaXZlblZhbHVlcztcbiAgICBpZiAobm9kZURlZi5mbGFncyAmIE5vZGVGbGFncy5UeXBlRGlyZWN0aXZlKSB7XG4gICAgICBjb25zdCBiaW5kaW5nVmFsdWVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfSA9IHt9O1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBub2RlRGVmLmJpbmRpbmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGJpbmRpbmcgPSBub2RlRGVmLmJpbmRpbmdzW2ldO1xuICAgICAgICBjb25zdCB2YWx1ZSA9IHZhbHVlc1tpXTtcbiAgICAgICAgaWYgKGJpbmRpbmcuZmxhZ3MgJiBCaW5kaW5nRmxhZ3MuVHlwZVByb3BlcnR5KSB7XG4gICAgICAgICAgYmluZGluZ1ZhbHVlc1tub3JtYWxpemVEZWJ1Z0JpbmRpbmdOYW1lKGJpbmRpbmcubm9uTWluaWZpZWROYW1lICEpXSA9XG4gICAgICAgICAgICAgIG5vcm1hbGl6ZURlYnVnQmluZGluZ1ZhbHVlKHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY29uc3QgZWxEZWYgPSBub2RlRGVmLnBhcmVudCAhO1xuICAgICAgY29uc3QgZWwgPSBhc0VsZW1lbnREYXRhKHZpZXcsIGVsRGVmLm5vZGVJbmRleCkucmVuZGVyRWxlbWVudDtcbiAgICAgIGlmICghZWxEZWYuZWxlbWVudCAhLm5hbWUpIHtcbiAgICAgICAgLy8gYSBjb21tZW50LlxuICAgICAgICB2aWV3LnJlbmRlcmVyLnNldFZhbHVlKGVsLCBgYmluZGluZ3M9JHtKU09OLnN0cmluZ2lmeShiaW5kaW5nVmFsdWVzLCBudWxsLCAyKX1gKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGEgcmVndWxhciBlbGVtZW50LlxuICAgICAgICBmb3IgKGxldCBhdHRyIGluIGJpbmRpbmdWYWx1ZXMpIHtcbiAgICAgICAgICBjb25zdCB2YWx1ZSA9IGJpbmRpbmdWYWx1ZXNbYXR0cl07XG4gICAgICAgICAgaWYgKHZhbHVlICE9IG51bGwpIHtcbiAgICAgICAgICAgIHZpZXcucmVuZGVyZXIuc2V0QXR0cmlidXRlKGVsLCBhdHRyLCB2YWx1ZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZpZXcucmVuZGVyZXIucmVtb3ZlQXR0cmlidXRlKGVsLCBhdHRyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gZGVidWdDaGVja05vQ2hhbmdlc05vZGUoXG4gICAgdmlldzogVmlld0RhdGEsIG5vZGVEZWY6IE5vZGVEZWYsIGFyZ1N0eWxlOiBBcmd1bWVudFR5cGUsIHZhbHVlczogYW55W10pOiB2b2lkIHtcbiAgKDxhbnk+Y2hlY2tOb0NoYW5nZXNOb2RlKSh2aWV3LCBub2RlRGVmLCBhcmdTdHlsZSwgLi4udmFsdWVzKTtcbn1cblxuZnVuY3Rpb24gbmV4dERpcmVjdGl2ZVdpdGhCaW5kaW5nKHZpZXc6IFZpZXdEYXRhLCBub2RlSW5kZXg6IG51bWJlcik6IG51bWJlcnxudWxsIHtcbiAgZm9yIChsZXQgaSA9IG5vZGVJbmRleDsgaSA8IHZpZXcuZGVmLm5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qgbm9kZURlZiA9IHZpZXcuZGVmLm5vZGVzW2ldO1xuICAgIGlmIChub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLlR5cGVEaXJlY3RpdmUgJiYgbm9kZURlZi5iaW5kaW5ncyAmJiBub2RlRGVmLmJpbmRpbmdzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIGk7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBuZXh0UmVuZGVyTm9kZVdpdGhCaW5kaW5nKHZpZXc6IFZpZXdEYXRhLCBub2RlSW5kZXg6IG51bWJlcik6IG51bWJlcnxudWxsIHtcbiAgZm9yIChsZXQgaSA9IG5vZGVJbmRleDsgaSA8IHZpZXcuZGVmLm5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qgbm9kZURlZiA9IHZpZXcuZGVmLm5vZGVzW2ldO1xuICAgIGlmICgobm9kZURlZi5mbGFncyAmIE5vZGVGbGFncy5DYXRSZW5kZXJOb2RlKSAmJiBub2RlRGVmLmJpbmRpbmdzICYmIG5vZGVEZWYuYmluZGluZ3MubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gaTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmNsYXNzIERlYnVnQ29udGV4dF8gaW1wbGVtZW50cyBEZWJ1Z0NvbnRleHQge1xuICBwcml2YXRlIG5vZGVEZWY6IE5vZGVEZWY7XG4gIHByaXZhdGUgZWxWaWV3OiBWaWV3RGF0YTtcbiAgcHJpdmF0ZSBlbERlZjogTm9kZURlZjtcblxuICBjb25zdHJ1Y3RvcihwdWJsaWMgdmlldzogVmlld0RhdGEsIHB1YmxpYyBub2RlSW5kZXg6IG51bWJlcnxudWxsKSB7XG4gICAgaWYgKG5vZGVJbmRleCA9PSBudWxsKSB7XG4gICAgICB0aGlzLm5vZGVJbmRleCA9IG5vZGVJbmRleCA9IDA7XG4gICAgfVxuICAgIHRoaXMubm9kZURlZiA9IHZpZXcuZGVmLm5vZGVzW25vZGVJbmRleF07XG4gICAgbGV0IGVsRGVmID0gdGhpcy5ub2RlRGVmO1xuICAgIGxldCBlbFZpZXcgPSB2aWV3O1xuICAgIHdoaWxlIChlbERlZiAmJiAoZWxEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuVHlwZUVsZW1lbnQpID09PSAwKSB7XG4gICAgICBlbERlZiA9IGVsRGVmLnBhcmVudCAhO1xuICAgIH1cbiAgICBpZiAoIWVsRGVmKSB7XG4gICAgICB3aGlsZSAoIWVsRGVmICYmIGVsVmlldykge1xuICAgICAgICBlbERlZiA9IHZpZXdQYXJlbnRFbChlbFZpZXcpICE7XG4gICAgICAgIGVsVmlldyA9IGVsVmlldy5wYXJlbnQgITtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5lbERlZiA9IGVsRGVmO1xuICAgIHRoaXMuZWxWaWV3ID0gZWxWaWV3O1xuICB9XG5cbiAgcHJpdmF0ZSBnZXQgZWxPckNvbXBWaWV3KCkge1xuICAgIC8vIEhhcyB0byBiZSBkb25lIGxhemlseSBhcyB3ZSB1c2UgdGhlIERlYnVnQ29udGV4dCBhbHNvIGR1cmluZyBjcmVhdGlvbiBvZiBlbGVtZW50cy4uLlxuICAgIHJldHVybiBhc0VsZW1lbnREYXRhKHRoaXMuZWxWaWV3LCB0aGlzLmVsRGVmLm5vZGVJbmRleCkuY29tcG9uZW50VmlldyB8fCB0aGlzLnZpZXc7XG4gIH1cblxuICBnZXQgaW5qZWN0b3IoKTogSW5qZWN0b3IgeyByZXR1cm4gY3JlYXRlSW5qZWN0b3IodGhpcy5lbFZpZXcsIHRoaXMuZWxEZWYpOyB9XG5cbiAgZ2V0IGNvbXBvbmVudCgpOiBhbnkgeyByZXR1cm4gdGhpcy5lbE9yQ29tcFZpZXcuY29tcG9uZW50OyB9XG5cbiAgZ2V0IGNvbnRleHQoKTogYW55IHsgcmV0dXJuIHRoaXMuZWxPckNvbXBWaWV3LmNvbnRleHQ7IH1cblxuICBnZXQgcHJvdmlkZXJUb2tlbnMoKTogYW55W10ge1xuICAgIGNvbnN0IHRva2VuczogYW55W10gPSBbXTtcbiAgICBpZiAodGhpcy5lbERlZikge1xuICAgICAgZm9yIChsZXQgaSA9IHRoaXMuZWxEZWYubm9kZUluZGV4ICsgMTsgaSA8PSB0aGlzLmVsRGVmLm5vZGVJbmRleCArIHRoaXMuZWxEZWYuY2hpbGRDb3VudDtcbiAgICAgICAgICAgaSsrKSB7XG4gICAgICAgIGNvbnN0IGNoaWxkRGVmID0gdGhpcy5lbFZpZXcuZGVmLm5vZGVzW2ldO1xuICAgICAgICBpZiAoY2hpbGREZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuQ2F0UHJvdmlkZXIpIHtcbiAgICAgICAgICB0b2tlbnMucHVzaChjaGlsZERlZi5wcm92aWRlciAhLnRva2VuKTtcbiAgICAgICAgfVxuICAgICAgICBpICs9IGNoaWxkRGVmLmNoaWxkQ291bnQ7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0b2tlbnM7XG4gIH1cblxuICBnZXQgcmVmZXJlbmNlcygpOiB7W2tleTogc3RyaW5nXTogYW55fSB7XG4gICAgY29uc3QgcmVmZXJlbmNlczoge1trZXk6IHN0cmluZ106IGFueX0gPSB7fTtcbiAgICBpZiAodGhpcy5lbERlZikge1xuICAgICAgY29sbGVjdFJlZmVyZW5jZXModGhpcy5lbFZpZXcsIHRoaXMuZWxEZWYsIHJlZmVyZW5jZXMpO1xuXG4gICAgICBmb3IgKGxldCBpID0gdGhpcy5lbERlZi5ub2RlSW5kZXggKyAxOyBpIDw9IHRoaXMuZWxEZWYubm9kZUluZGV4ICsgdGhpcy5lbERlZi5jaGlsZENvdW50O1xuICAgICAgICAgICBpKyspIHtcbiAgICAgICAgY29uc3QgY2hpbGREZWYgPSB0aGlzLmVsVmlldy5kZWYubm9kZXNbaV07XG4gICAgICAgIGlmIChjaGlsZERlZi5mbGFncyAmIE5vZGVGbGFncy5DYXRQcm92aWRlcikge1xuICAgICAgICAgIGNvbGxlY3RSZWZlcmVuY2VzKHRoaXMuZWxWaWV3LCBjaGlsZERlZiwgcmVmZXJlbmNlcyk7XG4gICAgICAgIH1cbiAgICAgICAgaSArPSBjaGlsZERlZi5jaGlsZENvdW50O1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVmZXJlbmNlcztcbiAgfVxuXG4gIGdldCBjb21wb25lbnRSZW5kZXJFbGVtZW50KCkge1xuICAgIGNvbnN0IGVsRGF0YSA9IGZpbmRIb3N0RWxlbWVudCh0aGlzLmVsT3JDb21wVmlldyk7XG4gICAgcmV0dXJuIGVsRGF0YSA/IGVsRGF0YS5yZW5kZXJFbGVtZW50IDogdW5kZWZpbmVkO1xuICB9XG5cbiAgZ2V0IHJlbmRlck5vZGUoKTogYW55IHtcbiAgICByZXR1cm4gdGhpcy5ub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLlR5cGVUZXh0ID8gcmVuZGVyTm9kZSh0aGlzLnZpZXcsIHRoaXMubm9kZURlZikgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW5kZXJOb2RlKHRoaXMuZWxWaWV3LCB0aGlzLmVsRGVmKTtcbiAgfVxuXG4gIGxvZ0Vycm9yKGNvbnNvbGU6IENvbnNvbGUsIC4uLnZhbHVlczogYW55W10pIHtcbiAgICBsZXQgbG9nVmlld0RlZjogVmlld0RlZmluaXRpb247XG4gICAgbGV0IGxvZ05vZGVJbmRleDogbnVtYmVyO1xuICAgIGlmICh0aGlzLm5vZGVEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuVHlwZVRleHQpIHtcbiAgICAgIGxvZ1ZpZXdEZWYgPSB0aGlzLnZpZXcuZGVmO1xuICAgICAgbG9nTm9kZUluZGV4ID0gdGhpcy5ub2RlRGVmLm5vZGVJbmRleDtcbiAgICB9IGVsc2Uge1xuICAgICAgbG9nVmlld0RlZiA9IHRoaXMuZWxWaWV3LmRlZjtcbiAgICAgIGxvZ05vZGVJbmRleCA9IHRoaXMuZWxEZWYubm9kZUluZGV4O1xuICAgIH1cbiAgICAvLyBOb3RlOiB3ZSBvbmx5IGdlbmVyYXRlIGEgbG9nIGZ1bmN0aW9uIGZvciB0ZXh0IGFuZCBlbGVtZW50IG5vZGVzXG4gICAgLy8gdG8gbWFrZSB0aGUgZ2VuZXJhdGVkIGNvZGUgYXMgc21hbGwgYXMgcG9zc2libGUuXG4gICAgY29uc3QgcmVuZGVyTm9kZUluZGV4ID0gZ2V0UmVuZGVyTm9kZUluZGV4KGxvZ1ZpZXdEZWYsIGxvZ05vZGVJbmRleCk7XG4gICAgbGV0IGN1cnJSZW5kZXJOb2RlSW5kZXggPSAtMTtcbiAgICBsZXQgbm9kZUxvZ2dlcjogTm9kZUxvZ2dlciA9ICgpID0+IHtcbiAgICAgIGN1cnJSZW5kZXJOb2RlSW5kZXgrKztcbiAgICAgIGlmIChjdXJyUmVuZGVyTm9kZUluZGV4ID09PSByZW5kZXJOb2RlSW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIGNvbnNvbGUuZXJyb3IuYmluZChjb25zb2xlLCAuLi52YWx1ZXMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIE5PT1A7XG4gICAgICB9XG4gICAgfTtcbiAgICBsb2dWaWV3RGVmLmZhY3RvcnkgIShub2RlTG9nZ2VyKTtcbiAgICBpZiAoY3VyclJlbmRlck5vZGVJbmRleCA8IHJlbmRlck5vZGVJbmRleCkge1xuICAgICAgY29uc29sZS5lcnJvcignSWxsZWdhbCBzdGF0ZTogdGhlIFZpZXdEZWZpbml0aW9uRmFjdG9yeSBkaWQgbm90IGNhbGwgdGhlIGxvZ2dlciEnKTtcbiAgICAgICg8YW55PmNvbnNvbGUuZXJyb3IpKC4uLnZhbHVlcyk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGdldFJlbmRlck5vZGVJbmRleCh2aWV3RGVmOiBWaWV3RGVmaW5pdGlvbiwgbm9kZUluZGV4OiBudW1iZXIpOiBudW1iZXIge1xuICBsZXQgcmVuZGVyTm9kZUluZGV4ID0gLTE7XG4gIGZvciAobGV0IGkgPSAwOyBpIDw9IG5vZGVJbmRleDsgaSsrKSB7XG4gICAgY29uc3Qgbm9kZURlZiA9IHZpZXdEZWYubm9kZXNbaV07XG4gICAgaWYgKG5vZGVEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuQ2F0UmVuZGVyTm9kZSkge1xuICAgICAgcmVuZGVyTm9kZUluZGV4Kys7XG4gICAgfVxuICB9XG4gIHJldHVybiByZW5kZXJOb2RlSW5kZXg7XG59XG5cbmZ1bmN0aW9uIGZpbmRIb3N0RWxlbWVudCh2aWV3OiBWaWV3RGF0YSk6IEVsZW1lbnREYXRhfG51bGwge1xuICB3aGlsZSAodmlldyAmJiAhaXNDb21wb25lbnRWaWV3KHZpZXcpKSB7XG4gICAgdmlldyA9IHZpZXcucGFyZW50ICE7XG4gIH1cbiAgaWYgKHZpZXcucGFyZW50KSB7XG4gICAgcmV0dXJuIGFzRWxlbWVudERhdGEodmlldy5wYXJlbnQsIHZpZXdQYXJlbnRFbCh2aWV3KSAhLm5vZGVJbmRleCk7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIGNvbGxlY3RSZWZlcmVuY2VzKHZpZXc6IFZpZXdEYXRhLCBub2RlRGVmOiBOb2RlRGVmLCByZWZlcmVuY2VzOiB7W2tleTogc3RyaW5nXTogYW55fSkge1xuICBmb3IgKGxldCByZWZOYW1lIGluIG5vZGVEZWYucmVmZXJlbmNlcykge1xuICAgIHJlZmVyZW5jZXNbcmVmTmFtZV0gPSBnZXRRdWVyeVZhbHVlKHZpZXcsIG5vZGVEZWYsIG5vZGVEZWYucmVmZXJlbmNlc1tyZWZOYW1lXSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gY2FsbFdpdGhEZWJ1Z0NvbnRleHQoYWN0aW9uOiBEZWJ1Z0FjdGlvbiwgZm46IGFueSwgc2VsZjogYW55LCBhcmdzOiBhbnlbXSkge1xuICBjb25zdCBvbGRBY3Rpb24gPSBfY3VycmVudEFjdGlvbjtcbiAgY29uc3Qgb2xkVmlldyA9IF9jdXJyZW50VmlldztcbiAgY29uc3Qgb2xkTm9kZUluZGV4ID0gX2N1cnJlbnROb2RlSW5kZXg7XG4gIHRyeSB7XG4gICAgX2N1cnJlbnRBY3Rpb24gPSBhY3Rpb247XG4gICAgY29uc3QgcmVzdWx0ID0gZm4uYXBwbHkoc2VsZiwgYXJncyk7XG4gICAgX2N1cnJlbnRWaWV3ID0gb2xkVmlldztcbiAgICBfY3VycmVudE5vZGVJbmRleCA9IG9sZE5vZGVJbmRleDtcbiAgICBfY3VycmVudEFjdGlvbiA9IG9sZEFjdGlvbjtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9IGNhdGNoIChlKSB7XG4gICAgaWYgKGlzVmlld0RlYnVnRXJyb3IoZSkgfHwgIV9jdXJyZW50Vmlldykge1xuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gICAgdGhyb3cgdmlld1dyYXBwZWREZWJ1Z0Vycm9yKGUsIGdldEN1cnJlbnREZWJ1Z0NvbnRleHQoKSAhKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q3VycmVudERlYnVnQ29udGV4dCgpOiBEZWJ1Z0NvbnRleHR8bnVsbCB7XG4gIHJldHVybiBfY3VycmVudFZpZXcgPyBuZXcgRGVidWdDb250ZXh0XyhfY3VycmVudFZpZXcsIF9jdXJyZW50Tm9kZUluZGV4KSA6IG51bGw7XG59XG5cbmV4cG9ydCBjbGFzcyBEZWJ1Z1JlbmRlcmVyRmFjdG9yeTIgaW1wbGVtZW50cyBSZW5kZXJlckZhY3RvcnkyIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBkZWxlZ2F0ZTogUmVuZGVyZXJGYWN0b3J5Mikge31cblxuICBjcmVhdGVSZW5kZXJlcihlbGVtZW50OiBhbnksIHJlbmRlckRhdGE6IFJlbmRlcmVyVHlwZTJ8bnVsbCk6IFJlbmRlcmVyMiB7XG4gICAgcmV0dXJuIG5ldyBEZWJ1Z1JlbmRlcmVyMih0aGlzLmRlbGVnYXRlLmNyZWF0ZVJlbmRlcmVyKGVsZW1lbnQsIHJlbmRlckRhdGEpKTtcbiAgfVxuXG4gIGJlZ2luKCkge1xuICAgIGlmICh0aGlzLmRlbGVnYXRlLmJlZ2luKSB7XG4gICAgICB0aGlzLmRlbGVnYXRlLmJlZ2luKCk7XG4gICAgfVxuICB9XG4gIGVuZCgpIHtcbiAgICBpZiAodGhpcy5kZWxlZ2F0ZS5lbmQpIHtcbiAgICAgIHRoaXMuZGVsZWdhdGUuZW5kKCk7XG4gICAgfVxuICB9XG5cbiAgd2hlblJlbmRlcmluZ0RvbmUoKTogUHJvbWlzZTxhbnk+IHtcbiAgICBpZiAodGhpcy5kZWxlZ2F0ZS53aGVuUmVuZGVyaW5nRG9uZSkge1xuICAgICAgcmV0dXJuIHRoaXMuZGVsZWdhdGUud2hlblJlbmRlcmluZ0RvbmUoKTtcbiAgICB9XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShudWxsKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRGVidWdSZW5kZXJlcjIgaW1wbGVtZW50cyBSZW5kZXJlcjIge1xuICByZWFkb25seSBkYXRhOiB7W2tleTogc3RyaW5nXTogYW55fTtcblxuICBwcml2YXRlIGNyZWF0ZURlYnVnQ29udGV4dChuYXRpdmVFbGVtZW50OiBhbnkpIHsgcmV0dXJuIHRoaXMuZGVidWdDb250ZXh0RmFjdG9yeShuYXRpdmVFbGVtZW50KTsgfVxuXG4gIC8qKlxuICAgKiBGYWN0b3J5IGZ1bmN0aW9uIHVzZWQgdG8gY3JlYXRlIGEgYERlYnVnQ29udGV4dGAgd2hlbiBhIG5vZGUgaXMgY3JlYXRlZC5cbiAgICpcbiAgICogVGhlIGBEZWJ1Z0NvbnRleHRgIGFsbG93cyB0byByZXRyaWV2ZSBpbmZvcm1hdGlvbiBhYm91dCB0aGUgbm9kZXMgdGhhdCBhcmUgdXNlZnVsIGluIHRlc3RzLlxuICAgKlxuICAgKiBUaGUgZmFjdG9yeSBpcyBjb25maWd1cmFibGUgc28gdGhhdCB0aGUgYERlYnVnUmVuZGVyZXIyYCBjb3VsZCBpbnN0YW50aWF0ZSBlaXRoZXIgYSBWaWV3IEVuZ2luZVxuICAgKiBvciBhIFJlbmRlciBjb250ZXh0LlxuICAgKi9cbiAgZGVidWdDb250ZXh0RmFjdG9yeTogKG5hdGl2ZUVsZW1lbnQ/OiBhbnkpID0+IERlYnVnQ29udGV4dCB8IG51bGwgPSBnZXRDdXJyZW50RGVidWdDb250ZXh0O1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgZGVsZWdhdGU6IFJlbmRlcmVyMikgeyB0aGlzLmRhdGEgPSB0aGlzLmRlbGVnYXRlLmRhdGE7IH1cblxuICBkZXN0cm95Tm9kZShub2RlOiBhbnkpIHtcbiAgICByZW1vdmVEZWJ1Z05vZGVGcm9tSW5kZXgoZ2V0RGVidWdOb2RlKG5vZGUpICEpO1xuICAgIGlmICh0aGlzLmRlbGVnYXRlLmRlc3Ryb3lOb2RlKSB7XG4gICAgICB0aGlzLmRlbGVnYXRlLmRlc3Ryb3lOb2RlKG5vZGUpO1xuICAgIH1cbiAgfVxuXG4gIGRlc3Ryb3koKSB7IHRoaXMuZGVsZWdhdGUuZGVzdHJveSgpOyB9XG5cbiAgY3JlYXRlRWxlbWVudChuYW1lOiBzdHJpbmcsIG5hbWVzcGFjZT86IHN0cmluZyk6IGFueSB7XG4gICAgY29uc3QgZWwgPSB0aGlzLmRlbGVnYXRlLmNyZWF0ZUVsZW1lbnQobmFtZSwgbmFtZXNwYWNlKTtcbiAgICBjb25zdCBkZWJ1Z0N0eCA9IHRoaXMuY3JlYXRlRGVidWdDb250ZXh0KGVsKTtcbiAgICBpZiAoZGVidWdDdHgpIHtcbiAgICAgIGNvbnN0IGRlYnVnRWwgPSBuZXcgRGVidWdFbGVtZW50X19QUkVfUjNfXyhlbCwgbnVsbCwgZGVidWdDdHgpO1xuICAgICAgKGRlYnVnRWwgYXN7bmFtZTogc3RyaW5nfSkubmFtZSA9IG5hbWU7XG4gICAgICBpbmRleERlYnVnTm9kZShkZWJ1Z0VsKTtcbiAgICB9XG4gICAgcmV0dXJuIGVsO1xuICB9XG5cbiAgY3JlYXRlQ29tbWVudCh2YWx1ZTogc3RyaW5nKTogYW55IHtcbiAgICBjb25zdCBjb21tZW50ID0gdGhpcy5kZWxlZ2F0ZS5jcmVhdGVDb21tZW50KHZhbHVlKTtcbiAgICBjb25zdCBkZWJ1Z0N0eCA9IHRoaXMuY3JlYXRlRGVidWdDb250ZXh0KGNvbW1lbnQpO1xuICAgIGlmIChkZWJ1Z0N0eCkge1xuICAgICAgaW5kZXhEZWJ1Z05vZGUobmV3IERlYnVnTm9kZV9fUFJFX1IzX18oY29tbWVudCwgbnVsbCwgZGVidWdDdHgpKTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbW1lbnQ7XG4gIH1cblxuICBjcmVhdGVUZXh0KHZhbHVlOiBzdHJpbmcpOiBhbnkge1xuICAgIGNvbnN0IHRleHQgPSB0aGlzLmRlbGVnYXRlLmNyZWF0ZVRleHQodmFsdWUpO1xuICAgIGNvbnN0IGRlYnVnQ3R4ID0gdGhpcy5jcmVhdGVEZWJ1Z0NvbnRleHQodGV4dCk7XG4gICAgaWYgKGRlYnVnQ3R4KSB7XG4gICAgICBpbmRleERlYnVnTm9kZShuZXcgRGVidWdOb2RlX19QUkVfUjNfXyh0ZXh0LCBudWxsLCBkZWJ1Z0N0eCkpO1xuICAgIH1cbiAgICByZXR1cm4gdGV4dDtcbiAgfVxuXG4gIGFwcGVuZENoaWxkKHBhcmVudDogYW55LCBuZXdDaGlsZDogYW55KTogdm9pZCB7XG4gICAgY29uc3QgZGVidWdFbCA9IGdldERlYnVnTm9kZShwYXJlbnQpO1xuICAgIGNvbnN0IGRlYnVnQ2hpbGRFbCA9IGdldERlYnVnTm9kZShuZXdDaGlsZCk7XG4gICAgaWYgKGRlYnVnRWwgJiYgZGVidWdDaGlsZEVsICYmIGRlYnVnRWwgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fKSB7XG4gICAgICBkZWJ1Z0VsLmFkZENoaWxkKGRlYnVnQ2hpbGRFbCk7XG4gICAgfVxuICAgIHRoaXMuZGVsZWdhdGUuYXBwZW5kQ2hpbGQocGFyZW50LCBuZXdDaGlsZCk7XG4gIH1cblxuICBpbnNlcnRCZWZvcmUocGFyZW50OiBhbnksIG5ld0NoaWxkOiBhbnksIHJlZkNoaWxkOiBhbnkpOiB2b2lkIHtcbiAgICBjb25zdCBkZWJ1Z0VsID0gZ2V0RGVidWdOb2RlKHBhcmVudCk7XG4gICAgY29uc3QgZGVidWdDaGlsZEVsID0gZ2V0RGVidWdOb2RlKG5ld0NoaWxkKTtcbiAgICBjb25zdCBkZWJ1Z1JlZkVsID0gZ2V0RGVidWdOb2RlKHJlZkNoaWxkKSAhO1xuICAgIGlmIChkZWJ1Z0VsICYmIGRlYnVnQ2hpbGRFbCAmJiBkZWJ1Z0VsIGluc3RhbmNlb2YgRGVidWdFbGVtZW50X19QUkVfUjNfXykge1xuICAgICAgZGVidWdFbC5pbnNlcnRCZWZvcmUoZGVidWdSZWZFbCwgZGVidWdDaGlsZEVsKTtcbiAgICB9XG5cbiAgICB0aGlzLmRlbGVnYXRlLmluc2VydEJlZm9yZShwYXJlbnQsIG5ld0NoaWxkLCByZWZDaGlsZCk7XG4gIH1cblxuICByZW1vdmVDaGlsZChwYXJlbnQ6IGFueSwgb2xkQ2hpbGQ6IGFueSk6IHZvaWQge1xuICAgIGNvbnN0IGRlYnVnRWwgPSBnZXREZWJ1Z05vZGUocGFyZW50KTtcbiAgICBjb25zdCBkZWJ1Z0NoaWxkRWwgPSBnZXREZWJ1Z05vZGUob2xkQ2hpbGQpO1xuICAgIGlmIChkZWJ1Z0VsICYmIGRlYnVnQ2hpbGRFbCAmJiBkZWJ1Z0VsIGluc3RhbmNlb2YgRGVidWdFbGVtZW50X19QUkVfUjNfXykge1xuICAgICAgZGVidWdFbC5yZW1vdmVDaGlsZChkZWJ1Z0NoaWxkRWwpO1xuICAgIH1cbiAgICB0aGlzLmRlbGVnYXRlLnJlbW92ZUNoaWxkKHBhcmVudCwgb2xkQ2hpbGQpO1xuICB9XG5cbiAgc2VsZWN0Um9vdEVsZW1lbnQoc2VsZWN0b3JPck5vZGU6IHN0cmluZ3xhbnksIHByZXNlcnZlQ29udGVudD86IGJvb2xlYW4pOiBhbnkge1xuICAgIGNvbnN0IGVsID0gdGhpcy5kZWxlZ2F0ZS5zZWxlY3RSb290RWxlbWVudChzZWxlY3Rvck9yTm9kZSwgcHJlc2VydmVDb250ZW50KTtcbiAgICBjb25zdCBkZWJ1Z0N0eCA9IGdldEN1cnJlbnREZWJ1Z0NvbnRleHQoKTtcbiAgICBpZiAoZGVidWdDdHgpIHtcbiAgICAgIGluZGV4RGVidWdOb2RlKG5ldyBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fKGVsLCBudWxsLCBkZWJ1Z0N0eCkpO1xuICAgIH1cbiAgICByZXR1cm4gZWw7XG4gIH1cblxuICBzZXRBdHRyaWJ1dGUoZWw6IGFueSwgbmFtZTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nLCBuYW1lc3BhY2U/OiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCBkZWJ1Z0VsID0gZ2V0RGVidWdOb2RlKGVsKTtcbiAgICBpZiAoZGVidWdFbCAmJiBkZWJ1Z0VsIGluc3RhbmNlb2YgRGVidWdFbGVtZW50X19QUkVfUjNfXykge1xuICAgICAgY29uc3QgZnVsbE5hbWUgPSBuYW1lc3BhY2UgPyBuYW1lc3BhY2UgKyAnOicgKyBuYW1lIDogbmFtZTtcbiAgICAgIGRlYnVnRWwuYXR0cmlidXRlc1tmdWxsTmFtZV0gPSB2YWx1ZTtcbiAgICB9XG4gICAgdGhpcy5kZWxlZ2F0ZS5zZXRBdHRyaWJ1dGUoZWwsIG5hbWUsIHZhbHVlLCBuYW1lc3BhY2UpO1xuICB9XG5cbiAgcmVtb3ZlQXR0cmlidXRlKGVsOiBhbnksIG5hbWU6IHN0cmluZywgbmFtZXNwYWNlPzogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3QgZGVidWdFbCA9IGdldERlYnVnTm9kZShlbCk7XG4gICAgaWYgKGRlYnVnRWwgJiYgZGVidWdFbCBpbnN0YW5jZW9mIERlYnVnRWxlbWVudF9fUFJFX1IzX18pIHtcbiAgICAgIGNvbnN0IGZ1bGxOYW1lID0gbmFtZXNwYWNlID8gbmFtZXNwYWNlICsgJzonICsgbmFtZSA6IG5hbWU7XG4gICAgICBkZWJ1Z0VsLmF0dHJpYnV0ZXNbZnVsbE5hbWVdID0gbnVsbDtcbiAgICB9XG4gICAgdGhpcy5kZWxlZ2F0ZS5yZW1vdmVBdHRyaWJ1dGUoZWwsIG5hbWUsIG5hbWVzcGFjZSk7XG4gIH1cblxuICBhZGRDbGFzcyhlbDogYW55LCBuYW1lOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCBkZWJ1Z0VsID0gZ2V0RGVidWdOb2RlKGVsKTtcbiAgICBpZiAoZGVidWdFbCAmJiBkZWJ1Z0VsIGluc3RhbmNlb2YgRGVidWdFbGVtZW50X19QUkVfUjNfXykge1xuICAgICAgZGVidWdFbC5jbGFzc2VzW25hbWVdID0gdHJ1ZTtcbiAgICB9XG4gICAgdGhpcy5kZWxlZ2F0ZS5hZGRDbGFzcyhlbCwgbmFtZSk7XG4gIH1cblxuICByZW1vdmVDbGFzcyhlbDogYW55LCBuYW1lOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCBkZWJ1Z0VsID0gZ2V0RGVidWdOb2RlKGVsKTtcbiAgICBpZiAoZGVidWdFbCAmJiBkZWJ1Z0VsIGluc3RhbmNlb2YgRGVidWdFbGVtZW50X19QUkVfUjNfXykge1xuICAgICAgZGVidWdFbC5jbGFzc2VzW25hbWVdID0gZmFsc2U7XG4gICAgfVxuICAgIHRoaXMuZGVsZWdhdGUucmVtb3ZlQ2xhc3MoZWwsIG5hbWUpO1xuICB9XG5cbiAgc2V0U3R5bGUoZWw6IGFueSwgc3R5bGU6IHN0cmluZywgdmFsdWU6IGFueSwgZmxhZ3M6IFJlbmRlcmVyU3R5bGVGbGFnczIpOiB2b2lkIHtcbiAgICBjb25zdCBkZWJ1Z0VsID0gZ2V0RGVidWdOb2RlKGVsKTtcbiAgICBpZiAoZGVidWdFbCAmJiBkZWJ1Z0VsIGluc3RhbmNlb2YgRGVidWdFbGVtZW50X19QUkVfUjNfXykge1xuICAgICAgZGVidWdFbC5zdHlsZXNbc3R5bGVdID0gdmFsdWU7XG4gICAgfVxuICAgIHRoaXMuZGVsZWdhdGUuc2V0U3R5bGUoZWwsIHN0eWxlLCB2YWx1ZSwgZmxhZ3MpO1xuICB9XG5cbiAgcmVtb3ZlU3R5bGUoZWw6IGFueSwgc3R5bGU6IHN0cmluZywgZmxhZ3M6IFJlbmRlcmVyU3R5bGVGbGFnczIpOiB2b2lkIHtcbiAgICBjb25zdCBkZWJ1Z0VsID0gZ2V0RGVidWdOb2RlKGVsKTtcbiAgICBpZiAoZGVidWdFbCAmJiBkZWJ1Z0VsIGluc3RhbmNlb2YgRGVidWdFbGVtZW50X19QUkVfUjNfXykge1xuICAgICAgZGVidWdFbC5zdHlsZXNbc3R5bGVdID0gbnVsbDtcbiAgICB9XG4gICAgdGhpcy5kZWxlZ2F0ZS5yZW1vdmVTdHlsZShlbCwgc3R5bGUsIGZsYWdzKTtcbiAgfVxuXG4gIHNldFByb3BlcnR5KGVsOiBhbnksIG5hbWU6IHN0cmluZywgdmFsdWU6IGFueSk6IHZvaWQge1xuICAgIGNvbnN0IGRlYnVnRWwgPSBnZXREZWJ1Z05vZGUoZWwpO1xuICAgIGlmIChkZWJ1Z0VsICYmIGRlYnVnRWwgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fKSB7XG4gICAgICBkZWJ1Z0VsLnByb3BlcnRpZXNbbmFtZV0gPSB2YWx1ZTtcbiAgICB9XG4gICAgdGhpcy5kZWxlZ2F0ZS5zZXRQcm9wZXJ0eShlbCwgbmFtZSwgdmFsdWUpO1xuICB9XG5cbiAgbGlzdGVuKFxuICAgICAgdGFyZ2V0OiAnZG9jdW1lbnQnfCd3aW5kb3dzJ3wnYm9keSd8YW55LCBldmVudE5hbWU6IHN0cmluZyxcbiAgICAgIGNhbGxiYWNrOiAoZXZlbnQ6IGFueSkgPT4gYm9vbGVhbik6ICgpID0+IHZvaWQge1xuICAgIGlmICh0eXBlb2YgdGFyZ2V0ICE9PSAnc3RyaW5nJykge1xuICAgICAgY29uc3QgZGVidWdFbCA9IGdldERlYnVnTm9kZSh0YXJnZXQpO1xuICAgICAgaWYgKGRlYnVnRWwpIHtcbiAgICAgICAgZGVidWdFbC5saXN0ZW5lcnMucHVzaChuZXcgRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIGNhbGxiYWNrKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuZGVsZWdhdGUubGlzdGVuKHRhcmdldCwgZXZlbnROYW1lLCBjYWxsYmFjayk7XG4gIH1cblxuICBwYXJlbnROb2RlKG5vZGU6IGFueSk6IGFueSB7IHJldHVybiB0aGlzLmRlbGVnYXRlLnBhcmVudE5vZGUobm9kZSk7IH1cbiAgbmV4dFNpYmxpbmcobm9kZTogYW55KTogYW55IHsgcmV0dXJuIHRoaXMuZGVsZWdhdGUubmV4dFNpYmxpbmcobm9kZSk7IH1cbiAgc2V0VmFsdWUobm9kZTogYW55LCB2YWx1ZTogc3RyaW5nKTogdm9pZCB7IHJldHVybiB0aGlzLmRlbGVnYXRlLnNldFZhbHVlKG5vZGUsIHZhbHVlKTsgfVxufVxuIl19