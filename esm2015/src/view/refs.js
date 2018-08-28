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
const EMPTY_CONTEXT = new Object();
// Attention: this function is called as top level function.
// Putting any logic in here will destroy closure tree shaking!
export function createComponentFactory(selector, componentType, viewDefFactory, inputs, outputs, ngContentSelectors) {
    return new ComponentFactory_(selector, componentType, viewDefFactory, inputs, outputs, ngContentSelectors);
}
export function getComponentViewDefinitionFactory(componentFactory) {
    return componentFactory.viewDefFactory;
}
class ComponentFactory_ extends ComponentFactory {
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
    get inputs() {
        const inputsArr = [];
        const inputs = this._inputs;
        for (let propName in inputs) {
            const templateName = inputs[propName];
            inputsArr.push({ propName, templateName });
        }
        return inputsArr;
    }
    get outputs() {
        const outputsArr = [];
        for (let propName in this._outputs) {
            const templateName = this._outputs[propName];
            outputsArr.push({ propName, templateName });
        }
        return outputsArr;
    }
    /**
     * Creates a new component.
     */
    create(injector, projectableNodes, rootSelectorOrNode, ngModule) {
        if (!ngModule) {
            throw new Error('ngModule should be provided');
        }
        const viewDef = resolveDefinition(this.viewDefFactory);
        const componentNodeIndex = viewDef.nodes[0].element.componentProvider.nodeIndex;
        const view = Services.createRootView(injector, projectableNodes || [], rootSelectorOrNode, viewDef, ngModule, EMPTY_CONTEXT);
        const component = asProviderData(view, componentNodeIndex).instance;
        if (rootSelectorOrNode) {
            view.renderer.setAttribute(asElementData(view, 0).renderElement, 'ng-version', VERSION.full);
        }
        return new ComponentRef_(view, new ViewRef_(view), component);
    }
}
class ComponentRef_ extends ComponentRef {
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
    get location() {
        return new ElementRef(asElementData(this._view, this._elDef.nodeIndex).renderElement);
    }
    get injector() { return new Injector_(this._view, this._elDef); }
    get componentType() { return this._component.constructor; }
    destroy() { this._viewRef.destroy(); }
    onDestroy(callback) { this._viewRef.onDestroy(callback); }
}
export function createViewContainerData(view, elDef, elData) {
    return new ViewContainerRef_(view, elDef, elData);
}
class ViewContainerRef_ {
    constructor(_view, _elDef, _data) {
        this._view = _view;
        this._elDef = _elDef;
        this._data = _data;
        /**
         * @internal
         */
        this._embeddedViews = [];
    }
    get element() { return new ElementRef(this._data.renderElement); }
    get injector() { return new Injector_(this._view, this._elDef); }
    /** @deprecated No replacement */
    get parentInjector() {
        let view = this._view;
        let elDef = this._elDef.parent;
        while (!elDef && view) {
            elDef = viewParentEl(view);
            view = view.parent;
        }
        return view ? new Injector_(view, elDef) : new Injector_(this._view, null);
    }
    clear() {
        const len = this._embeddedViews.length;
        for (let i = len - 1; i >= 0; i--) {
            const view = detachEmbeddedView(this._data, i);
            Services.destroyView(view);
        }
    }
    get(index) {
        const view = this._embeddedViews[index];
        if (view) {
            const ref = new ViewRef_(view);
            ref.attachToViewContainerRef(this);
            return ref;
        }
        return null;
    }
    get length() { return this._embeddedViews.length; }
    createEmbeddedView(templateRef, context, index) {
        const viewRef = templateRef.createEmbeddedView(context || {});
        this.insert(viewRef, index);
        return viewRef;
    }
    createComponent(componentFactory, index, injector, projectableNodes, ngModuleRef) {
        const contextInjector = injector || this.parentInjector;
        if (!ngModuleRef && !(componentFactory instanceof ComponentFactoryBoundToModule)) {
            ngModuleRef = contextInjector.get(NgModuleRef);
        }
        const componentRef = componentFactory.create(contextInjector, projectableNodes, undefined, ngModuleRef);
        this.insert(componentRef.hostView, index);
        return componentRef;
    }
    insert(viewRef, index) {
        if (viewRef.destroyed) {
            throw new Error('Cannot insert a destroyed View in a ViewContainer!');
        }
        const viewRef_ = viewRef;
        const viewData = viewRef_._view;
        attachEmbeddedView(this._view, this._data, index, viewData);
        viewRef_.attachToViewContainerRef(this);
        return viewRef;
    }
    move(viewRef, currentIndex) {
        if (viewRef.destroyed) {
            throw new Error('Cannot move a destroyed View in a ViewContainer!');
        }
        const previousIndex = this._embeddedViews.indexOf(viewRef._view);
        moveEmbeddedView(this._data, previousIndex, currentIndex);
        return viewRef;
    }
    indexOf(viewRef) {
        return this._embeddedViews.indexOf(viewRef._view);
    }
    remove(index) {
        const viewData = detachEmbeddedView(this._data, index);
        if (viewData) {
            Services.destroyView(viewData);
        }
    }
    detach(index) {
        const view = detachEmbeddedView(this._data, index);
        return view ? new ViewRef_(view) : null;
    }
}
export function createChangeDetectorRef(view) {
    return new ViewRef_(view);
}
export class ViewRef_ {
    constructor(_view) {
        this._view = _view;
        this._viewContainerRef = null;
        this._appRef = null;
    }
    get rootNodes() { return rootRenderNodes(this._view); }
    get context() { return this._view.context; }
    get destroyed() { return (this._view.state & 128 /* Destroyed */) !== 0; }
    markForCheck() { markParentViewsForCheck(this._view); }
    detach() { this._view.state &= ~4 /* Attached */; }
    detectChanges() {
        const fs = this._view.root.rendererFactory;
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
    checkNoChanges() { Services.checkNoChangesView(this._view); }
    reattach() { this._view.state |= 4 /* Attached */; }
    onDestroy(callback) {
        if (!this._view.disposables) {
            this._view.disposables = [];
        }
        this._view.disposables.push(callback);
    }
    destroy() {
        if (this._appRef) {
            this._appRef.detachView(this);
        }
        else if (this._viewContainerRef) {
            this._viewContainerRef.detach(this._viewContainerRef.indexOf(this));
        }
        Services.destroyView(this._view);
    }
    detachFromAppRef() {
        this._appRef = null;
        renderDetachView(this._view);
        Services.dirtyParentQueries(this._view);
    }
    attachToAppRef(appRef) {
        if (this._viewContainerRef) {
            throw new Error('This view is already attached to a ViewContainer!');
        }
        this._appRef = appRef;
    }
    attachToViewContainerRef(vcRef) {
        if (this._appRef) {
            throw new Error('This view is already attached directly to the ApplicationRef!');
        }
        this._viewContainerRef = vcRef;
    }
}
export function createTemplateData(view, def) {
    return new TemplateRef_(view, def);
}
class TemplateRef_ extends TemplateRef {
    constructor(_parentView, _def) {
        super();
        this._parentView = _parentView;
        this._def = _def;
    }
    createEmbeddedView(context) {
        return new ViewRef_(Services.createEmbeddedView(this._parentView, this._def, this._def.element.template, context));
    }
    get elementRef() {
        return new ElementRef(asElementData(this._parentView, this._def.nodeIndex).renderElement);
    }
}
export function createInjector(view, elDef) {
    return new Injector_(view, elDef);
}
class Injector_ {
    constructor(view, elDef) {
        this.view = view;
        this.elDef = elDef;
    }
    get(token, notFoundValue = Injector.THROW_IF_NOT_FOUND) {
        const allowPrivateServices = this.elDef ? (this.elDef.flags & 33554432 /* ComponentView */) !== 0 : false;
        return Services.resolveDep(this.view, this.elDef, allowPrivateServices, { flags: 0 /* None */, token, tokenKey: tokenKey(token) }, notFoundValue);
    }
}
export function nodeValue(view, index) {
    const def = view.def.nodes[index];
    if (def.flags & 1 /* TypeElement */) {
        const elData = asElementData(view, def.nodeIndex);
        return def.element.template ? elData.template : elData.renderElement;
    }
    else if (def.flags & 2 /* TypeText */) {
        return asTextData(view, def.nodeIndex).renderText;
    }
    else if (def.flags & (20224 /* CatProvider */ | 16 /* TypePipe */)) {
        return asProviderData(view, def.nodeIndex).instance;
    }
    throw new Error(`Illegal state: read nodeValue for node index ${index}`);
}
export function createRendererV1(view) {
    return new RendererAdapter(view.renderer);
}
class RendererAdapter {
    constructor(delegate) {
        this.delegate = delegate;
    }
    selectRootElement(selectorOrNode) {
        return this.delegate.selectRootElement(selectorOrNode);
    }
    createElement(parent, namespaceAndName) {
        const [ns, name] = splitNamespace(namespaceAndName);
        const el = this.delegate.createElement(name, ns);
        if (parent) {
            this.delegate.appendChild(parent, el);
        }
        return el;
    }
    createViewRoot(hostElement) { return hostElement; }
    createTemplateAnchor(parentElement) {
        const comment = this.delegate.createComment('');
        if (parentElement) {
            this.delegate.appendChild(parentElement, comment);
        }
        return comment;
    }
    createText(parentElement, value) {
        const node = this.delegate.createText(value);
        if (parentElement) {
            this.delegate.appendChild(parentElement, node);
        }
        return node;
    }
    projectNodes(parentElement, nodes) {
        for (let i = 0; i < nodes.length; i++) {
            this.delegate.appendChild(parentElement, nodes[i]);
        }
    }
    attachViewAfter(node, viewRootNodes) {
        const parentElement = this.delegate.parentNode(node);
        const nextSibling = this.delegate.nextSibling(node);
        for (let i = 0; i < viewRootNodes.length; i++) {
            this.delegate.insertBefore(parentElement, viewRootNodes[i], nextSibling);
        }
    }
    detachView(viewRootNodes) {
        for (let i = 0; i < viewRootNodes.length; i++) {
            const node = viewRootNodes[i];
            const parentElement = this.delegate.parentNode(node);
            this.delegate.removeChild(parentElement, node);
        }
    }
    destroyView(hostElement, viewAllNodes) {
        for (let i = 0; i < viewAllNodes.length; i++) {
            this.delegate.destroyNode(viewAllNodes[i]);
        }
    }
    listen(renderElement, name, callback) {
        return this.delegate.listen(renderElement, name, callback);
    }
    listenGlobal(target, name, callback) {
        return this.delegate.listen(target, name, callback);
    }
    setElementProperty(renderElement, propertyName, propertyValue) {
        this.delegate.setProperty(renderElement, propertyName, propertyValue);
    }
    setElementAttribute(renderElement, namespaceAndName, attributeValue) {
        const [ns, name] = splitNamespace(namespaceAndName);
        if (attributeValue != null) {
            this.delegate.setAttribute(renderElement, name, attributeValue, ns);
        }
        else {
            this.delegate.removeAttribute(renderElement, name, ns);
        }
    }
    setBindingDebugInfo(renderElement, propertyName, propertyValue) { }
    setElementClass(renderElement, className, isAdd) {
        if (isAdd) {
            this.delegate.addClass(renderElement, className);
        }
        else {
            this.delegate.removeClass(renderElement, className);
        }
    }
    setElementStyle(renderElement, styleName, styleValue) {
        if (styleValue != null) {
            this.delegate.setStyle(renderElement, styleName, styleValue);
        }
        else {
            this.delegate.removeStyle(renderElement, styleName);
        }
    }
    invokeElementMethod(renderElement, methodName, args) {
        renderElement[methodName].apply(renderElement, args);
    }
    setText(renderNode, text) { this.delegate.setValue(renderNode, text); }
    animate() { throw new Error('Renderer.animate is no longer supported!'); }
}
export function createNgModuleRef(moduleType, parent, bootstrapComponents, def) {
    return new NgModuleRef_(moduleType, parent, bootstrapComponents, def);
}
class NgModuleRef_ {
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
    get(token, notFoundValue = Injector.THROW_IF_NOT_FOUND, injectFlags = 0 /* Default */) {
        let flags = 0 /* None */;
        if (injectFlags & 4 /* SkipSelf */) {
            flags |= 1 /* SkipSelf */;
        }
        else if (injectFlags & 2 /* Self */) {
            flags |= 4 /* Self */;
        }
        return resolveNgModuleDep(this, { token: token, tokenKey: tokenKey(token), flags: flags }, notFoundValue);
    }
    get instance() { return this.get(this._moduleType); }
    get componentFactoryResolver() { return this.get(ComponentFactoryResolver); }
    destroy() {
        if (this._destroyed) {
            throw new Error(`The ng module ${stringify(this.instance.constructor)} has already been destroyed.`);
        }
        this._destroyed = true;
        callNgModuleLifecycle(this, 131072 /* OnDestroy */);
        this._destroyListeners.forEach((listener) => listener());
    }
    onDestroy(callback) { this._destroyListeners.push(callback); }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVmcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3ZpZXcvcmVmcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFJSCxPQUFPLEVBQWMsUUFBUSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDckQsT0FBTyxFQUFDLGdCQUFnQixFQUFFLFlBQVksRUFBQyxNQUFNLDZCQUE2QixDQUFDO0FBQzNFLE9BQU8sRUFBQyw2QkFBNkIsRUFBRSx3QkFBd0IsRUFBQyxNQUFNLHNDQUFzQyxDQUFDO0FBQzdHLE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUNqRCxPQUFPLEVBQXNCLFdBQVcsRUFBQyxNQUFNLDZCQUE2QixDQUFDO0FBQzdFLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUtuRCxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBQ2xDLE9BQU8sRUFBQyxPQUFPLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFFbkMsT0FBTyxFQUFDLHFCQUFxQixFQUFFLFlBQVksRUFBRSxrQkFBa0IsRUFBQyxNQUFNLGFBQWEsQ0FBQztBQUNwRixPQUFPLEVBQThFLFFBQVEsRUFBK0UsYUFBYSxFQUFFLGNBQWMsRUFBRSxVQUFVLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFDdE8sT0FBTyxFQUFDLHVCQUF1QixFQUFFLGlCQUFpQixFQUFFLGVBQWUsRUFBRSxjQUFjLEVBQUUsUUFBUSxFQUFFLFlBQVksRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUMzSCxPQUFPLEVBQUMsa0JBQWtCLEVBQUUsa0JBQWtCLEVBQUUsZ0JBQWdCLEVBQUUsZ0JBQWdCLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFFekcsTUFBTSxhQUFhLEdBQUcsSUFBSSxNQUFNLEVBQUUsQ0FBQztBQUVuQyw0REFBNEQ7QUFDNUQsK0RBQStEO0FBQy9E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dCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7QXBwbGljYXRpb25SZWZ9IGZyb20gJy4uL2FwcGxpY2F0aW9uX3JlZic7XG5pbXBvcnQge0NoYW5nZURldGVjdG9yUmVmfSBmcm9tICcuLi9jaGFuZ2VfZGV0ZWN0aW9uL2NoYW5nZV9kZXRlY3Rpb24nO1xuaW1wb3J0IHtJbmplY3RGbGFncywgSW5qZWN0b3J9IGZyb20gJy4uL2RpL2luamVjdG9yJztcbmltcG9ydCB7Q29tcG9uZW50RmFjdG9yeSwgQ29tcG9uZW50UmVmfSBmcm9tICcuLi9saW5rZXIvY29tcG9uZW50X2ZhY3RvcnknO1xuaW1wb3J0IHtDb21wb25lbnRGYWN0b3J5Qm91bmRUb01vZHVsZSwgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyfSBmcm9tICcuLi9saW5rZXIvY29tcG9uZW50X2ZhY3RvcnlfcmVzb2x2ZXInO1xuaW1wb3J0IHtFbGVtZW50UmVmfSBmcm9tICcuLi9saW5rZXIvZWxlbWVudF9yZWYnO1xuaW1wb3J0IHtJbnRlcm5hbE5nTW9kdWxlUmVmLCBOZ01vZHVsZVJlZn0gZnJvbSAnLi4vbGlua2VyL25nX21vZHVsZV9mYWN0b3J5JztcbmltcG9ydCB7VGVtcGxhdGVSZWZ9IGZyb20gJy4uL2xpbmtlci90ZW1wbGF0ZV9yZWYnO1xuaW1wb3J0IHtWaWV3Q29udGFpbmVyUmVmfSBmcm9tICcuLi9saW5rZXIvdmlld19jb250YWluZXJfcmVmJztcbmltcG9ydCB7RW1iZWRkZWRWaWV3UmVmLCBJbnRlcm5hbFZpZXdSZWYsIFZpZXdSZWZ9IGZyb20gJy4uL2xpbmtlci92aWV3X3JlZic7XG5pbXBvcnQge1JlbmRlcmVyIGFzIFJlbmRlcmVyVjEsIFJlbmRlcmVyMn0gZnJvbSAnLi4vcmVuZGVyL2FwaSc7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL3R5cGUnO1xuaW1wb3J0IHtzdHJpbmdpZnl9IGZyb20gJy4uL3V0aWwnO1xuaW1wb3J0IHtWRVJTSU9OfSBmcm9tICcuLi92ZXJzaW9uJztcblxuaW1wb3J0IHtjYWxsTmdNb2R1bGVMaWZlY3ljbGUsIGluaXROZ01vZHVsZSwgcmVzb2x2ZU5nTW9kdWxlRGVwfSBmcm9tICcuL25nX21vZHVsZSc7XG5pbXBvcnQge0RlcEZsYWdzLCBFbGVtZW50RGF0YSwgTmdNb2R1bGVEYXRhLCBOZ01vZHVsZURlZmluaXRpb24sIE5vZGVEZWYsIE5vZGVGbGFncywgU2VydmljZXMsIFRlbXBsYXRlRGF0YSwgVmlld0NvbnRhaW5lckRhdGEsIFZpZXdEYXRhLCBWaWV3RGVmaW5pdGlvbkZhY3RvcnksIFZpZXdTdGF0ZSwgYXNFbGVtZW50RGF0YSwgYXNQcm92aWRlckRhdGEsIGFzVGV4dERhdGF9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHttYXJrUGFyZW50Vmlld3NGb3JDaGVjaywgcmVzb2x2ZURlZmluaXRpb24sIHJvb3RSZW5kZXJOb2Rlcywgc3BsaXROYW1lc3BhY2UsIHRva2VuS2V5LCB2aWV3UGFyZW50RWx9IGZyb20gJy4vdXRpbCc7XG5pbXBvcnQge2F0dGFjaEVtYmVkZGVkVmlldywgZGV0YWNoRW1iZWRkZWRWaWV3LCBtb3ZlRW1iZWRkZWRWaWV3LCByZW5kZXJEZXRhY2hWaWV3fSBmcm9tICcuL3ZpZXdfYXR0YWNoJztcblxuY29uc3QgRU1QVFlfQ09OVEVYVCA9IG5ldyBPYmplY3QoKTtcblxuLy8gQXR0ZW50aW9uOiB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBhcyB0b3AgbGV2ZWwgZnVuY3Rpb24uXG4vLyBQdXR0aW5nIGFueSBsb2dpYyBpbiBoZXJlIHdpbGwgZGVzdHJveSBjbG9zdXJlIHRyZWUgc2hha2luZyFcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVDb21wb25lbnRGYWN0b3J5KFxuICAgIHNlbGVjdG9yOiBzdHJpbmcsIGNvbXBvbmVudFR5cGU6IFR5cGU8YW55Piwgdmlld0RlZkZhY3Rvcnk6IFZpZXdEZWZpbml0aW9uRmFjdG9yeSxcbiAgICBpbnB1dHM6IHtbcHJvcE5hbWU6IHN0cmluZ106IHN0cmluZ30gfCBudWxsLCBvdXRwdXRzOiB7W3Byb3BOYW1lOiBzdHJpbmddOiBzdHJpbmd9LFxuICAgIG5nQ29udGVudFNlbGVjdG9yczogc3RyaW5nW10pOiBDb21wb25lbnRGYWN0b3J5PGFueT4ge1xuICByZXR1cm4gbmV3IENvbXBvbmVudEZhY3RvcnlfKFxuICAgICAgc2VsZWN0b3IsIGNvbXBvbmVudFR5cGUsIHZpZXdEZWZGYWN0b3J5LCBpbnB1dHMsIG91dHB1dHMsIG5nQ29udGVudFNlbGVjdG9ycyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb21wb25lbnRWaWV3RGVmaW5pdGlvbkZhY3RvcnkoY29tcG9uZW50RmFjdG9yeTogQ29tcG9uZW50RmFjdG9yeTxhbnk+KTpcbiAgICBWaWV3RGVmaW5pdGlvbkZhY3Rvcnkge1xuICByZXR1cm4gKGNvbXBvbmVudEZhY3RvcnkgYXMgQ29tcG9uZW50RmFjdG9yeV8pLnZpZXdEZWZGYWN0b3J5O1xufVxuXG5jbGFzcyBDb21wb25lbnRGYWN0b3J5XyBleHRlbmRzIENvbXBvbmVudEZhY3Rvcnk8YW55PiB7XG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHZpZXdEZWZGYWN0b3J5OiBWaWV3RGVmaW5pdGlvbkZhY3Rvcnk7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBwdWJsaWMgc2VsZWN0b3I6IHN0cmluZywgcHVibGljIGNvbXBvbmVudFR5cGU6IFR5cGU8YW55PixcbiAgICAgIHZpZXdEZWZGYWN0b3J5OiBWaWV3RGVmaW5pdGlvbkZhY3RvcnksIHByaXZhdGUgX2lucHV0czoge1twcm9wTmFtZTogc3RyaW5nXTogc3RyaW5nfXxudWxsLFxuICAgICAgcHJpdmF0ZSBfb3V0cHV0czoge1twcm9wTmFtZTogc3RyaW5nXTogc3RyaW5nfSwgcHVibGljIG5nQ29udGVudFNlbGVjdG9yczogc3RyaW5nW10pIHtcbiAgICAvLyBBdHRlbnRpb246IHRoaXMgY3RvciBpcyBjYWxsZWQgYXMgdG9wIGxldmVsIGZ1bmN0aW9uLlxuICAgIC8vIFB1dHRpbmcgYW55IGxvZ2ljIGluIGhlcmUgd2lsbCBkZXN0cm95IGNsb3N1cmUgdHJlZSBzaGFraW5nIVxuICAgIHN1cGVyKCk7XG4gICAgdGhpcy52aWV3RGVmRmFjdG9yeSA9IHZpZXdEZWZGYWN0b3J5O1xuICB9XG5cbiAgZ2V0IGlucHV0cygpIHtcbiAgICBjb25zdCBpbnB1dHNBcnI6IHtwcm9wTmFtZTogc3RyaW5nLCB0ZW1wbGF0ZU5hbWU6IHN0cmluZ31bXSA9IFtdO1xuICAgIGNvbnN0IGlucHV0cyA9IHRoaXMuX2lucHV0cyAhO1xuICAgIGZvciAobGV0IHByb3BOYW1lIGluIGlucHV0cykge1xuICAgICAgY29uc3QgdGVtcGxhdGVOYW1lID0gaW5wdXRzW3Byb3BOYW1lXTtcbiAgICAgIGlucHV0c0Fyci5wdXNoKHtwcm9wTmFtZSwgdGVtcGxhdGVOYW1lfSk7XG4gICAgfVxuICAgIHJldHVybiBpbnB1dHNBcnI7XG4gIH1cblxuICBnZXQgb3V0cHV0cygpIHtcbiAgICBjb25zdCBvdXRwdXRzQXJyOiB7cHJvcE5hbWU6IHN0cmluZywgdGVtcGxhdGVOYW1lOiBzdHJpbmd9W10gPSBbXTtcbiAgICBmb3IgKGxldCBwcm9wTmFtZSBpbiB0aGlzLl9vdXRwdXRzKSB7XG4gICAgICBjb25zdCB0ZW1wbGF0ZU5hbWUgPSB0aGlzLl9vdXRwdXRzW3Byb3BOYW1lXTtcbiAgICAgIG91dHB1dHNBcnIucHVzaCh7cHJvcE5hbWUsIHRlbXBsYXRlTmFtZX0pO1xuICAgIH1cbiAgICByZXR1cm4gb3V0cHV0c0FycjtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IGNvbXBvbmVudC5cbiAgICovXG4gIGNyZWF0ZShcbiAgICAgIGluamVjdG9yOiBJbmplY3RvciwgcHJvamVjdGFibGVOb2Rlcz86IGFueVtdW10sIHJvb3RTZWxlY3Rvck9yTm9kZT86IHN0cmluZ3xhbnksXG4gICAgICBuZ01vZHVsZT86IE5nTW9kdWxlUmVmPGFueT4pOiBDb21wb25lbnRSZWY8YW55PiB7XG4gICAgaWYgKCFuZ01vZHVsZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCduZ01vZHVsZSBzaG91bGQgYmUgcHJvdmlkZWQnKTtcbiAgICB9XG4gICAgY29uc3Qgdmlld0RlZiA9IHJlc29sdmVEZWZpbml0aW9uKHRoaXMudmlld0RlZkZhY3RvcnkpO1xuICAgIGNvbnN0IGNvbXBvbmVudE5vZGVJbmRleCA9IHZpZXdEZWYubm9kZXNbMF0uZWxlbWVudCAhLmNvbXBvbmVudFByb3ZpZGVyICEubm9kZUluZGV4O1xuICAgIGNvbnN0IHZpZXcgPSBTZXJ2aWNlcy5jcmVhdGVSb290VmlldyhcbiAgICAgICAgaW5qZWN0b3IsIHByb2plY3RhYmxlTm9kZXMgfHwgW10sIHJvb3RTZWxlY3Rvck9yTm9kZSwgdmlld0RlZiwgbmdNb2R1bGUsIEVNUFRZX0NPTlRFWFQpO1xuICAgIGNvbnN0IGNvbXBvbmVudCA9IGFzUHJvdmlkZXJEYXRhKHZpZXcsIGNvbXBvbmVudE5vZGVJbmRleCkuaW5zdGFuY2U7XG4gICAgaWYgKHJvb3RTZWxlY3Rvck9yTm9kZSkge1xuICAgICAgdmlldy5yZW5kZXJlci5zZXRBdHRyaWJ1dGUoYXNFbGVtZW50RGF0YSh2aWV3LCAwKS5yZW5kZXJFbGVtZW50LCAnbmctdmVyc2lvbicsIFZFUlNJT04uZnVsbCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBDb21wb25lbnRSZWZfKHZpZXcsIG5ldyBWaWV3UmVmXyh2aWV3KSwgY29tcG9uZW50KTtcbiAgfVxufVxuXG5jbGFzcyBDb21wb25lbnRSZWZfIGV4dGVuZHMgQ29tcG9uZW50UmVmPGFueT4ge1xuICBwdWJsaWMgcmVhZG9ubHkgaG9zdFZpZXc6IFZpZXdSZWY7XG4gIHB1YmxpYyByZWFkb25seSBpbnN0YW5jZTogYW55O1xuICBwdWJsaWMgcmVhZG9ubHkgY2hhbmdlRGV0ZWN0b3JSZWY6IENoYW5nZURldGVjdG9yUmVmO1xuICBwcml2YXRlIF9lbERlZjogTm9kZURlZjtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfdmlldzogVmlld0RhdGEsIHByaXZhdGUgX3ZpZXdSZWY6IFZpZXdSZWYsIHByaXZhdGUgX2NvbXBvbmVudDogYW55KSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLl9lbERlZiA9IHRoaXMuX3ZpZXcuZGVmLm5vZGVzWzBdO1xuICAgIHRoaXMuaG9zdFZpZXcgPSBfdmlld1JlZjtcbiAgICB0aGlzLmNoYW5nZURldGVjdG9yUmVmID0gX3ZpZXdSZWY7XG4gICAgdGhpcy5pbnN0YW5jZSA9IF9jb21wb25lbnQ7XG4gIH1cbiAgZ2V0IGxvY2F0aW9uKCk6IEVsZW1lbnRSZWYge1xuICAgIHJldHVybiBuZXcgRWxlbWVudFJlZihhc0VsZW1lbnREYXRhKHRoaXMuX3ZpZXcsIHRoaXMuX2VsRGVmLm5vZGVJbmRleCkucmVuZGVyRWxlbWVudCk7XG4gIH1cbiAgZ2V0IGluamVjdG9yKCk6IEluamVjdG9yIHsgcmV0dXJuIG5ldyBJbmplY3Rvcl8odGhpcy5fdmlldywgdGhpcy5fZWxEZWYpOyB9XG4gIGdldCBjb21wb25lbnRUeXBlKCk6IFR5cGU8YW55PiB7IHJldHVybiA8YW55PnRoaXMuX2NvbXBvbmVudC5jb25zdHJ1Y3RvcjsgfVxuXG4gIGRlc3Ryb3koKTogdm9pZCB7IHRoaXMuX3ZpZXdSZWYuZGVzdHJveSgpOyB9XG4gIG9uRGVzdHJveShjYWxsYmFjazogRnVuY3Rpb24pOiB2b2lkIHsgdGhpcy5fdmlld1JlZi5vbkRlc3Ryb3koY2FsbGJhY2spOyB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVWaWV3Q29udGFpbmVyRGF0YShcbiAgICB2aWV3OiBWaWV3RGF0YSwgZWxEZWY6IE5vZGVEZWYsIGVsRGF0YTogRWxlbWVudERhdGEpOiBWaWV3Q29udGFpbmVyRGF0YSB7XG4gIHJldHVybiBuZXcgVmlld0NvbnRhaW5lclJlZl8odmlldywgZWxEZWYsIGVsRGF0YSk7XG59XG5cbmNsYXNzIFZpZXdDb250YWluZXJSZWZfIGltcGxlbWVudHMgVmlld0NvbnRhaW5lckRhdGEge1xuICAvKipcbiAgICogQGludGVybmFsXG4gICAqL1xuICBfZW1iZWRkZWRWaWV3czogVmlld0RhdGFbXSA9IFtdO1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF92aWV3OiBWaWV3RGF0YSwgcHJpdmF0ZSBfZWxEZWY6IE5vZGVEZWYsIHByaXZhdGUgX2RhdGE6IEVsZW1lbnREYXRhKSB7fVxuXG4gIGdldCBlbGVtZW50KCk6IEVsZW1lbnRSZWYgeyByZXR1cm4gbmV3IEVsZW1lbnRSZWYodGhpcy5fZGF0YS5yZW5kZXJFbGVtZW50KTsgfVxuXG4gIGdldCBpbmplY3RvcigpOiBJbmplY3RvciB7IHJldHVybiBuZXcgSW5qZWN0b3JfKHRoaXMuX3ZpZXcsIHRoaXMuX2VsRGVmKTsgfVxuXG4gIC8qKiBAZGVwcmVjYXRlZCBObyByZXBsYWNlbWVudCAqL1xuICBnZXQgcGFyZW50SW5qZWN0b3IoKTogSW5qZWN0b3Ige1xuICAgIGxldCB2aWV3ID0gdGhpcy5fdmlldztcbiAgICBsZXQgZWxEZWYgPSB0aGlzLl9lbERlZi5wYXJlbnQ7XG4gICAgd2hpbGUgKCFlbERlZiAmJiB2aWV3KSB7XG4gICAgICBlbERlZiA9IHZpZXdQYXJlbnRFbCh2aWV3KTtcbiAgICAgIHZpZXcgPSB2aWV3LnBhcmVudCAhO1xuICAgIH1cblxuICAgIHJldHVybiB2aWV3ID8gbmV3IEluamVjdG9yXyh2aWV3LCBlbERlZikgOiBuZXcgSW5qZWN0b3JfKHRoaXMuX3ZpZXcsIG51bGwpO1xuICB9XG5cbiAgY2xlYXIoKTogdm9pZCB7XG4gICAgY29uc3QgbGVuID0gdGhpcy5fZW1iZWRkZWRWaWV3cy5sZW5ndGg7XG4gICAgZm9yIChsZXQgaSA9IGxlbiAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICBjb25zdCB2aWV3ID0gZGV0YWNoRW1iZWRkZWRWaWV3KHRoaXMuX2RhdGEsIGkpICE7XG4gICAgICBTZXJ2aWNlcy5kZXN0cm95Vmlldyh2aWV3KTtcbiAgICB9XG4gIH1cblxuICBnZXQoaW5kZXg6IG51bWJlcik6IFZpZXdSZWZ8bnVsbCB7XG4gICAgY29uc3QgdmlldyA9IHRoaXMuX2VtYmVkZGVkVmlld3NbaW5kZXhdO1xuICAgIGlmICh2aWV3KSB7XG4gICAgICBjb25zdCByZWYgPSBuZXcgVmlld1JlZl8odmlldyk7XG4gICAgICByZWYuYXR0YWNoVG9WaWV3Q29udGFpbmVyUmVmKHRoaXMpO1xuICAgICAgcmV0dXJuIHJlZjtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBnZXQgbGVuZ3RoKCk6IG51bWJlciB7IHJldHVybiB0aGlzLl9lbWJlZGRlZFZpZXdzLmxlbmd0aDsgfVxuXG4gIGNyZWF0ZUVtYmVkZGVkVmlldzxDPih0ZW1wbGF0ZVJlZjogVGVtcGxhdGVSZWY8Qz4sIGNvbnRleHQ/OiBDLCBpbmRleD86IG51bWJlcik6XG4gICAgICBFbWJlZGRlZFZpZXdSZWY8Qz4ge1xuICAgIGNvbnN0IHZpZXdSZWYgPSB0ZW1wbGF0ZVJlZi5jcmVhdGVFbWJlZGRlZFZpZXcoY29udGV4dCB8fCA8YW55Pnt9KTtcbiAgICB0aGlzLmluc2VydCh2aWV3UmVmLCBpbmRleCk7XG4gICAgcmV0dXJuIHZpZXdSZWY7XG4gIH1cblxuICBjcmVhdGVDb21wb25lbnQ8Qz4oXG4gICAgICBjb21wb25lbnRGYWN0b3J5OiBDb21wb25lbnRGYWN0b3J5PEM+LCBpbmRleD86IG51bWJlciwgaW5qZWN0b3I/OiBJbmplY3RvcixcbiAgICAgIHByb2plY3RhYmxlTm9kZXM/OiBhbnlbXVtdLCBuZ01vZHVsZVJlZj86IE5nTW9kdWxlUmVmPGFueT4pOiBDb21wb25lbnRSZWY8Qz4ge1xuICAgIGNvbnN0IGNvbnRleHRJbmplY3RvciA9IGluamVjdG9yIHx8IHRoaXMucGFyZW50SW5qZWN0b3I7XG4gICAgaWYgKCFuZ01vZHVsZVJlZiAmJiAhKGNvbXBvbmVudEZhY3RvcnkgaW5zdGFuY2VvZiBDb21wb25lbnRGYWN0b3J5Qm91bmRUb01vZHVsZSkpIHtcbiAgICAgIG5nTW9kdWxlUmVmID0gY29udGV4dEluamVjdG9yLmdldChOZ01vZHVsZVJlZik7XG4gICAgfVxuICAgIGNvbnN0IGNvbXBvbmVudFJlZiA9XG4gICAgICAgIGNvbXBvbmVudEZhY3RvcnkuY3JlYXRlKGNvbnRleHRJbmplY3RvciwgcHJvamVjdGFibGVOb2RlcywgdW5kZWZpbmVkLCBuZ01vZHVsZVJlZik7XG4gICAgdGhpcy5pbnNlcnQoY29tcG9uZW50UmVmLmhvc3RWaWV3LCBpbmRleCk7XG4gICAgcmV0dXJuIGNvbXBvbmVudFJlZjtcbiAgfVxuXG4gIGluc2VydCh2aWV3UmVmOiBWaWV3UmVmLCBpbmRleD86IG51bWJlcik6IFZpZXdSZWYge1xuICAgIGlmICh2aWV3UmVmLmRlc3Ryb3llZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgaW5zZXJ0IGEgZGVzdHJveWVkIFZpZXcgaW4gYSBWaWV3Q29udGFpbmVyIScpO1xuICAgIH1cbiAgICBjb25zdCB2aWV3UmVmXyA9IDxWaWV3UmVmXz52aWV3UmVmO1xuICAgIGNvbnN0IHZpZXdEYXRhID0gdmlld1JlZl8uX3ZpZXc7XG4gICAgYXR0YWNoRW1iZWRkZWRWaWV3KHRoaXMuX3ZpZXcsIHRoaXMuX2RhdGEsIGluZGV4LCB2aWV3RGF0YSk7XG4gICAgdmlld1JlZl8uYXR0YWNoVG9WaWV3Q29udGFpbmVyUmVmKHRoaXMpO1xuICAgIHJldHVybiB2aWV3UmVmO1xuICB9XG5cbiAgbW92ZSh2aWV3UmVmOiBWaWV3UmVmXywgY3VycmVudEluZGV4OiBudW1iZXIpOiBWaWV3UmVmIHtcbiAgICBpZiAodmlld1JlZi5kZXN0cm95ZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IG1vdmUgYSBkZXN0cm95ZWQgVmlldyBpbiBhIFZpZXdDb250YWluZXIhJyk7XG4gICAgfVxuICAgIGNvbnN0IHByZXZpb3VzSW5kZXggPSB0aGlzLl9lbWJlZGRlZFZpZXdzLmluZGV4T2Yodmlld1JlZi5fdmlldyk7XG4gICAgbW92ZUVtYmVkZGVkVmlldyh0aGlzLl9kYXRhLCBwcmV2aW91c0luZGV4LCBjdXJyZW50SW5kZXgpO1xuICAgIHJldHVybiB2aWV3UmVmO1xuICB9XG5cbiAgaW5kZXhPZih2aWV3UmVmOiBWaWV3UmVmKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fZW1iZWRkZWRWaWV3cy5pbmRleE9mKCg8Vmlld1JlZl8+dmlld1JlZikuX3ZpZXcpO1xuICB9XG5cbiAgcmVtb3ZlKGluZGV4PzogbnVtYmVyKTogdm9pZCB7XG4gICAgY29uc3Qgdmlld0RhdGEgPSBkZXRhY2hFbWJlZGRlZFZpZXcodGhpcy5fZGF0YSwgaW5kZXgpO1xuICAgIGlmICh2aWV3RGF0YSkge1xuICAgICAgU2VydmljZXMuZGVzdHJveVZpZXcodmlld0RhdGEpO1xuICAgIH1cbiAgfVxuXG4gIGRldGFjaChpbmRleD86IG51bWJlcik6IFZpZXdSZWZ8bnVsbCB7XG4gICAgY29uc3QgdmlldyA9IGRldGFjaEVtYmVkZGVkVmlldyh0aGlzLl9kYXRhLCBpbmRleCk7XG4gICAgcmV0dXJuIHZpZXcgPyBuZXcgVmlld1JlZl8odmlldykgOiBudWxsO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVDaGFuZ2VEZXRlY3RvclJlZih2aWV3OiBWaWV3RGF0YSk6IENoYW5nZURldGVjdG9yUmVmIHtcbiAgcmV0dXJuIG5ldyBWaWV3UmVmXyh2aWV3KTtcbn1cblxuZXhwb3J0IGNsYXNzIFZpZXdSZWZfIGltcGxlbWVudHMgRW1iZWRkZWRWaWV3UmVmPGFueT4sIEludGVybmFsVmlld1JlZiB7XG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX3ZpZXc6IFZpZXdEYXRhO1xuICBwcml2YXRlIF92aWV3Q29udGFpbmVyUmVmOiBWaWV3Q29udGFpbmVyUmVmfG51bGw7XG4gIHByaXZhdGUgX2FwcFJlZjogQXBwbGljYXRpb25SZWZ8bnVsbDtcblxuICBjb25zdHJ1Y3RvcihfdmlldzogVmlld0RhdGEpIHtcbiAgICB0aGlzLl92aWV3ID0gX3ZpZXc7XG4gICAgdGhpcy5fdmlld0NvbnRhaW5lclJlZiA9IG51bGw7XG4gICAgdGhpcy5fYXBwUmVmID0gbnVsbDtcbiAgfVxuXG4gIGdldCByb290Tm9kZXMoKTogYW55W10geyByZXR1cm4gcm9vdFJlbmRlck5vZGVzKHRoaXMuX3ZpZXcpOyB9XG5cbiAgZ2V0IGNvbnRleHQoKSB7IHJldHVybiB0aGlzLl92aWV3LmNvbnRleHQ7IH1cblxuICBnZXQgZGVzdHJveWVkKCk6IGJvb2xlYW4geyByZXR1cm4gKHRoaXMuX3ZpZXcuc3RhdGUgJiBWaWV3U3RhdGUuRGVzdHJveWVkKSAhPT0gMDsgfVxuXG4gIG1hcmtGb3JDaGVjaygpOiB2b2lkIHsgbWFya1BhcmVudFZpZXdzRm9yQ2hlY2sodGhpcy5fdmlldyk7IH1cbiAgZGV0YWNoKCk6IHZvaWQgeyB0aGlzLl92aWV3LnN0YXRlICY9IH5WaWV3U3RhdGUuQXR0YWNoZWQ7IH1cbiAgZGV0ZWN0Q2hhbmdlcygpOiB2b2lkIHtcbiAgICBjb25zdCBmcyA9IHRoaXMuX3ZpZXcucm9vdC5yZW5kZXJlckZhY3Rvcnk7XG4gICAgaWYgKGZzLmJlZ2luKSB7XG4gICAgICBmcy5iZWdpbigpO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgU2VydmljZXMuY2hlY2tBbmRVcGRhdGVWaWV3KHRoaXMuX3ZpZXcpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBpZiAoZnMuZW5kKSB7XG4gICAgICAgIGZzLmVuZCgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBjaGVja05vQ2hhbmdlcygpOiB2b2lkIHsgU2VydmljZXMuY2hlY2tOb0NoYW5nZXNWaWV3KHRoaXMuX3ZpZXcpOyB9XG5cbiAgcmVhdHRhY2goKTogdm9pZCB7IHRoaXMuX3ZpZXcuc3RhdGUgfD0gVmlld1N0YXRlLkF0dGFjaGVkOyB9XG4gIG9uRGVzdHJveShjYWxsYmFjazogRnVuY3Rpb24pIHtcbiAgICBpZiAoIXRoaXMuX3ZpZXcuZGlzcG9zYWJsZXMpIHtcbiAgICAgIHRoaXMuX3ZpZXcuZGlzcG9zYWJsZXMgPSBbXTtcbiAgICB9XG4gICAgdGhpcy5fdmlldy5kaXNwb3NhYmxlcy5wdXNoKDxhbnk+Y2FsbGJhY2spO1xuICB9XG5cbiAgZGVzdHJveSgpIHtcbiAgICBpZiAodGhpcy5fYXBwUmVmKSB7XG4gICAgICB0aGlzLl9hcHBSZWYuZGV0YWNoVmlldyh0aGlzKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuX3ZpZXdDb250YWluZXJSZWYpIHtcbiAgICAgIHRoaXMuX3ZpZXdDb250YWluZXJSZWYuZGV0YWNoKHRoaXMuX3ZpZXdDb250YWluZXJSZWYuaW5kZXhPZih0aGlzKSk7XG4gICAgfVxuICAgIFNlcnZpY2VzLmRlc3Ryb3lWaWV3KHRoaXMuX3ZpZXcpO1xuICB9XG5cbiAgZGV0YWNoRnJvbUFwcFJlZigpIHtcbiAgICB0aGlzLl9hcHBSZWYgPSBudWxsO1xuICAgIHJlbmRlckRldGFjaFZpZXcodGhpcy5fdmlldyk7XG4gICAgU2VydmljZXMuZGlydHlQYXJlbnRRdWVyaWVzKHRoaXMuX3ZpZXcpO1xuICB9XG5cbiAgYXR0YWNoVG9BcHBSZWYoYXBwUmVmOiBBcHBsaWNhdGlvblJlZikge1xuICAgIGlmICh0aGlzLl92aWV3Q29udGFpbmVyUmVmKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoaXMgdmlldyBpcyBhbHJlYWR5IGF0dGFjaGVkIHRvIGEgVmlld0NvbnRhaW5lciEnKTtcbiAgICB9XG4gICAgdGhpcy5fYXBwUmVmID0gYXBwUmVmO1xuICB9XG5cbiAgYXR0YWNoVG9WaWV3Q29udGFpbmVyUmVmKHZjUmVmOiBWaWV3Q29udGFpbmVyUmVmKSB7XG4gICAgaWYgKHRoaXMuX2FwcFJlZikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGlzIHZpZXcgaXMgYWxyZWFkeSBhdHRhY2hlZCBkaXJlY3RseSB0byB0aGUgQXBwbGljYXRpb25SZWYhJyk7XG4gICAgfVxuICAgIHRoaXMuX3ZpZXdDb250YWluZXJSZWYgPSB2Y1JlZjtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVGVtcGxhdGVEYXRhKHZpZXc6IFZpZXdEYXRhLCBkZWY6IE5vZGVEZWYpOiBUZW1wbGF0ZURhdGEge1xuICByZXR1cm4gbmV3IFRlbXBsYXRlUmVmXyh2aWV3LCBkZWYpO1xufVxuXG5jbGFzcyBUZW1wbGF0ZVJlZl8gZXh0ZW5kcyBUZW1wbGF0ZVJlZjxhbnk+IGltcGxlbWVudHMgVGVtcGxhdGVEYXRhIHtcbiAgLyoqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgLy8gVE9ETyhpc3N1ZS8yNDU3MSk6IHJlbW92ZSAnIScuXG4gIF9wcm9qZWN0ZWRWaWV3cyAhOiBWaWV3RGF0YVtdO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX3BhcmVudFZpZXc6IFZpZXdEYXRhLCBwcml2YXRlIF9kZWY6IE5vZGVEZWYpIHsgc3VwZXIoKTsgfVxuXG4gIGNyZWF0ZUVtYmVkZGVkVmlldyhjb250ZXh0OiBhbnkpOiBFbWJlZGRlZFZpZXdSZWY8YW55PiB7XG4gICAgcmV0dXJuIG5ldyBWaWV3UmVmXyhTZXJ2aWNlcy5jcmVhdGVFbWJlZGRlZFZpZXcoXG4gICAgICAgIHRoaXMuX3BhcmVudFZpZXcsIHRoaXMuX2RlZiwgdGhpcy5fZGVmLmVsZW1lbnQgIS50ZW1wbGF0ZSAhLCBjb250ZXh0KSk7XG4gIH1cblxuICBnZXQgZWxlbWVudFJlZigpOiBFbGVtZW50UmVmIHtcbiAgICByZXR1cm4gbmV3IEVsZW1lbnRSZWYoYXNFbGVtZW50RGF0YSh0aGlzLl9wYXJlbnRWaWV3LCB0aGlzLl9kZWYubm9kZUluZGV4KS5yZW5kZXJFbGVtZW50KTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlSW5qZWN0b3IodmlldzogVmlld0RhdGEsIGVsRGVmOiBOb2RlRGVmKTogSW5qZWN0b3Ige1xuICByZXR1cm4gbmV3IEluamVjdG9yXyh2aWV3LCBlbERlZik7XG59XG5cbmNsYXNzIEluamVjdG9yXyBpbXBsZW1lbnRzIEluamVjdG9yIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSB2aWV3OiBWaWV3RGF0YSwgcHJpdmF0ZSBlbERlZjogTm9kZURlZnxudWxsKSB7fVxuICBnZXQodG9rZW46IGFueSwgbm90Rm91bmRWYWx1ZTogYW55ID0gSW5qZWN0b3IuVEhST1dfSUZfTk9UX0ZPVU5EKTogYW55IHtcbiAgICBjb25zdCBhbGxvd1ByaXZhdGVTZXJ2aWNlcyA9XG4gICAgICAgIHRoaXMuZWxEZWYgPyAodGhpcy5lbERlZi5mbGFncyAmIE5vZGVGbGFncy5Db21wb25lbnRWaWV3KSAhPT0gMCA6IGZhbHNlO1xuICAgIHJldHVybiBTZXJ2aWNlcy5yZXNvbHZlRGVwKFxuICAgICAgICB0aGlzLnZpZXcsIHRoaXMuZWxEZWYsIGFsbG93UHJpdmF0ZVNlcnZpY2VzLFxuICAgICAgICB7ZmxhZ3M6IERlcEZsYWdzLk5vbmUsIHRva2VuLCB0b2tlbktleTogdG9rZW5LZXkodG9rZW4pfSwgbm90Rm91bmRWYWx1ZSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5vZGVWYWx1ZSh2aWV3OiBWaWV3RGF0YSwgaW5kZXg6IG51bWJlcik6IGFueSB7XG4gIGNvbnN0IGRlZiA9IHZpZXcuZGVmLm5vZGVzW2luZGV4XTtcbiAgaWYgKGRlZi5mbGFncyAmIE5vZGVGbGFncy5UeXBlRWxlbWVudCkge1xuICAgIGNvbnN0IGVsRGF0YSA9IGFzRWxlbWVudERhdGEodmlldywgZGVmLm5vZGVJbmRleCk7XG4gICAgcmV0dXJuIGRlZi5lbGVtZW50ICEudGVtcGxhdGUgPyBlbERhdGEudGVtcGxhdGUgOiBlbERhdGEucmVuZGVyRWxlbWVudDtcbiAgfSBlbHNlIGlmIChkZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuVHlwZVRleHQpIHtcbiAgICByZXR1cm4gYXNUZXh0RGF0YSh2aWV3LCBkZWYubm9kZUluZGV4KS5yZW5kZXJUZXh0O1xuICB9IGVsc2UgaWYgKGRlZi5mbGFncyAmIChOb2RlRmxhZ3MuQ2F0UHJvdmlkZXIgfCBOb2RlRmxhZ3MuVHlwZVBpcGUpKSB7XG4gICAgcmV0dXJuIGFzUHJvdmlkZXJEYXRhKHZpZXcsIGRlZi5ub2RlSW5kZXgpLmluc3RhbmNlO1xuICB9XG4gIHRocm93IG5ldyBFcnJvcihgSWxsZWdhbCBzdGF0ZTogcmVhZCBub2RlVmFsdWUgZm9yIG5vZGUgaW5kZXggJHtpbmRleH1gKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVJlbmRlcmVyVjEodmlldzogVmlld0RhdGEpOiBSZW5kZXJlclYxIHtcbiAgcmV0dXJuIG5ldyBSZW5kZXJlckFkYXB0ZXIodmlldy5yZW5kZXJlcik7XG59XG5cbmNsYXNzIFJlbmRlcmVyQWRhcHRlciBpbXBsZW1lbnRzIFJlbmRlcmVyVjEge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGRlbGVnYXRlOiBSZW5kZXJlcjIpIHt9XG4gIHNlbGVjdFJvb3RFbGVtZW50KHNlbGVjdG9yT3JOb2RlOiBzdHJpbmd8RWxlbWVudCk6IEVsZW1lbnQge1xuICAgIHJldHVybiB0aGlzLmRlbGVnYXRlLnNlbGVjdFJvb3RFbGVtZW50KHNlbGVjdG9yT3JOb2RlKTtcbiAgfVxuXG4gIGNyZWF0ZUVsZW1lbnQocGFyZW50OiBFbGVtZW50fERvY3VtZW50RnJhZ21lbnQsIG5hbWVzcGFjZUFuZE5hbWU6IHN0cmluZyk6IEVsZW1lbnQge1xuICAgIGNvbnN0IFtucywgbmFtZV0gPSBzcGxpdE5hbWVzcGFjZShuYW1lc3BhY2VBbmROYW1lKTtcbiAgICBjb25zdCBlbCA9IHRoaXMuZGVsZWdhdGUuY3JlYXRlRWxlbWVudChuYW1lLCBucyk7XG4gICAgaWYgKHBhcmVudCkge1xuICAgICAgdGhpcy5kZWxlZ2F0ZS5hcHBlbmRDaGlsZChwYXJlbnQsIGVsKTtcbiAgICB9XG4gICAgcmV0dXJuIGVsO1xuICB9XG5cbiAgY3JlYXRlVmlld1Jvb3QoaG9zdEVsZW1lbnQ6IEVsZW1lbnQpOiBFbGVtZW50fERvY3VtZW50RnJhZ21lbnQgeyByZXR1cm4gaG9zdEVsZW1lbnQ7IH1cblxuICBjcmVhdGVUZW1wbGF0ZUFuY2hvcihwYXJlbnRFbGVtZW50OiBFbGVtZW50fERvY3VtZW50RnJhZ21lbnQpOiBDb21tZW50IHtcbiAgICBjb25zdCBjb21tZW50ID0gdGhpcy5kZWxlZ2F0ZS5jcmVhdGVDb21tZW50KCcnKTtcbiAgICBpZiAocGFyZW50RWxlbWVudCkge1xuICAgICAgdGhpcy5kZWxlZ2F0ZS5hcHBlbmRDaGlsZChwYXJlbnRFbGVtZW50LCBjb21tZW50KTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbW1lbnQ7XG4gIH1cblxuICBjcmVhdGVUZXh0KHBhcmVudEVsZW1lbnQ6IEVsZW1lbnR8RG9jdW1lbnRGcmFnbWVudCwgdmFsdWU6IHN0cmluZyk6IGFueSB7XG4gICAgY29uc3Qgbm9kZSA9IHRoaXMuZGVsZWdhdGUuY3JlYXRlVGV4dCh2YWx1ZSk7XG4gICAgaWYgKHBhcmVudEVsZW1lbnQpIHtcbiAgICAgIHRoaXMuZGVsZWdhdGUuYXBwZW5kQ2hpbGQocGFyZW50RWxlbWVudCwgbm9kZSk7XG4gICAgfVxuICAgIHJldHVybiBub2RlO1xuICB9XG5cbiAgcHJvamVjdE5vZGVzKHBhcmVudEVsZW1lbnQ6IEVsZW1lbnR8RG9jdW1lbnRGcmFnbWVudCwgbm9kZXM6IE5vZGVbXSkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRoaXMuZGVsZWdhdGUuYXBwZW5kQ2hpbGQocGFyZW50RWxlbWVudCwgbm9kZXNbaV0pO1xuICAgIH1cbiAgfVxuXG4gIGF0dGFjaFZpZXdBZnRlcihub2RlOiBOb2RlLCB2aWV3Um9vdE5vZGVzOiBOb2RlW10pIHtcbiAgICBjb25zdCBwYXJlbnRFbGVtZW50ID0gdGhpcy5kZWxlZ2F0ZS5wYXJlbnROb2RlKG5vZGUpO1xuICAgIGNvbnN0IG5leHRTaWJsaW5nID0gdGhpcy5kZWxlZ2F0ZS5uZXh0U2libGluZyhub2RlKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZpZXdSb290Tm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRoaXMuZGVsZWdhdGUuaW5zZXJ0QmVmb3JlKHBhcmVudEVsZW1lbnQsIHZpZXdSb290Tm9kZXNbaV0sIG5leHRTaWJsaW5nKTtcbiAgICB9XG4gIH1cblxuICBkZXRhY2hWaWV3KHZpZXdSb290Tm9kZXM6IChFbGVtZW50fFRleHR8Q29tbWVudClbXSkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmlld1Jvb3ROb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3Qgbm9kZSA9IHZpZXdSb290Tm9kZXNbaV07XG4gICAgICBjb25zdCBwYXJlbnRFbGVtZW50ID0gdGhpcy5kZWxlZ2F0ZS5wYXJlbnROb2RlKG5vZGUpO1xuICAgICAgdGhpcy5kZWxlZ2F0ZS5yZW1vdmVDaGlsZChwYXJlbnRFbGVtZW50LCBub2RlKTtcbiAgICB9XG4gIH1cblxuICBkZXN0cm95Vmlldyhob3N0RWxlbWVudDogRWxlbWVudHxEb2N1bWVudEZyYWdtZW50LCB2aWV3QWxsTm9kZXM6IE5vZGVbXSkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmlld0FsbE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB0aGlzLmRlbGVnYXRlLmRlc3Ryb3lOb2RlICEodmlld0FsbE5vZGVzW2ldKTtcbiAgICB9XG4gIH1cblxuICBsaXN0ZW4ocmVuZGVyRWxlbWVudDogYW55LCBuYW1lOiBzdHJpbmcsIGNhbGxiYWNrOiBGdW5jdGlvbik6IEZ1bmN0aW9uIHtcbiAgICByZXR1cm4gdGhpcy5kZWxlZ2F0ZS5saXN0ZW4ocmVuZGVyRWxlbWVudCwgbmFtZSwgPGFueT5jYWxsYmFjayk7XG4gIH1cblxuICBsaXN0ZW5HbG9iYWwodGFyZ2V0OiBzdHJpbmcsIG5hbWU6IHN0cmluZywgY2FsbGJhY2s6IEZ1bmN0aW9uKTogRnVuY3Rpb24ge1xuICAgIHJldHVybiB0aGlzLmRlbGVnYXRlLmxpc3Rlbih0YXJnZXQsIG5hbWUsIDxhbnk+Y2FsbGJhY2spO1xuICB9XG5cbiAgc2V0RWxlbWVudFByb3BlcnR5KFxuICAgICAgcmVuZGVyRWxlbWVudDogRWxlbWVudHxEb2N1bWVudEZyYWdtZW50LCBwcm9wZXJ0eU5hbWU6IHN0cmluZywgcHJvcGVydHlWYWx1ZTogYW55KTogdm9pZCB7XG4gICAgdGhpcy5kZWxlZ2F0ZS5zZXRQcm9wZXJ0eShyZW5kZXJFbGVtZW50LCBwcm9wZXJ0eU5hbWUsIHByb3BlcnR5VmFsdWUpO1xuICB9XG5cbiAgc2V0RWxlbWVudEF0dHJpYnV0ZShyZW5kZXJFbGVtZW50OiBFbGVtZW50LCBuYW1lc3BhY2VBbmROYW1lOiBzdHJpbmcsIGF0dHJpYnV0ZVZhbHVlOiBzdHJpbmcpOlxuICAgICAgdm9pZCB7XG4gICAgY29uc3QgW25zLCBuYW1lXSA9IHNwbGl0TmFtZXNwYWNlKG5hbWVzcGFjZUFuZE5hbWUpO1xuICAgIGlmIChhdHRyaWJ1dGVWYWx1ZSAhPSBudWxsKSB7XG4gICAgICB0aGlzLmRlbGVnYXRlLnNldEF0dHJpYnV0ZShyZW5kZXJFbGVtZW50LCBuYW1lLCBhdHRyaWJ1dGVWYWx1ZSwgbnMpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmRlbGVnYXRlLnJlbW92ZUF0dHJpYnV0ZShyZW5kZXJFbGVtZW50LCBuYW1lLCBucyk7XG4gICAgfVxuICB9XG5cbiAgc2V0QmluZGluZ0RlYnVnSW5mbyhyZW5kZXJFbGVtZW50OiBFbGVtZW50LCBwcm9wZXJ0eU5hbWU6IHN0cmluZywgcHJvcGVydHlWYWx1ZTogc3RyaW5nKTogdm9pZCB7fVxuXG4gIHNldEVsZW1lbnRDbGFzcyhyZW5kZXJFbGVtZW50OiBFbGVtZW50LCBjbGFzc05hbWU6IHN0cmluZywgaXNBZGQ6IGJvb2xlYW4pOiB2b2lkIHtcbiAgICBpZiAoaXNBZGQpIHtcbiAgICAgIHRoaXMuZGVsZWdhdGUuYWRkQ2xhc3MocmVuZGVyRWxlbWVudCwgY2xhc3NOYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5kZWxlZ2F0ZS5yZW1vdmVDbGFzcyhyZW5kZXJFbGVtZW50LCBjbGFzc05hbWUpO1xuICAgIH1cbiAgfVxuXG4gIHNldEVsZW1lbnRTdHlsZShyZW5kZXJFbGVtZW50OiBIVE1MRWxlbWVudCwgc3R5bGVOYW1lOiBzdHJpbmcsIHN0eWxlVmFsdWU6IHN0cmluZyk6IHZvaWQge1xuICAgIGlmIChzdHlsZVZhbHVlICE9IG51bGwpIHtcbiAgICAgIHRoaXMuZGVsZWdhdGUuc2V0U3R5bGUocmVuZGVyRWxlbWVudCwgc3R5bGVOYW1lLCBzdHlsZVZhbHVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5kZWxlZ2F0ZS5yZW1vdmVTdHlsZShyZW5kZXJFbGVtZW50LCBzdHlsZU5hbWUpO1xuICAgIH1cbiAgfVxuXG4gIGludm9rZUVsZW1lbnRNZXRob2QocmVuZGVyRWxlbWVudDogRWxlbWVudCwgbWV0aG9kTmFtZTogc3RyaW5nLCBhcmdzOiBhbnlbXSk6IHZvaWQge1xuICAgIChyZW5kZXJFbGVtZW50IGFzIGFueSlbbWV0aG9kTmFtZV0uYXBwbHkocmVuZGVyRWxlbWVudCwgYXJncyk7XG4gIH1cblxuICBzZXRUZXh0KHJlbmRlck5vZGU6IFRleHQsIHRleHQ6IHN0cmluZyk6IHZvaWQgeyB0aGlzLmRlbGVnYXRlLnNldFZhbHVlKHJlbmRlck5vZGUsIHRleHQpOyB9XG5cbiAgYW5pbWF0ZSgpOiBhbnkgeyB0aHJvdyBuZXcgRXJyb3IoJ1JlbmRlcmVyLmFuaW1hdGUgaXMgbm8gbG9uZ2VyIHN1cHBvcnRlZCEnKTsgfVxufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVOZ01vZHVsZVJlZihcbiAgICBtb2R1bGVUeXBlOiBUeXBlPGFueT4sIHBhcmVudDogSW5qZWN0b3IsIGJvb3RzdHJhcENvbXBvbmVudHM6IFR5cGU8YW55PltdLFxuICAgIGRlZjogTmdNb2R1bGVEZWZpbml0aW9uKTogTmdNb2R1bGVSZWY8YW55PiB7XG4gIHJldHVybiBuZXcgTmdNb2R1bGVSZWZfKG1vZHVsZVR5cGUsIHBhcmVudCwgYm9vdHN0cmFwQ29tcG9uZW50cywgZGVmKTtcbn1cblxuY2xhc3MgTmdNb2R1bGVSZWZfIGltcGxlbWVudHMgTmdNb2R1bGVEYXRhLCBJbnRlcm5hbE5nTW9kdWxlUmVmPGFueT4ge1xuICBwcml2YXRlIF9kZXN0cm95TGlzdGVuZXJzOiAoKCkgPT4gdm9pZClbXSA9IFtdO1xuICBwcml2YXRlIF9kZXN0cm95ZWQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgLyoqIEBpbnRlcm5hbCAqL1xuICAvLyBUT0RPKGlzc3VlLzI0NTcxKTogcmVtb3ZlICchJy5cbiAgX3Byb3ZpZGVycyAhOiBhbnlbXTtcbiAgLyoqIEBpbnRlcm5hbCAqL1xuICAvLyBUT0RPKGlzc3VlLzI0NTcxKTogcmVtb3ZlICchJy5cbiAgX21vZHVsZXMgITogYW55W107XG5cbiAgcmVhZG9ubHkgaW5qZWN0b3I6IEluamVjdG9yID0gdGhpcztcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgX21vZHVsZVR5cGU6IFR5cGU8YW55PiwgcHVibGljIF9wYXJlbnQ6IEluamVjdG9yLFxuICAgICAgcHVibGljIF9ib290c3RyYXBDb21wb25lbnRzOiBUeXBlPGFueT5bXSwgcHVibGljIF9kZWY6IE5nTW9kdWxlRGVmaW5pdGlvbikge1xuICAgIGluaXROZ01vZHVsZSh0aGlzKTtcbiAgfVxuXG4gIGdldCh0b2tlbjogYW55LCBub3RGb3VuZFZhbHVlOiBhbnkgPSBJbmplY3Rvci5USFJPV19JRl9OT1RfRk9VTkQsXG4gICAgICBpbmplY3RGbGFnczogSW5qZWN0RmxhZ3MgPSBJbmplY3RGbGFncy5EZWZhdWx0KTogYW55IHtcbiAgICBsZXQgZmxhZ3MgPSBEZXBGbGFncy5Ob25lO1xuICAgIGlmIChpbmplY3RGbGFncyAmIEluamVjdEZsYWdzLlNraXBTZWxmKSB7XG4gICAgICBmbGFncyB8PSBEZXBGbGFncy5Ta2lwU2VsZjtcbiAgICB9IGVsc2UgaWYgKGluamVjdEZsYWdzICYgSW5qZWN0RmxhZ3MuU2VsZikge1xuICAgICAgZmxhZ3MgfD0gRGVwRmxhZ3MuU2VsZjtcbiAgICB9XG4gICAgcmV0dXJuIHJlc29sdmVOZ01vZHVsZURlcChcbiAgICAgICAgdGhpcywge3Rva2VuOiB0b2tlbiwgdG9rZW5LZXk6IHRva2VuS2V5KHRva2VuKSwgZmxhZ3M6IGZsYWdzfSwgbm90Rm91bmRWYWx1ZSk7XG4gIH1cblxuICBnZXQgaW5zdGFuY2UoKSB7IHJldHVybiB0aGlzLmdldCh0aGlzLl9tb2R1bGVUeXBlKTsgfVxuXG4gIGdldCBjb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIoKSB7IHJldHVybiB0aGlzLmdldChDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIpOyB9XG5cbiAgZGVzdHJveSgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fZGVzdHJveWVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYFRoZSBuZyBtb2R1bGUgJHtzdHJpbmdpZnkodGhpcy5pbnN0YW5jZS5jb25zdHJ1Y3Rvcil9IGhhcyBhbHJlYWR5IGJlZW4gZGVzdHJveWVkLmApO1xuICAgIH1cbiAgICB0aGlzLl9kZXN0cm95ZWQgPSB0cnVlO1xuICAgIGNhbGxOZ01vZHVsZUxpZmVjeWNsZSh0aGlzLCBOb2RlRmxhZ3MuT25EZXN0cm95KTtcbiAgICB0aGlzLl9kZXN0cm95TGlzdGVuZXJzLmZvckVhY2goKGxpc3RlbmVyKSA9PiBsaXN0ZW5lcigpKTtcbiAgfVxuXG4gIG9uRGVzdHJveShjYWxsYmFjazogKCkgPT4gdm9pZCk6IHZvaWQgeyB0aGlzLl9kZXN0cm95TGlzdGVuZXJzLnB1c2goY2FsbGJhY2spOyB9XG59XG4iXX0=