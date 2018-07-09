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
import { InjectionToken } from '../di/injection_token';
import { inject } from '../di/injector';
import { ComponentFactory as viewEngine_ComponentFactory, ComponentRef as viewEngine_ComponentRef } from '../linker/component_factory';
import { ComponentFactoryResolver as viewEngine_ComponentFactoryResolver } from '../linker/component_factory_resolver';
import { ElementRef } from '../linker/element_ref';
import { RendererFactory2 } from '../render/api';
import { assertComponentType, assertDefined } from './assert';
import { createRootContext } from './component';
import { baseDirectiveCreate, createLViewData, createTView, enterView, hostElement, initChangeDetectorIfExisting, locateHostElement } from './instructions';
import { INJECTOR } from './interfaces/view';
import { ViewRef } from './view_ref';
export class ComponentFactoryResolver extends viewEngine_ComponentFactoryResolver {
    /**
     * @template T
     * @param {?} component
     * @return {?}
     */
    resolveComponentFactory(component) {
        ngDevMode && assertComponentType(component);
        const /** @type {?} */ componentDef = (/** @type {?} */ (component)).ngComponentDef;
        return new ComponentFactory(componentDef);
    }
}
/**
 * @param {?} map
 * @return {?}
 */
function toRefArray(map) {
    const /** @type {?} */ array = [];
    for (let /** @type {?} */ nonMinified in map) {
        if (map.hasOwnProperty(nonMinified)) {
            const /** @type {?} */ minified = map[nonMinified];
            array.push({ propName: minified, templateName: nonMinified });
        }
    }
    return array;
}
/**
 * Default {\@link RootContext} for all components rendered with {\@link renderComponent}.
 */
export const /** @type {?} */ ROOT_CONTEXT = new InjectionToken('ROOT_CONTEXT_TOKEN', { providedIn: 'root', factory: () => createRootContext(inject(SCHEDULER)) });
/**
 * A change detection scheduler token for {\@link RootContext}. This token is the default value used
 * for the default `RootContext` found in the {\@link ROOT_CONTEXT} token.
 */
export const /** @type {?} */ SCHEDULER = new InjectionToken('SCHEDULER_TOKEN', { providedIn: 'root', factory: () => requestAnimationFrame.bind(window) });
/**
 * Render3 implementation of {\@link viewEngine_ComponentFactory}.
 * @template T
 */
