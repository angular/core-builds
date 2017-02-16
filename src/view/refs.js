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
const /** @type {?} */ EMPTY_CONTEXT = new Object();
/**
 * @param {?} selector
 * @param {?} componentType
 * @param {?} viewDefFactory
 * @return {?}
 */
export function createComponentFactory(selector, componentType, viewDefFactory) {
    return new ComponentFactory_(selector, componentType, viewDefFactory);
}
class ComponentFactory_ {
    /**
     * @param {?} selector
     * @param {?} componentType
     * @param {?} _viewDefFactory
     */
    constructor(selector, componentType, _viewDefFactory) {
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
    create(injector, projectableNodes = null, rootSelectorOrNode = null) {
        const /** @type {?} */ viewDef = resolveViewDefinition(this._viewClass);
        const /** @type {?} */ componentNodeIndex = viewDef.nodes[0].element.component.index;
        const /** @type {?} */ view = Services.createRootView(injector, projectableNodes || [], rootSelectorOrNode, viewDef, EMPTY_CONTEXT);
        const /** @type {?} */ component = asProviderData(view, componentNodeIndex).instance;
        return new ComponentRef_(view, new ViewRef_(view), component);
    }
}
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
class ComponentRef_ {
    /**
     * @param {?} _view
     * @param {?} _viewRef
     * @param {?} _component
     */
    constructor(_view, _viewRef, _component) {
        this._view = _view;
        this._viewRef = _viewRef;
        this._component = _component;
        this._elDef = this._view.def.nodes[0];
    }
    /**
     * @return {?}
     */
    get location() {
        return new ElementRef(asElementData(this._view, this._elDef.index).renderElement);
    }
    /**
     * @return {?}
     */
    get injector() { return new Injector_(this._view, this._elDef); }
    /**
     * @return {?}
     */
    get instance() { return this._component; }
    ;
    /**
     * @return {?}
     */
    get hostView() { return this._viewRef; }
    ;
    /**
     * @return {?}
     */
    get changeDetectorRef() { return this._viewRef; }
    ;
    /**
     * @return {?}
     */
    get componentType() { return (this._component.constructor); }
    /**
     * @return {?}
     */
    destroy() { this._viewRef.destroy(); }
    /**
     * @param {?} callback
     * @return {?}
     */
    onDestroy(callback) { this._viewRef.onDestroy(callback); }
}
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
class ViewContainerRef_ {
    /**
     * @param {?} _view
     * @param {?} _elDef
     */
    constructor(_view, _elDef) {
        this._view = _view;
        this._elDef = _elDef;
        this._data = asElementData(_view, _elDef.index);
    }
    /**
     * @return {?}
     */
    get element() { return new ElementRef(this._data.renderElement); }
    /**
     * @return {?}
     */
    get injector() { return new Injector_(this._view, this._elDef); }
    /**
     * @return {?}
     */
    get parentInjector() {
        let /** @type {?} */ view = this._view;
        let /** @type {?} */ elDef = this._elDef.parent;
        while (!elDef && view) {
            elDef = viewParentEl(view);
            view = view.parent;
        }
        return view ? new Injector_(view, elDef) : this._view.root.injector;
    }
    /**
     * @return {?}
     */
    clear() {
        const /** @type {?} */ len = this._data.embeddedViews.length;
        for (let /** @type {?} */ i = len - 1; i >= 0; i--) {
            const /** @type {?} */ view = Services.detachEmbeddedView(this._data, i);
            Services.destroyView(view);
        }
    }
    /**
     * @param {?} index
     * @return {?}
     */
    get(index) { return new ViewRef_(this._data.embeddedViews[index]); }
    /**
     * @return {?}
     */
    get length() { return this._data.embeddedViews.length; }
    ;
    /**
     * @param {?} templateRef
     * @param {?=} context
     * @param {?=} index
     * @return {?}
     */
    createEmbeddedView(templateRef, context, index) {
        const /** @type {?} */ viewRef = templateRef.createEmbeddedView(context || ({}));
        this.insert(viewRef, index);
        return viewRef;
    }
    /**
     * @param {?} componentFactory
     * @param {?=} index
     * @param {?=} injector
     * @param {?=} projectableNodes
     * @return {?}
     */
    createComponent(componentFactory, index, injector, projectableNodes) {
        const /** @type {?} */ contextInjector = injector || this.parentInjector;
        const /** @type {?} */ componentRef = componentFactory.create(contextInjector, projectableNodes);
        this.insert(componentRef.hostView, index);
        return componentRef;
    }
    /**
     * @param {?} viewRef
     * @param {?=} index
     * @return {?}
     */
    insert(viewRef, index) {
        const /** @type {?} */ viewData = ((viewRef))._view;
        Services.attachEmbeddedView(this._data, index, viewData);
        return viewRef;
    }
    /**
     * @param {?} viewRef
     * @param {?} currentIndex
     * @return {?}
     */
    move(viewRef, currentIndex) {
        const /** @type {?} */ previousIndex = this._data.embeddedViews.indexOf(viewRef._view);
        Services.moveEmbeddedView(this._data, previousIndex, currentIndex);
        return viewRef;
    }
    /**
     * @param {?} viewRef
     * @return {?}
     */
    indexOf(viewRef) {
        return this._data.embeddedViews.indexOf(((viewRef))._view);
    }
    /**
     * @param {?=} index
     * @return {?}
     */
    remove(index) {
        const /** @type {?} */ viewData = Services.detachEmbeddedView(this._data, index);
        Services.destroyView(viewData);
    }
    /**
     * @param {?=} index
     * @return {?}
     */
    detach(index) {
        const /** @type {?} */ view = this.get(index);
        Services.detachEmbeddedView(this._data, index);
        return view;
    }
}
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
class ViewRef_ {
    /**
     * @param {?} _view
     */
    constructor(_view) { this._view = _view; }
    /**
     * @return {?}
     */
    get rootNodes() { return rootRenderNodes(this._view); }
    /**
     * @return {?}
     */
    get context() { return this._view.context; }
    /**
     * @return {?}
     */
    get destroyed() { return (this._view.state & ViewState.Destroyed) !== 0; }
    /**
     * @return {?}
     */
    markForCheck() { this.reattach(); }
    /**
     * @return {?}
     */
    detach() { this._view.state &= ~ViewState.ChecksEnabled; }
    /**
     * @return {?}
     */
    detectChanges() { Services.checkAndUpdateView(this._view); }
    /**
     * @return {?}
     */
    checkNoChanges() { Services.checkNoChangesView(this._view); }
    /**
     * @return {?}
     */
    reattach() { this._view.state |= ViewState.ChecksEnabled; }
    /**
     * @param {?} callback
     * @return {?}
     */
    onDestroy(callback) { this._view.disposables.push(/** @type {?} */ (callback)); }
    /**
     * @return {?}
     */
    destroy() { Services.destroyView(this._view); }
}
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
class TemplateRef_ {
    /**
     * @param {?} _parentView
     * @param {?} _def
     */
    constructor(_parentView, _def) {
        this._parentView = _parentView;
        this._def = _def;
    }
    /**
     * @param {?} context
     * @return {?}
     */
    createEmbeddedView(context) {
        return new ViewRef_(Services.createEmbeddedView(this._parentView, this._def, context));
    }
    /**
     * @return {?}
     */
    get elementRef() {
        return new ElementRef(asElementData(this._parentView, this._def.index).renderElement);
    }
}
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
class Injector_ {
    /**
     * @param {?} view
     * @param {?} elDef
     */
    constructor(view, elDef) {
        this.view = view;
        this.elDef = elDef;
    }
    /**
     * @param {?} token
     * @param {?=} notFoundValue
     * @return {?}
     */
    get(token, notFoundValue = Injector.THROW_IF_NOT_FOUND) {
        const /** @type {?} */ allowPrivateServices = !!this.elDef.element.component;
        return Services.resolveDep(this.view, this.elDef, allowPrivateServices, { flags: DepFlags.None, token, tokenKey: tokenKey(token) }, notFoundValue);
    }
}
function Injector__tsickle_Closure_declarations() {
    /** @type {?} */
    Injector_.prototype.view;
    /** @type {?} */
    Injector_.prototype.elDef;
}
//# sourceMappingURL=refs.js.map