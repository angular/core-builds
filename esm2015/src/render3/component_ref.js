/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
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
import { Sanitizer } from '../sanitization/security';
import { VERSION } from '../version';
import { assertComponentType, assertDefined } from './assert';
import { LifecycleHooksFeature, createRootComponent, createRootComponentView, createRootContext } from './component';
import { getComponentDef } from './definition';
import { NodeInjector } from './di';
import { addToViewTree, createLView, createNodeAtIndex, createTView, createViewNode, elementCreate, locateHostElement, refreshDescendantViews } from './instructions';
import { domRendererFactory3, isProceduralRenderer } from './interfaces/renderer';
import { HEADER_OFFSET, TVIEW } from './interfaces/view';
import { enterView, leaveView } from './state';
import { defaultScheduler, getTNode } from './util';
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
export const ROOT_CONTEXT = new InjectionToken('ROOT_CONTEXT_TOKEN', { providedIn: 'root', factory: () => createRootContext(inject(SCHEDULER)) });
/**
 * A change detection scheduler token for {\@link RootContext}. This token is the default value used
 * for the default `RootContext` found in the {\@link ROOT_CONTEXT} token.
 * @type {?}
 */
export const SCHEDULER = new InjectionToken('SCHEDULER_TOKEN', {
    providedIn: 'root',
    factory: () => defaultScheduler,
});
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
            if (value !== NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR ||
                notFoundValue === NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR) {
                // Return the value from the root element injector when
                // - it provides it
                //   (value !== NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR)
                // - the module injector should not be checked
                //   (notFoundValue === NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR)
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
     * @param {?} componentDef The component definition.
     * @param {?=} ngModule The NgModuleRef to which the factory is bound.
     */
    constructor(componentDef, ngModule) {
        super();
        this.componentDef = componentDef;
        this.ngModule = ngModule;
        this.componentType = componentDef.type;
        this.selector = (/** @type {?} */ (componentDef.selectors[0][0]));
        // The component definition does not include the wildcard ('*') selector in its list.
        // It is implicitly expected as the first item in the projectable nodes array.
        this.ngContentSelectors =
            componentDef.ngContentSelectors ? ['*', ...componentDef.ngContentSelectors] : [];
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
        const rootFlags = this.componentDef.onPush ? 8 /* Dirty */ | 128 /* IsRoot */ :
            4 /* CheckAlways */ | 128 /* IsRoot */;
        /** @type {?} */
        const rootContext = !isInternalRootView ? rootViewInjector.get(ROOT_CONTEXT) : createRootContext();
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
        const rootLView = createLView(null, createTView(-1, null, 1, 0, null, null, null), rootContext, rootFlags, rendererFactory, renderer, sanitizer, rootViewInjector);
        // rootView is the parent when bootstrapping
        /** @type {?} */
        const oldLView = enterView(rootLView, null);
        /** @type {?} */
        let component;
        /** @type {?} */
        let tElementNode;
        try {
            if (rendererFactory.begin)
                rendererFactory.begin();
            /** @type {?} */
            const componentView = createRootComponentView(hostRNode, this.componentDef, rootLView, rendererFactory, renderer);
            tElementNode = (/** @type {?} */ (getTNode(0, rootLView)));
            // Transform the arrays of native nodes into a structure that can be consumed by the
            // projection instruction. This is needed to support the reprojection of these nodes.
            if (projectableNodes) {
                /** @type {?} */
                let index = 0;
                /** @type {?} */
                const tView = rootLView[TVIEW];
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
                            rootLView.splice(index + HEADER_OFFSET, 0, null);
                        }
                        /** @type {?} */
                        const tNode = createNodeAtIndex(index, 3 /* Element */, (/** @type {?} */ (nodeList[j])), null, null);
                        previousTNode ? (previousTNode.next = tNode) : (firstTNode = tNode);
                        previousTNode = tNode;
                    }
                    projection.push((/** @type {?} */ (firstTNode)));
                }
            }
            // TODO: should LifecycleHooksFeature and other host features be generated by the compiler and
            // executed here?
            // Angular 5 reference: https://stackblitz.com/edit/lifecycle-hooks-vcref
            component = createRootComponent(componentView, this.componentDef, rootLView, rootContext, [LifecycleHooksFeature]);
            addToViewTree(rootLView, HEADER_OFFSET, componentView);
            refreshDescendantViews(rootLView);
        }
        finally {
            leaveView(oldLView);
            if (rendererFactory.end)
                rendererFactory.end();
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
        this.hostView._tViewNode = createViewNode(-1, _rootLView);
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
        ngDevMode && assertDefined(this.destroyCbs, 'NgModule already destroyed');
        (/** @type {?} */ (this.destroyCbs)).forEach(fn => fn());
        this.destroyCbs = null;
        this.hostView.destroy();
    }
    /**
     * @param {?} callback
     * @return {?}
     */
    onDestroy(callback) {
        ngDevMode && assertDefined(this.destroyCbs, 'NgModule already destroyed');
        (/** @type {?} */ (this.destroyCbs)).push(callback);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50X3JlZi5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvY29tcG9uZW50X3JlZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVNBLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUVyRCxPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFDcEQsT0FBTyxFQUFDLGdCQUFnQixJQUFJLDJCQUEyQixFQUFFLFlBQVksSUFBSSx1QkFBdUIsRUFBQyxNQUFNLDZCQUE2QixDQUFDO0FBQ3JJLE9BQU8sRUFBQyx3QkFBd0IsSUFBSSxtQ0FBbUMsRUFBQyxNQUFNLHNDQUFzQyxDQUFDO0FBQ3JILE9BQU8sRUFBQyxVQUFVLElBQUkscUJBQXFCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUUxRSxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDL0MsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBRW5ELE9BQU8sRUFBQyxPQUFPLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFDbkMsT0FBTyxFQUFDLG1CQUFtQixFQUFFLGFBQWEsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUM1RCxPQUFPLEVBQUMscUJBQXFCLEVBQUUsbUJBQW1CLEVBQUUsdUJBQXVCLEVBQUUsaUJBQWlCLEVBQUMsTUFBTSxhQUFhLENBQUM7QUFDbkgsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUM3QyxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQ2xDLE9BQU8sRUFBQyxhQUFhLEVBQUUsV0FBVyxFQUFFLGlCQUFpQixFQUFFLFdBQVcsRUFBRSxjQUFjLEVBQUUsYUFBYSxFQUFFLGlCQUFpQixFQUFFLHNCQUFzQixFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFHcEssT0FBTyxF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QTRCLENBQUMsQ0FBQztRQUMxRSxtQkFBQSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUN0QyxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztRQUN2QixJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQzFCLENBQUM7Ozs7O0lBQ0QsU0FBUyxDQUFDLFFBQW9CO1FBQzVCLFNBQVMsSUFBSSxhQUFhLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSw0QkFBNEIsQ0FBQyxDQUFDO1FBQzFFLG1CQUFBLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDbkMsQ0FBQztDQUNGOzs7SUE3QkMsa0NBQXFDOztJQUNyQyxnQ0FBWTs7SUFDWixnQ0FBcUI7O0lBQ3JCLHlDQUFnRDs7SUFDaEQscUNBQXVCOztJQUdrQixnQ0FBc0M7Ozs7O0lBQzNFLGtDQUF5Qjs7Ozs7SUFDekIsOEJBQWlFIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0NoYW5nZURldGVjdG9yUmVmIGFzIFZpZXdFbmdpbmVfQ2hhbmdlRGV0ZWN0b3JSZWZ9IGZyb20gJy4uL2NoYW5nZV9kZXRlY3Rpb24vY2hhbmdlX2RldGVjdG9yX3JlZic7XG5pbXBvcnQge0luamVjdGlvblRva2VufSBmcm9tICcuLi9kaS9pbmplY3Rpb25fdG9rZW4nO1xuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi4vZGkvaW5qZWN0b3InO1xuaW1wb3J0IHtpbmplY3R9IGZyb20gJy4uL2RpL2luamVjdG9yX2NvbXBhdGliaWxpdHknO1xuaW1wb3J0IHtDb21wb25lbnRGYWN0b3J5IGFzIHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeSwgQ29tcG9uZW50UmVmIGFzIHZpZXdFbmdpbmVfQ29tcG9uZW50UmVmfSBmcm9tICcuLi9saW5rZXIvY29tcG9uZW50X2ZhY3RvcnknO1xuaW1wb3J0IHtDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIgYXMgdmlld0VuZ2luZV9Db21wb25lbnRGYWN0b3J5UmVzb2x2ZXJ9IGZyb20gJy4uL2xpbmtlci9jb21wb25lbnRfZmFjdG9yeV9yZXNvbHZlcic7XG5pbXBvcnQge0VsZW1lbnRSZWYgYXMgdmlld0VuZ2luZV9FbGVtZW50UmVmfSBmcm9tICcuLi9saW5rZXIvZWxlbWVudF9yZWYnO1xuaW1wb3J0IHtOZ01vZHVsZVJlZiBhcyB2aWV3RW5naW5lX05nTW9kdWxlUmVmfSBmcm9tICcuLi9saW5rZXIvbmdfbW9kdWxlX2ZhY3RvcnknO1xuaW1wb3J0IHtSZW5kZXJlckZhY3RvcnkyfSBmcm9tICcuLi9yZW5kZXIvYXBpJztcbmltcG9ydCB7U2FuaXRpemVyfSBmcm9tICcuLi9zYW5pdGl6YXRpb24vc2VjdXJpdHknO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi90eXBlJztcbmltcG9ydCB7VkVSU0lPTn0gZnJvbSAnLi4vdmVyc2lvbic7XG5pbXBvcnQge2Fzc2VydENvbXBvbmVudFR5cGUsIGFzc2VydERlZmluZWR9IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7TGlmZWN5Y2xlSG9va3NGZWF0dXJlLCBjcmVhdGVSb290Q29tcG9uZW50LCBjcmVhdGVSb290Q29tcG9uZW50VmlldywgY3JlYXRlUm9vdENvbnRleHR9IGZyb20gJy4vY29tcG9uZW50JztcbmltcG9ydCB7Z2V0Q29tcG9uZW50RGVmfSBmcm9tICcuL2RlZmluaXRpb24nO1xuaW1wb3J0IHtOb2RlSW5qZWN0b3J9IGZyb20gJy4vZGknO1xuaW1wb3J0IHthZGRUb1ZpZXdUcmVlLCBjcmVhdGVMVmlldywgY3JlYXRlTm9kZUF0SW5kZXgsIGNyZWF0ZVRWaWV3LCBjcmVhdGVWaWV3Tm9kZSwgZWxlbWVudENyZWF0ZSwgbG9jYXRlSG9zdEVsZW1lbnQsIHJlZnJlc2hEZXNjZW5kYW50Vmlld3N9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zJztcbmltcG9ydCB7Q29tcG9uZW50RGVmLCBSZW5kZXJGbGFnc30gZnJvbSAnLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtUQ29udGFpbmVyTm9kZSwgVEVsZW1lbnRDb250YWluZXJOb2RlLCBURWxlbWVudE5vZGUsIFROb2RlLCBUTm9kZVR5cGV9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7UkVsZW1lbnQsIFJlbmRlcmVyRmFjdG9yeTMsIGRvbVJlbmRlcmVyRmFjdG9yeTMsIGlzUHJvY2VkdXJhbFJlbmRlcmVyfSBmcm9tICcuL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtIRUFERVJfT0ZGU0VULCBMVmlldywgTFZpZXdGbGFncywgUm9vdENvbnRleHQsIFRWSUVXfSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2VudGVyVmlldywgbGVhdmVWaWV3fSBmcm9tICcuL3N0YXRlJztcbmltcG9ydCB7ZGVmYXVsdFNjaGVkdWxlciwgZ2V0VE5vZGV9IGZyb20gJy4vdXRpbCc7XG5pbXBvcnQge2NyZWF0ZUVsZW1lbnRSZWZ9IGZyb20gJy4vdmlld19lbmdpbmVfY29tcGF0aWJpbGl0eSc7XG5pbXBvcnQge1Jvb3RWaWV3UmVmLCBWaWV3UmVmfSBmcm9tICcuL3ZpZXdfcmVmJztcblxuZXhwb3J0IGNsYXNzIENvbXBvbmVudEZhY3RvcnlSZXNvbHZlciBleHRlbmRzIHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyIHtcbiAgLyoqXG4gICAqIEBwYXJhbSBuZ01vZHVsZSBUaGUgTmdNb2R1bGVSZWYgdG8gd2hpY2ggYWxsIHJlc29sdmVkIGZhY3RvcmllcyBhcmUgYm91bmQuXG4gICAqL1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIG5nTW9kdWxlPzogdmlld0VuZ2luZV9OZ01vZHVsZVJlZjxhbnk+KSB7IHN1cGVyKCk7IH1cblxuICByZXNvbHZlQ29tcG9uZW50RmFjdG9yeTxUPihjb21wb25lbnQ6IFR5cGU8VD4pOiB2aWV3RW5naW5lX0NvbXBvbmVudEZhY3Rvcnk8VD4ge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRDb21wb25lbnRUeXBlKGNvbXBvbmVudCk7XG4gICAgY29uc3QgY29tcG9uZW50RGVmID0gZ2V0Q29tcG9uZW50RGVmKGNvbXBvbmVudCkgITtcbiAgICByZXR1cm4gbmV3IENvbXBvbmVudEZhY3RvcnkoY29tcG9uZW50RGVmLCB0aGlzLm5nTW9kdWxlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiB0b1JlZkFycmF5KG1hcDoge1trZXk6IHN0cmluZ106IHN0cmluZ30pOiB7cHJvcE5hbWU6IHN0cmluZzsgdGVtcGxhdGVOYW1lOiBzdHJpbmc7fVtdIHtcbiAgY29uc3QgYXJyYXk6IHtwcm9wTmFtZTogc3RyaW5nOyB0ZW1wbGF0ZU5hbWU6IHN0cmluZzt9W10gPSBbXTtcbiAgZm9yIChsZXQgbm9uTWluaWZpZWQgaW4gbWFwKSB7XG4gICAgaWYgKG1hcC5oYXNPd25Qcm9wZXJ0eShub25NaW5pZmllZCkpIHtcbiAgICAgIGNvbnN0IG1pbmlmaWVkID0gbWFwW25vbk1pbmlmaWVkXTtcbiAgICAgIGFycmF5LnB1c2goe3Byb3BOYW1lOiBtaW5pZmllZCwgdGVtcGxhdGVOYW1lOiBub25NaW5pZmllZH0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gYXJyYXk7XG59XG5cbi8qKlxuICogRGVmYXVsdCB7QGxpbmsgUm9vdENvbnRleHR9IGZvciBhbGwgY29tcG9uZW50cyByZW5kZXJlZCB3aXRoIHtAbGluayByZW5kZXJDb21wb25lbnR9LlxuICovXG5leHBvcnQgY29uc3QgUk9PVF9DT05URVhUID0gbmV3IEluamVjdGlvblRva2VuPFJvb3RDb250ZXh0PihcbiAgICAnUk9PVF9DT05URVhUX1RPS0VOJyxcbiAgICB7cHJvdmlkZWRJbjogJ3Jvb3QnLCBmYWN0b3J5OiAoKSA9PiBjcmVhdGVSb290Q29udGV4dChpbmplY3QoU0NIRURVTEVSKSl9KTtcblxuLyoqXG4gKiBBIGNoYW5nZSBkZXRlY3Rpb24gc2NoZWR1bGVyIHRva2VuIGZvciB7QGxpbmsgUm9vdENvbnRleHR9LiBUaGlzIHRva2VuIGlzIHRoZSBkZWZhdWx0IHZhbHVlIHVzZWRcbiAqIGZvciB0aGUgZGVmYXVsdCBgUm9vdENvbnRleHRgIGZvdW5kIGluIHRoZSB7QGxpbmsgUk9PVF9DT05URVhUfSB0b2tlbi5cbiAqL1xuZXhwb3J0IGNvbnN0IFNDSEVEVUxFUiA9IG5ldyBJbmplY3Rpb25Ub2tlbjwoKGZuOiAoKSA9PiB2b2lkKSA9PiB2b2lkKT4oJ1NDSEVEVUxFUl9UT0tFTicsIHtcbiAgcHJvdmlkZWRJbjogJ3Jvb3QnLFxuICBmYWN0b3J5OiAoKSA9PiBkZWZhdWx0U2NoZWR1bGVyLFxufSk7XG5cbmNvbnN0IE5PVF9GT1VORF9DSEVDS19PTkxZX0VMRU1FTlRfSU5KRUNUT1IgPSB7fTtcblxuZnVuY3Rpb24gY3JlYXRlQ2hhaW5lZEluamVjdG9yKHJvb3RWaWV3SW5qZWN0b3I6IEluamVjdG9yLCBtb2R1bGVJbmplY3RvcjogSW5qZWN0b3IpOiBJbmplY3RvciB7XG4gIHJldHVybiB7XG4gICAgZ2V0OiA8VD4odG9rZW46IFR5cGU8VD58IEluamVjdGlvblRva2VuPFQ+LCBub3RGb3VuZFZhbHVlPzogVCk6IFQgPT4ge1xuICAgICAgY29uc3QgdmFsdWUgPSByb290Vmlld0luamVjdG9yLmdldCh0b2tlbiwgTk9UX0ZPVU5EX0NIRUNLX09OTFlfRUxFTUVOVF9JTkpFQ1RPUik7XG5cbiAgICAgIGlmICh2YWx1ZSAhPT0gTk9UX0ZPVU5EX0NIRUNLX09OTFlfRUxFTUVOVF9JTkpFQ1RPUiB8fFxuICAgICAgICAgIG5vdEZvdW5kVmFsdWUgPT09IE5PVF9GT1VORF9DSEVDS19PTkxZX0VMRU1FTlRfSU5KRUNUT1IpIHtcbiAgICAgICAgLy8gUmV0dXJuIHRoZSB2YWx1ZSBmcm9tIHRoZSByb290IGVsZW1lbnQgaW5qZWN0b3Igd2hlblxuICAgICAgICAvLyAtIGl0IHByb3ZpZGVzIGl0XG4gICAgICAgIC8vICAgKHZhbHVlICE9PSBOT1RfRk9VTkRfQ0hFQ0tfT05MWV9FTEVNRU5UX0lOSkVDVE9SKVxuICAgICAgICAvLyAtIHRoZSBtb2R1bGUgaW5qZWN0b3Igc2hvdWxkIG5vdCBiZSBjaGVja2VkXG4gICAgICAgIC8vICAgKG5vdEZvdW5kVmFsdWUgPT09IE5PVF9GT1VORF9DSEVDS19PTkxZX0VMRU1FTlRfSU5KRUNUT1IpXG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG1vZHVsZUluamVjdG9yLmdldCh0b2tlbiwgbm90Rm91bmRWYWx1ZSk7XG4gICAgfVxuICB9O1xufVxuXG4vKipcbiAqIFJlbmRlcjMgaW1wbGVtZW50YXRpb24gb2Yge0BsaW5rIHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeX0uXG4gKi9cbmV4cG9ydCBjbGFzcyBDb21wb25lbnRGYWN0b3J5PFQ+IGV4dGVuZHMgdmlld0VuZ2luZV9Db21wb25lbnRGYWN0b3J5PFQ+IHtcbiAgc2VsZWN0b3I6IHN0cmluZztcbiAgY29tcG9uZW50VHlwZTogVHlwZTxhbnk+O1xuICBuZ0NvbnRlbnRTZWxlY3RvcnM6IHN0cmluZ1tdO1xuXG4gIGdldCBpbnB1dHMoKToge3Byb3BOYW1lOiBzdHJpbmc7IHRlbXBsYXRlTmFtZTogc3RyaW5nO31bXSB7XG4gICAgcmV0dXJuIHRvUmVmQXJyYXkodGhpcy5jb21wb25lbnREZWYuaW5wdXRzKTtcbiAgfVxuXG4gIGdldCBvdXRwdXRzKCk6IHtwcm9wTmFtZTogc3RyaW5nOyB0ZW1wbGF0ZU5hbWU6IHN0cmluZzt9W10ge1xuICAgIHJldHVybiB0b1JlZkFycmF5KHRoaXMuY29tcG9uZW50RGVmLm91dHB1dHMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSBjb21wb25lbnREZWYgVGhlIGNvbXBvbmVudCBkZWZpbml0aW9uLlxuICAgKiBAcGFyYW0gbmdNb2R1bGUgVGhlIE5nTW9kdWxlUmVmIHRvIHdoaWNoIHRoZSBmYWN0b3J5IGlzIGJvdW5kLlxuICAgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIGNvbXBvbmVudERlZjogQ29tcG9uZW50RGVmPGFueT4sIHByaXZhdGUgbmdNb2R1bGU/OiB2aWV3RW5naW5lX05nTW9kdWxlUmVmPGFueT4pIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuY29tcG9uZW50VHlwZSA9IGNvbXBvbmVudERlZi50eXBlO1xuICAgIHRoaXMuc2VsZWN0b3IgPSBjb21wb25lbnREZWYuc2VsZWN0b3JzWzBdWzBdIGFzIHN0cmluZztcbiAgICAvLyBUaGUgY29tcG9uZW50IGRlZmluaXRpb24gZG9lcyBub3QgaW5jbHVkZSB0aGUgd2lsZGNhcmQgKCcqJykgc2VsZWN0b3IgaW4gaXRzIGxpc3QuXG4gICAgLy8gSXQgaXMgaW1wbGljaXRseSBleHBlY3RlZCBhcyB0aGUgZmlyc3QgaXRlbSBpbiB0aGUgcHJvamVjdGFibGUgbm9kZXMgYXJyYXkuXG4gICAgdGhpcy5uZ0NvbnRlbnRTZWxlY3RvcnMgPVxuICAgICAgICBjb21wb25lbnREZWYubmdDb250ZW50U2VsZWN0b3JzID8gWycqJywgLi4uY29tcG9uZW50RGVmLm5nQ29udGVudFNlbGVjdG9yc10gOiBbXTtcbiAgfVxuXG4gIGNyZWF0ZShcbiAgICAgIGluamVjdG9yOiBJbmplY3RvciwgcHJvamVjdGFibGVOb2Rlcz86IGFueVtdW118dW5kZWZpbmVkLCByb290U2VsZWN0b3JPck5vZGU/OiBhbnksXG4gICAgICBuZ01vZHVsZT86IHZpZXdFbmdpbmVfTmdNb2R1bGVSZWY8YW55Pnx1bmRlZmluZWQpOiB2aWV3RW5naW5lX0NvbXBvbmVudFJlZjxUPiB7XG4gICAgY29uc3QgaXNJbnRlcm5hbFJvb3RWaWV3ID0gcm9vdFNlbGVjdG9yT3JOb2RlID09PSB1bmRlZmluZWQ7XG4gICAgbmdNb2R1bGUgPSBuZ01vZHVsZSB8fCB0aGlzLm5nTW9kdWxlO1xuXG4gICAgY29uc3Qgcm9vdFZpZXdJbmplY3RvciA9XG4gICAgICAgIG5nTW9kdWxlID8gY3JlYXRlQ2hhaW5lZEluamVjdG9yKGluamVjdG9yLCBuZ01vZHVsZS5pbmplY3RvcikgOiBpbmplY3RvcjtcblxuICAgIGNvbnN0IHJlbmRlcmVyRmFjdG9yeSA9XG4gICAgICAgIHJvb3RWaWV3SW5qZWN0b3IuZ2V0KFJlbmRlcmVyRmFjdG9yeTIsIGRvbVJlbmRlcmVyRmFjdG9yeTMpIGFzIFJlbmRlcmVyRmFjdG9yeTM7XG4gICAgY29uc3Qgc2FuaXRpemVyID0gcm9vdFZpZXdJbmplY3Rvci5nZXQoU2FuaXRpemVyLCBudWxsKTtcblxuICAgIGNvbnN0IGhvc3RSTm9kZSA9IGlzSW50ZXJuYWxSb290VmlldyA/XG4gICAgICAgIGVsZW1lbnRDcmVhdGUodGhpcy5zZWxlY3RvciwgcmVuZGVyZXJGYWN0b3J5LmNyZWF0ZVJlbmRlcmVyKG51bGwsIHRoaXMuY29tcG9uZW50RGVmKSkgOlxuICAgICAgICBsb2NhdGVIb3N0RWxlbWVudChyZW5kZXJlckZhY3RvcnksIHJvb3RTZWxlY3Rvck9yTm9kZSk7XG5cbiAgICBjb25zdCByb290RmxhZ3MgPSB0aGlzLmNvbXBvbmVudERlZi5vblB1c2ggPyBMVmlld0ZsYWdzLkRpcnR5IHwgTFZpZXdGbGFncy5Jc1Jvb3QgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMgfCBMVmlld0ZsYWdzLklzUm9vdDtcbiAgICBjb25zdCByb290Q29udGV4dDogUm9vdENvbnRleHQgPVxuICAgICAgICAhaXNJbnRlcm5hbFJvb3RWaWV3ID8gcm9vdFZpZXdJbmplY3Rvci5nZXQoUk9PVF9DT05URVhUKSA6IGNyZWF0ZVJvb3RDb250ZXh0KCk7XG5cbiAgICBjb25zdCByZW5kZXJlciA9IHJlbmRlcmVyRmFjdG9yeS5jcmVhdGVSZW5kZXJlcihob3N0Uk5vZGUsIHRoaXMuY29tcG9uZW50RGVmKTtcblxuICAgIGlmIChyb290U2VsZWN0b3JPck5vZGUgJiYgaG9zdFJOb2RlKSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyU2V0QXR0cmlidXRlKys7XG4gICAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgP1xuICAgICAgICAgIHJlbmRlcmVyLnNldEF0dHJpYnV0ZShob3N0Uk5vZGUsICduZy12ZXJzaW9uJywgVkVSU0lPTi5mdWxsKSA6XG4gICAgICAgICAgaG9zdFJOb2RlLnNldEF0dHJpYnV0ZSgnbmctdmVyc2lvbicsIFZFUlNJT04uZnVsbCk7XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIHRoZSByb290IHZpZXcuIFVzZXMgZW1wdHkgVFZpZXcgYW5kIENvbnRlbnRUZW1wbGF0ZS5cbiAgICBjb25zdCByb290TFZpZXcgPSBjcmVhdGVMVmlldyhcbiAgICAgICAgbnVsbCwgY3JlYXRlVFZpZXcoLTEsIG51bGwsIDEsIDAsIG51bGwsIG51bGwsIG51bGwpLCByb290Q29udGV4dCwgcm9vdEZsYWdzLFxuICAgICAgICByZW5kZXJlckZhY3RvcnksIHJlbmRlcmVyLCBzYW5pdGl6ZXIsIHJvb3RWaWV3SW5qZWN0b3IpO1xuXG4gICAgLy8gcm9vdFZpZXcgaXMgdGhlIHBhcmVudCB3aGVuIGJvb3RzdHJhcHBpbmdcbiAgICBjb25zdCBvbGRMVmlldyA9IGVudGVyVmlldyhyb290TFZpZXcsIG51bGwpO1xuXG4gICAgbGV0IGNvbXBvbmVudDogVDtcbiAgICBsZXQgdEVsZW1lbnROb2RlOiBURWxlbWVudE5vZGU7XG4gICAgdHJ5IHtcbiAgICAgIGlmIChyZW5kZXJlckZhY3RvcnkuYmVnaW4pIHJlbmRlcmVyRmFjdG9yeS5iZWdpbigpO1xuXG4gICAgICBjb25zdCBjb21wb25lbnRWaWV3ID0gY3JlYXRlUm9vdENvbXBvbmVudFZpZXcoXG4gICAgICAgICAgaG9zdFJOb2RlLCB0aGlzLmNvbXBvbmVudERlZiwgcm9vdExWaWV3LCByZW5kZXJlckZhY3RvcnksIHJlbmRlcmVyKTtcblxuICAgICAgdEVsZW1lbnROb2RlID0gZ2V0VE5vZGUoMCwgcm9vdExWaWV3KSBhcyBURWxlbWVudE5vZGU7XG5cbiAgICAgIC8vIFRyYW5zZm9ybSB0aGUgYXJyYXlzIG9mIG5hdGl2ZSBub2RlcyBpbnRvIGEgc3RydWN0dXJlIHRoYXQgY2FuIGJlIGNvbnN1bWVkIGJ5IHRoZVxuICAgICAgLy8gcHJvamVjdGlvbiBpbnN0cnVjdGlvbi4gVGhpcyBpcyBuZWVkZWQgdG8gc3VwcG9ydCB0aGUgcmVwcm9qZWN0aW9uIG9mIHRoZXNlIG5vZGVzLlxuICAgICAgaWYgKHByb2plY3RhYmxlTm9kZXMpIHtcbiAgICAgICAgbGV0IGluZGV4ID0gMDtcbiAgICAgICAgY29uc3QgdFZpZXcgPSByb290TFZpZXdbVFZJRVddO1xuICAgICAgICBjb25zdCBwcm9qZWN0aW9uOiBUTm9kZVtdID0gdEVsZW1lbnROb2RlLnByb2plY3Rpb24gPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcm9qZWN0YWJsZU5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgY29uc3Qgbm9kZUxpc3QgPSBwcm9qZWN0YWJsZU5vZGVzW2ldO1xuICAgICAgICAgIGxldCBmaXJzdFROb2RlOiBUTm9kZXxudWxsID0gbnVsbDtcbiAgICAgICAgICBsZXQgcHJldmlvdXNUTm9kZTogVE5vZGV8bnVsbCA9IG51bGw7XG4gICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBub2RlTGlzdC5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgaWYgKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgICAgICAgICAgIC8vIEZvciBkeW5hbWljYWxseSBjcmVhdGVkIGNvbXBvbmVudHMgc3VjaCBhcyBDb21wb25lbnRSZWYsIHdlIGNyZWF0ZSBhIG5ldyBUVmlldyBmb3JcbiAgICAgICAgICAgICAgLy8gZWFjaCBpbnNlcnQuIFRoaXMgaXMgbm90IGlkZWFsIHNpbmNlIHdlIHNob3VsZCBiZSBzaGFyaW5nIHRoZSBUVmlld3MuXG4gICAgICAgICAgICAgIC8vIEFsc28gdGhlIGxvZ2ljIGhlcmUgc2hvdWxkIGJlIHNoYXJlZCB3aXRoIGBjb21wb25lbnQudHNgJ3MgYHJlbmRlckNvbXBvbmVudGBcbiAgICAgICAgICAgICAgLy8gbWV0aG9kLlxuICAgICAgICAgICAgICB0Vmlldy5leHBhbmRvU3RhcnRJbmRleCsrO1xuICAgICAgICAgICAgICB0Vmlldy5ibHVlcHJpbnQuc3BsaWNlKCsraW5kZXggKyBIRUFERVJfT0ZGU0VULCAwLCBudWxsKTtcbiAgICAgICAgICAgICAgdFZpZXcuZGF0YS5zcGxpY2UoaW5kZXggKyBIRUFERVJfT0ZGU0VULCAwLCBudWxsKTtcbiAgICAgICAgICAgICAgcm9vdExWaWV3LnNwbGljZShpbmRleCArIEhFQURFUl9PRkZTRVQsIDAsIG51bGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgdE5vZGUgPVxuICAgICAgICAgICAgICAgIGNyZWF0ZU5vZGVBdEluZGV4KGluZGV4LCBUTm9kZVR5cGUuRWxlbWVudCwgbm9kZUxpc3Rbal0gYXMgUkVsZW1lbnQsIG51bGwsIG51bGwpO1xuICAgICAgICAgICAgcHJldmlvdXNUTm9kZSA/IChwcmV2aW91c1ROb2RlLm5leHQgPSB0Tm9kZSkgOiAoZmlyc3RUTm9kZSA9IHROb2RlKTtcbiAgICAgICAgICAgIHByZXZpb3VzVE5vZGUgPSB0Tm9kZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcHJvamVjdGlvbi5wdXNoKGZpcnN0VE5vZGUgISk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gVE9ETzogc2hvdWxkIExpZmVjeWNsZUhvb2tzRmVhdHVyZSBhbmQgb3RoZXIgaG9zdCBmZWF0dXJlcyBiZSBnZW5lcmF0ZWQgYnkgdGhlIGNvbXBpbGVyIGFuZFxuICAgICAgLy8gZXhlY3V0ZWQgaGVyZT9cbiAgICAgIC8vIEFuZ3VsYXIgNSByZWZlcmVuY2U6IGh0dHBzOi8vc3RhY2tibGl0ei5jb20vZWRpdC9saWZlY3ljbGUtaG9va3MtdmNyZWZcbiAgICAgIGNvbXBvbmVudCA9IGNyZWF0ZVJvb3RDb21wb25lbnQoXG4gICAgICAgICAgY29tcG9uZW50VmlldywgdGhpcy5jb21wb25lbnREZWYsIHJvb3RMVmlldywgcm9vdENvbnRleHQsIFtMaWZlY3ljbGVIb29rc0ZlYXR1cmVdKTtcblxuICAgICAgYWRkVG9WaWV3VHJlZShyb290TFZpZXcsIEhFQURFUl9PRkZTRVQsIGNvbXBvbmVudFZpZXcpO1xuICAgICAgcmVmcmVzaERlc2NlbmRhbnRWaWV3cyhyb290TFZpZXcpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBsZWF2ZVZpZXcob2xkTFZpZXcpO1xuICAgICAgaWYgKHJlbmRlcmVyRmFjdG9yeS5lbmQpIHJlbmRlcmVyRmFjdG9yeS5lbmQoKTtcbiAgICB9XG5cbiAgICBjb25zdCBjb21wb25lbnRSZWYgPSBuZXcgQ29tcG9uZW50UmVmKFxuICAgICAgICB0aGlzLmNvbXBvbmVudFR5cGUsIGNvbXBvbmVudCxcbiAgICAgICAgY3JlYXRlRWxlbWVudFJlZih2aWV3RW5naW5lX0VsZW1lbnRSZWYsIHRFbGVtZW50Tm9kZSwgcm9vdExWaWV3KSwgcm9vdExWaWV3LCB0RWxlbWVudE5vZGUpO1xuXG4gICAgaWYgKGlzSW50ZXJuYWxSb290Vmlldykge1xuICAgICAgLy8gVGhlIGhvc3QgZWxlbWVudCBvZiB0aGUgaW50ZXJuYWwgcm9vdCB2aWV3IGlzIGF0dGFjaGVkIHRvIHRoZSBjb21wb25lbnQncyBob3N0IHZpZXcgbm9kZVxuICAgICAgY29tcG9uZW50UmVmLmhvc3RWaWV3Ll90Vmlld05vZGUgIS5jaGlsZCA9IHRFbGVtZW50Tm9kZTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbXBvbmVudFJlZjtcbiAgfVxufVxuXG5jb25zdCBjb21wb25lbnRGYWN0b3J5UmVzb2x2ZXI6IENvbXBvbmVudEZhY3RvcnlSZXNvbHZlciA9IG5ldyBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIoKTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyIGFuZCBzdG9yZXMgaXQgb24gdGhlIGluamVjdG9yLiBPciwgaWYgdGhlXG4gKiBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXJcbiAqIGFscmVhZHkgZXhpc3RzLCByZXRyaWV2ZXMgdGhlIGV4aXN0aW5nIENvbXBvbmVudEZhY3RvcnlSZXNvbHZlci5cbiAqXG4gKiBAcmV0dXJucyBUaGUgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyIGluc3RhbmNlIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0Q29tcG9uZW50RmFjdG9yeVJlc29sdmVyKCk6IHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyIHtcbiAgcmV0dXJuIGNvbXBvbmVudEZhY3RvcnlSZXNvbHZlcjtcbn1cblxuLyoqXG4gKiBSZXByZXNlbnRzIGFuIGluc3RhbmNlIG9mIGEgQ29tcG9uZW50IGNyZWF0ZWQgdmlhIGEge0BsaW5rIENvbXBvbmVudEZhY3Rvcnl9LlxuICpcbiAqIGBDb21wb25lbnRSZWZgIHByb3ZpZGVzIGFjY2VzcyB0byB0aGUgQ29tcG9uZW50IEluc3RhbmNlIGFzIHdlbGwgb3RoZXIgb2JqZWN0cyByZWxhdGVkIHRvIHRoaXNcbiAqIENvbXBvbmVudCBJbnN0YW5jZSBhbmQgYWxsb3dzIHlvdSB0byBkZXN0cm95IHRoZSBDb21wb25lbnQgSW5zdGFuY2UgdmlhIHRoZSB7QGxpbmsgI2Rlc3Ryb3l9XG4gKiBtZXRob2QuXG4gKlxuICovXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50UmVmPFQ+IGV4dGVuZHMgdmlld0VuZ2luZV9Db21wb25lbnRSZWY8VD4ge1xuICBkZXN0cm95Q2JzOiAoKCkgPT4gdm9pZClbXXxudWxsID0gW107XG4gIGluc3RhbmNlOiBUO1xuICBob3N0VmlldzogVmlld1JlZjxUPjtcbiAgY2hhbmdlRGV0ZWN0b3JSZWY6IFZpZXdFbmdpbmVfQ2hhbmdlRGV0ZWN0b3JSZWY7XG4gIGNvbXBvbmVudFR5cGU6IFR5cGU8VD47XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBjb21wb25lbnRUeXBlOiBUeXBlPFQ+LCBpbnN0YW5jZTogVCwgcHVibGljIGxvY2F0aW9uOiB2aWV3RW5naW5lX0VsZW1lbnRSZWYsXG4gICAgICBwcml2YXRlIF9yb290TFZpZXc6IExWaWV3LFxuICAgICAgcHJpdmF0ZSBfdE5vZGU6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxURWxlbWVudENvbnRhaW5lck5vZGUpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuaW5zdGFuY2UgPSBpbnN0YW5jZTtcbiAgICB0aGlzLmhvc3RWaWV3ID0gdGhpcy5jaGFuZ2VEZXRlY3RvclJlZiA9IG5ldyBSb290Vmlld1JlZjxUPihfcm9vdExWaWV3KTtcbiAgICB0aGlzLmhvc3RWaWV3Ll90Vmlld05vZGUgPSBjcmVhdGVWaWV3Tm9kZSgtMSwgX3Jvb3RMVmlldyk7XG4gICAgdGhpcy5jb21wb25lbnRUeXBlID0gY29tcG9uZW50VHlwZTtcbiAgfVxuXG4gIGdldCBpbmplY3RvcigpOiBJbmplY3RvciB7IHJldHVybiBuZXcgTm9kZUluamVjdG9yKHRoaXMuX3ROb2RlLCB0aGlzLl9yb290TFZpZXcpOyB9XG5cbiAgZGVzdHJveSgpOiB2b2lkIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh0aGlzLmRlc3Ryb3lDYnMsICdOZ01vZHVsZSBhbHJlYWR5IGRlc3Ryb3llZCcpO1xuICAgIHRoaXMuZGVzdHJveUNicyAhLmZvckVhY2goZm4gPT4gZm4oKSk7XG4gICAgdGhpcy5kZXN0cm95Q2JzID0gbnVsbDtcbiAgICB0aGlzLmhvc3RWaWV3LmRlc3Ryb3koKTtcbiAgfVxuICBvbkRlc3Ryb3koY2FsbGJhY2s6ICgpID0+IHZvaWQpOiB2b2lkIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh0aGlzLmRlc3Ryb3lDYnMsICdOZ01vZHVsZSBhbHJlYWR5IGRlc3Ryb3llZCcpO1xuICAgIHRoaXMuZGVzdHJveUNicyAhLnB1c2goY2FsbGJhY2spO1xuICB9XG59XG4iXX0=