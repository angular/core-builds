/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { checkNoChanges, checkNoChangesInRootView, detectChangesInRootView, detectChangesInternal, markViewDirty, storeCleanupFn } from './instructions';
import { FLAGS, HOST, HOST_NODE, PARENT, RENDERER_FACTORY } from './interfaces/view';
import { destroyLView } from './node_manipulation';
import { getNativeByTNode } from './util';
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
     * @param {?} _context
     * @param {?} _componentIndex
     */
    constructor(_lView, _context, _componentIndex) {
        this._context = _context;
        this._componentIndex = _componentIndex;
        this._appRef = null;
        this._viewContainerRef = null;
        /**
         * \@internal
         */
        this._tViewNode = null;
        this._lView = _lView;
    }
    /**
     * @return {?}
     */
    get rootNodes() {
        if (this._lView[HOST] == null) {
            /** @type {?} */
            const tView = (/** @type {?} */ (this._lView[HOST_NODE]));
            return collectNativeNodes(this._lView, tView, []);
        }
        return [];
    }
    /**
     * @return {?}
     */
    get context() { return this._context ? this._context : this._lookUpContext(); }
    /**
     * @return {?}
     */
    get destroyed() {
        return (this._lView[FLAGS] & 32 /* Destroyed */) === 32 /* Destroyed */;
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
    markForCheck() { markViewDirty(this._lView); }
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
    detach() { this._lView[FLAGS] &= ~8 /* Attached */; }
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
    reattach() { this._lView[FLAGS] |= 8 /* Attached */; }
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
    detectChanges() {
        /** @type {?} */
        const rendererFactory = this._lView[RENDERER_FACTORY];
        if (rendererFactory.begin) {
            rendererFactory.begin();
        }
        detectChangesInternal(this._lView, this.context, null);
        if (rendererFactory.end) {
            rendererFactory.end();
        }
    }
    /**
     * Checks the change detector and its children, and throws if any changes are detected.
     *
     * This is used in development mode to verify that running change detection doesn't
     * introduce other changes.
     * @return {?}
     */
    checkNoChanges() { checkNoChanges(this.context); }
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
    detachFromAppRef() { this._appRef = null; }
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
    /**
     * @private
     * @return {?}
     */
    _lookUpContext() {
        return this._context = (/** @type {?} */ ((/** @type {?} */ (this._lView[PARENT]))[this._componentIndex]));
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
     * \@internal
     * @type {?}
     */
    ViewRef.prototype._lView;
    /**
     * @type {?}
     * @private
     */
    ViewRef.prototype._context;
    /**
     * @type {?}
     * @private
     */
    ViewRef.prototype._componentIndex;
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
        super(_view, null, -1);
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
 * @param {?} parentTNode
 * @param {?} result
 * @return {?}
 */
function collectNativeNodes(lView, parentTNode, result) {
    /** @type {?} */
    let tNodeChild = parentTNode.child;
    while (tNodeChild) {
        result.push(getNativeByTNode(tNodeChild, lView));
        if (tNodeChild.type === 4 /* ElementContainer */) {
            collectNativeNodes(lView, tNodeChild, result);
        }
        tNodeChild = tNodeChild.next;
    }
    return result;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld19yZWYuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3ZpZXdfcmVmLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBYUEsT0FBTyxFQUFDLGNBQWMsRUFBRSx3QkFBd0IsRUFBRSx1QkFBdUIsRUFBRSxxQkFBcUIsRUFBRSxhQUFhLEVBQUUsY0FBYyxFQUFlLE1BQU0sZ0JBQWdCLENBQUM7QUFFckssT0FBTyxFQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFxQixNQUFNLEVBQUUsZ0JBQWdCLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUN0RyxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDakQsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0sUUFBUSxDQUFDOzs7O0FBT3hDLDREQUErRjs7OztBQUUvRixNQUFNLE9BQU8sT0FBTzs7Ozs7O0lBdUJsQixZQUFZLE1BQWEsRUFBVSxRQUFnQixFQUFVLGVBQXVCO1FBQWpELGFBQVEsR0FBUixRQUFRLENBQVE7UUFBVSxvQkFBZSxHQUFmLGVBQWUsQ0FBUTtRQXJCNUUsWUFBTyxHQUF3QixJQUFJLENBQUM7UUFDcEMsc0JBQWlCLEdBQXFDLElBQUksQ0FBQzs7OztRQUs1RCxlQUFVLEdBQW1CLElBQUksQ0FBQztRQWdCdkMsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7SUFDdkIsQ0FBQzs7OztJQVZELElBQUksU0FBUztRQUNYLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLEVBQUU7O2tCQUN2QixLQUFLLEdBQUcsbUJBQUEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsRUFBYTtZQUNqRCxPQUFPLGtCQUFrQixDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1NBQ25EO1FBQ0QsT0FBTyxF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SSxDQUFDO0tBQzlCO0lBRUQsT0FBTyxNQUFNLENBQUM7QUFDaEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtBcHBsaWNhdGlvblJlZn0gZnJvbSAnLi4vYXBwbGljYXRpb25fcmVmJztcbmltcG9ydCB7Q2hhbmdlRGV0ZWN0b3JSZWYgYXMgdmlld0VuZ2luZV9DaGFuZ2VEZXRlY3RvclJlZn0gZnJvbSAnLi4vY2hhbmdlX2RldGVjdGlvbi9jaGFuZ2VfZGV0ZWN0b3JfcmVmJztcbmltcG9ydCB7Vmlld0NvbnRhaW5lclJlZiBhcyB2aWV3RW5naW5lX1ZpZXdDb250YWluZXJSZWZ9IGZyb20gJy4uL2xpbmtlci92aWV3X2NvbnRhaW5lcl9yZWYnO1xuaW1wb3J0IHtFbWJlZGRlZFZpZXdSZWYgYXMgdmlld0VuZ2luZV9FbWJlZGRlZFZpZXdSZWYsIEludGVybmFsVmlld1JlZiBhcyB2aWV3RW5naW5lX0ludGVybmFsVmlld1JlZn0gZnJvbSAnLi4vbGlua2VyL3ZpZXdfcmVmJztcblxuaW1wb3J0IHtjaGVja05vQ2hhbmdlcywgY2hlY2tOb0NoYW5nZXNJblJvb3RWaWV3LCBkZXRlY3RDaGFuZ2VzSW5Sb290VmlldywgZGV0ZWN0Q2hhbmdlc0ludGVybmFsLCBtYXJrVmlld0RpcnR5LCBzdG9yZUNsZWFudXBGbiwgdmlld0F0dGFjaGVkfSBmcm9tICcuL2luc3RydWN0aW9ucyc7XG5pbXBvcnQge1ROb2RlLCBUTm9kZVR5cGUsIFRWaWV3Tm9kZX0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtGTEFHUywgSE9TVCwgSE9TVF9OT0RFLCBMVmlldywgTFZpZXdGbGFncywgUEFSRU5ULCBSRU5ERVJFUl9GQUNUT1JZfSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Rlc3Ryb3lMVmlld30gZnJvbSAnLi9ub2RlX21hbmlwdWxhdGlvbic7XG5pbXBvcnQge2dldE5hdGl2ZUJ5VE5vZGV9IGZyb20gJy4vdXRpbCc7XG5cblxuXG4vLyBOZWVkZWQgZHVlIHRvIHRzaWNrbGUgZG93bmxldmVsaW5nIHdoZXJlIG11bHRpcGxlIGBpbXBsZW1lbnRzYCB3aXRoIGNsYXNzZXMgY3JlYXRlc1xuLy8gbXVsdGlwbGUgQGV4dGVuZHMgaW4gQ2xvc3VyZSBhbm5vdGF0aW9ucywgd2hpY2ggaXMgaWxsZWdhbC4gVGhpcyB3b3JrYXJvdW5kIGZpeGVzXG4vLyB0aGUgbXVsdGlwbGUgQGV4dGVuZHMgYnkgbWFraW5nIHRoZSBhbm5vdGF0aW9uIEBpbXBsZW1lbnRzIGluc3RlYWRcbmV4cG9ydCBpbnRlcmZhY2Ugdmlld0VuZ2luZV9DaGFuZ2VEZXRlY3RvclJlZl9pbnRlcmZhY2UgZXh0ZW5kcyB2aWV3RW5naW5lX0NoYW5nZURldGVjdG9yUmVmIHt9XG5cbmV4cG9ydCBjbGFzcyBWaWV3UmVmPFQ+IGltcGxlbWVudHMgdmlld0VuZ2luZV9FbWJlZGRlZFZpZXdSZWY8VD4sIHZpZXdFbmdpbmVfSW50ZXJuYWxWaWV3UmVmLFxuICAgIHZpZXdFbmdpbmVfQ2hhbmdlRGV0ZWN0b3JSZWZfaW50ZXJmYWNlIHtcbiAgcHJpdmF0ZSBfYXBwUmVmOiBBcHBsaWNhdGlvblJlZnxudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBfdmlld0NvbnRhaW5lclJlZjogdmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmfG51bGwgPSBudWxsO1xuXG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHB1YmxpYyBfdFZpZXdOb2RlOiBUVmlld05vZGV8bnVsbCA9IG51bGw7XG5cbiAgLyoqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgcHVibGljIF9sVmlldzogTFZpZXc7XG5cbiAgZ2V0IHJvb3ROb2RlcygpOiBhbnlbXSB7XG4gICAgaWYgKHRoaXMuX2xWaWV3W0hPU1RdID09IG51bGwpIHtcbiAgICAgIGNvbnN0IHRWaWV3ID0gdGhpcy5fbFZpZXdbSE9TVF9OT0RFXSBhcyBUVmlld05vZGU7XG4gICAgICByZXR1cm4gY29sbGVjdE5hdGl2ZU5vZGVzKHRoaXMuX2xWaWV3LCB0VmlldywgW10pO1xuICAgIH1cbiAgICByZXR1cm4gW107XG4gIH1cblxuICBjb25zdHJ1Y3RvcihfbFZpZXc6IExWaWV3LCBwcml2YXRlIF9jb250ZXh0OiBUfG51bGwsIHByaXZhdGUgX2NvbXBvbmVudEluZGV4OiBudW1iZXIpIHtcbiAgICB0aGlzLl9sVmlldyA9IF9sVmlldztcbiAgfVxuXG4gIGdldCBjb250ZXh0KCk6IFQgeyByZXR1cm4gdGhpcy5fY29udGV4dCA/IHRoaXMuX2NvbnRleHQgOiB0aGlzLl9sb29rVXBDb250ZXh0KCk7IH1cblxuICBnZXQgZGVzdHJveWVkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAodGhpcy5fbFZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5EZXN0cm95ZWQpID09PSBMVmlld0ZsYWdzLkRlc3Ryb3llZDtcbiAgfVxuXG4gIGRlc3Ryb3koKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX2FwcFJlZikge1xuICAgICAgdGhpcy5fYXBwUmVmLmRldGFjaFZpZXcodGhpcyk7XG4gICAgfSBlbHNlIGlmICh0aGlzLl92aWV3Q29udGFpbmVyUmVmKSB7XG4gICAgICBjb25zdCBpbmRleCA9IHRoaXMuX3ZpZXdDb250YWluZXJSZWYuaW5kZXhPZih0aGlzKTtcblxuICAgICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgICAgdGhpcy5fdmlld0NvbnRhaW5lclJlZi5kZXRhY2goaW5kZXgpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLl92aWV3Q29udGFpbmVyUmVmID0gbnVsbDtcbiAgICB9XG4gICAgZGVzdHJveUxWaWV3KHRoaXMuX2xWaWV3KTtcbiAgfVxuXG4gIG9uRGVzdHJveShjYWxsYmFjazogRnVuY3Rpb24pIHsgc3RvcmVDbGVhbnVwRm4odGhpcy5fbFZpZXcsIGNhbGxiYWNrKTsgfVxuXG4gIC8qKlxuICAgKiBNYXJrcyBhIHZpZXcgYW5kIGFsbCBvZiBpdHMgYW5jZXN0b3JzIGRpcnR5LlxuICAgKlxuICAgKiBJdCBhbHNvIHRyaWdnZXJzIGNoYW5nZSBkZXRlY3Rpb24gYnkgY2FsbGluZyBgc2NoZWR1bGVUaWNrYCBpbnRlcm5hbGx5LCB3aGljaCBjb2FsZXNjZXNcbiAgICogbXVsdGlwbGUgYG1hcmtGb3JDaGVja2AgY2FsbHMgdG8gaW50byBvbmUgY2hhbmdlIGRldGVjdGlvbiBydW4uXG4gICAqXG4gICAqIFRoaXMgY2FuIGJlIHVzZWQgdG8gZW5zdXJlIGFuIHtAbGluayBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSNPblB1c2ggT25QdXNofSBjb21wb25lbnQgaXNcbiAgICogY2hlY2tlZCB3aGVuIGl0IG5lZWRzIHRvIGJlIHJlLXJlbmRlcmVkIGJ1dCB0aGUgdHdvIG5vcm1hbCB0cmlnZ2VycyBoYXZlbid0IG1hcmtlZCBpdFxuICAgKiBkaXJ0eSAoaS5lLiBpbnB1dHMgaGF2ZW4ndCBjaGFuZ2VkIGFuZCBldmVudHMgaGF2ZW4ndCBmaXJlZCBpbiB0aGUgdmlldykuXG4gICAqXG4gICAqIDwhLS0gVE9ETzogQWRkIGEgbGluayB0byBhIGNoYXB0ZXIgb24gT25QdXNoIGNvbXBvbmVudHMgLS0+XG4gICAqXG4gICAqIEB1c2FnZU5vdGVzXG4gICAqICMjIyBFeGFtcGxlXG4gICAqXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogQENvbXBvbmVudCh7XG4gICAqICAgc2VsZWN0b3I6ICdteS1hcHAnLFxuICAgKiAgIHRlbXBsYXRlOiBgTnVtYmVyIG9mIHRpY2tzOiB7e251bWJlck9mVGlja3N9fWBcbiAgICogICBjaGFuZ2VEZXRlY3Rpb246IENoYW5nZURldGVjdGlvblN0cmF0ZWd5Lk9uUHVzaCxcbiAgICogfSlcbiAgICogY2xhc3MgQXBwQ29tcG9uZW50IHtcbiAgICogICBudW1iZXJPZlRpY2tzID0gMDtcbiAgICpcbiAgICogICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlZjogQ2hhbmdlRGV0ZWN0b3JSZWYpIHtcbiAgICogICAgIHNldEludGVydmFsKCgpID0+IHtcbiAgICogICAgICAgdGhpcy5udW1iZXJPZlRpY2tzKys7XG4gICAqICAgICAgIC8vIHRoZSBmb2xsb3dpbmcgaXMgcmVxdWlyZWQsIG90aGVyd2lzZSB0aGUgdmlldyB3aWxsIG5vdCBiZSB1cGRhdGVkXG4gICAqICAgICAgIHRoaXMucmVmLm1hcmtGb3JDaGVjaygpO1xuICAgKiAgICAgfSwgMTAwMCk7XG4gICAqICAgfVxuICAgKiB9XG4gICAqIGBgYFxuICAgKi9cbiAgbWFya0ZvckNoZWNrKCk6IHZvaWQgeyBtYXJrVmlld0RpcnR5KHRoaXMuX2xWaWV3KTsgfVxuXG4gIC8qKlxuICAgKiBEZXRhY2hlcyB0aGUgdmlldyBmcm9tIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHRyZWUuXG4gICAqXG4gICAqIERldGFjaGVkIHZpZXdzIHdpbGwgbm90IGJlIGNoZWNrZWQgZHVyaW5nIGNoYW5nZSBkZXRlY3Rpb24gcnVucyB1bnRpbCB0aGV5IGFyZVxuICAgKiByZS1hdHRhY2hlZCwgZXZlbiBpZiB0aGV5IGFyZSBkaXJ0eS4gYGRldGFjaGAgY2FuIGJlIHVzZWQgaW4gY29tYmluYXRpb24gd2l0aFxuICAgKiB7QGxpbmsgQ2hhbmdlRGV0ZWN0b3JSZWYjZGV0ZWN0Q2hhbmdlcyBkZXRlY3RDaGFuZ2VzfSB0byBpbXBsZW1lbnQgbG9jYWwgY2hhbmdlXG4gICAqIGRldGVjdGlvbiBjaGVja3MuXG4gICAqXG4gICAqIDwhLS0gVE9ETzogQWRkIGEgbGluayB0byBhIGNoYXB0ZXIgb24gZGV0YWNoL3JlYXR0YWNoL2xvY2FsIGRpZ2VzdCAtLT5cbiAgICogPCEtLSBUT0RPOiBBZGQgYSBsaXZlIGRlbW8gb25jZSByZWYuZGV0ZWN0Q2hhbmdlcyBpcyBtZXJnZWQgaW50byBtYXN0ZXIgLS0+XG4gICAqXG4gICAqIEB1c2FnZU5vdGVzXG4gICAqICMjIyBFeGFtcGxlXG4gICAqXG4gICAqIFRoZSBmb2xsb3dpbmcgZXhhbXBsZSBkZWZpbmVzIGEgY29tcG9uZW50IHdpdGggYSBsYXJnZSBsaXN0IG9mIHJlYWRvbmx5IGRhdGEuXG4gICAqIEltYWdpbmUgdGhlIGRhdGEgY2hhbmdlcyBjb25zdGFudGx5LCBtYW55IHRpbWVzIHBlciBzZWNvbmQuIEZvciBwZXJmb3JtYW5jZSByZWFzb25zLFxuICAgKiB3ZSB3YW50IHRvIGNoZWNrIGFuZCB1cGRhdGUgdGhlIGxpc3QgZXZlcnkgZml2ZSBzZWNvbmRzLiBXZSBjYW4gZG8gdGhhdCBieSBkZXRhY2hpbmdcbiAgICogdGhlIGNvbXBvbmVudCdzIGNoYW5nZSBkZXRlY3RvciBhbmQgZG9pbmcgYSBsb2NhbCBjaGVjayBldmVyeSBmaXZlIHNlY29uZHMuXG4gICAqXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogY2xhc3MgRGF0YVByb3ZpZGVyIHtcbiAgICogICAvLyBpbiBhIHJlYWwgYXBwbGljYXRpb24gdGhlIHJldHVybmVkIGRhdGEgd2lsbCBiZSBkaWZmZXJlbnQgZXZlcnkgdGltZVxuICAgKiAgIGdldCBkYXRhKCkge1xuICAgKiAgICAgcmV0dXJuIFsxLDIsMyw0LDVdO1xuICAgKiAgIH1cbiAgICogfVxuICAgKlxuICAgKiBAQ29tcG9uZW50KHtcbiAgICogICBzZWxlY3RvcjogJ2dpYW50LWxpc3QnLFxuICAgKiAgIHRlbXBsYXRlOiBgXG4gICAqICAgICA8bGkgKm5nRm9yPVwibGV0IGQgb2YgZGF0YVByb3ZpZGVyLmRhdGFcIj5EYXRhIHt7ZH19PC9saT5cbiAgICogICBgLFxuICAgKiB9KVxuICAgKiBjbGFzcyBHaWFudExpc3Qge1xuICAgKiAgIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVmOiBDaGFuZ2VEZXRlY3RvclJlZiwgcHJpdmF0ZSBkYXRhUHJvdmlkZXI6IERhdGFQcm92aWRlcikge1xuICAgKiAgICAgcmVmLmRldGFjaCgpO1xuICAgKiAgICAgc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgKiAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAqICAgICB9LCA1MDAwKTtcbiAgICogICB9XG4gICAqIH1cbiAgICpcbiAgICogQENvbXBvbmVudCh7XG4gICAqICAgc2VsZWN0b3I6ICdhcHAnLFxuICAgKiAgIHByb3ZpZGVyczogW0RhdGFQcm92aWRlcl0sXG4gICAqICAgdGVtcGxhdGU6IGBcbiAgICogICAgIDxnaWFudC1saXN0PjxnaWFudC1saXN0PlxuICAgKiAgIGAsXG4gICAqIH0pXG4gICAqIGNsYXNzIEFwcCB7XG4gICAqIH1cbiAgICogYGBgXG4gICAqL1xuICBkZXRhY2goKTogdm9pZCB7IHRoaXMuX2xWaWV3W0ZMQUdTXSAmPSB+TFZpZXdGbGFncy5BdHRhY2hlZDsgfVxuXG4gIC8qKlxuICAgKiBSZS1hdHRhY2hlcyBhIHZpZXcgdG8gdGhlIGNoYW5nZSBkZXRlY3Rpb24gdHJlZS5cbiAgICpcbiAgICogVGhpcyBjYW4gYmUgdXNlZCB0byByZS1hdHRhY2ggdmlld3MgdGhhdCB3ZXJlIHByZXZpb3VzbHkgZGV0YWNoZWQgZnJvbSB0aGUgdHJlZVxuICAgKiB1c2luZyB7QGxpbmsgQ2hhbmdlRGV0ZWN0b3JSZWYjZGV0YWNoIGRldGFjaH0uIFZpZXdzIGFyZSBhdHRhY2hlZCB0byB0aGUgdHJlZSBieSBkZWZhdWx0LlxuICAgKlxuICAgKiA8IS0tIFRPRE86IEFkZCBhIGxpbmsgdG8gYSBjaGFwdGVyIG9uIGRldGFjaC9yZWF0dGFjaC9sb2NhbCBkaWdlc3QgLS0+XG4gICAqXG4gICAqIEB1c2FnZU5vdGVzXG4gICAqICMjIyBFeGFtcGxlXG4gICAqXG4gICAqIFRoZSBmb2xsb3dpbmcgZXhhbXBsZSBjcmVhdGVzIGEgY29tcG9uZW50IGRpc3BsYXlpbmcgYGxpdmVgIGRhdGEuIFRoZSBjb21wb25lbnQgd2lsbCBkZXRhY2hcbiAgICogaXRzIGNoYW5nZSBkZXRlY3RvciBmcm9tIHRoZSBtYWluIGNoYW5nZSBkZXRlY3RvciB0cmVlIHdoZW4gdGhlIGNvbXBvbmVudCdzIGxpdmUgcHJvcGVydHlcbiAgICogaXMgc2V0IHRvIGZhbHNlLlxuICAgKlxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIGNsYXNzIERhdGFQcm92aWRlciB7XG4gICAqICAgZGF0YSA9IDE7XG4gICAqXG4gICAqICAgY29uc3RydWN0b3IoKSB7XG4gICAqICAgICBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAqICAgICAgIHRoaXMuZGF0YSA9IHRoaXMuZGF0YSAqIDI7XG4gICAqICAgICB9LCA1MDApO1xuICAgKiAgIH1cbiAgICogfVxuICAgKlxuICAgKiBAQ29tcG9uZW50KHtcbiAgICogICBzZWxlY3RvcjogJ2xpdmUtZGF0YScsXG4gICAqICAgaW5wdXRzOiBbJ2xpdmUnXSxcbiAgICogICB0ZW1wbGF0ZTogJ0RhdGE6IHt7ZGF0YVByb3ZpZGVyLmRhdGF9fSdcbiAgICogfSlcbiAgICogY2xhc3MgTGl2ZURhdGEge1xuICAgKiAgIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVmOiBDaGFuZ2VEZXRlY3RvclJlZiwgcHJpdmF0ZSBkYXRhUHJvdmlkZXI6IERhdGFQcm92aWRlcikge31cbiAgICpcbiAgICogICBzZXQgbGl2ZSh2YWx1ZSkge1xuICAgKiAgICAgaWYgKHZhbHVlKSB7XG4gICAqICAgICAgIHRoaXMucmVmLnJlYXR0YWNoKCk7XG4gICAqICAgICB9IGVsc2Uge1xuICAgKiAgICAgICB0aGlzLnJlZi5kZXRhY2goKTtcbiAgICogICAgIH1cbiAgICogICB9XG4gICAqIH1cbiAgICpcbiAgICogQENvbXBvbmVudCh7XG4gICAqICAgc2VsZWN0b3I6ICdteS1hcHAnLFxuICAgKiAgIHByb3ZpZGVyczogW0RhdGFQcm92aWRlcl0sXG4gICAqICAgdGVtcGxhdGU6IGBcbiAgICogICAgIExpdmUgVXBkYXRlOiA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgWyhuZ01vZGVsKV09XCJsaXZlXCI+XG4gICAqICAgICA8bGl2ZS1kYXRhIFtsaXZlXT1cImxpdmVcIj48bGl2ZS1kYXRhPlxuICAgKiAgIGAsXG4gICAqIH0pXG4gICAqIGNsYXNzIEFwcENvbXBvbmVudCB7XG4gICAqICAgbGl2ZSA9IHRydWU7XG4gICAqIH1cbiAgICogYGBgXG4gICAqL1xuICByZWF0dGFjaCgpOiB2b2lkIHsgdGhpcy5fbFZpZXdbRkxBR1NdIHw9IExWaWV3RmxhZ3MuQXR0YWNoZWQ7IH1cblxuICAvKipcbiAgICogQ2hlY2tzIHRoZSB2aWV3IGFuZCBpdHMgY2hpbGRyZW4uXG4gICAqXG4gICAqIFRoaXMgY2FuIGFsc28gYmUgdXNlZCBpbiBjb21iaW5hdGlvbiB3aXRoIHtAbGluayBDaGFuZ2VEZXRlY3RvclJlZiNkZXRhY2ggZGV0YWNofSB0byBpbXBsZW1lbnRcbiAgICogbG9jYWwgY2hhbmdlIGRldGVjdGlvbiBjaGVja3MuXG4gICAqXG4gICAqIDwhLS0gVE9ETzogQWRkIGEgbGluayB0byBhIGNoYXB0ZXIgb24gZGV0YWNoL3JlYXR0YWNoL2xvY2FsIGRpZ2VzdCAtLT5cbiAgICogPCEtLSBUT0RPOiBBZGQgYSBsaXZlIGRlbW8gb25jZSByZWYuZGV0ZWN0Q2hhbmdlcyBpcyBtZXJnZWQgaW50byBtYXN0ZXIgLS0+XG4gICAqXG4gICAqIEB1c2FnZU5vdGVzXG4gICAqICMjIyBFeGFtcGxlXG4gICAqXG4gICAqIFRoZSBmb2xsb3dpbmcgZXhhbXBsZSBkZWZpbmVzIGEgY29tcG9uZW50IHdpdGggYSBsYXJnZSBsaXN0IG9mIHJlYWRvbmx5IGRhdGEuXG4gICAqIEltYWdpbmUsIHRoZSBkYXRhIGNoYW5nZXMgY29uc3RhbnRseSwgbWFueSB0aW1lcyBwZXIgc2Vjb25kLiBGb3IgcGVyZm9ybWFuY2UgcmVhc29ucyxcbiAgICogd2Ugd2FudCB0byBjaGVjayBhbmQgdXBkYXRlIHRoZSBsaXN0IGV2ZXJ5IGZpdmUgc2Vjb25kcy5cbiAgICpcbiAgICogV2UgY2FuIGRvIHRoYXQgYnkgZGV0YWNoaW5nIHRoZSBjb21wb25lbnQncyBjaGFuZ2UgZGV0ZWN0b3IgYW5kIGRvaW5nIGEgbG9jYWwgY2hhbmdlIGRldGVjdGlvblxuICAgKiBjaGVjayBldmVyeSBmaXZlIHNlY29uZHMuXG4gICAqXG4gICAqIFNlZSB7QGxpbmsgQ2hhbmdlRGV0ZWN0b3JSZWYjZGV0YWNoIGRldGFjaH0gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAqL1xuICBkZXRlY3RDaGFuZ2VzKCk6IHZvaWQge1xuICAgIGNvbnN0IHJlbmRlcmVyRmFjdG9yeSA9IHRoaXMuX2xWaWV3W1JFTkRFUkVSX0ZBQ1RPUlldO1xuICAgIGlmIChyZW5kZXJlckZhY3RvcnkuYmVnaW4pIHtcbiAgICAgIHJlbmRlcmVyRmFjdG9yeS5iZWdpbigpO1xuICAgIH1cbiAgICBkZXRlY3RDaGFuZ2VzSW50ZXJuYWwodGhpcy5fbFZpZXcsIHRoaXMuY29udGV4dCwgbnVsbCk7XG4gICAgaWYgKHJlbmRlcmVyRmFjdG9yeS5lbmQpIHtcbiAgICAgIHJlbmRlcmVyRmFjdG9yeS5lbmQoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIHRoZSBjaGFuZ2UgZGV0ZWN0b3IgYW5kIGl0cyBjaGlsZHJlbiwgYW5kIHRocm93cyBpZiBhbnkgY2hhbmdlcyBhcmUgZGV0ZWN0ZWQuXG4gICAqXG4gICAqIFRoaXMgaXMgdXNlZCBpbiBkZXZlbG9wbWVudCBtb2RlIHRvIHZlcmlmeSB0aGF0IHJ1bm5pbmcgY2hhbmdlIGRldGVjdGlvbiBkb2Vzbid0XG4gICAqIGludHJvZHVjZSBvdGhlciBjaGFuZ2VzLlxuICAgKi9cbiAgY2hlY2tOb0NoYW5nZXMoKTogdm9pZCB7IGNoZWNrTm9DaGFuZ2VzKHRoaXMuY29udGV4dCk7IH1cblxuICBhdHRhY2hUb1ZpZXdDb250YWluZXJSZWYodmNSZWY6IHZpZXdFbmdpbmVfVmlld0NvbnRhaW5lclJlZikge1xuICAgIGlmICh0aGlzLl9hcHBSZWYpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVGhpcyB2aWV3IGlzIGFscmVhZHkgYXR0YWNoZWQgZGlyZWN0bHkgdG8gdGhlIEFwcGxpY2F0aW9uUmVmIScpO1xuICAgIH1cbiAgICB0aGlzLl92aWV3Q29udGFpbmVyUmVmID0gdmNSZWY7XG4gIH1cblxuICBkZXRhY2hGcm9tQXBwUmVmKCkgeyB0aGlzLl9hcHBSZWYgPSBudWxsOyB9XG5cbiAgYXR0YWNoVG9BcHBSZWYoYXBwUmVmOiBBcHBsaWNhdGlvblJlZikge1xuICAgIGlmICh0aGlzLl92aWV3Q29udGFpbmVyUmVmKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoaXMgdmlldyBpcyBhbHJlYWR5IGF0dGFjaGVkIHRvIGEgVmlld0NvbnRhaW5lciEnKTtcbiAgICB9XG4gICAgdGhpcy5fYXBwUmVmID0gYXBwUmVmO1xuICB9XG5cbiAgcHJpdmF0ZSBfbG9va1VwQ29udGV4dCgpOiBUIHtcbiAgICByZXR1cm4gdGhpcy5fY29udGV4dCA9IHRoaXMuX2xWaWV3W1BBUkVOVF0gIVt0aGlzLl9jb21wb25lbnRJbmRleF0gYXMgVDtcbiAgfVxufVxuXG4vKiogQGludGVybmFsICovXG5leHBvcnQgY2xhc3MgUm9vdFZpZXdSZWY8VD4gZXh0ZW5kcyBWaWV3UmVmPFQ+IHtcbiAgY29uc3RydWN0b3IocHVibGljIF92aWV3OiBMVmlldykgeyBzdXBlcihfdmlldywgbnVsbCwgLTEpOyB9XG5cbiAgZGV0ZWN0Q2hhbmdlcygpOiB2b2lkIHsgZGV0ZWN0Q2hhbmdlc0luUm9vdFZpZXcodGhpcy5fdmlldyk7IH1cblxuICBjaGVja05vQ2hhbmdlcygpOiB2b2lkIHsgY2hlY2tOb0NoYW5nZXNJblJvb3RWaWV3KHRoaXMuX3ZpZXcpOyB9XG5cbiAgZ2V0IGNvbnRleHQoKTogVCB7IHJldHVybiBudWxsICE7IH1cbn1cblxuZnVuY3Rpb24gY29sbGVjdE5hdGl2ZU5vZGVzKGxWaWV3OiBMVmlldywgcGFyZW50VE5vZGU6IFROb2RlLCByZXN1bHQ6IGFueVtdKTogYW55W10ge1xuICBsZXQgdE5vZGVDaGlsZCA9IHBhcmVudFROb2RlLmNoaWxkO1xuXG4gIHdoaWxlICh0Tm9kZUNoaWxkKSB7XG4gICAgcmVzdWx0LnB1c2goZ2V0TmF0aXZlQnlUTm9kZSh0Tm9kZUNoaWxkLCBsVmlldykpO1xuICAgIGlmICh0Tm9kZUNoaWxkLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKSB7XG4gICAgICBjb2xsZWN0TmF0aXZlTm9kZXMobFZpZXcsIHROb2RlQ2hpbGQsIHJlc3VsdCk7XG4gICAgfVxuICAgIHROb2RlQ2hpbGQgPSB0Tm9kZUNoaWxkLm5leHQ7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuIl19