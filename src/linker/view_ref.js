/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ChangeDetectorRef } from '../change_detection/change_detector_ref';
import { ChangeDetectorStatus } from '../change_detection/constants';
import { unimplemented } from '../facade/errors';
/**
 * \@stable
 * @abstract
 */
export class ViewRef extends ChangeDetectorRef {
    /**
     * Destroys the view and all of the data structures associated with it.
     * @abstract
     * @return {?}
     */
    destroy() { }
    /**
     * @return {?}
     */
    get destroyed() { return (unimplemented()); }
    /**
     * @abstract
     * @param {?} callback
     * @return {?}
     */
    onDestroy(callback) { }
}
/**
 * Represents an Angular View.
 *
 * <!-- TODO: move the next two paragraphs to the dev guide -->
 * A View is a fundamental building block of the application UI. It is the smallest grouping of
 * Elements which are created and destroyed together.
 *
 * Properties of elements in a View can change, but the structure (number and order) of elements in
 * a View cannot. Changing the structure of Elements can only be done by inserting, moving or
 * removing nested Views via a {\@link ViewContainerRef}. Each View can contain many View Containers.
 * <!-- /TODO -->
 *
 * ### Example
 *
 * Given this template...
 *
 * ```
 * Count: {{items.length}}
 * <ul>
 *   <li *ngFor="let  item of items">{{item}}</li>
 * </ul>
 * ```
 *
 * We have two {\@link TemplateRef}s:
 *
 * Outer {\@link TemplateRef}:
 * ```
 * Count: {{items.length}}
 * <ul>
 *   <template ngFor let-item [ngForOf]="items"></template>
 * </ul>
 * ```
 *
 * Inner {\@link TemplateRef}:
 * ```
 *   <li>{{item}}</li>
 * ```
 *
 * Notice that the original template is broken down into two separate {\@link TemplateRef}s.
 *
 * The outer/inner {\@link TemplateRef}s are then assembled into views like so:
 *
 * ```
 * <!-- ViewRef: outer-0 -->
 * Count: 2
 * <ul>
 *   <template view-container-ref></template>
 *   <!-- ViewRef: inner-1 --><li>first</li><!-- /ViewRef: inner-1 -->
 *   <!-- ViewRef: inner-2 --><li>second</li><!-- /ViewRef: inner-2 -->
 * </ul>
 * <!-- /ViewRef: outer-0 -->
 * ```
 * \@experimental
 * @abstract
 */
export class EmbeddedViewRef extends ViewRef {
    /**
     * @return {?}
     */
    get context() { return unimplemented(); }
    /**
     * @return {?}
     */
    get rootNodes() { return (unimplemented()); }
    ;
}
export class ViewRef_ {
    /**
     * @param {?} _view
     * @param {?} animationQueue
     */
    constructor(_view, animationQueue) {
        this._view = _view;
        this.animationQueue = animationQueue;
        this._view = _view;
        this._originalMode = this._view.cdMode;
    }
    /**
     * @return {?}
     */
    get internalView() { return this._view; }
    /**
     * @return {?}
     */
    get rootNodes() { return this._view.flatRootNodes; }
    /**
     * @return {?}
     */
    get context() { return this._view.context; }
    /**
     * @return {?}
     */
    get destroyed() { return this._view.destroyed; }
    /**
     * @return {?}
     */
    markForCheck() { this._view.markPathToRootAsCheckOnce(); }
    /**
     * @return {?}
     */
    detach() { this._view.cdMode = ChangeDetectorStatus.Detached; }
    /**
     * @return {?}
     */
    detectChanges() {
        this._view.detectChanges(false);
        this.animationQueue.flush();
    }
    /**
     * @return {?}
     */
    checkNoChanges() { this._view.detectChanges(true); }
    /**
     * @return {?}
     */
    reattach() {
        this._view.cdMode = this._originalMode;
        this.markForCheck();
    }
    /**
     * @param {?} callback
     * @return {?}
     */
    onDestroy(callback) {
        if (!this._view.disposables) {
            this._view.disposables = [];
        }
        this._view.disposables.push(callback);
    }
    /**
     * @return {?}
     */
    destroy() { this._view.detachAndDestroy(); }
}
function ViewRef__tsickle_Closure_declarations() {
    /**
     * \@internal
     * @type {?}
     */
    ViewRef_.prototype._originalMode;
    /** @type {?} */
    ViewRef_.prototype._view;
    /** @type {?} */
    ViewRef_.prototype.animationQueue;
}
//# sourceMappingURL=view_ref.js.map