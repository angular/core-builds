/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { isDevMode } from '../application_ref';
import { DebugElement, DebugNode, EventListener, getDebugNode, indexDebugNode, removeDebugNodeFromIndex } from '../debug/debug_node';
import { RendererFactoryV2 } from '../render/api';
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
    var /** @type {?} */ rendererFactory = injector.get(RendererFactoryV2);
    return createRootView(createRootData(injector, rendererFactory, projectableNodes, rootSelectorOrNode), def, context);
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
    var /** @type {?} */ rendererFactory = injector.get(RendererFactoryV2);
    var /** @type {?} */ root = createRootData(injector, new DebugRendererFactoryV2(rendererFactory), projectableNodes, rootSelectorOrNode);
    return callWithDebugContext(DebugAction.create, createRootView, null, [root, def, context]);
}
/**
 * @param {?} injector
 * @param {?} rendererFactory
 * @param {?} projectableNodes
 * @param {?} rootSelectorOrNode
 * @return {?}
 */
function createRootData(injector, rendererFactory, projectableNodes, rootSelectorOrNode) {
    var /** @type {?} */ sanitizer = injector.get(Sanitizer);
    var /** @type {?} */ renderer = rendererFactory.createRenderer(null, null);
    return {
        injector: injector,
        projectableNodes: projectableNodes,
        selectorOrNode: rootSelectorOrNode, sanitizer: sanitizer, rendererFactory: rendererFactory, renderer: renderer
    };
}
/**
 * @param {?} parent
 * @param {?} anchorDef
 * @param {?=} context
 * @return {?}
 */
function debugCreateEmbeddedView(parent, anchorDef, context) {
    return callWithDebugContext(DebugAction.create, createEmbeddedView, null, [parent, anchorDef, context]);
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
var DebugAction = {};
DebugAction.create = 0;
DebugAction.detectChanges = 1;
DebugAction.checkNoChanges = 2;
DebugAction.destroy = 3;
DebugAction.handleEvent = 4;
DebugAction[DebugAction.create] = "create";
DebugAction[DebugAction.detectChanges] = "detectChanges";
DebugAction[DebugAction.checkNoChanges] = "checkNoChanges";
DebugAction[DebugAction.destroy] = "destroy";
DebugAction[DebugAction.handleEvent] = "handleEvent";
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
        throw viewDestroyedError(DebugAction[_currentAction]);
    }
    debugSetCurrentNode(view, nodeIndex);
    return callWithDebugContext(DebugAction.handleEvent, view.def.handleEvent, null, [view, nodeIndex, eventName, event]);
}
/**
 * @param {?} check
 * @param {?} view
 * @return {?}
 */
