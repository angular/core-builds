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
let _populateDehydratedViewsInLContainer = (lContainer, tNode, hostLView) => false; // noop by default
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld19jb250YWluZXJfcmVmLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvbGlua2VyL3ZpZXdfY29udGFpbmVyX3JlZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFHSCxPQUFPLEVBQUMsbUJBQW1CLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUN0RCxPQUFPLEVBQUMsb0JBQW9CLEVBQUMsTUFBTSw2QkFBNkIsQ0FBQztBQUNqRSxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFDbkQsT0FBTyxFQUE4QixzQkFBc0IsRUFBQyxNQUFNLDZCQUE2QixDQUFDO0FBQ2hHLE9BQU8sRUFBQyxjQUFjLEVBQUUsa0JBQWtCLEVBQUUsNkJBQTZCLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUNyRyxPQUFPLEVBQUMsMEJBQTBCLEVBQUUsZ0NBQWdDLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUNoRyxPQUFPLEVBQUMsTUFBTSxFQUFPLE1BQU0sbUJBQW1CLENBQUM7QUFDL0MsT0FBTyxFQUFDLGtCQUFrQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDckQsT0FBTyxFQUFDLGdCQUFnQixJQUFJLGtCQUFrQixFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFDaEYsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3RELE9BQU8sRUFBQyx5QkFBeUIsRUFBRSxZQUFZLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDdEUsT0FBTyxFQUFDLGFBQWEsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLGdDQUFnQyxDQUFDO0FBQy9FLE9BQU8sRUFBQyx1QkFBdUIsRUFBRSxnQkFBZ0IsRUFBYyxNQUFNLEVBQUUsU0FBUyxFQUFDLE1BQU0saUNBQWlDLENBQUM7QUFJekgsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLG1DQUFtQyxDQUFDO0FB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Qiw2QkFBNkIsQ0FBQyxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDcEQsQ0FBQztJQUVELFVBQVUsQ0FBQyxNQUFNLENBQUMsR0FBRyxXQUF1QixDQUFDO0lBQzdDLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLGVBQWUsQ0FBQztJQUUvQyxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFFRCxTQUFTLHdCQUF3QixDQUM3QixVQUFzQixFQUFFLFNBQWdCLEVBQUUsU0FBZ0IsRUFBRSxTQUFjO0lBQzVFLElBQUksQ0FBQyxvQ0FBb0MsQ0FBQyxVQUFVLEVBQUUsU0FBUyxFQUFFLFNBQVMsQ0FBQyxFQUFFLENBQUM7UUFDNUUsMEVBQTBFO1FBQzFFLHlFQUF5RTtRQUN6RSw2Q0FBNkM7UUFDN0MsZ0JBQWdCLENBQUMsVUFBVSxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDaEUsQ0FBQztBQUNILENBQUM7QUFFRCxNQUFNLFVBQVUsb0NBQW9DO0lBQ2xELHlCQUF5QixHQUFHLHdCQUF3QixDQUFDO0lBQ3JELG9DQUFvQyxHQUFHLHVDQUF1QyxDQUFDO0FBQ2pGLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi4vZGkvaW5qZWN0b3InO1xuaW1wb3J0IHtFbnZpcm9ubWVudEluamVjdG9yfSBmcm9tICcuLi9kaS9yM19pbmplY3Rvcic7XG5pbXBvcnQge3ZhbGlkYXRlTWF0Y2hpbmdOb2RlfSBmcm9tICcuLi9oeWRyYXRpb24vZXJyb3JfaGFuZGxpbmcnO1xuaW1wb3J0IHtDT05UQUlORVJTfSBmcm9tICcuLi9oeWRyYXRpb24vaW50ZXJmYWNlcyc7XG5pbXBvcnQge2hhc0luU2tpcEh5ZHJhdGlvbkJsb2NrRmxhZywgaXNJblNraXBIeWRyYXRpb25CbG9ja30gZnJvbSAnLi4vaHlkcmF0aW9uL3NraXBfaHlkcmF0aW9uJztcbmltcG9ydCB7Z2V0U2VnbWVudEhlYWQsIGlzRGlzY29ubmVjdGVkTm9kZSwgbWFya1JOb2RlQXNDbGFpbWVkQnlIeWRyYXRpb259IGZyb20gJy4uL2h5ZHJhdGlvbi91dGlscyc7XG5pbXBvcnQge2ZpbmRNYXRjaGluZ0RlaHlkcmF0ZWRWaWV3LCBsb2NhdGVEZWh5ZHJhdGVkVmlld3NJbkNvbnRhaW5lcn0gZnJvbSAnLi4vaHlkcmF0aW9uL3ZpZXdzJztcbmltcG9ydCB7aXNUeXBlLCBUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge2Fzc2VydE5vZGVJbmplY3Rvcn0gZnJvbSAnLi4vcmVuZGVyMy9hc3NlcnQnO1xuaW1wb3J0IHtDb21wb25lbnRGYWN0b3J5IGFzIFIzQ29tcG9uZW50RmFjdG9yeX0gZnJvbSAnLi4vcmVuZGVyMy9jb21wb25lbnRfcmVmJztcbmltcG9ydCB7Z2V0Q29tcG9uZW50RGVmfSBmcm9tICcuLi9yZW5kZXIzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtnZXRQYXJlbnRJbmplY3RvckxvY2F0aW9uLCBOb2RlSW5qZWN0b3J9IGZyb20gJy4uL3JlbmRlcjMvZGknO1xuaW1wb3J0IHthZGRUb1ZpZXdUcmVlLCBjcmVhdGVMQ29udGFpbmVyfSBmcm9tICcuLi9yZW5kZXIzL2luc3RydWN0aW9ucy9zaGFyZWQnO1xuaW1wb3J0IHtDT05UQUlORVJfSEVBREVSX09GRlNFVCwgREVIWURSQVRFRF9WSUVXUywgTENvbnRhaW5lciwgTkFUSVZFLCBWSUVXX1JFRlN9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtOb2RlSW5qZWN0b3JPZmZzZXR9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy9pbmplY3Rvcic7XG5pbXBvcnQge1RDb250YWluZXJOb2RlLCBURGlyZWN0aXZlSG9zdE5vZGUsIFRFbGVtZW50Q29udGFpbmVyTm9kZSwgVEVsZW1lbnROb2RlLCBUTm9kZSwgVE5vZGVUeXBlfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1JDb21tZW50LCBSTm9kZX0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3JlbmRlcmVyX2RvbSc7XG5pbXBvcnQge2lzTENvbnRhaW5lcn0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3R5cGVfY2hlY2tzJztcbmltcG9ydCB7SEVBREVSX09GRlNFVCwgSFlEUkFUSU9OLCBMVmlldywgUEFSRU5ULCBSRU5ERVJFUiwgVF9IT1NULCBUVklFV30gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHthc3NlcnRUTm9kZVR5cGV9IGZyb20gJy4uL3JlbmRlcjMvbm9kZV9hc3NlcnQnO1xuaW1wb3J0IHtkZXN0cm95TFZpZXcsIGRldGFjaFZpZXcsIG5hdGl2ZUluc2VydEJlZm9yZSwgbmF0aXZlTmV4dFNpYmxpbmcsIG5hdGl2ZVBhcmVudE5vZGV9IGZyb20gJy4uL3JlbmRlcjMvbm9kZV9tYW5pcHVsYXRpb24nO1xuaW1wb3J0IHtnZXRDdXJyZW50VE5vZGUsIGdldExWaWV3fSBmcm9tICcuLi9yZW5kZXIzL3N0YXRlJztcbmltcG9ydCB7Z2V0UGFyZW50SW5qZWN0b3JJbmRleCwgZ2V0UGFyZW50SW5qZWN0b3JWaWV3LCBoYXNQYXJlbnRJbmplY3Rvcn0gZnJvbSAnLi4vcmVuZGVyMy91dGlsL2luamVjdG9yX3V0aWxzJztcbmltcG9ydCB7Z2V0TmF0aXZlQnlUTm9kZSwgdW53cmFwUk5vZGUsIHZpZXdBdHRhY2hlZFRvQ29udGFpbmVyfSBmcm9tICcuLi9yZW5kZXIzL3V0aWwvdmlld191dGlscyc7XG5pbXBvcnQge2FkZExWaWV3VG9MQ29udGFpbmVyLCBzaG91bGRBZGRWaWV3VG9Eb219IGZyb20gJy4uL3JlbmRlcjMvdmlld19tYW5pcHVsYXRpb24nO1xuaW1wb3J0IHtWaWV3UmVmIGFzIFIzVmlld1JlZn0gZnJvbSAnLi4vcmVuZGVyMy92aWV3X3JlZic7XG5pbXBvcnQge2FkZFRvQXJyYXksIHJlbW92ZUZyb21BcnJheX0gZnJvbSAnLi4vdXRpbC9hcnJheV91dGlscyc7XG5pbXBvcnQge2Fzc2VydERlZmluZWQsIGFzc2VydEVxdWFsLCBhc3NlcnRHcmVhdGVyVGhhbiwgYXNzZXJ0TGVzc1RoYW4sIHRocm93RXJyb3J9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcblxuaW1wb3J0IHtDb21wb25lbnRGYWN0b3J5LCBDb21wb25lbnRSZWZ9IGZyb20gJy4vY29tcG9uZW50X2ZhY3RvcnknO1xuaW1wb3J0IHtjcmVhdGVFbGVtZW50UmVmLCBFbGVtZW50UmVmfSBmcm9tICcuL2VsZW1lbnRfcmVmJztcbmltcG9ydCB7TmdNb2R1bGVSZWZ9IGZyb20gJy4vbmdfbW9kdWxlX2ZhY3RvcnknO1xuaW1wb3J0IHtUZW1wbGF0ZVJlZn0gZnJvbSAnLi90ZW1wbGF0ZV9yZWYnO1xuaW1wb3J0IHtFbWJlZGRlZFZpZXdSZWYsIFZpZXdSZWZ9IGZyb20gJy4vdmlld19yZWYnO1xuXG4vKipcbiAqIFJlcHJlc2VudHMgYSBjb250YWluZXIgd2hlcmUgb25lIG9yIG1vcmUgdmlld3MgY2FuIGJlIGF0dGFjaGVkIHRvIGEgY29tcG9uZW50LlxuICpcbiAqIENhbiBjb250YWluICpob3N0IHZpZXdzKiAoY3JlYXRlZCBieSBpbnN0YW50aWF0aW5nIGFcbiAqIGNvbXBvbmVudCB3aXRoIHRoZSBgY3JlYXRlQ29tcG9uZW50KClgIG1ldGhvZCksIGFuZCAqZW1iZWRkZWQgdmlld3MqXG4gKiAoY3JlYXRlZCBieSBpbnN0YW50aWF0aW5nIGEgYFRlbXBsYXRlUmVmYCB3aXRoIHRoZSBgY3JlYXRlRW1iZWRkZWRWaWV3KClgIG1ldGhvZCkuXG4gKlxuICogQSB2aWV3IGNvbnRhaW5lciBpbnN0YW5jZSBjYW4gY29udGFpbiBvdGhlciB2aWV3IGNvbnRhaW5lcnMsXG4gKiBjcmVhdGluZyBhIFt2aWV3IGhpZXJhcmNoeV0oZ3VpZGUvZ2xvc3Nhcnkjdmlldy1oaWVyYXJjaHkpLlxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKlxuICogVGhlIGV4YW1wbGUgYmVsb3cgZGVtb25zdHJhdGVzIGhvdyB0aGUgYGNyZWF0ZUNvbXBvbmVudGAgZnVuY3Rpb24gY2FuIGJlIHVzZWRcbiAqIHRvIGNyZWF0ZSBhbiBpbnN0YW5jZSBvZiBhIENvbXBvbmVudFJlZiBkeW5hbWljYWxseSBhbmQgYXR0YWNoIGl0IHRvIGFuIEFwcGxpY2F0aW9uUmVmLFxuICogc28gdGhhdCBpdCBnZXRzIGluY2x1ZGVkIGludG8gY2hhbmdlIGRldGVjdGlvbiBjeWNsZXMuXG4gKlxuICogTm90ZTogdGhlIGV4YW1wbGUgdXNlcyBzdGFuZGFsb25lIGNvbXBvbmVudHMsIGJ1dCB0aGUgZnVuY3Rpb24gY2FuIGFsc28gYmUgdXNlZCBmb3JcbiAqIG5vbi1zdGFuZGFsb25lIGNvbXBvbmVudHMgKGRlY2xhcmVkIGluIGFuIE5nTW9kdWxlKSBhcyB3ZWxsLlxuICpcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIEBDb21wb25lbnQoe1xuICogICBzdGFuZGFsb25lOiB0cnVlLFxuICogICBzZWxlY3RvcjogJ2R5bmFtaWMnLFxuICogICB0ZW1wbGF0ZTogYDxzcGFuPlRoaXMgaXMgYSBjb250ZW50IG9mIGEgZHluYW1pYyBjb21wb25lbnQuPC9zcGFuPmAsXG4gKiB9KVxuICogY2xhc3MgRHluYW1pY0NvbXBvbmVudCB7XG4gKiAgIHZjciA9IGluamVjdChWaWV3Q29udGFpbmVyUmVmKTtcbiAqIH1cbiAqXG4gKiBAQ29tcG9uZW50KHtcbiAqICAgc3RhbmRhbG9uZTogdHJ1ZSxcbiAqICAgc2VsZWN0b3I6ICdhcHAnLFxuICogICB0ZW1wbGF0ZTogYDxtYWluPkhpISBUaGlzIGlzIHRoZSBtYWluIGNvbnRlbnQuPC9tYWluPmAsXG4gKiB9KVxuICogY2xhc3MgQXBwQ29tcG9uZW50IHtcbiAqICAgdmNyID0gaW5qZWN0KFZpZXdDb250YWluZXJSZWYpO1xuICpcbiAqICAgbmdBZnRlclZpZXdJbml0KCkge1xuICogICAgIGNvbnN0IGNvbXBSZWYgPSB0aGlzLnZjci5jcmVhdGVDb21wb25lbnQoRHluYW1pY0NvbXBvbmVudCk7XG4gKiAgICAgY29tcFJlZi5jaGFuZ2VEZXRlY3RvclJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gKiAgIH1cbiAqIH1cbiAqIGBgYFxuICpcbiAqIEBzZWUge0BsaW5rIENvbXBvbmVudFJlZn1cbiAqIEBzZWUge0BsaW5rIEVtYmVkZGVkVmlld1JlZn1cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBWaWV3Q29udGFpbmVyUmVmIHtcbiAgLyoqXG4gICAqIEFuY2hvciBlbGVtZW50IHRoYXQgc3BlY2lmaWVzIHRoZSBsb2NhdGlvbiBvZiB0aGlzIGNvbnRhaW5lciBpbiB0aGUgY29udGFpbmluZyB2aWV3LlxuICAgKiBFYWNoIHZpZXcgY29udGFpbmVyIGNhbiBoYXZlIG9ubHkgb25lIGFuY2hvciBlbGVtZW50LCBhbmQgZWFjaCBhbmNob3IgZWxlbWVudFxuICAgKiBjYW4gaGF2ZSBvbmx5IGEgc2luZ2xlIHZpZXcgY29udGFpbmVyLlxuICAgKlxuICAgKiBSb290IGVsZW1lbnRzIG9mIHZpZXdzIGF0dGFjaGVkIHRvIHRoaXMgY29udGFpbmVyIGJlY29tZSBzaWJsaW5ncyBvZiB0aGUgYW5jaG9yIGVsZW1lbnQgaW5cbiAgICogdGhlIHJlbmRlcmVkIHZpZXcuXG4gICAqXG4gICAqIEFjY2VzcyB0aGUgYFZpZXdDb250YWluZXJSZWZgIG9mIGFuIGVsZW1lbnQgYnkgcGxhY2luZyBhIGBEaXJlY3RpdmVgIGluamVjdGVkXG4gICAqIHdpdGggYFZpZXdDb250YWluZXJSZWZgIG9uIHRoZSBlbGVtZW50LCBvciB1c2UgYSBgVmlld0NoaWxkYCBxdWVyeS5cbiAgICpcbiAgICogPCEtLSBUT0RPOiByZW5hbWUgdG8gYW5jaG9yRWxlbWVudCAtLT5cbiAgICovXG4gIGFic3RyYWN0IGdldCBlbGVtZW50KCk6IEVsZW1lbnRSZWY7XG5cbiAgLyoqXG4gICAqIFRoZSBbZGVwZW5kZW5jeSBpbmplY3Rvcl0oZ3VpZGUvZ2xvc3NhcnkjaW5qZWN0b3IpIGZvciB0aGlzIHZpZXcgY29udGFpbmVyLlxuICAgKi9cbiAgYWJzdHJhY3QgZ2V0IGluamVjdG9yKCk6IEluamVjdG9yO1xuXG4gIC8qKiBAZGVwcmVjYXRlZCBObyByZXBsYWNlbWVudCAqL1xuICBhYnN0cmFjdCBnZXQgcGFyZW50SW5qZWN0b3IoKTogSW5qZWN0b3I7XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIGFsbCB2aWV3cyBpbiB0aGlzIGNvbnRhaW5lci5cbiAgICovXG4gIGFic3RyYWN0IGNsZWFyKCk6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyBhIHZpZXcgZnJvbSB0aGlzIGNvbnRhaW5lci5cbiAgICogQHBhcmFtIGluZGV4IFRoZSAwLWJhc2VkIGluZGV4IG9mIHRoZSB2aWV3IHRvIHJldHJpZXZlLlxuICAgKiBAcmV0dXJucyBUaGUgYFZpZXdSZWZgIGluc3RhbmNlLCBvciBudWxsIGlmIHRoZSBpbmRleCBpcyBvdXQgb2YgcmFuZ2UuXG4gICAqL1xuICBhYnN0cmFjdCBnZXQoaW5kZXg6IG51bWJlcik6IFZpZXdSZWZ8bnVsbDtcblxuICAvKipcbiAgICogUmVwb3J0cyBob3cgbWFueSB2aWV3cyBhcmUgY3VycmVudGx5IGF0dGFjaGVkIHRvIHRoaXMgY29udGFpbmVyLlxuICAgKiBAcmV0dXJucyBUaGUgbnVtYmVyIG9mIHZpZXdzLlxuICAgKi9cbiAgYWJzdHJhY3QgZ2V0IGxlbmd0aCgpOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIEluc3RhbnRpYXRlcyBhbiBlbWJlZGRlZCB2aWV3IGFuZCBpbnNlcnRzIGl0XG4gICAqIGludG8gdGhpcyBjb250YWluZXIuXG4gICAqIEBwYXJhbSB0ZW1wbGF0ZVJlZiBUaGUgSFRNTCB0ZW1wbGF0ZSB0aGF0IGRlZmluZXMgdGhlIHZpZXcuXG4gICAqIEBwYXJhbSBjb250ZXh0IFRoZSBkYXRhLWJpbmRpbmcgY29udGV4dCBvZiB0aGUgZW1iZWRkZWQgdmlldywgYXMgZGVjbGFyZWRcbiAgICogaW4gdGhlIGA8bmctdGVtcGxhdGU+YCB1c2FnZS5cbiAgICogQHBhcmFtIG9wdGlvbnMgRXh0cmEgY29uZmlndXJhdGlvbiBmb3IgdGhlIGNyZWF0ZWQgdmlldy4gSW5jbHVkZXM6XG4gICAqICAqIGluZGV4OiBUaGUgMC1iYXNlZCBpbmRleCBhdCB3aGljaCB0byBpbnNlcnQgdGhlIG5ldyB2aWV3IGludG8gdGhpcyBjb250YWluZXIuXG4gICAqICAgICAgICAgICBJZiBub3Qgc3BlY2lmaWVkLCBhcHBlbmRzIHRoZSBuZXcgdmlldyBhcyB0aGUgbGFzdCBlbnRyeS5cbiAgICogICogaW5qZWN0b3I6IEluamVjdG9yIHRvIGJlIHVzZWQgd2l0aGluIHRoZSBlbWJlZGRlZCB2aWV3LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgYFZpZXdSZWZgIGluc3RhbmNlIGZvciB0aGUgbmV3bHkgY3JlYXRlZCB2aWV3LlxuICAgKi9cbiAgYWJzdHJhY3QgY3JlYXRlRW1iZWRkZWRWaWV3PEM+KHRlbXBsYXRlUmVmOiBUZW1wbGF0ZVJlZjxDPiwgY29udGV4dD86IEMsIG9wdGlvbnM/OiB7XG4gICAgaW5kZXg/OiBudW1iZXIsXG4gICAgaW5qZWN0b3I/OiBJbmplY3RvclxuICB9KTogRW1iZWRkZWRWaWV3UmVmPEM+O1xuXG4gIC8qKlxuICAgKiBJbnN0YW50aWF0ZXMgYW4gZW1iZWRkZWQgdmlldyBhbmQgaW5zZXJ0cyBpdFxuICAgKiBpbnRvIHRoaXMgY29udGFpbmVyLlxuICAgKiBAcGFyYW0gdGVtcGxhdGVSZWYgVGhlIEhUTUwgdGVtcGxhdGUgdGhhdCBkZWZpbmVzIHRoZSB2aWV3LlxuICAgKiBAcGFyYW0gY29udGV4dCBUaGUgZGF0YS1iaW5kaW5nIGNvbnRleHQgb2YgdGhlIGVtYmVkZGVkIHZpZXcsIGFzIGRlY2xhcmVkXG4gICAqIGluIHRoZSBgPG5nLXRlbXBsYXRlPmAgdXNhZ2UuXG4gICAqIEBwYXJhbSBpbmRleCBUaGUgMC1iYXNlZCBpbmRleCBhdCB3aGljaCB0byBpbnNlcnQgdGhlIG5ldyB2aWV3IGludG8gdGhpcyBjb250YWluZXIuXG4gICAqIElmIG5vdCBzcGVjaWZpZWQsIGFwcGVuZHMgdGhlIG5ldyB2aWV3IGFzIHRoZSBsYXN0IGVudHJ5LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgYFZpZXdSZWZgIGluc3RhbmNlIGZvciB0aGUgbmV3bHkgY3JlYXRlZCB2aWV3LlxuICAgKi9cbiAgYWJzdHJhY3QgY3JlYXRlRW1iZWRkZWRWaWV3PEM+KHRlbXBsYXRlUmVmOiBUZW1wbGF0ZVJlZjxDPiwgY29udGV4dD86IEMsIGluZGV4PzogbnVtYmVyKTpcbiAgICAgIEVtYmVkZGVkVmlld1JlZjxDPjtcblxuICAvKipcbiAgICogSW5zdGFudGlhdGVzIGEgc2luZ2xlIGNvbXBvbmVudCBhbmQgaW5zZXJ0cyBpdHMgaG9zdCB2aWV3IGludG8gdGhpcyBjb250YWluZXIuXG4gICAqXG4gICAqIEBwYXJhbSBjb21wb25lbnRUeXBlIENvbXBvbmVudCBUeXBlIHRvIHVzZS5cbiAgICogQHBhcmFtIG9wdGlvbnMgQW4gb2JqZWN0IHRoYXQgY29udGFpbnMgZXh0cmEgcGFyYW1ldGVyczpcbiAgICogICogaW5kZXg6IHRoZSBpbmRleCBhdCB3aGljaCB0byBpbnNlcnQgdGhlIG5ldyBjb21wb25lbnQncyBob3N0IHZpZXcgaW50byB0aGlzIGNvbnRhaW5lci5cbiAgICogICAgICAgICAgIElmIG5vdCBzcGVjaWZpZWQsIGFwcGVuZHMgdGhlIG5ldyB2aWV3IGFzIHRoZSBsYXN0IGVudHJ5LlxuICAgKiAgKiBpbmplY3RvcjogdGhlIGluamVjdG9yIHRvIHVzZSBhcyB0aGUgcGFyZW50IGZvciB0aGUgbmV3IGNvbXBvbmVudC5cbiAgICogICogbmdNb2R1bGVSZWY6IGFuIE5nTW9kdWxlUmVmIG9mIHRoZSBjb21wb25lbnQncyBOZ01vZHVsZSwgeW91IHNob3VsZCBhbG1vc3QgYWx3YXlzIHByb3ZpZGVcbiAgICogICAgICAgICAgICAgICAgIHRoaXMgdG8gZW5zdXJlIHRoYXQgYWxsIGV4cGVjdGVkIHByb3ZpZGVycyBhcmUgYXZhaWxhYmxlIGZvciB0aGUgY29tcG9uZW50XG4gICAqICAgICAgICAgICAgICAgICBpbnN0YW50aWF0aW9uLlxuICAgKiAgKiBlbnZpcm9ubWVudEluamVjdG9yOiBhbiBFbnZpcm9ubWVudEluamVjdG9yIHdoaWNoIHdpbGwgcHJvdmlkZSB0aGUgY29tcG9uZW50J3MgZW52aXJvbm1lbnQuXG4gICAqICAgICAgICAgICAgICAgICB5b3Ugc2hvdWxkIGFsbW9zdCBhbHdheXMgcHJvdmlkZSB0aGlzIHRvIGVuc3VyZSB0aGF0IGFsbCBleHBlY3RlZCBwcm92aWRlcnNcbiAgICogICAgICAgICAgICAgICAgIGFyZSBhdmFpbGFibGUgZm9yIHRoZSBjb21wb25lbnQgaW5zdGFudGlhdGlvbi4gVGhpcyBvcHRpb24gaXMgaW50ZW5kZWQgdG9cbiAgICogICAgICAgICAgICAgICAgIHJlcGxhY2UgdGhlIGBuZ01vZHVsZVJlZmAgcGFyYW1ldGVyLlxuICAgKiAgKiBwcm9qZWN0YWJsZU5vZGVzOiBsaXN0IG9mIERPTSBub2RlcyB0aGF0IHNob3VsZCBiZSBwcm9qZWN0ZWQgdGhyb3VnaFxuICAgKiAgICAgICAgICAgICAgICAgICAgICBbYDxuZy1jb250ZW50PmBdKGFwaS9jb3JlL25nLWNvbnRlbnQpIG9mIHRoZSBuZXcgY29tcG9uZW50IGluc3RhbmNlLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbmV3IGBDb21wb25lbnRSZWZgIHdoaWNoIGNvbnRhaW5zIHRoZSBjb21wb25lbnQgaW5zdGFuY2UgYW5kIHRoZSBob3N0IHZpZXcuXG4gICAqL1xuICBhYnN0cmFjdCBjcmVhdGVDb21wb25lbnQ8Qz4oY29tcG9uZW50VHlwZTogVHlwZTxDPiwgb3B0aW9ucz86IHtcbiAgICBpbmRleD86IG51bWJlcixcbiAgICBpbmplY3Rvcj86IEluamVjdG9yLFxuICAgIG5nTW9kdWxlUmVmPzogTmdNb2R1bGVSZWY8dW5rbm93bj4sXG4gICAgZW52aXJvbm1lbnRJbmplY3Rvcj86IEVudmlyb25tZW50SW5qZWN0b3J8TmdNb2R1bGVSZWY8dW5rbm93bj4sXG4gICAgcHJvamVjdGFibGVOb2Rlcz86IE5vZGVbXVtdLFxuICB9KTogQ29tcG9uZW50UmVmPEM+O1xuXG4gIC8qKlxuICAgKiBJbnN0YW50aWF0ZXMgYSBzaW5nbGUgY29tcG9uZW50IGFuZCBpbnNlcnRzIGl0cyBob3N0IHZpZXcgaW50byB0aGlzIGNvbnRhaW5lci5cbiAgICpcbiAgICogQHBhcmFtIGNvbXBvbmVudEZhY3RvcnkgQ29tcG9uZW50IGZhY3RvcnkgdG8gdXNlLlxuICAgKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IGF0IHdoaWNoIHRvIGluc2VydCB0aGUgbmV3IGNvbXBvbmVudCdzIGhvc3QgdmlldyBpbnRvIHRoaXMgY29udGFpbmVyLlxuICAgKiBJZiBub3Qgc3BlY2lmaWVkLCBhcHBlbmRzIHRoZSBuZXcgdmlldyBhcyB0aGUgbGFzdCBlbnRyeS5cbiAgICogQHBhcmFtIGluamVjdG9yIFRoZSBpbmplY3RvciB0byB1c2UgYXMgdGhlIHBhcmVudCBmb3IgdGhlIG5ldyBjb21wb25lbnQuXG4gICAqIEBwYXJhbSBwcm9qZWN0YWJsZU5vZGVzIExpc3Qgb2YgRE9NIG5vZGVzIHRoYXQgc2hvdWxkIGJlIHByb2plY3RlZCB0aHJvdWdoXG4gICAqICAgICBbYDxuZy1jb250ZW50PmBdKGFwaS9jb3JlL25nLWNvbnRlbnQpIG9mIHRoZSBuZXcgY29tcG9uZW50IGluc3RhbmNlLlxuICAgKiBAcGFyYW0gbmdNb2R1bGVSZWYgQW4gaW5zdGFuY2Ugb2YgdGhlIE5nTW9kdWxlUmVmIHRoYXQgcmVwcmVzZW50IGFuIE5nTW9kdWxlLlxuICAgKiBUaGlzIGluZm9ybWF0aW9uIGlzIHVzZWQgdG8gcmV0cmlldmUgY29ycmVzcG9uZGluZyBOZ01vZHVsZSBpbmplY3Rvci5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIG5ldyBgQ29tcG9uZW50UmVmYCB3aGljaCBjb250YWlucyB0aGUgY29tcG9uZW50IGluc3RhbmNlIGFuZCB0aGUgaG9zdCB2aWV3LlxuICAgKlxuICAgKiBAZGVwcmVjYXRlZCBBbmd1bGFyIG5vIGxvbmdlciByZXF1aXJlcyBjb21wb25lbnQgZmFjdG9yaWVzIHRvIGR5bmFtaWNhbGx5IGNyZWF0ZSBjb21wb25lbnRzLlxuICAgKiAgICAgVXNlIGRpZmZlcmVudCBzaWduYXR1cmUgb2YgdGhlIGBjcmVhdGVDb21wb25lbnRgIG1ldGhvZCwgd2hpY2ggYWxsb3dzIHBhc3NpbmdcbiAgICogICAgIENvbXBvbmVudCBjbGFzcyBkaXJlY3RseS5cbiAgICovXG4gIGFic3RyYWN0IGNyZWF0ZUNvbXBvbmVudDxDPihcbiAgICAgIGNvbXBvbmVudEZhY3Rvcnk6IENvbXBvbmVudEZhY3Rvcnk8Qz4sIGluZGV4PzogbnVtYmVyLCBpbmplY3Rvcj86IEluamVjdG9yLFxuICAgICAgcHJvamVjdGFibGVOb2Rlcz86IGFueVtdW10sXG4gICAgICBlbnZpcm9ubWVudEluamVjdG9yPzogRW52aXJvbm1lbnRJbmplY3RvcnxOZ01vZHVsZVJlZjxhbnk+KTogQ29tcG9uZW50UmVmPEM+O1xuXG4gIC8qKlxuICAgKiBJbnNlcnRzIGEgdmlldyBpbnRvIHRoaXMgY29udGFpbmVyLlxuICAgKiBAcGFyYW0gdmlld1JlZiBUaGUgdmlldyB0byBpbnNlcnQuXG4gICAqIEBwYXJhbSBpbmRleCBUaGUgMC1iYXNlZCBpbmRleCBhdCB3aGljaCB0byBpbnNlcnQgdGhlIHZpZXcuXG4gICAqIElmIG5vdCBzcGVjaWZpZWQsIGFwcGVuZHMgdGhlIG5ldyB2aWV3IGFzIHRoZSBsYXN0IGVudHJ5LlxuICAgKiBAcmV0dXJucyBUaGUgaW5zZXJ0ZWQgYFZpZXdSZWZgIGluc3RhbmNlLlxuICAgKlxuICAgKi9cbiAgYWJzdHJhY3QgaW5zZXJ0KHZpZXdSZWY6IFZpZXdSZWYsIGluZGV4PzogbnVtYmVyKTogVmlld1JlZjtcblxuICAvKipcbiAgICogTW92ZXMgYSB2aWV3IHRvIGEgbmV3IGxvY2F0aW9uIGluIHRoaXMgY29udGFpbmVyLlxuICAgKiBAcGFyYW0gdmlld1JlZiBUaGUgdmlldyB0byBtb3ZlLlxuICAgKiBAcGFyYW0gaW5kZXggVGhlIDAtYmFzZWQgaW5kZXggb2YgdGhlIG5ldyBsb2NhdGlvbi5cbiAgICogQHJldHVybnMgVGhlIG1vdmVkIGBWaWV3UmVmYCBpbnN0YW5jZS5cbiAgICovXG4gIGFic3RyYWN0IG1vdmUodmlld1JlZjogVmlld1JlZiwgY3VycmVudEluZGV4OiBudW1iZXIpOiBWaWV3UmVmO1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBpbmRleCBvZiBhIHZpZXcgd2l0aGluIHRoZSBjdXJyZW50IGNvbnRhaW5lci5cbiAgICogQHBhcmFtIHZpZXdSZWYgVGhlIHZpZXcgdG8gcXVlcnkuXG4gICAqIEByZXR1cm5zIFRoZSAwLWJhc2VkIGluZGV4IG9mIHRoZSB2aWV3J3MgcG9zaXRpb24gaW4gdGhpcyBjb250YWluZXIsXG4gICAqIG9yIGAtMWAgaWYgdGhpcyBjb250YWluZXIgZG9lc24ndCBjb250YWluIHRoZSB2aWV3LlxuICAgKi9cbiAgYWJzdHJhY3QgaW5kZXhPZih2aWV3UmVmOiBWaWV3UmVmKTogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBEZXN0cm95cyBhIHZpZXcgYXR0YWNoZWQgdG8gdGhpcyBjb250YWluZXJcbiAgICogQHBhcmFtIGluZGV4IFRoZSAwLWJhc2VkIGluZGV4IG9mIHRoZSB2aWV3IHRvIGRlc3Ryb3kuXG4gICAqIElmIG5vdCBzcGVjaWZpZWQsIHRoZSBsYXN0IHZpZXcgaW4gdGhlIGNvbnRhaW5lciBpcyByZW1vdmVkLlxuICAgKi9cbiAgYWJzdHJhY3QgcmVtb3ZlKGluZGV4PzogbnVtYmVyKTogdm9pZDtcblxuICAvKipcbiAgICogRGV0YWNoZXMgYSB2aWV3IGZyb20gdGhpcyBjb250YWluZXIgd2l0aG91dCBkZXN0cm95aW5nIGl0LlxuICAgKiBVc2UgYWxvbmcgd2l0aCBgaW5zZXJ0KClgIHRvIG1vdmUgYSB2aWV3IHdpdGhpbiB0aGUgY3VycmVudCBjb250YWluZXIuXG4gICAqIEBwYXJhbSBpbmRleCBUaGUgMC1iYXNlZCBpbmRleCBvZiB0aGUgdmlldyB0byBkZXRhY2guXG4gICAqIElmIG5vdCBzcGVjaWZpZWQsIHRoZSBsYXN0IHZpZXcgaW4gdGhlIGNvbnRhaW5lciBpcyBkZXRhY2hlZC5cbiAgICovXG4gIGFic3RyYWN0IGRldGFjaChpbmRleD86IG51bWJlcik6IFZpZXdSZWZ8bnVsbDtcblxuICAvKipcbiAgICogQGludGVybmFsXG4gICAqIEBub2NvbGxhcHNlXG4gICAqL1xuICBzdGF0aWMgX19OR19FTEVNRU5UX0lEX186ICgpID0+IFZpZXdDb250YWluZXJSZWYgPSBpbmplY3RWaWV3Q29udGFpbmVyUmVmO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBWaWV3Q29udGFpbmVyUmVmIGFuZCBzdG9yZXMgaXQgb24gdGhlIGluamVjdG9yLiBPciwgaWYgdGhlIFZpZXdDb250YWluZXJSZWZcbiAqIGFscmVhZHkgZXhpc3RzLCByZXRyaWV2ZXMgdGhlIGV4aXN0aW5nIFZpZXdDb250YWluZXJSZWYuXG4gKlxuICogQHJldHVybnMgVGhlIFZpZXdDb250YWluZXJSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RWaWV3Q29udGFpbmVyUmVmKCk6IFZpZXdDb250YWluZXJSZWYge1xuICBjb25zdCBwcmV2aW91c1ROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkgYXMgVEVsZW1lbnROb2RlIHwgVEVsZW1lbnRDb250YWluZXJOb2RlIHwgVENvbnRhaW5lck5vZGU7XG4gIHJldHVybiBjcmVhdGVDb250YWluZXJSZWYocHJldmlvdXNUTm9kZSwgZ2V0TFZpZXcoKSk7XG59XG5cbmNvbnN0IFZFX1ZpZXdDb250YWluZXJSZWYgPSBWaWV3Q29udGFpbmVyUmVmO1xuXG4vLyBUT0RPKGFseGh1Yik6IGNsZWFuaW5nIHVwIHRoaXMgaW5kaXJlY3Rpb24gdHJpZ2dlcnMgYSBzdWJ0bGUgYnVnIGluIENsb3N1cmUgaW4gZzMuIE9uY2UgdGhlIGZpeFxuLy8gZm9yIHRoYXQgbGFuZHMsIHRoaXMgY2FuIGJlIGNsZWFuZWQgdXAuXG5jb25zdCBSM1ZpZXdDb250YWluZXJSZWYgPSBjbGFzcyBWaWV3Q29udGFpbmVyUmVmIGV4dGVuZHMgVkVfVmlld0NvbnRhaW5lclJlZiB7XG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSBfbENvbnRhaW5lcjogTENvbnRhaW5lcixcbiAgICAgIHByaXZhdGUgX2hvc3RUTm9kZTogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZSxcbiAgICAgIHByaXZhdGUgX2hvc3RMVmlldzogTFZpZXcpIHtcbiAgICBzdXBlcigpO1xuICB9XG5cbiAgb3ZlcnJpZGUgZ2V0IGVsZW1lbnQoKTogRWxlbWVudFJlZiB7XG4gICAgcmV0dXJuIGNyZWF0ZUVsZW1lbnRSZWYodGhpcy5faG9zdFROb2RlLCB0aGlzLl9ob3N0TFZpZXcpO1xuICB9XG5cbiAgb3ZlcnJpZGUgZ2V0IGluamVjdG9yKCk6IEluamVjdG9yIHtcbiAgICByZXR1cm4gbmV3IE5vZGVJbmplY3Rvcih0aGlzLl9ob3N0VE5vZGUsIHRoaXMuX2hvc3RMVmlldyk7XG4gIH1cblxuICAvKiogQGRlcHJlY2F0ZWQgTm8gcmVwbGFjZW1lbnQgKi9cbiAgb3ZlcnJpZGUgZ2V0IHBhcmVudEluamVjdG9yKCk6IEluamVjdG9yIHtcbiAgICBjb25zdCBwYXJlbnRMb2NhdGlvbiA9IGdldFBhcmVudEluamVjdG9yTG9jYXRpb24odGhpcy5faG9zdFROb2RlLCB0aGlzLl9ob3N0TFZpZXcpO1xuICAgIGlmIChoYXNQYXJlbnRJbmplY3RvcihwYXJlbnRMb2NhdGlvbikpIHtcbiAgICAgIGNvbnN0IHBhcmVudFZpZXcgPSBnZXRQYXJlbnRJbmplY3RvclZpZXcocGFyZW50TG9jYXRpb24sIHRoaXMuX2hvc3RMVmlldyk7XG4gICAgICBjb25zdCBpbmplY3RvckluZGV4ID0gZ2V0UGFyZW50SW5qZWN0b3JJbmRleChwYXJlbnRMb2NhdGlvbik7XG4gICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZUluamVjdG9yKHBhcmVudFZpZXcsIGluamVjdG9ySW5kZXgpO1xuICAgICAgY29uc3QgcGFyZW50VE5vZGUgPVxuICAgICAgICAgIHBhcmVudFZpZXdbVFZJRVddLmRhdGFbaW5qZWN0b3JJbmRleCArIE5vZGVJbmplY3Rvck9mZnNldC5UTk9ERV0gYXMgVEVsZW1lbnROb2RlO1xuICAgICAgcmV0dXJuIG5ldyBOb2RlSW5qZWN0b3IocGFyZW50VE5vZGUsIHBhcmVudFZpZXcpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbmV3IE5vZGVJbmplY3RvcihudWxsLCB0aGlzLl9ob3N0TFZpZXcpO1xuICAgIH1cbiAgfVxuXG4gIG92ZXJyaWRlIGNsZWFyKCk6IHZvaWQge1xuICAgIHdoaWxlICh0aGlzLmxlbmd0aCA+IDApIHtcbiAgICAgIHRoaXMucmVtb3ZlKHRoaXMubGVuZ3RoIC0gMSk7XG4gICAgfVxuICB9XG5cbiAgb3ZlcnJpZGUgZ2V0KGluZGV4OiBudW1iZXIpOiBWaWV3UmVmfG51bGwge1xuICAgIGNvbnN0IHZpZXdSZWZzID0gZ2V0Vmlld1JlZnModGhpcy5fbENvbnRhaW5lcik7XG4gICAgcmV0dXJuIHZpZXdSZWZzICE9PSBudWxsICYmIHZpZXdSZWZzW2luZGV4XSB8fCBudWxsO1xuICB9XG5cbiAgb3ZlcnJpZGUgZ2V0IGxlbmd0aCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl9sQ29udGFpbmVyLmxlbmd0aCAtIENPTlRBSU5FUl9IRUFERVJfT0ZGU0VUO1xuICB9XG5cbiAgb3ZlcnJpZGUgY3JlYXRlRW1iZWRkZWRWaWV3PEM+KHRlbXBsYXRlUmVmOiBUZW1wbGF0ZVJlZjxDPiwgY29udGV4dD86IEMsIG9wdGlvbnM/OiB7XG4gICAgaW5kZXg/OiBudW1iZXIsXG4gICAgaW5qZWN0b3I/OiBJbmplY3RvclxuICB9KTogRW1iZWRkZWRWaWV3UmVmPEM+O1xuICBvdmVycmlkZSBjcmVhdGVFbWJlZGRlZFZpZXc8Qz4odGVtcGxhdGVSZWY6IFRlbXBsYXRlUmVmPEM+LCBjb250ZXh0PzogQywgaW5kZXg/OiBudW1iZXIpOlxuICAgICAgRW1iZWRkZWRWaWV3UmVmPEM+O1xuICBvdmVycmlkZSBjcmVhdGVFbWJlZGRlZFZpZXc8Qz4odGVtcGxhdGVSZWY6IFRlbXBsYXRlUmVmPEM+LCBjb250ZXh0PzogQywgaW5kZXhPck9wdGlvbnM/OiBudW1iZXJ8e1xuICAgIGluZGV4PzogbnVtYmVyLFxuICAgIGluamVjdG9yPzogSW5qZWN0b3JcbiAgfSk6IEVtYmVkZGVkVmlld1JlZjxDPiB7XG4gICAgbGV0IGluZGV4OiBudW1iZXJ8dW5kZWZpbmVkO1xuICAgIGxldCBpbmplY3RvcjogSW5qZWN0b3J8dW5kZWZpbmVkO1xuXG4gICAgaWYgKHR5cGVvZiBpbmRleE9yT3B0aW9ucyA9PT0gJ251bWJlcicpIHtcbiAgICAgIGluZGV4ID0gaW5kZXhPck9wdGlvbnM7XG4gICAgfSBlbHNlIGlmIChpbmRleE9yT3B0aW9ucyAhPSBudWxsKSB7XG4gICAgICBpbmRleCA9IGluZGV4T3JPcHRpb25zLmluZGV4O1xuICAgICAgaW5qZWN0b3IgPSBpbmRleE9yT3B0aW9ucy5pbmplY3RvcjtcbiAgICB9XG5cbiAgICBjb25zdCBkZWh5ZHJhdGVkVmlldyA9IGZpbmRNYXRjaGluZ0RlaHlkcmF0ZWRWaWV3KHRoaXMuX2xDb250YWluZXIsIHRlbXBsYXRlUmVmLnNzcklkKTtcbiAgICBjb25zdCB2aWV3UmVmID1cbiAgICAgICAgdGVtcGxhdGVSZWYuY3JlYXRlRW1iZWRkZWRWaWV3SW1wbChjb250ZXh0IHx8IDxhbnk+e30sIGluamVjdG9yLCBkZWh5ZHJhdGVkVmlldyk7XG4gICAgdGhpcy5pbnNlcnRJbXBsKHZpZXdSZWYsIGluZGV4LCBzaG91bGRBZGRWaWV3VG9Eb20odGhpcy5faG9zdFROb2RlLCBkZWh5ZHJhdGVkVmlldykpO1xuICAgIHJldHVybiB2aWV3UmVmO1xuICB9XG5cbiAgb3ZlcnJpZGUgY3JlYXRlQ29tcG9uZW50PEM+KGNvbXBvbmVudFR5cGU6IFR5cGU8Qz4sIG9wdGlvbnM/OiB7XG4gICAgaW5kZXg/OiBudW1iZXIsXG4gICAgaW5qZWN0b3I/OiBJbmplY3RvcixcbiAgICBwcm9qZWN0YWJsZU5vZGVzPzogTm9kZVtdW10sXG4gICAgbmdNb2R1bGVSZWY/OiBOZ01vZHVsZVJlZjx1bmtub3duPixcbiAgfSk6IENvbXBvbmVudFJlZjxDPjtcbiAgLyoqXG4gICAqIEBkZXByZWNhdGVkIEFuZ3VsYXIgbm8gbG9uZ2VyIHJlcXVpcmVzIGNvbXBvbmVudCBmYWN0b3JpZXMgdG8gZHluYW1pY2FsbHkgY3JlYXRlIGNvbXBvbmVudHMuXG4gICAqICAgICBVc2UgZGlmZmVyZW50IHNpZ25hdHVyZSBvZiB0aGUgYGNyZWF0ZUNvbXBvbmVudGAgbWV0aG9kLCB3aGljaCBhbGxvd3MgcGFzc2luZ1xuICAgKiAgICAgQ29tcG9uZW50IGNsYXNzIGRpcmVjdGx5LlxuICAgKi9cbiAgb3ZlcnJpZGUgY3JlYXRlQ29tcG9uZW50PEM+KFxuICAgICAgY29tcG9uZW50RmFjdG9yeTogQ29tcG9uZW50RmFjdG9yeTxDPiwgaW5kZXg/OiBudW1iZXJ8dW5kZWZpbmVkLFxuICAgICAgaW5qZWN0b3I/OiBJbmplY3Rvcnx1bmRlZmluZWQsIHByb2plY3RhYmxlTm9kZXM/OiBhbnlbXVtdfHVuZGVmaW5lZCxcbiAgICAgIGVudmlyb25tZW50SW5qZWN0b3I/OiBFbnZpcm9ubWVudEluamVjdG9yfE5nTW9kdWxlUmVmPGFueT58dW5kZWZpbmVkKTogQ29tcG9uZW50UmVmPEM+O1xuICBvdmVycmlkZSBjcmVhdGVDb21wb25lbnQ8Qz4oXG4gICAgICBjb21wb25lbnRGYWN0b3J5T3JUeXBlOiBDb21wb25lbnRGYWN0b3J5PEM+fFR5cGU8Qz4sIGluZGV4T3JPcHRpb25zPzogbnVtYmVyfHVuZGVmaW5lZHx7XG4gICAgICAgIGluZGV4PzogbnVtYmVyLFxuICAgICAgICBpbmplY3Rvcj86IEluamVjdG9yLFxuICAgICAgICBuZ01vZHVsZVJlZj86IE5nTW9kdWxlUmVmPHVua25vd24+LFxuICAgICAgICBlbnZpcm9ubWVudEluamVjdG9yPzogRW52aXJvbm1lbnRJbmplY3RvcnxOZ01vZHVsZVJlZjx1bmtub3duPixcbiAgICAgICAgcHJvamVjdGFibGVOb2Rlcz86IE5vZGVbXVtdLFxuICAgICAgfSxcbiAgICAgIGluamVjdG9yPzogSW5qZWN0b3J8dW5kZWZpbmVkLCBwcm9qZWN0YWJsZU5vZGVzPzogYW55W11bXXx1bmRlZmluZWQsXG4gICAgICBlbnZpcm9ubWVudEluamVjdG9yPzogRW52aXJvbm1lbnRJbmplY3RvcnxOZ01vZHVsZVJlZjxhbnk+fHVuZGVmaW5lZCk6IENvbXBvbmVudFJlZjxDPiB7XG4gICAgY29uc3QgaXNDb21wb25lbnRGYWN0b3J5ID0gY29tcG9uZW50RmFjdG9yeU9yVHlwZSAmJiAhaXNUeXBlKGNvbXBvbmVudEZhY3RvcnlPclR5cGUpO1xuICAgIGxldCBpbmRleDogbnVtYmVyfHVuZGVmaW5lZDtcblxuICAgIC8vIFRoaXMgZnVuY3Rpb24gc3VwcG9ydHMgMiBzaWduYXR1cmVzIGFuZCB3ZSBuZWVkIHRvIGhhbmRsZSBvcHRpb25zIGNvcnJlY3RseSBmb3IgYm90aDpcbiAgICAvLyAgIDEuIFdoZW4gZmlyc3QgYXJndW1lbnQgaXMgYSBDb21wb25lbnQgdHlwZS4gVGhpcyBzaWduYXR1cmUgYWxzbyByZXF1aXJlcyBleHRyYVxuICAgIC8vICAgICAgb3B0aW9ucyB0byBiZSBwcm92aWRlZCBhcyBvYmplY3QgKG1vcmUgZXJnb25vbWljIG9wdGlvbikuXG4gICAgLy8gICAyLiBGaXJzdCBhcmd1bWVudCBpcyBhIENvbXBvbmVudCBmYWN0b3J5LiBJbiB0aGlzIGNhc2UgZXh0cmEgb3B0aW9ucyBhcmUgcmVwcmVzZW50ZWQgYXNcbiAgICAvLyAgICAgIHBvc2l0aW9uYWwgYXJndW1lbnRzLiBUaGlzIHNpZ25hdHVyZSBpcyBsZXNzIGVyZ29ub21pYyBhbmQgd2lsbCBiZSBkZXByZWNhdGVkLlxuICAgIGlmIChpc0NvbXBvbmVudEZhY3RvcnkpIHtcbiAgICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgICAgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICB0eXBlb2YgaW5kZXhPck9wdGlvbnMgIT09ICdvYmplY3QnLCB0cnVlLFxuICAgICAgICAgICAgJ0l0IGxvb2tzIGxpa2UgQ29tcG9uZW50IGZhY3Rvcnkgd2FzIHByb3ZpZGVkIGFzIHRoZSBmaXJzdCBhcmd1bWVudCAnICtcbiAgICAgICAgICAgICAgICAnYW5kIGFuIG9wdGlvbnMgb2JqZWN0IGFzIHRoZSBzZWNvbmQgYXJndW1lbnQuIFRoaXMgY29tYmluYXRpb24gb2YgYXJndW1lbnRzICcgK1xuICAgICAgICAgICAgICAgICdpcyBpbmNvbXBhdGlibGUuIFlvdSBjYW4gZWl0aGVyIGNoYW5nZSB0aGUgZmlyc3QgYXJndW1lbnQgdG8gcHJvdmlkZSBDb21wb25lbnQgJyArXG4gICAgICAgICAgICAgICAgJ3R5cGUgb3IgY2hhbmdlIHRoZSBzZWNvbmQgYXJndW1lbnQgdG8gYmUgYSBudW1iZXIgKHJlcHJlc2VudGluZyBhbiBpbmRleCBhdCAnICtcbiAgICAgICAgICAgICAgICAnd2hpY2ggdG8gaW5zZXJ0IHRoZSBuZXcgY29tcG9uZW50XFwncyBob3N0IHZpZXcgaW50byB0aGlzIGNvbnRhaW5lciknKTtcbiAgICAgIH1cbiAgICAgIGluZGV4ID0gaW5kZXhPck9wdGlvbnMgYXMgbnVtYmVyIHwgdW5kZWZpbmVkO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICAgIGFzc2VydERlZmluZWQoXG4gICAgICAgICAgICBnZXRDb21wb25lbnREZWYoY29tcG9uZW50RmFjdG9yeU9yVHlwZSksXG4gICAgICAgICAgICBgUHJvdmlkZWQgQ29tcG9uZW50IGNsYXNzIGRvZXNuJ3QgY29udGFpbiBDb21wb25lbnQgZGVmaW5pdGlvbi4gYCArXG4gICAgICAgICAgICAgICAgYFBsZWFzZSBjaGVjayB3aGV0aGVyIHByb3ZpZGVkIGNsYXNzIGhhcyBAQ29tcG9uZW50IGRlY29yYXRvci5gKTtcbiAgICAgICAgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICB0eXBlb2YgaW5kZXhPck9wdGlvbnMgIT09ICdudW1iZXInLCB0cnVlLFxuICAgICAgICAgICAgJ0l0IGxvb2tzIGxpa2UgQ29tcG9uZW50IHR5cGUgd2FzIHByb3ZpZGVkIGFzIHRoZSBmaXJzdCBhcmd1bWVudCAnICtcbiAgICAgICAgICAgICAgICAnYW5kIGEgbnVtYmVyIChyZXByZXNlbnRpbmcgYW4gaW5kZXggYXQgd2hpY2ggdG8gaW5zZXJ0IHRoZSBuZXcgY29tcG9uZW50XFwncyAnICtcbiAgICAgICAgICAgICAgICAnaG9zdCB2aWV3IGludG8gdGhpcyBjb250YWluZXIgYXMgdGhlIHNlY29uZCBhcmd1bWVudC4gVGhpcyBjb21iaW5hdGlvbiBvZiBhcmd1bWVudHMgJyArXG4gICAgICAgICAgICAgICAgJ2lzIGluY29tcGF0aWJsZS4gUGxlYXNlIHVzZSBhbiBvYmplY3QgYXMgdGhlIHNlY29uZCBhcmd1bWVudCBpbnN0ZWFkLicpO1xuICAgICAgfVxuICAgICAgY29uc3Qgb3B0aW9ucyA9IChpbmRleE9yT3B0aW9ucyB8fCB7fSkgYXMge1xuICAgICAgICBpbmRleD86IG51bWJlcixcbiAgICAgICAgaW5qZWN0b3I/OiBJbmplY3RvcixcbiAgICAgICAgbmdNb2R1bGVSZWY/OiBOZ01vZHVsZVJlZjx1bmtub3duPixcbiAgICAgICAgZW52aXJvbm1lbnRJbmplY3Rvcj86IEVudmlyb25tZW50SW5qZWN0b3IgfCBOZ01vZHVsZVJlZjx1bmtub3duPixcbiAgICAgICAgcHJvamVjdGFibGVOb2Rlcz86IE5vZGVbXVtdLFxuICAgICAgfTtcbiAgICAgIGlmIChuZ0Rldk1vZGUgJiYgb3B0aW9ucy5lbnZpcm9ubWVudEluamVjdG9yICYmIG9wdGlvbnMubmdNb2R1bGVSZWYpIHtcbiAgICAgICAgdGhyb3dFcnJvcihcbiAgICAgICAgICAgIGBDYW5ub3QgcGFzcyBib3RoIGVudmlyb25tZW50SW5qZWN0b3IgYW5kIG5nTW9kdWxlUmVmIG9wdGlvbnMgdG8gY3JlYXRlQ29tcG9uZW50KCkuYCk7XG4gICAgICB9XG4gICAgICBpbmRleCA9IG9wdGlvbnMuaW5kZXg7XG4gICAgICBpbmplY3RvciA9IG9wdGlvbnMuaW5qZWN0b3I7XG4gICAgICBwcm9qZWN0YWJsZU5vZGVzID0gb3B0aW9ucy5wcm9qZWN0YWJsZU5vZGVzO1xuICAgICAgZW52aXJvbm1lbnRJbmplY3RvciA9IG9wdGlvbnMuZW52aXJvbm1lbnRJbmplY3RvciB8fCBvcHRpb25zLm5nTW9kdWxlUmVmO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbXBvbmVudEZhY3Rvcnk6IENvbXBvbmVudEZhY3Rvcnk8Qz4gPSBpc0NvbXBvbmVudEZhY3RvcnkgP1xuICAgICAgICBjb21wb25lbnRGYWN0b3J5T3JUeXBlIGFzIENvbXBvbmVudEZhY3Rvcnk8Qz46XG4gICAgICAgIG5ldyBSM0NvbXBvbmVudEZhY3RvcnkoZ2V0Q29tcG9uZW50RGVmKGNvbXBvbmVudEZhY3RvcnlPclR5cGUpISk7XG4gICAgY29uc3QgY29udGV4dEluamVjdG9yID0gaW5qZWN0b3IgfHwgdGhpcy5wYXJlbnRJbmplY3RvcjtcblxuICAgIC8vIElmIGFuIGBOZ01vZHVsZVJlZmAgaXMgbm90IHByb3ZpZGVkIGV4cGxpY2l0bHksIHRyeSByZXRyaWV2aW5nIGl0IGZyb20gdGhlIERJIHRyZWUuXG4gICAgaWYgKCFlbnZpcm9ubWVudEluamVjdG9yICYmIChjb21wb25lbnRGYWN0b3J5IGFzIGFueSkubmdNb2R1bGUgPT0gbnVsbCkge1xuICAgICAgLy8gRm9yIHRoZSBgQ29tcG9uZW50RmFjdG9yeWAgY2FzZSwgZW50ZXJpbmcgdGhpcyBsb2dpYyBpcyB2ZXJ5IHVubGlrZWx5LCBzaW5jZSB3ZSBleHBlY3QgdGhhdFxuICAgICAgLy8gYW4gaW5zdGFuY2Ugb2YgYSBgQ29tcG9uZW50RmFjdG9yeWAsIHJlc29sdmVkIHZpYSBgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyYCB3b3VsZCBoYXZlIGFuXG4gICAgICAvLyBgbmdNb2R1bGVgIGZpZWxkLiBUaGlzIGlzIHBvc3NpYmxlIGluIHNvbWUgdGVzdCBzY2VuYXJpb3MgYW5kIHBvdGVudGlhbGx5IGluIHNvbWUgSklULWJhc2VkXG4gICAgICAvLyB1c2UtY2FzZXMuIEZvciB0aGUgYENvbXBvbmVudEZhY3RvcnlgIGNhc2Ugd2UgcHJlc2VydmUgYmFja3dhcmRzLWNvbXBhdGliaWxpdHkgYW5kIHRyeVxuICAgICAgLy8gdXNpbmcgYSBwcm92aWRlZCBpbmplY3RvciBmaXJzdCwgdGhlbiBmYWxsIGJhY2sgdG8gdGhlIHBhcmVudCBpbmplY3RvciBvZiB0aGlzXG4gICAgICAvLyBgVmlld0NvbnRhaW5lclJlZmAgaW5zdGFuY2UuXG4gICAgICAvL1xuICAgICAgLy8gRm9yIHRoZSBmYWN0b3J5LWxlc3MgY2FzZSwgaXQncyBjcml0aWNhbCB0byBlc3RhYmxpc2ggYSBjb25uZWN0aW9uIHdpdGggdGhlIG1vZHVsZVxuICAgICAgLy8gaW5qZWN0b3IgdHJlZSAoYnkgcmV0cmlldmluZyBhbiBpbnN0YW5jZSBvZiBhbiBgTmdNb2R1bGVSZWZgIGFuZCBhY2Nlc3NpbmcgaXRzIGluamVjdG9yKSxcbiAgICAgIC8vIHNvIHRoYXQgYSBjb21wb25lbnQgY2FuIHVzZSBESSB0b2tlbnMgcHJvdmlkZWQgaW4gTWdNb2R1bGVzLiBGb3IgdGhpcyByZWFzb24sIHdlIGNhbiBub3RcbiAgICAgIC8vIHJlbHkgb24gdGhlIHByb3ZpZGVkIGluamVjdG9yLCBzaW5jZSBpdCBtaWdodCBiZSBkZXRhY2hlZCBmcm9tIHRoZSBESSB0cmVlIChmb3IgZXhhbXBsZSwgaWZcbiAgICAgIC8vIGl0IHdhcyBjcmVhdGVkIHZpYSBgSW5qZWN0b3IuY3JlYXRlYCB3aXRob3V0IHNwZWNpZnlpbmcgYSBwYXJlbnQgaW5qZWN0b3IsIG9yIGlmIGFuXG4gICAgICAvLyBpbmplY3RvciBpcyByZXRyaWV2ZWQgZnJvbSBhbiBgTmdNb2R1bGVSZWZgIGNyZWF0ZWQgdmlhIGBjcmVhdGVOZ01vZHVsZWAgdXNpbmcgYW5cbiAgICAgIC8vIE5nTW9kdWxlIG91dHNpZGUgb2YgYSBtb2R1bGUgdHJlZSkuIEluc3RlYWQsIHdlIGFsd2F5cyB1c2UgYFZpZXdDb250YWluZXJSZWZgJ3MgcGFyZW50XG4gICAgICAvLyBpbmplY3Rvciwgd2hpY2ggaXMgbm9ybWFsbHkgY29ubmVjdGVkIHRvIHRoZSBESSB0cmVlLCB3aGljaCBpbmNsdWRlcyBtb2R1bGUgaW5qZWN0b3JcbiAgICAgIC8vIHN1YnRyZWUuXG4gICAgICBjb25zdCBfaW5qZWN0b3IgPSBpc0NvbXBvbmVudEZhY3RvcnkgPyBjb250ZXh0SW5qZWN0b3IgOiB0aGlzLnBhcmVudEluamVjdG9yO1xuXG4gICAgICAvLyBETyBOT1QgUkVGQUNUT1IuIFRoZSBjb2RlIGhlcmUgdXNlZCB0byBoYXZlIGEgYGluamVjdG9yLmdldChOZ01vZHVsZVJlZiwgbnVsbCkgfHxcbiAgICAgIC8vIHVuZGVmaW5lZGAgZXhwcmVzc2lvbiB3aGljaCBzZWVtcyB0byBjYXVzZSBpbnRlcm5hbCBnb29nbGUgYXBwcyB0byBmYWlsLiBUaGlzIGlzIGRvY3VtZW50ZWRcbiAgICAgIC8vIGluIHRoZSBmb2xsb3dpbmcgaW50ZXJuYWwgYnVnIGlzc3VlOiBnby9iLzE0Mjk2NzgwMlxuICAgICAgY29uc3QgcmVzdWx0ID0gX2luamVjdG9yLmdldChFbnZpcm9ubWVudEluamVjdG9yLCBudWxsKTtcbiAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgZW52aXJvbm1lbnRJbmplY3RvciA9IHJlc3VsdDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBjb21wb25lbnREZWYgPSBnZXRDb21wb25lbnREZWYoY29tcG9uZW50RmFjdG9yeS5jb21wb25lbnRUeXBlID8/IHt9KTtcbiAgICBjb25zdCBkZWh5ZHJhdGVkVmlldyA9IGZpbmRNYXRjaGluZ0RlaHlkcmF0ZWRWaWV3KHRoaXMuX2xDb250YWluZXIsIGNvbXBvbmVudERlZj8uaWQgPz8gbnVsbCk7XG4gICAgY29uc3Qgck5vZGUgPSBkZWh5ZHJhdGVkVmlldz8uZmlyc3RDaGlsZCA/PyBudWxsO1xuICAgIGNvbnN0IGNvbXBvbmVudFJlZiA9XG4gICAgICAgIGNvbXBvbmVudEZhY3RvcnkuY3JlYXRlKGNvbnRleHRJbmplY3RvciwgcHJvamVjdGFibGVOb2Rlcywgck5vZGUsIGVudmlyb25tZW50SW5qZWN0b3IpO1xuICAgIHRoaXMuaW5zZXJ0SW1wbChcbiAgICAgICAgY29tcG9uZW50UmVmLmhvc3RWaWV3LCBpbmRleCwgc2hvdWxkQWRkVmlld1RvRG9tKHRoaXMuX2hvc3RUTm9kZSwgZGVoeWRyYXRlZFZpZXcpKTtcbiAgICByZXR1cm4gY29tcG9uZW50UmVmO1xuICB9XG5cbiAgb3ZlcnJpZGUgaW5zZXJ0KHZpZXdSZWY6IFZpZXdSZWYsIGluZGV4PzogbnVtYmVyKTogVmlld1JlZiB7XG4gICAgcmV0dXJuIHRoaXMuaW5zZXJ0SW1wbCh2aWV3UmVmLCBpbmRleCwgdHJ1ZSk7XG4gIH1cblxuICBwcml2YXRlIGluc2VydEltcGwodmlld1JlZjogVmlld1JlZiwgaW5kZXg/OiBudW1iZXIsIGFkZFRvRE9NPzogYm9vbGVhbik6IFZpZXdSZWYge1xuICAgIGNvbnN0IGxWaWV3ID0gKHZpZXdSZWYgYXMgUjNWaWV3UmVmPGFueT4pLl9sVmlldyE7XG5cbiAgICBpZiAobmdEZXZNb2RlICYmIHZpZXdSZWYuZGVzdHJveWVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBpbnNlcnQgYSBkZXN0cm95ZWQgVmlldyBpbiBhIFZpZXdDb250YWluZXIhJyk7XG4gICAgfVxuXG4gICAgaWYgKHZpZXdBdHRhY2hlZFRvQ29udGFpbmVyKGxWaWV3KSkge1xuICAgICAgLy8gSWYgdmlldyBpcyBhbHJlYWR5IGF0dGFjaGVkLCBkZXRhY2ggaXQgZmlyc3Qgc28gd2UgY2xlYW4gdXAgcmVmZXJlbmNlcyBhcHByb3ByaWF0ZWx5LlxuXG4gICAgICBjb25zdCBwcmV2SWR4ID0gdGhpcy5pbmRleE9mKHZpZXdSZWYpO1xuXG4gICAgICAvLyBBIHZpZXcgbWlnaHQgYmUgYXR0YWNoZWQgZWl0aGVyIHRvIHRoaXMgb3IgYSBkaWZmZXJlbnQgY29udGFpbmVyLiBUaGUgYHByZXZJZHhgIGZvclxuICAgICAgLy8gdGhvc2UgY2FzZXMgd2lsbCBiZTpcbiAgICAgIC8vIGVxdWFsIHRvIC0xIGZvciB2aWV3cyBhdHRhY2hlZCB0byB0aGlzIFZpZXdDb250YWluZXJSZWZcbiAgICAgIC8vID49IDAgZm9yIHZpZXdzIGF0dGFjaGVkIHRvIGEgZGlmZmVyZW50IFZpZXdDb250YWluZXJSZWZcbiAgICAgIGlmIChwcmV2SWR4ICE9PSAtMSkge1xuICAgICAgICB0aGlzLmRldGFjaChwcmV2SWR4KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHByZXZMQ29udGFpbmVyID0gbFZpZXdbUEFSRU5UXSBhcyBMQ29udGFpbmVyO1xuICAgICAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgICAgIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICAgIGlzTENvbnRhaW5lcihwcmV2TENvbnRhaW5lciksIHRydWUsXG4gICAgICAgICAgICAgICAgJ0FuIGF0dGFjaGVkIHZpZXcgc2hvdWxkIGhhdmUgaXRzIFBBUkVOVCBwb2ludCB0byBhIGNvbnRhaW5lci4nKTtcblxuXG4gICAgICAgIC8vIFdlIG5lZWQgdG8gcmUtY3JlYXRlIGEgUjNWaWV3Q29udGFpbmVyUmVmIGluc3RhbmNlIHNpbmNlIHRob3NlIGFyZSBub3Qgc3RvcmVkIG9uXG4gICAgICAgIC8vIExWaWV3IChub3IgYW55d2hlcmUgZWxzZSkuXG4gICAgICAgIGNvbnN0IHByZXZWQ1JlZiA9IG5ldyBSM1ZpZXdDb250YWluZXJSZWYoXG4gICAgICAgICAgICBwcmV2TENvbnRhaW5lciwgcHJldkxDb250YWluZXJbVF9IT1NUXSBhcyBURGlyZWN0aXZlSG9zdE5vZGUsIHByZXZMQ29udGFpbmVyW1BBUkVOVF0pO1xuXG4gICAgICAgIHByZXZWQ1JlZi5kZXRhY2gocHJldlZDUmVmLmluZGV4T2Yodmlld1JlZikpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIExvZ2ljYWwgb3BlcmF0aW9uIG9mIGFkZGluZyBgTFZpZXdgIHRvIGBMQ29udGFpbmVyYFxuICAgIGNvbnN0IGFkanVzdGVkSWR4ID0gdGhpcy5fYWRqdXN0SW5kZXgoaW5kZXgpO1xuICAgIGNvbnN0IGxDb250YWluZXIgPSB0aGlzLl9sQ29udGFpbmVyO1xuXG4gICAgYWRkTFZpZXdUb0xDb250YWluZXIobENvbnRhaW5lciwgbFZpZXcsIGFkanVzdGVkSWR4LCBhZGRUb0RPTSk7XG5cbiAgICAodmlld1JlZiBhcyBSM1ZpZXdSZWY8YW55PikuYXR0YWNoVG9WaWV3Q29udGFpbmVyUmVmKCk7XG4gICAgYWRkVG9BcnJheShnZXRPckNyZWF0ZVZpZXdSZWZzKGxDb250YWluZXIpLCBhZGp1c3RlZElkeCwgdmlld1JlZik7XG5cbiAgICByZXR1cm4gdmlld1JlZjtcbiAgfVxuXG4gIG92ZXJyaWRlIG1vdmUodmlld1JlZjogVmlld1JlZiwgbmV3SW5kZXg6IG51bWJlcik6IFZpZXdSZWYge1xuICAgIGlmIChuZ0Rldk1vZGUgJiYgdmlld1JlZi5kZXN0cm95ZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IG1vdmUgYSBkZXN0cm95ZWQgVmlldyBpbiBhIFZpZXdDb250YWluZXIhJyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmluc2VydCh2aWV3UmVmLCBuZXdJbmRleCk7XG4gIH1cblxuICBvdmVycmlkZSBpbmRleE9mKHZpZXdSZWY6IFZpZXdSZWYpOiBudW1iZXIge1xuICAgIGNvbnN0IHZpZXdSZWZzQXJyID0gZ2V0Vmlld1JlZnModGhpcy5fbENvbnRhaW5lcik7XG4gICAgcmV0dXJuIHZpZXdSZWZzQXJyICE9PSBudWxsID8gdmlld1JlZnNBcnIuaW5kZXhPZih2aWV3UmVmKSA6IC0xO1xuICB9XG5cbiAgb3ZlcnJpZGUgcmVtb3ZlKGluZGV4PzogbnVtYmVyKTogdm9pZCB7XG4gICAgY29uc3QgYWRqdXN0ZWRJZHggPSB0aGlzLl9hZGp1c3RJbmRleChpbmRleCwgLTEpO1xuICAgIGNvbnN0IGRldGFjaGVkVmlldyA9IGRldGFjaFZpZXcodGhpcy5fbENvbnRhaW5lciwgYWRqdXN0ZWRJZHgpO1xuXG4gICAgaWYgKGRldGFjaGVkVmlldykge1xuICAgICAgLy8gQmVmb3JlIGRlc3Ryb3lpbmcgdGhlIHZpZXcsIHJlbW92ZSBpdCBmcm9tIHRoZSBjb250YWluZXIncyBhcnJheSBvZiBgVmlld1JlZmBzLlxuICAgICAgLy8gVGhpcyBlbnN1cmVzIHRoZSB2aWV3IGNvbnRhaW5lciBsZW5ndGggaXMgdXBkYXRlZCBiZWZvcmUgY2FsbGluZ1xuICAgICAgLy8gYGRlc3Ryb3lMVmlld2AsIHdoaWNoIGNvdWxkIHJlY3Vyc2l2ZWx5IGNhbGwgdmlldyBjb250YWluZXIgbWV0aG9kcyB0aGF0XG4gICAgICAvLyByZWx5IG9uIGFuIGFjY3VyYXRlIGNvbnRhaW5lciBsZW5ndGguXG4gICAgICAvLyAoZS5nLiBhIG1ldGhvZCBvbiB0aGlzIHZpZXcgY29udGFpbmVyIGJlaW5nIGNhbGxlZCBieSBhIGNoaWxkIGRpcmVjdGl2ZSdzIE9uRGVzdHJveVxuICAgICAgLy8gbGlmZWN5Y2xlIGhvb2spXG4gICAgICByZW1vdmVGcm9tQXJyYXkoZ2V0T3JDcmVhdGVWaWV3UmVmcyh0aGlzLl9sQ29udGFpbmVyKSwgYWRqdXN0ZWRJZHgpO1xuICAgICAgZGVzdHJveUxWaWV3KGRldGFjaGVkVmlld1tUVklFV10sIGRldGFjaGVkVmlldyk7XG4gICAgfVxuICB9XG5cbiAgb3ZlcnJpZGUgZGV0YWNoKGluZGV4PzogbnVtYmVyKTogVmlld1JlZnxudWxsIHtcbiAgICBjb25zdCBhZGp1c3RlZElkeCA9IHRoaXMuX2FkanVzdEluZGV4KGluZGV4LCAtMSk7XG4gICAgY29uc3QgdmlldyA9IGRldGFjaFZpZXcodGhpcy5fbENvbnRhaW5lciwgYWRqdXN0ZWRJZHgpO1xuXG4gICAgY29uc3Qgd2FzRGV0YWNoZWQgPVxuICAgICAgICB2aWV3ICYmIHJlbW92ZUZyb21BcnJheShnZXRPckNyZWF0ZVZpZXdSZWZzKHRoaXMuX2xDb250YWluZXIpLCBhZGp1c3RlZElkeCkgIT0gbnVsbDtcbiAgICByZXR1cm4gd2FzRGV0YWNoZWQgPyBuZXcgUjNWaWV3UmVmKHZpZXchKSA6IG51bGw7XG4gIH1cblxuICBwcml2YXRlIF9hZGp1c3RJbmRleChpbmRleD86IG51bWJlciwgc2hpZnQ6IG51bWJlciA9IDApIHtcbiAgICBpZiAoaW5kZXggPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHRoaXMubGVuZ3RoICsgc2hpZnQ7XG4gICAgfVxuICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgIGFzc2VydEdyZWF0ZXJUaGFuKGluZGV4LCAtMSwgYFZpZXdSZWYgaW5kZXggbXVzdCBiZSBwb3NpdGl2ZSwgZ290ICR7aW5kZXh9YCk7XG4gICAgICAvLyArMSBiZWNhdXNlIGl0J3MgbGVnYWwgdG8gaW5zZXJ0IGF0IHRoZSBlbmQuXG4gICAgICBhc3NlcnRMZXNzVGhhbihpbmRleCwgdGhpcy5sZW5ndGggKyAxICsgc2hpZnQsICdpbmRleCcpO1xuICAgIH1cbiAgICByZXR1cm4gaW5kZXg7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIGdldFZpZXdSZWZzKGxDb250YWluZXI6IExDb250YWluZXIpOiBWaWV3UmVmW118bnVsbCB7XG4gIHJldHVybiBsQ29udGFpbmVyW1ZJRVdfUkVGU10gYXMgVmlld1JlZltdO1xufVxuXG5mdW5jdGlvbiBnZXRPckNyZWF0ZVZpZXdSZWZzKGxDb250YWluZXI6IExDb250YWluZXIpOiBWaWV3UmVmW10ge1xuICByZXR1cm4gKGxDb250YWluZXJbVklFV19SRUZTXSB8fCAobENvbnRhaW5lcltWSUVXX1JFRlNdID0gW10pKSBhcyBWaWV3UmVmW107XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIFZpZXdDb250YWluZXJSZWYgYW5kIHN0b3JlcyBpdCBvbiB0aGUgaW5qZWN0b3IuXG4gKlxuICogQHBhcmFtIGhvc3RUTm9kZSBUaGUgbm9kZSB0aGF0IGlzIHJlcXVlc3RpbmcgYSBWaWV3Q29udGFpbmVyUmVmXG4gKiBAcGFyYW0gaG9zdExWaWV3IFRoZSB2aWV3IHRvIHdoaWNoIHRoZSBub2RlIGJlbG9uZ3NcbiAqIEByZXR1cm5zIFRoZSBWaWV3Q29udGFpbmVyUmVmIGluc3RhbmNlIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQ29udGFpbmVyUmVmKFxuICAgIGhvc3RUTm9kZTogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZSxcbiAgICBob3N0TFZpZXc6IExWaWV3KTogVmlld0NvbnRhaW5lclJlZiB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRUTm9kZVR5cGUoaG9zdFROb2RlLCBUTm9kZVR5cGUuQW55Q29udGFpbmVyIHwgVE5vZGVUeXBlLkFueVJOb2RlKTtcblxuICBsZXQgbENvbnRhaW5lcjogTENvbnRhaW5lcjtcbiAgY29uc3Qgc2xvdFZhbHVlID0gaG9zdExWaWV3W2hvc3RUTm9kZS5pbmRleF07XG4gIGlmIChpc0xDb250YWluZXIoc2xvdFZhbHVlKSkge1xuICAgIC8vIElmIHRoZSBob3N0IGlzIGEgY29udGFpbmVyLCB3ZSBkb24ndCBuZWVkIHRvIGNyZWF0ZSBhIG5ldyBMQ29udGFpbmVyXG4gICAgbENvbnRhaW5lciA9IHNsb3RWYWx1ZTtcbiAgfSBlbHNlIHtcbiAgICAvLyBBbiBMQ29udGFpbmVyIGFuY2hvciBjYW4gbm90IGJlIGBudWxsYCwgYnV0IHdlIHNldCBpdCBoZXJlIHRlbXBvcmFyaWx5XG4gICAgLy8gYW5kIHVwZGF0ZSB0byB0aGUgYWN0dWFsIHZhbHVlIGxhdGVyIGluIHRoaXMgZnVuY3Rpb24gKHNlZVxuICAgIC8vIGBfbG9jYXRlT3JDcmVhdGVBbmNob3JOb2RlYCkuXG4gICAgbENvbnRhaW5lciA9IGNyZWF0ZUxDb250YWluZXIoc2xvdFZhbHVlLCBob3N0TFZpZXcsIG51bGwhLCBob3N0VE5vZGUpO1xuICAgIGhvc3RMVmlld1tob3N0VE5vZGUuaW5kZXhdID0gbENvbnRhaW5lcjtcbiAgICBhZGRUb1ZpZXdUcmVlKGhvc3RMVmlldywgbENvbnRhaW5lcik7XG4gIH1cbiAgX2xvY2F0ZU9yQ3JlYXRlQW5jaG9yTm9kZShsQ29udGFpbmVyLCBob3N0TFZpZXcsIGhvc3RUTm9kZSwgc2xvdFZhbHVlKTtcblxuICByZXR1cm4gbmV3IFIzVmlld0NvbnRhaW5lclJlZihsQ29udGFpbmVyLCBob3N0VE5vZGUsIGhvc3RMVmlldyk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbmQgaW5zZXJ0cyBhIGNvbW1lbnQgbm9kZSB0aGF0IGFjdHMgYXMgYW4gYW5jaG9yIGZvciBhIHZpZXcgY29udGFpbmVyLlxuICpcbiAqIElmIHRoZSBob3N0IGlzIGEgcmVndWxhciBlbGVtZW50LCB3ZSBoYXZlIHRvIGluc2VydCBhIGNvbW1lbnQgbm9kZSBtYW51YWxseSB3aGljaCB3aWxsXG4gKiBiZSB1c2VkIGFzIGFuIGFuY2hvciB3aGVuIGluc2VydGluZyBlbGVtZW50cy4gSW4gdGhpcyBzcGVjaWZpYyBjYXNlIHdlIHVzZSBsb3ctbGV2ZWwgRE9NXG4gKiBtYW5pcHVsYXRpb24gdG8gaW5zZXJ0IGl0LlxuICovXG5mdW5jdGlvbiBpbnNlcnRBbmNob3JOb2RlKGhvc3RMVmlldzogTFZpZXcsIGhvc3RUTm9kZTogVE5vZGUpOiBSQ29tbWVudCB7XG4gIGNvbnN0IHJlbmRlcmVyID0gaG9zdExWaWV3W1JFTkRFUkVSXTtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckNyZWF0ZUNvbW1lbnQrKztcbiAgY29uc3QgY29tbWVudE5vZGUgPSByZW5kZXJlci5jcmVhdGVDb21tZW50KG5nRGV2TW9kZSA/ICdjb250YWluZXInIDogJycpO1xuXG4gIGNvbnN0IGhvc3ROYXRpdmUgPSBnZXROYXRpdmVCeVROb2RlKGhvc3RUTm9kZSwgaG9zdExWaWV3KSE7XG4gIGNvbnN0IHBhcmVudE9mSG9zdE5hdGl2ZSA9IG5hdGl2ZVBhcmVudE5vZGUocmVuZGVyZXIsIGhvc3ROYXRpdmUpO1xuICBuYXRpdmVJbnNlcnRCZWZvcmUoXG4gICAgICByZW5kZXJlciwgcGFyZW50T2ZIb3N0TmF0aXZlISwgY29tbWVudE5vZGUsIG5hdGl2ZU5leHRTaWJsaW5nKHJlbmRlcmVyLCBob3N0TmF0aXZlKSwgZmFsc2UpO1xuICByZXR1cm4gY29tbWVudE5vZGU7XG59XG5cbmxldCBfbG9jYXRlT3JDcmVhdGVBbmNob3JOb2RlID0gY3JlYXRlQW5jaG9yTm9kZTtcbmxldCBfcG9wdWxhdGVEZWh5ZHJhdGVkVmlld3NJbkxDb250YWluZXI6IHR5cGVvZiBwb3B1bGF0ZURlaHlkcmF0ZWRWaWV3c0luTENvbnRhaW5lckltcGwgPVxuICAgIChsQ29udGFpbmVyOiBMQ29udGFpbmVyLCB0Tm9kZTogVE5vZGUsIGhvc3RMVmlldzogTFZpZXcpID0+IGZhbHNlOyAgLy8gbm9vcCBieSBkZWZhdWx0XG5cbi8qKlxuICogTG9va3MgdXAgZGVoeWRyYXRlZCB2aWV3cyB0aGF0IGJlbG9uZyB0byBhIGdpdmVuIExDb250YWluZXIgYW5kIHBvcHVsYXRlc1xuICogdGhpcyBpbmZvcm1hdGlvbiBpbnRvIHRoZSBgTENvbnRhaW5lcltERUhZRFJBVEVEX1ZJRVdTXWAgc2xvdC4gV2hlbiBydW5uaW5nXG4gKiBpbiBjbGllbnQtb25seSBtb2RlLCB0aGlzIGZ1bmN0aW9uIGlzIGEgbm9vcC5cbiAqXG4gKiBAcGFyYW0gbENvbnRhaW5lciBMQ29udGFpbmVyIHRoYXQgc2hvdWxkIGJlIHBvcHVsYXRlZC5cbiAqIEBwYXJhbSB0Tm9kZSBDb3JyZXNwb25kaW5nIFROb2RlLlxuICogQHBhcmFtIGhvc3RMVmlldyBMVmlldyB0aGF0IGhvc3RzIExDb250YWluZXIuXG4gKiBAcmV0dXJucyBhIGJvb2xlYW4gZmxhZyB0aGF0IGluZGljYXRlcyB3aGV0aGVyIGEgcG9wdWxhdGluZyBvcGVyYXRpb25cbiAqICAgd2FzIHN1Y2Nlc3NmdWwuIFRoZSBvcGVyYXRpb24gbWlnaHQgYmUgdW5zdWNjZXNzZnVsIGluIGNhc2UgaXMgaGFzIGNvbXBsZXRlZFxuICogICBwcmV2aW91c2x5LCB3ZSBhcmUgcmVuZGVyaW5nIGluIGNsaWVudC1vbmx5IG1vZGUgb3IgdGhpcyBjb250ZW50IGlzIGxvY2F0ZWRcbiAqICAgaW4gYSBza2lwIGh5ZHJhdGlvbiBzZWN0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcG9wdWxhdGVEZWh5ZHJhdGVkVmlld3NJbkxDb250YWluZXIoXG4gICAgbENvbnRhaW5lcjogTENvbnRhaW5lciwgdE5vZGU6IFROb2RlLCBob3N0TFZpZXc6IExWaWV3KTogYm9vbGVhbiB7XG4gIHJldHVybiBfcG9wdWxhdGVEZWh5ZHJhdGVkVmlld3NJbkxDb250YWluZXIobENvbnRhaW5lciwgdE5vZGUsIGhvc3RMVmlldyk7XG59XG5cbi8qKlxuICogUmVndWxhciBjcmVhdGlvbiBtb2RlOiBhbiBhbmNob3IgaXMgY3JlYXRlZCBhbmRcbiAqIGFzc2lnbmVkIHRvIHRoZSBgbENvbnRhaW5lcltOQVRJVkVdYCBzbG90LlxuICovXG5mdW5jdGlvbiBjcmVhdGVBbmNob3JOb2RlKFxuICAgIGxDb250YWluZXI6IExDb250YWluZXIsIGhvc3RMVmlldzogTFZpZXcsIGhvc3RUTm9kZTogVE5vZGUsIHNsb3RWYWx1ZTogYW55KSB7XG4gIC8vIFdlIGFscmVhZHkgaGF2ZSBhIG5hdGl2ZSBlbGVtZW50IChhbmNob3IpIHNldCwgcmV0dXJuLlxuICBpZiAobENvbnRhaW5lcltOQVRJVkVdKSByZXR1cm47XG5cbiAgbGV0IGNvbW1lbnROb2RlOiBSQ29tbWVudDtcbiAgLy8gSWYgdGhlIGhvc3QgaXMgYW4gZWxlbWVudCBjb250YWluZXIsIHRoZSBuYXRpdmUgaG9zdCBlbGVtZW50IGlzIGd1YXJhbnRlZWQgdG8gYmUgYVxuICAvLyBjb21tZW50IGFuZCB3ZSBjYW4gcmV1c2UgdGhhdCBjb21tZW50IGFzIGFuY2hvciBlbGVtZW50IGZvciB0aGUgbmV3IExDb250YWluZXIuXG4gIC8vIFRoZSBjb21tZW50IG5vZGUgaW4gcXVlc3Rpb24gaXMgYWxyZWFkeSBwYXJ0IG9mIHRoZSBET00gc3RydWN0dXJlIHNvIHdlIGRvbid0IG5lZWQgdG8gYXBwZW5kXG4gIC8vIGl0IGFnYWluLlxuICBpZiAoaG9zdFROb2RlLnR5cGUgJiBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcikge1xuICAgIGNvbW1lbnROb2RlID0gdW53cmFwUk5vZGUoc2xvdFZhbHVlKSBhcyBSQ29tbWVudDtcbiAgfSBlbHNlIHtcbiAgICBjb21tZW50Tm9kZSA9IGluc2VydEFuY2hvck5vZGUoaG9zdExWaWV3LCBob3N0VE5vZGUpO1xuICB9XG4gIGxDb250YWluZXJbTkFUSVZFXSA9IGNvbW1lbnROb2RlO1xufVxuXG4vKipcbiAqIEh5ZHJhdGlvbiBsb2dpYyB0aGF0IGxvb2tzIHVwIGFsbCBkZWh5ZHJhdGVkIHZpZXdzIGluIHRoaXMgY29udGFpbmVyXG4gKiBhbmQgcHV0cyB0aGVtIGludG8gYGxDb250YWluZXJbREVIWURSQVRFRF9WSUVXU11gIHNsb3QuXG4gKlxuICogQHJldHVybnMgYSBib29sZWFuIGZsYWcgdGhhdCBpbmRpY2F0ZXMgd2hldGhlciBhIHBvcHVsYXRpbmcgb3BlcmF0aW9uXG4gKiAgIHdhcyBzdWNjZXNzZnVsLiBUaGUgb3BlcmF0aW9uIG1pZ2h0IGJlIHVuc3VjY2Vzc2Z1bCBpbiBjYXNlIGlzIGhhcyBjb21wbGV0ZWRcbiAqICAgcHJldmlvdXNseSwgd2UgYXJlIHJlbmRlcmluZyBpbiBjbGllbnQtb25seSBtb2RlIG9yIHRoaXMgY29udGVudCBpcyBsb2NhdGVkXG4gKiAgIGluIGEgc2tpcCBoeWRyYXRpb24gc2VjdGlvbi5cbiAqL1xuZnVuY3Rpb24gcG9wdWxhdGVEZWh5ZHJhdGVkVmlld3NJbkxDb250YWluZXJJbXBsKFxuICAgIGxDb250YWluZXI6IExDb250YWluZXIsIHROb2RlOiBUTm9kZSwgaG9zdExWaWV3OiBMVmlldyk6IGJvb2xlYW4ge1xuICAvLyBXZSBhbHJlYWR5IGhhdmUgYSBuYXRpdmUgZWxlbWVudCAoYW5jaG9yKSBzZXQgYW5kIHRoZSBwcm9jZXNzXG4gIC8vIG9mIGZpbmRpbmcgZGVoeWRyYXRlZCB2aWV3cyBoYXBwZW5lZCAoc28gdGhlIGBsQ29udGFpbmVyW0RFSFlEUkFURURfVklFV1NdYFxuICAvLyBpcyBub3QgbnVsbCksIGV4aXQgZWFybHkuXG4gIGlmIChsQ29udGFpbmVyW05BVElWRV0gJiYgbENvbnRhaW5lcltERUhZRFJBVEVEX1ZJRVdTXSkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgY29uc3QgaHlkcmF0aW9uSW5mbyA9IGhvc3RMVmlld1tIWURSQVRJT05dO1xuICBjb25zdCBub09mZnNldEluZGV4ID0gdE5vZGUuaW5kZXggLSBIRUFERVJfT0ZGU0VUO1xuICBjb25zdCBpc05vZGVDcmVhdGlvbk1vZGUgPSAhaHlkcmF0aW9uSW5mbyB8fCBpc0luU2tpcEh5ZHJhdGlvbkJsb2NrKHROb2RlKSB8fFxuICAgICAgaXNEaXNjb25uZWN0ZWROb2RlKGh5ZHJhdGlvbkluZm8sIG5vT2Zmc2V0SW5kZXgpO1xuXG4gIC8vIFJlZ3VsYXIgY3JlYXRpb24gbW9kZS5cbiAgaWYgKGlzTm9kZUNyZWF0aW9uTW9kZSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8vIEh5ZHJhdGlvbiBtb2RlLCBsb29raW5nIHVwIGFuIGFuY2hvciBub2RlIGFuZCBkZWh5ZHJhdGVkIHZpZXdzIGluIERPTS5cbiAgY29uc3QgY3VycmVudFJOb2RlOiBSTm9kZXxudWxsID0gZ2V0U2VnbWVudEhlYWQoaHlkcmF0aW9uSW5mbywgbm9PZmZzZXRJbmRleCk7XG5cbiAgY29uc3Qgc2VyaWFsaXplZFZpZXdzID0gaHlkcmF0aW9uSW5mby5kYXRhW0NPTlRBSU5FUlNdPy5bbm9PZmZzZXRJbmRleF07XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RGVmaW5lZChcbiAgICAgICAgICBzZXJpYWxpemVkVmlld3MsXG4gICAgICAgICAgJ1VuZXhwZWN0ZWQgc3RhdGU6IG5vIGh5ZHJhdGlvbiBpbmZvIGF2YWlsYWJsZSBmb3IgYSBnaXZlbiBUTm9kZSwgJyArXG4gICAgICAgICAgICAgICd3aGljaCByZXByZXNlbnRzIGEgdmlldyBjb250YWluZXIuJyk7XG5cbiAgY29uc3QgW2NvbW1lbnROb2RlLCBkZWh5ZHJhdGVkVmlld3NdID1cbiAgICAgIGxvY2F0ZURlaHlkcmF0ZWRWaWV3c0luQ29udGFpbmVyKGN1cnJlbnRSTm9kZSEsIHNlcmlhbGl6ZWRWaWV3cyEpO1xuXG4gIGlmIChuZ0Rldk1vZGUpIHtcbiAgICB2YWxpZGF0ZU1hdGNoaW5nTm9kZShjb21tZW50Tm9kZSwgTm9kZS5DT01NRU5UX05PREUsIG51bGwsIGhvc3RMVmlldywgdE5vZGUsIHRydWUpO1xuICAgIC8vIERvIG5vdCB0aHJvdyBpbiBjYXNlIHRoaXMgbm9kZSBpcyBhbHJlYWR5IGNsYWltZWQgKHRodXMgYGZhbHNlYCBhcyBhIHNlY29uZFxuICAgIC8vIGFyZ3VtZW50KS4gSWYgdGhpcyBjb250YWluZXIgaXMgY3JlYXRlZCBiYXNlZCBvbiBhbiBgPG5nLXRlbXBsYXRlPmAsIHRoZSBjb21tZW50XG4gICAgLy8gbm9kZSB3b3VsZCBiZSBhbHJlYWR5IGNsYWltZWQgZnJvbSB0aGUgYHRlbXBsYXRlYCBpbnN0cnVjdGlvbi4gSWYgYW4gZWxlbWVudCBhY3RzXG4gICAgLy8gYXMgYW4gYW5jaG9yIChlLmcuIDxkaXYgI3ZjUmVmPiksIGEgc2VwYXJhdGUgY29tbWVudCBub2RlIHdvdWxkIGJlIGNyZWF0ZWQvbG9jYXRlZCxcbiAgICAvLyBzbyB3ZSBuZWVkIHRvIGNsYWltIGl0IGhlcmUuXG4gICAgbWFya1JOb2RlQXNDbGFpbWVkQnlIeWRyYXRpb24oY29tbWVudE5vZGUsIGZhbHNlKTtcbiAgfVxuXG4gIGxDb250YWluZXJbTkFUSVZFXSA9IGNvbW1lbnROb2RlIGFzIFJDb21tZW50O1xuICBsQ29udGFpbmVyW0RFSFlEUkFURURfVklFV1NdID0gZGVoeWRyYXRlZFZpZXdzO1xuXG4gIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBsb2NhdGVPckNyZWF0ZUFuY2hvck5vZGUoXG4gICAgbENvbnRhaW5lcjogTENvbnRhaW5lciwgaG9zdExWaWV3OiBMVmlldywgaG9zdFROb2RlOiBUTm9kZSwgc2xvdFZhbHVlOiBhbnkpOiB2b2lkIHtcbiAgaWYgKCFfcG9wdWxhdGVEZWh5ZHJhdGVkVmlld3NJbkxDb250YWluZXIobENvbnRhaW5lciwgaG9zdFROb2RlLCBob3N0TFZpZXcpKSB7XG4gICAgLy8gUG9wdWxhdGluZyBkZWh5ZHJhdGVkIHZpZXdzIG9wZXJhdGlvbiByZXR1cm5lZCBgZmFsc2VgLCB3aGljaCBpbmRpY2F0ZXNcbiAgICAvLyB0aGF0IHRoZSBsb2dpYyB3YXMgcnVubmluZyBpbiBjbGllbnQtb25seSBtb2RlLCB0aGlzIGFuIGFuY2hvciBjb21tZW50XG4gICAgLy8gbm9kZSBzaG91bGQgYmUgY3JlYXRlZCBmb3IgdGhpcyBjb250YWluZXIuXG4gICAgY3JlYXRlQW5jaG9yTm9kZShsQ29udGFpbmVyLCBob3N0TFZpZXcsIGhvc3RUTm9kZSwgc2xvdFZhbHVlKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZW5hYmxlTG9jYXRlT3JDcmVhdGVDb250YWluZXJSZWZJbXBsKCkge1xuICBfbG9jYXRlT3JDcmVhdGVBbmNob3JOb2RlID0gbG9jYXRlT3JDcmVhdGVBbmNob3JOb2RlO1xuICBfcG9wdWxhdGVEZWh5ZHJhdGVkVmlld3NJbkxDb250YWluZXIgPSBwb3B1bGF0ZURlaHlkcmF0ZWRWaWV3c0luTENvbnRhaW5lckltcGw7XG59XG4iXX0=