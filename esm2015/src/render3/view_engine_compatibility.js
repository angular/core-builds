/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { NullInjector } from '../di/injector';
import { NgModuleRef as viewEngine_NgModuleRef } from '../linker/ng_module_factory';
import { assertDefined, assertGreaterThan, assertLessThan } from './assert';
import { NodeInjector, getParentInjectorLocation, getParentInjectorView } from './di';
import { _getViewData, addToViewTree, createEmbeddedViewAndNode, createLContainer, createLNodeObject, createTNode, getPreviousOrParentTNode, getRenderer, renderEmbeddedTemplate } from './instructions';
import { RENDER_PARENT, VIEWS } from './interfaces/container';
import { isProceduralRenderer } from './interfaces/renderer';
import { CONTEXT, HOST_NODE, QUERIES, RENDERER, TVIEW } from './interfaces/view';
import { assertNodeOfPossibleTypes, assertNodeType } from './node_assert';
import { addRemoveViewFromContainer, appendChild, detachView, findComponentView, getBeforeNodeForView, getRenderParent, insertView, removeView } from './node_manipulation';
import { getLNode, isComponent } from './util';
import { ViewRef } from './view_ref';
/**
 * Creates an ElementRef from the most recent node.
 *
 * @param {?} ElementRefToken
 * @return {?} The ElementRef instance to use
 */
export function injectElementRef(ElementRefToken) {
    return createElementRef(ElementRefToken, getPreviousOrParentTNode(), _getViewData());
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
    return new R3ElementRef(getLNode(tNode, view).native);
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
    return createTemplateRef(TemplateRefToken, ElementRefToken, getPreviousOrParentTNode(), _getViewData());
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
             * @param {?} _renderer
             * @param {?} _queries
             * @param {?} _injectorIndex
             */
            constructor(_declarationParentView, elementRef, _tView, _renderer, _queries, _injectorIndex) {
                super();
                this._declarationParentView = _declarationParentView;
                this.elementRef = elementRef;
                this._tView = _tView;
                this._renderer = _renderer;
                this._queries = _queries;
                this._injectorIndex = _injectorIndex;
            }
            /**
             * @param {?} context
             * @param {?=} container
             * @param {?=} tContainerNode
             * @param {?=} hostView
             * @param {?=} index
             * @return {?}
             */
            createEmbeddedView(context, container, tContainerNode, hostView, index) {
                /** @type {?} */
                const lView = createEmbeddedViewAndNode(this._tView, context, this._declarationParentView, this._renderer, this._queries, this._injectorIndex);
                if (container) {
                    insertView(lView, container, /** @type {?} */ ((hostView)), /** @type {?} */ ((index)), /** @type {?} */ ((/** @type {?} */ ((tContainerNode)).parent)).index);
                }
                renderEmbeddedTemplate(lView, this._tView, context, 1 /* Create */);
                /** @type {?} */
                const viewRef = new ViewRef(lView, context, -1);
                viewRef._tViewNode = /** @type {?} */ (lView[HOST_NODE]);
                return viewRef;
            }
        };
    }
    /** @type {?} */
    const hostNode = getLNode(hostTNode, hostView);
    ngDevMode && assertNodeType(hostTNode, 0 /* Container */);
    ngDevMode && assertDefined(hostTNode.tViews, 'TView must be allocated');
    return new R3TemplateRef(hostView, createElementRef(ElementRefToken, hostTNode, hostView), /** @type {?} */ (hostTNode.tViews), getRenderer(), /** @type {?} */ ((hostNode.data))[QUERIES], hostTNode.injectorIndex);
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
    const previousTNode = /** @type {?} */ (getPreviousOrParentTNode());
    return createContainerRef(ViewContainerRefToken, ElementRefToken, previousTNode, _getViewData());
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
             * @param {?} _tContainerNode
             * @param {?} _hostTNode
             * @param {?} _hostView
             */
            constructor(_lContainer, _tContainerNode, _hostTNode, _hostView) {
                super();
                this._lContainer = _lContainer;
                this._tContainerNode = _tContainerNode;
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
                const parentIndex = parentLocation & 32767 /* InjectorIndexMask */;
                /** @type {?} */
                const parentTNode = /** @type {?} */ (parentView[TVIEW].data[parentIndex]);
                return parentLocation === -1 ? new NullInjector() :
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
                const viewRef = (/** @type {?} */ (templateRef))
                    .createEmbeddedView(context || /** @type {?} */ ({}), this._lContainer, this._tContainerNode, this._hostView, adjustedIdx);
                (/** @type {?} */ (viewRef)).attachToViewContainerRef(this);
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
                if (!ngModuleRef && contextInjector) {
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
                const lView = /** @type {?} */ (((/** @type {?} */ (viewRef))._view));
                /** @type {?} */
                const adjustedIdx = this._adjustIndex(index);
                insertView(lView, this._lContainer, this._hostView, adjustedIdx, /** @type {?} */ ((this._tContainerNode.parent)).index);
                /** @type {?} */
                const container = /** @type {?} */ ((this._getHostNode().dynamicLContainerNode));
                /** @type {?} */
                const beforeNode = getBeforeNodeForView(adjustedIdx, this._lContainer[VIEWS], container);
                addRemoveViewFromContainer(lView, true, beforeNode);
                (/** @type {?} */ (viewRef)).attachToViewContainerRef(this);
                this._viewRefs.splice(adjustedIdx, 0, viewRef);
                return viewRef;
            }
            /**
             * @param {?} viewRef
             * @param {?} newIndex
             * @return {?}
             */
            move(viewRef, newIndex) {
                /** @type {?} */
                const index = this.indexOf(viewRef);
                this.detach(index);
                this.insert(viewRef, this._adjustIndex(newIndex));
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
                removeView(this._lContainer, /** @type {?} */ (this._tContainerNode), adjustedIdx);
                this._viewRefs.splice(adjustedIdx, 1);
            }
            /**
             * @param {?=} index
             * @return {?}
             */
            detach(index) {
                /** @type {?} */
                const adjustedIdx = this._adjustIndex(index, -1);
                detachView(this._lContainer, adjustedIdx, !!this._tContainerNode.detached);
                return this._viewRefs.splice(adjustedIdx, 1)[0] || null;
            }
            /**
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
            /**
             * @return {?}
             */
            _getHostNode() { return getLNode(this._hostTNode, this._hostView); }
        };
    }
    /** @type {?} */
    const hostLNode = getLNode(hostTNode, hostView);
    ngDevMode && assertNodeOfPossibleTypes(hostTNode, 0 /* Container */, 3 /* Element */, 4 /* ElementContainer */);
    /** @type {?} */
    const lContainer = createLContainer(hostView, true);
    /** @type {?} */
    const comment = hostView[RENDERER].createComment(ngDevMode ? 'container' : '');
    /** @type {?} */
    const lContainerNode = createLNodeObject(0 /* Container */, comment, lContainer);
    lContainer[RENDER_PARENT] = getRenderParent(hostTNode, hostView);
    appendChild(comment, hostTNode, hostView);
    if (!hostTNode.dynamicContainerNode) {
        hostTNode.dynamicContainerNode =
            createTNode(0 /* Container */, -1, null, null, hostTNode, null);
    }
    hostLNode.dynamicLContainerNode = lContainerNode;
    addToViewTree(hostView, /** @type {?} */ (hostTNode.index), lContainer);
    return new R3ViewContainerRef(lContainer, /** @type {?} */ (hostTNode.dynamicContainerNode), hostTNode, hostView);
}
/**
 * Returns a ChangeDetectorRef (a.k.a. a ViewRef)
 * @return {?}
 */
