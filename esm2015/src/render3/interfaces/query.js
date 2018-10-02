/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
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
 * @type {?}
 */
LQueries.prototype.clone;
/**
 * Notify `LQueries` that a new `TNode` has been created and needs to be added to query results
 * if matching query predicate.
 * @type {?}
 */
LQueries.prototype.addNode;
/**
 * Notify `LQueries` that a new LContainer was added to ivy data structures. As a result we need
 * to prepare room for views that might be inserted into this container.
 * @type {?}
 */
LQueries.prototype.container;
/**
 * Notify `LQueries` that a new `LView` has been created. As a result we need to prepare room
 * and collect nodes that match query predicate.
 * @type {?}
 */
LQueries.prototype.createView;
/**
 * Notify `LQueries` that a new `LView` has been added to `LContainer`. As a result all
 * the matching nodes from this view should be added to container's queries.
 * @type {?}
 */
LQueries.prototype.insertView;
/**
 * Notify `LQueries` that an `LView` has been removed from `LContainer`. As a result all
 * the matching nodes from this view should be removed from container's queries.
 * @type {?}
 */
LQueries.prototype.removeView;
/**
 * Add additional `QueryList` to track.
 *
 * \@param queryList `QueryList` to update with changes.
 * \@param predicate Either `Type` or selector array of [key, value] predicates.
 * \@param descend If true the query will recursively apply to the children.
 * \@param read Indicates which token should be read from DI for this query.
 * @type {?}
 */
LQueries.prototype.track;
/**
 * @template T
 */
