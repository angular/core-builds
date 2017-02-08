/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injector } from '../di';
import { ElementRef } from '../linker/element_ref';
import { RootRenderer } from '../render/api';
import { Sanitizer } from '../security';
import { resolveDep, tokenKey } from './provider';
import { getQueryValue } from './query';
import { DepFlags, NodeType, ViewState, asElementData, asProviderData } from './types';
import { findElementDef, isComponentView, parentDiIndex, renderNode, resolveViewDefinition, rootRenderNodes } from './util';
import { checkAndUpdateView, checkNoChangesView, createEmbeddedView, createRootView, destroyView } from './view';
import { attachEmbeddedView, detachEmbeddedView, moveEmbeddedView } from './view_attach';
var /** @type {?} */ EMPTY_CONTEXT = new Object();
/**
 * @return {?}
 */
export function createRefs() {
    return new Refs_();
}
var Refs_ = (function () {
    function Refs_() {
    }
    /**
     * @param {?} selector
     * @param {?} viewDefFactory
     * @return {?}
     */
    Refs_.prototype.createComponentFactory = function (selector, viewDefFactory) {
        return new ComponentFactory_(selector, viewDefFactory);
    };
    /**
     * @param {?} data
     * @return {?}
     */
    Refs_.prototype.createViewRef = function (data) { return new ViewRef_(data); };
    /**
     * @param {?} view
     * @param {?} elIndex
     * @return {?}
     */
    Refs_.prototype.createViewContainerRef = function (view, elIndex) {
        return new ViewContainerRef_(view, elIndex);
    };
    /**
     * @param {?} parentView
     * @param {?} def
     * @return {?}
     */
    Refs_.prototype.createTemplateRef = function (parentView, def) {
        return new TemplateRef_(parentView, def);
    };
    /**
     * @param {?} view
     * @param {?} elIndex
     * @return {?}
     */
    Refs_.prototype.createInjector = function (view, elIndex) { return new Injector_(view, elIndex); };
    /**
     * @param {?} view
     * @param {?} nodeIndex
     * @return {?}
     */
    Refs_.prototype.createDebugContext = function (view, nodeIndex) {
        return new DebugContext_(view, nodeIndex);
    };
    return Refs_;
}());
export { Refs_ };
var ComponentFactory_ = (function () {
    /**
     * @param {?} selector
     * @param {?} viewDefFactory
     */
    function ComponentFactory_(selector, viewDefFactory) {
        this.selector = selector;
        var viewDef = this._viewDef = resolveViewDefinition(viewDefFactory);
        var len = viewDef.nodes.length;
        for (var i = 0; i < len; i++) {
            var nodeDef = viewDef.nodes[i];
            if (nodeDef.provider && nodeDef.provider.component) {
                this._componentNodeIndex = i;
                break;
            }
        }
        if (this._componentNodeIndex == null) {
            throw new Error("Illegal State: Could not find a component in the view definition!");
        }
    }
    Object.defineProperty(ComponentFactory_.prototype, "componentType", {
        /**
         * @return {?}
         */
        get: function () {
            return this._viewDef.nodes[this._componentNodeIndex].provider.value;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Creates a new component.
     * @param {?} injector
     * @param {?=} projectableNodes
     * @param {?=} rootSelectorOrNode
     * @return {?}
     */
    ComponentFactory_.prototype.create = function (injector, projectableNodes, rootSelectorOrNode) {
        if (projectableNodes === void 0) { projectableNodes = null; }
        if (rootSelectorOrNode === void 0) { rootSelectorOrNode = null; }
        if (!projectableNodes) {
            projectableNodes = [];
        }
        if (!rootSelectorOrNode) {
            rootSelectorOrNode = this.selector;
        }
        var /** @type {?} */ renderer = injector.get(RootRenderer);
        var /** @type {?} */ sanitizer = injector.get(Sanitizer);
        var /** @type {?} */ root = { injector: injector, projectableNodes: projectableNodes, selectorOrNode: rootSelectorOrNode, sanitizer: sanitizer, renderer: renderer };
        var /** @type {?} */ view = createRootView(root, this._viewDef, EMPTY_CONTEXT);
        var /** @type {?} */ component = asProviderData(view, this._componentNodeIndex).instance;
        return new ComponentRef_(view, component);
    };
    return ComponentFactory_;
}());
function ComponentFactory__tsickle_Closure_declarations() {
    /**
     * Only needed so that we can implement ComponentFactory
     * \@internal
     * @type {?}
     */
    ComponentFactory_.prototype._viewClass;
    /** @type {?} */
    ComponentFactory_.prototype._viewDef;
    /** @type {?} */
    ComponentFactory_.prototype._componentNodeIndex;
    /** @type {?} */
    ComponentFactory_.prototype.selector;
}
var ComponentRef_ = (function () {
    /**
     * @param {?} _view
     * @param {?} _component
     */
    function ComponentRef_(_view, _component) {
        this._view = _view;
        this._component = _component;
        this._viewRef = new ViewRef_(_view);
    }
    Object.defineProperty(ComponentRef_.prototype, "location", {
        /**
         * @return {?}
         */
        get: function () { return new ElementRef(asElementData(this._view, 0).renderElement); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ComponentRef_.prototype, "injector", {
        /**
         * @return {?}
         */
        get: function () { return new Injector_(this._view, 0); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ComponentRef_.prototype, "instance", {
        /**
         * @return {?}
         */
        get: function () { return this._component; },
        enumerable: true,
        configurable: true
    });
    ;
    Object.defineProperty(ComponentRef_.prototype, "hostView", {
        /**
         * @return {?}
         */
        get: function () { return this._viewRef; },
        enumerable: true,
        configurable: true
    });
    ;
    Object.defineProperty(ComponentRef_.prototype, "changeDetectorRef", {
        /**
         * @return {?}
         */
        get: function () { return this._viewRef; },
        enumerable: true,
        configurable: true
    });
    ;
    Object.defineProperty(ComponentRef_.prototype, "componentType", {
        /**
         * @return {?}
         */
        get: function () { return (this._component.constructor); },
        enumerable: true,
        configurable: true
    });
    /**
     * @return {?}
     */
    ComponentRef_.prototype.destroy = function () { this._viewRef.destroy(); };
    /**
     * @param {?} callback
     * @return {?}
     */
    ComponentRef_.prototype.onDestroy = function (callback) { this._viewRef.onDestroy(callback); };
    return ComponentRef_;
}());
function ComponentRef__tsickle_Closure_declarations() {
    /** @type {?} */
    ComponentRef_.prototype._viewRef;
    /** @type {?} */
    ComponentRef_.prototype._view;
    /** @type {?} */
    ComponentRef_.prototype._component;
}
var ViewContainerRef_ = (function () {
    /**
     * @param {?} _view
     * @param {?} _elIndex
     */
    function ViewContainerRef_(_view, _elIndex) {
        this._view = _view;
        this._elIndex = _elIndex;
        this._data = asElementData(_view, _elIndex);
    }
    Object.defineProperty(ViewContainerRef_.prototype, "element", {
        /**
         * @return {?}
         */
        get: function () { return new ElementRef(this._data.renderElement); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ViewContainerRef_.prototype, "injector", {
        /**
         * @return {?}
         */
        get: function () { return new Injector_(this._view, this._elIndex); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ViewContainerRef_.prototype, "parentInjector", {
        /**
         * @return {?}
         */
        get: function () {
            var /** @type {?} */ view = this._view;
            var /** @type {?} */ elIndex = view.def.nodes[this._elIndex].parent;
            while (elIndex == null && view) {
                elIndex = parentDiIndex(view);
                view = view.parent;
            }
            return view ? new Injector_(view, elIndex) : this._view.root.injector;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * @return {?}
     */
    ViewContainerRef_.prototype.clear = function () {
        var /** @type {?} */ len = this._data.embeddedViews.length;
        for (var /** @type {?} */ i = len - 1; i >= 0; i--) {
            var /** @type {?} */ view = detachEmbeddedView(this._data, i);
            destroyView(view);
        }
    };
    /**
     * @param {?} index
     * @return {?}
     */
    ViewContainerRef_.prototype.get = function (index) { return new ViewRef_(this._data.embeddedViews[index]); };
    Object.defineProperty(ViewContainerRef_.prototype, "length", {
        /**
         * @return {?}
         */
        get: function () { return this._data.embeddedViews.length; },
        enumerable: true,
        configurable: true
    });
    ;
    /**
     * @param {?} templateRef
     * @param {?=} context
     * @param {?=} index
     * @return {?}
     */
    ViewContainerRef_.prototype.createEmbeddedView = function (templateRef, context, index) {
        var /** @type {?} */ viewRef = templateRef.createEmbeddedView(context);
        this.insert(viewRef, index);
        return viewRef;
    };
    /**
     * @param {?} componentFactory
     * @param {?=} index
     * @param {?=} injector
     * @param {?=} projectableNodes
     * @return {?}
     */
    ViewContainerRef_.prototype.createComponent = function (componentFactory, index, injector, projectableNodes) {
        var /** @type {?} */ contextInjector = injector || this.parentInjector;
        var /** @type {?} */ componentRef = componentFactory.create(contextInjector, projectableNodes);
        this.insert(componentRef.hostView, index);
        return componentRef;
    };
    /**
     * @param {?} viewRef
     * @param {?=} index
     * @return {?}
     */
    ViewContainerRef_.prototype.insert = function (viewRef, index) {
        var /** @type {?} */ viewData = ((viewRef))._view;
        attachEmbeddedView(this._data, index, viewData);
        return viewRef;
    };
    /**
     * @param {?} viewRef
     * @param {?} currentIndex
     * @return {?}
     */
    ViewContainerRef_.prototype.move = function (viewRef, currentIndex) {
        var /** @type {?} */ previousIndex = this._data.embeddedViews.indexOf(viewRef._view);
        moveEmbeddedView(this._data, previousIndex, currentIndex);
        return viewRef;
    };
    /**
     * @param {?} viewRef
     * @return {?}
     */
    ViewContainerRef_.prototype.indexOf = function (viewRef) {
        return this._data.embeddedViews.indexOf(((viewRef))._view);
    };
    /**
     * @param {?=} index
     * @return {?}
     */
    ViewContainerRef_.prototype.remove = function (index) {
        var /** @type {?} */ viewData = detachEmbeddedView(this._data, index);
        destroyView(viewData);
    };
    /**
     * @param {?=} index
     * @return {?}
     */
    ViewContainerRef_.prototype.detach = function (index) {
        var /** @type {?} */ view = this.get(index);
        detachEmbeddedView(this._data, index);
        return view;
    };
    return ViewContainerRef_;
}());
function ViewContainerRef__tsickle_Closure_declarations() {
    /** @type {?} */
    ViewContainerRef_.prototype._data;
    /** @type {?} */
    ViewContainerRef_.prototype._view;
    /** @type {?} */
    ViewContainerRef_.prototype._elIndex;
}
var ViewRef_ = (function () {
    /**
     * @param {?} _view
     */
    function ViewRef_(_view) {
        this._view = _view;
    }
    Object.defineProperty(ViewRef_.prototype, "rootNodes", {
        /**
         * @return {?}
         */
        get: function () { return rootRenderNodes(this._view); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ViewRef_.prototype, "context", {
        /**
         * @return {?}
         */
        get: function () { return this._view.context; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ViewRef_.prototype, "destroyed", {
        /**
         * @return {?}
         */
        get: function () { return (this._view.state & ViewState.Destroyed) !== 0; },
        enumerable: true,
        configurable: true
    });
    /**
     * @return {?}
     */
    ViewRef_.prototype.markForCheck = function () { this.reattach(); };
    /**
     * @return {?}
     */
    ViewRef_.prototype.detach = function () { this._view.state &= ~ViewState.ChecksEnabled; };
    /**
     * @return {?}
     */
    ViewRef_.prototype.detectChanges = function () { checkAndUpdateView(this._view); };
    /**
     * @return {?}
     */
    ViewRef_.prototype.checkNoChanges = function () { checkNoChangesView(this._view); };
    /**
     * @return {?}
     */
    ViewRef_.prototype.reattach = function () { this._view.state |= ViewState.ChecksEnabled; };
    /**
     * @param {?} callback
     * @return {?}
     */
    ViewRef_.prototype.onDestroy = function (callback) { this._view.disposables.push(/** @type {?} */ (callback)); };
    /**
     * @return {?}
     */
    ViewRef_.prototype.destroy = function () { destroyView(this._view); };
    return ViewRef_;
}());
function ViewRef__tsickle_Closure_declarations() {
    /**
     * \@internal
     * @type {?}
     */
    ViewRef_.prototype._view;
}
var TemplateRef_ = (function () {
    /**
     * @param {?} _parentView
     * @param {?} _def
     */
    function TemplateRef_(_parentView, _def) {
        this._parentView = _parentView;
        this._def = _def;
    }
    /**
     * @param {?} context
     * @return {?}
     */
    TemplateRef_.prototype.createEmbeddedView = function (context) {
        return new ViewRef_(createEmbeddedView(this._parentView, this._def, context));
    };
    Object.defineProperty(TemplateRef_.prototype, "elementRef", {
        /**
         * @return {?}
         */
        get: function () {
            return new ElementRef(asElementData(this._parentView, this._def.index).renderElement);
        },
        enumerable: true,
        configurable: true
    });
    return TemplateRef_;
}());
function TemplateRef__tsickle_Closure_declarations() {
    /** @type {?} */
    TemplateRef_.prototype._parentView;
    /** @type {?} */
    TemplateRef_.prototype._def;
}
var Injector_ = (function () {
    /**
     * @param {?} view
     * @param {?} elIndex
     */
    function Injector_(view, elIndex) {
        this.view = view;
        this.elIndex = elIndex;
    }
    /**
     * @param {?} token
     * @param {?=} notFoundValue
     * @return {?}
     */
    Injector_.prototype.get = function (token, notFoundValue) {
        if (notFoundValue === void 0) { notFoundValue = Injector.THROW_IF_NOT_FOUND; }
        return resolveDep(this.view, undefined, this.elIndex, { flags: DepFlags.None, token: token, tokenKey: tokenKey(token) }, notFoundValue);
    };
    return Injector_;
}());
function Injector__tsickle_Closure_declarations() {
    /** @type {?} */
    Injector_.prototype.view;
    /** @type {?} */
    Injector_.prototype.elIndex;
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
            this.nodeIndex = nodeIndex = view.parentIndex;
            this.view = view = view.parent;
        }
        this.nodeDef = view.def.nodes[nodeIndex];
        this.elDef = findElementDef(view, nodeIndex);
    }
    Object.defineProperty(DebugContext_.prototype, "injector", {
        /**
         * @return {?}
         */
        get: function () { return new Injector_(this.view, this.elDef.index); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DebugContext_.prototype, "component", {
        /**
         * @return {?}
         */
        get: function () { return this.view.component; },
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
                    var /** @type {?} */ childDef = this.view.def.nodes[i];
                    if (childDef.type === NodeType.Provider) {
                        tokens.push(childDef.provider.token);
                    }
                    else {
                        i += childDef.childCount;
                    }
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
                collectReferences(this.view, this.elDef, references);
                for (var /** @type {?} */ i = this.elDef.index + 1; i <= this.elDef.index + this.elDef.childCount; i++) {
                    var /** @type {?} */ childDef = this.view.def.nodes[i];
                    if (childDef.type === NodeType.Provider) {
                        collectReferences(this.view, childDef, references);
                    }
                    else {
                        i += childDef.childCount;
                    }
                }
            }
            return references;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DebugContext_.prototype, "context", {
        /**
         * @return {?}
         */
        get: function () { return this.view.context; },
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
            var /** @type {?} */ elData = findHostElement(this.view);
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
            var /** @type {?} */ nodeDef = this.nodeDef.type === NodeType.Text ? this.nodeDef : this.elDef;
            return renderNode(this.view, nodeDef);
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
        if (queryId.startsWith('#')) {
            references[queryId.slice(1)] = getQueryValue(view, nodeDef, queryId);
        }
    }
}
//# sourceMappingURL=refs.js.map