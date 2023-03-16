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
import { isInSkipHydrationBlock } from '../hydration/skip_hydration';
import { getSegmentHead, markRNodeAsClaimedByHydration } from '../hydration/utils';
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
 * creating a [view hierarchy](guide/glossary#view-tree).
 *
 * @see `ComponentRef`
 * @see `EmbeddedViewRef`
 *
 * @publicApi
 */
class ViewContainerRef {
}
/**
 * @internal
 * @nocollapse
 */
ViewContainerRef.__NG_ELEMENT_ID__ = injectViewContainerRef;
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
        this.insertImpl(viewRef, index, !!hydrationInfo);
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
        this.insertImpl(componentRef.hostView, index, !!dehydratedView);
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
    const isNodeCreationMode = !hydrationInfo || isInSkipHydrationBlock(hostTNode);
    // Regular creation mode.
    if (isNodeCreationMode) {
        return createAnchorNode(lContainer, hostLView, hostTNode, slotValue);
    }
    // Hydration mode, looking up an anchor node and dehydrated views in DOM.
    const index = hostTNode.index - HEADER_OFFSET;
    const currentRNode = getSegmentHead(hydrationInfo, index);
    const serializedViews = hydrationInfo.data[CONTAINERS]?.[index];
    ngDevMode &&
        assertDefined(serializedViews, 'Unexpected state: no hydration info available for a given TNode, ' +
            'which represents a view container.');
    const [commentNode, dehydratedViews] = locateDehydratedViewsInContainer(currentRNode, serializedViews);
    if (ngDevMode) {
        validateMatchingNode(commentNode, Node.COMMENT_NODE, null, hostLView, hostTNode);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld19jb250YWluZXJfcmVmLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvbGlua2VyL3ZpZXdfY29udGFpbmVyX3JlZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFHSCxPQUFPLEVBQUMsbUJBQW1CLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUN0RCxPQUFPLEVBQUMsb0JBQW9CLEVBQUMsTUFBTSw2QkFBNkIsQ0FBQztBQUNqRSxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFDbkQsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0sNkJBQTZCLENBQUM7QUFDbkUsT0FBTyxFQUFDLGNBQWMsRUFBRSw2QkFBNkIsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQ2pGLE9BQU8sRUFBQywwQkFBMEIsRUFBRSxnQ0FBZ0MsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQ2hHLE9BQU8sRUFBQyxNQUFNLEVBQU8sTUFBTSxtQkFBbUIsQ0FBQztBQUMvQyxPQUFPLEVBQUMsa0JBQWtCLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNyRCxPQUFPLEVBQUMsZ0JBQWdCLElBQUksa0JBQWtCLEVBQUMsTUFBTSwwQkFBMEIsQ0FBQztBQUNoRixPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDdEQsT0FBTyxFQUFDLHlCQUF5QixFQUFFLFlBQVksRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUN0RSxPQUFPLEVBQUMsYUFBYSxFQUFFLGdCQUFnQixFQUFDLE1BQU0sZ0NBQWdDLENBQUM7QUFDL0UsT0FBTyxFQUFDLHVCQUF1QixFQUFFLGdCQUFnQixFQUFjLE1BQU0sRUFBRSxTQUFTLEVBQUMsTUFBTSxpQ0FBaUMsQ0FBQztBQUl6SCxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sbUNBQW1DLENBQUM7QUFDL0QsT0FBTyxFQUFD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biAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi4vZGkvaW5qZWN0b3InO1xuaW1wb3J0IHtFbnZpcm9ubWVudEluamVjdG9yfSBmcm9tICcuLi9kaS9yM19pbmplY3Rvcic7XG5pbXBvcnQge3ZhbGlkYXRlTWF0Y2hpbmdOb2RlfSBmcm9tICcuLi9oeWRyYXRpb24vZXJyb3JfaGFuZGxpbmcnO1xuaW1wb3J0IHtDT05UQUlORVJTfSBmcm9tICcuLi9oeWRyYXRpb24vaW50ZXJmYWNlcyc7XG5pbXBvcnQge2lzSW5Ta2lwSHlkcmF0aW9uQmxvY2t9IGZyb20gJy4uL2h5ZHJhdGlvbi9za2lwX2h5ZHJhdGlvbic7XG5pbXBvcnQge2dldFNlZ21lbnRIZWFkLCBtYXJrUk5vZGVBc0NsYWltZWRCeUh5ZHJhdGlvbn0gZnJvbSAnLi4vaHlkcmF0aW9uL3V0aWxzJztcbmltcG9ydCB7ZmluZE1hdGNoaW5nRGVoeWRyYXRlZFZpZXcsIGxvY2F0ZURlaHlkcmF0ZWRWaWV3c0luQ29udGFpbmVyfSBmcm9tICcuLi9oeWRyYXRpb24vdmlld3MnO1xuaW1wb3J0IHtpc1R5cGUsIFR5cGV9IGZyb20gJy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7YXNzZXJ0Tm9kZUluamVjdG9yfSBmcm9tICcuLi9yZW5kZXIzL2Fzc2VydCc7XG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnkgYXMgUjNDb21wb25lbnRGYWN0b3J5fSBmcm9tICcuLi9yZW5kZXIzL2NvbXBvbmVudF9yZWYnO1xuaW1wb3J0IHtnZXRDb21wb25lbnREZWZ9IGZyb20gJy4uL3JlbmRlcjMvZGVmaW5pdGlvbic7XG5pbXBvcnQge2dldFBhcmVudEluamVjdG9yTG9jYXRpb24sIE5vZGVJbmplY3Rvcn0gZnJvbSAnLi4vcmVuZGVyMy9kaSc7XG5pbXBvcnQge2FkZFRvVmlld1RyZWUsIGNyZWF0ZUxDb250YWluZXJ9IGZyb20gJy4uL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL3NoYXJlZCc7XG5pbXBvcnQge0NPTlRBSU5FUl9IRUFERVJfT0ZGU0VULCBERUhZRFJBVEVEX1ZJRVdTLCBMQ29udGFpbmVyLCBOQVRJVkUsIFZJRVdfUkVGU30gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge05vZGVJbmplY3Rvck9mZnNldH0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL2luamVjdG9yJztcbmltcG9ydCB7VENvbnRhaW5lck5vZGUsIFREaXJlY3RpdmVIb3N0Tm9kZSwgVEVsZW1lbnRDb250YWluZXJOb2RlLCBURWxlbWVudE5vZGUsIFROb2RlLCBUTm9kZVR5cGV9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7UkNvbW1lbnQsIFJFbGVtZW50LCBSTm9kZX0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3JlbmRlcmVyX2RvbSc7XG5pbXBvcnQge2lzTENvbnRhaW5lcn0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3R5cGVfY2hlY2tzJztcbmltcG9ydCB7SEVBREVSX09GRlNFVCwgSFlEUkFUSU9OLCBMVmlldywgUEFSRU5ULCBSRU5ERVJFUiwgVF9IT1NULCBUVklFV30gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHthc3NlcnRUTm9kZVR5cGV9IGZyb20gJy4uL3JlbmRlcjMvbm9kZV9hc3NlcnQnO1xuaW1wb3J0IHthZGRWaWV3VG9Db250YWluZXIsIGRlc3Ryb3lMVmlldywgZGV0YWNoVmlldywgZ2V0QmVmb3JlTm9kZUZvclZpZXcsIGluc2VydFZpZXcsIG5hdGl2ZUluc2VydEJlZm9yZSwgbmF0aXZlTmV4dFNpYmxpbmcsIG5hdGl2ZVBhcmVudE5vZGV9IGZyb20gJy4uL3JlbmRlcjMvbm9kZV9tYW5pcHVsYXRpb24nO1xuaW1wb3J0IHtnZXRDdXJyZW50VE5vZGUsIGdldExWaWV3fSBmcm9tICcuLi9yZW5kZXIzL3N0YXRlJztcbmltcG9ydCB7Z2V0UGFyZW50SW5qZWN0b3JJbmRleCwgZ2V0UGFyZW50SW5qZWN0b3JWaWV3LCBoYXNQYXJlbnRJbmplY3Rvcn0gZnJvbSAnLi4vcmVuZGVyMy91dGlsL2luamVjdG9yX3V0aWxzJztcbmltcG9ydCB7Z2V0TmF0aXZlQnlUTm9kZSwgdW53cmFwUk5vZGUsIHZpZXdBdHRhY2hlZFRvQ29udGFpbmVyfSBmcm9tICcuLi9yZW5kZXIzL3V0aWwvdmlld191dGlscyc7XG5pbXBvcnQge1ZpZXdSZWYgYXMgUjNWaWV3UmVmfSBmcm9tICcuLi9yZW5kZXIzL3ZpZXdfcmVmJztcbmltcG9ydCB7YWRkVG9BcnJheSwgcmVtb3ZlRnJvbUFycmF5fSBmcm9tICcuLi91dGlsL2FycmF5X3V0aWxzJztcbmltcG9ydCB7YXNzZXJ0RGVmaW5lZCwgYXNzZXJ0RXF1YWwsIGFzc2VydEdyZWF0ZXJUaGFuLCBhc3NlcnRMZXNzVGhhbiwgdGhyb3dFcnJvcn0gZnJvbSAnLi4vdXRpbC9hc3NlcnQnO1xuXG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnksIENvbXBvbmVudFJlZn0gZnJvbSAnLi9jb21wb25lbnRfZmFjdG9yeSc7XG5pbXBvcnQge2NyZWF0ZUVsZW1lbnRSZWYsIEVsZW1lbnRSZWZ9IGZyb20gJy4vZWxlbWVudF9yZWYnO1xuaW1wb3J0IHtOZ01vZHVsZVJlZn0gZnJvbSAnLi9uZ19tb2R1bGVfZmFjdG9yeSc7XG5pbXBvcnQge1RlbXBsYXRlUmVmfSBmcm9tICcuL3RlbXBsYXRlX3JlZic7XG5pbXBvcnQge0VtYmVkZGVkVmlld1JlZiwgVmlld1JlZn0gZnJvbSAnLi92aWV3X3JlZic7XG5cbi8qKlxuICogUmVwcmVzZW50cyBhIGNvbnRhaW5lciB3aGVyZSBvbmUgb3IgbW9yZSB2aWV3cyBjYW4gYmUgYXR0YWNoZWQgdG8gYSBjb21wb25lbnQuXG4gKlxuICogQ2FuIGNvbnRhaW4gKmhvc3Qgdmlld3MqIChjcmVhdGVkIGJ5IGluc3RhbnRpYXRpbmcgYVxuICogY29tcG9uZW50IHdpdGggdGhlIGBjcmVhdGVDb21wb25lbnQoKWAgbWV0aG9kKSwgYW5kICplbWJlZGRlZCB2aWV3cypcbiAqIChjcmVhdGVkIGJ5IGluc3RhbnRpYXRpbmcgYSBgVGVtcGxhdGVSZWZgIHdpdGggdGhlIGBjcmVhdGVFbWJlZGRlZFZpZXcoKWAgbWV0aG9kKS5cbiAqXG4gKiBBIHZpZXcgY29udGFpbmVyIGluc3RhbmNlIGNhbiBjb250YWluIG90aGVyIHZpZXcgY29udGFpbmVycyxcbiAqIGNyZWF0aW5nIGEgW3ZpZXcgaGllcmFyY2h5XShndWlkZS9nbG9zc2FyeSN2aWV3LXRyZWUpLlxuICpcbiAqIEBzZWUgYENvbXBvbmVudFJlZmBcbiAqIEBzZWUgYEVtYmVkZGVkVmlld1JlZmBcbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBWaWV3Q29udGFpbmVyUmVmIHtcbiAgLyoqXG4gICAqIEFuY2hvciBlbGVtZW50IHRoYXQgc3BlY2lmaWVzIHRoZSBsb2NhdGlvbiBvZiB0aGlzIGNvbnRhaW5lciBpbiB0aGUgY29udGFpbmluZyB2aWV3LlxuICAgKiBFYWNoIHZpZXcgY29udGFpbmVyIGNhbiBoYXZlIG9ubHkgb25lIGFuY2hvciBlbGVtZW50LCBhbmQgZWFjaCBhbmNob3IgZWxlbWVudFxuICAgKiBjYW4gaGF2ZSBvbmx5IGEgc2luZ2xlIHZpZXcgY29udGFpbmVyLlxuICAgKlxuICAgKiBSb290IGVsZW1lbnRzIG9mIHZpZXdzIGF0dGFjaGVkIHRvIHRoaXMgY29udGFpbmVyIGJlY29tZSBzaWJsaW5ncyBvZiB0aGUgYW5jaG9yIGVsZW1lbnQgaW5cbiAgICogdGhlIHJlbmRlcmVkIHZpZXcuXG4gICAqXG4gICAqIEFjY2VzcyB0aGUgYFZpZXdDb250YWluZXJSZWZgIG9mIGFuIGVsZW1lbnQgYnkgcGxhY2luZyBhIGBEaXJlY3RpdmVgIGluamVjdGVkXG4gICAqIHdpdGggYFZpZXdDb250YWluZXJSZWZgIG9uIHRoZSBlbGVtZW50LCBvciB1c2UgYSBgVmlld0NoaWxkYCBxdWVyeS5cbiAgICpcbiAgICogPCEtLSBUT0RPOiByZW5hbWUgdG8gYW5jaG9yRWxlbWVudCAtLT5cbiAgICovXG4gIGFic3RyYWN0IGdldCBlbGVtZW50KCk6IEVsZW1lbnRSZWY7XG5cbiAgLyoqXG4gICAqIFRoZSBbZGVwZW5kZW5jeSBpbmplY3Rvcl0oZ3VpZGUvZ2xvc3NhcnkjaW5qZWN0b3IpIGZvciB0aGlzIHZpZXcgY29udGFpbmVyLlxuICAgKi9cbiAgYWJzdHJhY3QgZ2V0IGluamVjdG9yKCk6IEluamVjdG9yO1xuXG4gIC8qKiBAZGVwcmVjYXRlZCBObyByZXBsYWNlbWVudCAqL1xuICBhYnN0cmFjdCBnZXQgcGFyZW50SW5qZWN0b3IoKTogSW5qZWN0b3I7XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIGFsbCB2aWV3cyBpbiB0aGlzIGNvbnRhaW5lci5cbiAgICovXG4gIGFic3RyYWN0IGNsZWFyKCk6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyBhIHZpZXcgZnJvbSB0aGlzIGNvbnRhaW5lci5cbiAgICogQHBhcmFtIGluZGV4IFRoZSAwLWJhc2VkIGluZGV4IG9mIHRoZSB2aWV3IHRvIHJldHJpZXZlLlxuICAgKiBAcmV0dXJucyBUaGUgYFZpZXdSZWZgIGluc3RhbmNlLCBvciBudWxsIGlmIHRoZSBpbmRleCBpcyBvdXQgb2YgcmFuZ2UuXG4gICAqL1xuICBhYnN0cmFjdCBnZXQoaW5kZXg6IG51bWJlcik6IFZpZXdSZWZ8bnVsbDtcblxuICAvKipcbiAgICogUmVwb3J0cyBob3cgbWFueSB2aWV3cyBhcmUgY3VycmVudGx5IGF0dGFjaGVkIHRvIHRoaXMgY29udGFpbmVyLlxuICAgKiBAcmV0dXJucyBUaGUgbnVtYmVyIG9mIHZpZXdzLlxuICAgKi9cbiAgYWJzdHJhY3QgZ2V0IGxlbmd0aCgpOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIEluc3RhbnRpYXRlcyBhbiBlbWJlZGRlZCB2aWV3IGFuZCBpbnNlcnRzIGl0XG4gICAqIGludG8gdGhpcyBjb250YWluZXIuXG4gICAqIEBwYXJhbSB0ZW1wbGF0ZVJlZiBUaGUgSFRNTCB0ZW1wbGF0ZSB0aGF0IGRlZmluZXMgdGhlIHZpZXcuXG4gICAqIEBwYXJhbSBjb250ZXh0IFRoZSBkYXRhLWJpbmRpbmcgY29udGV4dCBvZiB0aGUgZW1iZWRkZWQgdmlldywgYXMgZGVjbGFyZWRcbiAgICogaW4gdGhlIGA8bmctdGVtcGxhdGU+YCB1c2FnZS5cbiAgICogQHBhcmFtIG9wdGlvbnMgRXh0cmEgY29uZmlndXJhdGlvbiBmb3IgdGhlIGNyZWF0ZWQgdmlldy4gSW5jbHVkZXM6XG4gICAqICAqIGluZGV4OiBUaGUgMC1iYXNlZCBpbmRleCBhdCB3aGljaCB0byBpbnNlcnQgdGhlIG5ldyB2aWV3IGludG8gdGhpcyBjb250YWluZXIuXG4gICAqICAgICAgICAgICBJZiBub3Qgc3BlY2lmaWVkLCBhcHBlbmRzIHRoZSBuZXcgdmlldyBhcyB0aGUgbGFzdCBlbnRyeS5cbiAgICogICogaW5qZWN0b3I6IEluamVjdG9yIHRvIGJlIHVzZWQgd2l0aGluIHRoZSBlbWJlZGRlZCB2aWV3LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgYFZpZXdSZWZgIGluc3RhbmNlIGZvciB0aGUgbmV3bHkgY3JlYXRlZCB2aWV3LlxuICAgKi9cbiAgYWJzdHJhY3QgY3JlYXRlRW1iZWRkZWRWaWV3PEM+KHRlbXBsYXRlUmVmOiBUZW1wbGF0ZVJlZjxDPiwgY29udGV4dD86IEMsIG9wdGlvbnM/OiB7XG4gICAgaW5kZXg/OiBudW1iZXIsXG4gICAgaW5qZWN0b3I/OiBJbmplY3RvclxuICB9KTogRW1iZWRkZWRWaWV3UmVmPEM+O1xuXG4gIC8qKlxuICAgKiBJbnN0YW50aWF0ZXMgYW4gZW1iZWRkZWQgdmlldyBhbmQgaW5zZXJ0cyBpdFxuICAgKiBpbnRvIHRoaXMgY29udGFpbmVyLlxuICAgKiBAcGFyYW0gdGVtcGxhdGVSZWYgVGhlIEhUTUwgdGVtcGxhdGUgdGhhdCBkZWZpbmVzIHRoZSB2aWV3LlxuICAgKiBAcGFyYW0gY29udGV4dCBUaGUgZGF0YS1iaW5kaW5nIGNvbnRleHQgb2YgdGhlIGVtYmVkZGVkIHZpZXcsIGFzIGRlY2xhcmVkXG4gICAqIGluIHRoZSBgPG5nLXRlbXBsYXRlPmAgdXNhZ2UuXG4gICAqIEBwYXJhbSBpbmRleCBUaGUgMC1iYXNlZCBpbmRleCBhdCB3aGljaCB0byBpbnNlcnQgdGhlIG5ldyB2aWV3IGludG8gdGhpcyBjb250YWluZXIuXG4gICAqIElmIG5vdCBzcGVjaWZpZWQsIGFwcGVuZHMgdGhlIG5ldyB2aWV3IGFzIHRoZSBsYXN0IGVudHJ5LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgYFZpZXdSZWZgIGluc3RhbmNlIGZvciB0aGUgbmV3bHkgY3JlYXRlZCB2aWV3LlxuICAgKi9cbiAgYWJzdHJhY3QgY3JlYXRlRW1iZWRkZWRWaWV3PEM+KHRlbXBsYXRlUmVmOiBUZW1wbGF0ZVJlZjxDPiwgY29udGV4dD86IEMsIGluZGV4PzogbnVtYmVyKTpcbiAgICAgIEVtYmVkZGVkVmlld1JlZjxDPjtcblxuICAvKipcbiAgICogSW5zdGFudGlhdGVzIGEgc2luZ2xlIGNvbXBvbmVudCBhbmQgaW5zZXJ0cyBpdHMgaG9zdCB2aWV3IGludG8gdGhpcyBjb250YWluZXIuXG4gICAqXG4gICAqIEBwYXJhbSBjb21wb25lbnRUeXBlIENvbXBvbmVudCBUeXBlIHRvIHVzZS5cbiAgICogQHBhcmFtIG9wdGlvbnMgQW4gb2JqZWN0IHRoYXQgY29udGFpbnMgZXh0cmEgcGFyYW1ldGVyczpcbiAgICogICogaW5kZXg6IHRoZSBpbmRleCBhdCB3aGljaCB0byBpbnNlcnQgdGhlIG5ldyBjb21wb25lbnQncyBob3N0IHZpZXcgaW50byB0aGlzIGNvbnRhaW5lci5cbiAgICogICAgICAgICAgIElmIG5vdCBzcGVjaWZpZWQsIGFwcGVuZHMgdGhlIG5ldyB2aWV3IGFzIHRoZSBsYXN0IGVudHJ5LlxuICAgKiAgKiBpbmplY3RvcjogdGhlIGluamVjdG9yIHRvIHVzZSBhcyB0aGUgcGFyZW50IGZvciB0aGUgbmV3IGNvbXBvbmVudC5cbiAgICogICogbmdNb2R1bGVSZWY6IGFuIE5nTW9kdWxlUmVmIG9mIHRoZSBjb21wb25lbnQncyBOZ01vZHVsZSwgeW91IHNob3VsZCBhbG1vc3QgYWx3YXlzIHByb3ZpZGVcbiAgICogICAgICAgICAgICAgICAgIHRoaXMgdG8gZW5zdXJlIHRoYXQgYWxsIGV4cGVjdGVkIHByb3ZpZGVycyBhcmUgYXZhaWxhYmxlIGZvciB0aGUgY29tcG9uZW50XG4gICAqICAgICAgICAgICAgICAgICBpbnN0YW50aWF0aW9uLlxuICAgKiAgKiBlbnZpcm9ubWVudEluamVjdG9yOiBhbiBFbnZpcm9ubWVudEluamVjdG9yIHdoaWNoIHdpbGwgcHJvdmlkZSB0aGUgY29tcG9uZW50J3MgZW52aXJvbm1lbnQuXG4gICAqICAgICAgICAgICAgICAgICB5b3Ugc2hvdWxkIGFsbW9zdCBhbHdheXMgcHJvdmlkZSB0aGlzIHRvIGVuc3VyZSB0aGF0IGFsbCBleHBlY3RlZCBwcm92aWRlcnNcbiAgICogICAgICAgICAgICAgICAgIGFyZSBhdmFpbGFibGUgZm9yIHRoZSBjb21wb25lbnQgaW5zdGFudGlhdGlvbi4gVGhpcyBvcHRpb24gaXMgaW50ZW5kZWQgdG9cbiAgICogICAgICAgICAgICAgICAgIHJlcGxhY2UgdGhlIGBuZ01vZHVsZVJlZmAgcGFyYW1ldGVyLlxuICAgKiAgKiBwcm9qZWN0YWJsZU5vZGVzOiBsaXN0IG9mIERPTSBub2RlcyB0aGF0IHNob3VsZCBiZSBwcm9qZWN0ZWQgdGhyb3VnaFxuICAgKiAgICAgICAgICAgICAgICAgICAgICBbYDxuZy1jb250ZW50PmBdKGFwaS9jb3JlL25nLWNvbnRlbnQpIG9mIHRoZSBuZXcgY29tcG9uZW50IGluc3RhbmNlLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbmV3IGBDb21wb25lbnRSZWZgIHdoaWNoIGNvbnRhaW5zIHRoZSBjb21wb25lbnQgaW5zdGFuY2UgYW5kIHRoZSBob3N0IHZpZXcuXG4gICAqL1xuICBhYnN0cmFjdCBjcmVhdGVDb21wb25lbnQ8Qz4oY29tcG9uZW50VHlwZTogVHlwZTxDPiwgb3B0aW9ucz86IHtcbiAgICBpbmRleD86IG51bWJlcixcbiAgICBpbmplY3Rvcj86IEluamVjdG9yLFxuICAgIG5nTW9kdWxlUmVmPzogTmdNb2R1bGVSZWY8dW5rbm93bj4sXG4gICAgZW52aXJvbm1lbnRJbmplY3Rvcj86IEVudmlyb25tZW50SW5qZWN0b3J8TmdNb2R1bGVSZWY8dW5rbm93bj4sXG4gICAgcHJvamVjdGFibGVOb2Rlcz86IE5vZGVbXVtdLFxuICB9KTogQ29tcG9uZW50UmVmPEM+O1xuXG4gIC8qKlxuICAgKiBJbnN0YW50aWF0ZXMgYSBzaW5nbGUgY29tcG9uZW50IGFuZCBpbnNlcnRzIGl0cyBob3N0IHZpZXcgaW50byB0aGlzIGNvbnRhaW5lci5cbiAgICpcbiAgICogQHBhcmFtIGNvbXBvbmVudEZhY3RvcnkgQ29tcG9uZW50IGZhY3RvcnkgdG8gdXNlLlxuICAgKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IGF0IHdoaWNoIHRvIGluc2VydCB0aGUgbmV3IGNvbXBvbmVudCdzIGhvc3QgdmlldyBpbnRvIHRoaXMgY29udGFpbmVyLlxuICAgKiBJZiBub3Qgc3BlY2lmaWVkLCBhcHBlbmRzIHRoZSBuZXcgdmlldyBhcyB0aGUgbGFzdCBlbnRyeS5cbiAgICogQHBhcmFtIGluamVjdG9yIFRoZSBpbmplY3RvciB0byB1c2UgYXMgdGhlIHBhcmVudCBmb3IgdGhlIG5ldyBjb21wb25lbnQuXG4gICAqIEBwYXJhbSBwcm9qZWN0YWJsZU5vZGVzIExpc3Qgb2YgRE9NIG5vZGVzIHRoYXQgc2hvdWxkIGJlIHByb2plY3RlZCB0aHJvdWdoXG4gICAqICAgICBbYDxuZy1jb250ZW50PmBdKGFwaS9jb3JlL25nLWNvbnRlbnQpIG9mIHRoZSBuZXcgY29tcG9uZW50IGluc3RhbmNlLlxuICAgKiBAcGFyYW0gbmdNb2R1bGVSZWYgQW4gaW5zdGFuY2Ugb2YgdGhlIE5nTW9kdWxlUmVmIHRoYXQgcmVwcmVzZW50IGFuIE5nTW9kdWxlLlxuICAgKiBUaGlzIGluZm9ybWF0aW9uIGlzIHVzZWQgdG8gcmV0cmlldmUgY29ycmVzcG9uZGluZyBOZ01vZHVsZSBpbmplY3Rvci5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIG5ldyBgQ29tcG9uZW50UmVmYCB3aGljaCBjb250YWlucyB0aGUgY29tcG9uZW50IGluc3RhbmNlIGFuZCB0aGUgaG9zdCB2aWV3LlxuICAgKlxuICAgKiBAZGVwcmVjYXRlZCBBbmd1bGFyIG5vIGxvbmdlciByZXF1aXJlcyBjb21wb25lbnQgZmFjdG9yaWVzIHRvIGR5bmFtaWNhbGx5IGNyZWF0ZSBjb21wb25lbnRzLlxuICAgKiAgICAgVXNlIGRpZmZlcmVudCBzaWduYXR1cmUgb2YgdGhlIGBjcmVhdGVDb21wb25lbnRgIG1ldGhvZCwgd2hpY2ggYWxsb3dzIHBhc3NpbmdcbiAgICogICAgIENvbXBvbmVudCBjbGFzcyBkaXJlY3RseS5cbiAgICovXG4gIGFic3RyYWN0IGNyZWF0ZUNvbXBvbmVudDxDPihcbiAgICAgIGNvbXBvbmVudEZhY3Rvcnk6IENvbXBvbmVudEZhY3Rvcnk8Qz4sIGluZGV4PzogbnVtYmVyLCBpbmplY3Rvcj86IEluamVjdG9yLFxuICAgICAgcHJvamVjdGFibGVOb2Rlcz86IGFueVtdW10sXG4gICAgICBlbnZpcm9ubWVudEluamVjdG9yPzogRW52aXJvbm1lbnRJbmplY3RvcnxOZ01vZHVsZVJlZjxhbnk+KTogQ29tcG9uZW50UmVmPEM+O1xuXG4gIC8qKlxuICAgKiBJbnNlcnRzIGEgdmlldyBpbnRvIHRoaXMgY29udGFpbmVyLlxuICAgKiBAcGFyYW0gdmlld1JlZiBUaGUgdmlldyB0byBpbnNlcnQuXG4gICAqIEBwYXJhbSBpbmRleCBUaGUgMC1iYXNlZCBpbmRleCBhdCB3aGljaCB0byBpbnNlcnQgdGhlIHZpZXcuXG4gICAqIElmIG5vdCBzcGVjaWZpZWQsIGFwcGVuZHMgdGhlIG5ldyB2aWV3IGFzIHRoZSBsYXN0IGVudHJ5LlxuICAgKiBAcmV0dXJucyBUaGUgaW5zZXJ0ZWQgYFZpZXdSZWZgIGluc3RhbmNlLlxuICAgKlxuICAgKi9cbiAgYWJzdHJhY3QgaW5zZXJ0KHZpZXdSZWY6IFZpZXdSZWYsIGluZGV4PzogbnVtYmVyKTogVmlld1JlZjtcblxuICAvKipcbiAgICogTW92ZXMgYSB2aWV3IHRvIGEgbmV3IGxvY2F0aW9uIGluIHRoaXMgY29udGFpbmVyLlxuICAgKiBAcGFyYW0gdmlld1JlZiBUaGUgdmlldyB0byBtb3ZlLlxuICAgKiBAcGFyYW0gaW5kZXggVGhlIDAtYmFzZWQgaW5kZXggb2YgdGhlIG5ldyBsb2NhdGlvbi5cbiAgICogQHJldHVybnMgVGhlIG1vdmVkIGBWaWV3UmVmYCBpbnN0YW5jZS5cbiAgICovXG4gIGFic3RyYWN0IG1vdmUodmlld1JlZjogVmlld1JlZiwgY3VycmVudEluZGV4OiBudW1iZXIpOiBWaWV3UmVmO1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBpbmRleCBvZiBhIHZpZXcgd2l0aGluIHRoZSBjdXJyZW50IGNvbnRhaW5lci5cbiAgICogQHBhcmFtIHZpZXdSZWYgVGhlIHZpZXcgdG8gcXVlcnkuXG4gICAqIEByZXR1cm5zIFRoZSAwLWJhc2VkIGluZGV4IG9mIHRoZSB2aWV3J3MgcG9zaXRpb24gaW4gdGhpcyBjb250YWluZXIsXG4gICAqIG9yIGAtMWAgaWYgdGhpcyBjb250YWluZXIgZG9lc24ndCBjb250YWluIHRoZSB2aWV3LlxuICAgKi9cbiAgYWJzdHJhY3QgaW5kZXhPZih2aWV3UmVmOiBWaWV3UmVmKTogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBEZXN0cm95cyBhIHZpZXcgYXR0YWNoZWQgdG8gdGhpcyBjb250YWluZXJcbiAgICogQHBhcmFtIGluZGV4IFRoZSAwLWJhc2VkIGluZGV4IG9mIHRoZSB2aWV3IHRvIGRlc3Ryb3kuXG4gICAqIElmIG5vdCBzcGVjaWZpZWQsIHRoZSBsYXN0IHZpZXcgaW4gdGhlIGNvbnRhaW5lciBpcyByZW1vdmVkLlxuICAgKi9cbiAgYWJzdHJhY3QgcmVtb3ZlKGluZGV4PzogbnVtYmVyKTogdm9pZDtcblxuICAvKipcbiAgICogRGV0YWNoZXMgYSB2aWV3IGZyb20gdGhpcyBjb250YWluZXIgd2l0aG91dCBkZXN0cm95aW5nIGl0LlxuICAgKiBVc2UgYWxvbmcgd2l0aCBgaW5zZXJ0KClgIHRvIG1vdmUgYSB2aWV3IHdpdGhpbiB0aGUgY3VycmVudCBjb250YWluZXIuXG4gICAqIEBwYXJhbSBpbmRleCBUaGUgMC1iYXNlZCBpbmRleCBvZiB0aGUgdmlldyB0byBkZXRhY2guXG4gICAqIElmIG5vdCBzcGVjaWZpZWQsIHRoZSBsYXN0IHZpZXcgaW4gdGhlIGNvbnRhaW5lciBpcyBkZXRhY2hlZC5cbiAgICovXG4gIGFic3RyYWN0IGRldGFjaChpbmRleD86IG51bWJlcik6IFZpZXdSZWZ8bnVsbDtcblxuICAvKipcbiAgICogQGludGVybmFsXG4gICAqIEBub2NvbGxhcHNlXG4gICAqL1xuICBzdGF0aWMgX19OR19FTEVNRU5UX0lEX186ICgpID0+IFZpZXdDb250YWluZXJSZWYgPSBpbmplY3RWaWV3Q29udGFpbmVyUmVmO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBWaWV3Q29udGFpbmVyUmVmIGFuZCBzdG9yZXMgaXQgb24gdGhlIGluamVjdG9yLiBPciwgaWYgdGhlIFZpZXdDb250YWluZXJSZWZcbiAqIGFscmVhZHkgZXhpc3RzLCByZXRyaWV2ZXMgdGhlIGV4aXN0aW5nIFZpZXdDb250YWluZXJSZWYuXG4gKlxuICogQHJldHVybnMgVGhlIFZpZXdDb250YWluZXJSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RWaWV3Q29udGFpbmVyUmVmKCk6IFZpZXdDb250YWluZXJSZWYge1xuICBjb25zdCBwcmV2aW91c1ROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkgYXMgVEVsZW1lbnROb2RlIHwgVEVsZW1lbnRDb250YWluZXJOb2RlIHwgVENvbnRhaW5lck5vZGU7XG4gIHJldHVybiBjcmVhdGVDb250YWluZXJSZWYocHJldmlvdXNUTm9kZSwgZ2V0TFZpZXcoKSk7XG59XG5cbmNvbnN0IFZFX1ZpZXdDb250YWluZXJSZWYgPSBWaWV3Q29udGFpbmVyUmVmO1xuXG4vLyBUT0RPKGFseGh1Yik6IGNsZWFuaW5nIHVwIHRoaXMgaW5kaXJlY3Rpb24gdHJpZ2dlcnMgYSBzdWJ0bGUgYnVnIGluIENsb3N1cmUgaW4gZzMuIE9uY2UgdGhlIGZpeFxuLy8gZm9yIHRoYXQgbGFuZHMsIHRoaXMgY2FuIGJlIGNsZWFuZWQgdXAuXG5jb25zdCBSM1ZpZXdDb250YWluZXJSZWYgPSBjbGFzcyBWaWV3Q29udGFpbmVyUmVmIGV4dGVuZHMgVkVfVmlld0NvbnRhaW5lclJlZiB7XG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSBfbENvbnRhaW5lcjogTENvbnRhaW5lcixcbiAgICAgIHByaXZhdGUgX2hvc3RUTm9kZTogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZSxcbiAgICAgIHByaXZhdGUgX2hvc3RMVmlldzogTFZpZXcpIHtcbiAgICBzdXBlcigpO1xuICB9XG5cbiAgb3ZlcnJpZGUgZ2V0IGVsZW1lbnQoKTogRWxlbWVudFJlZiB7XG4gICAgcmV0dXJuIGNyZWF0ZUVsZW1lbnRSZWYodGhpcy5faG9zdFROb2RlLCB0aGlzLl9ob3N0TFZpZXcpO1xuICB9XG5cbiAgb3ZlcnJpZGUgZ2V0IGluamVjdG9yKCk6IEluamVjdG9yIHtcbiAgICByZXR1cm4gbmV3IE5vZGVJbmplY3Rvcih0aGlzLl9ob3N0VE5vZGUsIHRoaXMuX2hvc3RMVmlldyk7XG4gIH1cblxuICAvKiogQGRlcHJlY2F0ZWQgTm8gcmVwbGFjZW1lbnQgKi9cbiAgb3ZlcnJpZGUgZ2V0IHBhcmVudEluamVjdG9yKCk6IEluamVjdG9yIHtcbiAgICBjb25zdCBwYXJlbnRMb2NhdGlvbiA9IGdldFBhcmVudEluamVjdG9yTG9jYXRpb24odGhpcy5faG9zdFROb2RlLCB0aGlzLl9ob3N0TFZpZXcpO1xuICAgIGlmIChoYXNQYXJlbnRJbmplY3RvcihwYXJlbnRMb2NhdGlvbikpIHtcbiAgICAgIGNvbnN0IHBhcmVudFZpZXcgPSBnZXRQYXJlbnRJbmplY3RvclZpZXcocGFyZW50TG9jYXRpb24sIHRoaXMuX2hvc3RMVmlldyk7XG4gICAgICBjb25zdCBpbmplY3RvckluZGV4ID0gZ2V0UGFyZW50SW5qZWN0b3JJbmRleChwYXJlbnRMb2NhdGlvbik7XG4gICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZUluamVjdG9yKHBhcmVudFZpZXcsIGluamVjdG9ySW5kZXgpO1xuICAgICAgY29uc3QgcGFyZW50VE5vZGUgPVxuICAgICAgICAgIHBhcmVudFZpZXdbVFZJRVddLmRhdGFbaW5qZWN0b3JJbmRleCArIE5vZGVJbmplY3Rvck9mZnNldC5UTk9ERV0gYXMgVEVsZW1lbnROb2RlO1xuICAgICAgcmV0dXJuIG5ldyBOb2RlSW5qZWN0b3IocGFyZW50VE5vZGUsIHBhcmVudFZpZXcpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbmV3IE5vZGVJbmplY3RvcihudWxsLCB0aGlzLl9ob3N0TFZpZXcpO1xuICAgIH1cbiAgfVxuXG4gIG92ZXJyaWRlIGNsZWFyKCk6IHZvaWQge1xuICAgIHdoaWxlICh0aGlzLmxlbmd0aCA+IDApIHtcbiAgICAgIHRoaXMucmVtb3ZlKHRoaXMubGVuZ3RoIC0gMSk7XG4gICAgfVxuICB9XG5cbiAgb3ZlcnJpZGUgZ2V0KGluZGV4OiBudW1iZXIpOiBWaWV3UmVmfG51bGwge1xuICAgIGNvbnN0IHZpZXdSZWZzID0gZ2V0Vmlld1JlZnModGhpcy5fbENvbnRhaW5lcik7XG4gICAgcmV0dXJuIHZpZXdSZWZzICE9PSBudWxsICYmIHZpZXdSZWZzW2luZGV4XSB8fCBudWxsO1xuICB9XG5cbiAgb3ZlcnJpZGUgZ2V0IGxlbmd0aCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl9sQ29udGFpbmVyLmxlbmd0aCAtIENPTlRBSU5FUl9IRUFERVJfT0ZGU0VUO1xuICB9XG5cbiAgb3ZlcnJpZGUgY3JlYXRlRW1iZWRkZWRWaWV3PEM+KHRlbXBsYXRlUmVmOiBUZW1wbGF0ZVJlZjxDPiwgY29udGV4dD86IEMsIG9wdGlvbnM/OiB7XG4gICAgaW5kZXg/OiBudW1iZXIsXG4gICAgaW5qZWN0b3I/OiBJbmplY3RvclxuICB9KTogRW1iZWRkZWRWaWV3UmVmPEM+O1xuICBvdmVycmlkZSBjcmVhdGVFbWJlZGRlZFZpZXc8Qz4odGVtcGxhdGVSZWY6IFRlbXBsYXRlUmVmPEM+LCBjb250ZXh0PzogQywgaW5kZXg/OiBudW1iZXIpOlxuICAgICAgRW1iZWRkZWRWaWV3UmVmPEM+O1xuICBvdmVycmlkZSBjcmVhdGVFbWJlZGRlZFZpZXc8Qz4odGVtcGxhdGVSZWY6IFRlbXBsYXRlUmVmPEM+LCBjb250ZXh0PzogQywgaW5kZXhPck9wdGlvbnM/OiBudW1iZXJ8e1xuICAgIGluZGV4PzogbnVtYmVyLFxuICAgIGluamVjdG9yPzogSW5qZWN0b3JcbiAgfSk6IEVtYmVkZGVkVmlld1JlZjxDPiB7XG4gICAgbGV0IGluZGV4OiBudW1iZXJ8dW5kZWZpbmVkO1xuICAgIGxldCBpbmplY3RvcjogSW5qZWN0b3J8dW5kZWZpbmVkO1xuXG4gICAgaWYgKHR5cGVvZiBpbmRleE9yT3B0aW9ucyA9PT0gJ251bWJlcicpIHtcbiAgICAgIGluZGV4ID0gaW5kZXhPck9wdGlvbnM7XG4gICAgfSBlbHNlIGlmIChpbmRleE9yT3B0aW9ucyAhPSBudWxsKSB7XG4gICAgICBpbmRleCA9IGluZGV4T3JPcHRpb25zLmluZGV4O1xuICAgICAgaW5qZWN0b3IgPSBpbmRleE9yT3B0aW9ucy5pbmplY3RvcjtcbiAgICB9XG5cbiAgICBjb25zdCBoeWRyYXRpb25JbmZvID0gZmluZE1hdGNoaW5nRGVoeWRyYXRlZFZpZXcodGhpcy5fbENvbnRhaW5lciwgdGVtcGxhdGVSZWYuc3NySWQpO1xuICAgIGNvbnN0IHZpZXdSZWYgPSB0ZW1wbGF0ZVJlZi5jcmVhdGVFbWJlZGRlZFZpZXdJbXBsKGNvbnRleHQgfHwgPGFueT57fSwgaW5qZWN0b3IsIGh5ZHJhdGlvbkluZm8pO1xuICAgIHRoaXMuaW5zZXJ0SW1wbCh2aWV3UmVmLCBpbmRleCwgISFoeWRyYXRpb25JbmZvKTtcbiAgICByZXR1cm4gdmlld1JlZjtcbiAgfVxuXG4gIG92ZXJyaWRlIGNyZWF0ZUNvbXBvbmVudDxDPihjb21wb25lbnRUeXBlOiBUeXBlPEM+LCBvcHRpb25zPzoge1xuICAgIGluZGV4PzogbnVtYmVyLFxuICAgIGluamVjdG9yPzogSW5qZWN0b3IsXG4gICAgcHJvamVjdGFibGVOb2Rlcz86IE5vZGVbXVtdLFxuICAgIG5nTW9kdWxlUmVmPzogTmdNb2R1bGVSZWY8dW5rbm93bj4sXG4gIH0pOiBDb21wb25lbnRSZWY8Qz47XG4gIC8qKlxuICAgKiBAZGVwcmVjYXRlZCBBbmd1bGFyIG5vIGxvbmdlciByZXF1aXJlcyBjb21wb25lbnQgZmFjdG9yaWVzIHRvIGR5bmFtaWNhbGx5IGNyZWF0ZSBjb21wb25lbnRzLlxuICAgKiAgICAgVXNlIGRpZmZlcmVudCBzaWduYXR1cmUgb2YgdGhlIGBjcmVhdGVDb21wb25lbnRgIG1ldGhvZCwgd2hpY2ggYWxsb3dzIHBhc3NpbmdcbiAgICogICAgIENvbXBvbmVudCBjbGFzcyBkaXJlY3RseS5cbiAgICovXG4gIG92ZXJyaWRlIGNyZWF0ZUNvbXBvbmVudDxDPihcbiAgICAgIGNvbXBvbmVudEZhY3Rvcnk6IENvbXBvbmVudEZhY3Rvcnk8Qz4sIGluZGV4PzogbnVtYmVyfHVuZGVmaW5lZCxcbiAgICAgIGluamVjdG9yPzogSW5qZWN0b3J8dW5kZWZpbmVkLCBwcm9qZWN0YWJsZU5vZGVzPzogYW55W11bXXx1bmRlZmluZWQsXG4gICAgICBlbnZpcm9ubWVudEluamVjdG9yPzogRW52aXJvbm1lbnRJbmplY3RvcnxOZ01vZHVsZVJlZjxhbnk+fHVuZGVmaW5lZCk6IENvbXBvbmVudFJlZjxDPjtcbiAgb3ZlcnJpZGUgY3JlYXRlQ29tcG9uZW50PEM+KFxuICAgICAgY29tcG9uZW50RmFjdG9yeU9yVHlwZTogQ29tcG9uZW50RmFjdG9yeTxDPnxUeXBlPEM+LCBpbmRleE9yT3B0aW9ucz86IG51bWJlcnx1bmRlZmluZWR8e1xuICAgICAgICBpbmRleD86IG51bWJlcixcbiAgICAgICAgaW5qZWN0b3I/OiBJbmplY3RvcixcbiAgICAgICAgbmdNb2R1bGVSZWY/OiBOZ01vZHVsZVJlZjx1bmtub3duPixcbiAgICAgICAgZW52aXJvbm1lbnRJbmplY3Rvcj86IEVudmlyb25tZW50SW5qZWN0b3J8TmdNb2R1bGVSZWY8dW5rbm93bj4sXG4gICAgICAgIHByb2plY3RhYmxlTm9kZXM/OiBOb2RlW11bXSxcbiAgICAgIH0sXG4gICAgICBpbmplY3Rvcj86IEluamVjdG9yfHVuZGVmaW5lZCwgcHJvamVjdGFibGVOb2Rlcz86IGFueVtdW118dW5kZWZpbmVkLFxuICAgICAgZW52aXJvbm1lbnRJbmplY3Rvcj86IEVudmlyb25tZW50SW5qZWN0b3J8TmdNb2R1bGVSZWY8YW55Pnx1bmRlZmluZWQpOiBDb21wb25lbnRSZWY8Qz4ge1xuICAgIGNvbnN0IGlzQ29tcG9uZW50RmFjdG9yeSA9IGNvbXBvbmVudEZhY3RvcnlPclR5cGUgJiYgIWlzVHlwZShjb21wb25lbnRGYWN0b3J5T3JUeXBlKTtcbiAgICBsZXQgaW5kZXg6IG51bWJlcnx1bmRlZmluZWQ7XG5cbiAgICAvLyBUaGlzIGZ1bmN0aW9uIHN1cHBvcnRzIDIgc2lnbmF0dXJlcyBhbmQgd2UgbmVlZCB0byBoYW5kbGUgb3B0aW9ucyBjb3JyZWN0bHkgZm9yIGJvdGg6XG4gICAgLy8gICAxLiBXaGVuIGZpcnN0IGFyZ3VtZW50IGlzIGEgQ29tcG9uZW50IHR5cGUuIFRoaXMgc2lnbmF0dXJlIGFsc28gcmVxdWlyZXMgZXh0cmFcbiAgICAvLyAgICAgIG9wdGlvbnMgdG8gYmUgcHJvdmlkZWQgYXMgYXMgb2JqZWN0IChtb3JlIGVyZ29ub21pYyBvcHRpb24pLlxuICAgIC8vICAgMi4gRmlyc3QgYXJndW1lbnQgaXMgYSBDb21wb25lbnQgZmFjdG9yeS4gSW4gdGhpcyBjYXNlIGV4dHJhIG9wdGlvbnMgYXJlIHJlcHJlc2VudGVkIGFzXG4gICAgLy8gICAgICBwb3NpdGlvbmFsIGFyZ3VtZW50cy4gVGhpcyBzaWduYXR1cmUgaXMgbGVzcyBlcmdvbm9taWMgYW5kIHdpbGwgYmUgZGVwcmVjYXRlZC5cbiAgICBpZiAoaXNDb21wb25lbnRGYWN0b3J5KSB7XG4gICAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICAgIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgdHlwZW9mIGluZGV4T3JPcHRpb25zICE9PSAnb2JqZWN0JywgdHJ1ZSxcbiAgICAgICAgICAgICdJdCBsb29rcyBsaWtlIENvbXBvbmVudCBmYWN0b3J5IHdhcyBwcm92aWRlZCBhcyB0aGUgZmlyc3QgYXJndW1lbnQgJyArXG4gICAgICAgICAgICAgICAgJ2FuZCBhbiBvcHRpb25zIG9iamVjdCBhcyB0aGUgc2Vjb25kIGFyZ3VtZW50LiBUaGlzIGNvbWJpbmF0aW9uIG9mIGFyZ3VtZW50cyAnICtcbiAgICAgICAgICAgICAgICAnaXMgaW5jb21wYXRpYmxlLiBZb3UgY2FuIGVpdGhlciBjaGFuZ2UgdGhlIGZpcnN0IGFyZ3VtZW50IHRvIHByb3ZpZGUgQ29tcG9uZW50ICcgK1xuICAgICAgICAgICAgICAgICd0eXBlIG9yIGNoYW5nZSB0aGUgc2Vjb25kIGFyZ3VtZW50IHRvIGJlIGEgbnVtYmVyIChyZXByZXNlbnRpbmcgYW4gaW5kZXggYXQgJyArXG4gICAgICAgICAgICAgICAgJ3doaWNoIHRvIGluc2VydCB0aGUgbmV3IGNvbXBvbmVudFxcJ3MgaG9zdCB2aWV3IGludG8gdGhpcyBjb250YWluZXIpJyk7XG4gICAgICB9XG4gICAgICBpbmRleCA9IGluZGV4T3JPcHRpb25zIGFzIG51bWJlciB8IHVuZGVmaW5lZDtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgICBhc3NlcnREZWZpbmVkKFxuICAgICAgICAgICAgZ2V0Q29tcG9uZW50RGVmKGNvbXBvbmVudEZhY3RvcnlPclR5cGUpLFxuICAgICAgICAgICAgYFByb3ZpZGVkIENvbXBvbmVudCBjbGFzcyBkb2Vzbid0IGNvbnRhaW4gQ29tcG9uZW50IGRlZmluaXRpb24uIGAgK1xuICAgICAgICAgICAgICAgIGBQbGVhc2UgY2hlY2sgd2hldGhlciBwcm92aWRlZCBjbGFzcyBoYXMgQENvbXBvbmVudCBkZWNvcmF0b3IuYCk7XG4gICAgICAgIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgdHlwZW9mIGluZGV4T3JPcHRpb25zICE9PSAnbnVtYmVyJywgdHJ1ZSxcbiAgICAgICAgICAgICdJdCBsb29rcyBsaWtlIENvbXBvbmVudCB0eXBlIHdhcyBwcm92aWRlZCBhcyB0aGUgZmlyc3QgYXJndW1lbnQgJyArXG4gICAgICAgICAgICAgICAgJ2FuZCBhIG51bWJlciAocmVwcmVzZW50aW5nIGFuIGluZGV4IGF0IHdoaWNoIHRvIGluc2VydCB0aGUgbmV3IGNvbXBvbmVudFxcJ3MgJyArXG4gICAgICAgICAgICAgICAgJ2hvc3QgdmlldyBpbnRvIHRoaXMgY29udGFpbmVyIGFzIHRoZSBzZWNvbmQgYXJndW1lbnQuIFRoaXMgY29tYmluYXRpb24gb2YgYXJndW1lbnRzICcgK1xuICAgICAgICAgICAgICAgICdpcyBpbmNvbXBhdGlibGUuIFBsZWFzZSB1c2UgYW4gb2JqZWN0IGFzIHRoZSBzZWNvbmQgYXJndW1lbnQgaW5zdGVhZC4nKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IG9wdGlvbnMgPSAoaW5kZXhPck9wdGlvbnMgfHwge30pIGFzIHtcbiAgICAgICAgaW5kZXg/OiBudW1iZXIsXG4gICAgICAgIGluamVjdG9yPzogSW5qZWN0b3IsXG4gICAgICAgIG5nTW9kdWxlUmVmPzogTmdNb2R1bGVSZWY8dW5rbm93bj4sXG4gICAgICAgIGVudmlyb25tZW50SW5qZWN0b3I/OiBFbnZpcm9ubWVudEluamVjdG9yIHwgTmdNb2R1bGVSZWY8dW5rbm93bj4sXG4gICAgICAgIHByb2plY3RhYmxlTm9kZXM/OiBOb2RlW11bXSxcbiAgICAgIH07XG4gICAgICBpZiAobmdEZXZNb2RlICYmIG9wdGlvbnMuZW52aXJvbm1lbnRJbmplY3RvciAmJiBvcHRpb25zLm5nTW9kdWxlUmVmKSB7XG4gICAgICAgIHRocm93RXJyb3IoXG4gICAgICAgICAgICBgQ2Fubm90IHBhc3MgYm90aCBlbnZpcm9ubWVudEluamVjdG9yIGFuZCBuZ01vZHVsZVJlZiBvcHRpb25zIHRvIGNyZWF0ZUNvbXBvbmVudCgpLmApO1xuICAgICAgfVxuICAgICAgaW5kZXggPSBvcHRpb25zLmluZGV4O1xuICAgICAgaW5qZWN0b3IgPSBvcHRpb25zLmluamVjdG9yO1xuICAgICAgcHJvamVjdGFibGVOb2RlcyA9IG9wdGlvbnMucHJvamVjdGFibGVOb2RlcztcbiAgICAgIGVudmlyb25tZW50SW5qZWN0b3IgPSBvcHRpb25zLmVudmlyb25tZW50SW5qZWN0b3IgfHwgb3B0aW9ucy5uZ01vZHVsZVJlZjtcbiAgICB9XG5cbiAgICBjb25zdCBjb21wb25lbnRGYWN0b3J5OiBDb21wb25lbnRGYWN0b3J5PEM+ID0gaXNDb21wb25lbnRGYWN0b3J5ID9cbiAgICAgICAgY29tcG9uZW50RmFjdG9yeU9yVHlwZSBhcyBDb21wb25lbnRGYWN0b3J5PEM+OlxuICAgICAgICBuZXcgUjNDb21wb25lbnRGYWN0b3J5KGdldENvbXBvbmVudERlZihjb21wb25lbnRGYWN0b3J5T3JUeXBlKSEpO1xuICAgIGNvbnN0IGNvbnRleHRJbmplY3RvciA9IGluamVjdG9yIHx8IHRoaXMucGFyZW50SW5qZWN0b3I7XG5cbiAgICAvLyBJZiBhbiBgTmdNb2R1bGVSZWZgIGlzIG5vdCBwcm92aWRlZCBleHBsaWNpdGx5LCB0cnkgcmV0cmlldmluZyBpdCBmcm9tIHRoZSBESSB0cmVlLlxuICAgIGlmICghZW52aXJvbm1lbnRJbmplY3RvciAmJiAoY29tcG9uZW50RmFjdG9yeSBhcyBhbnkpLm5nTW9kdWxlID09IG51bGwpIHtcbiAgICAgIC8vIEZvciB0aGUgYENvbXBvbmVudEZhY3RvcnlgIGNhc2UsIGVudGVyaW5nIHRoaXMgbG9naWMgaXMgdmVyeSB1bmxpa2VseSwgc2luY2Ugd2UgZXhwZWN0IHRoYXRcbiAgICAgIC8vIGFuIGluc3RhbmNlIG9mIGEgYENvbXBvbmVudEZhY3RvcnlgLCByZXNvbHZlZCB2aWEgYENvbXBvbmVudEZhY3RvcnlSZXNvbHZlcmAgd291bGQgaGF2ZSBhblxuICAgICAgLy8gYG5nTW9kdWxlYCBmaWVsZC4gVGhpcyBpcyBwb3NzaWJsZSBpbiBzb21lIHRlc3Qgc2NlbmFyaW9zIGFuZCBwb3RlbnRpYWxseSBpbiBzb21lIEpJVC1iYXNlZFxuICAgICAgLy8gdXNlLWNhc2VzLiBGb3IgdGhlIGBDb21wb25lbnRGYWN0b3J5YCBjYXNlIHdlIHByZXNlcnZlIGJhY2t3YXJkcy1jb21wYXRpYmlsaXR5IGFuZCB0cnlcbiAgICAgIC8vIHVzaW5nIGEgcHJvdmlkZWQgaW5qZWN0b3IgZmlyc3QsIHRoZW4gZmFsbCBiYWNrIHRvIHRoZSBwYXJlbnQgaW5qZWN0b3Igb2YgdGhpc1xuICAgICAgLy8gYFZpZXdDb250YWluZXJSZWZgIGluc3RhbmNlLlxuICAgICAgLy9cbiAgICAgIC8vIEZvciB0aGUgZmFjdG9yeS1sZXNzIGNhc2UsIGl0J3MgY3JpdGljYWwgdG8gZXN0YWJsaXNoIGEgY29ubmVjdGlvbiB3aXRoIHRoZSBtb2R1bGVcbiAgICAgIC8vIGluamVjdG9yIHRyZWUgKGJ5IHJldHJpZXZpbmcgYW4gaW5zdGFuY2Ugb2YgYW4gYE5nTW9kdWxlUmVmYCBhbmQgYWNjZXNzaW5nIGl0cyBpbmplY3RvciksXG4gICAgICAvLyBzbyB0aGF0IGEgY29tcG9uZW50IGNhbiB1c2UgREkgdG9rZW5zIHByb3ZpZGVkIGluIE1nTW9kdWxlcy4gRm9yIHRoaXMgcmVhc29uLCB3ZSBjYW4gbm90XG4gICAgICAvLyByZWx5IG9uIHRoZSBwcm92aWRlZCBpbmplY3Rvciwgc2luY2UgaXQgbWlnaHQgYmUgZGV0YWNoZWQgZnJvbSB0aGUgREkgdHJlZSAoZm9yIGV4YW1wbGUsIGlmXG4gICAgICAvLyBpdCB3YXMgY3JlYXRlZCB2aWEgYEluamVjdG9yLmNyZWF0ZWAgd2l0aG91dCBzcGVjaWZ5aW5nIGEgcGFyZW50IGluamVjdG9yLCBvciBpZiBhblxuICAgICAgLy8gaW5qZWN0b3IgaXMgcmV0cmlldmVkIGZyb20gYW4gYE5nTW9kdWxlUmVmYCBjcmVhdGVkIHZpYSBgY3JlYXRlTmdNb2R1bGVgIHVzaW5nIGFuXG4gICAgICAvLyBOZ01vZHVsZSBvdXRzaWRlIG9mIGEgbW9kdWxlIHRyZWUpLiBJbnN0ZWFkLCB3ZSBhbHdheXMgdXNlIGBWaWV3Q29udGFpbmVyUmVmYCdzIHBhcmVudFxuICAgICAgLy8gaW5qZWN0b3IsIHdoaWNoIGlzIG5vcm1hbGx5IGNvbm5lY3RlZCB0byB0aGUgREkgdHJlZSwgd2hpY2ggaW5jbHVkZXMgbW9kdWxlIGluamVjdG9yXG4gICAgICAvLyBzdWJ0cmVlLlxuICAgICAgY29uc3QgX2luamVjdG9yID0gaXNDb21wb25lbnRGYWN0b3J5ID8gY29udGV4dEluamVjdG9yIDogdGhpcy5wYXJlbnRJbmplY3RvcjtcblxuICAgICAgLy8gRE8gTk9UIFJFRkFDVE9SLiBUaGUgY29kZSBoZXJlIHVzZWQgdG8gaGF2ZSBhIGBpbmplY3Rvci5nZXQoTmdNb2R1bGVSZWYsIG51bGwpIHx8XG4gICAgICAvLyB1bmRlZmluZWRgIGV4cHJlc3Npb24gd2hpY2ggc2VlbXMgdG8gY2F1c2UgaW50ZXJuYWwgZ29vZ2xlIGFwcHMgdG8gZmFpbC4gVGhpcyBpcyBkb2N1bWVudGVkXG4gICAgICAvLyBpbiB0aGUgZm9sbG93aW5nIGludGVybmFsIGJ1ZyBpc3N1ZTogZ28vYi8xNDI5Njc4MDJcbiAgICAgIGNvbnN0IHJlc3VsdCA9IF9pbmplY3Rvci5nZXQoRW52aXJvbm1lbnRJbmplY3RvciwgbnVsbCk7XG4gICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgIGVudmlyb25tZW50SW5qZWN0b3IgPSByZXN1bHQ7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgY29tcG9uZW50RGVmID0gZ2V0Q29tcG9uZW50RGVmKGNvbXBvbmVudEZhY3RvcnkuY29tcG9uZW50VHlwZSA/PyB7fSk7XG4gICAgY29uc3QgZGVoeWRyYXRlZFZpZXcgPSBmaW5kTWF0Y2hpbmdEZWh5ZHJhdGVkVmlldyh0aGlzLl9sQ29udGFpbmVyLCBjb21wb25lbnREZWY/LmlkID8/IG51bGwpO1xuICAgIGNvbnN0IHJOb2RlID0gZGVoeWRyYXRlZFZpZXc/LmZpcnN0Q2hpbGQgPz8gbnVsbDtcbiAgICBjb25zdCBjb21wb25lbnRSZWYgPVxuICAgICAgICBjb21wb25lbnRGYWN0b3J5LmNyZWF0ZShjb250ZXh0SW5qZWN0b3IsIHByb2plY3RhYmxlTm9kZXMsIHJOb2RlLCBlbnZpcm9ubWVudEluamVjdG9yKTtcbiAgICB0aGlzLmluc2VydEltcGwoY29tcG9uZW50UmVmLmhvc3RWaWV3LCBpbmRleCwgISFkZWh5ZHJhdGVkVmlldyk7XG4gICAgcmV0dXJuIGNvbXBvbmVudFJlZjtcbiAgfVxuXG4gIG92ZXJyaWRlIGluc2VydCh2aWV3UmVmOiBWaWV3UmVmLCBpbmRleD86IG51bWJlcik6IFZpZXdSZWYge1xuICAgIHJldHVybiB0aGlzLmluc2VydEltcGwodmlld1JlZiwgaW5kZXgsIGZhbHNlKTtcbiAgfVxuXG4gIHByaXZhdGUgaW5zZXJ0SW1wbCh2aWV3UmVmOiBWaWV3UmVmLCBpbmRleD86IG51bWJlciwgc2tpcERvbUluc2VydGlvbj86IGJvb2xlYW4pOiBWaWV3UmVmIHtcbiAgICBjb25zdCBsVmlldyA9ICh2aWV3UmVmIGFzIFIzVmlld1JlZjxhbnk+KS5fbFZpZXchO1xuICAgIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuXG4gICAgaWYgKG5nRGV2TW9kZSAmJiB2aWV3UmVmLmRlc3Ryb3llZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgaW5zZXJ0IGEgZGVzdHJveWVkIFZpZXcgaW4gYSBWaWV3Q29udGFpbmVyIScpO1xuICAgIH1cblxuICAgIGlmICh2aWV3QXR0YWNoZWRUb0NvbnRhaW5lcihsVmlldykpIHtcbiAgICAgIC8vIElmIHZpZXcgaXMgYWxyZWFkeSBhdHRhY2hlZCwgZGV0YWNoIGl0IGZpcnN0IHNvIHdlIGNsZWFuIHVwIHJlZmVyZW5jZXMgYXBwcm9wcmlhdGVseS5cblxuICAgICAgY29uc3QgcHJldklkeCA9IHRoaXMuaW5kZXhPZih2aWV3UmVmKTtcblxuICAgICAgLy8gQSB2aWV3IG1pZ2h0IGJlIGF0dGFjaGVkIGVpdGhlciB0byB0aGlzIG9yIGEgZGlmZmVyZW50IGNvbnRhaW5lci4gVGhlIGBwcmV2SWR4YCBmb3JcbiAgICAgIC8vIHRob3NlIGNhc2VzIHdpbGwgYmU6XG4gICAgICAvLyBlcXVhbCB0byAtMSBmb3Igdmlld3MgYXR0YWNoZWQgdG8gdGhpcyBWaWV3Q29udGFpbmVyUmVmXG4gICAgICAvLyA+PSAwIGZvciB2aWV3cyBhdHRhY2hlZCB0byBhIGRpZmZlcmVudCBWaWV3Q29udGFpbmVyUmVmXG4gICAgICBpZiAocHJldklkeCAhPT0gLTEpIHtcbiAgICAgICAgdGhpcy5kZXRhY2gocHJldklkeCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBwcmV2TENvbnRhaW5lciA9IGxWaWV3W1BBUkVOVF0gYXMgTENvbnRhaW5lcjtcbiAgICAgICAgbmdEZXZNb2RlICYmXG4gICAgICAgICAgICBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICBpc0xDb250YWluZXIocHJldkxDb250YWluZXIpLCB0cnVlLFxuICAgICAgICAgICAgICAgICdBbiBhdHRhY2hlZCB2aWV3IHNob3VsZCBoYXZlIGl0cyBQQVJFTlQgcG9pbnQgdG8gYSBjb250YWluZXIuJyk7XG5cblxuICAgICAgICAvLyBXZSBuZWVkIHRvIHJlLWNyZWF0ZSBhIFIzVmlld0NvbnRhaW5lclJlZiBpbnN0YW5jZSBzaW5jZSB0aG9zZSBhcmUgbm90IHN0b3JlZCBvblxuICAgICAgICAvLyBMVmlldyAobm9yIGFueXdoZXJlIGVsc2UpLlxuICAgICAgICBjb25zdCBwcmV2VkNSZWYgPSBuZXcgUjNWaWV3Q29udGFpbmVyUmVmKFxuICAgICAgICAgICAgcHJldkxDb250YWluZXIsIHByZXZMQ29udGFpbmVyW1RfSE9TVF0gYXMgVERpcmVjdGl2ZUhvc3ROb2RlLCBwcmV2TENvbnRhaW5lcltQQVJFTlRdKTtcblxuICAgICAgICBwcmV2VkNSZWYuZGV0YWNoKHByZXZWQ1JlZi5pbmRleE9mKHZpZXdSZWYpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBMb2dpY2FsIG9wZXJhdGlvbiBvZiBhZGRpbmcgYExWaWV3YCB0byBgTENvbnRhaW5lcmBcbiAgICBjb25zdCBhZGp1c3RlZElkeCA9IHRoaXMuX2FkanVzdEluZGV4KGluZGV4KTtcbiAgICBjb25zdCBsQ29udGFpbmVyID0gdGhpcy5fbENvbnRhaW5lcjtcbiAgICBpbnNlcnRWaWV3KHRWaWV3LCBsVmlldywgbENvbnRhaW5lciwgYWRqdXN0ZWRJZHgpO1xuXG4gICAgLy8gUGh5c2ljYWwgb3BlcmF0aW9uIG9mIGFkZGluZyB0aGUgRE9NIG5vZGVzLlxuICAgIGlmICghc2tpcERvbUluc2VydGlvbikge1xuICAgICAgY29uc3QgYmVmb3JlTm9kZSA9IGdldEJlZm9yZU5vZGVGb3JWaWV3KGFkanVzdGVkSWR4LCBsQ29udGFpbmVyKTtcbiAgICAgIGNvbnN0IHJlbmRlcmVyID0gbFZpZXdbUkVOREVSRVJdO1xuICAgICAgY29uc3QgcGFyZW50Uk5vZGUgPSBuYXRpdmVQYXJlbnROb2RlKHJlbmRlcmVyLCBsQ29udGFpbmVyW05BVElWRV0gYXMgUkVsZW1lbnQgfCBSQ29tbWVudCk7XG4gICAgICBpZiAocGFyZW50Uk5vZGUgIT09IG51bGwpIHtcbiAgICAgICAgYWRkVmlld1RvQ29udGFpbmVyKHRWaWV3LCBsQ29udGFpbmVyW1RfSE9TVF0sIHJlbmRlcmVyLCBsVmlldywgcGFyZW50Uk5vZGUsIGJlZm9yZU5vZGUpO1xuICAgICAgfVxuICAgIH1cblxuICAgICh2aWV3UmVmIGFzIFIzVmlld1JlZjxhbnk+KS5hdHRhY2hUb1ZpZXdDb250YWluZXJSZWYoKTtcbiAgICBhZGRUb0FycmF5KGdldE9yQ3JlYXRlVmlld1JlZnMobENvbnRhaW5lciksIGFkanVzdGVkSWR4LCB2aWV3UmVmKTtcblxuICAgIHJldHVybiB2aWV3UmVmO1xuICB9XG5cbiAgb3ZlcnJpZGUgbW92ZSh2aWV3UmVmOiBWaWV3UmVmLCBuZXdJbmRleDogbnVtYmVyKTogVmlld1JlZiB7XG4gICAgaWYgKG5nRGV2TW9kZSAmJiB2aWV3UmVmLmRlc3Ryb3llZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgbW92ZSBhIGRlc3Ryb3llZCBWaWV3IGluIGEgVmlld0NvbnRhaW5lciEnKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuaW5zZXJ0KHZpZXdSZWYsIG5ld0luZGV4KTtcbiAgfVxuXG4gIG92ZXJyaWRlIGluZGV4T2Yodmlld1JlZjogVmlld1JlZik6IG51bWJlciB7XG4gICAgY29uc3Qgdmlld1JlZnNBcnIgPSBnZXRWaWV3UmVmcyh0aGlzLl9sQ29udGFpbmVyKTtcbiAgICByZXR1cm4gdmlld1JlZnNBcnIgIT09IG51bGwgPyB2aWV3UmVmc0Fyci5pbmRleE9mKHZpZXdSZWYpIDogLTE7XG4gIH1cblxuICBvdmVycmlkZSByZW1vdmUoaW5kZXg/OiBudW1iZXIpOiB2b2lkIHtcbiAgICBjb25zdCBhZGp1c3RlZElkeCA9IHRoaXMuX2FkanVzdEluZGV4KGluZGV4LCAtMSk7XG4gICAgY29uc3QgZGV0YWNoZWRWaWV3ID0gZGV0YWNoVmlldyh0aGlzLl9sQ29udGFpbmVyLCBhZGp1c3RlZElkeCk7XG5cbiAgICBpZiAoZGV0YWNoZWRWaWV3KSB7XG4gICAgICAvLyBCZWZvcmUgZGVzdHJveWluZyB0aGUgdmlldywgcmVtb3ZlIGl0IGZyb20gdGhlIGNvbnRhaW5lcidzIGFycmF5IG9mIGBWaWV3UmVmYHMuXG4gICAgICAvLyBUaGlzIGVuc3VyZXMgdGhlIHZpZXcgY29udGFpbmVyIGxlbmd0aCBpcyB1cGRhdGVkIGJlZm9yZSBjYWxsaW5nXG4gICAgICAvLyBgZGVzdHJveUxWaWV3YCwgd2hpY2ggY291bGQgcmVjdXJzaXZlbHkgY2FsbCB2aWV3IGNvbnRhaW5lciBtZXRob2RzIHRoYXRcbiAgICAgIC8vIHJlbHkgb24gYW4gYWNjdXJhdGUgY29udGFpbmVyIGxlbmd0aC5cbiAgICAgIC8vIChlLmcuIGEgbWV0aG9kIG9uIHRoaXMgdmlldyBjb250YWluZXIgYmVpbmcgY2FsbGVkIGJ5IGEgY2hpbGQgZGlyZWN0aXZlJ3MgT25EZXN0cm95XG4gICAgICAvLyBsaWZlY3ljbGUgaG9vaylcbiAgICAgIHJlbW92ZUZyb21BcnJheShnZXRPckNyZWF0ZVZpZXdSZWZzKHRoaXMuX2xDb250YWluZXIpLCBhZGp1c3RlZElkeCk7XG4gICAgICBkZXN0cm95TFZpZXcoZGV0YWNoZWRWaWV3W1RWSUVXXSwgZGV0YWNoZWRWaWV3KTtcbiAgICB9XG4gIH1cblxuICBvdmVycmlkZSBkZXRhY2goaW5kZXg/OiBudW1iZXIpOiBWaWV3UmVmfG51bGwge1xuICAgIGNvbnN0IGFkanVzdGVkSWR4ID0gdGhpcy5fYWRqdXN0SW5kZXgoaW5kZXgsIC0xKTtcbiAgICBjb25zdCB2aWV3ID0gZGV0YWNoVmlldyh0aGlzLl9sQ29udGFpbmVyLCBhZGp1c3RlZElkeCk7XG5cbiAgICBjb25zdCB3YXNEZXRhY2hlZCA9XG4gICAgICAgIHZpZXcgJiYgcmVtb3ZlRnJvbUFycmF5KGdldE9yQ3JlYXRlVmlld1JlZnModGhpcy5fbENvbnRhaW5lciksIGFkanVzdGVkSWR4KSAhPSBudWxsO1xuICAgIHJldHVybiB3YXNEZXRhY2hlZCA/IG5ldyBSM1ZpZXdSZWYodmlldyEpIDogbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgX2FkanVzdEluZGV4KGluZGV4PzogbnVtYmVyLCBzaGlmdDogbnVtYmVyID0gMCkge1xuICAgIGlmIChpbmRleCA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gdGhpcy5sZW5ndGggKyBzaGlmdDtcbiAgICB9XG4gICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgYXNzZXJ0R3JlYXRlclRoYW4oaW5kZXgsIC0xLCBgVmlld1JlZiBpbmRleCBtdXN0IGJlIHBvc2l0aXZlLCBnb3QgJHtpbmRleH1gKTtcbiAgICAgIC8vICsxIGJlY2F1c2UgaXQncyBsZWdhbCB0byBpbnNlcnQgYXQgdGhlIGVuZC5cbiAgICAgIGFzc2VydExlc3NUaGFuKGluZGV4LCB0aGlzLmxlbmd0aCArIDEgKyBzaGlmdCwgJ2luZGV4Jyk7XG4gICAgfVxuICAgIHJldHVybiBpbmRleDtcbiAgfVxufTtcblxuZnVuY3Rpb24gZ2V0Vmlld1JlZnMobENvbnRhaW5lcjogTENvbnRhaW5lcik6IFZpZXdSZWZbXXxudWxsIHtcbiAgcmV0dXJuIGxDb250YWluZXJbVklFV19SRUZTXSBhcyBWaWV3UmVmW107XG59XG5cbmZ1bmN0aW9uIGdldE9yQ3JlYXRlVmlld1JlZnMobENvbnRhaW5lcjogTENvbnRhaW5lcik6IFZpZXdSZWZbXSB7XG4gIHJldHVybiAobENvbnRhaW5lcltWSUVXX1JFRlNdIHx8IChsQ29udGFpbmVyW1ZJRVdfUkVGU10gPSBbXSkpIGFzIFZpZXdSZWZbXTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgVmlld0NvbnRhaW5lclJlZiBhbmQgc3RvcmVzIGl0IG9uIHRoZSBpbmplY3Rvci5cbiAqXG4gKiBAcGFyYW0gaG9zdFROb2RlIFRoZSBub2RlIHRoYXQgaXMgcmVxdWVzdGluZyBhIFZpZXdDb250YWluZXJSZWZcbiAqIEBwYXJhbSBob3N0TFZpZXcgVGhlIHZpZXcgdG8gd2hpY2ggdGhlIG5vZGUgYmVsb25nc1xuICogQHJldHVybnMgVGhlIFZpZXdDb250YWluZXJSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVDb250YWluZXJSZWYoXG4gICAgaG9zdFROb2RlOiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlLFxuICAgIGhvc3RMVmlldzogTFZpZXcpOiBWaWV3Q29udGFpbmVyUmVmIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydFROb2RlVHlwZShob3N0VE5vZGUsIFROb2RlVHlwZS5BbnlDb250YWluZXIgfCBUTm9kZVR5cGUuQW55Uk5vZGUpO1xuXG4gIGxldCBsQ29udGFpbmVyOiBMQ29udGFpbmVyO1xuICBjb25zdCBzbG90VmFsdWUgPSBob3N0TFZpZXdbaG9zdFROb2RlLmluZGV4XTtcbiAgaWYgKGlzTENvbnRhaW5lcihzbG90VmFsdWUpKSB7XG4gICAgLy8gSWYgdGhlIGhvc3QgaXMgYSBjb250YWluZXIsIHdlIGRvbid0IG5lZWQgdG8gY3JlYXRlIGEgbmV3IExDb250YWluZXJcbiAgICBsQ29udGFpbmVyID0gc2xvdFZhbHVlO1xuICB9IGVsc2Uge1xuICAgIC8vIEFuIExDb250YWluZXIgYW5jaG9yIGNhbiBub3QgYmUgYG51bGxgLCBidXQgd2Ugc2V0IGl0IGhlcmUgdGVtcG9yYXJpbHlcbiAgICAvLyBhbmQgdXBkYXRlIHRvIHRoZSBhY3R1YWwgdmFsdWUgbGF0ZXIgaW4gdGhpcyBmdW5jdGlvbiAoc2VlXG4gICAgLy8gYF9sb2NhdGVPckNyZWF0ZUFuY2hvck5vZGVgKS5cbiAgICBsQ29udGFpbmVyID0gY3JlYXRlTENvbnRhaW5lcihzbG90VmFsdWUsIGhvc3RMVmlldywgbnVsbCEsIGhvc3RUTm9kZSk7XG4gICAgaG9zdExWaWV3W2hvc3RUTm9kZS5pbmRleF0gPSBsQ29udGFpbmVyO1xuICAgIGFkZFRvVmlld1RyZWUoaG9zdExWaWV3LCBsQ29udGFpbmVyKTtcbiAgfVxuICBfbG9jYXRlT3JDcmVhdGVBbmNob3JOb2RlKGxDb250YWluZXIsIGhvc3RMVmlldywgaG9zdFROb2RlLCBzbG90VmFsdWUpO1xuXG4gIHJldHVybiBuZXcgUjNWaWV3Q29udGFpbmVyUmVmKGxDb250YWluZXIsIGhvc3RUTm9kZSwgaG9zdExWaWV3KTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuZCBpbnNlcnRzIGEgY29tbWVudCBub2RlIHRoYXQgYWN0cyBhcyBhbiBhbmNob3IgZm9yIGEgdmlldyBjb250YWluZXIuXG4gKlxuICogSWYgdGhlIGhvc3QgaXMgYSByZWd1bGFyIGVsZW1lbnQsIHdlIGhhdmUgdG8gaW5zZXJ0IGEgY29tbWVudCBub2RlIG1hbnVhbGx5IHdoaWNoIHdpbGxcbiAqIGJlIHVzZWQgYXMgYW4gYW5jaG9yIHdoZW4gaW5zZXJ0aW5nIGVsZW1lbnRzLiBJbiB0aGlzIHNwZWNpZmljIGNhc2Ugd2UgdXNlIGxvdy1sZXZlbCBET01cbiAqIG1hbmlwdWxhdGlvbiB0byBpbnNlcnQgaXQuXG4gKi9cbmZ1bmN0aW9uIGluc2VydEFuY2hvck5vZGUoaG9zdExWaWV3OiBMVmlldywgaG9zdFROb2RlOiBUTm9kZSk6IFJDb21tZW50IHtcbiAgY29uc3QgcmVuZGVyZXIgPSBob3N0TFZpZXdbUkVOREVSRVJdO1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQ3JlYXRlQ29tbWVudCsrO1xuICBjb25zdCBjb21tZW50Tm9kZSA9IHJlbmRlcmVyLmNyZWF0ZUNvbW1lbnQobmdEZXZNb2RlID8gJ2NvbnRhaW5lcicgOiAnJyk7XG5cbiAgY29uc3QgaG9zdE5hdGl2ZSA9IGdldE5hdGl2ZUJ5VE5vZGUoaG9zdFROb2RlLCBob3N0TFZpZXcpITtcbiAgY29uc3QgcGFyZW50T2ZIb3N0TmF0aXZlID0gbmF0aXZlUGFyZW50Tm9kZShyZW5kZXJlciwgaG9zdE5hdGl2ZSk7XG4gIG5hdGl2ZUluc2VydEJlZm9yZShcbiAgICAgIHJlbmRlcmVyLCBwYXJlbnRPZkhvc3ROYXRpdmUhLCBjb21tZW50Tm9kZSwgbmF0aXZlTmV4dFNpYmxpbmcocmVuZGVyZXIsIGhvc3ROYXRpdmUpLCBmYWxzZSk7XG4gIHJldHVybiBjb21tZW50Tm9kZTtcbn1cblxubGV0IF9sb2NhdGVPckNyZWF0ZUFuY2hvck5vZGUgPSBjcmVhdGVBbmNob3JOb2RlO1xuXG4vKipcbiAqIFJlZ3VsYXIgY3JlYXRpb24gbW9kZTogYW4gYW5jaG9yIGlzIGNyZWF0ZWQgYW5kXG4gKiBhc3NpZ25lZCB0byB0aGUgYGxDb250YWluZXJbTkFUSVZFXWAgc2xvdC5cbiAqL1xuZnVuY3Rpb24gY3JlYXRlQW5jaG9yTm9kZShcbiAgICBsQ29udGFpbmVyOiBMQ29udGFpbmVyLCBob3N0TFZpZXc6IExWaWV3LCBob3N0VE5vZGU6IFROb2RlLCBzbG90VmFsdWU6IGFueSkge1xuICAvLyBXZSBhbHJlYWR5IGhhdmUgYSBuYXRpdmUgZWxlbWVudCAoYW5jaG9yKSBzZXQsIHJldHVybi5cbiAgaWYgKGxDb250YWluZXJbTkFUSVZFXSkgcmV0dXJuO1xuXG4gIGxldCBjb21tZW50Tm9kZTogUkNvbW1lbnQ7XG4gIC8vIElmIHRoZSBob3N0IGlzIGFuIGVsZW1lbnQgY29udGFpbmVyLCB0aGUgbmF0aXZlIGhvc3QgZWxlbWVudCBpcyBndWFyYW50ZWVkIHRvIGJlIGFcbiAgLy8gY29tbWVudCBhbmQgd2UgY2FuIHJldXNlIHRoYXQgY29tbWVudCBhcyBhbmNob3IgZWxlbWVudCBmb3IgdGhlIG5ldyBMQ29udGFpbmVyLlxuICAvLyBUaGUgY29tbWVudCBub2RlIGluIHF1ZXN0aW9uIGlzIGFscmVhZHkgcGFydCBvZiB0aGUgRE9NIHN0cnVjdHVyZSBzbyB3ZSBkb24ndCBuZWVkIHRvIGFwcGVuZFxuICAvLyBpdCBhZ2Fpbi5cbiAgaWYgKGhvc3RUTm9kZS50eXBlICYgVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpIHtcbiAgICBjb21tZW50Tm9kZSA9IHVud3JhcFJOb2RlKHNsb3RWYWx1ZSkgYXMgUkNvbW1lbnQ7XG4gIH0gZWxzZSB7XG4gICAgY29tbWVudE5vZGUgPSBpbnNlcnRBbmNob3JOb2RlKGhvc3RMVmlldywgaG9zdFROb2RlKTtcbiAgfVxuICBsQ29udGFpbmVyW05BVElWRV0gPSBjb21tZW50Tm9kZTtcbn1cblxuLyoqXG4gKiBIeWRyYXRpb24gbG9naWMgdGhhdCBsb29rcyB1cDpcbiAqICAtIGFuIGFuY2hvciBub2RlIGluIHRoZSBET00gYW5kIHN0b3JlcyB0aGUgbm9kZSBpbiBgbENvbnRhaW5lcltOQVRJVkVdYFxuICogIC0gYWxsIGRlaHlkcmF0ZWQgdmlld3MgaW4gdGhpcyBjb250YWluZXIgYW5kIHB1dHMgdGhlbSBpbnRvIGBsQ29udGFpbmVyW0RFSFlEUkFURURfVklFV1NdYFxuICovXG5mdW5jdGlvbiBsb2NhdGVPckNyZWF0ZUFuY2hvck5vZGUoXG4gICAgbENvbnRhaW5lcjogTENvbnRhaW5lciwgaG9zdExWaWV3OiBMVmlldywgaG9zdFROb2RlOiBUTm9kZSwgc2xvdFZhbHVlOiBhbnkpIHtcbiAgLy8gV2UgYWxyZWFkeSBoYXZlIGEgbmF0aXZlIGVsZW1lbnQgKGFuY2hvcikgc2V0IGFuZCB0aGUgcHJvY2Vzc1xuICAvLyBvZiBmaW5kaW5nIGRlaHlkcmF0ZWQgdmlld3MgaGFwcGVuZWQgKHNvIHRoZSBgbENvbnRhaW5lcltERUhZRFJBVEVEX1ZJRVdTXWBcbiAgLy8gaXMgbm90IG51bGwpLCBleGl0IGVhcmx5LlxuICBpZiAobENvbnRhaW5lcltOQVRJVkVdICYmIGxDb250YWluZXJbREVIWURSQVRFRF9WSUVXU10pIHJldHVybjtcblxuICBjb25zdCBoeWRyYXRpb25JbmZvID0gaG9zdExWaWV3W0hZRFJBVElPTl07XG4gIGNvbnN0IGlzTm9kZUNyZWF0aW9uTW9kZSA9ICFoeWRyYXRpb25JbmZvIHx8IGlzSW5Ta2lwSHlkcmF0aW9uQmxvY2soaG9zdFROb2RlKTtcblxuICAvLyBSZWd1bGFyIGNyZWF0aW9uIG1vZGUuXG4gIGlmIChpc05vZGVDcmVhdGlvbk1vZGUpIHtcbiAgICByZXR1cm4gY3JlYXRlQW5jaG9yTm9kZShsQ29udGFpbmVyLCBob3N0TFZpZXcsIGhvc3RUTm9kZSwgc2xvdFZhbHVlKTtcbiAgfVxuXG4gIC8vIEh5ZHJhdGlvbiBtb2RlLCBsb29raW5nIHVwIGFuIGFuY2hvciBub2RlIGFuZCBkZWh5ZHJhdGVkIHZpZXdzIGluIERPTS5cbiAgY29uc3QgaW5kZXggPSBob3N0VE5vZGUuaW5kZXggLSBIRUFERVJfT0ZGU0VUO1xuICBjb25zdCBjdXJyZW50Uk5vZGU6IFJOb2RlfG51bGwgPSBnZXRTZWdtZW50SGVhZChoeWRyYXRpb25JbmZvLCBpbmRleCk7XG5cbiAgY29uc3Qgc2VyaWFsaXplZFZpZXdzID0gaHlkcmF0aW9uSW5mby5kYXRhW0NPTlRBSU5FUlNdPy5baW5kZXhdO1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydERlZmluZWQoXG4gICAgICAgICAgc2VyaWFsaXplZFZpZXdzLFxuICAgICAgICAgICdVbmV4cGVjdGVkIHN0YXRlOiBubyBoeWRyYXRpb24gaW5mbyBhdmFpbGFibGUgZm9yIGEgZ2l2ZW4gVE5vZGUsICcgK1xuICAgICAgICAgICAgICAnd2hpY2ggcmVwcmVzZW50cyBhIHZpZXcgY29udGFpbmVyLicpO1xuXG4gIGNvbnN0IFtjb21tZW50Tm9kZSwgZGVoeWRyYXRlZFZpZXdzXSA9XG4gICAgICBsb2NhdGVEZWh5ZHJhdGVkVmlld3NJbkNvbnRhaW5lcihjdXJyZW50Uk5vZGUhLCBzZXJpYWxpemVkVmlld3MhKTtcblxuICBpZiAobmdEZXZNb2RlKSB7XG4gICAgdmFsaWRhdGVNYXRjaGluZ05vZGUoY29tbWVudE5vZGUsIE5vZGUuQ09NTUVOVF9OT0RFLCBudWxsLCBob3N0TFZpZXcsIGhvc3RUTm9kZSk7XG4gICAgLy8gRG8gbm90IHRocm93IGluIGNhc2UgdGhpcyBub2RlIGlzIGFscmVhZHkgY2xhaW1lZCAodGh1cyBgZmFsc2VgIGFzIGEgc2Vjb25kXG4gICAgLy8gYXJndW1lbnQpLiBJZiB0aGlzIGNvbnRhaW5lciBpcyBjcmVhdGVkIGJhc2VkIG9uIGFuIGA8bmctdGVtcGxhdGU+YCwgdGhlIGNvbW1lbnRcbiAgICAvLyBub2RlIHdvdWxkIGJlIGFscmVhZHkgY2xhaW1lZCBmcm9tIHRoZSBgdGVtcGxhdGVgIGluc3RydWN0aW9uLiBJZiBhbiBlbGVtZW50IGFjdHNcbiAgICAvLyBhcyBhbiBhbmNob3IgKGUuZy4gPGRpdiAjdmNSZWY+KSwgYSBzZXBhcmF0ZSBjb21tZW50IG5vZGUgd291bGQgYmUgY3JlYXRlZC9sb2NhdGVkLFxuICAgIC8vIHNvIHdlIG5lZWQgdG8gY2xhaW0gaXQgaGVyZS5cbiAgICBtYXJrUk5vZGVBc0NsYWltZWRCeUh5ZHJhdGlvbihjb21tZW50Tm9kZSwgZmFsc2UpO1xuICB9XG5cbiAgbENvbnRhaW5lcltOQVRJVkVdID0gY29tbWVudE5vZGUgYXMgUkNvbW1lbnQ7XG4gIGxDb250YWluZXJbREVIWURSQVRFRF9WSUVXU10gPSBkZWh5ZHJhdGVkVmlld3M7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbmFibGVMb2NhdGVPckNyZWF0ZUNvbnRhaW5lclJlZkltcGwoKSB7XG4gIF9sb2NhdGVPckNyZWF0ZUFuY2hvck5vZGUgPSBsb2NhdGVPckNyZWF0ZUFuY2hvck5vZGU7XG59XG4iXX0=