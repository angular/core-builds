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
import { ACTIVE_INDEX, NATIVE, VIEWS } from './interfaces/container';
import { isProceduralRenderer } from './interfaces/renderer';
import { CONTEXT, QUERIES, RENDERER, T_HOST } from './interfaces/view';
import { assertNodeOfPossibleTypes } from './node_assert';
import { addRemoveViewFromContainer, appendChild, detachView, getBeforeNodeForView, insertView, nativeInsertBefore, nativeNextSibling, nativeParentNode, removeView } from './node_manipulation';
import { getParentInjectorTNode } from './node_util';
import { getLView, getPreviousOrParentTNode } from './state';
import { getParentInjectorView, hasParentInjector } from './util/injector_utils';
import { findComponentView } from './util/view_traversal_utils';
import { getComponentViewByIndex, getNativeByTNode, isComponent, isLContainer, isRootView, viewAttachedToContainer } from './util/view_utils';
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
                this._viewRefs = [];
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
                while (this._lContainer[VIEWS].length) {
                    this.remove(0);
                }
            }
            /**
             * @param {?} index
             * @return {?}
             */
            get(index) { return this._viewRefs[index] || null; }
            /**
             * @return {?}
             */
            get length() { return this._lContainer[VIEWS].length; }
            /**
             * @template C
             * @param {?} templateRef
             * @param {?=} context
             * @param {?=} index
             * @return {?}
             */
            createEmbeddedView(templateRef, context, index) {
                /** @type {?} */
                const adjustedIdx = this._adjustIndex(index);
                /** @type {?} */
                const viewRef = ((/** @type {?} */ (templateRef)))
                    .createEmbeddedView(context || (/** @type {?} */ ({})), this._lContainer, adjustedIdx);
                ((/** @type {?} */ (viewRef))).attachToViewContainerRef(this);
                this._viewRefs.splice(adjustedIdx, 0, viewRef);
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
                const beforeNode = getBeforeNodeForView(adjustedIdx, this._lContainer[VIEWS], this._lContainer[NATIVE]);
                addRemoveViewFromContainer(lView, true, beforeNode);
                ((/** @type {?} */ (viewRef))).attachToViewContainerRef(this);
                this._viewRefs.splice(adjustedIdx, 0, viewRef);
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
            indexOf(viewRef) { return this._viewRefs.indexOf(viewRef); }
            /**
             * @param {?=} index
             * @return {?}
             */
            remove(index) {
                /** @type {?} */
                const adjustedIdx = this._adjustIndex(index, -1);
                removeView(this._lContainer, adjustedIdx);
                this._viewRefs.splice(adjustedIdx, 1);
            }
            /**
             * @param {?=} index
             * @return {?}
             */
            detach(index) {
                /** @type {?} */
                const adjustedIdx = this._adjustIndex(index, -1);
                /** @type {?} */
                const view = detachView(this._lContainer, adjustedIdx);
                /** @type {?} */
                const wasDetached = this._viewRefs.splice(adjustedIdx, 1)[0] != null;
                return wasDetached ? new ViewRef(view, view[CONTEXT], -1) : null;
            }
            /**
             * @private
             * @param {?=} index
             * @param {?=} shift
             * @return {?}
             */
            _adjustIndex(index, shift = 0) {
                if (index == null) {
                    return this._lContainer[VIEWS].length + shift;
                }
                if (ngDevMode) {
                    assertGreaterThan(index, -1, 'index must be positive');
                    // +1 because it's legal to insert at the end.
                    assertLessThan(index, this._lContainer[VIEWS].length + 1 + shift, 'index');
                }
                return index;
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
        const commentNode = hostView[RENDERER].createComment(ngDevMode ? 'container' : '');
        ngDevMode && ngDevMode.rendererCreateComment++;
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
 * Returns a Renderer2 (or throws when application was bootstrapped with Renderer3)
 * @return {?}
 */
export function injectRenderer2() {
    return getOrCreateRenderer2(getLView());
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld19lbmdpbmVfY29tcGF0aWJpbGl0eS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvdmlld19lbmdpbmVfY29tcGF0aWJpbGl0eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVlBLE9BQU8sRUFBQyxXQUFXLElBQUksc0JBQXNCLEVBQUMsTUFBTSw2QkFBNkIsQ0FBQztBQUtsRixPQUFPLEVBQUMsYUFBYSxFQUFFLGlCQUFpQixFQUFFLGNBQWMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRWhGLE9BQU8sRUFBQyxZQUFZLEVBQUUseUJBQXlCLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDN0QsT0FBTyxFQUFDLGFBQWEsRUFBRSx5QkFBeUIsRUFBRSxnQkFBZ0IsRUFBRSxzQkFBc0IsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3pILE9BQU8sRUFBQyxZQUFZLEVBQWMsTUFBTSxFQUFFLEtBQUssRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBRS9FLE9BQU8sRUFBcUIsb0JBQW9CLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUMvRSxPQUFPLEVBQUMsT0FBTyxFQUFTLE9BQU8sRUFBRSxRQUFRLEVBQVMsTUFBTSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDbkYsT0FBTyxFQUFDLHlCQUF5QixFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ3hELE9BQU8sRUFBQywwQkFBMEIsRUFBRSxXQUFXLEVBQUUsVUFBVSxFQUFFLG9CQUFvQixFQUFFLFVBQVUsRUFBRSxrQkFBa0IsRUFBRSxpQkFBaUIsRUFBRSxnQkFBZ0IsRUFBRSxVQUFVLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUMvTCxPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSxhQUFhLENBQUM7QUFDbkQsT0FBTyxFQUFDLFFBQVEsRUFBRSx3QkFBd0IsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUMz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QUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUN2RTtJQUNELE9BQU8sbUJBQUEsSUFBSSxFQUFFLENBQUM7QUFDaEIsQ0FBQzs7Ozs7QUFFRCxTQUFTLG9CQUFvQixDQUFDLElBQVc7O1VBQ2pDLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO0lBQy9CLElBQUksb0JBQW9CLENBQUMsUUFBUSxDQUFDLEVBQUU7UUFDbEMsT0FBTyxtQkFBQSxRQUFRLEVBQWEsQ0FBQztLQUM5QjtTQUFNO1FBQ0wsTUFBTSxJQUFJLEtBQUssQ0FBQyw4REFBOEQsQ0FBQyxDQUFDO0tBQ2pGO0FBQ0gsQ0FBQzs7Ozs7QUFHRCxNQUFNLFVBQVUsZUFBZTtJQUM3QixPQUFPLG9CQUFvQixDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7QUFDMUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtDaGFuZ2VEZXRlY3RvclJlZiBhcyBWaWV3RW5naW5lX0NoYW5nZURldGVjdG9yUmVmfSBmcm9tICcuLi9jaGFuZ2VfZGV0ZWN0aW9uL2NoYW5nZV9kZXRlY3Rvcl9yZWYnO1xuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi4vZGkvaW5qZWN0b3InO1xuaW1wb3J0IHtDb21wb25lbnRGYWN0b3J5IGFzIHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeSwgQ29tcG9uZW50UmVmIGFzIHZpZXdFbmdpbmVfQ29tcG9uZW50UmVmfSBmcm9tICcuLi9saW5rZXIvY29tcG9uZW50X2ZhY3RvcnknO1xuaW1wb3J0IHtFbGVtZW50UmVmIGFzIFZpZXdFbmdpbmVfRWxlbWVudFJlZn0gZnJvbSAnLi4vbGlua2VyL2VsZW1lbnRfcmVmJztcbmltcG9ydCB7TmdNb2R1bGVSZWYgYXMgdmlld0VuZ2luZV9OZ01vZHVsZVJlZn0gZnJvbSAnLi4vbGlua2VyL25nX21vZHVsZV9mYWN0b3J5JztcbmltcG9ydCB7VGVtcGxhdGVSZWYgYXMgVmlld0VuZ2luZV9UZW1wbGF0ZVJlZn0gZnJvbSAnLi4vbGlua2VyL3RlbXBsYXRlX3JlZic7XG5pbXBvcnQge1ZpZXdDb250YWluZXJSZWYgYXMgVmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmfSBmcm9tICcuLi9saW5rZXIvdmlld19jb250YWluZXJfcmVmJztcbmltcG9ydCB7RW1iZWRkZWRWaWV3UmVmIGFzIHZpZXdFbmdpbmVfRW1iZWRkZWRWaWV3UmVmLCBWaWV3UmVmIGFzIHZpZXdFbmdpbmVfVmlld1JlZn0gZnJvbSAnLi4vbGlua2VyL3ZpZXdfcmVmJztcbmltcG9ydCB7UmVuZGVyZXIyfSBmcm9tICcuLi9yZW5kZXIvYXBpJztcbmltcG9ydCB7YXNzZXJ0RGVmaW5lZCwgYXNzZXJ0R3JlYXRlclRoYW4sIGFzc2VydExlc3NUaGFufSBmcm9tICcuLi91dGlsL2Fzc2VydCc7XG5cbmltcG9ydCB7Tm9kZUluamVjdG9yLCBnZXRQYXJlbnRJbmplY3RvckxvY2F0aW9ufSBmcm9tICcuL2RpJztcbmltcG9ydCB7YWRkVG9WaWV3VHJlZSwgY3JlYXRlRW1iZWRkZWRWaWV3QW5kTm9kZSwgY3JlYXRlTENvbnRhaW5lciwgcmVuZGVyRW1iZWRkZWRUZW1wbGF0ZX0gZnJvbSAnLi9pbnN0cnVjdGlvbnMvc2hhcmVkJztcbmltcG9ydCB7QUNUSVZFX0lOREVYLCBMQ29udGFpbmVyLCBOQVRJVkUsIFZJRVdTfSBmcm9tICcuL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7VENvbnRhaW5lck5vZGUsIFRFbGVtZW50Q29udGFpbmVyTm9kZSwgVEVsZW1lbnROb2RlLCBUTm9kZSwgVE5vZGVUeXBlLCBUVmlld05vZGV9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7UkNvbW1lbnQsIFJFbGVtZW50LCBpc1Byb2NlZHVyYWxSZW5kZXJlcn0gZnJvbSAnLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7Q09OVEVYVCwgTFZpZXcsIFFVRVJJRVMsIFJFTkRFUkVSLCBUVmlldywgVF9IT1NUfSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXN9IGZyb20gJy4vbm9kZV9hc3NlcnQnO1xuaW1wb3J0IHthZGRSZW1vdmVWaWV3RnJvbUNvbnRhaW5lciwgYXBwZW5kQ2hpbGQsIGRldGFjaFZpZXcsIGdldEJlZm9yZU5vZGVGb3JWaWV3LCBpbnNlcnRWaWV3LCBuYXRpdmVJbnNlcnRCZWZvcmUsIG5hdGl2ZU5leHRTaWJsaW5nLCBuYXRpdmVQYXJlbnROb2RlLCByZW1vdmVWaWV3fSBmcm9tICcuL25vZGVfbWFuaXB1bGF0aW9uJztcbmltcG9ydCB7Z2V0UGFyZW50SW5qZWN0b3JUTm9kZX0gZnJvbSAnLi9ub2RlX3V0aWwnO1xuaW1wb3J0IHtnZXRMVmlldywgZ2V0UHJldmlvdXNPclBhcmVudFROb2RlfSBmcm9tICcuL3N0YXRlJztcbmltcG9ydCB7Z2V0UGFyZW50SW5qZWN0b3JWaWV3LCBoYXNQYXJlbnRJbmplY3Rvcn0gZnJvbSAnLi91dGlsL2luamVjdG9yX3V0aWxzJztcbmltcG9ydCB7ZmluZENvbXBvbmVudFZpZXd9IGZyb20gJy4vdXRpbC92aWV3X3RyYXZlcnNhbF91dGlscyc7XG5pbXBvcnQge2dldENvbXBvbmVudFZpZXdCeUluZGV4LCBnZXROYXRpdmVCeVROb2RlLCBpc0NvbXBvbmVudCwgaXNMQ29udGFpbmVyLCBpc1Jvb3RWaWV3LCB2aWV3QXR0YWNoZWRUb0NvbnRhaW5lcn0gZnJvbSAnLi91dGlsL3ZpZXdfdXRpbHMnO1xuaW1wb3J0IHtWaWV3UmVmfSBmcm9tICcuL3ZpZXdfcmVmJztcblxuXG5cbi8qKlxuICogQ3JlYXRlcyBhbiBFbGVtZW50UmVmIGZyb20gdGhlIG1vc3QgcmVjZW50IG5vZGUuXG4gKlxuICogQHJldHVybnMgVGhlIEVsZW1lbnRSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RFbGVtZW50UmVmKEVsZW1lbnRSZWZUb2tlbjogdHlwZW9mIFZpZXdFbmdpbmVfRWxlbWVudFJlZik6XG4gICAgVmlld0VuZ2luZV9FbGVtZW50UmVmIHtcbiAgcmV0dXJuIGNyZWF0ZUVsZW1lbnRSZWYoRWxlbWVudFJlZlRva2VuLCBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKSwgZ2V0TFZpZXcoKSk7XG59XG5cbmxldCBSM0VsZW1lbnRSZWY6IHtuZXcgKG5hdGl2ZTogUkVsZW1lbnQgfCBSQ29tbWVudCk6IFZpZXdFbmdpbmVfRWxlbWVudFJlZn07XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBFbGVtZW50UmVmIGdpdmVuIGEgbm9kZS5cbiAqXG4gKiBAcGFyYW0gRWxlbWVudFJlZlRva2VuIFRoZSBFbGVtZW50UmVmIHR5cGVcbiAqIEBwYXJhbSB0Tm9kZSBUaGUgbm9kZSBmb3Igd2hpY2ggeW91J2QgbGlrZSBhbiBFbGVtZW50UmVmXG4gKiBAcGFyYW0gdmlldyBUaGUgdmlldyB0byB3aGljaCB0aGUgbm9kZSBiZWxvbmdzXG4gKiBAcmV0dXJucyBUaGUgRWxlbWVudFJlZiBpbnN0YW5jZSB0byB1c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVsZW1lbnRSZWYoXG4gICAgRWxlbWVudFJlZlRva2VuOiB0eXBlb2YgVmlld0VuZ2luZV9FbGVtZW50UmVmLCB0Tm9kZTogVE5vZGUsXG4gICAgdmlldzogTFZpZXcpOiBWaWV3RW5naW5lX0VsZW1lbnRSZWYge1xuICBpZiAoIVIzRWxlbWVudFJlZikge1xuICAgIC8vIFRPRE86IEZpeCBjbGFzcyBuYW1lLCBzaG91bGQgYmUgRWxlbWVudFJlZiwgYnV0IHRoZXJlIGFwcGVhcnMgdG8gYmUgYSByb2xsdXAgYnVnXG4gICAgUjNFbGVtZW50UmVmID0gY2xhc3MgRWxlbWVudFJlZl8gZXh0ZW5kcyBFbGVtZW50UmVmVG9rZW4ge307XG4gIH1cbiAgcmV0dXJuIG5ldyBSM0VsZW1lbnRSZWYoZ2V0TmF0aXZlQnlUTm9kZSh0Tm9kZSwgdmlldykgYXMgUkVsZW1lbnQpO1xufVxuXG5sZXQgUjNUZW1wbGF0ZVJlZjoge1xuICBuZXcgKFxuICAgICAgX2RlY2xhcmF0aW9uUGFyZW50VmlldzogTFZpZXcsIGVsZW1lbnRSZWY6IFZpZXdFbmdpbmVfRWxlbWVudFJlZiwgX3RWaWV3OiBUVmlldyxcbiAgICAgIF9ob3N0TENvbnRhaW5lcjogTENvbnRhaW5lciwgX2luamVjdG9ySW5kZXg6IG51bWJlcik6IFZpZXdFbmdpbmVfVGVtcGxhdGVSZWY8YW55PlxufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgVGVtcGxhdGVSZWYgZ2l2ZW4gYSBub2RlLlxuICpcbiAqIEByZXR1cm5zIFRoZSBUZW1wbGF0ZVJlZiBpbnN0YW5jZSB0byB1c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdFRlbXBsYXRlUmVmPFQ+KFxuICAgIFRlbXBsYXRlUmVmVG9rZW46IHR5cGVvZiBWaWV3RW5naW5lX1RlbXBsYXRlUmVmLFxuICAgIEVsZW1lbnRSZWZUb2tlbjogdHlwZW9mIFZpZXdFbmdpbmVfRWxlbWVudFJlZik6IFZpZXdFbmdpbmVfVGVtcGxhdGVSZWY8VD58bnVsbCB7XG4gIHJldHVybiBjcmVhdGVUZW1wbGF0ZVJlZjxUPihcbiAgICAgIFRlbXBsYXRlUmVmVG9rZW4sIEVsZW1lbnRSZWZUb2tlbiwgZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCksIGdldExWaWV3KCkpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBUZW1wbGF0ZVJlZiBhbmQgc3RvcmVzIGl0IG9uIHRoZSBpbmplY3Rvci5cbiAqXG4gKiBAcGFyYW0gVGVtcGxhdGVSZWZUb2tlbiBUaGUgVGVtcGxhdGVSZWYgdHlwZVxuICogQHBhcmFtIEVsZW1lbnRSZWZUb2tlbiBUaGUgRWxlbWVudFJlZiB0eXBlXG4gKiBAcGFyYW0gaG9zdFROb2RlIFRoZSBub2RlIHRoYXQgaXMgcmVxdWVzdGluZyBhIFRlbXBsYXRlUmVmXG4gKiBAcGFyYW0gaG9zdFZpZXcgVGhlIHZpZXcgdG8gd2hpY2ggdGhlIG5vZGUgYmVsb25nc1xuICogQHJldHVybnMgVGhlIFRlbXBsYXRlUmVmIGluc3RhbmNlIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVGVtcGxhdGVSZWY8VD4oXG4gICAgVGVtcGxhdGVSZWZUb2tlbjogdHlwZW9mIFZpZXdFbmdpbmVfVGVtcGxhdGVSZWYsIEVsZW1lbnRSZWZUb2tlbjogdHlwZW9mIFZpZXdFbmdpbmVfRWxlbWVudFJlZixcbiAgICBob3N0VE5vZGU6IFROb2RlLCBob3N0VmlldzogTFZpZXcpOiBWaWV3RW5naW5lX1RlbXBsYXRlUmVmPFQ+fG51bGwge1xuICBpZiAoIVIzVGVtcGxhdGVSZWYpIHtcbiAgICAvLyBUT0RPOiBGaXggY2xhc3MgbmFtZSwgc2hvdWxkIGJlIFRlbXBsYXRlUmVmLCBidXQgdGhlcmUgYXBwZWFycyB0byBiZSBhIHJvbGx1cCBidWdcbiAgICBSM1RlbXBsYXRlUmVmID0gY2xhc3MgVGVtcGxhdGVSZWZfPFQ+IGV4dGVuZHMgVGVtcGxhdGVSZWZUb2tlbjxUPiB7XG4gICAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgICBwcml2YXRlIF9kZWNsYXJhdGlvblBhcmVudFZpZXc6IExWaWV3LCByZWFkb25seSBlbGVtZW50UmVmOiBWaWV3RW5naW5lX0VsZW1lbnRSZWYsXG4gICAgICAgICAgcHJpdmF0ZSBfdFZpZXc6IFRWaWV3LCBwcml2YXRlIF9ob3N0TENvbnRhaW5lcjogTENvbnRhaW5lcixcbiAgICAgICAgICBwcml2YXRlIF9pbmplY3RvckluZGV4OiBudW1iZXIpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgIH1cblxuICAgICAgY3JlYXRlRW1iZWRkZWRWaWV3KGNvbnRleHQ6IFQsIGNvbnRhaW5lcj86IExDb250YWluZXIsIGluZGV4PzogbnVtYmVyKTpcbiAgICAgICAgICB2aWV3RW5naW5lX0VtYmVkZGVkVmlld1JlZjxUPiB7XG4gICAgICAgIGNvbnN0IGxWaWV3ID0gY3JlYXRlRW1iZWRkZWRWaWV3QW5kTm9kZShcbiAgICAgICAgICAgIHRoaXMuX3RWaWV3LCBjb250ZXh0LCB0aGlzLl9kZWNsYXJhdGlvblBhcmVudFZpZXcsIHRoaXMuX2hvc3RMQ29udGFpbmVyW1FVRVJJRVNdLFxuICAgICAgICAgICAgdGhpcy5faW5qZWN0b3JJbmRleCk7XG4gICAgICAgIGlmIChjb250YWluZXIpIHtcbiAgICAgICAgICBpbnNlcnRWaWV3KGxWaWV3LCBjb250YWluZXIsIGluZGV4ICEpO1xuICAgICAgICB9XG4gICAgICAgIHJlbmRlckVtYmVkZGVkVGVtcGxhdGUobFZpZXcsIHRoaXMuX3RWaWV3LCBjb250ZXh0KTtcbiAgICAgICAgY29uc3Qgdmlld1JlZiA9IG5ldyBWaWV3UmVmKGxWaWV3LCBjb250ZXh0LCAtMSk7XG4gICAgICAgIHZpZXdSZWYuX3RWaWV3Tm9kZSA9IGxWaWV3W1RfSE9TVF0gYXMgVFZpZXdOb2RlO1xuICAgICAgICByZXR1cm4gdmlld1JlZjtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgaWYgKGhvc3RUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgY29uc3QgaG9zdENvbnRhaW5lcjogTENvbnRhaW5lciA9IGhvc3RWaWV3W2hvc3RUTm9kZS5pbmRleF07XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoaG9zdFROb2RlLnRWaWV3cywgJ1RWaWV3IG11c3QgYmUgYWxsb2NhdGVkJyk7XG4gICAgcmV0dXJuIG5ldyBSM1RlbXBsYXRlUmVmKFxuICAgICAgICBob3N0VmlldywgY3JlYXRlRWxlbWVudFJlZihFbGVtZW50UmVmVG9rZW4sIGhvc3RUTm9kZSwgaG9zdFZpZXcpLCBob3N0VE5vZGUudFZpZXdzIGFzIFRWaWV3LFxuICAgICAgICBob3N0Q29udGFpbmVyLCBob3N0VE5vZGUuaW5qZWN0b3JJbmRleCk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxubGV0IFIzVmlld0NvbnRhaW5lclJlZjoge1xuICBuZXcgKFxuICAgICAgbENvbnRhaW5lcjogTENvbnRhaW5lciwgaG9zdFROb2RlOiBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSxcbiAgICAgIGhvc3RWaWV3OiBMVmlldyk6IFZpZXdFbmdpbmVfVmlld0NvbnRhaW5lclJlZlxufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgVmlld0NvbnRhaW5lclJlZiBhbmQgc3RvcmVzIGl0IG9uIHRoZSBpbmplY3Rvci4gT3IsIGlmIHRoZSBWaWV3Q29udGFpbmVyUmVmXG4gKiBhbHJlYWR5IGV4aXN0cywgcmV0cmlldmVzIHRoZSBleGlzdGluZyBWaWV3Q29udGFpbmVyUmVmLlxuICpcbiAqIEByZXR1cm5zIFRoZSBWaWV3Q29udGFpbmVyUmVmIGluc3RhbmNlIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0Vmlld0NvbnRhaW5lclJlZihcbiAgICBWaWV3Q29udGFpbmVyUmVmVG9rZW46IHR5cGVvZiBWaWV3RW5naW5lX1ZpZXdDb250YWluZXJSZWYsXG4gICAgRWxlbWVudFJlZlRva2VuOiB0eXBlb2YgVmlld0VuZ2luZV9FbGVtZW50UmVmKTogVmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmIHtcbiAgY29uc3QgcHJldmlvdXNUTm9kZSA9XG4gICAgICBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKSBhcyBURWxlbWVudE5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGUgfCBUQ29udGFpbmVyTm9kZTtcbiAgcmV0dXJuIGNyZWF0ZUNvbnRhaW5lclJlZihWaWV3Q29udGFpbmVyUmVmVG9rZW4sIEVsZW1lbnRSZWZUb2tlbiwgcHJldmlvdXNUTm9kZSwgZ2V0TFZpZXcoKSk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIFZpZXdDb250YWluZXJSZWYgYW5kIHN0b3JlcyBpdCBvbiB0aGUgaW5qZWN0b3IuXG4gKlxuICogQHBhcmFtIFZpZXdDb250YWluZXJSZWZUb2tlbiBUaGUgVmlld0NvbnRhaW5lclJlZiB0eXBlXG4gKiBAcGFyYW0gRWxlbWVudFJlZlRva2VuIFRoZSBFbGVtZW50UmVmIHR5cGVcbiAqIEBwYXJhbSBob3N0VE5vZGUgVGhlIG5vZGUgdGhhdCBpcyByZXF1ZXN0aW5nIGEgVmlld0NvbnRhaW5lclJlZlxuICogQHBhcmFtIGhvc3RWaWV3IFRoZSB2aWV3IHRvIHdoaWNoIHRoZSBub2RlIGJlbG9uZ3NcbiAqIEByZXR1cm5zIFRoZSBWaWV3Q29udGFpbmVyUmVmIGluc3RhbmNlIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQ29udGFpbmVyUmVmKFxuICAgIFZpZXdDb250YWluZXJSZWZUb2tlbjogdHlwZW9mIFZpZXdFbmdpbmVfVmlld0NvbnRhaW5lclJlZixcbiAgICBFbGVtZW50UmVmVG9rZW46IHR5cGVvZiBWaWV3RW5naW5lX0VsZW1lbnRSZWYsXG4gICAgaG9zdFROb2RlOiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlLFxuICAgIGhvc3RWaWV3OiBMVmlldyk6IFZpZXdFbmdpbmVfVmlld0NvbnRhaW5lclJlZiB7XG4gIGlmICghUjNWaWV3Q29udGFpbmVyUmVmKSB7XG4gICAgLy8gVE9ETzogRml4IGNsYXNzIG5hbWUsIHNob3VsZCBiZSBWaWV3Q29udGFpbmVyUmVmLCBidXQgdGhlcmUgYXBwZWFycyB0byBiZSBhIHJvbGx1cCBidWdcbiAgICBSM1ZpZXdDb250YWluZXJSZWYgPSBjbGFzcyBWaWV3Q29udGFpbmVyUmVmXyBleHRlbmRzIFZpZXdDb250YWluZXJSZWZUb2tlbiB7XG4gICAgICBwcml2YXRlIF92aWV3UmVmczogdmlld0VuZ2luZV9WaWV3UmVmW10gPSBbXTtcblxuICAgICAgY29uc3RydWN0b3IoXG4gICAgICAgICAgcHJpdmF0ZSBfbENvbnRhaW5lcjogTENvbnRhaW5lcixcbiAgICAgICAgICBwcml2YXRlIF9ob3N0VE5vZGU6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxURWxlbWVudENvbnRhaW5lck5vZGUsXG4gICAgICAgICAgcHJpdmF0ZSBfaG9zdFZpZXc6IExWaWV3KSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICB9XG5cbiAgICAgIGdldCBlbGVtZW50KCk6IFZpZXdFbmdpbmVfRWxlbWVudFJlZiB7XG4gICAgICAgIHJldHVybiBjcmVhdGVFbGVtZW50UmVmKEVsZW1lbnRSZWZUb2tlbiwgdGhpcy5faG9zdFROb2RlLCB0aGlzLl9ob3N0Vmlldyk7XG4gICAgICB9XG5cbiAgICAgIGdldCBpbmplY3RvcigpOiBJbmplY3RvciB7IHJldHVybiBuZXcgTm9kZUluamVjdG9yKHRoaXMuX2hvc3RUTm9kZSwgdGhpcy5faG9zdFZpZXcpOyB9XG5cbiAgICAgIC8qKiBAZGVwcmVjYXRlZCBObyByZXBsYWNlbWVudCAqL1xuICAgICAgZ2V0IHBhcmVudEluamVjdG9yKCk6IEluamVjdG9yIHtcbiAgICAgICAgY29uc3QgcGFyZW50TG9jYXRpb24gPSBnZXRQYXJlbnRJbmplY3RvckxvY2F0aW9uKHRoaXMuX2hvc3RUTm9kZSwgdGhpcy5faG9zdFZpZXcpO1xuICAgICAgICBjb25zdCBwYXJlbnRWaWV3ID0gZ2V0UGFyZW50SW5qZWN0b3JWaWV3KHBhcmVudExvY2F0aW9uLCB0aGlzLl9ob3N0Vmlldyk7XG4gICAgICAgIGNvbnN0IHBhcmVudFROb2RlID0gZ2V0UGFyZW50SW5qZWN0b3JUTm9kZShwYXJlbnRMb2NhdGlvbiwgdGhpcy5faG9zdFZpZXcsIHRoaXMuX2hvc3RUTm9kZSk7XG5cbiAgICAgICAgcmV0dXJuICFoYXNQYXJlbnRJbmplY3RvcihwYXJlbnRMb2NhdGlvbikgfHwgcGFyZW50VE5vZGUgPT0gbnVsbCA/XG4gICAgICAgICAgICBuZXcgTm9kZUluamVjdG9yKG51bGwsIHRoaXMuX2hvc3RWaWV3KSA6XG4gICAgICAgICAgICBuZXcgTm9kZUluamVjdG9yKHBhcmVudFROb2RlLCBwYXJlbnRWaWV3KTtcbiAgICAgIH1cblxuICAgICAgY2xlYXIoKTogdm9pZCB7XG4gICAgICAgIHdoaWxlICh0aGlzLl9sQ29udGFpbmVyW1ZJRVdTXS5sZW5ndGgpIHtcbiAgICAgICAgICB0aGlzLnJlbW92ZSgwKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBnZXQoaW5kZXg6IG51bWJlcik6IHZpZXdFbmdpbmVfVmlld1JlZnxudWxsIHsgcmV0dXJuIHRoaXMuX3ZpZXdSZWZzW2luZGV4XSB8fCBudWxsOyB9XG5cbiAgICAgIGdldCBsZW5ndGgoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuX2xDb250YWluZXJbVklFV1NdLmxlbmd0aDsgfVxuXG4gICAgICBjcmVhdGVFbWJlZGRlZFZpZXc8Qz4odGVtcGxhdGVSZWY6IFZpZXdFbmdpbmVfVGVtcGxhdGVSZWY8Qz4sIGNvbnRleHQ/OiBDLCBpbmRleD86IG51bWJlcik6XG4gICAgICAgICAgdmlld0VuZ2luZV9FbWJlZGRlZFZpZXdSZWY8Qz4ge1xuICAgICAgICBjb25zdCBhZGp1c3RlZElkeCA9IHRoaXMuX2FkanVzdEluZGV4KGluZGV4KTtcbiAgICAgICAgY29uc3Qgdmlld1JlZiA9ICh0ZW1wbGF0ZVJlZiBhcyBhbnkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmNyZWF0ZUVtYmVkZGVkVmlldyhjb250ZXh0IHx8IDxhbnk+e30sIHRoaXMuX2xDb250YWluZXIsIGFkanVzdGVkSWR4KTtcbiAgICAgICAgKHZpZXdSZWYgYXMgVmlld1JlZjxhbnk+KS5hdHRhY2hUb1ZpZXdDb250YWluZXJSZWYodGhpcyk7XG4gICAgICAgIHRoaXMuX3ZpZXdSZWZzLnNwbGljZShhZGp1c3RlZElkeCwgMCwgdmlld1JlZik7XG4gICAgICAgIHJldHVybiB2aWV3UmVmO1xuICAgICAgfVxuXG4gICAgICBjcmVhdGVDb21wb25lbnQ8Qz4oXG4gICAgICAgICAgY29tcG9uZW50RmFjdG9yeTogdmlld0VuZ2luZV9Db21wb25lbnRGYWN0b3J5PEM+LCBpbmRleD86IG51bWJlcnx1bmRlZmluZWQsXG4gICAgICAgICAgaW5qZWN0b3I/OiBJbmplY3Rvcnx1bmRlZmluZWQsIHByb2plY3RhYmxlTm9kZXM/OiBhbnlbXVtdfHVuZGVmaW5lZCxcbiAgICAgICAgICBuZ01vZHVsZVJlZj86IHZpZXdFbmdpbmVfTmdNb2R1bGVSZWY8YW55Pnx1bmRlZmluZWQpOiB2aWV3RW5naW5lX0NvbXBvbmVudFJlZjxDPiB7XG4gICAgICAgIGNvbnN0IGNvbnRleHRJbmplY3RvciA9IGluamVjdG9yIHx8IHRoaXMucGFyZW50SW5qZWN0b3I7XG4gICAgICAgIGlmICghbmdNb2R1bGVSZWYgJiYgKGNvbXBvbmVudEZhY3RvcnkgYXMgYW55KS5uZ01vZHVsZSA9PSBudWxsICYmIGNvbnRleHRJbmplY3Rvcikge1xuICAgICAgICAgIG5nTW9kdWxlUmVmID0gY29udGV4dEluamVjdG9yLmdldCh2aWV3RW5naW5lX05nTW9kdWxlUmVmLCBudWxsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNvbXBvbmVudFJlZiA9XG4gICAgICAgICAgICBjb21wb25lbnRGYWN0b3J5LmNyZWF0ZShjb250ZXh0SW5qZWN0b3IsIHByb2plY3RhYmxlTm9kZXMsIHVuZGVmaW5lZCwgbmdNb2R1bGVSZWYpO1xuICAgICAgICB0aGlzLmluc2VydChjb21wb25lbnRSZWYuaG9zdFZpZXcsIGluZGV4KTtcbiAgICAgICAgcmV0dXJuIGNvbXBvbmVudFJlZjtcbiAgICAgIH1cblxuICAgICAgaW5zZXJ0KHZpZXdSZWY6IHZpZXdFbmdpbmVfVmlld1JlZiwgaW5kZXg/OiBudW1iZXIpOiB2aWV3RW5naW5lX1ZpZXdSZWYge1xuICAgICAgICBpZiAodmlld1JlZi5kZXN0cm95ZWQpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBpbnNlcnQgYSBkZXN0cm95ZWQgVmlldyBpbiBhIFZpZXdDb250YWluZXIhJyk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbFZpZXcgPSAodmlld1JlZiBhcyBWaWV3UmVmPGFueT4pLl9sVmlldyAhO1xuICAgICAgICBjb25zdCBhZGp1c3RlZElkeCA9IHRoaXMuX2FkanVzdEluZGV4KGluZGV4KTtcblxuICAgICAgICBpZiAodmlld0F0dGFjaGVkVG9Db250YWluZXIobFZpZXcpKSB7XG4gICAgICAgICAgLy8gSWYgdmlldyBpcyBhbHJlYWR5IGF0dGFjaGVkLCBmYWxsIGJhY2sgdG8gbW92ZSgpIHNvIHdlIGNsZWFuIHVwXG4gICAgICAgICAgLy8gcmVmZXJlbmNlcyBhcHByb3ByaWF0ZWx5LlxuICAgICAgICAgIHJldHVybiB0aGlzLm1vdmUodmlld1JlZiwgYWRqdXN0ZWRJZHgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaW5zZXJ0VmlldyhsVmlldywgdGhpcy5fbENvbnRhaW5lciwgYWRqdXN0ZWRJZHgpO1xuXG4gICAgICAgIGNvbnN0IGJlZm9yZU5vZGUgPVxuICAgICAgICAgICAgZ2V0QmVmb3JlTm9kZUZvclZpZXcoYWRqdXN0ZWRJZHgsIHRoaXMuX2xDb250YWluZXJbVklFV1NdLCB0aGlzLl9sQ29udGFpbmVyW05BVElWRV0pO1xuICAgICAgICBhZGRSZW1vdmVWaWV3RnJvbUNvbnRhaW5lcihsVmlldywgdHJ1ZSwgYmVmb3JlTm9kZSk7XG5cbiAgICAgICAgKHZpZXdSZWYgYXMgVmlld1JlZjxhbnk+KS5hdHRhY2hUb1ZpZXdDb250YWluZXJSZWYodGhpcyk7XG4gICAgICAgIHRoaXMuX3ZpZXdSZWZzLnNwbGljZShhZGp1c3RlZElkeCwgMCwgdmlld1JlZik7XG5cbiAgICAgICAgcmV0dXJuIHZpZXdSZWY7XG4gICAgICB9XG5cbiAgICAgIG1vdmUodmlld1JlZjogdmlld0VuZ2luZV9WaWV3UmVmLCBuZXdJbmRleDogbnVtYmVyKTogdmlld0VuZ2luZV9WaWV3UmVmIHtcbiAgICAgICAgaWYgKHZpZXdSZWYuZGVzdHJveWVkKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgbW92ZSBhIGRlc3Ryb3llZCBWaWV3IGluIGEgVmlld0NvbnRhaW5lciEnKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMuaW5kZXhPZih2aWV3UmVmKTtcbiAgICAgICAgaWYgKGluZGV4ICE9PSAtMSkgdGhpcy5kZXRhY2goaW5kZXgpO1xuICAgICAgICB0aGlzLmluc2VydCh2aWV3UmVmLCBuZXdJbmRleCk7XG4gICAgICAgIHJldHVybiB2aWV3UmVmO1xuICAgICAgfVxuXG4gICAgICBpbmRleE9mKHZpZXdSZWY6IHZpZXdFbmdpbmVfVmlld1JlZik6IG51bWJlciB7IHJldHVybiB0aGlzLl92aWV3UmVmcy5pbmRleE9mKHZpZXdSZWYpOyB9XG5cbiAgICAgIHJlbW92ZShpbmRleD86IG51bWJlcik6IHZvaWQge1xuICAgICAgICBjb25zdCBhZGp1c3RlZElkeCA9IHRoaXMuX2FkanVzdEluZGV4KGluZGV4LCAtMSk7XG4gICAgICAgIHJlbW92ZVZpZXcodGhpcy5fbENvbnRhaW5lciwgYWRqdXN0ZWRJZHgpO1xuICAgICAgICB0aGlzLl92aWV3UmVmcy5zcGxpY2UoYWRqdXN0ZWRJZHgsIDEpO1xuICAgICAgfVxuXG4gICAgICBkZXRhY2goaW5kZXg/OiBudW1iZXIpOiB2aWV3RW5naW5lX1ZpZXdSZWZ8bnVsbCB7XG4gICAgICAgIGNvbnN0IGFkanVzdGVkSWR4ID0gdGhpcy5fYWRqdXN0SW5kZXgoaW5kZXgsIC0xKTtcbiAgICAgICAgY29uc3QgdmlldyA9IGRldGFjaFZpZXcodGhpcy5fbENvbnRhaW5lciwgYWRqdXN0ZWRJZHgpO1xuICAgICAgICBjb25zdCB3YXNEZXRhY2hlZCA9IHRoaXMuX3ZpZXdSZWZzLnNwbGljZShhZGp1c3RlZElkeCwgMSlbMF0gIT0gbnVsbDtcbiAgICAgICAgcmV0dXJuIHdhc0RldGFjaGVkID8gbmV3IFZpZXdSZWYodmlldywgdmlld1tDT05URVhUXSwgLTEpIDogbnVsbDtcbiAgICAgIH1cblxuICAgICAgcHJpdmF0ZSBfYWRqdXN0SW5kZXgoaW5kZXg/OiBudW1iZXIsIHNoaWZ0OiBudW1iZXIgPSAwKSB7XG4gICAgICAgIGlmIChpbmRleCA9PSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuX2xDb250YWluZXJbVklFV1NdLmxlbmd0aCArIHNoaWZ0O1xuICAgICAgICB9XG4gICAgICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgICAgICBhc3NlcnRHcmVhdGVyVGhhbihpbmRleCwgLTEsICdpbmRleCBtdXN0IGJlIHBvc2l0aXZlJyk7XG4gICAgICAgICAgLy8gKzEgYmVjYXVzZSBpdCdzIGxlZ2FsIHRvIGluc2VydCBhdCB0aGUgZW5kLlxuICAgICAgICAgIGFzc2VydExlc3NUaGFuKGluZGV4LCB0aGlzLl9sQ29udGFpbmVyW1ZJRVdTXS5sZW5ndGggKyAxICsgc2hpZnQsICdpbmRleCcpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpbmRleDtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXMoXG4gICAgICAgICAgICAgICAgICAgaG9zdFROb2RlLCBUTm9kZVR5cGUuQ29udGFpbmVyLCBUTm9kZVR5cGUuRWxlbWVudCwgVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpO1xuXG4gIGxldCBsQ29udGFpbmVyOiBMQ29udGFpbmVyO1xuICBjb25zdCBzbG90VmFsdWUgPSBob3N0Vmlld1tob3N0VE5vZGUuaW5kZXhdO1xuICBpZiAoaXNMQ29udGFpbmVyKHNsb3RWYWx1ZSkpIHtcbiAgICAvLyBJZiB0aGUgaG9zdCBpcyBhIGNvbnRhaW5lciwgd2UgZG9uJ3QgbmVlZCB0byBjcmVhdGUgYSBuZXcgTENvbnRhaW5lclxuICAgIGxDb250YWluZXIgPSBzbG90VmFsdWU7XG4gICAgbENvbnRhaW5lcltBQ1RJVkVfSU5ERVhdID0gLTE7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgY29tbWVudE5vZGUgPSBob3N0Vmlld1tSRU5ERVJFUl0uY3JlYXRlQ29tbWVudChuZ0Rldk1vZGUgPyAnY29udGFpbmVyJyA6ICcnKTtcbiAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQ3JlYXRlQ29tbWVudCsrO1xuXG4gICAgLy8gQSBjb250YWluZXIgY2FuIGJlIGNyZWF0ZWQgb24gdGhlIHJvb3QgKHRvcG1vc3QgLyBib290c3RyYXBwZWQpIGNvbXBvbmVudCBhbmQgaW4gdGhpcyBjYXNlIHdlXG4gICAgLy8gY2FuJ3QgdXNlIExUcmVlIHRvIGluc2VydCBjb250YWluZXIncyBtYXJrZXIgbm9kZSAoYm90aCBwYXJlbnQgb2YgYSBjb21tZW50IG5vZGUgYW5kIHRoZVxuICAgIC8vIGNvbW1lbmQgbm9kZSBpdHNlbGYgaXMgbG9jYXRlZCBvdXRzaWRlIG9mIGVsZW1lbnRzIGhvbGQgYnkgTFRyZWUpLiBJbiB0aGlzIHNwZWNpZmljIGNhc2Ugd2VcbiAgICAvLyB1c2UgbG93LWxldmVsIERPTSBtYW5pcHVsYXRpb24gdG8gaW5zZXJ0IGNvbnRhaW5lcidzIG1hcmtlciAoY29tbWVudCkgbm9kZS5cbiAgICBpZiAoaXNSb290Vmlldyhob3N0VmlldykpIHtcbiAgICAgIGNvbnN0IHJlbmRlcmVyID0gaG9zdFZpZXdbUkVOREVSRVJdO1xuICAgICAgY29uc3QgaG9zdE5hdGl2ZSA9IGdldE5hdGl2ZUJ5VE5vZGUoaG9zdFROb2RlLCBob3N0VmlldykgITtcbiAgICAgIGNvbnN0IHBhcmVudE9mSG9zdE5hdGl2ZSA9IG5hdGl2ZVBhcmVudE5vZGUocmVuZGVyZXIsIGhvc3ROYXRpdmUpO1xuICAgICAgbmF0aXZlSW5zZXJ0QmVmb3JlKFxuICAgICAgICAgIHJlbmRlcmVyLCBwYXJlbnRPZkhvc3ROYXRpdmUgISwgY29tbWVudE5vZGUsIG5hdGl2ZU5leHRTaWJsaW5nKHJlbmRlcmVyLCBob3N0TmF0aXZlKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGFwcGVuZENoaWxkKGNvbW1lbnROb2RlLCBob3N0VE5vZGUsIGhvc3RWaWV3KTtcbiAgICB9XG5cbiAgICBob3N0Vmlld1tob3N0VE5vZGUuaW5kZXhdID0gbENvbnRhaW5lciA9XG4gICAgICAgIGNyZWF0ZUxDb250YWluZXIoc2xvdFZhbHVlLCBob3N0VmlldywgY29tbWVudE5vZGUsIGhvc3RUTm9kZSwgdHJ1ZSk7XG5cbiAgICBhZGRUb1ZpZXdUcmVlKGhvc3RWaWV3LCBsQ29udGFpbmVyKTtcbiAgfVxuXG4gIHJldHVybiBuZXcgUjNWaWV3Q29udGFpbmVyUmVmKGxDb250YWluZXIsIGhvc3RUTm9kZSwgaG9zdFZpZXcpO1xufVxuXG5cbi8qKiBSZXR1cm5zIGEgQ2hhbmdlRGV0ZWN0b3JSZWYgKGEuay5hLiBhIFZpZXdSZWYpICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0Q2hhbmdlRGV0ZWN0b3JSZWYoKTogVmlld0VuZ2luZV9DaGFuZ2VEZXRlY3RvclJlZiB7XG4gIHJldHVybiBjcmVhdGVWaWV3UmVmKGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpLCBnZXRMVmlldygpLCBudWxsKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgVmlld1JlZiBhbmQgc3RvcmVzIGl0IG9uIHRoZSBpbmplY3RvciBhcyBDaGFuZ2VEZXRlY3RvclJlZiAocHVibGljIGFsaWFzKS5cbiAqXG4gKiBAcGFyYW0gaG9zdFROb2RlIFRoZSBub2RlIHRoYXQgaXMgcmVxdWVzdGluZyBhIENoYW5nZURldGVjdG9yUmVmXG4gKiBAcGFyYW0gaG9zdFZpZXcgVGhlIHZpZXcgdG8gd2hpY2ggdGhlIG5vZGUgYmVsb25nc1xuICogQHBhcmFtIGNvbnRleHQgVGhlIGNvbnRleHQgZm9yIHRoaXMgY2hhbmdlIGRldGVjdG9yIHJlZlxuICogQHJldHVybnMgVGhlIENoYW5nZURldGVjdG9yUmVmIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVmlld1JlZihcbiAgICBob3N0VE5vZGU6IFROb2RlLCBob3N0VmlldzogTFZpZXcsIGNvbnRleHQ6IGFueSk6IFZpZXdFbmdpbmVfQ2hhbmdlRGV0ZWN0b3JSZWYge1xuICBpZiAoaXNDb21wb25lbnQoaG9zdFROb2RlKSkge1xuICAgIGNvbnN0IGNvbXBvbmVudEluZGV4ID0gaG9zdFROb2RlLmRpcmVjdGl2ZVN0YXJ0O1xuICAgIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBnZXRDb21wb25lbnRWaWV3QnlJbmRleChob3N0VE5vZGUuaW5kZXgsIGhvc3RWaWV3KTtcbiAgICByZXR1cm4gbmV3IFZpZXdSZWYoY29tcG9uZW50VmlldywgY29udGV4dCwgY29tcG9uZW50SW5kZXgpO1xuICB9IGVsc2UgaWYgKFxuICAgICAgaG9zdFROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50IHx8IGhvc3RUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyIHx8XG4gICAgICBob3N0VE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpIHtcbiAgICBjb25zdCBob3N0Q29tcG9uZW50VmlldyA9IGZpbmRDb21wb25lbnRWaWV3KGhvc3RWaWV3KTtcbiAgICByZXR1cm4gbmV3IFZpZXdSZWYoaG9zdENvbXBvbmVudFZpZXcsIGhvc3RDb21wb25lbnRWaWV3W0NPTlRFWFRdLCAtMSk7XG4gIH1cbiAgcmV0dXJuIG51bGwgITtcbn1cblxuZnVuY3Rpb24gZ2V0T3JDcmVhdGVSZW5kZXJlcjIodmlldzogTFZpZXcpOiBSZW5kZXJlcjIge1xuICBjb25zdCByZW5kZXJlciA9IHZpZXdbUkVOREVSRVJdO1xuICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgcmV0dXJuIHJlbmRlcmVyIGFzIFJlbmRlcmVyMjtcbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBpbmplY3QgUmVuZGVyZXIyIHdoZW4gdGhlIGFwcGxpY2F0aW9uIHVzZXMgUmVuZGVyZXIzIScpO1xuICB9XG59XG5cbi8qKiBSZXR1cm5zIGEgUmVuZGVyZXIyIChvciB0aHJvd3Mgd2hlbiBhcHBsaWNhdGlvbiB3YXMgYm9vdHN0cmFwcGVkIHdpdGggUmVuZGVyZXIzKSAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdFJlbmRlcmVyMigpOiBSZW5kZXJlcjIge1xuICByZXR1cm4gZ2V0T3JDcmVhdGVSZW5kZXJlcjIoZ2V0TFZpZXcoKSk7XG59XG4iXX0=