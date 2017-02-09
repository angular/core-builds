/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { isDevMode } from '../application_ref';
import * as v1renderer from '../render/api';
import { Sanitizer } from '../security';
import { isViewDebugError, viewDestroyedError, viewWrappedDebugError } from './errors';
import { resolveDep } from './provider';
import { getQueryValue } from './query';
import { createInjector } from './refs';
import { DirectDomRenderer, LegacyRendererAdapter } from './renderer';
import { ArgumentType, BindingType, NodeType, Services, ViewState, asElementData } from './types';
import { checkBinding, findElementDef, isComponentView, renderNode } from './util';
import { checkAndUpdateView, checkNoChangesView, createEmbeddedView, createRootView, destroyView } from './view';
import { attachEmbeddedView, detachEmbeddedView, moveEmbeddedView } from './view_attach';
let /** @type {?} */ initialized = false;
/**
 * @return {?}
 */
export function initServicesIfNeeded() {
    if (initialized) {
        return;
    }
    initialized = true;
    const /** @type {?} */ services = isDevMode() ? createDebugServices() : createProdServices();
    Services.setCurrentNode = services.setCurrentNode;
    Services.createRootView = services.createRootView;
    Services.createEmbeddedView = services.createEmbeddedView;
    Services.checkAndUpdateView = services.checkAndUpdateView;
    Services.checkNoChangesView = services.checkNoChangesView;
    Services.destroyView = services.destroyView;
    Services.attachEmbeddedView = services.attachEmbeddedView,
        Services.detachEmbeddedView = services.detachEmbeddedView,
        Services.moveEmbeddedView = services.moveEmbeddedView;
    Services.resolveDep = services.resolveDep;
    Services.createDebugContext = services.createDebugContext;
    Services.handleEvent = services.handleEvent;
    Services.updateView = services.updateView;
}
/**
 * @return {?}
 */
function createProdServices() {
    return {
        setCurrentNode: () => { },
        createRootView: createProdRootView,
        createEmbeddedView: createEmbeddedView,
        checkAndUpdateView: checkAndUpdateView,
        checkNoChangesView: checkNoChangesView,
        destroyView: destroyView,
        attachEmbeddedView: attachEmbeddedView,
        detachEmbeddedView: detachEmbeddedView,
        moveEmbeddedView: moveEmbeddedView,
        resolveDep: resolveDep,
        createDebugContext: (view, nodeIndex) => new DebugContext_(view, nodeIndex),
        handleEvent: (view, nodeIndex, eventName, event) => view.def.handleEvent(view, nodeIndex, eventName, event),
        updateView: (check, view) => view.def.update(check, view)
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
        checkAndUpdateView: debugCheckAndUpdateView,
        checkNoChangesView: debugCheckNoChangesView,
        destroyView: debugDestroyView,
        attachEmbeddedView: attachEmbeddedView,
        detachEmbeddedView: detachEmbeddedView,
        moveEmbeddedView: moveEmbeddedView,
        resolveDep: resolveDep,
        createDebugContext: (view, nodeIndex) => new DebugContext_(view, nodeIndex),
        handleEvent: debugHandleEvent,
        updateView: debugUpdateView
    };
}
/**
 * @param {?} injector
 * @param {?} projectableNodes
 * @param {?} rootSelectorOrNode
 * @param {?} def
 * @param {?=} context
 * @return {?}
 */
function createProdRootView(injector, projectableNodes, rootSelectorOrNode, def, context) {
    return createRootView(createRootData(injector, projectableNodes, rootSelectorOrNode), def, context);
}
/**
 * @param {?} injector
 * @param {?} projectableNodes
 * @param {?} rootSelectorOrNode
 * @param {?} def
 * @param {?=} context
 * @return {?}
 */
function debugCreateRootView(injector, projectableNodes, rootSelectorOrNode, def, context) {
    const /** @type {?} */ root = createRootData(injector, projectableNodes, rootSelectorOrNode);
    const /** @type {?} */ debugRoot = {
        injector: root.injector,
        projectableNodes: root.projectableNodes,
        element: root.element,
        renderer: new DebugRenderer(root.renderer),
        sanitizer: root.sanitizer
    };
    return callWithDebugContext('create', createRootView, null, [debugRoot, def, context]);
}
/**
 * @param {?} injector
 * @param {?} projectableNodes
 * @param {?} rootSelectorOrNode
 * @return {?}
 */
