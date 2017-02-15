/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { isDevMode } from '../application_ref';
import { RendererV2 } from '../render/api';
import { Sanitizer } from '../security';
import { isViewDebugError, viewDestroyedError, viewWrappedDebugError } from './errors';
import { resolveDep } from './provider';
import { getQueryValue } from './query';
import { createInjector } from './refs';
import { ArgumentType, BindingType, NodeType, Services, ViewState, asElementData, asProviderData } from './types';
import { checkBinding, isComponentView, renderNode, viewParentEl } from './util';
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
    Services.updateDirectives = services.updateDirectives;
    Services.updateRenderer = services.updateRenderer;
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
        updateDirectives: (check, view) => view.def.updateDirectives(check, view),
        updateRenderer: (check, view) => view.def.updateRenderer(check, view),
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
        updateDirectives: debugUpdateDirectives,
        updateRenderer: debugUpdateRenderer
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
        selectorOrNode: root.selectorOrNode,
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
    const /** @type {?} */ renderer = injector.get(RendererV2);
    const /** @type {?} */ rootElement = rootSelectorOrNode ? renderer.selectRootElement(rootSelectorOrNode) : undefined;
    return { injector, projectableNodes, selectorOrNode: rootSelectorOrNode, sanitizer, renderer };
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
function debugUpdateDirectives(check, view) {
    if (view.state & ViewState.Destroyed) {
        throw viewDestroyedError(_currentAction);
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
        const /** @type {?} */ result = debugCheckFn(check, view, nodeIndex, argStyle, values);
        debugSetCurrentNode(view, nextDirectiveWithBinding(view, nodeIndex));
        return result;
    }
    ;
}
/**
 * @param {?} check
 * @param {?} view
 * @return {?}
 */
function debugUpdateRenderer(check, view) {
    if (view.state & ViewState.Destroyed) {
        throw viewDestroyedError(_currentAction);
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
        const /** @type {?} */ result = debugCheckFn(check, view, nodeIndex, argStyle, values);
        debugSetCurrentNode(view, nextRenderNodeWithBinding(view, nodeIndex));
        return result;
    }
}
/**
 * @param {?} delegate
 * @param {?} view
 * @param {?} nodeIndex
 * @param {?} argStyle
 * @param {?} givenValues
 * @return {?}
 */
function debugCheckFn(delegate, view, nodeIndex, argStyle, givenValues) {
    const /** @type {?} */ values = argStyle === ArgumentType.Dynamic ? givenValues[0] : givenValues;
    const /** @type {?} */ nodeDef = view.def.nodes[nodeIndex];
    for (let /** @type {?} */ i = 0; i < nodeDef.bindings.length; i++) {
        const /** @type {?} */ binding = nodeDef.bindings[i];
        const /** @type {?} */ value = values[i];
        if ((binding.type === BindingType.ElementProperty ||
            binding.type === BindingType.DirectiveProperty) &&
            checkBinding(view, nodeDef, i, value)) {
            const /** @type {?} */ elDef = nodeDef.type === NodeType.Directive ? nodeDef.parent : nodeDef;
            setBindingDebugInfo(view.root.renderer, asElementData(view, elDef.index).renderElement, binding.nonMinifiedName, value);
        }
    }
    return ((delegate))(view, nodeIndex, argStyle, ...givenValues);
}
;
/**
 * @param {?} renderer
 * @param {?} renderNode
 * @param {?} propName
 * @param {?} value
 * @return {?}
 */
