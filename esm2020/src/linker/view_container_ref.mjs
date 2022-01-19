/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { isType } from '../interface/type';
import { assertNodeInjector } from '../render3/assert';
import { ComponentFactory as R3ComponentFactory } from '../render3/component_ref';
import { getComponentDef } from '../render3/definition';
import { getParentInjectorLocation, NodeInjector } from '../render3/di';
import { addToViewTree, createLContainer } from '../render3/instructions/shared';
import { CONTAINER_HEADER_OFFSET, NATIVE, VIEW_REFS } from '../render3/interfaces/container';
import { isLContainer } from '../render3/interfaces/type_checks';
import { PARENT, RENDERER, T_HOST, TVIEW } from '../render3/interfaces/view';
import { assertTNodeType } from '../render3/node_assert';
import { addViewToContainer, destroyLView, detachView, getBeforeNodeForView, insertView, nativeInsertBefore, nativeNextSibling, nativeParentNode } from '../render3/node_manipulation';
import { getCurrentTNode, getLView } from '../render3/state';
import { getParentInjectorIndex, getParentInjectorView, hasParentInjector } from '../render3/util/injector_utils';
import { getNativeByTNode, unwrapRNode, viewAttachedToContainer } from '../render3/util/view_utils';
import { ViewRef as R3ViewRef } from '../render3/view_ref';
import { addToArray, removeFromArray } from '../util/array_utils';
import { assertDefined, assertEqual, assertGreaterThan, assertLessThan } from '../util/assert';
import { createElementRef } from './element_ref';
import { NgModuleRef } from './ng_module_factory';
/**
 * Represents a container where one or more views can be attached to a component.
 *
 * Can contain *host views* (created by instantiating a
 * component with the `createComponent()` method), and *embedded views*
 * (created by instantiating a `TemplateRef` with the `createEmbeddedView()` method).
 *
 * A view container instance can contain other view containers,
 * creating a [view hierarchy](guide/glossary#view-tree).
 *
 * @see `ComponentRef`
 * @see `EmbeddedViewRef`
 *
 * @publicApi
 */
export class ViewContainerRef {
}
/**
 * @internal
 * @nocollapse
 */
ViewContainerRef.__NG_ELEMENT_ID__ = injectViewContainerRef;
/**
 * Creates a ViewContainerRef and stores it on the injector. Or, if the ViewContainerRef
 * already exists, retrieves the existing ViewContainerRef.
 *
 * @returns The ViewContainerRef instance to use
 */
export function injectViewContainerRef() {
    const previousTNode = getCurrentTNode();
    return createContainerRef(previousTNode, getLView());
}
const VE_ViewContainerRef = ViewContainerRef;
// TODO(alxhub): cleaning up this indirection triggers a subtle bug in Closure in g3. Once the fix
// for that lands, this can be cleaned up.
const R3ViewContainerRef = class ViewContainerRef extends VE_ViewContainerRef {
    constructor(_lContainer, _hostTNode, _hostLView) {
        super();
        this._lContainer = _lContainer;
        this._hostTNode = _hostTNode;
        this._hostLView = _hostLView;
    }
    get element() {
        return createElementRef(this._hostTNode, this._hostLView);
    }
    get injector() {
        return new NodeInjector(this._hostTNode, this._hostLView);
    }
    /** @deprecated No replacement */
    get parentInjector() {
        const parentLocation = getParentInjectorLocation(this._hostTNode, this._hostLView);
        if (hasParentInjector(parentLocation)) {
            const parentView = getParentInjectorView(parentLocation, this._hostLView);
            const injectorIndex = getParentInjectorIndex(parentLocation);
            ngDevMode && assertNodeInjector(parentView, injectorIndex);
            const parentTNode = parentView[TVIEW].data[injectorIndex + 8 /* TNODE */];
            return new NodeInjector(parentTNode, parentView);
        }
        else {
            return new NodeInjector(null, this._hostLView);
        }
    }
    clear() {
        while (this.length > 0) {
            this.remove(this.length - 1);
        }
    }
    get(index) {
        const viewRefs = getViewRefs(this._lContainer);
        return viewRefs !== null && viewRefs[index] || null;
    }
    get length() {
        return this._lContainer.length - CONTAINER_HEADER_OFFSET;
    }
    createEmbeddedView(templateRef, context, indexOrOptions) {
        let index;
        let injector;
        if (typeof indexOrOptions === 'number') {
            index = indexOrOptions;
        }
        else if (indexOrOptions != null) {
            index = indexOrOptions.index;
            injector = indexOrOptions.injector;
        }
        const viewRef = templateRef.createEmbeddedView(context || {}, injector);
        this.insert(viewRef, index);
        return viewRef;
    }
    createComponent(componentFactoryOrType, indexOrOptions, injector, projectableNodes, ngModuleRef) {
        const isComponentFactory = componentFactoryOrType && !isType(componentFactoryOrType);
        let index;
        // This function supports 2 signatures and we need to handle options correctly for both:
        //   1. When first argument is a Component type. This signature also requires extra
        //      options to be provided as as object (more ergonomic option).
        //   2. First argument is a Component factory. In this case extra options are represented as
        //      positional arguments. This signature is less ergonomic and will be deprecated.
        if (isComponentFactory) {
            if (ngDevMode) {
                assertEqual(typeof indexOrOptions !== 'object', true, 'It looks like Component factory was provided as the first argument ' +
                    'and an options object as the second argument. This combination of arguments ' +
                    'is incompatible. You can either change the first argument to provide Component ' +
                    'type or change the second argument to be a number (representing an index at ' +
                    'which to insert the new component\'s host view into this container)');
            }
            index = indexOrOptions;
        }
        else {
            if (ngDevMode) {
                assertDefined(getComponentDef(componentFactoryOrType), `Provided Component class doesn't contain Component definition. ` +
                    `Please check whether provided class has @Component decorator.`);
                assertEqual(typeof indexOrOptions !== 'number', true, 'It looks like Component type was provided as the first argument ' +
                    'and a number (representing an index at which to insert the new component\'s ' +
                    'host view into this container as the second argument. This combination of arguments ' +
                    'is incompatible. Please use an object as the second argument instead.');
            }
            const options = (indexOrOptions || {});
            index = options.index;
            injector = options.injector;
            projectableNodes = options.projectableNodes;
            ngModuleRef = options.ngModuleRef;
        }
        const componentFactory = isComponentFactory ?
            componentFactoryOrType :
            new R3ComponentFactory(getComponentDef(componentFactoryOrType));
        const contextInjector = injector || this.parentInjector;
        if (!ngModuleRef && componentFactory.ngModule == null && contextInjector) {
            // DO NOT REFACTOR. The code here used to have a `value || undefined` expression
            // which seems to cause internal google apps to fail. This is documented in the
            // following internal bug issue: go/b/142967802
            const result = contextInjector.get(NgModuleRef, null);
            if (result) {
                ngModuleRef = result;
            }
        }
        const componentRef = componentFactory.create(contextInjector, projectableNodes, undefined, ngModuleRef);
        this.insert(componentRef.hostView, index);
        return componentRef;
    }
    insert(viewRef, index) {
        const lView = viewRef._lView;
        const tView = lView[TVIEW];
        if (ngDevMode && viewRef.destroyed) {
            throw new Error('Cannot insert a destroyed View in a ViewContainer!');
        }
        if (viewAttachedToContainer(lView)) {
            // If view is already attached, detach it first so we clean up references appropriately.
            const prevIdx = this.indexOf(viewRef);
            // A view might be attached either to this or a different container. The `prevIdx` for
            // those cases will be:
            // equal to -1 for views attached to this ViewContainerRef
            // >= 0 for views attached to a different ViewContainerRef
            if (prevIdx !== -1) {
                this.detach(prevIdx);
            }
            else {
                const prevLContainer = lView[PARENT];
                ngDevMode &&
                    assertEqual(isLContainer(prevLContainer), true, 'An attached view should have its PARENT point to a container.');
                // We need to re-create a R3ViewContainerRef instance since those are not stored on
                // LView (nor anywhere else).
                const prevVCRef = new R3ViewContainerRef(prevLContainer, prevLContainer[T_HOST], prevLContainer[PARENT]);
                prevVCRef.detach(prevVCRef.indexOf(viewRef));
            }
        }
        // Logical operation of adding `LView` to `LContainer`
        const adjustedIdx = this._adjustIndex(index);
        const lContainer = this._lContainer;
        insertView(tView, lView, lContainer, adjustedIdx);
        // Physical operation of adding the DOM nodes.
        const beforeNode = getBeforeNodeForView(adjustedIdx, lContainer);
        const renderer = lView[RENDERER];
        const parentRNode = nativeParentNode(renderer, lContainer[NATIVE]);
        if (parentRNode !== null) {
            addViewToContainer(tView, lContainer[T_HOST], renderer, lView, parentRNode, beforeNode);
        }
        viewRef.attachToViewContainerRef();
        addToArray(getOrCreateViewRefs(lContainer), adjustedIdx, viewRef);
        return viewRef;
    }
    move(viewRef, newIndex) {
        if (ngDevMode && viewRef.destroyed) {
            throw new Error('Cannot move a destroyed View in a ViewContainer!');
        }
        return this.insert(viewRef, newIndex);
    }
    indexOf(viewRef) {
        const viewRefsArr = getViewRefs(this._lContainer);
        return viewRefsArr !== null ? viewRefsArr.indexOf(viewRef) : -1;
    }
    remove(index) {
        const adjustedIdx = this._adjustIndex(index, -1);
        const detachedView = detachView(this._lContainer, adjustedIdx);
        if (detachedView) {
            // Before destroying the view, remove it from the container's array of `ViewRef`s.
            // This ensures the view container length is updated before calling
            // `destroyLView`, which could recursively call view container methods that
            // rely on an accurate container length.
            // (e.g. a method on this view container being called by a child directive's OnDestroy
            // lifecycle hook)
            removeFromArray(getOrCreateViewRefs(this._lContainer), adjustedIdx);
            destroyLView(detachedView[TVIEW], detachedView);
        }
    }
    detach(index) {
        const adjustedIdx = this._adjustIndex(index, -1);
        const view = detachView(this._lContainer, adjustedIdx);
        const wasDetached = view && removeFromArray(getOrCreateViewRefs(this._lContainer), adjustedIdx) != null;
        return wasDetached ? new R3ViewRef(view) : null;
    }
    _adjustIndex(index, shift = 0) {
        if (index == null) {
            return this.length + shift;
        }
        if (ngDevMode) {
            assertGreaterThan(index, -1, `ViewRef index must be positive, got ${index}`);
            // +1 because it's legal to insert at the end.
            assertLessThan(index, this.length + 1 + shift, 'index');
        }
        return index;
    }
};
function getViewRefs(lContainer) {
    return lContainer[VIEW_REFS];
}
function getOrCreateViewRefs(lContainer) {
    return (lContainer[VIEW_REFS] || (lContainer[VIEW_REFS] = []));
}
/**
 * Creates a ViewContainerRef and stores it on the injector.
 *
 * @param ViewContainerRefToken The ViewContainerRef type
 * @param ElementRefToken The ElementRef type
 * @param hostTNode The node that is requesting a ViewContainerRef
 * @param hostLView The view to which the node belongs
 * @returns The ViewContainerRef instance to use
 */