function createRootData(injector, projectableNodes, rootSelectorOrNode) {
    const /** @type {?} */ sanitizer = injector.get(Sanitizer);
    // TODO(tbosch): once the new renderer interface is implemented via platform-browser,
    // just get it via the injector and drop LegacyRendererAdapter and DirectDomRenderer.
    const /** @type {?} */ renderer = isDevMode() ? new LegacyRendererAdapter(injector.get(v1renderer.RootRenderer)) :
        new DirectDomRenderer();
    const /** @type {?} */ rootElement = rootSelectorOrNode ? renderer.selectRootElement(rootSelectorOrNode) : undefined;
    return { injector, projectableNodes, element: rootElement, sanitizer, renderer };
}
/**
 * @param {?} parent
 * @param {?} anchorDef
 * @param {?=} context
 * @return {?}
 */
function debugCreateEmbeddedView(parent, anchorDef, context) {
    return callWithDebugContext('create', createEmbeddedView, null, [parent, anchorDef, context]);
}
/**
 * @param {?} view
 * @return {?}
 */
function debugCheckAndUpdateView(view) {
    return callWithDebugContext('detectChanges', checkAndUpdateView, null, [view]);
}
/**
 * @param {?} view
 * @return {?}
 */
function debugCheckNoChangesView(view) {
    return callWithDebugContext('checkNoChanges', checkNoChangesView, null, [view]);
}
/**
 * @param {?} view
 * @return {?}
 */
function debugDestroyView(view) {
    return callWithDebugContext('destroyView', destroyView, null, [view]);
}
let /** @type {?} */ _currentAction;
let /** @type {?} */ _currentView;
let /** @type {?} */ _currentNodeIndex;
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
    if (view.state & ViewState.Destroyed) {
        throw viewDestroyedError(_currentAction);
    }
    debugSetCurrentNode(view, nodeIndex);
    return callWithDebugContext('handleEvent', view.def.handleEvent, null, [view, nodeIndex, eventName, event]);
}
/**
 * @param {?} check
 * @param {?} view
 * @return {?}
 */
function debugUpdateView(check, view) {
    if (view.state & ViewState.Destroyed) {
        throw viewDestroyedError(_currentAction);
    }
    debugSetCurrentNode(view, nextNodeIndexWithBinding(view, 0));
    return view.def.update(debugCheckFn, view);
    /**
     * @param {?} view
     * @param {?} nodeIndex
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
    function debugCheckFn(view, nodeIndex, argStyle, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9) {
        const /** @type {?} */ values = argStyle === ArgumentType.Dynamic ? v0 : [].slice.call(arguments, 3);
        const /** @type {?} */ nodeDef = view.def.nodes[nodeIndex];
        for (let /** @type {?} */ i = 0; i < nodeDef.bindings.length; i++) {
            const /** @type {?} */ binding = nodeDef.bindings[i];
            const /** @type {?} */ value = values[i];
            if ((binding.type === BindingType.ElementProperty ||
                binding.type === BindingType.ProviderProperty) &&
                checkBinding(view, nodeDef, i, value)) {
                const /** @type {?} */ elIndex = nodeDef.type === NodeType.Provider ? nodeDef.parent : nodeDef.index;
                setBindingDebugInfo(view.root.renderer, asElementData(view, elIndex).renderElement, binding.nonMinifiedName, value);
            }
        }
        const /** @type {?} */ result = check(view, nodeIndex, /** @type {?} */ (argStyle), v0, v1, v2, v3, v4, v5, v6, v7, v8, v9);
        debugSetCurrentNode(view, nextNodeIndexWithBinding(view, nodeIndex));
        return result;
    }
    ;
}
/**
 * @param {?} renderer
 * @param {?} renderNode
 * @param {?} propName
 * @param {?} value
 * @return {?}
 */
