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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ludGVyZmFjZXMvcXVlcnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQTBFQSxNQUFNLE9BQU8sYUFBYTtDQUE0Qzs7Ozs7O0FBSXRFLGFBQWEsNkJBQTZCLEdBQUcsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1F1ZXJ5TGlzdH0gZnJvbSAnLi4vLi4vbGlua2VyJztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vLi4vdHlwZSc7XG5pbXBvcnQge1ROb2RlfSBmcm9tICcuL25vZGUnO1xuXG4vKiogVXNlZCBmb3IgdHJhY2tpbmcgcXVlcmllcyAoZS5nLiBWaWV3Q2hpbGQsIENvbnRlbnRDaGlsZCkuICovXG5leHBvcnQgaW50ZXJmYWNlIExRdWVyaWVzIHtcbiAgLyoqXG4gICAqIFRoZSBwYXJlbnQgTFF1ZXJpZXMgaW5zdGFuY2UuXG4gICAqXG4gICAqIFdoZW4gdGhlcmUgaXMgYSBjb250ZW50IHF1ZXJ5LCBhIG5ldyBMUXVlcmllcyBpbnN0YW5jZSBpcyBjcmVhdGVkIHRvIGF2b2lkIG11dGF0aW5nIGFueVxuICAgKiBleGlzdGluZyBMUXVlcmllcy4gQWZ0ZXIgd2UgYXJlIGRvbmUgc2VhcmNoaW5nIGNvbnRlbnQgY2hpbGRyZW4sIHRoZSBwYXJlbnQgcHJvcGVydHkgYWxsb3dzXG4gICAqIHVzIHRvIHRyYXZlcnNlIGJhY2sgdXAgdG8gdGhlIG9yaWdpbmFsIExRdWVyaWVzIGluc3RhbmNlIHRvIGNvbnRpbnVlIHRvIHNlYXJjaCBmb3IgbWF0Y2hlc1xuICAgKiBpbiB0aGUgbWFpbiB2aWV3LlxuICAgKi9cbiAgcGFyZW50OiBMUXVlcmllc3xudWxsO1xuXG4gIC8qKlxuICAgKiBBc2sgcXVlcmllcyB0byBwcmVwYXJlIGNvcHkgb2YgaXRzZWxmLiBUaGlzIGFzc3VyZXMgdGhhdCB0cmFja2luZyBuZXcgcXVlcmllcyBvbiBjb250ZW50IG5vZGVzXG4gICAqIGRvZXNuJ3QgbXV0YXRlIGxpc3Qgb2YgcXVlcmllcyB0cmFja2VkIG9uIGEgcGFyZW50IG5vZGUuIFdlIHdpbGwgY2xvbmUgTFF1ZXJpZXMgYmVmb3JlXG4gICAqIGNvbnN0cnVjdGluZyBjb250ZW50IHF1ZXJpZXMuXG4gICAqL1xuICBjbG9uZSgpOiBMUXVlcmllcztcblxuICAvKipcbiAgICogTm90aWZ5IGBMUXVlcmllc2AgdGhhdCBhIG5ldyBgVE5vZGVgIGhhcyBiZWVuIGNyZWF0ZWQgYW5kIG5lZWRzIHRvIGJlIGFkZGVkIHRvIHF1ZXJ5IHJlc3VsdHNcbiAgICogaWYgbWF0Y2hpbmcgcXVlcnkgcHJlZGljYXRlLlxuICAgKi9cbiAgYWRkTm9kZSh0Tm9kZTogVE5vZGUpOiBMUXVlcmllc3xudWxsO1xuXG4gIC8qKlxuICAgKiBOb3RpZnkgYExRdWVyaWVzYCB0aGF0IGEgbmV3IExDb250YWluZXIgd2FzIGFkZGVkIHRvIGl2eSBkYXRhIHN0cnVjdHVyZXMuIEFzIGEgcmVzdWx0IHdlIG5lZWRcbiAgICogdG8gcHJlcGFyZSByb29tIGZvciB2aWV3cyB0aGF0IG1pZ2h0IGJlIGluc2VydGVkIGludG8gdGhpcyBjb250YWluZXIuXG4gICAqL1xuICBjb250YWluZXIoKTogTFF1ZXJpZXN8bnVsbDtcblxuICAvKipcbiAgICogTm90aWZ5IGBMUXVlcmllc2AgdGhhdCBhIG5ldyBgTFZpZXdgIGhhcyBiZWVuIGNyZWF0ZWQuIEFzIGEgcmVzdWx0IHdlIG5lZWQgdG8gcHJlcGFyZSByb29tXG4gICAqIGFuZCBjb2xsZWN0IG5vZGVzIHRoYXQgbWF0Y2ggcXVlcnkgcHJlZGljYXRlLlxuICAgKi9cbiAgY3JlYXRlVmlldygpOiBMUXVlcmllc3xudWxsO1xuXG4gIC8qKlxuICAgKiBOb3RpZnkgYExRdWVyaWVzYCB0aGF0IGEgbmV3IGBMVmlld2AgaGFzIGJlZW4gYWRkZWQgdG8gYExDb250YWluZXJgLiBBcyBhIHJlc3VsdCBhbGxcbiAgICogdGhlIG1hdGNoaW5nIG5vZGVzIGZyb20gdGhpcyB2aWV3IHNob3VsZCBiZSBhZGRlZCB0byBjb250YWluZXIncyBxdWVyaWVzLlxuICAgKi9cbiAgaW5zZXJ0VmlldyhuZXdWaWV3SW5kZXg6IG51bWJlcik6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIE5vdGlmeSBgTFF1ZXJpZXNgIHRoYXQgYW4gYExWaWV3YCBoYXMgYmVlbiByZW1vdmVkIGZyb20gYExDb250YWluZXJgLiBBcyBhIHJlc3VsdCBhbGxcbiAgICogdGhlIG1hdGNoaW5nIG5vZGVzIGZyb20gdGhpcyB2aWV3IHNob3VsZCBiZSByZW1vdmVkIGZyb20gY29udGFpbmVyJ3MgcXVlcmllcy5cbiAgICovXG4gIHJlbW92ZVZpZXcoKTogdm9pZDtcblxuICAvKipcbiAgICogQWRkIGFkZGl0aW9uYWwgYFF1ZXJ5TGlzdGAgdG8gdHJhY2suXG4gICAqXG4gICAqIEBwYXJhbSBxdWVyeUxpc3QgYFF1ZXJ5TGlzdGAgdG8gdXBkYXRlIHdpdGggY2hhbmdlcy5cbiAgICogQHBhcmFtIHByZWRpY2F0ZSBFaXRoZXIgYFR5cGVgIG9yIHNlbGVjdG9yIGFycmF5IG9mIFtrZXksIHZhbHVlXSBwcmVkaWNhdGVzLlxuICAgKiBAcGFyYW0gZGVzY2VuZCBJZiB0cnVlIHRoZSBxdWVyeSB3aWxsIHJlY3Vyc2l2ZWx5IGFwcGx5IHRvIHRoZSBjaGlsZHJlbi5cbiAgICogQHBhcmFtIHJlYWQgSW5kaWNhdGVzIHdoaWNoIHRva2VuIHNob3VsZCBiZSByZWFkIGZyb20gREkgZm9yIHRoaXMgcXVlcnkuXG4gICAqL1xuICB0cmFjazxUPihcbiAgICAgIHF1ZXJ5TGlzdDogUXVlcnlMaXN0PFQ+LCBwcmVkaWNhdGU6IFR5cGU8YW55PnxzdHJpbmdbXSwgZGVzY2VuZD86IGJvb2xlYW4sXG4gICAgICByZWFkPzogUXVlcnlSZWFkVHlwZTxUPnxUeXBlPFQ+KTogdm9pZDtcbn1cblxuZXhwb3J0IGNsYXNzIFF1ZXJ5UmVhZFR5cGU8VD4geyBwcml2YXRlIGRlZmVhdFN0cnVjdHVyYWxUeXBpbmc6IGFueTsgfVxuXG4vLyBOb3RlOiBUaGlzIGhhY2sgaXMgbmVjZXNzYXJ5IHNvIHdlIGRvbid0IGVycm9uZW91c2x5IGdldCBhIGNpcmN1bGFyIGRlcGVuZGVuY3lcbi8vIGZhaWx1cmUgYmFzZWQgb24gdHlwZXMuXG5leHBvcnQgY29uc3QgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgPSAxO1xuIl19