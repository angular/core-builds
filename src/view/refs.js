/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injector } from '../di';
import { ElementRef } from '../linker/element_ref';
import { DepFlags, Services, ViewState, asElementData, asProviderData } from './types';
import { resolveViewDefinition, rootRenderNodes, tokenKey, viewParentEl } from './util';
var /** @type {?} */ EMPTY_CONTEXT = new Object();
/**
 * @param {?} selector
 * @param {?} componentType
 * @param {?} viewDefFactory
 * @return {?}
 */
export function createComponentFactory(selector, componentType, viewDefFactory) {
    return new ComponentFactory_(selector, componentType, viewDefFactory);
}
var ComponentFactory_ = (function () {
    /**
     * @param {?} selector
     * @param {?} componentType
     * @param {?} _viewDefFactory
     */
    function ComponentFactory_(selector, componentType, _viewDefFactory) {
        this.selector = selector;
        this.componentType = componentType;
        this._viewClass = _viewDefFactory;
    }
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
        var /** @type {?} */ viewDef = resolveViewDefinition(this._viewClass);
        var /** @type {?} */ componentNodeIndex = viewDef.nodes[0].element.component.index;
        var /** @type {?} */ view = Services.createRootView(injector, projectableNodes || [], rootSelectorOrNode, viewDef, EMPTY_CONTEXT);
        var /** @type {?} */ component = asProviderData(view, componentNodeIndex).instance;
        return new ComponentRef_(view, new ViewRef_(view), component);
    };
    return ComponentFactory_;
}());
function ComponentFactory__tsickle_Closure_declarations() {
    /**
     * We are not renaming this field as the old ComponentFactory is using it.
     * \@internal
     * @type {?}
     */
    ComponentFactory_.prototype._viewClass;
    /** @type {?} */
    ComponentFactory_.prototype.selector;
    /** @type {?} */
    ComponentFactory_.prototype.componentType;
}
var ComponentRef_ = (function () {
    /**
     * @param {?} _view
     * @param {?} _viewRef
     * @param {?} _component
     */
    function ComponentRef_(_view, _viewRef, _component) {
        this._view = _view;
        this._viewRef = _viewRef;
        this._component = _component;
        this._elDef = this._view.def.nodes[0];
    }
    Object.defineProperty(ComponentRef_.prototype, "location", {
        /**
         * @return {?}
         */
        get: function () {
            return new ElementRef(asElementData(this._view, this._elDef.index).renderElement);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ComponentRef_.prototype, "injector", {
        /**
         * @return {?}
         */
        get: function () { return new Injector_(this._view, this._elDef); },
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
    ComponentRef_.prototype._elDef;
    /** @type {?} */
    ComponentRef_.prototype._view;
    /** @type {?} */
    ComponentRef_.prototype._viewRef;
    /** @type {?} */
    ComponentRef_.prototype._component;
}
/**
 * @param {?} view
 * @param {?} elDef
 * @return {?}
 */
export function createViewContainerRef(view, elDef) {
    return new ViewContainerRef_(view, elDef);
}
var ViewContainerRef_ = (function () {
    /**
     * @param {?} _view
     * @param {?} _elDef
     */
    function ViewContainerRef_(_view, _elDef) {
        this._view = _view;
        this._elDef = _elDef;
        this._data = asElementData(_view, _elDef.index);
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
        get: function () { return new Injector_(this._view, this._elDef); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ViewContainerRef_.prototype, "parentInjector", {
        /**
         * @return {?}
         */
        get: function () {
            var /** @type {?} */ view = this._view;
            var /** @type {?} */ elDef = this._elDef.parent;
            while (!elDef && view) {
                elDef = viewParentEl(view);
                view = view.parent;
            }
            return view ? new Injector_(view, elDef) : this._view.root.injector;
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
            var /** @type {?} */ view = Services.detachEmbeddedView(this._data, i);
            Services.destroyView(view);
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
        var /** @type {?} */ viewRef = templateRef.createEmbeddedView(context || ({}));
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
        Services.attachEmbeddedView(this._data, index, viewData);
        return viewRef;
    };
    /**
     * @param {?} viewRef
     * @param {?} currentIndex
     * @return {?}
     */
    ViewContainerRef_.prototype.move = function (viewRef, currentIndex) {
        var /** @type {?} */ previousIndex = this._data.embeddedViews.indexOf(viewRef._view);
        Services.moveEmbeddedView(this._data, previousIndex, currentIndex);
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
        var /** @type {?} */ viewData = Services.detachEmbeddedView(this._data, index);
        Services.destroyView(viewData);
    };
    /**
     * @param {?=} index
     * @return {?}
     */
    ViewContainerRef_.prototype.detach = function (index) {
        var /** @type {?} */ view = this.get(index);
        Services.detachEmbeddedView(this._data, index);
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
    ViewContainerRef_.prototype._elDef;
}
/**
 * @param {?} view
 * @return {?}
 */
export function createChangeDetectorRef(view) {
    return new ViewRef_(view);
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
    ViewRef_.prototype.detectChanges = function () { Services.checkAndUpdateView(this._view); };
    /**
     * @return {?}
     */
    ViewRef_.prototype.checkNoChanges = function () { Services.checkNoChangesView(this._view); };
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
    ViewRef_.prototype.destroy = function () { Services.destroyView(this._view); };
    return ViewRef_;
}());
function ViewRef__tsickle_Closure_declarations() {
    /**
     * \@internal
     * @type {?}
     */
    ViewRef_.prototype._view;
}
/**
 * @param {?} view
 * @param {?} def
 * @return {?}
 */
export function createTemplateRef(view, def) {
    return new TemplateRef_(view, def);
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
        return new ViewRef_(Services.createEmbeddedView(this._parentView, this._def, context));
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
/**
 * @param {?} view
 * @param {?} elDef
 * @return {?}
 */
export function createInjector(view, elDef) {
    return new Injector_(view, elDef);
}
var Injector_ = (function () {
    /**
     * @param {?} view
     * @param {?} elDef
     */
    function Injector_(view, elDef) {
        this.view = view;
        this.elDef = elDef;
    }
    /**
     * @param {?} token
     * @param {?=} notFoundValue
     * @return {?}
     */
    Injector_.prototype.get = function (token, notFoundValue) {
        if (notFoundValue === void 0) { notFoundValue = Injector.THROW_IF_NOT_FOUND; }
        var /** @type {?} */ allowPrivateServices = !!this.elDef.element.component;
        return Services.resolveDep(this.view, this.elDef, allowPrivateServices, { flags: DepFlags.None, token: token, tokenKey: tokenKey(token) }, notFoundValue);
    };
    return Injector_;
}());
function Injector__tsickle_Closure_declarations() {
    /** @type {?} */
    Injector_.prototype.view;
    /** @type {?} */
    Injector_.prototype.elDef;
}
//# sourceMappingURL=refs.js.map