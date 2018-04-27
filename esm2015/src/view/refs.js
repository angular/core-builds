/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injector } from '../di/injector';
import { ComponentFactory, ComponentRef } from '../linker/component_factory';
import { ComponentFactoryBoundToModule, ComponentFactoryResolver } from '../linker/component_factory_resolver';
import { ElementRef } from '../linker/element_ref';
import { NgModuleRef } from '../linker/ng_module_factory';
import { TemplateRef } from '../linker/template_ref';
import { stringify } from '../util';
import { VERSION } from '../version';
import { callNgModuleLifecycle, initNgModule, resolveNgModuleDep } from './ng_module';
import { Services, asElementData, asProviderData, asTextData } from './types';
import { markParentViewsForCheck, resolveDefinition, rootRenderNodes, splitNamespace, tokenKey, viewParentEl } from './util';
import { attachEmbeddedView, detachEmbeddedView, moveEmbeddedView, renderDetachView } from './view_attach';
const /** @type {?} */ EMPTY_CONTEXT = new Object();
/**
 * @param {?} selector
 * @param {?} componentType
 * @param {?} viewDefFactory
 * @param {?} inputs
 * @param {?} outputs
 * @param {?} ngContentSelectors
 * @return {?}
 */
export function createComponentFactory(selector, componentType, viewDefFactory, inputs, outputs, ngContentSelectors) {
    return new ComponentFactory_(selector, componentType, viewDefFactory, inputs, outputs, ngContentSelectors);
}
/**
 * @param {?} componentFactory
 * @return {?}
 */
