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
    Services.updateDirectives = services.updateDirectives;
    Services.updateRenderer = services.updateRenderer;
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
        updateDirectives: function (check, view) {
            return view.def.updateDirectives(check, view);
        },
        updateRenderer: function (check, view) { return view.def.updateRenderer(check, view); },
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
    var /** @type {?} */ renderer = injector.get(RendererV2);
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
    function debugCheckDirectivesFn(view, nodeIndex, argStyle) {
        var values = [];
        for (var _i = 3; _i < arguments.length; _i++) {
            values[_i - 3] = arguments[_i];
        }
        var /** @type {?} */ result = debugCheckFn(check, view, nodeIndex, argStyle, values);
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
    function debugCheckRenderNodeFn(view, nodeIndex, argStyle) {
        var values = [];
        for (var _i = 3; _i < arguments.length; _i++) {
            values[_i - 3] = arguments[_i];
        }
        var /** @type {?} */ result = debugCheckFn(check, view, nodeIndex, argStyle, values);
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
    var /** @type {?} */ values = argStyle === ArgumentType.Dynamic ? givenValues[0] : givenValues;
    var /** @type {?} */ nodeDef = view.def.nodes[nodeIndex];
    for (var /** @type {?} */ i = 0; i < nodeDef.bindings.length; i++) {
        var /** @type {?} */ binding = nodeDef.bindings[i];
        var /** @type {?} */ value = values[i];
        if ((binding.type === BindingType.ElementProperty ||
            binding.type === BindingType.DirectiveProperty) &&
            checkBinding(view, nodeDef, i, value)) {
            var /** @type {?} */ elDef = nodeDef.type === NodeType.Directive ? nodeDef.parent : nodeDef;
            setBindingDebugInfo(view.root.renderer, asElementData(view, elDef.index).renderElement, binding.nonMinifiedName, value);
        }
    }
    return ((delegate)).apply(void 0, [view, nodeIndex, argStyle].concat(givenValues));
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
function nextDirectiveWithBinding(view, nodeIndex) {
    for (var /** @type {?} */ i = nodeIndex; i < view.def.nodes.length; i++) {
        var /** @type {?} */ nodeDef = view.def.nodes[i];
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
    for (var /** @type {?} */ i = nodeIndex; i < view.def.nodes.length; i++) {
        var /** @type {?} */ nodeDef = view.def.nodes[i];
        if ((nodeDef.type === NodeType.Element || nodeDef.type === NodeType.Text) && nodeDef.bindings &&
            nodeDef.bindings.length) {
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
     * @param {?=} namespace
     * @return {?}
     */
    DebugRenderer.prototype.createElement = function (name, namespace) {
        return this._delegate.createElement(name, namespace, getCurrentDebugContext());
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
     * @param {?=} namespace
     * @return {?}
     */
    DebugRenderer.prototype.setAttribute = function (el, name, value, namespace) {
        return this._delegate.setAttribute(el, name, value, namespace);
    };
    /**
     * @param {?} el
     * @param {?} name
     * @param {?=} namespace
     * @return {?}
     */
    DebugRenderer.prototype.removeAttribute = function (el, name, namespace) {
        return this._delegate.removeAttribute(el, name, namespace);
    };
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
     * @param {?} hasVendorPrefix
     * @param {?} hasImportant
     * @return {?}
     */
    DebugRenderer.prototype.setStyle = function (el, style, value, hasVendorPrefix, hasImportant) {
        return this._delegate.setStyle(el, style, value, hasVendorPrefix, hasImportant);
    };
    /**
     * @param {?} el
     * @param {?} style
     * @param {?} hasVendorPrefix
     * @return {?}
     */
    DebugRenderer.prototype.removeStyle = function (el, style, hasVendorPrefix) {
        return this._delegate.removeStyle(el, style, hasVendorPrefix);
    };
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
        var elDef = this.nodeDef;
        var elView = view;
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
    Object.defineProperty(DebugContext_.prototype, "injector", {
        /**
         * @return {?}
         */
        get: function () { return createInjector(this.elView, this.elDef); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DebugContext_.prototype, "component", {
        /**
         * @return {?}
         */
        get: function () {
            if (this.compProviderDef) {
                return asProviderData(this.elView, this.compProviderDef.index).instance;
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
            if (this.compProviderDef) {
                return asProviderData(this.elView, this.compProviderDef.index).instance;
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
                    if (childDef.type === NodeType.Provider || childDef.type === NodeType.Directive) {
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
                    if (childDef.type === NodeType.Provider || childDef.type === NodeType.Directive) {
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
            var /** @type {?} */ view = this.compProviderDef ?
                asProviderData(this.elView, this.compProviderDef.index).componentView :
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
    for (var /** @type {?} */ refName in nodeDef.references) {
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