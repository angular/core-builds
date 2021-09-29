/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injector } from '../di/injector';
import { InjectFlags } from '../di/interface/injector';
import { ComponentFactory, ComponentRef } from '../linker/component_factory';
import { ComponentFactoryBoundToModule, ComponentFactoryResolver } from '../linker/component_factory_resolver';
import { ElementRef } from '../linker/element_ref';
import { NgModuleRef } from '../linker/ng_module_factory';
import { TemplateRef } from '../linker/template_ref';
import { assertEqual } from '../util/assert';
import { stringify } from '../util/stringify';
import { VERSION } from '../version';
import { callNgModuleLifecycle, initNgModule, resolveNgModuleDep } from './ng_module';
import { asElementData, asProviderData, asTextData, Services } from './types';
import { markParentViewsForCheck, resolveDefinition, rootRenderNodes, tokenKey, viewParentEl } from './util';
import { attachEmbeddedView, detachEmbeddedView, moveEmbeddedView, renderDetachView } from './view_attach';
const EMPTY_CONTEXT = {};
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
    get injector() {
        return new Injector_(this._view, this._elDef);
    }
    get componentType() {
        return this._component.constructor;
    }
    destroy() {
        this._viewRef.destroy();
    }
    onDestroy(callback) {
        this._viewRef.onDestroy(callback);
    }
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
    get element() {
        return new ElementRef(this._data.renderElement);
    }
    get injector() {
        return new Injector_(this._view, this._elDef);
    }
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
    get length() {
        return this._embeddedViews.length;
    }
    createEmbeddedView(templateRef, context, index) {
        const viewRef = templateRef.createEmbeddedView(context || {});
        this.insert(viewRef, index);
        return viewRef;
    }
    createComponent(componentFactoryOrType, indexOrOptions, injector, projectableNodes, ngModuleRef) {
        if (typeof ngDevMode === 'undefined' || ngDevMode) {
            assertEqual(typeof componentFactoryOrType !== 'function', true, 'ViewEngine does not support Type as an argument for \'componentFactoryOrType\'');
            assertEqual(typeof indexOrOptions !== 'object', true, 'ViewEngine does not support options as an object provided via second argument');
        }
        const index = indexOrOptions;
        const contextInjector = injector || this.parentInjector;
        const componentFactory = componentFactoryOrType;
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
    get rootNodes() {
        return rootRenderNodes(this._view);
    }
    get context() {
        return this._view.context;
    }
    set context(value) {
        this._view.context = value;
    }
    get destroyed() {
        return (this._view.state & 128 /* Destroyed */) !== 0;
    }
    markForCheck() {
        markParentViewsForCheck(this._view);
    }
    detach() {
        this._view.state &= ~4 /* Attached */;
    }
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
    checkNoChanges() {
        Services.checkNoChangesView(this._view);
    }
    reattach() {
        this._view.state |= 4 /* Attached */;
    }
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
    get(token, notFoundValue = Injector.THROW_IF_NOT_FOUND, injectFlags = InjectFlags.Default) {
        let flags = 0 /* None */;
        if (injectFlags & InjectFlags.SkipSelf) {
            flags |= 1 /* SkipSelf */;
        }
        else if (injectFlags & InjectFlags.Self) {
            flags |= 4 /* Self */;
        }
        return resolveNgModuleDep(this, { token: token, tokenKey: tokenKey(token), flags: flags }, notFoundValue);
    }
    get instance() {
        return this.get(this._moduleType);
    }
    get componentFactoryResolver() {
        return this.get(ComponentFactoryResolver);
    }
    destroy() {
        if (this._destroyed) {
            throw new Error(`The ng module ${stringify(this.instance.constructor)} has already been destroyed.`);
        }
        this._destroyed = true;
        callNgModuleLifecycle(this, 131072 /* OnDestroy */);
        this._destroyListeners.forEach((listener) => listener());
    }
    onDestroy(callback) {
        this._destroyListeners.push(callback);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVmcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3ZpZXcvcmVmcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFHSCxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDeEMsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBRXJELE9BQU8sRUFBQyxnQkFBZ0IsRUFBRSxZQUFZLEVBQUMsTUFBTSw2QkFBNkIsQ0FBQztBQUMzRSxPQUFPLEVBQUMsNkJBQTZCLEVBQUUsd0JBQXdCLEVBQUMsTUFBTSxzQ0FBc0MsQ0FBQztBQUM3RyxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDakQsT0FBTyxFQUFzQixXQUFXLEVBQUMsTUFBTSw2QkFBNkIsQ0FBQztBQUM3RSxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFHbkQsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQzNDLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUM1QyxPQUFPLEVBQUMsT0FBTyxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBRW5DLE9BQU8sRUFBQyxxQkFBcUIsRUFBRSxZQUFZLEVBQUUsa0JBQWtCLEVBQUMsTUFBTSxhQUFhLENBQUM7QUFDcEYsT0FBTyxFQUFDLGFBQWEsRUFBRSxjQUFjLEVBQUUsVUFBVSxFQUErRSxRQUFRLEVBQThFLE1BQU0sU0FBUyxDQUFDO0FBQ3RPLE9BQU8sRUFBQyx1QkFBdUIsRUFBRSxpQkFBaUIsRUFBRSxlQUFlLEVBQUUsUUFBUSxFQUFFLFlBQVksRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUMzRyxPQUFPLEVBQUMsa0JBQWtCLEVBQUUsa0JBQWtCLEVBQUUsZ0JBQWdCLEVBQUUsZ0JBQWdCLEVBQUMsTUFBTSxlQUFl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QyxDQUFDO0lBQ3BDLENBQUM7SUFFRCxJQUFJLHdCQUF3QjtRQUMxQixPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsd0JBQXdCLENBQUMsQ0FBQztJQUM1QyxDQUFDO0lBRUQsT0FBTztRQUNMLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUNuQixNQUFNLElBQUksS0FBSyxDQUNYLGlCQUFpQixTQUFTLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsOEJBQThCLENBQUMsQ0FBQztTQUMxRjtRQUNELElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO1FBQ3ZCLHFCQUFxQixDQUFDLElBQUkseUJBQXNCLENBQUM7UUFDakQsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztJQUMzRCxDQUFDO0lBRUQsU0FBUyxDQUFDLFFBQW9CO1FBQzVCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDeEMsQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Q2hhbmdlRGV0ZWN0b3JSZWZ9IGZyb20gJy4uL2NoYW5nZV9kZXRlY3Rpb24vY2hhbmdlX2RldGVjdGlvbic7XG5pbXBvcnQge0luamVjdG9yfSBmcm9tICcuLi9kaS9pbmplY3Rvcic7XG5pbXBvcnQge0luamVjdEZsYWdzfSBmcm9tICcuLi9kaS9pbnRlcmZhY2UvaW5qZWN0b3InO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnksIENvbXBvbmVudFJlZn0gZnJvbSAnLi4vbGlua2VyL2NvbXBvbmVudF9mYWN0b3J5JztcbmltcG9ydCB7Q29tcG9uZW50RmFjdG9yeUJvdW5kVG9Nb2R1bGUsIENvbXBvbmVudEZhY3RvcnlSZXNvbHZlcn0gZnJvbSAnLi4vbGlua2VyL2NvbXBvbmVudF9mYWN0b3J5X3Jlc29sdmVyJztcbmltcG9ydCB7RWxlbWVudFJlZn0gZnJvbSAnLi4vbGlua2VyL2VsZW1lbnRfcmVmJztcbmltcG9ydCB7SW50ZXJuYWxOZ01vZHVsZVJlZiwgTmdNb2R1bGVSZWZ9IGZyb20gJy4uL2xpbmtlci9uZ19tb2R1bGVfZmFjdG9yeSc7XG5pbXBvcnQge1RlbXBsYXRlUmVmfSBmcm9tICcuLi9saW5rZXIvdGVtcGxhdGVfcmVmJztcbmltcG9ydCB7Vmlld0NvbnRhaW5lclJlZn0gZnJvbSAnLi4vbGlua2VyL3ZpZXdfY29udGFpbmVyX3JlZic7XG5pbXBvcnQge0VtYmVkZGVkVmlld1JlZiwgSW50ZXJuYWxWaWV3UmVmLCBWaWV3UmVmLCBWaWV3UmVmVHJhY2tlcn0gZnJvbSAnLi4vbGlua2VyL3ZpZXdfcmVmJztcbmltcG9ydCB7YXNzZXJ0RXF1YWx9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7c3RyaW5naWZ5fSBmcm9tICcuLi91dGlsL3N0cmluZ2lmeSc7XG5pbXBvcnQge1ZFUlNJT059IGZyb20gJy4uL3ZlcnNpb24nO1xuXG5pbXBvcnQge2NhbGxOZ01vZHVsZUxpZmVjeWNsZSwgaW5pdE5nTW9kdWxlLCByZXNvbHZlTmdNb2R1bGVEZXB9IGZyb20gJy4vbmdfbW9kdWxlJztcbmltcG9ydCB7YXNFbGVtZW50RGF0YSwgYXNQcm92aWRlckRhdGEsIGFzVGV4dERhdGEsIERlcEZsYWdzLCBFbGVtZW50RGF0YSwgTmdNb2R1bGVEYXRhLCBOZ01vZHVsZURlZmluaXRpb24sIE5vZGVEZWYsIE5vZGVGbGFncywgU2VydmljZXMsIFRlbXBsYXRlRGF0YSwgVmlld0NvbnRhaW5lckRhdGEsIFZpZXdEYXRhLCBWaWV3RGVmaW5pdGlvbkZhY3RvcnksIFZpZXdTdGF0ZX0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQge21hcmtQYXJlbnRWaWV3c0ZvckNoZWNrLCByZXNvbHZlRGVmaW5pdGlvbiwgcm9vdFJlbmRlck5vZGVzLCB0b2tlbktleSwgdmlld1BhcmVudEVsfSBmcm9tICcuL3V0aWwnO1xuaW1wb3J0IHthdHRhY2hFbWJlZGRlZFZpZXcsIGRldGFjaEVtYmVkZGVkVmlldywgbW92ZUVtYmVkZGVkVmlldywgcmVuZGVyRGV0YWNoVmlld30gZnJvbSAnLi92aWV3X2F0dGFjaCc7XG5cbmNvbnN0IEVNUFRZX0NPTlRFWFQgPSB7fTtcblxuLy8gQXR0ZW50aW9uOiB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBhcyB0b3AgbGV2ZWwgZnVuY3Rpb24uXG4vLyBQdXR0aW5nIGFueSBsb2dpYyBpbiBoZXJlIHdpbGwgZGVzdHJveSBjbG9zdXJlIHRyZWUgc2hha2luZyFcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVDb21wb25lbnRGYWN0b3J5KFxuICAgIHNlbGVjdG9yOiBzdHJpbmcsIGNvbXBvbmVudFR5cGU6IFR5cGU8YW55Piwgdmlld0RlZkZhY3Rvcnk6IFZpZXdEZWZpbml0aW9uRmFjdG9yeSxcbiAgICBpbnB1dHM6IHtbcHJvcE5hbWU6IHN0cmluZ106IHN0cmluZ318bnVsbCwgb3V0cHV0czoge1twcm9wTmFtZTogc3RyaW5nXTogc3RyaW5nfSxcbiAgICBuZ0NvbnRlbnRTZWxlY3RvcnM6IHN0cmluZ1tdKTogQ29tcG9uZW50RmFjdG9yeTxhbnk+IHtcbiAgcmV0dXJuIG5ldyBDb21wb25lbnRGYWN0b3J5XyhcbiAgICAgIHNlbGVjdG9yLCBjb21wb25lbnRUeXBlLCB2aWV3RGVmRmFjdG9yeSwgaW5wdXRzLCBvdXRwdXRzLCBuZ0NvbnRlbnRTZWxlY3RvcnMpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29tcG9uZW50Vmlld0RlZmluaXRpb25GYWN0b3J5KGNvbXBvbmVudEZhY3Rvcnk6IENvbXBvbmVudEZhY3Rvcnk8YW55Pik6XG4gICAgVmlld0RlZmluaXRpb25GYWN0b3J5IHtcbiAgcmV0dXJuIChjb21wb25lbnRGYWN0b3J5IGFzIENvbXBvbmVudEZhY3RvcnlfKS52aWV3RGVmRmFjdG9yeTtcbn1cblxuY2xhc3MgQ29tcG9uZW50RmFjdG9yeV8gZXh0ZW5kcyBDb21wb25lbnRGYWN0b3J5PGFueT4ge1xuICAvKipcbiAgICogQGludGVybmFsXG4gICAqL1xuICB2aWV3RGVmRmFjdG9yeTogVmlld0RlZmluaXRpb25GYWN0b3J5O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHVibGljIHNlbGVjdG9yOiBzdHJpbmcsIHB1YmxpYyBjb21wb25lbnRUeXBlOiBUeXBlPGFueT4sXG4gICAgICB2aWV3RGVmRmFjdG9yeTogVmlld0RlZmluaXRpb25GYWN0b3J5LCBwcml2YXRlIF9pbnB1dHM6IHtbcHJvcE5hbWU6IHN0cmluZ106IHN0cmluZ318bnVsbCxcbiAgICAgIHByaXZhdGUgX291dHB1dHM6IHtbcHJvcE5hbWU6IHN0cmluZ106IHN0cmluZ30sIHB1YmxpYyBuZ0NvbnRlbnRTZWxlY3RvcnM6IHN0cmluZ1tdKSB7XG4gICAgLy8gQXR0ZW50aW9uOiB0aGlzIGN0b3IgaXMgY2FsbGVkIGFzIHRvcCBsZXZlbCBmdW5jdGlvbi5cbiAgICAvLyBQdXR0aW5nIGFueSBsb2dpYyBpbiBoZXJlIHdpbGwgZGVzdHJveSBjbG9zdXJlIHRyZWUgc2hha2luZyFcbiAgICBzdXBlcigpO1xuICAgIHRoaXMudmlld0RlZkZhY3RvcnkgPSB2aWV3RGVmRmFjdG9yeTtcbiAgfVxuXG4gIG92ZXJyaWRlIGdldCBpbnB1dHMoKSB7XG4gICAgY29uc3QgaW5wdXRzQXJyOiB7cHJvcE5hbWU6IHN0cmluZywgdGVtcGxhdGVOYW1lOiBzdHJpbmd9W10gPSBbXTtcbiAgICBjb25zdCBpbnB1dHMgPSB0aGlzLl9pbnB1dHMhO1xuICAgIGZvciAobGV0IHByb3BOYW1lIGluIGlucHV0cykge1xuICAgICAgY29uc3QgdGVtcGxhdGVOYW1lID0gaW5wdXRzW3Byb3BOYW1lXTtcbiAgICAgIGlucHV0c0Fyci5wdXNoKHtwcm9wTmFtZSwgdGVtcGxhdGVOYW1lfSk7XG4gICAgfVxuICAgIHJldHVybiBpbnB1dHNBcnI7XG4gIH1cblxuICBvdmVycmlkZSBnZXQgb3V0cHV0cygpIHtcbiAgICBjb25zdCBvdXRwdXRzQXJyOiB7cHJvcE5hbWU6IHN0cmluZywgdGVtcGxhdGVOYW1lOiBzdHJpbmd9W10gPSBbXTtcbiAgICBmb3IgKGxldCBwcm9wTmFtZSBpbiB0aGlzLl9vdXRwdXRzKSB7XG4gICAgICBjb25zdCB0ZW1wbGF0ZU5hbWUgPSB0aGlzLl9vdXRwdXRzW3Byb3BOYW1lXTtcbiAgICAgIG91dHB1dHNBcnIucHVzaCh7cHJvcE5hbWUsIHRlbXBsYXRlTmFtZX0pO1xuICAgIH1cbiAgICByZXR1cm4gb3V0cHV0c0FycjtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IGNvbXBvbmVudC5cbiAgICovXG4gIG92ZXJyaWRlIGNyZWF0ZShcbiAgICAgIGluamVjdG9yOiBJbmplY3RvciwgcHJvamVjdGFibGVOb2Rlcz86IGFueVtdW10sIHJvb3RTZWxlY3Rvck9yTm9kZT86IHN0cmluZ3xhbnksXG4gICAgICBuZ01vZHVsZT86IE5nTW9kdWxlUmVmPGFueT4pOiBDb21wb25lbnRSZWY8YW55PiB7XG4gICAgaWYgKCFuZ01vZHVsZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCduZ01vZHVsZSBzaG91bGQgYmUgcHJvdmlkZWQnKTtcbiAgICB9XG4gICAgY29uc3Qgdmlld0RlZiA9IHJlc29sdmVEZWZpbml0aW9uKHRoaXMudmlld0RlZkZhY3RvcnkpO1xuICAgIGNvbnN0IGNvbXBvbmVudE5vZGVJbmRleCA9IHZpZXdEZWYubm9kZXNbMF0uZWxlbWVudCEuY29tcG9uZW50UHJvdmlkZXIhLm5vZGVJbmRleDtcbiAgICBjb25zdCB2aWV3ID0gU2VydmljZXMuY3JlYXRlUm9vdFZpZXcoXG4gICAgICAgIGluamVjdG9yLCBwcm9qZWN0YWJsZU5vZGVzIHx8IFtdLCByb290U2VsZWN0b3JPck5vZGUsIHZpZXdEZWYsIG5nTW9kdWxlLCBFTVBUWV9DT05URVhUKTtcbiAgICBjb25zdCBjb21wb25lbnQgPSBhc1Byb3ZpZGVyRGF0YSh2aWV3LCBjb21wb25lbnROb2RlSW5kZXgpLmluc3RhbmNlO1xuICAgIGlmIChyb290U2VsZWN0b3JPck5vZGUpIHtcbiAgICAgIHZpZXcucmVuZGVyZXIuc2V0QXR0cmlidXRlKGFzRWxlbWVudERhdGEodmlldywgMCkucmVuZGVyRWxlbWVudCwgJ25nLXZlcnNpb24nLCBWRVJTSU9OLmZ1bGwpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgQ29tcG9uZW50UmVmXyh2aWV3LCBuZXcgVmlld1JlZl8odmlldyksIGNvbXBvbmVudCk7XG4gIH1cbn1cblxuY2xhc3MgQ29tcG9uZW50UmVmXyBleHRlbmRzIENvbXBvbmVudFJlZjxhbnk+IHtcbiAgcHVibGljIG92ZXJyaWRlIHJlYWRvbmx5IGhvc3RWaWV3OiBWaWV3UmVmO1xuICBwdWJsaWMgb3ZlcnJpZGUgcmVhZG9ubHkgaW5zdGFuY2U6IGFueTtcbiAgcHVibGljIG92ZXJyaWRlIHJlYWRvbmx5IGNoYW5nZURldGVjdG9yUmVmOiBDaGFuZ2VEZXRlY3RvclJlZjtcbiAgcHJpdmF0ZSBfZWxEZWY6IE5vZGVEZWY7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX3ZpZXc6IFZpZXdEYXRhLCBwcml2YXRlIF92aWV3UmVmOiBWaWV3UmVmLCBwcml2YXRlIF9jb21wb25lbnQ6IGFueSkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5fZWxEZWYgPSB0aGlzLl92aWV3LmRlZi5ub2Rlc1swXTtcbiAgICB0aGlzLmhvc3RWaWV3ID0gX3ZpZXdSZWY7XG4gICAgdGhpcy5jaGFuZ2VEZXRlY3RvclJlZiA9IF92aWV3UmVmO1xuICAgIHRoaXMuaW5zdGFuY2UgPSBfY29tcG9uZW50O1xuICB9XG4gIG92ZXJyaWRlIGdldCBsb2NhdGlvbigpOiBFbGVtZW50UmVmIHtcbiAgICByZXR1cm4gbmV3IEVsZW1lbnRSZWYoYXNFbGVtZW50RGF0YSh0aGlzLl92aWV3LCB0aGlzLl9lbERlZi5ub2RlSW5kZXgpLnJlbmRlckVsZW1lbnQpO1xuICB9XG4gIG92ZXJyaWRlIGdldCBpbmplY3RvcigpOiBJbmplY3RvciB7XG4gICAgcmV0dXJuIG5ldyBJbmplY3Rvcl8odGhpcy5fdmlldywgdGhpcy5fZWxEZWYpO1xuICB9XG4gIG92ZXJyaWRlIGdldCBjb21wb25lbnRUeXBlKCk6IFR5cGU8YW55PiB7XG4gICAgcmV0dXJuIDxhbnk+dGhpcy5fY29tcG9uZW50LmNvbnN0cnVjdG9yO1xuICB9XG5cbiAgb3ZlcnJpZGUgZGVzdHJveSgpOiB2b2lkIHtcbiAgICB0aGlzLl92aWV3UmVmLmRlc3Ryb3koKTtcbiAgfVxuICBvdmVycmlkZSBvbkRlc3Ryb3koY2FsbGJhY2s6IEZ1bmN0aW9uKTogdm9pZCB7XG4gICAgdGhpcy5fdmlld1JlZi5vbkRlc3Ryb3koY2FsbGJhY2spO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVWaWV3Q29udGFpbmVyRGF0YShcbiAgICB2aWV3OiBWaWV3RGF0YSwgZWxEZWY6IE5vZGVEZWYsIGVsRGF0YTogRWxlbWVudERhdGEpOiBWaWV3Q29udGFpbmVyRGF0YSB7XG4gIHJldHVybiBuZXcgVmlld0NvbnRhaW5lclJlZl8odmlldywgZWxEZWYsIGVsRGF0YSk7XG59XG5cbmNsYXNzIFZpZXdDb250YWluZXJSZWZfIGltcGxlbWVudHMgVmlld0NvbnRhaW5lckRhdGEge1xuICAvKipcbiAgICogQGludGVybmFsXG4gICAqL1xuICBfZW1iZWRkZWRWaWV3czogVmlld0RhdGFbXSA9IFtdO1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF92aWV3OiBWaWV3RGF0YSwgcHJpdmF0ZSBfZWxEZWY6IE5vZGVEZWYsIHByaXZhdGUgX2RhdGE6IEVsZW1lbnREYXRhKSB7fVxuXG4gIGdldCBlbGVtZW50KCk6IEVsZW1lbnRSZWYge1xuICAgIHJldHVybiBuZXcgRWxlbWVudFJlZih0aGlzLl9kYXRhLnJlbmRlckVsZW1lbnQpO1xuICB9XG5cbiAgZ2V0IGluamVjdG9yKCk6IEluamVjdG9yIHtcbiAgICByZXR1cm4gbmV3IEluamVjdG9yXyh0aGlzLl92aWV3LCB0aGlzLl9lbERlZik7XG4gIH1cblxuICAvKiogQGRlcHJlY2F0ZWQgTm8gcmVwbGFjZW1lbnQgKi9cbiAgZ2V0IHBhcmVudEluamVjdG9yKCk6IEluamVjdG9yIHtcbiAgICBsZXQgdmlldyA9IHRoaXMuX3ZpZXc7XG4gICAgbGV0IGVsRGVmID0gdGhpcy5fZWxEZWYucGFyZW50O1xuICAgIHdoaWxlICghZWxEZWYgJiYgdmlldykge1xuICAgICAgZWxEZWYgPSB2aWV3UGFyZW50RWwodmlldyk7XG4gICAgICB2aWV3ID0gdmlldy5wYXJlbnQhO1xuICAgIH1cblxuICAgIHJldHVybiB2aWV3ID8gbmV3IEluamVjdG9yXyh2aWV3LCBlbERlZikgOiBuZXcgSW5qZWN0b3JfKHRoaXMuX3ZpZXcsIG51bGwpO1xuICB9XG5cbiAgY2xlYXIoKTogdm9pZCB7XG4gICAgY29uc3QgbGVuID0gdGhpcy5fZW1iZWRkZWRWaWV3cy5sZW5ndGg7XG4gICAgZm9yIChsZXQgaSA9IGxlbiAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICBjb25zdCB2aWV3ID0gZGV0YWNoRW1iZWRkZWRWaWV3KHRoaXMuX2RhdGEsIGkpITtcbiAgICAgIFNlcnZpY2VzLmRlc3Ryb3lWaWV3KHZpZXcpO1xuICAgIH1cbiAgfVxuXG4gIGdldChpbmRleDogbnVtYmVyKTogVmlld1JlZnxudWxsIHtcbiAgICBjb25zdCB2aWV3ID0gdGhpcy5fZW1iZWRkZWRWaWV3c1tpbmRleF07XG4gICAgaWYgKHZpZXcpIHtcbiAgICAgIGNvbnN0IHJlZiA9IG5ldyBWaWV3UmVmXyh2aWV3KTtcbiAgICAgIHJlZi5hdHRhY2hUb1ZpZXdDb250YWluZXJSZWYodGhpcyk7XG4gICAgICByZXR1cm4gcmVmO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGdldCBsZW5ndGgoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fZW1iZWRkZWRWaWV3cy5sZW5ndGg7XG4gIH1cblxuICBjcmVhdGVFbWJlZGRlZFZpZXc8Qz4odGVtcGxhdGVSZWY6IFRlbXBsYXRlUmVmPEM+LCBjb250ZXh0PzogQywgaW5kZXg/OiBudW1iZXIpOlxuICAgICAgRW1iZWRkZWRWaWV3UmVmPEM+IHtcbiAgICBjb25zdCB2aWV3UmVmID0gdGVtcGxhdGVSZWYuY3JlYXRlRW1iZWRkZWRWaWV3KGNvbnRleHQgfHwgPGFueT57fSk7XG4gICAgdGhpcy5pbnNlcnQodmlld1JlZiwgaW5kZXgpO1xuICAgIHJldHVybiB2aWV3UmVmO1xuICB9XG5cbiAgY3JlYXRlQ29tcG9uZW50PEM+KFxuICAgICAgY29tcG9uZW50RmFjdG9yeU9yVHlwZTogQ29tcG9uZW50RmFjdG9yeTxDPnxUeXBlPEM+LCBpbmRleE9yT3B0aW9ucz86IG51bWJlcnx7fSxcbiAgICAgIGluamVjdG9yPzogSW5qZWN0b3IsIHByb2plY3RhYmxlTm9kZXM/OiBhbnlbXVtdLFxuICAgICAgbmdNb2R1bGVSZWY/OiBOZ01vZHVsZVJlZjxhbnk+KTogQ29tcG9uZW50UmVmPEM+IHtcbiAgICBpZiAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSB7XG4gICAgICBhc3NlcnRFcXVhbChcbiAgICAgICAgICB0eXBlb2YgY29tcG9uZW50RmFjdG9yeU9yVHlwZSAhPT0gJ2Z1bmN0aW9uJywgdHJ1ZSxcbiAgICAgICAgICAnVmlld0VuZ2luZSBkb2VzIG5vdCBzdXBwb3J0IFR5cGUgYXMgYW4gYXJndW1lbnQgZm9yIFxcJ2NvbXBvbmVudEZhY3RvcnlPclR5cGVcXCcnKTtcbiAgICAgIGFzc2VydEVxdWFsKFxuICAgICAgICAgIHR5cGVvZiBpbmRleE9yT3B0aW9ucyAhPT0gJ29iamVjdCcsIHRydWUsXG4gICAgICAgICAgJ1ZpZXdFbmdpbmUgZG9lcyBub3Qgc3VwcG9ydCBvcHRpb25zIGFzIGFuIG9iamVjdCBwcm92aWRlZCB2aWEgc2Vjb25kIGFyZ3VtZW50Jyk7XG4gICAgfVxuICAgIGNvbnN0IGluZGV4ID0gaW5kZXhPck9wdGlvbnMgYXMgbnVtYmVyIHwgdW5kZWZpbmVkO1xuICAgIGNvbnN0IGNvbnRleHRJbmplY3RvciA9IGluamVjdG9yIHx8IHRoaXMucGFyZW50SW5qZWN0b3I7XG4gICAgY29uc3QgY29tcG9uZW50RmFjdG9yeSA9IGNvbXBvbmVudEZhY3RvcnlPclR5cGUgYXMgQ29tcG9uZW50RmFjdG9yeTxDPjtcbiAgICBpZiAoIW5nTW9kdWxlUmVmICYmICEoY29tcG9uZW50RmFjdG9yeSBpbnN0YW5jZW9mIENvbXBvbmVudEZhY3RvcnlCb3VuZFRvTW9kdWxlKSkge1xuICAgICAgbmdNb2R1bGVSZWYgPSBjb250ZXh0SW5qZWN0b3IuZ2V0KE5nTW9kdWxlUmVmKTtcbiAgICB9XG4gICAgY29uc3QgY29tcG9uZW50UmVmID1cbiAgICAgICAgY29tcG9uZW50RmFjdG9yeS5jcmVhdGUoY29udGV4dEluamVjdG9yLCBwcm9qZWN0YWJsZU5vZGVzLCB1bmRlZmluZWQsIG5nTW9kdWxlUmVmKTtcbiAgICB0aGlzLmluc2VydChjb21wb25lbnRSZWYuaG9zdFZpZXcsIGluZGV4KTtcbiAgICByZXR1cm4gY29tcG9uZW50UmVmO1xuICB9XG5cbiAgaW5zZXJ0KHZpZXdSZWY6IFZpZXdSZWYsIGluZGV4PzogbnVtYmVyKTogVmlld1JlZiB7XG4gICAgaWYgKHZpZXdSZWYuZGVzdHJveWVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBpbnNlcnQgYSBkZXN0cm95ZWQgVmlldyBpbiBhIFZpZXdDb250YWluZXIhJyk7XG4gICAgfVxuICAgIGNvbnN0IHZpZXdSZWZfID0gPFZpZXdSZWZfPnZpZXdSZWY7XG4gICAgY29uc3Qgdmlld0RhdGEgPSB2aWV3UmVmXy5fdmlldztcbiAgICBhdHRhY2hFbWJlZGRlZFZpZXcodGhpcy5fdmlldywgdGhpcy5fZGF0YSwgaW5kZXgsIHZpZXdEYXRhKTtcbiAgICB2aWV3UmVmXy5hdHRhY2hUb1ZpZXdDb250YWluZXJSZWYodGhpcyk7XG4gICAgcmV0dXJuIHZpZXdSZWY7XG4gIH1cblxuICBtb3ZlKHZpZXdSZWY6IFZpZXdSZWZfLCBjdXJyZW50SW5kZXg6IG51bWJlcik6IFZpZXdSZWYge1xuICAgIGlmICh2aWV3UmVmLmRlc3Ryb3llZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgbW92ZSBhIGRlc3Ryb3llZCBWaWV3IGluIGEgVmlld0NvbnRhaW5lciEnKTtcbiAgICB9XG4gICAgY29uc3QgcHJldmlvdXNJbmRleCA9IHRoaXMuX2VtYmVkZGVkVmlld3MuaW5kZXhPZih2aWV3UmVmLl92aWV3KTtcbiAgICBtb3ZlRW1iZWRkZWRWaWV3KHRoaXMuX2RhdGEsIHByZXZpb3VzSW5kZXgsIGN1cnJlbnRJbmRleCk7XG4gICAgcmV0dXJuIHZpZXdSZWY7XG4gIH1cblxuICBpbmRleE9mKHZpZXdSZWY6IFZpZXdSZWYpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl9lbWJlZGRlZFZpZXdzLmluZGV4T2YoKDxWaWV3UmVmXz52aWV3UmVmKS5fdmlldyk7XG4gIH1cblxuICByZW1vdmUoaW5kZXg/OiBudW1iZXIpOiB2b2lkIHtcbiAgICBjb25zdCB2aWV3RGF0YSA9IGRldGFjaEVtYmVkZGVkVmlldyh0aGlzLl9kYXRhLCBpbmRleCk7XG4gICAgaWYgKHZpZXdEYXRhKSB7XG4gICAgICBTZXJ2aWNlcy5kZXN0cm95Vmlldyh2aWV3RGF0YSk7XG4gICAgfVxuICB9XG5cbiAgZGV0YWNoKGluZGV4PzogbnVtYmVyKTogVmlld1JlZnxudWxsIHtcbiAgICBjb25zdCB2aWV3ID0gZGV0YWNoRW1iZWRkZWRWaWV3KHRoaXMuX2RhdGEsIGluZGV4KTtcbiAgICByZXR1cm4gdmlldyA/IG5ldyBWaWV3UmVmXyh2aWV3KSA6IG51bGw7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUNoYW5nZURldGVjdG9yUmVmKHZpZXc6IFZpZXdEYXRhKTogQ2hhbmdlRGV0ZWN0b3JSZWYge1xuICByZXR1cm4gbmV3IFZpZXdSZWZfKHZpZXcpO1xufVxuXG5leHBvcnQgY2xhc3MgVmlld1JlZl8gaW1wbGVtZW50cyBFbWJlZGRlZFZpZXdSZWY8YW55PiwgSW50ZXJuYWxWaWV3UmVmIHtcbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfdmlldzogVmlld0RhdGE7XG4gIHByaXZhdGUgX3ZpZXdDb250YWluZXJSZWY6IFZpZXdDb250YWluZXJSZWZ8bnVsbDtcbiAgcHJpdmF0ZSBfYXBwUmVmOiBWaWV3UmVmVHJhY2tlcnxudWxsO1xuXG4gIGNvbnN0cnVjdG9yKF92aWV3OiBWaWV3RGF0YSkge1xuICAgIHRoaXMuX3ZpZXcgPSBfdmlldztcbiAgICB0aGlzLl92aWV3Q29udGFpbmVyUmVmID0gbnVsbDtcbiAgICB0aGlzLl9hcHBSZWYgPSBudWxsO1xuICB9XG5cbiAgZ2V0IHJvb3ROb2RlcygpOiBhbnlbXSB7XG4gICAgcmV0dXJuIHJvb3RSZW5kZXJOb2Rlcyh0aGlzLl92aWV3KTtcbiAgfVxuXG4gIGdldCBjb250ZXh0KCkge1xuICAgIHJldHVybiB0aGlzLl92aWV3LmNvbnRleHQ7XG4gIH1cblxuICBzZXQgY29udGV4dCh2YWx1ZTogYW55KSB7XG4gICAgdGhpcy5fdmlldy5jb250ZXh0ID0gdmFsdWU7XG4gIH1cblxuICBnZXQgZGVzdHJveWVkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAodGhpcy5fdmlldy5zdGF0ZSAmIFZpZXdTdGF0ZS5EZXN0cm95ZWQpICE9PSAwO1xuICB9XG5cbiAgbWFya0ZvckNoZWNrKCk6IHZvaWQge1xuICAgIG1hcmtQYXJlbnRWaWV3c0ZvckNoZWNrKHRoaXMuX3ZpZXcpO1xuICB9XG4gIGRldGFjaCgpOiB2b2lkIHtcbiAgICB0aGlzLl92aWV3LnN0YXRlICY9IH5WaWV3U3RhdGUuQXR0YWNoZWQ7XG4gIH1cbiAgZGV0ZWN0Q2hhbmdlcygpOiB2b2lkIHtcbiAgICBjb25zdCBmcyA9IHRoaXMuX3ZpZXcucm9vdC5yZW5kZXJlckZhY3Rvcnk7XG4gICAgaWYgKGZzLmJlZ2luKSB7XG4gICAgICBmcy5iZWdpbigpO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgU2VydmljZXMuY2hlY2tBbmRVcGRhdGVWaWV3KHRoaXMuX3ZpZXcpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBpZiAoZnMuZW5kKSB7XG4gICAgICAgIGZzLmVuZCgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBjaGVja05vQ2hhbmdlcygpOiB2b2lkIHtcbiAgICBTZXJ2aWNlcy5jaGVja05vQ2hhbmdlc1ZpZXcodGhpcy5fdmlldyk7XG4gIH1cblxuICByZWF0dGFjaCgpOiB2b2lkIHtcbiAgICB0aGlzLl92aWV3LnN0YXRlIHw9IFZpZXdTdGF0ZS5BdHRhY2hlZDtcbiAgfVxuICBvbkRlc3Ryb3koY2FsbGJhY2s6IEZ1bmN0aW9uKSB7XG4gICAgaWYgKCF0aGlzLl92aWV3LmRpc3Bvc2FibGVzKSB7XG4gICAgICB0aGlzLl92aWV3LmRpc3Bvc2FibGVzID0gW107XG4gICAgfVxuICAgIHRoaXMuX3ZpZXcuZGlzcG9zYWJsZXMucHVzaCg8YW55PmNhbGxiYWNrKTtcbiAgfVxuXG4gIGRlc3Ryb3koKSB7XG4gICAgaWYgKHRoaXMuX2FwcFJlZikge1xuICAgICAgdGhpcy5fYXBwUmVmLmRldGFjaFZpZXcodGhpcyk7XG4gICAgfSBlbHNlIGlmICh0aGlzLl92aWV3Q29udGFpbmVyUmVmKSB7XG4gICAgICB0aGlzLl92aWV3Q29udGFpbmVyUmVmLmRldGFjaCh0aGlzLl92aWV3Q29udGFpbmVyUmVmLmluZGV4T2YodGhpcykpO1xuICAgIH1cbiAgICBTZXJ2aWNlcy5kZXN0cm95Vmlldyh0aGlzLl92aWV3KTtcbiAgfVxuXG4gIGRldGFjaEZyb21BcHBSZWYoKSB7XG4gICAgdGhpcy5fYXBwUmVmID0gbnVsbDtcbiAgICByZW5kZXJEZXRhY2hWaWV3KHRoaXMuX3ZpZXcpO1xuICAgIFNlcnZpY2VzLmRpcnR5UGFyZW50UXVlcmllcyh0aGlzLl92aWV3KTtcbiAgfVxuXG4gIGF0dGFjaFRvQXBwUmVmKGFwcFJlZjogVmlld1JlZlRyYWNrZXIpIHtcbiAgICBpZiAodGhpcy5fdmlld0NvbnRhaW5lclJlZikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGlzIHZpZXcgaXMgYWxyZWFkeSBhdHRhY2hlZCB0byBhIFZpZXdDb250YWluZXIhJyk7XG4gICAgfVxuICAgIHRoaXMuX2FwcFJlZiA9IGFwcFJlZjtcbiAgfVxuXG4gIGF0dGFjaFRvVmlld0NvbnRhaW5lclJlZih2Y1JlZjogVmlld0NvbnRhaW5lclJlZikge1xuICAgIGlmICh0aGlzLl9hcHBSZWYpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVGhpcyB2aWV3IGlzIGFscmVhZHkgYXR0YWNoZWQgZGlyZWN0bHkgdG8gdGhlIEFwcGxpY2F0aW9uUmVmIScpO1xuICAgIH1cbiAgICB0aGlzLl92aWV3Q29udGFpbmVyUmVmID0gdmNSZWY7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVRlbXBsYXRlRGF0YSh2aWV3OiBWaWV3RGF0YSwgZGVmOiBOb2RlRGVmKTogVGVtcGxhdGVEYXRhIHtcbiAgcmV0dXJuIG5ldyBUZW1wbGF0ZVJlZl8odmlldywgZGVmKTtcbn1cblxuY2xhc3MgVGVtcGxhdGVSZWZfIGV4dGVuZHMgVGVtcGxhdGVSZWY8YW55PiBpbXBsZW1lbnRzIFRlbXBsYXRlRGF0YSB7XG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnLlxuICBfcHJvamVjdGVkVmlld3MhOiBWaWV3RGF0YVtdO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX3BhcmVudFZpZXc6IFZpZXdEYXRhLCBwcml2YXRlIF9kZWY6IE5vZGVEZWYpIHtcbiAgICBzdXBlcigpO1xuICB9XG5cbiAgb3ZlcnJpZGUgY3JlYXRlRW1iZWRkZWRWaWV3KGNvbnRleHQ6IGFueSk6IEVtYmVkZGVkVmlld1JlZjxhbnk+IHtcbiAgICByZXR1cm4gbmV3IFZpZXdSZWZfKFNlcnZpY2VzLmNyZWF0ZUVtYmVkZGVkVmlldyhcbiAgICAgICAgdGhpcy5fcGFyZW50VmlldywgdGhpcy5fZGVmLCB0aGlzLl9kZWYuZWxlbWVudCEudGVtcGxhdGUgISwgY29udGV4dCkpO1xuICB9XG5cbiAgb3ZlcnJpZGUgZ2V0IGVsZW1lbnRSZWYoKTogRWxlbWVudFJlZiB7XG4gICAgcmV0dXJuIG5ldyBFbGVtZW50UmVmKGFzRWxlbWVudERhdGEodGhpcy5fcGFyZW50VmlldywgdGhpcy5fZGVmLm5vZGVJbmRleCkucmVuZGVyRWxlbWVudCk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUluamVjdG9yKHZpZXc6IFZpZXdEYXRhLCBlbERlZjogTm9kZURlZik6IEluamVjdG9yIHtcbiAgcmV0dXJuIG5ldyBJbmplY3Rvcl8odmlldywgZWxEZWYpO1xufVxuXG5jbGFzcyBJbmplY3Rvcl8gaW1wbGVtZW50cyBJbmplY3RvciB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgdmlldzogVmlld0RhdGEsIHByaXZhdGUgZWxEZWY6IE5vZGVEZWZ8bnVsbCkge31cbiAgZ2V0KHRva2VuOiBhbnksIG5vdEZvdW5kVmFsdWU6IGFueSA9IEluamVjdG9yLlRIUk9XX0lGX05PVF9GT1VORCk6IGFueSB7XG4gICAgY29uc3QgYWxsb3dQcml2YXRlU2VydmljZXMgPVxuICAgICAgICB0aGlzLmVsRGVmID8gKHRoaXMuZWxEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuQ29tcG9uZW50VmlldykgIT09IDAgOiBmYWxzZTtcbiAgICByZXR1cm4gU2VydmljZXMucmVzb2x2ZURlcChcbiAgICAgICAgdGhpcy52aWV3LCB0aGlzLmVsRGVmLCBhbGxvd1ByaXZhdGVTZXJ2aWNlcyxcbiAgICAgICAge2ZsYWdzOiBEZXBGbGFncy5Ob25lLCB0b2tlbiwgdG9rZW5LZXk6IHRva2VuS2V5KHRva2VuKX0sIG5vdEZvdW5kVmFsdWUpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBub2RlVmFsdWUodmlldzogVmlld0RhdGEsIGluZGV4OiBudW1iZXIpOiBhbnkge1xuICBjb25zdCBkZWYgPSB2aWV3LmRlZi5ub2Rlc1tpbmRleF07XG4gIGlmIChkZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuVHlwZUVsZW1lbnQpIHtcbiAgICBjb25zdCBlbERhdGEgPSBhc0VsZW1lbnREYXRhKHZpZXcsIGRlZi5ub2RlSW5kZXgpO1xuICAgIHJldHVybiBkZWYuZWxlbWVudCEudGVtcGxhdGUgPyBlbERhdGEudGVtcGxhdGUgOiBlbERhdGEucmVuZGVyRWxlbWVudDtcbiAgfSBlbHNlIGlmIChkZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuVHlwZVRleHQpIHtcbiAgICByZXR1cm4gYXNUZXh0RGF0YSh2aWV3LCBkZWYubm9kZUluZGV4KS5yZW5kZXJUZXh0O1xuICB9IGVsc2UgaWYgKGRlZi5mbGFncyAmIChOb2RlRmxhZ3MuQ2F0UHJvdmlkZXIgfCBOb2RlRmxhZ3MuVHlwZVBpcGUpKSB7XG4gICAgcmV0dXJuIGFzUHJvdmlkZXJEYXRhKHZpZXcsIGRlZi5ub2RlSW5kZXgpLmluc3RhbmNlO1xuICB9XG4gIHRocm93IG5ldyBFcnJvcihgSWxsZWdhbCBzdGF0ZTogcmVhZCBub2RlVmFsdWUgZm9yIG5vZGUgaW5kZXggJHtpbmRleH1gKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU5nTW9kdWxlUmVmKFxuICAgIG1vZHVsZVR5cGU6IFR5cGU8YW55PiwgcGFyZW50OiBJbmplY3RvciwgYm9vdHN0cmFwQ29tcG9uZW50czogVHlwZTxhbnk+W10sXG4gICAgZGVmOiBOZ01vZHVsZURlZmluaXRpb24pOiBOZ01vZHVsZVJlZjxhbnk+IHtcbiAgcmV0dXJuIG5ldyBOZ01vZHVsZVJlZl8obW9kdWxlVHlwZSwgcGFyZW50LCBib290c3RyYXBDb21wb25lbnRzLCBkZWYpO1xufVxuXG5jbGFzcyBOZ01vZHVsZVJlZl8gaW1wbGVtZW50cyBOZ01vZHVsZURhdGEsIEludGVybmFsTmdNb2R1bGVSZWY8YW55PiB7XG4gIHByaXZhdGUgX2Rlc3Ryb3lMaXN0ZW5lcnM6ICgoKSA9PiB2b2lkKVtdID0gW107XG4gIHByaXZhdGUgX2Rlc3Ryb3llZDogYm9vbGVhbiA9IGZhbHNlO1xuICAvKiogQGludGVybmFsICovXG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnLlxuICBfcHJvdmlkZXJzITogYW55W107XG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgLy8gVE9ETyhpc3N1ZS8yNDU3MSk6IHJlbW92ZSAnIScuXG4gIF9tb2R1bGVzITogYW55W107XG5cbiAgcmVhZG9ubHkgaW5qZWN0b3I6IEluamVjdG9yID0gdGhpcztcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgX21vZHVsZVR5cGU6IFR5cGU8YW55PiwgcHVibGljIF9wYXJlbnQ6IEluamVjdG9yLFxuICAgICAgcHVibGljIF9ib290c3RyYXBDb21wb25lbnRzOiBUeXBlPGFueT5bXSwgcHVibGljIF9kZWY6IE5nTW9kdWxlRGVmaW5pdGlvbikge1xuICAgIGluaXROZ01vZHVsZSh0aGlzKTtcbiAgfVxuXG4gIGdldCh0b2tlbjogYW55LCBub3RGb3VuZFZhbHVlOiBhbnkgPSBJbmplY3Rvci5USFJPV19JRl9OT1RfRk9VTkQsXG4gICAgICBpbmplY3RGbGFnczogSW5qZWN0RmxhZ3MgPSBJbmplY3RGbGFncy5EZWZhdWx0KTogYW55IHtcbiAgICBsZXQgZmxhZ3MgPSBEZXBGbGFncy5Ob25lO1xuICAgIGlmIChpbmplY3RGbGFncyAmIEluamVjdEZsYWdzLlNraXBTZWxmKSB7XG4gICAgICBmbGFncyB8PSBEZXBGbGFncy5Ta2lwU2VsZjtcbiAgICB9IGVsc2UgaWYgKGluamVjdEZsYWdzICYgSW5qZWN0RmxhZ3MuU2VsZikge1xuICAgICAgZmxhZ3MgfD0gRGVwRmxhZ3MuU2VsZjtcbiAgICB9XG4gICAgcmV0dXJuIHJlc29sdmVOZ01vZHVsZURlcChcbiAgICAgICAgdGhpcywge3Rva2VuOiB0b2tlbiwgdG9rZW5LZXk6IHRva2VuS2V5KHRva2VuKSwgZmxhZ3M6IGZsYWdzfSwgbm90Rm91bmRWYWx1ZSk7XG4gIH1cblxuICBnZXQgaW5zdGFuY2UoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0KHRoaXMuX21vZHVsZVR5cGUpO1xuICB9XG5cbiAgZ2V0IGNvbXBvbmVudEZhY3RvcnlSZXNvbHZlcigpIHtcbiAgICByZXR1cm4gdGhpcy5nZXQoQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyKTtcbiAgfVxuXG4gIGRlc3Ryb3koKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX2Rlc3Ryb3llZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBUaGUgbmcgbW9kdWxlICR7c3RyaW5naWZ5KHRoaXMuaW5zdGFuY2UuY29uc3RydWN0b3IpfSBoYXMgYWxyZWFkeSBiZWVuIGRlc3Ryb3llZC5gKTtcbiAgICB9XG4gICAgdGhpcy5fZGVzdHJveWVkID0gdHJ1ZTtcbiAgICBjYWxsTmdNb2R1bGVMaWZlY3ljbGUodGhpcywgTm9kZUZsYWdzLk9uRGVzdHJveSk7XG4gICAgdGhpcy5fZGVzdHJveUxpc3RlbmVycy5mb3JFYWNoKChsaXN0ZW5lcikgPT4gbGlzdGVuZXIoKSk7XG4gIH1cblxuICBvbkRlc3Ryb3koY2FsbGJhY2s6ICgpID0+IHZvaWQpOiB2b2lkIHtcbiAgICB0aGlzLl9kZXN0cm95TGlzdGVuZXJzLnB1c2goY2FsbGJhY2spO1xuICB9XG59XG4iXX0=