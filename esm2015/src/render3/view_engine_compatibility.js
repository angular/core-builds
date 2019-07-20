/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { NgModuleRef as viewEngine_NgModuleRef } from '../linker/ng_module_factory';
import { assertDefined, assertGreaterThan, assertLessThan } from '../util/assert';
import { assertLContainer } from './assert';
import { NodeInjector, getParentInjectorLocation } from './di';
import { addToViewTree, createEmbeddedViewAndNode, createLContainer, renderEmbeddedTemplate } from './instructions/shared';
import { ACTIVE_INDEX, CONTAINER_HEADER_OFFSET, VIEW_REFS } from './interfaces/container';
import { isProceduralRenderer } from './interfaces/renderer';
import { isComponent, isLContainer, isLView, isRootView } from './interfaces/type_checks';
import { CONTEXT, DECLARATION_LCONTAINER, QUERIES, RENDERER, T_HOST } from './interfaces/view';
import { assertNodeOfPossibleTypes } from './node_assert';
import { addRemoveViewFromContainer, appendChild, detachView, getBeforeNodeForView, insertView, nativeInsertBefore, nativeNextSibling, nativeParentNode, removeView } from './node_manipulation';
import { getParentInjectorTNode } from './node_util';
import { getLView, getPreviousOrParentTNode } from './state';
import { getParentInjectorView, hasParentInjector } from './util/injector_utils';
import { findComponentView } from './util/view_traversal_utils';
import { getComponentViewByIndex, getNativeByTNode, unwrapRNode, viewAttachedToContainer } from './util/view_utils';
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
                const lView = createEmbeddedViewAndNode(embeddedTView, context, this._declarationView, this._declarationTContainer.injectorIndex);
                /** @type {?} */
                const declarationLContainer = this._declarationView[this._declarationTContainer.index];
                ngDevMode && assertLContainer(declarationLContainer);
                lView[DECLARATION_LCONTAINER] = declarationLContainer;
                /** @type {?} */
                const declarationViewLQueries = this._declarationView[QUERIES];
                if (declarationViewLQueries !== null) {
                    lView[QUERIES] = declarationViewLQueries.createEmbeddedView(embeddedTView);
                }
                renderEmbeddedTemplate(lView, embeddedTView, context);
                /** @type {?} */
                const viewRef = new ViewRef(lView, context, -1);
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
                while (this.length) {
                    this.remove(0);
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
            get length() {
                // Note that if there are no views, the container
                // length will be smaller than the header offset.
                /** @type {?} */
                const viewAmount = this._lContainer.length - CONTAINER_HEADER_OFFSET;
                return viewAmount > 0 ? viewAmount : 0;
            }
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
                    ngModuleRef = contextInjector.get(viewEngine_NgModuleRef, null);
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
                if (viewRef.destroyed) {
                    throw new Error('Cannot insert a destroyed View in a ViewContainer!');
                }
                this.allocateContainerIfNeeded();
                /** @type {?} */
                const lView = (/** @type {?} */ (((/** @type {?} */ (viewRef)))._lView));
                /** @type {?} */
                const adjustedIdx = this._adjustIndex(index);
                if (viewAttachedToContainer(lView)) {
                    // If view is already attached, fall back to move() so we clean up
                    // references appropriately.
                    return this.move(viewRef, adjustedIdx);
                }
                insertView(lView, this._lContainer, adjustedIdx);
                /** @type {?} */
                const beforeNode = getBeforeNodeForView(adjustedIdx, this._lContainer);
                addRemoveViewFromContainer(lView, true, beforeNode);
                ((/** @type {?} */ (viewRef))).attachToViewContainerRef(this);
                (/** @type {?} */ (this._lContainer[VIEW_REFS])).splice(adjustedIdx, 0, viewRef);
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
                /** @type {?} */
                const index = this.indexOf(viewRef);
                if (index !== -1)
                    this.detach(index);
                this.insert(viewRef, newIndex);
                return viewRef;
            }
            /**
             * @param {?} viewRef
             * @return {?}
             */
            indexOf(viewRef) {
                return this._lContainer[VIEW_REFS] !== null ?
                    (/** @type {?} */ (this._lContainer[VIEW_REFS])).indexOf(viewRef) :
                    0;
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
                (/** @type {?} */ (this._lContainer[VIEW_REFS])).splice(adjustedIdx, 1);
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
                const wasDetached = view && (/** @type {?} */ (this._lContainer[VIEW_REFS])).splice(adjustedIdx, 1)[0] != null;
                return wasDetached ? new ViewRef((/** @type {?} */ (view)), (/** @type {?} */ (view))[CONTEXT], -1) : null;
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
                    assertGreaterThan(index, -1, 'index must be positive');
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
        lContainer[ACTIVE_INDEX] = -1;
    }
    else {
        /** @type {?} */
        let commentNode;
        // If the host is an element container, the native host element is guaranteed to be a
        // comment and we can reuse that comment as anchor element for the new LContainer.
        if (hostTNode.type === 4 /* ElementContainer */) {
            commentNode = (/** @type {?} */ (unwrapRNode(slotValue)));
        }
        else {
            ngDevMode && ngDevMode.rendererCreateComment++;
            commentNode = hostView[RENDERER].createComment(ngDevMode ? 'container' : '');
        }
        // A container can be created on the root (topmost / bootstrapped) component and in this case we
        // can't use LTree to insert container's marker node (both parent of a comment node and the
        // commend node itself is located outside of elements hold by LTree). In this specific case we
        // use low-level DOM manipulation to insert container's marker (comment) node.
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
        hostView[hostTNode.index] = lContainer =
            createLContainer(slotValue, hostView, commentNode, hostTNode, true);
        addToViewTree(hostView, lContainer);
    }
    return new R3ViewContainerRef(lContainer, hostTNode, hostView);
}
/**
 * Returns a ChangeDetectorRef (a.k.a. a ViewRef)
 * @return {?}
 */
export function injectChangeDetectorRef() {
    return createViewRef(getPreviousOrParentTNode(), getLView(), null);
}
/**
 * Creates a ViewRef and stores it on the injector as ChangeDetectorRef (public alias).
 *
 * @param {?} hostTNode The node that is requesting a ChangeDetectorRef
 * @param {?} hostView The view to which the node belongs
 * @param {?} context The context for this change detector ref
 * @return {?} The ChangeDetectorRef to use
 */