export function getComponentViewDefinitionFactory(componentFactory) {
    return (/** @type {?} */ (componentFactory)).viewDefFactory;
}
class ComponentFactory_ extends ComponentFactory {
    /**
     * @param {?} selector
     * @param {?} componentType
     * @param {?} viewDefFactory
     * @param {?} _inputs
     * @param {?} _outputs
     * @param {?} ngContentSelectors
     */
    constructor(selector, componentType, viewDefFactory, _inputs, _outputs, ngContentSelectors) {
        // Attention: this ctor is called as top level function.
        // Putting any logic in here will destroy closure tree shaking!
        super();
        this.selector = selector;
        this.componentType = componentType;
        this._inputs = _inputs;
        this._outputs = _outputs;
        this.ngContentSelectors = ngContentSelectors;
        this.viewDefFactory = viewDefFactory;
    }
    /**
     * @return {?}
     */
    get inputs() {
        const /** @type {?} */ inputsArr = [];
        const /** @type {?} */ inputs = /** @type {?} */ ((this._inputs));
        for (let /** @type {?} */ propName in inputs) {
            const /** @type {?} */ templateName = inputs[propName];
            inputsArr.push({ propName, templateName });
        }
        return inputsArr;
    }
    /**
     * @return {?}
     */
    get outputs() {
        const /** @type {?} */ outputsArr = [];
        for (let /** @type {?} */ propName in this._outputs) {
            const /** @type {?} */ templateName = this._outputs[propName];
            outputsArr.push({ propName, templateName });
        }
        return outputsArr;
    }
    /**
     * Creates a new component.
     * @param {?} injector
     * @param {?=} projectableNodes
     * @param {?=} rootSelectorOrNode
     * @param {?=} ngModule
     * @return {?}
     */
    create(injector, projectableNodes, rootSelectorOrNode, ngModule) {
        if (!ngModule) {
            throw new Error('ngModule should be provided');
        }
        const /** @type {?} */ viewDef = resolveDefinition(this.viewDefFactory);
        const /** @type {?} */ componentNodeIndex = /** @type {?} */ ((/** @type {?} */ ((viewDef.nodes[0].element)).componentProvider)).nodeIndex;
        const /** @type {?} */ view = Services.createRootView(injector, projectableNodes || [], rootSelectorOrNode, viewDef, ngModule, EMPTY_CONTEXT);
        const /** @type {?} */ component = asProviderData(view, componentNodeIndex).instance;
        if (rootSelectorOrNode) {
            view.renderer.setAttribute(asElementData(view, 0).renderElement, 'ng-version', VERSION.full);
        }
        return new ComponentRef_(view, new ViewRef_(view), component);
    }
}
function ComponentFactory__tsickle_Closure_declarations() {
    /**
     * \@internal
     * @type {?}
     */
    ComponentFactory_.prototype.viewDefFactory;
    /** @type {?} */
    ComponentFactory_.prototype.selector;
    /** @type {?} */
    ComponentFactory_.prototype.componentType;
    /** @type {?} */
    ComponentFactory_.prototype._inputs;
    /** @type {?} */
    ComponentFactory_.prototype._outputs;
    /** @type {?} */
    ComponentFactory_.prototype.ngContentSelectors;
}
class ComponentRef_ extends ComponentRef {
    /**
     * @param {?} _view
     * @param {?} _viewRef
     * @param {?} _component
     */
    constructor(_view, _viewRef, _component) {
        super();
        this._view = _view;
        this._viewRef = _viewRef;
        this._component = _component;
        this._elDef = this._view.def.nodes[0];
        this.hostView = _viewRef;
        this.changeDetectorRef = _viewRef;
        this.instance = _component;
    }
    /**
     * @return {?}
     */
    get location() {
        return new ElementRef(asElementData(this._view, this._elDef.nodeIndex).renderElement);
    }
    /**
     * @return {?}
     */
    get injector() { return new Injector_(this._view, this._elDef); }
    /**
     * @return {?}
     */
    get componentType() { return /** @type {?} */ (this._component.constructor); }
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
    ComponentRef_.prototype.hostView;
    /** @type {?} */
    ComponentRef_.prototype.instance;
    /** @type {?} */
    ComponentRef_.prototype.changeDetectorRef;
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
 * @param {?} elData
 * @return {?}
 */
export function createViewContainerData(view, elDef, elData) {
    return new ViewContainerRef_(view, elDef, elData);
}
class ViewContainerRef_ {
    /**
     * @param {?} _view
     * @param {?} _elDef
     * @param {?} _data
     */
    constructor(_view, _elDef, _data) {
        this._view = _view;
        this._elDef = _elDef;
        this._data = _data;
        /**
         * \@internal
         */
        this._embeddedViews = [];
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
            view = /** @type {?} */ ((view.parent));
        }
        return view ? new Injector_(view, elDef) : new Injector_(this._view, null);
    }
    /**
     * @return {?}
     */
    clear() {
        const /** @type {?} */ len = this._embeddedViews.length;
        for (let /** @type {?} */ i = len - 1; i >= 0; i--) {
            const /** @type {?} */ view = /** @type {?} */ ((detachEmbeddedView(this._data, i)));
            Services.destroyView(view);
        }
    }
    /**
     * @param {?} index
     * @return {?}
     */
    get(index) {
        const /** @type {?} */ view = this._embeddedViews[index];
        if (view) {
            const /** @type {?} */ ref = new ViewRef_(view);
            ref.attachToViewContainerRef(this);
            return ref;
        }
        return null;
    }
    /**
     * @return {?}
     */
    get length() { return this._embeddedViews.length; }
    /**
     * @template C
     * @param {?} templateRef
     * @param {?=} context
     * @param {?=} index
     * @return {?}
     */
    createEmbeddedView(templateRef, context, index) {
        const /** @type {?} */ viewRef = templateRef.createEmbeddedView(context || /** @type {?} */ ({}));
        this.insert(viewRef, index);
        return viewRef;
    }
    /**
     * @template C
     * @param {?} componentFactory
     * @param {?=} index
     * @param {?=} injector
     * @param {?=} projectableNodes
     * @param {?=} ngModuleRef
     * @return {?}
     */
    createComponent(componentFactory, index, injector, projectableNodes, ngModuleRef) {
        const /** @type {?} */ contextInjector = injector || this.parentInjector;
        if (!ngModuleRef && !(componentFactory instanceof ComponentFactoryBoundToModule)) {
            ngModuleRef = contextInjector.get(NgModuleRef);
        }
        const /** @type {?} */ componentRef = componentFactory.create(contextInjector, projectableNodes, undefined, ngModuleRef);
        this.insert(componentRef.hostView, index);
        return componentRef;
    }
    /**
     * @param {?} viewRef
     * @param {?=} index
     * @return {?}
     */
    insert(viewRef, index) {
        if (viewRef.destroyed) {
            throw new Error('Cannot insert a destroyed View in a ViewContainer!');
        }
        const /** @type {?} */ viewRef_ = /** @type {?} */ (viewRef);
        const /** @type {?} */ viewData = viewRef_._view;
        attachEmbeddedView(this._view, this._data, index, viewData);
        viewRef_.attachToViewContainerRef(this);
        return viewRef;
    }
    /**
     * @param {?} viewRef
     * @param {?} currentIndex
     * @return {?}
     */
    move(viewRef, currentIndex) {
        if (viewRef.destroyed) {
            throw new Error('Cannot move a destroyed View in a ViewContainer!');
        }
        const /** @type {?} */ previousIndex = this._embeddedViews.indexOf(viewRef._view);
        moveEmbeddedView(this._data, previousIndex, currentIndex);
        return viewRef;
    }
    /**
     * @param {?} viewRef
     * @return {?}
     */
    indexOf(viewRef) {
        return this._embeddedViews.indexOf((/** @type {?} */ (viewRef))._view);
    }
    /**
     * @param {?=} index
     * @return {?}
     */
    remove(index) {
        const /** @type {?} */ viewData = detachEmbeddedView(this._data, index);
        if (viewData) {
            Services.destroyView(viewData);
        }
    }
    /**
     * @param {?=} index
     * @return {?}
     */
    detach(index) {
        const /** @type {?} */ view = detachEmbeddedView(this._data, index);
        return view ? new ViewRef_(view) : null;
    }
}
function ViewContainerRef__tsickle_Closure_declarations() {
    /**
     * \@internal
     * @type {?}
     */
    ViewContainerRef_.prototype._embeddedViews;
    /** @type {?} */
    ViewContainerRef_.prototype._view;
    /** @type {?} */
    ViewContainerRef_.prototype._elDef;
    /** @type {?} */
    ViewContainerRef_.prototype._data;
}
/**
 * @param {?} view
 * @return {?}
 */
