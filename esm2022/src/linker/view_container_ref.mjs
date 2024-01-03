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
let _populateDehydratedViewsInLContainer = () => false; // noop by default
/**
 * Looks up dehydrated views that belong to a given LContainer and populates
 * this information into the `LContainer[DEHYDRATED_VIEWS]` slot. When running
 * in client-only mode, this function is a noop.
 *
 * @param lContainer LContainer that should be populated.
 * @param tNode Corresponding TNode.
 * @param hostLView LView that hosts LContainer.
 * @returns a boolean flag that indicates whether a populating operation
 *   was successful. The operation might be unsuccessful in case is has completed
 *   previously, we are rendering in client-only mode or this content is located
 *   in a skip hydration section.
 */
export function populateDehydratedViewsInLContainer(lContainer, tNode, hostLView) {
    return _populateDehydratedViewsInLContainer(lContainer, tNode, hostLView);
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
function populateDehydratedViewsInLContainerImpl(lContainer, tNode, hostLView) {
    // We already have a native element (anchor) set and the process
    // of finding dehydrated views happened (so the `lContainer[DEHYDRATED_VIEWS]`
    // is not null), exit early.
    if (lContainer[NATIVE] && lContainer[DEHYDRATED_VIEWS]) {
        return true;
    }
    const hydrationInfo = hostLView[HYDRATION];
    const noOffsetIndex = tNode.index - HEADER_OFFSET;
    const isNodeCreationMode = !hydrationInfo || isInSkipHydrationBlock(tNode) ||
        isDisconnectedNode(hydrationInfo, noOffsetIndex);
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
        validateMatchingNode(commentNode, Node.COMMENT_NODE, null, hostLView, tNode, true);
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
    if (!_populateDehydratedViewsInLContainer(lContainer, hostTNode, hostLView)) {
        // Populating dehydrated views operation returned `false`, which indicates
        // that the logic was running in client-only mode, this an anchor comment
        // node should be created for this container.
        createAnchorNode(lContainer, hostLView, hostTNode, slotValue);
    }
}
export function enableLocateOrCreateContainerRefImpl() {
    _locateOrCreateAnchorNode = locateOrCreateAnchorNode;
    _populateDehydratedViewsInLContainer = populateDehydratedViewsInLContainerImpl;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld19jb250YWluZXJfcmVmLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvbGlua2VyL3ZpZXdfY29udGFpbmVyX3JlZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFHSCxPQUFPLEVBQUMsbUJBQW1CLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUN0RCxPQUFPLEVBQUMsb0JBQW9CLEVBQUMsTUFBTSw2QkFBNkIsQ0FBQztBQUNqRSxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFDbkQsT0FBTyxFQUE4QixzQkFBc0IsRUFBQyxNQUFNLDZCQUE2QixDQUFDO0FBQ2hHLE9BQU8sRUFBQyxjQUFjLEVBQUUsa0JBQWtCLEVBQUUsNkJBQTZCLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUNyRyxPQUFPLEVBQUMsMEJBQTBCLEVBQUUsZ0NBQWdDLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUNoRyxPQUFPLEVBQUMsTUFBTSxFQUFPLE1BQU0sbUJBQW1CLENBQUM7QUFDL0MsT0FBTyxFQUFDLGtCQUFrQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDckQsT0FBTyxFQUFDLGdCQUFnQixJQUFJLGtCQUFrQixFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFDaEYsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3RELE9BQU8sRUFBQyx5QkFBeUIsRUFBRSxZQUFZLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDdEUsT0FBTyxFQUFDLGFBQWEsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLGdDQUFnQyxDQUFDO0FBQy9FLE9BQU8sRUFBQyx1QkFBdUIsRUFBRSxnQkFBZ0IsRUFBYyxNQUFNLEVBQUUsU0FBUyxFQUFDLE1BQU0saUNBQWlDLENBQUM7QUFJekgsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLG1DQUFtQyxDQUFDO0FB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O1FBQzFFLHlFQUF5RTtRQUN6RSw2Q0FBNkM7UUFDN0MsZ0JBQWdCLENBQUMsVUFBVSxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUM7S0FDL0Q7QUFDSCxDQUFDO0FBRUQsTUFBTSxVQUFVLG9DQUFvQztJQUNsRCx5QkFBeUIsR0FBRyx3QkFBd0IsQ0FBQztJQUNyRCxvQ0FBb0MsR0FBRyx1Q0FBdUMsQ0FBQztBQUNqRixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4uL2RpL2luamVjdG9yJztcbmltcG9ydCB7RW52aXJvbm1lbnRJbmplY3Rvcn0gZnJvbSAnLi4vZGkvcjNfaW5qZWN0b3InO1xuaW1wb3J0IHt2YWxpZGF0ZU1hdGNoaW5nTm9kZX0gZnJvbSAnLi4vaHlkcmF0aW9uL2Vycm9yX2hhbmRsaW5nJztcbmltcG9ydCB7Q09OVEFJTkVSU30gZnJvbSAnLi4vaHlkcmF0aW9uL2ludGVyZmFjZXMnO1xuaW1wb3J0IHtoYXNJblNraXBIeWRyYXRpb25CbG9ja0ZsYWcsIGlzSW5Ta2lwSHlkcmF0aW9uQmxvY2t9IGZyb20gJy4uL2h5ZHJhdGlvbi9za2lwX2h5ZHJhdGlvbic7XG5pbXBvcnQge2dldFNlZ21lbnRIZWFkLCBpc0Rpc2Nvbm5lY3RlZE5vZGUsIG1hcmtSTm9kZUFzQ2xhaW1lZEJ5SHlkcmF0aW9ufSBmcm9tICcuLi9oeWRyYXRpb24vdXRpbHMnO1xuaW1wb3J0IHtmaW5kTWF0Y2hpbmdEZWh5ZHJhdGVkVmlldywgbG9jYXRlRGVoeWRyYXRlZFZpZXdzSW5Db250YWluZXJ9IGZyb20gJy4uL2h5ZHJhdGlvbi92aWV3cyc7XG5pbXBvcnQge2lzVHlwZSwgVHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlL3R5cGUnO1xuaW1wb3J0IHthc3NlcnROb2RlSW5qZWN0b3J9IGZyb20gJy4uL3JlbmRlcjMvYXNzZXJ0JztcbmltcG9ydCB7Q29tcG9uZW50RmFjdG9yeSBhcyBSM0NvbXBvbmVudEZhY3Rvcnl9IGZyb20gJy4uL3JlbmRlcjMvY29tcG9uZW50X3JlZic7XG5pbXBvcnQge2dldENvbXBvbmVudERlZn0gZnJvbSAnLi4vcmVuZGVyMy9kZWZpbml0aW9uJztcbmltcG9ydCB7Z2V0UGFyZW50SW5qZWN0b3JMb2NhdGlvbiwgTm9kZUluamVjdG9yfSBmcm9tICcuLi9yZW5kZXIzL2RpJztcbmltcG9ydCB7YWRkVG9WaWV3VHJlZSwgY3JlYXRlTENvbnRhaW5lcn0gZnJvbSAnLi4vcmVuZGVyMy9pbnN0cnVjdGlvbnMvc2hhcmVkJztcbmltcG9ydCB7Q09OVEFJTkVSX0hFQURFUl9PRkZTRVQsIERFSFlEUkFURURfVklFV1MsIExDb250YWluZXIsIE5BVElWRSwgVklFV19SRUZTfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7Tm9kZUluamVjdG9yT2Zmc2V0fSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvaW5qZWN0b3InO1xuaW1wb3J0IHtUQ29udGFpbmVyTm9kZSwgVERpcmVjdGl2ZUhvc3ROb2RlLCBURWxlbWVudENvbnRhaW5lck5vZGUsIFRFbGVtZW50Tm9kZSwgVE5vZGUsIFROb2RlVHlwZX0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtSQ29tbWVudCwgUk5vZGV9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy9yZW5kZXJlcl9kb20nO1xuaW1wb3J0IHtpc0xDb250YWluZXJ9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy90eXBlX2NoZWNrcyc7XG5pbXBvcnQge0hFQURFUl9PRkZTRVQsIEhZRFJBVElPTiwgTFZpZXcsIFBBUkVOVCwgUkVOREVSRVIsIFRfSE9TVCwgVFZJRVd9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7YXNzZXJ0VE5vZGVUeXBlfSBmcm9tICcuLi9yZW5kZXIzL25vZGVfYXNzZXJ0JztcbmltcG9ydCB7ZGVzdHJveUxWaWV3LCBkZXRhY2hWaWV3LCBuYXRpdmVJbnNlcnRCZWZvcmUsIG5hdGl2ZU5leHRTaWJsaW5nLCBuYXRpdmVQYXJlbnROb2RlfSBmcm9tICcuLi9yZW5kZXIzL25vZGVfbWFuaXB1bGF0aW9uJztcbmltcG9ydCB7Z2V0Q3VycmVudFROb2RlLCBnZXRMVmlld30gZnJvbSAnLi4vcmVuZGVyMy9zdGF0ZSc7XG5pbXBvcnQge2dldFBhcmVudEluamVjdG9ySW5kZXgsIGdldFBhcmVudEluamVjdG9yVmlldywgaGFzUGFyZW50SW5qZWN0b3J9IGZyb20gJy4uL3JlbmRlcjMvdXRpbC9pbmplY3Rvcl91dGlscyc7XG5pbXBvcnQge2dldE5hdGl2ZUJ5VE5vZGUsIHVud3JhcFJOb2RlLCB2aWV3QXR0YWNoZWRUb0NvbnRhaW5lcn0gZnJvbSAnLi4vcmVuZGVyMy91dGlsL3ZpZXdfdXRpbHMnO1xuaW1wb3J0IHthZGRMVmlld1RvTENvbnRhaW5lciwgc2hvdWxkQWRkVmlld1RvRG9tfSBmcm9tICcuLi9yZW5kZXIzL3ZpZXdfbWFuaXB1bGF0aW9uJztcbmltcG9ydCB7Vmlld1JlZiBhcyBSM1ZpZXdSZWZ9IGZyb20gJy4uL3JlbmRlcjMvdmlld19yZWYnO1xuaW1wb3J0IHthZGRUb0FycmF5LCByZW1vdmVGcm9tQXJyYXl9IGZyb20gJy4uL3V0aWwvYXJyYXlfdXRpbHMnO1xuaW1wb3J0IHthc3NlcnREZWZpbmVkLCBhc3NlcnRFcXVhbCwgYXNzZXJ0R3JlYXRlclRoYW4sIGFzc2VydExlc3NUaGFuLCB0aHJvd0Vycm9yfSBmcm9tICcuLi91dGlsL2Fzc2VydCc7XG5cbmltcG9ydCB7Q29tcG9uZW50RmFjdG9yeSwgQ29tcG9uZW50UmVmfSBmcm9tICcuL2NvbXBvbmVudF9mYWN0b3J5JztcbmltcG9ydCB7Y3JlYXRlRWxlbWVudFJlZiwgRWxlbWVudFJlZn0gZnJvbSAnLi9lbGVtZW50X3JlZic7XG5pbXBvcnQge05nTW9kdWxlUmVmfSBmcm9tICcuL25nX21vZHVsZV9mYWN0b3J5JztcbmltcG9ydCB7VGVtcGxhdGVSZWZ9IGZyb20gJy4vdGVtcGxhdGVfcmVmJztcbmltcG9ydCB7RW1iZWRkZWRWaWV3UmVmLCBWaWV3UmVmfSBmcm9tICcuL3ZpZXdfcmVmJztcblxuLyoqXG4gKiBSZXByZXNlbnRzIGEgY29udGFpbmVyIHdoZXJlIG9uZSBvciBtb3JlIHZpZXdzIGNhbiBiZSBhdHRhY2hlZCB0byBhIGNvbXBvbmVudC5cbiAqXG4gKiBDYW4gY29udGFpbiAqaG9zdCB2aWV3cyogKGNyZWF0ZWQgYnkgaW5zdGFudGlhdGluZyBhXG4gKiBjb21wb25lbnQgd2l0aCB0aGUgYGNyZWF0ZUNvbXBvbmVudCgpYCBtZXRob2QpLCBhbmQgKmVtYmVkZGVkIHZpZXdzKlxuICogKGNyZWF0ZWQgYnkgaW5zdGFudGlhdGluZyBhIGBUZW1wbGF0ZVJlZmAgd2l0aCB0aGUgYGNyZWF0ZUVtYmVkZGVkVmlldygpYCBtZXRob2QpLlxuICpcbiAqIEEgdmlldyBjb250YWluZXIgaW5zdGFuY2UgY2FuIGNvbnRhaW4gb3RoZXIgdmlldyBjb250YWluZXJzLFxuICogY3JlYXRpbmcgYSBbdmlldyBoaWVyYXJjaHldKGd1aWRlL2dsb3NzYXJ5I3ZpZXctaGllcmFyY2h5KS5cbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICpcbiAqIFRoZSBleGFtcGxlIGJlbG93IGRlbW9uc3RyYXRlcyBob3cgdGhlIGBjcmVhdGVDb21wb25lbnRgIGZ1bmN0aW9uIGNhbiBiZSB1c2VkXG4gKiB0byBjcmVhdGUgYW4gaW5zdGFuY2Ugb2YgYSBDb21wb25lbnRSZWYgZHluYW1pY2FsbHkgYW5kIGF0dGFjaCBpdCB0byBhbiBBcHBsaWNhdGlvblJlZixcbiAqIHNvIHRoYXQgaXQgZ2V0cyBpbmNsdWRlZCBpbnRvIGNoYW5nZSBkZXRlY3Rpb24gY3ljbGVzLlxuICpcbiAqIE5vdGU6IHRoZSBleGFtcGxlIHVzZXMgc3RhbmRhbG9uZSBjb21wb25lbnRzLCBidXQgdGhlIGZ1bmN0aW9uIGNhbiBhbHNvIGJlIHVzZWQgZm9yXG4gKiBub24tc3RhbmRhbG9uZSBjb21wb25lbnRzIChkZWNsYXJlZCBpbiBhbiBOZ01vZHVsZSkgYXMgd2VsbC5cbiAqXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBAQ29tcG9uZW50KHtcbiAqICAgc3RhbmRhbG9uZTogdHJ1ZSxcbiAqICAgc2VsZWN0b3I6ICdkeW5hbWljJyxcbiAqICAgdGVtcGxhdGU6IGA8c3Bhbj5UaGlzIGlzIGEgY29udGVudCBvZiBhIGR5bmFtaWMgY29tcG9uZW50Ljwvc3Bhbj5gLFxuICogfSlcbiAqIGNsYXNzIER5bmFtaWNDb21wb25lbnQge1xuICogICB2Y3IgPSBpbmplY3QoVmlld0NvbnRhaW5lclJlZik7XG4gKiB9XG4gKlxuICogQENvbXBvbmVudCh7XG4gKiAgIHN0YW5kYWxvbmU6IHRydWUsXG4gKiAgIHNlbGVjdG9yOiAnYXBwJyxcbiAqICAgdGVtcGxhdGU6IGA8bWFpbj5IaSEgVGhpcyBpcyB0aGUgbWFpbiBjb250ZW50LjwvbWFpbj5gLFxuICogfSlcbiAqIGNsYXNzIEFwcENvbXBvbmVudCB7XG4gKiAgIHZjciA9IGluamVjdChWaWV3Q29udGFpbmVyUmVmKTtcbiAqXG4gKiAgIG5nQWZ0ZXJWaWV3SW5pdCgpIHtcbiAqICAgICBjb25zdCBjb21wUmVmID0gdGhpcy52Y3IuY3JlYXRlQ29tcG9uZW50KER5bmFtaWNDb21wb25lbnQpO1xuICogICAgIGNvbXBSZWYuY2hhbmdlRGV0ZWN0b3JSZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICogICB9XG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBAc2VlIHtAbGluayBDb21wb25lbnRSZWZ9XG4gKiBAc2VlIHtAbGluayBFbWJlZGRlZFZpZXdSZWZ9XG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgVmlld0NvbnRhaW5lclJlZiB7XG4gIC8qKlxuICAgKiBBbmNob3IgZWxlbWVudCB0aGF0IHNwZWNpZmllcyB0aGUgbG9jYXRpb24gb2YgdGhpcyBjb250YWluZXIgaW4gdGhlIGNvbnRhaW5pbmcgdmlldy5cbiAgICogRWFjaCB2aWV3IGNvbnRhaW5lciBjYW4gaGF2ZSBvbmx5IG9uZSBhbmNob3IgZWxlbWVudCwgYW5kIGVhY2ggYW5jaG9yIGVsZW1lbnRcbiAgICogY2FuIGhhdmUgb25seSBhIHNpbmdsZSB2aWV3IGNvbnRhaW5lci5cbiAgICpcbiAgICogUm9vdCBlbGVtZW50cyBvZiB2aWV3cyBhdHRhY2hlZCB0byB0aGlzIGNvbnRhaW5lciBiZWNvbWUgc2libGluZ3Mgb2YgdGhlIGFuY2hvciBlbGVtZW50IGluXG4gICAqIHRoZSByZW5kZXJlZCB2aWV3LlxuICAgKlxuICAgKiBBY2Nlc3MgdGhlIGBWaWV3Q29udGFpbmVyUmVmYCBvZiBhbiBlbGVtZW50IGJ5IHBsYWNpbmcgYSBgRGlyZWN0aXZlYCBpbmplY3RlZFxuICAgKiB3aXRoIGBWaWV3Q29udGFpbmVyUmVmYCBvbiB0aGUgZWxlbWVudCwgb3IgdXNlIGEgYFZpZXdDaGlsZGAgcXVlcnkuXG4gICAqXG4gICAqIDwhLS0gVE9ETzogcmVuYW1lIHRvIGFuY2hvckVsZW1lbnQgLS0+XG4gICAqL1xuICBhYnN0cmFjdCBnZXQgZWxlbWVudCgpOiBFbGVtZW50UmVmO1xuXG4gIC8qKlxuICAgKiBUaGUgW2RlcGVuZGVuY3kgaW5qZWN0b3JdKGd1aWRlL2dsb3NzYXJ5I2luamVjdG9yKSBmb3IgdGhpcyB2aWV3IGNvbnRhaW5lci5cbiAgICovXG4gIGFic3RyYWN0IGdldCBpbmplY3RvcigpOiBJbmplY3RvcjtcblxuICAvKiogQGRlcHJlY2F0ZWQgTm8gcmVwbGFjZW1lbnQgKi9cbiAgYWJzdHJhY3QgZ2V0IHBhcmVudEluamVjdG9yKCk6IEluamVjdG9yO1xuXG4gIC8qKlxuICAgKiBEZXN0cm95cyBhbGwgdmlld3MgaW4gdGhpcyBjb250YWluZXIuXG4gICAqL1xuICBhYnN0cmFjdCBjbGVhcigpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgYSB2aWV3IGZyb20gdGhpcyBjb250YWluZXIuXG4gICAqIEBwYXJhbSBpbmRleCBUaGUgMC1iYXNlZCBpbmRleCBvZiB0aGUgdmlldyB0byByZXRyaWV2ZS5cbiAgICogQHJldHVybnMgVGhlIGBWaWV3UmVmYCBpbnN0YW5jZSwgb3IgbnVsbCBpZiB0aGUgaW5kZXggaXMgb3V0IG9mIHJhbmdlLlxuICAgKi9cbiAgYWJzdHJhY3QgZ2V0KGluZGV4OiBudW1iZXIpOiBWaWV3UmVmfG51bGw7XG5cbiAgLyoqXG4gICAqIFJlcG9ydHMgaG93IG1hbnkgdmlld3MgYXJlIGN1cnJlbnRseSBhdHRhY2hlZCB0byB0aGlzIGNvbnRhaW5lci5cbiAgICogQHJldHVybnMgVGhlIG51bWJlciBvZiB2aWV3cy5cbiAgICovXG4gIGFic3RyYWN0IGdldCBsZW5ndGgoKTogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBJbnN0YW50aWF0ZXMgYW4gZW1iZWRkZWQgdmlldyBhbmQgaW5zZXJ0cyBpdFxuICAgKiBpbnRvIHRoaXMgY29udGFpbmVyLlxuICAgKiBAcGFyYW0gdGVtcGxhdGVSZWYgVGhlIEhUTUwgdGVtcGxhdGUgdGhhdCBkZWZpbmVzIHRoZSB2aWV3LlxuICAgKiBAcGFyYW0gY29udGV4dCBUaGUgZGF0YS1iaW5kaW5nIGNvbnRleHQgb2YgdGhlIGVtYmVkZGVkIHZpZXcsIGFzIGRlY2xhcmVkXG4gICAqIGluIHRoZSBgPG5nLXRlbXBsYXRlPmAgdXNhZ2UuXG4gICAqIEBwYXJhbSBvcHRpb25zIEV4dHJhIGNvbmZpZ3VyYXRpb24gZm9yIHRoZSBjcmVhdGVkIHZpZXcuIEluY2x1ZGVzOlxuICAgKiAgKiBpbmRleDogVGhlIDAtYmFzZWQgaW5kZXggYXQgd2hpY2ggdG8gaW5zZXJ0IHRoZSBuZXcgdmlldyBpbnRvIHRoaXMgY29udGFpbmVyLlxuICAgKiAgICAgICAgICAgSWYgbm90IHNwZWNpZmllZCwgYXBwZW5kcyB0aGUgbmV3IHZpZXcgYXMgdGhlIGxhc3QgZW50cnkuXG4gICAqICAqIGluamVjdG9yOiBJbmplY3RvciB0byBiZSB1c2VkIHdpdGhpbiB0aGUgZW1iZWRkZWQgdmlldy5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGBWaWV3UmVmYCBpbnN0YW5jZSBmb3IgdGhlIG5ld2x5IGNyZWF0ZWQgdmlldy5cbiAgICovXG4gIGFic3RyYWN0IGNyZWF0ZUVtYmVkZGVkVmlldzxDPih0ZW1wbGF0ZVJlZjogVGVtcGxhdGVSZWY8Qz4sIGNvbnRleHQ/OiBDLCBvcHRpb25zPzoge1xuICAgIGluZGV4PzogbnVtYmVyLFxuICAgIGluamVjdG9yPzogSW5qZWN0b3JcbiAgfSk6IEVtYmVkZGVkVmlld1JlZjxDPjtcblxuICAvKipcbiAgICogSW5zdGFudGlhdGVzIGFuIGVtYmVkZGVkIHZpZXcgYW5kIGluc2VydHMgaXRcbiAgICogaW50byB0aGlzIGNvbnRhaW5lci5cbiAgICogQHBhcmFtIHRlbXBsYXRlUmVmIFRoZSBIVE1MIHRlbXBsYXRlIHRoYXQgZGVmaW5lcyB0aGUgdmlldy5cbiAgICogQHBhcmFtIGNvbnRleHQgVGhlIGRhdGEtYmluZGluZyBjb250ZXh0IG9mIHRoZSBlbWJlZGRlZCB2aWV3LCBhcyBkZWNsYXJlZFxuICAgKiBpbiB0aGUgYDxuZy10ZW1wbGF0ZT5gIHVzYWdlLlxuICAgKiBAcGFyYW0gaW5kZXggVGhlIDAtYmFzZWQgaW5kZXggYXQgd2hpY2ggdG8gaW5zZXJ0IHRoZSBuZXcgdmlldyBpbnRvIHRoaXMgY29udGFpbmVyLlxuICAgKiBJZiBub3Qgc3BlY2lmaWVkLCBhcHBlbmRzIHRoZSBuZXcgdmlldyBhcyB0aGUgbGFzdCBlbnRyeS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGBWaWV3UmVmYCBpbnN0YW5jZSBmb3IgdGhlIG5ld2x5IGNyZWF0ZWQgdmlldy5cbiAgICovXG4gIGFic3RyYWN0IGNyZWF0ZUVtYmVkZGVkVmlldzxDPih0ZW1wbGF0ZVJlZjogVGVtcGxhdGVSZWY8Qz4sIGNvbnRleHQ/OiBDLCBpbmRleD86IG51bWJlcik6XG4gICAgICBFbWJlZGRlZFZpZXdSZWY8Qz47XG5cbiAgLyoqXG4gICAqIEluc3RhbnRpYXRlcyBhIHNpbmdsZSBjb21wb25lbnQgYW5kIGluc2VydHMgaXRzIGhvc3QgdmlldyBpbnRvIHRoaXMgY29udGFpbmVyLlxuICAgKlxuICAgKiBAcGFyYW0gY29tcG9uZW50VHlwZSBDb21wb25lbnQgVHlwZSB0byB1c2UuXG4gICAqIEBwYXJhbSBvcHRpb25zIEFuIG9iamVjdCB0aGF0IGNvbnRhaW5zIGV4dHJhIHBhcmFtZXRlcnM6XG4gICAqICAqIGluZGV4OiB0aGUgaW5kZXggYXQgd2hpY2ggdG8gaW5zZXJ0IHRoZSBuZXcgY29tcG9uZW50J3MgaG9zdCB2aWV3IGludG8gdGhpcyBjb250YWluZXIuXG4gICAqICAgICAgICAgICBJZiBub3Qgc3BlY2lmaWVkLCBhcHBlbmRzIHRoZSBuZXcgdmlldyBhcyB0aGUgbGFzdCBlbnRyeS5cbiAgICogICogaW5qZWN0b3I6IHRoZSBpbmplY3RvciB0byB1c2UgYXMgdGhlIHBhcmVudCBmb3IgdGhlIG5ldyBjb21wb25lbnQuXG4gICAqICAqIG5nTW9kdWxlUmVmOiBhbiBOZ01vZHVsZVJlZiBvZiB0aGUgY29tcG9uZW50J3MgTmdNb2R1bGUsIHlvdSBzaG91bGQgYWxtb3N0IGFsd2F5cyBwcm92aWRlXG4gICAqICAgICAgICAgICAgICAgICB0aGlzIHRvIGVuc3VyZSB0aGF0IGFsbCBleHBlY3RlZCBwcm92aWRlcnMgYXJlIGF2YWlsYWJsZSBmb3IgdGhlIGNvbXBvbmVudFxuICAgKiAgICAgICAgICAgICAgICAgaW5zdGFudGlhdGlvbi5cbiAgICogICogZW52aXJvbm1lbnRJbmplY3RvcjogYW4gRW52aXJvbm1lbnRJbmplY3RvciB3aGljaCB3aWxsIHByb3ZpZGUgdGhlIGNvbXBvbmVudCdzIGVudmlyb25tZW50LlxuICAgKiAgICAgICAgICAgICAgICAgeW91IHNob3VsZCBhbG1vc3QgYWx3YXlzIHByb3ZpZGUgdGhpcyB0byBlbnN1cmUgdGhhdCBhbGwgZXhwZWN0ZWQgcHJvdmlkZXJzXG4gICAqICAgICAgICAgICAgICAgICBhcmUgYXZhaWxhYmxlIGZvciB0aGUgY29tcG9uZW50IGluc3RhbnRpYXRpb24uIFRoaXMgb3B0aW9uIGlzIGludGVuZGVkIHRvXG4gICAqICAgICAgICAgICAgICAgICByZXBsYWNlIHRoZSBgbmdNb2R1bGVSZWZgIHBhcmFtZXRlci5cbiAgICogICogcHJvamVjdGFibGVOb2RlczogbGlzdCBvZiBET00gbm9kZXMgdGhhdCBzaG91bGQgYmUgcHJvamVjdGVkIHRocm91Z2hcbiAgICogICAgICAgICAgICAgICAgICAgICAgW2A8bmctY29udGVudD5gXShhcGkvY29yZS9uZy1jb250ZW50KSBvZiB0aGUgbmV3IGNvbXBvbmVudCBpbnN0YW5jZS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIG5ldyBgQ29tcG9uZW50UmVmYCB3aGljaCBjb250YWlucyB0aGUgY29tcG9uZW50IGluc3RhbmNlIGFuZCB0aGUgaG9zdCB2aWV3LlxuICAgKi9cbiAgYWJzdHJhY3QgY3JlYXRlQ29tcG9uZW50PEM+KGNvbXBvbmVudFR5cGU6IFR5cGU8Qz4sIG9wdGlvbnM/OiB7XG4gICAgaW5kZXg/OiBudW1iZXIsXG4gICAgaW5qZWN0b3I/OiBJbmplY3RvcixcbiAgICBuZ01vZHVsZVJlZj86IE5nTW9kdWxlUmVmPHVua25vd24+LFxuICAgIGVudmlyb25tZW50SW5qZWN0b3I/OiBFbnZpcm9ubWVudEluamVjdG9yfE5nTW9kdWxlUmVmPHVua25vd24+LFxuICAgIHByb2plY3RhYmxlTm9kZXM/OiBOb2RlW11bXSxcbiAgfSk6IENvbXBvbmVudFJlZjxDPjtcblxuICAvKipcbiAgICogSW5zdGFudGlhdGVzIGEgc2luZ2xlIGNvbXBvbmVudCBhbmQgaW5zZXJ0cyBpdHMgaG9zdCB2aWV3IGludG8gdGhpcyBjb250YWluZXIuXG4gICAqXG4gICAqIEBwYXJhbSBjb21wb25lbnRGYWN0b3J5IENvbXBvbmVudCBmYWN0b3J5IHRvIHVzZS5cbiAgICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBhdCB3aGljaCB0byBpbnNlcnQgdGhlIG5ldyBjb21wb25lbnQncyBob3N0IHZpZXcgaW50byB0aGlzIGNvbnRhaW5lci5cbiAgICogSWYgbm90IHNwZWNpZmllZCwgYXBwZW5kcyB0aGUgbmV3IHZpZXcgYXMgdGhlIGxhc3QgZW50cnkuXG4gICAqIEBwYXJhbSBpbmplY3RvciBUaGUgaW5qZWN0b3IgdG8gdXNlIGFzIHRoZSBwYXJlbnQgZm9yIHRoZSBuZXcgY29tcG9uZW50LlxuICAgKiBAcGFyYW0gcHJvamVjdGFibGVOb2RlcyBMaXN0IG9mIERPTSBub2RlcyB0aGF0IHNob3VsZCBiZSBwcm9qZWN0ZWQgdGhyb3VnaFxuICAgKiAgICAgW2A8bmctY29udGVudD5gXShhcGkvY29yZS9uZy1jb250ZW50KSBvZiB0aGUgbmV3IGNvbXBvbmVudCBpbnN0YW5jZS5cbiAgICogQHBhcmFtIG5nTW9kdWxlUmVmIEFuIGluc3RhbmNlIG9mIHRoZSBOZ01vZHVsZVJlZiB0aGF0IHJlcHJlc2VudCBhbiBOZ01vZHVsZS5cbiAgICogVGhpcyBpbmZvcm1hdGlvbiBpcyB1c2VkIHRvIHJldHJpZXZlIGNvcnJlc3BvbmRpbmcgTmdNb2R1bGUgaW5qZWN0b3IuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBuZXcgYENvbXBvbmVudFJlZmAgd2hpY2ggY29udGFpbnMgdGhlIGNvbXBvbmVudCBpbnN0YW5jZSBhbmQgdGhlIGhvc3Qgdmlldy5cbiAgICpcbiAgICogQGRlcHJlY2F0ZWQgQW5ndWxhciBubyBsb25nZXIgcmVxdWlyZXMgY29tcG9uZW50IGZhY3RvcmllcyB0byBkeW5hbWljYWxseSBjcmVhdGUgY29tcG9uZW50cy5cbiAgICogICAgIFVzZSBkaWZmZXJlbnQgc2lnbmF0dXJlIG9mIHRoZSBgY3JlYXRlQ29tcG9uZW50YCBtZXRob2QsIHdoaWNoIGFsbG93cyBwYXNzaW5nXG4gICAqICAgICBDb21wb25lbnQgY2xhc3MgZGlyZWN0bHkuXG4gICAqL1xuICBhYnN0cmFjdCBjcmVhdGVDb21wb25lbnQ8Qz4oXG4gICAgICBjb21wb25lbnRGYWN0b3J5OiBDb21wb25lbnRGYWN0b3J5PEM+LCBpbmRleD86IG51bWJlciwgaW5qZWN0b3I/OiBJbmplY3RvcixcbiAgICAgIHByb2plY3RhYmxlTm9kZXM/OiBhbnlbXVtdLFxuICAgICAgZW52aXJvbm1lbnRJbmplY3Rvcj86IEVudmlyb25tZW50SW5qZWN0b3J8TmdNb2R1bGVSZWY8YW55Pik6IENvbXBvbmVudFJlZjxDPjtcblxuICAvKipcbiAgICogSW5zZXJ0cyBhIHZpZXcgaW50byB0aGlzIGNvbnRhaW5lci5cbiAgICogQHBhcmFtIHZpZXdSZWYgVGhlIHZpZXcgdG8gaW5zZXJ0LlxuICAgKiBAcGFyYW0gaW5kZXggVGhlIDAtYmFzZWQgaW5kZXggYXQgd2hpY2ggdG8gaW5zZXJ0IHRoZSB2aWV3LlxuICAgKiBJZiBub3Qgc3BlY2lmaWVkLCBhcHBlbmRzIHRoZSBuZXcgdmlldyBhcyB0aGUgbGFzdCBlbnRyeS5cbiAgICogQHJldHVybnMgVGhlIGluc2VydGVkIGBWaWV3UmVmYCBpbnN0YW5jZS5cbiAgICpcbiAgICovXG4gIGFic3RyYWN0IGluc2VydCh2aWV3UmVmOiBWaWV3UmVmLCBpbmRleD86IG51bWJlcik6IFZpZXdSZWY7XG5cbiAgLyoqXG4gICAqIE1vdmVzIGEgdmlldyB0byBhIG5ldyBsb2NhdGlvbiBpbiB0aGlzIGNvbnRhaW5lci5cbiAgICogQHBhcmFtIHZpZXdSZWYgVGhlIHZpZXcgdG8gbW92ZS5cbiAgICogQHBhcmFtIGluZGV4IFRoZSAwLWJhc2VkIGluZGV4IG9mIHRoZSBuZXcgbG9jYXRpb24uXG4gICAqIEByZXR1cm5zIFRoZSBtb3ZlZCBgVmlld1JlZmAgaW5zdGFuY2UuXG4gICAqL1xuICBhYnN0cmFjdCBtb3ZlKHZpZXdSZWY6IFZpZXdSZWYsIGN1cnJlbnRJbmRleDogbnVtYmVyKTogVmlld1JlZjtcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgaW5kZXggb2YgYSB2aWV3IHdpdGhpbiB0aGUgY3VycmVudCBjb250YWluZXIuXG4gICAqIEBwYXJhbSB2aWV3UmVmIFRoZSB2aWV3IHRvIHF1ZXJ5LlxuICAgKiBAcmV0dXJucyBUaGUgMC1iYXNlZCBpbmRleCBvZiB0aGUgdmlldydzIHBvc2l0aW9uIGluIHRoaXMgY29udGFpbmVyLFxuICAgKiBvciBgLTFgIGlmIHRoaXMgY29udGFpbmVyIGRvZXNuJ3QgY29udGFpbiB0aGUgdmlldy5cbiAgICovXG4gIGFic3RyYWN0IGluZGV4T2Yodmlld1JlZjogVmlld1JlZik6IG51bWJlcjtcblxuICAvKipcbiAgICogRGVzdHJveXMgYSB2aWV3IGF0dGFjaGVkIHRvIHRoaXMgY29udGFpbmVyXG4gICAqIEBwYXJhbSBpbmRleCBUaGUgMC1iYXNlZCBpbmRleCBvZiB0aGUgdmlldyB0byBkZXN0cm95LlxuICAgKiBJZiBub3Qgc3BlY2lmaWVkLCB0aGUgbGFzdCB2aWV3IGluIHRoZSBjb250YWluZXIgaXMgcmVtb3ZlZC5cbiAgICovXG4gIGFic3RyYWN0IHJlbW92ZShpbmRleD86IG51bWJlcik6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIERldGFjaGVzIGEgdmlldyBmcm9tIHRoaXMgY29udGFpbmVyIHdpdGhvdXQgZGVzdHJveWluZyBpdC5cbiAgICogVXNlIGFsb25nIHdpdGggYGluc2VydCgpYCB0byBtb3ZlIGEgdmlldyB3aXRoaW4gdGhlIGN1cnJlbnQgY29udGFpbmVyLlxuICAgKiBAcGFyYW0gaW5kZXggVGhlIDAtYmFzZWQgaW5kZXggb2YgdGhlIHZpZXcgdG8gZGV0YWNoLlxuICAgKiBJZiBub3Qgc3BlY2lmaWVkLCB0aGUgbGFzdCB2aWV3IGluIHRoZSBjb250YWluZXIgaXMgZGV0YWNoZWQuXG4gICAqL1xuICBhYnN0cmFjdCBkZXRhY2goaW5kZXg/OiBudW1iZXIpOiBWaWV3UmVmfG51bGw7XG5cbiAgLyoqXG4gICAqIEBpbnRlcm5hbFxuICAgKiBAbm9jb2xsYXBzZVxuICAgKi9cbiAgc3RhdGljIF9fTkdfRUxFTUVOVF9JRF9fOiAoKSA9PiBWaWV3Q29udGFpbmVyUmVmID0gaW5qZWN0Vmlld0NvbnRhaW5lclJlZjtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgVmlld0NvbnRhaW5lclJlZiBhbmQgc3RvcmVzIGl0IG9uIHRoZSBpbmplY3Rvci4gT3IsIGlmIHRoZSBWaWV3Q29udGFpbmVyUmVmXG4gKiBhbHJlYWR5IGV4aXN0cywgcmV0cmlldmVzIHRoZSBleGlzdGluZyBWaWV3Q29udGFpbmVyUmVmLlxuICpcbiAqIEByZXR1cm5zIFRoZSBWaWV3Q29udGFpbmVyUmVmIGluc3RhbmNlIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0Vmlld0NvbnRhaW5lclJlZigpOiBWaWV3Q29udGFpbmVyUmVmIHtcbiAgY29uc3QgcHJldmlvdXNUTm9kZSA9IGdldEN1cnJlbnRUTm9kZSgpIGFzIFRFbGVtZW50Tm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSB8IFRDb250YWluZXJOb2RlO1xuICByZXR1cm4gY3JlYXRlQ29udGFpbmVyUmVmKHByZXZpb3VzVE5vZGUsIGdldExWaWV3KCkpO1xufVxuXG5jb25zdCBWRV9WaWV3Q29udGFpbmVyUmVmID0gVmlld0NvbnRhaW5lclJlZjtcblxuLy8gVE9ETyhhbHhodWIpOiBjbGVhbmluZyB1cCB0aGlzIGluZGlyZWN0aW9uIHRyaWdnZXJzIGEgc3VidGxlIGJ1ZyBpbiBDbG9zdXJlIGluIGczLiBPbmNlIHRoZSBmaXhcbi8vIGZvciB0aGF0IGxhbmRzLCB0aGlzIGNhbiBiZSBjbGVhbmVkIHVwLlxuY29uc3QgUjNWaWV3Q29udGFpbmVyUmVmID0gY2xhc3MgVmlld0NvbnRhaW5lclJlZiBleHRlbmRzIFZFX1ZpZXdDb250YWluZXJSZWYge1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgX2xDb250YWluZXI6IExDb250YWluZXIsXG4gICAgICBwcml2YXRlIF9ob3N0VE5vZGU6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxURWxlbWVudENvbnRhaW5lck5vZGUsXG4gICAgICBwcml2YXRlIF9ob3N0TFZpZXc6IExWaWV3KSB7XG4gICAgc3VwZXIoKTtcbiAgfVxuXG4gIG92ZXJyaWRlIGdldCBlbGVtZW50KCk6IEVsZW1lbnRSZWYge1xuICAgIHJldHVybiBjcmVhdGVFbGVtZW50UmVmKHRoaXMuX2hvc3RUTm9kZSwgdGhpcy5faG9zdExWaWV3KTtcbiAgfVxuXG4gIG92ZXJyaWRlIGdldCBpbmplY3RvcigpOiBJbmplY3RvciB7XG4gICAgcmV0dXJuIG5ldyBOb2RlSW5qZWN0b3IodGhpcy5faG9zdFROb2RlLCB0aGlzLl9ob3N0TFZpZXcpO1xuICB9XG5cbiAgLyoqIEBkZXByZWNhdGVkIE5vIHJlcGxhY2VtZW50ICovXG4gIG92ZXJyaWRlIGdldCBwYXJlbnRJbmplY3RvcigpOiBJbmplY3RvciB7XG4gICAgY29uc3QgcGFyZW50TG9jYXRpb24gPSBnZXRQYXJlbnRJbmplY3RvckxvY2F0aW9uKHRoaXMuX2hvc3RUTm9kZSwgdGhpcy5faG9zdExWaWV3KTtcbiAgICBpZiAoaGFzUGFyZW50SW5qZWN0b3IocGFyZW50TG9jYXRpb24pKSB7XG4gICAgICBjb25zdCBwYXJlbnRWaWV3ID0gZ2V0UGFyZW50SW5qZWN0b3JWaWV3KHBhcmVudExvY2F0aW9uLCB0aGlzLl9ob3N0TFZpZXcpO1xuICAgICAgY29uc3QgaW5qZWN0b3JJbmRleCA9IGdldFBhcmVudEluamVjdG9ySW5kZXgocGFyZW50TG9jYXRpb24pO1xuICAgICAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVJbmplY3RvcihwYXJlbnRWaWV3LCBpbmplY3RvckluZGV4KTtcbiAgICAgIGNvbnN0IHBhcmVudFROb2RlID1cbiAgICAgICAgICBwYXJlbnRWaWV3W1RWSUVXXS5kYXRhW2luamVjdG9ySW5kZXggKyBOb2RlSW5qZWN0b3JPZmZzZXQuVE5PREVdIGFzIFRFbGVtZW50Tm9kZTtcbiAgICAgIHJldHVybiBuZXcgTm9kZUluamVjdG9yKHBhcmVudFROb2RlLCBwYXJlbnRWaWV3KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG5ldyBOb2RlSW5qZWN0b3IobnVsbCwgdGhpcy5faG9zdExWaWV3KTtcbiAgICB9XG4gIH1cblxuICBvdmVycmlkZSBjbGVhcigpOiB2b2lkIHtcbiAgICB3aGlsZSAodGhpcy5sZW5ndGggPiAwKSB7XG4gICAgICB0aGlzLnJlbW92ZSh0aGlzLmxlbmd0aCAtIDEpO1xuICAgIH1cbiAgfVxuXG4gIG92ZXJyaWRlIGdldChpbmRleDogbnVtYmVyKTogVmlld1JlZnxudWxsIHtcbiAgICBjb25zdCB2aWV3UmVmcyA9IGdldFZpZXdSZWZzKHRoaXMuX2xDb250YWluZXIpO1xuICAgIHJldHVybiB2aWV3UmVmcyAhPT0gbnVsbCAmJiB2aWV3UmVmc1tpbmRleF0gfHwgbnVsbDtcbiAgfVxuXG4gIG92ZXJyaWRlIGdldCBsZW5ndGgoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fbENvbnRhaW5lci5sZW5ndGggLSBDT05UQUlORVJfSEVBREVSX09GRlNFVDtcbiAgfVxuXG4gIG92ZXJyaWRlIGNyZWF0ZUVtYmVkZGVkVmlldzxDPih0ZW1wbGF0ZVJlZjogVGVtcGxhdGVSZWY8Qz4sIGNvbnRleHQ/OiBDLCBvcHRpb25zPzoge1xuICAgIGluZGV4PzogbnVtYmVyLFxuICAgIGluamVjdG9yPzogSW5qZWN0b3JcbiAgfSk6IEVtYmVkZGVkVmlld1JlZjxDPjtcbiAgb3ZlcnJpZGUgY3JlYXRlRW1iZWRkZWRWaWV3PEM+KHRlbXBsYXRlUmVmOiBUZW1wbGF0ZVJlZjxDPiwgY29udGV4dD86IEMsIGluZGV4PzogbnVtYmVyKTpcbiAgICAgIEVtYmVkZGVkVmlld1JlZjxDPjtcbiAgb3ZlcnJpZGUgY3JlYXRlRW1iZWRkZWRWaWV3PEM+KHRlbXBsYXRlUmVmOiBUZW1wbGF0ZVJlZjxDPiwgY29udGV4dD86IEMsIGluZGV4T3JPcHRpb25zPzogbnVtYmVyfHtcbiAgICBpbmRleD86IG51bWJlcixcbiAgICBpbmplY3Rvcj86IEluamVjdG9yXG4gIH0pOiBFbWJlZGRlZFZpZXdSZWY8Qz4ge1xuICAgIGxldCBpbmRleDogbnVtYmVyfHVuZGVmaW5lZDtcbiAgICBsZXQgaW5qZWN0b3I6IEluamVjdG9yfHVuZGVmaW5lZDtcblxuICAgIGlmICh0eXBlb2YgaW5kZXhPck9wdGlvbnMgPT09ICdudW1iZXInKSB7XG4gICAgICBpbmRleCA9IGluZGV4T3JPcHRpb25zO1xuICAgIH0gZWxzZSBpZiAoaW5kZXhPck9wdGlvbnMgIT0gbnVsbCkge1xuICAgICAgaW5kZXggPSBpbmRleE9yT3B0aW9ucy5pbmRleDtcbiAgICAgIGluamVjdG9yID0gaW5kZXhPck9wdGlvbnMuaW5qZWN0b3I7XG4gICAgfVxuXG4gICAgY29uc3QgZGVoeWRyYXRlZFZpZXcgPSBmaW5kTWF0Y2hpbmdEZWh5ZHJhdGVkVmlldyh0aGlzLl9sQ29udGFpbmVyLCB0ZW1wbGF0ZVJlZi5zc3JJZCk7XG4gICAgY29uc3Qgdmlld1JlZiA9XG4gICAgICAgIHRlbXBsYXRlUmVmLmNyZWF0ZUVtYmVkZGVkVmlld0ltcGwoY29udGV4dCB8fCA8YW55Pnt9LCBpbmplY3RvciwgZGVoeWRyYXRlZFZpZXcpO1xuICAgIHRoaXMuaW5zZXJ0SW1wbCh2aWV3UmVmLCBpbmRleCwgc2hvdWxkQWRkVmlld1RvRG9tKHRoaXMuX2hvc3RUTm9kZSwgZGVoeWRyYXRlZFZpZXcpKTtcbiAgICByZXR1cm4gdmlld1JlZjtcbiAgfVxuXG4gIG92ZXJyaWRlIGNyZWF0ZUNvbXBvbmVudDxDPihjb21wb25lbnRUeXBlOiBUeXBlPEM+LCBvcHRpb25zPzoge1xuICAgIGluZGV4PzogbnVtYmVyLFxuICAgIGluamVjdG9yPzogSW5qZWN0b3IsXG4gICAgcHJvamVjdGFibGVOb2Rlcz86IE5vZGVbXVtdLFxuICAgIG5nTW9kdWxlUmVmPzogTmdNb2R1bGVSZWY8dW5rbm93bj4sXG4gIH0pOiBDb21wb25lbnRSZWY8Qz47XG4gIC8qKlxuICAgKiBAZGVwcmVjYXRlZCBBbmd1bGFyIG5vIGxvbmdlciByZXF1aXJlcyBjb21wb25lbnQgZmFjdG9yaWVzIHRvIGR5bmFtaWNhbGx5IGNyZWF0ZSBjb21wb25lbnRzLlxuICAgKiAgICAgVXNlIGRpZmZlcmVudCBzaWduYXR1cmUgb2YgdGhlIGBjcmVhdGVDb21wb25lbnRgIG1ldGhvZCwgd2hpY2ggYWxsb3dzIHBhc3NpbmdcbiAgICogICAgIENvbXBvbmVudCBjbGFzcyBkaXJlY3RseS5cbiAgICovXG4gIG92ZXJyaWRlIGNyZWF0ZUNvbXBvbmVudDxDPihcbiAgICAgIGNvbXBvbmVudEZhY3Rvcnk6IENvbXBvbmVudEZhY3Rvcnk8Qz4sIGluZGV4PzogbnVtYmVyfHVuZGVmaW5lZCxcbiAgICAgIGluamVjdG9yPzogSW5qZWN0b3J8dW5kZWZpbmVkLCBwcm9qZWN0YWJsZU5vZGVzPzogYW55W11bXXx1bmRlZmluZWQsXG4gICAgICBlbnZpcm9ubWVudEluamVjdG9yPzogRW52aXJvbm1lbnRJbmplY3RvcnxOZ01vZHVsZVJlZjxhbnk+fHVuZGVmaW5lZCk6IENvbXBvbmVudFJlZjxDPjtcbiAgb3ZlcnJpZGUgY3JlYXRlQ29tcG9uZW50PEM+KFxuICAgICAgY29tcG9uZW50RmFjdG9yeU9yVHlwZTogQ29tcG9uZW50RmFjdG9yeTxDPnxUeXBlPEM+LCBpbmRleE9yT3B0aW9ucz86IG51bWJlcnx1bmRlZmluZWR8e1xuICAgICAgICBpbmRleD86IG51bWJlcixcbiAgICAgICAgaW5qZWN0b3I/OiBJbmplY3RvcixcbiAgICAgICAgbmdNb2R1bGVSZWY/OiBOZ01vZHVsZVJlZjx1bmtub3duPixcbiAgICAgICAgZW52aXJvbm1lbnRJbmplY3Rvcj86IEVudmlyb25tZW50SW5qZWN0b3J8TmdNb2R1bGVSZWY8dW5rbm93bj4sXG4gICAgICAgIHByb2plY3RhYmxlTm9kZXM/OiBOb2RlW11bXSxcbiAgICAgIH0sXG4gICAgICBpbmplY3Rvcj86IEluamVjdG9yfHVuZGVmaW5lZCwgcHJvamVjdGFibGVOb2Rlcz86IGFueVtdW118dW5kZWZpbmVkLFxuICAgICAgZW52aXJvbm1lbnRJbmplY3Rvcj86IEVudmlyb25tZW50SW5qZWN0b3J8TmdNb2R1bGVSZWY8YW55Pnx1bmRlZmluZWQpOiBDb21wb25lbnRSZWY8Qz4ge1xuICAgIGNvbnN0IGlzQ29tcG9uZW50RmFjdG9yeSA9IGNvbXBvbmVudEZhY3RvcnlPclR5cGUgJiYgIWlzVHlwZShjb21wb25lbnRGYWN0b3J5T3JUeXBlKTtcbiAgICBsZXQgaW5kZXg6IG51bWJlcnx1bmRlZmluZWQ7XG5cbiAgICAvLyBUaGlzIGZ1bmN0aW9uIHN1cHBvcnRzIDIgc2lnbmF0dXJlcyBhbmQgd2UgbmVlZCB0byBoYW5kbGUgb3B0aW9ucyBjb3JyZWN0bHkgZm9yIGJvdGg6XG4gICAgLy8gICAxLiBXaGVuIGZpcnN0IGFyZ3VtZW50IGlzIGEgQ29tcG9uZW50IHR5cGUuIFRoaXMgc2lnbmF0dXJlIGFsc28gcmVxdWlyZXMgZXh0cmFcbiAgICAvLyAgICAgIG9wdGlvbnMgdG8gYmUgcHJvdmlkZWQgYXMgb2JqZWN0IChtb3JlIGVyZ29ub21pYyBvcHRpb24pLlxuICAgIC8vICAgMi4gRmlyc3QgYXJndW1lbnQgaXMgYSBDb21wb25lbnQgZmFjdG9yeS4gSW4gdGhpcyBjYXNlIGV4dHJhIG9wdGlvbnMgYXJlIHJlcHJlc2VudGVkIGFzXG4gICAgLy8gICAgICBwb3NpdGlvbmFsIGFyZ3VtZW50cy4gVGhpcyBzaWduYXR1cmUgaXMgbGVzcyBlcmdvbm9taWMgYW5kIHdpbGwgYmUgZGVwcmVjYXRlZC5cbiAgICBpZiAoaXNDb21wb25lbnRGYWN0b3J5KSB7XG4gICAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICAgIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgdHlwZW9mIGluZGV4T3JPcHRpb25zICE9PSAnb2JqZWN0JywgdHJ1ZSxcbiAgICAgICAgICAgICdJdCBsb29rcyBsaWtlIENvbXBvbmVudCBmYWN0b3J5IHdhcyBwcm92aWRlZCBhcyB0aGUgZmlyc3QgYXJndW1lbnQgJyArXG4gICAgICAgICAgICAgICAgJ2FuZCBhbiBvcHRpb25zIG9iamVjdCBhcyB0aGUgc2Vjb25kIGFyZ3VtZW50LiBUaGlzIGNvbWJpbmF0aW9uIG9mIGFyZ3VtZW50cyAnICtcbiAgICAgICAgICAgICAgICAnaXMgaW5jb21wYXRpYmxlLiBZb3UgY2FuIGVpdGhlciBjaGFuZ2UgdGhlIGZpcnN0IGFyZ3VtZW50IHRvIHByb3ZpZGUgQ29tcG9uZW50ICcgK1xuICAgICAgICAgICAgICAgICd0eXBlIG9yIGNoYW5nZSB0aGUgc2Vjb25kIGFyZ3VtZW50IHRvIGJlIGEgbnVtYmVyIChyZXByZXNlbnRpbmcgYW4gaW5kZXggYXQgJyArXG4gICAgICAgICAgICAgICAgJ3doaWNoIHRvIGluc2VydCB0aGUgbmV3IGNvbXBvbmVudFxcJ3MgaG9zdCB2aWV3IGludG8gdGhpcyBjb250YWluZXIpJyk7XG4gICAgICB9XG4gICAgICBpbmRleCA9IGluZGV4T3JPcHRpb25zIGFzIG51bWJlciB8IHVuZGVmaW5lZDtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgICBhc3NlcnREZWZpbmVkKFxuICAgICAgICAgICAgZ2V0Q29tcG9uZW50RGVmKGNvbXBvbmVudEZhY3RvcnlPclR5cGUpLFxuICAgICAgICAgICAgYFByb3ZpZGVkIENvbXBvbmVudCBjbGFzcyBkb2Vzbid0IGNvbnRhaW4gQ29tcG9uZW50IGRlZmluaXRpb24uIGAgK1xuICAgICAgICAgICAgICAgIGBQbGVhc2UgY2hlY2sgd2hldGhlciBwcm92aWRlZCBjbGFzcyBoYXMgQENvbXBvbmVudCBkZWNvcmF0b3IuYCk7XG4gICAgICAgIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgdHlwZW9mIGluZGV4T3JPcHRpb25zICE9PSAnbnVtYmVyJywgdHJ1ZSxcbiAgICAgICAgICAgICdJdCBsb29rcyBsaWtlIENvbXBvbmVudCB0eXBlIHdhcyBwcm92aWRlZCBhcyB0aGUgZmlyc3QgYXJndW1lbnQgJyArXG4gICAgICAgICAgICAgICAgJ2FuZCBhIG51bWJlciAocmVwcmVzZW50aW5nIGFuIGluZGV4IGF0IHdoaWNoIHRvIGluc2VydCB0aGUgbmV3IGNvbXBvbmVudFxcJ3MgJyArXG4gICAgICAgICAgICAgICAgJ2hvc3QgdmlldyBpbnRvIHRoaXMgY29udGFpbmVyIGFzIHRoZSBzZWNvbmQgYXJndW1lbnQuIFRoaXMgY29tYmluYXRpb24gb2YgYXJndW1lbnRzICcgK1xuICAgICAgICAgICAgICAgICdpcyBpbmNvbXBhdGlibGUuIFBsZWFzZSB1c2UgYW4gb2JqZWN0IGFzIHRoZSBzZWNvbmQgYXJndW1lbnQgaW5zdGVhZC4nKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IG9wdGlvbnMgPSAoaW5kZXhPck9wdGlvbnMgfHwge30pIGFzIHtcbiAgICAgICAgaW5kZXg/OiBudW1iZXIsXG4gICAgICAgIGluamVjdG9yPzogSW5qZWN0b3IsXG4gICAgICAgIG5nTW9kdWxlUmVmPzogTmdNb2R1bGVSZWY8dW5rbm93bj4sXG4gICAgICAgIGVudmlyb25tZW50SW5qZWN0b3I/OiBFbnZpcm9ubWVudEluamVjdG9yIHwgTmdNb2R1bGVSZWY8dW5rbm93bj4sXG4gICAgICAgIHByb2plY3RhYmxlTm9kZXM/OiBOb2RlW11bXSxcbiAgICAgIH07XG4gICAgICBpZiAobmdEZXZNb2RlICYmIG9wdGlvbnMuZW52aXJvbm1lbnRJbmplY3RvciAmJiBvcHRpb25zLm5nTW9kdWxlUmVmKSB7XG4gICAgICAgIHRocm93RXJyb3IoXG4gICAgICAgICAgICBgQ2Fubm90IHBhc3MgYm90aCBlbnZpcm9ubWVudEluamVjdG9yIGFuZCBuZ01vZHVsZVJlZiBvcHRpb25zIHRvIGNyZWF0ZUNvbXBvbmVudCgpLmApO1xuICAgICAgfVxuICAgICAgaW5kZXggPSBvcHRpb25zLmluZGV4O1xuICAgICAgaW5qZWN0b3IgPSBvcHRpb25zLmluamVjdG9yO1xuICAgICAgcHJvamVjdGFibGVOb2RlcyA9IG9wdGlvbnMucHJvamVjdGFibGVOb2RlcztcbiAgICAgIGVudmlyb25tZW50SW5qZWN0b3IgPSBvcHRpb25zLmVudmlyb25tZW50SW5qZWN0b3IgfHwgb3B0aW9ucy5uZ01vZHVsZVJlZjtcbiAgICB9XG5cbiAgICBjb25zdCBjb21wb25lbnRGYWN0b3J5OiBDb21wb25lbnRGYWN0b3J5PEM+ID0gaXNDb21wb25lbnRGYWN0b3J5ID9cbiAgICAgICAgY29tcG9uZW50RmFjdG9yeU9yVHlwZSBhcyBDb21wb25lbnRGYWN0b3J5PEM+OlxuICAgICAgICBuZXcgUjNDb21wb25lbnRGYWN0b3J5KGdldENvbXBvbmVudERlZihjb21wb25lbnRGYWN0b3J5T3JUeXBlKSEpO1xuICAgIGNvbnN0IGNvbnRleHRJbmplY3RvciA9IGluamVjdG9yIHx8IHRoaXMucGFyZW50SW5qZWN0b3I7XG5cbiAgICAvLyBJZiBhbiBgTmdNb2R1bGVSZWZgIGlzIG5vdCBwcm92aWRlZCBleHBsaWNpdGx5LCB0cnkgcmV0cmlldmluZyBpdCBmcm9tIHRoZSBESSB0cmVlLlxuICAgIGlmICghZW52aXJvbm1lbnRJbmplY3RvciAmJiAoY29tcG9uZW50RmFjdG9yeSBhcyBhbnkpLm5nTW9kdWxlID09IG51bGwpIHtcbiAgICAgIC8vIEZvciB0aGUgYENvbXBvbmVudEZhY3RvcnlgIGNhc2UsIGVudGVyaW5nIHRoaXMgbG9naWMgaXMgdmVyeSB1bmxpa2VseSwgc2luY2Ugd2UgZXhwZWN0IHRoYXRcbiAgICAgIC8vIGFuIGluc3RhbmNlIG9mIGEgYENvbXBvbmVudEZhY3RvcnlgLCByZXNvbHZlZCB2aWEgYENvbXBvbmVudEZhY3RvcnlSZXNvbHZlcmAgd291bGQgaGF2ZSBhblxuICAgICAgLy8gYG5nTW9kdWxlYCBmaWVsZC4gVGhpcyBpcyBwb3NzaWJsZSBpbiBzb21lIHRlc3Qgc2NlbmFyaW9zIGFuZCBwb3RlbnRpYWxseSBpbiBzb21lIEpJVC1iYXNlZFxuICAgICAgLy8gdXNlLWNhc2VzLiBGb3IgdGhlIGBDb21wb25lbnRGYWN0b3J5YCBjYXNlIHdlIHByZXNlcnZlIGJhY2t3YXJkcy1jb21wYXRpYmlsaXR5IGFuZCB0cnlcbiAgICAgIC8vIHVzaW5nIGEgcHJvdmlkZWQgaW5qZWN0b3IgZmlyc3QsIHRoZW4gZmFsbCBiYWNrIHRvIHRoZSBwYXJlbnQgaW5qZWN0b3Igb2YgdGhpc1xuICAgICAgLy8gYFZpZXdDb250YWluZXJSZWZgIGluc3RhbmNlLlxuICAgICAgLy9cbiAgICAgIC8vIEZvciB0aGUgZmFjdG9yeS1sZXNzIGNhc2UsIGl0J3MgY3JpdGljYWwgdG8gZXN0YWJsaXNoIGEgY29ubmVjdGlvbiB3aXRoIHRoZSBtb2R1bGVcbiAgICAgIC8vIGluamVjdG9yIHRyZWUgKGJ5IHJldHJpZXZpbmcgYW4gaW5zdGFuY2Ugb2YgYW4gYE5nTW9kdWxlUmVmYCBhbmQgYWNjZXNzaW5nIGl0cyBpbmplY3RvciksXG4gICAgICAvLyBzbyB0aGF0IGEgY29tcG9uZW50IGNhbiB1c2UgREkgdG9rZW5zIHByb3ZpZGVkIGluIE1nTW9kdWxlcy4gRm9yIHRoaXMgcmVhc29uLCB3ZSBjYW4gbm90XG4gICAgICAvLyByZWx5IG9uIHRoZSBwcm92aWRlZCBpbmplY3Rvciwgc2luY2UgaXQgbWlnaHQgYmUgZGV0YWNoZWQgZnJvbSB0aGUgREkgdHJlZSAoZm9yIGV4YW1wbGUsIGlmXG4gICAgICAvLyBpdCB3YXMgY3JlYXRlZCB2aWEgYEluamVjdG9yLmNyZWF0ZWAgd2l0aG91dCBzcGVjaWZ5aW5nIGEgcGFyZW50IGluamVjdG9yLCBvciBpZiBhblxuICAgICAgLy8gaW5qZWN0b3IgaXMgcmV0cmlldmVkIGZyb20gYW4gYE5nTW9kdWxlUmVmYCBjcmVhdGVkIHZpYSBgY3JlYXRlTmdNb2R1bGVgIHVzaW5nIGFuXG4gICAgICAvLyBOZ01vZHVsZSBvdXRzaWRlIG9mIGEgbW9kdWxlIHRyZWUpLiBJbnN0ZWFkLCB3ZSBhbHdheXMgdXNlIGBWaWV3Q29udGFpbmVyUmVmYCdzIHBhcmVudFxuICAgICAgLy8gaW5qZWN0b3IsIHdoaWNoIGlzIG5vcm1hbGx5IGNvbm5lY3RlZCB0byB0aGUgREkgdHJlZSwgd2hpY2ggaW5jbHVkZXMgbW9kdWxlIGluamVjdG9yXG4gICAgICAvLyBzdWJ0cmVlLlxuICAgICAgY29uc3QgX2luamVjdG9yID0gaXNDb21wb25lbnRGYWN0b3J5ID8gY29udGV4dEluamVjdG9yIDogdGhpcy5wYXJlbnRJbmplY3RvcjtcblxuICAgICAgLy8gRE8gTk9UIFJFRkFDVE9SLiBUaGUgY29kZSBoZXJlIHVzZWQgdG8gaGF2ZSBhIGBpbmplY3Rvci5nZXQoTmdNb2R1bGVSZWYsIG51bGwpIHx8XG4gICAgICAvLyB1bmRlZmluZWRgIGV4cHJlc3Npb24gd2hpY2ggc2VlbXMgdG8gY2F1c2UgaW50ZXJuYWwgZ29vZ2xlIGFwcHMgdG8gZmFpbC4gVGhpcyBpcyBkb2N1bWVudGVkXG4gICAgICAvLyBpbiB0aGUgZm9sbG93aW5nIGludGVybmFsIGJ1ZyBpc3N1ZTogZ28vYi8xNDI5Njc4MDJcbiAgICAgIGNvbnN0IHJlc3VsdCA9IF9pbmplY3Rvci5nZXQoRW52aXJvbm1lbnRJbmplY3RvciwgbnVsbCk7XG4gICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgIGVudmlyb25tZW50SW5qZWN0b3IgPSByZXN1bHQ7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgY29tcG9uZW50RGVmID0gZ2V0Q29tcG9uZW50RGVmKGNvbXBvbmVudEZhY3RvcnkuY29tcG9uZW50VHlwZSA/PyB7fSk7XG4gICAgY29uc3QgZGVoeWRyYXRlZFZpZXcgPSBmaW5kTWF0Y2hpbmdEZWh5ZHJhdGVkVmlldyh0aGlzLl9sQ29udGFpbmVyLCBjb21wb25lbnREZWY/LmlkID8/IG51bGwpO1xuICAgIGNvbnN0IHJOb2RlID0gZGVoeWRyYXRlZFZpZXc/LmZpcnN0Q2hpbGQgPz8gbnVsbDtcbiAgICBjb25zdCBjb21wb25lbnRSZWYgPVxuICAgICAgICBjb21wb25lbnRGYWN0b3J5LmNyZWF0ZShjb250ZXh0SW5qZWN0b3IsIHByb2plY3RhYmxlTm9kZXMsIHJOb2RlLCBlbnZpcm9ubWVudEluamVjdG9yKTtcbiAgICB0aGlzLmluc2VydEltcGwoXG4gICAgICAgIGNvbXBvbmVudFJlZi5ob3N0VmlldywgaW5kZXgsIHNob3VsZEFkZFZpZXdUb0RvbSh0aGlzLl9ob3N0VE5vZGUsIGRlaHlkcmF0ZWRWaWV3KSk7XG4gICAgcmV0dXJuIGNvbXBvbmVudFJlZjtcbiAgfVxuXG4gIG92ZXJyaWRlIGluc2VydCh2aWV3UmVmOiBWaWV3UmVmLCBpbmRleD86IG51bWJlcik6IFZpZXdSZWYge1xuICAgIHJldHVybiB0aGlzLmluc2VydEltcGwodmlld1JlZiwgaW5kZXgsIHRydWUpO1xuICB9XG5cbiAgcHJpdmF0ZSBpbnNlcnRJbXBsKHZpZXdSZWY6IFZpZXdSZWYsIGluZGV4PzogbnVtYmVyLCBhZGRUb0RPTT86IGJvb2xlYW4pOiBWaWV3UmVmIHtcbiAgICBjb25zdCBsVmlldyA9ICh2aWV3UmVmIGFzIFIzVmlld1JlZjxhbnk+KS5fbFZpZXchO1xuXG4gICAgaWYgKG5nRGV2TW9kZSAmJiB2aWV3UmVmLmRlc3Ryb3llZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgaW5zZXJ0IGEgZGVzdHJveWVkIFZpZXcgaW4gYSBWaWV3Q29udGFpbmVyIScpO1xuICAgIH1cblxuICAgIGlmICh2aWV3QXR0YWNoZWRUb0NvbnRhaW5lcihsVmlldykpIHtcbiAgICAgIC8vIElmIHZpZXcgaXMgYWxyZWFkeSBhdHRhY2hlZCwgZGV0YWNoIGl0IGZpcnN0IHNvIHdlIGNsZWFuIHVwIHJlZmVyZW5jZXMgYXBwcm9wcmlhdGVseS5cblxuICAgICAgY29uc3QgcHJldklkeCA9IHRoaXMuaW5kZXhPZih2aWV3UmVmKTtcblxuICAgICAgLy8gQSB2aWV3IG1pZ2h0IGJlIGF0dGFjaGVkIGVpdGhlciB0byB0aGlzIG9yIGEgZGlmZmVyZW50IGNvbnRhaW5lci4gVGhlIGBwcmV2SWR4YCBmb3JcbiAgICAgIC8vIHRob3NlIGNhc2VzIHdpbGwgYmU6XG4gICAgICAvLyBlcXVhbCB0byAtMSBmb3Igdmlld3MgYXR0YWNoZWQgdG8gdGhpcyBWaWV3Q29udGFpbmVyUmVmXG4gICAgICAvLyA+PSAwIGZvciB2aWV3cyBhdHRhY2hlZCB0byBhIGRpZmZlcmVudCBWaWV3Q29udGFpbmVyUmVmXG4gICAgICBpZiAocHJldklkeCAhPT0gLTEpIHtcbiAgICAgICAgdGhpcy5kZXRhY2gocHJldklkeCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBwcmV2TENvbnRhaW5lciA9IGxWaWV3W1BBUkVOVF0gYXMgTENvbnRhaW5lcjtcbiAgICAgICAgbmdEZXZNb2RlICYmXG4gICAgICAgICAgICBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICBpc0xDb250YWluZXIocHJldkxDb250YWluZXIpLCB0cnVlLFxuICAgICAgICAgICAgICAgICdBbiBhdHRhY2hlZCB2aWV3IHNob3VsZCBoYXZlIGl0cyBQQVJFTlQgcG9pbnQgdG8gYSBjb250YWluZXIuJyk7XG5cblxuICAgICAgICAvLyBXZSBuZWVkIHRvIHJlLWNyZWF0ZSBhIFIzVmlld0NvbnRhaW5lclJlZiBpbnN0YW5jZSBzaW5jZSB0aG9zZSBhcmUgbm90IHN0b3JlZCBvblxuICAgICAgICAvLyBMVmlldyAobm9yIGFueXdoZXJlIGVsc2UpLlxuICAgICAgICBjb25zdCBwcmV2VkNSZWYgPSBuZXcgUjNWaWV3Q29udGFpbmVyUmVmKFxuICAgICAgICAgICAgcHJldkxDb250YWluZXIsIHByZXZMQ29udGFpbmVyW1RfSE9TVF0gYXMgVERpcmVjdGl2ZUhvc3ROb2RlLCBwcmV2TENvbnRhaW5lcltQQVJFTlRdKTtcblxuICAgICAgICBwcmV2VkNSZWYuZGV0YWNoKHByZXZWQ1JlZi5pbmRleE9mKHZpZXdSZWYpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBMb2dpY2FsIG9wZXJhdGlvbiBvZiBhZGRpbmcgYExWaWV3YCB0byBgTENvbnRhaW5lcmBcbiAgICBjb25zdCBhZGp1c3RlZElkeCA9IHRoaXMuX2FkanVzdEluZGV4KGluZGV4KTtcbiAgICBjb25zdCBsQ29udGFpbmVyID0gdGhpcy5fbENvbnRhaW5lcjtcblxuICAgIGFkZExWaWV3VG9MQ29udGFpbmVyKGxDb250YWluZXIsIGxWaWV3LCBhZGp1c3RlZElkeCwgYWRkVG9ET00pO1xuXG4gICAgKHZpZXdSZWYgYXMgUjNWaWV3UmVmPGFueT4pLmF0dGFjaFRvVmlld0NvbnRhaW5lclJlZigpO1xuICAgIGFkZFRvQXJyYXkoZ2V0T3JDcmVhdGVWaWV3UmVmcyhsQ29udGFpbmVyKSwgYWRqdXN0ZWRJZHgsIHZpZXdSZWYpO1xuXG4gICAgcmV0dXJuIHZpZXdSZWY7XG4gIH1cblxuICBvdmVycmlkZSBtb3ZlKHZpZXdSZWY6IFZpZXdSZWYsIG5ld0luZGV4OiBudW1iZXIpOiBWaWV3UmVmIHtcbiAgICBpZiAobmdEZXZNb2RlICYmIHZpZXdSZWYuZGVzdHJveWVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBtb3ZlIGEgZGVzdHJveWVkIFZpZXcgaW4gYSBWaWV3Q29udGFpbmVyIScpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5pbnNlcnQodmlld1JlZiwgbmV3SW5kZXgpO1xuICB9XG5cbiAgb3ZlcnJpZGUgaW5kZXhPZih2aWV3UmVmOiBWaWV3UmVmKTogbnVtYmVyIHtcbiAgICBjb25zdCB2aWV3UmVmc0FyciA9IGdldFZpZXdSZWZzKHRoaXMuX2xDb250YWluZXIpO1xuICAgIHJldHVybiB2aWV3UmVmc0FyciAhPT0gbnVsbCA/IHZpZXdSZWZzQXJyLmluZGV4T2Yodmlld1JlZikgOiAtMTtcbiAgfVxuXG4gIG92ZXJyaWRlIHJlbW92ZShpbmRleD86IG51bWJlcik6IHZvaWQge1xuICAgIGNvbnN0IGFkanVzdGVkSWR4ID0gdGhpcy5fYWRqdXN0SW5kZXgoaW5kZXgsIC0xKTtcbiAgICBjb25zdCBkZXRhY2hlZFZpZXcgPSBkZXRhY2hWaWV3KHRoaXMuX2xDb250YWluZXIsIGFkanVzdGVkSWR4KTtcblxuICAgIGlmIChkZXRhY2hlZFZpZXcpIHtcbiAgICAgIC8vIEJlZm9yZSBkZXN0cm95aW5nIHRoZSB2aWV3LCByZW1vdmUgaXQgZnJvbSB0aGUgY29udGFpbmVyJ3MgYXJyYXkgb2YgYFZpZXdSZWZgcy5cbiAgICAgIC8vIFRoaXMgZW5zdXJlcyB0aGUgdmlldyBjb250YWluZXIgbGVuZ3RoIGlzIHVwZGF0ZWQgYmVmb3JlIGNhbGxpbmdcbiAgICAgIC8vIGBkZXN0cm95TFZpZXdgLCB3aGljaCBjb3VsZCByZWN1cnNpdmVseSBjYWxsIHZpZXcgY29udGFpbmVyIG1ldGhvZHMgdGhhdFxuICAgICAgLy8gcmVseSBvbiBhbiBhY2N1cmF0ZSBjb250YWluZXIgbGVuZ3RoLlxuICAgICAgLy8gKGUuZy4gYSBtZXRob2Qgb24gdGhpcyB2aWV3IGNvbnRhaW5lciBiZWluZyBjYWxsZWQgYnkgYSBjaGlsZCBkaXJlY3RpdmUncyBPbkRlc3Ryb3lcbiAgICAgIC8vIGxpZmVjeWNsZSBob29rKVxuICAgICAgcmVtb3ZlRnJvbUFycmF5KGdldE9yQ3JlYXRlVmlld1JlZnModGhpcy5fbENvbnRhaW5lciksIGFkanVzdGVkSWR4KTtcbiAgICAgIGRlc3Ryb3lMVmlldyhkZXRhY2hlZFZpZXdbVFZJRVddLCBkZXRhY2hlZFZpZXcpO1xuICAgIH1cbiAgfVxuXG4gIG92ZXJyaWRlIGRldGFjaChpbmRleD86IG51bWJlcik6IFZpZXdSZWZ8bnVsbCB7XG4gICAgY29uc3QgYWRqdXN0ZWRJZHggPSB0aGlzLl9hZGp1c3RJbmRleChpbmRleCwgLTEpO1xuICAgIGNvbnN0IHZpZXcgPSBkZXRhY2hWaWV3KHRoaXMuX2xDb250YWluZXIsIGFkanVzdGVkSWR4KTtcblxuICAgIGNvbnN0IHdhc0RldGFjaGVkID1cbiAgICAgICAgdmlldyAmJiByZW1vdmVGcm9tQXJyYXkoZ2V0T3JDcmVhdGVWaWV3UmVmcyh0aGlzLl9sQ29udGFpbmVyKSwgYWRqdXN0ZWRJZHgpICE9IG51bGw7XG4gICAgcmV0dXJuIHdhc0RldGFjaGVkID8gbmV3IFIzVmlld1JlZih2aWV3ISkgOiBudWxsO1xuICB9XG5cbiAgcHJpdmF0ZSBfYWRqdXN0SW5kZXgoaW5kZXg/OiBudW1iZXIsIHNoaWZ0OiBudW1iZXIgPSAwKSB7XG4gICAgaWYgKGluZGV4ID09IG51bGwpIHtcbiAgICAgIHJldHVybiB0aGlzLmxlbmd0aCArIHNoaWZ0O1xuICAgIH1cbiAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICBhc3NlcnRHcmVhdGVyVGhhbihpbmRleCwgLTEsIGBWaWV3UmVmIGluZGV4IG11c3QgYmUgcG9zaXRpdmUsIGdvdCAke2luZGV4fWApO1xuICAgICAgLy8gKzEgYmVjYXVzZSBpdCdzIGxlZ2FsIHRvIGluc2VydCBhdCB0aGUgZW5kLlxuICAgICAgYXNzZXJ0TGVzc1RoYW4oaW5kZXgsIHRoaXMubGVuZ3RoICsgMSArIHNoaWZ0LCAnaW5kZXgnKTtcbiAgICB9XG4gICAgcmV0dXJuIGluZGV4O1xuICB9XG59O1xuXG5mdW5jdGlvbiBnZXRWaWV3UmVmcyhsQ29udGFpbmVyOiBMQ29udGFpbmVyKTogVmlld1JlZltdfG51bGwge1xuICByZXR1cm4gbENvbnRhaW5lcltWSUVXX1JFRlNdIGFzIFZpZXdSZWZbXTtcbn1cblxuZnVuY3Rpb24gZ2V0T3JDcmVhdGVWaWV3UmVmcyhsQ29udGFpbmVyOiBMQ29udGFpbmVyKTogVmlld1JlZltdIHtcbiAgcmV0dXJuIChsQ29udGFpbmVyW1ZJRVdfUkVGU10gfHwgKGxDb250YWluZXJbVklFV19SRUZTXSA9IFtdKSkgYXMgVmlld1JlZltdO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBWaWV3Q29udGFpbmVyUmVmIGFuZCBzdG9yZXMgaXQgb24gdGhlIGluamVjdG9yLlxuICpcbiAqIEBwYXJhbSBob3N0VE5vZGUgVGhlIG5vZGUgdGhhdCBpcyByZXF1ZXN0aW5nIGEgVmlld0NvbnRhaW5lclJlZlxuICogQHBhcmFtIGhvc3RMVmlldyBUaGUgdmlldyB0byB3aGljaCB0aGUgbm9kZSBiZWxvbmdzXG4gKiBAcmV0dXJucyBUaGUgVmlld0NvbnRhaW5lclJlZiBpbnN0YW5jZSB0byB1c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUNvbnRhaW5lclJlZihcbiAgICBob3N0VE5vZGU6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxURWxlbWVudENvbnRhaW5lck5vZGUsXG4gICAgaG9zdExWaWV3OiBMVmlldyk6IFZpZXdDb250YWluZXJSZWYge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0VE5vZGVUeXBlKGhvc3RUTm9kZSwgVE5vZGVUeXBlLkFueUNvbnRhaW5lciB8IFROb2RlVHlwZS5BbnlSTm9kZSk7XG5cbiAgbGV0IGxDb250YWluZXI6IExDb250YWluZXI7XG4gIGNvbnN0IHNsb3RWYWx1ZSA9IGhvc3RMVmlld1tob3N0VE5vZGUuaW5kZXhdO1xuICBpZiAoaXNMQ29udGFpbmVyKHNsb3RWYWx1ZSkpIHtcbiAgICAvLyBJZiB0aGUgaG9zdCBpcyBhIGNvbnRhaW5lciwgd2UgZG9uJ3QgbmVlZCB0byBjcmVhdGUgYSBuZXcgTENvbnRhaW5lclxuICAgIGxDb250YWluZXIgPSBzbG90VmFsdWU7XG4gIH0gZWxzZSB7XG4gICAgLy8gQW4gTENvbnRhaW5lciBhbmNob3IgY2FuIG5vdCBiZSBgbnVsbGAsIGJ1dCB3ZSBzZXQgaXQgaGVyZSB0ZW1wb3JhcmlseVxuICAgIC8vIGFuZCB1cGRhdGUgdG8gdGhlIGFjdHVhbCB2YWx1ZSBsYXRlciBpbiB0aGlzIGZ1bmN0aW9uIChzZWVcbiAgICAvLyBgX2xvY2F0ZU9yQ3JlYXRlQW5jaG9yTm9kZWApLlxuICAgIGxDb250YWluZXIgPSBjcmVhdGVMQ29udGFpbmVyKHNsb3RWYWx1ZSwgaG9zdExWaWV3LCBudWxsISwgaG9zdFROb2RlKTtcbiAgICBob3N0TFZpZXdbaG9zdFROb2RlLmluZGV4XSA9IGxDb250YWluZXI7XG4gICAgYWRkVG9WaWV3VHJlZShob3N0TFZpZXcsIGxDb250YWluZXIpO1xuICB9XG4gIF9sb2NhdGVPckNyZWF0ZUFuY2hvck5vZGUobENvbnRhaW5lciwgaG9zdExWaWV3LCBob3N0VE5vZGUsIHNsb3RWYWx1ZSk7XG5cbiAgcmV0dXJuIG5ldyBSM1ZpZXdDb250YWluZXJSZWYobENvbnRhaW5lciwgaG9zdFROb2RlLCBob3N0TFZpZXcpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYW5kIGluc2VydHMgYSBjb21tZW50IG5vZGUgdGhhdCBhY3RzIGFzIGFuIGFuY2hvciBmb3IgYSB2aWV3IGNvbnRhaW5lci5cbiAqXG4gKiBJZiB0aGUgaG9zdCBpcyBhIHJlZ3VsYXIgZWxlbWVudCwgd2UgaGF2ZSB0byBpbnNlcnQgYSBjb21tZW50IG5vZGUgbWFudWFsbHkgd2hpY2ggd2lsbFxuICogYmUgdXNlZCBhcyBhbiBhbmNob3Igd2hlbiBpbnNlcnRpbmcgZWxlbWVudHMuIEluIHRoaXMgc3BlY2lmaWMgY2FzZSB3ZSB1c2UgbG93LWxldmVsIERPTVxuICogbWFuaXB1bGF0aW9uIHRvIGluc2VydCBpdC5cbiAqL1xuZnVuY3Rpb24gaW5zZXJ0QW5jaG9yTm9kZShob3N0TFZpZXc6IExWaWV3LCBob3N0VE5vZGU6IFROb2RlKTogUkNvbW1lbnQge1xuICBjb25zdCByZW5kZXJlciA9IGhvc3RMVmlld1tSRU5ERVJFUl07XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJDcmVhdGVDb21tZW50Kys7XG4gIGNvbnN0IGNvbW1lbnROb2RlID0gcmVuZGVyZXIuY3JlYXRlQ29tbWVudChuZ0Rldk1vZGUgPyAnY29udGFpbmVyJyA6ICcnKTtcblxuICBjb25zdCBob3N0TmF0aXZlID0gZ2V0TmF0aXZlQnlUTm9kZShob3N0VE5vZGUsIGhvc3RMVmlldykhO1xuICBjb25zdCBwYXJlbnRPZkhvc3ROYXRpdmUgPSBuYXRpdmVQYXJlbnROb2RlKHJlbmRlcmVyLCBob3N0TmF0aXZlKTtcbiAgbmF0aXZlSW5zZXJ0QmVmb3JlKFxuICAgICAgcmVuZGVyZXIsIHBhcmVudE9mSG9zdE5hdGl2ZSEsIGNvbW1lbnROb2RlLCBuYXRpdmVOZXh0U2libGluZyhyZW5kZXJlciwgaG9zdE5hdGl2ZSksIGZhbHNlKTtcbiAgcmV0dXJuIGNvbW1lbnROb2RlO1xufVxuXG5sZXQgX2xvY2F0ZU9yQ3JlYXRlQW5jaG9yTm9kZSA9IGNyZWF0ZUFuY2hvck5vZGU7XG5sZXQgX3BvcHVsYXRlRGVoeWRyYXRlZFZpZXdzSW5MQ29udGFpbmVyOiB0eXBlb2YgcG9wdWxhdGVEZWh5ZHJhdGVkVmlld3NJbkxDb250YWluZXJJbXBsID0gKCkgPT5cbiAgICBmYWxzZTsgIC8vIG5vb3AgYnkgZGVmYXVsdFxuXG4vKipcbiAqIExvb2tzIHVwIGRlaHlkcmF0ZWQgdmlld3MgdGhhdCBiZWxvbmcgdG8gYSBnaXZlbiBMQ29udGFpbmVyIGFuZCBwb3B1bGF0ZXNcbiAqIHRoaXMgaW5mb3JtYXRpb24gaW50byB0aGUgYExDb250YWluZXJbREVIWURSQVRFRF9WSUVXU11gIHNsb3QuIFdoZW4gcnVubmluZ1xuICogaW4gY2xpZW50LW9ubHkgbW9kZSwgdGhpcyBmdW5jdGlvbiBpcyBhIG5vb3AuXG4gKlxuICogQHBhcmFtIGxDb250YWluZXIgTENvbnRhaW5lciB0aGF0IHNob3VsZCBiZSBwb3B1bGF0ZWQuXG4gKiBAcGFyYW0gdE5vZGUgQ29ycmVzcG9uZGluZyBUTm9kZS5cbiAqIEBwYXJhbSBob3N0TFZpZXcgTFZpZXcgdGhhdCBob3N0cyBMQ29udGFpbmVyLlxuICogQHJldHVybnMgYSBib29sZWFuIGZsYWcgdGhhdCBpbmRpY2F0ZXMgd2hldGhlciBhIHBvcHVsYXRpbmcgb3BlcmF0aW9uXG4gKiAgIHdhcyBzdWNjZXNzZnVsLiBUaGUgb3BlcmF0aW9uIG1pZ2h0IGJlIHVuc3VjY2Vzc2Z1bCBpbiBjYXNlIGlzIGhhcyBjb21wbGV0ZWRcbiAqICAgcHJldmlvdXNseSwgd2UgYXJlIHJlbmRlcmluZyBpbiBjbGllbnQtb25seSBtb2RlIG9yIHRoaXMgY29udGVudCBpcyBsb2NhdGVkXG4gKiAgIGluIGEgc2tpcCBoeWRyYXRpb24gc2VjdGlvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBvcHVsYXRlRGVoeWRyYXRlZFZpZXdzSW5MQ29udGFpbmVyKFxuICAgIGxDb250YWluZXI6IExDb250YWluZXIsIHROb2RlOiBUTm9kZSwgaG9zdExWaWV3OiBMVmlldyk6IGJvb2xlYW4ge1xuICByZXR1cm4gX3BvcHVsYXRlRGVoeWRyYXRlZFZpZXdzSW5MQ29udGFpbmVyKGxDb250YWluZXIsIHROb2RlLCBob3N0TFZpZXcpO1xufVxuXG4vKipcbiAqIFJlZ3VsYXIgY3JlYXRpb24gbW9kZTogYW4gYW5jaG9yIGlzIGNyZWF0ZWQgYW5kXG4gKiBhc3NpZ25lZCB0byB0aGUgYGxDb250YWluZXJbTkFUSVZFXWAgc2xvdC5cbiAqL1xuZnVuY3Rpb24gY3JlYXRlQW5jaG9yTm9kZShcbiAgICBsQ29udGFpbmVyOiBMQ29udGFpbmVyLCBob3N0TFZpZXc6IExWaWV3LCBob3N0VE5vZGU6IFROb2RlLCBzbG90VmFsdWU6IGFueSkge1xuICAvLyBXZSBhbHJlYWR5IGhhdmUgYSBuYXRpdmUgZWxlbWVudCAoYW5jaG9yKSBzZXQsIHJldHVybi5cbiAgaWYgKGxDb250YWluZXJbTkFUSVZFXSkgcmV0dXJuO1xuXG4gIGxldCBjb21tZW50Tm9kZTogUkNvbW1lbnQ7XG4gIC8vIElmIHRoZSBob3N0IGlzIGFuIGVsZW1lbnQgY29udGFpbmVyLCB0aGUgbmF0aXZlIGhvc3QgZWxlbWVudCBpcyBndWFyYW50ZWVkIHRvIGJlIGFcbiAgLy8gY29tbWVudCBhbmQgd2UgY2FuIHJldXNlIHRoYXQgY29tbWVudCBhcyBhbmNob3IgZWxlbWVudCBmb3IgdGhlIG5ldyBMQ29udGFpbmVyLlxuICAvLyBUaGUgY29tbWVudCBub2RlIGluIHF1ZXN0aW9uIGlzIGFscmVhZHkgcGFydCBvZiB0aGUgRE9NIHN0cnVjdHVyZSBzbyB3ZSBkb24ndCBuZWVkIHRvIGFwcGVuZFxuICAvLyBpdCBhZ2Fpbi5cbiAgaWYgKGhvc3RUTm9kZS50eXBlICYgVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpIHtcbiAgICBjb21tZW50Tm9kZSA9IHVud3JhcFJOb2RlKHNsb3RWYWx1ZSkgYXMgUkNvbW1lbnQ7XG4gIH0gZWxzZSB7XG4gICAgY29tbWVudE5vZGUgPSBpbnNlcnRBbmNob3JOb2RlKGhvc3RMVmlldywgaG9zdFROb2RlKTtcbiAgfVxuICBsQ29udGFpbmVyW05BVElWRV0gPSBjb21tZW50Tm9kZTtcbn1cblxuLyoqXG4gKiBIeWRyYXRpb24gbG9naWMgdGhhdCBsb29rcyB1cCBhbGwgZGVoeWRyYXRlZCB2aWV3cyBpbiB0aGlzIGNvbnRhaW5lclxuICogYW5kIHB1dHMgdGhlbSBpbnRvIGBsQ29udGFpbmVyW0RFSFlEUkFURURfVklFV1NdYCBzbG90LlxuICpcbiAqIEByZXR1cm5zIGEgYm9vbGVhbiBmbGFnIHRoYXQgaW5kaWNhdGVzIHdoZXRoZXIgYSBwb3B1bGF0aW5nIG9wZXJhdGlvblxuICogICB3YXMgc3VjY2Vzc2Z1bC4gVGhlIG9wZXJhdGlvbiBtaWdodCBiZSB1bnN1Y2Nlc3NmdWwgaW4gY2FzZSBpcyBoYXMgY29tcGxldGVkXG4gKiAgIHByZXZpb3VzbHksIHdlIGFyZSByZW5kZXJpbmcgaW4gY2xpZW50LW9ubHkgbW9kZSBvciB0aGlzIGNvbnRlbnQgaXMgbG9jYXRlZFxuICogICBpbiBhIHNraXAgaHlkcmF0aW9uIHNlY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIHBvcHVsYXRlRGVoeWRyYXRlZFZpZXdzSW5MQ29udGFpbmVySW1wbChcbiAgICBsQ29udGFpbmVyOiBMQ29udGFpbmVyLCB0Tm9kZTogVE5vZGUsIGhvc3RMVmlldzogTFZpZXcpOiBib29sZWFuIHtcbiAgLy8gV2UgYWxyZWFkeSBoYXZlIGEgbmF0aXZlIGVsZW1lbnQgKGFuY2hvcikgc2V0IGFuZCB0aGUgcHJvY2Vzc1xuICAvLyBvZiBmaW5kaW5nIGRlaHlkcmF0ZWQgdmlld3MgaGFwcGVuZWQgKHNvIHRoZSBgbENvbnRhaW5lcltERUhZRFJBVEVEX1ZJRVdTXWBcbiAgLy8gaXMgbm90IG51bGwpLCBleGl0IGVhcmx5LlxuICBpZiAobENvbnRhaW5lcltOQVRJVkVdICYmIGxDb250YWluZXJbREVIWURSQVRFRF9WSUVXU10pIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGNvbnN0IGh5ZHJhdGlvbkluZm8gPSBob3N0TFZpZXdbSFlEUkFUSU9OXTtcbiAgY29uc3Qgbm9PZmZzZXRJbmRleCA9IHROb2RlLmluZGV4IC0gSEVBREVSX09GRlNFVDtcbiAgY29uc3QgaXNOb2RlQ3JlYXRpb25Nb2RlID0gIWh5ZHJhdGlvbkluZm8gfHwgaXNJblNraXBIeWRyYXRpb25CbG9jayh0Tm9kZSkgfHxcbiAgICAgIGlzRGlzY29ubmVjdGVkTm9kZShoeWRyYXRpb25JbmZvLCBub09mZnNldEluZGV4KTtcblxuICAvLyBSZWd1bGFyIGNyZWF0aW9uIG1vZGUuXG4gIGlmIChpc05vZGVDcmVhdGlvbk1vZGUpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvLyBIeWRyYXRpb24gbW9kZSwgbG9va2luZyB1cCBhbiBhbmNob3Igbm9kZSBhbmQgZGVoeWRyYXRlZCB2aWV3cyBpbiBET00uXG4gIGNvbnN0IGN1cnJlbnRSTm9kZTogUk5vZGV8bnVsbCA9IGdldFNlZ21lbnRIZWFkKGh5ZHJhdGlvbkluZm8sIG5vT2Zmc2V0SW5kZXgpO1xuXG4gIGNvbnN0IHNlcmlhbGl6ZWRWaWV3cyA9IGh5ZHJhdGlvbkluZm8uZGF0YVtDT05UQUlORVJTXT8uW25vT2Zmc2V0SW5kZXhdO1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydERlZmluZWQoXG4gICAgICAgICAgc2VyaWFsaXplZFZpZXdzLFxuICAgICAgICAgICdVbmV4cGVjdGVkIHN0YXRlOiBubyBoeWRyYXRpb24gaW5mbyBhdmFpbGFibGUgZm9yIGEgZ2l2ZW4gVE5vZGUsICcgK1xuICAgICAgICAgICAgICAnd2hpY2ggcmVwcmVzZW50cyBhIHZpZXcgY29udGFpbmVyLicpO1xuXG4gIGNvbnN0IFtjb21tZW50Tm9kZSwgZGVoeWRyYXRlZFZpZXdzXSA9XG4gICAgICBsb2NhdGVEZWh5ZHJhdGVkVmlld3NJbkNvbnRhaW5lcihjdXJyZW50Uk5vZGUhLCBzZXJpYWxpemVkVmlld3MhKTtcblxuICBpZiAobmdEZXZNb2RlKSB7XG4gICAgdmFsaWRhdGVNYXRjaGluZ05vZGUoY29tbWVudE5vZGUsIE5vZGUuQ09NTUVOVF9OT0RFLCBudWxsLCBob3N0TFZpZXcsIHROb2RlLCB0cnVlKTtcbiAgICAvLyBEbyBub3QgdGhyb3cgaW4gY2FzZSB0aGlzIG5vZGUgaXMgYWxyZWFkeSBjbGFpbWVkICh0aHVzIGBmYWxzZWAgYXMgYSBzZWNvbmRcbiAgICAvLyBhcmd1bWVudCkuIElmIHRoaXMgY29udGFpbmVyIGlzIGNyZWF0ZWQgYmFzZWQgb24gYW4gYDxuZy10ZW1wbGF0ZT5gLCB0aGUgY29tbWVudFxuICAgIC8vIG5vZGUgd291bGQgYmUgYWxyZWFkeSBjbGFpbWVkIGZyb20gdGhlIGB0ZW1wbGF0ZWAgaW5zdHJ1Y3Rpb24uIElmIGFuIGVsZW1lbnQgYWN0c1xuICAgIC8vIGFzIGFuIGFuY2hvciAoZS5nLiA8ZGl2ICN2Y1JlZj4pLCBhIHNlcGFyYXRlIGNvbW1lbnQgbm9kZSB3b3VsZCBiZSBjcmVhdGVkL2xvY2F0ZWQsXG4gICAgLy8gc28gd2UgbmVlZCB0byBjbGFpbSBpdCBoZXJlLlxuICAgIG1hcmtSTm9kZUFzQ2xhaW1lZEJ5SHlkcmF0aW9uKGNvbW1lbnROb2RlLCBmYWxzZSk7XG4gIH1cblxuICBsQ29udGFpbmVyW05BVElWRV0gPSBjb21tZW50Tm9kZSBhcyBSQ29tbWVudDtcbiAgbENvbnRhaW5lcltERUhZRFJBVEVEX1ZJRVdTXSA9IGRlaHlkcmF0ZWRWaWV3cztcblxuICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gbG9jYXRlT3JDcmVhdGVBbmNob3JOb2RlKFxuICAgIGxDb250YWluZXI6IExDb250YWluZXIsIGhvc3RMVmlldzogTFZpZXcsIGhvc3RUTm9kZTogVE5vZGUsIHNsb3RWYWx1ZTogYW55KTogdm9pZCB7XG4gIGlmICghX3BvcHVsYXRlRGVoeWRyYXRlZFZpZXdzSW5MQ29udGFpbmVyKGxDb250YWluZXIsIGhvc3RUTm9kZSwgaG9zdExWaWV3KSkge1xuICAgIC8vIFBvcHVsYXRpbmcgZGVoeWRyYXRlZCB2aWV3cyBvcGVyYXRpb24gcmV0dXJuZWQgYGZhbHNlYCwgd2hpY2ggaW5kaWNhdGVzXG4gICAgLy8gdGhhdCB0aGUgbG9naWMgd2FzIHJ1bm5pbmcgaW4gY2xpZW50LW9ubHkgbW9kZSwgdGhpcyBhbiBhbmNob3IgY29tbWVudFxuICAgIC8vIG5vZGUgc2hvdWxkIGJlIGNyZWF0ZWQgZm9yIHRoaXMgY29udGFpbmVyLlxuICAgIGNyZWF0ZUFuY2hvck5vZGUobENvbnRhaW5lciwgaG9zdExWaWV3LCBob3N0VE5vZGUsIHNsb3RWYWx1ZSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVuYWJsZUxvY2F0ZU9yQ3JlYXRlQ29udGFpbmVyUmVmSW1wbCgpIHtcbiAgX2xvY2F0ZU9yQ3JlYXRlQW5jaG9yTm9kZSA9IGxvY2F0ZU9yQ3JlYXRlQW5jaG9yTm9kZTtcbiAgX3BvcHVsYXRlRGVoeWRyYXRlZFZpZXdzSW5MQ29udGFpbmVyID0gcG9wdWxhdGVEZWh5ZHJhdGVkVmlld3NJbkxDb250YWluZXJJbXBsO1xufVxuIl19