function debugUpdateDirectives(check, view) {
    if (view.state & ViewState.Destroyed) {
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
    function debugCheckDirectivesFn(view, nodeIndex, argStyle) {
        var values = [];
        for (var _i = 3; _i < arguments.length; _i++) {
            values[_i - 3] = arguments[_i];
        }
        var /** @type {?} */ result = debugCheckFn(check, view, nodeIndex, argStyle, values);
        if (view.def.nodes[nodeIndex].type === NodeType.Directive) {
            debugSetCurrentNode(view, nextDirectiveWithBinding(view, nodeIndex));
        }
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
    function debugCheckRenderNodeFn(view, nodeIndex, argStyle) {
        var values = [];
        for (var _i = 3; _i < arguments.length; _i++) {
            values[_i - 3] = arguments[_i];
        }
        var /** @type {?} */ result = debugCheckFn(check, view, nodeIndex, argStyle, values);
        var /** @type {?} */ nodeDef = view.def.nodes[nodeIndex];
        if (nodeDef.type === NodeType.Element || nodeDef.type === NodeType.Text) {
            debugSetCurrentNode(view, nextRenderNodeWithBinding(view, nodeIndex));
        }
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
    if (_currentAction === DebugAction.detectChanges) {
        var /** @type {?} */ values = argStyle === ArgumentType.Dynamic ? givenValues[0] : givenValues;
        var /** @type {?} */ nodeDef = view.def.nodes[nodeIndex];
        if (nodeDef.type === NodeType.Directive || nodeDef.type === NodeType.Element) {
            var /** @type {?} */ bindingValues = {};
            for (var /** @type {?} */ i = 0; i < nodeDef.bindings.length; i++) {
                var /** @type {?} */ binding = nodeDef.bindings[i];
                var /** @type {?} */ value = values[i];
                if ((binding.type === BindingType.ElementProperty ||
                    binding.type === BindingType.DirectiveProperty) &&
                    checkBinding(view, nodeDef, i, value)) {
                    bindingValues[normalizeDebugBindingName(binding.nonMinifiedName)] =
                        normalizeDebugBindingValue(value);
                }
            }
            var /** @type {?} */ elDef = nodeDef.type === NodeType.Directive ? nodeDef.parent : nodeDef;
            var /** @type {?} */ el = asElementData(view, elDef.index).renderElement;
            if (!elDef.element.name) {
                // a comment.
                view.renderer.setValue(el, "bindings=" + JSON.stringify(bindingValues, null, 2));
            }
            else {
                // a regular element.
                for (var /** @type {?} */ attr in bindingValues) {
                    view.renderer.setAttribute(el, attr, bindingValues[attr]);
                }
            }
        }
    }
    return ((delegate)).apply(void 0, [view, nodeIndex, argStyle].concat(givenValues));
}
;
/**
 * @param {?} name
 * @return {?}
 */
function normalizeDebugBindingName(name) {
    // Attribute names with `$` (eg `x-y$`) are valid per spec, but unsupported by some browsers
    name = camelCaseToDashCase(name.replace(/\$/g, '_'));
    return "ng-reflect-" + name;
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
 * @param {?} value
 * @return {?}
 */
function normalizeDebugBindingValue(value) {
    try {
        // Limit the size of the value as otherwise the DOM just gets polluted.
        return value ? value.toString().slice(0, 20) : value;
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
var DebugContext_ = (function () {
    /**
     * @param {?} view
     * @param {?} nodeIndex
     */
    function DebugContext_(view, nodeIndex) {
        this.view = view;
        this.nodeIndex = nodeIndex;
        if (nodeIndex == null) {
            this.nodeIndex = nodeIndex = 0;
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
export function getCurrentDebugContext() {
    return new DebugContext_(_currentView, _currentNodeIndex);
}
var DebugRendererFactoryV2 = (function () {
    /**
     * @param {?} delegate
     */
    function DebugRendererFactoryV2(delegate) {
        this.delegate = delegate;
    }
    /**
     * @param {?} element
     * @param {?} renderData
     * @return {?}
     */
    DebugRendererFactoryV2.prototype.createRenderer = function (element, renderData) {
        return new DebugRendererV2(this.delegate.createRenderer(element, renderData));
    };
    return DebugRendererFactoryV2;
}());
function DebugRendererFactoryV2_tsickle_Closure_declarations() {
    /** @type {?} */
    DebugRendererFactoryV2.prototype.delegate;
}
var DebugRendererV2 = (function () {
    /**
     * @param {?} delegate
     */
    function DebugRendererV2(delegate) {
        this.delegate = delegate;
    }
    /**
     * @param {?} node
     * @return {?}
     */
    DebugRendererV2.prototype.destroyNode = function (node) {
        removeDebugNodeFromIndex(getDebugNode(node));
        if (this.delegate.destroyNode) {
            this.delegate.destroyNode(node);
        }
    };
    /**
     * @return {?}
     */
    DebugRendererV2.prototype.destroy = function () { this.delegate.destroy(); };
    /**
     * @param {?} name
     * @param {?=} namespace
     * @return {?}
     */
    DebugRendererV2.prototype.createElement = function (name, namespace) {
        var /** @type {?} */ el = this.delegate.createElement(name, namespace);
        var /** @type {?} */ debugEl = new DebugElement(el, null, getCurrentDebugContext());
        debugEl.name = name;
        indexDebugNode(debugEl);
        return el;
    };
    /**
     * @param {?} value
     * @return {?}
     */
    DebugRendererV2.prototype.createComment = function (value) {
        var /** @type {?} */ comment = this.delegate.createComment(value);
        var /** @type {?} */ debugEl = new DebugNode(comment, null, getCurrentDebugContext());
        indexDebugNode(debugEl);
        return comment;
    };
    /**
     * @param {?} value
     * @return {?}
     */
    DebugRendererV2.prototype.createText = function (value) {
        var /** @type {?} */ text = this.delegate.createText(value);
        var /** @type {?} */ debugEl = new DebugNode(text, null, getCurrentDebugContext());
        indexDebugNode(debugEl);
        return text;
    };
    /**
     * @param {?} parent
     * @param {?} newChild
     * @return {?}
     */
    DebugRendererV2.prototype.appendChild = function (parent, newChild) {
        var /** @type {?} */ debugEl = getDebugNode(parent);
        var /** @type {?} */ debugChildEl = getDebugNode(newChild);
        if (debugEl && debugChildEl && debugEl instanceof DebugElement) {
            debugEl.addChild(debugChildEl);
        }
        this.delegate.appendChild(parent, newChild);
    };
    /**
     * @param {?} parent
     * @param {?} newChild
     * @param {?} refChild
     * @return {?}
     */
    DebugRendererV2.prototype.insertBefore = function (parent, newChild, refChild) {
        var /** @type {?} */ debugEl = getDebugNode(parent);
        var /** @type {?} */ debugChildEl = getDebugNode(newChild);
        var /** @type {?} */ debugRefEl = getDebugNode(refChild);
        if (debugEl && debugChildEl && debugEl instanceof DebugElement) {
            debugEl.insertBefore(debugRefEl, debugChildEl);
        }
        this.delegate.insertBefore(parent, newChild, refChild);
    };
    /**
     * @param {?} parent
     * @param {?} oldChild
     * @return {?}
     */
    DebugRendererV2.prototype.removeChild = function (parent, oldChild) {
        var /** @type {?} */ debugEl = getDebugNode(parent);
        var /** @type {?} */ debugChildEl = getDebugNode(oldChild);
        if (debugEl && debugChildEl && debugEl instanceof DebugElement) {
            debugEl.removeChild(debugChildEl);
        }
        this.delegate.removeChild(parent, oldChild);
    };
    /**
     * @param {?} selectorOrNode
     * @return {?}
     */
    DebugRendererV2.prototype.selectRootElement = function (selectorOrNode) {
        var /** @type {?} */ el = this.delegate.selectRootElement(selectorOrNode);
        var /** @type {?} */ debugEl = new DebugElement(el, null, getCurrentDebugContext());
        indexDebugNode(debugEl);
        return el;
    };
    /**
     * @param {?} el
     * @param {?} name
     * @param {?} value
     * @param {?=} namespace
     * @return {?}
     */
    DebugRendererV2.prototype.setAttribute = function (el, name, value, namespace) {
        var /** @type {?} */ debugEl = getDebugNode(el);
        if (debugEl && debugEl instanceof DebugElement) {
            var /** @type {?} */ fullName = namespace ? namespace + ':' + name : name;
            debugEl.attributes[fullName] = value;
        }
        this.delegate.setAttribute(el, name, value, namespace);
    };
    /**
     * @param {?} el
     * @param {?} name
     * @param {?=} namespace
     * @return {?}
     */
    DebugRendererV2.prototype.removeAttribute = function (el, name, namespace) {
        var /** @type {?} */ debugEl = getDebugNode(el);
        if (debugEl && debugEl instanceof DebugElement) {
            var /** @type {?} */ fullName = namespace ? namespace + ':' + name : name;
            debugEl.attributes[fullName] = null;
        }
        this.delegate.removeAttribute(el, name, namespace);
    };
    /**
     * @param {?} el
     * @param {?} name
     * @return {?}
     */
    DebugRendererV2.prototype.addClass = function (el, name) {
        var /** @type {?} */ debugEl = getDebugNode(el);
        if (debugEl && debugEl instanceof DebugElement) {
            debugEl.classes[name] = true;
        }
        this.delegate.addClass(el, name);
    };
    /**
     * @param {?} el
     * @param {?} name
     * @return {?}
     */
    DebugRendererV2.prototype.removeClass = function (el, name) {
        var /** @type {?} */ debugEl = getDebugNode(el);
        if (debugEl && debugEl instanceof DebugElement) {
            debugEl.classes[name] = false;
        }
        this.delegate.removeClass(el, name);
    };
    /**
     * @param {?} el
     * @param {?} style
     * @param {?} value
     * @param {?} hasVendorPrefix
     * @param {?} hasImportant
     * @return {?}
     */
    DebugRendererV2.prototype.setStyle = function (el, style, value, hasVendorPrefix, hasImportant) {
        var /** @type {?} */ debugEl = getDebugNode(el);
        if (debugEl && debugEl instanceof DebugElement) {
            debugEl.styles[style] = value;
        }
        this.delegate.setStyle(el, style, value, hasVendorPrefix, hasImportant);
    };
    /**
     * @param {?} el
     * @param {?} style
     * @param {?} hasVendorPrefix
     * @return {?}
     */
    DebugRendererV2.prototype.removeStyle = function (el, style, hasVendorPrefix) {
        var /** @type {?} */ debugEl = getDebugNode(el);
        if (debugEl && debugEl instanceof DebugElement) {
            debugEl.styles[style] = null;
        }
        this.delegate.removeStyle(el, style, hasVendorPrefix);
    };
    /**
     * @param {?} el
     * @param {?} name
     * @param {?} value
     * @return {?}
     */
    DebugRendererV2.prototype.setProperty = function (el, name, value) {
        var /** @type {?} */ debugEl = getDebugNode(el);
        if (debugEl && debugEl instanceof DebugElement) {
            debugEl.properties[name] = value;
        }
        this.delegate.setProperty(el, name, value);
    };
    /**
     * @param {?} target
     * @param {?} eventName
     * @param {?} callback
     * @return {?}
     */
    DebugRendererV2.prototype.listen = function (target, eventName, callback) {
        if (typeof target !== 'string') {
            var /** @type {?} */ debugEl = getDebugNode(target);
            if (debugEl) {
                debugEl.listeners.push(new EventListener(eventName, callback));
            }
        }
        return this.delegate.listen(target, eventName, callback);
    };
    /**
     * @param {?} node
     * @return {?}
     */
    DebugRendererV2.prototype.parentNode = function (node) { return this.delegate.parentNode(node); };
    /**
     * @param {?} node
     * @return {?}
     */
    DebugRendererV2.prototype.nextSibling = function (node) { return this.delegate.nextSibling(node); };
    /**
     * @param {?} node
     * @param {?} value
     * @return {?}
     */
    DebugRendererV2.prototype.setValue = function (node, value) { return this.delegate.setValue(node, value); };
    return DebugRendererV2;
}());
function DebugRendererV2_tsickle_Closure_declarations() {
    /** @type {?} */
    DebugRendererV2.prototype.delegate;
}
//# sourceMappingURL=services.js.map