export function createChangeDetectorRef(view) {
    return new ViewRef_(view);
}
export class ViewRef_ {
    /**
     * @param {?} _view
     */
    constructor(_view) {
        this._view = _view;
        this._viewContainerRef = null;
        this._appRef = null;
    }
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
    get destroyed() { return (this._view.state & 128 /* Destroyed */) !== 0; }
    /**
     * @return {?}
     */
    markForCheck() { markParentViewsForCheck(this._view); }
    /**
     * @return {?}
     */
    detach() { this._view.state &= ~4 /* Attached */; }
    /**
     * @return {?}
     */
    detectChanges() {
        const /** @type {?} */ fs = this._view.root.rendererFactory;
        if (fs.begin) {
            fs.begin();
        }
        try {
            Services.checkAndUpdateView(this._view);
        }
        finally {
            if (fs.end) {
                fs.end();
            }
        }
    }
    /**
     * @return {?}
     */
    checkNoChanges() { Services.checkNoChangesView(this._view); }
    /**
     * @return {?}
     */
    reattach() { this._view.state |= 4 /* Attached */; }
    /**
     * @param {?} callback
     * @return {?}
     */
    onDestroy(callback) {
        if (!this._view.disposables) {
            this._view.disposables = [];
        }
        this._view.disposables.push(/** @type {?} */ (callback));
    }
    /**
     * @return {?}
     */
    destroy() {
        if (this._appRef) {
            this._appRef.detachView(this);
        }
        else if (this._viewContainerRef) {
            this._viewContainerRef.detach(this._viewContainerRef.indexOf(this));
        }
        Services.destroyView(this._view);
    }
    /**
     * @return {?}
     */
    detachFromAppRef() {
        this._appRef = null;
        renderDetachView(this._view);
        Services.dirtyParentQueries(this._view);
    }
    /**
     * @param {?} appRef
     * @return {?}
     */
    attachToAppRef(appRef) {
        if (this._viewContainerRef) {
            throw new Error('This view is already attached to a ViewContainer!');
        }
        this._appRef = appRef;
    }
    /**
     * @param {?} vcRef
     * @return {?}
     */
    attachToViewContainerRef(vcRef) {
        if (this._appRef) {
            throw new Error('This view is already attached directly to the ApplicationRef!');
        }
        this._viewContainerRef = vcRef;
    }
}
function ViewRef__tsickle_Closure_declarations() {
    /**
     * \@internal
     * @type {?}
     */
    ViewRef_.prototype._view;
    /** @type {?} */
    ViewRef_.prototype._viewContainerRef;
    /** @type {?} */
    ViewRef_.prototype._appRef;
}
/**
 * @param {?} view
 * @param {?} def
 * @return {?}
 */
