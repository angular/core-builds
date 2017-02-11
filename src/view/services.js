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
import { ArgumentType, BindingType, NodeFlags, NodeType, Services, ViewState, asElementData, asProviderData } from './types';
import { checkBinding, isComponentView, queryIdIsReference, renderNode, viewParentDiIndex } from './util';
import { checkAndUpdateView, checkNoChangesView, createEmbeddedView, createRootView, destroyView } from './view';
import { attachEmbeddedView, detachEmbeddedView, moveEmbeddedView } from './view_attach';
var /** @type {?} */ initialized = false;
/**
 * @return {?}
 */
export function initServicesIfNeeded() {
    if (initialized) {
        return;
    }
    initialized = true;
    var /** @type {?} */ services = isDevMode() ? createDebugServices() : createProdServices();
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
        setCurrentNode: function () { },
        createRootView: createProdRootView,
        createEmbeddedView: createEmbeddedView,
        checkAndUpdateView: checkAndUpdateView,
        checkNoChangesView: checkNoChangesView,
        destroyView: destroyView,
        attachEmbeddedView: attachEmbeddedView,
        detachEmbeddedView: detachEmbeddedView,
        moveEmbeddedView: moveEmbeddedView,
        resolveDep: resolveDep,
        createDebugContext: function (view, nodeIndex) { return new DebugContext_(view, nodeIndex); },
        handleEvent: function (view, nodeIndex, eventName, event) {
            return view.def.handleEvent(view, nodeIndex, eventName, event);
        },
        updateView: function (check, view) { return view.def.update(check, view); }
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
        createDebugContext: function (view, nodeIndex) { return new DebugContext_(view, nodeIndex); },
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
    var /** @type {?} */ root = createRootData(injector, projectableNodes, rootSelectorOrNode);
    var /** @type {?} */ debugRoot = {
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
    var /** @type {?} */ sanitizer = injector.get(Sanitizer);
    // TODO(tbosch): once the new renderer interface is implemented via platform-browser,
    // just get it via the injector and drop LegacyRendererAdapter and DirectDomRenderer.
    var /** @type {?} */ renderer = isDevMode() ? new LegacyRendererAdapter(injector.get(v1renderer.RootRenderer)) :
        new DirectDomRenderer();
    var /** @type {?} */ rootElement = rootSelectorOrNode ? renderer.selectRootElement(rootSelectorOrNode) : undefined;
    return { injector: injector, projectableNodes: projectableNodes, selectorOrNode: rootSelectorOrNode, sanitizer: sanitizer, renderer: renderer };
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
var /** @type {?} */ _currentAction;
var /** @type {?} */ _currentView;
var /** @type {?} */ _currentNodeIndex;
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
        var /** @type {?} */ values = argStyle === ArgumentType.Dynamic ? v0 : [].slice.call(arguments, 3);
        var /** @type {?} */ nodeDef = view.def.nodes[nodeIndex];
        for (var /** @type {?} */ i = 0; i < nodeDef.bindings.length; i++) {
            var /** @type {?} */ binding = nodeDef.bindings[i];
            var /** @type {?} */ value = values[i];
            if ((binding.type === BindingType.ElementProperty ||
                binding.type === BindingType.ProviderProperty) &&
                checkBinding(view, nodeDef, i, value)) {
                var /** @type {?} */ elIndex = nodeDef.type === NodeType.Provider ? nodeDef.parent : nodeDef.index;
                setBindingDebugInfo(view.root.renderer, asElementData(view, elIndex).renderElement, binding.nonMinifiedName, value);
            }
        }
        var /** @type {?} */ result = check(view, nodeIndex, /** @type {?} */ (argStyle), v0, v1, v2, v3, v4, v5, v6, v7, v8, v9);
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
    var /** @type {?} */ renderName = "ng-reflect-" + camelCaseToDashCase(propName);
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
var /** @type {?} */ CAMEL_CASE_REGEXP = /([A-Z])/g;
/**
 * @param {?} input
 * @return {?}
 */
function camelCaseToDashCase(input) {
    return input.replace(CAMEL_CASE_REGEXP, function () {
        var m = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            m[_i] = arguments[_i];
        }
        return '-' + m[1].toLowerCase();
    });
}
/**
 * @param {?} view
 * @param {?} nodeIndex
 * @return {?}
 */
function nextNodeIndexWithBinding(view, nodeIndex) {
    for (var /** @type {?} */ i = nodeIndex; i < view.def.nodes.length; i++) {
        var /** @type {?} */ nodeDef = view.def.nodes[i];
        if (nodeDef.bindings && nodeDef.bindings.length) {
            return i;
        }
    }
    return undefined;
}
var DebugRenderer = (function () {
    /**
     * @param {?} _delegate
     */
    function DebugRenderer(_delegate) {
        this._delegate = _delegate;
    }
    /**
     * @param {?} name
     * @return {?}
     */
    DebugRenderer.prototype.createElement = function (name) {
        return this._delegate.createElement(name, getCurrentDebugContext());
    };
    /**
     * @param {?} value
     * @return {?}
     */
    DebugRenderer.prototype.createComment = function (value) {
        return this._delegate.createComment(value, getCurrentDebugContext());
    };
    /**
     * @param {?} value
     * @return {?}
     */
    DebugRenderer.prototype.createText = function (value) {
        return this._delegate.createText(value, getCurrentDebugContext());
    };
    /**
     * @param {?} parent
     * @param {?} newChild
     * @return {?}
     */
    DebugRenderer.prototype.appendChild = function (parent, newChild) {
        return this._delegate.appendChild(parent, newChild);
    };
    /**
     * @param {?} parent
     * @param {?} newChild
     * @param {?} refChild
     * @return {?}
     */
    DebugRenderer.prototype.insertBefore = function (parent, newChild, refChild) {
        return this._delegate.insertBefore(parent, newChild, refChild);
    };
    /**
     * @param {?} parent
     * @param {?} oldChild
     * @return {?}
     */
    DebugRenderer.prototype.removeChild = function (parent, oldChild) {
        return this._delegate.removeChild(parent, oldChild);
    };
    /**
     * @param {?} selectorOrNode
     * @return {?}
     */
    DebugRenderer.prototype.selectRootElement = function (selectorOrNode) {
        return this._delegate.selectRootElement(selectorOrNode, getCurrentDebugContext());
    };
    /**
     * @param {?} node
     * @return {?}
     */
    DebugRenderer.prototype.parentNode = function (node) { return this._delegate.parentNode(node); };
    /**
     * @param {?} node
     * @return {?}
     */
    DebugRenderer.prototype.nextSibling = function (node) { return this._delegate.nextSibling(node); };
    /**
     * @param {?} el
     * @param {?} name
     * @param {?} value
     * @return {?}
     */
    DebugRenderer.prototype.setAttribute = function (el, name, value) {
        return this._delegate.setAttribute(el, name, value);
    };
    /**
     * @param {?} el
     * @param {?} name
     * @return {?}
     */
    DebugRenderer.prototype.removeAttribute = function (el, name) { return this._delegate.removeAttribute(el, name); };
    /**
     * @param {?} el
     * @param {?} propertyName
     * @param {?} propertyValue
     * @return {?}
     */
    DebugRenderer.prototype.setBindingDebugInfo = function (el, propertyName, propertyValue) {
        this._delegate.setBindingDebugInfo(el, propertyName, propertyValue);
    };
    /**
     * @param {?} el
     * @param {?} propertyName
     * @return {?}
     */
    DebugRenderer.prototype.removeBindingDebugInfo = function (el, propertyName) {
        this._delegate.removeBindingDebugInfo(el, propertyName);
    };
    /**
     * @param {?} el
     * @param {?} name
     * @return {?}
     */
    DebugRenderer.prototype.addClass = function (el, name) { return this._delegate.addClass(el, name); };
    /**
     * @param {?} el
     * @param {?} name
     * @return {?}
     */
    DebugRenderer.prototype.removeClass = function (el, name) { return this._delegate.removeClass(el, name); };
    /**
     * @param {?} el
     * @param {?} style
     * @param {?} value
     * @return {?}
     */
    DebugRenderer.prototype.setStyle = function (el, style, value) {
        return this._delegate.setStyle(el, style, value);
    };
    /**
     * @param {?} el
     * @param {?} style
     * @return {?}
     */
    DebugRenderer.prototype.removeStyle = function (el, style) { return this._delegate.removeStyle(el, style); };
    /**
     * @param {?} el
     * @param {?} name
     * @param {?} value
     * @return {?}
     */
    DebugRenderer.prototype.setProperty = function (el, name, value) {
        return this._delegate.setProperty(el, name, value);
    };
    /**
     * @param {?} node
     * @param {?} value
     * @return {?}
     */
    DebugRenderer.prototype.setText = function (node, value) { return this._delegate.setText(node, value); };
    /**
     * @param {?} target
     * @param {?} eventName
     * @param {?} callback
     * @return {?}
     */
    DebugRenderer.prototype.listen = function (target, eventName, callback) {
        return this._delegate.listen(target, eventName, callback);
    };
    return DebugRenderer;
}());
function DebugRenderer_tsickle_Closure_declarations() {
    /** @type {?} */
    DebugRenderer.prototype._delegate;
}
var DebugContext_ = (function () {
    /**
     * @param {?} view
     * @param {?} nodeIndex
     */
    function DebugContext_(view, nodeIndex) {
        this.view = view;
        this.nodeIndex = nodeIndex;
        if (nodeIndex == null) {
            this.nodeIndex = 0;
        }
        this.nodeDef = view.def.nodes[nodeIndex];
        var elIndex = nodeIndex;
        var elView = view;
        while (elIndex != null && view.def.nodes[elIndex].type !== NodeType.Element) {
            elIndex = view.def.nodes[elIndex].parent;
        }
        if (elIndex == null) {
            while (elIndex == null && elView) {
                elIndex = viewParentDiIndex(elView);
                elView = elView.parent;
            }
        }
        this.elView = elView;
        if (elView) {
            this.elDef = elView.def.nodes[elIndex];
            for (var i = this.elDef.index + 1; i <= this.elDef.index + this.elDef.childCount; i++) {
                var childDef = this.elView.def.nodes[i];
                if (childDef.flags & NodeFlags.HasComponent) {
                    this.compProviderIndex = i;
                    break;
                }
                i += childDef.childCount;
            }
        }
        else {
            this.elDef = null;
        }
    }
    Object.defineProperty(DebugContext_.prototype, "injector", {
        /**
         * @return {?}
         */
        get: function () { return createInjector(this.elView, this.elDef.index); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DebugContext_.prototype, "component", {
        /**
         * @return {?}
         */
        get: function () {
            if (this.compProviderIndex != null) {
                return asProviderData(this.elView, this.compProviderIndex).instance;
            }
            return this.view.component;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DebugContext_.prototype, "context", {
        /**
         * @return {?}
         */
        get: function () {
            if (this.compProviderIndex != null) {
                return asProviderData(this.elView, this.compProviderIndex).instance;
            }
            return this.view.context;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DebugContext_.prototype, "providerTokens", {
        /**
         * @return {?}
         */
        get: function () {
            var /** @type {?} */ tokens = [];
            if (this.elDef) {
                for (var /** @type {?} */ i = this.elDef.index + 1; i <= this.elDef.index + this.elDef.childCount; i++) {
                    var /** @type {?} */ childDef = this.elView.def.nodes[i];
                    if (childDef.type === NodeType.Provider) {
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
        /**
         * @return {?}
         */
        get: function () {
            var /** @type {?} */ references = {};
            if (this.elDef) {
                collectReferences(this.elView, this.elDef, references);
                for (var /** @type {?} */ i = this.elDef.index + 1; i <= this.elDef.index + this.elDef.childCount; i++) {
                    var /** @type {?} */ childDef = this.elView.def.nodes[i];
                    if (childDef.type === NodeType.Provider) {
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
    Object.defineProperty(DebugContext_.prototype, "source", {
        /**
         * @return {?}
         */
        get: function () {
            if (this.nodeDef.type === NodeType.Text) {
                return this.nodeDef.text.source;
            }
            else {
                return this.elDef.element.source;
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DebugContext_.prototype, "componentRenderElement", {
        /**
         * @return {?}
         */
        get: function () {
            var /** @type {?} */ view = this.compProviderIndex != null ?
                asProviderData(this.elView, this.compProviderIndex).componentView :
                this.view;
            var /** @type {?} */ elData = findHostElement(view);
            return elData ? elData.renderElement : undefined;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DebugContext_.prototype, "renderNode", {
        /**
         * @return {?}
         */
        get: function () {
            return this.nodeDef.type === NodeType.Text ? renderNode(this.view, this.nodeDef) :
                renderNode(this.elView, this.elDef);
        },
        enumerable: true,
        configurable: true
    });
    return DebugContext_;
}());
function DebugContext__tsickle_Closure_declarations() {
    /** @type {?} */
    DebugContext_.prototype.nodeDef;
    /** @type {?} */
    DebugContext_.prototype.elView;
    /** @type {?} */
    DebugContext_.prototype.elDef;
    /** @type {?} */
    DebugContext_.prototype.compProviderIndex;
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
        var /** @type {?} */ hostData = asElementData(view.parent, view.parentIndex);
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
    for (var /** @type {?} */ queryId in nodeDef.matchedQueries) {
        if (queryIdIsReference(queryId)) {
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
    var /** @type {?} */ oldAction = _currentAction;
    var /** @type {?} */ oldView = _currentView;
    var /** @type {?} */ oldNodeIndex = _currentNodeIndex;
    try {
        _currentAction = action;
        var /** @type {?} */ result = fn.apply(self, args);
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