function setBindingDebugInfo(renderer, renderNode, propName, value) {
    try {
        renderer.setAttribute(renderNode, `ng-reflect-${camelCaseToDashCase(propName)}`, value ? value.toString() : null);
    }
    catch (e) {
        renderer.setAttribute(renderNode, `ng-reflect-${camelCaseToDashCase(propName)}`, '[ERROR] Exception while trying to serialize the value');
    }
}
const /** @type {?} */ CAMEL_CASE_REGEXP = /([A-Z])/g;
/**
 * @param {?} input
 * @return {?}
 */
function camelCaseToDashCase(input) {
    return input.replace(CAMEL_CASE_REGEXP, (...m) => '-' + m[1].toLowerCase());
}
/**
 * @param {?} view
 * @param {?} nodeIndex
 * @return {?}
 */
function nextNodeIndexWithBinding(view, nodeIndex) {
    for (let /** @type {?} */ i = nodeIndex; i < view.def.nodes.length; i++) {
        const /** @type {?} */ nodeDef = view.def.nodes[i];
        if (nodeDef.bindings && nodeDef.bindings.length) {
            return i;
        }
    }
    return undefined;
}
class DebugRenderer {
    /**
     * @param {?} _delegate
     */
    constructor(_delegate) {
        this._delegate = _delegate;
    }
    /**
     * @param {?} name
     * @return {?}
     */
    createElement(name) {
        return this._delegate.createElement(name, getCurrentDebugContext());
    }
    /**
     * @param {?} value
     * @return {?}
     */
    createComment(value) {
        return this._delegate.createComment(value, getCurrentDebugContext());
    }
    /**
     * @param {?} value
     * @return {?}
     */
    createText(value) {
        return this._delegate.createText(value, getCurrentDebugContext());
    }
    /**
     * @param {?} parent
     * @param {?} newChild
     * @return {?}
     */
    appendChild(parent, newChild) {
        return this._delegate.appendChild(parent, newChild);
    }
    /**
     * @param {?} parent
     * @param {?} newChild
     * @param {?} refChild
     * @return {?}
     */
    insertBefore(parent, newChild, refChild) {
        return this._delegate.insertBefore(parent, newChild, refChild);
    }
    /**
     * @param {?} parent
     * @param {?} oldChild
     * @return {?}
     */
    removeChild(parent, oldChild) {
        return this._delegate.removeChild(parent, oldChild);
    }
    /**
     * @param {?} selectorOrNode
     * @return {?}
     */
    selectRootElement(selectorOrNode) {
        return this._delegate.selectRootElement(selectorOrNode, getCurrentDebugContext());
    }
    /**
     * @param {?} node
     * @return {?}
     */
    parentNode(node) { return this._delegate.parentNode(node); }
    /**
     * @param {?} node
     * @return {?}
     */
    nextSibling(node) { return this._delegate.nextSibling(node); }
    /**
     * @param {?} el
     * @param {?} name
     * @param {?} value
     * @return {?}
     */
    setAttribute(el, name, value) {
        return this._delegate.setAttribute(el, name, value);
    }
    /**
     * @param {?} el
     * @param {?} name
     * @return {?}
     */
    removeAttribute(el, name) { return this._delegate.removeAttribute(el, name); }
    /**
     * @param {?} el
     * @param {?} name
     * @return {?}
     */
    addClass(el, name) { return this._delegate.addClass(el, name); }
    /**
     * @param {?} el
     * @param {?} name
     * @return {?}
     */
    removeClass(el, name) { return this._delegate.removeClass(el, name); }
    /**
     * @param {?} el
     * @param {?} style
     * @param {?} value
     * @return {?}
     */
    setStyle(el, style, value) {
        return this._delegate.setStyle(el, style, value);
    }
    /**
     * @param {?} el
     * @param {?} style
     * @return {?}
     */
    removeStyle(el, style) { return this._delegate.removeStyle(el, style); }
    /**
     * @param {?} el
     * @param {?} name
     * @param {?} value
     * @return {?}
     */
    setProperty(el, name, value) {
        return this._delegate.setProperty(el, name, value);
    }
    /**
     * @param {?} node
     * @param {?} value
     * @return {?}
     */
    setText(node, value) { return this._delegate.setText(node, value); }
    /**
     * @param {?} target
     * @param {?} eventName
     * @param {?} callback
     * @return {?}
     */
    listen(target, eventName, callback) {
        return this._delegate.listen(target, eventName, callback);
    }
}
function DebugRenderer_tsickle_Closure_declarations() {
    /** @type {?} */
    DebugRenderer.prototype._delegate;
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
            this.nodeIndex = nodeIndex = view.parentIndex;
            this.view = view = view.parent;
        }
        this.nodeDef = view.def.nodes[nodeIndex];
        this.elDef = findElementDef(view, nodeIndex);
    }
    /**
     * @return {?}
     */
    get injector() { return createInjector(this.view, this.elDef.index); }
    /**
     * @return {?}
     */
    get component() { return this.view.component; }
    /**
     * @return {?}
     */
    get providerTokens() {
        const /** @type {?} */ tokens = [];
        if (this.elDef) {
            for (let /** @type {?} */ i = this.elDef.index + 1; i <= this.elDef.index + this.elDef.childCount; i++) {
                const /** @type {?} */ childDef = this.view.def.nodes[i];
                if (childDef.type === NodeType.Provider) {
                    tokens.push(childDef.provider.token);
                }
                else {
                    i += childDef.childCount;
                }
            }
        }
        return tokens;
    }
    /**
     * @return {?}
     */
    get references() {
        const /** @type {?} */ references = {};
        if (this.elDef) {
            collectReferences(this.view, this.elDef, references);
            for (let /** @type {?} */ i = this.elDef.index + 1; i <= this.elDef.index + this.elDef.childCount; i++) {
                const /** @type {?} */ childDef = this.view.def.nodes[i];
                if (childDef.type === NodeType.Provider) {
                    collectReferences(this.view, childDef, references);
                }
                else {
                    i += childDef.childCount;
                }
            }
        }
        return references;
    }
    /**
     * @return {?}
     */
    get context() { return this.view.context; }
    /**
     * @return {?}
     */
    get source() {
        if (this.nodeDef.type === NodeType.Text) {
            return this.nodeDef.text.source;
        }
        else {
            return this.elDef.element.source;
        }
    }
    /**
     * @return {?}
     */
    get componentRenderElement() {
        const /** @type {?} */ elData = findHostElement(this.view);
        return elData ? elData.renderElement : undefined;
    }
    /**
     * @return {?}
     */
    get renderNode() {
        let /** @type {?} */ nodeDef = this.nodeDef.type === NodeType.Text ? this.nodeDef : this.elDef;
        return renderNode(this.view, nodeDef);
    }
}
function DebugContext__tsickle_Closure_declarations() {
    /** @type {?} */
    DebugContext_.prototype.nodeDef;
    /** @type {?} */
    DebugContext_.prototype.elDef;
    /** @type {?} */
    DebugContext_.prototype.view;
    /** @type {?} */
    DebugContext_.prototype.nodeIndex;
}
/**
 * @param {?} view
 * @return {?}
 */
function findHostElement(view) {
    while (view && !isComponentView(view)) {
        view = view.parent;
    }
    if (view.parent) {
        const /** @type {?} */ hostData = asElementData(view.parent, view.parentIndex);
        return hostData;
    }
    return undefined;
}
/**
 * @param {?} view
 * @param {?} nodeDef
 * @param {?} references
 * @return {?}
 */
function collectReferences(view, nodeDef, references) {
    for (let /** @type {?} */ queryId in nodeDef.matchedQueries) {
        if (queryId.startsWith('#')) {
            references[queryId.slice(1)] = getQueryValue(view, nodeDef, queryId);
        }
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
    const /** @type {?} */ oldAction = _currentAction;
    const /** @type {?} */ oldView = _currentView;
    const /** @type {?} */ oldNodeIndex = _currentNodeIndex;
    try {
        _currentAction = action;
        const /** @type {?} */ result = fn.apply(self, args);
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
/**
 * @return {?}
 */
function getCurrentDebugContext() {
    return new DebugContext_(_currentView, _currentNodeIndex);
}
//# sourceMappingURL=services.js.map