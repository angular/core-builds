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
import { EventEmitter } from '../event_emitter';
import { getSymbolIterator } from '../util';
import { assertDefined, assertEqual } from './assert';
import { ReadFromInjectorFn, getOrCreateNodeInjectorForNode } from './di';
import { assertPreviousIsParent, getCurrentQueries, store, storeCleanupWithContext } from './instructions';
import { unusedValueExportToPlacateAjd as unused1 } from './interfaces/definition';
import { unusedValueExportToPlacateAjd as unused2 } from './interfaces/injector';
import { unusedValueExportToPlacateAjd as unused3 } from './interfaces/node';
import { unusedValueExportToPlacateAjd as unused4 } from './interfaces/query';
import { DIRECTIVES, TVIEW } from './interfaces/view';
import { flatten } from './util';
const /** @type {?} */ unusedValueToPlacateAjd = unused1 + unused2 + unused3 + unused4;
/**
 * A predicate which determines if a given element/directive should be included in the query
 * results.
 * @record
 * @template T
 */
export function QueryPredicate() { }
function QueryPredicate_tsickle_Closure_declarations() {
    /**
     * If looking for directives then it contains the directive type.
     * @type {?}
     */
    QueryPredicate.prototype.type;
    /**
     * If selector then contains local names to query for.
     * @type {?}
     */
    QueryPredicate.prototype.selector;
    /**
     * Indicates which token should be read from DI for this query.
     * @type {?}
     */
    QueryPredicate.prototype.read;
}
/**
 * An object representing a query, which is a combination of:
 * - query predicate to determines if a given element/directive should be included in the query
 * - values collected based on a predicate
 * - `QueryList` to which collected values should be reported
 * @record
 * @template T
 */
export function LQuery() { }
function LQuery_tsickle_Closure_declarations() {
    /**
     * Next query. Used when queries are stored as a linked list in `LQueries`.
     * @type {?}
     */
    LQuery.prototype.next;
    /**
     * Destination to which the value should be added.
     * @type {?}
     */
    LQuery.prototype.list;
    /**
     * A predicate which determines if a given element/directive should be included in the query
     * results.
     * @type {?}
     */
    LQuery.prototype.predicate;
    /**
     * Values which have been located.
     *
     * This is what builds up the `QueryList._valuesTree`.
     * @type {?}
     */
    LQuery.prototype.values;
    /**
     * A pointer to an array that stores collected values from views. This is necessary so we know a
     * container into which to insert nodes collected from views.
     * @type {?}
     */
    LQuery.prototype.containerValues;
}
export class LQueries_ {
    /**
     * @param {?=} deep
     */
    constructor(deep) {
        this.shallow = null;
        this.deep = null;
        this.deep = deep == null ? null : deep;
    }
    /**
     * @template T
     * @param {?} queryList
     * @param {?} predicate
     * @param {?=} descend
     * @param {?=} read
     * @return {?}
     */
    track(queryList, predicate, descend, read) {
        if (descend) {
            this.deep = createQuery(this.deep, queryList, predicate, read != null ? read : null);
        }
        else {
            this.shallow = createQuery(this.shallow, queryList, predicate, read != null ? read : null);
        }
    }
    /**
     * @return {?}
     */
    clone() { return this.deep ? new LQueries_(this.deep) : null; }
    /**
     * @return {?}
     */
    child() {
        if (this.deep === null) {
            // if we don't have any deep queries then no need to track anything more.
            return null;
        }
        if (this.shallow === null) {
            // DeepQuery: We can reuse the current state if the child state would be same as current
            // state.
            return this;
        }
        else {
            // We need to create new state
            return new LQueries_(this.deep);
        }
    }
    /**
     * @return {?}
     */
    container() {
        let /** @type {?} */ result = null;
        let /** @type {?} */ query = this.deep;
        while (query) {
            const /** @type {?} */ containerValues = []; // prepare room for views
            query.values.push(containerValues);
            const /** @type {?} */ clonedQuery = {
                next: null,
                list: query.list,
                predicate: query.predicate,
                values: containerValues,
                containerValues: null
            };
            clonedQuery.next = result;
            result = clonedQuery;
            query = query.next;
        }
        return result ? new LQueries_(result) : null;
    }
    /**
     * @return {?}
     */
    createView() {
        let /** @type {?} */ result = null;
        let /** @type {?} */ query = this.deep;
        while (query) {
            const /** @type {?} */ clonedQuery = {
                next: null,
                list: query.list,
                predicate: query.predicate,
                values: [],
                containerValues: query.values
            };
            clonedQuery.next = result;
            result = clonedQuery;
            query = query.next;
        }
        return result ? new LQueries_(result) : null;
    }
    /**
     * @param {?} index
     * @return {?}
     */
    insertView(index) {
        let /** @type {?} */ query = this.deep;
        while (query) {
            ngDevMode &&
                assertDefined(query.containerValues, 'View queries need to have a pointer to container values.'); /** @type {?} */
            ((query.containerValues)).splice(index, 0, query.values);
            query = query.next;
        }
    }
    /**
     * @param {?} node
     * @return {?}
     */
    addNode(node) {
        add(this.shallow, node);
        add(this.deep, node);
    }
    /**
     * @return {?}
     */
    removeView() {
        let /** @type {?} */ query = this.deep;
        while (query) {
            ngDevMode &&
                assertDefined(query.containerValues, 'View queries need to have a pointer to container values.');
            const /** @type {?} */ containerValues = /** @type {?} */ ((query.containerValues));
            const /** @type {?} */ viewValuesIdx = containerValues.indexOf(query.values);
            const /** @type {?} */ removed = containerValues.splice(viewValuesIdx, 1);
            // mark a query as dirty only when removed view had matching modes
            ngDevMode && assertEqual(removed.length, 1, 'removed.length');
            if (removed[0].length) {
                query.list.setDirty();
            }
            query = query.next;
        }
    }
}
function LQueries__tsickle_Closure_declarations() {
    /** @type {?} */
    LQueries_.prototype.shallow;
    /** @type {?} */
    LQueries_.prototype.deep;
}
/**
 * Iterates over local names for a given node and returns directive index
 * (or -1 if a local name points to an element).
 *
 * @param {?} tNode static data of a node to check
 * @param {?} selector selector to match
 * @return {?} directive index, -1 or null if a selector didn't match any of the local names
 */
function getIdxOfMatchingSelector(tNode, selector) {
    const /** @type {?} */ localNames = tNode.localNames;
    if (localNames) {
        for (let /** @type {?} */ i = 0; i < localNames.length; i += 2) {
            if (localNames[i] === selector) {
                return /** @type {?} */ (localNames[i + 1]);
            }
        }
    }
    return null;
}
/**
 * Iterates over all the directives for a node and returns index of a directive for a given type.
 *
 * @param {?} node Node on which directives are present.
 * @param {?} type Type of a directive to look for.
 * @return {?} Index of a found directive or null when none found.
 */
