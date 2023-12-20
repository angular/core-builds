/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { RuntimeError } from '../errors';
import { removeFromArray } from '../util/array_utils';
import { assertEqual } from '../util/assert';
import { collectNativeNodes } from './collect_native_nodes';
import { checkNoChangesInternal, detectChangesInternal } from './instructions/change_detection';
import { markViewDirty } from './instructions/mark_view_dirty';
import { CONTAINER_HEADER_OFFSET, VIEW_REFS } from './interfaces/container';
import { isLContainer } from './interfaces/type_checks';
import { CONTEXT, FLAGS, PARENT, TVIEW } from './interfaces/view';
import { destroyLView, detachView, detachViewFromDOM } from './node_manipulation';
import { storeLViewOnDestroy, updateAncestorTraversalFlagsOnAttach } from './util/view_utils';
export class ViewRef {
    get rootNodes() {
        const lView = this._lView;
        const tView = lView[TVIEW];
        return collectNativeNodes(tView, lView, tView.firstChild, []);
    }
    constructor(
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
    _cdRefInjectingView, notifyErrorHandler = true) {
        this._lView = _lView;
        this._cdRefInjectingView = _cdRefInjectingView;
        this.notifyErrorHandler = notifyErrorHandler;
        this._appRef = null;
        this._attachedToViewContainer = false;
    }
    get context() {
        return this._lView[CONTEXT];
    }
    /**
     * @deprecated Replacing the full context object is not supported. Modify the context
     *   directly, or consider using a `Proxy` if you need to replace the full object.
     * // TODO(devversion): Remove this.
     */
    set context(value) {
        if (ngDevMode) {
            // Note: We have a warning message here because the `@deprecated` JSDoc will not be picked
            // up for assignments on the setter. We want to let users know about the deprecated usage.
            console.warn('Angular: Replacing the `context` object of an `EmbeddedViewRef` is deprecated.');
        }
        this._lView[CONTEXT] = value;
    }
    get destroyed() {
        return (this._lView[FLAGS] & 256 /* LViewFlags.Destroyed */) === 256 /* LViewFlags.Destroyed */;
    }
    destroy() {
        if (this._appRef) {
            this._appRef.detachView(this);
        }
        else if (this._attachedToViewContainer) {
            const parent = this._lView[PARENT];
            if (isLContainer(parent)) {
                const viewRefs = parent[VIEW_REFS];
                const index = viewRefs ? viewRefs.indexOf(this) : -1;
                if (index > -1) {
                    ngDevMode &&
                        assertEqual(index, parent.indexOf(this._lView) - CONTAINER_HEADER_OFFSET, 'An attached view should be in the same position within its container as its ViewRef in the VIEW_REFS array.');
                    detachView(parent, index);
                    removeFromArray(viewRefs, index);
                }
            }
            this._attachedToViewContainer = false;
        }
        destroyLView(this._lView[TVIEW], this._lView);
    }
    onDestroy(callback) {
        storeLViewOnDestroy(this._lView, callback);
    }
    /**
     * Marks a view and all of its ancestors dirty.
     *
     * This can be used to ensure an {@link ChangeDetectionStrategy#OnPush} component is
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
     *   selector: 'app-root',
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
    markForCheck() {
        markViewDirty(this._cdRefInjectingView || this._lView);
    }
    /**
     * Detaches the view from the change detection tree.
     *
     * Detached views will not be checked during change detection runs until they are
     * re-attached, even if they are dirty. `detach` can be used in combination with
     * {@link ChangeDetectorRef#detectChanges} to implement local change
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
    detach() {
        this._lView[FLAGS] &= ~128 /* LViewFlags.Attached */;
    }
    /**
     * Re-attaches a view to the change detection tree.
     *
     * This can be used to re-attach views that were previously detached from the tree
     * using {@link ChangeDetectorRef#detach}. Views are attached to the tree by default.
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
     *   selector: 'app-root',
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
    reattach() {
        updateAncestorTraversalFlagsOnAttach(this._lView);
        this._lView[FLAGS] |= 128 /* LViewFlags.Attached */;
    }
    /**
     * Checks the view and its children.
     *
     * This can also be used in combination with {@link ChangeDetectorRef#detach} to implement
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
     * See {@link ChangeDetectorRef#detach} for more information.
     */
    detectChanges() {
        // Add `RefreshView` flag to ensure this view is refreshed if not already dirty.
        // `RefreshView` flag is used intentionally over `Dirty` because it gets cleared before
        // executing any of the actual refresh code while the `Dirty` flag doesn't get cleared
        // until the end of the refresh. Using `RefreshView` prevents creating a potential difference
        // in the state of the LViewFlags during template execution.
        this._lView[FLAGS] |= 1024 /* LViewFlags.RefreshView */;
        detectChangesInternal(this._lView, this.notifyErrorHandler);
    }
    /**
     * Checks the change detector and its children, and throws if any changes are detected.
     *
     * This is used in development mode to verify that running change detection doesn't
     * introduce other changes.
     */
    checkNoChanges() {
        if (ngDevMode) {
            checkNoChangesInternal(this._lView, this.notifyErrorHandler);
        }
    }
    attachToViewContainerRef() {
        if (this._appRef) {
            throw new RuntimeError(902 /* RuntimeErrorCode.VIEW_ALREADY_ATTACHED */, ngDevMode && 'This view is already attached directly to the ApplicationRef!');
        }
        this._attachedToViewContainer = true;
    }
    detachFromAppRef() {
        this._appRef = null;
        detachViewFromDOM(this._lView[TVIEW], this._lView);
    }
    attachToAppRef(appRef) {
        if (this._attachedToViewContainer) {
            throw new RuntimeError(902 /* RuntimeErrorCode.VIEW_ALREADY_ATTACHED */, ngDevMode && 'This view is already attached to a ViewContainer!');
        }
        this._appRef = appRef;
        updateAncestorTraversalFlagsOnAttach(this._lView);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld19yZWYuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3ZpZXdfcmVmLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUdILE9BQU8sRUFBQyxZQUFZLEVBQW1CLE1BQU0sV0FBVyxDQUFDO0FBRXpELE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNwRCxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFFM0MsT0FBTyxFQUFDLGtCQUFrQixFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDMUQsT0FBTyxFQUFDLHNCQUFzQixFQUFFLHFCQUFxQixFQUFDLE1BQU0saUNBQWlDLENBQUM7QUFDOUYsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLGdDQUFnQyxDQUFDO0FBQzdELE9BQU8sRUFBQyx1QkFBdUIsRUFBRSxTQUFTLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUMxRSxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFDdEQsT0FBTyxFQUFDLE9BQU8sRUFBZSxLQUFLLEVBQXFCLE1BQU0sRUFBRSxLQUFLLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNoRyxPQUFPLEVBQUMsWUFBWSxFQUFFLFVBQVUsRUFBRSxpQkFBaUIsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ2hGLE9BQU8sRUFBNEIsbUJBQW1CLEVBQUUsb0NBQW9DLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQVF2SCxNQUFNLE9BQU8sT0FBTztJQUlsQixJQUFJLFNBQVM7UUFDWCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQzFCLE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMzQixPQUFPLGtCQUFrQixDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxD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QUFTLElBQUksbURBQW1ELENBQUMsQ0FBQztRQUN4RSxDQUFDO1FBQ0QsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7UUFDdEIsb0NBQW9DLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3BELENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0NoYW5nZURldGVjdG9yUmVmfSBmcm9tICcuLi9jaGFuZ2VfZGV0ZWN0aW9uL2NoYW5nZV9kZXRlY3Rvcl9yZWYnO1xuaW1wb3J0IHtSdW50aW1lRXJyb3IsIFJ1bnRpbWVFcnJvckNvZGV9IGZyb20gJy4uL2Vycm9ycyc7XG5pbXBvcnQge0VtYmVkZGVkVmlld1JlZiwgVmlld1JlZlRyYWNrZXJ9IGZyb20gJy4uL2xpbmtlci92aWV3X3JlZic7XG5pbXBvcnQge3JlbW92ZUZyb21BcnJheX0gZnJvbSAnLi4vdXRpbC9hcnJheV91dGlscyc7XG5pbXBvcnQge2Fzc2VydEVxdWFsfSBmcm9tICcuLi91dGlsL2Fzc2VydCc7XG5cbmltcG9ydCB7Y29sbGVjdE5hdGl2ZU5vZGVzfSBmcm9tICcuL2NvbGxlY3RfbmF0aXZlX25vZGVzJztcbmltcG9ydCB7Y2hlY2tOb0NoYW5nZXNJbnRlcm5hbCwgZGV0ZWN0Q2hhbmdlc0ludGVybmFsfSBmcm9tICcuL2luc3RydWN0aW9ucy9jaGFuZ2VfZGV0ZWN0aW9uJztcbmltcG9ydCB7bWFya1ZpZXdEaXJ0eX0gZnJvbSAnLi9pbnN0cnVjdGlvbnMvbWFya192aWV3X2RpcnR5JztcbmltcG9ydCB7Q09OVEFJTkVSX0hFQURFUl9PRkZTRVQsIFZJRVdfUkVGU30gZnJvbSAnLi9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge2lzTENvbnRhaW5lcn0gZnJvbSAnLi9pbnRlcmZhY2VzL3R5cGVfY2hlY2tzJztcbmltcG9ydCB7Q09OVEVYVCwgRU5WSVJPTk1FTlQsIEZMQUdTLCBMVmlldywgTFZpZXdGbGFncywgUEFSRU5ULCBUVklFV30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtkZXN0cm95TFZpZXcsIGRldGFjaFZpZXcsIGRldGFjaFZpZXdGcm9tRE9NfSBmcm9tICcuL25vZGVfbWFuaXB1bGF0aW9uJztcbmltcG9ydCB7bWFya0FuY2VzdG9yc0ZvclRyYXZlcnNhbCwgc3RvcmVMVmlld09uRGVzdHJveSwgdXBkYXRlQW5jZXN0b3JUcmF2ZXJzYWxGbGFnc09uQXR0YWNofSBmcm9tICcuL3V0aWwvdmlld191dGlscyc7XG5cblxuLy8gTmVlZGVkIGR1ZSB0byB0c2lja2xlIGRvd25sZXZlbGluZyB3aGVyZSBtdWx0aXBsZSBgaW1wbGVtZW50c2Agd2l0aCBjbGFzc2VzIGNyZWF0ZXNcbi8vIG11bHRpcGxlIEBleHRlbmRzIGluIENsb3N1cmUgYW5ub3RhdGlvbnMsIHdoaWNoIGlzIGlsbGVnYWwuIFRoaXMgd29ya2Fyb3VuZCBmaXhlc1xuLy8gdGhlIG11bHRpcGxlIEBleHRlbmRzIGJ5IG1ha2luZyB0aGUgYW5ub3RhdGlvbiBAaW1wbGVtZW50cyBpbnN0ZWFkXG5pbnRlcmZhY2UgQ2hhbmdlRGV0ZWN0b3JSZWZJbnRlcmZhY2UgZXh0ZW5kcyBDaGFuZ2VEZXRlY3RvclJlZiB7fVxuXG5leHBvcnQgY2xhc3MgVmlld1JlZjxUPiBpbXBsZW1lbnRzIEVtYmVkZGVkVmlld1JlZjxUPiwgQ2hhbmdlRGV0ZWN0b3JSZWZJbnRlcmZhY2Uge1xuICBwcml2YXRlIF9hcHBSZWY6IFZpZXdSZWZUcmFja2VyfG51bGwgPSBudWxsO1xuICBwcml2YXRlIF9hdHRhY2hlZFRvVmlld0NvbnRhaW5lciA9IGZhbHNlO1xuXG4gIGdldCByb290Tm9kZXMoKTogYW55W10ge1xuICAgIGNvbnN0IGxWaWV3ID0gdGhpcy5fbFZpZXc7XG4gICAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gICAgcmV0dXJuIGNvbGxlY3ROYXRpdmVOb2Rlcyh0VmlldywgbFZpZXcsIHRWaWV3LmZpcnN0Q2hpbGQsIFtdKTtcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgLyoqXG4gICAgICAgKiBUaGlzIHJlcHJlc2VudHMgYExWaWV3YCBhc3NvY2lhdGVkIHdpdGggdGhlIGNvbXBvbmVudCB3aGVuIFZpZXdSZWYgaXMgYSBDaGFuZ2VEZXRlY3RvclJlZi5cbiAgICAgICAqXG4gICAgICAgKiBXaGVuIFZpZXdSZWYgaXMgY3JlYXRlZCBmb3IgYSBkeW5hbWljIGNvbXBvbmVudCwgdGhpcyBhbHNvIHJlcHJlc2VudHMgdGhlIGBMVmlld2AgZm9yIHRoZVxuICAgICAgICogY29tcG9uZW50LlxuICAgICAgICpcbiAgICAgICAqIEZvciBhIFwicmVndWxhclwiIFZpZXdSZWYgY3JlYXRlZCBmb3IgYW4gZW1iZWRkZWQgdmlldywgdGhpcyBpcyB0aGUgYExWaWV3YCBmb3IgdGhlIGVtYmVkZGVkXG4gICAgICAgKiB2aWV3LlxuICAgICAgICpcbiAgICAgICAqIEBpbnRlcm5hbFxuICAgICAgICovXG4gICAgICBwdWJsaWMgX2xWaWV3OiBMVmlldyxcblxuICAgICAgLyoqXG4gICAgICAgKiBUaGlzIHJlcHJlc2VudHMgdGhlIGBMVmlld2AgYXNzb2NpYXRlZCB3aXRoIHRoZSBwb2ludCB3aGVyZSBgQ2hhbmdlRGV0ZWN0b3JSZWZgIHdhc1xuICAgICAgICogcmVxdWVzdGVkLlxuICAgICAgICpcbiAgICAgICAqIFRoaXMgbWF5IGJlIGRpZmZlcmVudCBmcm9tIGBfbFZpZXdgIGlmIHRoZSBgX2NkUmVmSW5qZWN0aW5nVmlld2AgaXMgYW4gZW1iZWRkZWQgdmlldy5cbiAgICAgICAqL1xuICAgICAgcHJpdmF0ZSBfY2RSZWZJbmplY3RpbmdWaWV3PzogTFZpZXcsIHByaXZhdGUgcmVhZG9ubHkgbm90aWZ5RXJyb3JIYW5kbGVyID0gdHJ1ZSkge31cblxuICBnZXQgY29udGV4dCgpOiBUIHtcbiAgICByZXR1cm4gdGhpcy5fbFZpZXdbQ09OVEVYVF0gYXMgdW5rbm93biBhcyBUO1xuICB9XG5cbiAgLyoqXG4gICAqIEBkZXByZWNhdGVkIFJlcGxhY2luZyB0aGUgZnVsbCBjb250ZXh0IG9iamVjdCBpcyBub3Qgc3VwcG9ydGVkLiBNb2RpZnkgdGhlIGNvbnRleHRcbiAgICogICBkaXJlY3RseSwgb3IgY29uc2lkZXIgdXNpbmcgYSBgUHJveHlgIGlmIHlvdSBuZWVkIHRvIHJlcGxhY2UgdGhlIGZ1bGwgb2JqZWN0LlxuICAgKiAvLyBUT0RPKGRldnZlcnNpb24pOiBSZW1vdmUgdGhpcy5cbiAgICovXG4gIHNldCBjb250ZXh0KHZhbHVlOiBUKSB7XG4gICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgLy8gTm90ZTogV2UgaGF2ZSBhIHdhcm5pbmcgbWVzc2FnZSBoZXJlIGJlY2F1c2UgdGhlIGBAZGVwcmVjYXRlZGAgSlNEb2Mgd2lsbCBub3QgYmUgcGlja2VkXG4gICAgICAvLyB1cCBmb3IgYXNzaWdubWVudHMgb24gdGhlIHNldHRlci4gV2Ugd2FudCB0byBsZXQgdXNlcnMga25vdyBhYm91dCB0aGUgZGVwcmVjYXRlZCB1c2FnZS5cbiAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgICAnQW5ndWxhcjogUmVwbGFjaW5nIHRoZSBgY29udGV4dGAgb2JqZWN0IG9mIGFuIGBFbWJlZGRlZFZpZXdSZWZgIGlzIGRlcHJlY2F0ZWQuJyk7XG4gICAgfVxuXG4gICAgdGhpcy5fbFZpZXdbQ09OVEVYVF0gPSB2YWx1ZSBhcyB1bmtub3duIGFzIHt9O1xuICB9XG5cbiAgZ2V0IGRlc3Ryb3llZCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gKHRoaXMuX2xWaWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuRGVzdHJveWVkKSA9PT0gTFZpZXdGbGFncy5EZXN0cm95ZWQ7XG4gIH1cblxuICBkZXN0cm95KCk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9hcHBSZWYpIHtcbiAgICAgIHRoaXMuX2FwcFJlZi5kZXRhY2hWaWV3KHRoaXMpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5fYXR0YWNoZWRUb1ZpZXdDb250YWluZXIpIHtcbiAgICAgIGNvbnN0IHBhcmVudCA9IHRoaXMuX2xWaWV3W1BBUkVOVF07XG4gICAgICBpZiAoaXNMQ29udGFpbmVyKHBhcmVudCkpIHtcbiAgICAgICAgY29uc3Qgdmlld1JlZnMgPSBwYXJlbnRbVklFV19SRUZTXSBhcyBWaWV3UmVmPHVua25vd24+W10gfCBudWxsO1xuICAgICAgICBjb25zdCBpbmRleCA9IHZpZXdSZWZzID8gdmlld1JlZnMuaW5kZXhPZih0aGlzKSA6IC0xO1xuICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICAgICAgICBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgIGluZGV4LCBwYXJlbnQuaW5kZXhPZih0aGlzLl9sVmlldykgLSBDT05UQUlORVJfSEVBREVSX09GRlNFVCxcbiAgICAgICAgICAgICAgICAgICdBbiBhdHRhY2hlZCB2aWV3IHNob3VsZCBiZSBpbiB0aGUgc2FtZSBwb3NpdGlvbiB3aXRoaW4gaXRzIGNvbnRhaW5lciBhcyBpdHMgVmlld1JlZiBpbiB0aGUgVklFV19SRUZTIGFycmF5LicpO1xuICAgICAgICAgIGRldGFjaFZpZXcocGFyZW50LCBpbmRleCk7XG4gICAgICAgICAgcmVtb3ZlRnJvbUFycmF5KHZpZXdSZWZzISwgaW5kZXgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aGlzLl9hdHRhY2hlZFRvVmlld0NvbnRhaW5lciA9IGZhbHNlO1xuICAgIH1cbiAgICBkZXN0cm95TFZpZXcodGhpcy5fbFZpZXdbVFZJRVddLCB0aGlzLl9sVmlldyk7XG4gIH1cblxuICBvbkRlc3Ryb3koY2FsbGJhY2s6IEZ1bmN0aW9uKSB7XG4gICAgc3RvcmVMVmlld09uRGVzdHJveSh0aGlzLl9sVmlldywgY2FsbGJhY2sgYXMgKCkgPT4gdm9pZCk7XG4gIH1cblxuICAvKipcbiAgICogTWFya3MgYSB2aWV3IGFuZCBhbGwgb2YgaXRzIGFuY2VzdG9ycyBkaXJ0eS5cbiAgICpcbiAgICogVGhpcyBjYW4gYmUgdXNlZCB0byBlbnN1cmUgYW4ge0BsaW5rIENoYW5nZURldGVjdGlvblN0cmF0ZWd5I09uUHVzaH0gY29tcG9uZW50IGlzXG4gICAqIGNoZWNrZWQgd2hlbiBpdCBuZWVkcyB0byBiZSByZS1yZW5kZXJlZCBidXQgdGhlIHR3byBub3JtYWwgdHJpZ2dlcnMgaGF2ZW4ndCBtYXJrZWQgaXRcbiAgICogZGlydHkgKGkuZS4gaW5wdXRzIGhhdmVuJ3QgY2hhbmdlZCBhbmQgZXZlbnRzIGhhdmVuJ3QgZmlyZWQgaW4gdGhlIHZpZXcpLlxuICAgKlxuICAgKiA8IS0tIFRPRE86IEFkZCBhIGxpbmsgdG8gYSBjaGFwdGVyIG9uIE9uUHVzaCBjb21wb25lbnRzIC0tPlxuICAgKlxuICAgKiBAdXNhZ2VOb3Rlc1xuICAgKiAjIyMgRXhhbXBsZVxuICAgKlxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIEBDb21wb25lbnQoe1xuICAgKiAgIHNlbGVjdG9yOiAnYXBwLXJvb3QnLFxuICAgKiAgIHRlbXBsYXRlOiBgTnVtYmVyIG9mIHRpY2tzOiB7e251bWJlck9mVGlja3N9fWBcbiAgICogICBjaGFuZ2VEZXRlY3Rpb246IENoYW5nZURldGVjdGlvblN0cmF0ZWd5Lk9uUHVzaCxcbiAgICogfSlcbiAgICogY2xhc3MgQXBwQ29tcG9uZW50IHtcbiAgICogICBudW1iZXJPZlRpY2tzID0gMDtcbiAgICpcbiAgICogICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlZjogQ2hhbmdlRGV0ZWN0b3JSZWYpIHtcbiAgICogICAgIHNldEludGVydmFsKCgpID0+IHtcbiAgICogICAgICAgdGhpcy5udW1iZXJPZlRpY2tzKys7XG4gICAqICAgICAgIC8vIHRoZSBmb2xsb3dpbmcgaXMgcmVxdWlyZWQsIG90aGVyd2lzZSB0aGUgdmlldyB3aWxsIG5vdCBiZSB1cGRhdGVkXG4gICAqICAgICAgIHRoaXMucmVmLm1hcmtGb3JDaGVjaygpO1xuICAgKiAgICAgfSwgMTAwMCk7XG4gICAqICAgfVxuICAgKiB9XG4gICAqIGBgYFxuICAgKi9cbiAgbWFya0ZvckNoZWNrKCk6IHZvaWQge1xuICAgIG1hcmtWaWV3RGlydHkodGhpcy5fY2RSZWZJbmplY3RpbmdWaWV3IHx8IHRoaXMuX2xWaWV3KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRhY2hlcyB0aGUgdmlldyBmcm9tIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHRyZWUuXG4gICAqXG4gICAqIERldGFjaGVkIHZpZXdzIHdpbGwgbm90IGJlIGNoZWNrZWQgZHVyaW5nIGNoYW5nZSBkZXRlY3Rpb24gcnVucyB1bnRpbCB0aGV5IGFyZVxuICAgKiByZS1hdHRhY2hlZCwgZXZlbiBpZiB0aGV5IGFyZSBkaXJ0eS4gYGRldGFjaGAgY2FuIGJlIHVzZWQgaW4gY29tYmluYXRpb24gd2l0aFxuICAgKiB7QGxpbmsgQ2hhbmdlRGV0ZWN0b3JSZWYjZGV0ZWN0Q2hhbmdlc30gdG8gaW1wbGVtZW50IGxvY2FsIGNoYW5nZVxuICAgKiBkZXRlY3Rpb24gY2hlY2tzLlxuICAgKlxuICAgKiA8IS0tIFRPRE86IEFkZCBhIGxpbmsgdG8gYSBjaGFwdGVyIG9uIGRldGFjaC9yZWF0dGFjaC9sb2NhbCBkaWdlc3QgLS0+XG4gICAqIDwhLS0gVE9ETzogQWRkIGEgbGl2ZSBkZW1vIG9uY2UgcmVmLmRldGVjdENoYW5nZXMgaXMgbWVyZ2VkIGludG8gbWFzdGVyIC0tPlxuICAgKlxuICAgKiBAdXNhZ2VOb3Rlc1xuICAgKiAjIyMgRXhhbXBsZVxuICAgKlxuICAgKiBUaGUgZm9sbG93aW5nIGV4YW1wbGUgZGVmaW5lcyBhIGNvbXBvbmVudCB3aXRoIGEgbGFyZ2UgbGlzdCBvZiByZWFkb25seSBkYXRhLlxuICAgKiBJbWFnaW5lIHRoZSBkYXRhIGNoYW5nZXMgY29uc3RhbnRseSwgbWFueSB0aW1lcyBwZXIgc2Vjb25kLiBGb3IgcGVyZm9ybWFuY2UgcmVhc29ucyxcbiAgICogd2Ugd2FudCB0byBjaGVjayBhbmQgdXBkYXRlIHRoZSBsaXN0IGV2ZXJ5IGZpdmUgc2Vjb25kcy4gV2UgY2FuIGRvIHRoYXQgYnkgZGV0YWNoaW5nXG4gICAqIHRoZSBjb21wb25lbnQncyBjaGFuZ2UgZGV0ZWN0b3IgYW5kIGRvaW5nIGEgbG9jYWwgY2hlY2sgZXZlcnkgZml2ZSBzZWNvbmRzLlxuICAgKlxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIGNsYXNzIERhdGFQcm92aWRlciB7XG4gICAqICAgLy8gaW4gYSByZWFsIGFwcGxpY2F0aW9uIHRoZSByZXR1cm5lZCBkYXRhIHdpbGwgYmUgZGlmZmVyZW50IGV2ZXJ5IHRpbWVcbiAgICogICBnZXQgZGF0YSgpIHtcbiAgICogICAgIHJldHVybiBbMSwyLDMsNCw1XTtcbiAgICogICB9XG4gICAqIH1cbiAgICpcbiAgICogQENvbXBvbmVudCh7XG4gICAqICAgc2VsZWN0b3I6ICdnaWFudC1saXN0JyxcbiAgICogICB0ZW1wbGF0ZTogYFxuICAgKiAgICAgPGxpICpuZ0Zvcj1cImxldCBkIG9mIGRhdGFQcm92aWRlci5kYXRhXCI+RGF0YSB7e2R9fTwvbGk+XG4gICAqICAgYCxcbiAgICogfSlcbiAgICogY2xhc3MgR2lhbnRMaXN0IHtcbiAgICogICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlZjogQ2hhbmdlRGV0ZWN0b3JSZWYsIHByaXZhdGUgZGF0YVByb3ZpZGVyOiBEYXRhUHJvdmlkZXIpIHtcbiAgICogICAgIHJlZi5kZXRhY2goKTtcbiAgICogICAgIHNldEludGVydmFsKCgpID0+IHtcbiAgICogICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgKiAgICAgfSwgNTAwMCk7XG4gICAqICAgfVxuICAgKiB9XG4gICAqXG4gICAqIEBDb21wb25lbnQoe1xuICAgKiAgIHNlbGVjdG9yOiAnYXBwJyxcbiAgICogICBwcm92aWRlcnM6IFtEYXRhUHJvdmlkZXJdLFxuICAgKiAgIHRlbXBsYXRlOiBgXG4gICAqICAgICA8Z2lhbnQtbGlzdD48Z2lhbnQtbGlzdD5cbiAgICogICBgLFxuICAgKiB9KVxuICAgKiBjbGFzcyBBcHAge1xuICAgKiB9XG4gICAqIGBgYFxuICAgKi9cbiAgZGV0YWNoKCk6IHZvaWQge1xuICAgIHRoaXMuX2xWaWV3W0ZMQUdTXSAmPSB+TFZpZXdGbGFncy5BdHRhY2hlZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZS1hdHRhY2hlcyBhIHZpZXcgdG8gdGhlIGNoYW5nZSBkZXRlY3Rpb24gdHJlZS5cbiAgICpcbiAgICogVGhpcyBjYW4gYmUgdXNlZCB0byByZS1hdHRhY2ggdmlld3MgdGhhdCB3ZXJlIHByZXZpb3VzbHkgZGV0YWNoZWQgZnJvbSB0aGUgdHJlZVxuICAgKiB1c2luZyB7QGxpbmsgQ2hhbmdlRGV0ZWN0b3JSZWYjZGV0YWNofS4gVmlld3MgYXJlIGF0dGFjaGVkIHRvIHRoZSB0cmVlIGJ5IGRlZmF1bHQuXG4gICAqXG4gICAqIDwhLS0gVE9ETzogQWRkIGEgbGluayB0byBhIGNoYXB0ZXIgb24gZGV0YWNoL3JlYXR0YWNoL2xvY2FsIGRpZ2VzdCAtLT5cbiAgICpcbiAgICogQHVzYWdlTm90ZXNcbiAgICogIyMjIEV4YW1wbGVcbiAgICpcbiAgICogVGhlIGZvbGxvd2luZyBleGFtcGxlIGNyZWF0ZXMgYSBjb21wb25lbnQgZGlzcGxheWluZyBgbGl2ZWAgZGF0YS4gVGhlIGNvbXBvbmVudCB3aWxsIGRldGFjaFxuICAgKiBpdHMgY2hhbmdlIGRldGVjdG9yIGZyb20gdGhlIG1haW4gY2hhbmdlIGRldGVjdG9yIHRyZWUgd2hlbiB0aGUgY29tcG9uZW50J3MgbGl2ZSBwcm9wZXJ0eVxuICAgKiBpcyBzZXQgdG8gZmFsc2UuXG4gICAqXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogY2xhc3MgRGF0YVByb3ZpZGVyIHtcbiAgICogICBkYXRhID0gMTtcbiAgICpcbiAgICogICBjb25zdHJ1Y3RvcigpIHtcbiAgICogICAgIHNldEludGVydmFsKCgpID0+IHtcbiAgICogICAgICAgdGhpcy5kYXRhID0gdGhpcy5kYXRhICogMjtcbiAgICogICAgIH0sIDUwMCk7XG4gICAqICAgfVxuICAgKiB9XG4gICAqXG4gICAqIEBDb21wb25lbnQoe1xuICAgKiAgIHNlbGVjdG9yOiAnbGl2ZS1kYXRhJyxcbiAgICogICBpbnB1dHM6IFsnbGl2ZSddLFxuICAgKiAgIHRlbXBsYXRlOiAnRGF0YToge3tkYXRhUHJvdmlkZXIuZGF0YX19J1xuICAgKiB9KVxuICAgKiBjbGFzcyBMaXZlRGF0YSB7XG4gICAqICAgY29uc3RydWN0b3IocHJpdmF0ZSByZWY6IENoYW5nZURldGVjdG9yUmVmLCBwcml2YXRlIGRhdGFQcm92aWRlcjogRGF0YVByb3ZpZGVyKSB7fVxuICAgKlxuICAgKiAgIHNldCBsaXZlKHZhbHVlKSB7XG4gICAqICAgICBpZiAodmFsdWUpIHtcbiAgICogICAgICAgdGhpcy5yZWYucmVhdHRhY2goKTtcbiAgICogICAgIH0gZWxzZSB7XG4gICAqICAgICAgIHRoaXMucmVmLmRldGFjaCgpO1xuICAgKiAgICAgfVxuICAgKiAgIH1cbiAgICogfVxuICAgKlxuICAgKiBAQ29tcG9uZW50KHtcbiAgICogICBzZWxlY3RvcjogJ2FwcC1yb290JyxcbiAgICogICBwcm92aWRlcnM6IFtEYXRhUHJvdmlkZXJdLFxuICAgKiAgIHRlbXBsYXRlOiBgXG4gICAqICAgICBMaXZlIFVwZGF0ZTogPGlucHV0IHR5cGU9XCJjaGVja2JveFwiIFsobmdNb2RlbCldPVwibGl2ZVwiPlxuICAgKiAgICAgPGxpdmUtZGF0YSBbbGl2ZV09XCJsaXZlXCI+PGxpdmUtZGF0YT5cbiAgICogICBgLFxuICAgKiB9KVxuICAgKiBjbGFzcyBBcHBDb21wb25lbnQge1xuICAgKiAgIGxpdmUgPSB0cnVlO1xuICAgKiB9XG4gICAqIGBgYFxuICAgKi9cbiAgcmVhdHRhY2goKTogdm9pZCB7XG4gICAgdXBkYXRlQW5jZXN0b3JUcmF2ZXJzYWxGbGFnc09uQXR0YWNoKHRoaXMuX2xWaWV3KTtcbiAgICB0aGlzLl9sVmlld1tGTEFHU10gfD0gTFZpZXdGbGFncy5BdHRhY2hlZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgdGhlIHZpZXcgYW5kIGl0cyBjaGlsZHJlbi5cbiAgICpcbiAgICogVGhpcyBjYW4gYWxzbyBiZSB1c2VkIGluIGNvbWJpbmF0aW9uIHdpdGgge0BsaW5rIENoYW5nZURldGVjdG9yUmVmI2RldGFjaH0gdG8gaW1wbGVtZW50XG4gICAqIGxvY2FsIGNoYW5nZSBkZXRlY3Rpb24gY2hlY2tzLlxuICAgKlxuICAgKiA8IS0tIFRPRE86IEFkZCBhIGxpbmsgdG8gYSBjaGFwdGVyIG9uIGRldGFjaC9yZWF0dGFjaC9sb2NhbCBkaWdlc3QgLS0+XG4gICAqIDwhLS0gVE9ETzogQWRkIGEgbGl2ZSBkZW1vIG9uY2UgcmVmLmRldGVjdENoYW5nZXMgaXMgbWVyZ2VkIGludG8gbWFzdGVyIC0tPlxuICAgKlxuICAgKiBAdXNhZ2VOb3Rlc1xuICAgKiAjIyMgRXhhbXBsZVxuICAgKlxuICAgKiBUaGUgZm9sbG93aW5nIGV4YW1wbGUgZGVmaW5lcyBhIGNvbXBvbmVudCB3aXRoIGEgbGFyZ2UgbGlzdCBvZiByZWFkb25seSBkYXRhLlxuICAgKiBJbWFnaW5lLCB0aGUgZGF0YSBjaGFuZ2VzIGNvbnN0YW50bHksIG1hbnkgdGltZXMgcGVyIHNlY29uZC4gRm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMsXG4gICAqIHdlIHdhbnQgdG8gY2hlY2sgYW5kIHVwZGF0ZSB0aGUgbGlzdCBldmVyeSBmaXZlIHNlY29uZHMuXG4gICAqXG4gICAqIFdlIGNhbiBkbyB0aGF0IGJ5IGRldGFjaGluZyB0aGUgY29tcG9uZW50J3MgY2hhbmdlIGRldGVjdG9yIGFuZCBkb2luZyBhIGxvY2FsIGNoYW5nZSBkZXRlY3Rpb25cbiAgICogY2hlY2sgZXZlcnkgZml2ZSBzZWNvbmRzLlxuICAgKlxuICAgKiBTZWUge0BsaW5rIENoYW5nZURldGVjdG9yUmVmI2RldGFjaH0gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAqL1xuICBkZXRlY3RDaGFuZ2VzKCk6IHZvaWQge1xuICAgIC8vIEFkZCBgUmVmcmVzaFZpZXdgIGZsYWcgdG8gZW5zdXJlIHRoaXMgdmlldyBpcyByZWZyZXNoZWQgaWYgbm90IGFscmVhZHkgZGlydHkuXG4gICAgLy8gYFJlZnJlc2hWaWV3YCBmbGFnIGlzIHVzZWQgaW50ZW50aW9uYWxseSBvdmVyIGBEaXJ0eWAgYmVjYXVzZSBpdCBnZXRzIGNsZWFyZWQgYmVmb3JlXG4gICAgLy8gZXhlY3V0aW5nIGFueSBvZiB0aGUgYWN0dWFsIHJlZnJlc2ggY29kZSB3aGlsZSB0aGUgYERpcnR5YCBmbGFnIGRvZXNuJ3QgZ2V0IGNsZWFyZWRcbiAgICAvLyB1bnRpbCB0aGUgZW5kIG9mIHRoZSByZWZyZXNoLiBVc2luZyBgUmVmcmVzaFZpZXdgIHByZXZlbnRzIGNyZWF0aW5nIGEgcG90ZW50aWFsIGRpZmZlcmVuY2VcbiAgICAvLyBpbiB0aGUgc3RhdGUgb2YgdGhlIExWaWV3RmxhZ3MgZHVyaW5nIHRlbXBsYXRlIGV4ZWN1dGlvbi5cbiAgICB0aGlzLl9sVmlld1tGTEFHU10gfD0gTFZpZXdGbGFncy5SZWZyZXNoVmlldztcbiAgICBkZXRlY3RDaGFuZ2VzSW50ZXJuYWwodGhpcy5fbFZpZXcsIHRoaXMubm90aWZ5RXJyb3JIYW5kbGVyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgdGhlIGNoYW5nZSBkZXRlY3RvciBhbmQgaXRzIGNoaWxkcmVuLCBhbmQgdGhyb3dzIGlmIGFueSBjaGFuZ2VzIGFyZSBkZXRlY3RlZC5cbiAgICpcbiAgICogVGhpcyBpcyB1c2VkIGluIGRldmVsb3BtZW50IG1vZGUgdG8gdmVyaWZ5IHRoYXQgcnVubmluZyBjaGFuZ2UgZGV0ZWN0aW9uIGRvZXNuJ3RcbiAgICogaW50cm9kdWNlIG90aGVyIGNoYW5nZXMuXG4gICAqL1xuICBjaGVja05vQ2hhbmdlcygpOiB2b2lkIHtcbiAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICBjaGVja05vQ2hhbmdlc0ludGVybmFsKHRoaXMuX2xWaWV3LCB0aGlzLm5vdGlmeUVycm9ySGFuZGxlcik7XG4gICAgfVxuICB9XG5cbiAgYXR0YWNoVG9WaWV3Q29udGFpbmVyUmVmKCkge1xuICAgIGlmICh0aGlzLl9hcHBSZWYpIHtcbiAgICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgICAgUnVudGltZUVycm9yQ29kZS5WSUVXX0FMUkVBRFlfQVRUQUNIRUQsXG4gICAgICAgICAgbmdEZXZNb2RlICYmICdUaGlzIHZpZXcgaXMgYWxyZWFkeSBhdHRhY2hlZCBkaXJlY3RseSB0byB0aGUgQXBwbGljYXRpb25SZWYhJyk7XG4gICAgfVxuICAgIHRoaXMuX2F0dGFjaGVkVG9WaWV3Q29udGFpbmVyID0gdHJ1ZTtcbiAgfVxuXG4gIGRldGFjaEZyb21BcHBSZWYoKSB7XG4gICAgdGhpcy5fYXBwUmVmID0gbnVsbDtcbiAgICBkZXRhY2hWaWV3RnJvbURPTSh0aGlzLl9sVmlld1tUVklFV10sIHRoaXMuX2xWaWV3KTtcbiAgfVxuXG4gIGF0dGFjaFRvQXBwUmVmKGFwcFJlZjogVmlld1JlZlRyYWNrZXIpIHtcbiAgICBpZiAodGhpcy5fYXR0YWNoZWRUb1ZpZXdDb250YWluZXIpIHtcbiAgICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgICAgUnVudGltZUVycm9yQ29kZS5WSUVXX0FMUkVBRFlfQVRUQUNIRUQsXG4gICAgICAgICAgbmdEZXZNb2RlICYmICdUaGlzIHZpZXcgaXMgYWxyZWFkeSBhdHRhY2hlZCB0byBhIFZpZXdDb250YWluZXIhJyk7XG4gICAgfVxuICAgIHRoaXMuX2FwcFJlZiA9IGFwcFJlZjtcbiAgICB1cGRhdGVBbmNlc3RvclRyYXZlcnNhbEZsYWdzT25BdHRhY2godGhpcy5fbFZpZXcpO1xuICB9XG59XG4iXX0=