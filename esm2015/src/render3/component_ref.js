/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { InjectionToken } from '../di/injection_token';
import { ɵɵinject } from '../di/injector_compatibility';
import { ComponentFactory as viewEngine_ComponentFactory, ComponentRef as viewEngine_ComponentRef } from '../linker/component_factory';
import { ComponentFactoryResolver as viewEngine_ComponentFactoryResolver } from '../linker/component_factory_resolver';
import { ElementRef as viewEngine_ElementRef } from '../linker/element_ref';
import { RendererFactory2 } from '../render/api';
import { Sanitizer } from '../sanitization/security';
import { VERSION } from '../version';
import { NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR } from '../view/provider';
import { assertComponentType } from './assert';
import { LifecycleHooksFeature, createRootComponent, createRootComponentView, createRootContext } from './component';
import { getComponentDef } from './definition';
import { NodeInjector } from './di';
import { addToViewTree, assignTViewNodeToLView, createLView, createTView, elementCreate, locateHostElement, refreshDescendantViews } from './instructions/shared';
import { domRendererFactory3, isProceduralRenderer } from './interfaces/renderer';
import { TVIEW } from './interfaces/view';
import { enterView, leaveView } from './state';
import { defaultScheduler } from './util/misc_utils';
import { getTNode } from './util/view_utils';
import { createElementRef } from './view_engine_compatibility';
import { RootViewRef } from './view_ref';
export class ComponentFactoryResolver extends viewEngine_ComponentFactoryResolver {
    /**
     * @param {?=} ngModule The NgModuleRef to which all resolved factories are bound.
     */
    constructor(ngModule) {
        super();
        this.ngModule = ngModule;
    }
    /**
     * @template T
     * @param {?} component
     * @return {?}
     */
    resolveComponentFactory(component) {
        ngDevMode && assertComponentType(component);
        /** @type {?} */
        const componentDef = (/** @type {?} */ (getComponentDef(component)));
        return new ComponentFactory(componentDef, this.ngModule);
    }
}
if (false) {
    /**
     * @type {?}
     * @private
     */
    ComponentFactoryResolver.prototype.ngModule;
}
/**
 * @param {?} map
 * @return {?}
 */
function toRefArray(map) {
    /** @type {?} */
    const array = [];
    for (let nonMinified in map) {
        if (map.hasOwnProperty(nonMinified)) {
            /** @type {?} */
            const minified = map[nonMinified];
            array.push({ propName: minified, templateName: nonMinified });
        }
    }
    return array;
}
/**
 * Default {\@link RootContext} for all components rendered with {\@link renderComponent}.
 * @type {?}
 */
export const ROOT_CONTEXT = new InjectionToken('ROOT_CONTEXT_TOKEN', { providedIn: 'root', factory: (/**
     * @return {?}
     */
    () => createRootContext(ɵɵinject(SCHEDULER))) });
/**
 * A change detection scheduler token for {\@link RootContext}. This token is the default value used
 * for the default `RootContext` found in the {\@link ROOT_CONTEXT} token.
 * @type {?}
 */
export const SCHEDULER = new InjectionToken('SCHEDULER_TOKEN', {
    providedIn: 'root',
    factory: (/**
     * @return {?}
     */
    () => defaultScheduler),
});
/**
 * @param {?} rootViewInjector
 * @param {?} moduleInjector
 * @return {?}
 */
function createChainedInjector(rootViewInjector, moduleInjector) {
    return {
        get: (/**
         * @template T
         * @param {?} token
         * @param {?=} notFoundValue
         * @param {?=} flags
         * @return {?}
         */
        (token, notFoundValue, flags) => {
            /** @type {?} */
            const value = rootViewInjector.get(token, (/** @type {?} */ (NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR)), flags);
            if (value !== NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR ||
                notFoundValue === NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR) {
                // Return the value from the root element injector when
                // - it provides it
                //   (value !== NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR)
                // - the module injector should not be checked
                //   (notFoundValue === NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR)
                return value;
            }
            return moduleInjector.get(token, notFoundValue, flags);
        })
    };
}
/**
 * Render3 implementation of {\@link viewEngine_ComponentFactory}.
 * @template T
 */
