/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
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
 * @param hostTNode The node that is requesting a TemplateRef
 * @param hostView The view to which the node belongs
 * @returns The TemplateRef instance to use
 */
export function createTemplateRef(TemplateRefToken, ElementRefToken, hostTNode, hostView) {
    if (!R3TemplateRef) {
        // TODO: Fix class name, should be TemplateRef, but there appears to be a rollup bug
        R3TemplateRef = /** @class */ (function (_super) {
            tslib_1.__extends(TemplateRef_, _super);
            function TemplateRef_(_declarationParentView, elementRef, _tView, _hostLContainer, _injectorIndex) {
                var _this = _super.call(this) || this;
                _this._declarationParentView = _declarationParentView;
                _this.elementRef = elementRef;
                _this._tView = _tView;
                _this._hostLContainer = _hostLContainer;
                _this._injectorIndex = _injectorIndex;
                return _this;
            }
            TemplateRef_.prototype.createEmbeddedView = function (context, container, index) {
                var lView = createEmbeddedViewAndNode(this._tView, context, this._declarationParentView, this._hostLContainer[QUERIES], this._injectorIndex);
                if (container) {
                    insertView(lView, container, index);
                }
                renderEmbeddedTemplate(lView, this._tView, context);
                var viewRef = new ViewRef(lView, context, -1);
                viewRef._tViewNode = lView[T_HOST];
                return viewRef;
            };
            return TemplateRef_;
        }(TemplateRefToken));
    }
    if (hostTNode.type === 0 /* Container */) {
        var hostContainer = hostView[hostTNode.index];
        ngDevMode && assertDefined(hostTNode.tViews, 'TView must be allocated');
        return new R3TemplateRef(hostView, createElementRef(ElementRefToken, hostTNode, hostView), hostTNode.tViews, hostContainer, hostTNode.injectorIndex);
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
                _this._viewRefs = [];
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
                while (this._lContainer[VIEWS].length) {
                    this.remove(0);
                }
            };
            ViewContainerRef_.prototype.get = function (index) { return this._viewRefs[index] || null; };
            Object.defineProperty(ViewContainerRef_.prototype, "length", {
                get: function () { return this._lContainer[VIEWS].length; },
                enumerable: true,
                configurable: true
            });
            ViewContainerRef_.prototype.createEmbeddedView = function (templateRef, context, index) {
                var adjustedIdx = this._adjustIndex(index);
                var viewRef = templateRef
                    .createEmbeddedView(context || {}, this._lContainer, adjustedIdx);
                viewRef.attachToViewContainerRef(this);
                this._viewRefs.splice(adjustedIdx, 0, viewRef);
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
                var lView = viewRef._lView;
                var adjustedIdx = this._adjustIndex(index);
                if (viewAttachedToContainer(lView)) {
                    // If view is already attached, fall back to move() so we clean up
                    // references appropriately.
                    return this.move(viewRef, adjustedIdx);
                }
                insertView(lView, this._lContainer, adjustedIdx);
                var beforeNode = getBeforeNodeForView(adjustedIdx, this._lContainer[VIEWS], this._lContainer[NATIVE]);
                addRemoveViewFromContainer(lView, true, beforeNode);
                viewRef.attachToViewContainerRef(this);
                this._viewRefs.splice(adjustedIdx, 0, viewRef);
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
            ViewContainerRef_.prototype.indexOf = function (viewRef) { return this._viewRefs.indexOf(viewRef); };
            ViewContainerRef_.prototype.remove = function (index) {
                var adjustedIdx = this._adjustIndex(index, -1);
                removeView(this._lContainer, adjustedIdx);
                this._viewRefs.splice(adjustedIdx, 1);
            };
            ViewContainerRef_.prototype.detach = function (index) {
                var adjustedIdx = this._adjustIndex(index, -1);
                var view = detachView(this._lContainer, adjustedIdx);
                var wasDetached = this._viewRefs.splice(adjustedIdx, 1)[0] != null;
                return wasDetached ? new ViewRef(view, view[CONTEXT], -1) : null;
            };
            ViewContainerRef_.prototype._adjustIndex = function (index, shift) {
                if (shift === void 0) { shift = 0; }
                if (index == null) {
                    return this._lContainer[VIEWS].length + shift;
                }
                if (ngDevMode) {
                    assertGreaterThan(index, -1, 'index must be positive');
                    // +1 because it's legal to insert at the end.
                    assertLessThan(index, this._lContainer[VIEWS].length + 1 + shift, 'index');
                }
                return index;
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
        var commentNode = hostView[RENDERER].createComment(ngDevMode ? 'container' : '');
        ngDevMode && ngDevMode.rendererCreateComment++;
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
function getOrCreateRenderer2(view) {
    var renderer = view[RENDERER];
    if (isProceduralRenderer(renderer)) {
        return renderer;
    }
    else {
        throw new Error('Cannot inject Renderer2 when the application uses Renderer3!');
    }
}
/** Returns a Renderer2 (or throws when application was bootstrapped with Renderer3) */
export function injectRenderer2() {
    return getOrCreateRenderer2(getLView());
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld19lbmdpbmVfY29tcGF0aWJpbGl0eS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvdmlld19lbmdpbmVfY29tcGF0aWJpbGl0eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBTUgsT0FBTyxFQUFDLFdBQVcsSUFBSSxzQkFBc0IsRUFBQyxNQUFNLDZCQUE2QixDQUFDO0FBS2xGLE9BQU8sRUFBQyxhQUFhLEVBQUUsaUJBQWlCLEVBQUUsY0FBYyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFFaEYsT0FBTyxFQUFDLFlBQVksRUFBRSx5QkFBeUIsRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUM3RCxPQUFPLEVBQUMsYUFBYSxFQUFFLHlCQUF5QixFQUFFLGdCQUFnQixFQUFFLHNCQUFzQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDekgsT0FBTyxFQUFDLFlBQVksRUFBYyxNQUFNLEVBQUUsS0FBSyxFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFFL0UsT0FBTyxFQUFxQixvQkFBb0IsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQy9FLE9BQU8sRUFBQyxPQUFPLEVBQVMsT0FBTyxFQUFFLFFBQVEsRUFBUyxNQUFNLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNuRixPQUFPLEVBQUMseUJBQXlCLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDeEQsT0FBTyxFQUFDLDBCQUEwQixFQUFFLFdBQVcsRUFBRSxVQUFVLEVBQUUsb0JBQW9CLEVBQUUsVUFBVSxFQUFFLGtCQUFrQixFQUFFLGlCQUFpQixFQUFFLGdCQUFnQixFQUFFLFVBQVUsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQy9MLE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLGFBQWEsQ0FBQztBQUNuRCxPQUFPLEVBQUMsUUFBUSxFQUFFLHdCQUF3QixFQUFDLE1BQU0s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QUNoRCxJQUFNLGFBQWEsR0FBRyx1QkFBdUIsQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ3pFLE9BQU8sSUFBSSxPQUFPLENBQUMsYUFBYSxFQUFFLE9BQU8sRUFBRSxjQUFjLENBQUMsQ0FBQztLQUM1RDtTQUFNLElBQ0gsU0FBUyxDQUFDLElBQUksb0JBQXNCLElBQUksU0FBUyxDQUFDLElBQUksc0JBQXdCO1FBQzlFLFNBQVMsQ0FBQyxJQUFJLDZCQUErQixFQUFFO1FBQ2pELElBQU0saUJBQWlCLEdBQUcsaUJBQWlCLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDdEQsT0FBTyxJQUFJLE9BQU8sQ0FBQyxpQkFBaUIsRUFBRSxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ3ZFO0lBQ0QsT0FBTyxJQUFNLENBQUM7QUFDaEIsQ0FBQztBQUVELFNBQVMsb0JBQW9CLENBQUMsSUFBVztJQUN2QyxJQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDaEMsSUFBSSxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsRUFBRTtRQUNsQyxPQUFPLFFBQXFCLENBQUM7S0FDOUI7U0FBTTtRQUNMLE1BQU0sSUFBSSxLQUFLLENBQUMsOERBQThELENBQUMsQ0FBQztLQUNqRjtBQUNILENBQUM7QUFFRCx1RkFBdUY7QUFDdkYsTUFBTSxVQUFVLGVBQWU7SUFDN0IsT0FBTyxvQkFBb0IsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO0FBQzFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Q2hhbmdlRGV0ZWN0b3JSZWYgYXMgVmlld0VuZ2luZV9DaGFuZ2VEZXRlY3RvclJlZn0gZnJvbSAnLi4vY2hhbmdlX2RldGVjdGlvbi9jaGFuZ2VfZGV0ZWN0b3JfcmVmJztcbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4uL2RpL2luamVjdG9yJztcbmltcG9ydCB7Q29tcG9uZW50RmFjdG9yeSBhcyB2aWV3RW5naW5lX0NvbXBvbmVudEZhY3RvcnksIENvbXBvbmVudFJlZiBhcyB2aWV3RW5naW5lX0NvbXBvbmVudFJlZn0gZnJvbSAnLi4vbGlua2VyL2NvbXBvbmVudF9mYWN0b3J5JztcbmltcG9ydCB7RWxlbWVudFJlZiBhcyBWaWV3RW5naW5lX0VsZW1lbnRSZWZ9IGZyb20gJy4uL2xpbmtlci9lbGVtZW50X3JlZic7XG5pbXBvcnQge05nTW9kdWxlUmVmIGFzIHZpZXdFbmdpbmVfTmdNb2R1bGVSZWZ9IGZyb20gJy4uL2xpbmtlci9uZ19tb2R1bGVfZmFjdG9yeSc7XG5pbXBvcnQge1RlbXBsYXRlUmVmIGFzIFZpZXdFbmdpbmVfVGVtcGxhdGVSZWZ9IGZyb20gJy4uL2xpbmtlci90ZW1wbGF0ZV9yZWYnO1xuaW1wb3J0IHtWaWV3Q29udGFpbmVyUmVmIGFzIFZpZXdFbmdpbmVfVmlld0NvbnRhaW5lclJlZn0gZnJvbSAnLi4vbGlua2VyL3ZpZXdfY29udGFpbmVyX3JlZic7XG5pbXBvcnQge0VtYmVkZGVkVmlld1JlZiBhcyB2aWV3RW5naW5lX0VtYmVkZGVkVmlld1JlZiwgVmlld1JlZiBhcyB2aWV3RW5naW5lX1ZpZXdSZWZ9IGZyb20gJy4uL2xpbmtlci92aWV3X3JlZic7XG5pbXBvcnQge1JlbmRlcmVyMn0gZnJvbSAnLi4vcmVuZGVyL2FwaSc7XG5pbXBvcnQge2Fzc2VydERlZmluZWQsIGFzc2VydEdyZWF0ZXJUaGFuLCBhc3NlcnRMZXNzVGhhbn0gZnJvbSAnLi4vdXRpbC9hc3NlcnQnO1xuXG5pbXBvcnQge05vZGVJbmplY3RvciwgZ2V0UGFyZW50SW5qZWN0b3JMb2NhdGlvbn0gZnJvbSAnLi9kaSc7XG5pbXBvcnQge2FkZFRvVmlld1RyZWUsIGNyZWF0ZUVtYmVkZGVkVmlld0FuZE5vZGUsIGNyZWF0ZUxDb250YWluZXIsIHJlbmRlckVtYmVkZGVkVGVtcGxhdGV9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zL3NoYXJlZCc7XG5pbXBvcnQge0FDVElWRV9JTkRFWCwgTENvbnRhaW5lciwgTkFUSVZFLCBWSUVXU30gZnJvbSAnLi9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge1RDb250YWluZXJOb2RlLCBURWxlbWVudENvbnRhaW5lck5vZGUsIFRFbGVtZW50Tm9kZSwgVE5vZGUsIFROb2RlVHlwZSwgVFZpZXdOb2RlfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1JDb21tZW50LCBSRWxlbWVudCwgaXNQcm9jZWR1cmFsUmVuZGVyZXJ9IGZyb20gJy4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge0NPTlRFWFQsIExWaWV3LCBRVUVSSUVTLCBSRU5ERVJFUiwgVFZpZXcsIFRfSE9TVH0gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHthc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzfSBmcm9tICcuL25vZGVfYXNzZXJ0JztcbmltcG9ydCB7YWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIsIGFwcGVuZENoaWxkLCBkZXRhY2hWaWV3LCBnZXRCZWZvcmVOb2RlRm9yVmlldywgaW5zZXJ0VmlldywgbmF0aXZlSW5zZXJ0QmVmb3JlLCBuYXRpdmVOZXh0U2libGluZywgbmF0aXZlUGFyZW50Tm9kZSwgcmVtb3ZlVmlld30gZnJvbSAnLi9ub2RlX21hbmlwdWxhdGlvbic7XG5pbXBvcnQge2dldFBhcmVudEluamVjdG9yVE5vZGV9IGZyb20gJy4vbm9kZV91dGlsJztcbmltcG9ydCB7Z2V0TFZpZXcsIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZX0gZnJvbSAnLi9zdGF0ZSc7XG5pbXBvcnQge2dldFBhcmVudEluamVjdG9yVmlldywgaGFzUGFyZW50SW5qZWN0b3J9IGZyb20gJy4vdXRpbC9pbmplY3Rvcl91dGlscyc7XG5pbXBvcnQge2ZpbmRDb21wb25lbnRWaWV3fSBmcm9tICcuL3V0aWwvdmlld190cmF2ZXJzYWxfdXRpbHMnO1xuaW1wb3J0IHtnZXRDb21wb25lbnRWaWV3QnlJbmRleCwgZ2V0TmF0aXZlQnlUTm9kZSwgaXNDb21wb25lbnQsIGlzTENvbnRhaW5lciwgaXNSb290Vmlldywgdmlld0F0dGFjaGVkVG9Db250YWluZXJ9IGZyb20gJy4vdXRpbC92aWV3X3V0aWxzJztcbmltcG9ydCB7Vmlld1JlZn0gZnJvbSAnLi92aWV3X3JlZic7XG5cblxuXG4vKipcbiAqIENyZWF0ZXMgYW4gRWxlbWVudFJlZiBmcm9tIHRoZSBtb3N0IHJlY2VudCBub2RlLlxuICpcbiAqIEByZXR1cm5zIFRoZSBFbGVtZW50UmVmIGluc3RhbmNlIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0RWxlbWVudFJlZihFbGVtZW50UmVmVG9rZW46IHR5cGVvZiBWaWV3RW5naW5lX0VsZW1lbnRSZWYpOlxuICAgIFZpZXdFbmdpbmVfRWxlbWVudFJlZiB7XG4gIHJldHVybiBjcmVhdGVFbGVtZW50UmVmKEVsZW1lbnRSZWZUb2tlbiwgZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCksIGdldExWaWV3KCkpO1xufVxuXG5sZXQgUjNFbGVtZW50UmVmOiB7bmV3IChuYXRpdmU6IFJFbGVtZW50IHwgUkNvbW1lbnQpOiBWaWV3RW5naW5lX0VsZW1lbnRSZWZ9O1xuXG4vKipcbiAqIENyZWF0ZXMgYW4gRWxlbWVudFJlZiBnaXZlbiBhIG5vZGUuXG4gKlxuICogQHBhcmFtIEVsZW1lbnRSZWZUb2tlbiBUaGUgRWxlbWVudFJlZiB0eXBlXG4gKiBAcGFyYW0gdE5vZGUgVGhlIG5vZGUgZm9yIHdoaWNoIHlvdSdkIGxpa2UgYW4gRWxlbWVudFJlZlxuICogQHBhcmFtIHZpZXcgVGhlIHZpZXcgdG8gd2hpY2ggdGhlIG5vZGUgYmVsb25nc1xuICogQHJldHVybnMgVGhlIEVsZW1lbnRSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFbGVtZW50UmVmKFxuICAgIEVsZW1lbnRSZWZUb2tlbjogdHlwZW9mIFZpZXdFbmdpbmVfRWxlbWVudFJlZiwgdE5vZGU6IFROb2RlLFxuICAgIHZpZXc6IExWaWV3KTogVmlld0VuZ2luZV9FbGVtZW50UmVmIHtcbiAgaWYgKCFSM0VsZW1lbnRSZWYpIHtcbiAgICAvLyBUT0RPOiBGaXggY2xhc3MgbmFtZSwgc2hvdWxkIGJlIEVsZW1lbnRSZWYsIGJ1dCB0aGVyZSBhcHBlYXJzIHRvIGJlIGEgcm9sbHVwIGJ1Z1xuICAgIFIzRWxlbWVudFJlZiA9IGNsYXNzIEVsZW1lbnRSZWZfIGV4dGVuZHMgRWxlbWVudFJlZlRva2VuIHt9O1xuICB9XG4gIHJldHVybiBuZXcgUjNFbGVtZW50UmVmKGdldE5hdGl2ZUJ5VE5vZGUodE5vZGUsIHZpZXcpIGFzIFJFbGVtZW50KTtcbn1cblxubGV0IFIzVGVtcGxhdGVSZWY6IHtcbiAgbmV3IChcbiAgICAgIF9kZWNsYXJhdGlvblBhcmVudFZpZXc6IExWaWV3LCBlbGVtZW50UmVmOiBWaWV3RW5naW5lX0VsZW1lbnRSZWYsIF90VmlldzogVFZpZXcsXG4gICAgICBfaG9zdExDb250YWluZXI6IExDb250YWluZXIsIF9pbmplY3RvckluZGV4OiBudW1iZXIpOiBWaWV3RW5naW5lX1RlbXBsYXRlUmVmPGFueT5cbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIFRlbXBsYXRlUmVmIGdpdmVuIGEgbm9kZS5cbiAqXG4gKiBAcmV0dXJucyBUaGUgVGVtcGxhdGVSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RUZW1wbGF0ZVJlZjxUPihcbiAgICBUZW1wbGF0ZVJlZlRva2VuOiB0eXBlb2YgVmlld0VuZ2luZV9UZW1wbGF0ZVJlZixcbiAgICBFbGVtZW50UmVmVG9rZW46IHR5cGVvZiBWaWV3RW5naW5lX0VsZW1lbnRSZWYpOiBWaWV3RW5naW5lX1RlbXBsYXRlUmVmPFQ+fG51bGwge1xuICByZXR1cm4gY3JlYXRlVGVtcGxhdGVSZWY8VD4oXG4gICAgICBUZW1wbGF0ZVJlZlRva2VuLCBFbGVtZW50UmVmVG9rZW4sIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpLCBnZXRMVmlldygpKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgVGVtcGxhdGVSZWYgYW5kIHN0b3JlcyBpdCBvbiB0aGUgaW5qZWN0b3IuXG4gKlxuICogQHBhcmFtIFRlbXBsYXRlUmVmVG9rZW4gVGhlIFRlbXBsYXRlUmVmIHR5cGVcbiAqIEBwYXJhbSBFbGVtZW50UmVmVG9rZW4gVGhlIEVsZW1lbnRSZWYgdHlwZVxuICogQHBhcmFtIGhvc3RUTm9kZSBUaGUgbm9kZSB0aGF0IGlzIHJlcXVlc3RpbmcgYSBUZW1wbGF0ZVJlZlxuICogQHBhcmFtIGhvc3RWaWV3IFRoZSB2aWV3IHRvIHdoaWNoIHRoZSBub2RlIGJlbG9uZ3NcbiAqIEByZXR1cm5zIFRoZSBUZW1wbGF0ZVJlZiBpbnN0YW5jZSB0byB1c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVRlbXBsYXRlUmVmPFQ+KFxuICAgIFRlbXBsYXRlUmVmVG9rZW46IHR5cGVvZiBWaWV3RW5naW5lX1RlbXBsYXRlUmVmLCBFbGVtZW50UmVmVG9rZW46IHR5cGVvZiBWaWV3RW5naW5lX0VsZW1lbnRSZWYsXG4gICAgaG9zdFROb2RlOiBUTm9kZSwgaG9zdFZpZXc6IExWaWV3KTogVmlld0VuZ2luZV9UZW1wbGF0ZVJlZjxUPnxudWxsIHtcbiAgaWYgKCFSM1RlbXBsYXRlUmVmKSB7XG4gICAgLy8gVE9ETzogRml4IGNsYXNzIG5hbWUsIHNob3VsZCBiZSBUZW1wbGF0ZVJlZiwgYnV0IHRoZXJlIGFwcGVhcnMgdG8gYmUgYSByb2xsdXAgYnVnXG4gICAgUjNUZW1wbGF0ZVJlZiA9IGNsYXNzIFRlbXBsYXRlUmVmXzxUPiBleHRlbmRzIFRlbXBsYXRlUmVmVG9rZW48VD4ge1xuICAgICAgY29uc3RydWN0b3IoXG4gICAgICAgICAgcHJpdmF0ZSBfZGVjbGFyYXRpb25QYXJlbnRWaWV3OiBMVmlldywgcmVhZG9ubHkgZWxlbWVudFJlZjogVmlld0VuZ2luZV9FbGVtZW50UmVmLFxuICAgICAgICAgIHByaXZhdGUgX3RWaWV3OiBUVmlldywgcHJpdmF0ZSBfaG9zdExDb250YWluZXI6IExDb250YWluZXIsXG4gICAgICAgICAgcHJpdmF0ZSBfaW5qZWN0b3JJbmRleDogbnVtYmVyKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICB9XG5cbiAgICAgIGNyZWF0ZUVtYmVkZGVkVmlldyhjb250ZXh0OiBULCBjb250YWluZXI/OiBMQ29udGFpbmVyLCBpbmRleD86IG51bWJlcik6XG4gICAgICAgICAgdmlld0VuZ2luZV9FbWJlZGRlZFZpZXdSZWY8VD4ge1xuICAgICAgICBjb25zdCBsVmlldyA9IGNyZWF0ZUVtYmVkZGVkVmlld0FuZE5vZGUoXG4gICAgICAgICAgICB0aGlzLl90VmlldywgY29udGV4dCwgdGhpcy5fZGVjbGFyYXRpb25QYXJlbnRWaWV3LCB0aGlzLl9ob3N0TENvbnRhaW5lcltRVUVSSUVTXSxcbiAgICAgICAgICAgIHRoaXMuX2luamVjdG9ySW5kZXgpO1xuICAgICAgICBpZiAoY29udGFpbmVyKSB7XG4gICAgICAgICAgaW5zZXJ0VmlldyhsVmlldywgY29udGFpbmVyLCBpbmRleCAhKTtcbiAgICAgICAgfVxuICAgICAgICByZW5kZXJFbWJlZGRlZFRlbXBsYXRlKGxWaWV3LCB0aGlzLl90VmlldywgY29udGV4dCk7XG4gICAgICAgIGNvbnN0IHZpZXdSZWYgPSBuZXcgVmlld1JlZihsVmlldywgY29udGV4dCwgLTEpO1xuICAgICAgICB2aWV3UmVmLl90Vmlld05vZGUgPSBsVmlld1tUX0hPU1RdIGFzIFRWaWV3Tm9kZTtcbiAgICAgICAgcmV0dXJuIHZpZXdSZWY7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIGlmIChob3N0VE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgIGNvbnN0IGhvc3RDb250YWluZXI6IExDb250YWluZXIgPSBob3N0Vmlld1tob3N0VE5vZGUuaW5kZXhdO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGhvc3RUTm9kZS50Vmlld3MsICdUVmlldyBtdXN0IGJlIGFsbG9jYXRlZCcpO1xuICAgIHJldHVybiBuZXcgUjNUZW1wbGF0ZVJlZihcbiAgICAgICAgaG9zdFZpZXcsIGNyZWF0ZUVsZW1lbnRSZWYoRWxlbWVudFJlZlRva2VuLCBob3N0VE5vZGUsIGhvc3RWaWV3KSwgaG9zdFROb2RlLnRWaWV3cyBhcyBUVmlldyxcbiAgICAgICAgaG9zdENvbnRhaW5lciwgaG9zdFROb2RlLmluamVjdG9ySW5kZXgpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbmxldCBSM1ZpZXdDb250YWluZXJSZWY6IHtcbiAgbmV3IChcbiAgICAgIGxDb250YWluZXI6IExDb250YWluZXIsIGhvc3RUTm9kZTogVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGUsXG4gICAgICBob3N0VmlldzogTFZpZXcpOiBWaWV3RW5naW5lX1ZpZXdDb250YWluZXJSZWZcbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIFZpZXdDb250YWluZXJSZWYgYW5kIHN0b3JlcyBpdCBvbiB0aGUgaW5qZWN0b3IuIE9yLCBpZiB0aGUgVmlld0NvbnRhaW5lclJlZlxuICogYWxyZWFkeSBleGlzdHMsIHJldHJpZXZlcyB0aGUgZXhpc3RpbmcgVmlld0NvbnRhaW5lclJlZi5cbiAqXG4gKiBAcmV0dXJucyBUaGUgVmlld0NvbnRhaW5lclJlZiBpbnN0YW5jZSB0byB1c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdFZpZXdDb250YWluZXJSZWYoXG4gICAgVmlld0NvbnRhaW5lclJlZlRva2VuOiB0eXBlb2YgVmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmLFxuICAgIEVsZW1lbnRSZWZUb2tlbjogdHlwZW9mIFZpZXdFbmdpbmVfRWxlbWVudFJlZik6IFZpZXdFbmdpbmVfVmlld0NvbnRhaW5lclJlZiB7XG4gIGNvbnN0IHByZXZpb3VzVE5vZGUgPVxuICAgICAgZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCkgYXMgVEVsZW1lbnROb2RlIHwgVEVsZW1lbnRDb250YWluZXJOb2RlIHwgVENvbnRhaW5lck5vZGU7XG4gIHJldHVybiBjcmVhdGVDb250YWluZXJSZWYoVmlld0NvbnRhaW5lclJlZlRva2VuLCBFbGVtZW50UmVmVG9rZW4sIHByZXZpb3VzVE5vZGUsIGdldExWaWV3KCkpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBWaWV3Q29udGFpbmVyUmVmIGFuZCBzdG9yZXMgaXQgb24gdGhlIGluamVjdG9yLlxuICpcbiAqIEBwYXJhbSBWaWV3Q29udGFpbmVyUmVmVG9rZW4gVGhlIFZpZXdDb250YWluZXJSZWYgdHlwZVxuICogQHBhcmFtIEVsZW1lbnRSZWZUb2tlbiBUaGUgRWxlbWVudFJlZiB0eXBlXG4gKiBAcGFyYW0gaG9zdFROb2RlIFRoZSBub2RlIHRoYXQgaXMgcmVxdWVzdGluZyBhIFZpZXdDb250YWluZXJSZWZcbiAqIEBwYXJhbSBob3N0VmlldyBUaGUgdmlldyB0byB3aGljaCB0aGUgbm9kZSBiZWxvbmdzXG4gKiBAcmV0dXJucyBUaGUgVmlld0NvbnRhaW5lclJlZiBpbnN0YW5jZSB0byB1c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUNvbnRhaW5lclJlZihcbiAgICBWaWV3Q29udGFpbmVyUmVmVG9rZW46IHR5cGVvZiBWaWV3RW5naW5lX1ZpZXdDb250YWluZXJSZWYsXG4gICAgRWxlbWVudFJlZlRva2VuOiB0eXBlb2YgVmlld0VuZ2luZV9FbGVtZW50UmVmLFxuICAgIGhvc3RUTm9kZTogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZSxcbiAgICBob3N0VmlldzogTFZpZXcpOiBWaWV3RW5naW5lX1ZpZXdDb250YWluZXJSZWYge1xuICBpZiAoIVIzVmlld0NvbnRhaW5lclJlZikge1xuICAgIC8vIFRPRE86IEZpeCBjbGFzcyBuYW1lLCBzaG91bGQgYmUgVmlld0NvbnRhaW5lclJlZiwgYnV0IHRoZXJlIGFwcGVhcnMgdG8gYmUgYSByb2xsdXAgYnVnXG4gICAgUjNWaWV3Q29udGFpbmVyUmVmID0gY2xhc3MgVmlld0NvbnRhaW5lclJlZl8gZXh0ZW5kcyBWaWV3Q29udGFpbmVyUmVmVG9rZW4ge1xuICAgICAgcHJpdmF0ZSBfdmlld1JlZnM6IHZpZXdFbmdpbmVfVmlld1JlZltdID0gW107XG5cbiAgICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICAgIHByaXZhdGUgX2xDb250YWluZXI6IExDb250YWluZXIsXG4gICAgICAgICAgcHJpdmF0ZSBfaG9zdFROb2RlOiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlLFxuICAgICAgICAgIHByaXZhdGUgX2hvc3RWaWV3OiBMVmlldykge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgfVxuXG4gICAgICBnZXQgZWxlbWVudCgpOiBWaWV3RW5naW5lX0VsZW1lbnRSZWYge1xuICAgICAgICByZXR1cm4gY3JlYXRlRWxlbWVudFJlZihFbGVtZW50UmVmVG9rZW4sIHRoaXMuX2hvc3RUTm9kZSwgdGhpcy5faG9zdFZpZXcpO1xuICAgICAgfVxuXG4gICAgICBnZXQgaW5qZWN0b3IoKTogSW5qZWN0b3IgeyByZXR1cm4gbmV3IE5vZGVJbmplY3Rvcih0aGlzLl9ob3N0VE5vZGUsIHRoaXMuX2hvc3RWaWV3KTsgfVxuXG4gICAgICAvKiogQGRlcHJlY2F0ZWQgTm8gcmVwbGFjZW1lbnQgKi9cbiAgICAgIGdldCBwYXJlbnRJbmplY3RvcigpOiBJbmplY3RvciB7XG4gICAgICAgIGNvbnN0IHBhcmVudExvY2F0aW9uID0gZ2V0UGFyZW50SW5qZWN0b3JMb2NhdGlvbih0aGlzLl9ob3N0VE5vZGUsIHRoaXMuX2hvc3RWaWV3KTtcbiAgICAgICAgY29uc3QgcGFyZW50VmlldyA9IGdldFBhcmVudEluamVjdG9yVmlldyhwYXJlbnRMb2NhdGlvbiwgdGhpcy5faG9zdFZpZXcpO1xuICAgICAgICBjb25zdCBwYXJlbnRUTm9kZSA9IGdldFBhcmVudEluamVjdG9yVE5vZGUocGFyZW50TG9jYXRpb24sIHRoaXMuX2hvc3RWaWV3LCB0aGlzLl9ob3N0VE5vZGUpO1xuXG4gICAgICAgIHJldHVybiAhaGFzUGFyZW50SW5qZWN0b3IocGFyZW50TG9jYXRpb24pIHx8IHBhcmVudFROb2RlID09IG51bGwgP1xuICAgICAgICAgICAgbmV3IE5vZGVJbmplY3RvcihudWxsLCB0aGlzLl9ob3N0VmlldykgOlxuICAgICAgICAgICAgbmV3IE5vZGVJbmplY3RvcihwYXJlbnRUTm9kZSwgcGFyZW50Vmlldyk7XG4gICAgICB9XG5cbiAgICAgIGNsZWFyKCk6IHZvaWQge1xuICAgICAgICB3aGlsZSAodGhpcy5fbENvbnRhaW5lcltWSUVXU10ubGVuZ3RoKSB7XG4gICAgICAgICAgdGhpcy5yZW1vdmUoMCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZ2V0KGluZGV4OiBudW1iZXIpOiB2aWV3RW5naW5lX1ZpZXdSZWZ8bnVsbCB7IHJldHVybiB0aGlzLl92aWV3UmVmc1tpbmRleF0gfHwgbnVsbDsgfVxuXG4gICAgICBnZXQgbGVuZ3RoKCk6IG51bWJlciB7IHJldHVybiB0aGlzLl9sQ29udGFpbmVyW1ZJRVdTXS5sZW5ndGg7IH1cblxuICAgICAgY3JlYXRlRW1iZWRkZWRWaWV3PEM+KHRlbXBsYXRlUmVmOiBWaWV3RW5naW5lX1RlbXBsYXRlUmVmPEM+LCBjb250ZXh0PzogQywgaW5kZXg/OiBudW1iZXIpOlxuICAgICAgICAgIHZpZXdFbmdpbmVfRW1iZWRkZWRWaWV3UmVmPEM+IHtcbiAgICAgICAgY29uc3QgYWRqdXN0ZWRJZHggPSB0aGlzLl9hZGp1c3RJbmRleChpbmRleCk7XG4gICAgICAgIGNvbnN0IHZpZXdSZWYgPSAodGVtcGxhdGVSZWYgYXMgYW55KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5jcmVhdGVFbWJlZGRlZFZpZXcoY29udGV4dCB8fCA8YW55Pnt9LCB0aGlzLl9sQ29udGFpbmVyLCBhZGp1c3RlZElkeCk7XG4gICAgICAgICh2aWV3UmVmIGFzIFZpZXdSZWY8YW55PikuYXR0YWNoVG9WaWV3Q29udGFpbmVyUmVmKHRoaXMpO1xuICAgICAgICB0aGlzLl92aWV3UmVmcy5zcGxpY2UoYWRqdXN0ZWRJZHgsIDAsIHZpZXdSZWYpO1xuICAgICAgICByZXR1cm4gdmlld1JlZjtcbiAgICAgIH1cblxuICAgICAgY3JlYXRlQ29tcG9uZW50PEM+KFxuICAgICAgICAgIGNvbXBvbmVudEZhY3Rvcnk6IHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeTxDPiwgaW5kZXg/OiBudW1iZXJ8dW5kZWZpbmVkLFxuICAgICAgICAgIGluamVjdG9yPzogSW5qZWN0b3J8dW5kZWZpbmVkLCBwcm9qZWN0YWJsZU5vZGVzPzogYW55W11bXXx1bmRlZmluZWQsXG4gICAgICAgICAgbmdNb2R1bGVSZWY/OiB2aWV3RW5naW5lX05nTW9kdWxlUmVmPGFueT58dW5kZWZpbmVkKTogdmlld0VuZ2luZV9Db21wb25lbnRSZWY8Qz4ge1xuICAgICAgICBjb25zdCBjb250ZXh0SW5qZWN0b3IgPSBpbmplY3RvciB8fCB0aGlzLnBhcmVudEluamVjdG9yO1xuICAgICAgICBpZiAoIW5nTW9kdWxlUmVmICYmIChjb21wb25lbnRGYWN0b3J5IGFzIGFueSkubmdNb2R1bGUgPT0gbnVsbCAmJiBjb250ZXh0SW5qZWN0b3IpIHtcbiAgICAgICAgICBuZ01vZHVsZVJlZiA9IGNvbnRleHRJbmplY3Rvci5nZXQodmlld0VuZ2luZV9OZ01vZHVsZVJlZiwgbnVsbCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjb21wb25lbnRSZWYgPVxuICAgICAgICAgICAgY29tcG9uZW50RmFjdG9yeS5jcmVhdGUoY29udGV4dEluamVjdG9yLCBwcm9qZWN0YWJsZU5vZGVzLCB1bmRlZmluZWQsIG5nTW9kdWxlUmVmKTtcbiAgICAgICAgdGhpcy5pbnNlcnQoY29tcG9uZW50UmVmLmhvc3RWaWV3LCBpbmRleCk7XG4gICAgICAgIHJldHVybiBjb21wb25lbnRSZWY7XG4gICAgICB9XG5cbiAgICAgIGluc2VydCh2aWV3UmVmOiB2aWV3RW5naW5lX1ZpZXdSZWYsIGluZGV4PzogbnVtYmVyKTogdmlld0VuZ2luZV9WaWV3UmVmIHtcbiAgICAgICAgaWYgKHZpZXdSZWYuZGVzdHJveWVkKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgaW5zZXJ0IGEgZGVzdHJveWVkIFZpZXcgaW4gYSBWaWV3Q29udGFpbmVyIScpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGxWaWV3ID0gKHZpZXdSZWYgYXMgVmlld1JlZjxhbnk+KS5fbFZpZXcgITtcbiAgICAgICAgY29uc3QgYWRqdXN0ZWRJZHggPSB0aGlzLl9hZGp1c3RJbmRleChpbmRleCk7XG5cbiAgICAgICAgaWYgKHZpZXdBdHRhY2hlZFRvQ29udGFpbmVyKGxWaWV3KSkge1xuICAgICAgICAgIC8vIElmIHZpZXcgaXMgYWxyZWFkeSBhdHRhY2hlZCwgZmFsbCBiYWNrIHRvIG1vdmUoKSBzbyB3ZSBjbGVhbiB1cFxuICAgICAgICAgIC8vIHJlZmVyZW5jZXMgYXBwcm9wcmlhdGVseS5cbiAgICAgICAgICByZXR1cm4gdGhpcy5tb3ZlKHZpZXdSZWYsIGFkanVzdGVkSWR4KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGluc2VydFZpZXcobFZpZXcsIHRoaXMuX2xDb250YWluZXIsIGFkanVzdGVkSWR4KTtcblxuICAgICAgICBjb25zdCBiZWZvcmVOb2RlID1cbiAgICAgICAgICAgIGdldEJlZm9yZU5vZGVGb3JWaWV3KGFkanVzdGVkSWR4LCB0aGlzLl9sQ29udGFpbmVyW1ZJRVdTXSwgdGhpcy5fbENvbnRhaW5lcltOQVRJVkVdKTtcbiAgICAgICAgYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIobFZpZXcsIHRydWUsIGJlZm9yZU5vZGUpO1xuXG4gICAgICAgICh2aWV3UmVmIGFzIFZpZXdSZWY8YW55PikuYXR0YWNoVG9WaWV3Q29udGFpbmVyUmVmKHRoaXMpO1xuICAgICAgICB0aGlzLl92aWV3UmVmcy5zcGxpY2UoYWRqdXN0ZWRJZHgsIDAsIHZpZXdSZWYpO1xuXG4gICAgICAgIHJldHVybiB2aWV3UmVmO1xuICAgICAgfVxuXG4gICAgICBtb3ZlKHZpZXdSZWY6IHZpZXdFbmdpbmVfVmlld1JlZiwgbmV3SW5kZXg6IG51bWJlcik6IHZpZXdFbmdpbmVfVmlld1JlZiB7XG4gICAgICAgIGlmICh2aWV3UmVmLmRlc3Ryb3llZCkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IG1vdmUgYSBkZXN0cm95ZWQgVmlldyBpbiBhIFZpZXdDb250YWluZXIhJyk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLmluZGV4T2Yodmlld1JlZik7XG4gICAgICAgIGlmIChpbmRleCAhPT0gLTEpIHRoaXMuZGV0YWNoKGluZGV4KTtcbiAgICAgICAgdGhpcy5pbnNlcnQodmlld1JlZiwgbmV3SW5kZXgpO1xuICAgICAgICByZXR1cm4gdmlld1JlZjtcbiAgICAgIH1cblxuICAgICAgaW5kZXhPZih2aWV3UmVmOiB2aWV3RW5naW5lX1ZpZXdSZWYpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5fdmlld1JlZnMuaW5kZXhPZih2aWV3UmVmKTsgfVxuXG4gICAgICByZW1vdmUoaW5kZXg/OiBudW1iZXIpOiB2b2lkIHtcbiAgICAgICAgY29uc3QgYWRqdXN0ZWRJZHggPSB0aGlzLl9hZGp1c3RJbmRleChpbmRleCwgLTEpO1xuICAgICAgICByZW1vdmVWaWV3KHRoaXMuX2xDb250YWluZXIsIGFkanVzdGVkSWR4KTtcbiAgICAgICAgdGhpcy5fdmlld1JlZnMuc3BsaWNlKGFkanVzdGVkSWR4LCAxKTtcbiAgICAgIH1cblxuICAgICAgZGV0YWNoKGluZGV4PzogbnVtYmVyKTogdmlld0VuZ2luZV9WaWV3UmVmfG51bGwge1xuICAgICAgICBjb25zdCBhZGp1c3RlZElkeCA9IHRoaXMuX2FkanVzdEluZGV4KGluZGV4LCAtMSk7XG4gICAgICAgIGNvbnN0IHZpZXcgPSBkZXRhY2hWaWV3KHRoaXMuX2xDb250YWluZXIsIGFkanVzdGVkSWR4KTtcbiAgICAgICAgY29uc3Qgd2FzRGV0YWNoZWQgPSB0aGlzLl92aWV3UmVmcy5zcGxpY2UoYWRqdXN0ZWRJZHgsIDEpWzBdICE9IG51bGw7XG4gICAgICAgIHJldHVybiB3YXNEZXRhY2hlZCA/IG5ldyBWaWV3UmVmKHZpZXcsIHZpZXdbQ09OVEVYVF0sIC0xKSA6IG51bGw7XG4gICAgICB9XG5cbiAgICAgIHByaXZhdGUgX2FkanVzdEluZGV4KGluZGV4PzogbnVtYmVyLCBzaGlmdDogbnVtYmVyID0gMCkge1xuICAgICAgICBpZiAoaW5kZXggPT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiB0aGlzLl9sQ29udGFpbmVyW1ZJRVdTXS5sZW5ndGggKyBzaGlmdDtcbiAgICAgICAgfVxuICAgICAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICAgICAgYXNzZXJ0R3JlYXRlclRoYW4oaW5kZXgsIC0xLCAnaW5kZXggbXVzdCBiZSBwb3NpdGl2ZScpO1xuICAgICAgICAgIC8vICsxIGJlY2F1c2UgaXQncyBsZWdhbCB0byBpbnNlcnQgYXQgdGhlIGVuZC5cbiAgICAgICAgICBhc3NlcnRMZXNzVGhhbihpbmRleCwgdGhpcy5fbENvbnRhaW5lcltWSUVXU10ubGVuZ3RoICsgMSArIHNoaWZ0LCAnaW5kZXgnKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaW5kZXg7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzKFxuICAgICAgICAgICAgICAgICAgIGhvc3RUTm9kZSwgVE5vZGVUeXBlLkNvbnRhaW5lciwgVE5vZGVUeXBlLkVsZW1lbnQsIFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKTtcblxuICBsZXQgbENvbnRhaW5lcjogTENvbnRhaW5lcjtcbiAgY29uc3Qgc2xvdFZhbHVlID0gaG9zdFZpZXdbaG9zdFROb2RlLmluZGV4XTtcbiAgaWYgKGlzTENvbnRhaW5lcihzbG90VmFsdWUpKSB7XG4gICAgLy8gSWYgdGhlIGhvc3QgaXMgYSBjb250YWluZXIsIHdlIGRvbid0IG5lZWQgdG8gY3JlYXRlIGEgbmV3IExDb250YWluZXJcbiAgICBsQ29udGFpbmVyID0gc2xvdFZhbHVlO1xuICAgIGxDb250YWluZXJbQUNUSVZFX0lOREVYXSA9IC0xO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IGNvbW1lbnROb2RlID0gaG9zdFZpZXdbUkVOREVSRVJdLmNyZWF0ZUNvbW1lbnQobmdEZXZNb2RlID8gJ2NvbnRhaW5lcicgOiAnJyk7XG4gICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckNyZWF0ZUNvbW1lbnQrKztcblxuICAgIC8vIEEgY29udGFpbmVyIGNhbiBiZSBjcmVhdGVkIG9uIHRoZSByb290ICh0b3Btb3N0IC8gYm9vdHN0cmFwcGVkKSBjb21wb25lbnQgYW5kIGluIHRoaXMgY2FzZSB3ZVxuICAgIC8vIGNhbid0IHVzZSBMVHJlZSB0byBpbnNlcnQgY29udGFpbmVyJ3MgbWFya2VyIG5vZGUgKGJvdGggcGFyZW50IG9mIGEgY29tbWVudCBub2RlIGFuZCB0aGVcbiAgICAvLyBjb21tZW5kIG5vZGUgaXRzZWxmIGlzIGxvY2F0ZWQgb3V0c2lkZSBvZiBlbGVtZW50cyBob2xkIGJ5IExUcmVlKS4gSW4gdGhpcyBzcGVjaWZpYyBjYXNlIHdlXG4gICAgLy8gdXNlIGxvdy1sZXZlbCBET00gbWFuaXB1bGF0aW9uIHRvIGluc2VydCBjb250YWluZXIncyBtYXJrZXIgKGNvbW1lbnQpIG5vZGUuXG4gICAgaWYgKGlzUm9vdFZpZXcoaG9zdFZpZXcpKSB7XG4gICAgICBjb25zdCByZW5kZXJlciA9IGhvc3RWaWV3W1JFTkRFUkVSXTtcbiAgICAgIGNvbnN0IGhvc3ROYXRpdmUgPSBnZXROYXRpdmVCeVROb2RlKGhvc3RUTm9kZSwgaG9zdFZpZXcpICE7XG4gICAgICBjb25zdCBwYXJlbnRPZkhvc3ROYXRpdmUgPSBuYXRpdmVQYXJlbnROb2RlKHJlbmRlcmVyLCBob3N0TmF0aXZlKTtcbiAgICAgIG5hdGl2ZUluc2VydEJlZm9yZShcbiAgICAgICAgICByZW5kZXJlciwgcGFyZW50T2ZIb3N0TmF0aXZlICEsIGNvbW1lbnROb2RlLCBuYXRpdmVOZXh0U2libGluZyhyZW5kZXJlciwgaG9zdE5hdGl2ZSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBhcHBlbmRDaGlsZChjb21tZW50Tm9kZSwgaG9zdFROb2RlLCBob3N0Vmlldyk7XG4gICAgfVxuXG4gICAgaG9zdFZpZXdbaG9zdFROb2RlLmluZGV4XSA9IGxDb250YWluZXIgPVxuICAgICAgICBjcmVhdGVMQ29udGFpbmVyKHNsb3RWYWx1ZSwgaG9zdFZpZXcsIGNvbW1lbnROb2RlLCBob3N0VE5vZGUsIHRydWUpO1xuXG4gICAgYWRkVG9WaWV3VHJlZShob3N0VmlldywgbENvbnRhaW5lcik7XG4gIH1cblxuICByZXR1cm4gbmV3IFIzVmlld0NvbnRhaW5lclJlZihsQ29udGFpbmVyLCBob3N0VE5vZGUsIGhvc3RWaWV3KTtcbn1cblxuXG4vKiogUmV0dXJucyBhIENoYW5nZURldGVjdG9yUmVmIChhLmsuYS4gYSBWaWV3UmVmKSAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdENoYW5nZURldGVjdG9yUmVmKCk6IFZpZXdFbmdpbmVfQ2hhbmdlRGV0ZWN0b3JSZWYge1xuICByZXR1cm4gY3JlYXRlVmlld1JlZihnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKSwgZ2V0TFZpZXcoKSwgbnVsbCk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIFZpZXdSZWYgYW5kIHN0b3JlcyBpdCBvbiB0aGUgaW5qZWN0b3IgYXMgQ2hhbmdlRGV0ZWN0b3JSZWYgKHB1YmxpYyBhbGlhcykuXG4gKlxuICogQHBhcmFtIGhvc3RUTm9kZSBUaGUgbm9kZSB0aGF0IGlzIHJlcXVlc3RpbmcgYSBDaGFuZ2VEZXRlY3RvclJlZlxuICogQHBhcmFtIGhvc3RWaWV3IFRoZSB2aWV3IHRvIHdoaWNoIHRoZSBub2RlIGJlbG9uZ3NcbiAqIEBwYXJhbSBjb250ZXh0IFRoZSBjb250ZXh0IGZvciB0aGlzIGNoYW5nZSBkZXRlY3RvciByZWZcbiAqIEByZXR1cm5zIFRoZSBDaGFuZ2VEZXRlY3RvclJlZiB0byB1c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVZpZXdSZWYoXG4gICAgaG9zdFROb2RlOiBUTm9kZSwgaG9zdFZpZXc6IExWaWV3LCBjb250ZXh0OiBhbnkpOiBWaWV3RW5naW5lX0NoYW5nZURldGVjdG9yUmVmIHtcbiAgaWYgKGlzQ29tcG9uZW50KGhvc3RUTm9kZSkpIHtcbiAgICBjb25zdCBjb21wb25lbnRJbmRleCA9IGhvc3RUTm9kZS5kaXJlY3RpdmVTdGFydDtcbiAgICBjb25zdCBjb21wb25lbnRWaWV3ID0gZ2V0Q29tcG9uZW50Vmlld0J5SW5kZXgoaG9zdFROb2RlLmluZGV4LCBob3N0Vmlldyk7XG4gICAgcmV0dXJuIG5ldyBWaWV3UmVmKGNvbXBvbmVudFZpZXcsIGNvbnRleHQsIGNvbXBvbmVudEluZGV4KTtcbiAgfSBlbHNlIGlmIChcbiAgICAgIGhvc3RUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCB8fCBob3N0VE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lciB8fFxuICAgICAgaG9zdFROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKSB7XG4gICAgY29uc3QgaG9zdENvbXBvbmVudFZpZXcgPSBmaW5kQ29tcG9uZW50Vmlldyhob3N0Vmlldyk7XG4gICAgcmV0dXJuIG5ldyBWaWV3UmVmKGhvc3RDb21wb25lbnRWaWV3LCBob3N0Q29tcG9uZW50Vmlld1tDT05URVhUXSwgLTEpO1xuICB9XG4gIHJldHVybiBudWxsICE7XG59XG5cbmZ1bmN0aW9uIGdldE9yQ3JlYXRlUmVuZGVyZXIyKHZpZXc6IExWaWV3KTogUmVuZGVyZXIyIHtcbiAgY29uc3QgcmVuZGVyZXIgPSB2aWV3W1JFTkRFUkVSXTtcbiAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgIHJldHVybiByZW5kZXJlciBhcyBSZW5kZXJlcjI7XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgaW5qZWN0IFJlbmRlcmVyMiB3aGVuIHRoZSBhcHBsaWNhdGlvbiB1c2VzIFJlbmRlcmVyMyEnKTtcbiAgfVxufVxuXG4vKiogUmV0dXJucyBhIFJlbmRlcmVyMiAob3IgdGhyb3dzIHdoZW4gYXBwbGljYXRpb24gd2FzIGJvb3RzdHJhcHBlZCB3aXRoIFJlbmRlcmVyMykgKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RSZW5kZXJlcjIoKTogUmVuZGVyZXIyIHtcbiAgcmV0dXJuIGdldE9yQ3JlYXRlUmVuZGVyZXIyKGdldExWaWV3KCkpO1xufVxuIl19