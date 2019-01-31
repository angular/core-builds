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
import { addToViewTree, createEmbeddedViewAndNode, createLContainer, renderEmbeddedTemplate } from './instructions';
import { ACTIVE_INDEX, NATIVE, VIEWS } from './interfaces/container';
import { isProceduralRenderer } from './interfaces/renderer';
import { CONTAINER_INDEX, CONTEXT, HOST_NODE, QUERIES, RENDERER } from './interfaces/view';
import { assertNodeOfPossibleTypes } from './node_assert';
import { addRemoveViewFromContainer, appendChild, detachView, getBeforeNodeForView, insertView, nativeInsertBefore, nativeNextSibling, nativeParentNode, removeView } from './node_manipulation';
import { getLView, getPreviousOrParentTNode } from './state';
import { findComponentView, getComponentViewByIndex, getNativeByTNode, getParentInjectorTNode, getParentInjectorView, hasParentInjector, isComponent, isLContainer, isRootView } from './util';
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
            function TemplateRef_(_declarationParentView, elementRef, _tView, _renderer, _hostLContainer, _injectorIndex) {
                var _this = _super.call(this) || this;
                _this._declarationParentView = _declarationParentView;
                _this.elementRef = elementRef;
                _this._tView = _tView;
                _this._renderer = _renderer;
                _this._hostLContainer = _hostLContainer;
                _this._injectorIndex = _injectorIndex;
                return _this;
            }
            TemplateRef_.prototype.createEmbeddedView = function (context, container, hostTNode, hostView, index) {
                var lView = createEmbeddedViewAndNode(this._tView, context, this._declarationParentView, this._hostLContainer[QUERIES], this._injectorIndex);
                if (container) {
                    insertView(lView, container, hostView, index, hostTNode.index);
                }
                renderEmbeddedTemplate(lView, this._tView, context);
                var viewRef = new ViewRef(lView, context, -1);
                viewRef._tViewNode = lView[HOST_NODE];
                return viewRef;
            };
            return TemplateRef_;
        }(TemplateRefToken));
    }
    if (hostTNode.type === 0 /* Container */) {
        var hostContainer = hostView[hostTNode.index];
        ngDevMode && assertDefined(hostTNode.tViews, 'TView must be allocated');
        return new R3TemplateRef(hostView, createElementRef(ElementRefToken, hostTNode, hostView), hostTNode.tViews, getLView()[RENDERER], hostContainer, hostTNode.injectorIndex);
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
                    .createEmbeddedView(context || {}, this._lContainer, this._hostTNode, this._hostView, adjustedIdx);
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
                insertView(lView, this._lContainer, this._hostView, adjustedIdx, this._hostTNode.index);
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
                this.detach(index);
                this.insert(viewRef, this._adjustIndex(newIndex));
                return viewRef;
            };
            ViewContainerRef_.prototype.indexOf = function (viewRef) { return this._viewRefs.indexOf(viewRef); };
            ViewContainerRef_.prototype.remove = function (index) {
                var adjustedIdx = this._adjustIndex(index, -1);
                removeView(this._lContainer, this._hostTNode, adjustedIdx);
                this._viewRefs.splice(adjustedIdx, 1);
            };
            ViewContainerRef_.prototype.detach = function (index) {
                var adjustedIdx = this._adjustIndex(index, -1);
                var view = detachView(this._lContainer, adjustedIdx, !!this._hostTNode.detached);
                var wasDetached = this._viewRefs.splice(adjustedIdx, 1)[0] != null;
                return wasDetached ? new ViewRef(view, view[CONTEXT], view[CONTAINER_INDEX]) : null;
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
            createLContainer(slotValue, hostView, commentNode, true);
        addToViewTree(hostView, hostTNode.index, lContainer);
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
    else if (hostTNode.type === 3 /* Element */) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld19lbmdpbmVfY29tcGF0aWJpbGl0eS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvdmlld19lbmdpbmVfY29tcGF0aWJpbGl0eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBTUgsT0FBTyxFQUFDLFdBQVcsSUFBSSxzQkFBc0IsRUFBQyxNQUFNLDZCQUE2QixDQUFDO0FBS2xGLE9BQU8sRUFBQyxhQUFhLEVBQUUsaUJBQWlCLEVBQUUsY0FBYyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDaEYsT0FBTyxFQUFDLFlBQVksRUFBRSx5QkFBeUIsRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUM3RCxPQUFPLEVBQUMsYUFBYSxFQUFFLHlCQUF5QixFQUFFLGdCQUFnQixFQUFFLHNCQUFzQixFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDbEgsT0FBTyxFQUFDLFlBQVksRUFBYyxNQUFNLEVBQUUsS0FBSyxFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFFL0UsT0FBTyxFQUFnQyxvQkFBb0IsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQzFGLE9BQU8sRUFBQyxlQUFlLEVBQUUsT0FBTyxFQUFFLFNBQVMsRUFBUyxPQUFPLEVBQUUsUUFBUSxFQUFRLE1BQU0sbUJBQW1CLENBQUM7QUFDdkcsT0FBTyxFQUFDLHlCQUF5QixFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ3hELE9BQU8sRUFBQywwQkFBMEIsRUFBRSxXQUFXLEVBQUUsVUFBVSxFQUFFLG9CQUFvQixFQUFFLFVBQVUsRUFBRSxrQkFBa0IsRUFBRSxpQkFBaUIsRUFBRSxnQkFBZ0IsRUFBRSxVQUFVLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUMvTCxPQUFPLEVBQUMsUUFBUSxFQUFFLHdCQUF3QixFQUFDLE1BQU0sU0FBUyxDQUFDO0FBQzNELE9BQU8sRUFBQyxpQkFBaUIs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UyxDQUFDLEVBQUU7UUFDMUIsSUFBTSxjQUFjLEdBQUcsU0FBUyxDQUFDLGNBQWMsQ0FBQztRQUNoRCxJQUFNLGFBQWEsR0FBRyx1QkFBdUIsQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ3pFLE9BQU8sSUFBSSxPQUFPLENBQUMsYUFBYSxFQUFFLE9BQU8sRUFBRSxjQUFjLENBQUMsQ0FBQztLQUM1RDtTQUFNLElBQUksU0FBUyxDQUFDLElBQUksb0JBQXNCLEVBQUU7UUFDL0MsSUFBTSxpQkFBaUIsR0FBRyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN0RCxPQUFPLElBQUksT0FBTyxDQUFDLGlCQUFpQixFQUFFLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDdkU7SUFDRCxPQUFPLElBQU0sQ0FBQztBQUNoQixDQUFDO0FBRUQsU0FBUyxvQkFBb0IsQ0FBQyxJQUFXO0lBQ3ZDLElBQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNoQyxJQUFJLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxFQUFFO1FBQ2xDLE9BQU8sUUFBcUIsQ0FBQztLQUM5QjtTQUFNO1FBQ0wsTUFBTSxJQUFJLEtBQUssQ0FBQyw4REFBOEQsQ0FBQyxDQUFDO0tBQ2pGO0FBQ0gsQ0FBQztBQUVELHVGQUF1RjtBQUN2RixNQUFNLFVBQVUsZUFBZTtJQUM3QixPQUFPLG9CQUFvQixDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7QUFDMUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtDaGFuZ2VEZXRlY3RvclJlZiBhcyBWaWV3RW5naW5lX0NoYW5nZURldGVjdG9yUmVmfSBmcm9tICcuLi9jaGFuZ2VfZGV0ZWN0aW9uL2NoYW5nZV9kZXRlY3Rvcl9yZWYnO1xuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi4vZGkvaW5qZWN0b3InO1xuaW1wb3J0IHtDb21wb25lbnRGYWN0b3J5IGFzIHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeSwgQ29tcG9uZW50UmVmIGFzIHZpZXdFbmdpbmVfQ29tcG9uZW50UmVmfSBmcm9tICcuLi9saW5rZXIvY29tcG9uZW50X2ZhY3RvcnknO1xuaW1wb3J0IHtFbGVtZW50UmVmIGFzIFZpZXdFbmdpbmVfRWxlbWVudFJlZn0gZnJvbSAnLi4vbGlua2VyL2VsZW1lbnRfcmVmJztcbmltcG9ydCB7TmdNb2R1bGVSZWYgYXMgdmlld0VuZ2luZV9OZ01vZHVsZVJlZn0gZnJvbSAnLi4vbGlua2VyL25nX21vZHVsZV9mYWN0b3J5JztcbmltcG9ydCB7VGVtcGxhdGVSZWYgYXMgVmlld0VuZ2luZV9UZW1wbGF0ZVJlZn0gZnJvbSAnLi4vbGlua2VyL3RlbXBsYXRlX3JlZic7XG5pbXBvcnQge1ZpZXdDb250YWluZXJSZWYgYXMgVmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmfSBmcm9tICcuLi9saW5rZXIvdmlld19jb250YWluZXJfcmVmJztcbmltcG9ydCB7RW1iZWRkZWRWaWV3UmVmIGFzIHZpZXdFbmdpbmVfRW1iZWRkZWRWaWV3UmVmLCBWaWV3UmVmIGFzIHZpZXdFbmdpbmVfVmlld1JlZn0gZnJvbSAnLi4vbGlua2VyL3ZpZXdfcmVmJztcbmltcG9ydCB7UmVuZGVyZXIyfSBmcm9tICcuLi9yZW5kZXIvYXBpJztcbmltcG9ydCB7YXNzZXJ0RGVmaW5lZCwgYXNzZXJ0R3JlYXRlclRoYW4sIGFzc2VydExlc3NUaGFufSBmcm9tICcuLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge05vZGVJbmplY3RvciwgZ2V0UGFyZW50SW5qZWN0b3JMb2NhdGlvbn0gZnJvbSAnLi9kaSc7XG5pbXBvcnQge2FkZFRvVmlld1RyZWUsIGNyZWF0ZUVtYmVkZGVkVmlld0FuZE5vZGUsIGNyZWF0ZUxDb250YWluZXIsIHJlbmRlckVtYmVkZGVkVGVtcGxhdGV9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zJztcbmltcG9ydCB7QUNUSVZFX0lOREVYLCBMQ29udGFpbmVyLCBOQVRJVkUsIFZJRVdTfSBmcm9tICcuL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7VENvbnRhaW5lck5vZGUsIFRFbGVtZW50Q29udGFpbmVyTm9kZSwgVEVsZW1lbnROb2RlLCBUTm9kZSwgVE5vZGVUeXBlLCBUVmlld05vZGV9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7UkNvbW1lbnQsIFJFbGVtZW50LCBSZW5kZXJlcjMsIGlzUHJvY2VkdXJhbFJlbmRlcmVyfSBmcm9tICcuL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtDT05UQUlORVJfSU5ERVgsIENPTlRFWFQsIEhPU1RfTk9ERSwgTFZpZXcsIFFVRVJJRVMsIFJFTkRFUkVSLCBUVmlld30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHthc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzfSBmcm9tICcuL25vZGVfYXNzZXJ0JztcbmltcG9ydCB7YWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIsIGFwcGVuZENoaWxkLCBkZXRhY2hWaWV3LCBnZXRCZWZvcmVOb2RlRm9yVmlldywgaW5zZXJ0VmlldywgbmF0aXZlSW5zZXJ0QmVmb3JlLCBuYXRpdmVOZXh0U2libGluZywgbmF0aXZlUGFyZW50Tm9kZSwgcmVtb3ZlVmlld30gZnJvbSAnLi9ub2RlX21hbmlwdWxhdGlvbic7XG5pbXBvcnQge2dldExWaWV3LCBnZXRQcmV2aW91c09yUGFyZW50VE5vZGV9IGZyb20gJy4vc3RhdGUnO1xuaW1wb3J0IHtmaW5kQ29tcG9uZW50VmlldywgZ2V0Q29tcG9uZW50Vmlld0J5SW5kZXgsIGdldE5hdGl2ZUJ5VE5vZGUsIGdldFBhcmVudEluamVjdG9yVE5vZGUsIGdldFBhcmVudEluamVjdG9yVmlldywgaGFzUGFyZW50SW5qZWN0b3IsIGlzQ29tcG9uZW50LCBpc0xDb250YWluZXIsIGlzUm9vdFZpZXd9IGZyb20gJy4vdXRpbCc7XG5pbXBvcnQge1ZpZXdSZWZ9IGZyb20gJy4vdmlld19yZWYnO1xuXG5cbi8qKlxuICogQ3JlYXRlcyBhbiBFbGVtZW50UmVmIGZyb20gdGhlIG1vc3QgcmVjZW50IG5vZGUuXG4gKlxuICogQHJldHVybnMgVGhlIEVsZW1lbnRSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RFbGVtZW50UmVmKEVsZW1lbnRSZWZUb2tlbjogdHlwZW9mIFZpZXdFbmdpbmVfRWxlbWVudFJlZik6XG4gICAgVmlld0VuZ2luZV9FbGVtZW50UmVmIHtcbiAgcmV0dXJuIGNyZWF0ZUVsZW1lbnRSZWYoRWxlbWVudFJlZlRva2VuLCBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKSwgZ2V0TFZpZXcoKSk7XG59XG5cbmxldCBSM0VsZW1lbnRSZWY6IHtuZXcgKG5hdGl2ZTogUkVsZW1lbnQgfCBSQ29tbWVudCk6IFZpZXdFbmdpbmVfRWxlbWVudFJlZn07XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBFbGVtZW50UmVmIGdpdmVuIGEgbm9kZS5cbiAqXG4gKiBAcGFyYW0gRWxlbWVudFJlZlRva2VuIFRoZSBFbGVtZW50UmVmIHR5cGVcbiAqIEBwYXJhbSB0Tm9kZSBUaGUgbm9kZSBmb3Igd2hpY2ggeW91J2QgbGlrZSBhbiBFbGVtZW50UmVmXG4gKiBAcGFyYW0gdmlldyBUaGUgdmlldyB0byB3aGljaCB0aGUgbm9kZSBiZWxvbmdzXG4gKiBAcmV0dXJucyBUaGUgRWxlbWVudFJlZiBpbnN0YW5jZSB0byB1c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVsZW1lbnRSZWYoXG4gICAgRWxlbWVudFJlZlRva2VuOiB0eXBlb2YgVmlld0VuZ2luZV9FbGVtZW50UmVmLCB0Tm9kZTogVE5vZGUsXG4gICAgdmlldzogTFZpZXcpOiBWaWV3RW5naW5lX0VsZW1lbnRSZWYge1xuICBpZiAoIVIzRWxlbWVudFJlZikge1xuICAgIC8vIFRPRE86IEZpeCBjbGFzcyBuYW1lLCBzaG91bGQgYmUgRWxlbWVudFJlZiwgYnV0IHRoZXJlIGFwcGVhcnMgdG8gYmUgYSByb2xsdXAgYnVnXG4gICAgUjNFbGVtZW50UmVmID0gY2xhc3MgRWxlbWVudFJlZl8gZXh0ZW5kcyBFbGVtZW50UmVmVG9rZW4ge307XG4gIH1cbiAgcmV0dXJuIG5ldyBSM0VsZW1lbnRSZWYoZ2V0TmF0aXZlQnlUTm9kZSh0Tm9kZSwgdmlldykpO1xufVxuXG5sZXQgUjNUZW1wbGF0ZVJlZjoge1xuICBuZXcgKFxuICAgICAgX2RlY2xhcmF0aW9uUGFyZW50VmlldzogTFZpZXcsIGVsZW1lbnRSZWY6IFZpZXdFbmdpbmVfRWxlbWVudFJlZiwgX3RWaWV3OiBUVmlldyxcbiAgICAgIF9yZW5kZXJlcjogUmVuZGVyZXIzLCBfaG9zdExDb250YWluZXI6IExDb250YWluZXIsIF9pbmplY3RvckluZGV4OiBudW1iZXIpOlxuICAgICAgVmlld0VuZ2luZV9UZW1wbGF0ZVJlZjxhbnk+XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBUZW1wbGF0ZVJlZiBnaXZlbiBhIG5vZGUuXG4gKlxuICogQHJldHVybnMgVGhlIFRlbXBsYXRlUmVmIGluc3RhbmNlIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0VGVtcGxhdGVSZWY8VD4oXG4gICAgVGVtcGxhdGVSZWZUb2tlbjogdHlwZW9mIFZpZXdFbmdpbmVfVGVtcGxhdGVSZWYsXG4gICAgRWxlbWVudFJlZlRva2VuOiB0eXBlb2YgVmlld0VuZ2luZV9FbGVtZW50UmVmKTogVmlld0VuZ2luZV9UZW1wbGF0ZVJlZjxUPnxudWxsIHtcbiAgcmV0dXJuIGNyZWF0ZVRlbXBsYXRlUmVmPFQ+KFxuICAgICAgVGVtcGxhdGVSZWZUb2tlbiwgRWxlbWVudFJlZlRva2VuLCBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKSwgZ2V0TFZpZXcoKSk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIFRlbXBsYXRlUmVmIGFuZCBzdG9yZXMgaXQgb24gdGhlIGluamVjdG9yLlxuICpcbiAqIEBwYXJhbSBUZW1wbGF0ZVJlZlRva2VuIFRoZSBUZW1wbGF0ZVJlZiB0eXBlXG4gKiBAcGFyYW0gRWxlbWVudFJlZlRva2VuIFRoZSBFbGVtZW50UmVmIHR5cGVcbiAqIEBwYXJhbSBob3N0VE5vZGUgVGhlIG5vZGUgdGhhdCBpcyByZXF1ZXN0aW5nIGEgVGVtcGxhdGVSZWZcbiAqIEBwYXJhbSBob3N0VmlldyBUaGUgdmlldyB0byB3aGljaCB0aGUgbm9kZSBiZWxvbmdzXG4gKiBAcmV0dXJucyBUaGUgVGVtcGxhdGVSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUZW1wbGF0ZVJlZjxUPihcbiAgICBUZW1wbGF0ZVJlZlRva2VuOiB0eXBlb2YgVmlld0VuZ2luZV9UZW1wbGF0ZVJlZiwgRWxlbWVudFJlZlRva2VuOiB0eXBlb2YgVmlld0VuZ2luZV9FbGVtZW50UmVmLFxuICAgIGhvc3RUTm9kZTogVE5vZGUsIGhvc3RWaWV3OiBMVmlldyk6IFZpZXdFbmdpbmVfVGVtcGxhdGVSZWY8VD58bnVsbCB7XG4gIGlmICghUjNUZW1wbGF0ZVJlZikge1xuICAgIC8vIFRPRE86IEZpeCBjbGFzcyBuYW1lLCBzaG91bGQgYmUgVGVtcGxhdGVSZWYsIGJ1dCB0aGVyZSBhcHBlYXJzIHRvIGJlIGEgcm9sbHVwIGJ1Z1xuICAgIFIzVGVtcGxhdGVSZWYgPSBjbGFzcyBUZW1wbGF0ZVJlZl88VD4gZXh0ZW5kcyBUZW1wbGF0ZVJlZlRva2VuPFQ+IHtcbiAgICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICAgIHByaXZhdGUgX2RlY2xhcmF0aW9uUGFyZW50VmlldzogTFZpZXcsIHJlYWRvbmx5IGVsZW1lbnRSZWY6IFZpZXdFbmdpbmVfRWxlbWVudFJlZixcbiAgICAgICAgICBwcml2YXRlIF90VmlldzogVFZpZXcsIHByaXZhdGUgX3JlbmRlcmVyOiBSZW5kZXJlcjMsIHByaXZhdGUgX2hvc3RMQ29udGFpbmVyOiBMQ29udGFpbmVyLFxuICAgICAgICAgIHByaXZhdGUgX2luamVjdG9ySW5kZXg6IG51bWJlcikge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgfVxuXG4gICAgICBjcmVhdGVFbWJlZGRlZFZpZXcoXG4gICAgICAgICAgY29udGV4dDogVCwgY29udGFpbmVyPzogTENvbnRhaW5lcixcbiAgICAgICAgICBob3N0VE5vZGU/OiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlLCBob3N0Vmlldz86IExWaWV3LFxuICAgICAgICAgIGluZGV4PzogbnVtYmVyKTogdmlld0VuZ2luZV9FbWJlZGRlZFZpZXdSZWY8VD4ge1xuICAgICAgICBjb25zdCBsVmlldyA9IGNyZWF0ZUVtYmVkZGVkVmlld0FuZE5vZGUoXG4gICAgICAgICAgICB0aGlzLl90VmlldywgY29udGV4dCwgdGhpcy5fZGVjbGFyYXRpb25QYXJlbnRWaWV3LCB0aGlzLl9ob3N0TENvbnRhaW5lcltRVUVSSUVTXSxcbiAgICAgICAgICAgIHRoaXMuX2luamVjdG9ySW5kZXgpO1xuICAgICAgICBpZiAoY29udGFpbmVyKSB7XG4gICAgICAgICAgaW5zZXJ0VmlldyhsVmlldywgY29udGFpbmVyLCBob3N0VmlldyAhLCBpbmRleCAhLCBob3N0VE5vZGUgIS5pbmRleCk7XG4gICAgICAgIH1cbiAgICAgICAgcmVuZGVyRW1iZWRkZWRUZW1wbGF0ZShsVmlldywgdGhpcy5fdFZpZXcsIGNvbnRleHQpO1xuICAgICAgICBjb25zdCB2aWV3UmVmID0gbmV3IFZpZXdSZWYobFZpZXcsIGNvbnRleHQsIC0xKTtcbiAgICAgICAgdmlld1JlZi5fdFZpZXdOb2RlID0gbFZpZXdbSE9TVF9OT0RFXSBhcyBUVmlld05vZGU7XG4gICAgICAgIHJldHVybiB2aWV3UmVmO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBpZiAoaG9zdFROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Db250YWluZXIpIHtcbiAgICBjb25zdCBob3N0Q29udGFpbmVyOiBMQ29udGFpbmVyID0gaG9zdFZpZXdbaG9zdFROb2RlLmluZGV4XTtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChob3N0VE5vZGUudFZpZXdzLCAnVFZpZXcgbXVzdCBiZSBhbGxvY2F0ZWQnKTtcbiAgICByZXR1cm4gbmV3IFIzVGVtcGxhdGVSZWYoXG4gICAgICAgIGhvc3RWaWV3LCBjcmVhdGVFbGVtZW50UmVmKEVsZW1lbnRSZWZUb2tlbiwgaG9zdFROb2RlLCBob3N0VmlldyksIGhvc3RUTm9kZS50Vmlld3MgYXMgVFZpZXcsXG4gICAgICAgIGdldExWaWV3KClbUkVOREVSRVJdLCBob3N0Q29udGFpbmVyLCBob3N0VE5vZGUuaW5qZWN0b3JJbmRleCk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxubGV0IFIzVmlld0NvbnRhaW5lclJlZjoge1xuICBuZXcgKFxuICAgICAgbENvbnRhaW5lcjogTENvbnRhaW5lciwgaG9zdFROb2RlOiBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSxcbiAgICAgIGhvc3RWaWV3OiBMVmlldyk6IFZpZXdFbmdpbmVfVmlld0NvbnRhaW5lclJlZlxufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgVmlld0NvbnRhaW5lclJlZiBhbmQgc3RvcmVzIGl0IG9uIHRoZSBpbmplY3Rvci4gT3IsIGlmIHRoZSBWaWV3Q29udGFpbmVyUmVmXG4gKiBhbHJlYWR5IGV4aXN0cywgcmV0cmlldmVzIHRoZSBleGlzdGluZyBWaWV3Q29udGFpbmVyUmVmLlxuICpcbiAqIEByZXR1cm5zIFRoZSBWaWV3Q29udGFpbmVyUmVmIGluc3RhbmNlIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0Vmlld0NvbnRhaW5lclJlZihcbiAgICBWaWV3Q29udGFpbmVyUmVmVG9rZW46IHR5cGVvZiBWaWV3RW5naW5lX1ZpZXdDb250YWluZXJSZWYsXG4gICAgRWxlbWVudFJlZlRva2VuOiB0eXBlb2YgVmlld0VuZ2luZV9FbGVtZW50UmVmKTogVmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmIHtcbiAgY29uc3QgcHJldmlvdXNUTm9kZSA9XG4gICAgICBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKSBhcyBURWxlbWVudE5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGUgfCBUQ29udGFpbmVyTm9kZTtcbiAgcmV0dXJuIGNyZWF0ZUNvbnRhaW5lclJlZihWaWV3Q29udGFpbmVyUmVmVG9rZW4sIEVsZW1lbnRSZWZUb2tlbiwgcHJldmlvdXNUTm9kZSwgZ2V0TFZpZXcoKSk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIFZpZXdDb250YWluZXJSZWYgYW5kIHN0b3JlcyBpdCBvbiB0aGUgaW5qZWN0b3IuXG4gKlxuICogQHBhcmFtIFZpZXdDb250YWluZXJSZWZUb2tlbiBUaGUgVmlld0NvbnRhaW5lclJlZiB0eXBlXG4gKiBAcGFyYW0gRWxlbWVudFJlZlRva2VuIFRoZSBFbGVtZW50UmVmIHR5cGVcbiAqIEBwYXJhbSBob3N0VE5vZGUgVGhlIG5vZGUgdGhhdCBpcyByZXF1ZXN0aW5nIGEgVmlld0NvbnRhaW5lclJlZlxuICogQHBhcmFtIGhvc3RWaWV3IFRoZSB2aWV3IHRvIHdoaWNoIHRoZSBub2RlIGJlbG9uZ3NcbiAqIEByZXR1cm5zIFRoZSBWaWV3Q29udGFpbmVyUmVmIGluc3RhbmNlIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQ29udGFpbmVyUmVmKFxuICAgIFZpZXdDb250YWluZXJSZWZUb2tlbjogdHlwZW9mIFZpZXdFbmdpbmVfVmlld0NvbnRhaW5lclJlZixcbiAgICBFbGVtZW50UmVmVG9rZW46IHR5cGVvZiBWaWV3RW5naW5lX0VsZW1lbnRSZWYsXG4gICAgaG9zdFROb2RlOiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlLFxuICAgIGhvc3RWaWV3OiBMVmlldyk6IFZpZXdFbmdpbmVfVmlld0NvbnRhaW5lclJlZiB7XG4gIGlmICghUjNWaWV3Q29udGFpbmVyUmVmKSB7XG4gICAgLy8gVE9ETzogRml4IGNsYXNzIG5hbWUsIHNob3VsZCBiZSBWaWV3Q29udGFpbmVyUmVmLCBidXQgdGhlcmUgYXBwZWFycyB0byBiZSBhIHJvbGx1cCBidWdcbiAgICBSM1ZpZXdDb250YWluZXJSZWYgPSBjbGFzcyBWaWV3Q29udGFpbmVyUmVmXyBleHRlbmRzIFZpZXdDb250YWluZXJSZWZUb2tlbiB7XG4gICAgICBwcml2YXRlIF92aWV3UmVmczogdmlld0VuZ2luZV9WaWV3UmVmW10gPSBbXTtcblxuICAgICAgY29uc3RydWN0b3IoXG4gICAgICAgICAgcHJpdmF0ZSBfbENvbnRhaW5lcjogTENvbnRhaW5lcixcbiAgICAgICAgICBwcml2YXRlIF9ob3N0VE5vZGU6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxURWxlbWVudENvbnRhaW5lck5vZGUsXG4gICAgICAgICAgcHJpdmF0ZSBfaG9zdFZpZXc6IExWaWV3KSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICB9XG5cbiAgICAgIGdldCBlbGVtZW50KCk6IFZpZXdFbmdpbmVfRWxlbWVudFJlZiB7XG4gICAgICAgIHJldHVybiBjcmVhdGVFbGVtZW50UmVmKEVsZW1lbnRSZWZUb2tlbiwgdGhpcy5faG9zdFROb2RlLCB0aGlzLl9ob3N0Vmlldyk7XG4gICAgICB9XG5cbiAgICAgIGdldCBpbmplY3RvcigpOiBJbmplY3RvciB7IHJldHVybiBuZXcgTm9kZUluamVjdG9yKHRoaXMuX2hvc3RUTm9kZSwgdGhpcy5faG9zdFZpZXcpOyB9XG5cbiAgICAgIC8qKiBAZGVwcmVjYXRlZCBObyByZXBsYWNlbWVudCAqL1xuICAgICAgZ2V0IHBhcmVudEluamVjdG9yKCk6IEluamVjdG9yIHtcbiAgICAgICAgY29uc3QgcGFyZW50TG9jYXRpb24gPSBnZXRQYXJlbnRJbmplY3RvckxvY2F0aW9uKHRoaXMuX2hvc3RUTm9kZSwgdGhpcy5faG9zdFZpZXcpO1xuICAgICAgICBjb25zdCBwYXJlbnRWaWV3ID0gZ2V0UGFyZW50SW5qZWN0b3JWaWV3KHBhcmVudExvY2F0aW9uLCB0aGlzLl9ob3N0Vmlldyk7XG4gICAgICAgIGNvbnN0IHBhcmVudFROb2RlID0gZ2V0UGFyZW50SW5qZWN0b3JUTm9kZShwYXJlbnRMb2NhdGlvbiwgdGhpcy5faG9zdFZpZXcsIHRoaXMuX2hvc3RUTm9kZSk7XG5cbiAgICAgICAgcmV0dXJuICFoYXNQYXJlbnRJbmplY3RvcihwYXJlbnRMb2NhdGlvbikgfHwgcGFyZW50VE5vZGUgPT0gbnVsbCA/XG4gICAgICAgICAgICBuZXcgTm9kZUluamVjdG9yKG51bGwsIHRoaXMuX2hvc3RWaWV3KSA6XG4gICAgICAgICAgICBuZXcgTm9kZUluamVjdG9yKHBhcmVudFROb2RlLCBwYXJlbnRWaWV3KTtcbiAgICAgIH1cblxuICAgICAgY2xlYXIoKTogdm9pZCB7XG4gICAgICAgIHdoaWxlICh0aGlzLl9sQ29udGFpbmVyW1ZJRVdTXS5sZW5ndGgpIHtcbiAgICAgICAgICB0aGlzLnJlbW92ZSgwKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBnZXQoaW5kZXg6IG51bWJlcik6IHZpZXdFbmdpbmVfVmlld1JlZnxudWxsIHsgcmV0dXJuIHRoaXMuX3ZpZXdSZWZzW2luZGV4XSB8fCBudWxsOyB9XG5cbiAgICAgIGdldCBsZW5ndGgoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuX2xDb250YWluZXJbVklFV1NdLmxlbmd0aDsgfVxuXG4gICAgICBjcmVhdGVFbWJlZGRlZFZpZXc8Qz4odGVtcGxhdGVSZWY6IFZpZXdFbmdpbmVfVGVtcGxhdGVSZWY8Qz4sIGNvbnRleHQ/OiBDLCBpbmRleD86IG51bWJlcik6XG4gICAgICAgICAgdmlld0VuZ2luZV9FbWJlZGRlZFZpZXdSZWY8Qz4ge1xuICAgICAgICBjb25zdCBhZGp1c3RlZElkeCA9IHRoaXMuX2FkanVzdEluZGV4KGluZGV4KTtcbiAgICAgICAgY29uc3Qgdmlld1JlZiA9ICh0ZW1wbGF0ZVJlZiBhcyBhbnkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmNyZWF0ZUVtYmVkZGVkVmlldyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dCB8fCA8YW55Pnt9LCB0aGlzLl9sQ29udGFpbmVyLCB0aGlzLl9ob3N0VE5vZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2hvc3RWaWV3LCBhZGp1c3RlZElkeCk7XG4gICAgICAgICh2aWV3UmVmIGFzIFZpZXdSZWY8YW55PikuYXR0YWNoVG9WaWV3Q29udGFpbmVyUmVmKHRoaXMpO1xuICAgICAgICB0aGlzLl92aWV3UmVmcy5zcGxpY2UoYWRqdXN0ZWRJZHgsIDAsIHZpZXdSZWYpO1xuICAgICAgICByZXR1cm4gdmlld1JlZjtcbiAgICAgIH1cblxuICAgICAgY3JlYXRlQ29tcG9uZW50PEM+KFxuICAgICAgICAgIGNvbXBvbmVudEZhY3Rvcnk6IHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeTxDPiwgaW5kZXg/OiBudW1iZXJ8dW5kZWZpbmVkLFxuICAgICAgICAgIGluamVjdG9yPzogSW5qZWN0b3J8dW5kZWZpbmVkLCBwcm9qZWN0YWJsZU5vZGVzPzogYW55W11bXXx1bmRlZmluZWQsXG4gICAgICAgICAgbmdNb2R1bGVSZWY/OiB2aWV3RW5naW5lX05nTW9kdWxlUmVmPGFueT58dW5kZWZpbmVkKTogdmlld0VuZ2luZV9Db21wb25lbnRSZWY8Qz4ge1xuICAgICAgICBjb25zdCBjb250ZXh0SW5qZWN0b3IgPSBpbmplY3RvciB8fCB0aGlzLnBhcmVudEluamVjdG9yO1xuICAgICAgICBpZiAoIW5nTW9kdWxlUmVmICYmIChjb21wb25lbnRGYWN0b3J5IGFzIGFueSkubmdNb2R1bGUgPT0gbnVsbCAmJiBjb250ZXh0SW5qZWN0b3IpIHtcbiAgICAgICAgICBuZ01vZHVsZVJlZiA9IGNvbnRleHRJbmplY3Rvci5nZXQodmlld0VuZ2luZV9OZ01vZHVsZVJlZiwgbnVsbCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjb21wb25lbnRSZWYgPVxuICAgICAgICAgICAgY29tcG9uZW50RmFjdG9yeS5jcmVhdGUoY29udGV4dEluamVjdG9yLCBwcm9qZWN0YWJsZU5vZGVzLCB1bmRlZmluZWQsIG5nTW9kdWxlUmVmKTtcbiAgICAgICAgdGhpcy5pbnNlcnQoY29tcG9uZW50UmVmLmhvc3RWaWV3LCBpbmRleCk7XG4gICAgICAgIHJldHVybiBjb21wb25lbnRSZWY7XG4gICAgICB9XG5cbiAgICAgIGluc2VydCh2aWV3UmVmOiB2aWV3RW5naW5lX1ZpZXdSZWYsIGluZGV4PzogbnVtYmVyKTogdmlld0VuZ2luZV9WaWV3UmVmIHtcbiAgICAgICAgaWYgKHZpZXdSZWYuZGVzdHJveWVkKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgaW5zZXJ0IGEgZGVzdHJveWVkIFZpZXcgaW4gYSBWaWV3Q29udGFpbmVyIScpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGxWaWV3ID0gKHZpZXdSZWYgYXMgVmlld1JlZjxhbnk+KS5fbFZpZXcgITtcbiAgICAgICAgY29uc3QgYWRqdXN0ZWRJZHggPSB0aGlzLl9hZGp1c3RJbmRleChpbmRleCk7XG5cbiAgICAgICAgaW5zZXJ0VmlldyhsVmlldywgdGhpcy5fbENvbnRhaW5lciwgdGhpcy5faG9zdFZpZXcsIGFkanVzdGVkSWR4LCB0aGlzLl9ob3N0VE5vZGUuaW5kZXgpO1xuXG4gICAgICAgIGNvbnN0IGJlZm9yZU5vZGUgPVxuICAgICAgICAgICAgZ2V0QmVmb3JlTm9kZUZvclZpZXcoYWRqdXN0ZWRJZHgsIHRoaXMuX2xDb250YWluZXJbVklFV1NdLCB0aGlzLl9sQ29udGFpbmVyW05BVElWRV0pO1xuICAgICAgICBhZGRSZW1vdmVWaWV3RnJvbUNvbnRhaW5lcihsVmlldywgdHJ1ZSwgYmVmb3JlTm9kZSk7XG5cbiAgICAgICAgKHZpZXdSZWYgYXMgVmlld1JlZjxhbnk+KS5hdHRhY2hUb1ZpZXdDb250YWluZXJSZWYodGhpcyk7XG4gICAgICAgIHRoaXMuX3ZpZXdSZWZzLnNwbGljZShhZGp1c3RlZElkeCwgMCwgdmlld1JlZik7XG5cbiAgICAgICAgcmV0dXJuIHZpZXdSZWY7XG4gICAgICB9XG5cbiAgICAgIG1vdmUodmlld1JlZjogdmlld0VuZ2luZV9WaWV3UmVmLCBuZXdJbmRleDogbnVtYmVyKTogdmlld0VuZ2luZV9WaWV3UmVmIHtcbiAgICAgICAgaWYgKHZpZXdSZWYuZGVzdHJveWVkKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgbW92ZSBhIGRlc3Ryb3llZCBWaWV3IGluIGEgVmlld0NvbnRhaW5lciEnKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMuaW5kZXhPZih2aWV3UmVmKTtcbiAgICAgICAgdGhpcy5kZXRhY2goaW5kZXgpO1xuICAgICAgICB0aGlzLmluc2VydCh2aWV3UmVmLCB0aGlzLl9hZGp1c3RJbmRleChuZXdJbmRleCkpO1xuICAgICAgICByZXR1cm4gdmlld1JlZjtcbiAgICAgIH1cblxuICAgICAgaW5kZXhPZih2aWV3UmVmOiB2aWV3RW5naW5lX1ZpZXdSZWYpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5fdmlld1JlZnMuaW5kZXhPZih2aWV3UmVmKTsgfVxuXG4gICAgICByZW1vdmUoaW5kZXg/OiBudW1iZXIpOiB2b2lkIHtcbiAgICAgICAgY29uc3QgYWRqdXN0ZWRJZHggPSB0aGlzLl9hZGp1c3RJbmRleChpbmRleCwgLTEpO1xuICAgICAgICByZW1vdmVWaWV3KHRoaXMuX2xDb250YWluZXIsIHRoaXMuX2hvc3RUTm9kZSwgYWRqdXN0ZWRJZHgpO1xuICAgICAgICB0aGlzLl92aWV3UmVmcy5zcGxpY2UoYWRqdXN0ZWRJZHgsIDEpO1xuICAgICAgfVxuXG4gICAgICBkZXRhY2goaW5kZXg/OiBudW1iZXIpOiB2aWV3RW5naW5lX1ZpZXdSZWZ8bnVsbCB7XG4gICAgICAgIGNvbnN0IGFkanVzdGVkSWR4ID0gdGhpcy5fYWRqdXN0SW5kZXgoaW5kZXgsIC0xKTtcbiAgICAgICAgY29uc3QgdmlldyA9IGRldGFjaFZpZXcodGhpcy5fbENvbnRhaW5lciwgYWRqdXN0ZWRJZHgsICEhdGhpcy5faG9zdFROb2RlLmRldGFjaGVkKTtcbiAgICAgICAgY29uc3Qgd2FzRGV0YWNoZWQgPSB0aGlzLl92aWV3UmVmcy5zcGxpY2UoYWRqdXN0ZWRJZHgsIDEpWzBdICE9IG51bGw7XG4gICAgICAgIHJldHVybiB3YXNEZXRhY2hlZCA/IG5ldyBWaWV3UmVmKHZpZXcsIHZpZXdbQ09OVEVYVF0sIHZpZXdbQ09OVEFJTkVSX0lOREVYXSkgOiBudWxsO1xuICAgICAgfVxuXG4gICAgICBwcml2YXRlIF9hZGp1c3RJbmRleChpbmRleD86IG51bWJlciwgc2hpZnQ6IG51bWJlciA9IDApIHtcbiAgICAgICAgaWYgKGluZGV4ID09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5fbENvbnRhaW5lcltWSUVXU10ubGVuZ3RoICsgc2hpZnQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgICAgIGFzc2VydEdyZWF0ZXJUaGFuKGluZGV4LCAtMSwgJ2luZGV4IG11c3QgYmUgcG9zaXRpdmUnKTtcbiAgICAgICAgICAvLyArMSBiZWNhdXNlIGl0J3MgbGVnYWwgdG8gaW5zZXJ0IGF0IHRoZSBlbmQuXG4gICAgICAgICAgYXNzZXJ0TGVzc1RoYW4oaW5kZXgsIHRoaXMuX2xDb250YWluZXJbVklFV1NdLmxlbmd0aCArIDEgKyBzaGlmdCwgJ2luZGV4Jyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGluZGV4O1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlcyhcbiAgICAgICAgICAgICAgICAgICBob3N0VE5vZGUsIFROb2RlVHlwZS5Db250YWluZXIsIFROb2RlVHlwZS5FbGVtZW50LCBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcik7XG5cbiAgbGV0IGxDb250YWluZXI6IExDb250YWluZXI7XG4gIGNvbnN0IHNsb3RWYWx1ZSA9IGhvc3RWaWV3W2hvc3RUTm9kZS5pbmRleF07XG4gIGlmIChpc0xDb250YWluZXIoc2xvdFZhbHVlKSkge1xuICAgIC8vIElmIHRoZSBob3N0IGlzIGEgY29udGFpbmVyLCB3ZSBkb24ndCBuZWVkIHRvIGNyZWF0ZSBhIG5ldyBMQ29udGFpbmVyXG4gICAgbENvbnRhaW5lciA9IHNsb3RWYWx1ZTtcbiAgICBsQ29udGFpbmVyW0FDVElWRV9JTkRFWF0gPSAtMTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBjb21tZW50Tm9kZSA9IGhvc3RWaWV3W1JFTkRFUkVSXS5jcmVhdGVDb21tZW50KG5nRGV2TW9kZSA/ICdjb250YWluZXInIDogJycpO1xuICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJDcmVhdGVDb21tZW50Kys7XG5cbiAgICAvLyBBIGNvbnRhaW5lciBjYW4gYmUgY3JlYXRlZCBvbiB0aGUgcm9vdCAodG9wbW9zdCAvIGJvb3RzdHJhcHBlZCkgY29tcG9uZW50IGFuZCBpbiB0aGlzIGNhc2Ugd2VcbiAgICAvLyBjYW4ndCB1c2UgTFRyZWUgdG8gaW5zZXJ0IGNvbnRhaW5lcidzIG1hcmtlciBub2RlIChib3RoIHBhcmVudCBvZiBhIGNvbW1lbnQgbm9kZSBhbmQgdGhlXG4gICAgLy8gY29tbWVuZCBub2RlIGl0c2VsZiBpcyBsb2NhdGVkIG91dHNpZGUgb2YgZWxlbWVudHMgaG9sZCBieSBMVHJlZSkuIEluIHRoaXMgc3BlY2lmaWMgY2FzZSB3ZVxuICAgIC8vIHVzZSBsb3ctbGV2ZWwgRE9NIG1hbmlwdWxhdGlvbiB0byBpbnNlcnQgY29udGFpbmVyJ3MgbWFya2VyIChjb21tZW50KSBub2RlLlxuICAgIGlmIChpc1Jvb3RWaWV3KGhvc3RWaWV3KSkge1xuICAgICAgY29uc3QgcmVuZGVyZXIgPSBob3N0Vmlld1tSRU5ERVJFUl07XG4gICAgICBjb25zdCBob3N0TmF0aXZlID0gZ2V0TmF0aXZlQnlUTm9kZShob3N0VE5vZGUsIGhvc3RWaWV3KSAhO1xuICAgICAgY29uc3QgcGFyZW50T2ZIb3N0TmF0aXZlID0gbmF0aXZlUGFyZW50Tm9kZShyZW5kZXJlciwgaG9zdE5hdGl2ZSk7XG4gICAgICBuYXRpdmVJbnNlcnRCZWZvcmUoXG4gICAgICAgICAgcmVuZGVyZXIsIHBhcmVudE9mSG9zdE5hdGl2ZSAhLCBjb21tZW50Tm9kZSwgbmF0aXZlTmV4dFNpYmxpbmcocmVuZGVyZXIsIGhvc3ROYXRpdmUpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYXBwZW5kQ2hpbGQoY29tbWVudE5vZGUsIGhvc3RUTm9kZSwgaG9zdFZpZXcpO1xuICAgIH1cblxuICAgIGhvc3RWaWV3W2hvc3RUTm9kZS5pbmRleF0gPSBsQ29udGFpbmVyID1cbiAgICAgICAgY3JlYXRlTENvbnRhaW5lcihzbG90VmFsdWUsIGhvc3RWaWV3LCBjb21tZW50Tm9kZSwgdHJ1ZSk7XG5cbiAgICBhZGRUb1ZpZXdUcmVlKGhvc3RWaWV3LCBob3N0VE5vZGUuaW5kZXggYXMgbnVtYmVyLCBsQ29udGFpbmVyKTtcbiAgfVxuXG4gIHJldHVybiBuZXcgUjNWaWV3Q29udGFpbmVyUmVmKGxDb250YWluZXIsIGhvc3RUTm9kZSwgaG9zdFZpZXcpO1xufVxuXG5cbi8qKiBSZXR1cm5zIGEgQ2hhbmdlRGV0ZWN0b3JSZWYgKGEuay5hLiBhIFZpZXdSZWYpICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0Q2hhbmdlRGV0ZWN0b3JSZWYoKTogVmlld0VuZ2luZV9DaGFuZ2VEZXRlY3RvclJlZiB7XG4gIHJldHVybiBjcmVhdGVWaWV3UmVmKGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpLCBnZXRMVmlldygpLCBudWxsKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgVmlld1JlZiBhbmQgc3RvcmVzIGl0IG9uIHRoZSBpbmplY3RvciBhcyBDaGFuZ2VEZXRlY3RvclJlZiAocHVibGljIGFsaWFzKS5cbiAqXG4gKiBAcGFyYW0gaG9zdFROb2RlIFRoZSBub2RlIHRoYXQgaXMgcmVxdWVzdGluZyBhIENoYW5nZURldGVjdG9yUmVmXG4gKiBAcGFyYW0gaG9zdFZpZXcgVGhlIHZpZXcgdG8gd2hpY2ggdGhlIG5vZGUgYmVsb25nc1xuICogQHBhcmFtIGNvbnRleHQgVGhlIGNvbnRleHQgZm9yIHRoaXMgY2hhbmdlIGRldGVjdG9yIHJlZlxuICogQHJldHVybnMgVGhlIENoYW5nZURldGVjdG9yUmVmIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVmlld1JlZihcbiAgICBob3N0VE5vZGU6IFROb2RlLCBob3N0VmlldzogTFZpZXcsIGNvbnRleHQ6IGFueSk6IFZpZXdFbmdpbmVfQ2hhbmdlRGV0ZWN0b3JSZWYge1xuICBpZiAoaXNDb21wb25lbnQoaG9zdFROb2RlKSkge1xuICAgIGNvbnN0IGNvbXBvbmVudEluZGV4ID0gaG9zdFROb2RlLmRpcmVjdGl2ZVN0YXJ0O1xuICAgIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBnZXRDb21wb25lbnRWaWV3QnlJbmRleChob3N0VE5vZGUuaW5kZXgsIGhvc3RWaWV3KTtcbiAgICByZXR1cm4gbmV3IFZpZXdSZWYoY29tcG9uZW50VmlldywgY29udGV4dCwgY29tcG9uZW50SW5kZXgpO1xuICB9IGVsc2UgaWYgKGhvc3RUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCkge1xuICAgIGNvbnN0IGhvc3RDb21wb25lbnRWaWV3ID0gZmluZENvbXBvbmVudFZpZXcoaG9zdFZpZXcpO1xuICAgIHJldHVybiBuZXcgVmlld1JlZihob3N0Q29tcG9uZW50VmlldywgaG9zdENvbXBvbmVudFZpZXdbQ09OVEVYVF0sIC0xKTtcbiAgfVxuICByZXR1cm4gbnVsbCAhO1xufVxuXG5mdW5jdGlvbiBnZXRPckNyZWF0ZVJlbmRlcmVyMih2aWV3OiBMVmlldyk6IFJlbmRlcmVyMiB7XG4gIGNvbnN0IHJlbmRlcmVyID0gdmlld1tSRU5ERVJFUl07XG4gIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICByZXR1cm4gcmVuZGVyZXIgYXMgUmVuZGVyZXIyO1xuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGluamVjdCBSZW5kZXJlcjIgd2hlbiB0aGUgYXBwbGljYXRpb24gdXNlcyBSZW5kZXJlcjMhJyk7XG4gIH1cbn1cblxuLyoqIFJldHVybnMgYSBSZW5kZXJlcjIgKG9yIHRocm93cyB3aGVuIGFwcGxpY2F0aW9uIHdhcyBib290c3RyYXBwZWQgd2l0aCBSZW5kZXJlcjMpICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0UmVuZGVyZXIyKCk6IFJlbmRlcmVyMiB7XG4gIHJldHVybiBnZXRPckNyZWF0ZVJlbmRlcmVyMihnZXRMVmlldygpKTtcbn1cbiJdfQ==