export function createContainerRef(hostTNode, hostLView) {
    ngDevMode && assertTNodeType(hostTNode, 12 /* AnyContainer */ | 3 /* AnyRNode */);
    let lContainer;
    const slotValue = hostLView[hostTNode.index];
    if (isLContainer(slotValue)) {
        // If the host is a container, we don't need to create a new LContainer
        lContainer = slotValue;
    }
    else {
        let commentNode;
        // If the host is an element container, the native host element is guaranteed to be a
        // comment and we can reuse that comment as anchor element for the new LContainer.
        // The comment node in question is already part of the DOM structure so we don't need to append
        // it again.
        if (hostTNode.type & 8 /* ElementContainer */) {
            commentNode = unwrapRNode(slotValue);
        }
        else {
            // If the host is a regular element, we have to insert a comment node manually which will
            // be used as an anchor when inserting elements. In this specific case we use low-level DOM
            // manipulation to insert it.
            const renderer = hostLView[RENDERER];
            ngDevMode && ngDevMode.rendererCreateComment++;
            commentNode = renderer.createComment(ngDevMode ? 'container' : '');
            const hostNative = getNativeByTNode(hostTNode, hostLView);
            const parentOfHostNative = nativeParentNode(renderer, hostNative);
            nativeInsertBefore(renderer, parentOfHostNative, commentNode, nativeNextSibling(renderer, hostNative), false);
        }
        hostLView[hostTNode.index] = lContainer =
            createLContainer(slotValue, hostLView, commentNode, hostTNode);
        addToViewTree(hostLView, lContainer);
    }
    return new R3ViewContainerRef(lContainer, hostTNode, hostLView);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld19jb250YWluZXJfcmVmLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvbGlua2VyL3ZpZXdfY29udGFpbmVyX3JlZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFHSCxPQUFPLEVBQUMsTUFBTSxFQUFPLE1BQU0sbUJBQW1CLENBQUM7QUFDL0MsT0FBTyxFQUFDLGtCQUFrQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDckQsT0FBTyxFQUFDLGdCQUFnQixJQUFJLGtCQUFrQixFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFDaEYsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3RELE9BQU8sRUFBQyx5QkFBeUIsRUFBRSxZQUFZLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDdEUsT0FBTyxFQUFDLGFBQWEsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLGdDQUFnQyxDQUFDO0FBQy9FLE9BQU8sRUFBQyx1QkFBdUIsRUFBYyxNQUFNLEVBQUUsU0FBUyxFQUFDLE1BQU0saUNBQWlDLENBQUM7QUFJdkcsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLG1DQUFtQyxDQUFDO0FBQy9ELE9BQU8sRUFBUSxNQUFNLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUMsTUFBTSw0QkFBNEIsQ0FBQztBQUNsRixPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDdkQsT0FBTyxFQUFDLGtCQUFrQixFQUFFLFlBQVksRUFBRSxVQUFVLEVBQUUsb0JBQW9CLEVBQUUsVUFBVSxFQUFFLGtCQUFrQixFQUFFLGlCQUFpQixFQUFFLGdCQUFnQixFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFDckwsT0FBTyxFQUFDLGVBQWUsRUFBRSxRQUFRLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUMzRCxPQUFPLEVBQUMsc0JBQXNCLEVB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QztRQUMxQixxRkFBcUY7UUFDckYsa0ZBQWtGO1FBQ2xGLCtGQUErRjtRQUMvRixZQUFZO1FBQ1osSUFBSSxTQUFTLENBQUMsSUFBSSwyQkFBNkIsRUFBRTtZQUMvQyxXQUFXLEdBQUcsV0FBVyxDQUFDLFNBQVMsQ0FBYSxDQUFDO1NBQ2xEO2FBQU07WUFDTCx5RkFBeUY7WUFDekYsMkZBQTJGO1lBQzNGLDZCQUE2QjtZQUM3QixNQUFNLFFBQVEsR0FBRyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDckMsU0FBUyxJQUFJLFNBQVMsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO1lBQy9DLFdBQVcsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUVuRSxNQUFNLFVBQVUsR0FBRyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFFLENBQUM7WUFDM0QsTUFBTSxrQkFBa0IsR0FBRyxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDbEUsa0JBQWtCLENBQ2QsUUFBUSxFQUFFLGtCQUFtQixFQUFFLFdBQVcsRUFBRSxpQkFBaUIsQ0FBQyxRQUFRLEVBQUUsVUFBVSxDQUFDLEVBQ25GLEtBQUssQ0FBQyxDQUFDO1NBQ1o7UUFFRCxTQUFTLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxHQUFHLFVBQVU7WUFDbkMsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxXQUFXLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFFbkUsYUFBYSxDQUFDLFNBQVMsRUFBRSxVQUFVLENBQUMsQ0FBQztLQUN0QztJQUVELE9BQU8sSUFBSSxrQkFBa0IsQ0FBQyxVQUFVLEVBQUUsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0FBQ2xFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi4vZGkvaW5qZWN0b3InO1xuaW1wb3J0IHtpc1R5cGUsIFR5cGV9IGZyb20gJy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7YXNzZXJ0Tm9kZUluamVjdG9yfSBmcm9tICcuLi9yZW5kZXIzL2Fzc2VydCc7XG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnkgYXMgUjNDb21wb25lbnRGYWN0b3J5fSBmcm9tICcuLi9yZW5kZXIzL2NvbXBvbmVudF9yZWYnO1xuaW1wb3J0IHtnZXRDb21wb25lbnREZWZ9IGZyb20gJy4uL3JlbmRlcjMvZGVmaW5pdGlvbic7XG5pbXBvcnQge2dldFBhcmVudEluamVjdG9yTG9jYXRpb24sIE5vZGVJbmplY3Rvcn0gZnJvbSAnLi4vcmVuZGVyMy9kaSc7XG5pbXBvcnQge2FkZFRvVmlld1RyZWUsIGNyZWF0ZUxDb250YWluZXJ9IGZyb20gJy4uL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL3NoYXJlZCc7XG5pbXBvcnQge0NPTlRBSU5FUl9IRUFERVJfT0ZGU0VULCBMQ29udGFpbmVyLCBOQVRJVkUsIFZJRVdfUkVGU30gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge05vZGVJbmplY3Rvck9mZnNldH0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL2luamVjdG9yJztcbmltcG9ydCB7VENvbnRhaW5lck5vZGUsIFREaXJlY3RpdmVIb3N0Tm9kZSwgVEVsZW1lbnRDb250YWluZXJOb2RlLCBURWxlbWVudE5vZGUsIFROb2RlVHlwZX0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtSQ29tbWVudCwgUkVsZW1lbnR9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy9yZW5kZXJlcl9kb20nO1xuaW1wb3J0IHtpc0xDb250YWluZXJ9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy90eXBlX2NoZWNrcyc7XG5pbXBvcnQge0xWaWV3LCBQQVJFTlQsIFJFTkRFUkVSLCBUX0hPU1QsIFRWSUVXfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydFROb2RlVHlwZX0gZnJvbSAnLi4vcmVuZGVyMy9ub2RlX2Fzc2VydCc7XG5pbXBvcnQge2FkZFZpZXdUb0NvbnRhaW5lciwgZGVzdHJveUxWaWV3LCBkZXRhY2hWaWV3LCBnZXRCZWZvcmVOb2RlRm9yVmlldywgaW5zZXJ0VmlldywgbmF0aXZlSW5zZXJ0QmVmb3JlLCBuYXRpdmVOZXh0U2libGluZywgbmF0aXZlUGFyZW50Tm9kZX0gZnJvbSAnLi4vcmVuZGVyMy9ub2RlX21hbmlwdWxhdGlvbic7XG5pbXBvcnQge2dldEN1cnJlbnRUTm9kZSwgZ2V0TFZpZXd9IGZyb20gJy4uL3JlbmRlcjMvc3RhdGUnO1xuaW1wb3J0IHtnZXRQYXJlbnRJbmplY3RvckluZGV4LCBnZXRQYXJlbnRJbmplY3RvclZpZXcsIGhhc1BhcmVudEluamVjdG9yfSBmcm9tICcuLi9yZW5kZXIzL3V0aWwvaW5qZWN0b3JfdXRpbHMnO1xuaW1wb3J0IHtnZXROYXRpdmVCeVROb2RlLCB1bndyYXBSTm9kZSwgdmlld0F0dGFjaGVkVG9Db250YWluZXJ9IGZyb20gJy4uL3JlbmRlcjMvdXRpbC92aWV3X3V0aWxzJztcbmltcG9ydCB7Vmlld1JlZiBhcyBSM1ZpZXdSZWZ9IGZyb20gJy4uL3JlbmRlcjMvdmlld19yZWYnO1xuaW1wb3J0IHthZGRUb0FycmF5LCByZW1vdmVGcm9tQXJyYXl9IGZyb20gJy4uL3V0aWwvYXJyYXlfdXRpbHMnO1xuaW1wb3J0IHthc3NlcnREZWZpbmVkLCBhc3NlcnRFcXVhbCwgYXNzZXJ0R3JlYXRlclRoYW4sIGFzc2VydExlc3NUaGFufSBmcm9tICcuLi91dGlsL2Fzc2VydCc7XG5cbmltcG9ydCB7Q29tcG9uZW50RmFjdG9yeSwgQ29tcG9uZW50UmVmfSBmcm9tICcuL2NvbXBvbmVudF9mYWN0b3J5JztcbmltcG9ydCB7Y3JlYXRlRWxlbWVudFJlZiwgRWxlbWVudFJlZn0gZnJvbSAnLi9lbGVtZW50X3JlZic7XG5pbXBvcnQge05nTW9kdWxlUmVmfSBmcm9tICcuL25nX21vZHVsZV9mYWN0b3J5JztcbmltcG9ydCB7VGVtcGxhdGVSZWZ9IGZyb20gJy4vdGVtcGxhdGVfcmVmJztcbmltcG9ydCB7RW1iZWRkZWRWaWV3UmVmLCBWaWV3UmVmfSBmcm9tICcuL3ZpZXdfcmVmJztcbi8qKlxuICogUmVwcmVzZW50cyBhIGNvbnRhaW5lciB3aGVyZSBvbmUgb3IgbW9yZSB2aWV3cyBjYW4gYmUgYXR0YWNoZWQgdG8gYSBjb21wb25lbnQuXG4gKlxuICogQ2FuIGNvbnRhaW4gKmhvc3Qgdmlld3MqIChjcmVhdGVkIGJ5IGluc3RhbnRpYXRpbmcgYVxuICogY29tcG9uZW50IHdpdGggdGhlIGBjcmVhdGVDb21wb25lbnQoKWAgbWV0aG9kKSwgYW5kICplbWJlZGRlZCB2aWV3cypcbiAqIChjcmVhdGVkIGJ5IGluc3RhbnRpYXRpbmcgYSBgVGVtcGxhdGVSZWZgIHdpdGggdGhlIGBjcmVhdGVFbWJlZGRlZFZpZXcoKWAgbWV0aG9kKS5cbiAqXG4gKiBBIHZpZXcgY29udGFpbmVyIGluc3RhbmNlIGNhbiBjb250YWluIG90aGVyIHZpZXcgY29udGFpbmVycyxcbiAqIGNyZWF0aW5nIGEgW3ZpZXcgaGllcmFyY2h5XShndWlkZS9nbG9zc2FyeSN2aWV3LXRyZWUpLlxuICpcbiAqIEBzZWUgYENvbXBvbmVudFJlZmBcbiAqIEBzZWUgYEVtYmVkZGVkVmlld1JlZmBcbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBWaWV3Q29udGFpbmVyUmVmIHtcbiAgLyoqXG4gICAqIEFuY2hvciBlbGVtZW50IHRoYXQgc3BlY2lmaWVzIHRoZSBsb2NhdGlvbiBvZiB0aGlzIGNvbnRhaW5lciBpbiB0aGUgY29udGFpbmluZyB2aWV3LlxuICAgKiBFYWNoIHZpZXcgY29udGFpbmVyIGNhbiBoYXZlIG9ubHkgb25lIGFuY2hvciBlbGVtZW50LCBhbmQgZWFjaCBhbmNob3IgZWxlbWVudFxuICAgKiBjYW4gaGF2ZSBvbmx5IGEgc2luZ2xlIHZpZXcgY29udGFpbmVyLlxuICAgKlxuICAgKiBSb290IGVsZW1lbnRzIG9mIHZpZXdzIGF0dGFjaGVkIHRvIHRoaXMgY29udGFpbmVyIGJlY29tZSBzaWJsaW5ncyBvZiB0aGUgYW5jaG9yIGVsZW1lbnQgaW5cbiAgICogdGhlIHJlbmRlcmVkIHZpZXcuXG4gICAqXG4gICAqIEFjY2VzcyB0aGUgYFZpZXdDb250YWluZXJSZWZgIG9mIGFuIGVsZW1lbnQgYnkgcGxhY2luZyBhIGBEaXJlY3RpdmVgIGluamVjdGVkXG4gICAqIHdpdGggYFZpZXdDb250YWluZXJSZWZgIG9uIHRoZSBlbGVtZW50LCBvciB1c2UgYSBgVmlld0NoaWxkYCBxdWVyeS5cbiAgICpcbiAgICogPCEtLSBUT0RPOiByZW5hbWUgdG8gYW5jaG9yRWxlbWVudCAtLT5cbiAgICovXG4gIGFic3RyYWN0IGdldCBlbGVtZW50KCk6IEVsZW1lbnRSZWY7XG5cbiAgLyoqXG4gICAqIFRoZSBbZGVwZW5kZW5jeSBpbmplY3Rvcl0oZ3VpZGUvZ2xvc3NhcnkjaW5qZWN0b3IpIGZvciB0aGlzIHZpZXcgY29udGFpbmVyLlxuICAgKi9cbiAgYWJzdHJhY3QgZ2V0IGluamVjdG9yKCk6IEluamVjdG9yO1xuXG4gIC8qKiBAZGVwcmVjYXRlZCBObyByZXBsYWNlbWVudCAqL1xuICBhYnN0cmFjdCBnZXQgcGFyZW50SW5qZWN0b3IoKTogSW5qZWN0b3I7XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIGFsbCB2aWV3cyBpbiB0aGlzIGNvbnRhaW5lci5cbiAgICovXG4gIGFic3RyYWN0IGNsZWFyKCk6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyBhIHZpZXcgZnJvbSB0aGlzIGNvbnRhaW5lci5cbiAgICogQHBhcmFtIGluZGV4IFRoZSAwLWJhc2VkIGluZGV4IG9mIHRoZSB2aWV3IHRvIHJldHJpZXZlLlxuICAgKiBAcmV0dXJucyBUaGUgYFZpZXdSZWZgIGluc3RhbmNlLCBvciBudWxsIGlmIHRoZSBpbmRleCBpcyBvdXQgb2YgcmFuZ2UuXG4gICAqL1xuICBhYnN0cmFjdCBnZXQoaW5kZXg6IG51bWJlcik6IFZpZXdSZWZ8bnVsbDtcblxuICAvKipcbiAgICogUmVwb3J0cyBob3cgbWFueSB2aWV3cyBhcmUgY3VycmVudGx5IGF0dGFjaGVkIHRvIHRoaXMgY29udGFpbmVyLlxuICAgKiBAcmV0dXJucyBUaGUgbnVtYmVyIG9mIHZpZXdzLlxuICAgKi9cbiAgYWJzdHJhY3QgZ2V0IGxlbmd0aCgpOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIEluc3RhbnRpYXRlcyBhbiBlbWJlZGRlZCB2aWV3IGFuZCBpbnNlcnRzIGl0XG4gICAqIGludG8gdGhpcyBjb250YWluZXIuXG4gICAqIEBwYXJhbSB0ZW1wbGF0ZVJlZiBUaGUgSFRNTCB0ZW1wbGF0ZSB0aGF0IGRlZmluZXMgdGhlIHZpZXcuXG4gICAqIEBwYXJhbSBjb250ZXh0IFRoZSBkYXRhLWJpbmRpbmcgY29udGV4dCBvZiB0aGUgZW1iZWRkZWQgdmlldywgYXMgZGVjbGFyZWRcbiAgICogaW4gdGhlIGA8bmctdGVtcGxhdGU+YCB1c2FnZS5cbiAgICogQHBhcmFtIG9wdGlvbnMgRXh0cmEgY29uZmlndXJhdGlvbiBmb3IgdGhlIGNyZWF0ZWQgdmlldy4gSW5jbHVkZXM6XG4gICAqICAqIGluZGV4OiBUaGUgMC1iYXNlZCBpbmRleCBhdCB3aGljaCB0byBpbnNlcnQgdGhlIG5ldyB2aWV3IGludG8gdGhpcyBjb250YWluZXIuXG4gICAqICAgICAgICAgICBJZiBub3Qgc3BlY2lmaWVkLCBhcHBlbmRzIHRoZSBuZXcgdmlldyBhcyB0aGUgbGFzdCBlbnRyeS5cbiAgICogICogaW5qZWN0b3I6IEluamVjdG9yIHRvIGJlIHVzZWQgd2l0aGluIHRoZSBlbWJlZGRlZCB2aWV3LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgYFZpZXdSZWZgIGluc3RhbmNlIGZvciB0aGUgbmV3bHkgY3JlYXRlZCB2aWV3LlxuICAgKi9cbiAgYWJzdHJhY3QgY3JlYXRlRW1iZWRkZWRWaWV3PEM+KHRlbXBsYXRlUmVmOiBUZW1wbGF0ZVJlZjxDPiwgY29udGV4dD86IEMsIG9wdGlvbnM/OiB7XG4gICAgaW5kZXg/OiBudW1iZXIsXG4gICAgaW5qZWN0b3I/OiBJbmplY3RvclxuICB9KTogRW1iZWRkZWRWaWV3UmVmPEM+O1xuXG4gIC8qKlxuICAgKiBJbnN0YW50aWF0ZXMgYW4gZW1iZWRkZWQgdmlldyBhbmQgaW5zZXJ0cyBpdFxuICAgKiBpbnRvIHRoaXMgY29udGFpbmVyLlxuICAgKiBAcGFyYW0gdGVtcGxhdGVSZWYgVGhlIEhUTUwgdGVtcGxhdGUgdGhhdCBkZWZpbmVzIHRoZSB2aWV3LlxuICAgKiBAcGFyYW0gY29udGV4dCBUaGUgZGF0YS1iaW5kaW5nIGNvbnRleHQgb2YgdGhlIGVtYmVkZGVkIHZpZXcsIGFzIGRlY2xhcmVkXG4gICAqIGluIHRoZSBgPG5nLXRlbXBsYXRlPmAgdXNhZ2UuXG4gICAqIEBwYXJhbSBpbmRleCBUaGUgMC1iYXNlZCBpbmRleCBhdCB3aGljaCB0byBpbnNlcnQgdGhlIG5ldyB2aWV3IGludG8gdGhpcyBjb250YWluZXIuXG4gICAqIElmIG5vdCBzcGVjaWZpZWQsIGFwcGVuZHMgdGhlIG5ldyB2aWV3IGFzIHRoZSBsYXN0IGVudHJ5LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgYFZpZXdSZWZgIGluc3RhbmNlIGZvciB0aGUgbmV3bHkgY3JlYXRlZCB2aWV3LlxuICAgKi9cbiAgYWJzdHJhY3QgY3JlYXRlRW1iZWRkZWRWaWV3PEM+KHRlbXBsYXRlUmVmOiBUZW1wbGF0ZVJlZjxDPiwgY29udGV4dD86IEMsIGluZGV4PzogbnVtYmVyKTpcbiAgICAgIEVtYmVkZGVkVmlld1JlZjxDPjtcblxuICAvKipcbiAgICogSW5zdGFudGlhdGVzIGEgc2luZ2xlIGNvbXBvbmVudCBhbmQgaW5zZXJ0cyBpdHMgaG9zdCB2aWV3IGludG8gdGhpcyBjb250YWluZXIuXG4gICAqXG4gICAqIEBwYXJhbSBjb21wb25lbnRUeXBlIENvbXBvbmVudCBUeXBlIHRvIHVzZS5cbiAgICogQHBhcmFtIG9wdGlvbnMgQW4gb2JqZWN0IHRoYXQgY29udGFpbnMgZXh0cmEgcGFyYW1ldGVyczpcbiAgICogICogaW5kZXg6IHRoZSBpbmRleCBhdCB3aGljaCB0byBpbnNlcnQgdGhlIG5ldyBjb21wb25lbnQncyBob3N0IHZpZXcgaW50byB0aGlzIGNvbnRhaW5lci5cbiAgICogICAgICAgICAgIElmIG5vdCBzcGVjaWZpZWQsIGFwcGVuZHMgdGhlIG5ldyB2aWV3IGFzIHRoZSBsYXN0IGVudHJ5LlxuICAgKiAgKiBpbmplY3RvcjogdGhlIGluamVjdG9yIHRvIHVzZSBhcyB0aGUgcGFyZW50IGZvciB0aGUgbmV3IGNvbXBvbmVudC5cbiAgICogICogbmdNb2R1bGVSZWY6IGFuIE5nTW9kdWxlUmVmIG9mIHRoZSBjb21wb25lbnQncyBOZ01vZHVsZSwgeW91IHNob3VsZCBhbG1vc3QgYWx3YXlzIHByb3ZpZGVcbiAgICogICAgICAgICAgICAgICAgIHRoaXMgdG8gZW5zdXJlIHRoYXQgYWxsIGV4cGVjdGVkIHByb3ZpZGVycyBhcmUgYXZhaWxhYmxlIGZvciB0aGUgY29tcG9uZW50XG4gICAqICAgICAgICAgICAgICAgICBpbnN0YW50aWF0aW9uLlxuICAgKiAgKiBwcm9qZWN0YWJsZU5vZGVzOiBsaXN0IG9mIERPTSBub2RlcyB0aGF0IHNob3VsZCBiZSBwcm9qZWN0ZWQgdGhyb3VnaFxuICAgKiAgICAgICAgICAgICAgICAgICAgICBbYDxuZy1jb250ZW50PmBdKGFwaS9jb3JlL25nLWNvbnRlbnQpIG9mIHRoZSBuZXcgY29tcG9uZW50IGluc3RhbmNlLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbmV3IGBDb21wb25lbnRSZWZgIHdoaWNoIGNvbnRhaW5zIHRoZSBjb21wb25lbnQgaW5zdGFuY2UgYW5kIHRoZSBob3N0IHZpZXcuXG4gICAqL1xuICBhYnN0cmFjdCBjcmVhdGVDb21wb25lbnQ8Qz4oY29tcG9uZW50VHlwZTogVHlwZTxDPiwgb3B0aW9ucz86IHtcbiAgICBpbmRleD86IG51bWJlcixcbiAgICBpbmplY3Rvcj86IEluamVjdG9yLFxuICAgIG5nTW9kdWxlUmVmPzogTmdNb2R1bGVSZWY8dW5rbm93bj4sXG4gICAgcHJvamVjdGFibGVOb2Rlcz86IE5vZGVbXVtdLFxuICB9KTogQ29tcG9uZW50UmVmPEM+O1xuXG4gIC8qKlxuICAgKiBJbnN0YW50aWF0ZXMgYSBzaW5nbGUgY29tcG9uZW50IGFuZCBpbnNlcnRzIGl0cyBob3N0IHZpZXcgaW50byB0aGlzIGNvbnRhaW5lci5cbiAgICpcbiAgICogQHBhcmFtIGNvbXBvbmVudEZhY3RvcnkgQ29tcG9uZW50IGZhY3RvcnkgdG8gdXNlLlxuICAgKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IGF0IHdoaWNoIHRvIGluc2VydCB0aGUgbmV3IGNvbXBvbmVudCdzIGhvc3QgdmlldyBpbnRvIHRoaXMgY29udGFpbmVyLlxuICAgKiBJZiBub3Qgc3BlY2lmaWVkLCBhcHBlbmRzIHRoZSBuZXcgdmlldyBhcyB0aGUgbGFzdCBlbnRyeS5cbiAgICogQHBhcmFtIGluamVjdG9yIFRoZSBpbmplY3RvciB0byB1c2UgYXMgdGhlIHBhcmVudCBmb3IgdGhlIG5ldyBjb21wb25lbnQuXG4gICAqIEBwYXJhbSBwcm9qZWN0YWJsZU5vZGVzIExpc3Qgb2YgRE9NIG5vZGVzIHRoYXQgc2hvdWxkIGJlIHByb2plY3RlZCB0aHJvdWdoXG4gICAqICAgICBbYDxuZy1jb250ZW50PmBdKGFwaS9jb3JlL25nLWNvbnRlbnQpIG9mIHRoZSBuZXcgY29tcG9uZW50IGluc3RhbmNlLlxuICAgKiBAcGFyYW0gbmdNb2R1bGVSZWYgQW4gaW5zdGFuY2Ugb2YgdGhlIE5nTW9kdWxlUmVmIHRoYXQgcmVwcmVzZW50IGFuIE5nTW9kdWxlLlxuICAgKiBUaGlzIGluZm9ybWF0aW9uIGlzIHVzZWQgdG8gcmV0cmlldmUgY29ycmVzcG9uZGluZyBOZ01vZHVsZSBpbmplY3Rvci5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIG5ldyBgQ29tcG9uZW50UmVmYCB3aGljaCBjb250YWlucyB0aGUgY29tcG9uZW50IGluc3RhbmNlIGFuZCB0aGUgaG9zdCB2aWV3LlxuICAgKlxuICAgKiBAZGVwcmVjYXRlZCBBbmd1bGFyIG5vIGxvbmdlciByZXF1aXJlcyBjb21wb25lbnQgZmFjdG9yaWVzIHRvIGR5bmFtaWNhbGx5IGNyZWF0ZSBjb21wb25lbnRzLlxuICAgKiAgICAgVXNlIGRpZmZlcmVudCBzaWduYXR1cmUgb2YgdGhlIGBjcmVhdGVDb21wb25lbnRgIG1ldGhvZCwgd2hpY2ggYWxsb3dzIHBhc3NpbmdcbiAgICogICAgIENvbXBvbmVudCBjbGFzcyBkaXJlY3RseS5cbiAgICovXG4gIGFic3RyYWN0IGNyZWF0ZUNvbXBvbmVudDxDPihcbiAgICAgIGNvbXBvbmVudEZhY3Rvcnk6IENvbXBvbmVudEZhY3Rvcnk8Qz4sIGluZGV4PzogbnVtYmVyLCBpbmplY3Rvcj86IEluamVjdG9yLFxuICAgICAgcHJvamVjdGFibGVOb2Rlcz86IGFueVtdW10sIG5nTW9kdWxlUmVmPzogTmdNb2R1bGVSZWY8YW55Pik6IENvbXBvbmVudFJlZjxDPjtcblxuICAvKipcbiAgICogSW5zZXJ0cyBhIHZpZXcgaW50byB0aGlzIGNvbnRhaW5lci5cbiAgICogQHBhcmFtIHZpZXdSZWYgVGhlIHZpZXcgdG8gaW5zZXJ0LlxuICAgKiBAcGFyYW0gaW5kZXggVGhlIDAtYmFzZWQgaW5kZXggYXQgd2hpY2ggdG8gaW5zZXJ0IHRoZSB2aWV3LlxuICAgKiBJZiBub3Qgc3BlY2lmaWVkLCBhcHBlbmRzIHRoZSBuZXcgdmlldyBhcyB0aGUgbGFzdCBlbnRyeS5cbiAgICogQHJldHVybnMgVGhlIGluc2VydGVkIGBWaWV3UmVmYCBpbnN0YW5jZS5cbiAgICpcbiAgICovXG4gIGFic3RyYWN0IGluc2VydCh2aWV3UmVmOiBWaWV3UmVmLCBpbmRleD86IG51bWJlcik6IFZpZXdSZWY7XG5cbiAgLyoqXG4gICAqIE1vdmVzIGEgdmlldyB0byBhIG5ldyBsb2NhdGlvbiBpbiB0aGlzIGNvbnRhaW5lci5cbiAgICogQHBhcmFtIHZpZXdSZWYgVGhlIHZpZXcgdG8gbW92ZS5cbiAgICogQHBhcmFtIGluZGV4IFRoZSAwLWJhc2VkIGluZGV4IG9mIHRoZSBuZXcgbG9jYXRpb24uXG4gICAqIEByZXR1cm5zIFRoZSBtb3ZlZCBgVmlld1JlZmAgaW5zdGFuY2UuXG4gICAqL1xuICBhYnN0cmFjdCBtb3ZlKHZpZXdSZWY6IFZpZXdSZWYsIGN1cnJlbnRJbmRleDogbnVtYmVyKTogVmlld1JlZjtcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgaW5kZXggb2YgYSB2aWV3IHdpdGhpbiB0aGUgY3VycmVudCBjb250YWluZXIuXG4gICAqIEBwYXJhbSB2aWV3UmVmIFRoZSB2aWV3IHRvIHF1ZXJ5LlxuICAgKiBAcmV0dXJucyBUaGUgMC1iYXNlZCBpbmRleCBvZiB0aGUgdmlldydzIHBvc2l0aW9uIGluIHRoaXMgY29udGFpbmVyLFxuICAgKiBvciBgLTFgIGlmIHRoaXMgY29udGFpbmVyIGRvZXNuJ3QgY29udGFpbiB0aGUgdmlldy5cbiAgICovXG4gIGFic3RyYWN0IGluZGV4T2Yodmlld1JlZjogVmlld1JlZik6IG51bWJlcjtcblxuICAvKipcbiAgICogRGVzdHJveXMgYSB2aWV3IGF0dGFjaGVkIHRvIHRoaXMgY29udGFpbmVyXG4gICAqIEBwYXJhbSBpbmRleCBUaGUgMC1iYXNlZCBpbmRleCBvZiB0aGUgdmlldyB0byBkZXN0cm95LlxuICAgKiBJZiBub3Qgc3BlY2lmaWVkLCB0aGUgbGFzdCB2aWV3IGluIHRoZSBjb250YWluZXIgaXMgcmVtb3ZlZC5cbiAgICovXG4gIGFic3RyYWN0IHJlbW92ZShpbmRleD86IG51bWJlcik6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIERldGFjaGVzIGEgdmlldyBmcm9tIHRoaXMgY29udGFpbmVyIHdpdGhvdXQgZGVzdHJveWluZyBpdC5cbiAgICogVXNlIGFsb25nIHdpdGggYGluc2VydCgpYCB0byBtb3ZlIGEgdmlldyB3aXRoaW4gdGhlIGN1cnJlbnQgY29udGFpbmVyLlxuICAgKiBAcGFyYW0gaW5kZXggVGhlIDAtYmFzZWQgaW5kZXggb2YgdGhlIHZpZXcgdG8gZGV0YWNoLlxuICAgKiBJZiBub3Qgc3BlY2lmaWVkLCB0aGUgbGFzdCB2aWV3IGluIHRoZSBjb250YWluZXIgaXMgZGV0YWNoZWQuXG4gICAqL1xuICBhYnN0cmFjdCBkZXRhY2goaW5kZXg/OiBudW1iZXIpOiBWaWV3UmVmfG51bGw7XG5cbiAgLyoqXG4gICAqIEBpbnRlcm5hbFxuICAgKiBAbm9jb2xsYXBzZVxuICAgKi9cbiAgc3RhdGljIF9fTkdfRUxFTUVOVF9JRF9fOiAoKSA9PiBWaWV3Q29udGFpbmVyUmVmID0gaW5qZWN0Vmlld0NvbnRhaW5lclJlZjtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgVmlld0NvbnRhaW5lclJlZiBhbmQgc3RvcmVzIGl0IG9uIHRoZSBpbmplY3Rvci4gT3IsIGlmIHRoZSBWaWV3Q29udGFpbmVyUmVmXG4gKiBhbHJlYWR5IGV4aXN0cywgcmV0cmlldmVzIHRoZSBleGlzdGluZyBWaWV3Q29udGFpbmVyUmVmLlxuICpcbiAqIEByZXR1cm5zIFRoZSBWaWV3Q29udGFpbmVyUmVmIGluc3RhbmNlIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0Vmlld0NvbnRhaW5lclJlZigpOiBWaWV3Q29udGFpbmVyUmVmIHtcbiAgY29uc3QgcHJldmlvdXNUTm9kZSA9IGdldEN1cnJlbnRUTm9kZSgpIGFzIFRFbGVtZW50Tm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSB8IFRDb250YWluZXJOb2RlO1xuICByZXR1cm4gY3JlYXRlQ29udGFpbmVyUmVmKHByZXZpb3VzVE5vZGUsIGdldExWaWV3KCkpO1xufVxuXG5jb25zdCBWRV9WaWV3Q29udGFpbmVyUmVmID0gVmlld0NvbnRhaW5lclJlZjtcblxuLy8gVE9ETyhhbHhodWIpOiBjbGVhbmluZyB1cCB0aGlzIGluZGlyZWN0aW9uIHRyaWdnZXJzIGEgc3VidGxlIGJ1ZyBpbiBDbG9zdXJlIGluIGczLiBPbmNlIHRoZSBmaXhcbi8vIGZvciB0aGF0IGxhbmRzLCB0aGlzIGNhbiBiZSBjbGVhbmVkIHVwLlxuY29uc3QgUjNWaWV3Q29udGFpbmVyUmVmID0gY2xhc3MgVmlld0NvbnRhaW5lclJlZiBleHRlbmRzIFZFX1ZpZXdDb250YWluZXJSZWYge1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgX2xDb250YWluZXI6IExDb250YWluZXIsXG4gICAgICBwcml2YXRlIF9ob3N0VE5vZGU6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxURWxlbWVudENvbnRhaW5lck5vZGUsXG4gICAgICBwcml2YXRlIF9ob3N0TFZpZXc6IExWaWV3KSB7XG4gICAgc3VwZXIoKTtcbiAgfVxuXG4gIG92ZXJyaWRlIGdldCBlbGVtZW50KCk6IEVsZW1lbnRSZWYge1xuICAgIHJldHVybiBjcmVhdGVFbGVtZW50UmVmKHRoaXMuX2hvc3RUTm9kZSwgdGhpcy5faG9zdExWaWV3KTtcbiAgfVxuXG4gIG92ZXJyaWRlIGdldCBpbmplY3RvcigpOiBJbmplY3RvciB7XG4gICAgcmV0dXJuIG5ldyBOb2RlSW5qZWN0b3IodGhpcy5faG9zdFROb2RlLCB0aGlzLl9ob3N0TFZpZXcpO1xuICB9XG5cbiAgLyoqIEBkZXByZWNhdGVkIE5vIHJlcGxhY2VtZW50ICovXG4gIG92ZXJyaWRlIGdldCBwYXJlbnRJbmplY3RvcigpOiBJbmplY3RvciB7XG4gICAgY29uc3QgcGFyZW50TG9jYXRpb24gPSBnZXRQYXJlbnRJbmplY3RvckxvY2F0aW9uKHRoaXMuX2hvc3RUTm9kZSwgdGhpcy5faG9zdExWaWV3KTtcbiAgICBpZiAoaGFzUGFyZW50SW5qZWN0b3IocGFyZW50TG9jYXRpb24pKSB7XG4gICAgICBjb25zdCBwYXJlbnRWaWV3ID0gZ2V0UGFyZW50SW5qZWN0b3JWaWV3KHBhcmVudExvY2F0aW9uLCB0aGlzLl9ob3N0TFZpZXcpO1xuICAgICAgY29uc3QgaW5qZWN0b3JJbmRleCA9IGdldFBhcmVudEluamVjdG9ySW5kZXgocGFyZW50TG9jYXRpb24pO1xuICAgICAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVJbmplY3RvcihwYXJlbnRWaWV3LCBpbmplY3RvckluZGV4KTtcbiAgICAgIGNvbnN0IHBhcmVudFROb2RlID1cbiAgICAgICAgICBwYXJlbnRWaWV3W1RWSUVXXS5kYXRhW2luamVjdG9ySW5kZXggKyBOb2RlSW5qZWN0b3JPZmZzZXQuVE5PREVdIGFzIFRFbGVtZW50Tm9kZTtcbiAgICAgIHJldHVybiBuZXcgTm9kZUluamVjdG9yKHBhcmVudFROb2RlLCBwYXJlbnRWaWV3KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG5ldyBOb2RlSW5qZWN0b3IobnVsbCwgdGhpcy5faG9zdExWaWV3KTtcbiAgICB9XG4gIH1cblxuICBvdmVycmlkZSBjbGVhcigpOiB2b2lkIHtcbiAgICB3aGlsZSAodGhpcy5sZW5ndGggPiAwKSB7XG4gICAgICB0aGlzLnJlbW92ZSh0aGlzLmxlbmd0aCAtIDEpO1xuICAgIH1cbiAgfVxuXG4gIG92ZXJyaWRlIGdldChpbmRleDogbnVtYmVyKTogVmlld1JlZnxudWxsIHtcbiAgICBjb25zdCB2aWV3UmVmcyA9IGdldFZpZXdSZWZzKHRoaXMuX2xDb250YWluZXIpO1xuICAgIHJldHVybiB2aWV3UmVmcyAhPT0gbnVsbCAmJiB2aWV3UmVmc1tpbmRleF0gfHwgbnVsbDtcbiAgfVxuXG4gIG92ZXJyaWRlIGdldCBsZW5ndGgoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fbENvbnRhaW5lci5sZW5ndGggLSBDT05UQUlORVJfSEVBREVSX09GRlNFVDtcbiAgfVxuXG4gIG92ZXJyaWRlIGNyZWF0ZUVtYmVkZGVkVmlldzxDPih0ZW1wbGF0ZVJlZjogVGVtcGxhdGVSZWY8Qz4sIGNvbnRleHQ/OiBDLCBvcHRpb25zPzoge1xuICAgIGluZGV4PzogbnVtYmVyLFxuICAgIGluamVjdG9yPzogSW5qZWN0b3JcbiAgfSk6IEVtYmVkZGVkVmlld1JlZjxDPjtcbiAgb3ZlcnJpZGUgY3JlYXRlRW1iZWRkZWRWaWV3PEM+KHRlbXBsYXRlUmVmOiBUZW1wbGF0ZVJlZjxDPiwgY29udGV4dD86IEMsIGluZGV4PzogbnVtYmVyKTpcbiAgICAgIEVtYmVkZGVkVmlld1JlZjxDPjtcbiAgb3ZlcnJpZGUgY3JlYXRlRW1iZWRkZWRWaWV3PEM+KHRlbXBsYXRlUmVmOiBUZW1wbGF0ZVJlZjxDPiwgY29udGV4dD86IEMsIGluZGV4T3JPcHRpb25zPzogbnVtYmVyfHtcbiAgICBpbmRleD86IG51bWJlcixcbiAgICBpbmplY3Rvcj86IEluamVjdG9yXG4gIH0pOiBFbWJlZGRlZFZpZXdSZWY8Qz4ge1xuICAgIGxldCBpbmRleDogbnVtYmVyfHVuZGVmaW5lZDtcbiAgICBsZXQgaW5qZWN0b3I6IEluamVjdG9yfHVuZGVmaW5lZDtcblxuICAgIGlmICh0eXBlb2YgaW5kZXhPck9wdGlvbnMgPT09ICdudW1iZXInKSB7XG4gICAgICBpbmRleCA9IGluZGV4T3JPcHRpb25zO1xuICAgIH0gZWxzZSBpZiAoaW5kZXhPck9wdGlvbnMgIT0gbnVsbCkge1xuICAgICAgaW5kZXggPSBpbmRleE9yT3B0aW9ucy5pbmRleDtcbiAgICAgIGluamVjdG9yID0gaW5kZXhPck9wdGlvbnMuaW5qZWN0b3I7XG4gICAgfVxuXG4gICAgY29uc3Qgdmlld1JlZiA9IHRlbXBsYXRlUmVmLmNyZWF0ZUVtYmVkZGVkVmlldyhjb250ZXh0IHx8IDxhbnk+e30sIGluamVjdG9yKTtcbiAgICB0aGlzLmluc2VydCh2aWV3UmVmLCBpbmRleCk7XG4gICAgcmV0dXJuIHZpZXdSZWY7XG4gIH1cblxuICBvdmVycmlkZSBjcmVhdGVDb21wb25lbnQ8Qz4oY29tcG9uZW50VHlwZTogVHlwZTxDPiwgb3B0aW9ucz86IHtcbiAgICBpbmRleD86IG51bWJlcixcbiAgICBpbmplY3Rvcj86IEluamVjdG9yLFxuICAgIHByb2plY3RhYmxlTm9kZXM/OiBOb2RlW11bXSxcbiAgICBuZ01vZHVsZVJlZj86IE5nTW9kdWxlUmVmPHVua25vd24+LFxuICB9KTogQ29tcG9uZW50UmVmPEM+O1xuICAvKipcbiAgICogQGRlcHJlY2F0ZWQgQW5ndWxhciBubyBsb25nZXIgcmVxdWlyZXMgY29tcG9uZW50IGZhY3RvcmllcyB0byBkeW5hbWljYWxseSBjcmVhdGUgY29tcG9uZW50cy5cbiAgICogICAgIFVzZSBkaWZmZXJlbnQgc2lnbmF0dXJlIG9mIHRoZSBgY3JlYXRlQ29tcG9uZW50YCBtZXRob2QsIHdoaWNoIGFsbG93cyBwYXNzaW5nXG4gICAqICAgICBDb21wb25lbnQgY2xhc3MgZGlyZWN0bHkuXG4gICAqL1xuICBvdmVycmlkZSBjcmVhdGVDb21wb25lbnQ8Qz4oXG4gICAgICBjb21wb25lbnRGYWN0b3J5OiBDb21wb25lbnRGYWN0b3J5PEM+LCBpbmRleD86IG51bWJlcnx1bmRlZmluZWQsXG4gICAgICBpbmplY3Rvcj86IEluamVjdG9yfHVuZGVmaW5lZCwgcHJvamVjdGFibGVOb2Rlcz86IGFueVtdW118dW5kZWZpbmVkLFxuICAgICAgbmdNb2R1bGVSZWY/OiBOZ01vZHVsZVJlZjxhbnk+fHVuZGVmaW5lZCk6IENvbXBvbmVudFJlZjxDPjtcbiAgb3ZlcnJpZGUgY3JlYXRlQ29tcG9uZW50PEM+KFxuICAgICAgY29tcG9uZW50RmFjdG9yeU9yVHlwZTogQ29tcG9uZW50RmFjdG9yeTxDPnxUeXBlPEM+LCBpbmRleE9yT3B0aW9ucz86IG51bWJlcnx1bmRlZmluZWR8e1xuICAgICAgICBpbmRleD86IG51bWJlcixcbiAgICAgICAgaW5qZWN0b3I/OiBJbmplY3RvcixcbiAgICAgICAgbmdNb2R1bGVSZWY/OiBOZ01vZHVsZVJlZjx1bmtub3duPixcbiAgICAgICAgcHJvamVjdGFibGVOb2Rlcz86IE5vZGVbXVtdLFxuICAgICAgfSxcbiAgICAgIGluamVjdG9yPzogSW5qZWN0b3J8dW5kZWZpbmVkLCBwcm9qZWN0YWJsZU5vZGVzPzogYW55W11bXXx1bmRlZmluZWQsXG4gICAgICBuZ01vZHVsZVJlZj86IE5nTW9kdWxlUmVmPGFueT58dW5kZWZpbmVkKTogQ29tcG9uZW50UmVmPEM+IHtcbiAgICBjb25zdCBpc0NvbXBvbmVudEZhY3RvcnkgPSBjb21wb25lbnRGYWN0b3J5T3JUeXBlICYmICFpc1R5cGUoY29tcG9uZW50RmFjdG9yeU9yVHlwZSk7XG4gICAgbGV0IGluZGV4OiBudW1iZXJ8dW5kZWZpbmVkO1xuXG4gICAgLy8gVGhpcyBmdW5jdGlvbiBzdXBwb3J0cyAyIHNpZ25hdHVyZXMgYW5kIHdlIG5lZWQgdG8gaGFuZGxlIG9wdGlvbnMgY29ycmVjdGx5IGZvciBib3RoOlxuICAgIC8vICAgMS4gV2hlbiBmaXJzdCBhcmd1bWVudCBpcyBhIENvbXBvbmVudCB0eXBlLiBUaGlzIHNpZ25hdHVyZSBhbHNvIHJlcXVpcmVzIGV4dHJhXG4gICAgLy8gICAgICBvcHRpb25zIHRvIGJlIHByb3ZpZGVkIGFzIGFzIG9iamVjdCAobW9yZSBlcmdvbm9taWMgb3B0aW9uKS5cbiAgICAvLyAgIDIuIEZpcnN0IGFyZ3VtZW50IGlzIGEgQ29tcG9uZW50IGZhY3RvcnkuIEluIHRoaXMgY2FzZSBleHRyYSBvcHRpb25zIGFyZSByZXByZXNlbnRlZCBhc1xuICAgIC8vICAgICAgcG9zaXRpb25hbCBhcmd1bWVudHMuIFRoaXMgc2lnbmF0dXJlIGlzIGxlc3MgZXJnb25vbWljIGFuZCB3aWxsIGJlIGRlcHJlY2F0ZWQuXG4gICAgaWYgKGlzQ29tcG9uZW50RmFjdG9yeSkge1xuICAgICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgICBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgIHR5cGVvZiBpbmRleE9yT3B0aW9ucyAhPT0gJ29iamVjdCcsIHRydWUsXG4gICAgICAgICAgICAnSXQgbG9va3MgbGlrZSBDb21wb25lbnQgZmFjdG9yeSB3YXMgcHJvdmlkZWQgYXMgdGhlIGZpcnN0IGFyZ3VtZW50ICcgK1xuICAgICAgICAgICAgICAgICdhbmQgYW4gb3B0aW9ucyBvYmplY3QgYXMgdGhlIHNlY29uZCBhcmd1bWVudC4gVGhpcyBjb21iaW5hdGlvbiBvZiBhcmd1bWVudHMgJyArXG4gICAgICAgICAgICAgICAgJ2lzIGluY29tcGF0aWJsZS4gWW91IGNhbiBlaXRoZXIgY2hhbmdlIHRoZSBmaXJzdCBhcmd1bWVudCB0byBwcm92aWRlIENvbXBvbmVudCAnICtcbiAgICAgICAgICAgICAgICAndHlwZSBvciBjaGFuZ2UgdGhlIHNlY29uZCBhcmd1bWVudCB0byBiZSBhIG51bWJlciAocmVwcmVzZW50aW5nIGFuIGluZGV4IGF0ICcgK1xuICAgICAgICAgICAgICAgICd3aGljaCB0byBpbnNlcnQgdGhlIG5ldyBjb21wb25lbnRcXCdzIGhvc3QgdmlldyBpbnRvIHRoaXMgY29udGFpbmVyKScpO1xuICAgICAgfVxuICAgICAgaW5kZXggPSBpbmRleE9yT3B0aW9ucyBhcyBudW1iZXIgfCB1bmRlZmluZWQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgICAgYXNzZXJ0RGVmaW5lZChcbiAgICAgICAgICAgIGdldENvbXBvbmVudERlZihjb21wb25lbnRGYWN0b3J5T3JUeXBlKSxcbiAgICAgICAgICAgIGBQcm92aWRlZCBDb21wb25lbnQgY2xhc3MgZG9lc24ndCBjb250YWluIENvbXBvbmVudCBkZWZpbml0aW9uLiBgICtcbiAgICAgICAgICAgICAgICBgUGxlYXNlIGNoZWNrIHdoZXRoZXIgcHJvdmlkZWQgY2xhc3MgaGFzIEBDb21wb25lbnQgZGVjb3JhdG9yLmApO1xuICAgICAgICBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgIHR5cGVvZiBpbmRleE9yT3B0aW9ucyAhPT0gJ251bWJlcicsIHRydWUsXG4gICAgICAgICAgICAnSXQgbG9va3MgbGlrZSBDb21wb25lbnQgdHlwZSB3YXMgcHJvdmlkZWQgYXMgdGhlIGZpcnN0IGFyZ3VtZW50ICcgK1xuICAgICAgICAgICAgICAgICdhbmQgYSBudW1iZXIgKHJlcHJlc2VudGluZyBhbiBpbmRleCBhdCB3aGljaCB0byBpbnNlcnQgdGhlIG5ldyBjb21wb25lbnRcXCdzICcgK1xuICAgICAgICAgICAgICAgICdob3N0IHZpZXcgaW50byB0aGlzIGNvbnRhaW5lciBhcyB0aGUgc2Vjb25kIGFyZ3VtZW50LiBUaGlzIGNvbWJpbmF0aW9uIG9mIGFyZ3VtZW50cyAnICtcbiAgICAgICAgICAgICAgICAnaXMgaW5jb21wYXRpYmxlLiBQbGVhc2UgdXNlIGFuIG9iamVjdCBhcyB0aGUgc2Vjb25kIGFyZ3VtZW50IGluc3RlYWQuJyk7XG4gICAgICB9XG4gICAgICBjb25zdCBvcHRpb25zID0gKGluZGV4T3JPcHRpb25zIHx8IHt9KSBhcyB7XG4gICAgICAgIGluZGV4PzogbnVtYmVyLFxuICAgICAgICBpbmplY3Rvcj86IEluamVjdG9yLFxuICAgICAgICBuZ01vZHVsZVJlZj86IE5nTW9kdWxlUmVmPHVua25vd24+LFxuICAgICAgICBwcm9qZWN0YWJsZU5vZGVzPzogTm9kZVtdW10sXG4gICAgICB9O1xuICAgICAgaW5kZXggPSBvcHRpb25zLmluZGV4O1xuICAgICAgaW5qZWN0b3IgPSBvcHRpb25zLmluamVjdG9yO1xuICAgICAgcHJvamVjdGFibGVOb2RlcyA9IG9wdGlvbnMucHJvamVjdGFibGVOb2RlcztcbiAgICAgIG5nTW9kdWxlUmVmID0gb3B0aW9ucy5uZ01vZHVsZVJlZjtcbiAgICB9XG5cbiAgICBjb25zdCBjb21wb25lbnRGYWN0b3J5OiBDb21wb25lbnRGYWN0b3J5PEM+ID0gaXNDb21wb25lbnRGYWN0b3J5ID9cbiAgICAgICAgY29tcG9uZW50RmFjdG9yeU9yVHlwZSBhcyBDb21wb25lbnRGYWN0b3J5PEM+OlxuICAgICAgICBuZXcgUjNDb21wb25lbnRGYWN0b3J5KGdldENvbXBvbmVudERlZihjb21wb25lbnRGYWN0b3J5T3JUeXBlKSEpO1xuICAgIGNvbnN0IGNvbnRleHRJbmplY3RvciA9IGluamVjdG9yIHx8IHRoaXMucGFyZW50SW5qZWN0b3I7XG4gICAgaWYgKCFuZ01vZHVsZVJlZiAmJiAoY29tcG9uZW50RmFjdG9yeSBhcyBhbnkpLm5nTW9kdWxlID09IG51bGwgJiYgY29udGV4dEluamVjdG9yKSB7XG4gICAgICAvLyBETyBOT1QgUkVGQUNUT1IuIFRoZSBjb2RlIGhlcmUgdXNlZCB0byBoYXZlIGEgYHZhbHVlIHx8IHVuZGVmaW5lZGAgZXhwcmVzc2lvblxuICAgICAgLy8gd2hpY2ggc2VlbXMgdG8gY2F1c2UgaW50ZXJuYWwgZ29vZ2xlIGFwcHMgdG8gZmFpbC4gVGhpcyBpcyBkb2N1bWVudGVkIGluIHRoZVxuICAgICAgLy8gZm9sbG93aW5nIGludGVybmFsIGJ1ZyBpc3N1ZTogZ28vYi8xNDI5Njc4MDJcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGNvbnRleHRJbmplY3Rvci5nZXQoTmdNb2R1bGVSZWYsIG51bGwpO1xuICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICBuZ01vZHVsZVJlZiA9IHJlc3VsdDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBjb21wb25lbnRSZWYgPVxuICAgICAgICBjb21wb25lbnRGYWN0b3J5LmNyZWF0ZShjb250ZXh0SW5qZWN0b3IsIHByb2plY3RhYmxlTm9kZXMsIHVuZGVmaW5lZCwgbmdNb2R1bGVSZWYpO1xuICAgIHRoaXMuaW5zZXJ0KGNvbXBvbmVudFJlZi5ob3N0VmlldywgaW5kZXgpO1xuICAgIHJldHVybiBjb21wb25lbnRSZWY7XG4gIH1cblxuICBvdmVycmlkZSBpbnNlcnQodmlld1JlZjogVmlld1JlZiwgaW5kZXg/OiBudW1iZXIpOiBWaWV3UmVmIHtcbiAgICBjb25zdCBsVmlldyA9ICh2aWV3UmVmIGFzIFIzVmlld1JlZjxhbnk+KS5fbFZpZXchO1xuICAgIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuXG4gICAgaWYgKG5nRGV2TW9kZSAmJiB2aWV3UmVmLmRlc3Ryb3llZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgaW5zZXJ0IGEgZGVzdHJveWVkIFZpZXcgaW4gYSBWaWV3Q29udGFpbmVyIScpO1xuICAgIH1cblxuICAgIGlmICh2aWV3QXR0YWNoZWRUb0NvbnRhaW5lcihsVmlldykpIHtcbiAgICAgIC8vIElmIHZpZXcgaXMgYWxyZWFkeSBhdHRhY2hlZCwgZGV0YWNoIGl0IGZpcnN0IHNvIHdlIGNsZWFuIHVwIHJlZmVyZW5jZXMgYXBwcm9wcmlhdGVseS5cblxuICAgICAgY29uc3QgcHJldklkeCA9IHRoaXMuaW5kZXhPZih2aWV3UmVmKTtcblxuICAgICAgLy8gQSB2aWV3IG1pZ2h0IGJlIGF0dGFjaGVkIGVpdGhlciB0byB0aGlzIG9yIGEgZGlmZmVyZW50IGNvbnRhaW5lci4gVGhlIGBwcmV2SWR4YCBmb3JcbiAgICAgIC8vIHRob3NlIGNhc2VzIHdpbGwgYmU6XG4gICAgICAvLyBlcXVhbCB0byAtMSBmb3Igdmlld3MgYXR0YWNoZWQgdG8gdGhpcyBWaWV3Q29udGFpbmVyUmVmXG4gICAgICAvLyA+PSAwIGZvciB2aWV3cyBhdHRhY2hlZCB0byBhIGRpZmZlcmVudCBWaWV3Q29udGFpbmVyUmVmXG4gICAgICBpZiAocHJldklkeCAhPT0gLTEpIHtcbiAgICAgICAgdGhpcy5kZXRhY2gocHJldklkeCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBwcmV2TENvbnRhaW5lciA9IGxWaWV3W1BBUkVOVF0gYXMgTENvbnRhaW5lcjtcbiAgICAgICAgbmdEZXZNb2RlICYmXG4gICAgICAgICAgICBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICBpc0xDb250YWluZXIocHJldkxDb250YWluZXIpLCB0cnVlLFxuICAgICAgICAgICAgICAgICdBbiBhdHRhY2hlZCB2aWV3IHNob3VsZCBoYXZlIGl0cyBQQVJFTlQgcG9pbnQgdG8gYSBjb250YWluZXIuJyk7XG5cblxuICAgICAgICAvLyBXZSBuZWVkIHRvIHJlLWNyZWF0ZSBhIFIzVmlld0NvbnRhaW5lclJlZiBpbnN0YW5jZSBzaW5jZSB0aG9zZSBhcmUgbm90IHN0b3JlZCBvblxuICAgICAgICAvLyBMVmlldyAobm9yIGFueXdoZXJlIGVsc2UpLlxuICAgICAgICBjb25zdCBwcmV2VkNSZWYgPSBuZXcgUjNWaWV3Q29udGFpbmVyUmVmKFxuICAgICAgICAgICAgcHJldkxDb250YWluZXIsIHByZXZMQ29udGFpbmVyW1RfSE9TVF0gYXMgVERpcmVjdGl2ZUhvc3ROb2RlLCBwcmV2TENvbnRhaW5lcltQQVJFTlRdKTtcblxuICAgICAgICBwcmV2VkNSZWYuZGV0YWNoKHByZXZWQ1JlZi5pbmRleE9mKHZpZXdSZWYpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBMb2dpY2FsIG9wZXJhdGlvbiBvZiBhZGRpbmcgYExWaWV3YCB0byBgTENvbnRhaW5lcmBcbiAgICBjb25zdCBhZGp1c3RlZElkeCA9IHRoaXMuX2FkanVzdEluZGV4KGluZGV4KTtcbiAgICBjb25zdCBsQ29udGFpbmVyID0gdGhpcy5fbENvbnRhaW5lcjtcbiAgICBpbnNlcnRWaWV3KHRWaWV3LCBsVmlldywgbENvbnRhaW5lciwgYWRqdXN0ZWRJZHgpO1xuXG4gICAgLy8gUGh5c2ljYWwgb3BlcmF0aW9uIG9mIGFkZGluZyB0aGUgRE9NIG5vZGVzLlxuICAgIGNvbnN0IGJlZm9yZU5vZGUgPSBnZXRCZWZvcmVOb2RlRm9yVmlldyhhZGp1c3RlZElkeCwgbENvbnRhaW5lcik7XG4gICAgY29uc3QgcmVuZGVyZXIgPSBsVmlld1tSRU5ERVJFUl07XG4gICAgY29uc3QgcGFyZW50Uk5vZGUgPSBuYXRpdmVQYXJlbnROb2RlKHJlbmRlcmVyLCBsQ29udGFpbmVyW05BVElWRV0gYXMgUkVsZW1lbnQgfCBSQ29tbWVudCk7XG4gICAgaWYgKHBhcmVudFJOb2RlICE9PSBudWxsKSB7XG4gICAgICBhZGRWaWV3VG9Db250YWluZXIodFZpZXcsIGxDb250YWluZXJbVF9IT1NUXSwgcmVuZGVyZXIsIGxWaWV3LCBwYXJlbnRSTm9kZSwgYmVmb3JlTm9kZSk7XG4gICAgfVxuXG4gICAgKHZpZXdSZWYgYXMgUjNWaWV3UmVmPGFueT4pLmF0dGFjaFRvVmlld0NvbnRhaW5lclJlZigpO1xuICAgIGFkZFRvQXJyYXkoZ2V0T3JDcmVhdGVWaWV3UmVmcyhsQ29udGFpbmVyKSwgYWRqdXN0ZWRJZHgsIHZpZXdSZWYpO1xuXG4gICAgcmV0dXJuIHZpZXdSZWY7XG4gIH1cblxuICBvdmVycmlkZSBtb3ZlKHZpZXdSZWY6IFZpZXdSZWYsIG5ld0luZGV4OiBudW1iZXIpOiBWaWV3UmVmIHtcbiAgICBpZiAobmdEZXZNb2RlICYmIHZpZXdSZWYuZGVzdHJveWVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBtb3ZlIGEgZGVzdHJveWVkIFZpZXcgaW4gYSBWaWV3Q29udGFpbmVyIScpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5pbnNlcnQodmlld1JlZiwgbmV3SW5kZXgpO1xuICB9XG5cbiAgb3ZlcnJpZGUgaW5kZXhPZih2aWV3UmVmOiBWaWV3UmVmKTogbnVtYmVyIHtcbiAgICBjb25zdCB2aWV3UmVmc0FyciA9IGdldFZpZXdSZWZzKHRoaXMuX2xDb250YWluZXIpO1xuICAgIHJldHVybiB2aWV3UmVmc0FyciAhPT0gbnVsbCA/IHZpZXdSZWZzQXJyLmluZGV4T2Yodmlld1JlZikgOiAtMTtcbiAgfVxuXG4gIG92ZXJyaWRlIHJlbW92ZShpbmRleD86IG51bWJlcik6IHZvaWQge1xuICAgIGNvbnN0IGFkanVzdGVkSWR4ID0gdGhpcy5fYWRqdXN0SW5kZXgoaW5kZXgsIC0xKTtcbiAgICBjb25zdCBkZXRhY2hlZFZpZXcgPSBkZXRhY2hWaWV3KHRoaXMuX2xDb250YWluZXIsIGFkanVzdGVkSWR4KTtcblxuICAgIGlmIChkZXRhY2hlZFZpZXcpIHtcbiAgICAgIC8vIEJlZm9yZSBkZXN0cm95aW5nIHRoZSB2aWV3LCByZW1vdmUgaXQgZnJvbSB0aGUgY29udGFpbmVyJ3MgYXJyYXkgb2YgYFZpZXdSZWZgcy5cbiAgICAgIC8vIFRoaXMgZW5zdXJlcyB0aGUgdmlldyBjb250YWluZXIgbGVuZ3RoIGlzIHVwZGF0ZWQgYmVmb3JlIGNhbGxpbmdcbiAgICAgIC8vIGBkZXN0cm95TFZpZXdgLCB3aGljaCBjb3VsZCByZWN1cnNpdmVseSBjYWxsIHZpZXcgY29udGFpbmVyIG1ldGhvZHMgdGhhdFxuICAgICAgLy8gcmVseSBvbiBhbiBhY2N1cmF0ZSBjb250YWluZXIgbGVuZ3RoLlxuICAgICAgLy8gKGUuZy4gYSBtZXRob2Qgb24gdGhpcyB2aWV3IGNvbnRhaW5lciBiZWluZyBjYWxsZWQgYnkgYSBjaGlsZCBkaXJlY3RpdmUncyBPbkRlc3Ryb3lcbiAgICAgIC8vIGxpZmVjeWNsZSBob29rKVxuICAgICAgcmVtb3ZlRnJvbUFycmF5KGdldE9yQ3JlYXRlVmlld1JlZnModGhpcy5fbENvbnRhaW5lciksIGFkanVzdGVkSWR4KTtcbiAgICAgIGRlc3Ryb3lMVmlldyhkZXRhY2hlZFZpZXdbVFZJRVddLCBkZXRhY2hlZFZpZXcpO1xuICAgIH1cbiAgfVxuXG4gIG92ZXJyaWRlIGRldGFjaChpbmRleD86IG51bWJlcik6IFZpZXdSZWZ8bnVsbCB7XG4gICAgY29uc3QgYWRqdXN0ZWRJZHggPSB0aGlzLl9hZGp1c3RJbmRleChpbmRleCwgLTEpO1xuICAgIGNvbnN0IHZpZXcgPSBkZXRhY2hWaWV3KHRoaXMuX2xDb250YWluZXIsIGFkanVzdGVkSWR4KTtcblxuICAgIGNvbnN0IHdhc0RldGFjaGVkID1cbiAgICAgICAgdmlldyAmJiByZW1vdmVGcm9tQXJyYXkoZ2V0T3JDcmVhdGVWaWV3UmVmcyh0aGlzLl9sQ29udGFpbmVyKSwgYWRqdXN0ZWRJZHgpICE9IG51bGw7XG4gICAgcmV0dXJuIHdhc0RldGFjaGVkID8gbmV3IFIzVmlld1JlZih2aWV3ISkgOiBudWxsO1xuICB9XG5cbiAgcHJpdmF0ZSBfYWRqdXN0SW5kZXgoaW5kZXg/OiBudW1iZXIsIHNoaWZ0OiBudW1iZXIgPSAwKSB7XG4gICAgaWYgKGluZGV4ID09IG51bGwpIHtcbiAgICAgIHJldHVybiB0aGlzLmxlbmd0aCArIHNoaWZ0O1xuICAgIH1cbiAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICBhc3NlcnRHcmVhdGVyVGhhbihpbmRleCwgLTEsIGBWaWV3UmVmIGluZGV4IG11c3QgYmUgcG9zaXRpdmUsIGdvdCAke2luZGV4fWApO1xuICAgICAgLy8gKzEgYmVjYXVzZSBpdCdzIGxlZ2FsIHRvIGluc2VydCBhdCB0aGUgZW5kLlxuICAgICAgYXNzZXJ0TGVzc1RoYW4oaW5kZXgsIHRoaXMubGVuZ3RoICsgMSArIHNoaWZ0LCAnaW5kZXgnKTtcbiAgICB9XG4gICAgcmV0dXJuIGluZGV4O1xuICB9XG59O1xuXG5mdW5jdGlvbiBnZXRWaWV3UmVmcyhsQ29udGFpbmVyOiBMQ29udGFpbmVyKTogVmlld1JlZltdfG51bGwge1xuICByZXR1cm4gbENvbnRhaW5lcltWSUVXX1JFRlNdIGFzIFZpZXdSZWZbXTtcbn1cblxuZnVuY3Rpb24gZ2V0T3JDcmVhdGVWaWV3UmVmcyhsQ29udGFpbmVyOiBMQ29udGFpbmVyKTogVmlld1JlZltdIHtcbiAgcmV0dXJuIChsQ29udGFpbmVyW1ZJRVdfUkVGU10gfHwgKGxDb250YWluZXJbVklFV19SRUZTXSA9IFtdKSkgYXMgVmlld1JlZltdO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBWaWV3Q29udGFpbmVyUmVmIGFuZCBzdG9yZXMgaXQgb24gdGhlIGluamVjdG9yLlxuICpcbiAqIEBwYXJhbSBWaWV3Q29udGFpbmVyUmVmVG9rZW4gVGhlIFZpZXdDb250YWluZXJSZWYgdHlwZVxuICogQHBhcmFtIEVsZW1lbnRSZWZUb2tlbiBUaGUgRWxlbWVudFJlZiB0eXBlXG4gKiBAcGFyYW0gaG9zdFROb2RlIFRoZSBub2RlIHRoYXQgaXMgcmVxdWVzdGluZyBhIFZpZXdDb250YWluZXJSZWZcbiAqIEBwYXJhbSBob3N0TFZpZXcgVGhlIHZpZXcgdG8gd2hpY2ggdGhlIG5vZGUgYmVsb25nc1xuICogQHJldHVybnMgVGhlIFZpZXdDb250YWluZXJSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVDb250YWluZXJSZWYoXG4gICAgaG9zdFROb2RlOiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlLFxuICAgIGhvc3RMVmlldzogTFZpZXcpOiBWaWV3Q29udGFpbmVyUmVmIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydFROb2RlVHlwZShob3N0VE5vZGUsIFROb2RlVHlwZS5BbnlDb250YWluZXIgfCBUTm9kZVR5cGUuQW55Uk5vZGUpO1xuXG4gIGxldCBsQ29udGFpbmVyOiBMQ29udGFpbmVyO1xuICBjb25zdCBzbG90VmFsdWUgPSBob3N0TFZpZXdbaG9zdFROb2RlLmluZGV4XTtcbiAgaWYgKGlzTENvbnRhaW5lcihzbG90VmFsdWUpKSB7XG4gICAgLy8gSWYgdGhlIGhvc3QgaXMgYSBjb250YWluZXIsIHdlIGRvbid0IG5lZWQgdG8gY3JlYXRlIGEgbmV3IExDb250YWluZXJcbiAgICBsQ29udGFpbmVyID0gc2xvdFZhbHVlO1xuICB9IGVsc2Uge1xuICAgIGxldCBjb21tZW50Tm9kZTogUkNvbW1lbnQ7XG4gICAgLy8gSWYgdGhlIGhvc3QgaXMgYW4gZWxlbWVudCBjb250YWluZXIsIHRoZSBuYXRpdmUgaG9zdCBlbGVtZW50IGlzIGd1YXJhbnRlZWQgdG8gYmUgYVxuICAgIC8vIGNvbW1lbnQgYW5kIHdlIGNhbiByZXVzZSB0aGF0IGNvbW1lbnQgYXMgYW5jaG9yIGVsZW1lbnQgZm9yIHRoZSBuZXcgTENvbnRhaW5lci5cbiAgICAvLyBUaGUgY29tbWVudCBub2RlIGluIHF1ZXN0aW9uIGlzIGFscmVhZHkgcGFydCBvZiB0aGUgRE9NIHN0cnVjdHVyZSBzbyB3ZSBkb24ndCBuZWVkIHRvIGFwcGVuZFxuICAgIC8vIGl0IGFnYWluLlxuICAgIGlmIChob3N0VE5vZGUudHlwZSAmIFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKSB7XG4gICAgICBjb21tZW50Tm9kZSA9IHVud3JhcFJOb2RlKHNsb3RWYWx1ZSkgYXMgUkNvbW1lbnQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIElmIHRoZSBob3N0IGlzIGEgcmVndWxhciBlbGVtZW50LCB3ZSBoYXZlIHRvIGluc2VydCBhIGNvbW1lbnQgbm9kZSBtYW51YWxseSB3aGljaCB3aWxsXG4gICAgICAvLyBiZSB1c2VkIGFzIGFuIGFuY2hvciB3aGVuIGluc2VydGluZyBlbGVtZW50cy4gSW4gdGhpcyBzcGVjaWZpYyBjYXNlIHdlIHVzZSBsb3ctbGV2ZWwgRE9NXG4gICAgICAvLyBtYW5pcHVsYXRpb24gdG8gaW5zZXJ0IGl0LlxuICAgICAgY29uc3QgcmVuZGVyZXIgPSBob3N0TFZpZXdbUkVOREVSRVJdO1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckNyZWF0ZUNvbW1lbnQrKztcbiAgICAgIGNvbW1lbnROb2RlID0gcmVuZGVyZXIuY3JlYXRlQ29tbWVudChuZ0Rldk1vZGUgPyAnY29udGFpbmVyJyA6ICcnKTtcblxuICAgICAgY29uc3QgaG9zdE5hdGl2ZSA9IGdldE5hdGl2ZUJ5VE5vZGUoaG9zdFROb2RlLCBob3N0TFZpZXcpITtcbiAgICAgIGNvbnN0IHBhcmVudE9mSG9zdE5hdGl2ZSA9IG5hdGl2ZVBhcmVudE5vZGUocmVuZGVyZXIsIGhvc3ROYXRpdmUpO1xuICAgICAgbmF0aXZlSW5zZXJ0QmVmb3JlKFxuICAgICAgICAgIHJlbmRlcmVyLCBwYXJlbnRPZkhvc3ROYXRpdmUhLCBjb21tZW50Tm9kZSwgbmF0aXZlTmV4dFNpYmxpbmcocmVuZGVyZXIsIGhvc3ROYXRpdmUpLFxuICAgICAgICAgIGZhbHNlKTtcbiAgICB9XG5cbiAgICBob3N0TFZpZXdbaG9zdFROb2RlLmluZGV4XSA9IGxDb250YWluZXIgPVxuICAgICAgICBjcmVhdGVMQ29udGFpbmVyKHNsb3RWYWx1ZSwgaG9zdExWaWV3LCBjb21tZW50Tm9kZSwgaG9zdFROb2RlKTtcblxuICAgIGFkZFRvVmlld1RyZWUoaG9zdExWaWV3LCBsQ29udGFpbmVyKTtcbiAgfVxuXG4gIHJldHVybiBuZXcgUjNWaWV3Q29udGFpbmVyUmVmKGxDb250YWluZXIsIGhvc3RUTm9kZSwgaG9zdExWaWV3KTtcbn1cbiJdfQ==