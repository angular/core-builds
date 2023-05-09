/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { EnvironmentInjector } from '../di/r3_injector';
import { validateMatchingNode } from '../hydration/error_handling';
import { CONTAINERS } from '../hydration/interfaces';
import { hasInSkipHydrationBlockFlag, isInSkipHydrationBlock } from '../hydration/skip_hydration';
import { getSegmentHead, isDisconnectedNode, markRNodeAsClaimedByHydration } from '../hydration/utils';
import { findMatchingDehydratedView, locateDehydratedViewsInContainer } from '../hydration/views';
import { isType } from '../interface/type';
import { assertNodeInjector } from '../render3/assert';
import { ComponentFactory as R3ComponentFactory } from '../render3/component_ref';
import { getComponentDef } from '../render3/definition';
import { getParentInjectorLocation, NodeInjector } from '../render3/di';
import { addToViewTree, createLContainer } from '../render3/instructions/shared';
import { CONTAINER_HEADER_OFFSET, DEHYDRATED_VIEWS, NATIVE, VIEW_REFS } from '../render3/interfaces/container';
import { isLContainer } from '../render3/interfaces/type_checks';
import { HEADER_OFFSET, HYDRATION, PARENT, RENDERER, T_HOST, TVIEW } from '../render3/interfaces/view';
import { assertTNodeType } from '../render3/node_assert';
import { addViewToContainer, destroyLView, detachView, getBeforeNodeForView, insertView, nativeInsertBefore, nativeNextSibling, nativeParentNode } from '../render3/node_manipulation';
import { getCurrentTNode, getLView } from '../render3/state';
import { getParentInjectorIndex, getParentInjectorView, hasParentInjector } from '../render3/util/injector_utils';
import { getNativeByTNode, unwrapRNode, viewAttachedToContainer } from '../render3/util/view_utils';
import { ViewRef as R3ViewRef } from '../render3/view_ref';
import { addToArray, removeFromArray } from '../util/array_utils';
import { assertDefined, assertEqual, assertGreaterThan, assertLessThan, throwError } from '../util/assert';
import { createElementRef } from './element_ref';
/**
 * Represents a container where one or more views can be attached to a component.
 *
 * Can contain *host views* (created by instantiating a
 * component with the `createComponent()` method), and *embedded views*
 * (created by instantiating a `TemplateRef` with the `createEmbeddedView()` method).
 *
 * A view container instance can contain other view containers,
 * creating a [view hierarchy](guide/glossary#view-hierarchy).
 *
 * @see `ComponentRef`
 * @see `EmbeddedViewRef`
 *
 * @publicApi
 */