export function createTemplateData(view, def) {
    return new TemplateRef_(view, def);
}
class TemplateRef_ extends TemplateRef {
    /**
     * @param {?} _parentView
     * @param {?} _def
     */
    constructor(_parentView, _def) {
        super();
        this._parentView = _parentView;
        this._def = _def;
    }
    /**
     * @param {?} context
     * @return {?}
     */
    createEmbeddedView(context) {
        return new ViewRef_(Services.createEmbeddedView(this._parentView, this._def, /** @type {?} */ ((/** @type {?} */ ((this._def.element)).template)), context));
    }
    /**
     * @return {?}
     */
    get elementRef() {
        return new ElementRef(asElementData(this._parentView, this._def.nodeIndex).renderElement);
    }
}
function TemplateRef__tsickle_Closure_declarations() {
    /**
     * \@internal
     * @type {?}
     */
    TemplateRef_.prototype._projectedViews;
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
        const /** @type {?} */ allowPrivateServices = this.elDef ? (this.elDef.flags & 33554432 /* ComponentView */) !== 0 : false;
        return Services.resolveDep(this.view, this.elDef, allowPrivateServices, { flags: 0 /* None */, token, tokenKey: tokenKey(token) }, notFoundValue);
    }
}
function Injector__tsickle_Closure_declarations() {
    /** @type {?} */
    Injector_.prototype.view;
    /** @type {?} */
    Injector_.prototype.elDef;
}
/**
 * @param {?} view
 * @param {?} index
 * @return {?}
 */
export function nodeValue(view, index) {
    const /** @type {?} */ def = view.def.nodes[index];
    if (def.flags & 1 /* TypeElement */) {
        const /** @type {?} */ elData = asElementData(view, def.nodeIndex);
        return /** @type {?} */ ((def.element)).template ? elData.template : elData.renderElement;
    }
    else if (def.flags & 2 /* TypeText */) {
        return asTextData(view, def.nodeIndex).renderText;
    }
    else if (def.flags & (20224 /* CatProvider */ | 16 /* TypePipe */)) {
        return asProviderData(view, def.nodeIndex).instance;
    }
    throw new Error(`Illegal state: read nodeValue for node index ${index}`);
}
/**
 * @param {?} view
 * @return {?}
 */
