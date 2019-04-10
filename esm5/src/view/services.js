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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmljZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy92aWV3L3NlcnZpY2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBQUMsc0JBQXNCLEVBQUUsbUJBQW1CLEVBQUUsYUFBYSxFQUFFLFlBQVksRUFBRSxjQUFjLEVBQUUsd0JBQXdCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUd2SixPQUFPLEVBQUMsZ0JBQWdCLEVBQWlCLE1BQU0sc0JBQXNCLENBQUM7QUFDdEUsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBSTlDLE9BQU8sRUFBWSxnQkFBZ0IsRUFBcUMsTUFBTSxlQUFlLENBQUM7QUFDOUYsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBQ25ELE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUM5QyxPQUFPLEVBQUMseUJBQXlCLEVBQUUsMEJBQTBCLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUV6RixPQUFPLEVBQUMsZ0JBQWdCLEVBQUUsa0JBQWtCLEVBQUUscUJBQXFCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDckYsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLFlBQVksQ0FBQztBQUN0QyxPQUFPLEVBQUMsa0JBQWtCLEVBQUUsYUFBYSxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBQzFELE9BQU8sRUFBQyxjQUFjLEVBQUUsaUJBQWlCLEVBQUUsaUNBQWlDLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFDNUYsT0FBTyxFQUFtSixRQUFRLEVBQXVDLGFBQWEsRUFBRSxvQkFBb0IsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUM3UCxPQUFPLEVBQUMsSUFBSSxFQUFFLGVBQWUsRUFBRSxVQUFVLEVBQUUsaUJBQWlCLEVBQUUsWUFBWSxFQUFF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LElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNyRSxvQ0FBVyxHQUFYLFVBQVksSUFBUyxJQUFTLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3ZFLGlDQUFRLEdBQVIsVUFBUyxJQUFTLEVBQUUsS0FBYSxJQUFVLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMxRixxQkFBQztBQUFELENBQUMsQUF2S0QsSUF1S0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RGVidWdFbGVtZW50X19QUkVfUjNfXywgRGVidWdOb2RlX19QUkVfUjNfXywgRXZlbnRMaXN0ZW5lciwgZ2V0RGVidWdOb2RlLCBpbmRleERlYnVnTm9kZSwgcmVtb3ZlRGVidWdOb2RlRnJvbUluZGV4fSBmcm9tICcuLi9kZWJ1Zy9kZWJ1Z19ub2RlJztcbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4uL2RpJztcbmltcG9ydCB7SW5qZWN0YWJsZVR5cGV9IGZyb20gJy4uL2RpL2luamVjdGFibGUnO1xuaW1wb3J0IHtnZXRJbmplY3RhYmxlRGVmLCDOlEluamVjdGFibGVEZWZ9IGZyb20gJy4uL2RpL2ludGVyZmFjZS9kZWZzJztcbmltcG9ydCB7RXJyb3JIYW5kbGVyfSBmcm9tICcuLi9lcnJvcl9oYW5kbGVyJztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlL3R5cGUnO1xuaW1wb3J0IHtDb21wb25lbnRGYWN0b3J5fSBmcm9tICcuLi9saW5rZXIvY29tcG9uZW50X2ZhY3RvcnknO1xuaW1wb3J0IHtOZ01vZHVsZVJlZn0gZnJvbSAnLi4vbGlua2VyL25nX21vZHVsZV9mYWN0b3J5JztcbmltcG9ydCB7UmVuZGVyZXIyLCBSZW5kZXJlckZhY3RvcnkyLCBSZW5kZXJlclN0eWxlRmxhZ3MyLCBSZW5kZXJlclR5cGUyfSBmcm9tICcuLi9yZW5kZXIvYXBpJztcbmltcG9ydCB7U2FuaXRpemVyfSBmcm9tICcuLi9zYW5pdGl6YXRpb24vc2VjdXJpdHknO1xuaW1wb3J0IHtpc0Rldk1vZGV9IGZyb20gJy4uL3V0aWwvaXNfZGV2X21vZGUnO1xuaW1wb3J0IHtub3JtYWxpemVEZWJ1Z0JpbmRpbmdOYW1lLCBub3JtYWxpemVEZWJ1Z0JpbmRpbmdWYWx1ZX0gZnJvbSAnLi4vdXRpbC9uZ19yZWZsZWN0JztcblxuaW1wb3J0IHtpc1ZpZXdEZWJ1Z0Vycm9yLCB2aWV3RGVzdHJveWVkRXJyb3IsIHZpZXdXcmFwcGVkRGVidWdFcnJvcn0gZnJvbSAnLi9lcnJvcnMnO1xuaW1wb3J0IHtyZXNvbHZlRGVwfSBmcm9tICcuL3Byb3ZpZGVyJztcbmltcG9ydCB7ZGlydHlQYXJlbnRRdWVyaWVzLCBnZXRRdWVyeVZhbHVlfSBmcm9tICcuL3F1ZXJ5JztcbmltcG9ydCB7Y3JlYXRlSW5qZWN0b3IsIGNyZWF0ZU5nTW9kdWxlUmVmLCBnZXRDb21wb25lbnRWaWV3RGVmaW5pdGlvbkZhY3Rvcnl9IGZyb20gJy4vcmVmcyc7XG5pbXBvcnQge0FyZ3VtZW50VHlwZSwgQmluZGluZ0ZsYWdzLCBDaGVja1R5cGUsIERlYnVnQ29udGV4dCwgRWxlbWVudERhdGEsIE5nTW9kdWxlRGVmaW5pdGlvbiwgTm9kZURlZiwgTm9kZUZsYWdzLCBOb2RlTG9nZ2VyLCBQcm92aWRlck92ZXJyaWRlLCBSb290RGF0YSwgU2VydmljZXMsIFZpZXdEYXRhLCBWaWV3RGVmaW5pdGlvbiwgVmlld1N0YXRlLCBhc0VsZW1lbnREYXRhLCBhc1B1cmVFeHByZXNzaW9uRGF0YX0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQge05PT1AsIGlzQ29tcG9uZW50VmlldywgcmVuZGVyTm9kZSwgcmVzb2x2ZURlZmluaXRpb24sIHNwbGl0RGVwc0RzbCwgdG9rZW5LZXksIHZpZXdQYXJlbnRFbH0gZnJvbSAnLi91dGlsJztcbmltcG9ydCB7Y2hlY2tBbmRVcGRhdGVOb2RlLCBjaGVja0FuZFVwZGF0ZVZpZXcsIGNoZWNrTm9DaGFuZ2VzTm9kZSwgY2hlY2tOb0NoYW5nZXNWaWV3LCBjcmVhdGVDb21wb25lbnRWaWV3LCBjcmVhdGVFbWJlZGRlZFZpZXcsIGNyZWF0ZVJvb3RWaWV3LCBkZXN0cm95Vmlld30gZnJvbSAnLi92aWV3JztcblxuXG5sZXQgaW5pdGlhbGl6ZWQgPSBmYWxzZTtcblxuZXhwb3J0IGZ1bmN0aW9uIGluaXRTZXJ2aWNlc0lmTmVlZGVkKCkge1xuICBpZiAoaW5pdGlhbGl6ZWQpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgaW5pdGlhbGl6ZWQgPSB0cnVlO1xuICBjb25zdCBzZXJ2aWNlcyA9IGlzRGV2TW9kZSgpID8gY3JlYXRlRGVidWdTZXJ2aWNlcygpIDogY3JlYXRlUHJvZFNlcnZpY2VzKCk7XG4gIFNlcnZpY2VzLnNldEN1cnJlbnROb2RlID0gc2VydmljZXMuc2V0Q3VycmVudE5vZGU7XG4gIFNlcnZpY2VzLmNyZWF0ZVJvb3RWaWV3ID0gc2VydmljZXMuY3JlYXRlUm9vdFZpZXc7XG4gIFNlcnZpY2VzLmNyZWF0ZUVtYmVkZGVkVmlldyA9IHNlcnZpY2VzLmNyZWF0ZUVtYmVkZGVkVmlldztcbiAgU2VydmljZXMuY3JlYXRlQ29tcG9uZW50VmlldyA9IHNlcnZpY2VzLmNyZWF0ZUNvbXBvbmVudFZpZXc7XG4gIFNlcnZpY2VzLmNyZWF0ZU5nTW9kdWxlUmVmID0gc2VydmljZXMuY3JlYXRlTmdNb2R1bGVSZWY7XG4gIFNlcnZpY2VzLm92ZXJyaWRlUHJvdmlkZXIgPSBzZXJ2aWNlcy5vdmVycmlkZVByb3ZpZGVyO1xuICBTZXJ2aWNlcy5vdmVycmlkZUNvbXBvbmVudFZpZXcgPSBzZXJ2aWNlcy5vdmVycmlkZUNvbXBvbmVudFZpZXc7XG4gIFNlcnZpY2VzLmNsZWFyT3ZlcnJpZGVzID0gc2VydmljZXMuY2xlYXJPdmVycmlkZXM7XG4gIFNlcnZpY2VzLmNoZWNrQW5kVXBkYXRlVmlldyA9IHNlcnZpY2VzLmNoZWNrQW5kVXBkYXRlVmlldztcbiAgU2VydmljZXMuY2hlY2tOb0NoYW5nZXNWaWV3ID0gc2VydmljZXMuY2hlY2tOb0NoYW5nZXNWaWV3O1xuICBTZXJ2aWNlcy5kZXN0cm95VmlldyA9IHNlcnZpY2VzLmRlc3Ryb3lWaWV3O1xuICBTZXJ2aWNlcy5yZXNvbHZlRGVwID0gcmVzb2x2ZURlcDtcbiAgU2VydmljZXMuY3JlYXRlRGVidWdDb250ZXh0ID0gc2VydmljZXMuY3JlYXRlRGVidWdDb250ZXh0O1xuICBTZXJ2aWNlcy5oYW5kbGVFdmVudCA9IHNlcnZpY2VzLmhhbmRsZUV2ZW50O1xuICBTZXJ2aWNlcy51cGRhdGVEaXJlY3RpdmVzID0gc2VydmljZXMudXBkYXRlRGlyZWN0aXZlcztcbiAgU2VydmljZXMudXBkYXRlUmVuZGVyZXIgPSBzZXJ2aWNlcy51cGRhdGVSZW5kZXJlcjtcbiAgU2VydmljZXMuZGlydHlQYXJlbnRRdWVyaWVzID0gZGlydHlQYXJlbnRRdWVyaWVzO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVQcm9kU2VydmljZXMoKSB7XG4gIHJldHVybiB7XG4gICAgc2V0Q3VycmVudE5vZGU6ICgpID0+IHt9LFxuICAgIGNyZWF0ZVJvb3RWaWV3OiBjcmVhdGVQcm9kUm9vdFZpZXcsXG4gICAgY3JlYXRlRW1iZWRkZWRWaWV3OiBjcmVhdGVFbWJlZGRlZFZpZXcsXG4gICAgY3JlYXRlQ29tcG9uZW50VmlldzogY3JlYXRlQ29tcG9uZW50VmlldyxcbiAgICBjcmVhdGVOZ01vZHVsZVJlZjogY3JlYXRlTmdNb2R1bGVSZWYsXG4gICAgb3ZlcnJpZGVQcm92aWRlcjogTk9PUCxcbiAgICBvdmVycmlkZUNvbXBvbmVudFZpZXc6IE5PT1AsXG4gICAgY2xlYXJPdmVycmlkZXM6IE5PT1AsXG4gICAgY2hlY2tBbmRVcGRhdGVWaWV3OiBjaGVja0FuZFVwZGF0ZVZpZXcsXG4gICAgY2hlY2tOb0NoYW5nZXNWaWV3OiBjaGVja05vQ2hhbmdlc1ZpZXcsXG4gICAgZGVzdHJveVZpZXc6IGRlc3Ryb3lWaWV3LFxuICAgIGNyZWF0ZURlYnVnQ29udGV4dDogKHZpZXc6IFZpZXdEYXRhLCBub2RlSW5kZXg6IG51bWJlcikgPT4gbmV3IERlYnVnQ29udGV4dF8odmlldywgbm9kZUluZGV4KSxcbiAgICBoYW5kbGVFdmVudDogKHZpZXc6IFZpZXdEYXRhLCBub2RlSW5kZXg6IG51bWJlciwgZXZlbnROYW1lOiBzdHJpbmcsIGV2ZW50OiBhbnkpID0+XG4gICAgICAgICAgICAgICAgICAgICB2aWV3LmRlZi5oYW5kbGVFdmVudCh2aWV3LCBub2RlSW5kZXgsIGV2ZW50TmFtZSwgZXZlbnQpLFxuICAgIHVwZGF0ZURpcmVjdGl2ZXM6ICh2aWV3OiBWaWV3RGF0YSwgY2hlY2tUeXBlOiBDaGVja1R5cGUpID0+IHZpZXcuZGVmLnVwZGF0ZURpcmVjdGl2ZXMoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrVHlwZSA9PT0gQ2hlY2tUeXBlLkNoZWNrQW5kVXBkYXRlID8gcHJvZENoZWNrQW5kVXBkYXRlTm9kZSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZENoZWNrTm9DaGFuZ2VzTm9kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdmlldyksXG4gICAgdXBkYXRlUmVuZGVyZXI6ICh2aWV3OiBWaWV3RGF0YSwgY2hlY2tUeXBlOiBDaGVja1R5cGUpID0+IHZpZXcuZGVmLnVwZGF0ZVJlbmRlcmVyKFxuICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tUeXBlID09PSBDaGVja1R5cGUuQ2hlY2tBbmRVcGRhdGUgPyBwcm9kQ2hlY2tBbmRVcGRhdGVOb2RlIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZENoZWNrTm9DaGFuZ2VzTm9kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZpZXcpLFxuICB9O1xufVxuXG5mdW5jdGlvbiBjcmVhdGVEZWJ1Z1NlcnZpY2VzKCkge1xuICByZXR1cm4ge1xuICAgIHNldEN1cnJlbnROb2RlOiBkZWJ1Z1NldEN1cnJlbnROb2RlLFxuICAgIGNyZWF0ZVJvb3RWaWV3OiBkZWJ1Z0NyZWF0ZVJvb3RWaWV3LFxuICAgIGNyZWF0ZUVtYmVkZGVkVmlldzogZGVidWdDcmVhdGVFbWJlZGRlZFZpZXcsXG4gICAgY3JlYXRlQ29tcG9uZW50VmlldzogZGVidWdDcmVhdGVDb21wb25lbnRWaWV3LFxuICAgIGNyZWF0ZU5nTW9kdWxlUmVmOiBkZWJ1Z0NyZWF0ZU5nTW9kdWxlUmVmLFxuICAgIG92ZXJyaWRlUHJvdmlkZXI6IGRlYnVnT3ZlcnJpZGVQcm92aWRlcixcbiAgICBvdmVycmlkZUNvbXBvbmVudFZpZXc6IGRlYnVnT3ZlcnJpZGVDb21wb25lbnRWaWV3LFxuICAgIGNsZWFyT3ZlcnJpZGVzOiBkZWJ1Z0NsZWFyT3ZlcnJpZGVzLFxuICAgIGNoZWNrQW5kVXBkYXRlVmlldzogZGVidWdDaGVja0FuZFVwZGF0ZVZpZXcsXG4gICAgY2hlY2tOb0NoYW5nZXNWaWV3OiBkZWJ1Z0NoZWNrTm9DaGFuZ2VzVmlldyxcbiAgICBkZXN0cm95VmlldzogZGVidWdEZXN0cm95VmlldyxcbiAgICBjcmVhdGVEZWJ1Z0NvbnRleHQ6ICh2aWV3OiBWaWV3RGF0YSwgbm9kZUluZGV4OiBudW1iZXIpID0+IG5ldyBEZWJ1Z0NvbnRleHRfKHZpZXcsIG5vZGVJbmRleCksXG4gICAgaGFuZGxlRXZlbnQ6IGRlYnVnSGFuZGxlRXZlbnQsXG4gICAgdXBkYXRlRGlyZWN0aXZlczogZGVidWdVcGRhdGVEaXJlY3RpdmVzLFxuICAgIHVwZGF0ZVJlbmRlcmVyOiBkZWJ1Z1VwZGF0ZVJlbmRlcmVyLFxuICB9O1xufVxuXG5mdW5jdGlvbiBjcmVhdGVQcm9kUm9vdFZpZXcoXG4gICAgZWxJbmplY3RvcjogSW5qZWN0b3IsIHByb2plY3RhYmxlTm9kZXM6IGFueVtdW10sIHJvb3RTZWxlY3Rvck9yTm9kZTogc3RyaW5nIHwgYW55LFxuICAgIGRlZjogVmlld0RlZmluaXRpb24sIG5nTW9kdWxlOiBOZ01vZHVsZVJlZjxhbnk+LCBjb250ZXh0PzogYW55KTogVmlld0RhdGEge1xuICBjb25zdCByZW5kZXJlckZhY3Rvcnk6IFJlbmRlcmVyRmFjdG9yeTIgPSBuZ01vZHVsZS5pbmplY3Rvci5nZXQoUmVuZGVyZXJGYWN0b3J5Mik7XG4gIHJldHVybiBjcmVhdGVSb290VmlldyhcbiAgICAgIGNyZWF0ZVJvb3REYXRhKGVsSW5qZWN0b3IsIG5nTW9kdWxlLCByZW5kZXJlckZhY3RvcnksIHByb2plY3RhYmxlTm9kZXMsIHJvb3RTZWxlY3Rvck9yTm9kZSksXG4gICAgICBkZWYsIGNvbnRleHQpO1xufVxuXG5mdW5jdGlvbiBkZWJ1Z0NyZWF0ZVJvb3RWaWV3KFxuICAgIGVsSW5qZWN0b3I6IEluamVjdG9yLCBwcm9qZWN0YWJsZU5vZGVzOiBhbnlbXVtdLCByb290U2VsZWN0b3JPck5vZGU6IHN0cmluZyB8IGFueSxcbiAgICBkZWY6IFZpZXdEZWZpbml0aW9uLCBuZ01vZHVsZTogTmdNb2R1bGVSZWY8YW55PiwgY29udGV4dD86IGFueSk6IFZpZXdEYXRhIHtcbiAgY29uc3QgcmVuZGVyZXJGYWN0b3J5OiBSZW5kZXJlckZhY3RvcnkyID0gbmdNb2R1bGUuaW5qZWN0b3IuZ2V0KFJlbmRlcmVyRmFjdG9yeTIpO1xuICBjb25zdCByb290ID0gY3JlYXRlUm9vdERhdGEoXG4gICAgICBlbEluamVjdG9yLCBuZ01vZHVsZSwgbmV3IERlYnVnUmVuZGVyZXJGYWN0b3J5MihyZW5kZXJlckZhY3RvcnkpLCBwcm9qZWN0YWJsZU5vZGVzLFxuICAgICAgcm9vdFNlbGVjdG9yT3JOb2RlKTtcbiAgY29uc3QgZGVmV2l0aE92ZXJyaWRlID0gYXBwbHlQcm92aWRlck92ZXJyaWRlc1RvVmlldyhkZWYpO1xuICByZXR1cm4gY2FsbFdpdGhEZWJ1Z0NvbnRleHQoXG4gICAgICBEZWJ1Z0FjdGlvbi5jcmVhdGUsIGNyZWF0ZVJvb3RWaWV3LCBudWxsLCBbcm9vdCwgZGVmV2l0aE92ZXJyaWRlLCBjb250ZXh0XSk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVJvb3REYXRhKFxuICAgIGVsSW5qZWN0b3I6IEluamVjdG9yLCBuZ01vZHVsZTogTmdNb2R1bGVSZWY8YW55PiwgcmVuZGVyZXJGYWN0b3J5OiBSZW5kZXJlckZhY3RvcnkyLFxuICAgIHByb2plY3RhYmxlTm9kZXM6IGFueVtdW10sIHJvb3RTZWxlY3Rvck9yTm9kZTogYW55KTogUm9vdERhdGEge1xuICBjb25zdCBzYW5pdGl6ZXIgPSBuZ01vZHVsZS5pbmplY3Rvci5nZXQoU2FuaXRpemVyKTtcbiAgY29uc3QgZXJyb3JIYW5kbGVyID0gbmdNb2R1bGUuaW5qZWN0b3IuZ2V0KEVycm9ySGFuZGxlcik7XG4gIGNvbnN0IHJlbmRlcmVyID0gcmVuZGVyZXJGYWN0b3J5LmNyZWF0ZVJlbmRlcmVyKG51bGwsIG51bGwpO1xuICByZXR1cm4ge1xuICAgIG5nTW9kdWxlLFxuICAgIGluamVjdG9yOiBlbEluamVjdG9yLCBwcm9qZWN0YWJsZU5vZGVzLFxuICAgIHNlbGVjdG9yT3JOb2RlOiByb290U2VsZWN0b3JPck5vZGUsIHNhbml0aXplciwgcmVuZGVyZXJGYWN0b3J5LCByZW5kZXJlciwgZXJyb3JIYW5kbGVyXG4gIH07XG59XG5cbmZ1bmN0aW9uIGRlYnVnQ3JlYXRlRW1iZWRkZWRWaWV3KFxuICAgIHBhcmVudFZpZXc6IFZpZXdEYXRhLCBhbmNob3JEZWY6IE5vZGVEZWYsIHZpZXdEZWY6IFZpZXdEZWZpbml0aW9uLCBjb250ZXh0PzogYW55KTogVmlld0RhdGEge1xuICBjb25zdCBkZWZXaXRoT3ZlcnJpZGUgPSBhcHBseVByb3ZpZGVyT3ZlcnJpZGVzVG9WaWV3KHZpZXdEZWYpO1xuICByZXR1cm4gY2FsbFdpdGhEZWJ1Z0NvbnRleHQoXG4gICAgICBEZWJ1Z0FjdGlvbi5jcmVhdGUsIGNyZWF0ZUVtYmVkZGVkVmlldywgbnVsbCxcbiAgICAgIFtwYXJlbnRWaWV3LCBhbmNob3JEZWYsIGRlZldpdGhPdmVycmlkZSwgY29udGV4dF0pO1xufVxuXG5mdW5jdGlvbiBkZWJ1Z0NyZWF0ZUNvbXBvbmVudFZpZXcoXG4gICAgcGFyZW50VmlldzogVmlld0RhdGEsIG5vZGVEZWY6IE5vZGVEZWYsIHZpZXdEZWY6IFZpZXdEZWZpbml0aW9uLCBob3N0RWxlbWVudDogYW55KTogVmlld0RhdGEge1xuICBjb25zdCBvdmVycmlkZUNvbXBvbmVudFZpZXcgPVxuICAgICAgdmlld0RlZk92ZXJyaWRlcy5nZXQobm9kZURlZi5lbGVtZW50ICEuY29tcG9uZW50UHJvdmlkZXIgIS5wcm92aWRlciAhLnRva2VuKTtcbiAgaWYgKG92ZXJyaWRlQ29tcG9uZW50Vmlldykge1xuICAgIHZpZXdEZWYgPSBvdmVycmlkZUNvbXBvbmVudFZpZXc7XG4gIH0gZWxzZSB7XG4gICAgdmlld0RlZiA9IGFwcGx5UHJvdmlkZXJPdmVycmlkZXNUb1ZpZXcodmlld0RlZik7XG4gIH1cbiAgcmV0dXJuIGNhbGxXaXRoRGVidWdDb250ZXh0KFxuICAgICAgRGVidWdBY3Rpb24uY3JlYXRlLCBjcmVhdGVDb21wb25lbnRWaWV3LCBudWxsLCBbcGFyZW50Vmlldywgbm9kZURlZiwgdmlld0RlZiwgaG9zdEVsZW1lbnRdKTtcbn1cblxuZnVuY3Rpb24gZGVidWdDcmVhdGVOZ01vZHVsZVJlZihcbiAgICBtb2R1bGVUeXBlOiBUeXBlPGFueT4sIHBhcmVudEluamVjdG9yOiBJbmplY3RvciwgYm9vdHN0cmFwQ29tcG9uZW50czogVHlwZTxhbnk+W10sXG4gICAgZGVmOiBOZ01vZHVsZURlZmluaXRpb24pOiBOZ01vZHVsZVJlZjxhbnk+IHtcbiAgY29uc3QgZGVmV2l0aE92ZXJyaWRlID0gYXBwbHlQcm92aWRlck92ZXJyaWRlc1RvTmdNb2R1bGUoZGVmKTtcbiAgcmV0dXJuIGNyZWF0ZU5nTW9kdWxlUmVmKG1vZHVsZVR5cGUsIHBhcmVudEluamVjdG9yLCBib290c3RyYXBDb21wb25lbnRzLCBkZWZXaXRoT3ZlcnJpZGUpO1xufVxuXG5jb25zdCBwcm92aWRlck92ZXJyaWRlcyA9IG5ldyBNYXA8YW55LCBQcm92aWRlck92ZXJyaWRlPigpO1xuY29uc3QgcHJvdmlkZXJPdmVycmlkZXNXaXRoU2NvcGUgPSBuZXcgTWFwPEluamVjdGFibGVUeXBlPGFueT4sIFByb3ZpZGVyT3ZlcnJpZGU+KCk7XG5jb25zdCB2aWV3RGVmT3ZlcnJpZGVzID0gbmV3IE1hcDxhbnksIFZpZXdEZWZpbml0aW9uPigpO1xuXG5mdW5jdGlvbiBkZWJ1Z092ZXJyaWRlUHJvdmlkZXIob3ZlcnJpZGU6IFByb3ZpZGVyT3ZlcnJpZGUpIHtcbiAgcHJvdmlkZXJPdmVycmlkZXMuc2V0KG92ZXJyaWRlLnRva2VuLCBvdmVycmlkZSk7XG4gIGxldCBpbmplY3RhYmxlRGVmOiDOlEluamVjdGFibGVEZWY8YW55PnxudWxsO1xuICBpZiAodHlwZW9mIG92ZXJyaWRlLnRva2VuID09PSAnZnVuY3Rpb24nICYmIChpbmplY3RhYmxlRGVmID0gZ2V0SW5qZWN0YWJsZURlZihvdmVycmlkZS50b2tlbikpICYmXG4gICAgICB0eXBlb2YgaW5qZWN0YWJsZURlZi5wcm92aWRlZEluID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcHJvdmlkZXJPdmVycmlkZXNXaXRoU2NvcGUuc2V0KG92ZXJyaWRlLnRva2VuIGFzIEluamVjdGFibGVUeXBlPGFueT4sIG92ZXJyaWRlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBkZWJ1Z092ZXJyaWRlQ29tcG9uZW50Vmlldyhjb21wOiBhbnksIGNvbXBGYWN0b3J5OiBDb21wb25lbnRGYWN0b3J5PGFueT4pIHtcbiAgY29uc3QgaG9zdFZpZXdEZWYgPSByZXNvbHZlRGVmaW5pdGlvbihnZXRDb21wb25lbnRWaWV3RGVmaW5pdGlvbkZhY3RvcnkoY29tcEZhY3RvcnkpKTtcbiAgY29uc3QgY29tcFZpZXdEZWYgPSByZXNvbHZlRGVmaW5pdGlvbihob3N0Vmlld0RlZi5ub2Rlc1swXS5lbGVtZW50ICEuY29tcG9uZW50VmlldyAhKTtcbiAgdmlld0RlZk92ZXJyaWRlcy5zZXQoY29tcCwgY29tcFZpZXdEZWYpO1xufVxuXG5mdW5jdGlvbiBkZWJ1Z0NsZWFyT3ZlcnJpZGVzKCkge1xuICBwcm92aWRlck92ZXJyaWRlcy5jbGVhcigpO1xuICBwcm92aWRlck92ZXJyaWRlc1dpdGhTY29wZS5jbGVhcigpO1xuICB2aWV3RGVmT3ZlcnJpZGVzLmNsZWFyKCk7XG59XG5cbi8vIE5vdGVzIGFib3V0IHRoZSBhbGdvcml0aG06XG4vLyAxKSBMb2NhdGUgdGhlIHByb3ZpZGVycyBvZiBhbiBlbGVtZW50IGFuZCBjaGVjayBpZiBvbmUgb2YgdGhlbSB3YXMgb3ZlcndyaXR0ZW5cbi8vIDIpIENoYW5nZSB0aGUgcHJvdmlkZXJzIG9mIHRoYXQgZWxlbWVudFxuLy9cbi8vIFdlIG9ubHkgY3JlYXRlIG5ldyBkYXRhc3RydWN0dXJlcyBpZiB3ZSBuZWVkIHRvLCB0byBrZWVwIHBlcmYgaW1wYWN0XG4vLyByZWFzb25hYmxlLlxuZnVuY3Rpb24gYXBwbHlQcm92aWRlck92ZXJyaWRlc1RvVmlldyhkZWY6IFZpZXdEZWZpbml0aW9uKTogVmlld0RlZmluaXRpb24ge1xuICBpZiAocHJvdmlkZXJPdmVycmlkZXMuc2l6ZSA9PT0gMCkge1xuICAgIHJldHVybiBkZWY7XG4gIH1cbiAgY29uc3QgZWxlbWVudEluZGljZXNXaXRoT3ZlcndyaXR0ZW5Qcm92aWRlcnMgPSBmaW5kRWxlbWVudEluZGljZXNXaXRoT3ZlcndyaXR0ZW5Qcm92aWRlcnMoZGVmKTtcbiAgaWYgKGVsZW1lbnRJbmRpY2VzV2l0aE92ZXJ3cml0dGVuUHJvdmlkZXJzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBkZWY7XG4gIH1cbiAgLy8gY2xvbmUgdGhlIHdob2xlIHZpZXcgZGVmaW5pdGlvbixcbiAgLy8gYXMgaXQgbWFpbnRhaW5zIHJlZmVyZW5jZXMgYmV0d2VlbiB0aGUgbm9kZXMgdGhhdCBhcmUgaGFyZCB0byB1cGRhdGUuXG4gIGRlZiA9IGRlZi5mYWN0b3J5ICEoKCkgPT4gTk9PUCk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZWxlbWVudEluZGljZXNXaXRoT3ZlcndyaXR0ZW5Qcm92aWRlcnMubGVuZ3RoOyBpKyspIHtcbiAgICBhcHBseVByb3ZpZGVyT3ZlcnJpZGVzVG9FbGVtZW50KGRlZiwgZWxlbWVudEluZGljZXNXaXRoT3ZlcndyaXR0ZW5Qcm92aWRlcnNbaV0pO1xuICB9XG4gIHJldHVybiBkZWY7XG5cbiAgZnVuY3Rpb24gZmluZEVsZW1lbnRJbmRpY2VzV2l0aE92ZXJ3cml0dGVuUHJvdmlkZXJzKGRlZjogVmlld0RlZmluaXRpb24pOiBudW1iZXJbXSB7XG4gICAgY29uc3QgZWxJbmRpY2VzV2l0aE92ZXJ3cml0dGVuUHJvdmlkZXJzOiBudW1iZXJbXSA9IFtdO1xuICAgIGxldCBsYXN0RWxlbWVudERlZjogTm9kZURlZnxudWxsID0gbnVsbDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRlZi5ub2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3Qgbm9kZURlZiA9IGRlZi5ub2Rlc1tpXTtcbiAgICAgIGlmIChub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLlR5cGVFbGVtZW50KSB7XG4gICAgICAgIGxhc3RFbGVtZW50RGVmID0gbm9kZURlZjtcbiAgICAgIH1cbiAgICAgIGlmIChsYXN0RWxlbWVudERlZiAmJiBub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLkNhdFByb3ZpZGVyTm9EaXJlY3RpdmUgJiZcbiAgICAgICAgICBwcm92aWRlck92ZXJyaWRlcy5oYXMobm9kZURlZi5wcm92aWRlciAhLnRva2VuKSkge1xuICAgICAgICBlbEluZGljZXNXaXRoT3ZlcndyaXR0ZW5Qcm92aWRlcnMucHVzaChsYXN0RWxlbWVudERlZiAhLm5vZGVJbmRleCk7XG4gICAgICAgIGxhc3RFbGVtZW50RGVmID0gbnVsbDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGVsSW5kaWNlc1dpdGhPdmVyd3JpdHRlblByb3ZpZGVycztcbiAgfVxuXG4gIGZ1bmN0aW9uIGFwcGx5UHJvdmlkZXJPdmVycmlkZXNUb0VsZW1lbnQodmlld0RlZjogVmlld0RlZmluaXRpb24sIGVsSW5kZXg6IG51bWJlcikge1xuICAgIGZvciAobGV0IGkgPSBlbEluZGV4ICsgMTsgaSA8IHZpZXdEZWYubm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IG5vZGVEZWYgPSB2aWV3RGVmLm5vZGVzW2ldO1xuICAgICAgaWYgKG5vZGVEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuVHlwZUVsZW1lbnQpIHtcbiAgICAgICAgLy8gc3RvcCBhdCB0aGUgbmV4dCBlbGVtZW50XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmIChub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLkNhdFByb3ZpZGVyTm9EaXJlY3RpdmUpIHtcbiAgICAgICAgY29uc3QgcHJvdmlkZXIgPSBub2RlRGVmLnByb3ZpZGVyICE7XG4gICAgICAgIGNvbnN0IG92ZXJyaWRlID0gcHJvdmlkZXJPdmVycmlkZXMuZ2V0KHByb3ZpZGVyLnRva2VuKTtcbiAgICAgICAgaWYgKG92ZXJyaWRlKSB7XG4gICAgICAgICAgbm9kZURlZi5mbGFncyA9IChub2RlRGVmLmZsYWdzICYgfk5vZGVGbGFncy5DYXRQcm92aWRlck5vRGlyZWN0aXZlKSB8IG92ZXJyaWRlLmZsYWdzO1xuICAgICAgICAgIHByb3ZpZGVyLmRlcHMgPSBzcGxpdERlcHNEc2wob3ZlcnJpZGUuZGVwcyk7XG4gICAgICAgICAgcHJvdmlkZXIudmFsdWUgPSBvdmVycmlkZS52YWx1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vLyBOb3RlcyBhYm91dCB0aGUgYWxnb3JpdGhtOlxuLy8gV2Ugb25seSBjcmVhdGUgbmV3IGRhdGFzdHJ1Y3R1cmVzIGlmIHdlIG5lZWQgdG8sIHRvIGtlZXAgcGVyZiBpbXBhY3Rcbi8vIHJlYXNvbmFibGUuXG5mdW5jdGlvbiBhcHBseVByb3ZpZGVyT3ZlcnJpZGVzVG9OZ01vZHVsZShkZWY6IE5nTW9kdWxlRGVmaW5pdGlvbik6IE5nTW9kdWxlRGVmaW5pdGlvbiB7XG4gIGNvbnN0IHtoYXNPdmVycmlkZXMsIGhhc0RlcHJlY2F0ZWRPdmVycmlkZXN9ID0gY2FsY0hhc092ZXJyaWRlcyhkZWYpO1xuICBpZiAoIWhhc092ZXJyaWRlcykge1xuICAgIHJldHVybiBkZWY7XG4gIH1cbiAgLy8gY2xvbmUgdGhlIHdob2xlIHZpZXcgZGVmaW5pdGlvbixcbiAgLy8gYXMgaXQgbWFpbnRhaW5zIHJlZmVyZW5jZXMgYmV0d2VlbiB0aGUgbm9kZXMgdGhhdCBhcmUgaGFyZCB0byB1cGRhdGUuXG4gIGRlZiA9IGRlZi5mYWN0b3J5ICEoKCkgPT4gTk9PUCk7XG4gIGFwcGx5UHJvdmlkZXJPdmVycmlkZXMoZGVmKTtcbiAgcmV0dXJuIGRlZjtcblxuICBmdW5jdGlvbiBjYWxjSGFzT3ZlcnJpZGVzKGRlZjogTmdNb2R1bGVEZWZpbml0aW9uKTpcbiAgICAgIHtoYXNPdmVycmlkZXM6IGJvb2xlYW4sIGhhc0RlcHJlY2F0ZWRPdmVycmlkZXM6IGJvb2xlYW59IHtcbiAgICBsZXQgaGFzT3ZlcnJpZGVzID0gZmFsc2U7XG4gICAgbGV0IGhhc0RlcHJlY2F0ZWRPdmVycmlkZXMgPSBmYWxzZTtcbiAgICBpZiAocHJvdmlkZXJPdmVycmlkZXMuc2l6ZSA9PT0gMCkge1xuICAgICAgcmV0dXJuIHtoYXNPdmVycmlkZXMsIGhhc0RlcHJlY2F0ZWRPdmVycmlkZXN9O1xuICAgIH1cbiAgICBkZWYucHJvdmlkZXJzLmZvckVhY2gobm9kZSA9PiB7XG4gICAgICBjb25zdCBvdmVycmlkZSA9IHByb3ZpZGVyT3ZlcnJpZGVzLmdldChub2RlLnRva2VuKTtcbiAgICAgIGlmICgobm9kZS5mbGFncyAmIE5vZGVGbGFncy5DYXRQcm92aWRlck5vRGlyZWN0aXZlKSAmJiBvdmVycmlkZSkge1xuICAgICAgICBoYXNPdmVycmlkZXMgPSB0cnVlO1xuICAgICAgICBoYXNEZXByZWNhdGVkT3ZlcnJpZGVzID0gaGFzRGVwcmVjYXRlZE92ZXJyaWRlcyB8fCBvdmVycmlkZS5kZXByZWNhdGVkQmVoYXZpb3I7XG4gICAgICB9XG4gICAgfSk7XG4gICAgZGVmLm1vZHVsZXMuZm9yRWFjaChtb2R1bGUgPT4ge1xuICAgICAgcHJvdmlkZXJPdmVycmlkZXNXaXRoU2NvcGUuZm9yRWFjaCgob3ZlcnJpZGUsIHRva2VuKSA9PiB7XG4gICAgICAgIGlmIChnZXRJbmplY3RhYmxlRGVmKHRva2VuKSAhLnByb3ZpZGVkSW4gPT09IG1vZHVsZSkge1xuICAgICAgICAgIGhhc092ZXJyaWRlcyA9IHRydWU7XG4gICAgICAgICAgaGFzRGVwcmVjYXRlZE92ZXJyaWRlcyA9IGhhc0RlcHJlY2F0ZWRPdmVycmlkZXMgfHwgb3ZlcnJpZGUuZGVwcmVjYXRlZEJlaGF2aW9yO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICByZXR1cm4ge2hhc092ZXJyaWRlcywgaGFzRGVwcmVjYXRlZE92ZXJyaWRlc307XG4gIH1cblxuICBmdW5jdGlvbiBhcHBseVByb3ZpZGVyT3ZlcnJpZGVzKGRlZjogTmdNb2R1bGVEZWZpbml0aW9uKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkZWYucHJvdmlkZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBwcm92aWRlciA9IGRlZi5wcm92aWRlcnNbaV07XG4gICAgICBpZiAoaGFzRGVwcmVjYXRlZE92ZXJyaWRlcykge1xuICAgICAgICAvLyBXZSBoYWQgYSBidWcgd2hlcmUgbWUgbWFkZVxuICAgICAgICAvLyBhbGwgcHJvdmlkZXJzIGxhenkuIEtlZXAgdGhpcyBsb2dpYyBiZWhpbmQgYSBmbGFnXG4gICAgICAgIC8vIGZvciBtaWdyYXRpbmcgZXhpc3RpbmcgdXNlcnMuXG4gICAgICAgIHByb3ZpZGVyLmZsYWdzIHw9IE5vZGVGbGFncy5MYXp5UHJvdmlkZXI7XG4gICAgICB9XG4gICAgICBjb25zdCBvdmVycmlkZSA9IHByb3ZpZGVyT3ZlcnJpZGVzLmdldChwcm92aWRlci50b2tlbik7XG4gICAgICBpZiAob3ZlcnJpZGUpIHtcbiAgICAgICAgcHJvdmlkZXIuZmxhZ3MgPSAocHJvdmlkZXIuZmxhZ3MgJiB+Tm9kZUZsYWdzLkNhdFByb3ZpZGVyTm9EaXJlY3RpdmUpIHwgb3ZlcnJpZGUuZmxhZ3M7XG4gICAgICAgIHByb3ZpZGVyLmRlcHMgPSBzcGxpdERlcHNEc2wob3ZlcnJpZGUuZGVwcyk7XG4gICAgICAgIHByb3ZpZGVyLnZhbHVlID0gb3ZlcnJpZGUudmFsdWU7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChwcm92aWRlck92ZXJyaWRlc1dpdGhTY29wZS5zaXplID4gMCkge1xuICAgICAgbGV0IG1vZHVsZVNldCA9IG5ldyBTZXQ8YW55PihkZWYubW9kdWxlcyk7XG4gICAgICBwcm92aWRlck92ZXJyaWRlc1dpdGhTY29wZS5mb3JFYWNoKChvdmVycmlkZSwgdG9rZW4pID0+IHtcbiAgICAgICAgaWYgKG1vZHVsZVNldC5oYXMoZ2V0SW5qZWN0YWJsZURlZih0b2tlbikgIS5wcm92aWRlZEluKSkge1xuICAgICAgICAgIGxldCBwcm92aWRlciA9IHtcbiAgICAgICAgICAgIHRva2VuOiB0b2tlbixcbiAgICAgICAgICAgIGZsYWdzOlxuICAgICAgICAgICAgICAgIG92ZXJyaWRlLmZsYWdzIHwgKGhhc0RlcHJlY2F0ZWRPdmVycmlkZXMgPyBOb2RlRmxhZ3MuTGF6eVByb3ZpZGVyIDogTm9kZUZsYWdzLk5vbmUpLFxuICAgICAgICAgICAgZGVwczogc3BsaXREZXBzRHNsKG92ZXJyaWRlLmRlcHMpLFxuICAgICAgICAgICAgdmFsdWU6IG92ZXJyaWRlLnZhbHVlLFxuICAgICAgICAgICAgaW5kZXg6IGRlZi5wcm92aWRlcnMubGVuZ3RoLFxuICAgICAgICAgIH07XG4gICAgICAgICAgZGVmLnByb3ZpZGVycy5wdXNoKHByb3ZpZGVyKTtcbiAgICAgICAgICBkZWYucHJvdmlkZXJzQnlLZXlbdG9rZW5LZXkodG9rZW4pXSA9IHByb3ZpZGVyO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gcHJvZENoZWNrQW5kVXBkYXRlTm9kZShcbiAgICB2aWV3OiBWaWV3RGF0YSwgY2hlY2tJbmRleDogbnVtYmVyLCBhcmdTdHlsZTogQXJndW1lbnRUeXBlLCB2MD86IGFueSwgdjE/OiBhbnksIHYyPzogYW55LFxuICAgIHYzPzogYW55LCB2ND86IGFueSwgdjU/OiBhbnksIHY2PzogYW55LCB2Nz86IGFueSwgdjg/OiBhbnksIHY5PzogYW55KTogYW55IHtcbiAgY29uc3Qgbm9kZURlZiA9IHZpZXcuZGVmLm5vZGVzW2NoZWNrSW5kZXhdO1xuICBjaGVja0FuZFVwZGF0ZU5vZGUodmlldywgbm9kZURlZiwgYXJnU3R5bGUsIHYwLCB2MSwgdjIsIHYzLCB2NCwgdjUsIHY2LCB2NywgdjgsIHY5KTtcbiAgcmV0dXJuIChub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLkNhdFB1cmVFeHByZXNzaW9uKSA/XG4gICAgICBhc1B1cmVFeHByZXNzaW9uRGF0YSh2aWV3LCBjaGVja0luZGV4KS52YWx1ZSA6XG4gICAgICB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIHByb2RDaGVja05vQ2hhbmdlc05vZGUoXG4gICAgdmlldzogVmlld0RhdGEsIGNoZWNrSW5kZXg6IG51bWJlciwgYXJnU3R5bGU6IEFyZ3VtZW50VHlwZSwgdjA/OiBhbnksIHYxPzogYW55LCB2Mj86IGFueSxcbiAgICB2Mz86IGFueSwgdjQ/OiBhbnksIHY1PzogYW55LCB2Nj86IGFueSwgdjc/OiBhbnksIHY4PzogYW55LCB2OT86IGFueSk6IGFueSB7XG4gIGNvbnN0IG5vZGVEZWYgPSB2aWV3LmRlZi5ub2Rlc1tjaGVja0luZGV4XTtcbiAgY2hlY2tOb0NoYW5nZXNOb2RlKHZpZXcsIG5vZGVEZWYsIGFyZ1N0eWxlLCB2MCwgdjEsIHYyLCB2MywgdjQsIHY1LCB2NiwgdjcsIHY4LCB2OSk7XG4gIHJldHVybiAobm9kZURlZi5mbGFncyAmIE5vZGVGbGFncy5DYXRQdXJlRXhwcmVzc2lvbikgP1xuICAgICAgYXNQdXJlRXhwcmVzc2lvbkRhdGEodmlldywgY2hlY2tJbmRleCkudmFsdWUgOlxuICAgICAgdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBkZWJ1Z0NoZWNrQW5kVXBkYXRlVmlldyh2aWV3OiBWaWV3RGF0YSkge1xuICByZXR1cm4gY2FsbFdpdGhEZWJ1Z0NvbnRleHQoRGVidWdBY3Rpb24uZGV0ZWN0Q2hhbmdlcywgY2hlY2tBbmRVcGRhdGVWaWV3LCBudWxsLCBbdmlld10pO1xufVxuXG5mdW5jdGlvbiBkZWJ1Z0NoZWNrTm9DaGFuZ2VzVmlldyh2aWV3OiBWaWV3RGF0YSkge1xuICByZXR1cm4gY2FsbFdpdGhEZWJ1Z0NvbnRleHQoRGVidWdBY3Rpb24uY2hlY2tOb0NoYW5nZXMsIGNoZWNrTm9DaGFuZ2VzVmlldywgbnVsbCwgW3ZpZXddKTtcbn1cblxuZnVuY3Rpb24gZGVidWdEZXN0cm95Vmlldyh2aWV3OiBWaWV3RGF0YSkge1xuICByZXR1cm4gY2FsbFdpdGhEZWJ1Z0NvbnRleHQoRGVidWdBY3Rpb24uZGVzdHJveSwgZGVzdHJveVZpZXcsIG51bGwsIFt2aWV3XSk7XG59XG5cbmVudW0gRGVidWdBY3Rpb24ge1xuICBjcmVhdGUsXG4gIGRldGVjdENoYW5nZXMsXG4gIGNoZWNrTm9DaGFuZ2VzLFxuICBkZXN0cm95LFxuICBoYW5kbGVFdmVudFxufVxuXG5sZXQgX2N1cnJlbnRBY3Rpb246IERlYnVnQWN0aW9uO1xubGV0IF9jdXJyZW50VmlldzogVmlld0RhdGE7XG5sZXQgX2N1cnJlbnROb2RlSW5kZXg6IG51bWJlcnxudWxsO1xuXG5mdW5jdGlvbiBkZWJ1Z1NldEN1cnJlbnROb2RlKHZpZXc6IFZpZXdEYXRhLCBub2RlSW5kZXg6IG51bWJlciB8IG51bGwpIHtcbiAgX2N1cnJlbnRWaWV3ID0gdmlldztcbiAgX2N1cnJlbnROb2RlSW5kZXggPSBub2RlSW5kZXg7XG59XG5cbmZ1bmN0aW9uIGRlYnVnSGFuZGxlRXZlbnQodmlldzogVmlld0RhdGEsIG5vZGVJbmRleDogbnVtYmVyLCBldmVudE5hbWU6IHN0cmluZywgZXZlbnQ6IGFueSkge1xuICBkZWJ1Z1NldEN1cnJlbnROb2RlKHZpZXcsIG5vZGVJbmRleCk7XG4gIHJldHVybiBjYWxsV2l0aERlYnVnQ29udGV4dChcbiAgICAgIERlYnVnQWN0aW9uLmhhbmRsZUV2ZW50LCB2aWV3LmRlZi5oYW5kbGVFdmVudCwgbnVsbCwgW3ZpZXcsIG5vZGVJbmRleCwgZXZlbnROYW1lLCBldmVudF0pO1xufVxuXG5mdW5jdGlvbiBkZWJ1Z1VwZGF0ZURpcmVjdGl2ZXModmlldzogVmlld0RhdGEsIGNoZWNrVHlwZTogQ2hlY2tUeXBlKSB7XG4gIGlmICh2aWV3LnN0YXRlICYgVmlld1N0YXRlLkRlc3Ryb3llZCkge1xuICAgIHRocm93IHZpZXdEZXN0cm95ZWRFcnJvcihEZWJ1Z0FjdGlvbltfY3VycmVudEFjdGlvbl0pO1xuICB9XG4gIGRlYnVnU2V0Q3VycmVudE5vZGUodmlldywgbmV4dERpcmVjdGl2ZVdpdGhCaW5kaW5nKHZpZXcsIDApKTtcbiAgcmV0dXJuIHZpZXcuZGVmLnVwZGF0ZURpcmVjdGl2ZXMoZGVidWdDaGVja0RpcmVjdGl2ZXNGbiwgdmlldyk7XG5cbiAgZnVuY3Rpb24gZGVidWdDaGVja0RpcmVjdGl2ZXNGbihcbiAgICAgIHZpZXc6IFZpZXdEYXRhLCBub2RlSW5kZXg6IG51bWJlciwgYXJnU3R5bGU6IEFyZ3VtZW50VHlwZSwgLi4udmFsdWVzOiBhbnlbXSkge1xuICAgIGNvbnN0IG5vZGVEZWYgPSB2aWV3LmRlZi5ub2Rlc1tub2RlSW5kZXhdO1xuICAgIGlmIChjaGVja1R5cGUgPT09IENoZWNrVHlwZS5DaGVja0FuZFVwZGF0ZSkge1xuICAgICAgZGVidWdDaGVja0FuZFVwZGF0ZU5vZGUodmlldywgbm9kZURlZiwgYXJnU3R5bGUsIHZhbHVlcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlYnVnQ2hlY2tOb0NoYW5nZXNOb2RlKHZpZXcsIG5vZGVEZWYsIGFyZ1N0eWxlLCB2YWx1ZXMpO1xuICAgIH1cbiAgICBpZiAobm9kZURlZi5mbGFncyAmIE5vZGVGbGFncy5UeXBlRGlyZWN0aXZlKSB7XG4gICAgICBkZWJ1Z1NldEN1cnJlbnROb2RlKHZpZXcsIG5leHREaXJlY3RpdmVXaXRoQmluZGluZyh2aWV3LCBub2RlSW5kZXgpKTtcbiAgICB9XG4gICAgcmV0dXJuIChub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLkNhdFB1cmVFeHByZXNzaW9uKSA/XG4gICAgICAgIGFzUHVyZUV4cHJlc3Npb25EYXRhKHZpZXcsIG5vZGVEZWYubm9kZUluZGV4KS52YWx1ZSA6XG4gICAgICAgIHVuZGVmaW5lZDtcbiAgfVxufVxuXG5mdW5jdGlvbiBkZWJ1Z1VwZGF0ZVJlbmRlcmVyKHZpZXc6IFZpZXdEYXRhLCBjaGVja1R5cGU6IENoZWNrVHlwZSkge1xuICBpZiAodmlldy5zdGF0ZSAmIFZpZXdTdGF0ZS5EZXN0cm95ZWQpIHtcbiAgICB0aHJvdyB2aWV3RGVzdHJveWVkRXJyb3IoRGVidWdBY3Rpb25bX2N1cnJlbnRBY3Rpb25dKTtcbiAgfVxuICBkZWJ1Z1NldEN1cnJlbnROb2RlKHZpZXcsIG5leHRSZW5kZXJOb2RlV2l0aEJpbmRpbmcodmlldywgMCkpO1xuICByZXR1cm4gdmlldy5kZWYudXBkYXRlUmVuZGVyZXIoZGVidWdDaGVja1JlbmRlck5vZGVGbiwgdmlldyk7XG5cbiAgZnVuY3Rpb24gZGVidWdDaGVja1JlbmRlck5vZGVGbihcbiAgICAgIHZpZXc6IFZpZXdEYXRhLCBub2RlSW5kZXg6IG51bWJlciwgYXJnU3R5bGU6IEFyZ3VtZW50VHlwZSwgLi4udmFsdWVzOiBhbnlbXSkge1xuICAgIGNvbnN0IG5vZGVEZWYgPSB2aWV3LmRlZi5ub2Rlc1tub2RlSW5kZXhdO1xuICAgIGlmIChjaGVja1R5cGUgPT09IENoZWNrVHlwZS5DaGVja0FuZFVwZGF0ZSkge1xuICAgICAgZGVidWdDaGVja0FuZFVwZGF0ZU5vZGUodmlldywgbm9kZURlZiwgYXJnU3R5bGUsIHZhbHVlcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlYnVnQ2hlY2tOb0NoYW5nZXNOb2RlKHZpZXcsIG5vZGVEZWYsIGFyZ1N0eWxlLCB2YWx1ZXMpO1xuICAgIH1cbiAgICBpZiAobm9kZURlZi5mbGFncyAmIE5vZGVGbGFncy5DYXRSZW5kZXJOb2RlKSB7XG4gICAgICBkZWJ1Z1NldEN1cnJlbnROb2RlKHZpZXcsIG5leHRSZW5kZXJOb2RlV2l0aEJpbmRpbmcodmlldywgbm9kZUluZGV4KSk7XG4gICAgfVxuICAgIHJldHVybiAobm9kZURlZi5mbGFncyAmIE5vZGVGbGFncy5DYXRQdXJlRXhwcmVzc2lvbikgP1xuICAgICAgICBhc1B1cmVFeHByZXNzaW9uRGF0YSh2aWV3LCBub2RlRGVmLm5vZGVJbmRleCkudmFsdWUgOlxuICAgICAgICB1bmRlZmluZWQ7XG4gIH1cbn1cblxuZnVuY3Rpb24gZGVidWdDaGVja0FuZFVwZGF0ZU5vZGUoXG4gICAgdmlldzogVmlld0RhdGEsIG5vZGVEZWY6IE5vZGVEZWYsIGFyZ1N0eWxlOiBBcmd1bWVudFR5cGUsIGdpdmVuVmFsdWVzOiBhbnlbXSk6IHZvaWQge1xuICBjb25zdCBjaGFuZ2VkID0gKDxhbnk+Y2hlY2tBbmRVcGRhdGVOb2RlKSh2aWV3LCBub2RlRGVmLCBhcmdTdHlsZSwgLi4uZ2l2ZW5WYWx1ZXMpO1xuICBpZiAoY2hhbmdlZCkge1xuICAgIGNvbnN0IHZhbHVlcyA9IGFyZ1N0eWxlID09PSBBcmd1bWVudFR5cGUuRHluYW1pYyA/IGdpdmVuVmFsdWVzWzBdIDogZ2l2ZW5WYWx1ZXM7XG4gICAgaWYgKG5vZGVEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuVHlwZURpcmVjdGl2ZSkge1xuICAgICAgY29uc3QgYmluZGluZ1ZhbHVlczoge1trZXk6IHN0cmluZ106IHN0cmluZ30gPSB7fTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbm9kZURlZi5iaW5kaW5ncy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBiaW5kaW5nID0gbm9kZURlZi5iaW5kaW5nc1tpXTtcbiAgICAgICAgY29uc3QgdmFsdWUgPSB2YWx1ZXNbaV07XG4gICAgICAgIGlmIChiaW5kaW5nLmZsYWdzICYgQmluZGluZ0ZsYWdzLlR5cGVQcm9wZXJ0eSkge1xuICAgICAgICAgIGJpbmRpbmdWYWx1ZXNbbm9ybWFsaXplRGVidWdCaW5kaW5nTmFtZShiaW5kaW5nLm5vbk1pbmlmaWVkTmFtZSAhKV0gPVxuICAgICAgICAgICAgICBub3JtYWxpemVEZWJ1Z0JpbmRpbmdWYWx1ZSh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGNvbnN0IGVsRGVmID0gbm9kZURlZi5wYXJlbnQgITtcbiAgICAgIGNvbnN0IGVsID0gYXNFbGVtZW50RGF0YSh2aWV3LCBlbERlZi5ub2RlSW5kZXgpLnJlbmRlckVsZW1lbnQ7XG4gICAgICBpZiAoIWVsRGVmLmVsZW1lbnQgIS5uYW1lKSB7XG4gICAgICAgIC8vIGEgY29tbWVudC5cbiAgICAgICAgdmlldy5yZW5kZXJlci5zZXRWYWx1ZShlbCwgYGJpbmRpbmdzPSR7SlNPTi5zdHJpbmdpZnkoYmluZGluZ1ZhbHVlcywgbnVsbCwgMil9YCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBhIHJlZ3VsYXIgZWxlbWVudC5cbiAgICAgICAgZm9yIChsZXQgYXR0ciBpbiBiaW5kaW5nVmFsdWVzKSB7XG4gICAgICAgICAgY29uc3QgdmFsdWUgPSBiaW5kaW5nVmFsdWVzW2F0dHJdO1xuICAgICAgICAgIGlmICh2YWx1ZSAhPSBudWxsKSB7XG4gICAgICAgICAgICB2aWV3LnJlbmRlcmVyLnNldEF0dHJpYnV0ZShlbCwgYXR0ciwgdmFsdWUpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2aWV3LnJlbmRlcmVyLnJlbW92ZUF0dHJpYnV0ZShlbCwgYXR0cik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGRlYnVnQ2hlY2tOb0NoYW5nZXNOb2RlKFxuICAgIHZpZXc6IFZpZXdEYXRhLCBub2RlRGVmOiBOb2RlRGVmLCBhcmdTdHlsZTogQXJndW1lbnRUeXBlLCB2YWx1ZXM6IGFueVtdKTogdm9pZCB7XG4gICg8YW55PmNoZWNrTm9DaGFuZ2VzTm9kZSkodmlldywgbm9kZURlZiwgYXJnU3R5bGUsIC4uLnZhbHVlcyk7XG59XG5cbmZ1bmN0aW9uIG5leHREaXJlY3RpdmVXaXRoQmluZGluZyh2aWV3OiBWaWV3RGF0YSwgbm9kZUluZGV4OiBudW1iZXIpOiBudW1iZXJ8bnVsbCB7XG4gIGZvciAobGV0IGkgPSBub2RlSW5kZXg7IGkgPCB2aWV3LmRlZi5ub2Rlcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IG5vZGVEZWYgPSB2aWV3LmRlZi5ub2Rlc1tpXTtcbiAgICBpZiAobm9kZURlZi5mbGFncyAmIE5vZGVGbGFncy5UeXBlRGlyZWN0aXZlICYmIG5vZGVEZWYuYmluZGluZ3MgJiYgbm9kZURlZi5iaW5kaW5ncy5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gbmV4dFJlbmRlck5vZGVXaXRoQmluZGluZyh2aWV3OiBWaWV3RGF0YSwgbm9kZUluZGV4OiBudW1iZXIpOiBudW1iZXJ8bnVsbCB7XG4gIGZvciAobGV0IGkgPSBub2RlSW5kZXg7IGkgPCB2aWV3LmRlZi5ub2Rlcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IG5vZGVEZWYgPSB2aWV3LmRlZi5ub2Rlc1tpXTtcbiAgICBpZiAoKG5vZGVEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuQ2F0UmVuZGVyTm9kZSkgJiYgbm9kZURlZi5iaW5kaW5ncyAmJiBub2RlRGVmLmJpbmRpbmdzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIGk7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5jbGFzcyBEZWJ1Z0NvbnRleHRfIGltcGxlbWVudHMgRGVidWdDb250ZXh0IHtcbiAgcHJpdmF0ZSBub2RlRGVmOiBOb2RlRGVmO1xuICBwcml2YXRlIGVsVmlldzogVmlld0RhdGE7XG4gIHByaXZhdGUgZWxEZWY6IE5vZGVEZWY7XG5cbiAgY29uc3RydWN0b3IocHVibGljIHZpZXc6IFZpZXdEYXRhLCBwdWJsaWMgbm9kZUluZGV4OiBudW1iZXJ8bnVsbCkge1xuICAgIGlmIChub2RlSW5kZXggPT0gbnVsbCkge1xuICAgICAgdGhpcy5ub2RlSW5kZXggPSBub2RlSW5kZXggPSAwO1xuICAgIH1cbiAgICB0aGlzLm5vZGVEZWYgPSB2aWV3LmRlZi5ub2Rlc1tub2RlSW5kZXhdO1xuICAgIGxldCBlbERlZiA9IHRoaXMubm9kZURlZjtcbiAgICBsZXQgZWxWaWV3ID0gdmlldztcbiAgICB3aGlsZSAoZWxEZWYgJiYgKGVsRGVmLmZsYWdzICYgTm9kZUZsYWdzLlR5cGVFbGVtZW50KSA9PT0gMCkge1xuICAgICAgZWxEZWYgPSBlbERlZi5wYXJlbnQgITtcbiAgICB9XG4gICAgaWYgKCFlbERlZikge1xuICAgICAgd2hpbGUgKCFlbERlZiAmJiBlbFZpZXcpIHtcbiAgICAgICAgZWxEZWYgPSB2aWV3UGFyZW50RWwoZWxWaWV3KSAhO1xuICAgICAgICBlbFZpZXcgPSBlbFZpZXcucGFyZW50ICE7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuZWxEZWYgPSBlbERlZjtcbiAgICB0aGlzLmVsVmlldyA9IGVsVmlldztcbiAgfVxuXG4gIHByaXZhdGUgZ2V0IGVsT3JDb21wVmlldygpIHtcbiAgICAvLyBIYXMgdG8gYmUgZG9uZSBsYXppbHkgYXMgd2UgdXNlIHRoZSBEZWJ1Z0NvbnRleHQgYWxzbyBkdXJpbmcgY3JlYXRpb24gb2YgZWxlbWVudHMuLi5cbiAgICByZXR1cm4gYXNFbGVtZW50RGF0YSh0aGlzLmVsVmlldywgdGhpcy5lbERlZi5ub2RlSW5kZXgpLmNvbXBvbmVudFZpZXcgfHwgdGhpcy52aWV3O1xuICB9XG5cbiAgZ2V0IGluamVjdG9yKCk6IEluamVjdG9yIHsgcmV0dXJuIGNyZWF0ZUluamVjdG9yKHRoaXMuZWxWaWV3LCB0aGlzLmVsRGVmKTsgfVxuXG4gIGdldCBjb21wb25lbnQoKTogYW55IHsgcmV0dXJuIHRoaXMuZWxPckNvbXBWaWV3LmNvbXBvbmVudDsgfVxuXG4gIGdldCBjb250ZXh0KCk6IGFueSB7IHJldHVybiB0aGlzLmVsT3JDb21wVmlldy5jb250ZXh0OyB9XG5cbiAgZ2V0IHByb3ZpZGVyVG9rZW5zKCk6IGFueVtdIHtcbiAgICBjb25zdCB0b2tlbnM6IGFueVtdID0gW107XG4gICAgaWYgKHRoaXMuZWxEZWYpIHtcbiAgICAgIGZvciAobGV0IGkgPSB0aGlzLmVsRGVmLm5vZGVJbmRleCArIDE7IGkgPD0gdGhpcy5lbERlZi5ub2RlSW5kZXggKyB0aGlzLmVsRGVmLmNoaWxkQ291bnQ7XG4gICAgICAgICAgIGkrKykge1xuICAgICAgICBjb25zdCBjaGlsZERlZiA9IHRoaXMuZWxWaWV3LmRlZi5ub2Rlc1tpXTtcbiAgICAgICAgaWYgKGNoaWxkRGVmLmZsYWdzICYgTm9kZUZsYWdzLkNhdFByb3ZpZGVyKSB7XG4gICAgICAgICAgdG9rZW5zLnB1c2goY2hpbGREZWYucHJvdmlkZXIgIS50b2tlbik7XG4gICAgICAgIH1cbiAgICAgICAgaSArPSBjaGlsZERlZi5jaGlsZENvdW50O1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdG9rZW5zO1xuICB9XG5cbiAgZ2V0IHJlZmVyZW5jZXMoKToge1trZXk6IHN0cmluZ106IGFueX0ge1xuICAgIGNvbnN0IHJlZmVyZW5jZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9ID0ge307XG4gICAgaWYgKHRoaXMuZWxEZWYpIHtcbiAgICAgIGNvbGxlY3RSZWZlcmVuY2VzKHRoaXMuZWxWaWV3LCB0aGlzLmVsRGVmLCByZWZlcmVuY2VzKTtcblxuICAgICAgZm9yIChsZXQgaSA9IHRoaXMuZWxEZWYubm9kZUluZGV4ICsgMTsgaSA8PSB0aGlzLmVsRGVmLm5vZGVJbmRleCArIHRoaXMuZWxEZWYuY2hpbGRDb3VudDtcbiAgICAgICAgICAgaSsrKSB7XG4gICAgICAgIGNvbnN0IGNoaWxkRGVmID0gdGhpcy5lbFZpZXcuZGVmLm5vZGVzW2ldO1xuICAgICAgICBpZiAoY2hpbGREZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuQ2F0UHJvdmlkZXIpIHtcbiAgICAgICAgICBjb2xsZWN0UmVmZXJlbmNlcyh0aGlzLmVsVmlldywgY2hpbGREZWYsIHJlZmVyZW5jZXMpO1xuICAgICAgICB9XG4gICAgICAgIGkgKz0gY2hpbGREZWYuY2hpbGRDb3VudDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlZmVyZW5jZXM7XG4gIH1cblxuICBnZXQgY29tcG9uZW50UmVuZGVyRWxlbWVudCgpIHtcbiAgICBjb25zdCBlbERhdGEgPSBmaW5kSG9zdEVsZW1lbnQodGhpcy5lbE9yQ29tcFZpZXcpO1xuICAgIHJldHVybiBlbERhdGEgPyBlbERhdGEucmVuZGVyRWxlbWVudCA6IHVuZGVmaW5lZDtcbiAgfVxuXG4gIGdldCByZW5kZXJOb2RlKCk6IGFueSB7XG4gICAgcmV0dXJuIHRoaXMubm9kZURlZi5mbGFncyAmIE5vZGVGbGFncy5UeXBlVGV4dCA/IHJlbmRlck5vZGUodGhpcy52aWV3LCB0aGlzLm5vZGVEZWYpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVuZGVyTm9kZSh0aGlzLmVsVmlldywgdGhpcy5lbERlZik7XG4gIH1cblxuICBsb2dFcnJvcihjb25zb2xlOiBDb25zb2xlLCAuLi52YWx1ZXM6IGFueVtdKSB7XG4gICAgbGV0IGxvZ1ZpZXdEZWY6IFZpZXdEZWZpbml0aW9uO1xuICAgIGxldCBsb2dOb2RlSW5kZXg6IG51bWJlcjtcbiAgICBpZiAodGhpcy5ub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLlR5cGVUZXh0KSB7XG4gICAgICBsb2dWaWV3RGVmID0gdGhpcy52aWV3LmRlZjtcbiAgICAgIGxvZ05vZGVJbmRleCA9IHRoaXMubm9kZURlZi5ub2RlSW5kZXg7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxvZ1ZpZXdEZWYgPSB0aGlzLmVsVmlldy5kZWY7XG4gICAgICBsb2dOb2RlSW5kZXggPSB0aGlzLmVsRGVmLm5vZGVJbmRleDtcbiAgICB9XG4gICAgLy8gTm90ZTogd2Ugb25seSBnZW5lcmF0ZSBhIGxvZyBmdW5jdGlvbiBmb3IgdGV4dCBhbmQgZWxlbWVudCBub2Rlc1xuICAgIC8vIHRvIG1ha2UgdGhlIGdlbmVyYXRlZCBjb2RlIGFzIHNtYWxsIGFzIHBvc3NpYmxlLlxuICAgIGNvbnN0IHJlbmRlck5vZGVJbmRleCA9IGdldFJlbmRlck5vZGVJbmRleChsb2dWaWV3RGVmLCBsb2dOb2RlSW5kZXgpO1xuICAgIGxldCBjdXJyUmVuZGVyTm9kZUluZGV4ID0gLTE7XG4gICAgbGV0IG5vZGVMb2dnZXI6IE5vZGVMb2dnZXIgPSAoKSA9PiB7XG4gICAgICBjdXJyUmVuZGVyTm9kZUluZGV4Kys7XG4gICAgICBpZiAoY3VyclJlbmRlck5vZGVJbmRleCA9PT0gcmVuZGVyTm9kZUluZGV4KSB7XG4gICAgICAgIHJldHVybiBjb25zb2xlLmVycm9yLmJpbmQoY29uc29sZSwgLi4udmFsdWVzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBOT09QO1xuICAgICAgfVxuICAgIH07XG4gICAgbG9nVmlld0RlZi5mYWN0b3J5ICEobm9kZUxvZ2dlcik7XG4gICAgaWYgKGN1cnJSZW5kZXJOb2RlSW5kZXggPCByZW5kZXJOb2RlSW5kZXgpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0lsbGVnYWwgc3RhdGU6IHRoZSBWaWV3RGVmaW5pdGlvbkZhY3RvcnkgZGlkIG5vdCBjYWxsIHRoZSBsb2dnZXIhJyk7XG4gICAgICAoPGFueT5jb25zb2xlLmVycm9yKSguLi52YWx1ZXMpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRSZW5kZXJOb2RlSW5kZXgodmlld0RlZjogVmlld0RlZmluaXRpb24sIG5vZGVJbmRleDogbnVtYmVyKTogbnVtYmVyIHtcbiAgbGV0IHJlbmRlck5vZGVJbmRleCA9IC0xO1xuICBmb3IgKGxldCBpID0gMDsgaSA8PSBub2RlSW5kZXg7IGkrKykge1xuICAgIGNvbnN0IG5vZGVEZWYgPSB2aWV3RGVmLm5vZGVzW2ldO1xuICAgIGlmIChub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLkNhdFJlbmRlck5vZGUpIHtcbiAgICAgIHJlbmRlck5vZGVJbmRleCsrO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVuZGVyTm9kZUluZGV4O1xufVxuXG5mdW5jdGlvbiBmaW5kSG9zdEVsZW1lbnQodmlldzogVmlld0RhdGEpOiBFbGVtZW50RGF0YXxudWxsIHtcbiAgd2hpbGUgKHZpZXcgJiYgIWlzQ29tcG9uZW50Vmlldyh2aWV3KSkge1xuICAgIHZpZXcgPSB2aWV3LnBhcmVudCAhO1xuICB9XG4gIGlmICh2aWV3LnBhcmVudCkge1xuICAgIHJldHVybiBhc0VsZW1lbnREYXRhKHZpZXcucGFyZW50LCB2aWV3UGFyZW50RWwodmlldykgIS5ub2RlSW5kZXgpO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBjb2xsZWN0UmVmZXJlbmNlcyh2aWV3OiBWaWV3RGF0YSwgbm9kZURlZjogTm9kZURlZiwgcmVmZXJlbmNlczoge1trZXk6IHN0cmluZ106IGFueX0pIHtcbiAgZm9yIChsZXQgcmVmTmFtZSBpbiBub2RlRGVmLnJlZmVyZW5jZXMpIHtcbiAgICByZWZlcmVuY2VzW3JlZk5hbWVdID0gZ2V0UXVlcnlWYWx1ZSh2aWV3LCBub2RlRGVmLCBub2RlRGVmLnJlZmVyZW5jZXNbcmVmTmFtZV0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNhbGxXaXRoRGVidWdDb250ZXh0KGFjdGlvbjogRGVidWdBY3Rpb24sIGZuOiBhbnksIHNlbGY6IGFueSwgYXJnczogYW55W10pIHtcbiAgY29uc3Qgb2xkQWN0aW9uID0gX2N1cnJlbnRBY3Rpb247XG4gIGNvbnN0IG9sZFZpZXcgPSBfY3VycmVudFZpZXc7XG4gIGNvbnN0IG9sZE5vZGVJbmRleCA9IF9jdXJyZW50Tm9kZUluZGV4O1xuICB0cnkge1xuICAgIF9jdXJyZW50QWN0aW9uID0gYWN0aW9uO1xuICAgIGNvbnN0IHJlc3VsdCA9IGZuLmFwcGx5KHNlbGYsIGFyZ3MpO1xuICAgIF9jdXJyZW50VmlldyA9IG9sZFZpZXc7XG4gICAgX2N1cnJlbnROb2RlSW5kZXggPSBvbGROb2RlSW5kZXg7XG4gICAgX2N1cnJlbnRBY3Rpb24gPSBvbGRBY3Rpb247XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGlmIChpc1ZpZXdEZWJ1Z0Vycm9yKGUpIHx8ICFfY3VycmVudFZpZXcpIHtcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICAgIHRocm93IHZpZXdXcmFwcGVkRGVidWdFcnJvcihlLCBnZXRDdXJyZW50RGVidWdDb250ZXh0KCkgISk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEN1cnJlbnREZWJ1Z0NvbnRleHQoKTogRGVidWdDb250ZXh0fG51bGwge1xuICByZXR1cm4gX2N1cnJlbnRWaWV3ID8gbmV3IERlYnVnQ29udGV4dF8oX2N1cnJlbnRWaWV3LCBfY3VycmVudE5vZGVJbmRleCkgOiBudWxsO1xufVxuXG5leHBvcnQgY2xhc3MgRGVidWdSZW5kZXJlckZhY3RvcnkyIGltcGxlbWVudHMgUmVuZGVyZXJGYWN0b3J5MiB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgZGVsZWdhdGU6IFJlbmRlcmVyRmFjdG9yeTIpIHt9XG5cbiAgY3JlYXRlUmVuZGVyZXIoZWxlbWVudDogYW55LCByZW5kZXJEYXRhOiBSZW5kZXJlclR5cGUyfG51bGwpOiBSZW5kZXJlcjIge1xuICAgIHJldHVybiBuZXcgRGVidWdSZW5kZXJlcjIodGhpcy5kZWxlZ2F0ZS5jcmVhdGVSZW5kZXJlcihlbGVtZW50LCByZW5kZXJEYXRhKSk7XG4gIH1cblxuICBiZWdpbigpIHtcbiAgICBpZiAodGhpcy5kZWxlZ2F0ZS5iZWdpbikge1xuICAgICAgdGhpcy5kZWxlZ2F0ZS5iZWdpbigpO1xuICAgIH1cbiAgfVxuICBlbmQoKSB7XG4gICAgaWYgKHRoaXMuZGVsZWdhdGUuZW5kKSB7XG4gICAgICB0aGlzLmRlbGVnYXRlLmVuZCgpO1xuICAgIH1cbiAgfVxuXG4gIHdoZW5SZW5kZXJpbmdEb25lKCk6IFByb21pc2U8YW55PiB7XG4gICAgaWYgKHRoaXMuZGVsZWdhdGUud2hlblJlbmRlcmluZ0RvbmUpIHtcbiAgICAgIHJldHVybiB0aGlzLmRlbGVnYXRlLndoZW5SZW5kZXJpbmdEb25lKCk7XG4gICAgfVxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobnVsbCk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIERlYnVnUmVuZGVyZXIyIGltcGxlbWVudHMgUmVuZGVyZXIyIHtcbiAgcmVhZG9ubHkgZGF0YToge1trZXk6IHN0cmluZ106IGFueX07XG5cbiAgcHJpdmF0ZSBjcmVhdGVEZWJ1Z0NvbnRleHQobmF0aXZlRWxlbWVudDogYW55KSB7IHJldHVybiB0aGlzLmRlYnVnQ29udGV4dEZhY3RvcnkobmF0aXZlRWxlbWVudCk7IH1cblxuICAvKipcbiAgICogRmFjdG9yeSBmdW5jdGlvbiB1c2VkIHRvIGNyZWF0ZSBhIGBEZWJ1Z0NvbnRleHRgIHdoZW4gYSBub2RlIGlzIGNyZWF0ZWQuXG4gICAqXG4gICAqIFRoZSBgRGVidWdDb250ZXh0YCBhbGxvd3MgdG8gcmV0cmlldmUgaW5mb3JtYXRpb24gYWJvdXQgdGhlIG5vZGVzIHRoYXQgYXJlIHVzZWZ1bCBpbiB0ZXN0cy5cbiAgICpcbiAgICogVGhlIGZhY3RvcnkgaXMgY29uZmlndXJhYmxlIHNvIHRoYXQgdGhlIGBEZWJ1Z1JlbmRlcmVyMmAgY291bGQgaW5zdGFudGlhdGUgZWl0aGVyIGEgVmlldyBFbmdpbmVcbiAgICogb3IgYSBSZW5kZXIgY29udGV4dC5cbiAgICovXG4gIGRlYnVnQ29udGV4dEZhY3Rvcnk6IChuYXRpdmVFbGVtZW50PzogYW55KSA9PiBEZWJ1Z0NvbnRleHQgfCBudWxsID0gZ2V0Q3VycmVudERlYnVnQ29udGV4dDtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGRlbGVnYXRlOiBSZW5kZXJlcjIpIHsgdGhpcy5kYXRhID0gdGhpcy5kZWxlZ2F0ZS5kYXRhOyB9XG5cbiAgZGVzdHJveU5vZGUobm9kZTogYW55KSB7XG4gICAgcmVtb3ZlRGVidWdOb2RlRnJvbUluZGV4KGdldERlYnVnTm9kZShub2RlKSAhKTtcbiAgICBpZiAodGhpcy5kZWxlZ2F0ZS5kZXN0cm95Tm9kZSkge1xuICAgICAgdGhpcy5kZWxlZ2F0ZS5kZXN0cm95Tm9kZShub2RlKTtcbiAgICB9XG4gIH1cblxuICBkZXN0cm95KCkgeyB0aGlzLmRlbGVnYXRlLmRlc3Ryb3koKTsgfVxuXG4gIGNyZWF0ZUVsZW1lbnQobmFtZTogc3RyaW5nLCBuYW1lc3BhY2U/OiBzdHJpbmcpOiBhbnkge1xuICAgIGNvbnN0IGVsID0gdGhpcy5kZWxlZ2F0ZS5jcmVhdGVFbGVtZW50KG5hbWUsIG5hbWVzcGFjZSk7XG4gICAgY29uc3QgZGVidWdDdHggPSB0aGlzLmNyZWF0ZURlYnVnQ29udGV4dChlbCk7XG4gICAgaWYgKGRlYnVnQ3R4KSB7XG4gICAgICBjb25zdCBkZWJ1Z0VsID0gbmV3IERlYnVnRWxlbWVudF9fUFJFX1IzX18oZWwsIG51bGwsIGRlYnVnQ3R4KTtcbiAgICAgIChkZWJ1Z0VsIGFze25hbWU6IHN0cmluZ30pLm5hbWUgPSBuYW1lO1xuICAgICAgaW5kZXhEZWJ1Z05vZGUoZGVidWdFbCk7XG4gICAgfVxuICAgIHJldHVybiBlbDtcbiAgfVxuXG4gIGNyZWF0ZUNvbW1lbnQodmFsdWU6IHN0cmluZyk6IGFueSB7XG4gICAgY29uc3QgY29tbWVudCA9IHRoaXMuZGVsZWdhdGUuY3JlYXRlQ29tbWVudCh2YWx1ZSk7XG4gICAgY29uc3QgZGVidWdDdHggPSB0aGlzLmNyZWF0ZURlYnVnQ29udGV4dChjb21tZW50KTtcbiAgICBpZiAoZGVidWdDdHgpIHtcbiAgICAgIGluZGV4RGVidWdOb2RlKG5ldyBEZWJ1Z05vZGVfX1BSRV9SM19fKGNvbW1lbnQsIG51bGwsIGRlYnVnQ3R4KSk7XG4gICAgfVxuICAgIHJldHVybiBjb21tZW50O1xuICB9XG5cbiAgY3JlYXRlVGV4dCh2YWx1ZTogc3RyaW5nKTogYW55IHtcbiAgICBjb25zdCB0ZXh0ID0gdGhpcy5kZWxlZ2F0ZS5jcmVhdGVUZXh0KHZhbHVlKTtcbiAgICBjb25zdCBkZWJ1Z0N0eCA9IHRoaXMuY3JlYXRlRGVidWdDb250ZXh0KHRleHQpO1xuICAgIGlmIChkZWJ1Z0N0eCkge1xuICAgICAgaW5kZXhEZWJ1Z05vZGUobmV3IERlYnVnTm9kZV9fUFJFX1IzX18odGV4dCwgbnVsbCwgZGVidWdDdHgpKTtcbiAgICB9XG4gICAgcmV0dXJuIHRleHQ7XG4gIH1cblxuICBhcHBlbmRDaGlsZChwYXJlbnQ6IGFueSwgbmV3Q2hpbGQ6IGFueSk6IHZvaWQge1xuICAgIGNvbnN0IGRlYnVnRWwgPSBnZXREZWJ1Z05vZGUocGFyZW50KTtcbiAgICBjb25zdCBkZWJ1Z0NoaWxkRWwgPSBnZXREZWJ1Z05vZGUobmV3Q2hpbGQpO1xuICAgIGlmIChkZWJ1Z0VsICYmIGRlYnVnQ2hpbGRFbCAmJiBkZWJ1Z0VsIGluc3RhbmNlb2YgRGVidWdFbGVtZW50X19QUkVfUjNfXykge1xuICAgICAgZGVidWdFbC5hZGRDaGlsZChkZWJ1Z0NoaWxkRWwpO1xuICAgIH1cbiAgICB0aGlzLmRlbGVnYXRlLmFwcGVuZENoaWxkKHBhcmVudCwgbmV3Q2hpbGQpO1xuICB9XG5cbiAgaW5zZXJ0QmVmb3JlKHBhcmVudDogYW55LCBuZXdDaGlsZDogYW55LCByZWZDaGlsZDogYW55KTogdm9pZCB7XG4gICAgY29uc3QgZGVidWdFbCA9IGdldERlYnVnTm9kZShwYXJlbnQpO1xuICAgIGNvbnN0IGRlYnVnQ2hpbGRFbCA9IGdldERlYnVnTm9kZShuZXdDaGlsZCk7XG4gICAgY29uc3QgZGVidWdSZWZFbCA9IGdldERlYnVnTm9kZShyZWZDaGlsZCkgITtcbiAgICBpZiAoZGVidWdFbCAmJiBkZWJ1Z0NoaWxkRWwgJiYgZGVidWdFbCBpbnN0YW5jZW9mIERlYnVnRWxlbWVudF9fUFJFX1IzX18pIHtcbiAgICAgIGRlYnVnRWwuaW5zZXJ0QmVmb3JlKGRlYnVnUmVmRWwsIGRlYnVnQ2hpbGRFbCk7XG4gICAgfVxuXG4gICAgdGhpcy5kZWxlZ2F0ZS5pbnNlcnRCZWZvcmUocGFyZW50LCBuZXdDaGlsZCwgcmVmQ2hpbGQpO1xuICB9XG5cbiAgcmVtb3ZlQ2hpbGQocGFyZW50OiBhbnksIG9sZENoaWxkOiBhbnkpOiB2b2lkIHtcbiAgICBjb25zdCBkZWJ1Z0VsID0gZ2V0RGVidWdOb2RlKHBhcmVudCk7XG4gICAgY29uc3QgZGVidWdDaGlsZEVsID0gZ2V0RGVidWdOb2RlKG9sZENoaWxkKTtcbiAgICBpZiAoZGVidWdFbCAmJiBkZWJ1Z0NoaWxkRWwgJiYgZGVidWdFbCBpbnN0YW5jZW9mIERlYnVnRWxlbWVudF9fUFJFX1IzX18pIHtcbiAgICAgIGRlYnVnRWwucmVtb3ZlQ2hpbGQoZGVidWdDaGlsZEVsKTtcbiAgICB9XG4gICAgdGhpcy5kZWxlZ2F0ZS5yZW1vdmVDaGlsZChwYXJlbnQsIG9sZENoaWxkKTtcbiAgfVxuXG4gIHNlbGVjdFJvb3RFbGVtZW50KHNlbGVjdG9yT3JOb2RlOiBzdHJpbmd8YW55LCBwcmVzZXJ2ZUNvbnRlbnQ/OiBib29sZWFuKTogYW55IHtcbiAgICBjb25zdCBlbCA9IHRoaXMuZGVsZWdhdGUuc2VsZWN0Um9vdEVsZW1lbnQoc2VsZWN0b3JPck5vZGUsIHByZXNlcnZlQ29udGVudCk7XG4gICAgY29uc3QgZGVidWdDdHggPSBnZXRDdXJyZW50RGVidWdDb250ZXh0KCk7XG4gICAgaWYgKGRlYnVnQ3R4KSB7XG4gICAgICBpbmRleERlYnVnTm9kZShuZXcgRGVidWdFbGVtZW50X19QUkVfUjNfXyhlbCwgbnVsbCwgZGVidWdDdHgpKTtcbiAgICB9XG4gICAgcmV0dXJuIGVsO1xuICB9XG5cbiAgc2V0QXR0cmlidXRlKGVsOiBhbnksIG5hbWU6IHN0cmluZywgdmFsdWU6IHN0cmluZywgbmFtZXNwYWNlPzogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3QgZGVidWdFbCA9IGdldERlYnVnTm9kZShlbCk7XG4gICAgaWYgKGRlYnVnRWwgJiYgZGVidWdFbCBpbnN0YW5jZW9mIERlYnVnRWxlbWVudF9fUFJFX1IzX18pIHtcbiAgICAgIGNvbnN0IGZ1bGxOYW1lID0gbmFtZXNwYWNlID8gbmFtZXNwYWNlICsgJzonICsgbmFtZSA6IG5hbWU7XG4gICAgICBkZWJ1Z0VsLmF0dHJpYnV0ZXNbZnVsbE5hbWVdID0gdmFsdWU7XG4gICAgfVxuICAgIHRoaXMuZGVsZWdhdGUuc2V0QXR0cmlidXRlKGVsLCBuYW1lLCB2YWx1ZSwgbmFtZXNwYWNlKTtcbiAgfVxuXG4gIHJlbW92ZUF0dHJpYnV0ZShlbDogYW55LCBuYW1lOiBzdHJpbmcsIG5hbWVzcGFjZT86IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IGRlYnVnRWwgPSBnZXREZWJ1Z05vZGUoZWwpO1xuICAgIGlmIChkZWJ1Z0VsICYmIGRlYnVnRWwgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fKSB7XG4gICAgICBjb25zdCBmdWxsTmFtZSA9IG5hbWVzcGFjZSA/IG5hbWVzcGFjZSArICc6JyArIG5hbWUgOiBuYW1lO1xuICAgICAgZGVidWdFbC5hdHRyaWJ1dGVzW2Z1bGxOYW1lXSA9IG51bGw7XG4gICAgfVxuICAgIHRoaXMuZGVsZWdhdGUucmVtb3ZlQXR0cmlidXRlKGVsLCBuYW1lLCBuYW1lc3BhY2UpO1xuICB9XG5cbiAgYWRkQ2xhc3MoZWw6IGFueSwgbmFtZTogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3QgZGVidWdFbCA9IGdldERlYnVnTm9kZShlbCk7XG4gICAgaWYgKGRlYnVnRWwgJiYgZGVidWdFbCBpbnN0YW5jZW9mIERlYnVnRWxlbWVudF9fUFJFX1IzX18pIHtcbiAgICAgIGRlYnVnRWwuY2xhc3Nlc1tuYW1lXSA9IHRydWU7XG4gICAgfVxuICAgIHRoaXMuZGVsZWdhdGUuYWRkQ2xhc3MoZWwsIG5hbWUpO1xuICB9XG5cbiAgcmVtb3ZlQ2xhc3MoZWw6IGFueSwgbmFtZTogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3QgZGVidWdFbCA9IGdldERlYnVnTm9kZShlbCk7XG4gICAgaWYgKGRlYnVnRWwgJiYgZGVidWdFbCBpbnN0YW5jZW9mIERlYnVnRWxlbWVudF9fUFJFX1IzX18pIHtcbiAgICAgIGRlYnVnRWwuY2xhc3Nlc1tuYW1lXSA9IGZhbHNlO1xuICAgIH1cbiAgICB0aGlzLmRlbGVnYXRlLnJlbW92ZUNsYXNzKGVsLCBuYW1lKTtcbiAgfVxuXG4gIHNldFN0eWxlKGVsOiBhbnksIHN0eWxlOiBzdHJpbmcsIHZhbHVlOiBhbnksIGZsYWdzOiBSZW5kZXJlclN0eWxlRmxhZ3MyKTogdm9pZCB7XG4gICAgY29uc3QgZGVidWdFbCA9IGdldERlYnVnTm9kZShlbCk7XG4gICAgaWYgKGRlYnVnRWwgJiYgZGVidWdFbCBpbnN0YW5jZW9mIERlYnVnRWxlbWVudF9fUFJFX1IzX18pIHtcbiAgICAgIGRlYnVnRWwuc3R5bGVzW3N0eWxlXSA9IHZhbHVlO1xuICAgIH1cbiAgICB0aGlzLmRlbGVnYXRlLnNldFN0eWxlKGVsLCBzdHlsZSwgdmFsdWUsIGZsYWdzKTtcbiAgfVxuXG4gIHJlbW92ZVN0eWxlKGVsOiBhbnksIHN0eWxlOiBzdHJpbmcsIGZsYWdzOiBSZW5kZXJlclN0eWxlRmxhZ3MyKTogdm9pZCB7XG4gICAgY29uc3QgZGVidWdFbCA9IGdldERlYnVnTm9kZShlbCk7XG4gICAgaWYgKGRlYnVnRWwgJiYgZGVidWdFbCBpbnN0YW5jZW9mIERlYnVnRWxlbWVudF9fUFJFX1IzX18pIHtcbiAgICAgIGRlYnVnRWwuc3R5bGVzW3N0eWxlXSA9IG51bGw7XG4gICAgfVxuICAgIHRoaXMuZGVsZWdhdGUucmVtb3ZlU3R5bGUoZWwsIHN0eWxlLCBmbGFncyk7XG4gIH1cblxuICBzZXRQcm9wZXJ0eShlbDogYW55LCBuYW1lOiBzdHJpbmcsIHZhbHVlOiBhbnkpOiB2b2lkIHtcbiAgICBjb25zdCBkZWJ1Z0VsID0gZ2V0RGVidWdOb2RlKGVsKTtcbiAgICBpZiAoZGVidWdFbCAmJiBkZWJ1Z0VsIGluc3RhbmNlb2YgRGVidWdFbGVtZW50X19QUkVfUjNfXykge1xuICAgICAgZGVidWdFbC5wcm9wZXJ0aWVzW25hbWVdID0gdmFsdWU7XG4gICAgfVxuICAgIHRoaXMuZGVsZWdhdGUuc2V0UHJvcGVydHkoZWwsIG5hbWUsIHZhbHVlKTtcbiAgfVxuXG4gIGxpc3RlbihcbiAgICAgIHRhcmdldDogJ2RvY3VtZW50J3wnd2luZG93cyd8J2JvZHknfGFueSwgZXZlbnROYW1lOiBzdHJpbmcsXG4gICAgICBjYWxsYmFjazogKGV2ZW50OiBhbnkpID0+IGJvb2xlYW4pOiAoKSA9PiB2b2lkIHtcbiAgICBpZiAodHlwZW9mIHRhcmdldCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIGNvbnN0IGRlYnVnRWwgPSBnZXREZWJ1Z05vZGUodGFyZ2V0KTtcbiAgICAgIGlmIChkZWJ1Z0VsKSB7XG4gICAgICAgIGRlYnVnRWwubGlzdGVuZXJzLnB1c2gobmV3IEV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCBjYWxsYmFjaykpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmRlbGVnYXRlLmxpc3Rlbih0YXJnZXQsIGV2ZW50TmFtZSwgY2FsbGJhY2spO1xuICB9XG5cbiAgcGFyZW50Tm9kZShub2RlOiBhbnkpOiBhbnkgeyByZXR1cm4gdGhpcy5kZWxlZ2F0ZS5wYXJlbnROb2RlKG5vZGUpOyB9XG4gIG5leHRTaWJsaW5nKG5vZGU6IGFueSk6IGFueSB7IHJldHVybiB0aGlzLmRlbGVnYXRlLm5leHRTaWJsaW5nKG5vZGUpOyB9XG4gIHNldFZhbHVlKG5vZGU6IGFueSwgdmFsdWU6IHN0cmluZyk6IHZvaWQgeyByZXR1cm4gdGhpcy5kZWxlZ2F0ZS5zZXRWYWx1ZShub2RlLCB2YWx1ZSk7IH1cbn1cbiJdfQ==