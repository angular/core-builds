/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/render3/view_ref.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { checkNoChangesInRootView, checkNoChangesInternal, detectChangesInRootView, detectChangesInternal, markViewDirty, storeCleanupFn } from './instructions/shared';
import { CONTAINER_HEADER_OFFSET } from './interfaces/container';
import { isLContainer } from './interfaces/type_checks';
import { CONTEXT, DECLARATION_COMPONENT_VIEW, FLAGS, HOST, TVIEW, T_HOST } from './interfaces/view';
import { assertNodeOfPossibleTypes } from './node_assert';
import { destroyLView, renderDetachView } from './node_manipulation';
import { getLViewParent } from './util/view_traversal_utils';
import { unwrapRNode } from './util/view_utils';
/**
 * @record
 */
export function viewEngine_ChangeDetectorRef_interface() { }
/**
 * @template T
 */
export class ViewRef {
    /**
     * @param {?} _lView
     * @param {?=} _cdRefInjectingView
     */
    constructor(_lView, _cdRefInjectingView) {
        this._lView = _lView;
        this._cdRefInjectingView = _cdRefInjectingView;
        this._appRef = null;
        this._viewContainerRef = null;
        /**
         * \@internal
         */
        this._tViewNode = null;
    }
    /**
     * @return {?}
     */
    get rootNodes() {
        if (this._lView[HOST] == null) {
            /** @type {?} */
            const tView = (/** @type {?} */ (this._lView[T_HOST]));
            return collectNativeNodes(this._lView, tView.child, []);
        }
        return [];
    }
    /**
     * @return {?}
     */
    get context() { return (/** @type {?} */ (this._lView[CONTEXT])); }
    /**
     * @return {?}
     */
    get destroyed() {
        return (this._lView[FLAGS] & 256 /* Destroyed */) === 256 /* Destroyed */;
    }
    /**
     * @return {?}
     */
    destroy() {
        if (this._appRef) {
            this._appRef.detachView(this);
        }
        else if (this._viewContainerRef) {
            /** @type {?} */
            const index = this._viewContainerRef.indexOf(this);
            if (index > -1) {
                this._viewContainerRef.detach(index);
            }
            this._viewContainerRef = null;
        }
        destroyLView(this._lView);
    }
    /**
     * @param {?} callback
     * @return {?}
     */
    onDestroy(callback) { storeCleanupFn(this._lView, callback); }
    /**
     * Marks a view and all of its ancestors dirty.
     *
     * It also triggers change detection by calling `scheduleTick` internally, which coalesces
     * multiple `markForCheck` calls to into one change detection run.
     *
     * This can be used to ensure an {\@link ChangeDetectionStrategy#OnPush OnPush} component is
     * checked when it needs to be re-rendered but the two normal triggers haven't marked it
     * dirty (i.e. inputs haven't changed and events haven't fired in the view).
     *
     * <!-- TODO: Add a link to a chapter on OnPush components -->
     *
     * \@usageNotes
     * ### Example
     *
     * ```typescript
     * \@Component({
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
     * @return {?}
     */
    markForCheck() { markViewDirty(this._cdRefInjectingView || this._lView); }
    /**
     * Detaches the view from the change detection tree.
     *
     * Detached views will not be checked during change detection runs until they are
     * re-attached, even if they are dirty. `detach` can be used in combination with
     * {\@link ChangeDetectorRef#detectChanges detectChanges} to implement local change
     * detection checks.
     *
     * <!-- TODO: Add a link to a chapter on detach/reattach/local digest -->
     * <!-- TODO: Add a live demo once ref.detectChanges is merged into master -->
     *
     * \@usageNotes
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
     * \@Component({
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
     *  /
     *   selector: 'app',
     *   providers: [DataProvider],
     *   template: `
     *     <giant-list><giant-list>
     *   `,
     * })
     * class App {
     * }
     * ```
     * @return {?}
     */
    detach() { this._lView[FLAGS] &= ~128 /* Attached */; }
    /**
     * Re-attaches a view to the change detection tree.
     *
     * This can be used to re-attach views that were previously detached from the tree
     * using {\@link ChangeDetectorRef#detach detach}. Views are attached to the tree by default.
     *
     * <!-- TODO: Add a link to a chapter on detach/reattach/local digest -->
     *
     * \@usageNotes
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
     * \@Component({
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
     *  /
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
     * @return {?}
     */
    reattach() { this._lView[FLAGS] |= 128 /* Attached */; }
    /**
     * Checks the view and its children.
     *
     * This can also be used in combination with {\@link ChangeDetectorRef#detach detach} to implement
     * local change detection checks.
     *
     * <!-- TODO: Add a link to a chapter on detach/reattach/local digest -->
     * <!-- TODO: Add a live demo once ref.detectChanges is merged into master -->
     *
     * \@usageNotes
     * ### Example
     *
     * The following example defines a component with a large list of readonly data.
     * Imagine, the data changes constantly, many times per second. For performance reasons,
     * we want to check and update the list every five seconds.
     *
     * We can do that by detaching the component's change detector and doing a local change detection
     * check every five seconds.
     *
     * See {\@link ChangeDetectorRef#detach detach} for more information.
     * @return {?}
     */
    detectChanges() { detectChangesInternal(this._lView, this.context); }
    /**
     * Checks the change detector and its children, and throws if any changes are detected.
     *
     * This is used in development mode to verify that running change detection doesn't
     * introduce other changes.
     * @return {?}
     */
    checkNoChanges() { checkNoChangesInternal(this._lView, this.context); }
    /**
     * @param {?} vcRef
     * @return {?}
     */
    attachToViewContainerRef(vcRef) {
        if (this._appRef) {
            throw new Error('This view is already attached directly to the ApplicationRef!');
        }
        this._viewContainerRef = vcRef;
    }
    /**
     * @return {?}
     */
    detachFromAppRef() {
        this._appRef = null;
        renderDetachView(this._lView);
    }
    /**
     * @param {?} appRef
     * @return {?}
     */
    attachToAppRef(appRef) {
        if (this._viewContainerRef) {
            throw new Error('This view is already attached to a ViewContainer!');
        }
        this._appRef = appRef;
    }
}
if (false) {
    /**
     * @type {?}
     * @private
     */
    ViewRef.prototype._appRef;
    /**
     * @type {?}
     * @private
     */
    ViewRef.prototype._viewContainerRef;
    /**
     * \@internal
     * @type {?}
     */
    ViewRef.prototype._tViewNode;
    /**
     * This represents `LView` associated with the component when ViewRef is a ChangeDetectorRef.
     *
     * When ViewRef is created for a dynamic component, this also represents the `LView` for the
     * component.
     *
     * For a "regular" ViewRef created for an embedded view, this is the `LView` for the embedded
     * view.
     *
     * \@internal
     * @type {?}
     */
    ViewRef.prototype._lView;
    /**
     * This represents the `LView` associated with the point where `ChangeDetectorRef` was
     * requested.
     *
     * This may be different from `_lView` if the `_cdRefInjectingView` is an embedded view.
     * @type {?}
     * @private
     */
    ViewRef.prototype._cdRefInjectingView;
}
/**
 * \@internal
 * @template T
 */
