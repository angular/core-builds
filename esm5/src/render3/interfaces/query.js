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
     * Notify `LQueries` that a  `LNode` has been created and needs to be added to query results
     * if matching query predicate.
     * @type {?}
     */
    LQueries.prototype.container;
    /**
     * Notify `LQueries` that a new view was created and is being entered in the creation mode.
     * This allow queries to prepare space for matching nodes from views.
     * @type {?}
     */
    LQueries.prototype.enterView;
    /**
     * Notify `LQueries` that an `LViewNode` has been removed from `LContainerNode`. As a result all
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
var /**
 * @template T
 */
QueryReadType = /** @class */ (function () {
    function QueryReadType() {
    }
    return QueryReadType;
}());
/**
 * @template T
 */
export { QueryReadType };
function QueryReadType_tsickle_Closure_declarations() {
    /** @type {?} */
    QueryReadType.prototype.defeatStructuralTyping;
}
// Note: This hack is necessary so we don't erroneously get a circular dependency
// failure based on types.
export var /** @type {?} */ unusedValueExportToPlacateAjd = 1;
//# sourceMappingURL=query.js.map