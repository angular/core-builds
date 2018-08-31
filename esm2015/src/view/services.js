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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmljZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy92aWV3L3NlcnZpY2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLFlBQVksRUFBRSxTQUFTLEVBQUUsYUFBYSxFQUFFLFlBQVksRUFBRSxjQUFjLEVBQUUsd0JBQXdCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUduSSxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDOUMsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBR3pDLE9BQU8sRUFBWSxnQkFBZ0IsRUFBcUMsTUFBTSxlQUFlLENBQUM7QUFDOUYsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBRW5ELE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFFdEMsT0FBTyxFQUFDLGdCQUFnQixFQUFFLGtCQUFrQixFQUFFLHFCQUFxQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3JGLE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFDdEMsT0FBTyxFQUFDLGtCQUFrQixFQUFFLGFBQWEsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUMxRCxPQUFPLEVBQUMsY0FBYyxFQUFFLGlCQUFpQixFQUFFLGlDQUFpQyxFQUFDLE1BQU0sUUFBUSxDQUFDO0FBQzVGLE9BQU8sRUFBbUosUUFBUSxFQUF1QyxhQUFhLEVBQUUsb0JBQW9CLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFDN1AsT0FBTyxFQUFDLElBQUksRUFBRSxlQUFlLEVBQUUsVUFBVSxFQUFFLGlCQUFpQixFQUFFLFlBQVksRUFBRSxZQUFZLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFDeEcsT0FBTyxFQUFDLGtCQUFrQixFQUFFLGtCQUFrQixFQUFFLGtCQUFrQixFQUFFLGtC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QUFZLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDakMsSUFBSSxPQUFPLElBQUksT0FBTyxZQUFZLFlBQVksRUFBRTtZQUM5QyxPQUFPLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQztTQUNsQztRQUNELElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7S0FDNUM7Ozs7Ozs7SUFFRCxNQUFNLENBQ0YsTUFBdUMsRUFBRSxTQUFpQixFQUMxRCxRQUFpQztRQUNuQyxJQUFJLE9BQU8sTUFBTSxLQUFLLFFBQVEsRUFBRTs7WUFDOUIsTUFBTSxPQUFPLEdBQUcsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3JDLElBQUksT0FBTyxFQUFFO2dCQUNYLE9BQU8sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksYUFBYSxDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO2FBQ2hFO1NBQ0Y7UUFFRCxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUM7S0FDMUQ7Ozs7O0lBRUQsVUFBVSxDQUFDLElBQVMsSUFBUyxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUU7Ozs7O0lBQ3JFLFdBQVcsQ0FBQyxJQUFTLElBQVMsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFOzs7Ozs7SUFDdkUsUUFBUSxDQUFDLElBQVMsRUFBRSxLQUFhLElBQVUsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUMsRUFBRTtDQUN6RiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtEZWJ1Z0VsZW1lbnQsIERlYnVnTm9kZSwgRXZlbnRMaXN0ZW5lciwgZ2V0RGVidWdOb2RlLCBpbmRleERlYnVnTm9kZSwgcmVtb3ZlRGVidWdOb2RlRnJvbUluZGV4fSBmcm9tICcuLi9kZWJ1Zy9kZWJ1Z19ub2RlJztcbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4uL2RpJztcbmltcG9ydCB7SW5qZWN0YWJsZVR5cGV9IGZyb20gJy4uL2RpL2luamVjdGFibGUnO1xuaW1wb3J0IHtFcnJvckhhbmRsZXJ9IGZyb20gJy4uL2Vycm9yX2hhbmRsZXInO1xuaW1wb3J0IHtpc0Rldk1vZGV9IGZyb20gJy4uL2lzX2Rldl9tb2RlJztcbmltcG9ydCB7Q29tcG9uZW50RmFjdG9yeX0gZnJvbSAnLi4vbGlua2VyL2NvbXBvbmVudF9mYWN0b3J5JztcbmltcG9ydCB7TmdNb2R1bGVSZWZ9IGZyb20gJy4uL2xpbmtlci9uZ19tb2R1bGVfZmFjdG9yeSc7XG5pbXBvcnQge1JlbmRlcmVyMiwgUmVuZGVyZXJGYWN0b3J5MiwgUmVuZGVyZXJTdHlsZUZsYWdzMiwgUmVuZGVyZXJUeXBlMn0gZnJvbSAnLi4vcmVuZGVyL2FwaSc7XG5pbXBvcnQge1Nhbml0aXplcn0gZnJvbSAnLi4vc2FuaXRpemF0aW9uL3NlY3VyaXR5JztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vdHlwZSc7XG5pbXBvcnQge3Rva2VuS2V5fSBmcm9tICcuLi92aWV3L3V0aWwnO1xuXG5pbXBvcnQge2lzVmlld0RlYnVnRXJyb3IsIHZpZXdEZXN0cm95ZWRFcnJvciwgdmlld1dyYXBwZWREZWJ1Z0Vycm9yfSBmcm9tICcuL2Vycm9ycyc7XG5pbXBvcnQge3Jlc29sdmVEZXB9IGZyb20gJy4vcHJvdmlkZXInO1xuaW1wb3J0IHtkaXJ0eVBhcmVudFF1ZXJpZXMsIGdldFF1ZXJ5VmFsdWV9IGZyb20gJy4vcXVlcnknO1xuaW1wb3J0IHtjcmVhdGVJbmplY3RvciwgY3JlYXRlTmdNb2R1bGVSZWYsIGdldENvbXBvbmVudFZpZXdEZWZpbml0aW9uRmFjdG9yeX0gZnJvbSAnLi9yZWZzJztcbmltcG9ydCB7QXJndW1lbnRUeXBlLCBCaW5kaW5nRmxhZ3MsIENoZWNrVHlwZSwgRGVidWdDb250ZXh0LCBFbGVtZW50RGF0YSwgTmdNb2R1bGVEZWZpbml0aW9uLCBOb2RlRGVmLCBOb2RlRmxhZ3MsIE5vZGVMb2dnZXIsIFByb3ZpZGVyT3ZlcnJpZGUsIFJvb3REYXRhLCBTZXJ2aWNlcywgVmlld0RhdGEsIFZpZXdEZWZpbml0aW9uLCBWaWV3U3RhdGUsIGFzRWxlbWVudERhdGEsIGFzUHVyZUV4cHJlc3Npb25EYXRhfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7Tk9PUCwgaXNDb21wb25lbnRWaWV3LCByZW5kZXJOb2RlLCByZXNvbHZlRGVmaW5pdGlvbiwgc3BsaXREZXBzRHNsLCB2aWV3UGFyZW50RWx9IGZyb20gJy4vdXRpbCc7XG5pbXBvcnQge2NoZWNrQW5kVXBkYXRlTm9kZSwgY2hlY2tBbmRVcGRhdGVWaWV3LCBjaGVja05vQ2hhbmdlc05vZGUsIGNoZWNrTm9DaGFuZ2VzVmlldywgY3JlYXRlQ29tcG9uZW50VmlldywgY3JlYXRlRW1iZWRkZWRWaWV3LCBjcmVhdGVSb290VmlldywgZGVzdHJveVZpZXd9IGZyb20gJy4vdmlldyc7XG5cblxubGV0IGluaXRpYWxpemVkID0gZmFsc2U7XG5cbmV4cG9ydCBmdW5jdGlvbiBpbml0U2VydmljZXNJZk5lZWRlZCgpIHtcbiAgaWYgKGluaXRpYWxpemVkKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGluaXRpYWxpemVkID0gdHJ1ZTtcbiAgY29uc3Qgc2VydmljZXMgPSBpc0Rldk1vZGUoKSA/IGNyZWF0ZURlYnVnU2VydmljZXMoKSA6IGNyZWF0ZVByb2RTZXJ2aWNlcygpO1xuICBTZXJ2aWNlcy5zZXRDdXJyZW50Tm9kZSA9IHNlcnZpY2VzLnNldEN1cnJlbnROb2RlO1xuICBTZXJ2aWNlcy5jcmVhdGVSb290VmlldyA9IHNlcnZpY2VzLmNyZWF0ZVJvb3RWaWV3O1xuICBTZXJ2aWNlcy5jcmVhdGVFbWJlZGRlZFZpZXcgPSBzZXJ2aWNlcy5jcmVhdGVFbWJlZGRlZFZpZXc7XG4gIFNlcnZpY2VzLmNyZWF0ZUNvbXBvbmVudFZpZXcgPSBzZXJ2aWNlcy5jcmVhdGVDb21wb25lbnRWaWV3O1xuICBTZXJ2aWNlcy5jcmVhdGVOZ01vZHVsZVJlZiA9IHNlcnZpY2VzLmNyZWF0ZU5nTW9kdWxlUmVmO1xuICBTZXJ2aWNlcy5vdmVycmlkZVByb3ZpZGVyID0gc2VydmljZXMub3ZlcnJpZGVQcm92aWRlcjtcbiAgU2VydmljZXMub3ZlcnJpZGVDb21wb25lbnRWaWV3ID0gc2VydmljZXMub3ZlcnJpZGVDb21wb25lbnRWaWV3O1xuICBTZXJ2aWNlcy5jbGVhck92ZXJyaWRlcyA9IHNlcnZpY2VzLmNsZWFyT3ZlcnJpZGVzO1xuICBTZXJ2aWNlcy5jaGVja0FuZFVwZGF0ZVZpZXcgPSBzZXJ2aWNlcy5jaGVja0FuZFVwZGF0ZVZpZXc7XG4gIFNlcnZpY2VzLmNoZWNrTm9DaGFuZ2VzVmlldyA9IHNlcnZpY2VzLmNoZWNrTm9DaGFuZ2VzVmlldztcbiAgU2VydmljZXMuZGVzdHJveVZpZXcgPSBzZXJ2aWNlcy5kZXN0cm95VmlldztcbiAgU2VydmljZXMucmVzb2x2ZURlcCA9IHJlc29sdmVEZXA7XG4gIFNlcnZpY2VzLmNyZWF0ZURlYnVnQ29udGV4dCA9IHNlcnZpY2VzLmNyZWF0ZURlYnVnQ29udGV4dDtcbiAgU2VydmljZXMuaGFuZGxlRXZlbnQgPSBzZXJ2aWNlcy5oYW5kbGVFdmVudDtcbiAgU2VydmljZXMudXBkYXRlRGlyZWN0aXZlcyA9IHNlcnZpY2VzLnVwZGF0ZURpcmVjdGl2ZXM7XG4gIFNlcnZpY2VzLnVwZGF0ZVJlbmRlcmVyID0gc2VydmljZXMudXBkYXRlUmVuZGVyZXI7XG4gIFNlcnZpY2VzLmRpcnR5UGFyZW50UXVlcmllcyA9IGRpcnR5UGFyZW50UXVlcmllcztcbn1cblxuZnVuY3Rpb24gY3JlYXRlUHJvZFNlcnZpY2VzKCkge1xuICByZXR1cm4ge1xuICAgIHNldEN1cnJlbnROb2RlOiAoKSA9PiB7fSxcbiAgICBjcmVhdGVSb290VmlldzogY3JlYXRlUHJvZFJvb3RWaWV3LFxuICAgIGNyZWF0ZUVtYmVkZGVkVmlldzogY3JlYXRlRW1iZWRkZWRWaWV3LFxuICAgIGNyZWF0ZUNvbXBvbmVudFZpZXc6IGNyZWF0ZUNvbXBvbmVudFZpZXcsXG4gICAgY3JlYXRlTmdNb2R1bGVSZWY6IGNyZWF0ZU5nTW9kdWxlUmVmLFxuICAgIG92ZXJyaWRlUHJvdmlkZXI6IE5PT1AsXG4gICAgb3ZlcnJpZGVDb21wb25lbnRWaWV3OiBOT09QLFxuICAgIGNsZWFyT3ZlcnJpZGVzOiBOT09QLFxuICAgIGNoZWNrQW5kVXBkYXRlVmlldzogY2hlY2tBbmRVcGRhdGVWaWV3LFxuICAgIGNoZWNrTm9DaGFuZ2VzVmlldzogY2hlY2tOb0NoYW5nZXNWaWV3LFxuICAgIGRlc3Ryb3lWaWV3OiBkZXN0cm95VmlldyxcbiAgICBjcmVhdGVEZWJ1Z0NvbnRleHQ6ICh2aWV3OiBWaWV3RGF0YSwgbm9kZUluZGV4OiBudW1iZXIpID0+IG5ldyBEZWJ1Z0NvbnRleHRfKHZpZXcsIG5vZGVJbmRleCksXG4gICAgaGFuZGxlRXZlbnQ6ICh2aWV3OiBWaWV3RGF0YSwgbm9kZUluZGV4OiBudW1iZXIsIGV2ZW50TmFtZTogc3RyaW5nLCBldmVudDogYW55KSA9PlxuICAgICAgICAgICAgICAgICAgICAgdmlldy5kZWYuaGFuZGxlRXZlbnQodmlldywgbm9kZUluZGV4LCBldmVudE5hbWUsIGV2ZW50KSxcbiAgICB1cGRhdGVEaXJlY3RpdmVzOiAodmlldzogVmlld0RhdGEsIGNoZWNrVHlwZTogQ2hlY2tUeXBlKSA9PiB2aWV3LmRlZi51cGRhdGVEaXJlY3RpdmVzKFxuICAgICAgICAgICAgICAgICAgICAgICAgICBjaGVja1R5cGUgPT09IENoZWNrVHlwZS5DaGVja0FuZFVwZGF0ZSA/IHByb2RDaGVja0FuZFVwZGF0ZU5vZGUgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2RDaGVja05vQ2hhbmdlc05vZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHZpZXcpLFxuICAgIHVwZGF0ZVJlbmRlcmVyOiAodmlldzogVmlld0RhdGEsIGNoZWNrVHlwZTogQ2hlY2tUeXBlKSA9PiB2aWV3LmRlZi51cGRhdGVSZW5kZXJlcihcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrVHlwZSA9PT0gQ2hlY2tUeXBlLkNoZWNrQW5kVXBkYXRlID8gcHJvZENoZWNrQW5kVXBkYXRlTm9kZSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2RDaGVja05vQ2hhbmdlc05vZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICB2aWV3KSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlRGVidWdTZXJ2aWNlcygpIHtcbiAgcmV0dXJuIHtcbiAgICBzZXRDdXJyZW50Tm9kZTogZGVidWdTZXRDdXJyZW50Tm9kZSxcbiAgICBjcmVhdGVSb290VmlldzogZGVidWdDcmVhdGVSb290VmlldyxcbiAgICBjcmVhdGVFbWJlZGRlZFZpZXc6IGRlYnVnQ3JlYXRlRW1iZWRkZWRWaWV3LFxuICAgIGNyZWF0ZUNvbXBvbmVudFZpZXc6IGRlYnVnQ3JlYXRlQ29tcG9uZW50VmlldyxcbiAgICBjcmVhdGVOZ01vZHVsZVJlZjogZGVidWdDcmVhdGVOZ01vZHVsZVJlZixcbiAgICBvdmVycmlkZVByb3ZpZGVyOiBkZWJ1Z092ZXJyaWRlUHJvdmlkZXIsXG4gICAgb3ZlcnJpZGVDb21wb25lbnRWaWV3OiBkZWJ1Z092ZXJyaWRlQ29tcG9uZW50VmlldyxcbiAgICBjbGVhck92ZXJyaWRlczogZGVidWdDbGVhck92ZXJyaWRlcyxcbiAgICBjaGVja0FuZFVwZGF0ZVZpZXc6IGRlYnVnQ2hlY2tBbmRVcGRhdGVWaWV3LFxuICAgIGNoZWNrTm9DaGFuZ2VzVmlldzogZGVidWdDaGVja05vQ2hhbmdlc1ZpZXcsXG4gICAgZGVzdHJveVZpZXc6IGRlYnVnRGVzdHJveVZpZXcsXG4gICAgY3JlYXRlRGVidWdDb250ZXh0OiAodmlldzogVmlld0RhdGEsIG5vZGVJbmRleDogbnVtYmVyKSA9PiBuZXcgRGVidWdDb250ZXh0Xyh2aWV3LCBub2RlSW5kZXgpLFxuICAgIGhhbmRsZUV2ZW50OiBkZWJ1Z0hhbmRsZUV2ZW50LFxuICAgIHVwZGF0ZURpcmVjdGl2ZXM6IGRlYnVnVXBkYXRlRGlyZWN0aXZlcyxcbiAgICB1cGRhdGVSZW5kZXJlcjogZGVidWdVcGRhdGVSZW5kZXJlcixcbiAgfTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlUHJvZFJvb3RWaWV3KFxuICAgIGVsSW5qZWN0b3I6IEluamVjdG9yLCBwcm9qZWN0YWJsZU5vZGVzOiBhbnlbXVtdLCByb290U2VsZWN0b3JPck5vZGU6IHN0cmluZyB8IGFueSxcbiAgICBkZWY6IFZpZXdEZWZpbml0aW9uLCBuZ01vZHVsZTogTmdNb2R1bGVSZWY8YW55PiwgY29udGV4dD86IGFueSk6IFZpZXdEYXRhIHtcbiAgY29uc3QgcmVuZGVyZXJGYWN0b3J5OiBSZW5kZXJlckZhY3RvcnkyID0gbmdNb2R1bGUuaW5qZWN0b3IuZ2V0KFJlbmRlcmVyRmFjdG9yeTIpO1xuICByZXR1cm4gY3JlYXRlUm9vdFZpZXcoXG4gICAgICBjcmVhdGVSb290RGF0YShlbEluamVjdG9yLCBuZ01vZHVsZSwgcmVuZGVyZXJGYWN0b3J5LCBwcm9qZWN0YWJsZU5vZGVzLCByb290U2VsZWN0b3JPck5vZGUpLFxuICAgICAgZGVmLCBjb250ZXh0KTtcbn1cblxuZnVuY3Rpb24gZGVidWdDcmVhdGVSb290VmlldyhcbiAgICBlbEluamVjdG9yOiBJbmplY3RvciwgcHJvamVjdGFibGVOb2RlczogYW55W11bXSwgcm9vdFNlbGVjdG9yT3JOb2RlOiBzdHJpbmcgfCBhbnksXG4gICAgZGVmOiBWaWV3RGVmaW5pdGlvbiwgbmdNb2R1bGU6IE5nTW9kdWxlUmVmPGFueT4sIGNvbnRleHQ/OiBhbnkpOiBWaWV3RGF0YSB7XG4gIGNvbnN0IHJlbmRlcmVyRmFjdG9yeTogUmVuZGVyZXJGYWN0b3J5MiA9IG5nTW9kdWxlLmluamVjdG9yLmdldChSZW5kZXJlckZhY3RvcnkyKTtcbiAgY29uc3Qgcm9vdCA9IGNyZWF0ZVJvb3REYXRhKFxuICAgICAgZWxJbmplY3RvciwgbmdNb2R1bGUsIG5ldyBEZWJ1Z1JlbmRlcmVyRmFjdG9yeTIocmVuZGVyZXJGYWN0b3J5KSwgcHJvamVjdGFibGVOb2RlcyxcbiAgICAgIHJvb3RTZWxlY3Rvck9yTm9kZSk7XG4gIGNvbnN0IGRlZldpdGhPdmVycmlkZSA9IGFwcGx5UHJvdmlkZXJPdmVycmlkZXNUb1ZpZXcoZGVmKTtcbiAgcmV0dXJuIGNhbGxXaXRoRGVidWdDb250ZXh0KFxuICAgICAgRGVidWdBY3Rpb24uY3JlYXRlLCBjcmVhdGVSb290VmlldywgbnVsbCwgW3Jvb3QsIGRlZldpdGhPdmVycmlkZSwgY29udGV4dF0pO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVSb290RGF0YShcbiAgICBlbEluamVjdG9yOiBJbmplY3RvciwgbmdNb2R1bGU6IE5nTW9kdWxlUmVmPGFueT4sIHJlbmRlcmVyRmFjdG9yeTogUmVuZGVyZXJGYWN0b3J5MixcbiAgICBwcm9qZWN0YWJsZU5vZGVzOiBhbnlbXVtdLCByb290U2VsZWN0b3JPck5vZGU6IGFueSk6IFJvb3REYXRhIHtcbiAgY29uc3Qgc2FuaXRpemVyID0gbmdNb2R1bGUuaW5qZWN0b3IuZ2V0KFNhbml0aXplcik7XG4gIGNvbnN0IGVycm9ySGFuZGxlciA9IG5nTW9kdWxlLmluamVjdG9yLmdldChFcnJvckhhbmRsZXIpO1xuICBjb25zdCByZW5kZXJlciA9IHJlbmRlcmVyRmFjdG9yeS5jcmVhdGVSZW5kZXJlcihudWxsLCBudWxsKTtcbiAgcmV0dXJuIHtcbiAgICBuZ01vZHVsZSxcbiAgICBpbmplY3RvcjogZWxJbmplY3RvciwgcHJvamVjdGFibGVOb2RlcyxcbiAgICBzZWxlY3Rvck9yTm9kZTogcm9vdFNlbGVjdG9yT3JOb2RlLCBzYW5pdGl6ZXIsIHJlbmRlcmVyRmFjdG9yeSwgcmVuZGVyZXIsIGVycm9ySGFuZGxlclxuICB9O1xufVxuXG5mdW5jdGlvbiBkZWJ1Z0NyZWF0ZUVtYmVkZGVkVmlldyhcbiAgICBwYXJlbnRWaWV3OiBWaWV3RGF0YSwgYW5jaG9yRGVmOiBOb2RlRGVmLCB2aWV3RGVmOiBWaWV3RGVmaW5pdGlvbiwgY29udGV4dD86IGFueSk6IFZpZXdEYXRhIHtcbiAgY29uc3QgZGVmV2l0aE92ZXJyaWRlID0gYXBwbHlQcm92aWRlck92ZXJyaWRlc1RvVmlldyh2aWV3RGVmKTtcbiAgcmV0dXJuIGNhbGxXaXRoRGVidWdDb250ZXh0KFxuICAgICAgRGVidWdBY3Rpb24uY3JlYXRlLCBjcmVhdGVFbWJlZGRlZFZpZXcsIG51bGwsXG4gICAgICBbcGFyZW50VmlldywgYW5jaG9yRGVmLCBkZWZXaXRoT3ZlcnJpZGUsIGNvbnRleHRdKTtcbn1cblxuZnVuY3Rpb24gZGVidWdDcmVhdGVDb21wb25lbnRWaWV3KFxuICAgIHBhcmVudFZpZXc6IFZpZXdEYXRhLCBub2RlRGVmOiBOb2RlRGVmLCB2aWV3RGVmOiBWaWV3RGVmaW5pdGlvbiwgaG9zdEVsZW1lbnQ6IGFueSk6IFZpZXdEYXRhIHtcbiAgY29uc3Qgb3ZlcnJpZGVDb21wb25lbnRWaWV3ID1cbiAgICAgIHZpZXdEZWZPdmVycmlkZXMuZ2V0KG5vZGVEZWYuZWxlbWVudCAhLmNvbXBvbmVudFByb3ZpZGVyICEucHJvdmlkZXIgIS50b2tlbik7XG4gIGlmIChvdmVycmlkZUNvbXBvbmVudFZpZXcpIHtcbiAgICB2aWV3RGVmID0gb3ZlcnJpZGVDb21wb25lbnRWaWV3O1xuICB9IGVsc2Uge1xuICAgIHZpZXdEZWYgPSBhcHBseVByb3ZpZGVyT3ZlcnJpZGVzVG9WaWV3KHZpZXdEZWYpO1xuICB9XG4gIHJldHVybiBjYWxsV2l0aERlYnVnQ29udGV4dChcbiAgICAgIERlYnVnQWN0aW9uLmNyZWF0ZSwgY3JlYXRlQ29tcG9uZW50VmlldywgbnVsbCwgW3BhcmVudFZpZXcsIG5vZGVEZWYsIHZpZXdEZWYsIGhvc3RFbGVtZW50XSk7XG59XG5cbmZ1bmN0aW9uIGRlYnVnQ3JlYXRlTmdNb2R1bGVSZWYoXG4gICAgbW9kdWxlVHlwZTogVHlwZTxhbnk+LCBwYXJlbnRJbmplY3RvcjogSW5qZWN0b3IsIGJvb3RzdHJhcENvbXBvbmVudHM6IFR5cGU8YW55PltdLFxuICAgIGRlZjogTmdNb2R1bGVEZWZpbml0aW9uKTogTmdNb2R1bGVSZWY8YW55PiB7XG4gIGNvbnN0IGRlZldpdGhPdmVycmlkZSA9IGFwcGx5UHJvdmlkZXJPdmVycmlkZXNUb05nTW9kdWxlKGRlZik7XG4gIHJldHVybiBjcmVhdGVOZ01vZHVsZVJlZihtb2R1bGVUeXBlLCBwYXJlbnRJbmplY3RvciwgYm9vdHN0cmFwQ29tcG9uZW50cywgZGVmV2l0aE92ZXJyaWRlKTtcbn1cblxuY29uc3QgcHJvdmlkZXJPdmVycmlkZXMgPSBuZXcgTWFwPGFueSwgUHJvdmlkZXJPdmVycmlkZT4oKTtcbmNvbnN0IHByb3ZpZGVyT3ZlcnJpZGVzV2l0aFNjb3BlID0gbmV3IE1hcDxJbmplY3RhYmxlVHlwZTxhbnk+LCBQcm92aWRlck92ZXJyaWRlPigpO1xuY29uc3Qgdmlld0RlZk92ZXJyaWRlcyA9IG5ldyBNYXA8YW55LCBWaWV3RGVmaW5pdGlvbj4oKTtcblxuZnVuY3Rpb24gZGVidWdPdmVycmlkZVByb3ZpZGVyKG92ZXJyaWRlOiBQcm92aWRlck92ZXJyaWRlKSB7XG4gIHByb3ZpZGVyT3ZlcnJpZGVzLnNldChvdmVycmlkZS50b2tlbiwgb3ZlcnJpZGUpO1xuICBpZiAodHlwZW9mIG92ZXJyaWRlLnRva2VuID09PSAnZnVuY3Rpb24nICYmIG92ZXJyaWRlLnRva2VuLm5nSW5qZWN0YWJsZURlZiAmJlxuICAgICAgdHlwZW9mIG92ZXJyaWRlLnRva2VuLm5nSW5qZWN0YWJsZURlZi5wcm92aWRlZEluID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcHJvdmlkZXJPdmVycmlkZXNXaXRoU2NvcGUuc2V0KG92ZXJyaWRlLnRva2VuIGFzIEluamVjdGFibGVUeXBlPGFueT4sIG92ZXJyaWRlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBkZWJ1Z092ZXJyaWRlQ29tcG9uZW50Vmlldyhjb21wOiBhbnksIGNvbXBGYWN0b3J5OiBDb21wb25lbnRGYWN0b3J5PGFueT4pIHtcbiAgY29uc3QgaG9zdFZpZXdEZWYgPSByZXNvbHZlRGVmaW5pdGlvbihnZXRDb21wb25lbnRWaWV3RGVmaW5pdGlvbkZhY3RvcnkoY29tcEZhY3RvcnkpKTtcbiAgY29uc3QgY29tcFZpZXdEZWYgPSByZXNvbHZlRGVmaW5pdGlvbihob3N0Vmlld0RlZi5ub2Rlc1swXS5lbGVtZW50ICEuY29tcG9uZW50VmlldyAhKTtcbiAgdmlld0RlZk92ZXJyaWRlcy5zZXQoY29tcCwgY29tcFZpZXdEZWYpO1xufVxuXG5mdW5jdGlvbiBkZWJ1Z0NsZWFyT3ZlcnJpZGVzKCkge1xuICBwcm92aWRlck92ZXJyaWRlcy5jbGVhcigpO1xuICBwcm92aWRlck92ZXJyaWRlc1dpdGhTY29wZS5jbGVhcigpO1xuICB2aWV3RGVmT3ZlcnJpZGVzLmNsZWFyKCk7XG59XG5cbi8vIE5vdGVzIGFib3V0IHRoZSBhbGdvcml0aG06XG4vLyAxKSBMb2NhdGUgdGhlIHByb3ZpZGVycyBvZiBhbiBlbGVtZW50IGFuZCBjaGVjayBpZiBvbmUgb2YgdGhlbSB3YXMgb3ZlcndyaXR0ZW5cbi8vIDIpIENoYW5nZSB0aGUgcHJvdmlkZXJzIG9mIHRoYXQgZWxlbWVudFxuLy9cbi8vIFdlIG9ubHkgY3JlYXRlIG5ldyBkYXRhc3RydWN0dXJlcyBpZiB3ZSBuZWVkIHRvLCB0byBrZWVwIHBlcmYgaW1wYWN0XG4vLyByZWFzb25hYmxlLlxuZnVuY3Rpb24gYXBwbHlQcm92aWRlck92ZXJyaWRlc1RvVmlldyhkZWY6IFZpZXdEZWZpbml0aW9uKTogVmlld0RlZmluaXRpb24ge1xuICBpZiAocHJvdmlkZXJPdmVycmlkZXMuc2l6ZSA9PT0gMCkge1xuICAgIHJldHVybiBkZWY7XG4gIH1cbiAgY29uc3QgZWxlbWVudEluZGljZXNXaXRoT3ZlcndyaXR0ZW5Qcm92aWRlcnMgPSBmaW5kRWxlbWVudEluZGljZXNXaXRoT3ZlcndyaXR0ZW5Qcm92aWRlcnMoZGVmKTtcbiAgaWYgKGVsZW1lbnRJbmRpY2VzV2l0aE92ZXJ3cml0dGVuUHJvdmlkZXJzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBkZWY7XG4gIH1cbiAgLy8gY2xvbmUgdGhlIHdob2xlIHZpZXcgZGVmaW5pdGlvbixcbiAgLy8gYXMgaXQgbWFpbnRhaW5zIHJlZmVyZW5jZXMgYmV0d2VlbiB0aGUgbm9kZXMgdGhhdCBhcmUgaGFyZCB0byB1cGRhdGUuXG4gIGRlZiA9IGRlZi5mYWN0b3J5ICEoKCkgPT4gTk9PUCk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZWxlbWVudEluZGljZXNXaXRoT3ZlcndyaXR0ZW5Qcm92aWRlcnMubGVuZ3RoOyBpKyspIHtcbiAgICBhcHBseVByb3ZpZGVyT3ZlcnJpZGVzVG9FbGVtZW50KGRlZiwgZWxlbWVudEluZGljZXNXaXRoT3ZlcndyaXR0ZW5Qcm92aWRlcnNbaV0pO1xuICB9XG4gIHJldHVybiBkZWY7XG5cbiAgZnVuY3Rpb24gZmluZEVsZW1lbnRJbmRpY2VzV2l0aE92ZXJ3cml0dGVuUHJvdmlkZXJzKGRlZjogVmlld0RlZmluaXRpb24pOiBudW1iZXJbXSB7XG4gICAgY29uc3QgZWxJbmRpY2VzV2l0aE92ZXJ3cml0dGVuUHJvdmlkZXJzOiBudW1iZXJbXSA9IFtdO1xuICAgIGxldCBsYXN0RWxlbWVudERlZjogTm9kZURlZnxudWxsID0gbnVsbDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRlZi5ub2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3Qgbm9kZURlZiA9IGRlZi5ub2Rlc1tpXTtcbiAgICAgIGlmIChub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLlR5cGVFbGVtZW50KSB7XG4gICAgICAgIGxhc3RFbGVtZW50RGVmID0gbm9kZURlZjtcbiAgICAgIH1cbiAgICAgIGlmIChsYXN0RWxlbWVudERlZiAmJiBub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLkNhdFByb3ZpZGVyTm9EaXJlY3RpdmUgJiZcbiAgICAgICAgICBwcm92aWRlck92ZXJyaWRlcy5oYXMobm9kZURlZi5wcm92aWRlciAhLnRva2VuKSkge1xuICAgICAgICBlbEluZGljZXNXaXRoT3ZlcndyaXR0ZW5Qcm92aWRlcnMucHVzaChsYXN0RWxlbWVudERlZiAhLm5vZGVJbmRleCk7XG4gICAgICAgIGxhc3RFbGVtZW50RGVmID0gbnVsbDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGVsSW5kaWNlc1dpdGhPdmVyd3JpdHRlblByb3ZpZGVycztcbiAgfVxuXG4gIGZ1bmN0aW9uIGFwcGx5UHJvdmlkZXJPdmVycmlkZXNUb0VsZW1lbnQodmlld0RlZjogVmlld0RlZmluaXRpb24sIGVsSW5kZXg6IG51bWJlcikge1xuICAgIGZvciAobGV0IGkgPSBlbEluZGV4ICsgMTsgaSA8IHZpZXdEZWYubm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IG5vZGVEZWYgPSB2aWV3RGVmLm5vZGVzW2ldO1xuICAgICAgaWYgKG5vZGVEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuVHlwZUVsZW1lbnQpIHtcbiAgICAgICAgLy8gc3RvcCBhdCB0aGUgbmV4dCBlbGVtZW50XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmIChub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLkNhdFByb3ZpZGVyTm9EaXJlY3RpdmUpIHtcbiAgICAgICAgY29uc3QgcHJvdmlkZXIgPSBub2RlRGVmLnByb3ZpZGVyICE7XG4gICAgICAgIGNvbnN0IG92ZXJyaWRlID0gcHJvdmlkZXJPdmVycmlkZXMuZ2V0KHByb3ZpZGVyLnRva2VuKTtcbiAgICAgICAgaWYgKG92ZXJyaWRlKSB7XG4gICAgICAgICAgbm9kZURlZi5mbGFncyA9IChub2RlRGVmLmZsYWdzICYgfk5vZGVGbGFncy5DYXRQcm92aWRlck5vRGlyZWN0aXZlKSB8IG92ZXJyaWRlLmZsYWdzO1xuICAgICAgICAgIHByb3ZpZGVyLmRlcHMgPSBzcGxpdERlcHNEc2wob3ZlcnJpZGUuZGVwcyk7XG4gICAgICAgICAgcHJvdmlkZXIudmFsdWUgPSBvdmVycmlkZS52YWx1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vLyBOb3RlcyBhYm91dCB0aGUgYWxnb3JpdGhtOlxuLy8gV2Ugb25seSBjcmVhdGUgbmV3IGRhdGFzdHJ1Y3R1cmVzIGlmIHdlIG5lZWQgdG8sIHRvIGtlZXAgcGVyZiBpbXBhY3Rcbi8vIHJlYXNvbmFibGUuXG5mdW5jdGlvbiBhcHBseVByb3ZpZGVyT3ZlcnJpZGVzVG9OZ01vZHVsZShkZWY6IE5nTW9kdWxlRGVmaW5pdGlvbik6IE5nTW9kdWxlRGVmaW5pdGlvbiB7XG4gIGNvbnN0IHtoYXNPdmVycmlkZXMsIGhhc0RlcHJlY2F0ZWRPdmVycmlkZXN9ID0gY2FsY0hhc092ZXJyaWRlcyhkZWYpO1xuICBpZiAoIWhhc092ZXJyaWRlcykge1xuICAgIHJldHVybiBkZWY7XG4gIH1cbiAgLy8gY2xvbmUgdGhlIHdob2xlIHZpZXcgZGVmaW5pdGlvbixcbiAgLy8gYXMgaXQgbWFpbnRhaW5zIHJlZmVyZW5jZXMgYmV0d2VlbiB0aGUgbm9kZXMgdGhhdCBhcmUgaGFyZCB0byB1cGRhdGUuXG4gIGRlZiA9IGRlZi5mYWN0b3J5ICEoKCkgPT4gTk9PUCk7XG4gIGFwcGx5UHJvdmlkZXJPdmVycmlkZXMoZGVmKTtcbiAgcmV0dXJuIGRlZjtcblxuICBmdW5jdGlvbiBjYWxjSGFzT3ZlcnJpZGVzKGRlZjogTmdNb2R1bGVEZWZpbml0aW9uKTpcbiAgICAgIHtoYXNPdmVycmlkZXM6IGJvb2xlYW4sIGhhc0RlcHJlY2F0ZWRPdmVycmlkZXM6IGJvb2xlYW59IHtcbiAgICBsZXQgaGFzT3ZlcnJpZGVzID0gZmFsc2U7XG4gICAgbGV0IGhhc0RlcHJlY2F0ZWRPdmVycmlkZXMgPSBmYWxzZTtcbiAgICBpZiAocHJvdmlkZXJPdmVycmlkZXMuc2l6ZSA9PT0gMCkge1xuICAgICAgcmV0dXJuIHtoYXNPdmVycmlkZXMsIGhhc0RlcHJlY2F0ZWRPdmVycmlkZXN9O1xuICAgIH1cbiAgICBkZWYucHJvdmlkZXJzLmZvckVhY2gobm9kZSA9PiB7XG4gICAgICBjb25zdCBvdmVycmlkZSA9IHByb3ZpZGVyT3ZlcnJpZGVzLmdldChub2RlLnRva2VuKTtcbiAgICAgIGlmICgobm9kZS5mbGFncyAmIE5vZGVGbGFncy5DYXRQcm92aWRlck5vRGlyZWN0aXZlKSAmJiBvdmVycmlkZSkge1xuICAgICAgICBoYXNPdmVycmlkZXMgPSB0cnVlO1xuICAgICAgICBoYXNEZXByZWNhdGVkT3ZlcnJpZGVzID0gaGFzRGVwcmVjYXRlZE92ZXJyaWRlcyB8fCBvdmVycmlkZS5kZXByZWNhdGVkQmVoYXZpb3I7XG4gICAgICB9XG4gICAgfSk7XG4gICAgZGVmLm1vZHVsZXMuZm9yRWFjaChtb2R1bGUgPT4ge1xuICAgICAgcHJvdmlkZXJPdmVycmlkZXNXaXRoU2NvcGUuZm9yRWFjaCgob3ZlcnJpZGUsIHRva2VuKSA9PiB7XG4gICAgICAgIGlmICh0b2tlbi5uZ0luamVjdGFibGVEZWYucHJvdmlkZWRJbiA9PT0gbW9kdWxlKSB7XG4gICAgICAgICAgaGFzT3ZlcnJpZGVzID0gdHJ1ZTtcbiAgICAgICAgICBoYXNEZXByZWNhdGVkT3ZlcnJpZGVzID0gaGFzRGVwcmVjYXRlZE92ZXJyaWRlcyB8fCBvdmVycmlkZS5kZXByZWNhdGVkQmVoYXZpb3I7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIHJldHVybiB7aGFzT3ZlcnJpZGVzLCBoYXNEZXByZWNhdGVkT3ZlcnJpZGVzfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFwcGx5UHJvdmlkZXJPdmVycmlkZXMoZGVmOiBOZ01vZHVsZURlZmluaXRpb24pIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRlZi5wcm92aWRlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHByb3ZpZGVyID0gZGVmLnByb3ZpZGVyc1tpXTtcbiAgICAgIGlmIChoYXNEZXByZWNhdGVkT3ZlcnJpZGVzKSB7XG4gICAgICAgIC8vIFdlIGhhZCBhIGJ1ZyB3aGVyZSBtZSBtYWRlXG4gICAgICAgIC8vIGFsbCBwcm92aWRlcnMgbGF6eS4gS2VlcCB0aGlzIGxvZ2ljIGJlaGluZCBhIGZsYWdcbiAgICAgICAgLy8gZm9yIG1pZ3JhdGluZyBleGlzdGluZyB1c2Vycy5cbiAgICAgICAgcHJvdmlkZXIuZmxhZ3MgfD0gTm9kZUZsYWdzLkxhenlQcm92aWRlcjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IG92ZXJyaWRlID0gcHJvdmlkZXJPdmVycmlkZXMuZ2V0KHByb3ZpZGVyLnRva2VuKTtcbiAgICAgIGlmIChvdmVycmlkZSkge1xuICAgICAgICBwcm92aWRlci5mbGFncyA9IChwcm92aWRlci5mbGFncyAmIH5Ob2RlRmxhZ3MuQ2F0UHJvdmlkZXJOb0RpcmVjdGl2ZSkgfCBvdmVycmlkZS5mbGFncztcbiAgICAgICAgcHJvdmlkZXIuZGVwcyA9IHNwbGl0RGVwc0RzbChvdmVycmlkZS5kZXBzKTtcbiAgICAgICAgcHJvdmlkZXIudmFsdWUgPSBvdmVycmlkZS52YWx1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHByb3ZpZGVyT3ZlcnJpZGVzV2l0aFNjb3BlLnNpemUgPiAwKSB7XG4gICAgICBsZXQgbW9kdWxlU2V0ID0gbmV3IFNldDxhbnk+KGRlZi5tb2R1bGVzKTtcbiAgICAgIHByb3ZpZGVyT3ZlcnJpZGVzV2l0aFNjb3BlLmZvckVhY2goKG92ZXJyaWRlLCB0b2tlbikgPT4ge1xuICAgICAgICBpZiAobW9kdWxlU2V0Lmhhcyh0b2tlbi5uZ0luamVjdGFibGVEZWYucHJvdmlkZWRJbikpIHtcbiAgICAgICAgICBsZXQgcHJvdmlkZXIgPSB7XG4gICAgICAgICAgICB0b2tlbjogdG9rZW4sXG4gICAgICAgICAgICBmbGFnczpcbiAgICAgICAgICAgICAgICBvdmVycmlkZS5mbGFncyB8IChoYXNEZXByZWNhdGVkT3ZlcnJpZGVzID8gTm9kZUZsYWdzLkxhenlQcm92aWRlciA6IE5vZGVGbGFncy5Ob25lKSxcbiAgICAgICAgICAgIGRlcHM6IHNwbGl0RGVwc0RzbChvdmVycmlkZS5kZXBzKSxcbiAgICAgICAgICAgIHZhbHVlOiBvdmVycmlkZS52YWx1ZSxcbiAgICAgICAgICAgIGluZGV4OiBkZWYucHJvdmlkZXJzLmxlbmd0aCxcbiAgICAgICAgICB9O1xuICAgICAgICAgIGRlZi5wcm92aWRlcnMucHVzaChwcm92aWRlcik7XG4gICAgICAgICAgZGVmLnByb3ZpZGVyc0J5S2V5W3Rva2VuS2V5KHRva2VuKV0gPSBwcm92aWRlcjtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHByb2RDaGVja0FuZFVwZGF0ZU5vZGUoXG4gICAgdmlldzogVmlld0RhdGEsIGNoZWNrSW5kZXg6IG51bWJlciwgYXJnU3R5bGU6IEFyZ3VtZW50VHlwZSwgdjA/OiBhbnksIHYxPzogYW55LCB2Mj86IGFueSxcbiAgICB2Mz86IGFueSwgdjQ/OiBhbnksIHY1PzogYW55LCB2Nj86IGFueSwgdjc/OiBhbnksIHY4PzogYW55LCB2OT86IGFueSk6IGFueSB7XG4gIGNvbnN0IG5vZGVEZWYgPSB2aWV3LmRlZi5ub2Rlc1tjaGVja0luZGV4XTtcbiAgY2hlY2tBbmRVcGRhdGVOb2RlKHZpZXcsIG5vZGVEZWYsIGFyZ1N0eWxlLCB2MCwgdjEsIHYyLCB2MywgdjQsIHY1LCB2NiwgdjcsIHY4LCB2OSk7XG4gIHJldHVybiAobm9kZURlZi5mbGFncyAmIE5vZGVGbGFncy5DYXRQdXJlRXhwcmVzc2lvbikgP1xuICAgICAgYXNQdXJlRXhwcmVzc2lvbkRhdGEodmlldywgY2hlY2tJbmRleCkudmFsdWUgOlxuICAgICAgdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBwcm9kQ2hlY2tOb0NoYW5nZXNOb2RlKFxuICAgIHZpZXc6IFZpZXdEYXRhLCBjaGVja0luZGV4OiBudW1iZXIsIGFyZ1N0eWxlOiBBcmd1bWVudFR5cGUsIHYwPzogYW55LCB2MT86IGFueSwgdjI/OiBhbnksXG4gICAgdjM/OiBhbnksIHY0PzogYW55LCB2NT86IGFueSwgdjY/OiBhbnksIHY3PzogYW55LCB2OD86IGFueSwgdjk/OiBhbnkpOiBhbnkge1xuICBjb25zdCBub2RlRGVmID0gdmlldy5kZWYubm9kZXNbY2hlY2tJbmRleF07XG4gIGNoZWNrTm9DaGFuZ2VzTm9kZSh2aWV3LCBub2RlRGVmLCBhcmdTdHlsZSwgdjAsIHYxLCB2MiwgdjMsIHY0LCB2NSwgdjYsIHY3LCB2OCwgdjkpO1xuICByZXR1cm4gKG5vZGVEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuQ2F0UHVyZUV4cHJlc3Npb24pID9cbiAgICAgIGFzUHVyZUV4cHJlc3Npb25EYXRhKHZpZXcsIGNoZWNrSW5kZXgpLnZhbHVlIDpcbiAgICAgIHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gZGVidWdDaGVja0FuZFVwZGF0ZVZpZXcodmlldzogVmlld0RhdGEpIHtcbiAgcmV0dXJuIGNhbGxXaXRoRGVidWdDb250ZXh0KERlYnVnQWN0aW9uLmRldGVjdENoYW5nZXMsIGNoZWNrQW5kVXBkYXRlVmlldywgbnVsbCwgW3ZpZXddKTtcbn1cblxuZnVuY3Rpb24gZGVidWdDaGVja05vQ2hhbmdlc1ZpZXcodmlldzogVmlld0RhdGEpIHtcbiAgcmV0dXJuIGNhbGxXaXRoRGVidWdDb250ZXh0KERlYnVnQWN0aW9uLmNoZWNrTm9DaGFuZ2VzLCBjaGVja05vQ2hhbmdlc1ZpZXcsIG51bGwsIFt2aWV3XSk7XG59XG5cbmZ1bmN0aW9uIGRlYnVnRGVzdHJveVZpZXcodmlldzogVmlld0RhdGEpIHtcbiAgcmV0dXJuIGNhbGxXaXRoRGVidWdDb250ZXh0KERlYnVnQWN0aW9uLmRlc3Ryb3ksIGRlc3Ryb3lWaWV3LCBudWxsLCBbdmlld10pO1xufVxuXG5lbnVtIERlYnVnQWN0aW9uIHtcbiAgY3JlYXRlLFxuICBkZXRlY3RDaGFuZ2VzLFxuICBjaGVja05vQ2hhbmdlcyxcbiAgZGVzdHJveSxcbiAgaGFuZGxlRXZlbnRcbn1cblxubGV0IF9jdXJyZW50QWN0aW9uOiBEZWJ1Z0FjdGlvbjtcbmxldCBfY3VycmVudFZpZXc6IFZpZXdEYXRhO1xubGV0IF9jdXJyZW50Tm9kZUluZGV4OiBudW1iZXJ8bnVsbDtcblxuZnVuY3Rpb24gZGVidWdTZXRDdXJyZW50Tm9kZSh2aWV3OiBWaWV3RGF0YSwgbm9kZUluZGV4OiBudW1iZXIgfCBudWxsKSB7XG4gIF9jdXJyZW50VmlldyA9IHZpZXc7XG4gIF9jdXJyZW50Tm9kZUluZGV4ID0gbm9kZUluZGV4O1xufVxuXG5mdW5jdGlvbiBkZWJ1Z0hhbmRsZUV2ZW50KHZpZXc6IFZpZXdEYXRhLCBub2RlSW5kZXg6IG51bWJlciwgZXZlbnROYW1lOiBzdHJpbmcsIGV2ZW50OiBhbnkpIHtcbiAgZGVidWdTZXRDdXJyZW50Tm9kZSh2aWV3LCBub2RlSW5kZXgpO1xuICByZXR1cm4gY2FsbFdpdGhEZWJ1Z0NvbnRleHQoXG4gICAgICBEZWJ1Z0FjdGlvbi5oYW5kbGVFdmVudCwgdmlldy5kZWYuaGFuZGxlRXZlbnQsIG51bGwsIFt2aWV3LCBub2RlSW5kZXgsIGV2ZW50TmFtZSwgZXZlbnRdKTtcbn1cblxuZnVuY3Rpb24gZGVidWdVcGRhdGVEaXJlY3RpdmVzKHZpZXc6IFZpZXdEYXRhLCBjaGVja1R5cGU6IENoZWNrVHlwZSkge1xuICBpZiAodmlldy5zdGF0ZSAmIFZpZXdTdGF0ZS5EZXN0cm95ZWQpIHtcbiAgICB0aHJvdyB2aWV3RGVzdHJveWVkRXJyb3IoRGVidWdBY3Rpb25bX2N1cnJlbnRBY3Rpb25dKTtcbiAgfVxuICBkZWJ1Z1NldEN1cnJlbnROb2RlKHZpZXcsIG5leHREaXJlY3RpdmVXaXRoQmluZGluZyh2aWV3LCAwKSk7XG4gIHJldHVybiB2aWV3LmRlZi51cGRhdGVEaXJlY3RpdmVzKGRlYnVnQ2hlY2tEaXJlY3RpdmVzRm4sIHZpZXcpO1xuXG4gIGZ1bmN0aW9uIGRlYnVnQ2hlY2tEaXJlY3RpdmVzRm4oXG4gICAgICB2aWV3OiBWaWV3RGF0YSwgbm9kZUluZGV4OiBudW1iZXIsIGFyZ1N0eWxlOiBBcmd1bWVudFR5cGUsIC4uLnZhbHVlczogYW55W10pIHtcbiAgICBjb25zdCBub2RlRGVmID0gdmlldy5kZWYubm9kZXNbbm9kZUluZGV4XTtcbiAgICBpZiAoY2hlY2tUeXBlID09PSBDaGVja1R5cGUuQ2hlY2tBbmRVcGRhdGUpIHtcbiAgICAgIGRlYnVnQ2hlY2tBbmRVcGRhdGVOb2RlKHZpZXcsIG5vZGVEZWYsIGFyZ1N0eWxlLCB2YWx1ZXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWJ1Z0NoZWNrTm9DaGFuZ2VzTm9kZSh2aWV3LCBub2RlRGVmLCBhcmdTdHlsZSwgdmFsdWVzKTtcbiAgICB9XG4gICAgaWYgKG5vZGVEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuVHlwZURpcmVjdGl2ZSkge1xuICAgICAgZGVidWdTZXRDdXJyZW50Tm9kZSh2aWV3LCBuZXh0RGlyZWN0aXZlV2l0aEJpbmRpbmcodmlldywgbm9kZUluZGV4KSk7XG4gICAgfVxuICAgIHJldHVybiAobm9kZURlZi5mbGFncyAmIE5vZGVGbGFncy5DYXRQdXJlRXhwcmVzc2lvbikgP1xuICAgICAgICBhc1B1cmVFeHByZXNzaW9uRGF0YSh2aWV3LCBub2RlRGVmLm5vZGVJbmRleCkudmFsdWUgOlxuICAgICAgICB1bmRlZmluZWQ7XG4gIH1cbn1cblxuZnVuY3Rpb24gZGVidWdVcGRhdGVSZW5kZXJlcih2aWV3OiBWaWV3RGF0YSwgY2hlY2tUeXBlOiBDaGVja1R5cGUpIHtcbiAgaWYgKHZpZXcuc3RhdGUgJiBWaWV3U3RhdGUuRGVzdHJveWVkKSB7XG4gICAgdGhyb3cgdmlld0Rlc3Ryb3llZEVycm9yKERlYnVnQWN0aW9uW19jdXJyZW50QWN0aW9uXSk7XG4gIH1cbiAgZGVidWdTZXRDdXJyZW50Tm9kZSh2aWV3LCBuZXh0UmVuZGVyTm9kZVdpdGhCaW5kaW5nKHZpZXcsIDApKTtcbiAgcmV0dXJuIHZpZXcuZGVmLnVwZGF0ZVJlbmRlcmVyKGRlYnVnQ2hlY2tSZW5kZXJOb2RlRm4sIHZpZXcpO1xuXG4gIGZ1bmN0aW9uIGRlYnVnQ2hlY2tSZW5kZXJOb2RlRm4oXG4gICAgICB2aWV3OiBWaWV3RGF0YSwgbm9kZUluZGV4OiBudW1iZXIsIGFyZ1N0eWxlOiBBcmd1bWVudFR5cGUsIC4uLnZhbHVlczogYW55W10pIHtcbiAgICBjb25zdCBub2RlRGVmID0gdmlldy5kZWYubm9kZXNbbm9kZUluZGV4XTtcbiAgICBpZiAoY2hlY2tUeXBlID09PSBDaGVja1R5cGUuQ2hlY2tBbmRVcGRhdGUpIHtcbiAgICAgIGRlYnVnQ2hlY2tBbmRVcGRhdGVOb2RlKHZpZXcsIG5vZGVEZWYsIGFyZ1N0eWxlLCB2YWx1ZXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWJ1Z0NoZWNrTm9DaGFuZ2VzTm9kZSh2aWV3LCBub2RlRGVmLCBhcmdTdHlsZSwgdmFsdWVzKTtcbiAgICB9XG4gICAgaWYgKG5vZGVEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuQ2F0UmVuZGVyTm9kZSkge1xuICAgICAgZGVidWdTZXRDdXJyZW50Tm9kZSh2aWV3LCBuZXh0UmVuZGVyTm9kZVdpdGhCaW5kaW5nKHZpZXcsIG5vZGVJbmRleCkpO1xuICAgIH1cbiAgICByZXR1cm4gKG5vZGVEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuQ2F0UHVyZUV4cHJlc3Npb24pID9cbiAgICAgICAgYXNQdXJlRXhwcmVzc2lvbkRhdGEodmlldywgbm9kZURlZi5ub2RlSW5kZXgpLnZhbHVlIDpcbiAgICAgICAgdW5kZWZpbmVkO1xuICB9XG59XG5cbmZ1bmN0aW9uIGRlYnVnQ2hlY2tBbmRVcGRhdGVOb2RlKFxuICAgIHZpZXc6IFZpZXdEYXRhLCBub2RlRGVmOiBOb2RlRGVmLCBhcmdTdHlsZTogQXJndW1lbnRUeXBlLCBnaXZlblZhbHVlczogYW55W10pOiB2b2lkIHtcbiAgY29uc3QgY2hhbmdlZCA9ICg8YW55PmNoZWNrQW5kVXBkYXRlTm9kZSkodmlldywgbm9kZURlZiwgYXJnU3R5bGUsIC4uLmdpdmVuVmFsdWVzKTtcbiAgaWYgKGNoYW5nZWQpIHtcbiAgICBjb25zdCB2YWx1ZXMgPSBhcmdTdHlsZSA9PT0gQXJndW1lbnRUeXBlLkR5bmFtaWMgPyBnaXZlblZhbHVlc1swXSA6IGdpdmVuVmFsdWVzO1xuICAgIGlmIChub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLlR5cGVEaXJlY3RpdmUpIHtcbiAgICAgIGNvbnN0IGJpbmRpbmdWYWx1ZXM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9ID0ge307XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5vZGVEZWYuYmluZGluZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgYmluZGluZyA9IG5vZGVEZWYuYmluZGluZ3NbaV07XG4gICAgICAgIGNvbnN0IHZhbHVlID0gdmFsdWVzW2ldO1xuICAgICAgICBpZiAoYmluZGluZy5mbGFncyAmIEJpbmRpbmdGbGFncy5UeXBlUHJvcGVydHkpIHtcbiAgICAgICAgICBiaW5kaW5nVmFsdWVzW25vcm1hbGl6ZURlYnVnQmluZGluZ05hbWUoYmluZGluZy5ub25NaW5pZmllZE5hbWUgISldID1cbiAgICAgICAgICAgICAgbm9ybWFsaXplRGVidWdCaW5kaW5nVmFsdWUodmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb25zdCBlbERlZiA9IG5vZGVEZWYucGFyZW50ICE7XG4gICAgICBjb25zdCBlbCA9IGFzRWxlbWVudERhdGEodmlldywgZWxEZWYubm9kZUluZGV4KS5yZW5kZXJFbGVtZW50O1xuICAgICAgaWYgKCFlbERlZi5lbGVtZW50ICEubmFtZSkge1xuICAgICAgICAvLyBhIGNvbW1lbnQuXG4gICAgICAgIHZpZXcucmVuZGVyZXIuc2V0VmFsdWUoZWwsIGBiaW5kaW5ncz0ke0pTT04uc3RyaW5naWZ5KGJpbmRpbmdWYWx1ZXMsIG51bGwsIDIpfWApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gYSByZWd1bGFyIGVsZW1lbnQuXG4gICAgICAgIGZvciAobGV0IGF0dHIgaW4gYmluZGluZ1ZhbHVlcykge1xuICAgICAgICAgIGNvbnN0IHZhbHVlID0gYmluZGluZ1ZhbHVlc1thdHRyXTtcbiAgICAgICAgICBpZiAodmFsdWUgIT0gbnVsbCkge1xuICAgICAgICAgICAgdmlldy5yZW5kZXJlci5zZXRBdHRyaWJ1dGUoZWwsIGF0dHIsIHZhbHVlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmlldy5yZW5kZXJlci5yZW1vdmVBdHRyaWJ1dGUoZWwsIGF0dHIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBkZWJ1Z0NoZWNrTm9DaGFuZ2VzTm9kZShcbiAgICB2aWV3OiBWaWV3RGF0YSwgbm9kZURlZjogTm9kZURlZiwgYXJnU3R5bGU6IEFyZ3VtZW50VHlwZSwgdmFsdWVzOiBhbnlbXSk6IHZvaWQge1xuICAoPGFueT5jaGVja05vQ2hhbmdlc05vZGUpKHZpZXcsIG5vZGVEZWYsIGFyZ1N0eWxlLCAuLi52YWx1ZXMpO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVEZWJ1Z0JpbmRpbmdOYW1lKG5hbWU6IHN0cmluZykge1xuICAvLyBBdHRyaWJ1dGUgbmFtZXMgd2l0aCBgJGAgKGVnIGB4LXkkYCkgYXJlIHZhbGlkIHBlciBzcGVjLCBidXQgdW5zdXBwb3J0ZWQgYnkgc29tZSBicm93c2Vyc1xuICBuYW1lID0gY2FtZWxDYXNlVG9EYXNoQ2FzZShuYW1lLnJlcGxhY2UoL1skQF0vZywgJ18nKSk7XG4gIHJldHVybiBgbmctcmVmbGVjdC0ke25hbWV9YDtcbn1cblxuY29uc3QgQ0FNRUxfQ0FTRV9SRUdFWFAgPSAvKFtBLVpdKS9nO1xuXG5mdW5jdGlvbiBjYW1lbENhc2VUb0Rhc2hDYXNlKGlucHV0OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gaW5wdXQucmVwbGFjZShDQU1FTF9DQVNFX1JFR0VYUCwgKC4uLm06IGFueVtdKSA9PiAnLScgKyBtWzFdLnRvTG93ZXJDYXNlKCkpO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVEZWJ1Z0JpbmRpbmdWYWx1ZSh2YWx1ZTogYW55KTogc3RyaW5nIHtcbiAgdHJ5IHtcbiAgICAvLyBMaW1pdCB0aGUgc2l6ZSBvZiB0aGUgdmFsdWUgYXMgb3RoZXJ3aXNlIHRoZSBET00ganVzdCBnZXRzIHBvbGx1dGVkLlxuICAgIHJldHVybiB2YWx1ZSAhPSBudWxsID8gdmFsdWUudG9TdHJpbmcoKS5zbGljZSgwLCAzMCkgOiB2YWx1ZTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiAnW0VSUk9SXSBFeGNlcHRpb24gd2hpbGUgdHJ5aW5nIHRvIHNlcmlhbGl6ZSB0aGUgdmFsdWUnO1xuICB9XG59XG5cbmZ1bmN0aW9uIG5leHREaXJlY3RpdmVXaXRoQmluZGluZyh2aWV3OiBWaWV3RGF0YSwgbm9kZUluZGV4OiBudW1iZXIpOiBudW1iZXJ8bnVsbCB7XG4gIGZvciAobGV0IGkgPSBub2RlSW5kZXg7IGkgPCB2aWV3LmRlZi5ub2Rlcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IG5vZGVEZWYgPSB2aWV3LmRlZi5ub2Rlc1tpXTtcbiAgICBpZiAobm9kZURlZi5mbGFncyAmIE5vZGVGbGFncy5UeXBlRGlyZWN0aXZlICYmIG5vZGVEZWYuYmluZGluZ3MgJiYgbm9kZURlZi5iaW5kaW5ncy5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gbmV4dFJlbmRlck5vZGVXaXRoQmluZGluZyh2aWV3OiBWaWV3RGF0YSwgbm9kZUluZGV4OiBudW1iZXIpOiBudW1iZXJ8bnVsbCB7XG4gIGZvciAobGV0IGkgPSBub2RlSW5kZXg7IGkgPCB2aWV3LmRlZi5ub2Rlcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IG5vZGVEZWYgPSB2aWV3LmRlZi5ub2Rlc1tpXTtcbiAgICBpZiAoKG5vZGVEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuQ2F0UmVuZGVyTm9kZSkgJiYgbm9kZURlZi5iaW5kaW5ncyAmJiBub2RlRGVmLmJpbmRpbmdzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIGk7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5jbGFzcyBEZWJ1Z0NvbnRleHRfIGltcGxlbWVudHMgRGVidWdDb250ZXh0IHtcbiAgcHJpdmF0ZSBub2RlRGVmOiBOb2RlRGVmO1xuICBwcml2YXRlIGVsVmlldzogVmlld0RhdGE7XG4gIHByaXZhdGUgZWxEZWY6IE5vZGVEZWY7XG5cbiAgY29uc3RydWN0b3IocHVibGljIHZpZXc6IFZpZXdEYXRhLCBwdWJsaWMgbm9kZUluZGV4OiBudW1iZXJ8bnVsbCkge1xuICAgIGlmIChub2RlSW5kZXggPT0gbnVsbCkge1xuICAgICAgdGhpcy5ub2RlSW5kZXggPSBub2RlSW5kZXggPSAwO1xuICAgIH1cbiAgICB0aGlzLm5vZGVEZWYgPSB2aWV3LmRlZi5ub2Rlc1tub2RlSW5kZXhdO1xuICAgIGxldCBlbERlZiA9IHRoaXMubm9kZURlZjtcbiAgICBsZXQgZWxWaWV3ID0gdmlldztcbiAgICB3aGlsZSAoZWxEZWYgJiYgKGVsRGVmLmZsYWdzICYgTm9kZUZsYWdzLlR5cGVFbGVtZW50KSA9PT0gMCkge1xuICAgICAgZWxEZWYgPSBlbERlZi5wYXJlbnQgITtcbiAgICB9XG4gICAgaWYgKCFlbERlZikge1xuICAgICAgd2hpbGUgKCFlbERlZiAmJiBlbFZpZXcpIHtcbiAgICAgICAgZWxEZWYgPSB2aWV3UGFyZW50RWwoZWxWaWV3KSAhO1xuICAgICAgICBlbFZpZXcgPSBlbFZpZXcucGFyZW50ICE7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuZWxEZWYgPSBlbERlZjtcbiAgICB0aGlzLmVsVmlldyA9IGVsVmlldztcbiAgfVxuXG4gIHByaXZhdGUgZ2V0IGVsT3JDb21wVmlldygpIHtcbiAgICAvLyBIYXMgdG8gYmUgZG9uZSBsYXppbHkgYXMgd2UgdXNlIHRoZSBEZWJ1Z0NvbnRleHQgYWxzbyBkdXJpbmcgY3JlYXRpb24gb2YgZWxlbWVudHMuLi5cbiAgICByZXR1cm4gYXNFbGVtZW50RGF0YSh0aGlzLmVsVmlldywgdGhpcy5lbERlZi5ub2RlSW5kZXgpLmNvbXBvbmVudFZpZXcgfHwgdGhpcy52aWV3O1xuICB9XG5cbiAgZ2V0IGluamVjdG9yKCk6IEluamVjdG9yIHsgcmV0dXJuIGNyZWF0ZUluamVjdG9yKHRoaXMuZWxWaWV3LCB0aGlzLmVsRGVmKTsgfVxuXG4gIGdldCBjb21wb25lbnQoKTogYW55IHsgcmV0dXJuIHRoaXMuZWxPckNvbXBWaWV3LmNvbXBvbmVudDsgfVxuXG4gIGdldCBjb250ZXh0KCk6IGFueSB7IHJldHVybiB0aGlzLmVsT3JDb21wVmlldy5jb250ZXh0OyB9XG5cbiAgZ2V0IHByb3ZpZGVyVG9rZW5zKCk6IGFueVtdIHtcbiAgICBjb25zdCB0b2tlbnM6IGFueVtdID0gW107XG4gICAgaWYgKHRoaXMuZWxEZWYpIHtcbiAgICAgIGZvciAobGV0IGkgPSB0aGlzLmVsRGVmLm5vZGVJbmRleCArIDE7IGkgPD0gdGhpcy5lbERlZi5ub2RlSW5kZXggKyB0aGlzLmVsRGVmLmNoaWxkQ291bnQ7XG4gICAgICAgICAgIGkrKykge1xuICAgICAgICBjb25zdCBjaGlsZERlZiA9IHRoaXMuZWxWaWV3LmRlZi5ub2Rlc1tpXTtcbiAgICAgICAgaWYgKGNoaWxkRGVmLmZsYWdzICYgTm9kZUZsYWdzLkNhdFByb3ZpZGVyKSB7XG4gICAgICAgICAgdG9rZW5zLnB1c2goY2hpbGREZWYucHJvdmlkZXIgIS50b2tlbik7XG4gICAgICAgIH1cbiAgICAgICAgaSArPSBjaGlsZERlZi5jaGlsZENvdW50O1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdG9rZW5zO1xuICB9XG5cbiAgZ2V0IHJlZmVyZW5jZXMoKToge1trZXk6IHN0cmluZ106IGFueX0ge1xuICAgIGNvbnN0IHJlZmVyZW5jZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9ID0ge307XG4gICAgaWYgKHRoaXMuZWxEZWYpIHtcbiAgICAgIGNvbGxlY3RSZWZlcmVuY2VzKHRoaXMuZWxWaWV3LCB0aGlzLmVsRGVmLCByZWZlcmVuY2VzKTtcblxuICAgICAgZm9yIChsZXQgaSA9IHRoaXMuZWxEZWYubm9kZUluZGV4ICsgMTsgaSA8PSB0aGlzLmVsRGVmLm5vZGVJbmRleCArIHRoaXMuZWxEZWYuY2hpbGRDb3VudDtcbiAgICAgICAgICAgaSsrKSB7XG4gICAgICAgIGNvbnN0IGNoaWxkRGVmID0gdGhpcy5lbFZpZXcuZGVmLm5vZGVzW2ldO1xuICAgICAgICBpZiAoY2hpbGREZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuQ2F0UHJvdmlkZXIpIHtcbiAgICAgICAgICBjb2xsZWN0UmVmZXJlbmNlcyh0aGlzLmVsVmlldywgY2hpbGREZWYsIHJlZmVyZW5jZXMpO1xuICAgICAgICB9XG4gICAgICAgIGkgKz0gY2hpbGREZWYuY2hpbGRDb3VudDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlZmVyZW5jZXM7XG4gIH1cblxuICBnZXQgY29tcG9uZW50UmVuZGVyRWxlbWVudCgpIHtcbiAgICBjb25zdCBlbERhdGEgPSBmaW5kSG9zdEVsZW1lbnQodGhpcy5lbE9yQ29tcFZpZXcpO1xuICAgIHJldHVybiBlbERhdGEgPyBlbERhdGEucmVuZGVyRWxlbWVudCA6IHVuZGVmaW5lZDtcbiAgfVxuXG4gIGdldCByZW5kZXJOb2RlKCk6IGFueSB7XG4gICAgcmV0dXJuIHRoaXMubm9kZURlZi5mbGFncyAmIE5vZGVGbGFncy5UeXBlVGV4dCA/IHJlbmRlck5vZGUodGhpcy52aWV3LCB0aGlzLm5vZGVEZWYpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVuZGVyTm9kZSh0aGlzLmVsVmlldywgdGhpcy5lbERlZik7XG4gIH1cblxuICBsb2dFcnJvcihjb25zb2xlOiBDb25zb2xlLCAuLi52YWx1ZXM6IGFueVtdKSB7XG4gICAgbGV0IGxvZ1ZpZXdEZWY6IFZpZXdEZWZpbml0aW9uO1xuICAgIGxldCBsb2dOb2RlSW5kZXg6IG51bWJlcjtcbiAgICBpZiAodGhpcy5ub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLlR5cGVUZXh0KSB7XG4gICAgICBsb2dWaWV3RGVmID0gdGhpcy52aWV3LmRlZjtcbiAgICAgIGxvZ05vZGVJbmRleCA9IHRoaXMubm9kZURlZi5ub2RlSW5kZXg7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxvZ1ZpZXdEZWYgPSB0aGlzLmVsVmlldy5kZWY7XG4gICAgICBsb2dOb2RlSW5kZXggPSB0aGlzLmVsRGVmLm5vZGVJbmRleDtcbiAgICB9XG4gICAgLy8gTm90ZTogd2Ugb25seSBnZW5lcmF0ZSBhIGxvZyBmdW5jdGlvbiBmb3IgdGV4dCBhbmQgZWxlbWVudCBub2Rlc1xuICAgIC8vIHRvIG1ha2UgdGhlIGdlbmVyYXRlZCBjb2RlIGFzIHNtYWxsIGFzIHBvc3NpYmxlLlxuICAgIGNvbnN0IHJlbmRlck5vZGVJbmRleCA9IGdldFJlbmRlck5vZGVJbmRleChsb2dWaWV3RGVmLCBsb2dOb2RlSW5kZXgpO1xuICAgIGxldCBjdXJyUmVuZGVyTm9kZUluZGV4ID0gLTE7XG4gICAgbGV0IG5vZGVMb2dnZXI6IE5vZGVMb2dnZXIgPSAoKSA9PiB7XG4gICAgICBjdXJyUmVuZGVyTm9kZUluZGV4Kys7XG4gICAgICBpZiAoY3VyclJlbmRlck5vZGVJbmRleCA9PT0gcmVuZGVyTm9kZUluZGV4KSB7XG4gICAgICAgIHJldHVybiBjb25zb2xlLmVycm9yLmJpbmQoY29uc29sZSwgLi4udmFsdWVzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBOT09QO1xuICAgICAgfVxuICAgIH07XG4gICAgbG9nVmlld0RlZi5mYWN0b3J5ICEobm9kZUxvZ2dlcik7XG4gICAgaWYgKGN1cnJSZW5kZXJOb2RlSW5kZXggPCByZW5kZXJOb2RlSW5kZXgpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0lsbGVnYWwgc3RhdGU6IHRoZSBWaWV3RGVmaW5pdGlvbkZhY3RvcnkgZGlkIG5vdCBjYWxsIHRoZSBsb2dnZXIhJyk7XG4gICAgICAoPGFueT5jb25zb2xlLmVycm9yKSguLi52YWx1ZXMpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRSZW5kZXJOb2RlSW5kZXgodmlld0RlZjogVmlld0RlZmluaXRpb24sIG5vZGVJbmRleDogbnVtYmVyKTogbnVtYmVyIHtcbiAgbGV0IHJlbmRlck5vZGVJbmRleCA9IC0xO1xuICBmb3IgKGxldCBpID0gMDsgaSA8PSBub2RlSW5kZXg7IGkrKykge1xuICAgIGNvbnN0IG5vZGVEZWYgPSB2aWV3RGVmLm5vZGVzW2ldO1xuICAgIGlmIChub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLkNhdFJlbmRlck5vZGUpIHtcbiAgICAgIHJlbmRlck5vZGVJbmRleCsrO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVuZGVyTm9kZUluZGV4O1xufVxuXG5mdW5jdGlvbiBmaW5kSG9zdEVsZW1lbnQodmlldzogVmlld0RhdGEpOiBFbGVtZW50RGF0YXxudWxsIHtcbiAgd2hpbGUgKHZpZXcgJiYgIWlzQ29tcG9uZW50Vmlldyh2aWV3KSkge1xuICAgIHZpZXcgPSB2aWV3LnBhcmVudCAhO1xuICB9XG4gIGlmICh2aWV3LnBhcmVudCkge1xuICAgIHJldHVybiBhc0VsZW1lbnREYXRhKHZpZXcucGFyZW50LCB2aWV3UGFyZW50RWwodmlldykgIS5ub2RlSW5kZXgpO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBjb2xsZWN0UmVmZXJlbmNlcyh2aWV3OiBWaWV3RGF0YSwgbm9kZURlZjogTm9kZURlZiwgcmVmZXJlbmNlczoge1trZXk6IHN0cmluZ106IGFueX0pIHtcbiAgZm9yIChsZXQgcmVmTmFtZSBpbiBub2RlRGVmLnJlZmVyZW5jZXMpIHtcbiAgICByZWZlcmVuY2VzW3JlZk5hbWVdID0gZ2V0UXVlcnlWYWx1ZSh2aWV3LCBub2RlRGVmLCBub2RlRGVmLnJlZmVyZW5jZXNbcmVmTmFtZV0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNhbGxXaXRoRGVidWdDb250ZXh0KGFjdGlvbjogRGVidWdBY3Rpb24sIGZuOiBhbnksIHNlbGY6IGFueSwgYXJnczogYW55W10pIHtcbiAgY29uc3Qgb2xkQWN0aW9uID0gX2N1cnJlbnRBY3Rpb247XG4gIGNvbnN0IG9sZFZpZXcgPSBfY3VycmVudFZpZXc7XG4gIGNvbnN0IG9sZE5vZGVJbmRleCA9IF9jdXJyZW50Tm9kZUluZGV4O1xuICB0cnkge1xuICAgIF9jdXJyZW50QWN0aW9uID0gYWN0aW9uO1xuICAgIGNvbnN0IHJlc3VsdCA9IGZuLmFwcGx5KHNlbGYsIGFyZ3MpO1xuICAgIF9jdXJyZW50VmlldyA9IG9sZFZpZXc7XG4gICAgX2N1cnJlbnROb2RlSW5kZXggPSBvbGROb2RlSW5kZXg7XG4gICAgX2N1cnJlbnRBY3Rpb24gPSBvbGRBY3Rpb247XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGlmIChpc1ZpZXdEZWJ1Z0Vycm9yKGUpIHx8ICFfY3VycmVudFZpZXcpIHtcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICAgIHRocm93IHZpZXdXcmFwcGVkRGVidWdFcnJvcihlLCBnZXRDdXJyZW50RGVidWdDb250ZXh0KCkgISk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEN1cnJlbnREZWJ1Z0NvbnRleHQoKTogRGVidWdDb250ZXh0fG51bGwge1xuICByZXR1cm4gX2N1cnJlbnRWaWV3ID8gbmV3IERlYnVnQ29udGV4dF8oX2N1cnJlbnRWaWV3LCBfY3VycmVudE5vZGVJbmRleCkgOiBudWxsO1xufVxuXG5leHBvcnQgY2xhc3MgRGVidWdSZW5kZXJlckZhY3RvcnkyIGltcGxlbWVudHMgUmVuZGVyZXJGYWN0b3J5MiB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgZGVsZWdhdGU6IFJlbmRlcmVyRmFjdG9yeTIpIHt9XG5cbiAgY3JlYXRlUmVuZGVyZXIoZWxlbWVudDogYW55LCByZW5kZXJEYXRhOiBSZW5kZXJlclR5cGUyfG51bGwpOiBSZW5kZXJlcjIge1xuICAgIHJldHVybiBuZXcgRGVidWdSZW5kZXJlcjIodGhpcy5kZWxlZ2F0ZS5jcmVhdGVSZW5kZXJlcihlbGVtZW50LCByZW5kZXJEYXRhKSk7XG4gIH1cblxuICBiZWdpbigpIHtcbiAgICBpZiAodGhpcy5kZWxlZ2F0ZS5iZWdpbikge1xuICAgICAgdGhpcy5kZWxlZ2F0ZS5iZWdpbigpO1xuICAgIH1cbiAgfVxuICBlbmQoKSB7XG4gICAgaWYgKHRoaXMuZGVsZWdhdGUuZW5kKSB7XG4gICAgICB0aGlzLmRlbGVnYXRlLmVuZCgpO1xuICAgIH1cbiAgfVxuXG4gIHdoZW5SZW5kZXJpbmdEb25lKCk6IFByb21pc2U8YW55PiB7XG4gICAgaWYgKHRoaXMuZGVsZWdhdGUud2hlblJlbmRlcmluZ0RvbmUpIHtcbiAgICAgIHJldHVybiB0aGlzLmRlbGVnYXRlLndoZW5SZW5kZXJpbmdEb25lKCk7XG4gICAgfVxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobnVsbCk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIERlYnVnUmVuZGVyZXIyIGltcGxlbWVudHMgUmVuZGVyZXIyIHtcbiAgcmVhZG9ubHkgZGF0YToge1trZXk6IHN0cmluZ106IGFueX07XG5cbiAgLyoqXG4gICAqIEZhY3RvcnkgZnVuY3Rpb24gdXNlZCB0byBjcmVhdGUgYSBgRGVidWdDb250ZXh0YCB3aGVuIGEgbm9kZSBpcyBjcmVhdGVkLlxuICAgKlxuICAgKiBUaGUgYERlYnVnQ29udGV4dGAgYWxsb3dzIHRvIHJldHJpZXZlIGluZm9ybWF0aW9uIGFib3V0IHRoZSBub2RlcyB0aGF0IGFyZSB1c2VmdWwgaW4gdGVzdHMuXG4gICAqXG4gICAqIFRoZSBmYWN0b3J5IGlzIGNvbmZpZ3VyYWJsZSBzbyB0aGF0IHRoZSBgRGVidWdSZW5kZXJlcjJgIGNvdWxkIGluc3RhbnRpYXRlIGVpdGhlciBhIFZpZXcgRW5naW5lXG4gICAqIG9yIGEgUmVuZGVyIGNvbnRleHQuXG4gICAqL1xuICBkZWJ1Z0NvbnRleHRGYWN0b3J5OiAoKSA9PiBEZWJ1Z0NvbnRleHQgfCBudWxsID0gZ2V0Q3VycmVudERlYnVnQ29udGV4dDtcblxuICBwcml2YXRlIGdldCBkZWJ1Z0NvbnRleHQoKSB7IHJldHVybiB0aGlzLmRlYnVnQ29udGV4dEZhY3RvcnkoKTsgfVxuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgZGVsZWdhdGU6IFJlbmRlcmVyMikgeyB0aGlzLmRhdGEgPSB0aGlzLmRlbGVnYXRlLmRhdGE7IH1cblxuICBkZXN0cm95Tm9kZShub2RlOiBhbnkpIHtcbiAgICByZW1vdmVEZWJ1Z05vZGVGcm9tSW5kZXgoZ2V0RGVidWdOb2RlKG5vZGUpICEpO1xuICAgIGlmICh0aGlzLmRlbGVnYXRlLmRlc3Ryb3lOb2RlKSB7XG4gICAgICB0aGlzLmRlbGVnYXRlLmRlc3Ryb3lOb2RlKG5vZGUpO1xuICAgIH1cbiAgfVxuXG4gIGRlc3Ryb3koKSB7IHRoaXMuZGVsZWdhdGUuZGVzdHJveSgpOyB9XG5cbiAgY3JlYXRlRWxlbWVudChuYW1lOiBzdHJpbmcsIG5hbWVzcGFjZT86IHN0cmluZyk6IGFueSB7XG4gICAgY29uc3QgZWwgPSB0aGlzLmRlbGVnYXRlLmNyZWF0ZUVsZW1lbnQobmFtZSwgbmFtZXNwYWNlKTtcbiAgICBjb25zdCBkZWJ1Z0N0eCA9IHRoaXMuZGVidWdDb250ZXh0O1xuICAgIGlmIChkZWJ1Z0N0eCkge1xuICAgICAgY29uc3QgZGVidWdFbCA9IG5ldyBEZWJ1Z0VsZW1lbnQoZWwsIG51bGwsIGRlYnVnQ3R4KTtcbiAgICAgIGRlYnVnRWwubmFtZSA9IG5hbWU7XG4gICAgICBpbmRleERlYnVnTm9kZShkZWJ1Z0VsKTtcbiAgICB9XG4gICAgcmV0dXJuIGVsO1xuICB9XG5cbiAgY3JlYXRlQ29tbWVudCh2YWx1ZTogc3RyaW5nKTogYW55IHtcbiAgICBjb25zdCBjb21tZW50ID0gdGhpcy5kZWxlZ2F0ZS5jcmVhdGVDb21tZW50KHZhbHVlKTtcbiAgICBjb25zdCBkZWJ1Z0N0eCA9IHRoaXMuZGVidWdDb250ZXh0O1xuICAgIGlmIChkZWJ1Z0N0eCkge1xuICAgICAgaW5kZXhEZWJ1Z05vZGUobmV3IERlYnVnTm9kZShjb21tZW50LCBudWxsLCBkZWJ1Z0N0eCkpO1xuICAgIH1cbiAgICByZXR1cm4gY29tbWVudDtcbiAgfVxuXG4gIGNyZWF0ZVRleHQodmFsdWU6IHN0cmluZyk6IGFueSB7XG4gICAgY29uc3QgdGV4dCA9IHRoaXMuZGVsZWdhdGUuY3JlYXRlVGV4dCh2YWx1ZSk7XG4gICAgY29uc3QgZGVidWdDdHggPSB0aGlzLmRlYnVnQ29udGV4dDtcbiAgICBpZiAoZGVidWdDdHgpIHtcbiAgICAgIGluZGV4RGVidWdOb2RlKG5ldyBEZWJ1Z05vZGUodGV4dCwgbnVsbCwgZGVidWdDdHgpKTtcbiAgICB9XG4gICAgcmV0dXJuIHRleHQ7XG4gIH1cblxuICBhcHBlbmRDaGlsZChwYXJlbnQ6IGFueSwgbmV3Q2hpbGQ6IGFueSk6IHZvaWQge1xuICAgIGNvbnN0IGRlYnVnRWwgPSBnZXREZWJ1Z05vZGUocGFyZW50KTtcbiAgICBjb25zdCBkZWJ1Z0NoaWxkRWwgPSBnZXREZWJ1Z05vZGUobmV3Q2hpbGQpO1xuICAgIGlmIChkZWJ1Z0VsICYmIGRlYnVnQ2hpbGRFbCAmJiBkZWJ1Z0VsIGluc3RhbmNlb2YgRGVidWdFbGVtZW50KSB7XG4gICAgICBkZWJ1Z0VsLmFkZENoaWxkKGRlYnVnQ2hpbGRFbCk7XG4gICAgfVxuICAgIHRoaXMuZGVsZWdhdGUuYXBwZW5kQ2hpbGQocGFyZW50LCBuZXdDaGlsZCk7XG4gIH1cblxuICBpbnNlcnRCZWZvcmUocGFyZW50OiBhbnksIG5ld0NoaWxkOiBhbnksIHJlZkNoaWxkOiBhbnkpOiB2b2lkIHtcbiAgICBjb25zdCBkZWJ1Z0VsID0gZ2V0RGVidWdOb2RlKHBhcmVudCk7XG4gICAgY29uc3QgZGVidWdDaGlsZEVsID0gZ2V0RGVidWdOb2RlKG5ld0NoaWxkKTtcbiAgICBjb25zdCBkZWJ1Z1JlZkVsID0gZ2V0RGVidWdOb2RlKHJlZkNoaWxkKSAhO1xuICAgIGlmIChkZWJ1Z0VsICYmIGRlYnVnQ2hpbGRFbCAmJiBkZWJ1Z0VsIGluc3RhbmNlb2YgRGVidWdFbGVtZW50KSB7XG4gICAgICBkZWJ1Z0VsLmluc2VydEJlZm9yZShkZWJ1Z1JlZkVsLCBkZWJ1Z0NoaWxkRWwpO1xuICAgIH1cblxuICAgIHRoaXMuZGVsZWdhdGUuaW5zZXJ0QmVmb3JlKHBhcmVudCwgbmV3Q2hpbGQsIHJlZkNoaWxkKTtcbiAgfVxuXG4gIHJlbW92ZUNoaWxkKHBhcmVudDogYW55LCBvbGRDaGlsZDogYW55KTogdm9pZCB7XG4gICAgY29uc3QgZGVidWdFbCA9IGdldERlYnVnTm9kZShwYXJlbnQpO1xuICAgIGNvbnN0IGRlYnVnQ2hpbGRFbCA9IGdldERlYnVnTm9kZShvbGRDaGlsZCk7XG4gICAgaWYgKGRlYnVnRWwgJiYgZGVidWdDaGlsZEVsICYmIGRlYnVnRWwgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnQpIHtcbiAgICAgIGRlYnVnRWwucmVtb3ZlQ2hpbGQoZGVidWdDaGlsZEVsKTtcbiAgICB9XG4gICAgdGhpcy5kZWxlZ2F0ZS5yZW1vdmVDaGlsZChwYXJlbnQsIG9sZENoaWxkKTtcbiAgfVxuXG4gIHNlbGVjdFJvb3RFbGVtZW50KHNlbGVjdG9yT3JOb2RlOiBzdHJpbmd8YW55LCBwcmVzZXJ2ZUNvbnRlbnQ/OiBib29sZWFuKTogYW55IHtcbiAgICBjb25zdCBlbCA9IHRoaXMuZGVsZWdhdGUuc2VsZWN0Um9vdEVsZW1lbnQoc2VsZWN0b3JPck5vZGUsIHByZXNlcnZlQ29udGVudCk7XG4gICAgY29uc3QgZGVidWdDdHggPSBnZXRDdXJyZW50RGVidWdDb250ZXh0KCk7XG4gICAgaWYgKGRlYnVnQ3R4KSB7XG4gICAgICBpbmRleERlYnVnTm9kZShuZXcgRGVidWdFbGVtZW50KGVsLCBudWxsLCBkZWJ1Z0N0eCkpO1xuICAgIH1cbiAgICByZXR1cm4gZWw7XG4gIH1cblxuICBzZXRBdHRyaWJ1dGUoZWw6IGFueSwgbmFtZTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nLCBuYW1lc3BhY2U/OiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCBkZWJ1Z0VsID0gZ2V0RGVidWdOb2RlKGVsKTtcbiAgICBpZiAoZGVidWdFbCAmJiBkZWJ1Z0VsIGluc3RhbmNlb2YgRGVidWdFbGVtZW50KSB7XG4gICAgICBjb25zdCBmdWxsTmFtZSA9IG5hbWVzcGFjZSA/IG5hbWVzcGFjZSArICc6JyArIG5hbWUgOiBuYW1lO1xuICAgICAgZGVidWdFbC5hdHRyaWJ1dGVzW2Z1bGxOYW1lXSA9IHZhbHVlO1xuICAgIH1cbiAgICB0aGlzLmRlbGVnYXRlLnNldEF0dHJpYnV0ZShlbCwgbmFtZSwgdmFsdWUsIG5hbWVzcGFjZSk7XG4gIH1cblxuICByZW1vdmVBdHRyaWJ1dGUoZWw6IGFueSwgbmFtZTogc3RyaW5nLCBuYW1lc3BhY2U/OiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCBkZWJ1Z0VsID0gZ2V0RGVidWdOb2RlKGVsKTtcbiAgICBpZiAoZGVidWdFbCAmJiBkZWJ1Z0VsIGluc3RhbmNlb2YgRGVidWdFbGVtZW50KSB7XG4gICAgICBjb25zdCBmdWxsTmFtZSA9IG5hbWVzcGFjZSA/IG5hbWVzcGFjZSArICc6JyArIG5hbWUgOiBuYW1lO1xuICAgICAgZGVidWdFbC5hdHRyaWJ1dGVzW2Z1bGxOYW1lXSA9IG51bGw7XG4gICAgfVxuICAgIHRoaXMuZGVsZWdhdGUucmVtb3ZlQXR0cmlidXRlKGVsLCBuYW1lLCBuYW1lc3BhY2UpO1xuICB9XG5cbiAgYWRkQ2xhc3MoZWw6IGFueSwgbmFtZTogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3QgZGVidWdFbCA9IGdldERlYnVnTm9kZShlbCk7XG4gICAgaWYgKGRlYnVnRWwgJiYgZGVidWdFbCBpbnN0YW5jZW9mIERlYnVnRWxlbWVudCkge1xuICAgICAgZGVidWdFbC5jbGFzc2VzW25hbWVdID0gdHJ1ZTtcbiAgICB9XG4gICAgdGhpcy5kZWxlZ2F0ZS5hZGRDbGFzcyhlbCwgbmFtZSk7XG4gIH1cblxuICByZW1vdmVDbGFzcyhlbDogYW55LCBuYW1lOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCBkZWJ1Z0VsID0gZ2V0RGVidWdOb2RlKGVsKTtcbiAgICBpZiAoZGVidWdFbCAmJiBkZWJ1Z0VsIGluc3RhbmNlb2YgRGVidWdFbGVtZW50KSB7XG4gICAgICBkZWJ1Z0VsLmNsYXNzZXNbbmFtZV0gPSBmYWxzZTtcbiAgICB9XG4gICAgdGhpcy5kZWxlZ2F0ZS5yZW1vdmVDbGFzcyhlbCwgbmFtZSk7XG4gIH1cblxuICBzZXRTdHlsZShlbDogYW55LCBzdHlsZTogc3RyaW5nLCB2YWx1ZTogYW55LCBmbGFnczogUmVuZGVyZXJTdHlsZUZsYWdzMik6IHZvaWQge1xuICAgIGNvbnN0IGRlYnVnRWwgPSBnZXREZWJ1Z05vZGUoZWwpO1xuICAgIGlmIChkZWJ1Z0VsICYmIGRlYnVnRWwgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnQpIHtcbiAgICAgIGRlYnVnRWwuc3R5bGVzW3N0eWxlXSA9IHZhbHVlO1xuICAgIH1cbiAgICB0aGlzLmRlbGVnYXRlLnNldFN0eWxlKGVsLCBzdHlsZSwgdmFsdWUsIGZsYWdzKTtcbiAgfVxuXG4gIHJlbW92ZVN0eWxlKGVsOiBhbnksIHN0eWxlOiBzdHJpbmcsIGZsYWdzOiBSZW5kZXJlclN0eWxlRmxhZ3MyKTogdm9pZCB7XG4gICAgY29uc3QgZGVidWdFbCA9IGdldERlYnVnTm9kZShlbCk7XG4gICAgaWYgKGRlYnVnRWwgJiYgZGVidWdFbCBpbnN0YW5jZW9mIERlYnVnRWxlbWVudCkge1xuICAgICAgZGVidWdFbC5zdHlsZXNbc3R5bGVdID0gbnVsbDtcbiAgICB9XG4gICAgdGhpcy5kZWxlZ2F0ZS5yZW1vdmVTdHlsZShlbCwgc3R5bGUsIGZsYWdzKTtcbiAgfVxuXG4gIHNldFByb3BlcnR5KGVsOiBhbnksIG5hbWU6IHN0cmluZywgdmFsdWU6IGFueSk6IHZvaWQge1xuICAgIGNvbnN0IGRlYnVnRWwgPSBnZXREZWJ1Z05vZGUoZWwpO1xuICAgIGlmIChkZWJ1Z0VsICYmIGRlYnVnRWwgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnQpIHtcbiAgICAgIGRlYnVnRWwucHJvcGVydGllc1tuYW1lXSA9IHZhbHVlO1xuICAgIH1cbiAgICB0aGlzLmRlbGVnYXRlLnNldFByb3BlcnR5KGVsLCBuYW1lLCB2YWx1ZSk7XG4gIH1cblxuICBsaXN0ZW4oXG4gICAgICB0YXJnZXQ6ICdkb2N1bWVudCd8J3dpbmRvd3MnfCdib2R5J3xhbnksIGV2ZW50TmFtZTogc3RyaW5nLFxuICAgICAgY2FsbGJhY2s6IChldmVudDogYW55KSA9PiBib29sZWFuKTogKCkgPT4gdm9pZCB7XG4gICAgaWYgKHR5cGVvZiB0YXJnZXQgIT09ICdzdHJpbmcnKSB7XG4gICAgICBjb25zdCBkZWJ1Z0VsID0gZ2V0RGVidWdOb2RlKHRhcmdldCk7XG4gICAgICBpZiAoZGVidWdFbCkge1xuICAgICAgICBkZWJ1Z0VsLmxpc3RlbmVycy5wdXNoKG5ldyBFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgY2FsbGJhY2spKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5kZWxlZ2F0ZS5saXN0ZW4odGFyZ2V0LCBldmVudE5hbWUsIGNhbGxiYWNrKTtcbiAgfVxuXG4gIHBhcmVudE5vZGUobm9kZTogYW55KTogYW55IHsgcmV0dXJuIHRoaXMuZGVsZWdhdGUucGFyZW50Tm9kZShub2RlKTsgfVxuICBuZXh0U2libGluZyhub2RlOiBhbnkpOiBhbnkgeyByZXR1cm4gdGhpcy5kZWxlZ2F0ZS5uZXh0U2libGluZyhub2RlKTsgfVxuICBzZXRWYWx1ZShub2RlOiBhbnksIHZhbHVlOiBzdHJpbmcpOiB2b2lkIHsgcmV0dXJuIHRoaXMuZGVsZWdhdGUuc2V0VmFsdWUobm9kZSwgdmFsdWUpOyB9XG59XG4iXX0=