export function createRendererV1(view) {
    return new RendererAdapter(view.renderer);
}
class RendererAdapter {
    /**
     * @param {?} delegate
     */
    constructor(delegate) {
        this.delegate = delegate;
    }
    /**
     * @param {?} selectorOrNode
     * @return {?}
     */
    selectRootElement(selectorOrNode) {
        return this.delegate.selectRootElement(selectorOrNode);
    }
    /**
     * @param {?} parent
     * @param {?} namespaceAndName
     * @return {?}
     */
    createElement(parent, namespaceAndName) {
        const [ns, name] = splitNamespace(namespaceAndName);
        const /** @type {?} */ el = this.delegate.createElement(name, ns);
        if (parent) {
            this.delegate.appendChild(parent, el);
        }
        return el;
    }
    /**
     * @param {?} hostElement
     * @return {?}
     */
    createViewRoot(hostElement) { return hostElement; }
    /**
     * @param {?} parentElement
     * @return {?}
     */
    createTemplateAnchor(parentElement) {
        const /** @type {?} */ comment = this.delegate.createComment('');
        if (parentElement) {
            this.delegate.appendChild(parentElement, comment);
        }
        return comment;
    }
    /**
     * @param {?} parentElement
     * @param {?} value
     * @return {?}
     */
    createText(parentElement, value) {
        const /** @type {?} */ node = this.delegate.createText(value);
        if (parentElement) {
            this.delegate.appendChild(parentElement, node);
        }
        return node;
    }
    /**
     * @param {?} parentElement
     * @param {?} nodes
     * @return {?}
     */
    projectNodes(parentElement, nodes) {
        for (let /** @type {?} */ i = 0; i < nodes.length; i++) {
            this.delegate.appendChild(parentElement, nodes[i]);
        }
    }
    /**
     * @param {?} node
     * @param {?} viewRootNodes
     * @return {?}
     */
    attachViewAfter(node, viewRootNodes) {
        const /** @type {?} */ parentElement = this.delegate.parentNode(node);
        const /** @type {?} */ nextSibling = this.delegate.nextSibling(node);
        for (let /** @type {?} */ i = 0; i < viewRootNodes.length; i++) {
            this.delegate.insertBefore(parentElement, viewRootNodes[i], nextSibling);
        }
    }
    /**
     * @param {?} viewRootNodes
     * @return {?}
     */
    detachView(viewRootNodes) {
        for (let /** @type {?} */ i = 0; i < viewRootNodes.length; i++) {
            const /** @type {?} */ node = viewRootNodes[i];
            const /** @type {?} */ parentElement = this.delegate.parentNode(node);
            this.delegate.removeChild(parentElement, node);
        }
    }
    /**
     * @param {?} hostElement
     * @param {?} viewAllNodes
     * @return {?}
     */
    destroyView(hostElement, viewAllNodes) {
        for (let /** @type {?} */ i = 0; i < viewAllNodes.length; i++) {
            /** @type {?} */ ((this.delegate.destroyNode))(viewAllNodes[i]);
        }
    }
    /**
     * @param {?} renderElement
     * @param {?} name
     * @param {?} callback
     * @return {?}
     */
    listen(renderElement, name, callback) {
        return this.delegate.listen(renderElement, name, /** @type {?} */ (callback));
    }
    /**
     * @param {?} target
     * @param {?} name
     * @param {?} callback
     * @return {?}
     */
    listenGlobal(target, name, callback) {
        return this.delegate.listen(target, name, /** @type {?} */ (callback));
    }
    /**
     * @param {?} renderElement
     * @param {?} propertyName
     * @param {?} propertyValue
     * @return {?}
     */
    setElementProperty(renderElement, propertyName, propertyValue) {
        this.delegate.setProperty(renderElement, propertyName, propertyValue);
    }
    /**
     * @param {?} renderElement
     * @param {?} namespaceAndName
     * @param {?} attributeValue
     * @return {?}
     */
    setElementAttribute(renderElement, namespaceAndName, attributeValue) {
        const [ns, name] = splitNamespace(namespaceAndName);
        if (attributeValue != null) {
            this.delegate.setAttribute(renderElement, name, attributeValue, ns);
        }
        else {
            this.delegate.removeAttribute(renderElement, name, ns);
        }
    }
    /**
     * @param {?} renderElement
     * @param {?} propertyName
     * @param {?} propertyValue
     * @return {?}
     */
    setBindingDebugInfo(renderElement, propertyName, propertyValue) { }
    /**
     * @param {?} renderElement
     * @param {?} className
     * @param {?} isAdd
     * @return {?}
     */
    setElementClass(renderElement, className, isAdd) {
        if (isAdd) {
            this.delegate.addClass(renderElement, className);
        }
        else {
            this.delegate.removeClass(renderElement, className);
        }
    }
    /**
     * @param {?} renderElement
     * @param {?} styleName
     * @param {?} styleValue
     * @return {?}
     */
    setElementStyle(renderElement, styleName, styleValue) {
        if (styleValue != null) {
            this.delegate.setStyle(renderElement, styleName, styleValue);
        }
        else {
            this.delegate.removeStyle(renderElement, styleName);
        }
    }
    /**
     * @param {?} renderElement
     * @param {?} methodName
     * @param {?} args
     * @return {?}
     */
    invokeElementMethod(renderElement, methodName, args) {
        (/** @type {?} */ (renderElement))[methodName].apply(renderElement, args);
    }
    /**
     * @param {?} renderNode
     * @param {?} text
     * @return {?}
     */
    setText(renderNode, text) { this.delegate.setValue(renderNode, text); }
    /**
     * @return {?}
     */
    animate() { throw new Error('Renderer.animate is no longer supported!'); }
}
function RendererAdapter_tsickle_Closure_declarations() {
    /** @type {?} */
    RendererAdapter.prototype.delegate;
}
/**
 * @param {?} moduleType
 * @param {?} parent
 * @param {?} bootstrapComponents
 * @param {?} def
 * @return {?}
 */
