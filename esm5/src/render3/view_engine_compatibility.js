/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { NullInjector } from '../di/injector';
import { InjectFlags } from '../di/injector_compatibility';
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
        return getOrCreateInjectable(this._tNode, this._hostView, token, InjectFlags.Default, notFoundValue);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld19lbmdpbmVfY29tcGF0aWJpbGl0eS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvdmlld19lbmdpbmVfY29tcGF0aWJpbGl0eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBR0gsT0FBTyxFQUFXLFlBQVksRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ3RELE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUd6RCxPQUFPLEVBQUMsV0FBVyxJQUFJLHNCQUFzQixFQUFDLE1BQU0sNkJBQTZCLENBQUM7QUFNbEYsT0FBTyxFQUFDLGFBQWEsRUFBRSxpQkFBaUIsRUFBRSxjQUFjLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDMUUsT0FBTyxFQUFDLHFCQUFxQixFQUFFLHlCQUF5QixFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQ3RFLE9BQU8sRUFBQyxhQUFhLEVBQUUseUJBQXlCLEVBQUUsZ0JBQWdCLEVBQUUsc0JBQXNCLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUNsSCxPQUFPLEVBQUMsWUFBWSxFQUFjLE1BQU0sRUFBRSxLQUFLLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUkvRSxPQUFPLEVBQWdDLG9CQUFvQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDMUYsT0FBTyxFQUFDLE9BQU8sRUFBRSxTQUFTLEVBQWEsT0FBTyxFQUFFLFFBQVEsRUFBUSxNQUFNLG1CQUFtQixDQUFDO0FBQzFGLE9BQU8sRUFBQyx5QkFBeUIsRUFBaUIsTUFBTSxlQUFlLENBQUM7QUFDeEUsT0FBTyxFQUFDLDBCQUEwQixFQUFFLFdBQVcsRUFBRSxVQUFVLEVBQUUsaUJBQWlCLEVBQUUsb0JBQW9CLEVBQUUsVUFBVSxFQUFFLGtCQUFrQixFQUFFLGlCQUFpQixFQUFFLGdCQUFnQixFQUFFLFVBQVUsRUFBQyxNQUFN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ZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0NoYW5nZURldGVjdG9yUmVmIGFzIFZpZXdFbmdpbmVfQ2hhbmdlRGV0ZWN0b3JSZWZ9IGZyb20gJy4uL2NoYW5nZV9kZXRlY3Rpb24vY2hhbmdlX2RldGVjdG9yX3JlZic7XG5pbXBvcnQge0luamVjdG9yLCBOdWxsSW5qZWN0b3J9IGZyb20gJy4uL2RpL2luamVjdG9yJztcbmltcG9ydCB7SW5qZWN0RmxhZ3N9IGZyb20gJy4uL2RpL2luamVjdG9yX2NvbXBhdGliaWxpdHknO1xuaW1wb3J0IHtDb21wb25lbnRGYWN0b3J5IGFzIHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeSwgQ29tcG9uZW50UmVmIGFzIHZpZXdFbmdpbmVfQ29tcG9uZW50UmVmfSBmcm9tICcuLi9saW5rZXIvY29tcG9uZW50X2ZhY3RvcnknO1xuaW1wb3J0IHtFbGVtZW50UmVmIGFzIFZpZXdFbmdpbmVfRWxlbWVudFJlZn0gZnJvbSAnLi4vbGlua2VyL2VsZW1lbnRfcmVmJztcbmltcG9ydCB7TmdNb2R1bGVSZWYgYXMgdmlld0VuZ2luZV9OZ01vZHVsZVJlZn0gZnJvbSAnLi4vbGlua2VyL25nX21vZHVsZV9mYWN0b3J5JztcbmltcG9ydCB7VGVtcGxhdGVSZWYgYXMgVmlld0VuZ2luZV9UZW1wbGF0ZVJlZn0gZnJvbSAnLi4vbGlua2VyL3RlbXBsYXRlX3JlZic7XG5pbXBvcnQge1ZpZXdDb250YWluZXJSZWYgYXMgVmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmfSBmcm9tICcuLi9saW5rZXIvdmlld19jb250YWluZXJfcmVmJztcbmltcG9ydCB7RW1iZWRkZWRWaWV3UmVmIGFzIHZpZXdFbmdpbmVfRW1iZWRkZWRWaWV3UmVmLCBWaWV3UmVmIGFzIHZpZXdFbmdpbmVfVmlld1JlZn0gZnJvbSAnLi4vbGlua2VyL3ZpZXdfcmVmJztcbmltcG9ydCB7UmVuZGVyZXIyfSBmcm9tICcuLi9yZW5kZXIvYXBpJztcblxuaW1wb3J0IHthc3NlcnREZWZpbmVkLCBhc3NlcnRHcmVhdGVyVGhhbiwgYXNzZXJ0TGVzc1RoYW59IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7Z2V0T3JDcmVhdGVJbmplY3RhYmxlLCBnZXRQYXJlbnRJbmplY3RvckxvY2F0aW9ufSBmcm9tICcuL2RpJztcbmltcG9ydCB7YWRkVG9WaWV3VHJlZSwgY3JlYXRlRW1iZWRkZWRWaWV3QW5kTm9kZSwgY3JlYXRlTENvbnRhaW5lciwgcmVuZGVyRW1iZWRkZWRUZW1wbGF0ZX0gZnJvbSAnLi9pbnN0cnVjdGlvbnMnO1xuaW1wb3J0IHtBQ1RJVkVfSU5ERVgsIExDb250YWluZXIsIE5BVElWRSwgVklFV1N9IGZyb20gJy4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtSZW5kZXJGbGFnc30gZnJvbSAnLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtUQ29udGFpbmVyTm9kZSwgVEVsZW1lbnRDb250YWluZXJOb2RlLCBURWxlbWVudE5vZGUsIFROb2RlLCBUTm9kZUZsYWdzLCBUTm9kZVR5cGUsIFRWaWV3Tm9kZX0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtMUXVlcmllc30gZnJvbSAnLi9pbnRlcmZhY2VzL3F1ZXJ5JztcbmltcG9ydCB7UkNvbW1lbnQsIFJFbGVtZW50LCBSZW5kZXJlcjMsIGlzUHJvY2VkdXJhbFJlbmRlcmVyfSBmcm9tICcuL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtDT05URVhULCBIT1NUX05PREUsIExWaWV3RGF0YSwgUVVFUklFUywgUkVOREVSRVIsIFRWaWV3fSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXMsIGFzc2VydE5vZGVUeXBlfSBmcm9tICcuL25vZGVfYXNzZXJ0JztcbmltcG9ydCB7YWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIsIGFwcGVuZENoaWxkLCBkZXRhY2hWaWV3LCBmaW5kQ29tcG9uZW50VmlldywgZ2V0QmVmb3JlTm9kZUZvclZpZXcsIGluc2VydFZpZXcsIG5hdGl2ZUluc2VydEJlZm9yZSwgbmF0aXZlTmV4dFNpYmxpbmcsIG5hdGl2ZVBhcmVudE5vZGUsIHJlbW92ZVZpZXd9IGZyb20gJy4vbm9kZV9tYW5pcHVsYXRpb24nO1xuaW1wb3J0IHtnZXRQcmV2aW91c09yUGFyZW50VE5vZGUsIGdldFJlbmRlcmVyLCBnZXRWaWV3RGF0YX0gZnJvbSAnLi9zdGF0ZSc7XG5pbXBvcnQge2dldENvbXBvbmVudFZpZXdCeUluZGV4LCBnZXROYXRpdmVCeVROb2RlLCBnZXRQYXJlbnRJbmplY3RvclROb2RlLCBnZXRQYXJlbnRJbmplY3RvclZpZXcsIGhhc1BhcmVudEluamVjdG9yLCBpc0NvbXBvbmVudCwgaXNMQ29udGFpbmVyLCBpc1Jvb3RWaWV3fSBmcm9tICcuL3V0aWwnO1xuaW1wb3J0IHtWaWV3UmVmfSBmcm9tICcuL3ZpZXdfcmVmJztcblxuXG5cbi8qKlxuICogQ3JlYXRlcyBhbiBFbGVtZW50UmVmIGZyb20gdGhlIG1vc3QgcmVjZW50IG5vZGUuXG4gKlxuICogQHJldHVybnMgVGhlIEVsZW1lbnRSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RFbGVtZW50UmVmKEVsZW1lbnRSZWZUb2tlbjogdHlwZW9mIFZpZXdFbmdpbmVfRWxlbWVudFJlZik6XG4gICAgVmlld0VuZ2luZV9FbGVtZW50UmVmIHtcbiAgcmV0dXJuIGNyZWF0ZUVsZW1lbnRSZWYoRWxlbWVudFJlZlRva2VuLCBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKSwgZ2V0Vmlld0RhdGEoKSk7XG59XG5cbmxldCBSM0VsZW1lbnRSZWY6IHtuZXcgKG5hdGl2ZTogUkVsZW1lbnQgfCBSQ29tbWVudCk6IFZpZXdFbmdpbmVfRWxlbWVudFJlZn07XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBFbGVtZW50UmVmIGdpdmVuIGEgbm9kZS5cbiAqXG4gKiBAcGFyYW0gRWxlbWVudFJlZlRva2VuIFRoZSBFbGVtZW50UmVmIHR5cGVcbiAqIEBwYXJhbSB0Tm9kZSBUaGUgbm9kZSBmb3Igd2hpY2ggeW91J2QgbGlrZSBhbiBFbGVtZW50UmVmXG4gKiBAcGFyYW0gdmlldyBUaGUgdmlldyB0byB3aGljaCB0aGUgbm9kZSBiZWxvbmdzXG4gKiBAcmV0dXJucyBUaGUgRWxlbWVudFJlZiBpbnN0YW5jZSB0byB1c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVsZW1lbnRSZWYoXG4gICAgRWxlbWVudFJlZlRva2VuOiB0eXBlb2YgVmlld0VuZ2luZV9FbGVtZW50UmVmLCB0Tm9kZTogVE5vZGUsXG4gICAgdmlldzogTFZpZXdEYXRhKTogVmlld0VuZ2luZV9FbGVtZW50UmVmIHtcbiAgaWYgKCFSM0VsZW1lbnRSZWYpIHtcbiAgICAvLyBUT0RPOiBGaXggY2xhc3MgbmFtZSwgc2hvdWxkIGJlIEVsZW1lbnRSZWYsIGJ1dCB0aGVyZSBhcHBlYXJzIHRvIGJlIGEgcm9sbHVwIGJ1Z1xuICAgIFIzRWxlbWVudFJlZiA9IGNsYXNzIEVsZW1lbnRSZWZfIGV4dGVuZHMgRWxlbWVudFJlZlRva2VuIHt9O1xuICB9XG4gIHJldHVybiBuZXcgUjNFbGVtZW50UmVmKGdldE5hdGl2ZUJ5VE5vZGUodE5vZGUsIHZpZXcpKTtcbn1cblxubGV0IFIzVGVtcGxhdGVSZWY6IHtcbiAgbmV3IChcbiAgICAgIF9kZWNsYXJhdGlvblBhcmVudFZpZXc6IExWaWV3RGF0YSwgZWxlbWVudFJlZjogVmlld0VuZ2luZV9FbGVtZW50UmVmLCBfdFZpZXc6IFRWaWV3LFxuICAgICAgX3JlbmRlcmVyOiBSZW5kZXJlcjMsIF9xdWVyaWVzOiBMUXVlcmllcyB8IG51bGwsIF9pbmplY3RvckluZGV4OiBudW1iZXIpOlxuICAgICAgVmlld0VuZ2luZV9UZW1wbGF0ZVJlZjxhbnk+XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBUZW1wbGF0ZVJlZiBnaXZlbiBhIG5vZGUuXG4gKlxuICogQHJldHVybnMgVGhlIFRlbXBsYXRlUmVmIGluc3RhbmNlIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0VGVtcGxhdGVSZWY8VD4oXG4gICAgVGVtcGxhdGVSZWZUb2tlbjogdHlwZW9mIFZpZXdFbmdpbmVfVGVtcGxhdGVSZWYsXG4gICAgRWxlbWVudFJlZlRva2VuOiB0eXBlb2YgVmlld0VuZ2luZV9FbGVtZW50UmVmKTogVmlld0VuZ2luZV9UZW1wbGF0ZVJlZjxUPnxudWxsIHtcbiAgcmV0dXJuIGNyZWF0ZVRlbXBsYXRlUmVmPFQ+KFxuICAgICAgVGVtcGxhdGVSZWZUb2tlbiwgRWxlbWVudFJlZlRva2VuLCBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKSwgZ2V0Vmlld0RhdGEoKSk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIFRlbXBsYXRlUmVmIGFuZCBzdG9yZXMgaXQgb24gdGhlIGluamVjdG9yLlxuICpcbiAqIEBwYXJhbSBUZW1wbGF0ZVJlZlRva2VuIFRoZSBUZW1wbGF0ZVJlZiB0eXBlXG4gKiBAcGFyYW0gRWxlbWVudFJlZlRva2VuIFRoZSBFbGVtZW50UmVmIHR5cGVcbiAqIEBwYXJhbSBob3N0VE5vZGUgVGhlIG5vZGUgdGhhdCBpcyByZXF1ZXN0aW5nIGEgVGVtcGxhdGVSZWZcbiAqIEBwYXJhbSBob3N0VmlldyBUaGUgdmlldyB0byB3aGljaCB0aGUgbm9kZSBiZWxvbmdzXG4gKiBAcmV0dXJucyBUaGUgVGVtcGxhdGVSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUZW1wbGF0ZVJlZjxUPihcbiAgICBUZW1wbGF0ZVJlZlRva2VuOiB0eXBlb2YgVmlld0VuZ2luZV9UZW1wbGF0ZVJlZiwgRWxlbWVudFJlZlRva2VuOiB0eXBlb2YgVmlld0VuZ2luZV9FbGVtZW50UmVmLFxuICAgIGhvc3RUTm9kZTogVE5vZGUsIGhvc3RWaWV3OiBMVmlld0RhdGEpOiBWaWV3RW5naW5lX1RlbXBsYXRlUmVmPFQ+fG51bGwge1xuICBpZiAoIVIzVGVtcGxhdGVSZWYpIHtcbiAgICAvLyBUT0RPOiBGaXggY2xhc3MgbmFtZSwgc2hvdWxkIGJlIFRlbXBsYXRlUmVmLCBidXQgdGhlcmUgYXBwZWFycyB0byBiZSBhIHJvbGx1cCBidWdcbiAgICBSM1RlbXBsYXRlUmVmID0gY2xhc3MgVGVtcGxhdGVSZWZfPFQ+IGV4dGVuZHMgVGVtcGxhdGVSZWZUb2tlbjxUPiB7XG4gICAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgICBwcml2YXRlIF9kZWNsYXJhdGlvblBhcmVudFZpZXc6IExWaWV3RGF0YSwgcmVhZG9ubHkgZWxlbWVudFJlZjogVmlld0VuZ2luZV9FbGVtZW50UmVmLFxuICAgICAgICAgIHByaXZhdGUgX3RWaWV3OiBUVmlldywgcHJpdmF0ZSBfcmVuZGVyZXI6IFJlbmRlcmVyMywgcHJpdmF0ZSBfcXVlcmllczogTFF1ZXJpZXN8bnVsbCxcbiAgICAgICAgICBwcml2YXRlIF9pbmplY3RvckluZGV4OiBudW1iZXIpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgIH1cblxuICAgICAgY3JlYXRlRW1iZWRkZWRWaWV3KFxuICAgICAgICAgIGNvbnRleHQ6IFQsIGNvbnRhaW5lcj86IExDb250YWluZXIsXG4gICAgICAgICAgaG9zdFROb2RlPzogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZSwgaG9zdFZpZXc/OiBMVmlld0RhdGEsXG4gICAgICAgICAgaW5kZXg/OiBudW1iZXIpOiB2aWV3RW5naW5lX0VtYmVkZGVkVmlld1JlZjxUPiB7XG4gICAgICAgIGNvbnN0IGxWaWV3ID0gY3JlYXRlRW1iZWRkZWRWaWV3QW5kTm9kZShcbiAgICAgICAgICAgIHRoaXMuX3RWaWV3LCBjb250ZXh0LCB0aGlzLl9kZWNsYXJhdGlvblBhcmVudFZpZXcsIHRoaXMuX3JlbmRlcmVyLCB0aGlzLl9xdWVyaWVzLFxuICAgICAgICAgICAgdGhpcy5faW5qZWN0b3JJbmRleCk7XG4gICAgICAgIGlmIChjb250YWluZXIpIHtcbiAgICAgICAgICBpbnNlcnRWaWV3KGxWaWV3LCBjb250YWluZXIsIGhvc3RWaWV3ICEsIGluZGV4ICEsIGhvc3RUTm9kZSAhLmluZGV4KTtcbiAgICAgICAgfVxuICAgICAgICByZW5kZXJFbWJlZGRlZFRlbXBsYXRlKGxWaWV3LCB0aGlzLl90VmlldywgY29udGV4dCwgUmVuZGVyRmxhZ3MuQ3JlYXRlKTtcbiAgICAgICAgY29uc3Qgdmlld1JlZiA9IG5ldyBWaWV3UmVmKGxWaWV3LCBjb250ZXh0LCAtMSk7XG4gICAgICAgIHZpZXdSZWYuX3RWaWV3Tm9kZSA9IGxWaWV3W0hPU1RfTk9ERV0gYXMgVFZpZXdOb2RlO1xuICAgICAgICByZXR1cm4gdmlld1JlZjtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgaWYgKGhvc3RUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgY29uc3QgaG9zdENvbnRhaW5lcjogTENvbnRhaW5lciA9IGhvc3RWaWV3W2hvc3RUTm9kZS5pbmRleF07XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoaG9zdFROb2RlLnRWaWV3cywgJ1RWaWV3IG11c3QgYmUgYWxsb2NhdGVkJyk7XG4gICAgcmV0dXJuIG5ldyBSM1RlbXBsYXRlUmVmKFxuICAgICAgICBob3N0VmlldywgY3JlYXRlRWxlbWVudFJlZihFbGVtZW50UmVmVG9rZW4sIGhvc3RUTm9kZSwgaG9zdFZpZXcpLCBob3N0VE5vZGUudFZpZXdzIGFzIFRWaWV3LFxuICAgICAgICBnZXRSZW5kZXJlcigpLCBob3N0Q29udGFpbmVyW1FVRVJJRVNdLCBob3N0VE5vZGUuaW5qZWN0b3JJbmRleCk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxubGV0IFIzVmlld0NvbnRhaW5lclJlZjoge1xuICBuZXcgKFxuICAgICAgbENvbnRhaW5lcjogTENvbnRhaW5lciwgaG9zdFROb2RlOiBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSxcbiAgICAgIGhvc3RWaWV3OiBMVmlld0RhdGEpOiBWaWV3RW5naW5lX1ZpZXdDb250YWluZXJSZWZcbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIFZpZXdDb250YWluZXJSZWYgYW5kIHN0b3JlcyBpdCBvbiB0aGUgaW5qZWN0b3IuIE9yLCBpZiB0aGUgVmlld0NvbnRhaW5lclJlZlxuICogYWxyZWFkeSBleGlzdHMsIHJldHJpZXZlcyB0aGUgZXhpc3RpbmcgVmlld0NvbnRhaW5lclJlZi5cbiAqXG4gKiBAcmV0dXJucyBUaGUgVmlld0NvbnRhaW5lclJlZiBpbnN0YW5jZSB0byB1c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdFZpZXdDb250YWluZXJSZWYoXG4gICAgVmlld0NvbnRhaW5lclJlZlRva2VuOiB0eXBlb2YgVmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmLFxuICAgIEVsZW1lbnRSZWZUb2tlbjogdHlwZW9mIFZpZXdFbmdpbmVfRWxlbWVudFJlZik6IFZpZXdFbmdpbmVfVmlld0NvbnRhaW5lclJlZiB7XG4gIGNvbnN0IHByZXZpb3VzVE5vZGUgPVxuICAgICAgZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCkgYXMgVEVsZW1lbnROb2RlIHwgVEVsZW1lbnRDb250YWluZXJOb2RlIHwgVENvbnRhaW5lck5vZGU7XG4gIHJldHVybiBjcmVhdGVDb250YWluZXJSZWYoVmlld0NvbnRhaW5lclJlZlRva2VuLCBFbGVtZW50UmVmVG9rZW4sIHByZXZpb3VzVE5vZGUsIGdldFZpZXdEYXRhKCkpO1xufVxuXG5leHBvcnQgY2xhc3MgTm9kZUluamVjdG9yIGltcGxlbWVudHMgSW5qZWN0b3Ige1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgX3ROb2RlOiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlLFxuICAgICAgcHJpdmF0ZSBfaG9zdFZpZXc6IExWaWV3RGF0YSkge31cblxuICBnZXQodG9rZW46IGFueSwgbm90Rm91bmRWYWx1ZT86IGFueSk6IGFueSB7XG4gICAgcmV0dXJuIGdldE9yQ3JlYXRlSW5qZWN0YWJsZShcbiAgICAgICAgdGhpcy5fdE5vZGUsIHRoaXMuX2hvc3RWaWV3LCB0b2tlbiwgSW5qZWN0RmxhZ3MuRGVmYXVsdCwgbm90Rm91bmRWYWx1ZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgVmlld0NvbnRhaW5lclJlZiBhbmQgc3RvcmVzIGl0IG9uIHRoZSBpbmplY3Rvci5cbiAqXG4gKiBAcGFyYW0gVmlld0NvbnRhaW5lclJlZlRva2VuIFRoZSBWaWV3Q29udGFpbmVyUmVmIHR5cGVcbiAqIEBwYXJhbSBFbGVtZW50UmVmVG9rZW4gVGhlIEVsZW1lbnRSZWYgdHlwZVxuICogQHBhcmFtIGhvc3RUTm9kZSBUaGUgbm9kZSB0aGF0IGlzIHJlcXVlc3RpbmcgYSBWaWV3Q29udGFpbmVyUmVmXG4gKiBAcGFyYW0gaG9zdFZpZXcgVGhlIHZpZXcgdG8gd2hpY2ggdGhlIG5vZGUgYmVsb25nc1xuICogQHJldHVybnMgVGhlIFZpZXdDb250YWluZXJSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVDb250YWluZXJSZWYoXG4gICAgVmlld0NvbnRhaW5lclJlZlRva2VuOiB0eXBlb2YgVmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmLFxuICAgIEVsZW1lbnRSZWZUb2tlbjogdHlwZW9mIFZpZXdFbmdpbmVfRWxlbWVudFJlZixcbiAgICBob3N0VE5vZGU6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxURWxlbWVudENvbnRhaW5lck5vZGUsXG4gICAgaG9zdFZpZXc6IExWaWV3RGF0YSk6IFZpZXdFbmdpbmVfVmlld0NvbnRhaW5lclJlZiB7XG4gIGlmICghUjNWaWV3Q29udGFpbmVyUmVmKSB7XG4gICAgLy8gVE9ETzogRml4IGNsYXNzIG5hbWUsIHNob3VsZCBiZSBWaWV3Q29udGFpbmVyUmVmLCBidXQgdGhlcmUgYXBwZWFycyB0byBiZSBhIHJvbGx1cCBidWdcbiAgICBSM1ZpZXdDb250YWluZXJSZWYgPSBjbGFzcyBWaWV3Q29udGFpbmVyUmVmXyBleHRlbmRzIFZpZXdDb250YWluZXJSZWZUb2tlbiB7XG4gICAgICBwcml2YXRlIF92aWV3UmVmczogdmlld0VuZ2luZV9WaWV3UmVmW10gPSBbXTtcblxuICAgICAgY29uc3RydWN0b3IoXG4gICAgICAgICAgcHJpdmF0ZSBfbENvbnRhaW5lcjogTENvbnRhaW5lcixcbiAgICAgICAgICBwcml2YXRlIF9ob3N0VE5vZGU6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxURWxlbWVudENvbnRhaW5lck5vZGUsXG4gICAgICAgICAgcHJpdmF0ZSBfaG9zdFZpZXc6IExWaWV3RGF0YSkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgfVxuXG4gICAgICBnZXQgZWxlbWVudCgpOiBWaWV3RW5naW5lX0VsZW1lbnRSZWYge1xuICAgICAgICByZXR1cm4gY3JlYXRlRWxlbWVudFJlZihFbGVtZW50UmVmVG9rZW4sIHRoaXMuX2hvc3RUTm9kZSwgdGhpcy5faG9zdFZpZXcpO1xuICAgICAgfVxuXG4gICAgICBnZXQgaW5qZWN0b3IoKTogSW5qZWN0b3IgeyByZXR1cm4gbmV3IE5vZGVJbmplY3Rvcih0aGlzLl9ob3N0VE5vZGUsIHRoaXMuX2hvc3RWaWV3KTsgfVxuXG4gICAgICAvKiogQGRlcHJlY2F0ZWQgTm8gcmVwbGFjZW1lbnQgKi9cbiAgICAgIGdldCBwYXJlbnRJbmplY3RvcigpOiBJbmplY3RvciB7XG4gICAgICAgIGNvbnN0IHBhcmVudExvY2F0aW9uID0gZ2V0UGFyZW50SW5qZWN0b3JMb2NhdGlvbih0aGlzLl9ob3N0VE5vZGUsIHRoaXMuX2hvc3RWaWV3KTtcbiAgICAgICAgY29uc3QgcGFyZW50VmlldyA9IGdldFBhcmVudEluamVjdG9yVmlldyhwYXJlbnRMb2NhdGlvbiwgdGhpcy5faG9zdFZpZXcpO1xuICAgICAgICBjb25zdCBwYXJlbnRUTm9kZSA9IGdldFBhcmVudEluamVjdG9yVE5vZGUocGFyZW50TG9jYXRpb24sIHRoaXMuX2hvc3RWaWV3LCB0aGlzLl9ob3N0VE5vZGUpO1xuXG4gICAgICAgIHJldHVybiAhaGFzUGFyZW50SW5qZWN0b3IocGFyZW50TG9jYXRpb24pIHx8IHBhcmVudFROb2RlID09IG51bGwgP1xuICAgICAgICAgICAgbmV3IE51bGxJbmplY3RvcigpIDpcbiAgICAgICAgICAgIG5ldyBOb2RlSW5qZWN0b3IocGFyZW50VE5vZGUsIHBhcmVudFZpZXcpO1xuICAgICAgfVxuXG4gICAgICBjbGVhcigpOiB2b2lkIHtcbiAgICAgICAgd2hpbGUgKHRoaXMuX2xDb250YWluZXJbVklFV1NdLmxlbmd0aCkge1xuICAgICAgICAgIHRoaXMucmVtb3ZlKDApO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGdldChpbmRleDogbnVtYmVyKTogdmlld0VuZ2luZV9WaWV3UmVmfG51bGwgeyByZXR1cm4gdGhpcy5fdmlld1JlZnNbaW5kZXhdIHx8IG51bGw7IH1cblxuICAgICAgZ2V0IGxlbmd0aCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5fbENvbnRhaW5lcltWSUVXU10ubGVuZ3RoOyB9XG5cbiAgICAgIGNyZWF0ZUVtYmVkZGVkVmlldzxDPih0ZW1wbGF0ZVJlZjogVmlld0VuZ2luZV9UZW1wbGF0ZVJlZjxDPiwgY29udGV4dD86IEMsIGluZGV4PzogbnVtYmVyKTpcbiAgICAgICAgICB2aWV3RW5naW5lX0VtYmVkZGVkVmlld1JlZjxDPiB7XG4gICAgICAgIGNvbnN0IGFkanVzdGVkSWR4ID0gdGhpcy5fYWRqdXN0SW5kZXgoaW5kZXgpO1xuICAgICAgICBjb25zdCB2aWV3UmVmID0gKHRlbXBsYXRlUmVmIGFzIGFueSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuY3JlYXRlRW1iZWRkZWRWaWV3KFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0IHx8IDxhbnk+e30sIHRoaXMuX2xDb250YWluZXIsIHRoaXMuX2hvc3RUTm9kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5faG9zdFZpZXcsIGFkanVzdGVkSWR4KTtcbiAgICAgICAgKHZpZXdSZWYgYXMgVmlld1JlZjxhbnk+KS5hdHRhY2hUb1ZpZXdDb250YWluZXJSZWYodGhpcyk7XG4gICAgICAgIHRoaXMuX3ZpZXdSZWZzLnNwbGljZShhZGp1c3RlZElkeCwgMCwgdmlld1JlZik7XG4gICAgICAgIHJldHVybiB2aWV3UmVmO1xuICAgICAgfVxuXG4gICAgICBjcmVhdGVDb21wb25lbnQ8Qz4oXG4gICAgICAgICAgY29tcG9uZW50RmFjdG9yeTogdmlld0VuZ2luZV9Db21wb25lbnRGYWN0b3J5PEM+LCBpbmRleD86IG51bWJlcnx1bmRlZmluZWQsXG4gICAgICAgICAgaW5qZWN0b3I/OiBJbmplY3Rvcnx1bmRlZmluZWQsIHByb2plY3RhYmxlTm9kZXM/OiBhbnlbXVtdfHVuZGVmaW5lZCxcbiAgICAgICAgICBuZ01vZHVsZVJlZj86IHZpZXdFbmdpbmVfTmdNb2R1bGVSZWY8YW55Pnx1bmRlZmluZWQpOiB2aWV3RW5naW5lX0NvbXBvbmVudFJlZjxDPiB7XG4gICAgICAgIGNvbnN0IGNvbnRleHRJbmplY3RvciA9IGluamVjdG9yIHx8IHRoaXMucGFyZW50SW5qZWN0b3I7XG4gICAgICAgIGlmICghbmdNb2R1bGVSZWYgJiYgY29udGV4dEluamVjdG9yKSB7XG4gICAgICAgICAgbmdNb2R1bGVSZWYgPSBjb250ZXh0SW5qZWN0b3IuZ2V0KHZpZXdFbmdpbmVfTmdNb2R1bGVSZWYsIG51bGwpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY29tcG9uZW50UmVmID1cbiAgICAgICAgICAgIGNvbXBvbmVudEZhY3RvcnkuY3JlYXRlKGNvbnRleHRJbmplY3RvciwgcHJvamVjdGFibGVOb2RlcywgdW5kZWZpbmVkLCBuZ01vZHVsZVJlZik7XG4gICAgICAgIHRoaXMuaW5zZXJ0KGNvbXBvbmVudFJlZi5ob3N0VmlldywgaW5kZXgpO1xuICAgICAgICByZXR1cm4gY29tcG9uZW50UmVmO1xuICAgICAgfVxuXG4gICAgICBpbnNlcnQodmlld1JlZjogdmlld0VuZ2luZV9WaWV3UmVmLCBpbmRleD86IG51bWJlcik6IHZpZXdFbmdpbmVfVmlld1JlZiB7XG4gICAgICAgIGlmICh2aWV3UmVmLmRlc3Ryb3llZCkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGluc2VydCBhIGRlc3Ryb3llZCBWaWV3IGluIGEgVmlld0NvbnRhaW5lciEnKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBsVmlldyA9ICh2aWV3UmVmIGFzIFZpZXdSZWY8YW55PikuX3ZpZXcgITtcbiAgICAgICAgY29uc3QgYWRqdXN0ZWRJZHggPSB0aGlzLl9hZGp1c3RJbmRleChpbmRleCk7XG5cbiAgICAgICAgaW5zZXJ0VmlldyhsVmlldywgdGhpcy5fbENvbnRhaW5lciwgdGhpcy5faG9zdFZpZXcsIGFkanVzdGVkSWR4LCB0aGlzLl9ob3N0VE5vZGUuaW5kZXgpO1xuXG4gICAgICAgIGNvbnN0IGJlZm9yZU5vZGUgPVxuICAgICAgICAgICAgZ2V0QmVmb3JlTm9kZUZvclZpZXcoYWRqdXN0ZWRJZHgsIHRoaXMuX2xDb250YWluZXJbVklFV1NdLCB0aGlzLl9sQ29udGFpbmVyW05BVElWRV0pO1xuICAgICAgICBhZGRSZW1vdmVWaWV3RnJvbUNvbnRhaW5lcihsVmlldywgdHJ1ZSwgYmVmb3JlTm9kZSk7XG5cbiAgICAgICAgKHZpZXdSZWYgYXMgVmlld1JlZjxhbnk+KS5hdHRhY2hUb1ZpZXdDb250YWluZXJSZWYodGhpcyk7XG4gICAgICAgIHRoaXMuX3ZpZXdSZWZzLnNwbGljZShhZGp1c3RlZElkeCwgMCwgdmlld1JlZik7XG5cbiAgICAgICAgcmV0dXJuIHZpZXdSZWY7XG4gICAgICB9XG5cbiAgICAgIG1vdmUodmlld1JlZjogdmlld0VuZ2luZV9WaWV3UmVmLCBuZXdJbmRleDogbnVtYmVyKTogdmlld0VuZ2luZV9WaWV3UmVmIHtcbiAgICAgICAgaWYgKHZpZXdSZWYuZGVzdHJveWVkKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgbW92ZSBhIGRlc3Ryb3llZCBWaWV3IGluIGEgVmlld0NvbnRhaW5lciEnKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMuaW5kZXhPZih2aWV3UmVmKTtcbiAgICAgICAgdGhpcy5kZXRhY2goaW5kZXgpO1xuICAgICAgICB0aGlzLmluc2VydCh2aWV3UmVmLCB0aGlzLl9hZGp1c3RJbmRleChuZXdJbmRleCkpO1xuICAgICAgICByZXR1cm4gdmlld1JlZjtcbiAgICAgIH1cblxuICAgICAgaW5kZXhPZih2aWV3UmVmOiB2aWV3RW5naW5lX1ZpZXdSZWYpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5fdmlld1JlZnMuaW5kZXhPZih2aWV3UmVmKTsgfVxuXG4gICAgICByZW1vdmUoaW5kZXg/OiBudW1iZXIpOiB2b2lkIHtcbiAgICAgICAgY29uc3QgYWRqdXN0ZWRJZHggPSB0aGlzLl9hZGp1c3RJbmRleChpbmRleCwgLTEpO1xuICAgICAgICByZW1vdmVWaWV3KHRoaXMuX2xDb250YWluZXIsIHRoaXMuX2hvc3RUTm9kZSwgYWRqdXN0ZWRJZHgpO1xuICAgICAgICB0aGlzLl92aWV3UmVmcy5zcGxpY2UoYWRqdXN0ZWRJZHgsIDEpO1xuICAgICAgfVxuXG4gICAgICBkZXRhY2goaW5kZXg/OiBudW1iZXIpOiB2aWV3RW5naW5lX1ZpZXdSZWZ8bnVsbCB7XG4gICAgICAgIGNvbnN0IGFkanVzdGVkSWR4ID0gdGhpcy5fYWRqdXN0SW5kZXgoaW5kZXgsIC0xKTtcbiAgICAgICAgZGV0YWNoVmlldyh0aGlzLl9sQ29udGFpbmVyLCBhZGp1c3RlZElkeCwgISF0aGlzLl9ob3N0VE5vZGUuZGV0YWNoZWQpO1xuICAgICAgICByZXR1cm4gdGhpcy5fdmlld1JlZnMuc3BsaWNlKGFkanVzdGVkSWR4LCAxKVswXSB8fCBudWxsO1xuICAgICAgfVxuXG4gICAgICBwcml2YXRlIF9hZGp1c3RJbmRleChpbmRleD86IG51bWJlciwgc2hpZnQ6IG51bWJlciA9IDApIHtcbiAgICAgICAgaWYgKGluZGV4ID09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5fbENvbnRhaW5lcltWSUVXU10ubGVuZ3RoICsgc2hpZnQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgICAgIGFzc2VydEdyZWF0ZXJUaGFuKGluZGV4LCAtMSwgJ2luZGV4IG11c3QgYmUgcG9zaXRpdmUnKTtcbiAgICAgICAgICAvLyArMSBiZWNhdXNlIGl0J3MgbGVnYWwgdG8gaW5zZXJ0IGF0IHRoZSBlbmQuXG4gICAgICAgICAgYXNzZXJ0TGVzc1RoYW4oaW5kZXgsIHRoaXMuX2xDb250YWluZXJbVklFV1NdLmxlbmd0aCArIDEgKyBzaGlmdCwgJ2luZGV4Jyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGluZGV4O1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlcyhcbiAgICAgICAgICAgICAgICAgICBob3N0VE5vZGUsIFROb2RlVHlwZS5Db250YWluZXIsIFROb2RlVHlwZS5FbGVtZW50LCBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcik7XG5cbiAgbGV0IGxDb250YWluZXI6IExDb250YWluZXI7XG4gIGNvbnN0IHNsb3RWYWx1ZSA9IGhvc3RWaWV3W2hvc3RUTm9kZS5pbmRleF07XG4gIGlmIChpc0xDb250YWluZXIoc2xvdFZhbHVlKSkge1xuICAgIC8vIElmIHRoZSBob3N0IGlzIGEgY29udGFpbmVyLCB3ZSBkb24ndCBuZWVkIHRvIGNyZWF0ZSBhIG5ldyBMQ29udGFpbmVyXG4gICAgbENvbnRhaW5lciA9IHNsb3RWYWx1ZTtcbiAgICBsQ29udGFpbmVyW0FDVElWRV9JTkRFWF0gPSAtMTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBjb21tZW50Tm9kZSA9IGhvc3RWaWV3W1JFTkRFUkVSXS5jcmVhdGVDb21tZW50KG5nRGV2TW9kZSA/ICdjb250YWluZXInIDogJycpO1xuICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJDcmVhdGVDb21tZW50Kys7XG5cbiAgICAvLyBBIGNvbnRhaW5lciBjYW4gYmUgY3JlYXRlZCBvbiB0aGUgcm9vdCAodG9wbW9zdCAvIGJvb3RzdHJhcHBlZCkgY29tcG9uZW50IGFuZCBpbiB0aGlzIGNhc2Ugd2VcbiAgICAvLyBjYW4ndCB1c2UgTFRyZWUgdG8gaW5zZXJ0IGNvbnRhaW5lcidzIG1hcmtlciBub2RlIChib3RoIHBhcmVudCBvZiBhIGNvbW1lbnQgbm9kZSBhbmQgdGhlXG4gICAgLy8gY29tbWVuZCBub2RlIGl0c2VsZiBpcyBsb2NhdGVkIG91dHNpZGUgb2YgZWxlbWVudHMgaG9sZCBieSBMVHJlZSkuIEluIHRoaXMgc3BlY2lmaWMgY2FzZSB3ZVxuICAgIC8vIHVzZSBsb3ctbGV2ZWwgRE9NIG1hbmlwdWxhdGlvbiB0byBpbnNlcnQgY29udGFpbmVyJ3MgbWFya2VyIChjb21tZW50KSBub2RlLlxuICAgIGlmIChpc1Jvb3RWaWV3KGhvc3RWaWV3KSkge1xuICAgICAgY29uc3QgcmVuZGVyZXIgPSBob3N0Vmlld1tSRU5ERVJFUl07XG4gICAgICBjb25zdCBob3N0TmF0aXZlID0gZ2V0TmF0aXZlQnlUTm9kZShob3N0VE5vZGUsIGhvc3RWaWV3KSAhO1xuICAgICAgY29uc3QgcGFyZW50T2ZIb3N0TmF0aXZlID0gbmF0aXZlUGFyZW50Tm9kZShyZW5kZXJlciwgaG9zdE5hdGl2ZSk7XG4gICAgICBuYXRpdmVJbnNlcnRCZWZvcmUoXG4gICAgICAgICAgcmVuZGVyZXIsIHBhcmVudE9mSG9zdE5hdGl2ZSAhLCBjb21tZW50Tm9kZSwgbmF0aXZlTmV4dFNpYmxpbmcocmVuZGVyZXIsIGhvc3ROYXRpdmUpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYXBwZW5kQ2hpbGQoY29tbWVudE5vZGUsIGhvc3RUTm9kZSwgaG9zdFZpZXcpO1xuICAgIH1cblxuICAgIGhvc3RWaWV3W2hvc3RUTm9kZS5pbmRleF0gPSBsQ29udGFpbmVyID1cbiAgICAgICAgY3JlYXRlTENvbnRhaW5lcihzbG90VmFsdWUsIGhvc3RUTm9kZSwgaG9zdFZpZXcsIGNvbW1lbnROb2RlLCB0cnVlKTtcblxuICAgIGFkZFRvVmlld1RyZWUoaG9zdFZpZXcsIGhvc3RUTm9kZS5pbmRleCBhcyBudW1iZXIsIGxDb250YWluZXIpO1xuICB9XG5cbiAgcmV0dXJuIG5ldyBSM1ZpZXdDb250YWluZXJSZWYobENvbnRhaW5lciwgaG9zdFROb2RlLCBob3N0Vmlldyk7XG59XG5cblxuLyoqIFJldHVybnMgYSBDaGFuZ2VEZXRlY3RvclJlZiAoYS5rLmEuIGEgVmlld1JlZikgKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RDaGFuZ2VEZXRlY3RvclJlZigpOiBWaWV3RW5naW5lX0NoYW5nZURldGVjdG9yUmVmIHtcbiAgcmV0dXJuIGNyZWF0ZVZpZXdSZWYoZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCksIGdldFZpZXdEYXRhKCksIG51bGwpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBWaWV3UmVmIGFuZCBzdG9yZXMgaXQgb24gdGhlIGluamVjdG9yIGFzIENoYW5nZURldGVjdG9yUmVmIChwdWJsaWMgYWxpYXMpLlxuICpcbiAqIEBwYXJhbSBob3N0VE5vZGUgVGhlIG5vZGUgdGhhdCBpcyByZXF1ZXN0aW5nIGEgQ2hhbmdlRGV0ZWN0b3JSZWZcbiAqIEBwYXJhbSBob3N0VmlldyBUaGUgdmlldyB0byB3aGljaCB0aGUgbm9kZSBiZWxvbmdzXG4gKiBAcGFyYW0gY29udGV4dCBUaGUgY29udGV4dCBmb3IgdGhpcyBjaGFuZ2UgZGV0ZWN0b3IgcmVmXG4gKiBAcmV0dXJucyBUaGUgQ2hhbmdlRGV0ZWN0b3JSZWYgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVWaWV3UmVmKFxuICAgIGhvc3RUTm9kZTogVE5vZGUsIGhvc3RWaWV3OiBMVmlld0RhdGEsIGNvbnRleHQ6IGFueSk6IFZpZXdFbmdpbmVfQ2hhbmdlRGV0ZWN0b3JSZWYge1xuICBpZiAoaXNDb21wb25lbnQoaG9zdFROb2RlKSkge1xuICAgIGNvbnN0IGNvbXBvbmVudEluZGV4ID0gaG9zdFROb2RlLmZsYWdzID4+IFROb2RlRmxhZ3MuRGlyZWN0aXZlU3RhcnRpbmdJbmRleFNoaWZ0O1xuICAgIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBnZXRDb21wb25lbnRWaWV3QnlJbmRleChob3N0VE5vZGUuaW5kZXgsIGhvc3RWaWV3KTtcbiAgICByZXR1cm4gbmV3IFZpZXdSZWYoY29tcG9uZW50VmlldywgY29udGV4dCwgY29tcG9uZW50SW5kZXgpO1xuICB9IGVsc2UgaWYgKGhvc3RUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCkge1xuICAgIGNvbnN0IGhvc3RDb21wb25lbnRWaWV3ID0gZmluZENvbXBvbmVudFZpZXcoaG9zdFZpZXcpO1xuICAgIHJldHVybiBuZXcgVmlld1JlZihob3N0Q29tcG9uZW50VmlldywgaG9zdENvbXBvbmVudFZpZXdbQ09OVEVYVF0sIC0xKTtcbiAgfVxuICByZXR1cm4gbnVsbCAhO1xufVxuXG5mdW5jdGlvbiBnZXRPckNyZWF0ZVJlbmRlcmVyMih2aWV3OiBMVmlld0RhdGEpOiBSZW5kZXJlcjIge1xuICBjb25zdCByZW5kZXJlciA9IHZpZXdbUkVOREVSRVJdO1xuICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgcmV0dXJuIHJlbmRlcmVyIGFzIFJlbmRlcmVyMjtcbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBpbmplY3QgUmVuZGVyZXIyIHdoZW4gdGhlIGFwcGxpY2F0aW9uIHVzZXMgUmVuZGVyZXIzIScpO1xuICB9XG59XG5cbi8qKiBSZXR1cm5zIGEgUmVuZGVyZXIyIChvciB0aHJvd3Mgd2hlbiBhcHBsaWNhdGlvbiB3YXMgYm9vdHN0cmFwcGVkIHdpdGggUmVuZGVyZXIzKSAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdFJlbmRlcmVyMigpOiBSZW5kZXJlcjIge1xuICByZXR1cm4gZ2V0T3JDcmVhdGVSZW5kZXJlcjIoZ2V0Vmlld0RhdGEoKSk7XG59XG4iXX0=