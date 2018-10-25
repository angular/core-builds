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
import { inject } from '../di/injector';
import { ComponentFactory as viewEngine_ComponentFactory, ComponentRef as viewEngine_ComponentRef } from '../linker/component_factory';
import { ComponentFactoryResolver as viewEngine_ComponentFactoryResolver } from '../linker/component_factory_resolver';
import { ElementRef as viewEngine_ElementRef } from '../linker/element_ref';
import { RendererFactory2 } from '../render/api';
import { assertComponentType, assertDefined } from './assert';
import { LifecycleHooksFeature, createRootComponent, createRootComponentView, createRootContext } from './component';
import { getComponentDef } from './definition';
import { createLViewData, createNodeAtIndex, createTView, createViewNode, elementCreate, locateHostElement, renderEmbeddedTemplate } from './instructions';
import { domRendererFactory3 } from './interfaces/renderer';
import { FLAGS, HEADER_OFFSET, INJECTOR, TVIEW } from './interfaces/view';
import { enterView } from './state';
import { getTNode } from './util';
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
    factory: () => {
        /** @type {?} */
        const useRaf = typeof requestAnimationFrame !== 'undefined' && typeof window !== 'undefined';
        return useRaf ? requestAnimationFrame.bind(window) : setTimeout;
    },
});
/** *
 * A function used to wrap the `RendererFactory2`.
 * Used in tests to change the `RendererFactory2` into a `DebugRendererFactory2`.
  @type {?} */
