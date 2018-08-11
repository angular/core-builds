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
            elementCreate(this.selector, rendererFactory.createRenderer(null, this.componentDef)) :
            locateHostElement(rendererFactory, rootSelectorOrNode);
        /** @type {?} */
        const componentTag = /** @type {?} */ (((/** @type {?} */ ((this.componentDef.selectors))[0]))[0]);
        /** @type {?} */
        const rootContext = ngModule && !isInternalRootView ?
            ngModule.injector.get(ROOT_CONTEXT) :
            createRootContext(requestAnimationFrame.bind(window));
        /** @type {?} */
        const rootView = createLViewData(rendererFactory.createRenderer(hostNode, this.componentDef), createTView(-1, null, null, null, null), rootContext, this.componentDef.onPush ? 4 /* Dirty */ : 2 /* CheckAlways */);
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
        this.hostView = this.changeDetectorRef = new RootViewRef(rootView);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50X3JlZi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvY29tcG9uZW50X3JlZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVNBLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUNyRCxPQUFPLEVBQVcsTUFBTSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDaEQsT0FBTyxFQUFDLGdCQUFnQixJQUFJLDJCQUEyQixFQUFFLFlBQVksSUFBSSx1QkFBdUIsRUFBQyxNQUFNLDZCQUE2QixDQUFDO0FBQ3JJLE9BQU8sRUFBQyx3QkFBd0IsSUFBSSxtQ0FBbUMsRUFBQyxNQUFNLHNDQUFzQyxDQUFDO0FBQ3JILE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUVqRCxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFHL0MsT0FBTyxFQUFDLG1CQUFtQixFQUFFLGFBQWEsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUM1RCxPQUFPLEVBQUMscUJBQXFCLEVBQUUsaUJBQWlCLEVBQUMsTUFBTSxhQUFhLENBQUM7QUFDckUsT0FBTyxFQUFDLG1CQUFtQixFQUFFLFdBQVcsRUFBRSxlQUFlLEVBQUUsV0FBVyxFQUFFLGFBQWEsRUFBRSxTQUFTLEVBQUUsV0FBVyxFQUFFLDRCQUE0QixFQUFFLGlCQUFpQixFQUFFLHNCQUFzQixFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFHOU0sT0FBTyxFQUFXLG1CQUFtQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDcEUsT0FBTyxFQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFzQyxLQUFLLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUN0RyxPQUFPLEVBQUMsV0FBVyxFQUFVLE1BQU0sWUFBWSxDQUFDO0FBRWhELE1BQU0sK0JBQWdD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SSxDQUFDLFVBQVUsRUFBRSw0QkFBNEIsQ0FBQyxDQUFDO1VBQzFFLElBQUksQ0FBQyxVQUFVLEdBQUcsT0FBTyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ3BDLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO0tBQ3hCOzs7OztJQUNELFNBQVMsQ0FBQyxRQUFvQjtRQUM1QixTQUFTLElBQUksYUFBYSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsNEJBQTRCLENBQUMsQ0FBQztVQUMxRSxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxRQUFRO0tBQ2hDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Q2hhbmdlRGV0ZWN0b3JSZWZ9IGZyb20gJy4uL2NoYW5nZV9kZXRlY3Rpb24vY2hhbmdlX2RldGVjdG9yX3JlZic7XG5pbXBvcnQge0luamVjdGlvblRva2VufSBmcm9tICcuLi9kaS9pbmplY3Rpb25fdG9rZW4nO1xuaW1wb3J0IHtJbmplY3RvciwgaW5qZWN0fSBmcm9tICcuLi9kaS9pbmplY3Rvcic7XG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnkgYXMgdmlld0VuZ2luZV9Db21wb25lbnRGYWN0b3J5LCBDb21wb25lbnRSZWYgYXMgdmlld0VuZ2luZV9Db21wb25lbnRSZWZ9IGZyb20gJy4uL2xpbmtlci9jb21wb25lbnRfZmFjdG9yeSc7XG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnlSZXNvbHZlciBhcyB2aWV3RW5naW5lX0NvbXBvbmVudEZhY3RvcnlSZXNvbHZlcn0gZnJvbSAnLi4vbGlua2VyL2NvbXBvbmVudF9mYWN0b3J5X3Jlc29sdmVyJztcbmltcG9ydCB7RWxlbWVudFJlZn0gZnJvbSAnLi4vbGlua2VyL2VsZW1lbnRfcmVmJztcbmltcG9ydCB7TmdNb2R1bGVSZWYgYXMgdmlld0VuZ2luZV9OZ01vZHVsZVJlZn0gZnJvbSAnLi4vbGlua2VyL25nX21vZHVsZV9mYWN0b3J5JztcbmltcG9ydCB7UmVuZGVyZXJGYWN0b3J5Mn0gZnJvbSAnLi4vcmVuZGVyL2FwaSc7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL3R5cGUnO1xuXG5pbXBvcnQge2Fzc2VydENvbXBvbmVudFR5cGUsIGFzc2VydERlZmluZWR9IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7TGlmZWN5Y2xlSG9va3NGZWF0dXJlLCBjcmVhdGVSb290Q29udGV4dH0gZnJvbSAnLi9jb21wb25lbnQnO1xuaW1wb3J0IHtiYXNlRGlyZWN0aXZlQ3JlYXRlLCBjcmVhdGVMTm9kZSwgY3JlYXRlTFZpZXdEYXRhLCBjcmVhdGVUVmlldywgZWxlbWVudENyZWF0ZSwgZW50ZXJWaWV3LCBob3N0RWxlbWVudCwgaW5pdENoYW5nZURldGVjdG9ySWZFeGlzdGluZywgbG9jYXRlSG9zdEVsZW1lbnQsIHJlbmRlckVtYmVkZGVkVGVtcGxhdGV9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zJztcbmltcG9ydCB7Q29tcG9uZW50RGVmSW50ZXJuYWwsIENvbXBvbmVudFR5cGUsIFJlbmRlckZsYWdzfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge0xFbGVtZW50Tm9kZSwgVE5vZGUsIFROb2RlVHlwZX0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtSRWxlbWVudCwgZG9tUmVuZGVyZXJGYWN0b3J5M30gZnJvbSAnLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7Q09OVEVYVCwgRkxBR1MsIElOSkVDVE9SLCBMVmlld0RhdGEsIExWaWV3RmxhZ3MsIFJvb3RDb250ZXh0LCBUVklFV30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtSb290Vmlld1JlZiwgVmlld1JlZn0gZnJvbSAnLi92aWV3X3JlZic7XG5cbmV4cG9ydCBjbGFzcyBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIgZXh0ZW5kcyB2aWV3RW5naW5lX0NvbXBvbmVudEZhY3RvcnlSZXNvbHZlciB7XG4gIHJlc29sdmVDb21wb25lbnRGYWN0b3J5PFQ+KGNvbXBvbmVudDogVHlwZTxUPik6IHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeTxUPiB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydENvbXBvbmVudFR5cGUoY29tcG9uZW50KTtcbiAgICBjb25zdCBjb21wb25lbnREZWYgPSAoY29tcG9uZW50IGFzIENvbXBvbmVudFR5cGU8VD4pLm5nQ29tcG9uZW50RGVmO1xuICAgIHJldHVybiBuZXcgQ29tcG9uZW50RmFjdG9yeShjb21wb25lbnREZWYpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHRvUmVmQXJyYXkobWFwOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfSk6IHtwcm9wTmFtZTogc3RyaW5nOyB0ZW1wbGF0ZU5hbWU6IHN0cmluZzt9W10ge1xuICBjb25zdCBhcnJheToge3Byb3BOYW1lOiBzdHJpbmc7IHRlbXBsYXRlTmFtZTogc3RyaW5nO31bXSA9IFtdO1xuICBmb3IgKGxldCBub25NaW5pZmllZCBpbiBtYXApIHtcbiAgICBpZiAobWFwLmhhc093blByb3BlcnR5KG5vbk1pbmlmaWVkKSkge1xuICAgICAgY29uc3QgbWluaWZpZWQgPSBtYXBbbm9uTWluaWZpZWRdO1xuICAgICAgYXJyYXkucHVzaCh7cHJvcE5hbWU6IG1pbmlmaWVkLCB0ZW1wbGF0ZU5hbWU6IG5vbk1pbmlmaWVkfSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBhcnJheTtcbn1cblxuLyoqXG4gKiBEZWZhdWx0IHtAbGluayBSb290Q29udGV4dH0gZm9yIGFsbCBjb21wb25lbnRzIHJlbmRlcmVkIHdpdGgge0BsaW5rIHJlbmRlckNvbXBvbmVudH0uXG4gKi9cbmV4cG9ydCBjb25zdCBST09UX0NPTlRFWFQgPSBuZXcgSW5qZWN0aW9uVG9rZW48Um9vdENvbnRleHQ+KFxuICAgICdST09UX0NPTlRFWFRfVE9LRU4nLFxuICAgIHtwcm92aWRlZEluOiAncm9vdCcsIGZhY3Rvcnk6ICgpID0+IGNyZWF0ZVJvb3RDb250ZXh0KGluamVjdChTQ0hFRFVMRVIpKX0pO1xuXG4vKipcbiAqIEEgY2hhbmdlIGRldGVjdGlvbiBzY2hlZHVsZXIgdG9rZW4gZm9yIHtAbGluayBSb290Q29udGV4dH0uIFRoaXMgdG9rZW4gaXMgdGhlIGRlZmF1bHQgdmFsdWUgdXNlZFxuICogZm9yIHRoZSBkZWZhdWx0IGBSb290Q29udGV4dGAgZm91bmQgaW4gdGhlIHtAbGluayBST09UX0NPTlRFWFR9IHRva2VuLlxuICovXG5leHBvcnQgY29uc3QgU0NIRURVTEVSID0gbmV3IEluamVjdGlvblRva2VuPCgoZm46ICgpID0+IHZvaWQpID0+IHZvaWQpPihcbiAgICAnU0NIRURVTEVSX1RPS0VOJywge3Byb3ZpZGVkSW46ICdyb290JywgZmFjdG9yeTogKCkgPT4gcmVxdWVzdEFuaW1hdGlvbkZyYW1lLmJpbmQod2luZG93KX0pO1xuXG4vKipcbiAqIFJlbmRlcjMgaW1wbGVtZW50YXRpb24gb2Yge0BsaW5rIHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeX0uXG4gKi9cbmV4cG9ydCBjbGFzcyBDb21wb25lbnRGYWN0b3J5PFQ+IGV4dGVuZHMgdmlld0VuZ2luZV9Db21wb25lbnRGYWN0b3J5PFQ+IHtcbiAgc2VsZWN0b3I6IHN0cmluZztcbiAgY29tcG9uZW50VHlwZTogVHlwZTxhbnk+O1xuICBuZ0NvbnRlbnRTZWxlY3RvcnM6IHN0cmluZ1tdO1xuICBnZXQgaW5wdXRzKCk6IHtwcm9wTmFtZTogc3RyaW5nOyB0ZW1wbGF0ZU5hbWU6IHN0cmluZzt9W10ge1xuICAgIHJldHVybiB0b1JlZkFycmF5KHRoaXMuY29tcG9uZW50RGVmLmlucHV0cyk7XG4gIH1cbiAgZ2V0IG91dHB1dHMoKToge3Byb3BOYW1lOiBzdHJpbmc7IHRlbXBsYXRlTmFtZTogc3RyaW5nO31bXSB7XG4gICAgcmV0dXJuIHRvUmVmQXJyYXkodGhpcy5jb21wb25lbnREZWYub3V0cHV0cyk7XG4gIH1cblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGNvbXBvbmVudERlZjogQ29tcG9uZW50RGVmSW50ZXJuYWw8YW55Pikge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5jb21wb25lbnRUeXBlID0gY29tcG9uZW50RGVmLnR5cGU7XG4gICAgdGhpcy5zZWxlY3RvciA9IGNvbXBvbmVudERlZi5zZWxlY3RvcnNbMF1bMF0gYXMgc3RyaW5nO1xuICAgIHRoaXMubmdDb250ZW50U2VsZWN0b3JzID0gW107XG4gIH1cblxuICBjcmVhdGUoXG4gICAgICBpbmplY3RvcjogSW5qZWN0b3IsIHByb2plY3RhYmxlTm9kZXM/OiBhbnlbXVtdfHVuZGVmaW5lZCwgcm9vdFNlbGVjdG9yT3JOb2RlPzogYW55LFxuICAgICAgbmdNb2R1bGU/OiB2aWV3RW5naW5lX05nTW9kdWxlUmVmPGFueT58dW5kZWZpbmVkKTogdmlld0VuZ2luZV9Db21wb25lbnRSZWY8VD4ge1xuICAgIGNvbnN0IGlzSW50ZXJuYWxSb290VmlldyA9IHJvb3RTZWxlY3Rvck9yTm9kZSA9PT0gdW5kZWZpbmVkO1xuXG4gICAgY29uc3QgcmVuZGVyZXJGYWN0b3J5ID1cbiAgICAgICAgbmdNb2R1bGUgPyBuZ01vZHVsZS5pbmplY3Rvci5nZXQoUmVuZGVyZXJGYWN0b3J5MikgOiBkb21SZW5kZXJlckZhY3RvcnkzO1xuICAgIGNvbnN0IGhvc3ROb2RlID0gaXNJbnRlcm5hbFJvb3RWaWV3ID9cbiAgICAgICAgZWxlbWVudENyZWF0ZSh0aGlzLnNlbGVjdG9yLCByZW5kZXJlckZhY3RvcnkuY3JlYXRlUmVuZGVyZXIobnVsbCwgdGhpcy5jb21wb25lbnREZWYpKSA6XG4gICAgICAgIGxvY2F0ZUhvc3RFbGVtZW50KHJlbmRlcmVyRmFjdG9yeSwgcm9vdFNlbGVjdG9yT3JOb2RlKTtcblxuICAgIC8vIFRoZSBmaXJzdCBpbmRleCBvZiB0aGUgZmlyc3Qgc2VsZWN0b3IgaXMgdGhlIHRhZyBuYW1lLlxuICAgIGNvbnN0IGNvbXBvbmVudFRhZyA9IHRoaXMuY29tcG9uZW50RGVmLnNlbGVjdG9ycyAhWzBdICFbMF0gYXMgc3RyaW5nO1xuXG4gICAgY29uc3Qgcm9vdENvbnRleHQ6IFJvb3RDb250ZXh0ID0gbmdNb2R1bGUgJiYgIWlzSW50ZXJuYWxSb290VmlldyA/XG4gICAgICAgIG5nTW9kdWxlLmluamVjdG9yLmdldChST09UX0NPTlRFWFQpIDpcbiAgICAgICAgY3JlYXRlUm9vdENvbnRleHQocmVxdWVzdEFuaW1hdGlvbkZyYW1lLmJpbmQod2luZG93KSk7XG5cbiAgICAvLyBDcmVhdGUgdGhlIHJvb3Qgdmlldy4gVXNlcyBlbXB0eSBUVmlldyBhbmQgQ29udGVudFRlbXBsYXRlLlxuICAgIGNvbnN0IHJvb3RWaWV3OiBMVmlld0RhdGEgPSBjcmVhdGVMVmlld0RhdGEoXG4gICAgICAgIHJlbmRlcmVyRmFjdG9yeS5jcmVhdGVSZW5kZXJlcihob3N0Tm9kZSwgdGhpcy5jb21wb25lbnREZWYpLFxuICAgICAgICBjcmVhdGVUVmlldygtMSwgbnVsbCwgbnVsbCwgbnVsbCwgbnVsbCksIHJvb3RDb250ZXh0LFxuICAgICAgICB0aGlzLmNvbXBvbmVudERlZi5vblB1c2ggPyBMVmlld0ZsYWdzLkRpcnR5IDogTFZpZXdGbGFncy5DaGVja0Fsd2F5cyk7XG4gICAgcm9vdFZpZXdbSU5KRUNUT1JdID0gbmdNb2R1bGUgJiYgbmdNb2R1bGUuaW5qZWN0b3IgfHwgbnVsbDtcblxuICAgIC8vIHJvb3RWaWV3IGlzIHRoZSBwYXJlbnQgd2hlbiBib290c3RyYXBwaW5nXG4gICAgY29uc3Qgb2xkVmlldyA9IGVudGVyVmlldyhyb290VmlldywgbnVsbCAhKTtcblxuICAgIGxldCBjb21wb25lbnQ6IFQ7XG4gICAgbGV0IGVsZW1lbnROb2RlOiBMRWxlbWVudE5vZGU7XG4gICAgdHJ5IHtcbiAgICAgIGlmIChyZW5kZXJlckZhY3RvcnkuYmVnaW4pIHJlbmRlcmVyRmFjdG9yeS5iZWdpbigpO1xuXG4gICAgICAvLyBDcmVhdGUgZWxlbWVudCBub2RlIGF0IGluZGV4IDAgaW4gZGF0YSBhcnJheVxuICAgICAgZWxlbWVudE5vZGUgPSBob3N0RWxlbWVudChjb21wb25lbnRUYWcsIGhvc3ROb2RlLCB0aGlzLmNvbXBvbmVudERlZik7XG5cbiAgICAgIC8vIENyZWF0ZSBkaXJlY3RpdmUgaW5zdGFuY2Ugd2l0aCBmYWN0b3J5KCkgYW5kIHN0b3JlIGF0IGluZGV4IDAgaW4gZGlyZWN0aXZlcyBhcnJheVxuICAgICAgcm9vdENvbnRleHQuY29tcG9uZW50cy5wdXNoKFxuICAgICAgICAgIGNvbXBvbmVudCA9IGJhc2VEaXJlY3RpdmVDcmVhdGUoMCwgdGhpcy5jb21wb25lbnREZWYuZmFjdG9yeSgpLCB0aGlzLmNvbXBvbmVudERlZikgYXMgVCk7XG4gICAgICBpbml0Q2hhbmdlRGV0ZWN0b3JJZkV4aXN0aW5nKGVsZW1lbnROb2RlLm5vZGVJbmplY3RvciwgY29tcG9uZW50LCBlbGVtZW50Tm9kZS5kYXRhICEpO1xuICAgICAgKGVsZW1lbnROb2RlLmRhdGEgYXMgTFZpZXdEYXRhKVtDT05URVhUXSA9IGNvbXBvbmVudDtcblxuICAgICAgLy8gVE9ETzogc2hvdWxkIExpZmVjeWNsZUhvb2tzRmVhdHVyZSBhbmQgb3RoZXIgaG9zdCBmZWF0dXJlcyBiZSBnZW5lcmF0ZWQgYnkgdGhlIGNvbXBpbGVyIGFuZFxuICAgICAgLy8gZXhlY3V0ZWQgaGVyZT9cbiAgICAgIC8vIEFuZ3VsYXIgNSByZWZlcmVuY2U6IGh0dHBzOi8vc3RhY2tibGl0ei5jb20vZWRpdC9saWZlY3ljbGUtaG9va3MtdmNyZWZcbiAgICAgIExpZmVjeWNsZUhvb2tzRmVhdHVyZShjb21wb25lbnQsIHRoaXMuY29tcG9uZW50RGVmKTtcblxuICAgICAgLy8gVHJhbnNmb3JtIHRoZSBhcnJheXMgb2YgbmF0aXZlIG5vZGVzIGludG8gYSBMTm9kZSBzdHJ1Y3R1cmUgdGhhdCBjYW4gYmUgY29uc3VtZWQgYnkgdGhlXG4gICAgICAvLyBwcm9qZWN0aW9uIGluc3RydWN0aW9uLiBUaGlzIGlzIG5lZWRlZCB0byBzdXBwb3J0IHRoZSByZXByb2plY3Rpb24gb2YgdGhlc2Ugbm9kZXMuXG4gICAgICBpZiAocHJvamVjdGFibGVOb2Rlcykge1xuICAgICAgICBsZXQgaW5kZXggPSAwO1xuICAgICAgICBjb25zdCBwcm9qZWN0aW9uOiBUTm9kZVtdID0gZWxlbWVudE5vZGUudE5vZGUucHJvamVjdGlvbiA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByb2plY3RhYmxlTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBub2RlTGlzdCA9IHByb2plY3RhYmxlTm9kZXNbaV07XG4gICAgICAgICAgbGV0IGZpcnN0VE5vZGU6IFROb2RlfG51bGwgPSBudWxsO1xuICAgICAgICAgIGxldCBwcmV2aW91c1ROb2RlOiBUTm9kZXxudWxsID0gbnVsbDtcbiAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IG5vZGVMaXN0Lmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICBjb25zdCBsTm9kZSA9XG4gICAgICAgICAgICAgICAgY3JlYXRlTE5vZGUoKytpbmRleCwgVE5vZGVUeXBlLkVsZW1lbnQsIG5vZGVMaXN0W2pdIGFzIFJFbGVtZW50LCBudWxsLCBudWxsKTtcbiAgICAgICAgICAgIGlmIChwcmV2aW91c1ROb2RlKSB7XG4gICAgICAgICAgICAgIHByZXZpb3VzVE5vZGUubmV4dCA9IGxOb2RlLnROb2RlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgZmlyc3RUTm9kZSA9IGxOb2RlLnROb2RlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcHJldmlvdXNUTm9kZSA9IGxOb2RlLnROb2RlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBwcm9qZWN0aW9uLnB1c2goZmlyc3RUTm9kZSAhKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBFeGVjdXRlIHRoZSB0ZW1wbGF0ZSBpbiBjcmVhdGlvbiBtb2RlIG9ubHksIGFuZCB0aGVuIHR1cm4gb2ZmIHRoZSBDcmVhdGlvbk1vZGUgZmxhZ1xuICAgICAgcmVuZGVyRW1iZWRkZWRUZW1wbGF0ZShlbGVtZW50Tm9kZSwgZWxlbWVudE5vZGUuZGF0YSAhW1RWSUVXXSwgY29tcG9uZW50LCBSZW5kZXJGbGFncy5DcmVhdGUpO1xuICAgICAgZWxlbWVudE5vZGUuZGF0YSAhW0ZMQUdTXSAmPSB+TFZpZXdGbGFncy5DcmVhdGlvbk1vZGU7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIGVudGVyVmlldyhvbGRWaWV3LCBudWxsKTtcbiAgICAgIGlmIChyZW5kZXJlckZhY3RvcnkuZW5kKSByZW5kZXJlckZhY3RvcnkuZW5kKCk7XG4gICAgfVxuXG4gICAgY29uc3QgY29tcG9uZW50UmVmID1cbiAgICAgICAgbmV3IENvbXBvbmVudFJlZih0aGlzLmNvbXBvbmVudFR5cGUsIGNvbXBvbmVudCwgcm9vdFZpZXcsIGluamVjdG9yLCBob3N0Tm9kZSAhKTtcbiAgICBpZiAoaXNJbnRlcm5hbFJvb3RWaWV3KSB7XG4gICAgICAvLyBUaGUgaG9zdCBlbGVtZW50IG9mIHRoZSBpbnRlcm5hbCByb290IHZpZXcgaXMgYXR0YWNoZWQgdG8gdGhlIGNvbXBvbmVudCdzIGhvc3QgdmlldyBub2RlXG4gICAgICBjb21wb25lbnRSZWYuaG9zdFZpZXcuX2xWaWV3Tm9kZSAhLnROb2RlLmNoaWxkID0gZWxlbWVudE5vZGUudE5vZGU7XG4gICAgfVxuICAgIHJldHVybiBjb21wb25lbnRSZWY7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXByZXNlbnRzIGFuIGluc3RhbmNlIG9mIGEgQ29tcG9uZW50IGNyZWF0ZWQgdmlhIGEge0BsaW5rIENvbXBvbmVudEZhY3Rvcnl9LlxuICpcbiAqIGBDb21wb25lbnRSZWZgIHByb3ZpZGVzIGFjY2VzcyB0byB0aGUgQ29tcG9uZW50IEluc3RhbmNlIGFzIHdlbGwgb3RoZXIgb2JqZWN0cyByZWxhdGVkIHRvIHRoaXNcbiAqIENvbXBvbmVudCBJbnN0YW5jZSBhbmQgYWxsb3dzIHlvdSB0byBkZXN0cm95IHRoZSBDb21wb25lbnQgSW5zdGFuY2UgdmlhIHRoZSB7QGxpbmsgI2Rlc3Ryb3l9XG4gKiBtZXRob2QuXG4gKlxuICovXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50UmVmPFQ+IGV4dGVuZHMgdmlld0VuZ2luZV9Db21wb25lbnRSZWY8VD4ge1xuICBkZXN0cm95Q2JzOiAoKCkgPT4gdm9pZClbXXxudWxsID0gW107XG4gIGxvY2F0aW9uOiBFbGVtZW50UmVmPGFueT47XG4gIGluamVjdG9yOiBJbmplY3RvcjtcbiAgaW5zdGFuY2U6IFQ7XG4gIGhvc3RWaWV3OiBWaWV3UmVmPFQ+O1xuICBjaGFuZ2VEZXRlY3RvclJlZjogQ2hhbmdlRGV0ZWN0b3JSZWY7XG4gIGNvbXBvbmVudFR5cGU6IFR5cGU8VD47XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBjb21wb25lbnRUeXBlOiBUeXBlPFQ+LCBpbnN0YW5jZTogVCwgcm9vdFZpZXc6IExWaWV3RGF0YSwgaW5qZWN0b3I6IEluamVjdG9yLFxuICAgICAgaG9zdE5vZGU6IFJFbGVtZW50KSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmluc3RhbmNlID0gaW5zdGFuY2U7XG4gICAgdGhpcy5ob3N0VmlldyA9IHRoaXMuY2hhbmdlRGV0ZWN0b3JSZWYgPSBuZXcgUm9vdFZpZXdSZWY8VD4ocm9vdFZpZXcpO1xuICAgIHRoaXMuaG9zdFZpZXcuX2xWaWV3Tm9kZSA9IGNyZWF0ZUxOb2RlKC0xLCBUTm9kZVR5cGUuVmlldywgbnVsbCwgbnVsbCwgbnVsbCwgcm9vdFZpZXcpO1xuICAgIHRoaXMuaW5qZWN0b3IgPSBpbmplY3RvcjtcbiAgICB0aGlzLmxvY2F0aW9uID0gbmV3IEVsZW1lbnRSZWYoaG9zdE5vZGUpO1xuICAgIHRoaXMuY29tcG9uZW50VHlwZSA9IGNvbXBvbmVudFR5cGU7XG4gIH1cblxuICBkZXN0cm95KCk6IHZvaWQge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHRoaXMuZGVzdHJveUNicywgJ05nTW9kdWxlIGFscmVhZHkgZGVzdHJveWVkJyk7XG4gICAgdGhpcy5kZXN0cm95Q2JzICEuZm9yRWFjaChmbiA9PiBmbigpKTtcbiAgICB0aGlzLmRlc3Ryb3lDYnMgPSBudWxsO1xuICB9XG4gIG9uRGVzdHJveShjYWxsYmFjazogKCkgPT4gdm9pZCk6IHZvaWQge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHRoaXMuZGVzdHJveUNicywgJ05nTW9kdWxlIGFscmVhZHkgZGVzdHJveWVkJyk7XG4gICAgdGhpcy5kZXN0cm95Q2JzICEucHVzaChjYWxsYmFjayk7XG4gIH1cbn1cbiJdfQ==