/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
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
var initialized = false;
export function initServicesIfNeeded() {
    if (initialized) {
        return;
    }
    initialized = true;
    var services = isDevMode() ? createDebugServices() : createProdServices();
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
function createProdServices() {
    return {
        setCurrentNode: function () { },
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
        createDebugContext: function (view, nodeIndex) { return new DebugContext_(view, nodeIndex); },
        handleEvent: function (view, nodeIndex, eventName, event) {
            return view.def.handleEvent(view, nodeIndex, eventName, event);
        },
        updateDirectives: function (view, checkType) { return view.def.updateDirectives(checkType === 0 /* CheckAndUpdate */ ? prodCheckAndUpdateNode :
            prodCheckNoChangesNode, view); },
        updateRenderer: function (view, checkType) { return view.def.updateRenderer(checkType === 0 /* CheckAndUpdate */ ? prodCheckAndUpdateNode :
            prodCheckNoChangesNode, view); },
    };
}
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
        createDebugContext: function (view, nodeIndex) { return new DebugContext_(view, nodeIndex); },
        handleEvent: debugHandleEvent,
        updateDirectives: debugUpdateDirectives,
        updateRenderer: debugUpdateRenderer,
    };
}
function createProdRootView(elInjector, projectableNodes, rootSelectorOrNode, def, ngModule, context) {
    var rendererFactory = ngModule.injector.get(RendererFactory2);
    return createRootView(createRootData(elInjector, ngModule, rendererFactory, projectableNodes, rootSelectorOrNode), def, context);
}
function debugCreateRootView(elInjector, projectableNodes, rootSelectorOrNode, def, ngModule, context) {
    var rendererFactory = ngModule.injector.get(RendererFactory2);
    var root = createRootData(elInjector, ngModule, new DebugRendererFactory2(rendererFactory), projectableNodes, rootSelectorOrNode);
    var defWithOverride = applyProviderOverridesToView(def);
    return callWithDebugContext(DebugAction.create, createRootView, null, [root, defWithOverride, context]);
}
function createRootData(elInjector, ngModule, rendererFactory, projectableNodes, rootSelectorOrNode) {
    var sanitizer = ngModule.injector.get(Sanitizer);
    var errorHandler = ngModule.injector.get(ErrorHandler);
    var renderer = rendererFactory.createRenderer(null, null);
    return {
        ngModule: ngModule,
        injector: elInjector, projectableNodes: projectableNodes,
        selectorOrNode: rootSelectorOrNode, sanitizer: sanitizer, rendererFactory: rendererFactory, renderer: renderer, errorHandler: errorHandler
    };
}
function debugCreateEmbeddedView(parentView, anchorDef, viewDef, context) {
    var defWithOverride = applyProviderOverridesToView(viewDef);
    return callWithDebugContext(DebugAction.create, createEmbeddedView, null, [parentView, anchorDef, defWithOverride, context]);
}
function debugCreateComponentView(parentView, nodeDef, viewDef, hostElement) {
    var overrideComponentView = viewDefOverrides.get(nodeDef.element.componentProvider.provider.token);
    if (overrideComponentView) {
        viewDef = overrideComponentView;
    }
    else {
        viewDef = applyProviderOverridesToView(viewDef);
    }
    return callWithDebugContext(DebugAction.create, createComponentView, null, [parentView, nodeDef, viewDef, hostElement]);
}
function debugCreateNgModuleRef(moduleType, parentInjector, bootstrapComponents, def) {
    var defWithOverride = applyProviderOverridesToNgModule(def);
    return createNgModuleRef(moduleType, parentInjector, bootstrapComponents, defWithOverride);
}
var providerOverrides = new Map();
var providerOverridesWithScope = new Map();
var viewDefOverrides = new Map();
function debugOverrideProvider(override) {
    providerOverrides.set(override.token, override);
    var injectableDef;
    if (typeof override.token === 'function' && (injectableDef = getInjectableDef(override.token)) &&
        typeof injectableDef.providedIn === 'function') {
        providerOverridesWithScope.set(override.token, override);
    }
}
function debugOverrideComponentView(comp, compFactory) {
    var hostViewDef = resolveDefinition(getComponentViewDefinitionFactory(compFactory));
    var compViewDef = resolveDefinition(hostViewDef.nodes[0].element.componentView);
    viewDefOverrides.set(comp, compViewDef);
}
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
function applyProviderOverridesToView(def) {
    if (providerOverrides.size === 0) {
        return def;
    }
    var elementIndicesWithOverwrittenProviders = findElementIndicesWithOverwrittenProviders(def);
    if (elementIndicesWithOverwrittenProviders.length === 0) {
        return def;
    }
    // clone the whole view definition,
    // as it maintains references between the nodes that are hard to update.
    def = def.factory(function () { return NOOP; });
    for (var i = 0; i < elementIndicesWithOverwrittenProviders.length; i++) {
        applyProviderOverridesToElement(def, elementIndicesWithOverwrittenProviders[i]);
    }
    return def;
    function findElementIndicesWithOverwrittenProviders(def) {
        var elIndicesWithOverwrittenProviders = [];
        var lastElementDef = null;
        for (var i = 0; i < def.nodes.length; i++) {
            var nodeDef = def.nodes[i];
            if (nodeDef.flags & 1 /* TypeElement */) {
                lastElementDef = nodeDef;
            }
            if (lastElementDef && nodeDef.flags & 3840 /* CatProviderNoDirective */ &&
                providerOverrides.has(nodeDef.provider.token)) {
                elIndicesWithOverwrittenProviders.push(lastElementDef.nodeIndex);
                lastElementDef = null;
            }
        }
        return elIndicesWithOverwrittenProviders;
    }
    function applyProviderOverridesToElement(viewDef, elIndex) {
        for (var i = elIndex + 1; i < viewDef.nodes.length; i++) {
            var nodeDef = viewDef.nodes[i];
            if (nodeDef.flags & 1 /* TypeElement */) {
                // stop at the next element
                return;
            }
            if (nodeDef.flags & 3840 /* CatProviderNoDirective */) {
                var provider = nodeDef.provider;
                var override = providerOverrides.get(provider.token);
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
function applyProviderOverridesToNgModule(def) {
    var _a = calcHasOverrides(def), hasOverrides = _a.hasOverrides, hasDeprecatedOverrides = _a.hasDeprecatedOverrides;
    if (!hasOverrides) {
        return def;
    }
    // clone the whole view definition,
    // as it maintains references between the nodes that are hard to update.
    def = def.factory(function () { return NOOP; });
    applyProviderOverrides(def);
    return def;
    function calcHasOverrides(def) {
        var hasOverrides = false;
        var hasDeprecatedOverrides = false;
        if (providerOverrides.size === 0) {
            return { hasOverrides: hasOverrides, hasDeprecatedOverrides: hasDeprecatedOverrides };
        }
        def.providers.forEach(function (node) {
            var override = providerOverrides.get(node.token);
            if ((node.flags & 3840 /* CatProviderNoDirective */) && override) {
                hasOverrides = true;
                hasDeprecatedOverrides = hasDeprecatedOverrides || override.deprecatedBehavior;
            }
        });
        def.modules.forEach(function (module) {
            providerOverridesWithScope.forEach(function (override, token) {
                if (getInjectableDef(token).providedIn === module) {
                    hasOverrides = true;
                    hasDeprecatedOverrides = hasDeprecatedOverrides || override.deprecatedBehavior;
                }
            });
        });
        return { hasOverrides: hasOverrides, hasDeprecatedOverrides: hasDeprecatedOverrides };
    }
    function applyProviderOverrides(def) {
        for (var i = 0; i < def.providers.length; i++) {
            var provider = def.providers[i];
            if (hasDeprecatedOverrides) {
                // We had a bug where me made
                // all providers lazy. Keep this logic behind a flag
                // for migrating existing users.
                provider.flags |= 4096 /* LazyProvider */;
            }
            var override = providerOverrides.get(provider.token);
            if (override) {
                provider.flags = (provider.flags & ~3840 /* CatProviderNoDirective */) | override.flags;
                provider.deps = splitDepsDsl(override.deps);
                provider.value = override.value;
            }
        }
        if (providerOverridesWithScope.size > 0) {
            var moduleSet_1 = new Set(def.modules);
            providerOverridesWithScope.forEach(function (override, token) {
                if (moduleSet_1.has(getInjectableDef(token).providedIn)) {
                    var provider = {
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
function prodCheckAndUpdateNode(view, checkIndex, argStyle, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9) {
    var nodeDef = view.def.nodes[checkIndex];
    checkAndUpdateNode(view, nodeDef, argStyle, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9);
    return (nodeDef.flags & 224 /* CatPureExpression */) ?
        asPureExpressionData(view, checkIndex).value :
        undefined;
}
function prodCheckNoChangesNode(view, checkIndex, argStyle, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9) {
    var nodeDef = view.def.nodes[checkIndex];
    checkNoChangesNode(view, nodeDef, argStyle, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9);
    return (nodeDef.flags & 224 /* CatPureExpression */) ?
        asPureExpressionData(view, checkIndex).value :
        undefined;
}
function debugCheckAndUpdateView(view) {
    return callWithDebugContext(DebugAction.detectChanges, checkAndUpdateView, null, [view]);
}
function debugCheckNoChangesView(view) {
    return callWithDebugContext(DebugAction.checkNoChanges, checkNoChangesView, null, [view]);
}
function debugDestroyView(view) {
    return callWithDebugContext(DebugAction.destroy, destroyView, null, [view]);
}
var DebugAction;
(function (DebugAction) {
    DebugAction[DebugAction["create"] = 0] = "create";
    DebugAction[DebugAction["detectChanges"] = 1] = "detectChanges";
    DebugAction[DebugAction["checkNoChanges"] = 2] = "checkNoChanges";
    DebugAction[DebugAction["destroy"] = 3] = "destroy";
    DebugAction[DebugAction["handleEvent"] = 4] = "handleEvent";
})(DebugAction || (DebugAction = {}));
var _currentAction;
var _currentView;
var _currentNodeIndex;
function debugSetCurrentNode(view, nodeIndex) {
    _currentView = view;
    _currentNodeIndex = nodeIndex;
}
function debugHandleEvent(view, nodeIndex, eventName, event) {
    debugSetCurrentNode(view, nodeIndex);
    return callWithDebugContext(DebugAction.handleEvent, view.def.handleEvent, null, [view, nodeIndex, eventName, event]);
}
function debugUpdateDirectives(view, checkType) {
    if (view.state & 128 /* Destroyed */) {
        throw viewDestroyedError(DebugAction[_currentAction]);
    }
    debugSetCurrentNode(view, nextDirectiveWithBinding(view, 0));
    return view.def.updateDirectives(debugCheckDirectivesFn, view);
    function debugCheckDirectivesFn(view, nodeIndex, argStyle) {
        var values = [];
        for (var _i = 3; _i < arguments.length; _i++) {
            values[_i - 3] = arguments[_i];
        }
        var nodeDef = view.def.nodes[nodeIndex];
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
function debugUpdateRenderer(view, checkType) {
    if (view.state & 128 /* Destroyed */) {
        throw viewDestroyedError(DebugAction[_currentAction]);
    }
    debugSetCurrentNode(view, nextRenderNodeWithBinding(view, 0));
    return view.def.updateRenderer(debugCheckRenderNodeFn, view);
    function debugCheckRenderNodeFn(view, nodeIndex, argStyle) {
        var values = [];
        for (var _i = 3; _i < arguments.length; _i++) {
            values[_i - 3] = arguments[_i];
        }
        var nodeDef = view.def.nodes[nodeIndex];
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
function debugCheckAndUpdateNode(view, nodeDef, argStyle, givenValues) {
    var changed = checkAndUpdateNode.apply(void 0, tslib_1.__spread([view, nodeDef, argStyle], givenValues));
    if (changed) {
        var values = argStyle === 1 /* Dynamic */ ? givenValues[0] : givenValues;
        if (nodeDef.flags & 16384 /* TypeDirective */) {
            var bindingValues = {};
            for (var i = 0; i < nodeDef.bindings.length; i++) {
                var binding = nodeDef.bindings[i];
                var value = values[i];
                if (binding.flags & 8 /* TypeProperty */) {
                    bindingValues[normalizeDebugBindingName(binding.nonMinifiedName)] =
                        normalizeDebugBindingValue(value);
                }
            }
            var elDef = nodeDef.parent;
            var el = asElementData(view, elDef.nodeIndex).renderElement;
            if (!elDef.element.name) {
                // a comment.
                view.renderer.setValue(el, "bindings=" + JSON.stringify(bindingValues, null, 2));
            }
            else {
                // a regular element.
                for (var attr in bindingValues) {
                    var value = bindingValues[attr];
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
function debugCheckNoChangesNode(view, nodeDef, argStyle, values) {
    checkNoChangesNode.apply(void 0, tslib_1.__spread([view, nodeDef, argStyle], values));
}
function nextDirectiveWithBinding(view, nodeIndex) {
    for (var i = nodeIndex; i < view.def.nodes.length; i++) {
        var nodeDef = view.def.nodes[i];
        if (nodeDef.flags & 16384 /* TypeDirective */ && nodeDef.bindings && nodeDef.bindings.length) {
            return i;
        }
    }
    return null;
}
function nextRenderNodeWithBinding(view, nodeIndex) {
    for (var i = nodeIndex; i < view.def.nodes.length; i++) {
        var nodeDef = view.def.nodes[i];
        if ((nodeDef.flags & 3 /* CatRenderNode */) && nodeDef.bindings && nodeDef.bindings.length) {
            return i;
        }
    }
    return null;
}
var DebugContext_ = /** @class */ (function () {
    function DebugContext_(view, nodeIndex) {
        this.view = view;
        this.nodeIndex = nodeIndex;
        if (nodeIndex == null) {
            this.nodeIndex = nodeIndex = 0;
        }
        this.nodeDef = view.def.nodes[nodeIndex];
        var elDef = this.nodeDef;
        var elView = view;
        while (elDef && (elDef.flags & 1 /* TypeElement */) === 0) {
            elDef = elDef.parent;
        }
        if (!elDef) {
            while (!elDef && elView) {
                elDef = viewParentEl(elView);
                elView = elView.parent;
            }
        }
        this.elDef = elDef;
        this.elView = elView;
    }
    Object.defineProperty(DebugContext_.prototype, "elOrCompView", {
        get: function () {
            // Has to be done lazily as we use the DebugContext also during creation of elements...
            return asElementData(this.elView, this.elDef.nodeIndex).componentView || this.view;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DebugContext_.prototype, "injector", {
        get: function () { return createInjector(this.elView, this.elDef); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DebugContext_.prototype, "component", {
        get: function () { return this.elOrCompView.component; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DebugContext_.prototype, "context", {
        get: function () { return this.elOrCompView.context; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DebugContext_.prototype, "providerTokens", {
        get: function () {
            var tokens = [];
            if (this.elDef) {
                for (var i = this.elDef.nodeIndex + 1; i <= this.elDef.nodeIndex + this.elDef.childCount; i++) {
                    var childDef = this.elView.def.nodes[i];
                    if (childDef.flags & 20224 /* CatProvider */) {
                        tokens.push(childDef.provider.token);
                    }
                    i += childDef.childCount;
                }
            }
            return tokens;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DebugContext_.prototype, "references", {
        get: function () {
            var references = {};
            if (this.elDef) {
                collectReferences(this.elView, this.elDef, references);
                for (var i = this.elDef.nodeIndex + 1; i <= this.elDef.nodeIndex + this.elDef.childCount; i++) {
                    var childDef = this.elView.def.nodes[i];
                    if (childDef.flags & 20224 /* CatProvider */) {
                        collectReferences(this.elView, childDef, references);
                    }
                    i += childDef.childCount;
                }
            }
            return references;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DebugContext_.prototype, "componentRenderElement", {
        get: function () {
            var elData = findHostElement(this.elOrCompView);
            return elData ? elData.renderElement : undefined;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DebugContext_.prototype, "renderNode", {
        get: function () {
            return this.nodeDef.flags & 2 /* TypeText */ ? renderNode(this.view, this.nodeDef) :
                renderNode(this.elView, this.elDef);
        },
        enumerable: true,
        configurable: true
    });
    DebugContext_.prototype.logError = function (console) {
        var values = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            values[_i - 1] = arguments[_i];
        }
        var logViewDef;
        var logNodeIndex;
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
        var renderNodeIndex = getRenderNodeIndex(logViewDef, logNodeIndex);
        var currRenderNodeIndex = -1;
        var nodeLogger = function () {
            var _a;
            currRenderNodeIndex++;
            if (currRenderNodeIndex === renderNodeIndex) {
                return (_a = console.error).bind.apply(_a, tslib_1.__spread([console], values));
            }
            else {
                return NOOP;
            }
        };
        logViewDef.factory(nodeLogger);
        if (currRenderNodeIndex < renderNodeIndex) {
            console.error('Illegal state: the ViewDefinitionFactory did not call the logger!');
            console.error.apply(console, tslib_1.__spread(values));
        }
    };
    return DebugContext_;
}());
function getRenderNodeIndex(viewDef, nodeIndex) {
    var renderNodeIndex = -1;
    for (var i = 0; i <= nodeIndex; i++) {
        var nodeDef = viewDef.nodes[i];
        if (nodeDef.flags & 3 /* CatRenderNode */) {
            renderNodeIndex++;
        }
    }
    return renderNodeIndex;
}
function findHostElement(view) {
    while (view && !isComponentView(view)) {
        view = view.parent;
    }
    if (view.parent) {
        return asElementData(view.parent, viewParentEl(view).nodeIndex);
    }
    return null;
}
function collectReferences(view, nodeDef, references) {
    for (var refName in nodeDef.references) {
        references[refName] = getQueryValue(view, nodeDef, nodeDef.references[refName]);
    }
}
function callWithDebugContext(action, fn, self, args) {
    var oldAction = _currentAction;
    var oldView = _currentView;
    var oldNodeIndex = _currentNodeIndex;
    try {
        _currentAction = action;
        var result = fn.apply(self, args);
        _currentView = oldView;
        _currentNodeIndex = oldNodeIndex;
        _currentAction = oldAction;
        return result;
    }
    catch (e) {
        if (isViewDebugError(e) || !_currentView) {
            throw e;
        }
        throw viewWrappedDebugError(e, getCurrentDebugContext());
    }
}
export function getCurrentDebugContext() {
    return _currentView ? new DebugContext_(_currentView, _currentNodeIndex) : null;
}
var DebugRendererFactory2 = /** @class */ (function () {
    function DebugRendererFactory2(delegate) {
        this.delegate = delegate;
    }
    DebugRendererFactory2.prototype.createRenderer = function (element, renderData) {
        return new DebugRenderer2(this.delegate.createRenderer(element, renderData));
    };
    DebugRendererFactory2.prototype.begin = function () {
        if (this.delegate.begin) {
            this.delegate.begin();
        }
    };
    DebugRendererFactory2.prototype.end = function () {
        if (this.delegate.end) {
            this.delegate.end();
        }
    };
    DebugRendererFactory2.prototype.whenRenderingDone = function () {
        if (this.delegate.whenRenderingDone) {
            return this.delegate.whenRenderingDone();
        }
        return Promise.resolve(null);
    };
    return DebugRendererFactory2;
}());
export { DebugRendererFactory2 };
var DebugRenderer2 = /** @class */ (function () {
    function DebugRenderer2(delegate) {
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
    DebugRenderer2.prototype.createDebugContext = function (nativeElement) { return this.debugContextFactory(nativeElement); };
    DebugRenderer2.prototype.destroyNode = function (node) {
        removeDebugNodeFromIndex(getDebugNode(node));
        if (this.delegate.destroyNode) {
            this.delegate.destroyNode(node);
        }
    };
    DebugRenderer2.prototype.destroy = function () { this.delegate.destroy(); };
    DebugRenderer2.prototype.createElement = function (name, namespace) {
        var el = this.delegate.createElement(name, namespace);
        var debugCtx = this.createDebugContext(el);
        if (debugCtx) {
            var debugEl = new DebugElement__PRE_R3__(el, null, debugCtx);
            debugEl.name = name;
            indexDebugNode(debugEl);
        }
        return el;
    };
    DebugRenderer2.prototype.createComment = function (value) {
        var comment = this.delegate.createComment(value);
        var debugCtx = this.createDebugContext(comment);
        if (debugCtx) {
            indexDebugNode(new DebugNode__PRE_R3__(comment, null, debugCtx));
        }
        return comment;
    };
    DebugRenderer2.prototype.createText = function (value) {
        var text = this.delegate.createText(value);
        var debugCtx = this.createDebugContext(text);
        if (debugCtx) {
            indexDebugNode(new DebugNode__PRE_R3__(text, null, debugCtx));
        }
        return text;
    };
    DebugRenderer2.prototype.appendChild = function (parent, newChild) {
        var debugEl = getDebugNode(parent);
        var debugChildEl = getDebugNode(newChild);
        if (debugEl && debugChildEl && debugEl instanceof DebugElement__PRE_R3__) {
            debugEl.addChild(debugChildEl);
        }
        this.delegate.appendChild(parent, newChild);
    };
    DebugRenderer2.prototype.insertBefore = function (parent, newChild, refChild) {
        var debugEl = getDebugNode(parent);
        var debugChildEl = getDebugNode(newChild);
        var debugRefEl = getDebugNode(refChild);
        if (debugEl && debugChildEl && debugEl instanceof DebugElement__PRE_R3__) {
            debugEl.insertBefore(debugRefEl, debugChildEl);
        }
        this.delegate.insertBefore(parent, newChild, refChild);
    };
    DebugRenderer2.prototype.removeChild = function (parent, oldChild) {
        var debugEl = getDebugNode(parent);
        var debugChildEl = getDebugNode(oldChild);
        if (debugEl && debugChildEl && debugEl instanceof DebugElement__PRE_R3__) {
            debugEl.removeChild(debugChildEl);
        }
        this.delegate.removeChild(parent, oldChild);
    };
    DebugRenderer2.prototype.selectRootElement = function (selectorOrNode, preserveContent) {
        var el = this.delegate.selectRootElement(selectorOrNode, preserveContent);
        var debugCtx = getCurrentDebugContext();
        if (debugCtx) {
            indexDebugNode(new DebugElement__PRE_R3__(el, null, debugCtx));
        }
        return el;
    };
    DebugRenderer2.prototype.setAttribute = function (el, name, value, namespace) {
        var debugEl = getDebugNode(el);
        if (debugEl && debugEl instanceof DebugElement__PRE_R3__) {
            var fullName = namespace ? namespace + ':' + name : name;
            debugEl.attributes[fullName] = value;
        }
        this.delegate.setAttribute(el, name, value, namespace);
    };
    DebugRenderer2.prototype.removeAttribute = function (el, name, namespace) {
        var debugEl = getDebugNode(el);
        if (debugEl && debugEl instanceof DebugElement__PRE_R3__) {
            var fullName = namespace ? namespace + ':' + name : name;
            debugEl.attributes[fullName] = null;
        }
        this.delegate.removeAttribute(el, name, namespace);
    };
    DebugRenderer2.prototype.addClass = function (el, name) {
        var debugEl = getDebugNode(el);
        if (debugEl && debugEl instanceof DebugElement__PRE_R3__) {
            debugEl.classes[name] = true;
        }
        this.delegate.addClass(el, name);
    };
    DebugRenderer2.prototype.removeClass = function (el, name) {
        var debugEl = getDebugNode(el);
        if (debugEl && debugEl instanceof DebugElement__PRE_R3__) {
            debugEl.classes[name] = false;
        }
        this.delegate.removeClass(el, name);
    };
    DebugRenderer2.prototype.setStyle = function (el, style, value, flags) {
        var debugEl = getDebugNode(el);
        if (debugEl && debugEl instanceof DebugElement__PRE_R3__) {
            debugEl.styles[style] = value;
        }
        this.delegate.setStyle(el, style, value, flags);
    };
    DebugRenderer2.prototype.removeStyle = function (el, style, flags) {
        var debugEl = getDebugNode(el);
        if (debugEl && debugEl instanceof DebugElement__PRE_R3__) {
            debugEl.styles[style] = null;
        }
        this.delegate.removeStyle(el, style, flags);
    };
    DebugRenderer2.prototype.setProperty = function (el, name, value) {
        var debugEl = getDebugNode(el);
        if (debugEl && debugEl instanceof DebugElement__PRE_R3__) {
            debugEl.properties[name] = value;
        }
        this.delegate.setProperty(el, name, value);
    };
    DebugRenderer2.prototype.listen = function (target, eventName, callback) {
        if (typeof target !== 'string') {
            var debugEl = getDebugNode(target);
            if (debugEl) {
                debugEl.listeners.push(new EventListener(eventName, callback));
            }
        }
        return this.delegate.listen(target, eventName, callback);
    };
    DebugRenderer2.prototype.parentNode = function (node) { return this.delegate.parentNode(node); };
    DebugRenderer2.prototype.nextSibling = function (node) { return this.delegate.nextSibling(node); };
    DebugRenderer2.prototype.setValue = function (node, value) { return this.delegate.setValue(node, value); };
    return DebugRenderer2;
}());
export { DebugRenderer2 };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmljZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy92aWV3L3NlcnZpY2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBQUMsc0JBQXNCLEVBQUUsbUJBQW1CLEVBQUUsYUFBYSxFQUFFLFlBQVksRUFBRSxjQUFjLEVBQUUsd0JBQXdCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUd2SixPQUFPLEVBQUMsZ0JBQWdCLEVBQWtCLE1BQU0sc0JBQXNCLENBQUM7QUFDdkUsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBSTlDLE9BQU8sRUFBWSxnQkFBZ0IsRUFBcUMsTUFBTSxlQUFlLENBQUM7QUFDOUYsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBQ25ELE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUM5QyxPQUFPLEVBQUMseUJBQXlCLEVBQUUsMEJBQTBCLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUV6RixPQUFPLEVBQUMsZ0JBQWdCLEVBQUUsa0JBQWtCLEVBQUUscUJBQXFCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDckYsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLFlBQVksQ0FBQztBQUN0QyxPQUFPLEVBQUMsa0JBQWtCLEVBQUUsYUFBYSxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBQzFELE9BQU8sRUFBQyxjQUFjLEVBQUUsaUJBQWlCLEVBQUUsaUNBQWlDLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFDNUYsT0FBTyxFQUFtSixRQUFRLEVBQXVDLGFBQWEsRUFBRSxvQkFBb0IsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUM3UCxPQUFPLEVBQUMsSUFBSSxFQUFFLGVBQWUsRUFBRSxVQUFVLEVBQUUsaUJBQWlCLEVBQUUsWUFBWSxFQUFF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LElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNyRSxvQ0FBVyxHQUFYLFVBQVksSUFBUyxJQUFTLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3ZFLGlDQUFRLEdBQVIsVUFBUyxJQUFTLEVBQUUsS0FBYSxJQUFVLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMxRixxQkFBQztBQUFELENBQUMsQUF2S0QsSUF1S0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RGVidWdFbGVtZW50X19QUkVfUjNfXywgRGVidWdOb2RlX19QUkVfUjNfXywgRXZlbnRMaXN0ZW5lciwgZ2V0RGVidWdOb2RlLCBpbmRleERlYnVnTm9kZSwgcmVtb3ZlRGVidWdOb2RlRnJvbUluZGV4fSBmcm9tICcuLi9kZWJ1Zy9kZWJ1Z19ub2RlJztcbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4uL2RpJztcbmltcG9ydCB7SW5qZWN0YWJsZVR5cGV9IGZyb20gJy4uL2RpL2luamVjdGFibGUnO1xuaW1wb3J0IHtnZXRJbmplY3RhYmxlRGVmLCDJtcm1SW5qZWN0YWJsZURlZn0gZnJvbSAnLi4vZGkvaW50ZXJmYWNlL2RlZnMnO1xuaW1wb3J0IHtFcnJvckhhbmRsZXJ9IGZyb20gJy4uL2Vycm9yX2hhbmRsZXInO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge0NvbXBvbmVudEZhY3Rvcnl9IGZyb20gJy4uL2xpbmtlci9jb21wb25lbnRfZmFjdG9yeSc7XG5pbXBvcnQge05nTW9kdWxlUmVmfSBmcm9tICcuLi9saW5rZXIvbmdfbW9kdWxlX2ZhY3RvcnknO1xuaW1wb3J0IHtSZW5kZXJlcjIsIFJlbmRlcmVyRmFjdG9yeTIsIFJlbmRlcmVyU3R5bGVGbGFnczIsIFJlbmRlcmVyVHlwZTJ9IGZyb20gJy4uL3JlbmRlci9hcGknO1xuaW1wb3J0IHtTYW5pdGl6ZXJ9IGZyb20gJy4uL3Nhbml0aXphdGlvbi9zZWN1cml0eSc7XG5pbXBvcnQge2lzRGV2TW9kZX0gZnJvbSAnLi4vdXRpbC9pc19kZXZfbW9kZSc7XG5pbXBvcnQge25vcm1hbGl6ZURlYnVnQmluZGluZ05hbWUsIG5vcm1hbGl6ZURlYnVnQmluZGluZ1ZhbHVlfSBmcm9tICcuLi91dGlsL25nX3JlZmxlY3QnO1xuXG5pbXBvcnQge2lzVmlld0RlYnVnRXJyb3IsIHZpZXdEZXN0cm95ZWRFcnJvciwgdmlld1dyYXBwZWREZWJ1Z0Vycm9yfSBmcm9tICcuL2Vycm9ycyc7XG5pbXBvcnQge3Jlc29sdmVEZXB9IGZyb20gJy4vcHJvdmlkZXInO1xuaW1wb3J0IHtkaXJ0eVBhcmVudFF1ZXJpZXMsIGdldFF1ZXJ5VmFsdWV9IGZyb20gJy4vcXVlcnknO1xuaW1wb3J0IHtjcmVhdGVJbmplY3RvciwgY3JlYXRlTmdNb2R1bGVSZWYsIGdldENvbXBvbmVudFZpZXdEZWZpbml0aW9uRmFjdG9yeX0gZnJvbSAnLi9yZWZzJztcbmltcG9ydCB7QXJndW1lbnRUeXBlLCBCaW5kaW5nRmxhZ3MsIENoZWNrVHlwZSwgRGVidWdDb250ZXh0LCBFbGVtZW50RGF0YSwgTmdNb2R1bGVEZWZpbml0aW9uLCBOb2RlRGVmLCBOb2RlRmxhZ3MsIE5vZGVMb2dnZXIsIFByb3ZpZGVyT3ZlcnJpZGUsIFJvb3REYXRhLCBTZXJ2aWNlcywgVmlld0RhdGEsIFZpZXdEZWZpbml0aW9uLCBWaWV3U3RhdGUsIGFzRWxlbWVudERhdGEsIGFzUHVyZUV4cHJlc3Npb25EYXRhfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7Tk9PUCwgaXNDb21wb25lbnRWaWV3LCByZW5kZXJOb2RlLCByZXNvbHZlRGVmaW5pdGlvbiwgc3BsaXREZXBzRHNsLCB0b2tlbktleSwgdmlld1BhcmVudEVsfSBmcm9tICcuL3V0aWwnO1xuaW1wb3J0IHtjaGVja0FuZFVwZGF0ZU5vZGUsIGNoZWNrQW5kVXBkYXRlVmlldywgY2hlY2tOb0NoYW5nZXNOb2RlLCBjaGVja05vQ2hhbmdlc1ZpZXcsIGNyZWF0ZUNvbXBvbmVudFZpZXcsIGNyZWF0ZUVtYmVkZGVkVmlldywgY3JlYXRlUm9vdFZpZXcsIGRlc3Ryb3lWaWV3fSBmcm9tICcuL3ZpZXcnO1xuXG5cbmxldCBpbml0aWFsaXplZCA9IGZhbHNlO1xuXG5leHBvcnQgZnVuY3Rpb24gaW5pdFNlcnZpY2VzSWZOZWVkZWQoKSB7XG4gIGlmIChpbml0aWFsaXplZCkge1xuICAgIHJldHVybjtcbiAgfVxuICBpbml0aWFsaXplZCA9IHRydWU7XG4gIGNvbnN0IHNlcnZpY2VzID0gaXNEZXZNb2RlKCkgPyBjcmVhdGVEZWJ1Z1NlcnZpY2VzKCkgOiBjcmVhdGVQcm9kU2VydmljZXMoKTtcbiAgU2VydmljZXMuc2V0Q3VycmVudE5vZGUgPSBzZXJ2aWNlcy5zZXRDdXJyZW50Tm9kZTtcbiAgU2VydmljZXMuY3JlYXRlUm9vdFZpZXcgPSBzZXJ2aWNlcy5jcmVhdGVSb290VmlldztcbiAgU2VydmljZXMuY3JlYXRlRW1iZWRkZWRWaWV3ID0gc2VydmljZXMuY3JlYXRlRW1iZWRkZWRWaWV3O1xuICBTZXJ2aWNlcy5jcmVhdGVDb21wb25lbnRWaWV3ID0gc2VydmljZXMuY3JlYXRlQ29tcG9uZW50VmlldztcbiAgU2VydmljZXMuY3JlYXRlTmdNb2R1bGVSZWYgPSBzZXJ2aWNlcy5jcmVhdGVOZ01vZHVsZVJlZjtcbiAgU2VydmljZXMub3ZlcnJpZGVQcm92aWRlciA9IHNlcnZpY2VzLm92ZXJyaWRlUHJvdmlkZXI7XG4gIFNlcnZpY2VzLm92ZXJyaWRlQ29tcG9uZW50VmlldyA9IHNlcnZpY2VzLm92ZXJyaWRlQ29tcG9uZW50VmlldztcbiAgU2VydmljZXMuY2xlYXJPdmVycmlkZXMgPSBzZXJ2aWNlcy5jbGVhck92ZXJyaWRlcztcbiAgU2VydmljZXMuY2hlY2tBbmRVcGRhdGVWaWV3ID0gc2VydmljZXMuY2hlY2tBbmRVcGRhdGVWaWV3O1xuICBTZXJ2aWNlcy5jaGVja05vQ2hhbmdlc1ZpZXcgPSBzZXJ2aWNlcy5jaGVja05vQ2hhbmdlc1ZpZXc7XG4gIFNlcnZpY2VzLmRlc3Ryb3lWaWV3ID0gc2VydmljZXMuZGVzdHJveVZpZXc7XG4gIFNlcnZpY2VzLnJlc29sdmVEZXAgPSByZXNvbHZlRGVwO1xuICBTZXJ2aWNlcy5jcmVhdGVEZWJ1Z0NvbnRleHQgPSBzZXJ2aWNlcy5jcmVhdGVEZWJ1Z0NvbnRleHQ7XG4gIFNlcnZpY2VzLmhhbmRsZUV2ZW50ID0gc2VydmljZXMuaGFuZGxlRXZlbnQ7XG4gIFNlcnZpY2VzLnVwZGF0ZURpcmVjdGl2ZXMgPSBzZXJ2aWNlcy51cGRhdGVEaXJlY3RpdmVzO1xuICBTZXJ2aWNlcy51cGRhdGVSZW5kZXJlciA9IHNlcnZpY2VzLnVwZGF0ZVJlbmRlcmVyO1xuICBTZXJ2aWNlcy5kaXJ0eVBhcmVudFF1ZXJpZXMgPSBkaXJ0eVBhcmVudFF1ZXJpZXM7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVByb2RTZXJ2aWNlcygpIHtcbiAgcmV0dXJuIHtcbiAgICBzZXRDdXJyZW50Tm9kZTogKCkgPT4ge30sXG4gICAgY3JlYXRlUm9vdFZpZXc6IGNyZWF0ZVByb2RSb290VmlldyxcbiAgICBjcmVhdGVFbWJlZGRlZFZpZXc6IGNyZWF0ZUVtYmVkZGVkVmlldyxcbiAgICBjcmVhdGVDb21wb25lbnRWaWV3OiBjcmVhdGVDb21wb25lbnRWaWV3LFxuICAgIGNyZWF0ZU5nTW9kdWxlUmVmOiBjcmVhdGVOZ01vZHVsZVJlZixcbiAgICBvdmVycmlkZVByb3ZpZGVyOiBOT09QLFxuICAgIG92ZXJyaWRlQ29tcG9uZW50VmlldzogTk9PUCxcbiAgICBjbGVhck92ZXJyaWRlczogTk9PUCxcbiAgICBjaGVja0FuZFVwZGF0ZVZpZXc6IGNoZWNrQW5kVXBkYXRlVmlldyxcbiAgICBjaGVja05vQ2hhbmdlc1ZpZXc6IGNoZWNrTm9DaGFuZ2VzVmlldyxcbiAgICBkZXN0cm95VmlldzogZGVzdHJveVZpZXcsXG4gICAgY3JlYXRlRGVidWdDb250ZXh0OiAodmlldzogVmlld0RhdGEsIG5vZGVJbmRleDogbnVtYmVyKSA9PiBuZXcgRGVidWdDb250ZXh0Xyh2aWV3LCBub2RlSW5kZXgpLFxuICAgIGhhbmRsZUV2ZW50OiAodmlldzogVmlld0RhdGEsIG5vZGVJbmRleDogbnVtYmVyLCBldmVudE5hbWU6IHN0cmluZywgZXZlbnQ6IGFueSkgPT5cbiAgICAgICAgICAgICAgICAgICAgIHZpZXcuZGVmLmhhbmRsZUV2ZW50KHZpZXcsIG5vZGVJbmRleCwgZXZlbnROYW1lLCBldmVudCksXG4gICAgdXBkYXRlRGlyZWN0aXZlczogKHZpZXc6IFZpZXdEYXRhLCBjaGVja1R5cGU6IENoZWNrVHlwZSkgPT4gdmlldy5kZWYudXBkYXRlRGlyZWN0aXZlcyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tUeXBlID09PSBDaGVja1R5cGUuQ2hlY2tBbmRVcGRhdGUgPyBwcm9kQ2hlY2tBbmRVcGRhdGVOb2RlIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9kQ2hlY2tOb0NoYW5nZXNOb2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB2aWV3KSxcbiAgICB1cGRhdGVSZW5kZXJlcjogKHZpZXc6IFZpZXdEYXRhLCBjaGVja1R5cGU6IENoZWNrVHlwZSkgPT4gdmlldy5kZWYudXBkYXRlUmVuZGVyZXIoXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGVja1R5cGUgPT09IENoZWNrVHlwZS5DaGVja0FuZFVwZGF0ZSA/IHByb2RDaGVja0FuZFVwZGF0ZU5vZGUgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9kQ2hlY2tOb0NoYW5nZXNOb2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgdmlldyksXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZURlYnVnU2VydmljZXMoKSB7XG4gIHJldHVybiB7XG4gICAgc2V0Q3VycmVudE5vZGU6IGRlYnVnU2V0Q3VycmVudE5vZGUsXG4gICAgY3JlYXRlUm9vdFZpZXc6IGRlYnVnQ3JlYXRlUm9vdFZpZXcsXG4gICAgY3JlYXRlRW1iZWRkZWRWaWV3OiBkZWJ1Z0NyZWF0ZUVtYmVkZGVkVmlldyxcbiAgICBjcmVhdGVDb21wb25lbnRWaWV3OiBkZWJ1Z0NyZWF0ZUNvbXBvbmVudFZpZXcsXG4gICAgY3JlYXRlTmdNb2R1bGVSZWY6IGRlYnVnQ3JlYXRlTmdNb2R1bGVSZWYsXG4gICAgb3ZlcnJpZGVQcm92aWRlcjogZGVidWdPdmVycmlkZVByb3ZpZGVyLFxuICAgIG92ZXJyaWRlQ29tcG9uZW50VmlldzogZGVidWdPdmVycmlkZUNvbXBvbmVudFZpZXcsXG4gICAgY2xlYXJPdmVycmlkZXM6IGRlYnVnQ2xlYXJPdmVycmlkZXMsXG4gICAgY2hlY2tBbmRVcGRhdGVWaWV3OiBkZWJ1Z0NoZWNrQW5kVXBkYXRlVmlldyxcbiAgICBjaGVja05vQ2hhbmdlc1ZpZXc6IGRlYnVnQ2hlY2tOb0NoYW5nZXNWaWV3LFxuICAgIGRlc3Ryb3lWaWV3OiBkZWJ1Z0Rlc3Ryb3lWaWV3LFxuICAgIGNyZWF0ZURlYnVnQ29udGV4dDogKHZpZXc6IFZpZXdEYXRhLCBub2RlSW5kZXg6IG51bWJlcikgPT4gbmV3IERlYnVnQ29udGV4dF8odmlldywgbm9kZUluZGV4KSxcbiAgICBoYW5kbGVFdmVudDogZGVidWdIYW5kbGVFdmVudCxcbiAgICB1cGRhdGVEaXJlY3RpdmVzOiBkZWJ1Z1VwZGF0ZURpcmVjdGl2ZXMsXG4gICAgdXBkYXRlUmVuZGVyZXI6IGRlYnVnVXBkYXRlUmVuZGVyZXIsXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVByb2RSb290VmlldyhcbiAgICBlbEluamVjdG9yOiBJbmplY3RvciwgcHJvamVjdGFibGVOb2RlczogYW55W11bXSwgcm9vdFNlbGVjdG9yT3JOb2RlOiBzdHJpbmcgfCBhbnksXG4gICAgZGVmOiBWaWV3RGVmaW5pdGlvbiwgbmdNb2R1bGU6IE5nTW9kdWxlUmVmPGFueT4sIGNvbnRleHQ/OiBhbnkpOiBWaWV3RGF0YSB7XG4gIGNvbnN0IHJlbmRlcmVyRmFjdG9yeTogUmVuZGVyZXJGYWN0b3J5MiA9IG5nTW9kdWxlLmluamVjdG9yLmdldChSZW5kZXJlckZhY3RvcnkyKTtcbiAgcmV0dXJuIGNyZWF0ZVJvb3RWaWV3KFxuICAgICAgY3JlYXRlUm9vdERhdGEoZWxJbmplY3RvciwgbmdNb2R1bGUsIHJlbmRlcmVyRmFjdG9yeSwgcHJvamVjdGFibGVOb2Rlcywgcm9vdFNlbGVjdG9yT3JOb2RlKSxcbiAgICAgIGRlZiwgY29udGV4dCk7XG59XG5cbmZ1bmN0aW9uIGRlYnVnQ3JlYXRlUm9vdFZpZXcoXG4gICAgZWxJbmplY3RvcjogSW5qZWN0b3IsIHByb2plY3RhYmxlTm9kZXM6IGFueVtdW10sIHJvb3RTZWxlY3Rvck9yTm9kZTogc3RyaW5nIHwgYW55LFxuICAgIGRlZjogVmlld0RlZmluaXRpb24sIG5nTW9kdWxlOiBOZ01vZHVsZVJlZjxhbnk+LCBjb250ZXh0PzogYW55KTogVmlld0RhdGEge1xuICBjb25zdCByZW5kZXJlckZhY3Rvcnk6IFJlbmRlcmVyRmFjdG9yeTIgPSBuZ01vZHVsZS5pbmplY3Rvci5nZXQoUmVuZGVyZXJGYWN0b3J5Mik7XG4gIGNvbnN0IHJvb3QgPSBjcmVhdGVSb290RGF0YShcbiAgICAgIGVsSW5qZWN0b3IsIG5nTW9kdWxlLCBuZXcgRGVidWdSZW5kZXJlckZhY3RvcnkyKHJlbmRlcmVyRmFjdG9yeSksIHByb2plY3RhYmxlTm9kZXMsXG4gICAgICByb290U2VsZWN0b3JPck5vZGUpO1xuICBjb25zdCBkZWZXaXRoT3ZlcnJpZGUgPSBhcHBseVByb3ZpZGVyT3ZlcnJpZGVzVG9WaWV3KGRlZik7XG4gIHJldHVybiBjYWxsV2l0aERlYnVnQ29udGV4dChcbiAgICAgIERlYnVnQWN0aW9uLmNyZWF0ZSwgY3JlYXRlUm9vdFZpZXcsIG51bGwsIFtyb290LCBkZWZXaXRoT3ZlcnJpZGUsIGNvbnRleHRdKTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlUm9vdERhdGEoXG4gICAgZWxJbmplY3RvcjogSW5qZWN0b3IsIG5nTW9kdWxlOiBOZ01vZHVsZVJlZjxhbnk+LCByZW5kZXJlckZhY3Rvcnk6IFJlbmRlcmVyRmFjdG9yeTIsXG4gICAgcHJvamVjdGFibGVOb2RlczogYW55W11bXSwgcm9vdFNlbGVjdG9yT3JOb2RlOiBhbnkpOiBSb290RGF0YSB7XG4gIGNvbnN0IHNhbml0aXplciA9IG5nTW9kdWxlLmluamVjdG9yLmdldChTYW5pdGl6ZXIpO1xuICBjb25zdCBlcnJvckhhbmRsZXIgPSBuZ01vZHVsZS5pbmplY3Rvci5nZXQoRXJyb3JIYW5kbGVyKTtcbiAgY29uc3QgcmVuZGVyZXIgPSByZW5kZXJlckZhY3RvcnkuY3JlYXRlUmVuZGVyZXIobnVsbCwgbnVsbCk7XG4gIHJldHVybiB7XG4gICAgbmdNb2R1bGUsXG4gICAgaW5qZWN0b3I6IGVsSW5qZWN0b3IsIHByb2plY3RhYmxlTm9kZXMsXG4gICAgc2VsZWN0b3JPck5vZGU6IHJvb3RTZWxlY3Rvck9yTm9kZSwgc2FuaXRpemVyLCByZW5kZXJlckZhY3RvcnksIHJlbmRlcmVyLCBlcnJvckhhbmRsZXJcbiAgfTtcbn1cblxuZnVuY3Rpb24gZGVidWdDcmVhdGVFbWJlZGRlZFZpZXcoXG4gICAgcGFyZW50VmlldzogVmlld0RhdGEsIGFuY2hvckRlZjogTm9kZURlZiwgdmlld0RlZjogVmlld0RlZmluaXRpb24sIGNvbnRleHQ/OiBhbnkpOiBWaWV3RGF0YSB7XG4gIGNvbnN0IGRlZldpdGhPdmVycmlkZSA9IGFwcGx5UHJvdmlkZXJPdmVycmlkZXNUb1ZpZXcodmlld0RlZik7XG4gIHJldHVybiBjYWxsV2l0aERlYnVnQ29udGV4dChcbiAgICAgIERlYnVnQWN0aW9uLmNyZWF0ZSwgY3JlYXRlRW1iZWRkZWRWaWV3LCBudWxsLFxuICAgICAgW3BhcmVudFZpZXcsIGFuY2hvckRlZiwgZGVmV2l0aE92ZXJyaWRlLCBjb250ZXh0XSk7XG59XG5cbmZ1bmN0aW9uIGRlYnVnQ3JlYXRlQ29tcG9uZW50VmlldyhcbiAgICBwYXJlbnRWaWV3OiBWaWV3RGF0YSwgbm9kZURlZjogTm9kZURlZiwgdmlld0RlZjogVmlld0RlZmluaXRpb24sIGhvc3RFbGVtZW50OiBhbnkpOiBWaWV3RGF0YSB7XG4gIGNvbnN0IG92ZXJyaWRlQ29tcG9uZW50VmlldyA9XG4gICAgICB2aWV3RGVmT3ZlcnJpZGVzLmdldChub2RlRGVmLmVsZW1lbnQgIS5jb21wb25lbnRQcm92aWRlciAhLnByb3ZpZGVyICEudG9rZW4pO1xuICBpZiAob3ZlcnJpZGVDb21wb25lbnRWaWV3KSB7XG4gICAgdmlld0RlZiA9IG92ZXJyaWRlQ29tcG9uZW50VmlldztcbiAgfSBlbHNlIHtcbiAgICB2aWV3RGVmID0gYXBwbHlQcm92aWRlck92ZXJyaWRlc1RvVmlldyh2aWV3RGVmKTtcbiAgfVxuICByZXR1cm4gY2FsbFdpdGhEZWJ1Z0NvbnRleHQoXG4gICAgICBEZWJ1Z0FjdGlvbi5jcmVhdGUsIGNyZWF0ZUNvbXBvbmVudFZpZXcsIG51bGwsIFtwYXJlbnRWaWV3LCBub2RlRGVmLCB2aWV3RGVmLCBob3N0RWxlbWVudF0pO1xufVxuXG5mdW5jdGlvbiBkZWJ1Z0NyZWF0ZU5nTW9kdWxlUmVmKFxuICAgIG1vZHVsZVR5cGU6IFR5cGU8YW55PiwgcGFyZW50SW5qZWN0b3I6IEluamVjdG9yLCBib290c3RyYXBDb21wb25lbnRzOiBUeXBlPGFueT5bXSxcbiAgICBkZWY6IE5nTW9kdWxlRGVmaW5pdGlvbik6IE5nTW9kdWxlUmVmPGFueT4ge1xuICBjb25zdCBkZWZXaXRoT3ZlcnJpZGUgPSBhcHBseVByb3ZpZGVyT3ZlcnJpZGVzVG9OZ01vZHVsZShkZWYpO1xuICByZXR1cm4gY3JlYXRlTmdNb2R1bGVSZWYobW9kdWxlVHlwZSwgcGFyZW50SW5qZWN0b3IsIGJvb3RzdHJhcENvbXBvbmVudHMsIGRlZldpdGhPdmVycmlkZSk7XG59XG5cbmNvbnN0IHByb3ZpZGVyT3ZlcnJpZGVzID0gbmV3IE1hcDxhbnksIFByb3ZpZGVyT3ZlcnJpZGU+KCk7XG5jb25zdCBwcm92aWRlck92ZXJyaWRlc1dpdGhTY29wZSA9IG5ldyBNYXA8SW5qZWN0YWJsZVR5cGU8YW55PiwgUHJvdmlkZXJPdmVycmlkZT4oKTtcbmNvbnN0IHZpZXdEZWZPdmVycmlkZXMgPSBuZXcgTWFwPGFueSwgVmlld0RlZmluaXRpb24+KCk7XG5cbmZ1bmN0aW9uIGRlYnVnT3ZlcnJpZGVQcm92aWRlcihvdmVycmlkZTogUHJvdmlkZXJPdmVycmlkZSkge1xuICBwcm92aWRlck92ZXJyaWRlcy5zZXQob3ZlcnJpZGUudG9rZW4sIG92ZXJyaWRlKTtcbiAgbGV0IGluamVjdGFibGVEZWY6IMm1ybVJbmplY3RhYmxlRGVmPGFueT58bnVsbDtcbiAgaWYgKHR5cGVvZiBvdmVycmlkZS50b2tlbiA9PT0gJ2Z1bmN0aW9uJyAmJiAoaW5qZWN0YWJsZURlZiA9IGdldEluamVjdGFibGVEZWYob3ZlcnJpZGUudG9rZW4pKSAmJlxuICAgICAgdHlwZW9mIGluamVjdGFibGVEZWYucHJvdmlkZWRJbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHByb3ZpZGVyT3ZlcnJpZGVzV2l0aFNjb3BlLnNldChvdmVycmlkZS50b2tlbiBhcyBJbmplY3RhYmxlVHlwZTxhbnk+LCBvdmVycmlkZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZGVidWdPdmVycmlkZUNvbXBvbmVudFZpZXcoY29tcDogYW55LCBjb21wRmFjdG9yeTogQ29tcG9uZW50RmFjdG9yeTxhbnk+KSB7XG4gIGNvbnN0IGhvc3RWaWV3RGVmID0gcmVzb2x2ZURlZmluaXRpb24oZ2V0Q29tcG9uZW50Vmlld0RlZmluaXRpb25GYWN0b3J5KGNvbXBGYWN0b3J5KSk7XG4gIGNvbnN0IGNvbXBWaWV3RGVmID0gcmVzb2x2ZURlZmluaXRpb24oaG9zdFZpZXdEZWYubm9kZXNbMF0uZWxlbWVudCAhLmNvbXBvbmVudFZpZXcgISk7XG4gIHZpZXdEZWZPdmVycmlkZXMuc2V0KGNvbXAsIGNvbXBWaWV3RGVmKTtcbn1cblxuZnVuY3Rpb24gZGVidWdDbGVhck92ZXJyaWRlcygpIHtcbiAgcHJvdmlkZXJPdmVycmlkZXMuY2xlYXIoKTtcbiAgcHJvdmlkZXJPdmVycmlkZXNXaXRoU2NvcGUuY2xlYXIoKTtcbiAgdmlld0RlZk92ZXJyaWRlcy5jbGVhcigpO1xufVxuXG4vLyBOb3RlcyBhYm91dCB0aGUgYWxnb3JpdGhtOlxuLy8gMSkgTG9jYXRlIHRoZSBwcm92aWRlcnMgb2YgYW4gZWxlbWVudCBhbmQgY2hlY2sgaWYgb25lIG9mIHRoZW0gd2FzIG92ZXJ3cml0dGVuXG4vLyAyKSBDaGFuZ2UgdGhlIHByb3ZpZGVycyBvZiB0aGF0IGVsZW1lbnRcbi8vXG4vLyBXZSBvbmx5IGNyZWF0ZSBuZXcgZGF0YXN0cnVjdHVyZXMgaWYgd2UgbmVlZCB0bywgdG8ga2VlcCBwZXJmIGltcGFjdFxuLy8gcmVhc29uYWJsZS5cbmZ1bmN0aW9uIGFwcGx5UHJvdmlkZXJPdmVycmlkZXNUb1ZpZXcoZGVmOiBWaWV3RGVmaW5pdGlvbik6IFZpZXdEZWZpbml0aW9uIHtcbiAgaWYgKHByb3ZpZGVyT3ZlcnJpZGVzLnNpemUgPT09IDApIHtcbiAgICByZXR1cm4gZGVmO1xuICB9XG4gIGNvbnN0IGVsZW1lbnRJbmRpY2VzV2l0aE92ZXJ3cml0dGVuUHJvdmlkZXJzID0gZmluZEVsZW1lbnRJbmRpY2VzV2l0aE92ZXJ3cml0dGVuUHJvdmlkZXJzKGRlZik7XG4gIGlmIChlbGVtZW50SW5kaWNlc1dpdGhPdmVyd3JpdHRlblByb3ZpZGVycy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gZGVmO1xuICB9XG4gIC8vIGNsb25lIHRoZSB3aG9sZSB2aWV3IGRlZmluaXRpb24sXG4gIC8vIGFzIGl0IG1haW50YWlucyByZWZlcmVuY2VzIGJldHdlZW4gdGhlIG5vZGVzIHRoYXQgYXJlIGhhcmQgdG8gdXBkYXRlLlxuICBkZWYgPSBkZWYuZmFjdG9yeSAhKCgpID0+IE5PT1ApO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGVsZW1lbnRJbmRpY2VzV2l0aE92ZXJ3cml0dGVuUHJvdmlkZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgYXBwbHlQcm92aWRlck92ZXJyaWRlc1RvRWxlbWVudChkZWYsIGVsZW1lbnRJbmRpY2VzV2l0aE92ZXJ3cml0dGVuUHJvdmlkZXJzW2ldKTtcbiAgfVxuICByZXR1cm4gZGVmO1xuXG4gIGZ1bmN0aW9uIGZpbmRFbGVtZW50SW5kaWNlc1dpdGhPdmVyd3JpdHRlblByb3ZpZGVycyhkZWY6IFZpZXdEZWZpbml0aW9uKTogbnVtYmVyW10ge1xuICAgIGNvbnN0IGVsSW5kaWNlc1dpdGhPdmVyd3JpdHRlblByb3ZpZGVyczogbnVtYmVyW10gPSBbXTtcbiAgICBsZXQgbGFzdEVsZW1lbnREZWY6IE5vZGVEZWZ8bnVsbCA9IG51bGw7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkZWYubm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IG5vZGVEZWYgPSBkZWYubm9kZXNbaV07XG4gICAgICBpZiAobm9kZURlZi5mbGFncyAmIE5vZGVGbGFncy5UeXBlRWxlbWVudCkge1xuICAgICAgICBsYXN0RWxlbWVudERlZiA9IG5vZGVEZWY7XG4gICAgICB9XG4gICAgICBpZiAobGFzdEVsZW1lbnREZWYgJiYgbm9kZURlZi5mbGFncyAmIE5vZGVGbGFncy5DYXRQcm92aWRlck5vRGlyZWN0aXZlICYmXG4gICAgICAgICAgcHJvdmlkZXJPdmVycmlkZXMuaGFzKG5vZGVEZWYucHJvdmlkZXIgIS50b2tlbikpIHtcbiAgICAgICAgZWxJbmRpY2VzV2l0aE92ZXJ3cml0dGVuUHJvdmlkZXJzLnB1c2gobGFzdEVsZW1lbnREZWYgIS5ub2RlSW5kZXgpO1xuICAgICAgICBsYXN0RWxlbWVudERlZiA9IG51bGw7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBlbEluZGljZXNXaXRoT3ZlcndyaXR0ZW5Qcm92aWRlcnM7XG4gIH1cblxuICBmdW5jdGlvbiBhcHBseVByb3ZpZGVyT3ZlcnJpZGVzVG9FbGVtZW50KHZpZXdEZWY6IFZpZXdEZWZpbml0aW9uLCBlbEluZGV4OiBudW1iZXIpIHtcbiAgICBmb3IgKGxldCBpID0gZWxJbmRleCArIDE7IGkgPCB2aWV3RGVmLm5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBub2RlRGVmID0gdmlld0RlZi5ub2Rlc1tpXTtcbiAgICAgIGlmIChub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLlR5cGVFbGVtZW50KSB7XG4gICAgICAgIC8vIHN0b3AgYXQgdGhlIG5leHQgZWxlbWVudFxuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAobm9kZURlZi5mbGFncyAmIE5vZGVGbGFncy5DYXRQcm92aWRlck5vRGlyZWN0aXZlKSB7XG4gICAgICAgIGNvbnN0IHByb3ZpZGVyID0gbm9kZURlZi5wcm92aWRlciAhO1xuICAgICAgICBjb25zdCBvdmVycmlkZSA9IHByb3ZpZGVyT3ZlcnJpZGVzLmdldChwcm92aWRlci50b2tlbik7XG4gICAgICAgIGlmIChvdmVycmlkZSkge1xuICAgICAgICAgIG5vZGVEZWYuZmxhZ3MgPSAobm9kZURlZi5mbGFncyAmIH5Ob2RlRmxhZ3MuQ2F0UHJvdmlkZXJOb0RpcmVjdGl2ZSkgfCBvdmVycmlkZS5mbGFncztcbiAgICAgICAgICBwcm92aWRlci5kZXBzID0gc3BsaXREZXBzRHNsKG92ZXJyaWRlLmRlcHMpO1xuICAgICAgICAgIHByb3ZpZGVyLnZhbHVlID0gb3ZlcnJpZGUudmFsdWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLy8gTm90ZXMgYWJvdXQgdGhlIGFsZ29yaXRobTpcbi8vIFdlIG9ubHkgY3JlYXRlIG5ldyBkYXRhc3RydWN0dXJlcyBpZiB3ZSBuZWVkIHRvLCB0byBrZWVwIHBlcmYgaW1wYWN0XG4vLyByZWFzb25hYmxlLlxuZnVuY3Rpb24gYXBwbHlQcm92aWRlck92ZXJyaWRlc1RvTmdNb2R1bGUoZGVmOiBOZ01vZHVsZURlZmluaXRpb24pOiBOZ01vZHVsZURlZmluaXRpb24ge1xuICBjb25zdCB7aGFzT3ZlcnJpZGVzLCBoYXNEZXByZWNhdGVkT3ZlcnJpZGVzfSA9IGNhbGNIYXNPdmVycmlkZXMoZGVmKTtcbiAgaWYgKCFoYXNPdmVycmlkZXMpIHtcbiAgICByZXR1cm4gZGVmO1xuICB9XG4gIC8vIGNsb25lIHRoZSB3aG9sZSB2aWV3IGRlZmluaXRpb24sXG4gIC8vIGFzIGl0IG1haW50YWlucyByZWZlcmVuY2VzIGJldHdlZW4gdGhlIG5vZGVzIHRoYXQgYXJlIGhhcmQgdG8gdXBkYXRlLlxuICBkZWYgPSBkZWYuZmFjdG9yeSAhKCgpID0+IE5PT1ApO1xuICBhcHBseVByb3ZpZGVyT3ZlcnJpZGVzKGRlZik7XG4gIHJldHVybiBkZWY7XG5cbiAgZnVuY3Rpb24gY2FsY0hhc092ZXJyaWRlcyhkZWY6IE5nTW9kdWxlRGVmaW5pdGlvbik6XG4gICAgICB7aGFzT3ZlcnJpZGVzOiBib29sZWFuLCBoYXNEZXByZWNhdGVkT3ZlcnJpZGVzOiBib29sZWFufSB7XG4gICAgbGV0IGhhc092ZXJyaWRlcyA9IGZhbHNlO1xuICAgIGxldCBoYXNEZXByZWNhdGVkT3ZlcnJpZGVzID0gZmFsc2U7XG4gICAgaWYgKHByb3ZpZGVyT3ZlcnJpZGVzLnNpemUgPT09IDApIHtcbiAgICAgIHJldHVybiB7aGFzT3ZlcnJpZGVzLCBoYXNEZXByZWNhdGVkT3ZlcnJpZGVzfTtcbiAgICB9XG4gICAgZGVmLnByb3ZpZGVycy5mb3JFYWNoKG5vZGUgPT4ge1xuICAgICAgY29uc3Qgb3ZlcnJpZGUgPSBwcm92aWRlck92ZXJyaWRlcy5nZXQobm9kZS50b2tlbik7XG4gICAgICBpZiAoKG5vZGUuZmxhZ3MgJiBOb2RlRmxhZ3MuQ2F0UHJvdmlkZXJOb0RpcmVjdGl2ZSkgJiYgb3ZlcnJpZGUpIHtcbiAgICAgICAgaGFzT3ZlcnJpZGVzID0gdHJ1ZTtcbiAgICAgICAgaGFzRGVwcmVjYXRlZE92ZXJyaWRlcyA9IGhhc0RlcHJlY2F0ZWRPdmVycmlkZXMgfHwgb3ZlcnJpZGUuZGVwcmVjYXRlZEJlaGF2aW9yO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGRlZi5tb2R1bGVzLmZvckVhY2gobW9kdWxlID0+IHtcbiAgICAgIHByb3ZpZGVyT3ZlcnJpZGVzV2l0aFNjb3BlLmZvckVhY2goKG92ZXJyaWRlLCB0b2tlbikgPT4ge1xuICAgICAgICBpZiAoZ2V0SW5qZWN0YWJsZURlZih0b2tlbikgIS5wcm92aWRlZEluID09PSBtb2R1bGUpIHtcbiAgICAgICAgICBoYXNPdmVycmlkZXMgPSB0cnVlO1xuICAgICAgICAgIGhhc0RlcHJlY2F0ZWRPdmVycmlkZXMgPSBoYXNEZXByZWNhdGVkT3ZlcnJpZGVzIHx8IG92ZXJyaWRlLmRlcHJlY2F0ZWRCZWhhdmlvcjtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHtoYXNPdmVycmlkZXMsIGhhc0RlcHJlY2F0ZWRPdmVycmlkZXN9O1xuICB9XG5cbiAgZnVuY3Rpb24gYXBwbHlQcm92aWRlck92ZXJyaWRlcyhkZWY6IE5nTW9kdWxlRGVmaW5pdGlvbikge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGVmLnByb3ZpZGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgcHJvdmlkZXIgPSBkZWYucHJvdmlkZXJzW2ldO1xuICAgICAgaWYgKGhhc0RlcHJlY2F0ZWRPdmVycmlkZXMpIHtcbiAgICAgICAgLy8gV2UgaGFkIGEgYnVnIHdoZXJlIG1lIG1hZGVcbiAgICAgICAgLy8gYWxsIHByb3ZpZGVycyBsYXp5LiBLZWVwIHRoaXMgbG9naWMgYmVoaW5kIGEgZmxhZ1xuICAgICAgICAvLyBmb3IgbWlncmF0aW5nIGV4aXN0aW5nIHVzZXJzLlxuICAgICAgICBwcm92aWRlci5mbGFncyB8PSBOb2RlRmxhZ3MuTGF6eVByb3ZpZGVyO1xuICAgICAgfVxuICAgICAgY29uc3Qgb3ZlcnJpZGUgPSBwcm92aWRlck92ZXJyaWRlcy5nZXQocHJvdmlkZXIudG9rZW4pO1xuICAgICAgaWYgKG92ZXJyaWRlKSB7XG4gICAgICAgIHByb3ZpZGVyLmZsYWdzID0gKHByb3ZpZGVyLmZsYWdzICYgfk5vZGVGbGFncy5DYXRQcm92aWRlck5vRGlyZWN0aXZlKSB8IG92ZXJyaWRlLmZsYWdzO1xuICAgICAgICBwcm92aWRlci5kZXBzID0gc3BsaXREZXBzRHNsKG92ZXJyaWRlLmRlcHMpO1xuICAgICAgICBwcm92aWRlci52YWx1ZSA9IG92ZXJyaWRlLnZhbHVlO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAocHJvdmlkZXJPdmVycmlkZXNXaXRoU2NvcGUuc2l6ZSA+IDApIHtcbiAgICAgIGxldCBtb2R1bGVTZXQgPSBuZXcgU2V0PGFueT4oZGVmLm1vZHVsZXMpO1xuICAgICAgcHJvdmlkZXJPdmVycmlkZXNXaXRoU2NvcGUuZm9yRWFjaCgob3ZlcnJpZGUsIHRva2VuKSA9PiB7XG4gICAgICAgIGlmIChtb2R1bGVTZXQuaGFzKGdldEluamVjdGFibGVEZWYodG9rZW4pICEucHJvdmlkZWRJbikpIHtcbiAgICAgICAgICBsZXQgcHJvdmlkZXIgPSB7XG4gICAgICAgICAgICB0b2tlbjogdG9rZW4sXG4gICAgICAgICAgICBmbGFnczpcbiAgICAgICAgICAgICAgICBvdmVycmlkZS5mbGFncyB8IChoYXNEZXByZWNhdGVkT3ZlcnJpZGVzID8gTm9kZUZsYWdzLkxhenlQcm92aWRlciA6IE5vZGVGbGFncy5Ob25lKSxcbiAgICAgICAgICAgIGRlcHM6IHNwbGl0RGVwc0RzbChvdmVycmlkZS5kZXBzKSxcbiAgICAgICAgICAgIHZhbHVlOiBvdmVycmlkZS52YWx1ZSxcbiAgICAgICAgICAgIGluZGV4OiBkZWYucHJvdmlkZXJzLmxlbmd0aCxcbiAgICAgICAgICB9O1xuICAgICAgICAgIGRlZi5wcm92aWRlcnMucHVzaChwcm92aWRlcik7XG4gICAgICAgICAgZGVmLnByb3ZpZGVyc0J5S2V5W3Rva2VuS2V5KHRva2VuKV0gPSBwcm92aWRlcjtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHByb2RDaGVja0FuZFVwZGF0ZU5vZGUoXG4gICAgdmlldzogVmlld0RhdGEsIGNoZWNrSW5kZXg6IG51bWJlciwgYXJnU3R5bGU6IEFyZ3VtZW50VHlwZSwgdjA/OiBhbnksIHYxPzogYW55LCB2Mj86IGFueSxcbiAgICB2Mz86IGFueSwgdjQ/OiBhbnksIHY1PzogYW55LCB2Nj86IGFueSwgdjc/OiBhbnksIHY4PzogYW55LCB2OT86IGFueSk6IGFueSB7XG4gIGNvbnN0IG5vZGVEZWYgPSB2aWV3LmRlZi5ub2Rlc1tjaGVja0luZGV4XTtcbiAgY2hlY2tBbmRVcGRhdGVOb2RlKHZpZXcsIG5vZGVEZWYsIGFyZ1N0eWxlLCB2MCwgdjEsIHYyLCB2MywgdjQsIHY1LCB2NiwgdjcsIHY4LCB2OSk7XG4gIHJldHVybiAobm9kZURlZi5mbGFncyAmIE5vZGVGbGFncy5DYXRQdXJlRXhwcmVzc2lvbikgP1xuICAgICAgYXNQdXJlRXhwcmVzc2lvbkRhdGEodmlldywgY2hlY2tJbmRleCkudmFsdWUgOlxuICAgICAgdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBwcm9kQ2hlY2tOb0NoYW5nZXNOb2RlKFxuICAgIHZpZXc6IFZpZXdEYXRhLCBjaGVja0luZGV4OiBudW1iZXIsIGFyZ1N0eWxlOiBBcmd1bWVudFR5cGUsIHYwPzogYW55LCB2MT86IGFueSwgdjI/OiBhbnksXG4gICAgdjM/OiBhbnksIHY0PzogYW55LCB2NT86IGFueSwgdjY/OiBhbnksIHY3PzogYW55LCB2OD86IGFueSwgdjk/OiBhbnkpOiBhbnkge1xuICBjb25zdCBub2RlRGVmID0gdmlldy5kZWYubm9kZXNbY2hlY2tJbmRleF07XG4gIGNoZWNrTm9DaGFuZ2VzTm9kZSh2aWV3LCBub2RlRGVmLCBhcmdTdHlsZSwgdjAsIHYxLCB2MiwgdjMsIHY0LCB2NSwgdjYsIHY3LCB2OCwgdjkpO1xuICByZXR1cm4gKG5vZGVEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuQ2F0UHVyZUV4cHJlc3Npb24pID9cbiAgICAgIGFzUHVyZUV4cHJlc3Npb25EYXRhKHZpZXcsIGNoZWNrSW5kZXgpLnZhbHVlIDpcbiAgICAgIHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gZGVidWdDaGVja0FuZFVwZGF0ZVZpZXcodmlldzogVmlld0RhdGEpIHtcbiAgcmV0dXJuIGNhbGxXaXRoRGVidWdDb250ZXh0KERlYnVnQWN0aW9uLmRldGVjdENoYW5nZXMsIGNoZWNrQW5kVXBkYXRlVmlldywgbnVsbCwgW3ZpZXddKTtcbn1cblxuZnVuY3Rpb24gZGVidWdDaGVja05vQ2hhbmdlc1ZpZXcodmlldzogVmlld0RhdGEpIHtcbiAgcmV0dXJuIGNhbGxXaXRoRGVidWdDb250ZXh0KERlYnVnQWN0aW9uLmNoZWNrTm9DaGFuZ2VzLCBjaGVja05vQ2hhbmdlc1ZpZXcsIG51bGwsIFt2aWV3XSk7XG59XG5cbmZ1bmN0aW9uIGRlYnVnRGVzdHJveVZpZXcodmlldzogVmlld0RhdGEpIHtcbiAgcmV0dXJuIGNhbGxXaXRoRGVidWdDb250ZXh0KERlYnVnQWN0aW9uLmRlc3Ryb3ksIGRlc3Ryb3lWaWV3LCBudWxsLCBbdmlld10pO1xufVxuXG5lbnVtIERlYnVnQWN0aW9uIHtcbiAgY3JlYXRlLFxuICBkZXRlY3RDaGFuZ2VzLFxuICBjaGVja05vQ2hhbmdlcyxcbiAgZGVzdHJveSxcbiAgaGFuZGxlRXZlbnRcbn1cblxubGV0IF9jdXJyZW50QWN0aW9uOiBEZWJ1Z0FjdGlvbjtcbmxldCBfY3VycmVudFZpZXc6IFZpZXdEYXRhO1xubGV0IF9jdXJyZW50Tm9kZUluZGV4OiBudW1iZXJ8bnVsbDtcblxuZnVuY3Rpb24gZGVidWdTZXRDdXJyZW50Tm9kZSh2aWV3OiBWaWV3RGF0YSwgbm9kZUluZGV4OiBudW1iZXIgfCBudWxsKSB7XG4gIF9jdXJyZW50VmlldyA9IHZpZXc7XG4gIF9jdXJyZW50Tm9kZUluZGV4ID0gbm9kZUluZGV4O1xufVxuXG5mdW5jdGlvbiBkZWJ1Z0hhbmRsZUV2ZW50KHZpZXc6IFZpZXdEYXRhLCBub2RlSW5kZXg6IG51bWJlciwgZXZlbnROYW1lOiBzdHJpbmcsIGV2ZW50OiBhbnkpIHtcbiAgZGVidWdTZXRDdXJyZW50Tm9kZSh2aWV3LCBub2RlSW5kZXgpO1xuICByZXR1cm4gY2FsbFdpdGhEZWJ1Z0NvbnRleHQoXG4gICAgICBEZWJ1Z0FjdGlvbi5oYW5kbGVFdmVudCwgdmlldy5kZWYuaGFuZGxlRXZlbnQsIG51bGwsIFt2aWV3LCBub2RlSW5kZXgsIGV2ZW50TmFtZSwgZXZlbnRdKTtcbn1cblxuZnVuY3Rpb24gZGVidWdVcGRhdGVEaXJlY3RpdmVzKHZpZXc6IFZpZXdEYXRhLCBjaGVja1R5cGU6IENoZWNrVHlwZSkge1xuICBpZiAodmlldy5zdGF0ZSAmIFZpZXdTdGF0ZS5EZXN0cm95ZWQpIHtcbiAgICB0aHJvdyB2aWV3RGVzdHJveWVkRXJyb3IoRGVidWdBY3Rpb25bX2N1cnJlbnRBY3Rpb25dKTtcbiAgfVxuICBkZWJ1Z1NldEN1cnJlbnROb2RlKHZpZXcsIG5leHREaXJlY3RpdmVXaXRoQmluZGluZyh2aWV3LCAwKSk7XG4gIHJldHVybiB2aWV3LmRlZi51cGRhdGVEaXJlY3RpdmVzKGRlYnVnQ2hlY2tEaXJlY3RpdmVzRm4sIHZpZXcpO1xuXG4gIGZ1bmN0aW9uIGRlYnVnQ2hlY2tEaXJlY3RpdmVzRm4oXG4gICAgICB2aWV3OiBWaWV3RGF0YSwgbm9kZUluZGV4OiBudW1iZXIsIGFyZ1N0eWxlOiBBcmd1bWVudFR5cGUsIC4uLnZhbHVlczogYW55W10pIHtcbiAgICBjb25zdCBub2RlRGVmID0gdmlldy5kZWYubm9kZXNbbm9kZUluZGV4XTtcbiAgICBpZiAoY2hlY2tUeXBlID09PSBDaGVja1R5cGUuQ2hlY2tBbmRVcGRhdGUpIHtcbiAgICAgIGRlYnVnQ2hlY2tBbmRVcGRhdGVOb2RlKHZpZXcsIG5vZGVEZWYsIGFyZ1N0eWxlLCB2YWx1ZXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWJ1Z0NoZWNrTm9DaGFuZ2VzTm9kZSh2aWV3LCBub2RlRGVmLCBhcmdTdHlsZSwgdmFsdWVzKTtcbiAgICB9XG4gICAgaWYgKG5vZGVEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuVHlwZURpcmVjdGl2ZSkge1xuICAgICAgZGVidWdTZXRDdXJyZW50Tm9kZSh2aWV3LCBuZXh0RGlyZWN0aXZlV2l0aEJpbmRpbmcodmlldywgbm9kZUluZGV4KSk7XG4gICAgfVxuICAgIHJldHVybiAobm9kZURlZi5mbGFncyAmIE5vZGVGbGFncy5DYXRQdXJlRXhwcmVzc2lvbikgP1xuICAgICAgICBhc1B1cmVFeHByZXNzaW9uRGF0YSh2aWV3LCBub2RlRGVmLm5vZGVJbmRleCkudmFsdWUgOlxuICAgICAgICB1bmRlZmluZWQ7XG4gIH1cbn1cblxuZnVuY3Rpb24gZGVidWdVcGRhdGVSZW5kZXJlcih2aWV3OiBWaWV3RGF0YSwgY2hlY2tUeXBlOiBDaGVja1R5cGUpIHtcbiAgaWYgKHZpZXcuc3RhdGUgJiBWaWV3U3RhdGUuRGVzdHJveWVkKSB7XG4gICAgdGhyb3cgdmlld0Rlc3Ryb3llZEVycm9yKERlYnVnQWN0aW9uW19jdXJyZW50QWN0aW9uXSk7XG4gIH1cbiAgZGVidWdTZXRDdXJyZW50Tm9kZSh2aWV3LCBuZXh0UmVuZGVyTm9kZVdpdGhCaW5kaW5nKHZpZXcsIDApKTtcbiAgcmV0dXJuIHZpZXcuZGVmLnVwZGF0ZVJlbmRlcmVyKGRlYnVnQ2hlY2tSZW5kZXJOb2RlRm4sIHZpZXcpO1xuXG4gIGZ1bmN0aW9uIGRlYnVnQ2hlY2tSZW5kZXJOb2RlRm4oXG4gICAgICB2aWV3OiBWaWV3RGF0YSwgbm9kZUluZGV4OiBudW1iZXIsIGFyZ1N0eWxlOiBBcmd1bWVudFR5cGUsIC4uLnZhbHVlczogYW55W10pIHtcbiAgICBjb25zdCBub2RlRGVmID0gdmlldy5kZWYubm9kZXNbbm9kZUluZGV4XTtcbiAgICBpZiAoY2hlY2tUeXBlID09PSBDaGVja1R5cGUuQ2hlY2tBbmRVcGRhdGUpIHtcbiAgICAgIGRlYnVnQ2hlY2tBbmRVcGRhdGVOb2RlKHZpZXcsIG5vZGVEZWYsIGFyZ1N0eWxlLCB2YWx1ZXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWJ1Z0NoZWNrTm9DaGFuZ2VzTm9kZSh2aWV3LCBub2RlRGVmLCBhcmdTdHlsZSwgdmFsdWVzKTtcbiAgICB9XG4gICAgaWYgKG5vZGVEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuQ2F0UmVuZGVyTm9kZSkge1xuICAgICAgZGVidWdTZXRDdXJyZW50Tm9kZSh2aWV3LCBuZXh0UmVuZGVyTm9kZVdpdGhCaW5kaW5nKHZpZXcsIG5vZGVJbmRleCkpO1xuICAgIH1cbiAgICByZXR1cm4gKG5vZGVEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuQ2F0UHVyZUV4cHJlc3Npb24pID9cbiAgICAgICAgYXNQdXJlRXhwcmVzc2lvbkRhdGEodmlldywgbm9kZURlZi5ub2RlSW5kZXgpLnZhbHVlIDpcbiAgICAgICAgdW5kZWZpbmVkO1xuICB9XG59XG5cbmZ1bmN0aW9uIGRlYnVnQ2hlY2tBbmRVcGRhdGVOb2RlKFxuICAgIHZpZXc6IFZpZXdEYXRhLCBub2RlRGVmOiBOb2RlRGVmLCBhcmdTdHlsZTogQXJndW1lbnRUeXBlLCBnaXZlblZhbHVlczogYW55W10pOiB2b2lkIHtcbiAgY29uc3QgY2hhbmdlZCA9ICg8YW55PmNoZWNrQW5kVXBkYXRlTm9kZSkodmlldywgbm9kZURlZiwgYXJnU3R5bGUsIC4uLmdpdmVuVmFsdWVzKTtcbiAgaWYgKGNoYW5nZWQpIHtcbiAgICBjb25zdCB2YWx1ZXMgPSBhcmdTdHlsZSA9PT0gQXJndW1lbnRUeXBlLkR5bmFtaWMgPyBnaXZlblZhbHVlc1swXSA6IGdpdmVuVmFsdWVzO1xuICAgIGlmIChub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLlR5cGVEaXJlY3RpdmUpIHtcbiAgICAgIGNvbnN0IGJpbmRpbmdWYWx1ZXM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9ID0ge307XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5vZGVEZWYuYmluZGluZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgYmluZGluZyA9IG5vZGVEZWYuYmluZGluZ3NbaV07XG4gICAgICAgIGNvbnN0IHZhbHVlID0gdmFsdWVzW2ldO1xuICAgICAgICBpZiAoYmluZGluZy5mbGFncyAmIEJpbmRpbmdGbGFncy5UeXBlUHJvcGVydHkpIHtcbiAgICAgICAgICBiaW5kaW5nVmFsdWVzW25vcm1hbGl6ZURlYnVnQmluZGluZ05hbWUoYmluZGluZy5ub25NaW5pZmllZE5hbWUgISldID1cbiAgICAgICAgICAgICAgbm9ybWFsaXplRGVidWdCaW5kaW5nVmFsdWUodmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb25zdCBlbERlZiA9IG5vZGVEZWYucGFyZW50ICE7XG4gICAgICBjb25zdCBlbCA9IGFzRWxlbWVudERhdGEodmlldywgZWxEZWYubm9kZUluZGV4KS5yZW5kZXJFbGVtZW50O1xuICAgICAgaWYgKCFlbERlZi5lbGVtZW50ICEubmFtZSkge1xuICAgICAgICAvLyBhIGNvbW1lbnQuXG4gICAgICAgIHZpZXcucmVuZGVyZXIuc2V0VmFsdWUoZWwsIGBiaW5kaW5ncz0ke0pTT04uc3RyaW5naWZ5KGJpbmRpbmdWYWx1ZXMsIG51bGwsIDIpfWApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gYSByZWd1bGFyIGVsZW1lbnQuXG4gICAgICAgIGZvciAobGV0IGF0dHIgaW4gYmluZGluZ1ZhbHVlcykge1xuICAgICAgICAgIGNvbnN0IHZhbHVlID0gYmluZGluZ1ZhbHVlc1thdHRyXTtcbiAgICAgICAgICBpZiAodmFsdWUgIT0gbnVsbCkge1xuICAgICAgICAgICAgdmlldy5yZW5kZXJlci5zZXRBdHRyaWJ1dGUoZWwsIGF0dHIsIHZhbHVlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmlldy5yZW5kZXJlci5yZW1vdmVBdHRyaWJ1dGUoZWwsIGF0dHIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBkZWJ1Z0NoZWNrTm9DaGFuZ2VzTm9kZShcbiAgICB2aWV3OiBWaWV3RGF0YSwgbm9kZURlZjogTm9kZURlZiwgYXJnU3R5bGU6IEFyZ3VtZW50VHlwZSwgdmFsdWVzOiBhbnlbXSk6IHZvaWQge1xuICAoPGFueT5jaGVja05vQ2hhbmdlc05vZGUpKHZpZXcsIG5vZGVEZWYsIGFyZ1N0eWxlLCAuLi52YWx1ZXMpO1xufVxuXG5mdW5jdGlvbiBuZXh0RGlyZWN0aXZlV2l0aEJpbmRpbmcodmlldzogVmlld0RhdGEsIG5vZGVJbmRleDogbnVtYmVyKTogbnVtYmVyfG51bGwge1xuICBmb3IgKGxldCBpID0gbm9kZUluZGV4OyBpIDwgdmlldy5kZWYubm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBub2RlRGVmID0gdmlldy5kZWYubm9kZXNbaV07XG4gICAgaWYgKG5vZGVEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuVHlwZURpcmVjdGl2ZSAmJiBub2RlRGVmLmJpbmRpbmdzICYmIG5vZGVEZWYuYmluZGluZ3MubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gaTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIG5leHRSZW5kZXJOb2RlV2l0aEJpbmRpbmcodmlldzogVmlld0RhdGEsIG5vZGVJbmRleDogbnVtYmVyKTogbnVtYmVyfG51bGwge1xuICBmb3IgKGxldCBpID0gbm9kZUluZGV4OyBpIDwgdmlldy5kZWYubm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBub2RlRGVmID0gdmlldy5kZWYubm9kZXNbaV07XG4gICAgaWYgKChub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLkNhdFJlbmRlck5vZGUpICYmIG5vZGVEZWYuYmluZGluZ3MgJiYgbm9kZURlZi5iaW5kaW5ncy5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuY2xhc3MgRGVidWdDb250ZXh0XyBpbXBsZW1lbnRzIERlYnVnQ29udGV4dCB7XG4gIHByaXZhdGUgbm9kZURlZjogTm9kZURlZjtcbiAgcHJpdmF0ZSBlbFZpZXc6IFZpZXdEYXRhO1xuICBwcml2YXRlIGVsRGVmOiBOb2RlRGVmO1xuXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyB2aWV3OiBWaWV3RGF0YSwgcHVibGljIG5vZGVJbmRleDogbnVtYmVyfG51bGwpIHtcbiAgICBpZiAobm9kZUluZGV4ID09IG51bGwpIHtcbiAgICAgIHRoaXMubm9kZUluZGV4ID0gbm9kZUluZGV4ID0gMDtcbiAgICB9XG4gICAgdGhpcy5ub2RlRGVmID0gdmlldy5kZWYubm9kZXNbbm9kZUluZGV4XTtcbiAgICBsZXQgZWxEZWYgPSB0aGlzLm5vZGVEZWY7XG4gICAgbGV0IGVsVmlldyA9IHZpZXc7XG4gICAgd2hpbGUgKGVsRGVmICYmIChlbERlZi5mbGFncyAmIE5vZGVGbGFncy5UeXBlRWxlbWVudCkgPT09IDApIHtcbiAgICAgIGVsRGVmID0gZWxEZWYucGFyZW50ICE7XG4gICAgfVxuICAgIGlmICghZWxEZWYpIHtcbiAgICAgIHdoaWxlICghZWxEZWYgJiYgZWxWaWV3KSB7XG4gICAgICAgIGVsRGVmID0gdmlld1BhcmVudEVsKGVsVmlldykgITtcbiAgICAgICAgZWxWaWV3ID0gZWxWaWV3LnBhcmVudCAhO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmVsRGVmID0gZWxEZWY7XG4gICAgdGhpcy5lbFZpZXcgPSBlbFZpZXc7XG4gIH1cblxuICBwcml2YXRlIGdldCBlbE9yQ29tcFZpZXcoKSB7XG4gICAgLy8gSGFzIHRvIGJlIGRvbmUgbGF6aWx5IGFzIHdlIHVzZSB0aGUgRGVidWdDb250ZXh0IGFsc28gZHVyaW5nIGNyZWF0aW9uIG9mIGVsZW1lbnRzLi4uXG4gICAgcmV0dXJuIGFzRWxlbWVudERhdGEodGhpcy5lbFZpZXcsIHRoaXMuZWxEZWYubm9kZUluZGV4KS5jb21wb25lbnRWaWV3IHx8IHRoaXMudmlldztcbiAgfVxuXG4gIGdldCBpbmplY3RvcigpOiBJbmplY3RvciB7IHJldHVybiBjcmVhdGVJbmplY3Rvcih0aGlzLmVsVmlldywgdGhpcy5lbERlZik7IH1cblxuICBnZXQgY29tcG9uZW50KCk6IGFueSB7IHJldHVybiB0aGlzLmVsT3JDb21wVmlldy5jb21wb25lbnQ7IH1cblxuICBnZXQgY29udGV4dCgpOiBhbnkgeyByZXR1cm4gdGhpcy5lbE9yQ29tcFZpZXcuY29udGV4dDsgfVxuXG4gIGdldCBwcm92aWRlclRva2VucygpOiBhbnlbXSB7XG4gICAgY29uc3QgdG9rZW5zOiBhbnlbXSA9IFtdO1xuICAgIGlmICh0aGlzLmVsRGVmKSB7XG4gICAgICBmb3IgKGxldCBpID0gdGhpcy5lbERlZi5ub2RlSW5kZXggKyAxOyBpIDw9IHRoaXMuZWxEZWYubm9kZUluZGV4ICsgdGhpcy5lbERlZi5jaGlsZENvdW50O1xuICAgICAgICAgICBpKyspIHtcbiAgICAgICAgY29uc3QgY2hpbGREZWYgPSB0aGlzLmVsVmlldy5kZWYubm9kZXNbaV07XG4gICAgICAgIGlmIChjaGlsZERlZi5mbGFncyAmIE5vZGVGbGFncy5DYXRQcm92aWRlcikge1xuICAgICAgICAgIHRva2Vucy5wdXNoKGNoaWxkRGVmLnByb3ZpZGVyICEudG9rZW4pO1xuICAgICAgICB9XG4gICAgICAgIGkgKz0gY2hpbGREZWYuY2hpbGRDb3VudDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRva2VucztcbiAgfVxuXG4gIGdldCByZWZlcmVuY2VzKCk6IHtba2V5OiBzdHJpbmddOiBhbnl9IHtcbiAgICBjb25zdCByZWZlcmVuY2VzOiB7W2tleTogc3RyaW5nXTogYW55fSA9IHt9O1xuICAgIGlmICh0aGlzLmVsRGVmKSB7XG4gICAgICBjb2xsZWN0UmVmZXJlbmNlcyh0aGlzLmVsVmlldywgdGhpcy5lbERlZiwgcmVmZXJlbmNlcyk7XG5cbiAgICAgIGZvciAobGV0IGkgPSB0aGlzLmVsRGVmLm5vZGVJbmRleCArIDE7IGkgPD0gdGhpcy5lbERlZi5ub2RlSW5kZXggKyB0aGlzLmVsRGVmLmNoaWxkQ291bnQ7XG4gICAgICAgICAgIGkrKykge1xuICAgICAgICBjb25zdCBjaGlsZERlZiA9IHRoaXMuZWxWaWV3LmRlZi5ub2Rlc1tpXTtcbiAgICAgICAgaWYgKGNoaWxkRGVmLmZsYWdzICYgTm9kZUZsYWdzLkNhdFByb3ZpZGVyKSB7XG4gICAgICAgICAgY29sbGVjdFJlZmVyZW5jZXModGhpcy5lbFZpZXcsIGNoaWxkRGVmLCByZWZlcmVuY2VzKTtcbiAgICAgICAgfVxuICAgICAgICBpICs9IGNoaWxkRGVmLmNoaWxkQ291bnQ7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZWZlcmVuY2VzO1xuICB9XG5cbiAgZ2V0IGNvbXBvbmVudFJlbmRlckVsZW1lbnQoKSB7XG4gICAgY29uc3QgZWxEYXRhID0gZmluZEhvc3RFbGVtZW50KHRoaXMuZWxPckNvbXBWaWV3KTtcbiAgICByZXR1cm4gZWxEYXRhID8gZWxEYXRhLnJlbmRlckVsZW1lbnQgOiB1bmRlZmluZWQ7XG4gIH1cblxuICBnZXQgcmVuZGVyTm9kZSgpOiBhbnkge1xuICAgIHJldHVybiB0aGlzLm5vZGVEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuVHlwZVRleHQgPyByZW5kZXJOb2RlKHRoaXMudmlldywgdGhpcy5ub2RlRGVmKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbmRlck5vZGUodGhpcy5lbFZpZXcsIHRoaXMuZWxEZWYpO1xuICB9XG5cbiAgbG9nRXJyb3IoY29uc29sZTogQ29uc29sZSwgLi4udmFsdWVzOiBhbnlbXSkge1xuICAgIGxldCBsb2dWaWV3RGVmOiBWaWV3RGVmaW5pdGlvbjtcbiAgICBsZXQgbG9nTm9kZUluZGV4OiBudW1iZXI7XG4gICAgaWYgKHRoaXMubm9kZURlZi5mbGFncyAmIE5vZGVGbGFncy5UeXBlVGV4dCkge1xuICAgICAgbG9nVmlld0RlZiA9IHRoaXMudmlldy5kZWY7XG4gICAgICBsb2dOb2RlSW5kZXggPSB0aGlzLm5vZGVEZWYubm9kZUluZGV4O1xuICAgIH0gZWxzZSB7XG4gICAgICBsb2dWaWV3RGVmID0gdGhpcy5lbFZpZXcuZGVmO1xuICAgICAgbG9nTm9kZUluZGV4ID0gdGhpcy5lbERlZi5ub2RlSW5kZXg7XG4gICAgfVxuICAgIC8vIE5vdGU6IHdlIG9ubHkgZ2VuZXJhdGUgYSBsb2cgZnVuY3Rpb24gZm9yIHRleHQgYW5kIGVsZW1lbnQgbm9kZXNcbiAgICAvLyB0byBtYWtlIHRoZSBnZW5lcmF0ZWQgY29kZSBhcyBzbWFsbCBhcyBwb3NzaWJsZS5cbiAgICBjb25zdCByZW5kZXJOb2RlSW5kZXggPSBnZXRSZW5kZXJOb2RlSW5kZXgobG9nVmlld0RlZiwgbG9nTm9kZUluZGV4KTtcbiAgICBsZXQgY3VyclJlbmRlck5vZGVJbmRleCA9IC0xO1xuICAgIGxldCBub2RlTG9nZ2VyOiBOb2RlTG9nZ2VyID0gKCkgPT4ge1xuICAgICAgY3VyclJlbmRlck5vZGVJbmRleCsrO1xuICAgICAgaWYgKGN1cnJSZW5kZXJOb2RlSW5kZXggPT09IHJlbmRlck5vZGVJbmRleCkge1xuICAgICAgICByZXR1cm4gY29uc29sZS5lcnJvci5iaW5kKGNvbnNvbGUsIC4uLnZhbHVlcyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gTk9PUDtcbiAgICAgIH1cbiAgICB9O1xuICAgIGxvZ1ZpZXdEZWYuZmFjdG9yeSAhKG5vZGVMb2dnZXIpO1xuICAgIGlmIChjdXJyUmVuZGVyTm9kZUluZGV4IDwgcmVuZGVyTm9kZUluZGV4KSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdJbGxlZ2FsIHN0YXRlOiB0aGUgVmlld0RlZmluaXRpb25GYWN0b3J5IGRpZCBub3QgY2FsbCB0aGUgbG9nZ2VyIScpO1xuICAgICAgKDxhbnk+Y29uc29sZS5lcnJvcikoLi4udmFsdWVzKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0UmVuZGVyTm9kZUluZGV4KHZpZXdEZWY6IFZpZXdEZWZpbml0aW9uLCBub2RlSW5kZXg6IG51bWJlcik6IG51bWJlciB7XG4gIGxldCByZW5kZXJOb2RlSW5kZXggPSAtMTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPD0gbm9kZUluZGV4OyBpKyspIHtcbiAgICBjb25zdCBub2RlRGVmID0gdmlld0RlZi5ub2Rlc1tpXTtcbiAgICBpZiAobm9kZURlZi5mbGFncyAmIE5vZGVGbGFncy5DYXRSZW5kZXJOb2RlKSB7XG4gICAgICByZW5kZXJOb2RlSW5kZXgrKztcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlbmRlck5vZGVJbmRleDtcbn1cblxuZnVuY3Rpb24gZmluZEhvc3RFbGVtZW50KHZpZXc6IFZpZXdEYXRhKTogRWxlbWVudERhdGF8bnVsbCB7XG4gIHdoaWxlICh2aWV3ICYmICFpc0NvbXBvbmVudFZpZXcodmlldykpIHtcbiAgICB2aWV3ID0gdmlldy5wYXJlbnQgITtcbiAgfVxuICBpZiAodmlldy5wYXJlbnQpIHtcbiAgICByZXR1cm4gYXNFbGVtZW50RGF0YSh2aWV3LnBhcmVudCwgdmlld1BhcmVudEVsKHZpZXcpICEubm9kZUluZGV4KTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gY29sbGVjdFJlZmVyZW5jZXModmlldzogVmlld0RhdGEsIG5vZGVEZWY6IE5vZGVEZWYsIHJlZmVyZW5jZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9KSB7XG4gIGZvciAobGV0IHJlZk5hbWUgaW4gbm9kZURlZi5yZWZlcmVuY2VzKSB7XG4gICAgcmVmZXJlbmNlc1tyZWZOYW1lXSA9IGdldFF1ZXJ5VmFsdWUodmlldywgbm9kZURlZiwgbm9kZURlZi5yZWZlcmVuY2VzW3JlZk5hbWVdKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjYWxsV2l0aERlYnVnQ29udGV4dChhY3Rpb246IERlYnVnQWN0aW9uLCBmbjogYW55LCBzZWxmOiBhbnksIGFyZ3M6IGFueVtdKSB7XG4gIGNvbnN0IG9sZEFjdGlvbiA9IF9jdXJyZW50QWN0aW9uO1xuICBjb25zdCBvbGRWaWV3ID0gX2N1cnJlbnRWaWV3O1xuICBjb25zdCBvbGROb2RlSW5kZXggPSBfY3VycmVudE5vZGVJbmRleDtcbiAgdHJ5IHtcbiAgICBfY3VycmVudEFjdGlvbiA9IGFjdGlvbjtcbiAgICBjb25zdCByZXN1bHQgPSBmbi5hcHBseShzZWxmLCBhcmdzKTtcbiAgICBfY3VycmVudFZpZXcgPSBvbGRWaWV3O1xuICAgIF9jdXJyZW50Tm9kZUluZGV4ID0gb2xkTm9kZUluZGV4O1xuICAgIF9jdXJyZW50QWN0aW9uID0gb2xkQWN0aW9uO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBpZiAoaXNWaWV3RGVidWdFcnJvcihlKSB8fCAhX2N1cnJlbnRWaWV3KSB7XG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgICB0aHJvdyB2aWV3V3JhcHBlZERlYnVnRXJyb3IoZSwgZ2V0Q3VycmVudERlYnVnQ29udGV4dCgpICEpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDdXJyZW50RGVidWdDb250ZXh0KCk6IERlYnVnQ29udGV4dHxudWxsIHtcbiAgcmV0dXJuIF9jdXJyZW50VmlldyA/IG5ldyBEZWJ1Z0NvbnRleHRfKF9jdXJyZW50VmlldywgX2N1cnJlbnROb2RlSW5kZXgpIDogbnVsbDtcbn1cblxuZXhwb3J0IGNsYXNzIERlYnVnUmVuZGVyZXJGYWN0b3J5MiBpbXBsZW1lbnRzIFJlbmRlcmVyRmFjdG9yeTIge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGRlbGVnYXRlOiBSZW5kZXJlckZhY3RvcnkyKSB7fVxuXG4gIGNyZWF0ZVJlbmRlcmVyKGVsZW1lbnQ6IGFueSwgcmVuZGVyRGF0YTogUmVuZGVyZXJUeXBlMnxudWxsKTogUmVuZGVyZXIyIHtcbiAgICByZXR1cm4gbmV3IERlYnVnUmVuZGVyZXIyKHRoaXMuZGVsZWdhdGUuY3JlYXRlUmVuZGVyZXIoZWxlbWVudCwgcmVuZGVyRGF0YSkpO1xuICB9XG5cbiAgYmVnaW4oKSB7XG4gICAgaWYgKHRoaXMuZGVsZWdhdGUuYmVnaW4pIHtcbiAgICAgIHRoaXMuZGVsZWdhdGUuYmVnaW4oKTtcbiAgICB9XG4gIH1cbiAgZW5kKCkge1xuICAgIGlmICh0aGlzLmRlbGVnYXRlLmVuZCkge1xuICAgICAgdGhpcy5kZWxlZ2F0ZS5lbmQoKTtcbiAgICB9XG4gIH1cblxuICB3aGVuUmVuZGVyaW5nRG9uZSgpOiBQcm9taXNlPGFueT4ge1xuICAgIGlmICh0aGlzLmRlbGVnYXRlLndoZW5SZW5kZXJpbmdEb25lKSB7XG4gICAgICByZXR1cm4gdGhpcy5kZWxlZ2F0ZS53aGVuUmVuZGVyaW5nRG9uZSgpO1xuICAgIH1cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBEZWJ1Z1JlbmRlcmVyMiBpbXBsZW1lbnRzIFJlbmRlcmVyMiB7XG4gIHJlYWRvbmx5IGRhdGE6IHtba2V5OiBzdHJpbmddOiBhbnl9O1xuXG4gIHByaXZhdGUgY3JlYXRlRGVidWdDb250ZXh0KG5hdGl2ZUVsZW1lbnQ6IGFueSkgeyByZXR1cm4gdGhpcy5kZWJ1Z0NvbnRleHRGYWN0b3J5KG5hdGl2ZUVsZW1lbnQpOyB9XG5cbiAgLyoqXG4gICAqIEZhY3RvcnkgZnVuY3Rpb24gdXNlZCB0byBjcmVhdGUgYSBgRGVidWdDb250ZXh0YCB3aGVuIGEgbm9kZSBpcyBjcmVhdGVkLlxuICAgKlxuICAgKiBUaGUgYERlYnVnQ29udGV4dGAgYWxsb3dzIHRvIHJldHJpZXZlIGluZm9ybWF0aW9uIGFib3V0IHRoZSBub2RlcyB0aGF0IGFyZSB1c2VmdWwgaW4gdGVzdHMuXG4gICAqXG4gICAqIFRoZSBmYWN0b3J5IGlzIGNvbmZpZ3VyYWJsZSBzbyB0aGF0IHRoZSBgRGVidWdSZW5kZXJlcjJgIGNvdWxkIGluc3RhbnRpYXRlIGVpdGhlciBhIFZpZXcgRW5naW5lXG4gICAqIG9yIGEgUmVuZGVyIGNvbnRleHQuXG4gICAqL1xuICBkZWJ1Z0NvbnRleHRGYWN0b3J5OiAobmF0aXZlRWxlbWVudD86IGFueSkgPT4gRGVidWdDb250ZXh0IHwgbnVsbCA9IGdldEN1cnJlbnREZWJ1Z0NvbnRleHQ7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBkZWxlZ2F0ZTogUmVuZGVyZXIyKSB7IHRoaXMuZGF0YSA9IHRoaXMuZGVsZWdhdGUuZGF0YTsgfVxuXG4gIGRlc3Ryb3lOb2RlKG5vZGU6IGFueSkge1xuICAgIHJlbW92ZURlYnVnTm9kZUZyb21JbmRleChnZXREZWJ1Z05vZGUobm9kZSkgISk7XG4gICAgaWYgKHRoaXMuZGVsZWdhdGUuZGVzdHJveU5vZGUpIHtcbiAgICAgIHRoaXMuZGVsZWdhdGUuZGVzdHJveU5vZGUobm9kZSk7XG4gICAgfVxuICB9XG5cbiAgZGVzdHJveSgpIHsgdGhpcy5kZWxlZ2F0ZS5kZXN0cm95KCk7IH1cblxuICBjcmVhdGVFbGVtZW50KG5hbWU6IHN0cmluZywgbmFtZXNwYWNlPzogc3RyaW5nKTogYW55IHtcbiAgICBjb25zdCBlbCA9IHRoaXMuZGVsZWdhdGUuY3JlYXRlRWxlbWVudChuYW1lLCBuYW1lc3BhY2UpO1xuICAgIGNvbnN0IGRlYnVnQ3R4ID0gdGhpcy5jcmVhdGVEZWJ1Z0NvbnRleHQoZWwpO1xuICAgIGlmIChkZWJ1Z0N0eCkge1xuICAgICAgY29uc3QgZGVidWdFbCA9IG5ldyBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fKGVsLCBudWxsLCBkZWJ1Z0N0eCk7XG4gICAgICAoZGVidWdFbCBhc3tuYW1lOiBzdHJpbmd9KS5uYW1lID0gbmFtZTtcbiAgICAgIGluZGV4RGVidWdOb2RlKGRlYnVnRWwpO1xuICAgIH1cbiAgICByZXR1cm4gZWw7XG4gIH1cblxuICBjcmVhdGVDb21tZW50KHZhbHVlOiBzdHJpbmcpOiBhbnkge1xuICAgIGNvbnN0IGNvbW1lbnQgPSB0aGlzLmRlbGVnYXRlLmNyZWF0ZUNvbW1lbnQodmFsdWUpO1xuICAgIGNvbnN0IGRlYnVnQ3R4ID0gdGhpcy5jcmVhdGVEZWJ1Z0NvbnRleHQoY29tbWVudCk7XG4gICAgaWYgKGRlYnVnQ3R4KSB7XG4gICAgICBpbmRleERlYnVnTm9kZShuZXcgRGVidWdOb2RlX19QUkVfUjNfXyhjb21tZW50LCBudWxsLCBkZWJ1Z0N0eCkpO1xuICAgIH1cbiAgICByZXR1cm4gY29tbWVudDtcbiAgfVxuXG4gIGNyZWF0ZVRleHQodmFsdWU6IHN0cmluZyk6IGFueSB7XG4gICAgY29uc3QgdGV4dCA9IHRoaXMuZGVsZWdhdGUuY3JlYXRlVGV4dCh2YWx1ZSk7XG4gICAgY29uc3QgZGVidWdDdHggPSB0aGlzLmNyZWF0ZURlYnVnQ29udGV4dCh0ZXh0KTtcbiAgICBpZiAoZGVidWdDdHgpIHtcbiAgICAgIGluZGV4RGVidWdOb2RlKG5ldyBEZWJ1Z05vZGVfX1BSRV9SM19fKHRleHQsIG51bGwsIGRlYnVnQ3R4KSk7XG4gICAgfVxuICAgIHJldHVybiB0ZXh0O1xuICB9XG5cbiAgYXBwZW5kQ2hpbGQocGFyZW50OiBhbnksIG5ld0NoaWxkOiBhbnkpOiB2b2lkIHtcbiAgICBjb25zdCBkZWJ1Z0VsID0gZ2V0RGVidWdOb2RlKHBhcmVudCk7XG4gICAgY29uc3QgZGVidWdDaGlsZEVsID0gZ2V0RGVidWdOb2RlKG5ld0NoaWxkKTtcbiAgICBpZiAoZGVidWdFbCAmJiBkZWJ1Z0NoaWxkRWwgJiYgZGVidWdFbCBpbnN0YW5jZW9mIERlYnVnRWxlbWVudF9fUFJFX1IzX18pIHtcbiAgICAgIGRlYnVnRWwuYWRkQ2hpbGQoZGVidWdDaGlsZEVsKTtcbiAgICB9XG4gICAgdGhpcy5kZWxlZ2F0ZS5hcHBlbmRDaGlsZChwYXJlbnQsIG5ld0NoaWxkKTtcbiAgfVxuXG4gIGluc2VydEJlZm9yZShwYXJlbnQ6IGFueSwgbmV3Q2hpbGQ6IGFueSwgcmVmQ2hpbGQ6IGFueSk6IHZvaWQge1xuICAgIGNvbnN0IGRlYnVnRWwgPSBnZXREZWJ1Z05vZGUocGFyZW50KTtcbiAgICBjb25zdCBkZWJ1Z0NoaWxkRWwgPSBnZXREZWJ1Z05vZGUobmV3Q2hpbGQpO1xuICAgIGNvbnN0IGRlYnVnUmVmRWwgPSBnZXREZWJ1Z05vZGUocmVmQ2hpbGQpICE7XG4gICAgaWYgKGRlYnVnRWwgJiYgZGVidWdDaGlsZEVsICYmIGRlYnVnRWwgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fKSB7XG4gICAgICBkZWJ1Z0VsLmluc2VydEJlZm9yZShkZWJ1Z1JlZkVsLCBkZWJ1Z0NoaWxkRWwpO1xuICAgIH1cblxuICAgIHRoaXMuZGVsZWdhdGUuaW5zZXJ0QmVmb3JlKHBhcmVudCwgbmV3Q2hpbGQsIHJlZkNoaWxkKTtcbiAgfVxuXG4gIHJlbW92ZUNoaWxkKHBhcmVudDogYW55LCBvbGRDaGlsZDogYW55KTogdm9pZCB7XG4gICAgY29uc3QgZGVidWdFbCA9IGdldERlYnVnTm9kZShwYXJlbnQpO1xuICAgIGNvbnN0IGRlYnVnQ2hpbGRFbCA9IGdldERlYnVnTm9kZShvbGRDaGlsZCk7XG4gICAgaWYgKGRlYnVnRWwgJiYgZGVidWdDaGlsZEVsICYmIGRlYnVnRWwgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fKSB7XG4gICAgICBkZWJ1Z0VsLnJlbW92ZUNoaWxkKGRlYnVnQ2hpbGRFbCk7XG4gICAgfVxuICAgIHRoaXMuZGVsZWdhdGUucmVtb3ZlQ2hpbGQocGFyZW50LCBvbGRDaGlsZCk7XG4gIH1cblxuICBzZWxlY3RSb290RWxlbWVudChzZWxlY3Rvck9yTm9kZTogc3RyaW5nfGFueSwgcHJlc2VydmVDb250ZW50PzogYm9vbGVhbik6IGFueSB7XG4gICAgY29uc3QgZWwgPSB0aGlzLmRlbGVnYXRlLnNlbGVjdFJvb3RFbGVtZW50KHNlbGVjdG9yT3JOb2RlLCBwcmVzZXJ2ZUNvbnRlbnQpO1xuICAgIGNvbnN0IGRlYnVnQ3R4ID0gZ2V0Q3VycmVudERlYnVnQ29udGV4dCgpO1xuICAgIGlmIChkZWJ1Z0N0eCkge1xuICAgICAgaW5kZXhEZWJ1Z05vZGUobmV3IERlYnVnRWxlbWVudF9fUFJFX1IzX18oZWwsIG51bGwsIGRlYnVnQ3R4KSk7XG4gICAgfVxuICAgIHJldHVybiBlbDtcbiAgfVxuXG4gIHNldEF0dHJpYnV0ZShlbDogYW55LCBuYW1lOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcsIG5hbWVzcGFjZT86IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IGRlYnVnRWwgPSBnZXREZWJ1Z05vZGUoZWwpO1xuICAgIGlmIChkZWJ1Z0VsICYmIGRlYnVnRWwgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fKSB7XG4gICAgICBjb25zdCBmdWxsTmFtZSA9IG5hbWVzcGFjZSA/IG5hbWVzcGFjZSArICc6JyArIG5hbWUgOiBuYW1lO1xuICAgICAgZGVidWdFbC5hdHRyaWJ1dGVzW2Z1bGxOYW1lXSA9IHZhbHVlO1xuICAgIH1cbiAgICB0aGlzLmRlbGVnYXRlLnNldEF0dHJpYnV0ZShlbCwgbmFtZSwgdmFsdWUsIG5hbWVzcGFjZSk7XG4gIH1cblxuICByZW1vdmVBdHRyaWJ1dGUoZWw6IGFueSwgbmFtZTogc3RyaW5nLCBuYW1lc3BhY2U/OiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCBkZWJ1Z0VsID0gZ2V0RGVidWdOb2RlKGVsKTtcbiAgICBpZiAoZGVidWdFbCAmJiBkZWJ1Z0VsIGluc3RhbmNlb2YgRGVidWdFbGVtZW50X19QUkVfUjNfXykge1xuICAgICAgY29uc3QgZnVsbE5hbWUgPSBuYW1lc3BhY2UgPyBuYW1lc3BhY2UgKyAnOicgKyBuYW1lIDogbmFtZTtcbiAgICAgIGRlYnVnRWwuYXR0cmlidXRlc1tmdWxsTmFtZV0gPSBudWxsO1xuICAgIH1cbiAgICB0aGlzLmRlbGVnYXRlLnJlbW92ZUF0dHJpYnV0ZShlbCwgbmFtZSwgbmFtZXNwYWNlKTtcbiAgfVxuXG4gIGFkZENsYXNzKGVsOiBhbnksIG5hbWU6IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IGRlYnVnRWwgPSBnZXREZWJ1Z05vZGUoZWwpO1xuICAgIGlmIChkZWJ1Z0VsICYmIGRlYnVnRWwgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fKSB7XG4gICAgICBkZWJ1Z0VsLmNsYXNzZXNbbmFtZV0gPSB0cnVlO1xuICAgIH1cbiAgICB0aGlzLmRlbGVnYXRlLmFkZENsYXNzKGVsLCBuYW1lKTtcbiAgfVxuXG4gIHJlbW92ZUNsYXNzKGVsOiBhbnksIG5hbWU6IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IGRlYnVnRWwgPSBnZXREZWJ1Z05vZGUoZWwpO1xuICAgIGlmIChkZWJ1Z0VsICYmIGRlYnVnRWwgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fKSB7XG4gICAgICBkZWJ1Z0VsLmNsYXNzZXNbbmFtZV0gPSBmYWxzZTtcbiAgICB9XG4gICAgdGhpcy5kZWxlZ2F0ZS5yZW1vdmVDbGFzcyhlbCwgbmFtZSk7XG4gIH1cblxuICBzZXRTdHlsZShlbDogYW55LCBzdHlsZTogc3RyaW5nLCB2YWx1ZTogYW55LCBmbGFnczogUmVuZGVyZXJTdHlsZUZsYWdzMik6IHZvaWQge1xuICAgIGNvbnN0IGRlYnVnRWwgPSBnZXREZWJ1Z05vZGUoZWwpO1xuICAgIGlmIChkZWJ1Z0VsICYmIGRlYnVnRWwgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fKSB7XG4gICAgICBkZWJ1Z0VsLnN0eWxlc1tzdHlsZV0gPSB2YWx1ZTtcbiAgICB9XG4gICAgdGhpcy5kZWxlZ2F0ZS5zZXRTdHlsZShlbCwgc3R5bGUsIHZhbHVlLCBmbGFncyk7XG4gIH1cblxuICByZW1vdmVTdHlsZShlbDogYW55LCBzdHlsZTogc3RyaW5nLCBmbGFnczogUmVuZGVyZXJTdHlsZUZsYWdzMik6IHZvaWQge1xuICAgIGNvbnN0IGRlYnVnRWwgPSBnZXREZWJ1Z05vZGUoZWwpO1xuICAgIGlmIChkZWJ1Z0VsICYmIGRlYnVnRWwgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fKSB7XG4gICAgICBkZWJ1Z0VsLnN0eWxlc1tzdHlsZV0gPSBudWxsO1xuICAgIH1cbiAgICB0aGlzLmRlbGVnYXRlLnJlbW92ZVN0eWxlKGVsLCBzdHlsZSwgZmxhZ3MpO1xuICB9XG5cbiAgc2V0UHJvcGVydHkoZWw6IGFueSwgbmFtZTogc3RyaW5nLCB2YWx1ZTogYW55KTogdm9pZCB7XG4gICAgY29uc3QgZGVidWdFbCA9IGdldERlYnVnTm9kZShlbCk7XG4gICAgaWYgKGRlYnVnRWwgJiYgZGVidWdFbCBpbnN0YW5jZW9mIERlYnVnRWxlbWVudF9fUFJFX1IzX18pIHtcbiAgICAgIGRlYnVnRWwucHJvcGVydGllc1tuYW1lXSA9IHZhbHVlO1xuICAgIH1cbiAgICB0aGlzLmRlbGVnYXRlLnNldFByb3BlcnR5KGVsLCBuYW1lLCB2YWx1ZSk7XG4gIH1cblxuICBsaXN0ZW4oXG4gICAgICB0YXJnZXQ6ICdkb2N1bWVudCd8J3dpbmRvd3MnfCdib2R5J3xhbnksIGV2ZW50TmFtZTogc3RyaW5nLFxuICAgICAgY2FsbGJhY2s6IChldmVudDogYW55KSA9PiBib29sZWFuKTogKCkgPT4gdm9pZCB7XG4gICAgaWYgKHR5cGVvZiB0YXJnZXQgIT09ICdzdHJpbmcnKSB7XG4gICAgICBjb25zdCBkZWJ1Z0VsID0gZ2V0RGVidWdOb2RlKHRhcmdldCk7XG4gICAgICBpZiAoZGVidWdFbCkge1xuICAgICAgICBkZWJ1Z0VsLmxpc3RlbmVycy5wdXNoKG5ldyBFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgY2FsbGJhY2spKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5kZWxlZ2F0ZS5saXN0ZW4odGFyZ2V0LCBldmVudE5hbWUsIGNhbGxiYWNrKTtcbiAgfVxuXG4gIHBhcmVudE5vZGUobm9kZTogYW55KTogYW55IHsgcmV0dXJuIHRoaXMuZGVsZWdhdGUucGFyZW50Tm9kZShub2RlKTsgfVxuICBuZXh0U2libGluZyhub2RlOiBhbnkpOiBhbnkgeyByZXR1cm4gdGhpcy5kZWxlZ2F0ZS5uZXh0U2libGluZyhub2RlKTsgfVxuICBzZXRWYWx1ZShub2RlOiBhbnksIHZhbHVlOiBzdHJpbmcpOiB2b2lkIHsgcmV0dXJuIHRoaXMuZGVsZWdhdGUuc2V0VmFsdWUobm9kZSwgdmFsdWUpOyB9XG59XG4iXX0=