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
import { EventEmitter } from '../event_emitter';
import { ElementRef as ViewEngine_ElementRef } from '../linker/element_ref';
import { TemplateRef as ViewEngine_TemplateRef } from '../linker/template_ref';
import { getSymbolIterator } from '../util';
import { assertDefined, assertEqual } from './assert';
import { NG_ELEMENT_ID } from './fields';
import { _getViewData, assertPreviousIsParent, getOrCreateCurrentQueries, store, storeCleanupWithContext } from './instructions';
import { unusedValueExportToPlacateAjd as unused1 } from './interfaces/definition';
import { unusedValueExportToPlacateAjd as unused2 } from './interfaces/injector';
import { unusedValueExportToPlacateAjd as unused3 } from './interfaces/node';
import { unusedValueExportToPlacateAjd as unused4 } from './interfaces/query';
import { DIRECTIVES, TVIEW } from './interfaces/view';
import { flatten, isContentQueryHost } from './util';
import { createElementRef, createTemplateRef } from './view_engine_compatibility';
/** @type {?} */
const unusedValueToPlacateAjd = unused1 + unused2 + unused3 + unused4;
/**
 * A predicate which determines if a given element/directive should be included in the query
 * results.
 * @record
 * @template T
 */
export function QueryPredicate() { }
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
/**
 * An object representing a query, which is a combination of:
 * - query predicate to determines if a given element/directive should be included in the query
 * - values collected based on a predicate
 * - `QueryList` to which collected values should be reported
 * @record
 * @template T
 */