export const WRAP_RENDERER_FACTORY2 = new InjectionToken('WRAP_RENDERER_FACTORY2');
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
        const rootContext = ngModule && !isInternalRootView ?
            ngModule.injector.get(ROOT_CONTEXT) :
            createRootContext(requestAnimationFrame.bind(window));
        /** @type {?} */
        const renderer = rendererFactory.createRenderer(hostRNode, this.componentDef);
        /** @type {?} */
        const rootView = createLViewData(renderer, createTView(-1, null, 1, 0, null, null, null), rootContext, rootFlags);
        rootView[INJECTOR] = ngModule && ngModule.injector || null;
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
            component = createRootComponent(hostRNode, componentView, this.componentDef, rootView, rootContext, [LifecycleHooksFeature]);
            // Execute the template in creation mode only, and then turn off the CreationMode flag
            renderEmbeddedTemplate(componentView, componentView[TVIEW], component, 1 /* Create */);
            componentView[FLAGS] &= ~1 /* CreationMode */;
        }
        finally {
            enterView(oldView, null);
            if (rendererFactory.end)
                rendererFactory.end();
        }
        /** @type {?} */
        const componentRef = new ComponentRef(this.componentType, component, rootView, injector, createElementRef(viewEngine_ElementRef, tElementNode, rootView));
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
     * @param {?} rootView
     * @param {?} injector
     * @param {?} location
     */
    constructor(componentType, instance, rootView, injector, location) {
        super();
        this.location = location;
        this.destroyCbs = [];
        this.instance = instance;
        this.hostView = this.changeDetectorRef = new RootViewRef(rootView);
        this.hostView._tViewNode = createViewNode(-1, rootView);
        this.injector = injector;
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
if (false) {
    /** @type {?} */
    ComponentRef.prototype.destroyCbs;
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
    /** @type {?} */
    ComponentRef.prototype.location;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50X3JlZi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvY29tcG9uZW50X3JlZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVNBLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUNyRCxPQUFPLEVBQVcsTUFBTSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDaEQsT0FBTyxFQUFDLGdCQUFnQixJQUFJLDJCQUEyQixFQUFFLFlBQVksSUFBSSx1QkFBdUIsRUFBQyxNQUFNLDZCQUE2QixDQUFDO0FBQ3JJLE9BQU8sRUFBQyx3QkFBd0IsSUFBSSxtQ0FBbUMsRUFBQyxNQUFNLHNDQUFzQyxDQUFDO0FBQ3JILE9BQU8sRUFBQyxVQUFVLElBQUkscUJBQXFCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUUxRSxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFHL0MsT0FBTyxFQUFDLG1CQUFtQixFQUFFLGFBQWEsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUM1RCxPQUFPLEVBQUMscUJBQXFCLEVBQUUsbUJBQW1CLEVBQUUsdUJBQXVCLEVBQUUsaUJBQWlCLEVBQUMsTUFBTSxhQUFhLENBQUM7QUFDbkgsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUM3QyxPQUFPLEVBQUMsZUFBZSxFQUFFLGlCQUFpQixFQUFFLFdBQVcsRUFBRSxjQUFjLEVBQUUsYUFBYSxFQUFFLGlCQUFpQixFQUFFLHNCQUFzQixFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFHekosT0FBTyxFQUE2QixtQkFBbUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3RGLE9BQU8sRUFBQyxLQUFLLEVBQUUsYUFBYSxFQUFFLFFBQVEsRUFBc0MsS0FBSyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDNUcsT0FBTyxF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QUMsRUFBRSxFQUFFO1FBQ3BDLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO0tBQ3hCOzs7OztJQUNELFNBQVMsQ0FBQyxRQUFvQjtRQUM1QixTQUFTLElBQUksYUFBYSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsNEJBQTRCLENBQUMsQ0FBQztVQUMxRSxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxRQUFRO0tBQ2hDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Q2hhbmdlRGV0ZWN0b3JSZWYgYXMgVmlld0VuZ2luZV9DaGFuZ2VEZXRlY3RvclJlZn0gZnJvbSAnLi4vY2hhbmdlX2RldGVjdGlvbi9jaGFuZ2VfZGV0ZWN0b3JfcmVmJztcbmltcG9ydCB7SW5qZWN0aW9uVG9rZW59IGZyb20gJy4uL2RpL2luamVjdGlvbl90b2tlbic7XG5pbXBvcnQge0luamVjdG9yLCBpbmplY3R9IGZyb20gJy4uL2RpL2luamVjdG9yJztcbmltcG9ydCB7Q29tcG9uZW50RmFjdG9yeSBhcyB2aWV3RW5naW5lX0NvbXBvbmVudEZhY3RvcnksIENvbXBvbmVudFJlZiBhcyB2aWV3RW5naW5lX0NvbXBvbmVudFJlZn0gZnJvbSAnLi4vbGlua2VyL2NvbXBvbmVudF9mYWN0b3J5JztcbmltcG9ydCB7Q29tcG9uZW50RmFjdG9yeVJlc29sdmVyIGFzIHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyfSBmcm9tICcuLi9saW5rZXIvY29tcG9uZW50X2ZhY3RvcnlfcmVzb2x2ZXInO1xuaW1wb3J0IHtFbGVtZW50UmVmIGFzIHZpZXdFbmdpbmVfRWxlbWVudFJlZn0gZnJvbSAnLi4vbGlua2VyL2VsZW1lbnRfcmVmJztcbmltcG9ydCB7TmdNb2R1bGVSZWYgYXMgdmlld0VuZ2luZV9OZ01vZHVsZVJlZn0gZnJvbSAnLi4vbGlua2VyL25nX21vZHVsZV9mYWN0b3J5JztcbmltcG9ydCB7UmVuZGVyZXJGYWN0b3J5Mn0gZnJvbSAnLi4vcmVuZGVyL2FwaSc7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL3R5cGUnO1xuXG5pbXBvcnQge2Fzc2VydENvbXBvbmVudFR5cGUsIGFzc2VydERlZmluZWR9IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7TGlmZWN5Y2xlSG9va3NGZWF0dXJlLCBjcmVhdGVSb290Q29tcG9uZW50LCBjcmVhdGVSb290Q29tcG9uZW50VmlldywgY3JlYXRlUm9vdENvbnRleHR9IGZyb20gJy4vY29tcG9uZW50JztcbmltcG9ydCB7Z2V0Q29tcG9uZW50RGVmfSBmcm9tICcuL2RlZmluaXRpb24nO1xuaW1wb3J0IHtjcmVhdGVMVmlld0RhdGEsIGNyZWF0ZU5vZGVBdEluZGV4LCBjcmVhdGVUVmlldywgY3JlYXRlVmlld05vZGUsIGVsZW1lbnRDcmVhdGUsIGxvY2F0ZUhvc3RFbGVtZW50LCByZW5kZXJFbWJlZGRlZFRlbXBsYXRlfSBmcm9tICcuL2luc3RydWN0aW9ucyc7XG5pbXBvcnQge0NvbXBvbmVudERlZiwgUmVuZGVyRmxhZ3N9IGZyb20gJy4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7VEVsZW1lbnROb2RlLCBUTm9kZSwgVE5vZGVUeXBlLCBUVmlld05vZGV9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7UkVsZW1lbnQsIFJlbmRlcmVyRmFjdG9yeTMsIGRvbVJlbmRlcmVyRmFjdG9yeTN9IGZyb20gJy4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge0ZMQUdTLCBIRUFERVJfT0ZGU0VULCBJTkpFQ1RPUiwgTFZpZXdEYXRhLCBMVmlld0ZsYWdzLCBSb290Q29udGV4dCwgVFZJRVd9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7ZW50ZXJWaWV3fSBmcm9tICcuL3N0YXRlJztcbmltcG9ydCB7Z2V0VE5vZGV9IGZyb20gJy4vdXRpbCc7XG5pbXBvcnQge2NyZWF0ZUVsZW1lbnRSZWZ9IGZyb20gJy4vdmlld19lbmdpbmVfY29tcGF0aWJpbGl0eSc7XG5pbXBvcnQge1Jvb3RWaWV3UmVmLCBWaWV3UmVmfSBmcm9tICcuL3ZpZXdfcmVmJztcblxuZXhwb3J0IGNsYXNzIENvbXBvbmVudEZhY3RvcnlSZXNvbHZlciBleHRlbmRzIHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyIHtcbiAgcmVzb2x2ZUNvbXBvbmVudEZhY3Rvcnk8VD4oY29tcG9uZW50OiBUeXBlPFQ+KTogdmlld0VuZ2luZV9Db21wb25lbnRGYWN0b3J5PFQ+IHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Q29tcG9uZW50VHlwZShjb21wb25lbnQpO1xuICAgIGNvbnN0IGNvbXBvbmVudERlZiA9IGdldENvbXBvbmVudERlZihjb21wb25lbnQpICE7XG4gICAgcmV0dXJuIG5ldyBDb21wb25lbnRGYWN0b3J5KGNvbXBvbmVudERlZik7XG4gIH1cbn1cblxuZnVuY3Rpb24gdG9SZWZBcnJheShtYXA6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9KToge3Byb3BOYW1lOiBzdHJpbmc7IHRlbXBsYXRlTmFtZTogc3RyaW5nO31bXSB7XG4gIGNvbnN0IGFycmF5OiB7cHJvcE5hbWU6IHN0cmluZzsgdGVtcGxhdGVOYW1lOiBzdHJpbmc7fVtdID0gW107XG4gIGZvciAobGV0IG5vbk1pbmlmaWVkIGluIG1hcCkge1xuICAgIGlmIChtYXAuaGFzT3duUHJvcGVydHkobm9uTWluaWZpZWQpKSB7XG4gICAgICBjb25zdCBtaW5pZmllZCA9IG1hcFtub25NaW5pZmllZF07XG4gICAgICBhcnJheS5wdXNoKHtwcm9wTmFtZTogbWluaWZpZWQsIHRlbXBsYXRlTmFtZTogbm9uTWluaWZpZWR9KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGFycmF5O1xufVxuXG4vKipcbiAqIERlZmF1bHQge0BsaW5rIFJvb3RDb250ZXh0fSBmb3IgYWxsIGNvbXBvbmVudHMgcmVuZGVyZWQgd2l0aCB7QGxpbmsgcmVuZGVyQ29tcG9uZW50fS5cbiAqL1xuZXhwb3J0IGNvbnN0IFJPT1RfQ09OVEVYVCA9IG5ldyBJbmplY3Rpb25Ub2tlbjxSb290Q29udGV4dD4oXG4gICAgJ1JPT1RfQ09OVEVYVF9UT0tFTicsXG4gICAge3Byb3ZpZGVkSW46ICdyb290JywgZmFjdG9yeTogKCkgPT4gY3JlYXRlUm9vdENvbnRleHQoaW5qZWN0KFNDSEVEVUxFUikpfSk7XG5cbi8qKlxuICogQSBjaGFuZ2UgZGV0ZWN0aW9uIHNjaGVkdWxlciB0b2tlbiBmb3Ige0BsaW5rIFJvb3RDb250ZXh0fS4gVGhpcyB0b2tlbiBpcyB0aGUgZGVmYXVsdCB2YWx1ZSB1c2VkXG4gKiBmb3IgdGhlIGRlZmF1bHQgYFJvb3RDb250ZXh0YCBmb3VuZCBpbiB0aGUge0BsaW5rIFJPT1RfQ09OVEVYVH0gdG9rZW4uXG4gKi9cbmV4cG9ydCBjb25zdCBTQ0hFRFVMRVIgPSBuZXcgSW5qZWN0aW9uVG9rZW48KChmbjogKCkgPT4gdm9pZCkgPT4gdm9pZCk+KCdTQ0hFRFVMRVJfVE9LRU4nLCB7XG4gIHByb3ZpZGVkSW46ICdyb290JyxcbiAgZmFjdG9yeTogKCkgPT4ge1xuICAgIGNvbnN0IHVzZVJhZiA9IHR5cGVvZiByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnO1xuICAgIHJldHVybiB1c2VSYWYgPyByZXF1ZXN0QW5pbWF0aW9uRnJhbWUuYmluZCh3aW5kb3cpIDogc2V0VGltZW91dDtcbiAgfSxcbn0pO1xuXG4vKipcbiAqIEEgZnVuY3Rpb24gdXNlZCB0byB3cmFwIHRoZSBgUmVuZGVyZXJGYWN0b3J5MmAuXG4gKiBVc2VkIGluIHRlc3RzIHRvIGNoYW5nZSB0aGUgYFJlbmRlcmVyRmFjdG9yeTJgIGludG8gYSBgRGVidWdSZW5kZXJlckZhY3RvcnkyYC5cbiAqL1xuZXhwb3J0IGNvbnN0IFdSQVBfUkVOREVSRVJfRkFDVE9SWTIgPVxuICAgIG5ldyBJbmplY3Rpb25Ub2tlbjwocmY6IFJlbmRlcmVyRmFjdG9yeTIpID0+IFJlbmRlcmVyRmFjdG9yeTI+KCdXUkFQX1JFTkRFUkVSX0ZBQ1RPUlkyJyk7XG5cbi8qKlxuICogUmVuZGVyMyBpbXBsZW1lbnRhdGlvbiBvZiB7QGxpbmsgdmlld0VuZ2luZV9Db21wb25lbnRGYWN0b3J5fS5cbiAqL1xuZXhwb3J0IGNsYXNzIENvbXBvbmVudEZhY3Rvcnk8VD4gZXh0ZW5kcyB2aWV3RW5naW5lX0NvbXBvbmVudEZhY3Rvcnk8VD4ge1xuICBzZWxlY3Rvcjogc3RyaW5nO1xuICBjb21wb25lbnRUeXBlOiBUeXBlPGFueT47XG4gIG5nQ29udGVudFNlbGVjdG9yczogc3RyaW5nW107XG5cbiAgZ2V0IGlucHV0cygpOiB7cHJvcE5hbWU6IHN0cmluZzsgdGVtcGxhdGVOYW1lOiBzdHJpbmc7fVtdIHtcbiAgICByZXR1cm4gdG9SZWZBcnJheSh0aGlzLmNvbXBvbmVudERlZi5pbnB1dHMpO1xuICB9XG5cbiAgZ2V0IG91dHB1dHMoKToge3Byb3BOYW1lOiBzdHJpbmc7IHRlbXBsYXRlTmFtZTogc3RyaW5nO31bXSB7XG4gICAgcmV0dXJuIHRvUmVmQXJyYXkodGhpcy5jb21wb25lbnREZWYub3V0cHV0cyk7XG4gIH1cblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGNvbXBvbmVudERlZjogQ29tcG9uZW50RGVmPGFueT4pIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuY29tcG9uZW50VHlwZSA9IGNvbXBvbmVudERlZi50eXBlO1xuICAgIHRoaXMuc2VsZWN0b3IgPSBjb21wb25lbnREZWYuc2VsZWN0b3JzWzBdWzBdIGFzIHN0cmluZztcbiAgICB0aGlzLm5nQ29udGVudFNlbGVjdG9ycyA9IFtdO1xuICB9XG5cbiAgY3JlYXRlKFxuICAgICAgaW5qZWN0b3I6IEluamVjdG9yLCBwcm9qZWN0YWJsZU5vZGVzPzogYW55W11bXXx1bmRlZmluZWQsIHJvb3RTZWxlY3Rvck9yTm9kZT86IGFueSxcbiAgICAgIG5nTW9kdWxlPzogdmlld0VuZ2luZV9OZ01vZHVsZVJlZjxhbnk+fHVuZGVmaW5lZCk6IHZpZXdFbmdpbmVfQ29tcG9uZW50UmVmPFQ+IHtcbiAgICBjb25zdCBpc0ludGVybmFsUm9vdFZpZXcgPSByb290U2VsZWN0b3JPck5vZGUgPT09IHVuZGVmaW5lZDtcblxuICAgIGxldCByZW5kZXJlckZhY3Rvcnk6IFJlbmRlcmVyRmFjdG9yeTM7XG5cbiAgICBpZiAobmdNb2R1bGUpIHtcbiAgICAgIGNvbnN0IHdyYXBwZXIgPSBuZ01vZHVsZS5pbmplY3Rvci5nZXQoV1JBUF9SRU5ERVJFUl9GQUNUT1JZMiwgKHY6IFJlbmRlcmVyRmFjdG9yeTIpID0+IHYpO1xuICAgICAgcmVuZGVyZXJGYWN0b3J5ID0gd3JhcHBlcihuZ01vZHVsZS5pbmplY3Rvci5nZXQoUmVuZGVyZXJGYWN0b3J5MikpIGFzIFJlbmRlcmVyRmFjdG9yeTM7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlbmRlcmVyRmFjdG9yeSA9IGRvbVJlbmRlcmVyRmFjdG9yeTM7XG4gICAgfVxuXG4gICAgY29uc3QgaG9zdFJOb2RlID0gaXNJbnRlcm5hbFJvb3RWaWV3ID9cbiAgICAgICAgZWxlbWVudENyZWF0ZSh0aGlzLnNlbGVjdG9yLCByZW5kZXJlckZhY3RvcnkuY3JlYXRlUmVuZGVyZXIobnVsbCwgdGhpcy5jb21wb25lbnREZWYpKSA6XG4gICAgICAgIGxvY2F0ZUhvc3RFbGVtZW50KHJlbmRlcmVyRmFjdG9yeSwgcm9vdFNlbGVjdG9yT3JOb2RlKTtcblxuICAgIGNvbnN0IHJvb3RGbGFncyA9IHRoaXMuY29tcG9uZW50RGVmLm9uUHVzaCA/IExWaWV3RmxhZ3MuRGlydHkgfCBMVmlld0ZsYWdzLklzUm9vdCA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTFZpZXdGbGFncy5DaGVja0Fsd2F5cyB8IExWaWV3RmxhZ3MuSXNSb290O1xuICAgIGNvbnN0IHJvb3RDb250ZXh0OiBSb290Q29udGV4dCA9IG5nTW9kdWxlICYmICFpc0ludGVybmFsUm9vdFZpZXcgP1xuICAgICAgICBuZ01vZHVsZS5pbmplY3Rvci5nZXQoUk9PVF9DT05URVhUKSA6XG4gICAgICAgIGNyZWF0ZVJvb3RDb250ZXh0KHJlcXVlc3RBbmltYXRpb25GcmFtZS5iaW5kKHdpbmRvdykpO1xuXG4gICAgY29uc3QgcmVuZGVyZXIgPSByZW5kZXJlckZhY3RvcnkuY3JlYXRlUmVuZGVyZXIoaG9zdFJOb2RlLCB0aGlzLmNvbXBvbmVudERlZik7XG4gICAgLy8gQ3JlYXRlIHRoZSByb290IHZpZXcuIFVzZXMgZW1wdHkgVFZpZXcgYW5kIENvbnRlbnRUZW1wbGF0ZS5cbiAgICBjb25zdCByb290VmlldzogTFZpZXdEYXRhID0gY3JlYXRlTFZpZXdEYXRhKFxuICAgICAgICByZW5kZXJlciwgY3JlYXRlVFZpZXcoLTEsIG51bGwsIDEsIDAsIG51bGwsIG51bGwsIG51bGwpLCByb290Q29udGV4dCwgcm9vdEZsYWdzKTtcbiAgICByb290Vmlld1tJTkpFQ1RPUl0gPSBuZ01vZHVsZSAmJiBuZ01vZHVsZS5pbmplY3RvciB8fCBudWxsO1xuXG4gICAgLy8gcm9vdFZpZXcgaXMgdGhlIHBhcmVudCB3aGVuIGJvb3RzdHJhcHBpbmdcbiAgICBjb25zdCBvbGRWaWV3ID0gZW50ZXJWaWV3KHJvb3RWaWV3LCBudWxsKTtcblxuICAgIGxldCBjb21wb25lbnQ6IFQ7XG4gICAgbGV0IHRFbGVtZW50Tm9kZTogVEVsZW1lbnROb2RlO1xuICAgIHRyeSB7XG4gICAgICBpZiAocmVuZGVyZXJGYWN0b3J5LmJlZ2luKSByZW5kZXJlckZhY3RvcnkuYmVnaW4oKTtcblxuICAgICAgY29uc3QgY29tcG9uZW50VmlldyA9XG4gICAgICAgICAgY3JlYXRlUm9vdENvbXBvbmVudFZpZXcoaG9zdFJOb2RlLCB0aGlzLmNvbXBvbmVudERlZiwgcm9vdFZpZXcsIHJlbmRlcmVyKTtcbiAgICAgIHRFbGVtZW50Tm9kZSA9IGdldFROb2RlKDAsIHJvb3RWaWV3KSBhcyBURWxlbWVudE5vZGU7XG5cbiAgICAgIC8vIFRyYW5zZm9ybSB0aGUgYXJyYXlzIG9mIG5hdGl2ZSBub2RlcyBpbnRvIGEgc3RydWN0dXJlIHRoYXQgY2FuIGJlIGNvbnN1bWVkIGJ5IHRoZVxuICAgICAgLy8gcHJvamVjdGlvbiBpbnN0cnVjdGlvbi4gVGhpcyBpcyBuZWVkZWQgdG8gc3VwcG9ydCB0aGUgcmVwcm9qZWN0aW9uIG9mIHRoZXNlIG5vZGVzLlxuICAgICAgaWYgKHByb2plY3RhYmxlTm9kZXMpIHtcbiAgICAgICAgbGV0IGluZGV4ID0gMDtcbiAgICAgICAgY29uc3QgdFZpZXcgPSByb290Vmlld1tUVklFV107XG4gICAgICAgIGNvbnN0IHByb2plY3Rpb246IFROb2RlW10gPSB0RWxlbWVudE5vZGUucHJvamVjdGlvbiA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByb2plY3RhYmxlTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBub2RlTGlzdCA9IHByb2plY3RhYmxlTm9kZXNbaV07XG4gICAgICAgICAgbGV0IGZpcnN0VE5vZGU6IFROb2RlfG51bGwgPSBudWxsO1xuICAgICAgICAgIGxldCBwcmV2aW91c1ROb2RlOiBUTm9kZXxudWxsID0gbnVsbDtcbiAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IG5vZGVMaXN0Lmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICBpZiAodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICAgICAgICAgICAgLy8gRm9yIGR5bmFtaWNhbGx5IGNyZWF0ZWQgY29tcG9uZW50cyBzdWNoIGFzIENvbXBvbmVudFJlZiwgd2UgY3JlYXRlIGEgbmV3IFRWaWV3IGZvclxuICAgICAgICAgICAgICAvLyBlYWNoIGluc2VydC4gVGhpcyBpcyBub3QgaWRlYWwgc2luY2Ugd2Ugc2hvdWxkIGJlIHNoYXJpbmcgdGhlIFRWaWV3cy5cbiAgICAgICAgICAgICAgLy8gQWxzbyB0aGUgbG9naWMgaGVyZSBzaG91bGQgYmUgc2hhcmVkIHdpdGggYGNvbXBvbmVudC50c2AncyBgcmVuZGVyQ29tcG9uZW50YFxuICAgICAgICAgICAgICAvLyBtZXRob2QuXG4gICAgICAgICAgICAgIHRWaWV3LmV4cGFuZG9TdGFydEluZGV4Kys7XG4gICAgICAgICAgICAgIHRWaWV3LmJsdWVwcmludC5zcGxpY2UoKytpbmRleCArIEhFQURFUl9PRkZTRVQsIDAsIG51bGwpO1xuICAgICAgICAgICAgICB0Vmlldy5kYXRhLnNwbGljZShpbmRleCArIEhFQURFUl9PRkZTRVQsIDAsIG51bGwpO1xuICAgICAgICAgICAgICByb290Vmlldy5zcGxpY2UoaW5kZXggKyBIRUFERVJfT0ZGU0VULCAwLCBudWxsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHROb2RlID1cbiAgICAgICAgICAgICAgICBjcmVhdGVOb2RlQXRJbmRleChpbmRleCwgVE5vZGVUeXBlLkVsZW1lbnQsIG5vZGVMaXN0W2pdIGFzIFJFbGVtZW50LCBudWxsLCBudWxsKTtcbiAgICAgICAgICAgIHByZXZpb3VzVE5vZGUgPyAocHJldmlvdXNUTm9kZS5uZXh0ID0gdE5vZGUpIDogKGZpcnN0VE5vZGUgPSB0Tm9kZSk7XG4gICAgICAgICAgICBwcmV2aW91c1ROb2RlID0gdE5vZGU7XG4gICAgICAgICAgfVxuICAgICAgICAgIHByb2plY3Rpb24ucHVzaChmaXJzdFROb2RlICEpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFRPRE86IHNob3VsZCBMaWZlY3ljbGVIb29rc0ZlYXR1cmUgYW5kIG90aGVyIGhvc3QgZmVhdHVyZXMgYmUgZ2VuZXJhdGVkIGJ5IHRoZSBjb21waWxlciBhbmRcbiAgICAgIC8vIGV4ZWN1dGVkIGhlcmU/XG4gICAgICAvLyBBbmd1bGFyIDUgcmVmZXJlbmNlOiBodHRwczovL3N0YWNrYmxpdHouY29tL2VkaXQvbGlmZWN5Y2xlLWhvb2tzLXZjcmVmXG4gICAgICBjb21wb25lbnQgPSBjcmVhdGVSb290Q29tcG9uZW50KFxuICAgICAgICAgIGhvc3RSTm9kZSwgY29tcG9uZW50VmlldywgdGhpcy5jb21wb25lbnREZWYsIHJvb3RWaWV3LCByb290Q29udGV4dCxcbiAgICAgICAgICBbTGlmZWN5Y2xlSG9va3NGZWF0dXJlXSk7XG5cbiAgICAgIC8vIEV4ZWN1dGUgdGhlIHRlbXBsYXRlIGluIGNyZWF0aW9uIG1vZGUgb25seSwgYW5kIHRoZW4gdHVybiBvZmYgdGhlIENyZWF0aW9uTW9kZSBmbGFnXG4gICAgICByZW5kZXJFbWJlZGRlZFRlbXBsYXRlKGNvbXBvbmVudFZpZXcsIGNvbXBvbmVudFZpZXdbVFZJRVddLCBjb21wb25lbnQsIFJlbmRlckZsYWdzLkNyZWF0ZSk7XG4gICAgICBjb21wb25lbnRWaWV3W0ZMQUdTXSAmPSB+TFZpZXdGbGFncy5DcmVhdGlvbk1vZGU7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIGVudGVyVmlldyhvbGRWaWV3LCBudWxsKTtcbiAgICAgIGlmIChyZW5kZXJlckZhY3RvcnkuZW5kKSByZW5kZXJlckZhY3RvcnkuZW5kKCk7XG4gICAgfVxuXG4gICAgY29uc3QgY29tcG9uZW50UmVmID0gbmV3IENvbXBvbmVudFJlZihcbiAgICAgICAgdGhpcy5jb21wb25lbnRUeXBlLCBjb21wb25lbnQsIHJvb3RWaWV3LCBpbmplY3RvcixcbiAgICAgICAgY3JlYXRlRWxlbWVudFJlZih2aWV3RW5naW5lX0VsZW1lbnRSZWYsIHRFbGVtZW50Tm9kZSwgcm9vdFZpZXcpKTtcblxuICAgIGlmIChpc0ludGVybmFsUm9vdFZpZXcpIHtcbiAgICAgIC8vIFRoZSBob3N0IGVsZW1lbnQgb2YgdGhlIGludGVybmFsIHJvb3QgdmlldyBpcyBhdHRhY2hlZCB0byB0aGUgY29tcG9uZW50J3MgaG9zdCB2aWV3IG5vZGVcbiAgICAgIGNvbXBvbmVudFJlZi5ob3N0Vmlldy5fdFZpZXdOb2RlICEuY2hpbGQgPSB0RWxlbWVudE5vZGU7XG4gICAgfVxuICAgIHJldHVybiBjb21wb25lbnRSZWY7XG4gIH1cbn1cblxuY29uc3QgY29tcG9uZW50RmFjdG9yeVJlc29sdmVyOiBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIgPSBuZXcgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyKCk7XG5cbi8qKlxuICogQ3JlYXRlcyBhIENvbXBvbmVudEZhY3RvcnlSZXNvbHZlciBhbmQgc3RvcmVzIGl0IG9uIHRoZSBpbmplY3Rvci4gT3IsIGlmIHRoZVxuICogQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyXG4gKiBhbHJlYWR5IGV4aXN0cywgcmV0cmlldmVzIHRoZSBleGlzdGluZyBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIuXG4gKlxuICogQHJldHVybnMgVGhlIENvbXBvbmVudEZhY3RvcnlSZXNvbHZlciBpbnN0YW5jZSB0byB1c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdENvbXBvbmVudEZhY3RvcnlSZXNvbHZlcigpOiB2aWV3RW5naW5lX0NvbXBvbmVudEZhY3RvcnlSZXNvbHZlciB7XG4gIHJldHVybiBjb21wb25lbnRGYWN0b3J5UmVzb2x2ZXI7XG59XG5cbi8qKlxuICogUmVwcmVzZW50cyBhbiBpbnN0YW5jZSBvZiBhIENvbXBvbmVudCBjcmVhdGVkIHZpYSBhIHtAbGluayBDb21wb25lbnRGYWN0b3J5fS5cbiAqXG4gKiBgQ29tcG9uZW50UmVmYCBwcm92aWRlcyBhY2Nlc3MgdG8gdGhlIENvbXBvbmVudCBJbnN0YW5jZSBhcyB3ZWxsIG90aGVyIG9iamVjdHMgcmVsYXRlZCB0byB0aGlzXG4gKiBDb21wb25lbnQgSW5zdGFuY2UgYW5kIGFsbG93cyB5b3UgdG8gZGVzdHJveSB0aGUgQ29tcG9uZW50IEluc3RhbmNlIHZpYSB0aGUge0BsaW5rICNkZXN0cm95fVxuICogbWV0aG9kLlxuICpcbiAqL1xuZXhwb3J0IGNsYXNzIENvbXBvbmVudFJlZjxUPiBleHRlbmRzIHZpZXdFbmdpbmVfQ29tcG9uZW50UmVmPFQ+IHtcbiAgZGVzdHJveUNiczogKCgpID0+IHZvaWQpW118bnVsbCA9IFtdO1xuICBpbmplY3RvcjogSW5qZWN0b3I7XG4gIGluc3RhbmNlOiBUO1xuICBob3N0VmlldzogVmlld1JlZjxUPjtcbiAgY2hhbmdlRGV0ZWN0b3JSZWY6IFZpZXdFbmdpbmVfQ2hhbmdlRGV0ZWN0b3JSZWY7XG4gIGNvbXBvbmVudFR5cGU6IFR5cGU8VD47XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBjb21wb25lbnRUeXBlOiBUeXBlPFQ+LCBpbnN0YW5jZTogVCwgcm9vdFZpZXc6IExWaWV3RGF0YSwgaW5qZWN0b3I6IEluamVjdG9yLFxuICAgICAgcHVibGljIGxvY2F0aW9uOiB2aWV3RW5naW5lX0VsZW1lbnRSZWYpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuaW5zdGFuY2UgPSBpbnN0YW5jZTtcbiAgICB0aGlzLmhvc3RWaWV3ID0gdGhpcy5jaGFuZ2VEZXRlY3RvclJlZiA9IG5ldyBSb290Vmlld1JlZjxUPihyb290Vmlldyk7XG4gICAgdGhpcy5ob3N0Vmlldy5fdFZpZXdOb2RlID0gY3JlYXRlVmlld05vZGUoLTEsIHJvb3RWaWV3KTtcbiAgICB0aGlzLmluamVjdG9yID0gaW5qZWN0b3I7XG4gICAgdGhpcy5jb21wb25lbnRUeXBlID0gY29tcG9uZW50VHlwZTtcbiAgfVxuXG4gIGRlc3Ryb3koKTogdm9pZCB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodGhpcy5kZXN0cm95Q2JzLCAnTmdNb2R1bGUgYWxyZWFkeSBkZXN0cm95ZWQnKTtcbiAgICB0aGlzLmRlc3Ryb3lDYnMgIS5mb3JFYWNoKGZuID0+IGZuKCkpO1xuICAgIHRoaXMuZGVzdHJveUNicyA9IG51bGw7XG4gIH1cbiAgb25EZXN0cm95KGNhbGxiYWNrOiAoKSA9PiB2b2lkKTogdm9pZCB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodGhpcy5kZXN0cm95Q2JzLCAnTmdNb2R1bGUgYWxyZWFkeSBkZXN0cm95ZWQnKTtcbiAgICB0aGlzLmRlc3Ryb3lDYnMgIS5wdXNoKGNhbGxiYWNrKTtcbiAgfVxufVxuIl19