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
import { NodeInjector, getParentInjectorLocation } from './di';
import { addToViewTree, createEmbeddedViewAndNode, createLContainer, renderEmbeddedTemplate } from './instructions/shared';
import { ACTIVE_INDEX, CONTAINER_HEADER_OFFSET, VIEW_REFS } from './interfaces/container';
import { isProceduralRenderer } from './interfaces/renderer';
import { CONTEXT, QUERIES, RENDERER, T_HOST } from './interfaces/view';
import { assertNodeOfPossibleTypes } from './node_assert';
import { addRemoveViewFromContainer, appendChild, detachView, getBeforeNodeForView, insertView, nativeInsertBefore, nativeNextSibling, nativeParentNode, removeView } from './node_manipulation';
import { getParentInjectorTNode } from './node_util';
import { getLView, getPreviousOrParentTNode } from './state';
import { getParentInjectorView, hasParentInjector } from './util/injector_utils';
import { findComponentView } from './util/view_traversal_utils';
import { getComponentViewByIndex, getNativeByTNode, isComponent, isLContainer, isLView, isRootView, unwrapRNode, viewAttachedToContainer } from './util/view_utils';
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
 * @param {?} hostTNode The node that is requesting a TemplateRef
 * @param {?} hostView The view to which the node belongs
 * @return {?} The TemplateRef instance to use
 */
