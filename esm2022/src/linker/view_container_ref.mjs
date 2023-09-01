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
import { destroyLView, detachView, nativeInsertBefore, nativeNextSibling, nativeParentNode } from '../render3/node_manipulation';
import { getCurrentTNode, getLView } from '../render3/state';
import { getParentInjectorIndex, getParentInjectorView, hasParentInjector } from '../render3/util/injector_utils';
import { getNativeByTNode, unwrapRNode, viewAttachedToContainer } from '../render3/util/view_utils';
import { addLViewToLContainer, shouldAddViewToDom } from '../render3/view_manipulation';
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
 * @usageNotes
 *
 * The example below demonstrates how the `createComponent` function can be used
 * to create an instance of a ComponentRef dynamically and attach it to an ApplicationRef,
 * so that it gets included into change detection cycles.
 *
 * Note: the example uses standalone components, but the function can also be used for
 * non-standalone components (declared in an NgModule) as well.
 *
 * ```typescript
 * @Component({
 *   standalone: true,
 *   selector: 'dynamic',
 *   template: `<span>This is a content of a dynamic component.</span>`,
 * })
 * class DynamicComponent {
 *   vcr = inject(ViewContainerRef);
 * }
 *
 * @Component({
 *   standalone: true,
 *   selector: 'app',
 *   template: `<main>Hi! This is the main content.</main>`,
 * })
 * class AppComponent {
 *   vcr = inject(ViewContainerRef);
 *
 *   ngAfterViewInit() {
 *     const compRef = this.vcr.createComponent(DynamicComponent);
 *     compRef.changeDetectorRef.detectChanges();
 *   }
 * }
 * ```
 *
 * @see {@link ComponentRef}
 * @see {@link EmbeddedViewRef}
 *
 * @publicApi
 */
