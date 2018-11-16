/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { InjectionToken } from '../di/injection_token';
import { inject } from '../di/injector_compatibility';
import { ComponentFactory as viewEngine_ComponentFactory, ComponentRef as viewEngine_ComponentRef } from '../linker/component_factory';
import { ComponentFactoryResolver as viewEngine_ComponentFactoryResolver } from '../linker/component_factory_resolver';
import { ElementRef as viewEngine_ElementRef } from '../linker/element_ref';
import { RendererFactory2 } from '../render/api';
import { assertComponentType, assertDefined } from './assert';
import { LifecycleHooksFeature, createRootComponent, createRootComponentView, createRootContext } from './component';
import { getComponentDef } from './definition';
import { NodeInjector } from './di';
import { createLViewData, createNodeAtIndex, createTView, createViewNode, elementCreate, locateHostElement, refreshDescendantViews } from './instructions';
import { domRendererFactory3 } from './interfaces/renderer';
import { HEADER_OFFSET, TVIEW } from './interfaces/view';
import { enterView, leaveView } from './state';
import { defaultScheduler, getTNode } from './util';
import { createElementRef } from './view_engine_compatibility';
import { RootViewRef } from './view_ref';
export class ComponentFactoryResolver extends viewEngine_ComponentFactoryResolver {
    /**
     * @template T
     * @param {?} component
     * @return {?}
     */
    resolveComponentFactory(component) {
        ngDevMode && assertComponentType(component);
        /** @type {?} */
        const componentDef = /** @type {?} */ ((getComponentDef(component)));
        return new ComponentFactory(componentDef);
    }
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
/** *
 * Default {\@link RootContext} for all components rendered with {\@link renderComponent}.
  @type {?} */
export const ROOT_CONTEXT = new InjectionToken('ROOT_CONTEXT_TOKEN', { providedIn: 'root', factory: () => createRootContext(inject(SCHEDULER)) });
/** *
 * A change detection scheduler token for {\@link RootContext}. This token is the default value used
 * for the default `RootContext` found in the {\@link ROOT_CONTEXT} token.
  @type {?} */
export const SCHEDULER = new InjectionToken('SCHEDULER_TOKEN', {
    providedIn: 'root',
    factory: () => defaultScheduler,
});
/** *
 * A function used to wrap the `RendererFactory2`.
 * Used in tests to change the `RendererFactory2` into a `DebugRendererFactory2`.
  @type {?} */
export const WRAP_RENDERER_FACTORY2 = new InjectionToken('WRAP_RENDERER_FACTORY2');
/** @type {?} */
const NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR = {};
/**
 * @param {?} rootViewInjector
 * @param {?} moduleInjector
 * @return {?}
 */
function createChainedInjector(rootViewInjector, moduleInjector) {
    return {
        get: (token, notFoundValue) => {
            /** @type {?} */
            const value = rootViewInjector.get(token, NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR);
            if (value !== NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR) {
                // Return the value from the root element injector when
                // - it provides it
                //   (value !== NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR)
                return value;
            }
            return moduleInjector.get(token, notFoundValue);
        }
    };
}
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
     * @param {?} injector
     * @param {?=} projectableNodes
     * @param {?=} rootSelectorOrNode
     * @param {?=} ngModule
     * @return {?}
     */
    create(injector, projectableNodes, rootSelectorOrNode, ngModule) {
        /** @type {?} */
        const isInternalRootView = rootSelectorOrNode === undefined;
        /** @type {?} */
        let rendererFactory;
        if (ngModule) {
            /** @type {?} */
            const wrapper = ngModule.injector.get(WRAP_RENDERER_FACTORY2, (v) => v);
            rendererFactory = /** @type {?} */ (wrapper(ngModule.injector.get(RendererFactory2)));
        }
        else {
            rendererFactory = domRendererFactory3;
        }
        /** @type {?} */
        const hostRNode = isInternalRootView ?
            elementCreate(this.selector, rendererFactory.createRenderer(null, this.componentDef)) :
            locateHostElement(rendererFactory, rootSelectorOrNode);
        /** @type {?} */
        const rootFlags = this.componentDef.onPush ? 4 /* Dirty */ | 64 /* IsRoot */ :
            2 /* CheckAlways */ | 64 /* IsRoot */;
        /** @type {?} */
        const rootContext = ngModule && !isInternalRootView ? ngModule.injector.get(ROOT_CONTEXT) : createRootContext();
        /** @type {?} */
        const renderer = rendererFactory.createRenderer(hostRNode, this.componentDef);
        /** @type {?} */
        const rootViewInjector = ngModule ? createChainedInjector(injector, ngModule.injector) : injector;
        /** @type {?} */
        const rootView = createLViewData(renderer, createTView(-1, null, 1, 0, null, null, null), rootContext, rootFlags, undefined, rootViewInjector);
        /** @type {?} */
        const oldView = enterView(rootView, null);
        /** @type {?} */
        let component;
        /** @type {?} */
        let tElementNode;
        try {
            if (rendererFactory.begin)
                rendererFactory.begin();
            /** @type {?} */
            const componentView = createRootComponentView(hostRNode, this.componentDef, rootView, renderer);
            tElementNode = /** @type {?} */ (getTNode(0, rootView));
            // Transform the arrays of native nodes into a structure that can be consumed by the
            // projection instruction. This is needed to support the reprojection of these nodes.
            if (projectableNodes) {
                /** @type {?} */
                let index = 0;
                /** @type {?} */
                const tView = rootView[TVIEW];
                /** @type {?} */
                const projection = tElementNode.projection = [];
                for (let i = 0; i < projectableNodes.length; i++) {
                    /** @type {?} */
                    const nodeList = projectableNodes[i];
                    /** @type {?} */
                    let firstTNode = null;
                    /** @type {?} */
                    let previousTNode = null;
                    for (let j = 0; j < nodeList.length; j++) {
                        if (tView.firstTemplatePass) {
                            // For dynamically created components such as ComponentRef, we create a new TView for
                            // each insert. This is not ideal since we should be sharing the TViews.
                            // Also the logic here should be shared with `component.ts`'s `renderComponent`
                            // method.
                            tView.expandoStartIndex++;
                            tView.blueprint.splice(++index + HEADER_OFFSET, 0, null);
                            tView.data.splice(index + HEADER_OFFSET, 0, null);
                            rootView.splice(index + HEADER_OFFSET, 0, null);
                        }
                        /** @type {?} */
                        const tNode = createNodeAtIndex(index, 3 /* Element */, /** @type {?} */ (nodeList[j]), null, null);
                        previousTNode ? (previousTNode.next = tNode) : (firstTNode = tNode);
                        previousTNode = tNode;
                    }
                    projection.push(/** @type {?} */ ((firstTNode)));
                }
            }
            // TODO: should LifecycleHooksFeature and other host features be generated by the compiler and
            // executed here?
            // Angular 5 reference: https://stackblitz.com/edit/lifecycle-hooks-vcref
            component = createRootComponent(componentView, this.componentDef, rootView, rootContext, [LifecycleHooksFeature]);
            refreshDescendantViews(rootView, 1 /* Create */);
        }
        finally {
            leaveView(oldView, true);
            if (rendererFactory.end)
                rendererFactory.end();
        }
        /** @type {?} */
        const componentRef = new ComponentRef(this.componentType, component, createElementRef(viewEngine_ElementRef, tElementNode, rootView), rootView, tElementNode);
        if (isInternalRootView) {
            /** @type {?} */ ((
            // The host element of the internal root view is attached to the component's host view node
            componentRef.hostView._tViewNode)).child = tElementNode;
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
    ComponentFactory.prototype.componentDef;
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
     * @param {?} _rootView
     * @param {?} _tNode
     */
    constructor(componentType, instance, location, _rootView, _tNode) {
        super();
        this.location = location;
        this._rootView = _rootView;
        this._tNode = _tNode;
        this.destroyCbs = [];
        this.instance = instance;
        this.hostView = this.changeDetectorRef = new RootViewRef(_rootView);
        this.hostView._tViewNode = createViewNode(-1, _rootView);
        this.componentType = componentType;
    }
    /**
     * @return {?}
     */
    get injector() { return new NodeInjector(this._tNode, this._rootView); }
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
    /** @type {?} */
    ComponentRef.prototype._rootView;
    /** @type {?} */
    ComponentRef.prototype._tNode;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50X3JlZi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvY29tcG9uZW50X3JlZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVNBLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUVyRCxPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFDcEQsT0FBTyxFQUFDLGdCQUFnQixJQUFJLDJCQUEyQixFQUFFLFlBQVksSUFBSSx1QkFBdUIsRUFBQyxNQUFNLDZCQUE2QixDQUFDO0FBQ3JJLE9BQU8sRUFBQyx3QkFBd0IsSUFBSSxtQ0FBbUMsRUFBQyxNQUFNLHNDQUFzQyxDQUFDO0FBQ3JILE9BQU8sRUFBQyxVQUFVLElBQUkscUJBQXFCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUUxRSxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFHL0MsT0FBTyxFQUFDLG1CQUFtQixFQUFFLGFBQWEsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUM1RCxPQUFPLEVBQUMscUJBQXFCLEVBQUUsbUJBQW1CLEVBQUUsdUJBQXVCLEVBQUUsaUJBQWlCLEVBQUMsTUFBTSxhQUFhLENBQUM7QUFDbkgsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUM3QyxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQ2xDLE9BQU8sRUFBQyxlQUFlLEVBQUUsaUJBQWlCLEVBQUUsV0FBVyxFQUFFLGNBQWMsRUFBRSxhQUFhLEVBQUUsaUJBQWlCLEVBQUUsc0JBQXNCLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUd6SixPQUFPLEVBQTZCLG1CQUFtQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDdEYsT0FBTyxFQUFRLGFBQWEsRUFBZ0QsS0FBSyxFQUFDLE1BQU0sbUJB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LENBQUM7UUFDekQsSUFBSSxDQUFDLGFBQWEsR0FBRyxhQUFhLENBQUM7S0FDcEM7Ozs7SUFFRCxJQUFJLFFBQVEsS0FBZSxPQUFPLElBQUksWUFBWSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUU7Ozs7SUFFbEYsT0FBTztRQUNMLFNBQVMsSUFBSSxhQUFhLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSw0QkFBNEIsQ0FBQyxDQUFDO1VBQzFFLElBQUksQ0FBQyxVQUFVLEdBQUcsT0FBTyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ3BDLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO0tBQ3hCOzs7OztJQUNELFNBQVMsQ0FBQyxRQUFvQjtRQUM1QixTQUFTLElBQUksYUFBYSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsNEJBQTRCLENBQUMsQ0FBQztVQUMxRSxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxRQUFRO0tBQ2hDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Q2hhbmdlRGV0ZWN0b3JSZWYgYXMgVmlld0VuZ2luZV9DaGFuZ2VEZXRlY3RvclJlZn0gZnJvbSAnLi4vY2hhbmdlX2RldGVjdGlvbi9jaGFuZ2VfZGV0ZWN0b3JfcmVmJztcbmltcG9ydCB7SW5qZWN0aW9uVG9rZW59IGZyb20gJy4uL2RpL2luamVjdGlvbl90b2tlbic7XG5pbXBvcnQge0luamVjdG9yfSBmcm9tICcuLi9kaS9pbmplY3Rvcic7XG5pbXBvcnQge2luamVjdH0gZnJvbSAnLi4vZGkvaW5qZWN0b3JfY29tcGF0aWJpbGl0eSc7XG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnkgYXMgdmlld0VuZ2luZV9Db21wb25lbnRGYWN0b3J5LCBDb21wb25lbnRSZWYgYXMgdmlld0VuZ2luZV9Db21wb25lbnRSZWZ9IGZyb20gJy4uL2xpbmtlci9jb21wb25lbnRfZmFjdG9yeSc7XG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnlSZXNvbHZlciBhcyB2aWV3RW5naW5lX0NvbXBvbmVudEZhY3RvcnlSZXNvbHZlcn0gZnJvbSAnLi4vbGlua2VyL2NvbXBvbmVudF9mYWN0b3J5X3Jlc29sdmVyJztcbmltcG9ydCB7RWxlbWVudFJlZiBhcyB2aWV3RW5naW5lX0VsZW1lbnRSZWZ9IGZyb20gJy4uL2xpbmtlci9lbGVtZW50X3JlZic7XG5pbXBvcnQge05nTW9kdWxlUmVmIGFzIHZpZXdFbmdpbmVfTmdNb2R1bGVSZWZ9IGZyb20gJy4uL2xpbmtlci9uZ19tb2R1bGVfZmFjdG9yeSc7XG5pbXBvcnQge1JlbmRlcmVyRmFjdG9yeTJ9IGZyb20gJy4uL3JlbmRlci9hcGknO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi90eXBlJztcblxuaW1wb3J0IHthc3NlcnRDb21wb25lbnRUeXBlLCBhc3NlcnREZWZpbmVkfSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge0xpZmVjeWNsZUhvb2tzRmVhdHVyZSwgY3JlYXRlUm9vdENvbXBvbmVudCwgY3JlYXRlUm9vdENvbXBvbmVudFZpZXcsIGNyZWF0ZVJvb3RDb250ZXh0fSBmcm9tICcuL2NvbXBvbmVudCc7XG5pbXBvcnQge2dldENvbXBvbmVudERlZn0gZnJvbSAnLi9kZWZpbml0aW9uJztcbmltcG9ydCB7Tm9kZUluamVjdG9yfSBmcm9tICcuL2RpJztcbmltcG9ydCB7Y3JlYXRlTFZpZXdEYXRhLCBjcmVhdGVOb2RlQXRJbmRleCwgY3JlYXRlVFZpZXcsIGNyZWF0ZVZpZXdOb2RlLCBlbGVtZW50Q3JlYXRlLCBsb2NhdGVIb3N0RWxlbWVudCwgcmVmcmVzaERlc2NlbmRhbnRWaWV3c30gZnJvbSAnLi9pbnN0cnVjdGlvbnMnO1xuaW1wb3J0IHtDb21wb25lbnREZWYsIFJlbmRlckZsYWdzfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge1RDb250YWluZXJOb2RlLCBURWxlbWVudENvbnRhaW5lck5vZGUsIFRFbGVtZW50Tm9kZSwgVE5vZGUsIFROb2RlVHlwZSwgVFZpZXdOb2RlfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1JFbGVtZW50LCBSZW5kZXJlckZhY3RvcnkzLCBkb21SZW5kZXJlckZhY3RvcnkzfSBmcm9tICcuL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtGTEFHUywgSEVBREVSX09GRlNFVCwgSU5KRUNUT1IsIExWaWV3RGF0YSwgTFZpZXdGbGFncywgUm9vdENvbnRleHQsIFRWSUVXfSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2VudGVyVmlldywgbGVhdmVWaWV3fSBmcm9tICcuL3N0YXRlJztcbmltcG9ydCB7ZGVmYXVsdFNjaGVkdWxlciwgZ2V0VE5vZGV9IGZyb20gJy4vdXRpbCc7XG5pbXBvcnQge2NyZWF0ZUVsZW1lbnRSZWZ9IGZyb20gJy4vdmlld19lbmdpbmVfY29tcGF0aWJpbGl0eSc7XG5pbXBvcnQge1Jvb3RWaWV3UmVmLCBWaWV3UmVmfSBmcm9tICcuL3ZpZXdfcmVmJztcblxuZXhwb3J0IGNsYXNzIENvbXBvbmVudEZhY3RvcnlSZXNvbHZlciBleHRlbmRzIHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyIHtcbiAgcmVzb2x2ZUNvbXBvbmVudEZhY3Rvcnk8VD4oY29tcG9uZW50OiBUeXBlPFQ+KTogdmlld0VuZ2luZV9Db21wb25lbnRGYWN0b3J5PFQ+IHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Q29tcG9uZW50VHlwZShjb21wb25lbnQpO1xuICAgIGNvbnN0IGNvbXBvbmVudERlZiA9IGdldENvbXBvbmVudERlZihjb21wb25lbnQpICE7XG4gICAgcmV0dXJuIG5ldyBDb21wb25lbnRGYWN0b3J5KGNvbXBvbmVudERlZik7XG4gIH1cbn1cblxuZnVuY3Rpb24gdG9SZWZBcnJheShtYXA6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9KToge3Byb3BOYW1lOiBzdHJpbmc7IHRlbXBsYXRlTmFtZTogc3RyaW5nO31bXSB7XG4gIGNvbnN0IGFycmF5OiB7cHJvcE5hbWU6IHN0cmluZzsgdGVtcGxhdGVOYW1lOiBzdHJpbmc7fVtdID0gW107XG4gIGZvciAobGV0IG5vbk1pbmlmaWVkIGluIG1hcCkge1xuICAgIGlmIChtYXAuaGFzT3duUHJvcGVydHkobm9uTWluaWZpZWQpKSB7XG4gICAgICBjb25zdCBtaW5pZmllZCA9IG1hcFtub25NaW5pZmllZF07XG4gICAgICBhcnJheS5wdXNoKHtwcm9wTmFtZTogbWluaWZpZWQsIHRlbXBsYXRlTmFtZTogbm9uTWluaWZpZWR9KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGFycmF5O1xufVxuXG4vKipcbiAqIERlZmF1bHQge0BsaW5rIFJvb3RDb250ZXh0fSBmb3IgYWxsIGNvbXBvbmVudHMgcmVuZGVyZWQgd2l0aCB7QGxpbmsgcmVuZGVyQ29tcG9uZW50fS5cbiAqL1xuZXhwb3J0IGNvbnN0IFJPT1RfQ09OVEVYVCA9IG5ldyBJbmplY3Rpb25Ub2tlbjxSb290Q29udGV4dD4oXG4gICAgJ1JPT1RfQ09OVEVYVF9UT0tFTicsXG4gICAge3Byb3ZpZGVkSW46ICdyb290JywgZmFjdG9yeTogKCkgPT4gY3JlYXRlUm9vdENvbnRleHQoaW5qZWN0KFNDSEVEVUxFUikpfSk7XG5cbi8qKlxuICogQSBjaGFuZ2UgZGV0ZWN0aW9uIHNjaGVkdWxlciB0b2tlbiBmb3Ige0BsaW5rIFJvb3RDb250ZXh0fS4gVGhpcyB0b2tlbiBpcyB0aGUgZGVmYXVsdCB2YWx1ZSB1c2VkXG4gKiBmb3IgdGhlIGRlZmF1bHQgYFJvb3RDb250ZXh0YCBmb3VuZCBpbiB0aGUge0BsaW5rIFJPT1RfQ09OVEVYVH0gdG9rZW4uXG4gKi9cbmV4cG9ydCBjb25zdCBTQ0hFRFVMRVIgPSBuZXcgSW5qZWN0aW9uVG9rZW48KChmbjogKCkgPT4gdm9pZCkgPT4gdm9pZCk+KCdTQ0hFRFVMRVJfVE9LRU4nLCB7XG4gIHByb3ZpZGVkSW46ICdyb290JyxcbiAgZmFjdG9yeTogKCkgPT4gZGVmYXVsdFNjaGVkdWxlcixcbn0pO1xuXG4vKipcbiAqIEEgZnVuY3Rpb24gdXNlZCB0byB3cmFwIHRoZSBgUmVuZGVyZXJGYWN0b3J5MmAuXG4gKiBVc2VkIGluIHRlc3RzIHRvIGNoYW5nZSB0aGUgYFJlbmRlcmVyRmFjdG9yeTJgIGludG8gYSBgRGVidWdSZW5kZXJlckZhY3RvcnkyYC5cbiAqL1xuZXhwb3J0IGNvbnN0IFdSQVBfUkVOREVSRVJfRkFDVE9SWTIgPVxuICAgIG5ldyBJbmplY3Rpb25Ub2tlbjwocmY6IFJlbmRlcmVyRmFjdG9yeTIpID0+IFJlbmRlcmVyRmFjdG9yeTI+KCdXUkFQX1JFTkRFUkVSX0ZBQ1RPUlkyJyk7XG5cbmNvbnN0IE5PVF9GT1VORF9DSEVDS19PTkxZX0VMRU1FTlRfSU5KRUNUT1IgPSB7fTtcblxuZnVuY3Rpb24gY3JlYXRlQ2hhaW5lZEluamVjdG9yKHJvb3RWaWV3SW5qZWN0b3I6IEluamVjdG9yLCBtb2R1bGVJbmplY3RvcjogSW5qZWN0b3IpOiBJbmplY3RvciB7XG4gIHJldHVybiB7XG4gICAgZ2V0OiA8VD4odG9rZW46IFR5cGU8VD58IEluamVjdGlvblRva2VuPFQ+LCBub3RGb3VuZFZhbHVlPzogVCk6IFQgPT4ge1xuICAgICAgY29uc3QgdmFsdWUgPSByb290Vmlld0luamVjdG9yLmdldCh0b2tlbiwgTk9UX0ZPVU5EX0NIRUNLX09OTFlfRUxFTUVOVF9JTkpFQ1RPUik7XG5cbiAgICAgIGlmICh2YWx1ZSAhPT0gTk9UX0ZPVU5EX0NIRUNLX09OTFlfRUxFTUVOVF9JTkpFQ1RPUikge1xuICAgICAgICAvLyBSZXR1cm4gdGhlIHZhbHVlIGZyb20gdGhlIHJvb3QgZWxlbWVudCBpbmplY3RvciB3aGVuXG4gICAgICAgIC8vIC0gaXQgcHJvdmlkZXMgaXRcbiAgICAgICAgLy8gICAodmFsdWUgIT09IE5PVF9GT1VORF9DSEVDS19PTkxZX0VMRU1FTlRfSU5KRUNUT1IpXG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG1vZHVsZUluamVjdG9yLmdldCh0b2tlbiwgbm90Rm91bmRWYWx1ZSk7XG4gICAgfVxuICB9O1xufVxuXG4vKipcbiAqIFJlbmRlcjMgaW1wbGVtZW50YXRpb24gb2Yge0BsaW5rIHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeX0uXG4gKi9cbmV4cG9ydCBjbGFzcyBDb21wb25lbnRGYWN0b3J5PFQ+IGV4dGVuZHMgdmlld0VuZ2luZV9Db21wb25lbnRGYWN0b3J5PFQ+IHtcbiAgc2VsZWN0b3I6IHN0cmluZztcbiAgY29tcG9uZW50VHlwZTogVHlwZTxhbnk+O1xuICBuZ0NvbnRlbnRTZWxlY3RvcnM6IHN0cmluZ1tdO1xuXG4gIGdldCBpbnB1dHMoKToge3Byb3BOYW1lOiBzdHJpbmc7IHRlbXBsYXRlTmFtZTogc3RyaW5nO31bXSB7XG4gICAgcmV0dXJuIHRvUmVmQXJyYXkodGhpcy5jb21wb25lbnREZWYuaW5wdXRzKTtcbiAgfVxuXG4gIGdldCBvdXRwdXRzKCk6IHtwcm9wTmFtZTogc3RyaW5nOyB0ZW1wbGF0ZU5hbWU6IHN0cmluZzt9W10ge1xuICAgIHJldHVybiB0b1JlZkFycmF5KHRoaXMuY29tcG9uZW50RGVmLm91dHB1dHMpO1xuICB9XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBjb21wb25lbnREZWY6IENvbXBvbmVudERlZjxhbnk+KSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmNvbXBvbmVudFR5cGUgPSBjb21wb25lbnREZWYudHlwZTtcbiAgICB0aGlzLnNlbGVjdG9yID0gY29tcG9uZW50RGVmLnNlbGVjdG9yc1swXVswXSBhcyBzdHJpbmc7XG4gICAgdGhpcy5uZ0NvbnRlbnRTZWxlY3RvcnMgPSBbXTtcbiAgfVxuXG4gIGNyZWF0ZShcbiAgICAgIGluamVjdG9yOiBJbmplY3RvciwgcHJvamVjdGFibGVOb2Rlcz86IGFueVtdW118dW5kZWZpbmVkLCByb290U2VsZWN0b3JPck5vZGU/OiBhbnksXG4gICAgICBuZ01vZHVsZT86IHZpZXdFbmdpbmVfTmdNb2R1bGVSZWY8YW55Pnx1bmRlZmluZWQpOiB2aWV3RW5naW5lX0NvbXBvbmVudFJlZjxUPiB7XG4gICAgY29uc3QgaXNJbnRlcm5hbFJvb3RWaWV3ID0gcm9vdFNlbGVjdG9yT3JOb2RlID09PSB1bmRlZmluZWQ7XG5cbiAgICBsZXQgcmVuZGVyZXJGYWN0b3J5OiBSZW5kZXJlckZhY3RvcnkzO1xuXG4gICAgaWYgKG5nTW9kdWxlKSB7XG4gICAgICBjb25zdCB3cmFwcGVyID0gbmdNb2R1bGUuaW5qZWN0b3IuZ2V0KFdSQVBfUkVOREVSRVJfRkFDVE9SWTIsICh2OiBSZW5kZXJlckZhY3RvcnkyKSA9PiB2KTtcbiAgICAgIHJlbmRlcmVyRmFjdG9yeSA9IHdyYXBwZXIobmdNb2R1bGUuaW5qZWN0b3IuZ2V0KFJlbmRlcmVyRmFjdG9yeTIpKSBhcyBSZW5kZXJlckZhY3RvcnkzO1xuICAgIH0gZWxzZSB7XG4gICAgICByZW5kZXJlckZhY3RvcnkgPSBkb21SZW5kZXJlckZhY3RvcnkzO1xuICAgIH1cblxuICAgIGNvbnN0IGhvc3RSTm9kZSA9IGlzSW50ZXJuYWxSb290VmlldyA/XG4gICAgICAgIGVsZW1lbnRDcmVhdGUodGhpcy5zZWxlY3RvciwgcmVuZGVyZXJGYWN0b3J5LmNyZWF0ZVJlbmRlcmVyKG51bGwsIHRoaXMuY29tcG9uZW50RGVmKSkgOlxuICAgICAgICBsb2NhdGVIb3N0RWxlbWVudChyZW5kZXJlckZhY3RvcnksIHJvb3RTZWxlY3Rvck9yTm9kZSk7XG5cbiAgICBjb25zdCByb290RmxhZ3MgPSB0aGlzLmNvbXBvbmVudERlZi5vblB1c2ggPyBMVmlld0ZsYWdzLkRpcnR5IHwgTFZpZXdGbGFncy5Jc1Jvb3QgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMgfCBMVmlld0ZsYWdzLklzUm9vdDtcbiAgICBjb25zdCByb290Q29udGV4dDogUm9vdENvbnRleHQgPVxuICAgICAgICBuZ01vZHVsZSAmJiAhaXNJbnRlcm5hbFJvb3RWaWV3ID8gbmdNb2R1bGUuaW5qZWN0b3IuZ2V0KFJPT1RfQ09OVEVYVCkgOiBjcmVhdGVSb290Q29udGV4dCgpO1xuXG4gICAgY29uc3QgcmVuZGVyZXIgPSByZW5kZXJlckZhY3RvcnkuY3JlYXRlUmVuZGVyZXIoaG9zdFJOb2RlLCB0aGlzLmNvbXBvbmVudERlZik7XG4gICAgY29uc3Qgcm9vdFZpZXdJbmplY3RvciA9XG4gICAgICAgIG5nTW9kdWxlID8gY3JlYXRlQ2hhaW5lZEluamVjdG9yKGluamVjdG9yLCBuZ01vZHVsZS5pbmplY3RvcikgOiBpbmplY3RvcjtcbiAgICAvLyBDcmVhdGUgdGhlIHJvb3Qgdmlldy4gVXNlcyBlbXB0eSBUVmlldyBhbmQgQ29udGVudFRlbXBsYXRlLlxuICAgIGNvbnN0IHJvb3RWaWV3OiBMVmlld0RhdGEgPSBjcmVhdGVMVmlld0RhdGEoXG4gICAgICAgIHJlbmRlcmVyLCBjcmVhdGVUVmlldygtMSwgbnVsbCwgMSwgMCwgbnVsbCwgbnVsbCwgbnVsbCksIHJvb3RDb250ZXh0LCByb290RmxhZ3MsIHVuZGVmaW5lZCxcbiAgICAgICAgcm9vdFZpZXdJbmplY3Rvcik7XG5cbiAgICAvLyByb290VmlldyBpcyB0aGUgcGFyZW50IHdoZW4gYm9vdHN0cmFwcGluZ1xuICAgIGNvbnN0IG9sZFZpZXcgPSBlbnRlclZpZXcocm9vdFZpZXcsIG51bGwpO1xuXG4gICAgbGV0IGNvbXBvbmVudDogVDtcbiAgICBsZXQgdEVsZW1lbnROb2RlOiBURWxlbWVudE5vZGU7XG4gICAgdHJ5IHtcbiAgICAgIGlmIChyZW5kZXJlckZhY3RvcnkuYmVnaW4pIHJlbmRlcmVyRmFjdG9yeS5iZWdpbigpO1xuXG4gICAgICBjb25zdCBjb21wb25lbnRWaWV3ID1cbiAgICAgICAgICBjcmVhdGVSb290Q29tcG9uZW50Vmlldyhob3N0Uk5vZGUsIHRoaXMuY29tcG9uZW50RGVmLCByb290VmlldywgcmVuZGVyZXIpO1xuICAgICAgdEVsZW1lbnROb2RlID0gZ2V0VE5vZGUoMCwgcm9vdFZpZXcpIGFzIFRFbGVtZW50Tm9kZTtcblxuICAgICAgLy8gVHJhbnNmb3JtIHRoZSBhcnJheXMgb2YgbmF0aXZlIG5vZGVzIGludG8gYSBzdHJ1Y3R1cmUgdGhhdCBjYW4gYmUgY29uc3VtZWQgYnkgdGhlXG4gICAgICAvLyBwcm9qZWN0aW9uIGluc3RydWN0aW9uLiBUaGlzIGlzIG5lZWRlZCB0byBzdXBwb3J0IHRoZSByZXByb2plY3Rpb24gb2YgdGhlc2Ugbm9kZXMuXG4gICAgICBpZiAocHJvamVjdGFibGVOb2Rlcykge1xuICAgICAgICBsZXQgaW5kZXggPSAwO1xuICAgICAgICBjb25zdCB0VmlldyA9IHJvb3RWaWV3W1RWSUVXXTtcbiAgICAgICAgY29uc3QgcHJvamVjdGlvbjogVE5vZGVbXSA9IHRFbGVtZW50Tm9kZS5wcm9qZWN0aW9uID0gW107XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJvamVjdGFibGVOb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGNvbnN0IG5vZGVMaXN0ID0gcHJvamVjdGFibGVOb2Rlc1tpXTtcbiAgICAgICAgICBsZXQgZmlyc3RUTm9kZTogVE5vZGV8bnVsbCA9IG51bGw7XG4gICAgICAgICAgbGV0IHByZXZpb3VzVE5vZGU6IFROb2RlfG51bGwgPSBudWxsO1xuICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgbm9kZUxpc3QubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIGlmICh0Vmlldy5maXJzdFRlbXBsYXRlUGFzcykge1xuICAgICAgICAgICAgICAvLyBGb3IgZHluYW1pY2FsbHkgY3JlYXRlZCBjb21wb25lbnRzIHN1Y2ggYXMgQ29tcG9uZW50UmVmLCB3ZSBjcmVhdGUgYSBuZXcgVFZpZXcgZm9yXG4gICAgICAgICAgICAgIC8vIGVhY2ggaW5zZXJ0LiBUaGlzIGlzIG5vdCBpZGVhbCBzaW5jZSB3ZSBzaG91bGQgYmUgc2hhcmluZyB0aGUgVFZpZXdzLlxuICAgICAgICAgICAgICAvLyBBbHNvIHRoZSBsb2dpYyBoZXJlIHNob3VsZCBiZSBzaGFyZWQgd2l0aCBgY29tcG9uZW50LnRzYCdzIGByZW5kZXJDb21wb25lbnRgXG4gICAgICAgICAgICAgIC8vIG1ldGhvZC5cbiAgICAgICAgICAgICAgdFZpZXcuZXhwYW5kb1N0YXJ0SW5kZXgrKztcbiAgICAgICAgICAgICAgdFZpZXcuYmx1ZXByaW50LnNwbGljZSgrK2luZGV4ICsgSEVBREVSX09GRlNFVCwgMCwgbnVsbCk7XG4gICAgICAgICAgICAgIHRWaWV3LmRhdGEuc3BsaWNlKGluZGV4ICsgSEVBREVSX09GRlNFVCwgMCwgbnVsbCk7XG4gICAgICAgICAgICAgIHJvb3RWaWV3LnNwbGljZShpbmRleCArIEhFQURFUl9PRkZTRVQsIDAsIG51bGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgdE5vZGUgPVxuICAgICAgICAgICAgICAgIGNyZWF0ZU5vZGVBdEluZGV4KGluZGV4LCBUTm9kZVR5cGUuRWxlbWVudCwgbm9kZUxpc3Rbal0gYXMgUkVsZW1lbnQsIG51bGwsIG51bGwpO1xuICAgICAgICAgICAgcHJldmlvdXNUTm9kZSA/IChwcmV2aW91c1ROb2RlLm5leHQgPSB0Tm9kZSkgOiAoZmlyc3RUTm9kZSA9IHROb2RlKTtcbiAgICAgICAgICAgIHByZXZpb3VzVE5vZGUgPSB0Tm9kZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcHJvamVjdGlvbi5wdXNoKGZpcnN0VE5vZGUgISk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gVE9ETzogc2hvdWxkIExpZmVjeWNsZUhvb2tzRmVhdHVyZSBhbmQgb3RoZXIgaG9zdCBmZWF0dXJlcyBiZSBnZW5lcmF0ZWQgYnkgdGhlIGNvbXBpbGVyIGFuZFxuICAgICAgLy8gZXhlY3V0ZWQgaGVyZT9cbiAgICAgIC8vIEFuZ3VsYXIgNSByZWZlcmVuY2U6IGh0dHBzOi8vc3RhY2tibGl0ei5jb20vZWRpdC9saWZlY3ljbGUtaG9va3MtdmNyZWZcbiAgICAgIGNvbXBvbmVudCA9IGNyZWF0ZVJvb3RDb21wb25lbnQoXG4gICAgICAgICAgY29tcG9uZW50VmlldywgdGhpcy5jb21wb25lbnREZWYsIHJvb3RWaWV3LCByb290Q29udGV4dCwgW0xpZmVjeWNsZUhvb2tzRmVhdHVyZV0pO1xuXG4gICAgICByZWZyZXNoRGVzY2VuZGFudFZpZXdzKHJvb3RWaWV3LCBSZW5kZXJGbGFncy5DcmVhdGUpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBsZWF2ZVZpZXcob2xkVmlldywgdHJ1ZSk7XG4gICAgICBpZiAocmVuZGVyZXJGYWN0b3J5LmVuZCkgcmVuZGVyZXJGYWN0b3J5LmVuZCgpO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbXBvbmVudFJlZiA9IG5ldyBDb21wb25lbnRSZWYoXG4gICAgICAgIHRoaXMuY29tcG9uZW50VHlwZSwgY29tcG9uZW50LFxuICAgICAgICBjcmVhdGVFbGVtZW50UmVmKHZpZXdFbmdpbmVfRWxlbWVudFJlZiwgdEVsZW1lbnROb2RlLCByb290VmlldyksIHJvb3RWaWV3LCB0RWxlbWVudE5vZGUpO1xuXG4gICAgaWYgKGlzSW50ZXJuYWxSb290Vmlldykge1xuICAgICAgLy8gVGhlIGhvc3QgZWxlbWVudCBvZiB0aGUgaW50ZXJuYWwgcm9vdCB2aWV3IGlzIGF0dGFjaGVkIHRvIHRoZSBjb21wb25lbnQncyBob3N0IHZpZXcgbm9kZVxuICAgICAgY29tcG9uZW50UmVmLmhvc3RWaWV3Ll90Vmlld05vZGUgIS5jaGlsZCA9IHRFbGVtZW50Tm9kZTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbXBvbmVudFJlZjtcbiAgfVxufVxuXG5jb25zdCBjb21wb25lbnRGYWN0b3J5UmVzb2x2ZXI6IENvbXBvbmVudEZhY3RvcnlSZXNvbHZlciA9IG5ldyBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIoKTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyIGFuZCBzdG9yZXMgaXQgb24gdGhlIGluamVjdG9yLiBPciwgaWYgdGhlXG4gKiBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXJcbiAqIGFscmVhZHkgZXhpc3RzLCByZXRyaWV2ZXMgdGhlIGV4aXN0aW5nIENvbXBvbmVudEZhY3RvcnlSZXNvbHZlci5cbiAqXG4gKiBAcmV0dXJucyBUaGUgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyIGluc3RhbmNlIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0Q29tcG9uZW50RmFjdG9yeVJlc29sdmVyKCk6IHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyIHtcbiAgcmV0dXJuIGNvbXBvbmVudEZhY3RvcnlSZXNvbHZlcjtcbn1cblxuLyoqXG4gKiBSZXByZXNlbnRzIGFuIGluc3RhbmNlIG9mIGEgQ29tcG9uZW50IGNyZWF0ZWQgdmlhIGEge0BsaW5rIENvbXBvbmVudEZhY3Rvcnl9LlxuICpcbiAqIGBDb21wb25lbnRSZWZgIHByb3ZpZGVzIGFjY2VzcyB0byB0aGUgQ29tcG9uZW50IEluc3RhbmNlIGFzIHdlbGwgb3RoZXIgb2JqZWN0cyByZWxhdGVkIHRvIHRoaXNcbiAqIENvbXBvbmVudCBJbnN0YW5jZSBhbmQgYWxsb3dzIHlvdSB0byBkZXN0cm95IHRoZSBDb21wb25lbnQgSW5zdGFuY2UgdmlhIHRoZSB7QGxpbmsgI2Rlc3Ryb3l9XG4gKiBtZXRob2QuXG4gKlxuICovXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50UmVmPFQ+IGV4dGVuZHMgdmlld0VuZ2luZV9Db21wb25lbnRSZWY8VD4ge1xuICBkZXN0cm95Q2JzOiAoKCkgPT4gdm9pZClbXXxudWxsID0gW107XG4gIGluc3RhbmNlOiBUO1xuICBob3N0VmlldzogVmlld1JlZjxUPjtcbiAgY2hhbmdlRGV0ZWN0b3JSZWY6IFZpZXdFbmdpbmVfQ2hhbmdlRGV0ZWN0b3JSZWY7XG4gIGNvbXBvbmVudFR5cGU6IFR5cGU8VD47XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBjb21wb25lbnRUeXBlOiBUeXBlPFQ+LCBpbnN0YW5jZTogVCwgcHVibGljIGxvY2F0aW9uOiB2aWV3RW5naW5lX0VsZW1lbnRSZWYsXG4gICAgICBwcml2YXRlIF9yb290VmlldzogTFZpZXdEYXRhLFxuICAgICAgcHJpdmF0ZSBfdE5vZGU6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxURWxlbWVudENvbnRhaW5lck5vZGUpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuaW5zdGFuY2UgPSBpbnN0YW5jZTtcbiAgICB0aGlzLmhvc3RWaWV3ID0gdGhpcy5jaGFuZ2VEZXRlY3RvclJlZiA9IG5ldyBSb290Vmlld1JlZjxUPihfcm9vdFZpZXcpO1xuICAgIHRoaXMuaG9zdFZpZXcuX3RWaWV3Tm9kZSA9IGNyZWF0ZVZpZXdOb2RlKC0xLCBfcm9vdFZpZXcpO1xuICAgIHRoaXMuY29tcG9uZW50VHlwZSA9IGNvbXBvbmVudFR5cGU7XG4gIH1cblxuICBnZXQgaW5qZWN0b3IoKTogSW5qZWN0b3IgeyByZXR1cm4gbmV3IE5vZGVJbmplY3Rvcih0aGlzLl90Tm9kZSwgdGhpcy5fcm9vdFZpZXcpOyB9XG5cbiAgZGVzdHJveSgpOiB2b2lkIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh0aGlzLmRlc3Ryb3lDYnMsICdOZ01vZHVsZSBhbHJlYWR5IGRlc3Ryb3llZCcpO1xuICAgIHRoaXMuZGVzdHJveUNicyAhLmZvckVhY2goZm4gPT4gZm4oKSk7XG4gICAgdGhpcy5kZXN0cm95Q2JzID0gbnVsbDtcbiAgfVxuICBvbkRlc3Ryb3koY2FsbGJhY2s6ICgpID0+IHZvaWQpOiB2b2lkIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh0aGlzLmRlc3Ryb3lDYnMsICdOZ01vZHVsZSBhbHJlYWR5IGRlc3Ryb3llZCcpO1xuICAgIHRoaXMuZGVzdHJveUNicyAhLnB1c2goY2FsbGJhY2spO1xuICB9XG59XG4iXX0=