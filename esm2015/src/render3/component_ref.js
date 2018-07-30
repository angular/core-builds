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
import { ElementRef } from '../linker/element_ref';
import { RendererFactory2 } from '../render/api';
import { assertComponentType, assertDefined } from './assert';
import { LifecycleHooksFeature, createRootContext } from './component';
import { baseDirectiveCreate, createLNode, createLViewData, createTView, elementCreate, enterView, hostElement, initChangeDetectorIfExisting, locateHostElement, renderEmbeddedTemplate } from './instructions';
import { domRendererFactory3 } from './interfaces/renderer';
import { CONTEXT, FLAGS, INJECTOR, TVIEW } from './interfaces/view';
import { ViewRef } from './view_ref';
export class ComponentFactoryResolver extends viewEngine_ComponentFactoryResolver {
    /**
     * @template T
     * @param {?} component
     * @return {?}
     */
    resolveComponentFactory(component) {
        ngDevMode && assertComponentType(component);
        /** @type {?} */
        const componentDef = (/** @type {?} */ (component)).ngComponentDef;
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
export const SCHEDULER = new InjectionToken('SCHEDULER_TOKEN', { providedIn: 'root', factory: () => requestAnimationFrame.bind(window) });
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
        const rendererFactory = ngModule ? ngModule.injector.get(RendererFactory2) : domRendererFactory3;
        /** @type {?} */
        const hostNode = isInternalRootView ?
            elementCreate(this.selector, rendererFactory.createRenderer(null, this.componentDef.rendererType)) :
            locateHostElement(rendererFactory, rootSelectorOrNode);
        /** @type {?} */
        const componentTag = /** @type {?} */ (((/** @type {?} */ ((this.componentDef.selectors))[0]))[0]);
        /** @type {?} */
        const rootContext = ngModule && !isInternalRootView ?
            ngModule.injector.get(ROOT_CONTEXT) :
            createRootContext(requestAnimationFrame.bind(window));
        /** @type {?} */
        const rootView = createLViewData(rendererFactory.createRenderer(hostNode, this.componentDef.rendererType), createTView(-1, null, null, null, null), rootContext, this.componentDef.onPush ? 4 /* Dirty */ : 2 /* CheckAlways */);
        rootView[INJECTOR] = ngModule && ngModule.injector || null;
        /** @type {?} */
        const oldView = enterView(rootView, /** @type {?} */ ((null)));
        /** @type {?} */
        let component;
        /** @type {?} */
        let elementNode;
        try {
            if (rendererFactory.begin)
                rendererFactory.begin();
            // Create element node at index 0 in data array
            elementNode = hostElement(componentTag, hostNode, this.componentDef);
            // Create directive instance with factory() and store at index 0 in directives array
            rootContext.components.push(component = /** @type {?} */ (baseDirectiveCreate(0, this.componentDef.factory(), this.componentDef)));
            initChangeDetectorIfExisting(elementNode.nodeInjector, component, /** @type {?} */ ((elementNode.data)));
            (/** @type {?} */ (elementNode.data))[CONTEXT] = component;
            // TODO: should LifecycleHooksFeature and other host features be generated by the compiler and
            // executed here?
            // Angular 5 reference: https://stackblitz.com/edit/lifecycle-hooks-vcref
            LifecycleHooksFeature(component, this.componentDef);
            // Transform the arrays of native nodes into a LNode structure that can be consumed by the
            // projection instruction. This is needed to support the reprojection of these nodes.
            if (projectableNodes) {
                /** @type {?} */
                let index = 0;
                /** @type {?} */
                const projection = elementNode.tNode.projection = [];
                for (let i = 0; i < projectableNodes.length; i++) {
                    /** @type {?} */
                    const nodeList = projectableNodes[i];
                    /** @type {?} */
                    let firstTNode = null;
                    /** @type {?} */
                    let previousTNode = null;
                    for (let j = 0; j < nodeList.length; j++) {
                        /** @type {?} */
                        const lNode = createLNode(++index, 3 /* Element */, /** @type {?} */ (nodeList[j]), null, null);
                        if (previousTNode) {
                            previousTNode.next = lNode.tNode;
                        }
                        else {
                            firstTNode = lNode.tNode;
                        }
                        previousTNode = lNode.tNode;
                    }
                    projection.push(/** @type {?} */ ((firstTNode)));
                }
            }
            // Execute the template in creation mode only, and then turn off the CreationMode flag
            renderEmbeddedTemplate(elementNode, /** @type {?} */ ((elementNode.data))[TVIEW], component, 1 /* Create */); /** @type {?} */
            ((elementNode.data))[FLAGS] &= ~1 /* CreationMode */;
        }
        finally {
            enterView(oldView, null);
            if (rendererFactory.end)
                rendererFactory.end();
        }
        /** @type {?} */
        const componentRef = new ComponentRef(this.componentType, component, rootView, injector, /** @type {?} */ ((hostNode)));
        if (isInternalRootView) {
            /** @type {?} */ ((
            // The host element of the internal root view is attached to the component's host view node
            componentRef.hostView._lViewNode)).tNode.child = elementNode.tNode;
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
        this.hostView._lViewNode = createLNode(-1, 2 /* View */, null, null, null, rootView);
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
if (false) {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50X3JlZi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvY29tcG9uZW50X3JlZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVNBLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUNyRCxPQUFPLEVBQVcsTUFBTSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDaEQsT0FBTyxFQUFDLGdCQUFnQixJQUFJLDJCQUEyQixFQUFFLFlBQVksSUFBSSx1QkFBdUIsRUFBQyxNQUFNLDZCQUE2QixDQUFDO0FBQ3JJLE9BQU8sRUFBQyx3QkFBd0IsSUFBSSxtQ0FBbUMsRUFBQyxNQUFNLHNDQUFzQyxDQUFDO0FBQ3JILE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUVqRCxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFHL0MsT0FBTyxFQUFDLG1CQUFtQixFQUFFLGFBQWEsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUM1RCxPQUFPLEVBQUMscUJBQXFCLEVBQUUsaUJBQWlCLEVBQUMsTUFBTSxhQUFhLENBQUM7QUFDckUsT0FBTyxFQUFDLG1CQUFtQixFQUFFLFdBQVcsRUFBRSxlQUFlLEVBQUUsV0FBVyxFQUFFLGFBQWEsRUFBRSxTQUFTLEVBQUUsV0FBVyxFQUFFLDRCQUE0QixFQUFFLGlCQUFpQixFQUFFLHNCQUFzQixFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFHOU0sT0FBTyxFQUFXLG1CQUFtQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDcEUsT0FBTyxFQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFzQyxLQUFLLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUN0RyxPQUFPLEVBQUMsT0FBTyxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBRW5DLE1BQU0sK0JBQWdDLFNBQVEsbUNBQW1DOzs7Ozs7SUFDL0UsdUJBQXVCLENBQUksU0FBa0I7UUFDM0MsU0FBUyxJQUFJLG1CQUFtQixDQUFDLFNBQVMsQ0FBQyxDQUFDOztRQUM1QyxNQUFNLFlBQVksR0FBRyxtQkFBQyxTQUE2QixFQUFDLENBQUMsY0FBYyxDQUFDO1FBQ3BFLE9BQU8sSUFBSSxnQkFBZ0IsQ0FBQyxZQUFZLENBQUMsQ0FBQztLQUMzQztDQUNGOzs7OztBQUVELG9CQUFvQixHQUE0Qjs7SUFDOUMsTUFBTSxLQUFLLEdBQWdELEVBQUUsQ0FBQztJQUM5RCxLQUFLLElBQUksV0FBVyxJQUFJLEdBQUcsRUFBRTtRQUMzQixJQUFJLEdBQUcsQ0FBQyxjQUFjLENBQUMsV0FBVyxDQUFDLEVBQUU7O1lBQ25DLE1BQU0sUUFBUSxHQUFHLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUNsQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUMsUUFBUSxFQUFFLFFBQVEsRUFBRSxZQUFZLEVBQUUsV0FBVyxFQUFDLENBQUMsQ0FBQztTQUM3RDtLQUNGO0lBQ0QsT0FBTyxLQUFLLENBQUM7Q0FDZDs7OztBQUtELGFBQWEsWUFBWSxHQUFHLElBQUksY0FBYyxDQUMxQyxvQkFBb0IsRUFDcEIsRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7Ozs7O0FBTS9FLGFBQWEsU0FBUyxHQUFHLElBQUksY0FBYyxDQUN2QyxpQkFBaUIsRUFBRSxFQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBQyxDQUFDLENBQUM7Ozs7O0FBS2hHLE1BQU0sdUJBQTJCLFNBQVEsMkJBQThCOzs7O0lBV3JFLFlBQW9CLFlBQXVDO1FBQ3pELEtBQUssRUFBRSxDQUFDO1FBRFUsaUJBQVksR0FBWixZQUFZLENBQTJCO1FBRXpELElBQUksQ0FBQyxhQUFhLEdBQUcsWUFBWSxDQUFDLElBQUksQ0FBQztRQUN2QyxJQUFJLENBQUMsUUFBUSxxQkFBRyxZQUFZLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBVyxDQUFBLENBQUM7UUFDdkQsSUFBSSxDQUFDLGtCQUFrQixHQUFHLEVBQUUsQ0FBQztLQUM5Qjs7OztJQVpELElBQUksTUFBTTtRQUNSLE9BQU8sVUFBVSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUM7S0FDN0M7Ozs7SUFDRCxJQUFJLE9BQU87UUFDVCxPQUFPLFVBQVUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0tBQzlDOzs7Ozs7OztJQVNELE1BQU0sQ0FDRixRQUFrQixFQUFFLGdCQUFvQyxFQUFFLGtCQUF3QixFQUNsRixRQUFnRDs7UUFDbEQsTUFBTSxrQkFBa0IsR0FBRyxrQkFBa0IsS0FBSyxTQUFTLENBQUM7O1FBRTVELE1BQU0sZUFBZSxHQUNqQixRQUFRLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDLG1CQUFtQixDQUFDOztRQUM3RSxNQUFNLFFBQVEsR0FBRyxrQkFBa0IsQ0FBQyxDQUFDO1lBQ2pDLGFBQWEsQ0FDVCxJQUFJLENBQUMsUUFBUSxFQUFFLGVBQWUsQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzFGLGlCQUFpQixDQUFDLGVBQWUsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDOztRQUczRCxNQUFNLFlBQVksMENBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxTQUFTLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBWTs7UUFFckUsTUFBTSxXQUFXLEdBQWdCLFFBQVEsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFDOUQsUUFBUSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztZQUNyQyxpQkFBaUIsQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQzs7UUFHMUQsTUFBTSxRQUFRLEdBQWMsZUFBZSxDQUN2QyxlQUFlLENBQUMsY0FBYyxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLFlBQVksQ0FBQyxFQUN4RSxXQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLEVBQUUsV0FBVyxFQUNwRCxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDLGVBQWtCLENBQUMsb0JBQXVCLENBQUMsQ0FBQztRQUMxRSxRQUFRLENBQUMsUUFBUSxDQUFDLEdBQUcsUUFBUSxJQUFJLFFBQVEsQ0FBQyxRQUFRLElBQUksSUFBSSxDQUFDOztRQUczRCxNQUFNLE9BQU8sR0FBRyxTQUFTLENBQUMsUUFBUSxxQkFBRSxJQUFJLEdBQUcsQ0FBQzs7UUFFNUMsSUFBSSxTQUFTLENBQUk7O1FBQ2pCLElBQUksV0FBVyxDQUFlO1FBQzlCLElBQUk7WUFDRixJQUFJLGVBQWUsQ0FBQyxLQUFLO2dCQUFFLGVBQWUsQ0FBQyxLQUFLLEVBQUUsQ0FBQzs7WUFHbkQsV0FBVyxHQUFHLFdBQVcsQ0FBQyxZQUFZLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQzs7WUFHckUsV0FBVyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQ3ZCLFNBQVMscUJBQUcsbUJBQW1CLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBTSxDQUFBLENBQUMsQ0FBQztZQUM3Riw0QkFBNEIsQ0FBQyxXQUFXLENBQUMsWUFBWSxFQUFFLFNBQVMscUJBQUUsV0FBVyxDQUFDLElBQUksR0FBRyxDQUFDO1lBQ3RGLG1CQUFDLFdBQVcsQ0FBQyxJQUFpQixFQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsU0FBUyxDQUFDOzs7O1lBS3JELHFCQUFxQixDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7OztZQUlwRCxJQUFJLGdCQUFnQixFQUFFOztnQkFDcEIsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDOztnQkFDZCxNQUFNLFVBQVUsR0FBWSxXQUFXLENBQUMsS0FBSyxDQUFDLFVBQVUsR0FBRyxFQUFFLENBQUM7Z0JBQzlELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7O29CQUNoRCxNQUFNLFFBQVEsR0FBRyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7b0JBQ3JDLElBQUksVUFBVSxHQUFlLElBQUksQ0FBQzs7b0JBQ2xDLElBQUksYUFBYSxHQUFlLElBQUksQ0FBQztvQkFDckMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7O3dCQUN4QyxNQUFNLEtBQUssR0FDUCxXQUFXLENBQUMsRUFBRSxLQUFLLHFDQUFxQixRQUFRLENBQUMsQ0FBQyxDQUFhLEdBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO3dCQUNqRixJQUFJLGFBQWEsRUFBRTs0QkFDakIsYUFBYSxDQUFDLElBQUksR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDO3lCQUNsQzs2QkFBTTs0QkFDTCxVQUFVLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQzt5QkFDMUI7d0JBQ0QsYUFBYSxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUM7cUJBQzdCO29CQUNELFVBQVUsQ0FBQyxJQUFJLG9CQUFDLFVBQVUsR0FBRyxDQUFDO2lCQUMvQjthQUNGOztZQUdELHNCQUFzQixDQUFDLFdBQVcscUJBQUUsV0FBVyxDQUFDLElBQUksR0FBRyxLQUFLLEdBQUcsU0FBUyxpQkFBcUIsQ0FBQztjQUM5RixXQUFXLENBQUMsSUFBSSxHQUFHLEtBQUssS0FBSyxxQkFBd0I7U0FDdEQ7Z0JBQVM7WUFDUixTQUFTLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3pCLElBQUksZUFBZSxDQUFDLEdBQUc7Z0JBQUUsZUFBZSxDQUFDLEdBQUcsRUFBRSxDQUFDO1NBQ2hEOztRQUVELE1BQU0sWUFBWSxHQUNkLElBQUksWUFBWSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxRQUFRLHFCQUFFLFFBQVEsR0FBRyxDQUFDO1FBQ3BGLElBQUksa0JBQWtCLEVBQUU7OztZQUV0QixZQUFZLENBQUMsUUFBUSxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUMsS0FBSyxHQUFHLFdBQVcsQ0FBQyxLQUFLO1NBQ25FO1FBQ0QsT0FBTyxZQUFZLENBQUM7S0FDckI7Q0FDRjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFVRCxNQUFNLG1CQUF1QixTQUFRLHVCQUEwQjs7Ozs7Ozs7SUFTN0QsWUFDSSxhQUFzQixFQUFFLFFBQVcsRUFBRSxRQUFtQixFQUFFLFFBQWtCLEVBQzVFLFFBQWtCO1FBQ3BCLEtBQUssRUFBRSxDQUFDOzBCQVh3QixFQUFFO1FBWWxDLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDOzs7Ozs7Ozs7O1FBVXpCLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksT0FBTyxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUN6RSxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsR0FBRyxXQUFXLENBQUMsQ0FBQyxDQUFDLGdCQUFrQixJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztRQUN2RixJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztRQUN6QixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3pDLElBQUksQ0FBQyxhQUFhLEdBQUcsYUFBYSxDQUFDO0tBQ3BDOzs7O0lBRUQsT0FBTztRQUNMLFNBQVMsSUFBSSxhQUFhLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSw0QkFBNEIsQ0FBQyxDQUFDO1VBQzFFLElBQUksQ0FBQyxVQUFVLEdBQUcsT0FBTyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ3BDLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO0tBQ3hCOzs7OztJQUNELFNBQVMsQ0FBQyxRQUFvQjtRQUM1QixTQUFTLElBQUksYUFBYSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsNEJBQTRCLENBQUMsQ0FBQztVQUMxRSxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxRQUFRO0tBQ2hDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Q2hhbmdlRGV0ZWN0b3JSZWZ9IGZyb20gJy4uL2NoYW5nZV9kZXRlY3Rpb24vY2hhbmdlX2RldGVjdG9yX3JlZic7XG5pbXBvcnQge0luamVjdGlvblRva2VufSBmcm9tICcuLi9kaS9pbmplY3Rpb25fdG9rZW4nO1xuaW1wb3J0IHtJbmplY3RvciwgaW5qZWN0fSBmcm9tICcuLi9kaS9pbmplY3Rvcic7XG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnkgYXMgdmlld0VuZ2luZV9Db21wb25lbnRGYWN0b3J5LCBDb21wb25lbnRSZWYgYXMgdmlld0VuZ2luZV9Db21wb25lbnRSZWZ9IGZyb20gJy4uL2xpbmtlci9jb21wb25lbnRfZmFjdG9yeSc7XG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnlSZXNvbHZlciBhcyB2aWV3RW5naW5lX0NvbXBvbmVudEZhY3RvcnlSZXNvbHZlcn0gZnJvbSAnLi4vbGlua2VyL2NvbXBvbmVudF9mYWN0b3J5X3Jlc29sdmVyJztcbmltcG9ydCB7RWxlbWVudFJlZn0gZnJvbSAnLi4vbGlua2VyL2VsZW1lbnRfcmVmJztcbmltcG9ydCB7TmdNb2R1bGVSZWYgYXMgdmlld0VuZ2luZV9OZ01vZHVsZVJlZn0gZnJvbSAnLi4vbGlua2VyL25nX21vZHVsZV9mYWN0b3J5JztcbmltcG9ydCB7UmVuZGVyZXJGYWN0b3J5Mn0gZnJvbSAnLi4vcmVuZGVyL2FwaSc7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL3R5cGUnO1xuXG5pbXBvcnQge2Fzc2VydENvbXBvbmVudFR5cGUsIGFzc2VydERlZmluZWR9IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7TGlmZWN5Y2xlSG9va3NGZWF0dXJlLCBjcmVhdGVSb290Q29udGV4dH0gZnJvbSAnLi9jb21wb25lbnQnO1xuaW1wb3J0IHtiYXNlRGlyZWN0aXZlQ3JlYXRlLCBjcmVhdGVMTm9kZSwgY3JlYXRlTFZpZXdEYXRhLCBjcmVhdGVUVmlldywgZWxlbWVudENyZWF0ZSwgZW50ZXJWaWV3LCBob3N0RWxlbWVudCwgaW5pdENoYW5nZURldGVjdG9ySWZFeGlzdGluZywgbG9jYXRlSG9zdEVsZW1lbnQsIHJlbmRlckVtYmVkZGVkVGVtcGxhdGV9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zJztcbmltcG9ydCB7Q29tcG9uZW50RGVmSW50ZXJuYWwsIENvbXBvbmVudFR5cGUsIFJlbmRlckZsYWdzfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge0xFbGVtZW50Tm9kZSwgVE5vZGUsIFROb2RlVHlwZX0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtSRWxlbWVudCwgZG9tUmVuZGVyZXJGYWN0b3J5M30gZnJvbSAnLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7Q09OVEVYVCwgRkxBR1MsIElOSkVDVE9SLCBMVmlld0RhdGEsIExWaWV3RmxhZ3MsIFJvb3RDb250ZXh0LCBUVklFV30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtWaWV3UmVmfSBmcm9tICcuL3ZpZXdfcmVmJztcblxuZXhwb3J0IGNsYXNzIENvbXBvbmVudEZhY3RvcnlSZXNvbHZlciBleHRlbmRzIHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyIHtcbiAgcmVzb2x2ZUNvbXBvbmVudEZhY3Rvcnk8VD4oY29tcG9uZW50OiBUeXBlPFQ+KTogdmlld0VuZ2luZV9Db21wb25lbnRGYWN0b3J5PFQ+IHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Q29tcG9uZW50VHlwZShjb21wb25lbnQpO1xuICAgIGNvbnN0IGNvbXBvbmVudERlZiA9IChjb21wb25lbnQgYXMgQ29tcG9uZW50VHlwZTxUPikubmdDb21wb25lbnREZWY7XG4gICAgcmV0dXJuIG5ldyBDb21wb25lbnRGYWN0b3J5KGNvbXBvbmVudERlZik7XG4gIH1cbn1cblxuZnVuY3Rpb24gdG9SZWZBcnJheShtYXA6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9KToge3Byb3BOYW1lOiBzdHJpbmc7IHRlbXBsYXRlTmFtZTogc3RyaW5nO31bXSB7XG4gIGNvbnN0IGFycmF5OiB7cHJvcE5hbWU6IHN0cmluZzsgdGVtcGxhdGVOYW1lOiBzdHJpbmc7fVtdID0gW107XG4gIGZvciAobGV0IG5vbk1pbmlmaWVkIGluIG1hcCkge1xuICAgIGlmIChtYXAuaGFzT3duUHJvcGVydHkobm9uTWluaWZpZWQpKSB7XG4gICAgICBjb25zdCBtaW5pZmllZCA9IG1hcFtub25NaW5pZmllZF07XG4gICAgICBhcnJheS5wdXNoKHtwcm9wTmFtZTogbWluaWZpZWQsIHRlbXBsYXRlTmFtZTogbm9uTWluaWZpZWR9KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGFycmF5O1xufVxuXG4vKipcbiAqIERlZmF1bHQge0BsaW5rIFJvb3RDb250ZXh0fSBmb3IgYWxsIGNvbXBvbmVudHMgcmVuZGVyZWQgd2l0aCB7QGxpbmsgcmVuZGVyQ29tcG9uZW50fS5cbiAqL1xuZXhwb3J0IGNvbnN0IFJPT1RfQ09OVEVYVCA9IG5ldyBJbmplY3Rpb25Ub2tlbjxSb290Q29udGV4dD4oXG4gICAgJ1JPT1RfQ09OVEVYVF9UT0tFTicsXG4gICAge3Byb3ZpZGVkSW46ICdyb290JywgZmFjdG9yeTogKCkgPT4gY3JlYXRlUm9vdENvbnRleHQoaW5qZWN0KFNDSEVEVUxFUikpfSk7XG5cbi8qKlxuICogQSBjaGFuZ2UgZGV0ZWN0aW9uIHNjaGVkdWxlciB0b2tlbiBmb3Ige0BsaW5rIFJvb3RDb250ZXh0fS4gVGhpcyB0b2tlbiBpcyB0aGUgZGVmYXVsdCB2YWx1ZSB1c2VkXG4gKiBmb3IgdGhlIGRlZmF1bHQgYFJvb3RDb250ZXh0YCBmb3VuZCBpbiB0aGUge0BsaW5rIFJPT1RfQ09OVEVYVH0gdG9rZW4uXG4gKi9cbmV4cG9ydCBjb25zdCBTQ0hFRFVMRVIgPSBuZXcgSW5qZWN0aW9uVG9rZW48KChmbjogKCkgPT4gdm9pZCkgPT4gdm9pZCk+KFxuICAgICdTQ0hFRFVMRVJfVE9LRU4nLCB7cHJvdmlkZWRJbjogJ3Jvb3QnLCBmYWN0b3J5OiAoKSA9PiByZXF1ZXN0QW5pbWF0aW9uRnJhbWUuYmluZCh3aW5kb3cpfSk7XG5cbi8qKlxuICogUmVuZGVyMyBpbXBsZW1lbnRhdGlvbiBvZiB7QGxpbmsgdmlld0VuZ2luZV9Db21wb25lbnRGYWN0b3J5fS5cbiAqL1xuZXhwb3J0IGNsYXNzIENvbXBvbmVudEZhY3Rvcnk8VD4gZXh0ZW5kcyB2aWV3RW5naW5lX0NvbXBvbmVudEZhY3Rvcnk8VD4ge1xuICBzZWxlY3Rvcjogc3RyaW5nO1xuICBjb21wb25lbnRUeXBlOiBUeXBlPGFueT47XG4gIG5nQ29udGVudFNlbGVjdG9yczogc3RyaW5nW107XG4gIGdldCBpbnB1dHMoKToge3Byb3BOYW1lOiBzdHJpbmc7IHRlbXBsYXRlTmFtZTogc3RyaW5nO31bXSB7XG4gICAgcmV0dXJuIHRvUmVmQXJyYXkodGhpcy5jb21wb25lbnREZWYuaW5wdXRzKTtcbiAgfVxuICBnZXQgb3V0cHV0cygpOiB7cHJvcE5hbWU6IHN0cmluZzsgdGVtcGxhdGVOYW1lOiBzdHJpbmc7fVtdIHtcbiAgICByZXR1cm4gdG9SZWZBcnJheSh0aGlzLmNvbXBvbmVudERlZi5vdXRwdXRzKTtcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgY29tcG9uZW50RGVmOiBDb21wb25lbnREZWZJbnRlcm5hbDxhbnk+KSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmNvbXBvbmVudFR5cGUgPSBjb21wb25lbnREZWYudHlwZTtcbiAgICB0aGlzLnNlbGVjdG9yID0gY29tcG9uZW50RGVmLnNlbGVjdG9yc1swXVswXSBhcyBzdHJpbmc7XG4gICAgdGhpcy5uZ0NvbnRlbnRTZWxlY3RvcnMgPSBbXTtcbiAgfVxuXG4gIGNyZWF0ZShcbiAgICAgIGluamVjdG9yOiBJbmplY3RvciwgcHJvamVjdGFibGVOb2Rlcz86IGFueVtdW118dW5kZWZpbmVkLCByb290U2VsZWN0b3JPck5vZGU/OiBhbnksXG4gICAgICBuZ01vZHVsZT86IHZpZXdFbmdpbmVfTmdNb2R1bGVSZWY8YW55Pnx1bmRlZmluZWQpOiB2aWV3RW5naW5lX0NvbXBvbmVudFJlZjxUPiB7XG4gICAgY29uc3QgaXNJbnRlcm5hbFJvb3RWaWV3ID0gcm9vdFNlbGVjdG9yT3JOb2RlID09PSB1bmRlZmluZWQ7XG5cbiAgICBjb25zdCByZW5kZXJlckZhY3RvcnkgPVxuICAgICAgICBuZ01vZHVsZSA/IG5nTW9kdWxlLmluamVjdG9yLmdldChSZW5kZXJlckZhY3RvcnkyKSA6IGRvbVJlbmRlcmVyRmFjdG9yeTM7XG4gICAgY29uc3QgaG9zdE5vZGUgPSBpc0ludGVybmFsUm9vdFZpZXcgP1xuICAgICAgICBlbGVtZW50Q3JlYXRlKFxuICAgICAgICAgICAgdGhpcy5zZWxlY3RvciwgcmVuZGVyZXJGYWN0b3J5LmNyZWF0ZVJlbmRlcmVyKG51bGwsIHRoaXMuY29tcG9uZW50RGVmLnJlbmRlcmVyVHlwZSkpIDpcbiAgICAgICAgbG9jYXRlSG9zdEVsZW1lbnQocmVuZGVyZXJGYWN0b3J5LCByb290U2VsZWN0b3JPck5vZGUpO1xuXG4gICAgLy8gVGhlIGZpcnN0IGluZGV4IG9mIHRoZSBmaXJzdCBzZWxlY3RvciBpcyB0aGUgdGFnIG5hbWUuXG4gICAgY29uc3QgY29tcG9uZW50VGFnID0gdGhpcy5jb21wb25lbnREZWYuc2VsZWN0b3JzICFbMF0gIVswXSBhcyBzdHJpbmc7XG5cbiAgICBjb25zdCByb290Q29udGV4dDogUm9vdENvbnRleHQgPSBuZ01vZHVsZSAmJiAhaXNJbnRlcm5hbFJvb3RWaWV3ID9cbiAgICAgICAgbmdNb2R1bGUuaW5qZWN0b3IuZ2V0KFJPT1RfQ09OVEVYVCkgOlxuICAgICAgICBjcmVhdGVSb290Q29udGV4dChyZXF1ZXN0QW5pbWF0aW9uRnJhbWUuYmluZCh3aW5kb3cpKTtcblxuICAgIC8vIENyZWF0ZSB0aGUgcm9vdCB2aWV3LiBVc2VzIGVtcHR5IFRWaWV3IGFuZCBDb250ZW50VGVtcGxhdGUuXG4gICAgY29uc3Qgcm9vdFZpZXc6IExWaWV3RGF0YSA9IGNyZWF0ZUxWaWV3RGF0YShcbiAgICAgICAgcmVuZGVyZXJGYWN0b3J5LmNyZWF0ZVJlbmRlcmVyKGhvc3ROb2RlLCB0aGlzLmNvbXBvbmVudERlZi5yZW5kZXJlclR5cGUpLFxuICAgICAgICBjcmVhdGVUVmlldygtMSwgbnVsbCwgbnVsbCwgbnVsbCwgbnVsbCksIHJvb3RDb250ZXh0LFxuICAgICAgICB0aGlzLmNvbXBvbmVudERlZi5vblB1c2ggPyBMVmlld0ZsYWdzLkRpcnR5IDogTFZpZXdGbGFncy5DaGVja0Fsd2F5cyk7XG4gICAgcm9vdFZpZXdbSU5KRUNUT1JdID0gbmdNb2R1bGUgJiYgbmdNb2R1bGUuaW5qZWN0b3IgfHwgbnVsbDtcblxuICAgIC8vIHJvb3RWaWV3IGlzIHRoZSBwYXJlbnQgd2hlbiBib290c3RyYXBwaW5nXG4gICAgY29uc3Qgb2xkVmlldyA9IGVudGVyVmlldyhyb290VmlldywgbnVsbCAhKTtcblxuICAgIGxldCBjb21wb25lbnQ6IFQ7XG4gICAgbGV0IGVsZW1lbnROb2RlOiBMRWxlbWVudE5vZGU7XG4gICAgdHJ5IHtcbiAgICAgIGlmIChyZW5kZXJlckZhY3RvcnkuYmVnaW4pIHJlbmRlcmVyRmFjdG9yeS5iZWdpbigpO1xuXG4gICAgICAvLyBDcmVhdGUgZWxlbWVudCBub2RlIGF0IGluZGV4IDAgaW4gZGF0YSBhcnJheVxuICAgICAgZWxlbWVudE5vZGUgPSBob3N0RWxlbWVudChjb21wb25lbnRUYWcsIGhvc3ROb2RlLCB0aGlzLmNvbXBvbmVudERlZik7XG5cbiAgICAgIC8vIENyZWF0ZSBkaXJlY3RpdmUgaW5zdGFuY2Ugd2l0aCBmYWN0b3J5KCkgYW5kIHN0b3JlIGF0IGluZGV4IDAgaW4gZGlyZWN0aXZlcyBhcnJheVxuICAgICAgcm9vdENvbnRleHQuY29tcG9uZW50cy5wdXNoKFxuICAgICAgICAgIGNvbXBvbmVudCA9IGJhc2VEaXJlY3RpdmVDcmVhdGUoMCwgdGhpcy5jb21wb25lbnREZWYuZmFjdG9yeSgpLCB0aGlzLmNvbXBvbmVudERlZikgYXMgVCk7XG4gICAgICBpbml0Q2hhbmdlRGV0ZWN0b3JJZkV4aXN0aW5nKGVsZW1lbnROb2RlLm5vZGVJbmplY3RvciwgY29tcG9uZW50LCBlbGVtZW50Tm9kZS5kYXRhICEpO1xuICAgICAgKGVsZW1lbnROb2RlLmRhdGEgYXMgTFZpZXdEYXRhKVtDT05URVhUXSA9IGNvbXBvbmVudDtcblxuICAgICAgLy8gVE9ETzogc2hvdWxkIExpZmVjeWNsZUhvb2tzRmVhdHVyZSBhbmQgb3RoZXIgaG9zdCBmZWF0dXJlcyBiZSBnZW5lcmF0ZWQgYnkgdGhlIGNvbXBpbGVyIGFuZFxuICAgICAgLy8gZXhlY3V0ZWQgaGVyZT9cbiAgICAgIC8vIEFuZ3VsYXIgNSByZWZlcmVuY2U6IGh0dHBzOi8vc3RhY2tibGl0ei5jb20vZWRpdC9saWZlY3ljbGUtaG9va3MtdmNyZWZcbiAgICAgIExpZmVjeWNsZUhvb2tzRmVhdHVyZShjb21wb25lbnQsIHRoaXMuY29tcG9uZW50RGVmKTtcblxuICAgICAgLy8gVHJhbnNmb3JtIHRoZSBhcnJheXMgb2YgbmF0aXZlIG5vZGVzIGludG8gYSBMTm9kZSBzdHJ1Y3R1cmUgdGhhdCBjYW4gYmUgY29uc3VtZWQgYnkgdGhlXG4gICAgICAvLyBwcm9qZWN0aW9uIGluc3RydWN0aW9uLiBUaGlzIGlzIG5lZWRlZCB0byBzdXBwb3J0IHRoZSByZXByb2plY3Rpb24gb2YgdGhlc2Ugbm9kZXMuXG4gICAgICBpZiAocHJvamVjdGFibGVOb2Rlcykge1xuICAgICAgICBsZXQgaW5kZXggPSAwO1xuICAgICAgICBjb25zdCBwcm9qZWN0aW9uOiBUTm9kZVtdID0gZWxlbWVudE5vZGUudE5vZGUucHJvamVjdGlvbiA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByb2plY3RhYmxlTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBub2RlTGlzdCA9IHByb2plY3RhYmxlTm9kZXNbaV07XG4gICAgICAgICAgbGV0IGZpcnN0VE5vZGU6IFROb2RlfG51bGwgPSBudWxsO1xuICAgICAgICAgIGxldCBwcmV2aW91c1ROb2RlOiBUTm9kZXxudWxsID0gbnVsbDtcbiAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IG5vZGVMaXN0Lmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICBjb25zdCBsTm9kZSA9XG4gICAgICAgICAgICAgICAgY3JlYXRlTE5vZGUoKytpbmRleCwgVE5vZGVUeXBlLkVsZW1lbnQsIG5vZGVMaXN0W2pdIGFzIFJFbGVtZW50LCBudWxsLCBudWxsKTtcbiAgICAgICAgICAgIGlmIChwcmV2aW91c1ROb2RlKSB7XG4gICAgICAgICAgICAgIHByZXZpb3VzVE5vZGUubmV4dCA9IGxOb2RlLnROb2RlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgZmlyc3RUTm9kZSA9IGxOb2RlLnROb2RlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcHJldmlvdXNUTm9kZSA9IGxOb2RlLnROb2RlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBwcm9qZWN0aW9uLnB1c2goZmlyc3RUTm9kZSAhKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBFeGVjdXRlIHRoZSB0ZW1wbGF0ZSBpbiBjcmVhdGlvbiBtb2RlIG9ubHksIGFuZCB0aGVuIHR1cm4gb2ZmIHRoZSBDcmVhdGlvbk1vZGUgZmxhZ1xuICAgICAgcmVuZGVyRW1iZWRkZWRUZW1wbGF0ZShlbGVtZW50Tm9kZSwgZWxlbWVudE5vZGUuZGF0YSAhW1RWSUVXXSwgY29tcG9uZW50LCBSZW5kZXJGbGFncy5DcmVhdGUpO1xuICAgICAgZWxlbWVudE5vZGUuZGF0YSAhW0ZMQUdTXSAmPSB+TFZpZXdGbGFncy5DcmVhdGlvbk1vZGU7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIGVudGVyVmlldyhvbGRWaWV3LCBudWxsKTtcbiAgICAgIGlmIChyZW5kZXJlckZhY3RvcnkuZW5kKSByZW5kZXJlckZhY3RvcnkuZW5kKCk7XG4gICAgfVxuXG4gICAgY29uc3QgY29tcG9uZW50UmVmID1cbiAgICAgICAgbmV3IENvbXBvbmVudFJlZih0aGlzLmNvbXBvbmVudFR5cGUsIGNvbXBvbmVudCwgcm9vdFZpZXcsIGluamVjdG9yLCBob3N0Tm9kZSAhKTtcbiAgICBpZiAoaXNJbnRlcm5hbFJvb3RWaWV3KSB7XG4gICAgICAvLyBUaGUgaG9zdCBlbGVtZW50IG9mIHRoZSBpbnRlcm5hbCByb290IHZpZXcgaXMgYXR0YWNoZWQgdG8gdGhlIGNvbXBvbmVudCdzIGhvc3QgdmlldyBub2RlXG4gICAgICBjb21wb25lbnRSZWYuaG9zdFZpZXcuX2xWaWV3Tm9kZSAhLnROb2RlLmNoaWxkID0gZWxlbWVudE5vZGUudE5vZGU7XG4gICAgfVxuICAgIHJldHVybiBjb21wb25lbnRSZWY7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXByZXNlbnRzIGFuIGluc3RhbmNlIG9mIGEgQ29tcG9uZW50IGNyZWF0ZWQgdmlhIGEge0BsaW5rIENvbXBvbmVudEZhY3Rvcnl9LlxuICpcbiAqIGBDb21wb25lbnRSZWZgIHByb3ZpZGVzIGFjY2VzcyB0byB0aGUgQ29tcG9uZW50IEluc3RhbmNlIGFzIHdlbGwgb3RoZXIgb2JqZWN0cyByZWxhdGVkIHRvIHRoaXNcbiAqIENvbXBvbmVudCBJbnN0YW5jZSBhbmQgYWxsb3dzIHlvdSB0byBkZXN0cm95IHRoZSBDb21wb25lbnQgSW5zdGFuY2UgdmlhIHRoZSB7QGxpbmsgI2Rlc3Ryb3l9XG4gKiBtZXRob2QuXG4gKlxuICovXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50UmVmPFQ+IGV4dGVuZHMgdmlld0VuZ2luZV9Db21wb25lbnRSZWY8VD4ge1xuICBkZXN0cm95Q2JzOiAoKCkgPT4gdm9pZClbXXxudWxsID0gW107XG4gIGxvY2F0aW9uOiBFbGVtZW50UmVmPGFueT47XG4gIGluamVjdG9yOiBJbmplY3RvcjtcbiAgaW5zdGFuY2U6IFQ7XG4gIGhvc3RWaWV3OiBWaWV3UmVmPFQ+O1xuICBjaGFuZ2VEZXRlY3RvclJlZjogQ2hhbmdlRGV0ZWN0b3JSZWY7XG4gIGNvbXBvbmVudFR5cGU6IFR5cGU8VD47XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBjb21wb25lbnRUeXBlOiBUeXBlPFQ+LCBpbnN0YW5jZTogVCwgcm9vdFZpZXc6IExWaWV3RGF0YSwgaW5qZWN0b3I6IEluamVjdG9yLFxuICAgICAgaG9zdE5vZGU6IFJFbGVtZW50KSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmluc3RhbmNlID0gaW5zdGFuY2U7XG4gICAgLyogVE9ETyhqYXNvbmFkZW4pOiBUaGlzIGlzIGluY29tcGxldGUsIHRvIGJlIGFkanVzdGVkIGluIGZvbGxvdy11cCBQUi4gTm90ZXMgZnJvbSBLYXJhOldoZW5cbiAgICAgKiBWaWV3UmVmLmRldGVjdENoYW5nZXMgaXMgY2FsbGVkIGZyb20gQXBwbGljYXRpb25SZWYudGljaywgaXQgd2lsbCBjYWxsIGRldGVjdENoYW5nZXMgYXQgdGhlXG4gICAgICogY29tcG9uZW50IGluc3RhbmNlIGxldmVsLiBJIHN1c3BlY3QgdGhpcyBtZWFucyB0aGF0IGxpZmVjeWNsZSBob29rcyBhbmQgaG9zdCBiaW5kaW5ncyBvbiB0aGVcbiAgICAgKiBnaXZlbiBjb21wb25lbnQgd29uJ3Qgd29yayAoYXMgdGhlc2UgYXJlIGFsd2F5cyBjYWxsZWQgYXQgdGhlIGxldmVsIGFib3ZlIGEgY29tcG9uZW50KS5cbiAgICAgKlxuICAgICAqIEluIHJlbmRlcjIsIFZpZXdSZWYuZGV0ZWN0Q2hhbmdlcyB1c2VzIHRoZSByb290IHZpZXcgaW5zdGFuY2UgZm9yIHZpZXcgY2hlY2tzLCBub3QgdGhlXG4gICAgICogY29tcG9uZW50IGluc3RhbmNlLiBTbyBwYXNzaW5nIGluIHRoZSByb290IHZpZXcgKDEgbGV2ZWwgYWJvdmUgdGhlIGNvbXBvbmVudCkgaXMgc3VmZmljaWVudC5cbiAgICAgKiBXZSBtaWdodCAgd2FudCB0byB0aGluayBhYm91dCBjcmVhdGluZyBhIGZha2UgY29tcG9uZW50IGZvciB0aGUgdG9wIGxldmVsPyBPciBvdmVyd3JpdGVcbiAgICAgKiBkZXRlY3RDaGFuZ2VzIHdpdGggYSBmdW5jdGlvbiB0aGF0IGNhbGxzIHRpY2tSb290Q29udGV4dD8gKi9cbiAgICB0aGlzLmhvc3RWaWV3ID0gdGhpcy5jaGFuZ2VEZXRlY3RvclJlZiA9IG5ldyBWaWV3UmVmKHJvb3RWaWV3LCBpbnN0YW5jZSk7XG4gICAgdGhpcy5ob3N0Vmlldy5fbFZpZXdOb2RlID0gY3JlYXRlTE5vZGUoLTEsIFROb2RlVHlwZS5WaWV3LCBudWxsLCBudWxsLCBudWxsLCByb290Vmlldyk7XG4gICAgdGhpcy5pbmplY3RvciA9IGluamVjdG9yO1xuICAgIHRoaXMubG9jYXRpb24gPSBuZXcgRWxlbWVudFJlZihob3N0Tm9kZSk7XG4gICAgdGhpcy5jb21wb25lbnRUeXBlID0gY29tcG9uZW50VHlwZTtcbiAgfVxuXG4gIGRlc3Ryb3koKTogdm9pZCB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodGhpcy5kZXN0cm95Q2JzLCAnTmdNb2R1bGUgYWxyZWFkeSBkZXN0cm95ZWQnKTtcbiAgICB0aGlzLmRlc3Ryb3lDYnMgIS5mb3JFYWNoKGZuID0+IGZuKCkpO1xuICAgIHRoaXMuZGVzdHJveUNicyA9IG51bGw7XG4gIH1cbiAgb25EZXN0cm95KGNhbGxiYWNrOiAoKSA9PiB2b2lkKTogdm9pZCB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodGhpcy5kZXN0cm95Q2JzLCAnTmdNb2R1bGUgYWxyZWFkeSBkZXN0cm95ZWQnKTtcbiAgICB0aGlzLmRlc3Ryb3lDYnMgIS5wdXNoKGNhbGxiYWNrKTtcbiAgfVxufVxuIl19