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
import { store, storeCleanupWithContext } from './instructions';
import { unusedValueExportToPlacateAjd as unused1 } from './interfaces/definition';
import { unusedValueExportToPlacateAjd as unused2 } from './interfaces/injector';
import { unusedValueExportToPlacateAjd as unused3 } from './interfaces/node';
import { unusedValueExportToPlacateAjd as unused4 } from './interfaces/query';
import { TVIEW } from './interfaces/view';
import { assertPreviousIsParent, getOrCreateCurrentQueries, getViewData } from './state';
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
    const defs = currentView[TVIEW].data;
    if (defs) {
        /** @type {?} */
        const flags = tNode.flags;
        /** @type {?} */
        const count = flags & 4095 /* DirectiveCountMask */;
        /** @type {?} */
        const start = flags >> 16 /* DirectiveStartingIndexShift */;
        /** @type {?} */
        const end = start + count;
        for (let i = start; i < end; i++) {
            /** @type {?} */
            const def = /** @type {?} */ (defs[i]);
            if (def.type === type) {
                return i;
            }
        }
    }
    return null;
}
/**
 * @param {?} read
 * @param {?} tNode
 * @param {?} currentView
 * @return {?}
 */
function queryByReadToken(read, tNode, currentView) {
    /** @type {?} */
    const factoryFn = (/** @type {?} */ (read))[NG_ELEMENT_ID];
    if (typeof factoryFn === 'function') {
        return factoryFn();
    }
    else {
        /** @type {?} */
        const matchingIdx = getIdxOfMatchingDirective(tNode, currentView, /** @type {?} */ (read));
        if (matchingIdx !== null) {
            return currentView[matchingIdx];
        }
    }
    return null;
}
/**
 * @param {?} tNode
 * @param {?} currentView
 * @return {?}
 */
function queryByTNodeType(tNode, currentView) {
    if (tNode.type === 3 /* Element */ || tNode.type === 4 /* ElementContainer */) {
        return createElementRef(ViewEngine_ElementRef, tNode, currentView);
    }
    if (tNode.type === 0 /* Container */) {
        return createTemplateRef(ViewEngine_TemplateRef, ViewEngine_ElementRef, tNode, currentView);
    }
    return null;
}
/**
 * @param {?} templateRefToken
 * @param {?} tNode
 * @param {?} currentView
 * @param {?} read
 * @return {?}
 */
function queryByTemplateRef(templateRefToken, tNode, currentView, read) {
    /** @type {?} */
    const templateRefResult = (/** @type {?} */ (templateRefToken))[NG_ELEMENT_ID]();
    if (read) {
        return templateRefResult ? queryByReadToken(read, tNode, currentView) : null;
    }
    return templateRefResult;
}
/**
 * @param {?} tNode
 * @param {?} currentView
 * @param {?} read
 * @param {?} matchingIdx
 * @return {?}
 */
function queryRead(tNode, currentView, read, matchingIdx) {
    if (read) {
        return queryByReadToken(read, tNode, currentView);
    }
    if (matchingIdx > -1) {
        return currentView[matchingIdx];
    }
    // if read token and / or strategy is not specified,
    // detect it using appropriate tNode type
    return queryByTNodeType(tNode, currentView);
}
/**
 * @param {?} query
 * @param {?} tNode
 * @return {?}
 */
