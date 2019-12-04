/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/render3/view_engine_compatibility.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { NgModuleRef as viewEngine_NgModuleRef } from '../linker/ng_module_factory';
import { addToArray, removeFromArray } from '../util/array_utils';
import { assertDefined, assertEqual, assertGreaterThan, assertLessThan } from '../util/assert';
import { assertLContainer } from './assert';
import { NodeInjector, getParentInjectorLocation } from './di';
import { addToViewTree, createLContainer, createLView, renderView } from './instructions/shared';
import { CONTAINER_HEADER_OFFSET, VIEW_REFS } from './interfaces/container';
import { isProceduralRenderer } from './interfaces/renderer';
import { isComponentHost, isLContainer, isLView, isRootView } from './interfaces/type_checks';
import { DECLARATION_COMPONENT_VIEW, DECLARATION_LCONTAINER, PARENT, QUERIES, RENDERER, T_HOST } from './interfaces/view';
import { assertNodeOfPossibleTypes } from './node_assert';
import { addRemoveViewFromContainer, appendChild, detachView, getBeforeNodeForView, insertView, nativeInsertBefore, nativeNextSibling, nativeParentNode, removeView } from './node_manipulation';
import { getParentInjectorTNode } from './node_util';
import { getLView, getPreviousOrParentTNode } from './state';
import { getParentInjectorView, hasParentInjector } from './util/injector_utils';
import { getComponentLViewByIndex, getNativeByTNode, setLContainerActiveIndex, unwrapRNode, viewAttachedToContainer } from './util/view_utils';
import { ViewRef } from './view_ref';
/**
 * Creates an ElementRef from the most recent node.
 *
 * @param {?} ElementRefToken
 * @return {?} The ElementRef instance to use
 */
export function injectElementRef(ElementRefToken) {
    return createElementRef(ElementRefToken, getPreviousOrParentTNode(), getLView());
}
/** @type {?} */
let R3ElementRef;
/**
 * Creates an ElementRef given a node.
 *
 * @param {?} ElementRefToken The ElementRef type
 * @param {?} tNode The node for which you'd like an ElementRef
 * @param {?} view The view to which the node belongs
 * @return {?} The ElementRef instance to use
 */
export function createElementRef(ElementRefToken, tNode, view) {
    if (!R3ElementRef) {
        // TODO: Fix class name, should be ElementRef, but there appears to be a rollup bug
        R3ElementRef = class ElementRef_ extends ElementRefToken {
        };
    }
    return new R3ElementRef((/** @type {?} */ (getNativeByTNode(tNode, view))));
}
/** @type {?} */
let R3TemplateRef;
/**
 * Creates a TemplateRef given a node.
 *
 * @template T
 * @param {?} TemplateRefToken
 * @param {?} ElementRefToken
 * @return {?} The TemplateRef instance to use
 */
export function injectTemplateRef(TemplateRefToken, ElementRefToken) {
    return createTemplateRef(TemplateRefToken, ElementRefToken, getPreviousOrParentTNode(), getLView());
}
/**
 * Creates a TemplateRef and stores it on the injector.
 *
 * @template T
 * @param {?} TemplateRefToken The TemplateRef type
 * @param {?} ElementRefToken The ElementRef type
 * @param {?} hostTNode The node on which a TemplateRef is requested
 * @param {?} hostView The view to which the node belongs
 * @return {?} The TemplateRef instance or null if we can't create a TemplateRef on a given node type
 */
export function createTemplateRef(TemplateRefToken, ElementRefToken, hostTNode, hostView) {
    if (!R3TemplateRef) {
        // TODO: Fix class name, should be TemplateRef, but there appears to be a rollup bug
        R3TemplateRef = class TemplateRef_ extends TemplateRefToken {
            /**
             * @param {?} _declarationView
             * @param {?} _declarationTContainer
             * @param {?} elementRef
             */
            constructor(_declarationView, _declarationTContainer, elementRef) {
                super();
                this._declarationView = _declarationView;
                this._declarationTContainer = _declarationTContainer;
                this.elementRef = elementRef;
            }
            /**
             * @param {?} context
             * @return {?}
             */
            createEmbeddedView(context) {
                /** @type {?} */
                const embeddedTView = (/** @type {?} */ (this._declarationTContainer.tViews));
                /** @type {?} */
                const lView = createLView(this._declarationView, embeddedTView, context, 16 /* CheckAlways */, null, embeddedTView.node);
                /** @type {?} */
                const declarationLContainer = this._declarationView[this._declarationTContainer.index];
                ngDevMode && assertLContainer(declarationLContainer);
                lView[DECLARATION_LCONTAINER] = declarationLContainer;
                /** @type {?} */
                const declarationViewLQueries = this._declarationView[QUERIES];
                if (declarationViewLQueries !== null) {
                    lView[QUERIES] = declarationViewLQueries.createEmbeddedView(embeddedTView);
                }
                renderView(lView, embeddedTView, context);
                /** @type {?} */
                const viewRef = new ViewRef(lView);
                viewRef._tViewNode = (/** @type {?} */ (lView[T_HOST]));
                return viewRef;
            }
        };
    }
    if (hostTNode.type === 0 /* Container */) {
        ngDevMode && assertDefined(hostTNode.tViews, 'TView must be allocated');
        return new R3TemplateRef(hostView, (/** @type {?} */ (hostTNode)), createElementRef(ElementRefToken, hostTNode, hostView));
    }
    else {
        return null;
    }
}
/** @type {?} */
let R3ViewContainerRef;
/**
 * Creates a ViewContainerRef and stores it on the injector. Or, if the ViewContainerRef
 * already exists, retrieves the existing ViewContainerRef.
 *
 * @param {?} ViewContainerRefToken
 * @param {?} ElementRefToken
 * @return {?} The ViewContainerRef instance to use
 */
export function injectViewContainerRef(ViewContainerRefToken, ElementRefToken) {
    /** @type {?} */
    const previousTNode = (/** @type {?} */ (getPreviousOrParentTNode()));
    return createContainerRef(ViewContainerRefToken, ElementRefToken, previousTNode, getLView());
}
/**
 * Creates a ViewContainerRef and stores it on the injector.
 *
 * @param {?} ViewContainerRefToken The ViewContainerRef type
 * @param {?} ElementRefToken The ElementRef type
 * @param {?} hostTNode The node that is requesting a ViewContainerRef
 * @param {?} hostView The view to which the node belongs
 * @return {?} The ViewContainerRef instance to use
 */
export function createContainerRef(ViewContainerRefToken, ElementRefToken, hostTNode, hostView) {
    if (!R3ViewContainerRef) {
        // TODO: Fix class name, should be ViewContainerRef, but there appears to be a rollup bug
        R3ViewContainerRef = class ViewContainerRef_ extends ViewContainerRefToken {
            /**
             * @param {?} _lContainer
             * @param {?} _hostTNode
             * @param {?} _hostView
             */
            constructor(_lContainer, _hostTNode, _hostView) {
                super();
                this._lContainer = _lContainer;
                this._hostTNode = _hostTNode;
                this._hostView = _hostView;
            }
            /**
             * @return {?}
             */
            get element() {
                return createElementRef(ElementRefToken, this._hostTNode, this._hostView);
            }
            /**
             * @return {?}
             */
            get injector() { return new NodeInjector(this._hostTNode, this._hostView); }
            /**
             * @deprecated No replacement
             * @return {?}
             */
            get parentInjector() {
                /** @type {?} */
                const parentLocation = getParentInjectorLocation(this._hostTNode, this._hostView);
                /** @type {?} */
                const parentView = getParentInjectorView(parentLocation, this._hostView);
                /** @type {?} */
                const parentTNode = getParentInjectorTNode(parentLocation, this._hostView, this._hostTNode);
                return !hasParentInjector(parentLocation) || parentTNode == null ?
                    new NodeInjector(null, this._hostView) :
                    new NodeInjector(parentTNode, parentView);
            }
            /**
             * @return {?}
             */
            clear() {
                while (this.length > 0) {
                    this.remove(this.length - 1);
                }
            }
            /**
             * @param {?} index
             * @return {?}
             */
            get(index) {
                return this._lContainer[VIEW_REFS] !== null && (/** @type {?} */ (this._lContainer[VIEW_REFS]))[index] || null;
            }
            /**
             * @return {?}
             */
            get length() { return this._lContainer.length - CONTAINER_HEADER_OFFSET; }
            /**
             * @template C
             * @param {?} templateRef
             * @param {?=} context
             * @param {?=} index
             * @return {?}
             */
            createEmbeddedView(templateRef, context, index) {
                /** @type {?} */
                const viewRef = templateRef.createEmbeddedView(context || (/** @type {?} */ ({})));
                this.insert(viewRef, index);
                return viewRef;
            }
            /**
             * @template C
             * @param {?} componentFactory
             * @param {?=} index
             * @param {?=} injector
             * @param {?=} projectableNodes
             * @param {?=} ngModuleRef
             * @return {?}
             */
            createComponent(componentFactory, index, injector, projectableNodes, ngModuleRef) {
                /** @type {?} */
                const contextInjector = injector || this.parentInjector;
                if (!ngModuleRef && ((/** @type {?} */ (componentFactory))).ngModule == null && contextInjector) {
                    // DO NOT REFACTOR. The code here used to have a `value || undefined` expression
                    // which seems to cause internal google apps to fail. This is documented in the
                    // following internal bug issue: go/b/142967802
                    /** @type {?} */
                    const result = contextInjector.get(viewEngine_NgModuleRef, null);
                    if (result) {
                        ngModuleRef = result;
                    }
                }
                /** @type {?} */
                const componentRef = componentFactory.create(contextInjector, projectableNodes, undefined, ngModuleRef);
                this.insert(componentRef.hostView, index);
                return componentRef;
            }
            /**
             * @param {?} viewRef
             * @param {?=} index
             * @return {?}
             */
            insert(viewRef, index) {
                /** @type {?} */
                const lView = (/** @type {?} */ (((/** @type {?} */ (viewRef)))._lView));
                if (viewRef.destroyed) {
                    throw new Error('Cannot insert a destroyed View in a ViewContainer!');
                }
                this.allocateContainerIfNeeded();
                if (viewAttachedToContainer(lView)) {
                    // If view is already attached, detach it first so we clean up references appropriately.
                    /** @type {?} */
                    const prevIdx = this.indexOf(viewRef);
                    // A view might be attached either to this or a different container. The `prevIdx` for
                    // those cases will be:
                    // equal to -1 for views attached to this ViewContainerRef
                    // >= 0 for views attached to a different ViewContainerRef
                    if (prevIdx !== -1) {
                        this.detach(prevIdx);
                    }
                    else {
                        /** @type {?} */
                        const prevLContainer = (/** @type {?} */ (lView[PARENT]));
                        ngDevMode && assertEqual(isLContainer(prevLContainer), true, 'An attached view should have its PARENT point to a container.');
                        // We need to re-create a R3ViewContainerRef instance since those are not stored on
                        // LView (nor anywhere else).
                        /** @type {?} */
                        const prevVCRef = new R3ViewContainerRef(prevLContainer, (/** @type {?} */ (prevLContainer[T_HOST])), prevLContainer[PARENT]);
                        prevVCRef.detach(prevVCRef.indexOf(viewRef));
                    }
                }
                /** @type {?} */
                const adjustedIdx = this._adjustIndex(index);
                insertView(lView, this._lContainer, adjustedIdx);
                /** @type {?} */
                const beforeNode = getBeforeNodeForView(adjustedIdx, this._lContainer);
                addRemoveViewFromContainer(lView, true, beforeNode);
                ((/** @type {?} */ (viewRef))).attachToViewContainerRef(this);
                addToArray((/** @type {?} */ (this._lContainer[VIEW_REFS])), adjustedIdx, viewRef);
                return viewRef;
            }
            /**
             * @param {?} viewRef
             * @param {?} newIndex
             * @return {?}
             */
            move(viewRef, newIndex) {
                if (viewRef.destroyed) {
                    throw new Error('Cannot move a destroyed View in a ViewContainer!');
                }
                return this.insert(viewRef, newIndex);
            }
            /**
             * @param {?} viewRef
             * @return {?}
             */
            indexOf(viewRef) {
                /** @type {?} */
                const viewRefsArr = this._lContainer[VIEW_REFS];
                return viewRefsArr !== null ? viewRefsArr.indexOf(viewRef) : -1;
            }
            /**
             * @param {?=} index
             * @return {?}
             */
            remove(index) {
                this.allocateContainerIfNeeded();
                /** @type {?} */
                const adjustedIdx = this._adjustIndex(index, -1);
                removeView(this._lContainer, adjustedIdx);
                removeFromArray((/** @type {?} */ (this._lContainer[VIEW_REFS])), adjustedIdx);
            }
            /**
             * @param {?=} index
             * @return {?}
             */
            detach(index) {
                this.allocateContainerIfNeeded();
                /** @type {?} */
                const adjustedIdx = this._adjustIndex(index, -1);
                /** @type {?} */
                const view = detachView(this._lContainer, adjustedIdx);
                /** @type {?} */
                const wasDetached = view && removeFromArray((/** @type {?} */ (this._lContainer[VIEW_REFS])), adjustedIdx) != null;
                return wasDetached ? new ViewRef((/** @type {?} */ (view))) : null;
            }
            /**
             * @private
             * @param {?=} index
             * @param {?=} shift
             * @return {?}
             */
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
            /**
             * @private
             * @return {?}
             */
            allocateContainerIfNeeded() {
                if (this._lContainer[VIEW_REFS] === null) {
                    this._lContainer[VIEW_REFS] = [];
                }
            }
        };
    }
    ngDevMode && assertNodeOfPossibleTypes(hostTNode, 0 /* Container */, 3 /* Element */, 4 /* ElementContainer */);
    /** @type {?} */
    let lContainer;
    /** @type {?} */
    const slotValue = hostView[hostTNode.index];
    if (isLContainer(slotValue)) {
        // If the host is a container, we don't need to create a new LContainer
        lContainer = slotValue;
        setLContainerActiveIndex(lContainer, -1 /* DYNAMIC_EMBEDDED_VIEWS_ONLY */);
    }
    else {
        /** @type {?} */
        let commentNode;
        // If the host is an element container, the native host element is guaranteed to be a
        // comment and we can reuse that comment as anchor element for the new LContainer.
        // The comment node in question is already part of the DOM structure so we don't need to append
        // it again.
        if (hostTNode.type === 4 /* ElementContainer */) {
            commentNode = (/** @type {?} */ (unwrapRNode(slotValue)));
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
                /** @type {?} */
                const renderer = hostView[RENDERER];
                /** @type {?} */
                const hostNative = (/** @type {?} */ (getNativeByTNode(hostTNode, hostView)));
                /** @type {?} */
                const parentOfHostNative = nativeParentNode(renderer, hostNative);
                nativeInsertBefore(renderer, (/** @type {?} */ (parentOfHostNative)), commentNode, nativeNextSibling(renderer, hostNative));
            }
            else {
                appendChild(commentNode, hostTNode, hostView);
            }
        }
        hostView[hostTNode.index] = lContainer =
            createLContainer(slotValue, hostView, commentNode, hostTNode);
        addToViewTree(hostView, lContainer);
    }
    return new R3ViewContainerRef(lContainer, hostTNode, hostView);
}
/**
 * Returns a ChangeDetectorRef (a.k.a. a ViewRef)
 * @param {?=} isPipe
 * @return {?}
 */