export class ComponentFactory extends viewEngine_ComponentFactory {
    /**
     * @param {?} componentDef The component definition.
     * @param {?=} ngModule The NgModuleRef to which the factory is bound.
     */
    constructor(componentDef, ngModule) {
        super();
        this.componentDef = componentDef;
        this.ngModule = ngModule;
        this.componentType = componentDef.type;
        this.selector = (/** @type {?} */ (componentDef.selectors[0][0]));
        this.ngContentSelectors =
            componentDef.ngContentSelectors ? componentDef.ngContentSelectors : [];
        this.isBoundToModule = !!ngModule;
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
     * @param {?} injector
     * @param {?=} projectableNodes
     * @param {?=} rootSelectorOrNode
     * @param {?=} ngModule
     * @return {?}
     */
    create(injector, projectableNodes, rootSelectorOrNode, ngModule) {
        /** @type {?} */
        const isInternalRootView = rootSelectorOrNode === undefined;
        ngModule = ngModule || this.ngModule;
        /** @type {?} */
        const rootViewInjector = ngModule ? createChainedInjector(injector, ngModule.injector) : injector;
        /** @type {?} */
        const rendererFactory = (/** @type {?} */ (rootViewInjector.get(RendererFactory2, domRendererFactory3)));
        /** @type {?} */
        const sanitizer = rootViewInjector.get(Sanitizer, null);
        /** @type {?} */
        const hostRNode = isInternalRootView ?
            elementCreate(this.selector, rendererFactory.createRenderer(null, this.componentDef)) :
            locateHostElement(rendererFactory, rootSelectorOrNode);
        /** @type {?} */
        const rootFlags = this.componentDef.onPush ? 64 /* Dirty */ | 512 /* IsRoot */ :
            16 /* CheckAlways */ | 512 /* IsRoot */;
        // Check whether this Component needs to be isolated from other components, i.e. whether it
        // should be placed into its own (empty) root context or existing root context should be used.
        // Note: this is internal-only convention and might change in the future, so it should not be
        // relied upon externally.
        /** @type {?} */
        const isIsolated = typeof rootSelectorOrNode === 'string' &&
            /^#root-ng-internal-isolated-\d+/.test(rootSelectorOrNode);
        /** @type {?} */
        const rootContext = (isInternalRootView || isIsolated) ?
            createRootContext() :
            rootViewInjector.get(ROOT_CONTEXT);
        /** @type {?} */
        const renderer = rendererFactory.createRenderer(hostRNode, this.componentDef);
        if (rootSelectorOrNode && hostRNode) {
            ngDevMode && ngDevMode.rendererSetAttribute++;
            isProceduralRenderer(renderer) ?
                renderer.setAttribute(hostRNode, 'ng-version', VERSION.full) :
                hostRNode.setAttribute('ng-version', VERSION.full);
        }
        // Create the root view. Uses empty TView and ContentTemplate.
        /** @type {?} */
        const rootLView = createLView(null, createTView(-1, null, 1, 0, null, null, null, null), rootContext, rootFlags, null, null, rendererFactory, renderer, sanitizer, rootViewInjector);
        // rootView is the parent when bootstrapping
        /** @type {?} */
        const oldLView = enterView(rootLView, null);
        /** @type {?} */
        let component;
        /** @type {?} */
        let tElementNode;
        try {
            /** @type {?} */
            const componentView = createRootComponentView(hostRNode, this.componentDef, rootLView, rendererFactory, renderer);
            tElementNode = (/** @type {?} */ (getTNode(0, rootLView)));
            if (projectableNodes) {
                // projectable nodes can be passed as array of arrays or an array of iterables (ngUpgrade
                // case). Here we do normalize passed data structure to be an array of arrays to avoid
                // complex checks down the line.
                tElementNode.projection =
                    projectableNodes.map((/**
                     * @param {?} nodesforSlot
                     * @return {?}
                     */
                    (nodesforSlot) => { return Array.from(nodesforSlot); }));
            }
            // TODO: should LifecycleHooksFeature and other host features be generated by the compiler and
            // executed here?
            // Angular 5 reference: https://stackblitz.com/edit/lifecycle-hooks-vcref
            component = createRootComponent(componentView, this.componentDef, rootLView, rootContext, [LifecycleHooksFeature]);
            addToViewTree(rootLView, componentView);
            refreshDescendantViews(rootLView);
        }
        finally {
            leaveView(oldLView);
        }
        /** @type {?} */
        const componentRef = new ComponentRef(this.componentType, component, createElementRef(viewEngine_ElementRef, tElementNode, rootLView), rootLView, tElementNode);
        if (isInternalRootView) {
            // The host element of the internal root view is attached to the component's host view node
            (/** @type {?} */ (componentRef.hostView._tViewNode)).child = tElementNode;
        }
        return componentRef;
    }
}
if (false) {
    /** @type {?} */
    ComponentFactory.prototype.selector;
    /** @type {?} */
    ComponentFactory.prototype.componentType;
    /** @type {?} */
    ComponentFactory.prototype.ngContentSelectors;
    /** @type {?} */
    ComponentFactory.prototype.isBoundToModule;
    /**
     * @type {?}
     * @private
     */
    ComponentFactory.prototype.componentDef;
    /**
     * @type {?}
     * @private
     */
    ComponentFactory.prototype.ngModule;
}
/** @type {?} */
const componentFactoryResolver = new ComponentFactoryResolver();
/**
 * Creates a ComponentFactoryResolver and stores it on the injector. Or, if the
 * ComponentFactoryResolver
 * already exists, retrieves the existing ComponentFactoryResolver.
 *
 * @return {?} The ComponentFactoryResolver instance to use
 */
export function injectComponentFactoryResolver() {
    return componentFactoryResolver;
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
     * @param {?} location
     * @param {?} _rootLView
     * @param {?} _tNode
     */
    constructor(componentType, instance, location, _rootLView, _tNode) {
        super();
        this.location = location;
        this._rootLView = _rootLView;
        this._tNode = _tNode;
        this.destroyCbs = [];
        this.instance = instance;
        this.hostView = this.changeDetectorRef = new RootViewRef(_rootLView);
        this.hostView._tViewNode = assignTViewNodeToLView(_rootLView[TVIEW], null, -1, _rootLView);
        this.componentType = componentType;
    }
    /**
     * @return {?}
     */
    get injector() { return new NodeInjector(this._tNode, this._rootLView); }
    /**
     * @return {?}
     */
    destroy() {
        if (this.destroyCbs) {
            this.destroyCbs.forEach((/**
             * @param {?} fn
             * @return {?}
             */
            fn => fn()));
            this.destroyCbs = null;
            !this.hostView.destroyed && this.hostView.destroy();
        }
    }
    /**
     * @param {?} callback
     * @return {?}
     */
    onDestroy(callback) {
        if (this.destroyCbs) {
            this.destroyCbs.push(callback);
        }
    }
}
if (false) {
    /** @type {?} */
    ComponentRef.prototype.destroyCbs;
    /** @type {?} */
    ComponentRef.prototype.instance;
    /** @type {?} */
    ComponentRef.prototype.hostView;
    /** @type {?} */
    ComponentRef.prototype.changeDetectorRef;
    /** @type {?} */
    ComponentRef.prototype.componentType;
    /** @type {?} */
    ComponentRef.prototype.location;
    /**
     * @type {?}
     * @private
     */
    ComponentRef.prototype._rootLView;
    /**
     * @type {?}
     * @private
     */
    ComponentRef.prototype._tNode;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50X3JlZi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvY29tcG9uZW50X3JlZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVNBLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUVyRCxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFHdEQsT0FBTyxFQUFDLGdCQUFnQixJQUFJLDJCQUEyQixFQUFFLFlBQVksSUFBSSx1QkFBdUIsRUFBQyxNQUFNLDZCQUE2QixDQUFDO0FBQ3JJLE9BQU8sRUFBQyx3QkFBd0IsSUFBSSxtQ0FBbUMsRUFBQyxNQUFNLHNDQUFzQyxDQUFDO0FBQ3JILE9BQU8sRUFBQyxVQUFVLElBQUkscUJBQXFCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUUxRSxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDL0MsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBQ25ELE9BQU8sRUFBQyxPQUFPLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFDbkMsT0FBTyxFQUFDLHFDQUFxQyxFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFFdkUsT0FBTyxFQUFDLG1CQUFtQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzdDLE9BQU8sRUFBQyxxQkFBcUIsRUFBRSxtQkFBbUIsRUFBRSx1QkFBdUIsRUFBRSxpQkFBaUIsRUFBQyxNQUFNLGFBQWEsQ0FBQztBQUNuSCxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBQzdDLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDbEMsT0FBTyxFQUFDLGFBQWEsRUFBRSxzQkFBc0IsRUFBRSxXQUFXLEVBQUUsV0FBVyxFQUFFLGFBQWEsRUFBRSxpQkFBaUIsRUFBRSxz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SSxDQUFDLGFBQWEsR0FBRyxhQUFhLENBQUM7SUFDckMsQ0FBQzs7OztJQUVELElBQUksUUFBUSxLQUFlLE9BQU8sSUFBSSxZQUFZLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDOzs7O0lBRW5GLE9BQU87UUFDTCxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUU7WUFDbkIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPOzs7O1lBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBQyxDQUFDO1lBQ3BDLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO1lBQ3ZCLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztTQUNyRDtJQUNILENBQUM7Ozs7O0lBRUQsU0FBUyxDQUFDLFFBQW9CO1FBQzVCLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUNuQixJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztTQUNoQztJQUNILENBQUM7Q0FDRjs7O0lBaENDLGtDQUFxQzs7SUFDckMsZ0NBQVk7O0lBQ1osZ0NBQXFCOztJQUNyQix5Q0FBZ0Q7O0lBQ2hELHFDQUF1Qjs7SUFHa0IsZ0NBQXNDOzs7OztJQUMzRSxrQ0FBeUI7Ozs7O0lBQ3pCLDhCQUFpRSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtDaGFuZ2VEZXRlY3RvclJlZiBhcyBWaWV3RW5naW5lX0NoYW5nZURldGVjdG9yUmVmfSBmcm9tICcuLi9jaGFuZ2VfZGV0ZWN0aW9uL2NoYW5nZV9kZXRlY3Rvcl9yZWYnO1xuaW1wb3J0IHtJbmplY3Rpb25Ub2tlbn0gZnJvbSAnLi4vZGkvaW5qZWN0aW9uX3Rva2VuJztcbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4uL2RpL2luamVjdG9yJztcbmltcG9ydCB7ybXJtWluamVjdH0gZnJvbSAnLi4vZGkvaW5qZWN0b3JfY29tcGF0aWJpbGl0eSc7XG5pbXBvcnQge0luamVjdEZsYWdzfSBmcm9tICcuLi9kaS9pbnRlcmZhY2UvaW5qZWN0b3InO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnkgYXMgdmlld0VuZ2luZV9Db21wb25lbnRGYWN0b3J5LCBDb21wb25lbnRSZWYgYXMgdmlld0VuZ2luZV9Db21wb25lbnRSZWZ9IGZyb20gJy4uL2xpbmtlci9jb21wb25lbnRfZmFjdG9yeSc7XG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnlSZXNvbHZlciBhcyB2aWV3RW5naW5lX0NvbXBvbmVudEZhY3RvcnlSZXNvbHZlcn0gZnJvbSAnLi4vbGlua2VyL2NvbXBvbmVudF9mYWN0b3J5X3Jlc29sdmVyJztcbmltcG9ydCB7RWxlbWVudFJlZiBhcyB2aWV3RW5naW5lX0VsZW1lbnRSZWZ9IGZyb20gJy4uL2xpbmtlci9lbGVtZW50X3JlZic7XG5pbXBvcnQge05nTW9kdWxlUmVmIGFzIHZpZXdFbmdpbmVfTmdNb2R1bGVSZWZ9IGZyb20gJy4uL2xpbmtlci9uZ19tb2R1bGVfZmFjdG9yeSc7XG5pbXBvcnQge1JlbmRlcmVyRmFjdG9yeTJ9IGZyb20gJy4uL3JlbmRlci9hcGknO1xuaW1wb3J0IHtTYW5pdGl6ZXJ9IGZyb20gJy4uL3Nhbml0aXphdGlvbi9zZWN1cml0eSc7XG5pbXBvcnQge1ZFUlNJT059IGZyb20gJy4uL3ZlcnNpb24nO1xuaW1wb3J0IHtOT1RfRk9VTkRfQ0hFQ0tfT05MWV9FTEVNRU5UX0lOSkVDVE9SfSBmcm9tICcuLi92aWV3L3Byb3ZpZGVyJztcblxuaW1wb3J0IHthc3NlcnRDb21wb25lbnRUeXBlfSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge0xpZmVjeWNsZUhvb2tzRmVhdHVyZSwgY3JlYXRlUm9vdENvbXBvbmVudCwgY3JlYXRlUm9vdENvbXBvbmVudFZpZXcsIGNyZWF0ZVJvb3RDb250ZXh0fSBmcm9tICcuL2NvbXBvbmVudCc7XG5pbXBvcnQge2dldENvbXBvbmVudERlZn0gZnJvbSAnLi9kZWZpbml0aW9uJztcbmltcG9ydCB7Tm9kZUluamVjdG9yfSBmcm9tICcuL2RpJztcbmltcG9ydCB7YWRkVG9WaWV3VHJlZSwgYXNzaWduVFZpZXdOb2RlVG9MVmlldywgY3JlYXRlTFZpZXcsIGNyZWF0ZVRWaWV3LCBlbGVtZW50Q3JlYXRlLCBsb2NhdGVIb3N0RWxlbWVudCwgcmVmcmVzaERlc2NlbmRhbnRWaWV3c30gZnJvbSAnLi9pbnN0cnVjdGlvbnMvc2hhcmVkJztcbmltcG9ydCB7Q29tcG9uZW50RGVmfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge1RDb250YWluZXJOb2RlLCBURWxlbWVudENvbnRhaW5lck5vZGUsIFRFbGVtZW50Tm9kZX0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtSTm9kZSwgUmVuZGVyZXJGYWN0b3J5MywgZG9tUmVuZGVyZXJGYWN0b3J5MywgaXNQcm9jZWR1cmFsUmVuZGVyZXJ9IGZyb20gJy4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge0xWaWV3LCBMVmlld0ZsYWdzLCBSb290Q29udGV4dCwgVFZJRVd9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7ZW50ZXJWaWV3LCBsZWF2ZVZpZXd9IGZyb20gJy4vc3RhdGUnO1xuaW1wb3J0IHtkZWZhdWx0U2NoZWR1bGVyfSBmcm9tICcuL3V0aWwvbWlzY191dGlscyc7XG5pbXBvcnQge2dldFROb2RlfSBmcm9tICcuL3V0aWwvdmlld191dGlscyc7XG5pbXBvcnQge2NyZWF0ZUVsZW1lbnRSZWZ9IGZyb20gJy4vdmlld19lbmdpbmVfY29tcGF0aWJpbGl0eSc7XG5pbXBvcnQge1Jvb3RWaWV3UmVmLCBWaWV3UmVmfSBmcm9tICcuL3ZpZXdfcmVmJztcblxuZXhwb3J0IGNsYXNzIENvbXBvbmVudEZhY3RvcnlSZXNvbHZlciBleHRlbmRzIHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyIHtcbiAgLyoqXG4gICAqIEBwYXJhbSBuZ01vZHVsZSBUaGUgTmdNb2R1bGVSZWYgdG8gd2hpY2ggYWxsIHJlc29sdmVkIGZhY3RvcmllcyBhcmUgYm91bmQuXG4gICAqL1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIG5nTW9kdWxlPzogdmlld0VuZ2luZV9OZ01vZHVsZVJlZjxhbnk+KSB7IHN1cGVyKCk7IH1cblxuICByZXNvbHZlQ29tcG9uZW50RmFjdG9yeTxUPihjb21wb25lbnQ6IFR5cGU8VD4pOiB2aWV3RW5naW5lX0NvbXBvbmVudEZhY3Rvcnk8VD4ge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRDb21wb25lbnRUeXBlKGNvbXBvbmVudCk7XG4gICAgY29uc3QgY29tcG9uZW50RGVmID0gZ2V0Q29tcG9uZW50RGVmKGNvbXBvbmVudCkgITtcbiAgICByZXR1cm4gbmV3IENvbXBvbmVudEZhY3RvcnkoY29tcG9uZW50RGVmLCB0aGlzLm5nTW9kdWxlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiB0b1JlZkFycmF5KG1hcDoge1trZXk6IHN0cmluZ106IHN0cmluZ30pOiB7cHJvcE5hbWU6IHN0cmluZzsgdGVtcGxhdGVOYW1lOiBzdHJpbmc7fVtdIHtcbiAgY29uc3QgYXJyYXk6IHtwcm9wTmFtZTogc3RyaW5nOyB0ZW1wbGF0ZU5hbWU6IHN0cmluZzt9W10gPSBbXTtcbiAgZm9yIChsZXQgbm9uTWluaWZpZWQgaW4gbWFwKSB7XG4gICAgaWYgKG1hcC5oYXNPd25Qcm9wZXJ0eShub25NaW5pZmllZCkpIHtcbiAgICAgIGNvbnN0IG1pbmlmaWVkID0gbWFwW25vbk1pbmlmaWVkXTtcbiAgICAgIGFycmF5LnB1c2goe3Byb3BOYW1lOiBtaW5pZmllZCwgdGVtcGxhdGVOYW1lOiBub25NaW5pZmllZH0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gYXJyYXk7XG59XG5cbi8qKlxuICogRGVmYXVsdCB7QGxpbmsgUm9vdENvbnRleHR9IGZvciBhbGwgY29tcG9uZW50cyByZW5kZXJlZCB3aXRoIHtAbGluayByZW5kZXJDb21wb25lbnR9LlxuICovXG5leHBvcnQgY29uc3QgUk9PVF9DT05URVhUID0gbmV3IEluamVjdGlvblRva2VuPFJvb3RDb250ZXh0PihcbiAgICAnUk9PVF9DT05URVhUX1RPS0VOJyxcbiAgICB7cHJvdmlkZWRJbjogJ3Jvb3QnLCBmYWN0b3J5OiAoKSA9PiBjcmVhdGVSb290Q29udGV4dCjJtcm1aW5qZWN0KFNDSEVEVUxFUikpfSk7XG5cbi8qKlxuICogQSBjaGFuZ2UgZGV0ZWN0aW9uIHNjaGVkdWxlciB0b2tlbiBmb3Ige0BsaW5rIFJvb3RDb250ZXh0fS4gVGhpcyB0b2tlbiBpcyB0aGUgZGVmYXVsdCB2YWx1ZSB1c2VkXG4gKiBmb3IgdGhlIGRlZmF1bHQgYFJvb3RDb250ZXh0YCBmb3VuZCBpbiB0aGUge0BsaW5rIFJPT1RfQ09OVEVYVH0gdG9rZW4uXG4gKi9cbmV4cG9ydCBjb25zdCBTQ0hFRFVMRVIgPSBuZXcgSW5qZWN0aW9uVG9rZW48KChmbjogKCkgPT4gdm9pZCkgPT4gdm9pZCk+KCdTQ0hFRFVMRVJfVE9LRU4nLCB7XG4gIHByb3ZpZGVkSW46ICdyb290JyxcbiAgZmFjdG9yeTogKCkgPT4gZGVmYXVsdFNjaGVkdWxlcixcbn0pO1xuXG5mdW5jdGlvbiBjcmVhdGVDaGFpbmVkSW5qZWN0b3Iocm9vdFZpZXdJbmplY3RvcjogSW5qZWN0b3IsIG1vZHVsZUluamVjdG9yOiBJbmplY3Rvcik6IEluamVjdG9yIHtcbiAgcmV0dXJuIHtcbiAgICBnZXQ6IDxUPih0b2tlbjogVHlwZTxUPnwgSW5qZWN0aW9uVG9rZW48VD4sIG5vdEZvdW5kVmFsdWU/OiBULCBmbGFncz86IEluamVjdEZsYWdzKTogVCA9PiB7XG4gICAgICBjb25zdCB2YWx1ZSA9IHJvb3RWaWV3SW5qZWN0b3IuZ2V0KHRva2VuLCBOT1RfRk9VTkRfQ0hFQ0tfT05MWV9FTEVNRU5UX0lOSkVDVE9SIGFzIFQsIGZsYWdzKTtcblxuICAgICAgaWYgKHZhbHVlICE9PSBOT1RfRk9VTkRfQ0hFQ0tfT05MWV9FTEVNRU5UX0lOSkVDVE9SIHx8XG4gICAgICAgICAgbm90Rm91bmRWYWx1ZSA9PT0gTk9UX0ZPVU5EX0NIRUNLX09OTFlfRUxFTUVOVF9JTkpFQ1RPUikge1xuICAgICAgICAvLyBSZXR1cm4gdGhlIHZhbHVlIGZyb20gdGhlIHJvb3QgZWxlbWVudCBpbmplY3RvciB3aGVuXG4gICAgICAgIC8vIC0gaXQgcHJvdmlkZXMgaXRcbiAgICAgICAgLy8gICAodmFsdWUgIT09IE5PVF9GT1VORF9DSEVDS19PTkxZX0VMRU1FTlRfSU5KRUNUT1IpXG4gICAgICAgIC8vIC0gdGhlIG1vZHVsZSBpbmplY3RvciBzaG91bGQgbm90IGJlIGNoZWNrZWRcbiAgICAgICAgLy8gICAobm90Rm91bmRWYWx1ZSA9PT0gTk9UX0ZPVU5EX0NIRUNLX09OTFlfRUxFTUVOVF9JTkpFQ1RPUilcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gbW9kdWxlSW5qZWN0b3IuZ2V0KHRva2VuLCBub3RGb3VuZFZhbHVlLCBmbGFncyk7XG4gICAgfVxuICB9O1xufVxuXG4vKipcbiAqIFJlbmRlcjMgaW1wbGVtZW50YXRpb24gb2Yge0BsaW5rIHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeX0uXG4gKi9cbmV4cG9ydCBjbGFzcyBDb21wb25lbnRGYWN0b3J5PFQ+IGV4dGVuZHMgdmlld0VuZ2luZV9Db21wb25lbnRGYWN0b3J5PFQ+IHtcbiAgc2VsZWN0b3I6IHN0cmluZztcbiAgY29tcG9uZW50VHlwZTogVHlwZTxhbnk+O1xuICBuZ0NvbnRlbnRTZWxlY3RvcnM6IHN0cmluZ1tdO1xuICBpc0JvdW5kVG9Nb2R1bGU6IGJvb2xlYW47XG5cbiAgZ2V0IGlucHV0cygpOiB7cHJvcE5hbWU6IHN0cmluZzsgdGVtcGxhdGVOYW1lOiBzdHJpbmc7fVtdIHtcbiAgICByZXR1cm4gdG9SZWZBcnJheSh0aGlzLmNvbXBvbmVudERlZi5pbnB1dHMpO1xuICB9XG5cbiAgZ2V0IG91dHB1dHMoKToge3Byb3BOYW1lOiBzdHJpbmc7IHRlbXBsYXRlTmFtZTogc3RyaW5nO31bXSB7XG4gICAgcmV0dXJuIHRvUmVmQXJyYXkodGhpcy5jb21wb25lbnREZWYub3V0cHV0cyk7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIGNvbXBvbmVudERlZiBUaGUgY29tcG9uZW50IGRlZmluaXRpb24uXG4gICAqIEBwYXJhbSBuZ01vZHVsZSBUaGUgTmdNb2R1bGVSZWYgdG8gd2hpY2ggdGhlIGZhY3RvcnkgaXMgYm91bmQuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgY29tcG9uZW50RGVmOiBDb21wb25lbnREZWY8YW55PiwgcHJpdmF0ZSBuZ01vZHVsZT86IHZpZXdFbmdpbmVfTmdNb2R1bGVSZWY8YW55Pikge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5jb21wb25lbnRUeXBlID0gY29tcG9uZW50RGVmLnR5cGU7XG4gICAgdGhpcy5zZWxlY3RvciA9IGNvbXBvbmVudERlZi5zZWxlY3RvcnNbMF1bMF0gYXMgc3RyaW5nO1xuICAgIHRoaXMubmdDb250ZW50U2VsZWN0b3JzID1cbiAgICAgICAgY29tcG9uZW50RGVmLm5nQ29udGVudFNlbGVjdG9ycyA/IGNvbXBvbmVudERlZi5uZ0NvbnRlbnRTZWxlY3RvcnMgOiBbXTtcbiAgICB0aGlzLmlzQm91bmRUb01vZHVsZSA9ICEhbmdNb2R1bGU7XG4gIH1cblxuICBjcmVhdGUoXG4gICAgICBpbmplY3RvcjogSW5qZWN0b3IsIHByb2plY3RhYmxlTm9kZXM/OiBhbnlbXVtdfHVuZGVmaW5lZCwgcm9vdFNlbGVjdG9yT3JOb2RlPzogYW55LFxuICAgICAgbmdNb2R1bGU/OiB2aWV3RW5naW5lX05nTW9kdWxlUmVmPGFueT58dW5kZWZpbmVkKTogdmlld0VuZ2luZV9Db21wb25lbnRSZWY8VD4ge1xuICAgIGNvbnN0IGlzSW50ZXJuYWxSb290VmlldyA9IHJvb3RTZWxlY3Rvck9yTm9kZSA9PT0gdW5kZWZpbmVkO1xuICAgIG5nTW9kdWxlID0gbmdNb2R1bGUgfHwgdGhpcy5uZ01vZHVsZTtcblxuICAgIGNvbnN0IHJvb3RWaWV3SW5qZWN0b3IgPVxuICAgICAgICBuZ01vZHVsZSA/IGNyZWF0ZUNoYWluZWRJbmplY3RvcihpbmplY3RvciwgbmdNb2R1bGUuaW5qZWN0b3IpIDogaW5qZWN0b3I7XG5cbiAgICBjb25zdCByZW5kZXJlckZhY3RvcnkgPVxuICAgICAgICByb290Vmlld0luamVjdG9yLmdldChSZW5kZXJlckZhY3RvcnkyLCBkb21SZW5kZXJlckZhY3RvcnkzKSBhcyBSZW5kZXJlckZhY3RvcnkzO1xuICAgIGNvbnN0IHNhbml0aXplciA9IHJvb3RWaWV3SW5qZWN0b3IuZ2V0KFNhbml0aXplciwgbnVsbCk7XG5cbiAgICBjb25zdCBob3N0Uk5vZGUgPSBpc0ludGVybmFsUm9vdFZpZXcgP1xuICAgICAgICBlbGVtZW50Q3JlYXRlKHRoaXMuc2VsZWN0b3IsIHJlbmRlcmVyRmFjdG9yeS5jcmVhdGVSZW5kZXJlcihudWxsLCB0aGlzLmNvbXBvbmVudERlZikpIDpcbiAgICAgICAgbG9jYXRlSG9zdEVsZW1lbnQocmVuZGVyZXJGYWN0b3J5LCByb290U2VsZWN0b3JPck5vZGUpO1xuXG4gICAgY29uc3Qgcm9vdEZsYWdzID0gdGhpcy5jb21wb25lbnREZWYub25QdXNoID8gTFZpZXdGbGFncy5EaXJ0eSB8IExWaWV3RmxhZ3MuSXNSb290IDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzIHwgTFZpZXdGbGFncy5Jc1Jvb3Q7XG5cbiAgICAvLyBDaGVjayB3aGV0aGVyIHRoaXMgQ29tcG9uZW50IG5lZWRzIHRvIGJlIGlzb2xhdGVkIGZyb20gb3RoZXIgY29tcG9uZW50cywgaS5lLiB3aGV0aGVyIGl0XG4gICAgLy8gc2hvdWxkIGJlIHBsYWNlZCBpbnRvIGl0cyBvd24gKGVtcHR5KSByb290IGNvbnRleHQgb3IgZXhpc3Rpbmcgcm9vdCBjb250ZXh0IHNob3VsZCBiZSB1c2VkLlxuICAgIC8vIE5vdGU6IHRoaXMgaXMgaW50ZXJuYWwtb25seSBjb252ZW50aW9uIGFuZCBtaWdodCBjaGFuZ2UgaW4gdGhlIGZ1dHVyZSwgc28gaXQgc2hvdWxkIG5vdCBiZVxuICAgIC8vIHJlbGllZCB1cG9uIGV4dGVybmFsbHkuXG4gICAgY29uc3QgaXNJc29sYXRlZCA9IHR5cGVvZiByb290U2VsZWN0b3JPck5vZGUgPT09ICdzdHJpbmcnICYmXG4gICAgICAgIC9eI3Jvb3QtbmctaW50ZXJuYWwtaXNvbGF0ZWQtXFxkKy8udGVzdChyb290U2VsZWN0b3JPck5vZGUpO1xuXG4gICAgY29uc3Qgcm9vdENvbnRleHQ6IFJvb3RDb250ZXh0ID0gKGlzSW50ZXJuYWxSb290VmlldyB8fCBpc0lzb2xhdGVkKSA/XG4gICAgICAgIGNyZWF0ZVJvb3RDb250ZXh0KCkgOlxuICAgICAgICByb290Vmlld0luamVjdG9yLmdldChST09UX0NPTlRFWFQpO1xuXG4gICAgY29uc3QgcmVuZGVyZXIgPSByZW5kZXJlckZhY3RvcnkuY3JlYXRlUmVuZGVyZXIoaG9zdFJOb2RlLCB0aGlzLmNvbXBvbmVudERlZik7XG5cbiAgICBpZiAocm9vdFNlbGVjdG9yT3JOb2RlICYmIGhvc3RSTm9kZSkge1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldEF0dHJpYnV0ZSsrO1xuICAgICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID9cbiAgICAgICAgICByZW5kZXJlci5zZXRBdHRyaWJ1dGUoaG9zdFJOb2RlLCAnbmctdmVyc2lvbicsIFZFUlNJT04uZnVsbCkgOlxuICAgICAgICAgIGhvc3RSTm9kZS5zZXRBdHRyaWJ1dGUoJ25nLXZlcnNpb24nLCBWRVJTSU9OLmZ1bGwpO1xuICAgIH1cblxuICAgIC8vIENyZWF0ZSB0aGUgcm9vdCB2aWV3LiBVc2VzIGVtcHR5IFRWaWV3IGFuZCBDb250ZW50VGVtcGxhdGUuXG4gICAgY29uc3Qgcm9vdExWaWV3ID0gY3JlYXRlTFZpZXcoXG4gICAgICAgIG51bGwsIGNyZWF0ZVRWaWV3KC0xLCBudWxsLCAxLCAwLCBudWxsLCBudWxsLCBudWxsLCBudWxsKSwgcm9vdENvbnRleHQsIHJvb3RGbGFncywgbnVsbCxcbiAgICAgICAgbnVsbCwgcmVuZGVyZXJGYWN0b3J5LCByZW5kZXJlciwgc2FuaXRpemVyLCByb290Vmlld0luamVjdG9yKTtcblxuICAgIC8vIHJvb3RWaWV3IGlzIHRoZSBwYXJlbnQgd2hlbiBib290c3RyYXBwaW5nXG4gICAgY29uc3Qgb2xkTFZpZXcgPSBlbnRlclZpZXcocm9vdExWaWV3LCBudWxsKTtcblxuICAgIGxldCBjb21wb25lbnQ6IFQ7XG4gICAgbGV0IHRFbGVtZW50Tm9kZTogVEVsZW1lbnROb2RlO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBjb21wb25lbnRWaWV3ID0gY3JlYXRlUm9vdENvbXBvbmVudFZpZXcoXG4gICAgICAgICAgaG9zdFJOb2RlLCB0aGlzLmNvbXBvbmVudERlZiwgcm9vdExWaWV3LCByZW5kZXJlckZhY3RvcnksIHJlbmRlcmVyKTtcblxuICAgICAgdEVsZW1lbnROb2RlID0gZ2V0VE5vZGUoMCwgcm9vdExWaWV3KSBhcyBURWxlbWVudE5vZGU7XG5cbiAgICAgIGlmIChwcm9qZWN0YWJsZU5vZGVzKSB7XG4gICAgICAgIC8vIHByb2plY3RhYmxlIG5vZGVzIGNhbiBiZSBwYXNzZWQgYXMgYXJyYXkgb2YgYXJyYXlzIG9yIGFuIGFycmF5IG9mIGl0ZXJhYmxlcyAobmdVcGdyYWRlXG4gICAgICAgIC8vIGNhc2UpLiBIZXJlIHdlIGRvIG5vcm1hbGl6ZSBwYXNzZWQgZGF0YSBzdHJ1Y3R1cmUgdG8gYmUgYW4gYXJyYXkgb2YgYXJyYXlzIHRvIGF2b2lkXG4gICAgICAgIC8vIGNvbXBsZXggY2hlY2tzIGRvd24gdGhlIGxpbmUuXG4gICAgICAgIHRFbGVtZW50Tm9kZS5wcm9qZWN0aW9uID1cbiAgICAgICAgICAgIHByb2plY3RhYmxlTm9kZXMubWFwKChub2Rlc2ZvclNsb3Q6IFJOb2RlW10pID0+IHsgcmV0dXJuIEFycmF5LmZyb20obm9kZXNmb3JTbG90KTsgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIFRPRE86IHNob3VsZCBMaWZlY3ljbGVIb29rc0ZlYXR1cmUgYW5kIG90aGVyIGhvc3QgZmVhdHVyZXMgYmUgZ2VuZXJhdGVkIGJ5IHRoZSBjb21waWxlciBhbmRcbiAgICAgIC8vIGV4ZWN1dGVkIGhlcmU/XG4gICAgICAvLyBBbmd1bGFyIDUgcmVmZXJlbmNlOiBodHRwczovL3N0YWNrYmxpdHouY29tL2VkaXQvbGlmZWN5Y2xlLWhvb2tzLXZjcmVmXG4gICAgICBjb21wb25lbnQgPSBjcmVhdGVSb290Q29tcG9uZW50KFxuICAgICAgICAgIGNvbXBvbmVudFZpZXcsIHRoaXMuY29tcG9uZW50RGVmLCByb290TFZpZXcsIHJvb3RDb250ZXh0LCBbTGlmZWN5Y2xlSG9va3NGZWF0dXJlXSk7XG5cbiAgICAgIGFkZFRvVmlld1RyZWUocm9vdExWaWV3LCBjb21wb25lbnRWaWV3KTtcbiAgICAgIHJlZnJlc2hEZXNjZW5kYW50Vmlld3Mocm9vdExWaWV3KTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgbGVhdmVWaWV3KG9sZExWaWV3KTtcbiAgICB9XG5cbiAgICBjb25zdCBjb21wb25lbnRSZWYgPSBuZXcgQ29tcG9uZW50UmVmKFxuICAgICAgICB0aGlzLmNvbXBvbmVudFR5cGUsIGNvbXBvbmVudCxcbiAgICAgICAgY3JlYXRlRWxlbWVudFJlZih2aWV3RW5naW5lX0VsZW1lbnRSZWYsIHRFbGVtZW50Tm9kZSwgcm9vdExWaWV3KSwgcm9vdExWaWV3LCB0RWxlbWVudE5vZGUpO1xuXG4gICAgaWYgKGlzSW50ZXJuYWxSb290Vmlldykge1xuICAgICAgLy8gVGhlIGhvc3QgZWxlbWVudCBvZiB0aGUgaW50ZXJuYWwgcm9vdCB2aWV3IGlzIGF0dGFjaGVkIHRvIHRoZSBjb21wb25lbnQncyBob3N0IHZpZXcgbm9kZVxuICAgICAgY29tcG9uZW50UmVmLmhvc3RWaWV3Ll90Vmlld05vZGUgIS5jaGlsZCA9IHRFbGVtZW50Tm9kZTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbXBvbmVudFJlZjtcbiAgfVxufVxuXG5jb25zdCBjb21wb25lbnRGYWN0b3J5UmVzb2x2ZXI6IENvbXBvbmVudEZhY3RvcnlSZXNvbHZlciA9IG5ldyBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIoKTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyIGFuZCBzdG9yZXMgaXQgb24gdGhlIGluamVjdG9yLiBPciwgaWYgdGhlXG4gKiBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXJcbiAqIGFscmVhZHkgZXhpc3RzLCByZXRyaWV2ZXMgdGhlIGV4aXN0aW5nIENvbXBvbmVudEZhY3RvcnlSZXNvbHZlci5cbiAqXG4gKiBAcmV0dXJucyBUaGUgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyIGluc3RhbmNlIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0Q29tcG9uZW50RmFjdG9yeVJlc29sdmVyKCk6IHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyIHtcbiAgcmV0dXJuIGNvbXBvbmVudEZhY3RvcnlSZXNvbHZlcjtcbn1cblxuLyoqXG4gKiBSZXByZXNlbnRzIGFuIGluc3RhbmNlIG9mIGEgQ29tcG9uZW50IGNyZWF0ZWQgdmlhIGEge0BsaW5rIENvbXBvbmVudEZhY3Rvcnl9LlxuICpcbiAqIGBDb21wb25lbnRSZWZgIHByb3ZpZGVzIGFjY2VzcyB0byB0aGUgQ29tcG9uZW50IEluc3RhbmNlIGFzIHdlbGwgb3RoZXIgb2JqZWN0cyByZWxhdGVkIHRvIHRoaXNcbiAqIENvbXBvbmVudCBJbnN0YW5jZSBhbmQgYWxsb3dzIHlvdSB0byBkZXN0cm95IHRoZSBDb21wb25lbnQgSW5zdGFuY2UgdmlhIHRoZSB7QGxpbmsgI2Rlc3Ryb3l9XG4gKiBtZXRob2QuXG4gKlxuICovXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50UmVmPFQ+IGV4dGVuZHMgdmlld0VuZ2luZV9Db21wb25lbnRSZWY8VD4ge1xuICBkZXN0cm95Q2JzOiAoKCkgPT4gdm9pZClbXXxudWxsID0gW107XG4gIGluc3RhbmNlOiBUO1xuICBob3N0VmlldzogVmlld1JlZjxUPjtcbiAgY2hhbmdlRGV0ZWN0b3JSZWY6IFZpZXdFbmdpbmVfQ2hhbmdlRGV0ZWN0b3JSZWY7XG4gIGNvbXBvbmVudFR5cGU6IFR5cGU8VD47XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBjb21wb25lbnRUeXBlOiBUeXBlPFQ+LCBpbnN0YW5jZTogVCwgcHVibGljIGxvY2F0aW9uOiB2aWV3RW5naW5lX0VsZW1lbnRSZWYsXG4gICAgICBwcml2YXRlIF9yb290TFZpZXc6IExWaWV3LFxuICAgICAgcHJpdmF0ZSBfdE5vZGU6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxURWxlbWVudENvbnRhaW5lck5vZGUpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuaW5zdGFuY2UgPSBpbnN0YW5jZTtcbiAgICB0aGlzLmhvc3RWaWV3ID0gdGhpcy5jaGFuZ2VEZXRlY3RvclJlZiA9IG5ldyBSb290Vmlld1JlZjxUPihfcm9vdExWaWV3KTtcbiAgICB0aGlzLmhvc3RWaWV3Ll90Vmlld05vZGUgPSBhc3NpZ25UVmlld05vZGVUb0xWaWV3KF9yb290TFZpZXdbVFZJRVddLCBudWxsLCAtMSwgX3Jvb3RMVmlldyk7XG4gICAgdGhpcy5jb21wb25lbnRUeXBlID0gY29tcG9uZW50VHlwZTtcbiAgfVxuXG4gIGdldCBpbmplY3RvcigpOiBJbmplY3RvciB7IHJldHVybiBuZXcgTm9kZUluamVjdG9yKHRoaXMuX3ROb2RlLCB0aGlzLl9yb290TFZpZXcpOyB9XG5cbiAgZGVzdHJveSgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5kZXN0cm95Q2JzKSB7XG4gICAgICB0aGlzLmRlc3Ryb3lDYnMuZm9yRWFjaChmbiA9PiBmbigpKTtcbiAgICAgIHRoaXMuZGVzdHJveUNicyA9IG51bGw7XG4gICAgICAhdGhpcy5ob3N0Vmlldy5kZXN0cm95ZWQgJiYgdGhpcy5ob3N0Vmlldy5kZXN0cm95KCk7XG4gICAgfVxuICB9XG5cbiAgb25EZXN0cm95KGNhbGxiYWNrOiAoKSA9PiB2b2lkKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuZGVzdHJveUNicykge1xuICAgICAgdGhpcy5kZXN0cm95Q2JzLnB1c2goY2FsbGJhY2spO1xuICAgIH1cbiAgfVxufVxuIl19