function add(query, tNode) {
    /** @type {?} */
    const currentView = getViewData();
    while (query) {
        /** @type {?} */
        const predicate = query.predicate;
        /** @type {?} */
        const type = /** @type {?} */ (predicate.type);
        if (type) {
            /** @type {?} */
            let result = null;
            if (type === ViewEngine_TemplateRef) {
                result = queryByTemplateRef(type, tNode, currentView, predicate.read);
            }
            else {
                /** @type {?} */
                const matchingIdx = getIdxOfMatchingDirective(tNode, currentView, type);
                if (matchingIdx !== null) {
                    result = queryRead(tNode, currentView, predicate.read, matchingIdx);
                }
            }
            if (result !== null) {
                addMatch(query, result);
            }
        }
        else {
            /** @type {?} */
            const selector = /** @type {?} */ ((predicate.selector));
            for (let i = 0; i < selector.length; i++) {
                /** @type {?} */
                const matchingIdx = getIdxOfMatchingSelector(tNode, selector[i]);
                if (matchingIdx !== null) {
                    /** @type {?} */
                    const result = queryRead(tNode, currentView, predicate.read, matchingIdx);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcnkuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3F1ZXJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBWUEsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQzlDLE9BQU8sRUFBQyxVQUFVLElBQUkscUJBQXFCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUUxRSxPQUFPLEVBQUMsV0FBVyxJQUFJLHNCQUFzQixFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFFN0UsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sU0FBUyxDQUFDO0FBRTFDLE9BQU8sRUFBQyxhQUFhLEVBQUUsV0FBVyxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3BELE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDdkMsT0FBTyxFQUFDLEtBQUssRUFBRSx1QkFBdUIsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQzlELE9BQU8sRUFBZSw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUMvRixPQUFPLEVBQUMsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDL0UsT0FBTyxFQUFvRiw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUM5SixPQUFPLEVBQVcsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDdEYsT0FBTyxFQUFZLEtBQUssRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ25ELE9BQU8sRUFBQyxzQkFBc0IsRUFBRSx5QkFBeUIsRUFBRSxXQUFXLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFDdkYsT0FBTyxFQUFDLE9BQU8sRUFBRSxrQkFBa0IsRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUNuRCxPQUFPLEVBQUMsZ0JBQWdCLEVBQUUsaUJBQWlCLEVBQUMs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Yy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8vIFdlIGFyZSB0ZW1wb3JhcmlseSBpbXBvcnRpbmcgdGhlIGV4aXN0aW5nIHZpZXdFbmdpbmVfZnJvbSBjb3JlIHNvIHdlIGNhbiBiZSBzdXJlIHdlIGFyZVxuLy8gY29ycmVjdGx5IGltcGxlbWVudGluZyBpdHMgaW50ZXJmYWNlcyBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkuXG5pbXBvcnQge09ic2VydmFibGV9IGZyb20gJ3J4anMnO1xuXG5pbXBvcnQge0V2ZW50RW1pdHRlcn0gZnJvbSAnLi4vZXZlbnRfZW1pdHRlcic7XG5pbXBvcnQge0VsZW1lbnRSZWYgYXMgVmlld0VuZ2luZV9FbGVtZW50UmVmfSBmcm9tICcuLi9saW5rZXIvZWxlbWVudF9yZWYnO1xuaW1wb3J0IHtRdWVyeUxpc3QgYXMgdmlld0VuZ2luZV9RdWVyeUxpc3R9IGZyb20gJy4uL2xpbmtlci9xdWVyeV9saXN0JztcbmltcG9ydCB7VGVtcGxhdGVSZWYgYXMgVmlld0VuZ2luZV9UZW1wbGF0ZVJlZn0gZnJvbSAnLi4vbGlua2VyL3RlbXBsYXRlX3JlZic7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL3R5cGUnO1xuaW1wb3J0IHtnZXRTeW1ib2xJdGVyYXRvcn0gZnJvbSAnLi4vdXRpbCc7XG5cbmltcG9ydCB7YXNzZXJ0RGVmaW5lZCwgYXNzZXJ0RXF1YWx9IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7TkdfRUxFTUVOVF9JRH0gZnJvbSAnLi9maWVsZHMnO1xuaW1wb3J0IHtzdG9yZSwgc3RvcmVDbGVhbnVwV2l0aENvbnRleHR9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zJztcbmltcG9ydCB7RGlyZWN0aXZlRGVmLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQxfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge3VudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDJ9IGZyb20gJy4vaW50ZXJmYWNlcy9pbmplY3Rvcic7XG5pbXBvcnQge1RDb250YWluZXJOb2RlLCBURWxlbWVudENvbnRhaW5lck5vZGUsIFRFbGVtZW50Tm9kZSwgVE5vZGUsIFROb2RlRmxhZ3MsIFROb2RlVHlwZSwgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkM30gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtMUXVlcmllcywgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkNH0gZnJvbSAnLi9pbnRlcmZhY2VzL3F1ZXJ5JztcbmltcG9ydCB7TFZpZXdEYXRhLCBUVklFV30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHthc3NlcnRQcmV2aW91c0lzUGFyZW50LCBnZXRPckNyZWF0ZUN1cnJlbnRRdWVyaWVzLCBnZXRWaWV3RGF0YX0gZnJvbSAnLi9zdGF0ZSc7XG5pbXBvcnQge2ZsYXR0ZW4sIGlzQ29udGVudFF1ZXJ5SG9zdH0gZnJvbSAnLi91dGlsJztcbmltcG9ydCB7Y3JlYXRlRWxlbWVudFJlZiwgY3JlYXRlVGVtcGxhdGVSZWZ9IGZyb20gJy4vdmlld19lbmdpbmVfY29tcGF0aWJpbGl0eSc7XG5cbmNvbnN0IHVudXNlZFZhbHVlVG9QbGFjYXRlQWpkID0gdW51c2VkMSArIHVudXNlZDIgKyB1bnVzZWQzICsgdW51c2VkNDtcblxuLyoqXG4gKiBBIHByZWRpY2F0ZSB3aGljaCBkZXRlcm1pbmVzIGlmIGEgZ2l2ZW4gZWxlbWVudC9kaXJlY3RpdmUgc2hvdWxkIGJlIGluY2x1ZGVkIGluIHRoZSBxdWVyeVxuICogcmVzdWx0cy5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBRdWVyeVByZWRpY2F0ZTxUPiB7XG4gIC8qKlxuICAgKiBJZiBsb29raW5nIGZvciBkaXJlY3RpdmVzIHRoZW4gaXQgY29udGFpbnMgdGhlIGRpcmVjdGl2ZSB0eXBlLlxuICAgKi9cbiAgdHlwZTogVHlwZTxUPnxudWxsO1xuXG4gIC8qKlxuICAgKiBJZiBzZWxlY3RvciB0aGVuIGNvbnRhaW5zIGxvY2FsIG5hbWVzIHRvIHF1ZXJ5IGZvci5cbiAgICovXG4gIHNlbGVjdG9yOiBzdHJpbmdbXXxudWxsO1xuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgd2hpY2ggdG9rZW4gc2hvdWxkIGJlIHJlYWQgZnJvbSBESSBmb3IgdGhpcyBxdWVyeS5cbiAgICovXG4gIHJlYWQ6IFR5cGU8VD58bnVsbDtcbn1cblxuLyoqXG4gKiBBbiBvYmplY3QgcmVwcmVzZW50aW5nIGEgcXVlcnksIHdoaWNoIGlzIGEgY29tYmluYXRpb24gb2Y6XG4gKiAtIHF1ZXJ5IHByZWRpY2F0ZSB0byBkZXRlcm1pbmVzIGlmIGEgZ2l2ZW4gZWxlbWVudC9kaXJlY3RpdmUgc2hvdWxkIGJlIGluY2x1ZGVkIGluIHRoZSBxdWVyeVxuICogLSB2YWx1ZXMgY29sbGVjdGVkIGJhc2VkIG9uIGEgcHJlZGljYXRlXG4gKiAtIGBRdWVyeUxpc3RgIHRvIHdoaWNoIGNvbGxlY3RlZCB2YWx1ZXMgc2hvdWxkIGJlIHJlcG9ydGVkXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTFF1ZXJ5PFQ+IHtcbiAgLyoqXG4gICAqIE5leHQgcXVlcnkuIFVzZWQgd2hlbiBxdWVyaWVzIGFyZSBzdG9yZWQgYXMgYSBsaW5rZWQgbGlzdCBpbiBgTFF1ZXJpZXNgLlxuICAgKi9cbiAgbmV4dDogTFF1ZXJ5PGFueT58bnVsbDtcblxuICAvKipcbiAgICogRGVzdGluYXRpb24gdG8gd2hpY2ggdGhlIHZhbHVlIHNob3VsZCBiZSBhZGRlZC5cbiAgICovXG4gIGxpc3Q6IFF1ZXJ5TGlzdDxUPjtcblxuICAvKipcbiAgICogQSBwcmVkaWNhdGUgd2hpY2ggZGV0ZXJtaW5lcyBpZiBhIGdpdmVuIGVsZW1lbnQvZGlyZWN0aXZlIHNob3VsZCBiZSBpbmNsdWRlZCBpbiB0aGUgcXVlcnlcbiAgICogcmVzdWx0cy5cbiAgICovXG4gIHByZWRpY2F0ZTogUXVlcnlQcmVkaWNhdGU8VD47XG5cbiAgLyoqXG4gICAqIFZhbHVlcyB3aGljaCBoYXZlIGJlZW4gbG9jYXRlZC5cbiAgICpcbiAgICogVGhpcyBpcyB3aGF0IGJ1aWxkcyB1cCB0aGUgYFF1ZXJ5TGlzdC5fdmFsdWVzVHJlZWAuXG4gICAqL1xuICB2YWx1ZXM6IGFueVtdO1xuXG4gIC8qKlxuICAgKiBBIHBvaW50ZXIgdG8gYW4gYXJyYXkgdGhhdCBzdG9yZXMgY29sbGVjdGVkIHZhbHVlcyBmcm9tIHZpZXdzLiBUaGlzIGlzIG5lY2Vzc2FyeSBzbyB3ZSBrbm93IGFcbiAgICogY29udGFpbmVyIGludG8gd2hpY2ggdG8gaW5zZXJ0IG5vZGVzIGNvbGxlY3RlZCBmcm9tIHZpZXdzLlxuICAgKi9cbiAgY29udGFpbmVyVmFsdWVzOiBhbnlbXXxudWxsO1xufVxuXG5leHBvcnQgY2xhc3MgTFF1ZXJpZXNfIGltcGxlbWVudHMgTFF1ZXJpZXMge1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHB1YmxpYyBwYXJlbnQ6IExRdWVyaWVzX3xudWxsLCBwcml2YXRlIHNoYWxsb3c6IExRdWVyeTxhbnk+fG51bGwsXG4gICAgICBwcml2YXRlIGRlZXA6IExRdWVyeTxhbnk+fG51bGwpIHt9XG5cbiAgdHJhY2s8VD4oXG4gICAgICBxdWVyeUxpc3Q6IHZpZXdFbmdpbmVfUXVlcnlMaXN0PFQ+LCBwcmVkaWNhdGU6IFR5cGU8VD58c3RyaW5nW10sIGRlc2NlbmQ/OiBib29sZWFuLFxuICAgICAgcmVhZD86IFR5cGU8VD4pOiB2b2lkIHtcbiAgICBpZiAoZGVzY2VuZCkge1xuICAgICAgdGhpcy5kZWVwID0gY3JlYXRlUXVlcnkodGhpcy5kZWVwLCBxdWVyeUxpc3QsIHByZWRpY2F0ZSwgcmVhZCAhPSBudWxsID8gcmVhZCA6IG51bGwpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnNoYWxsb3cgPSBjcmVhdGVRdWVyeSh0aGlzLnNoYWxsb3csIHF1ZXJ5TGlzdCwgcHJlZGljYXRlLCByZWFkICE9IG51bGwgPyByZWFkIDogbnVsbCk7XG4gICAgfVxuICB9XG5cbiAgY2xvbmUoKTogTFF1ZXJpZXMgeyByZXR1cm4gbmV3IExRdWVyaWVzXyh0aGlzLCBudWxsLCB0aGlzLmRlZXApOyB9XG5cbiAgY29udGFpbmVyKCk6IExRdWVyaWVzfG51bGwge1xuICAgIGNvbnN0IHNoYWxsb3dSZXN1bHRzID0gY29weVF1ZXJpZXNUb0NvbnRhaW5lcih0aGlzLnNoYWxsb3cpO1xuICAgIGNvbnN0IGRlZXBSZXN1bHRzID0gY29weVF1ZXJpZXNUb0NvbnRhaW5lcih0aGlzLmRlZXApO1xuXG4gICAgcmV0dXJuIHNoYWxsb3dSZXN1bHRzIHx8IGRlZXBSZXN1bHRzID8gbmV3IExRdWVyaWVzXyh0aGlzLCBzaGFsbG93UmVzdWx0cywgZGVlcFJlc3VsdHMpIDogbnVsbDtcbiAgfVxuXG4gIGNyZWF0ZVZpZXcoKTogTFF1ZXJpZXN8bnVsbCB7XG4gICAgY29uc3Qgc2hhbGxvd1Jlc3VsdHMgPSBjb3B5UXVlcmllc1RvVmlldyh0aGlzLnNoYWxsb3cpO1xuICAgIGNvbnN0IGRlZXBSZXN1bHRzID0gY29weVF1ZXJpZXNUb1ZpZXcodGhpcy5kZWVwKTtcblxuICAgIHJldHVybiBzaGFsbG93UmVzdWx0cyB8fCBkZWVwUmVzdWx0cyA/IG5ldyBMUXVlcmllc18odGhpcywgc2hhbGxvd1Jlc3VsdHMsIGRlZXBSZXN1bHRzKSA6IG51bGw7XG4gIH1cblxuICBpbnNlcnRWaWV3KGluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgICBpbnNlcnRWaWV3KGluZGV4LCB0aGlzLnNoYWxsb3cpO1xuICAgIGluc2VydFZpZXcoaW5kZXgsIHRoaXMuZGVlcCk7XG4gIH1cblxuICBhZGROb2RlKHROb2RlOiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlKTogTFF1ZXJpZXN8bnVsbCB7XG4gICAgYWRkKHRoaXMuZGVlcCwgdE5vZGUpO1xuXG4gICAgaWYgKGlzQ29udGVudFF1ZXJ5SG9zdCh0Tm9kZSkpIHtcbiAgICAgIGFkZCh0aGlzLnNoYWxsb3csIHROb2RlKTtcblxuICAgICAgaWYgKHROb2RlLnBhcmVudCAmJiBpc0NvbnRlbnRRdWVyeUhvc3QodE5vZGUucGFyZW50KSkge1xuICAgICAgICAvLyBpZiBub2RlIGhhcyBhIGNvbnRlbnQgcXVlcnkgYW5kIHBhcmVudCBhbHNvIGhhcyBhIGNvbnRlbnQgcXVlcnlcbiAgICAgICAgLy8gYm90aCBxdWVyaWVzIG5lZWQgdG8gY2hlY2sgdGhpcyBub2RlIGZvciBzaGFsbG93IG1hdGNoZXNcbiAgICAgICAgYWRkKHRoaXMucGFyZW50ICEuc2hhbGxvdywgdE5vZGUpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMucGFyZW50O1xuICAgIH1cblxuICAgIGlzUm9vdE5vZGVPZlF1ZXJ5KHROb2RlKSAmJiBhZGQodGhpcy5zaGFsbG93LCB0Tm9kZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICByZW1vdmVWaWV3KCk6IHZvaWQge1xuICAgIHJlbW92ZVZpZXcodGhpcy5zaGFsbG93KTtcbiAgICByZW1vdmVWaWV3KHRoaXMuZGVlcCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNSb290Tm9kZU9mUXVlcnkodE5vZGU6IFROb2RlKSB7XG4gIHJldHVybiB0Tm9kZS5wYXJlbnQgPT09IG51bGwgfHwgaXNDb250ZW50UXVlcnlIb3N0KHROb2RlLnBhcmVudCk7XG59XG5cbmZ1bmN0aW9uIGNvcHlRdWVyaWVzVG9Db250YWluZXIocXVlcnk6IExRdWVyeTxhbnk+fCBudWxsKTogTFF1ZXJ5PGFueT58bnVsbCB7XG4gIGxldCByZXN1bHQ6IExRdWVyeTxhbnk+fG51bGwgPSBudWxsO1xuXG4gIHdoaWxlIChxdWVyeSkge1xuICAgIGNvbnN0IGNvbnRhaW5lclZhbHVlczogYW55W10gPSBbXTsgIC8vIHByZXBhcmUgcm9vbSBmb3Igdmlld3NcbiAgICBxdWVyeS52YWx1ZXMucHVzaChjb250YWluZXJWYWx1ZXMpO1xuICAgIGNvbnN0IGNsb25lZFF1ZXJ5OiBMUXVlcnk8YW55PiA9IHtcbiAgICAgIG5leHQ6IHJlc3VsdCxcbiAgICAgIGxpc3Q6IHF1ZXJ5Lmxpc3QsXG4gICAgICBwcmVkaWNhdGU6IHF1ZXJ5LnByZWRpY2F0ZSxcbiAgICAgIHZhbHVlczogY29udGFpbmVyVmFsdWVzLFxuICAgICAgY29udGFpbmVyVmFsdWVzOiBudWxsXG4gICAgfTtcbiAgICByZXN1bHQgPSBjbG9uZWRRdWVyeTtcbiAgICBxdWVyeSA9IHF1ZXJ5Lm5leHQ7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBjb3B5UXVlcmllc1RvVmlldyhxdWVyeTogTFF1ZXJ5PGFueT58IG51bGwpOiBMUXVlcnk8YW55PnxudWxsIHtcbiAgbGV0IHJlc3VsdDogTFF1ZXJ5PGFueT58bnVsbCA9IG51bGw7XG5cbiAgd2hpbGUgKHF1ZXJ5KSB7XG4gICAgY29uc3QgY2xvbmVkUXVlcnk6IExRdWVyeTxhbnk+ID0ge1xuICAgICAgbmV4dDogcmVzdWx0LFxuICAgICAgbGlzdDogcXVlcnkubGlzdCxcbiAgICAgIHByZWRpY2F0ZTogcXVlcnkucHJlZGljYXRlLFxuICAgICAgdmFsdWVzOiBbXSxcbiAgICAgIGNvbnRhaW5lclZhbHVlczogcXVlcnkudmFsdWVzXG4gICAgfTtcbiAgICByZXN1bHQgPSBjbG9uZWRRdWVyeTtcbiAgICBxdWVyeSA9IHF1ZXJ5Lm5leHQ7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBpbnNlcnRWaWV3KGluZGV4OiBudW1iZXIsIHF1ZXJ5OiBMUXVlcnk8YW55PnwgbnVsbCkge1xuICB3aGlsZSAocXVlcnkpIHtcbiAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgYXNzZXJ0RGVmaW5lZChcbiAgICAgICAgICAgIHF1ZXJ5LmNvbnRhaW5lclZhbHVlcywgJ1ZpZXcgcXVlcmllcyBuZWVkIHRvIGhhdmUgYSBwb2ludGVyIHRvIGNvbnRhaW5lciB2YWx1ZXMuJyk7XG4gICAgcXVlcnkuY29udGFpbmVyVmFsdWVzICEuc3BsaWNlKGluZGV4LCAwLCBxdWVyeS52YWx1ZXMpO1xuICAgIHF1ZXJ5ID0gcXVlcnkubmV4dDtcbiAgfVxufVxuXG5mdW5jdGlvbiByZW1vdmVWaWV3KHF1ZXJ5OiBMUXVlcnk8YW55PnwgbnVsbCkge1xuICB3aGlsZSAocXVlcnkpIHtcbiAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgYXNzZXJ0RGVmaW5lZChcbiAgICAgICAgICAgIHF1ZXJ5LmNvbnRhaW5lclZhbHVlcywgJ1ZpZXcgcXVlcmllcyBuZWVkIHRvIGhhdmUgYSBwb2ludGVyIHRvIGNvbnRhaW5lciB2YWx1ZXMuJyk7XG5cbiAgICBjb25zdCBjb250YWluZXJWYWx1ZXMgPSBxdWVyeS5jb250YWluZXJWYWx1ZXMgITtcbiAgICBjb25zdCB2aWV3VmFsdWVzSWR4ID0gY29udGFpbmVyVmFsdWVzLmluZGV4T2YocXVlcnkudmFsdWVzKTtcbiAgICBjb25zdCByZW1vdmVkID0gY29udGFpbmVyVmFsdWVzLnNwbGljZSh2aWV3VmFsdWVzSWR4LCAxKTtcblxuICAgIC8vIG1hcmsgYSBxdWVyeSBhcyBkaXJ0eSBvbmx5IHdoZW4gcmVtb3ZlZCB2aWV3IGhhZCBtYXRjaGluZyBtb2Rlc1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChyZW1vdmVkLmxlbmd0aCwgMSwgJ3JlbW92ZWQubGVuZ3RoJyk7XG4gICAgaWYgKHJlbW92ZWRbMF0ubGVuZ3RoKSB7XG4gICAgICBxdWVyeS5saXN0LnNldERpcnR5KCk7XG4gICAgfVxuXG4gICAgcXVlcnkgPSBxdWVyeS5uZXh0O1xuICB9XG59XG5cblxuLyoqXG4gKiBJdGVyYXRlcyBvdmVyIGxvY2FsIG5hbWVzIGZvciBhIGdpdmVuIG5vZGUgYW5kIHJldHVybnMgZGlyZWN0aXZlIGluZGV4XG4gKiAob3IgLTEgaWYgYSBsb2NhbCBuYW1lIHBvaW50cyB0byBhbiBlbGVtZW50KS5cbiAqXG4gKiBAcGFyYW0gdE5vZGUgc3RhdGljIGRhdGEgb2YgYSBub2RlIHRvIGNoZWNrXG4gKiBAcGFyYW0gc2VsZWN0b3Igc2VsZWN0b3IgdG8gbWF0Y2hcbiAqIEByZXR1cm5zIGRpcmVjdGl2ZSBpbmRleCwgLTEgb3IgbnVsbCBpZiBhIHNlbGVjdG9yIGRpZG4ndCBtYXRjaCBhbnkgb2YgdGhlIGxvY2FsIG5hbWVzXG4gKi9cbmZ1bmN0aW9uIGdldElkeE9mTWF0Y2hpbmdTZWxlY3Rvcih0Tm9kZTogVE5vZGUsIHNlbGVjdG9yOiBzdHJpbmcpOiBudW1iZXJ8bnVsbCB7XG4gIGNvbnN0IGxvY2FsTmFtZXMgPSB0Tm9kZS5sb2NhbE5hbWVzO1xuICBpZiAobG9jYWxOYW1lcykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbG9jYWxOYW1lcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgaWYgKGxvY2FsTmFtZXNbaV0gPT09IHNlbGVjdG9yKSB7XG4gICAgICAgIHJldHVybiBsb2NhbE5hbWVzW2kgKyAxXSBhcyBudW1iZXI7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIEl0ZXJhdGVzIG92ZXIgYWxsIHRoZSBkaXJlY3RpdmVzIGZvciBhIG5vZGUgYW5kIHJldHVybnMgaW5kZXggb2YgYSBkaXJlY3RpdmUgZm9yIGEgZ2l2ZW4gdHlwZS5cbiAqXG4gKiBAcGFyYW0gdE5vZGUgVE5vZGUgb24gd2hpY2ggZGlyZWN0aXZlcyBhcmUgcHJlc2VudC5cbiAqIEBwYXJhbSBjdXJyZW50VmlldyBUaGUgdmlldyB3ZSBhcmUgY3VycmVudGx5IHByb2Nlc3NpbmdcbiAqIEBwYXJhbSB0eXBlIFR5cGUgb2YgYSBkaXJlY3RpdmUgdG8gbG9vayBmb3IuXG4gKiBAcmV0dXJucyBJbmRleCBvZiBhIGZvdW5kIGRpcmVjdGl2ZSBvciBudWxsIHdoZW4gbm9uZSBmb3VuZC5cbiAqL1xuZnVuY3Rpb24gZ2V0SWR4T2ZNYXRjaGluZ0RpcmVjdGl2ZSh0Tm9kZTogVE5vZGUsIGN1cnJlbnRWaWV3OiBMVmlld0RhdGEsIHR5cGU6IFR5cGU8YW55Pik6IG51bWJlcnxcbiAgICBudWxsIHtcbiAgY29uc3QgZGVmcyA9IGN1cnJlbnRWaWV3W1RWSUVXXS5kYXRhO1xuICBpZiAoZGVmcykge1xuICAgIGNvbnN0IGZsYWdzID0gdE5vZGUuZmxhZ3M7XG4gICAgY29uc3QgY291bnQgPSBmbGFncyAmIFROb2RlRmxhZ3MuRGlyZWN0aXZlQ291bnRNYXNrO1xuICAgIGNvbnN0IHN0YXJ0ID0gZmxhZ3MgPj4gVE5vZGVGbGFncy5EaXJlY3RpdmVTdGFydGluZ0luZGV4U2hpZnQ7XG4gICAgY29uc3QgZW5kID0gc3RhcnQgKyBjb3VudDtcbiAgICBmb3IgKGxldCBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgICAgY29uc3QgZGVmID0gZGVmc1tpXSBhcyBEaXJlY3RpdmVEZWY8YW55PjtcbiAgICAgIGlmIChkZWYudHlwZSA9PT0gdHlwZSkge1xuICAgICAgICByZXR1cm4gaTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8vIFRPRE86IFwicmVhZFwiIHNob3VsZCBiZSBhbiBBYnN0cmFjdFR5cGUgKEZXLTQ4NilcbmZ1bmN0aW9uIHF1ZXJ5QnlSZWFkVG9rZW4ocmVhZDogYW55LCB0Tm9kZTogVE5vZGUsIGN1cnJlbnRWaWV3OiBMVmlld0RhdGEpOiBhbnkge1xuICBjb25zdCBmYWN0b3J5Rm4gPSAocmVhZCBhcyBhbnkpW05HX0VMRU1FTlRfSURdO1xuICBpZiAodHlwZW9mIGZhY3RvcnlGbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBmYWN0b3J5Rm4oKTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBtYXRjaGluZ0lkeCA9IGdldElkeE9mTWF0Y2hpbmdEaXJlY3RpdmUodE5vZGUsIGN1cnJlbnRWaWV3LCByZWFkIGFzIFR5cGU8YW55Pik7XG4gICAgaWYgKG1hdGNoaW5nSWR4ICE9PSBudWxsKSB7XG4gICAgICByZXR1cm4gY3VycmVudFZpZXdbbWF0Y2hpbmdJZHhdO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gcXVlcnlCeVROb2RlVHlwZSh0Tm9kZTogVE5vZGUsIGN1cnJlbnRWaWV3OiBMVmlld0RhdGEpOiBhbnkge1xuICBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQgfHwgdE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpIHtcbiAgICByZXR1cm4gY3JlYXRlRWxlbWVudFJlZihWaWV3RW5naW5lX0VsZW1lbnRSZWYsIHROb2RlLCBjdXJyZW50Vmlldyk7XG4gIH1cbiAgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Db250YWluZXIpIHtcbiAgICByZXR1cm4gY3JlYXRlVGVtcGxhdGVSZWYoVmlld0VuZ2luZV9UZW1wbGF0ZVJlZiwgVmlld0VuZ2luZV9FbGVtZW50UmVmLCB0Tm9kZSwgY3VycmVudFZpZXcpO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBxdWVyeUJ5VGVtcGxhdGVSZWYoXG4gICAgdGVtcGxhdGVSZWZUb2tlbjogVmlld0VuZ2luZV9UZW1wbGF0ZVJlZjxhbnk+LCB0Tm9kZTogVE5vZGUsIGN1cnJlbnRWaWV3OiBMVmlld0RhdGEsXG4gICAgcmVhZDogYW55KTogYW55IHtcbiAgY29uc3QgdGVtcGxhdGVSZWZSZXN1bHQgPSAodGVtcGxhdGVSZWZUb2tlbiBhcyBhbnkpW05HX0VMRU1FTlRfSURdKCk7XG4gIGlmIChyZWFkKSB7XG4gICAgcmV0dXJuIHRlbXBsYXRlUmVmUmVzdWx0ID8gcXVlcnlCeVJlYWRUb2tlbihyZWFkLCB0Tm9kZSwgY3VycmVudFZpZXcpIDogbnVsbDtcbiAgfVxuICByZXR1cm4gdGVtcGxhdGVSZWZSZXN1bHQ7XG59XG5cbmZ1bmN0aW9uIHF1ZXJ5UmVhZCh0Tm9kZTogVE5vZGUsIGN1cnJlbnRWaWV3OiBMVmlld0RhdGEsIHJlYWQ6IGFueSwgbWF0Y2hpbmdJZHg6IG51bWJlcik6IGFueSB7XG4gIGlmIChyZWFkKSB7XG4gICAgcmV0dXJuIHF1ZXJ5QnlSZWFkVG9rZW4ocmVhZCwgdE5vZGUsIGN1cnJlbnRWaWV3KTtcbiAgfVxuICBpZiAobWF0Y2hpbmdJZHggPiAtMSkge1xuICAgIHJldHVybiBjdXJyZW50Vmlld1ttYXRjaGluZ0lkeF07XG4gIH1cbiAgLy8gaWYgcmVhZCB0b2tlbiBhbmQgLyBvciBzdHJhdGVneSBpcyBub3Qgc3BlY2lmaWVkLFxuICAvLyBkZXRlY3QgaXQgdXNpbmcgYXBwcm9wcmlhdGUgdE5vZGUgdHlwZVxuICByZXR1cm4gcXVlcnlCeVROb2RlVHlwZSh0Tm9kZSwgY3VycmVudFZpZXcpO1xufVxuXG5mdW5jdGlvbiBhZGQoXG4gICAgcXVlcnk6IExRdWVyeTxhbnk+fCBudWxsLCB0Tm9kZTogVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGUpIHtcbiAgY29uc3QgY3VycmVudFZpZXcgPSBnZXRWaWV3RGF0YSgpO1xuXG4gIHdoaWxlIChxdWVyeSkge1xuICAgIGNvbnN0IHByZWRpY2F0ZSA9IHF1ZXJ5LnByZWRpY2F0ZTtcbiAgICBjb25zdCB0eXBlID0gcHJlZGljYXRlLnR5cGUgYXMgYW55O1xuICAgIGlmICh0eXBlKSB7XG4gICAgICBsZXQgcmVzdWx0ID0gbnVsbDtcbiAgICAgIGlmICh0eXBlID09PSBWaWV3RW5naW5lX1RlbXBsYXRlUmVmKSB7XG4gICAgICAgIHJlc3VsdCA9IHF1ZXJ5QnlUZW1wbGF0ZVJlZih0eXBlLCB0Tm9kZSwgY3VycmVudFZpZXcsIHByZWRpY2F0ZS5yZWFkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IG1hdGNoaW5nSWR4ID0gZ2V0SWR4T2ZNYXRjaGluZ0RpcmVjdGl2ZSh0Tm9kZSwgY3VycmVudFZpZXcsIHR5cGUpO1xuICAgICAgICBpZiAobWF0Y2hpbmdJZHggIT09IG51bGwpIHtcbiAgICAgICAgICByZXN1bHQgPSBxdWVyeVJlYWQodE5vZGUsIGN1cnJlbnRWaWV3LCBwcmVkaWNhdGUucmVhZCwgbWF0Y2hpbmdJZHgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAocmVzdWx0ICE9PSBudWxsKSB7XG4gICAgICAgIGFkZE1hdGNoKHF1ZXJ5LCByZXN1bHQpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBzZWxlY3RvciA9IHByZWRpY2F0ZS5zZWxlY3RvciAhO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWxlY3Rvci5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBtYXRjaGluZ0lkeCA9IGdldElkeE9mTWF0Y2hpbmdTZWxlY3Rvcih0Tm9kZSwgc2VsZWN0b3JbaV0pO1xuICAgICAgICBpZiAobWF0Y2hpbmdJZHggIT09IG51bGwpIHtcbiAgICAgICAgICBjb25zdCByZXN1bHQgPSBxdWVyeVJlYWQodE5vZGUsIGN1cnJlbnRWaWV3LCBwcmVkaWNhdGUucmVhZCwgbWF0Y2hpbmdJZHgpO1xuICAgICAgICAgIGlmIChyZXN1bHQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIGFkZE1hdGNoKHF1ZXJ5LCByZXN1bHQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBxdWVyeSA9IHF1ZXJ5Lm5leHQ7XG4gIH1cbn1cblxuZnVuY3Rpb24gYWRkTWF0Y2gocXVlcnk6IExRdWVyeTxhbnk+LCBtYXRjaGluZ1ZhbHVlOiBhbnkpOiB2b2lkIHtcbiAgcXVlcnkudmFsdWVzLnB1c2gobWF0Y2hpbmdWYWx1ZSk7XG4gIHF1ZXJ5Lmxpc3Quc2V0RGlydHkoKTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlUHJlZGljYXRlPFQ+KHByZWRpY2F0ZTogVHlwZTxUPnwgc3RyaW5nW10sIHJlYWQ6IFR5cGU8VD58IG51bGwpOiBRdWVyeVByZWRpY2F0ZTxUPiB7XG4gIGNvbnN0IGlzQXJyYXkgPSBBcnJheS5pc0FycmF5KHByZWRpY2F0ZSk7XG4gIHJldHVybiB7XG4gICAgdHlwZTogaXNBcnJheSA/IG51bGwgOiBwcmVkaWNhdGUgYXMgVHlwZTxUPixcbiAgICBzZWxlY3RvcjogaXNBcnJheSA/IHByZWRpY2F0ZSBhcyBzdHJpbmdbXSA6IG51bGwsXG4gICAgcmVhZDogcmVhZFxuICB9O1xufVxuXG5mdW5jdGlvbiBjcmVhdGVRdWVyeTxUPihcbiAgICBwcmV2aW91czogTFF1ZXJ5PGFueT58IG51bGwsIHF1ZXJ5TGlzdDogUXVlcnlMaXN0PFQ+LCBwcmVkaWNhdGU6IFR5cGU8VD58IHN0cmluZ1tdLFxuICAgIHJlYWQ6IFR5cGU8VD58IG51bGwpOiBMUXVlcnk8VD4ge1xuICByZXR1cm4ge1xuICAgIG5leHQ6IHByZXZpb3VzLFxuICAgIGxpc3Q6IHF1ZXJ5TGlzdCxcbiAgICBwcmVkaWNhdGU6IGNyZWF0ZVByZWRpY2F0ZShwcmVkaWNhdGUsIHJlYWQpLFxuICAgIHZhbHVlczogKHF1ZXJ5TGlzdCBhcyBhbnkgYXMgUXVlcnlMaXN0XzxUPikuX3ZhbHVlc1RyZWUsXG4gICAgY29udGFpbmVyVmFsdWVzOiBudWxsXG4gIH07XG59XG5cbmNsYXNzIFF1ZXJ5TGlzdF88VD4vKiBpbXBsZW1lbnRzIHZpZXdFbmdpbmVfUXVlcnlMaXN0PFQ+ICovIHtcbiAgcmVhZG9ubHkgZGlydHkgPSB0cnVlO1xuICByZWFkb25seSBjaGFuZ2VzOiBPYnNlcnZhYmxlPFQ+ID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuICBwcml2YXRlIF92YWx1ZXM6IFRbXSA9IFtdO1xuICAvKiogQGludGVybmFsICovXG4gIF92YWx1ZXNUcmVlOiBhbnlbXSA9IFtdO1xuXG4gIGdldCBsZW5ndGgoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuX3ZhbHVlcy5sZW5ndGg7IH1cblxuICBnZXQgZmlyc3QoKTogVHxudWxsIHtcbiAgICBsZXQgdmFsdWVzID0gdGhpcy5fdmFsdWVzO1xuICAgIHJldHVybiB2YWx1ZXMubGVuZ3RoID8gdmFsdWVzWzBdIDogbnVsbDtcbiAgfVxuXG4gIGdldCBsYXN0KCk6IFR8bnVsbCB7XG4gICAgbGV0IHZhbHVlcyA9IHRoaXMuX3ZhbHVlcztcbiAgICByZXR1cm4gdmFsdWVzLmxlbmd0aCA/IHZhbHVlc1t2YWx1ZXMubGVuZ3RoIC0gMV0gOiBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlZVxuICAgKiBbQXJyYXkubWFwXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9BcnJheS9tYXApXG4gICAqL1xuICBtYXA8VT4oZm46IChpdGVtOiBULCBpbmRleDogbnVtYmVyLCBhcnJheTogVFtdKSA9PiBVKTogVVtdIHsgcmV0dXJuIHRoaXMuX3ZhbHVlcy5tYXAoZm4pOyB9XG5cbiAgLyoqXG4gICAqIFNlZVxuICAgKiBbQXJyYXkuZmlsdGVyXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9BcnJheS9maWx0ZXIpXG4gICAqL1xuICBmaWx0ZXIoZm46IChpdGVtOiBULCBpbmRleDogbnVtYmVyLCBhcnJheTogVFtdKSA9PiBib29sZWFuKTogVFtdIHtcbiAgICByZXR1cm4gdGhpcy5fdmFsdWVzLmZpbHRlcihmbik7XG4gIH1cblxuICAvKipcbiAgICogU2VlXG4gICAqIFtBcnJheS5maW5kXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9BcnJheS9maW5kKVxuICAgKi9cbiAgZmluZChmbjogKGl0ZW06IFQsIGluZGV4OiBudW1iZXIsIGFycmF5OiBUW10pID0+IGJvb2xlYW4pOiBUfHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuX3ZhbHVlcy5maW5kKGZuKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZWVcbiAgICogW0FycmF5LnJlZHVjZV0oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvQXJyYXkvcmVkdWNlKVxuICAgKi9cbiAgcmVkdWNlPFU+KGZuOiAocHJldlZhbHVlOiBVLCBjdXJWYWx1ZTogVCwgY3VySW5kZXg6IG51bWJlciwgYXJyYXk6IFRbXSkgPT4gVSwgaW5pdDogVSk6IFUge1xuICAgIHJldHVybiB0aGlzLl92YWx1ZXMucmVkdWNlKGZuLCBpbml0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZWVcbiAgICogW0FycmF5LmZvckVhY2hdKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0FycmF5L2ZvckVhY2gpXG4gICAqL1xuICBmb3JFYWNoKGZuOiAoaXRlbTogVCwgaW5kZXg6IG51bWJlciwgYXJyYXk6IFRbXSkgPT4gdm9pZCk6IHZvaWQgeyB0aGlzLl92YWx1ZXMuZm9yRWFjaChmbik7IH1cblxuICAvKipcbiAgICogU2VlXG4gICAqIFtBcnJheS5zb21lXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9BcnJheS9zb21lKVxuICAgKi9cbiAgc29tZShmbjogKHZhbHVlOiBULCBpbmRleDogbnVtYmVyLCBhcnJheTogVFtdKSA9PiBib29sZWFuKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX3ZhbHVlcy5zb21lKGZuKTtcbiAgfVxuXG4gIHRvQXJyYXkoKTogVFtdIHsgcmV0dXJuIHRoaXMuX3ZhbHVlcy5zbGljZSgwKTsgfVxuXG4gIFtnZXRTeW1ib2xJdGVyYXRvcigpXSgpOiBJdGVyYXRvcjxUPiB7IHJldHVybiAodGhpcy5fdmFsdWVzIGFzIGFueSlbZ2V0U3ltYm9sSXRlcmF0b3IoKV0oKTsgfVxuXG4gIHRvU3RyaW5nKCk6IHN0cmluZyB7IHJldHVybiB0aGlzLl92YWx1ZXMudG9TdHJpbmcoKTsgfVxuXG4gIHJlc2V0KHJlczogKGFueVtdfFQpW10pOiB2b2lkIHtcbiAgICB0aGlzLl92YWx1ZXMgPSBmbGF0dGVuKHJlcyk7XG4gICAgKHRoaXMgYXN7ZGlydHk6IGJvb2xlYW59KS5kaXJ0eSA9IGZhbHNlO1xuICB9XG5cbiAgbm90aWZ5T25DaGFuZ2VzKCk6IHZvaWQgeyAodGhpcy5jaGFuZ2VzIGFzIEV2ZW50RW1pdHRlcjxhbnk+KS5lbWl0KHRoaXMpOyB9XG4gIHNldERpcnR5KCk6IHZvaWQgeyAodGhpcyBhc3tkaXJ0eTogYm9vbGVhbn0pLmRpcnR5ID0gdHJ1ZTsgfVxuICBkZXN0cm95KCk6IHZvaWQge1xuICAgICh0aGlzLmNoYW5nZXMgYXMgRXZlbnRFbWl0dGVyPGFueT4pLmNvbXBsZXRlKCk7XG4gICAgKHRoaXMuY2hhbmdlcyBhcyBFdmVudEVtaXR0ZXI8YW55PikudW5zdWJzY3JpYmUoKTtcbiAgfVxufVxuXG4vLyBOT1RFOiB0aGlzIGhhY2sgaXMgaGVyZSBiZWNhdXNlIElRdWVyeUxpc3QgaGFzIHByaXZhdGUgbWVtYmVycyBhbmQgdGhlcmVmb3JlXG4vLyBpdCBjYW4ndCBiZSBpbXBsZW1lbnRlZCBvbmx5IGV4dGVuZGVkLlxuZXhwb3J0IHR5cGUgUXVlcnlMaXN0PFQ+ID0gdmlld0VuZ2luZV9RdWVyeUxpc3Q8VD47XG5leHBvcnQgY29uc3QgUXVlcnlMaXN0OiB0eXBlb2Ygdmlld0VuZ2luZV9RdWVyeUxpc3QgPSBRdWVyeUxpc3RfIGFzIGFueTtcblxuLyoqXG4gKiBDcmVhdGVzIGFuZCByZXR1cm5zIGEgUXVlcnlMaXN0LlxuICpcbiAqIEBwYXJhbSBtZW1vcnlJbmRleCBUaGUgaW5kZXggaW4gbWVtb3J5IHdoZXJlIHRoZSBRdWVyeUxpc3Qgc2hvdWxkIGJlIHNhdmVkLiBJZiBudWxsLFxuICogdGhpcyBpcyBpcyBhIGNvbnRlbnQgcXVlcnkgYW5kIHRoZSBRdWVyeUxpc3Qgd2lsbCBiZSBzYXZlZCBsYXRlciB0aHJvdWdoIGRpcmVjdGl2ZUNyZWF0ZS5cbiAqIEBwYXJhbSBwcmVkaWNhdGUgVGhlIHR5cGUgZm9yIHdoaWNoIHRoZSBxdWVyeSB3aWxsIHNlYXJjaFxuICogQHBhcmFtIGRlc2NlbmQgV2hldGhlciBvciBub3QgdG8gZGVzY2VuZCBpbnRvIGNoaWxkcmVuXG4gKiBAcGFyYW0gcmVhZCBXaGF0IHRvIHNhdmUgaW4gdGhlIHF1ZXJ5XG4gKiBAcmV0dXJucyBRdWVyeUxpc3Q8VD5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHF1ZXJ5PFQ+KFxuICAgIG1lbW9yeUluZGV4OiBudW1iZXIgfCBudWxsLCBwcmVkaWNhdGU6IFR5cGU8YW55Pnwgc3RyaW5nW10sIGRlc2NlbmQ/OiBib29sZWFuLFxuICAgIC8vIFRPRE86IFwicmVhZFwiIHNob3VsZCBiZSBhbiBBYnN0cmFjdFR5cGUgKEZXLTQ4NilcbiAgICByZWFkPzogYW55KTogUXVlcnlMaXN0PFQ+IHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydFByZXZpb3VzSXNQYXJlbnQoKTtcbiAgY29uc3QgcXVlcnlMaXN0ID0gbmV3IFF1ZXJ5TGlzdDxUPigpO1xuICBjb25zdCBxdWVyaWVzID0gZ2V0T3JDcmVhdGVDdXJyZW50UXVlcmllcyhMUXVlcmllc18pO1xuICBxdWVyaWVzLnRyYWNrKHF1ZXJ5TGlzdCwgcHJlZGljYXRlLCBkZXNjZW5kLCByZWFkKTtcbiAgc3RvcmVDbGVhbnVwV2l0aENvbnRleHQobnVsbCwgcXVlcnlMaXN0LCBxdWVyeUxpc3QuZGVzdHJveSk7XG4gIGlmIChtZW1vcnlJbmRleCAhPSBudWxsKSB7XG4gICAgc3RvcmUobWVtb3J5SW5kZXgsIHF1ZXJ5TGlzdCk7XG4gIH1cbiAgcmV0dXJuIHF1ZXJ5TGlzdDtcbn1cblxuLyoqXG4gKiBSZWZyZXNoZXMgYSBxdWVyeSBieSBjb21iaW5pbmcgbWF0Y2hlcyBmcm9tIGFsbCBhY3RpdmUgdmlld3MgYW5kIHJlbW92aW5nIG1hdGNoZXMgZnJvbSBkZWxldGVkXG4gKiB2aWV3cy5cbiAqIFJldHVybnMgdHJ1ZSBpZiBhIHF1ZXJ5IGdvdCBkaXJ0eSBkdXJpbmcgY2hhbmdlIGRldGVjdGlvbiwgZmFsc2Ugb3RoZXJ3aXNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcXVlcnlSZWZyZXNoKHF1ZXJ5TGlzdDogUXVlcnlMaXN0PGFueT4pOiBib29sZWFuIHtcbiAgY29uc3QgcXVlcnlMaXN0SW1wbCA9IChxdWVyeUxpc3QgYXMgYW55IGFzIFF1ZXJ5TGlzdF88YW55Pik7XG4gIGlmIChxdWVyeUxpc3QuZGlydHkpIHtcbiAgICBxdWVyeUxpc3QucmVzZXQocXVlcnlMaXN0SW1wbC5fdmFsdWVzVHJlZSk7XG4gICAgcXVlcnlMaXN0Lm5vdGlmeU9uQ2hhbmdlcygpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cbiJdfQ==