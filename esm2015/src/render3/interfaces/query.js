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
/**
 * Used for tracking queries (e.g. ViewChild, ContentChild).
 * @record
 */
export function LQueries() { }
if (false) {
    /**
     * The parent LQueries instance.
     *
     * When there is a content query, a new LQueries instance is created to avoid mutating any
     * existing LQueries. After we are done searching content children, the parent property allows
     * us to traverse back up to the original LQueries instance to continue to search for matches
     * in the main view.
     * @type {?}
     */
    LQueries.prototype.parent;
    /**
     * Ask queries to prepare copy of itself. This assures that tracking new queries on content nodes
     * doesn't mutate list of queries tracked on a parent node. We will clone LQueries before
     * constructing content queries.
     * @return {?}
     */
    LQueries.prototype.clone = function () { };
    /**
     * Notify `LQueries` that a new `TNode` has been created and needs to be added to query results
     * if matching query predicate.
     * @param {?} tNode
     * @return {?}
     */
    LQueries.prototype.addNode = function (tNode) { };
    /**
     * Notify `LQueries` that a new LContainer was added to ivy data structures. As a result we need
     * to prepare room for views that might be inserted into this container.
     * @return {?}
     */
    LQueries.prototype.container = function () { };
    /**
     * Notify `LQueries` that a new `LView` has been created. As a result we need to prepare room
     * and collect nodes that match query predicate.
     * @return {?}
     */
    LQueries.prototype.createView = function () { };
    /**
     * Notify `LQueries` that a new `LView` has been added to `LContainer`. As a result all
     * the matching nodes from this view should be added to container's queries.
     * @param {?} newViewIndex
     * @return {?}
     */
    LQueries.prototype.insertView = function (newViewIndex) { };
    /**
     * Notify `LQueries` that an `LView` has been removed from `LContainer`. As a result all
     * the matching nodes from this view should be removed from container's queries.
     * @return {?}
     */
    LQueries.prototype.removeView = function () { };
    /**
     * Add additional `QueryList` to track.
     *
     * @template T
     * @param {?} queryList `QueryList` to update with changes.
     * @param {?} predicate Either `Type` or selector array of [key, value] predicates.
     * @param {?=} descend If true the query will recursively apply to the children.
     * @param {?=} read Indicates which token should be read from DI for this query.
     * @return {?}
     */
    LQueries.prototype.track = function (queryList, predicate, descend, read) { };
}
// Note: This hack is necessary so we don't erroneously get a circular dependency
// failure based on types.
/** @type {?} */
export const unusedValueExportToPlacateAjd = 1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ludGVyZmFjZXMvcXVlcnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBZUEsOEJBMkRDOzs7Ozs7Ozs7OztJQWxEQywwQkFBc0I7Ozs7Ozs7SUFPdEIsMkNBQWtCOzs7Ozs7O0lBTWxCLGtEQUFpRjs7Ozs7O0lBTWpGLCtDQUEyQjs7Ozs7O0lBTTNCLGdEQUE0Qjs7Ozs7OztJQU01Qiw0REFBdUM7Ozs7OztJQU12QyxnREFBbUI7Ozs7Ozs7Ozs7O0lBVW5CLDhFQUUwQjs7Ozs7QUFLNUIsTUFBTSxPQUFPLDZCQUE2QixHQUFHLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vLi4vaW50ZXJmYWNlL3R5cGUnO1xuaW1wb3J0IHtRdWVyeUxpc3R9IGZyb20gJy4uLy4uL2xpbmtlcic7XG5cbmltcG9ydCB7VENvbnRhaW5lck5vZGUsIFRFbGVtZW50Q29udGFpbmVyTm9kZSwgVEVsZW1lbnROb2RlLCBUTm9kZX0gZnJvbSAnLi9ub2RlJztcblxuXG4vKiogVXNlZCBmb3IgdHJhY2tpbmcgcXVlcmllcyAoZS5nLiBWaWV3Q2hpbGQsIENvbnRlbnRDaGlsZCkuICovXG5leHBvcnQgaW50ZXJmYWNlIExRdWVyaWVzIHtcbiAgLyoqXG4gICAqIFRoZSBwYXJlbnQgTFF1ZXJpZXMgaW5zdGFuY2UuXG4gICAqXG4gICAqIFdoZW4gdGhlcmUgaXMgYSBjb250ZW50IHF1ZXJ5LCBhIG5ldyBMUXVlcmllcyBpbnN0YW5jZSBpcyBjcmVhdGVkIHRvIGF2b2lkIG11dGF0aW5nIGFueVxuICAgKiBleGlzdGluZyBMUXVlcmllcy4gQWZ0ZXIgd2UgYXJlIGRvbmUgc2VhcmNoaW5nIGNvbnRlbnQgY2hpbGRyZW4sIHRoZSBwYXJlbnQgcHJvcGVydHkgYWxsb3dzXG4gICAqIHVzIHRvIHRyYXZlcnNlIGJhY2sgdXAgdG8gdGhlIG9yaWdpbmFsIExRdWVyaWVzIGluc3RhbmNlIHRvIGNvbnRpbnVlIHRvIHNlYXJjaCBmb3IgbWF0Y2hlc1xuICAgKiBpbiB0aGUgbWFpbiB2aWV3LlxuICAgKi9cbiAgcGFyZW50OiBMUXVlcmllc3xudWxsO1xuXG4gIC8qKlxuICAgKiBBc2sgcXVlcmllcyB0byBwcmVwYXJlIGNvcHkgb2YgaXRzZWxmLiBUaGlzIGFzc3VyZXMgdGhhdCB0cmFja2luZyBuZXcgcXVlcmllcyBvbiBjb250ZW50IG5vZGVzXG4gICAqIGRvZXNuJ3QgbXV0YXRlIGxpc3Qgb2YgcXVlcmllcyB0cmFja2VkIG9uIGEgcGFyZW50IG5vZGUuIFdlIHdpbGwgY2xvbmUgTFF1ZXJpZXMgYmVmb3JlXG4gICAqIGNvbnN0cnVjdGluZyBjb250ZW50IHF1ZXJpZXMuXG4gICAqL1xuICBjbG9uZSgpOiBMUXVlcmllcztcblxuICAvKipcbiAgICogTm90aWZ5IGBMUXVlcmllc2AgdGhhdCBhIG5ldyBgVE5vZGVgIGhhcyBiZWVuIGNyZWF0ZWQgYW5kIG5lZWRzIHRvIGJlIGFkZGVkIHRvIHF1ZXJ5IHJlc3VsdHNcbiAgICogaWYgbWF0Y2hpbmcgcXVlcnkgcHJlZGljYXRlLlxuICAgKi9cbiAgYWRkTm9kZSh0Tm9kZTogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZSk6IExRdWVyaWVzfG51bGw7XG5cbiAgLyoqXG4gICAqIE5vdGlmeSBgTFF1ZXJpZXNgIHRoYXQgYSBuZXcgTENvbnRhaW5lciB3YXMgYWRkZWQgdG8gaXZ5IGRhdGEgc3RydWN0dXJlcy4gQXMgYSByZXN1bHQgd2UgbmVlZFxuICAgKiB0byBwcmVwYXJlIHJvb20gZm9yIHZpZXdzIHRoYXQgbWlnaHQgYmUgaW5zZXJ0ZWQgaW50byB0aGlzIGNvbnRhaW5lci5cbiAgICovXG4gIGNvbnRhaW5lcigpOiBMUXVlcmllc3xudWxsO1xuXG4gIC8qKlxuICAgKiBOb3RpZnkgYExRdWVyaWVzYCB0aGF0IGEgbmV3IGBMVmlld2AgaGFzIGJlZW4gY3JlYXRlZC4gQXMgYSByZXN1bHQgd2UgbmVlZCB0byBwcmVwYXJlIHJvb21cbiAgICogYW5kIGNvbGxlY3Qgbm9kZXMgdGhhdCBtYXRjaCBxdWVyeSBwcmVkaWNhdGUuXG4gICAqL1xuICBjcmVhdGVWaWV3KCk6IExRdWVyaWVzfG51bGw7XG5cbiAgLyoqXG4gICAqIE5vdGlmeSBgTFF1ZXJpZXNgIHRoYXQgYSBuZXcgYExWaWV3YCBoYXMgYmVlbiBhZGRlZCB0byBgTENvbnRhaW5lcmAuIEFzIGEgcmVzdWx0IGFsbFxuICAgKiB0aGUgbWF0Y2hpbmcgbm9kZXMgZnJvbSB0aGlzIHZpZXcgc2hvdWxkIGJlIGFkZGVkIHRvIGNvbnRhaW5lcidzIHF1ZXJpZXMuXG4gICAqL1xuICBpbnNlcnRWaWV3KG5ld1ZpZXdJbmRleDogbnVtYmVyKTogdm9pZDtcblxuICAvKipcbiAgICogTm90aWZ5IGBMUXVlcmllc2AgdGhhdCBhbiBgTFZpZXdgIGhhcyBiZWVuIHJlbW92ZWQgZnJvbSBgTENvbnRhaW5lcmAuIEFzIGEgcmVzdWx0IGFsbFxuICAgKiB0aGUgbWF0Y2hpbmcgbm9kZXMgZnJvbSB0aGlzIHZpZXcgc2hvdWxkIGJlIHJlbW92ZWQgZnJvbSBjb250YWluZXIncyBxdWVyaWVzLlxuICAgKi9cbiAgcmVtb3ZlVmlldygpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBBZGQgYWRkaXRpb25hbCBgUXVlcnlMaXN0YCB0byB0cmFjay5cbiAgICpcbiAgICogQHBhcmFtIHF1ZXJ5TGlzdCBgUXVlcnlMaXN0YCB0byB1cGRhdGUgd2l0aCBjaGFuZ2VzLlxuICAgKiBAcGFyYW0gcHJlZGljYXRlIEVpdGhlciBgVHlwZWAgb3Igc2VsZWN0b3IgYXJyYXkgb2YgW2tleSwgdmFsdWVdIHByZWRpY2F0ZXMuXG4gICAqIEBwYXJhbSBkZXNjZW5kIElmIHRydWUgdGhlIHF1ZXJ5IHdpbGwgcmVjdXJzaXZlbHkgYXBwbHkgdG8gdGhlIGNoaWxkcmVuLlxuICAgKiBAcGFyYW0gcmVhZCBJbmRpY2F0ZXMgd2hpY2ggdG9rZW4gc2hvdWxkIGJlIHJlYWQgZnJvbSBESSBmb3IgdGhpcyBxdWVyeS5cbiAgICovXG4gIHRyYWNrPFQ+KFxuICAgICAgcXVlcnlMaXN0OiBRdWVyeUxpc3Q8VD4sIHByZWRpY2F0ZTogVHlwZTxhbnk+fHN0cmluZ1tdLCBkZXNjZW5kPzogYm9vbGVhbixcbiAgICAgIHJlYWQ/OiBUeXBlPFQ+KTogdm9pZDtcbn1cblxuLy8gTm90ZTogVGhpcyBoYWNrIGlzIG5lY2Vzc2FyeSBzbyB3ZSBkb24ndCBlcnJvbmVvdXNseSBnZXQgYSBjaXJjdWxhciBkZXBlbmRlbmN5XG4vLyBmYWlsdXJlIGJhc2VkIG9uIHR5cGVzLlxuZXhwb3J0IGNvbnN0IHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkID0gMTtcbiJdfQ==