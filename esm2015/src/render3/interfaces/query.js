/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
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
     * The index of the node on which this LQueries instance was created / cloned in a given LView.
     *
     * This index is stored to minimize LQueries cloning: we can observe that LQueries can be mutated
     * only under 2 conditions:
     * - we are crossing an element that has directives with content queries (new queries are added);
     * - we are descending into element hierarchy (creating a child element of an existing element)
     * and the current LQueries object is tracking shallow queries (shallow queries are removed).
     *
     * Since LQueries are not cloned systematically we need to know exactly where (on each element)
     * cloning occurred, so we can properly restore the set of tracked queries when going up the
     * elements hierarchy.
     *
     * Always set to -1 for view queries as view queries are created before we process any node in a
     * given view.
     * @type {?}
     */
    LQueries.prototype.nodeIndex;
    /**
     * Ask queries to prepare a copy of itself. This ensures that:
     * - tracking new queries on content nodes doesn't mutate list of queries tracked on a parent
     * node;
     * - we don't track shallow queries when descending into elements hierarchy.
     *
     * We will clone LQueries before constructing content queries
     * @param {?} tNode
     * @return {?}
     */
    LQueries.prototype.clone = function (tNode) { };
    /**
     * Notify `LQueries` that a new `TNode` has been created and needs to be added to query results
     * if matching query predicate.
     * @param {?} tNode
     * @return {?}
     */
    LQueries.prototype.addNode = function (tNode) { };
    /**
     * Notify `LQueries` that a new `TNode` has been created and needs to be added to query results
     * if matching query predicate. This is a special mode invoked if the query container has to
     * be created out of order (e.g. view created in the constructor of a directive).
     * @param {?} tNode
     * @return {?}
     */
    LQueries.prototype.insertNodeBeforeViews = function (tNode) { };
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ludGVyZmFjZXMvcXVlcnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBZUEsOEJBdUZDOzs7Ozs7Ozs7OztJQTlFQywwQkFBc0I7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWtCdEIsNkJBQWtCOzs7Ozs7Ozs7OztJQVVsQixnREFBOEI7Ozs7Ozs7SUFNOUIsa0RBQXdFOzs7Ozs7OztJQU94RSxnRUFBc0Y7Ozs7OztJQU10RiwrQ0FBMkI7Ozs7OztJQU0zQixnREFBNEI7Ozs7Ozs7SUFNNUIsNERBQXVDOzs7Ozs7SUFNdkMsZ0RBQW1COzs7Ozs7Ozs7OztJQVVuQiw4RUFFMEI7Ozs7O0FBSzVCLE1BQU0sT0FBTyw2QkFBNkIsR0FBRyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1R5cGV9IGZyb20gJy4uLy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7UXVlcnlMaXN0fSBmcm9tICcuLi8uLi9saW5rZXInO1xuXG5pbXBvcnQge1RDb250YWluZXJOb2RlLCBURWxlbWVudENvbnRhaW5lck5vZGUsIFRFbGVtZW50Tm9kZSwgVE5vZGV9IGZyb20gJy4vbm9kZSc7XG5cblxuLyoqIFVzZWQgZm9yIHRyYWNraW5nIHF1ZXJpZXMgKGUuZy4gVmlld0NoaWxkLCBDb250ZW50Q2hpbGQpLiAqL1xuZXhwb3J0IGludGVyZmFjZSBMUXVlcmllcyB7XG4gIC8qKlxuICAgKiBUaGUgcGFyZW50IExRdWVyaWVzIGluc3RhbmNlLlxuICAgKlxuICAgKiBXaGVuIHRoZXJlIGlzIGEgY29udGVudCBxdWVyeSwgYSBuZXcgTFF1ZXJpZXMgaW5zdGFuY2UgaXMgY3JlYXRlZCB0byBhdm9pZCBtdXRhdGluZyBhbnlcbiAgICogZXhpc3RpbmcgTFF1ZXJpZXMuIEFmdGVyIHdlIGFyZSBkb25lIHNlYXJjaGluZyBjb250ZW50IGNoaWxkcmVuLCB0aGUgcGFyZW50IHByb3BlcnR5IGFsbG93c1xuICAgKiB1cyB0byB0cmF2ZXJzZSBiYWNrIHVwIHRvIHRoZSBvcmlnaW5hbCBMUXVlcmllcyBpbnN0YW5jZSB0byBjb250aW51ZSB0byBzZWFyY2ggZm9yIG1hdGNoZXNcbiAgICogaW4gdGhlIG1haW4gdmlldy5cbiAgICovXG4gIHBhcmVudDogTFF1ZXJpZXN8bnVsbDtcblxuICAvKipcbiAgICogVGhlIGluZGV4IG9mIHRoZSBub2RlIG9uIHdoaWNoIHRoaXMgTFF1ZXJpZXMgaW5zdGFuY2Ugd2FzIGNyZWF0ZWQgLyBjbG9uZWQgaW4gYSBnaXZlbiBMVmlldy5cbiAgICpcbiAgICogVGhpcyBpbmRleCBpcyBzdG9yZWQgdG8gbWluaW1pemUgTFF1ZXJpZXMgY2xvbmluZzogd2UgY2FuIG9ic2VydmUgdGhhdCBMUXVlcmllcyBjYW4gYmUgbXV0YXRlZFxuICAgKiBvbmx5IHVuZGVyIDIgY29uZGl0aW9uczpcbiAgICogLSB3ZSBhcmUgY3Jvc3NpbmcgYW4gZWxlbWVudCB0aGF0IGhhcyBkaXJlY3RpdmVzIHdpdGggY29udGVudCBxdWVyaWVzIChuZXcgcXVlcmllcyBhcmUgYWRkZWQpO1xuICAgKiAtIHdlIGFyZSBkZXNjZW5kaW5nIGludG8gZWxlbWVudCBoaWVyYXJjaHkgKGNyZWF0aW5nIGEgY2hpbGQgZWxlbWVudCBvZiBhbiBleGlzdGluZyBlbGVtZW50KVxuICAgKiBhbmQgdGhlIGN1cnJlbnQgTFF1ZXJpZXMgb2JqZWN0IGlzIHRyYWNraW5nIHNoYWxsb3cgcXVlcmllcyAoc2hhbGxvdyBxdWVyaWVzIGFyZSByZW1vdmVkKS5cbiAgICpcbiAgICogU2luY2UgTFF1ZXJpZXMgYXJlIG5vdCBjbG9uZWQgc3lzdGVtYXRpY2FsbHkgd2UgbmVlZCB0byBrbm93IGV4YWN0bHkgd2hlcmUgKG9uIGVhY2ggZWxlbWVudClcbiAgICogY2xvbmluZyBvY2N1cnJlZCwgc28gd2UgY2FuIHByb3Blcmx5IHJlc3RvcmUgdGhlIHNldCBvZiB0cmFja2VkIHF1ZXJpZXMgd2hlbiBnb2luZyB1cCB0aGVcbiAgICogZWxlbWVudHMgaGllcmFyY2h5LlxuICAgKlxuICAgKiBBbHdheXMgc2V0IHRvIC0xIGZvciB2aWV3IHF1ZXJpZXMgYXMgdmlldyBxdWVyaWVzIGFyZSBjcmVhdGVkIGJlZm9yZSB3ZSBwcm9jZXNzIGFueSBub2RlIGluIGFcbiAgICogZ2l2ZW4gdmlldy5cbiAgICovXG4gIG5vZGVJbmRleDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBBc2sgcXVlcmllcyB0byBwcmVwYXJlIGEgY29weSBvZiBpdHNlbGYuIFRoaXMgZW5zdXJlcyB0aGF0OlxuICAgKiAtIHRyYWNraW5nIG5ldyBxdWVyaWVzIG9uIGNvbnRlbnQgbm9kZXMgZG9lc24ndCBtdXRhdGUgbGlzdCBvZiBxdWVyaWVzIHRyYWNrZWQgb24gYSBwYXJlbnRcbiAgICogbm9kZTtcbiAgICogLSB3ZSBkb24ndCB0cmFjayBzaGFsbG93IHF1ZXJpZXMgd2hlbiBkZXNjZW5kaW5nIGludG8gZWxlbWVudHMgaGllcmFyY2h5LlxuICAgKlxuICAgKiBXZSB3aWxsIGNsb25lIExRdWVyaWVzIGJlZm9yZSBjb25zdHJ1Y3RpbmcgY29udGVudCBxdWVyaWVzXG4gICAqL1xuICBjbG9uZSh0Tm9kZTogVE5vZGUpOiBMUXVlcmllcztcblxuICAvKipcbiAgICogTm90aWZ5IGBMUXVlcmllc2AgdGhhdCBhIG5ldyBgVE5vZGVgIGhhcyBiZWVuIGNyZWF0ZWQgYW5kIG5lZWRzIHRvIGJlIGFkZGVkIHRvIHF1ZXJ5IHJlc3VsdHNcbiAgICogaWYgbWF0Y2hpbmcgcXVlcnkgcHJlZGljYXRlLlxuICAgKi9cbiAgYWRkTm9kZSh0Tm9kZTogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZSk6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIE5vdGlmeSBgTFF1ZXJpZXNgIHRoYXQgYSBuZXcgYFROb2RlYCBoYXMgYmVlbiBjcmVhdGVkIGFuZCBuZWVkcyB0byBiZSBhZGRlZCB0byBxdWVyeSByZXN1bHRzXG4gICAqIGlmIG1hdGNoaW5nIHF1ZXJ5IHByZWRpY2F0ZS4gVGhpcyBpcyBhIHNwZWNpYWwgbW9kZSBpbnZva2VkIGlmIHRoZSBxdWVyeSBjb250YWluZXIgaGFzIHRvXG4gICAqIGJlIGNyZWF0ZWQgb3V0IG9mIG9yZGVyIChlLmcuIHZpZXcgY3JlYXRlZCBpbiB0aGUgY29uc3RydWN0b3Igb2YgYSBkaXJlY3RpdmUpLlxuICAgKi9cbiAgaW5zZXJ0Tm9kZUJlZm9yZVZpZXdzKHROb2RlOiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlKTogdm9pZDtcblxuICAvKipcbiAgICogTm90aWZ5IGBMUXVlcmllc2AgdGhhdCBhIG5ldyBMQ29udGFpbmVyIHdhcyBhZGRlZCB0byBpdnkgZGF0YSBzdHJ1Y3R1cmVzLiBBcyBhIHJlc3VsdCB3ZSBuZWVkXG4gICAqIHRvIHByZXBhcmUgcm9vbSBmb3Igdmlld3MgdGhhdCBtaWdodCBiZSBpbnNlcnRlZCBpbnRvIHRoaXMgY29udGFpbmVyLlxuICAgKi9cbiAgY29udGFpbmVyKCk6IExRdWVyaWVzfG51bGw7XG5cbiAgLyoqXG4gICAqIE5vdGlmeSBgTFF1ZXJpZXNgIHRoYXQgYSBuZXcgYExWaWV3YCBoYXMgYmVlbiBjcmVhdGVkLiBBcyBhIHJlc3VsdCB3ZSBuZWVkIHRvIHByZXBhcmUgcm9vbVxuICAgKiBhbmQgY29sbGVjdCBub2RlcyB0aGF0IG1hdGNoIHF1ZXJ5IHByZWRpY2F0ZS5cbiAgICovXG4gIGNyZWF0ZVZpZXcoKTogTFF1ZXJpZXN8bnVsbDtcblxuICAvKipcbiAgICogTm90aWZ5IGBMUXVlcmllc2AgdGhhdCBhIG5ldyBgTFZpZXdgIGhhcyBiZWVuIGFkZGVkIHRvIGBMQ29udGFpbmVyYC4gQXMgYSByZXN1bHQgYWxsXG4gICAqIHRoZSBtYXRjaGluZyBub2RlcyBmcm9tIHRoaXMgdmlldyBzaG91bGQgYmUgYWRkZWQgdG8gY29udGFpbmVyJ3MgcXVlcmllcy5cbiAgICovXG4gIGluc2VydFZpZXcobmV3Vmlld0luZGV4OiBudW1iZXIpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBOb3RpZnkgYExRdWVyaWVzYCB0aGF0IGFuIGBMVmlld2AgaGFzIGJlZW4gcmVtb3ZlZCBmcm9tIGBMQ29udGFpbmVyYC4gQXMgYSByZXN1bHQgYWxsXG4gICAqIHRoZSBtYXRjaGluZyBub2RlcyBmcm9tIHRoaXMgdmlldyBzaG91bGQgYmUgcmVtb3ZlZCBmcm9tIGNvbnRhaW5lcidzIHF1ZXJpZXMuXG4gICAqL1xuICByZW1vdmVWaWV3KCk6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIEFkZCBhZGRpdGlvbmFsIGBRdWVyeUxpc3RgIHRvIHRyYWNrLlxuICAgKlxuICAgKiBAcGFyYW0gcXVlcnlMaXN0IGBRdWVyeUxpc3RgIHRvIHVwZGF0ZSB3aXRoIGNoYW5nZXMuXG4gICAqIEBwYXJhbSBwcmVkaWNhdGUgRWl0aGVyIGBUeXBlYCBvciBzZWxlY3RvciBhcnJheSBvZiBba2V5LCB2YWx1ZV0gcHJlZGljYXRlcy5cbiAgICogQHBhcmFtIGRlc2NlbmQgSWYgdHJ1ZSB0aGUgcXVlcnkgd2lsbCByZWN1cnNpdmVseSBhcHBseSB0byB0aGUgY2hpbGRyZW4uXG4gICAqIEBwYXJhbSByZWFkIEluZGljYXRlcyB3aGljaCB0b2tlbiBzaG91bGQgYmUgcmVhZCBmcm9tIERJIGZvciB0aGlzIHF1ZXJ5LlxuICAgKi9cbiAgdHJhY2s8VD4oXG4gICAgICBxdWVyeUxpc3Q6IFF1ZXJ5TGlzdDxUPiwgcHJlZGljYXRlOiBUeXBlPGFueT58c3RyaW5nW10sIGRlc2NlbmQ/OiBib29sZWFuLFxuICAgICAgcmVhZD86IFR5cGU8VD4pOiB2b2lkO1xufVxuXG4vLyBOb3RlOiBUaGlzIGhhY2sgaXMgbmVjZXNzYXJ5IHNvIHdlIGRvbid0IGVycm9uZW91c2x5IGdldCBhIGNpcmN1bGFyIGRlcGVuZGVuY3lcbi8vIGZhaWx1cmUgYmFzZWQgb24gdHlwZXMuXG5leHBvcnQgY29uc3QgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgPSAxO1xuIl19