export class RootViewRef extends ViewRef {
    /**
     * @param {?} _view
     */
    constructor(_view) {
        super(_view);
        this._view = _view;
    }
    /**
     * @return {?}
     */
    detectChanges() { detectChangesInRootView(this._view); }
    /**
     * @return {?}
     */
    checkNoChanges() { checkNoChangesInRootView(this._view); }
    /**
     * @return {?}
     */
    get context() { return (/** @type {?} */ (null)); }
}
if (false) {
    /** @type {?} */
    RootViewRef.prototype._view;
}
/**
 * @param {?} lView
 * @param {?} tNode
 * @param {?} result
 * @param {?=} isProjection
 * @return {?}
 */
function collectNativeNodes(lView, tNode, result, isProjection = false) {
    while (tNode !== null) {
        ngDevMode && assertNodeOfPossibleTypes(tNode, 3 /* Element */, 0 /* Container */, 1 /* Projection */, 4 /* ElementContainer */, 5 /* IcuContainer */);
        /** @type {?} */
        const lNode = lView[tNode.index];
        if (lNode !== null) {
            result.push(unwrapRNode(lNode));
        }
        // A given lNode can represent either a native node or a LContainer (when it is a host of a
        // ViewContainerRef). When we find a LContainer we need to descend into it to collect root nodes
        // from the views in this container.
        if (isLContainer(lNode)) {
            for (let i = CONTAINER_HEADER_OFFSET; i < lNode.length; i++) {
                /** @type {?} */
                const lViewInAContainer = lNode[i];
                /** @type {?} */
                const lViewFirstChildTNode = lViewInAContainer[TVIEW].firstChild;
                if (lViewFirstChildTNode !== null) {
                    collectNativeNodes(lViewInAContainer, lViewFirstChildTNode, result);
                }
            }
        }
        /** @type {?} */
        const tNodeType = tNode.type;
        if (tNodeType === 4 /* ElementContainer */ || tNodeType === 5 /* IcuContainer */) {
            collectNativeNodes(lView, tNode.child, result);
        }
        else if (tNodeType === 1 /* Projection */) {
            /** @type {?} */
            const componentView = lView[DECLARATION_COMPONENT_VIEW];
            /** @type {?} */
            const componentHost = (/** @type {?} */ (componentView[T_HOST]));
            /** @type {?} */
            const parentView = getLViewParent(componentView);
            /** @type {?} */
            let firstProjectedNode = ((/** @type {?} */ (componentHost.projection)))[(/** @type {?} */ (tNode.projection))];
            if (firstProjectedNode !== null && parentView !== null) {
                collectNativeNodes(parentView, firstProjectedNode, result, true);
            }
        }
        tNode = isProjection ? tNode.projectionNext : tNode.next;
    }
    return result;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld19yZWYuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3ZpZXdfcmVmLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQWFBLE9BQU8sRUFBQyx3QkFBd0IsRUFBRSxzQkFBc0IsRUFBRSx1QkFBdUIsRUFBRSxxQkFBcUIsRUFBRSxhQUFhLEVBQUUsY0FBYyxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDdEssT0FBTyxFQUFDLHVCQUF1QixFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFFL0QsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBQ3RELE9BQU8sRUFBQyxPQUFPLEVBQUUsMEJBQTBCLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBcUIsS0FBSyxFQUFFLE1BQU0sRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ3JILE9BQU8sRUFBQyx5QkFBeUIsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUN4RCxPQUFPLEVBQUMsWUFBWSxFQUFFLGdCQUFnQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDbkUsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLDZCQUE2QixDQUFDO0FBQzNELE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQzs7OztBQU85Qyw0REFBK0Y7Ozs7QUFFL0YsTUFBTSxPQUFPLE9BQU87Ozs7O0lBa0JsQixZQVlXLE1BQWEsRUFRWixtQkFBMkI7UUFSNUIsV0FBTSxHQUFOLE1BQU0sQ0FBTztRQVFaLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBUTtRQXBDL0IsWUFBTyxHQUF3QixJQUFJLENBQUM7UUFDcEMsc0JBQWlCLEdBQXFDLElBQUksQ0FBQzs7OztRQUs1RCxlQUFVLEdBQW1CLElBQUksQ0FBQztJQThCQyxDQUFDOzs7O0lBNUIzQyxJQUFJLFNBQVM7UUFDWCxJQUFJLElBQUksQ0FBQyxNQUFNLENB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c2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtBcHBsaWNhdGlvblJlZn0gZnJvbSAnLi4vYXBwbGljYXRpb25fcmVmJztcbmltcG9ydCB7Q2hhbmdlRGV0ZWN0b3JSZWYgYXMgdmlld0VuZ2luZV9DaGFuZ2VEZXRlY3RvclJlZn0gZnJvbSAnLi4vY2hhbmdlX2RldGVjdGlvbi9jaGFuZ2VfZGV0ZWN0b3JfcmVmJztcbmltcG9ydCB7Vmlld0NvbnRhaW5lclJlZiBhcyB2aWV3RW5naW5lX1ZpZXdDb250YWluZXJSZWZ9IGZyb20gJy4uL2xpbmtlci92aWV3X2NvbnRhaW5lcl9yZWYnO1xuaW1wb3J0IHtFbWJlZGRlZFZpZXdSZWYgYXMgdmlld0VuZ2luZV9FbWJlZGRlZFZpZXdSZWYsIEludGVybmFsVmlld1JlZiBhcyB2aWV3RW5naW5lX0ludGVybmFsVmlld1JlZn0gZnJvbSAnLi4vbGlua2VyL3ZpZXdfcmVmJztcblxuaW1wb3J0IHtjaGVja05vQ2hhbmdlc0luUm9vdFZpZXcsIGNoZWNrTm9DaGFuZ2VzSW50ZXJuYWwsIGRldGVjdENoYW5nZXNJblJvb3RWaWV3LCBkZXRlY3RDaGFuZ2VzSW50ZXJuYWwsIG1hcmtWaWV3RGlydHksIHN0b3JlQ2xlYW51cEZufSBmcm9tICcuL2luc3RydWN0aW9ucy9zaGFyZWQnO1xuaW1wb3J0IHtDT05UQUlORVJfSEVBREVSX09GRlNFVH0gZnJvbSAnLi9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge1RFbGVtZW50Tm9kZSwgVE5vZGUsIFROb2RlVHlwZSwgVFZpZXdOb2RlfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge2lzTENvbnRhaW5lcn0gZnJvbSAnLi9pbnRlcmZhY2VzL3R5cGVfY2hlY2tzJztcbmltcG9ydCB7Q09OVEVYVCwgREVDTEFSQVRJT05fQ09NUE9ORU5UX1ZJRVcsIEZMQUdTLCBIT1NULCBMVmlldywgTFZpZXdGbGFncywgVFZJRVcsIFRfSE9TVH0gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHthc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzfSBmcm9tICcuL25vZGVfYXNzZXJ0JztcbmltcG9ydCB7ZGVzdHJveUxWaWV3LCByZW5kZXJEZXRhY2hWaWV3fSBmcm9tICcuL25vZGVfbWFuaXB1bGF0aW9uJztcbmltcG9ydCB7Z2V0TFZpZXdQYXJlbnR9IGZyb20gJy4vdXRpbC92aWV3X3RyYXZlcnNhbF91dGlscyc7XG5pbXBvcnQge3Vud3JhcFJOb2RlfSBmcm9tICcuL3V0aWwvdmlld191dGlscyc7XG5cblxuXG4vLyBOZWVkZWQgZHVlIHRvIHRzaWNrbGUgZG93bmxldmVsaW5nIHdoZXJlIG11bHRpcGxlIGBpbXBsZW1lbnRzYCB3aXRoIGNsYXNzZXMgY3JlYXRlc1xuLy8gbXVsdGlwbGUgQGV4dGVuZHMgaW4gQ2xvc3VyZSBhbm5vdGF0aW9ucywgd2hpY2ggaXMgaWxsZWdhbC4gVGhpcyB3b3JrYXJvdW5kIGZpeGVzXG4vLyB0aGUgbXVsdGlwbGUgQGV4dGVuZHMgYnkgbWFraW5nIHRoZSBhbm5vdGF0aW9uIEBpbXBsZW1lbnRzIGluc3RlYWRcbmV4cG9ydCBpbnRlcmZhY2Ugdmlld0VuZ2luZV9DaGFuZ2VEZXRlY3RvclJlZl9pbnRlcmZhY2UgZXh0ZW5kcyB2aWV3RW5naW5lX0NoYW5nZURldGVjdG9yUmVmIHt9XG5cbmV4cG9ydCBjbGFzcyBWaWV3UmVmPFQ+IGltcGxlbWVudHMgdmlld0VuZ2luZV9FbWJlZGRlZFZpZXdSZWY8VD4sIHZpZXdFbmdpbmVfSW50ZXJuYWxWaWV3UmVmLFxuICAgIHZpZXdFbmdpbmVfQ2hhbmdlRGV0ZWN0b3JSZWZfaW50ZXJmYWNlIHtcbiAgcHJpdmF0ZSBfYXBwUmVmOiBBcHBsaWNhdGlvblJlZnxudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBfdmlld0NvbnRhaW5lclJlZjogdmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmfG51bGwgPSBudWxsO1xuXG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHB1YmxpYyBfdFZpZXdOb2RlOiBUVmlld05vZGV8bnVsbCA9IG51bGw7XG5cbiAgZ2V0IHJvb3ROb2RlcygpOiBhbnlbXSB7XG4gICAgaWYgKHRoaXMuX2xWaWV3W0hPU1RdID09IG51bGwpIHtcbiAgICAgIGNvbnN0IHRWaWV3ID0gdGhpcy5fbFZpZXdbVF9IT1NUXSBhcyBUVmlld05vZGU7XG4gICAgICByZXR1cm4gY29sbGVjdE5hdGl2ZU5vZGVzKHRoaXMuX2xWaWV3LCB0Vmlldy5jaGlsZCwgW10pO1xuICAgIH1cbiAgICByZXR1cm4gW107XG4gIH1cblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIC8qKlxuICAgICAgICogVGhpcyByZXByZXNlbnRzIGBMVmlld2AgYXNzb2NpYXRlZCB3aXRoIHRoZSBjb21wb25lbnQgd2hlbiBWaWV3UmVmIGlzIGEgQ2hhbmdlRGV0ZWN0b3JSZWYuXG4gICAgICAgKlxuICAgICAgICogV2hlbiBWaWV3UmVmIGlzIGNyZWF0ZWQgZm9yIGEgZHluYW1pYyBjb21wb25lbnQsIHRoaXMgYWxzbyByZXByZXNlbnRzIHRoZSBgTFZpZXdgIGZvciB0aGVcbiAgICAgICAqIGNvbXBvbmVudC5cbiAgICAgICAqXG4gICAgICAgKiBGb3IgYSBcInJlZ3VsYXJcIiBWaWV3UmVmIGNyZWF0ZWQgZm9yIGFuIGVtYmVkZGVkIHZpZXcsIHRoaXMgaXMgdGhlIGBMVmlld2AgZm9yIHRoZSBlbWJlZGRlZFxuICAgICAgICogdmlldy5cbiAgICAgICAqXG4gICAgICAgKiBAaW50ZXJuYWxcbiAgICAgICAqL1xuICAgICAgcHVibGljIF9sVmlldzogTFZpZXcsXG5cbiAgICAgIC8qKlxuICAgICAgICogVGhpcyByZXByZXNlbnRzIHRoZSBgTFZpZXdgIGFzc29jaWF0ZWQgd2l0aCB0aGUgcG9pbnQgd2hlcmUgYENoYW5nZURldGVjdG9yUmVmYCB3YXNcbiAgICAgICAqIHJlcXVlc3RlZC5cbiAgICAgICAqXG4gICAgICAgKiBUaGlzIG1heSBiZSBkaWZmZXJlbnQgZnJvbSBgX2xWaWV3YCBpZiB0aGUgYF9jZFJlZkluamVjdGluZ1ZpZXdgIGlzIGFuIGVtYmVkZGVkIHZpZXcuXG4gICAgICAgKi9cbiAgICAgIHByaXZhdGUgX2NkUmVmSW5qZWN0aW5nVmlldz86IExWaWV3KSB7fVxuXG4gIGdldCBjb250ZXh0KCk6IFQgeyByZXR1cm4gdGhpcy5fbFZpZXdbQ09OVEVYVF0gYXMgVDsgfVxuXG4gIGdldCBkZXN0cm95ZWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuICh0aGlzLl9sVmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkRlc3Ryb3llZCkgPT09IExWaWV3RmxhZ3MuRGVzdHJveWVkO1xuICB9XG5cbiAgZGVzdHJveSgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fYXBwUmVmKSB7XG4gICAgICB0aGlzLl9hcHBSZWYuZGV0YWNoVmlldyh0aGlzKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuX3ZpZXdDb250YWluZXJSZWYpIHtcbiAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5fdmlld0NvbnRhaW5lclJlZi5pbmRleE9mKHRoaXMpO1xuXG4gICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICB0aGlzLl92aWV3Q29udGFpbmVyUmVmLmRldGFjaChpbmRleCk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX3ZpZXdDb250YWluZXJSZWYgPSBudWxsO1xuICAgIH1cbiAgICBkZXN0cm95TFZpZXcodGhpcy5fbFZpZXcpO1xuICB9XG5cbiAgb25EZXN0cm95KGNhbGxiYWNrOiBGdW5jdGlvbikgeyBzdG9yZUNsZWFudXBGbih0aGlzLl9sVmlldywgY2FsbGJhY2spOyB9XG5cbiAgLyoqXG4gICAqIE1hcmtzIGEgdmlldyBhbmQgYWxsIG9mIGl0cyBhbmNlc3RvcnMgZGlydHkuXG4gICAqXG4gICAqIEl0IGFsc28gdHJpZ2dlcnMgY2hhbmdlIGRldGVjdGlvbiBieSBjYWxsaW5nIGBzY2hlZHVsZVRpY2tgIGludGVybmFsbHksIHdoaWNoIGNvYWxlc2Nlc1xuICAgKiBtdWx0aXBsZSBgbWFya0ZvckNoZWNrYCBjYWxscyB0byBpbnRvIG9uZSBjaGFuZ2UgZGV0ZWN0aW9uIHJ1bi5cbiAgICpcbiAgICogVGhpcyBjYW4gYmUgdXNlZCB0byBlbnN1cmUgYW4ge0BsaW5rIENoYW5nZURldGVjdGlvblN0cmF0ZWd5I09uUHVzaCBPblB1c2h9IGNvbXBvbmVudCBpc1xuICAgKiBjaGVja2VkIHdoZW4gaXQgbmVlZHMgdG8gYmUgcmUtcmVuZGVyZWQgYnV0IHRoZSB0d28gbm9ybWFsIHRyaWdnZXJzIGhhdmVuJ3QgbWFya2VkIGl0XG4gICAqIGRpcnR5IChpLmUuIGlucHV0cyBoYXZlbid0IGNoYW5nZWQgYW5kIGV2ZW50cyBoYXZlbid0IGZpcmVkIGluIHRoZSB2aWV3KS5cbiAgICpcbiAgICogPCEtLSBUT0RPOiBBZGQgYSBsaW5rIHRvIGEgY2hhcHRlciBvbiBPblB1c2ggY29tcG9uZW50cyAtLT5cbiAgICpcbiAgICogQHVzYWdlTm90ZXNcbiAgICogIyMjIEV4YW1wbGVcbiAgICpcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBAQ29tcG9uZW50KHtcbiAgICogICBzZWxlY3RvcjogJ215LWFwcCcsXG4gICAqICAgdGVtcGxhdGU6IGBOdW1iZXIgb2YgdGlja3M6IHt7bnVtYmVyT2ZUaWNrc319YFxuICAgKiAgIGNoYW5nZURldGVjdGlvbjogQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuT25QdXNoLFxuICAgKiB9KVxuICAgKiBjbGFzcyBBcHBDb21wb25lbnQge1xuICAgKiAgIG51bWJlck9mVGlja3MgPSAwO1xuICAgKlxuICAgKiAgIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVmOiBDaGFuZ2VEZXRlY3RvclJlZikge1xuICAgKiAgICAgc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgKiAgICAgICB0aGlzLm51bWJlck9mVGlja3MrKztcbiAgICogICAgICAgLy8gdGhlIGZvbGxvd2luZyBpcyByZXF1aXJlZCwgb3RoZXJ3aXNlIHRoZSB2aWV3IHdpbGwgbm90IGJlIHVwZGF0ZWRcbiAgICogICAgICAgdGhpcy5yZWYubWFya0ZvckNoZWNrKCk7XG4gICAqICAgICB9LCAxMDAwKTtcbiAgICogICB9XG4gICAqIH1cbiAgICogYGBgXG4gICAqL1xuICBtYXJrRm9yQ2hlY2soKTogdm9pZCB7IG1hcmtWaWV3RGlydHkodGhpcy5fY2RSZWZJbmplY3RpbmdWaWV3IHx8IHRoaXMuX2xWaWV3KTsgfVxuXG4gIC8qKlxuICAgKiBEZXRhY2hlcyB0aGUgdmlldyBmcm9tIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHRyZWUuXG4gICAqXG4gICAqIERldGFjaGVkIHZpZXdzIHdpbGwgbm90IGJlIGNoZWNrZWQgZHVyaW5nIGNoYW5nZSBkZXRlY3Rpb24gcnVucyB1bnRpbCB0aGV5IGFyZVxuICAgKiByZS1hdHRhY2hlZCwgZXZlbiBpZiB0aGV5IGFyZSBkaXJ0eS4gYGRldGFjaGAgY2FuIGJlIHVzZWQgaW4gY29tYmluYXRpb24gd2l0aFxuICAgKiB7QGxpbmsgQ2hhbmdlRGV0ZWN0b3JSZWYjZGV0ZWN0Q2hhbmdlcyBkZXRlY3RDaGFuZ2VzfSB0byBpbXBsZW1lbnQgbG9jYWwgY2hhbmdlXG4gICAqIGRldGVjdGlvbiBjaGVja3MuXG4gICAqXG4gICAqIDwhLS0gVE9ETzogQWRkIGEgbGluayB0byBhIGNoYXB0ZXIgb24gZGV0YWNoL3JlYXR0YWNoL2xvY2FsIGRpZ2VzdCAtLT5cbiAgICogPCEtLSBUT0RPOiBBZGQgYSBsaXZlIGRlbW8gb25jZSByZWYuZGV0ZWN0Q2hhbmdlcyBpcyBtZXJnZWQgaW50byBtYXN0ZXIgLS0+XG4gICAqXG4gICAqIEB1c2FnZU5vdGVzXG4gICAqICMjIyBFeGFtcGxlXG4gICAqXG4gICAqIFRoZSBmb2xsb3dpbmcgZXhhbXBsZSBkZWZpbmVzIGEgY29tcG9uZW50IHdpdGggYSBsYXJnZSBsaXN0IG9mIHJlYWRvbmx5IGRhdGEuXG4gICAqIEltYWdpbmUgdGhlIGRhdGEgY2hhbmdlcyBjb25zdGFudGx5LCBtYW55IHRpbWVzIHBlciBzZWNvbmQuIEZvciBwZXJmb3JtYW5jZSByZWFzb25zLFxuICAgKiB3ZSB3YW50IHRvIGNoZWNrIGFuZCB1cGRhdGUgdGhlIGxpc3QgZXZlcnkgZml2ZSBzZWNvbmRzLiBXZSBjYW4gZG8gdGhhdCBieSBkZXRhY2hpbmdcbiAgICogdGhlIGNvbXBvbmVudCdzIGNoYW5nZSBkZXRlY3RvciBhbmQgZG9pbmcgYSBsb2NhbCBjaGVjayBldmVyeSBmaXZlIHNlY29uZHMuXG4gICAqXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogY2xhc3MgRGF0YVByb3ZpZGVyIHtcbiAgICogICAvLyBpbiBhIHJlYWwgYXBwbGljYXRpb24gdGhlIHJldHVybmVkIGRhdGEgd2lsbCBiZSBkaWZmZXJlbnQgZXZlcnkgdGltZVxuICAgKiAgIGdldCBkYXRhKCkge1xuICAgKiAgICAgcmV0dXJuIFsxLDIsMyw0LDVdO1xuICAgKiAgIH1cbiAgICogfVxuICAgKlxuICAgKiBAQ29tcG9uZW50KHtcbiAgICogICBzZWxlY3RvcjogJ2dpYW50LWxpc3QnLFxuICAgKiAgIHRlbXBsYXRlOiBgXG4gICAqICAgICA8bGkgKm5nRm9yPVwibGV0IGQgb2YgZGF0YVByb3ZpZGVyLmRhdGFcIj5EYXRhIHt7ZH19PC9saT5cbiAgICogICBgLFxuICAgKiB9KVxuICAgKiBjbGFzcyBHaWFudExpc3Qge1xuICAgKiAgIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVmOiBDaGFuZ2VEZXRlY3RvclJlZiwgcHJpdmF0ZSBkYXRhUHJvdmlkZXI6IERhdGFQcm92aWRlcikge1xuICAgKiAgICAgcmVmLmRldGFjaCgpO1xuICAgKiAgICAgc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgKiAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAqICAgICB9LCA1MDAwKTtcbiAgICogICB9XG4gICAqIH1cbiAgICpcbiAgICogQENvbXBvbmVudCh7XG4gICAqICAgc2VsZWN0b3I6ICdhcHAnLFxuICAgKiAgIHByb3ZpZGVyczogW0RhdGFQcm92aWRlcl0sXG4gICAqICAgdGVtcGxhdGU6IGBcbiAgICogICAgIDxnaWFudC1saXN0PjxnaWFudC1saXN0PlxuICAgKiAgIGAsXG4gICAqIH0pXG4gICAqIGNsYXNzIEFwcCB7XG4gICAqIH1cbiAgICogYGBgXG4gICAqL1xuICBkZXRhY2goKTogdm9pZCB7IHRoaXMuX2xWaWV3W0ZMQUdTXSAmPSB+TFZpZXdGbGFncy5BdHRhY2hlZDsgfVxuXG4gIC8qKlxuICAgKiBSZS1hdHRhY2hlcyBhIHZpZXcgdG8gdGhlIGNoYW5nZSBkZXRlY3Rpb24gdHJlZS5cbiAgICpcbiAgICogVGhpcyBjYW4gYmUgdXNlZCB0byByZS1hdHRhY2ggdmlld3MgdGhhdCB3ZXJlIHByZXZpb3VzbHkgZGV0YWNoZWQgZnJvbSB0aGUgdHJlZVxuICAgKiB1c2luZyB7QGxpbmsgQ2hhbmdlRGV0ZWN0b3JSZWYjZGV0YWNoIGRldGFjaH0uIFZpZXdzIGFyZSBhdHRhY2hlZCB0byB0aGUgdHJlZSBieSBkZWZhdWx0LlxuICAgKlxuICAgKiA8IS0tIFRPRE86IEFkZCBhIGxpbmsgdG8gYSBjaGFwdGVyIG9uIGRldGFjaC9yZWF0dGFjaC9sb2NhbCBkaWdlc3QgLS0+XG4gICAqXG4gICAqIEB1c2FnZU5vdGVzXG4gICAqICMjIyBFeGFtcGxlXG4gICAqXG4gICAqIFRoZSBmb2xsb3dpbmcgZXhhbXBsZSBjcmVhdGVzIGEgY29tcG9uZW50IGRpc3BsYXlpbmcgYGxpdmVgIGRhdGEuIFRoZSBjb21wb25lbnQgd2lsbCBkZXRhY2hcbiAgICogaXRzIGNoYW5nZSBkZXRlY3RvciBmcm9tIHRoZSBtYWluIGNoYW5nZSBkZXRlY3RvciB0cmVlIHdoZW4gdGhlIGNvbXBvbmVudCdzIGxpdmUgcHJvcGVydHlcbiAgICogaXMgc2V0IHRvIGZhbHNlLlxuICAgKlxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIGNsYXNzIERhdGFQcm92aWRlciB7XG4gICAqICAgZGF0YSA9IDE7XG4gICAqXG4gICAqICAgY29uc3RydWN0b3IoKSB7XG4gICAqICAgICBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAqICAgICAgIHRoaXMuZGF0YSA9IHRoaXMuZGF0YSAqIDI7XG4gICAqICAgICB9LCA1MDApO1xuICAgKiAgIH1cbiAgICogfVxuICAgKlxuICAgKiBAQ29tcG9uZW50KHtcbiAgICogICBzZWxlY3RvcjogJ2xpdmUtZGF0YScsXG4gICAqICAgaW5wdXRzOiBbJ2xpdmUnXSxcbiAgICogICB0ZW1wbGF0ZTogJ0RhdGE6IHt7ZGF0YVByb3ZpZGVyLmRhdGF9fSdcbiAgICogfSlcbiAgICogY2xhc3MgTGl2ZURhdGEge1xuICAgKiAgIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVmOiBDaGFuZ2VEZXRlY3RvclJlZiwgcHJpdmF0ZSBkYXRhUHJvdmlkZXI6IERhdGFQcm92aWRlcikge31cbiAgICpcbiAgICogICBzZXQgbGl2ZSh2YWx1ZSkge1xuICAgKiAgICAgaWYgKHZhbHVlKSB7XG4gICAqICAgICAgIHRoaXMucmVmLnJlYXR0YWNoKCk7XG4gICAqICAgICB9IGVsc2Uge1xuICAgKiAgICAgICB0aGlzLnJlZi5kZXRhY2goKTtcbiAgICogICAgIH1cbiAgICogICB9XG4gICAqIH1cbiAgICpcbiAgICogQENvbXBvbmVudCh7XG4gICAqICAgc2VsZWN0b3I6ICdteS1hcHAnLFxuICAgKiAgIHByb3ZpZGVyczogW0RhdGFQcm92aWRlcl0sXG4gICAqICAgdGVtcGxhdGU6IGBcbiAgICogICAgIExpdmUgVXBkYXRlOiA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgWyhuZ01vZGVsKV09XCJsaXZlXCI+XG4gICAqICAgICA8bGl2ZS1kYXRhIFtsaXZlXT1cImxpdmVcIj48bGl2ZS1kYXRhPlxuICAgKiAgIGAsXG4gICAqIH0pXG4gICAqIGNsYXNzIEFwcENvbXBvbmVudCB7XG4gICAqICAgbGl2ZSA9IHRydWU7XG4gICAqIH1cbiAgICogYGBgXG4gICAqL1xuICByZWF0dGFjaCgpOiB2b2lkIHsgdGhpcy5fbFZpZXdbRkxBR1NdIHw9IExWaWV3RmxhZ3MuQXR0YWNoZWQ7IH1cblxuICAvKipcbiAgICogQ2hlY2tzIHRoZSB2aWV3IGFuZCBpdHMgY2hpbGRyZW4uXG4gICAqXG4gICAqIFRoaXMgY2FuIGFsc28gYmUgdXNlZCBpbiBjb21iaW5hdGlvbiB3aXRoIHtAbGluayBDaGFuZ2VEZXRlY3RvclJlZiNkZXRhY2ggZGV0YWNofSB0byBpbXBsZW1lbnRcbiAgICogbG9jYWwgY2hhbmdlIGRldGVjdGlvbiBjaGVja3MuXG4gICAqXG4gICAqIDwhLS0gVE9ETzogQWRkIGEgbGluayB0byBhIGNoYXB0ZXIgb24gZGV0YWNoL3JlYXR0YWNoL2xvY2FsIGRpZ2VzdCAtLT5cbiAgICogPCEtLSBUT0RPOiBBZGQgYSBsaXZlIGRlbW8gb25jZSByZWYuZGV0ZWN0Q2hhbmdlcyBpcyBtZXJnZWQgaW50byBtYXN0ZXIgLS0+XG4gICAqXG4gICAqIEB1c2FnZU5vdGVzXG4gICAqICMjIyBFeGFtcGxlXG4gICAqXG4gICAqIFRoZSBmb2xsb3dpbmcgZXhhbXBsZSBkZWZpbmVzIGEgY29tcG9uZW50IHdpdGggYSBsYXJnZSBsaXN0IG9mIHJlYWRvbmx5IGRhdGEuXG4gICAqIEltYWdpbmUsIHRoZSBkYXRhIGNoYW5nZXMgY29uc3RhbnRseSwgbWFueSB0aW1lcyBwZXIgc2Vjb25kLiBGb3IgcGVyZm9ybWFuY2UgcmVhc29ucyxcbiAgICogd2Ugd2FudCB0byBjaGVjayBhbmQgdXBkYXRlIHRoZSBsaXN0IGV2ZXJ5IGZpdmUgc2Vjb25kcy5cbiAgICpcbiAgICogV2UgY2FuIGRvIHRoYXQgYnkgZGV0YWNoaW5nIHRoZSBjb21wb25lbnQncyBjaGFuZ2UgZGV0ZWN0b3IgYW5kIGRvaW5nIGEgbG9jYWwgY2hhbmdlIGRldGVjdGlvblxuICAgKiBjaGVjayBldmVyeSBmaXZlIHNlY29uZHMuXG4gICAqXG4gICAqIFNlZSB7QGxpbmsgQ2hhbmdlRGV0ZWN0b3JSZWYjZGV0YWNoIGRldGFjaH0gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAqL1xuICBkZXRlY3RDaGFuZ2VzKCk6IHZvaWQgeyBkZXRlY3RDaGFuZ2VzSW50ZXJuYWwodGhpcy5fbFZpZXcsIHRoaXMuY29udGV4dCk7IH1cblxuICAvKipcbiAgICogQ2hlY2tzIHRoZSBjaGFuZ2UgZGV0ZWN0b3IgYW5kIGl0cyBjaGlsZHJlbiwgYW5kIHRocm93cyBpZiBhbnkgY2hhbmdlcyBhcmUgZGV0ZWN0ZWQuXG4gICAqXG4gICAqIFRoaXMgaXMgdXNlZCBpbiBkZXZlbG9wbWVudCBtb2RlIHRvIHZlcmlmeSB0aGF0IHJ1bm5pbmcgY2hhbmdlIGRldGVjdGlvbiBkb2Vzbid0XG4gICAqIGludHJvZHVjZSBvdGhlciBjaGFuZ2VzLlxuICAgKi9cbiAgY2hlY2tOb0NoYW5nZXMoKTogdm9pZCB7IGNoZWNrTm9DaGFuZ2VzSW50ZXJuYWwodGhpcy5fbFZpZXcsIHRoaXMuY29udGV4dCk7IH1cblxuICBhdHRhY2hUb1ZpZXdDb250YWluZXJSZWYodmNSZWY6IHZpZXdFbmdpbmVfVmlld0NvbnRhaW5lclJlZikge1xuICAgIGlmICh0aGlzLl9hcHBSZWYpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVGhpcyB2aWV3IGlzIGFscmVhZHkgYXR0YWNoZWQgZGlyZWN0bHkgdG8gdGhlIEFwcGxpY2F0aW9uUmVmIScpO1xuICAgIH1cbiAgICB0aGlzLl92aWV3Q29udGFpbmVyUmVmID0gdmNSZWY7XG4gIH1cblxuICBkZXRhY2hGcm9tQXBwUmVmKCkge1xuICAgIHRoaXMuX2FwcFJlZiA9IG51bGw7XG4gICAgcmVuZGVyRGV0YWNoVmlldyh0aGlzLl9sVmlldyk7XG4gIH1cblxuICBhdHRhY2hUb0FwcFJlZihhcHBSZWY6IEFwcGxpY2F0aW9uUmVmKSB7XG4gICAgaWYgKHRoaXMuX3ZpZXdDb250YWluZXJSZWYpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVGhpcyB2aWV3IGlzIGFscmVhZHkgYXR0YWNoZWQgdG8gYSBWaWV3Q29udGFpbmVyIScpO1xuICAgIH1cbiAgICB0aGlzLl9hcHBSZWYgPSBhcHBSZWY7XG4gIH1cbn1cblxuLyoqIEBpbnRlcm5hbCAqL1xuZXhwb3J0IGNsYXNzIFJvb3RWaWV3UmVmPFQ+IGV4dGVuZHMgVmlld1JlZjxUPiB7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBfdmlldzogTFZpZXcpIHsgc3VwZXIoX3ZpZXcpOyB9XG5cbiAgZGV0ZWN0Q2hhbmdlcygpOiB2b2lkIHsgZGV0ZWN0Q2hhbmdlc0luUm9vdFZpZXcodGhpcy5fdmlldyk7IH1cblxuICBjaGVja05vQ2hhbmdlcygpOiB2b2lkIHsgY2hlY2tOb0NoYW5nZXNJblJvb3RWaWV3KHRoaXMuX3ZpZXcpOyB9XG5cbiAgZ2V0IGNvbnRleHQoKTogVCB7IHJldHVybiBudWxsICE7IH1cbn1cblxuZnVuY3Rpb24gY29sbGVjdE5hdGl2ZU5vZGVzKFxuICAgIGxWaWV3OiBMVmlldywgdE5vZGU6IFROb2RlIHwgbnVsbCwgcmVzdWx0OiBhbnlbXSwgaXNQcm9qZWN0aW9uOiBib29sZWFuID0gZmFsc2UpOiBhbnlbXSB7XG4gIHdoaWxlICh0Tm9kZSAhPT0gbnVsbCkge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzKFxuICAgICAgICAgICAgICAgICAgICAgdE5vZGUsIFROb2RlVHlwZS5FbGVtZW50LCBUTm9kZVR5cGUuQ29udGFpbmVyLCBUTm9kZVR5cGUuUHJvamVjdGlvbixcbiAgICAgICAgICAgICAgICAgICAgIFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyLCBUTm9kZVR5cGUuSWN1Q29udGFpbmVyKTtcblxuICAgIGNvbnN0IGxOb2RlID0gbFZpZXdbdE5vZGUuaW5kZXhdO1xuICAgIGlmIChsTm9kZSAhPT0gbnVsbCkge1xuICAgICAgcmVzdWx0LnB1c2godW53cmFwUk5vZGUobE5vZGUpKTtcbiAgICB9XG5cbiAgICAvLyBBIGdpdmVuIGxOb2RlIGNhbiByZXByZXNlbnQgZWl0aGVyIGEgbmF0aXZlIG5vZGUgb3IgYSBMQ29udGFpbmVyICh3aGVuIGl0IGlzIGEgaG9zdCBvZiBhXG4gICAgLy8gVmlld0NvbnRhaW5lclJlZikuIFdoZW4gd2UgZmluZCBhIExDb250YWluZXIgd2UgbmVlZCB0byBkZXNjZW5kIGludG8gaXQgdG8gY29sbGVjdCByb290IG5vZGVzXG4gICAgLy8gZnJvbSB0aGUgdmlld3MgaW4gdGhpcyBjb250YWluZXIuXG4gICAgaWYgKGlzTENvbnRhaW5lcihsTm9kZSkpIHtcbiAgICAgIGZvciAobGV0IGkgPSBDT05UQUlORVJfSEVBREVSX09GRlNFVDsgaSA8IGxOb2RlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGxWaWV3SW5BQ29udGFpbmVyID0gbE5vZGVbaV07XG4gICAgICAgIGNvbnN0IGxWaWV3Rmlyc3RDaGlsZFROb2RlID0gbFZpZXdJbkFDb250YWluZXJbVFZJRVddLmZpcnN0Q2hpbGQ7XG4gICAgICAgIGlmIChsVmlld0ZpcnN0Q2hpbGRUTm9kZSAhPT0gbnVsbCkge1xuICAgICAgICAgIGNvbGxlY3ROYXRpdmVOb2RlcyhsVmlld0luQUNvbnRhaW5lciwgbFZpZXdGaXJzdENoaWxkVE5vZGUsIHJlc3VsdCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCB0Tm9kZVR5cGUgPSB0Tm9kZS50eXBlO1xuICAgIGlmICh0Tm9kZVR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyIHx8IHROb2RlVHlwZSA9PT0gVE5vZGVUeXBlLkljdUNvbnRhaW5lcikge1xuICAgICAgY29sbGVjdE5hdGl2ZU5vZGVzKGxWaWV3LCB0Tm9kZS5jaGlsZCwgcmVzdWx0KTtcbiAgICB9IGVsc2UgaWYgKHROb2RlVHlwZSA9PT0gVE5vZGVUeXBlLlByb2plY3Rpb24pIHtcbiAgICAgIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBsVmlld1tERUNMQVJBVElPTl9DT01QT05FTlRfVklFV107XG4gICAgICBjb25zdCBjb21wb25lbnRIb3N0ID0gY29tcG9uZW50Vmlld1tUX0hPU1RdIGFzIFRFbGVtZW50Tm9kZTtcbiAgICAgIGNvbnN0IHBhcmVudFZpZXcgPSBnZXRMVmlld1BhcmVudChjb21wb25lbnRWaWV3KTtcbiAgICAgIGxldCBmaXJzdFByb2plY3RlZE5vZGU6IFROb2RlfG51bGwgPVxuICAgICAgICAgIChjb21wb25lbnRIb3N0LnByb2plY3Rpb24gYXMoVE5vZGUgfCBudWxsKVtdKVt0Tm9kZS5wcm9qZWN0aW9uIGFzIG51bWJlcl07XG4gICAgICBpZiAoZmlyc3RQcm9qZWN0ZWROb2RlICE9PSBudWxsICYmIHBhcmVudFZpZXcgIT09IG51bGwpIHtcbiAgICAgICAgY29sbGVjdE5hdGl2ZU5vZGVzKHBhcmVudFZpZXcsIGZpcnN0UHJvamVjdGVkTm9kZSwgcmVzdWx0LCB0cnVlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdE5vZGUgPSBpc1Byb2plY3Rpb24gPyB0Tm9kZS5wcm9qZWN0aW9uTmV4dCA6IHROb2RlLm5leHQ7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuIl19