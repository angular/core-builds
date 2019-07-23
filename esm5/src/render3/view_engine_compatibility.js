/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { NgModuleRef as viewEngine_NgModuleRef } from '../linker/ng_module_factory';
import { addToArray, removeFromArray } from '../util/array_utils';
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
 * @returns The ElementRef instance to use
 */
export function injectElementRef(ElementRefToken) {
    return createElementRef(ElementRefToken, getPreviousOrParentTNode(), getLView());
}
var R3ElementRef;
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
        // TODO: Fix class name, should be ElementRef, but there appears to be a rollup bug
        R3ElementRef = /** @class */ (function (_super) {
            tslib_1.__extends(ElementRef_, _super);
            function ElementRef_() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            return ElementRef_;
        }(ElementRefToken));
    }
    return new R3ElementRef(getNativeByTNode(tNode, view));
}
var R3TemplateRef;
/**
 * Creates a TemplateRef given a node.
 *
 * @returns The TemplateRef instance to use
 */
export function injectTemplateRef(TemplateRefToken, ElementRefToken) {
    return createTemplateRef(TemplateRefToken, ElementRefToken, getPreviousOrParentTNode(), getLView());
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
        // TODO: Fix class name, should be TemplateRef, but there appears to be a rollup bug
        R3TemplateRef = /** @class */ (function (_super) {
            tslib_1.__extends(TemplateRef_, _super);
            function TemplateRef_(_declarationView, _declarationTContainer, elementRef) {
                var _this = _super.call(this) || this;
                _this._declarationView = _declarationView;
                _this._declarationTContainer = _declarationTContainer;
                _this.elementRef = elementRef;
                return _this;
            }
            TemplateRef_.prototype.createEmbeddedView = function (context) {
                var embeddedTView = this._declarationTContainer.tViews;
                var lView = createEmbeddedViewAndNode(embeddedTView, context, this._declarationView, this._declarationTContainer.injectorIndex);
                var declarationLContainer = this._declarationView[this._declarationTContainer.index];
                ngDevMode && assertLContainer(declarationLContainer);
                lView[DECLARATION_LCONTAINER] = declarationLContainer;
                var declarationViewLQueries = this._declarationView[QUERIES];
                if (declarationViewLQueries !== null) {
                    lView[QUERIES] = declarationViewLQueries.createEmbeddedView(embeddedTView);
                }
                renderEmbeddedTemplate(lView, embeddedTView, context);
                var viewRef = new ViewRef(lView, context, -1);
                viewRef._tViewNode = lView[T_HOST];
                return viewRef;
            };
            return TemplateRef_;
        }(TemplateRefToken));
    }
    if (hostTNode.type === 0 /* Container */) {
        ngDevMode && assertDefined(hostTNode.tViews, 'TView must be allocated');
        return new R3TemplateRef(hostView, hostTNode, createElementRef(ElementRefToken, hostTNode, hostView));
    }
    else {
        return null;
    }
}
var R3ViewContainerRef;
/**
 * Creates a ViewContainerRef and stores it on the injector. Or, if the ViewContainerRef
 * already exists, retrieves the existing ViewContainerRef.
 *
 * @returns The ViewContainerRef instance to use
 */
