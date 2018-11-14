/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { NullInjector } from '../di/injector';
import { NgModuleRef as viewEngine_NgModuleRef } from '../linker/ng_module_factory';
import { assertDefined, assertGreaterThan, assertLessThan } from './assert';
import { getOrCreateInjectable, getParentInjectorLocation } from './di';
import { addToViewTree, createEmbeddedViewAndNode, createLContainer, renderEmbeddedTemplate } from './instructions';
import { ACTIVE_INDEX, NATIVE, VIEWS } from './interfaces/container';
import { isProceduralRenderer } from './interfaces/renderer';
import { CONTEXT, HOST_NODE, QUERIES, RENDERER } from './interfaces/view';
import { assertNodeOfPossibleTypes } from './node_assert';
import { addRemoveViewFromContainer, appendChild, detachView, findComponentView, getBeforeNodeForView, insertView, nativeInsertBefore, nativeNextSibling, nativeParentNode, removeView } from './node_manipulation';
import { getPreviousOrParentTNode, getRenderer, getViewData } from './state';
import { getComponentViewByIndex, getNativeByTNode, getParentInjectorTNode, getParentInjectorView, hasParentInjector, isComponent, isLContainer, isRootView } from './util';
import { ViewRef } from './view_ref';
/**
 * Creates an ElementRef from the most recent node.
 *
 * @returns The ElementRef instance to use
 */
