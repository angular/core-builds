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
import { NodeInjector, getParentInjectorLocation, getParentInjectorView } from './di';
import { _getViewData, addToViewTree, createEmbeddedViewAndNode, createLContainer, getPreviousOrParentTNode, getRenderer, renderEmbeddedTemplate } from './instructions';
import { ACTIVE_INDEX, NATIVE, VIEWS } from './interfaces/container';
import { isProceduralRenderer } from './interfaces/renderer';
import { CONTEXT, HOST_NODE, QUERIES, RENDERER, TVIEW } from './interfaces/view';
import { assertNodeOfPossibleTypes, assertNodeType } from './node_assert';
import { addRemoveViewFromContainer, appendChild, detachView, findComponentView, getBeforeNodeForView, insertView, removeView } from './node_manipulation';
import { getLNode, isComponent, isLContainer } from './util';
import { ViewRef } from './view_ref';
/**
 * Creates an ElementRef from the most recent node.
 *
 * @returns The ElementRef instance to use
 */
export function injectElementRef(ElementRefToken) {
    return createElementRef(ElementRefToken, getPreviousOrParentTNode(), _getViewData());
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
    return new R3ElementRef(getLNode(tNode, view).native);
}
var R3TemplateRef;
/**
 * Creates a TemplateRef given a node.
 *
 * @returns The TemplateRef instance to use
 */