export function injectViewContainerRef(ViewContainerRefToken, ElementRefToken) {
    var previousTNode = getPreviousOrParentTNode();
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
        // TODO: Fix class name, should be ViewContainerRef, but there appears to be a rollup bug
        R3ViewContainerRef = /** @class */ (function (_super) {
            tslib_1.__extends(ViewContainerRef_, _super);
            function ViewContainerRef_(_lContainer, _hostTNode, _hostView) {
                var _this = _super.call(this) || this;
                _this._lContainer = _lContainer;
                _this._hostTNode = _hostTNode;
                _this._hostView = _hostView;
                return _this;
            }
            Object.defineProperty(ViewContainerRef_.prototype, "element", {
                get: function () {
                    return createElementRef(ElementRefToken, this._hostTNode, this._hostView);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ViewContainerRef_.prototype, "injector", {
                get: function () { return new NodeInjector(this._hostTNode, this._hostView); },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ViewContainerRef_.prototype, "parentInjector", {
                /** @deprecated No replacement */
                get: function () {
                    var parentLocation = getParentInjectorLocation(this._hostTNode, this._hostView);
                    var parentView = getParentInjectorView(parentLocation, this._hostView);
                    var parentTNode = getParentInjectorTNode(parentLocation, this._hostView, this._hostTNode);
                    return !hasParentInjector(parentLocation) || parentTNode == null ?
                        new NodeInjector(null, this._hostView) :
                        new NodeInjector(parentTNode, parentView);
                },
                enumerable: true,
                configurable: true
            });
            ViewContainerRef_.prototype.clear = function () {
                while (this.length > 0) {
                    this.remove(this.length - 1);
                }
            };
            ViewContainerRef_.prototype.get = function (index) {
                return this._lContainer[VIEW_REFS] !== null && this._lContainer[VIEW_REFS][index] || null;
            };
            Object.defineProperty(ViewContainerRef_.prototype, "length", {
                get: function () {
                    // Note that if there are no views, the container
                    // length will be smaller than the header offset.
                    var viewAmount = this._lContainer.length - CONTAINER_HEADER_OFFSET;
                    return viewAmount > 0 ? viewAmount : 0;
                },
                enumerable: true,
                configurable: true
            });
            ViewContainerRef_.prototype.createEmbeddedView = function (templateRef, context, index) {
                var viewRef = templateRef.createEmbeddedView(context || {});
                this.insert(viewRef, index);
                return viewRef;
            };
            ViewContainerRef_.prototype.createComponent = function (componentFactory, index, injector, projectableNodes, ngModuleRef) {
                var contextInjector = injector || this.parentInjector;
                if (!ngModuleRef && componentFactory.ngModule == null && contextInjector) {
                    ngModuleRef = contextInjector.get(viewEngine_NgModuleRef, null);
                }
                var componentRef = componentFactory.create(contextInjector, projectableNodes, undefined, ngModuleRef);
                this.insert(componentRef.hostView, index);
                return componentRef;
            };
            ViewContainerRef_.prototype.insert = function (viewRef, index) {
                if (viewRef.destroyed) {
                    throw new Error('Cannot insert a destroyed View in a ViewContainer!');
                }
                this.allocateContainerIfNeeded();
                var lView = viewRef._lView;
                var adjustedIdx = this._adjustIndex(index);
                if (viewAttachedToContainer(lView)) {
                    // If view is already attached, fall back to move() so we clean up
                    // references appropriately.
                    return this.move(viewRef, adjustedIdx);
                }
                insertView(lView, this._lContainer, adjustedIdx);
                var beforeNode = getBeforeNodeForView(adjustedIdx, this._lContainer);
                addRemoveViewFromContainer(lView, true, beforeNode);
                viewRef.attachToViewContainerRef(this);
                addToArray(this._lContainer[VIEW_REFS], adjustedIdx, viewRef);
                return viewRef;
            };
            ViewContainerRef_.prototype.move = function (viewRef, newIndex) {
                if (viewRef.destroyed) {
                    throw new Error('Cannot move a destroyed View in a ViewContainer!');
                }
                var index = this.indexOf(viewRef);
                if (index !== -1)
                    this.detach(index);
                this.insert(viewRef, newIndex);
                return viewRef;
            };
            ViewContainerRef_.prototype.indexOf = function (viewRef) {
                return this._lContainer[VIEW_REFS] !== null ?
                    this._lContainer[VIEW_REFS].indexOf(viewRef) :
                    0;
            };
            ViewContainerRef_.prototype.remove = function (index) {
                this.allocateContainerIfNeeded();
                var adjustedIdx = this._adjustIndex(index, -1);
                removeView(this._lContainer, adjustedIdx);
                removeFromArray(this._lContainer[VIEW_REFS], adjustedIdx);
            };
            ViewContainerRef_.prototype.detach = function (index) {
                this.allocateContainerIfNeeded();
                var adjustedIdx = this._adjustIndex(index, -1);
                var view = detachView(this._lContainer, adjustedIdx);
                var wasDetached = view && removeFromArray(this._lContainer[VIEW_REFS], adjustedIdx) != null;
                return wasDetached ? new ViewRef(view, view[CONTEXT], -1) : null;
            };
            ViewContainerRef_.prototype._adjustIndex = function (index, shift) {
                if (shift === void 0) { shift = 0; }
                if (index == null) {
                    return this.length + shift;
                }
                if (ngDevMode) {
                    assertGreaterThan(index, -1, 'index must be positive');
                    // +1 because it's legal to insert at the end.
                    assertLessThan(index, this.length + 1 + shift, 'index');
                }
                return index;
            };
            ViewContainerRef_.prototype.allocateContainerIfNeeded = function () {
                if (this._lContainer[VIEW_REFS] === null) {
                    this._lContainer[VIEW_REFS] = [];
                }
            };
            return ViewContainerRef_;
        }(ViewContainerRefToken));
    }
    ngDevMode && assertNodeOfPossibleTypes(hostTNode, 0 /* Container */, 3 /* Element */, 4 /* ElementContainer */);
    var lContainer;
    var slotValue = hostView[hostTNode.index];
    if (isLContainer(slotValue)) {
        // If the host is a container, we don't need to create a new LContainer
        lContainer = slotValue;
        lContainer[ACTIVE_INDEX] = -1;
    }
    else {
        var commentNode = void 0;
        // If the host is an element container, the native host element is guaranteed to be a
        // comment and we can reuse that comment as anchor element for the new LContainer.
        if (hostTNode.type === 4 /* ElementContainer */) {
            commentNode = unwrapRNode(slotValue);
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
            var renderer = hostView[RENDERER];
            var hostNative = getNativeByTNode(hostTNode, hostView);
            var parentOfHostNative = nativeParentNode(renderer, hostNative);
            nativeInsertBefore(renderer, parentOfHostNative, commentNode, nativeNextSibling(renderer, hostNative));
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
/** Returns a ChangeDetectorRef (a.k.a. a ViewRef) */
export function injectChangeDetectorRef() {
    return createViewRef(getPreviousOrParentTNode(), getLView(), null);
}
/**
 * Creates a ViewRef and stores it on the injector as ChangeDetectorRef (public alias).
 *
 * @param hostTNode The node that is requesting a ChangeDetectorRef
 * @param hostView The view to which the node belongs
 * @param context The context for this change detector ref
 * @returns The ChangeDetectorRef to use
 */
export function createViewRef(hostTNode, hostView, context) {
    if (isComponent(hostTNode)) {
        var componentIndex = hostTNode.directiveStart;
        var componentView = getComponentViewByIndex(hostTNode.index, hostView);
        return new ViewRef(componentView, context, componentIndex);
    }
    else if (hostTNode.type === 3 /* Element */ || hostTNode.type === 0 /* Container */ ||
        hostTNode.type === 4 /* ElementContainer */) {
        var hostComponentView = findComponentView(hostView);
        return new ViewRef(hostComponentView, hostComponentView[CONTEXT], -1);
    }
    return null;
}
/** Returns a Renderer2 (or throws when application was bootstrapped with Renderer3) */
function getOrCreateRenderer2(view) {
    var renderer = view[RENDERER];
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
    var lView = getLView();
    var tNode = getPreviousOrParentTNode();
    var nodeAtIndex = getComponentViewByIndex(tNode.index, lView);
    return getOrCreateRenderer2(isLView(nodeAtIndex) ? nodeAtIndex : lView);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld19lbmdpbmVfY29tcGF0aWJpbGl0eS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvdmlld19lbmdpbmVfY29tcGF0aWJpbGl0eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBTUgsT0FBTyxFQUFDLFdBQVcsSUFBSSxzQkFBc0IsRUFBQyxNQUFNLDZCQUE2QixDQUFDO0FBS2xGLE9BQU8sRUFBQyxVQUFVLEVBQUUsZUFBZSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDaEUsT0FBTyxFQUFDLGFBQWEsRUFBRSxpQkFBaUIsRUFBRSxjQUFjLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUNoRixPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDMUMsT0FBTyxFQUFDLFlBQVksRUFBRSx5QkFBeUIsRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUM3RCxPQUFPLEVBQUMsYUFBYSxFQUFFLHlCQUF5QixFQUFFLGdCQUFnQixFQUFFLHNCQUFzQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDekgsT0FBTyxFQUFDLFlBQVksRUFBRSx1QkFBdUIsRUFBYyxTQUFTLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUVwRyxPQUFPLEVBQXFCLG9CQUFvQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFFL0UsT0FBTyxFQUFDLFdBQVcsRUFBRSxZQUFZLEVBQUUsT0FBTyxFQUFFLFVBQVUsRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBQ3hGLE9BQU8sRUFBQyxPQUFPLEVBQUUsc0JBQXNCLEVBQVMsT0FBTyxFQUFFLFFBQVEsRUFBUyxNQUFNLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUUzRyxPQUFPLEVBQUMseUJBQXlCLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDeEQsT0FBTyxFQUFDLDBCQUEwQixFQUFFLFdBQVcsRUFB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QUFRLENBQUMsQ0FBQztRQUN0RCxPQUFPLElBQUksT0FBTyxDQUFDLGlCQUFpQixFQUFFLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDdkU7SUFDRCxPQUFPLElBQU0sQ0FBQztBQUNoQixDQUFDO0FBRUQsdUZBQXVGO0FBQ3ZGLFNBQVMsb0JBQW9CLENBQUMsSUFBVztJQUN2QyxJQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDaEMsSUFBSSxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsRUFBRTtRQUNsQyxPQUFPLFFBQXFCLENBQUM7S0FDOUI7U0FBTTtRQUNMLE1BQU0sSUFBSSxLQUFLLENBQUMsOERBQThELENBQUMsQ0FBQztLQUNqRjtBQUNILENBQUM7QUFFRCxxREFBcUQ7QUFDckQsTUFBTSxVQUFVLGVBQWU7SUFDN0IsaUdBQWlHO0lBQ2pHLDRGQUE0RjtJQUM1RixJQUFNLEtBQUssR0FBRyxRQUFRLEVBQUUsQ0FBQztJQUN6QixJQUFNLEtBQUssR0FBRyx3QkFBd0IsRUFBRSxDQUFDO0lBQ3pDLElBQU0sV0FBVyxHQUFHLHVCQUF1QixDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDaEUsT0FBTyxvQkFBb0IsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDMUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtDaGFuZ2VEZXRlY3RvclJlZiBhcyBWaWV3RW5naW5lX0NoYW5nZURldGVjdG9yUmVmfSBmcm9tICcuLi9jaGFuZ2VfZGV0ZWN0aW9uL2NoYW5nZV9kZXRlY3Rvcl9yZWYnO1xuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi4vZGkvaW5qZWN0b3InO1xuaW1wb3J0IHtDb21wb25lbnRGYWN0b3J5IGFzIHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeSwgQ29tcG9uZW50UmVmIGFzIHZpZXdFbmdpbmVfQ29tcG9uZW50UmVmfSBmcm9tICcuLi9saW5rZXIvY29tcG9uZW50X2ZhY3RvcnknO1xuaW1wb3J0IHtFbGVtZW50UmVmIGFzIFZpZXdFbmdpbmVfRWxlbWVudFJlZn0gZnJvbSAnLi4vbGlua2VyL2VsZW1lbnRfcmVmJztcbmltcG9ydCB7TmdNb2R1bGVSZWYgYXMgdmlld0VuZ2luZV9OZ01vZHVsZVJlZn0gZnJvbSAnLi4vbGlua2VyL25nX21vZHVsZV9mYWN0b3J5JztcbmltcG9ydCB7VGVtcGxhdGVSZWYgYXMgVmlld0VuZ2luZV9UZW1wbGF0ZVJlZn0gZnJvbSAnLi4vbGlua2VyL3RlbXBsYXRlX3JlZic7XG5pbXBvcnQge1ZpZXdDb250YWluZXJSZWYgYXMgVmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmfSBmcm9tICcuLi9saW5rZXIvdmlld19jb250YWluZXJfcmVmJztcbmltcG9ydCB7RW1iZWRkZWRWaWV3UmVmIGFzIHZpZXdFbmdpbmVfRW1iZWRkZWRWaWV3UmVmLCBWaWV3UmVmIGFzIHZpZXdFbmdpbmVfVmlld1JlZn0gZnJvbSAnLi4vbGlua2VyL3ZpZXdfcmVmJztcbmltcG9ydCB7UmVuZGVyZXIyfSBmcm9tICcuLi9yZW5kZXIvYXBpJztcbmltcG9ydCB7YWRkVG9BcnJheSwgcmVtb3ZlRnJvbUFycmF5fSBmcm9tICcuLi91dGlsL2FycmF5X3V0aWxzJztcbmltcG9ydCB7YXNzZXJ0RGVmaW5lZCwgYXNzZXJ0R3JlYXRlclRoYW4sIGFzc2VydExlc3NUaGFufSBmcm9tICcuLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge2Fzc2VydExDb250YWluZXJ9IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7Tm9kZUluamVjdG9yLCBnZXRQYXJlbnRJbmplY3RvckxvY2F0aW9ufSBmcm9tICcuL2RpJztcbmltcG9ydCB7YWRkVG9WaWV3VHJlZSwgY3JlYXRlRW1iZWRkZWRWaWV3QW5kTm9kZSwgY3JlYXRlTENvbnRhaW5lciwgcmVuZGVyRW1iZWRkZWRUZW1wbGF0ZX0gZnJvbSAnLi9pbnN0cnVjdGlvbnMvc2hhcmVkJztcbmltcG9ydCB7QUNUSVZFX0lOREVYLCBDT05UQUlORVJfSEVBREVSX09GRlNFVCwgTENvbnRhaW5lciwgVklFV19SRUZTfSBmcm9tICcuL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7VENvbnRhaW5lck5vZGUsIFRFbGVtZW50Q29udGFpbmVyTm9kZSwgVEVsZW1lbnROb2RlLCBUTm9kZSwgVE5vZGVUeXBlLCBUVmlld05vZGV9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7UkNvbW1lbnQsIFJFbGVtZW50LCBpc1Byb2NlZHVyYWxSZW5kZXJlcn0gZnJvbSAnLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcblxuaW1wb3J0IHtpc0NvbXBvbmVudCwgaXNMQ29udGFpbmVyLCBpc0xWaWV3LCBpc1Jvb3RWaWV3fSBmcm9tICcuL2ludGVyZmFjZXMvdHlwZV9jaGVja3MnO1xuaW1wb3J0IHtDT05URVhULCBERUNMQVJBVElPTl9MQ09OVEFJTkVSLCBMVmlldywgUVVFUklFUywgUkVOREVSRVIsIFRWaWV3LCBUX0hPU1R9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcblxuaW1wb3J0IHthc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzfSBmcm9tICcuL25vZGVfYXNzZXJ0JztcbmltcG9ydCB7YWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIsIGFwcGVuZENoaWxkLCBkZXRhY2hWaWV3LCBnZXRCZWZvcmVOb2RlRm9yVmlldywgaW5zZXJ0VmlldywgbmF0aXZlSW5zZXJ0QmVmb3JlLCBuYXRpdmVOZXh0U2libGluZywgbmF0aXZlUGFyZW50Tm9kZSwgcmVtb3ZlVmlld30gZnJvbSAnLi9ub2RlX21hbmlwdWxhdGlvbic7XG5pbXBvcnQge2dldFBhcmVudEluamVjdG9yVE5vZGV9IGZyb20gJy4vbm9kZV91dGlsJztcbmltcG9ydCB7Z2V0TFZpZXcsIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZX0gZnJvbSAnLi9zdGF0ZSc7XG5pbXBvcnQge2dldFBhcmVudEluamVjdG9yVmlldywgaGFzUGFyZW50SW5qZWN0b3J9IGZyb20gJy4vdXRpbC9pbmplY3Rvcl91dGlscyc7XG5pbXBvcnQge2ZpbmRDb21wb25lbnRWaWV3fSBmcm9tICcuL3V0aWwvdmlld190cmF2ZXJzYWxfdXRpbHMnO1xuaW1wb3J0IHtnZXRDb21wb25lbnRWaWV3QnlJbmRleCwgZ2V0TmF0aXZlQnlUTm9kZSwgdW53cmFwUk5vZGUsIHZpZXdBdHRhY2hlZFRvQ29udGFpbmVyfSBmcm9tICcuL3V0aWwvdmlld191dGlscyc7XG5pbXBvcnQge1ZpZXdSZWZ9IGZyb20gJy4vdmlld19yZWYnO1xuXG5cblxuLyoqXG4gKiBDcmVhdGVzIGFuIEVsZW1lbnRSZWYgZnJvbSB0aGUgbW9zdCByZWNlbnQgbm9kZS5cbiAqXG4gKiBAcmV0dXJucyBUaGUgRWxlbWVudFJlZiBpbnN0YW5jZSB0byB1c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdEVsZW1lbnRSZWYoRWxlbWVudFJlZlRva2VuOiB0eXBlb2YgVmlld0VuZ2luZV9FbGVtZW50UmVmKTpcbiAgICBWaWV3RW5naW5lX0VsZW1lbnRSZWYge1xuICByZXR1cm4gY3JlYXRlRWxlbWVudFJlZihFbGVtZW50UmVmVG9rZW4sIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpLCBnZXRMVmlldygpKTtcbn1cblxubGV0IFIzRWxlbWVudFJlZjoge25ldyAobmF0aXZlOiBSRWxlbWVudCB8IFJDb21tZW50KTogVmlld0VuZ2luZV9FbGVtZW50UmVmfTtcblxuLyoqXG4gKiBDcmVhdGVzIGFuIEVsZW1lbnRSZWYgZ2l2ZW4gYSBub2RlLlxuICpcbiAqIEBwYXJhbSBFbGVtZW50UmVmVG9rZW4gVGhlIEVsZW1lbnRSZWYgdHlwZVxuICogQHBhcmFtIHROb2RlIFRoZSBub2RlIGZvciB3aGljaCB5b3UnZCBsaWtlIGFuIEVsZW1lbnRSZWZcbiAqIEBwYXJhbSB2aWV3IFRoZSB2aWV3IHRvIHdoaWNoIHRoZSBub2RlIGJlbG9uZ3NcbiAqIEByZXR1cm5zIFRoZSBFbGVtZW50UmVmIGluc3RhbmNlIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRWxlbWVudFJlZihcbiAgICBFbGVtZW50UmVmVG9rZW46IHR5cGVvZiBWaWV3RW5naW5lX0VsZW1lbnRSZWYsIHROb2RlOiBUTm9kZSxcbiAgICB2aWV3OiBMVmlldyk6IFZpZXdFbmdpbmVfRWxlbWVudFJlZiB7XG4gIGlmICghUjNFbGVtZW50UmVmKSB7XG4gICAgLy8gVE9ETzogRml4IGNsYXNzIG5hbWUsIHNob3VsZCBiZSBFbGVtZW50UmVmLCBidXQgdGhlcmUgYXBwZWFycyB0byBiZSBhIHJvbGx1cCBidWdcbiAgICBSM0VsZW1lbnRSZWYgPSBjbGFzcyBFbGVtZW50UmVmXyBleHRlbmRzIEVsZW1lbnRSZWZUb2tlbiB7fTtcbiAgfVxuICByZXR1cm4gbmV3IFIzRWxlbWVudFJlZihnZXROYXRpdmVCeVROb2RlKHROb2RlLCB2aWV3KSBhcyBSRWxlbWVudCk7XG59XG5cbmxldCBSM1RlbXBsYXRlUmVmOiB7XG4gIG5ldyAoX2RlY2xhcmF0aW9uUGFyZW50VmlldzogTFZpZXcsIGhvc3RUTm9kZTogVENvbnRhaW5lck5vZGUsIGVsZW1lbnRSZWY6IFZpZXdFbmdpbmVfRWxlbWVudFJlZik6XG4gICAgICBWaWV3RW5naW5lX1RlbXBsYXRlUmVmPGFueT5cbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIFRlbXBsYXRlUmVmIGdpdmVuIGEgbm9kZS5cbiAqXG4gKiBAcmV0dXJucyBUaGUgVGVtcGxhdGVSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RUZW1wbGF0ZVJlZjxUPihcbiAgICBUZW1wbGF0ZVJlZlRva2VuOiB0eXBlb2YgVmlld0VuZ2luZV9UZW1wbGF0ZVJlZixcbiAgICBFbGVtZW50UmVmVG9rZW46IHR5cGVvZiBWaWV3RW5naW5lX0VsZW1lbnRSZWYpOiBWaWV3RW5naW5lX1RlbXBsYXRlUmVmPFQ+fG51bGwge1xuICByZXR1cm4gY3JlYXRlVGVtcGxhdGVSZWY8VD4oXG4gICAgICBUZW1wbGF0ZVJlZlRva2VuLCBFbGVtZW50UmVmVG9rZW4sIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpLCBnZXRMVmlldygpKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgVGVtcGxhdGVSZWYgYW5kIHN0b3JlcyBpdCBvbiB0aGUgaW5qZWN0b3IuXG4gKlxuICogQHBhcmFtIFRlbXBsYXRlUmVmVG9rZW4gVGhlIFRlbXBsYXRlUmVmIHR5cGVcbiAqIEBwYXJhbSBFbGVtZW50UmVmVG9rZW4gVGhlIEVsZW1lbnRSZWYgdHlwZVxuICogQHBhcmFtIGhvc3RUTm9kZSBUaGUgbm9kZSBvbiB3aGljaCBhIFRlbXBsYXRlUmVmIGlzIHJlcXVlc3RlZFxuICogQHBhcmFtIGhvc3RWaWV3IFRoZSB2aWV3IHRvIHdoaWNoIHRoZSBub2RlIGJlbG9uZ3NcbiAqIEByZXR1cm5zIFRoZSBUZW1wbGF0ZVJlZiBpbnN0YW5jZSBvciBudWxsIGlmIHdlIGNhbid0IGNyZWF0ZSBhIFRlbXBsYXRlUmVmIG9uIGEgZ2l2ZW4gbm9kZSB0eXBlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUZW1wbGF0ZVJlZjxUPihcbiAgICBUZW1wbGF0ZVJlZlRva2VuOiB0eXBlb2YgVmlld0VuZ2luZV9UZW1wbGF0ZVJlZiwgRWxlbWVudFJlZlRva2VuOiB0eXBlb2YgVmlld0VuZ2luZV9FbGVtZW50UmVmLFxuICAgIGhvc3RUTm9kZTogVE5vZGUsIGhvc3RWaWV3OiBMVmlldyk6IFZpZXdFbmdpbmVfVGVtcGxhdGVSZWY8VD58bnVsbCB7XG4gIGlmICghUjNUZW1wbGF0ZVJlZikge1xuICAgIC8vIFRPRE86IEZpeCBjbGFzcyBuYW1lLCBzaG91bGQgYmUgVGVtcGxhdGVSZWYsIGJ1dCB0aGVyZSBhcHBlYXJzIHRvIGJlIGEgcm9sbHVwIGJ1Z1xuICAgIFIzVGVtcGxhdGVSZWYgPSBjbGFzcyBUZW1wbGF0ZVJlZl88VD4gZXh0ZW5kcyBUZW1wbGF0ZVJlZlRva2VuPFQ+IHtcbiAgICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICAgIHByaXZhdGUgX2RlY2xhcmF0aW9uVmlldzogTFZpZXcsIHByaXZhdGUgX2RlY2xhcmF0aW9uVENvbnRhaW5lcjogVENvbnRhaW5lck5vZGUsXG4gICAgICAgICAgcmVhZG9ubHkgZWxlbWVudFJlZjogVmlld0VuZ2luZV9FbGVtZW50UmVmKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICB9XG5cbiAgICAgIGNyZWF0ZUVtYmVkZGVkVmlldyhjb250ZXh0OiBUKTogdmlld0VuZ2luZV9FbWJlZGRlZFZpZXdSZWY8VD4ge1xuICAgICAgICBjb25zdCBlbWJlZGRlZFRWaWV3ID0gdGhpcy5fZGVjbGFyYXRpb25UQ29udGFpbmVyLnRWaWV3cyBhcyBUVmlldztcbiAgICAgICAgY29uc3QgbFZpZXcgPSBjcmVhdGVFbWJlZGRlZFZpZXdBbmROb2RlKFxuICAgICAgICAgICAgZW1iZWRkZWRUVmlldywgY29udGV4dCwgdGhpcy5fZGVjbGFyYXRpb25WaWV3LFxuICAgICAgICAgICAgdGhpcy5fZGVjbGFyYXRpb25UQ29udGFpbmVyLmluamVjdG9ySW5kZXgpO1xuXG4gICAgICAgIGNvbnN0IGRlY2xhcmF0aW9uTENvbnRhaW5lciA9IHRoaXMuX2RlY2xhcmF0aW9uVmlld1t0aGlzLl9kZWNsYXJhdGlvblRDb250YWluZXIuaW5kZXhdO1xuICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TENvbnRhaW5lcihkZWNsYXJhdGlvbkxDb250YWluZXIpO1xuICAgICAgICBsVmlld1tERUNMQVJBVElPTl9MQ09OVEFJTkVSXSA9IGRlY2xhcmF0aW9uTENvbnRhaW5lcjtcblxuICAgICAgICBjb25zdCBkZWNsYXJhdGlvblZpZXdMUXVlcmllcyA9IHRoaXMuX2RlY2xhcmF0aW9uVmlld1tRVUVSSUVTXTtcbiAgICAgICAgaWYgKGRlY2xhcmF0aW9uVmlld0xRdWVyaWVzICE9PSBudWxsKSB7XG4gICAgICAgICAgbFZpZXdbUVVFUklFU10gPSBkZWNsYXJhdGlvblZpZXdMUXVlcmllcy5jcmVhdGVFbWJlZGRlZFZpZXcoZW1iZWRkZWRUVmlldyk7XG4gICAgICAgIH1cblxuICAgICAgICByZW5kZXJFbWJlZGRlZFRlbXBsYXRlKGxWaWV3LCBlbWJlZGRlZFRWaWV3LCBjb250ZXh0KTtcbiAgICAgICAgY29uc3Qgdmlld1JlZiA9IG5ldyBWaWV3UmVmKGxWaWV3LCBjb250ZXh0LCAtMSk7XG4gICAgICAgIHZpZXdSZWYuX3RWaWV3Tm9kZSA9IGxWaWV3W1RfSE9TVF0gYXMgVFZpZXdOb2RlO1xuICAgICAgICByZXR1cm4gdmlld1JlZjtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgaWYgKGhvc3RUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoaG9zdFROb2RlLnRWaWV3cywgJ1RWaWV3IG11c3QgYmUgYWxsb2NhdGVkJyk7XG4gICAgcmV0dXJuIG5ldyBSM1RlbXBsYXRlUmVmKFxuICAgICAgICBob3N0VmlldywgaG9zdFROb2RlIGFzIFRDb250YWluZXJOb2RlLFxuICAgICAgICBjcmVhdGVFbGVtZW50UmVmKEVsZW1lbnRSZWZUb2tlbiwgaG9zdFROb2RlLCBob3N0VmlldykpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbmxldCBSM1ZpZXdDb250YWluZXJSZWY6IHtcbiAgbmV3IChcbiAgICAgIGxDb250YWluZXI6IExDb250YWluZXIsIGhvc3RUTm9kZTogVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGUsXG4gICAgICBob3N0VmlldzogTFZpZXcpOiBWaWV3RW5naW5lX1ZpZXdDb250YWluZXJSZWZcbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIFZpZXdDb250YWluZXJSZWYgYW5kIHN0b3JlcyBpdCBvbiB0aGUgaW5qZWN0b3IuIE9yLCBpZiB0aGUgVmlld0NvbnRhaW5lclJlZlxuICogYWxyZWFkeSBleGlzdHMsIHJldHJpZXZlcyB0aGUgZXhpc3RpbmcgVmlld0NvbnRhaW5lclJlZi5cbiAqXG4gKiBAcmV0dXJucyBUaGUgVmlld0NvbnRhaW5lclJlZiBpbnN0YW5jZSB0byB1c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdFZpZXdDb250YWluZXJSZWYoXG4gICAgVmlld0NvbnRhaW5lclJlZlRva2VuOiB0eXBlb2YgVmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmLFxuICAgIEVsZW1lbnRSZWZUb2tlbjogdHlwZW9mIFZpZXdFbmdpbmVfRWxlbWVudFJlZik6IFZpZXdFbmdpbmVfVmlld0NvbnRhaW5lclJlZiB7XG4gIGNvbnN0IHByZXZpb3VzVE5vZGUgPVxuICAgICAgZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCkgYXMgVEVsZW1lbnROb2RlIHwgVEVsZW1lbnRDb250YWluZXJOb2RlIHwgVENvbnRhaW5lck5vZGU7XG4gIHJldHVybiBjcmVhdGVDb250YWluZXJSZWYoVmlld0NvbnRhaW5lclJlZlRva2VuLCBFbGVtZW50UmVmVG9rZW4sIHByZXZpb3VzVE5vZGUsIGdldExWaWV3KCkpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBWaWV3Q29udGFpbmVyUmVmIGFuZCBzdG9yZXMgaXQgb24gdGhlIGluamVjdG9yLlxuICpcbiAqIEBwYXJhbSBWaWV3Q29udGFpbmVyUmVmVG9rZW4gVGhlIFZpZXdDb250YWluZXJSZWYgdHlwZVxuICogQHBhcmFtIEVsZW1lbnRSZWZUb2tlbiBUaGUgRWxlbWVudFJlZiB0eXBlXG4gKiBAcGFyYW0gaG9zdFROb2RlIFRoZSBub2RlIHRoYXQgaXMgcmVxdWVzdGluZyBhIFZpZXdDb250YWluZXJSZWZcbiAqIEBwYXJhbSBob3N0VmlldyBUaGUgdmlldyB0byB3aGljaCB0aGUgbm9kZSBiZWxvbmdzXG4gKiBAcmV0dXJucyBUaGUgVmlld0NvbnRhaW5lclJlZiBpbnN0YW5jZSB0byB1c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUNvbnRhaW5lclJlZihcbiAgICBWaWV3Q29udGFpbmVyUmVmVG9rZW46IHR5cGVvZiBWaWV3RW5naW5lX1ZpZXdDb250YWluZXJSZWYsXG4gICAgRWxlbWVudFJlZlRva2VuOiB0eXBlb2YgVmlld0VuZ2luZV9FbGVtZW50UmVmLFxuICAgIGhvc3RUTm9kZTogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZSxcbiAgICBob3N0VmlldzogTFZpZXcpOiBWaWV3RW5naW5lX1ZpZXdDb250YWluZXJSZWYge1xuICBpZiAoIVIzVmlld0NvbnRhaW5lclJlZikge1xuICAgIC8vIFRPRE86IEZpeCBjbGFzcyBuYW1lLCBzaG91bGQgYmUgVmlld0NvbnRhaW5lclJlZiwgYnV0IHRoZXJlIGFwcGVhcnMgdG8gYmUgYSByb2xsdXAgYnVnXG4gICAgUjNWaWV3Q29udGFpbmVyUmVmID0gY2xhc3MgVmlld0NvbnRhaW5lclJlZl8gZXh0ZW5kcyBWaWV3Q29udGFpbmVyUmVmVG9rZW4ge1xuICAgICAgY29uc3RydWN0b3IoXG4gICAgICAgICAgcHJpdmF0ZSBfbENvbnRhaW5lcjogTENvbnRhaW5lcixcbiAgICAgICAgICBwcml2YXRlIF9ob3N0VE5vZGU6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxURWxlbWVudENvbnRhaW5lck5vZGUsXG4gICAgICAgICAgcHJpdmF0ZSBfaG9zdFZpZXc6IExWaWV3KSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICB9XG5cbiAgICAgIGdldCBlbGVtZW50KCk6IFZpZXdFbmdpbmVfRWxlbWVudFJlZiB7XG4gICAgICAgIHJldHVybiBjcmVhdGVFbGVtZW50UmVmKEVsZW1lbnRSZWZUb2tlbiwgdGhpcy5faG9zdFROb2RlLCB0aGlzLl9ob3N0Vmlldyk7XG4gICAgICB9XG5cbiAgICAgIGdldCBpbmplY3RvcigpOiBJbmplY3RvciB7IHJldHVybiBuZXcgTm9kZUluamVjdG9yKHRoaXMuX2hvc3RUTm9kZSwgdGhpcy5faG9zdFZpZXcpOyB9XG5cbiAgICAgIC8qKiBAZGVwcmVjYXRlZCBObyByZXBsYWNlbWVudCAqL1xuICAgICAgZ2V0IHBhcmVudEluamVjdG9yKCk6IEluamVjdG9yIHtcbiAgICAgICAgY29uc3QgcGFyZW50TG9jYXRpb24gPSBnZXRQYXJlbnRJbmplY3RvckxvY2F0aW9uKHRoaXMuX2hvc3RUTm9kZSwgdGhpcy5faG9zdFZpZXcpO1xuICAgICAgICBjb25zdCBwYXJlbnRWaWV3ID0gZ2V0UGFyZW50SW5qZWN0b3JWaWV3KHBhcmVudExvY2F0aW9uLCB0aGlzLl9ob3N0Vmlldyk7XG4gICAgICAgIGNvbnN0IHBhcmVudFROb2RlID0gZ2V0UGFyZW50SW5qZWN0b3JUTm9kZShwYXJlbnRMb2NhdGlvbiwgdGhpcy5faG9zdFZpZXcsIHRoaXMuX2hvc3RUTm9kZSk7XG5cbiAgICAgICAgcmV0dXJuICFoYXNQYXJlbnRJbmplY3RvcihwYXJlbnRMb2NhdGlvbikgfHwgcGFyZW50VE5vZGUgPT0gbnVsbCA/XG4gICAgICAgICAgICBuZXcgTm9kZUluamVjdG9yKG51bGwsIHRoaXMuX2hvc3RWaWV3KSA6XG4gICAgICAgICAgICBuZXcgTm9kZUluamVjdG9yKHBhcmVudFROb2RlLCBwYXJlbnRWaWV3KTtcbiAgICAgIH1cblxuICAgICAgY2xlYXIoKTogdm9pZCB7XG4gICAgICAgIHdoaWxlICh0aGlzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICB0aGlzLnJlbW92ZSh0aGlzLmxlbmd0aCAtIDEpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGdldChpbmRleDogbnVtYmVyKTogdmlld0VuZ2luZV9WaWV3UmVmfG51bGwge1xuICAgICAgICByZXR1cm4gdGhpcy5fbENvbnRhaW5lcltWSUVXX1JFRlNdICE9PSBudWxsICYmIHRoaXMuX2xDb250YWluZXJbVklFV19SRUZTXSAhW2luZGV4XSB8fCBudWxsO1xuICAgICAgfVxuXG4gICAgICBnZXQgbGVuZ3RoKCk6IG51bWJlciB7XG4gICAgICAgIC8vIE5vdGUgdGhhdCBpZiB0aGVyZSBhcmUgbm8gdmlld3MsIHRoZSBjb250YWluZXJcbiAgICAgICAgLy8gbGVuZ3RoIHdpbGwgYmUgc21hbGxlciB0aGFuIHRoZSBoZWFkZXIgb2Zmc2V0LlxuICAgICAgICBjb25zdCB2aWV3QW1vdW50ID0gdGhpcy5fbENvbnRhaW5lci5sZW5ndGggLSBDT05UQUlORVJfSEVBREVSX09GRlNFVDtcbiAgICAgICAgcmV0dXJuIHZpZXdBbW91bnQgPiAwID8gdmlld0Ftb3VudCA6IDA7XG4gICAgICB9XG5cbiAgICAgIGNyZWF0ZUVtYmVkZGVkVmlldzxDPih0ZW1wbGF0ZVJlZjogVmlld0VuZ2luZV9UZW1wbGF0ZVJlZjxDPiwgY29udGV4dD86IEMsIGluZGV4PzogbnVtYmVyKTpcbiAgICAgICAgICB2aWV3RW5naW5lX0VtYmVkZGVkVmlld1JlZjxDPiB7XG4gICAgICAgIGNvbnN0IHZpZXdSZWYgPSB0ZW1wbGF0ZVJlZi5jcmVhdGVFbWJlZGRlZFZpZXcoY29udGV4dCB8fCA8YW55Pnt9KTtcbiAgICAgICAgdGhpcy5pbnNlcnQodmlld1JlZiwgaW5kZXgpO1xuICAgICAgICByZXR1cm4gdmlld1JlZjtcbiAgICAgIH1cblxuICAgICAgY3JlYXRlQ29tcG9uZW50PEM+KFxuICAgICAgICAgIGNvbXBvbmVudEZhY3Rvcnk6IHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeTxDPiwgaW5kZXg/OiBudW1iZXJ8dW5kZWZpbmVkLFxuICAgICAgICAgIGluamVjdG9yPzogSW5qZWN0b3J8dW5kZWZpbmVkLCBwcm9qZWN0YWJsZU5vZGVzPzogYW55W11bXXx1bmRlZmluZWQsXG4gICAgICAgICAgbmdNb2R1bGVSZWY/OiB2aWV3RW5naW5lX05nTW9kdWxlUmVmPGFueT58dW5kZWZpbmVkKTogdmlld0VuZ2luZV9Db21wb25lbnRSZWY8Qz4ge1xuICAgICAgICBjb25zdCBjb250ZXh0SW5qZWN0b3IgPSBpbmplY3RvciB8fCB0aGlzLnBhcmVudEluamVjdG9yO1xuICAgICAgICBpZiAoIW5nTW9kdWxlUmVmICYmIChjb21wb25lbnRGYWN0b3J5IGFzIGFueSkubmdNb2R1bGUgPT0gbnVsbCAmJiBjb250ZXh0SW5qZWN0b3IpIHtcbiAgICAgICAgICBuZ01vZHVsZVJlZiA9IGNvbnRleHRJbmplY3Rvci5nZXQodmlld0VuZ2luZV9OZ01vZHVsZVJlZiwgbnVsbCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjb21wb25lbnRSZWYgPVxuICAgICAgICAgICAgY29tcG9uZW50RmFjdG9yeS5jcmVhdGUoY29udGV4dEluamVjdG9yLCBwcm9qZWN0YWJsZU5vZGVzLCB1bmRlZmluZWQsIG5nTW9kdWxlUmVmKTtcbiAgICAgICAgdGhpcy5pbnNlcnQoY29tcG9uZW50UmVmLmhvc3RWaWV3LCBpbmRleCk7XG4gICAgICAgIHJldHVybiBjb21wb25lbnRSZWY7XG4gICAgICB9XG5cbiAgICAgIGluc2VydCh2aWV3UmVmOiB2aWV3RW5naW5lX1ZpZXdSZWYsIGluZGV4PzogbnVtYmVyKTogdmlld0VuZ2luZV9WaWV3UmVmIHtcbiAgICAgICAgaWYgKHZpZXdSZWYuZGVzdHJveWVkKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgaW5zZXJ0IGEgZGVzdHJveWVkIFZpZXcgaW4gYSBWaWV3Q29udGFpbmVyIScpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYWxsb2NhdGVDb250YWluZXJJZk5lZWRlZCgpO1xuICAgICAgICBjb25zdCBsVmlldyA9ICh2aWV3UmVmIGFzIFZpZXdSZWY8YW55PikuX2xWaWV3ICE7XG4gICAgICAgIGNvbnN0IGFkanVzdGVkSWR4ID0gdGhpcy5fYWRqdXN0SW5kZXgoaW5kZXgpO1xuXG4gICAgICAgIGlmICh2aWV3QXR0YWNoZWRUb0NvbnRhaW5lcihsVmlldykpIHtcbiAgICAgICAgICAvLyBJZiB2aWV3IGlzIGFscmVhZHkgYXR0YWNoZWQsIGZhbGwgYmFjayB0byBtb3ZlKCkgc28gd2UgY2xlYW4gdXBcbiAgICAgICAgICAvLyByZWZlcmVuY2VzIGFwcHJvcHJpYXRlbHkuXG4gICAgICAgICAgcmV0dXJuIHRoaXMubW92ZSh2aWV3UmVmLCBhZGp1c3RlZElkeCk7XG4gICAgICAgIH1cblxuICAgICAgICBpbnNlcnRWaWV3KGxWaWV3LCB0aGlzLl9sQ29udGFpbmVyLCBhZGp1c3RlZElkeCk7XG5cbiAgICAgICAgY29uc3QgYmVmb3JlTm9kZSA9IGdldEJlZm9yZU5vZGVGb3JWaWV3KGFkanVzdGVkSWR4LCB0aGlzLl9sQ29udGFpbmVyKTtcbiAgICAgICAgYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIobFZpZXcsIHRydWUsIGJlZm9yZU5vZGUpO1xuXG4gICAgICAgICh2aWV3UmVmIGFzIFZpZXdSZWY8YW55PikuYXR0YWNoVG9WaWV3Q29udGFpbmVyUmVmKHRoaXMpO1xuICAgICAgICBhZGRUb0FycmF5KHRoaXMuX2xDb250YWluZXJbVklFV19SRUZTXSAhLCBhZGp1c3RlZElkeCwgdmlld1JlZik7XG5cbiAgICAgICAgcmV0dXJuIHZpZXdSZWY7XG4gICAgICB9XG5cbiAgICAgIG1vdmUodmlld1JlZjogdmlld0VuZ2luZV9WaWV3UmVmLCBuZXdJbmRleDogbnVtYmVyKTogdmlld0VuZ2luZV9WaWV3UmVmIHtcbiAgICAgICAgaWYgKHZpZXdSZWYuZGVzdHJveWVkKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgbW92ZSBhIGRlc3Ryb3llZCBWaWV3IGluIGEgVmlld0NvbnRhaW5lciEnKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMuaW5kZXhPZih2aWV3UmVmKTtcbiAgICAgICAgaWYgKGluZGV4ICE9PSAtMSkgdGhpcy5kZXRhY2goaW5kZXgpO1xuICAgICAgICB0aGlzLmluc2VydCh2aWV3UmVmLCBuZXdJbmRleCk7XG4gICAgICAgIHJldHVybiB2aWV3UmVmO1xuICAgICAgfVxuXG4gICAgICBpbmRleE9mKHZpZXdSZWY6IHZpZXdFbmdpbmVfVmlld1JlZik6IG51bWJlciB7XG4gICAgICAgIHJldHVybiB0aGlzLl9sQ29udGFpbmVyW1ZJRVdfUkVGU10gIT09IG51bGwgP1xuICAgICAgICAgICAgdGhpcy5fbENvbnRhaW5lcltWSUVXX1JFRlNdICEuaW5kZXhPZih2aWV3UmVmKSA6XG4gICAgICAgICAgICAwO1xuICAgICAgfVxuXG4gICAgICByZW1vdmUoaW5kZXg/OiBudW1iZXIpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5hbGxvY2F0ZUNvbnRhaW5lcklmTmVlZGVkKCk7XG4gICAgICAgIGNvbnN0IGFkanVzdGVkSWR4ID0gdGhpcy5fYWRqdXN0SW5kZXgoaW5kZXgsIC0xKTtcbiAgICAgICAgcmVtb3ZlVmlldyh0aGlzLl9sQ29udGFpbmVyLCBhZGp1c3RlZElkeCk7XG4gICAgICAgIHJlbW92ZUZyb21BcnJheSh0aGlzLl9sQ29udGFpbmVyW1ZJRVdfUkVGU10gISwgYWRqdXN0ZWRJZHgpO1xuICAgICAgfVxuXG4gICAgICBkZXRhY2goaW5kZXg/OiBudW1iZXIpOiB2aWV3RW5naW5lX1ZpZXdSZWZ8bnVsbCB7XG4gICAgICAgIHRoaXMuYWxsb2NhdGVDb250YWluZXJJZk5lZWRlZCgpO1xuICAgICAgICBjb25zdCBhZGp1c3RlZElkeCA9IHRoaXMuX2FkanVzdEluZGV4KGluZGV4LCAtMSk7XG4gICAgICAgIGNvbnN0IHZpZXcgPSBkZXRhY2hWaWV3KHRoaXMuX2xDb250YWluZXIsIGFkanVzdGVkSWR4KTtcblxuICAgICAgICBjb25zdCB3YXNEZXRhY2hlZCA9XG4gICAgICAgICAgICB2aWV3ICYmIHJlbW92ZUZyb21BcnJheSh0aGlzLl9sQ29udGFpbmVyW1ZJRVdfUkVGU10gISwgYWRqdXN0ZWRJZHgpICE9IG51bGw7XG4gICAgICAgIHJldHVybiB3YXNEZXRhY2hlZCA/IG5ldyBWaWV3UmVmKHZpZXcgISwgdmlldyAhW0NPTlRFWFRdLCAtMSkgOiBudWxsO1xuICAgICAgfVxuXG4gICAgICBwcml2YXRlIF9hZGp1c3RJbmRleChpbmRleD86IG51bWJlciwgc2hpZnQ6IG51bWJlciA9IDApIHtcbiAgICAgICAgaWYgKGluZGV4ID09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5sZW5ndGggKyBzaGlmdDtcbiAgICAgICAgfVxuICAgICAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICAgICAgYXNzZXJ0R3JlYXRlclRoYW4oaW5kZXgsIC0xLCAnaW5kZXggbXVzdCBiZSBwb3NpdGl2ZScpO1xuICAgICAgICAgIC8vICsxIGJlY2F1c2UgaXQncyBsZWdhbCB0byBpbnNlcnQgYXQgdGhlIGVuZC5cbiAgICAgICAgICBhc3NlcnRMZXNzVGhhbihpbmRleCwgdGhpcy5sZW5ndGggKyAxICsgc2hpZnQsICdpbmRleCcpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpbmRleDtcbiAgICAgIH1cblxuICAgICAgcHJpdmF0ZSBhbGxvY2F0ZUNvbnRhaW5lcklmTmVlZGVkKCk6IHZvaWQge1xuICAgICAgICBpZiAodGhpcy5fbENvbnRhaW5lcltWSUVXX1JFRlNdID09PSBudWxsKSB7XG4gICAgICAgICAgdGhpcy5fbENvbnRhaW5lcltWSUVXX1JFRlNdID0gW107XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXMoXG4gICAgICAgICAgICAgICAgICAgaG9zdFROb2RlLCBUTm9kZVR5cGUuQ29udGFpbmVyLCBUTm9kZVR5cGUuRWxlbWVudCwgVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpO1xuXG4gIGxldCBsQ29udGFpbmVyOiBMQ29udGFpbmVyO1xuICBjb25zdCBzbG90VmFsdWUgPSBob3N0Vmlld1tob3N0VE5vZGUuaW5kZXhdO1xuICBpZiAoaXNMQ29udGFpbmVyKHNsb3RWYWx1ZSkpIHtcbiAgICAvLyBJZiB0aGUgaG9zdCBpcyBhIGNvbnRhaW5lciwgd2UgZG9uJ3QgbmVlZCB0byBjcmVhdGUgYSBuZXcgTENvbnRhaW5lclxuICAgIGxDb250YWluZXIgPSBzbG90VmFsdWU7XG4gICAgbENvbnRhaW5lcltBQ1RJVkVfSU5ERVhdID0gLTE7XG4gIH0gZWxzZSB7XG4gICAgbGV0IGNvbW1lbnROb2RlOiBSQ29tbWVudDtcbiAgICAvLyBJZiB0aGUgaG9zdCBpcyBhbiBlbGVtZW50IGNvbnRhaW5lciwgdGhlIG5hdGl2ZSBob3N0IGVsZW1lbnQgaXMgZ3VhcmFudGVlZCB0byBiZSBhXG4gICAgLy8gY29tbWVudCBhbmQgd2UgY2FuIHJldXNlIHRoYXQgY29tbWVudCBhcyBhbmNob3IgZWxlbWVudCBmb3IgdGhlIG5ldyBMQ29udGFpbmVyLlxuICAgIGlmIChob3N0VE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpIHtcbiAgICAgIGNvbW1lbnROb2RlID0gdW53cmFwUk5vZGUoc2xvdFZhbHVlKSBhcyBSQ29tbWVudDtcbiAgICB9IGVsc2Uge1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckNyZWF0ZUNvbW1lbnQrKztcbiAgICAgIGNvbW1lbnROb2RlID0gaG9zdFZpZXdbUkVOREVSRVJdLmNyZWF0ZUNvbW1lbnQobmdEZXZNb2RlID8gJ2NvbnRhaW5lcicgOiAnJyk7XG4gICAgfVxuXG4gICAgLy8gQSBjb250YWluZXIgY2FuIGJlIGNyZWF0ZWQgb24gdGhlIHJvb3QgKHRvcG1vc3QgLyBib290c3RyYXBwZWQpIGNvbXBvbmVudCBhbmQgaW4gdGhpcyBjYXNlIHdlXG4gICAgLy8gY2FuJ3QgdXNlIExUcmVlIHRvIGluc2VydCBjb250YWluZXIncyBtYXJrZXIgbm9kZSAoYm90aCBwYXJlbnQgb2YgYSBjb21tZW50IG5vZGUgYW5kIHRoZVxuICAgIC8vIGNvbW1lbmQgbm9kZSBpdHNlbGYgaXMgbG9jYXRlZCBvdXRzaWRlIG9mIGVsZW1lbnRzIGhvbGQgYnkgTFRyZWUpLiBJbiB0aGlzIHNwZWNpZmljIGNhc2Ugd2VcbiAgICAvLyB1c2UgbG93LWxldmVsIERPTSBtYW5pcHVsYXRpb24gdG8gaW5zZXJ0IGNvbnRhaW5lcidzIG1hcmtlciAoY29tbWVudCkgbm9kZS5cbiAgICBpZiAoaXNSb290Vmlldyhob3N0VmlldykpIHtcbiAgICAgIGNvbnN0IHJlbmRlcmVyID0gaG9zdFZpZXdbUkVOREVSRVJdO1xuICAgICAgY29uc3QgaG9zdE5hdGl2ZSA9IGdldE5hdGl2ZUJ5VE5vZGUoaG9zdFROb2RlLCBob3N0VmlldykgITtcbiAgICAgIGNvbnN0IHBhcmVudE9mSG9zdE5hdGl2ZSA9IG5hdGl2ZVBhcmVudE5vZGUocmVuZGVyZXIsIGhvc3ROYXRpdmUpO1xuICAgICAgbmF0aXZlSW5zZXJ0QmVmb3JlKFxuICAgICAgICAgIHJlbmRlcmVyLCBwYXJlbnRPZkhvc3ROYXRpdmUgISwgY29tbWVudE5vZGUsIG5hdGl2ZU5leHRTaWJsaW5nKHJlbmRlcmVyLCBob3N0TmF0aXZlKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGFwcGVuZENoaWxkKGNvbW1lbnROb2RlLCBob3N0VE5vZGUsIGhvc3RWaWV3KTtcbiAgICB9XG5cbiAgICBob3N0Vmlld1tob3N0VE5vZGUuaW5kZXhdID0gbENvbnRhaW5lciA9XG4gICAgICAgIGNyZWF0ZUxDb250YWluZXIoc2xvdFZhbHVlLCBob3N0VmlldywgY29tbWVudE5vZGUsIGhvc3RUTm9kZSwgdHJ1ZSk7XG5cbiAgICBhZGRUb1ZpZXdUcmVlKGhvc3RWaWV3LCBsQ29udGFpbmVyKTtcbiAgfVxuXG4gIHJldHVybiBuZXcgUjNWaWV3Q29udGFpbmVyUmVmKGxDb250YWluZXIsIGhvc3RUTm9kZSwgaG9zdFZpZXcpO1xufVxuXG5cbi8qKiBSZXR1cm5zIGEgQ2hhbmdlRGV0ZWN0b3JSZWYgKGEuay5hLiBhIFZpZXdSZWYpICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0Q2hhbmdlRGV0ZWN0b3JSZWYoKTogVmlld0VuZ2luZV9DaGFuZ2VEZXRlY3RvclJlZiB7XG4gIHJldHVybiBjcmVhdGVWaWV3UmVmKGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpLCBnZXRMVmlldygpLCBudWxsKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgVmlld1JlZiBhbmQgc3RvcmVzIGl0IG9uIHRoZSBpbmplY3RvciBhcyBDaGFuZ2VEZXRlY3RvclJlZiAocHVibGljIGFsaWFzKS5cbiAqXG4gKiBAcGFyYW0gaG9zdFROb2RlIFRoZSBub2RlIHRoYXQgaXMgcmVxdWVzdGluZyBhIENoYW5nZURldGVjdG9yUmVmXG4gKiBAcGFyYW0gaG9zdFZpZXcgVGhlIHZpZXcgdG8gd2hpY2ggdGhlIG5vZGUgYmVsb25nc1xuICogQHBhcmFtIGNvbnRleHQgVGhlIGNvbnRleHQgZm9yIHRoaXMgY2hhbmdlIGRldGVjdG9yIHJlZlxuICogQHJldHVybnMgVGhlIENoYW5nZURldGVjdG9yUmVmIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVmlld1JlZihcbiAgICBob3N0VE5vZGU6IFROb2RlLCBob3N0VmlldzogTFZpZXcsIGNvbnRleHQ6IGFueSk6IFZpZXdFbmdpbmVfQ2hhbmdlRGV0ZWN0b3JSZWYge1xuICBpZiAoaXNDb21wb25lbnQoaG9zdFROb2RlKSkge1xuICAgIGNvbnN0IGNvbXBvbmVudEluZGV4ID0gaG9zdFROb2RlLmRpcmVjdGl2ZVN0YXJ0O1xuICAgIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBnZXRDb21wb25lbnRWaWV3QnlJbmRleChob3N0VE5vZGUuaW5kZXgsIGhvc3RWaWV3KTtcbiAgICByZXR1cm4gbmV3IFZpZXdSZWYoY29tcG9uZW50VmlldywgY29udGV4dCwgY29tcG9uZW50SW5kZXgpO1xuICB9IGVsc2UgaWYgKFxuICAgICAgaG9zdFROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50IHx8IGhvc3RUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyIHx8XG4gICAgICBob3N0VE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpIHtcbiAgICBjb25zdCBob3N0Q29tcG9uZW50VmlldyA9IGZpbmRDb21wb25lbnRWaWV3KGhvc3RWaWV3KTtcbiAgICByZXR1cm4gbmV3IFZpZXdSZWYoaG9zdENvbXBvbmVudFZpZXcsIGhvc3RDb21wb25lbnRWaWV3W0NPTlRFWFRdLCAtMSk7XG4gIH1cbiAgcmV0dXJuIG51bGwgITtcbn1cblxuLyoqIFJldHVybnMgYSBSZW5kZXJlcjIgKG9yIHRocm93cyB3aGVuIGFwcGxpY2F0aW9uIHdhcyBib290c3RyYXBwZWQgd2l0aCBSZW5kZXJlcjMpICovXG5mdW5jdGlvbiBnZXRPckNyZWF0ZVJlbmRlcmVyMih2aWV3OiBMVmlldyk6IFJlbmRlcmVyMiB7XG4gIGNvbnN0IHJlbmRlcmVyID0gdmlld1tSRU5ERVJFUl07XG4gIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICByZXR1cm4gcmVuZGVyZXIgYXMgUmVuZGVyZXIyO1xuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGluamVjdCBSZW5kZXJlcjIgd2hlbiB0aGUgYXBwbGljYXRpb24gdXNlcyBSZW5kZXJlcjMhJyk7XG4gIH1cbn1cblxuLyoqIEluamVjdHMgYSBSZW5kZXJlcjIgZm9yIHRoZSBjdXJyZW50IGNvbXBvbmVudC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RSZW5kZXJlcjIoKTogUmVuZGVyZXIyIHtcbiAgLy8gV2UgbmVlZCB0aGUgUmVuZGVyZXIgdG8gYmUgYmFzZWQgb24gdGhlIGNvbXBvbmVudCB0aGF0IGl0J3MgYmVpbmcgaW5qZWN0ZWQgaW50bywgaG93ZXZlciBzaW5jZVxuICAvLyBESSBoYXBwZW5zIGJlZm9yZSB3ZSd2ZSBlbnRlcmVkIGl0cyB2aWV3LCBgZ2V0TFZpZXdgIHdpbGwgcmV0dXJuIHRoZSBwYXJlbnQgdmlldyBpbnN0ZWFkLlxuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIGNvbnN0IG5vZGVBdEluZGV4ID0gZ2V0Q29tcG9uZW50Vmlld0J5SW5kZXgodE5vZGUuaW5kZXgsIGxWaWV3KTtcbiAgcmV0dXJuIGdldE9yQ3JlYXRlUmVuZGVyZXIyKGlzTFZpZXcobm9kZUF0SW5kZXgpID8gbm9kZUF0SW5kZXggOiBsVmlldyk7XG59XG4iXX0=