export function LQuery() { }
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
export class LQueries_ {
    /**
     * @param {?} parent
     * @param {?} shallow
     * @param {?} deep
     */
    constructor(parent, shallow, deep) {
        this.parent = parent;
        this.shallow = shallow;
        this.deep = deep;
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
    clone() { return new LQueries_(this, null, this.deep); }
    /**
     * @return {?}
     */
    container() {
        /** @type {?} */
        const shallowResults = copyQueriesToContainer(this.shallow);
        /** @type {?} */
        const deepResults = copyQueriesToContainer(this.deep);
        return shallowResults || deepResults ? new LQueries_(this, shallowResults, deepResults) : null;
    }
    /**
     * @return {?}
     */
    createView() {
        /** @type {?} */
        const shallowResults = copyQueriesToView(this.shallow);
        /** @type {?} */
        const deepResults = copyQueriesToView(this.deep);
        return shallowResults || deepResults ? new LQueries_(this, shallowResults, deepResults) : null;
    }
    /**
     * @param {?} index
     * @return {?}
     */
    insertView(index) {
        insertView(index, this.shallow);
        insertView(index, this.deep);
    }
    /**
     * @param {?} tNode
     * @return {?}
     */
    addNode(tNode) {
        add(this.deep, tNode);
        if (isContentQueryHost(tNode)) {
            add(this.shallow, tNode);
            if (tNode.parent && isContentQueryHost(tNode.parent)) {
                // if node has a content query and parent also has a content query
                // both queries need to check this node for shallow matches
                add(/** @type {?} */ ((this.parent)).shallow, tNode);
            }
            return this.parent;
        }
        isRootNodeOfQuery(tNode) && add(this.shallow, tNode);
        return this;
    }
    /**
     * @return {?}
     */
    removeView() {
        removeView(this.shallow);
        removeView(this.deep);
    }
}
if (false) {
    /** @type {?} */
    LQueries_.prototype.parent;
    /** @type {?} */
    LQueries_.prototype.shallow;
    /** @type {?} */
    LQueries_.prototype.deep;
}
/**
 * @param {?} tNode
 * @return {?}
 */
function isRootNodeOfQuery(tNode) {
    return tNode.parent === null || isContentQueryHost(tNode.parent);
}
/**
 * @param {?} query
 * @return {?}
 */
function copyQueriesToContainer(query) {
    /** @type {?} */
    let result = null;
    while (query) {
        /** @type {?} */
        const containerValues = []; // prepare room for views
        query.values.push(containerValues);
        /** @type {?} */
        const clonedQuery = {
            next: result,
            list: query.list,
            predicate: query.predicate,
            values: containerValues,
            containerValues: null
        };
        result = clonedQuery;
        query = query.next;
    }
    return result;
}
/**
 * @param {?} query
 * @return {?}
 */
function copyQueriesToView(query) {
    /** @type {?} */
    let result = null;
    while (query) {
        /** @type {?} */
        const clonedQuery = {
            next: result,
            list: query.list,
            predicate: query.predicate,
            values: [],
            containerValues: query.values
        };
        result = clonedQuery;
        query = query.next;
    }
    return result;
}
/**
 * @param {?} index
 * @param {?} query
 * @return {?}
 */
function insertView(index, query) {
    while (query) {
        ngDevMode &&
            assertDefined(query.containerValues, 'View queries need to have a pointer to container values.'); /** @type {?} */
        ((query.containerValues)).splice(index, 0, query.values);
        query = query.next;
    }
}
/**
 * @param {?} query
 * @return {?}
 */
function removeView(query) {
    while (query) {
        ngDevMode &&
            assertDefined(query.containerValues, 'View queries need to have a pointer to container values.');
        /** @type {?} */
        const containerValues = /** @type {?} */ ((query.containerValues));
        /** @type {?} */
        const viewValuesIdx = containerValues.indexOf(query.values);
        /** @type {?} */
        const removed = containerValues.splice(viewValuesIdx, 1);
        // mark a query as dirty only when removed view had matching modes
        ngDevMode && assertEqual(removed.length, 1, 'removed.length');
        if (removed[0].length) {
            query.list.setDirty();
        }
        query = query.next;
    }
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
    /** @type {?} */
    const localNames = tNode.localNames;
    if (localNames) {
        for (let i = 0; i < localNames.length; i += 2) {
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
 * @param {?} tNode TNode on which directives are present.
 * @param {?} currentView The view we are currently processing
 * @param {?} type Type of a directive to look for.
 * @return {?} Index of a found directive or null when none found.
 */
function getIdxOfMatchingDirective(tNode, currentView, type) {
    /** @type {?} */
    const defs = currentView[TVIEW].directives;
    if (defs) {
        /** @type {?} */
        const flags = tNode.flags;
        /** @type {?} */
        const count = flags & 4095 /* DirectiveCountMask */;
        /** @type {?} */
        const start = flags >> 15 /* DirectiveStartingIndexShift */;
        /** @type {?} */
        const end = start + count;
        for (let i = start; i < end; i++) {
            /** @type {?} */
            const def = /** @type {?} */ (defs[i]);
            if (def.type === type && def.diPublic) {
                return i;
            }
        }
    }
    return null;
}
/**
 * @param {?} tNode
 * @param {?} currentView
 * @param {?} read
 * @return {?}
 */
function queryRead(tNode, currentView, read) {
    /** @type {?} */
    const factoryFn = (/** @type {?} */ (read))[NG_ELEMENT_ID];
    if (typeof factoryFn === 'function') {
        return factoryFn();
    }
    else {
        /** @type {?} */
        const matchingIdx = getIdxOfMatchingDirective(tNode, currentView, /** @type {?} */ (read));
        if (matchingIdx !== null) {
            return /** @type {?} */ ((currentView[DIRECTIVES]))[matchingIdx];
        }
    }
    return null;
}
/**
 * @param {?} tNode
 * @param {?} currentView
 * @return {?}
 */
function queryReadByTNodeType(tNode, currentView) {
    if (tNode.type === 3 /* Element */ || tNode.type === 4 /* ElementContainer */) {
        return createElementRef(ViewEngine_ElementRef, tNode, currentView);
    }
    if (tNode.type === 0 /* Container */) {
        return createTemplateRef(ViewEngine_TemplateRef, ViewEngine_ElementRef, tNode, currentView);
    }
    return null;
}
/**
 * @param {?} query
 * @param {?} tNode
 * @return {?}
 */
function add(query, tNode) {
    /** @type {?} */
    const currentView = _getViewData();
    while (query) {
        /** @type {?} */
        const predicate = query.predicate;
        /** @type {?} */
        const type = predicate.type;
        if (type) {
            /** @type {?} */
            const result = queryRead(tNode, currentView, predicate.read || type);
            if (result !== null) {
                addMatch(query, result);
            }
        }
        else {
            /** @type {?} */
            const selector = /** @type {?} */ ((predicate.selector));
            for (let i = 0; i < selector.length; i++) {
                /** @type {?} */
                const directiveIdx = getIdxOfMatchingSelector(tNode, selector[i]);
                if (directiveIdx !== null) {
                    /** @type {?} */
                    let result = null;
                    if (predicate.read) {
                        result = queryRead(tNode, currentView, predicate.read);
                    }
                    else {
                        if (directiveIdx > -1) {
                            result = /** @type {?} */ ((currentView[DIRECTIVES]))[directiveIdx];
                        }
                        else {
                            // if read token and / or strategy is not specified,
                            // detect it using appropriate tNode type
                            result = queryReadByTNodeType(tNode, currentView);
                        }
                    }
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
    /** @type {?} */
    const isArray = Array.isArray(predicate);
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
        /** @type {?} */
        let values = this._values;
        return values.length ? values[0] : null;
    }
    /**
     * @return {?}
     */
    get last() {
        /** @type {?} */
        let values = this._values;
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
if (false) {
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
/** @type {?} */
export const QueryList = /** @type {?} */ (QueryList_);
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
export function query(memoryIndex, predicate, descend, 
// TODO: "read" should be an AbstractType (FW-486)
read) {
    ngDevMode && assertPreviousIsParent();
    /** @type {?} */
    const queryList = new QueryList();
    /** @type {?} */
    const queries = getOrCreateCurrentQueries(LQueries_);
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
    /** @type {?} */
    const queryListImpl = (/** @type {?} */ ((queryList)));
    if (queryList.dirty) {
        queryList.reset(queryListImpl._valuesTree);
        queryList.notifyOnChanges();
        return true;
    }
    return false;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3F1ZXJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBWUEsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQzlDLE9BQU8sRUFBQyxVQUFVLElBQUkscUJBQXFCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUUxRSxPQUFPLEVBQUMsV0FBVyxJQUFJLHNCQUFzQixFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFHN0UsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sU0FBUyxDQUFDO0FBRTFDLE9BQU8sRUFBQyxhQUFhLEVBQUUsV0FBVyxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3BELE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDdkMsT0FBTyxFQUFDLFlBQVksRUFBRSxzQkFBc0IsRUFBRSx5QkFBeUIsRUFBRSxLQUFLLEVBQUUsdUJBQXVCLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUMvSCxPQUFPLEVBQXVCLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLHlCQUF5QixDQUFDO0FBQ3ZHLE9BQU8sRUFBQyw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUMvRSxPQUFPLEVBQW9GLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQzlKLE9BQU8sRUFBMEIsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDckcsT0FBTyxFQUFDLFVBQVUsRUFBYSxLQUFLLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUMvRCxPQUFPLEVBQUMsT0FBTyxFQUFFLGtCQUFrQixFQUFDLE1BQU0sUUFBUSxDQUFDO0FBQ25ELE9BQU8sRUFBQyxnQkFBZ0IsRUFBRSxpQkFBaUIsRUFBQyxNQUFN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TyxTQUFTLENBQUM7Q0FDbEI7Ozs7Ozs7O0FBT0QsTUFBTSxVQUFVLFlBQVksQ0FBQyxTQUF5Qjs7SUFDcEQsTUFBTSxhQUFhLEdBQUcsb0JBQUMsU0FBZ0IsR0FBb0IsQ0FBQztJQUM1RCxJQUFJLFNBQVMsQ0FBQyxLQUFLLEVBQUU7UUFDbkIsU0FBUyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDM0MsU0FBUyxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBQzVCLE9BQU8sSUFBSSxDQUFDO0tBQ2I7SUFDRCxPQUFPLEtBQUssQ0FBQztDQUNkIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vLyBXZSBhcmUgdGVtcG9yYXJpbHkgaW1wb3J0aW5nIHRoZSBleGlzdGluZyB2aWV3RW5naW5lX2Zyb20gY29yZSBzbyB3ZSBjYW4gYmUgc3VyZSB3ZSBhcmVcbi8vIGNvcnJlY3RseSBpbXBsZW1lbnRpbmcgaXRzIGludGVyZmFjZXMgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5LlxuaW1wb3J0IHtPYnNlcnZhYmxlfSBmcm9tICdyeGpzJztcblxuaW1wb3J0IHtFdmVudEVtaXR0ZXJ9IGZyb20gJy4uL2V2ZW50X2VtaXR0ZXInO1xuaW1wb3J0IHtFbGVtZW50UmVmIGFzIFZpZXdFbmdpbmVfRWxlbWVudFJlZn0gZnJvbSAnLi4vbGlua2VyL2VsZW1lbnRfcmVmJztcbmltcG9ydCB7UXVlcnlMaXN0IGFzIHZpZXdFbmdpbmVfUXVlcnlMaXN0fSBmcm9tICcuLi9saW5rZXIvcXVlcnlfbGlzdCc7XG5pbXBvcnQge1RlbXBsYXRlUmVmIGFzIFZpZXdFbmdpbmVfVGVtcGxhdGVSZWZ9IGZyb20gJy4uL2xpbmtlci90ZW1wbGF0ZV9yZWYnO1xuaW1wb3J0IHtWaWV3Q29udGFpbmVyUmVmIGFzIFZpZXdFbmdpbmVfVmlld0NvbnRhaW5lclJlZn0gZnJvbSAnLi4vbGlua2VyL3ZpZXdfY29udGFpbmVyX3JlZic7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL3R5cGUnO1xuaW1wb3J0IHtnZXRTeW1ib2xJdGVyYXRvcn0gZnJvbSAnLi4vdXRpbCc7XG5cbmltcG9ydCB7YXNzZXJ0RGVmaW5lZCwgYXNzZXJ0RXF1YWx9IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7TkdfRUxFTUVOVF9JRH0gZnJvbSAnLi9maWVsZHMnO1xuaW1wb3J0IHtfZ2V0Vmlld0RhdGEsIGFzc2VydFByZXZpb3VzSXNQYXJlbnQsIGdldE9yQ3JlYXRlQ3VycmVudFF1ZXJpZXMsIHN0b3JlLCBzdG9yZUNsZWFudXBXaXRoQ29udGV4dH0gZnJvbSAnLi9pbnN0cnVjdGlvbnMnO1xuaW1wb3J0IHtEaXJlY3RpdmVEZWZJbnRlcm5hbCwgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkMX0gZnJvbSAnLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHt1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQyfSBmcm9tICcuL2ludGVyZmFjZXMvaW5qZWN0b3InO1xuaW1wb3J0IHtUQ29udGFpbmVyTm9kZSwgVEVsZW1lbnRDb250YWluZXJOb2RlLCBURWxlbWVudE5vZGUsIFROb2RlLCBUTm9kZUZsYWdzLCBUTm9kZVR5cGUsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDN9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7TFF1ZXJpZXMsIFF1ZXJ5UmVhZFR5cGUsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDR9IGZyb20gJy4vaW50ZXJmYWNlcy9xdWVyeSc7XG5pbXBvcnQge0RJUkVDVElWRVMsIExWaWV3RGF0YSwgVFZJRVd9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7ZmxhdHRlbiwgaXNDb250ZW50UXVlcnlIb3N0fSBmcm9tICcuL3V0aWwnO1xuaW1wb3J0IHtjcmVhdGVFbGVtZW50UmVmLCBjcmVhdGVUZW1wbGF0ZVJlZn0gZnJvbSAnLi92aWV3X2VuZ2luZV9jb21wYXRpYmlsaXR5JztcblxuY29uc3QgdW51c2VkVmFsdWVUb1BsYWNhdGVBamQgPSB1bnVzZWQxICsgdW51c2VkMiArIHVudXNlZDMgKyB1bnVzZWQ0O1xuXG4vKipcbiAqIEEgcHJlZGljYXRlIHdoaWNoIGRldGVybWluZXMgaWYgYSBnaXZlbiBlbGVtZW50L2RpcmVjdGl2ZSBzaG91bGQgYmUgaW5jbHVkZWQgaW4gdGhlIHF1ZXJ5XG4gKiByZXN1bHRzLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFF1ZXJ5UHJlZGljYXRlPFQ+IHtcbiAgLyoqXG4gICAqIElmIGxvb2tpbmcgZm9yIGRpcmVjdGl2ZXMgdGhlbiBpdCBjb250YWlucyB0aGUgZGlyZWN0aXZlIHR5cGUuXG4gICAqL1xuICB0eXBlOiBUeXBlPFQ+fG51bGw7XG5cbiAgLyoqXG4gICAqIElmIHNlbGVjdG9yIHRoZW4gY29udGFpbnMgbG9jYWwgbmFtZXMgdG8gcXVlcnkgZm9yLlxuICAgKi9cbiAgc2VsZWN0b3I6IHN0cmluZ1tdfG51bGw7XG5cbiAgLyoqXG4gICAqIEluZGljYXRlcyB3aGljaCB0b2tlbiBzaG91bGQgYmUgcmVhZCBmcm9tIERJIGZvciB0aGlzIHF1ZXJ5LlxuICAgKi9cbiAgcmVhZDogUXVlcnlSZWFkVHlwZTxUPnxUeXBlPFQ+fG51bGw7XG59XG5cbi8qKlxuICogQW4gb2JqZWN0IHJlcHJlc2VudGluZyBhIHF1ZXJ5LCB3aGljaCBpcyBhIGNvbWJpbmF0aW9uIG9mOlxuICogLSBxdWVyeSBwcmVkaWNhdGUgdG8gZGV0ZXJtaW5lcyBpZiBhIGdpdmVuIGVsZW1lbnQvZGlyZWN0aXZlIHNob3VsZCBiZSBpbmNsdWRlZCBpbiB0aGUgcXVlcnlcbiAqIC0gdmFsdWVzIGNvbGxlY3RlZCBiYXNlZCBvbiBhIHByZWRpY2F0ZVxuICogLSBgUXVlcnlMaXN0YCB0byB3aGljaCBjb2xsZWN0ZWQgdmFsdWVzIHNob3VsZCBiZSByZXBvcnRlZFxuICovXG5leHBvcnQgaW50ZXJmYWNlIExRdWVyeTxUPiB7XG4gIC8qKlxuICAgKiBOZXh0IHF1ZXJ5LiBVc2VkIHdoZW4gcXVlcmllcyBhcmUgc3RvcmVkIGFzIGEgbGlua2VkIGxpc3QgaW4gYExRdWVyaWVzYC5cbiAgICovXG4gIG5leHQ6IExRdWVyeTxhbnk+fG51bGw7XG5cbiAgLyoqXG4gICAqIERlc3RpbmF0aW9uIHRvIHdoaWNoIHRoZSB2YWx1ZSBzaG91bGQgYmUgYWRkZWQuXG4gICAqL1xuICBsaXN0OiBRdWVyeUxpc3Q8VD47XG5cbiAgLyoqXG4gICAqIEEgcHJlZGljYXRlIHdoaWNoIGRldGVybWluZXMgaWYgYSBnaXZlbiBlbGVtZW50L2RpcmVjdGl2ZSBzaG91bGQgYmUgaW5jbHVkZWQgaW4gdGhlIHF1ZXJ5XG4gICAqIHJlc3VsdHMuXG4gICAqL1xuICBwcmVkaWNhdGU6IFF1ZXJ5UHJlZGljYXRlPFQ+O1xuXG4gIC8qKlxuICAgKiBWYWx1ZXMgd2hpY2ggaGF2ZSBiZWVuIGxvY2F0ZWQuXG4gICAqXG4gICAqIFRoaXMgaXMgd2hhdCBidWlsZHMgdXAgdGhlIGBRdWVyeUxpc3QuX3ZhbHVlc1RyZWVgLlxuICAgKi9cbiAgdmFsdWVzOiBhbnlbXTtcblxuICAvKipcbiAgICogQSBwb2ludGVyIHRvIGFuIGFycmF5IHRoYXQgc3RvcmVzIGNvbGxlY3RlZCB2YWx1ZXMgZnJvbSB2aWV3cy4gVGhpcyBpcyBuZWNlc3Nhcnkgc28gd2Uga25vdyBhXG4gICAqIGNvbnRhaW5lciBpbnRvIHdoaWNoIHRvIGluc2VydCBub2RlcyBjb2xsZWN0ZWQgZnJvbSB2aWV3cy5cbiAgICovXG4gIGNvbnRhaW5lclZhbHVlczogYW55W118bnVsbDtcbn1cblxuZXhwb3J0IGNsYXNzIExRdWVyaWVzXyBpbXBsZW1lbnRzIExRdWVyaWVzIHtcbiAgY29uc3RydWN0b3IoXG4gICAgICBwdWJsaWMgcGFyZW50OiBMUXVlcmllc198bnVsbCwgcHJpdmF0ZSBzaGFsbG93OiBMUXVlcnk8YW55PnxudWxsLFxuICAgICAgcHJpdmF0ZSBkZWVwOiBMUXVlcnk8YW55PnxudWxsKSB7fVxuXG4gIHRyYWNrPFQ+KFxuICAgICAgcXVlcnlMaXN0OiB2aWV3RW5naW5lX1F1ZXJ5TGlzdDxUPiwgcHJlZGljYXRlOiBUeXBlPFQ+fHN0cmluZ1tdLCBkZXNjZW5kPzogYm9vbGVhbixcbiAgICAgIHJlYWQ/OiBRdWVyeVJlYWRUeXBlPFQ+fFR5cGU8VD4pOiB2b2lkIHtcbiAgICBpZiAoZGVzY2VuZCkge1xuICAgICAgdGhpcy5kZWVwID0gY3JlYXRlUXVlcnkodGhpcy5kZWVwLCBxdWVyeUxpc3QsIHByZWRpY2F0ZSwgcmVhZCAhPSBudWxsID8gcmVhZCA6IG51bGwpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnNoYWxsb3cgPSBjcmVhdGVRdWVyeSh0aGlzLnNoYWxsb3csIHF1ZXJ5TGlzdCwgcHJlZGljYXRlLCByZWFkICE9IG51bGwgPyByZWFkIDogbnVsbCk7XG4gICAgfVxuICB9XG5cbiAgY2xvbmUoKTogTFF1ZXJpZXMgeyByZXR1cm4gbmV3IExRdWVyaWVzXyh0aGlzLCBudWxsLCB0aGlzLmRlZXApOyB9XG5cbiAgY29udGFpbmVyKCk6IExRdWVyaWVzfG51bGwge1xuICAgIGNvbnN0IHNoYWxsb3dSZXN1bHRzID0gY29weVF1ZXJpZXNUb0NvbnRhaW5lcih0aGlzLnNoYWxsb3cpO1xuICAgIGNvbnN0IGRlZXBSZXN1bHRzID0gY29weVF1ZXJpZXNUb0NvbnRhaW5lcih0aGlzLmRlZXApO1xuXG4gICAgcmV0dXJuIHNoYWxsb3dSZXN1bHRzIHx8IGRlZXBSZXN1bHRzID8gbmV3IExRdWVyaWVzXyh0aGlzLCBzaGFsbG93UmVzdWx0cywgZGVlcFJlc3VsdHMpIDogbnVsbDtcbiAgfVxuXG4gIGNyZWF0ZVZpZXcoKTogTFF1ZXJpZXN8bnVsbCB7XG4gICAgY29uc3Qgc2hhbGxvd1Jlc3VsdHMgPSBjb3B5UXVlcmllc1RvVmlldyh0aGlzLnNoYWxsb3cpO1xuICAgIGNvbnN0IGRlZXBSZXN1bHRzID0gY29weVF1ZXJpZXNUb1ZpZXcodGhpcy5kZWVwKTtcblxuICAgIHJldHVybiBzaGFsbG93UmVzdWx0cyB8fCBkZWVwUmVzdWx0cyA/IG5ldyBMUXVlcmllc18odGhpcywgc2hhbGxvd1Jlc3VsdHMsIGRlZXBSZXN1bHRzKSA6IG51bGw7XG4gIH1cblxuICBpbnNlcnRWaWV3KGluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgICBpbnNlcnRWaWV3KGluZGV4LCB0aGlzLnNoYWxsb3cpO1xuICAgIGluc2VydFZpZXcoaW5kZXgsIHRoaXMuZGVlcCk7XG4gIH1cblxuICBhZGROb2RlKHROb2RlOiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlKTogTFF1ZXJpZXN8bnVsbCB7XG4gICAgYWRkKHRoaXMuZGVlcCwgdE5vZGUpO1xuXG4gICAgaWYgKGlzQ29udGVudFF1ZXJ5SG9zdCh0Tm9kZSkpIHtcbiAgICAgIGFkZCh0aGlzLnNoYWxsb3csIHROb2RlKTtcblxuICAgICAgaWYgKHROb2RlLnBhcmVudCAmJiBpc0NvbnRlbnRRdWVyeUhvc3QodE5vZGUucGFyZW50KSkge1xuICAgICAgICAvLyBpZiBub2RlIGhhcyBhIGNvbnRlbnQgcXVlcnkgYW5kIHBhcmVudCBhbHNvIGhhcyBhIGNvbnRlbnQgcXVlcnlcbiAgICAgICAgLy8gYm90aCBxdWVyaWVzIG5lZWQgdG8gY2hlY2sgdGhpcyBub2RlIGZvciBzaGFsbG93IG1hdGNoZXNcbiAgICAgICAgYWRkKHRoaXMucGFyZW50ICEuc2hhbGxvdywgdE5vZGUpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMucGFyZW50O1xuICAgIH1cblxuICAgIGlzUm9vdE5vZGVPZlF1ZXJ5KHROb2RlKSAmJiBhZGQodGhpcy5zaGFsbG93LCB0Tm9kZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICByZW1vdmVWaWV3KCk6IHZvaWQge1xuICAgIHJlbW92ZVZpZXcodGhpcy5zaGFsbG93KTtcbiAgICByZW1vdmVWaWV3KHRoaXMuZGVlcCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNSb290Tm9kZU9mUXVlcnkodE5vZGU6IFROb2RlKSB7XG4gIHJldHVybiB0Tm9kZS5wYXJlbnQgPT09IG51bGwgfHwgaXNDb250ZW50UXVlcnlIb3N0KHROb2RlLnBhcmVudCk7XG59XG5cbmZ1bmN0aW9uIGNvcHlRdWVyaWVzVG9Db250YWluZXIocXVlcnk6IExRdWVyeTxhbnk+fCBudWxsKTogTFF1ZXJ5PGFueT58bnVsbCB7XG4gIGxldCByZXN1bHQ6IExRdWVyeTxhbnk+fG51bGwgPSBudWxsO1xuXG4gIHdoaWxlIChxdWVyeSkge1xuICAgIGNvbnN0IGNvbnRhaW5lclZhbHVlczogYW55W10gPSBbXTsgIC8vIHByZXBhcmUgcm9vbSBmb3Igdmlld3NcbiAgICBxdWVyeS52YWx1ZXMucHVzaChjb250YWluZXJWYWx1ZXMpO1xuICAgIGNvbnN0IGNsb25lZFF1ZXJ5OiBMUXVlcnk8YW55PiA9IHtcbiAgICAgIG5leHQ6IHJlc3VsdCxcbiAgICAgIGxpc3Q6IHF1ZXJ5Lmxpc3QsXG4gICAgICBwcmVkaWNhdGU6IHF1ZXJ5LnByZWRpY2F0ZSxcbiAgICAgIHZhbHVlczogY29udGFpbmVyVmFsdWVzLFxuICAgICAgY29udGFpbmVyVmFsdWVzOiBudWxsXG4gICAgfTtcbiAgICByZXN1bHQgPSBjbG9uZWRRdWVyeTtcbiAgICBxdWVyeSA9IHF1ZXJ5Lm5leHQ7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBjb3B5UXVlcmllc1RvVmlldyhxdWVyeTogTFF1ZXJ5PGFueT58IG51bGwpOiBMUXVlcnk8YW55PnxudWxsIHtcbiAgbGV0IHJlc3VsdDogTFF1ZXJ5PGFueT58bnVsbCA9IG51bGw7XG5cbiAgd2hpbGUgKHF1ZXJ5KSB7XG4gICAgY29uc3QgY2xvbmVkUXVlcnk6IExRdWVyeTxhbnk+ID0ge1xuICAgICAgbmV4dDogcmVzdWx0LFxuICAgICAgbGlzdDogcXVlcnkubGlzdCxcbiAgICAgIHByZWRpY2F0ZTogcXVlcnkucHJlZGljYXRlLFxuICAgICAgdmFsdWVzOiBbXSxcbiAgICAgIGNvbnRhaW5lclZhbHVlczogcXVlcnkudmFsdWVzXG4gICAgfTtcbiAgICByZXN1bHQgPSBjbG9uZWRRdWVyeTtcbiAgICBxdWVyeSA9IHF1ZXJ5Lm5leHQ7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBpbnNlcnRWaWV3KGluZGV4OiBudW1iZXIsIHF1ZXJ5OiBMUXVlcnk8YW55PnwgbnVsbCkge1xuICB3aGlsZSAocXVlcnkpIHtcbiAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgYXNzZXJ0RGVmaW5lZChcbiAgICAgICAgICAgIHF1ZXJ5LmNvbnRhaW5lclZhbHVlcywgJ1ZpZXcgcXVlcmllcyBuZWVkIHRvIGhhdmUgYSBwb2ludGVyIHRvIGNvbnRhaW5lciB2YWx1ZXMuJyk7XG4gICAgcXVlcnkuY29udGFpbmVyVmFsdWVzICEuc3BsaWNlKGluZGV4LCAwLCBxdWVyeS52YWx1ZXMpO1xuICAgIHF1ZXJ5ID0gcXVlcnkubmV4dDtcbiAgfVxufVxuXG5mdW5jdGlvbiByZW1vdmVWaWV3KHF1ZXJ5OiBMUXVlcnk8YW55PnwgbnVsbCkge1xuICB3aGlsZSAocXVlcnkpIHtcbiAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgYXNzZXJ0RGVmaW5lZChcbiAgICAgICAgICAgIHF1ZXJ5LmNvbnRhaW5lclZhbHVlcywgJ1ZpZXcgcXVlcmllcyBuZWVkIHRvIGhhdmUgYSBwb2ludGVyIHRvIGNvbnRhaW5lciB2YWx1ZXMuJyk7XG5cbiAgICBjb25zdCBjb250YWluZXJWYWx1ZXMgPSBxdWVyeS5jb250YWluZXJWYWx1ZXMgITtcbiAgICBjb25zdCB2aWV3VmFsdWVzSWR4ID0gY29udGFpbmVyVmFsdWVzLmluZGV4T2YocXVlcnkudmFsdWVzKTtcbiAgICBjb25zdCByZW1vdmVkID0gY29udGFpbmVyVmFsdWVzLnNwbGljZSh2aWV3VmFsdWVzSWR4LCAxKTtcblxuICAgIC8vIG1hcmsgYSBxdWVyeSBhcyBkaXJ0eSBvbmx5IHdoZW4gcmVtb3ZlZCB2aWV3IGhhZCBtYXRjaGluZyBtb2Rlc1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChyZW1vdmVkLmxlbmd0aCwgMSwgJ3JlbW92ZWQubGVuZ3RoJyk7XG4gICAgaWYgKHJlbW92ZWRbMF0ubGVuZ3RoKSB7XG4gICAgICBxdWVyeS5saXN0LnNldERpcnR5KCk7XG4gICAgfVxuXG4gICAgcXVlcnkgPSBxdWVyeS5uZXh0O1xuICB9XG59XG5cblxuLyoqXG4gKiBJdGVyYXRlcyBvdmVyIGxvY2FsIG5hbWVzIGZvciBhIGdpdmVuIG5vZGUgYW5kIHJldHVybnMgZGlyZWN0aXZlIGluZGV4XG4gKiAob3IgLTEgaWYgYSBsb2NhbCBuYW1lIHBvaW50cyB0byBhbiBlbGVtZW50KS5cbiAqXG4gKiBAcGFyYW0gdE5vZGUgc3RhdGljIGRhdGEgb2YgYSBub2RlIHRvIGNoZWNrXG4gKiBAcGFyYW0gc2VsZWN0b3Igc2VsZWN0b3IgdG8gbWF0Y2hcbiAqIEByZXR1cm5zIGRpcmVjdGl2ZSBpbmRleCwgLTEgb3IgbnVsbCBpZiBhIHNlbGVjdG9yIGRpZG4ndCBtYXRjaCBhbnkgb2YgdGhlIGxvY2FsIG5hbWVzXG4gKi9cbmZ1bmN0aW9uIGdldElkeE9mTWF0Y2hpbmdTZWxlY3Rvcih0Tm9kZTogVE5vZGUsIHNlbGVjdG9yOiBzdHJpbmcpOiBudW1iZXJ8bnVsbCB7XG4gIGNvbnN0IGxvY2FsTmFtZXMgPSB0Tm9kZS5sb2NhbE5hbWVzO1xuICBpZiAobG9jYWxOYW1lcykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbG9jYWxOYW1lcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgaWYgKGxvY2FsTmFtZXNbaV0gPT09IHNlbGVjdG9yKSB7XG4gICAgICAgIHJldHVybiBsb2NhbE5hbWVzW2kgKyAxXSBhcyBudW1iZXI7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIEl0ZXJhdGVzIG92ZXIgYWxsIHRoZSBkaXJlY3RpdmVzIGZvciBhIG5vZGUgYW5kIHJldHVybnMgaW5kZXggb2YgYSBkaXJlY3RpdmUgZm9yIGEgZ2l2ZW4gdHlwZS5cbiAqXG4gKiBAcGFyYW0gdE5vZGUgVE5vZGUgb24gd2hpY2ggZGlyZWN0aXZlcyBhcmUgcHJlc2VudC5cbiAqIEBwYXJhbSBjdXJyZW50VmlldyBUaGUgdmlldyB3ZSBhcmUgY3VycmVudGx5IHByb2Nlc3NpbmdcbiAqIEBwYXJhbSB0eXBlIFR5cGUgb2YgYSBkaXJlY3RpdmUgdG8gbG9vayBmb3IuXG4gKiBAcmV0dXJucyBJbmRleCBvZiBhIGZvdW5kIGRpcmVjdGl2ZSBvciBudWxsIHdoZW4gbm9uZSBmb3VuZC5cbiAqL1xuZnVuY3Rpb24gZ2V0SWR4T2ZNYXRjaGluZ0RpcmVjdGl2ZSh0Tm9kZTogVE5vZGUsIGN1cnJlbnRWaWV3OiBMVmlld0RhdGEsIHR5cGU6IFR5cGU8YW55Pik6IG51bWJlcnxcbiAgICBudWxsIHtcbiAgY29uc3QgZGVmcyA9IGN1cnJlbnRWaWV3W1RWSUVXXS5kaXJlY3RpdmVzO1xuICBpZiAoZGVmcykge1xuICAgIGNvbnN0IGZsYWdzID0gdE5vZGUuZmxhZ3M7XG4gICAgY29uc3QgY291bnQgPSBmbGFncyAmIFROb2RlRmxhZ3MuRGlyZWN0aXZlQ291bnRNYXNrO1xuICAgIGNvbnN0IHN0YXJ0ID0gZmxhZ3MgPj4gVE5vZGVGbGFncy5EaXJlY3RpdmVTdGFydGluZ0luZGV4U2hpZnQ7XG4gICAgY29uc3QgZW5kID0gc3RhcnQgKyBjb3VudDtcbiAgICBmb3IgKGxldCBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgICAgY29uc3QgZGVmID0gZGVmc1tpXSBhcyBEaXJlY3RpdmVEZWZJbnRlcm5hbDxhbnk+O1xuICAgICAgaWYgKGRlZi50eXBlID09PSB0eXBlICYmIGRlZi5kaVB1YmxpYykge1xuICAgICAgICByZXR1cm4gaTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8vIFRPRE86IFwicmVhZFwiIHNob3VsZCBiZSBhbiBBYnN0cmFjdFR5cGUgKEZXLTQ4NilcbmZ1bmN0aW9uIHF1ZXJ5UmVhZCh0Tm9kZTogVE5vZGUsIGN1cnJlbnRWaWV3OiBMVmlld0RhdGEsIHJlYWQ6IGFueSk6IGFueSB7XG4gIGNvbnN0IGZhY3RvcnlGbiA9IChyZWFkIGFzIGFueSlbTkdfRUxFTUVOVF9JRF07XG4gIGlmICh0eXBlb2YgZmFjdG9yeUZuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIGZhY3RvcnlGbigpO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IG1hdGNoaW5nSWR4ID0gZ2V0SWR4T2ZNYXRjaGluZ0RpcmVjdGl2ZSh0Tm9kZSwgY3VycmVudFZpZXcsIHJlYWQgYXMgVHlwZTxhbnk+KTtcbiAgICBpZiAobWF0Y2hpbmdJZHggIT09IG51bGwpIHtcbiAgICAgIHJldHVybiBjdXJyZW50Vmlld1tESVJFQ1RJVkVTXSAhW21hdGNoaW5nSWR4XTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIHF1ZXJ5UmVhZEJ5VE5vZGVUeXBlKHROb2RlOiBUTm9kZSwgY3VycmVudFZpZXc6IExWaWV3RGF0YSk6IGFueSB7XG4gIGlmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCB8fCB0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcikge1xuICAgIHJldHVybiBjcmVhdGVFbGVtZW50UmVmKFZpZXdFbmdpbmVfRWxlbWVudFJlZiwgdE5vZGUsIGN1cnJlbnRWaWV3KTtcbiAgfVxuICBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgIHJldHVybiBjcmVhdGVUZW1wbGF0ZVJlZihWaWV3RW5naW5lX1RlbXBsYXRlUmVmLCBWaWV3RW5naW5lX0VsZW1lbnRSZWYsIHROb2RlLCBjdXJyZW50Vmlldyk7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIGFkZChcbiAgICBxdWVyeTogTFF1ZXJ5PGFueT58IG51bGwsIHROb2RlOiBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSkge1xuICBjb25zdCBjdXJyZW50VmlldyA9IF9nZXRWaWV3RGF0YSgpO1xuXG4gIHdoaWxlIChxdWVyeSkge1xuICAgIGNvbnN0IHByZWRpY2F0ZSA9IHF1ZXJ5LnByZWRpY2F0ZTtcbiAgICBjb25zdCB0eXBlID0gcHJlZGljYXRlLnR5cGU7XG4gICAgaWYgKHR5cGUpIHtcbiAgICAgIC8vIGlmIHJlYWQgdG9rZW4gYW5kIC8gb3Igc3RyYXRlZ3kgaXMgbm90IHNwZWNpZmllZCwgdXNlIHR5cGUgYXMgcmVhZCB0b2tlblxuICAgICAgY29uc3QgcmVzdWx0ID0gcXVlcnlSZWFkKHROb2RlLCBjdXJyZW50VmlldywgcHJlZGljYXRlLnJlYWQgfHwgdHlwZSk7XG4gICAgICBpZiAocmVzdWx0ICE9PSBudWxsKSB7XG4gICAgICAgIGFkZE1hdGNoKHF1ZXJ5LCByZXN1bHQpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBzZWxlY3RvciA9IHByZWRpY2F0ZS5zZWxlY3RvciAhO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWxlY3Rvci5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBkaXJlY3RpdmVJZHggPSBnZXRJZHhPZk1hdGNoaW5nU2VsZWN0b3IodE5vZGUsIHNlbGVjdG9yW2ldKTtcbiAgICAgICAgaWYgKGRpcmVjdGl2ZUlkeCAhPT0gbnVsbCkge1xuICAgICAgICAgIGxldCByZXN1bHQ6IGFueSA9IG51bGw7XG4gICAgICAgICAgaWYgKHByZWRpY2F0ZS5yZWFkKSB7XG4gICAgICAgICAgICByZXN1bHQgPSBxdWVyeVJlYWQodE5vZGUsIGN1cnJlbnRWaWV3LCBwcmVkaWNhdGUucmVhZCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChkaXJlY3RpdmVJZHggPiAtMSkge1xuICAgICAgICAgICAgICByZXN1bHQgPSBjdXJyZW50Vmlld1tESVJFQ1RJVkVTXSAhW2RpcmVjdGl2ZUlkeF07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAvLyBpZiByZWFkIHRva2VuIGFuZCAvIG9yIHN0cmF0ZWd5IGlzIG5vdCBzcGVjaWZpZWQsXG4gICAgICAgICAgICAgIC8vIGRldGVjdCBpdCB1c2luZyBhcHByb3ByaWF0ZSB0Tm9kZSB0eXBlXG4gICAgICAgICAgICAgIHJlc3VsdCA9IHF1ZXJ5UmVhZEJ5VE5vZGVUeXBlKHROb2RlLCBjdXJyZW50Vmlldyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHJlc3VsdCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgYWRkTWF0Y2gocXVlcnksIHJlc3VsdCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHF1ZXJ5ID0gcXVlcnkubmV4dDtcbiAgfVxufVxuXG5mdW5jdGlvbiBhZGRNYXRjaChxdWVyeTogTFF1ZXJ5PGFueT4sIG1hdGNoaW5nVmFsdWU6IGFueSk6IHZvaWQge1xuICBxdWVyeS52YWx1ZXMucHVzaChtYXRjaGluZ1ZhbHVlKTtcbiAgcXVlcnkubGlzdC5zZXREaXJ0eSgpO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVQcmVkaWNhdGU8VD4oXG4gICAgcHJlZGljYXRlOiBUeXBlPFQ+fCBzdHJpbmdbXSwgcmVhZDogUXVlcnlSZWFkVHlwZTxUPnwgVHlwZTxUPnwgbnVsbCk6IFF1ZXJ5UHJlZGljYXRlPFQ+IHtcbiAgY29uc3QgaXNBcnJheSA9IEFycmF5LmlzQXJyYXkocHJlZGljYXRlKTtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBpc0FycmF5ID8gbnVsbCA6IHByZWRpY2F0ZSBhcyBUeXBlPFQ+LFxuICAgIHNlbGVjdG9yOiBpc0FycmF5ID8gcHJlZGljYXRlIGFzIHN0cmluZ1tdIDogbnVsbCxcbiAgICByZWFkOiByZWFkXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVF1ZXJ5PFQ+KFxuICAgIHByZXZpb3VzOiBMUXVlcnk8YW55PnwgbnVsbCwgcXVlcnlMaXN0OiBRdWVyeUxpc3Q8VD4sIHByZWRpY2F0ZTogVHlwZTxUPnwgc3RyaW5nW10sXG4gICAgcmVhZDogUXVlcnlSZWFkVHlwZTxUPnwgVHlwZTxUPnwgbnVsbCk6IExRdWVyeTxUPiB7XG4gIHJldHVybiB7XG4gICAgbmV4dDogcHJldmlvdXMsXG4gICAgbGlzdDogcXVlcnlMaXN0LFxuICAgIHByZWRpY2F0ZTogY3JlYXRlUHJlZGljYXRlKHByZWRpY2F0ZSwgcmVhZCksXG4gICAgdmFsdWVzOiAocXVlcnlMaXN0IGFzIGFueSBhcyBRdWVyeUxpc3RfPFQ+KS5fdmFsdWVzVHJlZSxcbiAgICBjb250YWluZXJWYWx1ZXM6IG51bGxcbiAgfTtcbn1cblxuY2xhc3MgUXVlcnlMaXN0XzxUPi8qIGltcGxlbWVudHMgdmlld0VuZ2luZV9RdWVyeUxpc3Q8VD4gKi8ge1xuICByZWFkb25seSBkaXJ0eSA9IHRydWU7XG4gIHJlYWRvbmx5IGNoYW5nZXM6IE9ic2VydmFibGU8VD4gPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gIHByaXZhdGUgX3ZhbHVlczogVFtdID0gW107XG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX3ZhbHVlc1RyZWU6IGFueVtdID0gW107XG5cbiAgZ2V0IGxlbmd0aCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5fdmFsdWVzLmxlbmd0aDsgfVxuXG4gIGdldCBmaXJzdCgpOiBUfG51bGwge1xuICAgIGxldCB2YWx1ZXMgPSB0aGlzLl92YWx1ZXM7XG4gICAgcmV0dXJuIHZhbHVlcy5sZW5ndGggPyB2YWx1ZXNbMF0gOiBudWxsO1xuICB9XG5cbiAgZ2V0IGxhc3QoKTogVHxudWxsIHtcbiAgICBsZXQgdmFsdWVzID0gdGhpcy5fdmFsdWVzO1xuICAgIHJldHVybiB2YWx1ZXMubGVuZ3RoID8gdmFsdWVzW3ZhbHVlcy5sZW5ndGggLSAxXSA6IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogU2VlXG4gICAqIFtBcnJheS5tYXBdKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0FycmF5L21hcClcbiAgICovXG4gIG1hcDxVPihmbjogKGl0ZW06IFQsIGluZGV4OiBudW1iZXIsIGFycmF5OiBUW10pID0+IFUpOiBVW10geyByZXR1cm4gdGhpcy5fdmFsdWVzLm1hcChmbik7IH1cblxuICAvKipcbiAgICogU2VlXG4gICAqIFtBcnJheS5maWx0ZXJdKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0FycmF5L2ZpbHRlcilcbiAgICovXG4gIGZpbHRlcihmbjogKGl0ZW06IFQsIGluZGV4OiBudW1iZXIsIGFycmF5OiBUW10pID0+IGJvb2xlYW4pOiBUW10ge1xuICAgIHJldHVybiB0aGlzLl92YWx1ZXMuZmlsdGVyKGZuKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZWVcbiAgICogW0FycmF5LmZpbmRdKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0FycmF5L2ZpbmQpXG4gICAqL1xuICBmaW5kKGZuOiAoaXRlbTogVCwgaW5kZXg6IG51bWJlciwgYXJyYXk6IFRbXSkgPT4gYm9vbGVhbik6IFR8dW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5fdmFsdWVzLmZpbmQoZm4pO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlZVxuICAgKiBbQXJyYXkucmVkdWNlXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9BcnJheS9yZWR1Y2UpXG4gICAqL1xuICByZWR1Y2U8VT4oZm46IChwcmV2VmFsdWU6IFUsIGN1clZhbHVlOiBULCBjdXJJbmRleDogbnVtYmVyLCBhcnJheTogVFtdKSA9PiBVLCBpbml0OiBVKTogVSB7XG4gICAgcmV0dXJuIHRoaXMuX3ZhbHVlcy5yZWR1Y2UoZm4sIGluaXQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlZVxuICAgKiBbQXJyYXkuZm9yRWFjaF0oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvQXJyYXkvZm9yRWFjaClcbiAgICovXG4gIGZvckVhY2goZm46IChpdGVtOiBULCBpbmRleDogbnVtYmVyLCBhcnJheTogVFtdKSA9PiB2b2lkKTogdm9pZCB7IHRoaXMuX3ZhbHVlcy5mb3JFYWNoKGZuKTsgfVxuXG4gIC8qKlxuICAgKiBTZWVcbiAgICogW0FycmF5LnNvbWVdKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0FycmF5L3NvbWUpXG4gICAqL1xuICBzb21lKGZuOiAodmFsdWU6IFQsIGluZGV4OiBudW1iZXIsIGFycmF5OiBUW10pID0+IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fdmFsdWVzLnNvbWUoZm4pO1xuICB9XG5cbiAgdG9BcnJheSgpOiBUW10geyByZXR1cm4gdGhpcy5fdmFsdWVzLnNsaWNlKDApOyB9XG5cbiAgW2dldFN5bWJvbEl0ZXJhdG9yKCldKCk6IEl0ZXJhdG9yPFQ+IHsgcmV0dXJuICh0aGlzLl92YWx1ZXMgYXMgYW55KVtnZXRTeW1ib2xJdGVyYXRvcigpXSgpOyB9XG5cbiAgdG9TdHJpbmcoKTogc3RyaW5nIHsgcmV0dXJuIHRoaXMuX3ZhbHVlcy50b1N0cmluZygpOyB9XG5cbiAgcmVzZXQocmVzOiAoYW55W118VClbXSk6IHZvaWQge1xuICAgIHRoaXMuX3ZhbHVlcyA9IGZsYXR0ZW4ocmVzKTtcbiAgICAodGhpcyBhc3tkaXJ0eTogYm9vbGVhbn0pLmRpcnR5ID0gZmFsc2U7XG4gIH1cblxuICBub3RpZnlPbkNoYW5nZXMoKTogdm9pZCB7ICh0aGlzLmNoYW5nZXMgYXMgRXZlbnRFbWl0dGVyPGFueT4pLmVtaXQodGhpcyk7IH1cbiAgc2V0RGlydHkoKTogdm9pZCB7ICh0aGlzIGFze2RpcnR5OiBib29sZWFufSkuZGlydHkgPSB0cnVlOyB9XG4gIGRlc3Ryb3koKTogdm9pZCB7XG4gICAgKHRoaXMuY2hhbmdlcyBhcyBFdmVudEVtaXR0ZXI8YW55PikuY29tcGxldGUoKTtcbiAgICAodGhpcy5jaGFuZ2VzIGFzIEV2ZW50RW1pdHRlcjxhbnk+KS51bnN1YnNjcmliZSgpO1xuICB9XG59XG5cbi8vIE5PVEU6IHRoaXMgaGFjayBpcyBoZXJlIGJlY2F1c2UgSVF1ZXJ5TGlzdCBoYXMgcHJpdmF0ZSBtZW1iZXJzIGFuZCB0aGVyZWZvcmVcbi8vIGl0IGNhbid0IGJlIGltcGxlbWVudGVkIG9ubHkgZXh0ZW5kZWQuXG5leHBvcnQgdHlwZSBRdWVyeUxpc3Q8VD4gPSB2aWV3RW5naW5lX1F1ZXJ5TGlzdDxUPjtcbmV4cG9ydCBjb25zdCBRdWVyeUxpc3Q6IHR5cGVvZiB2aWV3RW5naW5lX1F1ZXJ5TGlzdCA9IFF1ZXJ5TGlzdF8gYXMgYW55O1xuXG4vKipcbiAqIENyZWF0ZXMgYW5kIHJldHVybnMgYSBRdWVyeUxpc3QuXG4gKlxuICogQHBhcmFtIG1lbW9yeUluZGV4IFRoZSBpbmRleCBpbiBtZW1vcnkgd2hlcmUgdGhlIFF1ZXJ5TGlzdCBzaG91bGQgYmUgc2F2ZWQuIElmIG51bGwsXG4gKiB0aGlzIGlzIGlzIGEgY29udGVudCBxdWVyeSBhbmQgdGhlIFF1ZXJ5TGlzdCB3aWxsIGJlIHNhdmVkIGxhdGVyIHRocm91Z2ggZGlyZWN0aXZlQ3JlYXRlLlxuICogQHBhcmFtIHByZWRpY2F0ZSBUaGUgdHlwZSBmb3Igd2hpY2ggdGhlIHF1ZXJ5IHdpbGwgc2VhcmNoXG4gKiBAcGFyYW0gZGVzY2VuZCBXaGV0aGVyIG9yIG5vdCB0byBkZXNjZW5kIGludG8gY2hpbGRyZW5cbiAqIEBwYXJhbSByZWFkIFdoYXQgdG8gc2F2ZSBpbiB0aGUgcXVlcnlcbiAqIEByZXR1cm5zIFF1ZXJ5TGlzdDxUPlxuICovXG5leHBvcnQgZnVuY3Rpb24gcXVlcnk8VD4oXG4gICAgbWVtb3J5SW5kZXg6IG51bWJlciB8IG51bGwsIHByZWRpY2F0ZTogVHlwZTxhbnk+fCBzdHJpbmdbXSwgZGVzY2VuZD86IGJvb2xlYW4sXG4gICAgLy8gVE9ETzogXCJyZWFkXCIgc2hvdWxkIGJlIGFuIEFic3RyYWN0VHlwZSAoRlctNDg2KVxuICAgIHJlYWQ/OiBhbnkpOiBRdWVyeUxpc3Q8VD4ge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0UHJldmlvdXNJc1BhcmVudCgpO1xuICBjb25zdCBxdWVyeUxpc3QgPSBuZXcgUXVlcnlMaXN0PFQ+KCk7XG4gIGNvbnN0IHF1ZXJpZXMgPSBnZXRPckNyZWF0ZUN1cnJlbnRRdWVyaWVzKExRdWVyaWVzXyk7XG4gIHF1ZXJpZXMudHJhY2socXVlcnlMaXN0LCBwcmVkaWNhdGUsIGRlc2NlbmQsIHJlYWQpO1xuICBzdG9yZUNsZWFudXBXaXRoQ29udGV4dChudWxsLCBxdWVyeUxpc3QsIHF1ZXJ5TGlzdC5kZXN0cm95KTtcbiAgaWYgKG1lbW9yeUluZGV4ICE9IG51bGwpIHtcbiAgICBzdG9yZShtZW1vcnlJbmRleCwgcXVlcnlMaXN0KTtcbiAgfVxuICByZXR1cm4gcXVlcnlMaXN0O1xufVxuXG4vKipcbiAqIFJlZnJlc2hlcyBhIHF1ZXJ5IGJ5IGNvbWJpbmluZyBtYXRjaGVzIGZyb20gYWxsIGFjdGl2ZSB2aWV3cyBhbmQgcmVtb3ZpbmcgbWF0Y2hlcyBmcm9tIGRlbGV0ZWRcbiAqIHZpZXdzLlxuICogUmV0dXJucyB0cnVlIGlmIGEgcXVlcnkgZ290IGRpcnR5IGR1cmluZyBjaGFuZ2UgZGV0ZWN0aW9uLCBmYWxzZSBvdGhlcndpc2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBxdWVyeVJlZnJlc2gocXVlcnlMaXN0OiBRdWVyeUxpc3Q8YW55Pik6IGJvb2xlYW4ge1xuICBjb25zdCBxdWVyeUxpc3RJbXBsID0gKHF1ZXJ5TGlzdCBhcyBhbnkgYXMgUXVlcnlMaXN0Xzxhbnk+KTtcbiAgaWYgKHF1ZXJ5TGlzdC5kaXJ0eSkge1xuICAgIHF1ZXJ5TGlzdC5yZXNldChxdWVyeUxpc3RJbXBsLl92YWx1ZXNUcmVlKTtcbiAgICBxdWVyeUxpc3Qubm90aWZ5T25DaGFuZ2VzKCk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufSJdfQ==