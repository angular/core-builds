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
import { NodeInjector, getOrCreateNodeInjectorForNode } from './di';
import { _getViewData, addToViewTree, createEmbeddedViewAndNode, createLContainer, createLNodeObject, createTNode, getPreviousOrParentTNode, getRenderer, renderEmbeddedTemplate } from './instructions';
import { RENDER_PARENT, VIEWS } from './interfaces/container';
import { CONTEXT, HOST_NODE, QUERIES, RENDERER } from './interfaces/view';
import { assertNodeOfPossibleTypes, assertNodeType } from './node_assert';
import { addRemoveViewFromContainer, appendChild, detachView, findComponentView, getBeforeNodeForView, getParentLNode, getRenderParent, insertView, removeView } from './node_manipulation';
import { getLNode, isComponent } from './util';
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
            function TemplateRef_(_declarationParentView, elementRef, _tView, _renderer, _queries) {
                var _this = _super.call(this) || this;
                _this._declarationParentView = _declarationParentView;
                _this.elementRef = elementRef;
                _this._tView = _tView;
                _this._renderer = _renderer;
                _this._queries = _queries;
                return _this;
            }
            TemplateRef_.prototype.createEmbeddedView = function (context, container, tContainerNode, hostView, index) {
                var lView = createEmbeddedViewAndNode(this._tView, context, this._declarationParentView, this._renderer, this._queries);
                if (container) {
                    insertView(lView, container, hostView, index, tContainerNode.parent.index);
                }
                renderEmbeddedTemplate(lView, this._tView, context, 1 /* Create */);
                var viewRef = new ViewRef(lView, context, -1);
                viewRef._tViewNode = lView[HOST_NODE];
                return viewRef;
            };
            return TemplateRef_;
        }(TemplateRefToken));
    }
    var hostNode = getLNode(hostTNode, hostView);
    ngDevMode && assertNodeType(hostTNode, 0 /* Container */);
    ngDevMode && assertDefined(hostTNode.tViews, 'TView must be allocated');
    return new R3TemplateRef(hostView, createElementRef(ElementRefToken, hostTNode, hostView), hostTNode.tViews, getRenderer(), hostNode.data[QUERIES]);
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
            function ViewContainerRef_(_lContainer, _tContainerNode, _hostTNode, _hostView) {
                var _this = _super.call(this) || this;
                _this._lContainer = _lContainer;
                _this._tContainerNode = _tContainerNode;
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
                get: function () {
                    // TODO: Remove LNode lookup when removing LNode.nodeInjector
                    var injector = getOrCreateNodeInjectorForNode(this._getHostNode(), this._hostTNode, this._hostView);
                    return new NodeInjector(injector);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ViewContainerRef_.prototype, "parentInjector", {
                /** @deprecated No replacement */
                get: function () {
                    var parentLInjector = getParentLNode(this._hostTNode, this._hostView).nodeInjector;
                    return parentLInjector ? new NodeInjector(parentLInjector) : new NullInjector();
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
                    .createEmbeddedView(context || {}, this._lContainer, this._tContainerNode, this._hostView, adjustedIdx);
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
                insertView(lView, this._lContainer, this._hostView, adjustedIdx, this._tContainerNode.parent.index);
                var container = this._getHostNode().dynamicLContainerNode;
                var beforeNode = getBeforeNodeForView(adjustedIdx, this._lContainer[VIEWS], container);
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
                removeView(this._lContainer, this._tContainerNode, adjustedIdx);
                this._viewRefs.splice(adjustedIdx, 1);
            };
            ViewContainerRef_.prototype.detach = function (index) {
                var adjustedIdx = this._adjustIndex(index, -1);
                detachView(this._lContainer, adjustedIdx, !!this._tContainerNode.detached);
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
            ViewContainerRef_.prototype._getHostNode = function () { return getLNode(this._hostTNode, this._hostView); };
            return ViewContainerRef_;
        }(ViewContainerRefToken));
    }
    var hostLNode = getLNode(hostTNode, hostView);
    ngDevMode && assertNodeOfPossibleTypes(hostTNode, 0 /* Container */, 3 /* Element */, 4 /* ElementContainer */);
    var lContainer = createLContainer(hostView, true);
    var comment = hostView[RENDERER].createComment(ngDevMode ? 'container' : '');
    var lContainerNode = createLNodeObject(0 /* Container */, hostLNode.nodeInjector, comment, lContainer);
    lContainer[RENDER_PARENT] = getRenderParent(hostTNode, hostView);
    appendChild(comment, hostTNode, hostView);
    if (!hostTNode.dynamicContainerNode) {
        hostTNode.dynamicContainerNode =
            createTNode(0 /* Container */, -1, null, null, hostTNode, null);
    }
    hostLNode.dynamicLContainerNode = lContainerNode;
    addToViewTree(hostView, hostTNode.index, lContainer);
    return new R3ViewContainerRef(lContainer, hostTNode.dynamicContainerNode, hostTNode, hostView);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld19lbmdpbmVfY29tcGF0aWJpbGl0eS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvdmlld19lbmdpbmVfY29tcGF0aWJpbGl0eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBR0gsT0FBTyxFQUFXLFlBQVksRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBR3RELE9BQU8sRUFBQyxXQUFXLElBQUksc0JBQXNCLEVBQUMsTUFBTSw2QkFBNkIsQ0FBQztBQUtsRixPQUFPLEVBQUMsYUFBYSxFQUFFLGlCQUFpQixFQUFFLGNBQWMsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUMxRSxPQUFPLEVBQUMsWUFBWSxFQUFFLDhCQUE4QixFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQ2xFLE9BQU8sRUFBQyxZQUFZLEVBQUUsYUFBYSxFQUFFLHlCQUF5QixFQUFFLGdCQUFnQixFQUFFLGlCQUFpQixFQUFFLFdBQVcsRUFBRSx3QkFBd0IsRUFBRSxXQUFXLEVBQUUsc0JBQXNCLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUN2TSxPQUFPLEVBQWEsYUFBYSxFQUFFLEtBQUssRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBS3hFLE9BQU8sRUFBQyxPQUFPLEVBQUUsU0FBUyxFQUFhLE9BQU8sRUFBRSxRQUFRLEVBQVEsTUFBTSxtQkFBbUIsQ0FBQztBQUMxRixPQUFPLEVBQUMseUJBQXlCLEVBQUUsY0FBYyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ3hFLE9BQU8sRUFBQywwQkFBMEIsRUFBRSxXQUFXLEVBQUUsVUFBVSxFQUFFLGlCQUFpQixFQUFFLG9CQUFvQixFQUFFLGNBQWMsRUFBRSxlQUFlLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQzFMLE9BQU8sRUFBQyxRQUFRLEVBQUUsV0FBVyxFQUFDLE1BQU0s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LENBQUMsQ0FBQztBQUN6RixDQUFDO0FBR0QscURBQXFEO0FBQ3JELE1BQU0sVUFBVSx1QkFBdUI7SUFDckMsT0FBTyxhQUFhLENBQUMsd0JBQXdCLEVBQUUsRUFBRSxZQUFZLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUN6RSxDQUFDO0FBRUQ7Ozs7Ozs7R0FPRztBQUNILE1BQU0sVUFBVSxhQUFhLENBQ3pCLFNBQWdCLEVBQUUsUUFBbUIsRUFBRSxPQUFZO0lBQ3JELElBQUksV0FBVyxDQUFDLFNBQVMsQ0FBQyxFQUFFO1FBQzFCLElBQU0sY0FBYyxHQUFHLFNBQVMsQ0FBQyxLQUFLLHdDQUEwQyxDQUFDO1FBQ2pGLElBQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUMsSUFBaUIsQ0FBQztRQUN0RSxPQUFPLElBQUksT0FBTyxDQUFDLGFBQWEsRUFBRSxPQUFPLEVBQUUsY0FBYyxDQUFDLENBQUM7S0FDNUQ7U0FBTSxJQUFJLFNBQVMsQ0FBQyxJQUFJLG9CQUFzQixFQUFFO1FBQy9DLElBQU0saUJBQWlCLEdBQUcsaUJBQWlCLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDdEQsT0FBTyxJQUFJLE9BQU8sQ0FBQyxpQkFBaUIsRUFBRSxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ3ZFO0lBQ0QsT0FBTyxJQUFNLENBQUM7QUFDaEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtDaGFuZ2VEZXRlY3RvclJlZiBhcyBWaWV3RW5naW5lX0NoYW5nZURldGVjdG9yUmVmfSBmcm9tICcuLi9jaGFuZ2VfZGV0ZWN0aW9uL2NoYW5nZV9kZXRlY3Rvcl9yZWYnO1xuaW1wb3J0IHtJbmplY3RvciwgTnVsbEluamVjdG9yfSBmcm9tICcuLi9kaS9pbmplY3Rvcic7XG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnkgYXMgdmlld0VuZ2luZV9Db21wb25lbnRGYWN0b3J5LCBDb21wb25lbnRSZWYgYXMgdmlld0VuZ2luZV9Db21wb25lbnRSZWZ9IGZyb20gJy4uL2xpbmtlci9jb21wb25lbnRfZmFjdG9yeSc7XG5pbXBvcnQge0VsZW1lbnRSZWYgYXMgVmlld0VuZ2luZV9FbGVtZW50UmVmfSBmcm9tICcuLi9saW5rZXIvZWxlbWVudF9yZWYnO1xuaW1wb3J0IHtOZ01vZHVsZVJlZiBhcyB2aWV3RW5naW5lX05nTW9kdWxlUmVmfSBmcm9tICcuLi9saW5rZXIvbmdfbW9kdWxlX2ZhY3RvcnknO1xuaW1wb3J0IHtUZW1wbGF0ZVJlZiBhcyBWaWV3RW5naW5lX1RlbXBsYXRlUmVmfSBmcm9tICcuLi9saW5rZXIvdGVtcGxhdGVfcmVmJztcbmltcG9ydCB7Vmlld0NvbnRhaW5lclJlZiBhcyBWaWV3RW5naW5lX1ZpZXdDb250YWluZXJSZWZ9IGZyb20gJy4uL2xpbmtlci92aWV3X2NvbnRhaW5lcl9yZWYnO1xuaW1wb3J0IHtFbWJlZGRlZFZpZXdSZWYgYXMgdmlld0VuZ2luZV9FbWJlZGRlZFZpZXdSZWYsIFZpZXdSZWYgYXMgdmlld0VuZ2luZV9WaWV3UmVmfSBmcm9tICcuLi9saW5rZXIvdmlld19yZWYnO1xuXG5pbXBvcnQge2Fzc2VydERlZmluZWQsIGFzc2VydEdyZWF0ZXJUaGFuLCBhc3NlcnRMZXNzVGhhbn0gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHtOb2RlSW5qZWN0b3IsIGdldE9yQ3JlYXRlTm9kZUluamVjdG9yRm9yTm9kZX0gZnJvbSAnLi9kaSc7XG5pbXBvcnQge19nZXRWaWV3RGF0YSwgYWRkVG9WaWV3VHJlZSwgY3JlYXRlRW1iZWRkZWRWaWV3QW5kTm9kZSwgY3JlYXRlTENvbnRhaW5lciwgY3JlYXRlTE5vZGVPYmplY3QsIGNyZWF0ZVROb2RlLCBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUsIGdldFJlbmRlcmVyLCByZW5kZXJFbWJlZGRlZFRlbXBsYXRlfSBmcm9tICcuL2luc3RydWN0aW9ucyc7XG5pbXBvcnQge0xDb250YWluZXIsIFJFTkRFUl9QQVJFTlQsIFZJRVdTfSBmcm9tICcuL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7UmVuZGVyRmxhZ3N9IGZyb20gJy4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7TENvbnRhaW5lck5vZGUsIFRDb250YWluZXJOb2RlLCBURWxlbWVudENvbnRhaW5lck5vZGUsIFRFbGVtZW50Tm9kZSwgVE5vZGUsIFROb2RlRmxhZ3MsIFROb2RlVHlwZSwgVFZpZXdOb2RlfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge0xRdWVyaWVzfSBmcm9tICcuL2ludGVyZmFjZXMvcXVlcnknO1xuaW1wb3J0IHtSQ29tbWVudCwgUkVsZW1lbnQsIFJlbmRlcmVyM30gZnJvbSAnLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7Q09OVEVYVCwgSE9TVF9OT0RFLCBMVmlld0RhdGEsIFFVRVJJRVMsIFJFTkRFUkVSLCBUVmlld30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHthc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzLCBhc3NlcnROb2RlVHlwZX0gZnJvbSAnLi9ub2RlX2Fzc2VydCc7XG5pbXBvcnQge2FkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyLCBhcHBlbmRDaGlsZCwgZGV0YWNoVmlldywgZmluZENvbXBvbmVudFZpZXcsIGdldEJlZm9yZU5vZGVGb3JWaWV3LCBnZXRQYXJlbnRMTm9kZSwgZ2V0UmVuZGVyUGFyZW50LCBpbnNlcnRWaWV3LCByZW1vdmVWaWV3fSBmcm9tICcuL25vZGVfbWFuaXB1bGF0aW9uJztcbmltcG9ydCB7Z2V0TE5vZGUsIGlzQ29tcG9uZW50fSBmcm9tICcuL3V0aWwnO1xuaW1wb3J0IHtWaWV3UmVmfSBmcm9tICcuL3ZpZXdfcmVmJztcblxuXG5cbi8qKlxuICogQ3JlYXRlcyBhbiBFbGVtZW50UmVmIGZyb20gdGhlIG1vc3QgcmVjZW50IG5vZGUuXG4gKlxuICogQHJldHVybnMgVGhlIEVsZW1lbnRSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RFbGVtZW50UmVmKEVsZW1lbnRSZWZUb2tlbjogdHlwZW9mIFZpZXdFbmdpbmVfRWxlbWVudFJlZik6XG4gICAgVmlld0VuZ2luZV9FbGVtZW50UmVmIHtcbiAgcmV0dXJuIGNyZWF0ZUVsZW1lbnRSZWYoRWxlbWVudFJlZlRva2VuLCBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKSwgX2dldFZpZXdEYXRhKCkpO1xufVxuXG5sZXQgUjNFbGVtZW50UmVmOiB7bmV3IChuYXRpdmU6IFJFbGVtZW50IHwgUkNvbW1lbnQpOiBWaWV3RW5naW5lX0VsZW1lbnRSZWZ9O1xuXG4vKipcbiAqIENyZWF0ZXMgYW4gRWxlbWVudFJlZiBnaXZlbiBhIG5vZGUuXG4gKlxuICogQHBhcmFtIEVsZW1lbnRSZWZUb2tlbiBUaGUgRWxlbWVudFJlZiB0eXBlXG4gKiBAcGFyYW0gdE5vZGUgVGhlIG5vZGUgZm9yIHdoaWNoIHlvdSdkIGxpa2UgYW4gRWxlbWVudFJlZlxuICogQHBhcmFtIHZpZXcgVGhlIHZpZXcgdG8gd2hpY2ggdGhlIG5vZGUgYmVsb25nc1xuICogQHJldHVybnMgVGhlIEVsZW1lbnRSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFbGVtZW50UmVmKFxuICAgIEVsZW1lbnRSZWZUb2tlbjogdHlwZW9mIFZpZXdFbmdpbmVfRWxlbWVudFJlZiwgdE5vZGU6IFROb2RlLFxuICAgIHZpZXc6IExWaWV3RGF0YSk6IFZpZXdFbmdpbmVfRWxlbWVudFJlZiB7XG4gIGlmICghUjNFbGVtZW50UmVmKSB7XG4gICAgLy8gVE9ETzogRml4IGNsYXNzIG5hbWUsIHNob3VsZCBiZSBFbGVtZW50UmVmLCBidXQgdGhlcmUgYXBwZWFycyB0byBiZSBhIHJvbGx1cCBidWdcbiAgICBSM0VsZW1lbnRSZWYgPSBjbGFzcyBFbGVtZW50UmVmXyBleHRlbmRzIEVsZW1lbnRSZWZUb2tlbiB7fTtcbiAgfVxuICByZXR1cm4gbmV3IFIzRWxlbWVudFJlZihnZXRMTm9kZSh0Tm9kZSwgdmlldykubmF0aXZlKTtcbn1cblxubGV0IFIzVGVtcGxhdGVSZWY6IHtcbiAgbmV3IChcbiAgICAgIF9kZWNsYXJhdGlvblBhcmVudFZpZXc6IExWaWV3RGF0YSwgZWxlbWVudFJlZjogVmlld0VuZ2luZV9FbGVtZW50UmVmLCBfdFZpZXc6IFRWaWV3LFxuICAgICAgX3JlbmRlcmVyOiBSZW5kZXJlcjMsIF9xdWVyaWVzOiBMUXVlcmllcyB8IG51bGwpOiBWaWV3RW5naW5lX1RlbXBsYXRlUmVmPGFueT5cbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIFRlbXBsYXRlUmVmIGdpdmVuIGEgbm9kZS5cbiAqXG4gKiBAcmV0dXJucyBUaGUgVGVtcGxhdGVSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RUZW1wbGF0ZVJlZjxUPihcbiAgICBUZW1wbGF0ZVJlZlRva2VuOiB0eXBlb2YgVmlld0VuZ2luZV9UZW1wbGF0ZVJlZixcbiAgICBFbGVtZW50UmVmVG9rZW46IHR5cGVvZiBWaWV3RW5naW5lX0VsZW1lbnRSZWYpOiBWaWV3RW5naW5lX1RlbXBsYXRlUmVmPFQ+IHtcbiAgcmV0dXJuIGNyZWF0ZVRlbXBsYXRlUmVmPFQ+KFxuICAgICAgVGVtcGxhdGVSZWZUb2tlbiwgRWxlbWVudFJlZlRva2VuLCBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKSwgX2dldFZpZXdEYXRhKCkpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBUZW1wbGF0ZVJlZiBhbmQgc3RvcmVzIGl0IG9uIHRoZSBpbmplY3Rvci5cbiAqXG4gKiBAcGFyYW0gVGVtcGxhdGVSZWZUb2tlbiBUaGUgVGVtcGxhdGVSZWYgdHlwZVxuICogQHBhcmFtIEVsZW1lbnRSZWZUb2tlbiBUaGUgRWxlbWVudFJlZiB0eXBlXG4gKiBAcGFyYW0gaG9zdFROb2RlIFRoZSBub2RlIHRoYXQgaXMgcmVxdWVzdGluZyBhIFRlbXBsYXRlUmVmXG4gKiBAcGFyYW0gaG9zdFZpZXcgVGhlIHZpZXcgdG8gd2hpY2ggdGhlIG5vZGUgYmVsb25nc1xuICogQHJldHVybnMgVGhlIFRlbXBsYXRlUmVmIGluc3RhbmNlIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVGVtcGxhdGVSZWY8VD4oXG4gICAgVGVtcGxhdGVSZWZUb2tlbjogdHlwZW9mIFZpZXdFbmdpbmVfVGVtcGxhdGVSZWYsIEVsZW1lbnRSZWZUb2tlbjogdHlwZW9mIFZpZXdFbmdpbmVfRWxlbWVudFJlZixcbiAgICBob3N0VE5vZGU6IFROb2RlLCBob3N0VmlldzogTFZpZXdEYXRhKTogVmlld0VuZ2luZV9UZW1wbGF0ZVJlZjxUPiB7XG4gIGlmICghUjNUZW1wbGF0ZVJlZikge1xuICAgIC8vIFRPRE86IEZpeCBjbGFzcyBuYW1lLCBzaG91bGQgYmUgVGVtcGxhdGVSZWYsIGJ1dCB0aGVyZSBhcHBlYXJzIHRvIGJlIGEgcm9sbHVwIGJ1Z1xuICAgIFIzVGVtcGxhdGVSZWYgPSBjbGFzcyBUZW1wbGF0ZVJlZl88VD4gZXh0ZW5kcyBUZW1wbGF0ZVJlZlRva2VuPFQ+IHtcbiAgICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICAgIHByaXZhdGUgX2RlY2xhcmF0aW9uUGFyZW50VmlldzogTFZpZXdEYXRhLCByZWFkb25seSBlbGVtZW50UmVmOiBWaWV3RW5naW5lX0VsZW1lbnRSZWYsXG4gICAgICAgICAgcHJpdmF0ZSBfdFZpZXc6IFRWaWV3LCBwcml2YXRlIF9yZW5kZXJlcjogUmVuZGVyZXIzLCBwcml2YXRlIF9xdWVyaWVzOiBMUXVlcmllc3xudWxsKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICB9XG5cbiAgICAgIGNyZWF0ZUVtYmVkZGVkVmlldyhcbiAgICAgICAgICBjb250ZXh0OiBULCBjb250YWluZXI/OiBMQ29udGFpbmVyLCB0Q29udGFpbmVyTm9kZT86IFRDb250YWluZXJOb2RlLCBob3N0Vmlldz86IExWaWV3RGF0YSxcbiAgICAgICAgICBpbmRleD86IG51bWJlcik6IHZpZXdFbmdpbmVfRW1iZWRkZWRWaWV3UmVmPFQ+IHtcbiAgICAgICAgY29uc3QgbFZpZXcgPSBjcmVhdGVFbWJlZGRlZFZpZXdBbmROb2RlKFxuICAgICAgICAgICAgdGhpcy5fdFZpZXcsIGNvbnRleHQsIHRoaXMuX2RlY2xhcmF0aW9uUGFyZW50VmlldywgdGhpcy5fcmVuZGVyZXIsIHRoaXMuX3F1ZXJpZXMpO1xuICAgICAgICBpZiAoY29udGFpbmVyKSB7XG4gICAgICAgICAgaW5zZXJ0VmlldyhsVmlldywgY29udGFpbmVyLCBob3N0VmlldyAhLCBpbmRleCAhLCB0Q29udGFpbmVyTm9kZSAhLnBhcmVudCAhLmluZGV4KTtcbiAgICAgICAgfVxuICAgICAgICByZW5kZXJFbWJlZGRlZFRlbXBsYXRlKGxWaWV3LCB0aGlzLl90VmlldywgY29udGV4dCwgUmVuZGVyRmxhZ3MuQ3JlYXRlKTtcbiAgICAgICAgY29uc3Qgdmlld1JlZiA9IG5ldyBWaWV3UmVmKGxWaWV3LCBjb250ZXh0LCAtMSk7XG4gICAgICAgIHZpZXdSZWYuX3RWaWV3Tm9kZSA9IGxWaWV3W0hPU1RfTk9ERV0gYXMgVFZpZXdOb2RlO1xuICAgICAgICByZXR1cm4gdmlld1JlZjtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cblxuICBjb25zdCBob3N0Tm9kZSA9IGdldExOb2RlKGhvc3RUTm9kZSwgaG9zdFZpZXcpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUoaG9zdFROb2RlLCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoaG9zdFROb2RlLnRWaWV3cywgJ1RWaWV3IG11c3QgYmUgYWxsb2NhdGVkJyk7XG4gIHJldHVybiBuZXcgUjNUZW1wbGF0ZVJlZihcbiAgICAgIGhvc3RWaWV3LCBjcmVhdGVFbGVtZW50UmVmKEVsZW1lbnRSZWZUb2tlbiwgaG9zdFROb2RlLCBob3N0VmlldyksIGhvc3RUTm9kZS50Vmlld3MgYXMgVFZpZXcsXG4gICAgICBnZXRSZW5kZXJlcigpLCBob3N0Tm9kZS5kYXRhICFbUVVFUklFU10pO1xufVxuXG5sZXQgUjNWaWV3Q29udGFpbmVyUmVmOiB7XG4gIG5ldyAoXG4gICAgICBsQ29udGFpbmVyOiBMQ29udGFpbmVyLCB0Q29udGFpbmVyTm9kZTogVENvbnRhaW5lck5vZGUsXG4gICAgICBob3N0VE5vZGU6IFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIHwgVEVsZW1lbnRDb250YWluZXJOb2RlLCBob3N0VmlldzogTFZpZXdEYXRhKTpcbiAgICAgIFZpZXdFbmdpbmVfVmlld0NvbnRhaW5lclJlZlxufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgVmlld0NvbnRhaW5lclJlZiBhbmQgc3RvcmVzIGl0IG9uIHRoZSBpbmplY3Rvci4gT3IsIGlmIHRoZSBWaWV3Q29udGFpbmVyUmVmXG4gKiBhbHJlYWR5IGV4aXN0cywgcmV0cmlldmVzIHRoZSBleGlzdGluZyBWaWV3Q29udGFpbmVyUmVmLlxuICpcbiAqIEByZXR1cm5zIFRoZSBWaWV3Q29udGFpbmVyUmVmIGluc3RhbmNlIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0Vmlld0NvbnRhaW5lclJlZihcbiAgICBWaWV3Q29udGFpbmVyUmVmVG9rZW46IHR5cGVvZiBWaWV3RW5naW5lX1ZpZXdDb250YWluZXJSZWYsXG4gICAgRWxlbWVudFJlZlRva2VuOiB0eXBlb2YgVmlld0VuZ2luZV9FbGVtZW50UmVmKTogVmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmIHtcbiAgY29uc3QgcHJldmlvdXNUTm9kZSA9XG4gICAgICBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKSBhcyBURWxlbWVudE5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGUgfCBUQ29udGFpbmVyTm9kZTtcbiAgcmV0dXJuIGNyZWF0ZUNvbnRhaW5lclJlZihWaWV3Q29udGFpbmVyUmVmVG9rZW4sIEVsZW1lbnRSZWZUb2tlbiwgcHJldmlvdXNUTm9kZSwgX2dldFZpZXdEYXRhKCkpO1xufVxuXG5cbi8qKlxuICogQ3JlYXRlcyBhIFZpZXdDb250YWluZXJSZWYgYW5kIHN0b3JlcyBpdCBvbiB0aGUgaW5qZWN0b3IuXG4gKlxuICogQHBhcmFtIFZpZXdDb250YWluZXJSZWZUb2tlbiBUaGUgVmlld0NvbnRhaW5lclJlZiB0eXBlXG4gKiBAcGFyYW0gRWxlbWVudFJlZlRva2VuIFRoZSBFbGVtZW50UmVmIHR5cGVcbiAqIEBwYXJhbSBob3N0VE5vZGUgVGhlIG5vZGUgdGhhdCBpcyByZXF1ZXN0aW5nIGEgVmlld0NvbnRhaW5lclJlZlxuICogQHBhcmFtIGhvc3RWaWV3IFRoZSB2aWV3IHRvIHdoaWNoIHRoZSBub2RlIGJlbG9uZ3NcbiAqIEByZXR1cm5zIFRoZSBWaWV3Q29udGFpbmVyUmVmIGluc3RhbmNlIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQ29udGFpbmVyUmVmKFxuICAgIFZpZXdDb250YWluZXJSZWZUb2tlbjogdHlwZW9mIFZpZXdFbmdpbmVfVmlld0NvbnRhaW5lclJlZixcbiAgICBFbGVtZW50UmVmVG9rZW46IHR5cGVvZiBWaWV3RW5naW5lX0VsZW1lbnRSZWYsXG4gICAgaG9zdFROb2RlOiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlLFxuICAgIGhvc3RWaWV3OiBMVmlld0RhdGEpOiBWaWV3RW5naW5lX1ZpZXdDb250YWluZXJSZWYge1xuICBpZiAoIVIzVmlld0NvbnRhaW5lclJlZikge1xuICAgIC8vIFRPRE86IEZpeCBjbGFzcyBuYW1lLCBzaG91bGQgYmUgVmlld0NvbnRhaW5lclJlZiwgYnV0IHRoZXJlIGFwcGVhcnMgdG8gYmUgYSByb2xsdXAgYnVnXG4gICAgUjNWaWV3Q29udGFpbmVyUmVmID0gY2xhc3MgVmlld0NvbnRhaW5lclJlZl8gZXh0ZW5kcyBWaWV3Q29udGFpbmVyUmVmVG9rZW4ge1xuICAgICAgcHJpdmF0ZSBfdmlld1JlZnM6IHZpZXdFbmdpbmVfVmlld1JlZltdID0gW107XG5cbiAgICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICAgIHByaXZhdGUgX2xDb250YWluZXI6IExDb250YWluZXIsIHByaXZhdGUgX3RDb250YWluZXJOb2RlOiBUQ29udGFpbmVyTm9kZSxcbiAgICAgICAgICBwcml2YXRlIF9ob3N0VE5vZGU6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxURWxlbWVudENvbnRhaW5lck5vZGUsXG4gICAgICAgICAgcHJpdmF0ZSBfaG9zdFZpZXc6IExWaWV3RGF0YSkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgfVxuXG4gICAgICBnZXQgZWxlbWVudCgpOiBWaWV3RW5naW5lX0VsZW1lbnRSZWYge1xuICAgICAgICByZXR1cm4gY3JlYXRlRWxlbWVudFJlZihFbGVtZW50UmVmVG9rZW4sIHRoaXMuX2hvc3RUTm9kZSwgdGhpcy5faG9zdFZpZXcpO1xuICAgICAgfVxuXG4gICAgICBnZXQgaW5qZWN0b3IoKTogSW5qZWN0b3Ige1xuICAgICAgICAvLyBUT0RPOiBSZW1vdmUgTE5vZGUgbG9va3VwIHdoZW4gcmVtb3ZpbmcgTE5vZGUubm9kZUluamVjdG9yXG4gICAgICAgIGNvbnN0IGluamVjdG9yID1cbiAgICAgICAgICAgIGdldE9yQ3JlYXRlTm9kZUluamVjdG9yRm9yTm9kZSh0aGlzLl9nZXRIb3N0Tm9kZSgpLCB0aGlzLl9ob3N0VE5vZGUsIHRoaXMuX2hvc3RWaWV3KTtcbiAgICAgICAgcmV0dXJuIG5ldyBOb2RlSW5qZWN0b3IoaW5qZWN0b3IpO1xuICAgICAgfVxuXG4gICAgICAvKiogQGRlcHJlY2F0ZWQgTm8gcmVwbGFjZW1lbnQgKi9cbiAgICAgIGdldCBwYXJlbnRJbmplY3RvcigpOiBJbmplY3RvciB7XG4gICAgICAgIGNvbnN0IHBhcmVudExJbmplY3RvciA9IGdldFBhcmVudExOb2RlKHRoaXMuX2hvc3RUTm9kZSwgdGhpcy5faG9zdFZpZXcpICEubm9kZUluamVjdG9yO1xuICAgICAgICByZXR1cm4gcGFyZW50TEluamVjdG9yID8gbmV3IE5vZGVJbmplY3RvcihwYXJlbnRMSW5qZWN0b3IpIDogbmV3IE51bGxJbmplY3RvcigpO1xuICAgICAgfVxuXG4gICAgICBjbGVhcigpOiB2b2lkIHtcbiAgICAgICAgd2hpbGUgKHRoaXMuX2xDb250YWluZXJbVklFV1NdLmxlbmd0aCkge1xuICAgICAgICAgIHRoaXMucmVtb3ZlKDApO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGdldChpbmRleDogbnVtYmVyKTogdmlld0VuZ2luZV9WaWV3UmVmfG51bGwgeyByZXR1cm4gdGhpcy5fdmlld1JlZnNbaW5kZXhdIHx8IG51bGw7IH1cblxuICAgICAgZ2V0IGxlbmd0aCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5fbENvbnRhaW5lcltWSUVXU10ubGVuZ3RoOyB9XG5cbiAgICAgIGNyZWF0ZUVtYmVkZGVkVmlldzxDPih0ZW1wbGF0ZVJlZjogVmlld0VuZ2luZV9UZW1wbGF0ZVJlZjxDPiwgY29udGV4dD86IEMsIGluZGV4PzogbnVtYmVyKTpcbiAgICAgICAgICB2aWV3RW5naW5lX0VtYmVkZGVkVmlld1JlZjxDPiB7XG4gICAgICAgIGNvbnN0IGFkanVzdGVkSWR4ID0gdGhpcy5fYWRqdXN0SW5kZXgoaW5kZXgpO1xuICAgICAgICBjb25zdCB2aWV3UmVmID0gKHRlbXBsYXRlUmVmIGFzIGFueSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuY3JlYXRlRW1iZWRkZWRWaWV3KFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0IHx8IDxhbnk+e30sIHRoaXMuX2xDb250YWluZXIsIHRoaXMuX3RDb250YWluZXJOb2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9ob3N0VmlldywgYWRqdXN0ZWRJZHgpO1xuICAgICAgICAodmlld1JlZiBhcyBWaWV3UmVmPGFueT4pLmF0dGFjaFRvVmlld0NvbnRhaW5lclJlZih0aGlzKTtcbiAgICAgICAgdGhpcy5fdmlld1JlZnMuc3BsaWNlKGFkanVzdGVkSWR4LCAwLCB2aWV3UmVmKTtcbiAgICAgICAgcmV0dXJuIHZpZXdSZWY7XG4gICAgICB9XG5cbiAgICAgIGNyZWF0ZUNvbXBvbmVudDxDPihcbiAgICAgICAgICBjb21wb25lbnRGYWN0b3J5OiB2aWV3RW5naW5lX0NvbXBvbmVudEZhY3Rvcnk8Qz4sIGluZGV4PzogbnVtYmVyfHVuZGVmaW5lZCxcbiAgICAgICAgICBpbmplY3Rvcj86IEluamVjdG9yfHVuZGVmaW5lZCwgcHJvamVjdGFibGVOb2Rlcz86IGFueVtdW118dW5kZWZpbmVkLFxuICAgICAgICAgIG5nTW9kdWxlUmVmPzogdmlld0VuZ2luZV9OZ01vZHVsZVJlZjxhbnk+fHVuZGVmaW5lZCk6IHZpZXdFbmdpbmVfQ29tcG9uZW50UmVmPEM+IHtcbiAgICAgICAgY29uc3QgY29udGV4dEluamVjdG9yID0gaW5qZWN0b3IgfHwgdGhpcy5wYXJlbnRJbmplY3RvcjtcbiAgICAgICAgaWYgKCFuZ01vZHVsZVJlZiAmJiBjb250ZXh0SW5qZWN0b3IpIHtcbiAgICAgICAgICBuZ01vZHVsZVJlZiA9IGNvbnRleHRJbmplY3Rvci5nZXQodmlld0VuZ2luZV9OZ01vZHVsZVJlZiwgbnVsbCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjb21wb25lbnRSZWYgPVxuICAgICAgICAgICAgY29tcG9uZW50RmFjdG9yeS5jcmVhdGUoY29udGV4dEluamVjdG9yLCBwcm9qZWN0YWJsZU5vZGVzLCB1bmRlZmluZWQsIG5nTW9kdWxlUmVmKTtcbiAgICAgICAgdGhpcy5pbnNlcnQoY29tcG9uZW50UmVmLmhvc3RWaWV3LCBpbmRleCk7XG4gICAgICAgIHJldHVybiBjb21wb25lbnRSZWY7XG4gICAgICB9XG5cbiAgICAgIGluc2VydCh2aWV3UmVmOiB2aWV3RW5naW5lX1ZpZXdSZWYsIGluZGV4PzogbnVtYmVyKTogdmlld0VuZ2luZV9WaWV3UmVmIHtcbiAgICAgICAgaWYgKHZpZXdSZWYuZGVzdHJveWVkKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgaW5zZXJ0IGEgZGVzdHJveWVkIFZpZXcgaW4gYSBWaWV3Q29udGFpbmVyIScpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGxWaWV3ID0gKHZpZXdSZWYgYXMgVmlld1JlZjxhbnk+KS5fdmlldyAhO1xuICAgICAgICBjb25zdCBhZGp1c3RlZElkeCA9IHRoaXMuX2FkanVzdEluZGV4KGluZGV4KTtcblxuICAgICAgICBpbnNlcnRWaWV3KFxuICAgICAgICAgICAgbFZpZXcsIHRoaXMuX2xDb250YWluZXIsIHRoaXMuX2hvc3RWaWV3LCBhZGp1c3RlZElkeCxcbiAgICAgICAgICAgIHRoaXMuX3RDb250YWluZXJOb2RlLnBhcmVudCAhLmluZGV4KTtcblxuICAgICAgICBjb25zdCBjb250YWluZXIgPSB0aGlzLl9nZXRIb3N0Tm9kZSgpLmR5bmFtaWNMQ29udGFpbmVyTm9kZSAhO1xuICAgICAgICBjb25zdCBiZWZvcmVOb2RlID0gZ2V0QmVmb3JlTm9kZUZvclZpZXcoYWRqdXN0ZWRJZHgsIHRoaXMuX2xDb250YWluZXJbVklFV1NdLCBjb250YWluZXIpO1xuICAgICAgICBhZGRSZW1vdmVWaWV3RnJvbUNvbnRhaW5lcihsVmlldywgdHJ1ZSwgYmVmb3JlTm9kZSk7XG5cbiAgICAgICAgKHZpZXdSZWYgYXMgVmlld1JlZjxhbnk+KS5hdHRhY2hUb1ZpZXdDb250YWluZXJSZWYodGhpcyk7XG4gICAgICAgIHRoaXMuX3ZpZXdSZWZzLnNwbGljZShhZGp1c3RlZElkeCwgMCwgdmlld1JlZik7XG5cbiAgICAgICAgcmV0dXJuIHZpZXdSZWY7XG4gICAgICB9XG5cbiAgICAgIG1vdmUodmlld1JlZjogdmlld0VuZ2luZV9WaWV3UmVmLCBuZXdJbmRleDogbnVtYmVyKTogdmlld0VuZ2luZV9WaWV3UmVmIHtcbiAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLmluZGV4T2Yodmlld1JlZik7XG4gICAgICAgIHRoaXMuZGV0YWNoKGluZGV4KTtcbiAgICAgICAgdGhpcy5pbnNlcnQodmlld1JlZiwgdGhpcy5fYWRqdXN0SW5kZXgobmV3SW5kZXgpKTtcbiAgICAgICAgcmV0dXJuIHZpZXdSZWY7XG4gICAgICB9XG5cbiAgICAgIGluZGV4T2Yodmlld1JlZjogdmlld0VuZ2luZV9WaWV3UmVmKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuX3ZpZXdSZWZzLmluZGV4T2Yodmlld1JlZik7IH1cblxuICAgICAgcmVtb3ZlKGluZGV4PzogbnVtYmVyKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IGFkanVzdGVkSWR4ID0gdGhpcy5fYWRqdXN0SW5kZXgoaW5kZXgsIC0xKTtcbiAgICAgICAgcmVtb3ZlVmlldyh0aGlzLl9sQ29udGFpbmVyLCB0aGlzLl90Q29udGFpbmVyTm9kZSBhcyBUQ29udGFpbmVyTm9kZSwgYWRqdXN0ZWRJZHgpO1xuICAgICAgICB0aGlzLl92aWV3UmVmcy5zcGxpY2UoYWRqdXN0ZWRJZHgsIDEpO1xuICAgICAgfVxuXG4gICAgICBkZXRhY2goaW5kZXg/OiBudW1iZXIpOiB2aWV3RW5naW5lX1ZpZXdSZWZ8bnVsbCB7XG4gICAgICAgIGNvbnN0IGFkanVzdGVkSWR4ID0gdGhpcy5fYWRqdXN0SW5kZXgoaW5kZXgsIC0xKTtcbiAgICAgICAgZGV0YWNoVmlldyh0aGlzLl9sQ29udGFpbmVyLCBhZGp1c3RlZElkeCwgISF0aGlzLl90Q29udGFpbmVyTm9kZS5kZXRhY2hlZCk7XG4gICAgICAgIHJldHVybiB0aGlzLl92aWV3UmVmcy5zcGxpY2UoYWRqdXN0ZWRJZHgsIDEpWzBdIHx8IG51bGw7XG4gICAgICB9XG5cbiAgICAgIHByaXZhdGUgX2FkanVzdEluZGV4KGluZGV4PzogbnVtYmVyLCBzaGlmdDogbnVtYmVyID0gMCkge1xuICAgICAgICBpZiAoaW5kZXggPT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiB0aGlzLl9sQ29udGFpbmVyW1ZJRVdTXS5sZW5ndGggKyBzaGlmdDtcbiAgICAgICAgfVxuICAgICAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICAgICAgYXNzZXJ0R3JlYXRlclRoYW4oaW5kZXgsIC0xLCAnaW5kZXggbXVzdCBiZSBwb3NpdGl2ZScpO1xuICAgICAgICAgIC8vICsxIGJlY2F1c2UgaXQncyBsZWdhbCB0byBpbnNlcnQgYXQgdGhlIGVuZC5cbiAgICAgICAgICBhc3NlcnRMZXNzVGhhbihpbmRleCwgdGhpcy5fbENvbnRhaW5lcltWSUVXU10ubGVuZ3RoICsgMSArIHNoaWZ0LCAnaW5kZXgnKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaW5kZXg7XG4gICAgICB9XG5cbiAgICAgIHByaXZhdGUgX2dldEhvc3ROb2RlKCkgeyByZXR1cm4gZ2V0TE5vZGUodGhpcy5faG9zdFROb2RlLCB0aGlzLl9ob3N0Vmlldyk7IH1cbiAgICB9O1xuICB9XG5cbiAgY29uc3QgaG9zdExOb2RlID0gZ2V0TE5vZGUoaG9zdFROb2RlLCBob3N0Vmlldyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzKFxuICAgICAgICAgICAgICAgICAgIGhvc3RUTm9kZSwgVE5vZGVUeXBlLkNvbnRhaW5lciwgVE5vZGVUeXBlLkVsZW1lbnQsIFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKTtcblxuICBjb25zdCBsQ29udGFpbmVyID0gY3JlYXRlTENvbnRhaW5lcihob3N0VmlldywgdHJ1ZSk7XG4gIGNvbnN0IGNvbW1lbnQgPSBob3N0Vmlld1tSRU5ERVJFUl0uY3JlYXRlQ29tbWVudChuZ0Rldk1vZGUgPyAnY29udGFpbmVyJyA6ICcnKTtcbiAgY29uc3QgbENvbnRhaW5lck5vZGU6IExDb250YWluZXJOb2RlID1cbiAgICAgIGNyZWF0ZUxOb2RlT2JqZWN0KFROb2RlVHlwZS5Db250YWluZXIsIGhvc3RMTm9kZS5ub2RlSW5qZWN0b3IsIGNvbW1lbnQsIGxDb250YWluZXIpO1xuXG4gIGxDb250YWluZXJbUkVOREVSX1BBUkVOVF0gPSBnZXRSZW5kZXJQYXJlbnQoaG9zdFROb2RlLCBob3N0Vmlldyk7XG5cbiAgYXBwZW5kQ2hpbGQoY29tbWVudCwgaG9zdFROb2RlLCBob3N0Vmlldyk7XG5cbiAgaWYgKCFob3N0VE5vZGUuZHluYW1pY0NvbnRhaW5lck5vZGUpIHtcbiAgICBob3N0VE5vZGUuZHluYW1pY0NvbnRhaW5lck5vZGUgPVxuICAgICAgICBjcmVhdGVUTm9kZShUTm9kZVR5cGUuQ29udGFpbmVyLCAtMSwgbnVsbCwgbnVsbCwgaG9zdFROb2RlLCBudWxsKTtcbiAgfVxuXG4gIGhvc3RMTm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUgPSBsQ29udGFpbmVyTm9kZTtcbiAgYWRkVG9WaWV3VHJlZShob3N0VmlldywgaG9zdFROb2RlLmluZGV4IGFzIG51bWJlciwgbENvbnRhaW5lcik7XG5cbiAgcmV0dXJuIG5ldyBSM1ZpZXdDb250YWluZXJSZWYoXG4gICAgICBsQ29udGFpbmVyLCBob3N0VE5vZGUuZHluYW1pY0NvbnRhaW5lck5vZGUgYXMgVENvbnRhaW5lck5vZGUsIGhvc3RUTm9kZSwgaG9zdFZpZXcpO1xufVxuXG5cbi8qKiBSZXR1cm5zIGEgQ2hhbmdlRGV0ZWN0b3JSZWYgKGEuay5hLiBhIFZpZXdSZWYpICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0Q2hhbmdlRGV0ZWN0b3JSZWYoKTogVmlld0VuZ2luZV9DaGFuZ2VEZXRlY3RvclJlZiB7XG4gIHJldHVybiBjcmVhdGVWaWV3UmVmKGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpLCBfZ2V0Vmlld0RhdGEoKSwgbnVsbCk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIFZpZXdSZWYgYW5kIHN0b3JlcyBpdCBvbiB0aGUgaW5qZWN0b3IgYXMgQ2hhbmdlRGV0ZWN0b3JSZWYgKHB1YmxpYyBhbGlhcykuXG4gKlxuICogQHBhcmFtIGhvc3RUTm9kZSBUaGUgbm9kZSB0aGF0IGlzIHJlcXVlc3RpbmcgYSBDaGFuZ2VEZXRlY3RvclJlZlxuICogQHBhcmFtIGhvc3RWaWV3IFRoZSB2aWV3IHRvIHdoaWNoIHRoZSBub2RlIGJlbG9uZ3NcbiAqIEBwYXJhbSBjb250ZXh0IFRoZSBjb250ZXh0IGZvciB0aGlzIGNoYW5nZSBkZXRlY3RvciByZWZcbiAqIEByZXR1cm5zIFRoZSBDaGFuZ2VEZXRlY3RvclJlZiB0byB1c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVZpZXdSZWYoXG4gICAgaG9zdFROb2RlOiBUTm9kZSwgaG9zdFZpZXc6IExWaWV3RGF0YSwgY29udGV4dDogYW55KTogVmlld0VuZ2luZV9DaGFuZ2VEZXRlY3RvclJlZiB7XG4gIGlmIChpc0NvbXBvbmVudChob3N0VE5vZGUpKSB7XG4gICAgY29uc3QgY29tcG9uZW50SW5kZXggPSBob3N0VE5vZGUuZmxhZ3MgPj4gVE5vZGVGbGFncy5EaXJlY3RpdmVTdGFydGluZ0luZGV4U2hpZnQ7XG4gICAgY29uc3QgY29tcG9uZW50VmlldyA9IGdldExOb2RlKGhvc3RUTm9kZSwgaG9zdFZpZXcpLmRhdGEgYXMgTFZpZXdEYXRhO1xuICAgIHJldHVybiBuZXcgVmlld1JlZihjb21wb25lbnRWaWV3LCBjb250ZXh0LCBjb21wb25lbnRJbmRleCk7XG4gIH0gZWxzZSBpZiAoaG9zdFROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50KSB7XG4gICAgY29uc3QgaG9zdENvbXBvbmVudFZpZXcgPSBmaW5kQ29tcG9uZW50Vmlldyhob3N0Vmlldyk7XG4gICAgcmV0dXJuIG5ldyBWaWV3UmVmKGhvc3RDb21wb25lbnRWaWV3LCBob3N0Q29tcG9uZW50Vmlld1tDT05URVhUXSwgLTEpO1xuICB9XG4gIHJldHVybiBudWxsICE7XG59XG4iXX0=