function setBindingDebugInfo(renderer, renderNode, propName, value) {
    const /** @type {?} */ renderName = `ng-reflect-${camelCaseToDashCase(propName)}`;
    if (value) {
        try {
            renderer.setBindingDebugInfo(renderNode, renderName, value.toString());
        }
        catch (e) {
            renderer.setBindingDebugInfo(renderNode, renderName, '[ERROR] Exception while trying to serialize the value');
        }
    }
    else {
        renderer.removeBindingDebugInfo(renderNode, renderName);
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
function nextDirectiveWithBinding(view, nodeIndex) {
    for (let /** @type {?} */ i = nodeIndex; i < view.def.nodes.length; i++) {
        const /** @type {?} */ nodeDef = view.def.nodes[i];
        if (nodeDef.type === NodeType.Directive && nodeDef.bindings && nodeDef.bindings.length) {
            return i;
        }
    }
    return undefined;
}
/**
 * @param {?} view
 * @param {?} nodeIndex
 * @return {?}
 */
function nextRenderNodeWithBinding(view, nodeIndex) {
    for (let /** @type {?} */ i = nodeIndex; i < view.def.nodes.length; i++) {
        const /** @type {?} */ nodeDef = view.def.nodes[i];
        if ((nodeDef.type === NodeType.Element || nodeDef.type === NodeType.Text) && nodeDef.bindings &&
            nodeDef.bindings.length) {
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
     * @param {?=} namespace
     * @return {?}
     */
    createElement(name, namespace) {
        return this._delegate.createElement(name, namespace, getCurrentDebugContext());
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
     * @param {?=} namespace
     * @return {?}
     */
    setAttribute(el, name, value, namespace) {
        return this._delegate.setAttribute(el, name, value, namespace);
    }
    /**
     * @param {?} el
     * @param {?} name
     * @param {?=} namespace
     * @return {?}
     */
    removeAttribute(el, name, namespace) {
        return this._delegate.removeAttribute(el, name, namespace);
    }
    /**
     * @param {?} el
     * @param {?} propertyName
     * @param {?} propertyValue
     * @return {?}
     */
    setBindingDebugInfo(el, propertyName, propertyValue) {
        this._delegate.setBindingDebugInfo(el, propertyName, propertyValue);
    }
    /**
     * @param {?} el
     * @param {?} propertyName
     * @return {?}
     */
    removeBindingDebugInfo(el, propertyName) {
        this._delegate.removeBindingDebugInfo(el, propertyName);
    }
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
     * @param {?} hasVendorPrefix
     * @param {?} hasImportant
     * @return {?}
     */
    setStyle(el, style, value, hasVendorPrefix, hasImportant) {
        return this._delegate.setStyle(el, style, value, hasVendorPrefix, hasImportant);
    }
    /**
     * @param {?} el
     * @param {?} style
     * @param {?} hasVendorPrefix
     * @return {?}
     */
    removeStyle(el, style, hasVendorPrefix) {
        return this._delegate.removeStyle(el, style, hasVendorPrefix);
    }
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
            this.nodeIndex = 0;
        }
        this.nodeDef = view.def.nodes[nodeIndex];
        let elDef = this.nodeDef;
        let elView = view;
        while (elDef && elDef.type !== NodeType.Element) {
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
        this.compProviderDef = elView ? this.elDef.element.component : null;
    }
    /**
     * @return {?}
     */
    get injector() { return createInjector(this.elView, this.elDef); }
    /**
     * @return {?}
     */
    get component() {
        if (this.compProviderDef) {
            return asProviderData(this.elView, this.compProviderDef.index).instance;
        }
        return this.view.component;
    }
    /**
     * @return {?}
     */
    get context() {
        if (this.compProviderDef) {
            return asProviderData(this.elView, this.compProviderDef.index).instance;
        }
        return this.view.context;
    }
    /**
     * @return {?}
     */
    get providerTokens() {
        const /** @type {?} */ tokens = [];
        if (this.elDef) {
            for (let /** @type {?} */ i = this.elDef.index + 1; i <= this.elDef.index + this.elDef.childCount; i++) {
                const /** @type {?} */ childDef = this.elView.def.nodes[i];
                if (childDef.type === NodeType.Provider || childDef.type === NodeType.Directive) {
                    tokens.push(childDef.provider.token);
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
        const /** @type {?} */ references = {};
        if (this.elDef) {
            collectReferences(this.elView, this.elDef, references);
            for (let /** @type {?} */ i = this.elDef.index + 1; i <= this.elDef.index + this.elDef.childCount; i++) {
                const /** @type {?} */ childDef = this.elView.def.nodes[i];
                if (childDef.type === NodeType.Provider || childDef.type === NodeType.Directive) {
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
        const /** @type {?} */ view = this.compProviderDef ?
            asProviderData(this.elView, this.compProviderDef.index).componentView :
            this.view;
        const /** @type {?} */ elData = findHostElement(view);
        return elData ? elData.renderElement : undefined;
    }
    /**
     * @return {?}
     */
    get renderNode() {
        return this.nodeDef.type === NodeType.Text ? renderNode(this.view, this.nodeDef) :
            renderNode(this.elView, this.elDef);
    }
}
function DebugContext__tsickle_Closure_declarations() {
    /** @type {?} */
    DebugContext_.prototype.nodeDef;
    /** @type {?} */
    DebugContext_.prototype.elView;
    /** @type {?} */
    DebugContext_.prototype.elDef;
    /** @type {?} */
    DebugContext_.prototype.compProviderDef;
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
        return asElementData(view.parent, viewParentEl(view).index);
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
    for (let /** @type {?} */ refName in nodeDef.references) {
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
        _currentView.state |= ViewState.Errored;
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