export function injectChangeDetectorRef(isPipe = false) {
    return createViewRef(getPreviousOrParentTNode(), getLView(), isPipe);
}
/**
 * Creates a ViewRef and stores it on the injector as ChangeDetectorRef (public alias).
 *
 * @param {?} tNode The node that is requesting a ChangeDetectorRef
 * @param {?} lView The view to which the node belongs
 * @param {?} isPipe Whether the view is being injected into a pipe.
 * @return {?} The ChangeDetectorRef to use
 */
function createViewRef(tNode, lView, isPipe) {
    // `isComponentView` will be true for Component and Directives (but not for Pipes).
    // See https://github.com/angular/angular/pull/33072 for proper fix
    /** @type {?} */
    const isComponentView = !isPipe && isComponentHost(tNode);
    if (isComponentView) {
        // The LView represents the location where the component is declared.
        // Instead we want the LView for the component View and so we need to look it up.
        /** @type {?} */
        const componentView = getComponentLViewByIndex(tNode.index, lView);
        return new ViewRef(componentView, componentView);
    }
    else if (tNode.type === 3 /* Element */ || tNode.type === 0 /* Container */ ||
        tNode.type === 4 /* ElementContainer */ || tNode.type === 5 /* IcuContainer */) {
        // The LView represents the location where the injection is requested from.
        // We need to locate the containing LView (in case where the `lView` is an embedded view)
        /** @type {?} */
        const hostComponentView = lView[DECLARATION_COMPONENT_VIEW];
        return new ViewRef(hostComponentView, lView);
    }
    return (/** @type {?} */ (null));
}
/**
 * Returns a Renderer2 (or throws when application was bootstrapped with Renderer3)
 * @param {?} view
 * @return {?}
 */
function getOrCreateRenderer2(view) {
    /** @type {?} */
    const renderer = view[RENDERER];
    if (isProceduralRenderer(renderer)) {
        return (/** @type {?} */ (renderer));
    }
    else {
        throw new Error('Cannot inject Renderer2 when the application uses Renderer3!');
    }
}
/**
 * Injects a Renderer2 for the current component.
 * @return {?}
 */
