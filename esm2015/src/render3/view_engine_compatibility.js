/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { NgModuleRef as viewEngine_NgModuleRef } from '../linker/ng_module_factory';
import { addToArray, removeFromArray } from '../util/array_utils';
import { assertDefined, assertEqual, assertGreaterThan, assertLessThan } from '../util/assert';
import { assertLContainer, assertNodeInjector } from './assert';
import { getParentInjectorLocation, NodeInjector } from './di';
import { addToViewTree, createLContainer, createLView, createTNode, renderView } from './instructions/shared';
import { CONTAINER_HEADER_OFFSET, NATIVE, VIEW_REFS } from './interfaces/container';
import { isProceduralRenderer } from './interfaces/renderer';
import { isComponentHost, isLContainer, isLView, isRootView } from './interfaces/type_checks';
import { DECLARATION_COMPONENT_VIEW, DECLARATION_LCONTAINER, PARENT, QUERIES, RENDERER, T_HOST, TVIEW } from './interfaces/view';
import { assertTNodeType } from './node_assert';
import { addViewToContainer, appendChild, destroyLView, detachView, getBeforeNodeForView, insertView, nativeInsertBefore, nativeNextSibling, nativeParentNode } from './node_manipulation';
import { getCurrentTNode, getLView } from './state';
import { getParentInjectorIndex, getParentInjectorView, hasParentInjector } from './util/injector_utils';
import { getComponentLViewByIndex, getNativeByTNode, unwrapRNode, viewAttachedToContainer } from './util/view_utils';
import { ViewRef } from './view_ref';
/**
 * Creates an ElementRef from the most recent node.
 *
 * @returns The ElementRef instance to use
 */
export function injectElementRef(ElementRefToken) {
    return createElementRef(ElementRefToken, getCurrentTNode(), getLView());
}
let R3ElementRef;
/**
 * Creates an ElementRef given a node.
 *
 * @param ElementRefToken The ElementRef type
 * @param tNode The node for which you'd like an ElementRef
 * @param view The view to which the node belongs
 * @returns The ElementRef instance to use
 */
export function createElementRef(ElementRefToken, tNode, view) {
    if (!R3ElementRef) {
        R3ElementRef = class ElementRef extends ElementRefToken {
        };
    }
    return new R3ElementRef(getNativeByTNode(tNode, view));
}
let R3TemplateRef;
/**
 * Creates a TemplateRef given a node.
 *
 * @returns The TemplateRef instance to use
 */
export function injectTemplateRef(TemplateRefToken, ElementRefToken) {
    return createTemplateRef(TemplateRefToken, ElementRefToken, getCurrentTNode(), getLView());
}
/**
 * Creates a TemplateRef and stores it on the injector.
 *
 * @param TemplateRefToken The TemplateRef type
 * @param ElementRefToken The ElementRef type
 * @param hostTNode The node on which a TemplateRef is requested
 * @param hostView The view to which the node belongs
 * @returns The TemplateRef instance or null if we can't create a TemplateRef on a given node type
 */
export function createTemplateRef(TemplateRefToken, ElementRefToken, hostTNode, hostView) {
    if (!R3TemplateRef) {
        R3TemplateRef = class TemplateRef extends TemplateRefToken {
            constructor(_declarationView, _declarationTContainer, elementRef) {
                super();
                this._declarationView = _declarationView;
                this._declarationTContainer = _declarationTContainer;
                this.elementRef = elementRef;
            }
            createEmbeddedView(context) {
                const embeddedTView = this._declarationTContainer.tViews;
                const embeddedLView = createLView(this._declarationView, embeddedTView, context, 16 /* CheckAlways */, null, embeddedTView.declTNode, null, null, null, null);
                const declarationLContainer = this._declarationView[this._declarationTContainer.index];
                ngDevMode && assertLContainer(declarationLContainer);
                embeddedLView[DECLARATION_LCONTAINER] = declarationLContainer;
                const declarationViewLQueries = this._declarationView[QUERIES];
                if (declarationViewLQueries !== null) {
                    embeddedLView[QUERIES] = declarationViewLQueries.createEmbeddedView(embeddedTView);
                }
                renderView(embeddedTView, embeddedLView, context);
                return new ViewRef(embeddedLView);
            }
        };
    }
    if (hostTNode.type & 4 /* Container */) {
        ngDevMode && assertDefined(hostTNode.tViews, 'TView must be allocated');
        return new R3TemplateRef(hostView, hostTNode, createElementRef(ElementRefToken, hostTNode, hostView));
    }
    else {
        return null;
    }
}
let R3ViewContainerRef;
/**
 * Creates a ViewContainerRef and stores it on the injector. Or, if the ViewContainerRef
 * already exists, retrieves the existing ViewContainerRef.
 *
 * @returns The ViewContainerRef instance to use
 */
export function injectViewContainerRef(ViewContainerRefToken, ElementRefToken) {
    const previousTNode = getCurrentTNode();
    return createContainerRef(ViewContainerRefToken, ElementRefToken, previousTNode, getLView());
}
/**
 * Creates a ViewContainerRef and stores it on the injector.
 *
 * @param ViewContainerRefToken The ViewContainerRef type
 * @param ElementRefToken The ElementRef type
 * @param hostTNode The node that is requesting a ViewContainerRef
 * @param hostView The view to which the node belongs
 * @returns The ViewContainerRef instance to use
 */
export function createContainerRef(ViewContainerRefToken, ElementRefToken, hostTNode, hostView) {
    if (!R3ViewContainerRef) {
        R3ViewContainerRef = class ViewContainerRef extends ViewContainerRefToken {
            constructor(_lContainer, _hostTNode, _hostView) {
                super();
                this._lContainer = _lContainer;
                this._hostTNode = _hostTNode;
                this._hostView = _hostView;
            }
            get element() {
                return createElementRef(ElementRefToken, this._hostTNode, this._hostView);
            }
            get injector() {
                return new NodeInjector(this._hostTNode, this._hostView);
            }
            /** @deprecated No replacement */
            get parentInjector() {
                const parentLocation = getParentInjectorLocation(this._hostTNode, this._hostView);
                if (hasParentInjector(parentLocation)) {
                    const parentView = getParentInjectorView(parentLocation, this._hostView);
                    const injectorIndex = getParentInjectorIndex(parentLocation);
                    ngDevMode && assertNodeInjector(parentView, injectorIndex);
                    const parentTNode = parentView[TVIEW].data[injectorIndex + 8 /* TNODE */];
                    return new NodeInjector(parentTNode, parentView);
                }
                else {
                    return new NodeInjector(null, this._hostView);
                }
            }
            clear() {
                while (this.length > 0) {
                    this.remove(this.length - 1);
                }
            }
            get(index) {
                return this._lContainer[VIEW_REFS] !== null && this._lContainer[VIEW_REFS][index] || null;
            }
            get length() {
                return this._lContainer.length - CONTAINER_HEADER_OFFSET;
            }
            createEmbeddedView(templateRef, context, index) {
                const viewRef = templateRef.createEmbeddedView(context || {});
                this.insert(viewRef, index);
                return viewRef;
            }
            createComponent(componentFactory, index, injector, projectableNodes, ngModuleRef) {
                const contextInjector = injector || this.parentInjector;
                if (!ngModuleRef && componentFactory.ngModule == null && contextInjector) {
                    // DO NOT REFACTOR. The code here used to have a `value || undefined` expression
                    // which seems to cause internal google apps to fail. This is documented in the
                    // following internal bug issue: go/b/142967802
                    const result = contextInjector.get(viewEngine_NgModuleRef, null);
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
                if (viewRef.destroyed) {
                    throw new Error('Cannot insert a destroyed View in a ViewContainer!');
                }
                this.allocateContainerIfNeeded();
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
                viewRef.attachToViewContainerRef(this);
                addToArray(lContainer[VIEW_REFS], adjustedIdx, viewRef);
                return viewRef;
            }
            move(viewRef, newIndex) {
                if (viewRef.destroyed) {
                    throw new Error('Cannot move a destroyed View in a ViewContainer!');
                }
                return this.insert(viewRef, newIndex);
            }
            indexOf(viewRef) {
                const viewRefsArr = this._lContainer[VIEW_REFS];
                return viewRefsArr !== null ? viewRefsArr.indexOf(viewRef) : -1;
            }
            remove(index) {
                this.allocateContainerIfNeeded();
                const adjustedIdx = this._adjustIndex(index, -1);
                const detachedView = detachView(this._lContainer, adjustedIdx);
                if (detachedView) {
                    // Before destroying the view, remove it from the container's array of `ViewRef`s.
                    // This ensures the view container length is updated before calling
                    // `destroyLView`, which could recursively call view container methods that
                    // rely on an accurate container length.
                    // (e.g. a method on this view container being called by a child directive's OnDestroy
                    // lifecycle hook)
                    removeFromArray(this._lContainer[VIEW_REFS], adjustedIdx);
                    destroyLView(detachedView[TVIEW], detachedView);
                }
            }
            detach(index) {
                this.allocateContainerIfNeeded();
                const adjustedIdx = this._adjustIndex(index, -1);
                const view = detachView(this._lContainer, adjustedIdx);
                const wasDetached = view && removeFromArray(this._lContainer[VIEW_REFS], adjustedIdx) != null;
                return wasDetached ? new ViewRef(view) : null;
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
            allocateContainerIfNeeded() {
                if (this._lContainer[VIEW_REFS] === null) {
                    this._lContainer[VIEW_REFS] = [];
                }
            }
        };
    }
    ngDevMode && assertTNodeType(hostTNode, 12 /* AnyContainer */ | 3 /* AnyRNode */);
    let lContainer;
    const slotValue = hostView[hostTNode.index];
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
            ngDevMode && ngDevMode.rendererCreateComment++;
            commentNode = hostView[RENDERER].createComment(ngDevMode ? 'container' : '');
            // A `ViewContainerRef` can be injected by the root (topmost / bootstrapped) component. In
            // this case we can't use TView / TNode data structures to insert container's marker node
            // (both a parent of a comment node and the comment node itself are not part of any view). In
            // this specific case we use low-level DOM manipulation to insert container's marker (comment)
            // node.
            if (isRootView(hostView)) {
                const renderer = hostView[RENDERER];
                const hostNative = getNativeByTNode(hostTNode, hostView);
                const parentOfHostNative = nativeParentNode(renderer, hostNative);
                nativeInsertBefore(renderer, parentOfHostNative, commentNode, nativeNextSibling(renderer, hostNative), false);
            }
            else {
                // The TNode created here is bogus, in that it is not added to the TView. It is only created
                // to allow us to create a dynamic Comment node.
                const commentTNode = createTNode(hostView[TVIEW], hostTNode.parent, 4 /* Container */, 0, null, null);
                appendChild(hostView[TVIEW], hostView, commentNode, commentTNode);
            }
        }
        hostView[hostTNode.index] = lContainer =
            createLContainer(slotValue, hostView, commentNode, hostTNode);
        addToViewTree(hostView, lContainer);
    }
    return new R3ViewContainerRef(lContainer, hostTNode, hostView);
}
/** Returns a ChangeDetectorRef (a.k.a. a ViewRef) */
export function injectChangeDetectorRef(isPipe = false) {
    return createViewRef(getCurrentTNode(), getLView(), isPipe);
}
/**
 * Creates a ViewRef and stores it on the injector as ChangeDetectorRef (public alias).
 *
 * @param tNode The node that is requesting a ChangeDetectorRef
 * @param lView The view to which the node belongs
 * @param isPipe Whether the view is being injected into a pipe.
 * @returns The ChangeDetectorRef to use
 */