function getIdxOfMatchingDirective(node, type) {
    const /** @type {?} */ defs = /** @type {?} */ ((node.view[TVIEW].directives));
    const /** @type {?} */ flags = node.tNode.flags;
    const /** @type {?} */ count = flags & 4095 /* DirectiveCountMask */;
    const /** @type {?} */ start = flags >> 13 /* DirectiveStartingIndexShift */;
    const /** @type {?} */ end = start + count;
    for (let /** @type {?} */ i = start; i < end; i++) {
        const /** @type {?} */ def = /** @type {?} */ (defs[i]);
        if (def.type === type && def.diPublic) {
            return i;
        }
    }
    return null;
}
/**
 * @param {?} nodeInjector
 * @param {?} node
 * @param {?} read
 * @param {?} directiveIdx
 * @return {?}
 */
function readFromNodeInjector(nodeInjector, node, read, directiveIdx) {
    if (read instanceof ReadFromInjectorFn) {
        return read.read(nodeInjector, node, directiveIdx);
    }
    else {
        const /** @type {?} */ matchingIdx = getIdxOfMatchingDirective(node, /** @type {?} */ (read));
        if (matchingIdx !== null) {
            return /** @type {?} */ ((node.view[DIRECTIVES]))[matchingIdx];
        }
    }
    return null;
}
/**
 * @param {?} query
 * @param {?} node
 * @return {?}
 */
function add(query, node) {
    const /** @type {?} */ nodeInjector = getOrCreateNodeInjectorForNode(/** @type {?} */ (node));
    while (query) {
        const /** @type {?} */ predicate = query.predicate;
        const /** @type {?} */ type = predicate.type;
        if (type) {
            const /** @type {?} */ directiveIdx = getIdxOfMatchingDirective(node, type);
            if (directiveIdx !== null) {
                // a node is matching a predicate - determine what to read
                // if read token and / or strategy is not specified, use type as read token
                const /** @type {?} */ result = readFromNodeInjector(nodeInjector, node, predicate.read || type, directiveIdx);
                if (result !== null) {
                    addMatch(query, result);
                }
            }
        }
        else {
            const /** @type {?} */ selector = /** @type {?} */ ((predicate.selector));
            for (let /** @type {?} */ i = 0; i < selector.length; i++) {
                const /** @type {?} */ directiveIdx = getIdxOfMatchingSelector(node.tNode, selector[i]);
                if (directiveIdx !== null) {
                    // a node is matching a predicate - determine what to read
                    // note that queries using name selector must specify read strategy
                    ngDevMode && assertDefined(predicate.read, 'the node should have a predicate');
                    const /** @type {?} */ result = readFromNodeInjector(nodeInjector, node, /** @type {?} */ ((predicate.read)), directiveIdx);
                    if (result !== null) {
                        addMatch(query, result);
                    }
                }
            }
        }
        query = query.next;
    }
}
/**
 * @param {?} query
 * @param {?} matchingValue
 * @return {?}
 */
function addMatch(query, matchingValue) {
    query.values.push(matchingValue);
    query.list.setDirty();
}
/**
 * @template T
 * @param {?} predicate
 * @param {?} read
 * @return {?}
 */
function createPredicate(predicate, read) {
    const /** @type {?} */ isArray = Array.isArray(predicate);
    return {
        type: isArray ? null : /** @type {?} */ (predicate),
        selector: isArray ? /** @type {?} */ (predicate) : null,
        read: read
    };
}
/**
 * @template T
 * @param {?} previous
 * @param {?} queryList
 * @param {?} predicate
 * @param {?} read
 * @return {?}
 */
function createQuery(previous, queryList, predicate, read) {
    return {
        next: previous,
        list: queryList,
        predicate: createPredicate(predicate, read),
        values: (/** @type {?} */ ((queryList)))._valuesTree,
        containerValues: null
    };
}
/**
 * @template T
 */
class QueryList_ {
    constructor() {
        this.dirty = true;
        this.changes = new EventEmitter();
        this._values = [];
        /**
         * \@internal
         */
        this._valuesTree = [];
    }
    /**
     * @return {?}
     */
    get length() { return this._values.length; }
    /**
     * @return {?}
     */
    get first() {
        let /** @type {?} */ values = this._values;
        return values.length ? values[0] : null;
    }
    /**
     * @return {?}
     */
    get last() {
        let /** @type {?} */ values = this._values;
        return values.length ? values[values.length - 1] : null;
    }
    /**
     * See
     * [Array.map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map)
     * @template U
     * @param {?} fn
     * @return {?}
     */
    map(fn) { return this._values.map(fn); }
    /**
     * See
     * [Array.filter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter)
     * @param {?} fn
     * @return {?}
     */
    filter(fn) {
        return this._values.filter(fn);
    }
    /**
     * See
     * [Array.find](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find)
     * @param {?} fn
     * @return {?}
     */
    find(fn) {
        return this._values.find(fn);
    }
    /**
     * See
     * [Array.reduce](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce)
     * @template U
     * @param {?} fn
     * @param {?} init
     * @return {?}
     */
    reduce(fn, init) {
        return this._values.reduce(fn, init);
    }
    /**
     * See
     * [Array.forEach](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach)
     * @param {?} fn
     * @return {?}
     */
    forEach(fn) { this._values.forEach(fn); }
    /**
     * See
     * [Array.some](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some)
     * @param {?} fn
     * @return {?}
     */
    some(fn) {
        return this._values.some(fn);
    }
    /**
     * @return {?}
     */
    toArray() { return this._values.slice(0); }
    /**
     * @return {?}
     */
    [getSymbolIterator()]() { return (/** @type {?} */ (this._values))[getSymbolIterator()](); }
    /**
     * @return {?}
     */
    toString() { return this._values.toString(); }
    /**
     * @param {?} res
     * @return {?}
     */
    reset(res) {
        this._values = flatten(res);
        (/** @type {?} */ (this)).dirty = false;
    }
    /**
     * @return {?}
     */
    notifyOnChanges() { (/** @type {?} */ (this.changes)).emit(this); }
    /**
     * @return {?}
     */
    setDirty() { (/** @type {?} */ (this)).dirty = true; }
    /**
     * @return {?}
     */
    destroy() {
        (/** @type {?} */ (this.changes)).complete();
        (/** @type {?} */ (this.changes)).unsubscribe();
    }
}
function QueryList__tsickle_Closure_declarations() {
    /** @type {?} */
    QueryList_.prototype.dirty;
    /** @type {?} */
    QueryList_.prototype.changes;
    /** @type {?} */
    QueryList_.prototype._values;
    /**
     * \@internal
     * @type {?}
     */
    QueryList_.prototype._valuesTree;
}
export const /** @type {?} */ QueryList = /** @type {?} */ (QueryList_);
/**
 * Creates and returns a QueryList.
 *
 * @template T
 * @param {?} memoryIndex The index in memory where the QueryList should be saved. If null,
 * this is is a content query and the QueryList will be saved later through directiveCreate.
 * @param {?} predicate The type for which the query will search
 * @param {?=} descend Whether or not to descend into children
 * @param {?=} read What to save in the query
 * @return {?} QueryList<T>
 */
