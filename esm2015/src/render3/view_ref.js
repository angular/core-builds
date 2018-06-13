/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { checkNoChanges, detectChanges, markViewDirty } from './instructions';
import { notImplemented } from './util';
/**
 * @template T
 */
export class ViewRef {
    /**
     * @param {?} _view
     * @param {?} context
     */
    constructor(_view, context) {
        this._view = _view;
        this.context = /** @type {?} */ ((context));
    }
    /**
     * \@internal
     * @param {?} view
     * @param {?} context
     * @return {?}
     */
    _setComponentContext(view, context) {
        this._view = view;
        this.context = context;
    }
    /**
     * @return {?}
     */
    destroy() { notImplemented(); }
    /**
     * @param {?} callback
     * @return {?}
     */
    onDestroy(callback) { notImplemented(); }
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
    markForCheck() { markViewDirty(this._view); }
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
     *
     * \@Component({
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
    detach() { this._view.flags &= ~8 /* Attached */; }
    /**
     * Re-attaches a view to the change detection tree.
     *
     * This can be used to re-attach views that were previously detached from the tree
     * using {\@link ChangeDetectorRef#detach detach}. Views are attached to the tree by default.
     *
     * <!-- TODO: Add a link to a chapter on detach/reattach/local digest -->
     *
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
     *
     * \@Component({
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
    reattach() { this._view.flags |= 8 /* Attached */; }
    /**
     * Checks the view and its children.
     *
     * This can also be used in combination with {\@link ChangeDetectorRef#detach detach} to implement
     * local change detection checks.
     *
     * <!-- TODO: Add a link to a chapter on detach/reattach/local digest -->
     * <!-- TODO: Add a live demo once ref.detectChanges is merged into master -->
     *
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
    detectChanges() { detectChanges(this.context); }
    /**
     * Checks the change detector and its children, and throws if any changes are detected.
     *
     * This is used in development mode to verify that running change detection doesn't
     * introduce other changes.
     * @return {?}
     */
    checkNoChanges() { checkNoChanges(this.context); }
}
function ViewRef_tsickle_Closure_declarations() {
    /** @type {?} */
    ViewRef.prototype.context;
    /** @type {?} */
    ViewRef.prototype.rootNodes;
    /** @type {?} */
    ViewRef.prototype.destroyed;
    /** @type {?} */
    ViewRef.prototype._view;
}
/**
 * @template T
 */
export class EmbeddedViewRef extends ViewRef {
    /**
     * @param {?} viewNode
     * @param {?} template
     * @param {?} context
     */
    constructor(viewNode, template, context) {
        super(viewNode.data, context);
        this._lViewNode = viewNode;
    }
}
function EmbeddedViewRef_tsickle_Closure_declarations() {
    /**
     * \@internal
     * @type {?}
     */
    EmbeddedViewRef.prototype._lViewNode;
}
/**
 * Creates a ViewRef bundled with destroy functionality.
 *
 * @template T
 * @param {?} view
 * @param {?} context The context for this view
 * @return {?} The ViewRef
 */
export function createViewRef(view, context) {
    // TODO: add detectChanges back in when implementing ChangeDetectorRef.detectChanges
    return addDestroyable(new ViewRef(/** @type {?} */ ((view)), context));
}
/**
 * Interface for destroy logic. Implemented by addDestroyable.
 * @record
 * @template T
 */
export function DestroyRef() { }
function DestroyRef_tsickle_Closure_declarations() {
    /**
     * Whether or not this object has been destroyed
     * @type {?}
     */
    DestroyRef.prototype.destroyed;
    /**
     * Destroy the instance and call all onDestroy callbacks.
     * @type {?}
     */
    DestroyRef.prototype.destroy;
    /**
     * Register callbacks that should be called onDestroy
     * @type {?}
     */
    DestroyRef.prototype.onDestroy;
}
/**
 * Decorates an object with destroy logic (implementing the DestroyRef interface)
 * and returns the enhanced object.
 *
 * @template T, C
 * @param {?} obj The object to decorate
 * @return {?} The object with destroy logic
 */
export function addDestroyable(obj) {
    let /** @type {?} */ destroyFn = null;
    obj.destroyed = false;
    obj.destroy = function () {
        destroyFn && destroyFn.forEach((fn) => fn());
        this.destroyed = true;
    };
    obj.onDestroy = (fn) => (destroyFn || (destroyFn = [])).push(fn);
    return obj;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld19yZWYuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3ZpZXdfcmVmLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBVUEsT0FBTyxFQUFDLGNBQWMsRUFBRSxhQUFhLEVBQUUsYUFBYSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFJNUUsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLFFBQVEsQ0FBQzs7OztBQUV0QyxNQUFNOzs7OztJQUlKLFlBQW9CLEtBQVksRUFBRSxPQUFlO1FBQTdCLFVBQUssR0FBTCxLQUFLLENBQU87UUFBdUIsSUFBSSxDQUFDLE9BQU8sc0JBQUcsT0FBTyxFQUFFLENBQUM7S0FBRTs7Ozs7OztJQUdsRixvQkFBb0IsQ0FBQyxJQUFXLEVBQUUsT0FBVTtRQUMxQyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztRQUNsQixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztLQUN4Qjs7OztJQUVELE9BQU8sS0FBVyxjQUFjLEVBQUUsQ0FBQyxFQUFFOzs7OztJQUVyQyxTQUFTLENBQUMsUUFBa0IsSUFBSSxjQUFjLEVBQUUsQ0FBQyxFQUFFOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQW1DbkQsWUFBWSxLQUFXLGFBQWEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBc0RuRCxNQUFNLEtBQVcsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLElBQUksaUJBQW9CLENBQUMsRUFBRTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBeUQ1RCxRQUFRLEtBQVcsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLG9CQUF1QixDQUFDLEVBQUU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFzQjdELGFBQWEsS0FBVyxhQUFhLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUU7Ozs7Ozs7O0lBUXRELGNBQWMsS0FBVyxjQUFjLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUU7Q0FDekQ7Ozs7Ozs7Ozs7Ozs7O0FBR0QsTUFBTSxzQkFBMEIsU0FBUSxPQUFVOzs7Ozs7SUFNaEQsWUFBWSxRQUFtQixFQUFFLFFBQThCLEVBQUUsT0FBVTtRQUN6RSxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztRQUM5QixJQUFJLENBQUMsVUFBVSxHQUFHLFFBQVEsQ0FBQztLQUM1QjtDQUNGOzs7Ozs7Ozs7Ozs7Ozs7O0FBUUQsTUFBTSx3QkFBMkIsSUFBa0IsRUFBRSxPQUFVOztJQUU3RCxNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksT0FBTyxvQkFBQyxJQUFJLElBQUksT0FBTyxDQUFDLENBQUMsQ0FBQztDQUNyRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFtQkQsTUFBTSx5QkFBK0IsR0FBUTtJQUMzQyxxQkFBSSxTQUFTLEdBQW9CLElBQUksQ0FBQztJQUN0QyxHQUFHLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQztJQUN0QixHQUFHLENBQUMsT0FBTyxHQUFHO1FBQ1osU0FBUyxJQUFJLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDN0MsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7S0FDdkIsQ0FBQztJQUNGLEdBQUcsQ0FBQyxTQUFTLEdBQUcsQ0FBQyxFQUFZLEVBQUUsRUFBRSxDQUFDLENBQUMsU0FBUyxJQUFJLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQzNFLE1BQU0sQ0FBQyxHQUFHLENBQUM7Q0FDWiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtFbWJlZGRlZFZpZXdSZWYgYXMgdmlld0VuZ2luZV9FbWJlZGRlZFZpZXdSZWZ9IGZyb20gJy4uL2xpbmtlci92aWV3X3JlZic7XG5cbmltcG9ydCB7Y2hlY2tOb0NoYW5nZXMsIGRldGVjdENoYW5nZXMsIG1hcmtWaWV3RGlydHl9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zJztcbmltcG9ydCB7Q29tcG9uZW50VGVtcGxhdGV9IGZyb20gJy4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7TFZpZXdOb2RlfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge0xWaWV3LCBMVmlld0ZsYWdzfSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge25vdEltcGxlbWVudGVkfSBmcm9tICcuL3V0aWwnO1xuXG5leHBvcnQgY2xhc3MgVmlld1JlZjxUPiBpbXBsZW1lbnRzIHZpZXdFbmdpbmVfRW1iZWRkZWRWaWV3UmVmPFQ+IHtcbiAgY29udGV4dDogVDtcbiAgcm9vdE5vZGVzOiBhbnlbXTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF92aWV3OiBMVmlldywgY29udGV4dDogVHxudWxsLCApIHsgdGhpcy5jb250ZXh0ID0gY29udGV4dCAhOyB9XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfc2V0Q29tcG9uZW50Q29udGV4dCh2aWV3OiBMVmlldywgY29udGV4dDogVCkge1xuICAgIHRoaXMuX3ZpZXcgPSB2aWV3O1xuICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gIH1cblxuICBkZXN0cm95KCk6IHZvaWQgeyBub3RJbXBsZW1lbnRlZCgpOyB9XG4gIGRlc3Ryb3llZDogYm9vbGVhbjtcbiAgb25EZXN0cm95KGNhbGxiYWNrOiBGdW5jdGlvbikgeyBub3RJbXBsZW1lbnRlZCgpOyB9XG5cbiAgLyoqXG4gICAqIE1hcmtzIGEgdmlldyBhbmQgYWxsIG9mIGl0cyBhbmNlc3RvcnMgZGlydHkuXG4gICAqXG4gICAqIEl0IGFsc28gdHJpZ2dlcnMgY2hhbmdlIGRldGVjdGlvbiBieSBjYWxsaW5nIGBzY2hlZHVsZVRpY2tgIGludGVybmFsbHksIHdoaWNoIGNvYWxlc2Nlc1xuICAgKiBtdWx0aXBsZSBgbWFya0ZvckNoZWNrYCBjYWxscyB0byBpbnRvIG9uZSBjaGFuZ2UgZGV0ZWN0aW9uIHJ1bi5cbiAgICpcbiAgICogVGhpcyBjYW4gYmUgdXNlZCB0byBlbnN1cmUgYW4ge0BsaW5rIENoYW5nZURldGVjdGlvblN0cmF0ZWd5I09uUHVzaCBPblB1c2h9IGNvbXBvbmVudCBpc1xuICAgKiBjaGVja2VkIHdoZW4gaXQgbmVlZHMgdG8gYmUgcmUtcmVuZGVyZWQgYnV0IHRoZSB0d28gbm9ybWFsIHRyaWdnZXJzIGhhdmVuJ3QgbWFya2VkIGl0XG4gICAqIGRpcnR5IChpLmUuIGlucHV0cyBoYXZlbid0IGNoYW5nZWQgYW5kIGV2ZW50cyBoYXZlbid0IGZpcmVkIGluIHRoZSB2aWV3KS5cbiAgICpcbiAgICogPCEtLSBUT0RPOiBBZGQgYSBsaW5rIHRvIGEgY2hhcHRlciBvbiBPblB1c2ggY29tcG9uZW50cyAtLT5cbiAgICpcbiAgICogIyMjIEV4YW1wbGVcbiAgICpcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBAQ29tcG9uZW50KHtcbiAgICogICBzZWxlY3RvcjogJ215LWFwcCcsXG4gICAqICAgdGVtcGxhdGU6IGBOdW1iZXIgb2YgdGlja3M6IHt7bnVtYmVyT2ZUaWNrc319YFxuICAgKiAgIGNoYW5nZURldGVjdGlvbjogQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuT25QdXNoLFxuICAgKiB9KVxuICAgKiBjbGFzcyBBcHBDb21wb25lbnQge1xuICAgKiAgIG51bWJlck9mVGlja3MgPSAwO1xuICAgKlxuICAgKiAgIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVmOiBDaGFuZ2VEZXRlY3RvclJlZikge1xuICAgKiAgICAgc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgKiAgICAgICB0aGlzLm51bWJlck9mVGlja3MrKztcbiAgICogICAgICAgLy8gdGhlIGZvbGxvd2luZyBpcyByZXF1aXJlZCwgb3RoZXJ3aXNlIHRoZSB2aWV3IHdpbGwgbm90IGJlIHVwZGF0ZWRcbiAgICogICAgICAgdGhpcy5yZWYubWFya0ZvckNoZWNrKCk7XG4gICAqICAgICB9LCAxMDAwKTtcbiAgICogICB9XG4gICAqIH1cbiAgICogYGBgXG4gICAqL1xuICBtYXJrRm9yQ2hlY2soKTogdm9pZCB7IG1hcmtWaWV3RGlydHkodGhpcy5fdmlldyk7IH1cblxuICAvKipcbiAgICogRGV0YWNoZXMgdGhlIHZpZXcgZnJvbSB0aGUgY2hhbmdlIGRldGVjdGlvbiB0cmVlLlxuICAgKlxuICAgKiBEZXRhY2hlZCB2aWV3cyB3aWxsIG5vdCBiZSBjaGVja2VkIGR1cmluZyBjaGFuZ2UgZGV0ZWN0aW9uIHJ1bnMgdW50aWwgdGhleSBhcmVcbiAgICogcmUtYXR0YWNoZWQsIGV2ZW4gaWYgdGhleSBhcmUgZGlydHkuIGBkZXRhY2hgIGNhbiBiZSB1c2VkIGluIGNvbWJpbmF0aW9uIHdpdGhcbiAgICoge0BsaW5rIENoYW5nZURldGVjdG9yUmVmI2RldGVjdENoYW5nZXMgZGV0ZWN0Q2hhbmdlc30gdG8gaW1wbGVtZW50IGxvY2FsIGNoYW5nZVxuICAgKiBkZXRlY3Rpb24gY2hlY2tzLlxuICAgKlxuICAgKiA8IS0tIFRPRE86IEFkZCBhIGxpbmsgdG8gYSBjaGFwdGVyIG9uIGRldGFjaC9yZWF0dGFjaC9sb2NhbCBkaWdlc3QgLS0+XG4gICAqIDwhLS0gVE9ETzogQWRkIGEgbGl2ZSBkZW1vIG9uY2UgcmVmLmRldGVjdENoYW5nZXMgaXMgbWVyZ2VkIGludG8gbWFzdGVyIC0tPlxuICAgKlxuICAgKiAjIyMgRXhhbXBsZVxuICAgKlxuICAgKiBUaGUgZm9sbG93aW5nIGV4YW1wbGUgZGVmaW5lcyBhIGNvbXBvbmVudCB3aXRoIGEgbGFyZ2UgbGlzdCBvZiByZWFkb25seSBkYXRhLlxuICAgKiBJbWFnaW5lIHRoZSBkYXRhIGNoYW5nZXMgY29uc3RhbnRseSwgbWFueSB0aW1lcyBwZXIgc2Vjb25kLiBGb3IgcGVyZm9ybWFuY2UgcmVhc29ucyxcbiAgICogd2Ugd2FudCB0byBjaGVjayBhbmQgdXBkYXRlIHRoZSBsaXN0IGV2ZXJ5IGZpdmUgc2Vjb25kcy4gV2UgY2FuIGRvIHRoYXQgYnkgZGV0YWNoaW5nXG4gICAqIHRoZSBjb21wb25lbnQncyBjaGFuZ2UgZGV0ZWN0b3IgYW5kIGRvaW5nIGEgbG9jYWwgY2hlY2sgZXZlcnkgZml2ZSBzZWNvbmRzLlxuICAgKlxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIGNsYXNzIERhdGFQcm92aWRlciB7XG4gICAqICAgLy8gaW4gYSByZWFsIGFwcGxpY2F0aW9uIHRoZSByZXR1cm5lZCBkYXRhIHdpbGwgYmUgZGlmZmVyZW50IGV2ZXJ5IHRpbWVcbiAgICogICBnZXQgZGF0YSgpIHtcbiAgICogICAgIHJldHVybiBbMSwyLDMsNCw1XTtcbiAgICogICB9XG4gICAqIH1cbiAgICpcbiAgICogQENvbXBvbmVudCh7XG4gICAqICAgc2VsZWN0b3I6ICdnaWFudC1saXN0JyxcbiAgICogICB0ZW1wbGF0ZTogYFxuICAgKiAgICAgPGxpICpuZ0Zvcj1cImxldCBkIG9mIGRhdGFQcm92aWRlci5kYXRhXCI+RGF0YSB7e2R9fTwvbGk+XG4gICAqICAgYCxcbiAgICogfSlcbiAgICogY2xhc3MgR2lhbnRMaXN0IHtcbiAgICogICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlZjogQ2hhbmdlRGV0ZWN0b3JSZWYsIHByaXZhdGUgZGF0YVByb3ZpZGVyOiBEYXRhUHJvdmlkZXIpIHtcbiAgICogICAgIHJlZi5kZXRhY2goKTtcbiAgICogICAgIHNldEludGVydmFsKCgpID0+IHtcbiAgICogICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgKiAgICAgfSwgNTAwMCk7XG4gICAqICAgfVxuICAgKiB9XG4gICAqXG4gICAqIEBDb21wb25lbnQoe1xuICAgKiAgIHNlbGVjdG9yOiAnYXBwJyxcbiAgICogICBwcm92aWRlcnM6IFtEYXRhUHJvdmlkZXJdLFxuICAgKiAgIHRlbXBsYXRlOiBgXG4gICAqICAgICA8Z2lhbnQtbGlzdD48Z2lhbnQtbGlzdD5cbiAgICogICBgLFxuICAgKiB9KVxuICAgKiBjbGFzcyBBcHAge1xuICAgKiB9XG4gICAqIGBgYFxuICAgKi9cbiAgZGV0YWNoKCk6IHZvaWQgeyB0aGlzLl92aWV3LmZsYWdzICY9IH5MVmlld0ZsYWdzLkF0dGFjaGVkOyB9XG5cbiAgLyoqXG4gICAqIFJlLWF0dGFjaGVzIGEgdmlldyB0byB0aGUgY2hhbmdlIGRldGVjdGlvbiB0cmVlLlxuICAgKlxuICAgKiBUaGlzIGNhbiBiZSB1c2VkIHRvIHJlLWF0dGFjaCB2aWV3cyB0aGF0IHdlcmUgcHJldmlvdXNseSBkZXRhY2hlZCBmcm9tIHRoZSB0cmVlXG4gICAqIHVzaW5nIHtAbGluayBDaGFuZ2VEZXRlY3RvclJlZiNkZXRhY2ggZGV0YWNofS4gVmlld3MgYXJlIGF0dGFjaGVkIHRvIHRoZSB0cmVlIGJ5IGRlZmF1bHQuXG4gICAqXG4gICAqIDwhLS0gVE9ETzogQWRkIGEgbGluayB0byBhIGNoYXB0ZXIgb24gZGV0YWNoL3JlYXR0YWNoL2xvY2FsIGRpZ2VzdCAtLT5cbiAgICpcbiAgICogIyMjIEV4YW1wbGVcbiAgICpcbiAgICogVGhlIGZvbGxvd2luZyBleGFtcGxlIGNyZWF0ZXMgYSBjb21wb25lbnQgZGlzcGxheWluZyBgbGl2ZWAgZGF0YS4gVGhlIGNvbXBvbmVudCB3aWxsIGRldGFjaFxuICAgKiBpdHMgY2hhbmdlIGRldGVjdG9yIGZyb20gdGhlIG1haW4gY2hhbmdlIGRldGVjdG9yIHRyZWUgd2hlbiB0aGUgY29tcG9uZW50J3MgbGl2ZSBwcm9wZXJ0eVxuICAgKiBpcyBzZXQgdG8gZmFsc2UuXG4gICAqXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogY2xhc3MgRGF0YVByb3ZpZGVyIHtcbiAgICogICBkYXRhID0gMTtcbiAgICpcbiAgICogICBjb25zdHJ1Y3RvcigpIHtcbiAgICogICAgIHNldEludGVydmFsKCgpID0+IHtcbiAgICogICAgICAgdGhpcy5kYXRhID0gdGhpcy5kYXRhICogMjtcbiAgICogICAgIH0sIDUwMCk7XG4gICAqICAgfVxuICAgKiB9XG4gICAqXG4gICAqIEBDb21wb25lbnQoe1xuICAgKiAgIHNlbGVjdG9yOiAnbGl2ZS1kYXRhJyxcbiAgICogICBpbnB1dHM6IFsnbGl2ZSddLFxuICAgKiAgIHRlbXBsYXRlOiAnRGF0YToge3tkYXRhUHJvdmlkZXIuZGF0YX19J1xuICAgKiB9KVxuICAgKiBjbGFzcyBMaXZlRGF0YSB7XG4gICAqICAgY29uc3RydWN0b3IocHJpdmF0ZSByZWY6IENoYW5nZURldGVjdG9yUmVmLCBwcml2YXRlIGRhdGFQcm92aWRlcjogRGF0YVByb3ZpZGVyKSB7fVxuICAgKlxuICAgKiAgIHNldCBsaXZlKHZhbHVlKSB7XG4gICAqICAgICBpZiAodmFsdWUpIHtcbiAgICogICAgICAgdGhpcy5yZWYucmVhdHRhY2goKTtcbiAgICogICAgIH0gZWxzZSB7XG4gICAqICAgICAgIHRoaXMucmVmLmRldGFjaCgpO1xuICAgKiAgICAgfVxuICAgKiAgIH1cbiAgICogfVxuICAgKlxuICAgKiBAQ29tcG9uZW50KHtcbiAgICogICBzZWxlY3RvcjogJ215LWFwcCcsXG4gICAqICAgcHJvdmlkZXJzOiBbRGF0YVByb3ZpZGVyXSxcbiAgICogICB0ZW1wbGF0ZTogYFxuICAgKiAgICAgTGl2ZSBVcGRhdGU6IDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBbKG5nTW9kZWwpXT1cImxpdmVcIj5cbiAgICogICAgIDxsaXZlLWRhdGEgW2xpdmVdPVwibGl2ZVwiPjxsaXZlLWRhdGE+XG4gICAqICAgYCxcbiAgICogfSlcbiAgICogY2xhc3MgQXBwQ29tcG9uZW50IHtcbiAgICogICBsaXZlID0gdHJ1ZTtcbiAgICogfVxuICAgKiBgYGBcbiAgICovXG4gIHJlYXR0YWNoKCk6IHZvaWQgeyB0aGlzLl92aWV3LmZsYWdzIHw9IExWaWV3RmxhZ3MuQXR0YWNoZWQ7IH1cblxuICAvKipcbiAgICogQ2hlY2tzIHRoZSB2aWV3IGFuZCBpdHMgY2hpbGRyZW4uXG4gICAqXG4gICAqIFRoaXMgY2FuIGFsc28gYmUgdXNlZCBpbiBjb21iaW5hdGlvbiB3aXRoIHtAbGluayBDaGFuZ2VEZXRlY3RvclJlZiNkZXRhY2ggZGV0YWNofSB0byBpbXBsZW1lbnRcbiAgICogbG9jYWwgY2hhbmdlIGRldGVjdGlvbiBjaGVja3MuXG4gICAqXG4gICAqIDwhLS0gVE9ETzogQWRkIGEgbGluayB0byBhIGNoYXB0ZXIgb24gZGV0YWNoL3JlYXR0YWNoL2xvY2FsIGRpZ2VzdCAtLT5cbiAgICogPCEtLSBUT0RPOiBBZGQgYSBsaXZlIGRlbW8gb25jZSByZWYuZGV0ZWN0Q2hhbmdlcyBpcyBtZXJnZWQgaW50byBtYXN0ZXIgLS0+XG4gICAqXG4gICAqICMjIyBFeGFtcGxlXG4gICAqXG4gICAqIFRoZSBmb2xsb3dpbmcgZXhhbXBsZSBkZWZpbmVzIGEgY29tcG9uZW50IHdpdGggYSBsYXJnZSBsaXN0IG9mIHJlYWRvbmx5IGRhdGEuXG4gICAqIEltYWdpbmUsIHRoZSBkYXRhIGNoYW5nZXMgY29uc3RhbnRseSwgbWFueSB0aW1lcyBwZXIgc2Vjb25kLiBGb3IgcGVyZm9ybWFuY2UgcmVhc29ucyxcbiAgICogd2Ugd2FudCB0byBjaGVjayBhbmQgdXBkYXRlIHRoZSBsaXN0IGV2ZXJ5IGZpdmUgc2Vjb25kcy5cbiAgICpcbiAgICogV2UgY2FuIGRvIHRoYXQgYnkgZGV0YWNoaW5nIHRoZSBjb21wb25lbnQncyBjaGFuZ2UgZGV0ZWN0b3IgYW5kIGRvaW5nIGEgbG9jYWwgY2hhbmdlIGRldGVjdGlvblxuICAgKiBjaGVjayBldmVyeSBmaXZlIHNlY29uZHMuXG4gICAqXG4gICAqIFNlZSB7QGxpbmsgQ2hhbmdlRGV0ZWN0b3JSZWYjZGV0YWNoIGRldGFjaH0gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAqL1xuICBkZXRlY3RDaGFuZ2VzKCk6IHZvaWQgeyBkZXRlY3RDaGFuZ2VzKHRoaXMuY29udGV4dCk7IH1cblxuICAvKipcbiAgICogQ2hlY2tzIHRoZSBjaGFuZ2UgZGV0ZWN0b3IgYW5kIGl0cyBjaGlsZHJlbiwgYW5kIHRocm93cyBpZiBhbnkgY2hhbmdlcyBhcmUgZGV0ZWN0ZWQuXG4gICAqXG4gICAqIFRoaXMgaXMgdXNlZCBpbiBkZXZlbG9wbWVudCBtb2RlIHRvIHZlcmlmeSB0aGF0IHJ1bm5pbmcgY2hhbmdlIGRldGVjdGlvbiBkb2Vzbid0XG4gICAqIGludHJvZHVjZSBvdGhlciBjaGFuZ2VzLlxuICAgKi9cbiAgY2hlY2tOb0NoYW5nZXMoKTogdm9pZCB7IGNoZWNrTm9DaGFuZ2VzKHRoaXMuY29udGV4dCk7IH1cbn1cblxuXG5leHBvcnQgY2xhc3MgRW1iZWRkZWRWaWV3UmVmPFQ+IGV4dGVuZHMgVmlld1JlZjxUPiB7XG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9sVmlld05vZGU6IExWaWV3Tm9kZTtcblxuICBjb25zdHJ1Y3Rvcih2aWV3Tm9kZTogTFZpZXdOb2RlLCB0ZW1wbGF0ZTogQ29tcG9uZW50VGVtcGxhdGU8VD4sIGNvbnRleHQ6IFQpIHtcbiAgICBzdXBlcih2aWV3Tm9kZS5kYXRhLCBjb250ZXh0KTtcbiAgICB0aGlzLl9sVmlld05vZGUgPSB2aWV3Tm9kZTtcbiAgfVxufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBWaWV3UmVmIGJ1bmRsZWQgd2l0aCBkZXN0cm95IGZ1bmN0aW9uYWxpdHkuXG4gKlxuICogQHBhcmFtIGNvbnRleHQgVGhlIGNvbnRleHQgZm9yIHRoaXMgdmlld1xuICogQHJldHVybnMgVGhlIFZpZXdSZWZcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVZpZXdSZWY8VD4odmlldzogTFZpZXcgfCBudWxsLCBjb250ZXh0OiBUKTogVmlld1JlZjxUPiB7XG4gIC8vIFRPRE86IGFkZCBkZXRlY3RDaGFuZ2VzIGJhY2sgaW4gd2hlbiBpbXBsZW1lbnRpbmcgQ2hhbmdlRGV0ZWN0b3JSZWYuZGV0ZWN0Q2hhbmdlc1xuICByZXR1cm4gYWRkRGVzdHJveWFibGUobmV3IFZpZXdSZWYodmlldyAhLCBjb250ZXh0KSk7XG59XG5cbi8qKiBJbnRlcmZhY2UgZm9yIGRlc3Ryb3kgbG9naWMuIEltcGxlbWVudGVkIGJ5IGFkZERlc3Ryb3lhYmxlLiAqL1xuZXhwb3J0IGludGVyZmFjZSBEZXN0cm95UmVmPFQ+IHtcbiAgLyoqIFdoZXRoZXIgb3Igbm90IHRoaXMgb2JqZWN0IGhhcyBiZWVuIGRlc3Ryb3llZCAqL1xuICBkZXN0cm95ZWQ6IGJvb2xlYW47XG4gIC8qKiBEZXN0cm95IHRoZSBpbnN0YW5jZSBhbmQgY2FsbCBhbGwgb25EZXN0cm95IGNhbGxiYWNrcy4gKi9cbiAgZGVzdHJveSgpOiB2b2lkO1xuICAvKiogUmVnaXN0ZXIgY2FsbGJhY2tzIHRoYXQgc2hvdWxkIGJlIGNhbGxlZCBvbkRlc3Ryb3kgKi9cbiAgb25EZXN0cm95KGNiOiBGdW5jdGlvbik6IHZvaWQ7XG59XG5cbi8qKlxuICogRGVjb3JhdGVzIGFuIG9iamVjdCB3aXRoIGRlc3Ryb3kgbG9naWMgKGltcGxlbWVudGluZyB0aGUgRGVzdHJveVJlZiBpbnRlcmZhY2UpXG4gKiBhbmQgcmV0dXJucyB0aGUgZW5oYW5jZWQgb2JqZWN0LlxuICpcbiAqIEBwYXJhbSBvYmogVGhlIG9iamVjdCB0byBkZWNvcmF0ZVxuICogQHJldHVybnMgVGhlIG9iamVjdCB3aXRoIGRlc3Ryb3kgbG9naWNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZERlc3Ryb3lhYmxlPFQsIEM+KG9iajogYW55KTogVCZEZXN0cm95UmVmPEM+IHtcbiAgbGV0IGRlc3Ryb3lGbjogRnVuY3Rpb25bXXxudWxsID0gbnVsbDtcbiAgb2JqLmRlc3Ryb3llZCA9IGZhbHNlO1xuICBvYmouZGVzdHJveSA9IGZ1bmN0aW9uKCkge1xuICAgIGRlc3Ryb3lGbiAmJiBkZXN0cm95Rm4uZm9yRWFjaCgoZm4pID0+IGZuKCkpO1xuICAgIHRoaXMuZGVzdHJveWVkID0gdHJ1ZTtcbiAgfTtcbiAgb2JqLm9uRGVzdHJveSA9IChmbjogRnVuY3Rpb24pID0+IChkZXN0cm95Rm4gfHwgKGRlc3Ryb3lGbiA9IFtdKSkucHVzaChmbik7XG4gIHJldHVybiBvYmo7XG59XG4iXX0=