function createViewRef(tNode, lView, isPipe) {
    // `isComponentView` will be true for Component and Directives (but not for Pipes).
    // See https://github.com/angular/angular/pull/33072 for proper fix
    const isComponentView = !isPipe && isComponentHost(tNode);
    if (isComponentView) {
        // The LView represents the location where the component is declared.
        // Instead we want the LView for the component View and so we need to look it up.
        const componentView = getComponentLViewByIndex(tNode.index, lView); // look down
        return new ViewRef(componentView, componentView);
    }
    else if (tNode.type & (3 /* AnyRNode */ | 12 /* AnyContainer */ | 32 /* Icu */)) {
        // The LView represents the location where the injection is requested from.
        // We need to locate the containing LView (in case where the `lView` is an embedded view)
        const hostComponentView = lView[DECLARATION_COMPONENT_VIEW]; // look up
        return new ViewRef(hostComponentView, lView);
    }
    return null;
}
/** Returns a Renderer2 (or throws when application was bootstrapped with Renderer3) */
function getOrCreateRenderer2(view) {
    const renderer = view[RENDERER];
    if (isProceduralRenderer(renderer)) {
        return renderer;
    }
    else {
        throw new Error('Cannot inject Renderer2 when the application uses Renderer3!');
    }
}
/** Injects a Renderer2 for the current component. */
export function injectRenderer2() {
    // We need the Renderer to be based on the component that it's being injected into, however since
    // DI happens before we've entered its view, `getLView` will return the parent view instead.
    const lView = getLView();
    const tNode = getCurrentTNode();
    const nodeAtIndex = getComponentLViewByIndex(tNode.index, lView);
    return getOrCreateRenderer2(isLView(nodeAtIndex) ? nodeAtIndex : lView);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld19lbmdpbmVfY29tcGF0aWJpbGl0eS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvdmlld19lbmdpbmVfY29tcGF0aWJpbGl0eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFNSCxPQUFPLEVBQUMsV0FBVyxJQUFJLHNCQUFzQixFQUFDLE1BQU0sNkJBQTZCLENBQUM7QUFLbEYsT0FBTyxFQUFDLFVBQVUsRUFBRSxlQUFlLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNoRSxPQUFPLEVBQUMsYUFBYSxFQUFFLFdBQVcsRUFBRSxpQkFBaUIsRUFBRSxjQUFjLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUU3RixPQUFPLEVBQUMsZ0JBQWdCLEVBQUUsa0JBQWtCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDOUQsT0FBTyxFQUFDLHlCQUF5QixFQUFFLFlBQVksRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUM3RCxPQUFPLEVBQUMsYUFBYSxFQUFFLGdCQUFnQixFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUUsVUFBVSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDNUcsT0FBTyxFQUFDLHVCQUF1QixFQUFjLE1BQU0sRUFBRSxTQUFTLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUc5RixPQUFPLEVBQUMsb0JBQW9CLEVBQXFCLE1BQU0sdUJBQXVCLENBQUM7QUFDL0UsT0FBTyxFQUFDLGVBQWUsRUFBRSxZQUFZLEVBQUUsT0FBTyxFQUFFLFVBQVUsRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBQzVGLE9BQU8sRUFBQywwQkFBMEIsRUFBRSxzQkFBc0IsRUFBcUIsTUFBTSxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBUSxNQUFNLG1CQUFtQixDQUFDO0FBQ3pKLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDOUMsT0FBTyxFQUFDLGtCQUFrQixFQUFFLFdBQVcsRUFBRSxZQUFZLEVBQUUsVUFBVSxFQUFFLG9CQUFvQixFQUFFLFVBQVUsRUFBRSxrQkFBa0IsRUFBRSxpQkFBaUIsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ3pMLE9BQU8sRUFBQyxlQUFlLEVBQUUsUUFBUSxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBQ2xELE9BQU8sRUFBQyxzQkFBc0IsRUFBRSxxQkFBcUIsRUFBRSxpQkFBaUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3ZHLE9BQU8sRUFBQyx3QkFBd0IsRUFBRSxnQkFBZ0IsRUFBRSxXQUFXLEVBQUUsdUJBQXVCLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNuSCxPQUFPLEVBQUMsT0FBTyxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBSW5DOzs7O0dBSUc7QUFDSCxNQUFNLFVBQVUsZ0JBQWdCLENBQUMsZUFBNkM7SUFFNUUsT0FBTyxnQkFBZ0IsQ0FBQyxlQUFlLEVBQUUsZUFBZSxFQUFHLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQztBQUMzRSxDQUFDO0FBRUQsSUFBSSxZQUFzRSxDQUFDO0FBRTNFOzs7Ozs7O0dBT0c7QUFDSCxNQUFNLFVBQVUsZ0JBQWdCLENBQzVCLGVBQTZDLEVBQUUsS0FBWSxFQUMzRCxJQUFXO0lBQ2IsSUFBSSxDQUFDLFlBQVksRUFBRTtRQUNqQixZQUFZLEdBQUcsTUFBTSxVQUFXLFNBQVEsZUFBZTtTQUFHLENBQUM7S0FDNUQ7SUFDRCxPQUFPLElBQUksWUFBWSxDQUFDLGdCQUFnQixDQUFDLEtBQUssRUFBRSxJQUFJLENBQWEsQ0FBQyxDQUFDO0FBQ3JFLENBQUM7QUFFRCxJQUFJLGFBR0gsQ0FBQztBQUVGOzs7O0dBSUc7QUFDSCxNQUFNLFVBQVUsaUJBQWlCLENBQzdCLGdCQUErQyxFQUMvQyxlQUE2QztJQUMvQyxPQUFPLGlCQUFpQixDQUFJLGdCQUFnQixFQUFFLGVBQWUsRUFBRSxlQUFlLEVBQUcsRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDO0FBQ2pHLENBQUM7QUFFRDs7Ozs7Ozs7R0FRRztBQUNILE1BQU0sVUFBVSxpQkFBaUIsQ0FDN0IsZ0JBQStDLEVBQUUsZUFBNkMsRUFDOUYsU0FBZ0IsRUFBRSxRQUFlO0lBQ25DLElBQUksQ0FBQyxhQUFhLEVBQUU7UUFDbEIsYUFBYSxHQUFHLE1BQU0sV0FBZSxTQUFRLGdCQUFtQjtZQUM5RCxZQUNZLGdCQUF1QixFQUFVLHNCQUFzQyxFQUN0RSxVQUFpQztnQkFDNUMsS0FBSyxFQUFFLENBQUM7Z0JBRkUscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFPO2dCQUFVLDJCQUFzQixHQUF0QixzQkFBc0IsQ0FBZ0I7Z0JBQ3RFLGVBQVUsR0FBVixVQUFVLENBQXVCO1lBRTlDLENBQUM7WUFFRCxrQkFBa0IsQ0FBQyxPQUFVO2dCQUMzQixNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsc0JBQXNCLENBQUMsTUFBZSxDQUFDO2dCQUNsRSxNQUFNLGFBQWEsR0FBRyxXQUFXLENBQzdCLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxhQUFhLEVBQUUsT0FBTyx3QkFBMEIsSUFBSSxFQUMzRSxhQUFhLENBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUVyRCxNQUFNLHFCQUFxQixHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ3ZGLFNBQVMsSUFBSSxnQkFBZ0IsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO2dCQUNyRCxhQUFhLENBQUMsc0JBQXNCLENBQUMsR0FBRyxxQkFBcUIsQ0FBQztnQkFFOUQsTUFBTSx1QkFBdUIsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQy9ELElBQUksdUJBQXVCLEtBQUssSUFBSSxFQUFFO29CQUNwQyxhQUFhLENBQUMsT0FBTyxDQUFDLEdBQUcsdUJBQXVCLENBQUMsa0JBQWtCLENBQUMsYUFBYSxDQUFDLENBQUM7aUJBQ3BGO2dCQUVELFVBQVUsQ0FBQyxhQUFhLEVBQUUsYUFBYSxFQUFFLE9BQU8sQ0FBQyxDQUFDO2dCQUVsRCxPQUFPLElBQUksT0FBTyxDQUFJLGFBQWEsQ0FBQyxDQUFDO1lBQ3ZDLENBQUM7U0FDRixDQUFDO0tBQ0g7SUFFRCxJQUFJLFNBQVMsQ0FBQyxJQUFJLG9CQUFzQixFQUFFO1FBQ3hDLFNBQVMsSUFBSSxhQUFhLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSx5QkFBeUIsQ0FBQyxDQUFDO1FBQ3hFLE9BQU8sSUFBSSxhQUFhLENBQ3BCLFFBQVEsRUFBRSxTQUEyQixFQUNyQyxnQkFBZ0IsQ0FBQyxlQUFlLEVBQUUsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7S0FDN0Q7U0FBTTtRQUNMLE9BQU8sSUFBSSxDQUFDO0tBQ2I7QUFDSCxDQUFDO0FBRUQsSUFBSSxrQkFJSCxDQUFDO0FBRUY7Ozs7O0dBS0c7QUFDSCxNQUFNLFVBQVUsc0JBQXNCLENBQ2xDLHFCQUF5RCxFQUN6RCxlQUE2QztJQUMvQyxNQUFNLGFBQWEsR0FBRyxlQUFlLEVBQTJELENBQUM7SUFDakcsT0FBTyxrQkFBa0IsQ0FBQyxxQkFBcUIsRUFBRSxlQUFlLEVBQUUsYUFBYSxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUM7QUFDL0YsQ0FBQztBQUVEOzs7Ozs7OztHQVFHO0FBQ0gsTUFBTSxVQUFVLGtCQUFrQixDQUM5QixxQkFBeUQsRUFDekQsZUFBNkMsRUFDN0MsU0FBNEQsRUFDNUQsUUFBZTtJQUNqQixJQUFJLENBQUMsa0JBQWtCLEVBQUU7UUFDdkIsa0JBQWtCLEdBQUcsTUFBTSxnQkFBaUIsU0FBUSxxQkFBcUI7WUFDdkUsWUFDWSxXQUF1QixFQUN2QixVQUE2RCxFQUM3RCxTQUFnQjtnQkFDMUIsS0FBSyxFQUFFLENBQUM7Z0JBSEUsZ0JBQVcsR0FBWCxXQUFXLENBQVk7Z0JBQ3ZCLGVBQVUsR0FBVixVQUFVLENBQW1EO2dCQUM3RCxjQUFTLEdBQVQsU0FBUyxDQUFPO1lBRTVCLENBQUM7WUFFRCxJQUFJLE9BQU87Z0JBQ1QsT0FBTyxnQkFBZ0IsQ0FBQyxlQUFlLEVBQUUsSUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDNUUsQ0FBQztZQUVELElBQUksUUFBUTtnQkFDVixPQUFPLElBQUksWUFBWSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQzNELENBQUM7WUFFRCxpQ0FBaUM7WUFDakMsSUFBSSxjQUFjO2dCQUNoQixNQUFNLGNBQWMsR0FBRyx5QkFBeUIsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDbEYsSUFBSSxpQkFBaUIsQ0FBQyxjQUFjLENBQUMsRUFBRTtvQkFDckMsTUFBTSxVQUFVLEdBQUcscUJBQXFCLENBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztvQkFDekUsTUFBTSxhQUFhLEdBQUcsc0JBQXNCLENBQUMsY0FBYyxDQUFDLENBQUM7b0JBQzdELFNBQVMsSUFBSSxrQkFBa0IsQ0FBQyxVQUFVLEVBQUUsYUFBYSxDQUFDLENBQUM7b0JBQzNELE1BQU0sV0FBVyxHQUNiLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxnQkFBMkIsQ0FBaUIsQ0FBQztvQkFDckYsT0FBTyxJQUFJLFlBQVksQ0FBQyxXQUFXLEVBQUUsVUFBVSxDQUFDLENBQUM7aUJBQ2xEO3FCQUFNO29CQUNMLE9BQU8sSUFBSSxZQUFZLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztpQkFDL0M7WUFDSCxDQUFDO1lBRUQsS0FBSztnQkFDSCxPQUFPLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO29CQUN0QixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7aUJBQzlCO1lBQ0gsQ0FBQztZQUVELEdBQUcsQ0FBQyxLQUFhO2dCQUNmLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsS0FBSyxJQUFJLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxJQUFJLENBQUM7WUFDN0YsQ0FBQztZQUVELElBQUksTUFBTTtnQkFDUixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxHQUFHLHVCQUF1QixDQUFDO1lBQzNELENBQUM7WUFFRCxrQkFBa0IsQ0FBSSxXQUFzQyxFQUFFLE9BQVcsRUFBRSxLQUFjO2dCQUV2RixNQUFNLE9BQU8sR0FBRyxXQUFXLENBQUMsa0JBQWtCLENBQUMsT0FBTyxJQUFTLEVBQUUsQ0FBQyxDQUFDO2dCQUNuRSxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDNUIsT0FBTyxPQUFPLENBQUM7WUFDakIsQ0FBQztZQUVELGVBQWUsQ0FDWCxnQkFBZ0QsRUFBRSxLQUF3QixFQUMxRSxRQUE2QixFQUFFLGdCQUFvQyxFQUNuRSxXQUFtRDtnQkFDckQsTUFBTSxlQUFlLEdBQUcsUUFBUSxJQUFJLElBQUksQ0FBQyxjQUFjLENBQUM7Z0JBQ3hELElBQUksQ0FBQyxXQUFXLElBQUssZ0JBQXdCLENBQUMsUUFBUSxJQUFJLElBQUksSUFBSSxlQUFlLEVBQUU7b0JBQ2pGLGdGQUFnRjtvQkFDaEYsK0VBQStFO29CQUMvRSwrQ0FBK0M7b0JBQy9DLE1BQU0sTUFBTSxHQUFHLGVBQWUsQ0FBQyxHQUFHLENBQUMsc0JBQXNCLEVBQUUsSUFBSSxDQUFDLENBQUM7b0JBQ2pFLElBQUksTUFBTSxFQUFFO3dCQUNWLFdBQVcsR0FBRyxNQUFNLENBQUM7cUJBQ3RCO2lCQUNGO2dCQUVELE1BQU0sWUFBWSxHQUNkLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxlQUFlLEVBQUUsZ0JBQWdCLEVBQUUsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFDO2dCQUN2RixJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQzFDLE9BQU8sWUFBWSxDQUFDO1lBQ3RCLENBQUM7WUFFRCxNQUFNLENBQUMsT0FBMkIsRUFBRSxLQUFjO2dCQUNoRCxNQUFNLEtBQUssR0FBSSxPQUF3QixDQUFDLE1BQU8sQ0FBQztnQkFDaEQsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUUzQixJQUFJLE9BQU8sQ0FBQyxTQUFTLEVBQUU7b0JBQ3JCLE1BQU0sSUFBSSxLQUFLLENBQUMsb0RBQW9ELENBQUMsQ0FBQztpQkFDdkU7Z0JBRUQsSUFBSSxDQUFDLHlCQUF5QixFQUFFLENBQUM7Z0JBRWpDLElBQUksdUJBQXVCLENBQUMsS0FBSyxDQUFDLEVBQUU7b0JBQ2xDLHdGQUF3RjtvQkFFeEYsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztvQkFFdEMsc0ZBQXNGO29CQUN0Rix1QkFBdUI7b0JBQ3ZCLDBEQUEwRDtvQkFDMUQsMERBQTBEO29CQUMxRCxJQUFJLE9BQU8sS0FBSyxDQUFDLENBQUMsRUFBRTt3QkFDbEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztxQkFDdEI7eUJBQU07d0JBQ0wsTUFBTSxjQUFjLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBZSxDQUFDO3dCQUNuRCxTQUFTOzRCQUNMLFdBQVcsQ0FDUCxZQUFZLENBQUMsY0FBYyxDQUFDLEVBQUUsSUFBSSxFQUNsQywrREFBK0QsQ0FBQyxDQUFDO3dCQUd6RSxtRkFBbUY7d0JBQ25GLDZCQUE2Qjt3QkFDN0IsTUFBTSxTQUFTLEdBQUcsSUFBSSxrQkFBa0IsQ0FDcEMsY0FBYyxFQUFFLGNBQWMsQ0FBQyxNQUFNLENBQXVCLEVBQzVELGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO3dCQUU1QixTQUFTLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztxQkFDOUM7aUJBQ0Y7Z0JBRUQsc0RBQXNEO2dCQUN0RCxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUM3QyxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDO2dCQUNwQyxVQUFVLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUUsV0FBVyxDQUFDLENBQUM7Z0JBRWxELDhDQUE4QztnQkFDOUMsTUFBTSxVQUFVLEdBQUcsb0JBQW9CLENBQUMsV0FBVyxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUNqRSxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ2pDLE1BQU0sV0FBVyxHQUFHLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxVQUFVLENBQUMsTUFBTSxDQUF3QixDQUFDLENBQUM7Z0JBQzFGLElBQUksV0FBVyxLQUFLLElBQUksRUFBRTtvQkFDeEIsa0JBQWtCLENBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxNQUFNLENBQUMsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRSxVQUFVLENBQUMsQ0FBQztpQkFDekY7Z0JBRUEsT0FBd0IsQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDekQsVUFBVSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUUsRUFBRSxXQUFXLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBRXpELE9BQU8sT0FBTyxDQUFDO1lBQ2pCLENBQUM7WUFFRCxJQUFJLENBQUMsT0FBMkIsRUFBRSxRQUFnQjtnQkFDaEQsSUFBSSxPQUFPLENBQUMsU0FBUyxFQUFFO29CQUNyQixNQUFNLElBQUksS0FBSyxDQUFDLGtEQUFrRCxDQUFDLENBQUM7aUJBQ3JFO2dCQUNELE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDeEMsQ0FBQztZQUVELE9BQU8sQ0FBQyxPQUEyQjtnQkFDakMsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDaEQsT0FBTyxXQUFXLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNsRSxDQUFDO1lBRUQsTUFBTSxDQUFDLEtBQWM7Z0JBQ25CLElBQUksQ0FBQyx5QkFBeUIsRUFBRSxDQUFDO2dCQUNqQyxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNqRCxNQUFNLFlBQVksR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxXQUFXLENBQUMsQ0FBQztnQkFFL0QsSUFBSSxZQUFZLEVBQUU7b0JBQ2hCLGtGQUFrRjtvQkFDbEYsbUVBQW1FO29CQUNuRSwyRUFBMkU7b0JBQzNFLHdDQUF3QztvQkFDeEMsc0ZBQXNGO29CQUN0RixrQkFBa0I7b0JBQ2xCLGVBQWUsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBRSxFQUFFLFdBQVcsQ0FBQyxDQUFDO29CQUMzRCxZQUFZLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxFQUFFLFlBQVksQ0FBQyxDQUFDO2lCQUNqRDtZQUNILENBQUM7WUFFRCxNQUFNLENBQUMsS0FBYztnQkFDbkIsSUFBSSxDQUFDLHlCQUF5QixFQUFFLENBQUM7Z0JBQ2pDLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2pELE1BQU0sSUFBSSxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLFdBQVcsQ0FBQyxDQUFDO2dCQUV2RCxNQUFNLFdBQVcsR0FDYixJQUFJLElBQUksZUFBZSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFFLEVBQUUsV0FBVyxDQUFDLElBQUksSUFBSSxDQUFDO2dCQUMvRSxPQUFPLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxPQUFPLENBQUMsSUFBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUNqRCxDQUFDO1lBRU8sWUFBWSxDQUFDLEtBQWMsRUFBRSxRQUFnQixDQUFDO2dCQUNwRCxJQUFJLEtBQUssSUFBSSxJQUFJLEVBQUU7b0JBQ2pCLE9BQU8sSUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7aUJBQzVCO2dCQUNELElBQUksU0FBUyxFQUFFO29CQUNiLGlCQUFpQixDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsRUFBRSx1Q0FBdUMsS0FBSyxFQUFFLENBQUMsQ0FBQztvQkFDN0UsOENBQThDO29CQUM5QyxjQUFjLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxHQUFHLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztpQkFDekQ7Z0JBQ0QsT0FBTyxLQUFLLENBQUM7WUFDZixDQUFDO1lBRU8seUJBQXlCO2dCQUMvQixJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLEtBQUssSUFBSSxFQUFFO29CQUN4QyxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsQ0FBQztpQkFDbEM7WUFDSCxDQUFDO1NBQ0YsQ0FBQztLQUNIO0lBRUQsU0FBUyxJQUFJLGVBQWUsQ0FBQyxTQUFTLEVBQUUsd0NBQTJDLENBQUMsQ0FBQztJQUVyRixJQUFJLFVBQXNCLENBQUM7SUFDM0IsTUFBTSxTQUFTLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUM1QyxJQUFJLFlBQVksQ0FBQyxTQUFTLENBQUMsRUFBRTtRQUMzQix1RUFBdUU7UUFDdkUsVUFBVSxHQUFHLFNBQVMsQ0FBQztLQUN4QjtTQUFNO1FBQ0wsSUFBSSxXQUFxQixDQUFDO1FBQzFCLHFGQUFxRjtRQUNyRixrRkFBa0Y7UUFDbEYsK0ZBQStGO1FBQy9GLFlBQVk7UUFDWixJQUFJLFNBQVMsQ0FBQyxJQUFJLDJCQUE2QixFQUFFO1lBQy9DLFdBQVcsR0FBRyxXQUFXLENBQUMsU0FBUyxDQUFhLENBQUM7U0FDbEQ7YUFBTTtZQUNMLFNBQVMsSUFBSSxTQUFTLENBQUMscUJBQXFCLEVBQUUsQ0FBQztZQUMvQyxXQUFXLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7WUFFN0UsMEZBQTBGO1lBQzFGLHlGQUF5RjtZQUN6Riw2RkFBNkY7WUFDN0YsOEZBQThGO1lBQzlGLFFBQVE7WUFDUixJQUFJLFVBQVUsQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDeEIsTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUNwQyxNQUFNLFVBQVUsR0FBRyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFFLENBQUM7Z0JBQzFELE1BQU0sa0JBQWtCLEdBQUcsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUNsRSxrQkFBa0IsQ0FDZCxRQUFRLEVBQUUsa0JBQW1CLEVBQUUsV0FBVyxFQUFFLGlCQUFpQixDQUFDLFFBQVEsRUFBRSxVQUFVLENBQUMsRUFDbkYsS0FBSyxDQUFDLENBQUM7YUFDWjtpQkFBTTtnQkFDTCw0RkFBNEY7Z0JBQzVGLGdEQUFnRDtnQkFDaEQsTUFBTSxZQUFZLEdBQ2QsV0FBVyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsRUFBRSxTQUFTLENBQUMsTUFBTSxxQkFBdUIsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDdkYsV0FBVyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLFlBQVksQ0FBQyxDQUFDO2FBQ25FO1NBQ0Y7UUFFRCxRQUFRLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxHQUFHLFVBQVU7WUFDbEMsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFFbEUsYUFBYSxDQUFDLFFBQVEsRUFBRSxVQUFVLENBQUMsQ0FBQztLQUNyQztJQUVELE9BQU8sSUFBSSxrQkFBa0IsQ0FBQyxVQUFVLEVBQUUsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBQ2pFLENBQUM7QUFHRCxxREFBcUQ7QUFDckQsTUFBTSxVQUFVLHVCQUF1QixDQUFDLE1BQU0sR0FBRyxLQUFLO0lBQ3BELE9BQU8sYUFBYSxDQUFDLGVBQWUsRUFBRyxFQUFFLFFBQVEsRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQy9ELENBQUM7QUFFRDs7Ozs7OztHQU9HO0FBQ0gsU0FBUyxhQUFhLENBQUMsS0FBWSxFQUFFLEtBQVksRUFBRSxNQUFlO0lBQ2hFLG1GQUFtRjtJQUNuRixtRUFBbUU7SUFDbkUsTUFBTSxlQUFlLEdBQUcsQ0FBQyxNQUFNLElBQUksZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzFELElBQUksZUFBZSxFQUFFO1FBQ25CLHFFQUFxRTtRQUNyRSxpRkFBaUY7UUFDakYsTUFBTSxhQUFhLEdBQUcsd0JBQXdCLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFFLFlBQVk7UUFDakYsT0FBTyxJQUFJLE9BQU8sQ0FBQyxhQUFhLEVBQUUsYUFBYSxDQUFDLENBQUM7S0FDbEQ7U0FBTSxJQUFJLEtBQUssQ0FBQyxJQUFJLEdBQUcsQ0FBQyx3Q0FBMkMsZUFBZ0IsQ0FBQyxFQUFFO1FBQ3JGLDJFQUEyRTtRQUMzRSx5RkFBeUY7UUFDekYsTUFBTSxpQkFBaUIsR0FBRyxLQUFLLENBQUMsMEJBQTBCLENBQUMsQ0FBQyxDQUFFLFVBQVU7UUFDeEUsT0FBTyxJQUFJLE9BQU8sQ0FBQyxpQkFBaUIsRUFBRSxLQUFLLENBQUMsQ0FBQztLQUM5QztJQUNELE9BQU8sSUFBSyxDQUFDO0FBQ2YsQ0FBQztBQUVELHVGQUF1RjtBQUN2RixTQUFTLG9CQUFvQixDQUFDLElBQVc7SUFDdkMsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ2hDLElBQUksb0JBQW9CLENBQUMsUUFBUSxDQUFDLEVBQUU7UUFDbEMsT0FBTyxRQUFxQixDQUFDO0tBQzlCO1NBQU07UUFDTCxNQUFNLElBQUksS0FBSyxDQUFDLDhEQUE4RCxDQUFDLENBQUM7S0FDakY7QUFDSCxDQUFDO0FBRUQscURBQXFEO0FBQ3JELE1BQU0sVUFBVSxlQUFlO0lBQzdCLGlHQUFpRztJQUNqRyw0RkFBNEY7SUFDNUYsTUFBTSxLQUFLLEdBQUcsUUFBUSxFQUFFLENBQUM7SUFDekIsTUFBTSxLQUFLLEdBQUcsZUFBZSxFQUFHLENBQUM7SUFDakMsTUFBTSxXQUFXLEdBQUcsd0JBQXdCLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNqRSxPQUFPLG9CQUFvQixDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUMxRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Q2hhbmdlRGV0ZWN0b3JSZWYgYXMgVmlld0VuZ2luZV9DaGFuZ2VEZXRlY3RvclJlZn0gZnJvbSAnLi4vY2hhbmdlX2RldGVjdGlvbi9jaGFuZ2VfZGV0ZWN0b3JfcmVmJztcbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4uL2RpL2luamVjdG9yJztcbmltcG9ydCB7Q29tcG9uZW50RmFjdG9yeSBhcyB2aWV3RW5naW5lX0NvbXBvbmVudEZhY3RvcnksIENvbXBvbmVudFJlZiBhcyB2aWV3RW5naW5lX0NvbXBvbmVudFJlZn0gZnJvbSAnLi4vbGlua2VyL2NvbXBvbmVudF9mYWN0b3J5JztcbmltcG9ydCB7RWxlbWVudFJlZiBhcyBWaWV3RW5naW5lX0VsZW1lbnRSZWZ9IGZyb20gJy4uL2xpbmtlci9lbGVtZW50X3JlZic7XG5pbXBvcnQge05nTW9kdWxlUmVmIGFzIHZpZXdFbmdpbmVfTmdNb2R1bGVSZWZ9IGZyb20gJy4uL2xpbmtlci9uZ19tb2R1bGVfZmFjdG9yeSc7XG5pbXBvcnQge1RlbXBsYXRlUmVmIGFzIFZpZXdFbmdpbmVfVGVtcGxhdGVSZWZ9IGZyb20gJy4uL2xpbmtlci90ZW1wbGF0ZV9yZWYnO1xuaW1wb3J0IHtWaWV3Q29udGFpbmVyUmVmIGFzIFZpZXdFbmdpbmVfVmlld0NvbnRhaW5lclJlZn0gZnJvbSAnLi4vbGlua2VyL3ZpZXdfY29udGFpbmVyX3JlZic7XG5pbXBvcnQge0VtYmVkZGVkVmlld1JlZiBhcyB2aWV3RW5naW5lX0VtYmVkZGVkVmlld1JlZiwgVmlld1JlZiBhcyB2aWV3RW5naW5lX1ZpZXdSZWZ9IGZyb20gJy4uL2xpbmtlci92aWV3X3JlZic7XG5pbXBvcnQge1JlbmRlcmVyMn0gZnJvbSAnLi4vcmVuZGVyL2FwaSc7XG5pbXBvcnQge2FkZFRvQXJyYXksIHJlbW92ZUZyb21BcnJheX0gZnJvbSAnLi4vdXRpbC9hcnJheV91dGlscyc7XG5pbXBvcnQge2Fzc2VydERlZmluZWQsIGFzc2VydEVxdWFsLCBhc3NlcnRHcmVhdGVyVGhhbiwgYXNzZXJ0TGVzc1RoYW59IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcblxuaW1wb3J0IHthc3NlcnRMQ29udGFpbmVyLCBhc3NlcnROb2RlSW5qZWN0b3J9IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7Z2V0UGFyZW50SW5qZWN0b3JMb2NhdGlvbiwgTm9kZUluamVjdG9yfSBmcm9tICcuL2RpJztcbmltcG9ydCB7YWRkVG9WaWV3VHJlZSwgY3JlYXRlTENvbnRhaW5lciwgY3JlYXRlTFZpZXcsIGNyZWF0ZVROb2RlLCByZW5kZXJWaWV3fSBmcm9tICcuL2luc3RydWN0aW9ucy9zaGFyZWQnO1xuaW1wb3J0IHtDT05UQUlORVJfSEVBREVSX09GRlNFVCwgTENvbnRhaW5lciwgTkFUSVZFLCBWSUVXX1JFRlN9IGZyb20gJy4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtOb2RlSW5qZWN0b3JPZmZzZXR9IGZyb20gJy4vaW50ZXJmYWNlcy9pbmplY3Rvcic7XG5pbXBvcnQge1RDb250YWluZXJOb2RlLCBURGlyZWN0aXZlSG9zdE5vZGUsIFRFbGVtZW50Q29udGFpbmVyTm9kZSwgVEVsZW1lbnROb2RlLCBUTm9kZSwgVE5vZGVUeXBlfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge2lzUHJvY2VkdXJhbFJlbmRlcmVyLCBSQ29tbWVudCwgUkVsZW1lbnR9IGZyb20gJy4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge2lzQ29tcG9uZW50SG9zdCwgaXNMQ29udGFpbmVyLCBpc0xWaWV3LCBpc1Jvb3RWaWV3fSBmcm9tICcuL2ludGVyZmFjZXMvdHlwZV9jaGVja3MnO1xuaW1wb3J0IHtERUNMQVJBVElPTl9DT01QT05FTlRfVklFVywgREVDTEFSQVRJT05fTENPTlRBSU5FUiwgTFZpZXcsIExWaWV3RmxhZ3MsIFBBUkVOVCwgUVVFUklFUywgUkVOREVSRVIsIFRfSE9TVCwgVFZJRVcsIFRWaWV3fSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydFROb2RlVHlwZX0gZnJvbSAnLi9ub2RlX2Fzc2VydCc7XG5pbXBvcnQge2FkZFZpZXdUb0NvbnRhaW5lciwgYXBwZW5kQ2hpbGQsIGRlc3Ryb3lMVmlldywgZGV0YWNoVmlldywgZ2V0QmVmb3JlTm9kZUZvclZpZXcsIGluc2VydFZpZXcsIG5hdGl2ZUluc2VydEJlZm9yZSwgbmF0aXZlTmV4dFNpYmxpbmcsIG5hdGl2ZVBhcmVudE5vZGV9IGZyb20gJy4vbm9kZV9tYW5pcHVsYXRpb24nO1xuaW1wb3J0IHtnZXRDdXJyZW50VE5vZGUsIGdldExWaWV3fSBmcm9tICcuL3N0YXRlJztcbmltcG9ydCB7Z2V0UGFyZW50SW5qZWN0b3JJbmRleCwgZ2V0UGFyZW50SW5qZWN0b3JWaWV3LCBoYXNQYXJlbnRJbmplY3Rvcn0gZnJvbSAnLi91dGlsL2luamVjdG9yX3V0aWxzJztcbmltcG9ydCB7Z2V0Q29tcG9uZW50TFZpZXdCeUluZGV4LCBnZXROYXRpdmVCeVROb2RlLCB1bndyYXBSTm9kZSwgdmlld0F0dGFjaGVkVG9Db250YWluZXJ9IGZyb20gJy4vdXRpbC92aWV3X3V0aWxzJztcbmltcG9ydCB7Vmlld1JlZn0gZnJvbSAnLi92aWV3X3JlZic7XG5cblxuXG4vKipcbiAqIENyZWF0ZXMgYW4gRWxlbWVudFJlZiBmcm9tIHRoZSBtb3N0IHJlY2VudCBub2RlLlxuICpcbiAqIEByZXR1cm5zIFRoZSBFbGVtZW50UmVmIGluc3RhbmNlIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0RWxlbWVudFJlZihFbGVtZW50UmVmVG9rZW46IHR5cGVvZiBWaWV3RW5naW5lX0VsZW1lbnRSZWYpOlxuICAgIFZpZXdFbmdpbmVfRWxlbWVudFJlZiB7XG4gIHJldHVybiBjcmVhdGVFbGVtZW50UmVmKEVsZW1lbnRSZWZUb2tlbiwgZ2V0Q3VycmVudFROb2RlKCkhLCBnZXRMVmlldygpKTtcbn1cblxubGV0IFIzRWxlbWVudFJlZjoge25ldyAobmF0aXZlOiBSRWxlbWVudHxSQ29tbWVudCk6IFZpZXdFbmdpbmVfRWxlbWVudFJlZn07XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBFbGVtZW50UmVmIGdpdmVuIGEgbm9kZS5cbiAqXG4gKiBAcGFyYW0gRWxlbWVudFJlZlRva2VuIFRoZSBFbGVtZW50UmVmIHR5cGVcbiAqIEBwYXJhbSB0Tm9kZSBUaGUgbm9kZSBmb3Igd2hpY2ggeW91J2QgbGlrZSBhbiBFbGVtZW50UmVmXG4gKiBAcGFyYW0gdmlldyBUaGUgdmlldyB0byB3aGljaCB0aGUgbm9kZSBiZWxvbmdzXG4gKiBAcmV0dXJucyBUaGUgRWxlbWVudFJlZiBpbnN0YW5jZSB0byB1c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVsZW1lbnRSZWYoXG4gICAgRWxlbWVudFJlZlRva2VuOiB0eXBlb2YgVmlld0VuZ2luZV9FbGVtZW50UmVmLCB0Tm9kZTogVE5vZGUsXG4gICAgdmlldzogTFZpZXcpOiBWaWV3RW5naW5lX0VsZW1lbnRSZWYge1xuICBpZiAoIVIzRWxlbWVudFJlZikge1xuICAgIFIzRWxlbWVudFJlZiA9IGNsYXNzIEVsZW1lbnRSZWYgZXh0ZW5kcyBFbGVtZW50UmVmVG9rZW4ge307XG4gIH1cbiAgcmV0dXJuIG5ldyBSM0VsZW1lbnRSZWYoZ2V0TmF0aXZlQnlUTm9kZSh0Tm9kZSwgdmlldykgYXMgUkVsZW1lbnQpO1xufVxuXG5sZXQgUjNUZW1wbGF0ZVJlZjoge1xuICBuZXcgKF9kZWNsYXJhdGlvblBhcmVudFZpZXc6IExWaWV3LCBob3N0VE5vZGU6IFRDb250YWluZXJOb2RlLCBlbGVtZW50UmVmOiBWaWV3RW5naW5lX0VsZW1lbnRSZWYpOlxuICAgICAgVmlld0VuZ2luZV9UZW1wbGF0ZVJlZjxhbnk+XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBUZW1wbGF0ZVJlZiBnaXZlbiBhIG5vZGUuXG4gKlxuICogQHJldHVybnMgVGhlIFRlbXBsYXRlUmVmIGluc3RhbmNlIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0VGVtcGxhdGVSZWY8VD4oXG4gICAgVGVtcGxhdGVSZWZUb2tlbjogdHlwZW9mIFZpZXdFbmdpbmVfVGVtcGxhdGVSZWYsXG4gICAgRWxlbWVudFJlZlRva2VuOiB0eXBlb2YgVmlld0VuZ2luZV9FbGVtZW50UmVmKTogVmlld0VuZ2luZV9UZW1wbGF0ZVJlZjxUPnxudWxsIHtcbiAgcmV0dXJuIGNyZWF0ZVRlbXBsYXRlUmVmPFQ+KFRlbXBsYXRlUmVmVG9rZW4sIEVsZW1lbnRSZWZUb2tlbiwgZ2V0Q3VycmVudFROb2RlKCkhLCBnZXRMVmlldygpKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgVGVtcGxhdGVSZWYgYW5kIHN0b3JlcyBpdCBvbiB0aGUgaW5qZWN0b3IuXG4gKlxuICogQHBhcmFtIFRlbXBsYXRlUmVmVG9rZW4gVGhlIFRlbXBsYXRlUmVmIHR5cGVcbiAqIEBwYXJhbSBFbGVtZW50UmVmVG9rZW4gVGhlIEVsZW1lbnRSZWYgdHlwZVxuICogQHBhcmFtIGhvc3RUTm9kZSBUaGUgbm9kZSBvbiB3aGljaCBhIFRlbXBsYXRlUmVmIGlzIHJlcXVlc3RlZFxuICogQHBhcmFtIGhvc3RWaWV3IFRoZSB2aWV3IHRvIHdoaWNoIHRoZSBub2RlIGJlbG9uZ3NcbiAqIEByZXR1cm5zIFRoZSBUZW1wbGF0ZVJlZiBpbnN0YW5jZSBvciBudWxsIGlmIHdlIGNhbid0IGNyZWF0ZSBhIFRlbXBsYXRlUmVmIG9uIGEgZ2l2ZW4gbm9kZSB0eXBlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUZW1wbGF0ZVJlZjxUPihcbiAgICBUZW1wbGF0ZVJlZlRva2VuOiB0eXBlb2YgVmlld0VuZ2luZV9UZW1wbGF0ZVJlZiwgRWxlbWVudFJlZlRva2VuOiB0eXBlb2YgVmlld0VuZ2luZV9FbGVtZW50UmVmLFxuICAgIGhvc3RUTm9kZTogVE5vZGUsIGhvc3RWaWV3OiBMVmlldyk6IFZpZXdFbmdpbmVfVGVtcGxhdGVSZWY8VD58bnVsbCB7XG4gIGlmICghUjNUZW1wbGF0ZVJlZikge1xuICAgIFIzVGVtcGxhdGVSZWYgPSBjbGFzcyBUZW1wbGF0ZVJlZjxUPiBleHRlbmRzIFRlbXBsYXRlUmVmVG9rZW48VD57XG4gICAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgICBwcml2YXRlIF9kZWNsYXJhdGlvblZpZXc6IExWaWV3LCBwcml2YXRlIF9kZWNsYXJhdGlvblRDb250YWluZXI6IFRDb250YWluZXJOb2RlLFxuICAgICAgICAgIHJlYWRvbmx5IGVsZW1lbnRSZWY6IFZpZXdFbmdpbmVfRWxlbWVudFJlZikge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgfVxuXG4gICAgICBjcmVhdGVFbWJlZGRlZFZpZXcoY29udGV4dDogVCk6IHZpZXdFbmdpbmVfRW1iZWRkZWRWaWV3UmVmPFQ+IHtcbiAgICAgICAgY29uc3QgZW1iZWRkZWRUVmlldyA9IHRoaXMuX2RlY2xhcmF0aW9uVENvbnRhaW5lci50Vmlld3MgYXMgVFZpZXc7XG4gICAgICAgIGNvbnN0IGVtYmVkZGVkTFZpZXcgPSBjcmVhdGVMVmlldyhcbiAgICAgICAgICAgIHRoaXMuX2RlY2xhcmF0aW9uVmlldywgZW1iZWRkZWRUVmlldywgY29udGV4dCwgTFZpZXdGbGFncy5DaGVja0Fsd2F5cywgbnVsbCxcbiAgICAgICAgICAgIGVtYmVkZGVkVFZpZXcuZGVjbFROb2RlLCBudWxsLCBudWxsLCBudWxsLCBudWxsKTtcblxuICAgICAgICBjb25zdCBkZWNsYXJhdGlvbkxDb250YWluZXIgPSB0aGlzLl9kZWNsYXJhdGlvblZpZXdbdGhpcy5fZGVjbGFyYXRpb25UQ29udGFpbmVyLmluZGV4XTtcbiAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydExDb250YWluZXIoZGVjbGFyYXRpb25MQ29udGFpbmVyKTtcbiAgICAgICAgZW1iZWRkZWRMVmlld1tERUNMQVJBVElPTl9MQ09OVEFJTkVSXSA9IGRlY2xhcmF0aW9uTENvbnRhaW5lcjtcblxuICAgICAgICBjb25zdCBkZWNsYXJhdGlvblZpZXdMUXVlcmllcyA9IHRoaXMuX2RlY2xhcmF0aW9uVmlld1tRVUVSSUVTXTtcbiAgICAgICAgaWYgKGRlY2xhcmF0aW9uVmlld0xRdWVyaWVzICE9PSBudWxsKSB7XG4gICAgICAgICAgZW1iZWRkZWRMVmlld1tRVUVSSUVTXSA9IGRlY2xhcmF0aW9uVmlld0xRdWVyaWVzLmNyZWF0ZUVtYmVkZGVkVmlldyhlbWJlZGRlZFRWaWV3KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlbmRlclZpZXcoZW1iZWRkZWRUVmlldywgZW1iZWRkZWRMVmlldywgY29udGV4dCk7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBWaWV3UmVmPFQ+KGVtYmVkZGVkTFZpZXcpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBpZiAoaG9zdFROb2RlLnR5cGUgJiBUTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoaG9zdFROb2RlLnRWaWV3cywgJ1RWaWV3IG11c3QgYmUgYWxsb2NhdGVkJyk7XG4gICAgcmV0dXJuIG5ldyBSM1RlbXBsYXRlUmVmKFxuICAgICAgICBob3N0VmlldywgaG9zdFROb2RlIGFzIFRDb250YWluZXJOb2RlLFxuICAgICAgICBjcmVhdGVFbGVtZW50UmVmKEVsZW1lbnRSZWZUb2tlbiwgaG9zdFROb2RlLCBob3N0VmlldykpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbmxldCBSM1ZpZXdDb250YWluZXJSZWY6IHtcbiAgbmV3IChcbiAgICAgIGxDb250YWluZXI6IExDb250YWluZXIsIGhvc3RUTm9kZTogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZSxcbiAgICAgIGhvc3RWaWV3OiBMVmlldyk6IFZpZXdFbmdpbmVfVmlld0NvbnRhaW5lclJlZlxufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgVmlld0NvbnRhaW5lclJlZiBhbmQgc3RvcmVzIGl0IG9uIHRoZSBpbmplY3Rvci4gT3IsIGlmIHRoZSBWaWV3Q29udGFpbmVyUmVmXG4gKiBhbHJlYWR5IGV4aXN0cywgcmV0cmlldmVzIHRoZSBleGlzdGluZyBWaWV3Q29udGFpbmVyUmVmLlxuICpcbiAqIEByZXR1cm5zIFRoZSBWaWV3Q29udGFpbmVyUmVmIGluc3RhbmNlIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0Vmlld0NvbnRhaW5lclJlZihcbiAgICBWaWV3Q29udGFpbmVyUmVmVG9rZW46IHR5cGVvZiBWaWV3RW5naW5lX1ZpZXdDb250YWluZXJSZWYsXG4gICAgRWxlbWVudFJlZlRva2VuOiB0eXBlb2YgVmlld0VuZ2luZV9FbGVtZW50UmVmKTogVmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmIHtcbiAgY29uc3QgcHJldmlvdXNUTm9kZSA9IGdldEN1cnJlbnRUTm9kZSgpIGFzIFRFbGVtZW50Tm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSB8IFRDb250YWluZXJOb2RlO1xuICByZXR1cm4gY3JlYXRlQ29udGFpbmVyUmVmKFZpZXdDb250YWluZXJSZWZUb2tlbiwgRWxlbWVudFJlZlRva2VuLCBwcmV2aW91c1ROb2RlLCBnZXRMVmlldygpKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgVmlld0NvbnRhaW5lclJlZiBhbmQgc3RvcmVzIGl0IG9uIHRoZSBpbmplY3Rvci5cbiAqXG4gKiBAcGFyYW0gVmlld0NvbnRhaW5lclJlZlRva2VuIFRoZSBWaWV3Q29udGFpbmVyUmVmIHR5cGVcbiAqIEBwYXJhbSBFbGVtZW50UmVmVG9rZW4gVGhlIEVsZW1lbnRSZWYgdHlwZVxuICogQHBhcmFtIGhvc3RUTm9kZSBUaGUgbm9kZSB0aGF0IGlzIHJlcXVlc3RpbmcgYSBWaWV3Q29udGFpbmVyUmVmXG4gKiBAcGFyYW0gaG9zdFZpZXcgVGhlIHZpZXcgdG8gd2hpY2ggdGhlIG5vZGUgYmVsb25nc1xuICogQHJldHVybnMgVGhlIFZpZXdDb250YWluZXJSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVDb250YWluZXJSZWYoXG4gICAgVmlld0NvbnRhaW5lclJlZlRva2VuOiB0eXBlb2YgVmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmLFxuICAgIEVsZW1lbnRSZWZUb2tlbjogdHlwZW9mIFZpZXdFbmdpbmVfRWxlbWVudFJlZixcbiAgICBob3N0VE5vZGU6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxURWxlbWVudENvbnRhaW5lck5vZGUsXG4gICAgaG9zdFZpZXc6IExWaWV3KTogVmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmIHtcbiAgaWYgKCFSM1ZpZXdDb250YWluZXJSZWYpIHtcbiAgICBSM1ZpZXdDb250YWluZXJSZWYgPSBjbGFzcyBWaWV3Q29udGFpbmVyUmVmIGV4dGVuZHMgVmlld0NvbnRhaW5lclJlZlRva2VuIHtcbiAgICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICAgIHByaXZhdGUgX2xDb250YWluZXI6IExDb250YWluZXIsXG4gICAgICAgICAgcHJpdmF0ZSBfaG9zdFROb2RlOiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlLFxuICAgICAgICAgIHByaXZhdGUgX2hvc3RWaWV3OiBMVmlldykge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgfVxuXG4gICAgICBnZXQgZWxlbWVudCgpOiBWaWV3RW5naW5lX0VsZW1lbnRSZWYge1xuICAgICAgICByZXR1cm4gY3JlYXRlRWxlbWVudFJlZihFbGVtZW50UmVmVG9rZW4sIHRoaXMuX2hvc3RUTm9kZSwgdGhpcy5faG9zdFZpZXcpO1xuICAgICAgfVxuXG4gICAgICBnZXQgaW5qZWN0b3IoKTogSW5qZWN0b3Ige1xuICAgICAgICByZXR1cm4gbmV3IE5vZGVJbmplY3Rvcih0aGlzLl9ob3N0VE5vZGUsIHRoaXMuX2hvc3RWaWV3KTtcbiAgICAgIH1cblxuICAgICAgLyoqIEBkZXByZWNhdGVkIE5vIHJlcGxhY2VtZW50ICovXG4gICAgICBnZXQgcGFyZW50SW5qZWN0b3IoKTogSW5qZWN0b3Ige1xuICAgICAgICBjb25zdCBwYXJlbnRMb2NhdGlvbiA9IGdldFBhcmVudEluamVjdG9yTG9jYXRpb24odGhpcy5faG9zdFROb2RlLCB0aGlzLl9ob3N0Vmlldyk7XG4gICAgICAgIGlmIChoYXNQYXJlbnRJbmplY3RvcihwYXJlbnRMb2NhdGlvbikpIHtcbiAgICAgICAgICBjb25zdCBwYXJlbnRWaWV3ID0gZ2V0UGFyZW50SW5qZWN0b3JWaWV3KHBhcmVudExvY2F0aW9uLCB0aGlzLl9ob3N0Vmlldyk7XG4gICAgICAgICAgY29uc3QgaW5qZWN0b3JJbmRleCA9IGdldFBhcmVudEluamVjdG9ySW5kZXgocGFyZW50TG9jYXRpb24pO1xuICAgICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlSW5qZWN0b3IocGFyZW50VmlldywgaW5qZWN0b3JJbmRleCk7XG4gICAgICAgICAgY29uc3QgcGFyZW50VE5vZGUgPVxuICAgICAgICAgICAgICBwYXJlbnRWaWV3W1RWSUVXXS5kYXRhW2luamVjdG9ySW5kZXggKyBOb2RlSW5qZWN0b3JPZmZzZXQuVE5PREVdIGFzIFRFbGVtZW50Tm9kZTtcbiAgICAgICAgICByZXR1cm4gbmV3IE5vZGVJbmplY3RvcihwYXJlbnRUTm9kZSwgcGFyZW50Vmlldyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIG5ldyBOb2RlSW5qZWN0b3IobnVsbCwgdGhpcy5faG9zdFZpZXcpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNsZWFyKCk6IHZvaWQge1xuICAgICAgICB3aGlsZSAodGhpcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgdGhpcy5yZW1vdmUodGhpcy5sZW5ndGggLSAxKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBnZXQoaW5kZXg6IG51bWJlcik6IHZpZXdFbmdpbmVfVmlld1JlZnxudWxsIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2xDb250YWluZXJbVklFV19SRUZTXSAhPT0gbnVsbCAmJiB0aGlzLl9sQ29udGFpbmVyW1ZJRVdfUkVGU10hW2luZGV4XSB8fCBudWxsO1xuICAgICAgfVxuXG4gICAgICBnZXQgbGVuZ3RoKCk6IG51bWJlciB7XG4gICAgICAgIHJldHVybiB0aGlzLl9sQ29udGFpbmVyLmxlbmd0aCAtIENPTlRBSU5FUl9IRUFERVJfT0ZGU0VUO1xuICAgICAgfVxuXG4gICAgICBjcmVhdGVFbWJlZGRlZFZpZXc8Qz4odGVtcGxhdGVSZWY6IFZpZXdFbmdpbmVfVGVtcGxhdGVSZWY8Qz4sIGNvbnRleHQ/OiBDLCBpbmRleD86IG51bWJlcik6XG4gICAgICAgICAgdmlld0VuZ2luZV9FbWJlZGRlZFZpZXdSZWY8Qz4ge1xuICAgICAgICBjb25zdCB2aWV3UmVmID0gdGVtcGxhdGVSZWYuY3JlYXRlRW1iZWRkZWRWaWV3KGNvbnRleHQgfHwgPGFueT57fSk7XG4gICAgICAgIHRoaXMuaW5zZXJ0KHZpZXdSZWYsIGluZGV4KTtcbiAgICAgICAgcmV0dXJuIHZpZXdSZWY7XG4gICAgICB9XG5cbiAgICAgIGNyZWF0ZUNvbXBvbmVudDxDPihcbiAgICAgICAgICBjb21wb25lbnRGYWN0b3J5OiB2aWV3RW5naW5lX0NvbXBvbmVudEZhY3Rvcnk8Qz4sIGluZGV4PzogbnVtYmVyfHVuZGVmaW5lZCxcbiAgICAgICAgICBpbmplY3Rvcj86IEluamVjdG9yfHVuZGVmaW5lZCwgcHJvamVjdGFibGVOb2Rlcz86IGFueVtdW118dW5kZWZpbmVkLFxuICAgICAgICAgIG5nTW9kdWxlUmVmPzogdmlld0VuZ2luZV9OZ01vZHVsZVJlZjxhbnk+fHVuZGVmaW5lZCk6IHZpZXdFbmdpbmVfQ29tcG9uZW50UmVmPEM+IHtcbiAgICAgICAgY29uc3QgY29udGV4dEluamVjdG9yID0gaW5qZWN0b3IgfHwgdGhpcy5wYXJlbnRJbmplY3RvcjtcbiAgICAgICAgaWYgKCFuZ01vZHVsZVJlZiAmJiAoY29tcG9uZW50RmFjdG9yeSBhcyBhbnkpLm5nTW9kdWxlID09IG51bGwgJiYgY29udGV4dEluamVjdG9yKSB7XG4gICAgICAgICAgLy8gRE8gTk9UIFJFRkFDVE9SLiBUaGUgY29kZSBoZXJlIHVzZWQgdG8gaGF2ZSBhIGB2YWx1ZSB8fCB1bmRlZmluZWRgIGV4cHJlc3Npb25cbiAgICAgICAgICAvLyB3aGljaCBzZWVtcyB0byBjYXVzZSBpbnRlcm5hbCBnb29nbGUgYXBwcyB0byBmYWlsLiBUaGlzIGlzIGRvY3VtZW50ZWQgaW4gdGhlXG4gICAgICAgICAgLy8gZm9sbG93aW5nIGludGVybmFsIGJ1ZyBpc3N1ZTogZ28vYi8xNDI5Njc4MDJcbiAgICAgICAgICBjb25zdCByZXN1bHQgPSBjb250ZXh0SW5qZWN0b3IuZ2V0KHZpZXdFbmdpbmVfTmdNb2R1bGVSZWYsIG51bGwpO1xuICAgICAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgICAgIG5nTW9kdWxlUmVmID0gcmVzdWx0O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNvbXBvbmVudFJlZiA9XG4gICAgICAgICAgICBjb21wb25lbnRGYWN0b3J5LmNyZWF0ZShjb250ZXh0SW5qZWN0b3IsIHByb2plY3RhYmxlTm9kZXMsIHVuZGVmaW5lZCwgbmdNb2R1bGVSZWYpO1xuICAgICAgICB0aGlzLmluc2VydChjb21wb25lbnRSZWYuaG9zdFZpZXcsIGluZGV4KTtcbiAgICAgICAgcmV0dXJuIGNvbXBvbmVudFJlZjtcbiAgICAgIH1cblxuICAgICAgaW5zZXJ0KHZpZXdSZWY6IHZpZXdFbmdpbmVfVmlld1JlZiwgaW5kZXg/OiBudW1iZXIpOiB2aWV3RW5naW5lX1ZpZXdSZWYge1xuICAgICAgICBjb25zdCBsVmlldyA9ICh2aWV3UmVmIGFzIFZpZXdSZWY8YW55PikuX2xWaWV3ITtcbiAgICAgICAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG5cbiAgICAgICAgaWYgKHZpZXdSZWYuZGVzdHJveWVkKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgaW5zZXJ0IGEgZGVzdHJveWVkIFZpZXcgaW4gYSBWaWV3Q29udGFpbmVyIScpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5hbGxvY2F0ZUNvbnRhaW5lcklmTmVlZGVkKCk7XG5cbiAgICAgICAgaWYgKHZpZXdBdHRhY2hlZFRvQ29udGFpbmVyKGxWaWV3KSkge1xuICAgICAgICAgIC8vIElmIHZpZXcgaXMgYWxyZWFkeSBhdHRhY2hlZCwgZGV0YWNoIGl0IGZpcnN0IHNvIHdlIGNsZWFuIHVwIHJlZmVyZW5jZXMgYXBwcm9wcmlhdGVseS5cblxuICAgICAgICAgIGNvbnN0IHByZXZJZHggPSB0aGlzLmluZGV4T2Yodmlld1JlZik7XG5cbiAgICAgICAgICAvLyBBIHZpZXcgbWlnaHQgYmUgYXR0YWNoZWQgZWl0aGVyIHRvIHRoaXMgb3IgYSBkaWZmZXJlbnQgY29udGFpbmVyLiBUaGUgYHByZXZJZHhgIGZvclxuICAgICAgICAgIC8vIHRob3NlIGNhc2VzIHdpbGwgYmU6XG4gICAgICAgICAgLy8gZXF1YWwgdG8gLTEgZm9yIHZpZXdzIGF0dGFjaGVkIHRvIHRoaXMgVmlld0NvbnRhaW5lclJlZlxuICAgICAgICAgIC8vID49IDAgZm9yIHZpZXdzIGF0dGFjaGVkIHRvIGEgZGlmZmVyZW50IFZpZXdDb250YWluZXJSZWZcbiAgICAgICAgICBpZiAocHJldklkeCAhPT0gLTEpIHtcbiAgICAgICAgICAgIHRoaXMuZGV0YWNoKHByZXZJZHgpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBwcmV2TENvbnRhaW5lciA9IGxWaWV3W1BBUkVOVF0gYXMgTENvbnRhaW5lcjtcbiAgICAgICAgICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICAgICAgICAgIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICAgICAgICBpc0xDb250YWluZXIocHJldkxDb250YWluZXIpLCB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAnQW4gYXR0YWNoZWQgdmlldyBzaG91bGQgaGF2ZSBpdHMgUEFSRU5UIHBvaW50IHRvIGEgY29udGFpbmVyLicpO1xuXG5cbiAgICAgICAgICAgIC8vIFdlIG5lZWQgdG8gcmUtY3JlYXRlIGEgUjNWaWV3Q29udGFpbmVyUmVmIGluc3RhbmNlIHNpbmNlIHRob3NlIGFyZSBub3Qgc3RvcmVkIG9uXG4gICAgICAgICAgICAvLyBMVmlldyAobm9yIGFueXdoZXJlIGVsc2UpLlxuICAgICAgICAgICAgY29uc3QgcHJldlZDUmVmID0gbmV3IFIzVmlld0NvbnRhaW5lclJlZihcbiAgICAgICAgICAgICAgICBwcmV2TENvbnRhaW5lciwgcHJldkxDb250YWluZXJbVF9IT1NUXSBhcyBURGlyZWN0aXZlSG9zdE5vZGUsXG4gICAgICAgICAgICAgICAgcHJldkxDb250YWluZXJbUEFSRU5UXSk7XG5cbiAgICAgICAgICAgIHByZXZWQ1JlZi5kZXRhY2gocHJldlZDUmVmLmluZGV4T2Yodmlld1JlZikpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIExvZ2ljYWwgb3BlcmF0aW9uIG9mIGFkZGluZyBgTFZpZXdgIHRvIGBMQ29udGFpbmVyYFxuICAgICAgICBjb25zdCBhZGp1c3RlZElkeCA9IHRoaXMuX2FkanVzdEluZGV4KGluZGV4KTtcbiAgICAgICAgY29uc3QgbENvbnRhaW5lciA9IHRoaXMuX2xDb250YWluZXI7XG4gICAgICAgIGluc2VydFZpZXcodFZpZXcsIGxWaWV3LCBsQ29udGFpbmVyLCBhZGp1c3RlZElkeCk7XG5cbiAgICAgICAgLy8gUGh5c2ljYWwgb3BlcmF0aW9uIG9mIGFkZGluZyB0aGUgRE9NIG5vZGVzLlxuICAgICAgICBjb25zdCBiZWZvcmVOb2RlID0gZ2V0QmVmb3JlTm9kZUZvclZpZXcoYWRqdXN0ZWRJZHgsIGxDb250YWluZXIpO1xuICAgICAgICBjb25zdCByZW5kZXJlciA9IGxWaWV3W1JFTkRFUkVSXTtcbiAgICAgICAgY29uc3QgcGFyZW50Uk5vZGUgPSBuYXRpdmVQYXJlbnROb2RlKHJlbmRlcmVyLCBsQ29udGFpbmVyW05BVElWRV0gYXMgUkVsZW1lbnQgfCBSQ29tbWVudCk7XG4gICAgICAgIGlmIChwYXJlbnRSTm9kZSAhPT0gbnVsbCkge1xuICAgICAgICAgIGFkZFZpZXdUb0NvbnRhaW5lcih0VmlldywgbENvbnRhaW5lcltUX0hPU1RdLCByZW5kZXJlciwgbFZpZXcsIHBhcmVudFJOb2RlLCBiZWZvcmVOb2RlKTtcbiAgICAgICAgfVxuXG4gICAgICAgICh2aWV3UmVmIGFzIFZpZXdSZWY8YW55PikuYXR0YWNoVG9WaWV3Q29udGFpbmVyUmVmKHRoaXMpO1xuICAgICAgICBhZGRUb0FycmF5KGxDb250YWluZXJbVklFV19SRUZTXSEsIGFkanVzdGVkSWR4LCB2aWV3UmVmKTtcblxuICAgICAgICByZXR1cm4gdmlld1JlZjtcbiAgICAgIH1cblxuICAgICAgbW92ZSh2aWV3UmVmOiB2aWV3RW5naW5lX1ZpZXdSZWYsIG5ld0luZGV4OiBudW1iZXIpOiB2aWV3RW5naW5lX1ZpZXdSZWYge1xuICAgICAgICBpZiAodmlld1JlZi5kZXN0cm95ZWQpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBtb3ZlIGEgZGVzdHJveWVkIFZpZXcgaW4gYSBWaWV3Q29udGFpbmVyIScpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLmluc2VydCh2aWV3UmVmLCBuZXdJbmRleCk7XG4gICAgICB9XG5cbiAgICAgIGluZGV4T2Yodmlld1JlZjogdmlld0VuZ2luZV9WaWV3UmVmKTogbnVtYmVyIHtcbiAgICAgICAgY29uc3Qgdmlld1JlZnNBcnIgPSB0aGlzLl9sQ29udGFpbmVyW1ZJRVdfUkVGU107XG4gICAgICAgIHJldHVybiB2aWV3UmVmc0FyciAhPT0gbnVsbCA/IHZpZXdSZWZzQXJyLmluZGV4T2Yodmlld1JlZikgOiAtMTtcbiAgICAgIH1cblxuICAgICAgcmVtb3ZlKGluZGV4PzogbnVtYmVyKTogdm9pZCB7XG4gICAgICAgIHRoaXMuYWxsb2NhdGVDb250YWluZXJJZk5lZWRlZCgpO1xuICAgICAgICBjb25zdCBhZGp1c3RlZElkeCA9IHRoaXMuX2FkanVzdEluZGV4KGluZGV4LCAtMSk7XG4gICAgICAgIGNvbnN0IGRldGFjaGVkVmlldyA9IGRldGFjaFZpZXcodGhpcy5fbENvbnRhaW5lciwgYWRqdXN0ZWRJZHgpO1xuXG4gICAgICAgIGlmIChkZXRhY2hlZFZpZXcpIHtcbiAgICAgICAgICAvLyBCZWZvcmUgZGVzdHJveWluZyB0aGUgdmlldywgcmVtb3ZlIGl0IGZyb20gdGhlIGNvbnRhaW5lcidzIGFycmF5IG9mIGBWaWV3UmVmYHMuXG4gICAgICAgICAgLy8gVGhpcyBlbnN1cmVzIHRoZSB2aWV3IGNvbnRhaW5lciBsZW5ndGggaXMgdXBkYXRlZCBiZWZvcmUgY2FsbGluZ1xuICAgICAgICAgIC8vIGBkZXN0cm95TFZpZXdgLCB3aGljaCBjb3VsZCByZWN1cnNpdmVseSBjYWxsIHZpZXcgY29udGFpbmVyIG1ldGhvZHMgdGhhdFxuICAgICAgICAgIC8vIHJlbHkgb24gYW4gYWNjdXJhdGUgY29udGFpbmVyIGxlbmd0aC5cbiAgICAgICAgICAvLyAoZS5nLiBhIG1ldGhvZCBvbiB0aGlzIHZpZXcgY29udGFpbmVyIGJlaW5nIGNhbGxlZCBieSBhIGNoaWxkIGRpcmVjdGl2ZSdzIE9uRGVzdHJveVxuICAgICAgICAgIC8vIGxpZmVjeWNsZSBob29rKVxuICAgICAgICAgIHJlbW92ZUZyb21BcnJheSh0aGlzLl9sQ29udGFpbmVyW1ZJRVdfUkVGU10hLCBhZGp1c3RlZElkeCk7XG4gICAgICAgICAgZGVzdHJveUxWaWV3KGRldGFjaGVkVmlld1tUVklFV10sIGRldGFjaGVkVmlldyk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZGV0YWNoKGluZGV4PzogbnVtYmVyKTogdmlld0VuZ2luZV9WaWV3UmVmfG51bGwge1xuICAgICAgICB0aGlzLmFsbG9jYXRlQ29udGFpbmVySWZOZWVkZWQoKTtcbiAgICAgICAgY29uc3QgYWRqdXN0ZWRJZHggPSB0aGlzLl9hZGp1c3RJbmRleChpbmRleCwgLTEpO1xuICAgICAgICBjb25zdCB2aWV3ID0gZGV0YWNoVmlldyh0aGlzLl9sQ29udGFpbmVyLCBhZGp1c3RlZElkeCk7XG5cbiAgICAgICAgY29uc3Qgd2FzRGV0YWNoZWQgPVxuICAgICAgICAgICAgdmlldyAmJiByZW1vdmVGcm9tQXJyYXkodGhpcy5fbENvbnRhaW5lcltWSUVXX1JFRlNdISwgYWRqdXN0ZWRJZHgpICE9IG51bGw7XG4gICAgICAgIHJldHVybiB3YXNEZXRhY2hlZCA/IG5ldyBWaWV3UmVmKHZpZXchKSA6IG51bGw7XG4gICAgICB9XG5cbiAgICAgIHByaXZhdGUgX2FkanVzdEluZGV4KGluZGV4PzogbnVtYmVyLCBzaGlmdDogbnVtYmVyID0gMCkge1xuICAgICAgICBpZiAoaW5kZXggPT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiB0aGlzLmxlbmd0aCArIHNoaWZ0O1xuICAgICAgICB9XG4gICAgICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgICAgICBhc3NlcnRHcmVhdGVyVGhhbihpbmRleCwgLTEsIGBWaWV3UmVmIGluZGV4IG11c3QgYmUgcG9zaXRpdmUsIGdvdCAke2luZGV4fWApO1xuICAgICAgICAgIC8vICsxIGJlY2F1c2UgaXQncyBsZWdhbCB0byBpbnNlcnQgYXQgdGhlIGVuZC5cbiAgICAgICAgICBhc3NlcnRMZXNzVGhhbihpbmRleCwgdGhpcy5sZW5ndGggKyAxICsgc2hpZnQsICdpbmRleCcpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpbmRleDtcbiAgICAgIH1cblxuICAgICAgcHJpdmF0ZSBhbGxvY2F0ZUNvbnRhaW5lcklmTmVlZGVkKCk6IHZvaWQge1xuICAgICAgICBpZiAodGhpcy5fbENvbnRhaW5lcltWSUVXX1JFRlNdID09PSBudWxsKSB7XG4gICAgICAgICAgdGhpcy5fbENvbnRhaW5lcltWSUVXX1JFRlNdID0gW107XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydFROb2RlVHlwZShob3N0VE5vZGUsIFROb2RlVHlwZS5BbnlDb250YWluZXIgfCBUTm9kZVR5cGUuQW55Uk5vZGUpO1xuXG4gIGxldCBsQ29udGFpbmVyOiBMQ29udGFpbmVyO1xuICBjb25zdCBzbG90VmFsdWUgPSBob3N0Vmlld1tob3N0VE5vZGUuaW5kZXhdO1xuICBpZiAoaXNMQ29udGFpbmVyKHNsb3RWYWx1ZSkpIHtcbiAgICAvLyBJZiB0aGUgaG9zdCBpcyBhIGNvbnRhaW5lciwgd2UgZG9uJ3QgbmVlZCB0byBjcmVhdGUgYSBuZXcgTENvbnRhaW5lclxuICAgIGxDb250YWluZXIgPSBzbG90VmFsdWU7XG4gIH0gZWxzZSB7XG4gICAgbGV0IGNvbW1lbnROb2RlOiBSQ29tbWVudDtcbiAgICAvLyBJZiB0aGUgaG9zdCBpcyBhbiBlbGVtZW50IGNvbnRhaW5lciwgdGhlIG5hdGl2ZSBob3N0IGVsZW1lbnQgaXMgZ3VhcmFudGVlZCB0byBiZSBhXG4gICAgLy8gY29tbWVudCBhbmQgd2UgY2FuIHJldXNlIHRoYXQgY29tbWVudCBhcyBhbmNob3IgZWxlbWVudCBmb3IgdGhlIG5ldyBMQ29udGFpbmVyLlxuICAgIC8vIFRoZSBjb21tZW50IG5vZGUgaW4gcXVlc3Rpb24gaXMgYWxyZWFkeSBwYXJ0IG9mIHRoZSBET00gc3RydWN0dXJlIHNvIHdlIGRvbid0IG5lZWQgdG8gYXBwZW5kXG4gICAgLy8gaXQgYWdhaW4uXG4gICAgaWYgKGhvc3RUTm9kZS50eXBlICYgVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpIHtcbiAgICAgIGNvbW1lbnROb2RlID0gdW53cmFwUk5vZGUoc2xvdFZhbHVlKSBhcyBSQ29tbWVudDtcbiAgICB9IGVsc2Uge1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckNyZWF0ZUNvbW1lbnQrKztcbiAgICAgIGNvbW1lbnROb2RlID0gaG9zdFZpZXdbUkVOREVSRVJdLmNyZWF0ZUNvbW1lbnQobmdEZXZNb2RlID8gJ2NvbnRhaW5lcicgOiAnJyk7XG5cbiAgICAgIC8vIEEgYFZpZXdDb250YWluZXJSZWZgIGNhbiBiZSBpbmplY3RlZCBieSB0aGUgcm9vdCAodG9wbW9zdCAvIGJvb3RzdHJhcHBlZCkgY29tcG9uZW50LiBJblxuICAgICAgLy8gdGhpcyBjYXNlIHdlIGNhbid0IHVzZSBUVmlldyAvIFROb2RlIGRhdGEgc3RydWN0dXJlcyB0byBpbnNlcnQgY29udGFpbmVyJ3MgbWFya2VyIG5vZGVcbiAgICAgIC8vIChib3RoIGEgcGFyZW50IG9mIGEgY29tbWVudCBub2RlIGFuZCB0aGUgY29tbWVudCBub2RlIGl0c2VsZiBhcmUgbm90IHBhcnQgb2YgYW55IHZpZXcpLiBJblxuICAgICAgLy8gdGhpcyBzcGVjaWZpYyBjYXNlIHdlIHVzZSBsb3ctbGV2ZWwgRE9NIG1hbmlwdWxhdGlvbiB0byBpbnNlcnQgY29udGFpbmVyJ3MgbWFya2VyIChjb21tZW50KVxuICAgICAgLy8gbm9kZS5cbiAgICAgIGlmIChpc1Jvb3RWaWV3KGhvc3RWaWV3KSkge1xuICAgICAgICBjb25zdCByZW5kZXJlciA9IGhvc3RWaWV3W1JFTkRFUkVSXTtcbiAgICAgICAgY29uc3QgaG9zdE5hdGl2ZSA9IGdldE5hdGl2ZUJ5VE5vZGUoaG9zdFROb2RlLCBob3N0VmlldykhO1xuICAgICAgICBjb25zdCBwYXJlbnRPZkhvc3ROYXRpdmUgPSBuYXRpdmVQYXJlbnROb2RlKHJlbmRlcmVyLCBob3N0TmF0aXZlKTtcbiAgICAgICAgbmF0aXZlSW5zZXJ0QmVmb3JlKFxuICAgICAgICAgICAgcmVuZGVyZXIsIHBhcmVudE9mSG9zdE5hdGl2ZSEsIGNvbW1lbnROb2RlLCBuYXRpdmVOZXh0U2libGluZyhyZW5kZXJlciwgaG9zdE5hdGl2ZSksXG4gICAgICAgICAgICBmYWxzZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBUaGUgVE5vZGUgY3JlYXRlZCBoZXJlIGlzIGJvZ3VzLCBpbiB0aGF0IGl0IGlzIG5vdCBhZGRlZCB0byB0aGUgVFZpZXcuIEl0IGlzIG9ubHkgY3JlYXRlZFxuICAgICAgICAvLyB0byBhbGxvdyB1cyB0byBjcmVhdGUgYSBkeW5hbWljIENvbW1lbnQgbm9kZS5cbiAgICAgICAgY29uc3QgY29tbWVudFROb2RlID1cbiAgICAgICAgICAgIGNyZWF0ZVROb2RlKGhvc3RWaWV3W1RWSUVXXSwgaG9zdFROb2RlLnBhcmVudCwgVE5vZGVUeXBlLkNvbnRhaW5lciwgMCwgbnVsbCwgbnVsbCk7XG4gICAgICAgIGFwcGVuZENoaWxkKGhvc3RWaWV3W1RWSUVXXSwgaG9zdFZpZXcsIGNvbW1lbnROb2RlLCBjb21tZW50VE5vZGUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGhvc3RWaWV3W2hvc3RUTm9kZS5pbmRleF0gPSBsQ29udGFpbmVyID1cbiAgICAgICAgY3JlYXRlTENvbnRhaW5lcihzbG90VmFsdWUsIGhvc3RWaWV3LCBjb21tZW50Tm9kZSwgaG9zdFROb2RlKTtcblxuICAgIGFkZFRvVmlld1RyZWUoaG9zdFZpZXcsIGxDb250YWluZXIpO1xuICB9XG5cbiAgcmV0dXJuIG5ldyBSM1ZpZXdDb250YWluZXJSZWYobENvbnRhaW5lciwgaG9zdFROb2RlLCBob3N0Vmlldyk7XG59XG5cblxuLyoqIFJldHVybnMgYSBDaGFuZ2VEZXRlY3RvclJlZiAoYS5rLmEuIGEgVmlld1JlZikgKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RDaGFuZ2VEZXRlY3RvclJlZihpc1BpcGUgPSBmYWxzZSk6IFZpZXdFbmdpbmVfQ2hhbmdlRGV0ZWN0b3JSZWYge1xuICByZXR1cm4gY3JlYXRlVmlld1JlZihnZXRDdXJyZW50VE5vZGUoKSEsIGdldExWaWV3KCksIGlzUGlwZSk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIFZpZXdSZWYgYW5kIHN0b3JlcyBpdCBvbiB0aGUgaW5qZWN0b3IgYXMgQ2hhbmdlRGV0ZWN0b3JSZWYgKHB1YmxpYyBhbGlhcykuXG4gKlxuICogQHBhcmFtIHROb2RlIFRoZSBub2RlIHRoYXQgaXMgcmVxdWVzdGluZyBhIENoYW5nZURldGVjdG9yUmVmXG4gKiBAcGFyYW0gbFZpZXcgVGhlIHZpZXcgdG8gd2hpY2ggdGhlIG5vZGUgYmVsb25nc1xuICogQHBhcmFtIGlzUGlwZSBXaGV0aGVyIHRoZSB2aWV3IGlzIGJlaW5nIGluamVjdGVkIGludG8gYSBwaXBlLlxuICogQHJldHVybnMgVGhlIENoYW5nZURldGVjdG9yUmVmIHRvIHVzZVxuICovXG5mdW5jdGlvbiBjcmVhdGVWaWV3UmVmKHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3LCBpc1BpcGU6IGJvb2xlYW4pOiBWaWV3RW5naW5lX0NoYW5nZURldGVjdG9yUmVmIHtcbiAgLy8gYGlzQ29tcG9uZW50Vmlld2Agd2lsbCBiZSB0cnVlIGZvciBDb21wb25lbnQgYW5kIERpcmVjdGl2ZXMgKGJ1dCBub3QgZm9yIFBpcGVzKS5cbiAgLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2FuZ3VsYXIvcHVsbC8zMzA3MiBmb3IgcHJvcGVyIGZpeFxuICBjb25zdCBpc0NvbXBvbmVudFZpZXcgPSAhaXNQaXBlICYmIGlzQ29tcG9uZW50SG9zdCh0Tm9kZSk7XG4gIGlmIChpc0NvbXBvbmVudFZpZXcpIHtcbiAgICAvLyBUaGUgTFZpZXcgcmVwcmVzZW50cyB0aGUgbG9jYXRpb24gd2hlcmUgdGhlIGNvbXBvbmVudCBpcyBkZWNsYXJlZC5cbiAgICAvLyBJbnN0ZWFkIHdlIHdhbnQgdGhlIExWaWV3IGZvciB0aGUgY29tcG9uZW50IFZpZXcgYW5kIHNvIHdlIG5lZWQgdG8gbG9vayBpdCB1cC5cbiAgICBjb25zdCBjb21wb25lbnRWaWV3ID0gZ2V0Q29tcG9uZW50TFZpZXdCeUluZGV4KHROb2RlLmluZGV4LCBsVmlldyk7ICAvLyBsb29rIGRvd25cbiAgICByZXR1cm4gbmV3IFZpZXdSZWYoY29tcG9uZW50VmlldywgY29tcG9uZW50Vmlldyk7XG4gIH0gZWxzZSBpZiAodE5vZGUudHlwZSAmIChUTm9kZVR5cGUuQW55Uk5vZGUgfCBUTm9kZVR5cGUuQW55Q29udGFpbmVyIHwgVE5vZGVUeXBlLkljdSkpIHtcbiAgICAvLyBUaGUgTFZpZXcgcmVwcmVzZW50cyB0aGUgbG9jYXRpb24gd2hlcmUgdGhlIGluamVjdGlvbiBpcyByZXF1ZXN0ZWQgZnJvbS5cbiAgICAvLyBXZSBuZWVkIHRvIGxvY2F0ZSB0aGUgY29udGFpbmluZyBMVmlldyAoaW4gY2FzZSB3aGVyZSB0aGUgYGxWaWV3YCBpcyBhbiBlbWJlZGRlZCB2aWV3KVxuICAgIGNvbnN0IGhvc3RDb21wb25lbnRWaWV3ID0gbFZpZXdbREVDTEFSQVRJT05fQ09NUE9ORU5UX1ZJRVddOyAgLy8gbG9vayB1cFxuICAgIHJldHVybiBuZXcgVmlld1JlZihob3N0Q29tcG9uZW50VmlldywgbFZpZXcpO1xuICB9XG4gIHJldHVybiBudWxsITtcbn1cblxuLyoqIFJldHVybnMgYSBSZW5kZXJlcjIgKG9yIHRocm93cyB3aGVuIGFwcGxpY2F0aW9uIHdhcyBib290c3RyYXBwZWQgd2l0aCBSZW5kZXJlcjMpICovXG5mdW5jdGlvbiBnZXRPckNyZWF0ZVJlbmRlcmVyMih2aWV3OiBMVmlldyk6IFJlbmRlcmVyMiB7XG4gIGNvbnN0IHJlbmRlcmVyID0gdmlld1tSRU5ERVJFUl07XG4gIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICByZXR1cm4gcmVuZGVyZXIgYXMgUmVuZGVyZXIyO1xuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGluamVjdCBSZW5kZXJlcjIgd2hlbiB0aGUgYXBwbGljYXRpb24gdXNlcyBSZW5kZXJlcjMhJyk7XG4gIH1cbn1cblxuLyoqIEluamVjdHMgYSBSZW5kZXJlcjIgZm9yIHRoZSBjdXJyZW50IGNvbXBvbmVudC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RSZW5kZXJlcjIoKTogUmVuZGVyZXIyIHtcbiAgLy8gV2UgbmVlZCB0aGUgUmVuZGVyZXIgdG8gYmUgYmFzZWQgb24gdGhlIGNvbXBvbmVudCB0aGF0IGl0J3MgYmVpbmcgaW5qZWN0ZWQgaW50bywgaG93ZXZlciBzaW5jZVxuICAvLyBESSBoYXBwZW5zIGJlZm9yZSB3ZSd2ZSBlbnRlcmVkIGl0cyB2aWV3LCBgZ2V0TFZpZXdgIHdpbGwgcmV0dXJuIHRoZSBwYXJlbnQgdmlldyBpbnN0ZWFkLlxuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkhO1xuICBjb25zdCBub2RlQXRJbmRleCA9IGdldENvbXBvbmVudExWaWV3QnlJbmRleCh0Tm9kZS5pbmRleCwgbFZpZXcpO1xuICByZXR1cm4gZ2V0T3JDcmVhdGVSZW5kZXJlcjIoaXNMVmlldyhub2RlQXRJbmRleCkgPyBub2RlQXRJbmRleCA6IGxWaWV3KTtcbn1cbiJdfQ==