export class ComponentFactory extends viewEngine_ComponentFactory {
    /**
     * @param {?} componentDef
     */
    constructor(componentDef) {
        super();
        this.componentDef = componentDef;
        this.componentType = componentDef.type;
        this.selector = /** @type {?} */ (componentDef.selectors[0][0]);
        this.ngContentSelectors = [];
    }
    /**
     * @return {?}
     */
    get inputs() {
        return toRefArray(this.componentDef.inputs);
    }
    /**
     * @return {?}
     */
    get outputs() {
        return toRefArray(this.componentDef.outputs);
    }
    /**
     * @param {?} parentComponentInjector
     * @param {?=} projectableNodes
     * @param {?=} rootSelectorOrNode
     * @param {?=} ngModule
     * @return {?}
     */
    create(parentComponentInjector, projectableNodes, rootSelectorOrNode, ngModule) {
        ngDevMode && assertDefined(ngModule, 'ngModule should always be defined');
        const /** @type {?} */ rendererFactory = ngModule ? ngModule.injector.get(RendererFactory2) : document;
        const /** @type {?} */ hostNode = locateHostElement(rendererFactory, rootSelectorOrNode);
        // The first index of the first selector is the tag name.
        const /** @type {?} */ componentTag = /** @type {?} */ (((/** @type {?} */ ((this.componentDef.selectors))[0]))[0]);
        const /** @type {?} */ rootContext = /** @type {?} */ ((ngModule)).injector.get(ROOT_CONTEXT);
        // Create the root view. Uses empty TView and ContentTemplate.
        const /** @type {?} */ rootView = createLViewData(rendererFactory.createRenderer(hostNode, this.componentDef.rendererType), createTView(-1, null, null, null), null, this.componentDef.onPush ? 4 /* Dirty */ : 2 /* CheckAlways */);
        rootView[INJECTOR] = ngModule && ngModule.injector || null;
        // rootView is the parent when bootstrapping
        const /** @type {?} */ oldView = enterView(rootView, /** @type {?} */ ((null)));
        let /** @type {?} */ component;
        let /** @type {?} */ elementNode;
        try {
            if (rendererFactory.begin)
                rendererFactory.begin();
            // Create element node at index 0 in data array
            elementNode = hostElement(componentTag, hostNode, this.componentDef);
            // Create directive instance with factory() and store at index 0 in directives array
            rootContext.components.push(component = /** @type {?} */ (baseDirectiveCreate(0, this.componentDef.factory(), this.componentDef)));
            initChangeDetectorIfExisting(elementNode.nodeInjector, component, /** @type {?} */ ((elementNode.data)));
        }
        finally {
            enterView(oldView, null);
            if (rendererFactory.end)
                rendererFactory.end();
        }
        // TODO(misko): this is the wrong injector here.
        return new ComponentRef(this.componentType, component, rootView, /** @type {?} */ ((ngModule)).injector, /** @type {?} */ ((hostNode)));
    }
}
function ComponentFactory_tsickle_Closure_declarations() {
    /** @type {?} */
    ComponentFactory.prototype.selector;
    /** @type {?} */
    ComponentFactory.prototype.componentType;
    /** @type {?} */
    ComponentFactory.prototype.ngContentSelectors;
    /** @type {?} */
    ComponentFactory.prototype.componentDef;
}
/**
 * Represents an instance of a Component created via a {\@link ComponentFactory}.
 *
 * `ComponentRef` provides access to the Component Instance as well other objects related to this
 * Component Instance and allows you to destroy the Component Instance via the {\@link #destroy}
 * method.
 *
 * @template T
 */
