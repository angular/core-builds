/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ElementRef } from './element_ref';
import { ViewContainerRef_ } from './view_container_ref';
import { ViewType } from './view_type';
/**
 * A ViewContainer is created for elements that have a ViewContainerRef
 * to keep track of the nested views.
 */
export class ViewContainer {
    /**
     * @param {?} index
     * @param {?} parentIndex
     * @param {?} parentView
     * @param {?} nativeElement
     */
    constructor(index, parentIndex, parentView, nativeElement) {
        this.index = index;
        this.parentIndex = parentIndex;
        this.parentView = parentView;
        this.nativeElement = nativeElement;
    }
    /**
     * @return {?}
     */
    get elementRef() { return new ElementRef(this.nativeElement); }
    /**
     * @return {?}
     */
    get vcRef() { return new ViewContainerRef_(this); }
    /**
     * @return {?}
     */
    get parentInjector() { return this.parentView.injector(this.parentIndex); }
    /**
     * @return {?}
     */
    get injector() { return this.parentView.injector(this.index); }
    /**
     * @param {?} throwOnChange
     * @return {?}
     */
    detectChangesInNestedViews(throwOnChange) {
        if (this.nestedViews) {
            for (let /** @type {?} */ i = 0; i < this.nestedViews.length; i++) {
                this.nestedViews[i].detectChanges(throwOnChange);
            }
        }
    }
    /**
     * @return {?}
     */
    destroyNestedViews() {
        if (this.nestedViews) {
            for (let /** @type {?} */ i = 0; i < this.nestedViews.length; i++) {
                this.nestedViews[i].destroy();
            }
        }
    }
    /**
     * @param {?} cb
     * @param {?} c
     * @return {?}
     */
    visitNestedViewRootNodes(cb, c) {
        if (this.nestedViews) {
            for (let /** @type {?} */ i = 0; i < this.nestedViews.length; i++) {
                this.nestedViews[i].visitRootNodesInternal(cb, c);
            }
        }
    }
    /**
     * @param {?} nestedViewClass
     * @param {?} callback
     * @return {?}
     */
    mapNestedViews(nestedViewClass, callback) {
        const /** @type {?} */ result = [];
        if (this.nestedViews) {
            for (let /** @type {?} */ i = 0; i < this.nestedViews.length; i++) {
                const /** @type {?} */ nestedView = this.nestedViews[i];
                if (nestedView.clazz === nestedViewClass) {
                    result.push(callback(nestedView));
                }
            }
        }
        if (this.projectedViews) {
            for (let /** @type {?} */ i = 0; i < this.projectedViews.length; i++) {
                const /** @type {?} */ projectedView = this.projectedViews[i];
                if (projectedView.clazz === nestedViewClass) {
                    result.push(callback(projectedView));
                }
            }
        }
        return result;
    }
    /**
     * @param {?} view
     * @param {?} currentIndex
     * @return {?}
     */
    moveView(view, currentIndex) {
        const /** @type {?} */ previousIndex = this.nestedViews.indexOf(view);
        if (view.type === ViewType.COMPONENT) {
            throw new Error(`Component views can't be moved!`);
        }
        let /** @type {?} */ nestedViews = this.nestedViews;
        if (nestedViews == null) {
            nestedViews = [];
            this.nestedViews = nestedViews;
        }
        nestedViews.splice(previousIndex, 1);
        nestedViews.splice(currentIndex, 0, view);
        const /** @type {?} */ prevView = currentIndex > 0 ? nestedViews[currentIndex - 1] : null;
        view.moveAfter(this, prevView);
    }
    /**
     * @param {?} view
     * @param {?} viewIndex
     * @return {?}
     */
    attachView(view, viewIndex) {
        if (view.type === ViewType.COMPONENT) {
            throw new Error(`Component views can't be moved!`);
        }
        let /** @type {?} */ nestedViews = this.nestedViews;
        if (nestedViews == null) {
            nestedViews = [];
            this.nestedViews = nestedViews;
        }
        // perf: array.push is faster than array.splice!
        if (viewIndex >= nestedViews.length) {
            nestedViews.push(view);
        }
        else {
            nestedViews.splice(viewIndex, 0, view);
        }
        const /** @type {?} */ prevView = viewIndex > 0 ? nestedViews[viewIndex - 1] : null;
        view.attachAfter(this, prevView);
    }
    /**
     * @param {?} viewIndex
     * @return {?}
     */
    detachView(viewIndex) {
        const /** @type {?} */ view = this.nestedViews[viewIndex];
        // perf: array.pop is faster than array.splice!
        if (viewIndex >= this.nestedViews.length - 1) {
            this.nestedViews.pop();
        }
        else {
            this.nestedViews.splice(viewIndex, 1);
        }
        if (view.type === ViewType.COMPONENT) {
            throw new Error(`Component views can't be moved!`);
        }
        view.detach();
        return view;
    }
}
function ViewContainer_tsickle_Closure_declarations() {
    /** @type {?} */
    ViewContainer.prototype.nestedViews;
    /** @type {?} */
    ViewContainer.prototype.projectedViews;
    /** @type {?} */
    ViewContainer.prototype.index;
    /** @type {?} */
    ViewContainer.prototype.parentIndex;
    /** @type {?} */
    ViewContainer.prototype.parentView;
    /** @type {?} */
    ViewContainer.prototype.nativeElement;
}
//# sourceMappingURL=view_container.js.map