export function query(memoryIndex, predicate, descend, read) {
    ngDevMode && assertPreviousIsParent();
    const /** @type {?} */ queryList = new QueryList();
    const /** @type {?} */ queries = getCurrentQueries(LQueries_);
    queries.track(queryList, predicate, descend, read);
    storeCleanupWithContext(null, queryList, queryList.destroy);
    if (memoryIndex != null) {
        store(memoryIndex, queryList);
    }
    return queryList;
}
/**
 * Refreshes a query by combining matches from all active views and removing matches from deleted
 * views.
 * Returns true if a query got dirty during change detection, false otherwise.
 * @param {?} queryList
 * @return {?}
 */
export function queryRefresh(queryList) {
    const /** @type {?} */ queryListImpl = (/** @type {?} */ ((queryList)));
    if (queryList.dirty) {
        queryList.reset(queryListImpl._valuesTree);
        queryList.notifyOnChanges();
        return true;
    }
    return false;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3F1ZXJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBWUEsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBRzlDLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUUxQyxPQUFPLEVBQUMsYUFBYSxFQUFFLFdBQVcsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNwRCxPQUFPLEVBQUMsa0JBQWtCLEVBQUUsOEJBQThCLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDeEUsT0FBTyxFQUFDLHNCQUFzQixFQUFFLGlCQUFpQixFQUFFLEtBQUssRUFBRSx1QkFBdUIsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ3pHLE9BQU8sRUFBdUIsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFDdkcsT0FBTyxFQUFZLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQzFGLE9BQU8sRUFBeUQsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDbkksT0FBTyxFQUEwQiw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUNyRyxPQUFPLEVBQUMsVUFBVSxFQUFFLEtBQUssRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ3BELE9BQU8sRUFBQyxPQUFPLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFFL0IsdUJBQU0sdUJBQXVCLEdBQUcsT0FBTyxHQUFHLE9BQU8sR0FBRyxPQUFPLEdBQUcsT0FBTyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQTREdEUsTUFBTTs7OztJQUlKLFlBQVksSUFBa0I7dUJB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bmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vLyBXZSBhcmUgdGVtcG9yYXJpbHkgaW1wb3J0aW5nIHRoZSBleGlzdGluZyB2aWV3RW5naW5lX2Zyb20gY29yZSBzbyB3ZSBjYW4gYmUgc3VyZSB3ZSBhcmVcbi8vIGNvcnJlY3RseSBpbXBsZW1lbnRpbmcgaXRzIGludGVyZmFjZXMgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5LlxuaW1wb3J0IHtPYnNlcnZhYmxlfSBmcm9tICdyeGpzJztcblxuaW1wb3J0IHtFdmVudEVtaXR0ZXJ9IGZyb20gJy4uL2V2ZW50X2VtaXR0ZXInO1xuaW1wb3J0IHtRdWVyeUxpc3QgYXMgdmlld0VuZ2luZV9RdWVyeUxpc3R9IGZyb20gJy4uL2xpbmtlci9xdWVyeV9saXN0JztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vdHlwZSc7XG5pbXBvcnQge2dldFN5bWJvbEl0ZXJhdG9yfSBmcm9tICcuLi91dGlsJztcblxuaW1wb3J0IHthc3NlcnREZWZpbmVkLCBhc3NlcnRFcXVhbH0gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHtSZWFkRnJvbUluamVjdG9yRm4sIGdldE9yQ3JlYXRlTm9kZUluamVjdG9yRm9yTm9kZX0gZnJvbSAnLi9kaSc7XG5pbXBvcnQge2Fzc2VydFByZXZpb3VzSXNQYXJlbnQsIGdldEN1cnJlbnRRdWVyaWVzLCBzdG9yZSwgc3RvcmVDbGVhbnVwV2l0aENvbnRleHR9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zJztcbmltcG9ydCB7RGlyZWN0aXZlRGVmSW50ZXJuYWwsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDF9IGZyb20gJy4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7TEluamVjdG9yLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQyfSBmcm9tICcuL2ludGVyZmFjZXMvaW5qZWN0b3InO1xuaW1wb3J0IHtMQ29udGFpbmVyTm9kZSwgTEVsZW1lbnROb2RlLCBMTm9kZSwgVE5vZGUsIFROb2RlRmxhZ3MsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDN9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7TFF1ZXJpZXMsIFF1ZXJ5UmVhZFR5cGUsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDR9IGZyb20gJy4vaW50ZXJmYWNlcy9xdWVyeSc7XG5pbXBvcnQge0RJUkVDVElWRVMsIFRWSUVXfSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2ZsYXR0ZW59IGZyb20gJy4vdXRpbCc7XG5cbmNvbnN0IHVudXNlZFZhbHVlVG9QbGFjYXRlQWpkID0gdW51c2VkMSArIHVudXNlZDIgKyB1bnVzZWQzICsgdW51c2VkNDtcblxuLyoqXG4gKiBBIHByZWRpY2F0ZSB3aGljaCBkZXRlcm1pbmVzIGlmIGEgZ2l2ZW4gZWxlbWVudC9kaXJlY3RpdmUgc2hvdWxkIGJlIGluY2x1ZGVkIGluIHRoZSBxdWVyeVxuICogcmVzdWx0cy5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBRdWVyeVByZWRpY2F0ZTxUPiB7XG4gIC8qKlxuICAgKiBJZiBsb29raW5nIGZvciBkaXJlY3RpdmVzIHRoZW4gaXQgY29udGFpbnMgdGhlIGRpcmVjdGl2ZSB0eXBlLlxuICAgKi9cbiAgdHlwZTogVHlwZTxUPnxudWxsO1xuXG4gIC8qKlxuICAgKiBJZiBzZWxlY3RvciB0aGVuIGNvbnRhaW5zIGxvY2FsIG5hbWVzIHRvIHF1ZXJ5IGZvci5cbiAgICovXG4gIHNlbGVjdG9yOiBzdHJpbmdbXXxudWxsO1xuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgd2hpY2ggdG9rZW4gc2hvdWxkIGJlIHJlYWQgZnJvbSBESSBmb3IgdGhpcyBxdWVyeS5cbiAgICovXG4gIHJlYWQ6IFF1ZXJ5UmVhZFR5cGU8VD58VHlwZTxUPnxudWxsO1xufVxuXG4vKipcbiAqIEFuIG9iamVjdCByZXByZXNlbnRpbmcgYSBxdWVyeSwgd2hpY2ggaXMgYSBjb21iaW5hdGlvbiBvZjpcbiAqIC0gcXVlcnkgcHJlZGljYXRlIHRvIGRldGVybWluZXMgaWYgYSBnaXZlbiBlbGVtZW50L2RpcmVjdGl2ZSBzaG91bGQgYmUgaW5jbHVkZWQgaW4gdGhlIHF1ZXJ5XG4gKiAtIHZhbHVlcyBjb2xsZWN0ZWQgYmFzZWQgb24gYSBwcmVkaWNhdGVcbiAqIC0gYFF1ZXJ5TGlzdGAgdG8gd2hpY2ggY29sbGVjdGVkIHZhbHVlcyBzaG91bGQgYmUgcmVwb3J0ZWRcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBMUXVlcnk8VD4ge1xuICAvKipcbiAgICogTmV4dCBxdWVyeS4gVXNlZCB3aGVuIHF1ZXJpZXMgYXJlIHN0b3JlZCBhcyBhIGxpbmtlZCBsaXN0IGluIGBMUXVlcmllc2AuXG4gICAqL1xuICBuZXh0OiBMUXVlcnk8YW55PnxudWxsO1xuXG4gIC8qKlxuICAgKiBEZXN0aW5hdGlvbiB0byB3aGljaCB0aGUgdmFsdWUgc2hvdWxkIGJlIGFkZGVkLlxuICAgKi9cbiAgbGlzdDogUXVlcnlMaXN0PFQ+O1xuXG4gIC8qKlxuICAgKiBBIHByZWRpY2F0ZSB3aGljaCBkZXRlcm1pbmVzIGlmIGEgZ2l2ZW4gZWxlbWVudC9kaXJlY3RpdmUgc2hvdWxkIGJlIGluY2x1ZGVkIGluIHRoZSBxdWVyeVxuICAgKiByZXN1bHRzLlxuICAgKi9cbiAgcHJlZGljYXRlOiBRdWVyeVByZWRpY2F0ZTxUPjtcblxuICAvKipcbiAgICogVmFsdWVzIHdoaWNoIGhhdmUgYmVlbiBsb2NhdGVkLlxuICAgKlxuICAgKiBUaGlzIGlzIHdoYXQgYnVpbGRzIHVwIHRoZSBgUXVlcnlMaXN0Ll92YWx1ZXNUcmVlYC5cbiAgICovXG4gIHZhbHVlczogYW55W107XG5cbiAgLyoqXG4gICAqIEEgcG9pbnRlciB0byBhbiBhcnJheSB0aGF0IHN0b3JlcyBjb2xsZWN0ZWQgdmFsdWVzIGZyb20gdmlld3MuIFRoaXMgaXMgbmVjZXNzYXJ5IHNvIHdlIGtub3cgYVxuICAgKiBjb250YWluZXIgaW50byB3aGljaCB0byBpbnNlcnQgbm9kZXMgY29sbGVjdGVkIGZyb20gdmlld3MuXG4gICAqL1xuICBjb250YWluZXJWYWx1ZXM6IGFueVtdfG51bGw7XG59XG5cbmV4cG9ydCBjbGFzcyBMUXVlcmllc18gaW1wbGVtZW50cyBMUXVlcmllcyB7XG4gIHNoYWxsb3c6IExRdWVyeTxhbnk+fG51bGwgPSBudWxsO1xuICBkZWVwOiBMUXVlcnk8YW55PnxudWxsID0gbnVsbDtcblxuICBjb25zdHJ1Y3RvcihkZWVwPzogTFF1ZXJ5PGFueT4pIHsgdGhpcy5kZWVwID0gZGVlcCA9PSBudWxsID8gbnVsbCA6IGRlZXA7IH1cblxuICB0cmFjazxUPihcbiAgICAgIHF1ZXJ5TGlzdDogdmlld0VuZ2luZV9RdWVyeUxpc3Q8VD4sIHByZWRpY2F0ZTogVHlwZTxUPnxzdHJpbmdbXSwgZGVzY2VuZD86IGJvb2xlYW4sXG4gICAgICByZWFkPzogUXVlcnlSZWFkVHlwZTxUPnxUeXBlPFQ+KTogdm9pZCB7XG4gICAgaWYgKGRlc2NlbmQpIHtcbiAgICAgIHRoaXMuZGVlcCA9IGNyZWF0ZVF1ZXJ5KHRoaXMuZGVlcCwgcXVlcnlMaXN0LCBwcmVkaWNhdGUsIHJlYWQgIT0gbnVsbCA/IHJlYWQgOiBudWxsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5zaGFsbG93ID0gY3JlYXRlUXVlcnkodGhpcy5zaGFsbG93LCBxdWVyeUxpc3QsIHByZWRpY2F0ZSwgcmVhZCAhPSBudWxsID8gcmVhZCA6IG51bGwpO1xuICAgIH1cbiAgfVxuXG4gIGNsb25lKCk6IExRdWVyaWVzfG51bGwgeyByZXR1cm4gdGhpcy5kZWVwID8gbmV3IExRdWVyaWVzXyh0aGlzLmRlZXApIDogbnVsbDsgfVxuXG4gIGNoaWxkKCk6IExRdWVyaWVzfG51bGwge1xuICAgIGlmICh0aGlzLmRlZXAgPT09IG51bGwpIHtcbiAgICAgIC8vIGlmIHdlIGRvbid0IGhhdmUgYW55IGRlZXAgcXVlcmllcyB0aGVuIG5vIG5lZWQgdG8gdHJhY2sgYW55dGhpbmcgbW9yZS5cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBpZiAodGhpcy5zaGFsbG93ID09PSBudWxsKSB7XG4gICAgICAvLyBEZWVwUXVlcnk6IFdlIGNhbiByZXVzZSB0aGUgY3VycmVudCBzdGF0ZSBpZiB0aGUgY2hpbGQgc3RhdGUgd291bGQgYmUgc2FtZSBhcyBjdXJyZW50XG4gICAgICAvLyBzdGF0ZS5cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBXZSBuZWVkIHRvIGNyZWF0ZSBuZXcgc3RhdGVcbiAgICAgIHJldHVybiBuZXcgTFF1ZXJpZXNfKHRoaXMuZGVlcCk7XG4gICAgfVxuICB9XG5cbiAgY29udGFpbmVyKCk6IExRdWVyaWVzfG51bGwge1xuICAgIGxldCByZXN1bHQ6IExRdWVyeTxhbnk+fG51bGwgPSBudWxsO1xuICAgIGxldCBxdWVyeSA9IHRoaXMuZGVlcDtcblxuICAgIHdoaWxlIChxdWVyeSkge1xuICAgICAgY29uc3QgY29udGFpbmVyVmFsdWVzOiBhbnlbXSA9IFtdOyAgLy8gcHJlcGFyZSByb29tIGZvciB2aWV3c1xuICAgICAgcXVlcnkudmFsdWVzLnB1c2goY29udGFpbmVyVmFsdWVzKTtcbiAgICAgIGNvbnN0IGNsb25lZFF1ZXJ5OiBMUXVlcnk8YW55PiA9IHtcbiAgICAgICAgbmV4dDogbnVsbCxcbiAgICAgICAgbGlzdDogcXVlcnkubGlzdCxcbiAgICAgICAgcHJlZGljYXRlOiBxdWVyeS5wcmVkaWNhdGUsXG4gICAgICAgIHZhbHVlczogY29udGFpbmVyVmFsdWVzLFxuICAgICAgICBjb250YWluZXJWYWx1ZXM6IG51bGxcbiAgICAgIH07XG4gICAgICBjbG9uZWRRdWVyeS5uZXh0ID0gcmVzdWx0O1xuICAgICAgcmVzdWx0ID0gY2xvbmVkUXVlcnk7XG4gICAgICBxdWVyeSA9IHF1ZXJ5Lm5leHQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdCA/IG5ldyBMUXVlcmllc18ocmVzdWx0KSA6IG51bGw7XG4gIH1cblxuICBjcmVhdGVWaWV3KCk6IExRdWVyaWVzfG51bGwge1xuICAgIGxldCByZXN1bHQ6IExRdWVyeTxhbnk+fG51bGwgPSBudWxsO1xuICAgIGxldCBxdWVyeSA9IHRoaXMuZGVlcDtcblxuICAgIHdoaWxlIChxdWVyeSkge1xuICAgICAgY29uc3QgY2xvbmVkUXVlcnk6IExRdWVyeTxhbnk+ID0ge1xuICAgICAgICBuZXh0OiBudWxsLFxuICAgICAgICBsaXN0OiBxdWVyeS5saXN0LFxuICAgICAgICBwcmVkaWNhdGU6IHF1ZXJ5LnByZWRpY2F0ZSxcbiAgICAgICAgdmFsdWVzOiBbXSxcbiAgICAgICAgY29udGFpbmVyVmFsdWVzOiBxdWVyeS52YWx1ZXNcbiAgICAgIH07XG4gICAgICBjbG9uZWRRdWVyeS5uZXh0ID0gcmVzdWx0O1xuICAgICAgcmVzdWx0ID0gY2xvbmVkUXVlcnk7XG4gICAgICBxdWVyeSA9IHF1ZXJ5Lm5leHQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdCA/IG5ldyBMUXVlcmllc18ocmVzdWx0KSA6IG51bGw7XG4gIH1cblxuICBpbnNlcnRWaWV3KGluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgICBsZXQgcXVlcnkgPSB0aGlzLmRlZXA7XG4gICAgd2hpbGUgKHF1ZXJ5KSB7XG4gICAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgICBhc3NlcnREZWZpbmVkKFxuICAgICAgICAgICAgICBxdWVyeS5jb250YWluZXJWYWx1ZXMsICdWaWV3IHF1ZXJpZXMgbmVlZCB0byBoYXZlIGEgcG9pbnRlciB0byBjb250YWluZXIgdmFsdWVzLicpO1xuICAgICAgcXVlcnkuY29udGFpbmVyVmFsdWVzICEuc3BsaWNlKGluZGV4LCAwLCBxdWVyeS52YWx1ZXMpO1xuICAgICAgcXVlcnkgPSBxdWVyeS5uZXh0O1xuICAgIH1cbiAgfVxuXG4gIGFkZE5vZGUobm9kZTogTE5vZGUpOiB2b2lkIHtcbiAgICBhZGQodGhpcy5zaGFsbG93LCBub2RlKTtcbiAgICBhZGQodGhpcy5kZWVwLCBub2RlKTtcbiAgfVxuXG4gIHJlbW92ZVZpZXcoKTogdm9pZCB7XG4gICAgbGV0IHF1ZXJ5ID0gdGhpcy5kZWVwO1xuICAgIHdoaWxlIChxdWVyeSkge1xuICAgICAgbmdEZXZNb2RlICYmXG4gICAgICAgICAgYXNzZXJ0RGVmaW5lZChcbiAgICAgICAgICAgICAgcXVlcnkuY29udGFpbmVyVmFsdWVzLCAnVmlldyBxdWVyaWVzIG5lZWQgdG8gaGF2ZSBhIHBvaW50ZXIgdG8gY29udGFpbmVyIHZhbHVlcy4nKTtcblxuICAgICAgY29uc3QgY29udGFpbmVyVmFsdWVzID0gcXVlcnkuY29udGFpbmVyVmFsdWVzICE7XG4gICAgICBjb25zdCB2aWV3VmFsdWVzSWR4ID0gY29udGFpbmVyVmFsdWVzLmluZGV4T2YocXVlcnkudmFsdWVzKTtcbiAgICAgIGNvbnN0IHJlbW92ZWQgPSBjb250YWluZXJWYWx1ZXMuc3BsaWNlKHZpZXdWYWx1ZXNJZHgsIDEpO1xuXG4gICAgICAvLyBtYXJrIGEgcXVlcnkgYXMgZGlydHkgb25seSB3aGVuIHJlbW92ZWQgdmlldyBoYWQgbWF0Y2hpbmcgbW9kZXNcbiAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChyZW1vdmVkLmxlbmd0aCwgMSwgJ3JlbW92ZWQubGVuZ3RoJyk7XG4gICAgICBpZiAocmVtb3ZlZFswXS5sZW5ndGgpIHtcbiAgICAgICAgcXVlcnkubGlzdC5zZXREaXJ0eSgpO1xuICAgICAgfVxuXG4gICAgICBxdWVyeSA9IHF1ZXJ5Lm5leHQ7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogSXRlcmF0ZXMgb3ZlciBsb2NhbCBuYW1lcyBmb3IgYSBnaXZlbiBub2RlIGFuZCByZXR1cm5zIGRpcmVjdGl2ZSBpbmRleFxuICogKG9yIC0xIGlmIGEgbG9jYWwgbmFtZSBwb2ludHMgdG8gYW4gZWxlbWVudCkuXG4gKlxuICogQHBhcmFtIHROb2RlIHN0YXRpYyBkYXRhIG9mIGEgbm9kZSB0byBjaGVja1xuICogQHBhcmFtIHNlbGVjdG9yIHNlbGVjdG9yIHRvIG1hdGNoXG4gKiBAcmV0dXJucyBkaXJlY3RpdmUgaW5kZXgsIC0xIG9yIG51bGwgaWYgYSBzZWxlY3RvciBkaWRuJ3QgbWF0Y2ggYW55IG9mIHRoZSBsb2NhbCBuYW1lc1xuICovXG5mdW5jdGlvbiBnZXRJZHhPZk1hdGNoaW5nU2VsZWN0b3IodE5vZGU6IFROb2RlLCBzZWxlY3Rvcjogc3RyaW5nKTogbnVtYmVyfG51bGwge1xuICBjb25zdCBsb2NhbE5hbWVzID0gdE5vZGUubG9jYWxOYW1lcztcbiAgaWYgKGxvY2FsTmFtZXMpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxvY2FsTmFtZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIGlmIChsb2NhbE5hbWVzW2ldID09PSBzZWxlY3Rvcikge1xuICAgICAgICByZXR1cm4gbG9jYWxOYW1lc1tpICsgMV0gYXMgbnVtYmVyO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBJdGVyYXRlcyBvdmVyIGFsbCB0aGUgZGlyZWN0aXZlcyBmb3IgYSBub2RlIGFuZCByZXR1cm5zIGluZGV4IG9mIGEgZGlyZWN0aXZlIGZvciBhIGdpdmVuIHR5cGUuXG4gKlxuICogQHBhcmFtIG5vZGUgTm9kZSBvbiB3aGljaCBkaXJlY3RpdmVzIGFyZSBwcmVzZW50LlxuICogQHBhcmFtIHR5cGUgVHlwZSBvZiBhIGRpcmVjdGl2ZSB0byBsb29rIGZvci5cbiAqIEByZXR1cm5zIEluZGV4IG9mIGEgZm91bmQgZGlyZWN0aXZlIG9yIG51bGwgd2hlbiBub25lIGZvdW5kLlxuICovXG5mdW5jdGlvbiBnZXRJZHhPZk1hdGNoaW5nRGlyZWN0aXZlKG5vZGU6IExOb2RlLCB0eXBlOiBUeXBlPGFueT4pOiBudW1iZXJ8bnVsbCB7XG4gIGNvbnN0IGRlZnMgPSBub2RlLnZpZXdbVFZJRVddLmRpcmVjdGl2ZXMgITtcbiAgY29uc3QgZmxhZ3MgPSBub2RlLnROb2RlLmZsYWdzO1xuICBjb25zdCBjb3VudCA9IGZsYWdzICYgVE5vZGVGbGFncy5EaXJlY3RpdmVDb3VudE1hc2s7XG4gIGNvbnN0IHN0YXJ0ID0gZmxhZ3MgPj4gVE5vZGVGbGFncy5EaXJlY3RpdmVTdGFydGluZ0luZGV4U2hpZnQ7XG4gIGNvbnN0IGVuZCA9IHN0YXJ0ICsgY291bnQ7XG4gIGZvciAobGV0IGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgY29uc3QgZGVmID0gZGVmc1tpXSBhcyBEaXJlY3RpdmVEZWZJbnRlcm5hbDxhbnk+O1xuICAgIGlmIChkZWYudHlwZSA9PT0gdHlwZSAmJiBkZWYuZGlQdWJsaWMpIHtcbiAgICAgIHJldHVybiBpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gcmVhZEZyb21Ob2RlSW5qZWN0b3IoXG4gICAgbm9kZUluamVjdG9yOiBMSW5qZWN0b3IsIG5vZGU6IExOb2RlLCByZWFkOiBRdWVyeVJlYWRUeXBlPGFueT58IFR5cGU8YW55PixcbiAgICBkaXJlY3RpdmVJZHg6IG51bWJlcik6IGFueSB7XG4gIGlmIChyZWFkIGluc3RhbmNlb2YgUmVhZEZyb21JbmplY3RvckZuKSB7XG4gICAgcmV0dXJuIHJlYWQucmVhZChub2RlSW5qZWN0b3IsIG5vZGUsIGRpcmVjdGl2ZUlkeCk7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgbWF0Y2hpbmdJZHggPSBnZXRJZHhPZk1hdGNoaW5nRGlyZWN0aXZlKG5vZGUsIHJlYWQgYXMgVHlwZTxhbnk+KTtcbiAgICBpZiAobWF0Y2hpbmdJZHggIT09IG51bGwpIHtcbiAgICAgIHJldHVybiBub2RlLnZpZXdbRElSRUNUSVZFU10gIVttYXRjaGluZ0lkeF07XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBhZGQocXVlcnk6IExRdWVyeTxhbnk+fCBudWxsLCBub2RlOiBMTm9kZSkge1xuICBjb25zdCBub2RlSW5qZWN0b3IgPSBnZXRPckNyZWF0ZU5vZGVJbmplY3RvckZvck5vZGUobm9kZSBhcyBMRWxlbWVudE5vZGUgfCBMQ29udGFpbmVyTm9kZSk7XG4gIHdoaWxlIChxdWVyeSkge1xuICAgIGNvbnN0IHByZWRpY2F0ZSA9IHF1ZXJ5LnByZWRpY2F0ZTtcbiAgICBjb25zdCB0eXBlID0gcHJlZGljYXRlLnR5cGU7XG4gICAgaWYgKHR5cGUpIHtcbiAgICAgIGNvbnN0IGRpcmVjdGl2ZUlkeCA9IGdldElkeE9mTWF0Y2hpbmdEaXJlY3RpdmUobm9kZSwgdHlwZSk7XG4gICAgICBpZiAoZGlyZWN0aXZlSWR4ICE9PSBudWxsKSB7XG4gICAgICAgIC8vIGEgbm9kZSBpcyBtYXRjaGluZyBhIHByZWRpY2F0ZSAtIGRldGVybWluZSB3aGF0IHRvIHJlYWRcbiAgICAgICAgLy8gaWYgcmVhZCB0b2tlbiBhbmQgLyBvciBzdHJhdGVneSBpcyBub3Qgc3BlY2lmaWVkLCB1c2UgdHlwZSBhcyByZWFkIHRva2VuXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9XG4gICAgICAgICAgICByZWFkRnJvbU5vZGVJbmplY3Rvcihub2RlSW5qZWN0b3IsIG5vZGUsIHByZWRpY2F0ZS5yZWFkIHx8IHR5cGUsIGRpcmVjdGl2ZUlkeCk7XG4gICAgICAgIGlmIChyZXN1bHQgIT09IG51bGwpIHtcbiAgICAgICAgICBhZGRNYXRjaChxdWVyeSwgcmVzdWx0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBzZWxlY3RvciA9IHByZWRpY2F0ZS5zZWxlY3RvciAhO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWxlY3Rvci5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBkaXJlY3RpdmVJZHggPSBnZXRJZHhPZk1hdGNoaW5nU2VsZWN0b3Iobm9kZS50Tm9kZSwgc2VsZWN0b3JbaV0pO1xuICAgICAgICBpZiAoZGlyZWN0aXZlSWR4ICE9PSBudWxsKSB7XG4gICAgICAgICAgLy8gYSBub2RlIGlzIG1hdGNoaW5nIGEgcHJlZGljYXRlIC0gZGV0ZXJtaW5lIHdoYXQgdG8gcmVhZFxuICAgICAgICAgIC8vIG5vdGUgdGhhdCBxdWVyaWVzIHVzaW5nIG5hbWUgc2VsZWN0b3IgbXVzdCBzcGVjaWZ5IHJlYWQgc3RyYXRlZ3lcbiAgICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChwcmVkaWNhdGUucmVhZCwgJ3RoZSBub2RlIHNob3VsZCBoYXZlIGEgcHJlZGljYXRlJyk7XG4gICAgICAgICAgY29uc3QgcmVzdWx0ID0gcmVhZEZyb21Ob2RlSW5qZWN0b3Iobm9kZUluamVjdG9yLCBub2RlLCBwcmVkaWNhdGUucmVhZCAhLCBkaXJlY3RpdmVJZHgpO1xuICAgICAgICAgIGlmIChyZXN1bHQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIGFkZE1hdGNoKHF1ZXJ5LCByZXN1bHQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBxdWVyeSA9IHF1ZXJ5Lm5leHQ7XG4gIH1cbn1cblxuZnVuY3Rpb24gYWRkTWF0Y2gocXVlcnk6IExRdWVyeTxhbnk+LCBtYXRjaGluZ1ZhbHVlOiBhbnkpOiB2b2lkIHtcbiAgcXVlcnkudmFsdWVzLnB1c2gobWF0Y2hpbmdWYWx1ZSk7XG4gIHF1ZXJ5Lmxpc3Quc2V0RGlydHkoKTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlUHJlZGljYXRlPFQ+KFxuICAgIHByZWRpY2F0ZTogVHlwZTxUPnwgc3RyaW5nW10sIHJlYWQ6IFF1ZXJ5UmVhZFR5cGU8VD58IFR5cGU8VD58IG51bGwpOiBRdWVyeVByZWRpY2F0ZTxUPiB7XG4gIGNvbnN0IGlzQXJyYXkgPSBBcnJheS5pc0FycmF5KHByZWRpY2F0ZSk7XG4gIHJldHVybiB7XG4gICAgdHlwZTogaXNBcnJheSA/IG51bGwgOiBwcmVkaWNhdGUgYXMgVHlwZTxUPixcbiAgICBzZWxlY3RvcjogaXNBcnJheSA/IHByZWRpY2F0ZSBhcyBzdHJpbmdbXSA6IG51bGwsXG4gICAgcmVhZDogcmVhZFxuICB9O1xufVxuXG5mdW5jdGlvbiBjcmVhdGVRdWVyeTxUPihcbiAgICBwcmV2aW91czogTFF1ZXJ5PGFueT58IG51bGwsIHF1ZXJ5TGlzdDogUXVlcnlMaXN0PFQ+LCBwcmVkaWNhdGU6IFR5cGU8VD58IHN0cmluZ1tdLFxuICAgIHJlYWQ6IFF1ZXJ5UmVhZFR5cGU8VD58IFR5cGU8VD58IG51bGwpOiBMUXVlcnk8VD4ge1xuICByZXR1cm4ge1xuICAgIG5leHQ6IHByZXZpb3VzLFxuICAgIGxpc3Q6IHF1ZXJ5TGlzdCxcbiAgICBwcmVkaWNhdGU6IGNyZWF0ZVByZWRpY2F0ZShwcmVkaWNhdGUsIHJlYWQpLFxuICAgIHZhbHVlczogKHF1ZXJ5TGlzdCBhcyBhbnkgYXMgUXVlcnlMaXN0XzxUPikuX3ZhbHVlc1RyZWUsXG4gICAgY29udGFpbmVyVmFsdWVzOiBudWxsXG4gIH07XG59XG5cbmNsYXNzIFF1ZXJ5TGlzdF88VD4vKiBpbXBsZW1lbnRzIHZpZXdFbmdpbmVfUXVlcnlMaXN0PFQ+ICovIHtcbiAgcmVhZG9ubHkgZGlydHkgPSB0cnVlO1xuICByZWFkb25seSBjaGFuZ2VzOiBPYnNlcnZhYmxlPFQ+ID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuICBwcml2YXRlIF92YWx1ZXM6IFRbXSA9IFtdO1xuICAvKiogQGludGVybmFsICovXG4gIF92YWx1ZXNUcmVlOiBhbnlbXSA9IFtdO1xuXG4gIGdldCBsZW5ndGgoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuX3ZhbHVlcy5sZW5ndGg7IH1cblxuICBnZXQgZmlyc3QoKTogVHxudWxsIHtcbiAgICBsZXQgdmFsdWVzID0gdGhpcy5fdmFsdWVzO1xuICAgIHJldHVybiB2YWx1ZXMubGVuZ3RoID8gdmFsdWVzWzBdIDogbnVsbDtcbiAgfVxuXG4gIGdldCBsYXN0KCk6IFR8bnVsbCB7XG4gICAgbGV0IHZhbHVlcyA9IHRoaXMuX3ZhbHVlcztcbiAgICByZXR1cm4gdmFsdWVzLmxlbmd0aCA/IHZhbHVlc1t2YWx1ZXMubGVuZ3RoIC0gMV0gOiBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlZVxuICAgKiBbQXJyYXkubWFwXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9BcnJheS9tYXApXG4gICAqL1xuICBtYXA8VT4oZm46IChpdGVtOiBULCBpbmRleDogbnVtYmVyLCBhcnJheTogVFtdKSA9PiBVKTogVVtdIHsgcmV0dXJuIHRoaXMuX3ZhbHVlcy5tYXAoZm4pOyB9XG5cbiAgLyoqXG4gICAqIFNlZVxuICAgKiBbQXJyYXkuZmlsdGVyXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9BcnJheS9maWx0ZXIpXG4gICAqL1xuICBmaWx0ZXIoZm46IChpdGVtOiBULCBpbmRleDogbnVtYmVyLCBhcnJheTogVFtdKSA9PiBib29sZWFuKTogVFtdIHtcbiAgICByZXR1cm4gdGhpcy5fdmFsdWVzLmZpbHRlcihmbik7XG4gIH1cblxuICAvKipcbiAgICogU2VlXG4gICAqIFtBcnJheS5maW5kXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9BcnJheS9maW5kKVxuICAgKi9cbiAgZmluZChmbjogKGl0ZW06IFQsIGluZGV4OiBudW1iZXIsIGFycmF5OiBUW10pID0+IGJvb2xlYW4pOiBUfHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuX3ZhbHVlcy5maW5kKGZuKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZWVcbiAgICogW0FycmF5LnJlZHVjZV0oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvQXJyYXkvcmVkdWNlKVxuICAgKi9cbiAgcmVkdWNlPFU+KGZuOiAocHJldlZhbHVlOiBVLCBjdXJWYWx1ZTogVCwgY3VySW5kZXg6IG51bWJlciwgYXJyYXk6IFRbXSkgPT4gVSwgaW5pdDogVSk6IFUge1xuICAgIHJldHVybiB0aGlzLl92YWx1ZXMucmVkdWNlKGZuLCBpbml0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZWVcbiAgICogW0FycmF5LmZvckVhY2hdKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0FycmF5L2ZvckVhY2gpXG4gICAqL1xuICBmb3JFYWNoKGZuOiAoaXRlbTogVCwgaW5kZXg6IG51bWJlciwgYXJyYXk6IFRbXSkgPT4gdm9pZCk6IHZvaWQgeyB0aGlzLl92YWx1ZXMuZm9yRWFjaChmbik7IH1cblxuICAvKipcbiAgICogU2VlXG4gICAqIFtBcnJheS5zb21lXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9BcnJheS9zb21lKVxuICAgKi9cbiAgc29tZShmbjogKHZhbHVlOiBULCBpbmRleDogbnVtYmVyLCBhcnJheTogVFtdKSA9PiBib29sZWFuKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX3ZhbHVlcy5zb21lKGZuKTtcbiAgfVxuXG4gIHRvQXJyYXkoKTogVFtdIHsgcmV0dXJuIHRoaXMuX3ZhbHVlcy5zbGljZSgwKTsgfVxuXG4gIFtnZXRTeW1ib2xJdGVyYXRvcigpXSgpOiBJdGVyYXRvcjxUPiB7IHJldHVybiAodGhpcy5fdmFsdWVzIGFzIGFueSlbZ2V0U3ltYm9sSXRlcmF0b3IoKV0oKTsgfVxuXG4gIHRvU3RyaW5nKCk6IHN0cmluZyB7IHJldHVybiB0aGlzLl92YWx1ZXMudG9TdHJpbmcoKTsgfVxuXG4gIHJlc2V0KHJlczogKGFueVtdfFQpW10pOiB2b2lkIHtcbiAgICB0aGlzLl92YWx1ZXMgPSBmbGF0dGVuKHJlcyk7XG4gICAgKHRoaXMgYXN7ZGlydHk6IGJvb2xlYW59KS5kaXJ0eSA9IGZhbHNlO1xuICB9XG5cbiAgbm90aWZ5T25DaGFuZ2VzKCk6IHZvaWQgeyAodGhpcy5jaGFuZ2VzIGFzIEV2ZW50RW1pdHRlcjxhbnk+KS5lbWl0KHRoaXMpOyB9XG4gIHNldERpcnR5KCk6IHZvaWQgeyAodGhpcyBhc3tkaXJ0eTogYm9vbGVhbn0pLmRpcnR5ID0gdHJ1ZTsgfVxuICBkZXN0cm95KCk6IHZvaWQge1xuICAgICh0aGlzLmNoYW5nZXMgYXMgRXZlbnRFbWl0dGVyPGFueT4pLmNvbXBsZXRlKCk7XG4gICAgKHRoaXMuY2hhbmdlcyBhcyBFdmVudEVtaXR0ZXI8YW55PikudW5zdWJzY3JpYmUoKTtcbiAgfVxufVxuXG4vLyBOT1RFOiB0aGlzIGhhY2sgaXMgaGVyZSBiZWNhdXNlIElRdWVyeUxpc3QgaGFzIHByaXZhdGUgbWVtYmVycyBhbmQgdGhlcmVmb3JlXG4vLyBpdCBjYW4ndCBiZSBpbXBsZW1lbnRlZCBvbmx5IGV4dGVuZGVkLlxuZXhwb3J0IHR5cGUgUXVlcnlMaXN0PFQ+ID0gdmlld0VuZ2luZV9RdWVyeUxpc3Q8VD47XG5leHBvcnQgY29uc3QgUXVlcnlMaXN0OiB0eXBlb2Ygdmlld0VuZ2luZV9RdWVyeUxpc3QgPSBRdWVyeUxpc3RfIGFzIGFueTtcblxuLyoqXG4gKiBDcmVhdGVzIGFuZCByZXR1cm5zIGEgUXVlcnlMaXN0LlxuICpcbiAqIEBwYXJhbSBtZW1vcnlJbmRleCBUaGUgaW5kZXggaW4gbWVtb3J5IHdoZXJlIHRoZSBRdWVyeUxpc3Qgc2hvdWxkIGJlIHNhdmVkLiBJZiBudWxsLFxuICogdGhpcyBpcyBpcyBhIGNvbnRlbnQgcXVlcnkgYW5kIHRoZSBRdWVyeUxpc3Qgd2lsbCBiZSBzYXZlZCBsYXRlciB0aHJvdWdoIGRpcmVjdGl2ZUNyZWF0ZS5cbiAqIEBwYXJhbSBwcmVkaWNhdGUgVGhlIHR5cGUgZm9yIHdoaWNoIHRoZSBxdWVyeSB3aWxsIHNlYXJjaFxuICogQHBhcmFtIGRlc2NlbmQgV2hldGhlciBvciBub3QgdG8gZGVzY2VuZCBpbnRvIGNoaWxkcmVuXG4gKiBAcGFyYW0gcmVhZCBXaGF0IHRvIHNhdmUgaW4gdGhlIHF1ZXJ5XG4gKiBAcmV0dXJucyBRdWVyeUxpc3Q8VD5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHF1ZXJ5PFQ+KFxuICAgIG1lbW9yeUluZGV4OiBudW1iZXIgfCBudWxsLCBwcmVkaWNhdGU6IFR5cGU8YW55Pnwgc3RyaW5nW10sIGRlc2NlbmQ/OiBib29sZWFuLFxuICAgIHJlYWQ/OiBRdWVyeVJlYWRUeXBlPFQ+fCBUeXBlPFQ+KTogUXVlcnlMaXN0PFQ+IHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydFByZXZpb3VzSXNQYXJlbnQoKTtcbiAgY29uc3QgcXVlcnlMaXN0ID0gbmV3IFF1ZXJ5TGlzdDxUPigpO1xuICBjb25zdCBxdWVyaWVzID0gZ2V0Q3VycmVudFF1ZXJpZXMoTFF1ZXJpZXNfKTtcbiAgcXVlcmllcy50cmFjayhxdWVyeUxpc3QsIHByZWRpY2F0ZSwgZGVzY2VuZCwgcmVhZCk7XG4gIHN0b3JlQ2xlYW51cFdpdGhDb250ZXh0KG51bGwsIHF1ZXJ5TGlzdCwgcXVlcnlMaXN0LmRlc3Ryb3kpO1xuICBpZiAobWVtb3J5SW5kZXggIT0gbnVsbCkge1xuICAgIHN0b3JlKG1lbW9yeUluZGV4LCBxdWVyeUxpc3QpO1xuICB9XG4gIHJldHVybiBxdWVyeUxpc3Q7XG59XG5cbi8qKlxuICogUmVmcmVzaGVzIGEgcXVlcnkgYnkgY29tYmluaW5nIG1hdGNoZXMgZnJvbSBhbGwgYWN0aXZlIHZpZXdzIGFuZCByZW1vdmluZyBtYXRjaGVzIGZyb20gZGVsZXRlZFxuICogdmlld3MuXG4gKiBSZXR1cm5zIHRydWUgaWYgYSBxdWVyeSBnb3QgZGlydHkgZHVyaW5nIGNoYW5nZSBkZXRlY3Rpb24sIGZhbHNlIG90aGVyd2lzZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHF1ZXJ5UmVmcmVzaChxdWVyeUxpc3Q6IFF1ZXJ5TGlzdDxhbnk+KTogYm9vbGVhbiB7XG4gIGNvbnN0IHF1ZXJ5TGlzdEltcGwgPSAocXVlcnlMaXN0IGFzIGFueSBhcyBRdWVyeUxpc3RfPGFueT4pO1xuICBpZiAocXVlcnlMaXN0LmRpcnR5KSB7XG4gICAgcXVlcnlMaXN0LnJlc2V0KHF1ZXJ5TGlzdEltcGwuX3ZhbHVlc1RyZWUpO1xuICAgIHF1ZXJ5TGlzdC5ub3RpZnlPbkNoYW5nZXMoKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG4iXX0=