export function createNgModuleRef(moduleType, parent, bootstrapComponents, def) {
    return new NgModuleRef_(moduleType, parent, bootstrapComponents, def);
}
class NgModuleRef_ {
    /**
     * @param {?} _moduleType
     * @param {?} _parent
     * @param {?} _bootstrapComponents
     * @param {?} _def
     */
    constructor(_moduleType, _parent, _bootstrapComponents, _def) {
        this._moduleType = _moduleType;
        this._parent = _parent;
        this._bootstrapComponents = _bootstrapComponents;
        this._def = _def;
        this._destroyListeners = [];
        this._destroyed = false;
        this.injector = this;
        initNgModule(this);
    }
    /**
     * @param {?} token
     * @param {?=} notFoundValue
     * @param {?=} injectFlags
     * @return {?}
     */
    get(token, notFoundValue = Injector.THROW_IF_NOT_FOUND, injectFlags = 0 /* Default */) {
        let /** @type {?} */ flags = 0 /* None */;
        if (injectFlags & 4 /* SkipSelf */) {
            flags |= 1 /* SkipSelf */;
        }
        else if (injectFlags & 2 /* Self */) {
            flags |= 4 /* Self */;
        }
        return resolveNgModuleDep(this, { token: token, tokenKey: tokenKey(token), flags: flags }, notFoundValue);
    }
    /**
     * @return {?}
     */
    get instance() { return this.get(this._moduleType); }
    /**
     * @return {?}
     */
    get componentFactoryResolver() { return this.get(ComponentFactoryResolver); }
    /**
     * @return {?}
     */
    destroy() {
        if (this._destroyed) {
            throw new Error(`The ng module ${stringify(this.instance.constructor)} has already been destroyed.`);
        }
        this._destroyed = true;
        callNgModuleLifecycle(this, 131072 /* OnDestroy */);
        this._destroyListeners.forEach((listener) => listener());
    }
    /**
     * @param {?} callback
     * @return {?}
     */
    onDestroy(callback) { this._destroyListeners.push(callback); }
}
function NgModuleRef__tsickle_Closure_declarations() {
    /** @type {?} */
    NgModuleRef_.prototype._destroyListeners;
    /** @type {?} */
    NgModuleRef_.prototype._destroyed;
    /**
     * \@internal
     * @type {?}
     */
    NgModuleRef_.prototype._providers;
    /**
     * \@internal
     * @type {?}
     */
    NgModuleRef_.prototype._modules;
    /** @type {?} */
    NgModuleRef_.prototype.injector;
    /** @type {?} */
    NgModuleRef_.prototype._moduleType;
    /** @type {?} */
    NgModuleRef_.prototype._parent;
    /** @type {?} */
    NgModuleRef_.prototype._bootstrapComponents;
    /** @type {?} */
    NgModuleRef_.prototype._def;
}
//# sourceMappingURL=refs.js.map