export class QueryReadType {
}
if (false) {
    /** @type {?} */
    QueryReadType.prototype.defeatStructuralTyping;
}
/** @type {?} */
export const unusedValueExportToPlacateAjd = 1;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ludGVyZmFjZXMvcXVlcnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQTBFQSxNQUFNLE9BQU8sYUFBYTtDQUE0Qzs7Ozs7O0FBSXRFLGFBQWEsNkJBQTZCLEdBQUcsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1F1ZXJ5TGlzdH0gZnJvbSAnLi4vLi4vbGlua2VyJztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vLi4vdHlwZSc7XG5pbXBvcnQge1RDb250YWluZXJOb2RlLCBURWxlbWVudENvbnRhaW5lck5vZGUsIFRFbGVtZW50Tm9kZSwgVE5vZGV9IGZyb20gJy4vbm9kZSc7XG5cbi8qKiBVc2VkIGZvciB0cmFja2luZyBxdWVyaWVzIChlLmcuIFZpZXdDaGlsZCwgQ29udGVudENoaWxkKS4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTFF1ZXJpZXMge1xuICAvKipcbiAgICogVGhlIHBhcmVudCBMUXVlcmllcyBpbnN0YW5jZS5cbiAgICpcbiAgICogV2hlbiB0aGVyZSBpcyBhIGNvbnRlbnQgcXVlcnksIGEgbmV3IExRdWVyaWVzIGluc3RhbmNlIGlzIGNyZWF0ZWQgdG8gYXZvaWQgbXV0YXRpbmcgYW55XG4gICAqIGV4aXN0aW5nIExRdWVyaWVzLiBBZnRlciB3ZSBhcmUgZG9uZSBzZWFyY2hpbmcgY29udGVudCBjaGlsZHJlbiwgdGhlIHBhcmVudCBwcm9wZXJ0eSBhbGxvd3NcbiAgICogdXMgdG8gdHJhdmVyc2UgYmFjayB1cCB0byB0aGUgb3JpZ2luYWwgTFF1ZXJpZXMgaW5zdGFuY2UgdG8gY29udGludWUgdG8gc2VhcmNoIGZvciBtYXRjaGVzXG4gICAqIGluIHRoZSBtYWluIHZpZXcuXG4gICAqL1xuICBwYXJlbnQ6IExRdWVyaWVzfG51bGw7XG5cbiAgLyoqXG4gICAqIEFzayBxdWVyaWVzIHRvIHByZXBhcmUgY29weSBvZiBpdHNlbGYuIFRoaXMgYXNzdXJlcyB0aGF0IHRyYWNraW5nIG5ldyBxdWVyaWVzIG9uIGNvbnRlbnQgbm9kZXNcbiAgICogZG9lc24ndCBtdXRhdGUgbGlzdCBvZiBxdWVyaWVzIHRyYWNrZWQgb24gYSBwYXJlbnQgbm9kZS4gV2Ugd2lsbCBjbG9uZSBMUXVlcmllcyBiZWZvcmVcbiAgICogY29uc3RydWN0aW5nIGNvbnRlbnQgcXVlcmllcy5cbiAgICovXG4gIGNsb25lKCk6IExRdWVyaWVzO1xuXG4gIC8qKlxuICAgKiBOb3RpZnkgYExRdWVyaWVzYCB0aGF0IGEgbmV3IGBUTm9kZWAgaGFzIGJlZW4gY3JlYXRlZCBhbmQgbmVlZHMgdG8gYmUgYWRkZWQgdG8gcXVlcnkgcmVzdWx0c1xuICAgKiBpZiBtYXRjaGluZyBxdWVyeSBwcmVkaWNhdGUuXG4gICAqL1xuICBhZGROb2RlKHROb2RlOiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlKTogTFF1ZXJpZXN8bnVsbDtcblxuICAvKipcbiAgICogTm90aWZ5IGBMUXVlcmllc2AgdGhhdCBhIG5ldyBMQ29udGFpbmVyIHdhcyBhZGRlZCB0byBpdnkgZGF0YSBzdHJ1Y3R1cmVzLiBBcyBhIHJlc3VsdCB3ZSBuZWVkXG4gICAqIHRvIHByZXBhcmUgcm9vbSBmb3Igdmlld3MgdGhhdCBtaWdodCBiZSBpbnNlcnRlZCBpbnRvIHRoaXMgY29udGFpbmVyLlxuICAgKi9cbiAgY29udGFpbmVyKCk6IExRdWVyaWVzfG51bGw7XG5cbiAgLyoqXG4gICAqIE5vdGlmeSBgTFF1ZXJpZXNgIHRoYXQgYSBuZXcgYExWaWV3YCBoYXMgYmVlbiBjcmVhdGVkLiBBcyBhIHJlc3VsdCB3ZSBuZWVkIHRvIHByZXBhcmUgcm9vbVxuICAgKiBhbmQgY29sbGVjdCBub2RlcyB0aGF0IG1hdGNoIHF1ZXJ5IHByZWRpY2F0ZS5cbiAgICovXG4gIGNyZWF0ZVZpZXcoKTogTFF1ZXJpZXN8bnVsbDtcblxuICAvKipcbiAgICogTm90aWZ5IGBMUXVlcmllc2AgdGhhdCBhIG5ldyBgTFZpZXdgIGhhcyBiZWVuIGFkZGVkIHRvIGBMQ29udGFpbmVyYC4gQXMgYSByZXN1bHQgYWxsXG4gICAqIHRoZSBtYXRjaGluZyBub2RlcyBmcm9tIHRoaXMgdmlldyBzaG91bGQgYmUgYWRkZWQgdG8gY29udGFpbmVyJ3MgcXVlcmllcy5cbiAgICovXG4gIGluc2VydFZpZXcobmV3Vmlld0luZGV4OiBudW1iZXIpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBOb3RpZnkgYExRdWVyaWVzYCB0aGF0IGFuIGBMVmlld2AgaGFzIGJlZW4gcmVtb3ZlZCBmcm9tIGBMQ29udGFpbmVyYC4gQXMgYSByZXN1bHQgYWxsXG4gICAqIHRoZSBtYXRjaGluZyBub2RlcyBmcm9tIHRoaXMgdmlldyBzaG91bGQgYmUgcmVtb3ZlZCBmcm9tIGNvbnRhaW5lcidzIHF1ZXJpZXMuXG4gICAqL1xuICByZW1vdmVWaWV3KCk6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIEFkZCBhZGRpdGlvbmFsIGBRdWVyeUxpc3RgIHRvIHRyYWNrLlxuICAgKlxuICAgKiBAcGFyYW0gcXVlcnlMaXN0IGBRdWVyeUxpc3RgIHRvIHVwZGF0ZSB3aXRoIGNoYW5nZXMuXG4gICAqIEBwYXJhbSBwcmVkaWNhdGUgRWl0aGVyIGBUeXBlYCBvciBzZWxlY3RvciBhcnJheSBvZiBba2V5LCB2YWx1ZV0gcHJlZGljYXRlcy5cbiAgICogQHBhcmFtIGRlc2NlbmQgSWYgdHJ1ZSB0aGUgcXVlcnkgd2lsbCByZWN1cnNpdmVseSBhcHBseSB0byB0aGUgY2hpbGRyZW4uXG4gICAqIEBwYXJhbSByZWFkIEluZGljYXRlcyB3aGljaCB0b2tlbiBzaG91bGQgYmUgcmVhZCBmcm9tIERJIGZvciB0aGlzIHF1ZXJ5LlxuICAgKi9cbiAgdHJhY2s8VD4oXG4gICAgICBxdWVyeUxpc3Q6IFF1ZXJ5TGlzdDxUPiwgcHJlZGljYXRlOiBUeXBlPGFueT58c3RyaW5nW10sIGRlc2NlbmQ/OiBib29sZWFuLFxuICAgICAgcmVhZD86IFF1ZXJ5UmVhZFR5cGU8VD58VHlwZTxUPik6IHZvaWQ7XG59XG5cbmV4cG9ydCBjbGFzcyBRdWVyeVJlYWRUeXBlPFQ+IHsgcHJpdmF0ZSBkZWZlYXRTdHJ1Y3R1cmFsVHlwaW5nOiBhbnk7IH1cblxuLy8gTm90ZTogVGhpcyBoYWNrIGlzIG5lY2Vzc2FyeSBzbyB3ZSBkb24ndCBlcnJvbmVvdXNseSBnZXQgYSBjaXJjdWxhciBkZXBlbmRlbmN5XG4vLyBmYWlsdXJlIGJhc2VkIG9uIHR5cGVzLlxuZXhwb3J0IGNvbnN0IHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkID0gMTtcbiJdfQ==