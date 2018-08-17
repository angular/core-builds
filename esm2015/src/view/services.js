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
    if (typeof override.token === 'function' && override.token.ngInjectableDef &&
        typeof override.token.ngInjectableDef.providedIn === 'function') {
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
                if (token.ngInjectableDef.providedIn === module) {
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
                if (moduleSet.has(token.ngInjectableDef.providedIn)) {
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
     * @return {?}
     */
    selectRootElement(selectorOrNode) {
        /** @type {?} */
        const el = this.delegate.selectRootElement(selectorOrNode);
        /** @type {?} */
        const debugCtx = this.debugContext;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmljZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy92aWV3L3NlcnZpY2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLFlBQVksRUFBRSxTQUFTLEVBQUUsYUFBYSxFQUFFLFlBQVksRUFBRSxjQUFjLEVBQUUsd0JBQXdCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUduSSxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDOUMsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBR3pDLE9BQU8sRUFBWSxnQkFBZ0IsRUFBcUMsTUFBTSxlQUFlLENBQUM7QUFDOUYsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBRW5ELE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFFdEMsT0FBTyxFQUFDLGdCQUFnQixFQUFFLGtCQUFrQixFQUFFLHFCQUFxQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3JGLE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFDdEMsT0FBTyxFQUFDLGtCQUFrQixFQUFFLGFBQWEsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUMxRCxPQUFPLEVBQUMsY0FBYyxFQUFFLGlCQUFpQixFQUFFLGlDQUFpQyxFQUFDLE1BQU0sUUFBUSxDQUFDO0FBQzVGLE9BQU8sRUFBbUosUUFBUSxFQUF1QyxhQUFhLEVBQUUsb0JBQW9CLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFDN1AsT0FBTyxFQUFDLElBQUksRUFBRSxlQUFlLEVBQUUsVUFBVSxFQUFFLGlCQUFpQixFQUFFLFlBQVksRUFBRSxZQUFZLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFDeEcsT0FBTyxFQUFDLGtCQUFrQixFQUFFLGtCQUFrQixFQUFFLGtCQUFrQixFQUFFLGtCQUFrQixFQUFFLG1CQUFtQixFQUFFLGtCQUFrQixFQUFFLGNBQWMsRUFBRSxXQUFXLEVBQUMsTUFBTSxRQUFRLENBQUM7O0FBRzVLLElBQUksV0FBVyxHQUFHLEtBQUssQ0FBQzs7OztBQUV4QixNQUFNO0lBQ0osSUFBSSxXQUFXLEVBQUU7UUFDZixPQUFPO0tBQ1I7SUFDRCxXQUFXLEdBQUcsSUFBSSxDQUFDOztJQUNuQixNQUFNLFFBQVEsR0FBRyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxDQUFDLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztJQUM1RSxRQUFRLENBQUMsY0FBYyxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUM7SUFDbEQsUUFBUSxDQUFDLGNBQWMsR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDO0lBQ2xELFFBQVEsQ0FBQyxrQkFBa0IsR0FBRyxRQUFRLENBQUMsa0JBQWtCLENBQUM7SUFDMUQsUUFBUSxDQUFDLG1CQUFtQixHQUFHLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQztJQUM1RCxRQUFRLENBQUMsaUJBQWlCLEdBQUcsUUFBUSxDQUFDLGlCQUFpQixDQUFDO0lBQ3hELFFBQVEsQ0FBQyxnQkFBZ0IsR0FBRyxRQUFRLENBQUMsZ0JBQWdCLENBQUM7SUFDdEQsUUFBUSxDQUFDLHFCQUFxQixHQUFHLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBQztJQUNoRSxRQUFRLENBQUMsY0FBYyxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUM7SUFDbEQsUUFBUSxDQUFDLGtCQUFrQixHQUFHLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQztJQUMxRCxRQUFRLENBQUMsa0JBQWtCLEdBQUcsUUFBUSxDQUFDLGtCQUFrQixDQUFDO0lBQzFELFFBQVEsQ0FBQyxXQUFXLEdBQUcsUUFBUSxDQUFDLFdBQVcsQ0FBQztJQUM1QyxRQUFRLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQztJQUNqQyxRQUFRLENBQUMsa0JBQWtCLEdBQUcsUUFBUSxDQUFDLGtCQUFrQixDQUFDO0lBQzFELFFBQVEsQ0FBQyxXQUFXLEdBQUcsUUFBUSxDQUFDLFdBQVcsQ0FBQztJQUM1QyxRQUFRLENBQUMsZ0JBQWdCLEdBQUcsUUFBUSxDQUFDLGdCQUFnQixDQUFDO0lBQ3RELFFBQVEsQ0FBQyxjQUFjLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQztJQUNsRCxRQUFRLENBQUMsa0JBQWtCLEdBQUcsa0JBQWtCLENBQUM7Q0FDbEQ7Ozs7QUFFRDtJQUNFLE9BQU87UUFDTCxjQUFjLEVBQUUsR0FBRyxFQUFFLElBQUc7UUFDeEIsY0FBYyxFQUFFLGtCQUFrQjtRQUNsQyxrQkFBa0IsRUFBRSxrQkFBa0I7UUFDdEMsbUJBQW1CLEVBQUUsbUJBQW1CO1FBQ3hDLGlCQUFpQixFQUFFLGlCQUFpQjtRQUNwQyxnQkFBZ0IsRUFBRSxJQUFJO1FBQ3RCLHFCQUFxQixFQUFFLElBQUk7UUFDM0IsY0FBYyxFQUFFLElBQUk7UUFDcEIsa0JBQWtCLEVBQUUsa0JBQWtCO1FBQ3RDLGtCQUFrQixFQUFFLGtCQUFrQjtRQUN0QyxXQUFXLEVBQUUsV0FBVztRQUN4QixrQkFBa0IsRUFBRSxDQUFDLElBQWMsRUFBRSxTQUFpQixFQUFFLEVBQUUsQ0FBQyxJQUFJLGFBQWEsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDO1FBQzdGLFdBQVcsRUFBRSxDQUFDLElBQWMsRUFBRSxTQUFpQixFQUFFLFNBQWlCLEVBQUUsS0FBVSxFQUFFLEVBQUUsQ0FDakUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsS0FBSyxDQUFDO1FBQ3hFLGdCQUFnQixFQUFFLENBQUMsSUFBYyxFQUFFLFNBQW9CLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQy9ELFNBQVMsMkJBQTZCLENBQUMsQ0FBQyxDQUFDLHNCQUFzQixDQUFDLENBQUM7WUFDeEIsc0JBQXNCLEVBQy9ELElBQUksQ0FBQztRQUMzQixjQUFjLEVBQUUsQ0FBQyxJQUFjLEVBQUUsU0FBb0IsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQzdELFNBQVMsMkJBQTZCLENBQUMsQ0FBQyxDQUFDLHNCQUFzQixDQUFDLENBQUM7WUFDeEIsc0JBQXNCLEVBQy9ELElBQUksQ0FBQztLQUMxQixDQUFDO0NBQ0g7Ozs7QUFFRDtJQUNFLE9BQU87UUFDTCxjQUFjLEVBQUUsbUJBQW1CO1FBQ25DLGNBQWMsRUFBRSxtQkFBbUI7UUFDbkMsa0JBQWtCLEVBQUUsdUJBQXVCO1FBQzNDLG1CQUFtQixFQUFFLHdCQUF3QjtRQUM3QyxpQkFBaUIsRUFBRSxzQkFBc0I7UUFDekMsZ0JBQWdCLEVBQUUscUJBQXFCO1FBQ3ZDLHFCQUFxQixFQUFFLDBCQUEwQjtRQUNqRCxjQUFjLEVBQUUsbUJBQW1CO1FBQ25DLGtCQUFrQixFQUFFLHVCQUF1QjtRQUMzQyxrQkFBa0IsRUFBRSx1QkFBdUI7UUFDM0MsV0FBVyxFQUFFLGdCQUFnQjtRQUM3QixrQkFBa0IsRUFBRSxDQUFDLElBQWMsRUFBRSxTQUFpQixFQUFFLEVBQUUsQ0FBQyxJQUFJLGFBQWEsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDO1FBQzdGLFdBQVcsRUFBRSxnQkFBZ0I7UUFDN0IsZ0JBQWdCLEVBQUUscUJBQXFCO1FBQ3ZDLGNBQWMsRUFBRSxtQkFBbUI7S0FDcEMsQ0FBQztDQUNIOzs7Ozs7Ozs7O0FBRUQsNEJBQ0ksVUFBb0IsRUFBRSxnQkFBeUIsRUFBRSxrQkFBZ0MsRUFDakYsR0FBbUIsRUFBRSxRQUEwQixFQUFFLE9BQWE7O0lBQ2hFLE1BQU0sZUFBZSxHQUFxQixRQUFRLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0lBQ2xGLE9BQU8sY0FBYyxDQUNqQixjQUFjLENBQUMsVUFBVSxFQUFFLFFBQVEsRUFBRSxlQUFlLEVBQUUsZ0JBQWdCLEVBQUUsa0JBQWtCLENBQUMsRUFDM0YsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0NBQ25COzs7Ozs7Ozs7O0FBRUQsNkJBQ0ksVUFBb0IsRUFBRSxnQkFBeUIsRUFBRSxrQkFBZ0MsRUFDakYsR0FBbUIsRUFBRSxRQUEwQixFQUFFLE9BQWE7O0lBQ2hFLE1BQU0sZUFBZSxHQUFxQixRQUFRLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDOztJQUNsRixNQUFNLElBQUksR0FBRyxjQUFjLENBQ3ZCLFVBQVUsRUFBRSxRQUFRLEVBQUUsSUFBSSxxQkFBcUIsQ0FBQyxlQUFlLENBQUMsRUFBRSxnQkFBZ0IsRUFDbEYsa0JBQWtCLENBQUMsQ0FBQzs7SUFDeEIsTUFBTSxlQUFlLEdBQUcsNEJBQTRCLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDMUQsT0FBTyxvQkFBb0IsQ0FDdkIsV0FBVyxDQUFDLE1BQU0sRUFBRSxjQUFjLEVBQUUsSUFBSSxFQUFFLENBQUMsSUFBSSxFQUFFLGVBQWUsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO0NBQ2pGOzs7Ozs7Ozs7QUFFRCx3QkFDSSxVQUFvQixFQUFFLFFBQTBCLEVBQUUsZUFBaUMsRUFDbkYsZ0JBQXlCLEVBQUUsa0JBQXVCOztJQUNwRCxNQUFNLFNBQVMsR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQzs7SUFDbkQsTUFBTSxZQUFZLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUM7O0lBQ3pELE1BQU0sUUFBUSxHQUFHLGVBQWUsQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzVELE9BQU87UUFDTCxRQUFRO1FBQ1IsUUFBUSxFQUFFLFVBQVUsRUFBRSxnQkFBZ0I7UUFDdEMsY0FBYyxFQUFFLGtCQUFrQixFQUFFLFNBQVMsRUFBRSxlQUFlLEVBQUUsUUFBUSxFQUFFLFlBQVk7S0FDdkYsQ0FBQztDQUNIOzs7Ozs7OztBQUVELGlDQUNJLFVBQW9CLEVBQUUsU0FBa0IsRUFBRSxPQUF1QixFQUFFLE9BQWE7O0lBQ2xGLE1BQU0sZUFBZSxHQUFHLDRCQUE0QixDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzlELE9BQU8sb0JBQW9CLENBQ3ZCLFdBQVcsQ0FBQyxNQUFNLEVBQUUsa0JBQWtCLEVBQUUsSUFBSSxFQUM1QyxDQUFDLFVBQVUsRUFBRSxTQUFTLEVBQUUsZUFBZSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7Q0FDeEQ7Ozs7Ozs7O0FBRUQsa0NBQ0ksVUFBb0IsRUFBRSxPQUFnQixFQUFFLE9BQXVCLEVBQUUsV0FBZ0I7O0lBQ25GLE1BQU0scUJBQXFCLEdBQ3ZCLGdCQUFnQixDQUFDLEdBQUcsMERBQUMsT0FBTyxDQUFDLE9BQU8sR0FBRyxpQkFBaUIsR0FBRyxRQUFRLEdBQUcsS0FBSyxDQUFDLENBQUM7SUFDakYsSUFBSSxxQkFBcUIsRUFBRTtRQUN6QixPQUFPLEdBQUcscUJBQXFCLENBQUM7S0FDakM7U0FBTTtRQUNMLE9BQU8sR0FBRyw0QkFBNEIsQ0FBQyxPQUFPLENBQUMsQ0FBQztLQUNqRDtJQUNELE9BQU8sb0JBQW9CLENBQ3ZCLFdBQVcsQ0FBQyxNQUFNLEVBQUUsbUJBQW1CLEVBQUUsSUFBSSxFQUFFLENBQUMsVUFBVSxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQztDQUNqRzs7Ozs7Ozs7QUFFRCxnQ0FDSSxVQUFxQixFQUFFLGNBQXdCLEVBQUUsbUJBQWdDLEVBQ2pGLEdBQXVCOztJQUN6QixNQUFNLGVBQWUsR0FBRyxnQ0FBZ0MsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUM5RCxPQUFPLGlCQUFpQixDQUFDLFVBQVUsRUFBRSxjQUFjLEVBQUUsbUJBQW1CLEVBQUUsZUFBZSxDQUFDLENBQUM7Q0FDNUY7O0FBRUQsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLEdBQUcsRUFBeUIsQ0FBQzs7QUFDM0QsTUFBTSwwQkFBMEIsR0FBRyxJQUFJLEdBQUcsRUFBeUMsQ0FBQzs7QUFDcEYsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLEdBQUcsRUFBdUIsQ0FBQzs7Ozs7QUFFeEQsK0JBQStCLFFBQTBCO0lBQ3ZELGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQ2hELElBQUksT0FBTyxRQUFRLENBQUMsS0FBSyxLQUFLLFVBQVUsSUFBSSxRQUFRLENBQUMsS0FBSyxDQUFDLGVBQWU7UUFDdEUsT0FBTyxRQUFRLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxVQUFVLEtBQUssVUFBVSxFQUFFO1FBQ25FLDBCQUEwQixDQUFDLEdBQUcsbUJBQUMsUUFBUSxDQUFDLEtBQTRCLEdBQUUsUUFBUSxDQUFDLENBQUM7S0FDakY7Q0FDRjs7Ozs7O0FBRUQsb0NBQW9DLElBQVMsRUFBRSxXQUFrQzs7SUFDL0UsTUFBTSxXQUFXLEdBQUcsaUJBQWlCLENBQUMsaUNBQWlDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQzs7SUFDdEYsTUFBTSxXQUFXLEdBQUcsaUJBQWlCLHVDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxHQUFHLGFBQWEsR0FBRyxDQUFDO0lBQ3RGLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsV0FBVyxDQUFDLENBQUM7Q0FDekM7Ozs7QUFFRDtJQUNFLGlCQUFpQixDQUFDLEtBQUssRUFBRSxDQUFDO0lBQzFCLDBCQUEwQixDQUFDLEtBQUssRUFBRSxDQUFDO0lBQ25DLGdCQUFnQixDQUFDLEtBQUssRUFBRSxDQUFDO0NBQzFCOzs7OztBQVFELHNDQUFzQyxHQUFtQjtJQUN2RCxJQUFJLGlCQUFpQixDQUFDLElBQUksS0FBSyxDQUFDLEVBQUU7UUFDaEMsT0FBTyxHQUFHLENBQUM7S0FDWjs7SUFDRCxNQUFNLHNDQUFzQyxHQUFHLDBDQUEwQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQy9GLElBQUksc0NBQXNDLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtRQUN2RCxPQUFPLEdBQUcsQ0FBQztLQUNaOzs7SUFHRCxHQUFHLHNCQUFHLEdBQUcsQ0FBQyxPQUFPLEdBQUcsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDaEMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLHNDQUFzQyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUN0RSwrQkFBK0IsQ0FBQyxHQUFHLEVBQUUsc0NBQXNDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUNqRjtJQUNELE9BQU8sR0FBRyxDQUFDOzs7OztJQUVYLG9EQUFvRCxHQUFtQjs7UUFDckUsTUFBTSxpQ0FBaUMsR0FBYSxFQUFFLENBQUM7O1FBQ3ZELElBQUksY0FBYyxHQUFpQixJQUFJLENBQUM7UUFDeEMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFOztZQUN6QyxNQUFNLE9BQU8sR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzdCLElBQUksT0FBTyxDQUFDLEtBQUssc0JBQXdCLEVBQUU7Z0JBQ3pDLGNBQWMsR0FBRyxPQUFPLENBQUM7YUFDMUI7WUFDRCxJQUFJLGNBQWMsSUFBSSxPQUFPLENBQUMsS0FBSyxvQ0FBbUM7Z0JBQ2xFLGlCQUFpQixDQUFDLEdBQUcsb0JBQUMsT0FBTyxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUMsRUFBRTtnQkFDbkQsaUNBQWlDLENBQUMsSUFBSSxvQkFBQyxjQUFjLEdBQUcsU0FBUyxDQUFDLENBQUM7Z0JBQ25FLGNBQWMsR0FBRyxJQUFJLENBQUM7YUFDdkI7U0FDRjtRQUNELE9BQU8saUNBQWlDLENBQUM7S0FDMUM7Ozs7OztJQUVELHlDQUF5QyxPQUF1QixFQUFFLE9BQWU7UUFDL0UsS0FBSyxJQUFJLENBQUMsR0FBRyxPQUFPLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTs7WUFDdkQsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNqQyxJQUFJLE9BQU8sQ0FBQyxLQUFLLHNCQUF3QixFQUFFOztnQkFFekMsT0FBTzthQUNSO1lBQ0QsSUFBSSxPQUFPLENBQUMsS0FBSyxvQ0FBbUMsRUFBRTs7Z0JBQ3BELE1BQU0sUUFBUSxzQkFBRyxPQUFPLENBQUMsUUFBUSxHQUFHOztnQkFDcEMsTUFBTSxRQUFRLEdBQUcsaUJBQWlCLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDdkQsSUFBSSxRQUFRLEVBQUU7b0JBQ1osT0FBTyxDQUFDLEtBQUssR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEdBQUcsa0NBQWlDLENBQUMsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDO29CQUNyRixRQUFRLENBQUMsSUFBSSxHQUFHLFlBQVksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQzVDLFFBQVEsQ0FBQyxLQUFLLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQztpQkFDakM7YUFDRjtTQUNGO0tBQ0Y7Q0FDRjs7Ozs7QUFLRCwwQ0FBMEMsR0FBdUI7SUFDL0QsTUFBTSxFQUFDLFlBQVksRUFBRSxzQkFBc0IsRUFBQyxHQUFHLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3JFLElBQUksQ0FBQyxZQUFZLEVBQUU7UUFDakIsT0FBTyxHQUFHLENBQUM7S0FDWjs7O0lBR0QsR0FBRyxzQkFBRyxHQUFHLENBQUMsT0FBTyxHQUFHLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2hDLHNCQUFzQixDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQzVCLE9BQU8sR0FBRyxDQUFDOzs7OztJQUVYLDBCQUEwQixHQUF1Qjs7UUFFL0MsSUFBSSxZQUFZLEdBQUcsS0FBSyxDQUFDOztRQUN6QixJQUFJLHNCQUFzQixHQUFHLEtBQUssQ0FBQztRQUNuQyxJQUFJLGlCQUFpQixDQUFDLElBQUksS0FBSyxDQUFDLEVBQUU7WUFDaEMsT0FBTyxFQUFDLFlBQVksRUFBRSxzQkFBc0IsRUFBQyxDQUFDO1NBQy9DO1FBQ0QsR0FBRyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUU7O1lBQzNCLE1BQU0sUUFBUSxHQUFHLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDbkQsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLG9DQUFtQyxDQUFDLElBQUksUUFBUSxFQUFFO2dCQUMvRCxZQUFZLEdBQUcsSUFBSSxDQUFDO2dCQUNwQixzQkFBc0IsR0FBRyxzQkFBc0IsSUFBSSxRQUFRLENBQUMsa0JBQWtCLENBQUM7YUFDaEY7U0FDRixDQUFDLENBQUM7UUFDSCxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRTtZQUMzQiwwQkFBMEIsQ0FBQyxPQUFPLENBQUMsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLEVBQUU7Z0JBQ3JELElBQUksS0FBSyxDQUFDLGVBQWUsQ0FBQyxVQUFVLEtBQUssTUFBTSxFQUFFO29CQUMvQyxZQUFZLEdBQUcsSUFBSSxDQUFDO29CQUNwQixzQkFBc0IsR0FBRyxzQkFBc0IsSUFBSSxRQUFRLENBQUMsa0JBQWtCLENBQUM7aUJBQ2hGO2FBQ0YsQ0FBQyxDQUFDO1NBQ0osQ0FBQyxDQUFDO1FBQ0gsT0FBTyxFQUFDLFlBQVksRUFBRSxzQkFBc0IsRUFBQyxDQUFDO0tBQy9DOzs7OztJQUVELGdDQUFnQyxHQUF1QjtRQUNyRCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7O1lBQzdDLE1BQU0sUUFBUSxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbEMsSUFBSSxzQkFBc0IsRUFBRTs7OztnQkFJMUIsUUFBUSxDQUFDLEtBQUssMkJBQTBCLENBQUM7YUFDMUM7O1lBQ0QsTUFBTSxRQUFRLEdBQUcsaUJBQWlCLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN2RCxJQUFJLFFBQVEsRUFBRTtnQkFDWixRQUFRLENBQUMsS0FBSyxHQUFHLENBQUMsUUFBUSxDQUFDLEtBQUssR0FBRyxrQ0FBaUMsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUM7Z0JBQ3ZGLFFBQVEsQ0FBQyxJQUFJLEdBQUcsWUFBWSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDNUMsUUFBUSxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDO2FBQ2pDO1NBQ0Y7UUFDRCxJQUFJLDBCQUEwQixDQUFDLElBQUksR0FBRyxDQUFDLEVBQUU7O1lBQ3ZDLElBQUksU0FBUyxHQUFHLElBQUksR0FBRyxDQUFNLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUMxQywwQkFBMEIsQ0FBQyxPQUFPLENBQUMsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLEVBQUU7Z0JBQ3JELElBQUksU0FBUyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxFQUFFOztvQkFDbkQsSUFBSSxRQUFRLEdBQUc7d0JBQ2IsS0FBSyxFQUFFLEtBQUs7d0JBQ1osS0FBSyxFQUNELFFBQVEsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLHlCQUF3QixDQUFDLGFBQWUsQ0FBQzt3QkFDdkYsSUFBSSxFQUFFLFlBQVksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDO3dCQUNqQyxLQUFLLEVBQUUsUUFBUSxDQUFDLEtBQUs7d0JBQ3JCLEtBQUssRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLE1BQU07cUJBQzVCLENBQUM7b0JBQ0YsR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7b0JBQzdCLEdBQUcsQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsUUFBUSxDQUFDO2lCQUNoRDthQUNGLENBQUMsQ0FBQztTQUNKO0tBQ0Y7Q0FDRjs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFRCxnQ0FDSSxJQUFjLEVBQUUsVUFBa0IsRUFBRSxRQUFzQixFQUFFLEVBQVEsRUFBRSxFQUFRLEVBQUUsRUFBUSxFQUN4RixFQUFRLEVBQUUsRUFBUSxFQUFFLEVBQVEsRUFBRSxFQUFRLEVBQUUsRUFBUSxFQUFFLEVBQVEsRUFBRSxFQUFROztJQUN0RSxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUMzQyxrQkFBa0IsQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUNwRixPQUFPLENBQUMsT0FBTyxDQUFDLEtBQUssOEJBQThCLENBQUMsQ0FBQyxDQUFDO1FBQ2xELG9CQUFvQixDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUM5QyxTQUFTLENBQUM7Q0FDZjs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFRCxnQ0FDSSxJQUFjLEVBQUUsVUFBa0IsRUFBRSxRQUFzQixFQUFFLEVBQVEsRUFBRSxFQUFRLEVBQUUsRUFBUSxFQUN4RixFQUFRLEVBQUUsRUFBUSxFQUFFLEVBQVEsRUFBRSxFQUFRLEVBQUUsRUFBUSxFQUFFLEVBQVEsRUFBRSxFQUFROztJQUN0RSxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUMzQyxrQkFBa0IsQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUNwRixPQUFPLENBQUMsT0FBTyxDQUFDLEtBQUssOEJBQThCLENBQUMsQ0FBQyxDQUFDO1FBQ2xELG9CQUFvQixDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUM5QyxTQUFTLENBQUM7Q0FDZjs7Ozs7QUFFRCxpQ0FBaUMsSUFBYztJQUM3QyxPQUFPLG9CQUFvQixDQUFDLFdBQVcsQ0FBQyxhQUFhLEVBQUUsa0JBQWtCLEVBQUUsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztDQUMxRjs7Ozs7QUFFRCxpQ0FBaUMsSUFBYztJQUM3QyxPQUFPLG9CQUFvQixDQUFDLFdBQVcsQ0FBQyxjQUFjLEVBQUUsa0JBQWtCLEVBQUUsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztDQUMzRjs7Ozs7QUFFRCwwQkFBMEIsSUFBYztJQUN0QyxPQUFPLG9CQUFvQixDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7Q0FDN0U7OztJQUdDLFNBQU07SUFDTixnQkFBYTtJQUNiLGlCQUFjO0lBQ2QsVUFBTztJQUNQLGNBQVc7O3dCQUpYLE1BQU07d0JBQ04sYUFBYTt3QkFDYixjQUFjO3dCQUNkLE9BQU87d0JBQ1AsV0FBVzs7QUFHYixJQUFJLGNBQWMsQ0FBYzs7QUFDaEMsSUFBSSxZQUFZLENBQVc7O0FBQzNCLElBQUksaUJBQWlCLENBQWM7Ozs7OztBQUVuQyw2QkFBNkIsSUFBYyxFQUFFLFNBQXdCO0lBQ25FLFlBQVksR0FBRyxJQUFJLENBQUM7SUFDcEIsaUJBQWlCLEdBQUcsU0FBUyxDQUFDO0NBQy9COzs7Ozs7OztBQUVELDBCQUEwQixJQUFjLEVBQUUsU0FBaUIsRUFBRSxTQUFpQixFQUFFLEtBQVU7SUFDeEYsbUJBQW1CLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQ3JDLE9BQU8sb0JBQW9CLENBQ3ZCLFdBQVcsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsSUFBSSxFQUFFLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztDQUMvRjs7Ozs7O0FBRUQsK0JBQStCLElBQWMsRUFBRSxTQUFvQjtJQUNqRSxJQUFJLElBQUksQ0FBQyxLQUFLLHNCQUFzQixFQUFFO1FBQ3BDLE1BQU0sa0JBQWtCLENBQUMsV0FBVyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7S0FDdkQ7SUFDRCxtQkFBbUIsQ0FBQyxJQUFJLEVBQUUsd0JBQXdCLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDN0QsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLHNCQUFzQixFQUFFLElBQUksQ0FBQyxDQUFDOzs7Ozs7OztJQUUvRCxnQ0FDSSxJQUFjLEVBQUUsU0FBaUIsRUFBRSxRQUFzQixFQUFFLEdBQUcsTUFBYTs7UUFDN0UsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDMUMsSUFBSSxTQUFTLDJCQUE2QixFQUFFO1lBQzFDLHVCQUF1QixDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1NBQzFEO2FBQU07WUFDTCx1QkFBdUIsQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQztTQUMxRDtRQUNELElBQUksT0FBTyxDQUFDLEtBQUssNEJBQTBCLEVBQUU7WUFDM0MsbUJBQW1CLENBQUMsSUFBSSxFQUFFLHdCQUF3QixDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDO1NBQ3RFO1FBQ0QsT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLDhCQUE4QixDQUFDLENBQUMsQ0FBQztZQUNsRCxvQkFBb0IsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3JELFNBQVMsQ0FBQztLQUNmO0NBQ0Y7Ozs7OztBQUVELDZCQUE2QixJQUFjLEVBQUUsU0FBb0I7SUFDL0QsSUFBSSxJQUFJLENBQUMsS0FBSyxzQkFBc0IsRUFBRTtRQUNwQyxNQUFNLGtCQUFrQixDQUFDLFdBQVcsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO0tBQ3ZEO0lBQ0QsbUJBQW1CLENBQUMsSUFBSSxFQUFFLHlCQUF5QixDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzlELE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsc0JBQXNCLEVBQUUsSUFBSSxDQUFDLENBQUM7Ozs7Ozs7O0lBRTdELGdDQUNJLElBQWMsRUFBRSxTQUFpQixFQUFFLFFBQXNCLEVBQUUsR0FBRyxNQUFhOztRQUM3RSxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUMxQyxJQUFJLFNBQVMsMkJBQTZCLEVBQUU7WUFDMUMsdUJBQXVCLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUM7U0FDMUQ7YUFBTTtZQUNMLHVCQUF1QixDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1NBQzFEO1FBQ0QsSUFBSSxPQUFPLENBQUMsS0FBSyx3QkFBMEIsRUFBRTtZQUMzQyxtQkFBbUIsQ0FBQyxJQUFJLEVBQUUseUJBQXlCLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7U0FDdkU7UUFDRCxPQUFPLENBQUMsT0FBTyxDQUFDLEtBQUssOEJBQThCLENBQUMsQ0FBQyxDQUFDO1lBQ2xELG9CQUFvQixDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDckQsU0FBUyxDQUFDO0tBQ2Y7Q0FDRjs7Ozs7Ozs7QUFFRCxpQ0FDSSxJQUFjLEVBQUUsT0FBZ0IsRUFBRSxRQUFzQixFQUFFLFdBQWtCOztJQUM5RSxNQUFNLE9BQU8sR0FBRyxtQkFBTSxrQkFBa0IsRUFBQyxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLEdBQUcsV0FBVyxDQUFDLENBQUM7SUFDbkYsSUFBSSxPQUFPLEVBQUU7O1FBQ1gsTUFBTSxNQUFNLEdBQUcsUUFBUSxvQkFBeUIsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUM7UUFDaEYsSUFBSSxPQUFPLENBQUMsS0FBSyw0QkFBMEIsRUFBRTs7WUFDM0MsTUFBTSxhQUFhLEdBQTRCLEVBQUUsQ0FBQztZQUNsRCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7O2dCQUNoRCxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDOztnQkFDcEMsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN4QixJQUFJLE9BQU8sQ0FBQyxLQUFLLHVCQUE0QixFQUFFO29CQUM3QyxhQUFhLENBQUMseUJBQXlCLG9CQUFDLE9BQU8sQ0FBQyxlQUFlLEdBQUcsQ0FBQzt3QkFDL0QsMEJBQTBCLENBQUMsS0FBSyxDQUFDLENBQUM7aUJBQ3ZDO2FBQ0Y7O1lBQ0QsTUFBTSxLQUFLLHNCQUFHLE9BQU8sQ0FBQyxNQUFNLEdBQUc7O1lBQy9CLE1BQU0sRUFBRSxHQUFHLGFBQWEsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLGFBQWEsQ0FBQztZQUM5RCxJQUFJLG9CQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsSUFBSSxFQUFFOztnQkFFekIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsRUFBRSxFQUFFLFlBQVksSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFhLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQzthQUNsRjtpQkFBTTs7Z0JBRUwsS0FBSyxJQUFJLElBQUksSUFBSSxhQUFhLEVBQUU7O29CQUM5QixNQUFNLEtBQUssR0FBRyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ2xDLElBQUksS0FBSyxJQUFJLElBQUksRUFBRTt3QkFDakIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztxQkFDN0M7eUJBQU07d0JBQ0wsSUFBSSxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO3FCQUN6QztpQkFDRjthQUNGO1NBQ0Y7S0FDRjtDQUNGOzs7Ozs7OztBQUVELGlDQUNJLElBQWMsRUFBRSxPQUFnQixFQUFFLFFBQXNCLEVBQUUsTUFBYTtJQUN6RSxtQkFBTSxrQkFBa0IsRUFBQyxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLEdBQUcsTUFBTSxDQUFDLENBQUM7Q0FDL0Q7Ozs7O0FBRUQsbUNBQW1DLElBQVk7O0lBRTdDLElBQUksR0FBRyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ3ZELE9BQU8sY0FBYyxJQUFJLEVBQUUsQ0FBQztDQUM3Qjs7QUFFRCxNQUFNLGlCQUFpQixHQUFHLFVBQVUsQ0FBQzs7Ozs7QUFFckMsNkJBQTZCLEtBQWE7SUFDeEMsT0FBTyxLQUFLLENBQUMsT0FBTyxDQUFDLGlCQUFpQixFQUFFLENBQUMsR0FBRyxDQUFRLEVBQUUsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztDQUNwRjs7Ozs7QUFFRCxvQ0FBb0MsS0FBVTtJQUM1QyxJQUFJOztRQUVGLE9BQU8sS0FBSyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztLQUM5RDtJQUFDLE9BQU8sQ0FBQyxFQUFFO1FBQ1YsT0FBTyx1REFBdUQsQ0FBQztLQUNoRTtDQUNGOzs7Ozs7QUFFRCxrQ0FBa0MsSUFBYyxFQUFFLFNBQWlCO0lBQ2pFLEtBQUssSUFBSSxDQUFDLEdBQUcsU0FBUyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7O1FBQ3RELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2xDLElBQUksT0FBTyxDQUFDLEtBQUssNEJBQTBCLElBQUksT0FBTyxDQUFDLFFBQVEsSUFBSSxPQUFPLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRTtZQUMxRixPQUFPLENBQUMsQ0FBQztTQUNWO0tBQ0Y7SUFDRCxPQUFPLElBQUksQ0FBQztDQUNiOzs7Ozs7QUFFRCxtQ0FBbUMsSUFBYyxFQUFFLFNBQWlCO0lBQ2xFLEtBQUssSUFBSSxDQUFDLEdBQUcsU0FBUyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7O1FBQ3RELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2xDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyx3QkFBMEIsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxRQUFRLElBQUksT0FBTyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUU7WUFDNUYsT0FBTyxDQUFDLENBQUM7U0FDVjtLQUNGO0lBQ0QsT0FBTyxJQUFJLENBQUM7Q0FDYjtBQUVEOzs7OztJQUtFLFlBQW1CLElBQWMsRUFBUyxTQUFzQjtRQUE3QyxTQUFJLEdBQUosSUFBSSxDQUFVO1FBQVMsY0FBUyxHQUFULFNBQVMsQ0FBYTtRQUM5RCxJQUFJLFNBQVMsSUFBSSxJQUFJLEVBQUU7WUFDckIsSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLEdBQUcsQ0FBQyxDQUFDO1NBQ2hDO1FBQ0QsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQzs7UUFDekMsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQzs7UUFDekIsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDO1FBQ2xCLE9BQU8sS0FBSyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssc0JBQXdCLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDM0QsS0FBSyxzQkFBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUM7U0FDeEI7UUFDRCxJQUFJLENBQUMsS0FBSyxFQUFFO1lBQ1YsT0FBTyxDQUFDLEtBQUssSUFBSSxNQUFNLEVBQUU7Z0JBQ3ZCLEtBQUssc0JBQUcsWUFBWSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7Z0JBQy9CLE1BQU0sc0JBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO2FBQzFCO1NBQ0Y7UUFDRCxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztRQUNuQixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztLQUN0Qjs7OztRQUVXLFlBQVk7O1FBRXRCLE9BQU8sYUFBYSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxhQUFhLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQzs7Ozs7SUFHckYsSUFBSSxRQUFRLEtBQWUsT0FBTyxjQUFjLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRTs7OztJQUU1RSxJQUFJLFNBQVMsS0FBVSxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLEVBQUU7Ozs7SUFFNUQsSUFBSSxPQUFPLEtBQVUsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxFQUFFOzs7O0lBRXhELElBQUksY0FBYzs7UUFDaEIsTUFBTSxNQUFNLEdBQVUsRUFBRSxDQUFDO1FBQ3pCLElBQUksSUFBSSxDQUFDLEtBQUssRUFBRTtZQUNkLEtBQUssSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFDbkYsQ0FBQyxFQUFFLEVBQUU7O2dCQUNSLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDMUMsSUFBSSxRQUFRLENBQUMsS0FBSywwQkFBd0IsRUFBRTtvQkFDMUMsTUFBTSxDQUFDLElBQUksb0JBQUMsUUFBUSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUMsQ0FBQztpQkFDeEM7Z0JBQ0QsQ0FBQyxJQUFJLFFBQVEsQ0FBQyxVQUFVLENBQUM7YUFDMUI7U0FDRjtRQUNELE9BQU8sTUFBTSxDQUFDO0tBQ2Y7Ozs7SUFFRCxJQUFJLFVBQVU7O1FBQ1osTUFBTSxVQUFVLEdBQXlCLEVBQUUsQ0FBQztRQUM1QyxJQUFJLElBQUksQ0FBQyxLQUFLLEVBQUU7WUFDZCxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFFdkQsS0FBSyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxFQUNuRixDQUFDLEVBQUUsRUFBRTs7Z0JBQ1IsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUMxQyxJQUFJLFFBQVEsQ0FBQyxLQUFLLDBCQUF3QixFQUFFO29CQUMxQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxVQUFVLENBQUMsQ0FBQztpQkFDdEQ7Z0JBQ0QsQ0FBQyxJQUFJLFFBQVEsQ0FBQyxVQUFVLENBQUM7YUFDMUI7U0FDRjtRQUNELE9BQU8sVUFBVSxDQUFDO0tBQ25COzs7O0lBRUQsSUFBSSxzQkFBc0I7O1FBQ3hCLE1BQU0sTUFBTSxHQUFHLGVBQWUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDbEQsT0FBTyxNQUFNLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztLQUNsRDs7OztJQUVELElBQUksVUFBVTtRQUNaLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLG1CQUFxQixDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUNyQyxVQUFVLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDdEY7Ozs7OztJQUVELFFBQVEsQ0FBQyxPQUFnQixFQUFFLEdBQUcsTUFBYTs7UUFDekMsSUFBSSxVQUFVLENBQWlCOztRQUMvQixJQUFJLFlBQVksQ0FBUztRQUN6QixJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxtQkFBcUIsRUFBRTtZQUMzQyxVQUFVLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7WUFDM0IsWUFBWSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDO1NBQ3ZDO2FBQU07WUFDTCxVQUFVLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUM7WUFDN0IsWUFBWSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDO1NBQ3JDOztRQUdELE1BQU0sZUFBZSxHQUFHLGtCQUFrQixDQUFDLFVBQVUsRUFBRSxZQUFZLENBQUMsQ0FBQzs7UUFDckUsSUFBSSxtQkFBbUIsR0FBRyxDQUFDLENBQUMsQ0FBQzs7UUFDN0IsSUFBSSxVQUFVLEdBQWUsR0FBRyxFQUFFO1lBQ2hDLG1CQUFtQixFQUFFLENBQUM7WUFDdEIsSUFBSSxtQkFBbUIsS0FBSyxlQUFlLEVBQUU7Z0JBQzNDLE9BQU8sT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLEdBQUcsTUFBTSxDQUFDLENBQUM7YUFDL0M7aUJBQU07Z0JBQ0wsT0FBTyxJQUFJLENBQUM7YUFDYjtTQUNGLENBQUM7VUFDRixVQUFVLENBQUMsT0FBTyxHQUFHLFVBQVU7UUFDL0IsSUFBSSxtQkFBbUIsR0FBRyxlQUFlLEVBQUU7WUFDekMsT0FBTyxDQUFDLEtBQUssQ0FBQyxtRUFBbUUsQ0FBQyxDQUFDO1lBQ25GLG1CQUFNLE9BQU8sQ0FBQyxLQUFLLEVBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDO1NBQ2pDO0tBQ0Y7Q0FDRjs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUQsNEJBQTRCLE9BQXVCLEVBQUUsU0FBaUI7O0lBQ3BFLElBQUksZUFBZSxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ3pCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxTQUFTLEVBQUUsQ0FBQyxFQUFFLEVBQUU7O1FBQ25DLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDakMsSUFBSSxPQUFPLENBQUMsS0FBSyx3QkFBMEIsRUFBRTtZQUMzQyxlQUFlLEVBQUUsQ0FBQztTQUNuQjtLQUNGO0lBQ0QsT0FBTyxlQUFlLENBQUM7Q0FDeEI7Ozs7O0FBRUQseUJBQXlCLElBQWM7SUFDckMsT0FBTyxJQUFJLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLEVBQUU7UUFDckMsSUFBSSxzQkFBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7S0FDdEI7SUFDRCxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUU7UUFDZixPQUFPLGFBQWEsQ0FBQyxJQUFJLENBQUMsTUFBTSxxQkFBRSxZQUFZLENBQUMsSUFBSSxDQUFDLEdBQUcsU0FBUyxDQUFDLENBQUM7S0FDbkU7SUFDRCxPQUFPLElBQUksQ0FBQztDQUNiOzs7Ozs7O0FBRUQsMkJBQTJCLElBQWMsRUFBRSxPQUFnQixFQUFFLFVBQWdDO0lBQzNGLEtBQUssSUFBSSxPQUFPLElBQUksT0FBTyxDQUFDLFVBQVUsRUFBRTtRQUN0QyxVQUFVLENBQUMsT0FBTyxDQUFDLEdBQUcsYUFBYSxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0tBQ2pGO0NBQ0Y7Ozs7Ozs7O0FBRUQsOEJBQThCLE1BQW1CLEVBQUUsRUFBTyxFQUFFLElBQVMsRUFBRSxJQUFXOztJQUNoRixNQUFNLFNBQVMsR0FBRyxjQUFjLENBQUM7O0lBQ2pDLE1BQU0sT0FBTyxHQUFHLFlBQVksQ0FBQzs7SUFDN0IsTUFBTSxZQUFZLEdBQUcsaUJBQWlCLENBQUM7SUFDdkMsSUFBSTtRQUNGLGNBQWMsR0FBRyxNQUFNLENBQUM7O1FBQ3hCLE1BQU0sTUFBTSxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3BDLFlBQVksR0FBRyxPQUFPLENBQUM7UUFDdkIsaUJBQWlCLEdBQUcsWUFBWSxDQUFDO1FBQ2pDLGNBQWMsR0FBRyxTQUFTLENBQUM7UUFDM0IsT0FBTyxNQUFNLENBQUM7S0FDZjtJQUFDLE9BQU8sQ0FBQyxFQUFFO1FBQ1YsSUFBSSxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRTtZQUN4QyxNQUFNLENBQUMsQ0FBQztTQUNUO1FBQ0QsTUFBTSxxQkFBcUIsQ0FBQyxDQUFDLHFCQUFFLHNCQUFzQixFQUFFLEdBQUcsQ0FBQztLQUM1RDtDQUNGOzs7O0FBRUQsTUFBTTtJQUNKLE9BQU8sWUFBWSxDQUFDLENBQUMsQ0FBQyxJQUFJLGFBQWEsQ0FBQyxZQUFZLEVBQUUsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0NBQ2pGO0FBRUQsTUFBTTs7OztJQUNKLFlBQW9CLFFBQTBCO1FBQTFCLGFBQVEsR0FBUixRQUFRLENBQWtCO0tBQUk7Ozs7OztJQUVsRCxjQUFjLENBQUMsT0FBWSxFQUFFLFVBQThCO1FBQ3pELE9BQU8sSUFBSSxjQUFjLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUM7S0FDOUU7Ozs7SUFFRCxLQUFLO1FBQ0gsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRTtZQUN2QixJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDO1NBQ3ZCO0tBQ0Y7Ozs7SUFDRCxHQUFHO1FBQ0QsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRTtZQUNyQixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRSxDQUFDO1NBQ3JCO0tBQ0Y7Ozs7SUFFRCxpQkFBaUI7UUFDZixJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsaUJBQWlCLEVBQUU7WUFDbkMsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLGlCQUFpQixFQUFFLENBQUM7U0FDMUM7UUFDRCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDOUI7Q0FDRjs7Ozs7QUFFRCxNQUFNOzs7O0lBZUosWUFBb0IsUUFBbUI7UUFBbkIsYUFBUSxHQUFSLFFBQVEsQ0FBVzs7Ozs7Ozs7O21DQUpVLHNCQUFzQjtRQUk1QixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDO0tBQUU7Ozs7UUFGaEUsWUFBWSxLQUFLLE9BQU8sSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7Ozs7O0lBSS9ELFdBQVcsQ0FBQyxJQUFTO1FBQ25CLHdCQUF3QixvQkFBQyxZQUFZLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQztRQUMvQyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFO1lBQzdCLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ2pDO0tBQ0Y7Ozs7SUFFRCxPQUFPLEtBQUssSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxFQUFFOzs7Ozs7SUFFdEMsYUFBYSxDQUFDLElBQVksRUFBRSxTQUFrQjs7UUFDNUMsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDOztRQUN4RCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDO1FBQ25DLElBQUksUUFBUSxFQUFFOztZQUNaLE1BQU0sT0FBTyxHQUFHLElBQUksWUFBWSxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDckQsT0FBTyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7WUFDcEIsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1NBQ3pCO1FBQ0QsT0FBTyxFQUFFLENBQUM7S0FDWDs7Ozs7SUFFRCxhQUFhLENBQUMsS0FBYTs7UUFDekIsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7O1FBQ25ELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUM7UUFDbkMsSUFBSSxRQUFRLEVBQUU7WUFDWixjQUFjLENBQUMsSUFBSSxTQUFTLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO1NBQ3hEO1FBQ0QsT0FBTyxPQUFPLENBQUM7S0FDaEI7Ozs7O0lBRUQsVUFBVSxDQUFDLEtBQWE7O1FBQ3RCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDOztRQUM3QyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDO1FBQ25DLElBQUksUUFBUSxFQUFFO1lBQ1osY0FBYyxDQUFDLElBQUksU0FBUyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQztTQUNyRDtRQUNELE9BQU8sSUFBSSxDQUFDO0tBQ2I7Ozs7OztJQUVELFdBQVcsQ0FBQyxNQUFXLEVBQUUsUUFBYTs7UUFDcEMsTUFBTSxPQUFPLEdBQUcsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDOztRQUNyQyxNQUFNLFlBQVksR0FBRyxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDNUMsSUFBSSxPQUFPLElBQUksWUFBWSxJQUFJLE9BQU8sWUFBWSxZQUFZLEVBQUU7WUFDOUQsT0FBTyxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsQ0FBQztTQUNoQztRQUNELElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQztLQUM3Qzs7Ozs7OztJQUVELFlBQVksQ0FBQyxNQUFXLEVBQUUsUUFBYSxFQUFFLFFBQWE7O1FBQ3BELE1BQU0sT0FBTyxHQUFHLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQzs7UUFDckMsTUFBTSxZQUFZLEdBQUcsWUFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFDOztRQUM1QyxNQUFNLFVBQVUsc0JBQUcsWUFBWSxDQUFDLFFBQVEsQ0FBQyxHQUFHO1FBQzVDLElBQUksT0FBTyxJQUFJLFlBQVksSUFBSSxPQUFPLFlBQVksWUFBWSxFQUFFO1lBQzlELE9BQU8sQ0FBQyxZQUFZLENBQUMsVUFBVSxFQUFFLFlBQVksQ0FBQyxDQUFDO1NBQ2hEO1FBRUQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztLQUN4RDs7Ozs7O0lBRUQsV0FBVyxDQUFDLE1BQVcsRUFBRSxRQUFhOztRQUNwQyxNQUFNLE9BQU8sR0FBRyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUM7O1FBQ3JDLE1BQU0sWUFBWSxHQUFHLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUM1QyxJQUFJLE9BQU8sSUFBSSxZQUFZLElBQUksT0FBTyxZQUFZLFlBQVksRUFBRTtZQUM5RCxPQUFPLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxDQUFDO1NBQ25DO1FBQ0QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0tBQzdDOzs7OztJQUVELGlCQUFpQixDQUFDLGNBQTBCOztRQUMxQyxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLGlCQUFpQixDQUFDLGNBQWMsQ0FBQyxDQUFDOztRQUMzRCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDO1FBQ25DLElBQUksUUFBUSxFQUFFO1lBQ1osY0FBYyxDQUFDLElBQUksWUFBWSxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQztTQUN0RDtRQUNELE9BQU8sRUFBRSxDQUFDO0tBQ1g7Ozs7Ozs7O0lBRUQsWUFBWSxDQUFDLEVBQU8sRUFBRSxJQUFZLEVBQUUsS0FBYSxFQUFFLFNBQWtCOztRQUNuRSxNQUFNLE9BQU8sR0FBRyxZQUFZLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDakMsSUFBSSxPQUFPLElBQUksT0FBTyxZQUFZLFlBQVksRUFBRTs7WUFDOUMsTUFBTSxRQUFRLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxTQUFTLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQzNELE9BQU8sQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLEdBQUcsS0FBSyxDQUFDO1NBQ3RDO1FBQ0QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7S0FDeEQ7Ozs7Ozs7SUFFRCxlQUFlLENBQUMsRUFBTyxFQUFFLElBQVksRUFBRSxTQUFrQjs7UUFDdkQsTUFBTSxPQUFPLEdBQUcsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ2pDLElBQUksT0FBTyxJQUFJLE9BQU8sWUFBWSxZQUFZLEVBQUU7O1lBQzlDLE1BQU0sUUFBUSxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsU0FBUyxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUMzRCxPQUFPLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxHQUFHLElBQUksQ0FBQztTQUNyQztRQUNELElBQUksQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7S0FDcEQ7Ozs7OztJQUVELFFBQVEsQ0FBQyxFQUFPLEVBQUUsSUFBWTs7UUFDNUIsTUFBTSxPQUFPLEdBQUcsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ2pDLElBQUksT0FBTyxJQUFJLE9BQU8sWUFBWSxZQUFZLEVBQUU7WUFDOUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUM7U0FDOUI7UUFDRCxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7S0FDbEM7Ozs7OztJQUVELFdBQVcsQ0FBQyxFQUFPLEVBQUUsSUFBWTs7UUFDL0IsTUFBTSxPQUFPLEdBQUcsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ2pDLElBQUksT0FBTyxJQUFJLE9BQU8sWUFBWSxZQUFZLEVBQUU7WUFDOUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUM7U0FDL0I7UUFDRCxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7S0FDckM7Ozs7Ozs7O0lBRUQsUUFBUSxDQUFDLEVBQU8sRUFBRSxLQUFhLEVBQUUsS0FBVSxFQUFFLEtBQTBCOztRQUNyRSxNQUFNLE9BQU8sR0FBRyxZQUFZLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDakMsSUFBSSxPQUFPLElBQUksT0FBTyxZQUFZLFlBQVksRUFBRTtZQUM5QyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLEtBQUssQ0FBQztTQUMvQjtRQUNELElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO0tBQ2pEOzs7Ozs7O0lBRUQsV0FBVyxDQUFDLEVBQU8sRUFBRSxLQUFhLEVBQUUsS0FBMEI7O1FBQzVELE1BQU0sT0FBTyxHQUFHLFlBQVksQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNqQyxJQUFJLE9BQU8sSUFBSSxPQUFPLFlBQVksWUFBWSxFQUFFO1lBQzlDLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDO1NBQzlCO1FBQ0QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztLQUM3Qzs7Ozs7OztJQUVELFdBQVcsQ0FBQyxFQUFPLEVBQUUsSUFBWSxFQUFFLEtBQVU7O1FBQzNDLE1BQU0sT0FBTyxHQUFHLFlBQVksQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNqQyxJQUFJLE9BQU8sSUFBSSxPQUFPLFlBQVksWUFBWSxFQUFFO1lBQzlDLE9BQU8sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDO1NBQ2xDO1FBQ0QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztLQUM1Qzs7Ozs7OztJQUVELE1BQU0sQ0FDRixNQUF1QyxFQUFFLFNBQWlCLEVBQzFELFFBQWlDO1FBQ25DLElBQUksT0FBTyxNQUFNLEtBQUssUUFBUSxFQUFFOztZQUM5QixNQUFNLE9BQU8sR0FBRyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDckMsSUFBSSxPQUFPLEVBQUU7Z0JBQ1gsT0FBTyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxhQUFhLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7YUFDaEU7U0FDRjtRQUVELE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQztLQUMxRDs7Ozs7SUFFRCxVQUFVLENBQUMsSUFBUyxJQUFTLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRTs7Ozs7SUFDckUsV0FBVyxDQUFDLElBQVMsSUFBUyxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUU7Ozs7OztJQUN2RSxRQUFRLENBQUMsSUFBUyxFQUFFLEtBQWEsSUFBVSxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQyxFQUFFO0NBQ3pGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0RlYnVnRWxlbWVudCwgRGVidWdOb2RlLCBFdmVudExpc3RlbmVyLCBnZXREZWJ1Z05vZGUsIGluZGV4RGVidWdOb2RlLCByZW1vdmVEZWJ1Z05vZGVGcm9tSW5kZXh9IGZyb20gJy4uL2RlYnVnL2RlYnVnX25vZGUnO1xuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi4vZGknO1xuaW1wb3J0IHtJbmplY3RhYmxlVHlwZX0gZnJvbSAnLi4vZGkvaW5qZWN0YWJsZSc7XG5pbXBvcnQge0Vycm9ySGFuZGxlcn0gZnJvbSAnLi4vZXJyb3JfaGFuZGxlcic7XG5pbXBvcnQge2lzRGV2TW9kZX0gZnJvbSAnLi4vaXNfZGV2X21vZGUnO1xuaW1wb3J0IHtDb21wb25lbnRGYWN0b3J5fSBmcm9tICcuLi9saW5rZXIvY29tcG9uZW50X2ZhY3RvcnknO1xuaW1wb3J0IHtOZ01vZHVsZVJlZn0gZnJvbSAnLi4vbGlua2VyL25nX21vZHVsZV9mYWN0b3J5JztcbmltcG9ydCB7UmVuZGVyZXIyLCBSZW5kZXJlckZhY3RvcnkyLCBSZW5kZXJlclN0eWxlRmxhZ3MyLCBSZW5kZXJlclR5cGUyfSBmcm9tICcuLi9yZW5kZXIvYXBpJztcbmltcG9ydCB7U2FuaXRpemVyfSBmcm9tICcuLi9zYW5pdGl6YXRpb24vc2VjdXJpdHknO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi90eXBlJztcbmltcG9ydCB7dG9rZW5LZXl9IGZyb20gJy4uL3ZpZXcvdXRpbCc7XG5cbmltcG9ydCB7aXNWaWV3RGVidWdFcnJvciwgdmlld0Rlc3Ryb3llZEVycm9yLCB2aWV3V3JhcHBlZERlYnVnRXJyb3J9IGZyb20gJy4vZXJyb3JzJztcbmltcG9ydCB7cmVzb2x2ZURlcH0gZnJvbSAnLi9wcm92aWRlcic7XG5pbXBvcnQge2RpcnR5UGFyZW50UXVlcmllcywgZ2V0UXVlcnlWYWx1ZX0gZnJvbSAnLi9xdWVyeSc7XG5pbXBvcnQge2NyZWF0ZUluamVjdG9yLCBjcmVhdGVOZ01vZHVsZVJlZiwgZ2V0Q29tcG9uZW50Vmlld0RlZmluaXRpb25GYWN0b3J5fSBmcm9tICcuL3JlZnMnO1xuaW1wb3J0IHtBcmd1bWVudFR5cGUsIEJpbmRpbmdGbGFncywgQ2hlY2tUeXBlLCBEZWJ1Z0NvbnRleHQsIEVsZW1lbnREYXRhLCBOZ01vZHVsZURlZmluaXRpb24sIE5vZGVEZWYsIE5vZGVGbGFncywgTm9kZUxvZ2dlciwgUHJvdmlkZXJPdmVycmlkZSwgUm9vdERhdGEsIFNlcnZpY2VzLCBWaWV3RGF0YSwgVmlld0RlZmluaXRpb24sIFZpZXdTdGF0ZSwgYXNFbGVtZW50RGF0YSwgYXNQdXJlRXhwcmVzc2lvbkRhdGF9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHtOT09QLCBpc0NvbXBvbmVudFZpZXcsIHJlbmRlck5vZGUsIHJlc29sdmVEZWZpbml0aW9uLCBzcGxpdERlcHNEc2wsIHZpZXdQYXJlbnRFbH0gZnJvbSAnLi91dGlsJztcbmltcG9ydCB7Y2hlY2tBbmRVcGRhdGVOb2RlLCBjaGVja0FuZFVwZGF0ZVZpZXcsIGNoZWNrTm9DaGFuZ2VzTm9kZSwgY2hlY2tOb0NoYW5nZXNWaWV3LCBjcmVhdGVDb21wb25lbnRWaWV3LCBjcmVhdGVFbWJlZGRlZFZpZXcsIGNyZWF0ZVJvb3RWaWV3LCBkZXN0cm95Vmlld30gZnJvbSAnLi92aWV3JztcblxuXG5sZXQgaW5pdGlhbGl6ZWQgPSBmYWxzZTtcblxuZXhwb3J0IGZ1bmN0aW9uIGluaXRTZXJ2aWNlc0lmTmVlZGVkKCkge1xuICBpZiAoaW5pdGlhbGl6ZWQpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgaW5pdGlhbGl6ZWQgPSB0cnVlO1xuICBjb25zdCBzZXJ2aWNlcyA9IGlzRGV2TW9kZSgpID8gY3JlYXRlRGVidWdTZXJ2aWNlcygpIDogY3JlYXRlUHJvZFNlcnZpY2VzKCk7XG4gIFNlcnZpY2VzLnNldEN1cnJlbnROb2RlID0gc2VydmljZXMuc2V0Q3VycmVudE5vZGU7XG4gIFNlcnZpY2VzLmNyZWF0ZVJvb3RWaWV3ID0gc2VydmljZXMuY3JlYXRlUm9vdFZpZXc7XG4gIFNlcnZpY2VzLmNyZWF0ZUVtYmVkZGVkVmlldyA9IHNlcnZpY2VzLmNyZWF0ZUVtYmVkZGVkVmlldztcbiAgU2VydmljZXMuY3JlYXRlQ29tcG9uZW50VmlldyA9IHNlcnZpY2VzLmNyZWF0ZUNvbXBvbmVudFZpZXc7XG4gIFNlcnZpY2VzLmNyZWF0ZU5nTW9kdWxlUmVmID0gc2VydmljZXMuY3JlYXRlTmdNb2R1bGVSZWY7XG4gIFNlcnZpY2VzLm92ZXJyaWRlUHJvdmlkZXIgPSBzZXJ2aWNlcy5vdmVycmlkZVByb3ZpZGVyO1xuICBTZXJ2aWNlcy5vdmVycmlkZUNvbXBvbmVudFZpZXcgPSBzZXJ2aWNlcy5vdmVycmlkZUNvbXBvbmVudFZpZXc7XG4gIFNlcnZpY2VzLmNsZWFyT3ZlcnJpZGVzID0gc2VydmljZXMuY2xlYXJPdmVycmlkZXM7XG4gIFNlcnZpY2VzLmNoZWNrQW5kVXBkYXRlVmlldyA9IHNlcnZpY2VzLmNoZWNrQW5kVXBkYXRlVmlldztcbiAgU2VydmljZXMuY2hlY2tOb0NoYW5nZXNWaWV3ID0gc2VydmljZXMuY2hlY2tOb0NoYW5nZXNWaWV3O1xuICBTZXJ2aWNlcy5kZXN0cm95VmlldyA9IHNlcnZpY2VzLmRlc3Ryb3lWaWV3O1xuICBTZXJ2aWNlcy5yZXNvbHZlRGVwID0gcmVzb2x2ZURlcDtcbiAgU2VydmljZXMuY3JlYXRlRGVidWdDb250ZXh0ID0gc2VydmljZXMuY3JlYXRlRGVidWdDb250ZXh0O1xuICBTZXJ2aWNlcy5oYW5kbGVFdmVudCA9IHNlcnZpY2VzLmhhbmRsZUV2ZW50O1xuICBTZXJ2aWNlcy51cGRhdGVEaXJlY3RpdmVzID0gc2VydmljZXMudXBkYXRlRGlyZWN0aXZlcztcbiAgU2VydmljZXMudXBkYXRlUmVuZGVyZXIgPSBzZXJ2aWNlcy51cGRhdGVSZW5kZXJlcjtcbiAgU2VydmljZXMuZGlydHlQYXJlbnRRdWVyaWVzID0gZGlydHlQYXJlbnRRdWVyaWVzO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVQcm9kU2VydmljZXMoKSB7XG4gIHJldHVybiB7XG4gICAgc2V0Q3VycmVudE5vZGU6ICgpID0+IHt9LFxuICAgIGNyZWF0ZVJvb3RWaWV3OiBjcmVhdGVQcm9kUm9vdFZpZXcsXG4gICAgY3JlYXRlRW1iZWRkZWRWaWV3OiBjcmVhdGVFbWJlZGRlZFZpZXcsXG4gICAgY3JlYXRlQ29tcG9uZW50VmlldzogY3JlYXRlQ29tcG9uZW50VmlldyxcbiAgICBjcmVhdGVOZ01vZHVsZVJlZjogY3JlYXRlTmdNb2R1bGVSZWYsXG4gICAgb3ZlcnJpZGVQcm92aWRlcjogTk9PUCxcbiAgICBvdmVycmlkZUNvbXBvbmVudFZpZXc6IE5PT1AsXG4gICAgY2xlYXJPdmVycmlkZXM6IE5PT1AsXG4gICAgY2hlY2tBbmRVcGRhdGVWaWV3OiBjaGVja0FuZFVwZGF0ZVZpZXcsXG4gICAgY2hlY2tOb0NoYW5nZXNWaWV3OiBjaGVja05vQ2hhbmdlc1ZpZXcsXG4gICAgZGVzdHJveVZpZXc6IGRlc3Ryb3lWaWV3LFxuICAgIGNyZWF0ZURlYnVnQ29udGV4dDogKHZpZXc6IFZpZXdEYXRhLCBub2RlSW5kZXg6IG51bWJlcikgPT4gbmV3IERlYnVnQ29udGV4dF8odmlldywgbm9kZUluZGV4KSxcbiAgICBoYW5kbGVFdmVudDogKHZpZXc6IFZpZXdEYXRhLCBub2RlSW5kZXg6IG51bWJlciwgZXZlbnROYW1lOiBzdHJpbmcsIGV2ZW50OiBhbnkpID0+XG4gICAgICAgICAgICAgICAgICAgICB2aWV3LmRlZi5oYW5kbGVFdmVudCh2aWV3LCBub2RlSW5kZXgsIGV2ZW50TmFtZSwgZXZlbnQpLFxuICAgIHVwZGF0ZURpcmVjdGl2ZXM6ICh2aWV3OiBWaWV3RGF0YSwgY2hlY2tUeXBlOiBDaGVja1R5cGUpID0+IHZpZXcuZGVmLnVwZGF0ZURpcmVjdGl2ZXMoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrVHlwZSA9PT0gQ2hlY2tUeXBlLkNoZWNrQW5kVXBkYXRlID8gcHJvZENoZWNrQW5kVXBkYXRlTm9kZSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZENoZWNrTm9DaGFuZ2VzTm9kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdmlldyksXG4gICAgdXBkYXRlUmVuZGVyZXI6ICh2aWV3OiBWaWV3RGF0YSwgY2hlY2tUeXBlOiBDaGVja1R5cGUpID0+IHZpZXcuZGVmLnVwZGF0ZVJlbmRlcmVyKFxuICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tUeXBlID09PSBDaGVja1R5cGUuQ2hlY2tBbmRVcGRhdGUgPyBwcm9kQ2hlY2tBbmRVcGRhdGVOb2RlIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZENoZWNrTm9DaGFuZ2VzTm9kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZpZXcpLFxuICB9O1xufVxuXG5mdW5jdGlvbiBjcmVhdGVEZWJ1Z1NlcnZpY2VzKCkge1xuICByZXR1cm4ge1xuICAgIHNldEN1cnJlbnROb2RlOiBkZWJ1Z1NldEN1cnJlbnROb2RlLFxuICAgIGNyZWF0ZVJvb3RWaWV3OiBkZWJ1Z0NyZWF0ZVJvb3RWaWV3LFxuICAgIGNyZWF0ZUVtYmVkZGVkVmlldzogZGVidWdDcmVhdGVFbWJlZGRlZFZpZXcsXG4gICAgY3JlYXRlQ29tcG9uZW50VmlldzogZGVidWdDcmVhdGVDb21wb25lbnRWaWV3LFxuICAgIGNyZWF0ZU5nTW9kdWxlUmVmOiBkZWJ1Z0NyZWF0ZU5nTW9kdWxlUmVmLFxuICAgIG92ZXJyaWRlUHJvdmlkZXI6IGRlYnVnT3ZlcnJpZGVQcm92aWRlcixcbiAgICBvdmVycmlkZUNvbXBvbmVudFZpZXc6IGRlYnVnT3ZlcnJpZGVDb21wb25lbnRWaWV3LFxuICAgIGNsZWFyT3ZlcnJpZGVzOiBkZWJ1Z0NsZWFyT3ZlcnJpZGVzLFxuICAgIGNoZWNrQW5kVXBkYXRlVmlldzogZGVidWdDaGVja0FuZFVwZGF0ZVZpZXcsXG4gICAgY2hlY2tOb0NoYW5nZXNWaWV3OiBkZWJ1Z0NoZWNrTm9DaGFuZ2VzVmlldyxcbiAgICBkZXN0cm95VmlldzogZGVidWdEZXN0cm95VmlldyxcbiAgICBjcmVhdGVEZWJ1Z0NvbnRleHQ6ICh2aWV3OiBWaWV3RGF0YSwgbm9kZUluZGV4OiBudW1iZXIpID0+IG5ldyBEZWJ1Z0NvbnRleHRfKHZpZXcsIG5vZGVJbmRleCksXG4gICAgaGFuZGxlRXZlbnQ6IGRlYnVnSGFuZGxlRXZlbnQsXG4gICAgdXBkYXRlRGlyZWN0aXZlczogZGVidWdVcGRhdGVEaXJlY3RpdmVzLFxuICAgIHVwZGF0ZVJlbmRlcmVyOiBkZWJ1Z1VwZGF0ZVJlbmRlcmVyLFxuICB9O1xufVxuXG5mdW5jdGlvbiBjcmVhdGVQcm9kUm9vdFZpZXcoXG4gICAgZWxJbmplY3RvcjogSW5qZWN0b3IsIHByb2plY3RhYmxlTm9kZXM6IGFueVtdW10sIHJvb3RTZWxlY3Rvck9yTm9kZTogc3RyaW5nIHwgYW55LFxuICAgIGRlZjogVmlld0RlZmluaXRpb24sIG5nTW9kdWxlOiBOZ01vZHVsZVJlZjxhbnk+LCBjb250ZXh0PzogYW55KTogVmlld0RhdGEge1xuICBjb25zdCByZW5kZXJlckZhY3Rvcnk6IFJlbmRlcmVyRmFjdG9yeTIgPSBuZ01vZHVsZS5pbmplY3Rvci5nZXQoUmVuZGVyZXJGYWN0b3J5Mik7XG4gIHJldHVybiBjcmVhdGVSb290VmlldyhcbiAgICAgIGNyZWF0ZVJvb3REYXRhKGVsSW5qZWN0b3IsIG5nTW9kdWxlLCByZW5kZXJlckZhY3RvcnksIHByb2plY3RhYmxlTm9kZXMsIHJvb3RTZWxlY3Rvck9yTm9kZSksXG4gICAgICBkZWYsIGNvbnRleHQpO1xufVxuXG5mdW5jdGlvbiBkZWJ1Z0NyZWF0ZVJvb3RWaWV3KFxuICAgIGVsSW5qZWN0b3I6IEluamVjdG9yLCBwcm9qZWN0YWJsZU5vZGVzOiBhbnlbXVtdLCByb290U2VsZWN0b3JPck5vZGU6IHN0cmluZyB8IGFueSxcbiAgICBkZWY6IFZpZXdEZWZpbml0aW9uLCBuZ01vZHVsZTogTmdNb2R1bGVSZWY8YW55PiwgY29udGV4dD86IGFueSk6IFZpZXdEYXRhIHtcbiAgY29uc3QgcmVuZGVyZXJGYWN0b3J5OiBSZW5kZXJlckZhY3RvcnkyID0gbmdNb2R1bGUuaW5qZWN0b3IuZ2V0KFJlbmRlcmVyRmFjdG9yeTIpO1xuICBjb25zdCByb290ID0gY3JlYXRlUm9vdERhdGEoXG4gICAgICBlbEluamVjdG9yLCBuZ01vZHVsZSwgbmV3IERlYnVnUmVuZGVyZXJGYWN0b3J5MihyZW5kZXJlckZhY3RvcnkpLCBwcm9qZWN0YWJsZU5vZGVzLFxuICAgICAgcm9vdFNlbGVjdG9yT3JOb2RlKTtcbiAgY29uc3QgZGVmV2l0aE92ZXJyaWRlID0gYXBwbHlQcm92aWRlck92ZXJyaWRlc1RvVmlldyhkZWYpO1xuICByZXR1cm4gY2FsbFdpdGhEZWJ1Z0NvbnRleHQoXG4gICAgICBEZWJ1Z0FjdGlvbi5jcmVhdGUsIGNyZWF0ZVJvb3RWaWV3LCBudWxsLCBbcm9vdCwgZGVmV2l0aE92ZXJyaWRlLCBjb250ZXh0XSk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVJvb3REYXRhKFxuICAgIGVsSW5qZWN0b3I6IEluamVjdG9yLCBuZ01vZHVsZTogTmdNb2R1bGVSZWY8YW55PiwgcmVuZGVyZXJGYWN0b3J5OiBSZW5kZXJlckZhY3RvcnkyLFxuICAgIHByb2plY3RhYmxlTm9kZXM6IGFueVtdW10sIHJvb3RTZWxlY3Rvck9yTm9kZTogYW55KTogUm9vdERhdGEge1xuICBjb25zdCBzYW5pdGl6ZXIgPSBuZ01vZHVsZS5pbmplY3Rvci5nZXQoU2FuaXRpemVyKTtcbiAgY29uc3QgZXJyb3JIYW5kbGVyID0gbmdNb2R1bGUuaW5qZWN0b3IuZ2V0KEVycm9ySGFuZGxlcik7XG4gIGNvbnN0IHJlbmRlcmVyID0gcmVuZGVyZXJGYWN0b3J5LmNyZWF0ZVJlbmRlcmVyKG51bGwsIG51bGwpO1xuICByZXR1cm4ge1xuICAgIG5nTW9kdWxlLFxuICAgIGluamVjdG9yOiBlbEluamVjdG9yLCBwcm9qZWN0YWJsZU5vZGVzLFxuICAgIHNlbGVjdG9yT3JOb2RlOiByb290U2VsZWN0b3JPck5vZGUsIHNhbml0aXplciwgcmVuZGVyZXJGYWN0b3J5LCByZW5kZXJlciwgZXJyb3JIYW5kbGVyXG4gIH07XG59XG5cbmZ1bmN0aW9uIGRlYnVnQ3JlYXRlRW1iZWRkZWRWaWV3KFxuICAgIHBhcmVudFZpZXc6IFZpZXdEYXRhLCBhbmNob3JEZWY6IE5vZGVEZWYsIHZpZXdEZWY6IFZpZXdEZWZpbml0aW9uLCBjb250ZXh0PzogYW55KTogVmlld0RhdGEge1xuICBjb25zdCBkZWZXaXRoT3ZlcnJpZGUgPSBhcHBseVByb3ZpZGVyT3ZlcnJpZGVzVG9WaWV3KHZpZXdEZWYpO1xuICByZXR1cm4gY2FsbFdpdGhEZWJ1Z0NvbnRleHQoXG4gICAgICBEZWJ1Z0FjdGlvbi5jcmVhdGUsIGNyZWF0ZUVtYmVkZGVkVmlldywgbnVsbCxcbiAgICAgIFtwYXJlbnRWaWV3LCBhbmNob3JEZWYsIGRlZldpdGhPdmVycmlkZSwgY29udGV4dF0pO1xufVxuXG5mdW5jdGlvbiBkZWJ1Z0NyZWF0ZUNvbXBvbmVudFZpZXcoXG4gICAgcGFyZW50VmlldzogVmlld0RhdGEsIG5vZGVEZWY6IE5vZGVEZWYsIHZpZXdEZWY6IFZpZXdEZWZpbml0aW9uLCBob3N0RWxlbWVudDogYW55KTogVmlld0RhdGEge1xuICBjb25zdCBvdmVycmlkZUNvbXBvbmVudFZpZXcgPVxuICAgICAgdmlld0RlZk92ZXJyaWRlcy5nZXQobm9kZURlZi5lbGVtZW50ICEuY29tcG9uZW50UHJvdmlkZXIgIS5wcm92aWRlciAhLnRva2VuKTtcbiAgaWYgKG92ZXJyaWRlQ29tcG9uZW50Vmlldykge1xuICAgIHZpZXdEZWYgPSBvdmVycmlkZUNvbXBvbmVudFZpZXc7XG4gIH0gZWxzZSB7XG4gICAgdmlld0RlZiA9IGFwcGx5UHJvdmlkZXJPdmVycmlkZXNUb1ZpZXcodmlld0RlZik7XG4gIH1cbiAgcmV0dXJuIGNhbGxXaXRoRGVidWdDb250ZXh0KFxuICAgICAgRGVidWdBY3Rpb24uY3JlYXRlLCBjcmVhdGVDb21wb25lbnRWaWV3LCBudWxsLCBbcGFyZW50Vmlldywgbm9kZURlZiwgdmlld0RlZiwgaG9zdEVsZW1lbnRdKTtcbn1cblxuZnVuY3Rpb24gZGVidWdDcmVhdGVOZ01vZHVsZVJlZihcbiAgICBtb2R1bGVUeXBlOiBUeXBlPGFueT4sIHBhcmVudEluamVjdG9yOiBJbmplY3RvciwgYm9vdHN0cmFwQ29tcG9uZW50czogVHlwZTxhbnk+W10sXG4gICAgZGVmOiBOZ01vZHVsZURlZmluaXRpb24pOiBOZ01vZHVsZVJlZjxhbnk+IHtcbiAgY29uc3QgZGVmV2l0aE92ZXJyaWRlID0gYXBwbHlQcm92aWRlck92ZXJyaWRlc1RvTmdNb2R1bGUoZGVmKTtcbiAgcmV0dXJuIGNyZWF0ZU5nTW9kdWxlUmVmKG1vZHVsZVR5cGUsIHBhcmVudEluamVjdG9yLCBib290c3RyYXBDb21wb25lbnRzLCBkZWZXaXRoT3ZlcnJpZGUpO1xufVxuXG5jb25zdCBwcm92aWRlck92ZXJyaWRlcyA9IG5ldyBNYXA8YW55LCBQcm92aWRlck92ZXJyaWRlPigpO1xuY29uc3QgcHJvdmlkZXJPdmVycmlkZXNXaXRoU2NvcGUgPSBuZXcgTWFwPEluamVjdGFibGVUeXBlPGFueT4sIFByb3ZpZGVyT3ZlcnJpZGU+KCk7XG5jb25zdCB2aWV3RGVmT3ZlcnJpZGVzID0gbmV3IE1hcDxhbnksIFZpZXdEZWZpbml0aW9uPigpO1xuXG5mdW5jdGlvbiBkZWJ1Z092ZXJyaWRlUHJvdmlkZXIob3ZlcnJpZGU6IFByb3ZpZGVyT3ZlcnJpZGUpIHtcbiAgcHJvdmlkZXJPdmVycmlkZXMuc2V0KG92ZXJyaWRlLnRva2VuLCBvdmVycmlkZSk7XG4gIGlmICh0eXBlb2Ygb3ZlcnJpZGUudG9rZW4gPT09ICdmdW5jdGlvbicgJiYgb3ZlcnJpZGUudG9rZW4ubmdJbmplY3RhYmxlRGVmICYmXG4gICAgICB0eXBlb2Ygb3ZlcnJpZGUudG9rZW4ubmdJbmplY3RhYmxlRGVmLnByb3ZpZGVkSW4gPT09ICdmdW5jdGlvbicpIHtcbiAgICBwcm92aWRlck92ZXJyaWRlc1dpdGhTY29wZS5zZXQob3ZlcnJpZGUudG9rZW4gYXMgSW5qZWN0YWJsZVR5cGU8YW55Piwgb3ZlcnJpZGUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGRlYnVnT3ZlcnJpZGVDb21wb25lbnRWaWV3KGNvbXA6IGFueSwgY29tcEZhY3Rvcnk6IENvbXBvbmVudEZhY3Rvcnk8YW55Pikge1xuICBjb25zdCBob3N0Vmlld0RlZiA9IHJlc29sdmVEZWZpbml0aW9uKGdldENvbXBvbmVudFZpZXdEZWZpbml0aW9uRmFjdG9yeShjb21wRmFjdG9yeSkpO1xuICBjb25zdCBjb21wVmlld0RlZiA9IHJlc29sdmVEZWZpbml0aW9uKGhvc3RWaWV3RGVmLm5vZGVzWzBdLmVsZW1lbnQgIS5jb21wb25lbnRWaWV3ICEpO1xuICB2aWV3RGVmT3ZlcnJpZGVzLnNldChjb21wLCBjb21wVmlld0RlZik7XG59XG5cbmZ1bmN0aW9uIGRlYnVnQ2xlYXJPdmVycmlkZXMoKSB7XG4gIHByb3ZpZGVyT3ZlcnJpZGVzLmNsZWFyKCk7XG4gIHByb3ZpZGVyT3ZlcnJpZGVzV2l0aFNjb3BlLmNsZWFyKCk7XG4gIHZpZXdEZWZPdmVycmlkZXMuY2xlYXIoKTtcbn1cblxuLy8gTm90ZXMgYWJvdXQgdGhlIGFsZ29yaXRobTpcbi8vIDEpIExvY2F0ZSB0aGUgcHJvdmlkZXJzIG9mIGFuIGVsZW1lbnQgYW5kIGNoZWNrIGlmIG9uZSBvZiB0aGVtIHdhcyBvdmVyd3JpdHRlblxuLy8gMikgQ2hhbmdlIHRoZSBwcm92aWRlcnMgb2YgdGhhdCBlbGVtZW50XG4vL1xuLy8gV2Ugb25seSBjcmVhdGUgbmV3IGRhdGFzdHJ1Y3R1cmVzIGlmIHdlIG5lZWQgdG8sIHRvIGtlZXAgcGVyZiBpbXBhY3Rcbi8vIHJlYXNvbmFibGUuXG5mdW5jdGlvbiBhcHBseVByb3ZpZGVyT3ZlcnJpZGVzVG9WaWV3KGRlZjogVmlld0RlZmluaXRpb24pOiBWaWV3RGVmaW5pdGlvbiB7XG4gIGlmIChwcm92aWRlck92ZXJyaWRlcy5zaXplID09PSAwKSB7XG4gICAgcmV0dXJuIGRlZjtcbiAgfVxuICBjb25zdCBlbGVtZW50SW5kaWNlc1dpdGhPdmVyd3JpdHRlblByb3ZpZGVycyA9IGZpbmRFbGVtZW50SW5kaWNlc1dpdGhPdmVyd3JpdHRlblByb3ZpZGVycyhkZWYpO1xuICBpZiAoZWxlbWVudEluZGljZXNXaXRoT3ZlcndyaXR0ZW5Qcm92aWRlcnMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIGRlZjtcbiAgfVxuICAvLyBjbG9uZSB0aGUgd2hvbGUgdmlldyBkZWZpbml0aW9uLFxuICAvLyBhcyBpdCBtYWludGFpbnMgcmVmZXJlbmNlcyBiZXR3ZWVuIHRoZSBub2RlcyB0aGF0IGFyZSBoYXJkIHRvIHVwZGF0ZS5cbiAgZGVmID0gZGVmLmZhY3RvcnkgISgoKSA9PiBOT09QKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBlbGVtZW50SW5kaWNlc1dpdGhPdmVyd3JpdHRlblByb3ZpZGVycy5sZW5ndGg7IGkrKykge1xuICAgIGFwcGx5UHJvdmlkZXJPdmVycmlkZXNUb0VsZW1lbnQoZGVmLCBlbGVtZW50SW5kaWNlc1dpdGhPdmVyd3JpdHRlblByb3ZpZGVyc1tpXSk7XG4gIH1cbiAgcmV0dXJuIGRlZjtcblxuICBmdW5jdGlvbiBmaW5kRWxlbWVudEluZGljZXNXaXRoT3ZlcndyaXR0ZW5Qcm92aWRlcnMoZGVmOiBWaWV3RGVmaW5pdGlvbik6IG51bWJlcltdIHtcbiAgICBjb25zdCBlbEluZGljZXNXaXRoT3ZlcndyaXR0ZW5Qcm92aWRlcnM6IG51bWJlcltdID0gW107XG4gICAgbGV0IGxhc3RFbGVtZW50RGVmOiBOb2RlRGVmfG51bGwgPSBudWxsO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGVmLm5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBub2RlRGVmID0gZGVmLm5vZGVzW2ldO1xuICAgICAgaWYgKG5vZGVEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuVHlwZUVsZW1lbnQpIHtcbiAgICAgICAgbGFzdEVsZW1lbnREZWYgPSBub2RlRGVmO1xuICAgICAgfVxuICAgICAgaWYgKGxhc3RFbGVtZW50RGVmICYmIG5vZGVEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuQ2F0UHJvdmlkZXJOb0RpcmVjdGl2ZSAmJlxuICAgICAgICAgIHByb3ZpZGVyT3ZlcnJpZGVzLmhhcyhub2RlRGVmLnByb3ZpZGVyICEudG9rZW4pKSB7XG4gICAgICAgIGVsSW5kaWNlc1dpdGhPdmVyd3JpdHRlblByb3ZpZGVycy5wdXNoKGxhc3RFbGVtZW50RGVmICEubm9kZUluZGV4KTtcbiAgICAgICAgbGFzdEVsZW1lbnREZWYgPSBudWxsO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZWxJbmRpY2VzV2l0aE92ZXJ3cml0dGVuUHJvdmlkZXJzO1xuICB9XG5cbiAgZnVuY3Rpb24gYXBwbHlQcm92aWRlck92ZXJyaWRlc1RvRWxlbWVudCh2aWV3RGVmOiBWaWV3RGVmaW5pdGlvbiwgZWxJbmRleDogbnVtYmVyKSB7XG4gICAgZm9yIChsZXQgaSA9IGVsSW5kZXggKyAxOyBpIDwgdmlld0RlZi5ub2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3Qgbm9kZURlZiA9IHZpZXdEZWYubm9kZXNbaV07XG4gICAgICBpZiAobm9kZURlZi5mbGFncyAmIE5vZGVGbGFncy5UeXBlRWxlbWVudCkge1xuICAgICAgICAvLyBzdG9wIGF0IHRoZSBuZXh0IGVsZW1lbnRcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKG5vZGVEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuQ2F0UHJvdmlkZXJOb0RpcmVjdGl2ZSkge1xuICAgICAgICBjb25zdCBwcm92aWRlciA9IG5vZGVEZWYucHJvdmlkZXIgITtcbiAgICAgICAgY29uc3Qgb3ZlcnJpZGUgPSBwcm92aWRlck92ZXJyaWRlcy5nZXQocHJvdmlkZXIudG9rZW4pO1xuICAgICAgICBpZiAob3ZlcnJpZGUpIHtcbiAgICAgICAgICBub2RlRGVmLmZsYWdzID0gKG5vZGVEZWYuZmxhZ3MgJiB+Tm9kZUZsYWdzLkNhdFByb3ZpZGVyTm9EaXJlY3RpdmUpIHwgb3ZlcnJpZGUuZmxhZ3M7XG4gICAgICAgICAgcHJvdmlkZXIuZGVwcyA9IHNwbGl0RGVwc0RzbChvdmVycmlkZS5kZXBzKTtcbiAgICAgICAgICBwcm92aWRlci52YWx1ZSA9IG92ZXJyaWRlLnZhbHVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8vIE5vdGVzIGFib3V0IHRoZSBhbGdvcml0aG06XG4vLyBXZSBvbmx5IGNyZWF0ZSBuZXcgZGF0YXN0cnVjdHVyZXMgaWYgd2UgbmVlZCB0bywgdG8ga2VlcCBwZXJmIGltcGFjdFxuLy8gcmVhc29uYWJsZS5cbmZ1bmN0aW9uIGFwcGx5UHJvdmlkZXJPdmVycmlkZXNUb05nTW9kdWxlKGRlZjogTmdNb2R1bGVEZWZpbml0aW9uKTogTmdNb2R1bGVEZWZpbml0aW9uIHtcbiAgY29uc3Qge2hhc092ZXJyaWRlcywgaGFzRGVwcmVjYXRlZE92ZXJyaWRlc30gPSBjYWxjSGFzT3ZlcnJpZGVzKGRlZik7XG4gIGlmICghaGFzT3ZlcnJpZGVzKSB7XG4gICAgcmV0dXJuIGRlZjtcbiAgfVxuICAvLyBjbG9uZSB0aGUgd2hvbGUgdmlldyBkZWZpbml0aW9uLFxuICAvLyBhcyBpdCBtYWludGFpbnMgcmVmZXJlbmNlcyBiZXR3ZWVuIHRoZSBub2RlcyB0aGF0IGFyZSBoYXJkIHRvIHVwZGF0ZS5cbiAgZGVmID0gZGVmLmZhY3RvcnkgISgoKSA9PiBOT09QKTtcbiAgYXBwbHlQcm92aWRlck92ZXJyaWRlcyhkZWYpO1xuICByZXR1cm4gZGVmO1xuXG4gIGZ1bmN0aW9uIGNhbGNIYXNPdmVycmlkZXMoZGVmOiBOZ01vZHVsZURlZmluaXRpb24pOlxuICAgICAge2hhc092ZXJyaWRlczogYm9vbGVhbiwgaGFzRGVwcmVjYXRlZE92ZXJyaWRlczogYm9vbGVhbn0ge1xuICAgIGxldCBoYXNPdmVycmlkZXMgPSBmYWxzZTtcbiAgICBsZXQgaGFzRGVwcmVjYXRlZE92ZXJyaWRlcyA9IGZhbHNlO1xuICAgIGlmIChwcm92aWRlck92ZXJyaWRlcy5zaXplID09PSAwKSB7XG4gICAgICByZXR1cm4ge2hhc092ZXJyaWRlcywgaGFzRGVwcmVjYXRlZE92ZXJyaWRlc307XG4gICAgfVxuICAgIGRlZi5wcm92aWRlcnMuZm9yRWFjaChub2RlID0+IHtcbiAgICAgIGNvbnN0IG92ZXJyaWRlID0gcHJvdmlkZXJPdmVycmlkZXMuZ2V0KG5vZGUudG9rZW4pO1xuICAgICAgaWYgKChub2RlLmZsYWdzICYgTm9kZUZsYWdzLkNhdFByb3ZpZGVyTm9EaXJlY3RpdmUpICYmIG92ZXJyaWRlKSB7XG4gICAgICAgIGhhc092ZXJyaWRlcyA9IHRydWU7XG4gICAgICAgIGhhc0RlcHJlY2F0ZWRPdmVycmlkZXMgPSBoYXNEZXByZWNhdGVkT3ZlcnJpZGVzIHx8IG92ZXJyaWRlLmRlcHJlY2F0ZWRCZWhhdmlvcjtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBkZWYubW9kdWxlcy5mb3JFYWNoKG1vZHVsZSA9PiB7XG4gICAgICBwcm92aWRlck92ZXJyaWRlc1dpdGhTY29wZS5mb3JFYWNoKChvdmVycmlkZSwgdG9rZW4pID0+IHtcbiAgICAgICAgaWYgKHRva2VuLm5nSW5qZWN0YWJsZURlZi5wcm92aWRlZEluID09PSBtb2R1bGUpIHtcbiAgICAgICAgICBoYXNPdmVycmlkZXMgPSB0cnVlO1xuICAgICAgICAgIGhhc0RlcHJlY2F0ZWRPdmVycmlkZXMgPSBoYXNEZXByZWNhdGVkT3ZlcnJpZGVzIHx8IG92ZXJyaWRlLmRlcHJlY2F0ZWRCZWhhdmlvcjtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHtoYXNPdmVycmlkZXMsIGhhc0RlcHJlY2F0ZWRPdmVycmlkZXN9O1xuICB9XG5cbiAgZnVuY3Rpb24gYXBwbHlQcm92aWRlck92ZXJyaWRlcyhkZWY6IE5nTW9kdWxlRGVmaW5pdGlvbikge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGVmLnByb3ZpZGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgcHJvdmlkZXIgPSBkZWYucHJvdmlkZXJzW2ldO1xuICAgICAgaWYgKGhhc0RlcHJlY2F0ZWRPdmVycmlkZXMpIHtcbiAgICAgICAgLy8gV2UgaGFkIGEgYnVnIHdoZXJlIG1lIG1hZGVcbiAgICAgICAgLy8gYWxsIHByb3ZpZGVycyBsYXp5LiBLZWVwIHRoaXMgbG9naWMgYmVoaW5kIGEgZmxhZ1xuICAgICAgICAvLyBmb3IgbWlncmF0aW5nIGV4aXN0aW5nIHVzZXJzLlxuICAgICAgICBwcm92aWRlci5mbGFncyB8PSBOb2RlRmxhZ3MuTGF6eVByb3ZpZGVyO1xuICAgICAgfVxuICAgICAgY29uc3Qgb3ZlcnJpZGUgPSBwcm92aWRlck92ZXJyaWRlcy5nZXQocHJvdmlkZXIudG9rZW4pO1xuICAgICAgaWYgKG92ZXJyaWRlKSB7XG4gICAgICAgIHByb3ZpZGVyLmZsYWdzID0gKHByb3ZpZGVyLmZsYWdzICYgfk5vZGVGbGFncy5DYXRQcm92aWRlck5vRGlyZWN0aXZlKSB8IG92ZXJyaWRlLmZsYWdzO1xuICAgICAgICBwcm92aWRlci5kZXBzID0gc3BsaXREZXBzRHNsKG92ZXJyaWRlLmRlcHMpO1xuICAgICAgICBwcm92aWRlci52YWx1ZSA9IG92ZXJyaWRlLnZhbHVlO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAocHJvdmlkZXJPdmVycmlkZXNXaXRoU2NvcGUuc2l6ZSA+IDApIHtcbiAgICAgIGxldCBtb2R1bGVTZXQgPSBuZXcgU2V0PGFueT4oZGVmLm1vZHVsZXMpO1xuICAgICAgcHJvdmlkZXJPdmVycmlkZXNXaXRoU2NvcGUuZm9yRWFjaCgob3ZlcnJpZGUsIHRva2VuKSA9PiB7XG4gICAgICAgIGlmIChtb2R1bGVTZXQuaGFzKHRva2VuLm5nSW5qZWN0YWJsZURlZi5wcm92aWRlZEluKSkge1xuICAgICAgICAgIGxldCBwcm92aWRlciA9IHtcbiAgICAgICAgICAgIHRva2VuOiB0b2tlbixcbiAgICAgICAgICAgIGZsYWdzOlxuICAgICAgICAgICAgICAgIG92ZXJyaWRlLmZsYWdzIHwgKGhhc0RlcHJlY2F0ZWRPdmVycmlkZXMgPyBOb2RlRmxhZ3MuTGF6eVByb3ZpZGVyIDogTm9kZUZsYWdzLk5vbmUpLFxuICAgICAgICAgICAgZGVwczogc3BsaXREZXBzRHNsKG92ZXJyaWRlLmRlcHMpLFxuICAgICAgICAgICAgdmFsdWU6IG92ZXJyaWRlLnZhbHVlLFxuICAgICAgICAgICAgaW5kZXg6IGRlZi5wcm92aWRlcnMubGVuZ3RoLFxuICAgICAgICAgIH07XG4gICAgICAgICAgZGVmLnByb3ZpZGVycy5wdXNoKHByb3ZpZGVyKTtcbiAgICAgICAgICBkZWYucHJvdmlkZXJzQnlLZXlbdG9rZW5LZXkodG9rZW4pXSA9IHByb3ZpZGVyO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gcHJvZENoZWNrQW5kVXBkYXRlTm9kZShcbiAgICB2aWV3OiBWaWV3RGF0YSwgY2hlY2tJbmRleDogbnVtYmVyLCBhcmdTdHlsZTogQXJndW1lbnRUeXBlLCB2MD86IGFueSwgdjE/OiBhbnksIHYyPzogYW55LFxuICAgIHYzPzogYW55LCB2ND86IGFueSwgdjU/OiBhbnksIHY2PzogYW55LCB2Nz86IGFueSwgdjg/OiBhbnksIHY5PzogYW55KTogYW55IHtcbiAgY29uc3Qgbm9kZURlZiA9IHZpZXcuZGVmLm5vZGVzW2NoZWNrSW5kZXhdO1xuICBjaGVja0FuZFVwZGF0ZU5vZGUodmlldywgbm9kZURlZiwgYXJnU3R5bGUsIHYwLCB2MSwgdjIsIHYzLCB2NCwgdjUsIHY2LCB2NywgdjgsIHY5KTtcbiAgcmV0dXJuIChub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLkNhdFB1cmVFeHByZXNzaW9uKSA/XG4gICAgICBhc1B1cmVFeHByZXNzaW9uRGF0YSh2aWV3LCBjaGVja0luZGV4KS52YWx1ZSA6XG4gICAgICB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIHByb2RDaGVja05vQ2hhbmdlc05vZGUoXG4gICAgdmlldzogVmlld0RhdGEsIGNoZWNrSW5kZXg6IG51bWJlciwgYXJnU3R5bGU6IEFyZ3VtZW50VHlwZSwgdjA/OiBhbnksIHYxPzogYW55LCB2Mj86IGFueSxcbiAgICB2Mz86IGFueSwgdjQ/OiBhbnksIHY1PzogYW55LCB2Nj86IGFueSwgdjc/OiBhbnksIHY4PzogYW55LCB2OT86IGFueSk6IGFueSB7XG4gIGNvbnN0IG5vZGVEZWYgPSB2aWV3LmRlZi5ub2Rlc1tjaGVja0luZGV4XTtcbiAgY2hlY2tOb0NoYW5nZXNOb2RlKHZpZXcsIG5vZGVEZWYsIGFyZ1N0eWxlLCB2MCwgdjEsIHYyLCB2MywgdjQsIHY1LCB2NiwgdjcsIHY4LCB2OSk7XG4gIHJldHVybiAobm9kZURlZi5mbGFncyAmIE5vZGVGbGFncy5DYXRQdXJlRXhwcmVzc2lvbikgP1xuICAgICAgYXNQdXJlRXhwcmVzc2lvbkRhdGEodmlldywgY2hlY2tJbmRleCkudmFsdWUgOlxuICAgICAgdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBkZWJ1Z0NoZWNrQW5kVXBkYXRlVmlldyh2aWV3OiBWaWV3RGF0YSkge1xuICByZXR1cm4gY2FsbFdpdGhEZWJ1Z0NvbnRleHQoRGVidWdBY3Rpb24uZGV0ZWN0Q2hhbmdlcywgY2hlY2tBbmRVcGRhdGVWaWV3LCBudWxsLCBbdmlld10pO1xufVxuXG5mdW5jdGlvbiBkZWJ1Z0NoZWNrTm9DaGFuZ2VzVmlldyh2aWV3OiBWaWV3RGF0YSkge1xuICByZXR1cm4gY2FsbFdpdGhEZWJ1Z0NvbnRleHQoRGVidWdBY3Rpb24uY2hlY2tOb0NoYW5nZXMsIGNoZWNrTm9DaGFuZ2VzVmlldywgbnVsbCwgW3ZpZXddKTtcbn1cblxuZnVuY3Rpb24gZGVidWdEZXN0cm95Vmlldyh2aWV3OiBWaWV3RGF0YSkge1xuICByZXR1cm4gY2FsbFdpdGhEZWJ1Z0NvbnRleHQoRGVidWdBY3Rpb24uZGVzdHJveSwgZGVzdHJveVZpZXcsIG51bGwsIFt2aWV3XSk7XG59XG5cbmVudW0gRGVidWdBY3Rpb24ge1xuICBjcmVhdGUsXG4gIGRldGVjdENoYW5nZXMsXG4gIGNoZWNrTm9DaGFuZ2VzLFxuICBkZXN0cm95LFxuICBoYW5kbGVFdmVudFxufVxuXG5sZXQgX2N1cnJlbnRBY3Rpb246IERlYnVnQWN0aW9uO1xubGV0IF9jdXJyZW50VmlldzogVmlld0RhdGE7XG5sZXQgX2N1cnJlbnROb2RlSW5kZXg6IG51bWJlcnxudWxsO1xuXG5mdW5jdGlvbiBkZWJ1Z1NldEN1cnJlbnROb2RlKHZpZXc6IFZpZXdEYXRhLCBub2RlSW5kZXg6IG51bWJlciB8IG51bGwpIHtcbiAgX2N1cnJlbnRWaWV3ID0gdmlldztcbiAgX2N1cnJlbnROb2RlSW5kZXggPSBub2RlSW5kZXg7XG59XG5cbmZ1bmN0aW9uIGRlYnVnSGFuZGxlRXZlbnQodmlldzogVmlld0RhdGEsIG5vZGVJbmRleDogbnVtYmVyLCBldmVudE5hbWU6IHN0cmluZywgZXZlbnQ6IGFueSkge1xuICBkZWJ1Z1NldEN1cnJlbnROb2RlKHZpZXcsIG5vZGVJbmRleCk7XG4gIHJldHVybiBjYWxsV2l0aERlYnVnQ29udGV4dChcbiAgICAgIERlYnVnQWN0aW9uLmhhbmRsZUV2ZW50LCB2aWV3LmRlZi5oYW5kbGVFdmVudCwgbnVsbCwgW3ZpZXcsIG5vZGVJbmRleCwgZXZlbnROYW1lLCBldmVudF0pO1xufVxuXG5mdW5jdGlvbiBkZWJ1Z1VwZGF0ZURpcmVjdGl2ZXModmlldzogVmlld0RhdGEsIGNoZWNrVHlwZTogQ2hlY2tUeXBlKSB7XG4gIGlmICh2aWV3LnN0YXRlICYgVmlld1N0YXRlLkRlc3Ryb3llZCkge1xuICAgIHRocm93IHZpZXdEZXN0cm95ZWRFcnJvcihEZWJ1Z0FjdGlvbltfY3VycmVudEFjdGlvbl0pO1xuICB9XG4gIGRlYnVnU2V0Q3VycmVudE5vZGUodmlldywgbmV4dERpcmVjdGl2ZVdpdGhCaW5kaW5nKHZpZXcsIDApKTtcbiAgcmV0dXJuIHZpZXcuZGVmLnVwZGF0ZURpcmVjdGl2ZXMoZGVidWdDaGVja0RpcmVjdGl2ZXNGbiwgdmlldyk7XG5cbiAgZnVuY3Rpb24gZGVidWdDaGVja0RpcmVjdGl2ZXNGbihcbiAgICAgIHZpZXc6IFZpZXdEYXRhLCBub2RlSW5kZXg6IG51bWJlciwgYXJnU3R5bGU6IEFyZ3VtZW50VHlwZSwgLi4udmFsdWVzOiBhbnlbXSkge1xuICAgIGNvbnN0IG5vZGVEZWYgPSB2aWV3LmRlZi5ub2Rlc1tub2RlSW5kZXhdO1xuICAgIGlmIChjaGVja1R5cGUgPT09IENoZWNrVHlwZS5DaGVja0FuZFVwZGF0ZSkge1xuICAgICAgZGVidWdDaGVja0FuZFVwZGF0ZU5vZGUodmlldywgbm9kZURlZiwgYXJnU3R5bGUsIHZhbHVlcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlYnVnQ2hlY2tOb0NoYW5nZXNOb2RlKHZpZXcsIG5vZGVEZWYsIGFyZ1N0eWxlLCB2YWx1ZXMpO1xuICAgIH1cbiAgICBpZiAobm9kZURlZi5mbGFncyAmIE5vZGVGbGFncy5UeXBlRGlyZWN0aXZlKSB7XG4gICAgICBkZWJ1Z1NldEN1cnJlbnROb2RlKHZpZXcsIG5leHREaXJlY3RpdmVXaXRoQmluZGluZyh2aWV3LCBub2RlSW5kZXgpKTtcbiAgICB9XG4gICAgcmV0dXJuIChub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLkNhdFB1cmVFeHByZXNzaW9uKSA/XG4gICAgICAgIGFzUHVyZUV4cHJlc3Npb25EYXRhKHZpZXcsIG5vZGVEZWYubm9kZUluZGV4KS52YWx1ZSA6XG4gICAgICAgIHVuZGVmaW5lZDtcbiAgfVxufVxuXG5mdW5jdGlvbiBkZWJ1Z1VwZGF0ZVJlbmRlcmVyKHZpZXc6IFZpZXdEYXRhLCBjaGVja1R5cGU6IENoZWNrVHlwZSkge1xuICBpZiAodmlldy5zdGF0ZSAmIFZpZXdTdGF0ZS5EZXN0cm95ZWQpIHtcbiAgICB0aHJvdyB2aWV3RGVzdHJveWVkRXJyb3IoRGVidWdBY3Rpb25bX2N1cnJlbnRBY3Rpb25dKTtcbiAgfVxuICBkZWJ1Z1NldEN1cnJlbnROb2RlKHZpZXcsIG5leHRSZW5kZXJOb2RlV2l0aEJpbmRpbmcodmlldywgMCkpO1xuICByZXR1cm4gdmlldy5kZWYudXBkYXRlUmVuZGVyZXIoZGVidWdDaGVja1JlbmRlck5vZGVGbiwgdmlldyk7XG5cbiAgZnVuY3Rpb24gZGVidWdDaGVja1JlbmRlck5vZGVGbihcbiAgICAgIHZpZXc6IFZpZXdEYXRhLCBub2RlSW5kZXg6IG51bWJlciwgYXJnU3R5bGU6IEFyZ3VtZW50VHlwZSwgLi4udmFsdWVzOiBhbnlbXSkge1xuICAgIGNvbnN0IG5vZGVEZWYgPSB2aWV3LmRlZi5ub2Rlc1tub2RlSW5kZXhdO1xuICAgIGlmIChjaGVja1R5cGUgPT09IENoZWNrVHlwZS5DaGVja0FuZFVwZGF0ZSkge1xuICAgICAgZGVidWdDaGVja0FuZFVwZGF0ZU5vZGUodmlldywgbm9kZURlZiwgYXJnU3R5bGUsIHZhbHVlcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlYnVnQ2hlY2tOb0NoYW5nZXNOb2RlKHZpZXcsIG5vZGVEZWYsIGFyZ1N0eWxlLCB2YWx1ZXMpO1xuICAgIH1cbiAgICBpZiAobm9kZURlZi5mbGFncyAmIE5vZGVGbGFncy5DYXRSZW5kZXJOb2RlKSB7XG4gICAgICBkZWJ1Z1NldEN1cnJlbnROb2RlKHZpZXcsIG5leHRSZW5kZXJOb2RlV2l0aEJpbmRpbmcodmlldywgbm9kZUluZGV4KSk7XG4gICAgfVxuICAgIHJldHVybiAobm9kZURlZi5mbGFncyAmIE5vZGVGbGFncy5DYXRQdXJlRXhwcmVzc2lvbikgP1xuICAgICAgICBhc1B1cmVFeHByZXNzaW9uRGF0YSh2aWV3LCBub2RlRGVmLm5vZGVJbmRleCkudmFsdWUgOlxuICAgICAgICB1bmRlZmluZWQ7XG4gIH1cbn1cblxuZnVuY3Rpb24gZGVidWdDaGVja0FuZFVwZGF0ZU5vZGUoXG4gICAgdmlldzogVmlld0RhdGEsIG5vZGVEZWY6IE5vZGVEZWYsIGFyZ1N0eWxlOiBBcmd1bWVudFR5cGUsIGdpdmVuVmFsdWVzOiBhbnlbXSk6IHZvaWQge1xuICBjb25zdCBjaGFuZ2VkID0gKDxhbnk+Y2hlY2tBbmRVcGRhdGVOb2RlKSh2aWV3LCBub2RlRGVmLCBhcmdTdHlsZSwgLi4uZ2l2ZW5WYWx1ZXMpO1xuICBpZiAoY2hhbmdlZCkge1xuICAgIGNvbnN0IHZhbHVlcyA9IGFyZ1N0eWxlID09PSBBcmd1bWVudFR5cGUuRHluYW1pYyA/IGdpdmVuVmFsdWVzWzBdIDogZ2l2ZW5WYWx1ZXM7XG4gICAgaWYgKG5vZGVEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuVHlwZURpcmVjdGl2ZSkge1xuICAgICAgY29uc3QgYmluZGluZ1ZhbHVlczoge1trZXk6IHN0cmluZ106IHN0cmluZ30gPSB7fTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbm9kZURlZi5iaW5kaW5ncy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBiaW5kaW5nID0gbm9kZURlZi5iaW5kaW5nc1tpXTtcbiAgICAgICAgY29uc3QgdmFsdWUgPSB2YWx1ZXNbaV07XG4gICAgICAgIGlmIChiaW5kaW5nLmZsYWdzICYgQmluZGluZ0ZsYWdzLlR5cGVQcm9wZXJ0eSkge1xuICAgICAgICAgIGJpbmRpbmdWYWx1ZXNbbm9ybWFsaXplRGVidWdCaW5kaW5nTmFtZShiaW5kaW5nLm5vbk1pbmlmaWVkTmFtZSAhKV0gPVxuICAgICAgICAgICAgICBub3JtYWxpemVEZWJ1Z0JpbmRpbmdWYWx1ZSh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGNvbnN0IGVsRGVmID0gbm9kZURlZi5wYXJlbnQgITtcbiAgICAgIGNvbnN0IGVsID0gYXNFbGVtZW50RGF0YSh2aWV3LCBlbERlZi5ub2RlSW5kZXgpLnJlbmRlckVsZW1lbnQ7XG4gICAgICBpZiAoIWVsRGVmLmVsZW1lbnQgIS5uYW1lKSB7XG4gICAgICAgIC8vIGEgY29tbWVudC5cbiAgICAgICAgdmlldy5yZW5kZXJlci5zZXRWYWx1ZShlbCwgYGJpbmRpbmdzPSR7SlNPTi5zdHJpbmdpZnkoYmluZGluZ1ZhbHVlcywgbnVsbCwgMil9YCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBhIHJlZ3VsYXIgZWxlbWVudC5cbiAgICAgICAgZm9yIChsZXQgYXR0ciBpbiBiaW5kaW5nVmFsdWVzKSB7XG4gICAgICAgICAgY29uc3QgdmFsdWUgPSBiaW5kaW5nVmFsdWVzW2F0dHJdO1xuICAgICAgICAgIGlmICh2YWx1ZSAhPSBudWxsKSB7XG4gICAgICAgICAgICB2aWV3LnJlbmRlcmVyLnNldEF0dHJpYnV0ZShlbCwgYXR0ciwgdmFsdWUpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2aWV3LnJlbmRlcmVyLnJlbW92ZUF0dHJpYnV0ZShlbCwgYXR0cik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGRlYnVnQ2hlY2tOb0NoYW5nZXNOb2RlKFxuICAgIHZpZXc6IFZpZXdEYXRhLCBub2RlRGVmOiBOb2RlRGVmLCBhcmdTdHlsZTogQXJndW1lbnRUeXBlLCB2YWx1ZXM6IGFueVtdKTogdm9pZCB7XG4gICg8YW55PmNoZWNrTm9DaGFuZ2VzTm9kZSkodmlldywgbm9kZURlZiwgYXJnU3R5bGUsIC4uLnZhbHVlcyk7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZURlYnVnQmluZGluZ05hbWUobmFtZTogc3RyaW5nKSB7XG4gIC8vIEF0dHJpYnV0ZSBuYW1lcyB3aXRoIGAkYCAoZWcgYHgteSRgKSBhcmUgdmFsaWQgcGVyIHNwZWMsIGJ1dCB1bnN1cHBvcnRlZCBieSBzb21lIGJyb3dzZXJzXG4gIG5hbWUgPSBjYW1lbENhc2VUb0Rhc2hDYXNlKG5hbWUucmVwbGFjZSgvWyRAXS9nLCAnXycpKTtcbiAgcmV0dXJuIGBuZy1yZWZsZWN0LSR7bmFtZX1gO1xufVxuXG5jb25zdCBDQU1FTF9DQVNFX1JFR0VYUCA9IC8oW0EtWl0pL2c7XG5cbmZ1bmN0aW9uIGNhbWVsQ2FzZVRvRGFzaENhc2UoaW5wdXQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBpbnB1dC5yZXBsYWNlKENBTUVMX0NBU0VfUkVHRVhQLCAoLi4ubTogYW55W10pID0+ICctJyArIG1bMV0udG9Mb3dlckNhc2UoKSk7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZURlYnVnQmluZGluZ1ZhbHVlKHZhbHVlOiBhbnkpOiBzdHJpbmcge1xuICB0cnkge1xuICAgIC8vIExpbWl0IHRoZSBzaXplIG9mIHRoZSB2YWx1ZSBhcyBvdGhlcndpc2UgdGhlIERPTSBqdXN0IGdldHMgcG9sbHV0ZWQuXG4gICAgcmV0dXJuIHZhbHVlICE9IG51bGwgPyB2YWx1ZS50b1N0cmluZygpLnNsaWNlKDAsIDMwKSA6IHZhbHVlO1xuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuICdbRVJST1JdIEV4Y2VwdGlvbiB3aGlsZSB0cnlpbmcgdG8gc2VyaWFsaXplIHRoZSB2YWx1ZSc7XG4gIH1cbn1cblxuZnVuY3Rpb24gbmV4dERpcmVjdGl2ZVdpdGhCaW5kaW5nKHZpZXc6IFZpZXdEYXRhLCBub2RlSW5kZXg6IG51bWJlcik6IG51bWJlcnxudWxsIHtcbiAgZm9yIChsZXQgaSA9IG5vZGVJbmRleDsgaSA8IHZpZXcuZGVmLm5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qgbm9kZURlZiA9IHZpZXcuZGVmLm5vZGVzW2ldO1xuICAgIGlmIChub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLlR5cGVEaXJlY3RpdmUgJiYgbm9kZURlZi5iaW5kaW5ncyAmJiBub2RlRGVmLmJpbmRpbmdzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIGk7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBuZXh0UmVuZGVyTm9kZVdpdGhCaW5kaW5nKHZpZXc6IFZpZXdEYXRhLCBub2RlSW5kZXg6IG51bWJlcik6IG51bWJlcnxudWxsIHtcbiAgZm9yIChsZXQgaSA9IG5vZGVJbmRleDsgaSA8IHZpZXcuZGVmLm5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qgbm9kZURlZiA9IHZpZXcuZGVmLm5vZGVzW2ldO1xuICAgIGlmICgobm9kZURlZi5mbGFncyAmIE5vZGVGbGFncy5DYXRSZW5kZXJOb2RlKSAmJiBub2RlRGVmLmJpbmRpbmdzICYmIG5vZGVEZWYuYmluZGluZ3MubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gaTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmNsYXNzIERlYnVnQ29udGV4dF8gaW1wbGVtZW50cyBEZWJ1Z0NvbnRleHQge1xuICBwcml2YXRlIG5vZGVEZWY6IE5vZGVEZWY7XG4gIHByaXZhdGUgZWxWaWV3OiBWaWV3RGF0YTtcbiAgcHJpdmF0ZSBlbERlZjogTm9kZURlZjtcblxuICBjb25zdHJ1Y3RvcihwdWJsaWMgdmlldzogVmlld0RhdGEsIHB1YmxpYyBub2RlSW5kZXg6IG51bWJlcnxudWxsKSB7XG4gICAgaWYgKG5vZGVJbmRleCA9PSBudWxsKSB7XG4gICAgICB0aGlzLm5vZGVJbmRleCA9IG5vZGVJbmRleCA9IDA7XG4gICAgfVxuICAgIHRoaXMubm9kZURlZiA9IHZpZXcuZGVmLm5vZGVzW25vZGVJbmRleF07XG4gICAgbGV0IGVsRGVmID0gdGhpcy5ub2RlRGVmO1xuICAgIGxldCBlbFZpZXcgPSB2aWV3O1xuICAgIHdoaWxlIChlbERlZiAmJiAoZWxEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuVHlwZUVsZW1lbnQpID09PSAwKSB7XG4gICAgICBlbERlZiA9IGVsRGVmLnBhcmVudCAhO1xuICAgIH1cbiAgICBpZiAoIWVsRGVmKSB7XG4gICAgICB3aGlsZSAoIWVsRGVmICYmIGVsVmlldykge1xuICAgICAgICBlbERlZiA9IHZpZXdQYXJlbnRFbChlbFZpZXcpICE7XG4gICAgICAgIGVsVmlldyA9IGVsVmlldy5wYXJlbnQgITtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5lbERlZiA9IGVsRGVmO1xuICAgIHRoaXMuZWxWaWV3ID0gZWxWaWV3O1xuICB9XG5cbiAgcHJpdmF0ZSBnZXQgZWxPckNvbXBWaWV3KCkge1xuICAgIC8vIEhhcyB0byBiZSBkb25lIGxhemlseSBhcyB3ZSB1c2UgdGhlIERlYnVnQ29udGV4dCBhbHNvIGR1cmluZyBjcmVhdGlvbiBvZiBlbGVtZW50cy4uLlxuICAgIHJldHVybiBhc0VsZW1lbnREYXRhKHRoaXMuZWxWaWV3LCB0aGlzLmVsRGVmLm5vZGVJbmRleCkuY29tcG9uZW50VmlldyB8fCB0aGlzLnZpZXc7XG4gIH1cblxuICBnZXQgaW5qZWN0b3IoKTogSW5qZWN0b3IgeyByZXR1cm4gY3JlYXRlSW5qZWN0b3IodGhpcy5lbFZpZXcsIHRoaXMuZWxEZWYpOyB9XG5cbiAgZ2V0IGNvbXBvbmVudCgpOiBhbnkgeyByZXR1cm4gdGhpcy5lbE9yQ29tcFZpZXcuY29tcG9uZW50OyB9XG5cbiAgZ2V0IGNvbnRleHQoKTogYW55IHsgcmV0dXJuIHRoaXMuZWxPckNvbXBWaWV3LmNvbnRleHQ7IH1cblxuICBnZXQgcHJvdmlkZXJUb2tlbnMoKTogYW55W10ge1xuICAgIGNvbnN0IHRva2VuczogYW55W10gPSBbXTtcbiAgICBpZiAodGhpcy5lbERlZikge1xuICAgICAgZm9yIChsZXQgaSA9IHRoaXMuZWxEZWYubm9kZUluZGV4ICsgMTsgaSA8PSB0aGlzLmVsRGVmLm5vZGVJbmRleCArIHRoaXMuZWxEZWYuY2hpbGRDb3VudDtcbiAgICAgICAgICAgaSsrKSB7XG4gICAgICAgIGNvbnN0IGNoaWxkRGVmID0gdGhpcy5lbFZpZXcuZGVmLm5vZGVzW2ldO1xuICAgICAgICBpZiAoY2hpbGREZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuQ2F0UHJvdmlkZXIpIHtcbiAgICAgICAgICB0b2tlbnMucHVzaChjaGlsZERlZi5wcm92aWRlciAhLnRva2VuKTtcbiAgICAgICAgfVxuICAgICAgICBpICs9IGNoaWxkRGVmLmNoaWxkQ291bnQ7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0b2tlbnM7XG4gIH1cblxuICBnZXQgcmVmZXJlbmNlcygpOiB7W2tleTogc3RyaW5nXTogYW55fSB7XG4gICAgY29uc3QgcmVmZXJlbmNlczoge1trZXk6IHN0cmluZ106IGFueX0gPSB7fTtcbiAgICBpZiAodGhpcy5lbERlZikge1xuICAgICAgY29sbGVjdFJlZmVyZW5jZXModGhpcy5lbFZpZXcsIHRoaXMuZWxEZWYsIHJlZmVyZW5jZXMpO1xuXG4gICAgICBmb3IgKGxldCBpID0gdGhpcy5lbERlZi5ub2RlSW5kZXggKyAxOyBpIDw9IHRoaXMuZWxEZWYubm9kZUluZGV4ICsgdGhpcy5lbERlZi5jaGlsZENvdW50O1xuICAgICAgICAgICBpKyspIHtcbiAgICAgICAgY29uc3QgY2hpbGREZWYgPSB0aGlzLmVsVmlldy5kZWYubm9kZXNbaV07XG4gICAgICAgIGlmIChjaGlsZERlZi5mbGFncyAmIE5vZGVGbGFncy5DYXRQcm92aWRlcikge1xuICAgICAgICAgIGNvbGxlY3RSZWZlcmVuY2VzKHRoaXMuZWxWaWV3LCBjaGlsZERlZiwgcmVmZXJlbmNlcyk7XG4gICAgICAgIH1cbiAgICAgICAgaSArPSBjaGlsZERlZi5jaGlsZENvdW50O1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVmZXJlbmNlcztcbiAgfVxuXG4gIGdldCBjb21wb25lbnRSZW5kZXJFbGVtZW50KCkge1xuICAgIGNvbnN0IGVsRGF0YSA9IGZpbmRIb3N0RWxlbWVudCh0aGlzLmVsT3JDb21wVmlldyk7XG4gICAgcmV0dXJuIGVsRGF0YSA/IGVsRGF0YS5yZW5kZXJFbGVtZW50IDogdW5kZWZpbmVkO1xuICB9XG5cbiAgZ2V0IHJlbmRlck5vZGUoKTogYW55IHtcbiAgICByZXR1cm4gdGhpcy5ub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLlR5cGVUZXh0ID8gcmVuZGVyTm9kZSh0aGlzLnZpZXcsIHRoaXMubm9kZURlZikgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW5kZXJOb2RlKHRoaXMuZWxWaWV3LCB0aGlzLmVsRGVmKTtcbiAgfVxuXG4gIGxvZ0Vycm9yKGNvbnNvbGU6IENvbnNvbGUsIC4uLnZhbHVlczogYW55W10pIHtcbiAgICBsZXQgbG9nVmlld0RlZjogVmlld0RlZmluaXRpb247XG4gICAgbGV0IGxvZ05vZGVJbmRleDogbnVtYmVyO1xuICAgIGlmICh0aGlzLm5vZGVEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuVHlwZVRleHQpIHtcbiAgICAgIGxvZ1ZpZXdEZWYgPSB0aGlzLnZpZXcuZGVmO1xuICAgICAgbG9nTm9kZUluZGV4ID0gdGhpcy5ub2RlRGVmLm5vZGVJbmRleDtcbiAgICB9IGVsc2Uge1xuICAgICAgbG9nVmlld0RlZiA9IHRoaXMuZWxWaWV3LmRlZjtcbiAgICAgIGxvZ05vZGVJbmRleCA9IHRoaXMuZWxEZWYubm9kZUluZGV4O1xuICAgIH1cbiAgICAvLyBOb3RlOiB3ZSBvbmx5IGdlbmVyYXRlIGEgbG9nIGZ1bmN0aW9uIGZvciB0ZXh0IGFuZCBlbGVtZW50IG5vZGVzXG4gICAgLy8gdG8gbWFrZSB0aGUgZ2VuZXJhdGVkIGNvZGUgYXMgc21hbGwgYXMgcG9zc2libGUuXG4gICAgY29uc3QgcmVuZGVyTm9kZUluZGV4ID0gZ2V0UmVuZGVyTm9kZUluZGV4KGxvZ1ZpZXdEZWYsIGxvZ05vZGVJbmRleCk7XG4gICAgbGV0IGN1cnJSZW5kZXJOb2RlSW5kZXggPSAtMTtcbiAgICBsZXQgbm9kZUxvZ2dlcjogTm9kZUxvZ2dlciA9ICgpID0+IHtcbiAgICAgIGN1cnJSZW5kZXJOb2RlSW5kZXgrKztcbiAgICAgIGlmIChjdXJyUmVuZGVyTm9kZUluZGV4ID09PSByZW5kZXJOb2RlSW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIGNvbnNvbGUuZXJyb3IuYmluZChjb25zb2xlLCAuLi52YWx1ZXMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIE5PT1A7XG4gICAgICB9XG4gICAgfTtcbiAgICBsb2dWaWV3RGVmLmZhY3RvcnkgIShub2RlTG9nZ2VyKTtcbiAgICBpZiAoY3VyclJlbmRlck5vZGVJbmRleCA8IHJlbmRlck5vZGVJbmRleCkge1xuICAgICAgY29uc29sZS5lcnJvcignSWxsZWdhbCBzdGF0ZTogdGhlIFZpZXdEZWZpbml0aW9uRmFjdG9yeSBkaWQgbm90IGNhbGwgdGhlIGxvZ2dlciEnKTtcbiAgICAgICg8YW55PmNvbnNvbGUuZXJyb3IpKC4uLnZhbHVlcyk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGdldFJlbmRlck5vZGVJbmRleCh2aWV3RGVmOiBWaWV3RGVmaW5pdGlvbiwgbm9kZUluZGV4OiBudW1iZXIpOiBudW1iZXIge1xuICBsZXQgcmVuZGVyTm9kZUluZGV4ID0gLTE7XG4gIGZvciAobGV0IGkgPSAwOyBpIDw9IG5vZGVJbmRleDsgaSsrKSB7XG4gICAgY29uc3Qgbm9kZURlZiA9IHZpZXdEZWYubm9kZXNbaV07XG4gICAgaWYgKG5vZGVEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuQ2F0UmVuZGVyTm9kZSkge1xuICAgICAgcmVuZGVyTm9kZUluZGV4Kys7XG4gICAgfVxuICB9XG4gIHJldHVybiByZW5kZXJOb2RlSW5kZXg7XG59XG5cbmZ1bmN0aW9uIGZpbmRIb3N0RWxlbWVudCh2aWV3OiBWaWV3RGF0YSk6IEVsZW1lbnREYXRhfG51bGwge1xuICB3aGlsZSAodmlldyAmJiAhaXNDb21wb25lbnRWaWV3KHZpZXcpKSB7XG4gICAgdmlldyA9IHZpZXcucGFyZW50ICE7XG4gIH1cbiAgaWYgKHZpZXcucGFyZW50KSB7XG4gICAgcmV0dXJuIGFzRWxlbWVudERhdGEodmlldy5wYXJlbnQsIHZpZXdQYXJlbnRFbCh2aWV3KSAhLm5vZGVJbmRleCk7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIGNvbGxlY3RSZWZlcmVuY2VzKHZpZXc6IFZpZXdEYXRhLCBub2RlRGVmOiBOb2RlRGVmLCByZWZlcmVuY2VzOiB7W2tleTogc3RyaW5nXTogYW55fSkge1xuICBmb3IgKGxldCByZWZOYW1lIGluIG5vZGVEZWYucmVmZXJlbmNlcykge1xuICAgIHJlZmVyZW5jZXNbcmVmTmFtZV0gPSBnZXRRdWVyeVZhbHVlKHZpZXcsIG5vZGVEZWYsIG5vZGVEZWYucmVmZXJlbmNlc1tyZWZOYW1lXSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gY2FsbFdpdGhEZWJ1Z0NvbnRleHQoYWN0aW9uOiBEZWJ1Z0FjdGlvbiwgZm46IGFueSwgc2VsZjogYW55LCBhcmdzOiBhbnlbXSkge1xuICBjb25zdCBvbGRBY3Rpb24gPSBfY3VycmVudEFjdGlvbjtcbiAgY29uc3Qgb2xkVmlldyA9IF9jdXJyZW50VmlldztcbiAgY29uc3Qgb2xkTm9kZUluZGV4ID0gX2N1cnJlbnROb2RlSW5kZXg7XG4gIHRyeSB7XG4gICAgX2N1cnJlbnRBY3Rpb24gPSBhY3Rpb247XG4gICAgY29uc3QgcmVzdWx0ID0gZm4uYXBwbHkoc2VsZiwgYXJncyk7XG4gICAgX2N1cnJlbnRWaWV3ID0gb2xkVmlldztcbiAgICBfY3VycmVudE5vZGVJbmRleCA9IG9sZE5vZGVJbmRleDtcbiAgICBfY3VycmVudEFjdGlvbiA9IG9sZEFjdGlvbjtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9IGNhdGNoIChlKSB7XG4gICAgaWYgKGlzVmlld0RlYnVnRXJyb3IoZSkgfHwgIV9jdXJyZW50Vmlldykge1xuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gICAgdGhyb3cgdmlld1dyYXBwZWREZWJ1Z0Vycm9yKGUsIGdldEN1cnJlbnREZWJ1Z0NvbnRleHQoKSAhKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q3VycmVudERlYnVnQ29udGV4dCgpOiBEZWJ1Z0NvbnRleHR8bnVsbCB7XG4gIHJldHVybiBfY3VycmVudFZpZXcgPyBuZXcgRGVidWdDb250ZXh0XyhfY3VycmVudFZpZXcsIF9jdXJyZW50Tm9kZUluZGV4KSA6IG51bGw7XG59XG5cbmV4cG9ydCBjbGFzcyBEZWJ1Z1JlbmRlcmVyRmFjdG9yeTIgaW1wbGVtZW50cyBSZW5kZXJlckZhY3RvcnkyIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBkZWxlZ2F0ZTogUmVuZGVyZXJGYWN0b3J5Mikge31cblxuICBjcmVhdGVSZW5kZXJlcihlbGVtZW50OiBhbnksIHJlbmRlckRhdGE6IFJlbmRlcmVyVHlwZTJ8bnVsbCk6IFJlbmRlcmVyMiB7XG4gICAgcmV0dXJuIG5ldyBEZWJ1Z1JlbmRlcmVyMih0aGlzLmRlbGVnYXRlLmNyZWF0ZVJlbmRlcmVyKGVsZW1lbnQsIHJlbmRlckRhdGEpKTtcbiAgfVxuXG4gIGJlZ2luKCkge1xuICAgIGlmICh0aGlzLmRlbGVnYXRlLmJlZ2luKSB7XG4gICAgICB0aGlzLmRlbGVnYXRlLmJlZ2luKCk7XG4gICAgfVxuICB9XG4gIGVuZCgpIHtcbiAgICBpZiAodGhpcy5kZWxlZ2F0ZS5lbmQpIHtcbiAgICAgIHRoaXMuZGVsZWdhdGUuZW5kKCk7XG4gICAgfVxuICB9XG5cbiAgd2hlblJlbmRlcmluZ0RvbmUoKTogUHJvbWlzZTxhbnk+IHtcbiAgICBpZiAodGhpcy5kZWxlZ2F0ZS53aGVuUmVuZGVyaW5nRG9uZSkge1xuICAgICAgcmV0dXJuIHRoaXMuZGVsZWdhdGUud2hlblJlbmRlcmluZ0RvbmUoKTtcbiAgICB9XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShudWxsKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRGVidWdSZW5kZXJlcjIgaW1wbGVtZW50cyBSZW5kZXJlcjIge1xuICByZWFkb25seSBkYXRhOiB7W2tleTogc3RyaW5nXTogYW55fTtcblxuICAvKipcbiAgICogRmFjdG9yeSBmdW5jdGlvbiB1c2VkIHRvIGNyZWF0ZSBhIGBEZWJ1Z0NvbnRleHRgIHdoZW4gYSBub2RlIGlzIGNyZWF0ZWQuXG4gICAqXG4gICAqIFRoZSBgRGVidWdDb250ZXh0YCBhbGxvd3MgdG8gcmV0cmlldmUgaW5mb3JtYXRpb24gYWJvdXQgdGhlIG5vZGVzIHRoYXQgYXJlIHVzZWZ1bCBpbiB0ZXN0cy5cbiAgICpcbiAgICogVGhlIGZhY3RvcnkgaXMgY29uZmlndXJhYmxlIHNvIHRoYXQgdGhlIGBEZWJ1Z1JlbmRlcmVyMmAgY291bGQgaW5zdGFudGlhdGUgZWl0aGVyIGEgVmlldyBFbmdpbmVcbiAgICogb3IgYSBSZW5kZXIgY29udGV4dC5cbiAgICovXG4gIGRlYnVnQ29udGV4dEZhY3Rvcnk6ICgpID0+IERlYnVnQ29udGV4dCB8IG51bGwgPSBnZXRDdXJyZW50RGVidWdDb250ZXh0O1xuXG4gIHByaXZhdGUgZ2V0IGRlYnVnQ29udGV4dCgpIHsgcmV0dXJuIHRoaXMuZGVidWdDb250ZXh0RmFjdG9yeSgpOyB9XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBkZWxlZ2F0ZTogUmVuZGVyZXIyKSB7IHRoaXMuZGF0YSA9IHRoaXMuZGVsZWdhdGUuZGF0YTsgfVxuXG4gIGRlc3Ryb3lOb2RlKG5vZGU6IGFueSkge1xuICAgIHJlbW92ZURlYnVnTm9kZUZyb21JbmRleChnZXREZWJ1Z05vZGUobm9kZSkgISk7XG4gICAgaWYgKHRoaXMuZGVsZWdhdGUuZGVzdHJveU5vZGUpIHtcbiAgICAgIHRoaXMuZGVsZWdhdGUuZGVzdHJveU5vZGUobm9kZSk7XG4gICAgfVxuICB9XG5cbiAgZGVzdHJveSgpIHsgdGhpcy5kZWxlZ2F0ZS5kZXN0cm95KCk7IH1cblxuICBjcmVhdGVFbGVtZW50KG5hbWU6IHN0cmluZywgbmFtZXNwYWNlPzogc3RyaW5nKTogYW55IHtcbiAgICBjb25zdCBlbCA9IHRoaXMuZGVsZWdhdGUuY3JlYXRlRWxlbWVudChuYW1lLCBuYW1lc3BhY2UpO1xuICAgIGNvbnN0IGRlYnVnQ3R4ID0gdGhpcy5kZWJ1Z0NvbnRleHQ7XG4gICAgaWYgKGRlYnVnQ3R4KSB7XG4gICAgICBjb25zdCBkZWJ1Z0VsID0gbmV3IERlYnVnRWxlbWVudChlbCwgbnVsbCwgZGVidWdDdHgpO1xuICAgICAgZGVidWdFbC5uYW1lID0gbmFtZTtcbiAgICAgIGluZGV4RGVidWdOb2RlKGRlYnVnRWwpO1xuICAgIH1cbiAgICByZXR1cm4gZWw7XG4gIH1cblxuICBjcmVhdGVDb21tZW50KHZhbHVlOiBzdHJpbmcpOiBhbnkge1xuICAgIGNvbnN0IGNvbW1lbnQgPSB0aGlzLmRlbGVnYXRlLmNyZWF0ZUNvbW1lbnQodmFsdWUpO1xuICAgIGNvbnN0IGRlYnVnQ3R4ID0gdGhpcy5kZWJ1Z0NvbnRleHQ7XG4gICAgaWYgKGRlYnVnQ3R4KSB7XG4gICAgICBpbmRleERlYnVnTm9kZShuZXcgRGVidWdOb2RlKGNvbW1lbnQsIG51bGwsIGRlYnVnQ3R4KSk7XG4gICAgfVxuICAgIHJldHVybiBjb21tZW50O1xuICB9XG5cbiAgY3JlYXRlVGV4dCh2YWx1ZTogc3RyaW5nKTogYW55IHtcbiAgICBjb25zdCB0ZXh0ID0gdGhpcy5kZWxlZ2F0ZS5jcmVhdGVUZXh0KHZhbHVlKTtcbiAgICBjb25zdCBkZWJ1Z0N0eCA9IHRoaXMuZGVidWdDb250ZXh0O1xuICAgIGlmIChkZWJ1Z0N0eCkge1xuICAgICAgaW5kZXhEZWJ1Z05vZGUobmV3IERlYnVnTm9kZSh0ZXh0LCBudWxsLCBkZWJ1Z0N0eCkpO1xuICAgIH1cbiAgICByZXR1cm4gdGV4dDtcbiAgfVxuXG4gIGFwcGVuZENoaWxkKHBhcmVudDogYW55LCBuZXdDaGlsZDogYW55KTogdm9pZCB7XG4gICAgY29uc3QgZGVidWdFbCA9IGdldERlYnVnTm9kZShwYXJlbnQpO1xuICAgIGNvbnN0IGRlYnVnQ2hpbGRFbCA9IGdldERlYnVnTm9kZShuZXdDaGlsZCk7XG4gICAgaWYgKGRlYnVnRWwgJiYgZGVidWdDaGlsZEVsICYmIGRlYnVnRWwgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnQpIHtcbiAgICAgIGRlYnVnRWwuYWRkQ2hpbGQoZGVidWdDaGlsZEVsKTtcbiAgICB9XG4gICAgdGhpcy5kZWxlZ2F0ZS5hcHBlbmRDaGlsZChwYXJlbnQsIG5ld0NoaWxkKTtcbiAgfVxuXG4gIGluc2VydEJlZm9yZShwYXJlbnQ6IGFueSwgbmV3Q2hpbGQ6IGFueSwgcmVmQ2hpbGQ6IGFueSk6IHZvaWQge1xuICAgIGNvbnN0IGRlYnVnRWwgPSBnZXREZWJ1Z05vZGUocGFyZW50KTtcbiAgICBjb25zdCBkZWJ1Z0NoaWxkRWwgPSBnZXREZWJ1Z05vZGUobmV3Q2hpbGQpO1xuICAgIGNvbnN0IGRlYnVnUmVmRWwgPSBnZXREZWJ1Z05vZGUocmVmQ2hpbGQpICE7XG4gICAgaWYgKGRlYnVnRWwgJiYgZGVidWdDaGlsZEVsICYmIGRlYnVnRWwgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnQpIHtcbiAgICAgIGRlYnVnRWwuaW5zZXJ0QmVmb3JlKGRlYnVnUmVmRWwsIGRlYnVnQ2hpbGRFbCk7XG4gICAgfVxuXG4gICAgdGhpcy5kZWxlZ2F0ZS5pbnNlcnRCZWZvcmUocGFyZW50LCBuZXdDaGlsZCwgcmVmQ2hpbGQpO1xuICB9XG5cbiAgcmVtb3ZlQ2hpbGQocGFyZW50OiBhbnksIG9sZENoaWxkOiBhbnkpOiB2b2lkIHtcbiAgICBjb25zdCBkZWJ1Z0VsID0gZ2V0RGVidWdOb2RlKHBhcmVudCk7XG4gICAgY29uc3QgZGVidWdDaGlsZEVsID0gZ2V0RGVidWdOb2RlKG9sZENoaWxkKTtcbiAgICBpZiAoZGVidWdFbCAmJiBkZWJ1Z0NoaWxkRWwgJiYgZGVidWdFbCBpbnN0YW5jZW9mIERlYnVnRWxlbWVudCkge1xuICAgICAgZGVidWdFbC5yZW1vdmVDaGlsZChkZWJ1Z0NoaWxkRWwpO1xuICAgIH1cbiAgICB0aGlzLmRlbGVnYXRlLnJlbW92ZUNoaWxkKHBhcmVudCwgb2xkQ2hpbGQpO1xuICB9XG5cbiAgc2VsZWN0Um9vdEVsZW1lbnQoc2VsZWN0b3JPck5vZGU6IHN0cmluZ3xhbnkpOiBhbnkge1xuICAgIGNvbnN0IGVsID0gdGhpcy5kZWxlZ2F0ZS5zZWxlY3RSb290RWxlbWVudChzZWxlY3Rvck9yTm9kZSk7XG4gICAgY29uc3QgZGVidWdDdHggPSB0aGlzLmRlYnVnQ29udGV4dDtcbiAgICBpZiAoZGVidWdDdHgpIHtcbiAgICAgIGluZGV4RGVidWdOb2RlKG5ldyBEZWJ1Z0VsZW1lbnQoZWwsIG51bGwsIGRlYnVnQ3R4KSk7XG4gICAgfVxuICAgIHJldHVybiBlbDtcbiAgfVxuXG4gIHNldEF0dHJpYnV0ZShlbDogYW55LCBuYW1lOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcsIG5hbWVzcGFjZT86IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IGRlYnVnRWwgPSBnZXREZWJ1Z05vZGUoZWwpO1xuICAgIGlmIChkZWJ1Z0VsICYmIGRlYnVnRWwgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnQpIHtcbiAgICAgIGNvbnN0IGZ1bGxOYW1lID0gbmFtZXNwYWNlID8gbmFtZXNwYWNlICsgJzonICsgbmFtZSA6IG5hbWU7XG4gICAgICBkZWJ1Z0VsLmF0dHJpYnV0ZXNbZnVsbE5hbWVdID0gdmFsdWU7XG4gICAgfVxuICAgIHRoaXMuZGVsZWdhdGUuc2V0QXR0cmlidXRlKGVsLCBuYW1lLCB2YWx1ZSwgbmFtZXNwYWNlKTtcbiAgfVxuXG4gIHJlbW92ZUF0dHJpYnV0ZShlbDogYW55LCBuYW1lOiBzdHJpbmcsIG5hbWVzcGFjZT86IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IGRlYnVnRWwgPSBnZXREZWJ1Z05vZGUoZWwpO1xuICAgIGlmIChkZWJ1Z0VsICYmIGRlYnVnRWwgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnQpIHtcbiAgICAgIGNvbnN0IGZ1bGxOYW1lID0gbmFtZXNwYWNlID8gbmFtZXNwYWNlICsgJzonICsgbmFtZSA6IG5hbWU7XG4gICAgICBkZWJ1Z0VsLmF0dHJpYnV0ZXNbZnVsbE5hbWVdID0gbnVsbDtcbiAgICB9XG4gICAgdGhpcy5kZWxlZ2F0ZS5yZW1vdmVBdHRyaWJ1dGUoZWwsIG5hbWUsIG5hbWVzcGFjZSk7XG4gIH1cblxuICBhZGRDbGFzcyhlbDogYW55LCBuYW1lOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCBkZWJ1Z0VsID0gZ2V0RGVidWdOb2RlKGVsKTtcbiAgICBpZiAoZGVidWdFbCAmJiBkZWJ1Z0VsIGluc3RhbmNlb2YgRGVidWdFbGVtZW50KSB7XG4gICAgICBkZWJ1Z0VsLmNsYXNzZXNbbmFtZV0gPSB0cnVlO1xuICAgIH1cbiAgICB0aGlzLmRlbGVnYXRlLmFkZENsYXNzKGVsLCBuYW1lKTtcbiAgfVxuXG4gIHJlbW92ZUNsYXNzKGVsOiBhbnksIG5hbWU6IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IGRlYnVnRWwgPSBnZXREZWJ1Z05vZGUoZWwpO1xuICAgIGlmIChkZWJ1Z0VsICYmIGRlYnVnRWwgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnQpIHtcbiAgICAgIGRlYnVnRWwuY2xhc3Nlc1tuYW1lXSA9IGZhbHNlO1xuICAgIH1cbiAgICB0aGlzLmRlbGVnYXRlLnJlbW92ZUNsYXNzKGVsLCBuYW1lKTtcbiAgfVxuXG4gIHNldFN0eWxlKGVsOiBhbnksIHN0eWxlOiBzdHJpbmcsIHZhbHVlOiBhbnksIGZsYWdzOiBSZW5kZXJlclN0eWxlRmxhZ3MyKTogdm9pZCB7XG4gICAgY29uc3QgZGVidWdFbCA9IGdldERlYnVnTm9kZShlbCk7XG4gICAgaWYgKGRlYnVnRWwgJiYgZGVidWdFbCBpbnN0YW5jZW9mIERlYnVnRWxlbWVudCkge1xuICAgICAgZGVidWdFbC5zdHlsZXNbc3R5bGVdID0gdmFsdWU7XG4gICAgfVxuICAgIHRoaXMuZGVsZWdhdGUuc2V0U3R5bGUoZWwsIHN0eWxlLCB2YWx1ZSwgZmxhZ3MpO1xuICB9XG5cbiAgcmVtb3ZlU3R5bGUoZWw6IGFueSwgc3R5bGU6IHN0cmluZywgZmxhZ3M6IFJlbmRlcmVyU3R5bGVGbGFnczIpOiB2b2lkIHtcbiAgICBjb25zdCBkZWJ1Z0VsID0gZ2V0RGVidWdOb2RlKGVsKTtcbiAgICBpZiAoZGVidWdFbCAmJiBkZWJ1Z0VsIGluc3RhbmNlb2YgRGVidWdFbGVtZW50KSB7XG4gICAgICBkZWJ1Z0VsLnN0eWxlc1tzdHlsZV0gPSBudWxsO1xuICAgIH1cbiAgICB0aGlzLmRlbGVnYXRlLnJlbW92ZVN0eWxlKGVsLCBzdHlsZSwgZmxhZ3MpO1xuICB9XG5cbiAgc2V0UHJvcGVydHkoZWw6IGFueSwgbmFtZTogc3RyaW5nLCB2YWx1ZTogYW55KTogdm9pZCB7XG4gICAgY29uc3QgZGVidWdFbCA9IGdldERlYnVnTm9kZShlbCk7XG4gICAgaWYgKGRlYnVnRWwgJiYgZGVidWdFbCBpbnN0YW5jZW9mIERlYnVnRWxlbWVudCkge1xuICAgICAgZGVidWdFbC5wcm9wZXJ0aWVzW25hbWVdID0gdmFsdWU7XG4gICAgfVxuICAgIHRoaXMuZGVsZWdhdGUuc2V0UHJvcGVydHkoZWwsIG5hbWUsIHZhbHVlKTtcbiAgfVxuXG4gIGxpc3RlbihcbiAgICAgIHRhcmdldDogJ2RvY3VtZW50J3wnd2luZG93cyd8J2JvZHknfGFueSwgZXZlbnROYW1lOiBzdHJpbmcsXG4gICAgICBjYWxsYmFjazogKGV2ZW50OiBhbnkpID0+IGJvb2xlYW4pOiAoKSA9PiB2b2lkIHtcbiAgICBpZiAodHlwZW9mIHRhcmdldCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIGNvbnN0IGRlYnVnRWwgPSBnZXREZWJ1Z05vZGUodGFyZ2V0KTtcbiAgICAgIGlmIChkZWJ1Z0VsKSB7XG4gICAgICAgIGRlYnVnRWwubGlzdGVuZXJzLnB1c2gobmV3IEV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCBjYWxsYmFjaykpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmRlbGVnYXRlLmxpc3Rlbih0YXJnZXQsIGV2ZW50TmFtZSwgY2FsbGJhY2spO1xuICB9XG5cbiAgcGFyZW50Tm9kZShub2RlOiBhbnkpOiBhbnkgeyByZXR1cm4gdGhpcy5kZWxlZ2F0ZS5wYXJlbnROb2RlKG5vZGUpOyB9XG4gIG5leHRTaWJsaW5nKG5vZGU6IGFueSk6IGFueSB7IHJldHVybiB0aGlzLmRlbGVnYXRlLm5leHRTaWJsaW5nKG5vZGUpOyB9XG4gIHNldFZhbHVlKG5vZGU6IGFueSwgdmFsdWU6IHN0cmluZyk6IHZvaWQgeyByZXR1cm4gdGhpcy5kZWxlZ2F0ZS5zZXRWYWx1ZShub2RlLCB2YWx1ZSk7IH1cbn1cbiJdfQ==