export function injectChangeDetectorRef() {
    return createViewRef(getPreviousOrParentTNode(), _getViewData(), null);
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
        const componentIndex = hostTNode.flags >> 15 /* DirectiveStartingIndexShift */;
        /** @type {?} */
        const componentView = /** @type {?} */ (getLNode(hostTNode, hostView).data);
        return new ViewRef(componentView, context, componentIndex);
    }
    else if (hostTNode.type === 3 /* Element */) {
        /** @type {?} */
        const hostComponentView = findComponentView(hostView);
        return new ViewRef(hostComponentView, hostComponentView[CONTEXT], -1);
    }
    return /** @type {?} */ ((null));
}
/**
 * @param {?} view
 * @return {?}
 */
function getOrCreateRenderer2(view) {
    /** @type {?} */
    const renderer = view[RENDERER];
    if (isProceduralRenderer(renderer)) {
        return /** @type {?} */ (renderer);
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
    return getOrCreateRenderer2(_getViewData());
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld19lbmdpbmVfY29tcGF0aWJpbGl0eS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvdmlld19lbmdpbmVfY29tcGF0aWJpbGl0eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVNBLE9BQU8sRUFBVyxZQUFZLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUd0RCxPQUFPLEVBQUMsV0FBVyxJQUFJLHNCQUFzQixFQUFDLE1BQU0sNkJBQTZCLENBQUM7QUFNbEYsT0FBTyxFQUFDLGFBQWEsRUFBRSxpQkFBaUIsRUFBRSxjQUFjLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDMUUsT0FBTyxFQUFDLFlBQVksRUFBRSx5QkFBeUIsRUFBRSxxQkFBcUIsRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUNwRixPQUFPLEVBQUMsWUFBWSxFQUFFLGFBQWEsRUFBRSx5QkFBeUIsRUFBRSxnQkFBZ0IsRUFBRSxpQkFBaUIsRUFBRSxXQUFXLEVBQUUsd0JBQXdCLEVBQUUsV0FBVyxFQUFFLHNCQUFzQixFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDdk0sT0FBTyxFQUFhLGFBQWEsRUFBRSxLQUFLLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUt4RSxPQUFPLEVBQWdDLG9CQUFvQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDMUYsT0FBTyxFQUFDLE9BQU8sRUFBRSxTQUFTLEVBQWEsT0FBTyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQVEsTUFBTSxtQkFBbUIsQ0FBQztBQUNqRyxPQUFPLEVBQUMseUJBQXlCLEVBQUUsY0FBYyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ3hFLE9BQU8sRUFBQywwQkFBMEIsRUFBRSxXQUFXLEVBQUUsVUFBVSxFQUFFLGlCQUFpQixFQUFFLG9CQUFvQixFQUFFLGVBQWUsRUFBRSxVQUFVLEVBQUUsVUFBVSxFQUFDLE1BQU0scUJBQXFCLENB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SUFDckQsSUFBSSxXQUFXLENBQUMsU0FBUyxDQUFDLEVBQUU7O1FBQzFCLE1BQU0sY0FBYyxHQUFHLFNBQVMsQ0FBQyxLQUFLLHdDQUEwQyxDQUFDOztRQUNqRixNQUFNLGFBQWEscUJBQUcsUUFBUSxDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQyxJQUFpQixFQUFDO1FBQ3RFLE9BQU8sSUFBSSxPQUFPLENBQUMsYUFBYSxFQUFFLE9BQU8sRUFBRSxjQUFjLENBQUMsQ0FBQztLQUM1RDtTQUFNLElBQUksU0FBUyxDQUFDLElBQUksb0JBQXNCLEVBQUU7O1FBQy9DLE1BQU0saUJBQWlCLEdBQUcsaUJBQWlCLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDdEQsT0FBTyxJQUFJLE9BQU8sQ0FBQyxpQkFBaUIsRUFBRSxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ3ZFO0lBQ0QsMEJBQU8sSUFBSSxHQUFHO0NBQ2Y7Ozs7O0FBRUQsU0FBUyxvQkFBb0IsQ0FBQyxJQUFlOztJQUMzQyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDaEMsSUFBSSxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsRUFBRTtRQUNsQyx5QkFBTyxRQUFxQixFQUFDO0tBQzlCO1NBQU07UUFDTCxNQUFNLElBQUksS0FBSyxDQUFDLDhEQUE4RCxDQUFDLENBQUM7S0FDakY7Q0FDRjs7Ozs7QUFHRCxNQUFNLFVBQVUsZUFBZTtJQUM3QixPQUFPLG9CQUFvQixDQUFDLFlBQVksRUFBRSxDQUFDLENBQUM7Q0FDN0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Q2hhbmdlRGV0ZWN0b3JSZWYgYXMgVmlld0VuZ2luZV9DaGFuZ2VEZXRlY3RvclJlZn0gZnJvbSAnLi4vY2hhbmdlX2RldGVjdGlvbi9jaGFuZ2VfZGV0ZWN0b3JfcmVmJztcbmltcG9ydCB7SW5qZWN0b3IsIE51bGxJbmplY3Rvcn0gZnJvbSAnLi4vZGkvaW5qZWN0b3InO1xuaW1wb3J0IHtDb21wb25lbnRGYWN0b3J5IGFzIHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeSwgQ29tcG9uZW50UmVmIGFzIHZpZXdFbmdpbmVfQ29tcG9uZW50UmVmfSBmcm9tICcuLi9saW5rZXIvY29tcG9uZW50X2ZhY3RvcnknO1xuaW1wb3J0IHtFbGVtZW50UmVmIGFzIFZpZXdFbmdpbmVfRWxlbWVudFJlZn0gZnJvbSAnLi4vbGlua2VyL2VsZW1lbnRfcmVmJztcbmltcG9ydCB7TmdNb2R1bGVSZWYgYXMgdmlld0VuZ2luZV9OZ01vZHVsZVJlZn0gZnJvbSAnLi4vbGlua2VyL25nX21vZHVsZV9mYWN0b3J5JztcbmltcG9ydCB7VGVtcGxhdGVSZWYgYXMgVmlld0VuZ2luZV9UZW1wbGF0ZVJlZn0gZnJvbSAnLi4vbGlua2VyL3RlbXBsYXRlX3JlZic7XG5pbXBvcnQge1ZpZXdDb250YWluZXJSZWYgYXMgVmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmfSBmcm9tICcuLi9saW5rZXIvdmlld19jb250YWluZXJfcmVmJztcbmltcG9ydCB7RW1iZWRkZWRWaWV3UmVmIGFzIHZpZXdFbmdpbmVfRW1iZWRkZWRWaWV3UmVmLCBWaWV3UmVmIGFzIHZpZXdFbmdpbmVfVmlld1JlZn0gZnJvbSAnLi4vbGlua2VyL3ZpZXdfcmVmJztcbmltcG9ydCB7UmVuZGVyZXIyfSBmcm9tICcuLi9yZW5kZXIvYXBpJztcblxuaW1wb3J0IHthc3NlcnREZWZpbmVkLCBhc3NlcnRHcmVhdGVyVGhhbiwgYXNzZXJ0TGVzc1RoYW59IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7Tm9kZUluamVjdG9yLCBnZXRQYXJlbnRJbmplY3RvckxvY2F0aW9uLCBnZXRQYXJlbnRJbmplY3RvclZpZXd9IGZyb20gJy4vZGknO1xuaW1wb3J0IHtfZ2V0Vmlld0RhdGEsIGFkZFRvVmlld1RyZWUsIGNyZWF0ZUVtYmVkZGVkVmlld0FuZE5vZGUsIGNyZWF0ZUxDb250YWluZXIsIGNyZWF0ZUxOb2RlT2JqZWN0LCBjcmVhdGVUTm9kZSwgZ2V0UHJldmlvdXNPclBhcmVudFROb2RlLCBnZXRSZW5kZXJlciwgcmVuZGVyRW1iZWRkZWRUZW1wbGF0ZX0gZnJvbSAnLi9pbnN0cnVjdGlvbnMnO1xuaW1wb3J0IHtMQ29udGFpbmVyLCBSRU5ERVJfUEFSRU5ULCBWSUVXU30gZnJvbSAnLi9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge1JlbmRlckZsYWdzfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge0luamVjdG9yTG9jYXRpb25GbGFnc30gZnJvbSAnLi9pbnRlcmZhY2VzL2luamVjdG9yJztcbmltcG9ydCB7TENvbnRhaW5lck5vZGUsIFRDb250YWluZXJOb2RlLCBURWxlbWVudENvbnRhaW5lck5vZGUsIFRFbGVtZW50Tm9kZSwgVE5vZGUsIFROb2RlRmxhZ3MsIFROb2RlVHlwZSwgVFZpZXdOb2RlfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge0xRdWVyaWVzfSBmcm9tICcuL2ludGVyZmFjZXMvcXVlcnknO1xuaW1wb3J0IHtSQ29tbWVudCwgUkVsZW1lbnQsIFJlbmRlcmVyMywgaXNQcm9jZWR1cmFsUmVuZGVyZXJ9IGZyb20gJy4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge0NPTlRFWFQsIEhPU1RfTk9ERSwgTFZpZXdEYXRhLCBRVUVSSUVTLCBSRU5ERVJFUiwgVFZJRVcsIFRWaWV3fSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXMsIGFzc2VydE5vZGVUeXBlfSBmcm9tICcuL25vZGVfYXNzZXJ0JztcbmltcG9ydCB7YWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIsIGFwcGVuZENoaWxkLCBkZXRhY2hWaWV3LCBmaW5kQ29tcG9uZW50VmlldywgZ2V0QmVmb3JlTm9kZUZvclZpZXcsIGdldFJlbmRlclBhcmVudCwgaW5zZXJ0VmlldywgcmVtb3ZlVmlld30gZnJvbSAnLi9ub2RlX21hbmlwdWxhdGlvbic7XG5pbXBvcnQge2dldExOb2RlLCBpc0NvbXBvbmVudH0gZnJvbSAnLi91dGlsJztcbmltcG9ydCB7Vmlld1JlZn0gZnJvbSAnLi92aWV3X3JlZic7XG5cblxuXG4vKipcbiAqIENyZWF0ZXMgYW4gRWxlbWVudFJlZiBmcm9tIHRoZSBtb3N0IHJlY2VudCBub2RlLlxuICpcbiAqIEByZXR1cm5zIFRoZSBFbGVtZW50UmVmIGluc3RhbmNlIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0RWxlbWVudFJlZihFbGVtZW50UmVmVG9rZW46IHR5cGVvZiBWaWV3RW5naW5lX0VsZW1lbnRSZWYpOlxuICAgIFZpZXdFbmdpbmVfRWxlbWVudFJlZiB7XG4gIHJldHVybiBjcmVhdGVFbGVtZW50UmVmKEVsZW1lbnRSZWZUb2tlbiwgZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCksIF9nZXRWaWV3RGF0YSgpKTtcbn1cblxubGV0IFIzRWxlbWVudFJlZjoge25ldyAobmF0aXZlOiBSRWxlbWVudCB8IFJDb21tZW50KTogVmlld0VuZ2luZV9FbGVtZW50UmVmfTtcblxuLyoqXG4gKiBDcmVhdGVzIGFuIEVsZW1lbnRSZWYgZ2l2ZW4gYSBub2RlLlxuICpcbiAqIEBwYXJhbSBFbGVtZW50UmVmVG9rZW4gVGhlIEVsZW1lbnRSZWYgdHlwZVxuICogQHBhcmFtIHROb2RlIFRoZSBub2RlIGZvciB3aGljaCB5b3UnZCBsaWtlIGFuIEVsZW1lbnRSZWZcbiAqIEBwYXJhbSB2aWV3IFRoZSB2aWV3IHRvIHdoaWNoIHRoZSBub2RlIGJlbG9uZ3NcbiAqIEByZXR1cm5zIFRoZSBFbGVtZW50UmVmIGluc3RhbmNlIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRWxlbWVudFJlZihcbiAgICBFbGVtZW50UmVmVG9rZW46IHR5cGVvZiBWaWV3RW5naW5lX0VsZW1lbnRSZWYsIHROb2RlOiBUTm9kZSxcbiAgICB2aWV3OiBMVmlld0RhdGEpOiBWaWV3RW5naW5lX0VsZW1lbnRSZWYge1xuICBpZiAoIVIzRWxlbWVudFJlZikge1xuICAgIC8vIFRPRE86IEZpeCBjbGFzcyBuYW1lLCBzaG91bGQgYmUgRWxlbWVudFJlZiwgYnV0IHRoZXJlIGFwcGVhcnMgdG8gYmUgYSByb2xsdXAgYnVnXG4gICAgUjNFbGVtZW50UmVmID0gY2xhc3MgRWxlbWVudFJlZl8gZXh0ZW5kcyBFbGVtZW50UmVmVG9rZW4ge307XG4gIH1cbiAgcmV0dXJuIG5ldyBSM0VsZW1lbnRSZWYoZ2V0TE5vZGUodE5vZGUsIHZpZXcpLm5hdGl2ZSk7XG59XG5cbmxldCBSM1RlbXBsYXRlUmVmOiB7XG4gIG5ldyAoXG4gICAgICBfZGVjbGFyYXRpb25QYXJlbnRWaWV3OiBMVmlld0RhdGEsIGVsZW1lbnRSZWY6IFZpZXdFbmdpbmVfRWxlbWVudFJlZiwgX3RWaWV3OiBUVmlldyxcbiAgICAgIF9yZW5kZXJlcjogUmVuZGVyZXIzLCBfcXVlcmllczogTFF1ZXJpZXMgfCBudWxsLCBfaW5qZWN0b3JJbmRleDogbnVtYmVyKTpcbiAgICAgIFZpZXdFbmdpbmVfVGVtcGxhdGVSZWY8YW55PlxufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgVGVtcGxhdGVSZWYgZ2l2ZW4gYSBub2RlLlxuICpcbiAqIEByZXR1cm5zIFRoZSBUZW1wbGF0ZVJlZiBpbnN0YW5jZSB0byB1c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdFRlbXBsYXRlUmVmPFQ+KFxuICAgIFRlbXBsYXRlUmVmVG9rZW46IHR5cGVvZiBWaWV3RW5naW5lX1RlbXBsYXRlUmVmLFxuICAgIEVsZW1lbnRSZWZUb2tlbjogdHlwZW9mIFZpZXdFbmdpbmVfRWxlbWVudFJlZik6IFZpZXdFbmdpbmVfVGVtcGxhdGVSZWY8VD4ge1xuICByZXR1cm4gY3JlYXRlVGVtcGxhdGVSZWY8VD4oXG4gICAgICBUZW1wbGF0ZVJlZlRva2VuLCBFbGVtZW50UmVmVG9rZW4sIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpLCBfZ2V0Vmlld0RhdGEoKSk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIFRlbXBsYXRlUmVmIGFuZCBzdG9yZXMgaXQgb24gdGhlIGluamVjdG9yLlxuICpcbiAqIEBwYXJhbSBUZW1wbGF0ZVJlZlRva2VuIFRoZSBUZW1wbGF0ZVJlZiB0eXBlXG4gKiBAcGFyYW0gRWxlbWVudFJlZlRva2VuIFRoZSBFbGVtZW50UmVmIHR5cGVcbiAqIEBwYXJhbSBob3N0VE5vZGUgVGhlIG5vZGUgdGhhdCBpcyByZXF1ZXN0aW5nIGEgVGVtcGxhdGVSZWZcbiAqIEBwYXJhbSBob3N0VmlldyBUaGUgdmlldyB0byB3aGljaCB0aGUgbm9kZSBiZWxvbmdzXG4gKiBAcmV0dXJucyBUaGUgVGVtcGxhdGVSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUZW1wbGF0ZVJlZjxUPihcbiAgICBUZW1wbGF0ZVJlZlRva2VuOiB0eXBlb2YgVmlld0VuZ2luZV9UZW1wbGF0ZVJlZiwgRWxlbWVudFJlZlRva2VuOiB0eXBlb2YgVmlld0VuZ2luZV9FbGVtZW50UmVmLFxuICAgIGhvc3RUTm9kZTogVE5vZGUsIGhvc3RWaWV3OiBMVmlld0RhdGEpOiBWaWV3RW5naW5lX1RlbXBsYXRlUmVmPFQ+IHtcbiAgaWYgKCFSM1RlbXBsYXRlUmVmKSB7XG4gICAgLy8gVE9ETzogRml4IGNsYXNzIG5hbWUsIHNob3VsZCBiZSBUZW1wbGF0ZVJlZiwgYnV0IHRoZXJlIGFwcGVhcnMgdG8gYmUgYSByb2xsdXAgYnVnXG4gICAgUjNUZW1wbGF0ZVJlZiA9IGNsYXNzIFRlbXBsYXRlUmVmXzxUPiBleHRlbmRzIFRlbXBsYXRlUmVmVG9rZW48VD4ge1xuICAgICAgY29uc3RydWN0b3IoXG4gICAgICAgICAgcHJpdmF0ZSBfZGVjbGFyYXRpb25QYXJlbnRWaWV3OiBMVmlld0RhdGEsIHJlYWRvbmx5IGVsZW1lbnRSZWY6IFZpZXdFbmdpbmVfRWxlbWVudFJlZixcbiAgICAgICAgICBwcml2YXRlIF90VmlldzogVFZpZXcsIHByaXZhdGUgX3JlbmRlcmVyOiBSZW5kZXJlcjMsIHByaXZhdGUgX3F1ZXJpZXM6IExRdWVyaWVzfG51bGwsXG4gICAgICAgICAgcHJpdmF0ZSBfaW5qZWN0b3JJbmRleDogbnVtYmVyKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICB9XG5cbiAgICAgIGNyZWF0ZUVtYmVkZGVkVmlldyhcbiAgICAgICAgICBjb250ZXh0OiBULCBjb250YWluZXI/OiBMQ29udGFpbmVyLCB0Q29udGFpbmVyTm9kZT86IFRDb250YWluZXJOb2RlLCBob3N0Vmlldz86IExWaWV3RGF0YSxcbiAgICAgICAgICBpbmRleD86IG51bWJlcik6IHZpZXdFbmdpbmVfRW1iZWRkZWRWaWV3UmVmPFQ+IHtcbiAgICAgICAgY29uc3QgbFZpZXcgPSBjcmVhdGVFbWJlZGRlZFZpZXdBbmROb2RlKFxuICAgICAgICAgICAgdGhpcy5fdFZpZXcsIGNvbnRleHQsIHRoaXMuX2RlY2xhcmF0aW9uUGFyZW50VmlldywgdGhpcy5fcmVuZGVyZXIsIHRoaXMuX3F1ZXJpZXMsXG4gICAgICAgICAgICB0aGlzLl9pbmplY3RvckluZGV4KTtcbiAgICAgICAgaWYgKGNvbnRhaW5lcikge1xuICAgICAgICAgIGluc2VydFZpZXcobFZpZXcsIGNvbnRhaW5lciwgaG9zdFZpZXcgISwgaW5kZXggISwgdENvbnRhaW5lck5vZGUgIS5wYXJlbnQgIS5pbmRleCk7XG4gICAgICAgIH1cbiAgICAgICAgcmVuZGVyRW1iZWRkZWRUZW1wbGF0ZShsVmlldywgdGhpcy5fdFZpZXcsIGNvbnRleHQsIFJlbmRlckZsYWdzLkNyZWF0ZSk7XG4gICAgICAgIGNvbnN0IHZpZXdSZWYgPSBuZXcgVmlld1JlZihsVmlldywgY29udGV4dCwgLTEpO1xuICAgICAgICB2aWV3UmVmLl90Vmlld05vZGUgPSBsVmlld1tIT1NUX05PREVdIGFzIFRWaWV3Tm9kZTtcbiAgICAgICAgcmV0dXJuIHZpZXdSZWY7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG5cbiAgY29uc3QgaG9zdE5vZGUgPSBnZXRMTm9kZShob3N0VE5vZGUsIGhvc3RWaWV3KTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKGhvc3RUTm9kZSwgVE5vZGVUeXBlLkNvbnRhaW5lcik7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGhvc3RUTm9kZS50Vmlld3MsICdUVmlldyBtdXN0IGJlIGFsbG9jYXRlZCcpO1xuICByZXR1cm4gbmV3IFIzVGVtcGxhdGVSZWYoXG4gICAgICBob3N0VmlldywgY3JlYXRlRWxlbWVudFJlZihFbGVtZW50UmVmVG9rZW4sIGhvc3RUTm9kZSwgaG9zdFZpZXcpLCBob3N0VE5vZGUudFZpZXdzIGFzIFRWaWV3LFxuICAgICAgZ2V0UmVuZGVyZXIoKSwgaG9zdE5vZGUuZGF0YSAhW1FVRVJJRVNdLCBob3N0VE5vZGUuaW5qZWN0b3JJbmRleCk7XG59XG5cbmxldCBSM1ZpZXdDb250YWluZXJSZWY6IHtcbiAgbmV3IChcbiAgICAgIGxDb250YWluZXI6IExDb250YWluZXIsIHRDb250YWluZXJOb2RlOiBUQ29udGFpbmVyTm9kZSxcbiAgICAgIGhvc3RUTm9kZTogVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGUsIGhvc3RWaWV3OiBMVmlld0RhdGEpOlxuICAgICAgVmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmXG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBWaWV3Q29udGFpbmVyUmVmIGFuZCBzdG9yZXMgaXQgb24gdGhlIGluamVjdG9yLiBPciwgaWYgdGhlIFZpZXdDb250YWluZXJSZWZcbiAqIGFscmVhZHkgZXhpc3RzLCByZXRyaWV2ZXMgdGhlIGV4aXN0aW5nIFZpZXdDb250YWluZXJSZWYuXG4gKlxuICogQHJldHVybnMgVGhlIFZpZXdDb250YWluZXJSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RWaWV3Q29udGFpbmVyUmVmKFxuICAgIFZpZXdDb250YWluZXJSZWZUb2tlbjogdHlwZW9mIFZpZXdFbmdpbmVfVmlld0NvbnRhaW5lclJlZixcbiAgICBFbGVtZW50UmVmVG9rZW46IHR5cGVvZiBWaWV3RW5naW5lX0VsZW1lbnRSZWYpOiBWaWV3RW5naW5lX1ZpZXdDb250YWluZXJSZWYge1xuICBjb25zdCBwcmV2aW91c1ROb2RlID1cbiAgICAgIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpIGFzIFRFbGVtZW50Tm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSB8IFRDb250YWluZXJOb2RlO1xuICByZXR1cm4gY3JlYXRlQ29udGFpbmVyUmVmKFZpZXdDb250YWluZXJSZWZUb2tlbiwgRWxlbWVudFJlZlRva2VuLCBwcmV2aW91c1ROb2RlLCBfZ2V0Vmlld0RhdGEoKSk7XG59XG5cblxuLyoqXG4gKiBDcmVhdGVzIGEgVmlld0NvbnRhaW5lclJlZiBhbmQgc3RvcmVzIGl0IG9uIHRoZSBpbmplY3Rvci5cbiAqXG4gKiBAcGFyYW0gVmlld0NvbnRhaW5lclJlZlRva2VuIFRoZSBWaWV3Q29udGFpbmVyUmVmIHR5cGVcbiAqIEBwYXJhbSBFbGVtZW50UmVmVG9rZW4gVGhlIEVsZW1lbnRSZWYgdHlwZVxuICogQHBhcmFtIGhvc3RUTm9kZSBUaGUgbm9kZSB0aGF0IGlzIHJlcXVlc3RpbmcgYSBWaWV3Q29udGFpbmVyUmVmXG4gKiBAcGFyYW0gaG9zdFZpZXcgVGhlIHZpZXcgdG8gd2hpY2ggdGhlIG5vZGUgYmVsb25nc1xuICogQHJldHVybnMgVGhlIFZpZXdDb250YWluZXJSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVDb250YWluZXJSZWYoXG4gICAgVmlld0NvbnRhaW5lclJlZlRva2VuOiB0eXBlb2YgVmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmLFxuICAgIEVsZW1lbnRSZWZUb2tlbjogdHlwZW9mIFZpZXdFbmdpbmVfRWxlbWVudFJlZixcbiAgICBob3N0VE5vZGU6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxURWxlbWVudENvbnRhaW5lck5vZGUsXG4gICAgaG9zdFZpZXc6IExWaWV3RGF0YSk6IFZpZXdFbmdpbmVfVmlld0NvbnRhaW5lclJlZiB7XG4gIGlmICghUjNWaWV3Q29udGFpbmVyUmVmKSB7XG4gICAgLy8gVE9ETzogRml4IGNsYXNzIG5hbWUsIHNob3VsZCBiZSBWaWV3Q29udGFpbmVyUmVmLCBidXQgdGhlcmUgYXBwZWFycyB0byBiZSBhIHJvbGx1cCBidWdcbiAgICBSM1ZpZXdDb250YWluZXJSZWYgPSBjbGFzcyBWaWV3Q29udGFpbmVyUmVmXyBleHRlbmRzIFZpZXdDb250YWluZXJSZWZUb2tlbiB7XG4gICAgICBwcml2YXRlIF92aWV3UmVmczogdmlld0VuZ2luZV9WaWV3UmVmW10gPSBbXTtcblxuICAgICAgY29uc3RydWN0b3IoXG4gICAgICAgICAgcHJpdmF0ZSBfbENvbnRhaW5lcjogTENvbnRhaW5lciwgcHJpdmF0ZSBfdENvbnRhaW5lck5vZGU6IFRDb250YWluZXJOb2RlLFxuICAgICAgICAgIHByaXZhdGUgX2hvc3RUTm9kZTogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZSxcbiAgICAgICAgICBwcml2YXRlIF9ob3N0VmlldzogTFZpZXdEYXRhKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICB9XG5cbiAgICAgIGdldCBlbGVtZW50KCk6IFZpZXdFbmdpbmVfRWxlbWVudFJlZiB7XG4gICAgICAgIHJldHVybiBjcmVhdGVFbGVtZW50UmVmKEVsZW1lbnRSZWZUb2tlbiwgdGhpcy5faG9zdFROb2RlLCB0aGlzLl9ob3N0Vmlldyk7XG4gICAgICB9XG5cbiAgICAgIGdldCBpbmplY3RvcigpOiBJbmplY3RvciB7IHJldHVybiBuZXcgTm9kZUluamVjdG9yKHRoaXMuX2hvc3RUTm9kZSwgdGhpcy5faG9zdFZpZXcpOyB9XG5cbiAgICAgIC8qKiBAZGVwcmVjYXRlZCBObyByZXBsYWNlbWVudCAqL1xuICAgICAgZ2V0IHBhcmVudEluamVjdG9yKCk6IEluamVjdG9yIHtcbiAgICAgICAgY29uc3QgcGFyZW50TG9jYXRpb24gPSBnZXRQYXJlbnRJbmplY3RvckxvY2F0aW9uKHRoaXMuX2hvc3RUTm9kZSwgdGhpcy5faG9zdFZpZXcpO1xuICAgICAgICBjb25zdCBwYXJlbnRWaWV3ID0gZ2V0UGFyZW50SW5qZWN0b3JWaWV3KHBhcmVudExvY2F0aW9uLCB0aGlzLl9ob3N0Vmlldyk7XG4gICAgICAgIGNvbnN0IHBhcmVudEluZGV4ID0gcGFyZW50TG9jYXRpb24gJiBJbmplY3RvckxvY2F0aW9uRmxhZ3MuSW5qZWN0b3JJbmRleE1hc2s7XG4gICAgICAgIGNvbnN0IHBhcmVudFROb2RlID0gcGFyZW50Vmlld1tUVklFV10uZGF0YVtwYXJlbnRJbmRleF0gYXMgVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGU7XG5cbiAgICAgICAgcmV0dXJuIHBhcmVudExvY2F0aW9uID09PSAtMSA/IG5ldyBOdWxsSW5qZWN0b3IoKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXcgTm9kZUluamVjdG9yKHBhcmVudFROb2RlLCBwYXJlbnRWaWV3KTtcbiAgICAgIH1cblxuICAgICAgY2xlYXIoKTogdm9pZCB7XG4gICAgICAgIHdoaWxlICh0aGlzLl9sQ29udGFpbmVyW1ZJRVdTXS5sZW5ndGgpIHtcbiAgICAgICAgICB0aGlzLnJlbW92ZSgwKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBnZXQoaW5kZXg6IG51bWJlcik6IHZpZXdFbmdpbmVfVmlld1JlZnxudWxsIHsgcmV0dXJuIHRoaXMuX3ZpZXdSZWZzW2luZGV4XSB8fCBudWxsOyB9XG5cbiAgICAgIGdldCBsZW5ndGgoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuX2xDb250YWluZXJbVklFV1NdLmxlbmd0aDsgfVxuXG4gICAgICBjcmVhdGVFbWJlZGRlZFZpZXc8Qz4odGVtcGxhdGVSZWY6IFZpZXdFbmdpbmVfVGVtcGxhdGVSZWY8Qz4sIGNvbnRleHQ/OiBDLCBpbmRleD86IG51bWJlcik6XG4gICAgICAgICAgdmlld0VuZ2luZV9FbWJlZGRlZFZpZXdSZWY8Qz4ge1xuICAgICAgICBjb25zdCBhZGp1c3RlZElkeCA9IHRoaXMuX2FkanVzdEluZGV4KGluZGV4KTtcbiAgICAgICAgY29uc3Qgdmlld1JlZiA9ICh0ZW1wbGF0ZVJlZiBhcyBhbnkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmNyZWF0ZUVtYmVkZGVkVmlldyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dCB8fCA8YW55Pnt9LCB0aGlzLl9sQ29udGFpbmVyLCB0aGlzLl90Q29udGFpbmVyTm9kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5faG9zdFZpZXcsIGFkanVzdGVkSWR4KTtcbiAgICAgICAgKHZpZXdSZWYgYXMgVmlld1JlZjxhbnk+KS5hdHRhY2hUb1ZpZXdDb250YWluZXJSZWYodGhpcyk7XG4gICAgICAgIHRoaXMuX3ZpZXdSZWZzLnNwbGljZShhZGp1c3RlZElkeCwgMCwgdmlld1JlZik7XG4gICAgICAgIHJldHVybiB2aWV3UmVmO1xuICAgICAgfVxuXG4gICAgICBjcmVhdGVDb21wb25lbnQ8Qz4oXG4gICAgICAgICAgY29tcG9uZW50RmFjdG9yeTogdmlld0VuZ2luZV9Db21wb25lbnRGYWN0b3J5PEM+LCBpbmRleD86IG51bWJlcnx1bmRlZmluZWQsXG4gICAgICAgICAgaW5qZWN0b3I/OiBJbmplY3Rvcnx1bmRlZmluZWQsIHByb2plY3RhYmxlTm9kZXM/OiBhbnlbXVtdfHVuZGVmaW5lZCxcbiAgICAgICAgICBuZ01vZHVsZVJlZj86IHZpZXdFbmdpbmVfTmdNb2R1bGVSZWY8YW55Pnx1bmRlZmluZWQpOiB2aWV3RW5naW5lX0NvbXBvbmVudFJlZjxDPiB7XG4gICAgICAgIGNvbnN0IGNvbnRleHRJbmplY3RvciA9IGluamVjdG9yIHx8IHRoaXMucGFyZW50SW5qZWN0b3I7XG4gICAgICAgIGlmICghbmdNb2R1bGVSZWYgJiYgY29udGV4dEluamVjdG9yKSB7XG4gICAgICAgICAgbmdNb2R1bGVSZWYgPSBjb250ZXh0SW5qZWN0b3IuZ2V0KHZpZXdFbmdpbmVfTmdNb2R1bGVSZWYsIG51bGwpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY29tcG9uZW50UmVmID1cbiAgICAgICAgICAgIGNvbXBvbmVudEZhY3RvcnkuY3JlYXRlKGNvbnRleHRJbmplY3RvciwgcHJvamVjdGFibGVOb2RlcywgdW5kZWZpbmVkLCBuZ01vZHVsZVJlZik7XG4gICAgICAgIHRoaXMuaW5zZXJ0KGNvbXBvbmVudFJlZi5ob3N0VmlldywgaW5kZXgpO1xuICAgICAgICByZXR1cm4gY29tcG9uZW50UmVmO1xuICAgICAgfVxuXG4gICAgICBpbnNlcnQodmlld1JlZjogdmlld0VuZ2luZV9WaWV3UmVmLCBpbmRleD86IG51bWJlcik6IHZpZXdFbmdpbmVfVmlld1JlZiB7XG4gICAgICAgIGlmICh2aWV3UmVmLmRlc3Ryb3llZCkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGluc2VydCBhIGRlc3Ryb3llZCBWaWV3IGluIGEgVmlld0NvbnRhaW5lciEnKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBsVmlldyA9ICh2aWV3UmVmIGFzIFZpZXdSZWY8YW55PikuX3ZpZXcgITtcbiAgICAgICAgY29uc3QgYWRqdXN0ZWRJZHggPSB0aGlzLl9hZGp1c3RJbmRleChpbmRleCk7XG5cbiAgICAgICAgaW5zZXJ0VmlldyhcbiAgICAgICAgICAgIGxWaWV3LCB0aGlzLl9sQ29udGFpbmVyLCB0aGlzLl9ob3N0VmlldywgYWRqdXN0ZWRJZHgsXG4gICAgICAgICAgICB0aGlzLl90Q29udGFpbmVyTm9kZS5wYXJlbnQgIS5pbmRleCk7XG5cbiAgICAgICAgY29uc3QgY29udGFpbmVyID0gdGhpcy5fZ2V0SG9zdE5vZGUoKS5keW5hbWljTENvbnRhaW5lck5vZGUgITtcbiAgICAgICAgY29uc3QgYmVmb3JlTm9kZSA9IGdldEJlZm9yZU5vZGVGb3JWaWV3KGFkanVzdGVkSWR4LCB0aGlzLl9sQ29udGFpbmVyW1ZJRVdTXSwgY29udGFpbmVyKTtcbiAgICAgICAgYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIobFZpZXcsIHRydWUsIGJlZm9yZU5vZGUpO1xuXG4gICAgICAgICh2aWV3UmVmIGFzIFZpZXdSZWY8YW55PikuYXR0YWNoVG9WaWV3Q29udGFpbmVyUmVmKHRoaXMpO1xuICAgICAgICB0aGlzLl92aWV3UmVmcy5zcGxpY2UoYWRqdXN0ZWRJZHgsIDAsIHZpZXdSZWYpO1xuXG4gICAgICAgIHJldHVybiB2aWV3UmVmO1xuICAgICAgfVxuXG4gICAgICBtb3ZlKHZpZXdSZWY6IHZpZXdFbmdpbmVfVmlld1JlZiwgbmV3SW5kZXg6IG51bWJlcik6IHZpZXdFbmdpbmVfVmlld1JlZiB7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5pbmRleE9mKHZpZXdSZWYpO1xuICAgICAgICB0aGlzLmRldGFjaChpbmRleCk7XG4gICAgICAgIHRoaXMuaW5zZXJ0KHZpZXdSZWYsIHRoaXMuX2FkanVzdEluZGV4KG5ld0luZGV4KSk7XG4gICAgICAgIHJldHVybiB2aWV3UmVmO1xuICAgICAgfVxuXG4gICAgICBpbmRleE9mKHZpZXdSZWY6IHZpZXdFbmdpbmVfVmlld1JlZik6IG51bWJlciB7IHJldHVybiB0aGlzLl92aWV3UmVmcy5pbmRleE9mKHZpZXdSZWYpOyB9XG5cbiAgICAgIHJlbW92ZShpbmRleD86IG51bWJlcik6IHZvaWQge1xuICAgICAgICBjb25zdCBhZGp1c3RlZElkeCA9IHRoaXMuX2FkanVzdEluZGV4KGluZGV4LCAtMSk7XG4gICAgICAgIHJlbW92ZVZpZXcodGhpcy5fbENvbnRhaW5lciwgdGhpcy5fdENvbnRhaW5lck5vZGUgYXMgVENvbnRhaW5lck5vZGUsIGFkanVzdGVkSWR4KTtcbiAgICAgICAgdGhpcy5fdmlld1JlZnMuc3BsaWNlKGFkanVzdGVkSWR4LCAxKTtcbiAgICAgIH1cblxuICAgICAgZGV0YWNoKGluZGV4PzogbnVtYmVyKTogdmlld0VuZ2luZV9WaWV3UmVmfG51bGwge1xuICAgICAgICBjb25zdCBhZGp1c3RlZElkeCA9IHRoaXMuX2FkanVzdEluZGV4KGluZGV4LCAtMSk7XG4gICAgICAgIGRldGFjaFZpZXcodGhpcy5fbENvbnRhaW5lciwgYWRqdXN0ZWRJZHgsICEhdGhpcy5fdENvbnRhaW5lck5vZGUuZGV0YWNoZWQpO1xuICAgICAgICByZXR1cm4gdGhpcy5fdmlld1JlZnMuc3BsaWNlKGFkanVzdGVkSWR4LCAxKVswXSB8fCBudWxsO1xuICAgICAgfVxuXG4gICAgICBwcml2YXRlIF9hZGp1c3RJbmRleChpbmRleD86IG51bWJlciwgc2hpZnQ6IG51bWJlciA9IDApIHtcbiAgICAgICAgaWYgKGluZGV4ID09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5fbENvbnRhaW5lcltWSUVXU10ubGVuZ3RoICsgc2hpZnQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgICAgIGFzc2VydEdyZWF0ZXJUaGFuKGluZGV4LCAtMSwgJ2luZGV4IG11c3QgYmUgcG9zaXRpdmUnKTtcbiAgICAgICAgICAvLyArMSBiZWNhdXNlIGl0J3MgbGVnYWwgdG8gaW5zZXJ0IGF0IHRoZSBlbmQuXG4gICAgICAgICAgYXNzZXJ0TGVzc1RoYW4oaW5kZXgsIHRoaXMuX2xDb250YWluZXJbVklFV1NdLmxlbmd0aCArIDEgKyBzaGlmdCwgJ2luZGV4Jyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGluZGV4O1xuICAgICAgfVxuXG4gICAgICBwcml2YXRlIF9nZXRIb3N0Tm9kZSgpIHsgcmV0dXJuIGdldExOb2RlKHRoaXMuX2hvc3RUTm9kZSwgdGhpcy5faG9zdFZpZXcpOyB9XG4gICAgfTtcbiAgfVxuXG4gIGNvbnN0IGhvc3RMTm9kZSA9IGdldExOb2RlKGhvc3RUTm9kZSwgaG9zdFZpZXcpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlcyhcbiAgICAgICAgICAgICAgICAgICBob3N0VE5vZGUsIFROb2RlVHlwZS5Db250YWluZXIsIFROb2RlVHlwZS5FbGVtZW50LCBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcik7XG5cbiAgY29uc3QgbENvbnRhaW5lciA9IGNyZWF0ZUxDb250YWluZXIoaG9zdFZpZXcsIHRydWUpO1xuICBjb25zdCBjb21tZW50ID0gaG9zdFZpZXdbUkVOREVSRVJdLmNyZWF0ZUNvbW1lbnQobmdEZXZNb2RlID8gJ2NvbnRhaW5lcicgOiAnJyk7XG4gIGNvbnN0IGxDb250YWluZXJOb2RlOiBMQ29udGFpbmVyTm9kZSA9XG4gICAgICBjcmVhdGVMTm9kZU9iamVjdChUTm9kZVR5cGUuQ29udGFpbmVyLCBjb21tZW50LCBsQ29udGFpbmVyKTtcblxuICBsQ29udGFpbmVyW1JFTkRFUl9QQVJFTlRdID0gZ2V0UmVuZGVyUGFyZW50KGhvc3RUTm9kZSwgaG9zdFZpZXcpO1xuXG4gIGFwcGVuZENoaWxkKGNvbW1lbnQsIGhvc3RUTm9kZSwgaG9zdFZpZXcpO1xuXG4gIGlmICghaG9zdFROb2RlLmR5bmFtaWNDb250YWluZXJOb2RlKSB7XG4gICAgaG9zdFROb2RlLmR5bmFtaWNDb250YWluZXJOb2RlID1cbiAgICAgICAgY3JlYXRlVE5vZGUoVE5vZGVUeXBlLkNvbnRhaW5lciwgLTEsIG51bGwsIG51bGwsIGhvc3RUTm9kZSwgbnVsbCk7XG4gIH1cblxuICBob3N0TE5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlID0gbENvbnRhaW5lck5vZGU7XG4gIGFkZFRvVmlld1RyZWUoaG9zdFZpZXcsIGhvc3RUTm9kZS5pbmRleCBhcyBudW1iZXIsIGxDb250YWluZXIpO1xuXG4gIHJldHVybiBuZXcgUjNWaWV3Q29udGFpbmVyUmVmKFxuICAgICAgbENvbnRhaW5lciwgaG9zdFROb2RlLmR5bmFtaWNDb250YWluZXJOb2RlIGFzIFRDb250YWluZXJOb2RlLCBob3N0VE5vZGUsIGhvc3RWaWV3KTtcbn1cblxuXG4vKiogUmV0dXJucyBhIENoYW5nZURldGVjdG9yUmVmIChhLmsuYS4gYSBWaWV3UmVmKSAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdENoYW5nZURldGVjdG9yUmVmKCk6IFZpZXdFbmdpbmVfQ2hhbmdlRGV0ZWN0b3JSZWYge1xuICByZXR1cm4gY3JlYXRlVmlld1JlZihnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKSwgX2dldFZpZXdEYXRhKCksIG51bGwpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBWaWV3UmVmIGFuZCBzdG9yZXMgaXQgb24gdGhlIGluamVjdG9yIGFzIENoYW5nZURldGVjdG9yUmVmIChwdWJsaWMgYWxpYXMpLlxuICpcbiAqIEBwYXJhbSBob3N0VE5vZGUgVGhlIG5vZGUgdGhhdCBpcyByZXF1ZXN0aW5nIGEgQ2hhbmdlRGV0ZWN0b3JSZWZcbiAqIEBwYXJhbSBob3N0VmlldyBUaGUgdmlldyB0byB3aGljaCB0aGUgbm9kZSBiZWxvbmdzXG4gKiBAcGFyYW0gY29udGV4dCBUaGUgY29udGV4dCBmb3IgdGhpcyBjaGFuZ2UgZGV0ZWN0b3IgcmVmXG4gKiBAcmV0dXJucyBUaGUgQ2hhbmdlRGV0ZWN0b3JSZWYgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVWaWV3UmVmKFxuICAgIGhvc3RUTm9kZTogVE5vZGUsIGhvc3RWaWV3OiBMVmlld0RhdGEsIGNvbnRleHQ6IGFueSk6IFZpZXdFbmdpbmVfQ2hhbmdlRGV0ZWN0b3JSZWYge1xuICBpZiAoaXNDb21wb25lbnQoaG9zdFROb2RlKSkge1xuICAgIGNvbnN0IGNvbXBvbmVudEluZGV4ID0gaG9zdFROb2RlLmZsYWdzID4+IFROb2RlRmxhZ3MuRGlyZWN0aXZlU3RhcnRpbmdJbmRleFNoaWZ0O1xuICAgIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBnZXRMTm9kZShob3N0VE5vZGUsIGhvc3RWaWV3KS5kYXRhIGFzIExWaWV3RGF0YTtcbiAgICByZXR1cm4gbmV3IFZpZXdSZWYoY29tcG9uZW50VmlldywgY29udGV4dCwgY29tcG9uZW50SW5kZXgpO1xuICB9IGVsc2UgaWYgKGhvc3RUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCkge1xuICAgIGNvbnN0IGhvc3RDb21wb25lbnRWaWV3ID0gZmluZENvbXBvbmVudFZpZXcoaG9zdFZpZXcpO1xuICAgIHJldHVybiBuZXcgVmlld1JlZihob3N0Q29tcG9uZW50VmlldywgaG9zdENvbXBvbmVudFZpZXdbQ09OVEVYVF0sIC0xKTtcbiAgfVxuICByZXR1cm4gbnVsbCAhO1xufVxuXG5mdW5jdGlvbiBnZXRPckNyZWF0ZVJlbmRlcmVyMih2aWV3OiBMVmlld0RhdGEpOiBSZW5kZXJlcjIge1xuICBjb25zdCByZW5kZXJlciA9IHZpZXdbUkVOREVSRVJdO1xuICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgcmV0dXJuIHJlbmRlcmVyIGFzIFJlbmRlcmVyMjtcbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBpbmplY3QgUmVuZGVyZXIyIHdoZW4gdGhlIGFwcGxpY2F0aW9uIHVzZXMgUmVuZGVyZXIzIScpO1xuICB9XG59XG5cbi8qKiBSZXR1cm5zIGEgUmVuZGVyZXIyIChvciB0aHJvd3Mgd2hlbiBhcHBsaWNhdGlvbiB3YXMgYm9vdHN0cmFwcGVkIHdpdGggUmVuZGVyZXIzKSAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdFJlbmRlcmVyMigpOiBSZW5kZXJlcjIge1xuICByZXR1cm4gZ2V0T3JDcmVhdGVSZW5kZXJlcjIoX2dldFZpZXdEYXRhKCkpO1xufSJdfQ==