export function createViewRef(hostTNode, hostView, context) {
    if (isComponent(hostTNode)) {
        /** @type {?} */
        const componentIndex = hostTNode.directiveStart;
        /** @type {?} */
        const componentView = getComponentViewByIndex(hostTNode.index, hostView);
        return new ViewRef(componentView, context, componentIndex);
    }
    else if (hostTNode.type === 3 /* Element */ || hostTNode.type === 0 /* Container */ ||
        hostTNode.type === 4 /* ElementContainer */) {
        /** @type {?} */
        const hostComponentView = findComponentView(hostView);
        return new ViewRef(hostComponentView, hostComponentView[CONTEXT], -1);
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
    const nodeAtIndex = getComponentViewByIndex(tNode.index, lView);
    return getOrCreateRenderer2(isLView(nodeAtIndex) ? nodeAtIndex : lView);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld19lbmdpbmVfY29tcGF0aWJpbGl0eS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvdmlld19lbmdpbmVfY29tcGF0aWJpbGl0eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVlBLE9BQU8sRUFBQyxXQUFXLElBQUksc0JBQXNCLEVBQUMsTUFBTSw2QkFBNkIsQ0FBQztBQUtsRixPQUFPLEVBQUMsYUFBYSxFQUFFLGlCQUFpQixFQUFFLGNBQWMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRWhGLE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUMxQyxPQUFPLEVBQUMsWUFBWSxFQUFFLHlCQUF5QixFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQzdELE9BQU8sRUFBQyxhQUFhLEVBQUUseUJBQXlCLEVBQUUsZ0JBQWdCLEVBQUUsc0JBQXNCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUN6SCxPQUFPLEVBQUMsWUFBWSxFQUFFLHVCQUF1QixFQUFjLFNBQVMsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBRXBHLE9BQU8sRUFBcUIsb0JBQW9CLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUUvRSxPQUFPLEVBQUMsV0FBVyxFQUFFLFlBQVksRUFBRSxPQUFPLEVBQUUsVUFBVSxFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFDeEYsT0FBTyxFQUFDLE9BQU8sRUFBRSxzQkFBc0IsRUFBUyxPQUFPLEVBQUUsUUFBUSxFQUFTLE1BQU0sRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRTNHLE9BQU8sRUFBQyx5QkFBeUIsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUN4RCxPQUFPLEVBQUMsMEJBQTBCLEVBQUUsV0FBVyxFQUFFLFVBQVUsRUFBRSxvQkFBb0IsRUFBRSxVQUFVLEVBQUUsa0JBQWtCLEVBQUUsaUJBQWlCLEVBQUUsZ0JBQWdCLEVB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OztVQUd2QixLQUFLLEdBQUcsUUFBUSxFQUFFOztVQUNsQixLQUFLLEdBQUcsd0JBQXdCLEVBQUU7O1VBQ2xDLFdBQVcsR0FBRyx1QkFBdUIsQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQztJQUMvRCxPQUFPLG9CQUFvQixDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUMxRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0NoYW5nZURldGVjdG9yUmVmIGFzIFZpZXdFbmdpbmVfQ2hhbmdlRGV0ZWN0b3JSZWZ9IGZyb20gJy4uL2NoYW5nZV9kZXRlY3Rpb24vY2hhbmdlX2RldGVjdG9yX3JlZic7XG5pbXBvcnQge0luamVjdG9yfSBmcm9tICcuLi9kaS9pbmplY3Rvcic7XG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnkgYXMgdmlld0VuZ2luZV9Db21wb25lbnRGYWN0b3J5LCBDb21wb25lbnRSZWYgYXMgdmlld0VuZ2luZV9Db21wb25lbnRSZWZ9IGZyb20gJy4uL2xpbmtlci9jb21wb25lbnRfZmFjdG9yeSc7XG5pbXBvcnQge0VsZW1lbnRSZWYgYXMgVmlld0VuZ2luZV9FbGVtZW50UmVmfSBmcm9tICcuLi9saW5rZXIvZWxlbWVudF9yZWYnO1xuaW1wb3J0IHtOZ01vZHVsZVJlZiBhcyB2aWV3RW5naW5lX05nTW9kdWxlUmVmfSBmcm9tICcuLi9saW5rZXIvbmdfbW9kdWxlX2ZhY3RvcnknO1xuaW1wb3J0IHtUZW1wbGF0ZVJlZiBhcyBWaWV3RW5naW5lX1RlbXBsYXRlUmVmfSBmcm9tICcuLi9saW5rZXIvdGVtcGxhdGVfcmVmJztcbmltcG9ydCB7Vmlld0NvbnRhaW5lclJlZiBhcyBWaWV3RW5naW5lX1ZpZXdDb250YWluZXJSZWZ9IGZyb20gJy4uL2xpbmtlci92aWV3X2NvbnRhaW5lcl9yZWYnO1xuaW1wb3J0IHtFbWJlZGRlZFZpZXdSZWYgYXMgdmlld0VuZ2luZV9FbWJlZGRlZFZpZXdSZWYsIFZpZXdSZWYgYXMgdmlld0VuZ2luZV9WaWV3UmVmfSBmcm9tICcuLi9saW5rZXIvdmlld19yZWYnO1xuaW1wb3J0IHtSZW5kZXJlcjJ9IGZyb20gJy4uL3JlbmRlci9hcGknO1xuaW1wb3J0IHthc3NlcnREZWZpbmVkLCBhc3NlcnRHcmVhdGVyVGhhbiwgYXNzZXJ0TGVzc1RoYW59IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcblxuaW1wb3J0IHthc3NlcnRMQ29udGFpbmVyfSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge05vZGVJbmplY3RvciwgZ2V0UGFyZW50SW5qZWN0b3JMb2NhdGlvbn0gZnJvbSAnLi9kaSc7XG5pbXBvcnQge2FkZFRvVmlld1RyZWUsIGNyZWF0ZUVtYmVkZGVkVmlld0FuZE5vZGUsIGNyZWF0ZUxDb250YWluZXIsIHJlbmRlckVtYmVkZGVkVGVtcGxhdGV9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zL3NoYXJlZCc7XG5pbXBvcnQge0FDVElWRV9JTkRFWCwgQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQsIExDb250YWluZXIsIFZJRVdfUkVGU30gZnJvbSAnLi9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge1RDb250YWluZXJOb2RlLCBURWxlbWVudENvbnRhaW5lck5vZGUsIFRFbGVtZW50Tm9kZSwgVE5vZGUsIFROb2RlVHlwZSwgVFZpZXdOb2RlfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1JDb21tZW50LCBSRWxlbWVudCwgaXNQcm9jZWR1cmFsUmVuZGVyZXJ9IGZyb20gJy4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5cbmltcG9ydCB7aXNDb21wb25lbnQsIGlzTENvbnRhaW5lciwgaXNMVmlldywgaXNSb290Vmlld30gZnJvbSAnLi9pbnRlcmZhY2VzL3R5cGVfY2hlY2tzJztcbmltcG9ydCB7Q09OVEVYVCwgREVDTEFSQVRJT05fTENPTlRBSU5FUiwgTFZpZXcsIFFVRVJJRVMsIFJFTkRFUkVSLCBUVmlldywgVF9IT1NUfSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5cbmltcG9ydCB7YXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlc30gZnJvbSAnLi9ub2RlX2Fzc2VydCc7XG5pbXBvcnQge2FkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyLCBhcHBlbmRDaGlsZCwgZGV0YWNoVmlldywgZ2V0QmVmb3JlTm9kZUZvclZpZXcsIGluc2VydFZpZXcsIG5hdGl2ZUluc2VydEJlZm9yZSwgbmF0aXZlTmV4dFNpYmxpbmcsIG5hdGl2ZVBhcmVudE5vZGUsIHJlbW92ZVZpZXd9IGZyb20gJy4vbm9kZV9tYW5pcHVsYXRpb24nO1xuaW1wb3J0IHtnZXRQYXJlbnRJbmplY3RvclROb2RlfSBmcm9tICcuL25vZGVfdXRpbCc7XG5pbXBvcnQge2dldExWaWV3LCBnZXRQcmV2aW91c09yUGFyZW50VE5vZGV9IGZyb20gJy4vc3RhdGUnO1xuaW1wb3J0IHtnZXRQYXJlbnRJbmplY3RvclZpZXcsIGhhc1BhcmVudEluamVjdG9yfSBmcm9tICcuL3V0aWwvaW5qZWN0b3JfdXRpbHMnO1xuaW1wb3J0IHtmaW5kQ29tcG9uZW50Vmlld30gZnJvbSAnLi91dGlsL3ZpZXdfdHJhdmVyc2FsX3V0aWxzJztcbmltcG9ydCB7Z2V0Q29tcG9uZW50Vmlld0J5SW5kZXgsIGdldE5hdGl2ZUJ5VE5vZGUsIHVud3JhcFJOb2RlLCB2aWV3QXR0YWNoZWRUb0NvbnRhaW5lcn0gZnJvbSAnLi91dGlsL3ZpZXdfdXRpbHMnO1xuaW1wb3J0IHtWaWV3UmVmfSBmcm9tICcuL3ZpZXdfcmVmJztcblxuXG5cbi8qKlxuICogQ3JlYXRlcyBhbiBFbGVtZW50UmVmIGZyb20gdGhlIG1vc3QgcmVjZW50IG5vZGUuXG4gKlxuICogQHJldHVybnMgVGhlIEVsZW1lbnRSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RFbGVtZW50UmVmKEVsZW1lbnRSZWZUb2tlbjogdHlwZW9mIFZpZXdFbmdpbmVfRWxlbWVudFJlZik6XG4gICAgVmlld0VuZ2luZV9FbGVtZW50UmVmIHtcbiAgcmV0dXJuIGNyZWF0ZUVsZW1lbnRSZWYoRWxlbWVudFJlZlRva2VuLCBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKSwgZ2V0TFZpZXcoKSk7XG59XG5cbmxldCBSM0VsZW1lbnRSZWY6IHtuZXcgKG5hdGl2ZTogUkVsZW1lbnQgfCBSQ29tbWVudCk6IFZpZXdFbmdpbmVfRWxlbWVudFJlZn07XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBFbGVtZW50UmVmIGdpdmVuIGEgbm9kZS5cbiAqXG4gKiBAcGFyYW0gRWxlbWVudFJlZlRva2VuIFRoZSBFbGVtZW50UmVmIHR5cGVcbiAqIEBwYXJhbSB0Tm9kZSBUaGUgbm9kZSBmb3Igd2hpY2ggeW91J2QgbGlrZSBhbiBFbGVtZW50UmVmXG4gKiBAcGFyYW0gdmlldyBUaGUgdmlldyB0byB3aGljaCB0aGUgbm9kZSBiZWxvbmdzXG4gKiBAcmV0dXJucyBUaGUgRWxlbWVudFJlZiBpbnN0YW5jZSB0byB1c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVsZW1lbnRSZWYoXG4gICAgRWxlbWVudFJlZlRva2VuOiB0eXBlb2YgVmlld0VuZ2luZV9FbGVtZW50UmVmLCB0Tm9kZTogVE5vZGUsXG4gICAgdmlldzogTFZpZXcpOiBWaWV3RW5naW5lX0VsZW1lbnRSZWYge1xuICBpZiAoIVIzRWxlbWVudFJlZikge1xuICAgIC8vIFRPRE86IEZpeCBjbGFzcyBuYW1lLCBzaG91bGQgYmUgRWxlbWVudFJlZiwgYnV0IHRoZXJlIGFwcGVhcnMgdG8gYmUgYSByb2xsdXAgYnVnXG4gICAgUjNFbGVtZW50UmVmID0gY2xhc3MgRWxlbWVudFJlZl8gZXh0ZW5kcyBFbGVtZW50UmVmVG9rZW4ge307XG4gIH1cbiAgcmV0dXJuIG5ldyBSM0VsZW1lbnRSZWYoZ2V0TmF0aXZlQnlUTm9kZSh0Tm9kZSwgdmlldykgYXMgUkVsZW1lbnQpO1xufVxuXG5sZXQgUjNUZW1wbGF0ZVJlZjoge1xuICBuZXcgKF9kZWNsYXJhdGlvblBhcmVudFZpZXc6IExWaWV3LCBob3N0VE5vZGU6IFRDb250YWluZXJOb2RlLCBlbGVtZW50UmVmOiBWaWV3RW5naW5lX0VsZW1lbnRSZWYpOlxuICAgICAgVmlld0VuZ2luZV9UZW1wbGF0ZVJlZjxhbnk+XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBUZW1wbGF0ZVJlZiBnaXZlbiBhIG5vZGUuXG4gKlxuICogQHJldHVybnMgVGhlIFRlbXBsYXRlUmVmIGluc3RhbmNlIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0VGVtcGxhdGVSZWY8VD4oXG4gICAgVGVtcGxhdGVSZWZUb2tlbjogdHlwZW9mIFZpZXdFbmdpbmVfVGVtcGxhdGVSZWYsXG4gICAgRWxlbWVudFJlZlRva2VuOiB0eXBlb2YgVmlld0VuZ2luZV9FbGVtZW50UmVmKTogVmlld0VuZ2luZV9UZW1wbGF0ZVJlZjxUPnxudWxsIHtcbiAgcmV0dXJuIGNyZWF0ZVRlbXBsYXRlUmVmPFQ+KFxuICAgICAgVGVtcGxhdGVSZWZUb2tlbiwgRWxlbWVudFJlZlRva2VuLCBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKSwgZ2V0TFZpZXcoKSk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIFRlbXBsYXRlUmVmIGFuZCBzdG9yZXMgaXQgb24gdGhlIGluamVjdG9yLlxuICpcbiAqIEBwYXJhbSBUZW1wbGF0ZVJlZlRva2VuIFRoZSBUZW1wbGF0ZVJlZiB0eXBlXG4gKiBAcGFyYW0gRWxlbWVudFJlZlRva2VuIFRoZSBFbGVtZW50UmVmIHR5cGVcbiAqIEBwYXJhbSBob3N0VE5vZGUgVGhlIG5vZGUgb24gd2hpY2ggYSBUZW1wbGF0ZVJlZiBpcyByZXF1ZXN0ZWRcbiAqIEBwYXJhbSBob3N0VmlldyBUaGUgdmlldyB0byB3aGljaCB0aGUgbm9kZSBiZWxvbmdzXG4gKiBAcmV0dXJucyBUaGUgVGVtcGxhdGVSZWYgaW5zdGFuY2Ugb3IgbnVsbCBpZiB3ZSBjYW4ndCBjcmVhdGUgYSBUZW1wbGF0ZVJlZiBvbiBhIGdpdmVuIG5vZGUgdHlwZVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVGVtcGxhdGVSZWY8VD4oXG4gICAgVGVtcGxhdGVSZWZUb2tlbjogdHlwZW9mIFZpZXdFbmdpbmVfVGVtcGxhdGVSZWYsIEVsZW1lbnRSZWZUb2tlbjogdHlwZW9mIFZpZXdFbmdpbmVfRWxlbWVudFJlZixcbiAgICBob3N0VE5vZGU6IFROb2RlLCBob3N0VmlldzogTFZpZXcpOiBWaWV3RW5naW5lX1RlbXBsYXRlUmVmPFQ+fG51bGwge1xuICBpZiAoIVIzVGVtcGxhdGVSZWYpIHtcbiAgICAvLyBUT0RPOiBGaXggY2xhc3MgbmFtZSwgc2hvdWxkIGJlIFRlbXBsYXRlUmVmLCBidXQgdGhlcmUgYXBwZWFycyB0byBiZSBhIHJvbGx1cCBidWdcbiAgICBSM1RlbXBsYXRlUmVmID0gY2xhc3MgVGVtcGxhdGVSZWZfPFQ+IGV4dGVuZHMgVGVtcGxhdGVSZWZUb2tlbjxUPiB7XG4gICAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgICBwcml2YXRlIF9kZWNsYXJhdGlvblZpZXc6IExWaWV3LCBwcml2YXRlIF9kZWNsYXJhdGlvblRDb250YWluZXI6IFRDb250YWluZXJOb2RlLFxuICAgICAgICAgIHJlYWRvbmx5IGVsZW1lbnRSZWY6IFZpZXdFbmdpbmVfRWxlbWVudFJlZikge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgfVxuXG4gICAgICBjcmVhdGVFbWJlZGRlZFZpZXcoY29udGV4dDogVCk6IHZpZXdFbmdpbmVfRW1iZWRkZWRWaWV3UmVmPFQ+IHtcbiAgICAgICAgY29uc3QgZW1iZWRkZWRUVmlldyA9IHRoaXMuX2RlY2xhcmF0aW9uVENvbnRhaW5lci50Vmlld3MgYXMgVFZpZXc7XG4gICAgICAgIGNvbnN0IGxWaWV3ID0gY3JlYXRlRW1iZWRkZWRWaWV3QW5kTm9kZShcbiAgICAgICAgICAgIGVtYmVkZGVkVFZpZXcsIGNvbnRleHQsIHRoaXMuX2RlY2xhcmF0aW9uVmlldyxcbiAgICAgICAgICAgIHRoaXMuX2RlY2xhcmF0aW9uVENvbnRhaW5lci5pbmplY3RvckluZGV4KTtcblxuICAgICAgICBjb25zdCBkZWNsYXJhdGlvbkxDb250YWluZXIgPSB0aGlzLl9kZWNsYXJhdGlvblZpZXdbdGhpcy5fZGVjbGFyYXRpb25UQ29udGFpbmVyLmluZGV4XTtcbiAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydExDb250YWluZXIoZGVjbGFyYXRpb25MQ29udGFpbmVyKTtcbiAgICAgICAgbFZpZXdbREVDTEFSQVRJT05fTENPTlRBSU5FUl0gPSBkZWNsYXJhdGlvbkxDb250YWluZXI7XG5cbiAgICAgICAgY29uc3QgZGVjbGFyYXRpb25WaWV3TFF1ZXJpZXMgPSB0aGlzLl9kZWNsYXJhdGlvblZpZXdbUVVFUklFU107XG4gICAgICAgIGlmIChkZWNsYXJhdGlvblZpZXdMUXVlcmllcyAhPT0gbnVsbCkge1xuICAgICAgICAgIGxWaWV3W1FVRVJJRVNdID0gZGVjbGFyYXRpb25WaWV3TFF1ZXJpZXMuY3JlYXRlRW1iZWRkZWRWaWV3KGVtYmVkZGVkVFZpZXcpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVuZGVyRW1iZWRkZWRUZW1wbGF0ZShsVmlldywgZW1iZWRkZWRUVmlldywgY29udGV4dCk7XG4gICAgICAgIGNvbnN0IHZpZXdSZWYgPSBuZXcgVmlld1JlZihsVmlldywgY29udGV4dCwgLTEpO1xuICAgICAgICB2aWV3UmVmLl90Vmlld05vZGUgPSBsVmlld1tUX0hPU1RdIGFzIFRWaWV3Tm9kZTtcbiAgICAgICAgcmV0dXJuIHZpZXdSZWY7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIGlmIChob3N0VE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGhvc3RUTm9kZS50Vmlld3MsICdUVmlldyBtdXN0IGJlIGFsbG9jYXRlZCcpO1xuICAgIHJldHVybiBuZXcgUjNUZW1wbGF0ZVJlZihcbiAgICAgICAgaG9zdFZpZXcsIGhvc3RUTm9kZSBhcyBUQ29udGFpbmVyTm9kZSxcbiAgICAgICAgY3JlYXRlRWxlbWVudFJlZihFbGVtZW50UmVmVG9rZW4sIGhvc3RUTm9kZSwgaG9zdFZpZXcpKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG5sZXQgUjNWaWV3Q29udGFpbmVyUmVmOiB7XG4gIG5ldyAoXG4gICAgICBsQ29udGFpbmVyOiBMQ29udGFpbmVyLCBob3N0VE5vZGU6IFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIHwgVEVsZW1lbnRDb250YWluZXJOb2RlLFxuICAgICAgaG9zdFZpZXc6IExWaWV3KTogVmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmXG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBWaWV3Q29udGFpbmVyUmVmIGFuZCBzdG9yZXMgaXQgb24gdGhlIGluamVjdG9yLiBPciwgaWYgdGhlIFZpZXdDb250YWluZXJSZWZcbiAqIGFscmVhZHkgZXhpc3RzLCByZXRyaWV2ZXMgdGhlIGV4aXN0aW5nIFZpZXdDb250YWluZXJSZWYuXG4gKlxuICogQHJldHVybnMgVGhlIFZpZXdDb250YWluZXJSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RWaWV3Q29udGFpbmVyUmVmKFxuICAgIFZpZXdDb250YWluZXJSZWZUb2tlbjogdHlwZW9mIFZpZXdFbmdpbmVfVmlld0NvbnRhaW5lclJlZixcbiAgICBFbGVtZW50UmVmVG9rZW46IHR5cGVvZiBWaWV3RW5naW5lX0VsZW1lbnRSZWYpOiBWaWV3RW5naW5lX1ZpZXdDb250YWluZXJSZWYge1xuICBjb25zdCBwcmV2aW91c1ROb2RlID1cbiAgICAgIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpIGFzIFRFbGVtZW50Tm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSB8IFRDb250YWluZXJOb2RlO1xuICByZXR1cm4gY3JlYXRlQ29udGFpbmVyUmVmKFZpZXdDb250YWluZXJSZWZUb2tlbiwgRWxlbWVudFJlZlRva2VuLCBwcmV2aW91c1ROb2RlLCBnZXRMVmlldygpKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgVmlld0NvbnRhaW5lclJlZiBhbmQgc3RvcmVzIGl0IG9uIHRoZSBpbmplY3Rvci5cbiAqXG4gKiBAcGFyYW0gVmlld0NvbnRhaW5lclJlZlRva2VuIFRoZSBWaWV3Q29udGFpbmVyUmVmIHR5cGVcbiAqIEBwYXJhbSBFbGVtZW50UmVmVG9rZW4gVGhlIEVsZW1lbnRSZWYgdHlwZVxuICogQHBhcmFtIGhvc3RUTm9kZSBUaGUgbm9kZSB0aGF0IGlzIHJlcXVlc3RpbmcgYSBWaWV3Q29udGFpbmVyUmVmXG4gKiBAcGFyYW0gaG9zdFZpZXcgVGhlIHZpZXcgdG8gd2hpY2ggdGhlIG5vZGUgYmVsb25nc1xuICogQHJldHVybnMgVGhlIFZpZXdDb250YWluZXJSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVDb250YWluZXJSZWYoXG4gICAgVmlld0NvbnRhaW5lclJlZlRva2VuOiB0eXBlb2YgVmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmLFxuICAgIEVsZW1lbnRSZWZUb2tlbjogdHlwZW9mIFZpZXdFbmdpbmVfRWxlbWVudFJlZixcbiAgICBob3N0VE5vZGU6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxURWxlbWVudENvbnRhaW5lck5vZGUsXG4gICAgaG9zdFZpZXc6IExWaWV3KTogVmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmIHtcbiAgaWYgKCFSM1ZpZXdDb250YWluZXJSZWYpIHtcbiAgICAvLyBUT0RPOiBGaXggY2xhc3MgbmFtZSwgc2hvdWxkIGJlIFZpZXdDb250YWluZXJSZWYsIGJ1dCB0aGVyZSBhcHBlYXJzIHRvIGJlIGEgcm9sbHVwIGJ1Z1xuICAgIFIzVmlld0NvbnRhaW5lclJlZiA9IGNsYXNzIFZpZXdDb250YWluZXJSZWZfIGV4dGVuZHMgVmlld0NvbnRhaW5lclJlZlRva2VuIHtcbiAgICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICAgIHByaXZhdGUgX2xDb250YWluZXI6IExDb250YWluZXIsXG4gICAgICAgICAgcHJpdmF0ZSBfaG9zdFROb2RlOiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlLFxuICAgICAgICAgIHByaXZhdGUgX2hvc3RWaWV3OiBMVmlldykge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgfVxuXG4gICAgICBnZXQgZWxlbWVudCgpOiBWaWV3RW5naW5lX0VsZW1lbnRSZWYge1xuICAgICAgICByZXR1cm4gY3JlYXRlRWxlbWVudFJlZihFbGVtZW50UmVmVG9rZW4sIHRoaXMuX2hvc3RUTm9kZSwgdGhpcy5faG9zdFZpZXcpO1xuICAgICAgfVxuXG4gICAgICBnZXQgaW5qZWN0b3IoKTogSW5qZWN0b3IgeyByZXR1cm4gbmV3IE5vZGVJbmplY3Rvcih0aGlzLl9ob3N0VE5vZGUsIHRoaXMuX2hvc3RWaWV3KTsgfVxuXG4gICAgICAvKiogQGRlcHJlY2F0ZWQgTm8gcmVwbGFjZW1lbnQgKi9cbiAgICAgIGdldCBwYXJlbnRJbmplY3RvcigpOiBJbmplY3RvciB7XG4gICAgICAgIGNvbnN0IHBhcmVudExvY2F0aW9uID0gZ2V0UGFyZW50SW5qZWN0b3JMb2NhdGlvbih0aGlzLl9ob3N0VE5vZGUsIHRoaXMuX2hvc3RWaWV3KTtcbiAgICAgICAgY29uc3QgcGFyZW50VmlldyA9IGdldFBhcmVudEluamVjdG9yVmlldyhwYXJlbnRMb2NhdGlvbiwgdGhpcy5faG9zdFZpZXcpO1xuICAgICAgICBjb25zdCBwYXJlbnRUTm9kZSA9IGdldFBhcmVudEluamVjdG9yVE5vZGUocGFyZW50TG9jYXRpb24sIHRoaXMuX2hvc3RWaWV3LCB0aGlzLl9ob3N0VE5vZGUpO1xuXG4gICAgICAgIHJldHVybiAhaGFzUGFyZW50SW5qZWN0b3IocGFyZW50TG9jYXRpb24pIHx8IHBhcmVudFROb2RlID09IG51bGwgP1xuICAgICAgICAgICAgbmV3IE5vZGVJbmplY3RvcihudWxsLCB0aGlzLl9ob3N0VmlldykgOlxuICAgICAgICAgICAgbmV3IE5vZGVJbmplY3RvcihwYXJlbnRUTm9kZSwgcGFyZW50Vmlldyk7XG4gICAgICB9XG5cbiAgICAgIGNsZWFyKCk6IHZvaWQge1xuICAgICAgICB3aGlsZSAodGhpcy5sZW5ndGgpIHtcbiAgICAgICAgICB0aGlzLnJlbW92ZSgwKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBnZXQoaW5kZXg6IG51bWJlcik6IHZpZXdFbmdpbmVfVmlld1JlZnxudWxsIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2xDb250YWluZXJbVklFV19SRUZTXSAhPT0gbnVsbCAmJiB0aGlzLl9sQ29udGFpbmVyW1ZJRVdfUkVGU10gIVtpbmRleF0gfHwgbnVsbDtcbiAgICAgIH1cblxuICAgICAgZ2V0IGxlbmd0aCgpOiBudW1iZXIge1xuICAgICAgICAvLyBOb3RlIHRoYXQgaWYgdGhlcmUgYXJlIG5vIHZpZXdzLCB0aGUgY29udGFpbmVyXG4gICAgICAgIC8vIGxlbmd0aCB3aWxsIGJlIHNtYWxsZXIgdGhhbiB0aGUgaGVhZGVyIG9mZnNldC5cbiAgICAgICAgY29uc3Qgdmlld0Ftb3VudCA9IHRoaXMuX2xDb250YWluZXIubGVuZ3RoIC0gQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQ7XG4gICAgICAgIHJldHVybiB2aWV3QW1vdW50ID4gMCA/IHZpZXdBbW91bnQgOiAwO1xuICAgICAgfVxuXG4gICAgICBjcmVhdGVFbWJlZGRlZFZpZXc8Qz4odGVtcGxhdGVSZWY6IFZpZXdFbmdpbmVfVGVtcGxhdGVSZWY8Qz4sIGNvbnRleHQ/OiBDLCBpbmRleD86IG51bWJlcik6XG4gICAgICAgICAgdmlld0VuZ2luZV9FbWJlZGRlZFZpZXdSZWY8Qz4ge1xuICAgICAgICBjb25zdCB2aWV3UmVmID0gdGVtcGxhdGVSZWYuY3JlYXRlRW1iZWRkZWRWaWV3KGNvbnRleHQgfHwgPGFueT57fSk7XG4gICAgICAgIHRoaXMuaW5zZXJ0KHZpZXdSZWYsIGluZGV4KTtcbiAgICAgICAgcmV0dXJuIHZpZXdSZWY7XG4gICAgICB9XG5cbiAgICAgIGNyZWF0ZUNvbXBvbmVudDxDPihcbiAgICAgICAgICBjb21wb25lbnRGYWN0b3J5OiB2aWV3RW5naW5lX0NvbXBvbmVudEZhY3Rvcnk8Qz4sIGluZGV4PzogbnVtYmVyfHVuZGVmaW5lZCxcbiAgICAgICAgICBpbmplY3Rvcj86IEluamVjdG9yfHVuZGVmaW5lZCwgcHJvamVjdGFibGVOb2Rlcz86IGFueVtdW118dW5kZWZpbmVkLFxuICAgICAgICAgIG5nTW9kdWxlUmVmPzogdmlld0VuZ2luZV9OZ01vZHVsZVJlZjxhbnk+fHVuZGVmaW5lZCk6IHZpZXdFbmdpbmVfQ29tcG9uZW50UmVmPEM+IHtcbiAgICAgICAgY29uc3QgY29udGV4dEluamVjdG9yID0gaW5qZWN0b3IgfHwgdGhpcy5wYXJlbnRJbmplY3RvcjtcbiAgICAgICAgaWYgKCFuZ01vZHVsZVJlZiAmJiAoY29tcG9uZW50RmFjdG9yeSBhcyBhbnkpLm5nTW9kdWxlID09IG51bGwgJiYgY29udGV4dEluamVjdG9yKSB7XG4gICAgICAgICAgbmdNb2R1bGVSZWYgPSBjb250ZXh0SW5qZWN0b3IuZ2V0KHZpZXdFbmdpbmVfTmdNb2R1bGVSZWYsIG51bGwpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY29tcG9uZW50UmVmID1cbiAgICAgICAgICAgIGNvbXBvbmVudEZhY3RvcnkuY3JlYXRlKGNvbnRleHRJbmplY3RvciwgcHJvamVjdGFibGVOb2RlcywgdW5kZWZpbmVkLCBuZ01vZHVsZVJlZik7XG4gICAgICAgIHRoaXMuaW5zZXJ0KGNvbXBvbmVudFJlZi5ob3N0VmlldywgaW5kZXgpO1xuICAgICAgICByZXR1cm4gY29tcG9uZW50UmVmO1xuICAgICAgfVxuXG4gICAgICBpbnNlcnQodmlld1JlZjogdmlld0VuZ2luZV9WaWV3UmVmLCBpbmRleD86IG51bWJlcik6IHZpZXdFbmdpbmVfVmlld1JlZiB7XG4gICAgICAgIGlmICh2aWV3UmVmLmRlc3Ryb3llZCkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGluc2VydCBhIGRlc3Ryb3llZCBWaWV3IGluIGEgVmlld0NvbnRhaW5lciEnKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmFsbG9jYXRlQ29udGFpbmVySWZOZWVkZWQoKTtcbiAgICAgICAgY29uc3QgbFZpZXcgPSAodmlld1JlZiBhcyBWaWV3UmVmPGFueT4pLl9sVmlldyAhO1xuICAgICAgICBjb25zdCBhZGp1c3RlZElkeCA9IHRoaXMuX2FkanVzdEluZGV4KGluZGV4KTtcblxuICAgICAgICBpZiAodmlld0F0dGFjaGVkVG9Db250YWluZXIobFZpZXcpKSB7XG4gICAgICAgICAgLy8gSWYgdmlldyBpcyBhbHJlYWR5IGF0dGFjaGVkLCBmYWxsIGJhY2sgdG8gbW92ZSgpIHNvIHdlIGNsZWFuIHVwXG4gICAgICAgICAgLy8gcmVmZXJlbmNlcyBhcHByb3ByaWF0ZWx5LlxuICAgICAgICAgIHJldHVybiB0aGlzLm1vdmUodmlld1JlZiwgYWRqdXN0ZWRJZHgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaW5zZXJ0VmlldyhsVmlldywgdGhpcy5fbENvbnRhaW5lciwgYWRqdXN0ZWRJZHgpO1xuXG4gICAgICAgIGNvbnN0IGJlZm9yZU5vZGUgPSBnZXRCZWZvcmVOb2RlRm9yVmlldyhhZGp1c3RlZElkeCwgdGhpcy5fbENvbnRhaW5lcik7XG4gICAgICAgIGFkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyKGxWaWV3LCB0cnVlLCBiZWZvcmVOb2RlKTtcblxuICAgICAgICAodmlld1JlZiBhcyBWaWV3UmVmPGFueT4pLmF0dGFjaFRvVmlld0NvbnRhaW5lclJlZih0aGlzKTtcbiAgICAgICAgdGhpcy5fbENvbnRhaW5lcltWSUVXX1JFRlNdICEuc3BsaWNlKGFkanVzdGVkSWR4LCAwLCB2aWV3UmVmKTtcblxuICAgICAgICByZXR1cm4gdmlld1JlZjtcbiAgICAgIH1cblxuICAgICAgbW92ZSh2aWV3UmVmOiB2aWV3RW5naW5lX1ZpZXdSZWYsIG5ld0luZGV4OiBudW1iZXIpOiB2aWV3RW5naW5lX1ZpZXdSZWYge1xuICAgICAgICBpZiAodmlld1JlZi5kZXN0cm95ZWQpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBtb3ZlIGEgZGVzdHJveWVkIFZpZXcgaW4gYSBWaWV3Q29udGFpbmVyIScpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5pbmRleE9mKHZpZXdSZWYpO1xuICAgICAgICBpZiAoaW5kZXggIT09IC0xKSB0aGlzLmRldGFjaChpbmRleCk7XG4gICAgICAgIHRoaXMuaW5zZXJ0KHZpZXdSZWYsIG5ld0luZGV4KTtcbiAgICAgICAgcmV0dXJuIHZpZXdSZWY7XG4gICAgICB9XG5cbiAgICAgIGluZGV4T2Yodmlld1JlZjogdmlld0VuZ2luZV9WaWV3UmVmKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2xDb250YWluZXJbVklFV19SRUZTXSAhPT0gbnVsbCA/XG4gICAgICAgICAgICB0aGlzLl9sQ29udGFpbmVyW1ZJRVdfUkVGU10gIS5pbmRleE9mKHZpZXdSZWYpIDpcbiAgICAgICAgICAgIDA7XG4gICAgICB9XG5cbiAgICAgIHJlbW92ZShpbmRleD86IG51bWJlcik6IHZvaWQge1xuICAgICAgICB0aGlzLmFsbG9jYXRlQ29udGFpbmVySWZOZWVkZWQoKTtcbiAgICAgICAgY29uc3QgYWRqdXN0ZWRJZHggPSB0aGlzLl9hZGp1c3RJbmRleChpbmRleCwgLTEpO1xuICAgICAgICByZW1vdmVWaWV3KHRoaXMuX2xDb250YWluZXIsIGFkanVzdGVkSWR4KTtcbiAgICAgICAgdGhpcy5fbENvbnRhaW5lcltWSUVXX1JFRlNdICEuc3BsaWNlKGFkanVzdGVkSWR4LCAxKTtcbiAgICAgIH1cblxuICAgICAgZGV0YWNoKGluZGV4PzogbnVtYmVyKTogdmlld0VuZ2luZV9WaWV3UmVmfG51bGwge1xuICAgICAgICB0aGlzLmFsbG9jYXRlQ29udGFpbmVySWZOZWVkZWQoKTtcbiAgICAgICAgY29uc3QgYWRqdXN0ZWRJZHggPSB0aGlzLl9hZGp1c3RJbmRleChpbmRleCwgLTEpO1xuICAgICAgICBjb25zdCB2aWV3ID0gZGV0YWNoVmlldyh0aGlzLl9sQ29udGFpbmVyLCBhZGp1c3RlZElkeCk7XG4gICAgICAgIGNvbnN0IHdhc0RldGFjaGVkID0gdmlldyAmJiB0aGlzLl9sQ29udGFpbmVyW1ZJRVdfUkVGU10gIS5zcGxpY2UoYWRqdXN0ZWRJZHgsIDEpWzBdICE9IG51bGw7XG4gICAgICAgIHJldHVybiB3YXNEZXRhY2hlZCA/IG5ldyBWaWV3UmVmKHZpZXcgISwgdmlldyAhW0NPTlRFWFRdLCAtMSkgOiBudWxsO1xuICAgICAgfVxuXG4gICAgICBwcml2YXRlIF9hZGp1c3RJbmRleChpbmRleD86IG51bWJlciwgc2hpZnQ6IG51bWJlciA9IDApIHtcbiAgICAgICAgaWYgKGluZGV4ID09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5sZW5ndGggKyBzaGlmdDtcbiAgICAgICAgfVxuICAgICAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICAgICAgYXNzZXJ0R3JlYXRlclRoYW4oaW5kZXgsIC0xLCAnaW5kZXggbXVzdCBiZSBwb3NpdGl2ZScpO1xuICAgICAgICAgIC8vICsxIGJlY2F1c2UgaXQncyBsZWdhbCB0byBpbnNlcnQgYXQgdGhlIGVuZC5cbiAgICAgICAgICBhc3NlcnRMZXNzVGhhbihpbmRleCwgdGhpcy5sZW5ndGggKyAxICsgc2hpZnQsICdpbmRleCcpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpbmRleDtcbiAgICAgIH1cblxuICAgICAgcHJpdmF0ZSBhbGxvY2F0ZUNvbnRhaW5lcklmTmVlZGVkKCk6IHZvaWQge1xuICAgICAgICBpZiAodGhpcy5fbENvbnRhaW5lcltWSUVXX1JFRlNdID09PSBudWxsKSB7XG4gICAgICAgICAgdGhpcy5fbENvbnRhaW5lcltWSUVXX1JFRlNdID0gW107XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXMoXG4gICAgICAgICAgICAgICAgICAgaG9zdFROb2RlLCBUTm9kZVR5cGUuQ29udGFpbmVyLCBUTm9kZVR5cGUuRWxlbWVudCwgVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpO1xuXG4gIGxldCBsQ29udGFpbmVyOiBMQ29udGFpbmVyO1xuICBjb25zdCBzbG90VmFsdWUgPSBob3N0Vmlld1tob3N0VE5vZGUuaW5kZXhdO1xuICBpZiAoaXNMQ29udGFpbmVyKHNsb3RWYWx1ZSkpIHtcbiAgICAvLyBJZiB0aGUgaG9zdCBpcyBhIGNvbnRhaW5lciwgd2UgZG9uJ3QgbmVlZCB0byBjcmVhdGUgYSBuZXcgTENvbnRhaW5lclxuICAgIGxDb250YWluZXIgPSBzbG90VmFsdWU7XG4gICAgbENvbnRhaW5lcltBQ1RJVkVfSU5ERVhdID0gLTE7XG4gIH0gZWxzZSB7XG4gICAgbGV0IGNvbW1lbnROb2RlOiBSQ29tbWVudDtcbiAgICAvLyBJZiB0aGUgaG9zdCBpcyBhbiBlbGVtZW50IGNvbnRhaW5lciwgdGhlIG5hdGl2ZSBob3N0IGVsZW1lbnQgaXMgZ3VhcmFudGVlZCB0byBiZSBhXG4gICAgLy8gY29tbWVudCBhbmQgd2UgY2FuIHJldXNlIHRoYXQgY29tbWVudCBhcyBhbmNob3IgZWxlbWVudCBmb3IgdGhlIG5ldyBMQ29udGFpbmVyLlxuICAgIGlmIChob3N0VE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpIHtcbiAgICAgIGNvbW1lbnROb2RlID0gdW53cmFwUk5vZGUoc2xvdFZhbHVlKSBhcyBSQ29tbWVudDtcbiAgICB9IGVsc2Uge1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckNyZWF0ZUNvbW1lbnQrKztcbiAgICAgIGNvbW1lbnROb2RlID0gaG9zdFZpZXdbUkVOREVSRVJdLmNyZWF0ZUNvbW1lbnQobmdEZXZNb2RlID8gJ2NvbnRhaW5lcicgOiAnJyk7XG4gICAgfVxuXG4gICAgLy8gQSBjb250YWluZXIgY2FuIGJlIGNyZWF0ZWQgb24gdGhlIHJvb3QgKHRvcG1vc3QgLyBib290c3RyYXBwZWQpIGNvbXBvbmVudCBhbmQgaW4gdGhpcyBjYXNlIHdlXG4gICAgLy8gY2FuJ3QgdXNlIExUcmVlIHRvIGluc2VydCBjb250YWluZXIncyBtYXJrZXIgbm9kZSAoYm90aCBwYXJlbnQgb2YgYSBjb21tZW50IG5vZGUgYW5kIHRoZVxuICAgIC8vIGNvbW1lbmQgbm9kZSBpdHNlbGYgaXMgbG9jYXRlZCBvdXRzaWRlIG9mIGVsZW1lbnRzIGhvbGQgYnkgTFRyZWUpLiBJbiB0aGlzIHNwZWNpZmljIGNhc2Ugd2VcbiAgICAvLyB1c2UgbG93LWxldmVsIERPTSBtYW5pcHVsYXRpb24gdG8gaW5zZXJ0IGNvbnRhaW5lcidzIG1hcmtlciAoY29tbWVudCkgbm9kZS5cbiAgICBpZiAoaXNSb290Vmlldyhob3N0VmlldykpIHtcbiAgICAgIGNvbnN0IHJlbmRlcmVyID0gaG9zdFZpZXdbUkVOREVSRVJdO1xuICAgICAgY29uc3QgaG9zdE5hdGl2ZSA9IGdldE5hdGl2ZUJ5VE5vZGUoaG9zdFROb2RlLCBob3N0VmlldykgITtcbiAgICAgIGNvbnN0IHBhcmVudE9mSG9zdE5hdGl2ZSA9IG5hdGl2ZVBhcmVudE5vZGUocmVuZGVyZXIsIGhvc3ROYXRpdmUpO1xuICAgICAgbmF0aXZlSW5zZXJ0QmVmb3JlKFxuICAgICAgICAgIHJlbmRlcmVyLCBwYXJlbnRPZkhvc3ROYXRpdmUgISwgY29tbWVudE5vZGUsIG5hdGl2ZU5leHRTaWJsaW5nKHJlbmRlcmVyLCBob3N0TmF0aXZlKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGFwcGVuZENoaWxkKGNvbW1lbnROb2RlLCBob3N0VE5vZGUsIGhvc3RWaWV3KTtcbiAgICB9XG5cbiAgICBob3N0Vmlld1tob3N0VE5vZGUuaW5kZXhdID0gbENvbnRhaW5lciA9XG4gICAgICAgIGNyZWF0ZUxDb250YWluZXIoc2xvdFZhbHVlLCBob3N0VmlldywgY29tbWVudE5vZGUsIGhvc3RUTm9kZSwgdHJ1ZSk7XG5cbiAgICBhZGRUb1ZpZXdUcmVlKGhvc3RWaWV3LCBsQ29udGFpbmVyKTtcbiAgfVxuXG4gIHJldHVybiBuZXcgUjNWaWV3Q29udGFpbmVyUmVmKGxDb250YWluZXIsIGhvc3RUTm9kZSwgaG9zdFZpZXcpO1xufVxuXG5cbi8qKiBSZXR1cm5zIGEgQ2hhbmdlRGV0ZWN0b3JSZWYgKGEuay5hLiBhIFZpZXdSZWYpICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0Q2hhbmdlRGV0ZWN0b3JSZWYoKTogVmlld0VuZ2luZV9DaGFuZ2VEZXRlY3RvclJlZiB7XG4gIHJldHVybiBjcmVhdGVWaWV3UmVmKGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpLCBnZXRMVmlldygpLCBudWxsKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgVmlld1JlZiBhbmQgc3RvcmVzIGl0IG9uIHRoZSBpbmplY3RvciBhcyBDaGFuZ2VEZXRlY3RvclJlZiAocHVibGljIGFsaWFzKS5cbiAqXG4gKiBAcGFyYW0gaG9zdFROb2RlIFRoZSBub2RlIHRoYXQgaXMgcmVxdWVzdGluZyBhIENoYW5nZURldGVjdG9yUmVmXG4gKiBAcGFyYW0gaG9zdFZpZXcgVGhlIHZpZXcgdG8gd2hpY2ggdGhlIG5vZGUgYmVsb25nc1xuICogQHBhcmFtIGNvbnRleHQgVGhlIGNvbnRleHQgZm9yIHRoaXMgY2hhbmdlIGRldGVjdG9yIHJlZlxuICogQHJldHVybnMgVGhlIENoYW5nZURldGVjdG9yUmVmIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVmlld1JlZihcbiAgICBob3N0VE5vZGU6IFROb2RlLCBob3N0VmlldzogTFZpZXcsIGNvbnRleHQ6IGFueSk6IFZpZXdFbmdpbmVfQ2hhbmdlRGV0ZWN0b3JSZWYge1xuICBpZiAoaXNDb21wb25lbnQoaG9zdFROb2RlKSkge1xuICAgIGNvbnN0IGNvbXBvbmVudEluZGV4ID0gaG9zdFROb2RlLmRpcmVjdGl2ZVN0YXJ0O1xuICAgIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBnZXRDb21wb25lbnRWaWV3QnlJbmRleChob3N0VE5vZGUuaW5kZXgsIGhvc3RWaWV3KTtcbiAgICByZXR1cm4gbmV3IFZpZXdSZWYoY29tcG9uZW50VmlldywgY29udGV4dCwgY29tcG9uZW50SW5kZXgpO1xuICB9IGVsc2UgaWYgKFxuICAgICAgaG9zdFROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50IHx8IGhvc3RUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyIHx8XG4gICAgICBob3N0VE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpIHtcbiAgICBjb25zdCBob3N0Q29tcG9uZW50VmlldyA9IGZpbmRDb21wb25lbnRWaWV3KGhvc3RWaWV3KTtcbiAgICByZXR1cm4gbmV3IFZpZXdSZWYoaG9zdENvbXBvbmVudFZpZXcsIGhvc3RDb21wb25lbnRWaWV3W0NPTlRFWFRdLCAtMSk7XG4gIH1cbiAgcmV0dXJuIG51bGwgITtcbn1cblxuLyoqIFJldHVybnMgYSBSZW5kZXJlcjIgKG9yIHRocm93cyB3aGVuIGFwcGxpY2F0aW9uIHdhcyBib290c3RyYXBwZWQgd2l0aCBSZW5kZXJlcjMpICovXG5mdW5jdGlvbiBnZXRPckNyZWF0ZVJlbmRlcmVyMih2aWV3OiBMVmlldyk6IFJlbmRlcmVyMiB7XG4gIGNvbnN0IHJlbmRlcmVyID0gdmlld1tSRU5ERVJFUl07XG4gIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICByZXR1cm4gcmVuZGVyZXIgYXMgUmVuZGVyZXIyO1xuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGluamVjdCBSZW5kZXJlcjIgd2hlbiB0aGUgYXBwbGljYXRpb24gdXNlcyBSZW5kZXJlcjMhJyk7XG4gIH1cbn1cblxuLyoqIEluamVjdHMgYSBSZW5kZXJlcjIgZm9yIHRoZSBjdXJyZW50IGNvbXBvbmVudC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RSZW5kZXJlcjIoKTogUmVuZGVyZXIyIHtcbiAgLy8gV2UgbmVlZCB0aGUgUmVuZGVyZXIgdG8gYmUgYmFzZWQgb24gdGhlIGNvbXBvbmVudCB0aGF0IGl0J3MgYmVpbmcgaW5qZWN0ZWQgaW50bywgaG93ZXZlciBzaW5jZVxuICAvLyBESSBoYXBwZW5zIGJlZm9yZSB3ZSd2ZSBlbnRlcmVkIGl0cyB2aWV3LCBgZ2V0TFZpZXdgIHdpbGwgcmV0dXJuIHRoZSBwYXJlbnQgdmlldyBpbnN0ZWFkLlxuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIGNvbnN0IG5vZGVBdEluZGV4ID0gZ2V0Q29tcG9uZW50Vmlld0J5SW5kZXgodE5vZGUuaW5kZXgsIGxWaWV3KTtcbiAgcmV0dXJuIGdldE9yQ3JlYXRlUmVuZGVyZXIyKGlzTFZpZXcobm9kZUF0SW5kZXgpID8gbm9kZUF0SW5kZXggOiBsVmlldyk7XG59XG4iXX0=