class ViewContainerRef {
    /**
     * @internal
     * @nocollapse
     */
    static { this.__NG_ELEMENT_ID__ = injectViewContainerRef; }
}
export { ViewContainerRef };
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
            const parentTNode = parentView[TVIEW].data[injectorIndex + 8 /* NodeInjectorOffset.TNODE */];
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
        const hydrationInfo = findMatchingDehydratedView(this._lContainer, templateRef.ssrId);
        const viewRef = templateRef.createEmbeddedViewImpl(context || {}, injector, hydrationInfo);
        // If there is a matching dehydrated view, but the host TNode is located in the skip
        // hydration block, this means that the content was detached (as a part of the skip
        // hydration logic) and it needs to be appended into the DOM.
        const skipDomInsertion = !!hydrationInfo && !hasInSkipHydrationBlockFlag(this._hostTNode);
        this.insertImpl(viewRef, index, skipDomInsertion);
        return viewRef;
    }
    createComponent(componentFactoryOrType, indexOrOptions, injector, projectableNodes, environmentInjector) {
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
            if (ngDevMode && options.environmentInjector && options.ngModuleRef) {
                throwError(`Cannot pass both environmentInjector and ngModuleRef options to createComponent().`);
            }
            index = options.index;
            injector = options.injector;
            projectableNodes = options.projectableNodes;
            environmentInjector = options.environmentInjector || options.ngModuleRef;
        }
        const componentFactory = isComponentFactory ?
            componentFactoryOrType :
            new R3ComponentFactory(getComponentDef(componentFactoryOrType));
        const contextInjector = injector || this.parentInjector;
        // If an `NgModuleRef` is not provided explicitly, try retrieving it from the DI tree.
        if (!environmentInjector && componentFactory.ngModule == null) {
            // For the `ComponentFactory` case, entering this logic is very unlikely, since we expect that
            // an instance of a `ComponentFactory`, resolved via `ComponentFactoryResolver` would have an
            // `ngModule` field. This is possible in some test scenarios and potentially in some JIT-based
            // use-cases. For the `ComponentFactory` case we preserve backwards-compatibility and try
            // using a provided injector first, then fall back to the parent injector of this
            // `ViewContainerRef` instance.
            //
            // For the factory-less case, it's critical to establish a connection with the module
            // injector tree (by retrieving an instance of an `NgModuleRef` and accessing its injector),
            // so that a component can use DI tokens provided in MgModules. For this reason, we can not
            // rely on the provided injector, since it might be detached from the DI tree (for example, if
            // it was created via `Injector.create` without specifying a parent injector, or if an
            // injector is retrieved from an `NgModuleRef` created via `createNgModule` using an
            // NgModule outside of a module tree). Instead, we always use `ViewContainerRef`'s parent
            // injector, which is normally connected to the DI tree, which includes module injector
            // subtree.
            const _injector = isComponentFactory ? contextInjector : this.parentInjector;
            // DO NOT REFACTOR. The code here used to have a `injector.get(NgModuleRef, null) ||
            // undefined` expression which seems to cause internal google apps to fail. This is documented
            // in the following internal bug issue: go/b/142967802
            const result = _injector.get(EnvironmentInjector, null);
            if (result) {
                environmentInjector = result;
            }
        }
        const componentDef = getComponentDef(componentFactory.componentType ?? {});
        const dehydratedView = findMatchingDehydratedView(this._lContainer, componentDef?.id ?? null);
        const rNode = dehydratedView?.firstChild ?? null;
        const componentRef = componentFactory.create(contextInjector, projectableNodes, rNode, environmentInjector);
        // If there is a matching dehydrated view, but the host TNode is located in the skip
        // hydration block, this means that the content was detached (as a part of the skip
        // hydration logic) and it needs to be appended into the DOM.
        const skipDomInsertion = !!dehydratedView && !hasInSkipHydrationBlockFlag(this._hostTNode);
        this.insertImpl(componentRef.hostView, index, skipDomInsertion);
        return componentRef;
    }
    insert(viewRef, index) {
        return this.insertImpl(viewRef, index, false);
    }
    insertImpl(viewRef, index, skipDomInsertion) {
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
        if (!skipDomInsertion) {
            const beforeNode = getBeforeNodeForView(adjustedIdx, lContainer);
            const renderer = lView[RENDERER];
            const parentRNode = nativeParentNode(renderer, lContainer[NATIVE]);
            if (parentRNode !== null) {
                addViewToContainer(tView, lContainer[T_HOST], renderer, lView, parentRNode, beforeNode);
            }
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
 * @param hostTNode The node that is requesting a ViewContainerRef
 * @param hostLView The view to which the node belongs
 * @returns The ViewContainerRef instance to use
 */
export function createContainerRef(hostTNode, hostLView) {
    ngDevMode && assertTNodeType(hostTNode, 12 /* TNodeType.AnyContainer */ | 3 /* TNodeType.AnyRNode */);
    let lContainer;
    const slotValue = hostLView[hostTNode.index];
    if (isLContainer(slotValue)) {
        // If the host is a container, we don't need to create a new LContainer
        lContainer = slotValue;
    }
    else {
        // An LContainer anchor can not be `null`, but we set it here temporarily
        // and update to the actual value later in this function (see
        // `_locateOrCreateAnchorNode`).
        lContainer = createLContainer(slotValue, hostLView, null, hostTNode);
        hostLView[hostTNode.index] = lContainer;
        addToViewTree(hostLView, lContainer);
    }
    _locateOrCreateAnchorNode(lContainer, hostLView, hostTNode, slotValue);
    return new R3ViewContainerRef(lContainer, hostTNode, hostLView);
}
/**
 * Creates and inserts a comment node that acts as an anchor for a view container.
 *
 * If the host is a regular element, we have to insert a comment node manually which will
 * be used as an anchor when inserting elements. In this specific case we use low-level DOM
 * manipulation to insert it.
 */
function insertAnchorNode(hostLView, hostTNode) {
    const renderer = hostLView[RENDERER];
    ngDevMode && ngDevMode.rendererCreateComment++;
    const commentNode = renderer.createComment(ngDevMode ? 'container' : '');
    const hostNative = getNativeByTNode(hostTNode, hostLView);
    const parentOfHostNative = nativeParentNode(renderer, hostNative);
    nativeInsertBefore(renderer, parentOfHostNative, commentNode, nativeNextSibling(renderer, hostNative), false);
    return commentNode;
}
let _locateOrCreateAnchorNode = createAnchorNode;
/**
 * Regular creation mode: an anchor is created and
 * assigned to the `lContainer[NATIVE]` slot.
 */
function createAnchorNode(lContainer, hostLView, hostTNode, slotValue) {
    // We already have a native element (anchor) set, return.
    if (lContainer[NATIVE])
        return;
    let commentNode;
    // If the host is an element container, the native host element is guaranteed to be a
    // comment and we can reuse that comment as anchor element for the new LContainer.
    // The comment node in question is already part of the DOM structure so we don't need to append
    // it again.
    if (hostTNode.type & 8 /* TNodeType.ElementContainer */) {
        commentNode = unwrapRNode(slotValue);
    }
    else {
        commentNode = insertAnchorNode(hostLView, hostTNode);
    }
    lContainer[NATIVE] = commentNode;
}
/**
 * Hydration logic that looks up:
 *  - an anchor node in the DOM and stores the node in `lContainer[NATIVE]`
 *  - all dehydrated views in this container and puts them into `lContainer[DEHYDRATED_VIEWS]`
 */
function locateOrCreateAnchorNode(lContainer, hostLView, hostTNode, slotValue) {
    // We already have a native element (anchor) set and the process
    // of finding dehydrated views happened (so the `lContainer[DEHYDRATED_VIEWS]`
    // is not null), exit early.
    if (lContainer[NATIVE] && lContainer[DEHYDRATED_VIEWS])
        return;
    const hydrationInfo = hostLView[HYDRATION];
    const noOffsetIndex = hostTNode.index - HEADER_OFFSET;
    // TODO(akushnir): this should really be a single condition, refactor the code
    // to use `hasInSkipHydrationBlockFlag` logic inside `isInSkipHydrationBlock`.
    const skipHydration = isInSkipHydrationBlock(hostTNode) || hasInSkipHydrationBlockFlag(hostTNode);
    const isNodeCreationMode = !hydrationInfo || skipHydration || isDisconnectedNode(hydrationInfo, noOffsetIndex);
    // Regular creation mode.
    if (isNodeCreationMode) {
        return createAnchorNode(lContainer, hostLView, hostTNode, slotValue);
    }
    // Hydration mode, looking up an anchor node and dehydrated views in DOM.
    const currentRNode = getSegmentHead(hydrationInfo, noOffsetIndex);
    const serializedViews = hydrationInfo.data[CONTAINERS]?.[noOffsetIndex];
    ngDevMode &&
        assertDefined(serializedViews, 'Unexpected state: no hydration info available for a given TNode, ' +
            'which represents a view container.');
    const [commentNode, dehydratedViews] = locateDehydratedViewsInContainer(currentRNode, serializedViews);
    if (ngDevMode) {
        validateMatchingNode(commentNode, Node.COMMENT_NODE, null, hostLView, hostTNode, true);
        // Do not throw in case this node is already claimed (thus `false` as a second
        // argument). If this container is created based on an `<ng-template>`, the comment
        // node would be already claimed from the `template` instruction. If an element acts
        // as an anchor (e.g. <div #vcRef>), a separate comment node would be created/located,
        // so we need to claim it here.
        markRNodeAsClaimedByHydration(commentNode, false);
    }
    lContainer[NATIVE] = commentNode;
    lContainer[DEHYDRATED_VIEWS] = dehydratedViews;
}
export function enableLocateOrCreateContainerRefImpl() {
    _locateOrCreateAnchorNode = locateOrCreateAnchorNode;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld19jb250YWluZXJfcmVmLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvbGlua2VyL3ZpZXdfY29udGFpbmVyX3JlZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFHSCxPQUFPLEVBQUMsbUJBQW1CLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUN0RCxPQUFPLEVBQUMsb0JBQW9CLEVBQUMsTUFBTSw2QkFBNkIsQ0FBQztBQUNqRSxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFDbkQsT0FBTyxFQUFDLDJCQUEyQixFQUFFLHNCQUFzQixFQUFDLE1BQU0sNkJBQTZCLENBQUM7QUFDaEcsT0FBTyxFQUFDLGNBQWMsRUFBRSxrQkFBa0IsRUFBRSw2QkFBNkIsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQ3JHLE9BQU8sRUFBQywwQkFBMEIsRUFBRSxnQ0FBZ0MsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQ2hHLE9BQU8sRUFBQyxNQUFNLEVBQU8sTUFBTSxtQkFBbUIsQ0FBQztBQUMvQyxPQUFPLEVBQUMsa0JBQWtCLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNyRCxPQUFPLEVBQUMsZ0JBQWdCLElBQUksa0JBQWtCLEVBQUMsTUFBTSwwQkFBMEIsQ0FBQztBQUNoRixPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDdEQsT0FBTyxFQUFDLHlCQUF5QixFQUFFLFlBQVksRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUN0RSxPQUFPLEVBQUMsYUFBYSxFQUFFLGdCQUFnQixFQUFDLE1BQU0sZ0NBQWdDLENBQUM7QUFDL0UsT0FBTyxFQUFDLHVCQUF1QixFQUFFLGdCQUFnQixFQUFjLE1BQU0sRUFBRSxTQUFTLEVBQUMsTUFBTSxpQ0FBaUMsQ0FBQztBQUl6SCxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sbUNB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UUFDYixvQkFBb0IsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFlBQVksRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN2Riw4RUFBOEU7UUFDOUUsbUZBQW1GO1FBQ25GLG9GQUFvRjtRQUNwRixzRkFBc0Y7UUFDdEYsK0JBQStCO1FBQy9CLDZCQUE2QixDQUFDLFdBQVcsRUFBRSxLQUFLLENBQUMsQ0FBQztLQUNuRDtJQUVELFVBQVUsQ0FBQyxNQUFNLENBQUMsR0FBRyxXQUF1QixDQUFDO0lBQzdDLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLGVBQWUsQ0FBQztBQUNqRCxDQUFDO0FBRUQsTUFBTSxVQUFVLG9DQUFvQztJQUNsRCx5QkFBeUIsR0FBRyx3QkFBd0IsQ0FBQztBQUN2RCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4uL2RpL2luamVjdG9yJztcbmltcG9ydCB7RW52aXJvbm1lbnRJbmplY3Rvcn0gZnJvbSAnLi4vZGkvcjNfaW5qZWN0b3InO1xuaW1wb3J0IHt2YWxpZGF0ZU1hdGNoaW5nTm9kZX0gZnJvbSAnLi4vaHlkcmF0aW9uL2Vycm9yX2hhbmRsaW5nJztcbmltcG9ydCB7Q09OVEFJTkVSU30gZnJvbSAnLi4vaHlkcmF0aW9uL2ludGVyZmFjZXMnO1xuaW1wb3J0IHtoYXNJblNraXBIeWRyYXRpb25CbG9ja0ZsYWcsIGlzSW5Ta2lwSHlkcmF0aW9uQmxvY2t9IGZyb20gJy4uL2h5ZHJhdGlvbi9za2lwX2h5ZHJhdGlvbic7XG5pbXBvcnQge2dldFNlZ21lbnRIZWFkLCBpc0Rpc2Nvbm5lY3RlZE5vZGUsIG1hcmtSTm9kZUFzQ2xhaW1lZEJ5SHlkcmF0aW9ufSBmcm9tICcuLi9oeWRyYXRpb24vdXRpbHMnO1xuaW1wb3J0IHtmaW5kTWF0Y2hpbmdEZWh5ZHJhdGVkVmlldywgbG9jYXRlRGVoeWRyYXRlZFZpZXdzSW5Db250YWluZXJ9IGZyb20gJy4uL2h5ZHJhdGlvbi92aWV3cyc7XG5pbXBvcnQge2lzVHlwZSwgVHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlL3R5cGUnO1xuaW1wb3J0IHthc3NlcnROb2RlSW5qZWN0b3J9IGZyb20gJy4uL3JlbmRlcjMvYXNzZXJ0JztcbmltcG9ydCB7Q29tcG9uZW50RmFjdG9yeSBhcyBSM0NvbXBvbmVudEZhY3Rvcnl9IGZyb20gJy4uL3JlbmRlcjMvY29tcG9uZW50X3JlZic7XG5pbXBvcnQge2dldENvbXBvbmVudERlZn0gZnJvbSAnLi4vcmVuZGVyMy9kZWZpbml0aW9uJztcbmltcG9ydCB7Z2V0UGFyZW50SW5qZWN0b3JMb2NhdGlvbiwgTm9kZUluamVjdG9yfSBmcm9tICcuLi9yZW5kZXIzL2RpJztcbmltcG9ydCB7YWRkVG9WaWV3VHJlZSwgY3JlYXRlTENvbnRhaW5lcn0gZnJvbSAnLi4vcmVuZGVyMy9pbnN0cnVjdGlvbnMvc2hhcmVkJztcbmltcG9ydCB7Q09OVEFJTkVSX0hFQURFUl9PRkZTRVQsIERFSFlEUkFURURfVklFV1MsIExDb250YWluZXIsIE5BVElWRSwgVklFV19SRUZTfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7Tm9kZUluamVjdG9yT2Zmc2V0fSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvaW5qZWN0b3InO1xuaW1wb3J0IHtUQ29udGFpbmVyTm9kZSwgVERpcmVjdGl2ZUhvc3ROb2RlLCBURWxlbWVudENvbnRhaW5lck5vZGUsIFRFbGVtZW50Tm9kZSwgVE5vZGUsIFROb2RlVHlwZX0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtSQ29tbWVudCwgUkVsZW1lbnQsIFJOb2RlfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvcmVuZGVyZXJfZG9tJztcbmltcG9ydCB7aXNMQ29udGFpbmVyfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvdHlwZV9jaGVja3MnO1xuaW1wb3J0IHtIRUFERVJfT0ZGU0VULCBIWURSQVRJT04sIExWaWV3LCBQQVJFTlQsIFJFTkRFUkVSLCBUX0hPU1QsIFRWSUVXfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydFROb2RlVHlwZX0gZnJvbSAnLi4vcmVuZGVyMy9ub2RlX2Fzc2VydCc7XG5pbXBvcnQge2FkZFZpZXdUb0NvbnRhaW5lciwgZGVzdHJveUxWaWV3LCBkZXRhY2hWaWV3LCBnZXRCZWZvcmVOb2RlRm9yVmlldywgaW5zZXJ0VmlldywgbmF0aXZlSW5zZXJ0QmVmb3JlLCBuYXRpdmVOZXh0U2libGluZywgbmF0aXZlUGFyZW50Tm9kZX0gZnJvbSAnLi4vcmVuZGVyMy9ub2RlX21hbmlwdWxhdGlvbic7XG5pbXBvcnQge2dldEN1cnJlbnRUTm9kZSwgZ2V0TFZpZXd9IGZyb20gJy4uL3JlbmRlcjMvc3RhdGUnO1xuaW1wb3J0IHtnZXRQYXJlbnRJbmplY3RvckluZGV4LCBnZXRQYXJlbnRJbmplY3RvclZpZXcsIGhhc1BhcmVudEluamVjdG9yfSBmcm9tICcuLi9yZW5kZXIzL3V0aWwvaW5qZWN0b3JfdXRpbHMnO1xuaW1wb3J0IHtnZXROYXRpdmVCeVROb2RlLCB1bndyYXBSTm9kZSwgdmlld0F0dGFjaGVkVG9Db250YWluZXJ9IGZyb20gJy4uL3JlbmRlcjMvdXRpbC92aWV3X3V0aWxzJztcbmltcG9ydCB7Vmlld1JlZiBhcyBSM1ZpZXdSZWZ9IGZyb20gJy4uL3JlbmRlcjMvdmlld19yZWYnO1xuaW1wb3J0IHthZGRUb0FycmF5LCByZW1vdmVGcm9tQXJyYXl9IGZyb20gJy4uL3V0aWwvYXJyYXlfdXRpbHMnO1xuaW1wb3J0IHthc3NlcnREZWZpbmVkLCBhc3NlcnRFcXVhbCwgYXNzZXJ0R3JlYXRlclRoYW4sIGFzc2VydExlc3NUaGFuLCB0aHJvd0Vycm9yfSBmcm9tICcuLi91dGlsL2Fzc2VydCc7XG5cbmltcG9ydCB7Q29tcG9uZW50RmFjdG9yeSwgQ29tcG9uZW50UmVmfSBmcm9tICcuL2NvbXBvbmVudF9mYWN0b3J5JztcbmltcG9ydCB7Y3JlYXRlRWxlbWVudFJlZiwgRWxlbWVudFJlZn0gZnJvbSAnLi9lbGVtZW50X3JlZic7XG5pbXBvcnQge05nTW9kdWxlUmVmfSBmcm9tICcuL25nX21vZHVsZV9mYWN0b3J5JztcbmltcG9ydCB7VGVtcGxhdGVSZWZ9IGZyb20gJy4vdGVtcGxhdGVfcmVmJztcbmltcG9ydCB7RW1iZWRkZWRWaWV3UmVmLCBWaWV3UmVmfSBmcm9tICcuL3ZpZXdfcmVmJztcblxuLyoqXG4gKiBSZXByZXNlbnRzIGEgY29udGFpbmVyIHdoZXJlIG9uZSBvciBtb3JlIHZpZXdzIGNhbiBiZSBhdHRhY2hlZCB0byBhIGNvbXBvbmVudC5cbiAqXG4gKiBDYW4gY29udGFpbiAqaG9zdCB2aWV3cyogKGNyZWF0ZWQgYnkgaW5zdGFudGlhdGluZyBhXG4gKiBjb21wb25lbnQgd2l0aCB0aGUgYGNyZWF0ZUNvbXBvbmVudCgpYCBtZXRob2QpLCBhbmQgKmVtYmVkZGVkIHZpZXdzKlxuICogKGNyZWF0ZWQgYnkgaW5zdGFudGlhdGluZyBhIGBUZW1wbGF0ZVJlZmAgd2l0aCB0aGUgYGNyZWF0ZUVtYmVkZGVkVmlldygpYCBtZXRob2QpLlxuICpcbiAqIEEgdmlldyBjb250YWluZXIgaW5zdGFuY2UgY2FuIGNvbnRhaW4gb3RoZXIgdmlldyBjb250YWluZXJzLFxuICogY3JlYXRpbmcgYSBbdmlldyBoaWVyYXJjaHldKGd1aWRlL2dsb3NzYXJ5I3ZpZXctaGllcmFyY2h5KS5cbiAqXG4gKiBAc2VlIGBDb21wb25lbnRSZWZgXG4gKiBAc2VlIGBFbWJlZGRlZFZpZXdSZWZgXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgVmlld0NvbnRhaW5lclJlZiB7XG4gIC8qKlxuICAgKiBBbmNob3IgZWxlbWVudCB0aGF0IHNwZWNpZmllcyB0aGUgbG9jYXRpb24gb2YgdGhpcyBjb250YWluZXIgaW4gdGhlIGNvbnRhaW5pbmcgdmlldy5cbiAgICogRWFjaCB2aWV3IGNvbnRhaW5lciBjYW4gaGF2ZSBvbmx5IG9uZSBhbmNob3IgZWxlbWVudCwgYW5kIGVhY2ggYW5jaG9yIGVsZW1lbnRcbiAgICogY2FuIGhhdmUgb25seSBhIHNpbmdsZSB2aWV3IGNvbnRhaW5lci5cbiAgICpcbiAgICogUm9vdCBlbGVtZW50cyBvZiB2aWV3cyBhdHRhY2hlZCB0byB0aGlzIGNvbnRhaW5lciBiZWNvbWUgc2libGluZ3Mgb2YgdGhlIGFuY2hvciBlbGVtZW50IGluXG4gICAqIHRoZSByZW5kZXJlZCB2aWV3LlxuICAgKlxuICAgKiBBY2Nlc3MgdGhlIGBWaWV3Q29udGFpbmVyUmVmYCBvZiBhbiBlbGVtZW50IGJ5IHBsYWNpbmcgYSBgRGlyZWN0aXZlYCBpbmplY3RlZFxuICAgKiB3aXRoIGBWaWV3Q29udGFpbmVyUmVmYCBvbiB0aGUgZWxlbWVudCwgb3IgdXNlIGEgYFZpZXdDaGlsZGAgcXVlcnkuXG4gICAqXG4gICAqIDwhLS0gVE9ETzogcmVuYW1lIHRvIGFuY2hvckVsZW1lbnQgLS0+XG4gICAqL1xuICBhYnN0cmFjdCBnZXQgZWxlbWVudCgpOiBFbGVtZW50UmVmO1xuXG4gIC8qKlxuICAgKiBUaGUgW2RlcGVuZGVuY3kgaW5qZWN0b3JdKGd1aWRlL2dsb3NzYXJ5I2luamVjdG9yKSBmb3IgdGhpcyB2aWV3IGNvbnRhaW5lci5cbiAgICovXG4gIGFic3RyYWN0IGdldCBpbmplY3RvcigpOiBJbmplY3RvcjtcblxuICAvKiogQGRlcHJlY2F0ZWQgTm8gcmVwbGFjZW1lbnQgKi9cbiAgYWJzdHJhY3QgZ2V0IHBhcmVudEluamVjdG9yKCk6IEluamVjdG9yO1xuXG4gIC8qKlxuICAgKiBEZXN0cm95cyBhbGwgdmlld3MgaW4gdGhpcyBjb250YWluZXIuXG4gICAqL1xuICBhYnN0cmFjdCBjbGVhcigpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgYSB2aWV3IGZyb20gdGhpcyBjb250YWluZXIuXG4gICAqIEBwYXJhbSBpbmRleCBUaGUgMC1iYXNlZCBpbmRleCBvZiB0aGUgdmlldyB0byByZXRyaWV2ZS5cbiAgICogQHJldHVybnMgVGhlIGBWaWV3UmVmYCBpbnN0YW5jZSwgb3IgbnVsbCBpZiB0aGUgaW5kZXggaXMgb3V0IG9mIHJhbmdlLlxuICAgKi9cbiAgYWJzdHJhY3QgZ2V0KGluZGV4OiBudW1iZXIpOiBWaWV3UmVmfG51bGw7XG5cbiAgLyoqXG4gICAqIFJlcG9ydHMgaG93IG1hbnkgdmlld3MgYXJlIGN1cnJlbnRseSBhdHRhY2hlZCB0byB0aGlzIGNvbnRhaW5lci5cbiAgICogQHJldHVybnMgVGhlIG51bWJlciBvZiB2aWV3cy5cbiAgICovXG4gIGFic3RyYWN0IGdldCBsZW5ndGgoKTogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBJbnN0YW50aWF0ZXMgYW4gZW1iZWRkZWQgdmlldyBhbmQgaW5zZXJ0cyBpdFxuICAgKiBpbnRvIHRoaXMgY29udGFpbmVyLlxuICAgKiBAcGFyYW0gdGVtcGxhdGVSZWYgVGhlIEhUTUwgdGVtcGxhdGUgdGhhdCBkZWZpbmVzIHRoZSB2aWV3LlxuICAgKiBAcGFyYW0gY29udGV4dCBUaGUgZGF0YS1iaW5kaW5nIGNvbnRleHQgb2YgdGhlIGVtYmVkZGVkIHZpZXcsIGFzIGRlY2xhcmVkXG4gICAqIGluIHRoZSBgPG5nLXRlbXBsYXRlPmAgdXNhZ2UuXG4gICAqIEBwYXJhbSBvcHRpb25zIEV4dHJhIGNvbmZpZ3VyYXRpb24gZm9yIHRoZSBjcmVhdGVkIHZpZXcuIEluY2x1ZGVzOlxuICAgKiAgKiBpbmRleDogVGhlIDAtYmFzZWQgaW5kZXggYXQgd2hpY2ggdG8gaW5zZXJ0IHRoZSBuZXcgdmlldyBpbnRvIHRoaXMgY29udGFpbmVyLlxuICAgKiAgICAgICAgICAgSWYgbm90IHNwZWNpZmllZCwgYXBwZW5kcyB0aGUgbmV3IHZpZXcgYXMgdGhlIGxhc3QgZW50cnkuXG4gICAqICAqIGluamVjdG9yOiBJbmplY3RvciB0byBiZSB1c2VkIHdpdGhpbiB0aGUgZW1iZWRkZWQgdmlldy5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGBWaWV3UmVmYCBpbnN0YW5jZSBmb3IgdGhlIG5ld2x5IGNyZWF0ZWQgdmlldy5cbiAgICovXG4gIGFic3RyYWN0IGNyZWF0ZUVtYmVkZGVkVmlldzxDPih0ZW1wbGF0ZVJlZjogVGVtcGxhdGVSZWY8Qz4sIGNvbnRleHQ/OiBDLCBvcHRpb25zPzoge1xuICAgIGluZGV4PzogbnVtYmVyLFxuICAgIGluamVjdG9yPzogSW5qZWN0b3JcbiAgfSk6IEVtYmVkZGVkVmlld1JlZjxDPjtcblxuICAvKipcbiAgICogSW5zdGFudGlhdGVzIGFuIGVtYmVkZGVkIHZpZXcgYW5kIGluc2VydHMgaXRcbiAgICogaW50byB0aGlzIGNvbnRhaW5lci5cbiAgICogQHBhcmFtIHRlbXBsYXRlUmVmIFRoZSBIVE1MIHRlbXBsYXRlIHRoYXQgZGVmaW5lcyB0aGUgdmlldy5cbiAgICogQHBhcmFtIGNvbnRleHQgVGhlIGRhdGEtYmluZGluZyBjb250ZXh0IG9mIHRoZSBlbWJlZGRlZCB2aWV3LCBhcyBkZWNsYXJlZFxuICAgKiBpbiB0aGUgYDxuZy10ZW1wbGF0ZT5gIHVzYWdlLlxuICAgKiBAcGFyYW0gaW5kZXggVGhlIDAtYmFzZWQgaW5kZXggYXQgd2hpY2ggdG8gaW5zZXJ0IHRoZSBuZXcgdmlldyBpbnRvIHRoaXMgY29udGFpbmVyLlxuICAgKiBJZiBub3Qgc3BlY2lmaWVkLCBhcHBlbmRzIHRoZSBuZXcgdmlldyBhcyB0aGUgbGFzdCBlbnRyeS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGBWaWV3UmVmYCBpbnN0YW5jZSBmb3IgdGhlIG5ld2x5IGNyZWF0ZWQgdmlldy5cbiAgICovXG4gIGFic3RyYWN0IGNyZWF0ZUVtYmVkZGVkVmlldzxDPih0ZW1wbGF0ZVJlZjogVGVtcGxhdGVSZWY8Qz4sIGNvbnRleHQ/OiBDLCBpbmRleD86IG51bWJlcik6XG4gICAgICBFbWJlZGRlZFZpZXdSZWY8Qz47XG5cbiAgLyoqXG4gICAqIEluc3RhbnRpYXRlcyBhIHNpbmdsZSBjb21wb25lbnQgYW5kIGluc2VydHMgaXRzIGhvc3QgdmlldyBpbnRvIHRoaXMgY29udGFpbmVyLlxuICAgKlxuICAgKiBAcGFyYW0gY29tcG9uZW50VHlwZSBDb21wb25lbnQgVHlwZSB0byB1c2UuXG4gICAqIEBwYXJhbSBvcHRpb25zIEFuIG9iamVjdCB0aGF0IGNvbnRhaW5zIGV4dHJhIHBhcmFtZXRlcnM6XG4gICAqICAqIGluZGV4OiB0aGUgaW5kZXggYXQgd2hpY2ggdG8gaW5zZXJ0IHRoZSBuZXcgY29tcG9uZW50J3MgaG9zdCB2aWV3IGludG8gdGhpcyBjb250YWluZXIuXG4gICAqICAgICAgICAgICBJZiBub3Qgc3BlY2lmaWVkLCBhcHBlbmRzIHRoZSBuZXcgdmlldyBhcyB0aGUgbGFzdCBlbnRyeS5cbiAgICogICogaW5qZWN0b3I6IHRoZSBpbmplY3RvciB0byB1c2UgYXMgdGhlIHBhcmVudCBmb3IgdGhlIG5ldyBjb21wb25lbnQuXG4gICAqICAqIG5nTW9kdWxlUmVmOiBhbiBOZ01vZHVsZVJlZiBvZiB0aGUgY29tcG9uZW50J3MgTmdNb2R1bGUsIHlvdSBzaG91bGQgYWxtb3N0IGFsd2F5cyBwcm92aWRlXG4gICAqICAgICAgICAgICAgICAgICB0aGlzIHRvIGVuc3VyZSB0aGF0IGFsbCBleHBlY3RlZCBwcm92aWRlcnMgYXJlIGF2YWlsYWJsZSBmb3IgdGhlIGNvbXBvbmVudFxuICAgKiAgICAgICAgICAgICAgICAgaW5zdGFudGlhdGlvbi5cbiAgICogICogZW52aXJvbm1lbnRJbmplY3RvcjogYW4gRW52aXJvbm1lbnRJbmplY3RvciB3aGljaCB3aWxsIHByb3ZpZGUgdGhlIGNvbXBvbmVudCdzIGVudmlyb25tZW50LlxuICAgKiAgICAgICAgICAgICAgICAgeW91IHNob3VsZCBhbG1vc3QgYWx3YXlzIHByb3ZpZGUgdGhpcyB0byBlbnN1cmUgdGhhdCBhbGwgZXhwZWN0ZWQgcHJvdmlkZXJzXG4gICAqICAgICAgICAgICAgICAgICBhcmUgYXZhaWxhYmxlIGZvciB0aGUgY29tcG9uZW50IGluc3RhbnRpYXRpb24uIFRoaXMgb3B0aW9uIGlzIGludGVuZGVkIHRvXG4gICAqICAgICAgICAgICAgICAgICByZXBsYWNlIHRoZSBgbmdNb2R1bGVSZWZgIHBhcmFtZXRlci5cbiAgICogICogcHJvamVjdGFibGVOb2RlczogbGlzdCBvZiBET00gbm9kZXMgdGhhdCBzaG91bGQgYmUgcHJvamVjdGVkIHRocm91Z2hcbiAgICogICAgICAgICAgICAgICAgICAgICAgW2A8bmctY29udGVudD5gXShhcGkvY29yZS9uZy1jb250ZW50KSBvZiB0aGUgbmV3IGNvbXBvbmVudCBpbnN0YW5jZS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIG5ldyBgQ29tcG9uZW50UmVmYCB3aGljaCBjb250YWlucyB0aGUgY29tcG9uZW50IGluc3RhbmNlIGFuZCB0aGUgaG9zdCB2aWV3LlxuICAgKi9cbiAgYWJzdHJhY3QgY3JlYXRlQ29tcG9uZW50PEM+KGNvbXBvbmVudFR5cGU6IFR5cGU8Qz4sIG9wdGlvbnM/OiB7XG4gICAgaW5kZXg/OiBudW1iZXIsXG4gICAgaW5qZWN0b3I/OiBJbmplY3RvcixcbiAgICBuZ01vZHVsZVJlZj86IE5nTW9kdWxlUmVmPHVua25vd24+LFxuICAgIGVudmlyb25tZW50SW5qZWN0b3I/OiBFbnZpcm9ubWVudEluamVjdG9yfE5nTW9kdWxlUmVmPHVua25vd24+LFxuICAgIHByb2plY3RhYmxlTm9kZXM/OiBOb2RlW11bXSxcbiAgfSk6IENvbXBvbmVudFJlZjxDPjtcblxuICAvKipcbiAgICogSW5zdGFudGlhdGVzIGEgc2luZ2xlIGNvbXBvbmVudCBhbmQgaW5zZXJ0cyBpdHMgaG9zdCB2aWV3IGludG8gdGhpcyBjb250YWluZXIuXG4gICAqXG4gICAqIEBwYXJhbSBjb21wb25lbnRGYWN0b3J5IENvbXBvbmVudCBmYWN0b3J5IHRvIHVzZS5cbiAgICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBhdCB3aGljaCB0byBpbnNlcnQgdGhlIG5ldyBjb21wb25lbnQncyBob3N0IHZpZXcgaW50byB0aGlzIGNvbnRhaW5lci5cbiAgICogSWYgbm90IHNwZWNpZmllZCwgYXBwZW5kcyB0aGUgbmV3IHZpZXcgYXMgdGhlIGxhc3QgZW50cnkuXG4gICAqIEBwYXJhbSBpbmplY3RvciBUaGUgaW5qZWN0b3IgdG8gdXNlIGFzIHRoZSBwYXJlbnQgZm9yIHRoZSBuZXcgY29tcG9uZW50LlxuICAgKiBAcGFyYW0gcHJvamVjdGFibGVOb2RlcyBMaXN0IG9mIERPTSBub2RlcyB0aGF0IHNob3VsZCBiZSBwcm9qZWN0ZWQgdGhyb3VnaFxuICAgKiAgICAgW2A8bmctY29udGVudD5gXShhcGkvY29yZS9uZy1jb250ZW50KSBvZiB0aGUgbmV3IGNvbXBvbmVudCBpbnN0YW5jZS5cbiAgICogQHBhcmFtIG5nTW9kdWxlUmVmIEFuIGluc3RhbmNlIG9mIHRoZSBOZ01vZHVsZVJlZiB0aGF0IHJlcHJlc2VudCBhbiBOZ01vZHVsZS5cbiAgICogVGhpcyBpbmZvcm1hdGlvbiBpcyB1c2VkIHRvIHJldHJpZXZlIGNvcnJlc3BvbmRpbmcgTmdNb2R1bGUgaW5qZWN0b3IuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBuZXcgYENvbXBvbmVudFJlZmAgd2hpY2ggY29udGFpbnMgdGhlIGNvbXBvbmVudCBpbnN0YW5jZSBhbmQgdGhlIGhvc3Qgdmlldy5cbiAgICpcbiAgICogQGRlcHJlY2F0ZWQgQW5ndWxhciBubyBsb25nZXIgcmVxdWlyZXMgY29tcG9uZW50IGZhY3RvcmllcyB0byBkeW5hbWljYWxseSBjcmVhdGUgY29tcG9uZW50cy5cbiAgICogICAgIFVzZSBkaWZmZXJlbnQgc2lnbmF0dXJlIG9mIHRoZSBgY3JlYXRlQ29tcG9uZW50YCBtZXRob2QsIHdoaWNoIGFsbG93cyBwYXNzaW5nXG4gICAqICAgICBDb21wb25lbnQgY2xhc3MgZGlyZWN0bHkuXG4gICAqL1xuICBhYnN0cmFjdCBjcmVhdGVDb21wb25lbnQ8Qz4oXG4gICAgICBjb21wb25lbnRGYWN0b3J5OiBDb21wb25lbnRGYWN0b3J5PEM+LCBpbmRleD86IG51bWJlciwgaW5qZWN0b3I/OiBJbmplY3RvcixcbiAgICAgIHByb2plY3RhYmxlTm9kZXM/OiBhbnlbXVtdLFxuICAgICAgZW52aXJvbm1lbnRJbmplY3Rvcj86IEVudmlyb25tZW50SW5qZWN0b3J8TmdNb2R1bGVSZWY8YW55Pik6IENvbXBvbmVudFJlZjxDPjtcblxuICAvKipcbiAgICogSW5zZXJ0cyBhIHZpZXcgaW50byB0aGlzIGNvbnRhaW5lci5cbiAgICogQHBhcmFtIHZpZXdSZWYgVGhlIHZpZXcgdG8gaW5zZXJ0LlxuICAgKiBAcGFyYW0gaW5kZXggVGhlIDAtYmFzZWQgaW5kZXggYXQgd2hpY2ggdG8gaW5zZXJ0IHRoZSB2aWV3LlxuICAgKiBJZiBub3Qgc3BlY2lmaWVkLCBhcHBlbmRzIHRoZSBuZXcgdmlldyBhcyB0aGUgbGFzdCBlbnRyeS5cbiAgICogQHJldHVybnMgVGhlIGluc2VydGVkIGBWaWV3UmVmYCBpbnN0YW5jZS5cbiAgICpcbiAgICovXG4gIGFic3RyYWN0IGluc2VydCh2aWV3UmVmOiBWaWV3UmVmLCBpbmRleD86IG51bWJlcik6IFZpZXdSZWY7XG5cbiAgLyoqXG4gICAqIE1vdmVzIGEgdmlldyB0byBhIG5ldyBsb2NhdGlvbiBpbiB0aGlzIGNvbnRhaW5lci5cbiAgICogQHBhcmFtIHZpZXdSZWYgVGhlIHZpZXcgdG8gbW92ZS5cbiAgICogQHBhcmFtIGluZGV4IFRoZSAwLWJhc2VkIGluZGV4IG9mIHRoZSBuZXcgbG9jYXRpb24uXG4gICAqIEByZXR1cm5zIFRoZSBtb3ZlZCBgVmlld1JlZmAgaW5zdGFuY2UuXG4gICAqL1xuICBhYnN0cmFjdCBtb3ZlKHZpZXdSZWY6IFZpZXdSZWYsIGN1cnJlbnRJbmRleDogbnVtYmVyKTogVmlld1JlZjtcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgaW5kZXggb2YgYSB2aWV3IHdpdGhpbiB0aGUgY3VycmVudCBjb250YWluZXIuXG4gICAqIEBwYXJhbSB2aWV3UmVmIFRoZSB2aWV3IHRvIHF1ZXJ5LlxuICAgKiBAcmV0dXJucyBUaGUgMC1iYXNlZCBpbmRleCBvZiB0aGUgdmlldydzIHBvc2l0aW9uIGluIHRoaXMgY29udGFpbmVyLFxuICAgKiBvciBgLTFgIGlmIHRoaXMgY29udGFpbmVyIGRvZXNuJ3QgY29udGFpbiB0aGUgdmlldy5cbiAgICovXG4gIGFic3RyYWN0IGluZGV4T2Yodmlld1JlZjogVmlld1JlZik6IG51bWJlcjtcblxuICAvKipcbiAgICogRGVzdHJveXMgYSB2aWV3IGF0dGFjaGVkIHRvIHRoaXMgY29udGFpbmVyXG4gICAqIEBwYXJhbSBpbmRleCBUaGUgMC1iYXNlZCBpbmRleCBvZiB0aGUgdmlldyB0byBkZXN0cm95LlxuICAgKiBJZiBub3Qgc3BlY2lmaWVkLCB0aGUgbGFzdCB2aWV3IGluIHRoZSBjb250YWluZXIgaXMgcmVtb3ZlZC5cbiAgICovXG4gIGFic3RyYWN0IHJlbW92ZShpbmRleD86IG51bWJlcik6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIERldGFjaGVzIGEgdmlldyBmcm9tIHRoaXMgY29udGFpbmVyIHdpdGhvdXQgZGVzdHJveWluZyBpdC5cbiAgICogVXNlIGFsb25nIHdpdGggYGluc2VydCgpYCB0byBtb3ZlIGEgdmlldyB3aXRoaW4gdGhlIGN1cnJlbnQgY29udGFpbmVyLlxuICAgKiBAcGFyYW0gaW5kZXggVGhlIDAtYmFzZWQgaW5kZXggb2YgdGhlIHZpZXcgdG8gZGV0YWNoLlxuICAgKiBJZiBub3Qgc3BlY2lmaWVkLCB0aGUgbGFzdCB2aWV3IGluIHRoZSBjb250YWluZXIgaXMgZGV0YWNoZWQuXG4gICAqL1xuICBhYnN0cmFjdCBkZXRhY2goaW5kZXg/OiBudW1iZXIpOiBWaWV3UmVmfG51bGw7XG5cbiAgLyoqXG4gICAqIEBpbnRlcm5hbFxuICAgKiBAbm9jb2xsYXBzZVxuICAgKi9cbiAgc3RhdGljIF9fTkdfRUxFTUVOVF9JRF9fOiAoKSA9PiBWaWV3Q29udGFpbmVyUmVmID0gaW5qZWN0Vmlld0NvbnRhaW5lclJlZjtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgVmlld0NvbnRhaW5lclJlZiBhbmQgc3RvcmVzIGl0IG9uIHRoZSBpbmplY3Rvci4gT3IsIGlmIHRoZSBWaWV3Q29udGFpbmVyUmVmXG4gKiBhbHJlYWR5IGV4aXN0cywgcmV0cmlldmVzIHRoZSBleGlzdGluZyBWaWV3Q29udGFpbmVyUmVmLlxuICpcbiAqIEByZXR1cm5zIFRoZSBWaWV3Q29udGFpbmVyUmVmIGluc3RhbmNlIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0Vmlld0NvbnRhaW5lclJlZigpOiBWaWV3Q29udGFpbmVyUmVmIHtcbiAgY29uc3QgcHJldmlvdXNUTm9kZSA9IGdldEN1cnJlbnRUTm9kZSgpIGFzIFRFbGVtZW50Tm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSB8IFRDb250YWluZXJOb2RlO1xuICByZXR1cm4gY3JlYXRlQ29udGFpbmVyUmVmKHByZXZpb3VzVE5vZGUsIGdldExWaWV3KCkpO1xufVxuXG5jb25zdCBWRV9WaWV3Q29udGFpbmVyUmVmID0gVmlld0NvbnRhaW5lclJlZjtcblxuLy8gVE9ETyhhbHhodWIpOiBjbGVhbmluZyB1cCB0aGlzIGluZGlyZWN0aW9uIHRyaWdnZXJzIGEgc3VidGxlIGJ1ZyBpbiBDbG9zdXJlIGluIGczLiBPbmNlIHRoZSBmaXhcbi8vIGZvciB0aGF0IGxhbmRzLCB0aGlzIGNhbiBiZSBjbGVhbmVkIHVwLlxuY29uc3QgUjNWaWV3Q29udGFpbmVyUmVmID0gY2xhc3MgVmlld0NvbnRhaW5lclJlZiBleHRlbmRzIFZFX1ZpZXdDb250YWluZXJSZWYge1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgX2xDb250YWluZXI6IExDb250YWluZXIsXG4gICAgICBwcml2YXRlIF9ob3N0VE5vZGU6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxURWxlbWVudENvbnRhaW5lck5vZGUsXG4gICAgICBwcml2YXRlIF9ob3N0TFZpZXc6IExWaWV3KSB7XG4gICAgc3VwZXIoKTtcbiAgfVxuXG4gIG92ZXJyaWRlIGdldCBlbGVtZW50KCk6IEVsZW1lbnRSZWYge1xuICAgIHJldHVybiBjcmVhdGVFbGVtZW50UmVmKHRoaXMuX2hvc3RUTm9kZSwgdGhpcy5faG9zdExWaWV3KTtcbiAgfVxuXG4gIG92ZXJyaWRlIGdldCBpbmplY3RvcigpOiBJbmplY3RvciB7XG4gICAgcmV0dXJuIG5ldyBOb2RlSW5qZWN0b3IodGhpcy5faG9zdFROb2RlLCB0aGlzLl9ob3N0TFZpZXcpO1xuICB9XG5cbiAgLyoqIEBkZXByZWNhdGVkIE5vIHJlcGxhY2VtZW50ICovXG4gIG92ZXJyaWRlIGdldCBwYXJlbnRJbmplY3RvcigpOiBJbmplY3RvciB7XG4gICAgY29uc3QgcGFyZW50TG9jYXRpb24gPSBnZXRQYXJlbnRJbmplY3RvckxvY2F0aW9uKHRoaXMuX2hvc3RUTm9kZSwgdGhpcy5faG9zdExWaWV3KTtcbiAgICBpZiAoaGFzUGFyZW50SW5qZWN0b3IocGFyZW50TG9jYXRpb24pKSB7XG4gICAgICBjb25zdCBwYXJlbnRWaWV3ID0gZ2V0UGFyZW50SW5qZWN0b3JWaWV3KHBhcmVudExvY2F0aW9uLCB0aGlzLl9ob3N0TFZpZXcpO1xuICAgICAgY29uc3QgaW5qZWN0b3JJbmRleCA9IGdldFBhcmVudEluamVjdG9ySW5kZXgocGFyZW50TG9jYXRpb24pO1xuICAgICAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVJbmplY3RvcihwYXJlbnRWaWV3LCBpbmplY3RvckluZGV4KTtcbiAgICAgIGNvbnN0IHBhcmVudFROb2RlID1cbiAgICAgICAgICBwYXJlbnRWaWV3W1RWSUVXXS5kYXRhW2luamVjdG9ySW5kZXggKyBOb2RlSW5qZWN0b3JPZmZzZXQuVE5PREVdIGFzIFRFbGVtZW50Tm9kZTtcbiAgICAgIHJldHVybiBuZXcgTm9kZUluamVjdG9yKHBhcmVudFROb2RlLCBwYXJlbnRWaWV3KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG5ldyBOb2RlSW5qZWN0b3IobnVsbCwgdGhpcy5faG9zdExWaWV3KTtcbiAgICB9XG4gIH1cblxuICBvdmVycmlkZSBjbGVhcigpOiB2b2lkIHtcbiAgICB3aGlsZSAodGhpcy5sZW5ndGggPiAwKSB7XG4gICAgICB0aGlzLnJlbW92ZSh0aGlzLmxlbmd0aCAtIDEpO1xuICAgIH1cbiAgfVxuXG4gIG92ZXJyaWRlIGdldChpbmRleDogbnVtYmVyKTogVmlld1JlZnxudWxsIHtcbiAgICBjb25zdCB2aWV3UmVmcyA9IGdldFZpZXdSZWZzKHRoaXMuX2xDb250YWluZXIpO1xuICAgIHJldHVybiB2aWV3UmVmcyAhPT0gbnVsbCAmJiB2aWV3UmVmc1tpbmRleF0gfHwgbnVsbDtcbiAgfVxuXG4gIG92ZXJyaWRlIGdldCBsZW5ndGgoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fbENvbnRhaW5lci5sZW5ndGggLSBDT05UQUlORVJfSEVBREVSX09GRlNFVDtcbiAgfVxuXG4gIG92ZXJyaWRlIGNyZWF0ZUVtYmVkZGVkVmlldzxDPih0ZW1wbGF0ZVJlZjogVGVtcGxhdGVSZWY8Qz4sIGNvbnRleHQ/OiBDLCBvcHRpb25zPzoge1xuICAgIGluZGV4PzogbnVtYmVyLFxuICAgIGluamVjdG9yPzogSW5qZWN0b3JcbiAgfSk6IEVtYmVkZGVkVmlld1JlZjxDPjtcbiAgb3ZlcnJpZGUgY3JlYXRlRW1iZWRkZWRWaWV3PEM+KHRlbXBsYXRlUmVmOiBUZW1wbGF0ZVJlZjxDPiwgY29udGV4dD86IEMsIGluZGV4PzogbnVtYmVyKTpcbiAgICAgIEVtYmVkZGVkVmlld1JlZjxDPjtcbiAgb3ZlcnJpZGUgY3JlYXRlRW1iZWRkZWRWaWV3PEM+KHRlbXBsYXRlUmVmOiBUZW1wbGF0ZVJlZjxDPiwgY29udGV4dD86IEMsIGluZGV4T3JPcHRpb25zPzogbnVtYmVyfHtcbiAgICBpbmRleD86IG51bWJlcixcbiAgICBpbmplY3Rvcj86IEluamVjdG9yXG4gIH0pOiBFbWJlZGRlZFZpZXdSZWY8Qz4ge1xuICAgIGxldCBpbmRleDogbnVtYmVyfHVuZGVmaW5lZDtcbiAgICBsZXQgaW5qZWN0b3I6IEluamVjdG9yfHVuZGVmaW5lZDtcblxuICAgIGlmICh0eXBlb2YgaW5kZXhPck9wdGlvbnMgPT09ICdudW1iZXInKSB7XG4gICAgICBpbmRleCA9IGluZGV4T3JPcHRpb25zO1xuICAgIH0gZWxzZSBpZiAoaW5kZXhPck9wdGlvbnMgIT0gbnVsbCkge1xuICAgICAgaW5kZXggPSBpbmRleE9yT3B0aW9ucy5pbmRleDtcbiAgICAgIGluamVjdG9yID0gaW5kZXhPck9wdGlvbnMuaW5qZWN0b3I7XG4gICAgfVxuXG4gICAgY29uc3QgaHlkcmF0aW9uSW5mbyA9IGZpbmRNYXRjaGluZ0RlaHlkcmF0ZWRWaWV3KHRoaXMuX2xDb250YWluZXIsIHRlbXBsYXRlUmVmLnNzcklkKTtcbiAgICBjb25zdCB2aWV3UmVmID0gdGVtcGxhdGVSZWYuY3JlYXRlRW1iZWRkZWRWaWV3SW1wbChjb250ZXh0IHx8IDxhbnk+e30sIGluamVjdG9yLCBoeWRyYXRpb25JbmZvKTtcbiAgICAvLyBJZiB0aGVyZSBpcyBhIG1hdGNoaW5nIGRlaHlkcmF0ZWQgdmlldywgYnV0IHRoZSBob3N0IFROb2RlIGlzIGxvY2F0ZWQgaW4gdGhlIHNraXBcbiAgICAvLyBoeWRyYXRpb24gYmxvY2ssIHRoaXMgbWVhbnMgdGhhdCB0aGUgY29udGVudCB3YXMgZGV0YWNoZWQgKGFzIGEgcGFydCBvZiB0aGUgc2tpcFxuICAgIC8vIGh5ZHJhdGlvbiBsb2dpYykgYW5kIGl0IG5lZWRzIHRvIGJlIGFwcGVuZGVkIGludG8gdGhlIERPTS5cbiAgICBjb25zdCBza2lwRG9tSW5zZXJ0aW9uID0gISFoeWRyYXRpb25JbmZvICYmICFoYXNJblNraXBIeWRyYXRpb25CbG9ja0ZsYWcodGhpcy5faG9zdFROb2RlKTtcbiAgICB0aGlzLmluc2VydEltcGwodmlld1JlZiwgaW5kZXgsIHNraXBEb21JbnNlcnRpb24pO1xuICAgIHJldHVybiB2aWV3UmVmO1xuICB9XG5cbiAgb3ZlcnJpZGUgY3JlYXRlQ29tcG9uZW50PEM+KGNvbXBvbmVudFR5cGU6IFR5cGU8Qz4sIG9wdGlvbnM/OiB7XG4gICAgaW5kZXg/OiBudW1iZXIsXG4gICAgaW5qZWN0b3I/OiBJbmplY3RvcixcbiAgICBwcm9qZWN0YWJsZU5vZGVzPzogTm9kZVtdW10sXG4gICAgbmdNb2R1bGVSZWY/OiBOZ01vZHVsZVJlZjx1bmtub3duPixcbiAgfSk6IENvbXBvbmVudFJlZjxDPjtcbiAgLyoqXG4gICAqIEBkZXByZWNhdGVkIEFuZ3VsYXIgbm8gbG9uZ2VyIHJlcXVpcmVzIGNvbXBvbmVudCBmYWN0b3JpZXMgdG8gZHluYW1pY2FsbHkgY3JlYXRlIGNvbXBvbmVudHMuXG4gICAqICAgICBVc2UgZGlmZmVyZW50IHNpZ25hdHVyZSBvZiB0aGUgYGNyZWF0ZUNvbXBvbmVudGAgbWV0aG9kLCB3aGljaCBhbGxvd3MgcGFzc2luZ1xuICAgKiAgICAgQ29tcG9uZW50IGNsYXNzIGRpcmVjdGx5LlxuICAgKi9cbiAgb3ZlcnJpZGUgY3JlYXRlQ29tcG9uZW50PEM+KFxuICAgICAgY29tcG9uZW50RmFjdG9yeTogQ29tcG9uZW50RmFjdG9yeTxDPiwgaW5kZXg/OiBudW1iZXJ8dW5kZWZpbmVkLFxuICAgICAgaW5qZWN0b3I/OiBJbmplY3Rvcnx1bmRlZmluZWQsIHByb2plY3RhYmxlTm9kZXM/OiBhbnlbXVtdfHVuZGVmaW5lZCxcbiAgICAgIGVudmlyb25tZW50SW5qZWN0b3I/OiBFbnZpcm9ubWVudEluamVjdG9yfE5nTW9kdWxlUmVmPGFueT58dW5kZWZpbmVkKTogQ29tcG9uZW50UmVmPEM+O1xuICBvdmVycmlkZSBjcmVhdGVDb21wb25lbnQ8Qz4oXG4gICAgICBjb21wb25lbnRGYWN0b3J5T3JUeXBlOiBDb21wb25lbnRGYWN0b3J5PEM+fFR5cGU8Qz4sIGluZGV4T3JPcHRpb25zPzogbnVtYmVyfHVuZGVmaW5lZHx7XG4gICAgICAgIGluZGV4PzogbnVtYmVyLFxuICAgICAgICBpbmplY3Rvcj86IEluamVjdG9yLFxuICAgICAgICBuZ01vZHVsZVJlZj86IE5nTW9kdWxlUmVmPHVua25vd24+LFxuICAgICAgICBlbnZpcm9ubWVudEluamVjdG9yPzogRW52aXJvbm1lbnRJbmplY3RvcnxOZ01vZHVsZVJlZjx1bmtub3duPixcbiAgICAgICAgcHJvamVjdGFibGVOb2Rlcz86IE5vZGVbXVtdLFxuICAgICAgfSxcbiAgICAgIGluamVjdG9yPzogSW5qZWN0b3J8dW5kZWZpbmVkLCBwcm9qZWN0YWJsZU5vZGVzPzogYW55W11bXXx1bmRlZmluZWQsXG4gICAgICBlbnZpcm9ubWVudEluamVjdG9yPzogRW52aXJvbm1lbnRJbmplY3RvcnxOZ01vZHVsZVJlZjxhbnk+fHVuZGVmaW5lZCk6IENvbXBvbmVudFJlZjxDPiB7XG4gICAgY29uc3QgaXNDb21wb25lbnRGYWN0b3J5ID0gY29tcG9uZW50RmFjdG9yeU9yVHlwZSAmJiAhaXNUeXBlKGNvbXBvbmVudEZhY3RvcnlPclR5cGUpO1xuICAgIGxldCBpbmRleDogbnVtYmVyfHVuZGVmaW5lZDtcblxuICAgIC8vIFRoaXMgZnVuY3Rpb24gc3VwcG9ydHMgMiBzaWduYXR1cmVzIGFuZCB3ZSBuZWVkIHRvIGhhbmRsZSBvcHRpb25zIGNvcnJlY3RseSBmb3IgYm90aDpcbiAgICAvLyAgIDEuIFdoZW4gZmlyc3QgYXJndW1lbnQgaXMgYSBDb21wb25lbnQgdHlwZS4gVGhpcyBzaWduYXR1cmUgYWxzbyByZXF1aXJlcyBleHRyYVxuICAgIC8vICAgICAgb3B0aW9ucyB0byBiZSBwcm92aWRlZCBhcyBhcyBvYmplY3QgKG1vcmUgZXJnb25vbWljIG9wdGlvbikuXG4gICAgLy8gICAyLiBGaXJzdCBhcmd1bWVudCBpcyBhIENvbXBvbmVudCBmYWN0b3J5LiBJbiB0aGlzIGNhc2UgZXh0cmEgb3B0aW9ucyBhcmUgcmVwcmVzZW50ZWQgYXNcbiAgICAvLyAgICAgIHBvc2l0aW9uYWwgYXJndW1lbnRzLiBUaGlzIHNpZ25hdHVyZSBpcyBsZXNzIGVyZ29ub21pYyBhbmQgd2lsbCBiZSBkZXByZWNhdGVkLlxuICAgIGlmIChpc0NvbXBvbmVudEZhY3RvcnkpIHtcbiAgICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgICAgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICB0eXBlb2YgaW5kZXhPck9wdGlvbnMgIT09ICdvYmplY3QnLCB0cnVlLFxuICAgICAgICAgICAgJ0l0IGxvb2tzIGxpa2UgQ29tcG9uZW50IGZhY3Rvcnkgd2FzIHByb3ZpZGVkIGFzIHRoZSBmaXJzdCBhcmd1bWVudCAnICtcbiAgICAgICAgICAgICAgICAnYW5kIGFuIG9wdGlvbnMgb2JqZWN0IGFzIHRoZSBzZWNvbmQgYXJndW1lbnQuIFRoaXMgY29tYmluYXRpb24gb2YgYXJndW1lbnRzICcgK1xuICAgICAgICAgICAgICAgICdpcyBpbmNvbXBhdGlibGUuIFlvdSBjYW4gZWl0aGVyIGNoYW5nZSB0aGUgZmlyc3QgYXJndW1lbnQgdG8gcHJvdmlkZSBDb21wb25lbnQgJyArXG4gICAgICAgICAgICAgICAgJ3R5cGUgb3IgY2hhbmdlIHRoZSBzZWNvbmQgYXJndW1lbnQgdG8gYmUgYSBudW1iZXIgKHJlcHJlc2VudGluZyBhbiBpbmRleCBhdCAnICtcbiAgICAgICAgICAgICAgICAnd2hpY2ggdG8gaW5zZXJ0IHRoZSBuZXcgY29tcG9uZW50XFwncyBob3N0IHZpZXcgaW50byB0aGlzIGNvbnRhaW5lciknKTtcbiAgICAgIH1cbiAgICAgIGluZGV4ID0gaW5kZXhPck9wdGlvbnMgYXMgbnVtYmVyIHwgdW5kZWZpbmVkO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICAgIGFzc2VydERlZmluZWQoXG4gICAgICAgICAgICBnZXRDb21wb25lbnREZWYoY29tcG9uZW50RmFjdG9yeU9yVHlwZSksXG4gICAgICAgICAgICBgUHJvdmlkZWQgQ29tcG9uZW50IGNsYXNzIGRvZXNuJ3QgY29udGFpbiBDb21wb25lbnQgZGVmaW5pdGlvbi4gYCArXG4gICAgICAgICAgICAgICAgYFBsZWFzZSBjaGVjayB3aGV0aGVyIHByb3ZpZGVkIGNsYXNzIGhhcyBAQ29tcG9uZW50IGRlY29yYXRvci5gKTtcbiAgICAgICAgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICB0eXBlb2YgaW5kZXhPck9wdGlvbnMgIT09ICdudW1iZXInLCB0cnVlLFxuICAgICAgICAgICAgJ0l0IGxvb2tzIGxpa2UgQ29tcG9uZW50IHR5cGUgd2FzIHByb3ZpZGVkIGFzIHRoZSBmaXJzdCBhcmd1bWVudCAnICtcbiAgICAgICAgICAgICAgICAnYW5kIGEgbnVtYmVyIChyZXByZXNlbnRpbmcgYW4gaW5kZXggYXQgd2hpY2ggdG8gaW5zZXJ0IHRoZSBuZXcgY29tcG9uZW50XFwncyAnICtcbiAgICAgICAgICAgICAgICAnaG9zdCB2aWV3IGludG8gdGhpcyBjb250YWluZXIgYXMgdGhlIHNlY29uZCBhcmd1bWVudC4gVGhpcyBjb21iaW5hdGlvbiBvZiBhcmd1bWVudHMgJyArXG4gICAgICAgICAgICAgICAgJ2lzIGluY29tcGF0aWJsZS4gUGxlYXNlIHVzZSBhbiBvYmplY3QgYXMgdGhlIHNlY29uZCBhcmd1bWVudCBpbnN0ZWFkLicpO1xuICAgICAgfVxuICAgICAgY29uc3Qgb3B0aW9ucyA9IChpbmRleE9yT3B0aW9ucyB8fCB7fSkgYXMge1xuICAgICAgICBpbmRleD86IG51bWJlcixcbiAgICAgICAgaW5qZWN0b3I/OiBJbmplY3RvcixcbiAgICAgICAgbmdNb2R1bGVSZWY/OiBOZ01vZHVsZVJlZjx1bmtub3duPixcbiAgICAgICAgZW52aXJvbm1lbnRJbmplY3Rvcj86IEVudmlyb25tZW50SW5qZWN0b3IgfCBOZ01vZHVsZVJlZjx1bmtub3duPixcbiAgICAgICAgcHJvamVjdGFibGVOb2Rlcz86IE5vZGVbXVtdLFxuICAgICAgfTtcbiAgICAgIGlmIChuZ0Rldk1vZGUgJiYgb3B0aW9ucy5lbnZpcm9ubWVudEluamVjdG9yICYmIG9wdGlvbnMubmdNb2R1bGVSZWYpIHtcbiAgICAgICAgdGhyb3dFcnJvcihcbiAgICAgICAgICAgIGBDYW5ub3QgcGFzcyBib3RoIGVudmlyb25tZW50SW5qZWN0b3IgYW5kIG5nTW9kdWxlUmVmIG9wdGlvbnMgdG8gY3JlYXRlQ29tcG9uZW50KCkuYCk7XG4gICAgICB9XG4gICAgICBpbmRleCA9IG9wdGlvbnMuaW5kZXg7XG4gICAgICBpbmplY3RvciA9IG9wdGlvbnMuaW5qZWN0b3I7XG4gICAgICBwcm9qZWN0YWJsZU5vZGVzID0gb3B0aW9ucy5wcm9qZWN0YWJsZU5vZGVzO1xuICAgICAgZW52aXJvbm1lbnRJbmplY3RvciA9IG9wdGlvbnMuZW52aXJvbm1lbnRJbmplY3RvciB8fCBvcHRpb25zLm5nTW9kdWxlUmVmO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbXBvbmVudEZhY3Rvcnk6IENvbXBvbmVudEZhY3Rvcnk8Qz4gPSBpc0NvbXBvbmVudEZhY3RvcnkgP1xuICAgICAgICBjb21wb25lbnRGYWN0b3J5T3JUeXBlIGFzIENvbXBvbmVudEZhY3Rvcnk8Qz46XG4gICAgICAgIG5ldyBSM0NvbXBvbmVudEZhY3RvcnkoZ2V0Q29tcG9uZW50RGVmKGNvbXBvbmVudEZhY3RvcnlPclR5cGUpISk7XG4gICAgY29uc3QgY29udGV4dEluamVjdG9yID0gaW5qZWN0b3IgfHwgdGhpcy5wYXJlbnRJbmplY3RvcjtcblxuICAgIC8vIElmIGFuIGBOZ01vZHVsZVJlZmAgaXMgbm90IHByb3ZpZGVkIGV4cGxpY2l0bHksIHRyeSByZXRyaWV2aW5nIGl0IGZyb20gdGhlIERJIHRyZWUuXG4gICAgaWYgKCFlbnZpcm9ubWVudEluamVjdG9yICYmIChjb21wb25lbnRGYWN0b3J5IGFzIGFueSkubmdNb2R1bGUgPT0gbnVsbCkge1xuICAgICAgLy8gRm9yIHRoZSBgQ29tcG9uZW50RmFjdG9yeWAgY2FzZSwgZW50ZXJpbmcgdGhpcyBsb2dpYyBpcyB2ZXJ5IHVubGlrZWx5LCBzaW5jZSB3ZSBleHBlY3QgdGhhdFxuICAgICAgLy8gYW4gaW5zdGFuY2Ugb2YgYSBgQ29tcG9uZW50RmFjdG9yeWAsIHJlc29sdmVkIHZpYSBgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyYCB3b3VsZCBoYXZlIGFuXG4gICAgICAvLyBgbmdNb2R1bGVgIGZpZWxkLiBUaGlzIGlzIHBvc3NpYmxlIGluIHNvbWUgdGVzdCBzY2VuYXJpb3MgYW5kIHBvdGVudGlhbGx5IGluIHNvbWUgSklULWJhc2VkXG4gICAgICAvLyB1c2UtY2FzZXMuIEZvciB0aGUgYENvbXBvbmVudEZhY3RvcnlgIGNhc2Ugd2UgcHJlc2VydmUgYmFja3dhcmRzLWNvbXBhdGliaWxpdHkgYW5kIHRyeVxuICAgICAgLy8gdXNpbmcgYSBwcm92aWRlZCBpbmplY3RvciBmaXJzdCwgdGhlbiBmYWxsIGJhY2sgdG8gdGhlIHBhcmVudCBpbmplY3RvciBvZiB0aGlzXG4gICAgICAvLyBgVmlld0NvbnRhaW5lclJlZmAgaW5zdGFuY2UuXG4gICAgICAvL1xuICAgICAgLy8gRm9yIHRoZSBmYWN0b3J5LWxlc3MgY2FzZSwgaXQncyBjcml0aWNhbCB0byBlc3RhYmxpc2ggYSBjb25uZWN0aW9uIHdpdGggdGhlIG1vZHVsZVxuICAgICAgLy8gaW5qZWN0b3IgdHJlZSAoYnkgcmV0cmlldmluZyBhbiBpbnN0YW5jZSBvZiBhbiBgTmdNb2R1bGVSZWZgIGFuZCBhY2Nlc3NpbmcgaXRzIGluamVjdG9yKSxcbiAgICAgIC8vIHNvIHRoYXQgYSBjb21wb25lbnQgY2FuIHVzZSBESSB0b2tlbnMgcHJvdmlkZWQgaW4gTWdNb2R1bGVzLiBGb3IgdGhpcyByZWFzb24sIHdlIGNhbiBub3RcbiAgICAgIC8vIHJlbHkgb24gdGhlIHByb3ZpZGVkIGluamVjdG9yLCBzaW5jZSBpdCBtaWdodCBiZSBkZXRhY2hlZCBmcm9tIHRoZSBESSB0cmVlIChmb3IgZXhhbXBsZSwgaWZcbiAgICAgIC8vIGl0IHdhcyBjcmVhdGVkIHZpYSBgSW5qZWN0b3IuY3JlYXRlYCB3aXRob3V0IHNwZWNpZnlpbmcgYSBwYXJlbnQgaW5qZWN0b3IsIG9yIGlmIGFuXG4gICAgICAvLyBpbmplY3RvciBpcyByZXRyaWV2ZWQgZnJvbSBhbiBgTmdNb2R1bGVSZWZgIGNyZWF0ZWQgdmlhIGBjcmVhdGVOZ01vZHVsZWAgdXNpbmcgYW5cbiAgICAgIC8vIE5nTW9kdWxlIG91dHNpZGUgb2YgYSBtb2R1bGUgdHJlZSkuIEluc3RlYWQsIHdlIGFsd2F5cyB1c2UgYFZpZXdDb250YWluZXJSZWZgJ3MgcGFyZW50XG4gICAgICAvLyBpbmplY3Rvciwgd2hpY2ggaXMgbm9ybWFsbHkgY29ubmVjdGVkIHRvIHRoZSBESSB0cmVlLCB3aGljaCBpbmNsdWRlcyBtb2R1bGUgaW5qZWN0b3JcbiAgICAgIC8vIHN1YnRyZWUuXG4gICAgICBjb25zdCBfaW5qZWN0b3IgPSBpc0NvbXBvbmVudEZhY3RvcnkgPyBjb250ZXh0SW5qZWN0b3IgOiB0aGlzLnBhcmVudEluamVjdG9yO1xuXG4gICAgICAvLyBETyBOT1QgUkVGQUNUT1IuIFRoZSBjb2RlIGhlcmUgdXNlZCB0byBoYXZlIGEgYGluamVjdG9yLmdldChOZ01vZHVsZVJlZiwgbnVsbCkgfHxcbiAgICAgIC8vIHVuZGVmaW5lZGAgZXhwcmVzc2lvbiB3aGljaCBzZWVtcyB0byBjYXVzZSBpbnRlcm5hbCBnb29nbGUgYXBwcyB0byBmYWlsLiBUaGlzIGlzIGRvY3VtZW50ZWRcbiAgICAgIC8vIGluIHRoZSBmb2xsb3dpbmcgaW50ZXJuYWwgYnVnIGlzc3VlOiBnby9iLzE0Mjk2NzgwMlxuICAgICAgY29uc3QgcmVzdWx0ID0gX2luamVjdG9yLmdldChFbnZpcm9ubWVudEluamVjdG9yLCBudWxsKTtcbiAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgZW52aXJvbm1lbnRJbmplY3RvciA9IHJlc3VsdDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBjb21wb25lbnREZWYgPSBnZXRDb21wb25lbnREZWYoY29tcG9uZW50RmFjdG9yeS5jb21wb25lbnRUeXBlID8/IHt9KTtcbiAgICBjb25zdCBkZWh5ZHJhdGVkVmlldyA9IGZpbmRNYXRjaGluZ0RlaHlkcmF0ZWRWaWV3KHRoaXMuX2xDb250YWluZXIsIGNvbXBvbmVudERlZj8uaWQgPz8gbnVsbCk7XG4gICAgY29uc3Qgck5vZGUgPSBkZWh5ZHJhdGVkVmlldz8uZmlyc3RDaGlsZCA/PyBudWxsO1xuICAgIGNvbnN0IGNvbXBvbmVudFJlZiA9XG4gICAgICAgIGNvbXBvbmVudEZhY3RvcnkuY3JlYXRlKGNvbnRleHRJbmplY3RvciwgcHJvamVjdGFibGVOb2Rlcywgck5vZGUsIGVudmlyb25tZW50SW5qZWN0b3IpO1xuICAgIC8vIElmIHRoZXJlIGlzIGEgbWF0Y2hpbmcgZGVoeWRyYXRlZCB2aWV3LCBidXQgdGhlIGhvc3QgVE5vZGUgaXMgbG9jYXRlZCBpbiB0aGUgc2tpcFxuICAgIC8vIGh5ZHJhdGlvbiBibG9jaywgdGhpcyBtZWFucyB0aGF0IHRoZSBjb250ZW50IHdhcyBkZXRhY2hlZCAoYXMgYSBwYXJ0IG9mIHRoZSBza2lwXG4gICAgLy8gaHlkcmF0aW9uIGxvZ2ljKSBhbmQgaXQgbmVlZHMgdG8gYmUgYXBwZW5kZWQgaW50byB0aGUgRE9NLlxuICAgIGNvbnN0IHNraXBEb21JbnNlcnRpb24gPSAhIWRlaHlkcmF0ZWRWaWV3ICYmICFoYXNJblNraXBIeWRyYXRpb25CbG9ja0ZsYWcodGhpcy5faG9zdFROb2RlKTtcbiAgICB0aGlzLmluc2VydEltcGwoY29tcG9uZW50UmVmLmhvc3RWaWV3LCBpbmRleCwgc2tpcERvbUluc2VydGlvbik7XG4gICAgcmV0dXJuIGNvbXBvbmVudFJlZjtcbiAgfVxuXG4gIG92ZXJyaWRlIGluc2VydCh2aWV3UmVmOiBWaWV3UmVmLCBpbmRleD86IG51bWJlcik6IFZpZXdSZWYge1xuICAgIHJldHVybiB0aGlzLmluc2VydEltcGwodmlld1JlZiwgaW5kZXgsIGZhbHNlKTtcbiAgfVxuXG4gIHByaXZhdGUgaW5zZXJ0SW1wbCh2aWV3UmVmOiBWaWV3UmVmLCBpbmRleD86IG51bWJlciwgc2tpcERvbUluc2VydGlvbj86IGJvb2xlYW4pOiBWaWV3UmVmIHtcbiAgICBjb25zdCBsVmlldyA9ICh2aWV3UmVmIGFzIFIzVmlld1JlZjxhbnk+KS5fbFZpZXchO1xuICAgIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuXG4gICAgaWYgKG5nRGV2TW9kZSAmJiB2aWV3UmVmLmRlc3Ryb3llZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgaW5zZXJ0IGEgZGVzdHJveWVkIFZpZXcgaW4gYSBWaWV3Q29udGFpbmVyIScpO1xuICAgIH1cblxuICAgIGlmICh2aWV3QXR0YWNoZWRUb0NvbnRhaW5lcihsVmlldykpIHtcbiAgICAgIC8vIElmIHZpZXcgaXMgYWxyZWFkeSBhdHRhY2hlZCwgZGV0YWNoIGl0IGZpcnN0IHNvIHdlIGNsZWFuIHVwIHJlZmVyZW5jZXMgYXBwcm9wcmlhdGVseS5cblxuICAgICAgY29uc3QgcHJldklkeCA9IHRoaXMuaW5kZXhPZih2aWV3UmVmKTtcblxuICAgICAgLy8gQSB2aWV3IG1pZ2h0IGJlIGF0dGFjaGVkIGVpdGhlciB0byB0aGlzIG9yIGEgZGlmZmVyZW50IGNvbnRhaW5lci4gVGhlIGBwcmV2SWR4YCBmb3JcbiAgICAgIC8vIHRob3NlIGNhc2VzIHdpbGwgYmU6XG4gICAgICAvLyBlcXVhbCB0byAtMSBmb3Igdmlld3MgYXR0YWNoZWQgdG8gdGhpcyBWaWV3Q29udGFpbmVyUmVmXG4gICAgICAvLyA+PSAwIGZvciB2aWV3cyBhdHRhY2hlZCB0byBhIGRpZmZlcmVudCBWaWV3Q29udGFpbmVyUmVmXG4gICAgICBpZiAocHJldklkeCAhPT0gLTEpIHtcbiAgICAgICAgdGhpcy5kZXRhY2gocHJldklkeCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBwcmV2TENvbnRhaW5lciA9IGxWaWV3W1BBUkVOVF0gYXMgTENvbnRhaW5lcjtcbiAgICAgICAgbmdEZXZNb2RlICYmXG4gICAgICAgICAgICBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICBpc0xDb250YWluZXIocHJldkxDb250YWluZXIpLCB0cnVlLFxuICAgICAgICAgICAgICAgICdBbiBhdHRhY2hlZCB2aWV3IHNob3VsZCBoYXZlIGl0cyBQQVJFTlQgcG9pbnQgdG8gYSBjb250YWluZXIuJyk7XG5cblxuICAgICAgICAvLyBXZSBuZWVkIHRvIHJlLWNyZWF0ZSBhIFIzVmlld0NvbnRhaW5lclJlZiBpbnN0YW5jZSBzaW5jZSB0aG9zZSBhcmUgbm90IHN0b3JlZCBvblxuICAgICAgICAvLyBMVmlldyAobm9yIGFueXdoZXJlIGVsc2UpLlxuICAgICAgICBjb25zdCBwcmV2VkNSZWYgPSBuZXcgUjNWaWV3Q29udGFpbmVyUmVmKFxuICAgICAgICAgICAgcHJldkxDb250YWluZXIsIHByZXZMQ29udGFpbmVyW1RfSE9TVF0gYXMgVERpcmVjdGl2ZUhvc3ROb2RlLCBwcmV2TENvbnRhaW5lcltQQVJFTlRdKTtcblxuICAgICAgICBwcmV2VkNSZWYuZGV0YWNoKHByZXZWQ1JlZi5pbmRleE9mKHZpZXdSZWYpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBMb2dpY2FsIG9wZXJhdGlvbiBvZiBhZGRpbmcgYExWaWV3YCB0byBgTENvbnRhaW5lcmBcbiAgICBjb25zdCBhZGp1c3RlZElkeCA9IHRoaXMuX2FkanVzdEluZGV4KGluZGV4KTtcbiAgICBjb25zdCBsQ29udGFpbmVyID0gdGhpcy5fbENvbnRhaW5lcjtcbiAgICBpbnNlcnRWaWV3KHRWaWV3LCBsVmlldywgbENvbnRhaW5lciwgYWRqdXN0ZWRJZHgpO1xuXG4gICAgLy8gUGh5c2ljYWwgb3BlcmF0aW9uIG9mIGFkZGluZyB0aGUgRE9NIG5vZGVzLlxuICAgIGlmICghc2tpcERvbUluc2VydGlvbikge1xuICAgICAgY29uc3QgYmVmb3JlTm9kZSA9IGdldEJlZm9yZU5vZGVGb3JWaWV3KGFkanVzdGVkSWR4LCBsQ29udGFpbmVyKTtcbiAgICAgIGNvbnN0IHJlbmRlcmVyID0gbFZpZXdbUkVOREVSRVJdO1xuICAgICAgY29uc3QgcGFyZW50Uk5vZGUgPSBuYXRpdmVQYXJlbnROb2RlKHJlbmRlcmVyLCBsQ29udGFpbmVyW05BVElWRV0gYXMgUkVsZW1lbnQgfCBSQ29tbWVudCk7XG4gICAgICBpZiAocGFyZW50Uk5vZGUgIT09IG51bGwpIHtcbiAgICAgICAgYWRkVmlld1RvQ29udGFpbmVyKHRWaWV3LCBsQ29udGFpbmVyW1RfSE9TVF0sIHJlbmRlcmVyLCBsVmlldywgcGFyZW50Uk5vZGUsIGJlZm9yZU5vZGUpO1xuICAgICAgfVxuICAgIH1cblxuICAgICh2aWV3UmVmIGFzIFIzVmlld1JlZjxhbnk+KS5hdHRhY2hUb1ZpZXdDb250YWluZXJSZWYoKTtcbiAgICBhZGRUb0FycmF5KGdldE9yQ3JlYXRlVmlld1JlZnMobENvbnRhaW5lciksIGFkanVzdGVkSWR4LCB2aWV3UmVmKTtcblxuICAgIHJldHVybiB2aWV3UmVmO1xuICB9XG5cbiAgb3ZlcnJpZGUgbW92ZSh2aWV3UmVmOiBWaWV3UmVmLCBuZXdJbmRleDogbnVtYmVyKTogVmlld1JlZiB7XG4gICAgaWYgKG5nRGV2TW9kZSAmJiB2aWV3UmVmLmRlc3Ryb3llZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgbW92ZSBhIGRlc3Ryb3llZCBWaWV3IGluIGEgVmlld0NvbnRhaW5lciEnKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuaW5zZXJ0KHZpZXdSZWYsIG5ld0luZGV4KTtcbiAgfVxuXG4gIG92ZXJyaWRlIGluZGV4T2Yodmlld1JlZjogVmlld1JlZik6IG51bWJlciB7XG4gICAgY29uc3Qgdmlld1JlZnNBcnIgPSBnZXRWaWV3UmVmcyh0aGlzLl9sQ29udGFpbmVyKTtcbiAgICByZXR1cm4gdmlld1JlZnNBcnIgIT09IG51bGwgPyB2aWV3UmVmc0Fyci5pbmRleE9mKHZpZXdSZWYpIDogLTE7XG4gIH1cblxuICBvdmVycmlkZSByZW1vdmUoaW5kZXg/OiBudW1iZXIpOiB2b2lkIHtcbiAgICBjb25zdCBhZGp1c3RlZElkeCA9IHRoaXMuX2FkanVzdEluZGV4KGluZGV4LCAtMSk7XG4gICAgY29uc3QgZGV0YWNoZWRWaWV3ID0gZGV0YWNoVmlldyh0aGlzLl9sQ29udGFpbmVyLCBhZGp1c3RlZElkeCk7XG5cbiAgICBpZiAoZGV0YWNoZWRWaWV3KSB7XG4gICAgICAvLyBCZWZvcmUgZGVzdHJveWluZyB0aGUgdmlldywgcmVtb3ZlIGl0IGZyb20gdGhlIGNvbnRhaW5lcidzIGFycmF5IG9mIGBWaWV3UmVmYHMuXG4gICAgICAvLyBUaGlzIGVuc3VyZXMgdGhlIHZpZXcgY29udGFpbmVyIGxlbmd0aCBpcyB1cGRhdGVkIGJlZm9yZSBjYWxsaW5nXG4gICAgICAvLyBgZGVzdHJveUxWaWV3YCwgd2hpY2ggY291bGQgcmVjdXJzaXZlbHkgY2FsbCB2aWV3IGNvbnRhaW5lciBtZXRob2RzIHRoYXRcbiAgICAgIC8vIHJlbHkgb24gYW4gYWNjdXJhdGUgY29udGFpbmVyIGxlbmd0aC5cbiAgICAgIC8vIChlLmcuIGEgbWV0aG9kIG9uIHRoaXMgdmlldyBjb250YWluZXIgYmVpbmcgY2FsbGVkIGJ5IGEgY2hpbGQgZGlyZWN0aXZlJ3MgT25EZXN0cm95XG4gICAgICAvLyBsaWZlY3ljbGUgaG9vaylcbiAgICAgIHJlbW92ZUZyb21BcnJheShnZXRPckNyZWF0ZVZpZXdSZWZzKHRoaXMuX2xDb250YWluZXIpLCBhZGp1c3RlZElkeCk7XG4gICAgICBkZXN0cm95TFZpZXcoZGV0YWNoZWRWaWV3W1RWSUVXXSwgZGV0YWNoZWRWaWV3KTtcbiAgICB9XG4gIH1cblxuICBvdmVycmlkZSBkZXRhY2goaW5kZXg/OiBudW1iZXIpOiBWaWV3UmVmfG51bGwge1xuICAgIGNvbnN0IGFkanVzdGVkSWR4ID0gdGhpcy5fYWRqdXN0SW5kZXgoaW5kZXgsIC0xKTtcbiAgICBjb25zdCB2aWV3ID0gZGV0YWNoVmlldyh0aGlzLl9sQ29udGFpbmVyLCBhZGp1c3RlZElkeCk7XG5cbiAgICBjb25zdCB3YXNEZXRhY2hlZCA9XG4gICAgICAgIHZpZXcgJiYgcmVtb3ZlRnJvbUFycmF5KGdldE9yQ3JlYXRlVmlld1JlZnModGhpcy5fbENvbnRhaW5lciksIGFkanVzdGVkSWR4KSAhPSBudWxsO1xuICAgIHJldHVybiB3YXNEZXRhY2hlZCA/IG5ldyBSM1ZpZXdSZWYodmlldyEpIDogbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgX2FkanVzdEluZGV4KGluZGV4PzogbnVtYmVyLCBzaGlmdDogbnVtYmVyID0gMCkge1xuICAgIGlmIChpbmRleCA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gdGhpcy5sZW5ndGggKyBzaGlmdDtcbiAgICB9XG4gICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgYXNzZXJ0R3JlYXRlclRoYW4oaW5kZXgsIC0xLCBgVmlld1JlZiBpbmRleCBtdXN0IGJlIHBvc2l0aXZlLCBnb3QgJHtpbmRleH1gKTtcbiAgICAgIC8vICsxIGJlY2F1c2UgaXQncyBsZWdhbCB0byBpbnNlcnQgYXQgdGhlIGVuZC5cbiAgICAgIGFzc2VydExlc3NUaGFuKGluZGV4LCB0aGlzLmxlbmd0aCArIDEgKyBzaGlmdCwgJ2luZGV4Jyk7XG4gICAgfVxuICAgIHJldHVybiBpbmRleDtcbiAgfVxufTtcblxuZnVuY3Rpb24gZ2V0Vmlld1JlZnMobENvbnRhaW5lcjogTENvbnRhaW5lcik6IFZpZXdSZWZbXXxudWxsIHtcbiAgcmV0dXJuIGxDb250YWluZXJbVklFV19SRUZTXSBhcyBWaWV3UmVmW107XG59XG5cbmZ1bmN0aW9uIGdldE9yQ3JlYXRlVmlld1JlZnMobENvbnRhaW5lcjogTENvbnRhaW5lcik6IFZpZXdSZWZbXSB7XG4gIHJldHVybiAobENvbnRhaW5lcltWSUVXX1JFRlNdIHx8IChsQ29udGFpbmVyW1ZJRVdfUkVGU10gPSBbXSkpIGFzIFZpZXdSZWZbXTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgVmlld0NvbnRhaW5lclJlZiBhbmQgc3RvcmVzIGl0IG9uIHRoZSBpbmplY3Rvci5cbiAqXG4gKiBAcGFyYW0gaG9zdFROb2RlIFRoZSBub2RlIHRoYXQgaXMgcmVxdWVzdGluZyBhIFZpZXdDb250YWluZXJSZWZcbiAqIEBwYXJhbSBob3N0TFZpZXcgVGhlIHZpZXcgdG8gd2hpY2ggdGhlIG5vZGUgYmVsb25nc1xuICogQHJldHVybnMgVGhlIFZpZXdDb250YWluZXJSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVDb250YWluZXJSZWYoXG4gICAgaG9zdFROb2RlOiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlLFxuICAgIGhvc3RMVmlldzogTFZpZXcpOiBWaWV3Q29udGFpbmVyUmVmIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydFROb2RlVHlwZShob3N0VE5vZGUsIFROb2RlVHlwZS5BbnlDb250YWluZXIgfCBUTm9kZVR5cGUuQW55Uk5vZGUpO1xuXG4gIGxldCBsQ29udGFpbmVyOiBMQ29udGFpbmVyO1xuICBjb25zdCBzbG90VmFsdWUgPSBob3N0TFZpZXdbaG9zdFROb2RlLmluZGV4XTtcbiAgaWYgKGlzTENvbnRhaW5lcihzbG90VmFsdWUpKSB7XG4gICAgLy8gSWYgdGhlIGhvc3QgaXMgYSBjb250YWluZXIsIHdlIGRvbid0IG5lZWQgdG8gY3JlYXRlIGEgbmV3IExDb250YWluZXJcbiAgICBsQ29udGFpbmVyID0gc2xvdFZhbHVlO1xuICB9IGVsc2Uge1xuICAgIC8vIEFuIExDb250YWluZXIgYW5jaG9yIGNhbiBub3QgYmUgYG51bGxgLCBidXQgd2Ugc2V0IGl0IGhlcmUgdGVtcG9yYXJpbHlcbiAgICAvLyBhbmQgdXBkYXRlIHRvIHRoZSBhY3R1YWwgdmFsdWUgbGF0ZXIgaW4gdGhpcyBmdW5jdGlvbiAoc2VlXG4gICAgLy8gYF9sb2NhdGVPckNyZWF0ZUFuY2hvck5vZGVgKS5cbiAgICBsQ29udGFpbmVyID0gY3JlYXRlTENvbnRhaW5lcihzbG90VmFsdWUsIGhvc3RMVmlldywgbnVsbCEsIGhvc3RUTm9kZSk7XG4gICAgaG9zdExWaWV3W2hvc3RUTm9kZS5pbmRleF0gPSBsQ29udGFpbmVyO1xuICAgIGFkZFRvVmlld1RyZWUoaG9zdExWaWV3LCBsQ29udGFpbmVyKTtcbiAgfVxuICBfbG9jYXRlT3JDcmVhdGVBbmNob3JOb2RlKGxDb250YWluZXIsIGhvc3RMVmlldywgaG9zdFROb2RlLCBzbG90VmFsdWUpO1xuXG4gIHJldHVybiBuZXcgUjNWaWV3Q29udGFpbmVyUmVmKGxDb250YWluZXIsIGhvc3RUTm9kZSwgaG9zdExWaWV3KTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuZCBpbnNlcnRzIGEgY29tbWVudCBub2RlIHRoYXQgYWN0cyBhcyBhbiBhbmNob3IgZm9yIGEgdmlldyBjb250YWluZXIuXG4gKlxuICogSWYgdGhlIGhvc3QgaXMgYSByZWd1bGFyIGVsZW1lbnQsIHdlIGhhdmUgdG8gaW5zZXJ0IGEgY29tbWVudCBub2RlIG1hbnVhbGx5IHdoaWNoIHdpbGxcbiAqIGJlIHVzZWQgYXMgYW4gYW5jaG9yIHdoZW4gaW5zZXJ0aW5nIGVsZW1lbnRzLiBJbiB0aGlzIHNwZWNpZmljIGNhc2Ugd2UgdXNlIGxvdy1sZXZlbCBET01cbiAqIG1hbmlwdWxhdGlvbiB0byBpbnNlcnQgaXQuXG4gKi9cbmZ1bmN0aW9uIGluc2VydEFuY2hvck5vZGUoaG9zdExWaWV3OiBMVmlldywgaG9zdFROb2RlOiBUTm9kZSk6IFJDb21tZW50IHtcbiAgY29uc3QgcmVuZGVyZXIgPSBob3N0TFZpZXdbUkVOREVSRVJdO1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQ3JlYXRlQ29tbWVudCsrO1xuICBjb25zdCBjb21tZW50Tm9kZSA9IHJlbmRlcmVyLmNyZWF0ZUNvbW1lbnQobmdEZXZNb2RlID8gJ2NvbnRhaW5lcicgOiAnJyk7XG5cbiAgY29uc3QgaG9zdE5hdGl2ZSA9IGdldE5hdGl2ZUJ5VE5vZGUoaG9zdFROb2RlLCBob3N0TFZpZXcpITtcbiAgY29uc3QgcGFyZW50T2ZIb3N0TmF0aXZlID0gbmF0aXZlUGFyZW50Tm9kZShyZW5kZXJlciwgaG9zdE5hdGl2ZSk7XG4gIG5hdGl2ZUluc2VydEJlZm9yZShcbiAgICAgIHJlbmRlcmVyLCBwYXJlbnRPZkhvc3ROYXRpdmUhLCBjb21tZW50Tm9kZSwgbmF0aXZlTmV4dFNpYmxpbmcocmVuZGVyZXIsIGhvc3ROYXRpdmUpLCBmYWxzZSk7XG4gIHJldHVybiBjb21tZW50Tm9kZTtcbn1cblxubGV0IF9sb2NhdGVPckNyZWF0ZUFuY2hvck5vZGUgPSBjcmVhdGVBbmNob3JOb2RlO1xuXG4vKipcbiAqIFJlZ3VsYXIgY3JlYXRpb24gbW9kZTogYW4gYW5jaG9yIGlzIGNyZWF0ZWQgYW5kXG4gKiBhc3NpZ25lZCB0byB0aGUgYGxDb250YWluZXJbTkFUSVZFXWAgc2xvdC5cbiAqL1xuZnVuY3Rpb24gY3JlYXRlQW5jaG9yTm9kZShcbiAgICBsQ29udGFpbmVyOiBMQ29udGFpbmVyLCBob3N0TFZpZXc6IExWaWV3LCBob3N0VE5vZGU6IFROb2RlLCBzbG90VmFsdWU6IGFueSkge1xuICAvLyBXZSBhbHJlYWR5IGhhdmUgYSBuYXRpdmUgZWxlbWVudCAoYW5jaG9yKSBzZXQsIHJldHVybi5cbiAgaWYgKGxDb250YWluZXJbTkFUSVZFXSkgcmV0dXJuO1xuXG4gIGxldCBjb21tZW50Tm9kZTogUkNvbW1lbnQ7XG4gIC8vIElmIHRoZSBob3N0IGlzIGFuIGVsZW1lbnQgY29udGFpbmVyLCB0aGUgbmF0aXZlIGhvc3QgZWxlbWVudCBpcyBndWFyYW50ZWVkIHRvIGJlIGFcbiAgLy8gY29tbWVudCBhbmQgd2UgY2FuIHJldXNlIHRoYXQgY29tbWVudCBhcyBhbmNob3IgZWxlbWVudCBmb3IgdGhlIG5ldyBMQ29udGFpbmVyLlxuICAvLyBUaGUgY29tbWVudCBub2RlIGluIHF1ZXN0aW9uIGlzIGFscmVhZHkgcGFydCBvZiB0aGUgRE9NIHN0cnVjdHVyZSBzbyB3ZSBkb24ndCBuZWVkIHRvIGFwcGVuZFxuICAvLyBpdCBhZ2Fpbi5cbiAgaWYgKGhvc3RUTm9kZS50eXBlICYgVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpIHtcbiAgICBjb21tZW50Tm9kZSA9IHVud3JhcFJOb2RlKHNsb3RWYWx1ZSkgYXMgUkNvbW1lbnQ7XG4gIH0gZWxzZSB7XG4gICAgY29tbWVudE5vZGUgPSBpbnNlcnRBbmNob3JOb2RlKGhvc3RMVmlldywgaG9zdFROb2RlKTtcbiAgfVxuICBsQ29udGFpbmVyW05BVElWRV0gPSBjb21tZW50Tm9kZTtcbn1cblxuLyoqXG4gKiBIeWRyYXRpb24gbG9naWMgdGhhdCBsb29rcyB1cDpcbiAqICAtIGFuIGFuY2hvciBub2RlIGluIHRoZSBET00gYW5kIHN0b3JlcyB0aGUgbm9kZSBpbiBgbENvbnRhaW5lcltOQVRJVkVdYFxuICogIC0gYWxsIGRlaHlkcmF0ZWQgdmlld3MgaW4gdGhpcyBjb250YWluZXIgYW5kIHB1dHMgdGhlbSBpbnRvIGBsQ29udGFpbmVyW0RFSFlEUkFURURfVklFV1NdYFxuICovXG5mdW5jdGlvbiBsb2NhdGVPckNyZWF0ZUFuY2hvck5vZGUoXG4gICAgbENvbnRhaW5lcjogTENvbnRhaW5lciwgaG9zdExWaWV3OiBMVmlldywgaG9zdFROb2RlOiBUTm9kZSwgc2xvdFZhbHVlOiBhbnkpIHtcbiAgLy8gV2UgYWxyZWFkeSBoYXZlIGEgbmF0aXZlIGVsZW1lbnQgKGFuY2hvcikgc2V0IGFuZCB0aGUgcHJvY2Vzc1xuICAvLyBvZiBmaW5kaW5nIGRlaHlkcmF0ZWQgdmlld3MgaGFwcGVuZWQgKHNvIHRoZSBgbENvbnRhaW5lcltERUhZRFJBVEVEX1ZJRVdTXWBcbiAgLy8gaXMgbm90IG51bGwpLCBleGl0IGVhcmx5LlxuICBpZiAobENvbnRhaW5lcltOQVRJVkVdICYmIGxDb250YWluZXJbREVIWURSQVRFRF9WSUVXU10pIHJldHVybjtcblxuICBjb25zdCBoeWRyYXRpb25JbmZvID0gaG9zdExWaWV3W0hZRFJBVElPTl07XG4gIGNvbnN0IG5vT2Zmc2V0SW5kZXggPSBob3N0VE5vZGUuaW5kZXggLSBIRUFERVJfT0ZGU0VUO1xuXG4gIC8vIFRPRE8oYWt1c2huaXIpOiB0aGlzIHNob3VsZCByZWFsbHkgYmUgYSBzaW5nbGUgY29uZGl0aW9uLCByZWZhY3RvciB0aGUgY29kZVxuICAvLyB0byB1c2UgYGhhc0luU2tpcEh5ZHJhdGlvbkJsb2NrRmxhZ2AgbG9naWMgaW5zaWRlIGBpc0luU2tpcEh5ZHJhdGlvbkJsb2NrYC5cbiAgY29uc3Qgc2tpcEh5ZHJhdGlvbiA9IGlzSW5Ta2lwSHlkcmF0aW9uQmxvY2soaG9zdFROb2RlKSB8fCBoYXNJblNraXBIeWRyYXRpb25CbG9ja0ZsYWcoaG9zdFROb2RlKTtcblxuICBjb25zdCBpc05vZGVDcmVhdGlvbk1vZGUgPVxuICAgICAgIWh5ZHJhdGlvbkluZm8gfHwgc2tpcEh5ZHJhdGlvbiB8fCBpc0Rpc2Nvbm5lY3RlZE5vZGUoaHlkcmF0aW9uSW5mbywgbm9PZmZzZXRJbmRleCk7XG5cbiAgLy8gUmVndWxhciBjcmVhdGlvbiBtb2RlLlxuICBpZiAoaXNOb2RlQ3JlYXRpb25Nb2RlKSB7XG4gICAgcmV0dXJuIGNyZWF0ZUFuY2hvck5vZGUobENvbnRhaW5lciwgaG9zdExWaWV3LCBob3N0VE5vZGUsIHNsb3RWYWx1ZSk7XG4gIH1cblxuICAvLyBIeWRyYXRpb24gbW9kZSwgbG9va2luZyB1cCBhbiBhbmNob3Igbm9kZSBhbmQgZGVoeWRyYXRlZCB2aWV3cyBpbiBET00uXG4gIGNvbnN0IGN1cnJlbnRSTm9kZTogUk5vZGV8bnVsbCA9IGdldFNlZ21lbnRIZWFkKGh5ZHJhdGlvbkluZm8sIG5vT2Zmc2V0SW5kZXgpO1xuXG4gIGNvbnN0IHNlcmlhbGl6ZWRWaWV3cyA9IGh5ZHJhdGlvbkluZm8uZGF0YVtDT05UQUlORVJTXT8uW25vT2Zmc2V0SW5kZXhdO1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydERlZmluZWQoXG4gICAgICAgICAgc2VyaWFsaXplZFZpZXdzLFxuICAgICAgICAgICdVbmV4cGVjdGVkIHN0YXRlOiBubyBoeWRyYXRpb24gaW5mbyBhdmFpbGFibGUgZm9yIGEgZ2l2ZW4gVE5vZGUsICcgK1xuICAgICAgICAgICAgICAnd2hpY2ggcmVwcmVzZW50cyBhIHZpZXcgY29udGFpbmVyLicpO1xuXG4gIGNvbnN0IFtjb21tZW50Tm9kZSwgZGVoeWRyYXRlZFZpZXdzXSA9XG4gICAgICBsb2NhdGVEZWh5ZHJhdGVkVmlld3NJbkNvbnRhaW5lcihjdXJyZW50Uk5vZGUhLCBzZXJpYWxpemVkVmlld3MhKTtcblxuICBpZiAobmdEZXZNb2RlKSB7XG4gICAgdmFsaWRhdGVNYXRjaGluZ05vZGUoY29tbWVudE5vZGUsIE5vZGUuQ09NTUVOVF9OT0RFLCBudWxsLCBob3N0TFZpZXcsIGhvc3RUTm9kZSwgdHJ1ZSk7XG4gICAgLy8gRG8gbm90IHRocm93IGluIGNhc2UgdGhpcyBub2RlIGlzIGFscmVhZHkgY2xhaW1lZCAodGh1cyBgZmFsc2VgIGFzIGEgc2Vjb25kXG4gICAgLy8gYXJndW1lbnQpLiBJZiB0aGlzIGNvbnRhaW5lciBpcyBjcmVhdGVkIGJhc2VkIG9uIGFuIGA8bmctdGVtcGxhdGU+YCwgdGhlIGNvbW1lbnRcbiAgICAvLyBub2RlIHdvdWxkIGJlIGFscmVhZHkgY2xhaW1lZCBmcm9tIHRoZSBgdGVtcGxhdGVgIGluc3RydWN0aW9uLiBJZiBhbiBlbGVtZW50IGFjdHNcbiAgICAvLyBhcyBhbiBhbmNob3IgKGUuZy4gPGRpdiAjdmNSZWY+KSwgYSBzZXBhcmF0ZSBjb21tZW50IG5vZGUgd291bGQgYmUgY3JlYXRlZC9sb2NhdGVkLFxuICAgIC8vIHNvIHdlIG5lZWQgdG8gY2xhaW0gaXQgaGVyZS5cbiAgICBtYXJrUk5vZGVBc0NsYWltZWRCeUh5ZHJhdGlvbihjb21tZW50Tm9kZSwgZmFsc2UpO1xuICB9XG5cbiAgbENvbnRhaW5lcltOQVRJVkVdID0gY29tbWVudE5vZGUgYXMgUkNvbW1lbnQ7XG4gIGxDb250YWluZXJbREVIWURSQVRFRF9WSUVXU10gPSBkZWh5ZHJhdGVkVmlld3M7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbmFibGVMb2NhdGVPckNyZWF0ZUNvbnRhaW5lclJlZkltcGwoKSB7XG4gIF9sb2NhdGVPckNyZWF0ZUFuY2hvck5vZGUgPSBsb2NhdGVPckNyZWF0ZUFuY2hvck5vZGU7XG59XG4iXX0=