export function injectTemplateRef(TemplateRefToken, ElementRefToken) {
    return createTemplateRef(TemplateRefToken, ElementRefToken, getPreviousOrParentTNode(), _getViewData());
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
    var hostContainer = hostView[hostTNode.index];
    ngDevMode && assertNodeType(hostTNode, 0 /* Container */);
    ngDevMode && assertDefined(hostTNode.tViews, 'TView must be allocated');
    return new R3TemplateRef(hostView, createElementRef(ElementRefToken, hostTNode, hostView), hostTNode.tViews, getRenderer(), hostContainer[QUERIES], hostTNode.injectorIndex);
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
    return createContainerRef(ViewContainerRefToken, ElementRefToken, previousTNode, _getViewData());
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
                    var parentIndex = parentLocation & 32767 /* InjectorIndexMask */;
                    var parentTNode = parentView[TVIEW].data[parentIndex];
                    return parentLocation === -1 ? new NullInjector() :
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
        var comment = hostView[RENDERER].createComment(ngDevMode ? 'container' : '');
        ngDevMode && ngDevMode.rendererCreateComment++;
        hostView[hostTNode.index] = lContainer =
            createLContainer(slotValue, hostTNode, hostView, comment, true);
        appendChild(comment, hostTNode, hostView);
        addToViewTree(hostView, hostTNode.index, lContainer);
    }
    return new R3ViewContainerRef(lContainer, hostTNode, hostView);
}
/** Returns a ChangeDetectorRef (a.k.a. a ViewRef) */
export function injectChangeDetectorRef() {
    return createViewRef(getPreviousOrParentTNode(), _getViewData(), null);
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
        var componentIndex = hostTNode.flags >> 15 /* DirectiveStartingIndexShift */;
        var componentView = getLNode(hostTNode, hostView).data;
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
    return getOrCreateRenderer2(_getViewData());
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld19lbmdpbmVfY29tcGF0aWJpbGl0eS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvdmlld19lbmdpbmVfY29tcGF0aWJpbGl0eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBR0gsT0FBTyxFQUFXLFlBQVksRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBR3RELE9BQU8sRUFBQyxXQUFXLElBQUksc0JBQXNCLEVBQUMsTUFBTSw2QkFBNkIsQ0FBQztBQU1sRixPQUFPLEVBQUMsYUFBYSxFQUFFLGlCQUFpQixFQUFFLGNBQWMsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUMxRSxPQUFPLEVBQUMsWUFBWSxFQUFFLHlCQUF5QixFQUFFLHFCQUFxQixFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQ3BGLE9BQU8sRUFBQyxZQUFZLEVBQUUsYUFBYSxFQUFFLHlCQUF5QixFQUFFLGdCQUFnQixFQUFFLHdCQUF3QixFQUFFLFdBQVcsRUFBRSxzQkFBc0IsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ3ZLLE9BQU8sRUFBQyxZQUFZLEVBQWMsTUFBTSxFQUFpQixLQUFLLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUs5RixPQUFPLEVBQWdDLG9CQUFvQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDMUYsT0FBTyxFQUFDLE9BQU8sRUFBRSxTQUFTLEVBQWEsT0FBTyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQVEsTUFBTSxtQkFBbUIsQ0FBQztBQUNqRyxPQUFPLEVBQUMseUJBQXlCLEVBQUUsY0FBYyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ3hFLE9BQU8sRUFBQywwQkFBMEIsRUFBRSxXQUFXLEVBQUUsVUFBVSxFQUFFLGlCQUFpQixFQUFFLG9CQUFvQixFQUFtQixVQUFVLEVBQUUsVUFBVSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFD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QGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtDaGFuZ2VEZXRlY3RvclJlZiBhcyBWaWV3RW5naW5lX0NoYW5nZURldGVjdG9yUmVmfSBmcm9tICcuLi9jaGFuZ2VfZGV0ZWN0aW9uL2NoYW5nZV9kZXRlY3Rvcl9yZWYnO1xuaW1wb3J0IHtJbmplY3RvciwgTnVsbEluamVjdG9yfSBmcm9tICcuLi9kaS9pbmplY3Rvcic7XG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnkgYXMgdmlld0VuZ2luZV9Db21wb25lbnRGYWN0b3J5LCBDb21wb25lbnRSZWYgYXMgdmlld0VuZ2luZV9Db21wb25lbnRSZWZ9IGZyb20gJy4uL2xpbmtlci9jb21wb25lbnRfZmFjdG9yeSc7XG5pbXBvcnQge0VsZW1lbnRSZWYgYXMgVmlld0VuZ2luZV9FbGVtZW50UmVmfSBmcm9tICcuLi9saW5rZXIvZWxlbWVudF9yZWYnO1xuaW1wb3J0IHtOZ01vZHVsZVJlZiBhcyB2aWV3RW5naW5lX05nTW9kdWxlUmVmfSBmcm9tICcuLi9saW5rZXIvbmdfbW9kdWxlX2ZhY3RvcnknO1xuaW1wb3J0IHtUZW1wbGF0ZVJlZiBhcyBWaWV3RW5naW5lX1RlbXBsYXRlUmVmfSBmcm9tICcuLi9saW5rZXIvdGVtcGxhdGVfcmVmJztcbmltcG9ydCB7Vmlld0NvbnRhaW5lclJlZiBhcyBWaWV3RW5naW5lX1ZpZXdDb250YWluZXJSZWZ9IGZyb20gJy4uL2xpbmtlci92aWV3X2NvbnRhaW5lcl9yZWYnO1xuaW1wb3J0IHtFbWJlZGRlZFZpZXdSZWYgYXMgdmlld0VuZ2luZV9FbWJlZGRlZFZpZXdSZWYsIFZpZXdSZWYgYXMgdmlld0VuZ2luZV9WaWV3UmVmfSBmcm9tICcuLi9saW5rZXIvdmlld19yZWYnO1xuaW1wb3J0IHtSZW5kZXJlcjJ9IGZyb20gJy4uL3JlbmRlci9hcGknO1xuXG5pbXBvcnQge2Fzc2VydERlZmluZWQsIGFzc2VydEdyZWF0ZXJUaGFuLCBhc3NlcnRMZXNzVGhhbn0gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHtOb2RlSW5qZWN0b3IsIGdldFBhcmVudEluamVjdG9yTG9jYXRpb24sIGdldFBhcmVudEluamVjdG9yVmlld30gZnJvbSAnLi9kaSc7XG5pbXBvcnQge19nZXRWaWV3RGF0YSwgYWRkVG9WaWV3VHJlZSwgY3JlYXRlRW1iZWRkZWRWaWV3QW5kTm9kZSwgY3JlYXRlTENvbnRhaW5lciwgZ2V0UHJldmlvdXNPclBhcmVudFROb2RlLCBnZXRSZW5kZXJlciwgcmVuZGVyRW1iZWRkZWRUZW1wbGF0ZX0gZnJvbSAnLi9pbnN0cnVjdGlvbnMnO1xuaW1wb3J0IHtBQ1RJVkVfSU5ERVgsIExDb250YWluZXIsIE5BVElWRSwgUkVOREVSX1BBUkVOVCwgVklFV1N9IGZyb20gJy4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtSZW5kZXJGbGFnc30gZnJvbSAnLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtJbmplY3RvckxvY2F0aW9uRmxhZ3N9IGZyb20gJy4vaW50ZXJmYWNlcy9pbmplY3Rvcic7XG5pbXBvcnQge1RDb250YWluZXJOb2RlLCBURWxlbWVudENvbnRhaW5lck5vZGUsIFRFbGVtZW50Tm9kZSwgVE5vZGUsIFROb2RlRmxhZ3MsIFROb2RlVHlwZSwgVFZpZXdOb2RlfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge0xRdWVyaWVzfSBmcm9tICcuL2ludGVyZmFjZXMvcXVlcnknO1xuaW1wb3J0IHtSQ29tbWVudCwgUkVsZW1lbnQsIFJlbmRlcmVyMywgaXNQcm9jZWR1cmFsUmVuZGVyZXJ9IGZyb20gJy4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge0NPTlRFWFQsIEhPU1RfTk9ERSwgTFZpZXdEYXRhLCBRVUVSSUVTLCBSRU5ERVJFUiwgVFZJRVcsIFRWaWV3fSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXMsIGFzc2VydE5vZGVUeXBlfSBmcm9tICcuL25vZGVfYXNzZXJ0JztcbmltcG9ydCB7YWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIsIGFwcGVuZENoaWxkLCBkZXRhY2hWaWV3LCBmaW5kQ29tcG9uZW50VmlldywgZ2V0QmVmb3JlTm9kZUZvclZpZXcsIGdldFJlbmRlclBhcmVudCwgaW5zZXJ0VmlldywgcmVtb3ZlVmlld30gZnJvbSAnLi9ub2RlX21hbmlwdWxhdGlvbic7XG5pbXBvcnQge2dldExOb2RlLCBpc0NvbXBvbmVudCwgaXNMQ29udGFpbmVyfSBmcm9tICcuL3V0aWwnO1xuaW1wb3J0IHtWaWV3UmVmfSBmcm9tICcuL3ZpZXdfcmVmJztcblxuXG5cbi8qKlxuICogQ3JlYXRlcyBhbiBFbGVtZW50UmVmIGZyb20gdGhlIG1vc3QgcmVjZW50IG5vZGUuXG4gKlxuICogQHJldHVybnMgVGhlIEVsZW1lbnRSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RFbGVtZW50UmVmKEVsZW1lbnRSZWZUb2tlbjogdHlwZW9mIFZpZXdFbmdpbmVfRWxlbWVudFJlZik6XG4gICAgVmlld0VuZ2luZV9FbGVtZW50UmVmIHtcbiAgcmV0dXJuIGNyZWF0ZUVsZW1lbnRSZWYoRWxlbWVudFJlZlRva2VuLCBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKSwgX2dldFZpZXdEYXRhKCkpO1xufVxuXG5sZXQgUjNFbGVtZW50UmVmOiB7bmV3IChuYXRpdmU6IFJFbGVtZW50IHwgUkNvbW1lbnQpOiBWaWV3RW5naW5lX0VsZW1lbnRSZWZ9O1xuXG4vKipcbiAqIENyZWF0ZXMgYW4gRWxlbWVudFJlZiBnaXZlbiBhIG5vZGUuXG4gKlxuICogQHBhcmFtIEVsZW1lbnRSZWZUb2tlbiBUaGUgRWxlbWVudFJlZiB0eXBlXG4gKiBAcGFyYW0gdE5vZGUgVGhlIG5vZGUgZm9yIHdoaWNoIHlvdSdkIGxpa2UgYW4gRWxlbWVudFJlZlxuICogQHBhcmFtIHZpZXcgVGhlIHZpZXcgdG8gd2hpY2ggdGhlIG5vZGUgYmVsb25nc1xuICogQHJldHVybnMgVGhlIEVsZW1lbnRSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFbGVtZW50UmVmKFxuICAgIEVsZW1lbnRSZWZUb2tlbjogdHlwZW9mIFZpZXdFbmdpbmVfRWxlbWVudFJlZiwgdE5vZGU6IFROb2RlLFxuICAgIHZpZXc6IExWaWV3RGF0YSk6IFZpZXdFbmdpbmVfRWxlbWVudFJlZiB7XG4gIGlmICghUjNFbGVtZW50UmVmKSB7XG4gICAgLy8gVE9ETzogRml4IGNsYXNzIG5hbWUsIHNob3VsZCBiZSBFbGVtZW50UmVmLCBidXQgdGhlcmUgYXBwZWFycyB0byBiZSBhIHJvbGx1cCBidWdcbiAgICBSM0VsZW1lbnRSZWYgPSBjbGFzcyBFbGVtZW50UmVmXyBleHRlbmRzIEVsZW1lbnRSZWZUb2tlbiB7fTtcbiAgfVxuICByZXR1cm4gbmV3IFIzRWxlbWVudFJlZihnZXRMTm9kZSh0Tm9kZSwgdmlldykubmF0aXZlKTtcbn1cblxubGV0IFIzVGVtcGxhdGVSZWY6IHtcbiAgbmV3IChcbiAgICAgIF9kZWNsYXJhdGlvblBhcmVudFZpZXc6IExWaWV3RGF0YSwgZWxlbWVudFJlZjogVmlld0VuZ2luZV9FbGVtZW50UmVmLCBfdFZpZXc6IFRWaWV3LFxuICAgICAgX3JlbmRlcmVyOiBSZW5kZXJlcjMsIF9xdWVyaWVzOiBMUXVlcmllcyB8IG51bGwsIF9pbmplY3RvckluZGV4OiBudW1iZXIpOlxuICAgICAgVmlld0VuZ2luZV9UZW1wbGF0ZVJlZjxhbnk+XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBUZW1wbGF0ZVJlZiBnaXZlbiBhIG5vZGUuXG4gKlxuICogQHJldHVybnMgVGhlIFRlbXBsYXRlUmVmIGluc3RhbmNlIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0VGVtcGxhdGVSZWY8VD4oXG4gICAgVGVtcGxhdGVSZWZUb2tlbjogdHlwZW9mIFZpZXdFbmdpbmVfVGVtcGxhdGVSZWYsXG4gICAgRWxlbWVudFJlZlRva2VuOiB0eXBlb2YgVmlld0VuZ2luZV9FbGVtZW50UmVmKTogVmlld0VuZ2luZV9UZW1wbGF0ZVJlZjxUPiB7XG4gIHJldHVybiBjcmVhdGVUZW1wbGF0ZVJlZjxUPihcbiAgICAgIFRlbXBsYXRlUmVmVG9rZW4sIEVsZW1lbnRSZWZUb2tlbiwgZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCksIF9nZXRWaWV3RGF0YSgpKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgVGVtcGxhdGVSZWYgYW5kIHN0b3JlcyBpdCBvbiB0aGUgaW5qZWN0b3IuXG4gKlxuICogQHBhcmFtIFRlbXBsYXRlUmVmVG9rZW4gVGhlIFRlbXBsYXRlUmVmIHR5cGVcbiAqIEBwYXJhbSBFbGVtZW50UmVmVG9rZW4gVGhlIEVsZW1lbnRSZWYgdHlwZVxuICogQHBhcmFtIGhvc3RUTm9kZSBUaGUgbm9kZSB0aGF0IGlzIHJlcXVlc3RpbmcgYSBUZW1wbGF0ZVJlZlxuICogQHBhcmFtIGhvc3RWaWV3IFRoZSB2aWV3IHRvIHdoaWNoIHRoZSBub2RlIGJlbG9uZ3NcbiAqIEByZXR1cm5zIFRoZSBUZW1wbGF0ZVJlZiBpbnN0YW5jZSB0byB1c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVRlbXBsYXRlUmVmPFQ+KFxuICAgIFRlbXBsYXRlUmVmVG9rZW46IHR5cGVvZiBWaWV3RW5naW5lX1RlbXBsYXRlUmVmLCBFbGVtZW50UmVmVG9rZW46IHR5cGVvZiBWaWV3RW5naW5lX0VsZW1lbnRSZWYsXG4gICAgaG9zdFROb2RlOiBUTm9kZSwgaG9zdFZpZXc6IExWaWV3RGF0YSk6IFZpZXdFbmdpbmVfVGVtcGxhdGVSZWY8VD4ge1xuICBpZiAoIVIzVGVtcGxhdGVSZWYpIHtcbiAgICAvLyBUT0RPOiBGaXggY2xhc3MgbmFtZSwgc2hvdWxkIGJlIFRlbXBsYXRlUmVmLCBidXQgdGhlcmUgYXBwZWFycyB0byBiZSBhIHJvbGx1cCBidWdcbiAgICBSM1RlbXBsYXRlUmVmID0gY2xhc3MgVGVtcGxhdGVSZWZfPFQ+IGV4dGVuZHMgVGVtcGxhdGVSZWZUb2tlbjxUPiB7XG4gICAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgICBwcml2YXRlIF9kZWNsYXJhdGlvblBhcmVudFZpZXc6IExWaWV3RGF0YSwgcmVhZG9ubHkgZWxlbWVudFJlZjogVmlld0VuZ2luZV9FbGVtZW50UmVmLFxuICAgICAgICAgIHByaXZhdGUgX3RWaWV3OiBUVmlldywgcHJpdmF0ZSBfcmVuZGVyZXI6IFJlbmRlcmVyMywgcHJpdmF0ZSBfcXVlcmllczogTFF1ZXJpZXN8bnVsbCxcbiAgICAgICAgICBwcml2YXRlIF9pbmplY3RvckluZGV4OiBudW1iZXIpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgIH1cblxuICAgICAgY3JlYXRlRW1iZWRkZWRWaWV3KFxuICAgICAgICAgIGNvbnRleHQ6IFQsIGNvbnRhaW5lcj86IExDb250YWluZXIsXG4gICAgICAgICAgaG9zdFROb2RlPzogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZSwgaG9zdFZpZXc/OiBMVmlld0RhdGEsXG4gICAgICAgICAgaW5kZXg/OiBudW1iZXIpOiB2aWV3RW5naW5lX0VtYmVkZGVkVmlld1JlZjxUPiB7XG4gICAgICAgIGNvbnN0IGxWaWV3ID0gY3JlYXRlRW1iZWRkZWRWaWV3QW5kTm9kZShcbiAgICAgICAgICAgIHRoaXMuX3RWaWV3LCBjb250ZXh0LCB0aGlzLl9kZWNsYXJhdGlvblBhcmVudFZpZXcsIHRoaXMuX3JlbmRlcmVyLCB0aGlzLl9xdWVyaWVzLFxuICAgICAgICAgICAgdGhpcy5faW5qZWN0b3JJbmRleCk7XG4gICAgICAgIGlmIChjb250YWluZXIpIHtcbiAgICAgICAgICBpbnNlcnRWaWV3KGxWaWV3LCBjb250YWluZXIsIGhvc3RWaWV3ICEsIGluZGV4ICEsIGhvc3RUTm9kZSAhLmluZGV4KTtcbiAgICAgICAgfVxuICAgICAgICByZW5kZXJFbWJlZGRlZFRlbXBsYXRlKGxWaWV3LCB0aGlzLl90VmlldywgY29udGV4dCwgUmVuZGVyRmxhZ3MuQ3JlYXRlKTtcbiAgICAgICAgY29uc3Qgdmlld1JlZiA9IG5ldyBWaWV3UmVmKGxWaWV3LCBjb250ZXh0LCAtMSk7XG4gICAgICAgIHZpZXdSZWYuX3RWaWV3Tm9kZSA9IGxWaWV3W0hPU1RfTk9ERV0gYXMgVFZpZXdOb2RlO1xuICAgICAgICByZXR1cm4gdmlld1JlZjtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgY29uc3QgaG9zdENvbnRhaW5lcjogTENvbnRhaW5lciA9IGhvc3RWaWV3W2hvc3RUTm9kZS5pbmRleF07XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShob3N0VE5vZGUsIFROb2RlVHlwZS5Db250YWluZXIpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChob3N0VE5vZGUudFZpZXdzLCAnVFZpZXcgbXVzdCBiZSBhbGxvY2F0ZWQnKTtcbiAgcmV0dXJuIG5ldyBSM1RlbXBsYXRlUmVmKFxuICAgICAgaG9zdFZpZXcsIGNyZWF0ZUVsZW1lbnRSZWYoRWxlbWVudFJlZlRva2VuLCBob3N0VE5vZGUsIGhvc3RWaWV3KSwgaG9zdFROb2RlLnRWaWV3cyBhcyBUVmlldyxcbiAgICAgIGdldFJlbmRlcmVyKCksIGhvc3RDb250YWluZXJbUVVFUklFU10sIGhvc3RUTm9kZS5pbmplY3RvckluZGV4KTtcbn1cblxubGV0IFIzVmlld0NvbnRhaW5lclJlZjoge1xuICBuZXcgKFxuICAgICAgbENvbnRhaW5lcjogTENvbnRhaW5lciwgaG9zdFROb2RlOiBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSxcbiAgICAgIGhvc3RWaWV3OiBMVmlld0RhdGEpOiBWaWV3RW5naW5lX1ZpZXdDb250YWluZXJSZWZcbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIFZpZXdDb250YWluZXJSZWYgYW5kIHN0b3JlcyBpdCBvbiB0aGUgaW5qZWN0b3IuIE9yLCBpZiB0aGUgVmlld0NvbnRhaW5lclJlZlxuICogYWxyZWFkeSBleGlzdHMsIHJldHJpZXZlcyB0aGUgZXhpc3RpbmcgVmlld0NvbnRhaW5lclJlZi5cbiAqXG4gKiBAcmV0dXJucyBUaGUgVmlld0NvbnRhaW5lclJlZiBpbnN0YW5jZSB0byB1c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdFZpZXdDb250YWluZXJSZWYoXG4gICAgVmlld0NvbnRhaW5lclJlZlRva2VuOiB0eXBlb2YgVmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmLFxuICAgIEVsZW1lbnRSZWZUb2tlbjogdHlwZW9mIFZpZXdFbmdpbmVfRWxlbWVudFJlZik6IFZpZXdFbmdpbmVfVmlld0NvbnRhaW5lclJlZiB7XG4gIGNvbnN0IHByZXZpb3VzVE5vZGUgPVxuICAgICAgZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCkgYXMgVEVsZW1lbnROb2RlIHwgVEVsZW1lbnRDb250YWluZXJOb2RlIHwgVENvbnRhaW5lck5vZGU7XG4gIHJldHVybiBjcmVhdGVDb250YWluZXJSZWYoVmlld0NvbnRhaW5lclJlZlRva2VuLCBFbGVtZW50UmVmVG9rZW4sIHByZXZpb3VzVE5vZGUsIF9nZXRWaWV3RGF0YSgpKTtcbn1cblxuXG4vKipcbiAqIENyZWF0ZXMgYSBWaWV3Q29udGFpbmVyUmVmIGFuZCBzdG9yZXMgaXQgb24gdGhlIGluamVjdG9yLlxuICpcbiAqIEBwYXJhbSBWaWV3Q29udGFpbmVyUmVmVG9rZW4gVGhlIFZpZXdDb250YWluZXJSZWYgdHlwZVxuICogQHBhcmFtIEVsZW1lbnRSZWZUb2tlbiBUaGUgRWxlbWVudFJlZiB0eXBlXG4gKiBAcGFyYW0gaG9zdFROb2RlIFRoZSBub2RlIHRoYXQgaXMgcmVxdWVzdGluZyBhIFZpZXdDb250YWluZXJSZWZcbiAqIEBwYXJhbSBob3N0VmlldyBUaGUgdmlldyB0byB3aGljaCB0aGUgbm9kZSBiZWxvbmdzXG4gKiBAcmV0dXJucyBUaGUgVmlld0NvbnRhaW5lclJlZiBpbnN0YW5jZSB0byB1c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUNvbnRhaW5lclJlZihcbiAgICBWaWV3Q29udGFpbmVyUmVmVG9rZW46IHR5cGVvZiBWaWV3RW5naW5lX1ZpZXdDb250YWluZXJSZWYsXG4gICAgRWxlbWVudFJlZlRva2VuOiB0eXBlb2YgVmlld0VuZ2luZV9FbGVtZW50UmVmLFxuICAgIGhvc3RUTm9kZTogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZSxcbiAgICBob3N0VmlldzogTFZpZXdEYXRhKTogVmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmIHtcbiAgaWYgKCFSM1ZpZXdDb250YWluZXJSZWYpIHtcbiAgICAvLyBUT0RPOiBGaXggY2xhc3MgbmFtZSwgc2hvdWxkIGJlIFZpZXdDb250YWluZXJSZWYsIGJ1dCB0aGVyZSBhcHBlYXJzIHRvIGJlIGEgcm9sbHVwIGJ1Z1xuICAgIFIzVmlld0NvbnRhaW5lclJlZiA9IGNsYXNzIFZpZXdDb250YWluZXJSZWZfIGV4dGVuZHMgVmlld0NvbnRhaW5lclJlZlRva2VuIHtcbiAgICAgIHByaXZhdGUgX3ZpZXdSZWZzOiB2aWV3RW5naW5lX1ZpZXdSZWZbXSA9IFtdO1xuXG4gICAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgICBwcml2YXRlIF9sQ29udGFpbmVyOiBMQ29udGFpbmVyLFxuICAgICAgICAgIHByaXZhdGUgX2hvc3RUTm9kZTogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZSxcbiAgICAgICAgICBwcml2YXRlIF9ob3N0VmlldzogTFZpZXdEYXRhKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICB9XG5cbiAgICAgIGdldCBlbGVtZW50KCk6IFZpZXdFbmdpbmVfRWxlbWVudFJlZiB7XG4gICAgICAgIHJldHVybiBjcmVhdGVFbGVtZW50UmVmKEVsZW1lbnRSZWZUb2tlbiwgdGhpcy5faG9zdFROb2RlLCB0aGlzLl9ob3N0Vmlldyk7XG4gICAgICB9XG5cbiAgICAgIGdldCBpbmplY3RvcigpOiBJbmplY3RvciB7IHJldHVybiBuZXcgTm9kZUluamVjdG9yKHRoaXMuX2hvc3RUTm9kZSwgdGhpcy5faG9zdFZpZXcpOyB9XG5cbiAgICAgIC8qKiBAZGVwcmVjYXRlZCBObyByZXBsYWNlbWVudCAqL1xuICAgICAgZ2V0IHBhcmVudEluamVjdG9yKCk6IEluamVjdG9yIHtcbiAgICAgICAgY29uc3QgcGFyZW50TG9jYXRpb24gPSBnZXRQYXJlbnRJbmplY3RvckxvY2F0aW9uKHRoaXMuX2hvc3RUTm9kZSwgdGhpcy5faG9zdFZpZXcpO1xuICAgICAgICBjb25zdCBwYXJlbnRWaWV3ID0gZ2V0UGFyZW50SW5qZWN0b3JWaWV3KHBhcmVudExvY2F0aW9uLCB0aGlzLl9ob3N0Vmlldyk7XG4gICAgICAgIGNvbnN0IHBhcmVudEluZGV4ID0gcGFyZW50TG9jYXRpb24gJiBJbmplY3RvckxvY2F0aW9uRmxhZ3MuSW5qZWN0b3JJbmRleE1hc2s7XG4gICAgICAgIGNvbnN0IHBhcmVudFROb2RlID0gcGFyZW50Vmlld1tUVklFV10uZGF0YVtwYXJlbnRJbmRleF0gYXMgVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGU7XG5cbiAgICAgICAgcmV0dXJuIHBhcmVudExvY2F0aW9uID09PSAtMSA/IG5ldyBOdWxsSW5qZWN0b3IoKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXcgTm9kZUluamVjdG9yKHBhcmVudFROb2RlLCBwYXJlbnRWaWV3KTtcbiAgICAgIH1cblxuICAgICAgY2xlYXIoKTogdm9pZCB7XG4gICAgICAgIHdoaWxlICh0aGlzLl9sQ29udGFpbmVyW1ZJRVdTXS5sZW5ndGgpIHtcbiAgICAgICAgICB0aGlzLnJlbW92ZSgwKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBnZXQoaW5kZXg6IG51bWJlcik6IHZpZXdFbmdpbmVfVmlld1JlZnxudWxsIHsgcmV0dXJuIHRoaXMuX3ZpZXdSZWZzW2luZGV4XSB8fCBudWxsOyB9XG5cbiAgICAgIGdldCBsZW5ndGgoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuX2xDb250YWluZXJbVklFV1NdLmxlbmd0aDsgfVxuXG4gICAgICBjcmVhdGVFbWJlZGRlZFZpZXc8Qz4odGVtcGxhdGVSZWY6IFZpZXdFbmdpbmVfVGVtcGxhdGVSZWY8Qz4sIGNvbnRleHQ/OiBDLCBpbmRleD86IG51bWJlcik6XG4gICAgICAgICAgdmlld0VuZ2luZV9FbWJlZGRlZFZpZXdSZWY8Qz4ge1xuICAgICAgICBjb25zdCBhZGp1c3RlZElkeCA9IHRoaXMuX2FkanVzdEluZGV4KGluZGV4KTtcbiAgICAgICAgY29uc3Qgdmlld1JlZiA9ICh0ZW1wbGF0ZVJlZiBhcyBhbnkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmNyZWF0ZUVtYmVkZGVkVmlldyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dCB8fCA8YW55Pnt9LCB0aGlzLl9sQ29udGFpbmVyLCB0aGlzLl9ob3N0VE5vZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2hvc3RWaWV3LCBhZGp1c3RlZElkeCk7XG4gICAgICAgICh2aWV3UmVmIGFzIFZpZXdSZWY8YW55PikuYXR0YWNoVG9WaWV3Q29udGFpbmVyUmVmKHRoaXMpO1xuICAgICAgICB0aGlzLl92aWV3UmVmcy5zcGxpY2UoYWRqdXN0ZWRJZHgsIDAsIHZpZXdSZWYpO1xuICAgICAgICByZXR1cm4gdmlld1JlZjtcbiAgICAgIH1cblxuICAgICAgY3JlYXRlQ29tcG9uZW50PEM+KFxuICAgICAgICAgIGNvbXBvbmVudEZhY3Rvcnk6IHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeTxDPiwgaW5kZXg/OiBudW1iZXJ8dW5kZWZpbmVkLFxuICAgICAgICAgIGluamVjdG9yPzogSW5qZWN0b3J8dW5kZWZpbmVkLCBwcm9qZWN0YWJsZU5vZGVzPzogYW55W11bXXx1bmRlZmluZWQsXG4gICAgICAgICAgbmdNb2R1bGVSZWY/OiB2aWV3RW5naW5lX05nTW9kdWxlUmVmPGFueT58dW5kZWZpbmVkKTogdmlld0VuZ2luZV9Db21wb25lbnRSZWY8Qz4ge1xuICAgICAgICBjb25zdCBjb250ZXh0SW5qZWN0b3IgPSBpbmplY3RvciB8fCB0aGlzLnBhcmVudEluamVjdG9yO1xuICAgICAgICBpZiAoIW5nTW9kdWxlUmVmICYmIGNvbnRleHRJbmplY3Rvcikge1xuICAgICAgICAgIG5nTW9kdWxlUmVmID0gY29udGV4dEluamVjdG9yLmdldCh2aWV3RW5naW5lX05nTW9kdWxlUmVmLCBudWxsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNvbXBvbmVudFJlZiA9XG4gICAgICAgICAgICBjb21wb25lbnRGYWN0b3J5LmNyZWF0ZShjb250ZXh0SW5qZWN0b3IsIHByb2plY3RhYmxlTm9kZXMsIHVuZGVmaW5lZCwgbmdNb2R1bGVSZWYpO1xuICAgICAgICB0aGlzLmluc2VydChjb21wb25lbnRSZWYuaG9zdFZpZXcsIGluZGV4KTtcbiAgICAgICAgcmV0dXJuIGNvbXBvbmVudFJlZjtcbiAgICAgIH1cblxuICAgICAgaW5zZXJ0KHZpZXdSZWY6IHZpZXdFbmdpbmVfVmlld1JlZiwgaW5kZXg/OiBudW1iZXIpOiB2aWV3RW5naW5lX1ZpZXdSZWYge1xuICAgICAgICBpZiAodmlld1JlZi5kZXN0cm95ZWQpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBpbnNlcnQgYSBkZXN0cm95ZWQgVmlldyBpbiBhIFZpZXdDb250YWluZXIhJyk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbFZpZXcgPSAodmlld1JlZiBhcyBWaWV3UmVmPGFueT4pLl92aWV3ICE7XG4gICAgICAgIGNvbnN0IGFkanVzdGVkSWR4ID0gdGhpcy5fYWRqdXN0SW5kZXgoaW5kZXgpO1xuXG4gICAgICAgIGluc2VydFZpZXcobFZpZXcsIHRoaXMuX2xDb250YWluZXIsIHRoaXMuX2hvc3RWaWV3LCBhZGp1c3RlZElkeCwgdGhpcy5faG9zdFROb2RlLmluZGV4KTtcblxuICAgICAgICBjb25zdCBiZWZvcmVOb2RlID1cbiAgICAgICAgICAgIGdldEJlZm9yZU5vZGVGb3JWaWV3KGFkanVzdGVkSWR4LCB0aGlzLl9sQ29udGFpbmVyW1ZJRVdTXSwgdGhpcy5fbENvbnRhaW5lcltOQVRJVkVdKTtcbiAgICAgICAgYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIobFZpZXcsIHRydWUsIGJlZm9yZU5vZGUpO1xuXG4gICAgICAgICh2aWV3UmVmIGFzIFZpZXdSZWY8YW55PikuYXR0YWNoVG9WaWV3Q29udGFpbmVyUmVmKHRoaXMpO1xuICAgICAgICB0aGlzLl92aWV3UmVmcy5zcGxpY2UoYWRqdXN0ZWRJZHgsIDAsIHZpZXdSZWYpO1xuXG4gICAgICAgIHJldHVybiB2aWV3UmVmO1xuICAgICAgfVxuXG4gICAgICBtb3ZlKHZpZXdSZWY6IHZpZXdFbmdpbmVfVmlld1JlZiwgbmV3SW5kZXg6IG51bWJlcik6IHZpZXdFbmdpbmVfVmlld1JlZiB7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5pbmRleE9mKHZpZXdSZWYpO1xuICAgICAgICB0aGlzLmRldGFjaChpbmRleCk7XG4gICAgICAgIHRoaXMuaW5zZXJ0KHZpZXdSZWYsIHRoaXMuX2FkanVzdEluZGV4KG5ld0luZGV4KSk7XG4gICAgICAgIHJldHVybiB2aWV3UmVmO1xuICAgICAgfVxuXG4gICAgICBpbmRleE9mKHZpZXdSZWY6IHZpZXdFbmdpbmVfVmlld1JlZik6IG51bWJlciB7IHJldHVybiB0aGlzLl92aWV3UmVmcy5pbmRleE9mKHZpZXdSZWYpOyB9XG5cbiAgICAgIHJlbW92ZShpbmRleD86IG51bWJlcik6IHZvaWQge1xuICAgICAgICBjb25zdCBhZGp1c3RlZElkeCA9IHRoaXMuX2FkanVzdEluZGV4KGluZGV4LCAtMSk7XG4gICAgICAgIHJlbW92ZVZpZXcodGhpcy5fbENvbnRhaW5lciwgdGhpcy5faG9zdFROb2RlLCBhZGp1c3RlZElkeCk7XG4gICAgICAgIHRoaXMuX3ZpZXdSZWZzLnNwbGljZShhZGp1c3RlZElkeCwgMSk7XG4gICAgICB9XG5cbiAgICAgIGRldGFjaChpbmRleD86IG51bWJlcik6IHZpZXdFbmdpbmVfVmlld1JlZnxudWxsIHtcbiAgICAgICAgY29uc3QgYWRqdXN0ZWRJZHggPSB0aGlzLl9hZGp1c3RJbmRleChpbmRleCwgLTEpO1xuICAgICAgICBkZXRhY2hWaWV3KHRoaXMuX2xDb250YWluZXIsIGFkanVzdGVkSWR4LCAhIXRoaXMuX2hvc3RUTm9kZS5kZXRhY2hlZCk7XG4gICAgICAgIHJldHVybiB0aGlzLl92aWV3UmVmcy5zcGxpY2UoYWRqdXN0ZWRJZHgsIDEpWzBdIHx8IG51bGw7XG4gICAgICB9XG5cbiAgICAgIHByaXZhdGUgX2FkanVzdEluZGV4KGluZGV4PzogbnVtYmVyLCBzaGlmdDogbnVtYmVyID0gMCkge1xuICAgICAgICBpZiAoaW5kZXggPT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiB0aGlzLl9sQ29udGFpbmVyW1ZJRVdTXS5sZW5ndGggKyBzaGlmdDtcbiAgICAgICAgfVxuICAgICAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICAgICAgYXNzZXJ0R3JlYXRlclRoYW4oaW5kZXgsIC0xLCAnaW5kZXggbXVzdCBiZSBwb3NpdGl2ZScpO1xuICAgICAgICAgIC8vICsxIGJlY2F1c2UgaXQncyBsZWdhbCB0byBpbnNlcnQgYXQgdGhlIGVuZC5cbiAgICAgICAgICBhc3NlcnRMZXNzVGhhbihpbmRleCwgdGhpcy5fbENvbnRhaW5lcltWSUVXU10ubGVuZ3RoICsgMSArIHNoaWZ0LCAnaW5kZXgnKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaW5kZXg7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzKFxuICAgICAgICAgICAgICAgICAgIGhvc3RUTm9kZSwgVE5vZGVUeXBlLkNvbnRhaW5lciwgVE5vZGVUeXBlLkVsZW1lbnQsIFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKTtcblxuICBsZXQgbENvbnRhaW5lcjogTENvbnRhaW5lcjtcbiAgY29uc3Qgc2xvdFZhbHVlID0gaG9zdFZpZXdbaG9zdFROb2RlLmluZGV4XTtcbiAgaWYgKGlzTENvbnRhaW5lcihzbG90VmFsdWUpKSB7XG4gICAgLy8gSWYgdGhlIGhvc3QgaXMgYSBjb250YWluZXIsIHdlIGRvbid0IG5lZWQgdG8gY3JlYXRlIGEgbmV3IExDb250YWluZXJcbiAgICBsQ29udGFpbmVyID0gc2xvdFZhbHVlO1xuICAgIGxDb250YWluZXJbQUNUSVZFX0lOREVYXSA9IC0xO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IGNvbW1lbnQgPSBob3N0Vmlld1tSRU5ERVJFUl0uY3JlYXRlQ29tbWVudChuZ0Rldk1vZGUgPyAnY29udGFpbmVyJyA6ICcnKTtcbiAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQ3JlYXRlQ29tbWVudCsrO1xuICAgIGhvc3RWaWV3W2hvc3RUTm9kZS5pbmRleF0gPSBsQ29udGFpbmVyID1cbiAgICAgICAgY3JlYXRlTENvbnRhaW5lcihzbG90VmFsdWUsIGhvc3RUTm9kZSwgaG9zdFZpZXcsIGNvbW1lbnQsIHRydWUpO1xuXG4gICAgYXBwZW5kQ2hpbGQoY29tbWVudCwgaG9zdFROb2RlLCBob3N0Vmlldyk7XG4gICAgYWRkVG9WaWV3VHJlZShob3N0VmlldywgaG9zdFROb2RlLmluZGV4IGFzIG51bWJlciwgbENvbnRhaW5lcik7XG4gIH1cblxuICByZXR1cm4gbmV3IFIzVmlld0NvbnRhaW5lclJlZihsQ29udGFpbmVyLCBob3N0VE5vZGUsIGhvc3RWaWV3KTtcbn1cblxuXG4vKiogUmV0dXJucyBhIENoYW5nZURldGVjdG9yUmVmIChhLmsuYS4gYSBWaWV3UmVmKSAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdENoYW5nZURldGVjdG9yUmVmKCk6IFZpZXdFbmdpbmVfQ2hhbmdlRGV0ZWN0b3JSZWYge1xuICByZXR1cm4gY3JlYXRlVmlld1JlZihnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKSwgX2dldFZpZXdEYXRhKCksIG51bGwpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBWaWV3UmVmIGFuZCBzdG9yZXMgaXQgb24gdGhlIGluamVjdG9yIGFzIENoYW5nZURldGVjdG9yUmVmIChwdWJsaWMgYWxpYXMpLlxuICpcbiAqIEBwYXJhbSBob3N0VE5vZGUgVGhlIG5vZGUgdGhhdCBpcyByZXF1ZXN0aW5nIGEgQ2hhbmdlRGV0ZWN0b3JSZWZcbiAqIEBwYXJhbSBob3N0VmlldyBUaGUgdmlldyB0byB3aGljaCB0aGUgbm9kZSBiZWxvbmdzXG4gKiBAcGFyYW0gY29udGV4dCBUaGUgY29udGV4dCBmb3IgdGhpcyBjaGFuZ2UgZGV0ZWN0b3IgcmVmXG4gKiBAcmV0dXJucyBUaGUgQ2hhbmdlRGV0ZWN0b3JSZWYgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVWaWV3UmVmKFxuICAgIGhvc3RUTm9kZTogVE5vZGUsIGhvc3RWaWV3OiBMVmlld0RhdGEsIGNvbnRleHQ6IGFueSk6IFZpZXdFbmdpbmVfQ2hhbmdlRGV0ZWN0b3JSZWYge1xuICBpZiAoaXNDb21wb25lbnQoaG9zdFROb2RlKSkge1xuICAgIGNvbnN0IGNvbXBvbmVudEluZGV4ID0gaG9zdFROb2RlLmZsYWdzID4+IFROb2RlRmxhZ3MuRGlyZWN0aXZlU3RhcnRpbmdJbmRleFNoaWZ0O1xuICAgIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBnZXRMTm9kZShob3N0VE5vZGUsIGhvc3RWaWV3KS5kYXRhIGFzIExWaWV3RGF0YTtcbiAgICByZXR1cm4gbmV3IFZpZXdSZWYoY29tcG9uZW50VmlldywgY29udGV4dCwgY29tcG9uZW50SW5kZXgpO1xuICB9IGVsc2UgaWYgKGhvc3RUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCkge1xuICAgIGNvbnN0IGhvc3RDb21wb25lbnRWaWV3ID0gZmluZENvbXBvbmVudFZpZXcoaG9zdFZpZXcpO1xuICAgIHJldHVybiBuZXcgVmlld1JlZihob3N0Q29tcG9uZW50VmlldywgaG9zdENvbXBvbmVudFZpZXdbQ09OVEVYVF0sIC0xKTtcbiAgfVxuICByZXR1cm4gbnVsbCAhO1xufVxuXG5mdW5jdGlvbiBnZXRPckNyZWF0ZVJlbmRlcmVyMih2aWV3OiBMVmlld0RhdGEpOiBSZW5kZXJlcjIge1xuICBjb25zdCByZW5kZXJlciA9IHZpZXdbUkVOREVSRVJdO1xuICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgcmV0dXJuIHJlbmRlcmVyIGFzIFJlbmRlcmVyMjtcbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBpbmplY3QgUmVuZGVyZXIyIHdoZW4gdGhlIGFwcGxpY2F0aW9uIHVzZXMgUmVuZGVyZXIzIScpO1xuICB9XG59XG5cbi8qKiBSZXR1cm5zIGEgUmVuZGVyZXIyIChvciB0aHJvd3Mgd2hlbiBhcHBsaWNhdGlvbiB3YXMgYm9vdHN0cmFwcGVkIHdpdGggUmVuZGVyZXIzKSAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdFJlbmRlcmVyMigpOiBSZW5kZXJlcjIge1xuICByZXR1cm4gZ2V0T3JDcmVhdGVSZW5kZXJlcjIoX2dldFZpZXdEYXRhKCkpO1xufSJdfQ==