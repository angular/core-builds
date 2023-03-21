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
import { checkNoChangesInternal, detectChangesInternal, markViewDirty, storeCleanupWithContext } from './instructions/shared';
import { CONTAINER_HEADER_OFFSET, VIEW_REFS } from './interfaces/container';
import { isLContainer } from './interfaces/type_checks';
import { CONTEXT, FLAGS, PARENT, TVIEW } from './interfaces/view';
import { destroyLView, detachView, renderDetachView } from './node_manipulation';
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
    _cdRefInjectingView) {
        this._lView = _lView;
        this._cdRefInjectingView = _cdRefInjectingView;
        this._appRef = null;
        this._attachedToViewContainer = false;
    }
    get context() {
        return this._lView[CONTEXT];
    }
    set context(value) {
        this._lView[CONTEXT] = value;
    }
    get destroyed() {
        return (this._lView[FLAGS] & 128 /* LViewFlags.Destroyed */) === 128 /* LViewFlags.Destroyed */;
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
        storeCleanupWithContext(this._lView[TVIEW], this._lView, null, callback);
    }
    /**
     * Marks a view and all of its ancestors dirty.
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
    detach() {
        this._lView[FLAGS] &= ~64 /* LViewFlags.Attached */;
    }
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
        this._lView[FLAGS] |= 64 /* LViewFlags.Attached */;
    }
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
    detectChanges() {
        detectChangesInternal(this._lView[TVIEW], this._lView, this.context);
    }
    /**
     * Checks the change detector and its children, and throws if any changes are detected.
     *
     * This is used in development mode to verify that running change detection doesn't
     * introduce other changes.
     */
    checkNoChanges() {
        if (ngDevMode) {
            checkNoChangesInternal(this._lView[TVIEW], this._lView, this.context);
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
        renderDetachView(this._lView[TVIEW], this._lView);
    }
    attachToAppRef(appRef) {
        if (this._attachedToViewContainer) {
            throw new RuntimeError(902 /* RuntimeErrorCode.VIEW_ALREADY_ATTACHED */, ngDevMode && 'This view is already attached to a ViewContainer!');
        }
        this._appRef = appRef;
    }
}
/** @internal */
export class RootViewRef extends ViewRef {
    constructor(_view) {
        super(_view);
        this._view = _view;
    }
    detectChanges() {
        const lView = this._view;
        const tView = lView[TVIEW];
        const context = lView[CONTEXT];
        detectChangesInternal(tView, lView, context, false);
    }
    checkNoChanges() {
        if (ngDevMode) {
            const lView = this._view;
            const tView = lView[TVIEW];
            const context = lView[CONTEXT];
            checkNoChangesInternal(tView, lView, context, false);
        }
    }
    get context() {
        return null;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld19yZWYuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3ZpZXdfcmVmLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUdILE9BQU8sRUFBQyxZQUFZLEVBQW1CLE1BQU0sV0FBVyxDQUFDO0FBRXpELE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNwRCxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFFM0MsT0FBTyxFQUFDLGtCQUFrQixFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDMUQsT0FBTyxFQUFDLHNCQUFzQixFQUFFLHFCQUFxQixFQUFFLGFBQWEsRUFBRSx1QkFBdUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQzVILE9BQU8sRUFBQyx1QkFBdUIsRUFBRSxTQUFTLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUMxRSxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFDdEQsT0FBTyxFQUFDLE9BQU8sRUFBRSxLQUFLLEVBQXFCLE1BQU0sRUFBRSxLQUFLLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNuRixPQUFPLEVBQUMsWUFBWSxFQUFFLFVBQVUsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBUS9FLE1BQU0sT0FBTyxPQUFPO0lBSWxCLElBQUksU0FBUztRQUNYLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDMUIsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzNCLE9BQU8sa0JBQWtCLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ2hFLENBQUM7SUFFRDtJQUNJOzs7Ozs7Ozs7O09BVUc7SUFDSSxNQUFhO0lBRXBC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Qy9CLHFCQUFxQixDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3RELENBQUM7SUFFUSxjQUFjO1FBQ3JCLElBQUksU0FBUyxFQUFFO1lBQ2IsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUN6QixNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDM0IsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQy9CLHNCQUFzQixDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQ3REO0lBQ0gsQ0FBQztJQUVELElBQWEsT0FBTztRQUNsQixPQUFPLElBQUssQ0FBQztJQUNmLENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0NoYW5nZURldGVjdG9yUmVmfSBmcm9tICcuLi9jaGFuZ2VfZGV0ZWN0aW9uL2NoYW5nZV9kZXRlY3Rvcl9yZWYnO1xuaW1wb3J0IHtSdW50aW1lRXJyb3IsIFJ1bnRpbWVFcnJvckNvZGV9IGZyb20gJy4uL2Vycm9ycyc7XG5pbXBvcnQge0VtYmVkZGVkVmlld1JlZiwgSW50ZXJuYWxWaWV3UmVmLCBWaWV3UmVmVHJhY2tlcn0gZnJvbSAnLi4vbGlua2VyL3ZpZXdfcmVmJztcbmltcG9ydCB7cmVtb3ZlRnJvbUFycmF5fSBmcm9tICcuLi91dGlsL2FycmF5X3V0aWxzJztcbmltcG9ydCB7YXNzZXJ0RXF1YWx9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcblxuaW1wb3J0IHtjb2xsZWN0TmF0aXZlTm9kZXN9IGZyb20gJy4vY29sbGVjdF9uYXRpdmVfbm9kZXMnO1xuaW1wb3J0IHtjaGVja05vQ2hhbmdlc0ludGVybmFsLCBkZXRlY3RDaGFuZ2VzSW50ZXJuYWwsIG1hcmtWaWV3RGlydHksIHN0b3JlQ2xlYW51cFdpdGhDb250ZXh0fSBmcm9tICcuL2luc3RydWN0aW9ucy9zaGFyZWQnO1xuaW1wb3J0IHtDT05UQUlORVJfSEVBREVSX09GRlNFVCwgVklFV19SRUZTfSBmcm9tICcuL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7aXNMQ29udGFpbmVyfSBmcm9tICcuL2ludGVyZmFjZXMvdHlwZV9jaGVja3MnO1xuaW1wb3J0IHtDT05URVhULCBGTEFHUywgTFZpZXcsIExWaWV3RmxhZ3MsIFBBUkVOVCwgVFZJRVd9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7ZGVzdHJveUxWaWV3LCBkZXRhY2hWaWV3LCByZW5kZXJEZXRhY2hWaWV3fSBmcm9tICcuL25vZGVfbWFuaXB1bGF0aW9uJztcblxuXG4vLyBOZWVkZWQgZHVlIHRvIHRzaWNrbGUgZG93bmxldmVsaW5nIHdoZXJlIG11bHRpcGxlIGBpbXBsZW1lbnRzYCB3aXRoIGNsYXNzZXMgY3JlYXRlc1xuLy8gbXVsdGlwbGUgQGV4dGVuZHMgaW4gQ2xvc3VyZSBhbm5vdGF0aW9ucywgd2hpY2ggaXMgaWxsZWdhbC4gVGhpcyB3b3JrYXJvdW5kIGZpeGVzXG4vLyB0aGUgbXVsdGlwbGUgQGV4dGVuZHMgYnkgbWFraW5nIHRoZSBhbm5vdGF0aW9uIEBpbXBsZW1lbnRzIGluc3RlYWRcbmludGVyZmFjZSBDaGFuZ2VEZXRlY3RvclJlZkludGVyZmFjZSBleHRlbmRzIENoYW5nZURldGVjdG9yUmVmIHt9XG5cbmV4cG9ydCBjbGFzcyBWaWV3UmVmPFQ+IGltcGxlbWVudHMgRW1iZWRkZWRWaWV3UmVmPFQ+LCBJbnRlcm5hbFZpZXdSZWYsIENoYW5nZURldGVjdG9yUmVmSW50ZXJmYWNlIHtcbiAgcHJpdmF0ZSBfYXBwUmVmOiBWaWV3UmVmVHJhY2tlcnxudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBfYXR0YWNoZWRUb1ZpZXdDb250YWluZXIgPSBmYWxzZTtcblxuICBnZXQgcm9vdE5vZGVzKCk6IGFueVtdIHtcbiAgICBjb25zdCBsVmlldyA9IHRoaXMuX2xWaWV3O1xuICAgIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICAgIHJldHVybiBjb2xsZWN0TmF0aXZlTm9kZXModFZpZXcsIGxWaWV3LCB0Vmlldy5maXJzdENoaWxkLCBbXSk7XG4gIH1cblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIC8qKlxuICAgICAgICogVGhpcyByZXByZXNlbnRzIGBMVmlld2AgYXNzb2NpYXRlZCB3aXRoIHRoZSBjb21wb25lbnQgd2hlbiBWaWV3UmVmIGlzIGEgQ2hhbmdlRGV0ZWN0b3JSZWYuXG4gICAgICAgKlxuICAgICAgICogV2hlbiBWaWV3UmVmIGlzIGNyZWF0ZWQgZm9yIGEgZHluYW1pYyBjb21wb25lbnQsIHRoaXMgYWxzbyByZXByZXNlbnRzIHRoZSBgTFZpZXdgIGZvciB0aGVcbiAgICAgICAqIGNvbXBvbmVudC5cbiAgICAgICAqXG4gICAgICAgKiBGb3IgYSBcInJlZ3VsYXJcIiBWaWV3UmVmIGNyZWF0ZWQgZm9yIGFuIGVtYmVkZGVkIHZpZXcsIHRoaXMgaXMgdGhlIGBMVmlld2AgZm9yIHRoZSBlbWJlZGRlZFxuICAgICAgICogdmlldy5cbiAgICAgICAqXG4gICAgICAgKiBAaW50ZXJuYWxcbiAgICAgICAqL1xuICAgICAgcHVibGljIF9sVmlldzogTFZpZXcsXG5cbiAgICAgIC8qKlxuICAgICAgICogVGhpcyByZXByZXNlbnRzIHRoZSBgTFZpZXdgIGFzc29jaWF0ZWQgd2l0aCB0aGUgcG9pbnQgd2hlcmUgYENoYW5nZURldGVjdG9yUmVmYCB3YXNcbiAgICAgICAqIHJlcXVlc3RlZC5cbiAgICAgICAqXG4gICAgICAgKiBUaGlzIG1heSBiZSBkaWZmZXJlbnQgZnJvbSBgX2xWaWV3YCBpZiB0aGUgYF9jZFJlZkluamVjdGluZ1ZpZXdgIGlzIGFuIGVtYmVkZGVkIHZpZXcuXG4gICAgICAgKi9cbiAgICAgIHByaXZhdGUgX2NkUmVmSW5qZWN0aW5nVmlldz86IExWaWV3KSB7fVxuXG4gIGdldCBjb250ZXh0KCk6IFQge1xuICAgIHJldHVybiB0aGlzLl9sVmlld1tDT05URVhUXSBhcyB1bmtub3duIGFzIFQ7XG4gIH1cblxuICBzZXQgY29udGV4dCh2YWx1ZTogVCkge1xuICAgIHRoaXMuX2xWaWV3W0NPTlRFWFRdID0gdmFsdWUgYXMgdW5rbm93biBhcyB7fTtcbiAgfVxuXG4gIGdldCBkZXN0cm95ZWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuICh0aGlzLl9sVmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkRlc3Ryb3llZCkgPT09IExWaWV3RmxhZ3MuRGVzdHJveWVkO1xuICB9XG5cbiAgZGVzdHJveSgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fYXBwUmVmKSB7XG4gICAgICB0aGlzLl9hcHBSZWYuZGV0YWNoVmlldyh0aGlzKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuX2F0dGFjaGVkVG9WaWV3Q29udGFpbmVyKSB7XG4gICAgICBjb25zdCBwYXJlbnQgPSB0aGlzLl9sVmlld1tQQVJFTlRdO1xuICAgICAgaWYgKGlzTENvbnRhaW5lcihwYXJlbnQpKSB7XG4gICAgICAgIGNvbnN0IHZpZXdSZWZzID0gcGFyZW50W1ZJRVdfUkVGU10gYXMgVmlld1JlZjx1bmtub3duPltdIHwgbnVsbDtcbiAgICAgICAgY29uc3QgaW5kZXggPSB2aWV3UmVmcyA/IHZpZXdSZWZzLmluZGV4T2YodGhpcykgOiAtMTtcbiAgICAgICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgICAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgICAgICAgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgICAgICBpbmRleCwgcGFyZW50LmluZGV4T2YodGhpcy5fbFZpZXcpIC0gQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQsXG4gICAgICAgICAgICAgICAgICAnQW4gYXR0YWNoZWQgdmlldyBzaG91bGQgYmUgaW4gdGhlIHNhbWUgcG9zaXRpb24gd2l0aGluIGl0cyBjb250YWluZXIgYXMgaXRzIFZpZXdSZWYgaW4gdGhlIFZJRVdfUkVGUyBhcnJheS4nKTtcbiAgICAgICAgICBkZXRhY2hWaWV3KHBhcmVudCwgaW5kZXgpO1xuICAgICAgICAgIHJlbW92ZUZyb21BcnJheSh2aWV3UmVmcyEsIGluZGV4KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhpcy5fYXR0YWNoZWRUb1ZpZXdDb250YWluZXIgPSBmYWxzZTtcbiAgICB9XG4gICAgZGVzdHJveUxWaWV3KHRoaXMuX2xWaWV3W1RWSUVXXSwgdGhpcy5fbFZpZXcpO1xuICB9XG5cbiAgb25EZXN0cm95KGNhbGxiYWNrOiBGdW5jdGlvbikge1xuICAgIHN0b3JlQ2xlYW51cFdpdGhDb250ZXh0KHRoaXMuX2xWaWV3W1RWSUVXXSwgdGhpcy5fbFZpZXcsIG51bGwsIGNhbGxiYWNrKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBNYXJrcyBhIHZpZXcgYW5kIGFsbCBvZiBpdHMgYW5jZXN0b3JzIGRpcnR5LlxuICAgKlxuICAgKiBUaGlzIGNhbiBiZSB1c2VkIHRvIGVuc3VyZSBhbiB7QGxpbmsgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kjT25QdXNoIE9uUHVzaH0gY29tcG9uZW50IGlzXG4gICAqIGNoZWNrZWQgd2hlbiBpdCBuZWVkcyB0byBiZSByZS1yZW5kZXJlZCBidXQgdGhlIHR3byBub3JtYWwgdHJpZ2dlcnMgaGF2ZW4ndCBtYXJrZWQgaXRcbiAgICogZGlydHkgKGkuZS4gaW5wdXRzIGhhdmVuJ3QgY2hhbmdlZCBhbmQgZXZlbnRzIGhhdmVuJ3QgZmlyZWQgaW4gdGhlIHZpZXcpLlxuICAgKlxuICAgKiA8IS0tIFRPRE86IEFkZCBhIGxpbmsgdG8gYSBjaGFwdGVyIG9uIE9uUHVzaCBjb21wb25lbnRzIC0tPlxuICAgKlxuICAgKiBAdXNhZ2VOb3Rlc1xuICAgKiAjIyMgRXhhbXBsZVxuICAgKlxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIEBDb21wb25lbnQoe1xuICAgKiAgIHNlbGVjdG9yOiAnYXBwLXJvb3QnLFxuICAgKiAgIHRlbXBsYXRlOiBgTnVtYmVyIG9mIHRpY2tzOiB7e251bWJlck9mVGlja3N9fWBcbiAgICogICBjaGFuZ2VEZXRlY3Rpb246IENoYW5nZURldGVjdGlvblN0cmF0ZWd5Lk9uUHVzaCxcbiAgICogfSlcbiAgICogY2xhc3MgQXBwQ29tcG9uZW50IHtcbiAgICogICBudW1iZXJPZlRpY2tzID0gMDtcbiAgICpcbiAgICogICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlZjogQ2hhbmdlRGV0ZWN0b3JSZWYpIHtcbiAgICogICAgIHNldEludGVydmFsKCgpID0+IHtcbiAgICogICAgICAgdGhpcy5udW1iZXJPZlRpY2tzKys7XG4gICAqICAgICAgIC8vIHRoZSBmb2xsb3dpbmcgaXMgcmVxdWlyZWQsIG90aGVyd2lzZSB0aGUgdmlldyB3aWxsIG5vdCBiZSB1cGRhdGVkXG4gICAqICAgICAgIHRoaXMucmVmLm1hcmtGb3JDaGVjaygpO1xuICAgKiAgICAgfSwgMTAwMCk7XG4gICAqICAgfVxuICAgKiB9XG4gICAqIGBgYFxuICAgKi9cbiAgbWFya0ZvckNoZWNrKCk6IHZvaWQge1xuICAgIG1hcmtWaWV3RGlydHkodGhpcy5fY2RSZWZJbmplY3RpbmdWaWV3IHx8IHRoaXMuX2xWaWV3KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRhY2hlcyB0aGUgdmlldyBmcm9tIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHRyZWUuXG4gICAqXG4gICAqIERldGFjaGVkIHZpZXdzIHdpbGwgbm90IGJlIGNoZWNrZWQgZHVyaW5nIGNoYW5nZSBkZXRlY3Rpb24gcnVucyB1bnRpbCB0aGV5IGFyZVxuICAgKiByZS1hdHRhY2hlZCwgZXZlbiBpZiB0aGV5IGFyZSBkaXJ0eS4gYGRldGFjaGAgY2FuIGJlIHVzZWQgaW4gY29tYmluYXRpb24gd2l0aFxuICAgKiB7QGxpbmsgQ2hhbmdlRGV0ZWN0b3JSZWYjZGV0ZWN0Q2hhbmdlcyBkZXRlY3RDaGFuZ2VzfSB0byBpbXBsZW1lbnQgbG9jYWwgY2hhbmdlXG4gICAqIGRldGVjdGlvbiBjaGVja3MuXG4gICAqXG4gICAqIDwhLS0gVE9ETzogQWRkIGEgbGluayB0byBhIGNoYXB0ZXIgb24gZGV0YWNoL3JlYXR0YWNoL2xvY2FsIGRpZ2VzdCAtLT5cbiAgICogPCEtLSBUT0RPOiBBZGQgYSBsaXZlIGRlbW8gb25jZSByZWYuZGV0ZWN0Q2hhbmdlcyBpcyBtZXJnZWQgaW50byBtYXN0ZXIgLS0+XG4gICAqXG4gICAqIEB1c2FnZU5vdGVzXG4gICAqICMjIyBFeGFtcGxlXG4gICAqXG4gICAqIFRoZSBmb2xsb3dpbmcgZXhhbXBsZSBkZWZpbmVzIGEgY29tcG9uZW50IHdpdGggYSBsYXJnZSBsaXN0IG9mIHJlYWRvbmx5IGRhdGEuXG4gICAqIEltYWdpbmUgdGhlIGRhdGEgY2hhbmdlcyBjb25zdGFudGx5LCBtYW55IHRpbWVzIHBlciBzZWNvbmQuIEZvciBwZXJmb3JtYW5jZSByZWFzb25zLFxuICAgKiB3ZSB3YW50IHRvIGNoZWNrIGFuZCB1cGRhdGUgdGhlIGxpc3QgZXZlcnkgZml2ZSBzZWNvbmRzLiBXZSBjYW4gZG8gdGhhdCBieSBkZXRhY2hpbmdcbiAgICogdGhlIGNvbXBvbmVudCdzIGNoYW5nZSBkZXRlY3RvciBhbmQgZG9pbmcgYSBsb2NhbCBjaGVjayBldmVyeSBmaXZlIHNlY29uZHMuXG4gICAqXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogY2xhc3MgRGF0YVByb3ZpZGVyIHtcbiAgICogICAvLyBpbiBhIHJlYWwgYXBwbGljYXRpb24gdGhlIHJldHVybmVkIGRhdGEgd2lsbCBiZSBkaWZmZXJlbnQgZXZlcnkgdGltZVxuICAgKiAgIGdldCBkYXRhKCkge1xuICAgKiAgICAgcmV0dXJuIFsxLDIsMyw0LDVdO1xuICAgKiAgIH1cbiAgICogfVxuICAgKlxuICAgKiBAQ29tcG9uZW50KHtcbiAgICogICBzZWxlY3RvcjogJ2dpYW50LWxpc3QnLFxuICAgKiAgIHRlbXBsYXRlOiBgXG4gICAqICAgICA8bGkgKm5nRm9yPVwibGV0IGQgb2YgZGF0YVByb3ZpZGVyLmRhdGFcIj5EYXRhIHt7ZH19PC9saT5cbiAgICogICBgLFxuICAgKiB9KVxuICAgKiBjbGFzcyBHaWFudExpc3Qge1xuICAgKiAgIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVmOiBDaGFuZ2VEZXRlY3RvclJlZiwgcHJpdmF0ZSBkYXRhUHJvdmlkZXI6IERhdGFQcm92aWRlcikge1xuICAgKiAgICAgcmVmLmRldGFjaCgpO1xuICAgKiAgICAgc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgKiAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAqICAgICB9LCA1MDAwKTtcbiAgICogICB9XG4gICAqIH1cbiAgICpcbiAgICogQENvbXBvbmVudCh7XG4gICAqICAgc2VsZWN0b3I6ICdhcHAnLFxuICAgKiAgIHByb3ZpZGVyczogW0RhdGFQcm92aWRlcl0sXG4gICAqICAgdGVtcGxhdGU6IGBcbiAgICogICAgIDxnaWFudC1saXN0PjxnaWFudC1saXN0PlxuICAgKiAgIGAsXG4gICAqIH0pXG4gICAqIGNsYXNzIEFwcCB7XG4gICAqIH1cbiAgICogYGBgXG4gICAqL1xuICBkZXRhY2goKTogdm9pZCB7XG4gICAgdGhpcy5fbFZpZXdbRkxBR1NdICY9IH5MVmlld0ZsYWdzLkF0dGFjaGVkO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlLWF0dGFjaGVzIGEgdmlldyB0byB0aGUgY2hhbmdlIGRldGVjdGlvbiB0cmVlLlxuICAgKlxuICAgKiBUaGlzIGNhbiBiZSB1c2VkIHRvIHJlLWF0dGFjaCB2aWV3cyB0aGF0IHdlcmUgcHJldmlvdXNseSBkZXRhY2hlZCBmcm9tIHRoZSB0cmVlXG4gICAqIHVzaW5nIHtAbGluayBDaGFuZ2VEZXRlY3RvclJlZiNkZXRhY2ggZGV0YWNofS4gVmlld3MgYXJlIGF0dGFjaGVkIHRvIHRoZSB0cmVlIGJ5IGRlZmF1bHQuXG4gICAqXG4gICAqIDwhLS0gVE9ETzogQWRkIGEgbGluayB0byBhIGNoYXB0ZXIgb24gZGV0YWNoL3JlYXR0YWNoL2xvY2FsIGRpZ2VzdCAtLT5cbiAgICpcbiAgICogQHVzYWdlTm90ZXNcbiAgICogIyMjIEV4YW1wbGVcbiAgICpcbiAgICogVGhlIGZvbGxvd2luZyBleGFtcGxlIGNyZWF0ZXMgYSBjb21wb25lbnQgZGlzcGxheWluZyBgbGl2ZWAgZGF0YS4gVGhlIGNvbXBvbmVudCB3aWxsIGRldGFjaFxuICAgKiBpdHMgY2hhbmdlIGRldGVjdG9yIGZyb20gdGhlIG1haW4gY2hhbmdlIGRldGVjdG9yIHRyZWUgd2hlbiB0aGUgY29tcG9uZW50J3MgbGl2ZSBwcm9wZXJ0eVxuICAgKiBpcyBzZXQgdG8gZmFsc2UuXG4gICAqXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogY2xhc3MgRGF0YVByb3ZpZGVyIHtcbiAgICogICBkYXRhID0gMTtcbiAgICpcbiAgICogICBjb25zdHJ1Y3RvcigpIHtcbiAgICogICAgIHNldEludGVydmFsKCgpID0+IHtcbiAgICogICAgICAgdGhpcy5kYXRhID0gdGhpcy5kYXRhICogMjtcbiAgICogICAgIH0sIDUwMCk7XG4gICAqICAgfVxuICAgKiB9XG4gICAqXG4gICAqIEBDb21wb25lbnQoe1xuICAgKiAgIHNlbGVjdG9yOiAnbGl2ZS1kYXRhJyxcbiAgICogICBpbnB1dHM6IFsnbGl2ZSddLFxuICAgKiAgIHRlbXBsYXRlOiAnRGF0YToge3tkYXRhUHJvdmlkZXIuZGF0YX19J1xuICAgKiB9KVxuICAgKiBjbGFzcyBMaXZlRGF0YSB7XG4gICAqICAgY29uc3RydWN0b3IocHJpdmF0ZSByZWY6IENoYW5nZURldGVjdG9yUmVmLCBwcml2YXRlIGRhdGFQcm92aWRlcjogRGF0YVByb3ZpZGVyKSB7fVxuICAgKlxuICAgKiAgIHNldCBsaXZlKHZhbHVlKSB7XG4gICAqICAgICBpZiAodmFsdWUpIHtcbiAgICogICAgICAgdGhpcy5yZWYucmVhdHRhY2goKTtcbiAgICogICAgIH0gZWxzZSB7XG4gICAqICAgICAgIHRoaXMucmVmLmRldGFjaCgpO1xuICAgKiAgICAgfVxuICAgKiAgIH1cbiAgICogfVxuICAgKlxuICAgKiBAQ29tcG9uZW50KHtcbiAgICogICBzZWxlY3RvcjogJ2FwcC1yb290JyxcbiAgICogICBwcm92aWRlcnM6IFtEYXRhUHJvdmlkZXJdLFxuICAgKiAgIHRlbXBsYXRlOiBgXG4gICAqICAgICBMaXZlIFVwZGF0ZTogPGlucHV0IHR5cGU9XCJjaGVja2JveFwiIFsobmdNb2RlbCldPVwibGl2ZVwiPlxuICAgKiAgICAgPGxpdmUtZGF0YSBbbGl2ZV09XCJsaXZlXCI+PGxpdmUtZGF0YT5cbiAgICogICBgLFxuICAgKiB9KVxuICAgKiBjbGFzcyBBcHBDb21wb25lbnQge1xuICAgKiAgIGxpdmUgPSB0cnVlO1xuICAgKiB9XG4gICAqIGBgYFxuICAgKi9cbiAgcmVhdHRhY2goKTogdm9pZCB7XG4gICAgdGhpcy5fbFZpZXdbRkxBR1NdIHw9IExWaWV3RmxhZ3MuQXR0YWNoZWQ7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIHRoZSB2aWV3IGFuZCBpdHMgY2hpbGRyZW4uXG4gICAqXG4gICAqIFRoaXMgY2FuIGFsc28gYmUgdXNlZCBpbiBjb21iaW5hdGlvbiB3aXRoIHtAbGluayBDaGFuZ2VEZXRlY3RvclJlZiNkZXRhY2ggZGV0YWNofSB0byBpbXBsZW1lbnRcbiAgICogbG9jYWwgY2hhbmdlIGRldGVjdGlvbiBjaGVja3MuXG4gICAqXG4gICAqIDwhLS0gVE9ETzogQWRkIGEgbGluayB0byBhIGNoYXB0ZXIgb24gZGV0YWNoL3JlYXR0YWNoL2xvY2FsIGRpZ2VzdCAtLT5cbiAgICogPCEtLSBUT0RPOiBBZGQgYSBsaXZlIGRlbW8gb25jZSByZWYuZGV0ZWN0Q2hhbmdlcyBpcyBtZXJnZWQgaW50byBtYXN0ZXIgLS0+XG4gICAqXG4gICAqIEB1c2FnZU5vdGVzXG4gICAqICMjIyBFeGFtcGxlXG4gICAqXG4gICAqIFRoZSBmb2xsb3dpbmcgZXhhbXBsZSBkZWZpbmVzIGEgY29tcG9uZW50IHdpdGggYSBsYXJnZSBsaXN0IG9mIHJlYWRvbmx5IGRhdGEuXG4gICAqIEltYWdpbmUsIHRoZSBkYXRhIGNoYW5nZXMgY29uc3RhbnRseSwgbWFueSB0aW1lcyBwZXIgc2Vjb25kLiBGb3IgcGVyZm9ybWFuY2UgcmVhc29ucyxcbiAgICogd2Ugd2FudCB0byBjaGVjayBhbmQgdXBkYXRlIHRoZSBsaXN0IGV2ZXJ5IGZpdmUgc2Vjb25kcy5cbiAgICpcbiAgICogV2UgY2FuIGRvIHRoYXQgYnkgZGV0YWNoaW5nIHRoZSBjb21wb25lbnQncyBjaGFuZ2UgZGV0ZWN0b3IgYW5kIGRvaW5nIGEgbG9jYWwgY2hhbmdlIGRldGVjdGlvblxuICAgKiBjaGVjayBldmVyeSBmaXZlIHNlY29uZHMuXG4gICAqXG4gICAqIFNlZSB7QGxpbmsgQ2hhbmdlRGV0ZWN0b3JSZWYjZGV0YWNoIGRldGFjaH0gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAqL1xuICBkZXRlY3RDaGFuZ2VzKCk6IHZvaWQge1xuICAgIGRldGVjdENoYW5nZXNJbnRlcm5hbCh0aGlzLl9sVmlld1tUVklFV10sIHRoaXMuX2xWaWV3LCB0aGlzLmNvbnRleHQgYXMgdW5rbm93biBhcyB7fSk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIHRoZSBjaGFuZ2UgZGV0ZWN0b3IgYW5kIGl0cyBjaGlsZHJlbiwgYW5kIHRocm93cyBpZiBhbnkgY2hhbmdlcyBhcmUgZGV0ZWN0ZWQuXG4gICAqXG4gICAqIFRoaXMgaXMgdXNlZCBpbiBkZXZlbG9wbWVudCBtb2RlIHRvIHZlcmlmeSB0aGF0IHJ1bm5pbmcgY2hhbmdlIGRldGVjdGlvbiBkb2Vzbid0XG4gICAqIGludHJvZHVjZSBvdGhlciBjaGFuZ2VzLlxuICAgKi9cbiAgY2hlY2tOb0NoYW5nZXMoKTogdm9pZCB7XG4gICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgY2hlY2tOb0NoYW5nZXNJbnRlcm5hbCh0aGlzLl9sVmlld1tUVklFV10sIHRoaXMuX2xWaWV3LCB0aGlzLmNvbnRleHQgYXMgdW5rbm93biBhcyB7fSk7XG4gICAgfVxuICB9XG5cbiAgYXR0YWNoVG9WaWV3Q29udGFpbmVyUmVmKCkge1xuICAgIGlmICh0aGlzLl9hcHBSZWYpIHtcbiAgICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgICAgUnVudGltZUVycm9yQ29kZS5WSUVXX0FMUkVBRFlfQVRUQUNIRUQsXG4gICAgICAgICAgbmdEZXZNb2RlICYmICdUaGlzIHZpZXcgaXMgYWxyZWFkeSBhdHRhY2hlZCBkaXJlY3RseSB0byB0aGUgQXBwbGljYXRpb25SZWYhJyk7XG4gICAgfVxuICAgIHRoaXMuX2F0dGFjaGVkVG9WaWV3Q29udGFpbmVyID0gdHJ1ZTtcbiAgfVxuXG4gIGRldGFjaEZyb21BcHBSZWYoKSB7XG4gICAgdGhpcy5fYXBwUmVmID0gbnVsbDtcbiAgICByZW5kZXJEZXRhY2hWaWV3KHRoaXMuX2xWaWV3W1RWSUVXXSwgdGhpcy5fbFZpZXcpO1xuICB9XG5cbiAgYXR0YWNoVG9BcHBSZWYoYXBwUmVmOiBWaWV3UmVmVHJhY2tlcikge1xuICAgIGlmICh0aGlzLl9hdHRhY2hlZFRvVmlld0NvbnRhaW5lcikge1xuICAgICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgICBSdW50aW1lRXJyb3JDb2RlLlZJRVdfQUxSRUFEWV9BVFRBQ0hFRCxcbiAgICAgICAgICBuZ0Rldk1vZGUgJiYgJ1RoaXMgdmlldyBpcyBhbHJlYWR5IGF0dGFjaGVkIHRvIGEgVmlld0NvbnRhaW5lciEnKTtcbiAgICB9XG4gICAgdGhpcy5fYXBwUmVmID0gYXBwUmVmO1xuICB9XG59XG5cbi8qKiBAaW50ZXJuYWwgKi9cbmV4cG9ydCBjbGFzcyBSb290Vmlld1JlZjxUPiBleHRlbmRzIFZpZXdSZWY8VD4ge1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgX3ZpZXc6IExWaWV3KSB7XG4gICAgc3VwZXIoX3ZpZXcpO1xuICB9XG5cbiAgb3ZlcnJpZGUgZGV0ZWN0Q2hhbmdlcygpOiB2b2lkIHtcbiAgICBjb25zdCBsVmlldyA9IHRoaXMuX3ZpZXc7XG4gICAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gICAgY29uc3QgY29udGV4dCA9IGxWaWV3W0NPTlRFWFRdO1xuICAgIGRldGVjdENoYW5nZXNJbnRlcm5hbCh0VmlldywgbFZpZXcsIGNvbnRleHQsIGZhbHNlKTtcbiAgfVxuXG4gIG92ZXJyaWRlIGNoZWNrTm9DaGFuZ2VzKCk6IHZvaWQge1xuICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgIGNvbnN0IGxWaWV3ID0gdGhpcy5fdmlldztcbiAgICAgIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICAgICAgY29uc3QgY29udGV4dCA9IGxWaWV3W0NPTlRFWFRdO1xuICAgICAgY2hlY2tOb0NoYW5nZXNJbnRlcm5hbCh0VmlldywgbFZpZXcsIGNvbnRleHQsIGZhbHNlKTtcbiAgICB9XG4gIH1cblxuICBvdmVycmlkZSBnZXQgY29udGV4dCgpOiBUIHtcbiAgICByZXR1cm4gbnVsbCE7XG4gIH1cbn1cbiJdfQ==