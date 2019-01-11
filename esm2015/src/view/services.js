/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { DebugElement__PRE_R3__, DebugNode__PRE_R3__, EventListener, getDebugNode, indexDebugNode, removeDebugNodeFromIndex } from '../debug/debug_node';
import { getInjectableDef } from '../di/interface/defs';
import { ErrorHandler } from '../error_handler';
import { RendererFactory2 } from '../render/api';
import { Sanitizer } from '../sanitization/security';
import { isDevMode } from '../util/is_dev_mode';
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
     * @private
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
    /**
     * @type {?}
     * @private
     */
    DebugContext_.prototype.nodeDef;
    /**
     * @type {?}
     * @private
     */
    DebugContext_.prototype.elView;
    /**
     * @type {?}
     * @private
     */
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
    /**
     * @type {?}
     * @private
     */
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
     * @private
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
    /**
     * @type {?}
     * @private
     */
    DebugRenderer2.prototype.delegate;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmljZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy92aWV3L3NlcnZpY2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLHNCQUFzQixFQUFFLG1CQUFtQixFQUFFLGFBQWEsRUFBRSxZQUFZLEVBQUUsY0FBYyxFQUFFLHdCQUF3QixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFHdkosT0FBTyxFQUFnQixnQkFBZ0IsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQ3JFLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUk5QyxPQUFPLEVBQVksZ0JBQWdCLEVBQXFDLE1BQU0sZUFBZSxDQUFDO0FBQzlGLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSwwQkFBMEIsQ0FBQztBQUNuRCxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDOUMsT0FBTyxFQUFDLHlCQUF5QixFQUFFLDBCQUEwQixFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFFekYsT0FBTyxFQUFDLGdCQUFnQixFQUFFLGtCQUFrQixFQUFFLHFCQUFxQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3JGLE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFDdEMsT0FBTyxFQUFDLGtCQUFrQixFQUFFLGFBQWEsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUMxRCxPQUFPLEVBQUMsY0FBYyxFQUFFLGlCQUFpQixFQUFFLGlDQUFpQyxFQUFDLE1BQU0sUUFBUSxDQUFDO0FBQzVGLE9BQU8sRUFBbUosUUFBUSxFQUF1QyxhQUFhLEVBQUUsb0JBQW9CLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFDN1AsT0FBTyxFQUFDLElBQUksRUFBRSxlQUFlLEVBQUUsVUFBVSxFQUFFLGlCQUFpQixFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUsWUFB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LE9BQU8sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksYUFBYSxDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO2FBQ2hFO1NBQ0Y7UUFFRCxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDM0QsQ0FBQzs7Ozs7SUFFRCxVQUFVLENBQUMsSUFBUyxJQUFTLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDOzs7OztJQUNyRSxXQUFXLENBQUMsSUFBUyxJQUFTLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDOzs7Ozs7SUFDdkUsUUFBUSxDQUFDLElBQVMsRUFBRSxLQUFhLElBQVUsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ3pGOzs7SUF0S0MsOEJBQW9DOzs7Ozs7Ozs7O0lBWXBDLDZDQUEyRjs7Ozs7SUFFL0Usa0NBQTJCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0RlYnVnRWxlbWVudF9fUFJFX1IzX18sIERlYnVnTm9kZV9fUFJFX1IzX18sIEV2ZW50TGlzdGVuZXIsIGdldERlYnVnTm9kZSwgaW5kZXhEZWJ1Z05vZGUsIHJlbW92ZURlYnVnTm9kZUZyb21JbmRleH0gZnJvbSAnLi4vZGVidWcvZGVidWdfbm9kZSc7XG5pbXBvcnQge0luamVjdG9yfSBmcm9tICcuLi9kaSc7XG5pbXBvcnQge0luamVjdGFibGVUeXBlfSBmcm9tICcuLi9kaS9pbmplY3RhYmxlJztcbmltcG9ydCB7SW5qZWN0YWJsZURlZiwgZ2V0SW5qZWN0YWJsZURlZn0gZnJvbSAnLi4vZGkvaW50ZXJmYWNlL2RlZnMnO1xuaW1wb3J0IHtFcnJvckhhbmRsZXJ9IGZyb20gJy4uL2Vycm9yX2hhbmRsZXInO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge0NvbXBvbmVudEZhY3Rvcnl9IGZyb20gJy4uL2xpbmtlci9jb21wb25lbnRfZmFjdG9yeSc7XG5pbXBvcnQge05nTW9kdWxlUmVmfSBmcm9tICcuLi9saW5rZXIvbmdfbW9kdWxlX2ZhY3RvcnknO1xuaW1wb3J0IHtSZW5kZXJlcjIsIFJlbmRlcmVyRmFjdG9yeTIsIFJlbmRlcmVyU3R5bGVGbGFnczIsIFJlbmRlcmVyVHlwZTJ9IGZyb20gJy4uL3JlbmRlci9hcGknO1xuaW1wb3J0IHtTYW5pdGl6ZXJ9IGZyb20gJy4uL3Nhbml0aXphdGlvbi9zZWN1cml0eSc7XG5pbXBvcnQge2lzRGV2TW9kZX0gZnJvbSAnLi4vdXRpbC9pc19kZXZfbW9kZSc7XG5pbXBvcnQge25vcm1hbGl6ZURlYnVnQmluZGluZ05hbWUsIG5vcm1hbGl6ZURlYnVnQmluZGluZ1ZhbHVlfSBmcm9tICcuLi91dGlsL25nX3JlZmxlY3QnO1xuXG5pbXBvcnQge2lzVmlld0RlYnVnRXJyb3IsIHZpZXdEZXN0cm95ZWRFcnJvciwgdmlld1dyYXBwZWREZWJ1Z0Vycm9yfSBmcm9tICcuL2Vycm9ycyc7XG5pbXBvcnQge3Jlc29sdmVEZXB9IGZyb20gJy4vcHJvdmlkZXInO1xuaW1wb3J0IHtkaXJ0eVBhcmVudFF1ZXJpZXMsIGdldFF1ZXJ5VmFsdWV9IGZyb20gJy4vcXVlcnknO1xuaW1wb3J0IHtjcmVhdGVJbmplY3RvciwgY3JlYXRlTmdNb2R1bGVSZWYsIGdldENvbXBvbmVudFZpZXdEZWZpbml0aW9uRmFjdG9yeX0gZnJvbSAnLi9yZWZzJztcbmltcG9ydCB7QXJndW1lbnRUeXBlLCBCaW5kaW5nRmxhZ3MsIENoZWNrVHlwZSwgRGVidWdDb250ZXh0LCBFbGVtZW50RGF0YSwgTmdNb2R1bGVEZWZpbml0aW9uLCBOb2RlRGVmLCBOb2RlRmxhZ3MsIE5vZGVMb2dnZXIsIFByb3ZpZGVyT3ZlcnJpZGUsIFJvb3REYXRhLCBTZXJ2aWNlcywgVmlld0RhdGEsIFZpZXdEZWZpbml0aW9uLCBWaWV3U3RhdGUsIGFzRWxlbWVudERhdGEsIGFzUHVyZUV4cHJlc3Npb25EYXRhfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7Tk9PUCwgaXNDb21wb25lbnRWaWV3LCByZW5kZXJOb2RlLCByZXNvbHZlRGVmaW5pdGlvbiwgc3BsaXREZXBzRHNsLCB0b2tlbktleSwgdmlld1BhcmVudEVsfSBmcm9tICcuL3V0aWwnO1xuaW1wb3J0IHtjaGVja0FuZFVwZGF0ZU5vZGUsIGNoZWNrQW5kVXBkYXRlVmlldywgY2hlY2tOb0NoYW5nZXNOb2RlLCBjaGVja05vQ2hhbmdlc1ZpZXcsIGNyZWF0ZUNvbXBvbmVudFZpZXcsIGNyZWF0ZUVtYmVkZGVkVmlldywgY3JlYXRlUm9vdFZpZXcsIGRlc3Ryb3lWaWV3fSBmcm9tICcuL3ZpZXcnO1xuXG5cbmxldCBpbml0aWFsaXplZCA9IGZhbHNlO1xuXG5leHBvcnQgZnVuY3Rpb24gaW5pdFNlcnZpY2VzSWZOZWVkZWQoKSB7XG4gIGlmIChpbml0aWFsaXplZCkge1xuICAgIHJldHVybjtcbiAgfVxuICBpbml0aWFsaXplZCA9IHRydWU7XG4gIGNvbnN0IHNlcnZpY2VzID0gaXNEZXZNb2RlKCkgPyBjcmVhdGVEZWJ1Z1NlcnZpY2VzKCkgOiBjcmVhdGVQcm9kU2VydmljZXMoKTtcbiAgU2VydmljZXMuc2V0Q3VycmVudE5vZGUgPSBzZXJ2aWNlcy5zZXRDdXJyZW50Tm9kZTtcbiAgU2VydmljZXMuY3JlYXRlUm9vdFZpZXcgPSBzZXJ2aWNlcy5jcmVhdGVSb290VmlldztcbiAgU2VydmljZXMuY3JlYXRlRW1iZWRkZWRWaWV3ID0gc2VydmljZXMuY3JlYXRlRW1iZWRkZWRWaWV3O1xuICBTZXJ2aWNlcy5jcmVhdGVDb21wb25lbnRWaWV3ID0gc2VydmljZXMuY3JlYXRlQ29tcG9uZW50VmlldztcbiAgU2VydmljZXMuY3JlYXRlTmdNb2R1bGVSZWYgPSBzZXJ2aWNlcy5jcmVhdGVOZ01vZHVsZVJlZjtcbiAgU2VydmljZXMub3ZlcnJpZGVQcm92aWRlciA9IHNlcnZpY2VzLm92ZXJyaWRlUHJvdmlkZXI7XG4gIFNlcnZpY2VzLm92ZXJyaWRlQ29tcG9uZW50VmlldyA9IHNlcnZpY2VzLm92ZXJyaWRlQ29tcG9uZW50VmlldztcbiAgU2VydmljZXMuY2xlYXJPdmVycmlkZXMgPSBzZXJ2aWNlcy5jbGVhck92ZXJyaWRlcztcbiAgU2VydmljZXMuY2hlY2tBbmRVcGRhdGVWaWV3ID0gc2VydmljZXMuY2hlY2tBbmRVcGRhdGVWaWV3O1xuICBTZXJ2aWNlcy5jaGVja05vQ2hhbmdlc1ZpZXcgPSBzZXJ2aWNlcy5jaGVja05vQ2hhbmdlc1ZpZXc7XG4gIFNlcnZpY2VzLmRlc3Ryb3lWaWV3ID0gc2VydmljZXMuZGVzdHJveVZpZXc7XG4gIFNlcnZpY2VzLnJlc29sdmVEZXAgPSByZXNvbHZlRGVwO1xuICBTZXJ2aWNlcy5jcmVhdGVEZWJ1Z0NvbnRleHQgPSBzZXJ2aWNlcy5jcmVhdGVEZWJ1Z0NvbnRleHQ7XG4gIFNlcnZpY2VzLmhhbmRsZUV2ZW50ID0gc2VydmljZXMuaGFuZGxlRXZlbnQ7XG4gIFNlcnZpY2VzLnVwZGF0ZURpcmVjdGl2ZXMgPSBzZXJ2aWNlcy51cGRhdGVEaXJlY3RpdmVzO1xuICBTZXJ2aWNlcy51cGRhdGVSZW5kZXJlciA9IHNlcnZpY2VzLnVwZGF0ZVJlbmRlcmVyO1xuICBTZXJ2aWNlcy5kaXJ0eVBhcmVudFF1ZXJpZXMgPSBkaXJ0eVBhcmVudFF1ZXJpZXM7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVByb2RTZXJ2aWNlcygpIHtcbiAgcmV0dXJuIHtcbiAgICBzZXRDdXJyZW50Tm9kZTogKCkgPT4ge30sXG4gICAgY3JlYXRlUm9vdFZpZXc6IGNyZWF0ZVByb2RSb290VmlldyxcbiAgICBjcmVhdGVFbWJlZGRlZFZpZXc6IGNyZWF0ZUVtYmVkZGVkVmlldyxcbiAgICBjcmVhdGVDb21wb25lbnRWaWV3OiBjcmVhdGVDb21wb25lbnRWaWV3LFxuICAgIGNyZWF0ZU5nTW9kdWxlUmVmOiBjcmVhdGVOZ01vZHVsZVJlZixcbiAgICBvdmVycmlkZVByb3ZpZGVyOiBOT09QLFxuICAgIG92ZXJyaWRlQ29tcG9uZW50VmlldzogTk9PUCxcbiAgICBjbGVhck92ZXJyaWRlczogTk9PUCxcbiAgICBjaGVja0FuZFVwZGF0ZVZpZXc6IGNoZWNrQW5kVXBkYXRlVmlldyxcbiAgICBjaGVja05vQ2hhbmdlc1ZpZXc6IGNoZWNrTm9DaGFuZ2VzVmlldyxcbiAgICBkZXN0cm95VmlldzogZGVzdHJveVZpZXcsXG4gICAgY3JlYXRlRGVidWdDb250ZXh0OiAodmlldzogVmlld0RhdGEsIG5vZGVJbmRleDogbnVtYmVyKSA9PiBuZXcgRGVidWdDb250ZXh0Xyh2aWV3LCBub2RlSW5kZXgpLFxuICAgIGhhbmRsZUV2ZW50OiAodmlldzogVmlld0RhdGEsIG5vZGVJbmRleDogbnVtYmVyLCBldmVudE5hbWU6IHN0cmluZywgZXZlbnQ6IGFueSkgPT5cbiAgICAgICAgICAgICAgICAgICAgIHZpZXcuZGVmLmhhbmRsZUV2ZW50KHZpZXcsIG5vZGVJbmRleCwgZXZlbnROYW1lLCBldmVudCksXG4gICAgdXBkYXRlRGlyZWN0aXZlczogKHZpZXc6IFZpZXdEYXRhLCBjaGVja1R5cGU6IENoZWNrVHlwZSkgPT4gdmlldy5kZWYudXBkYXRlRGlyZWN0aXZlcyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tUeXBlID09PSBDaGVja1R5cGUuQ2hlY2tBbmRVcGRhdGUgPyBwcm9kQ2hlY2tBbmRVcGRhdGVOb2RlIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9kQ2hlY2tOb0NoYW5nZXNOb2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB2aWV3KSxcbiAgICB1cGRhdGVSZW5kZXJlcjogKHZpZXc6IFZpZXdEYXRhLCBjaGVja1R5cGU6IENoZWNrVHlwZSkgPT4gdmlldy5kZWYudXBkYXRlUmVuZGVyZXIoXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGVja1R5cGUgPT09IENoZWNrVHlwZS5DaGVja0FuZFVwZGF0ZSA/IHByb2RDaGVja0FuZFVwZGF0ZU5vZGUgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9kQ2hlY2tOb0NoYW5nZXNOb2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgdmlldyksXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZURlYnVnU2VydmljZXMoKSB7XG4gIHJldHVybiB7XG4gICAgc2V0Q3VycmVudE5vZGU6IGRlYnVnU2V0Q3VycmVudE5vZGUsXG4gICAgY3JlYXRlUm9vdFZpZXc6IGRlYnVnQ3JlYXRlUm9vdFZpZXcsXG4gICAgY3JlYXRlRW1iZWRkZWRWaWV3OiBkZWJ1Z0NyZWF0ZUVtYmVkZGVkVmlldyxcbiAgICBjcmVhdGVDb21wb25lbnRWaWV3OiBkZWJ1Z0NyZWF0ZUNvbXBvbmVudFZpZXcsXG4gICAgY3JlYXRlTmdNb2R1bGVSZWY6IGRlYnVnQ3JlYXRlTmdNb2R1bGVSZWYsXG4gICAgb3ZlcnJpZGVQcm92aWRlcjogZGVidWdPdmVycmlkZVByb3ZpZGVyLFxuICAgIG92ZXJyaWRlQ29tcG9uZW50VmlldzogZGVidWdPdmVycmlkZUNvbXBvbmVudFZpZXcsXG4gICAgY2xlYXJPdmVycmlkZXM6IGRlYnVnQ2xlYXJPdmVycmlkZXMsXG4gICAgY2hlY2tBbmRVcGRhdGVWaWV3OiBkZWJ1Z0NoZWNrQW5kVXBkYXRlVmlldyxcbiAgICBjaGVja05vQ2hhbmdlc1ZpZXc6IGRlYnVnQ2hlY2tOb0NoYW5nZXNWaWV3LFxuICAgIGRlc3Ryb3lWaWV3OiBkZWJ1Z0Rlc3Ryb3lWaWV3LFxuICAgIGNyZWF0ZURlYnVnQ29udGV4dDogKHZpZXc6IFZpZXdEYXRhLCBub2RlSW5kZXg6IG51bWJlcikgPT4gbmV3IERlYnVnQ29udGV4dF8odmlldywgbm9kZUluZGV4KSxcbiAgICBoYW5kbGVFdmVudDogZGVidWdIYW5kbGVFdmVudCxcbiAgICB1cGRhdGVEaXJlY3RpdmVzOiBkZWJ1Z1VwZGF0ZURpcmVjdGl2ZXMsXG4gICAgdXBkYXRlUmVuZGVyZXI6IGRlYnVnVXBkYXRlUmVuZGVyZXIsXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVByb2RSb290VmlldyhcbiAgICBlbEluamVjdG9yOiBJbmplY3RvciwgcHJvamVjdGFibGVOb2RlczogYW55W11bXSwgcm9vdFNlbGVjdG9yT3JOb2RlOiBzdHJpbmcgfCBhbnksXG4gICAgZGVmOiBWaWV3RGVmaW5pdGlvbiwgbmdNb2R1bGU6IE5nTW9kdWxlUmVmPGFueT4sIGNvbnRleHQ/OiBhbnkpOiBWaWV3RGF0YSB7XG4gIGNvbnN0IHJlbmRlcmVyRmFjdG9yeTogUmVuZGVyZXJGYWN0b3J5MiA9IG5nTW9kdWxlLmluamVjdG9yLmdldChSZW5kZXJlckZhY3RvcnkyKTtcbiAgcmV0dXJuIGNyZWF0ZVJvb3RWaWV3KFxuICAgICAgY3JlYXRlUm9vdERhdGEoZWxJbmplY3RvciwgbmdNb2R1bGUsIHJlbmRlcmVyRmFjdG9yeSwgcHJvamVjdGFibGVOb2Rlcywgcm9vdFNlbGVjdG9yT3JOb2RlKSxcbiAgICAgIGRlZiwgY29udGV4dCk7XG59XG5cbmZ1bmN0aW9uIGRlYnVnQ3JlYXRlUm9vdFZpZXcoXG4gICAgZWxJbmplY3RvcjogSW5qZWN0b3IsIHByb2plY3RhYmxlTm9kZXM6IGFueVtdW10sIHJvb3RTZWxlY3Rvck9yTm9kZTogc3RyaW5nIHwgYW55LFxuICAgIGRlZjogVmlld0RlZmluaXRpb24sIG5nTW9kdWxlOiBOZ01vZHVsZVJlZjxhbnk+LCBjb250ZXh0PzogYW55KTogVmlld0RhdGEge1xuICBjb25zdCByZW5kZXJlckZhY3Rvcnk6IFJlbmRlcmVyRmFjdG9yeTIgPSBuZ01vZHVsZS5pbmplY3Rvci5nZXQoUmVuZGVyZXJGYWN0b3J5Mik7XG4gIGNvbnN0IHJvb3QgPSBjcmVhdGVSb290RGF0YShcbiAgICAgIGVsSW5qZWN0b3IsIG5nTW9kdWxlLCBuZXcgRGVidWdSZW5kZXJlckZhY3RvcnkyKHJlbmRlcmVyRmFjdG9yeSksIHByb2plY3RhYmxlTm9kZXMsXG4gICAgICByb290U2VsZWN0b3JPck5vZGUpO1xuICBjb25zdCBkZWZXaXRoT3ZlcnJpZGUgPSBhcHBseVByb3ZpZGVyT3ZlcnJpZGVzVG9WaWV3KGRlZik7XG4gIHJldHVybiBjYWxsV2l0aERlYnVnQ29udGV4dChcbiAgICAgIERlYnVnQWN0aW9uLmNyZWF0ZSwgY3JlYXRlUm9vdFZpZXcsIG51bGwsIFtyb290LCBkZWZXaXRoT3ZlcnJpZGUsIGNvbnRleHRdKTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlUm9vdERhdGEoXG4gICAgZWxJbmplY3RvcjogSW5qZWN0b3IsIG5nTW9kdWxlOiBOZ01vZHVsZVJlZjxhbnk+LCByZW5kZXJlckZhY3Rvcnk6IFJlbmRlcmVyRmFjdG9yeTIsXG4gICAgcHJvamVjdGFibGVOb2RlczogYW55W11bXSwgcm9vdFNlbGVjdG9yT3JOb2RlOiBhbnkpOiBSb290RGF0YSB7XG4gIGNvbnN0IHNhbml0aXplciA9IG5nTW9kdWxlLmluamVjdG9yLmdldChTYW5pdGl6ZXIpO1xuICBjb25zdCBlcnJvckhhbmRsZXIgPSBuZ01vZHVsZS5pbmplY3Rvci5nZXQoRXJyb3JIYW5kbGVyKTtcbiAgY29uc3QgcmVuZGVyZXIgPSByZW5kZXJlckZhY3RvcnkuY3JlYXRlUmVuZGVyZXIobnVsbCwgbnVsbCk7XG4gIHJldHVybiB7XG4gICAgbmdNb2R1bGUsXG4gICAgaW5qZWN0b3I6IGVsSW5qZWN0b3IsIHByb2plY3RhYmxlTm9kZXMsXG4gICAgc2VsZWN0b3JPck5vZGU6IHJvb3RTZWxlY3Rvck9yTm9kZSwgc2FuaXRpemVyLCByZW5kZXJlckZhY3RvcnksIHJlbmRlcmVyLCBlcnJvckhhbmRsZXJcbiAgfTtcbn1cblxuZnVuY3Rpb24gZGVidWdDcmVhdGVFbWJlZGRlZFZpZXcoXG4gICAgcGFyZW50VmlldzogVmlld0RhdGEsIGFuY2hvckRlZjogTm9kZURlZiwgdmlld0RlZjogVmlld0RlZmluaXRpb24sIGNvbnRleHQ/OiBhbnkpOiBWaWV3RGF0YSB7XG4gIGNvbnN0IGRlZldpdGhPdmVycmlkZSA9IGFwcGx5UHJvdmlkZXJPdmVycmlkZXNUb1ZpZXcodmlld0RlZik7XG4gIHJldHVybiBjYWxsV2l0aERlYnVnQ29udGV4dChcbiAgICAgIERlYnVnQWN0aW9uLmNyZWF0ZSwgY3JlYXRlRW1iZWRkZWRWaWV3LCBudWxsLFxuICAgICAgW3BhcmVudFZpZXcsIGFuY2hvckRlZiwgZGVmV2l0aE92ZXJyaWRlLCBjb250ZXh0XSk7XG59XG5cbmZ1bmN0aW9uIGRlYnVnQ3JlYXRlQ29tcG9uZW50VmlldyhcbiAgICBwYXJlbnRWaWV3OiBWaWV3RGF0YSwgbm9kZURlZjogTm9kZURlZiwgdmlld0RlZjogVmlld0RlZmluaXRpb24sIGhvc3RFbGVtZW50OiBhbnkpOiBWaWV3RGF0YSB7XG4gIGNvbnN0IG92ZXJyaWRlQ29tcG9uZW50VmlldyA9XG4gICAgICB2aWV3RGVmT3ZlcnJpZGVzLmdldChub2RlRGVmLmVsZW1lbnQgIS5jb21wb25lbnRQcm92aWRlciAhLnByb3ZpZGVyICEudG9rZW4pO1xuICBpZiAob3ZlcnJpZGVDb21wb25lbnRWaWV3KSB7XG4gICAgdmlld0RlZiA9IG92ZXJyaWRlQ29tcG9uZW50VmlldztcbiAgfSBlbHNlIHtcbiAgICB2aWV3RGVmID0gYXBwbHlQcm92aWRlck92ZXJyaWRlc1RvVmlldyh2aWV3RGVmKTtcbiAgfVxuICByZXR1cm4gY2FsbFdpdGhEZWJ1Z0NvbnRleHQoXG4gICAgICBEZWJ1Z0FjdGlvbi5jcmVhdGUsIGNyZWF0ZUNvbXBvbmVudFZpZXcsIG51bGwsIFtwYXJlbnRWaWV3LCBub2RlRGVmLCB2aWV3RGVmLCBob3N0RWxlbWVudF0pO1xufVxuXG5mdW5jdGlvbiBkZWJ1Z0NyZWF0ZU5nTW9kdWxlUmVmKFxuICAgIG1vZHVsZVR5cGU6IFR5cGU8YW55PiwgcGFyZW50SW5qZWN0b3I6IEluamVjdG9yLCBib290c3RyYXBDb21wb25lbnRzOiBUeXBlPGFueT5bXSxcbiAgICBkZWY6IE5nTW9kdWxlRGVmaW5pdGlvbik6IE5nTW9kdWxlUmVmPGFueT4ge1xuICBjb25zdCBkZWZXaXRoT3ZlcnJpZGUgPSBhcHBseVByb3ZpZGVyT3ZlcnJpZGVzVG9OZ01vZHVsZShkZWYpO1xuICByZXR1cm4gY3JlYXRlTmdNb2R1bGVSZWYobW9kdWxlVHlwZSwgcGFyZW50SW5qZWN0b3IsIGJvb3RzdHJhcENvbXBvbmVudHMsIGRlZldpdGhPdmVycmlkZSk7XG59XG5cbmNvbnN0IHByb3ZpZGVyT3ZlcnJpZGVzID0gbmV3IE1hcDxhbnksIFByb3ZpZGVyT3ZlcnJpZGU+KCk7XG5jb25zdCBwcm92aWRlck92ZXJyaWRlc1dpdGhTY29wZSA9IG5ldyBNYXA8SW5qZWN0YWJsZVR5cGU8YW55PiwgUHJvdmlkZXJPdmVycmlkZT4oKTtcbmNvbnN0IHZpZXdEZWZPdmVycmlkZXMgPSBuZXcgTWFwPGFueSwgVmlld0RlZmluaXRpb24+KCk7XG5cbmZ1bmN0aW9uIGRlYnVnT3ZlcnJpZGVQcm92aWRlcihvdmVycmlkZTogUHJvdmlkZXJPdmVycmlkZSkge1xuICBwcm92aWRlck92ZXJyaWRlcy5zZXQob3ZlcnJpZGUudG9rZW4sIG92ZXJyaWRlKTtcbiAgbGV0IGluamVjdGFibGVEZWY6IEluamVjdGFibGVEZWY8YW55PnxudWxsO1xuICBpZiAodHlwZW9mIG92ZXJyaWRlLnRva2VuID09PSAnZnVuY3Rpb24nICYmIChpbmplY3RhYmxlRGVmID0gZ2V0SW5qZWN0YWJsZURlZihvdmVycmlkZS50b2tlbikpICYmXG4gICAgICB0eXBlb2YgaW5qZWN0YWJsZURlZi5wcm92aWRlZEluID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcHJvdmlkZXJPdmVycmlkZXNXaXRoU2NvcGUuc2V0KG92ZXJyaWRlLnRva2VuIGFzIEluamVjdGFibGVUeXBlPGFueT4sIG92ZXJyaWRlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBkZWJ1Z092ZXJyaWRlQ29tcG9uZW50Vmlldyhjb21wOiBhbnksIGNvbXBGYWN0b3J5OiBDb21wb25lbnRGYWN0b3J5PGFueT4pIHtcbiAgY29uc3QgaG9zdFZpZXdEZWYgPSByZXNvbHZlRGVmaW5pdGlvbihnZXRDb21wb25lbnRWaWV3RGVmaW5pdGlvbkZhY3RvcnkoY29tcEZhY3RvcnkpKTtcbiAgY29uc3QgY29tcFZpZXdEZWYgPSByZXNvbHZlRGVmaW5pdGlvbihob3N0Vmlld0RlZi5ub2Rlc1swXS5lbGVtZW50ICEuY29tcG9uZW50VmlldyAhKTtcbiAgdmlld0RlZk92ZXJyaWRlcy5zZXQoY29tcCwgY29tcFZpZXdEZWYpO1xufVxuXG5mdW5jdGlvbiBkZWJ1Z0NsZWFyT3ZlcnJpZGVzKCkge1xuICBwcm92aWRlck92ZXJyaWRlcy5jbGVhcigpO1xuICBwcm92aWRlck92ZXJyaWRlc1dpdGhTY29wZS5jbGVhcigpO1xuICB2aWV3RGVmT3ZlcnJpZGVzLmNsZWFyKCk7XG59XG5cbi8vIE5vdGVzIGFib3V0IHRoZSBhbGdvcml0aG06XG4vLyAxKSBMb2NhdGUgdGhlIHByb3ZpZGVycyBvZiBhbiBlbGVtZW50IGFuZCBjaGVjayBpZiBvbmUgb2YgdGhlbSB3YXMgb3ZlcndyaXR0ZW5cbi8vIDIpIENoYW5nZSB0aGUgcHJvdmlkZXJzIG9mIHRoYXQgZWxlbWVudFxuLy9cbi8vIFdlIG9ubHkgY3JlYXRlIG5ldyBkYXRhc3RydWN0dXJlcyBpZiB3ZSBuZWVkIHRvLCB0byBrZWVwIHBlcmYgaW1wYWN0XG4vLyByZWFzb25hYmxlLlxuZnVuY3Rpb24gYXBwbHlQcm92aWRlck92ZXJyaWRlc1RvVmlldyhkZWY6IFZpZXdEZWZpbml0aW9uKTogVmlld0RlZmluaXRpb24ge1xuICBpZiAocHJvdmlkZXJPdmVycmlkZXMuc2l6ZSA9PT0gMCkge1xuICAgIHJldHVybiBkZWY7XG4gIH1cbiAgY29uc3QgZWxlbWVudEluZGljZXNXaXRoT3ZlcndyaXR0ZW5Qcm92aWRlcnMgPSBmaW5kRWxlbWVudEluZGljZXNXaXRoT3ZlcndyaXR0ZW5Qcm92aWRlcnMoZGVmKTtcbiAgaWYgKGVsZW1lbnRJbmRpY2VzV2l0aE92ZXJ3cml0dGVuUHJvdmlkZXJzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBkZWY7XG4gIH1cbiAgLy8gY2xvbmUgdGhlIHdob2xlIHZpZXcgZGVmaW5pdGlvbixcbiAgLy8gYXMgaXQgbWFpbnRhaW5zIHJlZmVyZW5jZXMgYmV0d2VlbiB0aGUgbm9kZXMgdGhhdCBhcmUgaGFyZCB0byB1cGRhdGUuXG4gIGRlZiA9IGRlZi5mYWN0b3J5ICEoKCkgPT4gTk9PUCk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZWxlbWVudEluZGljZXNXaXRoT3ZlcndyaXR0ZW5Qcm92aWRlcnMubGVuZ3RoOyBpKyspIHtcbiAgICBhcHBseVByb3ZpZGVyT3ZlcnJpZGVzVG9FbGVtZW50KGRlZiwgZWxlbWVudEluZGljZXNXaXRoT3ZlcndyaXR0ZW5Qcm92aWRlcnNbaV0pO1xuICB9XG4gIHJldHVybiBkZWY7XG5cbiAgZnVuY3Rpb24gZmluZEVsZW1lbnRJbmRpY2VzV2l0aE92ZXJ3cml0dGVuUHJvdmlkZXJzKGRlZjogVmlld0RlZmluaXRpb24pOiBudW1iZXJbXSB7XG4gICAgY29uc3QgZWxJbmRpY2VzV2l0aE92ZXJ3cml0dGVuUHJvdmlkZXJzOiBudW1iZXJbXSA9IFtdO1xuICAgIGxldCBsYXN0RWxlbWVudERlZjogTm9kZURlZnxudWxsID0gbnVsbDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRlZi5ub2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3Qgbm9kZURlZiA9IGRlZi5ub2Rlc1tpXTtcbiAgICAgIGlmIChub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLlR5cGVFbGVtZW50KSB7XG4gICAgICAgIGxhc3RFbGVtZW50RGVmID0gbm9kZURlZjtcbiAgICAgIH1cbiAgICAgIGlmIChsYXN0RWxlbWVudERlZiAmJiBub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLkNhdFByb3ZpZGVyTm9EaXJlY3RpdmUgJiZcbiAgICAgICAgICBwcm92aWRlck92ZXJyaWRlcy5oYXMobm9kZURlZi5wcm92aWRlciAhLnRva2VuKSkge1xuICAgICAgICBlbEluZGljZXNXaXRoT3ZlcndyaXR0ZW5Qcm92aWRlcnMucHVzaChsYXN0RWxlbWVudERlZiAhLm5vZGVJbmRleCk7XG4gICAgICAgIGxhc3RFbGVtZW50RGVmID0gbnVsbDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGVsSW5kaWNlc1dpdGhPdmVyd3JpdHRlblByb3ZpZGVycztcbiAgfVxuXG4gIGZ1bmN0aW9uIGFwcGx5UHJvdmlkZXJPdmVycmlkZXNUb0VsZW1lbnQodmlld0RlZjogVmlld0RlZmluaXRpb24sIGVsSW5kZXg6IG51bWJlcikge1xuICAgIGZvciAobGV0IGkgPSBlbEluZGV4ICsgMTsgaSA8IHZpZXdEZWYubm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IG5vZGVEZWYgPSB2aWV3RGVmLm5vZGVzW2ldO1xuICAgICAgaWYgKG5vZGVEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuVHlwZUVsZW1lbnQpIHtcbiAgICAgICAgLy8gc3RvcCBhdCB0aGUgbmV4dCBlbGVtZW50XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmIChub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLkNhdFByb3ZpZGVyTm9EaXJlY3RpdmUpIHtcbiAgICAgICAgY29uc3QgcHJvdmlkZXIgPSBub2RlRGVmLnByb3ZpZGVyICE7XG4gICAgICAgIGNvbnN0IG92ZXJyaWRlID0gcHJvdmlkZXJPdmVycmlkZXMuZ2V0KHByb3ZpZGVyLnRva2VuKTtcbiAgICAgICAgaWYgKG92ZXJyaWRlKSB7XG4gICAgICAgICAgbm9kZURlZi5mbGFncyA9IChub2RlRGVmLmZsYWdzICYgfk5vZGVGbGFncy5DYXRQcm92aWRlck5vRGlyZWN0aXZlKSB8IG92ZXJyaWRlLmZsYWdzO1xuICAgICAgICAgIHByb3ZpZGVyLmRlcHMgPSBzcGxpdERlcHNEc2wob3ZlcnJpZGUuZGVwcyk7XG4gICAgICAgICAgcHJvdmlkZXIudmFsdWUgPSBvdmVycmlkZS52YWx1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vLyBOb3RlcyBhYm91dCB0aGUgYWxnb3JpdGhtOlxuLy8gV2Ugb25seSBjcmVhdGUgbmV3IGRhdGFzdHJ1Y3R1cmVzIGlmIHdlIG5lZWQgdG8sIHRvIGtlZXAgcGVyZiBpbXBhY3Rcbi8vIHJlYXNvbmFibGUuXG5mdW5jdGlvbiBhcHBseVByb3ZpZGVyT3ZlcnJpZGVzVG9OZ01vZHVsZShkZWY6IE5nTW9kdWxlRGVmaW5pdGlvbik6IE5nTW9kdWxlRGVmaW5pdGlvbiB7XG4gIGNvbnN0IHtoYXNPdmVycmlkZXMsIGhhc0RlcHJlY2F0ZWRPdmVycmlkZXN9ID0gY2FsY0hhc092ZXJyaWRlcyhkZWYpO1xuICBpZiAoIWhhc092ZXJyaWRlcykge1xuICAgIHJldHVybiBkZWY7XG4gIH1cbiAgLy8gY2xvbmUgdGhlIHdob2xlIHZpZXcgZGVmaW5pdGlvbixcbiAgLy8gYXMgaXQgbWFpbnRhaW5zIHJlZmVyZW5jZXMgYmV0d2VlbiB0aGUgbm9kZXMgdGhhdCBhcmUgaGFyZCB0byB1cGRhdGUuXG4gIGRlZiA9IGRlZi5mYWN0b3J5ICEoKCkgPT4gTk9PUCk7XG4gIGFwcGx5UHJvdmlkZXJPdmVycmlkZXMoZGVmKTtcbiAgcmV0dXJuIGRlZjtcblxuICBmdW5jdGlvbiBjYWxjSGFzT3ZlcnJpZGVzKGRlZjogTmdNb2R1bGVEZWZpbml0aW9uKTpcbiAgICAgIHtoYXNPdmVycmlkZXM6IGJvb2xlYW4sIGhhc0RlcHJlY2F0ZWRPdmVycmlkZXM6IGJvb2xlYW59IHtcbiAgICBsZXQgaGFzT3ZlcnJpZGVzID0gZmFsc2U7XG4gICAgbGV0IGhhc0RlcHJlY2F0ZWRPdmVycmlkZXMgPSBmYWxzZTtcbiAgICBpZiAocHJvdmlkZXJPdmVycmlkZXMuc2l6ZSA9PT0gMCkge1xuICAgICAgcmV0dXJuIHtoYXNPdmVycmlkZXMsIGhhc0RlcHJlY2F0ZWRPdmVycmlkZXN9O1xuICAgIH1cbiAgICBkZWYucHJvdmlkZXJzLmZvckVhY2gobm9kZSA9PiB7XG4gICAgICBjb25zdCBvdmVycmlkZSA9IHByb3ZpZGVyT3ZlcnJpZGVzLmdldChub2RlLnRva2VuKTtcbiAgICAgIGlmICgobm9kZS5mbGFncyAmIE5vZGVGbGFncy5DYXRQcm92aWRlck5vRGlyZWN0aXZlKSAmJiBvdmVycmlkZSkge1xuICAgICAgICBoYXNPdmVycmlkZXMgPSB0cnVlO1xuICAgICAgICBoYXNEZXByZWNhdGVkT3ZlcnJpZGVzID0gaGFzRGVwcmVjYXRlZE92ZXJyaWRlcyB8fCBvdmVycmlkZS5kZXByZWNhdGVkQmVoYXZpb3I7XG4gICAgICB9XG4gICAgfSk7XG4gICAgZGVmLm1vZHVsZXMuZm9yRWFjaChtb2R1bGUgPT4ge1xuICAgICAgcHJvdmlkZXJPdmVycmlkZXNXaXRoU2NvcGUuZm9yRWFjaCgob3ZlcnJpZGUsIHRva2VuKSA9PiB7XG4gICAgICAgIGlmIChnZXRJbmplY3RhYmxlRGVmKHRva2VuKSAhLnByb3ZpZGVkSW4gPT09IG1vZHVsZSkge1xuICAgICAgICAgIGhhc092ZXJyaWRlcyA9IHRydWU7XG4gICAgICAgICAgaGFzRGVwcmVjYXRlZE92ZXJyaWRlcyA9IGhhc0RlcHJlY2F0ZWRPdmVycmlkZXMgfHwgb3ZlcnJpZGUuZGVwcmVjYXRlZEJlaGF2aW9yO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICByZXR1cm4ge2hhc092ZXJyaWRlcywgaGFzRGVwcmVjYXRlZE92ZXJyaWRlc307XG4gIH1cblxuICBmdW5jdGlvbiBhcHBseVByb3ZpZGVyT3ZlcnJpZGVzKGRlZjogTmdNb2R1bGVEZWZpbml0aW9uKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkZWYucHJvdmlkZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBwcm92aWRlciA9IGRlZi5wcm92aWRlcnNbaV07XG4gICAgICBpZiAoaGFzRGVwcmVjYXRlZE92ZXJyaWRlcykge1xuICAgICAgICAvLyBXZSBoYWQgYSBidWcgd2hlcmUgbWUgbWFkZVxuICAgICAgICAvLyBhbGwgcHJvdmlkZXJzIGxhenkuIEtlZXAgdGhpcyBsb2dpYyBiZWhpbmQgYSBmbGFnXG4gICAgICAgIC8vIGZvciBtaWdyYXRpbmcgZXhpc3RpbmcgdXNlcnMuXG4gICAgICAgIHByb3ZpZGVyLmZsYWdzIHw9IE5vZGVGbGFncy5MYXp5UHJvdmlkZXI7XG4gICAgICB9XG4gICAgICBjb25zdCBvdmVycmlkZSA9IHByb3ZpZGVyT3ZlcnJpZGVzLmdldChwcm92aWRlci50b2tlbik7XG4gICAgICBpZiAob3ZlcnJpZGUpIHtcbiAgICAgICAgcHJvdmlkZXIuZmxhZ3MgPSAocHJvdmlkZXIuZmxhZ3MgJiB+Tm9kZUZsYWdzLkNhdFByb3ZpZGVyTm9EaXJlY3RpdmUpIHwgb3ZlcnJpZGUuZmxhZ3M7XG4gICAgICAgIHByb3ZpZGVyLmRlcHMgPSBzcGxpdERlcHNEc2wob3ZlcnJpZGUuZGVwcyk7XG4gICAgICAgIHByb3ZpZGVyLnZhbHVlID0gb3ZlcnJpZGUudmFsdWU7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChwcm92aWRlck92ZXJyaWRlc1dpdGhTY29wZS5zaXplID4gMCkge1xuICAgICAgbGV0IG1vZHVsZVNldCA9IG5ldyBTZXQ8YW55PihkZWYubW9kdWxlcyk7XG4gICAgICBwcm92aWRlck92ZXJyaWRlc1dpdGhTY29wZS5mb3JFYWNoKChvdmVycmlkZSwgdG9rZW4pID0+IHtcbiAgICAgICAgaWYgKG1vZHVsZVNldC5oYXMoZ2V0SW5qZWN0YWJsZURlZih0b2tlbikgIS5wcm92aWRlZEluKSkge1xuICAgICAgICAgIGxldCBwcm92aWRlciA9IHtcbiAgICAgICAgICAgIHRva2VuOiB0b2tlbixcbiAgICAgICAgICAgIGZsYWdzOlxuICAgICAgICAgICAgICAgIG92ZXJyaWRlLmZsYWdzIHwgKGhhc0RlcHJlY2F0ZWRPdmVycmlkZXMgPyBOb2RlRmxhZ3MuTGF6eVByb3ZpZGVyIDogTm9kZUZsYWdzLk5vbmUpLFxuICAgICAgICAgICAgZGVwczogc3BsaXREZXBzRHNsKG92ZXJyaWRlLmRlcHMpLFxuICAgICAgICAgICAgdmFsdWU6IG92ZXJyaWRlLnZhbHVlLFxuICAgICAgICAgICAgaW5kZXg6IGRlZi5wcm92aWRlcnMubGVuZ3RoLFxuICAgICAgICAgIH07XG4gICAgICAgICAgZGVmLnByb3ZpZGVycy5wdXNoKHByb3ZpZGVyKTtcbiAgICAgICAgICBkZWYucHJvdmlkZXJzQnlLZXlbdG9rZW5LZXkodG9rZW4pXSA9IHByb3ZpZGVyO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gcHJvZENoZWNrQW5kVXBkYXRlTm9kZShcbiAgICB2aWV3OiBWaWV3RGF0YSwgY2hlY2tJbmRleDogbnVtYmVyLCBhcmdTdHlsZTogQXJndW1lbnRUeXBlLCB2MD86IGFueSwgdjE/OiBhbnksIHYyPzogYW55LFxuICAgIHYzPzogYW55LCB2ND86IGFueSwgdjU/OiBhbnksIHY2PzogYW55LCB2Nz86IGFueSwgdjg/OiBhbnksIHY5PzogYW55KTogYW55IHtcbiAgY29uc3Qgbm9kZURlZiA9IHZpZXcuZGVmLm5vZGVzW2NoZWNrSW5kZXhdO1xuICBjaGVja0FuZFVwZGF0ZU5vZGUodmlldywgbm9kZURlZiwgYXJnU3R5bGUsIHYwLCB2MSwgdjIsIHYzLCB2NCwgdjUsIHY2LCB2NywgdjgsIHY5KTtcbiAgcmV0dXJuIChub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLkNhdFB1cmVFeHByZXNzaW9uKSA/XG4gICAgICBhc1B1cmVFeHByZXNzaW9uRGF0YSh2aWV3LCBjaGVja0luZGV4KS52YWx1ZSA6XG4gICAgICB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIHByb2RDaGVja05vQ2hhbmdlc05vZGUoXG4gICAgdmlldzogVmlld0RhdGEsIGNoZWNrSW5kZXg6IG51bWJlciwgYXJnU3R5bGU6IEFyZ3VtZW50VHlwZSwgdjA/OiBhbnksIHYxPzogYW55LCB2Mj86IGFueSxcbiAgICB2Mz86IGFueSwgdjQ/OiBhbnksIHY1PzogYW55LCB2Nj86IGFueSwgdjc/OiBhbnksIHY4PzogYW55LCB2OT86IGFueSk6IGFueSB7XG4gIGNvbnN0IG5vZGVEZWYgPSB2aWV3LmRlZi5ub2Rlc1tjaGVja0luZGV4XTtcbiAgY2hlY2tOb0NoYW5nZXNOb2RlKHZpZXcsIG5vZGVEZWYsIGFyZ1N0eWxlLCB2MCwgdjEsIHYyLCB2MywgdjQsIHY1LCB2NiwgdjcsIHY4LCB2OSk7XG4gIHJldHVybiAobm9kZURlZi5mbGFncyAmIE5vZGVGbGFncy5DYXRQdXJlRXhwcmVzc2lvbikgP1xuICAgICAgYXNQdXJlRXhwcmVzc2lvbkRhdGEodmlldywgY2hlY2tJbmRleCkudmFsdWUgOlxuICAgICAgdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBkZWJ1Z0NoZWNrQW5kVXBkYXRlVmlldyh2aWV3OiBWaWV3RGF0YSkge1xuICByZXR1cm4gY2FsbFdpdGhEZWJ1Z0NvbnRleHQoRGVidWdBY3Rpb24uZGV0ZWN0Q2hhbmdlcywgY2hlY2tBbmRVcGRhdGVWaWV3LCBudWxsLCBbdmlld10pO1xufVxuXG5mdW5jdGlvbiBkZWJ1Z0NoZWNrTm9DaGFuZ2VzVmlldyh2aWV3OiBWaWV3RGF0YSkge1xuICByZXR1cm4gY2FsbFdpdGhEZWJ1Z0NvbnRleHQoRGVidWdBY3Rpb24uY2hlY2tOb0NoYW5nZXMsIGNoZWNrTm9DaGFuZ2VzVmlldywgbnVsbCwgW3ZpZXddKTtcbn1cblxuZnVuY3Rpb24gZGVidWdEZXN0cm95Vmlldyh2aWV3OiBWaWV3RGF0YSkge1xuICByZXR1cm4gY2FsbFdpdGhEZWJ1Z0NvbnRleHQoRGVidWdBY3Rpb24uZGVzdHJveSwgZGVzdHJveVZpZXcsIG51bGwsIFt2aWV3XSk7XG59XG5cbmVudW0gRGVidWdBY3Rpb24ge1xuICBjcmVhdGUsXG4gIGRldGVjdENoYW5nZXMsXG4gIGNoZWNrTm9DaGFuZ2VzLFxuICBkZXN0cm95LFxuICBoYW5kbGVFdmVudFxufVxuXG5sZXQgX2N1cnJlbnRBY3Rpb246IERlYnVnQWN0aW9uO1xubGV0IF9jdXJyZW50VmlldzogVmlld0RhdGE7XG5sZXQgX2N1cnJlbnROb2RlSW5kZXg6IG51bWJlcnxudWxsO1xuXG5mdW5jdGlvbiBkZWJ1Z1NldEN1cnJlbnROb2RlKHZpZXc6IFZpZXdEYXRhLCBub2RlSW5kZXg6IG51bWJlciB8IG51bGwpIHtcbiAgX2N1cnJlbnRWaWV3ID0gdmlldztcbiAgX2N1cnJlbnROb2RlSW5kZXggPSBub2RlSW5kZXg7XG59XG5cbmZ1bmN0aW9uIGRlYnVnSGFuZGxlRXZlbnQodmlldzogVmlld0RhdGEsIG5vZGVJbmRleDogbnVtYmVyLCBldmVudE5hbWU6IHN0cmluZywgZXZlbnQ6IGFueSkge1xuICBkZWJ1Z1NldEN1cnJlbnROb2RlKHZpZXcsIG5vZGVJbmRleCk7XG4gIHJldHVybiBjYWxsV2l0aERlYnVnQ29udGV4dChcbiAgICAgIERlYnVnQWN0aW9uLmhhbmRsZUV2ZW50LCB2aWV3LmRlZi5oYW5kbGVFdmVudCwgbnVsbCwgW3ZpZXcsIG5vZGVJbmRleCwgZXZlbnROYW1lLCBldmVudF0pO1xufVxuXG5mdW5jdGlvbiBkZWJ1Z1VwZGF0ZURpcmVjdGl2ZXModmlldzogVmlld0RhdGEsIGNoZWNrVHlwZTogQ2hlY2tUeXBlKSB7XG4gIGlmICh2aWV3LnN0YXRlICYgVmlld1N0YXRlLkRlc3Ryb3llZCkge1xuICAgIHRocm93IHZpZXdEZXN0cm95ZWRFcnJvcihEZWJ1Z0FjdGlvbltfY3VycmVudEFjdGlvbl0pO1xuICB9XG4gIGRlYnVnU2V0Q3VycmVudE5vZGUodmlldywgbmV4dERpcmVjdGl2ZVdpdGhCaW5kaW5nKHZpZXcsIDApKTtcbiAgcmV0dXJuIHZpZXcuZGVmLnVwZGF0ZURpcmVjdGl2ZXMoZGVidWdDaGVja0RpcmVjdGl2ZXNGbiwgdmlldyk7XG5cbiAgZnVuY3Rpb24gZGVidWdDaGVja0RpcmVjdGl2ZXNGbihcbiAgICAgIHZpZXc6IFZpZXdEYXRhLCBub2RlSW5kZXg6IG51bWJlciwgYXJnU3R5bGU6IEFyZ3VtZW50VHlwZSwgLi4udmFsdWVzOiBhbnlbXSkge1xuICAgIGNvbnN0IG5vZGVEZWYgPSB2aWV3LmRlZi5ub2Rlc1tub2RlSW5kZXhdO1xuICAgIGlmIChjaGVja1R5cGUgPT09IENoZWNrVHlwZS5DaGVja0FuZFVwZGF0ZSkge1xuICAgICAgZGVidWdDaGVja0FuZFVwZGF0ZU5vZGUodmlldywgbm9kZURlZiwgYXJnU3R5bGUsIHZhbHVlcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlYnVnQ2hlY2tOb0NoYW5nZXNOb2RlKHZpZXcsIG5vZGVEZWYsIGFyZ1N0eWxlLCB2YWx1ZXMpO1xuICAgIH1cbiAgICBpZiAobm9kZURlZi5mbGFncyAmIE5vZGVGbGFncy5UeXBlRGlyZWN0aXZlKSB7XG4gICAgICBkZWJ1Z1NldEN1cnJlbnROb2RlKHZpZXcsIG5leHREaXJlY3RpdmVXaXRoQmluZGluZyh2aWV3LCBub2RlSW5kZXgpKTtcbiAgICB9XG4gICAgcmV0dXJuIChub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLkNhdFB1cmVFeHByZXNzaW9uKSA/XG4gICAgICAgIGFzUHVyZUV4cHJlc3Npb25EYXRhKHZpZXcsIG5vZGVEZWYubm9kZUluZGV4KS52YWx1ZSA6XG4gICAgICAgIHVuZGVmaW5lZDtcbiAgfVxufVxuXG5mdW5jdGlvbiBkZWJ1Z1VwZGF0ZVJlbmRlcmVyKHZpZXc6IFZpZXdEYXRhLCBjaGVja1R5cGU6IENoZWNrVHlwZSkge1xuICBpZiAodmlldy5zdGF0ZSAmIFZpZXdTdGF0ZS5EZXN0cm95ZWQpIHtcbiAgICB0aHJvdyB2aWV3RGVzdHJveWVkRXJyb3IoRGVidWdBY3Rpb25bX2N1cnJlbnRBY3Rpb25dKTtcbiAgfVxuICBkZWJ1Z1NldEN1cnJlbnROb2RlKHZpZXcsIG5leHRSZW5kZXJOb2RlV2l0aEJpbmRpbmcodmlldywgMCkpO1xuICByZXR1cm4gdmlldy5kZWYudXBkYXRlUmVuZGVyZXIoZGVidWdDaGVja1JlbmRlck5vZGVGbiwgdmlldyk7XG5cbiAgZnVuY3Rpb24gZGVidWdDaGVja1JlbmRlck5vZGVGbihcbiAgICAgIHZpZXc6IFZpZXdEYXRhLCBub2RlSW5kZXg6IG51bWJlciwgYXJnU3R5bGU6IEFyZ3VtZW50VHlwZSwgLi4udmFsdWVzOiBhbnlbXSkge1xuICAgIGNvbnN0IG5vZGVEZWYgPSB2aWV3LmRlZi5ub2Rlc1tub2RlSW5kZXhdO1xuICAgIGlmIChjaGVja1R5cGUgPT09IENoZWNrVHlwZS5DaGVja0FuZFVwZGF0ZSkge1xuICAgICAgZGVidWdDaGVja0FuZFVwZGF0ZU5vZGUodmlldywgbm9kZURlZiwgYXJnU3R5bGUsIHZhbHVlcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlYnVnQ2hlY2tOb0NoYW5nZXNOb2RlKHZpZXcsIG5vZGVEZWYsIGFyZ1N0eWxlLCB2YWx1ZXMpO1xuICAgIH1cbiAgICBpZiAobm9kZURlZi5mbGFncyAmIE5vZGVGbGFncy5DYXRSZW5kZXJOb2RlKSB7XG4gICAgICBkZWJ1Z1NldEN1cnJlbnROb2RlKHZpZXcsIG5leHRSZW5kZXJOb2RlV2l0aEJpbmRpbmcodmlldywgbm9kZUluZGV4KSk7XG4gICAgfVxuICAgIHJldHVybiAobm9kZURlZi5mbGFncyAmIE5vZGVGbGFncy5DYXRQdXJlRXhwcmVzc2lvbikgP1xuICAgICAgICBhc1B1cmVFeHByZXNzaW9uRGF0YSh2aWV3LCBub2RlRGVmLm5vZGVJbmRleCkudmFsdWUgOlxuICAgICAgICB1bmRlZmluZWQ7XG4gIH1cbn1cblxuZnVuY3Rpb24gZGVidWdDaGVja0FuZFVwZGF0ZU5vZGUoXG4gICAgdmlldzogVmlld0RhdGEsIG5vZGVEZWY6IE5vZGVEZWYsIGFyZ1N0eWxlOiBBcmd1bWVudFR5cGUsIGdpdmVuVmFsdWVzOiBhbnlbXSk6IHZvaWQge1xuICBjb25zdCBjaGFuZ2VkID0gKDxhbnk+Y2hlY2tBbmRVcGRhdGVOb2RlKSh2aWV3LCBub2RlRGVmLCBhcmdTdHlsZSwgLi4uZ2l2ZW5WYWx1ZXMpO1xuICBpZiAoY2hhbmdlZCkge1xuICAgIGNvbnN0IHZhbHVlcyA9IGFyZ1N0eWxlID09PSBBcmd1bWVudFR5cGUuRHluYW1pYyA/IGdpdmVuVmFsdWVzWzBdIDogZ2l2ZW5WYWx1ZXM7XG4gICAgaWYgKG5vZGVEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuVHlwZURpcmVjdGl2ZSkge1xuICAgICAgY29uc3QgYmluZGluZ1ZhbHVlczoge1trZXk6IHN0cmluZ106IHN0cmluZ30gPSB7fTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbm9kZURlZi5iaW5kaW5ncy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBiaW5kaW5nID0gbm9kZURlZi5iaW5kaW5nc1tpXTtcbiAgICAgICAgY29uc3QgdmFsdWUgPSB2YWx1ZXNbaV07XG4gICAgICAgIGlmIChiaW5kaW5nLmZsYWdzICYgQmluZGluZ0ZsYWdzLlR5cGVQcm9wZXJ0eSkge1xuICAgICAgICAgIGJpbmRpbmdWYWx1ZXNbbm9ybWFsaXplRGVidWdCaW5kaW5nTmFtZShiaW5kaW5nLm5vbk1pbmlmaWVkTmFtZSAhKV0gPVxuICAgICAgICAgICAgICBub3JtYWxpemVEZWJ1Z0JpbmRpbmdWYWx1ZSh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGNvbnN0IGVsRGVmID0gbm9kZURlZi5wYXJlbnQgITtcbiAgICAgIGNvbnN0IGVsID0gYXNFbGVtZW50RGF0YSh2aWV3LCBlbERlZi5ub2RlSW5kZXgpLnJlbmRlckVsZW1lbnQ7XG4gICAgICBpZiAoIWVsRGVmLmVsZW1lbnQgIS5uYW1lKSB7XG4gICAgICAgIC8vIGEgY29tbWVudC5cbiAgICAgICAgdmlldy5yZW5kZXJlci5zZXRWYWx1ZShlbCwgYGJpbmRpbmdzPSR7SlNPTi5zdHJpbmdpZnkoYmluZGluZ1ZhbHVlcywgbnVsbCwgMil9YCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBhIHJlZ3VsYXIgZWxlbWVudC5cbiAgICAgICAgZm9yIChsZXQgYXR0ciBpbiBiaW5kaW5nVmFsdWVzKSB7XG4gICAgICAgICAgY29uc3QgdmFsdWUgPSBiaW5kaW5nVmFsdWVzW2F0dHJdO1xuICAgICAgICAgIGlmICh2YWx1ZSAhPSBudWxsKSB7XG4gICAgICAgICAgICB2aWV3LnJlbmRlcmVyLnNldEF0dHJpYnV0ZShlbCwgYXR0ciwgdmFsdWUpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2aWV3LnJlbmRlcmVyLnJlbW92ZUF0dHJpYnV0ZShlbCwgYXR0cik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGRlYnVnQ2hlY2tOb0NoYW5nZXNOb2RlKFxuICAgIHZpZXc6IFZpZXdEYXRhLCBub2RlRGVmOiBOb2RlRGVmLCBhcmdTdHlsZTogQXJndW1lbnRUeXBlLCB2YWx1ZXM6IGFueVtdKTogdm9pZCB7XG4gICg8YW55PmNoZWNrTm9DaGFuZ2VzTm9kZSkodmlldywgbm9kZURlZiwgYXJnU3R5bGUsIC4uLnZhbHVlcyk7XG59XG5cbmZ1bmN0aW9uIG5leHREaXJlY3RpdmVXaXRoQmluZGluZyh2aWV3OiBWaWV3RGF0YSwgbm9kZUluZGV4OiBudW1iZXIpOiBudW1iZXJ8bnVsbCB7XG4gIGZvciAobGV0IGkgPSBub2RlSW5kZXg7IGkgPCB2aWV3LmRlZi5ub2Rlcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IG5vZGVEZWYgPSB2aWV3LmRlZi5ub2Rlc1tpXTtcbiAgICBpZiAobm9kZURlZi5mbGFncyAmIE5vZGVGbGFncy5UeXBlRGlyZWN0aXZlICYmIG5vZGVEZWYuYmluZGluZ3MgJiYgbm9kZURlZi5iaW5kaW5ncy5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gbmV4dFJlbmRlck5vZGVXaXRoQmluZGluZyh2aWV3OiBWaWV3RGF0YSwgbm9kZUluZGV4OiBudW1iZXIpOiBudW1iZXJ8bnVsbCB7XG4gIGZvciAobGV0IGkgPSBub2RlSW5kZXg7IGkgPCB2aWV3LmRlZi5ub2Rlcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IG5vZGVEZWYgPSB2aWV3LmRlZi5ub2Rlc1tpXTtcbiAgICBpZiAoKG5vZGVEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuQ2F0UmVuZGVyTm9kZSkgJiYgbm9kZURlZi5iaW5kaW5ncyAmJiBub2RlRGVmLmJpbmRpbmdzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIGk7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5jbGFzcyBEZWJ1Z0NvbnRleHRfIGltcGxlbWVudHMgRGVidWdDb250ZXh0IHtcbiAgcHJpdmF0ZSBub2RlRGVmOiBOb2RlRGVmO1xuICBwcml2YXRlIGVsVmlldzogVmlld0RhdGE7XG4gIHByaXZhdGUgZWxEZWY6IE5vZGVEZWY7XG5cbiAgY29uc3RydWN0b3IocHVibGljIHZpZXc6IFZpZXdEYXRhLCBwdWJsaWMgbm9kZUluZGV4OiBudW1iZXJ8bnVsbCkge1xuICAgIGlmIChub2RlSW5kZXggPT0gbnVsbCkge1xuICAgICAgdGhpcy5ub2RlSW5kZXggPSBub2RlSW5kZXggPSAwO1xuICAgIH1cbiAgICB0aGlzLm5vZGVEZWYgPSB2aWV3LmRlZi5ub2Rlc1tub2RlSW5kZXhdO1xuICAgIGxldCBlbERlZiA9IHRoaXMubm9kZURlZjtcbiAgICBsZXQgZWxWaWV3ID0gdmlldztcbiAgICB3aGlsZSAoZWxEZWYgJiYgKGVsRGVmLmZsYWdzICYgTm9kZUZsYWdzLlR5cGVFbGVtZW50KSA9PT0gMCkge1xuICAgICAgZWxEZWYgPSBlbERlZi5wYXJlbnQgITtcbiAgICB9XG4gICAgaWYgKCFlbERlZikge1xuICAgICAgd2hpbGUgKCFlbERlZiAmJiBlbFZpZXcpIHtcbiAgICAgICAgZWxEZWYgPSB2aWV3UGFyZW50RWwoZWxWaWV3KSAhO1xuICAgICAgICBlbFZpZXcgPSBlbFZpZXcucGFyZW50ICE7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuZWxEZWYgPSBlbERlZjtcbiAgICB0aGlzLmVsVmlldyA9IGVsVmlldztcbiAgfVxuXG4gIHByaXZhdGUgZ2V0IGVsT3JDb21wVmlldygpIHtcbiAgICAvLyBIYXMgdG8gYmUgZG9uZSBsYXppbHkgYXMgd2UgdXNlIHRoZSBEZWJ1Z0NvbnRleHQgYWxzbyBkdXJpbmcgY3JlYXRpb24gb2YgZWxlbWVudHMuLi5cbiAgICByZXR1cm4gYXNFbGVtZW50RGF0YSh0aGlzLmVsVmlldywgdGhpcy5lbERlZi5ub2RlSW5kZXgpLmNvbXBvbmVudFZpZXcgfHwgdGhpcy52aWV3O1xuICB9XG5cbiAgZ2V0IGluamVjdG9yKCk6IEluamVjdG9yIHsgcmV0dXJuIGNyZWF0ZUluamVjdG9yKHRoaXMuZWxWaWV3LCB0aGlzLmVsRGVmKTsgfVxuXG4gIGdldCBjb21wb25lbnQoKTogYW55IHsgcmV0dXJuIHRoaXMuZWxPckNvbXBWaWV3LmNvbXBvbmVudDsgfVxuXG4gIGdldCBjb250ZXh0KCk6IGFueSB7IHJldHVybiB0aGlzLmVsT3JDb21wVmlldy5jb250ZXh0OyB9XG5cbiAgZ2V0IHByb3ZpZGVyVG9rZW5zKCk6IGFueVtdIHtcbiAgICBjb25zdCB0b2tlbnM6IGFueVtdID0gW107XG4gICAgaWYgKHRoaXMuZWxEZWYpIHtcbiAgICAgIGZvciAobGV0IGkgPSB0aGlzLmVsRGVmLm5vZGVJbmRleCArIDE7IGkgPD0gdGhpcy5lbERlZi5ub2RlSW5kZXggKyB0aGlzLmVsRGVmLmNoaWxkQ291bnQ7XG4gICAgICAgICAgIGkrKykge1xuICAgICAgICBjb25zdCBjaGlsZERlZiA9IHRoaXMuZWxWaWV3LmRlZi5ub2Rlc1tpXTtcbiAgICAgICAgaWYgKGNoaWxkRGVmLmZsYWdzICYgTm9kZUZsYWdzLkNhdFByb3ZpZGVyKSB7XG4gICAgICAgICAgdG9rZW5zLnB1c2goY2hpbGREZWYucHJvdmlkZXIgIS50b2tlbik7XG4gICAgICAgIH1cbiAgICAgICAgaSArPSBjaGlsZERlZi5jaGlsZENvdW50O1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdG9rZW5zO1xuICB9XG5cbiAgZ2V0IHJlZmVyZW5jZXMoKToge1trZXk6IHN0cmluZ106IGFueX0ge1xuICAgIGNvbnN0IHJlZmVyZW5jZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9ID0ge307XG4gICAgaWYgKHRoaXMuZWxEZWYpIHtcbiAgICAgIGNvbGxlY3RSZWZlcmVuY2VzKHRoaXMuZWxWaWV3LCB0aGlzLmVsRGVmLCByZWZlcmVuY2VzKTtcblxuICAgICAgZm9yIChsZXQgaSA9IHRoaXMuZWxEZWYubm9kZUluZGV4ICsgMTsgaSA8PSB0aGlzLmVsRGVmLm5vZGVJbmRleCArIHRoaXMuZWxEZWYuY2hpbGRDb3VudDtcbiAgICAgICAgICAgaSsrKSB7XG4gICAgICAgIGNvbnN0IGNoaWxkRGVmID0gdGhpcy5lbFZpZXcuZGVmLm5vZGVzW2ldO1xuICAgICAgICBpZiAoY2hpbGREZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuQ2F0UHJvdmlkZXIpIHtcbiAgICAgICAgICBjb2xsZWN0UmVmZXJlbmNlcyh0aGlzLmVsVmlldywgY2hpbGREZWYsIHJlZmVyZW5jZXMpO1xuICAgICAgICB9XG4gICAgICAgIGkgKz0gY2hpbGREZWYuY2hpbGRDb3VudDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlZmVyZW5jZXM7XG4gIH1cblxuICBnZXQgY29tcG9uZW50UmVuZGVyRWxlbWVudCgpIHtcbiAgICBjb25zdCBlbERhdGEgPSBmaW5kSG9zdEVsZW1lbnQodGhpcy5lbE9yQ29tcFZpZXcpO1xuICAgIHJldHVybiBlbERhdGEgPyBlbERhdGEucmVuZGVyRWxlbWVudCA6IHVuZGVmaW5lZDtcbiAgfVxuXG4gIGdldCByZW5kZXJOb2RlKCk6IGFueSB7XG4gICAgcmV0dXJuIHRoaXMubm9kZURlZi5mbGFncyAmIE5vZGVGbGFncy5UeXBlVGV4dCA/IHJlbmRlck5vZGUodGhpcy52aWV3LCB0aGlzLm5vZGVEZWYpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVuZGVyTm9kZSh0aGlzLmVsVmlldywgdGhpcy5lbERlZik7XG4gIH1cblxuICBsb2dFcnJvcihjb25zb2xlOiBDb25zb2xlLCAuLi52YWx1ZXM6IGFueVtdKSB7XG4gICAgbGV0IGxvZ1ZpZXdEZWY6IFZpZXdEZWZpbml0aW9uO1xuICAgIGxldCBsb2dOb2RlSW5kZXg6IG51bWJlcjtcbiAgICBpZiAodGhpcy5ub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLlR5cGVUZXh0KSB7XG4gICAgICBsb2dWaWV3RGVmID0gdGhpcy52aWV3LmRlZjtcbiAgICAgIGxvZ05vZGVJbmRleCA9IHRoaXMubm9kZURlZi5ub2RlSW5kZXg7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxvZ1ZpZXdEZWYgPSB0aGlzLmVsVmlldy5kZWY7XG4gICAgICBsb2dOb2RlSW5kZXggPSB0aGlzLmVsRGVmLm5vZGVJbmRleDtcbiAgICB9XG4gICAgLy8gTm90ZTogd2Ugb25seSBnZW5lcmF0ZSBhIGxvZyBmdW5jdGlvbiBmb3IgdGV4dCBhbmQgZWxlbWVudCBub2Rlc1xuICAgIC8vIHRvIG1ha2UgdGhlIGdlbmVyYXRlZCBjb2RlIGFzIHNtYWxsIGFzIHBvc3NpYmxlLlxuICAgIGNvbnN0IHJlbmRlck5vZGVJbmRleCA9IGdldFJlbmRlck5vZGVJbmRleChsb2dWaWV3RGVmLCBsb2dOb2RlSW5kZXgpO1xuICAgIGxldCBjdXJyUmVuZGVyTm9kZUluZGV4ID0gLTE7XG4gICAgbGV0IG5vZGVMb2dnZXI6IE5vZGVMb2dnZXIgPSAoKSA9PiB7XG4gICAgICBjdXJyUmVuZGVyTm9kZUluZGV4Kys7XG4gICAgICBpZiAoY3VyclJlbmRlck5vZGVJbmRleCA9PT0gcmVuZGVyTm9kZUluZGV4KSB7XG4gICAgICAgIHJldHVybiBjb25zb2xlLmVycm9yLmJpbmQoY29uc29sZSwgLi4udmFsdWVzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBOT09QO1xuICAgICAgfVxuICAgIH07XG4gICAgbG9nVmlld0RlZi5mYWN0b3J5ICEobm9kZUxvZ2dlcik7XG4gICAgaWYgKGN1cnJSZW5kZXJOb2RlSW5kZXggPCByZW5kZXJOb2RlSW5kZXgpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0lsbGVnYWwgc3RhdGU6IHRoZSBWaWV3RGVmaW5pdGlvbkZhY3RvcnkgZGlkIG5vdCBjYWxsIHRoZSBsb2dnZXIhJyk7XG4gICAgICAoPGFueT5jb25zb2xlLmVycm9yKSguLi52YWx1ZXMpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRSZW5kZXJOb2RlSW5kZXgodmlld0RlZjogVmlld0RlZmluaXRpb24sIG5vZGVJbmRleDogbnVtYmVyKTogbnVtYmVyIHtcbiAgbGV0IHJlbmRlck5vZGVJbmRleCA9IC0xO1xuICBmb3IgKGxldCBpID0gMDsgaSA8PSBub2RlSW5kZXg7IGkrKykge1xuICAgIGNvbnN0IG5vZGVEZWYgPSB2aWV3RGVmLm5vZGVzW2ldO1xuICAgIGlmIChub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLkNhdFJlbmRlck5vZGUpIHtcbiAgICAgIHJlbmRlck5vZGVJbmRleCsrO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVuZGVyTm9kZUluZGV4O1xufVxuXG5mdW5jdGlvbiBmaW5kSG9zdEVsZW1lbnQodmlldzogVmlld0RhdGEpOiBFbGVtZW50RGF0YXxudWxsIHtcbiAgd2hpbGUgKHZpZXcgJiYgIWlzQ29tcG9uZW50Vmlldyh2aWV3KSkge1xuICAgIHZpZXcgPSB2aWV3LnBhcmVudCAhO1xuICB9XG4gIGlmICh2aWV3LnBhcmVudCkge1xuICAgIHJldHVybiBhc0VsZW1lbnREYXRhKHZpZXcucGFyZW50LCB2aWV3UGFyZW50RWwodmlldykgIS5ub2RlSW5kZXgpO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBjb2xsZWN0UmVmZXJlbmNlcyh2aWV3OiBWaWV3RGF0YSwgbm9kZURlZjogTm9kZURlZiwgcmVmZXJlbmNlczoge1trZXk6IHN0cmluZ106IGFueX0pIHtcbiAgZm9yIChsZXQgcmVmTmFtZSBpbiBub2RlRGVmLnJlZmVyZW5jZXMpIHtcbiAgICByZWZlcmVuY2VzW3JlZk5hbWVdID0gZ2V0UXVlcnlWYWx1ZSh2aWV3LCBub2RlRGVmLCBub2RlRGVmLnJlZmVyZW5jZXNbcmVmTmFtZV0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNhbGxXaXRoRGVidWdDb250ZXh0KGFjdGlvbjogRGVidWdBY3Rpb24sIGZuOiBhbnksIHNlbGY6IGFueSwgYXJnczogYW55W10pIHtcbiAgY29uc3Qgb2xkQWN0aW9uID0gX2N1cnJlbnRBY3Rpb247XG4gIGNvbnN0IG9sZFZpZXcgPSBfY3VycmVudFZpZXc7XG4gIGNvbnN0IG9sZE5vZGVJbmRleCA9IF9jdXJyZW50Tm9kZUluZGV4O1xuICB0cnkge1xuICAgIF9jdXJyZW50QWN0aW9uID0gYWN0aW9uO1xuICAgIGNvbnN0IHJlc3VsdCA9IGZuLmFwcGx5KHNlbGYsIGFyZ3MpO1xuICAgIF9jdXJyZW50VmlldyA9IG9sZFZpZXc7XG4gICAgX2N1cnJlbnROb2RlSW5kZXggPSBvbGROb2RlSW5kZXg7XG4gICAgX2N1cnJlbnRBY3Rpb24gPSBvbGRBY3Rpb247XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGlmIChpc1ZpZXdEZWJ1Z0Vycm9yKGUpIHx8ICFfY3VycmVudFZpZXcpIHtcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICAgIHRocm93IHZpZXdXcmFwcGVkRGVidWdFcnJvcihlLCBnZXRDdXJyZW50RGVidWdDb250ZXh0KCkgISk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEN1cnJlbnREZWJ1Z0NvbnRleHQoKTogRGVidWdDb250ZXh0fG51bGwge1xuICByZXR1cm4gX2N1cnJlbnRWaWV3ID8gbmV3IERlYnVnQ29udGV4dF8oX2N1cnJlbnRWaWV3LCBfY3VycmVudE5vZGVJbmRleCkgOiBudWxsO1xufVxuXG5leHBvcnQgY2xhc3MgRGVidWdSZW5kZXJlckZhY3RvcnkyIGltcGxlbWVudHMgUmVuZGVyZXJGYWN0b3J5MiB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgZGVsZWdhdGU6IFJlbmRlcmVyRmFjdG9yeTIpIHt9XG5cbiAgY3JlYXRlUmVuZGVyZXIoZWxlbWVudDogYW55LCByZW5kZXJEYXRhOiBSZW5kZXJlclR5cGUyfG51bGwpOiBSZW5kZXJlcjIge1xuICAgIHJldHVybiBuZXcgRGVidWdSZW5kZXJlcjIodGhpcy5kZWxlZ2F0ZS5jcmVhdGVSZW5kZXJlcihlbGVtZW50LCByZW5kZXJEYXRhKSk7XG4gIH1cblxuICBiZWdpbigpIHtcbiAgICBpZiAodGhpcy5kZWxlZ2F0ZS5iZWdpbikge1xuICAgICAgdGhpcy5kZWxlZ2F0ZS5iZWdpbigpO1xuICAgIH1cbiAgfVxuICBlbmQoKSB7XG4gICAgaWYgKHRoaXMuZGVsZWdhdGUuZW5kKSB7XG4gICAgICB0aGlzLmRlbGVnYXRlLmVuZCgpO1xuICAgIH1cbiAgfVxuXG4gIHdoZW5SZW5kZXJpbmdEb25lKCk6IFByb21pc2U8YW55PiB7XG4gICAgaWYgKHRoaXMuZGVsZWdhdGUud2hlblJlbmRlcmluZ0RvbmUpIHtcbiAgICAgIHJldHVybiB0aGlzLmRlbGVnYXRlLndoZW5SZW5kZXJpbmdEb25lKCk7XG4gICAgfVxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobnVsbCk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIERlYnVnUmVuZGVyZXIyIGltcGxlbWVudHMgUmVuZGVyZXIyIHtcbiAgcmVhZG9ubHkgZGF0YToge1trZXk6IHN0cmluZ106IGFueX07XG5cbiAgcHJpdmF0ZSBjcmVhdGVEZWJ1Z0NvbnRleHQobmF0aXZlRWxlbWVudDogYW55KSB7IHJldHVybiB0aGlzLmRlYnVnQ29udGV4dEZhY3RvcnkobmF0aXZlRWxlbWVudCk7IH1cblxuICAvKipcbiAgICogRmFjdG9yeSBmdW5jdGlvbiB1c2VkIHRvIGNyZWF0ZSBhIGBEZWJ1Z0NvbnRleHRgIHdoZW4gYSBub2RlIGlzIGNyZWF0ZWQuXG4gICAqXG4gICAqIFRoZSBgRGVidWdDb250ZXh0YCBhbGxvd3MgdG8gcmV0cmlldmUgaW5mb3JtYXRpb24gYWJvdXQgdGhlIG5vZGVzIHRoYXQgYXJlIHVzZWZ1bCBpbiB0ZXN0cy5cbiAgICpcbiAgICogVGhlIGZhY3RvcnkgaXMgY29uZmlndXJhYmxlIHNvIHRoYXQgdGhlIGBEZWJ1Z1JlbmRlcmVyMmAgY291bGQgaW5zdGFudGlhdGUgZWl0aGVyIGEgVmlldyBFbmdpbmVcbiAgICogb3IgYSBSZW5kZXIgY29udGV4dC5cbiAgICovXG4gIGRlYnVnQ29udGV4dEZhY3Rvcnk6IChuYXRpdmVFbGVtZW50PzogYW55KSA9PiBEZWJ1Z0NvbnRleHQgfCBudWxsID0gZ2V0Q3VycmVudERlYnVnQ29udGV4dDtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGRlbGVnYXRlOiBSZW5kZXJlcjIpIHsgdGhpcy5kYXRhID0gdGhpcy5kZWxlZ2F0ZS5kYXRhOyB9XG5cbiAgZGVzdHJveU5vZGUobm9kZTogYW55KSB7XG4gICAgcmVtb3ZlRGVidWdOb2RlRnJvbUluZGV4KGdldERlYnVnTm9kZShub2RlKSAhKTtcbiAgICBpZiAodGhpcy5kZWxlZ2F0ZS5kZXN0cm95Tm9kZSkge1xuICAgICAgdGhpcy5kZWxlZ2F0ZS5kZXN0cm95Tm9kZShub2RlKTtcbiAgICB9XG4gIH1cblxuICBkZXN0cm95KCkgeyB0aGlzLmRlbGVnYXRlLmRlc3Ryb3koKTsgfVxuXG4gIGNyZWF0ZUVsZW1lbnQobmFtZTogc3RyaW5nLCBuYW1lc3BhY2U/OiBzdHJpbmcpOiBhbnkge1xuICAgIGNvbnN0IGVsID0gdGhpcy5kZWxlZ2F0ZS5jcmVhdGVFbGVtZW50KG5hbWUsIG5hbWVzcGFjZSk7XG4gICAgY29uc3QgZGVidWdDdHggPSB0aGlzLmNyZWF0ZURlYnVnQ29udGV4dChlbCk7XG4gICAgaWYgKGRlYnVnQ3R4KSB7XG4gICAgICBjb25zdCBkZWJ1Z0VsID0gbmV3IERlYnVnRWxlbWVudF9fUFJFX1IzX18oZWwsIG51bGwsIGRlYnVnQ3R4KTtcbiAgICAgIChkZWJ1Z0VsIGFze25hbWU6IHN0cmluZ30pLm5hbWUgPSBuYW1lO1xuICAgICAgaW5kZXhEZWJ1Z05vZGUoZGVidWdFbCk7XG4gICAgfVxuICAgIHJldHVybiBlbDtcbiAgfVxuXG4gIGNyZWF0ZUNvbW1lbnQodmFsdWU6IHN0cmluZyk6IGFueSB7XG4gICAgY29uc3QgY29tbWVudCA9IHRoaXMuZGVsZWdhdGUuY3JlYXRlQ29tbWVudCh2YWx1ZSk7XG4gICAgY29uc3QgZGVidWdDdHggPSB0aGlzLmNyZWF0ZURlYnVnQ29udGV4dChjb21tZW50KTtcbiAgICBpZiAoZGVidWdDdHgpIHtcbiAgICAgIGluZGV4RGVidWdOb2RlKG5ldyBEZWJ1Z05vZGVfX1BSRV9SM19fKGNvbW1lbnQsIG51bGwsIGRlYnVnQ3R4KSk7XG4gICAgfVxuICAgIHJldHVybiBjb21tZW50O1xuICB9XG5cbiAgY3JlYXRlVGV4dCh2YWx1ZTogc3RyaW5nKTogYW55IHtcbiAgICBjb25zdCB0ZXh0ID0gdGhpcy5kZWxlZ2F0ZS5jcmVhdGVUZXh0KHZhbHVlKTtcbiAgICBjb25zdCBkZWJ1Z0N0eCA9IHRoaXMuY3JlYXRlRGVidWdDb250ZXh0KHRleHQpO1xuICAgIGlmIChkZWJ1Z0N0eCkge1xuICAgICAgaW5kZXhEZWJ1Z05vZGUobmV3IERlYnVnTm9kZV9fUFJFX1IzX18odGV4dCwgbnVsbCwgZGVidWdDdHgpKTtcbiAgICB9XG4gICAgcmV0dXJuIHRleHQ7XG4gIH1cblxuICBhcHBlbmRDaGlsZChwYXJlbnQ6IGFueSwgbmV3Q2hpbGQ6IGFueSk6IHZvaWQge1xuICAgIGNvbnN0IGRlYnVnRWwgPSBnZXREZWJ1Z05vZGUocGFyZW50KTtcbiAgICBjb25zdCBkZWJ1Z0NoaWxkRWwgPSBnZXREZWJ1Z05vZGUobmV3Q2hpbGQpO1xuICAgIGlmIChkZWJ1Z0VsICYmIGRlYnVnQ2hpbGRFbCAmJiBkZWJ1Z0VsIGluc3RhbmNlb2YgRGVidWdFbGVtZW50X19QUkVfUjNfXykge1xuICAgICAgZGVidWdFbC5hZGRDaGlsZChkZWJ1Z0NoaWxkRWwpO1xuICAgIH1cbiAgICB0aGlzLmRlbGVnYXRlLmFwcGVuZENoaWxkKHBhcmVudCwgbmV3Q2hpbGQpO1xuICB9XG5cbiAgaW5zZXJ0QmVmb3JlKHBhcmVudDogYW55LCBuZXdDaGlsZDogYW55LCByZWZDaGlsZDogYW55KTogdm9pZCB7XG4gICAgY29uc3QgZGVidWdFbCA9IGdldERlYnVnTm9kZShwYXJlbnQpO1xuICAgIGNvbnN0IGRlYnVnQ2hpbGRFbCA9IGdldERlYnVnTm9kZShuZXdDaGlsZCk7XG4gICAgY29uc3QgZGVidWdSZWZFbCA9IGdldERlYnVnTm9kZShyZWZDaGlsZCkgITtcbiAgICBpZiAoZGVidWdFbCAmJiBkZWJ1Z0NoaWxkRWwgJiYgZGVidWdFbCBpbnN0YW5jZW9mIERlYnVnRWxlbWVudF9fUFJFX1IzX18pIHtcbiAgICAgIGRlYnVnRWwuaW5zZXJ0QmVmb3JlKGRlYnVnUmVmRWwsIGRlYnVnQ2hpbGRFbCk7XG4gICAgfVxuXG4gICAgdGhpcy5kZWxlZ2F0ZS5pbnNlcnRCZWZvcmUocGFyZW50LCBuZXdDaGlsZCwgcmVmQ2hpbGQpO1xuICB9XG5cbiAgcmVtb3ZlQ2hpbGQocGFyZW50OiBhbnksIG9sZENoaWxkOiBhbnkpOiB2b2lkIHtcbiAgICBjb25zdCBkZWJ1Z0VsID0gZ2V0RGVidWdOb2RlKHBhcmVudCk7XG4gICAgY29uc3QgZGVidWdDaGlsZEVsID0gZ2V0RGVidWdOb2RlKG9sZENoaWxkKTtcbiAgICBpZiAoZGVidWdFbCAmJiBkZWJ1Z0NoaWxkRWwgJiYgZGVidWdFbCBpbnN0YW5jZW9mIERlYnVnRWxlbWVudF9fUFJFX1IzX18pIHtcbiAgICAgIGRlYnVnRWwucmVtb3ZlQ2hpbGQoZGVidWdDaGlsZEVsKTtcbiAgICB9XG4gICAgdGhpcy5kZWxlZ2F0ZS5yZW1vdmVDaGlsZChwYXJlbnQsIG9sZENoaWxkKTtcbiAgfVxuXG4gIHNlbGVjdFJvb3RFbGVtZW50KHNlbGVjdG9yT3JOb2RlOiBzdHJpbmd8YW55LCBwcmVzZXJ2ZUNvbnRlbnQ/OiBib29sZWFuKTogYW55IHtcbiAgICBjb25zdCBlbCA9IHRoaXMuZGVsZWdhdGUuc2VsZWN0Um9vdEVsZW1lbnQoc2VsZWN0b3JPck5vZGUsIHByZXNlcnZlQ29udGVudCk7XG4gICAgY29uc3QgZGVidWdDdHggPSBnZXRDdXJyZW50RGVidWdDb250ZXh0KCk7XG4gICAgaWYgKGRlYnVnQ3R4KSB7XG4gICAgICBpbmRleERlYnVnTm9kZShuZXcgRGVidWdFbGVtZW50X19QUkVfUjNfXyhlbCwgbnVsbCwgZGVidWdDdHgpKTtcbiAgICB9XG4gICAgcmV0dXJuIGVsO1xuICB9XG5cbiAgc2V0QXR0cmlidXRlKGVsOiBhbnksIG5hbWU6IHN0cmluZywgdmFsdWU6IHN0cmluZywgbmFtZXNwYWNlPzogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3QgZGVidWdFbCA9IGdldERlYnVnTm9kZShlbCk7XG4gICAgaWYgKGRlYnVnRWwgJiYgZGVidWdFbCBpbnN0YW5jZW9mIERlYnVnRWxlbWVudF9fUFJFX1IzX18pIHtcbiAgICAgIGNvbnN0IGZ1bGxOYW1lID0gbmFtZXNwYWNlID8gbmFtZXNwYWNlICsgJzonICsgbmFtZSA6IG5hbWU7XG4gICAgICBkZWJ1Z0VsLmF0dHJpYnV0ZXNbZnVsbE5hbWVdID0gdmFsdWU7XG4gICAgfVxuICAgIHRoaXMuZGVsZWdhdGUuc2V0QXR0cmlidXRlKGVsLCBuYW1lLCB2YWx1ZSwgbmFtZXNwYWNlKTtcbiAgfVxuXG4gIHJlbW92ZUF0dHJpYnV0ZShlbDogYW55LCBuYW1lOiBzdHJpbmcsIG5hbWVzcGFjZT86IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IGRlYnVnRWwgPSBnZXREZWJ1Z05vZGUoZWwpO1xuICAgIGlmIChkZWJ1Z0VsICYmIGRlYnVnRWwgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fKSB7XG4gICAgICBjb25zdCBmdWxsTmFtZSA9IG5hbWVzcGFjZSA/IG5hbWVzcGFjZSArICc6JyArIG5hbWUgOiBuYW1lO1xuICAgICAgZGVidWdFbC5hdHRyaWJ1dGVzW2Z1bGxOYW1lXSA9IG51bGw7XG4gICAgfVxuICAgIHRoaXMuZGVsZWdhdGUucmVtb3ZlQXR0cmlidXRlKGVsLCBuYW1lLCBuYW1lc3BhY2UpO1xuICB9XG5cbiAgYWRkQ2xhc3MoZWw6IGFueSwgbmFtZTogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3QgZGVidWdFbCA9IGdldERlYnVnTm9kZShlbCk7XG4gICAgaWYgKGRlYnVnRWwgJiYgZGVidWdFbCBpbnN0YW5jZW9mIERlYnVnRWxlbWVudF9fUFJFX1IzX18pIHtcbiAgICAgIGRlYnVnRWwuY2xhc3Nlc1tuYW1lXSA9IHRydWU7XG4gICAgfVxuICAgIHRoaXMuZGVsZWdhdGUuYWRkQ2xhc3MoZWwsIG5hbWUpO1xuICB9XG5cbiAgcmVtb3ZlQ2xhc3MoZWw6IGFueSwgbmFtZTogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3QgZGVidWdFbCA9IGdldERlYnVnTm9kZShlbCk7XG4gICAgaWYgKGRlYnVnRWwgJiYgZGVidWdFbCBpbnN0YW5jZW9mIERlYnVnRWxlbWVudF9fUFJFX1IzX18pIHtcbiAgICAgIGRlYnVnRWwuY2xhc3Nlc1tuYW1lXSA9IGZhbHNlO1xuICAgIH1cbiAgICB0aGlzLmRlbGVnYXRlLnJlbW92ZUNsYXNzKGVsLCBuYW1lKTtcbiAgfVxuXG4gIHNldFN0eWxlKGVsOiBhbnksIHN0eWxlOiBzdHJpbmcsIHZhbHVlOiBhbnksIGZsYWdzOiBSZW5kZXJlclN0eWxlRmxhZ3MyKTogdm9pZCB7XG4gICAgY29uc3QgZGVidWdFbCA9IGdldERlYnVnTm9kZShlbCk7XG4gICAgaWYgKGRlYnVnRWwgJiYgZGVidWdFbCBpbnN0YW5jZW9mIERlYnVnRWxlbWVudF9fUFJFX1IzX18pIHtcbiAgICAgIGRlYnVnRWwuc3R5bGVzW3N0eWxlXSA9IHZhbHVlO1xuICAgIH1cbiAgICB0aGlzLmRlbGVnYXRlLnNldFN0eWxlKGVsLCBzdHlsZSwgdmFsdWUsIGZsYWdzKTtcbiAgfVxuXG4gIHJlbW92ZVN0eWxlKGVsOiBhbnksIHN0eWxlOiBzdHJpbmcsIGZsYWdzOiBSZW5kZXJlclN0eWxlRmxhZ3MyKTogdm9pZCB7XG4gICAgY29uc3QgZGVidWdFbCA9IGdldERlYnVnTm9kZShlbCk7XG4gICAgaWYgKGRlYnVnRWwgJiYgZGVidWdFbCBpbnN0YW5jZW9mIERlYnVnRWxlbWVudF9fUFJFX1IzX18pIHtcbiAgICAgIGRlYnVnRWwuc3R5bGVzW3N0eWxlXSA9IG51bGw7XG4gICAgfVxuICAgIHRoaXMuZGVsZWdhdGUucmVtb3ZlU3R5bGUoZWwsIHN0eWxlLCBmbGFncyk7XG4gIH1cblxuICBzZXRQcm9wZXJ0eShlbDogYW55LCBuYW1lOiBzdHJpbmcsIHZhbHVlOiBhbnkpOiB2b2lkIHtcbiAgICBjb25zdCBkZWJ1Z0VsID0gZ2V0RGVidWdOb2RlKGVsKTtcbiAgICBpZiAoZGVidWdFbCAmJiBkZWJ1Z0VsIGluc3RhbmNlb2YgRGVidWdFbGVtZW50X19QUkVfUjNfXykge1xuICAgICAgZGVidWdFbC5wcm9wZXJ0aWVzW25hbWVdID0gdmFsdWU7XG4gICAgfVxuICAgIHRoaXMuZGVsZWdhdGUuc2V0UHJvcGVydHkoZWwsIG5hbWUsIHZhbHVlKTtcbiAgfVxuXG4gIGxpc3RlbihcbiAgICAgIHRhcmdldDogJ2RvY3VtZW50J3wnd2luZG93cyd8J2JvZHknfGFueSwgZXZlbnROYW1lOiBzdHJpbmcsXG4gICAgICBjYWxsYmFjazogKGV2ZW50OiBhbnkpID0+IGJvb2xlYW4pOiAoKSA9PiB2b2lkIHtcbiAgICBpZiAodHlwZW9mIHRhcmdldCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIGNvbnN0IGRlYnVnRWwgPSBnZXREZWJ1Z05vZGUodGFyZ2V0KTtcbiAgICAgIGlmIChkZWJ1Z0VsKSB7XG4gICAgICAgIGRlYnVnRWwubGlzdGVuZXJzLnB1c2gobmV3IEV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCBjYWxsYmFjaykpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmRlbGVnYXRlLmxpc3Rlbih0YXJnZXQsIGV2ZW50TmFtZSwgY2FsbGJhY2spO1xuICB9XG5cbiAgcGFyZW50Tm9kZShub2RlOiBhbnkpOiBhbnkgeyByZXR1cm4gdGhpcy5kZWxlZ2F0ZS5wYXJlbnROb2RlKG5vZGUpOyB9XG4gIG5leHRTaWJsaW5nKG5vZGU6IGFueSk6IGFueSB7IHJldHVybiB0aGlzLmRlbGVnYXRlLm5leHRTaWJsaW5nKG5vZGUpOyB9XG4gIHNldFZhbHVlKG5vZGU6IGFueSwgdmFsdWU6IHN0cmluZyk6IHZvaWQgeyByZXR1cm4gdGhpcy5kZWxlZ2F0ZS5zZXRWYWx1ZShub2RlLCB2YWx1ZSk7IH1cbn1cbiJdfQ==