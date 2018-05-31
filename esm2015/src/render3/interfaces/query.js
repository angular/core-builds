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
/**
 * Used for tracking queries (e.g. ViewChild, ContentChild).
 * @record
 */
export function LQueries() { }
function LQueries_tsickle_Closure_declarations() {
    /**
     * Used to ask queries if those should be cloned to the child element.
     *
     * For example in the case of deep queries the `child()` returns
     * queries for the child node. In case of shallow queries it returns
     * `null`.
     * @type {?}
     */
    LQueries.prototype.child;
    /**
     * Notify `LQueries` that a new `LNode` has been created and needs to be added to query results
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
}
/**
 * @template T
 */
export class QueryReadType {
}
function QueryReadType_tsickle_Closure_declarations() {
    /** @type {?} */
    QueryReadType.prototype.defeatStructuralTyping;
}
// Note: This hack is necessary so we don't erroneously get a circular dependency
// failure based on types.
export const /** @type {?} */ unusedValueExportToPlacateAjd = 1;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ludGVyZmFjZXMvcXVlcnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWtFQSxNQUFNO0NBQWdFOzs7Ozs7O0FBSXRFLE1BQU0sQ0FBQyx1QkFBTSw2QkFBNkIsR0FBRyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UXVlcnlMaXN0fSBmcm9tICcuLi8uLi9saW5rZXInO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi8uLi90eXBlJztcbmltcG9ydCB7TE5vZGV9IGZyb20gJy4vbm9kZSc7XG5cbi8qKiBVc2VkIGZvciB0cmFja2luZyBxdWVyaWVzIChlLmcuIFZpZXdDaGlsZCwgQ29udGVudENoaWxkKS4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTFF1ZXJpZXMge1xuICAvKipcbiAgICogVXNlZCB0byBhc2sgcXVlcmllcyBpZiB0aG9zZSBzaG91bGQgYmUgY2xvbmVkIHRvIHRoZSBjaGlsZCBlbGVtZW50LlxuICAgKlxuICAgKiBGb3IgZXhhbXBsZSBpbiB0aGUgY2FzZSBvZiBkZWVwIHF1ZXJpZXMgdGhlIGBjaGlsZCgpYCByZXR1cm5zXG4gICAqIHF1ZXJpZXMgZm9yIHRoZSBjaGlsZCBub2RlLiBJbiBjYXNlIG9mIHNoYWxsb3cgcXVlcmllcyBpdCByZXR1cm5zXG4gICAqIGBudWxsYC5cbiAgICovXG4gIGNoaWxkKCk6IExRdWVyaWVzfG51bGw7XG5cbiAgLyoqXG4gICAqIE5vdGlmeSBgTFF1ZXJpZXNgIHRoYXQgYSBuZXcgYExOb2RlYCBoYXMgYmVlbiBjcmVhdGVkIGFuZCBuZWVkcyB0byBiZSBhZGRlZCB0byBxdWVyeSByZXN1bHRzXG4gICAqIGlmIG1hdGNoaW5nIHF1ZXJ5IHByZWRpY2F0ZS5cbiAgICovXG4gIGFkZE5vZGUobm9kZTogTE5vZGUpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBOb3RpZnkgYExRdWVyaWVzYCB0aGF0IGEgbmV3IExDb250YWluZXIgd2FzIGFkZGVkIHRvIGl2eSBkYXRhIHN0cnVjdHVyZXMuIEFzIGEgcmVzdWx0IHdlIG5lZWRcbiAgICogdG8gcHJlcGFyZSByb29tIGZvciB2aWV3cyB0aGF0IG1pZ2h0IGJlIGluc2VydGVkIGludG8gdGhpcyBjb250YWluZXIuXG4gICAqL1xuICBjb250YWluZXIoKTogTFF1ZXJpZXN8bnVsbDtcblxuICAvKipcbiAgICogTm90aWZ5IGBMUXVlcmllc2AgdGhhdCBhIG5ldyBgTFZpZXdgIGhhcyBiZWVuIGNyZWF0ZWQuIEFzIGEgcmVzdWx0IHdlIG5lZWQgdG8gcHJlcGFyZSByb29tXG4gICAqIGFuZCBjb2xsZWN0IG5vZGVzIHRoYXQgbWF0Y2ggcXVlcnkgcHJlZGljYXRlLlxuICAgKi9cbiAgY3JlYXRlVmlldygpOiBMUXVlcmllc3xudWxsO1xuXG4gIC8qKlxuICAgKiBOb3RpZnkgYExRdWVyaWVzYCB0aGF0IGEgbmV3IGBMVmlld2AgaGFzIGJlZW4gYWRkZWQgdG8gYExDb250YWluZXJgLiBBcyBhIHJlc3VsdCBhbGxcbiAgICogdGhlIG1hdGNoaW5nIG5vZGVzIGZyb20gdGhpcyB2aWV3IHNob3VsZCBiZSBhZGRlZCB0byBjb250YWluZXIncyBxdWVyaWVzLlxuICAgKi9cbiAgaW5zZXJ0VmlldyhuZXdWaWV3SW5kZXg6IG51bWJlcik6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIE5vdGlmeSBgTFF1ZXJpZXNgIHRoYXQgYW4gYExWaWV3YCBoYXMgYmVlbiByZW1vdmVkIGZyb20gYExDb250YWluZXJgLiBBcyBhIHJlc3VsdCBhbGxcbiAgICogdGhlIG1hdGNoaW5nIG5vZGVzIGZyb20gdGhpcyB2aWV3IHNob3VsZCBiZSByZW1vdmVkIGZyb20gY29udGFpbmVyJ3MgcXVlcmllcy5cbiAgICovXG4gIHJlbW92ZVZpZXcocmVtb3ZlSW5kZXg6IG51bWJlcik6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIEFkZCBhZGRpdGlvbmFsIGBRdWVyeUxpc3RgIHRvIHRyYWNrLlxuICAgKlxuICAgKiBAcGFyYW0gcXVlcnlMaXN0IGBRdWVyeUxpc3RgIHRvIHVwZGF0ZSB3aXRoIGNoYW5nZXMuXG4gICAqIEBwYXJhbSBwcmVkaWNhdGUgRWl0aGVyIGBUeXBlYCBvciBzZWxlY3RvciBhcnJheSBvZiBba2V5LCB2YWx1ZV0gcHJlZGljYXRlcy5cbiAgICogQHBhcmFtIGRlc2NlbmQgSWYgdHJ1ZSB0aGUgcXVlcnkgd2lsbCByZWN1cnNpdmVseSBhcHBseSB0byB0aGUgY2hpbGRyZW4uXG4gICAqIEBwYXJhbSByZWFkIEluZGljYXRlcyB3aGljaCB0b2tlbiBzaG91bGQgYmUgcmVhZCBmcm9tIERJIGZvciB0aGlzIHF1ZXJ5LlxuICAgKi9cbiAgdHJhY2s8VD4oXG4gICAgICBxdWVyeUxpc3Q6IFF1ZXJ5TGlzdDxUPiwgcHJlZGljYXRlOiBUeXBlPGFueT58c3RyaW5nW10sIGRlc2NlbmQ/OiBib29sZWFuLFxuICAgICAgcmVhZD86IFF1ZXJ5UmVhZFR5cGU8VD58VHlwZTxUPik6IHZvaWQ7XG59XG5cbmV4cG9ydCBjbGFzcyBRdWVyeVJlYWRUeXBlPFQ+IHsgcHJpdmF0ZSBkZWZlYXRTdHJ1Y3R1cmFsVHlwaW5nOiBhbnk7IH1cblxuLy8gTm90ZTogVGhpcyBoYWNrIGlzIG5lY2Vzc2FyeSBzbyB3ZSBkb24ndCBlcnJvbmVvdXNseSBnZXQgYSBjaXJjdWxhciBkZXBlbmRlbmN5XG4vLyBmYWlsdXJlIGJhc2VkIG9uIHR5cGVzLlxuZXhwb3J0IGNvbnN0IHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkID0gMTtcbiJdfQ==