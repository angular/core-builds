/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { checkNoChanges, detectChanges, markViewDirty } from './instructions';
import { notImplemented } from './util';
var ViewRef = /** @class */ (function () {
    function ViewRef(_view, context) {
        this._view = _view;
        this.context = (context);
    }
    /** @internal */
    /** @internal */
    ViewRef.prototype._setComponentContext = /** @internal */
    function (view, context) {
        this._view = view;
        this.context = context;
    };
    ViewRef.prototype.destroy = function () { notImplemented(); };
    ViewRef.prototype.onDestroy = function (callback) { notImplemented(); };
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
     * ### Example ([live demo](https://stackblitz.com/edit/angular-kx7rrw))
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
       * ### Example ([live demo](https://stackblitz.com/edit/angular-kx7rrw))
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
    ViewRef.prototype.markForCheck = /**
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
       * ### Example ([live demo](https://stackblitz.com/edit/angular-kx7rrw))
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
    function () { markViewDirty(this._view); };
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
    ViewRef.prototype.detach = /**
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
    function () { this._view.flags &= ~8 /* Attached */; };
    /**
     * Re-attaches a view to the change detection tree.
     *
     * This can be used to re-attach views that were previously detached from the tree
     * using {@link ChangeDetectorRef#detach detach}. Views are attached to the tree by default.
     *
     * <!-- TODO: Add a link to a chapter on detach/reattach/local digest -->
     *
     * ### Example ([live demo](https://stackblitz.com/edit/angular-ymgsxw))
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
    /**
       * Re-attaches a view to the change detection tree.
       *
       * This can be used to re-attach views that were previously detached from the tree
       * using {@link ChangeDetectorRef#detach detach}. Views are attached to the tree by default.
       *
       * <!-- TODO: Add a link to a chapter on detach/reattach/local digest -->
       *
       * ### Example ([live demo](https://stackblitz.com/edit/angular-ymgsxw))
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
    ViewRef.prototype.reattach = /**
       * Re-attaches a view to the change detection tree.
       *
       * This can be used to re-attach views that were previously detached from the tree
       * using {@link ChangeDetectorRef#detach detach}. Views are attached to the tree by default.
       *
       * <!-- TODO: Add a link to a chapter on detach/reattach/local digest -->
       *
       * ### Example ([live demo](https://stackblitz.com/edit/angular-ymgsxw))
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
    function () { this._view.flags |= 8 /* Attached */; };
    /**
     * Checks the view and its children.
     *
     * This can also be used in combination with {@link ChangeDetectorRef#detach detach} to implement
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
     * See {@link ChangeDetectorRef#detach detach} for more information.
     */
    /**
       * Checks the view and its children.
       *
       * This can also be used in combination with {@link ChangeDetectorRef#detach detach} to implement
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
       * See {@link ChangeDetectorRef#detach detach} for more information.
       */
    ViewRef.prototype.detectChanges = /**
       * Checks the view and its children.
       *
       * This can also be used in combination with {@link ChangeDetectorRef#detach detach} to implement
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
       * See {@link ChangeDetectorRef#detach detach} for more information.
       */
    function () { detectChanges(this.context); };
    /**
     * Checks the change detector and its children, and throws if any changes are detected.
     *
     * This is used in development mode to verify that running change detection doesn't
     * introduce other changes.
     */
    /**
       * Checks the change detector and its children, and throws if any changes are detected.
       *
       * This is used in development mode to verify that running change detection doesn't
       * introduce other changes.
       */
    ViewRef.prototype.checkNoChanges = /**
       * Checks the change detector and its children, and throws if any changes are detected.
       *
       * This is used in development mode to verify that running change detection doesn't
       * introduce other changes.
       */
    function () { checkNoChanges(this.context); };
    return ViewRef;
}());
export { ViewRef };
var EmbeddedViewRef = /** @class */ (function (_super) {
    tslib_1.__extends(EmbeddedViewRef, _super);
    function EmbeddedViewRef(viewNode, template, context) {
        var _this = _super.call(this, viewNode.data, context) || this;
        _this._lViewNode = viewNode;
        return _this;
    }
    return EmbeddedViewRef;
}(ViewRef));
export { EmbeddedViewRef };
/**
 * Creates a ViewRef bundled with destroy functionality.
 *
 * @param context The context for this view
 * @returns The ViewRef
 */
