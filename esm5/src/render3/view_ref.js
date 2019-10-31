/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { __extends } from "tslib";
import { checkNoChangesInRootView, checkNoChangesInternal, detectChangesInRootView, detectChangesInternal, markViewDirty, storeCleanupFn } from './instructions/shared';
import { CONTAINER_HEADER_OFFSET } from './interfaces/container';
import { isLContainer } from './interfaces/type_checks';
import { CONTEXT, FLAGS, HOST, TVIEW, T_HOST } from './interfaces/view';
import { assertNodeOfPossibleTypes } from './node_assert';
import { destroyLView, renderDetachView } from './node_manipulation';
import { findComponentView, getLViewParent } from './util/view_traversal_utils';
import { getNativeByTNode, unwrapRNode } from './util/view_utils';
var ViewRef = /** @class */ (function () {
    function ViewRef(
    /**
     * This represents `LView` associated with the component when ViewRef is a ChangeDetectorRef.
     *
     * When ViewRef is created for a dynamic component, this also represents the `LView` for the
     * component.
     *
     * For a "regular" ViewRef created for an embedded view, this is the `LView` for the embedded
     * view.
     *
     * @internal
     */
    _lView, 
    /**
     * This represents the `LView` associated with the point where `ChangeDetectorRef` was
     * requested.
     *
     * This may be different from `_lView` if the `_cdRefInjectingView` is an embedded view.
     */
    _cdRefInjectingView) {
        this._lView = _lView;
        this._cdRefInjectingView = _cdRefInjectingView;
        this._appRef = null;
        this._viewContainerRef = null;
        /**
         * @internal
         */
        this._tViewNode = null;
    }
    Object.defineProperty(ViewRef.prototype, "rootNodes", {
        get: function () {
            if (this._lView[HOST] == null) {
                var tView = this._lView[T_HOST];
                return collectNativeNodes(this._lView, tView.child, []);
            }
            return [];
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ViewRef.prototype, "context", {
        get: function () { return this._lView[CONTEXT]; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ViewRef.prototype, "destroyed", {
        get: function () {
            return (this._lView[FLAGS] & 256 /* Destroyed */) === 256 /* Destroyed */;
        },
        enumerable: true,
        configurable: true
    });
    ViewRef.prototype.destroy = function () {
        if (this._appRef) {
            this._appRef.detachView(this);
        }
        else if (this._viewContainerRef) {
            var index = this._viewContainerRef.indexOf(this);
            if (index > -1) {
                this._viewContainerRef.detach(index);
            }
            this._viewContainerRef = null;
        }
        destroyLView(this._lView);
    };
    ViewRef.prototype.onDestroy = function (callback) { storeCleanupFn(this._lView, callback); };
    /**
     * Marks a view and all of its ancestors dirty.
     *
     * It also triggers change detection by calling `scheduleTick` internally, which coalesces
     * multiple `markForCheck` calls to into one change detection run.
     *
     * This can be used to ensure an {@link ChangeDetectionStrategy#OnPush OnPush} component is
     * checked when it needs to be re-rendered but the two normal triggers haven't marked it
     * dirty (i.e. inputs haven't changed and events haven't fired in the view).
     *
     * <!-- TODO: Add a link to a chapter on OnPush components -->
     *
     * @usageNotes
     * ### Example
     *
     * ```typescript
     * @Component({
     *   selector: 'my-app',
     *   template: `Number of ticks: {{numberOfTicks}}`
     *   changeDetection: ChangeDetectionStrategy.OnPush,
     * })
     * class AppComponent {
     *   numberOfTicks = 0;
     *
     *   constructor(private ref: ChangeDetectorRef) {
     *     setInterval(() => {
     *       this.numberOfTicks++;
     *       // the following is required, otherwise the view will not be updated
     *       this.ref.markForCheck();
     *     }, 1000);
     *   }
     * }
     * ```
     */
    ViewRef.prototype.markForCheck = function () { markViewDirty(this._cdRefInjectingView || this._lView); };
    /**
     * Detaches the view from the change detection tree.
     *
     * Detached views will not be checked during change detection runs until they are
     * re-attached, even if they are dirty. `detach` can be used in combination with
     * {@link ChangeDetectorRef#detectChanges detectChanges} to implement local change
     * detection checks.
     *
     * <!-- TODO: Add a link to a chapter on detach/reattach/local digest -->
     * <!-- TODO: Add a live demo once ref.detectChanges is merged into master -->
     *
     * @usageNotes
     * ### Example
     *
     * The following example defines a component with a large list of readonly data.
     * Imagine the data changes constantly, many times per second. For performance reasons,
     * we want to check and update the list every five seconds. We can do that by detaching
     * the component's change detector and doing a local check every five seconds.
     *
     * ```typescript
     * class DataProvider {
     *   // in a real application the returned data will be different every time
     *   get data() {
     *     return [1,2,3,4,5];
     *   }
     * }
     *
     * @Component({
     *   selector: 'giant-list',
     *   template: `
     *     <li *ngFor="let d of dataProvider.data">Data {{d}}</li>
     *   `,
     * })
     * class GiantList {
     *   constructor(private ref: ChangeDetectorRef, private dataProvider: DataProvider) {
     *     ref.detach();
     *     setInterval(() => {
     *       this.ref.detectChanges();
     *     }, 5000);
     *   }
     * }
     *
     * @Component({
     *   selector: 'app',
     *   providers: [DataProvider],
     *   template: `
     *     <giant-list><giant-list>
     *   `,
     * })
     * class App {
     * }
     * ```
     */
    ViewRef.prototype.detach = function () { this._lView[FLAGS] &= ~128 /* Attached */; };
    /**
     * Re-attaches a view to the change detection tree.
     *
     * This can be used to re-attach views that were previously detached from the tree
     * using {@link ChangeDetectorRef#detach detach}. Views are attached to the tree by default.
     *
     * <!-- TODO: Add a link to a chapter on detach/reattach/local digest -->
     *
     * @usageNotes
     * ### Example
     *
     * The following example creates a component displaying `live` data. The component will detach
     * its change detector from the main change detector tree when the component's live property
     * is set to false.
     *
     * ```typescript
     * class DataProvider {
     *   data = 1;
     *
     *   constructor() {
     *     setInterval(() => {
     *       this.data = this.data * 2;
     *     }, 500);
     *   }
     * }
     *
     * @Component({
     *   selector: 'live-data',
     *   inputs: ['live'],
     *   template: 'Data: {{dataProvider.data}}'
     * })
     * class LiveData {
     *   constructor(private ref: ChangeDetectorRef, private dataProvider: DataProvider) {}
     *
     *   set live(value) {
     *     if (value) {
     *       this.ref.reattach();
     *     } else {
     *       this.ref.detach();
     *     }
     *   }
     * }
     *
     * @Component({
     *   selector: 'my-app',
     *   providers: [DataProvider],
     *   template: `
     *     Live Update: <input type="checkbox" [(ngModel)]="live">
     *     <live-data [live]="live"><live-data>
     *   `,
     * })
     * class AppComponent {
     *   live = true;
     * }
     * ```
     */
    ViewRef.prototype.reattach = function () { this._lView[FLAGS] |= 128 /* Attached */; };
    /**
     * Checks the view and its children.
     *
     * This can also be used in combination with {@link ChangeDetectorRef#detach detach} to implement
     * local change detection checks.
     *
     * <!-- TODO: Add a link to a chapter on detach/reattach/local digest -->
     * <!-- TODO: Add a live demo once ref.detectChanges is merged into master -->
     *
     * @usageNotes
     * ### Example
     *
     * The following example defines a component with a large list of readonly data.
     * Imagine, the data changes constantly, many times per second. For performance reasons,
     * we want to check and update the list every five seconds.
     *
     * We can do that by detaching the component's change detector and doing a local change detection
     * check every five seconds.
     *
     * See {@link ChangeDetectorRef#detach detach} for more information.
     */
    ViewRef.prototype.detectChanges = function () { detectChangesInternal(this._lView, this.context); };
    /**
     * Checks the change detector and its children, and throws if any changes are detected.
     *
     * This is used in development mode to verify that running change detection doesn't
     * introduce other changes.
     */
    ViewRef.prototype.checkNoChanges = function () { checkNoChangesInternal(this._lView, this.context); };
    ViewRef.prototype.attachToViewContainerRef = function (vcRef) {
        if (this._appRef) {
            throw new Error('This view is already attached directly to the ApplicationRef!');
        }
        this._viewContainerRef = vcRef;
    };
    ViewRef.prototype.detachFromAppRef = function () {
        this._appRef = null;
        renderDetachView(this._lView);
    };
    ViewRef.prototype.attachToAppRef = function (appRef) {
        if (this._viewContainerRef) {
            throw new Error('This view is already attached to a ViewContainer!');
        }
        this._appRef = appRef;
    };
    return ViewRef;
}());
export { ViewRef };
/** @internal */
var RootViewRef = /** @class */ (function (_super) {
    __extends(RootViewRef, _super);
    function RootViewRef(_view) {
        var _this = _super.call(this, _view) || this;
        _this._view = _view;
        return _this;
    }
    RootViewRef.prototype.detectChanges = function () { detectChangesInRootView(this._view); };
    RootViewRef.prototype.checkNoChanges = function () { checkNoChangesInRootView(this._view); };
    Object.defineProperty(RootViewRef.prototype, "context", {
        get: function () { return null; },
        enumerable: true,
        configurable: true
    });
    return RootViewRef;
}(ViewRef));
export { RootViewRef };
function collectNativeNodes(lView, tNode, result) {
    while (tNode !== null) {
        ngDevMode && assertNodeOfPossibleTypes(tNode, 3 /* Element */, 0 /* Container */, 1 /* Projection */, 4 /* ElementContainer */, 5 /* IcuContainer */);
        var lNode = lView[tNode.index];
        if (lNode !== null) {
            result.push(unwrapRNode(lNode));
        }
        // A given lNode can represent either a native node or a LContainer (when it is a host of a
        // ViewContainerRef). When we find a LContainer we need to descend into it to collect root nodes
        // from the views in this container.
        if (isLContainer(lNode)) {
            for (var i = CONTAINER_HEADER_OFFSET; i < lNode.length; i++) {
                var lViewInAContainer = lNode[i];
                var lViewFirstChildTNode = lViewInAContainer[TVIEW].firstChild;
                if (lViewFirstChildTNode !== null) {
                    collectNativeNodes(lViewInAContainer, lViewFirstChildTNode, result);
                }
            }
        }
        var tNodeType = tNode.type;
        if (tNodeType === 4 /* ElementContainer */ || tNodeType === 5 /* IcuContainer */) {
            collectNativeNodes(lView, tNode.child, result);
        }
        else if (tNodeType === 1 /* Projection */) {
            var componentView = findComponentView(lView);
            var componentHost = componentView[T_HOST];
            var parentView = getLViewParent(componentView);
            var currentProjectedNode = componentHost.projection[tNode.projection];
            while (currentProjectedNode !== null && parentView !== null) {
                result.push(getNativeByTNode(currentProjectedNode, parentView));
                currentProjectedNode = currentProjectedNode.next;
            }
        }
        tNode = tNode.next;
    }
    return result;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld19yZWYuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3ZpZXdfcmVmLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFPSCxPQUFPLEVBQUMsd0JBQXdCLEVBQUUsc0JBQXNCLEVBQUUsdUJBQXVCLEVBQUUscUJBQXFCLEVBQUUsYUFBYSxFQUFFLGNBQWMsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3RLLE9BQU8sRUFBQyx1QkFBdUIsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBRS9ELE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSwwQkFBMEIsQ0FBQztBQUN0RCxPQUFPLEVBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQXFCLEtBQUssRUFBRSxNQUFNLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUN6RixPQUFPLEVBQUMseUJBQXlCLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDeEQsT0FBTyxFQUFDLFlBQVksRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ25FLE9BQU8sRUFBQyxpQkFBaUIsRUFBRSxjQUFjLEVBQUMsTUFBTSw2QkFBNkIsQ0FBQztBQUM5RSxPQUFPLEVBQUMsZ0JBQWdCLEVBQUUsV0FBVyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFTaEU7SUFrQkU7SUFDSTs7Ozs7Ozs7OztPQVVHO0lBQ0ksTUFBYTtJQUVwQjs7Ozs7T0FLRztJQUNLLG1CQUEyQjtRQVI1QixXQUFNLEdBQU4sTUFBTSxDQUFPO1FBUVosd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFRO1FBcEMvQixZQUFPLEdBQXdCLElBQUksQ0FBQztRQUNwQyxzQkFBaUIsR0FBcUMsSUFBSSxDQUFDO1FBRW5FOztXQUVHO1FBQ0ksZUFBVSxHQUFtQixJQUFJLENBQUM7SUE4QkMsQ0FBQztJQTVCM0Msc0JBQUksOEJBQVM7YUFBYjtZQUNFLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLEVBQUU7Z0JBQzdCLElBQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFjLENBQUM7Z0JBQy9DLE9BQU8sa0JBQWtCLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO2FBQ3pEO1lBQ0QsT0FBTyxFQUFFLENBQUM7UUFDWixDQUFDOzs7T0FBQTtJQXdCRCxzQkFBSSw0QkFBTzthQUFYLGNBQW1CLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQU0sQ0FBQyxDQUFDLENBQUM7OztPQUFBO0lBRXRELHNCQUFJLDhCQUFTO2FBQWI7WUFDRSxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsc0JBQXVCLENBQUMsd0JBQXlCLENBQUM7UUFDOUUsQ0FBQzs7O09BQUE7SUFFRCx5QkFBTyxHQUFQO1FBQ0UsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQ2hCLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQy9CO2FBQU0sSUFBSSxJQUFJLENBQUMsaUJBQWlCLEVBQUU7WUFDakMsSUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUVuRCxJQUFJLEtBQUssR0FBRyxDQUFDLENBQUMsRUFBRTtnQkFDZCxJQUFJLENBQUMsaUJBQWlCLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO2FBQ3RDO1lBRUQsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQztTQUMvQjtRQUNELFlBQVksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDNUIsQ0FBQztJQUVELDJCQUFTLEdBQVQsVUFBVSxRQUFrQixJQUFJLGNBQWMsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUV4RTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O09BaUNHO0lBQ0gsOEJBQVksR0FBWixjQUF1QixhQUFhLENBQUMsSUFBSSxDQUFDLG1CQUFtQixJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFaEY7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7T0FvREc7SUFDSCx3QkFBTSxHQUFOLGNBQWlCLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksbUJBQW9CLENBQUMsQ0FBQyxDQUFDO0lBRTlEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O09BdURHO0lBQ0gsMEJBQVEsR0FBUixjQUFtQixJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxzQkFBdUIsQ0FBQyxDQUFDLENBQUM7SUFFL0Q7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O09Bb0JHO0lBQ0gsK0JBQWEsR0FBYixjQUF3QixxQkFBcUIsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFM0U7Ozs7O09BS0c7SUFDSCxnQ0FBYyxHQUFkLGNBQXlCLHNCQUFzQixDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUU3RSwwQ0FBd0IsR0FBeEIsVUFBeUIsS0FBa0M7UUFDekQsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQ2hCLE1BQU0sSUFBSSxLQUFLLENBQUMsK0RBQStELENBQUMsQ0FBQztTQUNsRjtRQUNELElBQUksQ0FBQyxpQkFBaUIsR0FBRyxLQUFLLENBQUM7SUFDakMsQ0FBQztJQUVELGtDQUFnQixHQUFoQjtRQUNFLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1FBQ3BCLGdCQUFnQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNoQyxDQUFDO0lBRUQsZ0NBQWMsR0FBZCxVQUFlLE1BQXNCO1FBQ25DLElBQUksSUFBSSxDQUFDLGlCQUFpQixFQUFFO1lBQzFCLE1BQU0sSUFBSSxLQUFLLENBQUMsbURBQW1ELENBQUMsQ0FBQztTQUN0RTtRQUNELElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDO0lBQ3hCLENBQUM7SUFDSCxjQUFDO0FBQUQsQ0FBQyxBQXJRRCxJQXFRQzs7QUFFRCxnQkFBZ0I7QUFDaEI7SUFBb0MsK0JBQVU7SUFDNUMscUJBQW1CLEtBQVk7UUFBL0IsWUFBbUMsa0JBQU0sS0FBSyxDQUFDLFNBQUc7UUFBL0IsV0FBSyxHQUFMLEtBQUssQ0FBTzs7SUFBa0IsQ0FBQztJQUVsRCxtQ0FBYSxHQUFiLGNBQXdCLHVCQUF1QixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFOUQsb0NBQWMsR0FBZCxjQUF5Qix3QkFBd0IsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRWhFLHNCQUFJLGdDQUFPO2FBQVgsY0FBbUIsT0FBTyxJQUFNLENBQUMsQ0FBQyxDQUFDOzs7T0FBQTtJQUNyQyxrQkFBQztBQUFELENBQUMsQUFSRCxDQUFvQyxPQUFPLEdBUTFDOztBQUVELFNBQVMsa0JBQWtCLENBQUMsS0FBWSxFQUFFLEtBQW1CLEVBQUUsTUFBYTtJQUMxRSxPQUFPLEtBQUssS0FBSyxJQUFJLEVBQUU7UUFDckIsU0FBUyxJQUFJLHlCQUF5QixDQUNyQixLQUFLLHlHQUM4QyxDQUFDO1FBRXJFLElBQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDakMsSUFBSSxLQUFLLEtBQUssSUFBSSxFQUFFO1lBQ2xCLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7U0FDakM7UUFFRCwyRkFBMkY7UUFDM0YsZ0dBQWdHO1FBQ2hHLG9DQUFvQztRQUNwQyxJQUFJLFlBQVksQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUN2QixLQUFLLElBQUksQ0FBQyxHQUFHLHVCQUF1QixFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUMzRCxJQUFNLGlCQUFpQixHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDbkMsSUFBTSxvQkFBb0IsR0FBRyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxVQUFVLENBQUM7Z0JBQ2pFLElBQUksb0JBQW9CLEtBQUssSUFBSSxFQUFFO29CQUNqQyxrQkFBa0IsQ0FBQyxpQkFBaUIsRUFBRSxvQkFBb0IsRUFBRSxNQUFNLENBQUMsQ0FBQztpQkFDckU7YUFDRjtTQUNGO1FBRUQsSUFBTSxTQUFTLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQztRQUM3QixJQUFJLFNBQVMsNkJBQStCLElBQUksU0FBUyx5QkFBMkIsRUFBRTtZQUNwRixrQkFBa0IsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztTQUNoRDthQUFNLElBQUksU0FBUyx1QkFBeUIsRUFBRTtZQUM3QyxJQUFNLGFBQWEsR0FBRyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUMvQyxJQUFNLGFBQWEsR0FBRyxhQUFhLENBQUMsTUFBTSxDQUFpQixDQUFDO1lBQzVELElBQU0sVUFBVSxHQUFHLGNBQWMsQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUNqRCxJQUFJLG9CQUFvQixHQUNuQixhQUFhLENBQUMsVUFBOEIsQ0FBQyxLQUFLLENBQUMsVUFBb0IsQ0FBQyxDQUFDO1lBRTlFLE9BQU8sb0JBQW9CLEtBQUssSUFBSSxJQUFJLFVBQVUsS0FBSyxJQUFJLEVBQUU7Z0JBQzNELE1BQU0sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsb0JBQW9CLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQztnQkFDaEUsb0JBQW9CLEdBQUcsb0JBQW9CLENBQUMsSUFBSSxDQUFDO2FBQ2xEO1NBQ0Y7UUFDRCxLQUFLLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQztLQUNwQjtJQUVELE9BQU8sTUFBTSxDQUFDO0FBQ2hCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7QXBwbGljYXRpb25SZWZ9IGZyb20gJy4uL2FwcGxpY2F0aW9uX3JlZic7XG5pbXBvcnQge0NoYW5nZURldGVjdG9yUmVmIGFzIHZpZXdFbmdpbmVfQ2hhbmdlRGV0ZWN0b3JSZWZ9IGZyb20gJy4uL2NoYW5nZV9kZXRlY3Rpb24vY2hhbmdlX2RldGVjdG9yX3JlZic7XG5pbXBvcnQge1ZpZXdDb250YWluZXJSZWYgYXMgdmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmfSBmcm9tICcuLi9saW5rZXIvdmlld19jb250YWluZXJfcmVmJztcbmltcG9ydCB7RW1iZWRkZWRWaWV3UmVmIGFzIHZpZXdFbmdpbmVfRW1iZWRkZWRWaWV3UmVmLCBJbnRlcm5hbFZpZXdSZWYgYXMgdmlld0VuZ2luZV9JbnRlcm5hbFZpZXdSZWZ9IGZyb20gJy4uL2xpbmtlci92aWV3X3JlZic7XG5cbmltcG9ydCB7Y2hlY2tOb0NoYW5nZXNJblJvb3RWaWV3LCBjaGVja05vQ2hhbmdlc0ludGVybmFsLCBkZXRlY3RDaGFuZ2VzSW5Sb290VmlldywgZGV0ZWN0Q2hhbmdlc0ludGVybmFsLCBtYXJrVmlld0RpcnR5LCBzdG9yZUNsZWFudXBGbn0gZnJvbSAnLi9pbnN0cnVjdGlvbnMvc2hhcmVkJztcbmltcG9ydCB7Q09OVEFJTkVSX0hFQURFUl9PRkZTRVR9IGZyb20gJy4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtURWxlbWVudE5vZGUsIFROb2RlLCBUTm9kZVR5cGUsIFRWaWV3Tm9kZX0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtpc0xDb250YWluZXJ9IGZyb20gJy4vaW50ZXJmYWNlcy90eXBlX2NoZWNrcyc7XG5pbXBvcnQge0NPTlRFWFQsIEZMQUdTLCBIT1NULCBMVmlldywgTFZpZXdGbGFncywgVFZJRVcsIFRfSE9TVH0gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHthc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzfSBmcm9tICcuL25vZGVfYXNzZXJ0JztcbmltcG9ydCB7ZGVzdHJveUxWaWV3LCByZW5kZXJEZXRhY2hWaWV3fSBmcm9tICcuL25vZGVfbWFuaXB1bGF0aW9uJztcbmltcG9ydCB7ZmluZENvbXBvbmVudFZpZXcsIGdldExWaWV3UGFyZW50fSBmcm9tICcuL3V0aWwvdmlld190cmF2ZXJzYWxfdXRpbHMnO1xuaW1wb3J0IHtnZXROYXRpdmVCeVROb2RlLCB1bndyYXBSTm9kZX0gZnJvbSAnLi91dGlsL3ZpZXdfdXRpbHMnO1xuXG5cblxuLy8gTmVlZGVkIGR1ZSB0byB0c2lja2xlIGRvd25sZXZlbGluZyB3aGVyZSBtdWx0aXBsZSBgaW1wbGVtZW50c2Agd2l0aCBjbGFzc2VzIGNyZWF0ZXNcbi8vIG11bHRpcGxlIEBleHRlbmRzIGluIENsb3N1cmUgYW5ub3RhdGlvbnMsIHdoaWNoIGlzIGlsbGVnYWwuIFRoaXMgd29ya2Fyb3VuZCBmaXhlc1xuLy8gdGhlIG11bHRpcGxlIEBleHRlbmRzIGJ5IG1ha2luZyB0aGUgYW5ub3RhdGlvbiBAaW1wbGVtZW50cyBpbnN0ZWFkXG5leHBvcnQgaW50ZXJmYWNlIHZpZXdFbmdpbmVfQ2hhbmdlRGV0ZWN0b3JSZWZfaW50ZXJmYWNlIGV4dGVuZHMgdmlld0VuZ2luZV9DaGFuZ2VEZXRlY3RvclJlZiB7fVxuXG5leHBvcnQgY2xhc3MgVmlld1JlZjxUPiBpbXBsZW1lbnRzIHZpZXdFbmdpbmVfRW1iZWRkZWRWaWV3UmVmPFQ+LCB2aWV3RW5naW5lX0ludGVybmFsVmlld1JlZixcbiAgICB2aWV3RW5naW5lX0NoYW5nZURldGVjdG9yUmVmX2ludGVyZmFjZSB7XG4gIHByaXZhdGUgX2FwcFJlZjogQXBwbGljYXRpb25SZWZ8bnVsbCA9IG51bGw7XG4gIHByaXZhdGUgX3ZpZXdDb250YWluZXJSZWY6IHZpZXdFbmdpbmVfVmlld0NvbnRhaW5lclJlZnxudWxsID0gbnVsbDtcblxuICAvKipcbiAgICogQGludGVybmFsXG4gICAqL1xuICBwdWJsaWMgX3RWaWV3Tm9kZTogVFZpZXdOb2RlfG51bGwgPSBudWxsO1xuXG4gIGdldCByb290Tm9kZXMoKTogYW55W10ge1xuICAgIGlmICh0aGlzLl9sVmlld1tIT1NUXSA9PSBudWxsKSB7XG4gICAgICBjb25zdCB0VmlldyA9IHRoaXMuX2xWaWV3W1RfSE9TVF0gYXMgVFZpZXdOb2RlO1xuICAgICAgcmV0dXJuIGNvbGxlY3ROYXRpdmVOb2Rlcyh0aGlzLl9sVmlldywgdFZpZXcuY2hpbGQsIFtdKTtcbiAgICB9XG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICAvKipcbiAgICAgICAqIFRoaXMgcmVwcmVzZW50cyBgTFZpZXdgIGFzc29jaWF0ZWQgd2l0aCB0aGUgY29tcG9uZW50IHdoZW4gVmlld1JlZiBpcyBhIENoYW5nZURldGVjdG9yUmVmLlxuICAgICAgICpcbiAgICAgICAqIFdoZW4gVmlld1JlZiBpcyBjcmVhdGVkIGZvciBhIGR5bmFtaWMgY29tcG9uZW50LCB0aGlzIGFsc28gcmVwcmVzZW50cyB0aGUgYExWaWV3YCBmb3IgdGhlXG4gICAgICAgKiBjb21wb25lbnQuXG4gICAgICAgKlxuICAgICAgICogRm9yIGEgXCJyZWd1bGFyXCIgVmlld1JlZiBjcmVhdGVkIGZvciBhbiBlbWJlZGRlZCB2aWV3LCB0aGlzIGlzIHRoZSBgTFZpZXdgIGZvciB0aGUgZW1iZWRkZWRcbiAgICAgICAqIHZpZXcuXG4gICAgICAgKlxuICAgICAgICogQGludGVybmFsXG4gICAgICAgKi9cbiAgICAgIHB1YmxpYyBfbFZpZXc6IExWaWV3LFxuXG4gICAgICAvKipcbiAgICAgICAqIFRoaXMgcmVwcmVzZW50cyB0aGUgYExWaWV3YCBhc3NvY2lhdGVkIHdpdGggdGhlIHBvaW50IHdoZXJlIGBDaGFuZ2VEZXRlY3RvclJlZmAgd2FzXG4gICAgICAgKiByZXF1ZXN0ZWQuXG4gICAgICAgKlxuICAgICAgICogVGhpcyBtYXkgYmUgZGlmZmVyZW50IGZyb20gYF9sVmlld2AgaWYgdGhlIGBfY2RSZWZJbmplY3RpbmdWaWV3YCBpcyBhbiBlbWJlZGRlZCB2aWV3LlxuICAgICAgICovXG4gICAgICBwcml2YXRlIF9jZFJlZkluamVjdGluZ1ZpZXc/OiBMVmlldykge31cblxuICBnZXQgY29udGV4dCgpOiBUIHsgcmV0dXJuIHRoaXMuX2xWaWV3W0NPTlRFWFRdIGFzIFQ7IH1cblxuICBnZXQgZGVzdHJveWVkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAodGhpcy5fbFZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5EZXN0cm95ZWQpID09PSBMVmlld0ZsYWdzLkRlc3Ryb3llZDtcbiAgfVxuXG4gIGRlc3Ryb3koKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX2FwcFJlZikge1xuICAgICAgdGhpcy5fYXBwUmVmLmRldGFjaFZpZXcodGhpcyk7XG4gICAgfSBlbHNlIGlmICh0aGlzLl92aWV3Q29udGFpbmVyUmVmKSB7XG4gICAgICBjb25zdCBpbmRleCA9IHRoaXMuX3ZpZXdDb250YWluZXJSZWYuaW5kZXhPZih0aGlzKTtcblxuICAgICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgICAgdGhpcy5fdmlld0NvbnRhaW5lclJlZi5kZXRhY2goaW5kZXgpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLl92aWV3Q29udGFpbmVyUmVmID0gbnVsbDtcbiAgICB9XG4gICAgZGVzdHJveUxWaWV3KHRoaXMuX2xWaWV3KTtcbiAgfVxuXG4gIG9uRGVzdHJveShjYWxsYmFjazogRnVuY3Rpb24pIHsgc3RvcmVDbGVhbnVwRm4odGhpcy5fbFZpZXcsIGNhbGxiYWNrKTsgfVxuXG4gIC8qKlxuICAgKiBNYXJrcyBhIHZpZXcgYW5kIGFsbCBvZiBpdHMgYW5jZXN0b3JzIGRpcnR5LlxuICAgKlxuICAgKiBJdCBhbHNvIHRyaWdnZXJzIGNoYW5nZSBkZXRlY3Rpb24gYnkgY2FsbGluZyBgc2NoZWR1bGVUaWNrYCBpbnRlcm5hbGx5LCB3aGljaCBjb2FsZXNjZXNcbiAgICogbXVsdGlwbGUgYG1hcmtGb3JDaGVja2AgY2FsbHMgdG8gaW50byBvbmUgY2hhbmdlIGRldGVjdGlvbiBydW4uXG4gICAqXG4gICAqIFRoaXMgY2FuIGJlIHVzZWQgdG8gZW5zdXJlIGFuIHtAbGluayBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSNPblB1c2ggT25QdXNofSBjb21wb25lbnQgaXNcbiAgICogY2hlY2tlZCB3aGVuIGl0IG5lZWRzIHRvIGJlIHJlLXJlbmRlcmVkIGJ1dCB0aGUgdHdvIG5vcm1hbCB0cmlnZ2VycyBoYXZlbid0IG1hcmtlZCBpdFxuICAgKiBkaXJ0eSAoaS5lLiBpbnB1dHMgaGF2ZW4ndCBjaGFuZ2VkIGFuZCBldmVudHMgaGF2ZW4ndCBmaXJlZCBpbiB0aGUgdmlldykuXG4gICAqXG4gICAqIDwhLS0gVE9ETzogQWRkIGEgbGluayB0byBhIGNoYXB0ZXIgb24gT25QdXNoIGNvbXBvbmVudHMgLS0+XG4gICAqXG4gICAqIEB1c2FnZU5vdGVzXG4gICAqICMjIyBFeGFtcGxlXG4gICAqXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogQENvbXBvbmVudCh7XG4gICAqICAgc2VsZWN0b3I6ICdteS1hcHAnLFxuICAgKiAgIHRlbXBsYXRlOiBgTnVtYmVyIG9mIHRpY2tzOiB7e251bWJlck9mVGlja3N9fWBcbiAgICogICBjaGFuZ2VEZXRlY3Rpb246IENoYW5nZURldGVjdGlvblN0cmF0ZWd5Lk9uUHVzaCxcbiAgICogfSlcbiAgICogY2xhc3MgQXBwQ29tcG9uZW50IHtcbiAgICogICBudW1iZXJPZlRpY2tzID0gMDtcbiAgICpcbiAgICogICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlZjogQ2hhbmdlRGV0ZWN0b3JSZWYpIHtcbiAgICogICAgIHNldEludGVydmFsKCgpID0+IHtcbiAgICogICAgICAgdGhpcy5udW1iZXJPZlRpY2tzKys7XG4gICAqICAgICAgIC8vIHRoZSBmb2xsb3dpbmcgaXMgcmVxdWlyZWQsIG90aGVyd2lzZSB0aGUgdmlldyB3aWxsIG5vdCBiZSB1cGRhdGVkXG4gICAqICAgICAgIHRoaXMucmVmLm1hcmtGb3JDaGVjaygpO1xuICAgKiAgICAgfSwgMTAwMCk7XG4gICAqICAgfVxuICAgKiB9XG4gICAqIGBgYFxuICAgKi9cbiAgbWFya0ZvckNoZWNrKCk6IHZvaWQgeyBtYXJrVmlld0RpcnR5KHRoaXMuX2NkUmVmSW5qZWN0aW5nVmlldyB8fCB0aGlzLl9sVmlldyk7IH1cblxuICAvKipcbiAgICogRGV0YWNoZXMgdGhlIHZpZXcgZnJvbSB0aGUgY2hhbmdlIGRldGVjdGlvbiB0cmVlLlxuICAgKlxuICAgKiBEZXRhY2hlZCB2aWV3cyB3aWxsIG5vdCBiZSBjaGVja2VkIGR1cmluZyBjaGFuZ2UgZGV0ZWN0aW9uIHJ1bnMgdW50aWwgdGhleSBhcmVcbiAgICogcmUtYXR0YWNoZWQsIGV2ZW4gaWYgdGhleSBhcmUgZGlydHkuIGBkZXRhY2hgIGNhbiBiZSB1c2VkIGluIGNvbWJpbmF0aW9uIHdpdGhcbiAgICoge0BsaW5rIENoYW5nZURldGVjdG9yUmVmI2RldGVjdENoYW5nZXMgZGV0ZWN0Q2hhbmdlc30gdG8gaW1wbGVtZW50IGxvY2FsIGNoYW5nZVxuICAgKiBkZXRlY3Rpb24gY2hlY2tzLlxuICAgKlxuICAgKiA8IS0tIFRPRE86IEFkZCBhIGxpbmsgdG8gYSBjaGFwdGVyIG9uIGRldGFjaC9yZWF0dGFjaC9sb2NhbCBkaWdlc3QgLS0+XG4gICAqIDwhLS0gVE9ETzogQWRkIGEgbGl2ZSBkZW1vIG9uY2UgcmVmLmRldGVjdENoYW5nZXMgaXMgbWVyZ2VkIGludG8gbWFzdGVyIC0tPlxuICAgKlxuICAgKiBAdXNhZ2VOb3Rlc1xuICAgKiAjIyMgRXhhbXBsZVxuICAgKlxuICAgKiBUaGUgZm9sbG93aW5nIGV4YW1wbGUgZGVmaW5lcyBhIGNvbXBvbmVudCB3aXRoIGEgbGFyZ2UgbGlzdCBvZiByZWFkb25seSBkYXRhLlxuICAgKiBJbWFnaW5lIHRoZSBkYXRhIGNoYW5nZXMgY29uc3RhbnRseSwgbWFueSB0aW1lcyBwZXIgc2Vjb25kLiBGb3IgcGVyZm9ybWFuY2UgcmVhc29ucyxcbiAgICogd2Ugd2FudCB0byBjaGVjayBhbmQgdXBkYXRlIHRoZSBsaXN0IGV2ZXJ5IGZpdmUgc2Vjb25kcy4gV2UgY2FuIGRvIHRoYXQgYnkgZGV0YWNoaW5nXG4gICAqIHRoZSBjb21wb25lbnQncyBjaGFuZ2UgZGV0ZWN0b3IgYW5kIGRvaW5nIGEgbG9jYWwgY2hlY2sgZXZlcnkgZml2ZSBzZWNvbmRzLlxuICAgKlxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIGNsYXNzIERhdGFQcm92aWRlciB7XG4gICAqICAgLy8gaW4gYSByZWFsIGFwcGxpY2F0aW9uIHRoZSByZXR1cm5lZCBkYXRhIHdpbGwgYmUgZGlmZmVyZW50IGV2ZXJ5IHRpbWVcbiAgICogICBnZXQgZGF0YSgpIHtcbiAgICogICAgIHJldHVybiBbMSwyLDMsNCw1XTtcbiAgICogICB9XG4gICAqIH1cbiAgICpcbiAgICogQENvbXBvbmVudCh7XG4gICAqICAgc2VsZWN0b3I6ICdnaWFudC1saXN0JyxcbiAgICogICB0ZW1wbGF0ZTogYFxuICAgKiAgICAgPGxpICpuZ0Zvcj1cImxldCBkIG9mIGRhdGFQcm92aWRlci5kYXRhXCI+RGF0YSB7e2R9fTwvbGk+XG4gICAqICAgYCxcbiAgICogfSlcbiAgICogY2xhc3MgR2lhbnRMaXN0IHtcbiAgICogICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlZjogQ2hhbmdlRGV0ZWN0b3JSZWYsIHByaXZhdGUgZGF0YVByb3ZpZGVyOiBEYXRhUHJvdmlkZXIpIHtcbiAgICogICAgIHJlZi5kZXRhY2goKTtcbiAgICogICAgIHNldEludGVydmFsKCgpID0+IHtcbiAgICogICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgKiAgICAgfSwgNTAwMCk7XG4gICAqICAgfVxuICAgKiB9XG4gICAqXG4gICAqIEBDb21wb25lbnQoe1xuICAgKiAgIHNlbGVjdG9yOiAnYXBwJyxcbiAgICogICBwcm92aWRlcnM6IFtEYXRhUHJvdmlkZXJdLFxuICAgKiAgIHRlbXBsYXRlOiBgXG4gICAqICAgICA8Z2lhbnQtbGlzdD48Z2lhbnQtbGlzdD5cbiAgICogICBgLFxuICAgKiB9KVxuICAgKiBjbGFzcyBBcHAge1xuICAgKiB9XG4gICAqIGBgYFxuICAgKi9cbiAgZGV0YWNoKCk6IHZvaWQgeyB0aGlzLl9sVmlld1tGTEFHU10gJj0gfkxWaWV3RmxhZ3MuQXR0YWNoZWQ7IH1cblxuICAvKipcbiAgICogUmUtYXR0YWNoZXMgYSB2aWV3IHRvIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHRyZWUuXG4gICAqXG4gICAqIFRoaXMgY2FuIGJlIHVzZWQgdG8gcmUtYXR0YWNoIHZpZXdzIHRoYXQgd2VyZSBwcmV2aW91c2x5IGRldGFjaGVkIGZyb20gdGhlIHRyZWVcbiAgICogdXNpbmcge0BsaW5rIENoYW5nZURldGVjdG9yUmVmI2RldGFjaCBkZXRhY2h9LiBWaWV3cyBhcmUgYXR0YWNoZWQgdG8gdGhlIHRyZWUgYnkgZGVmYXVsdC5cbiAgICpcbiAgICogPCEtLSBUT0RPOiBBZGQgYSBsaW5rIHRvIGEgY2hhcHRlciBvbiBkZXRhY2gvcmVhdHRhY2gvbG9jYWwgZGlnZXN0IC0tPlxuICAgKlxuICAgKiBAdXNhZ2VOb3Rlc1xuICAgKiAjIyMgRXhhbXBsZVxuICAgKlxuICAgKiBUaGUgZm9sbG93aW5nIGV4YW1wbGUgY3JlYXRlcyBhIGNvbXBvbmVudCBkaXNwbGF5aW5nIGBsaXZlYCBkYXRhLiBUaGUgY29tcG9uZW50IHdpbGwgZGV0YWNoXG4gICAqIGl0cyBjaGFuZ2UgZGV0ZWN0b3IgZnJvbSB0aGUgbWFpbiBjaGFuZ2UgZGV0ZWN0b3IgdHJlZSB3aGVuIHRoZSBjb21wb25lbnQncyBsaXZlIHByb3BlcnR5XG4gICAqIGlzIHNldCB0byBmYWxzZS5cbiAgICpcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBjbGFzcyBEYXRhUHJvdmlkZXIge1xuICAgKiAgIGRhdGEgPSAxO1xuICAgKlxuICAgKiAgIGNvbnN0cnVjdG9yKCkge1xuICAgKiAgICAgc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgKiAgICAgICB0aGlzLmRhdGEgPSB0aGlzLmRhdGEgKiAyO1xuICAgKiAgICAgfSwgNTAwKTtcbiAgICogICB9XG4gICAqIH1cbiAgICpcbiAgICogQENvbXBvbmVudCh7XG4gICAqICAgc2VsZWN0b3I6ICdsaXZlLWRhdGEnLFxuICAgKiAgIGlucHV0czogWydsaXZlJ10sXG4gICAqICAgdGVtcGxhdGU6ICdEYXRhOiB7e2RhdGFQcm92aWRlci5kYXRhfX0nXG4gICAqIH0pXG4gICAqIGNsYXNzIExpdmVEYXRhIHtcbiAgICogICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlZjogQ2hhbmdlRGV0ZWN0b3JSZWYsIHByaXZhdGUgZGF0YVByb3ZpZGVyOiBEYXRhUHJvdmlkZXIpIHt9XG4gICAqXG4gICAqICAgc2V0IGxpdmUodmFsdWUpIHtcbiAgICogICAgIGlmICh2YWx1ZSkge1xuICAgKiAgICAgICB0aGlzLnJlZi5yZWF0dGFjaCgpO1xuICAgKiAgICAgfSBlbHNlIHtcbiAgICogICAgICAgdGhpcy5yZWYuZGV0YWNoKCk7XG4gICAqICAgICB9XG4gICAqICAgfVxuICAgKiB9XG4gICAqXG4gICAqIEBDb21wb25lbnQoe1xuICAgKiAgIHNlbGVjdG9yOiAnbXktYXBwJyxcbiAgICogICBwcm92aWRlcnM6IFtEYXRhUHJvdmlkZXJdLFxuICAgKiAgIHRlbXBsYXRlOiBgXG4gICAqICAgICBMaXZlIFVwZGF0ZTogPGlucHV0IHR5cGU9XCJjaGVja2JveFwiIFsobmdNb2RlbCldPVwibGl2ZVwiPlxuICAgKiAgICAgPGxpdmUtZGF0YSBbbGl2ZV09XCJsaXZlXCI+PGxpdmUtZGF0YT5cbiAgICogICBgLFxuICAgKiB9KVxuICAgKiBjbGFzcyBBcHBDb21wb25lbnQge1xuICAgKiAgIGxpdmUgPSB0cnVlO1xuICAgKiB9XG4gICAqIGBgYFxuICAgKi9cbiAgcmVhdHRhY2goKTogdm9pZCB7IHRoaXMuX2xWaWV3W0ZMQUdTXSB8PSBMVmlld0ZsYWdzLkF0dGFjaGVkOyB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyB0aGUgdmlldyBhbmQgaXRzIGNoaWxkcmVuLlxuICAgKlxuICAgKiBUaGlzIGNhbiBhbHNvIGJlIHVzZWQgaW4gY29tYmluYXRpb24gd2l0aCB7QGxpbmsgQ2hhbmdlRGV0ZWN0b3JSZWYjZGV0YWNoIGRldGFjaH0gdG8gaW1wbGVtZW50XG4gICAqIGxvY2FsIGNoYW5nZSBkZXRlY3Rpb24gY2hlY2tzLlxuICAgKlxuICAgKiA8IS0tIFRPRE86IEFkZCBhIGxpbmsgdG8gYSBjaGFwdGVyIG9uIGRldGFjaC9yZWF0dGFjaC9sb2NhbCBkaWdlc3QgLS0+XG4gICAqIDwhLS0gVE9ETzogQWRkIGEgbGl2ZSBkZW1vIG9uY2UgcmVmLmRldGVjdENoYW5nZXMgaXMgbWVyZ2VkIGludG8gbWFzdGVyIC0tPlxuICAgKlxuICAgKiBAdXNhZ2VOb3Rlc1xuICAgKiAjIyMgRXhhbXBsZVxuICAgKlxuICAgKiBUaGUgZm9sbG93aW5nIGV4YW1wbGUgZGVmaW5lcyBhIGNvbXBvbmVudCB3aXRoIGEgbGFyZ2UgbGlzdCBvZiByZWFkb25seSBkYXRhLlxuICAgKiBJbWFnaW5lLCB0aGUgZGF0YSBjaGFuZ2VzIGNvbnN0YW50bHksIG1hbnkgdGltZXMgcGVyIHNlY29uZC4gRm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMsXG4gICAqIHdlIHdhbnQgdG8gY2hlY2sgYW5kIHVwZGF0ZSB0aGUgbGlzdCBldmVyeSBmaXZlIHNlY29uZHMuXG4gICAqXG4gICAqIFdlIGNhbiBkbyB0aGF0IGJ5IGRldGFjaGluZyB0aGUgY29tcG9uZW50J3MgY2hhbmdlIGRldGVjdG9yIGFuZCBkb2luZyBhIGxvY2FsIGNoYW5nZSBkZXRlY3Rpb25cbiAgICogY2hlY2sgZXZlcnkgZml2ZSBzZWNvbmRzLlxuICAgKlxuICAgKiBTZWUge0BsaW5rIENoYW5nZURldGVjdG9yUmVmI2RldGFjaCBkZXRhY2h9IGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICAgKi9cbiAgZGV0ZWN0Q2hhbmdlcygpOiB2b2lkIHsgZGV0ZWN0Q2hhbmdlc0ludGVybmFsKHRoaXMuX2xWaWV3LCB0aGlzLmNvbnRleHQpOyB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyB0aGUgY2hhbmdlIGRldGVjdG9yIGFuZCBpdHMgY2hpbGRyZW4sIGFuZCB0aHJvd3MgaWYgYW55IGNoYW5nZXMgYXJlIGRldGVjdGVkLlxuICAgKlxuICAgKiBUaGlzIGlzIHVzZWQgaW4gZGV2ZWxvcG1lbnQgbW9kZSB0byB2ZXJpZnkgdGhhdCBydW5uaW5nIGNoYW5nZSBkZXRlY3Rpb24gZG9lc24ndFxuICAgKiBpbnRyb2R1Y2Ugb3RoZXIgY2hhbmdlcy5cbiAgICovXG4gIGNoZWNrTm9DaGFuZ2VzKCk6IHZvaWQgeyBjaGVja05vQ2hhbmdlc0ludGVybmFsKHRoaXMuX2xWaWV3LCB0aGlzLmNvbnRleHQpOyB9XG5cbiAgYXR0YWNoVG9WaWV3Q29udGFpbmVyUmVmKHZjUmVmOiB2aWV3RW5naW5lX1ZpZXdDb250YWluZXJSZWYpIHtcbiAgICBpZiAodGhpcy5fYXBwUmVmKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoaXMgdmlldyBpcyBhbHJlYWR5IGF0dGFjaGVkIGRpcmVjdGx5IHRvIHRoZSBBcHBsaWNhdGlvblJlZiEnKTtcbiAgICB9XG4gICAgdGhpcy5fdmlld0NvbnRhaW5lclJlZiA9IHZjUmVmO1xuICB9XG5cbiAgZGV0YWNoRnJvbUFwcFJlZigpIHtcbiAgICB0aGlzLl9hcHBSZWYgPSBudWxsO1xuICAgIHJlbmRlckRldGFjaFZpZXcodGhpcy5fbFZpZXcpO1xuICB9XG5cbiAgYXR0YWNoVG9BcHBSZWYoYXBwUmVmOiBBcHBsaWNhdGlvblJlZikge1xuICAgIGlmICh0aGlzLl92aWV3Q29udGFpbmVyUmVmKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoaXMgdmlldyBpcyBhbHJlYWR5IGF0dGFjaGVkIHRvIGEgVmlld0NvbnRhaW5lciEnKTtcbiAgICB9XG4gICAgdGhpcy5fYXBwUmVmID0gYXBwUmVmO1xuICB9XG59XG5cbi8qKiBAaW50ZXJuYWwgKi9cbmV4cG9ydCBjbGFzcyBSb290Vmlld1JlZjxUPiBleHRlbmRzIFZpZXdSZWY8VD4ge1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgX3ZpZXc6IExWaWV3KSB7IHN1cGVyKF92aWV3KTsgfVxuXG4gIGRldGVjdENoYW5nZXMoKTogdm9pZCB7IGRldGVjdENoYW5nZXNJblJvb3RWaWV3KHRoaXMuX3ZpZXcpOyB9XG5cbiAgY2hlY2tOb0NoYW5nZXMoKTogdm9pZCB7IGNoZWNrTm9DaGFuZ2VzSW5Sb290Vmlldyh0aGlzLl92aWV3KTsgfVxuXG4gIGdldCBjb250ZXh0KCk6IFQgeyByZXR1cm4gbnVsbCAhOyB9XG59XG5cbmZ1bmN0aW9uIGNvbGxlY3ROYXRpdmVOb2RlcyhsVmlldzogTFZpZXcsIHROb2RlOiBUTm9kZSB8IG51bGwsIHJlc3VsdDogYW55W10pOiBhbnlbXSB7XG4gIHdoaWxlICh0Tm9kZSAhPT0gbnVsbCkge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzKFxuICAgICAgICAgICAgICAgICAgICAgdE5vZGUsIFROb2RlVHlwZS5FbGVtZW50LCBUTm9kZVR5cGUuQ29udGFpbmVyLCBUTm9kZVR5cGUuUHJvamVjdGlvbixcbiAgICAgICAgICAgICAgICAgICAgIFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyLCBUTm9kZVR5cGUuSWN1Q29udGFpbmVyKTtcblxuICAgIGNvbnN0IGxOb2RlID0gbFZpZXdbdE5vZGUuaW5kZXhdO1xuICAgIGlmIChsTm9kZSAhPT0gbnVsbCkge1xuICAgICAgcmVzdWx0LnB1c2godW53cmFwUk5vZGUobE5vZGUpKTtcbiAgICB9XG5cbiAgICAvLyBBIGdpdmVuIGxOb2RlIGNhbiByZXByZXNlbnQgZWl0aGVyIGEgbmF0aXZlIG5vZGUgb3IgYSBMQ29udGFpbmVyICh3aGVuIGl0IGlzIGEgaG9zdCBvZiBhXG4gICAgLy8gVmlld0NvbnRhaW5lclJlZikuIFdoZW4gd2UgZmluZCBhIExDb250YWluZXIgd2UgbmVlZCB0byBkZXNjZW5kIGludG8gaXQgdG8gY29sbGVjdCByb290IG5vZGVzXG4gICAgLy8gZnJvbSB0aGUgdmlld3MgaW4gdGhpcyBjb250YWluZXIuXG4gICAgaWYgKGlzTENvbnRhaW5lcihsTm9kZSkpIHtcbiAgICAgIGZvciAobGV0IGkgPSBDT05UQUlORVJfSEVBREVSX09GRlNFVDsgaSA8IGxOb2RlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGxWaWV3SW5BQ29udGFpbmVyID0gbE5vZGVbaV07XG4gICAgICAgIGNvbnN0IGxWaWV3Rmlyc3RDaGlsZFROb2RlID0gbFZpZXdJbkFDb250YWluZXJbVFZJRVddLmZpcnN0Q2hpbGQ7XG4gICAgICAgIGlmIChsVmlld0ZpcnN0Q2hpbGRUTm9kZSAhPT0gbnVsbCkge1xuICAgICAgICAgIGNvbGxlY3ROYXRpdmVOb2RlcyhsVmlld0luQUNvbnRhaW5lciwgbFZpZXdGaXJzdENoaWxkVE5vZGUsIHJlc3VsdCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCB0Tm9kZVR5cGUgPSB0Tm9kZS50eXBlO1xuICAgIGlmICh0Tm9kZVR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyIHx8IHROb2RlVHlwZSA9PT0gVE5vZGVUeXBlLkljdUNvbnRhaW5lcikge1xuICAgICAgY29sbGVjdE5hdGl2ZU5vZGVzKGxWaWV3LCB0Tm9kZS5jaGlsZCwgcmVzdWx0KTtcbiAgICB9IGVsc2UgaWYgKHROb2RlVHlwZSA9PT0gVE5vZGVUeXBlLlByb2plY3Rpb24pIHtcbiAgICAgIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBmaW5kQ29tcG9uZW50VmlldyhsVmlldyk7XG4gICAgICBjb25zdCBjb21wb25lbnRIb3N0ID0gY29tcG9uZW50Vmlld1tUX0hPU1RdIGFzIFRFbGVtZW50Tm9kZTtcbiAgICAgIGNvbnN0IHBhcmVudFZpZXcgPSBnZXRMVmlld1BhcmVudChjb21wb25lbnRWaWV3KTtcbiAgICAgIGxldCBjdXJyZW50UHJvamVjdGVkTm9kZTogVE5vZGV8bnVsbCA9XG4gICAgICAgICAgKGNvbXBvbmVudEhvc3QucHJvamVjdGlvbiBhcyhUTm9kZSB8IG51bGwpW10pW3ROb2RlLnByb2plY3Rpb24gYXMgbnVtYmVyXTtcblxuICAgICAgd2hpbGUgKGN1cnJlbnRQcm9qZWN0ZWROb2RlICE9PSBudWxsICYmIHBhcmVudFZpZXcgIT09IG51bGwpIHtcbiAgICAgICAgcmVzdWx0LnB1c2goZ2V0TmF0aXZlQnlUTm9kZShjdXJyZW50UHJvamVjdGVkTm9kZSwgcGFyZW50VmlldykpO1xuICAgICAgICBjdXJyZW50UHJvamVjdGVkTm9kZSA9IGN1cnJlbnRQcm9qZWN0ZWROb2RlLm5leHQ7XG4gICAgICB9XG4gICAgfVxuICAgIHROb2RlID0gdE5vZGUubmV4dDtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG4iXX0=