export function createTemplateRef(TemplateRefToken, ElementRefToken, hostTNode, hostView) {
    if (!R3TemplateRef) {
        // TODO: Fix class name, should be TemplateRef, but there appears to be a rollup bug
        R3TemplateRef = class TemplateRef_ extends TemplateRefToken {
            /**
             * @param {?} _declarationParentView
             * @param {?} elementRef
             * @param {?} _tView
             * @param {?} _hostLContainer
             * @param {?} _injectorIndex
             */
            constructor(_declarationParentView, elementRef, _tView, _hostLContainer, _injectorIndex) {
                super();
                this._declarationParentView = _declarationParentView;
                this.elementRef = elementRef;
                this._tView = _tView;
                this._hostLContainer = _hostLContainer;
                this._injectorIndex = _injectorIndex;
            }
            /**
             * @param {?} context
             * @param {?=} container
             * @param {?=} index
             * @return {?}
             */
            createEmbeddedView(context, container, index) {
                /** @type {?} */
                const currentQueries = this._declarationParentView[QUERIES];
                // Query container may be missing if this view was created in a directive
                // constructor. Create it now to avoid losing results in embedded views.
                if (currentQueries && this._hostLContainer[QUERIES] == null) {
                    this._hostLContainer[QUERIES] = (/** @type {?} */ (currentQueries)).container();
                }
                /** @type {?} */
                const lView = createEmbeddedViewAndNode(this._tView, context, this._declarationParentView, this._hostLContainer[QUERIES], this._injectorIndex);
                if (container) {
                    insertView(lView, container, (/** @type {?} */ (index)));
                }
                renderEmbeddedTemplate(lView, this._tView, context);
                /** @type {?} */
                const viewRef = new ViewRef(lView, context, -1);
                viewRef._tViewNode = (/** @type {?} */ (lView[T_HOST]));
                return viewRef;
            }
        };
    }
    if (hostTNode.type === 0 /* Container */) {
        /** @type {?} */
        const hostContainer = hostView[hostTNode.index];
        ngDevMode && assertDefined(hostTNode.tViews, 'TView must be allocated');
        return new R3TemplateRef(hostView, createElementRef(ElementRefToken, hostTNode, hostView), (/** @type {?} */ (hostTNode.tViews)), hostContainer, hostTNode.injectorIndex);
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
                this.allocateContainerIfNeeded();
                /** @type {?} */
                const adjustedIdx = this._adjustIndex(index);
                /** @type {?} */
                const viewRef = ((/** @type {?} */ (templateRef)))
                    .createEmbeddedView(context || (/** @type {?} */ ({})), this._lContainer, adjustedIdx);
                ((/** @type {?} */ (viewRef))).attachToViewContainerRef(this);
                (/** @type {?} */ (this._lContainer[VIEW_REFS])).splice(adjustedIdx, 0, viewRef);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld19lbmdpbmVfY29tcGF0aWJpbGl0eS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvdmlld19lbmdpbmVfY29tcGF0aWJpbGl0eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVlBLE9BQU8sRUFBQyxXQUFXLElBQUksc0JBQXNCLEVBQUMsTUFBTSw2QkFBNkIsQ0FBQztBQUtsRixPQUFPLEVBQUMsYUFBYSxFQUFFLGlCQUFpQixFQUFFLGNBQWMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRWhGLE9BQU8sRUFBQyxZQUFZLEVBQUUseUJBQXlCLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDN0QsT0FBTyxFQUFDLGFBQWEsRUFBRSx5QkFBeUIsRUFBRSxnQkFBZ0IsRUFBRSxzQkFBc0IsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3pILE9BQU8sRUFBQyxZQUFZLEVBQUUsdUJBQXVCLEVBQWMsU0FBUyxFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFFcEcsT0FBTyxFQUFxQixvQkFBb0IsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQy9FLE9BQU8sRUFBQyxPQUFPLEVBQVMsT0FBTyxFQUFFLFFBQVEsRUFBUyxNQUFNLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNuRixPQUFPLEVBQUMseUJBQXlCLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDeEQsT0FBTyxFQUFDLDBCQUEwQixFQUFFLFdBQVcsRUFBRSxVQUFVLEVBQUUsb0JBQW9CLEVBQUUsVUFBVSxFQUFFLGtCQUFrQixFQUFFLGlCQUFpQixFQUFFLGdCQUFnQixFQUFFLFVBQVUsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQy9MLE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLGFBQWEsQ0FBQztBQUNuRCxPQUFPLEVBQUMsUUFBUSxFQUFFLHdCQUF3QixFQUFDLE1BQU0sU0FBUyxDQUFDO0FB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T0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUN2RTtJQUNELE9BQU8sbUJBQUEsSUFBSSxFQUFFLENBQUM7QUFDaEIsQ0FBQzs7Ozs7O0FBR0QsU0FBUyxvQkFBb0IsQ0FBQyxJQUFXOztVQUNqQyxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQztJQUMvQixJQUFJLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxFQUFFO1FBQ2xDLE9BQU8sbUJBQUEsUUFBUSxFQUFhLENBQUM7S0FDOUI7U0FBTTtRQUNMLE1BQU0sSUFBSSxLQUFLLENBQUMsOERBQThELENBQUMsQ0FBQztLQUNqRjtBQUNILENBQUM7Ozs7O0FBR0QsTUFBTSxVQUFVLGVBQWU7Ozs7VUFHdkIsS0FBSyxHQUFHLFFBQVEsRUFBRTs7VUFDbEIsS0FBSyxHQUFHLHdCQUF3QixFQUFFOztVQUNsQyxXQUFXLEdBQUcsdUJBQXVCLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUM7SUFDL0QsT0FBTyxvQkFBb0IsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDMUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtDaGFuZ2VEZXRlY3RvclJlZiBhcyBWaWV3RW5naW5lX0NoYW5nZURldGVjdG9yUmVmfSBmcm9tICcuLi9jaGFuZ2VfZGV0ZWN0aW9uL2NoYW5nZV9kZXRlY3Rvcl9yZWYnO1xuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi4vZGkvaW5qZWN0b3InO1xuaW1wb3J0IHtDb21wb25lbnRGYWN0b3J5IGFzIHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeSwgQ29tcG9uZW50UmVmIGFzIHZpZXdFbmdpbmVfQ29tcG9uZW50UmVmfSBmcm9tICcuLi9saW5rZXIvY29tcG9uZW50X2ZhY3RvcnknO1xuaW1wb3J0IHtFbGVtZW50UmVmIGFzIFZpZXdFbmdpbmVfRWxlbWVudFJlZn0gZnJvbSAnLi4vbGlua2VyL2VsZW1lbnRfcmVmJztcbmltcG9ydCB7TmdNb2R1bGVSZWYgYXMgdmlld0VuZ2luZV9OZ01vZHVsZVJlZn0gZnJvbSAnLi4vbGlua2VyL25nX21vZHVsZV9mYWN0b3J5JztcbmltcG9ydCB7VGVtcGxhdGVSZWYgYXMgVmlld0VuZ2luZV9UZW1wbGF0ZVJlZn0gZnJvbSAnLi4vbGlua2VyL3RlbXBsYXRlX3JlZic7XG5pbXBvcnQge1ZpZXdDb250YWluZXJSZWYgYXMgVmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmfSBmcm9tICcuLi9saW5rZXIvdmlld19jb250YWluZXJfcmVmJztcbmltcG9ydCB7RW1iZWRkZWRWaWV3UmVmIGFzIHZpZXdFbmdpbmVfRW1iZWRkZWRWaWV3UmVmLCBWaWV3UmVmIGFzIHZpZXdFbmdpbmVfVmlld1JlZn0gZnJvbSAnLi4vbGlua2VyL3ZpZXdfcmVmJztcbmltcG9ydCB7UmVuZGVyZXIyfSBmcm9tICcuLi9yZW5kZXIvYXBpJztcbmltcG9ydCB7YXNzZXJ0RGVmaW5lZCwgYXNzZXJ0R3JlYXRlclRoYW4sIGFzc2VydExlc3NUaGFufSBmcm9tICcuLi91dGlsL2Fzc2VydCc7XG5cbmltcG9ydCB7Tm9kZUluamVjdG9yLCBnZXRQYXJlbnRJbmplY3RvckxvY2F0aW9ufSBmcm9tICcuL2RpJztcbmltcG9ydCB7YWRkVG9WaWV3VHJlZSwgY3JlYXRlRW1iZWRkZWRWaWV3QW5kTm9kZSwgY3JlYXRlTENvbnRhaW5lciwgcmVuZGVyRW1iZWRkZWRUZW1wbGF0ZX0gZnJvbSAnLi9pbnN0cnVjdGlvbnMvc2hhcmVkJztcbmltcG9ydCB7QUNUSVZFX0lOREVYLCBDT05UQUlORVJfSEVBREVSX09GRlNFVCwgTENvbnRhaW5lciwgVklFV19SRUZTfSBmcm9tICcuL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7VENvbnRhaW5lck5vZGUsIFRFbGVtZW50Q29udGFpbmVyTm9kZSwgVEVsZW1lbnROb2RlLCBUTm9kZSwgVE5vZGVUeXBlLCBUVmlld05vZGV9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7UkNvbW1lbnQsIFJFbGVtZW50LCBpc1Byb2NlZHVyYWxSZW5kZXJlcn0gZnJvbSAnLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7Q09OVEVYVCwgTFZpZXcsIFFVRVJJRVMsIFJFTkRFUkVSLCBUVmlldywgVF9IT1NUfSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXN9IGZyb20gJy4vbm9kZV9hc3NlcnQnO1xuaW1wb3J0IHthZGRSZW1vdmVWaWV3RnJvbUNvbnRhaW5lciwgYXBwZW5kQ2hpbGQsIGRldGFjaFZpZXcsIGdldEJlZm9yZU5vZGVGb3JWaWV3LCBpbnNlcnRWaWV3LCBuYXRpdmVJbnNlcnRCZWZvcmUsIG5hdGl2ZU5leHRTaWJsaW5nLCBuYXRpdmVQYXJlbnROb2RlLCByZW1vdmVWaWV3fSBmcm9tICcuL25vZGVfbWFuaXB1bGF0aW9uJztcbmltcG9ydCB7Z2V0UGFyZW50SW5qZWN0b3JUTm9kZX0gZnJvbSAnLi9ub2RlX3V0aWwnO1xuaW1wb3J0IHtnZXRMVmlldywgZ2V0UHJldmlvdXNPclBhcmVudFROb2RlfSBmcm9tICcuL3N0YXRlJztcbmltcG9ydCB7Z2V0UGFyZW50SW5qZWN0b3JWaWV3LCBoYXNQYXJlbnRJbmplY3Rvcn0gZnJvbSAnLi91dGlsL2luamVjdG9yX3V0aWxzJztcbmltcG9ydCB7ZmluZENvbXBvbmVudFZpZXd9IGZyb20gJy4vdXRpbC92aWV3X3RyYXZlcnNhbF91dGlscyc7XG5pbXBvcnQge2dldENvbXBvbmVudFZpZXdCeUluZGV4LCBnZXROYXRpdmVCeVROb2RlLCBpc0NvbXBvbmVudCwgaXNMQ29udGFpbmVyLCBpc0xWaWV3LCBpc1Jvb3RWaWV3LCB1bndyYXBSTm9kZSwgdmlld0F0dGFjaGVkVG9Db250YWluZXJ9IGZyb20gJy4vdXRpbC92aWV3X3V0aWxzJztcbmltcG9ydCB7Vmlld1JlZn0gZnJvbSAnLi92aWV3X3JlZic7XG5cblxuXG4vKipcbiAqIENyZWF0ZXMgYW4gRWxlbWVudFJlZiBmcm9tIHRoZSBtb3N0IHJlY2VudCBub2RlLlxuICpcbiAqIEByZXR1cm5zIFRoZSBFbGVtZW50UmVmIGluc3RhbmNlIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0RWxlbWVudFJlZihFbGVtZW50UmVmVG9rZW46IHR5cGVvZiBWaWV3RW5naW5lX0VsZW1lbnRSZWYpOlxuICAgIFZpZXdFbmdpbmVfRWxlbWVudFJlZiB7XG4gIHJldHVybiBjcmVhdGVFbGVtZW50UmVmKEVsZW1lbnRSZWZUb2tlbiwgZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCksIGdldExWaWV3KCkpO1xufVxuXG5sZXQgUjNFbGVtZW50UmVmOiB7bmV3IChuYXRpdmU6IFJFbGVtZW50IHwgUkNvbW1lbnQpOiBWaWV3RW5naW5lX0VsZW1lbnRSZWZ9O1xuXG4vKipcbiAqIENyZWF0ZXMgYW4gRWxlbWVudFJlZiBnaXZlbiBhIG5vZGUuXG4gKlxuICogQHBhcmFtIEVsZW1lbnRSZWZUb2tlbiBUaGUgRWxlbWVudFJlZiB0eXBlXG4gKiBAcGFyYW0gdE5vZGUgVGhlIG5vZGUgZm9yIHdoaWNoIHlvdSdkIGxpa2UgYW4gRWxlbWVudFJlZlxuICogQHBhcmFtIHZpZXcgVGhlIHZpZXcgdG8gd2hpY2ggdGhlIG5vZGUgYmVsb25nc1xuICogQHJldHVybnMgVGhlIEVsZW1lbnRSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFbGVtZW50UmVmKFxuICAgIEVsZW1lbnRSZWZUb2tlbjogdHlwZW9mIFZpZXdFbmdpbmVfRWxlbWVudFJlZiwgdE5vZGU6IFROb2RlLFxuICAgIHZpZXc6IExWaWV3KTogVmlld0VuZ2luZV9FbGVtZW50UmVmIHtcbiAgaWYgKCFSM0VsZW1lbnRSZWYpIHtcbiAgICAvLyBUT0RPOiBGaXggY2xhc3MgbmFtZSwgc2hvdWxkIGJlIEVsZW1lbnRSZWYsIGJ1dCB0aGVyZSBhcHBlYXJzIHRvIGJlIGEgcm9sbHVwIGJ1Z1xuICAgIFIzRWxlbWVudFJlZiA9IGNsYXNzIEVsZW1lbnRSZWZfIGV4dGVuZHMgRWxlbWVudFJlZlRva2VuIHt9O1xuICB9XG4gIHJldHVybiBuZXcgUjNFbGVtZW50UmVmKGdldE5hdGl2ZUJ5VE5vZGUodE5vZGUsIHZpZXcpIGFzIFJFbGVtZW50KTtcbn1cblxubGV0IFIzVGVtcGxhdGVSZWY6IHtcbiAgbmV3IChcbiAgICAgIF9kZWNsYXJhdGlvblBhcmVudFZpZXc6IExWaWV3LCBlbGVtZW50UmVmOiBWaWV3RW5naW5lX0VsZW1lbnRSZWYsIF90VmlldzogVFZpZXcsXG4gICAgICBfaG9zdExDb250YWluZXI6IExDb250YWluZXIsIF9pbmplY3RvckluZGV4OiBudW1iZXIpOiBWaWV3RW5naW5lX1RlbXBsYXRlUmVmPGFueT5cbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIFRlbXBsYXRlUmVmIGdpdmVuIGEgbm9kZS5cbiAqXG4gKiBAcmV0dXJucyBUaGUgVGVtcGxhdGVSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RUZW1wbGF0ZVJlZjxUPihcbiAgICBUZW1wbGF0ZVJlZlRva2VuOiB0eXBlb2YgVmlld0VuZ2luZV9UZW1wbGF0ZVJlZixcbiAgICBFbGVtZW50UmVmVG9rZW46IHR5cGVvZiBWaWV3RW5naW5lX0VsZW1lbnRSZWYpOiBWaWV3RW5naW5lX1RlbXBsYXRlUmVmPFQ+fG51bGwge1xuICByZXR1cm4gY3JlYXRlVGVtcGxhdGVSZWY8VD4oXG4gICAgICBUZW1wbGF0ZVJlZlRva2VuLCBFbGVtZW50UmVmVG9rZW4sIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpLCBnZXRMVmlldygpKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgVGVtcGxhdGVSZWYgYW5kIHN0b3JlcyBpdCBvbiB0aGUgaW5qZWN0b3IuXG4gKlxuICogQHBhcmFtIFRlbXBsYXRlUmVmVG9rZW4gVGhlIFRlbXBsYXRlUmVmIHR5cGVcbiAqIEBwYXJhbSBFbGVtZW50UmVmVG9rZW4gVGhlIEVsZW1lbnRSZWYgdHlwZVxuICogQHBhcmFtIGhvc3RUTm9kZSBUaGUgbm9kZSB0aGF0IGlzIHJlcXVlc3RpbmcgYSBUZW1wbGF0ZVJlZlxuICogQHBhcmFtIGhvc3RWaWV3IFRoZSB2aWV3IHRvIHdoaWNoIHRoZSBub2RlIGJlbG9uZ3NcbiAqIEByZXR1cm5zIFRoZSBUZW1wbGF0ZVJlZiBpbnN0YW5jZSB0byB1c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVRlbXBsYXRlUmVmPFQ+KFxuICAgIFRlbXBsYXRlUmVmVG9rZW46IHR5cGVvZiBWaWV3RW5naW5lX1RlbXBsYXRlUmVmLCBFbGVtZW50UmVmVG9rZW46IHR5cGVvZiBWaWV3RW5naW5lX0VsZW1lbnRSZWYsXG4gICAgaG9zdFROb2RlOiBUTm9kZSwgaG9zdFZpZXc6IExWaWV3KTogVmlld0VuZ2luZV9UZW1wbGF0ZVJlZjxUPnxudWxsIHtcbiAgaWYgKCFSM1RlbXBsYXRlUmVmKSB7XG4gICAgLy8gVE9ETzogRml4IGNsYXNzIG5hbWUsIHNob3VsZCBiZSBUZW1wbGF0ZVJlZiwgYnV0IHRoZXJlIGFwcGVhcnMgdG8gYmUgYSByb2xsdXAgYnVnXG4gICAgUjNUZW1wbGF0ZVJlZiA9IGNsYXNzIFRlbXBsYXRlUmVmXzxUPiBleHRlbmRzIFRlbXBsYXRlUmVmVG9rZW48VD4ge1xuICAgICAgY29uc3RydWN0b3IoXG4gICAgICAgICAgcHJpdmF0ZSBfZGVjbGFyYXRpb25QYXJlbnRWaWV3OiBMVmlldywgcmVhZG9ubHkgZWxlbWVudFJlZjogVmlld0VuZ2luZV9FbGVtZW50UmVmLFxuICAgICAgICAgIHByaXZhdGUgX3RWaWV3OiBUVmlldywgcHJpdmF0ZSBfaG9zdExDb250YWluZXI6IExDb250YWluZXIsXG4gICAgICAgICAgcHJpdmF0ZSBfaW5qZWN0b3JJbmRleDogbnVtYmVyKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICB9XG5cbiAgICAgIGNyZWF0ZUVtYmVkZGVkVmlldyhjb250ZXh0OiBULCBjb250YWluZXI/OiBMQ29udGFpbmVyLCBpbmRleD86IG51bWJlcik6XG4gICAgICAgICAgdmlld0VuZ2luZV9FbWJlZGRlZFZpZXdSZWY8VD4ge1xuICAgICAgICBjb25zdCBjdXJyZW50UXVlcmllcyA9IHRoaXMuX2RlY2xhcmF0aW9uUGFyZW50Vmlld1tRVUVSSUVTXTtcbiAgICAgICAgLy8gUXVlcnkgY29udGFpbmVyIG1heSBiZSBtaXNzaW5nIGlmIHRoaXMgdmlldyB3YXMgY3JlYXRlZCBpbiBhIGRpcmVjdGl2ZVxuICAgICAgICAvLyBjb25zdHJ1Y3Rvci4gQ3JlYXRlIGl0IG5vdyB0byBhdm9pZCBsb3NpbmcgcmVzdWx0cyBpbiBlbWJlZGRlZCB2aWV3cy5cbiAgICAgICAgaWYgKGN1cnJlbnRRdWVyaWVzICYmIHRoaXMuX2hvc3RMQ29udGFpbmVyW1FVRVJJRVNdID09IG51bGwpIHtcbiAgICAgICAgICB0aGlzLl9ob3N0TENvbnRhaW5lcltRVUVSSUVTXSA9IGN1cnJlbnRRdWVyaWVzICEuY29udGFpbmVyKCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbFZpZXcgPSBjcmVhdGVFbWJlZGRlZFZpZXdBbmROb2RlKFxuICAgICAgICAgICAgdGhpcy5fdFZpZXcsIGNvbnRleHQsIHRoaXMuX2RlY2xhcmF0aW9uUGFyZW50VmlldywgdGhpcy5faG9zdExDb250YWluZXJbUVVFUklFU10sXG4gICAgICAgICAgICB0aGlzLl9pbmplY3RvckluZGV4KTtcbiAgICAgICAgaWYgKGNvbnRhaW5lcikge1xuICAgICAgICAgIGluc2VydFZpZXcobFZpZXcsIGNvbnRhaW5lciwgaW5kZXggISk7XG4gICAgICAgIH1cbiAgICAgICAgcmVuZGVyRW1iZWRkZWRUZW1wbGF0ZShsVmlldywgdGhpcy5fdFZpZXcsIGNvbnRleHQpO1xuICAgICAgICBjb25zdCB2aWV3UmVmID0gbmV3IFZpZXdSZWYobFZpZXcsIGNvbnRleHQsIC0xKTtcbiAgICAgICAgdmlld1JlZi5fdFZpZXdOb2RlID0gbFZpZXdbVF9IT1NUXSBhcyBUVmlld05vZGU7XG4gICAgICAgIHJldHVybiB2aWV3UmVmO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBpZiAoaG9zdFROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Db250YWluZXIpIHtcbiAgICBjb25zdCBob3N0Q29udGFpbmVyOiBMQ29udGFpbmVyID0gaG9zdFZpZXdbaG9zdFROb2RlLmluZGV4XTtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChob3N0VE5vZGUudFZpZXdzLCAnVFZpZXcgbXVzdCBiZSBhbGxvY2F0ZWQnKTtcbiAgICByZXR1cm4gbmV3IFIzVGVtcGxhdGVSZWYoXG4gICAgICAgIGhvc3RWaWV3LCBjcmVhdGVFbGVtZW50UmVmKEVsZW1lbnRSZWZUb2tlbiwgaG9zdFROb2RlLCBob3N0VmlldyksIGhvc3RUTm9kZS50Vmlld3MgYXMgVFZpZXcsXG4gICAgICAgIGhvc3RDb250YWluZXIsIGhvc3RUTm9kZS5pbmplY3RvckluZGV4KTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG5sZXQgUjNWaWV3Q29udGFpbmVyUmVmOiB7XG4gIG5ldyAoXG4gICAgICBsQ29udGFpbmVyOiBMQ29udGFpbmVyLCBob3N0VE5vZGU6IFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIHwgVEVsZW1lbnRDb250YWluZXJOb2RlLFxuICAgICAgaG9zdFZpZXc6IExWaWV3KTogVmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmXG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBWaWV3Q29udGFpbmVyUmVmIGFuZCBzdG9yZXMgaXQgb24gdGhlIGluamVjdG9yLiBPciwgaWYgdGhlIFZpZXdDb250YWluZXJSZWZcbiAqIGFscmVhZHkgZXhpc3RzLCByZXRyaWV2ZXMgdGhlIGV4aXN0aW5nIFZpZXdDb250YWluZXJSZWYuXG4gKlxuICogQHJldHVybnMgVGhlIFZpZXdDb250YWluZXJSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RWaWV3Q29udGFpbmVyUmVmKFxuICAgIFZpZXdDb250YWluZXJSZWZUb2tlbjogdHlwZW9mIFZpZXdFbmdpbmVfVmlld0NvbnRhaW5lclJlZixcbiAgICBFbGVtZW50UmVmVG9rZW46IHR5cGVvZiBWaWV3RW5naW5lX0VsZW1lbnRSZWYpOiBWaWV3RW5naW5lX1ZpZXdDb250YWluZXJSZWYge1xuICBjb25zdCBwcmV2aW91c1ROb2RlID1cbiAgICAgIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpIGFzIFRFbGVtZW50Tm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSB8IFRDb250YWluZXJOb2RlO1xuICByZXR1cm4gY3JlYXRlQ29udGFpbmVyUmVmKFZpZXdDb250YWluZXJSZWZUb2tlbiwgRWxlbWVudFJlZlRva2VuLCBwcmV2aW91c1ROb2RlLCBnZXRMVmlldygpKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgVmlld0NvbnRhaW5lclJlZiBhbmQgc3RvcmVzIGl0IG9uIHRoZSBpbmplY3Rvci5cbiAqXG4gKiBAcGFyYW0gVmlld0NvbnRhaW5lclJlZlRva2VuIFRoZSBWaWV3Q29udGFpbmVyUmVmIHR5cGVcbiAqIEBwYXJhbSBFbGVtZW50UmVmVG9rZW4gVGhlIEVsZW1lbnRSZWYgdHlwZVxuICogQHBhcmFtIGhvc3RUTm9kZSBUaGUgbm9kZSB0aGF0IGlzIHJlcXVlc3RpbmcgYSBWaWV3Q29udGFpbmVyUmVmXG4gKiBAcGFyYW0gaG9zdFZpZXcgVGhlIHZpZXcgdG8gd2hpY2ggdGhlIG5vZGUgYmVsb25nc1xuICogQHJldHVybnMgVGhlIFZpZXdDb250YWluZXJSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVDb250YWluZXJSZWYoXG4gICAgVmlld0NvbnRhaW5lclJlZlRva2VuOiB0eXBlb2YgVmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmLFxuICAgIEVsZW1lbnRSZWZUb2tlbjogdHlwZW9mIFZpZXdFbmdpbmVfRWxlbWVudFJlZixcbiAgICBob3N0VE5vZGU6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxURWxlbWVudENvbnRhaW5lck5vZGUsXG4gICAgaG9zdFZpZXc6IExWaWV3KTogVmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmIHtcbiAgaWYgKCFSM1ZpZXdDb250YWluZXJSZWYpIHtcbiAgICAvLyBUT0RPOiBGaXggY2xhc3MgbmFtZSwgc2hvdWxkIGJlIFZpZXdDb250YWluZXJSZWYsIGJ1dCB0aGVyZSBhcHBlYXJzIHRvIGJlIGEgcm9sbHVwIGJ1Z1xuICAgIFIzVmlld0NvbnRhaW5lclJlZiA9IGNsYXNzIFZpZXdDb250YWluZXJSZWZfIGV4dGVuZHMgVmlld0NvbnRhaW5lclJlZlRva2VuIHtcbiAgICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICAgIHByaXZhdGUgX2xDb250YWluZXI6IExDb250YWluZXIsXG4gICAgICAgICAgcHJpdmF0ZSBfaG9zdFROb2RlOiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlLFxuICAgICAgICAgIHByaXZhdGUgX2hvc3RWaWV3OiBMVmlldykge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgfVxuXG4gICAgICBnZXQgZWxlbWVudCgpOiBWaWV3RW5naW5lX0VsZW1lbnRSZWYge1xuICAgICAgICByZXR1cm4gY3JlYXRlRWxlbWVudFJlZihFbGVtZW50UmVmVG9rZW4sIHRoaXMuX2hvc3RUTm9kZSwgdGhpcy5faG9zdFZpZXcpO1xuICAgICAgfVxuXG4gICAgICBnZXQgaW5qZWN0b3IoKTogSW5qZWN0b3IgeyByZXR1cm4gbmV3IE5vZGVJbmplY3Rvcih0aGlzLl9ob3N0VE5vZGUsIHRoaXMuX2hvc3RWaWV3KTsgfVxuXG4gICAgICAvKiogQGRlcHJlY2F0ZWQgTm8gcmVwbGFjZW1lbnQgKi9cbiAgICAgIGdldCBwYXJlbnRJbmplY3RvcigpOiBJbmplY3RvciB7XG4gICAgICAgIGNvbnN0IHBhcmVudExvY2F0aW9uID0gZ2V0UGFyZW50SW5qZWN0b3JMb2NhdGlvbih0aGlzLl9ob3N0VE5vZGUsIHRoaXMuX2hvc3RWaWV3KTtcbiAgICAgICAgY29uc3QgcGFyZW50VmlldyA9IGdldFBhcmVudEluamVjdG9yVmlldyhwYXJlbnRMb2NhdGlvbiwgdGhpcy5faG9zdFZpZXcpO1xuICAgICAgICBjb25zdCBwYXJlbnRUTm9kZSA9IGdldFBhcmVudEluamVjdG9yVE5vZGUocGFyZW50TG9jYXRpb24sIHRoaXMuX2hvc3RWaWV3LCB0aGlzLl9ob3N0VE5vZGUpO1xuXG4gICAgICAgIHJldHVybiAhaGFzUGFyZW50SW5qZWN0b3IocGFyZW50TG9jYXRpb24pIHx8IHBhcmVudFROb2RlID09IG51bGwgP1xuICAgICAgICAgICAgbmV3IE5vZGVJbmplY3RvcihudWxsLCB0aGlzLl9ob3N0VmlldykgOlxuICAgICAgICAgICAgbmV3IE5vZGVJbmplY3RvcihwYXJlbnRUTm9kZSwgcGFyZW50Vmlldyk7XG4gICAgICB9XG5cbiAgICAgIGNsZWFyKCk6IHZvaWQge1xuICAgICAgICB3aGlsZSAodGhpcy5sZW5ndGgpIHtcbiAgICAgICAgICB0aGlzLnJlbW92ZSgwKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBnZXQoaW5kZXg6IG51bWJlcik6IHZpZXdFbmdpbmVfVmlld1JlZnxudWxsIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2xDb250YWluZXJbVklFV19SRUZTXSAhPT0gbnVsbCAmJiB0aGlzLl9sQ29udGFpbmVyW1ZJRVdfUkVGU10gIVtpbmRleF0gfHwgbnVsbDtcbiAgICAgIH1cblxuICAgICAgZ2V0IGxlbmd0aCgpOiBudW1iZXIge1xuICAgICAgICAvLyBOb3RlIHRoYXQgaWYgdGhlcmUgYXJlIG5vIHZpZXdzLCB0aGUgY29udGFpbmVyXG4gICAgICAgIC8vIGxlbmd0aCB3aWxsIGJlIHNtYWxsZXIgdGhhbiB0aGUgaGVhZGVyIG9mZnNldC5cbiAgICAgICAgY29uc3Qgdmlld0Ftb3VudCA9IHRoaXMuX2xDb250YWluZXIubGVuZ3RoIC0gQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQ7XG4gICAgICAgIHJldHVybiB2aWV3QW1vdW50ID4gMCA/IHZpZXdBbW91bnQgOiAwO1xuICAgICAgfVxuXG4gICAgICBjcmVhdGVFbWJlZGRlZFZpZXc8Qz4odGVtcGxhdGVSZWY6IFZpZXdFbmdpbmVfVGVtcGxhdGVSZWY8Qz4sIGNvbnRleHQ/OiBDLCBpbmRleD86IG51bWJlcik6XG4gICAgICAgICAgdmlld0VuZ2luZV9FbWJlZGRlZFZpZXdSZWY8Qz4ge1xuICAgICAgICB0aGlzLmFsbG9jYXRlQ29udGFpbmVySWZOZWVkZWQoKTtcbiAgICAgICAgY29uc3QgYWRqdXN0ZWRJZHggPSB0aGlzLl9hZGp1c3RJbmRleChpbmRleCk7XG4gICAgICAgIGNvbnN0IHZpZXdSZWYgPSAodGVtcGxhdGVSZWYgYXMgYW55KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5jcmVhdGVFbWJlZGRlZFZpZXcoY29udGV4dCB8fCA8YW55Pnt9LCB0aGlzLl9sQ29udGFpbmVyLCBhZGp1c3RlZElkeCk7XG4gICAgICAgICh2aWV3UmVmIGFzIFZpZXdSZWY8YW55PikuYXR0YWNoVG9WaWV3Q29udGFpbmVyUmVmKHRoaXMpO1xuICAgICAgICB0aGlzLl9sQ29udGFpbmVyW1ZJRVdfUkVGU10gIS5zcGxpY2UoYWRqdXN0ZWRJZHgsIDAsIHZpZXdSZWYpO1xuICAgICAgICByZXR1cm4gdmlld1JlZjtcbiAgICAgIH1cblxuICAgICAgY3JlYXRlQ29tcG9uZW50PEM+KFxuICAgICAgICAgIGNvbXBvbmVudEZhY3Rvcnk6IHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeTxDPiwgaW5kZXg/OiBudW1iZXJ8dW5kZWZpbmVkLFxuICAgICAgICAgIGluamVjdG9yPzogSW5qZWN0b3J8dW5kZWZpbmVkLCBwcm9qZWN0YWJsZU5vZGVzPzogYW55W11bXXx1bmRlZmluZWQsXG4gICAgICAgICAgbmdNb2R1bGVSZWY/OiB2aWV3RW5naW5lX05nTW9kdWxlUmVmPGFueT58dW5kZWZpbmVkKTogdmlld0VuZ2luZV9Db21wb25lbnRSZWY8Qz4ge1xuICAgICAgICBjb25zdCBjb250ZXh0SW5qZWN0b3IgPSBpbmplY3RvciB8fCB0aGlzLnBhcmVudEluamVjdG9yO1xuICAgICAgICBpZiAoIW5nTW9kdWxlUmVmICYmIChjb21wb25lbnRGYWN0b3J5IGFzIGFueSkubmdNb2R1bGUgPT0gbnVsbCAmJiBjb250ZXh0SW5qZWN0b3IpIHtcbiAgICAgICAgICBuZ01vZHVsZVJlZiA9IGNvbnRleHRJbmplY3Rvci5nZXQodmlld0VuZ2luZV9OZ01vZHVsZVJlZiwgbnVsbCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjb21wb25lbnRSZWYgPVxuICAgICAgICAgICAgY29tcG9uZW50RmFjdG9yeS5jcmVhdGUoY29udGV4dEluamVjdG9yLCBwcm9qZWN0YWJsZU5vZGVzLCB1bmRlZmluZWQsIG5nTW9kdWxlUmVmKTtcbiAgICAgICAgdGhpcy5pbnNlcnQoY29tcG9uZW50UmVmLmhvc3RWaWV3LCBpbmRleCk7XG4gICAgICAgIHJldHVybiBjb21wb25lbnRSZWY7XG4gICAgICB9XG5cbiAgICAgIGluc2VydCh2aWV3UmVmOiB2aWV3RW5naW5lX1ZpZXdSZWYsIGluZGV4PzogbnVtYmVyKTogdmlld0VuZ2luZV9WaWV3UmVmIHtcbiAgICAgICAgaWYgKHZpZXdSZWYuZGVzdHJveWVkKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgaW5zZXJ0IGEgZGVzdHJveWVkIFZpZXcgaW4gYSBWaWV3Q29udGFpbmVyIScpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYWxsb2NhdGVDb250YWluZXJJZk5lZWRlZCgpO1xuICAgICAgICBjb25zdCBsVmlldyA9ICh2aWV3UmVmIGFzIFZpZXdSZWY8YW55PikuX2xWaWV3ICE7XG4gICAgICAgIGNvbnN0IGFkanVzdGVkSWR4ID0gdGhpcy5fYWRqdXN0SW5kZXgoaW5kZXgpO1xuXG4gICAgICAgIGlmICh2aWV3QXR0YWNoZWRUb0NvbnRhaW5lcihsVmlldykpIHtcbiAgICAgICAgICAvLyBJZiB2aWV3IGlzIGFscmVhZHkgYXR0YWNoZWQsIGZhbGwgYmFjayB0byBtb3ZlKCkgc28gd2UgY2xlYW4gdXBcbiAgICAgICAgICAvLyByZWZlcmVuY2VzIGFwcHJvcHJpYXRlbHkuXG4gICAgICAgICAgcmV0dXJuIHRoaXMubW92ZSh2aWV3UmVmLCBhZGp1c3RlZElkeCk7XG4gICAgICAgIH1cblxuICAgICAgICBpbnNlcnRWaWV3KGxWaWV3LCB0aGlzLl9sQ29udGFpbmVyLCBhZGp1c3RlZElkeCk7XG5cbiAgICAgICAgY29uc3QgYmVmb3JlTm9kZSA9IGdldEJlZm9yZU5vZGVGb3JWaWV3KGFkanVzdGVkSWR4LCB0aGlzLl9sQ29udGFpbmVyKTtcbiAgICAgICAgYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIobFZpZXcsIHRydWUsIGJlZm9yZU5vZGUpO1xuXG4gICAgICAgICh2aWV3UmVmIGFzIFZpZXdSZWY8YW55PikuYXR0YWNoVG9WaWV3Q29udGFpbmVyUmVmKHRoaXMpO1xuICAgICAgICB0aGlzLl9sQ29udGFpbmVyW1ZJRVdfUkVGU10gIS5zcGxpY2UoYWRqdXN0ZWRJZHgsIDAsIHZpZXdSZWYpO1xuXG4gICAgICAgIHJldHVybiB2aWV3UmVmO1xuICAgICAgfVxuXG4gICAgICBtb3ZlKHZpZXdSZWY6IHZpZXdFbmdpbmVfVmlld1JlZiwgbmV3SW5kZXg6IG51bWJlcik6IHZpZXdFbmdpbmVfVmlld1JlZiB7XG4gICAgICAgIGlmICh2aWV3UmVmLmRlc3Ryb3llZCkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IG1vdmUgYSBkZXN0cm95ZWQgVmlldyBpbiBhIFZpZXdDb250YWluZXIhJyk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLmluZGV4T2Yodmlld1JlZik7XG4gICAgICAgIGlmIChpbmRleCAhPT0gLTEpIHRoaXMuZGV0YWNoKGluZGV4KTtcbiAgICAgICAgdGhpcy5pbnNlcnQodmlld1JlZiwgbmV3SW5kZXgpO1xuICAgICAgICByZXR1cm4gdmlld1JlZjtcbiAgICAgIH1cblxuICAgICAgaW5kZXhPZih2aWV3UmVmOiB2aWV3RW5naW5lX1ZpZXdSZWYpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5fbENvbnRhaW5lcltWSUVXX1JFRlNdICE9PSBudWxsID9cbiAgICAgICAgICAgIHRoaXMuX2xDb250YWluZXJbVklFV19SRUZTXSAhLmluZGV4T2Yodmlld1JlZikgOlxuICAgICAgICAgICAgMDtcbiAgICAgIH1cblxuICAgICAgcmVtb3ZlKGluZGV4PzogbnVtYmVyKTogdm9pZCB7XG4gICAgICAgIHRoaXMuYWxsb2NhdGVDb250YWluZXJJZk5lZWRlZCgpO1xuICAgICAgICBjb25zdCBhZGp1c3RlZElkeCA9IHRoaXMuX2FkanVzdEluZGV4KGluZGV4LCAtMSk7XG4gICAgICAgIHJlbW92ZVZpZXcodGhpcy5fbENvbnRhaW5lciwgYWRqdXN0ZWRJZHgpO1xuICAgICAgICB0aGlzLl9sQ29udGFpbmVyW1ZJRVdfUkVGU10gIS5zcGxpY2UoYWRqdXN0ZWRJZHgsIDEpO1xuICAgICAgfVxuXG4gICAgICBkZXRhY2goaW5kZXg/OiBudW1iZXIpOiB2aWV3RW5naW5lX1ZpZXdSZWZ8bnVsbCB7XG4gICAgICAgIHRoaXMuYWxsb2NhdGVDb250YWluZXJJZk5lZWRlZCgpO1xuICAgICAgICBjb25zdCBhZGp1c3RlZElkeCA9IHRoaXMuX2FkanVzdEluZGV4KGluZGV4LCAtMSk7XG4gICAgICAgIGNvbnN0IHZpZXcgPSBkZXRhY2hWaWV3KHRoaXMuX2xDb250YWluZXIsIGFkanVzdGVkSWR4KTtcbiAgICAgICAgY29uc3Qgd2FzRGV0YWNoZWQgPSB2aWV3ICYmIHRoaXMuX2xDb250YWluZXJbVklFV19SRUZTXSAhLnNwbGljZShhZGp1c3RlZElkeCwgMSlbMF0gIT0gbnVsbDtcbiAgICAgICAgcmV0dXJuIHdhc0RldGFjaGVkID8gbmV3IFZpZXdSZWYodmlldyAhLCB2aWV3ICFbQ09OVEVYVF0sIC0xKSA6IG51bGw7XG4gICAgICB9XG5cbiAgICAgIHByaXZhdGUgX2FkanVzdEluZGV4KGluZGV4PzogbnVtYmVyLCBzaGlmdDogbnVtYmVyID0gMCkge1xuICAgICAgICBpZiAoaW5kZXggPT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiB0aGlzLmxlbmd0aCArIHNoaWZ0O1xuICAgICAgICB9XG4gICAgICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgICAgICBhc3NlcnRHcmVhdGVyVGhhbihpbmRleCwgLTEsICdpbmRleCBtdXN0IGJlIHBvc2l0aXZlJyk7XG4gICAgICAgICAgLy8gKzEgYmVjYXVzZSBpdCdzIGxlZ2FsIHRvIGluc2VydCBhdCB0aGUgZW5kLlxuICAgICAgICAgIGFzc2VydExlc3NUaGFuKGluZGV4LCB0aGlzLmxlbmd0aCArIDEgKyBzaGlmdCwgJ2luZGV4Jyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGluZGV4O1xuICAgICAgfVxuXG4gICAgICBwcml2YXRlIGFsbG9jYXRlQ29udGFpbmVySWZOZWVkZWQoKTogdm9pZCB7XG4gICAgICAgIGlmICh0aGlzLl9sQ29udGFpbmVyW1ZJRVdfUkVGU10gPT09IG51bGwpIHtcbiAgICAgICAgICB0aGlzLl9sQ29udGFpbmVyW1ZJRVdfUkVGU10gPSBbXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlcyhcbiAgICAgICAgICAgICAgICAgICBob3N0VE5vZGUsIFROb2RlVHlwZS5Db250YWluZXIsIFROb2RlVHlwZS5FbGVtZW50LCBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcik7XG5cbiAgbGV0IGxDb250YWluZXI6IExDb250YWluZXI7XG4gIGNvbnN0IHNsb3RWYWx1ZSA9IGhvc3RWaWV3W2hvc3RUTm9kZS5pbmRleF07XG4gIGlmIChpc0xDb250YWluZXIoc2xvdFZhbHVlKSkge1xuICAgIC8vIElmIHRoZSBob3N0IGlzIGEgY29udGFpbmVyLCB3ZSBkb24ndCBuZWVkIHRvIGNyZWF0ZSBhIG5ldyBMQ29udGFpbmVyXG4gICAgbENvbnRhaW5lciA9IHNsb3RWYWx1ZTtcbiAgICBsQ29udGFpbmVyW0FDVElWRV9JTkRFWF0gPSAtMTtcbiAgfSBlbHNlIHtcbiAgICBsZXQgY29tbWVudE5vZGU6IFJDb21tZW50O1xuICAgIC8vIElmIHRoZSBob3N0IGlzIGFuIGVsZW1lbnQgY29udGFpbmVyLCB0aGUgbmF0aXZlIGhvc3QgZWxlbWVudCBpcyBndWFyYW50ZWVkIHRvIGJlIGFcbiAgICAvLyBjb21tZW50IGFuZCB3ZSBjYW4gcmV1c2UgdGhhdCBjb21tZW50IGFzIGFuY2hvciBlbGVtZW50IGZvciB0aGUgbmV3IExDb250YWluZXIuXG4gICAgaWYgKGhvc3RUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcikge1xuICAgICAgY29tbWVudE5vZGUgPSB1bndyYXBSTm9kZShzbG90VmFsdWUpIGFzIFJDb21tZW50O1xuICAgIH0gZWxzZSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQ3JlYXRlQ29tbWVudCsrO1xuICAgICAgY29tbWVudE5vZGUgPSBob3N0Vmlld1tSRU5ERVJFUl0uY3JlYXRlQ29tbWVudChuZ0Rldk1vZGUgPyAnY29udGFpbmVyJyA6ICcnKTtcbiAgICB9XG5cbiAgICAvLyBBIGNvbnRhaW5lciBjYW4gYmUgY3JlYXRlZCBvbiB0aGUgcm9vdCAodG9wbW9zdCAvIGJvb3RzdHJhcHBlZCkgY29tcG9uZW50IGFuZCBpbiB0aGlzIGNhc2Ugd2VcbiAgICAvLyBjYW4ndCB1c2UgTFRyZWUgdG8gaW5zZXJ0IGNvbnRhaW5lcidzIG1hcmtlciBub2RlIChib3RoIHBhcmVudCBvZiBhIGNvbW1lbnQgbm9kZSBhbmQgdGhlXG4gICAgLy8gY29tbWVuZCBub2RlIGl0c2VsZiBpcyBsb2NhdGVkIG91dHNpZGUgb2YgZWxlbWVudHMgaG9sZCBieSBMVHJlZSkuIEluIHRoaXMgc3BlY2lmaWMgY2FzZSB3ZVxuICAgIC8vIHVzZSBsb3ctbGV2ZWwgRE9NIG1hbmlwdWxhdGlvbiB0byBpbnNlcnQgY29udGFpbmVyJ3MgbWFya2VyIChjb21tZW50KSBub2RlLlxuICAgIGlmIChpc1Jvb3RWaWV3KGhvc3RWaWV3KSkge1xuICAgICAgY29uc3QgcmVuZGVyZXIgPSBob3N0Vmlld1tSRU5ERVJFUl07XG4gICAgICBjb25zdCBob3N0TmF0aXZlID0gZ2V0TmF0aXZlQnlUTm9kZShob3N0VE5vZGUsIGhvc3RWaWV3KSAhO1xuICAgICAgY29uc3QgcGFyZW50T2ZIb3N0TmF0aXZlID0gbmF0aXZlUGFyZW50Tm9kZShyZW5kZXJlciwgaG9zdE5hdGl2ZSk7XG4gICAgICBuYXRpdmVJbnNlcnRCZWZvcmUoXG4gICAgICAgICAgcmVuZGVyZXIsIHBhcmVudE9mSG9zdE5hdGl2ZSAhLCBjb21tZW50Tm9kZSwgbmF0aXZlTmV4dFNpYmxpbmcocmVuZGVyZXIsIGhvc3ROYXRpdmUpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYXBwZW5kQ2hpbGQoY29tbWVudE5vZGUsIGhvc3RUTm9kZSwgaG9zdFZpZXcpO1xuICAgIH1cblxuICAgIGhvc3RWaWV3W2hvc3RUTm9kZS5pbmRleF0gPSBsQ29udGFpbmVyID1cbiAgICAgICAgY3JlYXRlTENvbnRhaW5lcihzbG90VmFsdWUsIGhvc3RWaWV3LCBjb21tZW50Tm9kZSwgaG9zdFROb2RlLCB0cnVlKTtcblxuICAgIGFkZFRvVmlld1RyZWUoaG9zdFZpZXcsIGxDb250YWluZXIpO1xuICB9XG5cbiAgcmV0dXJuIG5ldyBSM1ZpZXdDb250YWluZXJSZWYobENvbnRhaW5lciwgaG9zdFROb2RlLCBob3N0Vmlldyk7XG59XG5cblxuLyoqIFJldHVybnMgYSBDaGFuZ2VEZXRlY3RvclJlZiAoYS5rLmEuIGEgVmlld1JlZikgKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RDaGFuZ2VEZXRlY3RvclJlZigpOiBWaWV3RW5naW5lX0NoYW5nZURldGVjdG9yUmVmIHtcbiAgcmV0dXJuIGNyZWF0ZVZpZXdSZWYoZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCksIGdldExWaWV3KCksIG51bGwpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBWaWV3UmVmIGFuZCBzdG9yZXMgaXQgb24gdGhlIGluamVjdG9yIGFzIENoYW5nZURldGVjdG9yUmVmIChwdWJsaWMgYWxpYXMpLlxuICpcbiAqIEBwYXJhbSBob3N0VE5vZGUgVGhlIG5vZGUgdGhhdCBpcyByZXF1ZXN0aW5nIGEgQ2hhbmdlRGV0ZWN0b3JSZWZcbiAqIEBwYXJhbSBob3N0VmlldyBUaGUgdmlldyB0byB3aGljaCB0aGUgbm9kZSBiZWxvbmdzXG4gKiBAcGFyYW0gY29udGV4dCBUaGUgY29udGV4dCBmb3IgdGhpcyBjaGFuZ2UgZGV0ZWN0b3IgcmVmXG4gKiBAcmV0dXJucyBUaGUgQ2hhbmdlRGV0ZWN0b3JSZWYgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVWaWV3UmVmKFxuICAgIGhvc3RUTm9kZTogVE5vZGUsIGhvc3RWaWV3OiBMVmlldywgY29udGV4dDogYW55KTogVmlld0VuZ2luZV9DaGFuZ2VEZXRlY3RvclJlZiB7XG4gIGlmIChpc0NvbXBvbmVudChob3N0VE5vZGUpKSB7XG4gICAgY29uc3QgY29tcG9uZW50SW5kZXggPSBob3N0VE5vZGUuZGlyZWN0aXZlU3RhcnQ7XG4gICAgY29uc3QgY29tcG9uZW50VmlldyA9IGdldENvbXBvbmVudFZpZXdCeUluZGV4KGhvc3RUTm9kZS5pbmRleCwgaG9zdFZpZXcpO1xuICAgIHJldHVybiBuZXcgVmlld1JlZihjb21wb25lbnRWaWV3LCBjb250ZXh0LCBjb21wb25lbnRJbmRleCk7XG4gIH0gZWxzZSBpZiAoXG4gICAgICBob3N0VE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQgfHwgaG9zdFROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Db250YWluZXIgfHxcbiAgICAgIGhvc3RUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcikge1xuICAgIGNvbnN0IGhvc3RDb21wb25lbnRWaWV3ID0gZmluZENvbXBvbmVudFZpZXcoaG9zdFZpZXcpO1xuICAgIHJldHVybiBuZXcgVmlld1JlZihob3N0Q29tcG9uZW50VmlldywgaG9zdENvbXBvbmVudFZpZXdbQ09OVEVYVF0sIC0xKTtcbiAgfVxuICByZXR1cm4gbnVsbCAhO1xufVxuXG4vKiogUmV0dXJucyBhIFJlbmRlcmVyMiAob3IgdGhyb3dzIHdoZW4gYXBwbGljYXRpb24gd2FzIGJvb3RzdHJhcHBlZCB3aXRoIFJlbmRlcmVyMykgKi9cbmZ1bmN0aW9uIGdldE9yQ3JlYXRlUmVuZGVyZXIyKHZpZXc6IExWaWV3KTogUmVuZGVyZXIyIHtcbiAgY29uc3QgcmVuZGVyZXIgPSB2aWV3W1JFTkRFUkVSXTtcbiAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgIHJldHVybiByZW5kZXJlciBhcyBSZW5kZXJlcjI7XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgaW5qZWN0IFJlbmRlcmVyMiB3aGVuIHRoZSBhcHBsaWNhdGlvbiB1c2VzIFJlbmRlcmVyMyEnKTtcbiAgfVxufVxuXG4vKiogSW5qZWN0cyBhIFJlbmRlcmVyMiBmb3IgdGhlIGN1cnJlbnQgY29tcG9uZW50LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdFJlbmRlcmVyMigpOiBSZW5kZXJlcjIge1xuICAvLyBXZSBuZWVkIHRoZSBSZW5kZXJlciB0byBiZSBiYXNlZCBvbiB0aGUgY29tcG9uZW50IHRoYXQgaXQncyBiZWluZyBpbmplY3RlZCBpbnRvLCBob3dldmVyIHNpbmNlXG4gIC8vIERJIGhhcHBlbnMgYmVmb3JlIHdlJ3ZlIGVudGVyZWQgaXRzIHZpZXcsIGBnZXRMVmlld2Agd2lsbCByZXR1cm4gdGhlIHBhcmVudCB2aWV3IGluc3RlYWQuXG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgY29uc3Qgbm9kZUF0SW5kZXggPSBnZXRDb21wb25lbnRWaWV3QnlJbmRleCh0Tm9kZS5pbmRleCwgbFZpZXcpO1xuICByZXR1cm4gZ2V0T3JDcmVhdGVSZW5kZXJlcjIoaXNMVmlldyhub2RlQXRJbmRleCkgPyBub2RlQXRJbmRleCA6IGxWaWV3KTtcbn1cbiJdfQ==