export class ComponentRef extends viewEngine_ComponentRef {
    /**
     * @param {?} componentType
     * @param {?} instance
     * @param {?} rootView
     * @param {?} injector
     * @param {?} hostNode
     */
    constructor(componentType, instance, rootView, injector, hostNode) {
        super();
        this.destroyCbs = [];
        this.instance = instance;
        /* TODO(jasonaden): This is incomplete, to be adjusted in follow-up PR. Notes from Kara:When
             * ViewRef.detectChanges is called from ApplicationRef.tick, it will call detectChanges at the
             * component instance level. I suspect this means that lifecycle hooks and host bindings on the
             * given component won't work (as these are always called at the level above a component).
             *
             * In render2, ViewRef.detectChanges uses the root view instance for view checks, not the
             * component instance. So passing in the root view (1 level above the component) is sufficient.
             * We might  want to think about creating a fake component for the top level? Or overwrite
             * detectChanges with a function that calls tickRootContext? */
        this.hostView = this.changeDetectorRef = new ViewRef(rootView, instance);
        this.injector = injector;
        this.location = new ElementRef(hostNode);
        this.componentType = componentType;
    }
    /**
     * @return {?}
     */
    destroy() {
        ngDevMode && assertDefined(this.destroyCbs, 'NgModule already destroyed'); /** @type {?} */
        ((this.destroyCbs)).forEach(fn => fn());
        this.destroyCbs = null;
    }
    /**
     * @param {?} callback
     * @return {?}
     */
    onDestroy(callback) {
        ngDevMode && assertDefined(this.destroyCbs, 'NgModule already destroyed'); /** @type {?} */
        ((this.destroyCbs)).push(callback);
    }
}
function ComponentRef_tsickle_Closure_declarations() {
    /** @type {?} */
    ComponentRef.prototype.destroyCbs;
    /** @type {?} */
    ComponentRef.prototype.location;
    /** @type {?} */
    ComponentRef.prototype.injector;
    /** @type {?} */
    ComponentRef.prototype.instance;
    /** @type {?} */
    ComponentRef.prototype.hostView;
    /** @type {?} */
    ComponentRef.prototype.changeDetectorRef;
    /** @type {?} */
    ComponentRef.prototype.componentType;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50X3JlZi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvY29tcG9uZW50X3JlZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVNBLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUNyRCxPQUFPLEVBQVcsTUFBTSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDaEQsT0FBTyxFQUFDLGdCQUFnQixJQUFJLDJCQUEyQixFQUFFLFlBQVksSUFBSSx1QkFBdUIsRUFBQyxNQUFNLDZCQUE2QixDQUFDO0FBQ3JJLE9BQU8sRUFBQyx3QkFBd0IsSUFBSSxtQ0FBbUMsRUFBQyxNQUFNLHNDQUFzQyxDQUFDO0FBQ3JILE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUVqRCxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFHL0MsT0FBTyxFQUFDLG1CQUFtQixFQUFFLGFBQWEsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUM1RCxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxhQUFhLENBQUM7QUFDOUMsT0FBTyxFQUFDLG1CQUFtQixFQUFFLGVBQWUsRUFBRSxXQUFXLEVBQUUsU0FBUyxFQUFFLFdBQVcsRUFBRSw0QkFBNEIsRUFBRSxpQkFBaUIsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBSTFKLE9BQU8sRUFBQyxRQUFRLEVBQXFDLE1BQU0sbUJBQW1CLENBQUM7QUFDL0UsT0FBTyxFQUFDLE9BQU8sRUFBQyxNQUFNLFlBQVksQ0FBQztBQUVuQyxNQUFNLCtCQUFnQyxTQUFRLG1DQUFtQzs7Ozs7O0lBQy9FLHVCQUF1QixDQUFJLFNBQWtCO1FBQzNDLFNBQVMsSUFBSSxtQkFBbUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUM1Qyx1QkFBTSxZQUFZLEdBQUcsbUJBQUMsU0FBNkIs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QzswQkFYd0IsRUFBRTtRQVlsQyxJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQzs7Ozs7Ozs7OztRQVV6QixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLE9BQU8sQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDekUsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7UUFDekIsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN6QyxJQUFJLENBQUMsYUFBYSxHQUFHLGFBQWEsQ0FBQztLQUNwQzs7OztJQUVELE9BQU87UUFDTCxTQUFTLElBQUksYUFBYSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsNEJBQTRCLENBQUMsQ0FBQztVQUMxRSxJQUFJLENBQUMsVUFBVSxHQUFHLE9BQU8sQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUNwQyxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztLQUN4Qjs7Ozs7SUFDRCxTQUFTLENBQUMsUUFBb0I7UUFDNUIsU0FBUyxJQUFJLGFBQWEsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLDRCQUE0QixDQUFDLENBQUM7VUFDMUUsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsUUFBUTtLQUNoQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0NoYW5nZURldGVjdG9yUmVmfSBmcm9tICcuLi9jaGFuZ2VfZGV0ZWN0aW9uL2NoYW5nZV9kZXRlY3Rvcl9yZWYnO1xuaW1wb3J0IHtJbmplY3Rpb25Ub2tlbn0gZnJvbSAnLi4vZGkvaW5qZWN0aW9uX3Rva2VuJztcbmltcG9ydCB7SW5qZWN0b3IsIGluamVjdH0gZnJvbSAnLi4vZGkvaW5qZWN0b3InO1xuaW1wb3J0IHtDb21wb25lbnRGYWN0b3J5IGFzIHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeSwgQ29tcG9uZW50UmVmIGFzIHZpZXdFbmdpbmVfQ29tcG9uZW50UmVmfSBmcm9tICcuLi9saW5rZXIvY29tcG9uZW50X2ZhY3RvcnknO1xuaW1wb3J0IHtDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIgYXMgdmlld0VuZ2luZV9Db21wb25lbnRGYWN0b3J5UmVzb2x2ZXJ9IGZyb20gJy4uL2xpbmtlci9jb21wb25lbnRfZmFjdG9yeV9yZXNvbHZlcic7XG5pbXBvcnQge0VsZW1lbnRSZWZ9IGZyb20gJy4uL2xpbmtlci9lbGVtZW50X3JlZic7XG5pbXBvcnQge05nTW9kdWxlUmVmIGFzIHZpZXdFbmdpbmVfTmdNb2R1bGVSZWZ9IGZyb20gJy4uL2xpbmtlci9uZ19tb2R1bGVfZmFjdG9yeSc7XG5pbXBvcnQge1JlbmRlcmVyRmFjdG9yeTJ9IGZyb20gJy4uL3JlbmRlci9hcGknO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi90eXBlJztcblxuaW1wb3J0IHthc3NlcnRDb21wb25lbnRUeXBlLCBhc3NlcnREZWZpbmVkfSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge2NyZWF0ZVJvb3RDb250ZXh0fSBmcm9tICcuL2NvbXBvbmVudCc7XG5pbXBvcnQge2Jhc2VEaXJlY3RpdmVDcmVhdGUsIGNyZWF0ZUxWaWV3RGF0YSwgY3JlYXRlVFZpZXcsIGVudGVyVmlldywgaG9zdEVsZW1lbnQsIGluaXRDaGFuZ2VEZXRlY3RvcklmRXhpc3RpbmcsIGxvY2F0ZUhvc3RFbGVtZW50fSBmcm9tICcuL2luc3RydWN0aW9ucyc7XG5pbXBvcnQge0NvbXBvbmVudERlZiwgQ29tcG9uZW50VHlwZX0gZnJvbSAnLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtMRWxlbWVudE5vZGV9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7UkVsZW1lbnR9IGZyb20gJy4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge0lOSkVDVE9SLCBMVmlld0RhdGEsIExWaWV3RmxhZ3MsIFJvb3RDb250ZXh0fSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge1ZpZXdSZWZ9IGZyb20gJy4vdmlld19yZWYnO1xuXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyIGV4dGVuZHMgdmlld0VuZ2luZV9Db21wb25lbnRGYWN0b3J5UmVzb2x2ZXIge1xuICByZXNvbHZlQ29tcG9uZW50RmFjdG9yeTxUPihjb21wb25lbnQ6IFR5cGU8VD4pOiB2aWV3RW5naW5lX0NvbXBvbmVudEZhY3Rvcnk8VD4ge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRDb21wb25lbnRUeXBlKGNvbXBvbmVudCk7XG4gICAgY29uc3QgY29tcG9uZW50RGVmID0gKGNvbXBvbmVudCBhcyBDb21wb25lbnRUeXBlPFQ+KS5uZ0NvbXBvbmVudERlZjtcbiAgICByZXR1cm4gbmV3IENvbXBvbmVudEZhY3RvcnkoY29tcG9uZW50RGVmKTtcbiAgfVxufVxuXG5mdW5jdGlvbiB0b1JlZkFycmF5KG1hcDoge1trZXk6IHN0cmluZ106IHN0cmluZ30pOiB7cHJvcE5hbWU6IHN0cmluZzsgdGVtcGxhdGVOYW1lOiBzdHJpbmc7fVtdIHtcbiAgY29uc3QgYXJyYXk6IHtwcm9wTmFtZTogc3RyaW5nOyB0ZW1wbGF0ZU5hbWU6IHN0cmluZzt9W10gPSBbXTtcbiAgZm9yIChsZXQgbm9uTWluaWZpZWQgaW4gbWFwKSB7XG4gICAgaWYgKG1hcC5oYXNPd25Qcm9wZXJ0eShub25NaW5pZmllZCkpIHtcbiAgICAgIGNvbnN0IG1pbmlmaWVkID0gbWFwW25vbk1pbmlmaWVkXTtcbiAgICAgIGFycmF5LnB1c2goe3Byb3BOYW1lOiBtaW5pZmllZCwgdGVtcGxhdGVOYW1lOiBub25NaW5pZmllZH0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gYXJyYXk7XG59XG5cbi8qKlxuICogRGVmYXVsdCB7QGxpbmsgUm9vdENvbnRleHR9IGZvciBhbGwgY29tcG9uZW50cyByZW5kZXJlZCB3aXRoIHtAbGluayByZW5kZXJDb21wb25lbnR9LlxuICovXG5leHBvcnQgY29uc3QgUk9PVF9DT05URVhUID0gbmV3IEluamVjdGlvblRva2VuPFJvb3RDb250ZXh0PihcbiAgICAnUk9PVF9DT05URVhUX1RPS0VOJyxcbiAgICB7cHJvdmlkZWRJbjogJ3Jvb3QnLCBmYWN0b3J5OiAoKSA9PiBjcmVhdGVSb290Q29udGV4dChpbmplY3QoU0NIRURVTEVSKSl9KTtcblxuLyoqXG4gKiBBIGNoYW5nZSBkZXRlY3Rpb24gc2NoZWR1bGVyIHRva2VuIGZvciB7QGxpbmsgUm9vdENvbnRleHR9LiBUaGlzIHRva2VuIGlzIHRoZSBkZWZhdWx0IHZhbHVlIHVzZWRcbiAqIGZvciB0aGUgZGVmYXVsdCBgUm9vdENvbnRleHRgIGZvdW5kIGluIHRoZSB7QGxpbmsgUk9PVF9DT05URVhUfSB0b2tlbi5cbiAqL1xuZXhwb3J0IGNvbnN0IFNDSEVEVUxFUiA9IG5ldyBJbmplY3Rpb25Ub2tlbjwoKGZuOiAoKSA9PiB2b2lkKSA9PiB2b2lkKT4oXG4gICAgJ1NDSEVEVUxFUl9UT0tFTicsIHtwcm92aWRlZEluOiAncm9vdCcsIGZhY3Rvcnk6ICgpID0+IHJlcXVlc3RBbmltYXRpb25GcmFtZS5iaW5kKHdpbmRvdyl9KTtcblxuLyoqXG4gKiBSZW5kZXIzIGltcGxlbWVudGF0aW9uIG9mIHtAbGluayB2aWV3RW5naW5lX0NvbXBvbmVudEZhY3Rvcnl9LlxuICovXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50RmFjdG9yeTxUPiBleHRlbmRzIHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeTxUPiB7XG4gIHNlbGVjdG9yOiBzdHJpbmc7XG4gIGNvbXBvbmVudFR5cGU6IFR5cGU8YW55PjtcbiAgbmdDb250ZW50U2VsZWN0b3JzOiBzdHJpbmdbXTtcbiAgZ2V0IGlucHV0cygpOiB7cHJvcE5hbWU6IHN0cmluZzsgdGVtcGxhdGVOYW1lOiBzdHJpbmc7fVtdIHtcbiAgICByZXR1cm4gdG9SZWZBcnJheSh0aGlzLmNvbXBvbmVudERlZi5pbnB1dHMpO1xuICB9XG4gIGdldCBvdXRwdXRzKCk6IHtwcm9wTmFtZTogc3RyaW5nOyB0ZW1wbGF0ZU5hbWU6IHN0cmluZzt9W10ge1xuICAgIHJldHVybiB0b1JlZkFycmF5KHRoaXMuY29tcG9uZW50RGVmLm91dHB1dHMpO1xuICB9XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBjb21wb25lbnREZWY6IENvbXBvbmVudERlZjxhbnk+KSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmNvbXBvbmVudFR5cGUgPSBjb21wb25lbnREZWYudHlwZTtcbiAgICB0aGlzLnNlbGVjdG9yID0gY29tcG9uZW50RGVmLnNlbGVjdG9yc1swXVswXSBhcyBzdHJpbmc7XG4gICAgdGhpcy5uZ0NvbnRlbnRTZWxlY3RvcnMgPSBbXTtcbiAgfVxuXG4gIGNyZWF0ZShcbiAgICAgIHBhcmVudENvbXBvbmVudEluamVjdG9yOiBJbmplY3RvciwgcHJvamVjdGFibGVOb2Rlcz86IGFueVtdW118dW5kZWZpbmVkLFxuICAgICAgcm9vdFNlbGVjdG9yT3JOb2RlPzogYW55LFxuICAgICAgbmdNb2R1bGU/OiB2aWV3RW5naW5lX05nTW9kdWxlUmVmPGFueT58dW5kZWZpbmVkKTogdmlld0VuZ2luZV9Db21wb25lbnRSZWY8VD4ge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKG5nTW9kdWxlLCAnbmdNb2R1bGUgc2hvdWxkIGFsd2F5cyBiZSBkZWZpbmVkJyk7XG5cbiAgICBjb25zdCByZW5kZXJlckZhY3RvcnkgPSBuZ01vZHVsZSA/IG5nTW9kdWxlLmluamVjdG9yLmdldChSZW5kZXJlckZhY3RvcnkyKSA6IGRvY3VtZW50O1xuICAgIGNvbnN0IGhvc3ROb2RlID0gbG9jYXRlSG9zdEVsZW1lbnQocmVuZGVyZXJGYWN0b3J5LCByb290U2VsZWN0b3JPck5vZGUpO1xuXG4gICAgLy8gVGhlIGZpcnN0IGluZGV4IG9mIHRoZSBmaXJzdCBzZWxlY3RvciBpcyB0aGUgdGFnIG5hbWUuXG4gICAgY29uc3QgY29tcG9uZW50VGFnID0gdGhpcy5jb21wb25lbnREZWYuc2VsZWN0b3JzICFbMF0gIVswXSBhcyBzdHJpbmc7XG5cbiAgICBjb25zdCByb290Q29udGV4dDogUm9vdENvbnRleHQgPSBuZ01vZHVsZSAhLmluamVjdG9yLmdldChST09UX0NPTlRFWFQpO1xuXG4gICAgLy8gQ3JlYXRlIHRoZSByb290IHZpZXcuIFVzZXMgZW1wdHkgVFZpZXcgYW5kIENvbnRlbnRUZW1wbGF0ZS5cbiAgICBjb25zdCByb290VmlldzogTFZpZXdEYXRhID0gY3JlYXRlTFZpZXdEYXRhKFxuICAgICAgICByZW5kZXJlckZhY3RvcnkuY3JlYXRlUmVuZGVyZXIoaG9zdE5vZGUsIHRoaXMuY29tcG9uZW50RGVmLnJlbmRlcmVyVHlwZSksXG4gICAgICAgIGNyZWF0ZVRWaWV3KC0xLCBudWxsLCBudWxsLCBudWxsKSwgbnVsbCxcbiAgICAgICAgdGhpcy5jb21wb25lbnREZWYub25QdXNoID8gTFZpZXdGbGFncy5EaXJ0eSA6IExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMpO1xuICAgIHJvb3RWaWV3W0lOSkVDVE9SXSA9IG5nTW9kdWxlICYmIG5nTW9kdWxlLmluamVjdG9yIHx8IG51bGw7XG5cbiAgICAvLyByb290VmlldyBpcyB0aGUgcGFyZW50IHdoZW4gYm9vdHN0cmFwcGluZ1xuICAgIGNvbnN0IG9sZFZpZXcgPSBlbnRlclZpZXcocm9vdFZpZXcsIG51bGwgISk7XG5cbiAgICBsZXQgY29tcG9uZW50OiBUO1xuICAgIGxldCBlbGVtZW50Tm9kZTogTEVsZW1lbnROb2RlO1xuICAgIHRyeSB7XG4gICAgICBpZiAocmVuZGVyZXJGYWN0b3J5LmJlZ2luKSByZW5kZXJlckZhY3RvcnkuYmVnaW4oKTtcblxuICAgICAgLy8gQ3JlYXRlIGVsZW1lbnQgbm9kZSBhdCBpbmRleCAwIGluIGRhdGEgYXJyYXlcbiAgICAgIGVsZW1lbnROb2RlID0gaG9zdEVsZW1lbnQoY29tcG9uZW50VGFnLCBob3N0Tm9kZSwgdGhpcy5jb21wb25lbnREZWYpO1xuXG4gICAgICAvLyBDcmVhdGUgZGlyZWN0aXZlIGluc3RhbmNlIHdpdGggZmFjdG9yeSgpIGFuZCBzdG9yZSBhdCBpbmRleCAwIGluIGRpcmVjdGl2ZXMgYXJyYXlcbiAgICAgIHJvb3RDb250ZXh0LmNvbXBvbmVudHMucHVzaChcbiAgICAgICAgICBjb21wb25lbnQgPSBiYXNlRGlyZWN0aXZlQ3JlYXRlKDAsIHRoaXMuY29tcG9uZW50RGVmLmZhY3RvcnkoKSwgdGhpcy5jb21wb25lbnREZWYpIGFzIFQpO1xuICAgICAgaW5pdENoYW5nZURldGVjdG9ySWZFeGlzdGluZyhlbGVtZW50Tm9kZS5ub2RlSW5qZWN0b3IsIGNvbXBvbmVudCwgZWxlbWVudE5vZGUuZGF0YSAhKTtcblxuICAgIH0gZmluYWxseSB7XG4gICAgICBlbnRlclZpZXcob2xkVmlldywgbnVsbCk7XG4gICAgICBpZiAocmVuZGVyZXJGYWN0b3J5LmVuZCkgcmVuZGVyZXJGYWN0b3J5LmVuZCgpO1xuICAgIH1cblxuICAgIC8vIFRPRE8obWlza28pOiB0aGlzIGlzIHRoZSB3cm9uZyBpbmplY3RvciBoZXJlLlxuICAgIHJldHVybiBuZXcgQ29tcG9uZW50UmVmKFxuICAgICAgICB0aGlzLmNvbXBvbmVudFR5cGUsIGNvbXBvbmVudCwgcm9vdFZpZXcsIG5nTW9kdWxlICEuaW5qZWN0b3IsIGhvc3ROb2RlICEpO1xuICB9XG59XG5cbi8qKlxuICogUmVwcmVzZW50cyBhbiBpbnN0YW5jZSBvZiBhIENvbXBvbmVudCBjcmVhdGVkIHZpYSBhIHtAbGluayBDb21wb25lbnRGYWN0b3J5fS5cbiAqXG4gKiBgQ29tcG9uZW50UmVmYCBwcm92aWRlcyBhY2Nlc3MgdG8gdGhlIENvbXBvbmVudCBJbnN0YW5jZSBhcyB3ZWxsIG90aGVyIG9iamVjdHMgcmVsYXRlZCB0byB0aGlzXG4gKiBDb21wb25lbnQgSW5zdGFuY2UgYW5kIGFsbG93cyB5b3UgdG8gZGVzdHJveSB0aGUgQ29tcG9uZW50IEluc3RhbmNlIHZpYSB0aGUge0BsaW5rICNkZXN0cm95fVxuICogbWV0aG9kLlxuICpcbiAqL1xuZXhwb3J0IGNsYXNzIENvbXBvbmVudFJlZjxUPiBleHRlbmRzIHZpZXdFbmdpbmVfQ29tcG9uZW50UmVmPFQ+IHtcbiAgZGVzdHJveUNiczogKCgpID0+IHZvaWQpW118bnVsbCA9IFtdO1xuICBsb2NhdGlvbjogRWxlbWVudFJlZjxhbnk+O1xuICBpbmplY3RvcjogSW5qZWN0b3I7XG4gIGluc3RhbmNlOiBUO1xuICBob3N0VmlldzogVmlld1JlZjxUPjtcbiAgY2hhbmdlRGV0ZWN0b3JSZWY6IENoYW5nZURldGVjdG9yUmVmO1xuICBjb21wb25lbnRUeXBlOiBUeXBlPFQ+O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgY29tcG9uZW50VHlwZTogVHlwZTxUPiwgaW5zdGFuY2U6IFQsIHJvb3RWaWV3OiBMVmlld0RhdGEsIGluamVjdG9yOiBJbmplY3RvcixcbiAgICAgIGhvc3ROb2RlOiBSRWxlbWVudCkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5pbnN0YW5jZSA9IGluc3RhbmNlO1xuICAgIC8qIFRPRE8oamFzb25hZGVuKTogVGhpcyBpcyBpbmNvbXBsZXRlLCB0byBiZSBhZGp1c3RlZCBpbiBmb2xsb3ctdXAgUFIuIE5vdGVzIGZyb20gS2FyYTpXaGVuXG4gICAgICogVmlld1JlZi5kZXRlY3RDaGFuZ2VzIGlzIGNhbGxlZCBmcm9tIEFwcGxpY2F0aW9uUmVmLnRpY2ssIGl0IHdpbGwgY2FsbCBkZXRlY3RDaGFuZ2VzIGF0IHRoZVxuICAgICAqIGNvbXBvbmVudCBpbnN0YW5jZSBsZXZlbC4gSSBzdXNwZWN0IHRoaXMgbWVhbnMgdGhhdCBsaWZlY3ljbGUgaG9va3MgYW5kIGhvc3QgYmluZGluZ3Mgb24gdGhlXG4gICAgICogZ2l2ZW4gY29tcG9uZW50IHdvbid0IHdvcmsgKGFzIHRoZXNlIGFyZSBhbHdheXMgY2FsbGVkIGF0IHRoZSBsZXZlbCBhYm92ZSBhIGNvbXBvbmVudCkuXG4gICAgICpcbiAgICAgKiBJbiByZW5kZXIyLCBWaWV3UmVmLmRldGVjdENoYW5nZXMgdXNlcyB0aGUgcm9vdCB2aWV3IGluc3RhbmNlIGZvciB2aWV3IGNoZWNrcywgbm90IHRoZVxuICAgICAqIGNvbXBvbmVudCBpbnN0YW5jZS4gU28gcGFzc2luZyBpbiB0aGUgcm9vdCB2aWV3ICgxIGxldmVsIGFib3ZlIHRoZSBjb21wb25lbnQpIGlzIHN1ZmZpY2llbnQuXG4gICAgICogV2UgbWlnaHQgIHdhbnQgdG8gdGhpbmsgYWJvdXQgY3JlYXRpbmcgYSBmYWtlIGNvbXBvbmVudCBmb3IgdGhlIHRvcCBsZXZlbD8gT3Igb3ZlcndyaXRlXG4gICAgICogZGV0ZWN0Q2hhbmdlcyB3aXRoIGEgZnVuY3Rpb24gdGhhdCBjYWxscyB0aWNrUm9vdENvbnRleHQ/ICovXG4gICAgdGhpcy5ob3N0VmlldyA9IHRoaXMuY2hhbmdlRGV0ZWN0b3JSZWYgPSBuZXcgVmlld1JlZihyb290VmlldywgaW5zdGFuY2UpO1xuICAgIHRoaXMuaW5qZWN0b3IgPSBpbmplY3RvcjtcbiAgICB0aGlzLmxvY2F0aW9uID0gbmV3IEVsZW1lbnRSZWYoaG9zdE5vZGUpO1xuICAgIHRoaXMuY29tcG9uZW50VHlwZSA9IGNvbXBvbmVudFR5cGU7XG4gIH1cblxuICBkZXN0cm95KCk6IHZvaWQge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHRoaXMuZGVzdHJveUNicywgJ05nTW9kdWxlIGFscmVhZHkgZGVzdHJveWVkJyk7XG4gICAgdGhpcy5kZXN0cm95Q2JzICEuZm9yRWFjaChmbiA9PiBmbigpKTtcbiAgICB0aGlzLmRlc3Ryb3lDYnMgPSBudWxsO1xuICB9XG4gIG9uRGVzdHJveShjYWxsYmFjazogKCkgPT4gdm9pZCk6IHZvaWQge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHRoaXMuZGVzdHJveUNicywgJ05nTW9kdWxlIGFscmVhZHkgZGVzdHJveWVkJyk7XG4gICAgdGhpcy5kZXN0cm95Q2JzICEucHVzaChjYWxsYmFjayk7XG4gIH1cbn1cbiJdfQ==