export function injectRenderer2() {
    // We need the Renderer to be based on the component that it's being injected into, however since
    // DI happens before we've entered its view, `getLView` will return the parent view instead.
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const tNode = getPreviousOrParentTNode();
    /** @type {?} */
    const nodeAtIndex = getComponentLViewByIndex(tNode.index, lView);
    return getOrCreateRenderer2(isLView(nodeAtIndex) ? nodeAtIndex : lView);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld19lbmdpbmVfY29tcGF0aWJpbGl0eS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvdmlld19lbmdpbmVfY29tcGF0aWJpbGl0eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFZQSxPQUFPLEVBQUMsV0FBVyxJQUFJLHNCQUFzQixFQUFDLE1BQU0sNkJBQTZCLENBQUM7QUFLbEYsT0FBTyxFQUFDLFVBQVUsRUFBRSxlQUFlLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNoRSxPQUFPLEVBQUMsYUFBYSxFQUFFLFdBQVcsRUFBRSxpQkFBaUIsRUFBRSxjQUFjLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUU3RixPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDMUMsT0FBTyxFQUFDLFlBQVksRUFBRSx5QkFBeUIsRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUM3RCxPQUFPLEVBQUMsYUFBYSxFQUFFLGdCQUFnQixFQUFFLFdBQVcsRUFBRSxVQUFVLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUMvRixPQUFPLEVBQWtCLHVCQUF1QixFQUFjLFNBQVMsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBRXZHLE9BQU8sRUFBcUIsb0JBQW9CLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUMvRSxPQUFPLEVBQUMsZUFBZSxFQUFFLFlBQVksRUFBRSxPQUFPLEVBQUUsVUFBVSxFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFDNUYsT0FBTyxFQUFDLDBCQUEwQixFQUFFLHNCQUFzQixFQUFxQixNQUFNLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBUyxNQUFNLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNsSixPQUFPLEVBQUMseUJBQXlCLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDeEQsT0FBTyxFQUFDLDBCQUEwQixFQUFFLFdBQVcsRUFBRSxVQUFVLEVBQUUsb0JBQW9CLEVBQUUsVUFBVSxFQUFFLGtCQUFrQixFQUFFLGlCQUFpQixFQUFFLGdCQUFnQixFQUFFLFVBQVUsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQy9MLE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLGFBQWEsQ0FBQztBQUNuRCxPQUFPLEVBQUMsUUFBUSxFQUFFLHdCQUF3QixFQUFDLE1BQU0sU0FBUyxDQUFDO0FBQzNELE9BQU8sRUFBQyxxQkFBcUIsRUFBRSxpQkFBaUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQy9FLE9BQU8sRUFBQyx3QkFBd0IsRUFBRSxnQkFBZ0IsRUFBRSx3QkFBd0IsRUFBRSxXQUFXLEVBQUUsdUJBQXVCLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUM3SSxPQUFPLEVBQUMsT0FBTyxFQUFDLE1BQU0sWUFBWSxDQUFDOzs7Ozs7O0FBU25DLE1BQU0sVUFBVSxnQkFBZ0IsQ0FBQyxlQUE2QztJQUU1RSxPQUFPLGdCQUFnQixDQUFDLGVBQWUsRUFBRSx3QkFBd0IsRUFBRSxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUM7QUFDbkYsQ0FBQzs7SUFFRyxZQUF3RTs7Ozs7Ozs7O0FBVTVFLE1BQU0sVUFBVSxnQkFBZ0IsQ0FDNUIsZUFBNkMsRUFBRSxLQUFZLEVBQzNELElBQVc7SUFDYixJQUFJLENBQUMsWUFBWSxFQUFFO1FBQ2pCLG1GQUFtRjtRQUNuRixZQUFZLEdBQUcsTUFBTSxXQUFZLFNBQVEsZUFBZTtTQUFHLENBQUM7S0FDN0Q7SUFDRCxPQUFPLElBQUksWUFBWSxDQUFDLG1CQUFBLGdCQUFnQixDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsRUFBWSxDQUFDLENBQUM7QUFDckUsQ0FBQzs7SUFFRyxhQUdIOzs7Ozs7Ozs7QUFPRCxNQUFNLFVBQVUsaUJBQWlCLENBQzdCLGdCQUErQyxFQUMvQyxlQUE2QztJQUMvQyxPQUFPLGlCQUFpQixDQUNwQixnQkFBZ0IsRUFBRSxlQUFlLEVBQUUsd0JBQXdCLEVBQUUsRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDO0FBQ2pGLENBQUM7Ozs7Ozs7Ozs7O0FBV0QsTUFBTSxVQUFVLGlCQUFpQixDQUM3QixnQkFBK0MsRUFBRSxlQUE2QyxFQUM5RixTQUFnQixFQUFFLFFBQWU7SUFDbkMsSUFBSSxDQUFDLGFBQWEsRUFBRTtRQUNsQixvRkFBb0Y7UUFDcEYsYUFBYSxHQUFHLE1BQU0sWUFBZ0IsU0FBUSxnQkFBbUI7Ozs7OztZQUMvRCxZQUNZLGdCQUF1QixFQUFVLHNCQUFzQyxFQUN0RSxVQUFpQztnQkFDNUMsS0FBSyxFQUFFLENBQUM7Z0JBRkUscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFPO2dCQUFVLDJCQUFzQixHQUF0QixzQkFBc0IsQ0FBZ0I7Z0JBQ3RFLGVBQVUsR0FBVixVQUFVLENBQXVCO1lBRTlDLENBQUM7Ozs7O1lBRUQsa0JBQWtCLENBQUMsT0FBVTs7c0JBQ3JCLGFBQWEsR0FBRyxtQkFBQSxJQUFJLENBQUMsc0JBQXNCLENBQUMsTUFBTSxFQUFTOztzQkFDM0QsS0FBSyxHQUFHLFdBQVcsQ0FDckIsSUFBSSxDQUFDLGdCQUFnQixFQUFFLGFBQWEsRUFBRSxPQUFPLHdCQUEwQixJQUFJLEVBQzNFLGFBQWEsQ0FBQyxJQUFJLENBQUM7O3NCQUVqQixxQkFBcUIsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLEtBQUssQ0FBQztnQkFDdEYsU0FBUyxJQUFJLGdCQUFnQixDQUFDLHFCQUFxQixDQUFDLENBQUM7Z0JBQ3JELEtBQUssQ0FBQyxzQkFBc0IsQ0FBQyxHQUFHLHFCQUFxQixDQUFDOztzQkFFaEQsdUJBQXVCLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQztnQkFDOUQsSUFBSSx1QkFBdUIsS0FBSyxJQUFJLEVBQUU7b0JBQ3BDLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyx1QkFBdUIsQ0FBQyxrQkFBa0IsQ0FBQyxhQUFhLENBQUMsQ0FBQztpQkFDNUU7Z0JBRUQsVUFBVSxDQUFDLEtBQUssRUFBRSxhQUFhLEVBQUUsT0FBTyxDQUFDLENBQUM7O3NCQUVwQyxPQUFPLEdBQUcsSUFBSSxPQUFPLENBQUksS0FBSyxDQUFDO2dCQUNyQyxPQUFPLENBQUMsVUFBVSxHQUFHLG1CQUFBLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBYSxDQUFDO2dCQUNoRCxPQUFPLE9BQU8sQ0FBQztZQUNqQixDQUFDO1NBQ0YsQ0FBQztLQUNIO0lBRUQsSUFBSSxTQUFTLENBQUMsSUFBSSxzQkFBd0IsRUFBRTtRQUMxQyxTQUFTLElBQUksYUFBYSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUseUJBQXlCLENBQUMsQ0FBQztRQUN4RSxPQUFPLElBQUksYUFBYSxDQUNwQixRQUFRLEVBQUUsbUJBQUEsU0FBUyxFQUFrQixFQUNyQyxnQkFBZ0IsQ0FBQyxlQUFlLEVBQUUsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7S0FDN0Q7U0FBTTtRQUNMLE9BQU8sSUFBSSxDQUFDO0tBQ2I7QUFDSCxDQUFDOztJQUVHLGtCQUlIOzs7Ozs7Ozs7QUFRRCxNQUFNLFVBQVUsc0JBQXNCLENBQ2xDLHFCQUF5RCxFQUN6RCxlQUE2Qzs7VUFDekMsYUFBYSxHQUNmLG1CQUFBLHdCQUF3QixFQUFFLEVBQXlEO0lBQ3ZGLE9BQU8sa0JBQWtCLENBQUMscUJBQXFCLEVBQUUsZUFBZSxFQUFFLGFBQWEsRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDO0FBQy9GLENBQUM7Ozs7Ozs7Ozs7QUFXRCxNQUFNLFVBQVUsa0JBQWtCLENBQzlCLHFCQUF5RCxFQUN6RCxlQUE2QyxFQUM3QyxTQUE0RCxFQUM1RCxRQUFlO0lBQ2pCLElBQUksQ0FBQyxrQkFBa0IsRUFBRTtRQUN2Qix5RkFBeUY7UUFDekYsa0JBQWtCLEdBQUcsTUFBTSxpQkFBa0IsU0FBUSxxQkFBcUI7Ozs7OztZQUN4RSxZQUNZLFdBQXVCLEVBQ3ZCLFVBQTZELEVBQzdELFNBQWdCO2dCQUMxQixLQUFLLEVBQUUsQ0FBQztnQkFIRSxnQkFBVyxHQUFYLFdBQVcsQ0FBWTtnQkFDdkIsZUFBVSxHQUFWLFVBQVUsQ0FBbUQ7Z0JBQzdELGNBQVMsR0FBVCxTQUFTLENBQU87WUFFNUIsQ0FBQzs7OztZQUVELElBQUksT0FBTztnQkFDVCxPQUFPLGdCQUFnQixDQUFDLGVBQWUsRUFBRSxJQUFJLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUM1RSxDQUFDOzs7O1lBRUQsSUFBSSxRQUFRLEtBQWUsT0FBTyxJQUFJLFlBQVksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7Ozs7O1lBR3RGLElBQUksY0FBYzs7c0JBQ1YsY0FBYyxHQUFHLHlCQUF5QixDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQzs7c0JBQzNFLFVBQVUsR0FBRyxxQkFBcUIsQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQzs7c0JBQ2xFLFdBQVcsR0FBRyxzQkFBc0IsQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDO2dCQUUzRixPQUFPLENBQUMsaUJBQWlCLENBQUMsY0FBYyxDQUFDLElBQUksV0FBVyxJQUFJLElBQUksQ0FBQyxDQUFDO29CQUM5RCxJQUFJLFlBQVksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7b0JBQ3hDLElBQUksWUFBWSxDQUFDLFdBQVcsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUNoRCxDQUFDOzs7O1lBRUQsS0FBSztnQkFDSCxPQUFPLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO29CQUN0QixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7aUJBQzlCO1lBQ0gsQ0FBQzs7Ozs7WUFFRCxHQUFHLENBQUMsS0FBYTtnQkFDZixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLEtBQUssSUFBSSxJQUFJLG1CQUFBLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxJQUFJLENBQUM7WUFDOUYsQ0FBQzs7OztZQUVELElBQUksTUFBTSxLQUFhLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEdBQUcsdUJBQXVCLENBQUMsQ0FBQyxDQUFDOzs7Ozs7OztZQUVsRixrQkFBa0IsQ0FBSSxXQUFzQyxFQUFFLE9BQVcsRUFBRSxLQUFjOztzQkFFakYsT0FBTyxHQUFHLFdBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLElBQUksbUJBQUssRUFBRSxFQUFBLENBQUM7Z0JBQ2xFLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUM1QixPQUFPLE9BQU8sQ0FBQztZQUNqQixDQUFDOzs7Ozs7Ozs7O1lBRUQsZUFBZSxDQUNYLGdCQUFnRCxFQUFFLEtBQXdCLEVBQzFFLFFBQTZCLEVBQUUsZ0JBQW9DLEVBQ25FLFdBQW1EOztzQkFDL0MsZUFBZSxHQUFHLFFBQVEsSUFBSSxJQUFJLENBQUMsY0FBYztnQkFDdkQsSUFBSSxDQUFDLFdBQVcsSUFBSSxDQUFDLG1CQUFBLGdCQUFnQixFQUFPLENBQUMsQ0FBQyxRQUFRLElBQUksSUFBSSxJQUFJLGVBQWUsRUFBRTs7Ozs7MEJBSTNFLE1BQU0sR0FBRyxlQUFlLENBQUMsR0FBRyxDQUFDLHNCQUFzQixFQUFFLElBQUksQ0FBQztvQkFDaEUsSUFBSSxNQUFNLEVBQUU7d0JBQ1YsV0FBVyxHQUFHLE1BQU0sQ0FBQztxQkFDdEI7aUJBQ0Y7O3NCQUVLLFlBQVksR0FDZCxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsZUFBZSxFQUFFLGdCQUFnQixFQUFFLFNBQVMsRUFBRSxXQUFXLENBQUM7Z0JBQ3RGLElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDMUMsT0FBTyxZQUFZLENBQUM7WUFDdEIsQ0FBQzs7Ozs7O1lBRUQsTUFBTSxDQUFDLE9BQTJCLEVBQUUsS0FBYzs7c0JBQzFDLEtBQUssR0FBRyxtQkFBQSxDQUFDLG1CQUFBLE9BQU8sRUFBZ0IsQ0FBQyxDQUFDLE1BQU0sRUFBRTtnQkFFaEQsSUFBSSxPQUFPLENBQUMsU0FBUyxFQUFFO29CQUNyQixNQUFNLElBQUksS0FBSyxDQUFDLG9EQUFvRCxDQUFDLENBQUM7aUJBQ3ZFO2dCQUVELElBQUksQ0FBQyx5QkFBeUIsRUFBRSxDQUFDO2dCQUVqQyxJQUFJLHVCQUF1QixDQUFDLEtBQUssQ0FBQyxFQUFFOzs7MEJBRzVCLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQztvQkFFckMsc0ZBQXNGO29CQUN0Rix1QkFBdUI7b0JBQ3ZCLDBEQUEwRDtvQkFDMUQsMERBQTBEO29CQUMxRCxJQUFJLE9BQU8sS0FBSyxDQUFDLENBQUMsRUFBRTt3QkFDbEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztxQkFDdEI7eUJBQU07OzhCQUNDLGNBQWMsR0FBRyxtQkFBQSxLQUFLLENBQUMsTUFBTSxDQUFDLEVBQWM7d0JBQ2xELFNBQVMsSUFBSSxXQUFXLENBQ1AsWUFBWSxDQUFDLGNBQWMsQ0FBQyxFQUFFLElBQUksRUFDbEMsK0RBQStELENBQUMsQ0FBQzs7Ozs4QkFLNUUsU0FBUyxHQUFHLElBQUksa0JBQWtCLENBQ3BDLGNBQWMsRUFBRSxtQkFBQSxjQUFjLENBQUMsTUFBTSxDQUFDLEVBQXNCLEVBQzVELGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQzt3QkFFM0IsU0FBUyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7cUJBQzlDO2lCQUNGOztzQkFFSyxXQUFXLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUM7Z0JBQzVDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLFdBQVcsRUFBRSxXQUFXLENBQUMsQ0FBQzs7c0JBRTNDLFVBQVUsR0FBRyxvQkFBb0IsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQztnQkFDdEUsMEJBQTBCLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFFcEQsQ0FBQyxtQkFBQSxPQUFPLEVBQWdCLENBQUMsQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDekQsVUFBVSxDQUFDLG1CQUFBLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLEVBQUUsRUFBRSxXQUFXLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBRWhFLE9BQU8sT0FBTyxDQUFDO1lBQ2pCLENBQUM7Ozs7OztZQUVELElBQUksQ0FBQyxPQUEyQixFQUFFLFFBQWdCO2dCQUNoRCxJQUFJLE9BQU8sQ0FBQyxTQUFTLEVBQUU7b0JBQ3JCLE1BQU0sSUFBSSxLQUFLLENBQUMsa0RBQWtELENBQUMsQ0FBQztpQkFDckU7Z0JBQ0QsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQztZQUN4QyxDQUFDOzs7OztZQUVELE9BQU8sQ0FBQyxPQUEyQjs7c0JBQzNCLFdBQVcsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQztnQkFDL0MsT0FBTyxXQUFXLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNsRSxDQUFDOzs7OztZQUVELE1BQU0sQ0FBQyxLQUFjO2dCQUNuQixJQUFJLENBQUMseUJBQXlCLEVBQUUsQ0FBQzs7c0JBQzNCLFdBQVcsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDaEQsVUFBVSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsV0FBVyxDQUFDLENBQUM7Z0JBQzFDLGVBQWUsQ0FBQyxtQkFBQSxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxFQUFFLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDOUQsQ0FBQzs7Ozs7WUFFRCxNQUFNLENBQUMsS0FBYztnQkFDbkIsSUFBSSxDQUFDLHlCQUF5QixFQUFFLENBQUM7O3NCQUMzQixXQUFXLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7O3NCQUMxQyxJQUFJLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsV0FBVyxDQUFDOztzQkFFaEQsV0FBVyxHQUNiLElBQUksSUFBSSxlQUFlLENBQUMsbUJBQUEsSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsRUFBRSxFQUFFLFdBQVcsQ0FBQyxJQUFJLElBQUk7Z0JBQy9FLE9BQU8sV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxtQkFBQSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDbEQsQ0FBQzs7Ozs7OztZQUVPLFlBQVksQ0FBQyxLQUFjLEVBQUUsUUFBZ0IsQ0FBQztnQkFDcEQsSUFBSSxLQUFLLElBQUksSUFBSSxFQUFFO29CQUNqQixPQUFPLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO2lCQUM1QjtnQkFDRCxJQUFJLFNBQVMsRUFBRTtvQkFDYixpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLEVBQUUsdUNBQXVDLEtBQUssRUFBRSxDQUFDLENBQUM7b0JBQzdFLDhDQUE4QztvQkFDOUMsY0FBYyxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsR0FBRyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7aUJBQ3pEO2dCQUNELE9BQU8sS0FBSyxDQUFDO1lBQ2YsQ0FBQzs7Ozs7WUFFTyx5QkFBeUI7Z0JBQy9CLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsS0FBSyxJQUFJLEVBQUU7b0JBQ3hDLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxDQUFDO2lCQUNsQztZQUNILENBQUM7U0FDRixDQUFDO0tBQ0g7SUFFRCxTQUFTLElBQUkseUJBQXlCLENBQ3JCLFNBQVMsK0RBQXFFLENBQUM7O1FBRTVGLFVBQXNCOztVQUNwQixTQUFTLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUM7SUFDM0MsSUFBSSxZQUFZLENBQUMsU0FBUyxDQUFDLEVBQUU7UUFDM0IsdUVBQXVFO1FBQ3ZFLFVBQVUsR0FBRyxTQUFTLENBQUM7UUFDdkIsd0JBQXdCLENBQUMsVUFBVSx1Q0FBOEMsQ0FBQztLQUNuRjtTQUFNOztZQUNELFdBQXFCO1FBQ3pCLHFGQUFxRjtRQUNyRixrRkFBa0Y7UUFDbEYsK0ZBQStGO1FBQy9GLFlBQVk7UUFDWixJQUFJLFNBQVMsQ0FBQyxJQUFJLDZCQUErQixFQUFFO1lBQ2pELFdBQVcsR0FBRyxtQkFBQSxXQUFXLENBQUMsU0FBUyxDQUFDLEVBQVksQ0FBQztTQUNsRDthQUFNO1lBQ0wsU0FBUyxJQUFJLFNBQVMsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO1lBQy9DLFdBQVcsR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUU3RSwwRkFBMEY7WUFDMUYseUZBQXlGO1lBQ3pGLDZGQUE2RjtZQUM3Riw4RkFBOEY7WUFDOUYsUUFBUTtZQUNSLElBQUksVUFBVSxDQUFDLFFBQVEsQ0FBQyxFQUFFOztzQkFDbEIsUUFBUSxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUM7O3NCQUM3QixVQUFVLEdBQUcsbUJBQUEsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxFQUFFOztzQkFDcEQsa0JBQWtCLEdBQUcsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLFVBQVUsQ0FBQztnQkFDakUsa0JBQWtCLENBQ2QsUUFBUSxFQUFFLG1CQUFBLGtCQUFrQixFQUFFLEVBQUUsV0FBVyxFQUFFLGlCQUFpQixDQUFDLFFBQVEsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDO2FBQzNGO2lCQUFNO2dCQUNMLFdBQVcsQ0FBQyxXQUFXLEVBQUUsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDO2FBQy9DO1NBQ0Y7UUFFRCxRQUFRLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxHQUFHLFVBQVU7WUFDbEMsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFFbEUsYUFBYSxDQUFDLFFBQVEsRUFBRSxVQUFVLENBQUMsQ0FBQztLQUNyQztJQUVELE9BQU8sSUFBSSxrQkFBa0IsQ0FBQyxVQUFVLEVBQUUsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBQ2pFLENBQUM7Ozs7OztBQUlELE1BQU0sVUFBVSx1QkFBdUIsQ0FBQyxNQUFNLEdBQUcsS0FBSztJQUNwRCxPQUFPLGFBQWEsQ0FBQyx3QkFBd0IsRUFBRSxFQUFFLFFBQVEsRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQ3ZFLENBQUM7Ozs7Ozs7OztBQVVELFNBQVMsYUFBYSxDQUFDLEtBQVksRUFBRSxLQUFZLEVBQUUsTUFBZTs7OztVQUcxRCxlQUFlLEdBQUcsQ0FBQyxNQUFNLElBQUksZUFBZSxDQUFDLEtBQUssQ0FBQztJQUN6RCxJQUFJLGVBQWUsRUFBRTs7OztjQUdiLGFBQWEsR0FBRyx3QkFBd0IsQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQztRQUNsRSxPQUFPLElBQUksT0FBTyxDQUFDLGFBQWEsRUFBRSxhQUFhLENBQUMsQ0FBQztLQUNsRDtTQUFNLElBQ0gsS0FBSyxDQUFDLElBQUksb0JBQXNCLElBQUksS0FBSyxDQUFDLElBQUksc0JBQXdCO1FBQ3RFLEtBQUssQ0FBQyxJQUFJLDZCQUErQixJQUFJLEtBQUssQ0FBQyxJQUFJLHlCQUEyQixFQUFFOzs7O2NBR2hGLGlCQUFpQixHQUFHLEtBQUssQ0FBQywwQkFBMEIsQ0FBQztRQUMzRCxPQUFPLElBQUksT0FBTyxDQUFDLGlCQUFpQixFQUFFLEtBQUssQ0FBQyxDQUFDO0tBQzlDO0lBQ0QsT0FBTyxtQkFBQSxJQUFJLEVBQUUsQ0FBQztBQUNoQixDQUFDOzs7Ozs7QUFHRCxTQUFTLG9CQUFvQixDQUFDLElBQVc7O1VBQ2pDLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO0lBQy9CLElBQUksb0JBQW9CLENBQUMsUUFBUSxDQUFDLEVBQUU7UUFDbEMsT0FBTyxtQkFBQSxRQUFRLEVBQWEsQ0FBQztLQUM5QjtTQUFNO1FBQ0wsTUFBTSxJQUFJLEtBQUssQ0FBQyw4REFBOEQsQ0FBQyxDQUFDO0tBQ2pGO0FBQ0gsQ0FBQzs7Ozs7QUFHRCxNQUFNLFVBQVUsZUFBZTs7OztVQUd2QixLQUFLLEdBQUcsUUFBUSxFQUFFOztVQUNsQixLQUFLLEdBQUcsd0JBQXdCLEVBQUU7O1VBQ2xDLFdBQVcsR0FBRyx3QkFBd0IsQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQztJQUNoRSxPQUFPLG9CQUFvQixDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUMxRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0NoYW5nZURldGVjdG9yUmVmIGFzIFZpZXdFbmdpbmVfQ2hhbmdlRGV0ZWN0b3JSZWZ9IGZyb20gJy4uL2NoYW5nZV9kZXRlY3Rpb24vY2hhbmdlX2RldGVjdG9yX3JlZic7XG5pbXBvcnQge0luamVjdG9yfSBmcm9tICcuLi9kaS9pbmplY3Rvcic7XG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnkgYXMgdmlld0VuZ2luZV9Db21wb25lbnRGYWN0b3J5LCBDb21wb25lbnRSZWYgYXMgdmlld0VuZ2luZV9Db21wb25lbnRSZWZ9IGZyb20gJy4uL2xpbmtlci9jb21wb25lbnRfZmFjdG9yeSc7XG5pbXBvcnQge0VsZW1lbnRSZWYgYXMgVmlld0VuZ2luZV9FbGVtZW50UmVmfSBmcm9tICcuLi9saW5rZXIvZWxlbWVudF9yZWYnO1xuaW1wb3J0IHtOZ01vZHVsZVJlZiBhcyB2aWV3RW5naW5lX05nTW9kdWxlUmVmfSBmcm9tICcuLi9saW5rZXIvbmdfbW9kdWxlX2ZhY3RvcnknO1xuaW1wb3J0IHtUZW1wbGF0ZVJlZiBhcyBWaWV3RW5naW5lX1RlbXBsYXRlUmVmfSBmcm9tICcuLi9saW5rZXIvdGVtcGxhdGVfcmVmJztcbmltcG9ydCB7Vmlld0NvbnRhaW5lclJlZiBhcyBWaWV3RW5naW5lX1ZpZXdDb250YWluZXJSZWZ9IGZyb20gJy4uL2xpbmtlci92aWV3X2NvbnRhaW5lcl9yZWYnO1xuaW1wb3J0IHtFbWJlZGRlZFZpZXdSZWYgYXMgdmlld0VuZ2luZV9FbWJlZGRlZFZpZXdSZWYsIFZpZXdSZWYgYXMgdmlld0VuZ2luZV9WaWV3UmVmfSBmcm9tICcuLi9saW5rZXIvdmlld19yZWYnO1xuaW1wb3J0IHtSZW5kZXJlcjJ9IGZyb20gJy4uL3JlbmRlci9hcGknO1xuaW1wb3J0IHthZGRUb0FycmF5LCByZW1vdmVGcm9tQXJyYXl9IGZyb20gJy4uL3V0aWwvYXJyYXlfdXRpbHMnO1xuaW1wb3J0IHthc3NlcnREZWZpbmVkLCBhc3NlcnRFcXVhbCwgYXNzZXJ0R3JlYXRlclRoYW4sIGFzc2VydExlc3NUaGFufSBmcm9tICcuLi91dGlsL2Fzc2VydCc7XG5cbmltcG9ydCB7YXNzZXJ0TENvbnRhaW5lcn0gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHtOb2RlSW5qZWN0b3IsIGdldFBhcmVudEluamVjdG9yTG9jYXRpb259IGZyb20gJy4vZGknO1xuaW1wb3J0IHthZGRUb1ZpZXdUcmVlLCBjcmVhdGVMQ29udGFpbmVyLCBjcmVhdGVMVmlldywgcmVuZGVyVmlld30gZnJvbSAnLi9pbnN0cnVjdGlvbnMvc2hhcmVkJztcbmltcG9ydCB7QWN0aXZlSW5kZXhGbGFnLCBDT05UQUlORVJfSEVBREVSX09GRlNFVCwgTENvbnRhaW5lciwgVklFV19SRUZTfSBmcm9tICcuL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7VENvbnRhaW5lck5vZGUsIFREaXJlY3RpdmVIb3N0Tm9kZSwgVEVsZW1lbnRDb250YWluZXJOb2RlLCBURWxlbWVudE5vZGUsIFROb2RlLCBUTm9kZVR5cGUsIFRWaWV3Tm9kZX0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtSQ29tbWVudCwgUkVsZW1lbnQsIGlzUHJvY2VkdXJhbFJlbmRlcmVyfSBmcm9tICcuL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtpc0NvbXBvbmVudEhvc3QsIGlzTENvbnRhaW5lciwgaXNMVmlldywgaXNSb290Vmlld30gZnJvbSAnLi9pbnRlcmZhY2VzL3R5cGVfY2hlY2tzJztcbmltcG9ydCB7REVDTEFSQVRJT05fQ09NUE9ORU5UX1ZJRVcsIERFQ0xBUkFUSU9OX0xDT05UQUlORVIsIExWaWV3LCBMVmlld0ZsYWdzLCBQQVJFTlQsIFFVRVJJRVMsIFJFTkRFUkVSLCBUVmlldywgVF9IT1NUfSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXN9IGZyb20gJy4vbm9kZV9hc3NlcnQnO1xuaW1wb3J0IHthZGRSZW1vdmVWaWV3RnJvbUNvbnRhaW5lciwgYXBwZW5kQ2hpbGQsIGRldGFjaFZpZXcsIGdldEJlZm9yZU5vZGVGb3JWaWV3LCBpbnNlcnRWaWV3LCBuYXRpdmVJbnNlcnRCZWZvcmUsIG5hdGl2ZU5leHRTaWJsaW5nLCBuYXRpdmVQYXJlbnROb2RlLCByZW1vdmVWaWV3fSBmcm9tICcuL25vZGVfbWFuaXB1bGF0aW9uJztcbmltcG9ydCB7Z2V0UGFyZW50SW5qZWN0b3JUTm9kZX0gZnJvbSAnLi9ub2RlX3V0aWwnO1xuaW1wb3J0IHtnZXRMVmlldywgZ2V0UHJldmlvdXNPclBhcmVudFROb2RlfSBmcm9tICcuL3N0YXRlJztcbmltcG9ydCB7Z2V0UGFyZW50SW5qZWN0b3JWaWV3LCBoYXNQYXJlbnRJbmplY3Rvcn0gZnJvbSAnLi91dGlsL2luamVjdG9yX3V0aWxzJztcbmltcG9ydCB7Z2V0Q29tcG9uZW50TFZpZXdCeUluZGV4LCBnZXROYXRpdmVCeVROb2RlLCBzZXRMQ29udGFpbmVyQWN0aXZlSW5kZXgsIHVud3JhcFJOb2RlLCB2aWV3QXR0YWNoZWRUb0NvbnRhaW5lcn0gZnJvbSAnLi91dGlsL3ZpZXdfdXRpbHMnO1xuaW1wb3J0IHtWaWV3UmVmfSBmcm9tICcuL3ZpZXdfcmVmJztcblxuXG5cbi8qKlxuICogQ3JlYXRlcyBhbiBFbGVtZW50UmVmIGZyb20gdGhlIG1vc3QgcmVjZW50IG5vZGUuXG4gKlxuICogQHJldHVybnMgVGhlIEVsZW1lbnRSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RFbGVtZW50UmVmKEVsZW1lbnRSZWZUb2tlbjogdHlwZW9mIFZpZXdFbmdpbmVfRWxlbWVudFJlZik6XG4gICAgVmlld0VuZ2luZV9FbGVtZW50UmVmIHtcbiAgcmV0dXJuIGNyZWF0ZUVsZW1lbnRSZWYoRWxlbWVudFJlZlRva2VuLCBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKSwgZ2V0TFZpZXcoKSk7XG59XG5cbmxldCBSM0VsZW1lbnRSZWY6IHtuZXcgKG5hdGl2ZTogUkVsZW1lbnQgfCBSQ29tbWVudCk6IFZpZXdFbmdpbmVfRWxlbWVudFJlZn07XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBFbGVtZW50UmVmIGdpdmVuIGEgbm9kZS5cbiAqXG4gKiBAcGFyYW0gRWxlbWVudFJlZlRva2VuIFRoZSBFbGVtZW50UmVmIHR5cGVcbiAqIEBwYXJhbSB0Tm9kZSBUaGUgbm9kZSBmb3Igd2hpY2ggeW91J2QgbGlrZSBhbiBFbGVtZW50UmVmXG4gKiBAcGFyYW0gdmlldyBUaGUgdmlldyB0byB3aGljaCB0aGUgbm9kZSBiZWxvbmdzXG4gKiBAcmV0dXJucyBUaGUgRWxlbWVudFJlZiBpbnN0YW5jZSB0byB1c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVsZW1lbnRSZWYoXG4gICAgRWxlbWVudFJlZlRva2VuOiB0eXBlb2YgVmlld0VuZ2luZV9FbGVtZW50UmVmLCB0Tm9kZTogVE5vZGUsXG4gICAgdmlldzogTFZpZXcpOiBWaWV3RW5naW5lX0VsZW1lbnRSZWYge1xuICBpZiAoIVIzRWxlbWVudFJlZikge1xuICAgIC8vIFRPRE86IEZpeCBjbGFzcyBuYW1lLCBzaG91bGQgYmUgRWxlbWVudFJlZiwgYnV0IHRoZXJlIGFwcGVhcnMgdG8gYmUgYSByb2xsdXAgYnVnXG4gICAgUjNFbGVtZW50UmVmID0gY2xhc3MgRWxlbWVudFJlZl8gZXh0ZW5kcyBFbGVtZW50UmVmVG9rZW4ge307XG4gIH1cbiAgcmV0dXJuIG5ldyBSM0VsZW1lbnRSZWYoZ2V0TmF0aXZlQnlUTm9kZSh0Tm9kZSwgdmlldykgYXMgUkVsZW1lbnQpO1xufVxuXG5sZXQgUjNUZW1wbGF0ZVJlZjoge1xuICBuZXcgKF9kZWNsYXJhdGlvblBhcmVudFZpZXc6IExWaWV3LCBob3N0VE5vZGU6IFRDb250YWluZXJOb2RlLCBlbGVtZW50UmVmOiBWaWV3RW5naW5lX0VsZW1lbnRSZWYpOlxuICAgICAgVmlld0VuZ2luZV9UZW1wbGF0ZVJlZjxhbnk+XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBUZW1wbGF0ZVJlZiBnaXZlbiBhIG5vZGUuXG4gKlxuICogQHJldHVybnMgVGhlIFRlbXBsYXRlUmVmIGluc3RhbmNlIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0VGVtcGxhdGVSZWY8VD4oXG4gICAgVGVtcGxhdGVSZWZUb2tlbjogdHlwZW9mIFZpZXdFbmdpbmVfVGVtcGxhdGVSZWYsXG4gICAgRWxlbWVudFJlZlRva2VuOiB0eXBlb2YgVmlld0VuZ2luZV9FbGVtZW50UmVmKTogVmlld0VuZ2luZV9UZW1wbGF0ZVJlZjxUPnxudWxsIHtcbiAgcmV0dXJuIGNyZWF0ZVRlbXBsYXRlUmVmPFQ+KFxuICAgICAgVGVtcGxhdGVSZWZUb2tlbiwgRWxlbWVudFJlZlRva2VuLCBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKSwgZ2V0TFZpZXcoKSk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIFRlbXBsYXRlUmVmIGFuZCBzdG9yZXMgaXQgb24gdGhlIGluamVjdG9yLlxuICpcbiAqIEBwYXJhbSBUZW1wbGF0ZVJlZlRva2VuIFRoZSBUZW1wbGF0ZVJlZiB0eXBlXG4gKiBAcGFyYW0gRWxlbWVudFJlZlRva2VuIFRoZSBFbGVtZW50UmVmIHR5cGVcbiAqIEBwYXJhbSBob3N0VE5vZGUgVGhlIG5vZGUgb24gd2hpY2ggYSBUZW1wbGF0ZVJlZiBpcyByZXF1ZXN0ZWRcbiAqIEBwYXJhbSBob3N0VmlldyBUaGUgdmlldyB0byB3aGljaCB0aGUgbm9kZSBiZWxvbmdzXG4gKiBAcmV0dXJucyBUaGUgVGVtcGxhdGVSZWYgaW5zdGFuY2Ugb3IgbnVsbCBpZiB3ZSBjYW4ndCBjcmVhdGUgYSBUZW1wbGF0ZVJlZiBvbiBhIGdpdmVuIG5vZGUgdHlwZVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVGVtcGxhdGVSZWY8VD4oXG4gICAgVGVtcGxhdGVSZWZUb2tlbjogdHlwZW9mIFZpZXdFbmdpbmVfVGVtcGxhdGVSZWYsIEVsZW1lbnRSZWZUb2tlbjogdHlwZW9mIFZpZXdFbmdpbmVfRWxlbWVudFJlZixcbiAgICBob3N0VE5vZGU6IFROb2RlLCBob3N0VmlldzogTFZpZXcpOiBWaWV3RW5naW5lX1RlbXBsYXRlUmVmPFQ+fG51bGwge1xuICBpZiAoIVIzVGVtcGxhdGVSZWYpIHtcbiAgICAvLyBUT0RPOiBGaXggY2xhc3MgbmFtZSwgc2hvdWxkIGJlIFRlbXBsYXRlUmVmLCBidXQgdGhlcmUgYXBwZWFycyB0byBiZSBhIHJvbGx1cCBidWdcbiAgICBSM1RlbXBsYXRlUmVmID0gY2xhc3MgVGVtcGxhdGVSZWZfPFQ+IGV4dGVuZHMgVGVtcGxhdGVSZWZUb2tlbjxUPiB7XG4gICAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgICBwcml2YXRlIF9kZWNsYXJhdGlvblZpZXc6IExWaWV3LCBwcml2YXRlIF9kZWNsYXJhdGlvblRDb250YWluZXI6IFRDb250YWluZXJOb2RlLFxuICAgICAgICAgIHJlYWRvbmx5IGVsZW1lbnRSZWY6IFZpZXdFbmdpbmVfRWxlbWVudFJlZikge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgfVxuXG4gICAgICBjcmVhdGVFbWJlZGRlZFZpZXcoY29udGV4dDogVCk6IHZpZXdFbmdpbmVfRW1iZWRkZWRWaWV3UmVmPFQ+IHtcbiAgICAgICAgY29uc3QgZW1iZWRkZWRUVmlldyA9IHRoaXMuX2RlY2xhcmF0aW9uVENvbnRhaW5lci50Vmlld3MgYXMgVFZpZXc7XG4gICAgICAgIGNvbnN0IGxWaWV3ID0gY3JlYXRlTFZpZXcoXG4gICAgICAgICAgICB0aGlzLl9kZWNsYXJhdGlvblZpZXcsIGVtYmVkZGVkVFZpZXcsIGNvbnRleHQsIExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMsIG51bGwsXG4gICAgICAgICAgICBlbWJlZGRlZFRWaWV3Lm5vZGUpO1xuXG4gICAgICAgIGNvbnN0IGRlY2xhcmF0aW9uTENvbnRhaW5lciA9IHRoaXMuX2RlY2xhcmF0aW9uVmlld1t0aGlzLl9kZWNsYXJhdGlvblRDb250YWluZXIuaW5kZXhdO1xuICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TENvbnRhaW5lcihkZWNsYXJhdGlvbkxDb250YWluZXIpO1xuICAgICAgICBsVmlld1tERUNMQVJBVElPTl9MQ09OVEFJTkVSXSA9IGRlY2xhcmF0aW9uTENvbnRhaW5lcjtcblxuICAgICAgICBjb25zdCBkZWNsYXJhdGlvblZpZXdMUXVlcmllcyA9IHRoaXMuX2RlY2xhcmF0aW9uVmlld1tRVUVSSUVTXTtcbiAgICAgICAgaWYgKGRlY2xhcmF0aW9uVmlld0xRdWVyaWVzICE9PSBudWxsKSB7XG4gICAgICAgICAgbFZpZXdbUVVFUklFU10gPSBkZWNsYXJhdGlvblZpZXdMUXVlcmllcy5jcmVhdGVFbWJlZGRlZFZpZXcoZW1iZWRkZWRUVmlldyk7XG4gICAgICAgIH1cblxuICAgICAgICByZW5kZXJWaWV3KGxWaWV3LCBlbWJlZGRlZFRWaWV3LCBjb250ZXh0KTtcblxuICAgICAgICBjb25zdCB2aWV3UmVmID0gbmV3IFZpZXdSZWY8VD4obFZpZXcpO1xuICAgICAgICB2aWV3UmVmLl90Vmlld05vZGUgPSBsVmlld1tUX0hPU1RdIGFzIFRWaWV3Tm9kZTtcbiAgICAgICAgcmV0dXJuIHZpZXdSZWY7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIGlmIChob3N0VE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGhvc3RUTm9kZS50Vmlld3MsICdUVmlldyBtdXN0IGJlIGFsbG9jYXRlZCcpO1xuICAgIHJldHVybiBuZXcgUjNUZW1wbGF0ZVJlZihcbiAgICAgICAgaG9zdFZpZXcsIGhvc3RUTm9kZSBhcyBUQ29udGFpbmVyTm9kZSxcbiAgICAgICAgY3JlYXRlRWxlbWVudFJlZihFbGVtZW50UmVmVG9rZW4sIGhvc3RUTm9kZSwgaG9zdFZpZXcpKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG5sZXQgUjNWaWV3Q29udGFpbmVyUmVmOiB7XG4gIG5ldyAoXG4gICAgICBsQ29udGFpbmVyOiBMQ29udGFpbmVyLCBob3N0VE5vZGU6IFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIHwgVEVsZW1lbnRDb250YWluZXJOb2RlLFxuICAgICAgaG9zdFZpZXc6IExWaWV3KTogVmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmXG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBWaWV3Q29udGFpbmVyUmVmIGFuZCBzdG9yZXMgaXQgb24gdGhlIGluamVjdG9yLiBPciwgaWYgdGhlIFZpZXdDb250YWluZXJSZWZcbiAqIGFscmVhZHkgZXhpc3RzLCByZXRyaWV2ZXMgdGhlIGV4aXN0aW5nIFZpZXdDb250YWluZXJSZWYuXG4gKlxuICogQHJldHVybnMgVGhlIFZpZXdDb250YWluZXJSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RWaWV3Q29udGFpbmVyUmVmKFxuICAgIFZpZXdDb250YWluZXJSZWZUb2tlbjogdHlwZW9mIFZpZXdFbmdpbmVfVmlld0NvbnRhaW5lclJlZixcbiAgICBFbGVtZW50UmVmVG9rZW46IHR5cGVvZiBWaWV3RW5naW5lX0VsZW1lbnRSZWYpOiBWaWV3RW5naW5lX1ZpZXdDb250YWluZXJSZWYge1xuICBjb25zdCBwcmV2aW91c1ROb2RlID1cbiAgICAgIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpIGFzIFRFbGVtZW50Tm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSB8IFRDb250YWluZXJOb2RlO1xuICByZXR1cm4gY3JlYXRlQ29udGFpbmVyUmVmKFZpZXdDb250YWluZXJSZWZUb2tlbiwgRWxlbWVudFJlZlRva2VuLCBwcmV2aW91c1ROb2RlLCBnZXRMVmlldygpKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgVmlld0NvbnRhaW5lclJlZiBhbmQgc3RvcmVzIGl0IG9uIHRoZSBpbmplY3Rvci5cbiAqXG4gKiBAcGFyYW0gVmlld0NvbnRhaW5lclJlZlRva2VuIFRoZSBWaWV3Q29udGFpbmVyUmVmIHR5cGVcbiAqIEBwYXJhbSBFbGVtZW50UmVmVG9rZW4gVGhlIEVsZW1lbnRSZWYgdHlwZVxuICogQHBhcmFtIGhvc3RUTm9kZSBUaGUgbm9kZSB0aGF0IGlzIHJlcXVlc3RpbmcgYSBWaWV3Q29udGFpbmVyUmVmXG4gKiBAcGFyYW0gaG9zdFZpZXcgVGhlIHZpZXcgdG8gd2hpY2ggdGhlIG5vZGUgYmVsb25nc1xuICogQHJldHVybnMgVGhlIFZpZXdDb250YWluZXJSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVDb250YWluZXJSZWYoXG4gICAgVmlld0NvbnRhaW5lclJlZlRva2VuOiB0eXBlb2YgVmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmLFxuICAgIEVsZW1lbnRSZWZUb2tlbjogdHlwZW9mIFZpZXdFbmdpbmVfRWxlbWVudFJlZixcbiAgICBob3N0VE5vZGU6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxURWxlbWVudENvbnRhaW5lck5vZGUsXG4gICAgaG9zdFZpZXc6IExWaWV3KTogVmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmIHtcbiAgaWYgKCFSM1ZpZXdDb250YWluZXJSZWYpIHtcbiAgICAvLyBUT0RPOiBGaXggY2xhc3MgbmFtZSwgc2hvdWxkIGJlIFZpZXdDb250YWluZXJSZWYsIGJ1dCB0aGVyZSBhcHBlYXJzIHRvIGJlIGEgcm9sbHVwIGJ1Z1xuICAgIFIzVmlld0NvbnRhaW5lclJlZiA9IGNsYXNzIFZpZXdDb250YWluZXJSZWZfIGV4dGVuZHMgVmlld0NvbnRhaW5lclJlZlRva2VuIHtcbiAgICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICAgIHByaXZhdGUgX2xDb250YWluZXI6IExDb250YWluZXIsXG4gICAgICAgICAgcHJpdmF0ZSBfaG9zdFROb2RlOiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlLFxuICAgICAgICAgIHByaXZhdGUgX2hvc3RWaWV3OiBMVmlldykge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgfVxuXG4gICAgICBnZXQgZWxlbWVudCgpOiBWaWV3RW5naW5lX0VsZW1lbnRSZWYge1xuICAgICAgICByZXR1cm4gY3JlYXRlRWxlbWVudFJlZihFbGVtZW50UmVmVG9rZW4sIHRoaXMuX2hvc3RUTm9kZSwgdGhpcy5faG9zdFZpZXcpO1xuICAgICAgfVxuXG4gICAgICBnZXQgaW5qZWN0b3IoKTogSW5qZWN0b3IgeyByZXR1cm4gbmV3IE5vZGVJbmplY3Rvcih0aGlzLl9ob3N0VE5vZGUsIHRoaXMuX2hvc3RWaWV3KTsgfVxuXG4gICAgICAvKiogQGRlcHJlY2F0ZWQgTm8gcmVwbGFjZW1lbnQgKi9cbiAgICAgIGdldCBwYXJlbnRJbmplY3RvcigpOiBJbmplY3RvciB7XG4gICAgICAgIGNvbnN0IHBhcmVudExvY2F0aW9uID0gZ2V0UGFyZW50SW5qZWN0b3JMb2NhdGlvbih0aGlzLl9ob3N0VE5vZGUsIHRoaXMuX2hvc3RWaWV3KTtcbiAgICAgICAgY29uc3QgcGFyZW50VmlldyA9IGdldFBhcmVudEluamVjdG9yVmlldyhwYXJlbnRMb2NhdGlvbiwgdGhpcy5faG9zdFZpZXcpO1xuICAgICAgICBjb25zdCBwYXJlbnRUTm9kZSA9IGdldFBhcmVudEluamVjdG9yVE5vZGUocGFyZW50TG9jYXRpb24sIHRoaXMuX2hvc3RWaWV3LCB0aGlzLl9ob3N0VE5vZGUpO1xuXG4gICAgICAgIHJldHVybiAhaGFzUGFyZW50SW5qZWN0b3IocGFyZW50TG9jYXRpb24pIHx8IHBhcmVudFROb2RlID09IG51bGwgP1xuICAgICAgICAgICAgbmV3IE5vZGVJbmplY3RvcihudWxsLCB0aGlzLl9ob3N0VmlldykgOlxuICAgICAgICAgICAgbmV3IE5vZGVJbmplY3RvcihwYXJlbnRUTm9kZSwgcGFyZW50Vmlldyk7XG4gICAgICB9XG5cbiAgICAgIGNsZWFyKCk6IHZvaWQge1xuICAgICAgICB3aGlsZSAodGhpcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgdGhpcy5yZW1vdmUodGhpcy5sZW5ndGggLSAxKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBnZXQoaW5kZXg6IG51bWJlcik6IHZpZXdFbmdpbmVfVmlld1JlZnxudWxsIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2xDb250YWluZXJbVklFV19SRUZTXSAhPT0gbnVsbCAmJiB0aGlzLl9sQ29udGFpbmVyW1ZJRVdfUkVGU10gIVtpbmRleF0gfHwgbnVsbDtcbiAgICAgIH1cblxuICAgICAgZ2V0IGxlbmd0aCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5fbENvbnRhaW5lci5sZW5ndGggLSBDT05UQUlORVJfSEVBREVSX09GRlNFVDsgfVxuXG4gICAgICBjcmVhdGVFbWJlZGRlZFZpZXc8Qz4odGVtcGxhdGVSZWY6IFZpZXdFbmdpbmVfVGVtcGxhdGVSZWY8Qz4sIGNvbnRleHQ/OiBDLCBpbmRleD86IG51bWJlcik6XG4gICAgICAgICAgdmlld0VuZ2luZV9FbWJlZGRlZFZpZXdSZWY8Qz4ge1xuICAgICAgICBjb25zdCB2aWV3UmVmID0gdGVtcGxhdGVSZWYuY3JlYXRlRW1iZWRkZWRWaWV3KGNvbnRleHQgfHwgPGFueT57fSk7XG4gICAgICAgIHRoaXMuaW5zZXJ0KHZpZXdSZWYsIGluZGV4KTtcbiAgICAgICAgcmV0dXJuIHZpZXdSZWY7XG4gICAgICB9XG5cbiAgICAgIGNyZWF0ZUNvbXBvbmVudDxDPihcbiAgICAgICAgICBjb21wb25lbnRGYWN0b3J5OiB2aWV3RW5naW5lX0NvbXBvbmVudEZhY3Rvcnk8Qz4sIGluZGV4PzogbnVtYmVyfHVuZGVmaW5lZCxcbiAgICAgICAgICBpbmplY3Rvcj86IEluamVjdG9yfHVuZGVmaW5lZCwgcHJvamVjdGFibGVOb2Rlcz86IGFueVtdW118dW5kZWZpbmVkLFxuICAgICAgICAgIG5nTW9kdWxlUmVmPzogdmlld0VuZ2luZV9OZ01vZHVsZVJlZjxhbnk+fHVuZGVmaW5lZCk6IHZpZXdFbmdpbmVfQ29tcG9uZW50UmVmPEM+IHtcbiAgICAgICAgY29uc3QgY29udGV4dEluamVjdG9yID0gaW5qZWN0b3IgfHwgdGhpcy5wYXJlbnRJbmplY3RvcjtcbiAgICAgICAgaWYgKCFuZ01vZHVsZVJlZiAmJiAoY29tcG9uZW50RmFjdG9yeSBhcyBhbnkpLm5nTW9kdWxlID09IG51bGwgJiYgY29udGV4dEluamVjdG9yKSB7XG4gICAgICAgICAgLy8gRE8gTk9UIFJFRkFDVE9SLiBUaGUgY29kZSBoZXJlIHVzZWQgdG8gaGF2ZSBhIGB2YWx1ZSB8fCB1bmRlZmluZWRgIGV4cHJlc3Npb25cbiAgICAgICAgICAvLyB3aGljaCBzZWVtcyB0byBjYXVzZSBpbnRlcm5hbCBnb29nbGUgYXBwcyB0byBmYWlsLiBUaGlzIGlzIGRvY3VtZW50ZWQgaW4gdGhlXG4gICAgICAgICAgLy8gZm9sbG93aW5nIGludGVybmFsIGJ1ZyBpc3N1ZTogZ28vYi8xNDI5Njc4MDJcbiAgICAgICAgICBjb25zdCByZXN1bHQgPSBjb250ZXh0SW5qZWN0b3IuZ2V0KHZpZXdFbmdpbmVfTmdNb2R1bGVSZWYsIG51bGwpO1xuICAgICAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgICAgIG5nTW9kdWxlUmVmID0gcmVzdWx0O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNvbXBvbmVudFJlZiA9XG4gICAgICAgICAgICBjb21wb25lbnRGYWN0b3J5LmNyZWF0ZShjb250ZXh0SW5qZWN0b3IsIHByb2plY3RhYmxlTm9kZXMsIHVuZGVmaW5lZCwgbmdNb2R1bGVSZWYpO1xuICAgICAgICB0aGlzLmluc2VydChjb21wb25lbnRSZWYuaG9zdFZpZXcsIGluZGV4KTtcbiAgICAgICAgcmV0dXJuIGNvbXBvbmVudFJlZjtcbiAgICAgIH1cblxuICAgICAgaW5zZXJ0KHZpZXdSZWY6IHZpZXdFbmdpbmVfVmlld1JlZiwgaW5kZXg/OiBudW1iZXIpOiB2aWV3RW5naW5lX1ZpZXdSZWYge1xuICAgICAgICBjb25zdCBsVmlldyA9ICh2aWV3UmVmIGFzIFZpZXdSZWY8YW55PikuX2xWaWV3ICE7XG5cbiAgICAgICAgaWYgKHZpZXdSZWYuZGVzdHJveWVkKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgaW5zZXJ0IGEgZGVzdHJveWVkIFZpZXcgaW4gYSBWaWV3Q29udGFpbmVyIScpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5hbGxvY2F0ZUNvbnRhaW5lcklmTmVlZGVkKCk7XG5cbiAgICAgICAgaWYgKHZpZXdBdHRhY2hlZFRvQ29udGFpbmVyKGxWaWV3KSkge1xuICAgICAgICAgIC8vIElmIHZpZXcgaXMgYWxyZWFkeSBhdHRhY2hlZCwgZGV0YWNoIGl0IGZpcnN0IHNvIHdlIGNsZWFuIHVwIHJlZmVyZW5jZXMgYXBwcm9wcmlhdGVseS5cblxuICAgICAgICAgIGNvbnN0IHByZXZJZHggPSB0aGlzLmluZGV4T2Yodmlld1JlZik7XG5cbiAgICAgICAgICAvLyBBIHZpZXcgbWlnaHQgYmUgYXR0YWNoZWQgZWl0aGVyIHRvIHRoaXMgb3IgYSBkaWZmZXJlbnQgY29udGFpbmVyLiBUaGUgYHByZXZJZHhgIGZvclxuICAgICAgICAgIC8vIHRob3NlIGNhc2VzIHdpbGwgYmU6XG4gICAgICAgICAgLy8gZXF1YWwgdG8gLTEgZm9yIHZpZXdzIGF0dGFjaGVkIHRvIHRoaXMgVmlld0NvbnRhaW5lclJlZlxuICAgICAgICAgIC8vID49IDAgZm9yIHZpZXdzIGF0dGFjaGVkIHRvIGEgZGlmZmVyZW50IFZpZXdDb250YWluZXJSZWZcbiAgICAgICAgICBpZiAocHJldklkeCAhPT0gLTEpIHtcbiAgICAgICAgICAgIHRoaXMuZGV0YWNoKHByZXZJZHgpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBwcmV2TENvbnRhaW5lciA9IGxWaWV3W1BBUkVOVF0gYXMgTENvbnRhaW5lcjtcbiAgICAgICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNMQ29udGFpbmVyKHByZXZMQ29udGFpbmVyKSwgdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ0FuIGF0dGFjaGVkIHZpZXcgc2hvdWxkIGhhdmUgaXRzIFBBUkVOVCBwb2ludCB0byBhIGNvbnRhaW5lci4nKTtcblxuXG4gICAgICAgICAgICAvLyBXZSBuZWVkIHRvIHJlLWNyZWF0ZSBhIFIzVmlld0NvbnRhaW5lclJlZiBpbnN0YW5jZSBzaW5jZSB0aG9zZSBhcmUgbm90IHN0b3JlZCBvblxuICAgICAgICAgICAgLy8gTFZpZXcgKG5vciBhbnl3aGVyZSBlbHNlKS5cbiAgICAgICAgICAgIGNvbnN0IHByZXZWQ1JlZiA9IG5ldyBSM1ZpZXdDb250YWluZXJSZWYoXG4gICAgICAgICAgICAgICAgcHJldkxDb250YWluZXIsIHByZXZMQ29udGFpbmVyW1RfSE9TVF0gYXMgVERpcmVjdGl2ZUhvc3ROb2RlLFxuICAgICAgICAgICAgICAgIHByZXZMQ29udGFpbmVyW1BBUkVOVF0pO1xuXG4gICAgICAgICAgICBwcmV2VkNSZWYuZGV0YWNoKHByZXZWQ1JlZi5pbmRleE9mKHZpZXdSZWYpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBhZGp1c3RlZElkeCA9IHRoaXMuX2FkanVzdEluZGV4KGluZGV4KTtcbiAgICAgICAgaW5zZXJ0VmlldyhsVmlldywgdGhpcy5fbENvbnRhaW5lciwgYWRqdXN0ZWRJZHgpO1xuXG4gICAgICAgIGNvbnN0IGJlZm9yZU5vZGUgPSBnZXRCZWZvcmVOb2RlRm9yVmlldyhhZGp1c3RlZElkeCwgdGhpcy5fbENvbnRhaW5lcik7XG4gICAgICAgIGFkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyKGxWaWV3LCB0cnVlLCBiZWZvcmVOb2RlKTtcblxuICAgICAgICAodmlld1JlZiBhcyBWaWV3UmVmPGFueT4pLmF0dGFjaFRvVmlld0NvbnRhaW5lclJlZih0aGlzKTtcbiAgICAgICAgYWRkVG9BcnJheSh0aGlzLl9sQ29udGFpbmVyW1ZJRVdfUkVGU10gISwgYWRqdXN0ZWRJZHgsIHZpZXdSZWYpO1xuXG4gICAgICAgIHJldHVybiB2aWV3UmVmO1xuICAgICAgfVxuXG4gICAgICBtb3ZlKHZpZXdSZWY6IHZpZXdFbmdpbmVfVmlld1JlZiwgbmV3SW5kZXg6IG51bWJlcik6IHZpZXdFbmdpbmVfVmlld1JlZiB7XG4gICAgICAgIGlmICh2aWV3UmVmLmRlc3Ryb3llZCkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IG1vdmUgYSBkZXN0cm95ZWQgVmlldyBpbiBhIFZpZXdDb250YWluZXIhJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuaW5zZXJ0KHZpZXdSZWYsIG5ld0luZGV4KTtcbiAgICAgIH1cblxuICAgICAgaW5kZXhPZih2aWV3UmVmOiB2aWV3RW5naW5lX1ZpZXdSZWYpOiBudW1iZXIge1xuICAgICAgICBjb25zdCB2aWV3UmVmc0FyciA9IHRoaXMuX2xDb250YWluZXJbVklFV19SRUZTXTtcbiAgICAgICAgcmV0dXJuIHZpZXdSZWZzQXJyICE9PSBudWxsID8gdmlld1JlZnNBcnIuaW5kZXhPZih2aWV3UmVmKSA6IC0xO1xuICAgICAgfVxuXG4gICAgICByZW1vdmUoaW5kZXg/OiBudW1iZXIpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5hbGxvY2F0ZUNvbnRhaW5lcklmTmVlZGVkKCk7XG4gICAgICAgIGNvbnN0IGFkanVzdGVkSWR4ID0gdGhpcy5fYWRqdXN0SW5kZXgoaW5kZXgsIC0xKTtcbiAgICAgICAgcmVtb3ZlVmlldyh0aGlzLl9sQ29udGFpbmVyLCBhZGp1c3RlZElkeCk7XG4gICAgICAgIHJlbW92ZUZyb21BcnJheSh0aGlzLl9sQ29udGFpbmVyW1ZJRVdfUkVGU10gISwgYWRqdXN0ZWRJZHgpO1xuICAgICAgfVxuXG4gICAgICBkZXRhY2goaW5kZXg/OiBudW1iZXIpOiB2aWV3RW5naW5lX1ZpZXdSZWZ8bnVsbCB7XG4gICAgICAgIHRoaXMuYWxsb2NhdGVDb250YWluZXJJZk5lZWRlZCgpO1xuICAgICAgICBjb25zdCBhZGp1c3RlZElkeCA9IHRoaXMuX2FkanVzdEluZGV4KGluZGV4LCAtMSk7XG4gICAgICAgIGNvbnN0IHZpZXcgPSBkZXRhY2hWaWV3KHRoaXMuX2xDb250YWluZXIsIGFkanVzdGVkSWR4KTtcblxuICAgICAgICBjb25zdCB3YXNEZXRhY2hlZCA9XG4gICAgICAgICAgICB2aWV3ICYmIHJlbW92ZUZyb21BcnJheSh0aGlzLl9sQ29udGFpbmVyW1ZJRVdfUkVGU10gISwgYWRqdXN0ZWRJZHgpICE9IG51bGw7XG4gICAgICAgIHJldHVybiB3YXNEZXRhY2hlZCA/IG5ldyBWaWV3UmVmKHZpZXcgISkgOiBudWxsO1xuICAgICAgfVxuXG4gICAgICBwcml2YXRlIF9hZGp1c3RJbmRleChpbmRleD86IG51bWJlciwgc2hpZnQ6IG51bWJlciA9IDApIHtcbiAgICAgICAgaWYgKGluZGV4ID09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5sZW5ndGggKyBzaGlmdDtcbiAgICAgICAgfVxuICAgICAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICAgICAgYXNzZXJ0R3JlYXRlclRoYW4oaW5kZXgsIC0xLCBgVmlld1JlZiBpbmRleCBtdXN0IGJlIHBvc2l0aXZlLCBnb3QgJHtpbmRleH1gKTtcbiAgICAgICAgICAvLyArMSBiZWNhdXNlIGl0J3MgbGVnYWwgdG8gaW5zZXJ0IGF0IHRoZSBlbmQuXG4gICAgICAgICAgYXNzZXJ0TGVzc1RoYW4oaW5kZXgsIHRoaXMubGVuZ3RoICsgMSArIHNoaWZ0LCAnaW5kZXgnKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaW5kZXg7XG4gICAgICB9XG5cbiAgICAgIHByaXZhdGUgYWxsb2NhdGVDb250YWluZXJJZk5lZWRlZCgpOiB2b2lkIHtcbiAgICAgICAgaWYgKHRoaXMuX2xDb250YWluZXJbVklFV19SRUZTXSA9PT0gbnVsbCkge1xuICAgICAgICAgIHRoaXMuX2xDb250YWluZXJbVklFV19SRUZTXSA9IFtdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzKFxuICAgICAgICAgICAgICAgICAgIGhvc3RUTm9kZSwgVE5vZGVUeXBlLkNvbnRhaW5lciwgVE5vZGVUeXBlLkVsZW1lbnQsIFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKTtcblxuICBsZXQgbENvbnRhaW5lcjogTENvbnRhaW5lcjtcbiAgY29uc3Qgc2xvdFZhbHVlID0gaG9zdFZpZXdbaG9zdFROb2RlLmluZGV4XTtcbiAgaWYgKGlzTENvbnRhaW5lcihzbG90VmFsdWUpKSB7XG4gICAgLy8gSWYgdGhlIGhvc3QgaXMgYSBjb250YWluZXIsIHdlIGRvbid0IG5lZWQgdG8gY3JlYXRlIGEgbmV3IExDb250YWluZXJcbiAgICBsQ29udGFpbmVyID0gc2xvdFZhbHVlO1xuICAgIHNldExDb250YWluZXJBY3RpdmVJbmRleChsQ29udGFpbmVyLCBBY3RpdmVJbmRleEZsYWcuRFlOQU1JQ19FTUJFRERFRF9WSUVXU19PTkxZKTtcbiAgfSBlbHNlIHtcbiAgICBsZXQgY29tbWVudE5vZGU6IFJDb21tZW50O1xuICAgIC8vIElmIHRoZSBob3N0IGlzIGFuIGVsZW1lbnQgY29udGFpbmVyLCB0aGUgbmF0aXZlIGhvc3QgZWxlbWVudCBpcyBndWFyYW50ZWVkIHRvIGJlIGFcbiAgICAvLyBjb21tZW50IGFuZCB3ZSBjYW4gcmV1c2UgdGhhdCBjb21tZW50IGFzIGFuY2hvciBlbGVtZW50IGZvciB0aGUgbmV3IExDb250YWluZXIuXG4gICAgLy8gVGhlIGNvbW1lbnQgbm9kZSBpbiBxdWVzdGlvbiBpcyBhbHJlYWR5IHBhcnQgb2YgdGhlIERPTSBzdHJ1Y3R1cmUgc28gd2UgZG9uJ3QgbmVlZCB0byBhcHBlbmRcbiAgICAvLyBpdCBhZ2Fpbi5cbiAgICBpZiAoaG9zdFROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKSB7XG4gICAgICBjb21tZW50Tm9kZSA9IHVud3JhcFJOb2RlKHNsb3RWYWx1ZSkgYXMgUkNvbW1lbnQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJDcmVhdGVDb21tZW50Kys7XG4gICAgICBjb21tZW50Tm9kZSA9IGhvc3RWaWV3W1JFTkRFUkVSXS5jcmVhdGVDb21tZW50KG5nRGV2TW9kZSA/ICdjb250YWluZXInIDogJycpO1xuXG4gICAgICAvLyBBIGBWaWV3Q29udGFpbmVyUmVmYCBjYW4gYmUgaW5qZWN0ZWQgYnkgdGhlIHJvb3QgKHRvcG1vc3QgLyBib290c3RyYXBwZWQpIGNvbXBvbmVudC4gSW5cbiAgICAgIC8vIHRoaXMgY2FzZSB3ZSBjYW4ndCB1c2UgVFZpZXcgLyBUTm9kZSBkYXRhIHN0cnVjdHVyZXMgdG8gaW5zZXJ0IGNvbnRhaW5lcidzIG1hcmtlciBub2RlXG4gICAgICAvLyAoYm90aCBhIHBhcmVudCBvZiBhIGNvbW1lbnQgbm9kZSBhbmQgdGhlIGNvbW1lbnQgbm9kZSBpdHNlbGYgYXJlIG5vdCBwYXJ0IG9mIGFueSB2aWV3KS4gSW5cbiAgICAgIC8vIHRoaXMgc3BlY2lmaWMgY2FzZSB3ZSB1c2UgbG93LWxldmVsIERPTSBtYW5pcHVsYXRpb24gdG8gaW5zZXJ0IGNvbnRhaW5lcidzIG1hcmtlciAoY29tbWVudClcbiAgICAgIC8vIG5vZGUuXG4gICAgICBpZiAoaXNSb290Vmlldyhob3N0VmlldykpIHtcbiAgICAgICAgY29uc3QgcmVuZGVyZXIgPSBob3N0Vmlld1tSRU5ERVJFUl07XG4gICAgICAgIGNvbnN0IGhvc3ROYXRpdmUgPSBnZXROYXRpdmVCeVROb2RlKGhvc3RUTm9kZSwgaG9zdFZpZXcpICE7XG4gICAgICAgIGNvbnN0IHBhcmVudE9mSG9zdE5hdGl2ZSA9IG5hdGl2ZVBhcmVudE5vZGUocmVuZGVyZXIsIGhvc3ROYXRpdmUpO1xuICAgICAgICBuYXRpdmVJbnNlcnRCZWZvcmUoXG4gICAgICAgICAgICByZW5kZXJlciwgcGFyZW50T2ZIb3N0TmF0aXZlICEsIGNvbW1lbnROb2RlLCBuYXRpdmVOZXh0U2libGluZyhyZW5kZXJlciwgaG9zdE5hdGl2ZSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXBwZW5kQ2hpbGQoY29tbWVudE5vZGUsIGhvc3RUTm9kZSwgaG9zdFZpZXcpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGhvc3RWaWV3W2hvc3RUTm9kZS5pbmRleF0gPSBsQ29udGFpbmVyID1cbiAgICAgICAgY3JlYXRlTENvbnRhaW5lcihzbG90VmFsdWUsIGhvc3RWaWV3LCBjb21tZW50Tm9kZSwgaG9zdFROb2RlKTtcblxuICAgIGFkZFRvVmlld1RyZWUoaG9zdFZpZXcsIGxDb250YWluZXIpO1xuICB9XG5cbiAgcmV0dXJuIG5ldyBSM1ZpZXdDb250YWluZXJSZWYobENvbnRhaW5lciwgaG9zdFROb2RlLCBob3N0Vmlldyk7XG59XG5cblxuLyoqIFJldHVybnMgYSBDaGFuZ2VEZXRlY3RvclJlZiAoYS5rLmEuIGEgVmlld1JlZikgKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RDaGFuZ2VEZXRlY3RvclJlZihpc1BpcGUgPSBmYWxzZSk6IFZpZXdFbmdpbmVfQ2hhbmdlRGV0ZWN0b3JSZWYge1xuICByZXR1cm4gY3JlYXRlVmlld1JlZihnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKSwgZ2V0TFZpZXcoKSwgaXNQaXBlKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgVmlld1JlZiBhbmQgc3RvcmVzIGl0IG9uIHRoZSBpbmplY3RvciBhcyBDaGFuZ2VEZXRlY3RvclJlZiAocHVibGljIGFsaWFzKS5cbiAqXG4gKiBAcGFyYW0gdE5vZGUgVGhlIG5vZGUgdGhhdCBpcyByZXF1ZXN0aW5nIGEgQ2hhbmdlRGV0ZWN0b3JSZWZcbiAqIEBwYXJhbSBsVmlldyBUaGUgdmlldyB0byB3aGljaCB0aGUgbm9kZSBiZWxvbmdzXG4gKiBAcGFyYW0gaXNQaXBlIFdoZXRoZXIgdGhlIHZpZXcgaXMgYmVpbmcgaW5qZWN0ZWQgaW50byBhIHBpcGUuXG4gKiBAcmV0dXJucyBUaGUgQ2hhbmdlRGV0ZWN0b3JSZWYgdG8gdXNlXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZVZpZXdSZWYodE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcsIGlzUGlwZTogYm9vbGVhbik6IFZpZXdFbmdpbmVfQ2hhbmdlRGV0ZWN0b3JSZWYge1xuICAvLyBgaXNDb21wb25lbnRWaWV3YCB3aWxsIGJlIHRydWUgZm9yIENvbXBvbmVudCBhbmQgRGlyZWN0aXZlcyAoYnV0IG5vdCBmb3IgUGlwZXMpLlxuICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvYW5ndWxhci9wdWxsLzMzMDcyIGZvciBwcm9wZXIgZml4XG4gIGNvbnN0IGlzQ29tcG9uZW50VmlldyA9ICFpc1BpcGUgJiYgaXNDb21wb25lbnRIb3N0KHROb2RlKTtcbiAgaWYgKGlzQ29tcG9uZW50Vmlldykge1xuICAgIC8vIFRoZSBMVmlldyByZXByZXNlbnRzIHRoZSBsb2NhdGlvbiB3aGVyZSB0aGUgY29tcG9uZW50IGlzIGRlY2xhcmVkLlxuICAgIC8vIEluc3RlYWQgd2Ugd2FudCB0aGUgTFZpZXcgZm9yIHRoZSBjb21wb25lbnQgVmlldyBhbmQgc28gd2UgbmVlZCB0byBsb29rIGl0IHVwLlxuICAgIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBnZXRDb21wb25lbnRMVmlld0J5SW5kZXgodE5vZGUuaW5kZXgsIGxWaWV3KTsgIC8vIGxvb2sgZG93blxuICAgIHJldHVybiBuZXcgVmlld1JlZihjb21wb25lbnRWaWV3LCBjb21wb25lbnRWaWV3KTtcbiAgfSBlbHNlIGlmIChcbiAgICAgIHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50IHx8IHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Db250YWluZXIgfHxcbiAgICAgIHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyIHx8IHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5JY3VDb250YWluZXIpIHtcbiAgICAvLyBUaGUgTFZpZXcgcmVwcmVzZW50cyB0aGUgbG9jYXRpb24gd2hlcmUgdGhlIGluamVjdGlvbiBpcyByZXF1ZXN0ZWQgZnJvbS5cbiAgICAvLyBXZSBuZWVkIHRvIGxvY2F0ZSB0aGUgY29udGFpbmluZyBMVmlldyAoaW4gY2FzZSB3aGVyZSB0aGUgYGxWaWV3YCBpcyBhbiBlbWJlZGRlZCB2aWV3KVxuICAgIGNvbnN0IGhvc3RDb21wb25lbnRWaWV3ID0gbFZpZXdbREVDTEFSQVRJT05fQ09NUE9ORU5UX1ZJRVddOyAgLy8gbG9vayB1cFxuICAgIHJldHVybiBuZXcgVmlld1JlZihob3N0Q29tcG9uZW50VmlldywgbFZpZXcpO1xuICB9XG4gIHJldHVybiBudWxsICE7XG59XG5cbi8qKiBSZXR1cm5zIGEgUmVuZGVyZXIyIChvciB0aHJvd3Mgd2hlbiBhcHBsaWNhdGlvbiB3YXMgYm9vdHN0cmFwcGVkIHdpdGggUmVuZGVyZXIzKSAqL1xuZnVuY3Rpb24gZ2V0T3JDcmVhdGVSZW5kZXJlcjIodmlldzogTFZpZXcpOiBSZW5kZXJlcjIge1xuICBjb25zdCByZW5kZXJlciA9IHZpZXdbUkVOREVSRVJdO1xuICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgcmV0dXJuIHJlbmRlcmVyIGFzIFJlbmRlcmVyMjtcbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBpbmplY3QgUmVuZGVyZXIyIHdoZW4gdGhlIGFwcGxpY2F0aW9uIHVzZXMgUmVuZGVyZXIzIScpO1xuICB9XG59XG5cbi8qKiBJbmplY3RzIGEgUmVuZGVyZXIyIGZvciB0aGUgY3VycmVudCBjb21wb25lbnQuICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0UmVuZGVyZXIyKCk6IFJlbmRlcmVyMiB7XG4gIC8vIFdlIG5lZWQgdGhlIFJlbmRlcmVyIHRvIGJlIGJhc2VkIG9uIHRoZSBjb21wb25lbnQgdGhhdCBpdCdzIGJlaW5nIGluamVjdGVkIGludG8sIGhvd2V2ZXIgc2luY2VcbiAgLy8gREkgaGFwcGVucyBiZWZvcmUgd2UndmUgZW50ZXJlZCBpdHMgdmlldywgYGdldExWaWV3YCB3aWxsIHJldHVybiB0aGUgcGFyZW50IHZpZXcgaW5zdGVhZC5cbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICBjb25zdCBub2RlQXRJbmRleCA9IGdldENvbXBvbmVudExWaWV3QnlJbmRleCh0Tm9kZS5pbmRleCwgbFZpZXcpO1xuICByZXR1cm4gZ2V0T3JDcmVhdGVSZW5kZXJlcjIoaXNMVmlldyhub2RlQXRJbmRleCkgPyBub2RlQXRJbmRleCA6IGxWaWV3KTtcbn1cbiJdfQ==