export function injectElementRef(ElementRefToken) {
    return createElementRef(ElementRefToken, getPreviousOrParentTNode(), getViewData());
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
    return createTemplateRef(TemplateRefToken, ElementRefToken, getPreviousOrParentTNode(), getViewData());
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
            function TemplateRef_(_declarationParentView, elementRef, _tView, _renderer, _queries, _injectorIndex) {
                var _this = _super.call(this) || this;
                _this._declarationParentView = _declarationParentView;
                _this.elementRef = elementRef;
                _this._tView = _tView;
                _this._renderer = _renderer;
                _this._queries = _queries;
                _this._injectorIndex = _injectorIndex;
                return _this;
            }
            TemplateRef_.prototype.createEmbeddedView = function (context, container, hostTNode, hostView, index) {
                var lView = createEmbeddedViewAndNode(this._tView, context, this._declarationParentView, this._renderer, this._queries, this._injectorIndex);
                if (container) {
                    insertView(lView, container, hostView, index, hostTNode.index);
                }
                renderEmbeddedTemplate(lView, this._tView, context, 1 /* Create */);
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
        return new R3TemplateRef(hostView, createElementRef(ElementRefToken, hostTNode, hostView), hostTNode.tViews, getRenderer(), hostContainer[QUERIES], hostTNode.injectorIndex);
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
    return createContainerRef(ViewContainerRefToken, ElementRefToken, previousTNode, getViewData());
}
var NodeInjector = /** @class */ (function () {
    function NodeInjector(_tNode, _hostView) {
        this._tNode = _tNode;
        this._hostView = _hostView;
    }
    NodeInjector.prototype.get = function (token, notFoundValue) {
        return getOrCreateInjectable(this._tNode, this._hostView, token, 0 /* Default */, notFoundValue);
    };
    return NodeInjector;
}());
export { NodeInjector };
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
                        new NullInjector() :
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
                if (!ngModuleRef && contextInjector) {
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
                var lView = viewRef._view;
                var adjustedIdx = this._adjustIndex(index);
                insertView(lView, this._lContainer, this._hostView, adjustedIdx, this._hostTNode.index);
                var beforeNode = getBeforeNodeForView(adjustedIdx, this._lContainer[VIEWS], this._lContainer[NATIVE]);
                addRemoveViewFromContainer(lView, true, beforeNode);
                viewRef.attachToViewContainerRef(this);
                this._viewRefs.splice(adjustedIdx, 0, viewRef);
                return viewRef;
            };
            ViewContainerRef_.prototype.move = function (viewRef, newIndex) {
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
                detachView(this._lContainer, adjustedIdx, !!this._hostTNode.detached);
                return this._viewRefs.splice(adjustedIdx, 1)[0] || null;
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
            createLContainer(slotValue, hostTNode, hostView, commentNode, true);
        addToViewTree(hostView, hostTNode.index, lContainer);
    }
    return new R3ViewContainerRef(lContainer, hostTNode, hostView);
}
/** Returns a ChangeDetectorRef (a.k.a. a ViewRef) */
export function injectChangeDetectorRef() {
    return createViewRef(getPreviousOrParentTNode(), getViewData(), null);
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
        var componentIndex = hostTNode.flags >> 16 /* DirectiveStartingIndexShift */;
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
    return getOrCreateRenderer2(getViewData());
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld19lbmdpbmVfY29tcGF0aWJpbGl0eS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvdmlld19lbmdpbmVfY29tcGF0aWJpbGl0eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBR0gsT0FBTyxFQUFXLFlBQVksRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBSXRELE9BQU8sRUFBQyxXQUFXLElBQUksc0JBQXNCLEVBQUMsTUFBTSw2QkFBNkIsQ0FBQztBQU1sRixPQUFPLEVBQUMsYUFBYSxFQUFFLGlCQUFpQixFQUFFLGNBQWMsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUMxRSxPQUFPLEVBQUMscUJBQXFCLEVBQUUseUJBQXlCLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDdEUsT0FBTyxFQUFDLGFBQWEsRUFBRSx5QkFBeUIsRUFBRSxnQkFBZ0IsRUFBRSxzQkFBc0IsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ2xILE9BQU8sRUFBQyxZQUFZLEVBQWMsTUFBTSxFQUFFLEtBQUssRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBSS9FLE9BQU8sRUFBZ0Msb0JBQW9CLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUMxRixPQUFPLEVBQUMsT0FBTyxFQUFFLFNBQVMsRUFBYSxPQUFPLEVBQUUsUUFBUSxFQUFRLE1BQU0sbUJBQW1CLENBQUM7QUFDMUYsT0FBTyxFQUFDLHlCQUF5QixFQUFpQixNQUFNLGVBQWUsQ0FBQztBQUN4RSxPQUFPLEVBQUMsMEJBQTBCLEVBQUUsV0FBVyxFQUFFLFVBQVUsRUFBRSxpQkFBaUIsRUFBRSxvQkFBb0IsRUFBRSxVQUFVLEVBQUUsa0JBQWtCLEVBQUUsaUJBQWlCLEVBQUUsZ0JBQWdCLEVBQUUsVUFBVSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDbE4sT0FBTyxFQUFDLHdCQUF3QixFQUFFLFdB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QUUsT0FBWTtJQUNyRCxJQUFJLFdBQVcsQ0FBQyxTQUFTLENBQUMsRUFBRTtRQUMxQixJQUFNLGNBQWMsR0FBRyxTQUFTLENBQUMsS0FBSyx3Q0FBMEMsQ0FBQztRQUNqRixJQUFNLGFBQWEsR0FBRyx1QkFBdUIsQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ3pFLE9BQU8sSUFBSSxPQUFPLENBQUMsYUFBYSxFQUFFLE9BQU8sRUFBRSxjQUFjLENBQUMsQ0FBQztLQUM1RDtTQUFNLElBQUksU0FBUyxDQUFDLElBQUksb0JBQXNCLEVBQUU7UUFDL0MsSUFBTSxpQkFBaUIsR0FBRyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN0RCxPQUFPLElBQUksT0FBTyxDQUFDLGlCQUFpQixFQUFFLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDdkU7SUFDRCxPQUFPLElBQU0sQ0FBQztBQUNoQixDQUFDO0FBRUQsU0FBUyxvQkFBb0IsQ0FBQyxJQUFlO0lBQzNDLElBQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNoQyxJQUFJLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxFQUFFO1FBQ2xDLE9BQU8sUUFBcUIsQ0FBQztLQUM5QjtTQUFNO1FBQ0wsTUFBTSxJQUFJLEtBQUssQ0FBQyw4REFBOEQsQ0FBQyxDQUFDO0tBQ2pGO0FBQ0gsQ0FBQztBQUVELHVGQUF1RjtBQUN2RixNQUFNLFVBQVUsZUFBZTtJQUM3QixPQUFPLG9CQUFvQixDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7QUFDN0MsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtDaGFuZ2VEZXRlY3RvclJlZiBhcyBWaWV3RW5naW5lX0NoYW5nZURldGVjdG9yUmVmfSBmcm9tICcuLi9jaGFuZ2VfZGV0ZWN0aW9uL2NoYW5nZV9kZXRlY3Rvcl9yZWYnO1xuaW1wb3J0IHtJbmplY3RvciwgTnVsbEluamVjdG9yfSBmcm9tICcuLi9kaS9pbmplY3Rvcic7XG5pbXBvcnQge0luamVjdEZsYWdzfSBmcm9tICcuLi9kaS9pbmplY3Rvcl9jb21wYXRpYmlsaXR5JztcbmltcG9ydCB7Q29tcG9uZW50RmFjdG9yeSBhcyB2aWV3RW5naW5lX0NvbXBvbmVudEZhY3RvcnksIENvbXBvbmVudFJlZiBhcyB2aWV3RW5naW5lX0NvbXBvbmVudFJlZn0gZnJvbSAnLi4vbGlua2VyL2NvbXBvbmVudF9mYWN0b3J5JztcbmltcG9ydCB7RWxlbWVudFJlZiBhcyBWaWV3RW5naW5lX0VsZW1lbnRSZWZ9IGZyb20gJy4uL2xpbmtlci9lbGVtZW50X3JlZic7XG5pbXBvcnQge05nTW9kdWxlUmVmIGFzIHZpZXdFbmdpbmVfTmdNb2R1bGVSZWZ9IGZyb20gJy4uL2xpbmtlci9uZ19tb2R1bGVfZmFjdG9yeSc7XG5pbXBvcnQge1RlbXBsYXRlUmVmIGFzIFZpZXdFbmdpbmVfVGVtcGxhdGVSZWZ9IGZyb20gJy4uL2xpbmtlci90ZW1wbGF0ZV9yZWYnO1xuaW1wb3J0IHtWaWV3Q29udGFpbmVyUmVmIGFzIFZpZXdFbmdpbmVfVmlld0NvbnRhaW5lclJlZn0gZnJvbSAnLi4vbGlua2VyL3ZpZXdfY29udGFpbmVyX3JlZic7XG5pbXBvcnQge0VtYmVkZGVkVmlld1JlZiBhcyB2aWV3RW5naW5lX0VtYmVkZGVkVmlld1JlZiwgVmlld1JlZiBhcyB2aWV3RW5naW5lX1ZpZXdSZWZ9IGZyb20gJy4uL2xpbmtlci92aWV3X3JlZic7XG5pbXBvcnQge1JlbmRlcmVyMn0gZnJvbSAnLi4vcmVuZGVyL2FwaSc7XG5cbmltcG9ydCB7YXNzZXJ0RGVmaW5lZCwgYXNzZXJ0R3JlYXRlclRoYW4sIGFzc2VydExlc3NUaGFufSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge2dldE9yQ3JlYXRlSW5qZWN0YWJsZSwgZ2V0UGFyZW50SW5qZWN0b3JMb2NhdGlvbn0gZnJvbSAnLi9kaSc7XG5pbXBvcnQge2FkZFRvVmlld1RyZWUsIGNyZWF0ZUVtYmVkZGVkVmlld0FuZE5vZGUsIGNyZWF0ZUxDb250YWluZXIsIHJlbmRlckVtYmVkZGVkVGVtcGxhdGV9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zJztcbmltcG9ydCB7QUNUSVZFX0lOREVYLCBMQ29udGFpbmVyLCBOQVRJVkUsIFZJRVdTfSBmcm9tICcuL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7UmVuZGVyRmxhZ3N9IGZyb20gJy4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7VENvbnRhaW5lck5vZGUsIFRFbGVtZW50Q29udGFpbmVyTm9kZSwgVEVsZW1lbnROb2RlLCBUTm9kZSwgVE5vZGVGbGFncywgVE5vZGVUeXBlLCBUVmlld05vZGV9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7TFF1ZXJpZXN9IGZyb20gJy4vaW50ZXJmYWNlcy9xdWVyeSc7XG5pbXBvcnQge1JDb21tZW50LCBSRWxlbWVudCwgUmVuZGVyZXIzLCBpc1Byb2NlZHVyYWxSZW5kZXJlcn0gZnJvbSAnLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7Q09OVEVYVCwgSE9TVF9OT0RFLCBMVmlld0RhdGEsIFFVRVJJRVMsIFJFTkRFUkVSLCBUVmlld30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHthc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzLCBhc3NlcnROb2RlVHlwZX0gZnJvbSAnLi9ub2RlX2Fzc2VydCc7XG5pbXBvcnQge2FkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyLCBhcHBlbmRDaGlsZCwgZGV0YWNoVmlldywgZmluZENvbXBvbmVudFZpZXcsIGdldEJlZm9yZU5vZGVGb3JWaWV3LCBpbnNlcnRWaWV3LCBuYXRpdmVJbnNlcnRCZWZvcmUsIG5hdGl2ZU5leHRTaWJsaW5nLCBuYXRpdmVQYXJlbnROb2RlLCByZW1vdmVWaWV3fSBmcm9tICcuL25vZGVfbWFuaXB1bGF0aW9uJztcbmltcG9ydCB7Z2V0UHJldmlvdXNPclBhcmVudFROb2RlLCBnZXRSZW5kZXJlciwgZ2V0Vmlld0RhdGF9IGZyb20gJy4vc3RhdGUnO1xuaW1wb3J0IHtnZXRDb21wb25lbnRWaWV3QnlJbmRleCwgZ2V0TmF0aXZlQnlUTm9kZSwgZ2V0UGFyZW50SW5qZWN0b3JUTm9kZSwgZ2V0UGFyZW50SW5qZWN0b3JWaWV3LCBoYXNQYXJlbnRJbmplY3RvciwgaXNDb21wb25lbnQsIGlzTENvbnRhaW5lciwgaXNSb290Vmlld30gZnJvbSAnLi91dGlsJztcbmltcG9ydCB7Vmlld1JlZn0gZnJvbSAnLi92aWV3X3JlZic7XG5cblxuXG4vKipcbiAqIENyZWF0ZXMgYW4gRWxlbWVudFJlZiBmcm9tIHRoZSBtb3N0IHJlY2VudCBub2RlLlxuICpcbiAqIEByZXR1cm5zIFRoZSBFbGVtZW50UmVmIGluc3RhbmNlIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0RWxlbWVudFJlZihFbGVtZW50UmVmVG9rZW46IHR5cGVvZiBWaWV3RW5naW5lX0VsZW1lbnRSZWYpOlxuICAgIFZpZXdFbmdpbmVfRWxlbWVudFJlZiB7XG4gIHJldHVybiBjcmVhdGVFbGVtZW50UmVmKEVsZW1lbnRSZWZUb2tlbiwgZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCksIGdldFZpZXdEYXRhKCkpO1xufVxuXG5sZXQgUjNFbGVtZW50UmVmOiB7bmV3IChuYXRpdmU6IFJFbGVtZW50IHwgUkNvbW1lbnQpOiBWaWV3RW5naW5lX0VsZW1lbnRSZWZ9O1xuXG4vKipcbiAqIENyZWF0ZXMgYW4gRWxlbWVudFJlZiBnaXZlbiBhIG5vZGUuXG4gKlxuICogQHBhcmFtIEVsZW1lbnRSZWZUb2tlbiBUaGUgRWxlbWVudFJlZiB0eXBlXG4gKiBAcGFyYW0gdE5vZGUgVGhlIG5vZGUgZm9yIHdoaWNoIHlvdSdkIGxpa2UgYW4gRWxlbWVudFJlZlxuICogQHBhcmFtIHZpZXcgVGhlIHZpZXcgdG8gd2hpY2ggdGhlIG5vZGUgYmVsb25nc1xuICogQHJldHVybnMgVGhlIEVsZW1lbnRSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFbGVtZW50UmVmKFxuICAgIEVsZW1lbnRSZWZUb2tlbjogdHlwZW9mIFZpZXdFbmdpbmVfRWxlbWVudFJlZiwgdE5vZGU6IFROb2RlLFxuICAgIHZpZXc6IExWaWV3RGF0YSk6IFZpZXdFbmdpbmVfRWxlbWVudFJlZiB7XG4gIGlmICghUjNFbGVtZW50UmVmKSB7XG4gICAgLy8gVE9ETzogRml4IGNsYXNzIG5hbWUsIHNob3VsZCBiZSBFbGVtZW50UmVmLCBidXQgdGhlcmUgYXBwZWFycyB0byBiZSBhIHJvbGx1cCBidWdcbiAgICBSM0VsZW1lbnRSZWYgPSBjbGFzcyBFbGVtZW50UmVmXyBleHRlbmRzIEVsZW1lbnRSZWZUb2tlbiB7fTtcbiAgfVxuICByZXR1cm4gbmV3IFIzRWxlbWVudFJlZihnZXROYXRpdmVCeVROb2RlKHROb2RlLCB2aWV3KSk7XG59XG5cbmxldCBSM1RlbXBsYXRlUmVmOiB7XG4gIG5ldyAoXG4gICAgICBfZGVjbGFyYXRpb25QYXJlbnRWaWV3OiBMVmlld0RhdGEsIGVsZW1lbnRSZWY6IFZpZXdFbmdpbmVfRWxlbWVudFJlZiwgX3RWaWV3OiBUVmlldyxcbiAgICAgIF9yZW5kZXJlcjogUmVuZGVyZXIzLCBfcXVlcmllczogTFF1ZXJpZXMgfCBudWxsLCBfaW5qZWN0b3JJbmRleDogbnVtYmVyKTpcbiAgICAgIFZpZXdFbmdpbmVfVGVtcGxhdGVSZWY8YW55PlxufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgVGVtcGxhdGVSZWYgZ2l2ZW4gYSBub2RlLlxuICpcbiAqIEByZXR1cm5zIFRoZSBUZW1wbGF0ZVJlZiBpbnN0YW5jZSB0byB1c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdFRlbXBsYXRlUmVmPFQ+KFxuICAgIFRlbXBsYXRlUmVmVG9rZW46IHR5cGVvZiBWaWV3RW5naW5lX1RlbXBsYXRlUmVmLFxuICAgIEVsZW1lbnRSZWZUb2tlbjogdHlwZW9mIFZpZXdFbmdpbmVfRWxlbWVudFJlZik6IFZpZXdFbmdpbmVfVGVtcGxhdGVSZWY8VD58bnVsbCB7XG4gIHJldHVybiBjcmVhdGVUZW1wbGF0ZVJlZjxUPihcbiAgICAgIFRlbXBsYXRlUmVmVG9rZW4sIEVsZW1lbnRSZWZUb2tlbiwgZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCksIGdldFZpZXdEYXRhKCkpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBUZW1wbGF0ZVJlZiBhbmQgc3RvcmVzIGl0IG9uIHRoZSBpbmplY3Rvci5cbiAqXG4gKiBAcGFyYW0gVGVtcGxhdGVSZWZUb2tlbiBUaGUgVGVtcGxhdGVSZWYgdHlwZVxuICogQHBhcmFtIEVsZW1lbnRSZWZUb2tlbiBUaGUgRWxlbWVudFJlZiB0eXBlXG4gKiBAcGFyYW0gaG9zdFROb2RlIFRoZSBub2RlIHRoYXQgaXMgcmVxdWVzdGluZyBhIFRlbXBsYXRlUmVmXG4gKiBAcGFyYW0gaG9zdFZpZXcgVGhlIHZpZXcgdG8gd2hpY2ggdGhlIG5vZGUgYmVsb25nc1xuICogQHJldHVybnMgVGhlIFRlbXBsYXRlUmVmIGluc3RhbmNlIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVGVtcGxhdGVSZWY8VD4oXG4gICAgVGVtcGxhdGVSZWZUb2tlbjogdHlwZW9mIFZpZXdFbmdpbmVfVGVtcGxhdGVSZWYsIEVsZW1lbnRSZWZUb2tlbjogdHlwZW9mIFZpZXdFbmdpbmVfRWxlbWVudFJlZixcbiAgICBob3N0VE5vZGU6IFROb2RlLCBob3N0VmlldzogTFZpZXdEYXRhKTogVmlld0VuZ2luZV9UZW1wbGF0ZVJlZjxUPnxudWxsIHtcbiAgaWYgKCFSM1RlbXBsYXRlUmVmKSB7XG4gICAgLy8gVE9ETzogRml4IGNsYXNzIG5hbWUsIHNob3VsZCBiZSBUZW1wbGF0ZVJlZiwgYnV0IHRoZXJlIGFwcGVhcnMgdG8gYmUgYSByb2xsdXAgYnVnXG4gICAgUjNUZW1wbGF0ZVJlZiA9IGNsYXNzIFRlbXBsYXRlUmVmXzxUPiBleHRlbmRzIFRlbXBsYXRlUmVmVG9rZW48VD4ge1xuICAgICAgY29uc3RydWN0b3IoXG4gICAgICAgICAgcHJpdmF0ZSBfZGVjbGFyYXRpb25QYXJlbnRWaWV3OiBMVmlld0RhdGEsIHJlYWRvbmx5IGVsZW1lbnRSZWY6IFZpZXdFbmdpbmVfRWxlbWVudFJlZixcbiAgICAgICAgICBwcml2YXRlIF90VmlldzogVFZpZXcsIHByaXZhdGUgX3JlbmRlcmVyOiBSZW5kZXJlcjMsIHByaXZhdGUgX3F1ZXJpZXM6IExRdWVyaWVzfG51bGwsXG4gICAgICAgICAgcHJpdmF0ZSBfaW5qZWN0b3JJbmRleDogbnVtYmVyKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICB9XG5cbiAgICAgIGNyZWF0ZUVtYmVkZGVkVmlldyhcbiAgICAgICAgICBjb250ZXh0OiBULCBjb250YWluZXI/OiBMQ29udGFpbmVyLFxuICAgICAgICAgIGhvc3RUTm9kZT86IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxURWxlbWVudENvbnRhaW5lck5vZGUsIGhvc3RWaWV3PzogTFZpZXdEYXRhLFxuICAgICAgICAgIGluZGV4PzogbnVtYmVyKTogdmlld0VuZ2luZV9FbWJlZGRlZFZpZXdSZWY8VD4ge1xuICAgICAgICBjb25zdCBsVmlldyA9IGNyZWF0ZUVtYmVkZGVkVmlld0FuZE5vZGUoXG4gICAgICAgICAgICB0aGlzLl90VmlldywgY29udGV4dCwgdGhpcy5fZGVjbGFyYXRpb25QYXJlbnRWaWV3LCB0aGlzLl9yZW5kZXJlciwgdGhpcy5fcXVlcmllcyxcbiAgICAgICAgICAgIHRoaXMuX2luamVjdG9ySW5kZXgpO1xuICAgICAgICBpZiAoY29udGFpbmVyKSB7XG4gICAgICAgICAgaW5zZXJ0VmlldyhsVmlldywgY29udGFpbmVyLCBob3N0VmlldyAhLCBpbmRleCAhLCBob3N0VE5vZGUgIS5pbmRleCk7XG4gICAgICAgIH1cbiAgICAgICAgcmVuZGVyRW1iZWRkZWRUZW1wbGF0ZShsVmlldywgdGhpcy5fdFZpZXcsIGNvbnRleHQsIFJlbmRlckZsYWdzLkNyZWF0ZSk7XG4gICAgICAgIGNvbnN0IHZpZXdSZWYgPSBuZXcgVmlld1JlZihsVmlldywgY29udGV4dCwgLTEpO1xuICAgICAgICB2aWV3UmVmLl90Vmlld05vZGUgPSBsVmlld1tIT1NUX05PREVdIGFzIFRWaWV3Tm9kZTtcbiAgICAgICAgcmV0dXJuIHZpZXdSZWY7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIGlmIChob3N0VE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgIGNvbnN0IGhvc3RDb250YWluZXI6IExDb250YWluZXIgPSBob3N0Vmlld1tob3N0VE5vZGUuaW5kZXhdO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGhvc3RUTm9kZS50Vmlld3MsICdUVmlldyBtdXN0IGJlIGFsbG9jYXRlZCcpO1xuICAgIHJldHVybiBuZXcgUjNUZW1wbGF0ZVJlZihcbiAgICAgICAgaG9zdFZpZXcsIGNyZWF0ZUVsZW1lbnRSZWYoRWxlbWVudFJlZlRva2VuLCBob3N0VE5vZGUsIGhvc3RWaWV3KSwgaG9zdFROb2RlLnRWaWV3cyBhcyBUVmlldyxcbiAgICAgICAgZ2V0UmVuZGVyZXIoKSwgaG9zdENvbnRhaW5lcltRVUVSSUVTXSwgaG9zdFROb2RlLmluamVjdG9ySW5kZXgpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbmxldCBSM1ZpZXdDb250YWluZXJSZWY6IHtcbiAgbmV3IChcbiAgICAgIGxDb250YWluZXI6IExDb250YWluZXIsIGhvc3RUTm9kZTogVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGUsXG4gICAgICBob3N0VmlldzogTFZpZXdEYXRhKTogVmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmXG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBWaWV3Q29udGFpbmVyUmVmIGFuZCBzdG9yZXMgaXQgb24gdGhlIGluamVjdG9yLiBPciwgaWYgdGhlIFZpZXdDb250YWluZXJSZWZcbiAqIGFscmVhZHkgZXhpc3RzLCByZXRyaWV2ZXMgdGhlIGV4aXN0aW5nIFZpZXdDb250YWluZXJSZWYuXG4gKlxuICogQHJldHVybnMgVGhlIFZpZXdDb250YWluZXJSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RWaWV3Q29udGFpbmVyUmVmKFxuICAgIFZpZXdDb250YWluZXJSZWZUb2tlbjogdHlwZW9mIFZpZXdFbmdpbmVfVmlld0NvbnRhaW5lclJlZixcbiAgICBFbGVtZW50UmVmVG9rZW46IHR5cGVvZiBWaWV3RW5naW5lX0VsZW1lbnRSZWYpOiBWaWV3RW5naW5lX1ZpZXdDb250YWluZXJSZWYge1xuICBjb25zdCBwcmV2aW91c1ROb2RlID1cbiAgICAgIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpIGFzIFRFbGVtZW50Tm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSB8IFRDb250YWluZXJOb2RlO1xuICByZXR1cm4gY3JlYXRlQ29udGFpbmVyUmVmKFZpZXdDb250YWluZXJSZWZUb2tlbiwgRWxlbWVudFJlZlRva2VuLCBwcmV2aW91c1ROb2RlLCBnZXRWaWV3RGF0YSgpKTtcbn1cblxuZXhwb3J0IGNsYXNzIE5vZGVJbmplY3RvciBpbXBsZW1lbnRzIEluamVjdG9yIHtcbiAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIF90Tm9kZTogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZSxcbiAgICAgIHByaXZhdGUgX2hvc3RWaWV3OiBMVmlld0RhdGEpIHt9XG5cbiAgZ2V0KHRva2VuOiBhbnksIG5vdEZvdW5kVmFsdWU/OiBhbnkpOiBhbnkge1xuICAgIHJldHVybiBnZXRPckNyZWF0ZUluamVjdGFibGUoXG4gICAgICAgIHRoaXMuX3ROb2RlLCB0aGlzLl9ob3N0VmlldywgdG9rZW4sIEluamVjdEZsYWdzLkRlZmF1bHQsIG5vdEZvdW5kVmFsdWUpO1xuICB9XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIFZpZXdDb250YWluZXJSZWYgYW5kIHN0b3JlcyBpdCBvbiB0aGUgaW5qZWN0b3IuXG4gKlxuICogQHBhcmFtIFZpZXdDb250YWluZXJSZWZUb2tlbiBUaGUgVmlld0NvbnRhaW5lclJlZiB0eXBlXG4gKiBAcGFyYW0gRWxlbWVudFJlZlRva2VuIFRoZSBFbGVtZW50UmVmIHR5cGVcbiAqIEBwYXJhbSBob3N0VE5vZGUgVGhlIG5vZGUgdGhhdCBpcyByZXF1ZXN0aW5nIGEgVmlld0NvbnRhaW5lclJlZlxuICogQHBhcmFtIGhvc3RWaWV3IFRoZSB2aWV3IHRvIHdoaWNoIHRoZSBub2RlIGJlbG9uZ3NcbiAqIEByZXR1cm5zIFRoZSBWaWV3Q29udGFpbmVyUmVmIGluc3RhbmNlIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQ29udGFpbmVyUmVmKFxuICAgIFZpZXdDb250YWluZXJSZWZUb2tlbjogdHlwZW9mIFZpZXdFbmdpbmVfVmlld0NvbnRhaW5lclJlZixcbiAgICBFbGVtZW50UmVmVG9rZW46IHR5cGVvZiBWaWV3RW5naW5lX0VsZW1lbnRSZWYsXG4gICAgaG9zdFROb2RlOiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlLFxuICAgIGhvc3RWaWV3OiBMVmlld0RhdGEpOiBWaWV3RW5naW5lX1ZpZXdDb250YWluZXJSZWYge1xuICBpZiAoIVIzVmlld0NvbnRhaW5lclJlZikge1xuICAgIC8vIFRPRE86IEZpeCBjbGFzcyBuYW1lLCBzaG91bGQgYmUgVmlld0NvbnRhaW5lclJlZiwgYnV0IHRoZXJlIGFwcGVhcnMgdG8gYmUgYSByb2xsdXAgYnVnXG4gICAgUjNWaWV3Q29udGFpbmVyUmVmID0gY2xhc3MgVmlld0NvbnRhaW5lclJlZl8gZXh0ZW5kcyBWaWV3Q29udGFpbmVyUmVmVG9rZW4ge1xuICAgICAgcHJpdmF0ZSBfdmlld1JlZnM6IHZpZXdFbmdpbmVfVmlld1JlZltdID0gW107XG5cbiAgICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICAgIHByaXZhdGUgX2xDb250YWluZXI6IExDb250YWluZXIsXG4gICAgICAgICAgcHJpdmF0ZSBfaG9zdFROb2RlOiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlLFxuICAgICAgICAgIHByaXZhdGUgX2hvc3RWaWV3OiBMVmlld0RhdGEpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgIH1cblxuICAgICAgZ2V0IGVsZW1lbnQoKTogVmlld0VuZ2luZV9FbGVtZW50UmVmIHtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZUVsZW1lbnRSZWYoRWxlbWVudFJlZlRva2VuLCB0aGlzLl9ob3N0VE5vZGUsIHRoaXMuX2hvc3RWaWV3KTtcbiAgICAgIH1cblxuICAgICAgZ2V0IGluamVjdG9yKCk6IEluamVjdG9yIHsgcmV0dXJuIG5ldyBOb2RlSW5qZWN0b3IodGhpcy5faG9zdFROb2RlLCB0aGlzLl9ob3N0Vmlldyk7IH1cblxuICAgICAgLyoqIEBkZXByZWNhdGVkIE5vIHJlcGxhY2VtZW50ICovXG4gICAgICBnZXQgcGFyZW50SW5qZWN0b3IoKTogSW5qZWN0b3Ige1xuICAgICAgICBjb25zdCBwYXJlbnRMb2NhdGlvbiA9IGdldFBhcmVudEluamVjdG9yTG9jYXRpb24odGhpcy5faG9zdFROb2RlLCB0aGlzLl9ob3N0Vmlldyk7XG4gICAgICAgIGNvbnN0IHBhcmVudFZpZXcgPSBnZXRQYXJlbnRJbmplY3RvclZpZXcocGFyZW50TG9jYXRpb24sIHRoaXMuX2hvc3RWaWV3KTtcbiAgICAgICAgY29uc3QgcGFyZW50VE5vZGUgPSBnZXRQYXJlbnRJbmplY3RvclROb2RlKHBhcmVudExvY2F0aW9uLCB0aGlzLl9ob3N0VmlldywgdGhpcy5faG9zdFROb2RlKTtcblxuICAgICAgICByZXR1cm4gIWhhc1BhcmVudEluamVjdG9yKHBhcmVudExvY2F0aW9uKSB8fCBwYXJlbnRUTm9kZSA9PSBudWxsID9cbiAgICAgICAgICAgIG5ldyBOdWxsSW5qZWN0b3IoKSA6XG4gICAgICAgICAgICBuZXcgTm9kZUluamVjdG9yKHBhcmVudFROb2RlLCBwYXJlbnRWaWV3KTtcbiAgICAgIH1cblxuICAgICAgY2xlYXIoKTogdm9pZCB7XG4gICAgICAgIHdoaWxlICh0aGlzLl9sQ29udGFpbmVyW1ZJRVdTXS5sZW5ndGgpIHtcbiAgICAgICAgICB0aGlzLnJlbW92ZSgwKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBnZXQoaW5kZXg6IG51bWJlcik6IHZpZXdFbmdpbmVfVmlld1JlZnxudWxsIHsgcmV0dXJuIHRoaXMuX3ZpZXdSZWZzW2luZGV4XSB8fCBudWxsOyB9XG5cbiAgICAgIGdldCBsZW5ndGgoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuX2xDb250YWluZXJbVklFV1NdLmxlbmd0aDsgfVxuXG4gICAgICBjcmVhdGVFbWJlZGRlZFZpZXc8Qz4odGVtcGxhdGVSZWY6IFZpZXdFbmdpbmVfVGVtcGxhdGVSZWY8Qz4sIGNvbnRleHQ/OiBDLCBpbmRleD86IG51bWJlcik6XG4gICAgICAgICAgdmlld0VuZ2luZV9FbWJlZGRlZFZpZXdSZWY8Qz4ge1xuICAgICAgICBjb25zdCBhZGp1c3RlZElkeCA9IHRoaXMuX2FkanVzdEluZGV4KGluZGV4KTtcbiAgICAgICAgY29uc3Qgdmlld1JlZiA9ICh0ZW1wbGF0ZVJlZiBhcyBhbnkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmNyZWF0ZUVtYmVkZGVkVmlldyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dCB8fCA8YW55Pnt9LCB0aGlzLl9sQ29udGFpbmVyLCB0aGlzLl9ob3N0VE5vZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2hvc3RWaWV3LCBhZGp1c3RlZElkeCk7XG4gICAgICAgICh2aWV3UmVmIGFzIFZpZXdSZWY8YW55PikuYXR0YWNoVG9WaWV3Q29udGFpbmVyUmVmKHRoaXMpO1xuICAgICAgICB0aGlzLl92aWV3UmVmcy5zcGxpY2UoYWRqdXN0ZWRJZHgsIDAsIHZpZXdSZWYpO1xuICAgICAgICByZXR1cm4gdmlld1JlZjtcbiAgICAgIH1cblxuICAgICAgY3JlYXRlQ29tcG9uZW50PEM+KFxuICAgICAgICAgIGNvbXBvbmVudEZhY3Rvcnk6IHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeTxDPiwgaW5kZXg/OiBudW1iZXJ8dW5kZWZpbmVkLFxuICAgICAgICAgIGluamVjdG9yPzogSW5qZWN0b3J8dW5kZWZpbmVkLCBwcm9qZWN0YWJsZU5vZGVzPzogYW55W11bXXx1bmRlZmluZWQsXG4gICAgICAgICAgbmdNb2R1bGVSZWY/OiB2aWV3RW5naW5lX05nTW9kdWxlUmVmPGFueT58dW5kZWZpbmVkKTogdmlld0VuZ2luZV9Db21wb25lbnRSZWY8Qz4ge1xuICAgICAgICBjb25zdCBjb250ZXh0SW5qZWN0b3IgPSBpbmplY3RvciB8fCB0aGlzLnBhcmVudEluamVjdG9yO1xuICAgICAgICBpZiAoIW5nTW9kdWxlUmVmICYmIGNvbnRleHRJbmplY3Rvcikge1xuICAgICAgICAgIG5nTW9kdWxlUmVmID0gY29udGV4dEluamVjdG9yLmdldCh2aWV3RW5naW5lX05nTW9kdWxlUmVmLCBudWxsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNvbXBvbmVudFJlZiA9XG4gICAgICAgICAgICBjb21wb25lbnRGYWN0b3J5LmNyZWF0ZShjb250ZXh0SW5qZWN0b3IsIHByb2plY3RhYmxlTm9kZXMsIHVuZGVmaW5lZCwgbmdNb2R1bGVSZWYpO1xuICAgICAgICB0aGlzLmluc2VydChjb21wb25lbnRSZWYuaG9zdFZpZXcsIGluZGV4KTtcbiAgICAgICAgcmV0dXJuIGNvbXBvbmVudFJlZjtcbiAgICAgIH1cblxuICAgICAgaW5zZXJ0KHZpZXdSZWY6IHZpZXdFbmdpbmVfVmlld1JlZiwgaW5kZXg/OiBudW1iZXIpOiB2aWV3RW5naW5lX1ZpZXdSZWYge1xuICAgICAgICBpZiAodmlld1JlZi5kZXN0cm95ZWQpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBpbnNlcnQgYSBkZXN0cm95ZWQgVmlldyBpbiBhIFZpZXdDb250YWluZXIhJyk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbFZpZXcgPSAodmlld1JlZiBhcyBWaWV3UmVmPGFueT4pLl92aWV3ICE7XG4gICAgICAgIGNvbnN0IGFkanVzdGVkSWR4ID0gdGhpcy5fYWRqdXN0SW5kZXgoaW5kZXgpO1xuXG4gICAgICAgIGluc2VydFZpZXcobFZpZXcsIHRoaXMuX2xDb250YWluZXIsIHRoaXMuX2hvc3RWaWV3LCBhZGp1c3RlZElkeCwgdGhpcy5faG9zdFROb2RlLmluZGV4KTtcblxuICAgICAgICBjb25zdCBiZWZvcmVOb2RlID1cbiAgICAgICAgICAgIGdldEJlZm9yZU5vZGVGb3JWaWV3KGFkanVzdGVkSWR4LCB0aGlzLl9sQ29udGFpbmVyW1ZJRVdTXSwgdGhpcy5fbENvbnRhaW5lcltOQVRJVkVdKTtcbiAgICAgICAgYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIobFZpZXcsIHRydWUsIGJlZm9yZU5vZGUpO1xuXG4gICAgICAgICh2aWV3UmVmIGFzIFZpZXdSZWY8YW55PikuYXR0YWNoVG9WaWV3Q29udGFpbmVyUmVmKHRoaXMpO1xuICAgICAgICB0aGlzLl92aWV3UmVmcy5zcGxpY2UoYWRqdXN0ZWRJZHgsIDAsIHZpZXdSZWYpO1xuXG4gICAgICAgIHJldHVybiB2aWV3UmVmO1xuICAgICAgfVxuXG4gICAgICBtb3ZlKHZpZXdSZWY6IHZpZXdFbmdpbmVfVmlld1JlZiwgbmV3SW5kZXg6IG51bWJlcik6IHZpZXdFbmdpbmVfVmlld1JlZiB7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5pbmRleE9mKHZpZXdSZWYpO1xuICAgICAgICB0aGlzLmRldGFjaChpbmRleCk7XG4gICAgICAgIHRoaXMuaW5zZXJ0KHZpZXdSZWYsIHRoaXMuX2FkanVzdEluZGV4KG5ld0luZGV4KSk7XG4gICAgICAgIHJldHVybiB2aWV3UmVmO1xuICAgICAgfVxuXG4gICAgICBpbmRleE9mKHZpZXdSZWY6IHZpZXdFbmdpbmVfVmlld1JlZik6IG51bWJlciB7IHJldHVybiB0aGlzLl92aWV3UmVmcy5pbmRleE9mKHZpZXdSZWYpOyB9XG5cbiAgICAgIHJlbW92ZShpbmRleD86IG51bWJlcik6IHZvaWQge1xuICAgICAgICBjb25zdCBhZGp1c3RlZElkeCA9IHRoaXMuX2FkanVzdEluZGV4KGluZGV4LCAtMSk7XG4gICAgICAgIHJlbW92ZVZpZXcodGhpcy5fbENvbnRhaW5lciwgdGhpcy5faG9zdFROb2RlLCBhZGp1c3RlZElkeCk7XG4gICAgICAgIHRoaXMuX3ZpZXdSZWZzLnNwbGljZShhZGp1c3RlZElkeCwgMSk7XG4gICAgICB9XG5cbiAgICAgIGRldGFjaChpbmRleD86IG51bWJlcik6IHZpZXdFbmdpbmVfVmlld1JlZnxudWxsIHtcbiAgICAgICAgY29uc3QgYWRqdXN0ZWRJZHggPSB0aGlzLl9hZGp1c3RJbmRleChpbmRleCwgLTEpO1xuICAgICAgICBkZXRhY2hWaWV3KHRoaXMuX2xDb250YWluZXIsIGFkanVzdGVkSWR4LCAhIXRoaXMuX2hvc3RUTm9kZS5kZXRhY2hlZCk7XG4gICAgICAgIHJldHVybiB0aGlzLl92aWV3UmVmcy5zcGxpY2UoYWRqdXN0ZWRJZHgsIDEpWzBdIHx8IG51bGw7XG4gICAgICB9XG5cbiAgICAgIHByaXZhdGUgX2FkanVzdEluZGV4KGluZGV4PzogbnVtYmVyLCBzaGlmdDogbnVtYmVyID0gMCkge1xuICAgICAgICBpZiAoaW5kZXggPT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiB0aGlzLl9sQ29udGFpbmVyW1ZJRVdTXS5sZW5ndGggKyBzaGlmdDtcbiAgICAgICAgfVxuICAgICAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICAgICAgYXNzZXJ0R3JlYXRlclRoYW4oaW5kZXgsIC0xLCAnaW5kZXggbXVzdCBiZSBwb3NpdGl2ZScpO1xuICAgICAgICAgIC8vICsxIGJlY2F1c2UgaXQncyBsZWdhbCB0byBpbnNlcnQgYXQgdGhlIGVuZC5cbiAgICAgICAgICBhc3NlcnRMZXNzVGhhbihpbmRleCwgdGhpcy5fbENvbnRhaW5lcltWSUVXU10ubGVuZ3RoICsgMSArIHNoaWZ0LCAnaW5kZXgnKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaW5kZXg7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzKFxuICAgICAgICAgICAgICAgICAgIGhvc3RUTm9kZSwgVE5vZGVUeXBlLkNvbnRhaW5lciwgVE5vZGVUeXBlLkVsZW1lbnQsIFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKTtcblxuICBsZXQgbENvbnRhaW5lcjogTENvbnRhaW5lcjtcbiAgY29uc3Qgc2xvdFZhbHVlID0gaG9zdFZpZXdbaG9zdFROb2RlLmluZGV4XTtcbiAgaWYgKGlzTENvbnRhaW5lcihzbG90VmFsdWUpKSB7XG4gICAgLy8gSWYgdGhlIGhvc3QgaXMgYSBjb250YWluZXIsIHdlIGRvbid0IG5lZWQgdG8gY3JlYXRlIGEgbmV3IExDb250YWluZXJcbiAgICBsQ29udGFpbmVyID0gc2xvdFZhbHVlO1xuICAgIGxDb250YWluZXJbQUNUSVZFX0lOREVYXSA9IC0xO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IGNvbW1lbnROb2RlID0gaG9zdFZpZXdbUkVOREVSRVJdLmNyZWF0ZUNvbW1lbnQobmdEZXZNb2RlID8gJ2NvbnRhaW5lcicgOiAnJyk7XG4gICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckNyZWF0ZUNvbW1lbnQrKztcblxuICAgIC8vIEEgY29udGFpbmVyIGNhbiBiZSBjcmVhdGVkIG9uIHRoZSByb290ICh0b3Btb3N0IC8gYm9vdHN0cmFwcGVkKSBjb21wb25lbnQgYW5kIGluIHRoaXMgY2FzZSB3ZVxuICAgIC8vIGNhbid0IHVzZSBMVHJlZSB0byBpbnNlcnQgY29udGFpbmVyJ3MgbWFya2VyIG5vZGUgKGJvdGggcGFyZW50IG9mIGEgY29tbWVudCBub2RlIGFuZCB0aGVcbiAgICAvLyBjb21tZW5kIG5vZGUgaXRzZWxmIGlzIGxvY2F0ZWQgb3V0c2lkZSBvZiBlbGVtZW50cyBob2xkIGJ5IExUcmVlKS4gSW4gdGhpcyBzcGVjaWZpYyBjYXNlIHdlXG4gICAgLy8gdXNlIGxvdy1sZXZlbCBET00gbWFuaXB1bGF0aW9uIHRvIGluc2VydCBjb250YWluZXIncyBtYXJrZXIgKGNvbW1lbnQpIG5vZGUuXG4gICAgaWYgKGlzUm9vdFZpZXcoaG9zdFZpZXcpKSB7XG4gICAgICBjb25zdCByZW5kZXJlciA9IGhvc3RWaWV3W1JFTkRFUkVSXTtcbiAgICAgIGNvbnN0IGhvc3ROYXRpdmUgPSBnZXROYXRpdmVCeVROb2RlKGhvc3RUTm9kZSwgaG9zdFZpZXcpICE7XG4gICAgICBjb25zdCBwYXJlbnRPZkhvc3ROYXRpdmUgPSBuYXRpdmVQYXJlbnROb2RlKHJlbmRlcmVyLCBob3N0TmF0aXZlKTtcbiAgICAgIG5hdGl2ZUluc2VydEJlZm9yZShcbiAgICAgICAgICByZW5kZXJlciwgcGFyZW50T2ZIb3N0TmF0aXZlICEsIGNvbW1lbnROb2RlLCBuYXRpdmVOZXh0U2libGluZyhyZW5kZXJlciwgaG9zdE5hdGl2ZSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBhcHBlbmRDaGlsZChjb21tZW50Tm9kZSwgaG9zdFROb2RlLCBob3N0Vmlldyk7XG4gICAgfVxuXG4gICAgaG9zdFZpZXdbaG9zdFROb2RlLmluZGV4XSA9IGxDb250YWluZXIgPVxuICAgICAgICBjcmVhdGVMQ29udGFpbmVyKHNsb3RWYWx1ZSwgaG9zdFROb2RlLCBob3N0VmlldywgY29tbWVudE5vZGUsIHRydWUpO1xuXG4gICAgYWRkVG9WaWV3VHJlZShob3N0VmlldywgaG9zdFROb2RlLmluZGV4IGFzIG51bWJlciwgbENvbnRhaW5lcik7XG4gIH1cblxuICByZXR1cm4gbmV3IFIzVmlld0NvbnRhaW5lclJlZihsQ29udGFpbmVyLCBob3N0VE5vZGUsIGhvc3RWaWV3KTtcbn1cblxuXG4vKiogUmV0dXJucyBhIENoYW5nZURldGVjdG9yUmVmIChhLmsuYS4gYSBWaWV3UmVmKSAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdENoYW5nZURldGVjdG9yUmVmKCk6IFZpZXdFbmdpbmVfQ2hhbmdlRGV0ZWN0b3JSZWYge1xuICByZXR1cm4gY3JlYXRlVmlld1JlZihnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKSwgZ2V0Vmlld0RhdGEoKSwgbnVsbCk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIFZpZXdSZWYgYW5kIHN0b3JlcyBpdCBvbiB0aGUgaW5qZWN0b3IgYXMgQ2hhbmdlRGV0ZWN0b3JSZWYgKHB1YmxpYyBhbGlhcykuXG4gKlxuICogQHBhcmFtIGhvc3RUTm9kZSBUaGUgbm9kZSB0aGF0IGlzIHJlcXVlc3RpbmcgYSBDaGFuZ2VEZXRlY3RvclJlZlxuICogQHBhcmFtIGhvc3RWaWV3IFRoZSB2aWV3IHRvIHdoaWNoIHRoZSBub2RlIGJlbG9uZ3NcbiAqIEBwYXJhbSBjb250ZXh0IFRoZSBjb250ZXh0IGZvciB0aGlzIGNoYW5nZSBkZXRlY3RvciByZWZcbiAqIEByZXR1cm5zIFRoZSBDaGFuZ2VEZXRlY3RvclJlZiB0byB1c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVZpZXdSZWYoXG4gICAgaG9zdFROb2RlOiBUTm9kZSwgaG9zdFZpZXc6IExWaWV3RGF0YSwgY29udGV4dDogYW55KTogVmlld0VuZ2luZV9DaGFuZ2VEZXRlY3RvclJlZiB7XG4gIGlmIChpc0NvbXBvbmVudChob3N0VE5vZGUpKSB7XG4gICAgY29uc3QgY29tcG9uZW50SW5kZXggPSBob3N0VE5vZGUuZmxhZ3MgPj4gVE5vZGVGbGFncy5EaXJlY3RpdmVTdGFydGluZ0luZGV4U2hpZnQ7XG4gICAgY29uc3QgY29tcG9uZW50VmlldyA9IGdldENvbXBvbmVudFZpZXdCeUluZGV4KGhvc3RUTm9kZS5pbmRleCwgaG9zdFZpZXcpO1xuICAgIHJldHVybiBuZXcgVmlld1JlZihjb21wb25lbnRWaWV3LCBjb250ZXh0LCBjb21wb25lbnRJbmRleCk7XG4gIH0gZWxzZSBpZiAoaG9zdFROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50KSB7XG4gICAgY29uc3QgaG9zdENvbXBvbmVudFZpZXcgPSBmaW5kQ29tcG9uZW50Vmlldyhob3N0Vmlldyk7XG4gICAgcmV0dXJuIG5ldyBWaWV3UmVmKGhvc3RDb21wb25lbnRWaWV3LCBob3N0Q29tcG9uZW50Vmlld1tDT05URVhUXSwgLTEpO1xuICB9XG4gIHJldHVybiBudWxsICE7XG59XG5cbmZ1bmN0aW9uIGdldE9yQ3JlYXRlUmVuZGVyZXIyKHZpZXc6IExWaWV3RGF0YSk6IFJlbmRlcmVyMiB7XG4gIGNvbnN0IHJlbmRlcmVyID0gdmlld1tSRU5ERVJFUl07XG4gIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICByZXR1cm4gcmVuZGVyZXIgYXMgUmVuZGVyZXIyO1xuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGluamVjdCBSZW5kZXJlcjIgd2hlbiB0aGUgYXBwbGljYXRpb24gdXNlcyBSZW5kZXJlcjMhJyk7XG4gIH1cbn1cblxuLyoqIFJldHVybnMgYSBSZW5kZXJlcjIgKG9yIHRocm93cyB3aGVuIGFwcGxpY2F0aW9uIHdhcyBib290c3RyYXBwZWQgd2l0aCBSZW5kZXJlcjMpICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0UmVuZGVyZXIyKCk6IFJlbmRlcmVyMiB7XG4gIHJldHVybiBnZXRPckNyZWF0ZVJlbmRlcmVyMihnZXRWaWV3RGF0YSgpKTtcbn1cbiJdfQ==