export class ViewContainerRef {
    /**
     * @internal
     * @nocollapse
     */
    static { this.__NG_ELEMENT_ID__ = injectViewContainerRef; }
}
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
        const dehydratedView = findMatchingDehydratedView(this._lContainer, templateRef.ssrId);
        const viewRef = templateRef.createEmbeddedViewImpl(context || {}, injector, dehydratedView);
        this.insertImpl(viewRef, index, shouldAddViewToDom(this._hostTNode, dehydratedView));
        return viewRef;
    }
    createComponent(componentFactoryOrType, indexOrOptions, injector, projectableNodes, environmentInjector) {
        const isComponentFactory = componentFactoryOrType && !isType(componentFactoryOrType);
        let index;
        // This function supports 2 signatures and we need to handle options correctly for both:
        //   1. When first argument is a Component type. This signature also requires extra
        //      options to be provided as object (more ergonomic option).
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
        this.insertImpl(componentRef.hostView, index, shouldAddViewToDom(this._hostTNode, dehydratedView));
        return componentRef;
    }
    insert(viewRef, index) {
        return this.insertImpl(viewRef, index, true);
    }
    insertImpl(viewRef, index, addToDOM) {
        const lView = viewRef._lView;
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
        addLViewToLContainer(lContainer, lView, adjustedIdx, addToDOM);
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
let _populateDehydratedViewsInContainer = (lContainer, lView, tNode) => false; // noop by default
/**
 * Looks up dehydrated views that belong to a given LContainer and populates
 * this information into the `LContainer[DEHYDRATED_VIEWS]` slot. When running
 * in client-only mode, this function is a noop.
 *
 * @param lContainer LContainer that should be populated.
 * @returns a boolean flag that indicates whether a populating operation
 *   was successful. The operation might be unsuccessful in case is has completed
 *   previously, we are rendering in client-only mode or this content is located
 *   in a skip hydration section.
 */
export function populateDehydratedViewsInContainer(lContainer) {
    return _populateDehydratedViewsInContainer(lContainer, getLView(), getCurrentTNode());
}
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
 * Hydration logic that looks up all dehydrated views in this container
 * and puts them into `lContainer[DEHYDRATED_VIEWS]` slot.
 *
 * @returns a boolean flag that indicates whether a populating operation
 *   was successful. The operation might be unsuccessful in case is has completed
 *   previously, we are rendering in client-only mode or this content is located
 *   in a skip hydration section.
 */
function populateDehydratedViewsInContainerImpl(lContainer, hostLView, hostTNode) {
    // We already have a native element (anchor) set and the process
    // of finding dehydrated views happened (so the `lContainer[DEHYDRATED_VIEWS]`
    // is not null), exit early.
    if (lContainer[NATIVE] && lContainer[DEHYDRATED_VIEWS]) {
        return true;
    }
    const hydrationInfo = hostLView[HYDRATION];
    const noOffsetIndex = hostTNode.index - HEADER_OFFSET;
    // TODO(akushnir): this should really be a single condition, refactor the code
    // to use `hasInSkipHydrationBlockFlag` logic inside `isInSkipHydrationBlock`.
    const skipHydration = isInSkipHydrationBlock(hostTNode) || hasInSkipHydrationBlockFlag(hostTNode);
    const isNodeCreationMode = !hydrationInfo || skipHydration || isDisconnectedNode(hydrationInfo, noOffsetIndex);
    // Regular creation mode.
    if (isNodeCreationMode) {
        return false;
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
    return true;
}
function locateOrCreateAnchorNode(lContainer, hostLView, hostTNode, slotValue) {
    if (!_populateDehydratedViewsInContainer(lContainer, hostLView, hostTNode)) {
        // Populating dehydrated views operation returned `false`, which indicates
        // that the logic was running in client-only mode, this an anchor comment
        // node should be created for this container.
        createAnchorNode(lContainer, hostLView, hostTNode, slotValue);
    }
}
export function enableLocateOrCreateContainerRefImpl() {
    _locateOrCreateAnchorNode = locateOrCreateAnchorNode;
    _populateDehydratedViewsInContainer = populateDehydratedViewsInContainerImpl;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld19jb250YWluZXJfcmVmLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvbGlua2VyL3ZpZXdfY29udGFpbmVyX3JlZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFHSCxPQUFPLEVBQUMsbUJBQW1CLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUN0RCxPQUFPLEVBQUMsb0JBQW9CLEVBQUMsTUFBTSw2QkFBNkIsQ0FBQztBQUNqRSxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFDbkQsT0FBTyxFQUFDLDJCQUEyQixFQUFFLHNCQUFzQixFQUFDLE1BQU0sNkJBQTZCLENBQUM7QUFDaEcsT0FBTyxFQUFDLGNBQWMsRUFBRSxrQkFBa0IsRUFBRSw2QkFBNkIsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQ3JHLE9BQU8sRUFBQywwQkFBMEIsRUFBRSxnQ0FBZ0MsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQ2hHLE9BQU8sRUFBQyxNQUFNLEVBQU8sTUFBTSxtQkFBbUIsQ0FBQztBQUMvQyxPQUFPLEVBQUMsa0JBQWtCLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNyRCxPQUFPLEVBQUMsZ0JBQWdCLElBQUksa0JBQWtCLEVBQUMsTUFBTSwwQkFBMEIsQ0FBQztBQUNoRixPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDdEQsT0FBTyxFQUFDLHlCQUF5QixFQUFFLFlBQVksRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUN0RSxPQUFPLEVBQUMsYUFBYSxFQUFFLGdCQUFnQixFQUFDLE1BQU0sZ0NBQWdDLENBQUM7QUFDL0UsT0FBTyxFQUFDLHVCQUF1QixFQUFFLGdCQUFnQixFQUFjLE1BQU0sRUFBRSxTQUFTLEVBQUMsTUFBTSxpQ0FBaUMsQ0FBQztBQUl6SCxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sbUNB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QUFzQixFQUFFLFNBQWdCLEVBQUUsU0FBZ0IsRUFBRSxTQUFjO0lBQzVFLElBQUksQ0FBQyxtQ0FBbUMsQ0FBQyxVQUFVLEVBQUUsU0FBUyxFQUFFLFNBQVMsQ0FBQyxFQUFFO1FBQzFFLDBFQUEwRTtRQUMxRSx5RUFBeUU7UUFDekUsNkNBQTZDO1FBQzdDLGdCQUFnQixDQUFDLFVBQVUsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0tBQy9EO0FBQ0gsQ0FBQztBQUVELE1BQU0sVUFBVSxvQ0FBb0M7SUFDbEQseUJBQXlCLEdBQUcsd0JBQXdCLENBQUM7SUFDckQsbUNBQW1DLEdBQUcsc0NBQXNDLENBQUM7QUFDL0UsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdG9yfSBmcm9tICcuLi9kaS9pbmplY3Rvcic7XG5pbXBvcnQge0Vudmlyb25tZW50SW5qZWN0b3J9IGZyb20gJy4uL2RpL3IzX2luamVjdG9yJztcbmltcG9ydCB7dmFsaWRhdGVNYXRjaGluZ05vZGV9IGZyb20gJy4uL2h5ZHJhdGlvbi9lcnJvcl9oYW5kbGluZyc7XG5pbXBvcnQge0NPTlRBSU5FUlN9IGZyb20gJy4uL2h5ZHJhdGlvbi9pbnRlcmZhY2VzJztcbmltcG9ydCB7aGFzSW5Ta2lwSHlkcmF0aW9uQmxvY2tGbGFnLCBpc0luU2tpcEh5ZHJhdGlvbkJsb2NrfSBmcm9tICcuLi9oeWRyYXRpb24vc2tpcF9oeWRyYXRpb24nO1xuaW1wb3J0IHtnZXRTZWdtZW50SGVhZCwgaXNEaXNjb25uZWN0ZWROb2RlLCBtYXJrUk5vZGVBc0NsYWltZWRCeUh5ZHJhdGlvbn0gZnJvbSAnLi4vaHlkcmF0aW9uL3V0aWxzJztcbmltcG9ydCB7ZmluZE1hdGNoaW5nRGVoeWRyYXRlZFZpZXcsIGxvY2F0ZURlaHlkcmF0ZWRWaWV3c0luQ29udGFpbmVyfSBmcm9tICcuLi9oeWRyYXRpb24vdmlld3MnO1xuaW1wb3J0IHtpc1R5cGUsIFR5cGV9IGZyb20gJy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7YXNzZXJ0Tm9kZUluamVjdG9yfSBmcm9tICcuLi9yZW5kZXIzL2Fzc2VydCc7XG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnkgYXMgUjNDb21wb25lbnRGYWN0b3J5fSBmcm9tICcuLi9yZW5kZXIzL2NvbXBvbmVudF9yZWYnO1xuaW1wb3J0IHtnZXRDb21wb25lbnREZWZ9IGZyb20gJy4uL3JlbmRlcjMvZGVmaW5pdGlvbic7XG5pbXBvcnQge2dldFBhcmVudEluamVjdG9yTG9jYXRpb24sIE5vZGVJbmplY3Rvcn0gZnJvbSAnLi4vcmVuZGVyMy9kaSc7XG5pbXBvcnQge2FkZFRvVmlld1RyZWUsIGNyZWF0ZUxDb250YWluZXJ9IGZyb20gJy4uL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL3NoYXJlZCc7XG5pbXBvcnQge0NPTlRBSU5FUl9IRUFERVJfT0ZGU0VULCBERUhZRFJBVEVEX1ZJRVdTLCBMQ29udGFpbmVyLCBOQVRJVkUsIFZJRVdfUkVGU30gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge05vZGVJbmplY3Rvck9mZnNldH0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL2luamVjdG9yJztcbmltcG9ydCB7VENvbnRhaW5lck5vZGUsIFREaXJlY3RpdmVIb3N0Tm9kZSwgVEVsZW1lbnRDb250YWluZXJOb2RlLCBURWxlbWVudE5vZGUsIFROb2RlLCBUTm9kZVR5cGV9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7UkNvbW1lbnQsIFJOb2RlfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvcmVuZGVyZXJfZG9tJztcbmltcG9ydCB7aXNMQ29udGFpbmVyfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvdHlwZV9jaGVja3MnO1xuaW1wb3J0IHtIRUFERVJfT0ZGU0VULCBIWURSQVRJT04sIExWaWV3LCBQQVJFTlQsIFJFTkRFUkVSLCBUX0hPU1QsIFRWSUVXfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydFROb2RlVHlwZX0gZnJvbSAnLi4vcmVuZGVyMy9ub2RlX2Fzc2VydCc7XG5pbXBvcnQge2Rlc3Ryb3lMVmlldywgZGV0YWNoVmlldywgbmF0aXZlSW5zZXJ0QmVmb3JlLCBuYXRpdmVOZXh0U2libGluZywgbmF0aXZlUGFyZW50Tm9kZX0gZnJvbSAnLi4vcmVuZGVyMy9ub2RlX21hbmlwdWxhdGlvbic7XG5pbXBvcnQge2dldEN1cnJlbnRUTm9kZSwgZ2V0TFZpZXd9IGZyb20gJy4uL3JlbmRlcjMvc3RhdGUnO1xuaW1wb3J0IHtnZXRQYXJlbnRJbmplY3RvckluZGV4LCBnZXRQYXJlbnRJbmplY3RvclZpZXcsIGhhc1BhcmVudEluamVjdG9yfSBmcm9tICcuLi9yZW5kZXIzL3V0aWwvaW5qZWN0b3JfdXRpbHMnO1xuaW1wb3J0IHtnZXROYXRpdmVCeVROb2RlLCB1bndyYXBSTm9kZSwgdmlld0F0dGFjaGVkVG9Db250YWluZXJ9IGZyb20gJy4uL3JlbmRlcjMvdXRpbC92aWV3X3V0aWxzJztcbmltcG9ydCB7YWRkTFZpZXdUb0xDb250YWluZXIsIHNob3VsZEFkZFZpZXdUb0RvbX0gZnJvbSAnLi4vcmVuZGVyMy92aWV3X21hbmlwdWxhdGlvbic7XG5pbXBvcnQge1ZpZXdSZWYgYXMgUjNWaWV3UmVmfSBmcm9tICcuLi9yZW5kZXIzL3ZpZXdfcmVmJztcbmltcG9ydCB7YWRkVG9BcnJheSwgcmVtb3ZlRnJvbUFycmF5fSBmcm9tICcuLi91dGlsL2FycmF5X3V0aWxzJztcbmltcG9ydCB7YXNzZXJ0RGVmaW5lZCwgYXNzZXJ0RXF1YWwsIGFzc2VydEdyZWF0ZXJUaGFuLCBhc3NlcnRMZXNzVGhhbiwgdGhyb3dFcnJvcn0gZnJvbSAnLi4vdXRpbC9hc3NlcnQnO1xuXG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnksIENvbXBvbmVudFJlZn0gZnJvbSAnLi9jb21wb25lbnRfZmFjdG9yeSc7XG5pbXBvcnQge2NyZWF0ZUVsZW1lbnRSZWYsIEVsZW1lbnRSZWZ9IGZyb20gJy4vZWxlbWVudF9yZWYnO1xuaW1wb3J0IHtOZ01vZHVsZVJlZn0gZnJvbSAnLi9uZ19tb2R1bGVfZmFjdG9yeSc7XG5pbXBvcnQge1RlbXBsYXRlUmVmfSBmcm9tICcuL3RlbXBsYXRlX3JlZic7XG5pbXBvcnQge0VtYmVkZGVkVmlld1JlZiwgVmlld1JlZn0gZnJvbSAnLi92aWV3X3JlZic7XG5cbi8qKlxuICogUmVwcmVzZW50cyBhIGNvbnRhaW5lciB3aGVyZSBvbmUgb3IgbW9yZSB2aWV3cyBjYW4gYmUgYXR0YWNoZWQgdG8gYSBjb21wb25lbnQuXG4gKlxuICogQ2FuIGNvbnRhaW4gKmhvc3Qgdmlld3MqIChjcmVhdGVkIGJ5IGluc3RhbnRpYXRpbmcgYVxuICogY29tcG9uZW50IHdpdGggdGhlIGBjcmVhdGVDb21wb25lbnQoKWAgbWV0aG9kKSwgYW5kICplbWJlZGRlZCB2aWV3cypcbiAqIChjcmVhdGVkIGJ5IGluc3RhbnRpYXRpbmcgYSBgVGVtcGxhdGVSZWZgIHdpdGggdGhlIGBjcmVhdGVFbWJlZGRlZFZpZXcoKWAgbWV0aG9kKS5cbiAqXG4gKiBBIHZpZXcgY29udGFpbmVyIGluc3RhbmNlIGNhbiBjb250YWluIG90aGVyIHZpZXcgY29udGFpbmVycyxcbiAqIGNyZWF0aW5nIGEgW3ZpZXcgaGllcmFyY2h5XShndWlkZS9nbG9zc2FyeSN2aWV3LWhpZXJhcmNoeSkuXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqXG4gKiBUaGUgZXhhbXBsZSBiZWxvdyBkZW1vbnN0cmF0ZXMgaG93IHRoZSBgY3JlYXRlQ29tcG9uZW50YCBmdW5jdGlvbiBjYW4gYmUgdXNlZFxuICogdG8gY3JlYXRlIGFuIGluc3RhbmNlIG9mIGEgQ29tcG9uZW50UmVmIGR5bmFtaWNhbGx5IGFuZCBhdHRhY2ggaXQgdG8gYW4gQXBwbGljYXRpb25SZWYsXG4gKiBzbyB0aGF0IGl0IGdldHMgaW5jbHVkZWQgaW50byBjaGFuZ2UgZGV0ZWN0aW9uIGN5Y2xlcy5cbiAqXG4gKiBOb3RlOiB0aGUgZXhhbXBsZSB1c2VzIHN0YW5kYWxvbmUgY29tcG9uZW50cywgYnV0IHRoZSBmdW5jdGlvbiBjYW4gYWxzbyBiZSB1c2VkIGZvclxuICogbm9uLXN0YW5kYWxvbmUgY29tcG9uZW50cyAoZGVjbGFyZWQgaW4gYW4gTmdNb2R1bGUpIGFzIHdlbGwuXG4gKlxuICogYGBgdHlwZXNjcmlwdFxuICogQENvbXBvbmVudCh7XG4gKiAgIHN0YW5kYWxvbmU6IHRydWUsXG4gKiAgIHNlbGVjdG9yOiAnZHluYW1pYycsXG4gKiAgIHRlbXBsYXRlOiBgPHNwYW4+VGhpcyBpcyBhIGNvbnRlbnQgb2YgYSBkeW5hbWljIGNvbXBvbmVudC48L3NwYW4+YCxcbiAqIH0pXG4gKiBjbGFzcyBEeW5hbWljQ29tcG9uZW50IHtcbiAqICAgdmNyID0gaW5qZWN0KFZpZXdDb250YWluZXJSZWYpO1xuICogfVxuICpcbiAqIEBDb21wb25lbnQoe1xuICogICBzdGFuZGFsb25lOiB0cnVlLFxuICogICBzZWxlY3RvcjogJ2FwcCcsXG4gKiAgIHRlbXBsYXRlOiBgPG1haW4+SGkhIFRoaXMgaXMgdGhlIG1haW4gY29udGVudC48L21haW4+YCxcbiAqIH0pXG4gKiBjbGFzcyBBcHBDb21wb25lbnQge1xuICogICB2Y3IgPSBpbmplY3QoVmlld0NvbnRhaW5lclJlZik7XG4gKlxuICogICBuZ0FmdGVyVmlld0luaXQoKSB7XG4gKiAgICAgY29uc3QgY29tcFJlZiA9IHRoaXMudmNyLmNyZWF0ZUNvbXBvbmVudChEeW5hbWljQ29tcG9uZW50KTtcbiAqICAgICBjb21wUmVmLmNoYW5nZURldGVjdG9yUmVmLmRldGVjdENoYW5nZXMoKTtcbiAqICAgfVxuICogfVxuICogYGBgXG4gKlxuICogQHNlZSB7QGxpbmsgQ29tcG9uZW50UmVmfVxuICogQHNlZSB7QGxpbmsgRW1iZWRkZWRWaWV3UmVmfVxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFZpZXdDb250YWluZXJSZWYge1xuICAvKipcbiAgICogQW5jaG9yIGVsZW1lbnQgdGhhdCBzcGVjaWZpZXMgdGhlIGxvY2F0aW9uIG9mIHRoaXMgY29udGFpbmVyIGluIHRoZSBjb250YWluaW5nIHZpZXcuXG4gICAqIEVhY2ggdmlldyBjb250YWluZXIgY2FuIGhhdmUgb25seSBvbmUgYW5jaG9yIGVsZW1lbnQsIGFuZCBlYWNoIGFuY2hvciBlbGVtZW50XG4gICAqIGNhbiBoYXZlIG9ubHkgYSBzaW5nbGUgdmlldyBjb250YWluZXIuXG4gICAqXG4gICAqIFJvb3QgZWxlbWVudHMgb2Ygdmlld3MgYXR0YWNoZWQgdG8gdGhpcyBjb250YWluZXIgYmVjb21lIHNpYmxpbmdzIG9mIHRoZSBhbmNob3IgZWxlbWVudCBpblxuICAgKiB0aGUgcmVuZGVyZWQgdmlldy5cbiAgICpcbiAgICogQWNjZXNzIHRoZSBgVmlld0NvbnRhaW5lclJlZmAgb2YgYW4gZWxlbWVudCBieSBwbGFjaW5nIGEgYERpcmVjdGl2ZWAgaW5qZWN0ZWRcbiAgICogd2l0aCBgVmlld0NvbnRhaW5lclJlZmAgb24gdGhlIGVsZW1lbnQsIG9yIHVzZSBhIGBWaWV3Q2hpbGRgIHF1ZXJ5LlxuICAgKlxuICAgKiA8IS0tIFRPRE86IHJlbmFtZSB0byBhbmNob3JFbGVtZW50IC0tPlxuICAgKi9cbiAgYWJzdHJhY3QgZ2V0IGVsZW1lbnQoKTogRWxlbWVudFJlZjtcblxuICAvKipcbiAgICogVGhlIFtkZXBlbmRlbmN5IGluamVjdG9yXShndWlkZS9nbG9zc2FyeSNpbmplY3RvcikgZm9yIHRoaXMgdmlldyBjb250YWluZXIuXG4gICAqL1xuICBhYnN0cmFjdCBnZXQgaW5qZWN0b3IoKTogSW5qZWN0b3I7XG5cbiAgLyoqIEBkZXByZWNhdGVkIE5vIHJlcGxhY2VtZW50ICovXG4gIGFic3RyYWN0IGdldCBwYXJlbnRJbmplY3RvcigpOiBJbmplY3RvcjtcblxuICAvKipcbiAgICogRGVzdHJveXMgYWxsIHZpZXdzIGluIHRoaXMgY29udGFpbmVyLlxuICAgKi9cbiAgYWJzdHJhY3QgY2xlYXIoKTogdm9pZDtcblxuICAvKipcbiAgICogUmV0cmlldmVzIGEgdmlldyBmcm9tIHRoaXMgY29udGFpbmVyLlxuICAgKiBAcGFyYW0gaW5kZXggVGhlIDAtYmFzZWQgaW5kZXggb2YgdGhlIHZpZXcgdG8gcmV0cmlldmUuXG4gICAqIEByZXR1cm5zIFRoZSBgVmlld1JlZmAgaW5zdGFuY2UsIG9yIG51bGwgaWYgdGhlIGluZGV4IGlzIG91dCBvZiByYW5nZS5cbiAgICovXG4gIGFic3RyYWN0IGdldChpbmRleDogbnVtYmVyKTogVmlld1JlZnxudWxsO1xuXG4gIC8qKlxuICAgKiBSZXBvcnRzIGhvdyBtYW55IHZpZXdzIGFyZSBjdXJyZW50bHkgYXR0YWNoZWQgdG8gdGhpcyBjb250YWluZXIuXG4gICAqIEByZXR1cm5zIFRoZSBudW1iZXIgb2Ygdmlld3MuXG4gICAqL1xuICBhYnN0cmFjdCBnZXQgbGVuZ3RoKCk6IG51bWJlcjtcblxuICAvKipcbiAgICogSW5zdGFudGlhdGVzIGFuIGVtYmVkZGVkIHZpZXcgYW5kIGluc2VydHMgaXRcbiAgICogaW50byB0aGlzIGNvbnRhaW5lci5cbiAgICogQHBhcmFtIHRlbXBsYXRlUmVmIFRoZSBIVE1MIHRlbXBsYXRlIHRoYXQgZGVmaW5lcyB0aGUgdmlldy5cbiAgICogQHBhcmFtIGNvbnRleHQgVGhlIGRhdGEtYmluZGluZyBjb250ZXh0IG9mIHRoZSBlbWJlZGRlZCB2aWV3LCBhcyBkZWNsYXJlZFxuICAgKiBpbiB0aGUgYDxuZy10ZW1wbGF0ZT5gIHVzYWdlLlxuICAgKiBAcGFyYW0gb3B0aW9ucyBFeHRyYSBjb25maWd1cmF0aW9uIGZvciB0aGUgY3JlYXRlZCB2aWV3LiBJbmNsdWRlczpcbiAgICogICogaW5kZXg6IFRoZSAwLWJhc2VkIGluZGV4IGF0IHdoaWNoIHRvIGluc2VydCB0aGUgbmV3IHZpZXcgaW50byB0aGlzIGNvbnRhaW5lci5cbiAgICogICAgICAgICAgIElmIG5vdCBzcGVjaWZpZWQsIGFwcGVuZHMgdGhlIG5ldyB2aWV3IGFzIHRoZSBsYXN0IGVudHJ5LlxuICAgKiAgKiBpbmplY3RvcjogSW5qZWN0b3IgdG8gYmUgdXNlZCB3aXRoaW4gdGhlIGVtYmVkZGVkIHZpZXcuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBgVmlld1JlZmAgaW5zdGFuY2UgZm9yIHRoZSBuZXdseSBjcmVhdGVkIHZpZXcuXG4gICAqL1xuICBhYnN0cmFjdCBjcmVhdGVFbWJlZGRlZFZpZXc8Qz4odGVtcGxhdGVSZWY6IFRlbXBsYXRlUmVmPEM+LCBjb250ZXh0PzogQywgb3B0aW9ucz86IHtcbiAgICBpbmRleD86IG51bWJlcixcbiAgICBpbmplY3Rvcj86IEluamVjdG9yXG4gIH0pOiBFbWJlZGRlZFZpZXdSZWY8Qz47XG5cbiAgLyoqXG4gICAqIEluc3RhbnRpYXRlcyBhbiBlbWJlZGRlZCB2aWV3IGFuZCBpbnNlcnRzIGl0XG4gICAqIGludG8gdGhpcyBjb250YWluZXIuXG4gICAqIEBwYXJhbSB0ZW1wbGF0ZVJlZiBUaGUgSFRNTCB0ZW1wbGF0ZSB0aGF0IGRlZmluZXMgdGhlIHZpZXcuXG4gICAqIEBwYXJhbSBjb250ZXh0IFRoZSBkYXRhLWJpbmRpbmcgY29udGV4dCBvZiB0aGUgZW1iZWRkZWQgdmlldywgYXMgZGVjbGFyZWRcbiAgICogaW4gdGhlIGA8bmctdGVtcGxhdGU+YCB1c2FnZS5cbiAgICogQHBhcmFtIGluZGV4IFRoZSAwLWJhc2VkIGluZGV4IGF0IHdoaWNoIHRvIGluc2VydCB0aGUgbmV3IHZpZXcgaW50byB0aGlzIGNvbnRhaW5lci5cbiAgICogSWYgbm90IHNwZWNpZmllZCwgYXBwZW5kcyB0aGUgbmV3IHZpZXcgYXMgdGhlIGxhc3QgZW50cnkuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBgVmlld1JlZmAgaW5zdGFuY2UgZm9yIHRoZSBuZXdseSBjcmVhdGVkIHZpZXcuXG4gICAqL1xuICBhYnN0cmFjdCBjcmVhdGVFbWJlZGRlZFZpZXc8Qz4odGVtcGxhdGVSZWY6IFRlbXBsYXRlUmVmPEM+LCBjb250ZXh0PzogQywgaW5kZXg/OiBudW1iZXIpOlxuICAgICAgRW1iZWRkZWRWaWV3UmVmPEM+O1xuXG4gIC8qKlxuICAgKiBJbnN0YW50aWF0ZXMgYSBzaW5nbGUgY29tcG9uZW50IGFuZCBpbnNlcnRzIGl0cyBob3N0IHZpZXcgaW50byB0aGlzIGNvbnRhaW5lci5cbiAgICpcbiAgICogQHBhcmFtIGNvbXBvbmVudFR5cGUgQ29tcG9uZW50IFR5cGUgdG8gdXNlLlxuICAgKiBAcGFyYW0gb3B0aW9ucyBBbiBvYmplY3QgdGhhdCBjb250YWlucyBleHRyYSBwYXJhbWV0ZXJzOlxuICAgKiAgKiBpbmRleDogdGhlIGluZGV4IGF0IHdoaWNoIHRvIGluc2VydCB0aGUgbmV3IGNvbXBvbmVudCdzIGhvc3QgdmlldyBpbnRvIHRoaXMgY29udGFpbmVyLlxuICAgKiAgICAgICAgICAgSWYgbm90IHNwZWNpZmllZCwgYXBwZW5kcyB0aGUgbmV3IHZpZXcgYXMgdGhlIGxhc3QgZW50cnkuXG4gICAqICAqIGluamVjdG9yOiB0aGUgaW5qZWN0b3IgdG8gdXNlIGFzIHRoZSBwYXJlbnQgZm9yIHRoZSBuZXcgY29tcG9uZW50LlxuICAgKiAgKiBuZ01vZHVsZVJlZjogYW4gTmdNb2R1bGVSZWYgb2YgdGhlIGNvbXBvbmVudCdzIE5nTW9kdWxlLCB5b3Ugc2hvdWxkIGFsbW9zdCBhbHdheXMgcHJvdmlkZVxuICAgKiAgICAgICAgICAgICAgICAgdGhpcyB0byBlbnN1cmUgdGhhdCBhbGwgZXhwZWN0ZWQgcHJvdmlkZXJzIGFyZSBhdmFpbGFibGUgZm9yIHRoZSBjb21wb25lbnRcbiAgICogICAgICAgICAgICAgICAgIGluc3RhbnRpYXRpb24uXG4gICAqICAqIGVudmlyb25tZW50SW5qZWN0b3I6IGFuIEVudmlyb25tZW50SW5qZWN0b3Igd2hpY2ggd2lsbCBwcm92aWRlIHRoZSBjb21wb25lbnQncyBlbnZpcm9ubWVudC5cbiAgICogICAgICAgICAgICAgICAgIHlvdSBzaG91bGQgYWxtb3N0IGFsd2F5cyBwcm92aWRlIHRoaXMgdG8gZW5zdXJlIHRoYXQgYWxsIGV4cGVjdGVkIHByb3ZpZGVyc1xuICAgKiAgICAgICAgICAgICAgICAgYXJlIGF2YWlsYWJsZSBmb3IgdGhlIGNvbXBvbmVudCBpbnN0YW50aWF0aW9uLiBUaGlzIG9wdGlvbiBpcyBpbnRlbmRlZCB0b1xuICAgKiAgICAgICAgICAgICAgICAgcmVwbGFjZSB0aGUgYG5nTW9kdWxlUmVmYCBwYXJhbWV0ZXIuXG4gICAqICAqIHByb2plY3RhYmxlTm9kZXM6IGxpc3Qgb2YgRE9NIG5vZGVzIHRoYXQgc2hvdWxkIGJlIHByb2plY3RlZCB0aHJvdWdoXG4gICAqICAgICAgICAgICAgICAgICAgICAgIFtgPG5nLWNvbnRlbnQ+YF0oYXBpL2NvcmUvbmctY29udGVudCkgb2YgdGhlIG5ldyBjb21wb25lbnQgaW5zdGFuY2UuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBuZXcgYENvbXBvbmVudFJlZmAgd2hpY2ggY29udGFpbnMgdGhlIGNvbXBvbmVudCBpbnN0YW5jZSBhbmQgdGhlIGhvc3Qgdmlldy5cbiAgICovXG4gIGFic3RyYWN0IGNyZWF0ZUNvbXBvbmVudDxDPihjb21wb25lbnRUeXBlOiBUeXBlPEM+LCBvcHRpb25zPzoge1xuICAgIGluZGV4PzogbnVtYmVyLFxuICAgIGluamVjdG9yPzogSW5qZWN0b3IsXG4gICAgbmdNb2R1bGVSZWY/OiBOZ01vZHVsZVJlZjx1bmtub3duPixcbiAgICBlbnZpcm9ubWVudEluamVjdG9yPzogRW52aXJvbm1lbnRJbmplY3RvcnxOZ01vZHVsZVJlZjx1bmtub3duPixcbiAgICBwcm9qZWN0YWJsZU5vZGVzPzogTm9kZVtdW10sXG4gIH0pOiBDb21wb25lbnRSZWY8Qz47XG5cbiAgLyoqXG4gICAqIEluc3RhbnRpYXRlcyBhIHNpbmdsZSBjb21wb25lbnQgYW5kIGluc2VydHMgaXRzIGhvc3QgdmlldyBpbnRvIHRoaXMgY29udGFpbmVyLlxuICAgKlxuICAgKiBAcGFyYW0gY29tcG9uZW50RmFjdG9yeSBDb21wb25lbnQgZmFjdG9yeSB0byB1c2UuXG4gICAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggYXQgd2hpY2ggdG8gaW5zZXJ0IHRoZSBuZXcgY29tcG9uZW50J3MgaG9zdCB2aWV3IGludG8gdGhpcyBjb250YWluZXIuXG4gICAqIElmIG5vdCBzcGVjaWZpZWQsIGFwcGVuZHMgdGhlIG5ldyB2aWV3IGFzIHRoZSBsYXN0IGVudHJ5LlxuICAgKiBAcGFyYW0gaW5qZWN0b3IgVGhlIGluamVjdG9yIHRvIHVzZSBhcyB0aGUgcGFyZW50IGZvciB0aGUgbmV3IGNvbXBvbmVudC5cbiAgICogQHBhcmFtIHByb2plY3RhYmxlTm9kZXMgTGlzdCBvZiBET00gbm9kZXMgdGhhdCBzaG91bGQgYmUgcHJvamVjdGVkIHRocm91Z2hcbiAgICogICAgIFtgPG5nLWNvbnRlbnQ+YF0oYXBpL2NvcmUvbmctY29udGVudCkgb2YgdGhlIG5ldyBjb21wb25lbnQgaW5zdGFuY2UuXG4gICAqIEBwYXJhbSBuZ01vZHVsZVJlZiBBbiBpbnN0YW5jZSBvZiB0aGUgTmdNb2R1bGVSZWYgdGhhdCByZXByZXNlbnQgYW4gTmdNb2R1bGUuXG4gICAqIFRoaXMgaW5mb3JtYXRpb24gaXMgdXNlZCB0byByZXRyaWV2ZSBjb3JyZXNwb25kaW5nIE5nTW9kdWxlIGluamVjdG9yLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbmV3IGBDb21wb25lbnRSZWZgIHdoaWNoIGNvbnRhaW5zIHRoZSBjb21wb25lbnQgaW5zdGFuY2UgYW5kIHRoZSBob3N0IHZpZXcuXG4gICAqXG4gICAqIEBkZXByZWNhdGVkIEFuZ3VsYXIgbm8gbG9uZ2VyIHJlcXVpcmVzIGNvbXBvbmVudCBmYWN0b3JpZXMgdG8gZHluYW1pY2FsbHkgY3JlYXRlIGNvbXBvbmVudHMuXG4gICAqICAgICBVc2UgZGlmZmVyZW50IHNpZ25hdHVyZSBvZiB0aGUgYGNyZWF0ZUNvbXBvbmVudGAgbWV0aG9kLCB3aGljaCBhbGxvd3MgcGFzc2luZ1xuICAgKiAgICAgQ29tcG9uZW50IGNsYXNzIGRpcmVjdGx5LlxuICAgKi9cbiAgYWJzdHJhY3QgY3JlYXRlQ29tcG9uZW50PEM+KFxuICAgICAgY29tcG9uZW50RmFjdG9yeTogQ29tcG9uZW50RmFjdG9yeTxDPiwgaW5kZXg/OiBudW1iZXIsIGluamVjdG9yPzogSW5qZWN0b3IsXG4gICAgICBwcm9qZWN0YWJsZU5vZGVzPzogYW55W11bXSxcbiAgICAgIGVudmlyb25tZW50SW5qZWN0b3I/OiBFbnZpcm9ubWVudEluamVjdG9yfE5nTW9kdWxlUmVmPGFueT4pOiBDb21wb25lbnRSZWY8Qz47XG5cbiAgLyoqXG4gICAqIEluc2VydHMgYSB2aWV3IGludG8gdGhpcyBjb250YWluZXIuXG4gICAqIEBwYXJhbSB2aWV3UmVmIFRoZSB2aWV3IHRvIGluc2VydC5cbiAgICogQHBhcmFtIGluZGV4IFRoZSAwLWJhc2VkIGluZGV4IGF0IHdoaWNoIHRvIGluc2VydCB0aGUgdmlldy5cbiAgICogSWYgbm90IHNwZWNpZmllZCwgYXBwZW5kcyB0aGUgbmV3IHZpZXcgYXMgdGhlIGxhc3QgZW50cnkuXG4gICAqIEByZXR1cm5zIFRoZSBpbnNlcnRlZCBgVmlld1JlZmAgaW5zdGFuY2UuXG4gICAqXG4gICAqL1xuICBhYnN0cmFjdCBpbnNlcnQodmlld1JlZjogVmlld1JlZiwgaW5kZXg/OiBudW1iZXIpOiBWaWV3UmVmO1xuXG4gIC8qKlxuICAgKiBNb3ZlcyBhIHZpZXcgdG8gYSBuZXcgbG9jYXRpb24gaW4gdGhpcyBjb250YWluZXIuXG4gICAqIEBwYXJhbSB2aWV3UmVmIFRoZSB2aWV3IHRvIG1vdmUuXG4gICAqIEBwYXJhbSBpbmRleCBUaGUgMC1iYXNlZCBpbmRleCBvZiB0aGUgbmV3IGxvY2F0aW9uLlxuICAgKiBAcmV0dXJucyBUaGUgbW92ZWQgYFZpZXdSZWZgIGluc3RhbmNlLlxuICAgKi9cbiAgYWJzdHJhY3QgbW92ZSh2aWV3UmVmOiBWaWV3UmVmLCBjdXJyZW50SW5kZXg6IG51bWJlcik6IFZpZXdSZWY7XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGluZGV4IG9mIGEgdmlldyB3aXRoaW4gdGhlIGN1cnJlbnQgY29udGFpbmVyLlxuICAgKiBAcGFyYW0gdmlld1JlZiBUaGUgdmlldyB0byBxdWVyeS5cbiAgICogQHJldHVybnMgVGhlIDAtYmFzZWQgaW5kZXggb2YgdGhlIHZpZXcncyBwb3NpdGlvbiBpbiB0aGlzIGNvbnRhaW5lcixcbiAgICogb3IgYC0xYCBpZiB0aGlzIGNvbnRhaW5lciBkb2Vzbid0IGNvbnRhaW4gdGhlIHZpZXcuXG4gICAqL1xuICBhYnN0cmFjdCBpbmRleE9mKHZpZXdSZWY6IFZpZXdSZWYpOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIGEgdmlldyBhdHRhY2hlZCB0byB0aGlzIGNvbnRhaW5lclxuICAgKiBAcGFyYW0gaW5kZXggVGhlIDAtYmFzZWQgaW5kZXggb2YgdGhlIHZpZXcgdG8gZGVzdHJveS5cbiAgICogSWYgbm90IHNwZWNpZmllZCwgdGhlIGxhc3QgdmlldyBpbiB0aGUgY29udGFpbmVyIGlzIHJlbW92ZWQuXG4gICAqL1xuICBhYnN0cmFjdCByZW1vdmUoaW5kZXg/OiBudW1iZXIpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBEZXRhY2hlcyBhIHZpZXcgZnJvbSB0aGlzIGNvbnRhaW5lciB3aXRob3V0IGRlc3Ryb3lpbmcgaXQuXG4gICAqIFVzZSBhbG9uZyB3aXRoIGBpbnNlcnQoKWAgdG8gbW92ZSBhIHZpZXcgd2l0aGluIHRoZSBjdXJyZW50IGNvbnRhaW5lci5cbiAgICogQHBhcmFtIGluZGV4IFRoZSAwLWJhc2VkIGluZGV4IG9mIHRoZSB2aWV3IHRvIGRldGFjaC5cbiAgICogSWYgbm90IHNwZWNpZmllZCwgdGhlIGxhc3QgdmlldyBpbiB0aGUgY29udGFpbmVyIGlzIGRldGFjaGVkLlxuICAgKi9cbiAgYWJzdHJhY3QgZGV0YWNoKGluZGV4PzogbnVtYmVyKTogVmlld1JlZnxudWxsO1xuXG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICogQG5vY29sbGFwc2VcbiAgICovXG4gIHN0YXRpYyBfX05HX0VMRU1FTlRfSURfXzogKCkgPT4gVmlld0NvbnRhaW5lclJlZiA9IGluamVjdFZpZXdDb250YWluZXJSZWY7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIFZpZXdDb250YWluZXJSZWYgYW5kIHN0b3JlcyBpdCBvbiB0aGUgaW5qZWN0b3IuIE9yLCBpZiB0aGUgVmlld0NvbnRhaW5lclJlZlxuICogYWxyZWFkeSBleGlzdHMsIHJldHJpZXZlcyB0aGUgZXhpc3RpbmcgVmlld0NvbnRhaW5lclJlZi5cbiAqXG4gKiBAcmV0dXJucyBUaGUgVmlld0NvbnRhaW5lclJlZiBpbnN0YW5jZSB0byB1c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdFZpZXdDb250YWluZXJSZWYoKTogVmlld0NvbnRhaW5lclJlZiB7XG4gIGNvbnN0IHByZXZpb3VzVE5vZGUgPSBnZXRDdXJyZW50VE5vZGUoKSBhcyBURWxlbWVudE5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGUgfCBUQ29udGFpbmVyTm9kZTtcbiAgcmV0dXJuIGNyZWF0ZUNvbnRhaW5lclJlZihwcmV2aW91c1ROb2RlLCBnZXRMVmlldygpKTtcbn1cblxuY29uc3QgVkVfVmlld0NvbnRhaW5lclJlZiA9IFZpZXdDb250YWluZXJSZWY7XG5cbi8vIFRPRE8oYWx4aHViKTogY2xlYW5pbmcgdXAgdGhpcyBpbmRpcmVjdGlvbiB0cmlnZ2VycyBhIHN1YnRsZSBidWcgaW4gQ2xvc3VyZSBpbiBnMy4gT25jZSB0aGUgZml4XG4vLyBmb3IgdGhhdCBsYW5kcywgdGhpcyBjYW4gYmUgY2xlYW5lZCB1cC5cbmNvbnN0IFIzVmlld0NvbnRhaW5lclJlZiA9IGNsYXNzIFZpZXdDb250YWluZXJSZWYgZXh0ZW5kcyBWRV9WaWV3Q29udGFpbmVyUmVmIHtcbiAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIF9sQ29udGFpbmVyOiBMQ29udGFpbmVyLFxuICAgICAgcHJpdmF0ZSBfaG9zdFROb2RlOiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlLFxuICAgICAgcHJpdmF0ZSBfaG9zdExWaWV3OiBMVmlldykge1xuICAgIHN1cGVyKCk7XG4gIH1cblxuICBvdmVycmlkZSBnZXQgZWxlbWVudCgpOiBFbGVtZW50UmVmIHtcbiAgICByZXR1cm4gY3JlYXRlRWxlbWVudFJlZih0aGlzLl9ob3N0VE5vZGUsIHRoaXMuX2hvc3RMVmlldyk7XG4gIH1cblxuICBvdmVycmlkZSBnZXQgaW5qZWN0b3IoKTogSW5qZWN0b3Ige1xuICAgIHJldHVybiBuZXcgTm9kZUluamVjdG9yKHRoaXMuX2hvc3RUTm9kZSwgdGhpcy5faG9zdExWaWV3KTtcbiAgfVxuXG4gIC8qKiBAZGVwcmVjYXRlZCBObyByZXBsYWNlbWVudCAqL1xuICBvdmVycmlkZSBnZXQgcGFyZW50SW5qZWN0b3IoKTogSW5qZWN0b3Ige1xuICAgIGNvbnN0IHBhcmVudExvY2F0aW9uID0gZ2V0UGFyZW50SW5qZWN0b3JMb2NhdGlvbih0aGlzLl9ob3N0VE5vZGUsIHRoaXMuX2hvc3RMVmlldyk7XG4gICAgaWYgKGhhc1BhcmVudEluamVjdG9yKHBhcmVudExvY2F0aW9uKSkge1xuICAgICAgY29uc3QgcGFyZW50VmlldyA9IGdldFBhcmVudEluamVjdG9yVmlldyhwYXJlbnRMb2NhdGlvbiwgdGhpcy5faG9zdExWaWV3KTtcbiAgICAgIGNvbnN0IGluamVjdG9ySW5kZXggPSBnZXRQYXJlbnRJbmplY3RvckluZGV4KHBhcmVudExvY2F0aW9uKTtcbiAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlSW5qZWN0b3IocGFyZW50VmlldywgaW5qZWN0b3JJbmRleCk7XG4gICAgICBjb25zdCBwYXJlbnRUTm9kZSA9XG4gICAgICAgICAgcGFyZW50Vmlld1tUVklFV10uZGF0YVtpbmplY3RvckluZGV4ICsgTm9kZUluamVjdG9yT2Zmc2V0LlROT0RFXSBhcyBURWxlbWVudE5vZGU7XG4gICAgICByZXR1cm4gbmV3IE5vZGVJbmplY3RvcihwYXJlbnRUTm9kZSwgcGFyZW50Vmlldyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBuZXcgTm9kZUluamVjdG9yKG51bGwsIHRoaXMuX2hvc3RMVmlldyk7XG4gICAgfVxuICB9XG5cbiAgb3ZlcnJpZGUgY2xlYXIoKTogdm9pZCB7XG4gICAgd2hpbGUgKHRoaXMubGVuZ3RoID4gMCkge1xuICAgICAgdGhpcy5yZW1vdmUodGhpcy5sZW5ndGggLSAxKTtcbiAgICB9XG4gIH1cblxuICBvdmVycmlkZSBnZXQoaW5kZXg6IG51bWJlcik6IFZpZXdSZWZ8bnVsbCB7XG4gICAgY29uc3Qgdmlld1JlZnMgPSBnZXRWaWV3UmVmcyh0aGlzLl9sQ29udGFpbmVyKTtcbiAgICByZXR1cm4gdmlld1JlZnMgIT09IG51bGwgJiYgdmlld1JlZnNbaW5kZXhdIHx8IG51bGw7XG4gIH1cblxuICBvdmVycmlkZSBnZXQgbGVuZ3RoKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX2xDb250YWluZXIubGVuZ3RoIC0gQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQ7XG4gIH1cblxuICBvdmVycmlkZSBjcmVhdGVFbWJlZGRlZFZpZXc8Qz4odGVtcGxhdGVSZWY6IFRlbXBsYXRlUmVmPEM+LCBjb250ZXh0PzogQywgb3B0aW9ucz86IHtcbiAgICBpbmRleD86IG51bWJlcixcbiAgICBpbmplY3Rvcj86IEluamVjdG9yXG4gIH0pOiBFbWJlZGRlZFZpZXdSZWY8Qz47XG4gIG92ZXJyaWRlIGNyZWF0ZUVtYmVkZGVkVmlldzxDPih0ZW1wbGF0ZVJlZjogVGVtcGxhdGVSZWY8Qz4sIGNvbnRleHQ/OiBDLCBpbmRleD86IG51bWJlcik6XG4gICAgICBFbWJlZGRlZFZpZXdSZWY8Qz47XG4gIG92ZXJyaWRlIGNyZWF0ZUVtYmVkZGVkVmlldzxDPih0ZW1wbGF0ZVJlZjogVGVtcGxhdGVSZWY8Qz4sIGNvbnRleHQ/OiBDLCBpbmRleE9yT3B0aW9ucz86IG51bWJlcnx7XG4gICAgaW5kZXg/OiBudW1iZXIsXG4gICAgaW5qZWN0b3I/OiBJbmplY3RvclxuICB9KTogRW1iZWRkZWRWaWV3UmVmPEM+IHtcbiAgICBsZXQgaW5kZXg6IG51bWJlcnx1bmRlZmluZWQ7XG4gICAgbGV0IGluamVjdG9yOiBJbmplY3Rvcnx1bmRlZmluZWQ7XG5cbiAgICBpZiAodHlwZW9mIGluZGV4T3JPcHRpb25zID09PSAnbnVtYmVyJykge1xuICAgICAgaW5kZXggPSBpbmRleE9yT3B0aW9ucztcbiAgICB9IGVsc2UgaWYgKGluZGV4T3JPcHRpb25zICE9IG51bGwpIHtcbiAgICAgIGluZGV4ID0gaW5kZXhPck9wdGlvbnMuaW5kZXg7XG4gICAgICBpbmplY3RvciA9IGluZGV4T3JPcHRpb25zLmluamVjdG9yO1xuICAgIH1cblxuICAgIGNvbnN0IGRlaHlkcmF0ZWRWaWV3ID0gZmluZE1hdGNoaW5nRGVoeWRyYXRlZFZpZXcodGhpcy5fbENvbnRhaW5lciwgdGVtcGxhdGVSZWYuc3NySWQpO1xuICAgIGNvbnN0IHZpZXdSZWYgPVxuICAgICAgICB0ZW1wbGF0ZVJlZi5jcmVhdGVFbWJlZGRlZFZpZXdJbXBsKGNvbnRleHQgfHwgPGFueT57fSwgaW5qZWN0b3IsIGRlaHlkcmF0ZWRWaWV3KTtcbiAgICB0aGlzLmluc2VydEltcGwodmlld1JlZiwgaW5kZXgsIHNob3VsZEFkZFZpZXdUb0RvbSh0aGlzLl9ob3N0VE5vZGUsIGRlaHlkcmF0ZWRWaWV3KSk7XG4gICAgcmV0dXJuIHZpZXdSZWY7XG4gIH1cblxuICBvdmVycmlkZSBjcmVhdGVDb21wb25lbnQ8Qz4oY29tcG9uZW50VHlwZTogVHlwZTxDPiwgb3B0aW9ucz86IHtcbiAgICBpbmRleD86IG51bWJlcixcbiAgICBpbmplY3Rvcj86IEluamVjdG9yLFxuICAgIHByb2plY3RhYmxlTm9kZXM/OiBOb2RlW11bXSxcbiAgICBuZ01vZHVsZVJlZj86IE5nTW9kdWxlUmVmPHVua25vd24+LFxuICB9KTogQ29tcG9uZW50UmVmPEM+O1xuICAvKipcbiAgICogQGRlcHJlY2F0ZWQgQW5ndWxhciBubyBsb25nZXIgcmVxdWlyZXMgY29tcG9uZW50IGZhY3RvcmllcyB0byBkeW5hbWljYWxseSBjcmVhdGUgY29tcG9uZW50cy5cbiAgICogICAgIFVzZSBkaWZmZXJlbnQgc2lnbmF0dXJlIG9mIHRoZSBgY3JlYXRlQ29tcG9uZW50YCBtZXRob2QsIHdoaWNoIGFsbG93cyBwYXNzaW5nXG4gICAqICAgICBDb21wb25lbnQgY2xhc3MgZGlyZWN0bHkuXG4gICAqL1xuICBvdmVycmlkZSBjcmVhdGVDb21wb25lbnQ8Qz4oXG4gICAgICBjb21wb25lbnRGYWN0b3J5OiBDb21wb25lbnRGYWN0b3J5PEM+LCBpbmRleD86IG51bWJlcnx1bmRlZmluZWQsXG4gICAgICBpbmplY3Rvcj86IEluamVjdG9yfHVuZGVmaW5lZCwgcHJvamVjdGFibGVOb2Rlcz86IGFueVtdW118dW5kZWZpbmVkLFxuICAgICAgZW52aXJvbm1lbnRJbmplY3Rvcj86IEVudmlyb25tZW50SW5qZWN0b3J8TmdNb2R1bGVSZWY8YW55Pnx1bmRlZmluZWQpOiBDb21wb25lbnRSZWY8Qz47XG4gIG92ZXJyaWRlIGNyZWF0ZUNvbXBvbmVudDxDPihcbiAgICAgIGNvbXBvbmVudEZhY3RvcnlPclR5cGU6IENvbXBvbmVudEZhY3Rvcnk8Qz58VHlwZTxDPiwgaW5kZXhPck9wdGlvbnM/OiBudW1iZXJ8dW5kZWZpbmVkfHtcbiAgICAgICAgaW5kZXg/OiBudW1iZXIsXG4gICAgICAgIGluamVjdG9yPzogSW5qZWN0b3IsXG4gICAgICAgIG5nTW9kdWxlUmVmPzogTmdNb2R1bGVSZWY8dW5rbm93bj4sXG4gICAgICAgIGVudmlyb25tZW50SW5qZWN0b3I/OiBFbnZpcm9ubWVudEluamVjdG9yfE5nTW9kdWxlUmVmPHVua25vd24+LFxuICAgICAgICBwcm9qZWN0YWJsZU5vZGVzPzogTm9kZVtdW10sXG4gICAgICB9LFxuICAgICAgaW5qZWN0b3I/OiBJbmplY3Rvcnx1bmRlZmluZWQsIHByb2plY3RhYmxlTm9kZXM/OiBhbnlbXVtdfHVuZGVmaW5lZCxcbiAgICAgIGVudmlyb25tZW50SW5qZWN0b3I/OiBFbnZpcm9ubWVudEluamVjdG9yfE5nTW9kdWxlUmVmPGFueT58dW5kZWZpbmVkKTogQ29tcG9uZW50UmVmPEM+IHtcbiAgICBjb25zdCBpc0NvbXBvbmVudEZhY3RvcnkgPSBjb21wb25lbnRGYWN0b3J5T3JUeXBlICYmICFpc1R5cGUoY29tcG9uZW50RmFjdG9yeU9yVHlwZSk7XG4gICAgbGV0IGluZGV4OiBudW1iZXJ8dW5kZWZpbmVkO1xuXG4gICAgLy8gVGhpcyBmdW5jdGlvbiBzdXBwb3J0cyAyIHNpZ25hdHVyZXMgYW5kIHdlIG5lZWQgdG8gaGFuZGxlIG9wdGlvbnMgY29ycmVjdGx5IGZvciBib3RoOlxuICAgIC8vICAgMS4gV2hlbiBmaXJzdCBhcmd1bWVudCBpcyBhIENvbXBvbmVudCB0eXBlLiBUaGlzIHNpZ25hdHVyZSBhbHNvIHJlcXVpcmVzIGV4dHJhXG4gICAgLy8gICAgICBvcHRpb25zIHRvIGJlIHByb3ZpZGVkIGFzIG9iamVjdCAobW9yZSBlcmdvbm9taWMgb3B0aW9uKS5cbiAgICAvLyAgIDIuIEZpcnN0IGFyZ3VtZW50IGlzIGEgQ29tcG9uZW50IGZhY3RvcnkuIEluIHRoaXMgY2FzZSBleHRyYSBvcHRpb25zIGFyZSByZXByZXNlbnRlZCBhc1xuICAgIC8vICAgICAgcG9zaXRpb25hbCBhcmd1bWVudHMuIFRoaXMgc2lnbmF0dXJlIGlzIGxlc3MgZXJnb25vbWljIGFuZCB3aWxsIGJlIGRlcHJlY2F0ZWQuXG4gICAgaWYgKGlzQ29tcG9uZW50RmFjdG9yeSkge1xuICAgICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgICBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgIHR5cGVvZiBpbmRleE9yT3B0aW9ucyAhPT0gJ29iamVjdCcsIHRydWUsXG4gICAgICAgICAgICAnSXQgbG9va3MgbGlrZSBDb21wb25lbnQgZmFjdG9yeSB3YXMgcHJvdmlkZWQgYXMgdGhlIGZpcnN0IGFyZ3VtZW50ICcgK1xuICAgICAgICAgICAgICAgICdhbmQgYW4gb3B0aW9ucyBvYmplY3QgYXMgdGhlIHNlY29uZCBhcmd1bWVudC4gVGhpcyBjb21iaW5hdGlvbiBvZiBhcmd1bWVudHMgJyArXG4gICAgICAgICAgICAgICAgJ2lzIGluY29tcGF0aWJsZS4gWW91IGNhbiBlaXRoZXIgY2hhbmdlIHRoZSBmaXJzdCBhcmd1bWVudCB0byBwcm92aWRlIENvbXBvbmVudCAnICtcbiAgICAgICAgICAgICAgICAndHlwZSBvciBjaGFuZ2UgdGhlIHNlY29uZCBhcmd1bWVudCB0byBiZSBhIG51bWJlciAocmVwcmVzZW50aW5nIGFuIGluZGV4IGF0ICcgK1xuICAgICAgICAgICAgICAgICd3aGljaCB0byBpbnNlcnQgdGhlIG5ldyBjb21wb25lbnRcXCdzIGhvc3QgdmlldyBpbnRvIHRoaXMgY29udGFpbmVyKScpO1xuICAgICAgfVxuICAgICAgaW5kZXggPSBpbmRleE9yT3B0aW9ucyBhcyBudW1iZXIgfCB1bmRlZmluZWQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgICAgYXNzZXJ0RGVmaW5lZChcbiAgICAgICAgICAgIGdldENvbXBvbmVudERlZihjb21wb25lbnRGYWN0b3J5T3JUeXBlKSxcbiAgICAgICAgICAgIGBQcm92aWRlZCBDb21wb25lbnQgY2xhc3MgZG9lc24ndCBjb250YWluIENvbXBvbmVudCBkZWZpbml0aW9uLiBgICtcbiAgICAgICAgICAgICAgICBgUGxlYXNlIGNoZWNrIHdoZXRoZXIgcHJvdmlkZWQgY2xhc3MgaGFzIEBDb21wb25lbnQgZGVjb3JhdG9yLmApO1xuICAgICAgICBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgIHR5cGVvZiBpbmRleE9yT3B0aW9ucyAhPT0gJ251bWJlcicsIHRydWUsXG4gICAgICAgICAgICAnSXQgbG9va3MgbGlrZSBDb21wb25lbnQgdHlwZSB3YXMgcHJvdmlkZWQgYXMgdGhlIGZpcnN0IGFyZ3VtZW50ICcgK1xuICAgICAgICAgICAgICAgICdhbmQgYSBudW1iZXIgKHJlcHJlc2VudGluZyBhbiBpbmRleCBhdCB3aGljaCB0byBpbnNlcnQgdGhlIG5ldyBjb21wb25lbnRcXCdzICcgK1xuICAgICAgICAgICAgICAgICdob3N0IHZpZXcgaW50byB0aGlzIGNvbnRhaW5lciBhcyB0aGUgc2Vjb25kIGFyZ3VtZW50LiBUaGlzIGNvbWJpbmF0aW9uIG9mIGFyZ3VtZW50cyAnICtcbiAgICAgICAgICAgICAgICAnaXMgaW5jb21wYXRpYmxlLiBQbGVhc2UgdXNlIGFuIG9iamVjdCBhcyB0aGUgc2Vjb25kIGFyZ3VtZW50IGluc3RlYWQuJyk7XG4gICAgICB9XG4gICAgICBjb25zdCBvcHRpb25zID0gKGluZGV4T3JPcHRpb25zIHx8IHt9KSBhcyB7XG4gICAgICAgIGluZGV4PzogbnVtYmVyLFxuICAgICAgICBpbmplY3Rvcj86IEluamVjdG9yLFxuICAgICAgICBuZ01vZHVsZVJlZj86IE5nTW9kdWxlUmVmPHVua25vd24+LFxuICAgICAgICBlbnZpcm9ubWVudEluamVjdG9yPzogRW52aXJvbm1lbnRJbmplY3RvciB8IE5nTW9kdWxlUmVmPHVua25vd24+LFxuICAgICAgICBwcm9qZWN0YWJsZU5vZGVzPzogTm9kZVtdW10sXG4gICAgICB9O1xuICAgICAgaWYgKG5nRGV2TW9kZSAmJiBvcHRpb25zLmVudmlyb25tZW50SW5qZWN0b3IgJiYgb3B0aW9ucy5uZ01vZHVsZVJlZikge1xuICAgICAgICB0aHJvd0Vycm9yKFxuICAgICAgICAgICAgYENhbm5vdCBwYXNzIGJvdGggZW52aXJvbm1lbnRJbmplY3RvciBhbmQgbmdNb2R1bGVSZWYgb3B0aW9ucyB0byBjcmVhdGVDb21wb25lbnQoKS5gKTtcbiAgICAgIH1cbiAgICAgIGluZGV4ID0gb3B0aW9ucy5pbmRleDtcbiAgICAgIGluamVjdG9yID0gb3B0aW9ucy5pbmplY3RvcjtcbiAgICAgIHByb2plY3RhYmxlTm9kZXMgPSBvcHRpb25zLnByb2plY3RhYmxlTm9kZXM7XG4gICAgICBlbnZpcm9ubWVudEluamVjdG9yID0gb3B0aW9ucy5lbnZpcm9ubWVudEluamVjdG9yIHx8IG9wdGlvbnMubmdNb2R1bGVSZWY7XG4gICAgfVxuXG4gICAgY29uc3QgY29tcG9uZW50RmFjdG9yeTogQ29tcG9uZW50RmFjdG9yeTxDPiA9IGlzQ29tcG9uZW50RmFjdG9yeSA/XG4gICAgICAgIGNvbXBvbmVudEZhY3RvcnlPclR5cGUgYXMgQ29tcG9uZW50RmFjdG9yeTxDPjpcbiAgICAgICAgbmV3IFIzQ29tcG9uZW50RmFjdG9yeShnZXRDb21wb25lbnREZWYoY29tcG9uZW50RmFjdG9yeU9yVHlwZSkhKTtcbiAgICBjb25zdCBjb250ZXh0SW5qZWN0b3IgPSBpbmplY3RvciB8fCB0aGlzLnBhcmVudEluamVjdG9yO1xuXG4gICAgLy8gSWYgYW4gYE5nTW9kdWxlUmVmYCBpcyBub3QgcHJvdmlkZWQgZXhwbGljaXRseSwgdHJ5IHJldHJpZXZpbmcgaXQgZnJvbSB0aGUgREkgdHJlZS5cbiAgICBpZiAoIWVudmlyb25tZW50SW5qZWN0b3IgJiYgKGNvbXBvbmVudEZhY3RvcnkgYXMgYW55KS5uZ01vZHVsZSA9PSBudWxsKSB7XG4gICAgICAvLyBGb3IgdGhlIGBDb21wb25lbnRGYWN0b3J5YCBjYXNlLCBlbnRlcmluZyB0aGlzIGxvZ2ljIGlzIHZlcnkgdW5saWtlbHksIHNpbmNlIHdlIGV4cGVjdCB0aGF0XG4gICAgICAvLyBhbiBpbnN0YW5jZSBvZiBhIGBDb21wb25lbnRGYWN0b3J5YCwgcmVzb2x2ZWQgdmlhIGBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXJgIHdvdWxkIGhhdmUgYW5cbiAgICAgIC8vIGBuZ01vZHVsZWAgZmllbGQuIFRoaXMgaXMgcG9zc2libGUgaW4gc29tZSB0ZXN0IHNjZW5hcmlvcyBhbmQgcG90ZW50aWFsbHkgaW4gc29tZSBKSVQtYmFzZWRcbiAgICAgIC8vIHVzZS1jYXNlcy4gRm9yIHRoZSBgQ29tcG9uZW50RmFjdG9yeWAgY2FzZSB3ZSBwcmVzZXJ2ZSBiYWNrd2FyZHMtY29tcGF0aWJpbGl0eSBhbmQgdHJ5XG4gICAgICAvLyB1c2luZyBhIHByb3ZpZGVkIGluamVjdG9yIGZpcnN0LCB0aGVuIGZhbGwgYmFjayB0byB0aGUgcGFyZW50IGluamVjdG9yIG9mIHRoaXNcbiAgICAgIC8vIGBWaWV3Q29udGFpbmVyUmVmYCBpbnN0YW5jZS5cbiAgICAgIC8vXG4gICAgICAvLyBGb3IgdGhlIGZhY3RvcnktbGVzcyBjYXNlLCBpdCdzIGNyaXRpY2FsIHRvIGVzdGFibGlzaCBhIGNvbm5lY3Rpb24gd2l0aCB0aGUgbW9kdWxlXG4gICAgICAvLyBpbmplY3RvciB0cmVlIChieSByZXRyaWV2aW5nIGFuIGluc3RhbmNlIG9mIGFuIGBOZ01vZHVsZVJlZmAgYW5kIGFjY2Vzc2luZyBpdHMgaW5qZWN0b3IpLFxuICAgICAgLy8gc28gdGhhdCBhIGNvbXBvbmVudCBjYW4gdXNlIERJIHRva2VucyBwcm92aWRlZCBpbiBNZ01vZHVsZXMuIEZvciB0aGlzIHJlYXNvbiwgd2UgY2FuIG5vdFxuICAgICAgLy8gcmVseSBvbiB0aGUgcHJvdmlkZWQgaW5qZWN0b3IsIHNpbmNlIGl0IG1pZ2h0IGJlIGRldGFjaGVkIGZyb20gdGhlIERJIHRyZWUgKGZvciBleGFtcGxlLCBpZlxuICAgICAgLy8gaXQgd2FzIGNyZWF0ZWQgdmlhIGBJbmplY3Rvci5jcmVhdGVgIHdpdGhvdXQgc3BlY2lmeWluZyBhIHBhcmVudCBpbmplY3Rvciwgb3IgaWYgYW5cbiAgICAgIC8vIGluamVjdG9yIGlzIHJldHJpZXZlZCBmcm9tIGFuIGBOZ01vZHVsZVJlZmAgY3JlYXRlZCB2aWEgYGNyZWF0ZU5nTW9kdWxlYCB1c2luZyBhblxuICAgICAgLy8gTmdNb2R1bGUgb3V0c2lkZSBvZiBhIG1vZHVsZSB0cmVlKS4gSW5zdGVhZCwgd2UgYWx3YXlzIHVzZSBgVmlld0NvbnRhaW5lclJlZmAncyBwYXJlbnRcbiAgICAgIC8vIGluamVjdG9yLCB3aGljaCBpcyBub3JtYWxseSBjb25uZWN0ZWQgdG8gdGhlIERJIHRyZWUsIHdoaWNoIGluY2x1ZGVzIG1vZHVsZSBpbmplY3RvclxuICAgICAgLy8gc3VidHJlZS5cbiAgICAgIGNvbnN0IF9pbmplY3RvciA9IGlzQ29tcG9uZW50RmFjdG9yeSA/IGNvbnRleHRJbmplY3RvciA6IHRoaXMucGFyZW50SW5qZWN0b3I7XG5cbiAgICAgIC8vIERPIE5PVCBSRUZBQ1RPUi4gVGhlIGNvZGUgaGVyZSB1c2VkIHRvIGhhdmUgYSBgaW5qZWN0b3IuZ2V0KE5nTW9kdWxlUmVmLCBudWxsKSB8fFxuICAgICAgLy8gdW5kZWZpbmVkYCBleHByZXNzaW9uIHdoaWNoIHNlZW1zIHRvIGNhdXNlIGludGVybmFsIGdvb2dsZSBhcHBzIHRvIGZhaWwuIFRoaXMgaXMgZG9jdW1lbnRlZFxuICAgICAgLy8gaW4gdGhlIGZvbGxvd2luZyBpbnRlcm5hbCBidWcgaXNzdWU6IGdvL2IvMTQyOTY3ODAyXG4gICAgICBjb25zdCByZXN1bHQgPSBfaW5qZWN0b3IuZ2V0KEVudmlyb25tZW50SW5qZWN0b3IsIG51bGwpO1xuICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICBlbnZpcm9ubWVudEluamVjdG9yID0gcmVzdWx0O1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGNvbXBvbmVudERlZiA9IGdldENvbXBvbmVudERlZihjb21wb25lbnRGYWN0b3J5LmNvbXBvbmVudFR5cGUgPz8ge30pO1xuICAgIGNvbnN0IGRlaHlkcmF0ZWRWaWV3ID0gZmluZE1hdGNoaW5nRGVoeWRyYXRlZFZpZXcodGhpcy5fbENvbnRhaW5lciwgY29tcG9uZW50RGVmPy5pZCA/PyBudWxsKTtcbiAgICBjb25zdCByTm9kZSA9IGRlaHlkcmF0ZWRWaWV3Py5maXJzdENoaWxkID8/IG51bGw7XG4gICAgY29uc3QgY29tcG9uZW50UmVmID1cbiAgICAgICAgY29tcG9uZW50RmFjdG9yeS5jcmVhdGUoY29udGV4dEluamVjdG9yLCBwcm9qZWN0YWJsZU5vZGVzLCByTm9kZSwgZW52aXJvbm1lbnRJbmplY3Rvcik7XG4gICAgdGhpcy5pbnNlcnRJbXBsKFxuICAgICAgICBjb21wb25lbnRSZWYuaG9zdFZpZXcsIGluZGV4LCBzaG91bGRBZGRWaWV3VG9Eb20odGhpcy5faG9zdFROb2RlLCBkZWh5ZHJhdGVkVmlldykpO1xuICAgIHJldHVybiBjb21wb25lbnRSZWY7XG4gIH1cblxuICBvdmVycmlkZSBpbnNlcnQodmlld1JlZjogVmlld1JlZiwgaW5kZXg/OiBudW1iZXIpOiBWaWV3UmVmIHtcbiAgICByZXR1cm4gdGhpcy5pbnNlcnRJbXBsKHZpZXdSZWYsIGluZGV4LCB0cnVlKTtcbiAgfVxuXG4gIHByaXZhdGUgaW5zZXJ0SW1wbCh2aWV3UmVmOiBWaWV3UmVmLCBpbmRleD86IG51bWJlciwgYWRkVG9ET00/OiBib29sZWFuKTogVmlld1JlZiB7XG4gICAgY29uc3QgbFZpZXcgPSAodmlld1JlZiBhcyBSM1ZpZXdSZWY8YW55PikuX2xWaWV3ITtcblxuICAgIGlmIChuZ0Rldk1vZGUgJiYgdmlld1JlZi5kZXN0cm95ZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGluc2VydCBhIGRlc3Ryb3llZCBWaWV3IGluIGEgVmlld0NvbnRhaW5lciEnKTtcbiAgICB9XG5cbiAgICBpZiAodmlld0F0dGFjaGVkVG9Db250YWluZXIobFZpZXcpKSB7XG4gICAgICAvLyBJZiB2aWV3IGlzIGFscmVhZHkgYXR0YWNoZWQsIGRldGFjaCBpdCBmaXJzdCBzbyB3ZSBjbGVhbiB1cCByZWZlcmVuY2VzIGFwcHJvcHJpYXRlbHkuXG5cbiAgICAgIGNvbnN0IHByZXZJZHggPSB0aGlzLmluZGV4T2Yodmlld1JlZik7XG5cbiAgICAgIC8vIEEgdmlldyBtaWdodCBiZSBhdHRhY2hlZCBlaXRoZXIgdG8gdGhpcyBvciBhIGRpZmZlcmVudCBjb250YWluZXIuIFRoZSBgcHJldklkeGAgZm9yXG4gICAgICAvLyB0aG9zZSBjYXNlcyB3aWxsIGJlOlxuICAgICAgLy8gZXF1YWwgdG8gLTEgZm9yIHZpZXdzIGF0dGFjaGVkIHRvIHRoaXMgVmlld0NvbnRhaW5lclJlZlxuICAgICAgLy8gPj0gMCBmb3Igdmlld3MgYXR0YWNoZWQgdG8gYSBkaWZmZXJlbnQgVmlld0NvbnRhaW5lclJlZlxuICAgICAgaWYgKHByZXZJZHggIT09IC0xKSB7XG4gICAgICAgIHRoaXMuZGV0YWNoKHByZXZJZHgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgcHJldkxDb250YWluZXIgPSBsVmlld1tQQVJFTlRdIGFzIExDb250YWluZXI7XG4gICAgICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICAgICAgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgICAgaXNMQ29udGFpbmVyKHByZXZMQ29udGFpbmVyKSwgdHJ1ZSxcbiAgICAgICAgICAgICAgICAnQW4gYXR0YWNoZWQgdmlldyBzaG91bGQgaGF2ZSBpdHMgUEFSRU5UIHBvaW50IHRvIGEgY29udGFpbmVyLicpO1xuXG5cbiAgICAgICAgLy8gV2UgbmVlZCB0byByZS1jcmVhdGUgYSBSM1ZpZXdDb250YWluZXJSZWYgaW5zdGFuY2Ugc2luY2UgdGhvc2UgYXJlIG5vdCBzdG9yZWQgb25cbiAgICAgICAgLy8gTFZpZXcgKG5vciBhbnl3aGVyZSBlbHNlKS5cbiAgICAgICAgY29uc3QgcHJldlZDUmVmID0gbmV3IFIzVmlld0NvbnRhaW5lclJlZihcbiAgICAgICAgICAgIHByZXZMQ29udGFpbmVyLCBwcmV2TENvbnRhaW5lcltUX0hPU1RdIGFzIFREaXJlY3RpdmVIb3N0Tm9kZSwgcHJldkxDb250YWluZXJbUEFSRU5UXSk7XG5cbiAgICAgICAgcHJldlZDUmVmLmRldGFjaChwcmV2VkNSZWYuaW5kZXhPZih2aWV3UmVmKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gTG9naWNhbCBvcGVyYXRpb24gb2YgYWRkaW5nIGBMVmlld2AgdG8gYExDb250YWluZXJgXG4gICAgY29uc3QgYWRqdXN0ZWRJZHggPSB0aGlzLl9hZGp1c3RJbmRleChpbmRleCk7XG4gICAgY29uc3QgbENvbnRhaW5lciA9IHRoaXMuX2xDb250YWluZXI7XG5cbiAgICBhZGRMVmlld1RvTENvbnRhaW5lcihsQ29udGFpbmVyLCBsVmlldywgYWRqdXN0ZWRJZHgsIGFkZFRvRE9NKTtcblxuICAgICh2aWV3UmVmIGFzIFIzVmlld1JlZjxhbnk+KS5hdHRhY2hUb1ZpZXdDb250YWluZXJSZWYoKTtcbiAgICBhZGRUb0FycmF5KGdldE9yQ3JlYXRlVmlld1JlZnMobENvbnRhaW5lciksIGFkanVzdGVkSWR4LCB2aWV3UmVmKTtcblxuICAgIHJldHVybiB2aWV3UmVmO1xuICB9XG5cbiAgb3ZlcnJpZGUgbW92ZSh2aWV3UmVmOiBWaWV3UmVmLCBuZXdJbmRleDogbnVtYmVyKTogVmlld1JlZiB7XG4gICAgaWYgKG5nRGV2TW9kZSAmJiB2aWV3UmVmLmRlc3Ryb3llZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgbW92ZSBhIGRlc3Ryb3llZCBWaWV3IGluIGEgVmlld0NvbnRhaW5lciEnKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuaW5zZXJ0KHZpZXdSZWYsIG5ld0luZGV4KTtcbiAgfVxuXG4gIG92ZXJyaWRlIGluZGV4T2Yodmlld1JlZjogVmlld1JlZik6IG51bWJlciB7XG4gICAgY29uc3Qgdmlld1JlZnNBcnIgPSBnZXRWaWV3UmVmcyh0aGlzLl9sQ29udGFpbmVyKTtcbiAgICByZXR1cm4gdmlld1JlZnNBcnIgIT09IG51bGwgPyB2aWV3UmVmc0Fyci5pbmRleE9mKHZpZXdSZWYpIDogLTE7XG4gIH1cblxuICBvdmVycmlkZSByZW1vdmUoaW5kZXg/OiBudW1iZXIpOiB2b2lkIHtcbiAgICBjb25zdCBhZGp1c3RlZElkeCA9IHRoaXMuX2FkanVzdEluZGV4KGluZGV4LCAtMSk7XG4gICAgY29uc3QgZGV0YWNoZWRWaWV3ID0gZGV0YWNoVmlldyh0aGlzLl9sQ29udGFpbmVyLCBhZGp1c3RlZElkeCk7XG5cbiAgICBpZiAoZGV0YWNoZWRWaWV3KSB7XG4gICAgICAvLyBCZWZvcmUgZGVzdHJveWluZyB0aGUgdmlldywgcmVtb3ZlIGl0IGZyb20gdGhlIGNvbnRhaW5lcidzIGFycmF5IG9mIGBWaWV3UmVmYHMuXG4gICAgICAvLyBUaGlzIGVuc3VyZXMgdGhlIHZpZXcgY29udGFpbmVyIGxlbmd0aCBpcyB1cGRhdGVkIGJlZm9yZSBjYWxsaW5nXG4gICAgICAvLyBgZGVzdHJveUxWaWV3YCwgd2hpY2ggY291bGQgcmVjdXJzaXZlbHkgY2FsbCB2aWV3IGNvbnRhaW5lciBtZXRob2RzIHRoYXRcbiAgICAgIC8vIHJlbHkgb24gYW4gYWNjdXJhdGUgY29udGFpbmVyIGxlbmd0aC5cbiAgICAgIC8vIChlLmcuIGEgbWV0aG9kIG9uIHRoaXMgdmlldyBjb250YWluZXIgYmVpbmcgY2FsbGVkIGJ5IGEgY2hpbGQgZGlyZWN0aXZlJ3MgT25EZXN0cm95XG4gICAgICAvLyBsaWZlY3ljbGUgaG9vaylcbiAgICAgIHJlbW92ZUZyb21BcnJheShnZXRPckNyZWF0ZVZpZXdSZWZzKHRoaXMuX2xDb250YWluZXIpLCBhZGp1c3RlZElkeCk7XG4gICAgICBkZXN0cm95TFZpZXcoZGV0YWNoZWRWaWV3W1RWSUVXXSwgZGV0YWNoZWRWaWV3KTtcbiAgICB9XG4gIH1cblxuICBvdmVycmlkZSBkZXRhY2goaW5kZXg/OiBudW1iZXIpOiBWaWV3UmVmfG51bGwge1xuICAgIGNvbnN0IGFkanVzdGVkSWR4ID0gdGhpcy5fYWRqdXN0SW5kZXgoaW5kZXgsIC0xKTtcbiAgICBjb25zdCB2aWV3ID0gZGV0YWNoVmlldyh0aGlzLl9sQ29udGFpbmVyLCBhZGp1c3RlZElkeCk7XG5cbiAgICBjb25zdCB3YXNEZXRhY2hlZCA9XG4gICAgICAgIHZpZXcgJiYgcmVtb3ZlRnJvbUFycmF5KGdldE9yQ3JlYXRlVmlld1JlZnModGhpcy5fbENvbnRhaW5lciksIGFkanVzdGVkSWR4KSAhPSBudWxsO1xuICAgIHJldHVybiB3YXNEZXRhY2hlZCA/IG5ldyBSM1ZpZXdSZWYodmlldyEpIDogbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgX2FkanVzdEluZGV4KGluZGV4PzogbnVtYmVyLCBzaGlmdDogbnVtYmVyID0gMCkge1xuICAgIGlmIChpbmRleCA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gdGhpcy5sZW5ndGggKyBzaGlmdDtcbiAgICB9XG4gICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgYXNzZXJ0R3JlYXRlclRoYW4oaW5kZXgsIC0xLCBgVmlld1JlZiBpbmRleCBtdXN0IGJlIHBvc2l0aXZlLCBnb3QgJHtpbmRleH1gKTtcbiAgICAgIC8vICsxIGJlY2F1c2UgaXQncyBsZWdhbCB0byBpbnNlcnQgYXQgdGhlIGVuZC5cbiAgICAgIGFzc2VydExlc3NUaGFuKGluZGV4LCB0aGlzLmxlbmd0aCArIDEgKyBzaGlmdCwgJ2luZGV4Jyk7XG4gICAgfVxuICAgIHJldHVybiBpbmRleDtcbiAgfVxufTtcblxuZnVuY3Rpb24gZ2V0Vmlld1JlZnMobENvbnRhaW5lcjogTENvbnRhaW5lcik6IFZpZXdSZWZbXXxudWxsIHtcbiAgcmV0dXJuIGxDb250YWluZXJbVklFV19SRUZTXSBhcyBWaWV3UmVmW107XG59XG5cbmZ1bmN0aW9uIGdldE9yQ3JlYXRlVmlld1JlZnMobENvbnRhaW5lcjogTENvbnRhaW5lcik6IFZpZXdSZWZbXSB7XG4gIHJldHVybiAobENvbnRhaW5lcltWSUVXX1JFRlNdIHx8IChsQ29udGFpbmVyW1ZJRVdfUkVGU10gPSBbXSkpIGFzIFZpZXdSZWZbXTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgVmlld0NvbnRhaW5lclJlZiBhbmQgc3RvcmVzIGl0IG9uIHRoZSBpbmplY3Rvci5cbiAqXG4gKiBAcGFyYW0gaG9zdFROb2RlIFRoZSBub2RlIHRoYXQgaXMgcmVxdWVzdGluZyBhIFZpZXdDb250YWluZXJSZWZcbiAqIEBwYXJhbSBob3N0TFZpZXcgVGhlIHZpZXcgdG8gd2hpY2ggdGhlIG5vZGUgYmVsb25nc1xuICogQHJldHVybnMgVGhlIFZpZXdDb250YWluZXJSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVDb250YWluZXJSZWYoXG4gICAgaG9zdFROb2RlOiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlLFxuICAgIGhvc3RMVmlldzogTFZpZXcpOiBWaWV3Q29udGFpbmVyUmVmIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydFROb2RlVHlwZShob3N0VE5vZGUsIFROb2RlVHlwZS5BbnlDb250YWluZXIgfCBUTm9kZVR5cGUuQW55Uk5vZGUpO1xuXG4gIGxldCBsQ29udGFpbmVyOiBMQ29udGFpbmVyO1xuICBjb25zdCBzbG90VmFsdWUgPSBob3N0TFZpZXdbaG9zdFROb2RlLmluZGV4XTtcbiAgaWYgKGlzTENvbnRhaW5lcihzbG90VmFsdWUpKSB7XG4gICAgLy8gSWYgdGhlIGhvc3QgaXMgYSBjb250YWluZXIsIHdlIGRvbid0IG5lZWQgdG8gY3JlYXRlIGEgbmV3IExDb250YWluZXJcbiAgICBsQ29udGFpbmVyID0gc2xvdFZhbHVlO1xuICB9IGVsc2Uge1xuICAgIC8vIEFuIExDb250YWluZXIgYW5jaG9yIGNhbiBub3QgYmUgYG51bGxgLCBidXQgd2Ugc2V0IGl0IGhlcmUgdGVtcG9yYXJpbHlcbiAgICAvLyBhbmQgdXBkYXRlIHRvIHRoZSBhY3R1YWwgdmFsdWUgbGF0ZXIgaW4gdGhpcyBmdW5jdGlvbiAoc2VlXG4gICAgLy8gYF9sb2NhdGVPckNyZWF0ZUFuY2hvck5vZGVgKS5cbiAgICBsQ29udGFpbmVyID0gY3JlYXRlTENvbnRhaW5lcihzbG90VmFsdWUsIGhvc3RMVmlldywgbnVsbCEsIGhvc3RUTm9kZSk7XG4gICAgaG9zdExWaWV3W2hvc3RUTm9kZS5pbmRleF0gPSBsQ29udGFpbmVyO1xuICAgIGFkZFRvVmlld1RyZWUoaG9zdExWaWV3LCBsQ29udGFpbmVyKTtcbiAgfVxuICBfbG9jYXRlT3JDcmVhdGVBbmNob3JOb2RlKGxDb250YWluZXIsIGhvc3RMVmlldywgaG9zdFROb2RlLCBzbG90VmFsdWUpO1xuXG4gIHJldHVybiBuZXcgUjNWaWV3Q29udGFpbmVyUmVmKGxDb250YWluZXIsIGhvc3RUTm9kZSwgaG9zdExWaWV3KTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuZCBpbnNlcnRzIGEgY29tbWVudCBub2RlIHRoYXQgYWN0cyBhcyBhbiBhbmNob3IgZm9yIGEgdmlldyBjb250YWluZXIuXG4gKlxuICogSWYgdGhlIGhvc3QgaXMgYSByZWd1bGFyIGVsZW1lbnQsIHdlIGhhdmUgdG8gaW5zZXJ0IGEgY29tbWVudCBub2RlIG1hbnVhbGx5IHdoaWNoIHdpbGxcbiAqIGJlIHVzZWQgYXMgYW4gYW5jaG9yIHdoZW4gaW5zZXJ0aW5nIGVsZW1lbnRzLiBJbiB0aGlzIHNwZWNpZmljIGNhc2Ugd2UgdXNlIGxvdy1sZXZlbCBET01cbiAqIG1hbmlwdWxhdGlvbiB0byBpbnNlcnQgaXQuXG4gKi9cbmZ1bmN0aW9uIGluc2VydEFuY2hvck5vZGUoaG9zdExWaWV3OiBMVmlldywgaG9zdFROb2RlOiBUTm9kZSk6IFJDb21tZW50IHtcbiAgY29uc3QgcmVuZGVyZXIgPSBob3N0TFZpZXdbUkVOREVSRVJdO1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQ3JlYXRlQ29tbWVudCsrO1xuICBjb25zdCBjb21tZW50Tm9kZSA9IHJlbmRlcmVyLmNyZWF0ZUNvbW1lbnQobmdEZXZNb2RlID8gJ2NvbnRhaW5lcicgOiAnJyk7XG5cbiAgY29uc3QgaG9zdE5hdGl2ZSA9IGdldE5hdGl2ZUJ5VE5vZGUoaG9zdFROb2RlLCBob3N0TFZpZXcpITtcbiAgY29uc3QgcGFyZW50T2ZIb3N0TmF0aXZlID0gbmF0aXZlUGFyZW50Tm9kZShyZW5kZXJlciwgaG9zdE5hdGl2ZSk7XG4gIG5hdGl2ZUluc2VydEJlZm9yZShcbiAgICAgIHJlbmRlcmVyLCBwYXJlbnRPZkhvc3ROYXRpdmUhLCBjb21tZW50Tm9kZSwgbmF0aXZlTmV4dFNpYmxpbmcocmVuZGVyZXIsIGhvc3ROYXRpdmUpLCBmYWxzZSk7XG4gIHJldHVybiBjb21tZW50Tm9kZTtcbn1cblxubGV0IF9sb2NhdGVPckNyZWF0ZUFuY2hvck5vZGUgPSBjcmVhdGVBbmNob3JOb2RlO1xubGV0IF9wb3B1bGF0ZURlaHlkcmF0ZWRWaWV3c0luQ29udGFpbmVyOiB0eXBlb2YgcG9wdWxhdGVEZWh5ZHJhdGVkVmlld3NJbkNvbnRhaW5lckltcGwgPVxuICAgIChsQ29udGFpbmVyOiBMQ29udGFpbmVyLCBsVmlldzogTFZpZXcsIHROb2RlOiBUTm9kZSkgPT4gZmFsc2U7ICAvLyBub29wIGJ5IGRlZmF1bHRcblxuLyoqXG4gKiBMb29rcyB1cCBkZWh5ZHJhdGVkIHZpZXdzIHRoYXQgYmVsb25nIHRvIGEgZ2l2ZW4gTENvbnRhaW5lciBhbmQgcG9wdWxhdGVzXG4gKiB0aGlzIGluZm9ybWF0aW9uIGludG8gdGhlIGBMQ29udGFpbmVyW0RFSFlEUkFURURfVklFV1NdYCBzbG90LiBXaGVuIHJ1bm5pbmdcbiAqIGluIGNsaWVudC1vbmx5IG1vZGUsIHRoaXMgZnVuY3Rpb24gaXMgYSBub29wLlxuICpcbiAqIEBwYXJhbSBsQ29udGFpbmVyIExDb250YWluZXIgdGhhdCBzaG91bGQgYmUgcG9wdWxhdGVkLlxuICogQHJldHVybnMgYSBib29sZWFuIGZsYWcgdGhhdCBpbmRpY2F0ZXMgd2hldGhlciBhIHBvcHVsYXRpbmcgb3BlcmF0aW9uXG4gKiAgIHdhcyBzdWNjZXNzZnVsLiBUaGUgb3BlcmF0aW9uIG1pZ2h0IGJlIHVuc3VjY2Vzc2Z1bCBpbiBjYXNlIGlzIGhhcyBjb21wbGV0ZWRcbiAqICAgcHJldmlvdXNseSwgd2UgYXJlIHJlbmRlcmluZyBpbiBjbGllbnQtb25seSBtb2RlIG9yIHRoaXMgY29udGVudCBpcyBsb2NhdGVkXG4gKiAgIGluIGEgc2tpcCBoeWRyYXRpb24gc2VjdGlvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBvcHVsYXRlRGVoeWRyYXRlZFZpZXdzSW5Db250YWluZXIobENvbnRhaW5lcjogTENvbnRhaW5lcik6IGJvb2xlYW4ge1xuICByZXR1cm4gX3BvcHVsYXRlRGVoeWRyYXRlZFZpZXdzSW5Db250YWluZXIobENvbnRhaW5lciwgZ2V0TFZpZXcoKSwgZ2V0Q3VycmVudFROb2RlKCkhKTtcbn1cblxuLyoqXG4gKiBSZWd1bGFyIGNyZWF0aW9uIG1vZGU6IGFuIGFuY2hvciBpcyBjcmVhdGVkIGFuZFxuICogYXNzaWduZWQgdG8gdGhlIGBsQ29udGFpbmVyW05BVElWRV1gIHNsb3QuXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUFuY2hvck5vZGUoXG4gICAgbENvbnRhaW5lcjogTENvbnRhaW5lciwgaG9zdExWaWV3OiBMVmlldywgaG9zdFROb2RlOiBUTm9kZSwgc2xvdFZhbHVlOiBhbnkpIHtcbiAgLy8gV2UgYWxyZWFkeSBoYXZlIGEgbmF0aXZlIGVsZW1lbnQgKGFuY2hvcikgc2V0LCByZXR1cm4uXG4gIGlmIChsQ29udGFpbmVyW05BVElWRV0pIHJldHVybjtcblxuICBsZXQgY29tbWVudE5vZGU6IFJDb21tZW50O1xuICAvLyBJZiB0aGUgaG9zdCBpcyBhbiBlbGVtZW50IGNvbnRhaW5lciwgdGhlIG5hdGl2ZSBob3N0IGVsZW1lbnQgaXMgZ3VhcmFudGVlZCB0byBiZSBhXG4gIC8vIGNvbW1lbnQgYW5kIHdlIGNhbiByZXVzZSB0aGF0IGNvbW1lbnQgYXMgYW5jaG9yIGVsZW1lbnQgZm9yIHRoZSBuZXcgTENvbnRhaW5lci5cbiAgLy8gVGhlIGNvbW1lbnQgbm9kZSBpbiBxdWVzdGlvbiBpcyBhbHJlYWR5IHBhcnQgb2YgdGhlIERPTSBzdHJ1Y3R1cmUgc28gd2UgZG9uJ3QgbmVlZCB0byBhcHBlbmRcbiAgLy8gaXQgYWdhaW4uXG4gIGlmIChob3N0VE5vZGUudHlwZSAmIFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKSB7XG4gICAgY29tbWVudE5vZGUgPSB1bndyYXBSTm9kZShzbG90VmFsdWUpIGFzIFJDb21tZW50O1xuICB9IGVsc2Uge1xuICAgIGNvbW1lbnROb2RlID0gaW5zZXJ0QW5jaG9yTm9kZShob3N0TFZpZXcsIGhvc3RUTm9kZSk7XG4gIH1cbiAgbENvbnRhaW5lcltOQVRJVkVdID0gY29tbWVudE5vZGU7XG59XG5cbi8qKlxuICogSHlkcmF0aW9uIGxvZ2ljIHRoYXQgbG9va3MgdXAgYWxsIGRlaHlkcmF0ZWQgdmlld3MgaW4gdGhpcyBjb250YWluZXJcbiAqIGFuZCBwdXRzIHRoZW0gaW50byBgbENvbnRhaW5lcltERUhZRFJBVEVEX1ZJRVdTXWAgc2xvdC5cbiAqXG4gKiBAcmV0dXJucyBhIGJvb2xlYW4gZmxhZyB0aGF0IGluZGljYXRlcyB3aGV0aGVyIGEgcG9wdWxhdGluZyBvcGVyYXRpb25cbiAqICAgd2FzIHN1Y2Nlc3NmdWwuIFRoZSBvcGVyYXRpb24gbWlnaHQgYmUgdW5zdWNjZXNzZnVsIGluIGNhc2UgaXMgaGFzIGNvbXBsZXRlZFxuICogICBwcmV2aW91c2x5LCB3ZSBhcmUgcmVuZGVyaW5nIGluIGNsaWVudC1vbmx5IG1vZGUgb3IgdGhpcyBjb250ZW50IGlzIGxvY2F0ZWRcbiAqICAgaW4gYSBza2lwIGh5ZHJhdGlvbiBzZWN0aW9uLlxuICovXG5mdW5jdGlvbiBwb3B1bGF0ZURlaHlkcmF0ZWRWaWV3c0luQ29udGFpbmVySW1wbChcbiAgICBsQ29udGFpbmVyOiBMQ29udGFpbmVyLCBob3N0TFZpZXc6IExWaWV3LCBob3N0VE5vZGU6IFROb2RlKTogYm9vbGVhbiB7XG4gIC8vIFdlIGFscmVhZHkgaGF2ZSBhIG5hdGl2ZSBlbGVtZW50IChhbmNob3IpIHNldCBhbmQgdGhlIHByb2Nlc3NcbiAgLy8gb2YgZmluZGluZyBkZWh5ZHJhdGVkIHZpZXdzIGhhcHBlbmVkIChzbyB0aGUgYGxDb250YWluZXJbREVIWURSQVRFRF9WSUVXU11gXG4gIC8vIGlzIG5vdCBudWxsKSwgZXhpdCBlYXJseS5cbiAgaWYgKGxDb250YWluZXJbTkFUSVZFXSAmJiBsQ29udGFpbmVyW0RFSFlEUkFURURfVklFV1NdKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBjb25zdCBoeWRyYXRpb25JbmZvID0gaG9zdExWaWV3W0hZRFJBVElPTl07XG4gIGNvbnN0IG5vT2Zmc2V0SW5kZXggPSBob3N0VE5vZGUuaW5kZXggLSBIRUFERVJfT0ZGU0VUO1xuXG4gIC8vIFRPRE8oYWt1c2huaXIpOiB0aGlzIHNob3VsZCByZWFsbHkgYmUgYSBzaW5nbGUgY29uZGl0aW9uLCByZWZhY3RvciB0aGUgY29kZVxuICAvLyB0byB1c2UgYGhhc0luU2tpcEh5ZHJhdGlvbkJsb2NrRmxhZ2AgbG9naWMgaW5zaWRlIGBpc0luU2tpcEh5ZHJhdGlvbkJsb2NrYC5cbiAgY29uc3Qgc2tpcEh5ZHJhdGlvbiA9IGlzSW5Ta2lwSHlkcmF0aW9uQmxvY2soaG9zdFROb2RlKSB8fCBoYXNJblNraXBIeWRyYXRpb25CbG9ja0ZsYWcoaG9zdFROb2RlKTtcblxuICBjb25zdCBpc05vZGVDcmVhdGlvbk1vZGUgPVxuICAgICAgIWh5ZHJhdGlvbkluZm8gfHwgc2tpcEh5ZHJhdGlvbiB8fCBpc0Rpc2Nvbm5lY3RlZE5vZGUoaHlkcmF0aW9uSW5mbywgbm9PZmZzZXRJbmRleCk7XG5cbiAgLy8gUmVndWxhciBjcmVhdGlvbiBtb2RlLlxuICBpZiAoaXNOb2RlQ3JlYXRpb25Nb2RlKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLy8gSHlkcmF0aW9uIG1vZGUsIGxvb2tpbmcgdXAgYW4gYW5jaG9yIG5vZGUgYW5kIGRlaHlkcmF0ZWQgdmlld3MgaW4gRE9NLlxuICBjb25zdCBjdXJyZW50Uk5vZGU6IFJOb2RlfG51bGwgPSBnZXRTZWdtZW50SGVhZChoeWRyYXRpb25JbmZvLCBub09mZnNldEluZGV4KTtcblxuICBjb25zdCBzZXJpYWxpemVkVmlld3MgPSBoeWRyYXRpb25JbmZvLmRhdGFbQ09OVEFJTkVSU10/Lltub09mZnNldEluZGV4XTtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnREZWZpbmVkKFxuICAgICAgICAgIHNlcmlhbGl6ZWRWaWV3cyxcbiAgICAgICAgICAnVW5leHBlY3RlZCBzdGF0ZTogbm8gaHlkcmF0aW9uIGluZm8gYXZhaWxhYmxlIGZvciBhIGdpdmVuIFROb2RlLCAnICtcbiAgICAgICAgICAgICAgJ3doaWNoIHJlcHJlc2VudHMgYSB2aWV3IGNvbnRhaW5lci4nKTtcblxuICBjb25zdCBbY29tbWVudE5vZGUsIGRlaHlkcmF0ZWRWaWV3c10gPVxuICAgICAgbG9jYXRlRGVoeWRyYXRlZFZpZXdzSW5Db250YWluZXIoY3VycmVudFJOb2RlISwgc2VyaWFsaXplZFZpZXdzISk7XG5cbiAgaWYgKG5nRGV2TW9kZSkge1xuICAgIHZhbGlkYXRlTWF0Y2hpbmdOb2RlKGNvbW1lbnROb2RlLCBOb2RlLkNPTU1FTlRfTk9ERSwgbnVsbCwgaG9zdExWaWV3LCBob3N0VE5vZGUsIHRydWUpO1xuICAgIC8vIERvIG5vdCB0aHJvdyBpbiBjYXNlIHRoaXMgbm9kZSBpcyBhbHJlYWR5IGNsYWltZWQgKHRodXMgYGZhbHNlYCBhcyBhIHNlY29uZFxuICAgIC8vIGFyZ3VtZW50KS4gSWYgdGhpcyBjb250YWluZXIgaXMgY3JlYXRlZCBiYXNlZCBvbiBhbiBgPG5nLXRlbXBsYXRlPmAsIHRoZSBjb21tZW50XG4gICAgLy8gbm9kZSB3b3VsZCBiZSBhbHJlYWR5IGNsYWltZWQgZnJvbSB0aGUgYHRlbXBsYXRlYCBpbnN0cnVjdGlvbi4gSWYgYW4gZWxlbWVudCBhY3RzXG4gICAgLy8gYXMgYW4gYW5jaG9yIChlLmcuIDxkaXYgI3ZjUmVmPiksIGEgc2VwYXJhdGUgY29tbWVudCBub2RlIHdvdWxkIGJlIGNyZWF0ZWQvbG9jYXRlZCxcbiAgICAvLyBzbyB3ZSBuZWVkIHRvIGNsYWltIGl0IGhlcmUuXG4gICAgbWFya1JOb2RlQXNDbGFpbWVkQnlIeWRyYXRpb24oY29tbWVudE5vZGUsIGZhbHNlKTtcbiAgfVxuXG4gIGxDb250YWluZXJbTkFUSVZFXSA9IGNvbW1lbnROb2RlIGFzIFJDb21tZW50O1xuICBsQ29udGFpbmVyW0RFSFlEUkFURURfVklFV1NdID0gZGVoeWRyYXRlZFZpZXdzO1xuXG4gIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBsb2NhdGVPckNyZWF0ZUFuY2hvck5vZGUoXG4gICAgbENvbnRhaW5lcjogTENvbnRhaW5lciwgaG9zdExWaWV3OiBMVmlldywgaG9zdFROb2RlOiBUTm9kZSwgc2xvdFZhbHVlOiBhbnkpOiB2b2lkIHtcbiAgaWYgKCFfcG9wdWxhdGVEZWh5ZHJhdGVkVmlld3NJbkNvbnRhaW5lcihsQ29udGFpbmVyLCBob3N0TFZpZXcsIGhvc3RUTm9kZSkpIHtcbiAgICAvLyBQb3B1bGF0aW5nIGRlaHlkcmF0ZWQgdmlld3Mgb3BlcmF0aW9uIHJldHVybmVkIGBmYWxzZWAsIHdoaWNoIGluZGljYXRlc1xuICAgIC8vIHRoYXQgdGhlIGxvZ2ljIHdhcyBydW5uaW5nIGluIGNsaWVudC1vbmx5IG1vZGUsIHRoaXMgYW4gYW5jaG9yIGNvbW1lbnRcbiAgICAvLyBub2RlIHNob3VsZCBiZSBjcmVhdGVkIGZvciB0aGlzIGNvbnRhaW5lci5cbiAgICBjcmVhdGVBbmNob3JOb2RlKGxDb250YWluZXIsIGhvc3RMVmlldywgaG9zdFROb2RlLCBzbG90VmFsdWUpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbmFibGVMb2NhdGVPckNyZWF0ZUNvbnRhaW5lclJlZkltcGwoKSB7XG4gIF9sb2NhdGVPckNyZWF0ZUFuY2hvck5vZGUgPSBsb2NhdGVPckNyZWF0ZUFuY2hvck5vZGU7XG4gIF9wb3B1bGF0ZURlaHlkcmF0ZWRWaWV3c0luQ29udGFpbmVyID0gcG9wdWxhdGVEZWh5ZHJhdGVkVmlld3NJbkNvbnRhaW5lckltcGw7XG59XG4iXX0=