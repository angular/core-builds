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
import { VERSION } from '../version';
import { assertComponentType, assertDefined } from './assert';
import { LifecycleHooksFeature, createRootComponent, createRootComponentView, createRootContext } from './component';
import { getComponentDef } from './definition';
import { NodeInjector } from './di';
import { createLViewData, createNodeAtIndex, createTView, createViewNode, elementCreate, locateHostElement, refreshDescendantViews } from './instructions';
import { domRendererFactory3, isProceduralRenderer } from './interfaces/renderer';
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
        if (rootSelectorOrNode && hostRNode) {
            ngDevMode && ngDevMode.rendererSetAttribute++;
            isProceduralRenderer(renderer) ?
                renderer.setAttribute(hostRNode, 'ng-version', VERSION.full) :
                hostRNode.setAttribute('ng-version', VERSION.full);
        }
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50X3JlZi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvY29tcG9uZW50X3JlZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVNBLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUVyRCxPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFDcEQsT0FBTyxFQUFDLGdCQUFnQixJQUFJLDJCQUEyQixFQUFFLFlBQVksSUFBSSx1QkFBdUIsRUFBQyxNQUFNLDZCQUE2QixDQUFDO0FBQ3JJLE9BQU8sRUFBQyx3QkFBd0IsSUFBSSxtQ0FBbUMsRUFBQyxNQUFNLHNDQUFzQyxDQUFDO0FBQ3JILE9BQU8sRUFBQyxVQUFVLElBQUkscUJBQXFCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUUxRSxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFFL0MsT0FBTyxFQUFDLE9BQU8sRUFBQyxNQUFNLFlBQVksQ0FBQztBQUNuQyxPQUFPLEVBQUMsbUJBQW1CLEVBQUUsYUFBYSxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzVELE9BQU8sRUFBQyxxQkFBcUIsRUFBRSxtQkFBbUIsRUFBRSx1QkFBdUIsRUFBRSxpQkFBaUIsRUFBQyxNQUFNLGFBQWEsQ0FBQztBQUNuSCxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBQzdDLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDbEMsT0FBTyxFQUFDLGVBQWUsRUFBRSxpQkFBaUIsRUFBRSxXQUFXLEVBQUUsY0FBYyxFQUFFLGFBQWEsRUFBRSxpQkFBaUIsRUFBRSxzQkFBc0IsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBR3pKLE9BQU8sRUFBNkIsbUJBQW1CLEVBQUUsb0JBQW9CLEVBQUMsTUFBTSx1QkFB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QUErQixFQUNuRSxXQUNBO1FBQ1YsS0FBSyxFQUFFLENBQUM7UUFIc0MsYUFBUSxHQUFSLFFBQVEsQ0FBdUI7UUFDbkUsY0FBUyxHQUFULFNBQVM7UUFDVCxXQUFNLEdBQU4sTUFBTTtRQVRsQixrQkFBa0MsRUFBRSxDQUFDO1FBV25DLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksV0FBVyxDQUFJLFNBQVMsQ0FBQyxDQUFDO1FBQ3ZFLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxHQUFHLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUN6RCxJQUFJLENBQUMsYUFBYSxHQUFHLGFBQWEsQ0FBQztLQUNwQzs7OztJQUVELElBQUksUUFBUSxLQUFlLE9BQU8sSUFBSSxZQUFZLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRTs7OztJQUVsRixPQUFPO1FBQ0wsU0FBUyxJQUFJLGFBQWEsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLDRCQUE0QixDQUFDLENBQUM7VUFDMUUsSUFBSSxDQUFDLFVBQVUsR0FBRyxPQUFPLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDcEMsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7S0FDeEI7Ozs7O0lBQ0QsU0FBUyxDQUFDLFFBQW9CO1FBQzVCLFNBQVMsSUFBSSxhQUFhLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSw0QkFBNEIsQ0FBQyxDQUFDO1VBQzFFLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLFFBQVE7S0FDaEM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtDaGFuZ2VEZXRlY3RvclJlZiBhcyBWaWV3RW5naW5lX0NoYW5nZURldGVjdG9yUmVmfSBmcm9tICcuLi9jaGFuZ2VfZGV0ZWN0aW9uL2NoYW5nZV9kZXRlY3Rvcl9yZWYnO1xuaW1wb3J0IHtJbmplY3Rpb25Ub2tlbn0gZnJvbSAnLi4vZGkvaW5qZWN0aW9uX3Rva2VuJztcbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4uL2RpL2luamVjdG9yJztcbmltcG9ydCB7aW5qZWN0fSBmcm9tICcuLi9kaS9pbmplY3Rvcl9jb21wYXRpYmlsaXR5JztcbmltcG9ydCB7Q29tcG9uZW50RmFjdG9yeSBhcyB2aWV3RW5naW5lX0NvbXBvbmVudEZhY3RvcnksIENvbXBvbmVudFJlZiBhcyB2aWV3RW5naW5lX0NvbXBvbmVudFJlZn0gZnJvbSAnLi4vbGlua2VyL2NvbXBvbmVudF9mYWN0b3J5JztcbmltcG9ydCB7Q29tcG9uZW50RmFjdG9yeVJlc29sdmVyIGFzIHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyfSBmcm9tICcuLi9saW5rZXIvY29tcG9uZW50X2ZhY3RvcnlfcmVzb2x2ZXInO1xuaW1wb3J0IHtFbGVtZW50UmVmIGFzIHZpZXdFbmdpbmVfRWxlbWVudFJlZn0gZnJvbSAnLi4vbGlua2VyL2VsZW1lbnRfcmVmJztcbmltcG9ydCB7TmdNb2R1bGVSZWYgYXMgdmlld0VuZ2luZV9OZ01vZHVsZVJlZn0gZnJvbSAnLi4vbGlua2VyL25nX21vZHVsZV9mYWN0b3J5JztcbmltcG9ydCB7UmVuZGVyZXJGYWN0b3J5Mn0gZnJvbSAnLi4vcmVuZGVyL2FwaSc7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL3R5cGUnO1xuaW1wb3J0IHtWRVJTSU9OfSBmcm9tICcuLi92ZXJzaW9uJztcbmltcG9ydCB7YXNzZXJ0Q29tcG9uZW50VHlwZSwgYXNzZXJ0RGVmaW5lZH0gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHtMaWZlY3ljbGVIb29rc0ZlYXR1cmUsIGNyZWF0ZVJvb3RDb21wb25lbnQsIGNyZWF0ZVJvb3RDb21wb25lbnRWaWV3LCBjcmVhdGVSb290Q29udGV4dH0gZnJvbSAnLi9jb21wb25lbnQnO1xuaW1wb3J0IHtnZXRDb21wb25lbnREZWZ9IGZyb20gJy4vZGVmaW5pdGlvbic7XG5pbXBvcnQge05vZGVJbmplY3Rvcn0gZnJvbSAnLi9kaSc7XG5pbXBvcnQge2NyZWF0ZUxWaWV3RGF0YSwgY3JlYXRlTm9kZUF0SW5kZXgsIGNyZWF0ZVRWaWV3LCBjcmVhdGVWaWV3Tm9kZSwgZWxlbWVudENyZWF0ZSwgbG9jYXRlSG9zdEVsZW1lbnQsIHJlZnJlc2hEZXNjZW5kYW50Vmlld3N9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zJztcbmltcG9ydCB7Q29tcG9uZW50RGVmLCBSZW5kZXJGbGFnc30gZnJvbSAnLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtUQ29udGFpbmVyTm9kZSwgVEVsZW1lbnRDb250YWluZXJOb2RlLCBURWxlbWVudE5vZGUsIFROb2RlLCBUTm9kZVR5cGV9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7UkVsZW1lbnQsIFJlbmRlcmVyRmFjdG9yeTMsIGRvbVJlbmRlcmVyRmFjdG9yeTMsIGlzUHJvY2VkdXJhbFJlbmRlcmVyfSBmcm9tICcuL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtIRUFERVJfT0ZGU0VULCBMVmlld0RhdGEsIExWaWV3RmxhZ3MsIFJvb3RDb250ZXh0LCBUVklFV30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtlbnRlclZpZXcsIGxlYXZlVmlld30gZnJvbSAnLi9zdGF0ZSc7XG5pbXBvcnQge2RlZmF1bHRTY2hlZHVsZXIsIGdldFROb2RlfSBmcm9tICcuL3V0aWwnO1xuaW1wb3J0IHtjcmVhdGVFbGVtZW50UmVmfSBmcm9tICcuL3ZpZXdfZW5naW5lX2NvbXBhdGliaWxpdHknO1xuaW1wb3J0IHtSb290Vmlld1JlZiwgVmlld1JlZn0gZnJvbSAnLi92aWV3X3JlZic7XG5cbmV4cG9ydCBjbGFzcyBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIgZXh0ZW5kcyB2aWV3RW5naW5lX0NvbXBvbmVudEZhY3RvcnlSZXNvbHZlciB7XG4gIHJlc29sdmVDb21wb25lbnRGYWN0b3J5PFQ+KGNvbXBvbmVudDogVHlwZTxUPik6IHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeTxUPiB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydENvbXBvbmVudFR5cGUoY29tcG9uZW50KTtcbiAgICBjb25zdCBjb21wb25lbnREZWYgPSBnZXRDb21wb25lbnREZWYoY29tcG9uZW50KSAhO1xuICAgIHJldHVybiBuZXcgQ29tcG9uZW50RmFjdG9yeShjb21wb25lbnREZWYpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHRvUmVmQXJyYXkobWFwOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfSk6IHtwcm9wTmFtZTogc3RyaW5nOyB0ZW1wbGF0ZU5hbWU6IHN0cmluZzt9W10ge1xuICBjb25zdCBhcnJheToge3Byb3BOYW1lOiBzdHJpbmc7IHRlbXBsYXRlTmFtZTogc3RyaW5nO31bXSA9IFtdO1xuICBmb3IgKGxldCBub25NaW5pZmllZCBpbiBtYXApIHtcbiAgICBpZiAobWFwLmhhc093blByb3BlcnR5KG5vbk1pbmlmaWVkKSkge1xuICAgICAgY29uc3QgbWluaWZpZWQgPSBtYXBbbm9uTWluaWZpZWRdO1xuICAgICAgYXJyYXkucHVzaCh7cHJvcE5hbWU6IG1pbmlmaWVkLCB0ZW1wbGF0ZU5hbWU6IG5vbk1pbmlmaWVkfSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBhcnJheTtcbn1cblxuLyoqXG4gKiBEZWZhdWx0IHtAbGluayBSb290Q29udGV4dH0gZm9yIGFsbCBjb21wb25lbnRzIHJlbmRlcmVkIHdpdGgge0BsaW5rIHJlbmRlckNvbXBvbmVudH0uXG4gKi9cbmV4cG9ydCBjb25zdCBST09UX0NPTlRFWFQgPSBuZXcgSW5qZWN0aW9uVG9rZW48Um9vdENvbnRleHQ+KFxuICAgICdST09UX0NPTlRFWFRfVE9LRU4nLFxuICAgIHtwcm92aWRlZEluOiAncm9vdCcsIGZhY3Rvcnk6ICgpID0+IGNyZWF0ZVJvb3RDb250ZXh0KGluamVjdChTQ0hFRFVMRVIpKX0pO1xuXG4vKipcbiAqIEEgY2hhbmdlIGRldGVjdGlvbiBzY2hlZHVsZXIgdG9rZW4gZm9yIHtAbGluayBSb290Q29udGV4dH0uIFRoaXMgdG9rZW4gaXMgdGhlIGRlZmF1bHQgdmFsdWUgdXNlZFxuICogZm9yIHRoZSBkZWZhdWx0IGBSb290Q29udGV4dGAgZm91bmQgaW4gdGhlIHtAbGluayBST09UX0NPTlRFWFR9IHRva2VuLlxuICovXG5leHBvcnQgY29uc3QgU0NIRURVTEVSID0gbmV3IEluamVjdGlvblRva2VuPCgoZm46ICgpID0+IHZvaWQpID0+IHZvaWQpPignU0NIRURVTEVSX1RPS0VOJywge1xuICBwcm92aWRlZEluOiAncm9vdCcsXG4gIGZhY3Rvcnk6ICgpID0+IGRlZmF1bHRTY2hlZHVsZXIsXG59KTtcblxuLyoqXG4gKiBBIGZ1bmN0aW9uIHVzZWQgdG8gd3JhcCB0aGUgYFJlbmRlcmVyRmFjdG9yeTJgLlxuICogVXNlZCBpbiB0ZXN0cyB0byBjaGFuZ2UgdGhlIGBSZW5kZXJlckZhY3RvcnkyYCBpbnRvIGEgYERlYnVnUmVuZGVyZXJGYWN0b3J5MmAuXG4gKi9cbmV4cG9ydCBjb25zdCBXUkFQX1JFTkRFUkVSX0ZBQ1RPUlkyID1cbiAgICBuZXcgSW5qZWN0aW9uVG9rZW48KHJmOiBSZW5kZXJlckZhY3RvcnkyKSA9PiBSZW5kZXJlckZhY3RvcnkyPignV1JBUF9SRU5ERVJFUl9GQUNUT1JZMicpO1xuXG5jb25zdCBOT1RfRk9VTkRfQ0hFQ0tfT05MWV9FTEVNRU5UX0lOSkVDVE9SID0ge307XG5cbmZ1bmN0aW9uIGNyZWF0ZUNoYWluZWRJbmplY3Rvcihyb290Vmlld0luamVjdG9yOiBJbmplY3RvciwgbW9kdWxlSW5qZWN0b3I6IEluamVjdG9yKTogSW5qZWN0b3Ige1xuICByZXR1cm4ge1xuICAgIGdldDogPFQ+KHRva2VuOiBUeXBlPFQ+fCBJbmplY3Rpb25Ub2tlbjxUPiwgbm90Rm91bmRWYWx1ZT86IFQpOiBUID0+IHtcbiAgICAgIGNvbnN0IHZhbHVlID0gcm9vdFZpZXdJbmplY3Rvci5nZXQodG9rZW4sIE5PVF9GT1VORF9DSEVDS19PTkxZX0VMRU1FTlRfSU5KRUNUT1IpO1xuXG4gICAgICBpZiAodmFsdWUgIT09IE5PVF9GT1VORF9DSEVDS19PTkxZX0VMRU1FTlRfSU5KRUNUT1IpIHtcbiAgICAgICAgLy8gUmV0dXJuIHRoZSB2YWx1ZSBmcm9tIHRoZSByb290IGVsZW1lbnQgaW5qZWN0b3Igd2hlblxuICAgICAgICAvLyAtIGl0IHByb3ZpZGVzIGl0XG4gICAgICAgIC8vICAgKHZhbHVlICE9PSBOT1RfRk9VTkRfQ0hFQ0tfT05MWV9FTEVNRU5UX0lOSkVDVE9SKVxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBtb2R1bGVJbmplY3Rvci5nZXQodG9rZW4sIG5vdEZvdW5kVmFsdWUpO1xuICAgIH1cbiAgfTtcbn1cblxuLyoqXG4gKiBSZW5kZXIzIGltcGxlbWVudGF0aW9uIG9mIHtAbGluayB2aWV3RW5naW5lX0NvbXBvbmVudEZhY3Rvcnl9LlxuICovXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50RmFjdG9yeTxUPiBleHRlbmRzIHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeTxUPiB7XG4gIHNlbGVjdG9yOiBzdHJpbmc7XG4gIGNvbXBvbmVudFR5cGU6IFR5cGU8YW55PjtcbiAgbmdDb250ZW50U2VsZWN0b3JzOiBzdHJpbmdbXTtcblxuICBnZXQgaW5wdXRzKCk6IHtwcm9wTmFtZTogc3RyaW5nOyB0ZW1wbGF0ZU5hbWU6IHN0cmluZzt9W10ge1xuICAgIHJldHVybiB0b1JlZkFycmF5KHRoaXMuY29tcG9uZW50RGVmLmlucHV0cyk7XG4gIH1cblxuICBnZXQgb3V0cHV0cygpOiB7cHJvcE5hbWU6IHN0cmluZzsgdGVtcGxhdGVOYW1lOiBzdHJpbmc7fVtdIHtcbiAgICByZXR1cm4gdG9SZWZBcnJheSh0aGlzLmNvbXBvbmVudERlZi5vdXRwdXRzKTtcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgY29tcG9uZW50RGVmOiBDb21wb25lbnREZWY8YW55Pikge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5jb21wb25lbnRUeXBlID0gY29tcG9uZW50RGVmLnR5cGU7XG4gICAgdGhpcy5zZWxlY3RvciA9IGNvbXBvbmVudERlZi5zZWxlY3RvcnNbMF1bMF0gYXMgc3RyaW5nO1xuICAgIHRoaXMubmdDb250ZW50U2VsZWN0b3JzID0gW107XG4gIH1cblxuICBjcmVhdGUoXG4gICAgICBpbmplY3RvcjogSW5qZWN0b3IsIHByb2plY3RhYmxlTm9kZXM/OiBhbnlbXVtdfHVuZGVmaW5lZCwgcm9vdFNlbGVjdG9yT3JOb2RlPzogYW55LFxuICAgICAgbmdNb2R1bGU/OiB2aWV3RW5naW5lX05nTW9kdWxlUmVmPGFueT58dW5kZWZpbmVkKTogdmlld0VuZ2luZV9Db21wb25lbnRSZWY8VD4ge1xuICAgIGNvbnN0IGlzSW50ZXJuYWxSb290VmlldyA9IHJvb3RTZWxlY3Rvck9yTm9kZSA9PT0gdW5kZWZpbmVkO1xuXG4gICAgbGV0IHJlbmRlcmVyRmFjdG9yeTogUmVuZGVyZXJGYWN0b3J5MztcblxuICAgIGlmIChuZ01vZHVsZSkge1xuICAgICAgY29uc3Qgd3JhcHBlciA9IG5nTW9kdWxlLmluamVjdG9yLmdldChXUkFQX1JFTkRFUkVSX0ZBQ1RPUlkyLCAodjogUmVuZGVyZXJGYWN0b3J5MikgPT4gdik7XG4gICAgICByZW5kZXJlckZhY3RvcnkgPSB3cmFwcGVyKG5nTW9kdWxlLmluamVjdG9yLmdldChSZW5kZXJlckZhY3RvcnkyKSkgYXMgUmVuZGVyZXJGYWN0b3J5MztcbiAgICB9IGVsc2Uge1xuICAgICAgcmVuZGVyZXJGYWN0b3J5ID0gZG9tUmVuZGVyZXJGYWN0b3J5MztcbiAgICB9XG5cbiAgICBjb25zdCBob3N0Uk5vZGUgPSBpc0ludGVybmFsUm9vdFZpZXcgP1xuICAgICAgICBlbGVtZW50Q3JlYXRlKHRoaXMuc2VsZWN0b3IsIHJlbmRlcmVyRmFjdG9yeS5jcmVhdGVSZW5kZXJlcihudWxsLCB0aGlzLmNvbXBvbmVudERlZikpIDpcbiAgICAgICAgbG9jYXRlSG9zdEVsZW1lbnQocmVuZGVyZXJGYWN0b3J5LCByb290U2VsZWN0b3JPck5vZGUpO1xuXG4gICAgY29uc3Qgcm9vdEZsYWdzID0gdGhpcy5jb21wb25lbnREZWYub25QdXNoID8gTFZpZXdGbGFncy5EaXJ0eSB8IExWaWV3RmxhZ3MuSXNSb290IDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzIHwgTFZpZXdGbGFncy5Jc1Jvb3Q7XG4gICAgY29uc3Qgcm9vdENvbnRleHQ6IFJvb3RDb250ZXh0ID1cbiAgICAgICAgbmdNb2R1bGUgJiYgIWlzSW50ZXJuYWxSb290VmlldyA/IG5nTW9kdWxlLmluamVjdG9yLmdldChST09UX0NPTlRFWFQpIDogY3JlYXRlUm9vdENvbnRleHQoKTtcblxuICAgIGNvbnN0IHJlbmRlcmVyID0gcmVuZGVyZXJGYWN0b3J5LmNyZWF0ZVJlbmRlcmVyKGhvc3RSTm9kZSwgdGhpcy5jb21wb25lbnREZWYpO1xuICAgIGNvbnN0IHJvb3RWaWV3SW5qZWN0b3IgPVxuICAgICAgICBuZ01vZHVsZSA/IGNyZWF0ZUNoYWluZWRJbmplY3RvcihpbmplY3RvciwgbmdNb2R1bGUuaW5qZWN0b3IpIDogaW5qZWN0b3I7XG5cbiAgICBpZiAocm9vdFNlbGVjdG9yT3JOb2RlICYmIGhvc3RSTm9kZSkge1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldEF0dHJpYnV0ZSsrO1xuICAgICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID9cbiAgICAgICAgICByZW5kZXJlci5zZXRBdHRyaWJ1dGUoaG9zdFJOb2RlLCAnbmctdmVyc2lvbicsIFZFUlNJT04uZnVsbCkgOlxuICAgICAgICAgIGhvc3RSTm9kZS5zZXRBdHRyaWJ1dGUoJ25nLXZlcnNpb24nLCBWRVJTSU9OLmZ1bGwpO1xuICAgIH1cblxuICAgIC8vIENyZWF0ZSB0aGUgcm9vdCB2aWV3LiBVc2VzIGVtcHR5IFRWaWV3IGFuZCBDb250ZW50VGVtcGxhdGUuXG4gICAgY29uc3Qgcm9vdFZpZXc6IExWaWV3RGF0YSA9IGNyZWF0ZUxWaWV3RGF0YShcbiAgICAgICAgcmVuZGVyZXIsIGNyZWF0ZVRWaWV3KC0xLCBudWxsLCAxLCAwLCBudWxsLCBudWxsLCBudWxsKSwgcm9vdENvbnRleHQsIHJvb3RGbGFncywgdW5kZWZpbmVkLFxuICAgICAgICByb290Vmlld0luamVjdG9yKTtcblxuICAgIC8vIHJvb3RWaWV3IGlzIHRoZSBwYXJlbnQgd2hlbiBib290c3RyYXBwaW5nXG4gICAgY29uc3Qgb2xkVmlldyA9IGVudGVyVmlldyhyb290VmlldywgbnVsbCk7XG5cbiAgICBsZXQgY29tcG9uZW50OiBUO1xuICAgIGxldCB0RWxlbWVudE5vZGU6IFRFbGVtZW50Tm9kZTtcbiAgICB0cnkge1xuICAgICAgaWYgKHJlbmRlcmVyRmFjdG9yeS5iZWdpbikgcmVuZGVyZXJGYWN0b3J5LmJlZ2luKCk7XG5cbiAgICAgIGNvbnN0IGNvbXBvbmVudFZpZXcgPVxuICAgICAgICAgIGNyZWF0ZVJvb3RDb21wb25lbnRWaWV3KGhvc3RSTm9kZSwgdGhpcy5jb21wb25lbnREZWYsIHJvb3RWaWV3LCByZW5kZXJlcik7XG4gICAgICB0RWxlbWVudE5vZGUgPSBnZXRUTm9kZSgwLCByb290VmlldykgYXMgVEVsZW1lbnROb2RlO1xuXG4gICAgICAvLyBUcmFuc2Zvcm0gdGhlIGFycmF5cyBvZiBuYXRpdmUgbm9kZXMgaW50byBhIHN0cnVjdHVyZSB0aGF0IGNhbiBiZSBjb25zdW1lZCBieSB0aGVcbiAgICAgIC8vIHByb2plY3Rpb24gaW5zdHJ1Y3Rpb24uIFRoaXMgaXMgbmVlZGVkIHRvIHN1cHBvcnQgdGhlIHJlcHJvamVjdGlvbiBvZiB0aGVzZSBub2Rlcy5cbiAgICAgIGlmIChwcm9qZWN0YWJsZU5vZGVzKSB7XG4gICAgICAgIGxldCBpbmRleCA9IDA7XG4gICAgICAgIGNvbnN0IHRWaWV3ID0gcm9vdFZpZXdbVFZJRVddO1xuICAgICAgICBjb25zdCBwcm9qZWN0aW9uOiBUTm9kZVtdID0gdEVsZW1lbnROb2RlLnByb2plY3Rpb24gPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcm9qZWN0YWJsZU5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgY29uc3Qgbm9kZUxpc3QgPSBwcm9qZWN0YWJsZU5vZGVzW2ldO1xuICAgICAgICAgIGxldCBmaXJzdFROb2RlOiBUTm9kZXxudWxsID0gbnVsbDtcbiAgICAgICAgICBsZXQgcHJldmlvdXNUTm9kZTogVE5vZGV8bnVsbCA9IG51bGw7XG4gICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBub2RlTGlzdC5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgaWYgKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgICAgICAgICAgIC8vIEZvciBkeW5hbWljYWxseSBjcmVhdGVkIGNvbXBvbmVudHMgc3VjaCBhcyBDb21wb25lbnRSZWYsIHdlIGNyZWF0ZSBhIG5ldyBUVmlldyBmb3JcbiAgICAgICAgICAgICAgLy8gZWFjaCBpbnNlcnQuIFRoaXMgaXMgbm90IGlkZWFsIHNpbmNlIHdlIHNob3VsZCBiZSBzaGFyaW5nIHRoZSBUVmlld3MuXG4gICAgICAgICAgICAgIC8vIEFsc28gdGhlIGxvZ2ljIGhlcmUgc2hvdWxkIGJlIHNoYXJlZCB3aXRoIGBjb21wb25lbnQudHNgJ3MgYHJlbmRlckNvbXBvbmVudGBcbiAgICAgICAgICAgICAgLy8gbWV0aG9kLlxuICAgICAgICAgICAgICB0Vmlldy5leHBhbmRvU3RhcnRJbmRleCsrO1xuICAgICAgICAgICAgICB0Vmlldy5ibHVlcHJpbnQuc3BsaWNlKCsraW5kZXggKyBIRUFERVJfT0ZGU0VULCAwLCBudWxsKTtcbiAgICAgICAgICAgICAgdFZpZXcuZGF0YS5zcGxpY2UoaW5kZXggKyBIRUFERVJfT0ZGU0VULCAwLCBudWxsKTtcbiAgICAgICAgICAgICAgcm9vdFZpZXcuc3BsaWNlKGluZGV4ICsgSEVBREVSX09GRlNFVCwgMCwgbnVsbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCB0Tm9kZSA9XG4gICAgICAgICAgICAgICAgY3JlYXRlTm9kZUF0SW5kZXgoaW5kZXgsIFROb2RlVHlwZS5FbGVtZW50LCBub2RlTGlzdFtqXSBhcyBSRWxlbWVudCwgbnVsbCwgbnVsbCk7XG4gICAgICAgICAgICBwcmV2aW91c1ROb2RlID8gKHByZXZpb3VzVE5vZGUubmV4dCA9IHROb2RlKSA6IChmaXJzdFROb2RlID0gdE5vZGUpO1xuICAgICAgICAgICAgcHJldmlvdXNUTm9kZSA9IHROb2RlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBwcm9qZWN0aW9uLnB1c2goZmlyc3RUTm9kZSAhKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBUT0RPOiBzaG91bGQgTGlmZWN5Y2xlSG9va3NGZWF0dXJlIGFuZCBvdGhlciBob3N0IGZlYXR1cmVzIGJlIGdlbmVyYXRlZCBieSB0aGUgY29tcGlsZXIgYW5kXG4gICAgICAvLyBleGVjdXRlZCBoZXJlP1xuICAgICAgLy8gQW5ndWxhciA1IHJlZmVyZW5jZTogaHR0cHM6Ly9zdGFja2JsaXR6LmNvbS9lZGl0L2xpZmVjeWNsZS1ob29rcy12Y3JlZlxuICAgICAgY29tcG9uZW50ID0gY3JlYXRlUm9vdENvbXBvbmVudChcbiAgICAgICAgICBjb21wb25lbnRWaWV3LCB0aGlzLmNvbXBvbmVudERlZiwgcm9vdFZpZXcsIHJvb3RDb250ZXh0LCBbTGlmZWN5Y2xlSG9va3NGZWF0dXJlXSk7XG5cbiAgICAgIHJlZnJlc2hEZXNjZW5kYW50Vmlld3Mocm9vdFZpZXcsIFJlbmRlckZsYWdzLkNyZWF0ZSk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIGxlYXZlVmlldyhvbGRWaWV3LCB0cnVlKTtcbiAgICAgIGlmIChyZW5kZXJlckZhY3RvcnkuZW5kKSByZW5kZXJlckZhY3RvcnkuZW5kKCk7XG4gICAgfVxuXG4gICAgY29uc3QgY29tcG9uZW50UmVmID0gbmV3IENvbXBvbmVudFJlZihcbiAgICAgICAgdGhpcy5jb21wb25lbnRUeXBlLCBjb21wb25lbnQsXG4gICAgICAgIGNyZWF0ZUVsZW1lbnRSZWYodmlld0VuZ2luZV9FbGVtZW50UmVmLCB0RWxlbWVudE5vZGUsIHJvb3RWaWV3KSwgcm9vdFZpZXcsIHRFbGVtZW50Tm9kZSk7XG5cbiAgICBpZiAoaXNJbnRlcm5hbFJvb3RWaWV3KSB7XG4gICAgICAvLyBUaGUgaG9zdCBlbGVtZW50IG9mIHRoZSBpbnRlcm5hbCByb290IHZpZXcgaXMgYXR0YWNoZWQgdG8gdGhlIGNvbXBvbmVudCdzIGhvc3QgdmlldyBub2RlXG4gICAgICBjb21wb25lbnRSZWYuaG9zdFZpZXcuX3RWaWV3Tm9kZSAhLmNoaWxkID0gdEVsZW1lbnROb2RlO1xuICAgIH1cbiAgICByZXR1cm4gY29tcG9uZW50UmVmO1xuICB9XG59XG5cbmNvbnN0IGNvbXBvbmVudEZhY3RvcnlSZXNvbHZlcjogQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyID0gbmV3IENvbXBvbmVudEZhY3RvcnlSZXNvbHZlcigpO1xuXG4vKipcbiAqIENyZWF0ZXMgYSBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIgYW5kIHN0b3JlcyBpdCBvbiB0aGUgaW5qZWN0b3IuIE9yLCBpZiB0aGVcbiAqIENvbXBvbmVudEZhY3RvcnlSZXNvbHZlclxuICogYWxyZWFkeSBleGlzdHMsIHJldHJpZXZlcyB0aGUgZXhpc3RpbmcgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyLlxuICpcbiAqIEByZXR1cm5zIFRoZSBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIoKTogdmlld0VuZ2luZV9Db21wb25lbnRGYWN0b3J5UmVzb2x2ZXIge1xuICByZXR1cm4gY29tcG9uZW50RmFjdG9yeVJlc29sdmVyO1xufVxuXG4vKipcbiAqIFJlcHJlc2VudHMgYW4gaW5zdGFuY2Ugb2YgYSBDb21wb25lbnQgY3JlYXRlZCB2aWEgYSB7QGxpbmsgQ29tcG9uZW50RmFjdG9yeX0uXG4gKlxuICogYENvbXBvbmVudFJlZmAgcHJvdmlkZXMgYWNjZXNzIHRvIHRoZSBDb21wb25lbnQgSW5zdGFuY2UgYXMgd2VsbCBvdGhlciBvYmplY3RzIHJlbGF0ZWQgdG8gdGhpc1xuICogQ29tcG9uZW50IEluc3RhbmNlIGFuZCBhbGxvd3MgeW91IHRvIGRlc3Ryb3kgdGhlIENvbXBvbmVudCBJbnN0YW5jZSB2aWEgdGhlIHtAbGluayAjZGVzdHJveX1cbiAqIG1ldGhvZC5cbiAqXG4gKi9cbmV4cG9ydCBjbGFzcyBDb21wb25lbnRSZWY8VD4gZXh0ZW5kcyB2aWV3RW5naW5lX0NvbXBvbmVudFJlZjxUPiB7XG4gIGRlc3Ryb3lDYnM6ICgoKSA9PiB2b2lkKVtdfG51bGwgPSBbXTtcbiAgaW5zdGFuY2U6IFQ7XG4gIGhvc3RWaWV3OiBWaWV3UmVmPFQ+O1xuICBjaGFuZ2VEZXRlY3RvclJlZjogVmlld0VuZ2luZV9DaGFuZ2VEZXRlY3RvclJlZjtcbiAgY29tcG9uZW50VHlwZTogVHlwZTxUPjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIGNvbXBvbmVudFR5cGU6IFR5cGU8VD4sIGluc3RhbmNlOiBULCBwdWJsaWMgbG9jYXRpb246IHZpZXdFbmdpbmVfRWxlbWVudFJlZixcbiAgICAgIHByaXZhdGUgX3Jvb3RWaWV3OiBMVmlld0RhdGEsXG4gICAgICBwcml2YXRlIF90Tm9kZTogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZSkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5pbnN0YW5jZSA9IGluc3RhbmNlO1xuICAgIHRoaXMuaG9zdFZpZXcgPSB0aGlzLmNoYW5nZURldGVjdG9yUmVmID0gbmV3IFJvb3RWaWV3UmVmPFQ+KF9yb290Vmlldyk7XG4gICAgdGhpcy5ob3N0Vmlldy5fdFZpZXdOb2RlID0gY3JlYXRlVmlld05vZGUoLTEsIF9yb290Vmlldyk7XG4gICAgdGhpcy5jb21wb25lbnRUeXBlID0gY29tcG9uZW50VHlwZTtcbiAgfVxuXG4gIGdldCBpbmplY3RvcigpOiBJbmplY3RvciB7IHJldHVybiBuZXcgTm9kZUluamVjdG9yKHRoaXMuX3ROb2RlLCB0aGlzLl9yb290Vmlldyk7IH1cblxuICBkZXN0cm95KCk6IHZvaWQge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHRoaXMuZGVzdHJveUNicywgJ05nTW9kdWxlIGFscmVhZHkgZGVzdHJveWVkJyk7XG4gICAgdGhpcy5kZXN0cm95Q2JzICEuZm9yRWFjaChmbiA9PiBmbigpKTtcbiAgICB0aGlzLmRlc3Ryb3lDYnMgPSBudWxsO1xuICB9XG4gIG9uRGVzdHJveShjYWxsYmFjazogKCkgPT4gdm9pZCk6IHZvaWQge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHRoaXMuZGVzdHJveUNicywgJ05nTW9kdWxlIGFscmVhZHkgZGVzdHJveWVkJyk7XG4gICAgdGhpcy5kZXN0cm95Q2JzICEucHVzaChjYWxsYmFjayk7XG4gIH1cbn1cbiJdfQ==