export function createViewRef(view, context) {
    // TODO: add detectChanges back in when implementing ChangeDetectorRef.detectChanges
    return addDestroyable(new ViewRef((view), context));
}
/**
 * Decorates an object with destroy logic (implementing the DestroyRef interface)
 * and returns the enhanced object.
 *
 * @param obj The object to decorate
 * @returns The object with destroy logic
 */
export function addDestroyable(obj) {
    var destroyFn = null;
    obj.destroyed = false;
    obj.destroy = function () {
        destroyFn && destroyFn.forEach(function (fn) { return fn(); });
        this.destroyed = true;
    };
    obj.onDestroy = function (fn) { return (destroyFn || (destroyFn = [])).push(fn); };
    return obj;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld19yZWYuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3ZpZXdfcmVmLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBVUEsT0FBTyxFQUFDLGNBQWMsRUFBRSxhQUFhLEVBQUUsYUFBYSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFJNUUsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUV0QyxJQUFBO0lBSUUsaUJBQW9CLEtBQVksRUFBRSxPQUFlO1FBQTdCLFVBQUssR0FBTCxLQUFLLENBQU87UUFBdUIsSUFBSSxDQUFDLE9BQU8sSUFBRyxPQUFTLENBQUEsQ0FBQztLQUFFO0lBRWxGLGdCQUFnQjs7SUFDaEIsc0NBQW9CO0lBQXBCLFVBQXFCLElBQVcsRUFBRSxPQUFVO1FBQzFDLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO1FBQ2xCLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO0tBQ3hCO0lBRUQseUJBQU8sR0FBUCxjQUFrQixjQUFjLEVBQUUsQ0FBQyxFQUFFO0lBRXJDLDJCQUFTLEdBQVQsVUFBVSxRQUFrQixJQUFJLGNBQWMsRUFBRSxDQUFDLEVBQUU7SUFFbkQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O09BZ0NHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBQ0gsOEJBQVk7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQUFaLGNBQXVCLGFBQWEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRTtJQUVuRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O09BbURHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQUNILHdCQUFNOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBQU4sY0FBaUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLElBQUksaUJBQW9CLENBQUMsRUFBRTtJQUU1RDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O09Bc0RHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQUNILDBCQUFROzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBQVIsY0FBbUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLG9CQUF1QixDQUFDLEVBQUU7SUFFN0Q7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7T0FtQkc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQUNILCtCQUFhOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQUFiLGNBQXdCLGFBQWEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRTtJQUV0RDs7Ozs7T0FLRzs7Ozs7OztJQUNILGdDQUFjOzs7Ozs7SUFBZCxjQUF5QixjQUFjLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUU7a0JBOU0xRDtJQStNQyxDQUFBO0FBL0xELG1CQStMQztBQUdELElBQUE7SUFBd0MsMkNBQVU7SUFNaEQseUJBQVksUUFBbUIsRUFBRSxRQUE4QixFQUFFLE9BQVU7UUFBM0UsWUFDRSxrQkFBTSxRQUFRLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxTQUU5QjtRQURDLEtBQUksQ0FBQyxVQUFVLEdBQUcsUUFBUSxDQUFDOztLQUM1QjswQkEzTkg7RUFrTndDLE9BQU8sRUFVOUMsQ0FBQTtBQVZELDJCQVVDOzs7Ozs7O0FBUUQsTUFBTSx3QkFBMkIsSUFBa0IsRUFBRSxPQUFVOztJQUU3RCxPQUFPLGNBQWMsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxDQUFBLElBQU0sQ0FBQSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7Q0FDckQ7Ozs7Ozs7O0FBbUJELE1BQU0seUJBQStCLEdBQVE7SUFDM0MsSUFBSSxTQUFTLEdBQW9CLElBQUksQ0FBQztJQUN0QyxHQUFHLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQztJQUN0QixHQUFHLENBQUMsT0FBTyxHQUFHO1FBQ1osU0FBUyxJQUFJLFNBQVMsQ0FBQyxPQUFPLENBQUMsVUFBQyxFQUFFLElBQUssT0FBQSxFQUFFLEVBQUUsRUFBSixDQUFJLENBQUMsQ0FBQztRQUM3QyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztLQUN2QixDQUFDO0lBQ0YsR0FBRyxDQUFDLFNBQVMsR0FBRyxVQUFDLEVBQVksSUFBSyxPQUFBLENBQUMsU0FBUyxJQUFJLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUF4QyxDQUF3QyxDQUFDO0lBQzNFLE9BQU8sR0FBRyxDQUFDO0NBQ1oiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RW1iZWRkZWRWaWV3UmVmIGFzIHZpZXdFbmdpbmVfRW1iZWRkZWRWaWV3UmVmfSBmcm9tICcuLi9saW5rZXIvdmlld19yZWYnO1xuXG5pbXBvcnQge2NoZWNrTm9DaGFuZ2VzLCBkZXRlY3RDaGFuZ2VzLCBtYXJrVmlld0RpcnR5fSBmcm9tICcuL2luc3RydWN0aW9ucyc7XG5pbXBvcnQge0NvbXBvbmVudFRlbXBsYXRlfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge0xWaWV3Tm9kZX0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtMVmlldywgTFZpZXdGbGFnc30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtub3RJbXBsZW1lbnRlZH0gZnJvbSAnLi91dGlsJztcblxuZXhwb3J0IGNsYXNzIFZpZXdSZWY8VD4gaW1wbGVtZW50cyB2aWV3RW5naW5lX0VtYmVkZGVkVmlld1JlZjxUPiB7XG4gIGNvbnRleHQ6IFQ7XG4gIHJvb3ROb2RlczogYW55W107XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfdmlldzogTFZpZXcsIGNvbnRleHQ6IFR8bnVsbCwgKSB7IHRoaXMuY29udGV4dCA9IGNvbnRleHQgITsgfVxuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX3NldENvbXBvbmVudENvbnRleHQodmlldzogTFZpZXcsIGNvbnRleHQ6IFQpIHtcbiAgICB0aGlzLl92aWV3ID0gdmlldztcbiAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICB9XG5cbiAgZGVzdHJveSgpOiB2b2lkIHsgbm90SW1wbGVtZW50ZWQoKTsgfVxuICBkZXN0cm95ZWQ6IGJvb2xlYW47XG4gIG9uRGVzdHJveShjYWxsYmFjazogRnVuY3Rpb24pIHsgbm90SW1wbGVtZW50ZWQoKTsgfVxuXG4gIC8qKlxuICAgKiBNYXJrcyBhIHZpZXcgYW5kIGFsbCBvZiBpdHMgYW5jZXN0b3JzIGRpcnR5LlxuICAgKlxuICAgKiBJdCBhbHNvIHRyaWdnZXJzIGNoYW5nZSBkZXRlY3Rpb24gYnkgY2FsbGluZyBgc2NoZWR1bGVUaWNrYCBpbnRlcm5hbGx5LCB3aGljaCBjb2FsZXNjZXNcbiAgICogbXVsdGlwbGUgYG1hcmtGb3JDaGVja2AgY2FsbHMgdG8gaW50byBvbmUgY2hhbmdlIGRldGVjdGlvbiBydW4uXG4gICAqXG4gICAqIFRoaXMgY2FuIGJlIHVzZWQgdG8gZW5zdXJlIGFuIHtAbGluayBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSNPblB1c2ggT25QdXNofSBjb21wb25lbnQgaXNcbiAgICogY2hlY2tlZCB3aGVuIGl0IG5lZWRzIHRvIGJlIHJlLXJlbmRlcmVkIGJ1dCB0aGUgdHdvIG5vcm1hbCB0cmlnZ2VycyBoYXZlbid0IG1hcmtlZCBpdFxuICAgKiBkaXJ0eSAoaS5lLiBpbnB1dHMgaGF2ZW4ndCBjaGFuZ2VkIGFuZCBldmVudHMgaGF2ZW4ndCBmaXJlZCBpbiB0aGUgdmlldykuXG4gICAqXG4gICAqIDwhLS0gVE9ETzogQWRkIGEgbGluayB0byBhIGNoYXB0ZXIgb24gT25QdXNoIGNvbXBvbmVudHMgLS0+XG4gICAqXG4gICAqICMjIyBFeGFtcGxlIChbbGl2ZSBkZW1vXShodHRwczovL3N0YWNrYmxpdHouY29tL2VkaXQvYW5ndWxhci1reDdycncpKVxuICAgKlxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIEBDb21wb25lbnQoe1xuICAgKiAgIHNlbGVjdG9yOiAnbXktYXBwJyxcbiAgICogICB0ZW1wbGF0ZTogYE51bWJlciBvZiB0aWNrczoge3tudW1iZXJPZlRpY2tzfX1gXG4gICAqICAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5PblB1c2gsXG4gICAqIH0pXG4gICAqIGNsYXNzIEFwcENvbXBvbmVudCB7XG4gICAqICAgbnVtYmVyT2ZUaWNrcyA9IDA7XG4gICAqXG4gICAqICAgY29uc3RydWN0b3IocHJpdmF0ZSByZWY6IENoYW5nZURldGVjdG9yUmVmKSB7XG4gICAqICAgICBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAqICAgICAgIHRoaXMubnVtYmVyT2ZUaWNrcysrO1xuICAgKiAgICAgICAvLyB0aGUgZm9sbG93aW5nIGlzIHJlcXVpcmVkLCBvdGhlcndpc2UgdGhlIHZpZXcgd2lsbCBub3QgYmUgdXBkYXRlZFxuICAgKiAgICAgICB0aGlzLnJlZi5tYXJrRm9yQ2hlY2soKTtcbiAgICogICAgIH0sIDEwMDApO1xuICAgKiAgIH1cbiAgICogfVxuICAgKiBgYGBcbiAgICovXG4gIG1hcmtGb3JDaGVjaygpOiB2b2lkIHsgbWFya1ZpZXdEaXJ0eSh0aGlzLl92aWV3KTsgfVxuXG4gIC8qKlxuICAgKiBEZXRhY2hlcyB0aGUgdmlldyBmcm9tIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHRyZWUuXG4gICAqXG4gICAqIERldGFjaGVkIHZpZXdzIHdpbGwgbm90IGJlIGNoZWNrZWQgZHVyaW5nIGNoYW5nZSBkZXRlY3Rpb24gcnVucyB1bnRpbCB0aGV5IGFyZVxuICAgKiByZS1hdHRhY2hlZCwgZXZlbiBpZiB0aGV5IGFyZSBkaXJ0eS4gYGRldGFjaGAgY2FuIGJlIHVzZWQgaW4gY29tYmluYXRpb24gd2l0aFxuICAgKiB7QGxpbmsgQ2hhbmdlRGV0ZWN0b3JSZWYjZGV0ZWN0Q2hhbmdlcyBkZXRlY3RDaGFuZ2VzfSB0byBpbXBsZW1lbnQgbG9jYWwgY2hhbmdlXG4gICAqIGRldGVjdGlvbiBjaGVja3MuXG4gICAqXG4gICAqIDwhLS0gVE9ETzogQWRkIGEgbGluayB0byBhIGNoYXB0ZXIgb24gZGV0YWNoL3JlYXR0YWNoL2xvY2FsIGRpZ2VzdCAtLT5cbiAgICogPCEtLSBUT0RPOiBBZGQgYSBsaXZlIGRlbW8gb25jZSByZWYuZGV0ZWN0Q2hhbmdlcyBpcyBtZXJnZWQgaW50byBtYXN0ZXIgLS0+XG4gICAqXG4gICAqICMjIyBFeGFtcGxlXG4gICAqXG4gICAqIFRoZSBmb2xsb3dpbmcgZXhhbXBsZSBkZWZpbmVzIGEgY29tcG9uZW50IHdpdGggYSBsYXJnZSBsaXN0IG9mIHJlYWRvbmx5IGRhdGEuXG4gICAqIEltYWdpbmUgdGhlIGRhdGEgY2hhbmdlcyBjb25zdGFudGx5LCBtYW55IHRpbWVzIHBlciBzZWNvbmQuIEZvciBwZXJmb3JtYW5jZSByZWFzb25zLFxuICAgKiB3ZSB3YW50IHRvIGNoZWNrIGFuZCB1cGRhdGUgdGhlIGxpc3QgZXZlcnkgZml2ZSBzZWNvbmRzLiBXZSBjYW4gZG8gdGhhdCBieSBkZXRhY2hpbmdcbiAgICogdGhlIGNvbXBvbmVudCdzIGNoYW5nZSBkZXRlY3RvciBhbmQgZG9pbmcgYSBsb2NhbCBjaGVjayBldmVyeSBmaXZlIHNlY29uZHMuXG4gICAqXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogY2xhc3MgRGF0YVByb3ZpZGVyIHtcbiAgICogICAvLyBpbiBhIHJlYWwgYXBwbGljYXRpb24gdGhlIHJldHVybmVkIGRhdGEgd2lsbCBiZSBkaWZmZXJlbnQgZXZlcnkgdGltZVxuICAgKiAgIGdldCBkYXRhKCkge1xuICAgKiAgICAgcmV0dXJuIFsxLDIsMyw0LDVdO1xuICAgKiAgIH1cbiAgICogfVxuICAgKlxuICAgKiBAQ29tcG9uZW50KHtcbiAgICogICBzZWxlY3RvcjogJ2dpYW50LWxpc3QnLFxuICAgKiAgIHRlbXBsYXRlOiBgXG4gICAqICAgICA8bGkgKm5nRm9yPVwibGV0IGQgb2YgZGF0YVByb3ZpZGVyLmRhdGFcIj5EYXRhIHt7ZH19PC9saT5cbiAgICogICBgLFxuICAgKiB9KVxuICAgKiBjbGFzcyBHaWFudExpc3Qge1xuICAgKiAgIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVmOiBDaGFuZ2VEZXRlY3RvclJlZiwgcHJpdmF0ZSBkYXRhUHJvdmlkZXI6IERhdGFQcm92aWRlcikge1xuICAgKiAgICAgcmVmLmRldGFjaCgpO1xuICAgKiAgICAgc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgKiAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAqICAgICB9LCA1MDAwKTtcbiAgICogICB9XG4gICAqIH1cbiAgICpcbiAgICogQENvbXBvbmVudCh7XG4gICAqICAgc2VsZWN0b3I6ICdhcHAnLFxuICAgKiAgIHByb3ZpZGVyczogW0RhdGFQcm92aWRlcl0sXG4gICAqICAgdGVtcGxhdGU6IGBcbiAgICogICAgIDxnaWFudC1saXN0PjxnaWFudC1saXN0PlxuICAgKiAgIGAsXG4gICAqIH0pXG4gICAqIGNsYXNzIEFwcCB7XG4gICAqIH1cbiAgICogYGBgXG4gICAqL1xuICBkZXRhY2goKTogdm9pZCB7IHRoaXMuX3ZpZXcuZmxhZ3MgJj0gfkxWaWV3RmxhZ3MuQXR0YWNoZWQ7IH1cblxuICAvKipcbiAgICogUmUtYXR0YWNoZXMgYSB2aWV3IHRvIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHRyZWUuXG4gICAqXG4gICAqIFRoaXMgY2FuIGJlIHVzZWQgdG8gcmUtYXR0YWNoIHZpZXdzIHRoYXQgd2VyZSBwcmV2aW91c2x5IGRldGFjaGVkIGZyb20gdGhlIHRyZWVcbiAgICogdXNpbmcge0BsaW5rIENoYW5nZURldGVjdG9yUmVmI2RldGFjaCBkZXRhY2h9LiBWaWV3cyBhcmUgYXR0YWNoZWQgdG8gdGhlIHRyZWUgYnkgZGVmYXVsdC5cbiAgICpcbiAgICogPCEtLSBUT0RPOiBBZGQgYSBsaW5rIHRvIGEgY2hhcHRlciBvbiBkZXRhY2gvcmVhdHRhY2gvbG9jYWwgZGlnZXN0IC0tPlxuICAgKlxuICAgKiAjIyMgRXhhbXBsZSAoW2xpdmUgZGVtb10oaHR0cHM6Ly9zdGFja2JsaXR6LmNvbS9lZGl0L2FuZ3VsYXIteW1nc3h3KSlcbiAgICpcbiAgICogVGhlIGZvbGxvd2luZyBleGFtcGxlIGNyZWF0ZXMgYSBjb21wb25lbnQgZGlzcGxheWluZyBgbGl2ZWAgZGF0YS4gVGhlIGNvbXBvbmVudCB3aWxsIGRldGFjaFxuICAgKiBpdHMgY2hhbmdlIGRldGVjdG9yIGZyb20gdGhlIG1haW4gY2hhbmdlIGRldGVjdG9yIHRyZWUgd2hlbiB0aGUgY29tcG9uZW50J3MgbGl2ZSBwcm9wZXJ0eVxuICAgKiBpcyBzZXQgdG8gZmFsc2UuXG4gICAqXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogY2xhc3MgRGF0YVByb3ZpZGVyIHtcbiAgICogICBkYXRhID0gMTtcbiAgICpcbiAgICogICBjb25zdHJ1Y3RvcigpIHtcbiAgICogICAgIHNldEludGVydmFsKCgpID0+IHtcbiAgICogICAgICAgdGhpcy5kYXRhID0gdGhpcy5kYXRhICogMjtcbiAgICogICAgIH0sIDUwMCk7XG4gICAqICAgfVxuICAgKiB9XG4gICAqXG4gICAqIEBDb21wb25lbnQoe1xuICAgKiAgIHNlbGVjdG9yOiAnbGl2ZS1kYXRhJyxcbiAgICogICBpbnB1dHM6IFsnbGl2ZSddLFxuICAgKiAgIHRlbXBsYXRlOiAnRGF0YToge3tkYXRhUHJvdmlkZXIuZGF0YX19J1xuICAgKiB9KVxuICAgKiBjbGFzcyBMaXZlRGF0YSB7XG4gICAqICAgY29uc3RydWN0b3IocHJpdmF0ZSByZWY6IENoYW5nZURldGVjdG9yUmVmLCBwcml2YXRlIGRhdGFQcm92aWRlcjogRGF0YVByb3ZpZGVyKSB7fVxuICAgKlxuICAgKiAgIHNldCBsaXZlKHZhbHVlKSB7XG4gICAqICAgICBpZiAodmFsdWUpIHtcbiAgICogICAgICAgdGhpcy5yZWYucmVhdHRhY2goKTtcbiAgICogICAgIH0gZWxzZSB7XG4gICAqICAgICAgIHRoaXMucmVmLmRldGFjaCgpO1xuICAgKiAgICAgfVxuICAgKiAgIH1cbiAgICogfVxuICAgKlxuICAgKiBAQ29tcG9uZW50KHtcbiAgICogICBzZWxlY3RvcjogJ215LWFwcCcsXG4gICAqICAgcHJvdmlkZXJzOiBbRGF0YVByb3ZpZGVyXSxcbiAgICogICB0ZW1wbGF0ZTogYFxuICAgKiAgICAgTGl2ZSBVcGRhdGU6IDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBbKG5nTW9kZWwpXT1cImxpdmVcIj5cbiAgICogICAgIDxsaXZlLWRhdGEgW2xpdmVdPVwibGl2ZVwiPjxsaXZlLWRhdGE+XG4gICAqICAgYCxcbiAgICogfSlcbiAgICogY2xhc3MgQXBwQ29tcG9uZW50IHtcbiAgICogICBsaXZlID0gdHJ1ZTtcbiAgICogfVxuICAgKiBgYGBcbiAgICovXG4gIHJlYXR0YWNoKCk6IHZvaWQgeyB0aGlzLl92aWV3LmZsYWdzIHw9IExWaWV3RmxhZ3MuQXR0YWNoZWQ7IH1cblxuICAvKipcbiAgICogQ2hlY2tzIHRoZSB2aWV3IGFuZCBpdHMgY2hpbGRyZW4uXG4gICAqXG4gICAqIFRoaXMgY2FuIGFsc28gYmUgdXNlZCBpbiBjb21iaW5hdGlvbiB3aXRoIHtAbGluayBDaGFuZ2VEZXRlY3RvclJlZiNkZXRhY2ggZGV0YWNofSB0byBpbXBsZW1lbnRcbiAgICogbG9jYWwgY2hhbmdlIGRldGVjdGlvbiBjaGVja3MuXG4gICAqXG4gICAqIDwhLS0gVE9ETzogQWRkIGEgbGluayB0byBhIGNoYXB0ZXIgb24gZGV0YWNoL3JlYXR0YWNoL2xvY2FsIGRpZ2VzdCAtLT5cbiAgICogPCEtLSBUT0RPOiBBZGQgYSBsaXZlIGRlbW8gb25jZSByZWYuZGV0ZWN0Q2hhbmdlcyBpcyBtZXJnZWQgaW50byBtYXN0ZXIgLS0+XG4gICAqXG4gICAqICMjIyBFeGFtcGxlXG4gICAqXG4gICAqIFRoZSBmb2xsb3dpbmcgZXhhbXBsZSBkZWZpbmVzIGEgY29tcG9uZW50IHdpdGggYSBsYXJnZSBsaXN0IG9mIHJlYWRvbmx5IGRhdGEuXG4gICAqIEltYWdpbmUsIHRoZSBkYXRhIGNoYW5nZXMgY29uc3RhbnRseSwgbWFueSB0aW1lcyBwZXIgc2Vjb25kLiBGb3IgcGVyZm9ybWFuY2UgcmVhc29ucyxcbiAgICogd2Ugd2FudCB0byBjaGVjayBhbmQgdXBkYXRlIHRoZSBsaXN0IGV2ZXJ5IGZpdmUgc2Vjb25kcy5cbiAgICpcbiAgICogV2UgY2FuIGRvIHRoYXQgYnkgZGV0YWNoaW5nIHRoZSBjb21wb25lbnQncyBjaGFuZ2UgZGV0ZWN0b3IgYW5kIGRvaW5nIGEgbG9jYWwgY2hhbmdlIGRldGVjdGlvblxuICAgKiBjaGVjayBldmVyeSBmaXZlIHNlY29uZHMuXG4gICAqXG4gICAqIFNlZSB7QGxpbmsgQ2hhbmdlRGV0ZWN0b3JSZWYjZGV0YWNoIGRldGFjaH0gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAqL1xuICBkZXRlY3RDaGFuZ2VzKCk6IHZvaWQgeyBkZXRlY3RDaGFuZ2VzKHRoaXMuY29udGV4dCk7IH1cblxuICAvKipcbiAgICogQ2hlY2tzIHRoZSBjaGFuZ2UgZGV0ZWN0b3IgYW5kIGl0cyBjaGlsZHJlbiwgYW5kIHRocm93cyBpZiBhbnkgY2hhbmdlcyBhcmUgZGV0ZWN0ZWQuXG4gICAqXG4gICAqIFRoaXMgaXMgdXNlZCBpbiBkZXZlbG9wbWVudCBtb2RlIHRvIHZlcmlmeSB0aGF0IHJ1bm5pbmcgY2hhbmdlIGRldGVjdGlvbiBkb2Vzbid0XG4gICAqIGludHJvZHVjZSBvdGhlciBjaGFuZ2VzLlxuICAgKi9cbiAgY2hlY2tOb0NoYW5nZXMoKTogdm9pZCB7IGNoZWNrTm9DaGFuZ2VzKHRoaXMuY29udGV4dCk7IH1cbn1cblxuXG5leHBvcnQgY2xhc3MgRW1iZWRkZWRWaWV3UmVmPFQ+IGV4dGVuZHMgVmlld1JlZjxUPiB7XG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9sVmlld05vZGU6IExWaWV3Tm9kZTtcblxuICBjb25zdHJ1Y3Rvcih2aWV3Tm9kZTogTFZpZXdOb2RlLCB0ZW1wbGF0ZTogQ29tcG9uZW50VGVtcGxhdGU8VD4sIGNvbnRleHQ6IFQpIHtcbiAgICBzdXBlcih2aWV3Tm9kZS5kYXRhLCBjb250ZXh0KTtcbiAgICB0aGlzLl9sVmlld05vZGUgPSB2aWV3Tm9kZTtcbiAgfVxufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBWaWV3UmVmIGJ1bmRsZWQgd2l0aCBkZXN0cm95IGZ1bmN0aW9uYWxpdHkuXG4gKlxuICogQHBhcmFtIGNvbnRleHQgVGhlIGNvbnRleHQgZm9yIHRoaXMgdmlld1xuICogQHJldHVybnMgVGhlIFZpZXdSZWZcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVZpZXdSZWY8VD4odmlldzogTFZpZXcgfCBudWxsLCBjb250ZXh0OiBUKTogVmlld1JlZjxUPiB7XG4gIC8vIFRPRE86IGFkZCBkZXRlY3RDaGFuZ2VzIGJhY2sgaW4gd2hlbiBpbXBsZW1lbnRpbmcgQ2hhbmdlRGV0ZWN0b3JSZWYuZGV0ZWN0Q2hhbmdlc1xuICByZXR1cm4gYWRkRGVzdHJveWFibGUobmV3IFZpZXdSZWYodmlldyAhLCBjb250ZXh0KSk7XG59XG5cbi8qKiBJbnRlcmZhY2UgZm9yIGRlc3Ryb3kgbG9naWMuIEltcGxlbWVudGVkIGJ5IGFkZERlc3Ryb3lhYmxlLiAqL1xuZXhwb3J0IGludGVyZmFjZSBEZXN0cm95UmVmPFQ+IHtcbiAgLyoqIFdoZXRoZXIgb3Igbm90IHRoaXMgb2JqZWN0IGhhcyBiZWVuIGRlc3Ryb3llZCAqL1xuICBkZXN0cm95ZWQ6IGJvb2xlYW47XG4gIC8qKiBEZXN0cm95IHRoZSBpbnN0YW5jZSBhbmQgY2FsbCBhbGwgb25EZXN0cm95IGNhbGxiYWNrcy4gKi9cbiAgZGVzdHJveSgpOiB2b2lkO1xuICAvKiogUmVnaXN0ZXIgY2FsbGJhY2tzIHRoYXQgc2hvdWxkIGJlIGNhbGxlZCBvbkRlc3Ryb3kgKi9cbiAgb25EZXN0cm95KGNiOiBGdW5jdGlvbik6IHZvaWQ7XG59XG5cbi8qKlxuICogRGVjb3JhdGVzIGFuIG9iamVjdCB3aXRoIGRlc3Ryb3kgbG9naWMgKGltcGxlbWVudGluZyB0aGUgRGVzdHJveVJlZiBpbnRlcmZhY2UpXG4gKiBhbmQgcmV0dXJucyB0aGUgZW5oYW5jZWQgb2JqZWN0LlxuICpcbiAqIEBwYXJhbSBvYmogVGhlIG9iamVjdCB0byBkZWNvcmF0ZVxuICogQHJldHVybnMgVGhlIG9iamVjdCB3aXRoIGRlc3Ryb3kgbG9naWNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZERlc3Ryb3lhYmxlPFQsIEM+KG9iajogYW55KTogVCZEZXN0cm95UmVmPEM+IHtcbiAgbGV0IGRlc3Ryb3lGbjogRnVuY3Rpb25bXXxudWxsID0gbnVsbDtcbiAgb2JqLmRlc3Ryb3llZCA9IGZhbHNlO1xuICBvYmouZGVzdHJveSA9IGZ1bmN0aW9uKCkge1xuICAgIGRlc3Ryb3lGbiAmJiBkZXN0cm95Rm4uZm9yRWFjaCgoZm4pID0+IGZuKCkpO1xuICAgIHRoaXMuZGVzdHJveWVkID0gdHJ1ZTtcbiAgfTtcbiAgb2JqLm9uRGVzdHJveSA9IChmbjogRnVuY3Rpb24pID0+IChkZXN0cm95Rm4gfHwgKGRlc3Ryb3lGbiA9IFtdKSkucHVzaChmbik7XG4gIHJldHVybiBvYmo7XG59XG4iXX0=