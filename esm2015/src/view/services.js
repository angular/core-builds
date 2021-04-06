/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { DebugElement__PRE_R3__, DebugEventListener, DebugNode__PRE_R3__, getDebugNode, indexDebugNode, removeDebugNodeFromIndex } from '../debug/debug_node';
import { resolveForwardRef } from '../di';
import { getInjectableDef } from '../di/interface/defs';
import { ErrorHandler } from '../error_handler';
import { RendererFactory2 } from '../render/api';
import { Sanitizer } from '../sanitization/sanitizer';
import { escapeCommentText } from '../util/dom';
import { isDevMode } from '../util/is_dev_mode';
import { normalizeDebugBindingName, normalizeDebugBindingValue } from '../util/ng_reflect';
import { isViewDebugError, viewDestroyedError, viewWrappedDebugError } from './errors';
import { resolveDep } from './provider';
import { dirtyParentQueries, getQueryValue } from './query';
import { createInjector, createNgModuleRef, getComponentViewDefinitionFactory } from './refs';
import { asElementData, asPureExpressionData, Services } from './types';
import { isComponentView, NOOP, renderNode, resolveDefinition, splitDepsDsl, tokenKey, viewParentEl } from './util';
import { checkAndUpdateNode, checkAndUpdateView, checkNoChangesNode, checkNoChangesView, createComponentView, createEmbeddedView, createRootView, destroyView } from './view';
let initialized = false;
export function initServicesIfNeeded() {
    if (initialized) {
        return;
    }
    initialized = true;
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
        updateDirectives: (view, checkType) => view.def.updateDirectives(checkType === 0 /* CheckAndUpdate */ ? prodCheckAndUpdateNode : prodCheckNoChangesNode, view),
        updateRenderer: (view, checkType) => view.def.updateRenderer(checkType === 0 /* CheckAndUpdate */ ? prodCheckAndUpdateNode : prodCheckNoChangesNode, view),
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
        createDebugContext: (view, nodeIndex) => new DebugContext_(view, nodeIndex),
        handleEvent: debugHandleEvent,
        updateDirectives: debugUpdateDirectives,
        updateRenderer: debugUpdateRenderer,
    };
}
function createProdRootView(elInjector, projectableNodes, rootSelectorOrNode, def, ngModule, context) {
    const rendererFactory = ngModule.injector.get(RendererFactory2);
    return createRootView(createRootData(elInjector, ngModule, rendererFactory, projectableNodes, rootSelectorOrNode), def, context);
}
function debugCreateRootView(elInjector, projectableNodes, rootSelectorOrNode, def, ngModule, context) {
    const rendererFactory = ngModule.injector.get(RendererFactory2);
    const root = createRootData(elInjector, ngModule, new DebugRendererFactory2(rendererFactory), projectableNodes, rootSelectorOrNode);
    const defWithOverride = applyProviderOverridesToView(def);
    return callWithDebugContext(DebugAction.create, createRootView, null, [root, defWithOverride, context]);
}
function createRootData(elInjector, ngModule, rendererFactory, projectableNodes, rootSelectorOrNode) {
    const sanitizer = ngModule.injector.get(Sanitizer);
    const errorHandler = ngModule.injector.get(ErrorHandler);
    const renderer = rendererFactory.createRenderer(null, null);
    return {
        ngModule,
        injector: elInjector,
        projectableNodes,
        selectorOrNode: rootSelectorOrNode,
        sanitizer,
        rendererFactory,
        renderer,
        errorHandler
    };
}
function debugCreateEmbeddedView(parentView, anchorDef, viewDef, context) {
    const defWithOverride = applyProviderOverridesToView(viewDef);
    return callWithDebugContext(DebugAction.create, createEmbeddedView, null, [parentView, anchorDef, defWithOverride, context]);
}
function debugCreateComponentView(parentView, nodeDef, viewDef, hostElement) {
    const overrideComponentView = viewDefOverrides.get(nodeDef.element.componentProvider.provider.token);
    if (overrideComponentView) {
        viewDef = overrideComponentView;
    }
    else {
        viewDef = applyProviderOverridesToView(viewDef);
    }
    return callWithDebugContext(DebugAction.create, createComponentView, null, [parentView, nodeDef, viewDef, hostElement]);
}
function debugCreateNgModuleRef(moduleType, parentInjector, bootstrapComponents, def) {
    const defWithOverride = applyProviderOverridesToNgModule(def);
    return createNgModuleRef(moduleType, parentInjector, bootstrapComponents, defWithOverride);
}
const providerOverrides = new Map();
const providerOverridesWithScope = new Map();
const viewDefOverrides = new Map();
function debugOverrideProvider(override) {
    providerOverrides.set(override.token, override);
    let injectableDef;
    if (typeof override.token === 'function' && (injectableDef = getInjectableDef(override.token)) &&
        typeof injectableDef.providedIn === 'function') {
        providerOverridesWithScope.set(override.token, override);
    }
}
function debugOverrideComponentView(comp, compFactory) {
    const hostViewDef = resolveDefinition(getComponentViewDefinitionFactory(compFactory));
    const compViewDef = resolveDefinition(hostViewDef.nodes[0].element.componentView);
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
    const elementIndicesWithOverwrittenProviders = findElementIndicesWithOverwrittenProviders(def);
    if (elementIndicesWithOverwrittenProviders.length === 0) {
        return def;
    }
    // clone the whole view definition,
    // as it maintains references between the nodes that are hard to update.
    def = def.factory(() => NOOP);
    for (let i = 0; i < elementIndicesWithOverwrittenProviders.length; i++) {
        applyProviderOverridesToElement(def, elementIndicesWithOverwrittenProviders[i]);
    }
    return def;
    function findElementIndicesWithOverwrittenProviders(def) {
        const elIndicesWithOverwrittenProviders = [];
        let lastElementDef = null;
        for (let i = 0; i < def.nodes.length; i++) {
            const nodeDef = def.nodes[i];
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
        for (let i = elIndex + 1; i < viewDef.nodes.length; i++) {
            const nodeDef = viewDef.nodes[i];
            if (nodeDef.flags & 1 /* TypeElement */) {
                // stop at the next element
                return;
            }
            if (nodeDef.flags & 3840 /* CatProviderNoDirective */) {
                const provider = nodeDef.provider;
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
function applyProviderOverridesToNgModule(def) {
    const { hasOverrides, hasDeprecatedOverrides } = calcHasOverrides(def);
    if (!hasOverrides) {
        return def;
    }
    // clone the whole view definition,
    // as it maintains references between the nodes that are hard to update.
    def = def.factory(() => NOOP);
    applyProviderOverrides(def);
    return def;
    function calcHasOverrides(def) {
        let hasOverrides = false;
        let hasDeprecatedOverrides = false;
        if (providerOverrides.size === 0) {
            return { hasOverrides, hasDeprecatedOverrides };
        }
        def.providers.forEach(node => {
            const override = providerOverrides.get(node.token);
            if ((node.flags & 3840 /* CatProviderNoDirective */) && override) {
                hasOverrides = true;
                hasDeprecatedOverrides = hasDeprecatedOverrides || override.deprecatedBehavior;
            }
        });
        def.modules.forEach(module => {
            providerOverridesWithScope.forEach((override, token) => {
                if (resolveForwardRef(getInjectableDef(token).providedIn) === module) {
                    hasOverrides = true;
                    hasDeprecatedOverrides = hasDeprecatedOverrides || override.deprecatedBehavior;
                }
            });
        });
        return { hasOverrides, hasDeprecatedOverrides };
    }
    function applyProviderOverrides(def) {
        for (let i = 0; i < def.providers.length; i++) {
            const provider = def.providers[i];
            if (hasDeprecatedOverrides) {
                // We had a bug where me made
                // all providers lazy. Keep this logic behind a flag
                // for migrating existing users.
                provider.flags |= 4096 /* LazyProvider */;
            }
            const override = providerOverrides.get(provider.token);
            if (override) {
                provider.flags = (provider.flags & ~3840 /* CatProviderNoDirective */) | override.flags;
                provider.deps = splitDepsDsl(override.deps);
                provider.value = override.value;
            }
        }
        if (providerOverridesWithScope.size > 0) {
            let moduleSet = new Set(def.modules);
            providerOverridesWithScope.forEach((override, token) => {
                if (moduleSet.has(resolveForwardRef(getInjectableDef(token).providedIn))) {
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
function prodCheckAndUpdateNode(view, checkIndex, argStyle, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9) {
    const nodeDef = view.def.nodes[checkIndex];
    checkAndUpdateNode(view, nodeDef, argStyle, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9);
    return (nodeDef.flags & 224 /* CatPureExpression */) ?
        asPureExpressionData(view, checkIndex).value :
        undefined;
}
function prodCheckNoChangesNode(view, checkIndex, argStyle, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9) {
    const nodeDef = view.def.nodes[checkIndex];
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
let _currentAction;
let _currentView;
let _currentNodeIndex;
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
    function debugCheckDirectivesFn(view, nodeIndex, argStyle, ...values) {
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
function debugUpdateRenderer(view, checkType) {
    if (view.state & 128 /* Destroyed */) {
        throw viewDestroyedError(DebugAction[_currentAction]);
    }
    debugSetCurrentNode(view, nextRenderNodeWithBinding(view, 0));
    return view.def.updateRenderer(debugCheckRenderNodeFn, view);
    function debugCheckRenderNodeFn(view, nodeIndex, argStyle, ...values) {
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
function debugCheckAndUpdateNode(view, nodeDef, argStyle, givenValues) {
    const changed = checkAndUpdateNode(view, nodeDef, argStyle, ...givenValues);
    if (changed) {
        const values = argStyle === 1 /* Dynamic */ ? givenValues[0] : givenValues;
        if (nodeDef.flags & 16384 /* TypeDirective */) {
            const bindingValues = {};
            for (let i = 0; i < nodeDef.bindings.length; i++) {
                const binding = nodeDef.bindings[i];
                const value = values[i];
                if (binding.flags & 8 /* TypeProperty */) {
                    bindingValues[normalizeDebugBindingName(binding.nonMinifiedName)] =
                        normalizeDebugBindingValue(value);
                }
            }
            const elDef = nodeDef.parent;
            const el = asElementData(view, elDef.nodeIndex).renderElement;
            if (!elDef.element.name) {
                // a comment.
                view.renderer.setValue(el, escapeCommentText(`bindings=${JSON.stringify(bindingValues, null, 2)}`));
            }
            else {
                // a regular element.
                for (let attr in bindingValues) {
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
function debugCheckNoChangesNode(view, nodeDef, argStyle, values) {
    checkNoChangesNode(view, nodeDef, argStyle, ...values);
}
function nextDirectiveWithBinding(view, nodeIndex) {
    for (let i = nodeIndex; i < view.def.nodes.length; i++) {
        const nodeDef = view.def.nodes[i];
        if (nodeDef.flags & 16384 /* TypeDirective */ && nodeDef.bindings && nodeDef.bindings.length) {
            return i;
        }
    }
    return null;
}
function nextRenderNodeWithBinding(view, nodeIndex) {
    for (let i = nodeIndex; i < view.def.nodes.length; i++) {
        const nodeDef = view.def.nodes[i];
        if ((nodeDef.flags & 3 /* CatRenderNode */) && nodeDef.bindings && nodeDef.bindings.length) {
            return i;
        }
    }
    return null;
}
class DebugContext_ {
    constructor(view, nodeIndex) {
        this.view = view;
        this.nodeIndex = nodeIndex;
        if (nodeIndex == null) {
            this.nodeIndex = nodeIndex = 0;
        }
        this.nodeDef = view.def.nodes[nodeIndex];
        let elDef = this.nodeDef;
        let elView = view;
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
    get elOrCompView() {
        // Has to be done lazily as we use the DebugContext also during creation of elements...
        return asElementData(this.elView, this.elDef.nodeIndex).componentView || this.view;
    }
    get injector() {
        return createInjector(this.elView, this.elDef);
    }
    get component() {
        return this.elOrCompView.component;
    }
    get context() {
        return this.elOrCompView.context;
    }
    get providerTokens() {
        const tokens = [];
        if (this.elDef) {
            for (let i = this.elDef.nodeIndex + 1; i <= this.elDef.nodeIndex + this.elDef.childCount; i++) {
                const childDef = this.elView.def.nodes[i];
                if (childDef.flags & 20224 /* CatProvider */) {
                    tokens.push(childDef.provider.token);
                }
                i += childDef.childCount;
            }
        }
        return tokens;
    }
    get references() {
        const references = {};
        if (this.elDef) {
            collectReferences(this.elView, this.elDef, references);
            for (let i = this.elDef.nodeIndex + 1; i <= this.elDef.nodeIndex + this.elDef.childCount; i++) {
                const childDef = this.elView.def.nodes[i];
                if (childDef.flags & 20224 /* CatProvider */) {
                    collectReferences(this.elView, childDef, references);
                }
                i += childDef.childCount;
            }
        }
        return references;
    }
    get componentRenderElement() {
        const elData = findHostElement(this.elOrCompView);
        return elData ? elData.renderElement : undefined;
    }
    get renderNode() {
        return this.nodeDef.flags & 2 /* TypeText */ ? renderNode(this.view, this.nodeDef) :
            renderNode(this.elView, this.elDef);
    }
    logError(console, ...values) {
        let logViewDef;
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
        const renderNodeIndex = getRenderNodeIndex(logViewDef, logNodeIndex);
        let currRenderNodeIndex = -1;
        let nodeLogger = () => {
            currRenderNodeIndex++;
            if (currRenderNodeIndex === renderNodeIndex) {
                return console.error.bind(console, ...values);
            }
            else {
                return NOOP;
            }
        };
        logViewDef.factory(nodeLogger);
        if (currRenderNodeIndex < renderNodeIndex) {
            console.error('Illegal state: the ViewDefinitionFactory did not call the logger!');
            console.error(...values);
        }
    }
}
function getRenderNodeIndex(viewDef, nodeIndex) {
    let renderNodeIndex = -1;
    for (let i = 0; i <= nodeIndex; i++) {
        const nodeDef = viewDef.nodes[i];
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
    for (let refName in nodeDef.references) {
        references[refName] = getQueryValue(view, nodeDef, nodeDef.references[refName]);
    }
}
function callWithDebugContext(action, fn, self, args) {
    const oldAction = _currentAction;
    const oldView = _currentView;
    const oldNodeIndex = _currentNodeIndex;
    try {
        _currentAction = action;
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
        throw viewWrappedDebugError(e, getCurrentDebugContext());
    }
}
export function getCurrentDebugContext() {
    return _currentView ? new DebugContext_(_currentView, _currentNodeIndex) : null;
}
export class DebugRendererFactory2 {
    constructor(delegate) {
        this.delegate = delegate;
    }
    createRenderer(element, renderData) {
        return new DebugRenderer2(this.delegate.createRenderer(element, renderData));
    }
    begin() {
        if (this.delegate.begin) {
            this.delegate.begin();
        }
    }
    end() {
        if (this.delegate.end) {
            this.delegate.end();
        }
    }
    whenRenderingDone() {
        if (this.delegate.whenRenderingDone) {
            return this.delegate.whenRenderingDone();
        }
        return Promise.resolve(null);
    }
}
export class DebugRenderer2 {
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
    createDebugContext(nativeElement) {
        return this.debugContextFactory(nativeElement);
    }
    destroyNode(node) {
        const debugNode = getDebugNode(node);
        removeDebugNodeFromIndex(debugNode);
        if (debugNode instanceof DebugNode__PRE_R3__) {
            debugNode.listeners.length = 0;
        }
        if (this.delegate.destroyNode) {
            this.delegate.destroyNode(node);
        }
    }
    destroy() {
        this.delegate.destroy();
    }
    createElement(name, namespace) {
        const el = this.delegate.createElement(name, namespace);
        const debugCtx = this.createDebugContext(el);
        if (debugCtx) {
            const debugEl = new DebugElement__PRE_R3__(el, null, debugCtx);
            debugEl.name = name;
            indexDebugNode(debugEl);
        }
        return el;
    }
    createComment(value) {
        const comment = this.delegate.createComment(escapeCommentText(value));
        const debugCtx = this.createDebugContext(comment);
        if (debugCtx) {
            indexDebugNode(new DebugNode__PRE_R3__(comment, null, debugCtx));
        }
        return comment;
    }
    createText(value) {
        const text = this.delegate.createText(value);
        const debugCtx = this.createDebugContext(text);
        if (debugCtx) {
            indexDebugNode(new DebugNode__PRE_R3__(text, null, debugCtx));
        }
        return text;
    }
    appendChild(parent, newChild) {
        const debugEl = getDebugNode(parent);
        const debugChildEl = getDebugNode(newChild);
        if (debugEl && debugChildEl && debugEl instanceof DebugElement__PRE_R3__) {
            debugEl.addChild(debugChildEl);
        }
        this.delegate.appendChild(parent, newChild);
    }
    insertBefore(parent, newChild, refChild, isMove) {
        const debugEl = getDebugNode(parent);
        const debugChildEl = getDebugNode(newChild);
        const debugRefEl = getDebugNode(refChild);
        if (debugEl && debugChildEl && debugEl instanceof DebugElement__PRE_R3__) {
            debugEl.insertBefore(debugRefEl, debugChildEl);
        }
        this.delegate.insertBefore(parent, newChild, refChild, isMove);
    }
    removeChild(parent, oldChild) {
        const debugEl = getDebugNode(parent);
        const debugChildEl = getDebugNode(oldChild);
        if (debugEl && debugChildEl && debugEl instanceof DebugElement__PRE_R3__) {
            debugEl.removeChild(debugChildEl);
        }
        this.delegate.removeChild(parent, oldChild);
    }
    selectRootElement(selectorOrNode, preserveContent) {
        const el = this.delegate.selectRootElement(selectorOrNode, preserveContent);
        const debugCtx = getCurrentDebugContext();
        if (debugCtx) {
            indexDebugNode(new DebugElement__PRE_R3__(el, null, debugCtx));
        }
        return el;
    }
    setAttribute(el, name, value, namespace) {
        const debugEl = getDebugNode(el);
        if (debugEl && debugEl instanceof DebugElement__PRE_R3__) {
            const fullName = namespace ? namespace + ':' + name : name;
            debugEl.attributes[fullName] = value;
        }
        this.delegate.setAttribute(el, name, value, namespace);
    }
    removeAttribute(el, name, namespace) {
        const debugEl = getDebugNode(el);
        if (debugEl && debugEl instanceof DebugElement__PRE_R3__) {
            const fullName = namespace ? namespace + ':' + name : name;
            debugEl.attributes[fullName] = null;
        }
        this.delegate.removeAttribute(el, name, namespace);
    }
    addClass(el, name) {
        const debugEl = getDebugNode(el);
        if (debugEl && debugEl instanceof DebugElement__PRE_R3__) {
            debugEl.classes[name] = true;
        }
        this.delegate.addClass(el, name);
    }
    removeClass(el, name) {
        const debugEl = getDebugNode(el);
        if (debugEl && debugEl instanceof DebugElement__PRE_R3__) {
            debugEl.classes[name] = false;
        }
        this.delegate.removeClass(el, name);
    }
    setStyle(el, style, value, flags) {
        const debugEl = getDebugNode(el);
        if (debugEl && debugEl instanceof DebugElement__PRE_R3__) {
            debugEl.styles[style] = value;
        }
        this.delegate.setStyle(el, style, value, flags);
    }
    removeStyle(el, style, flags) {
        const debugEl = getDebugNode(el);
        if (debugEl && debugEl instanceof DebugElement__PRE_R3__) {
            debugEl.styles[style] = null;
        }
        this.delegate.removeStyle(el, style, flags);
    }
    setProperty(el, name, value) {
        const debugEl = getDebugNode(el);
        if (debugEl && debugEl instanceof DebugElement__PRE_R3__) {
            debugEl.properties[name] = value;
        }
        this.delegate.setProperty(el, name, value);
    }
    listen(target, eventName, callback) {
        if (typeof target !== 'string') {
            const debugEl = getDebugNode(target);
            if (debugEl) {
                debugEl.listeners.push(new DebugEventListener(eventName, callback));
            }
        }
        return this.delegate.listen(target, eventName, callback);
    }
    parentNode(node) {
        return this.delegate.parentNode(node);
    }
    nextSibling(node) {
        return this.delegate.nextSibling(node);
    }
    setValue(node, value) {
        return this.delegate.setValue(node, value);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmljZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy92aWV3L3NlcnZpY2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxzQkFBc0IsRUFBRSxrQkFBa0IsRUFBRSxtQkFBbUIsRUFBRSxZQUFZLEVBQUUsY0FBYyxFQUFFLHdCQUF3QixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDNUosT0FBTyxFQUFXLGlCQUFpQixFQUFDLE1BQU0sT0FBTyxDQUFDO0FBQ2xELE9BQU8sRUFBQyxnQkFBZ0IsRUFBa0MsTUFBTSxzQkFBc0IsQ0FBQztBQUN2RixPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFJOUMsT0FBTyxFQUFZLGdCQUFnQixFQUFDLE1BQU0sZUFBZSxDQUFDO0FBRTFELE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQztBQUNwRCxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxhQUFhLENBQUM7QUFDOUMsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQzlDLE9BQU8sRUFBQyx5QkFBeUIsRUFBRSwwQkFBMEIsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBRXpGLE9BQU8sRUFBQyxnQkFBZ0IsRUFBRSxrQkFBa0IsRUFBRSxxQkFBcUIsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNyRixPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBQ3RDLE9BQU8sRUFBQyxrQkFBa0IsRUFBRSxhQUFhLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFDMUQsT0FBTyxFQUFDLGNBQWMsRUFBRSxpQkFBaUIsRUFBRSxpQ0FBaUMsRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUM1RixPQUFPLEVBQWUsYUFBYSxFQUFFLG9CQUFvQixFQUFzSSxRQUFRLEVBQXNDLE1BQU0sU0FBUyxDQUFDO0FBQzdQLE9BQU8sRUFBQyxlQUFlLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxpQkFBaUIsRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFFLFlBQVksRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUNsSCxPQUFPLEVBQUMsa0JBQWtCLEVBQUUsa0JBQWtCLEVBQUUsa0JBQWtCLEVBQUUsa0JBQWtCLEVBQUUsbUJBQW1CLEVBQUUsa0JBQWtCLEVBQUUsY0FBYyxFQUFFLFdBQVcsRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUc1SyxJQUFJLFdBQVcsR0FBRyxLQUFLLENBQUM7QUFFeEIsTUFBTSxVQUFVLG9CQUFvQjtJQUNsQyxJQUFJLFdBQVcsRUFBRTtRQUNmLE9BQU87S0FDUjtJQUNELFdBQVcsR0FBRyxJQUFJLENBQUM7SUFDbkIsTUFBTSxRQUFRLEdBQUcsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDLG1CQUFtQixFQUFFLENBQUMsQ0FBQyxDQUFDLGtCQUFrQixFQUFFLENBQUM7SUFDNUUsUUFBUSxDQUFDLGNBQWMsR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDO0lBQ2xELFFBQVEsQ0FBQyxjQUFjLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQztJQUNsRCxRQUFRLENBQUMsa0JBQWtCLEdBQUcsUUFBUSxDQUFDLGtCQUFrQixDQUFDO0lBQzFELFFBQVEsQ0FBQyxtQkFBbUIsR0FBRyxRQUFRLENBQUMsbUJBQW1CLENBQUM7SUFDNUQsUUFBUSxDQUFDLGlCQUFpQixHQUFHLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQztJQUN4RCxRQUFRLENBQUMsZ0JBQWdCLEdBQUcsUUFBUSxDQUFDLGdCQUFnQixDQUFDO0lBQ3RELFFBQVEsQ0FBQyxxQkFBcUIsR0FBRyxRQUFRLENBQUMscUJBQXFCLENBQUM7SUFDaEUsUUFBUSxDQUFDLGNBQWMsR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDO0lBQ2xELFFBQVEsQ0FBQyxrQkFBa0IsR0FBRyxRQUFRLENBQUMsa0JBQWtCLENBQUM7SUFDMUQsUUFBUSxDQUFDLGtCQUFrQixHQUFHLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQztJQUMxRCxRQUFRLENBQUMsV0FBVyxHQUFHLFFBQVEsQ0FBQyxXQUFXLENBQUM7SUFDNUMsUUFBUSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUM7SUFDakMsUUFBUSxDQUFDLGtCQUFrQixHQUFHLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQztJQUMxRCxRQUFRLENBQUMsV0FBVyxHQUFHLFFBQVEsQ0FBQyxXQUFXLENBQUM7SUFDNUMsUUFBUSxDQUFDLGdCQUFnQixHQUFHLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQztJQUN0RCxRQUFRLENBQUMsY0FBYyxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUM7SUFDbEQsUUFBUSxDQUFDLGtCQUFrQixHQUFHLGtCQUFrQixDQUFDO0FBQ25ELENBQUM7QUFFRCxTQUFTLGtCQUFrQjtJQUN6QixPQUFPO1FBQ0wsY0FBYyxFQUFFLEdBQUcsRUFBRSxHQUFFLENBQUM7UUFDeEIsY0FBYyxFQUFFLGtCQUFrQjtRQUNsQyxrQkFBa0IsRUFBRSxrQkFBa0I7UUFDdEMsbUJBQW1CLEVBQUUsbUJBQW1CO1FBQ3hDLGlCQUFpQixFQUFFLGlCQUFpQjtRQUNwQyxnQkFBZ0IsRUFBRSxJQUFJO1FBQ3RCLHFCQUFxQixFQUFFLElBQUk7UUFDM0IsY0FBYyxFQUFFLElBQUk7UUFDcEIsa0JBQWtCLEVBQUUsa0JBQWtCO1FBQ3RDLGtCQUFrQixFQUFFLGtCQUFrQjtRQUN0QyxXQUFXLEVBQUUsV0FBVztRQUN4QixrQkFBa0IsRUFBRSxDQUFDLElBQWMsRUFBRSxTQUFpQixFQUFFLEVBQUUsQ0FBQyxJQUFJLGFBQWEsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDO1FBQzdGLFdBQVcsRUFBRSxDQUFDLElBQWMsRUFBRSxTQUFpQixFQUFFLFNBQWlCLEVBQUUsS0FBVSxFQUFFLEVBQUUsQ0FDOUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsS0FBSyxDQUFDO1FBQzNELGdCQUFnQixFQUFFLENBQUMsSUFBYyxFQUFFLFNBQW9CLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQ2pGLFNBQVMsMkJBQTZCLENBQUMsQ0FBQyxDQUFDLHNCQUFzQixDQUFDLENBQUMsQ0FBQyxzQkFBc0IsRUFDeEYsSUFBSSxDQUFDO1FBQ1QsY0FBYyxFQUFFLENBQUMsSUFBYyxFQUFFLFNBQW9CLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUM3RSxTQUFTLDJCQUE2QixDQUFDLENBQUMsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLENBQUMsc0JBQXNCLEVBQ3hGLElBQUksQ0FBQztLQUNWLENBQUM7QUFDSixDQUFDO0FBRUQsU0FBUyxtQkFBbUI7SUFDMUIsT0FBTztRQUNMLGNBQWMsRUFBRSxtQkFBbUI7UUFDbkMsY0FBYyxFQUFFLG1CQUFtQjtRQUNuQyxrQkFBa0IsRUFBRSx1QkFBdUI7UUFDM0MsbUJBQW1CLEVBQUUsd0JBQXdCO1FBQzdDLGlCQUFpQixFQUFFLHNCQUFzQjtRQUN6QyxnQkFBZ0IsRUFBRSxxQkFBcUI7UUFDdkMscUJBQXFCLEVBQUUsMEJBQTBCO1FBQ2pELGNBQWMsRUFBRSxtQkFBbUI7UUFDbkMsa0JBQWtCLEVBQUUsdUJBQXVCO1FBQzNDLGtCQUFrQixFQUFFLHVCQUF1QjtRQUMzQyxXQUFXLEVBQUUsZ0JBQWdCO1FBQzdCLGtCQUFrQixFQUFFLENBQUMsSUFBYyxFQUFFLFNBQWlCLEVBQUUsRUFBRSxDQUFDLElBQUksYUFBYSxDQUFDLElBQUksRUFBRSxTQUFTLENBQUM7UUFDN0YsV0FBVyxFQUFFLGdCQUFnQjtRQUM3QixnQkFBZ0IsRUFBRSxxQkFBcUI7UUFDdkMsY0FBYyxFQUFFLG1CQUFtQjtLQUNwQyxDQUFDO0FBQ0osQ0FBQztBQUVELFNBQVMsa0JBQWtCLENBQ3ZCLFVBQW9CLEVBQUUsZ0JBQXlCLEVBQUUsa0JBQThCLEVBQy9FLEdBQW1CLEVBQUUsUUFBMEIsRUFBRSxPQUFhO0lBQ2hFLE1BQU0sZUFBZSxHQUFxQixRQUFRLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0lBQ2xGLE9BQU8sY0FBYyxDQUNqQixjQUFjLENBQUMsVUFBVSxFQUFFLFFBQVEsRUFBRSxlQUFlLEVBQUUsZ0JBQWdCLEVBQUUsa0JBQWtCLENBQUMsRUFDM0YsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQ3BCLENBQUM7QUFFRCxTQUFTLG1CQUFtQixDQUN4QixVQUFvQixFQUFFLGdCQUF5QixFQUFFLGtCQUE4QixFQUMvRSxHQUFtQixFQUFFLFFBQTBCLEVBQUUsT0FBYTtJQUNoRSxNQUFNLGVBQWUsR0FBcUIsUUFBUSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztJQUNsRixNQUFNLElBQUksR0FBRyxjQUFjLENBQ3ZCLFVBQVUsRUFBRSxRQUFRLEVBQUUsSUFBSSxxQkFBcUIsQ0FBQyxlQUFlLENBQUMsRUFBRSxnQkFBZ0IsRUFDbEYsa0JBQWtCLENBQUMsQ0FBQztJQUN4QixNQUFNLGVBQWUsR0FBRyw0QkFBNEIsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUMxRCxPQUFPLG9CQUFvQixDQUN2QixXQUFXLENBQUMsTUFBTSxFQUFFLGNBQWMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxJQUFJLEVBQUUsZUFBZSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7QUFDbEYsQ0FBQztBQUVELFNBQVMsY0FBYyxDQUNuQixVQUFvQixFQUFFLFFBQTBCLEVBQUUsZUFBaUMsRUFDbkYsZ0JBQXlCLEVBQUUsa0JBQXVCO0lBQ3BELE1BQU0sU0FBUyxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ25ELE1BQU0sWUFBWSxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDO0lBQ3pELE1BQU0sUUFBUSxHQUFHLGVBQWUsQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzVELE9BQU87UUFDTCxRQUFRO1FBQ1IsUUFBUSxFQUFFLFVBQVU7UUFDcEIsZ0JBQWdCO1FBQ2hCLGNBQWMsRUFBRSxrQkFBa0I7UUFDbEMsU0FBUztRQUNULGVBQWU7UUFDZixRQUFRO1FBQ1IsWUFBWTtLQUNiLENBQUM7QUFDSixDQUFDO0FBRUQsU0FBUyx1QkFBdUIsQ0FDNUIsVUFBb0IsRUFBRSxTQUFrQixFQUFFLE9BQXVCLEVBQUUsT0FBYTtJQUNsRixNQUFNLGVBQWUsR0FBRyw0QkFBNEIsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUM5RCxPQUFPLG9CQUFvQixDQUN2QixXQUFXLENBQUMsTUFBTSxFQUFFLGtCQUFrQixFQUFFLElBQUksRUFDNUMsQ0FBQyxVQUFVLEVBQUUsU0FBUyxFQUFFLGVBQWUsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO0FBQ3pELENBQUM7QUFFRCxTQUFTLHdCQUF3QixDQUM3QixVQUFvQixFQUFFLE9BQWdCLEVBQUUsT0FBdUIsRUFBRSxXQUFnQjtJQUNuRixNQUFNLHFCQUFxQixHQUN2QixnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQVEsQ0FBQyxpQkFBa0IsQ0FBQyxRQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDOUUsSUFBSSxxQkFBcUIsRUFBRTtRQUN6QixPQUFPLEdBQUcscUJBQXFCLENBQUM7S0FDakM7U0FBTTtRQUNMLE9BQU8sR0FBRyw0QkFBNEIsQ0FBQyxPQUFPLENBQUMsQ0FBQztLQUNqRDtJQUNELE9BQU8sb0JBQW9CLENBQ3ZCLFdBQVcsQ0FBQyxNQUFNLEVBQUUsbUJBQW1CLEVBQUUsSUFBSSxFQUFFLENBQUMsVUFBVSxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQztBQUNsRyxDQUFDO0FBRUQsU0FBUyxzQkFBc0IsQ0FDM0IsVUFBcUIsRUFBRSxjQUF3QixFQUFFLG1CQUFnQyxFQUNqRixHQUF1QjtJQUN6QixNQUFNLGVBQWUsR0FBRyxnQ0FBZ0MsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUM5RCxPQUFPLGlCQUFpQixDQUFDLFVBQVUsRUFBRSxjQUFjLEVBQUUsbUJBQW1CLEVBQUUsZUFBZSxDQUFDLENBQUM7QUFDN0YsQ0FBQztBQUVELE1BQU0saUJBQWlCLEdBQUcsSUFBSSxHQUFHLEVBQXlCLENBQUM7QUFDM0QsTUFBTSwwQkFBMEIsR0FBRyxJQUFJLEdBQUcsRUFBeUMsQ0FBQztBQUNwRixNQUFNLGdCQUFnQixHQUFHLElBQUksR0FBRyxFQUF1QixDQUFDO0FBRXhELFNBQVMscUJBQXFCLENBQUMsUUFBMEI7SUFDdkQsaUJBQWlCLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDaEQsSUFBSSxhQUF3QyxDQUFDO0lBQzdDLElBQUksT0FBTyxRQUFRLENBQUMsS0FBSyxLQUFLLFVBQVUsSUFBSSxDQUFDLGFBQWEsR0FBRyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDMUYsT0FBTyxhQUFhLENBQUMsVUFBVSxLQUFLLFVBQVUsRUFBRTtRQUNsRCwwQkFBMEIsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEtBQTRCLEVBQUUsUUFBUSxDQUFDLENBQUM7S0FDakY7QUFDSCxDQUFDO0FBRUQsU0FBUywwQkFBMEIsQ0FBQyxJQUFTLEVBQUUsV0FBa0M7SUFDL0UsTUFBTSxXQUFXLEdBQUcsaUJBQWlCLENBQUMsaUNBQWlDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztJQUN0RixNQUFNLFdBQVcsR0FBRyxpQkFBaUIsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQVEsQ0FBQyxhQUFjLENBQUMsQ0FBQztJQUNwRixnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLFdBQVcsQ0FBQyxDQUFDO0FBQzFDLENBQUM7QUFFRCxTQUFTLG1CQUFtQjtJQUMxQixpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUMxQiwwQkFBMEIsQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUNuQyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUMzQixDQUFDO0FBRUQsNkJBQTZCO0FBQzdCLGlGQUFpRjtBQUNqRiwwQ0FBMEM7QUFDMUMsRUFBRTtBQUNGLHVFQUF1RTtBQUN2RSxjQUFjO0FBQ2QsU0FBUyw0QkFBNEIsQ0FBQyxHQUFtQjtJQUN2RCxJQUFJLGlCQUFpQixDQUFDLElBQUksS0FBSyxDQUFDLEVBQUU7UUFDaEMsT0FBTyxHQUFHLENBQUM7S0FDWjtJQUNELE1BQU0sc0NBQXNDLEdBQUcsMENBQTBDLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDL0YsSUFBSSxzQ0FBc0MsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1FBQ3ZELE9BQU8sR0FBRyxDQUFDO0tBQ1o7SUFDRCxtQ0FBbUM7SUFDbkMsd0VBQXdFO0lBQ3hFLEdBQUcsR0FBRyxHQUFHLENBQUMsT0FBUSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQy9CLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxzQ0FBc0MsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDdEUsK0JBQStCLENBQUMsR0FBRyxFQUFFLHNDQUFzQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDakY7SUFDRCxPQUFPLEdBQUcsQ0FBQztJQUVYLFNBQVMsMENBQTBDLENBQUMsR0FBbUI7UUFDckUsTUFBTSxpQ0FBaUMsR0FBYSxFQUFFLENBQUM7UUFDdkQsSUFBSSxjQUFjLEdBQWlCLElBQUksQ0FBQztRQUN4QyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDekMsTUFBTSxPQUFPLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM3QixJQUFJLE9BQU8sQ0FBQyxLQUFLLHNCQUF3QixFQUFFO2dCQUN6QyxjQUFjLEdBQUcsT0FBTyxDQUFDO2FBQzFCO1lBQ0QsSUFBSSxjQUFjLElBQUksT0FBTyxDQUFDLEtBQUssb0NBQW1DO2dCQUNsRSxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLFFBQVMsQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDbEQsaUNBQWlDLENBQUMsSUFBSSxDQUFDLGNBQWUsQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDbEUsY0FBYyxHQUFHLElBQUksQ0FBQzthQUN2QjtTQUNGO1FBQ0QsT0FBTyxpQ0FBaUMsQ0FBQztJQUMzQyxDQUFDO0lBRUQsU0FBUywrQkFBK0IsQ0FBQyxPQUF1QixFQUFFLE9BQWU7UUFDL0UsS0FBSyxJQUFJLENBQUMsR0FBRyxPQUFPLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUN2RCxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2pDLElBQUksT0FBTyxDQUFDLEtBQUssc0JBQXdCLEVBQUU7Z0JBQ3pDLDJCQUEyQjtnQkFDM0IsT0FBTzthQUNSO1lBQ0QsSUFBSSxPQUFPLENBQUMsS0FBSyxvQ0FBbUMsRUFBRTtnQkFDcEQsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLFFBQVMsQ0FBQztnQkFDbkMsTUFBTSxRQUFRLEdBQUcsaUJBQWlCLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDdkQsSUFBSSxRQUFRLEVBQUU7b0JBQ1osT0FBTyxDQUFDLEtBQUssR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEdBQUcsa0NBQWlDLENBQUMsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDO29CQUNyRixRQUFRLENBQUMsSUFBSSxHQUFHLFlBQVksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQzVDLFFBQVEsQ0FBQyxLQUFLLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQztpQkFDakM7YUFDRjtTQUNGO0lBQ0gsQ0FBQztBQUNILENBQUM7QUFFRCw2QkFBNkI7QUFDN0IsdUVBQXVFO0FBQ3ZFLGNBQWM7QUFDZCxTQUFTLGdDQUFnQyxDQUFDLEdBQXVCO0lBQy9ELE1BQU0sRUFBQyxZQUFZLEVBQUUsc0JBQXNCLEVBQUMsR0FBRyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNyRSxJQUFJLENBQUMsWUFBWSxFQUFFO1FBQ2pCLE9BQU8sR0FBRyxDQUFDO0tBQ1o7SUFDRCxtQ0FBbUM7SUFDbkMsd0VBQXdFO0lBQ3hFLEdBQUcsR0FBRyxHQUFHLENBQUMsT0FBUSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQy9CLHNCQUFzQixDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQzVCLE9BQU8sR0FBRyxDQUFDO0lBRVgsU0FBUyxnQkFBZ0IsQ0FBQyxHQUF1QjtRQUUvQyxJQUFJLFlBQVksR0FBRyxLQUFLLENBQUM7UUFDekIsSUFBSSxzQkFBc0IsR0FBRyxLQUFLLENBQUM7UUFDbkMsSUFBSSxpQkFBaUIsQ0FBQyxJQUFJLEtBQUssQ0FBQyxFQUFFO1lBQ2hDLE9BQU8sRUFBQyxZQUFZLEVBQUUsc0JBQXNCLEVBQUMsQ0FBQztTQUMvQztRQUNELEdBQUcsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQzNCLE1BQU0sUUFBUSxHQUFHLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDbkQsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLG9DQUFtQyxDQUFDLElBQUksUUFBUSxFQUFFO2dCQUMvRCxZQUFZLEdBQUcsSUFBSSxDQUFDO2dCQUNwQixzQkFBc0IsR0FBRyxzQkFBc0IsSUFBSSxRQUFRLENBQUMsa0JBQWtCLENBQUM7YUFDaEY7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUNILEdBQUcsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFO1lBQzNCLDBCQUEwQixDQUFDLE9BQU8sQ0FBQyxDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsRUFBRTtnQkFDckQsSUFBSSxpQkFBaUIsQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUUsQ0FBQyxVQUFVLENBQUMsS0FBSyxNQUFNLEVBQUU7b0JBQ3JFLFlBQVksR0FBRyxJQUFJLENBQUM7b0JBQ3BCLHNCQUFzQixHQUFHLHNCQUFzQixJQUFJLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQztpQkFDaEY7WUFDSCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBQ0gsT0FBTyxFQUFDLFlBQVksRUFBRSxzQkFBc0IsRUFBQyxDQUFDO0lBQ2hELENBQUM7SUFFRCxTQUFTLHNCQUFzQixDQUFDLEdBQXVCO1FBQ3JELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUM3QyxNQUFNLFFBQVEsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2xDLElBQUksc0JBQXNCLEVBQUU7Z0JBQzFCLDZCQUE2QjtnQkFDN0Isb0RBQW9EO2dCQUNwRCxnQ0FBZ0M7Z0JBQ2hDLFFBQVEsQ0FBQyxLQUFLLDJCQUEwQixDQUFDO2FBQzFDO1lBQ0QsTUFBTSxRQUFRLEdBQUcsaUJBQWlCLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN2RCxJQUFJLFFBQVEsRUFBRTtnQkFDWixRQUFRLENBQUMsS0FBSyxHQUFHLENBQUMsUUFBUSxDQUFDLEtBQUssR0FBRyxrQ0FBaUMsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUM7Z0JBQ3ZGLFFBQVEsQ0FBQyxJQUFJLEdBQUcsWUFBWSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDNUMsUUFBUSxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDO2FBQ2pDO1NBQ0Y7UUFDRCxJQUFJLDBCQUEwQixDQUFDLElBQUksR0FBRyxDQUFDLEVBQUU7WUFDdkMsSUFBSSxTQUFTLEdBQUcsSUFBSSxHQUFHLENBQU0sR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzFDLDBCQUEwQixDQUFDLE9BQU8sQ0FBQyxDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsRUFBRTtnQkFDckQsSUFBSSxTQUFTLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUU7b0JBQ3pFLElBQUksUUFBUSxHQUFHO3dCQUNiLEtBQUssRUFBRSxLQUFLO3dCQUNaLEtBQUssRUFDRCxRQUFRLENBQUMsS0FBSyxHQUFHLENBQUMsc0JBQXNCLENBQUMsQ0FBQyx5QkFBd0IsQ0FBQyxhQUFlLENBQUM7d0JBQ3ZGLElBQUksRUFBRSxZQUFZLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQzt3QkFDakMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxLQUFLO3dCQUNyQixLQUFLLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxNQUFNO3FCQUM1QixDQUFDO29CQUNGLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO29CQUM3QixHQUFHLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLFFBQVEsQ0FBQztpQkFDaEQ7WUFDSCxDQUFDLENBQUMsQ0FBQztTQUNKO0lBQ0gsQ0FBQztBQUNILENBQUM7QUFFRCxTQUFTLHNCQUFzQixDQUMzQixJQUFjLEVBQUUsVUFBa0IsRUFBRSxRQUFzQixFQUFFLEVBQVEsRUFBRSxFQUFRLEVBQUUsRUFBUSxFQUN4RixFQUFRLEVBQUUsRUFBUSxFQUFFLEVBQVEsRUFBRSxFQUFRLEVBQUUsRUFBUSxFQUFFLEVBQVEsRUFBRSxFQUFRO0lBQ3RFLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQzNDLGtCQUFrQixDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ3BGLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyw4QkFBOEIsQ0FBQyxDQUFDLENBQUM7UUFDbEQsb0JBQW9CLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzlDLFNBQVMsQ0FBQztBQUNoQixDQUFDO0FBRUQsU0FBUyxzQkFBc0IsQ0FDM0IsSUFBYyxFQUFFLFVBQWtCLEVBQUUsUUFBc0IsRUFBRSxFQUFRLEVBQUUsRUFBUSxFQUFFLEVBQVEsRUFDeEYsRUFBUSxFQUFFLEVBQVEsRUFBRSxFQUFRLEVBQUUsRUFBUSxFQUFFLEVBQVEsRUFBRSxFQUFRLEVBQUUsRUFBUTtJQUN0RSxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUMzQyxrQkFBa0IsQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUNwRixPQUFPLENBQUMsT0FBTyxDQUFDLEtBQUssOEJBQThCLENBQUMsQ0FBQyxDQUFDO1FBQ2xELG9CQUFvQixDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUM5QyxTQUFTLENBQUM7QUFDaEIsQ0FBQztBQUVELFNBQVMsdUJBQXVCLENBQUMsSUFBYztJQUM3QyxPQUFPLG9CQUFvQixDQUFDLFdBQVcsQ0FBQyxhQUFhLEVBQUUsa0JBQWtCLEVBQUUsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUMzRixDQUFDO0FBRUQsU0FBUyx1QkFBdUIsQ0FBQyxJQUFjO0lBQzdDLE9BQU8sb0JBQW9CLENBQUMsV0FBVyxDQUFDLGNBQWMsRUFBRSxrQkFBa0IsRUFBRSxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQzVGLENBQUM7QUFFRCxTQUFTLGdCQUFnQixDQUFDLElBQWM7SUFDdEMsT0FBTyxvQkFBb0IsQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQzlFLENBQUM7QUFFRCxJQUFLLFdBTUo7QUFORCxXQUFLLFdBQVc7SUFDZCxpREFBTSxDQUFBO0lBQ04sK0RBQWEsQ0FBQTtJQUNiLGlFQUFjLENBQUE7SUFDZCxtREFBTyxDQUFBO0lBQ1AsMkRBQVcsQ0FBQTtBQUNiLENBQUMsRUFOSSxXQUFXLEtBQVgsV0FBVyxRQU1mO0FBRUQsSUFBSSxjQUEyQixDQUFDO0FBQ2hDLElBQUksWUFBc0IsQ0FBQztBQUMzQixJQUFJLGlCQUE4QixDQUFDO0FBRW5DLFNBQVMsbUJBQW1CLENBQUMsSUFBYyxFQUFFLFNBQXNCO0lBQ2pFLFlBQVksR0FBRyxJQUFJLENBQUM7SUFDcEIsaUJBQWlCLEdBQUcsU0FBUyxDQUFDO0FBQ2hDLENBQUM7QUFFRCxTQUFTLGdCQUFnQixDQUFDLElBQWMsRUFBRSxTQUFpQixFQUFFLFNBQWlCLEVBQUUsS0FBVTtJQUN4RixtQkFBbUIsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDckMsT0FBTyxvQkFBb0IsQ0FDdkIsV0FBVyxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO0FBQ2hHLENBQUM7QUFFRCxTQUFTLHFCQUFxQixDQUFDLElBQWMsRUFBRSxTQUFvQjtJQUNqRSxJQUFJLElBQUksQ0FBQyxLQUFLLHNCQUFzQixFQUFFO1FBQ3BDLE1BQU0sa0JBQWtCLENBQUMsV0FBVyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7S0FDdkQ7SUFDRCxtQkFBbUIsQ0FBQyxJQUFJLEVBQUUsd0JBQXdCLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDN0QsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLHNCQUFzQixFQUFFLElBQUksQ0FBQyxDQUFDO0lBRS9ELFNBQVMsc0JBQXNCLENBQzNCLElBQWMsRUFBRSxTQUFpQixFQUFFLFFBQXNCLEVBQUUsR0FBRyxNQUFhO1FBQzdFLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzFDLElBQUksU0FBUywyQkFBNkIsRUFBRTtZQUMxQyx1QkFBdUIsQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQztTQUMxRDthQUFNO1lBQ0wsdUJBQXVCLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUM7U0FDMUQ7UUFDRCxJQUFJLE9BQU8sQ0FBQyxLQUFLLDRCQUEwQixFQUFFO1lBQzNDLG1CQUFtQixDQUFDLElBQUksRUFBRSx3QkFBd0IsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQztTQUN0RTtRQUNELE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyw4QkFBOEIsQ0FBQyxDQUFDLENBQUM7WUFDbEQsb0JBQW9CLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNyRCxTQUFTLENBQUM7SUFDaEIsQ0FBQztBQUNILENBQUM7QUFFRCxTQUFTLG1CQUFtQixDQUFDLElBQWMsRUFBRSxTQUFvQjtJQUMvRCxJQUFJLElBQUksQ0FBQyxLQUFLLHNCQUFzQixFQUFFO1FBQ3BDLE1BQU0sa0JBQWtCLENBQUMsV0FBVyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7S0FDdkQ7SUFDRCxtQkFBbUIsQ0FBQyxJQUFJLEVBQUUseUJBQXlCLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDOUQsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxzQkFBc0IsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUU3RCxTQUFTLHNCQUFzQixDQUMzQixJQUFjLEVBQUUsU0FBaUIsRUFBRSxRQUFzQixFQUFFLEdBQUcsTUFBYTtRQUM3RSxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUMxQyxJQUFJLFNBQVMsMkJBQTZCLEVBQUU7WUFDMUMsdUJBQXVCLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUM7U0FDMUQ7YUFBTTtZQUNMLHVCQUF1QixDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1NBQzFEO1FBQ0QsSUFBSSxPQUFPLENBQUMsS0FBSyx3QkFBMEIsRUFBRTtZQUMzQyxtQkFBbUIsQ0FBQyxJQUFJLEVBQUUseUJBQXlCLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7U0FDdkU7UUFDRCxPQUFPLENBQUMsT0FBTyxDQUFDLEtBQUssOEJBQThCLENBQUMsQ0FBQyxDQUFDO1lBQ2xELG9CQUFvQixDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDckQsU0FBUyxDQUFDO0lBQ2hCLENBQUM7QUFDSCxDQUFDO0FBRUQsU0FBUyx1QkFBdUIsQ0FDNUIsSUFBYyxFQUFFLE9BQWdCLEVBQUUsUUFBc0IsRUFBRSxXQUFrQjtJQUM5RSxNQUFNLE9BQU8sR0FBUyxrQkFBbUIsQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxHQUFHLFdBQVcsQ0FBQyxDQUFDO0lBQ25GLElBQUksT0FBTyxFQUFFO1FBQ1gsTUFBTSxNQUFNLEdBQUcsUUFBUSxvQkFBeUIsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUM7UUFDaEYsSUFBSSxPQUFPLENBQUMsS0FBSyw0QkFBMEIsRUFBRTtZQUMzQyxNQUFNLGFBQWEsR0FBNEIsRUFBRSxDQUFDO1lBQ2xELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDaEQsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDcEMsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN4QixJQUFJLE9BQU8sQ0FBQyxLQUFLLHVCQUE0QixFQUFFO29CQUM3QyxhQUFhLENBQUMseUJBQXlCLENBQUMsT0FBTyxDQUFDLGVBQWdCLENBQUMsQ0FBQzt3QkFDOUQsMEJBQTBCLENBQUMsS0FBSyxDQUFDLENBQUM7aUJBQ3ZDO2FBQ0Y7WUFDRCxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsTUFBTyxDQUFDO1lBQzlCLE1BQU0sRUFBRSxHQUFHLGFBQWEsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLGFBQWEsQ0FBQztZQUM5RCxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQVEsQ0FBQyxJQUFJLEVBQUU7Z0JBQ3hCLGFBQWE7Z0JBQ2IsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQ2xCLEVBQUUsRUFBRSxpQkFBaUIsQ0FBQyxZQUFZLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQzthQUNsRjtpQkFBTTtnQkFDTCxxQkFBcUI7Z0JBQ3JCLEtBQUssSUFBSSxJQUFJLElBQUksYUFBYSxFQUFFO29CQUM5QixNQUFNLEtBQUssR0FBRyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ2xDLElBQUksS0FBSyxJQUFJLElBQUksRUFBRTt3QkFDakIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztxQkFDN0M7eUJBQU07d0JBQ0wsSUFBSSxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO3FCQUN6QztpQkFDRjthQUNGO1NBQ0Y7S0FDRjtBQUNILENBQUM7QUFFRCxTQUFTLHVCQUF1QixDQUM1QixJQUFjLEVBQUUsT0FBZ0IsRUFBRSxRQUFzQixFQUFFLE1BQWE7SUFDbkUsa0JBQW1CLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsR0FBRyxNQUFNLENBQUMsQ0FBQztBQUNoRSxDQUFDO0FBRUQsU0FBUyx3QkFBd0IsQ0FBQyxJQUFjLEVBQUUsU0FBaUI7SUFDakUsS0FBSyxJQUFJLENBQUMsR0FBRyxTQUFTLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUN0RCxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNsQyxJQUFJLE9BQU8sQ0FBQyxLQUFLLDRCQUEwQixJQUFJLE9BQU8sQ0FBQyxRQUFRLElBQUksT0FBTyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUU7WUFDMUYsT0FBTyxDQUFDLENBQUM7U0FDVjtLQUNGO0lBQ0QsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBRUQsU0FBUyx5QkFBeUIsQ0FBQyxJQUFjLEVBQUUsU0FBaUI7SUFDbEUsS0FBSyxJQUFJLENBQUMsR0FBRyxTQUFTLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUN0RCxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNsQyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssd0JBQTBCLENBQUMsSUFBSSxPQUFPLENBQUMsUUFBUSxJQUFJLE9BQU8sQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFO1lBQzVGLE9BQU8sQ0FBQyxDQUFDO1NBQ1Y7S0FDRjtJQUNELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQUVELE1BQU0sYUFBYTtJQUtqQixZQUFtQixJQUFjLEVBQVMsU0FBc0I7UUFBN0MsU0FBSSxHQUFKLElBQUksQ0FBVTtRQUFTLGNBQVMsR0FBVCxTQUFTLENBQWE7UUFDOUQsSUFBSSxTQUFTLElBQUksSUFBSSxFQUFFO1lBQ3JCLElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxHQUFHLENBQUMsQ0FBQztTQUNoQztRQUNELElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDekMsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUN6QixJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUM7UUFDbEIsT0FBTyxLQUFLLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxzQkFBd0IsQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUMzRCxLQUFLLEdBQUcsS0FBSyxDQUFDLE1BQU8sQ0FBQztTQUN2QjtRQUNELElBQUksQ0FBQyxLQUFLLEVBQUU7WUFDVixPQUFPLENBQUMsS0FBSyxJQUFJLE1BQU0sRUFBRTtnQkFDdkIsS0FBSyxHQUFHLFlBQVksQ0FBQyxNQUFNLENBQUUsQ0FBQztnQkFDOUIsTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFPLENBQUM7YUFDekI7U0FDRjtRQUNELElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBQ25CLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO0lBQ3ZCLENBQUM7SUFFRCxJQUFZLFlBQVk7UUFDdEIsdUZBQXVGO1FBQ3ZGLE9BQU8sYUFBYSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxhQUFhLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQztJQUNyRixDQUFDO0lBRUQsSUFBSSxRQUFRO1FBQ1YsT0FBTyxjQUFjLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDakQsQ0FBQztJQUVELElBQUksU0FBUztRQUNYLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUM7SUFDckMsQ0FBQztJQUVELElBQUksT0FBTztRQUNULE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUM7SUFDbkMsQ0FBQztJQUVELElBQUksY0FBYztRQUNoQixNQUFNLE1BQU0sR0FBVSxFQUFFLENBQUM7UUFDekIsSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFO1lBQ2QsS0FBSyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxFQUNuRixDQUFDLEVBQUUsRUFBRTtnQkFDUixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzFDLElBQUksUUFBUSxDQUFDLEtBQUssMEJBQXdCLEVBQUU7b0JBQzFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztpQkFDdkM7Z0JBQ0QsQ0FBQyxJQUFJLFFBQVEsQ0FBQyxVQUFVLENBQUM7YUFDMUI7U0FDRjtRQUNELE9BQU8sTUFBTSxDQUFDO0lBQ2hCLENBQUM7SUFFRCxJQUFJLFVBQVU7UUFDWixNQUFNLFVBQVUsR0FBeUIsRUFBRSxDQUFDO1FBQzVDLElBQUksSUFBSSxDQUFDLEtBQUssRUFBRTtZQUNkLGlCQUFpQixDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsQ0FBQztZQUV2RCxLQUFLLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQ25GLENBQUMsRUFBRSxFQUFFO2dCQUNSLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDMUMsSUFBSSxRQUFRLENBQUMsS0FBSywwQkFBd0IsRUFBRTtvQkFDMUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsVUFBVSxDQUFDLENBQUM7aUJBQ3REO2dCQUNELENBQUMsSUFBSSxRQUFRLENBQUMsVUFBVSxDQUFDO2FBQzFCO1NBQ0Y7UUFDRCxPQUFPLFVBQVUsQ0FBQztJQUNwQixDQUFDO0lBRUQsSUFBSSxzQkFBc0I7UUFDeEIsTUFBTSxNQUFNLEdBQUcsZUFBZSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUNsRCxPQUFPLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO0lBQ25ELENBQUM7SUFFRCxJQUFJLFVBQVU7UUFDWixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxtQkFBcUIsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDckMsVUFBVSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3ZGLENBQUM7SUFFRCxRQUFRLENBQUMsT0FBZ0IsRUFBRSxHQUFHLE1BQWE7UUFDekMsSUFBSSxVQUEwQixDQUFDO1FBQy9CLElBQUksWUFBb0IsQ0FBQztRQUN6QixJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxtQkFBcUIsRUFBRTtZQUMzQyxVQUFVLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7WUFDM0IsWUFBWSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDO1NBQ3ZDO2FBQU07WUFDTCxVQUFVLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUM7WUFDN0IsWUFBWSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDO1NBQ3JDO1FBQ0QsbUVBQW1FO1FBQ25FLG1EQUFtRDtRQUNuRCxNQUFNLGVBQWUsR0FBRyxrQkFBa0IsQ0FBQyxVQUFVLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDckUsSUFBSSxtQkFBbUIsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUM3QixJQUFJLFVBQVUsR0FBZSxHQUFHLEVBQUU7WUFDaEMsbUJBQW1CLEVBQUUsQ0FBQztZQUN0QixJQUFJLG1CQUFtQixLQUFLLGVBQWUsRUFBRTtnQkFDM0MsT0FBTyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsR0FBRyxNQUFNLENBQUMsQ0FBQzthQUMvQztpQkFBTTtnQkFDTCxPQUFPLElBQUksQ0FBQzthQUNiO1FBQ0gsQ0FBQyxDQUFDO1FBQ0YsVUFBVSxDQUFDLE9BQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUNoQyxJQUFJLG1CQUFtQixHQUFHLGVBQWUsRUFBRTtZQUN6QyxPQUFPLENBQUMsS0FBSyxDQUFDLG1FQUFtRSxDQUFDLENBQUM7WUFDN0UsT0FBTyxDQUFDLEtBQU0sQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDO1NBQ2pDO0lBQ0gsQ0FBQztDQUNGO0FBRUQsU0FBUyxrQkFBa0IsQ0FBQyxPQUF1QixFQUFFLFNBQWlCO0lBQ3BFLElBQUksZUFBZSxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ3pCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxTQUFTLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDbkMsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNqQyxJQUFJLE9BQU8sQ0FBQyxLQUFLLHdCQUEwQixFQUFFO1lBQzNDLGVBQWUsRUFBRSxDQUFDO1NBQ25CO0tBQ0Y7SUFDRCxPQUFPLGVBQWUsQ0FBQztBQUN6QixDQUFDO0FBRUQsU0FBUyxlQUFlLENBQUMsSUFBYztJQUNyQyxPQUFPLElBQUksSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsRUFBRTtRQUNyQyxJQUFJLEdBQUcsSUFBSSxDQUFDLE1BQU8sQ0FBQztLQUNyQjtJQUNELElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRTtRQUNmLE9BQU8sYUFBYSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsWUFBWSxDQUFDLElBQUksQ0FBRSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0tBQ2xFO0lBQ0QsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBRUQsU0FBUyxpQkFBaUIsQ0FBQyxJQUFjLEVBQUUsT0FBZ0IsRUFBRSxVQUFnQztJQUMzRixLQUFLLElBQUksT0FBTyxJQUFJLE9BQU8sQ0FBQyxVQUFVLEVBQUU7UUFDdEMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxHQUFHLGFBQWEsQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLE9BQU8sQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztLQUNqRjtBQUNILENBQUM7QUFFRCxTQUFTLG9CQUFvQixDQUFDLE1BQW1CLEVBQUUsRUFBTyxFQUFFLElBQVMsRUFBRSxJQUFXO0lBQ2hGLE1BQU0sU0FBUyxHQUFHLGNBQWMsQ0FBQztJQUNqQyxNQUFNLE9BQU8sR0FBRyxZQUFZLENBQUM7SUFDN0IsTUFBTSxZQUFZLEdBQUcsaUJBQWlCLENBQUM7SUFDdkMsSUFBSTtRQUNGLGNBQWMsR0FBRyxNQUFNLENBQUM7UUFDeEIsTUFBTSxNQUFNLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDcEMsWUFBWSxHQUFHLE9BQU8sQ0FBQztRQUN2QixpQkFBaUIsR0FBRyxZQUFZLENBQUM7UUFDakMsY0FBYyxHQUFHLFNBQVMsQ0FBQztRQUMzQixPQUFPLE1BQU0sQ0FBQztLQUNmO0lBQUMsT0FBTyxDQUFDLEVBQUU7UUFDVixJQUFJLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFO1lBQ3hDLE1BQU0sQ0FBQyxDQUFDO1NBQ1Q7UUFDRCxNQUFNLHFCQUFxQixDQUFDLENBQUMsRUFBRSxzQkFBc0IsRUFBRyxDQUFDLENBQUM7S0FDM0Q7QUFDSCxDQUFDO0FBRUQsTUFBTSxVQUFVLHNCQUFzQjtJQUNwQyxPQUFPLFlBQVksQ0FBQyxDQUFDLENBQUMsSUFBSSxhQUFhLENBQUMsWUFBWSxFQUFFLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztBQUNsRixDQUFDO0FBRUQsTUFBTSxPQUFPLHFCQUFxQjtJQUNoQyxZQUFvQixRQUEwQjtRQUExQixhQUFRLEdBQVIsUUFBUSxDQUFrQjtJQUFHLENBQUM7SUFFbEQsY0FBYyxDQUFDLE9BQVksRUFBRSxVQUE4QjtRQUN6RCxPQUFPLElBQUksY0FBYyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDO0lBQy9FLENBQUM7SUFFRCxLQUFLO1FBQ0gsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRTtZQUN2QixJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDO1NBQ3ZCO0lBQ0gsQ0FBQztJQUNELEdBQUc7UUFDRCxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFO1lBQ3JCLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFLENBQUM7U0FDckI7SUFDSCxDQUFDO0lBRUQsaUJBQWlCO1FBQ2YsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLGlCQUFpQixFQUFFO1lBQ25DLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1NBQzFDO1FBQ0QsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQy9CLENBQUM7Q0FDRjtBQUVELE1BQU0sT0FBTyxjQUFjO0lBaUJ6QixZQUFvQixRQUFtQjtRQUFuQixhQUFRLEdBQVIsUUFBUSxDQUFXO1FBVnZDOzs7Ozs7O1dBT0c7UUFDSCx3QkFBbUIsR0FBaUQsc0JBQXNCLENBQUM7UUFHekYsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQztJQUNqQyxDQUFDO0lBaEJPLGtCQUFrQixDQUFDLGFBQWtCO1FBQzNDLE9BQU8sSUFBSSxDQUFDLG1CQUFtQixDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBQ2pELENBQUM7SUFnQkQsV0FBVyxDQUFDLElBQVM7UUFDbkIsTUFBTSxTQUFTLEdBQUcsWUFBWSxDQUFDLElBQUksQ0FBRSxDQUFDO1FBQ3RDLHdCQUF3QixDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3BDLElBQUksU0FBUyxZQUFZLG1CQUFtQixFQUFFO1lBQzVDLFNBQVMsQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztTQUNoQztRQUNELElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUU7WUFDN0IsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDakM7SUFDSCxDQUFDO0lBRUQsT0FBTztRQUNMLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDMUIsQ0FBQztJQUVELGFBQWEsQ0FBQyxJQUFZLEVBQUUsU0FBa0I7UUFDNUMsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ3hELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUM3QyxJQUFJLFFBQVEsRUFBRTtZQUNaLE1BQU0sT0FBTyxHQUFHLElBQUksc0JBQXNCLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztZQUM5RCxPQUEwQixDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7WUFDeEMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1NBQ3pCO1FBQ0QsT0FBTyxFQUFFLENBQUM7SUFDWixDQUFDO0lBRUQsYUFBYSxDQUFDLEtBQWE7UUFDekIsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUN0RSxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDbEQsSUFBSSxRQUFRLEVBQUU7WUFDWixjQUFjLENBQUMsSUFBSSxtQkFBbUIsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7U0FDbEU7UUFDRCxPQUFPLE9BQU8sQ0FBQztJQUNqQixDQUFDO0lBRUQsVUFBVSxDQUFDLEtBQWE7UUFDdEIsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDN0MsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQy9DLElBQUksUUFBUSxFQUFFO1lBQ1osY0FBYyxDQUFDLElBQUksbUJBQW1CLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO1NBQy9EO1FBQ0QsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRUQsV0FBVyxDQUFDLE1BQVcsRUFBRSxRQUFhO1FBQ3BDLE1BQU0sT0FBTyxHQUFHLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNyQyxNQUFNLFlBQVksR0FBRyxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDNUMsSUFBSSxPQUFPLElBQUksWUFBWSxJQUFJLE9BQU8sWUFBWSxzQkFBc0IsRUFBRTtZQUN4RSxPQUFPLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxDQUFDO1NBQ2hDO1FBQ0QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQzlDLENBQUM7SUFFRCxZQUFZLENBQUMsTUFBVyxFQUFFLFFBQWEsRUFBRSxRQUFhLEVBQUUsTUFBZ0I7UUFDdEUsTUFBTSxPQUFPLEdBQUcsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3JDLE1BQU0sWUFBWSxHQUFHLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUM1QyxNQUFNLFVBQVUsR0FBRyxZQUFZLENBQUMsUUFBUSxDQUFFLENBQUM7UUFDM0MsSUFBSSxPQUFPLElBQUksWUFBWSxJQUFJLE9BQU8sWUFBWSxzQkFBc0IsRUFBRTtZQUN4RSxPQUFPLENBQUMsWUFBWSxDQUFDLFVBQVUsRUFBRSxZQUFZLENBQUMsQ0FBQztTQUNoRDtRQUVELElBQUksQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ2pFLENBQUM7SUFFRCxXQUFXLENBQUMsTUFBVyxFQUFFLFFBQWE7UUFDcEMsTUFBTSxPQUFPLEdBQUcsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3JDLE1BQU0sWUFBWSxHQUFHLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUM1QyxJQUFJLE9BQU8sSUFBSSxZQUFZLElBQUksT0FBTyxZQUFZLHNCQUFzQixFQUFFO1lBQ3hFLE9BQU8sQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLENBQUM7U0FDbkM7UUFDRCxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDOUMsQ0FBQztJQUVELGlCQUFpQixDQUFDLGNBQTBCLEVBQUUsZUFBeUI7UUFDckUsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxjQUFjLEVBQUUsZUFBZSxDQUFDLENBQUM7UUFDNUUsTUFBTSxRQUFRLEdBQUcsc0JBQXNCLEVBQUUsQ0FBQztRQUMxQyxJQUFJLFFBQVEsRUFBRTtZQUNaLGNBQWMsQ0FBQyxJQUFJLHNCQUFzQixDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQztTQUNoRTtRQUNELE9BQU8sRUFBRSxDQUFDO0lBQ1osQ0FBQztJQUVELFlBQVksQ0FBQyxFQUFPLEVBQUUsSUFBWSxFQUFFLEtBQWEsRUFBRSxTQUFrQjtRQUNuRSxNQUFNLE9BQU8sR0FBRyxZQUFZLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDakMsSUFBSSxPQUFPLElBQUksT0FBTyxZQUFZLHNCQUFzQixFQUFFO1lBQ3hELE1BQU0sUUFBUSxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsU0FBUyxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUMzRCxPQUFPLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxHQUFHLEtBQUssQ0FBQztTQUN0QztRQUNELElBQUksQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQ3pELENBQUM7SUFFRCxlQUFlLENBQUMsRUFBTyxFQUFFLElBQVksRUFBRSxTQUFrQjtRQUN2RCxNQUFNLE9BQU8sR0FBRyxZQUFZLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDakMsSUFBSSxPQUFPLElBQUksT0FBTyxZQUFZLHNCQUFzQixFQUFFO1lBQ3hELE1BQU0sUUFBUSxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsU0FBUyxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUMzRCxPQUFPLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxHQUFHLElBQUksQ0FBQztTQUNyQztRQUNELElBQUksQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDckQsQ0FBQztJQUVELFFBQVEsQ0FBQyxFQUFPLEVBQUUsSUFBWTtRQUM1QixNQUFNLE9BQU8sR0FBRyxZQUFZLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDakMsSUFBSSxPQUFPLElBQUksT0FBTyxZQUFZLHNCQUFzQixFQUFFO1lBQ3hELE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDO1NBQzlCO1FBQ0QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ25DLENBQUM7SUFFRCxXQUFXLENBQUMsRUFBTyxFQUFFLElBQVk7UUFDL0IsTUFBTSxPQUFPLEdBQUcsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ2pDLElBQUksT0FBTyxJQUFJLE9BQU8sWUFBWSxzQkFBc0IsRUFBRTtZQUN4RCxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQztTQUMvQjtRQUNELElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUN0QyxDQUFDO0lBRUQsUUFBUSxDQUFDLEVBQU8sRUFBRSxLQUFhLEVBQUUsS0FBVSxFQUFFLEtBQTBCO1FBQ3JFLE1BQU0sT0FBTyxHQUFHLFlBQVksQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNqQyxJQUFJLE9BQU8sSUFBSSxPQUFPLFlBQVksc0JBQXNCLEVBQUU7WUFDeEQsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxLQUFLLENBQUM7U0FDL0I7UUFDRCxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNsRCxDQUFDO0lBRUQsV0FBVyxDQUFDLEVBQU8sRUFBRSxLQUFhLEVBQUUsS0FBMEI7UUFDNUQsTUFBTSxPQUFPLEdBQUcsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ2pDLElBQUksT0FBTyxJQUFJLE9BQU8sWUFBWSxzQkFBc0IsRUFBRTtZQUN4RCxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLElBQUksQ0FBQztTQUM5QjtRQUNELElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDOUMsQ0FBQztJQUVELFdBQVcsQ0FBQyxFQUFPLEVBQUUsSUFBWSxFQUFFLEtBQVU7UUFDM0MsTUFBTSxPQUFPLEdBQUcsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ2pDLElBQUksT0FBTyxJQUFJLE9BQU8sWUFBWSxzQkFBc0IsRUFBRTtZQUN4RCxPQUFPLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQztTQUNsQztRQUNELElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDN0MsQ0FBQztJQUVELE1BQU0sQ0FDRixNQUF1QyxFQUFFLFNBQWlCLEVBQzFELFFBQWlDO1FBQ25DLElBQUksT0FBTyxNQUFNLEtBQUssUUFBUSxFQUFFO1lBQzlCLE1BQU0sT0FBTyxHQUFHLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNyQyxJQUFJLE9BQU8sRUFBRTtnQkFDWCxPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLGtCQUFrQixDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO2FBQ3JFO1NBQ0Y7UUFFRCxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDM0QsQ0FBQztJQUVELFVBQVUsQ0FBQyxJQUFTO1FBQ2xCLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDeEMsQ0FBQztJQUNELFdBQVcsQ0FBQyxJQUFTO1FBQ25CLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDekMsQ0FBQztJQUNELFFBQVEsQ0FBQyxJQUFTLEVBQUUsS0FBYTtRQUMvQixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztJQUM3QyxDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fLCBEZWJ1Z0V2ZW50TGlzdGVuZXIsIERlYnVnTm9kZV9fUFJFX1IzX18sIGdldERlYnVnTm9kZSwgaW5kZXhEZWJ1Z05vZGUsIHJlbW92ZURlYnVnTm9kZUZyb21JbmRleH0gZnJvbSAnLi4vZGVidWcvZGVidWdfbm9kZSc7XG5pbXBvcnQge0luamVjdG9yLCByZXNvbHZlRm9yd2FyZFJlZn0gZnJvbSAnLi4vZGknO1xuaW1wb3J0IHtnZXRJbmplY3RhYmxlRGVmLCBJbmplY3RhYmxlVHlwZSwgybXJtUluamVjdGFibGVEZWZ9IGZyb20gJy4uL2RpL2ludGVyZmFjZS9kZWZzJztcbmltcG9ydCB7RXJyb3JIYW5kbGVyfSBmcm9tICcuLi9lcnJvcl9oYW5kbGVyJztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlL3R5cGUnO1xuaW1wb3J0IHtDb21wb25lbnRGYWN0b3J5fSBmcm9tICcuLi9saW5rZXIvY29tcG9uZW50X2ZhY3RvcnknO1xuaW1wb3J0IHtOZ01vZHVsZVJlZn0gZnJvbSAnLi4vbGlua2VyL25nX21vZHVsZV9mYWN0b3J5JztcbmltcG9ydCB7UmVuZGVyZXIyLCBSZW5kZXJlckZhY3RvcnkyfSBmcm9tICcuLi9yZW5kZXIvYXBpJztcbmltcG9ydCB7UmVuZGVyZXJTdHlsZUZsYWdzMiwgUmVuZGVyZXJUeXBlMn0gZnJvbSAnLi4vcmVuZGVyL2FwaV9mbGFncyc7XG5pbXBvcnQge1Nhbml0aXplcn0gZnJvbSAnLi4vc2FuaXRpemF0aW9uL3Nhbml0aXplcic7XG5pbXBvcnQge2VzY2FwZUNvbW1lbnRUZXh0fSBmcm9tICcuLi91dGlsL2RvbSc7XG5pbXBvcnQge2lzRGV2TW9kZX0gZnJvbSAnLi4vdXRpbC9pc19kZXZfbW9kZSc7XG5pbXBvcnQge25vcm1hbGl6ZURlYnVnQmluZGluZ05hbWUsIG5vcm1hbGl6ZURlYnVnQmluZGluZ1ZhbHVlfSBmcm9tICcuLi91dGlsL25nX3JlZmxlY3QnO1xuXG5pbXBvcnQge2lzVmlld0RlYnVnRXJyb3IsIHZpZXdEZXN0cm95ZWRFcnJvciwgdmlld1dyYXBwZWREZWJ1Z0Vycm9yfSBmcm9tICcuL2Vycm9ycyc7XG5pbXBvcnQge3Jlc29sdmVEZXB9IGZyb20gJy4vcHJvdmlkZXInO1xuaW1wb3J0IHtkaXJ0eVBhcmVudFF1ZXJpZXMsIGdldFF1ZXJ5VmFsdWV9IGZyb20gJy4vcXVlcnknO1xuaW1wb3J0IHtjcmVhdGVJbmplY3RvciwgY3JlYXRlTmdNb2R1bGVSZWYsIGdldENvbXBvbmVudFZpZXdEZWZpbml0aW9uRmFjdG9yeX0gZnJvbSAnLi9yZWZzJztcbmltcG9ydCB7QXJndW1lbnRUeXBlLCBhc0VsZW1lbnREYXRhLCBhc1B1cmVFeHByZXNzaW9uRGF0YSwgQmluZGluZ0ZsYWdzLCBDaGVja1R5cGUsIERlYnVnQ29udGV4dCwgRWxlbWVudERhdGEsIE5nTW9kdWxlRGVmaW5pdGlvbiwgTm9kZURlZiwgTm9kZUZsYWdzLCBOb2RlTG9nZ2VyLCBQcm92aWRlck92ZXJyaWRlLCBSb290RGF0YSwgU2VydmljZXMsIFZpZXdEYXRhLCBWaWV3RGVmaW5pdGlvbiwgVmlld1N0YXRlfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7aXNDb21wb25lbnRWaWV3LCBOT09QLCByZW5kZXJOb2RlLCByZXNvbHZlRGVmaW5pdGlvbiwgc3BsaXREZXBzRHNsLCB0b2tlbktleSwgdmlld1BhcmVudEVsfSBmcm9tICcuL3V0aWwnO1xuaW1wb3J0IHtjaGVja0FuZFVwZGF0ZU5vZGUsIGNoZWNrQW5kVXBkYXRlVmlldywgY2hlY2tOb0NoYW5nZXNOb2RlLCBjaGVja05vQ2hhbmdlc1ZpZXcsIGNyZWF0ZUNvbXBvbmVudFZpZXcsIGNyZWF0ZUVtYmVkZGVkVmlldywgY3JlYXRlUm9vdFZpZXcsIGRlc3Ryb3lWaWV3fSBmcm9tICcuL3ZpZXcnO1xuXG5cbmxldCBpbml0aWFsaXplZCA9IGZhbHNlO1xuXG5leHBvcnQgZnVuY3Rpb24gaW5pdFNlcnZpY2VzSWZOZWVkZWQoKSB7XG4gIGlmIChpbml0aWFsaXplZCkge1xuICAgIHJldHVybjtcbiAgfVxuICBpbml0aWFsaXplZCA9IHRydWU7XG4gIGNvbnN0IHNlcnZpY2VzID0gaXNEZXZNb2RlKCkgPyBjcmVhdGVEZWJ1Z1NlcnZpY2VzKCkgOiBjcmVhdGVQcm9kU2VydmljZXMoKTtcbiAgU2VydmljZXMuc2V0Q3VycmVudE5vZGUgPSBzZXJ2aWNlcy5zZXRDdXJyZW50Tm9kZTtcbiAgU2VydmljZXMuY3JlYXRlUm9vdFZpZXcgPSBzZXJ2aWNlcy5jcmVhdGVSb290VmlldztcbiAgU2VydmljZXMuY3JlYXRlRW1iZWRkZWRWaWV3ID0gc2VydmljZXMuY3JlYXRlRW1iZWRkZWRWaWV3O1xuICBTZXJ2aWNlcy5jcmVhdGVDb21wb25lbnRWaWV3ID0gc2VydmljZXMuY3JlYXRlQ29tcG9uZW50VmlldztcbiAgU2VydmljZXMuY3JlYXRlTmdNb2R1bGVSZWYgPSBzZXJ2aWNlcy5jcmVhdGVOZ01vZHVsZVJlZjtcbiAgU2VydmljZXMub3ZlcnJpZGVQcm92aWRlciA9IHNlcnZpY2VzLm92ZXJyaWRlUHJvdmlkZXI7XG4gIFNlcnZpY2VzLm92ZXJyaWRlQ29tcG9uZW50VmlldyA9IHNlcnZpY2VzLm92ZXJyaWRlQ29tcG9uZW50VmlldztcbiAgU2VydmljZXMuY2xlYXJPdmVycmlkZXMgPSBzZXJ2aWNlcy5jbGVhck92ZXJyaWRlcztcbiAgU2VydmljZXMuY2hlY2tBbmRVcGRhdGVWaWV3ID0gc2VydmljZXMuY2hlY2tBbmRVcGRhdGVWaWV3O1xuICBTZXJ2aWNlcy5jaGVja05vQ2hhbmdlc1ZpZXcgPSBzZXJ2aWNlcy5jaGVja05vQ2hhbmdlc1ZpZXc7XG4gIFNlcnZpY2VzLmRlc3Ryb3lWaWV3ID0gc2VydmljZXMuZGVzdHJveVZpZXc7XG4gIFNlcnZpY2VzLnJlc29sdmVEZXAgPSByZXNvbHZlRGVwO1xuICBTZXJ2aWNlcy5jcmVhdGVEZWJ1Z0NvbnRleHQgPSBzZXJ2aWNlcy5jcmVhdGVEZWJ1Z0NvbnRleHQ7XG4gIFNlcnZpY2VzLmhhbmRsZUV2ZW50ID0gc2VydmljZXMuaGFuZGxlRXZlbnQ7XG4gIFNlcnZpY2VzLnVwZGF0ZURpcmVjdGl2ZXMgPSBzZXJ2aWNlcy51cGRhdGVEaXJlY3RpdmVzO1xuICBTZXJ2aWNlcy51cGRhdGVSZW5kZXJlciA9IHNlcnZpY2VzLnVwZGF0ZVJlbmRlcmVyO1xuICBTZXJ2aWNlcy5kaXJ0eVBhcmVudFF1ZXJpZXMgPSBkaXJ0eVBhcmVudFF1ZXJpZXM7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVByb2RTZXJ2aWNlcygpIHtcbiAgcmV0dXJuIHtcbiAgICBzZXRDdXJyZW50Tm9kZTogKCkgPT4ge30sXG4gICAgY3JlYXRlUm9vdFZpZXc6IGNyZWF0ZVByb2RSb290VmlldyxcbiAgICBjcmVhdGVFbWJlZGRlZFZpZXc6IGNyZWF0ZUVtYmVkZGVkVmlldyxcbiAgICBjcmVhdGVDb21wb25lbnRWaWV3OiBjcmVhdGVDb21wb25lbnRWaWV3LFxuICAgIGNyZWF0ZU5nTW9kdWxlUmVmOiBjcmVhdGVOZ01vZHVsZVJlZixcbiAgICBvdmVycmlkZVByb3ZpZGVyOiBOT09QLFxuICAgIG92ZXJyaWRlQ29tcG9uZW50VmlldzogTk9PUCxcbiAgICBjbGVhck92ZXJyaWRlczogTk9PUCxcbiAgICBjaGVja0FuZFVwZGF0ZVZpZXc6IGNoZWNrQW5kVXBkYXRlVmlldyxcbiAgICBjaGVja05vQ2hhbmdlc1ZpZXc6IGNoZWNrTm9DaGFuZ2VzVmlldyxcbiAgICBkZXN0cm95VmlldzogZGVzdHJveVZpZXcsXG4gICAgY3JlYXRlRGVidWdDb250ZXh0OiAodmlldzogVmlld0RhdGEsIG5vZGVJbmRleDogbnVtYmVyKSA9PiBuZXcgRGVidWdDb250ZXh0Xyh2aWV3LCBub2RlSW5kZXgpLFxuICAgIGhhbmRsZUV2ZW50OiAodmlldzogVmlld0RhdGEsIG5vZGVJbmRleDogbnVtYmVyLCBldmVudE5hbWU6IHN0cmluZywgZXZlbnQ6IGFueSkgPT5cbiAgICAgICAgdmlldy5kZWYuaGFuZGxlRXZlbnQodmlldywgbm9kZUluZGV4LCBldmVudE5hbWUsIGV2ZW50KSxcbiAgICB1cGRhdGVEaXJlY3RpdmVzOiAodmlldzogVmlld0RhdGEsIGNoZWNrVHlwZTogQ2hlY2tUeXBlKSA9PiB2aWV3LmRlZi51cGRhdGVEaXJlY3RpdmVzKFxuICAgICAgICBjaGVja1R5cGUgPT09IENoZWNrVHlwZS5DaGVja0FuZFVwZGF0ZSA/IHByb2RDaGVja0FuZFVwZGF0ZU5vZGUgOiBwcm9kQ2hlY2tOb0NoYW5nZXNOb2RlLFxuICAgICAgICB2aWV3KSxcbiAgICB1cGRhdGVSZW5kZXJlcjogKHZpZXc6IFZpZXdEYXRhLCBjaGVja1R5cGU6IENoZWNrVHlwZSkgPT4gdmlldy5kZWYudXBkYXRlUmVuZGVyZXIoXG4gICAgICAgIGNoZWNrVHlwZSA9PT0gQ2hlY2tUeXBlLkNoZWNrQW5kVXBkYXRlID8gcHJvZENoZWNrQW5kVXBkYXRlTm9kZSA6IHByb2RDaGVja05vQ2hhbmdlc05vZGUsXG4gICAgICAgIHZpZXcpLFxuICB9O1xufVxuXG5mdW5jdGlvbiBjcmVhdGVEZWJ1Z1NlcnZpY2VzKCkge1xuICByZXR1cm4ge1xuICAgIHNldEN1cnJlbnROb2RlOiBkZWJ1Z1NldEN1cnJlbnROb2RlLFxuICAgIGNyZWF0ZVJvb3RWaWV3OiBkZWJ1Z0NyZWF0ZVJvb3RWaWV3LFxuICAgIGNyZWF0ZUVtYmVkZGVkVmlldzogZGVidWdDcmVhdGVFbWJlZGRlZFZpZXcsXG4gICAgY3JlYXRlQ29tcG9uZW50VmlldzogZGVidWdDcmVhdGVDb21wb25lbnRWaWV3LFxuICAgIGNyZWF0ZU5nTW9kdWxlUmVmOiBkZWJ1Z0NyZWF0ZU5nTW9kdWxlUmVmLFxuICAgIG92ZXJyaWRlUHJvdmlkZXI6IGRlYnVnT3ZlcnJpZGVQcm92aWRlcixcbiAgICBvdmVycmlkZUNvbXBvbmVudFZpZXc6IGRlYnVnT3ZlcnJpZGVDb21wb25lbnRWaWV3LFxuICAgIGNsZWFyT3ZlcnJpZGVzOiBkZWJ1Z0NsZWFyT3ZlcnJpZGVzLFxuICAgIGNoZWNrQW5kVXBkYXRlVmlldzogZGVidWdDaGVja0FuZFVwZGF0ZVZpZXcsXG4gICAgY2hlY2tOb0NoYW5nZXNWaWV3OiBkZWJ1Z0NoZWNrTm9DaGFuZ2VzVmlldyxcbiAgICBkZXN0cm95VmlldzogZGVidWdEZXN0cm95VmlldyxcbiAgICBjcmVhdGVEZWJ1Z0NvbnRleHQ6ICh2aWV3OiBWaWV3RGF0YSwgbm9kZUluZGV4OiBudW1iZXIpID0+IG5ldyBEZWJ1Z0NvbnRleHRfKHZpZXcsIG5vZGVJbmRleCksXG4gICAgaGFuZGxlRXZlbnQ6IGRlYnVnSGFuZGxlRXZlbnQsXG4gICAgdXBkYXRlRGlyZWN0aXZlczogZGVidWdVcGRhdGVEaXJlY3RpdmVzLFxuICAgIHVwZGF0ZVJlbmRlcmVyOiBkZWJ1Z1VwZGF0ZVJlbmRlcmVyLFxuICB9O1xufVxuXG5mdW5jdGlvbiBjcmVhdGVQcm9kUm9vdFZpZXcoXG4gICAgZWxJbmplY3RvcjogSW5qZWN0b3IsIHByb2plY3RhYmxlTm9kZXM6IGFueVtdW10sIHJvb3RTZWxlY3Rvck9yTm9kZTogc3RyaW5nfGFueSxcbiAgICBkZWY6IFZpZXdEZWZpbml0aW9uLCBuZ01vZHVsZTogTmdNb2R1bGVSZWY8YW55PiwgY29udGV4dD86IGFueSk6IFZpZXdEYXRhIHtcbiAgY29uc3QgcmVuZGVyZXJGYWN0b3J5OiBSZW5kZXJlckZhY3RvcnkyID0gbmdNb2R1bGUuaW5qZWN0b3IuZ2V0KFJlbmRlcmVyRmFjdG9yeTIpO1xuICByZXR1cm4gY3JlYXRlUm9vdFZpZXcoXG4gICAgICBjcmVhdGVSb290RGF0YShlbEluamVjdG9yLCBuZ01vZHVsZSwgcmVuZGVyZXJGYWN0b3J5LCBwcm9qZWN0YWJsZU5vZGVzLCByb290U2VsZWN0b3JPck5vZGUpLFxuICAgICAgZGVmLCBjb250ZXh0KTtcbn1cblxuZnVuY3Rpb24gZGVidWdDcmVhdGVSb290VmlldyhcbiAgICBlbEluamVjdG9yOiBJbmplY3RvciwgcHJvamVjdGFibGVOb2RlczogYW55W11bXSwgcm9vdFNlbGVjdG9yT3JOb2RlOiBzdHJpbmd8YW55LFxuICAgIGRlZjogVmlld0RlZmluaXRpb24sIG5nTW9kdWxlOiBOZ01vZHVsZVJlZjxhbnk+LCBjb250ZXh0PzogYW55KTogVmlld0RhdGEge1xuICBjb25zdCByZW5kZXJlckZhY3Rvcnk6IFJlbmRlcmVyRmFjdG9yeTIgPSBuZ01vZHVsZS5pbmplY3Rvci5nZXQoUmVuZGVyZXJGYWN0b3J5Mik7XG4gIGNvbnN0IHJvb3QgPSBjcmVhdGVSb290RGF0YShcbiAgICAgIGVsSW5qZWN0b3IsIG5nTW9kdWxlLCBuZXcgRGVidWdSZW5kZXJlckZhY3RvcnkyKHJlbmRlcmVyRmFjdG9yeSksIHByb2plY3RhYmxlTm9kZXMsXG4gICAgICByb290U2VsZWN0b3JPck5vZGUpO1xuICBjb25zdCBkZWZXaXRoT3ZlcnJpZGUgPSBhcHBseVByb3ZpZGVyT3ZlcnJpZGVzVG9WaWV3KGRlZik7XG4gIHJldHVybiBjYWxsV2l0aERlYnVnQ29udGV4dChcbiAgICAgIERlYnVnQWN0aW9uLmNyZWF0ZSwgY3JlYXRlUm9vdFZpZXcsIG51bGwsIFtyb290LCBkZWZXaXRoT3ZlcnJpZGUsIGNvbnRleHRdKTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlUm9vdERhdGEoXG4gICAgZWxJbmplY3RvcjogSW5qZWN0b3IsIG5nTW9kdWxlOiBOZ01vZHVsZVJlZjxhbnk+LCByZW5kZXJlckZhY3Rvcnk6IFJlbmRlcmVyRmFjdG9yeTIsXG4gICAgcHJvamVjdGFibGVOb2RlczogYW55W11bXSwgcm9vdFNlbGVjdG9yT3JOb2RlOiBhbnkpOiBSb290RGF0YSB7XG4gIGNvbnN0IHNhbml0aXplciA9IG5nTW9kdWxlLmluamVjdG9yLmdldChTYW5pdGl6ZXIpO1xuICBjb25zdCBlcnJvckhhbmRsZXIgPSBuZ01vZHVsZS5pbmplY3Rvci5nZXQoRXJyb3JIYW5kbGVyKTtcbiAgY29uc3QgcmVuZGVyZXIgPSByZW5kZXJlckZhY3RvcnkuY3JlYXRlUmVuZGVyZXIobnVsbCwgbnVsbCk7XG4gIHJldHVybiB7XG4gICAgbmdNb2R1bGUsXG4gICAgaW5qZWN0b3I6IGVsSW5qZWN0b3IsXG4gICAgcHJvamVjdGFibGVOb2RlcyxcbiAgICBzZWxlY3Rvck9yTm9kZTogcm9vdFNlbGVjdG9yT3JOb2RlLFxuICAgIHNhbml0aXplcixcbiAgICByZW5kZXJlckZhY3RvcnksXG4gICAgcmVuZGVyZXIsXG4gICAgZXJyb3JIYW5kbGVyXG4gIH07XG59XG5cbmZ1bmN0aW9uIGRlYnVnQ3JlYXRlRW1iZWRkZWRWaWV3KFxuICAgIHBhcmVudFZpZXc6IFZpZXdEYXRhLCBhbmNob3JEZWY6IE5vZGVEZWYsIHZpZXdEZWY6IFZpZXdEZWZpbml0aW9uLCBjb250ZXh0PzogYW55KTogVmlld0RhdGEge1xuICBjb25zdCBkZWZXaXRoT3ZlcnJpZGUgPSBhcHBseVByb3ZpZGVyT3ZlcnJpZGVzVG9WaWV3KHZpZXdEZWYpO1xuICByZXR1cm4gY2FsbFdpdGhEZWJ1Z0NvbnRleHQoXG4gICAgICBEZWJ1Z0FjdGlvbi5jcmVhdGUsIGNyZWF0ZUVtYmVkZGVkVmlldywgbnVsbCxcbiAgICAgIFtwYXJlbnRWaWV3LCBhbmNob3JEZWYsIGRlZldpdGhPdmVycmlkZSwgY29udGV4dF0pO1xufVxuXG5mdW5jdGlvbiBkZWJ1Z0NyZWF0ZUNvbXBvbmVudFZpZXcoXG4gICAgcGFyZW50VmlldzogVmlld0RhdGEsIG5vZGVEZWY6IE5vZGVEZWYsIHZpZXdEZWY6IFZpZXdEZWZpbml0aW9uLCBob3N0RWxlbWVudDogYW55KTogVmlld0RhdGEge1xuICBjb25zdCBvdmVycmlkZUNvbXBvbmVudFZpZXcgPVxuICAgICAgdmlld0RlZk92ZXJyaWRlcy5nZXQobm9kZURlZi5lbGVtZW50IS5jb21wb25lbnRQcm92aWRlciEucHJvdmlkZXIhLnRva2VuKTtcbiAgaWYgKG92ZXJyaWRlQ29tcG9uZW50Vmlldykge1xuICAgIHZpZXdEZWYgPSBvdmVycmlkZUNvbXBvbmVudFZpZXc7XG4gIH0gZWxzZSB7XG4gICAgdmlld0RlZiA9IGFwcGx5UHJvdmlkZXJPdmVycmlkZXNUb1ZpZXcodmlld0RlZik7XG4gIH1cbiAgcmV0dXJuIGNhbGxXaXRoRGVidWdDb250ZXh0KFxuICAgICAgRGVidWdBY3Rpb24uY3JlYXRlLCBjcmVhdGVDb21wb25lbnRWaWV3LCBudWxsLCBbcGFyZW50Vmlldywgbm9kZURlZiwgdmlld0RlZiwgaG9zdEVsZW1lbnRdKTtcbn1cblxuZnVuY3Rpb24gZGVidWdDcmVhdGVOZ01vZHVsZVJlZihcbiAgICBtb2R1bGVUeXBlOiBUeXBlPGFueT4sIHBhcmVudEluamVjdG9yOiBJbmplY3RvciwgYm9vdHN0cmFwQ29tcG9uZW50czogVHlwZTxhbnk+W10sXG4gICAgZGVmOiBOZ01vZHVsZURlZmluaXRpb24pOiBOZ01vZHVsZVJlZjxhbnk+IHtcbiAgY29uc3QgZGVmV2l0aE92ZXJyaWRlID0gYXBwbHlQcm92aWRlck92ZXJyaWRlc1RvTmdNb2R1bGUoZGVmKTtcbiAgcmV0dXJuIGNyZWF0ZU5nTW9kdWxlUmVmKG1vZHVsZVR5cGUsIHBhcmVudEluamVjdG9yLCBib290c3RyYXBDb21wb25lbnRzLCBkZWZXaXRoT3ZlcnJpZGUpO1xufVxuXG5jb25zdCBwcm92aWRlck92ZXJyaWRlcyA9IG5ldyBNYXA8YW55LCBQcm92aWRlck92ZXJyaWRlPigpO1xuY29uc3QgcHJvdmlkZXJPdmVycmlkZXNXaXRoU2NvcGUgPSBuZXcgTWFwPEluamVjdGFibGVUeXBlPGFueT4sIFByb3ZpZGVyT3ZlcnJpZGU+KCk7XG5jb25zdCB2aWV3RGVmT3ZlcnJpZGVzID0gbmV3IE1hcDxhbnksIFZpZXdEZWZpbml0aW9uPigpO1xuXG5mdW5jdGlvbiBkZWJ1Z092ZXJyaWRlUHJvdmlkZXIob3ZlcnJpZGU6IFByb3ZpZGVyT3ZlcnJpZGUpIHtcbiAgcHJvdmlkZXJPdmVycmlkZXMuc2V0KG92ZXJyaWRlLnRva2VuLCBvdmVycmlkZSk7XG4gIGxldCBpbmplY3RhYmxlRGVmOiDJtcm1SW5qZWN0YWJsZURlZjxhbnk+fG51bGw7XG4gIGlmICh0eXBlb2Ygb3ZlcnJpZGUudG9rZW4gPT09ICdmdW5jdGlvbicgJiYgKGluamVjdGFibGVEZWYgPSBnZXRJbmplY3RhYmxlRGVmKG92ZXJyaWRlLnRva2VuKSkgJiZcbiAgICAgIHR5cGVvZiBpbmplY3RhYmxlRGVmLnByb3ZpZGVkSW4gPT09ICdmdW5jdGlvbicpIHtcbiAgICBwcm92aWRlck92ZXJyaWRlc1dpdGhTY29wZS5zZXQob3ZlcnJpZGUudG9rZW4gYXMgSW5qZWN0YWJsZVR5cGU8YW55Piwgb3ZlcnJpZGUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGRlYnVnT3ZlcnJpZGVDb21wb25lbnRWaWV3KGNvbXA6IGFueSwgY29tcEZhY3Rvcnk6IENvbXBvbmVudEZhY3Rvcnk8YW55Pikge1xuICBjb25zdCBob3N0Vmlld0RlZiA9IHJlc29sdmVEZWZpbml0aW9uKGdldENvbXBvbmVudFZpZXdEZWZpbml0aW9uRmFjdG9yeShjb21wRmFjdG9yeSkpO1xuICBjb25zdCBjb21wVmlld0RlZiA9IHJlc29sdmVEZWZpbml0aW9uKGhvc3RWaWV3RGVmLm5vZGVzWzBdLmVsZW1lbnQhLmNvbXBvbmVudFZpZXchKTtcbiAgdmlld0RlZk92ZXJyaWRlcy5zZXQoY29tcCwgY29tcFZpZXdEZWYpO1xufVxuXG5mdW5jdGlvbiBkZWJ1Z0NsZWFyT3ZlcnJpZGVzKCkge1xuICBwcm92aWRlck92ZXJyaWRlcy5jbGVhcigpO1xuICBwcm92aWRlck92ZXJyaWRlc1dpdGhTY29wZS5jbGVhcigpO1xuICB2aWV3RGVmT3ZlcnJpZGVzLmNsZWFyKCk7XG59XG5cbi8vIE5vdGVzIGFib3V0IHRoZSBhbGdvcml0aG06XG4vLyAxKSBMb2NhdGUgdGhlIHByb3ZpZGVycyBvZiBhbiBlbGVtZW50IGFuZCBjaGVjayBpZiBvbmUgb2YgdGhlbSB3YXMgb3ZlcndyaXR0ZW5cbi8vIDIpIENoYW5nZSB0aGUgcHJvdmlkZXJzIG9mIHRoYXQgZWxlbWVudFxuLy9cbi8vIFdlIG9ubHkgY3JlYXRlIG5ldyBkYXRhc3RydWN0dXJlcyBpZiB3ZSBuZWVkIHRvLCB0byBrZWVwIHBlcmYgaW1wYWN0XG4vLyByZWFzb25hYmxlLlxuZnVuY3Rpb24gYXBwbHlQcm92aWRlck92ZXJyaWRlc1RvVmlldyhkZWY6IFZpZXdEZWZpbml0aW9uKTogVmlld0RlZmluaXRpb24ge1xuICBpZiAocHJvdmlkZXJPdmVycmlkZXMuc2l6ZSA9PT0gMCkge1xuICAgIHJldHVybiBkZWY7XG4gIH1cbiAgY29uc3QgZWxlbWVudEluZGljZXNXaXRoT3ZlcndyaXR0ZW5Qcm92aWRlcnMgPSBmaW5kRWxlbWVudEluZGljZXNXaXRoT3ZlcndyaXR0ZW5Qcm92aWRlcnMoZGVmKTtcbiAgaWYgKGVsZW1lbnRJbmRpY2VzV2l0aE92ZXJ3cml0dGVuUHJvdmlkZXJzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBkZWY7XG4gIH1cbiAgLy8gY2xvbmUgdGhlIHdob2xlIHZpZXcgZGVmaW5pdGlvbixcbiAgLy8gYXMgaXQgbWFpbnRhaW5zIHJlZmVyZW5jZXMgYmV0d2VlbiB0aGUgbm9kZXMgdGhhdCBhcmUgaGFyZCB0byB1cGRhdGUuXG4gIGRlZiA9IGRlZi5mYWN0b3J5ISgoKSA9PiBOT09QKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBlbGVtZW50SW5kaWNlc1dpdGhPdmVyd3JpdHRlblByb3ZpZGVycy5sZW5ndGg7IGkrKykge1xuICAgIGFwcGx5UHJvdmlkZXJPdmVycmlkZXNUb0VsZW1lbnQoZGVmLCBlbGVtZW50SW5kaWNlc1dpdGhPdmVyd3JpdHRlblByb3ZpZGVyc1tpXSk7XG4gIH1cbiAgcmV0dXJuIGRlZjtcblxuICBmdW5jdGlvbiBmaW5kRWxlbWVudEluZGljZXNXaXRoT3ZlcndyaXR0ZW5Qcm92aWRlcnMoZGVmOiBWaWV3RGVmaW5pdGlvbik6IG51bWJlcltdIHtcbiAgICBjb25zdCBlbEluZGljZXNXaXRoT3ZlcndyaXR0ZW5Qcm92aWRlcnM6IG51bWJlcltdID0gW107XG4gICAgbGV0IGxhc3RFbGVtZW50RGVmOiBOb2RlRGVmfG51bGwgPSBudWxsO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGVmLm5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBub2RlRGVmID0gZGVmLm5vZGVzW2ldO1xuICAgICAgaWYgKG5vZGVEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuVHlwZUVsZW1lbnQpIHtcbiAgICAgICAgbGFzdEVsZW1lbnREZWYgPSBub2RlRGVmO1xuICAgICAgfVxuICAgICAgaWYgKGxhc3RFbGVtZW50RGVmICYmIG5vZGVEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuQ2F0UHJvdmlkZXJOb0RpcmVjdGl2ZSAmJlxuICAgICAgICAgIHByb3ZpZGVyT3ZlcnJpZGVzLmhhcyhub2RlRGVmLnByb3ZpZGVyIS50b2tlbikpIHtcbiAgICAgICAgZWxJbmRpY2VzV2l0aE92ZXJ3cml0dGVuUHJvdmlkZXJzLnB1c2gobGFzdEVsZW1lbnREZWYhLm5vZGVJbmRleCk7XG4gICAgICAgIGxhc3RFbGVtZW50RGVmID0gbnVsbDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGVsSW5kaWNlc1dpdGhPdmVyd3JpdHRlblByb3ZpZGVycztcbiAgfVxuXG4gIGZ1bmN0aW9uIGFwcGx5UHJvdmlkZXJPdmVycmlkZXNUb0VsZW1lbnQodmlld0RlZjogVmlld0RlZmluaXRpb24sIGVsSW5kZXg6IG51bWJlcikge1xuICAgIGZvciAobGV0IGkgPSBlbEluZGV4ICsgMTsgaSA8IHZpZXdEZWYubm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IG5vZGVEZWYgPSB2aWV3RGVmLm5vZGVzW2ldO1xuICAgICAgaWYgKG5vZGVEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuVHlwZUVsZW1lbnQpIHtcbiAgICAgICAgLy8gc3RvcCBhdCB0aGUgbmV4dCBlbGVtZW50XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmIChub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLkNhdFByb3ZpZGVyTm9EaXJlY3RpdmUpIHtcbiAgICAgICAgY29uc3QgcHJvdmlkZXIgPSBub2RlRGVmLnByb3ZpZGVyITtcbiAgICAgICAgY29uc3Qgb3ZlcnJpZGUgPSBwcm92aWRlck92ZXJyaWRlcy5nZXQocHJvdmlkZXIudG9rZW4pO1xuICAgICAgICBpZiAob3ZlcnJpZGUpIHtcbiAgICAgICAgICBub2RlRGVmLmZsYWdzID0gKG5vZGVEZWYuZmxhZ3MgJiB+Tm9kZUZsYWdzLkNhdFByb3ZpZGVyTm9EaXJlY3RpdmUpIHwgb3ZlcnJpZGUuZmxhZ3M7XG4gICAgICAgICAgcHJvdmlkZXIuZGVwcyA9IHNwbGl0RGVwc0RzbChvdmVycmlkZS5kZXBzKTtcbiAgICAgICAgICBwcm92aWRlci52YWx1ZSA9IG92ZXJyaWRlLnZhbHVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8vIE5vdGVzIGFib3V0IHRoZSBhbGdvcml0aG06XG4vLyBXZSBvbmx5IGNyZWF0ZSBuZXcgZGF0YXN0cnVjdHVyZXMgaWYgd2UgbmVlZCB0bywgdG8ga2VlcCBwZXJmIGltcGFjdFxuLy8gcmVhc29uYWJsZS5cbmZ1bmN0aW9uIGFwcGx5UHJvdmlkZXJPdmVycmlkZXNUb05nTW9kdWxlKGRlZjogTmdNb2R1bGVEZWZpbml0aW9uKTogTmdNb2R1bGVEZWZpbml0aW9uIHtcbiAgY29uc3Qge2hhc092ZXJyaWRlcywgaGFzRGVwcmVjYXRlZE92ZXJyaWRlc30gPSBjYWxjSGFzT3ZlcnJpZGVzKGRlZik7XG4gIGlmICghaGFzT3ZlcnJpZGVzKSB7XG4gICAgcmV0dXJuIGRlZjtcbiAgfVxuICAvLyBjbG9uZSB0aGUgd2hvbGUgdmlldyBkZWZpbml0aW9uLFxuICAvLyBhcyBpdCBtYWludGFpbnMgcmVmZXJlbmNlcyBiZXR3ZWVuIHRoZSBub2RlcyB0aGF0IGFyZSBoYXJkIHRvIHVwZGF0ZS5cbiAgZGVmID0gZGVmLmZhY3RvcnkhKCgpID0+IE5PT1ApO1xuICBhcHBseVByb3ZpZGVyT3ZlcnJpZGVzKGRlZik7XG4gIHJldHVybiBkZWY7XG5cbiAgZnVuY3Rpb24gY2FsY0hhc092ZXJyaWRlcyhkZWY6IE5nTW9kdWxlRGVmaW5pdGlvbik6XG4gICAgICB7aGFzT3ZlcnJpZGVzOiBib29sZWFuLCBoYXNEZXByZWNhdGVkT3ZlcnJpZGVzOiBib29sZWFufSB7XG4gICAgbGV0IGhhc092ZXJyaWRlcyA9IGZhbHNlO1xuICAgIGxldCBoYXNEZXByZWNhdGVkT3ZlcnJpZGVzID0gZmFsc2U7XG4gICAgaWYgKHByb3ZpZGVyT3ZlcnJpZGVzLnNpemUgPT09IDApIHtcbiAgICAgIHJldHVybiB7aGFzT3ZlcnJpZGVzLCBoYXNEZXByZWNhdGVkT3ZlcnJpZGVzfTtcbiAgICB9XG4gICAgZGVmLnByb3ZpZGVycy5mb3JFYWNoKG5vZGUgPT4ge1xuICAgICAgY29uc3Qgb3ZlcnJpZGUgPSBwcm92aWRlck92ZXJyaWRlcy5nZXQobm9kZS50b2tlbik7XG4gICAgICBpZiAoKG5vZGUuZmxhZ3MgJiBOb2RlRmxhZ3MuQ2F0UHJvdmlkZXJOb0RpcmVjdGl2ZSkgJiYgb3ZlcnJpZGUpIHtcbiAgICAgICAgaGFzT3ZlcnJpZGVzID0gdHJ1ZTtcbiAgICAgICAgaGFzRGVwcmVjYXRlZE92ZXJyaWRlcyA9IGhhc0RlcHJlY2F0ZWRPdmVycmlkZXMgfHwgb3ZlcnJpZGUuZGVwcmVjYXRlZEJlaGF2aW9yO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGRlZi5tb2R1bGVzLmZvckVhY2gobW9kdWxlID0+IHtcbiAgICAgIHByb3ZpZGVyT3ZlcnJpZGVzV2l0aFNjb3BlLmZvckVhY2goKG92ZXJyaWRlLCB0b2tlbikgPT4ge1xuICAgICAgICBpZiAocmVzb2x2ZUZvcndhcmRSZWYoZ2V0SW5qZWN0YWJsZURlZih0b2tlbikhLnByb3ZpZGVkSW4pID09PSBtb2R1bGUpIHtcbiAgICAgICAgICBoYXNPdmVycmlkZXMgPSB0cnVlO1xuICAgICAgICAgIGhhc0RlcHJlY2F0ZWRPdmVycmlkZXMgPSBoYXNEZXByZWNhdGVkT3ZlcnJpZGVzIHx8IG92ZXJyaWRlLmRlcHJlY2F0ZWRCZWhhdmlvcjtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHtoYXNPdmVycmlkZXMsIGhhc0RlcHJlY2F0ZWRPdmVycmlkZXN9O1xuICB9XG5cbiAgZnVuY3Rpb24gYXBwbHlQcm92aWRlck92ZXJyaWRlcyhkZWY6IE5nTW9kdWxlRGVmaW5pdGlvbikge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGVmLnByb3ZpZGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgcHJvdmlkZXIgPSBkZWYucHJvdmlkZXJzW2ldO1xuICAgICAgaWYgKGhhc0RlcHJlY2F0ZWRPdmVycmlkZXMpIHtcbiAgICAgICAgLy8gV2UgaGFkIGEgYnVnIHdoZXJlIG1lIG1hZGVcbiAgICAgICAgLy8gYWxsIHByb3ZpZGVycyBsYXp5LiBLZWVwIHRoaXMgbG9naWMgYmVoaW5kIGEgZmxhZ1xuICAgICAgICAvLyBmb3IgbWlncmF0aW5nIGV4aXN0aW5nIHVzZXJzLlxuICAgICAgICBwcm92aWRlci5mbGFncyB8PSBOb2RlRmxhZ3MuTGF6eVByb3ZpZGVyO1xuICAgICAgfVxuICAgICAgY29uc3Qgb3ZlcnJpZGUgPSBwcm92aWRlck92ZXJyaWRlcy5nZXQocHJvdmlkZXIudG9rZW4pO1xuICAgICAgaWYgKG92ZXJyaWRlKSB7XG4gICAgICAgIHByb3ZpZGVyLmZsYWdzID0gKHByb3ZpZGVyLmZsYWdzICYgfk5vZGVGbGFncy5DYXRQcm92aWRlck5vRGlyZWN0aXZlKSB8IG92ZXJyaWRlLmZsYWdzO1xuICAgICAgICBwcm92aWRlci5kZXBzID0gc3BsaXREZXBzRHNsKG92ZXJyaWRlLmRlcHMpO1xuICAgICAgICBwcm92aWRlci52YWx1ZSA9IG92ZXJyaWRlLnZhbHVlO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAocHJvdmlkZXJPdmVycmlkZXNXaXRoU2NvcGUuc2l6ZSA+IDApIHtcbiAgICAgIGxldCBtb2R1bGVTZXQgPSBuZXcgU2V0PGFueT4oZGVmLm1vZHVsZXMpO1xuICAgICAgcHJvdmlkZXJPdmVycmlkZXNXaXRoU2NvcGUuZm9yRWFjaCgob3ZlcnJpZGUsIHRva2VuKSA9PiB7XG4gICAgICAgIGlmIChtb2R1bGVTZXQuaGFzKHJlc29sdmVGb3J3YXJkUmVmKGdldEluamVjdGFibGVEZWYodG9rZW4pIS5wcm92aWRlZEluKSkpIHtcbiAgICAgICAgICBsZXQgcHJvdmlkZXIgPSB7XG4gICAgICAgICAgICB0b2tlbjogdG9rZW4sXG4gICAgICAgICAgICBmbGFnczpcbiAgICAgICAgICAgICAgICBvdmVycmlkZS5mbGFncyB8IChoYXNEZXByZWNhdGVkT3ZlcnJpZGVzID8gTm9kZUZsYWdzLkxhenlQcm92aWRlciA6IE5vZGVGbGFncy5Ob25lKSxcbiAgICAgICAgICAgIGRlcHM6IHNwbGl0RGVwc0RzbChvdmVycmlkZS5kZXBzKSxcbiAgICAgICAgICAgIHZhbHVlOiBvdmVycmlkZS52YWx1ZSxcbiAgICAgICAgICAgIGluZGV4OiBkZWYucHJvdmlkZXJzLmxlbmd0aCxcbiAgICAgICAgICB9O1xuICAgICAgICAgIGRlZi5wcm92aWRlcnMucHVzaChwcm92aWRlcik7XG4gICAgICAgICAgZGVmLnByb3ZpZGVyc0J5S2V5W3Rva2VuS2V5KHRva2VuKV0gPSBwcm92aWRlcjtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHByb2RDaGVja0FuZFVwZGF0ZU5vZGUoXG4gICAgdmlldzogVmlld0RhdGEsIGNoZWNrSW5kZXg6IG51bWJlciwgYXJnU3R5bGU6IEFyZ3VtZW50VHlwZSwgdjA/OiBhbnksIHYxPzogYW55LCB2Mj86IGFueSxcbiAgICB2Mz86IGFueSwgdjQ/OiBhbnksIHY1PzogYW55LCB2Nj86IGFueSwgdjc/OiBhbnksIHY4PzogYW55LCB2OT86IGFueSk6IGFueSB7XG4gIGNvbnN0IG5vZGVEZWYgPSB2aWV3LmRlZi5ub2Rlc1tjaGVja0luZGV4XTtcbiAgY2hlY2tBbmRVcGRhdGVOb2RlKHZpZXcsIG5vZGVEZWYsIGFyZ1N0eWxlLCB2MCwgdjEsIHYyLCB2MywgdjQsIHY1LCB2NiwgdjcsIHY4LCB2OSk7XG4gIHJldHVybiAobm9kZURlZi5mbGFncyAmIE5vZGVGbGFncy5DYXRQdXJlRXhwcmVzc2lvbikgP1xuICAgICAgYXNQdXJlRXhwcmVzc2lvbkRhdGEodmlldywgY2hlY2tJbmRleCkudmFsdWUgOlxuICAgICAgdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBwcm9kQ2hlY2tOb0NoYW5nZXNOb2RlKFxuICAgIHZpZXc6IFZpZXdEYXRhLCBjaGVja0luZGV4OiBudW1iZXIsIGFyZ1N0eWxlOiBBcmd1bWVudFR5cGUsIHYwPzogYW55LCB2MT86IGFueSwgdjI/OiBhbnksXG4gICAgdjM/OiBhbnksIHY0PzogYW55LCB2NT86IGFueSwgdjY/OiBhbnksIHY3PzogYW55LCB2OD86IGFueSwgdjk/OiBhbnkpOiBhbnkge1xuICBjb25zdCBub2RlRGVmID0gdmlldy5kZWYubm9kZXNbY2hlY2tJbmRleF07XG4gIGNoZWNrTm9DaGFuZ2VzTm9kZSh2aWV3LCBub2RlRGVmLCBhcmdTdHlsZSwgdjAsIHYxLCB2MiwgdjMsIHY0LCB2NSwgdjYsIHY3LCB2OCwgdjkpO1xuICByZXR1cm4gKG5vZGVEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuQ2F0UHVyZUV4cHJlc3Npb24pID9cbiAgICAgIGFzUHVyZUV4cHJlc3Npb25EYXRhKHZpZXcsIGNoZWNrSW5kZXgpLnZhbHVlIDpcbiAgICAgIHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gZGVidWdDaGVja0FuZFVwZGF0ZVZpZXcodmlldzogVmlld0RhdGEpIHtcbiAgcmV0dXJuIGNhbGxXaXRoRGVidWdDb250ZXh0KERlYnVnQWN0aW9uLmRldGVjdENoYW5nZXMsIGNoZWNrQW5kVXBkYXRlVmlldywgbnVsbCwgW3ZpZXddKTtcbn1cblxuZnVuY3Rpb24gZGVidWdDaGVja05vQ2hhbmdlc1ZpZXcodmlldzogVmlld0RhdGEpIHtcbiAgcmV0dXJuIGNhbGxXaXRoRGVidWdDb250ZXh0KERlYnVnQWN0aW9uLmNoZWNrTm9DaGFuZ2VzLCBjaGVja05vQ2hhbmdlc1ZpZXcsIG51bGwsIFt2aWV3XSk7XG59XG5cbmZ1bmN0aW9uIGRlYnVnRGVzdHJveVZpZXcodmlldzogVmlld0RhdGEpIHtcbiAgcmV0dXJuIGNhbGxXaXRoRGVidWdDb250ZXh0KERlYnVnQWN0aW9uLmRlc3Ryb3ksIGRlc3Ryb3lWaWV3LCBudWxsLCBbdmlld10pO1xufVxuXG5lbnVtIERlYnVnQWN0aW9uIHtcbiAgY3JlYXRlLFxuICBkZXRlY3RDaGFuZ2VzLFxuICBjaGVja05vQ2hhbmdlcyxcbiAgZGVzdHJveSxcbiAgaGFuZGxlRXZlbnRcbn1cblxubGV0IF9jdXJyZW50QWN0aW9uOiBEZWJ1Z0FjdGlvbjtcbmxldCBfY3VycmVudFZpZXc6IFZpZXdEYXRhO1xubGV0IF9jdXJyZW50Tm9kZUluZGV4OiBudW1iZXJ8bnVsbDtcblxuZnVuY3Rpb24gZGVidWdTZXRDdXJyZW50Tm9kZSh2aWV3OiBWaWV3RGF0YSwgbm9kZUluZGV4OiBudW1iZXJ8bnVsbCkge1xuICBfY3VycmVudFZpZXcgPSB2aWV3O1xuICBfY3VycmVudE5vZGVJbmRleCA9IG5vZGVJbmRleDtcbn1cblxuZnVuY3Rpb24gZGVidWdIYW5kbGVFdmVudCh2aWV3OiBWaWV3RGF0YSwgbm9kZUluZGV4OiBudW1iZXIsIGV2ZW50TmFtZTogc3RyaW5nLCBldmVudDogYW55KSB7XG4gIGRlYnVnU2V0Q3VycmVudE5vZGUodmlldywgbm9kZUluZGV4KTtcbiAgcmV0dXJuIGNhbGxXaXRoRGVidWdDb250ZXh0KFxuICAgICAgRGVidWdBY3Rpb24uaGFuZGxlRXZlbnQsIHZpZXcuZGVmLmhhbmRsZUV2ZW50LCBudWxsLCBbdmlldywgbm9kZUluZGV4LCBldmVudE5hbWUsIGV2ZW50XSk7XG59XG5cbmZ1bmN0aW9uIGRlYnVnVXBkYXRlRGlyZWN0aXZlcyh2aWV3OiBWaWV3RGF0YSwgY2hlY2tUeXBlOiBDaGVja1R5cGUpIHtcbiAgaWYgKHZpZXcuc3RhdGUgJiBWaWV3U3RhdGUuRGVzdHJveWVkKSB7XG4gICAgdGhyb3cgdmlld0Rlc3Ryb3llZEVycm9yKERlYnVnQWN0aW9uW19jdXJyZW50QWN0aW9uXSk7XG4gIH1cbiAgZGVidWdTZXRDdXJyZW50Tm9kZSh2aWV3LCBuZXh0RGlyZWN0aXZlV2l0aEJpbmRpbmcodmlldywgMCkpO1xuICByZXR1cm4gdmlldy5kZWYudXBkYXRlRGlyZWN0aXZlcyhkZWJ1Z0NoZWNrRGlyZWN0aXZlc0ZuLCB2aWV3KTtcblxuICBmdW5jdGlvbiBkZWJ1Z0NoZWNrRGlyZWN0aXZlc0ZuKFxuICAgICAgdmlldzogVmlld0RhdGEsIG5vZGVJbmRleDogbnVtYmVyLCBhcmdTdHlsZTogQXJndW1lbnRUeXBlLCAuLi52YWx1ZXM6IGFueVtdKSB7XG4gICAgY29uc3Qgbm9kZURlZiA9IHZpZXcuZGVmLm5vZGVzW25vZGVJbmRleF07XG4gICAgaWYgKGNoZWNrVHlwZSA9PT0gQ2hlY2tUeXBlLkNoZWNrQW5kVXBkYXRlKSB7XG4gICAgICBkZWJ1Z0NoZWNrQW5kVXBkYXRlTm9kZSh2aWV3LCBub2RlRGVmLCBhcmdTdHlsZSwgdmFsdWVzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVidWdDaGVja05vQ2hhbmdlc05vZGUodmlldywgbm9kZURlZiwgYXJnU3R5bGUsIHZhbHVlcyk7XG4gICAgfVxuICAgIGlmIChub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLlR5cGVEaXJlY3RpdmUpIHtcbiAgICAgIGRlYnVnU2V0Q3VycmVudE5vZGUodmlldywgbmV4dERpcmVjdGl2ZVdpdGhCaW5kaW5nKHZpZXcsIG5vZGVJbmRleCkpO1xuICAgIH1cbiAgICByZXR1cm4gKG5vZGVEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuQ2F0UHVyZUV4cHJlc3Npb24pID9cbiAgICAgICAgYXNQdXJlRXhwcmVzc2lvbkRhdGEodmlldywgbm9kZURlZi5ub2RlSW5kZXgpLnZhbHVlIDpcbiAgICAgICAgdW5kZWZpbmVkO1xuICB9XG59XG5cbmZ1bmN0aW9uIGRlYnVnVXBkYXRlUmVuZGVyZXIodmlldzogVmlld0RhdGEsIGNoZWNrVHlwZTogQ2hlY2tUeXBlKSB7XG4gIGlmICh2aWV3LnN0YXRlICYgVmlld1N0YXRlLkRlc3Ryb3llZCkge1xuICAgIHRocm93IHZpZXdEZXN0cm95ZWRFcnJvcihEZWJ1Z0FjdGlvbltfY3VycmVudEFjdGlvbl0pO1xuICB9XG4gIGRlYnVnU2V0Q3VycmVudE5vZGUodmlldywgbmV4dFJlbmRlck5vZGVXaXRoQmluZGluZyh2aWV3LCAwKSk7XG4gIHJldHVybiB2aWV3LmRlZi51cGRhdGVSZW5kZXJlcihkZWJ1Z0NoZWNrUmVuZGVyTm9kZUZuLCB2aWV3KTtcblxuICBmdW5jdGlvbiBkZWJ1Z0NoZWNrUmVuZGVyTm9kZUZuKFxuICAgICAgdmlldzogVmlld0RhdGEsIG5vZGVJbmRleDogbnVtYmVyLCBhcmdTdHlsZTogQXJndW1lbnRUeXBlLCAuLi52YWx1ZXM6IGFueVtdKSB7XG4gICAgY29uc3Qgbm9kZURlZiA9IHZpZXcuZGVmLm5vZGVzW25vZGVJbmRleF07XG4gICAgaWYgKGNoZWNrVHlwZSA9PT0gQ2hlY2tUeXBlLkNoZWNrQW5kVXBkYXRlKSB7XG4gICAgICBkZWJ1Z0NoZWNrQW5kVXBkYXRlTm9kZSh2aWV3LCBub2RlRGVmLCBhcmdTdHlsZSwgdmFsdWVzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVidWdDaGVja05vQ2hhbmdlc05vZGUodmlldywgbm9kZURlZiwgYXJnU3R5bGUsIHZhbHVlcyk7XG4gICAgfVxuICAgIGlmIChub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLkNhdFJlbmRlck5vZGUpIHtcbiAgICAgIGRlYnVnU2V0Q3VycmVudE5vZGUodmlldywgbmV4dFJlbmRlck5vZGVXaXRoQmluZGluZyh2aWV3LCBub2RlSW5kZXgpKTtcbiAgICB9XG4gICAgcmV0dXJuIChub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLkNhdFB1cmVFeHByZXNzaW9uKSA/XG4gICAgICAgIGFzUHVyZUV4cHJlc3Npb25EYXRhKHZpZXcsIG5vZGVEZWYubm9kZUluZGV4KS52YWx1ZSA6XG4gICAgICAgIHVuZGVmaW5lZDtcbiAgfVxufVxuXG5mdW5jdGlvbiBkZWJ1Z0NoZWNrQW5kVXBkYXRlTm9kZShcbiAgICB2aWV3OiBWaWV3RGF0YSwgbm9kZURlZjogTm9kZURlZiwgYXJnU3R5bGU6IEFyZ3VtZW50VHlwZSwgZ2l2ZW5WYWx1ZXM6IGFueVtdKTogdm9pZCB7XG4gIGNvbnN0IGNoYW5nZWQgPSAoPGFueT5jaGVja0FuZFVwZGF0ZU5vZGUpKHZpZXcsIG5vZGVEZWYsIGFyZ1N0eWxlLCAuLi5naXZlblZhbHVlcyk7XG4gIGlmIChjaGFuZ2VkKSB7XG4gICAgY29uc3QgdmFsdWVzID0gYXJnU3R5bGUgPT09IEFyZ3VtZW50VHlwZS5EeW5hbWljID8gZ2l2ZW5WYWx1ZXNbMF0gOiBnaXZlblZhbHVlcztcbiAgICBpZiAobm9kZURlZi5mbGFncyAmIE5vZGVGbGFncy5UeXBlRGlyZWN0aXZlKSB7XG4gICAgICBjb25zdCBiaW5kaW5nVmFsdWVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfSA9IHt9O1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBub2RlRGVmLmJpbmRpbmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGJpbmRpbmcgPSBub2RlRGVmLmJpbmRpbmdzW2ldO1xuICAgICAgICBjb25zdCB2YWx1ZSA9IHZhbHVlc1tpXTtcbiAgICAgICAgaWYgKGJpbmRpbmcuZmxhZ3MgJiBCaW5kaW5nRmxhZ3MuVHlwZVByb3BlcnR5KSB7XG4gICAgICAgICAgYmluZGluZ1ZhbHVlc1tub3JtYWxpemVEZWJ1Z0JpbmRpbmdOYW1lKGJpbmRpbmcubm9uTWluaWZpZWROYW1lISldID1cbiAgICAgICAgICAgICAgbm9ybWFsaXplRGVidWdCaW5kaW5nVmFsdWUodmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb25zdCBlbERlZiA9IG5vZGVEZWYucGFyZW50ITtcbiAgICAgIGNvbnN0IGVsID0gYXNFbGVtZW50RGF0YSh2aWV3LCBlbERlZi5ub2RlSW5kZXgpLnJlbmRlckVsZW1lbnQ7XG4gICAgICBpZiAoIWVsRGVmLmVsZW1lbnQhLm5hbWUpIHtcbiAgICAgICAgLy8gYSBjb21tZW50LlxuICAgICAgICB2aWV3LnJlbmRlcmVyLnNldFZhbHVlKFxuICAgICAgICAgICAgZWwsIGVzY2FwZUNvbW1lbnRUZXh0KGBiaW5kaW5ncz0ke0pTT04uc3RyaW5naWZ5KGJpbmRpbmdWYWx1ZXMsIG51bGwsIDIpfWApKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGEgcmVndWxhciBlbGVtZW50LlxuICAgICAgICBmb3IgKGxldCBhdHRyIGluIGJpbmRpbmdWYWx1ZXMpIHtcbiAgICAgICAgICBjb25zdCB2YWx1ZSA9IGJpbmRpbmdWYWx1ZXNbYXR0cl07XG4gICAgICAgICAgaWYgKHZhbHVlICE9IG51bGwpIHtcbiAgICAgICAgICAgIHZpZXcucmVuZGVyZXIuc2V0QXR0cmlidXRlKGVsLCBhdHRyLCB2YWx1ZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZpZXcucmVuZGVyZXIucmVtb3ZlQXR0cmlidXRlKGVsLCBhdHRyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gZGVidWdDaGVja05vQ2hhbmdlc05vZGUoXG4gICAgdmlldzogVmlld0RhdGEsIG5vZGVEZWY6IE5vZGVEZWYsIGFyZ1N0eWxlOiBBcmd1bWVudFR5cGUsIHZhbHVlczogYW55W10pOiB2b2lkIHtcbiAgKDxhbnk+Y2hlY2tOb0NoYW5nZXNOb2RlKSh2aWV3LCBub2RlRGVmLCBhcmdTdHlsZSwgLi4udmFsdWVzKTtcbn1cblxuZnVuY3Rpb24gbmV4dERpcmVjdGl2ZVdpdGhCaW5kaW5nKHZpZXc6IFZpZXdEYXRhLCBub2RlSW5kZXg6IG51bWJlcik6IG51bWJlcnxudWxsIHtcbiAgZm9yIChsZXQgaSA9IG5vZGVJbmRleDsgaSA8IHZpZXcuZGVmLm5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qgbm9kZURlZiA9IHZpZXcuZGVmLm5vZGVzW2ldO1xuICAgIGlmIChub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLlR5cGVEaXJlY3RpdmUgJiYgbm9kZURlZi5iaW5kaW5ncyAmJiBub2RlRGVmLmJpbmRpbmdzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIGk7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBuZXh0UmVuZGVyTm9kZVdpdGhCaW5kaW5nKHZpZXc6IFZpZXdEYXRhLCBub2RlSW5kZXg6IG51bWJlcik6IG51bWJlcnxudWxsIHtcbiAgZm9yIChsZXQgaSA9IG5vZGVJbmRleDsgaSA8IHZpZXcuZGVmLm5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qgbm9kZURlZiA9IHZpZXcuZGVmLm5vZGVzW2ldO1xuICAgIGlmICgobm9kZURlZi5mbGFncyAmIE5vZGVGbGFncy5DYXRSZW5kZXJOb2RlKSAmJiBub2RlRGVmLmJpbmRpbmdzICYmIG5vZGVEZWYuYmluZGluZ3MubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gaTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmNsYXNzIERlYnVnQ29udGV4dF8gaW1wbGVtZW50cyBEZWJ1Z0NvbnRleHQge1xuICBwcml2YXRlIG5vZGVEZWY6IE5vZGVEZWY7XG4gIHByaXZhdGUgZWxWaWV3OiBWaWV3RGF0YTtcbiAgcHJpdmF0ZSBlbERlZjogTm9kZURlZjtcblxuICBjb25zdHJ1Y3RvcihwdWJsaWMgdmlldzogVmlld0RhdGEsIHB1YmxpYyBub2RlSW5kZXg6IG51bWJlcnxudWxsKSB7XG4gICAgaWYgKG5vZGVJbmRleCA9PSBudWxsKSB7XG4gICAgICB0aGlzLm5vZGVJbmRleCA9IG5vZGVJbmRleCA9IDA7XG4gICAgfVxuICAgIHRoaXMubm9kZURlZiA9IHZpZXcuZGVmLm5vZGVzW25vZGVJbmRleF07XG4gICAgbGV0IGVsRGVmID0gdGhpcy5ub2RlRGVmO1xuICAgIGxldCBlbFZpZXcgPSB2aWV3O1xuICAgIHdoaWxlIChlbERlZiAmJiAoZWxEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuVHlwZUVsZW1lbnQpID09PSAwKSB7XG4gICAgICBlbERlZiA9IGVsRGVmLnBhcmVudCE7XG4gICAgfVxuICAgIGlmICghZWxEZWYpIHtcbiAgICAgIHdoaWxlICghZWxEZWYgJiYgZWxWaWV3KSB7XG4gICAgICAgIGVsRGVmID0gdmlld1BhcmVudEVsKGVsVmlldykhO1xuICAgICAgICBlbFZpZXcgPSBlbFZpZXcucGFyZW50ITtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5lbERlZiA9IGVsRGVmO1xuICAgIHRoaXMuZWxWaWV3ID0gZWxWaWV3O1xuICB9XG5cbiAgcHJpdmF0ZSBnZXQgZWxPckNvbXBWaWV3KCkge1xuICAgIC8vIEhhcyB0byBiZSBkb25lIGxhemlseSBhcyB3ZSB1c2UgdGhlIERlYnVnQ29udGV4dCBhbHNvIGR1cmluZyBjcmVhdGlvbiBvZiBlbGVtZW50cy4uLlxuICAgIHJldHVybiBhc0VsZW1lbnREYXRhKHRoaXMuZWxWaWV3LCB0aGlzLmVsRGVmLm5vZGVJbmRleCkuY29tcG9uZW50VmlldyB8fCB0aGlzLnZpZXc7XG4gIH1cblxuICBnZXQgaW5qZWN0b3IoKTogSW5qZWN0b3Ige1xuICAgIHJldHVybiBjcmVhdGVJbmplY3Rvcih0aGlzLmVsVmlldywgdGhpcy5lbERlZik7XG4gIH1cblxuICBnZXQgY29tcG9uZW50KCk6IGFueSB7XG4gICAgcmV0dXJuIHRoaXMuZWxPckNvbXBWaWV3LmNvbXBvbmVudDtcbiAgfVxuXG4gIGdldCBjb250ZXh0KCk6IGFueSB7XG4gICAgcmV0dXJuIHRoaXMuZWxPckNvbXBWaWV3LmNvbnRleHQ7XG4gIH1cblxuICBnZXQgcHJvdmlkZXJUb2tlbnMoKTogYW55W10ge1xuICAgIGNvbnN0IHRva2VuczogYW55W10gPSBbXTtcbiAgICBpZiAodGhpcy5lbERlZikge1xuICAgICAgZm9yIChsZXQgaSA9IHRoaXMuZWxEZWYubm9kZUluZGV4ICsgMTsgaSA8PSB0aGlzLmVsRGVmLm5vZGVJbmRleCArIHRoaXMuZWxEZWYuY2hpbGRDb3VudDtcbiAgICAgICAgICAgaSsrKSB7XG4gICAgICAgIGNvbnN0IGNoaWxkRGVmID0gdGhpcy5lbFZpZXcuZGVmLm5vZGVzW2ldO1xuICAgICAgICBpZiAoY2hpbGREZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuQ2F0UHJvdmlkZXIpIHtcbiAgICAgICAgICB0b2tlbnMucHVzaChjaGlsZERlZi5wcm92aWRlciEudG9rZW4pO1xuICAgICAgICB9XG4gICAgICAgIGkgKz0gY2hpbGREZWYuY2hpbGRDb3VudDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRva2VucztcbiAgfVxuXG4gIGdldCByZWZlcmVuY2VzKCk6IHtba2V5OiBzdHJpbmddOiBhbnl9IHtcbiAgICBjb25zdCByZWZlcmVuY2VzOiB7W2tleTogc3RyaW5nXTogYW55fSA9IHt9O1xuICAgIGlmICh0aGlzLmVsRGVmKSB7XG4gICAgICBjb2xsZWN0UmVmZXJlbmNlcyh0aGlzLmVsVmlldywgdGhpcy5lbERlZiwgcmVmZXJlbmNlcyk7XG5cbiAgICAgIGZvciAobGV0IGkgPSB0aGlzLmVsRGVmLm5vZGVJbmRleCArIDE7IGkgPD0gdGhpcy5lbERlZi5ub2RlSW5kZXggKyB0aGlzLmVsRGVmLmNoaWxkQ291bnQ7XG4gICAgICAgICAgIGkrKykge1xuICAgICAgICBjb25zdCBjaGlsZERlZiA9IHRoaXMuZWxWaWV3LmRlZi5ub2Rlc1tpXTtcbiAgICAgICAgaWYgKGNoaWxkRGVmLmZsYWdzICYgTm9kZUZsYWdzLkNhdFByb3ZpZGVyKSB7XG4gICAgICAgICAgY29sbGVjdFJlZmVyZW5jZXModGhpcy5lbFZpZXcsIGNoaWxkRGVmLCByZWZlcmVuY2VzKTtcbiAgICAgICAgfVxuICAgICAgICBpICs9IGNoaWxkRGVmLmNoaWxkQ291bnQ7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZWZlcmVuY2VzO1xuICB9XG5cbiAgZ2V0IGNvbXBvbmVudFJlbmRlckVsZW1lbnQoKSB7XG4gICAgY29uc3QgZWxEYXRhID0gZmluZEhvc3RFbGVtZW50KHRoaXMuZWxPckNvbXBWaWV3KTtcbiAgICByZXR1cm4gZWxEYXRhID8gZWxEYXRhLnJlbmRlckVsZW1lbnQgOiB1bmRlZmluZWQ7XG4gIH1cblxuICBnZXQgcmVuZGVyTm9kZSgpOiBhbnkge1xuICAgIHJldHVybiB0aGlzLm5vZGVEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuVHlwZVRleHQgPyByZW5kZXJOb2RlKHRoaXMudmlldywgdGhpcy5ub2RlRGVmKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbmRlck5vZGUodGhpcy5lbFZpZXcsIHRoaXMuZWxEZWYpO1xuICB9XG5cbiAgbG9nRXJyb3IoY29uc29sZTogQ29uc29sZSwgLi4udmFsdWVzOiBhbnlbXSkge1xuICAgIGxldCBsb2dWaWV3RGVmOiBWaWV3RGVmaW5pdGlvbjtcbiAgICBsZXQgbG9nTm9kZUluZGV4OiBudW1iZXI7XG4gICAgaWYgKHRoaXMubm9kZURlZi5mbGFncyAmIE5vZGVGbGFncy5UeXBlVGV4dCkge1xuICAgICAgbG9nVmlld0RlZiA9IHRoaXMudmlldy5kZWY7XG4gICAgICBsb2dOb2RlSW5kZXggPSB0aGlzLm5vZGVEZWYubm9kZUluZGV4O1xuICAgIH0gZWxzZSB7XG4gICAgICBsb2dWaWV3RGVmID0gdGhpcy5lbFZpZXcuZGVmO1xuICAgICAgbG9nTm9kZUluZGV4ID0gdGhpcy5lbERlZi5ub2RlSW5kZXg7XG4gICAgfVxuICAgIC8vIE5vdGU6IHdlIG9ubHkgZ2VuZXJhdGUgYSBsb2cgZnVuY3Rpb24gZm9yIHRleHQgYW5kIGVsZW1lbnQgbm9kZXNcbiAgICAvLyB0byBtYWtlIHRoZSBnZW5lcmF0ZWQgY29kZSBhcyBzbWFsbCBhcyBwb3NzaWJsZS5cbiAgICBjb25zdCByZW5kZXJOb2RlSW5kZXggPSBnZXRSZW5kZXJOb2RlSW5kZXgobG9nVmlld0RlZiwgbG9nTm9kZUluZGV4KTtcbiAgICBsZXQgY3VyclJlbmRlck5vZGVJbmRleCA9IC0xO1xuICAgIGxldCBub2RlTG9nZ2VyOiBOb2RlTG9nZ2VyID0gKCkgPT4ge1xuICAgICAgY3VyclJlbmRlck5vZGVJbmRleCsrO1xuICAgICAgaWYgKGN1cnJSZW5kZXJOb2RlSW5kZXggPT09IHJlbmRlck5vZGVJbmRleCkge1xuICAgICAgICByZXR1cm4gY29uc29sZS5lcnJvci5iaW5kKGNvbnNvbGUsIC4uLnZhbHVlcyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gTk9PUDtcbiAgICAgIH1cbiAgICB9O1xuICAgIGxvZ1ZpZXdEZWYuZmFjdG9yeSEobm9kZUxvZ2dlcik7XG4gICAgaWYgKGN1cnJSZW5kZXJOb2RlSW5kZXggPCByZW5kZXJOb2RlSW5kZXgpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0lsbGVnYWwgc3RhdGU6IHRoZSBWaWV3RGVmaW5pdGlvbkZhY3RvcnkgZGlkIG5vdCBjYWxsIHRoZSBsb2dnZXIhJyk7XG4gICAgICAoPGFueT5jb25zb2xlLmVycm9yKSguLi52YWx1ZXMpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRSZW5kZXJOb2RlSW5kZXgodmlld0RlZjogVmlld0RlZmluaXRpb24sIG5vZGVJbmRleDogbnVtYmVyKTogbnVtYmVyIHtcbiAgbGV0IHJlbmRlck5vZGVJbmRleCA9IC0xO1xuICBmb3IgKGxldCBpID0gMDsgaSA8PSBub2RlSW5kZXg7IGkrKykge1xuICAgIGNvbnN0IG5vZGVEZWYgPSB2aWV3RGVmLm5vZGVzW2ldO1xuICAgIGlmIChub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLkNhdFJlbmRlck5vZGUpIHtcbiAgICAgIHJlbmRlck5vZGVJbmRleCsrO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVuZGVyTm9kZUluZGV4O1xufVxuXG5mdW5jdGlvbiBmaW5kSG9zdEVsZW1lbnQodmlldzogVmlld0RhdGEpOiBFbGVtZW50RGF0YXxudWxsIHtcbiAgd2hpbGUgKHZpZXcgJiYgIWlzQ29tcG9uZW50Vmlldyh2aWV3KSkge1xuICAgIHZpZXcgPSB2aWV3LnBhcmVudCE7XG4gIH1cbiAgaWYgKHZpZXcucGFyZW50KSB7XG4gICAgcmV0dXJuIGFzRWxlbWVudERhdGEodmlldy5wYXJlbnQsIHZpZXdQYXJlbnRFbCh2aWV3KSEubm9kZUluZGV4KTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gY29sbGVjdFJlZmVyZW5jZXModmlldzogVmlld0RhdGEsIG5vZGVEZWY6IE5vZGVEZWYsIHJlZmVyZW5jZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9KSB7XG4gIGZvciAobGV0IHJlZk5hbWUgaW4gbm9kZURlZi5yZWZlcmVuY2VzKSB7XG4gICAgcmVmZXJlbmNlc1tyZWZOYW1lXSA9IGdldFF1ZXJ5VmFsdWUodmlldywgbm9kZURlZiwgbm9kZURlZi5yZWZlcmVuY2VzW3JlZk5hbWVdKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjYWxsV2l0aERlYnVnQ29udGV4dChhY3Rpb246IERlYnVnQWN0aW9uLCBmbjogYW55LCBzZWxmOiBhbnksIGFyZ3M6IGFueVtdKSB7XG4gIGNvbnN0IG9sZEFjdGlvbiA9IF9jdXJyZW50QWN0aW9uO1xuICBjb25zdCBvbGRWaWV3ID0gX2N1cnJlbnRWaWV3O1xuICBjb25zdCBvbGROb2RlSW5kZXggPSBfY3VycmVudE5vZGVJbmRleDtcbiAgdHJ5IHtcbiAgICBfY3VycmVudEFjdGlvbiA9IGFjdGlvbjtcbiAgICBjb25zdCByZXN1bHQgPSBmbi5hcHBseShzZWxmLCBhcmdzKTtcbiAgICBfY3VycmVudFZpZXcgPSBvbGRWaWV3O1xuICAgIF9jdXJyZW50Tm9kZUluZGV4ID0gb2xkTm9kZUluZGV4O1xuICAgIF9jdXJyZW50QWN0aW9uID0gb2xkQWN0aW9uO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBpZiAoaXNWaWV3RGVidWdFcnJvcihlKSB8fCAhX2N1cnJlbnRWaWV3KSB7XG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgICB0aHJvdyB2aWV3V3JhcHBlZERlYnVnRXJyb3IoZSwgZ2V0Q3VycmVudERlYnVnQ29udGV4dCgpISk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEN1cnJlbnREZWJ1Z0NvbnRleHQoKTogRGVidWdDb250ZXh0fG51bGwge1xuICByZXR1cm4gX2N1cnJlbnRWaWV3ID8gbmV3IERlYnVnQ29udGV4dF8oX2N1cnJlbnRWaWV3LCBfY3VycmVudE5vZGVJbmRleCkgOiBudWxsO1xufVxuXG5leHBvcnQgY2xhc3MgRGVidWdSZW5kZXJlckZhY3RvcnkyIGltcGxlbWVudHMgUmVuZGVyZXJGYWN0b3J5MiB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgZGVsZWdhdGU6IFJlbmRlcmVyRmFjdG9yeTIpIHt9XG5cbiAgY3JlYXRlUmVuZGVyZXIoZWxlbWVudDogYW55LCByZW5kZXJEYXRhOiBSZW5kZXJlclR5cGUyfG51bGwpOiBSZW5kZXJlcjIge1xuICAgIHJldHVybiBuZXcgRGVidWdSZW5kZXJlcjIodGhpcy5kZWxlZ2F0ZS5jcmVhdGVSZW5kZXJlcihlbGVtZW50LCByZW5kZXJEYXRhKSk7XG4gIH1cblxuICBiZWdpbigpIHtcbiAgICBpZiAodGhpcy5kZWxlZ2F0ZS5iZWdpbikge1xuICAgICAgdGhpcy5kZWxlZ2F0ZS5iZWdpbigpO1xuICAgIH1cbiAgfVxuICBlbmQoKSB7XG4gICAgaWYgKHRoaXMuZGVsZWdhdGUuZW5kKSB7XG4gICAgICB0aGlzLmRlbGVnYXRlLmVuZCgpO1xuICAgIH1cbiAgfVxuXG4gIHdoZW5SZW5kZXJpbmdEb25lKCk6IFByb21pc2U8YW55PiB7XG4gICAgaWYgKHRoaXMuZGVsZWdhdGUud2hlblJlbmRlcmluZ0RvbmUpIHtcbiAgICAgIHJldHVybiB0aGlzLmRlbGVnYXRlLndoZW5SZW5kZXJpbmdEb25lKCk7XG4gICAgfVxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobnVsbCk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIERlYnVnUmVuZGVyZXIyIGltcGxlbWVudHMgUmVuZGVyZXIyIHtcbiAgcmVhZG9ubHkgZGF0YToge1trZXk6IHN0cmluZ106IGFueX07XG5cbiAgcHJpdmF0ZSBjcmVhdGVEZWJ1Z0NvbnRleHQobmF0aXZlRWxlbWVudDogYW55KSB7XG4gICAgcmV0dXJuIHRoaXMuZGVidWdDb250ZXh0RmFjdG9yeShuYXRpdmVFbGVtZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGYWN0b3J5IGZ1bmN0aW9uIHVzZWQgdG8gY3JlYXRlIGEgYERlYnVnQ29udGV4dGAgd2hlbiBhIG5vZGUgaXMgY3JlYXRlZC5cbiAgICpcbiAgICogVGhlIGBEZWJ1Z0NvbnRleHRgIGFsbG93cyB0byByZXRyaWV2ZSBpbmZvcm1hdGlvbiBhYm91dCB0aGUgbm9kZXMgdGhhdCBhcmUgdXNlZnVsIGluIHRlc3RzLlxuICAgKlxuICAgKiBUaGUgZmFjdG9yeSBpcyBjb25maWd1cmFibGUgc28gdGhhdCB0aGUgYERlYnVnUmVuZGVyZXIyYCBjb3VsZCBpbnN0YW50aWF0ZSBlaXRoZXIgYSBWaWV3IEVuZ2luZVxuICAgKiBvciBhIFJlbmRlciBjb250ZXh0LlxuICAgKi9cbiAgZGVidWdDb250ZXh0RmFjdG9yeTogKG5hdGl2ZUVsZW1lbnQ/OiBhbnkpID0+IERlYnVnQ29udGV4dCB8IG51bGwgPSBnZXRDdXJyZW50RGVidWdDb250ZXh0O1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgZGVsZWdhdGU6IFJlbmRlcmVyMikge1xuICAgIHRoaXMuZGF0YSA9IHRoaXMuZGVsZWdhdGUuZGF0YTtcbiAgfVxuXG4gIGRlc3Ryb3lOb2RlKG5vZGU6IGFueSkge1xuICAgIGNvbnN0IGRlYnVnTm9kZSA9IGdldERlYnVnTm9kZShub2RlKSE7XG4gICAgcmVtb3ZlRGVidWdOb2RlRnJvbUluZGV4KGRlYnVnTm9kZSk7XG4gICAgaWYgKGRlYnVnTm9kZSBpbnN0YW5jZW9mIERlYnVnTm9kZV9fUFJFX1IzX18pIHtcbiAgICAgIGRlYnVnTm9kZS5saXN0ZW5lcnMubGVuZ3RoID0gMDtcbiAgICB9XG4gICAgaWYgKHRoaXMuZGVsZWdhdGUuZGVzdHJveU5vZGUpIHtcbiAgICAgIHRoaXMuZGVsZWdhdGUuZGVzdHJveU5vZGUobm9kZSk7XG4gICAgfVxuICB9XG5cbiAgZGVzdHJveSgpIHtcbiAgICB0aGlzLmRlbGVnYXRlLmRlc3Ryb3koKTtcbiAgfVxuXG4gIGNyZWF0ZUVsZW1lbnQobmFtZTogc3RyaW5nLCBuYW1lc3BhY2U/OiBzdHJpbmcpOiBhbnkge1xuICAgIGNvbnN0IGVsID0gdGhpcy5kZWxlZ2F0ZS5jcmVhdGVFbGVtZW50KG5hbWUsIG5hbWVzcGFjZSk7XG4gICAgY29uc3QgZGVidWdDdHggPSB0aGlzLmNyZWF0ZURlYnVnQ29udGV4dChlbCk7XG4gICAgaWYgKGRlYnVnQ3R4KSB7XG4gICAgICBjb25zdCBkZWJ1Z0VsID0gbmV3IERlYnVnRWxlbWVudF9fUFJFX1IzX18oZWwsIG51bGwsIGRlYnVnQ3R4KTtcbiAgICAgIChkZWJ1Z0VsIGFzIHtuYW1lOiBzdHJpbmd9KS5uYW1lID0gbmFtZTtcbiAgICAgIGluZGV4RGVidWdOb2RlKGRlYnVnRWwpO1xuICAgIH1cbiAgICByZXR1cm4gZWw7XG4gIH1cblxuICBjcmVhdGVDb21tZW50KHZhbHVlOiBzdHJpbmcpOiBhbnkge1xuICAgIGNvbnN0IGNvbW1lbnQgPSB0aGlzLmRlbGVnYXRlLmNyZWF0ZUNvbW1lbnQoZXNjYXBlQ29tbWVudFRleHQodmFsdWUpKTtcbiAgICBjb25zdCBkZWJ1Z0N0eCA9IHRoaXMuY3JlYXRlRGVidWdDb250ZXh0KGNvbW1lbnQpO1xuICAgIGlmIChkZWJ1Z0N0eCkge1xuICAgICAgaW5kZXhEZWJ1Z05vZGUobmV3IERlYnVnTm9kZV9fUFJFX1IzX18oY29tbWVudCwgbnVsbCwgZGVidWdDdHgpKTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbW1lbnQ7XG4gIH1cblxuICBjcmVhdGVUZXh0KHZhbHVlOiBzdHJpbmcpOiBhbnkge1xuICAgIGNvbnN0IHRleHQgPSB0aGlzLmRlbGVnYXRlLmNyZWF0ZVRleHQodmFsdWUpO1xuICAgIGNvbnN0IGRlYnVnQ3R4ID0gdGhpcy5jcmVhdGVEZWJ1Z0NvbnRleHQodGV4dCk7XG4gICAgaWYgKGRlYnVnQ3R4KSB7XG4gICAgICBpbmRleERlYnVnTm9kZShuZXcgRGVidWdOb2RlX19QUkVfUjNfXyh0ZXh0LCBudWxsLCBkZWJ1Z0N0eCkpO1xuICAgIH1cbiAgICByZXR1cm4gdGV4dDtcbiAgfVxuXG4gIGFwcGVuZENoaWxkKHBhcmVudDogYW55LCBuZXdDaGlsZDogYW55KTogdm9pZCB7XG4gICAgY29uc3QgZGVidWdFbCA9IGdldERlYnVnTm9kZShwYXJlbnQpO1xuICAgIGNvbnN0IGRlYnVnQ2hpbGRFbCA9IGdldERlYnVnTm9kZShuZXdDaGlsZCk7XG4gICAgaWYgKGRlYnVnRWwgJiYgZGVidWdDaGlsZEVsICYmIGRlYnVnRWwgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fKSB7XG4gICAgICBkZWJ1Z0VsLmFkZENoaWxkKGRlYnVnQ2hpbGRFbCk7XG4gICAgfVxuICAgIHRoaXMuZGVsZWdhdGUuYXBwZW5kQ2hpbGQocGFyZW50LCBuZXdDaGlsZCk7XG4gIH1cblxuICBpbnNlcnRCZWZvcmUocGFyZW50OiBhbnksIG5ld0NoaWxkOiBhbnksIHJlZkNoaWxkOiBhbnksIGlzTW92ZT86IGJvb2xlYW4pOiB2b2lkIHtcbiAgICBjb25zdCBkZWJ1Z0VsID0gZ2V0RGVidWdOb2RlKHBhcmVudCk7XG4gICAgY29uc3QgZGVidWdDaGlsZEVsID0gZ2V0RGVidWdOb2RlKG5ld0NoaWxkKTtcbiAgICBjb25zdCBkZWJ1Z1JlZkVsID0gZ2V0RGVidWdOb2RlKHJlZkNoaWxkKSE7XG4gICAgaWYgKGRlYnVnRWwgJiYgZGVidWdDaGlsZEVsICYmIGRlYnVnRWwgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fKSB7XG4gICAgICBkZWJ1Z0VsLmluc2VydEJlZm9yZShkZWJ1Z1JlZkVsLCBkZWJ1Z0NoaWxkRWwpO1xuICAgIH1cblxuICAgIHRoaXMuZGVsZWdhdGUuaW5zZXJ0QmVmb3JlKHBhcmVudCwgbmV3Q2hpbGQsIHJlZkNoaWxkLCBpc01vdmUpO1xuICB9XG5cbiAgcmVtb3ZlQ2hpbGQocGFyZW50OiBhbnksIG9sZENoaWxkOiBhbnkpOiB2b2lkIHtcbiAgICBjb25zdCBkZWJ1Z0VsID0gZ2V0RGVidWdOb2RlKHBhcmVudCk7XG4gICAgY29uc3QgZGVidWdDaGlsZEVsID0gZ2V0RGVidWdOb2RlKG9sZENoaWxkKTtcbiAgICBpZiAoZGVidWdFbCAmJiBkZWJ1Z0NoaWxkRWwgJiYgZGVidWdFbCBpbnN0YW5jZW9mIERlYnVnRWxlbWVudF9fUFJFX1IzX18pIHtcbiAgICAgIGRlYnVnRWwucmVtb3ZlQ2hpbGQoZGVidWdDaGlsZEVsKTtcbiAgICB9XG4gICAgdGhpcy5kZWxlZ2F0ZS5yZW1vdmVDaGlsZChwYXJlbnQsIG9sZENoaWxkKTtcbiAgfVxuXG4gIHNlbGVjdFJvb3RFbGVtZW50KHNlbGVjdG9yT3JOb2RlOiBzdHJpbmd8YW55LCBwcmVzZXJ2ZUNvbnRlbnQ/OiBib29sZWFuKTogYW55IHtcbiAgICBjb25zdCBlbCA9IHRoaXMuZGVsZWdhdGUuc2VsZWN0Um9vdEVsZW1lbnQoc2VsZWN0b3JPck5vZGUsIHByZXNlcnZlQ29udGVudCk7XG4gICAgY29uc3QgZGVidWdDdHggPSBnZXRDdXJyZW50RGVidWdDb250ZXh0KCk7XG4gICAgaWYgKGRlYnVnQ3R4KSB7XG4gICAgICBpbmRleERlYnVnTm9kZShuZXcgRGVidWdFbGVtZW50X19QUkVfUjNfXyhlbCwgbnVsbCwgZGVidWdDdHgpKTtcbiAgICB9XG4gICAgcmV0dXJuIGVsO1xuICB9XG5cbiAgc2V0QXR0cmlidXRlKGVsOiBhbnksIG5hbWU6IHN0cmluZywgdmFsdWU6IHN0cmluZywgbmFtZXNwYWNlPzogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3QgZGVidWdFbCA9IGdldERlYnVnTm9kZShlbCk7XG4gICAgaWYgKGRlYnVnRWwgJiYgZGVidWdFbCBpbnN0YW5jZW9mIERlYnVnRWxlbWVudF9fUFJFX1IzX18pIHtcbiAgICAgIGNvbnN0IGZ1bGxOYW1lID0gbmFtZXNwYWNlID8gbmFtZXNwYWNlICsgJzonICsgbmFtZSA6IG5hbWU7XG4gICAgICBkZWJ1Z0VsLmF0dHJpYnV0ZXNbZnVsbE5hbWVdID0gdmFsdWU7XG4gICAgfVxuICAgIHRoaXMuZGVsZWdhdGUuc2V0QXR0cmlidXRlKGVsLCBuYW1lLCB2YWx1ZSwgbmFtZXNwYWNlKTtcbiAgfVxuXG4gIHJlbW92ZUF0dHJpYnV0ZShlbDogYW55LCBuYW1lOiBzdHJpbmcsIG5hbWVzcGFjZT86IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IGRlYnVnRWwgPSBnZXREZWJ1Z05vZGUoZWwpO1xuICAgIGlmIChkZWJ1Z0VsICYmIGRlYnVnRWwgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fKSB7XG4gICAgICBjb25zdCBmdWxsTmFtZSA9IG5hbWVzcGFjZSA/IG5hbWVzcGFjZSArICc6JyArIG5hbWUgOiBuYW1lO1xuICAgICAgZGVidWdFbC5hdHRyaWJ1dGVzW2Z1bGxOYW1lXSA9IG51bGw7XG4gICAgfVxuICAgIHRoaXMuZGVsZWdhdGUucmVtb3ZlQXR0cmlidXRlKGVsLCBuYW1lLCBuYW1lc3BhY2UpO1xuICB9XG5cbiAgYWRkQ2xhc3MoZWw6IGFueSwgbmFtZTogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3QgZGVidWdFbCA9IGdldERlYnVnTm9kZShlbCk7XG4gICAgaWYgKGRlYnVnRWwgJiYgZGVidWdFbCBpbnN0YW5jZW9mIERlYnVnRWxlbWVudF9fUFJFX1IzX18pIHtcbiAgICAgIGRlYnVnRWwuY2xhc3Nlc1tuYW1lXSA9IHRydWU7XG4gICAgfVxuICAgIHRoaXMuZGVsZWdhdGUuYWRkQ2xhc3MoZWwsIG5hbWUpO1xuICB9XG5cbiAgcmVtb3ZlQ2xhc3MoZWw6IGFueSwgbmFtZTogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3QgZGVidWdFbCA9IGdldERlYnVnTm9kZShlbCk7XG4gICAgaWYgKGRlYnVnRWwgJiYgZGVidWdFbCBpbnN0YW5jZW9mIERlYnVnRWxlbWVudF9fUFJFX1IzX18pIHtcbiAgICAgIGRlYnVnRWwuY2xhc3Nlc1tuYW1lXSA9IGZhbHNlO1xuICAgIH1cbiAgICB0aGlzLmRlbGVnYXRlLnJlbW92ZUNsYXNzKGVsLCBuYW1lKTtcbiAgfVxuXG4gIHNldFN0eWxlKGVsOiBhbnksIHN0eWxlOiBzdHJpbmcsIHZhbHVlOiBhbnksIGZsYWdzOiBSZW5kZXJlclN0eWxlRmxhZ3MyKTogdm9pZCB7XG4gICAgY29uc3QgZGVidWdFbCA9IGdldERlYnVnTm9kZShlbCk7XG4gICAgaWYgKGRlYnVnRWwgJiYgZGVidWdFbCBpbnN0YW5jZW9mIERlYnVnRWxlbWVudF9fUFJFX1IzX18pIHtcbiAgICAgIGRlYnVnRWwuc3R5bGVzW3N0eWxlXSA9IHZhbHVlO1xuICAgIH1cbiAgICB0aGlzLmRlbGVnYXRlLnNldFN0eWxlKGVsLCBzdHlsZSwgdmFsdWUsIGZsYWdzKTtcbiAgfVxuXG4gIHJlbW92ZVN0eWxlKGVsOiBhbnksIHN0eWxlOiBzdHJpbmcsIGZsYWdzOiBSZW5kZXJlclN0eWxlRmxhZ3MyKTogdm9pZCB7XG4gICAgY29uc3QgZGVidWdFbCA9IGdldERlYnVnTm9kZShlbCk7XG4gICAgaWYgKGRlYnVnRWwgJiYgZGVidWdFbCBpbnN0YW5jZW9mIERlYnVnRWxlbWVudF9fUFJFX1IzX18pIHtcbiAgICAgIGRlYnVnRWwuc3R5bGVzW3N0eWxlXSA9IG51bGw7XG4gICAgfVxuICAgIHRoaXMuZGVsZWdhdGUucmVtb3ZlU3R5bGUoZWwsIHN0eWxlLCBmbGFncyk7XG4gIH1cblxuICBzZXRQcm9wZXJ0eShlbDogYW55LCBuYW1lOiBzdHJpbmcsIHZhbHVlOiBhbnkpOiB2b2lkIHtcbiAgICBjb25zdCBkZWJ1Z0VsID0gZ2V0RGVidWdOb2RlKGVsKTtcbiAgICBpZiAoZGVidWdFbCAmJiBkZWJ1Z0VsIGluc3RhbmNlb2YgRGVidWdFbGVtZW50X19QUkVfUjNfXykge1xuICAgICAgZGVidWdFbC5wcm9wZXJ0aWVzW25hbWVdID0gdmFsdWU7XG4gICAgfVxuICAgIHRoaXMuZGVsZWdhdGUuc2V0UHJvcGVydHkoZWwsIG5hbWUsIHZhbHVlKTtcbiAgfVxuXG4gIGxpc3RlbihcbiAgICAgIHRhcmdldDogJ2RvY3VtZW50J3wnd2luZG93cyd8J2JvZHknfGFueSwgZXZlbnROYW1lOiBzdHJpbmcsXG4gICAgICBjYWxsYmFjazogKGV2ZW50OiBhbnkpID0+IGJvb2xlYW4pOiAoKSA9PiB2b2lkIHtcbiAgICBpZiAodHlwZW9mIHRhcmdldCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIGNvbnN0IGRlYnVnRWwgPSBnZXREZWJ1Z05vZGUodGFyZ2V0KTtcbiAgICAgIGlmIChkZWJ1Z0VsKSB7XG4gICAgICAgIGRlYnVnRWwubGlzdGVuZXJzLnB1c2gobmV3IERlYnVnRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIGNhbGxiYWNrKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuZGVsZWdhdGUubGlzdGVuKHRhcmdldCwgZXZlbnROYW1lLCBjYWxsYmFjayk7XG4gIH1cblxuICBwYXJlbnROb2RlKG5vZGU6IGFueSk6IGFueSB7XG4gICAgcmV0dXJuIHRoaXMuZGVsZWdhdGUucGFyZW50Tm9kZShub2RlKTtcbiAgfVxuICBuZXh0U2libGluZyhub2RlOiBhbnkpOiBhbnkge1xuICAgIHJldHVybiB0aGlzLmRlbGVnYXRlLm5leHRTaWJsaW5nKG5vZGUpO1xuICB9XG4gIHNldFZhbHVlKG5vZGU6IGFueSwgdmFsdWU6IHN0cmluZyk6IHZvaWQge1xuICAgIHJldHVybiB0aGlzLmRlbGVnYXRlLnNldFZhbHVlKG5vZGUsIHZhbHVlKTtcbiAgfVxufVxuIl19